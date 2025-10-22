import React, { useState, useEffect } from 'react';
import { Card, Select, Space, Divider, Typography, Alert, Input } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const ReversePivotTableConfig = ({ initialConfig = {}, onChange, availableColumns = [] }) => {
	const [config, setConfig] = useState({
		identifierColumns: [], // Cột định danh (giữ nguyên)
		pivotColumns: [], // Cột chứa giá trị sẽ trở thành tên cột mới
		valueColumnName: 'Giá trị', // Cột chứa giá trị sẽ điền vào các cột mới
		itemColumnName: 'Khoản mục', // Tên cột chứa giá trị pivot (không dùng trong reverse pivot)
		...initialConfig
	});

	useEffect(() => {
		onChange(config);
	}, [config, onChange]);

	const handleConfigChange = (key, value) => {
		const newConfig = { ...config, [key]: value };
		setConfig(newConfig);
	};

	return (
		<Space direction="vertical" style={{ width: '100%' }}>
			<Alert
				message="Xoay bảng từ hàng thành cột (Reverse Pivot)"
				description="Chuyển đổi dữ liệu từ định dạng dài sang định dạng rộng. Các giá trị trong cột pivot sẽ trở thành tên cột mới."
				type="info"
				showIcon
				icon={<InfoCircleOutlined />}
				style={{ marginBottom: 16 }}
			/>

			<Card title="Cấu hình xoay bảng từ hàng thành cột" size="small">
				<Space direction="vertical" style={{ width: '100%' }}>
					<div>
						<Text strong>Cột định danh (giữ nguyên):</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Các cột này sẽ được giữ nguyên và nhóm dữ liệu theo đó
						</Text>
						<Select
							virtual={false}
							mode="multiple"
							placeholder="Chọn các cột định danh"
							value={config.identifierColumns}
							onChange={(value) => handleConfigChange('identifierColumns', value)}
							style={{ width: '100%', marginTop: 8 }}
							options={availableColumns.map(col => ({
								label: col,
								value: col
							}))}
						/>
					</div>

					<Divider />

					<div>
						<Text strong>Cột pivot (tạo tên cột mới):</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Các giá trị duy nhất trong cột này sẽ trở thành tên của các cột mới
						</Text>
						<Select
							virtual={false}
							mode="multiple"
							placeholder="Chọn cột pivot"
							value={config.pivotColumns}
							onChange={(value) => handleConfigChange('pivotColumns', value)}
							style={{ width: '100%', marginTop: 8 }}
							options={availableColumns.map(col => ({
								label: col,
								value: col
							}))}
						/>
					</div>

					<Divider />

					<div>
						<Text strong>Cột giá trị:</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Cột chứa giá trị sẽ được điền vào các cột mới tương ứng
						</Text>
						<Select
							virtual={false}
							placeholder="Chọn cột giá trị"
							value={config.valueColumnName}
							onChange={(value) => handleConfigChange('valueColumnName', value)}
							style={{ width: '100%', marginTop: 8 }}
							options={availableColumns.map(col => ({
								label: col,
								value: col
							}))}
						/>
					</div>

					{/* <div>
						<Text strong>Tên cột khoản mục (tùy chọn):</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Tên cột chứa giá trị pivot (không bắt buộc cho reverse pivot)
						</Text>
						<Input
							value={config.itemColumnName}
							onChange={(e) => handleConfigChange('itemColumnName', e.target.value)}
							style={{ marginTop: 8 }}
							placeholder="Nhập tên cột khoản mục"
						/>
					</div> */}
				</Space>
			</Card>

			{config.identifierColumns.length > 0 && config.pivotColumns.length > 0 && config.valueColumnName && (
				<Alert
					message="Kết quả dự kiến"
					description={`Dữ liệu sẽ được nhóm theo ${config.identifierColumns.join(', ')} và tạo các cột mới từ các giá trị duy nhất trong cột ${config.pivotColumns.join(', ')}.`}
					type="success"
					showIcon
				/>
			)}

			<Alert
				message="Ví dụ"
				description="Nếu cột 'Tên' có các giá trị 'A', 'B', 'C' và cột 'Giá trị' chứa số, kết quả sẽ có các cột mới: A, B, C với giá trị tương ứng."
				type="info"
				showIcon
			/>
		</Space>
	);
};

export default ReversePivotTableConfig;
