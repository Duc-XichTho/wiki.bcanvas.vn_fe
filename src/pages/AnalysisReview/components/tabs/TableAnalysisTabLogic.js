// TableAnalysisTabLogic.js - Contains all business logic for TableAnalysisTab
// This file separates logic from UI for better modularity

import { message } from 'antd';
import {
	createDashBoardItem,
	deleteDashBoardItem,
	getAllDashBoardItems,
	getDashBoardItemById,
	updateDashBoardItem,
} from '../../../../apis/dashBoardItemService.jsx';
import { aiGen } from '../../../../apis/botService.jsx';
import { getAllKpi2Calculator, getKpi2CalculatorById } from '../../../../apis/kpi2CalculatorService.jsx';
import { getAllKpiCalculator, getKpiCalculatorById } from '../../../../apis/kpiCalculatorService.jsx';
import {
	getAllTemplateTables,
	getTableByid,
	getTemplateColumn,
	getTemplateRow,
} from '../../../../apis/templateSettingService.jsx';
import { getAllFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import { loadAndMergeData } from '../../../Canvas/Daas/Content/Template/SettingCombine/logicCombine.js';
import { createSetting, getSettingByType, updateSetting } from '../../../../apis/settingService.jsx';
import { DEFAULT_PROMPT_DASHBOARD, SETTING_TYPE } from '../../../../CONST.js';

// Load dashboard items
export const loadDashboardItems = async () => {
	try {
		const items = await getAllDashBoardItems();

		if (items && items.length > 0) {
			// Filter only table type items
			const tableItems = items.filter(item => item.type === 'table');
			
			// Ensure each item has tag and category
			const processedItems = tableItems.map(item => ({
				...item,
				tag: item.tag || item.category || 'Revenue',
				category: item.category || item.tag || 'Revenue',
			}));

			return processedItems;
		} else {
			return [];
		}
	} catch (error) {
		console.error('Error loading dashboard items:', error);
		message.error('Lỗi khi tải danh sách dashboard items');
		return [];
	}
};

// Load approved versions
export const loadApprovedVersions = async () => {
	try {
		const approvedVersions = await getAllApprovedVersion();
		// Filter versions that include 'analysis-review' in apps
		const filteredApprovedVersions = approvedVersions.filter(version => 
			version.apps && version.apps.includes('analysis-review')
		);
		return filteredApprovedVersions;
	} catch (error) {
		console.error('Error loading approved versions:', error);
		message.error('Lỗi khi tải danh sách approved versions');
		return [];
	}
};

// Load tags from settings
export const loadTags = async () => {
	try {
		const businessTagsSetting = await getSettingByType('BUSINESS_TAGS');
		const storeTagsSetting = await getSettingByType('STORE_TAGS');

		let businessTags = [];
		let storeTags = [];

		if (businessTagsSetting && businessTagsSetting.setting) {
			businessTags = Array.isArray(businessTagsSetting.setting) 
				? businessTagsSetting.setting 
				: businessTagsSetting.setting.split(',').map(tag => tag.trim()).filter(tag => tag);
		}

		if (storeTagsSetting && storeTagsSetting.setting) {
			storeTags = Array.isArray(storeTagsSetting.setting) 
				? storeTagsSetting.setting 
				: storeTagsSetting.setting.split(',').map(tag => tag.trim()).filter(tag => tag);
		}

		return { businessTags, storeTags };
	} catch (error) {
		console.error('Error loading tags:', error);
		return { businessTags: [], storeTags: [] };
	}
};

// Load default prompt
export const loadDefaultPrompt = async () => {
	try {
		let settingData = await getSettingByType(SETTING_TYPE.PROMPT_DASHBOARD);
		let data = DEFAULT_PROMPT_DASHBOARD;
		
		if (!settingData) {
			settingData = await createSetting({
				type: SETTING_TYPE.PROMPT_DASHBOARD, 
				setting: data,
			});
		} else {
			data = settingData.setting;
		}
		
		return { defaultPrompt: data, promptSettingData: settingData };
	} catch (error) {
		console.error('Error loading default prompt setting:', error);
		return { defaultPrompt: DEFAULT_PROMPT_DASHBOARD, promptSettingData: null };
	}
};

// Load table data
export const loadTableData = async (dashboardItem, retry = false) => {
	try {
		if (!dashboardItem.idData) {
			console.warn('No idData found for table item');
			return null;
		}

		// Check if we already have fetched data in settings
		if (dashboardItem.settings?.fetchedData && !retry) {
			return dashboardItem.settings.fetchedData;
		}

		// Get the approved version
		const selectedVersion = await getApprovedVersionById(dashboardItem.idData);
		if (!selectedVersion) {
			console.error('Selected version not found');
			return null;
		}

		// Get template table
		const templateTable = await getTableByid(selectedVersion.id_template);
		if (!templateTable) {
			console.error('Template table not found');
			return null;
		}

		let tableData = [];

		if (templateTable.isCombine) {
			tableData = await loadAndMergeData(templateTable);
		} else {
			const versionId = selectedVersion.id_version;
			const targetStep = templateTable.steps?.find(step => step.id === versionId);

			if (targetStep && targetStep.data) {
				tableData = targetStep.data;
			} else {
				const lastStep = templateTable.steps?.[templateTable.steps.length - 1];
				if (lastStep && lastStep.data) {
					tableData = lastStep.data;
				} else {
					// Try to get data using getTemplateRow
					try {
						const response = await getTemplateRow(selectedVersion.id_template, versionId);
						const rows = response.rows || [];
						if (rows && Object.keys(rows).length > 0) {
							tableData = Object.values(rows).map((row) => row.data);
						}
					} catch (error) {
						console.error('Error getting template row:', error);
					}
				}
			}
		}

		if (tableData && tableData.length > 0) {
			// Update dashboard item settings with fetched data
			const updatedItem = {
				...dashboardItem, 
				settings: {
					...dashboardItem.settings, 
					fetchedData: tableData,
				},
			};

			// Save the updated item to preserve fetched data
			await updateDashBoardItem(updatedItem);
		}

		return tableData;
	} catch (error) {
		console.error('Error loading table data:', error);
		if (!retry) {
			setTimeout(() => {
				loadTableData(dashboardItem, true);
			}, 2000);
		}
		return null;
	}
};

// Get approved version by ID
export const getApprovedVersionById = async (id) => {
	try {
		const approvedVersions = await loadApprovedVersions();
		return approvedVersions.find(version => version.id == id);
	} catch (error) {
		console.error('Error getting approved version by ID:', error);
		return null;
	}
};

// Create new dashboard item
export const createNewDashboardItem = async (newCard, settings) => {
	try {
		if (!newCard.title.trim()) {
			throw new Error('Vui lòng điền đầy đủ thông tin');
		}

		if (!newCard.idData) {
			throw new Error('Vui lòng chọn dữ liệu cho loại Table');
		}

		if (!settings.displayColumns || settings.displayColumns.length === 0) {
			throw new Error('Vui lòng chọn ít nhất một cột để hiển thị');
		}

		const newItem = {
			name: newCard.title,
			type: 'table', // Only support table type
			category: newCard.tag,
			storeCategory: newCard.storeTag,
			userClasses: [],
			settings: {
				...settings,
				fetchedData: null, // Will be loaded when needed
			},
			analysis: {
				prompt: newCard.prompt, 
				answer: newCard.answer,
			},
		};

		const createdItem = await createDashBoardItem(newItem);
		message.success('Thẻ mới đã được tạo');
		return createdItem;
	} catch (error) {
		console.error('Error creating dashboard item:', error);
		message.error(error.message || 'Lỗi khi tạo thẻ mới');
		throw error;
	}
};

// Update dashboard item
export const updateDashboardItem = async (item) => {
	try {
		if (!item.name.trim()) {
			throw new Error('Tên không được để trống');
		}

		const updatedItem = {
			...item,
			tag: item.tag || item.category || 'Revenue',
			category: item.category || item.tag || 'Revenue',
			storeCategory: item.storeTag || item.storeCategory || 'Sales',
			analysis: item.analysis || {},
		};

		await updateDashBoardItem(updatedItem);
		message.success('Đã cập nhật thành công');
		return updatedItem;
	} catch (error) {
		console.error('Error updating dashboard item:', error);
		message.error(error.message || 'Lỗi khi cập nhật');
		throw error;
	}
};

// Delete dashboard item
export const deleteDashboardItem = async (itemId) => {
	try {
		await deleteDashBoardItem(itemId);
		message.success('Đã xóa thẻ thành công');
		return true;
	} catch (error) {
		console.error('Error deleting dashboard item:', error);
		message.error('Lỗi khi xóa thẻ');
		return false;
	}
};

// Analyze with AI
export const analyzeWithAI = async (item, defaultPrompt) => {
	try {
		// Check if item has data to analyze
		if (!item.settings?.fetchedData || item.settings.fetchedData.length === 0) {
			throw new Error('Không có dữ liệu để phân tích. Vui lòng kiểm tra cấu hình và tải dữ liệu trước.');
		}

		const basePrompt = item.analysis?.prompt || defaultPrompt || DEFAULT_PROMPT_DASHBOARD;
		
		// Create data description for AI
		const displayColumns = item.settings?.displayColumns || [];
		const dateColumn = item.settings?.dateColumn;
		const templateColumns = item.settings?.templateColumns || [];

		// Filter data to only include configured display columns
		let filteredData = item.settings.fetchedData;
		if (displayColumns.length > 0) {
			filteredData = item.settings.fetchedData.map(row => {
				const filteredRow = {};

				// Add date column if specified
				if (dateColumn && row[dateColumn] !== undefined) {
					filteredRow[dateColumn] = row[dateColumn];
				}

				// Add configured display columns
				displayColumns.forEach(columnId => {
					if (row[columnId] !== undefined) {
						filteredRow[columnId] = row[columnId];
					}
				});

				return filteredRow;
			});
		}

		// Create column names list
		const columnNames = [];
		if (dateColumn) {
			columnNames.push('Thời gian');
		}
		displayColumns.forEach(columnId => {
			const templateColumn = templateColumns.find(col => col.id === columnId);
			const columnName = templateColumn?.columnName || `Cột ${columnId}`;
			columnNames.push(columnName);
		});

		const dataDescription = `
Dữ liệu bảng (chỉ các cột được cấu hình hiển thị):
- Các cột được phân tích: ${columnNames.join(', ')}
- Dữ liệu: ${filteredData && filteredData.length > 0 ? JSON.stringify(filteredData.slice(0, 100), null, 2) : 'Không có dữ liệu'}
`;

		const systemMessage = `Bạn là một chuyên gia phân tích dữ liệu. Hãy phân tích dữ liệu bảng được cung cấp và đưa ra nhận xét chi tiết bằng tiếng Việt. 
		Hãy tập trung vào:
		- Cấu trúc và đặc điểm của dữ liệu trong các cột được hiển thị
		- Mẫu và xu hướng trong dữ liệu
		- Insights quan trọng từ dữ liệu
		- Khuyến nghị dựa trên phân tích
		- Hãy đưa ra phân tích ngay, không cần chào hỏi.`;

		const fullPrompt = `${basePrompt}\n\n${dataDescription}`;

		// Call AI for analysis with timeout
		const response = await Promise.race([
			aiGen(fullPrompt, systemMessage, 'gpt-5-mini-2025-08-07', 'text'),
			new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Timeout: Phân tích mất quá nhiều thời gian')), 6000000)
			)
		]);

		if (response && (response.result || response.data || response.content)) {
			const aiResult = response.result || response.data || response.content || 'Không thể phân tích dữ liệu.';
			return aiResult;
		} else {
			throw new Error('Không thể phân tích dữ liệu. Vui lòng thử lại.');
		}
	} catch (error) {
		console.error('Lỗi khi phân tích với AI:', error);
		throw error;
	}
};

