import { Button, Card, Divider, Input, message, Modal, Popconfirm, Tag, Dropdown, Switch, Select } from 'antd';
import { useEffect, useState } from 'react';
import { createSetting, getSettingByType, updateSetting } from '../../../apis/settingService.jsx';
import { getAllQuestionTemplate, getQuestionTemplateById, createQuestionTemplate, updateQuestionTemplate, deleteQuestionTemplate } from '../../../apis/aiQuestionTemplateService.jsx';
import { getAllTemplateSettingAIReportBuilder } from '../../../apis/templateSettingAIReportBuilder';
import {
	CheckOutlined,
	DeleteOutlined,
	EditOutlined,
	PlusOutlined,
	MoreOutlined,
	SearchOutlined,
	FileTextOutlined,
	SettingOutlined,
} from '@ant-design/icons';
import css from './TemplateModal.module.css';
import { v4 as uuidv4 } from 'uuid';
import { createTimestamp, formatDateToDDMMYYYY } from '../../../generalFunction/format.js';
import TemplateSystemMessageModal from './TemplateSystemMessageModal.jsx';
import TemplateDescriptionModal from './TemplateDescriptionModal.jsx';
import TemplateEditModal from './TemplateEditModal.jsx';
import PlaceholderOptionsModal from './PlaceholderOptionsModal.jsx';

const TEMPLATE_SETTING_TYPE = 'AI_TEMPLATE_QUESTIONS';
const TEMPLATE_HISTORY_TYPE = 'AI_TEMPLATE_HISTORY';
const PLACEHOLDER_OPTIONS_TYPE = 'TEMPLATE_PLACEHOLDER_OPTIONS';

