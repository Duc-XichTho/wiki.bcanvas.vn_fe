import React, { useState, useEffect } from 'react';
import { Card, Select, Space, Divider, Typography, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const PivotTableConfig = ({ initialConfig = {}, onChange, availableColumns = [] }) => {
	const [config, setConfig] = useState({
		identifierColumns: [], // Cột định danh (giữ nguyên)
		pivotColumns: [], // Cột cần xoay (chuyển thành hàng)
		valueColumnName: 'Giá trị', // Tên cột giá trị mới
		itemColumnName: 'Khoản mục', // Tên cột khoản mục mới
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
				message="Xoay bảng (Unpivot)"
				description="Chuyển đổi dữ liệu từ định dạng rộng sang định dạng dài. Các cột được chọn sẽ trở thành các hàng trong cột 'Khoản mục'."
				type="info"
				showIcon
				icon={<InfoCircleOutlined />}
				style={{ marginBottom: 16 }}
			/>

			<Card title="Cấu hình xoay bảng" size="small">
				<Space direction="vertical" style={{ width: '100%' }}>
					<div>
						<Text strong>Cột định danh (giữ nguyên):</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Các cột này sẽ được giữ nguyên và lặp lại cho mỗi hàng mới
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
						<Text strong>Cột cần xoay:</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Các cột này sẽ được chuyển thành các hàng trong cột 'Khoản mục'
						</Text>
						<Select
							virtual={false}
							mode="multiple"
							placeholder="Chọn các cột cần xoay"
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
						<Text strong>Tên cột khoản mục:</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Tên cột chứa tên của các cột gốc đã được xoay
						</Text>
						<input
							type="text"
							value={config.itemColumnName}
							onChange={(e) => handleConfigChange('itemColumnName', e.target.value)}
							style={{
								width: '100%',
								padding: '8px 12px',
								border: '1px solid #d9d9d9',
								borderRadius: '6px',
								marginTop: 8
							}}
							placeholder="Nhập tên cột khoản mục"
						/>
					</div>

					<div>
						<Text strong>Tên cột giá trị:</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Tên cột chứa giá trị từ các cột đã được xoay
						</Text>
						<input
							type="text"
							value={config.valueColumnName}
							onChange={(e) => handleConfigChange('valueColumnName', e.target.value)}
							style={{
								width: '100%',
								padding: '8px 12px',
								border: '1px solid #d9d9d9',
								borderRadius: '6px',
								marginTop: 8
							}}
							placeholder="Nhập tên cột giá trị"
						/>
					</div>
				</Space>
			</Card>

			{config.identifierColumns.length > 0 && config.pivotColumns.length > 0 && (
				<Alert
					message="Kết quả dự kiến"
					description={`Dữ liệu sẽ được chuyển đổi từ ${config.pivotColumns.length} cột thành ${config.pivotColumns.length} hàng cho mỗi nhóm định danh.`}
					type="success"
					showIcon
				/>
			)}
		</Space>
	);
};

export default PivotTableConfig; 