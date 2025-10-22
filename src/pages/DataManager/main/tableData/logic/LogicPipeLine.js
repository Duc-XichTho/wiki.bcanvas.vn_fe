// Sử dụng fallback stats thay vì simple-statistics để tránh lỗi require
import { message, Select } from 'antd';
import _ from 'lodash';
import axios from 'axios';
import { n8nWebhookGoogleDrive } from '../../../../../apis/n8nWebhook.jsx';
import RemoveDuplicateConfig from '../../../stepConfig/RemoveDuplicateConfig.jsx';
import FillMissingConfig from '../../../stepConfig/FillMissingConfig.jsx';
import OutlierConfig from '../../../stepConfig/OutlierConfig.jsx';
import LookupConfig from '../../../stepConfig/LookupConfig.jsx';
import AdvancedLookupConfig from '../../../stepConfig/AdvancedLookupConfig.jsx';
import CalculatedConfig from '../../../stepConfig/CalculatedConfig.jsx';
import AddColumnConfig from '../../../stepConfig/AddColumnConfig.jsx';
import SumIfConfig from '../../../stepConfig/SumIfConfig.jsx';
import CrossMappingConfig from '../../../stepConfig/CrossMappingConfig.jsx';
import SmartFillConfig from '../../../stepConfig/SmartFillConfig.jsx';
import FilterConfig from '../../../stepConfig/FilterConfig.jsx';
import AggregateConfig from '../../../stepConfig/AggregateConfig.jsx';
import CodeColumnConfig from '../../../stepConfig/CodeColumnConfig.jsx';
import UploadConfig from '../../stepConfig/UploadConfig.jsx';
import ColumnSplitConfig from '../../../stepConfig/ColumnSplitConfig.jsx';
import DateConverterConfig from '../../../stepConfig/DateConverterConfig.jsx';
import SmartRuleFillConfig from '../../../stepConfig/SmartRuleFillConfig.jsx';
import ColumnFilterConfig from '../../../stepConfig/ColumnFilterConfig.jsx';
import PivotTableConfig from '../../../stepConfig/PivotTableConfig.jsx';
import JoinTableConfig from '../stepConfig/JoinTableConfig.jsx';
import UnionTablesConfig from '../stepConfig/UnionTablesConfig.jsx';
import ValueToTimeConfig from '../../../stepConfig/ValueToTimeConfig.jsx';
import DateOperationConfig from '../../../stepConfig/DateOperationConfig.jsx';
import AITransformerConfig from '../../stepConfig/AITransformerConfig.jsx';
import AIFormulaConfig from '../../../stepConfig/AIFormulaConfig.jsx';
import ReversePivotTableConfig from '../../../stepConfig/ReversePivotTableConfig.jsx';
import ConvertToValueConfig from '../../../stepConfig/ConvertToValueConfig.jsx';
import LetterCaseConfig from '../../../stepConfig/LetterCaseConfig.jsx';
import ConcatenateConfig from '../../../stepConfig/ConcatenateConfig.jsx';
import TrimConfig from '../../../stepConfig/TrimConfig.jsx';
import BasicProcessingConfig from '../../../stepConfig/BasicProcessingConfig.jsx';
import WriteFieldConfig from '../../../stepConfig/WriteFieldConfig.jsx';
import WeekNumberConfig from '../stepConfig/WeekNumberConfig.jsx';
import PercentileGroupFilterConfig from '../../../stepConfig/PercentileGroupFilterConfig.jsx';
import { getTemplateRow } from '../../../../../apis/templateSettingService.jsx';
import { createSetting, getSettingByType, updateSetting, getTypeSchema } from '../../../../../apis/settingService.jsx';
import { aiGen2 } from '../../../../../apis/botService.jsx';
import { buildAIFormulaPrompt, extractFormulaFromAIResult } from '../processors/processAIFormula.js';
import { buildBulkAITransformerPrompt, extractBulkAIResult, buildTemplateBasedCategorizePrompt } from '../processors/aiTransformerProcessor.js';

export const fallbackStats = {
	mean: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
	standardDeviation: (arr) => {
		const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
		return Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length);
	},
	sampleStandardDeviation: (arr) => {
		const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
		return Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (arr.length - 1));
	},
	median: (arr) => {
		const sorted = [...arr].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
	},
	medianAbsoluteDeviation: (arr) => {
		const median = fallbackStats.median(arr);
		const deviations = arr.map(x => Math.abs(x - median));
		return fallbackStats.median(deviations);
	},
	interquartileRange: (arr) => {
		const sorted = [...arr].sort((a, b) => a - b);
		const q1 = fallbackStats.quantile(sorted, 0.25);
		const q3 = fallbackStats.quantile(sorted, 0.75);
		return q3 - q1;
	},
	quantile: (arr, p) => {
		const sorted = [...arr].sort((a, b) => a - b);
		const index = p * (sorted.length - 1);
		const lower = Math.floor(index);
		const upper = Math.ceil(index);
		const weight = index % 1;
		return sorted[lower] * (1 - weight) + sorted[upper] * weight;
	},
	zScore: (value, mean, standardDeviation) => (value - mean) / standardDeviation,
};

export const stats = fallbackStats;

export const { Option } = Select;

export const stepTypeName = {
	1: 'Bỏ trùng lặp',
	2: 'Điền giá trị thiếu',
	3: 'Phát hiện ngoại lệ',
	4: 'Lookup', // 11
	22: 'Lookup nâng cao', // Lookup nhiều điều kiện
	5: 'Thêm cột tính toán',
	// 6: 'Add Column',
	8: 'Điền có điều kiện', //6
	7: 'Validation & Mapping', //7
	9: 'Lọc dữ liệu', //8
	10: ' Aggregate (Group by)',
	// 11: 'Code-based New column',
	12: 'Tạo mới',
	13: 'Text-to-column',
	14: 'Date Formula',
	// 15: 'AI Audit',
	16: 'Lọc bỏ cột',
	17: 'Xoay bảng từ cột thành hàng',
	18: 'Nối bảng',
	19: 'Value to time',
	20: 'Thao tác ngày tháng',
	21: 'Rubik AI (Beta)',
	23: 'Xoay bảng từ hàng thành cột',
	// 24: 'AI Formula',
	25: 'Chuyển đổi kiểu dữ liệu',
	26: 'Chuyển đổi chữ hoa/chữ thường',
	27: 'Nối giá trị các cột',
	28: 'Bỏ ký tự thừa (Trim)',
	29: 'Tạo field mới',
	31: 'Ghép bảng (append)',
	32: 'Tính tuần số trong năm',
	33: 'Lọc nhóm theo phân vị',
	34: 'Xử lý cơ bản',
  35: 'SumIf',
};

// Thông tin chi tiết về từng step type
export const stepTypeInfo = {
	1: { 
		name: 'Bỏ trùng lặp', 
		shortDescription: 'Bỏ trùng lặp',
		tag: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Loại bỏ các dòng dữ liệu trùng lặp dựa trên các cột được chọn',
		link_tlsd:"/process-guide/2/30"
	},
	2: { 
		name: 'Điền giá trị thiếu', 
		shortDescription: 'Điền giá trị thiếu',
		tag: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Điền các giá trị còn thiếu trong dữ liệu bằng các phương pháp khác nhau',
		link_tlsd:"/process-guide/2/52"
	},
	3: { 
		name: 'Phát hiện ngoại lệ', 
		shortDescription: 'Phát hiện ngoại lệ',
		tag: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Tìm và xử lý các giá trị bất thường trong dữ liệu',
		link_tlsd:"/process-guide/2/53"
	},
	4: { 
		name: 'Lookup', 
		shortDescription: 'Lookup',
		tag: 'Làm giàu & Tích hợp Dữ liệu',
		description: 'Tìm kiếm và lấy dữ liệu từ bảng khác dựa trên điều kiện khớp',
		link_tlsd:"/process-guide/2/59"
	},
	5: { 
		name: 'Thêm cột tính toán', 
		shortDescription: 'Thêm cột tính toán',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Tạo cột mới bằng cách tính toán từ các cột hiện có',
		link_tlsd:"/process-guide/2/65"
	},
	7: { 
		name: 'Validation & Mapping', 
		shortDescription: 'Validation & Mapping',
		tag: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Kiểm tra và ánh xạ dữ liệu theo các quy tắc định sẵn',
		link_tlsd:"/process-guide/2/54"
	},
	8: { 
		name: 'Điền có điều kiện', 
		shortDescription: 'Điền có điều kiện',
		tag: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Điền giá trị dựa trên các điều kiện cụ thể',
		link_tlsd:"/process-guide/2/55"
	},
	9: { 
		name: 'Lọc dữ liệu', 
		shortDescription: 'Lọc dữ liệu',
		tag: 'Lọc & Tổng hợp Dữ liệu',
		description: 'Lọc dữ liệu theo các điều kiện cụ thể',
		link_tlsd:"/process-guide/2/73"
	},
	10: { 
		name: 'Aggregate (Group by)', 
		shortDescription: 'Aggregate (Group by)',
		tag: 'Lọc & Tổng hợp Dữ liệu',
		description: 'Nhóm và tổng hợp dữ liệu theo các cột được chọn',
		link_tlsd:"/process-guide/2/74"
	},
	12: { 
		name: 'Tạo mới', 
		shortDescription: 'Tạo mới',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Tạo dữ liệu mới từ các nguồn khác nhau'
	},
	13: { 
		name: 'Text-to-column', 
		shortDescription: 'Text-to-column',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Tách văn bản thành nhiều cột dựa trên ký tự phân cách',
		link_tlsd:"/process-guide/2/66"
	},
	14: { 
		name: 'Date Formula', 
		shortDescription: 'Date Formula',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Xử lý và chuyển đổi định dạng ngày tháng',
		link_tlsd:"/process-guide/2/67"
	},
	// 15: { 
	// 	name: 'AI Audit', 
	// 	shortDescription: 'AI Audit',
	// 	tag: 'Làm giàu & Tích hợp Dữ liệu',
	// 	description: 'Kiểm tra và đánh giá dữ liệu bằng AI',
	// 	link_tlsd:"/process-guide/2/60"
	// },
	16: { 
		name: 'Lọc bỏ cột', 
		shortDescription: 'Lọc bỏ cột',
		tag: 'Lọc & Tổng hợp Dữ liệu',
		description: 'Loại bỏ các cột không cần thiết khỏi dataset',
		link_tlsd:"/process-guide/2/75"
	},
	17: { 
		name: 'Xoay bảng từ cột thành hàng', 
		shortDescription: 'Xoay bảng từ cột thành hàng',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Chuyển đổi dữ liệu từ dạng cột sang dạng hàng',
		link_tlsd:"/process-guide/2/68"
	},
	18: { 
		name: 'Nối bảng', 
		shortDescription: 'Nối bảng',
		tag: 'Làm giàu & Tích hợp Dữ liệu',
		description: 'Kết hợp dữ liệu từ nhiều bảng khác nhau',
		link_tlsd:"/process-guide/2/61"
	},
	19: { 
		name: 'Value to time', 
		shortDescription: 'Value to time',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Chuyển đổi giá trị thành định dạng thời gian',
		link_tlsd:"/process-guide/2/69"
	},
	20: { 
		name: 'Thao tác ngày tháng', 
		shortDescription: 'Thao tác ngày tháng',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Thực hiện các phép toán với ngày tháng',
		link_tlsd:"/process-guide/2/70"
	},
	21: { 
		name: 'Rubik AI (Beta)', 
		shortDescription: 'Rubik AI (Beta)',
		tag: 'Làm giàu & Tích hợp Dữ liệu',
		description: 'Tạo văn bản mới bằng AI dựa trên dữ liệu hiện có',
		link_tlsd:"/process-guide/2/62"
	},
	22: { 
		name: 'Lookup nâng cao', 
		shortDescription: 'Lookup nâng cao',
		tag: 'Làm giàu & Tích hợp Dữ liệu',
		description: 'Lookup với nhiều điều kiện phức tạp',
		link_tlsd:"/process-guide/2/63"
	},
	23: { 
		name: 'Xoay bảng từ hàng thành cột', 
		shortDescription: 'Xoay bảng từ hàng thành cột',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Chuyển đổi dữ liệu từ dạng hàng sang dạng cột',
		link_tlsd:"/process-guide/2/71"
	},
	25: { 
		name: 'Chuyển đổi kiểu dữ liệu', 
		shortDescription: 'Chuyển đổi kiểu dữ liệu',
		tag: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Thay đổi kiểu dữ liệu của các cột',
		link_tlsd:"/process-guide/2/56"
	},
	26: { 
		name: 'Chuyển đổi chữ hoa/chữ thường', 
		shortDescription: 'Case convert',
		tag: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Chuyển đổi định dạng chữ hoa/chữ thường của văn bản',
	},
	27: { 
		name: 'Nối giá trị các cột', 
		shortDescription: 'Nối giá trị các cột',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Kết hợp giá trị từ nhiều cột thành một cột mới',
		link_tlsd:"/process-guide/2/72"
	},
	28: { 
		name: 'Bỏ ký tự thừa (Trim)', 
		shortDescription: 'Trim',
		tag: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Loại bỏ khoảng trắng và ký tự thừa ở đầu/cuối văn bản',
	},
	29: { 
		name: 'Tạo field mới', 
		shortDescription: 'Insert value',
		tag: 'Làm giàu & Tích hợp Dữ liệu',
		description: 'Tạo cột mới với giá trị cố định',
		link_tlsd:"/process-guide/2/64"
	},
	31: { 
		name: 'Ghép bảng (append)', 
		shortDescription: 'Append tables',
		tag: 'Làm giàu & Tích hợp Dữ liệu',
		description: 'Chọn nhiều bảng/phiên bản và nối các hàng lại (union)',
	},
	32: { 
		name: 'Tính tuần số trong năm', 
		shortDescription: 'Week number',
		tag: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Tính tuần số trong năm từ chuỗi ngày định dạng YYYY-MM-DD'
	},
	33: {
		name: 'Lọc nhóm theo phân vị',
		shortDescription: 'Percentile Data Filter',
		tag: 'Lọc & Tổng hợp Dữ liệu',
		description: 'Giữ lại các nhóm đóng góp tới ngưỡng phân vị dựa trên tập mẫu (Ví dụ: Sử dụng để lọc các sản phẩm chiếm 80% doanh số)'
	},
	34: {
		name: 'Xử lý cơ bản',
		shortDescription: 'Xử lý cơ bản',
		tag: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Gộp các tính năng xử lý cơ bản: TRIM, chuyển đổi kiểu dữ liệu, Value to Date, Case conversion, Rename cột'
	},
  35: {
    name: 'SumIf',
    shortDescription: 'Tổng có điều kiện(Sumifs)',
    tag: 'Lọc & Tổng hợp Dữ liệu',
    description: 'Cộng các giá trị trong một cột khi thỏa mãn nhiều cặp điều kiện Field = Value'
  },
};

// Danh sách các nhóm step types
export const stepCategories = [
	{
		id: 'clean',
		name: 'Làm sạch & Chuẩn hóa Dữ liệu',
		description: 'Các công cụ làm sạch và chuẩn hóa dữ liệu',
		steps: [1, 2, 3, 7, 8, 25, 26, 28, 30, 34]
	},
	{
		id: 'transform',
		name: 'Chuyển đổi & Tái cấu trúc Dữ liệu',
		description: 'Các công cụ chuyển đổi và tái cấu trúc dữ liệu',
		steps: [5, 12, 13, 14, 17, 19, 20, 23, 27]
	},
	{
		id: 'filter',
		name: 'Lọc & Tổng hợp Dữ liệu',
		description: 'Các công cụ lọc và tổng hợp dữ liệu',
    steps: [9, 10, 16, 35]
	},
	{
		id: 'enrich',
		name: 'Làm giàu & Tích hợp Dữ liệu',
		description: 'Các công cụ làm giàu và tích hợp dữ liệu',
		steps: [4, 15, 18, 21, 22, 29, 31]
	}
];

