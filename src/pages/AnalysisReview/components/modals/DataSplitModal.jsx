import React, { useState, useCallback, useMemo, useContext } from 'react';
import { Modal, Button, Input, Select, Checkbox, Row, Col, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { MyContext } from '../../../../MyContext.jsx';

const { Option } = Select;
const { Text } = Typography;

const DataSplitModal = ({
	open,
	onCancel,
	onConfirm,
	selectedItem,
	modelList = [],
}) => {
	const { currentUser } = useContext(MyContext);
	// State cho prompt
	const [prompt, setPrompt] = useState('');
	
	// State cho cột giữ nguyên
	const [keepColumns, setKeepColumns] = useState([]);
	
	// State cho cột được tách
	const [splitColumns, setSplitColumns] = useState([]);
	
	// State cho model AI
	const [selectedModel, setSelectedModel] = useState('');
	
	// State cho filter settings
	const [filterEnabled, setFilterEnabled] = useState(false);
	const [filterConditions, setFilterConditions] = useState([{
		column: null,
		condition: 'equals',
		value: '',
		operator: 'and',
	}]);

	// Initialize state when selectedItem changes
	React.useEffect(() => {
		if (selectedItem) {
			const dateColumn = selectedItem.settings?.dateColumn;
			const defaultPrompt = selectedItem.analysis?.prompt || 'Phân tích dữ liệu này và đưa ra nhận xét chi tiết về xu hướng, mẫu và insights quan trọng.';
			
			// Set default keep columns (date column if exists)
			const keepCols = selectedItem.analysis?.splitSettings?.keepColumns || (dateColumn ? [dateColumn] : []);
			
			// Set default split columns to empty (user must choose manually)
			const splitCols = selectedItem.analysis?.splitSettings?.splitColumns || [];

			setPrompt(defaultPrompt);
			setKeepColumns(keepCols);
			setSplitColumns(splitCols);
			setSelectedModel(selectedItem.analysis?.splitSettings?.selectedModel || 'gpt-5-mini-2025-08-07');
			setFilterEnabled(selectedItem.analysis?.splitSettings?.filterSettings?.enabled || false);
			setFilterConditions(selectedItem.analysis?.splitSettings?.filterSettings?.conditions || [{
				column: null,
				condition: 'equals',
				value: '',
				operator: 'and',
			}]);
		}
	}, [selectedItem]);

	// Reset state khi modal đóng
	const handleCancel = useCallback(() => {
		setPrompt('');
		setKeepColumns([]);
		setSplitColumns([]);
		setSelectedModel('');
		setFilterEnabled(false);
		setFilterConditions([{
			column: null,
			condition: 'equals',
			value: '',
			operator: 'and',
		}]);
		onCancel();
	}, [onCancel]);

	// Xử lý confirm
	const handleConfirm = useCallback(() => {
		const splitSettings = {
			prompt,
			keepColumns,
			splitColumns,
			selectedModel,
			filterSettings: {
				enabled: filterEnabled,
				conditions: filterConditions,
			},
		};
		onConfirm(splitSettings);
		handleCancel();
	}, [prompt, keepColumns, splitColumns, selectedModel, filterEnabled, filterConditions, onConfirm, handleCancel]);

	// Thêm điều kiện lọc mới
	const addFilterCondition = useCallback(() => {
		setFilterConditions(prev => [...prev, {
			column: null,
			condition: 'equals',
			value: '',
			operator: 'and',
		}]);
	}, []);

	// Xóa điều kiện lọc
	const removeFilterCondition = useCallback((index) => {
		setFilterConditions(prev => {
			if (prev.length <= 1) return prev;
			const newConditions = [...prev];
			newConditions.splice(index, 1);
			return newConditions;
		});
	}, []);

	// Cập nhật điều kiện lọc
	const updateFilterCondition = useCallback((index, field, value) => {
		setFilterConditions(prev => {
			const newConditions = [...prev];
			newConditions[index] = { ...newConditions[index], [field]: value };
			return newConditions;
		});
	}, []);

	// Memoized columns options
	const columnOptions = useMemo(() => {
		return selectedItem?.settings?.templateColumns?.map(col => (
			<Option key={col.id} value={col.id}>
				{col.columnName}
			</Option>
		)) || [];
	}, [selectedItem]);

	// Memoized model options
	const modelOptions = useMemo(() => {
		return modelList.map(model => (
			<Option key={model.value} value={model.value}>
				{model.name}
			</Option>
		));
	}, [modelList]);

	// Validation
	const isValid = keepColumns.length > 0 && splitColumns.length > 0;

	// Preview data
	const previewData = useMemo(() => {
		const keepColumnNames = keepColumns.map(col => {
			const templateCol = selectedItem?.settings?.templateColumns?.find(tc => tc.id === col);
			return templateCol?.columnName || col;
		});

		const splitColumnNames = splitColumns.map(col => {
			const templateCol = selectedItem?.settings?.templateColumns?.find(tc => tc.id === col);
			return templateCol?.columnName || col;
		});

		const selectedModelName = modelList.find(model => model.value === selectedModel)?.name || 'Chưa chọn';

		return {
			keepColumnNames,
			splitColumnNames,
			selectedModelName,
		};
	}, [keepColumns, splitColumns, selectedModel, selectedItem, modelList]);

	return (
		<Modal
			title="Cấu hình tách dữ liệu trước khi phân tích"
			open={open}
			onCancel={handleCancel}
			footer={[
				<Button key="cancel" onClick={handleCancel}>
					Hủy
				</Button>,
				<Button
					key="analyze"
					type="primary"
					onClick={handleConfirm}
					disabled={!isValid}
				>
					Phân tích với dữ liệu đã tách
				</Button>,
			]}
			width={1000}
		>
			{selectedItem && (
				<div style={{ color: 'var(--text-primary)' }}>
					{/* Custom Prompt */}
					{currentUser?.isSuperAdmin &&
						<div style={{ marginBottom: '20px' }}>
							<h4 style={{ marginBottom: '12px' }}>Prompt tùy chỉnh cho phân tích:</h4>
							<div style={{ marginBottom: '16px' }}>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
									Prompt phân tích:
								</label>
								<Input.TextArea
									rows={4}
									placeholder="Nhập prompt tùy chỉnh cho AI phân tích dữ liệu..."
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									style={{ width: '100%' }}
								/>
								<Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
									Prompt này sẽ được sử dụng để hướng dẫn AI phân tích dữ liệu. Để trống để sử dụng prompt
									mặc định.
								</Text>
							</div>
						</div>}

					{/* Column Selection */}
					<div style={{ marginBottom: '20px' }}>
						<h4 style={{ marginBottom: '12px' }}>Chọn cột giữ nguyên và cột tách:</h4>

						{/* Keep Columns */}
						<div style={{ marginBottom: '16px' }}>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
								Cột giữ nguyên (không tách): <span style={{ color: '#ff4d4f' }}>*</span>
							</label>
							<Select
								mode="multiple"
								style={{ width: '100%' }}
								placeholder="Chọn cột giữ nguyên (bắt buộc)"
								value={keepColumns}
								onChange={setKeepColumns}
								status={keepColumns.length === 0 ? 'error' : ''}
							>
								{columnOptions}
							</Select>
							<Text type="secondary" style={{ fontSize: '12px' }}>
								Các cột này sẽ được giữ nguyên trong mỗi phần dữ liệu
							</Text>
							{keepColumns.length === 0 && (
								<Text type="danger" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
									⚠️ Vui lòng chọn ít nhất một cột giữ nguyên
								</Text>
							)}
						</div>

						{/* Split Columns */}
						<div style={{ marginBottom: '16px' }}>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
								Cột được tách: <span style={{ color: '#ff4d4f' }}>*</span>
							</label>
							<Select
								mode="multiple"
								style={{ width: '100%' }}
								placeholder="Chọn cột để tách (bắt buộc)"
								value={splitColumns}
								onChange={setSplitColumns}
								status={splitColumns.length === 0 ? 'error' : ''}
							>
								{columnOptions}
							</Select>
							<Text type="secondary" style={{ fontSize: '12px' }}>
								Các cột này sẽ được tách thành các phần riêng biệt
							</Text>
							{splitColumns.length === 0 && (
								<Text type="danger" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
									⚠️ Vui lòng chọn ít nhất một cột để tách
								</Text>
							)}
						</div>
					</div>

					{/* Split Method */}
					<div style={{ marginBottom: '20px' }}>
						<h4 style={{ marginBottom: '12px' }}>Phương pháp tách dữ liệu:</h4>
						<div style={{
							padding: '12px',
							backgroundColor: '#f0f8ff',
							border: '1px solid #d6e4ff',
							borderRadius: '6px',
							color: '#1f2937',
						}}>
							<Text>
								<InfoCircleOutlined style={{ marginRight: '8px' }} />
								Dữ liệu sẽ được tách thành các dataset riêng biệt. Mỗi dataset sẽ chứa tất cả các cột
								"giữ nguyên" + 1 cột "được tách".
							</Text>
						</div>
					</div>

					{/* Data Filtering Configuration */}
					<div style={{ marginBottom: '20px' }}>
						<h4 style={{ marginBottom: '12px' }}>Cấu hình lọc dữ liệu:</h4>

						<div style={{ marginBottom: '16px' }}>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
								<Checkbox
									checked={filterEnabled}
									onChange={(e) => setFilterEnabled(e.target.checked)}
								>
									Bật lọc dữ liệu
								</Checkbox>
							</label>
						</div>

						{filterEnabled && (
							<div style={{
								padding: '15px',
								border: '1px solid #d9d9d9',
								borderRadius: '6px',
								backgroundColor: '#fafafa',
							}}>
								{/* Filter Conditions */}
								{filterConditions.map((condition, index) => (
									<div key={index} style={{
										marginBottom: '16px',
										padding: '12px',
										border: '1px solid #e8e8e8',
										borderRadius: '6px',
										backgroundColor: 'white',
									}}>
										<div style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: '12px',
										}}>
											<Text strong>Điều kiện {index + 1}</Text>
											{filterConditions.length > 1 && (
												<Button
													size="small"
													danger
													onClick={() => removeFilterCondition(index)}
												>
													Xóa
												</Button>
											)}
										</div>

										<Row gutter={16}>
											<Col span={6}>
												<label style={{
													display: 'block',
													marginBottom: '8px',
													fontWeight: '500',
													fontSize: '12px',
												}}>
													Cột lọc:
												</label>
												<Select
													size="small"
													style={{ width: '100%' }}
													placeholder="Chọn cột"
													value={condition.column}
													onChange={(value) => updateFilterCondition(index, 'column', value)}
												>
													{columnOptions}
												</Select>
											</Col>

											<Col span={6}>
												<label style={{
													display: 'block',
													marginBottom: '8px',
													fontWeight: '500',
													fontSize: '12px',
												}}>
													Điều kiện:
												</label>
												<Select
													size="small"
													style={{ width: '100%' }}
													placeholder="Chọn điều kiện"
													value={condition.condition}
													onChange={(value) => updateFilterCondition(index, 'condition', value)}
												>
													<Option value="equals">Bằng</Option>
													<Option value="not_equals">Không bằng</Option>
													<Option value="contains">Chứa</Option>
													<Option value="not_contains">Không chứa</Option>
													<Option value="starts_with">Bắt đầu bằng</Option>
													<Option value="ends_with">Kết thúc bằng</Option>
													<Option value="greater_than">Lớn hơn</Option>
													<Option value="greater_than_or_equal">Lớn hơn hoặc bằng</Option>
													<Option value="less_than">Nhỏ hơn</Option>
													<Option value="less_than_or_equal">Nhỏ hơn hoặc bằng</Option>
													<Option value="is_null_or_empty">Là null/rỗng</Option>
													<Option value="is_not_null_or_empty">Không phải null/rỗng</Option>
												</Select>
											</Col>

											<Col span={6}>
												<label style={{
													display: 'block',
													marginBottom: '8px',
													fontWeight: '500',
													fontSize: '12px',
												}}>
													Giá trị:
												</label>
												<Input
													size="small"
													placeholder="Nhập giá trị"
													value={condition.value}
													disabled={['is_null_or_empty', 'is_not_null_or_empty'].includes(condition.condition)}
													onChange={(e) => updateFilterCondition(index, 'value', e.target.value)}
												/>
											</Col>

											<Col span={6}>
												<label style={{
													display: 'block',
													marginBottom: '8px',
													fontWeight: '500',
													fontSize: '12px',
												}}>
													Logic:
												</label>
												<Select
													size="small"
													style={{ width: '100%' }}
													value={condition.operator}
													onChange={(value) => updateFilterCondition(index, 'operator', value)}
												>
													<Option value="and">VÀ (AND)</Option>
													<Option value="or">HOẶC (OR)</Option>
												</Select>
											</Col>
										</Row>
									</div>
								))}

								{/* Add New Condition Button */}
								<div style={{ textAlign: 'center', marginTop: '16px' }}>
									<Button
										type="dashed"
										onClick={addFilterCondition}
									>
										+ Thêm điều kiện lọc
									</Button>
								</div>

								<Text type="secondary"
									  style={{ fontSize: '12px', marginTop: '16px', display: 'block' }}>
									Tất cả các điều kiện sẽ được kết hợp theo logic AND (VÀ). Chỉ những dòng dữ liệu
									thỏa mãn tất cả điều kiện mới được đưa vào phân tích.
								</Text>
							</div>
						)}
					</div>

					{/* AI Model Selection */}
					<div style={{ marginBottom: '20px' }}>
						<h4 style={{ marginBottom: '12px' }}>Chọn Model AI:</h4>
						<div style={{ marginBottom: '16px' }}>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
								Model AI để phân tích:
							</label>
							<Select
								style={{ width: '100%' }}
								placeholder="Chọn model AI"
								value={selectedModel}
								onChange={setSelectedModel}
							>
								{modelOptions}
							</Select>
							<Text type="secondary" style={{ fontSize: '12px' }}>
								Chọn model AI phù hợp để phân tích dữ liệu
							</Text>
						</div>
					</div>

					{/* Preview */}
					<div style={{
						marginTop: '20px',
						padding: '15px',
						border: '1px solid var(--border-secondary)',
						borderRadius: '8px',
						backgroundColor: '#fafafa',
					}}>
						<h4 style={{ marginBottom: '10px' }}>Xem trước cấu hình:</h4>

						<div style={{ marginBottom: '8px' }}>
							<strong>Cột giữ nguyên:</strong> {previewData.keepColumnNames.length > 0 ?
							previewData.keepColumnNames.join(', ') : 'Không có'
						}
						</div>

						<div style={{ marginBottom: '8px' }}>
							<strong>Cột được tách:</strong> {previewData.splitColumnNames.length > 0 ?
							previewData.splitColumnNames.join(', ') : 'Không có'
						}
						</div>

						<div style={{ marginBottom: '8px' }}>
							<strong>Số dataset sẽ tạo:</strong> {splitColumns.length}
						</div>
						<div style={{ marginBottom: '8px' }}>
							<strong>Mô tả:</strong> Mỗi dataset sẽ chứa {keepColumns.length} cột giữ
							nguyên + 1 cột được tách
						</div>

						<div style={{ marginBottom: '8px' }}>
							<strong>Model AI:</strong> {previewData.selectedModelName}
						</div>

						{filterEnabled && (
							<div style={{
								marginTop: '12px',
								padding: '10px',
								backgroundColor: '#fff2e8',
								border: '1px solid #ffd591',
								borderRadius: '4px',
							}}>
								<strong>Bộ lọc dữ liệu:</strong>
								{filterConditions.map((condition, index) => (
									<div key={index} style={{
										marginTop: '8px',
										padding: '8px',
										backgroundColor: 'white',
										borderRadius: '4px',
										border: '1px solid #ffd591',
									}}>
										<div style={{ fontWeight: '500', marginBottom: '4px' }}>Điều kiện {index + 1}:
										</div>
										<div style={{ marginTop: '4px', fontSize: '12px' }}>
											Cột: {(() => {
											const templateCol = selectedItem?.settings?.templateColumns?.find(tc => tc.id === condition.column);
											return templateCol?.columnName || condition.column || 'Chưa chọn';
										})()}
										</div>
										<div style={{ marginTop: '4px', fontSize: '12px' }}>
											Điều kiện: {(() => {
											const conditionLabels = {
												'equals': 'Bằng',
												'not_equals': 'Không bằng',
												'contains': 'Chứa',
												'not_contains': 'Không chứa',
												'starts_with': 'Bắt đầu bằng',
												'ends_with': 'Kết thúc bằng',
												'greater_than': 'Lớn hơn',
												'greater_than_or_equal': 'Lớn hơn hoặc bằng',
												'less_than': 'Nhỏ hơn',
												'less_than_or_equal': 'Nhỏ hơn hoặc bằng',
												'is_null_or_empty': 'Là null/rỗng',
												'is_not_null_or_empty': 'Không phải null/rỗng',
											};
											return conditionLabels[condition.condition] || condition.condition;
										})()}
										</div>
										{!['is_null_or_empty', 'is_not_null_or_empty'].includes(condition.condition) && (
											<div style={{ marginTop: '4px', fontSize: '12px' }}>
												Giá trị: {condition.value || 'Chưa nhập'}
											</div>
										)}
										{index < filterConditions.length - 1 && (
											<div style={{
												marginTop: '4px',
												fontSize: '12px',
												fontStyle: 'italic',
												color: '#666',
											}}>
												Logic: {condition.operator === 'and' ? 'VÀ (AND)' : 'HOẶC (OR)'}
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</Modal>
	);
};

export default DataSplitModal;