// Get date range from option
export const getDateRangeFromOption = (option) => {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	switch (option) {
		case 'today':
			return [today, today];
		case 'yesterday':
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			return [yesterday, yesterday];
		case 'thisWeek':
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - today.getDay());
			return [startOfWeek, today];
		case 'lastWeek':
			const lastWeekStart = new Date(today);
			lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
			const lastWeekEnd = new Date(lastWeekStart);
			lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
			return [lastWeekStart, lastWeekEnd];
		case 'thisMonth':
			const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
			return [startOfMonth, today];
		case 'lastMonth':
			const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
			return [lastMonthStart, lastMonthEnd];
		case 'last7Days':
			const last7Days = new Date(today);
			last7Days.setDate(today.getDate() - 7);
			return [last7Days, today];
		case 'last15Days':
			const last15Days = new Date(today);
			last15Days.setDate(today.getDate() - 15);
			return [last15Days, today];
		case 'last30Days':
			const last30Days = new Date(today);
			last30Days.setDate(today.getDate() - 30);
			return [last30Days, today];
		case 'last90Days':
			const last90Days = new Date(today);
			last90Days.setDate(today.getDate() - 90);
			return [last90Days, today];
		case 'thisYear':
			const startOfYear = new Date(today.getFullYear(), 0, 1);
			return [startOfYear, today];
		case 'lastYear':
			const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
			const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
			return [lastYearStart, lastYearEnd];
		default:
			return [null, null]; // 'all' - no filter
	}
};

