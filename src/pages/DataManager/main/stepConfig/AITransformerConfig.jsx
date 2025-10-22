import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Card, Space, Select, Input, Switch, message, Alert, Button, Modal, Table, Tag, Spin } from 'antd';
import { InfoCircleOutlined, ExperimentOutlined } from '@ant-design/icons';
import { MODEL_TEXT_GEN_AI_LIST } from '../../../../CONST.js';
import { testAITransformer } from '../tableData/logic/LogicPipeLine.js';
import { aiGen2 } from '../../../../apis/botService.jsx';
import { updateUsedTokenApp } from '../tableData/logic/LogicPipeLine.js';
import { MyContext } from '../../../../MyContext.jsx';
import { getSettingByType, createSetting, updateSetting, getTypeSchema } from '../../../../apis/settingService.jsx';
import { getTemplateInfoByTableId, getAllTemplateTableInfo } from '../../../../apis/templateSettingService.jsx';

const { Option } = Select;
const { TextArea } = Input;

const AITransformerConfig = ({
								 initialConfig,
								 onChange,
								 availableColumns,
								 templateData = null,
								 getTemplateRow = null,
								 onTestStatusChange = null,
								 version = null,
							 }) => {
	const { currentUser } = useContext(MyContext);
	const [config, setConfig] = useState({
		conditionColumns: [],
		resultColumn: '',
		aiPrompt: '',
		aiModel: MODEL_TEXT_GEN_AI_LIST[2].value, // Model AI mặc định
		jobType: '',
		// Listing option cho categorize2/3
		listingOption: {
			lookupTable: '',
			lookupTableVersion: null,
			lookupColumn: '',
		},
		// Cấu hình mẫu cho template_based_categorize
		templateConfig: {
			templateConditionColumns: [], // Các cột điều kiện trong mẫu
			templateTargetColumn: '', // Cột đích trong mẫu
			templateCondition: '', // Điều kiện tìm ra mẫu
			templateFilterConditions: [], // Mảng các điều kiện lọc mẫu
			templateFilterOperator: '=', // Toán tử so sánh
			templateFilterValue: '', // Giá trị so sánh
		},
		// Thêm cấu hình lọc dữ liệu
		enableFilter: false,
		filterConditions: [], // Mảng các điều kiện lọc
		filterMode: 'include', // 'include' hoặc 'exclude'
		...initialConfig,
	});

	// Test modal states
	const [testModalVisible, setTestModalVisible] = useState(false);
	const [testResults, setTestResults] = useState(null);
	const [isTesting, setIsTesting] = useState(false);
	const [hasTestedSuccessfully, setHasTestedSuccessfully] = useState(false);

	// Track if user manually edits aiPrompt to avoid auto-overwrite
	const [isPromptManuallyEdited, setIsPromptManuallyEdited] = useState(false);

	// Admin-only: Manage system prompts per job type
	const [showSystemPromptModal, setShowSystemPromptModal] = useState(false);
	// Initialize prompts dynamically from JOB_TYPE_OPTIONS to support newly added job types
	const [jobSystemPrompts, setJobSystemPrompts] = useState({});

	const JOB_TYPE_OPTIONS = [
		{ label: 'Tổng hợp', value: 'summarize' },
		{ label: 'Làm giàu', value: 'enrich' },
		{ label: 'Chuẩn hóa địa chỉ', value: 'address_validate' },
		{ label: 'Chuẩn hóa tên người', value: 'name_parse' },
		{ label: 'Chuẩn hóa tên thực thể', value: 'measurement_unit' },
		{ label: 'Phân tích cảm xúc', value: 'categorize1' },
		{ label: 'Chọn nhóm khoản mục', value: 'categorize2' },
		{ label: 'Định khoản kế toán', value: 'categorize3' },
		{ label: 'Trích xuất cấu trúc', value: 'data_issue' },
		{ label: 'Chọn khoản mục dựa vào mẫu', value: 'template_based_categorize' },
	];

	// Ensure jobSystemPrompts always contains all keys from JOB_TYPE_OPTIONS
	useEffect(() => {
		const ensured = JOB_TYPE_OPTIONS.reduce((acc, opt) => {
			acc[opt.value] = (jobSystemPrompts && typeof jobSystemPrompts[opt.value] === 'string')
				? jobSystemPrompts[opt.value]
				: '';
			return acc;
		}, {});
		// Only update state if there's a difference to avoid re-renders
		const needUpdate = Object.keys(ensured).some(k => ensured[k] !== jobSystemPrompts[k])
			|| Object.keys(jobSystemPrompts || {}).some(k => !(k in ensured));
		if (needUpdate) setJobSystemPrompts(ensured);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(JOB_TYPE_OPTIONS)]);

	// Listing option states (reuse pattern from LookupConfig)
	const [templateTableList, setTemplateTableList] = useState([]);
	const [lookupTableInfo, setLookupTableInfo] = useState(null);
	const [availableVersions, setAvailableVersions] = useState([]);
	const [lookupTableColumns, setLookupTableColumns] = useState([]);
	const [loadingTable, setLoadingTable] = useState(false);
	const [changingVersion, setChangingVersion] = useState(false);

	// Load danh sách bảng cho Listing option
	useEffect(() => {
		getAllTemplateTableInfo().then(res => {
			setTemplateTableList(res.data || []);
		}).catch(() => {});
	}, []);

	// Khi chọn bảng cho Listing option → fetch info + versions
	useEffect(() => {
		const tableId = config?.listingOption?.lookupTable;
		if (tableId) {
			setLoadingTable(true);
			getTemplateInfoByTableId(tableId).then(tableInfo => {
				setLookupTableInfo(tableInfo);
				if (tableInfo.versions && Array.isArray(tableInfo.versions)) {
					setAvailableVersions(tableInfo.versions);
					if (config.listingOption.lookupTableVersion === null) {
						const defaultVersion = tableInfo.versions.find(v => v.version === null) || tableInfo.versions[0];
						updateConfig('listingOption', {
							...config.listingOption,
							lookupTableVersion: defaultVersion?.version !== undefined ? defaultVersion.version : null,
						});
					}
				} else {
					setAvailableVersions([]);
				}
				setLoadingTable(false);
			}).catch(() => {
				setLookupTableInfo(null);
				setAvailableVersions([]);
				setLookupTableColumns([]);
				setLoadingTable(false);
			});
		} else {
			setLookupTableInfo(null);
			setAvailableVersions([]);
			setLookupTableColumns([]);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config?.listingOption?.lookupTable]);

	// Khi version thay đổi → cập nhật danh sách cột
	useEffect(() => {
		const tableId = config?.listingOption?.lookupTable;
		const version = config?.listingOption?.lookupTableVersion;
		if (tableId && lookupTableInfo && version !== undefined) {
			setLoadingTable(true);
			const versionData = lookupTableInfo.versions?.find(v => v.version === version);
			if (versionData && versionData.columns) {
				let columns = [];
				if (Array.isArray(versionData.columns)) {
					columns = versionData.columns;
				} else {
					columns = versionData.columns.map(col => {
						if (typeof col === 'string') return col;
						if (col && typeof col === 'object') return col.name || col.column_name;
						return col;
					});
				}
				setLookupTableColumns(columns);
			} else {
				setLookupTableColumns([]);
			}
			setLoadingTable(false);
		} else {
			setLookupTableColumns([]);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config?.listingOption?.lookupTableVersion, lookupTableInfo]);

	useEffect(() => {
		if (initialConfig) {
			setConfig(prev => ({ ...prev, ...initialConfig }));
		}
	}, [initialConfig]);

	// Thông báo trạng thái test ra ngoài
	useEffect(() => {
		if (onTestStatusChange) {
			onTestStatusChange(hasTestedSuccessfully);
		}
	}, [hasTestedSuccessfully, onTestStatusChange]);

	// Debug availableColumns
	useEffect(() => {
		if (availableColumns && availableColumns.length > 0) {
		}
	}, [availableColumns]);

	const handleConfigChange = (newConfig) => {
		setConfig(newConfig);
		onChange(newConfig);
	};

	// Helper: generate user prompt from jobType and condition columns
	const generateUserPrompt = (jobTypeValue, conditionCols) => {
		const jobLabel = JOB_TYPE_OPTIONS.find(j => j.value === jobTypeValue)?.label || '';
		const cols = Array.isArray(conditionCols) ? conditionCols.filter(Boolean) : [];
		const colsText = cols.map(c => `\`${c}\``).join(', ');
		if (!jobLabel) return '';
		const basePrefix = cols.length > 0
			? `Dựa trên dữ liệu từ các trường ${colsText}, `
			: 'Dựa trên dữ liệu đầu vào, ';
		// Custom defaults per request
		if (jobTypeValue === 'categorize1') {
			return `${basePrefix}hãy phân tích cảm xúc và trả về duy nhất một trong các giá trị: Trung lập, Tiêu cực, Tích cực.`;
		}
		if (jobTypeValue === 'data_issue') {
			return `${basePrefix}hãy trích xuất cấu trúc theo định dạng: \"Sản phẩm; Số điện thoại; Địa chỉ\".`;
		}
		// For other jobs (though aiPrompt UI sẽ ẩn), vẫn tạo chuỗi chung nếu cần
		return `Thực hiện tác vụ \`${jobLabel}\` ${cols.length > 0 ? `với dữ liệu từ các trường ${colsText}` : 'với dữ liệu đầu vào'} và trả về kết quả`;
	};

	// Chỉ thay thế phần danh sách cột trong prompt nếu khớp mẫu quen thuộc
	const replaceConditionColumnsInPrompt = (currentPrompt, conditionCols) => {
		if (typeof currentPrompt !== 'string') return currentPrompt;
		const cols = Array.isArray(conditionCols) ? conditionCols.filter(Boolean) : [];
		const colsText = cols.map(c => `\`${c}\``).join(', ');
		const hasCols = cols.length > 0;

		// Mẫu 1: "Dựa trên dữ liệu từ các trường <...>, hãy"
		const withColsPattern = /(Dựa trên dữ liệu từ các trường )(.*?)(,\s*hãy)/i;
		// Mẫu 2: "Dựa trên dữ liệu đầu vào, " → chuyển sang dạng có cột
		const inputPattern = /(Dựa trên dữ liệu đầu vào,\s*)/i;

		if (withColsPattern.test(currentPrompt)) {
			if (hasCols) {
				return currentPrompt.replace(withColsPattern, `$1${colsText}$3`);
			}
			// Không có cột → đổi sang câu generic dữ liệu đầu vào
			return currentPrompt.replace(withColsPattern, `Dựa trên dữ liệu đầu vào$3`);
		}

		if (hasCols && inputPattern.test(currentPrompt)) {
			return currentPrompt.replace(inputPattern, `Dựa trên dữ liệu từ các trường ${colsText}, `);
		}

		return currentPrompt;
	};

	const updateConfig = (key, value) => {
		let newConfig = { ...config, [key]: value };
		// Mark manual edit when aiPrompt is directly changed by user
		if (key === 'aiPrompt') {
			setIsPromptManuallyEdited(true);
		}
		// Auto-generate aiPrompt when jobType or conditionColumns change, but respect manual edits
		if (key === 'jobType' || key === 'conditionColumns') {
			const jobTypeValue = key === 'jobType' ? value : newConfig.jobType;
			const conditionCols = key === 'conditionColumns' ? value : newConfig.conditionColumns;
			if (!isPromptManuallyEdited || (newConfig.aiPrompt || '').trim() === '') {
				newConfig.aiPrompt = generateUserPrompt(jobTypeValue, conditionCols);
			} else if (key === 'conditionColumns') {
				// Người dùng đã sửa prompt: chỉ thay thế danh sách cột nếu nhận diện được phần đó
				newConfig.aiPrompt = replaceConditionColumnsInPrompt(newConfig.aiPrompt, conditionCols);
			}
		}
		// Reset test status on listing option change as well
		if (key === 'listingOption') {
			// keep aiPrompt, just invalidate previous tests
		}
		handleConfigChange(newConfig);
		setTestResults(null);
		// Reset trạng thái test khi config thay đổi
		if (hasTestedSuccessfully) {
			setHasTestedSuccessfully(false);
		}
	};

	const openSystemPromptModal = async () => {
		try {
			const existing = await getSettingByType('AI_TRANSFORMER_JOB_PROMPTS');
			const defaultSetting = await getTypeSchema('master', 'AI_TRANSFORMER_JOB_PROMPTS');
			const currentMap = (existing && existing.setting) ? existing.setting : {};
			const defaultMap = (defaultSetting && defaultSetting.setting) ? defaultSetting.setting : {};
			// Per-key merge: lấy từng jobType, ưu tiên current, thiếu thì lấy từ master
			const merged = {};
			JOB_TYPE_OPTIONS.forEach(opt => {
				const key = opt.value;
				if (currentMap && typeof currentMap[key] === 'string' && currentMap[key].trim() !== '') {
					merged[key] = currentMap[key];
				} else if (defaultMap && typeof defaultMap[key] === 'string' && defaultMap[key].trim() !== '') {
					merged[key] = defaultMap[key];
				} else {
					merged[key] = '';
				}
			});
			setJobSystemPrompts(prev => ({ ...prev, ...merged }));
			setShowSystemPromptModal(true);
		} catch (e) {
			console.error('Lỗi khi tải System Prompt:', e);
			message.error('Không tải được System Prompt');
		}
	};

	const handleSaveSystemPrompts = async () => {
		try {
			const existing = await getSettingByType('AI_TRANSFORMER_JOB_PROMPTS');
			if (existing && existing.id) {
				await updateSetting({ ...existing, setting: jobSystemPrompts });
			} else {
				await createSetting({ type: 'AI_TRANSFORMER_JOB_PROMPTS', setting: jobSystemPrompts });
			}
			setShowSystemPromptModal(false);
			message.success('Đã lưu System Prompt cho các Job Type');
		} catch (e) {
			console.error('Lỗi lưu System Prompt:', e);
			message.error('Có lỗi khi lưu System Prompt');
		}
	};
	// Tạo options cho Select components - xử lý cả string và object
	const createOptions = (columns) => {
		return columns.map(col => {
			// Xử lý cả trường hợp col là string hoặc object
			const label = typeof col === 'string' ? col : (col.name || col.title || col);
			const value = typeof col === 'string' ? col : (col.name || col.title || col);
			return { label, value };
		});
	};

	const columnOptions = useMemo(() => createOptions(availableColumns), [availableColumns]);

	// Hàm xử lý test AI Transformer
	const handleTestAITransformer = async () => {
		// Validation cho job type template_based_categorize
		if (config.jobType === 'template_based_categorize') {
			if (!config.templateConfig?.templateConditionColumns || config.templateConfig.templateConditionColumns.length === 0) {
				message.warning('Vui lòng chọn ít nhất một cột điều kiện trong mẫu');
				return;
			}

			if (!config.templateConfig?.templateTargetColumn?.trim()) {
				message.warning('Vui lòng chọn cột đích trong mẫu');
				return;
			}

			if (!config.templateConfig?.templateFilterOperator) {
				message.warning('Vui lòng chọn toán tử so sánh');
				return;
			}
			
			if (!['is_empty', 'is_not_empty'].includes(config.templateConfig.templateFilterOperator) && !config.templateConfig?.templateFilterValue?.trim()) {
				message.warning('Vui lòng nhập giá trị so sánh');
				return;
			}

			if (!config.conditionColumns || config.conditionColumns.length === 0) {
				message.warning('Vui lòng chọn ít nhất một cột điều kiện');
				return;
			}

			if (!config.resultColumn.trim()) {
				message.warning('Vui lòng nhập tên cột kết quả');
				return;
			}

			// Kiểm tra listing option nếu có
			if (config.listingOption && config.listingOption.lookupTable && config.listingOption.lookupTableVersion !== undefined && !config.listingOption.lookupColumn) {
				message.warning('Vui lòng chọn cột danh mục trong listing option');
				return;
			}
		} else {
			// Validation cho các job type khác
			if (!config.aiPrompt.trim()) {
				message.warning('Vui lòng nhập AI Prompt trước khi test');
				return;
			}

			if (!config.conditionColumns || config.conditionColumns.length === 0) {
				message.warning('Vui lòng chọn ít nhất một cột điều kiện');
				return;
			}

			if (!config.resultColumn.trim()) {
				message.warning('Vui lòng nhập tên cột kết quả');
				return;
			}
		}

		setIsTesting(true);
		setTestModalVisible(true);

		try {
			let testData = null;

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
					let steps = templateData.steps;
					let idVersion = steps[steps.length - 1]?.id || null;
					idVersion = (idVersion == 2 || idVersion == 1) ? null : idVersion - 1;
					const dataResponse = await getTemplateRow(templateData.id, idVersion, false, 1, 20);
					// Kiểm tra cấu trúc dữ liệu
					if (dataResponse && dataResponse.rows && Array.isArray(dataResponse.rows)) {
						const data = dataResponse.rows;
						testData = data.map(row => row.data);
					} else if (Array.isArray(dataResponse)) {
						testData = dataResponse.map(row => row.data);
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
			const results = await testAITransformer(testData, config, aiGen2, updateUsedTokenApp);
			console.log(results)
			setTestResults(results);

			// Cập nhật trạng thái test thành công (bất kể tỷ lệ)
			setHasTestedSuccessfully(true);

			if (results && results.success && results.summary && results.summary.successRate == 100) {
				message.success('Test thành công! Bạn có thể thêm step này.');
			} else {
				message.warning('Test hoàn thành. Bạn vẫn có thể lưu cấu hình này.');
			}

		} catch (error) {
			console.error('Lỗi khi test AI Transformer:', error);
			message.error('Có lỗi xảy ra khi test: ' + error.message);
			setTestResults({
				success: false,
				error: error.message,
				results: [],
			});
			setHasTestedSuccessfully(false);
		} finally {
			setIsTesting(false);
		}
	};

	// Đóng modal test
	const handleCloseTestModal = () => {
		setTestModalVisible(false);
		// setTestResults(null);
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
			title: 'Kết quả AI',
			dataIndex: 'aiResult',
			key: 'aiResult',
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
		<Space direction="vertical" style={{ width: '100%' }} size="large">
			<Card title="" size="small">
				<Space direction="vertical" style={{ width: '100%' }} size="middle">
					{/* Job Type */}
					<div>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
						Job Type <span style={{ color: 'red' }}>*</span>
					</label>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
						{JOB_TYPE_OPTIONS.map(opt => (
							<Button
								key={opt.value}
								type={config.jobType === opt.value ? 'primary' : 'default'}
								onClick={() => updateConfig('jobType', opt.value)}
							>
								{opt.label}
							</Button>
						))}
					</div>
						<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
							<InfoCircleOutlined /> Chọn loại công việc để AI hiểu ngữ cảnh xử lý
						</div>
					</div>
					{/* Chọn cột điều kiện */}
					<div>
						<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
							Cột điều kiện <span style={{ color: 'red' }}>*</span>
						</label>
						<Select
							mode="multiple"
							placeholder="Chọn các cột điều kiện"
							value={config.conditionColumns}
							onChange={(value) => updateConfig('conditionColumns', value)}
							style={{ width: '100%' }}
							options={columnOptions}
							virtual={false}
						/>
						<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
							<InfoCircleOutlined /> Các cột này sẽ được sử dụng làm input cho AI để tạo ra cột kết quả
						</div>
					</div>

					{/* Tên cột kết quả */}
					<div>
						<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
							Tên cột kết quả <span style={{ color: 'red' }}>*</span>
						</label>
						<Input
							placeholder="Nhập tên cho cột kết quả mới"
							value={config.resultColumn}
							onChange={(e) => updateConfig('resultColumn', e.target.value)}
							style={{ width: '100%' }}
						/>
						<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
							<InfoCircleOutlined /> Tên cột mới sẽ được tạo để chứa kết quả từ AI
						</div>
					</div>

					{/* Chọn Model AI */}
					{currentUser.isSuperAdmin &&
						<div>
							<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
								Model AI <span style={{ color: 'red' }}>*</span>
							</label>
							<Select
								placeholder="Chọn model AI"
								value={config.aiModel}
								onChange={(value) => updateConfig('aiModel', value)}
								style={{ width: '100%' }}
								showSearch
								filterOption={(input, option) =>
									option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
								}
							>
								{MODEL_TEXT_GEN_AI_LIST.map(model => (
									<Option key={model.value} value={model.value}>
										{model.name}
									</Option>
								))}
							</Select>
							<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
								<InfoCircleOutlined /> Model AI sẽ được sử dụng để xử lý dữ liệu
							</div>
						</div>
					}

					{/* Thông tin về chế độ xử lý */}
					<div>
						<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
							Chế độ xử lý
						</label>
						<div style={{
							padding: '12px',
							backgroundColor: '#f6f8fa',
							border: '1px solid #d0d7de',
							borderRadius: '6px',
							fontSize: '14px',
							color: '#656d76',
						}}>
							<InfoCircleOutlined style={{ marginRight: '8px' }} />
							Luôn tạo cột mới và xử lý tất cả các dòng dữ liệu
						</div>
					</div>

				{/* Prompt cho AI */}
				{(config.jobType === 'categorize1' || config.jobType === 'data_issue') && (
					<div>
						<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
							Nội dung nhiệm vụ <span style={{ color: 'red' }}>*</span>
						</label>
						<TextArea
							placeholder="Prompt sẽ được tự động tạo theo Job Type và các cột điều kiện"
							value={config.aiPrompt}
							onChange={(e) => updateConfig('aiPrompt', e.target.value)}
							rows={6}
							style={{ width: '100%' }}
							readOnly={false}
						/>
						<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
							<InfoCircleOutlined /> Prompt này sẽ được gửi đến AI cùng với dữ liệu từ các cột điều kiện.
						</div>
					</div>
				)}

				{/* Cấu hình mẫu cho template_based_categorize */}
				{config.jobType === 'template_based_categorize' && (
					<Card title="Cấu hình mẫu" size="small" style={{ marginTop: 12 }}>
						<Space direction="vertical" style={{ width: '100%' }} size="middle">
							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
									Cột điều kiện trong mẫu <span style={{ color: 'red' }}>*</span>
								</label>
								<Select
									mode="multiple"
									placeholder="Chọn các cột điều kiện trong mẫu"
									value={config.templateConfig?.templateConditionColumns || []}
									onChange={(value) => updateConfig('templateConfig', { 
										...config.templateConfig, 
										templateConditionColumns: value 
									})}
									style={{ width: '100%' }}
									options={columnOptions}
								/>
								<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
									<InfoCircleOutlined /> Các cột này sẽ được sử dụng để tìm mẫu phù hợp
								</div>
							</div>

							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
									Cột đích trong mẫu <span style={{ color: 'red' }}>*</span>
								</label>
								<Select
									placeholder="Chọn cột đích trong mẫu"
									value={config.templateConfig?.templateTargetColumn || ''}
									onChange={(value) => updateConfig('templateConfig', { 
										...config.templateConfig, 
										templateTargetColumn: value 
									})}
									style={{ width: '100%' }}
									options={columnOptions}
								/>
								<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
									<InfoCircleOutlined /> Cột này chứa giá trị mẫu mà AI sẽ học và áp dụng
								</div>
							</div>

							<div>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
									Điều kiện tìm mẫu <span style={{ color: 'red' }}>*</span>
								</label>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<span style={{ fontWeight: 'bold' }}>Cột đích</span>
									<Select
										value={config.templateConfig?.templateFilterOperator || '='}
										onChange={(value) => updateConfig('templateConfig', { 
											...config.templateConfig, 
											templateFilterOperator: value 
										})}
										style={{ width: '120px' }}
									>
										<Option value="=">=</Option>
										<Option value="!=">≠</Option>
										<Option value=">">{'>'}</Option>
										<Option value="<">{'<'}</Option>
										<Option value=">=">≥</Option>
										<Option value="<=">≤</Option>
										<Option value="contains">Chứa</Option>
										<Option value="not_contains">Không chứa</Option>
										<Option value="is_empty">Trống</Option>
										<Option value="is_not_empty">Không trống</Option>
									</Select>
									{!['is_empty', 'is_not_empty'].includes(config.templateConfig?.templateFilterOperator) && (
										<Input
											value={config.templateConfig?.templateFilterValue || ''}
											onChange={(e) => updateConfig('templateConfig', { 
												...config.templateConfig, 
												templateFilterValue: e.target.value 
											})}
											placeholder="Giá trị"
											style={{ width: '200px' }}
										/>
									)}
								</div>
								<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
									<InfoCircleOutlined /> Điều kiện này sẽ được áp dụng cho cột đích để lọc ra các dòng mẫu
								</div>
							</div>
						</Space>
					</Card>
				)}
			{/* Listing option cho categorize2/3 và template_based_categorize */}
			{(config.jobType === 'categorize2' || config.jobType === 'categorize3' || config.jobType === 'template_based_categorize') && (
						<Card title="Listing option (giới hạn lựa chọn)" size="small" style={{ marginTop: 12 }}>
							<Space direction="vertical" style={{ width: '100%' }} size="middle">
								<div>
									<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Chọn bảng danh mục</label>
									<Select
										placeholder="Chọn bảng danh mục"
										value={config.listingOption?.lookupTable || ''}
										onChange={(value) => updateConfig('listingOption', { ...config.listingOption, lookupTable: value, lookupColumn: '', lookupTableVersion: null })}
										showSearch
										optionFilterProp="children"
										style={{ width: '100%' }}
									>
										{templateTableList.map(table => (
											<Option key={table.id} value={table.id}>{table.name}</Option>
										))}
									</Select>
								</div>

						{config.listingOption?.lookupTable && (
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Phiên bản</label>
										<Select
											placeholder="Chọn phiên bản"
											value={config.listingOption?.lookupTableVersion}
											onChange={(value) => {
												setChangingVersion(true);
												updateConfig('listingOption', { ...config.listingOption, lookupTableVersion: value, lookupColumn: '' });
												setTimeout(() => setChangingVersion(false), 100);
											}}
											showSearch
											optionFilterProp="children"
											style={{ width: '100%' }}
										>
											{availableVersions.map(v => (
												<Option key={v.version} value={v.version}>Phiên bản {v.version === null ? 'gốc' : v.version}</Option>
											))}
										</Select>
									</div>
								)}

						{config.listingOption?.lookupTable && config.listingOption?.lookupTableVersion !== undefined && (
									<div>
										<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Cột danh mục</label>
										<Select
											placeholder={loadingTable || changingVersion ? 'Đang tải...' : 'Chọn cột'}
											value={config.listingOption?.lookupColumn}
											onChange={(value) => updateConfig('listingOption', { ...config.listingOption, lookupColumn: value })}
											loading={loadingTable || changingVersion}
											disabled={loadingTable || changingVersion || !lookupTableColumns.length}
											showSearch
											optionFilterProp="children"
											style={{ width: '100%' }}
										>
											{lookupTableColumns.map(col => (
												<Option key={col} value={col}>{col}</Option>
											))}
										</Select>
										<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
											<InfoCircleOutlined /> AI sẽ bị giới hạn phải trả về 1 giá trị thuộc danh sách unique của cột này.
										</div>
									</div>
			)}
							</Space>
						</Card>
					)}


					{/* Admin-only: System Prompt settings per Job Type */}
					{currentUser?.isSuperAdmin && (
						<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
							<Button onClick={openSystemPromptModal}>Cài đặt (Super Admin)</Button>
						</div>
					)}

					{/* Trạng thái test */}
					{hasTestedSuccessfully && (
						<Alert
							message="✅ Test thành công"
							description="Bạn có thể thêm step này vào pipeline. Tỷ lệ thành công đạt yêu cầu."
							type="success"
							showIcon
							style={{ marginTop: 16 }}
						/>
					)}

					{/* Hiển thị trạng thái test thất bại */}
					{testResults && !hasTestedSuccessfully && (
						<Alert
							message="❌ Test chưa đạt yêu cầu"
							description="Vui lòng kiểm tra lại prompt và cấu hình. Tỷ lệ thành công phải đạt 100% để có thể thêm step này."
							type="error"
							showIcon
							style={{ marginTop: 16 }}
						/>
					)}

					{/* Nút Test */}
					<div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
						<Button
							type="primary"
							icon={<ExperimentOutlined />}
							onClick={handleTestAITransformer}
							loading={isTesting}
							disabled={
								config.jobType === 'template_based_categorize' 
									? (!config.templateConfig?.templateConditionColumns?.length || 
									   !config.templateConfig?.templateTargetColumn?.trim() || 
									   !config.templateConfig?.templateFilterOperator ||
									   (!['is_empty', 'is_not_empty'].includes(config.templateConfig.templateFilterOperator) && !config.templateConfig?.templateFilterValue?.trim()) ||
									   !config.conditionColumns.length || 
									   !config.resultColumn.trim())
									: (!config.aiPrompt.trim() || !config.conditionColumns.length || !config.resultColumn.trim())
							}
							size="large"
						>
							Test với 10 dòng dữ liệu
						</Button>
					</div>
				</Space>
			</Card>

			{/* Test Results Modal */}
			<Modal
				title="Cài đặt System Prompt cho Job Type"
				open={showSystemPromptModal}
				onCancel={() => setShowSystemPromptModal(false)}
				onOk={handleSaveSystemPrompts}
				okText="Lưu"
				cancelText="Hủy"
				width={900}
			>
				<Space direction="vertical" style={{ width: '100%' }} size="large">
					{JOB_TYPE_OPTIONS.map(opt => (
						<div key={opt.value}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
								<label style={{ fontWeight: 'bold' }}>{opt.label}</label>
							</div>
							<TextArea
								rows={4}
								value={jobSystemPrompts[opt.value] || ''}
								onChange={(e) => setJobSystemPrompts(prev => ({ ...prev, [opt.value]: e.target.value }))}
								placeholder={`Nhập System Prompt mặc định cho job ${opt.label}`}
							/>
						</div>
					))}
				</Space>
			</Modal>
			<Modal
				title="Kết quả Test AI"
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
		</Space>
	);
};

export default AITransformerConfig;
