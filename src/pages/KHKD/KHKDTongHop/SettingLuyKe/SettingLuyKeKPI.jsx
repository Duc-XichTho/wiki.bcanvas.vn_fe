import { Modal, Select, Space } from 'antd';
import { useState, useEffect } from 'react';
import { updateKHKDTongHop } from '../../../../apis/khkdTongHopService.jsx';

const { Option } = Select;
const calculationOptions = ['Tổng', 'Trung bình'];

export function SettingLuyKeKPI({ isOpen, setIsOpen, dataDoLuong, dataKinhDoanh, khkdTH }) {
	// Khởi tạo settings mặc định mỗi name là 'Tổng'
	const [settings, setSettings] = useState({});

	useEffect(() => {
		if (isOpen) {
			const existedSettings = khkdTH?.luyKeKPI || {};
			const mergedSettings = { ...existedSettings };

			dataDoLuong.forEach(item => {
				if (!mergedSettings[item.name]) {
					mergedSettings[item.name] = { type: 'Tổng', weight: undefined };
				}
			});

			setSettings(mergedSettings);
		}
	}, [isOpen, dataDoLuong, khkdTH]);


	const handleTypeChange = (name, type) => {
		setSettings(prev => ({
			...prev,
			[name]: { ...(prev[name] || {}), type, weight: undefined }
		}));
	};

	const handleWeightChange = (name, weightName) => {
		setSettings(prev => ({
			...prev,
			[name]: { ...(prev[name] || {}), weight: weightName }
		}));
	};

	const allNames = [...dataDoLuong, ...dataKinhDoanh].map(item => item.name);

	return (
		<Modal
			title="Cài đặt lũy kế"
			open={isOpen}
			onOk={() => {
				console.log('Kết quả cấu hình:', settings);
				updateKHKDTongHop({...khkdTH, luyKeKPI: settings}).then(()=> {
					setIsOpen(false);
				})
			}}
			onCancel={() => setIsOpen(false)}
			okText="Lưu"
			cancelText="Hủy"
			width={1200}
			height={ '70vh'}
		>
			<div
				style={{
					flex: 1,
					overflowY: 'auto',
					paddingRight: 8,
					display: 'flex',
					flexWrap: 'wrap',
					gap: 12,
				}}
			>{dataDoLuong.map((item) => {
				const config = settings.hasOwnProperty(item.name)
					? settings[item.name]
					: { type: 'Tổng' };
				console.log(item, config);
				return (
					<div
						key={item.name}
						style={{
							flex: '0 0 calc(25% - 18px)',
							border: '1px solid #cdcfd1',
							borderRadius: 5,
							padding: 5
						}}
					>
						<div style={{ fontWeight: 'bold' }}>{item.name}</div>
						<Select
							style={{ width: '100%', marginBottom: 5 }}
							value={config.type}
							onChange={(value) => handleTypeChange(item.name, value)}
							placeholder="Chọn kiểu tính"
						>
							{calculationOptions.map(option => (
								<Option key={option} value={option}>{option}</Option>
							))}
						</Select>

						{config.type === 'Trung bình có trọng số' && (
							<Select
								style={{ width: '100%' }}
								value={config.weight}
								onChange={(value) => handleWeightChange(item.name, value)}
								placeholder="Chọn cột trọng số"
							>
								{allNames.map(name => (
									<Option key={name} value={name}>{name}</Option>
								))}
							</Select>
						)}
					</div>
				);
			})}

			</div>
		</Modal>
	);
}
