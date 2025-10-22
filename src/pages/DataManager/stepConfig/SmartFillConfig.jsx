import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Switch, Space, Row, Col, Tooltip, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

// Hàm hiển thị text cho các toán tử
const getOperatorDisplayText = (operator) => {
	const operatorMap = {
		'>': '>',
		'>=': '>=',
		'<': '<',
		'<=': '<=',
		'=': '=',
		'!=': '!=',
		'contains': 'chứa',
		'starts_with': 'bắt đầu với',
		'top_largest': 'top lớn nhất',
		'top_smallest': 'top nhỏ nhất',
		'is_not_null': 'không có giá trị',
		'is_not_number': 'không phải số',
		'is_number': 'là số',
	};
	return operatorMap[operator] || operator;
};

const SmartFillConfig = ({
							 initialConfig = {},
							 onChange,
							 availableColumns = [],
							 availableTables = [],
							 referenceTableColumns = [],
							 currentStepId = null,
							 steps = [],
							 templateData = null,
							 initialConfigs = {},
							 currentConfigs = {},
							 stepIndex = null,
						 }) => {
	const [config, setConfig] = useState({
		useAI: false,
		aiPrompt: '',
		conditions: [],
		elseValue: '',
		targetColumn: '',
		createNewColumn: false,
		newColumnName: '',
		onlyProcessEmptyRows: true,
		...initialConfig,
	});

	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
	const [filteredColumns, setFilteredColumns] = useState([]);
	const [mentionSearch, setMentionSearch] = useState('');
	const [sourceColumns, setSourceColumns] = useState([]);

	// Reset config khi initialConfig thay đổi (khi mở modal edit step khác)
	useEffect(() => {
		setConfig({
			useAI: false,
			aiPrompt: '',
			conditions: [],
			elseValue: '',
			targetColumn: '',
			createNewColumn: false,
			newColumnName: '',
			onlyProcessEmptyRows: true,
			...initialConfig,
		});
	}, [initialConfig]);

	// Tính toán sourceColumns dựa trên nguồn dữ liệu được chọn
	useEffect(() => {
		let columns = [];

		if (initialConfig.useCustomInput && initialConfig.inputStepId !== undefined && initialConfig.inputStepId !== null) {
			// Sử dụng step được chọn làm nguồn dữ liệu
			if (initialConfig.inputStepId === 0) {
				// Sử dụng dữ liệu gốc - lấy từ availableColumns
				columns = availableColumns;
			} else {
				// Sử dụng outputColumns từ step được chọn
				const selectedStep = steps.find(s => s.id === initialConfig.inputStepId);
				if (selectedStep && selectedStep.config && selectedStep.config.outputColumns) {
					columns = selectedStep.config.outputColumns.map(col => typeof col === 'string' ? col : col.name);
				} else {
					columns = availableColumns; // Fallback
				}
			}
		} else {
			// Sử dụng step trước đó hoặc dữ liệu gốc
			if (currentStepId && currentStepId > 1) {
				const previousStepId = currentStepId - 1;
				const previousStep = steps.find(s => s.id === previousStepId);
				if (previousStep && previousStep.config && previousStep.config.outputColumns) {
					columns = previousStep.config.outputColumns.map(col => typeof col === 'string' ? col : col.name);
				} else {
					columns = availableColumns; // Fallback
				}
			} else {
				columns = availableColumns; // Dữ liệu gốc
			}
		}

		console.log('Source columns updated:', columns);
		setSourceColumns(columns);
	}, [initialConfig.useCustomInput, initialConfig.inputStepId, currentStepId, steps, availableColumns]);


	// Xử lý thay đổi config
	const handleConfigChange = (key, value) => {
		console.log(`SmartFillConfig: Config field "${key}" changed to:`, value);
		const newConfig = {
			...config,
			[key]: value,
		};
		setConfig(newConfig);

		// Validation: Nếu bật "Chỉ xử lý các dòng trống" thì phải chọn cột đích
		if (key === 'onlyProcessEmptyRows' && value === true && !newConfig.createNewColumn && !newConfig.targetColumn) {
			message.warning('Khi bật "Chỉ xử lý các dòng trống", bạn phải chọn một cột đích cụ thể hoặc tạo cột mới.');
		}

		// Gọi onChange để cập nhật parent component
		if (onChange) {
			onChange(newConfig);
		}
	};

	// Xử lý AI prompt với @ mention
	const handleAIPromptChange = (e) => {
		const value = e.target.value;
		const cursorPosition = e.target.selectionStart;

		// Tìm @ gần nhất trước cursor
		const textBeforeCursor = value.substring(0, cursorPosition);
		const lastAtIndex = textBeforeCursor.lastIndexOf('@');

		if (lastAtIndex !== -1) {
			const mentionText = textBeforeCursor.substring(lastAtIndex + 1);

			// Kiểm tra nếu có space sau @ thì không hiện suggestion
			if (mentionText.includes(' ')) {
				setShowSuggestions(false);
			} else {
				// Lọc columns dựa trên text sau @
				const filtered = sourceColumns.filter(col =>
					col.toLowerCase().includes(mentionText.toLowerCase()),
				);

				// Test với dữ liệu hardcode nếu không có columns
				const testFiltered = filtered.length > 0 ? filtered : ['Test Column 1', 'Test Column 2'];

				setFilteredColumns(testFiltered);
				setMentionSearch(mentionText);
				setShowSuggestions(true);

				console.log('Showing suggestions:', testFiltered.length, 'columns:', testFiltered);

				// Tính toán vị trí suggestion
				const textareaElement = e.target;

				if (textareaElement) {
					// Tính toán vị trí đơn giản hóa
					const lineHeight = 20;
					const lines = textBeforeCursor.split('\n').length;

					const position = {
						top: 100, // Vị trí cố định để test
						left: 10, // Margin từ bên trái
					};

					console.log('Suggestion position:', position, 'Lines:', lines);
					setSuggestionPosition(position);
				}
			}
		} else {
			setShowSuggestions(false);
		}

		handleConfigChange('aiPrompt', value);
	};

	// Xử lý chọn column từ suggestion
	const handleSelectColumn = (columnName) => {
		// Lưu trữ reference đến textarea element để sử dụng sau
		const textareaElement = document.querySelector('textarea[data-testid="ai-prompt-textarea"]');

		if (textareaElement) {
			const cursorPosition = textareaElement.selectionStart;
			const value = config.aiPrompt;
			const textBeforeCursor = value.substring(0, cursorPosition);
			const lastAtIndex = textBeforeCursor.lastIndexOf('@');

			if (lastAtIndex !== -1) {
				const newValue =
					value.substring(0, lastAtIndex) +
					'@' + columnName + ' ' +
					value.substring(cursorPosition);

				handleConfigChange('aiPrompt', newValue);
				setShowSuggestions(false);

				// Focus lại textarea
				setTimeout(() => {
					textareaElement.focus();
					const newCursorPos = lastAtIndex + columnName.length + 2;
					textareaElement.setSelectionRange(newCursorPos, newCursorPos);
				}, 0);
			}
		}
	};

	// Xử lý thêm/xóa điều kiện cho manual mode
	const handleAddCondition = () => {
		const newCondition = {
			id: Date.now(),
			column: '',
			operator: '>',
			value: '',
			thenValue: '',
		};

		const newConfig = {
			...config,
			conditions: [...config.conditions, newCondition],
		};
		setConfig(newConfig);

		if (onChange) {
			onChange(newConfig);
		}
	};

	const handleRemoveCondition = (id) => {
		const newConfig = {
			...config,
			conditions: config.conditions.filter(c => c.id !== id),
		};
		setConfig(newConfig);

		if (onChange) {
			onChange(newConfig);
		}
	};

	const handleConditionChange = (id, field, value) => {
		const newConfig = {
			...config,
			conditions: config.conditions.map(c =>
				c.id === id ? { ...c, [field]: value } : c,
			),
		};
		setConfig(newConfig);

		if (onChange) {
			onChange(newConfig);
		}
	};

	return (
		<div style={{ maxWidth: '100%', padding: '16px' }}>
			<Form layout="vertical">
				{/* Target Column - chỉ hiển thị khi không tạo cột mới */}
				{!config.createNewColumn && (
					<Form.Item
						label="Cột cần điền"
						required={config.onlyProcessEmptyRows}
						validateStatus={config.onlyProcessEmptyRows && !config.targetColumn ? 'error' : ''}
						help={config.onlyProcessEmptyRows && !config.targetColumn ? 'Bắt buộc chọn cột đích khi bật "Chỉ xử lý các dòng trống"' : ''}
					>
						<Select
							value={config.targetColumn}
							onChange={(value) => handleConfigChange('targetColumn', value)}
							placeholder="Chọn cột cần điền"
							virtual={false}
						>
							{sourceColumns.map(col => (
								<Option key={col} value={col}>{col}</Option>
							))}
						</Select>
					</Form.Item>
				)}

				{/* Create New Column */}
				<Form.Item>
					<Space>
						<Switch
							checked={config.createNewColumn}
							onChange={(checked) => handleConfigChange('createNewColumn', checked)}
						/>
						<span>Tạo cột mới</span>
					</Space>
				</Form.Item>

				{config.createNewColumn && (
					<Form.Item label="Tên cột mới" required>
						<Input
							value={config.newColumnName}
							onChange={(e) => handleConfigChange('newColumnName', e.target.value)}
							placeholder="Nhập tên cột mới"
						/>
					</Form.Item>
				)}

				{/* Only Process Empty Rows Option */}
				<Form.Item>
					<Space>
						<Switch
							checked={config.onlyProcessEmptyRows}
							onChange={(checked) => handleConfigChange('onlyProcessEmptyRows', checked)}
						/>
						<span>Chỉ xử lý các dòng trống ở cột output</span>
					</Space>
					{config.onlyProcessEmptyRows && (
						<div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
							⚠️ Khi bật tùy chọn này, chỉ những dòng có giá trị trống (null, undefined, "") ở cột đích
							mới được xử lý.
							Các dòng đã có dữ liệu sẽ được giữ nguyên.
						</div>
					)}
				</Form.Item>

				{/*/!* AI Mode Switch *!/*/}
				{/*<Form.Item>*/}
				{/*	<Space>*/}
				{/*		<Switch*/}
				{/*			checked={config.useAI}*/}
				{/*			onChange={(checked) => handleConfigChange('useAI', checked)}*/}
				{/*		/>*/}
				{/*		<span>Sử dụng AI</span>*/}
				{/*	</Space>*/}
				{/*</Form.Item>*/}

				{config.useAI ? (
					/* AI Mode */
					<div style={{ position: 'relative', width: '100%' }}>
						<Form.Item label="Mô tả yêu cầu cho AI" required>
							<TextArea
								data-testid="ai-prompt-textarea"
								value={config.aiPrompt}
								onChange={handleAIPromptChange}
								placeholder="Mô tả yêu cầu để AI tạo điều kiện IF-THEN-ELSE. Gõ @ để chọn cột..."
								rows={4}
								onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
							/>
							<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
								💡 Gõ @ để chọn cột từ dữ liệu nguồn. AI sẽ chỉ nhận unique values của các cột được chọn
								thay vì toàn bộ dữ liệu.
							</div>
						</Form.Item>

						{/* Suggestion Dropdown */}
						{(() => {
							if (showSuggestions && filteredColumns.length > 0) {
								return (
									<div
										style={{
											position: 'absolute',
											top: suggestionPosition.top,
											left: suggestionPosition.left,
											backgroundColor: 'white',
											border: '1px solid #d9d9d9',
											borderRadius: '4px',
											boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
											zIndex: 1000,
											maxHeight: '200px',
											overflowY: 'auto',
											minWidth: '200px',
										}}
									>
										{filteredColumns.map(col => (
											<div
												key={col}
												style={{
													padding: '8px 12px',
													cursor: 'pointer',
													borderBottom: '1px solid #f0f0f0',
												}}
												onMouseDown={() => handleSelectColumn(col)}
												onMouseEnter={(e) => {
													e.target.style.backgroundColor = '#f5f5f5';
												}}
												onMouseLeave={(e) => {
													e.target.style.backgroundColor = 'white';
												}}
											>
												<span style={{ fontWeight: 'bold' }}>@{col}</span>
											</div>
										))}
									</div>
								);
							}
							return null;
						})()}

						{/* Preview mentioned columns */}
						{config.aiPrompt && (
							<div style={{ marginTop: '8px' }}>
								<div style={{ fontSize: '12px', color: '#666' }}>
									Các cột được chọn: {
									(() => {
										const matches = config.aiPrompt.match(/@(\w+)/g);
										return matches ? matches.map(match => match.replace('@', '')).join(', ') : 'Không có';
									})()
								}
								</div>
							</div>
						)}
					</div>
				) : (
					/* Manual Mode */
					<div>
						<Form.Item label="Điều kiện IF-THEN">
							<Space direction="vertical" style={{ width: '100%' }}>
								{config.conditions.map((condition, index) => (
									<Card key={condition.id} size="small" style={{ marginBottom: '8px' }}>
										<Row gutter={8} align="middle">
											<Col span={1}>
												<span style={{ fontWeight: 'bold' }}>IF</span>
											</Col>
											<Col span={4}>
												<Select
													value={condition.column}
													onChange={(value) => handleConditionChange(condition.id, 'column', value)}
													placeholder="Chọn cột"
													size="small"
												>
													{sourceColumns.map(col => (
														<Option key={col} value={col}>{col}</Option>
													))}
												</Select>
											</Col>
											<Col span={7}>
												<Select
													value={condition.operator}
													onChange={(value) => handleConditionChange(condition.id, 'operator', value)}
													size="small"
												>
													<Option value=">">{'>'}</Option>
													<Option value=">=">{'>='}</Option>
													<Option value="<">{'<'}</Option>
													<Option value="<=">{'<='}</Option>
													<Option value="=">=</Option>
													<Option value="!=">!=</Option>
													<Option value="contains">chứa</Option>
													<Option value="starts_with">bắt đầu với</Option>
													<Option value="top_largest">top lớn nhất</Option>
													<Option value="top_smallest">top nhỏ nhất</Option>
													<Option value="is_not_null">không có giá trị (isNotNull)</Option>
													<Option value="is_not_number">không phải số</Option>
													<Option value="is_number">là số</Option>
												</Select>
											</Col>
											<Col span={4}>
												{condition.operator === 'is_not_null' || condition.operator === 'is_not_number' || condition.operator === 'is_number' ? (
													<div style={{
														padding: '4px 8px',
														fontSize: '12px',
														color: '#666',
														backgroundColor: '#f5f5f5',
														borderRadius: '4px',
													}}>
														Không cần giá trị
													</div>
												) : condition.operator === 'top_largest' || condition.operator === 'top_smallest' ? (
													<Input
														value={condition.value}
														onChange={(e) => handleConditionChange(condition.id, 'value', e.target.value)}
														placeholder="Số lượng (VD: 5)"
														size="small"
														type="number"
													/>
												) : (
													<Input
														value={condition.value}
														onChange={(e) => handleConditionChange(condition.id, 'value', e.target.value)}
														placeholder="Giá trị"
														size="small"
													/>
												)}
											</Col>
											<Col span={2}>
												<span style={{ fontWeight: 'bold' }}>THEN</span>
											</Col>
											<Col span={4}>
												<Input
													value={condition.thenValue}
													onChange={(e) => handleConditionChange(condition.id, 'thenValue', e.target.value)}
													placeholder="Giá trị điền"
													size="small"
												/>
											</Col>
											<Col span={2}>
												<Button
													type="text"
													icon={<DeleteOutlined />}
													onClick={() => handleRemoveCondition(condition.id)}
													size="small"
													danger
												/>
											</Col>
										</Row>
									</Card>
								))}

								<Button
									type="dashed"
									onClick={handleAddCondition}
									icon={<PlusOutlined />}
									style={{ width: '100%' }}
								>
									Thêm điều kiện
								</Button>
							</Space>
						</Form.Item>

						<Form.Item label="Giá trị ELSE (mặc định)">
							<Input
								value={config.elseValue}
								onChange={(e) => handleConfigChange('elseValue', e.target.value)}
								placeholder="Giá trị khi không điều kiện nào đúng"
							/>
						</Form.Item>
					</div>
				)}

				{/* Logic Preview */}
				<Form.Item label="Xem trước logic">
					<div style={{
						padding: '8px',
						backgroundColor: '#f5f5f5',
						borderRadius: '4px',
						fontSize: '12px',
						fontFamily: 'monospace',
					}}>
						{config.useAI ? (
							<div>
								<div><strong>Sử dụng AI:</strong></div>
								<div>Target: {config.createNewColumn ? config.newColumnName : config.targetColumn}</div>
								<div>Prompt: "{config.aiPrompt}"</div>
								<div>Mentioned columns: {(() => {
									const matches = config.aiPrompt.match(/@(\w+)/g);
									return matches ? matches.join(', ') : 'None';
								})()}</div>
								<div>Available columns: {sourceColumns.join(', ')}</div>
								<div style={{ color: config.onlyProcessEmptyRows ? '#1890ff' : '#666' }}>
									<strong>Chỉ xử lý dòng
										trống: {config.onlyProcessEmptyRows ? 'Có' : 'Không'}</strong>
									{config.onlyProcessEmptyRows && (
										<div style={{ marginLeft: '10px', fontSize: '11px' }}>
											→ Chỉ cập nhật dòng có giá trị trống ở cột
											"{config.createNewColumn ? config.newColumnName : config.targetColumn}"
										</div>
									)}
								</div>
							</div>
						) : (
							<div>
								<div>Target: {config.createNewColumn ? config.newColumnName : config.targetColumn}</div>
								{config.conditions.map((condition, index) => (
									<div key={condition.id}>
										IF {condition.column} {getOperatorDisplayText(condition.operator)} {condition.operator === 'is_not_null' || condition.operator === 'is_not_number' || condition.operator === 'is_number' ? '' : `"${condition.value}"`} THEN
										"{condition.thenValue}"
									</div>
								))}
								<div>ELSE "{config.elseValue}"</div>
								<div style={{ color: config.onlyProcessEmptyRows ? '#1890ff' : '#666' }}>
									<strong>Chỉ xử lý dòng
										trống: {config.onlyProcessEmptyRows ? 'Có' : 'Không'}</strong>
									{config.onlyProcessEmptyRows && (
										<div style={{ marginLeft: '10px', fontSize: '11px' }}>
											→ Chỉ cập nhật dòng có giá trị trống ở cột
											"{config.createNewColumn ? config.newColumnName : config.targetColumn}"
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</Form.Item>
			</Form>
		</div>
	);
};

export default SmartFillConfig; 