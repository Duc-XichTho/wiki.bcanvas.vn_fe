import React, { useState, useEffect } from 'react';
import {
	Card,
	Form,
	Input,
	Select,
	InputNumber,
	Radio,
	Space,
	Button,
	Divider,
	message,
	Row,
	Col,
	Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title, Text } = Typography;

/**
 * DateOperationConfig Component
 * @param {Object} props
 * @param {Object} props.config - Configuration object (legacy prop name)
 * @param {Object} props.initialConfig - Configuration object (new prop name)
 * @param {Function} props.onConfigChange - Callback function to handle config changes (legacy prop name)
 * @param {Function} props.onChange - Callback function for compatibility (new prop name)
 * @param {Array} props.availableColumns - Array of available columns for selection
 * @param {Boolean} props.inputColumnsLoading - Loading state for input columns
 */
const DateOperationConfig = ({ config, initialConfig, onConfigChange, onChange, availableColumns = [], inputColumnsLoading = false }) => {
	// Sử dụng initialConfig nếu có, nếu không thì dùng config (backward compatibility)
	const finalConfig = initialConfig || config || {};
	
	// Kiểm tra và xử lý an toàn cho callback function
	// Ưu tiên onChange (new), nếu không có thì dùng onConfigChange (legacy)
	const callbackFunction = (typeof onChange === 'function') ? onChange : onConfigChange;
	
	if (typeof callbackFunction !== 'function') {
		console.error('DateOperationConfig - Neither onChange nor onConfigChange is a function:', { onChange, onConfigChange });
		console.warn('DateOperationConfig - This component requires either onChange or onConfigChange function prop to work properly');
		// Tạo một function mặc định để tránh lỗi
		onConfigChange = (config) => {
			console.warn('DateOperationConfig - Using default callback function:', config);
		};
	} else {
		// Gán lại để sử dụng trong component
		onConfigChange = callbackFunction;
	}

	// Xử lý an toàn cho availableColumns - giờ đây nó là array string
	const safeAvailableColumns = Array.isArray(availableColumns) ? availableColumns : [];
	
	// Fallback: nếu safeAvailableColumns trống, thử sử dụng availableColumns gốc
	const finalAvailableColumns = safeAvailableColumns.length > 0 ? safeAvailableColumns : (Array.isArray(availableColumns) ? availableColumns : []);

	
	// Nếu không có cột nào, hiển thị thông báo loading
	if (inputColumnsLoading || finalAvailableColumns.length === 0) {
		console.warn('DateOperationConfig - No available columns or loading, showing loading state:', { inputColumnsLoading, finalAvailableColumnsLength: finalAvailableColumns.length });
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<p>Đang tải danh sách cột...</p>
				<p style={{ fontSize: '12px', color: '#666' }}>
					Debug: availableColumns = {JSON.stringify(availableColumns)}
				</p>
				<p style={{ fontSize: '12px', color: '#666' }}>
					Đang chờ dữ liệu từ bước input...
				</p>
				{inputColumnsLoading && (
					<p style={{ fontSize: '12px', color: '#0066cc' }}>
						🔄 Đang cập nhật danh sách cột...
					</p>
				)}
			</div>
		);
	}
	
	const [form] = Form.useForm();
	const [operationType, setOperationType] = useState(finalConfig?.operationType || 'add_subtract');
	const [lookupType, setLookupType] = useState(finalConfig?.lookupType || 'nearest_past');

	useEffect(() => {
	
		if (finalConfig && typeof finalConfig === 'object') {
			// Đảm bảo rằng tất cả các giá trị mặc định được set
			const defaultValues = {
				newColumnName: finalConfig.newColumnName || 'ngay_moi',
				operationType: finalConfig.operationType || 'add_subtract',
				lookupType: finalConfig.lookupType || 'nearest_past',
				sourceDateColumn: finalConfig.sourceDateColumn || '',
				targetDateColumn: finalConfig.targetDateColumn || '',
				referenceDateColumn: finalConfig.referenceDateColumn || '',
				operations: finalConfig.operations || [{ type: 'add', unit: 'days', value: 0, sourceColumn: null }],
				maxDaysLookup: finalConfig.maxDaysLookup || 365,
				outputFormat: finalConfig.outputFormat || 'YYYY-MM-DD',
				defaultValue: finalConfig.defaultValue || '',
			};
			form.setFieldsValue(defaultValues);
		}
	}, [finalConfig, form]);

	// Tự động lưu config mặc định khi component mount lần đầu
	useEffect(() => {
		if (!finalConfig || Object.keys(finalConfig).length <= 2) { // Chỉ có inputStepId và useCustomInput
			const defaultConfig = {
				newColumnName: 'ngay_moi',
				operationType: 'add_subtract',
				lookupType: 'nearest_past',
				sourceDateColumn: '',
				targetDateColumn: '',
				referenceDateColumn: '',
				operations: [{ type: 'add', unit: 'days', value: 0, sourceColumn: null }],
				maxDaysLookup: 365,
				outputFormat: 'YYYY-MM-DD',
				defaultValue: '',
			};
			// Kiểm tra an toàn trước khi gọi onConfigChange
			if (typeof onConfigChange === 'function') {
				onConfigChange(defaultConfig);
			} else {
				console.warn('DateOperationConfig - Cannot auto-save default config: onConfigChange is not a function');
			}
		}
	}, [finalConfig, onConfigChange]); // Thêm onConfigChange vào dependencies

	const handleConfigChange = (changedValues, allValues) => {
		// Kiểm tra validation trước khi lưu
		if (changedValues.newColumnName === '' || allValues.newColumnName === '') {
			console.log('DateOperationConfig - newColumnName is empty, not saving config');
			return; // Không lưu nếu tên cột mới trống
		}

		// Chỉ lưu các giá trị cần thiết, không giữ lại config cũ
		const newConfig = {
			...allValues, // Sử dụng giá trị mới từ form
			operationType, // Đảm bảo operationType được lưu
			lookupType, // Đảm bảo lookupType được lưu
		};
		console.log('DateOperationConfig - handleConfigChange:', { changedValues, allValues, newConfig });
		// Kiểm tra an toàn trước khi gọi onConfigChange
		if (typeof onConfigChange === 'function') {
			onConfigChange(newConfig);
		} else {
			console.warn('DateOperationConfig - Cannot save config: onConfigChange is not a function');
		}
	};

	const handleFormFinish = (values) => {
		// Kiểm tra validation trước khi lưu
		if (!values.newColumnName || values.newColumnName.trim() === '') {
			console.log('DateOperationConfig - newColumnName is empty, not saving form');
			message.error('Vui lòng nhập tên cột mới!');
			return; // Không lưu nếu tên cột mới trống
		}

		// Chỉ lưu các giá trị cần thiết, không giữ lại config cũ
		const newConfig = {
			...values, // Sử dụng giá trị mới từ form
			operationType, // Đảm bảo operationType được lưu
			lookupType, // Đảm bảo lookupType được lưu
		};
		console.log('DateOperationConfig - handleFormFinish:', { values, newConfig });
		// Kiểm tra an toàn trước khi gọi onConfigChange
		if (typeof onConfigChange === 'function') {
			onConfigChange(newConfig);
		} else {
			console.warn('DateOperationConfig - Cannot save form: onConfigChange is not a function');
		}
	};

	const handleOperationTypeChange = (value) => {
		setOperationType(value);
		// Cập nhật form values để đảm bảo tính nhất quán
		form.setFieldsValue({ operationType: value });
		
		// Lấy tất cả giá trị hiện tại từ form
		form.validateFields().then(allValues => {
			const newConfig = {
				...allValues,
				operationType: value,
				lookupType,
			};
			// Kiểm tra an toàn trước khi gọi onConfigChange
			if (typeof onConfigChange === 'function') {
				onConfigChange(newConfig);
			} else {
				console.warn('DateOperationConfig - Cannot save operation type change: onConfigChange is not a function');
			}
		});
	};

	const handleLookupTypeChange = (value) => {
		setLookupType(value);
		// Cập nhật form values để đảm bảo tính nhất quán
		form.setFieldsValue({ lookupType: value });
		
		// Lấy tất cả giá trị hiện tại từ form
		form.validateFields().then(allValues => {
			const newConfig = {
				...allValues,
				operationType,
				lookupType: value,
			};
			// Kiểm tra an toàn trước khi gọi onConfigChange
			if (typeof onConfigChange === 'function') {
				onConfigChange(newConfig);
			} else {
				console.warn('DateOperationConfig - Cannot save lookup type change: onConfigChange is not a function');
			}
		});
	};

	


	return (
		<>
	
			<Form
				form={form}
				layout="vertical"
				onValuesChange={handleConfigChange}
				onFinish={handleFormFinish}
				initialValues={{
					newColumnName: finalConfig?.newColumnName || 'ngay_moi',
					operationType: finalConfig?.operationType || 'add_subtract',
					lookupType: finalConfig?.lookupType || 'nearest_past',
					sourceDateColumn: finalConfig?.sourceDateColumn || '',
					targetDateColumn: finalConfig?.targetDateColumn || '',
					referenceDateColumn: finalConfig?.referenceDateColumn || '',
					operations: finalConfig?.operations || [{ type: 'add', unit: 'days', value: 0, sourceColumn: null }],
					maxDaysLookup: finalConfig?.maxDaysLookup || 365,
					outputFormat: finalConfig?.outputFormat || 'YYYY-MM-DD',
					defaultValue: finalConfig?.defaultValue || '',
				}}
			>
				{/* Tên cột mới */}
				<Form.Item
					label="Tên cột mới"
					name="newColumnName"
					rules={[{ required: true, message: 'Vui lòng nhập tên cột mới!' }]}
				>
					<Input 
						placeholder="Nhập tên cột mới" 
						allowClear
						onChange={(e) => {
							// Cho phép xóa trắng
							const value = e.target.value;
							if (value === '') {
								form.setFieldsValue({ newColumnName: '' });
							}
						}}
					/>
				</Form.Item>

				<Divider orientation="left">Loại thao tác</Divider>

				<Form.Item label="Chọn loại thao tác">
					<Radio.Group value={operationType} onChange={(e) => handleOperationTypeChange(e.target.value)}>
						<Radio value="add_subtract">Cộng/trừ ngày/tháng/năm</Radio>
						<Radio value="lookup_nearest">Tìm ngày gần nhất trong quá khứ</Radio>
					</Radio.Group>
				</Form.Item>

				{/* Cộng/trừ ngày */}
				{operationType === 'add_subtract' && (
					<>
						<Form.Item
							label="Cột ngày gốc"
							name="sourceDateColumn"
							rules={[{ required: true, message: 'Vui lòng chọn cột ngày!' }]}
						>
							<Select virtual={false} placeholder="Chọn cột ngày">
								{finalAvailableColumns.length > 0 ? finalAvailableColumns.map(col => (
									<Option key={col} value={col}>
										{col}
									</Option>
								)) : (
									<Option value="" disabled>Không có cột ngày nào</Option>
								)}
							</Select>
						</Form.Item>

						<Form.Item label="Thao tác cộng/trừ">
							<Space direction="vertical" style={{ width: '100%' }}>
								<Form.Item
									name="operations"
									initialValue={finalConfig?.operations || [{ type: 'add', unit: 'days', value: 0, sourceColumn: null }]}
								>
									<Form.List name="operations">
										{(fields, { add, remove }) => (
											<>
												{fields.map(({ key, name, ...restField }) => (
													<Card key={key} size="small" style={{ marginBottom: 8 }}>
														<Row gutter={8} align="middle">
															<Col span={6}>
																<Form.Item
																	{...restField}
																	name={[name, 'type']}
																	rules={[{ required: true, message: 'Chọn loại!' }]}
																>
																	<Select placeholder="Loại">
																		<Option value="add">Cộng (+)</Option>
																		<Option value="subtract">Trừ (-)</Option>
																	</Select>
																</Form.Item>
															</Col>
															<Col span={6}>
																<Form.Item
																	{...restField}
																	name={[name, 'unit']}
																	rules={[{ required: true, message: 'Chọn đơn vị!' }]}
																>
																	<Select placeholder="Đơn vị">
																		<Option value="days">Ngày</Option>
																		<Option value="months">Tháng</Option>
																		<Option value="years">Năm</Option>
																	</Select>
																</Form.Item>
															</Col>
															<Col span={6}>
																<Form.Item
																	{...restField}
																	name={[name, 'value']}
																	rules={[{ required: true, message: 'Nhập giá trị!' }]}
																>
																	<InputNumber
																		placeholder="Giá trị"
																		style={{ width: '100%' }}
																		min={0}
																	/>
																</Form.Item>
															</Col>
															<Col span={4}>
																<Form.Item
																	{...restField}
																	name={[name, 'sourceColumn']}
																>
																	<Select
																		placeholder="Từ cột"
																		allowClear
																		showSearch
																	>
																																			{finalAvailableColumns && finalAvailableColumns.length > 0 ? finalAvailableColumns.map(col => (
																		<Option key={col} value={col}>
																			{col}
																		</Option>
																	)) : (
																		<Option value="" disabled>Không có cột số nào</Option>
																	)}
																	</Select>
																</Form.Item>
															</Col>
															<Col span={2}>
																<Button
																	type="text"
																	danger
																	icon={<DeleteOutlined />}
																	onClick={() => remove(name)}
																/>
															</Col>
														</Row>
														<Text type="secondary" style={{ fontSize: '12px' }}>
															{fields[name]?.sourceColumn ? 
																`Lấy giá trị từ cột ${fields[name]?.sourceColumn}` : 
																`Sử dụng giá trị cố định ${fields[name]?.value || 0}`
															}
														</Text>
													</Card>
												))}
												<Button
													type="dashed"
													onClick={() => add({ type: 'add', unit: 'days', value: 0, sourceColumn: null })}
													icon={<PlusOutlined />}
													style={{ width: '100%' }}
												>
													Thêm thao tác
												</Button>
											</>
										)}
									</Form.List>
								</Form.Item>
							</Space>
						</Form.Item>
					</>
				)}

				{/* Lookup ngày gần nhất */}
				{operationType === 'lookup_nearest' && (
					<>
						<Form.Item
							label="Cột ngày cần tìm"
							name="targetDateColumn"
							rules={[{ required: true, message: 'Vui lòng chọn cột ngày!' }]}
						>
							<Select virtual={false} placeholder="Chọn cột ngày cần tìm">
								{finalAvailableColumns.length > 0 ? finalAvailableColumns.map(col => (
									<Option key={col} value={col}>
										{col}
									</Option>
								)) : (
									<Option value="" disabled>Không có cột ngày nào</Option>
								)}
							</Select>
						</Form.Item>

						<Form.Item
							label="Cột ngày tham chiếu"
							name="referenceDateColumn"
							rules={[{ required: true, message: 'Vui lòng chọn cột ngày tham chiếu!' }]}
						>
							<Select virtual={false} placeholder="Chọn cột ngày tham chiếu">
								{finalAvailableColumns.length > 0 ? finalAvailableColumns.map(col => (
									<Option key={col} value={col}>
										{col}
									</Option>
								)) : (
									<Option value="" disabled>Không có cột ngày nào</Option>
								)}
							</Select>
						</Form.Item>

						<Form.Item label="Loại tìm kiếm">
							<Radio.Group value={lookupType} onChange={(e) => handleLookupTypeChange(e.target.value)}>
								<Radio value="nearest_past">Ngày gần nhất trong quá khứ</Radio>
								<Radio value="nearest_future">Ngày gần nhất trong tương lai</Radio>
							</Radio.Group>
						</Form.Item>

						<Form.Item
							label="Số ngày tối đa tìm kiếm"
							name="maxDaysLookup"
							initialValue={365}
						>
							<InputNumber
								placeholder="Số ngày tối đa"
								style={{ width: '100%' }}
								min={1}
								max={3650}
							/>
						</Form.Item>
					</>
				)}

				<Divider orientation="left">Tùy chọn bổ sung</Divider>

				<Form.Item
					label="Định dạng ngày đầu ra"
					name="outputFormat"
					initialValue="YYYY-MM-DD"
				>
					<Select placeholder="Chọn định dạng">
						<Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
						<Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
						<Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
						<Option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</Option>
						<Option value="DD/MM/YYYY HH:mm">DD/MM/YYYY HH:mm</Option>
					</Select>
				</Form.Item>

				<Form.Item
					label="Giá trị mặc định khi lỗi"
					name="defaultValue"
					initialValue=""
				>
					<Input placeholder="Giá trị mặc định khi có lỗi xảy ra" />
				</Form.Item>
				
			
			</Form>
		</>
	);
};

export default DateOperationConfig;