// Format value by settings
export const formatValueBySettings = (value, columnSettings) => {
	if (value === null || value === undefined || value === '') {
		return '-';
	}

	// If no column settings, return value as is
	if (!columnSettings) {
		return value;
	}

	// Handle text formatting
	if (columnSettings.type === 'text') {
		return String(value);
	}

	// Handle date formatting
	if (columnSettings.type === 'date') {
		if (!value) return '-';
		try {
			const dateObj = new Date(value);
			if (isNaN(dateObj.getTime())) {
				return value;
			}
			const day = String(dateObj.getDate()).padStart(2, '0');
			const month = String(dateObj.getMonth() + 1).padStart(2, '0');
			const year = dateObj.getFullYear();
			const shortYear = String(year).slice(-2);

			switch (columnSettings.dateFormat) {
				case 'DD/MM/YY':
					return `${day}/${month}/${shortYear}`;
				case 'DD/MM/YYYY':
					return `${day}/${month}/${year}`;
				case 'MM/DD/YY':
					return `${month}/${day}/${shortYear}`;
				case 'MM/DD/YYYY':
					return `${month}/${day}/${year}`;
				default:
					return value;
			}
		} catch (e) {
			console.error('Error formatting date:', e);
			return value;
		}
	}

	// Handle value formatting
	if (columnSettings.type === 'value') {
		const format = columnSettings.valueFormat;
		let formattedValue = value;

		// Convert to number for formatting
		const numValue = Number(value);
		if (isNaN(numValue)) {
			return value;
		}

		// Apply decimal places
		if (format.decimalPlaces !== undefined) {
			formattedValue = numValue.toFixed(format.decimalPlaces);
		}

		// Apply thousands/millions formatting
		if (format.showThousands && !format.showMillions) {
			formattedValue = (numValue / 1000).toFixed(format.decimalPlaces || 0) + 'K';
		} else if (format.showMillions) {
			formattedValue = (numValue / 1000000).toFixed(format.decimalPlaces || 0) + 'M';
		} else {
			// Regular number formatting with commas
			formattedValue = numValue.toLocaleString('vn-VN', {
				minimumFractionDigits: format.decimalPlaces || 0,
				maximumFractionDigits: format.decimalPlaces || 0,
				useGrouping: true,
			});
		}

		// Apply percentage
		if (format.showPercentage) {
			formattedValue += '%';
		}

		return formattedValue;
	}

	return value;
};
