import React, { useState, useEffect, useContext } from 'react';
import { Button, Input, message, Spin, Tooltip } from 'antd';
import { CheckCircle2 } from 'lucide-react';
import { getKpi2CalculatorById, updateKpi2Calculator } from '../../apis/kpi2CalculatorService.jsx';
import { aiGen } from '../../apis/botService.jsx';
import { createSetting, getSettingByType, updateSetting } from '../../apis/settingService.jsx';
import { MODEL_AI_LIST } from '../../CONST.js';
import { MyContext } from '../../MyContext.jsx';
import KPI2ContentView from '../Canvas/CanvasFolder/KPI2Calculator/KPI2ContentView.jsx';

const KPIViewWithDescription = ({ selectedKpiId, showChart = true, onDescriptionUpdate }) => {
	const [selectedKpi, setSelectedKpi] = useState(null);
	const [loading, setLoading] = useState(false);
	const [systemMessage0, setSystemMessage0] = useState('');
	const [model0, setModel0] = useState(MODEL_AI_LIST[0].value);
	const { currentUser } = useContext(MyContext);

	useEffect(() => {
		loadSystemMessage0();
		loadModel0();
		loadKpiData();
	}, [selectedKpiId]);

	const loadKpiData = async () => {
		if (!selectedKpiId) return;
		
		try {
			const kpi = await getKpi2CalculatorById(selectedKpiId);
			setSelectedKpi(kpi);
		} catch (error) {
			console.error('Error loading KPI data:', error);
			message.error('Lỗi khi tải dữ liệu KPI');
		}
	};

	const loadModel0 = async () => {
		try {
			const model = await getSettingByType('MODEL_AI_0');
			if (model) {
				setModel0(model.setting);
			}
		} catch (error) {
			console.error('Error loading model 0:', error);
		}
	};

	const saveModel0 = async (value) => {
		try {
			const settings = await getSettingByType('MODEL_AI_0');
			if (settings) {
				await updateSetting({ ...settings, setting: value });
			} else {
				await createSetting({
					type: 'MODEL_AI_0',
					setting: value,
				});
			}
			setModel0(value);
			message.success('Đã lưu Model AI')
		} catch (error) {
			console.error('Error saving model 0:', error);
		}
	};

	const loadSystemMessage0 = async () => {
		try {
			const message = await getSettingByType('SYSTEM_MESSAGE_0');
			if (message) {
				setSystemMessage0(message.setting);
			}
		} catch (error) {
			console.error('Error loading system message 0:', error);
		}
	};

	const saveSystemMessage0 = async (value) => {
		try {
			const settings = await getSettingByType('SYSTEM_MESSAGE_0');
			if (settings) {
				await updateSetting({ ...settings, setting: value });
			} else {
				await createSetting({
					type: 'SYSTEM_MESSAGE_0',
					setting: value,
				});
			}
			setSystemMessage0(value);
			message.success('Đã lưu System Message')
		} catch (error) {
			console.error('Error saving system message 0:', error);
		}
	};

	const useAI = async () => {
		if (!selectedKpi) {
			message.error('Không có dữ liệu KPI để phân tích');
			return;
		}

		try {
			setLoading(true);
			saveSystemMessage0(systemMessage0);
			saveModel0(model0);

			// Chuẩn bị dữ liệu KPI để gửi cho AI
			const kpiData = {
				name: selectedKpi.name,
				formula: selectedKpi.calc ? JSON.parse(selectedKpi.calc).formula : '',
				period: selectedKpi.period || 'day',
				kpiList: selectedKpi.kpiList || [],
				varList: selectedKpi.varList || [],
				benchmark1_name: selectedKpi.benchmark1_name || '',
				benchmark2_name: selectedKpi.benchmark2_name || '',
			};

			// Tạo prompt yêu cầu AI mô tả tác dụng của KPI
			const prompt = `Hãy phân tích và mô tả tác dụng của KPI sau đây:

Dữ liệu KPI:
${JSON.stringify(kpiData, null, 2)}

Yêu cầu: Hãy viết mô tả bằng tiếng Việt, ngắn gọn và dễ hiểu.`;

			let rs = await aiGen(prompt, '', model0, 'text');

			// Save used tokens to settings
			const usedTokens = await getSettingByType('USED_TOKEN');
			const totalTokens = (usedTokens?.setting || 0) + (rs.usage?.total_tokens || 0);
			if (usedTokens) {
				await updateSetting({ ...usedTokens, setting: totalTokens });
			} else {
				await createSetting({
					type: 'USED_TOKEN',
					setting: totalTokens,
				});
			}

			if (rs?.result) {
				// Cập nhật KPI với mô tả mới
				const updatedKpi = { ...selectedKpi, desc: rs.result };
				await updateKpi2Calculator(updatedKpi);
				setSelectedKpi(updatedKpi);
				message.success('Đã tạo mô tả thành công');
				
				// Refresh KPI list to show the icon
				console.log('🔄 [KPIViewWithDescription] Calling onDescriptionUpdate callback');
				if (onDescriptionUpdate) {
					onDescriptionUpdate();
				} else {
					console.log('⚠️ [KPIViewWithDescription] onDescriptionUpdate callback is not provided');
				}
			}
		} catch (error) {
			console.log('Error analyzing KPI data:', error);
			message.error('Có lỗi xảy ra với hệ thống AI, vui lòng thử lại sau.')
		} finally {
			setLoading(false);
		}
	};

	const updateDesc = async () => {
		if (!selectedKpi) return;
		
		try {
			await updateKpi2Calculator(selectedKpi);
			message.success('Đã lưu mô tả');
			
			// Refresh KPI list to show the icon
			console.log('🔄 [KPIViewWithDescription] Calling onDescriptionUpdate callback from updateDesc');
			if (onDescriptionUpdate) {
				onDescriptionUpdate();
			} else {
				console.log('⚠️ [KPIViewWithDescription] onDescriptionUpdate callback is not provided in updateDesc');
			}
		} catch (error) {
			console.error('Error updating KPI description:', error);
			message.error('Lỗi khi lưu mô tả');
		}
	};

	if (!selectedKpi) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				height: '200px',
				color: '#8c8c8c'
			}}>
				Không có dữ liệu KPI
			</div>
		);
	}

	return (
		<div style={{ width: '100%', height: '100%' }}>
			<div style={{
				marginBottom: 16,
				paddingBottom: 8,
				borderBottom: '1px solid #f0f0f0'
			}}>
				<h3 style={{ margin: 0, fontSize: '16px' }}>
					Chi tiết KPI: {selectedKpi.name}
					{selectedKpi.desc && (
						<Tooltip title="Đã có mô tả">
							<CheckCircle2 size={15} color="#2772e3" style={{ marginLeft: 8 }} />
						</Tooltip>
					)}
				</h3>
			</div>
			
			<div style={{ display: 'flex', gap: 16, height: 'calc(100% - 60px)' }}>
				{/* KPI Content */}
				<div style={{ width: '60%', height: '100%' }}>
					<KPI2ContentView 
						selectedKpiId={selectedKpiId}
						showChart={showChart}
					/>
				</div>
				
				{/* Description Section */}
				<div style={{ width: '40%', height: '100%', padding: '0 16px' }}>
					<div style={{ marginBottom: 16 }}>
						<Button type='primary' onClick={useAI} style={{ marginTop: 16 }}>
							Tự động tạo mô tả
						</Button>
					</div>
					<Spin spinning={loading} tip="Hệ thống đang xử lý câu hỏi của bạn và sẽ hoàn thành trong ít phút">
						<Input.TextArea
							placeholder='Nhập mô tả cho KPI này...'
							value={selectedKpi?.desc || ''}
							onChange={(e) => setSelectedKpi({ ...selectedKpi, desc: e.target.value })}
							style={{ height: '60vh' }}
						/>
					</Spin>
					<Button type='primary' onClick={updateDesc} style={{ marginTop: 16 }}>
						Lưu mô tả
					</Button>
				</div>
			</div>
		</div>
	);
};

export default KPIViewWithDescription; 