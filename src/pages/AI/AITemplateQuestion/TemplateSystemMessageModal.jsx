import { Button, Input, message, Modal, Select, Card, Space, Switch } from 'antd';
import { getAllTemplateSettingAIReportBuilder } from '../../../apis/templateSettingAIReportBuilder';
import { updateQuestionTemplate, getAllQuestionTemplate } from '../../../apis/aiQuestionTemplateService.jsx';
import { useEffect, useState } from 'react';
import { MODEL_AI_LIST } from '../../../CONST.js';
import css from './TemplateSystemMessageModal.module.css';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const { Option } = Select;

export default function TemplateSystemMessageModal({
													   isOpen,
													   onClose,
													   template,
													   currentUser,
													   onApply,
													   fileNotesFull = [],
													   checkedFiles = [],
												   }) {

	const [tempSystemMessage0, setTempSystemMessage0] = useState('');
	const [tempSystemMessage1, setTempSystemMessage1] = useState('');
	const [tempSystemMessage2, setTempSystemMessage2] = useState('');
	const [tempSystemMessage3, setTempSystemMessage3] = useState('');
	const [tempModel0, setTempModel0] = useState(MODEL_AI_LIST[0].value);
	const [tempModel1, setTempModel1] = useState(MODEL_AI_LIST[0].value);
	const [tempModel2, setTempModel2] = useState(MODEL_AI_LIST[0].value);
	const [tempModel3, setTempModel3] = useState(MODEL_AI_LIST[0].value);
	const [availableSystemMessages, setAvailableSystemMessages] = useState([]);
	const [selectedSystemMessageId, setSelectedSystemMessageId] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [manualConfigEnabled, setManualConfigEnabled] = useState(false);
	const [manualConfigs, setManualConfigs] = useState([]);
	const [manualDatasets, setManualDatasets] = useState([]);
	const [fileNotes, setFileNotes] = useState([]);
	const [templatesList, setTemplatesList] = useState([]);

	useEffect(() => {
		if (isOpen) {
			loadAvailableSystemMessages();
		}
	}, [isOpen]);

	useEffect(() => {
		if (isOpen && template?.id) {
			setSelectedSystemMessageId(template.id_template || null);
			if (template.id_template && availableSystemMessages.length > 0) {
				const selectedSystem = availableSystemMessages.find(sm => sm.id === template.id_template);
				if (selectedSystem && selectedSystem.setting) {
					const systemSettings = selectedSystem.setting;
					setTempSystemMessage0(systemSettings.systemMessage0 || '');
					setTempSystemMessage1(systemSettings.systemMessage1 || '');
					setTempSystemMessage2(systemSettings.systemMessage2 || '');
					setTempSystemMessage3(systemSettings.systemMessage3 || '');
					setTempModel0(systemSettings.model0 || MODEL_AI_LIST[0].value);
					setTempModel1(systemSettings.model1 || MODEL_AI_LIST[0].value);
					setTempModel2(systemSettings.model2 || MODEL_AI_LIST[0].value);
					setTempModel3(systemSettings.model3 || MODEL_AI_LIST[0].value);
				}
			}
		}
	}, [isOpen, template?.id, template?.id_template, availableSystemMessages]);

	useEffect(() => {
		if (isOpen && template) {
			const questSetting = template.quest_setting || {};
			console.log('manualConfigEnabled from quest_setting:', questSetting.manualConfigEnabled, typeof questSetting.manualConfigEnabled);
			setManualConfigEnabled(
				questSetting.manualConfigEnabled === true ||
				questSetting.manualConfigEnabled === 1 ||
				questSetting.manualConfigEnabled === 'true'
			);
			setManualConfigs(Array.isArray(questSetting.manualConfigs) ? questSetting.manualConfigs : []);
		}
	}, [isOpen, template]);

	useEffect(() => {
		async function fetchTemplates() {
			try {
				const data = await getAllQuestionTemplate();
				setTemplatesList(Array.isArray(data) ? data : []);
			} catch (e) {
				setTemplatesList([]);
			}
		}
		if (manualConfigEnabled) fetchTemplates();
	}, [manualConfigEnabled]);

	useEffect(() => {
		if (selectedSystemMessageId && availableSystemMessages.length > 0) {
			const selectedSystem = availableSystemMessages.find(sm => sm.id === selectedSystemMessageId);
			if (selectedSystem && selectedSystem.setting) {
				const systemSettings = selectedSystem.setting;
				setTempSystemMessage0(systemSettings.systemMessage0 || '');
				setTempSystemMessage1(systemSettings.systemMessage1 || '');
				setTempSystemMessage2(systemSettings.systemMessage2 || '');
				setTempSystemMessage3(systemSettings.systemMessage3 || '');
				setTempModel0(systemSettings.model0 || MODEL_AI_LIST[0].value);
				setTempModel1(systemSettings.model1 || MODEL_AI_LIST[0].value);
				setTempModel2(systemSettings.model2 || MODEL_AI_LIST[0].value);
				setTempModel3(systemSettings.model3 || MODEL_AI_LIST[0].value);
			}
		}
	}, [selectedSystemMessageId, availableSystemMessages]);

	const loadAvailableSystemMessages = async () => {
		try {
			const data = await getAllTemplateSettingAIReportBuilder();
			const systemMessages = Array.isArray(data.data) ? data.data : [];
			setAvailableSystemMessages(systemMessages);
			console.log('Available system messages:', systemMessages);
		} catch (error) {
			console.error('Error loading available system messages:', error);
			setAvailableSystemMessages([]);
		}
	};

	const handleSelectSystemMessage = async (systemMessageId) => {
		if (!template?.id) return;
		setSelectedSystemMessageId(systemMessageId || null);
		await updateQuestionTemplate({
			...template,
			id_template: systemMessageId || null,
		});
		if (!systemMessageId) {
			message.success('Đã xóa lựa chọn System Message');
		} else {
			const selectedSystem = availableSystemMessages.find(sm => sm.id === systemMessageId);
			message.success(`Đã áp dụng bộ System Message: ${selectedSystem?.name || ''}`);
		}
	};

	const handleManualConfigChange = (checked) => {
		setManualConfigEnabled(checked);
	};

	const handleSaveAll = async () => {
		try {
			await updateQuestionTemplate({
				...template,
				id_template: selectedSystemMessageId || null,
				quest_setting: {
					...template.quest_setting,
					manualConfigEnabled: manualConfigEnabled,
					manualConfigs: manualConfigs,
				},
			});
			message.success('Đã lưu cấu hình System Message và cấu hình thủ công cho template!');
		} catch (error) {
			message.error('Không thể lưu cấu hình thủ công');
		}
		onClose();
	};

	const addManualConfig = () => {
		const nextConfigs = [
			...manualConfigs,
			{
				id: Date.now(),
				dataset: fileNotesFull[0]?.id || null,
				datasetName: fileNotesFull[0]?.name || '',
				type: 'aggregation',
				operation: 'sum',
				target_column: '',
				group_by: [],
				filters: {},
				limit: null
			}
		];
		setManualConfigs(nextConfigs);
	};

	const removeManualConfig = (configId) => {
		const nextConfigs = manualConfigs.filter(config => config.id !== configId);
		setManualConfigs(nextConfigs);
	};

	const updateManualConfig = (configId, field, value) => {
		const nextConfigs = manualConfigs.map(config =>
			config.id === configId ? { ...config, [field]: value } : config
		);
		setManualConfigs(nextConfigs);
	};

	const updateManualDatasetName = (configId, datasetId) => {
		const templateNote = fileNotesFull.find(t => t.id === datasetId);
		const nextConfigs = manualConfigs.map(config =>
			config.id === configId
				? { ...config, dataset: datasetId, datasetName: templateNote ? templateNote.name : '' }
				: config
		);
		setManualConfigs(nextConfigs);
	};
	const getAvailableColumns = (datasetId) => {
		const fileNote = fileNotesFull.find(note => note.id === datasetId);
		if (fileNote) {
			const sample = Array.isArray(fileNote.rowDemo) && fileNote.rowDemo.length > 0
				? fileNote.rowDemo[0]
				: (Array.isArray(fileNote.rows) && fileNote.rows.length > 0 ? fileNote.rows[0] : null);
			if (sample && typeof sample === 'object') {
				return Object.keys(sample);
			}
		}
		return [];
	};

	const typeOptions = [
		{ value: 'aggregation', label: 'Tổng hợp (Aggregation)' },
		{ value: 'ranking', label: 'Xếp hạng (Ranking)' },
		{ value: 'filter', label: 'Lọc (Filter)' }
	];

	const getOperationOptions = (type) => {
		switch (type) {
			case 'aggregation':
				return [
					{ value: 'sum', label: 'Tổng (Sum)' },
					{ value: 'count', label: 'Đếm (Count)' },
					{ value: 'average', label: 'Trung bình (Average)' },
					{ value: 'max', label: 'Giá trị lớn nhất (Max)' },
					{ value: 'min', label: 'Giá trị nhỏ nhất (Min)' }
				];
			case 'ranking':
				return [
					{ value: 'sum', label: 'Tổng (Sum)' },
					{ value: 'count', label: 'Đếm (Count)' },
					{ value: 'average', label: 'Trung bình (Average)' }
				];
			case 'filter':
				return [
					{ value: 'distinct', label: 'Duy nhất (Distinct)' },
					{ value: 'limit', label: 'Giới hạn (Limit)' }
				];
			default:
				return [];
		}
	};

	if (!template) return null;

	return (
		<Modal
			title={
				<div className={css.modalTitle}>
					{`Chọn System Message cho Template - ${template.name || template.question}`}
				</div>
			}
			open={isOpen}
			onCancel={onClose}
			footer={[
				<Button key='cancel' onClick={onClose}>
					Hủy
				</Button>,
				<Button key='save' type='primary' onClick={handleSaveAll}>
					Lưu cấu hình
				</Button>,
			]}
			width={'90vw'}
			centered
		>
			<div className={css.main}>
				<div className={css.systemMessageSelector}>
					<div className={css.selectorHeader}>
						<h4 className={css.selectorTitle}>Chọn bộ System Message có sẵn:</h4>
						<Select
							className={css.systemMessageSelect}
							placeholder='Chọn bộ System Message...'
							value={selectedSystemMessageId}
							onChange={handleSelectSystemMessage}
							options={availableSystemMessages.map(sm => ({
								label: sm.name,
								value: sm.id,
							}))}
							allowClear
						/>
					</div>
				</div>
				<div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
					<Switch checked={manualConfigEnabled} onChange={handleManualConfigChange} />
					<span>Sử dụng cấu hình thủ công (thay thế Bot lọc dữ liệu)</span>
				</div>
				<div className={css.systemMessageContainer}>
					{isLoading ? (
						<div style={{ textAlign: 'center', padding: '20px' }}>
							Đang tải cấu hình...
						</div>
					) : (
						<>
							{/* <div className={css.systemMessageSection}>
								<div className={css.sectionHeader}>
									<div className={css.sectionTitle}>
										<h4 style={{ margin: 0 }}>Bot tạo Mô tả:</h4>
										{template.id_template && tempModel0 ? (
											<span style={{ fontWeight: 500, color: '#1677ff' }}>{tempModel0}</span>
										) : (
											<Select
												className={css.modelSelect}
												value={tempModel0}
												style={{ cursor: 'not-allowed' }}
												open={false}
												onDropdownVisibleChange={(open) => { if (open) return; }}
											/>
										)}
									</div>
								</div>
								<Input.TextArea
									className={css.textArea}
									value={tempSystemMessage0}
									readOnly
								/>
							</div> */}
							<div className={css.systemMessageSection}>
								<div className={css.sectionHeader}>
									<div className={css.sectionTitle}>
										<h4 style={{ margin: 0 }}>{ manualConfigEnabled ? 'Lọc dữ liệu thủ công:' : 'Bot lọc dữ liệu:'}</h4>
										{template.id_template && tempModel1 ? (
											manualConfigEnabled ? null : 	 <span style={{ fontWeight: 500, color: '#1677ff' }}>{tempModel1}</span>
										) : (
											<Select
												className={css.modelSelect}
												value={tempModel1}
												style={{ cursor: 'not-allowed', display: manualConfigEnabled ? 'none' : undefined }}
												open={false}
												onDropdownVisibleChange={(open) => { if (open) return; }}
											/>
										)}
									</div>
								</div>
								{manualConfigEnabled ? (
									<>
										<Card size="small" style={{ marginBottom: 16 }}>
											<h4>Dữ liệu đã được phân loại:</h4>
											<p>Bạn có thể cấu hình cách phân tích từng bảng (chọn từ danh sách template).</p>
										</Card>
										{manualConfigs.map((config, index) => {
											const fileNote = fileNotesFull.find(note => note.id === config.dataset && checkedFiles.includes(note.id));
											const columns = fileNote && fileNote.rows && fileNote.rows[0] ? Object.keys(fileNote.rows[0]).map(key => ({ headerName: key, field: key, flex: 1, minWidth: 100 })) : [];
											return (
												<Card
													key={config.id}
													size="small"
													style={{ marginBottom: 16 }}
													title={`Cấu hình ${index + 1}`}
													extra={
														<Button
															type="text"
															danger
															icon={<DeleteOutlined />}
															onClick={() => removeManualConfig(config.id)}
														/>
													}
												>
													<Space direction="vertical" style={{ width: '100%' }}>
														<div>
															<label>Bảng dữ liệu (template):</label>
															<Select
																style={{ width: '100%', marginTop: 4 }}
																value={config.dataset}
																onChange={(value) => updateManualDatasetName(config.id, value)}
																placeholder="Chọn bảng dữ liệu"
															>
																{fileNotesFull.map(t => (
																	<Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
																))}
															</Select>
														</div>
														<div>
															<label>Loại phân tích:</label>
															<Select
																style={{ width: '100%', marginTop: 4 }}
																value={config.type}
																onChange={(value) => updateManualConfig(config.id, 'type', value)}
															>
																{typeOptions.map(option => (
																	<Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
																))}
															</Select>
														</div>
														<div>
															<label>Phép toán:</label>
															<Select
																style={{ width: '100%', marginTop: 4 }}
																value={config.operation || undefined}
																onChange={(value) => updateManualConfig(config.id, 'operation', value)}
																placeholder="Chọn phép toán"
																allowClear
															>
																{getOperationOptions(config.type).map(option => (
																	<Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
																))}
															</Select>
														</div>
														<div>
															<label>Cột mục tiêu:</label>
															<Select
																mode="multiple"
																style={{ width: '100%', marginTop: 4 }}
																value={Array.isArray(config.target_column) ? config.target_column : (config.target_column ? [config.target_column] : [])}
																onChange={(value) => updateManualConfig(config.id, 'target_column', value)}
																placeholder="Chọn cột để phân tích (có thể chọn nhiều cột)"
															>
																{getAvailableColumns(config.dataset).map(col => (
																	<Select.Option key={col} value={col}>{col}</Select.Option>
																))}
															</Select>
														</div>
														<div>
															<label>Nhóm theo:</label>
															<Select
																mode="multiple"
																style={{ width: '100%', marginTop: 4 }}
																value={config.group_by}
																onChange={(value) => updateManualConfig(config.id, 'group_by', value)}
																placeholder="Chọn cột để nhóm (tùy chọn)"
															>
																{getAvailableColumns(config.dataset).map(col => (
																	<Select.Option key={col} value={col}>{col}</Select.Option>
																))}
															</Select>
														</div>
														<div>
															<label>Giới hạn kết quả:</label>
															<Input
																type="number"
																style={{ marginTop: 4 }}
																value={config.limit || ''}
																onChange={(e) => updateManualConfig(config.id, 'limit', e.target.value ? parseInt(e.target.value) : null)}
																placeholder="Số lượng kết quả tối đa (tùy chọn)"
															/>
														</div>
														<div>
															<label>Bộ lọc:</label>
															<div style={{ marginTop: 4 }}>
																{Object.entries(config.filters || {}).map(([field, filterConfig]) => (
																	<div key={field} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
																		<Select
																			style={{ width: 150 }}
																			value={field}
																			onChange={(newField) => {
																				// Remove old field and add new field
																				const newFilters = { ...config.filters };
																				delete newFilters[field];
																				newFilters[newField] = filterConfig;
																				updateManualConfig(config.id, 'filters', newFilters);
																			}}
																			placeholder="Chọn cột"
																		>
																			{getAvailableColumns(config.dataset).map(column => (
																				<Select.Option key={column} value={column}>{column}</Select.Option>
																			))}
																		</Select>
																		<Select
																			style={{ width: 120 }}
																			value={filterConfig.operator || 'equals'}
																			onChange={(operator) => {
																				const newFilters = { ...config.filters };
																				newFilters[field] = { ...filterConfig, operator };
																				updateManualConfig(config.id, 'filters', newFilters);
																			}}
																		>
																			<Select.Option value="equals">=</Select.Option>
																			<Select.Option value="not_equals">≠</Select.Option>
																			<Select.Option value="greater_than">&gt;</Select.Option>
																			<Select.Option value="less_than">&lt;</Select.Option>
																			<Select.Option value="greater_equal">≥</Select.Option>
																			<Select.Option value="less_equal">≤</Select.Option>
																			<Select.Option value="contains">Chứa</Select.Option>
																			<Select.Option value="not_contains">Không chứa</Select.Option>
																			<Select.Option value="starts_with">Bắt đầu với</Select.Option>
																			<Select.Option value="ends_with">Kết thúc với</Select.Option>
																			<Select.Option value="in">Trong danh sách</Select.Option>
																			<Select.Option value="not_in">Không trong danh sách</Select.Option>
																			<Select.Option value="is_null">Null</Select.Option>
																			<Select.Option value="is_not_null">Không null</Select.Option>
																		</Select>
																		{filterConfig.operator && 
																		 filterConfig.operator !== 'is_null' && 
																		 filterConfig.operator !== 'is_not_null' && (
																			<Input
																				style={{ flex: 1 }}
																				value={filterConfig.value || ''}
																				onChange={(e) => {
																					const newFilters = { ...config.filters };
																					newFilters[field] = { ...filterConfig, value: e.target.value };
																					updateManualConfig(config.id, 'filters', newFilters);
																				}}
																				placeholder={
																					filterConfig.operator === 'in' || filterConfig.operator === 'not_in' 
																						? "Giá trị1,giá trị2,giá trị3..." 
																						: "Giá trị"
																				}
																			/>
																		)}
																		<Button 
																			type="text" 
																			danger 
																			icon={<DeleteOutlined />}
																			onClick={() => {
																				const newFilters = { ...config.filters };
																				delete newFilters[field];
																				updateManualConfig(config.id, 'filters', newFilters);
																			}}
																		/>
																	</div>
																))}
																<Button 
																	type="dashed" 
																	size="small"
																	onClick={() => {
																		const availableColumns = getAvailableColumns(config.dataset);
																		const unusedColumns = availableColumns.filter(col => 
																			!Object.keys(config.filters || {}).includes(col)
																		);
																		if (unusedColumns.length > 0) {
																			const newFilters = { ...config.filters, [unusedColumns[0]]: { operator: 'equals', value: '' } };
																			updateManualConfig(config.id, 'filters', newFilters);
																		}
																	}}
																>
																	Thêm bộ lọc
																</Button>
															</div>
														</div>
														{fileNote && fileNote.rows && fileNote.rows.length > 0 && (
															<div style={{ marginTop: 12 }}>
																<div style={{ fontWeight: 500, marginBottom: 4 }}>Xem dữ liệu bảng: {fileNote.name}</div>
																<div className="ag-theme-quartz" style={{ height: 200, width: '100%' }}>
																	<AgGridReact
																		rowData={fileNote.rows}
																		columnDefs={columns}
																		pagination={false}
																		defaultColDef={{ resizable: true, sortable: true, filter: true }}
																		onGridReady={params => { try { params.api.sizeColumnsToFit(); } catch (e) {} }}
																	/>
																</div>
															</div>
														)}
													</Space>
												</Card>
											);
										})}
										<Button icon={<PlusOutlined />} onClick={addManualConfig} type="dashed" style={{ width: '100%' }}>
											Thêm cấu hình
										</Button>
									</>
								) : (
									<Input.TextArea
										className={css.textArea}
										value={tempSystemMessage1}
										readOnly
									/>
								)}
							</div>
							<div className={css.systemMessageSection}>
								<div className={css.sectionHeader}>
									<div className={css.sectionTitle}>
										<h4 style={{ margin: 0 }}>Bot phân tích:</h4>
										{template.id_template && tempModel2 ? (
											<span style={{ fontWeight: 500, color: '#1677ff' }}>{tempModel2}</span>
										) : (
											<Select
												className={css.modelSelect}
												value={tempModel2}
												style={{ cursor: 'not-allowed' }}
												open={false}
												onDropdownVisibleChange={(open) => { if (open) return; }}
											/>
										)}
									</div>
								</div>
								<Input.TextArea
									className={css.textArea}
									value={tempSystemMessage2}
									readOnly
								/>
							</div>
							<div className={css.systemMessageSection}>
								<div className={css.sectionHeader}>
									<div className={css.sectionTitle}>
										<h4 style={{ margin: 0 }}>Bot tạo biểu đồ:</h4>
										{template.id_template && tempModel3 ? (
											<span style={{ fontWeight: 500, color: '#1677ff' }}>{tempModel3}</span>
										) : (
											<Select
												className={css.modelSelect}
												value={tempModel3}
												style={{ cursor: 'not-allowed' }}
												open={false}
												onDropdownVisibleChange={(open) => { if (open) return; }}
											/>
										)}
									</div>
								</div>
								<Input.TextArea
									className={css.textArea}
									value={tempSystemMessage3}
									readOnly
								/>
							</div>
						</>
					)}
				</div>
			</div>
		</Modal>
	);
} 