export default function TemplateModal({ isOpen, onClose, onSelectTemplate, currentUser, fileNotesFull }) {
	const [templates, setTemplates] = useState([]);
	const [newTemplate, setNewTemplate] = useState('');
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [isAddingTemplate, setIsAddingTemplate] = useState(false);
	const [selectedOptions, setSelectedOptions] = useState({});
	const [templateCategory, setTemplateCategory] = useState('Loại 1');
	const [templateStatus, setTemplateStatus] = useState('active');
	const [templateDescription, setTemplateDescription] = useState('');
	const [templateHistory, setTemplateHistory] = useState({});
	const [historySettingId, setHistorySettingId] = useState(null);
	const [collapsedCategories, setCollapsedCategories] = useState({});
	const [searchTerm, setSearchTerm] = useState('');
	const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
	const [currentDescriptionTemplate, setCurrentDescriptionTemplate] = useState(null);
	const [editingDescription, setEditingDescription] = useState('');
	const [editTemplateModalVisible, setEditTemplateModalVisible] = useState(false);
	const [currentEditTemplate, setCurrentEditTemplate] = useState(null);
	const [autoCreateChart, setAutoCreateChart] = useState(false);
	const [newTemplateAutoChart, setNewTemplateAutoChart] = useState(false);
	const [editTemplateAutoChart, setEditTemplateAutoChart] = useState(false);
	const [systemMessageModalVisible, setSystemMessageModalVisible] = useState(false);
	const [currentSystemMessageTemplate, setCurrentSystemMessageTemplate] = useState(null);
	const [selectedTemplateHasSystemMessage, setSelectedTemplateHasSystemMessage] = useState(false);
	const [selectedTemplateSystemMessageName, setSelectedTemplateSystemMessageName] = useState('');
	
	// Thêm state cho placeholder options
	const [placeholderOptions, setPlaceholderOptions] = useState(null);
	const [placeholderOptionsSettingId, setPlaceholderOptionsSettingId] = useState(null);
	const [placeholderOptionsModalVisible, setPlaceholderOptionsModalVisible] = useState(false);
	const [currentPlaceholderKey, setCurrentPlaceholderKey] = useState('');
	const [currentPlaceholderOptions, setCurrentPlaceholderOptions] = useState([]);
	const [newPlaceholderKey, setNewPlaceholderKey] = useState('');
	const [newPlaceholderOptions, setNewPlaceholderOptions] = useState('');
	const [newPlaceholderOptionsByKey, setNewPlaceholderOptionsByKey] = useState('');

	useEffect(() => {
		if (isOpen) {
			loadTemplates();
			loadTemplateHistory();
			loadPlaceholderOptions();
		}
	}, [isOpen]);

	const loadTemplates = async () => {
		try {
			const data = await getAllQuestionTemplate();
			setTemplates(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error('Error loading templates:', error);
			message.error('Không thể tải danh sách mẫu câu hỏi');
			setTemplates([]);
		}
	};

	const loadTemplateHistory = async () => {
		if (!currentUser?.email) return;

		try {
			const data = await getSettingByType(TEMPLATE_HISTORY_TYPE);
			if (data) {
				setTemplateHistory(data.setting || {});
				setHistorySettingId(data.id);
			} else {
				setTemplateHistory({});
				setHistorySettingId(null);
			}
		} catch (error) {
			console.error('Error loading template history:', error);
			setTemplateHistory({});
		}
	};

	// Thêm function để load placeholder options
	const loadPlaceholderOptions = async () => {
		try {
			const data = await getSettingByType(PLACEHOLDER_OPTIONS_TYPE);
			if (data) {
				setPlaceholderOptions(data.setting );
				setPlaceholderOptionsSettingId(data.id);
			} else {
				// Nếu chưa có placeholder options, tạo mẫu
				const result = await createSetting({
					type: PLACEHOLDER_OPTIONS_TYPE,
					setting: {},
				});
				setPlaceholderOptionsSettingId(result.id);
				setPlaceholderOptions({});
			}
		} catch (error) {
			console.error('Error loading placeholder options:', error);
		}
	};

	// Thêm function để save placeholder options
	const savePlaceholderOptions = async (newOptions) => {
		try {
			if (placeholderOptionsSettingId) {
				await updateSetting({
					id: placeholderOptionsSettingId,
					type: PLACEHOLDER_OPTIONS_TYPE,
					setting: newOptions,
				});
			} else {
				const result = await createSetting({
					type: PLACEHOLDER_OPTIONS_TYPE,
					setting: newOptions,
				});
				setPlaceholderOptionsSettingId(result.id);
			}
			setPlaceholderOptions(newOptions);
		} catch (error) {
			console.error('Error saving placeholder options:', error);
			message.error('Không thể lưu placeholder options');
		}
	};

	const saveTemplateHistory = async (templateId, values) => {
		if (!currentUser?.email) return;

		try {
			const userHistory = templateHistory[currentUser.email] || {};
			userHistory[templateId] = {
				values,
			};

			const updatedHistory = {
				...templateHistory,
				[currentUser.email]: userHistory,
			};

			if (historySettingId) {
				await updateSetting({
					id: historySettingId,
					type: TEMPLATE_HISTORY_TYPE,
					setting: updatedHistory,
				});
			} else {
				const result = await createSetting({
					type: TEMPLATE_HISTORY_TYPE,
					setting: updatedHistory,
				});
				setHistorySettingId(result.id);
			}

			setTemplateHistory(updatedHistory);
		} catch (error) {
			console.error('Error saving template history:', error);
		}
	};

	// Phân tích template để tìm các placeholder
	const parseTemplate = (templateText) => {
		const placeholders = [];
		const regex = /\[([^\]]+)\]/g;
		let match;
		let index = 0;

		while ((match = regex.exec(templateText)) !== null) {
			placeholders.push({
				id: index++,
				placeholder: match[1],
				start: match.index,
				end: match.index + match[0].length,
				fullMatch: match[0],
			});
		}

		return placeholders;
	};

	// Hàm utility để tìm placeholder key phù hợp (không phân biệt hoa thường và trim)
	const findPlaceholderKey = (placeholderText) => {
		const normalizedPlaceholder = placeholderText.trim().toLowerCase();
		const availableKeys = Object.keys(placeholderOptions);
		return availableKeys.find(key => key.toLowerCase() === normalizedPlaceholder);
	};

	// Render template với select dropdown (thay thế input text)
	const renderTemplateWithInputs = (template) => {
		const placeholders = parseTemplate(template.question);
		if (placeholders.length === 0) {
			return <span>{template.question}</span>;
		}

		const parts = [];
		let lastIndex = 0;

		placeholders.forEach((placeholder, index) => {
			// Thêm text trước placeholder
			if (placeholder.start > lastIndex) {
				parts.push(
					<span key={`text-${index}`}>
                        {template.question.substring(lastIndex, placeholder.start)}
                    </span>,
				);
			}

			// Thêm select dropdown cho placeholder
			const optionKey = `${template.id}-${placeholder.id}`;
			const currentValue = selectedOptions[optionKey] || '';
			
			// Sử dụng hàm utility để tìm placeholder key
			const matchedKey = findPlaceholderKey(placeholder.placeholder);
			const options = matchedKey ? placeholderOptions[matchedKey] : [];

			parts.push(
				<Select
					key={`select-${index}`}
					placeholder={placeholder.placeholder}
					value={currentValue || undefined}
					onChange={(value) => setSelectedOptions(prev => ({
						...prev,
						[optionKey]: value,
					}))}
					style={{
						width: Math.max(150, placeholder.placeholder.length * 8 + 50),
						margin: '0 4px',
						minWidth: '150px',
					}}
					size='small'
					className={css.placeholderSelect}
					disabled={template.status === 'coming_soon'}
					allowClear
					showSearch
					filterOption={(input, option) =>
						(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
					}
					options={options.map(option => ({
						value: option,
						label: option,
					}))}
				/>,
			);

			lastIndex = placeholder.end;
		});

		// Thêm text cuối
		if (lastIndex < template.question.length) {
			parts.push(
				<span key='text-end'>
                    {template.question.substring(lastIndex)}
                </span>,
			);
		}

		return parts;
	};

	// Render template với giá trị đã điền (chỉ cho phần hiển thị kết quả)
	const renderTemplateWithFilledValues = (template) => {
		const placeholders = parseTemplate(template.question);
		if (placeholders.length === 0) {
			return <span>{template.question}</span>;
		}

		const parts = [];
		let lastIndex = 0;

		placeholders.forEach((placeholder, index) => {
			// Thêm text trước placeholder
			if (placeholder.start > lastIndex) {
				parts.push(
					<span key={`text-${index}`}>
                        {template.question.substring(lastIndex, placeholder.start)}
                    </span>,
				);
			}

			// Thêm giá trị đã điền hoặc placeholder
			const optionKey = `${template.id}-${placeholder.id}`;
			const currentValue = selectedOptions[optionKey] || '';

			parts.push(
				<Tag key={`placeholder-${index}`} color={currentValue ? 'blue' : 'orange'}
					 className={css.placeholderTag}>
					{currentValue || placeholder.placeholder}
				</Tag>,
			);

			lastIndex = placeholder.end;
		});

		// Thêm text cuối
		if (lastIndex < template.question.length) {
			parts.push(
				<span key='text-end'>
                    {template.question.substring(lastIndex)}
                </span>,
			);
		}

		return parts;
	};

	// Kiểm tra xem đã điền đầy đủ các điều kiện chưa
	const isAllConditionsFilled = (template) => {
		if (!template) return false;

		const placeholders = parseTemplate(template.question);
		if (placeholders.length === 0) return true;

		return placeholders.every(placeholder => {
			const optionKey = `${template.id}-${placeholder.id}`;
			const currentValue = selectedOptions[optionKey];
			
			// Sử dụng hàm utility để tìm placeholder key
			const matchedKey = findPlaceholderKey(placeholder.placeholder);
			
			// Nếu có options, phải chọn một option
			if (matchedKey && placeholderOptions[matchedKey].length > 0) {
				return currentValue && currentValue.trim() !== '';
			}
			
			// Nếu không có options, không cần điền
			return true;
		});
	};

	// Load lịch sử khi chọn template
	const loadTemplateHistoryForUser = (templateId) => {
		if (!currentUser?.email || !templateHistory[currentUser.email]?.[templateId]) {
			return;
		}

		const history = templateHistory[currentUser.email][templateId];
		setSelectedOptions(history.values || {});
	};

	// Thêm function để quản lý placeholder options
	const handleOpenPlaceholderOptionsModal = (key = '') => {
		if (key) {
			setCurrentPlaceholderKey(key);
			setCurrentPlaceholderOptions(placeholderOptions[key] || []);
		} else {
			setCurrentPlaceholderKey('');
			setCurrentPlaceholderOptions([]);
		}
		setNewPlaceholderKey('');
		setNewPlaceholderOptions('');
		setPlaceholderOptionsModalVisible(true);
	};

	const handleSavePlaceholderOptions = async () => {
		if (!currentPlaceholderKey.trim()) {
			message.error('Vui lòng nhập tên placeholder');
			return;
		}

		if (currentPlaceholderOptions.length === 0) {
			message.error('Vui lòng thêm ít nhất một option');
			return;
		}

		try {
			const updatedOptions = {
				...placeholderOptions,
				[currentPlaceholderKey]: currentPlaceholderOptions,
			};

			await savePlaceholderOptions(updatedOptions);
			message.success('Đã lưu placeholder options thành công!');
			setPlaceholderOptionsModalVisible(false);
		} catch (error) {
			console.error('Error saving placeholder options:', error);
			message.error('Không thể lưu placeholder options');
		}
	};

	const handleDeletePlaceholderKey = async (key) => {
		try {
			const { [key]: deleted, ...remainingOptions } = placeholderOptions;
			await savePlaceholderOptions(remainingOptions);
			message.success('Đã xóa placeholder key thành công!');
		} catch (error) {
			console.error('Error deleting placeholder key:', error);
			message.error('Không thể xóa placeholder key');
		}
	};

	const handleAddNewPlaceholderKey = async () => {
		if (!newPlaceholderKey.trim()) {
			message.error('Vui lòng nhập tên placeholder');
			return;
		}

		if (placeholderOptions[newPlaceholderKey]) {
			message.error('Placeholder key đã tồn tại');
			return;
		}

		const options = newPlaceholderOptions.split('\n').filter(option => option.trim());
		if (options.length === 0) {
			message.error('Vui lòng nhập ít nhất một option');
			return;
		}

		try {
			// Tạo object mới với key mới
			const updatedOptions = {
				...placeholderOptions,
				[newPlaceholderKey]: options,
			};

			// Lưu vào database
			await savePlaceholderOptions(updatedOptions);

			// Set state cho edit section
			setCurrentPlaceholderKey(newPlaceholderKey);
			setCurrentPlaceholderOptions(options);
			
			// Reset form
			setNewPlaceholderKey('');
			setNewPlaceholderOptions('');
			
			message.success(`Đã tạo placeholder key "${newPlaceholderKey}" thành công!`);
		} catch (error) {
			console.error('Error adding new placeholder key:', error);
			message.error('Không thể tạo placeholder key');
		}
	};

	const handleAddOption = async () => {
		if (!newPlaceholderOptionsByKey.trim()) {
			message.error('Vui lòng nhập option');
			return;
		}

		if (!currentPlaceholderKey) {
			message.error('Vui lòng chọn placeholder key để thêm option');
			return;
		}

		const options = newPlaceholderOptionsByKey.split('\n').filter(option => option.trim());
		const updatedOptions = [...currentPlaceholderOptions, ...options];

		try {
			// Cập nhật options trong database
			const updatedPlaceholderOptions = {
				...placeholderOptions,
				[currentPlaceholderKey]: updatedOptions,
			};

			await savePlaceholderOptions(updatedPlaceholderOptions);

			// Cập nhật state local
			setCurrentPlaceholderOptions(updatedOptions);
			setNewPlaceholderOptionsByKey('');
			
			message.success(`Đã thêm ${options.length} option(s) vào "${currentPlaceholderKey}"`);
		} catch (error) {
			console.error('Error adding options:', error);
			message.error('Không thể thêm options');
		}
	};

	const handleRemoveOption = async (index) => {
		if (!currentPlaceholderKey) {
			message.error('Vui lòng chọn placeholder key để xóa option');
			return;
		}

		const newOptions = currentPlaceholderOptions.filter((_, i) => i !== index);
		
		try {
			// Cập nhật options trong database
			const updatedPlaceholderOptions = {
				...placeholderOptions,
				[currentPlaceholderKey]: newOptions,
			};

			await savePlaceholderOptions(updatedPlaceholderOptions);

			// Cập nhật state local
			setCurrentPlaceholderOptions(newOptions);
			
			message.success('Đã xóa option thành công');
		} catch (error) {
			console.error('Error removing option:', error);
			message.error('Không thể xóa option');
		}
	};

	const handleAddTemplate = async () => {
		if (!newTemplate.trim()) {
			message.error('Vui lòng nhập mẫu câu hỏi');
			return;
		}
		const newTemplateObj = {
			question: newTemplate.trim(),
			description: templateDescription.trim(),
			category: templateCategory,
			status: templateStatus,
			user_create: currentUser?.email || 'Unknown',
			created_at: createTimestamp(),
			autoCreateChart: newTemplateAutoChart,
			show: true,
			used_time: '',
			id_template: null, // For now, set to null
			quest_setting: {},
		};
		try {
			await createQuestionTemplate(newTemplateObj);
			await loadTemplates();
			setNewTemplate('');
			setTemplateDescription('');
			setTemplateCategory('Loại 1');
			setTemplateStatus('active');
			setNewTemplateAutoChart(false);
			setIsAddingTemplate(false);
			message.success('Thêm mẫu câu hỏi thành công!');
		} catch (error) {
			console.error('Error adding template:', error);
			message.error('Không thể thêm mẫu câu hỏi');
		}
	};

	const handleOpenEditTemplateModal = (template) => {
		setCurrentEditTemplate(template);
		setNewTemplate(template.question || '');
		setTemplateDescription(template.description || '');
		setTemplateCategory(template.category || 'Loại 1');
		setTemplateStatus(template.status || 'active');
		setEditTemplateAutoChart(template.autoCreateChart || false);
		setEditTemplateModalVisible(true);
	};

	const handleEditTemplate = async () => {
		if (!currentEditTemplate) {
			message.error('Vui lòng nhập mẫu câu hỏi');
			return;
		}
		const updatedObj = {
			...currentEditTemplate,
			question: newTemplate.trim() || currentEditTemplate.question || '',
			description: templateDescription.trim(),
			category: templateCategory,
			status: templateStatus,
			autoCreateChart: editTemplateAutoChart,
		};
		try {
			await updateQuestionTemplate(updatedObj);
			await loadTemplates();
			setNewTemplate('');
			setTemplateDescription('');
			setTemplateCategory('Loại 1');
			setTemplateStatus('active');
			setEditTemplateAutoChart(false);
			setEditTemplateModalVisible(false);
			setCurrentEditTemplate(null);
			message.success('Cập nhật mẫu câu hỏi thành công!');
		} catch (error) {
			console.error('Error updating template:', error);
			message.error('Không thể cập nhật mẫu câu hỏi');
		}
	};

	const handleDeleteTemplate = async (templateId) => {
		if (!currentUser?.isAdmin) {
			message.error('Chỉ quản trị viên mới có thể xóa mẫu câu hỏi');
			return;
		}
		try {
			await deleteQuestionTemplate(templateId);
			// Remove related system message as before
			try {
				const systemMessageSetting = await getSettingByType('TEMPLATE_SYSTEM_MESSAGE');
				if (systemMessageSetting && systemMessageSetting.setting) {
					const { [templateId]: deleted, ...remainingSettings } = systemMessageSetting.setting;
					await updateSetting({
						id: systemMessageSetting.id,
						type: 'TEMPLATE_SYSTEM_MESSAGE',
						setting: remainingSettings,
					});
				}
			} catch (error) {
				console.error('Error deleting template system message:', error);
			}
			await loadTemplates();
			if (selectedTemplate?.id === templateId) {
				setSelectedTemplate(null);
			}
			message.success('Đã xóa mẫu câu hỏi thành công');
		} catch (error) {
			console.error('Error deleting template:', error);
			message.error('Không thể xóa mẫu câu hỏi');
		}
	};

	const handleSelectTemplate = (template) => {
		setSelectedTemplate(template);
		// Load template's chart status
		setAutoCreateChart(template.autoCreateChart || false);
		setIsAddingTemplate(false);
		// Load template history for this user
		loadTemplateHistoryForUser(template.id);
		
		// Kiểm tra xem template có System Message không từ bản ghi JSONB duy nhất
		const checkTemplateSystemMessage = async () => {
			try {
				const systemMessageSetting = await getSettingByType('TEMPLATE_SYSTEM_MESSAGE');
				const templateSystemMessage = systemMessageSetting?.setting?.[template.id];
				const hasSystemMessage = !!(templateSystemMessage && templateSystemMessage.selectedSystemMessageId);
				setSelectedTemplateHasSystemMessage(hasSystemMessage);
				
				// Load tên của bộ System Message nếu có
				if (hasSystemMessage && templateSystemMessage.selectedSystemMessageId) {
					try {
						const allSystemMessages = await getAllTemplateSettingAIReportBuilder();
						const systemMessages = Array.isArray(allSystemMessages.data) ? allSystemMessages.data : [];
						const selectedSystem = systemMessages.find(sm => sm.id === templateSystemMessage.selectedSystemMessageId);
						setSelectedTemplateSystemMessageName(selectedSystem?.name || '');
					} catch (error) {
						console.error('Error loading system message name:', error);
						setSelectedTemplateSystemMessageName('');
					}
				} else {
					setSelectedTemplateSystemMessageName('');
				}
			} catch (error) {
				console.error('Error checking template system message:', error);
				setSelectedTemplateHasSystemMessage(false);
				setSelectedTemplateSystemMessageName('');
			}
		};
		checkTemplateSystemMessage();
	};

	const handleApplyTemplate = async () => {
		if (selectedTemplate) {
			// Kiểm tra lại status trước khi áp dụng
			if (selectedTemplate.status === 'coming_soon' && !currentUser?.isAdmin) {
				message.info('Tính năng này sẽ sớm có sẵn!');
				return;
			}

			// Kiểm tra đã điền đầy đủ điều kiện chưa
			if (!isAllConditionsFilled(selectedTemplate)) {
				message.warning('Vui lòng điền đầy đủ các điều kiện trước khi gửi');
				return;
			}

			// Lưu lịch sử các giá trị đã điền
			await saveTemplateHistory(selectedTemplate.id, selectedOptions);

			// Tạo câu hỏi hoàn chỉnh từ template và inputs đã nhập
			let finalQuestion = selectedTemplate.question || '';
			let finalDescription = selectedTemplate.description || '';
			const prompt = `Câu hỏi:\n${finalQuestion}\n\nMô tả bổ sung:\n${finalDescription}`;

			const placeholders = parseTemplate(selectedTemplate.question);

			placeholders.forEach(placeholder => {
				const optionKey = `${selectedTemplate.id}-${placeholder.id}`;
				const selectedValue = selectedOptions[optionKey];
				if (selectedValue) {
					finalQuestion = finalQuestion.replace(placeholder.fullMatch, selectedValue);
				}
			});

			// Load System Message từ template từ bản ghi JSONB duy nhất
			let templateSystemMessage = null;
			try {
				const systemMessageSetting = await getSettingByType('TEMPLATE_SYSTEM_MESSAGE');
				if (systemMessageSetting?.setting?.[selectedTemplate.id]) {
					templateSystemMessage = systemMessageSetting.setting[selectedTemplate.id];
					console.log('Loaded template system message:', templateSystemMessage);
				}
			} catch (error) {
				console.error('Error loading template system message:', error);
			}
			console.log('finalDescription', finalDescription);
			onSelectTemplate(finalQuestion, finalDescription, autoCreateChart, templateSystemMessage, selectedTemplate.quest_setting);
			onClose();
		}
	};

	const handleUpdateTemplateStatus = async (templateId, newStatus) => {
		if (!currentUser?.isAdmin) {
			message.error('Chỉ quản trị viên mới có thể cập nhật trạng thái');
			return;
		}
		try {
			const template = templates.find(t => t.id === templateId);
			if (!template) return;
			const updatedObj = { ...template, status: newStatus };
			await updateQuestionTemplate(updatedObj);
			await loadTemplates();
			if (selectedTemplate?.id === templateId) {
				const updatedSelectedTemplate = { ...template, status: newStatus };
				setSelectedTemplate(updatedSelectedTemplate);
			}
			if (selectedTemplate?.id === templateId && newStatus === 'coming_soon') {
				setSelectedTemplate(null);
				setSelectedOptions({});
			}
			message.success('Đã cập nhật trạng thái thành công');
		} catch (error) {
			console.error('Error updating template status:', error);
			message.error('Không thể cập nhật trạng thái');
		}
	};

	const handleToggleAddTemplate = () => {
		setIsAddingTemplate(!isAddingTemplate);
		// Nếu đang thêm mới, bỏ chọn template hiện tại
		if (!isAddingTemplate) {
			setSelectedTemplate(null);
			setSelectedOptions({});
		}
	};

	const handleOpenDescriptionModal = (template) => {
		setCurrentDescriptionTemplate(template);
		setEditingDescription(template.description || '');
		setDescriptionModalVisible(true);
	};

	const handleUpdateDescription = async () => {
		if (!currentUser?.isAdmin) {
			message.error('Chỉ quản trị viên mới có thể cập nhật mô tả');
			return;
		}
		try {
			const template = templates.find(t => t.id === currentDescriptionTemplate.id);
			if (!template) return;
			const updatedObj = { ...template, description: editingDescription.trim() };
			await updateQuestionTemplate(updatedObj);
			await loadTemplates();
			setDescriptionModalVisible(false);
			setCurrentDescriptionTemplate(null);
			setEditingDescription('');
			message.success('Đã cập nhật mô tả thành công');
		} catch (error) {
			console.error('Error updating description:', error);
			message.error('Không thể cập nhật mô tả');
		}
	};

	const getTemplatePreview = (template) => {
		return renderTemplateWithFilledValues(template);
	};

	const getTemplatesByCategory = (category) => {
		return templates.filter(template => template.category === category);
	};

	const toggleCategory = (category) => {
		setCollapsedCategories(prev => ({
			...prev,
			[category]: !prev[category],
		}));
	};

	const getFilteredTemplates = () => {
		if (!searchTerm.trim()) {
			return templates;
		}
		return templates.filter(template =>
			template?.question?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
			template?.category?.toLowerCase()?.includes(searchTerm.toLowerCase()),
		);
	};

	const getFilteredTemplatesByCategory = (category) => {
		const filteredTemplates = getFilteredTemplates();
		return filteredTemplates.filter(template => template.category === category);
	};

	// Cấu hình các loại template
	const CATEGORY_CONFIG = [
		{ category: 'Loại 1', title: 'Phân tích tổng hợp' },
		{ category: 'Loại 2', title: 'Phân tích xếp hạng & so sánh' },
		{ category: 'Loại 3', title: 'So sánh theo thời gian' },
		{ category: 'Loại 4', title: 'Phân tích mục tiêu và thực tế' },
		{ category: 'Loại 5', title: 'Phân tích xu hướng hiện tại' },
	];

	// Component để render template card
	const TemplateCard = ({ template }) => {
		return (
			<Card
				key={template.id}
				className={`${css.templateCard} ${selectedTemplate?.id === template.id ? css.selectedCard : ''} ${template.status === 'coming_soon' ? css.comingSoonCard : ''} ${currentUser?.isAdmin && template.status === 'coming_soon' ? css.adminView : ''}`}
				onClick={() => handleSelectTemplate(template)}
				hoverable={template.status !== 'coming_soon' || currentUser?.isAdmin}
			>
				<div className={css.templateContent}>
					<div className={css.templateQuestion}>
						<div className={css.templateText}>
							{template.question}
						</div>
					</div>

					<div className={css.templateMeta}>
						<div className={css.metaActions}>
							{currentUser?.isAdmin && (
								<Dropdown
									menu={{
										items: [
											{
												key: 'view_description',
												label: (
													<div style={{
														display: 'flex',
														alignItems: 'center',
														gap: 8,
													}}>
														<FileTextOutlined />
														<span>Xem mô tả</span>
													</div>
												),
												onClick: (e) => {
													e.domEvent.stopPropagation();
													handleOpenDescriptionModal(template);
												},
											},
											{
												key: 'system_message',
												label: (
													<div style={{
														display: 'flex',
														alignItems: 'center',
														gap: 8,
													}}>
														<SettingOutlined />
														<span>Set up System Message</span>
													</div>
												),
												onClick: (e) => {
													e.domEvent.stopPropagation();
													handleOpenSystemMessageModal(template);
												},
											},
											{
												key: 'edit',
												label: (
													<div style={{
														display: 'flex',
														alignItems: 'center',
														gap: 8,
													}}>
														<EditOutlined />
														<span>Sửa mẫu câu hỏi</span>
													</div>
												),
												onClick: (e) => {
													e.domEvent.stopPropagation();
													handleOpenEditTemplateModal(template);
												},
											},
											{
												key: 'delete',
												danger: true,
												label: (
													<Popconfirm
														placement={'topRight'}
														title='Xóa mẫu câu hỏi'
														description='Bạn có chắc chắn muốn xóa mẫu câu hỏi này?'
														onConfirm={() => handleDeleteTemplate(template.id)}
														okText='Có'
														cancelText='Không'
													>
														<div style={{
															display: 'flex',
															alignItems: 'center',
															gap: 8,
														}}>
															<DeleteOutlined />
															<span>Xóa mẫu câu hỏi</span>
														</div>
													</Popconfirm>
												),
												onClick: (e) => e.domEvent.stopPropagation(),
											},
										],
									}}
									trigger={['click']}
									placement='right'
								>
									<Button
										type='text'
										icon={<MoreOutlined />}
										className={css.moreButton}
										onClick={e => e.stopPropagation()}
										title='Thêm tùy chọn'
									/>
								</Dropdown>
							)}
						</div>
					</div>
				</div>
			</Card>
		);
	};

	// Component để render category section
	const CategorySection = ({ category, title }) => (
		<div className={css.categorySection}>
			<h4
				className={css.categoryTitle}
				onClick={() => toggleCategory(category)}
				style={{ cursor: 'pointer' }}
			>
				{title}
				<span className={css.collapseIcon}>
					{collapsedCategories[category] ? '▼' : '▲'}
				</span>
			</h4>
			{!collapsedCategories[category] && getFilteredTemplatesByCategory(category).map(template => (
				<TemplateCard key={template.id} template={template} />
			))}
		</div>
	);

	const handleUpdateTemplateChartStatus = async (templateId, newChartStatus) => {
		try {
			const template = templates.find(t => t.id === templateId);
			if (!template) return;
			const updatedObj = { ...template, autoCreateChart: newChartStatus };
			await updateQuestionTemplate(updatedObj);
			await loadTemplates();
			message.success('Cập nhật trạng thái chart thành công!');
		} catch (error) {
			console.error('Error updating template chart status:', error);
			message.error('Không thể cập nhật trạng thái chart');
		}
	};

	const handleSaveCurrentChartStatus = async () => {
		if (!selectedTemplate) return;

		try {
			await handleUpdateTemplateChartStatus(selectedTemplate.id, autoCreateChart);
			// Update selected template with new chart status
			setSelectedTemplate({ ...selectedTemplate, autoCreateChart });
		} catch (error) {
			console.error('Error saving chart status:', error);
		}
	};

	const handleOpenSystemMessageModal = (template) => {
		console.log('template', template);
		setCurrentSystemMessageTemplate(template);
		setSystemMessageModalVisible(true);
	};

	const handleCloseSystemMessageModal = () => {
		setSystemMessageModalVisible(false);
		setCurrentSystemMessageTemplate(null);
		
		// Refresh System Message status nếu có template đang được chọn
		if (selectedTemplate) {
			const checkTemplateSystemMessage = async () => {
				try {
					const systemMessageSetting = await getSettingByType('TEMPLATE_SYSTEM_MESSAGE');
					const templateSystemMessage = systemMessageSetting?.setting?.[selectedTemplate.id];
					const hasSystemMessage = !!(templateSystemMessage && templateSystemMessage.selectedSystemMessageId);
					setSelectedTemplateHasSystemMessage(hasSystemMessage);
					
					// Load tên của bộ System Message nếu có
					if (hasSystemMessage && templateSystemMessage.selectedSystemMessageId) {
						try {
							const allSystemMessages = await getAllTemplateSettingAIReportBuilder();
							const systemMessages = Array.isArray(allSystemMessages.data) ? allSystemMessages.data : [];
							const selectedSystem = systemMessages.find(sm => sm.id === templateSystemMessage.selectedSystemMessageId);
							setSelectedTemplateSystemMessageName(selectedSystem?.name || '');
						} catch (error) {
							console.error('Error loading system message name:', error);
							setSelectedTemplateSystemMessageName('');
						}
					} else {
						setSelectedTemplateSystemMessageName('');
					}
				} catch (error) {
					console.error('Error checking template system message:', error);
					setSelectedTemplateHasSystemMessage(false);
					setSelectedTemplateSystemMessageName('');
				}
			};
			checkTemplateSystemMessage();
		}
		loadTemplates();
		loadTemplateHistory();
		loadPlaceholderOptions();
	};

	const handleRenamePlaceholderKey = async (oldKey, newKey) => {
		try {
			// Tạo object mới với key đã đổi tên
			const { [oldKey]: oldOptions, ...remainingOptions } = placeholderOptions;
			const updatedOptions = {
				...remainingOptions,
				[newKey]: oldOptions,
			};

			// Lưu vào database
			await savePlaceholderOptions(updatedOptions);

			// Cập nhật current key nếu đang edit key này
			if (currentPlaceholderKey === oldKey) {
				setCurrentPlaceholderKey(newKey);
			}

			message.success(`Đã đổi tên key "${oldKey}" thành "${newKey}"`);
		} catch (error) {
			console.error('Error renaming placeholder key:', error);
			message.error('Không thể đổi tên key');
		}
	};

	return (
		<Modal
			title={
				<div className={css.modalTitle}>
					<span>Mẫu phân tích báo cáo</span>
					<Tag color='blue'>{templates.length} mẫu</Tag>
				</div>
			}
			open={isOpen}
			onCancel={onClose}
			footer={null}
			width={1400}
			className={css.templateModal}
		>
			<div className={css.templateContainer}>
				{/* Phần mẫu câu hỏi bên trái */}
				<div className={css.templateListSection}>
					<div className={css.sectionHeader}>
						<div className={css.searchContainer}>
							<Input
								placeholder='Tìm kiếm theo nội dung câu hỏi hoặc loại...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								prefix={<SearchOutlined />}
								className={css.searchInput}
								allowClear
							/>
						</div>
						{currentUser?.isAdmin && (
							<div className={css.headerActions}>
								<Button
									type='primary'
									icon={<SettingOutlined />}
									onClick={() => handleOpenPlaceholderOptionsModal()}
									size='small'
								>
									Quản lý Placeholder Options
								</Button>
							</div>
						)}
					</div>

					<div className={css.templateList}>
						{getFilteredTemplates().length === 0 ? (
							<div className={css.emptyState}>
								{searchTerm ? (
									<>
										<p>Không tìm thấy mẫu câu hỏi phù hợp</p>
										<p>Hãy thử từ khóa khác</p>
									</>
								) : (
									<>
										<p>Chưa có mẫu câu hỏi nào</p>
										{currentUser?.isAdmin && (
											<p>Hãy thêm mẫu câu hỏi đầu tiên bên phải</p>
										)}
									</>
								)}
							</div>
						) : (
							<>
								{CATEGORY_CONFIG.map(({ category, title }) => (
									<CategorySection key={category} category={category} title={title} />
								))}
							</>
						)}
					</div>
				</div>

				{/* Phần lựa chọn thêm vào khoảng trống bên phải */}
				<div className={css.selectionSection}>
					{selectedTemplate && !isAddingTemplate ? (
						<div className={css.selectedTemplatePreview}>
							<Card className={css.previewCard}>
								<div className={css.previewHeader}>
									<h4 style={{ fontSize: '20px', fontWeight: 'bold' }}>🎯 Tùy chỉnh câu hỏi</h4>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										{selectedTemplateHasSystemMessage && (
											<Tag color="blue" icon={<SettingOutlined />}>
												{selectedTemplateSystemMessageName || 'Custom System Message'}
											</Tag>
										)}
										{currentUser?.isAdmin && (
											<>
												<select
													value={selectedTemplate.status}
													onChange={(e) => handleUpdateTemplateStatus(selectedTemplate.id, e.target.value)}
													className={css.statusDropdown}
													style={{ width: 'auto', fontSize: '12px' }}
												>
													<option value='active'>🟢 Hoạt động</option>
													<option value='coming_soon'>🟡 Coming Soon</option>
												</select>
											</>
										)}
									</div>
								</div>

								<div className={css.previewContent}>
									<div className={css.optionsSection}>
										<p className={css.previewLabel}>Nhập điều kiện:</p>
										<div className={css.optionsContainer}>
											{renderTemplateWithInputs(selectedTemplate)}
										</div>
									</div>

									<Divider />

									<div className={css.finalPreview}>
										<p className={css.previewLabel}>Câu hỏi sẽ gửi:</p>
										<div className={css.finalQuestion}>
											{getTemplatePreview(selectedTemplate)}
										</div>
										{!isAllConditionsFilled(selectedTemplate) && (
											<div className={css.conditionWarning}>
												⚠️ Vui lòng điền đầy đủ các điều kiện để có thể gửi câu hỏi
											</div>
										)}

										{/* Auto-chart creation option */}
										<div style={{
											marginTop: '16px',
											padding: '12px',
											backgroundColor: '#f0f8ff',
											borderRadius: '6px',
											border: '1px solid #d6e4ff',
										}}>
											<div style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												marginBottom: '6px',
											}}>
												<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
													<span style={{ fontSize: 13, fontWeight: 500, color: '#1890ff' }}>
														Tự động tạo biểu đồ
													</span>
													{currentUser?.isAdmin && (
														<span style={{ fontSize: 11, color: '#666' }}>
															(Template: {selectedTemplate.autoCreateChart ? 'Bật' : 'Tắt'})
														</span>
													)}
												</div>
												<Switch
													checked={autoCreateChart}
													onChange={setAutoCreateChart}
													checkedChildren='Bật'
													unCheckedChildren='Tắt'
													size='small'
												/>
											</div>
											<div style={{
												fontSize: 12,
												color: '#666',
												marginBottom: currentUser?.isAdmin ? '8px' : '0',
											}}>
												{autoCreateChart ?
													'✅ Sẽ tự động tạo biểu đồ khi phân tích dữ liệu' :
													'ℹ️ Chỉ phân tích dữ liệu, không tạo biểu đồ'
												}
											</div>
										</div>
									</div>
								</div>

								<div className={css.previewActions}>
									<Button
										type='primary'
										size='large'
										onClick={handleApplyTemplate}
										className={css.applyButton}
										disabled={!isAllConditionsFilled(selectedTemplate)}
									>
										✅ Áp dụng câu hỏi này
									</Button>
									<Button
										size='large'
										onClick={() => {
											setSelectedTemplate(null);
											setSelectedOptions({});
											setAutoCreateChart(false);
										}}
									>
										🔄 Bỏ chọn
									</Button>
								</div>
							</Card>
						</div>
					) : !isAddingTemplate ? (
						<div className={css.noSelection}>
							<div className={css.noSelectionContent}>
								<div style={{ textAlign: 'center', padding: '40px 20px' }}>
									<div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
									<h3 style={{ marginBottom: '12px', color: '#333' }}>Chọn mẫu câu hỏi</h3>
									<p style={{ color: '#666', marginBottom: '8px' }}>Hãy chọn một mẫu câu hỏi từ danh
										sách bên trái</p>
									<p style={{ color: '#999', fontSize: '14px' }}>Sau đó tùy chỉnh các thông số và áp
										dụng</p>
								</div>
							</div>
						</div>
					) : null}

					{/* Phần thêm mẫu mới */}
					{currentUser?.isAdmin && (
						<div className={css.addTemplateSection}>
							<div className={css.sectionHeader}>
								<h3 onClick={handleToggleAddTemplate}>{isAddingTemplate ? '➕ Ẩn thêm mẫu câu hỏi mới' : '➕ Thêm mẫu câu hỏi mới'} </h3>
							</div>

							{isAddingTemplate && (
								<Card className={css.addTemplateCard}>
									<div className={css.templateGuide}>
										<h4>📋 Hướng dẫn tạo mẫu:</h4>
										<ul>
											<li>Sử dụng <code>[TÊN_BIẾN]</code> để tạo placeholder</li>
											<li>Ví
												dụ: <code>[KHU_VỰC]</code>, <code>[THỜI_GIAN]</code>, <code>[SỐ_LƯỢNG]</code>
											</li>
											<li>Người dùng sẽ nhập giá trị vào các placeholder này</li>
										</ul>
										<p><strong>Ví dụ:</strong> Tổng doanh số theo [KHU_VỰC] là bao nhiêu</p>
									</div>

									<div className={css.templateInput}>
										<div className={css.categorySelect}>
											<label>Loại câu hỏi:</label>
											<select
												value={templateCategory}
												onChange={(e) => setTemplateCategory(e.target.value)}
												className={css.categoryDropdown}
											>
												{CATEGORY_CONFIG.map(({ category, title }) => (
													<option key={category} value={category}>
														{category}: {title}
													</option>
												))}
											</select>
										</div>
										<div className={css.categorySelect}>
											<label>Trạng thái:</label>
											<select
												value={templateStatus}
												onChange={(e) => setTemplateStatus(e.target.value)}
												className={css.categoryDropdown}
											>
												<option value='active'>🟢 Hoạt động</option>
												<option value='coming_soon'>🟡 Coming Soon</option>
											</select>
										</div>
										<div className={css.autoChartSelect}>
											<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span>Tự động tạo biểu đồ:</span>
												<Switch
													checked={newTemplateAutoChart}
													onChange={setNewTemplateAutoChart}
													size='small'
												/>
												<span style={{ fontSize: 12, color: '#666', marginLeft: 24 }}>
														{newTemplateAutoChart ?
															'Sẽ tự động tạo biểu đồ khi sử dụng ' :
															'Chỉ phân tích dữ liệu, không tạo biểu đồ'
														}
												</span>
											</label>
										</div>
										<Input.TextArea
											value={newTemplate}
											onChange={(e) => setNewTemplate(e.target.value)}
											placeholder='Nhập mẫu câu hỏi mới... Ví dụ: Tổng doanh số theo [KHU_VỰC] là bao nhiêu'
											autoSize={{ minRows: 4 }}
											className={css.newTemplateTextarea}
										/>
										<Input.TextArea
											value={templateDescription}
											onChange={(e) => setTemplateDescription(e.target.value)}
											placeholder='Mô tả chi tiết về mẫu câu hỏi này...'
											autoSize={{ minRows: 3 }}
											className={css.newTemplateTextarea}
											style={{ marginTop: '12px' }}
										/>
									</div>
									<Button
										type='primary'
										icon={<PlusOutlined />}
										onClick={handleAddTemplate}
										size='large'
										className={css.addButton}
										disabled={!newTemplate.trim()}
									>
										Thêm mẫu câu hỏi
									</Button>
								</Card>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Modal xem và chỉnh sửa mô tả */}
			<TemplateDescriptionModal
				isOpen={descriptionModalVisible}
				onClose={() => {
					setDescriptionModalVisible(false);
					setCurrentDescriptionTemplate(null);
					setEditingDescription('');
				}}
				onUpdateDescription={handleUpdateDescription}
				currentDescriptionTemplate={currentDescriptionTemplate}
				editingDescription={editingDescription}
				setEditingDescription={setEditingDescription}
				currentUser={currentUser}
			/>

			{/* Modal chỉnh sửa template */}
			<TemplateEditModal
				isOpen={editTemplateModalVisible}
				onClose={() => {
					setEditTemplateModalVisible(false);
					setCurrentEditTemplate(null);
				}}
				onEditTemplate={handleEditTemplate}
				currentEditTemplate={currentEditTemplate}
				setCurrentEditTemplate={setCurrentEditTemplate}
				newTemplate={newTemplate}
				setNewTemplate={setNewTemplate}
				templateDescription={templateDescription}
				setTemplateDescription={setTemplateDescription}
				templateCategory={templateCategory}
				setTemplateCategory={setTemplateCategory}
				templateStatus={templateStatus}
				setTemplateStatus={setTemplateStatus}
				editTemplateAutoChart={editTemplateAutoChart}
				setEditTemplateAutoChart={setEditTemplateAutoChart}
				CATEGORY_CONFIG={CATEGORY_CONFIG}
				currentUser={currentUser}
			/>

			{/* Template System Message Modal */}
			<TemplateSystemMessageModal
				isOpen={systemMessageModalVisible}
				onClose={handleCloseSystemMessageModal}
				template={currentSystemMessageTemplate}
				currentUser={currentUser}
				fileNotesFull = {fileNotesFull}
			/>

			{/* Placeholder Options Management Modal */}
			<PlaceholderOptionsModal
				isOpen={placeholderOptionsModalVisible}
				onClose={() => setPlaceholderOptionsModalVisible(false)}
				onSavePlaceholderOptions={handleSavePlaceholderOptions}
				onDeletePlaceholderKey={handleDeletePlaceholderKey}
				onAddNewPlaceholderKey={handleAddNewPlaceholderKey}
				onAddOption={handleAddOption}
				onRemoveOption={handleRemoveOption}
				onOpenPlaceholderOptionsModal={handleOpenPlaceholderOptionsModal}
				currentPlaceholderKey={currentPlaceholderKey}
				setCurrentPlaceholderKey={setCurrentPlaceholderKey}
				currentPlaceholderOptions={currentPlaceholderOptions}
				setCurrentPlaceholderOptions={setCurrentPlaceholderOptions}
				newPlaceholderKey={newPlaceholderKey}
				setNewPlaceholderKey={setNewPlaceholderKey}
				newPlaceholderOptionsByKey={newPlaceholderOptionsByKey}
				setNewPlaceholderOptionsByKey={setNewPlaceholderOptionsByKey}
				newPlaceholderOptions={newPlaceholderOptions}
				setNewPlaceholderOptions={setNewPlaceholderOptions}
				placeholderOptions={placeholderOptions}
				onRenamePlaceholderKey={handleRenamePlaceholderKey}
			/>
		</Modal>
	);
} 