export function getStepSummary(step, availableTables = []) {
	// Tạo phần thông tin về cột đã lưu (sau khi xử lý)
	const columnInfo = '';

	let baseSummary = '';
	switch (step.type) {
		case 1:
			baseSummary = `Cột kiểm tra: ${(step.config?.columns || []).join(', ')} | Cách lọc: ${step.config?.keepFirst ? 'Giữ đầu' : 'Giữ cuối'}`;
			break;
		case 2:
			const newColInfo = step.config?.newColumn ? ` → ${step.config?.columnName}` : '';
			baseSummary = `Cột cần điền: ${step.config?.column}${newColInfo}, Cách điền: ${step.config?.fillType}`;
			break;
		case 3:
			const outlierAction = step.config?.action === 'remove' ? 'Remove' :
				step.config?.action === 'flag' ? 'Flag' : 'Cap';
			const outlierNewColInfo = step.config?.newColumn && step.config?.columnName ? ` → ${step.config?.columnName}` : '';
			const outlierMethodName = step.config?.method === 'iqr' ? 'IQR' :
				step.config?.method === 'zscore' ? 'Z-Score' :
					step.config?.method === 'mad' ? 'MAD' :
						step.config?.method === 'isolation' ? 'Isolation' :
							step.config?.method === 'percentile' ? 'Percentile' : step.config?.method;
			baseSummary = `Cột: ${step.config?.column}, Cách dền: ${outlierMethodName}, Hành động: ${outlierAction}${outlierNewColInfo}`;
			break;
		case 4: {
			// Lookup step: show concise, max 2 lines
			const tableStr = String(step.config?.lookupTable ?? '').slice(0, 20);
			const returnColStr = String(step.config?.returnColumn ?? '').slice(0, 20);
			const joinColStr = String(step.config?.joinColumn ?? '').slice(0, 20);
			const lookupColStr = String(step.config?.lookupColumn ?? '').slice(0, 20);
			const newColStr = String(step.config?.newColumnName ?? '').slice(0, 20);
			const version = step.config?.lookupTableVersion === null ? 'gốc' : step.config?.lookupTableVersion;

			// Helper to truncate and add ... if too long
			function trunc(str, max = 18) {
				if (!str) return '';
				return str.length > max ? str.slice(0, max) + '...' : str;
			}

			const line1 = `Lookup: ${trunc(tableStr)} v${version} → ${trunc(returnColStr)}`;
			const line2 = `Join: ${trunc(joinColStr)}=${trunc(lookupColStr)} → ${trunc(newColStr)}`;
			return `${line1}\n${line2}`;
		}
		case 22: {
			// Advanced Lookup step: show concise, max 2 lines
			const tableStr = String(step.config?.lookupTable ?? '').slice(0, 20);
			const returnColStr = String(step.config?.returnColumn ?? '').slice(0, 20);
			const newColStr = String(step.config?.newColumnName ?? '').slice(0, 20);
			const version = step.config?.lookupTableVersion === null ? 'gốc' : step.config?.lookupTableVersion;
			const conditionCount = step.config?.lookupConditions?.length || 0;

			// Helper to truncate and add ... if too long
			function trunc(str, max = 18) {
				if (!str) return '';
				return str.length > max ? str.slice(0, max) + '...' : str;
			}

			const line1 = `Advanced Lookup: ${trunc(tableStr)} v${version} → ${trunc(returnColStr)}`;
			const line2 = `${conditionCount} điều kiện → ${trunc(newColStr)}`;
			return `${line1}\n${line2}`;
		}
		case 5:
			baseSummary = `Cột mới: ${step.config?.newColumnName}, Công thức: ${step.config?.formula}`;
			break;
		case 6:
			baseSummary = `Cột thêm: ${step.config?.columnName}, loại: ${step.config?.dataType}`;
			break;
		case 7:
			// Validation & Mapping
			const config = step.config || {};
			const targetCol = config.targetColumn || 'N/A';
			const mappingMethod = config.mappingAction || 'similarity';
			const outputCol = config.createNewColumn && config.newColumnName ? config.newColumnName :
				config.overwriteOriginal ? `${targetCol} (overwrite)` : 'N/A';

			// Tạo summary dựa trên mapping method
			let methodSummary = '';
			switch (mappingMethod) {
				case 'similarity':
					const threshold = config.similarityThreshold || '85';
					methodSummary = `Similarity ${threshold}%`;
					break;
				case 'ai_assisted':
					methodSummary = 'AI Assisted';
					break;
				case 'manual':
					const ruleCount = config.manualRules?.filter(r => r.input && r.output).length || 0;
					methodSummary = `Manual (${ruleCount} rules)`;
					break;
				default:
					methodSummary = mappingMethod;
			}

			// Tạo reference summary
			let referenceSummary = '';
			if (config.referenceType === 'list') {
				const listItems = config.referenceList?.split(',').length || 0;
				referenceSummary = `List (${listItems} items)`;
			} else if (config.referenceType === 'table') {
				const version = config.referenceTableVersion === null ? 'gốc' : config.referenceTableVersion;
				referenceSummary = `Table v${version}`;
			} else {
				referenceSummary = 'Chưa cấu hình';
			}

			return `${targetCol} → ${outputCol} | ${methodSummary}${mappingMethod === 'manual' ? '' : ` | Ref: ${referenceSummary}`}`;
		case 8:
			const smartFillTargetCol = step.config?.createNewColumn && step.config?.newColumnName
				? step.config?.newColumnName
				: step.config?.targetColumn;
			if (step.config?.useAI) {
				baseSummary = `Sử dụng AI: ${smartFillTargetCol} - "${step.config?.aiPrompt?.substring(0, 50)}..."`;
			} else {
				const conditionCount = step.config?.conditions?.length || 0;
				baseSummary = `Cach điền: ${smartFillTargetCol} (${conditionCount} điều kiện)`;
			}
			break;
		case 9:
			baseSummary = `Lọc: ${step.config?.conditions?.length || 0} điều kiện`;
			break;
		case 10:
			const aggCount = step.config?.aggregations?.length || 0;
			const groupByCols = step.config?.groupBy || [];
			const groupByText = Array.isArray(groupByCols) ? groupByCols.join(' → ') : (typeof groupByCols === 'string' ? groupByCols : 'N/A');
			baseSummary = `Nhóm bởi: ${groupByText} | Aggregations: ${aggCount}`;
			break;
		case 11:
			baseSummary = `Cột thêm: ${step.config?.columnName}, Biểu thức: ${step.config?.expression}`;
			break;
		case 12:
			baseSummary = `Nguồn dữ liệu: ${step.config?.uploadType === 'system' && step.config?.systemConfig ?
				`${step.config.systemConfig.templateTableName || 'Bảng không xác định'} (Step ${step.config.systemConfig.stepId})` :
				step.config?.uploadType || 'Chưa cấu hình'
			}`;
			// Bổ sung summary cho chế độ Google Drive nhiều file
			if (step.config?.uploadType === 'googleDrive' && step.config?.googleDriveMultiFiles) {
				const count = Array.isArray(step.config?.googleDriveFilesInfo) ? step.config.googleDriveFilesInfo.length : 0;
				const orderPreview = Array.isArray(step.config?.googleDriveOrder)
					? step.config.googleDriveOrder.map(o => `${o.id?.slice(0, 6) || ''}:${o.order}`).slice(0, 3).join(', ')
					: '';
				baseSummary += ` | Nhiều file (${count})`;
			}
			break;
		case 13:
			const splitMethod = step.config?.splitMethod || 'separator';
			const targetCol13 = step.config?.targetColumn || 'N/A';
			if (splitMethod === 'separator') {
				const separator = step.config?.separator || ',';
				baseSummary = `Cắt: ${targetCol13} với "${separator}"`;
			} else {
				const position = step.config?.position || 'left';
				const length = step.config?.length || 1;
				baseSummary = `Cắt: ${targetCol13} ${position.toUpperCase()} ${length} ký tự`;
			}
			break;
		case 14:
			const yearCol = step.config?.yearColumn || 'N/A';
			const monthCol = step.config?.monthColumn || 'N/A';
			const dayCol = step.config?.dayColumn || 'N/A';
			const dateOutputCol = step.config?.outputColumn || 'date';
			baseSummary = `Ngày: ${yearCol}/${monthCol}/${dayCol} → ${dateOutputCol}`;
			break;
		case 15:
			const smartRuleInputCols = step.config?.inputColumns || [];
			const smartRuleOutputCol = step.config?.createNewColumn ? step.config?.newColumnName : step.config?.outputColumn;
			const exampleCount = step.config?.exampleIdentifier?.values?.length || 0;
			baseSummary = `Smart Rule: [${smartRuleInputCols.join(', ')}] → ${smartRuleOutputCol} (${exampleCount} mẫu)`;
			break;
		case 16:
			const filterMode = step.config?.filterMode === 'include' ? 'Giữ lại' : 'Loại bỏ';
			const selectedCount = step.config?.selectedColumns?.length || 0;
			const selectedCols = step.config?.selectedColumns || [];
			const colsPreview = selectedCols.length > 3
				? `${selectedCols.slice(0, 3).join(', ')}...`
				: selectedCols.join(', ');
			baseSummary = `${filterMode}: ${selectedCount} cột ${selectedCount > 0 ? ` (${colsPreview})` : ''}`;
			break;
		case 17:
			const identifierCols = step.config?.identifierColumns || [];
			const pivotCols = step.config?.pivotColumns || [];
			const itemColName = step.config?.itemColumnName || 'Khoản mục';
			const valueColName = step.config?.valueColumnName || 'Giá trị';
			baseSummary = `Xoay: ${pivotCols.length} cột → ${itemColName}/${valueColName} | ID: ${identifierCols.join(', ')}`;
			break;
		case 23:
			const identifierCols23Rev = step.config?.identifierColumns || [];
			const pivotCols23Rev = step.config?.pivotColumns || [];
			const valueColName23Rev = step.config?.valueColumnName || 'Giá trị';
			baseSummary = `Xoay ngược: ${pivotCols23Rev.join(', ')} → cột mới | Giá trị: ${valueColName23Rev} | ID: ${identifierCols23Rev.join(', ')}`;
			break;
		case 33: {
			const valCol = step.config?.valueColumn || '';
			const grpCol = step.config?.groupColumn || '';
			const pct = step.config?.percentile || 80;
			baseSummary = `Lọc dữ liệu dựa trên giá trị phân vị của 1 cột số liệu (ví dụ: xác định ${pct}-20)\nCột số liệu: ${valCol} | Cột nhóm: ${grpCol}`;
			break;
		}
		case 34: {
			const enabledFeatures = [];
			if (step.config?.enableTrim) enabledFeatures.push('TRIM');
			if (step.config?.enableDataTypeConversion) enabledFeatures.push('Data Type');
			if (step.config?.enableValueToDate) enabledFeatures.push('Value to Date');
			if (step.config?.enableCaseConversion) enabledFeatures.push('Case');
			if (step.config?.enableRename) enabledFeatures.push('Rename');
			
			baseSummary = `Xử lý cơ bản: ${enabledFeatures.length > 0 ? enabledFeatures.join(', ') : 'Chưa cấu hình'}`;
			break;
		}
		case 35: {
			const valCol = step.config?.valueColumn || '';
			const conds = Array.isArray(step.config?.conditions) ? step.config.conditions.filter(c => c && c.column !== undefined) : [];
			const preview = conds.slice(0, 3).map(c => `${c.column}=${c.value}`).join(', ');
			const more = conds.length > 3 ? ` +${conds.length - 3}` : '';
			baseSummary = `SumIf: sum(${valCol}) với ${conds.length} điều kiện${preview ? ` (${preview}${more})` : ''}`;
			break;
		}
		case 18:
			const targetTableId = step.config?.targetTable || '';
			// Sử dụng targetTableName từ config nếu có, nếu không thì tìm từ availableTables
			let targetTableName = step.config?.targetTableName;

			if (!targetTableName) {
				// Fallback: tìm từ availableTables
				const targetTableIdNum = parseInt(targetTableId);
				targetTableName = availableTables.find(t => t.id == targetTableIdNum || t.id === targetTableId)?.name || targetTableId;
			}

			const targetVersion = step.config?.targetVersion || '';
			const joinType = step.config?.joinType || 'inner';
			const joinColumns = step.config?.joinColumns || [];
			const validJoinPairs = joinColumns.filter(col => col.sourceColumn && col.targetColumn);
			const joinDescription = validJoinPairs.map(col => `${col.sourceColumn} = ${col.targetColumn}`).join(', ');
			baseSummary = `Nối: ${joinDescription} | ${targetTableName}(Version ${targetVersion}) | ${joinType} join`;
			break;
		case 19:
			const mappings = Array.isArray(step.config?.mappings) && step.config?.mappings.length > 0
				? step.config.mappings
				: (step.config?.column || step.config?.outputColumn) ? [{
					column: step.config?.column,
					outputColumn: step.config?.outputColumn,
					timeFormat: step.config?.timeFormat
				}] : [];
			
			// Lấy timeFormat từ mapping đầu tiên hoặc config root
			const timeFormat = mappings.length > 0 && mappings[0].timeFormat 
				? mappings[0].timeFormat 
				: step.config?.timeFormat || 'YYYY-MM-DD';
			
			const mappingPreview = mappings.slice(0, 2).map(m => `${m.column}→${m.outputColumn}`).join(', ');
			const moreCount = mappings.length > 2 ? ` +${mappings.length - 2}` : '';
			baseSummary = `Chuyển đổi (${mappings.length}): ${mappingPreview}${moreCount} | Format: ${timeFormat}`;
			break;
		case 20:
			const operationType = step.config?.operationType || 'add_subtract';
			const newColumnName = step.config?.newColumnName || 'ngay_moi';
			if (operationType === 'add_subtract') {
				const sourceColumn = step.config?.sourceDateColumn || 'N/A';
				const operations = step.config?.operations || [];
				const operationCount = operations.length;
				baseSummary = `Cộng/trừ ngày: ${sourceColumn} → ${newColumnName} (${operationCount} thao tác)`;
			} else if (operationType === 'lookup_nearest') {
				const targetColumn = step.config?.targetDateColumn || 'N/A';
				const referenceColumn = step.config?.referenceDateColumn || 'N/A';
				const lookupType = step.config?.lookupType || 'nearest_past';
				const lookupTypeText = lookupType === 'nearest_past' ? 'quá khứ' :
					lookupType === 'nearest_future' ? 'tương lai' : 'tuyệt đối';
				baseSummary = `Tìm ngày gần nhất (${lookupTypeText}): ${targetColumn} → ${newColumnName} | Tham chiếu: ${referenceColumn}`;
			}
			break;
		case 21:
			const conditionCols = step.config?.conditionColumns?.length > 0
				? step.config.conditionColumns.join(', ')
				: 'Chưa chọn';
			const resultCol = step.config?.resultColumn || 'Chưa nhập';
			const hasPrompt = step.config?.aiPrompt ? 'Có prompt' : 'Chưa có prompt';
			const jobType = step.config?.jobType ? ` | Job: ${step.config.jobType}` : '';
			
			// Thêm thông tin lọc dữ liệu
			let filterInfo = '';
			if (step.config?.enableFilter && step.config?.filterConditions?.length > 0) {
				const filterMode = step.config?.filterMode === 'include' ? 'Chỉ xử lý' : 'Bỏ qua';
				const conditionsText = step.config.filterConditions.map(condition => {
					if (!condition.column || !condition.operator) return '';
					const operatorText = {
						'==': '=',
						'!=': '≠',
						'>': '>',
						'<': '<',
						'>=': '≥',
						'<=': '≤',
						'contains': 'chứa',
						'not_contains': 'không chứa',
						'is_empty': 'trống',
						'is_not_empty': 'không trống'
					}[condition.operator] || condition.operator;
					
					if (['is_empty', 'is_not_empty'].includes(condition.operator)) {
						return `${condition.column} ${operatorText}`;
					} else {
						return `${condition.column} ${operatorText} ${condition.value}`;
					}
				}).filter(text => text).join(` ${step.config.filterConditions[1]?.logic || 'AND'} `);
				
				filterInfo = ` | Lọc: ${filterMode} (${conditionsText})`;
			}
			
			baseSummary = `Điều kiện: ${conditionCols} → Tạo cột mới: ${resultCol} | ${hasPrompt}${jobType}${filterInfo}`;
			break;
		case 24:
			const aiFormulaTargetCol = step.config?.createNewColumn && step.config?.newColumnName
				? step.config?.newColumnName
				: step.config?.targetColumn;
			const aiFormulaPrompt = step.config?.aiPrompt ? `"${step.config.aiPrompt.substring(0, 50)}..."` : 'Chưa có prompt';
			baseSummary = `AI Formula: ${aiFormulaTargetCol} | ${aiFormulaPrompt}`;
			break;

		case 25:
			const convertMappings = step.config?.columnMappings || [];
			if (convertMappings.length > 0) {
				const mappingText = convertMappings.map(m => `${m.column}→${m.dataType}`).join(', ');
				baseSummary = `Chuyển đổi: ${mappingText}`;
			} else {
				const convertColumns = step.config?.columns || [];
				const convertToType = step.config?.convertToType || 'text';
				baseSummary = `Chuyển đổi cột: ${convertColumns.join(', ')} → ${convertToType}`;
			}
			break;

		case 26:
			const letterCaseColumn = step.config?.column || '';
			const letterCaseType = step.config?.caseType || 'uppercase';
			const letterCaseNewCol = step.config?.newColumn ? ` → ${step.config?.newColumnName || 'Cột mới'}` : '';
			const caseTypeNames = {
				uppercase: 'UPPERCASE',
				lowercase: 'lowercase',
				sentence: 'Sentence case',
				title: 'Title Case',
				camel: 'camelCase',
				pascal: 'PascalCase'
			};
			baseSummary = `Cột: ${letterCaseColumn}, Kiểu: ${caseTypeNames[letterCaseType] || letterCaseType}${letterCaseNewCol}`;
			break;

		case 27:
			const concatColumns = step.config?.selectedColumns || [];
			const concatSeparator = step.config?.separator || '';
			const concatPrefix = step.config?.prefix || '';
			const concatSuffix = step.config?.suffix || '';
			const concatNewCol = step.config?.newColumnName || 'Cột mới';
			const concatFormula = `${concatPrefix}[${concatColumns.join(']' + (concatSeparator || '') + '[')}]${concatSuffix}`;
			baseSummary = `Nối: ${concatColumns.join(', ')} → ${concatNewCol} | Công thức: ${concatFormula}`;
			break;

		case 28:
			const trimColumn = step.config?.column || '';
			const trimType = step.config?.trimType || 'both';
			const trimNewCol = step.config?.newColumn ? ` → ${step.config?.newColumnName || 'Cột mới'}` : '';
			const trimCustomChars = step.config?.useCustomChars && step.config?.customChars ? ` (${step.config.customChars})` : '';
			const trimTypeNames = {
				both: 'Cả 2 đầu',
				left: 'Chỉ đầu trái',
				right: 'Chỉ đầu phải'
			};
			baseSummary = `Cột: ${trimColumn}, Loại: ${trimTypeNames[trimType] || trimType}${trimCustomChars}${trimNewCol}`;
			break;

		case 29:
			const fieldName = step.config?.fieldName || '';
			const fieldDataType = step.config?.dataType || 'string';
			const fieldValue = step.config?.value || '';
			const fieldApplyToAll = step.config?.applyToAllRows ? 'Tất cả dòng' : 'Dòng đầu tiên';
			const dataTypeNames = {
				string: 'String',
				number: 'Number'
			};
			baseSummary = `Field: ${fieldName} (${dataTypeNames[fieldDataType] || fieldDataType}) = "${fieldValue}" | ${fieldApplyToAll}`;
			break;

		default:
			baseSummary = '';
	}

	return baseSummary + columnInfo;
}

export const configComponentMap = {
	1: RemoveDuplicateConfig,
	2: FillMissingConfig,
	3: OutlierConfig,
	4: LookupConfig,
	22: AdvancedLookupConfig,
	5: CalculatedConfig,
	6: AddColumnConfig,
	7: CrossMappingConfig,
	8: SmartFillConfig,
	9: FilterConfig,
	10: AggregateConfig,
	11: CodeColumnConfig,
	12: UploadConfig,
	13: ColumnSplitConfig,
	14: DateConverterConfig,
	15: SmartRuleFillConfig,
	16: ColumnFilterConfig,
	17: PivotTableConfig,
	18: JoinTableConfig,
	19: ValueToTimeConfig,
	20: DateOperationConfig,
	21: AITransformerConfig,
	23: ReversePivotTableConfig, // Component riêng cho reverse pivot
	24: AIFormulaConfig,
	25: ConvertToValueConfig,
	26: LetterCaseConfig,
	27: ConcatenateConfig,
	28: TrimConfig,
	29: WriteFieldConfig,
	31: UnionTablesConfig,
	32: WeekNumberConfig,
	33: PercentileGroupFilterConfig,
  34: BasicProcessingConfig,
  35: SumIfConfig,
};

// SumIf processing (Type 35)
export const processSumIf = (data, config) => {
  if (!Array.isArray(data) || data.length === 0) return data;
  const valueColumn = config?.valueColumn;
  const newColumnName = config?.newColumnName || 'sum_if';
  const conditions = Array.isArray(config?.conditions) ? config.conditions : [];
  if (!valueColumn) return data;

  // Với mỗi dòng ngữ cảnh, tính tổng trên toàn bộ dữ liệu ứng viên thoả điều kiện
  return data.map(contextRow => {
    let sum = 0;
    for (const candidate of data) {
      let ok = true;
      for (const cond of conditions) {
        if (!cond || cond.column === undefined) continue;
        const left = candidate[cond.column];
        const right = cond.mode === 'column' ? contextRow[cond.valueColumn] : (cond.value ?? '');
        if (String(left) !== String(right)) { ok = false; break; }
      }
      if (ok) {
        const num = parseFloat(candidate[valueColumn]);
        if (!isNaN(num)) sum += num;
      }
    }
    return { ...contextRow, [newColumnName]: sum };
  });
};
// Hàm xử lý Remove Duplicate
export const processRemoveDuplicate = (data, config) => {
	if (!config.columns || config.columns.length === 0) {
		return data;
	}

	const seen = new Set();
	const filteredData = [];

	for (const row of data) {
		// Tạo key từ các cột được chọn
		const key = config.columns.map(col => row[col]).join('|');

		if (!seen.has(key)) {
			seen.add(key);
			filteredData.push(row);
		} else if (!config.keepFirst) {
			// Nếu giữ bản ghi cuối cùng, thay thế bản ghi cuối cùng trong filteredData
			const lastIndex = filteredData.length - 1;
			filteredData[lastIndex] = row;
		}
	}

	return filteredData;
};
// Hàm xử lý Fill Missing
export const processFillMissing = (data, config) => {
	if (!config.column) {
		return { data: data, errorCount: 0 };
	}

	let errorCount = 0;
	const processedData = data.map(row => {
		const newRow = { ...row };

		try {
			// Nếu tạo cột mới, sao chép toàn bộ dữ liệu từ cột gốc trước
			if (config.newColumn && config.columnName) {
				newRow[config.columnName] = newRow[config.column];
			}

			// Xác định cột cần kiểm tra và cập nhật
			const targetColumn = config.newColumn && config.columnName ? config.columnName : config.column;

			// Kiểm tra nếu giá trị trong cột là null, undefined, hoặc chuỗi rỗng
			const isMissing = newRow[targetColumn] === null ||
				newRow[targetColumn] === undefined ||
				newRow[targetColumn] === '';

			if (isMissing) {
				let fillValue = '';

				switch (config.fillType) {
					case 'value':
						fillValue = config.fillValue;
						break;
					case 'mean':
						// Tính mean của cột (chỉ áp dụng cho số)
						try {
							const numericValues = data
								.map(r => parseFloat(r[config.column]))
								.filter(v => !isNaN(v));
							if (numericValues.length === 0) {
								fillValue = 'ERROR';
								errorCount++;
							} else {
								fillValue = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
							}
						} catch (error) {
							console.error('Lỗi khi tính mean:', error);
							fillValue = 'ERROR';
							errorCount++;
						}
						break;
					case 'median':
						// Tính median của cột (chỉ áp dụng cho số)
						try {
							const sortedValues = data
								.map(r => parseFloat(r[config.column]))
								.filter(v => !isNaN(v))
								.sort((a, b) => a - b);
							if (sortedValues.length === 0) {
								fillValue = 'ERROR';
								errorCount++;
							} else {
								const mid = Math.floor(sortedValues.length / 2);
								fillValue = sortedValues.length % 2 === 0
									? ((sortedValues[mid - 1] + sortedValues[mid]) / 2)
									: sortedValues[mid];
							}
						} catch (error) {
							console.error('Lỗi khi tính median:', error);
							fillValue = 'ERROR';
							errorCount++;
						}
						break;
					case 'mode':
						// Tính mode của cột
						try {
							const valueCount = {};
							data.forEach(r => {
								const val = r[config.column];
								if (val !== null && val !== undefined && val !== '') {
									valueCount[val] = (valueCount[val] || 0) + 1;
								}
							});
							if (Object.keys(valueCount).length === 0) {
								fillValue = 'ERROR';
								errorCount++;
							} else {
								const maxCount = Math.max(...Object.values(valueCount));
								const modeValues = Object.keys(valueCount).filter(k => valueCount[k] === maxCount);
								fillValue = modeValues[0] || '';
							}
						} catch (error) {
							console.error('Lỗi khi tính mode:', error);
							fillValue = 'ERROR';
							errorCount++;
						}
						break;
					default:
						fillValue = '';
				}

				// Xác định kiểu dữ liệu của cột gốc để đảm bảo consistency
				let isColumnNumeric = false;
				try {
					const sampleValues = data
						.map(r => r[config.column])
						.filter(val => val !== null && val !== undefined && val !== '')
						.slice(0, 10); // Lấy 10 giá trị đầu để kiểm tra

					isColumnNumeric = sampleValues.length > 0 && sampleValues.every(val => {
						return typeof val === 'number' || !isNaN(parseFloat(val));
					});
				} catch (error) {
					console.error('Lỗi khi xác định kiểu dữ liệu cột:', error);
					isColumnNumeric = false;
				}

				// Chuyển đổi fillValue về đúng kiểu dữ liệu
				if (fillValue !== 'ERROR') {
					if (isColumnNumeric) {
						if (['mean', 'median'].includes(config.fillType)) {
							// Mean/median đã là số, giữ nguyên
							fillValue = fillValue;
						} else if (config.fillType === 'value') {
							// Thử chuyển đổi value về số nếu có thể
							const numericValue = parseFloat(fillValue);
							if (!isNaN(numericValue)) {
								fillValue = numericValue;
							}
						} else if (config.fillType === 'mode') {
							// Thử chuyển đổi mode về số nếu có thể
							const numericValue = parseFloat(fillValue);
							if (!isNaN(numericValue)) {
								fillValue = numericValue;
							}
						}
					}
				}

				// Điền giá trị vào cột đích (cột mới hoặc cột gốc)
				newRow[targetColumn] = fillValue;
			}

		} catch (error) {
			console.error('Lỗi khi điền giá trị thiếu:', error);
			const targetColumn = config.newColumn && config.columnName ? config.columnName : config.column;
			newRow[targetColumn] = 'ERROR';
			errorCount++;
		}

		return newRow;
	});

	return { data: processedData, errorCount };
};
// Hàm xử lý Outlier Detection sử dụng simple-statistics để tăng độ tin cậy
export const processOutlierDetection = (data, config) => {
	if (!config.column) {
		return data;
	}

	// Tạo map giữa data gốc và giá trị số
	const numericMap = new Map();
	const validValues = [];
	const allNumericValues = [];

	data.forEach((row, index) => {
		try {
			const numericValue = parseFloat(row[config.column]);
			if (!isNaN(numericValue)) {
				allNumericValues.push(numericValue);
				// Lưu tất cả giá trị số vào map để kiểm tra outlier
				numericMap.set(index, numericValue);

				// Nếu ignoreZero = true, bỏ qua giá trị 0 khỏi tính toán thống kê
				if (config.ignoreZero && numericValue === 0) {
					return;
				}
				validValues.push(numericValue);
			}
		} catch (error) {
			console.error('Lỗi khi parse giá trị outlier:', error);
			// Đánh dấu index có lỗi
			numericMap.set(index, 'ERROR');
		}
	});

	if (validValues.length === 0) {
		return data;
	}

	// Tính toán các thống kê sử dụng simple-statistics (chính xác hơn)
	const mean = stats.mean(validValues);
	const std = stats.standardDeviation(validValues);
	const sampleStd = stats.sampleStandardDeviation(validValues);
	const median = stats.median(validValues);
	const mad = stats.medianAbsoluteDeviation(validValues);
	const iqr = stats.interquartileRange(validValues);

	// Tính quartiles chính xác
	const q1 = stats.quantile(validValues, 0.25);
	const q3 = stats.quantile(validValues, 0.75);

	// Debug: Log thông tin thống kê


	// Xác định outliers sử dụng phương pháp thống kê chính xác
	const outlierIndices = new Set();
	const debugOutliers = [];

	data.forEach((row, index) => {
		if (!numericMap.has(index)) return; // Bỏ qua giá trị không phải số

		const value = numericMap.get(index);

		// Nếu giá trị là ERROR, đánh dấu là outlier
		if (value === 'ERROR') {
			outlierIndices.add(index);
			return;
		}

		let isOutlier = false;
		let debugInfo = { index, value, isOutlier: false };

		// Lấy threshold từ config hoặc dùng mặc định
		const threshold = config.threshold || (config.method === 'zscore' ? 3 : config.method === 'mad' ? 3.5 : 1.5);

		// Trường hợp đặc biệt: nếu ignoreZero = true và giá trị = 0, coi là outlier
		if (config.ignoreZero && value === 0) {
			isOutlier = true;
			debugInfo.isOutlier = true;
			debugInfo.reason = 'Zero value treated as outlier (ignoreZero=true)';
		} else {
			switch (config.method) {
				case 'iqr':
					// Sử dụng IQR chính xác từ simple-statistics
					const lowerBound = q1 - threshold * iqr;
					const upperBound = q3 + threshold * iqr;
					isOutlier = value < lowerBound || value > upperBound;
					debugInfo.bounds = { lowerBound, upperBound };
					debugInfo.threshold = threshold;
					debugInfo.isOutlier = isOutlier;
					break;
				case 'zscore':
					// Sử dụng Z-score chính xác từ simple-statistics
					const zScore = stats.zScore(value, mean, std);
					isOutlier = Math.abs(zScore) > threshold;
					debugInfo.zScore = zScore;
					debugInfo.threshold = threshold;
					debugInfo.isOutlier = isOutlier;
					break;
				case 'mad':
					// Modified Z-Score sử dụng MAD (Median Absolute Deviation)
					// Phương pháp Iglewicz-Hoaglin
					const modifiedZScore = 0.6745 * (value - median) / mad;
					isOutlier = Math.abs(modifiedZScore) > threshold;
					debugInfo.modifiedZScore = modifiedZScore;
					debugInfo.threshold = threshold;
					debugInfo.isOutlier = isOutlier;
					break;
				case 'isolation':
					// Isolation Forest simplified: dùng modified Z-score với sample standard deviation
					const isolationScore = Math.abs(0.6745 * (value - mean) / sampleStd);
					isOutlier = isolationScore > threshold;
					debugInfo.isolationScore = isolationScore;
					debugInfo.threshold = threshold;
					debugInfo.isOutlier = isOutlier;
					break;
				case 'percentile':
					// Phương pháp percentile (99% rule)
					const p1 = stats.quantile(validValues, 0.01);
					const p99 = stats.quantile(validValues, 0.99);
					isOutlier = value < p1 || value > p99;
					debugInfo.bounds = { p1, p99 };
					debugInfo.isOutlier = isOutlier;
					break;
			}
		}

		debugOutliers.push(debugInfo);
		if (isOutlier) {
			outlierIndices.add(index);
		}
	});

	// Xử lý outliers theo action
	let processedData = [];

	switch (config.action) {
		case 'remove':
			// Loại bỏ outliers
			processedData = data.filter((_, index) => !outlierIndices.has(index));
			break;
		case 'flag':
			// Thêm cột cờ
			processedData = data.map((row, index) => {
				const newRow = { ...row };
				if (config.newColumn && config.columnName) {
					const mapValue = numericMap.get(index);
					if (mapValue === 'ERROR') {
						newRow[config.columnName] = 'ERROR';
					} else {
						newRow[config.columnName] = outlierIndices.has(index) ? 1 : 0;
					}
				}
				return newRow;
			});
			break;
		case 'cap':
			// Giới hạn giá trị outliers theo phương pháp được chọn
			let lowerBound, upperBound;
			const capThreshold = config.threshold || (config.method === 'zscore' ? 3 : config.method === 'mad' ? 3.5 : 1.5);

			if (config.method === 'iqr') {
				lowerBound = q1 - capThreshold * iqr;
				upperBound = q3 + capThreshold * iqr;
			} else if (config.method === 'zscore') {
				lowerBound = mean - capThreshold * std;
				upperBound = mean + capThreshold * std;
			} else if (config.method === 'mad') {
				// Sử dụng MAD để tính bounds
				const madMultiplier = capThreshold / 0.6745;
				lowerBound = median - madMultiplier * mad;
				upperBound = median + madMultiplier * mad;
			} else if (config.method === 'percentile') {
				// Sử dụng percentile
				const percentileThreshold = (100 - capThreshold) / 100;
				lowerBound = stats.quantile(validValues, (1 - percentileThreshold) / 2);
				upperBound = stats.quantile(validValues, (1 + percentileThreshold) / 2);
			} else {
				// Isolation: dùng percentile dựa trên threshold
				const percentile = Math.max(0.01, Math.min(0.1, (4 - capThreshold) / 100));
				lowerBound = stats.quantile(validValues, percentile);
				upperBound = stats.quantile(validValues, 1 - percentile);
			}

			processedData = data.map((row, index) => {
				const newRow = { ...row };
				if (numericMap.has(index)) {
					const value = numericMap.get(index);
					if (value === 'ERROR') {
						newRow[config.column] = 'ERROR';
					} else if (outlierIndices.has(index)) {
						if (value < lowerBound) {
							newRow[config.column] = lowerBound;
						} else if (value > upperBound) {
							newRow[config.column] = upperBound;
						}
					}
				}
				return newRow;
			});
			break;
		default:
			processedData = data;
	}

	return processedData;
};
// Hàm xử lý Lookup (tra cứu bảng tham chiếu)
export const processLookup = async (data, config) => {
	// Kiểm tra config hợp lệ
	if (!config.lookupTable || !config.joinColumn || !config.lookupColumn || !config.returnColumn || !config.newColumnName) {
		return data;
	}

	// Kiểm tra version đã được chọn
	if (config.lookupTableVersion === undefined) {
		console.warn('Lookup version chưa được chọn, sử dụng version gốc');
	}

	try {
		// Lấy dữ liệu bảng lookup từ version đã chọn
		const lookupVersion = config.lookupTableVersion !== undefined ? config.lookupTableVersion : null;
		const lookupRowsResponse = await getTemplateRow(config.lookupTable, lookupVersion, false);
		const lookupRows = lookupRowsResponse.rows || [];

		// Tạo map từ giá trị lookupColumn -> returnColumn
		const lookupMap = new Map();
		lookupRows.forEach(row => {
			const key = row.data[config.lookupColumn];
			const value = row.data[config.returnColumn];
			if (key !== undefined && key !== null) {
				lookupMap.set(key, value);
			}
		});

		// Join dữ liệu input với lookupMap
		return data.map(row => {
			const newRow = { ...row };
			const joinValue = row[config.joinColumn];
			if (joinValue !== undefined && joinValue !== null && lookupMap.has(joinValue)) {
				newRow[config.newColumnName] = lookupMap.get(joinValue);
			} else {
				newRow[config.newColumnName] = 'ERROR';
			}
			return newRow;
		});
	} catch (error) {
		console.error('Lỗi khi xử lý lookup:', error);
		return data;
	}
};
// Hàm xử lý Advanced Lookup (nhiều điều kiện)
export const processAdvancedLookup = async (data, config) => {
	// Kiểm tra config hợp lệ
	if (!config.lookupTable || !config.lookupConditions || !config.returnColumn || !config.newColumnName) {
		return data;
	}

	// Kiểm tra version đã được chọn
	if (config.lookupTableVersion === undefined) {
		console.warn('Advanced Lookup version chưa được chọn, sử dụng version gốc');
	}

	try {
		// Lấy dữ liệu bảng lookup từ version đã chọn
		const lookupVersion = config.lookupTableVersion !== undefined ? config.lookupTableVersion : null;
		const lookupRowsResponse = await getTemplateRow(config.lookupTable, lookupVersion, false);
		const lookupRows = lookupRowsResponse.rows || [];

		// Hàm kiểm tra điều kiện match
		const checkConditionMatch = (currentValue, lookupValue, operator) => {
			if (currentValue === undefined || currentValue === null || lookupValue === undefined || lookupValue === null) {
				return false;
			}

			switch (operator) {
				case '=':
					return currentValue == lookupValue; // Sử dụng == để so sánh linh hoạt
				case '!=':
					return currentValue != lookupValue;
				case '>':
					return parseFloat(currentValue) > parseFloat(lookupValue);
				case '<':
					return parseFloat(currentValue) < parseFloat(lookupValue);
				case '>=':
					return parseFloat(currentValue) >= parseFloat(lookupValue);
				case '<=':
					return parseFloat(currentValue) <= parseFloat(lookupValue);
				case 'contains':
					return String(currentValue).toLowerCase().includes(String(lookupValue).toLowerCase());
				case 'starts_with':
					return String(currentValue).toLowerCase().startsWith(String(lookupValue).toLowerCase());
				case 'ends_with':
					return String(currentValue).toLowerCase().endsWith(String(lookupValue).toLowerCase());
				default:
					return currentValue == lookupValue;
			}
		};

		// Join dữ liệu input với lookupRows
		return data.map(row => {
			const newRow = { ...row };

			// Tìm row trong lookupRows thỏa mãn tất cả điều kiện
			let matchedRow = null;

			for (const lookupRow of lookupRows) {
				let allConditionsMatch = true;

				for (const condition of config.lookupConditions) {
					const currentValue = row[condition.currentColumn];
					const lookupValue = lookupRow.data[condition.lookupColumn];

					if (!checkConditionMatch(currentValue, lookupValue, condition.operator)) {
						allConditionsMatch = false;
						break;
					}
				}

				if (allConditionsMatch) {
					matchedRow = lookupRow;
					break;
				}
			}

			// Nếu tìm thấy kết quả, lấy giá trị từ cột returnColumn
			if (matchedRow) {
				newRow[config.newColumnName] = matchedRow.data[config.returnColumn];
			} else {
				// Xử lý khi không tìm thấy kết quả
				switch (config.errorHandling) {
					case 'error':
						newRow[config.newColumnName] = 'ERROR';
						break;
					case 'null':
						newRow[config.newColumnName] = null;
						break;
					case 'empty':
						newRow[config.newColumnName] = '';
						break;
					case 'custom':
						newRow[config.newColumnName] = config.customValue || '';
						break;
					default:
						newRow[config.newColumnName] = 'Error';
				}
			}

			return newRow;
		});
	} catch (error) {
		console.error('Lỗi khi xử lý advanced lookup:', error);
		return data;
	}
};

