import React, { useState } from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import KPI2ContentView from '../../../Canvas/CanvasFolder/KPI2Calculator/KPI2ContentView.jsx';

const { Title, Text } = Typography;

const ComparisonModal = ({
	open,
	onCancel,
	selectedMetric,
	kpi2Calculators,
}) => {
	const [selectedComparisonKpiId, setSelectedComparisonKpiId] = useState(
		selectedMetric?.settings?.kpis?.[0] || null
	);

	// Reset selected KPI when modal opens with a new metric
	React.useEffect(() => {
		if (selectedMetric?.settings?.kpis?.[0]) {
			setSelectedComparisonKpiId(selectedMetric.settings.kpis[0]);
		}
	}, [selectedMetric]);

	const handleCancel = () => {
		setSelectedComparisonKpiId(null);
		onCancel();
	};

	return (
		<Modal
			title={`So sánh: ${selectedMetric?.name}`}
			open={open}
			onCancel={handleCancel}
			footer={[
				<Button key="close" onClick={handleCancel}>
					Đóng
				</Button>,
			]}
			width={1400}
			style={{ top: '5vh' }}
			bodyStyle={{
				maxHeight: '80vh',
				overflow: 'hidden',
				padding: '24px',
			}}
		>
			{selectedMetric && selectedMetric.type === 'comparison' && (
				<Space direction="vertical" size={24} style={{
					width: '100%',
					maxHeight: 'calc(80vh - 120px)',
					overflow: 'auto',
				}}>
					<div>
						<Title level={5}>Chọn KPI để xem chi tiết</Title>
						{selectedMetric.settings?.kpis && selectedMetric.settings.kpis.length > 0 ? (
							<>
								<Space wrap>
									{selectedMetric.settings.kpis.map((kpiId, index) => {
										const kpi = kpi2Calculators.find(k => k.id === kpiId);
										return (
											<Button
												key={kpiId}
												type={selectedComparisonKpiId === kpiId ? 'primary' : 'default'}
												onClick={() => setSelectedComparisonKpiId(kpiId)}
												disabled={!kpi}
											>
												{kpi?.name || `KPI ${index + 1} (Không tìm thấy)`}
											</Button>
										);
									})}
								</Space>
								<Text type="secondary" style={{ fontSize: '12px' }}>
									Đã cấu hình {selectedMetric.settings.kpis.length} KPI để so sánh
								</Text>
							</>
						) : (
							<Text type="secondary">Không có KPI nào được cấu hình cho so sánh này.</Text>
						)}
					</div>

					{selectedComparisonKpiId ? (
						<div>
							<Title level={5}>Chi tiết KPI</Title>
							<div style={{
								border: '1px solid #f0f0f0',
								borderRadius: '6px',
								padding: '16px',
								backgroundColor: '#fff',
							}}>
								{kpi2Calculators.find(k => k.id === selectedComparisonKpiId) ? (
									<KPI2ContentView
										key={selectedComparisonKpiId}
										selectedKpiId={selectedComparisonKpiId}
										showChart={true}
									/>
								) : (
									<div style={{
										padding: '20px',
										textAlign: 'center',
										backgroundColor: '#fafafa',
									}}>
										<Text type="secondary">KPI này không tồn tại hoặc đã bị xóa</Text>
									</div>
								)}
							</div>
						</div>
					) : (
						<div style={{
							border: '1px solid #f0f0f0',
							borderRadius: '6px',
							padding: '16px',
							backgroundColor: '#fafafa',
							textAlign: 'center',
						}}>
							<Text type="secondary">
								{selectedMetric.settings?.kpis && selectedMetric.settings.kpis.length > 0
									? 'Vui lòng chọn một KPI để xem chi tiết'
									: 'Không có KPI nào được cấu hình cho so sánh này'
								}
							</Text>
						</div>
					)}
				</Space>
			)}
		</Modal>
	);
};

export default ComparisonModal; 