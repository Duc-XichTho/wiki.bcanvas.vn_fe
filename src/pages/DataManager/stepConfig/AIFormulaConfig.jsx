import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import {
	Card,
	Form,
	Input,
	Button,
	Select,
	Switch,
	Space,
	Row,
	Col,
	Tooltip,
	message,
	Modal,
	Table,
	Tag,
	Spin,
} from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined, ExperimentOutlined } from '@ant-design/icons';
import { MODEL_TEXT_AI_LIST } from '../../../CONST.js';
import { testAIFormula } from '../main/tableData/logic/LogicPipeLine.js';
import { aiGen2 } from '../../../apis/botService.jsx';
import { updateUsedTokenApp } from '../main/tableData/logic/LogicPipeLine.js';
import { MyContext } from '../../../MyContext.jsx';

const { Option } = Select;
const { TextArea } = Input;

const AIFormulaConfig = ({
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
							 getTemplateRow = null,
						 }) => {
	const { currentUser } = useContext(MyContext);
	// Memoize initial config to prevent unnecessary re-renders
	const memoizedInitialConfig = useMemo(() => initialConfig, [
		initialConfig.aiPrompt,
		initialConfig.targetColumn,
		initialConfig.createNewColumn,
		initialConfig.newColumnName,
		initialConfig.useCustomInput,
		initialConfig.inputStepId,
	]);

	const [config, setConfig] = useState({
		aiPrompt: '',
		targetColumn: '',
		createNewColumn: false,
		newColumnName: '',
		aiModel: MODEL_TEXT_AI_LIST[0].value, // Model AI mặc định
		...memoizedInitialConfig,
	});


	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
	const [filteredColumns, setFilteredColumns] = useState([]);
	const [mentionSearch, setMentionSearch] = useState('');
	const [sourceColumns, setSourceColumns] = useState([]);

	// Test modal states
	const [testModalVisible, setTestModalVisible] = useState(false);
	const [testResults, setTestResults] = useState(null);
	const [isTesting, setIsTesting] = useState(false);

	// Reset config khi memoizedInitialConfig thay đổi (khi mở modal edit step khác)
	useEffect(() => {
		setConfig({
			aiPrompt: '',
			targetColumn: '',
			createNewColumn: false,
			newColumnName: '',
			aiModel: MODEL_TEXT_AI_LIST[0].value, // Model AI mặc định
			...memoizedInitialConfig,
		});
	}, [memoizedInitialConfig]);

	// Tính toán sourceColumns dựa trên nguồn dữ liệu được chọn
	useEffect(() => {
		let columns = [];

		if (memoizedInitialConfig.useCustomInput && memoizedInitialConfig.inputStepId !== undefined && memoizedInitialConfig.inputStepId !== null) {
			// Sử dụng step được chọn làm nguồn dữ liệu
			if (memoizedInitialConfig.inputStepId === 0) {
				// Sử dụng dữ liệu gốc - lấy từ availableColumns
				columns = availableColumns;
			} else {
				// Sử dụng outputColumns từ step được chọn
				const selectedStep = steps.find(s => s.id === memoizedInitialConfig.inputStepId);
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

		console.log('AIFormulaConfig - Source columns updated:', columns);
		setSourceColumns(columns);
	}, [memoizedInitialConfig.useCustomInput, memoizedInitialConfig.inputStepId, currentStepId, steps, availableColumns]);

	// Xử lý thay đổi config
	const handleConfigChange = useCallback((key, value) => {
		console.log(`AIFormulaConfig: Config field "${key}" changed to:`, value);
		const newConfig = {
			...config,
			[key]: value,
		};
		setConfig(newConfig);

		// Gọi onChange để cập nhật parent component
		if (onChange) {
			onChange(newConfig);
		}
	}, [config, onChange]);

	// Xử lý AI prompt với @ mention
	const handleAIPromptChange = (e) => {
		const value = e.target.value;
		const cursorPosition = e.target.selectionStart;

		// Tìm vị trí @ gần nhất trước cursor
		const textBeforeCursor = value.substring(0, cursorPosition);
		const lastAtIndex = textBeforeCursor.lastIndexOf('@');

		if (lastAtIndex !== -1) {
			const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

			// Nếu không có khoảng trắng sau @, hiển thị suggestions
			if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
				setMentionSearch(textAfterAt);
				setShowSuggestions(true);

				// Lọc columns dựa trên search
				const filtered = sourceColumns.filter(col =>
					col.toLowerCase().includes(textAfterAt.toLowerCase()),
				);
				setFilteredColumns(filtered);

				// Tính toán vị trí hiển thị suggestions
				const textarea = e.target;
				const rect = textarea.getBoundingClientRect();
				setSuggestionPosition({
					top: rect.top + 20,
					left: rect.left + (lastAtIndex * 8), // Ước tính vị trí
				});
			} else {
				setShowSuggestions(false);
			}
		} else {
			setShowSuggestions(false);
		}

		handleConfigChange('aiPrompt', value);
	};

	// Xử lý chọn column từ suggestions
	const handleSelectColumn = (columnName) => {
		const currentPrompt = config.aiPrompt;
		const cursorPosition = document.activeElement.selectionStart;

		// Tìm vị trí @ gần nhất trước cursor
		const textBeforeCursor = currentPrompt.substring(0, cursorPosition);
		const lastAtIndex = textBeforeCursor.lastIndexOf('@');

		if (lastAtIndex !== -1) {
			// Lấy text sau @ trong phần textBeforeCursor
			const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

			// Tìm vị trí kết thúc của mention
			let endOfMention = lastAtIndex + 1 + textAfterAt.length; // Mặc định là cuối textAfterAt

			// Tìm vị trí kết thúc của text đang được gõ sau @ (tìm ký tự kết thúc)
			for (let i = 0; i < textAfterAt.length; i++) {
				const char = textAfterAt[i];
				if (char === ' ' || char === '\n' || char === '\t' || char === ',' || char === ';' || char === ')') {
					endOfMention = lastAtIndex + 1 + i;
					break;
				}
			}

			// Tạo prompt mới: text trước @ + @ + tên cột + text sau vị trí kết thúc mention
			const newPrompt = currentPrompt.substring(0, lastAtIndex + 1) +
				columnName +
				currentPrompt.substring(endOfMention);

			handleConfigChange('aiPrompt', newPrompt);
		}

		setShowSuggestions(false);
	};

	// Xử lý keydown để đóng suggestions
	const handleKeyDown = (e) => {
		if (e.key === 'Escape') {
			setShowSuggestions(false);
		}
	};

	// Xử lý click outside để đóng suggestions
	useEffect(() => {
		const handleClickOutside = () => {
			setShowSuggestions(false);
		};

		if (showSuggestions) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	}, [showSuggestions]);

	// Hàm xử lý test AI Formula
	const handleTestAIFormula = async () => {
		if (!config.aiPrompt.trim()) {
			message.warning('Vui lòng nhập AI Prompt trước khi test');
			return;
		}

		setIsTesting(true);
		setTestModalVisible(true);

		try {
			let testData = null;

			console.log('AIFormulaConfig - templateData:', templateData);
			console.log('AIFormulaConfig - templateData type:', typeof templateData);
			console.log('AIFormulaConfig - templateData isArray:', Array.isArray(templateData));

			// Xử lý templateData nếu có
			if (templateData) {
				if (Array.isArray(templateData)) {
					// Nếu templateData đã là array
					testData = templateData;
				} else if (templateData.rows && Array.isArray(templateData.rows)) {
					// Nếu templateData có cấu trúc { rows: [...] }
					testData = templateData.rows.map(row => row.data);
				} else if (templateData.data && Array.isArray(templateData.data)) {
					// Nếu templateData có cấu trúc { data: [...] }
					testData = templateData.data;
				}
			}

			// Nếu không có testData hợp lệ, tự động lấy dữ liệu
			if (!testData || !Array.isArray(testData) || testData.length === 0) {
				if (!templateData?.id || !getTemplateRow) {
					message.error('Không thể lấy dữ liệu để test. Vui lòng kiểm tra kết nối.');
					setIsTesting(false);
					return;
				}

				message.loading('Đang lấy dữ liệu để test...', 0);

				try {
					// Lấy dữ liệu gốc từ database
					const dataResponse = await getTemplateRow(templateData.id, null, false);
					console.log('AIFormulaConfig - dataResponse:', dataResponse);

					// Kiểm tra cấu trúc dữ liệu
					if (dataResponse && dataResponse.rows && Array.isArray(dataResponse.rows)) {
						const data = dataResponse.rows;
						console.log('AIFormulaConfig - data (rows):', data);
						// Sử dụng dữ liệu với cấu trúc .data để giống logic thực tế
						testData = data;
						console.log('AIFormulaConfig - testData after mapping:', testData);
					} else if (Array.isArray(dataResponse)) {
						// Nếu dataResponse đã là array
						console.log('AIFormulaConfig - dataResponse is array:', dataResponse);
						// Sử dụng dữ liệu với cấu trúc .data để giống logic thực tế
						testData = dataResponse;
						console.log('AIFormulaConfig - testData after mapping:', testData);
					} else {
						throw new Error('Dữ liệu không có cấu trúc hợp lệ');
					}

					message.destroy();

					if (!testData || !Array.isArray(testData) || testData.length === 0) {
						message.error('Không có dữ liệu để test');
						setIsTesting(false);
						return;
					}
				} catch (error) {
					message.destroy();
					console.error('Lỗi khi lấy dữ liệu:', error);
					message.error('Không thể lấy dữ liệu để test: ' + error.message);
					setIsTesting(false);
					return;
				}
			}

			const results = await testAIFormula(testData, config, aiGen2, updateUsedTokenApp);
			setTestResults(results);
		} catch (error) {
			console.error('Lỗi khi test AI Formula:', error);
			message.error('Có lỗi xảy ra khi test: ' + error.message);
			setTestResults({
				success: false,
				error: error.message,
				results: [],
			});
		} finally {
			setIsTesting(false);
		}
	};

	// Đóng modal test
	const handleCloseTestModal = () => {
		setTestModalVisible(false);
		setTestResults(null);
	};

	// Cột cho bảng kết quả test
	const testResultColumns = [
		{
			title: 'Dòng',
			dataIndex: 'rowIndex',
			key: 'rowIndex',
			width: 60,
			render: (index) => index + 1,
		},
		{
			title: 'Dữ liệu đầu vào',
			dataIndex: 'inputData',
			key: 'inputData',
			render: (data) => (
				<div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
					{JSON.stringify(data).substring(0, 100)}...
				</div>
			),
		},
		{
			title: 'Công thức',
			dataIndex: 'formula',
			key: 'formula',
			render: (formula) => (
				<code style={{ fontSize: '12px', background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>
					{formula}
				</code>
			),
		},
		{
			title: 'Kết quả',
			dataIndex: 'result',
			key: 'result',
			render: (result, record) => (
				<div>
					<div style={{ marginBottom: 4 }}>
						<Tag color={record.isValid ? 'green' : 'red'}>
							{record.isValid ? 'Hợp lệ' : 'Lỗi'}
						</Tag>
					</div>
					<div style={{ fontSize: '12px', color: record.isValid ? '#52c41a' : '#ff4d4f' }}>
						{typeof result === 'string' ? result : JSON.stringify(result)}
					</div>
				</div>
			),
		},
		{
			title: 'Lỗi',
			dataIndex: 'error',
			key: 'error',
			render: (error) => error ? (
				<div style={{ color: '#ff4d4f', fontSize: '12px' }}>
					{error}
				</div>
			) : '-',
		},
	];

	return (
		<div style={{ position: 'relative' }}>
			<Card size="small">
				<Form layout="vertical">
					{currentUser.isSuperAdmin &&
						<Form.Item label="Model AI">
							<Select
								value={config.aiModel}
								onChange={(value) => handleConfigChange('aiModel', value)}
								style={{ width: '100%' }}
								showSearch
								filterOption={(input, option) =>
									option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
								}
							>
								{MODEL_TEXT_AI_LIST.map(model => (
									<Option key={model.value} value={model.value}>
										{model.name}
									</Option>
								))}
							</Select>
							<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
								<InfoCircleOutlined /> Model AI sẽ được sử dụng để tạo công thức tính toán
							</div>
						</Form.Item>
					}

					<Form.Item label="AI Prompt">
						<TextArea
							value={config.aiPrompt}
							onChange={handleAIPromptChange}
							onKeyDown={handleKeyDown}
							placeholder="Nhập yêu cầu cho AI tạo công thức. Sử dụng @ để chọn cột..."
							rows={4}
							style={{ position: 'relative' }}
						/>
						<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
							💡 Sử dụng @ để chọn cột có sẵn. Ví dụ: "Tính tổng @số_lượng * @đơn_giá"
						</div>
					</Form.Item>

					<Form.Item label="Cột đích">
						<Row gutter={16}>
							<Col span={12}>
								<Switch
									checked={config.createNewColumn}
									onChange={(checked) => handleConfigChange('createNewColumn', checked)}
									checkedChildren="Tạo cột mới"
									unCheckedChildren="Ghi đè cột"
								/>
							</Col>
							<Col span={12}>
								{config.createNewColumn ? (
									<Input
										placeholder="Tên cột mới"
										value={config.newColumnName}
										onChange={(e) => handleConfigChange('newColumnName', e.target.value)}
									/>
								) : (
									<Select
										placeholder="Chọn cột để ghi đè"
										value={config.targetColumn}
										onChange={(value) => handleConfigChange('targetColumn', value)}
										style={{ width: '100%' }}
									>
										{sourceColumns.map(col => (
											<Option key={col} value={col}>{col}</Option>
										))}
									</Select>
								)}
							</Col>
						</Row>
					</Form.Item>

					<Form.Item>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<div style={{ fontSize: '12px', color: '#666' }}>
								<strong>Hướng dẫn sử dụng:</strong>
								<ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
									<li>Sử dụng @ để chọn cột có sẵn trong prompt</li>
									<li>AI sẽ tạo công thức JavaScript dựa trên yêu cầu của bạn</li>
									<li>Hỗ trợ các phép toán: +, -, *, /, xử lý chuỗi (cắt chuỗi)</li>
									<li>Ví dụ: "Tính tổng @số_lượng * @đơn_giá" hoặc "Lấy 3 ký tự đầu của @tên"</li>
								</ul>
							</div>
							<Button
								type="primary"
								icon={<ExperimentOutlined />}
								onClick={handleTestAIFormula}
								loading={isTesting}
								disabled={!config.aiPrompt.trim()}
								style={{ marginLeft: 16 }}
							>
								Test với 10 dòng dữ liệu
							</Button>
						</div>
					</Form.Item>
				</Form>
			</Card>

			{/* Suggestions dropdown */}
			{showSuggestions && filteredColumns.length > 0 && (
				<div
					style={{
						position: 'fixed',
						top: suggestionPosition.top,
						left: suggestionPosition.left,
						background: 'white',
						border: '1px solid #d9d9d9',
						borderRadius: '4px',
						boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
						zIndex: 1000,
						maxHeight: '200px',
						overflowY: 'auto',
						minWidth: '150px',
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
							onClick={() => handleSelectColumn(col)}
							onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
							onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
						>
							{col}
						</div>
					))}
				</div>
			)}

			{/* Test Results Modal */}
			<Modal
				title="Kết quả Test AI Formula"
				open={testModalVisible}
				onCancel={handleCloseTestModal}
				footer={[
					<Button key="close" onClick={handleCloseTestModal}>
						Đóng
					</Button>,
				]}
				width={1200}
				style={{ top: 20 }}
			>
				{isTesting ? (
					<div style={{ textAlign: 'center', padding: '40px' }}>
						<Spin size="large" />
						<div style={{ marginTop: 16, fontSize: '16px' }}>
							Đang test với 10 dòng dữ liệu ngẫu nhiên...
						</div>
					</div>
				) : testResults ? (
					<div>
						{testResults.success ? (
							<>
								{/* Summary */}
								<div style={{
									marginBottom: 16,
									padding: 16,
									background: '#f6ffed',
									border: '1px solid #b7eb8f',
									borderRadius: 6,
								}}>
									<h4 style={{ margin: 0, color: '#52c41a' }}>Tóm tắt kết quả</h4>
									<div style={{ marginTop: 8 }}>
										<Tag color="blue">Tổng số dòng: {testResults.summary?.total}</Tag>
										<Tag color="green">Thành công: {testResults.summary?.success}</Tag>
										<Tag color="red">Lỗi: {testResults.summary?.error}</Tag>
										<Tag color="purple">Tỷ lệ thành công: {testResults.summary?.successRate}%</Tag>
									</div>
									{testResults.formula && (
										<div style={{ marginTop: 8 }}>
											<strong>Công thức được tạo:</strong>
											<code style={{
												display: 'block',
												marginTop: 4,
												padding: '8px',
												background: '#f5f5f5',
												borderRadius: 4,
												fontSize: '12px',
												wordBreak: 'break-all',
											}}>
												{testResults.formula}
											</code>
										</div>
									)}
								</div>

								{/* Results Table */}
								<Table
									columns={testResultColumns}
									dataSource={testResults.results}
									pagination={false}
									size="small"
									scroll={{ x: 800 }}
									rowKey="rowIndex"
								/>
							</>
						) : (
							<div style={{ textAlign: 'center', padding: '40px' }}>
								<div style={{ color: '#ff4d4f', fontSize: '16px', marginBottom: 16 }}>
									❌ Test thất bại
								</div>
								<div style={{ color: '#666' }}>
									{testResults.error}
								</div>
							</div>
						)}
					</div>
				) : null}
			</Modal>
		</div>
	);
};

export default AIFormulaConfig;