export const processFilterTable = (data, config) => {
	if (!config.conditions || config.conditions.length === 0) {
		// Nếu không có điều kiện filter, chỉ áp dụng top filter (nếu có)
		let resultData = data;

		// Áp dụng Top Filter nếu được bật
		if (config.enableTopFilter && config.topColumn && config.topCount) {
			resultData = applyTopFilter(resultData, config);
		}

		return resultData;
	}

	// Áp dụng filter conditions
	const filteredData = data.filter(row => {
		try {
			// Kiểm tra từng điều kiện
			const conditionResults = config.conditions.map(condition => {
				if (!condition.column || condition.operator === undefined || condition.value === undefined) {
					return true; // Bỏ qua điều kiện không hợp lệ
				}

				const cellValue = row[condition.column];
				const filterValue = condition.value;

				try {
					switch (condition.operator) {
						case 'equals':
							return cellValue == filterValue; // Sử dụng == để so sánh linh hoạt
						case 'not_equals':
							return cellValue != filterValue;
						case 'greater':
							const val1 = parseFloat(cellValue);
							const val2 = parseFloat(filterValue);
							if (isNaN(val1) || isNaN(val2)) return false;
							return val1 > val2;
						case 'greater_equal':
							const val3 = parseFloat(cellValue);
							const val4 = parseFloat(filterValue);
							if (isNaN(val3) || isNaN(val4)) return false;
							return val3 >= val4;
						case 'less':
							const val5 = parseFloat(cellValue);
							const val6 = parseFloat(filterValue);
							if (isNaN(val5) || isNaN(val6)) return false;
							return val5 < val6;
						case 'less_equal':
							const val7 = parseFloat(cellValue);
							const val8 = parseFloat(filterValue);
							if (isNaN(val7) || isNaN(val8)) return false;
							return val7 <= val8;
						case 'contains':
							return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
						case 'not_contains':
							return !String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
						case 'starts_with':
							return String(cellValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
						case 'not_starts_with':
							return !String(cellValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
						case 'ends_with':
							return String(cellValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
						case 'not_ends_with':
							return !String(cellValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
						case 'isNull':
							// Kiểm tra null, undefined, chuỗi rỗng hoặc chỉ chứa khoảng trắng
							return cellValue === null || 
								   cellValue === undefined || 
								   cellValue === '' || 
								   (typeof cellValue === 'string' && cellValue.trim() === '');
						case 'isNotNull':
							// Kiểm tra không phải null, undefined, chuỗi rỗng hoặc chỉ chứa khoảng trắng
							return cellValue !== null && 
								   cellValue !== undefined && 
								   cellValue !== '' && 
								   !(typeof cellValue === 'string' && cellValue.trim() === '');
						default:
							return true;
					}
				} catch (error) {
					console.error('Lỗi khi đánh giá điều kiện filter:', error);
					return false; // Loại bỏ dòng có lỗi
				}
			});

			// Áp dụng logic AND/OR
			if (config.logic === 'or') {
				return conditionResults.some(result => result);
			} else {
				// Mặc định là AND
				return conditionResults.every(result => result);
			}
		} catch (error) {
			console.error('Lỗi khi filter dữ liệu:', error);
			return false; // Loại bỏ dòng có lỗi
		}
	});

	// Áp dụng Top Filter nếu được bật
	if (config.enableTopFilter && config.topColumn && config.topCount) {
		return applyTopFilter(filteredData, config);
	}

	return filteredData;
};
// Hàm helper cho Top Filter
export const applyTopFilter = (data, config) => {
	if (!data || data.length === 0) return data;

	const sortColumn = config.topColumn;
	const availableColumns = Object.keys(data[0]);

	if (!availableColumns.includes(sortColumn)) {
		console.warn(`Filter Table: Cột sắp xếp "${sortColumn}" không tồn tại trong dữ liệu`);
		return data;
	}

	try {
		// Sắp xếp dữ liệu theo cột đã chọn
		const sortedData = [...data].sort((a, b) => {
			const aValue = a[sortColumn];
			const bValue = b[sortColumn];

			// Xử lý giá trị null/undefined
			if (aValue === null || aValue === undefined) return 1;
			if (bValue === null || bValue === undefined) return -1;

			// Kiểm tra kiểu dữ liệu và so sánh
			const aNum = parseFloat(aValue);
			const bNum = parseFloat(bValue);

			if (!isNaN(aNum) && !isNaN(bNum)) {
				// So sánh số
				return config.topOrder === 'desc' ? bNum - aNum : aNum - bNum;
			} else {
				// So sánh chuỗi
				const aStr = String(aValue).toLowerCase();
				const bStr = String(bValue).toLowerCase();
				if (config.topOrder === 'desc') {
					return bStr.localeCompare(aStr);
				} else {
					return aStr.localeCompare(bStr);
				}
			}
		});

		// Lấy top N bản ghi
		const topCount = Math.min(config.topCount, sortedData.length);
		const result = sortedData.slice(0, topCount);


		return result;
	} catch (error) {
		console.error('Lỗi khi áp dụng Top Filter:', error);
		return data;
	}
};
// Hàm tạo prompt cho AI mapping nhiều giá trị
export function buildAIMappingPrompt(uniqueValues, referenceValues) {
	return `
Hãy chuẩn hóa các giá trị sau thành một trong các giá trị chuẩn dưới đây.
- Danh sách giá trị gốc: [${uniqueValues.join(', ')}]
- Danh sách giá trị chuẩn: [${referenceValues.join(', ')}]
Trả về kết quả dưới dạng JSON, mỗi key là giá trị gốc, value là giá trị chuẩn tương ứng hoặc "UNKNOWN" nếu không mapping được.
Ví dụ:
{
  "HN": "Hà Nội",
  "HCM": "TP HCM",
  "abc": "UNKNOWN"
}
Chỉ trả về đúng object JSON, không có bất kỳ text nào khác.
`;
}
// --- Helper: Update USED_TOKEN_APP after AI call ---
export async function updateUsedTokenApp(aiResult, aiModel = 'gpt-5-mini-2025-08-07') {
	try {
		const usedTokens = aiResult?.usage?.total_tokens || aiResult?.total_tokens || aiResult?.usage?.totalTokens || 0;
		if (!usedTokens) return;
		let settingObj = await getSettingByType('USED_TOKEN_APP');
		let arr = Array.isArray(settingObj?.setting) ? [...settingObj.setting] : [];
		const idx = arr.findIndex(item => item.app === 'data-manager');
		if (idx !== -1) {
			arr[idx].usedToken = (arr[idx].usedToken || 0) + usedTokens;
		} else {
			arr.push({ app: 'data-manager', usedToken: usedTokens, model: aiModel });
		}
		if (settingObj && settingObj.id) {
			await updateSetting({ ...settingObj, setting: arr });
		} else {
			await createSetting({ type: 'USED_TOKEN_APP', setting: arr });
		}
	} catch (err) {
		console.error('Failed to update USED_TOKEN_APP:', err);
	}
}
// --- Helper: Check token quota before AI call ---
export async function checkTokenQuota() {
	const usedTokenSetting = await getSettingByType('USED_TOKEN_APP');
	const totalTokenSetting = await getSettingByType('TOTAL_TOKEN');
	const arr = Array.isArray(usedTokenSetting?.setting) ? usedTokenSetting.setting : [];
	const totalUsed = arr.reduce((sum, item) => sum + (item.usedToken || 0), 0);
	const totalToken = typeof totalTokenSetting?.setting === 'number' ? totalTokenSetting.setting : 0;
	if (totalToken > 0 && totalUsed >= totalToken) {
		message.error('Bạn không thể yêu cầu do đã vượt quá token');
		return false;
	}
	return true;
}

export const processAIAssistedMapping = async (allSourceValues, referenceValues, failureAction = 'keep_original', aiModel = 'gpt-5-mini-2025-08-07') => {
	if (!(await checkTokenQuota())) return undefined;
	const uniqueValues = Array.from(new Set(allSourceValues.filter(v => v !== null && v !== undefined && v !== '')));
	if (!uniqueValues.length || !referenceValues.length) return undefined;
	const prompt = buildAIMappingPrompt(uniqueValues, referenceValues);
	try {
		const aiResult = await aiGen2(prompt, null, aiModel);
		await updateUsedTokenApp(aiResult, aiModel);

		let mappingObj = {};
		try {
			let jsonString = typeof aiResult === 'object' && aiResult.generated ? aiResult.generated : aiResult;

			// Nếu jsonString chứa ```json ... ``` thì cắt lấy phần {...} hoặc [...]
			if (typeof jsonString === 'string') {
				const match = jsonString.match(/```json([\s\S]*?)```/);
				if (match && match[1]) {
					jsonString = match[1].trim();
				} else {
					// Nếu không có ```json ... ```, thử tìm {...} hoặc [...]
					const braceMatch = jsonString.match(/\{[\s\S]*\}/);
					const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
					if (arrayMatch) {
						jsonString = arrayMatch[0];
					} else if (braceMatch) {
						jsonString = braceMatch[0];
					}
				}
			}

			mappingObj = JSON.parse(jsonString);
		} catch (e) {
			mappingObj = {};
			uniqueValues.forEach(v => mappingObj[v] = 'UNKNOWN');
		}
		return mappingObj;
	} catch (e) {
		const mappingObj = {};
		uniqueValues.forEach(v => mappingObj[v] = 'UNKNOWN');
		return mappingObj;
	}
};

export const processValidationMapping = async (data, config) => {
	if (!config.targetColumn || !config.mappingAction) {
		console.warn('Validation & Mapping: Missing required configuration');
		return data;
	}

	// Nếu là manual thì chỉ dùng manualRules, không cần referenceValues
	if (config.mappingAction === 'manual') {
		return data.map(row => {
			const newRow = { ...row };
			const sourceValue = row[config.targetColumn];
			const targetColumn = config.createNewColumn && config.newColumnName
				? config.newColumnName
				: config.targetColumn;
			let mappedValue = sourceValue;
			if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
				mappedValue = processManualMapping(sourceValue, config.manualRules, config.failureAction);
			} else {
				mappedValue = getFailureValue(sourceValue, config.failureAction || 'keep_original');
			}
			newRow[targetColumn] = mappedValue;
			return newRow;
		});
	}

	let referenceValues = [];
	if (config.referenceType === 'list' && config.referenceList) {
		referenceValues = config.referenceList.split(',').map(item => item.trim()).filter(item => item);
	} else if (config.referenceType === 'table' && config.referenceTable && config.referenceColumn) {
		try {
			const referenceDataResponse = await getTemplateRow(config.referenceTable, config.referenceTableVersion || null, false);
			const referenceData = referenceDataResponse.rows || [];
			referenceValues = referenceData
				.map(row => row.data[config.referenceColumn])
				.filter(value => value !== null && value !== undefined && value !== '');
			referenceValues = [...new Set(referenceValues)];
		} catch (error) {
			referenceValues = [];
		}
	}
	if (referenceValues.length === 0) {
		return data.map(row => {
			const newRow = { ...row };
			const targetColumn = config.createNewColumn && config.newColumnName
				? config.newColumnName
				: config.targetColumn;
			newRow[targetColumn] = getFailureValue(row[config.targetColumn], config.failureAction || 'keep_original');
			return newRow;
		});
	}
	if (config.mappingAction === 'ai_assisted') {
		const allSourceValues = data.map(row => row[config.targetColumn]);
		const mappingObj = await processAIAssistedMapping(allSourceValues, referenceValues, config.failureAction, config.aiModel);
		if (mappingObj === undefined) return undefined;
		return data.map(row => {
			const newRow = { ...row };
			const sourceValue = row[config.targetColumn];
			const targetColumn = config.createNewColumn && config.newColumnName
				? config.newColumnName
				: config.targetColumn;
			let mappedValue = sourceValue;
			if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
				const aiMapped = mappingObj[sourceValue];
				if (aiMapped && aiMapped !== 'UNKNOWN') {
					mappedValue = aiMapped;
				} else {
					mappedValue = getFailureValue(sourceValue, config.failureAction || 'keep_original');
				}
			} else {
				mappedValue = getFailureValue(sourceValue, config.failureAction || 'keep_original');
			}
			newRow[targetColumn] = mappedValue;
			return newRow;
		});
	} else if (config.mappingAction === 'similarity') {
		return data.map(row => {
			const newRow = { ...row };
			const sourceValue = row[config.targetColumn];
			const targetColumn = config.createNewColumn && config.newColumnName
				? config.newColumnName
				: config.targetColumn;
			let mappedValue = sourceValue;
			if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
				mappedValue = processSimilarityMapping(sourceValue, referenceValues, config.similarityThreshold, config.failureAction);
			} else {
				mappedValue = getFailureValue(sourceValue, config.failureAction || 'keep_original');
			}
			newRow[targetColumn] = mappedValue;
			return newRow;
		});
	} else if (config.mappingAction === 'manual') {
		return data.map(row => {
			const newRow = { ...row };
			const sourceValue = row[config.targetColumn];
			const targetColumn = config.createNewColumn && config.newColumnName
				? config.newColumnName
				: config.targetColumn;
			let mappedValue = sourceValue;
			if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
				mappedValue = processManualMapping(sourceValue, config.manualRules, config.failureAction);
			} else {
				mappedValue = getFailureValue(sourceValue, config.failureAction || 'keep_original');
			}
			newRow[targetColumn] = mappedValue;
			return newRow;
		});
	} else {
		// fallback
		return data.map(row => {
			const newRow = { ...row };
			const sourceValue = row[config.targetColumn];
			const targetColumn = config.createNewColumn && config.newColumnName
				? config.newColumnName
				: config.targetColumn;
			let mappedValue = getFailureValue(sourceValue, config.failureAction || 'keep_original');
			newRow[targetColumn] = mappedValue;
			return newRow;
		});
	}
};
// Hàm xử lý Similarity Mapping
export const processSimilarityMapping = (sourceValue, referenceValues, threshold = 85, failureAction = 'keep_original') => {
	try {
		if (!sourceValue || !referenceValues.length) {
			return getFailureValue(sourceValue, failureAction);
		}

		const sourceStr = String(sourceValue).toLowerCase();
		let bestMatch = null;
		let bestScore = 0;

		// Tính độ tương đồng với từng giá trị chuẩn
		for (const refValue of referenceValues) {
			const refStr = String(refValue).toLowerCase();
			const similarity = calculateSimilarity(sourceStr, refStr);

			if (similarity > bestScore) {
				bestScore = similarity;
				bestMatch = refValue;
			}

		}

		// Kiểm tra ngưỡng tương đồng
		const thresholdPercent = parseInt(threshold) / 100;
		if (bestScore >= thresholdPercent) {
			return bestMatch;
		}

		return getFailureValue(sourceValue, failureAction);
	} catch (error) {
		console.error('Lỗi khi xử lý similarity mapping:', error);
		return 'ERROR';
	}
};
// Hàm xử lý Manual Mapping
export const processManualMapping = (sourceValue, manualRules, failureAction = 'keep_original') => {
	try {
		if (!sourceValue || !manualRules || !manualRules.length) {
			return getFailureValue(sourceValue, failureAction);
		}

		const sourceStr = String(sourceValue).toLowerCase();

		// Kiểm tra từng quy tắc thủ công
		for (const rule of manualRules) {
			if (!rule.input || !rule.output) continue;

			const inputPattern = rule.input.toLowerCase();

			// Kiểm tra exact match
			if (sourceStr === inputPattern) {
				return rule.output;
			}

			// Kiểm tra contains
			if (sourceStr.includes(inputPattern) || inputPattern.includes(sourceStr)) {
				return rule.output;
			}

			// Kiểm tra wildcard (*)
			if (inputPattern.includes('*')) {
				const regexPattern = inputPattern.replace(/\*/g, '.*');
				const regex = new RegExp(regexPattern, 'i');
				if (regex.test(sourceValue)) {
					return rule.output;
				}
			}
		}

		return getFailureValue(sourceValue, failureAction);
	} catch (error) {
		console.error('Lỗi khi xử lý manual mapping:', error);
		return 'ERROR';
	}
};
// Hàm tính độ tương đồng (Levenshtein distance)
export const calculateSimilarity = (str1, str2) => {
	try {
		const matrix = [];

		// Khởi tạo matrix
		for (let i = 0; i <= str2.length; i++) {
			matrix[i] = [i];
		}
		for (let j = 0; j <= str1.length; j++) {
			matrix[0][j] = j;
		}

		// Tính Levenshtein distance
		for (let i = 1; i <= str2.length; i++) {
			for (let j = 1; j <= str1.length; j++) {
				if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1, // substitution
						matrix[i][j - 1] + 1,     // insertion
						matrix[i - 1][j] + 1,      // deletion
					);
				}
			}
		}

		const distance = matrix[str2.length][str1.length];
		const maxLength = Math.max(str1.length, str2.length);

		// Trả về độ tương đồng (0-1)
		return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
	} catch (error) {
		console.error('Lỗi khi tính độ tương đồng:', error);
		return 0; // Trả về 0 nếu có lỗi
	}
};
// Hàm xử lý giá trị khi mapping thất bại
export const getFailureValue = (originalValue, failureAction) => {

	try {
		// Xử lý trường hợp originalValue là null/undefined
		if (originalValue === null || originalValue === undefined) {
			originalValue = '';
		}

		switch (failureAction) {
			case 'keep_original':
				return originalValue;
			case 'mark_invalid':
				return 'INVALID';
			case 'return_empty':
				return '';
			case 'set_empty':
				return '';
			case 'set_default':
				return 'Unknown';
			default:
				return originalValue;
		}
	} catch (error) {
		console.error('Lỗi trong getFailureValue:', error);
		return 'ERROR';
	}
};
// Hàm xử lý Calculated Column
export const processCalculatedColumn = (data, config) => {
	if (!config.newColumnName || !config.formula) {
		return data;
	}

	return data.map(row => {
		const newRow = { ...row };

		try {
			// Tạo một function để thực thi công thức
			const calculateValue = (formula, rowData) => {
				// Thay thế tên cột bằng giá trị thực tế
				let processedFormula = formula;

				// Phát hiện biểu thức số học để quyết định ép kiểu
				const isArithmetic = typeof formula === 'string' && /[\+\-\*\/\^]/.test(formula);

				// Hỗ trợ tham chiếu cột có chứa ký tự toán học bằng cú pháp "Tên cột"
				// Chỉ thay thế nếu nội dung trong dấu "" trùng tên cột trong dữ liệu
				processedFormula = processedFormula.replace(/"([^"]+)"/g, (match, colName) => {
					if (!Object.prototype.hasOwnProperty.call(rowData, colName)) {
						return match; // giữ nguyên nếu không phải tên cột
					}
					let value = rowData[colName];
					let processedValue;
					if (isArithmetic) {
						// Ưu tiên chuyển sang số cho biểu thức số học
						if (typeof value === 'string') {
							const numeric = parseFloat(value.replace(/,/g, ''));
							processedValue = isNaN(numeric) ? 0 : numeric;
						} else if (typeof value === 'number') {
							processedValue = Number.isFinite(value) ? value : 0;
						} else if (typeof value === 'boolean') {
							processedValue = value ? 1 : 0;
						} else if (value === null || value === undefined) {
							processedValue = 0;
						} else {
							processedValue = 0;
						}
					} else {
						// Không phải biểu thức số học: giữ dạng chuỗi
						if (value === null || value === undefined) {
							processedValue = "''";
						} else {
							processedValue = `'${String(value).replace(/'/g, "\\'")}'`;
						}
					}
					return `(${processedValue})`;
				});

				// Lấy tất cả tên cột có trong dữ liệu
				const columns = Object.keys(rowData);

				// Thay thế tên cột bằng giá trị và xử lý parse kiểu dữ liệu
				for (const col of columns) {
					const value = rowData[col];

					// Xử lý giá trị string - parse thành số nếu có thể
					let processedValue;
					if (typeof value === 'string') {
						// Thử parse thành số nếu có thể
						const numValue = parseFloat(value);
						if (!isNaN(numValue) && value.trim() !== '') {
							// Nếu parse được thành số, sử dụng số đó
							processedValue = numValue;
						} else {
							// Nếu không parse được và công thức có chứa toán tử số học
							if (/[\+\-\*\/\^]/.test(formula)) {
								// Kiểm tra xem cột này có trong công thức không
								if (new RegExp(`\\b${col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(formula)) {
									// Nếu cột này được sử dụng trong công thức số học, gán giá trị mặc định
									processedValue = 0;
								} else {
									// Nếu cột này không được sử dụng trong công thức, bỏ qua
									continue;
								}
							} else {
								// Nếu không có toán tử số học, giữ nguyên string
								processedValue = `'${value}'`;
							}
						}
					} else {
						processedValue = value;
					}

					// Kiểm tra xem cột này có trong công thức không trước khi xử lý
					// Sử dụng cả word boundary và không dùng word boundary để kiểm tra
					const escapedColName = col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					const hasWordBoundary = new RegExp(`\\b${escapedColName}\\b`).test(formula);
					const hasNoBoundary = new RegExp(escapedColName).test(formula);

					if (!hasWordBoundary && !hasNoBoundary) {
						console.log(`Column "${col}" not found in formula, skipping...`);
						continue;
					}

					// Chỉ thay thế nếu có processedValue
					if (processedValue !== undefined) {
						// Escape các ký tự đặc biệt trong tên cột để tránh lỗi regex
						const escapedColName = col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

						// Debug: Log quá trình thay thế
						console.log(`Replacing column "${col}" (escaped: "${escapedColName}") with value:`, processedValue);
						console.log(`Formula before replacement: "${processedFormula}"`);

						// Sử dụng replace với callback để xử lý an toàn hơn
						const beforeReplace = processedFormula;

						// Thử thay thế với word boundary trước
						if (hasWordBoundary) {
							processedFormula = processedFormula.replace(new RegExp(`\\b${escapedColName}\\b`, 'g'), (match) => {
								console.log(`Found word boundary match: "${match}" for column "${col}"`);
								return processedValue;
							});
						}

						// Nếu không thay thế được với word boundary, thử không dùng word boundary
						if (beforeReplace === processedFormula && hasNoBoundary) {
							console.log(`Word boundary replacement failed, trying without word boundary for column "${col}"`);
							processedFormula = processedFormula.replace(new RegExp(escapedColName, 'g'), (match) => {
								console.log(`Found no-boundary match: "${match}" for column "${col}"`);
								return processedValue;
							});
						}

						console.log(`Formula after replacement: "${processedFormula}"`);

						// Kiểm tra xem có thay thế thành công không
						if (beforeReplace === processedFormula) {
							console.warn(`Warning: Column "${col}" was not replaced in formula`);
							// Thử cách cuối cùng: thay thế từng phần
							console.warn(`Trying partial replacement for column "${col}"`);
							const colParts = col.split(/\s+/);
							for (const part of colParts) {
								if (part.length > 1) { // Chỉ thay thế các phần có ý nghĩa
									const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
									processedFormula = processedFormula.replace(new RegExp(escapedPart, 'g'), processedValue);
								}
							}
							console.log(`Formula after partial replacement: "${processedFormula}"`);
						}
					}
				}

				// Xử lý toán tử concat trước khi eval
				if (processedFormula.includes('concat')) {
					processedFormula = processedFormula.replace(/concat/g, '+');
				}

				// Debug: Log công thức đã xử lý
				console.log('Original formula:', formula);
				console.log('Processed formula:', processedFormula);
				console.log('Row data:', rowData);

				// Kiểm tra xem công thức có hợp lệ không trước khi eval
				try {
					// Thử parse công thức để kiểm tra syntax
					new Function('', `return ${processedFormula}`);
				} catch (parseError) {
					console.error('Invalid formula syntax:', parseError);
					console.error('Processed formula that caused error:', processedFormula);
					// Thử sửa công thức bằng cách thay thế các ký tự không hợp lệ
					let fixedFormula = processedFormula;
					// Loại bỏ các ký tự không hợp lệ trong JavaScript
					fixedFormula = fixedFormula.replace(/[^\w\s\+\-\*\/\^\(\)\.\,\[\]\{\}]/g, '');

					try {
						new Function('', `return ${fixedFormula}`);
						processedFormula = fixedFormula;
						console.log('Formula fixed:', fixedFormula);
					} catch (fixError) {
						console.error('Could not fix formula:', fixError);
						return 'ERROR';
					}
				}

				// Thực thi công thức
				// eslint-disable-next-line no-eval
				const result = eval(processedFormula);

				// Kiểm tra kết quả có hợp lệ không
				if (result === null || result === undefined || Number.isNaN(result) || !Number.isFinite(result)) {
					return 'ERROR';
				}

				// Kiểm tra nếu kết quả là số âm và không phải là phép trừ hợp lệ
				if (typeof result === 'number' && result < 0 && !formula.includes('-')) {
					// Có thể có lỗi trong quá trình parse, thử parse lại với giá trị mặc định
					return 'ERROR';
				}

				// Chuyển đổi kiểu dữ liệu theo config
				switch (config.dataType) {
					case 'number':
						const numResult = parseFloat(result);
						return Number.isNaN(numResult) ? 'ERROR' : numResult;
					case 'string':
						return String(result);
					case 'boolean':
						return Boolean(result);
					case 'date':
						const dateResult = new Date(result);
						return isNaN(dateResult.getTime()) ? 'ERROR' : dateResult.toISOString();
					default:
						return result;
				}
			};

			// Tính toán giá trị mới
			const calculatedValue = calculateValue(config.formula, row);

			// Thêm cột mới
			newRow[config.newColumnName] = calculatedValue;

		} catch (error) {
			console.error('Lỗi khi tính toán cột:', error);
			// Nếu có lỗi, gán giá trị ERROR
			newRow[config.newColumnName] = 'ERROR';
		}

		return newRow;
	});
};
// Hàm xử lý Smart Fill (Điền có điều kiện)
export const processSmartFill = async (data, config, step = null, getOrCreateAIConfig = null) => {
	if (!config.targetColumn && !config.createNewColumn) {
		return data;
	}

	// Xác định cột đích
	const targetColumn = config.createNewColumn && config.newColumnName
		? config.newColumnName
		: config.targetColumn;

	// Hàm kiểm tra giá trị trống
	const isEmptyValue = (value) => {
		return value === null || value === undefined || value === '' || String(value).trim() === '';
	};

	// Hàm kiểm tra có nên xử lý dòng này không
	const shouldProcessRow = (row) => {
		// Nếu không bật "Chỉ xử lý dòng trống", xử lý tất cả
		if (!config.onlyProcessEmptyRows) {
			return true;
		}

		// Nếu bật "Chỉ xử lý dòng trống", kiểm tra giá trị hiện tại
		if (config.createNewColumn) {
			// Nếu tạo cột mới, luôn xử lý (vì cột mới chưa có dữ liệu)
			return true;
		} else {
			// Kiểm tra giá trị hiện tại của cột đích
			const currentValue = row[targetColumn];
			return isEmptyValue(currentValue);
		}
	};

	// Nếu sử dụng AI
	if (config.useAI && config.aiPrompt) {
		try {
			let aiConditions;

			// Sử dụng cache nếu có hàm getOrCreateAIConfig
			if (getOrCreateAIConfig && step) {
				aiConditions = await getOrCreateAIConfig(step, data, config);
			} else {
				// Fallback: tạo AI config mới như cũ
				aiConditions = await generateAIConditions(data, config.aiPrompt, config.targetColumn);
			}

			// Áp dụng điều kiện AI đã tạo
			return data.map(row => {
				const newRow = { ...row };

				// Chỉ xử lý nếu thỏa mãn điều kiện
				if (shouldProcessRow(row)) {
					const fillValue = evaluateConditions(row, aiConditions.conditions, aiConditions.elseValue, data);
					newRow[targetColumn] = fillValue;
				}
				// Nếu không xử lý, giữ nguyên giá trị cũ

				return newRow;
			});
		} catch (error) {
			console.error('Lỗi khi xử lý AI:', error);
			throw error;
		}
	}

	// Nếu không sử dụng AI, kiểm tra điều kiện thủ công
	if (!config.conditions || config.conditions.length === 0) {
		return data;
	}

	return data.map(row => {
		const newRow = { ...row };

		try {
			// Chỉ xử lý nếu thỏa mãn điều kiện
			if (shouldProcessRow(row)) {
				// Đánh giá các điều kiện IF-THEN
				const fillValue = evaluateConditions(row, config.conditions, config.elseValue, data);

				// Điền giá trị vào cột đích
				newRow[targetColumn] = fillValue;
			}
			// Nếu không xử lý, giữ nguyên giá trị cũ

		} catch (error) {
			console.error('Lỗi khi điền có điều kiện:', error);
			// Nếu có lỗi và dòng được xử lý, gán giá trị ERROR
			if (shouldProcessRow(row)) {
				newRow[targetColumn] = 'ERROR';
			}
		}

		return newRow;
	});
};
// Hàm tạo điều kiện fallback đơn giản
export const generateFallbackConditions = (sampleData, aiPrompt, targetColumn) => {

	// Tìm cột số để tạo điều kiện
	const numericColumns = Object.keys(sampleData[0] || {}).filter(col => {
		return sampleData.some(row => {
			const value = row[col];
			return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
		});
	});

	const conditions = [];
	const lowerPrompt = aiPrompt.toLowerCase();

	// Pattern phổ biến: VIP/Premium/Standard/Basic
	if (lowerPrompt.includes('vip') || lowerPrompt.includes('premium') || lowerPrompt.includes('standard') || lowerPrompt.includes('basic')) {
		if (numericColumns.length > 0) {
			const numericColumn = numericColumns[0];

			// Tìm giá trị số trong prompt
			const numbers = aiPrompt.match(/\d+/g);
			if (numbers && numbers.length > 0) {
				const threshold = numbers[0];

				if (lowerPrompt.includes('vip') || lowerPrompt.includes('premium')) {
					conditions.push({
						id: Date.now(),
						column: numericColumn,
						operator: '>',
						value: threshold,
						thenValue: 'VIP',
					});
				}

				if (lowerPrompt.includes('standard')) {
					const standardThreshold = numbers[1] || Math.floor(parseInt(threshold) * 0.5);
					conditions.push({
						id: Date.now() + 1,
						column: numericColumn,
						operator: '>',
						value: standardThreshold.toString(),
						thenValue: 'Standard',
					});
				}
			}
		}
	}

	// Pattern phổ biến: High/Medium/Low
	if (lowerPrompt.includes('high') || lowerPrompt.includes('medium') || lowerPrompt.includes('low')) {
		if (numericColumns.length > 0) {
			const numericColumn = numericColumns[0];

			// Tính toán ngưỡng dựa trên dữ liệu mẫu
			const values = sampleData.map(row => parseFloat(row[numericColumn])).filter(v => !isNaN(v));
			if (values.length > 0) {
				const max = Math.max(...values);
				const min = Math.min(...values);
				const highThreshold = min + (max - min) * 0.7;
				const mediumThreshold = min + (max - min) * 0.3;

				conditions.push({
					id: Date.now(),
					column: numericColumn,
					operator: '>',
					value: highThreshold.toString(),
					thenValue: 'High',
				});

				conditions.push({
					id: Date.now() + 1,
					column: numericColumn,
					operator: '>',
					value: mediumThreshold.toString(),
					thenValue: 'Medium',
				});
			}
		}
	}

	// Mặc định elseValue
	let elseValue = 'Basic';
	if (lowerPrompt.includes('low')) elseValue = 'Low';
	if (lowerPrompt.includes('normal')) elseValue = 'Normal';
	if (lowerPrompt.includes('basic')) elseValue = 'Basic';

	return {
		conditions,
		elseValue,
	};
};
// Hàm trích xuất các cột được mention từ prompt
export const extractMentionedColumns = (prompt) => {
	// Tìm tất cả các vị trí @ trong prompt
	const atPositions = [];
	let index = prompt.indexOf('@');
	while (index !== -1) {
		atPositions.push(index);
		index = prompt.indexOf('@', index + 1);
	}
	
	const mentions = [];
	
	atPositions.forEach(atPos => {
		// Lấy text sau @
		const textAfterAt = prompt.substring(atPos + 1);
		
		// Tìm vị trí kết thúc của tên cột (dấu phẩy, dấu chấm, hoặc từ khóa)
		// Cải thiện: chỉ dừng ở các từ khóa thực sự kết thúc tên cột, không dừng ở "của" vì nó có thể là phần của tên cột
		const stopWords = ['tách', 'ra', 'chữ', 'cái', 'đầu', 'tiên', 'và', 'trả', 'về', 'kết', 'quả', 'ra', 'ký', 'tự', 'đó', 'này', 'cho', 'với', 'từ', 'trong', 'theo', 'dựa', 'vào', 'mỗi', 'dòng', ',', '.'];
		
		let endPos = textAfterAt.length;
		for (const stopWord of stopWords) {
			const pos = textAfterAt.toLowerCase().indexOf(stopWord.toLowerCase());
			if (pos !== -1 && pos < endPos) {
				endPos = pos;
			}
		}
		
		// Lấy tên cột
		const columnName = textAfterAt.substring(0, endPos).trim();
		
		// Chỉ lấy nếu tên cột hợp lệ (không rỗng và không chứa từ khóa)
		if (columnName && !stopWords.some(word => columnName.toLowerCase().includes(word.toLowerCase()))) {
			mentions.push(columnName);
		}
	});
	
	return [...new Set(mentions)]; // Loại bỏ duplicate
};
// Hàm tạo điều kiện bằng AI
export const generateAIConditions = async (data, aiPrompt, targetColumn, config) => {
	if (!(await checkTokenQuota())) throw new Error('Bạn không thể hỏi do đã vượt quá token');
	// Trích xuất các cột được mention trong prompt
	const mentionedColumnsForConditions = extractMentionedColumns(aiPrompt);

	// Lấy sample 50 dòng đầu tiên để phân tích
	const sampleData = data.slice(0, 50);

	// Tạo dữ liệu để gửi cho AI: chỉ các cột được mention + unique values
	const analysisData = {};

	// Nếu có cột được mention, chỉ lấy các cột đó
	if (mentionedColumnsForConditions.length > 0) {
		mentionedColumnsForConditions.forEach(columnName => {
			if (sampleData.length > 0 && sampleData[0].hasOwnProperty(columnName)) {
				// Lấy unique values của cột
				const uniqueValues = [...new Set(sampleData.map(row => row[columnName]))];
				analysisData[columnName] = uniqueValues;
			}
		});
	} else {
		// Nếu không có mention, lấy tất cả cột với unique values
		if (sampleData.length > 0) {
			Object.keys(sampleData[0]).forEach(columnName => {
				if (columnName !== 'rowId' && columnName !== 'key') {
					const uniqueValues = [...new Set(sampleData.map(row => row[columnName]))];
					analysisData[columnName] = uniqueValues;
				}
			});
		}
	}

	// Tạo system message
	const systemMessage = `Bạn là một chuyên gia phân tích dữ liệu. 
Nhiệm vụ: Phân tích dữ liệu và tạo điều kiện IF-THEN-ELSE để điền vào cột "${targetColumn}".

QUAN TRỌNG: Chỉ trả về JSON thuần túy, không có text giải thích thêm.

Yêu cầu format JSON:
{
  "conditions": [
    {"column": "tên_cột", "operator": "toán_tử", "value": "giá_trị", "thenValue": "giá_trị_điền"}
  ],
  "elseValue": "giá_trị_mặc_định"
}

Quy tắc:
- Toán tử: >, >=, <, <=, =, !=, contains
- Tối đa 5 điều kiện
- Điều kiện đánh giá tuần tự từ trên xuống
- Giá trị "value" luôn là chuỗi
- Phân tích các giá trị unique của từng cột để tạo điều kiện phù hợp
- Dữ liệu được cung cấp chỉ bao gồm các cột liên quan và unique values của chúng`;

	// Tạo prompt với clean data
	const cleanPrompt = aiPrompt.replace(/@(\w+)/g, '$1'); // Loại bỏ @ symbol
	const prompt = `Dữ liệu phân tích (unique values theo cột):
${JSON.stringify(analysisData, null, 2)}
Yêu cầu của người dùng: ${cleanPrompt}
Hãy phân tích dữ liệu và tạo điều kiện IF-THEN-ELSE phù hợp dựa trên các unique values đã cung cấp. Chỉ trả về đối tượng JSON, không có text thêm.`;

	try {

		const aiResponse = await aiGen2(prompt, systemMessage, config.aiModel || 'gpt-5-mini-2025-08-07');
		await updateUsedTokenApp(aiResponse, config.aiModel || 'gpt-5-mini-2025-08-07');


		// Parse kết quả AI
		let aiResult;
		try {
			// Xử lý response structure từ aiGen
			let jsonString;

			// Nếu response là object có trường result
			if (typeof aiResponse === 'object' && aiResponse.generated) {
				jsonString = aiResponse.generated;
			} else if (typeof aiResponse === 'string') {
				jsonString = aiResponse;
			} else {
				jsonString = JSON.stringify(aiResponse);
			}

			// Nếu jsonString chứa ```json ... ``` thì cắt lấy phần {...}
			if (typeof jsonString === 'string') {
				const match = jsonString.match(/```json([\s\S]*?)```/);
				if (match && match[1]) {
					jsonString = match[1].trim();
				} else {
					// Nếu không có ```json ... ```, thử tìm {...}
					const braceMatch = jsonString.match(/\{[\s\S]*\}/);
					if (braceMatch) {
						jsonString = braceMatch[0];
					}
				}
			}

			// Parse JSON string
			aiResult = JSON.parse(jsonString);

		} catch (parseError) {
			console.error('Lỗi parse JSON từ AI:', parseError);
			console.error('Response gốc:', aiResponse);
			console.error('JSON string:', typeof aiResponse === 'object' && aiResponse.generated ? aiResponse.generated : aiResponse);

			// Fallback: thử parse từ regex
			try {
				const responseStr = (typeof aiResponse === 'object' && aiResponse.generated) ? aiResponse.generated : JSON.stringify(aiResponse);
				const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					aiResult = JSON.parse(jsonMatch[0]);
				} else {
					throw new Error('Không tìm thấy JSON trong response');
				}
			} catch (fallbackError) {
				console.error('Fallback parse failed:', fallbackError);
				throw new Error('AI không trả về format JSON hợp lệ: ' + parseError.message);
			}
		}

		// Validate kết quả
		if (!aiResult.conditions || !Array.isArray(aiResult.conditions)) {
			console.error('AI result không hợp lệ:', aiResult);
			throw new Error('AI không trả về điều kiện hợp lệ');
		}

		// Validate từng điều kiện
		const validConditions = aiResult.conditions.filter(condition => {
			const isValid = condition.column && condition.operator &&
				condition.value !== undefined && condition.thenValue !== undefined;
			if (!isValid) {
				console.warn('Điều kiện không hợp lệ:', condition);
			}
			return isValid;
		});

		if (validConditions.length === 0) {
			throw new Error('Không có điều kiện nào hợp lệ từ AI');
		}

		// Thêm ID cho mỗi điều kiện
		const conditionsWithId = validConditions.map((condition, index) => ({
			...condition,
			id: Date.now() + index,
		}));


		return {
			conditions: conditionsWithId,
			elseValue: aiResult.elseValue || '',
		};

	} catch (error) {
		console.error('Lỗi khi gọi AI:', error);

		// Fallback: Tạo điều kiện đơn giản dựa trên dữ liệu mẫu
		try {
			const fallbackConditions = generateFallbackConditions(sampleData, aiPrompt, targetColumn);
			if (fallbackConditions.conditions.length > 0) {
				return fallbackConditions;
			}
		} catch (fallbackError) {
			console.error('Lỗi fallback:', fallbackError);
		}

		throw new Error('Không thể tạo điều kiện từ AI: ' + error.message);
	}
};
// Hàm đánh giá các điều kiện IF-THEN
// Hàm helper để kiểm tra giá trị có phải số không
const isNumeric = (value) => {
	if (value === null || value === undefined || value === '') return false;
	return !isNaN(parseFloat(value)) && isFinite(value);
};

// Hàm helper để kiểm tra giá trị có null/empty không
const isNotNullOrEmpty = (value) => {
	return value !== null && value !== undefined && value !== '' && String(value).trim() !== '';
};

// Hàm helper để lấy top largest values
const getTopLargestValues = (data, column, count) => {
	const values = data
		.map(row => row[column])
		.filter(val => isNumeric(val))
		.map(val => parseFloat(val))
		.sort((a, b) => b - a);
	
	return values.slice(0, parseInt(count) || 5);
};

// Hàm helper để lấy top smallest values
const getTopSmallestValues = (data, column, count) => {
	const values = data
		.map(row => row[column])
		.filter(val => isNumeric(val))
		.map(val => parseFloat(val))
		.sort((a, b) => a - b);
	
	return values.slice(0, parseInt(count) || 5);
};

export const evaluateConditions = (rowData, conditions, elseValue = '', allData = []) => {
	// Duyệt qua từng điều kiện
	for (const condition of conditions) {
		// Kiểm tra điều kiện cần thiết
		if (!condition.column || !condition.operator || condition.thenValue === '') {
			continue; // Bỏ qua điều kiện không đầy đủ
		}
		
		// Bỏ qua kiểm tra value cho các điều kiện không cần giá trị
		const noValueConditions = ['is_not_null', 'is_not_number', 'is_number'];
		if (!noValueConditions.includes(condition.operator) && condition.value === '') {
			continue;
		}

		const cellValue = rowData[condition.column];
		const conditionValue = condition.value;

		// Đánh giá điều kiện
		let conditionMet = false;

		try {
			switch (condition.operator) {
				case '>':
					const val1 = parseFloat(cellValue);
					const val2 = parseFloat(conditionValue);
					if (isNaN(val1) || isNaN(val2)) {
						return 'ERROR';
					}
					conditionMet = val1 > val2;
					break;
				case '>=':
					const val3 = parseFloat(cellValue);
					const val4 = parseFloat(conditionValue);
					if (isNaN(val3) || isNaN(val4)) {
						return 'ERROR';
					}
					conditionMet = val3 >= val4;
					break;
				case '<':
					const val5 = parseFloat(cellValue);
					const val6 = parseFloat(conditionValue);
					if (isNaN(val5) || isNaN(val6)) {
						return 'ERROR';
					}
					conditionMet = val5 < val6;
					break;
				case '<=':
					const val7 = parseFloat(cellValue);
					const val8 = parseFloat(conditionValue);
					if (isNaN(val7) || isNaN(val8)) {
						return 'ERROR';
					}
					conditionMet = val7 <= val8;
					break;
				case '=':
					conditionMet = String(cellValue) === String(conditionValue);
					break;
				case '!=':
					conditionMet = String(cellValue) !== String(conditionValue);
					break;
				case 'contains':
					conditionMet = String(cellValue).toLowerCase().includes(String(conditionValue).toLowerCase());
					break;
				case 'starts_with':
					conditionMet = String(cellValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
					break;
				case 'is_not_null':
					conditionMet = isNotNullOrEmpty(cellValue);
					break;
				case 'is_not_number':
					conditionMet = !isNumeric(cellValue);
					break;
				case 'is_number':
					conditionMet = isNumeric(cellValue);
					break;
				case 'top_largest':
					if (allData && allData.length > 0) {
						const topValues = getTopLargestValues(allData, condition.column, conditionValue);
						conditionMet = topValues.includes(parseFloat(cellValue));
					} else {
						conditionMet = false;
					}
					break;
				case 'top_smallest':
					if (allData && allData.length > 0) {
						const topValues = getTopSmallestValues(allData, condition.column, conditionValue);
						conditionMet = topValues.includes(parseFloat(cellValue));
					} else {
						conditionMet = false;
					}
					break;
				default:
					conditionMet = false;
			}
		} catch (error) {
			console.error('Lỗi khi đánh giá điều kiện:', error);
			// Trả về ERROR cho hàng có lỗi
			return 'ERROR';
		}

		// Nếu điều kiện đúng, trả về giá trị tương ứng
		if (conditionMet) {
			return condition.thenValue;
		}
	}

	// Nếu không có điều kiện nào đúng, trả về giá trị mặc định
	return elseValue;
};
export const processUploadData = async (config) => {
	// Đây là placeholder cho việc xử lý upload data
	// Trong thực tế, bạn sẽ cần implement các API calls để:
	// 1. Upload Excel file
	// 2. Fetch data từ Google Sheets
	// 3. Fetch data từ Google Drive

	let uploadedData = [];

	try {
		switch (config.uploadType) {
			case 'excel':
				if (config.file) {
					// Xử lý upload Excel file
					// const response = await uploadExcelFile(config.file);
					// uploadedData = response.data;
					message.info('Excel file upload processing...');
				}
				break;
			case 'googleSheets':
				if (config.googleSheetUrl) {
					// Xử lý fetch từ Google Sheets
					// const response = await fetchGoogleSheetsData(config.googleSheetUrl);
					// uploadedData = response.data;
					message.info('Google Sheets data fetching...');
				}
				break;
			case 'googleDrive':
				if (config.googleDriveUrl) {
					// Xử lý fetch từ Google Drive
					// const response = await fetchGoogleDriveData(config.googleDriveUrl);
					// uploadedData = response.data;
					message.info('Google Drive data fetching...');
				}
				break;
			case 'googleDriveFolder':
				if (config.googleDriveFolderUrl) {
					// Xử lý fetch từ Google Drive Folder sử dụng n8n webhook
					try {
						console.log('Processing Google Drive Folder data...');
						
						// Import n8n webhook functions

						
						// Bước 1: Lấy danh sách file từ folder
						const folderResponse = await n8nWebhookGoogleDrive({ 
							googleDriveUrl: config.googleDriveFolderUrl,
							email_import: 'gateway@xichtho-vn.com'
						});

						if (!folderResponse || !folderResponse.success) {
							throw new Error('Không thể lấy danh sách file từ Google Drive Folder!');
						}

						// Bước 2: Lấy danh sách file từ response
						let files = [];
						if (folderResponse.files && Array.isArray(folderResponse.files)) {
							files = folderResponse.files;
						} else if (folderResponse.sheets) {
							files = Object.keys(folderResponse.sheets).map(sheetName => ({
								id: sheetName,
								name: sheetName,
								sheetName: sheetName
							}));
						}

						if (files.length === 0) {
							message.warning('Không tìm thấy file nào trong folder!');
							break;
						}

						// Bước 3: Lọc file theo điều kiện
						let filteredFiles = files;
						
						if (config.fileNameCondition) {
							const pattern = config.fileNameCondition.replace(/\*/g, '.*');
							const regex = new RegExp(pattern, 'i');
							filteredFiles = filteredFiles.filter(file => regex.test(file.name));
						}

						if (config.lastUpdateCondition) {
							const now = new Date();
							const days = parseInt(config.lastUpdateCondition.replace('d', ''));
							const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
							filteredFiles = filteredFiles.filter(file => {
								const fileDate = new Date(file.lastModified || file.modifiedTime || now);
								return fileDate >= cutoffDate;
							});
						}

						if (filteredFiles.length === 0) {
							message.warning('Không có file nào thỏa mãn điều kiện lọc!');
							break;
						}

						// Bước 4: Lấy dữ liệu từ từng file và tổng hợp
						const mergedRows = [];
						const allHeadersSet = new Set();
						const headerRow = config.headerRow || 0; // 0-based

						for (const file of filteredFiles) {
							try {
								const fileResponse = await n8nWebhookGoogleDrive({ 
									googleDriveUrl: file.id,
									email_import: 'gateway@xichtho-vn.com'
								});

								if (!fileResponse || !fileResponse.success) {
									continue;
								}

								// Xử lý dữ liệu từ file
								let matrix = [];
								if (fileResponse.sheets && Array.isArray(fileResponse.sheetNames)) {
									const sheetName = file.sheetName || fileResponse.sheetNames[0];
									const sheetData = fileResponse.sheets[sheetName];
									matrix = Array.isArray(sheetData?.data) ? sheetData.data : [];
								} else if (fileResponse.rawData && Array.isArray(fileResponse.rawData)) {
									matrix = fileResponse.rawData;
								}

								if (!Array.isArray(matrix) || matrix.length === 0) {
									continue;
								}

								if (headerRow >= matrix.length) {
									continue;
								}

								const fileHeaderRow = matrix[headerRow] || [];
								const dataRows = matrix.slice(headerRow + 1);

								// Thêm headers vào set tổng hợp
								fileHeaderRow.forEach(h => { 
									if (h !== undefined && h !== null && String(h).trim() !== '') {
										allHeadersSet.add(String(h));
									}
								});

								// Xử lý dữ liệu từng dòng
								for (const row of dataRows) {
									const obj = {};
									fileHeaderRow.forEach((h, i) => {
										if (h === undefined || h === null) return;
										obj[String(h)] = Array.isArray(row) ? row[i] : undefined;
									});
									mergedRows.push(obj);
								}
							} catch (error) {
								console.error(`Error processing file ${file.name}:`, error);
								continue;
							}
						}

						if (mergedRows.length > 0) {
							uploadedData = mergedRows;
							message.success(`Đã lấy ${mergedRows.length} dòng dữ liệu từ ${filteredFiles.length} file Google Drive Folder`);
						} else {
							message.warning('Không có dữ liệu từ các file đã lọc');
						}
					} catch (error) {
						console.error('Lỗi khi lấy dữ liệu từ Google Drive Folder:', error);
						message.error('Có lỗi khi lấy dữ liệu từ Google Drive Folder!');
					}
				}
				break;
			case 'postgresql':
				if (config.postgresConfig) {
					// Xử lý fetch từ PostgreSQL
					try {
						const res = await postgresService.getTableData(config.postgresConfig);
						if (Array.isArray(res) && res.length > 0) {
							uploadedData = res;
							message.success(`Đã lấy được ${res.length} dòng dữ liệu từ PostgreSQL`);
						} else {
							message.error('Không lấy được dữ liệu từ PostgreSQL!');
						}
					} catch (error) {
						console.error('Lỗi khi lấy dữ liệu từ PostgreSQL:', error);
						message.error('Có lỗi khi lấy dữ liệu từ PostgreSQL!');
					}
				}
				break;
			case 'api':
				if (config.apiUrl) {
					// Xử lý fetch từ API
					try {
						const headers = {};
						if (config.apiKey) {
							headers['Authorization'] = `Bearer ${config.apiKey}`;
						}

						const response = await fetch(config.apiUrl, {
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
								...headers,
							},
						});

						if (!response.ok) {
							throw new Error(`HTTP error! status: ${response.status}`);
						}

						const data = await response.json();

						// Kiểm tra xem data có phải là array không
						let processedData = data;
						if (Array.isArray(data)) {
							processedData = data;
						} else if (data.data && Array.isArray(data.data)) {
							processedData = data.data;
						} else if (data.results && Array.isArray(data.results)) {
							processedData = data.results;
						} else if (data.items && Array.isArray(data.items)) {
							processedData = data.items;
						} else {
							// Nếu không phải array, chuyển thành array với 1 object
							processedData = [data];
						}

						if (processedData.length > 0) {
							uploadedData = processedData;
							message.success(`Đã lấy được ${processedData.length} dòng dữ liệu từ API`);
						} else {
							message.error('Không lấy được dữ liệu từ API!');
						}
					} catch (error) {
						console.error('Lỗi khi lấy dữ liệu từ API:', error);
						message.error(`Có lỗi khi lấy dữ liệu từ API: ${error.message}`);
					}
				}
				break;
			case 'system':
				if (config.systemData && Array.isArray(config.systemData) && config.systemData.length > 0) {
					// Dữ liệu đã được load từ UploadConfig, chỉ cần sử dụng
					uploadedData = config.systemData;
					message.success(`Đã sử dụng ${config.systemData.length} dòng dữ liệu từ hệ thống (${config.systemConfig?.templateTableName || 'Unknown'})`);
				} else if (config.systemConfig) {
					// Nếu chưa có dữ liệu, thử load lại từ config
					try {
						const { templateTableId, stepId } = config.systemConfig;
						if (templateTableId) {
							const dataResponse = await getTemplateRow(templateTableId, stepId, false);
							const data = dataResponse.rows || [];
							if (data && Array.isArray(data) && data.length > 0) {
								uploadedData = data;
								message.success(`Đã lấy được ${data.length} dòng dữ liệu từ hệ thống`);
							} else {
								message.error('Không lấy được dữ liệu từ hệ thống!');
							}
						} else {
							message.error('Thiếu thông tin templateTable để lấy dữ liệu từ hệ thống!');
						}
					} catch (error) {
						console.error('Lỗi khi lấy dữ liệu từ hệ thống:', error);
						message.error('Có lỗi khi lấy dữ liệu từ hệ thống!');
					}
				} else {
					message.error('Không có cấu hình để lấy dữ liệu từ hệ thống!');
				}
				break;
			default:
				throw new Error('Invalid upload type');
		}

		return uploadedData;
	} catch (error) {
		console.error('Error processing upload data:', error);
		throw error;
	}
};
// Hàm xử lý Column Split
export const processColumnSplit = (data, config) => {
	if (!config.targetColumn || !config.splitMethod) {
		return data;
	}

	return data.map(row => {
		const newRow = { ...row };

		// Khởi tạo các cột kết quả - sử dụng newlyCreatedColumns nếu có, fallback sang outputColumns
		let outputColumnNames = [];
		if (config.newlyCreatedColumns && Array.isArray(config.newlyCreatedColumns)) {
			// Ưu tiên sử dụng newlyCreatedColumns (chỉ chứa các cột mới được tạo)
			outputColumnNames = config.newlyCreatedColumns;
		} else if (config.outputColumns && Array.isArray(config.outputColumns)) {
			// Fallback sang outputColumns và lọc ra các cột mới (không phải targetColumn)
			outputColumnNames = config.outputColumns
				.filter(col => {
					if (typeof col === 'string') {
						return col !== config.targetColumn;
					} else if (col && typeof col === 'object' && col.name) {
						return col.name !== config.targetColumn;
					}
					return true;
				})
				.map(col => typeof col === 'string' ? col : col.name);
		}

		try {
			const sourceValue = row[config.targetColumn];

			outputColumnNames.forEach(colName => {
				newRow[colName] = '';
			});

			if (sourceValue === null || sourceValue === undefined || sourceValue === '') {
				return newRow;
			}

			const sourceStr = String(sourceValue);
			let splitResults = [];
			if (config.splitMethod === 'separator') {
				// Tách theo ký tự phân tách
				splitResults = sourceStr.split(config.separator);
			} else if (config.splitMethod === 'position') {
				// Tách theo vị trí
				const { position, length, startingChar } = config;

				if (position === 'left') {
					// Lấy từ trái
					const leftPart = sourceStr.substring(0, length);
					const rightPart = sourceStr.substring(length);
					splitResults = [leftPart, rightPart];
				} else if (position === 'right') {
					// Lấy từ phải
					const rightPart = sourceStr.substring(sourceStr.length - length);
					const leftPart = sourceStr.substring(0, sourceStr.length - length);
					splitResults = [leftPart, rightPart];
				} else if (position === 'mid') {
					// Lấy từ giữa
					let startIndex = 0;

					if (startingChar) {
						// Tìm vị trí ký tự bắt đầu
						startIndex = sourceStr.indexOf(startingChar);
						if (startIndex === -1) {
							// Không tìm thấy ký tự, bỏ qua
							return newRow;
						}
						startIndex += startingChar.length; // Bắt đầu sau ký tự
					} else {
						// Bắt đầu từ ký tự thứ length
						startIndex = length - 1;
					}

					const beforePart = sourceStr.substring(0, startIndex);
					const midPart = sourceStr.substring(startIndex, startIndex + length);
					const afterPart = sourceStr.substring(startIndex + length);
					splitResults = [beforePart, midPart, afterPart];
				}
			}

			// Gán kết quả vào các cột
			outputColumnNames.forEach((colName, index) => {
				newRow[colName] = splitResults[index] || '';
			});

		} catch (error) {
			console.error('Lỗi khi tách cột:', error);
			// Gán ERROR cho các cột kết quả
			outputColumnNames.forEach(colName => {
				newRow[colName] = 'ERROR';
			});
		}

		return newRow;
	});
};
// Hàm xử lý Date Converter
export const processDateConverter = (data, config) => {
	if (!config.yearColumn || !config.monthColumn || !config.dayColumn || !config.outputColumn) {
		return data;
	}

	return data.map(row => {
		const newRow = { ...row };

		try {
			const year = parseInt(row[config.yearColumn]);
			const month = parseInt(row[config.monthColumn]);
			const day = parseInt(row[config.dayColumn]);

			// Validate input
			if (isNaN(year) || isNaN(month) || isNaN(day)) {
				newRow[config.outputColumn] = 'ERROR';
				return newRow;
			}

			if (month < 1 || month > 12) {
				newRow[config.outputColumn] = 'ERROR';
				return newRow;
			}

			if (day < 1 || day > 31) {
				newRow[config.outputColumn] = 'ERROR';
				return newRow;
			}

			// Tạo Date object (month is 0-indexed in JS)
			const date = new Date(year, month - 1, day);

			// Kiểm tra validity (tránh ngày như 31/2)
			if (date.getFullYear() !== year ||
				date.getMonth() !== month - 1 ||
				date.getDate() !== day) {
				newRow[config.outputColumn] = 'ERROR';
				return newRow;
			}

			// Format theo yêu cầu
			let formattedDate = '';
			switch (config.dateFormat) {
				case 'YYYY-MM-DD':
					formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
					break;
				case 'DD/MM/YYYY':
					formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
					break;
				case 'MM/DD/YYYY':
					formattedDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
					break;
				case 'YYYY/MM/DD':
					formattedDate = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
					break;
				case 'DD-MM-YYYY':
					formattedDate = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
					break;
				case 'ISO':
					formattedDate = date.toISOString();
					break;
				default:
					formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			}

			newRow[config.outputColumn] = formattedDate;

		} catch (error) {
			console.error('Lỗi khi chuyển đổi ngày:', error);
			newRow[config.outputColumn] = 'ERROR';
		}

		return newRow;
	});
};
// Hàm xử lý Value to Time (hỗ trợ nhiều cột)
export const processValueToTime = (data, config) => {
	// Chuẩn hóa danh sách mapping: ưu tiên config.mappings, fallback sang column/outputColumn đơn
	const mappings = Array.isArray(config.mappings) && config.mappings.length > 0
		? config.mappings.filter(m => m && m.column && m.outputColumn)
		: (config.column && config.outputColumn ? [{ column: config.column, outputColumn: config.outputColumn }] : []);

	if (mappings.length === 0) {
		return data;
	}

	const formatTimestamp = (timestamp, fmt) => {
		let formattedTime = '';
		switch (fmt) {
			case 'YYYY-MM-DD HH:mm:ss':
				return timestamp.toISOString().slice(0, 19).replace('T', ' ');
			case 'DD/MM/YYYY HH:mm:ss': {
				const day = String(timestamp.getDate()).padStart(2, '0');
				const month = String(timestamp.getMonth() + 1).padStart(2, '0');
				const year = timestamp.getFullYear();
				const hours = String(timestamp.getHours()).padStart(2, '0');
				const minutes = String(timestamp.getMinutes()).padStart(2, '0');
				const seconds = String(timestamp.getSeconds()).padStart(2, '0');
				formattedTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
				break;
			}
			case 'MM/DD/YYYY HH:mm:ss': {
				const m = String(timestamp.getMonth() + 1).padStart(2, '0');
				const d = String(timestamp.getDate()).padStart(2, '0');
				const y = timestamp.getFullYear();
				const h = String(timestamp.getHours()).padStart(2, '0');
				const min = String(timestamp.getMinutes()).padStart(2, '0');
				const sec = String(timestamp.getSeconds()).padStart(2, '0');
				formattedTime = `${m}/${d}/${y} ${h}:${min}:${sec}`;
				break;
			}
			case 'YYYY-MM-DD':
				return timestamp.toISOString().slice(0, 10);
			case 'DD/MM/YYYY': {
				const dayOnly = String(timestamp.getDate()).padStart(2, '0');
				const monthOnly = String(timestamp.getMonth() + 1).padStart(2, '0');
				const yearOnly = timestamp.getFullYear();
				formattedTime = `${dayOnly}/${monthOnly}/${yearOnly}`;
				break;
			}
			case 'MM/DD/YYYY': {
				const monthOnly2 = String(timestamp.getMonth() + 1).padStart(2, '0');
				const dayOnly2 = String(timestamp.getDate()).padStart(2, '0');
				const yearOnly2 = timestamp.getFullYear();
				formattedTime = `${monthOnly2}/${dayOnly2}/${yearOnly2}`;
				break;
			}
			case 'ISO':
				return timestamp.toISOString();
			case 'Unix':
				return Math.floor(timestamp.getTime() / 1000).toString();
			case 'HH:mm:ss': {
				const hrs = String(timestamp.getHours()).padStart(2, '0');
				const mins = String(timestamp.getMinutes()).padStart(2, '0');
				const secs = String(timestamp.getSeconds()).padStart(2, '0');
				formattedTime = `${hrs}:${mins}:${secs}`;
				break;
			}
			default:
				return timestamp.toISOString();
		}
		return formattedTime;
	};

	const convertNumericToDate = (numericValue) => {
		let timestamp;
		if (numericValue > 1000 && numericValue < 1000000) {
			const excelEpoch = new Date(1900, 0, 1);
			const millisecondsPerDay = 24 * 60 * 60 * 1000;
			let adjustedValue = numericValue;
			if (numericValue >= 3) {
				adjustedValue = numericValue - 1;
			}
			if (Number.isInteger(numericValue)) {
				const dateOnly = new Date(excelEpoch.getTime() + (adjustedValue - 1) * millisecondsPerDay);
				timestamp = new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate());
			} else {
				timestamp = new Date(excelEpoch.getTime() + (adjustedValue - 1) * millisecondsPerDay);
			}
		} else if (numericValue < 1) {
			const millisecondsPerDay = 24 * 60 * 60 * 1000;
			const today = new Date();
			const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			timestamp = new Date(startOfDay.getTime() + numericValue * millisecondsPerDay);
		} else if (numericValue > 1000000) {
			timestamp = new Date(numericValue);
		} else {
			timestamp = new Date(numericValue * 1000);
		}
		return timestamp;
	};

	return data.map(row => {
		const newRow = { ...row };

		try {
			mappings.forEach(mp => {
				const value = row[mp.column];
				if (value === null || value === undefined || value === '') {
					newRow[mp.outputColumn] = 'ERROR';
					return;
				}
				const numericValue = parseFloat(value);
				if (isNaN(numericValue)) {
					newRow[mp.outputColumn] = 'ERROR';
					return;
				}
				const timestamp = convertNumericToDate(numericValue);
				if (!timestamp || isNaN(timestamp.getTime())) {
					newRow[mp.outputColumn] = 'ERROR';
					return;
				}
				const fmt = mp.timeFormat || config.timeFormat || 'YYYY-MM-DD';
				newRow[mp.outputColumn] = formatTimestamp(timestamp, fmt);
			});
		} catch (error) {
			console.error('Lỗi khi chuyển đổi value to time:', error);
			// Nếu lỗi tổng quát, đánh dấu các outputColumn tương ứng
			mappings.forEach(mp => {
				if (mp.outputColumn) newRow[mp.outputColumn] = 'ERROR';
			});
		}

		return newRow;
	});
};
// Hàm xử lý Date Operation
export const processDateOperation = (data, config) => {
	if (!config.newColumnName) {
		return data;
	}

	const formatDate = (date, format) => {
		if (!date || isNaN(date.getTime())) return '';

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		switch (format) {
			case 'YYYY-MM-DD':
				return `${year}-${month}-${day}`;
			case 'DD/MM/YYYY':
				return `${day}/${month}/${year}`;
			case 'MM/DD/YYYY':
				return `${month}/${day}/${year}`;
			case 'YYYY-MM-DD HH:mm:ss':
				return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
			case 'DD/MM/YYYY HH:mm':
				return `${day}/${month}/${year} ${hours}:${minutes}`;
			default:
				return `${year}-${month}-${day}`;
		}
	};

	const parseDate = (dateValue) => {
		if (!dateValue) return null;

		// Thử parse các định dạng ngày phổ biến
		if (dateValue instanceof Date) return dateValue;

		const dateStr = String(dateValue).trim();

		// ISO format: YYYY-MM-DD
		if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
			return new Date(dateStr);
		}

		// DD/MM/YYYY - sửa regex để phân biệt với MM/DD/YYYY
		if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
			const parts = dateStr.split('/');
			// Kiểm tra logic: nếu phần đầu > 12 thì có thể là DD/MM/YYYY
			if (parseInt(parts[0]) > 12) {
				const [day, month, year] = parts;
				return new Date(year, month - 1, day);
			} else {
				// Nếu không thể xác định, giả định là DD/MM/YYYY
				const [day, month, year] = parts;
				return new Date(year, month - 1, day);
			}
		}

		// MM/DD/YYYY - chỉ áp dụng khi có thể xác định chắc chắn
		if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
			const parts = dateStr.split('/');
			// Chỉ áp dụng MM/DD/YYYY khi phần đầu <= 12
			if (parseInt(parts[0]) <= 12) {
				const [month, day, year] = parts;
				return new Date(year, month - 1, day);
			}
		}

		// Timestamp
		const timestamp = parseFloat(dateStr);
		if (!isNaN(timestamp)) {
			return new Date(timestamp);
		}

		// Thử parse với Date constructor trực tiếp
		try {
			const parsedDate = new Date(dateStr);
			if (!isNaN(parsedDate.getTime())) {
				return parsedDate;
			}
		} catch (e) {
			// Bỏ qua lỗi
		}

		return null;
	};

	const addSubtractDate = (baseDate, operations, rowData) => {
		if (!baseDate || !operations || !Array.isArray(operations)) {
			return baseDate;
		}

		let resultDate = new Date(baseDate);

		operations.forEach(operation => {
			if (!operation || !operation.unit) return;

			let value = 0;
			if (operation.sourceColumn && rowData) {
				// Lấy giá trị từ cột nguồn
				const sourceValue = rowData[operation.sourceColumn];
				value = parseFloat(sourceValue) || 0;
			} else {
				// Sử dụng giá trị cố định
				value = parseFloat(operation.value) || 0;
			}

			if (isNaN(value) || value === 0) return;

			const multiplier = operation.type === 'subtract' ? -1 : 1;
			const adjustedValue = value * multiplier;

			switch (operation.unit) {
				case 'days':
					resultDate.setDate(resultDate.getDate() + adjustedValue);
					break;
				case 'months':
					resultDate.setMonth(resultDate.getMonth() + adjustedValue);
					break;
				case 'years':
					resultDate.setFullYear(resultDate.getFullYear() + adjustedValue);
					break;
			}
		});

		return resultDate;
	};

	const findNearestDate = (targetDate, referenceDates, lookupType, maxDays = 365) => {
		if (!targetDate || !referenceDates || referenceDates.length === 0) {
			console.log('findNearestDate: Missing data', { targetDate, referenceDatesCount: referenceDates.length });
			return null;
		}

		const targetTime = targetDate.getTime();
		let nearestDate = null;
		let minDifference = Infinity;

		console.log(`findNearestDate: Looking for ${lookupType} date, target: ${targetDate.toISOString()}, maxDays: ${maxDays}`);

		referenceDates.forEach((refDate, index) => {
			if (!refDate) {
				console.log(`findNearestDate: Skipping null reference date at index ${index}`);
				return;
			}

			const refTime = refDate.getTime();
			const difference = Math.abs(refTime - targetTime);
			const daysDifference = difference / (1000 * 60 * 60 * 24);

			// Kiểm tra giới hạn số ngày
			if (daysDifference > maxDays) {
				console.log(`findNearestDate: Skipping date ${refDate.toISOString()} - too far (${daysDifference.toFixed(1)} days)`);
				return;
			}

			let isValid = false;
			switch (lookupType) {
				case 'nearest_past':
					// Tìm ngày gần nhất TRƯỚC target date (không bao gồm chính nó)
					isValid = refTime < targetTime;
					break;
				case 'nearest_future':
					// Tìm ngày gần nhất SAU target date (không bao gồm chính nó)
					isValid = refTime > targetTime;
					break;
				case 'nearest_absolute':
					isValid = true;
					break;
			}

			console.log(`findNearestDate: Checking ${refDate.toISOString()}, isValid: ${isValid}, difference: ${daysDifference.toFixed(1)} days`);

			if (isValid && difference < minDifference) {
				minDifference = difference;
				nearestDate = refDate;
				console.log(`findNearestDate: New nearest date found: ${refDate.toISOString()}`);
			}
		});

		console.log(`findNearestDate: Final result: ${nearestDate ? nearestDate.toISOString() : 'null'}`);
		return nearestDate;
	};

	return data.map((row, rowIndex) => {
		const newRow = { ...row };

		try {
			if (config.operationType === 'add_subtract') {
				// Xử lý cộng/trừ ngày
				const sourceDate = parseDate(row[config.sourceDateColumn]);
				if (!sourceDate) {
					newRow[config.newColumnName] = config.defaultValue || 'ERROR';
					return newRow;
				}

				const resultDate = addSubtractDate(sourceDate, config.operations, row);
				if (resultDate) {
					newRow[config.newColumnName] = formatDate(resultDate, config.outputFormat || 'YYYY-MM-DD');
				} else {
					newRow[config.newColumnName] = config.defaultValue || 'ERROR';
				}

			} else if (config.operationType === 'lookup_nearest') {
				// Xử lý tìm ngày gần nhất
				console.log(`Row ${rowIndex}: Processing lookup_nearest`);
				console.log(`Row ${rowIndex}: Target column: ${config.targetDateColumn}, value: ${row[config.targetDateColumn]}`);
				console.log(`Row ${rowIndex}: Reference column: ${config.referenceDateColumn}`);
				console.log(`Row ${rowIndex}: Lookup type: ${config.lookupType}`);

				const targetDate = parseDate(row[config.targetDateColumn]);
				if (!targetDate) {
					console.log(`Row ${rowIndex}: Failed to parse target date: ${row[config.targetDateColumn]}`);
					newRow[config.newColumnName] = config.defaultValue || 'ERROR';
					return newRow;
				}

				console.log(`Row ${rowIndex}: Parsed target date: ${targetDate.toISOString()}`);

				// Lấy tất cả ngày tham chiếu từ dữ liệu
				const referenceDates = data
					.map((r, idx) => {
						const parsed = parseDate(r[config.referenceDateColumn]);
						if (!parsed) {
							console.log(`Row ${rowIndex}: Failed to parse reference date at index ${idx}: ${r[config.referenceDateColumn]}`);
						}
						return parsed;
					})
					.filter(d => d !== null);

				console.log(`Row ${rowIndex}: Found ${referenceDates.length} valid reference dates`);

				if (referenceDates.length === 0) {
					console.log(`Row ${rowIndex}: No valid reference dates found`);
					newRow[config.newColumnName] = config.defaultValue || '';
					return newRow;
				}

				const nearestDate = findNearestDate(
					targetDate,
					referenceDates,
					config.lookupType || 'nearest_past',
					config.maxDaysLookup || 365,
				);

				if (nearestDate) {
					const formattedDate = formatDate(nearestDate, config.outputFormat || 'YYYY-MM-DD');
					console.log(`Row ${rowIndex}: Found nearest date: ${nearestDate.toISOString()} -> ${formattedDate}`);
					newRow[config.newColumnName] = formattedDate;
				} else {
					console.log(`Row ${rowIndex}: No nearest date found`);
					newRow[config.newColumnName] = config.defaultValue || '';
				}
			}
		} catch (error) {
			console.error(`Row ${rowIndex}: Lỗi khi xử lý date operation:`, error);
			newRow[config.newColumnName] = config.defaultValue || 'ERROR';
		}

		return newRow;
	});
};
// Hàm xử lý Aggregate
export const processAggregate = (data, config) => {
	console.log('=== processAggregate called ===');
	console.log('Input data:', {
		dataLength: data.length,
		sampleRow: data[0],
		config: config
	});

	// Kiểm tra groupBy có thể là string hoặc array
	const groupByIsValid = config.groupBy && (
		(Array.isArray(config.groupBy) && config.groupBy.length > 0) ||
		(typeof config.groupBy === 'string' && config.groupBy !== '')
	);

	if (!groupByIsValid || !config.aggregations || config.aggregations.length === 0) {
		console.log('Invalid config, returning original data:', {
			groupByIsValid,
			aggregationsLength: config.aggregations?.length
		});
		return data;
	}

	try {
		// Hàm tạo key cho nhóm dữ liệu (hỗ trợ nhiều cột)
		const createGroupKey = (row) => {
			if (Array.isArray(config.groupBy)) {
				return config.groupBy.map(col => row[col]).join('|');
			}
			return row[config.groupBy];
		};

		// Nhóm dữ liệu theo nhiều cột
		const groupedData = _.groupBy(data, createGroupKey);

		// Xử lý từng nhóm
		const aggregatedData = Object.keys(groupedData).map(groupKey => {
			const groupRows = groupedData[groupKey];

			// Tạo object chứa các cột nhóm
			const aggregatedRow = {};
			if (Array.isArray(config.groupBy)) {
				// Nếu nhóm theo nhiều cột, tách key và gán vào từng cột
				const groupValues = groupKey.split('|');
				config.groupBy.forEach((col, index) => {
					aggregatedRow[col] = groupValues[index] || '';
				});
			} else if (typeof config.groupBy === 'string') {
				// Nếu nhóm theo một cột
				aggregatedRow[config.groupBy] = groupKey;
			}

			// Xử lý từng aggregation
			console.log('Processing aggregations for group:', groupKey, {
				groupRows: groupRows.length,
				sampleGroupRow: groupRows[0]
			});
			
			config.aggregations.forEach((agg, index) => {
				console.log(`Processing aggregation ${index + 1}:`, agg);
				
				if (!agg.column || !agg.function) {
					console.log(`Skipping aggregation ${index + 1}: missing column or function`);
					return;
				}

				const columnName = agg.alias || `${agg.function}_${agg.column}`;
				console.log(`Creating column: ${columnName}`);
				let result;

				switch (agg.function) {
					case 'sum':
						result = _.sumBy(groupRows, row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? 0 : value;
						});
						break;
					case 'count':
						result = groupRows.length;
						break;
					case 'avg':
						const sum = _.sumBy(groupRows, row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? 0 : value;
						});
						result = groupRows.length > 0 ? sum / groupRows.length : 0;
						break;
					case 'min':
						result = _.minBy(groupRows, row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? Infinity : value;
						});
						result = result ? parseFloat(result[agg.column]) : null;
						break;
					case 'max':
						result = _.maxBy(groupRows, row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? -Infinity : value;
						});
						result = result ? parseFloat(result[agg.column]) : null;
						break;
					case 'std':
						const values = groupRows.map(row => {
							const value = parseFloat(row[agg.column]);
							return isNaN(value) ? 0 : value;
						});
						if (values.length > 1) {
							const mean = _.mean(values);
							const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
							result = Math.sqrt(_.sum(squaredDiffs) / (values.length - 1));
						} else {
							result = 0;
						}
						break;
					case 'distinct_count':
						const distinctValues = _.uniq(groupRows.map(row => row[agg.column]));
						result = distinctValues.length;
						break;
					default:
						result = null;
				}

				aggregatedRow[columnName] = result;
				console.log(`Added column ${columnName} with value:`, result);
			});

			console.log('Final aggregated row:', aggregatedRow);
			return aggregatedRow;
		});

		console.log('Final aggregated data:', {
			resultLength: aggregatedData.length,
			sampleResult: aggregatedData[0],
			resultColumns: aggregatedData.length > 0 ? Object.keys(aggregatedData[0]) : []
		});
		return aggregatedData;
	} catch (error) {
		console.error('Lỗi khi xử lý Aggregate:', error);
		return data;
	}
};
// Hàm xử lý Column Filter
export const processColumnFilter = (data, config, inputSchemaColumns = null) => {
	// Kiểm tra config hợp lệ
	if (!config.selectedColumns || config.selectedColumns.length === 0) {
		console.warn('Column Filter: Không có cột nào được chọn');
		return data;
	}

	if (!data || data.length === 0) {
		console.warn('Column Filter: Không có dữ liệu để xử lý');
		return data;
	}

	try {
		// Xác định các cột có sẵn - ưu tiên sử dụng inputSchemaColumns từ bước trước
		let availableColumns;
		if (inputSchemaColumns && inputSchemaColumns.length > 0) {
			// Sử dụng schema từ bước trước làm nguồn chính
			availableColumns = inputSchemaColumns.map(col => typeof col === 'string' ? col : col.name);
		} else {
			// Fallback: sử dụng Object.keys(data[0]) như cũ
			availableColumns = Object.keys(data[0]);
		}
		

		// Lọc các cột được chọn (chỉ giữ các cột thực sự tồn tại)
		const validSelectedColumns = config.selectedColumns.filter(col => availableColumns.includes(col));
		

		if (validSelectedColumns.length === 0) {
			console.warn('Column Filter: Không có cột hợp lệ nào được chọn');
			return data;
		}

		// Xác định các cột kết quả dựa trên filterMode
		let resultColumns = [];

		if (config.filterMode === 'exclude') {
			// Loại bỏ các cột đã chọn - giữ lại các cột không được chọn
			resultColumns = availableColumns.filter(col => !validSelectedColumns.includes(col));
		} else {
			// Chỉ giữ lại các cột đã chọn
			resultColumns = validSelectedColumns;
		}

		// Nếu không có cột nào còn lại, trả về mảng rỗng
		if (resultColumns.length === 0) {
			console.warn('Column Filter: Không có cột nào được giữ lại sau khi lọc');
			return [];
		}

		// Tạo dữ liệu mới chỉ với các cột được chọn
		let filteredData = data.map(row => {
			const newRow = {};
			resultColumns.forEach(col => {
				newRow[col] = row[col];
			});
			return newRow;
		});

		// Xử lý Top Filter nếu được bật
		if (config.enableTopFilter && config.topColumn && config.topCount) {
			// Kiểm tra xem cột sắp xếp có tồn tại trong dữ liệu không
			const sortColumn = config.topColumn;
			if (!availableColumns.includes(sortColumn)) {
				console.warn(`Column Filter: Cột sắp xếp "${sortColumn}" không tồn tại trong dữ liệu`);
			} else {
				// Sắp xếp dữ liệu theo cột đã chọn
				const sortedData = [...filteredData].sort((a, b) => {
					const aValue = a[sortColumn];
					const bValue = b[sortColumn];

					// Xử lý giá trị null/undefined
					if (aValue === null || aValue === undefined) return 1;
					if (bValue === null || bValue === undefined) return -1;

					// Kiểm tra kiểu dữ liệu và so sánh
					const aNum = parseFloat(aValue);
					const bNum = parseFloat(bValue);

					if (!isNaN(aNum) && !isNaN(bNum)) {
						// So sánh số
						return config.topOrder === 'desc' ? bNum - aNum : aNum - bNum;
					} else {
						// So sánh chuỗi
						const aStr = String(aValue).toLowerCase();
						const bStr = String(bValue).toLowerCase();
						if (config.topOrder === 'desc') {
							return bStr.localeCompare(aStr);
						} else {
							return aStr.localeCompare(bStr);
						}
					}
				});

				// Lấy top N bản ghi
				const topCount = Math.min(config.topCount, sortedData.length);
				filteredData = sortedData.slice(0, topCount);
			}
		}

		// Cập nhật outputColumns dựa trên kết quả lọc
		config.outputColumns = resultColumns.map(colName => ({
			name: colName,
			type: 'text' // Mặc định là text, có thể cải thiện sau
		}));


		return filteredData;
	} catch (error) {
		console.error('Lỗi khi xử lý Column Filter:', error);
		return data;
	}
};
// Hàm xử lý Xoay bảng (Unpivot)
export const processPivotTable = (data, config) => {
	if (!config.identifierColumns || config.identifierColumns.length === 0 ||
		!config.pivotColumns || config.pivotColumns.length === 0) {
		return data;
	}

	const result = [];

	// Duyệt qua từng hàng dữ liệu
	for (const row of data) {
		// Tạo dữ liệu định danh (giữ nguyên)
		const identifierData = {};
		config.identifierColumns.forEach(col => {
			identifierData[col] = row[col];
		});

		// Tạo hàng mới cho mỗi cột cần xoay
		config.pivotColumns.forEach(pivotCol => {
			const newRow = {
				...identifierData,
				[config.itemColumnName]: pivotCol,
				[config.valueColumnName]: row[pivotCol],
			};
			result.push(newRow);
		});
	}

	return result;
};
// Hàm xử lý Xoay bảng từ hàng thành cột (Reverse Pivot)
export const processReversePivotTable = (data, config) => {
	if (!data || data.length === 0) {
		return data;
	}

	// Nếu không có identifierColumns, tự động xác định các cột không phải pivot
	if (!config.identifierColumns || config.identifierColumns.length === 0) {
		// Lấy tất cả các cột từ dữ liệu
		const allColumns = Object.keys(data[0] || {});

		// Loại bỏ các cột pivot và cột itemColumnName, valueColumnName
		const excludedColumns = [
			...(config.pivotColumns || []),
			config.itemColumnName,
			config.valueColumnName,
		];

		// Các cột còn lại sẽ làm identifier
		config.identifierColumns = allColumns.filter(col => !excludedColumns.includes(col));
	}

	// Nếu vẫn không có identifierColumns, sử dụng tất cả cột trừ pivot
	if (!config.identifierColumns || config.identifierColumns.length === 0) {
		const allColumns = Object.keys(data[0] || {});
		config.identifierColumns = allColumns.filter(col => !(config.pivotColumns || []).includes(col));
	}

	// Tạo map để nhóm dữ liệu theo identifier
	const groupedData = new Map();

	// Duyệt qua từng hàng dữ liệu
	for (const row of data) {
		// Tạo key từ các cột định danh
		const identifierKey = config.identifierColumns.map(col => row[col]).join('|');

		if (!groupedData.has(identifierKey)) {
			// Khởi tạo object mới cho identifier này
			const newRow = {};
			config.identifierColumns.forEach(col => {
				newRow[col] = row[col];
			});
			groupedData.set(identifierKey, newRow);
		}

		// Lấy object hiện tại
		const currentRow = groupedData.get(identifierKey);

		// Lấy giá trị từ cột pivot để làm tên cột mới
		const rawPivotValue = config?.itemColumnName
			? row[config.itemColumnName]
			: (Array.isArray(config?.pivotColumns) && config.pivotColumns.length > 0
				? row[config.pivotColumns[0]]
				: undefined);
		const pivotValue = rawPivotValue !== undefined && rawPivotValue !== null ? String(rawPivotValue) : undefined;
		const valueValue = row[config.valueColumnName];

		if (pivotValue !== undefined && valueValue !== undefined) {
			// Tạo cột mới với tên là giá trị từ cột pivot
			currentRow[pivotValue] = valueValue;
		}
	}

	// Chuyển Map thành Array
	return Array.from(groupedData.values());
};
// Hàm xử lý Nối bảng (Join Table)
export const processJoinTable = async (data, config, templateData, getTemplateRow) => {


	if (!data || data.length === 0) {
		console.warn('Source data is empty');
		message.warning('Dữ liệu nguồn trống. Vui lòng kiểm tra step trước đó.');
		return data;
	}

	// Kiểm tra cấu hình join columns
	if (!config.joinColumns || !Array.isArray(config.joinColumns) || config.joinColumns.length === 0) {

		return data;
	}

	// Kiểm tra ít nhất một cặp cột join hợp lệ
	const validJoinColumns = config.joinColumns.filter(col => col.sourceColumn && col.targetColumn);
	if (validJoinColumns.length === 0) {

		return data;
	}

	if (!config.targetTable || !config.targetVersion) {

		return data;
	}

	try {
		// Lấy dữ liệu từ bảng đích
		const targetTableId = parseInt(config.targetTable);

		// Lấy dữ liệu từ bảng đích theo cách tương tự như ShowData.jsx
		// Nếu targetVersion là 1, lấy dữ liệu gốc (null stepId)
		// Nếu targetVersion khác, lấy dữ liệu từ step đó
		const targetStepId = config.targetVersion === 1 ? null : config.targetVersion;
		const targetDataResponse = await getTemplateRow(targetTableId, targetStepId, false);
		const targetData = targetDataResponse.rows.map(item => item.data);

		if (!targetData || targetData.length === 0) {
			console.warn('Không có dữ liệu từ bảng đích');
			console.warn('Target table ID:', targetTableId, 'Target version:', config.targetVersion, 'Target stepId:', targetStepId);
			message.warning(`Không tìm thấy dữ liệu cho bảng ${targetTableId} version ${config.targetVersion}. Vui lòng kiểm tra lại cấu hình.`);
			return data;
		}

		// Kiểm tra xem tất cả cột nguồn có tồn tại trong dữ liệu không
		for (const joinCol of validJoinColumns) {
			if (data.length > 0 && !data[0].hasOwnProperty(joinCol.sourceColumn)) {
				message.warning(`Cột nguồn "${joinCol.sourceColumn}" không tồn tại trong dữ liệu.`);
				return data;
			}
		}

		// Kiểm tra xem tất cả cột đích có tồn tại trong dữ liệu đích không
		for (const joinCol of validJoinColumns) {
			if (targetData.length > 0 && !targetData[0].hasOwnProperty(joinCol.targetColumn)) {
				message.warning(`Cột đích "${joinCol.targetColumn}" không tồn tại trong bảng đích.`);
				return data;
			}
		}

		// Tạo map từ dữ liệu đích để tối ưu hiệu suất
		// Sử dụng composite key cho nhiều cột join
		const targetMap = new Map();
		targetData.forEach(row => {
			// Tạo composite key từ tất cả các cột join
			const compositeKey = validJoinColumns.map(joinCol => {
				const value = row[joinCol.targetColumn];
				return value !== null && value !== undefined ? String(value).trim() : '';
			}).join('|');

			if (compositeKey && !compositeKey.includes('||')) { // Đảm bảo không có giá trị rỗng
				targetMap.set(compositeKey, row);
			}
		});


		const result = [];

		// Thực hiện join dựa trên loại join
		switch (config.joinType) {
			case 'inner':
				// Inner join: chỉ giữ các hàng khớp

				data.forEach((sourceRow, index) => {
					// Tạo composite key từ tất cả các cột join
					const compositeSourceKey = validJoinColumns.map(joinCol => {
						const value = sourceRow[joinCol.sourceColumn];
						return value !== null && value !== undefined ? String(value).trim() : '';
					}).join('|');

					const targetRow = targetMap.get(compositeSourceKey);

					if (targetRow) {
						// Kết hợp dữ liệu từ cả hai bảng
						const joinedRow = { ...sourceRow };
						Object.keys(targetRow).forEach(key => {
							// Tránh trùng lặp cột join
							const isJoinColumn = validJoinColumns.some(joinCol => joinCol.targetColumn === key);
							if (!isJoinColumn && key !== 'rowId') {
								joinedRow[`${key}(Bảng nối)`] = targetRow[key];
							}
						});
						result.push(joinedRow);
					}
				});
				break;

			case 'left':
				// Left join: giữ tất cả hàng từ bảng nguồn

				data.forEach((sourceRow, index) => {
					// Tạo composite key từ tất cả các cột join
					const compositeSourceKey = validJoinColumns.map(joinCol => {
						const value = sourceRow[joinCol.sourceColumn];
						return value !== null && value !== undefined ? String(value).trim() : '';
					}).join('|');

					const targetRow = targetMap.get(compositeSourceKey);
					const joinedRow = { ...sourceRow };

					if (targetRow) {
						Object.keys(targetRow).forEach(key => {
							// Tránh trùng lặp cột join
							const isJoinColumn = validJoinColumns.some(joinCol => joinCol.targetColumn === key);
							if (!isJoinColumn) {
								joinedRow[`${key}(Bảng nối)`] = targetRow[key];
							}
						});
					} else {
						// Thêm null cho các cột từ bảng đích
						Object.keys(targetData[0] || {}).forEach(key => {
							// Tránh trùng lặp cột join
							const isJoinColumn = validJoinColumns.some(joinCol => joinCol.targetColumn === key);
							if (!isJoinColumn) {
								joinedRow[`${key}(Bảng nối)`] = null;
							}
						});
					}
					result.push(joinedRow);
				});
				break;

			case 'right':
				// Right join: giữ tất cả hàng từ bảng đích
				const sourceMap = new Map();
				data.forEach(row => {
					// Tạo composite key từ tất cả các cột join
					const compositeKey = validJoinColumns.map(joinCol => {
						const value = row[joinCol.sourceColumn];
						return value !== null && value !== undefined ? String(value).trim() : '';
					}).join('|');

					if (compositeKey && !compositeKey.includes('||')) {
						sourceMap.set(compositeKey, row);
					}
				});

				targetData.forEach(targetRow => {
					// Tạo composite key từ tất cả các cột join
					const compositeTargetKey = validJoinColumns.map(joinCol => {
						const value = targetRow[joinCol.targetColumn];
						return value !== null && value !== undefined ? String(value).trim() : '';
					}).join('|');

					const sourceRow = sourceMap.get(compositeTargetKey);
					const joinedRow = { ...targetRow };

					if (sourceRow) {
						Object.keys(sourceRow).forEach(key => {
							// Tránh trùng lặp cột join
							const isJoinColumn = validJoinColumns.some(joinCol => joinCol.sourceColumn === key);
							if (!isJoinColumn) {
								joinedRow[`${key}(Bảng nguồn)`] = sourceRow[key];
							}
						});
					} else {
						// Thêm null cho các cột từ bảng nguồn
						Object.keys(data[0] || {}).forEach(key => {
							// Tránh trùng lặp cột join
							const isJoinColumn = validJoinColumns.some(joinCol => joinCol.sourceColumn === key);
							if (!isJoinColumn) {
								joinedRow[`${key}(Bảng nguồn)`] = null;
							}
						});
					}
					result.push(joinedRow);
				});
				break;

			case 'outer':
				// Full outer join: giữ tất cả hàng từ cả hai bảng
				const sourceKeys = new Set();
				const targetKeys = new Set();

				// Xử lý tất cả hàng từ bảng nguồn
				data.forEach(sourceRow => {
					// Tạo composite key từ tất cả các cột join
					const compositeSourceKey = validJoinColumns.map(joinCol => {
						const value = sourceRow[joinCol.sourceColumn];
						return value !== null && value !== undefined ? String(value).trim() : '';
					}).join('|');

					sourceKeys.add(compositeSourceKey);
					const targetRow = targetMap.get(compositeSourceKey);
					const joinedRow = { ...sourceRow };

					if (targetRow) {
						Object.keys(targetRow).forEach(key => {
							// Tránh trùng lặp cột join
							const isJoinColumn = validJoinColumns.some(joinCol => joinCol.targetColumn === key);
							if (!isJoinColumn) {
								joinedRow[`${key}(Bảng nối)`] = targetRow[key];
							}
						});
					} else {
						Object.keys(targetData[0] || {}).forEach(key => {
							// Tránh trùng lặp cột join
							const isJoinColumn = validJoinColumns.some(joinCol => joinCol.targetColumn === key);
							if (!isJoinColumn) {
								joinedRow[`${key}(Bảng nối)`] = null;
							}
						});
					}
					result.push(joinedRow);
				});

				// Xử lý các hàng từ bảng đích chưa được xử lý
				targetData.forEach(targetRow => {
					// Tạo composite key từ tất cả các cột join
					const compositeTargetKey = validJoinColumns.map(joinCol => {
						const value = targetRow[joinCol.targetColumn];
						return value !== null && value !== undefined ? String(value).trim() : '';
					}).join('|');

					if (!sourceKeys.has(compositeTargetKey)) {
						const joinedRow = { ...targetRow };
						Object.keys(data[0] || {}).forEach(key => {
							// Tránh trùng lặp cột join
							const isJoinColumn = validJoinColumns.some(joinCol => joinCol.sourceColumn === key);
							if (!isJoinColumn) {
								joinedRow[`${key}(Bảng nguồn)`] = null;
							}
						});
						result.push(joinedRow);
					}
				});
				break;

			default:
				return data;
		}

		return result;
	} catch (error) {
		console.error('Lỗi khi xử lý join table:', error);
		return data;
	}
};

// Ghép (append) dữ liệu từ nhiều bảng/phiên bản ở phía FE (chỉ dùng preview/test nội bộ nếu cần)
// Backend đã xử lý chính, hàm này để giữ parity hoặc test nhanh trên FE
export const processUnionTables = async (data, config, templateData, getTemplateRow) => {
    try {
        const sources = Array.isArray(config?.sources) ? config.sources : [];
        const includeInput = !!config?.includeInput;
        let result = [];
        if (includeInput && Array.isArray(data)) {
            result = result.concat(data);
        }
        // Nếu có thể gọi getTemplateRow từ FE, nối thêm
        if (typeof getTemplateRow === 'function') {
            for (const src of sources) {
                if (!src || !src.tableId) continue;
                const version = (src.version === undefined) ? null : src.version;
                try {
                    const resp = await getTemplateRow(src.tableId, version, false);
                    const rows = Array.isArray(resp?.rows) ? resp.rows : [];
                    const normalized = rows.map(r => (r?.data ? { ...r.data, rowId: r?.id } : r));
                    result = result.concat(normalized);
                } catch (_) { /* ignore FE preview errors */ }
            }
        }
        return result;
    } catch (e) {
        return Array.isArray(data) ? data : [];
    }
};

// Lọc nhóm theo phân vị (Type 33)
export const processPercentileGroupFilter = (data, config) => {
    try {
        if (!Array.isArray(data) || data.length === 0) return data;
        const valueColumn = config?.valueColumn;
        const groupColumn = config?.groupColumn;
        const percentile = parseInt(config?.percentile || 80, 10);
        if (!valueColumn || !groupColumn) return data;

        // Áp dụng filter mẫu nếu có
        let sample = data;
        const conditions = Array.isArray(config?.sampleConditions) ? config.sampleConditions : [];
        if (conditions.length > 0) {
            sample = sample.filter(row => {
                try {
                    return conditions.every(cond => {
                        const v = row[cond.column];
                        const val = cond.value;
                        switch (cond.operator) {
                            case 'equals': return v == val;
                            case 'not_equals': return v != val;
                            case 'greater': return parseFloat(v) > parseFloat(val);
                            case 'greater_equal': return parseFloat(v) >= parseFloat(val);
                            case 'less': return parseFloat(v) < parseFloat(val);
                            case 'less_equal': return parseFloat(v) <= parseFloat(val);
                            case 'contains': return String(v).toLowerCase().includes(String(val).toLowerCase());
                            case 'starts_with': return String(v).toLowerCase().startsWith(String(val).toLowerCase());
                            case 'ends_with': return String(v).toLowerCase().endsWith(String(val).toLowerCase());
                            default: return true;
                        }
                    });
                } catch (_) { return false; }
            });
        }

        // Tính tổng theo nhóm trên tập mẫu
        const groupToSum = new Map();
        for (const row of sample) {
            const g = row[groupColumn];
            const num = parseFloat(row[valueColumn]);
            if (g === undefined || g === null) continue;
            if (isNaN(num)) continue;
            groupToSum.set(g, (groupToSum.get(g) || 0) + num);
        }
        const entries = Array.from(groupToSum.entries());
        if (entries.length === 0) return [];

        // Sắp xếp theo tổng giảm dần
        entries.sort((a, b) => b[1] - a[1]);

        // Lấy từ trên xuống tới ngưỡng percentile
        const total = entries.reduce((s, [, v]) => s + v, 0);
        const target = (Math.max(0, Math.min(100, percentile)) / 100) * total;
        const selectedGroups = new Set();
        let acc = 0;
        for (const [g, v] of entries) {
            if (acc >= target) break;
            selectedGroups.add(g);
            acc += v;
        }

        // Lọc dữ liệu đầu vào theo nhóm đã chọn
        return data.filter(row => selectedGroups.has(row[groupColumn]));
    } catch (e) {
        console.error('processPercentileGroupFilter error:', e);
        return data;
    }
};
// Hàm xử lý Smart Rule Fill
export const processSmartRuleFill = async (data, config) => {
	if (!(await checkTokenQuota())) return undefined;
	// Validate config
	if (!config.inputColumns || !config.outputColumn || !config.exampleIdentifier.column ||
		!config.exampleIdentifier.values || !config.outputRequirements) {
		return data;
	}

	try {

		// 1. Tách dữ liệu thành examples và data cần điền
		const examples = [];
		const dataNeedFill = [];

		data.forEach((row, rowIndex) => {
			const identifierValue = row[config.exampleIdentifier.column];
			const outputValue = row[config.outputColumn];


			// Kiểm tra xem có phải là example không
			if (config.exampleIdentifier.values.includes(identifierValue) &&
				outputValue && outputValue.trim() !== '') {
				// Lấy chỉ các cột cần thiết cho example
				const exampleRow = {};
				config.inputColumns.forEach(col => {
					exampleRow[col] = row[col];
				});
				exampleRow[config.outputColumn] = outputValue;
				examples.push(exampleRow);
			} else if (!config.exampleIdentifier.values.includes(identifierValue)) {
				// Dữ liệu cần điền (không phải example)
				const needFillRow = {};
				config.inputColumns.forEach(col => {
					needFillRow[col] = row[col];
				});
				needFillRow[config.outputColumn] = '';
				dataNeedFill.push(needFillRow);
			}
		});

		// 2. Nếu không có examples hoặc data cần điền, return nguyên data
		if (examples.length === 0) {
			return data;
		}

		if (dataNeedFill.length === 0) {
			// Nếu createNewColumn = true, vẫn cần tạo cột mới với giá trị rỗng
			if (config.createNewColumn && config.newColumnName) {
				return data.map(row => ({
					...row,
					[config.newColumnName]: '',
				}));
			}
			return data;
		}

		// 3. Lọc examples để chỉ giữ tối đa 3 bản ghi cho mỗi pattern unique
		const filteredExamples = filterExamplesByPattern(examples, config.inputColumns, config.outputColumn);

		// 4. Tạo prompt cho AI
		const inputColumnsStr = config.inputColumns.join(', ');
		const outputColumnStr = config.outputColumn;

		const systemMessage = `Bạn là một chuyên gia phân tích dữ liệu. 
Nhiệm vụ: Học pattern từ examples và điền vào dữ liệu trống.

QUAN TRỌNG: Chỉ trả về JSON array với format sau:
[
  {"${outputColumnStr}": "giá_trị_điền_1"},
  {"${outputColumnStr}": "giá_trị_điền_2"},
  ...
]

Quy tắc:
- Học pattern từ examples để dự đoán output
- Tuân thủ requirements về output
- Trả về đúng thứ tự như data cần điền
- Chỉ trả về JSON array, không có text khác`;

		const prompt = `
Cột điều kiện: ${inputColumnsStr}
Cột cần điền: ${outputColumnStr}

Examples (đã có sẵn output) - tối đa 3 bản ghi cho mỗi pattern:
${JSON.stringify(filteredExamples, null, 2)}

Data cần điền (output trống):
${JSON.stringify(dataNeedFill, null, 2)}

Yêu cầu cho output: ${config.outputRequirements}

Hãy học pattern từ examples và điền vào data cần điền. Trả về JSON array đúng thứ tự.`;


		// 5. Gọi AI
		const aiResponse = await aiGen2(prompt, systemMessage, config.aiModel || 'gpt-5-mini-2025-08-07');
		await updateUsedTokenApp(aiResponse, config.aiModel || 'gpt-5-mini-2025-08-07');


		// 6. Parse kết quả AI
		let aiResults = [];
		try {
			let jsonString;
			if (typeof aiResponse === 'object' && aiResponse.generated) {
				jsonString = aiResponse.generated;
			} else if (typeof aiResponse === 'string') {
				jsonString = aiResponse;
			} else {
				jsonString = JSON.stringify(aiResponse);
			}

			// Nếu jsonString chứa ```json ... ``` thì cắt lấy phần {...} hoặc [...]
			if (typeof jsonString === 'string') {
				const match = jsonString.match(/```json([\s\S]*?)```/);
				if (match && match[1]) {
					jsonString = match[1].trim();
				} else {
					// Nếu không có ```json ... ```, thử tìm {...} hoặc [...]
					const braceMatch = jsonString.match(/\{[\s\S]*\}/);
					const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
					if (arrayMatch) {
						jsonString = arrayMatch[0];
					} else if (braceMatch) {
						jsonString = braceMatch[0];
					}
				}
			}

			// Parse JSON
			aiResults = JSON.parse(jsonString);

			if (!Array.isArray(aiResults) || aiResults.length !== dataNeedFill.length) {
				throw new Error(`Invalid AI response format: expected array of ${dataNeedFill.length} items, got ${Array.isArray(aiResults) ? aiResults.length : 'not array'}`);
			}

		} catch (parseError) {
			console.error('Smart Rule Fill - Parse error:', parseError);
			// Fallback: fill with default value
			aiResults = dataNeedFill.map(() => ({ [config.outputColumn]: 'AI_ERROR' }));
		}

		// 7. Áp dụng kết quả vào dữ liệu gốc
		let fillIndex = 0;
		const processedData = data.map(row => {
			const newRow = { ...row };
			const identifierValue = row[config.exampleIdentifier.column];

			// Nếu createNewColumn = true, khởi tạo cột mới cho tất cả dòng
			if (config.createNewColumn && config.newColumnName) {
				newRow[config.newColumnName] = '';
			}

			// Nếu là dòng cần điền (không phải example)
			if (!config.exampleIdentifier.values.includes(identifierValue)) {
				if (fillIndex < aiResults.length) {
					const targetColumn = config.createNewColumn ? config.newColumnName : config.outputColumn;
					const aiValue = aiResults[fillIndex][config.outputColumn] || 'AI_ERROR';
					newRow[targetColumn] = aiValue;
					fillIndex++;
				}
			} else {
				// Nếu là example và createNewColumn = true, copy giá trị từ cột gốc
				if (config.createNewColumn && config.newColumnName) {
					newRow[config.newColumnName] = row[config.outputColumn] || '';
				}
			}

			return newRow;
		});

		// Kiểm tra xem cột mới có được tạo không
		if (config.createNewColumn && config.newColumnName) {
			const hasNewColumn = processedData.every(row => row.hasOwnProperty(config.newColumnName));

			if (hasNewColumn) {
				const newColumnValues = processedData.map(row => row[config.newColumnName]);
			}
		}

		return processedData;

	} catch (error) {
		console.error('Smart Rule Fill - Error:', error);
		// Return original data nếu có lỗi
		return data;
	}
};

// Hàm lọc examples để chỉ giữ tối đa 3 bản ghi cho mỗi pattern unique
const filterExamplesByPattern = (examples, inputColumns, outputColumn) => {
	const patternMap = new Map();
	
	examples.forEach(example => {
		// Tạo key pattern từ các cột input
		const patternKey = inputColumns.map(col => example[col]).join('|');
		
		if (!patternMap.has(patternKey)) {
			patternMap.set(patternKey, []);
		}
		
		const patternExamples = patternMap.get(patternKey);
		// Chỉ giữ tối đa 3 examples cho mỗi pattern
		if (patternExamples.length < 3) {
			patternExamples.push(example);
		}
	});
	
	// Flatten tất cả examples đã lọc
	return Array.from(patternMap.values()).flat();
};

// Hàm test AI Formula với 10 dòng dữ liệu ngẫu nhiên
export const testAIFormula = async (data, config, aiGen2, updateUsedTokenApp) => {
	// Kiểm tra data có phải là array không
	if (!data || !Array.isArray(data) || data.length === 0) {
		return {
			success: false,
			error: 'Không có dữ liệu để test hoặc dữ liệu không hợp lệ',
			results: []
		};
	}

	// Debug: Log cấu trúc dữ liệu
	console.log('Test AI Formula - Input data structure:', data.slice(0, 2));

	// Lấy 10 dòng dữ liệu ngẫu nhiên
	const sampleSize = Math.min(10, data.length);
	const shuffled = [...data].sort(() => 0.5 - Math.random());
	const sampleData = shuffled.slice(0, sampleSize);
	
	// Debug: Log sample data
	console.log('Test AI Formula - Sample data structure:', sampleData.slice(0, 2));

	try {
		// Sử dụng cùng logic như processAIFormula
		const mentionedColumns = extractMentionedColumns(config.aiPrompt);
		console.log('Test AI Formula - Mentioned columns:', mentionedColumns);
		
		// Xác định tên cột kết quả (giống logic thực tế)
		const testResultColumn = config.createNewColumn ? config.newColumnName : config.targetColumn;
		
		// Tạo prompt cho AI (giống logic thực tế)
		const aiPrompt = buildAIFormulaPrompt(config.aiPrompt, mentionedColumns, sampleData, testResultColumn);
		
		console.log('Test AI Formula - Sending prompt to AI:', aiPrompt);

		// Gọi AI để tạo công thức (giống logic thực tế)
		const aiResponse = await aiGen2(aiPrompt, null, config.aiModel || 'gemini-2.5-flash');
		await updateUsedTokenApp(aiResponse, config.aiModel || 'gemini-2.5-flash');

		console.log('Test AI Formula - AI Response:', aiResponse);

		// Trích xuất công thức từ kết quả AI (giống logic thực tế)
		const formula = extractFormulaFromAIResult(aiResponse);

		if (!formula) {
			throw new Error('Không thể trích xuất công thức từ kết quả AI');
		}

		console.log('Test AI Formula - Extracted formula:', formula);

		// Sử dụng chính xác cùng logic với processAIFormula
		// Chỉ khác ở việc lọc dữ liệu đầu vào
		
		// Tạo bản sao của dữ liệu test và xử lý cấu trúc .data
		const testData = sampleData.map(row => {
			// Nếu row có cấu trúc .data, sử dụng row.data, nếu không thì sử dụng row trực tiếp
			return row.data ? { ...row.data } : { ...row };
		});
		
		// Khởi tạo cột kết quả cho tất cả dòng (giống logic thực tế)
		testData.forEach(row => {
			row[testResultColumn] = '';
		});
		
		// Áp dụng công thức cho tất cả dòng dữ liệu (giống logic thực tế)
		const results = [];
		let successCount = 0;
		let errorCount = 0;
		
		testData.forEach((row, index) => {
			try {
				// Sử dụng chính xác cùng logic với processAIFormula
				const calculateValue = (formula, rowData, mentionedCols, rowIndex) => {
					try {
						// Làm sạch công thức
						let cleanFormula = formula.trim();

						// Tạo mapping từ tên cột gốc sang tên biến JavaScript hợp lệ
						const columnMapping = {};
						const validColumnNames = [];

						mentionedCols.forEach((originalCol, index) => {
							// Tạo tên biến hợp lệ cho JavaScript (thay thế dấu cách và ký tự đặc biệt)
							const validName = `col_${index}`;
							columnMapping[originalCol] = validName;
							validColumnNames.push(validName);

							// Thay thế tên cột gốc trong công thức bằng tên biến hợp lệ
							// Sử dụng cách tiếp cận đơn giản: thay thế trực tiếp
							
							// Thay thế từng pattern một cách riêng biệt để tránh xung đột
							
							// 1. Thay thế @Tên cột
							cleanFormula = cleanFormula.replace(new RegExp(`@${originalCol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), validName);
							
							// 2. Thay thế "Tên cột"
							cleanFormula = cleanFormula.replace(new RegExp(`"${originalCol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), validName);
							
							// 3. Thay thế `Tên cột`
							cleanFormula = cleanFormula.replace(new RegExp(`\`${originalCol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\``, 'g'), validName);
							
							// 4. Thay thế Tên cột (không có ký tự đặc biệt)
							cleanFormula = cleanFormula.replace(new RegExp(`\\b${originalCol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), validName);
						});

						// Bước bổ sung: Loại bỏ tất cả ký tự @ còn sót lại
						cleanFormula = cleanFormula.replace(/@/g, '');
						
						// Debug: Log công thức sau khi xử lý
						console.log('Test - Original formula:', formula);
						console.log('Test - Clean formula:', cleanFormula);
						console.log('Test - Column mapping:', columnMapping);
						console.log('Test - Valid column names:', validColumnNames);

						// Xử lý closure function hoặc IIFE
						if (cleanFormula.includes('(function()') || cleanFormula.includes('(() =>')) {
							// Đây là closure function, cần thực thi trực tiếp
							const formulaWithContext = `
								(function() {
									const rowIndex = ${rowIndex};
									const result = ${cleanFormula};
									// Nếu result là function, gọi nó
									if (typeof result === 'function') {
										return result();
									}
									return result;
								})()
							`;
							
							// Tạo function để thực thi công thức với context
							const formulaFunction = new Function(
								...validColumnNames,
								formulaWithContext
							);

							// Lấy giá trị các cột được mention theo thứ tự
							const columnValues = mentionedCols.map(col => rowData[col] || '');

							// Thực thi công thức
							const result = formulaFunction(...columnValues);

							// Xử lý kết quả
							if (result === null || result === undefined) {
								return '';
							}

							return String(result);
						} else {
							// Xử lý công thức thông thường
							// Nếu công thức đã có return statement, giữ nguyên
							// Nếu không có, wrap trong return
							if (!cleanFormula.startsWith('return')) {
								cleanFormula = `return (${cleanFormula})`;
							}

							// Tạo function để thực thi công thức
							const formulaFunction = new Function(
								...validColumnNames,
								cleanFormula
							);

							// Lấy giá trị các cột được mention theo thứ tự
							const columnValues = mentionedCols.map(col => rowData[col] || '');

							// Thực thi công thức
							const result = formulaFunction(...columnValues);

							// Xử lý kết quả
							if (result === null || result === undefined) {
								return '';
							}

							return String(result);
						}
					} catch (error) {
						console.error('Error calculating formula value:', error);
						throw error;
					}
				};
				
				const result = calculateValue(formula, row, mentionedColumns, index);
				row[testResultColumn] = result;
				
				// Logic validation giống processAIFormula
				const isValid = result !== null && result !== undefined && result !== '' && result !== 'FORMULA_ERROR';
				
				results.push({
					rowIndex: index,
					inputData: row,
					formula: formula,
					result: result,
					isValid: isValid,
					error: null
				});
				
				if (isValid) {
					successCount++;
				} else {
					errorCount++;
				}
				
			} catch (error) {
				row[testResultColumn] = 'FORMULA_ERROR';
				results.push({
					rowIndex: index,
					inputData: row,
					formula: formula,
					result: 'FORMULA_ERROR',
					isValid: false,
					error: error.message
				});
				errorCount++;
			}
		});

		return {
			success: true,
			formula: formula,
			results: results,
			summary: {
				total: sampleData.length,
				success: successCount,
				error: errorCount,
				successRate: ((successCount / sampleData.length) * 100).toFixed(1)
			}
		};

	} catch (error) {
		return {
			success: false,
			error: error.message,
			results: []
		};
	}
};

// Hàm test AI Transformer với 10 dòng dữ liệu ngẫu nhiên
// Hàm đánh giá điều kiện lọc cho AI Transformer (copy từ autorunService)
const evaluateFilterCondition = (rowData, filterConditions, filterMode) => {
    if (!filterConditions || filterConditions.length === 0) {
        // Nếu không có điều kiện lọc, trả về true cho include mode, false cho exclude mode
        return filterMode === 'include';
    }

    try {
        // Đánh giá từng điều kiện lọc
        let finalResult = true;
        
        for (let i = 0; i < filterConditions.length; i++) {
            const condition = filterConditions[i];
            
            // Bỏ qua điều kiện không hợp lệ
            if (!condition.column || !condition.operator) {
                continue;
            }
            
            const columnValue = rowData[condition.column];
            const conditionValue = condition.value;
            let conditionResult = false;
            
            // Đánh giá điều kiện dựa trên toán tử
            switch (condition.operator) {
                case '==':
                    conditionResult = columnValue == conditionValue;
                    break;
                case '!=':
                    conditionResult = columnValue != conditionValue;
                    break;
                case '>':
                    conditionResult = Number(columnValue) > Number(conditionValue);
                    break;
                case '<':
                    conditionResult = Number(columnValue) < Number(conditionValue);
                    break;
                case '>=':
                    conditionResult = Number(columnValue) >= Number(conditionValue);
                    break;
                case '<=':
                    conditionResult = Number(columnValue) <= Number(conditionValue);
                    break;
                case 'contains':
                    conditionResult = String(columnValue || '').toLowerCase().includes(String(conditionValue || '').toLowerCase());
                    break;
                case 'not_contains':
                    conditionResult = !String(columnValue || '').toLowerCase().includes(String(conditionValue || '').toLowerCase());
                    break;
                case 'is_empty':
                    conditionResult = !columnValue || String(columnValue).trim() === '';
                    break;
                case 'is_not_empty':
                    conditionResult = columnValue && String(columnValue).trim() !== '';
                    break;
                default:
                    conditionResult = false;
            }
            
            // Kết hợp với kết quả trước đó
            if (i === 0) {
                finalResult = conditionResult;
            } else {
                const logicOperator = condition.logic || 'AND';
                if (logicOperator === 'AND') {
                    finalResult = finalResult && conditionResult;
                } else if (logicOperator === 'OR') {
                    finalResult = finalResult || conditionResult;
                }
            }
        }
        
        // Trả về kết quả cuối cùng
        return finalResult;
    } catch (error) {
        console.warn('Lỗi khi đánh giá điều kiện lọc:', error);
        // Nếu có lỗi, mặc định trả về true cho include mode, false cho exclude mode
        return filterMode === 'include';
    }
};

export const testAITransformer = async (data, config, aiGen2, updateUsedTokenApp) => {
	// Import helper functions from aiTransformerProcessor

	
	// Kiểm tra data có phải là array không
	if (!data || !Array.isArray(data) || data.length === 0) {
		return {
			success: false,
			error: 'Không có dữ liệu để test hoặc dữ liệu không hợp lệ',
			results: []
		};
	}

	// Kiểm tra cấu hình
	if (config.jobType === 'template_based_categorize') {
		// Validation cho template_based_categorize
		if (!config.conditionColumns || !config.resultColumn || !config.templateConfig) {
			return {
				success: false,
				error: 'Thiếu cấu hình bắt buộc cho template_based_categorize: conditionColumns, resultColumn, hoặc templateConfig',
				results: []
			};
		}
		if (!config.templateConfig.templateConditionColumns || !config.templateConfig.templateTargetColumn || !config.templateConfig.templateFilterOperator) {
			return {
				success: false,
				error: 'Thiếu cấu hình mẫu: templateConditionColumns, templateTargetColumn, hoặc templateFilterOperator',
				results: []
			};
		}
	} else {
		// Validation cho các job type khác
		if (!config.conditionColumns || !config.resultColumn || !config.aiPrompt) {
			return {
				success: false,
				error: 'Thiếu cấu hình bắt buộc: conditionColumns, resultColumn, hoặc aiPrompt',
				results: []
			};
		}
	}

	// Áp dụng lọc dữ liệu nếu được bật
	let dataToTest = data;
	if (config.enableFilter && config.filterConditions && config.filterConditions.length > 0) {
		console.log(`Test AI Transformer: Áp dụng lọc dữ liệu với chế độ ${config.filterMode}`);
		dataToTest = data.filter(row => 
			evaluateFilterCondition(row, config.filterConditions, config.filterMode)
		);
		console.log(`Test AI Transformer: Sau khi lọc còn lại ${dataToTest.length}/${data.length} dòng`);
	}

	// Lấy 10 dòng dữ liệu ngẫu nhiên từ dữ liệu đã lọc
	const sampleSize = Math.min(10, dataToTest.length);
	if (sampleSize === 0) {
		return {
			success: false,
			error: 'Không có dữ liệu nào thỏa mãn điều kiện lọc',
			results: []
		};
	}
	const shuffled = [...dataToTest].sort(() => 0.5 - Math.random());
	const sampleData = shuffled.slice(0, sampleSize);
	try {
		// Kiểm tra token quota
		await checkTokenQuota();

		// Chuẩn bị dữ liệu cho AI theo format của aiTransformerProcessor
		const dataForAI = sampleData.map((row, index) => {
			const conditionData = {};
			config.conditionColumns.forEach(col => {
				col = col+''
				conditionData[col] = row[col];
			});
			return {
				rowIndex: index,
				data: conditionData
			};
		});

        // Tạo prompt cho AI sử dụng helper function từ aiTransformerProcessor
        // Prepend system prompt theo job type nếu có
		let userPrompt = config.aiPrompt;
		
		// Xử lý đặc biệt cho template_based_categorize
		if (config.jobType === 'template_based_categorize') {
			// Tạo prompt đặc biệt cho template-based categorization
			const templateConditionCols = config.templateConfig.templateConditionColumns.map(c => `\`${c}\``).join(', ');
			const targetCol = config.templateConfig.templateTargetColumn;
			const conditionCols = config.conditionColumns.map(c => `\`${c}\``).join(', ');
			
			// Tạo mô tả điều kiện từ templateFilterOperator và templateFilterValue
			const operator = config.templateConfig.templateFilterOperator;
			const value = config.templateConfig.templateFilterValue;
			
			let conditionDescription = '';
			if (operator === 'is_empty') {
				conditionDescription = `${targetCol} trống`;
			} else if (operator === 'is_not_empty') {
				conditionDescription = `${targetCol} không trống`;
			} else if (operator === 'contains') {
				conditionDescription = `${targetCol} chứa "${value}"`;
			} else if (operator === 'not_contains') {
				conditionDescription = `${targetCol} không chứa "${value}"`;
			} else {
				conditionDescription = `${targetCol} ${operator} ${value}`;
			}
			
			userPrompt = `Dựa trên dữ liệu từ các trường ${conditionCols}, hãy chọn khoản mục phù hợp dựa vào các mẫu đã có.

CÁCH THỰC HIỆN:
1. Tìm các dòng mẫu trong dữ liệu hiện tại thỏa mãn điều kiện: ${conditionDescription}
2. Từ các dòng mẫu đó, học mối quan hệ giữa các trường ${templateConditionCols} và cột đích \`${targetCol}\`
3. Áp dụng mối quan hệ đã học để chọn khoản mục phù hợp cho dữ liệu đầu vào

YÊU CẦU:
- Chỉ trả về giá trị khoản mục phù hợp nhất
- Nếu không tìm thấy mẫu phù hợp, trả về "Không xác định"
- Giá trị trả về phải có trong danh sách các giá trị mẫu đã học`;
		} else {
			// Xử lý system prompt cho các job type khác
			try {
				if (config.jobType) {
					let setting = await getSettingByType('AI_TRANSFORMER_JOB_PROMPTS');
					let sysMap = setting?.setting || {};
					let sys = sysMap[config.jobType];
					if (!sys || (typeof sys === 'string' && sys.trim() === '')) {
						const masterSetting = await getTypeSchema('master', 'AI_TRANSFORMER_JOB_PROMPTS');
						sysMap = masterSetting?.setting || {};
						sys = sysMap[config.jobType];
					}
					if (sys && typeof sys === 'string' && sys.trim()) {
						userPrompt = `${sys.trim()}\n\n${userPrompt}`;
					}
				}
			} catch (e) {
				console.warn('Không thể load System Prompt cho job type:', config.jobType, e?.message);
			}
		}
        // FE Test: nếu là categorize2/3/template_based_categorize và có listingOption → load danh sách unique và thêm constraint giống BE
        try {
            const isListing = (config.jobType === 'categorize2' || config.jobType === 'categorize3' || config.jobType === 'template_based_categorize')
                && config.listingOption && config.listingOption.lookupTable
                && (config.listingOption.lookupTableVersion !== undefined)
                && config.listingOption.lookupColumn;
            if (isListing) {
                // Lấy dữ liệu bảng danh mục và xây unique list để nhúng vào prompt test (giống BE, nhưng cắt ngắn)
                const lookupVersion = (config.listingOption.lookupTableVersion === 1) ? null : config.listingOption.lookupTableVersion;
                const resp = await getTemplateRow(config.listingOption.lookupTable, lookupVersion, false, 1, 5000);
                let rows = [];
                if (resp && Array.isArray(resp.rows)) rows = resp.rows.map(r => r.data);
                else if (Array.isArray(resp)) rows = resp.map(r => r.data || r);
                const values = rows.map(r => {
                    const v = r?.[config.listingOption.lookupColumn];
                    return (v === null || v === undefined) ? '' : String(v).trim();
                }).filter(v => v !== '');
                const uniq = Array.from(new Set(values));
                const previewList = uniq.slice(0, 200);
                if (previewList.length > 0) {
                    const constraint = `\n\nDANH SÁCH CHO PHÉP (TEST - ${previewList.length}/${uniq.length} mục đầu):\n${previewList.map(v => `- ${v}`).join('\n')}\nYÊU CẦU BẮT BUỘC: Chỉ trả về đúng 1 giá trị thuộc danh sách trên; nếu cần chọn tương đương, trả về chính tả như trong danh sách. Chỉ trả về chuỗi kết quả.`;
                    userPrompt = `${userPrompt}${constraint}`;
                } else {
                    const constraintNote = `\n\nYÊU CẦU BẮT BUỘC (TEST): Chỉ được trả về đúng 1 giá trị và giá trị đó PHẢI nằm trong danh sách unique của cột đã cấu hình (theo bảng/phiên bản đã chọn). Trả về duy nhất chuỗi kết quả, không giải thích.`;
                    userPrompt = `${userPrompt}${constraintNote}`;
                }
            }
        } catch(_) {}
		// Tạo prompt phù hợp với job type
		let aiPrompt;
		if (config.jobType === 'template_based_categorize') {
			// Lấy dữ liệu mẫu từ toàn bộ data hiện tại
			const templateData = data.filter(row => {
				// Áp dụng điều kiện lọc mẫu cho cột đích
				try {
					const value = row[config.templateConfig.templateTargetColumn];
					const operator = config.templateConfig.templateFilterOperator;
					const filterValue = config.templateConfig.templateFilterValue;
					
					switch (operator) {
						case '=':
							return value == filterValue;
						case '!=':
							return value != filterValue;
						case '>':
							return Number(value) > Number(filterValue);
						case '<':
							return Number(value) < Number(filterValue);
						case '>=':
							return Number(value) >= Number(filterValue);
						case '<=':
							return Number(value) <= Number(filterValue);
						case 'contains':
							return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
						case 'not_contains':
							return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
						case 'is_empty':
							return value === null || value === undefined || value === '';
						case 'is_not_empty':
							return value !== null && value !== undefined && value !== '';
						default:
							return true;
					}
				} catch (e) {
					console.warn('Lỗi khi áp dụng điều kiện mẫu:', e);
					return false;
				}
			});
			
			aiPrompt = buildTemplateBasedCategorizePrompt(
				userPrompt, 
				dataForAI, 
				config.resultColumn, 
				templateData, 
				config.templateConfig
			);
		} else {
			aiPrompt = buildBulkAITransformerPrompt(userPrompt, dataForAI, config.resultColumn);
		}
		// Gọi AI với timeout
		const aiResult = await Promise.race([
			aiGen2(aiPrompt, null, config.aiModel || 'gemini-2.5-flash'),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('AI request timeout cho test')), 300000) // 5 phút timeout
			)
		]);

		console.log('Test AI Transformer - aiResult:', aiResult);

		// Cập nhật token đã sử dụng
		await updateUsedTokenApp(aiResult, config.aiModel || 'gemini-2.5-flash');

		// Xử lý kết quả từ AI sử dụng helper function từ aiTransformerProcessor
		const transformedResults = extractBulkAIResult(aiResult, sampleData.length);

		// Tạo kết quả test
		const results = [];
		let successCount = 0;
		let errorCount = 0;

		for (let i = 0; i < sampleData.length; i++) {
			const row = sampleData[i];
			const aiValue = transformedResults[i] !== undefined && transformedResults[i] !== null
				? transformedResults[i]
				: '';

			// Kiểm tra tính hợp lệ của kết quả (an toàn cho non-string)
			const isString = typeof aiValue === 'string';
			const isEmptyString = isString && aiValue.trim() === '';
			const hasErrorMarker = isString && (
				aiValue.includes('[Lỗi') ||
				aiValue.includes('ERROR') ||
				aiValue.includes('PARSE_ERROR') ||
				aiValue.includes('MISSING_RESULT')
			);
			const isValid = !isEmptyString && aiValue !== null && aiValue !== undefined && !hasErrorMarker;

			results.push({
				rowIndex: i,
				inputData: row,
				aiResult: aiValue,
				isValid: isValid,
				error: isValid ? null : 'AI result is invalid or empty'
			});

			if (isValid) {
				successCount++;
			} else {
				errorCount++;
			}
		}

		return {
			success: true,
			results: results,
			summary: {
				total: sampleData.length,
				success: successCount,
				error: errorCount,
				successRate: ((successCount / sampleData.length) * 100).toFixed(1)
			}
		};

	} catch (error) {
		console.error('Error in testAITransformer:', error);
		return {
			success: false,
			error: error.message,
			results: []
		};
	}
};

// Hàm xử lý Basic Processing (Type 34)
export const processBasicProcessing = (data, config) => {
    try {
        if (!data) {
            console.log('Basic Processing: Dữ liệu đầu vào null/undefined');
            return [];
        }

        console.log(`Basic Processing: Bắt đầu xử lý ${data.length} dòng dữ liệu`);

        let processedData = [...data];

        // 1) TRIM - reuse type 28 (processTrimString) for selected/all columns
        if (config.enableTrim) {
            console.log('Basic Processing: TRIM');
            const firstRow = processedData[0] || {};
            const allCols = Object.keys(firstRow).filter(k => k !== 'rowId' && k !== 'key');
            const targetCols = config.trimAllColumns ? allCols : Array.isArray(config.trimColumns) ? config.trimColumns : [];
            if (targetCols.length > 0) {
                targetCols.forEach(col => {
                    processedData = processTrimString(processedData, {
                        column: col,
                        trimType: config.trimType || 'both',
                        newColumn: false,
                    });
                });
            }
        }

        // 2) Chuyển đổi kiểu dữ liệu - reuse type 25 (processConvertToValue)
        if (config.enableDataTypeConversion && Array.isArray(config.dataTypeMappings) && config.dataTypeMappings.length > 0) {
            console.log('Basic Processing: Convert To Value');
            const cvtResult = processConvertToValue(processedData, {
                columnMappings: config.dataTypeMappings
            });
            // Compatibility: function may return { success, data, updatedOutputColumns }
            if (Array.isArray(cvtResult)) {
                processedData = cvtResult;
            } else if (cvtResult && Array.isArray(cvtResult.data)) {
                processedData = cvtResult.data;
            }
        }

        // 3) Value to Date - reuse type 19 (processValueToTime)
        if (config.enableValueToDate && Array.isArray(config.dateMappings) && config.dateMappings.length > 0) {
            console.log('Basic Processing: Value To Date');
            const mappings = config.dateMappings.map(m => ({
                column: m.column,
                outputColumn: m.outputColumn || m.column,
                timeFormat: m.dateFormat || 'YYYY-MM-DD'
            }));
            processedData = processValueToTime(processedData, {
                mappings,
                timeFormat: 'YYYY-MM-DD'
            });
        }

        // 4) Case - reuse type 26 (processCaseConversion)
        if (config.enableCaseConversion) {
            console.log('Basic Processing: Case Conversion');
            const firstRow = processedData[0] || {};
            const allCols = Object.keys(firstRow).filter(k => k !== 'rowId' && k !== 'key');
            const targetCols = config.caseAllColumns ? allCols : Array.isArray(config.caseColumns) ? config.caseColumns : [];
            if (targetCols.length > 0) {
                targetCols.forEach(col => {
                    processedData = processCaseConversion(processedData, {
                        column: col,
                        caseType: config.caseType || 'sentencecase',
                        newColumn: false
                    });
                });
            }
        }

        // 5) Rename - keep as implemented
        if (config.enableRename) {
            processedData = processBasicRename(processedData, config);
        }

        console.log('Basic Processing: Hoàn thành xử lý');
        return processedData;

    } catch (error) {
        console.error('Error in processBasicProcessing:', error);
        return data;
    }
};

// Helper function for TRIM
const processBasicTrim = (data, config) => {
	const { trimColumns, trimType, trimAllColumns } = config;
	
	if (trimAllColumns) {
		// Trim all columns
		return data.map(row => {
			const newRow = {};
			Object.keys(row).forEach(key => {
				const value = row[key];
				if (value !== null && value !== undefined) {
					let trimmedValue = String(value);
					switch (trimType) {
						case 'left':
							trimmedValue = trimmedValue.trimStart();
							break;
						case 'right':
							trimmedValue = trimmedValue.trimEnd();
							break;
						case 'both':
						default:
							trimmedValue = trimmedValue.trim();
							break;
					}
					newRow[key] = trimmedValue;
				} else {
					newRow[key] = value;
				}
			});
			return newRow;
		});
	} else {
		// Trim specific columns
		return data.map(row => {
			const newRow = { ...row };
			trimColumns.forEach(column => {
				if (column && row.hasOwnProperty(column)) {
					const value = row[column];
					if (value !== null && value !== undefined) {
						let trimmedValue = String(value);
						switch (trimType) {
							case 'left':
								trimmedValue = trimmedValue.trimStart();
								break;
							case 'right':
								trimmedValue = trimmedValue.trimEnd();
								break;
							case 'both':
							default:
								trimmedValue = trimmedValue.trim();
								break;
						}
						newRow[column] = trimmedValue;
					}
				}
			});
			return newRow;
		});
	}
};

// Helper function for Data Type Conversion
const processBasicDataTypeConversion = (data, config) => {
	const { dataTypeMappings } = config;
	
	return data.map(row => {
		const newRow = { ...row };
		dataTypeMappings.forEach(mapping => {
			const { column, dataType } = mapping;
			if (column && row.hasOwnProperty(column)) {
				const originalValue = row[column];
				
				switch (dataType) {
					case 'number':
						if (originalValue === null || originalValue === undefined || originalValue === '') {
							newRow[column] = 0;
						} else {
							const numericValue = parseFloat(String(originalValue).replace(/,/g, ''));
							newRow[column] = isNaN(numericValue) ? 0 : numericValue;
						}
						break;
					case 'text':
						if (originalValue === null || originalValue === undefined) {
							newRow[column] = '';
						} else {
							newRow[column] = String(originalValue);
						}
						break;
					case 'date':
						if (originalValue === null || originalValue === undefined || originalValue === '') {
							newRow[column] = null;
						} else {
							const dateValue = new Date(originalValue);
							if (isNaN(dateValue.getTime())) {
								newRow[column] = null;
							} else {
								newRow[column] = dateValue.toISOString().split('T')[0];
							}
						}
						break;
					case 'boolean':
						if (originalValue === null || originalValue === undefined) {
							newRow[column] = null;
						} else {
							const strValue = String(originalValue).toLowerCase();
							if (strValue === 'true' || strValue === '1' || strValue === 'có' || strValue === 'đúng') {
								newRow[column] = true;
							} else if (strValue === 'false' || strValue === '0' || strValue === 'không' || strValue === 'sai') {
								newRow[column] = false;
							} else {
								newRow[column] = null;
							}
						}
						break;
				}
			}
		});
		return newRow;
	});
};

// Helper function for Value to Date
const processBasicValueToDate = (data, config) => {
	const { dateMappings } = config;
	
	return data.map(row => {
		const newRow = { ...row };
		dateMappings.forEach(mapping => {
			const { column, outputColumn, dateFormat } = mapping;
			if (column && row.hasOwnProperty(column)) {
				const originalValue = row[column];
				if (originalValue !== null && originalValue !== undefined && originalValue !== '') {
					const dateValue = new Date(originalValue);
					if (!isNaN(dateValue.getTime())) {
						let formattedDate;
						switch (dateFormat) {
							case 'YYYY-MM-DD':
								formattedDate = dateValue.toISOString().slice(0, 10);
								break;
							case 'YYYY-MM-DD HH:mm:ss':
								formattedDate = dateValue.toISOString().slice(0, 19).replace('T', ' ');
								break;
							default:
								formattedDate = dateValue.toISOString().slice(0, 10);
						}
						newRow[outputColumn || column] = formattedDate;
					} else {
						newRow[outputColumn || column] = null;
					}
				} else {
					newRow[outputColumn || column] = null;
				}
			}
		});
		return newRow;
	});
};

// Helper function for Case Conversion
const processBasicCaseConversion = (data, config) => {
	const { caseColumns, caseType, caseAllColumns } = config;
	
	if (caseAllColumns) {
		// Apply case conversion to all columns
		return data.map(row => {
			const newRow = {};
			Object.keys(row).forEach(key => {
				const value = row[key];
				if (value !== null && value !== undefined) {
					let convertedValue = String(value);
					switch (caseType) {
						case 'uppercase':
							convertedValue = convertedValue.toUpperCase();
							break;
						case 'lowercase':
							convertedValue = convertedValue.toLowerCase();
							break;
						case 'sentencecase':
							convertedValue = convertedValue.charAt(0).toUpperCase() + convertedValue.slice(1).toLowerCase();
							break;
						case 'titlecase':
							convertedValue = convertedValue.replace(/\w\S*/g, (txt) => 
								txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
							);
							break;
					}
					newRow[key] = convertedValue;
				} else {
					newRow[key] = value;
				}
			});
			return newRow;
		});
	} else {
		// Apply case conversion to specific columns
		return data.map(row => {
			const newRow = { ...row };
			caseColumns.forEach(column => {
				if (column && row.hasOwnProperty(column)) {
					const value = row[column];
					if (value !== null && value !== undefined) {
						let convertedValue = String(value);
						switch (caseType) {
							case 'uppercase':
								convertedValue = convertedValue.toUpperCase();
								break;
							case 'lowercase':
								convertedValue = convertedValue.toLowerCase();
								break;
							case 'sentencecase':
								convertedValue = convertedValue.charAt(0).toUpperCase() + convertedValue.slice(1).toLowerCase();
								break;
							case 'titlecase':
								convertedValue = convertedValue.replace(/\w\S*/g, (txt) => 
									txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
								);
								break;
						}
						newRow[column] = convertedValue;
					}
				}
			});
			return newRow;
		});
	}
};

// Helper function for Rename Columns
const processBasicRename = (data, config) => {
	const { renameMappings } = config;
	
	return data.map(row => {
		const newRow = {};
		Object.keys(row).forEach(key => {
			const mapping = renameMappings.find(m => m.oldName === key);
			const newKey = mapping ? mapping.newName : key;
			newRow[newKey] = row[key];
		});
		return newRow;
	});
};

export const processConvertToValue = (data, config, inputOutputColumns = []) => {
	try {
		const { columnMappings = [] } = config;
		
		console.log('processConvertToValue - inputOutputColumns:', inputOutputColumns);
		console.log('processConvertToValue - columnMappings:', columnMappings);
		
		if (columnMappings.length === 0) {
			return {
				success: false,
				error: 'Không có cột nào được chọn để chuyển đổi',
				data: data
			};
		}

		// Tạo outputColumns mới dựa trên inputOutputColumns và columnMappings
		const updatedOutputColumns = inputOutputColumns.map(col => {
			// Tìm mapping tương ứng cho cột này
			const mapping = columnMappings.find(m => m.column === col.name);
			console.log(`Processing column ${col.name}, mapping:`, mapping);
			if (mapping) {
				// Cập nhật kiểu dữ liệu theo mapping
				const updatedCol = {
					name: col.name,
					type: mapping.dataType
				};
				console.log(`Updated column ${col.name} from ${col.type} to ${mapping.dataType}`);
				return updatedCol;
			}
			// Giữ nguyên kiểu dữ liệu cũ nếu không có mapping
			return col;
		});
		
		console.log('processConvertToValue - updatedOutputColumns:', updatedOutputColumns);

		// Xử lý dữ liệu thực tế cho các cột được chuyển đổi
		const processedData = data.map(row => {
			const newRow = { ...row };
			
			columnMappings.forEach(mapping => {
				const { column, dataType } = mapping;
				
				if (newRow.hasOwnProperty(column)) {
					const originalValue = newRow[column];
					
					// Xử lý theo kiểu dữ liệu đích
					switch (dataType) {
						case 'number':
							// Kiểm tra nếu giá trị có thể chuyển đổi thành số (kiểm tra chặt chẽ)
							if (originalValue === null || originalValue === undefined || originalValue === '') {
								newRow[column] = 'ERROR';
							} else {
								const raw = String(originalValue).trim();
								// Cho phép dạng số với dấu phẩy nghìn và dấu thập phân: -1,234.56 hoặc -1.234,56 tùy dữ liệu
								const cleaned = raw.replace(/,/g, '');
								// Chỉ chấp nhận nếu toàn bộ chuỗi là số hợp lệ (có thể có dấu âm và dấu chấm thập phân)
								if (!/^[-+]?\d*(?:\.\d+)?$/.test(cleaned) || cleaned === '' || cleaned === '-' || cleaned === '+') {
									newRow[column] = 'ERROR';
								} else {
									const numericValue = parseFloat(cleaned);
									newRow[column] = Number.isFinite(numericValue) ? numericValue : 'ERROR';
								}
							}
							break;
						
						case 'text':
							// Chuyển đổi thành text
							if (originalValue === null || originalValue === undefined) {
								newRow[column] = '';
							} else {
								newRow[column] = String(originalValue);
							}
							break;
						
						case 'date':
							// Xử lý chuyển đổi ngày tháng
							if (originalValue === null || originalValue === undefined || originalValue === '') {
								newRow[column] = 'ERROR'; // Hiển thị ERROR cho giá trị null/undefined/empty
							} else {
								const dateValue = new Date(originalValue);
								if (isNaN(dateValue.getTime())) {
									newRow[column] = 'ERROR'; // Hiển thị ERROR nếu không phải ngày hợp lệ
								} else {
									newRow[column] = dateValue.toISOString().split('T')[0]; // Format YYYY-MM-DD
								}
							}
							break;
						
						case 'boolean':
							// Chuyển đổi thành boolean
							if (originalValue === null || originalValue === undefined || originalValue === '') {
								newRow[column] = 'ERROR'; // Hiển thị ERROR cho giá trị null/undefined/empty
							} else {
								const strValue = String(originalValue).toLowerCase();
								if (['true', '1', 'yes', 'có', 'đúng'].includes(strValue)) {
									newRow[column] = true;
								} else if (['false', '0', 'no', 'không', 'sai'].includes(strValue)) {
									newRow[column] = false;
								} else {
									newRow[column] = 'ERROR'; // Hiển thị ERROR nếu không nhận diện được
								}
							}
							break;
						
						default:
							// Giữ nguyên giá trị cho các kiểu khác
							break;
					}
				} else {
					// Nếu cột không tồn tại trong dòng hiện tại, vẫn thêm khóa với giá trị ERROR
					switch (dataType) {
						case 'number':
							newRow[column] = 'ERROR';
							break;
						case 'text':
							newRow[column] = '';
							break;
						case 'date':
							newRow[column] = 'ERROR';
							break;
						case 'boolean':
							newRow[column] = 'ERROR';
							break;
						default:
							break;
					}
				}
			});
			
			return newRow;
		});

		// Thống kê số lượng giá trị được xử lý và lỗi
		const processingStats = {};
		columnMappings.forEach(mapping => {
			const { column, dataType } = mapping;
			let processedCount = 0;
			let errorCount = 0;
			
			processedData.forEach(row => {
				if (row.hasOwnProperty(column)) {
					if (row[column] === 'ERROR') {
						errorCount++;
					} else {
						processedCount++;
					}
				}
			});
			
			processingStats[column] = {
				dataType,
				processedCount,
				errorCount,
				totalCount: processedData.length
			};
		});

		return {
			success: true,
			data: processedData, // Trả về dữ liệu đã được xử lý
			outputColumns: updatedOutputColumns, // Trả về outputColumns mới
			summary: {
				totalRows: processedData.length,
				columnMappings: columnMappings,
				updatedColumns: columnMappings.map(m => ({ name: m.column, oldType: inputOutputColumns.find(c => c.name === m.column)?.type || 'unknown', newType: m.dataType })),
				processingStats: processingStats,
				message: 'Đã xử lý và cập nhật kiểu dữ liệu cho các cột được chọn'
			}
		};

	} catch (error) {
		console.error('Error in processConvertToValue:', error);
		return {
			success: false,
			error: error.message,
			data: data
		};
	}
};
