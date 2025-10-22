import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';
import { Button, Checkbox, Input, message, Modal, Spin, Tooltip, Tag, Popover } from 'antd';
import { CheckCircle2, Play, BookOpen, Trash2 } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { analyzeDataWithCsv } from '../../apis/botService.jsx';
import { createSetting, getSettingByType, updateSetting } from '../../apis/settingService.jsx';
import { updateTemplateTableVersion } from '../../apis/templateSettingService.jsx';
import { getAllKpi2Calculator } from '../../apis/kpi2CalculatorService.jsx';
import { MODEL_AI_LIST } from '../../CONST.js';
import { MyContext } from '../../MyContext.jsx';
import KPI2ContentView from '../Canvas/CanvasFolder/KPI2Calculator/KPI2ContentView.jsx';
import KPIViewWithDescription from './KPIViewWithDescription.jsx';

export default function DataModal({ 
	open, 
	onClose, 
	selectedId, 
	setSelectedId, 
	selectedFileNote, 
	setSelectedFileNote, 
	fileNotesFull, 
	checkedItems, 
	setCheckedItems, 
	onFileNoteUpdate, 
	updateFilteredStates,
	templates = [], // Templates from ReportBuilderNonPD
	onTemplateRun, // Callback to run template with selected data
	selectedTemplate,
	setSelectedTemplate,
	onTemplatesUpdate // Callback to update templates in parent
}) {
	const [loading, setLoading] = useState(false);
	const [systemMessage0, setSystemMessage0] = useState('');
	const [model0, setModel0] = useState(MODEL_AI_LIST[0].value);
	const { currentUser } = useContext(MyContext);
	const [searchText, setSearchText] = useState('');
	const [selectedTag, setSelectedTag] = useState(null);
	const [showEditSection, setShowEditSection] = useState(false);
	const gridRef = useRef();
	
	// Template-related states
	const [searchTemplateText, setSearchTemplateText] = useState('');
	
	// KPI-related states
	const [kpi2Calculators, setKpi2Calculators] = useState([]);
	const [searchKpiText, setSearchKpiText] = useState('');
	const [activeTab, setActiveTab] = useState('data'); // 'data' or 'kpi'
	const [selectedKpiForView, setSelectedKpiForView] = useState(null);

	useEffect(() => {
		console.log('🚀 [DataModal] Component mounted, loading data...');
		loadSystemMessage0();
		loadModel0();
		loadKpi2Calculators();
	}, []);

	useEffect(() => {
		console.log(selectedFileNote);
	}, [selectedFileNote]);

	// Update checkedItems when selected template changes
	useEffect(() => {
		if (selectedTemplate) {
			const templateDataIds = selectedTemplate.data_selected || [];
			setCheckedItems(templateDataIds);
			console.log('📋 [DataModal] Updated checkedItems for template:', {
				templateName: selectedTemplate.name,
				dataIds: templateDataIds
			});
		} else {
			setCheckedItems([]);
		}
	}, [selectedTemplate]);

	// Handle template-KPI association
	const handleTemplateKpiToggle = async (templateId, kpiId, isLinked) => {
		const template = templates.find(t => t.id === templateId);
		if (!template) {
			message.error('Không tìm thấy template');
			return;
		}

		const kpi = kpi2Calculators.find(k => k.id === kpiId);
		if (!kpi) {
			message.error('Không tìm thấy KPI');
			return;
		}

		let updatedKpiSelected = [...(template.kpiSelected || [])];

		if (isLinked) {
			// Add KPI to template
			if (!updatedKpiSelected.includes(kpiId)) {
				updatedKpiSelected.push(kpiId);
				message.success(`Đã gắn KPI "${kpi.name}" vào template`);
			}
		} else {
			// Remove KPI from template
			updatedKpiSelected = updatedKpiSelected.filter(id => id !== kpiId);
			message.success(`Đã hủy liên kết KPI "${kpi.name}" khỏi template`);
		}

		// Update template with new KPI selection
		const updatedTemplate = { 
			...template, 
			kpiSelected: updatedKpiSelected,
			updated_at: new Date().toISOString()
		};
		
		// Update templates array
		const updatedTemplates = templates.map(t => 
			t.id === templateId ? updatedTemplate : t
		);

		// Save templates back to settings
		try {
			console.log('💾 [DataModal] Saving template KPI selection:', {
				templateId,
				templateName: template.name,
				kpiSelectedCount: updatedKpiSelected.length,
				kpiSelected: updatedKpiSelected,
				action: isLinked ? 'linked' : 'unlinked',
				kpiName: kpi.name
			});

			const templatesSetting = await getSettingByType('AI_ANALYSIS_TEMPLATES_NON_PD');
			if (templatesSetting) {
				await updateSetting({ ...templatesSetting, setting: updatedTemplates });
			} else {
				await createSetting({
					type: 'AI_ANALYSIS_TEMPLATES_NON_PD',
					setting: updatedTemplates,
				});
			}
			
			console.log('✅ [DataModal] Template KPI selection saved successfully:', {
				templateName: template.name,
				totalKpiSelected: updatedKpiSelected.length
			});
			
			// Update selected template if it's the one being modified
			if (selectedTemplate && selectedTemplate.id === templateId) {
				setSelectedTemplate(updatedTemplate);
			}
			
			// Update templates in parent component
			if (onTemplatesUpdate) {
				onTemplatesUpdate(updatedTemplates);
			}
		} catch (error) {
			console.error('❌ [DataModal] Error saving template KPI selection:', error);
			message.error('Lỗi khi lưu template: ' + (error.message || 'Unknown error'));
		}
	};

	// Handle template-data association
	const handleTemplateDataToggle = async (templateId, dataId, isLinked) => {
		const template = templates.find(t => t.id === templateId);
		if (!template) {
			message.error('Không tìm thấy template');
			return;
		}
		console.log('🔍 [DataModal] handleTemplateDataToggle called with:', {
			templateId,
			dataId,
			isLinked,
			fileNotesFull: fileNotesFull.map(f => ({ id: f.id, id_template: f.id_template, id_version: f.id_version, name: f.name }))
		});

		// Tìm fileNote theo id_template + version (AI-compatible ID)
		let fileNote = fileNotesFull.find(f => {
			const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
			const aiCompatibleId = `${f.id_template}${versionSuffix}`;
			return aiCompatibleId === dataId;
		});

		if (!fileNote) {
			console.error('Could not find fileNote with dataId:', dataId);
			console.error('Available fileNotes:', fileNotesFull.map(f => ({ id: f.id, id_template: f.id_template, id_version: f.id_version, name: f.name })));
			message.error('Không tìm thấy dữ liệu');
			return;
		}

		let updatedDataSelected = [...(template.data_selected || [])];

		if (isLinked) {
			// Add data to template
			if (!updatedDataSelected.includes(dataId)) {
				updatedDataSelected.push(dataId);
				message.success(`Đã gắn "${fileNote.name}" vào template`);
			}
		} else {
			// Remove data from template
			updatedDataSelected = updatedDataSelected.filter(id => id !== dataId);
			message.success(`Đã hủy liên kết "${fileNote.name}" khỏi template`);
		}

		// Update template with new data selection
		const updatedTemplate = { 
			...template, 
			data_selected: updatedDataSelected,
			updated_at: new Date().toISOString()
		};
		
		// Update templates array
		const updatedTemplates = templates.map(t => 
			t.id === templateId ? updatedTemplate : t
		);

		// Save templates back to settings
		try {
			console.log('💾 [DataModal] Saving template data selection:', {
				templateId,
				templateName: template.name,
				dataSelectedCount: updatedDataSelected.length,
				dataSelected: updatedDataSelected,
				action: isLinked ? 'linked' : 'unlinked',
				fileName: fileNote.name
			});

			const templatesSetting = await getSettingByType('AI_ANALYSIS_TEMPLATES_NON_PD');
			if (templatesSetting) {
				await updateSetting({ ...templatesSetting, setting: updatedTemplates });
			} else {
				await createSetting({
					type: 'AI_ANALYSIS_TEMPLATES_NON_PD',
					setting: updatedTemplates,
				});
			}
			
			console.log('✅ [DataModal] Template data selection saved successfully:', {
				templateName: template.name,
				totalDataSelected: updatedDataSelected.length
			});
			
			// Update selected template if it's the one being modified
			if (selectedTemplate && selectedTemplate.id === templateId) {
				setSelectedTemplate(updatedTemplate);
			}
			
			// Update templates in parent component
			if (onTemplatesUpdate) {
				onTemplatesUpdate(updatedTemplates);
			}
		} catch (error) {
			console.error('❌ [DataModal] Error saving template data selection:', error);
			message.error('Lỗi khi lưu template: ' + (error.message || 'Unknown error'));
		}
	};



	// Run template with linked data and KPI (simplified - just close modal)
	const handleRunTemplate = (template) => {
		const linkedDataIds = template.data_selected || [];
		const linkedKpiIds = template.kpiSelected || [];
		if (linkedDataIds.length === 0 && linkedKpiIds.length === 0) {
			message.warning('Vui lòng gắn ít nhất 1 dữ liệu hoặc KPI cho template này');
			return;
		}
		
		console.log('🚀 [DataModal] Template ready to run:', {
			templateName: template.name,
			dataCount: linkedDataIds.length,
			kpiCount: linkedKpiIds.length
		});
		
		// Just close modal, main run logic is in ReportBuilderNonPD
		onClose();
		message.success(`Template "${template.name}" đã sẵn sàng. Quay lại màn hình chính để chạy.`);
	};

	// Clear invalid data from template
	const handleTemplateClearInvalidData = async (templateId, invalidDataIds) => {
		try {
			const template = templates.find(t => t.id === templateId);
			if (!template) return;

			const validDataIds = (template.data_selected || []).filter(id => 
				!invalidDataIds.includes(id)
			);

			const updatedTemplate = {
				...template,
				data_selected: validDataIds,
				updated_at: new Date().toISOString()
			};

			const updatedTemplates = templates.map(t => 
				t.id === templateId ? updatedTemplate : t
			);

			// Save updated templates
			const templatesSetting = await getSettingByType('AI_ANALYSIS_TEMPLATES_NON_PD');
			if (templatesSetting) {
				await updateSetting({ ...templatesSetting, setting: updatedTemplates });
			} else {
				await createSetting({
					type: 'AI_ANALYSIS_TEMPLATES_NON_PD',
					setting: updatedTemplates,
				});
			}

			if (onTemplatesUpdate) {
				onTemplatesUpdate(updatedTemplates);
			}
			
			message.success(`Đã dọn dẹp ${invalidDataIds.length} dữ liệu không tồn tại`);
		} catch (error) {
			console.error('Error clearing invalid data from template:', error);
			message.error('Lỗi khi dọn dẹp dữ liệu');
		}
	};

	const loadModel0 = async () => {
		try {
			const model = await getSettingByType('MODEL_AI_0');
			if (model) {
				setModel0(model.setting);
			}
		} catch (error) {
			console.error('Error loading model 0:', error);
		}
	};

	const saveModel0 = async (value) => {
		try {
			const settings = await getSettingByType('MODEL_AI_0');
			if (settings) {
				await updateSetting({ ...settings, setting: value });
			} else {
				await createSetting({
					type: 'MODEL_AI_0',
					setting: value,
				});
			}
			setModel0(value);
			message.success('Đã lưu Model AI')
		} catch (error) {
			console.error('Error saving model 0:', error);
		}
	};

	const loadKpi2Calculators = async () => {
		try {
			console.log('🔄 [DataModal] Loading KPIs...');
			const kpis = await getAllKpi2Calculator();
			console.log('---------------------------------------', kpis);
			
			if (kpis && kpis.length > 0) {
				setKpi2Calculators(kpis);
			} else {
				console.log('⚠️ [DataModal] No KPIs found or empty array');
			}
		} catch (error) {
			console.error('Error loading KPI2 calculators:', error);
		}
	};

	const loadSystemMessage0 = async () => {
		try {
			const message = await getSettingByType('SYSTEM_MESSAGE_0');
			if (message) {
				setSystemMessage0(message.setting);
			}
		} catch (error) {
			console.error('Error loading system message 0:', error);
		}
	};

	const saveSystemMessage0 = async (value) => {
		try {
			const settings = await getSettingByType('SYSTEM_MESSAGE_0');
			if (settings) {
				await updateSetting({ ...settings, setting: value });
			} else {
				await createSetting({
					type: 'SYSTEM_MESSAGE_0',
					setting: value,
				});
			}
			setSystemMessage0(value);
			message.success('Đã lưu System Message')
		} catch (error) {
			console.error('Error saving system message 0:', error);
		}
	};

	const dynamicColumnDefs = Object.keys(selectedFileNote?.rows?.[0] || {}).map(key => ({
		headerName: key,
		field: key,
		flex: 1,
		minWidth: 100,
		autoSize: true,
		resizable: true,
	}));
	
	const saveSettings = async (items) => {
		try {
			const settings = await getSettingByType('FILE_NOTE_FOR_AI');
			if (settings) {
				await updateSetting({ ...settings, setting: items }).then((data) => {
				}).catch((error) => {
					console.error('Error updating setting:', error);
				});
			} else {
				await createSetting({
					type: 'FILE_NOTE_FOR_AI',
					setting: items,
				});
			}
			updateFilteredStates(fileNotesFull, items);
		} catch (error) {
			console.error('Error saving settings:', error);
		}
	};

	const handleCheckboxChange = async (itemId, checked, type = 'data') => {
		if (!selectedTemplate) {
			message.warning('Vui lòng chọn template trước');
			return;
		}

		if (type === 'kpi') {
			// Handle KPI selection
			await handleTemplateKpiToggle(selectedTemplate.id, itemId, checked);
		} else {
			// Handle data selection
			// Find the item to determine the best ID format to use
			const item = fileNotesFull.find(f => f.id === itemId);
			let idToSave = itemId;
			
			if (item) {
				// Always use AI-compatible ID format: id_template + version
				const versionSuffix = item.id_version && item.id_version !== 1 ? `_v${item.id_version}` : '';
				idToSave = `${item.id_template}${versionSuffix}`;
				
				console.log('💾 [DataModal] Saving ID format:', {
					originalItemId: itemId,
					originalId: item.id,
					templateId: item.id_template,
					version: item.id_version,
					aiCompatibleId: idToSave
				});
			}

			// Update template's data_selected instead of global checkedItems
			await handleTemplateDataToggle(selectedTemplate.id, idToSave, checked);
			
			// Update checkedItems to reflect current template selection
			const updatedTemplate = templates.find(t => t.id === selectedTemplate.id);
			if (updatedTemplate) {
				const templateDataIds = updatedTemplate.data_selected || [];
				setCheckedItems(templateDataIds);
				await saveSettings(templateDataIds);
			}
		}
	};

	const handleItemView = (itemId) => {
		setSelectedId(itemId);
		setShowEditSection(true);
		setSelectedKpiForView(null); // Reset KPI view khi chọn dữ liệu
	};

	const handleKpiView = (kpiId) => {
		console.log('🔍 [DataModal] handleKpiView called with kpiId:', kpiId);
		setSelectedKpiForView(kpiId);
		setSelectedId(null); // Reset data view khi chọn KPI
	};

	// Function to refresh KPI list after description update
	const refreshKpiList = async () => {
		console.log('🔄 [DataModal] refreshKpiList called');
		await loadKpi2Calculators();
		console.log('✅ [DataModal] refreshKpiList completed');
	};

	const updateDesc = async () => {
		await updateTemplateTableVersion(selectedFileNote.id_template, selectedFileNote.id_version, selectedFileNote.desc);
		message.success('Đã lưu mô tả');
		setShowEditSection(false);
	}

	const useAI = async () => {
		try {
			setLoading(true);
			saveSystemMessage0(systemMessage0);
			saveModel0(model0);
			let rs = await analyzeDataWithCsv({
				name: selectedFileNote.name,
				data: selectedFileNote.rowDemo,
				systemMessage: systemMessage0,
				model: model0
			});

			// Save used tokens to settings
			const usedTokens = await getSettingByType('USED_TOKEN');
			const totalTokens = (usedTokens?.setting || 0) + (rs.usage?.total_tokens || 0);
			if (usedTokens) {
				await updateSetting({ ...usedTokens, setting: totalTokens });
			} else {
				await createSetting({
					type: 'USED_TOKEN',
					setting: totalTokens,
				});
			}

			if (rs?.analysis) {
				onFileNoteUpdate({ ...selectedFileNote, desc: rs.analysis });
			}
		} catch (error) {
			console.log('Error analyzing data:', error);
			message.error('Có lỗi xảy ra với hệ thống AI, vui lòng thử lại sau.')
		} finally {
			setLoading(false);
		}
	}

	const filteredFileNotes = fileNotesFull.filter(item => {
		const matchesSearch = item.name?.toLowerCase().includes(searchText.toLowerCase());
		return matchesSearch;
	});

	const filteredTemplates = templates.filter(template => 
		template.name?.toLowerCase().includes(searchTemplateText.toLowerCase())
	);

	const filteredKpis = kpi2Calculators.filter(kpi => 
		kpi.name?.toLowerCase().includes(searchKpiText.toLowerCase())
	);

	// Separate checked and unchecked items based on selected template
	const templateDataIds = selectedTemplate ? (selectedTemplate.data_selected || []) : [];
	const templateKpiIds = selectedTemplate ? (selectedTemplate.kpiSelected || []) : [];
	
	const checkedFiles = filteredFileNotes.filter(item => {
		const versionSuffix = item.id_version && item.id_version !== 1 ? `_v${item.id_version}` : '';
		const aiCompatibleId = `${item.id_template}${versionSuffix}`;
		return templateDataIds.includes(aiCompatibleId);
	});
	const uncheckedFiles = filteredFileNotes.filter(item => {
		const versionSuffix = item.id_version && item.id_version !== 1 ? `_v${item.id_version}` : '';
		const aiCompatibleId = `${item.id_template}${versionSuffix}`;
		return !templateDataIds.includes(aiCompatibleId);
	});
	
	const checkedKpis = filteredKpis.filter(kpi => templateKpiIds.includes(kpi.id));
	const uncheckedKpis = filteredKpis.filter(kpi => !templateKpiIds.includes(kpi.id));

	const renderKpiItem = (kpi) => {
		const isLinkedToSelectedTemplate = selectedTemplate &&
			(selectedTemplate.kpiSelected || []).includes(kpi.id);
		const isSelectedForView = selectedKpiForView === kpi.id;
		return (
			<div
				key={kpi.id}
				style={{
					padding: '10px 12px',
					marginBottom: 4,
					cursor: 'pointer',
					borderRadius: 4,
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					background: isSelectedForView ? '#e6f7ff' : 
								isLinkedToSelectedTemplate ? '#f6ffed' : 'transparent',
					fontWeight: isSelectedForView ? 600 : 400,
					border: isSelectedForView ? '1px solid #1890ff' : 
							isLinkedToSelectedTemplate ? '1px solid #b7eb8f' : 'none',
				}}
			>
				<Checkbox
					checked={isLinkedToSelectedTemplate}
					onChange={(e) => handleCheckboxChange(kpi.id, e.target.checked, 'kpi')}
					disabled={!selectedTemplate}
				/>
				
				<div 
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						justifyContent: 'space-between',
						width: '100%'
					}}
					onClick={() => handleKpiView(kpi.id)}
				>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: '4px'
					}}>
						{kpi.name}
						{kpi.desc && (
							<>
								{console.log('🎯 [DataModal] Rendering icon for KPI:', kpi.name)}
								<Tooltip title="Đã có mô tả">
									<CheckCircle2 size={15} color="#2772e3" style={{ marginLeft: 4 }} />
								</Tooltip>
							</>
						)}
					</div>
				</div>
			</div>
		);
	};

	const renderFileItem = (item) => {
		// Chuẩn hóa id AI cho item
		const versionSuffix = item.id_version && item.id_version !== 1 ? `_v${item.id_version}` : '';
		const aiCompatibleId = `${item.id_template}${versionSuffix}`;
		const isLinkedToSelectedTemplate = selectedTemplate &&
			(selectedTemplate.data_selected || []).includes(aiCompatibleId);

		return (
			<div
				key={item.id}
				style={{
					padding: '10px 12px',
					marginBottom: 4,
					cursor: 'pointer',
					borderRadius: 4,
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					background: selectedId === item.id ? '#e6f7ff' : 
								isLinkedToSelectedTemplate ? '#f6ffed' : 'transparent',
					fontWeight: selectedId === item.id ? 600 : 400,
					border: isLinkedToSelectedTemplate ? '1px solid #b7eb8f' : 'none',
				}}
				onClick={() => handleItemView(item.id)}
			>
				<Checkbox
					checked={isLinkedToSelectedTemplate}
					onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
					disabled={!selectedTemplate}
				/>
				
				<div style={{
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					justifyContent: 'space-between',
					width: '100%'
				}}>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: '4px'
					}}>
						{item.name}
						{item.desc && (
							<Tooltip title="Đã có mô tả">
								<CheckCircle2 size={15} color="#2772e3" style={{ marginLeft: 4 }} />
							</Tooltip>
						)}
					</div>
				</div>
			</div>
		);
	};

	const renderTemplateItem = (template) => {
		const linkedDataCount = (template.data_selected || []).length;
		const linkedKpiCount = (template.kpiSelected || []).length;
		// Đếm số id trong data_selected khớp với fileNotesFull theo id_template+version
		const validDataCount = (template.data_selected || []).filter(id => {
			return fileNotesFull.some(f => {
				const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
				const aiCompatibleId = `${f.id_template}${versionSuffix}`;
				return aiCompatibleId === id;
			});
		}).length;
		const invalidDataCount = linkedDataCount - validDataCount;
		const canRun = validDataCount > 0 || linkedKpiCount > 0;
		const isSelected = selectedTemplate?.id === template.id;
		
		return (
			<div
				key={template.id}
				style={{
					padding: '12px',
					marginBottom: 8,
					borderRadius: 6,
					border: '1px solid #d9d9d9',
					background: isSelected ? '#e6f7ff' : '#fafafa',
					cursor: 'pointer',
				}}
				onClick={() => setSelectedTemplate(isSelected ? null : template)}
			>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					marginBottom: 8,
				}}>
					<div style={{ flex: 1 }}>
						<h4 style={{ 
							margin: 0, 
							fontSize: '14px', 
							color: isSelected ? '#1890ff' : '#262626',
							fontWeight: 600 
						}}>
							{template.name}
						</h4>
						<div style={{ 
							fontSize: '12px', 
							color: '#8c8c8c', 
							marginTop: 4,
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							flexWrap: 'wrap'
						}}>
							{linkedDataCount > 0 ? (
								<Popover
									content={
										<div style={{ maxWidth: 250 }}>
											<h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
												Dữ liệu đã gắn ({validDataCount}/{linkedDataCount})
											</h4>
											{(template.data_selected || []).map(id => {
												// Tìm file theo id_template+version
												let file = fileNotesFull.find(f => {
													const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
													const aiCompatibleId = `${f.id_template}${versionSuffix}`;
													return aiCompatibleId === id;
												});
												const exists = !!file;
												return (
													<div key={id} style={{ 
														marginBottom: 4, 
														padding: 6, 
														border: '1px solid #f0f0f0',
														borderRadius: 4,
														background: exists ? '#f6ffed' : '#fff2f0'
													}}>
														<div style={{ 
															fontSize: '12px',
															fontWeight: 500, 
															color: exists ? '#52c41a' : '#ff4d4f'
														}}>
															{exists ? '✓' : '✗'} {file?.name || `ID: ${id}`}
														</div>
														{!exists && (
															<div style={{ fontSize: '10px', color: '#ff4d4f' }}>
																Dữ liệu không tồn tại
															</div>
														)}
													</div>
												);
											})}
										</div>
									}
									title="Chi tiết dữ liệu"
									trigger="hover"
								>
									<Tag color={canRun ? 'green' : 'red'} size="small" style={{ cursor: 'pointer' }}>
										{invalidDataCount > 0 ? `${validDataCount}/${linkedDataCount}` : `${linkedDataCount}`} dữ liệu
									</Tag>
								</Popover>
							) : (
								<Tag color="red" size="small">
									{linkedDataCount} dữ liệu
								</Tag>
							)}
							
							{linkedKpiCount > 0 && (
								<Tag color="blue" size="small">
									{linkedKpiCount} KPI
								</Tag>
							)}
							
							{template.updated_at && (
								<span style={{ fontSize: '10px', color: '#bfbfbf' }}>
									{new Date(template.updated_at).toLocaleDateString('vi-VN')}
								</span>
							)}
						</div>
						{/* Show linked data and KPI names when template is selected */}
						{isSelected && (linkedDataCount > 0 || linkedKpiCount > 0) && (
							<div style={{ 
								fontSize: '10px', 
								color: '#52c41a', 
								marginTop: 4,
								maxHeight: '60px',
								overflow: 'hidden'
							}}>
								{linkedDataCount > 0 && (
									<div>
										Dữ liệu: {(template.data_selected || [])
											.map(id => {
												let file = fileNotesFull.find(f => {
													const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
													const aiCompatibleId = `${f.id_template}${versionSuffix}`;
													return aiCompatibleId === id;
												});
												return file?.name || `ID:${id}`;
											})
											.slice(0, 2)
											.join(', ')}
										{linkedDataCount > 2 && ` +${linkedDataCount - 2} khác`}
									</div>
								)}
								{linkedKpiCount > 0 && (
									<div>
										KPI: {(template.kpiSelected || [])
											.map(id => {
												let kpi = kpi2Calculators.find(k => k.id === id);
												return kpi?.name || `ID:${id}`;
											})
											.slice(0, 2)
											.join(', ')}
										{linkedKpiCount > 2 && ` +${linkedKpiCount - 2} khác`}
									</div>
								)}
							</div>
						)}
					</div>
					
					<div style={{ display: 'flex', gap: 4 }}>
						{/* Cleanup button - only show if there are invalid data */}
						{invalidDataCount > 0 && (
							<Button
								type="text"
								size="small"
								icon={<Trash2 size={12} />}
								onClick={(e) => {
									e.stopPropagation();
									const invalidDataIds = (template.data_selected || []).filter(id => {
										// Check if we can find the file by any ID format
										let file = fileNotesFull.find(f => f.id === id);
										if (!file) {
											file = fileNotesFull.find(f => {
												if (f.originalId === id) return true;
												
												// Check AI-compatible format
												const versionSuffix = f.id_version && f.id_version !== 1 ? `_v${f.id_version}` : '';
												const aiCompatibleId = `${f.id}${versionSuffix}`;
												return aiCompatibleId === id;
											});
										}
										return !file; // Return true if NOT found (i.e., invalid)
									});
									handleTemplateClearInvalidData(template.id, invalidDataIds);
								}}
								title={`Dọn dẹp ${invalidDataCount} dữ liệu không tồn tại`}
								style={{ color: '#ff4d4f' }}
							/>
						)}
					
					</div>
				</div>
				
				<p style={{ 
					margin: 0, 
					fontSize: '12px', 
					color: '#595959',
					lineHeight: '1.4',
					maxHeight: '40px',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical',
				}}>
					{template.prompt}
				</p>
			</div>
		);
	};

	const onGridReady = (params) => {
		params.api.sizeColumnsToFit();
	};

	const tagStyle = {
		cursor: 'pointer',
		marginRight: 8,
		userSelect: 'none'
	};

	const handleTagClick = (tag) => {
		setSelectedTag(selectedTag === tag ? null : tag);
	};

	return (
		<Modal
			title={'Cấu hình dữ liệu'}
			open={open}
			onCancel={() => {
				setSelectedTemplate(null);
				setActiveTab('data');
				setSelectedKpiForView(null);
				onClose();
			}}
			footer={null}
			width={'95vw'}
			centered
			destroyOnClose
		>
			<div style={{ display: 'flex', gap: 16, height: '80vh' }}>
				{/* Templates Column */}
				<div style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 12,
					height: '100%',
					width: '20%',
					borderRight: '1px solid #f0f0f0',
					paddingRight: 16,
				}}>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						marginBottom: 8,
					}}>
						<BookOpen size={20} color="#1890ff" />
						<h3 style={{ margin: 0, fontSize: '16px' }}>Templates</h3>
						<div style={{ display: 'flex', gap: 4 }}>
							<Tag color="blue">{filteredTemplates.length}</Tag>
							{(() => {
								const templatesWithData = filteredTemplates.filter(t => 
									(t.data_selected || []).length > 0 || (t.kpiSelected || []).length > 0
								);
								return templatesWithData.length > 0 && (
									<Tag color="green" size="small">{templatesWithData.length}✓</Tag>
								);
							})()}
						</div>
					</div>
					
					<Input.Search
						placeholder="Tìm kiếm template..."
						onChange={(e) => setSearchTemplateText(e.target.value)}
						size="small"
					/>
					
					<div style={{ 
						height: 'calc(100% - 80px)', 
						overflowY: 'auto',
						paddingRight: 4,
					}}>
						{filteredTemplates.length > 0 ? (
							filteredTemplates.map(renderTemplateItem)
						) : (
							<div style={{
								textAlign: 'center',
								padding: '40px 20px',
								color: '#8c8c8c',
							}}>
								<BookOpen size={32} style={{ marginBottom: 8 }} />
								<p>Chưa có template nào</p>
							</div>
						)}
					</div>
				</div>

				{/* Data & KPI Column */}
				<div style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 16,
					height: '100%',
					overflowY: 'auto',
					width: '20%',
				}}>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}>
						<h3 style={{ margin: 0, fontSize: '16px' }}>Dữ liệu & KPI</h3>
						{selectedTemplate ? (
							<Tag color="blue">
								Template: {selectedTemplate.name}
							</Tag>
						) : (
							<Tag color="orange">
								Chọn template để gắn dữ liệu
							</Tag>
						)}
					</div>
					
					{/* Tab buttons */}
					<div style={{
						display: 'flex',
						gap: 4,
						borderBottom: '1px solid #f0f0f0',
						marginBottom: 8
					}}>
						<Button
							type={activeTab === 'data' ? 'primary' : 'default'}
							size="small"
							onClick={() => setActiveTab('data')}
							style={{ flex: 1 }}
						>
							Dữ liệu ({filteredFileNotes.length})
						</Button>
						<Button
							type={activeTab === 'kpi' ? 'primary' : 'default'}
							size="small"
							onClick={() => setActiveTab('kpi')}
							style={{ flex: 1 }}
						>
							KPI ({filteredKpis.length})
						</Button>
					</div>
					
					{activeTab === 'data' ? (
						<>
							<Input.Search
								placeholder="Tìm kiếm dữ liệu..."
								onChange={(e) => setSearchText(e.target.value)}
								style={{ marginBottom: 8 }}
								size="small"
							/>
							
							<div style={{ height: 'calc(100% - 140px)', overflowY: 'auto' }}>
								{checkedFiles.length > 0 && (
									<>
										<div style={{
											padding: '4px 12px',
											background: '#fafafa',
											marginBottom: 8,
											borderRadius: 4,
											fontSize: '12px',
											color: '#666'
										}}>
											Đã chọn ({checkedFiles.length})
										</div>
										{checkedFiles.map(renderFileItem)}
									</>
								)}
								{uncheckedFiles.length > 0 && (
									<>
										<div style={{
											padding: '4px 12px',
											background: '#fafafa',
											marginBottom: 8,
											marginTop: checkedFiles.length > 0 ? 16 : 0,
											borderRadius: 4,
											fontSize: '12px',
											color: '#666'
										}}>
											Chưa chọn ({uncheckedFiles.length})
										</div>
										{uncheckedFiles.map(renderFileItem)}
									</>
								)}
							</div>
						</>
					) : (
						<>
							<Input.Search
								placeholder="Tìm kiếm KPI..."
								onChange={(e) => setSearchKpiText(e.target.value)}
								style={{ marginBottom: 8 }}
								size="small"
							/>
							
							<div style={{ height: 'calc(100% - 140px)', overflowY: 'auto' }}>
								{checkedKpis.length > 0 && (
									<>
										<div style={{
											padding: '4px 12px',
											background: '#fafafa',
											marginBottom: 8,
											borderRadius: 4,
											fontSize: '12px',
											color: '#666'
										}}>
											Đã chọn ({checkedKpis.length})
										</div>
										{checkedKpis.map(renderKpiItem)}
									</>
								)}
								{uncheckedKpis.length > 0 && (
									<>
										<div style={{
											padding: '4px 12px',
											background: '#fafafa',
											marginBottom: 8,
											marginTop: checkedKpis.length > 0 ? 16 : 0,
											borderRadius: 4,
											fontSize: '12px',
											color: '#666'
										}}>
											Chưa chọn ({uncheckedKpis.length})
										</div>
										{uncheckedKpis.map(renderKpiItem)}
									</>
								)}
							</div>
						</>
					)}
				</div>

				{/* Data Preview Column */}
				<div style={{ display: 'flex', gap: 16, width: '60%', height: '100%' }}>
					{selectedKpiForView ? (
						/* KPI View */
						<div style={{ width: '100%', height: '100%' }}>
							<KPIViewWithDescription 
								selectedKpiId={selectedKpiForView}
								showChart={true}
								onDescriptionUpdate={refreshKpiList}
							/>
						</div>
					) : (
						/* Data View */
						<>
							<div style={{ width: '60%', height: '100%' }}>
								<h3>{selectedFileNote?.name}</h3>
								{selectedFileNote && (
									<div className="ag-theme-quartz" style={{ height: 'calc(100% - 40px)', width: '100%' }}>
										<AgGridReact
											ref={gridRef}
											rowData={selectedFileNote.rows}
											columnDefs={dynamicColumnDefs}
											pagination={false}
											onGridReady={onGridReady}
											defaultColDef={{
												resizable: true,
												sortable: true,
												filter: true,
											}}
										/>
									</div>
								)}
							</div>
							{selectedFileNote && (
								<div style={{ width: '40%', height: '100%', padding: '0 16px' }}>
									<div style={{ marginBottom: 16 }}>
										<Button type='primary' onClick={useAI} style={{ marginTop: 16 }}>
											Tự động tạo mô tả
										</Button>
									</div>
									<Spin spinning={loading} tip="Hệ thống đang xử lý câu hỏi của bạn và sẽ hoàn thành trong ít phút">
										<Input.TextArea
											placeholder='Nhập mô tả'
											value={selectedFileNote?.desc}
											onChange={(e) => onFileNoteUpdate({ ...selectedFileNote, desc: e.target.value })}
											style={{ height: '60vh' }}
										/>
									</Spin>
									<Button type='primary' onClick={updateDesc} style={{ marginTop: 16 }}>
										Lưu mô tả
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</Modal>
	);
}
