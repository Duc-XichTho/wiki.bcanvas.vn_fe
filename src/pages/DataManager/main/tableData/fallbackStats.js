// Fallback functions nếu simple-statistics không load được
const fallbackStats = {
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

// Sử dụng fallback stats thay vì simple-statistics để tránh lỗi require
const stats = fallbackStats;

const stepTypeName = {
	1: 'Bỏ duplicate',
	2: 'Điền giá trị thiếu',
	3: 'Phát hiện ngoại lệ',
	4: 'Lookup', // 11
	5: 'Thêm cột tính toán',
	// 6: 'Add Column',
	8: 'Điền có điều kiện', //6
	7: 'Validation & Mapping', //7
	9: 'Lọc dữ liệu', //8
	10: 'Aggregate',
	// 11: 'Code-based New column',
	12: 'Tạo mới',
	13: 'Text-to-column',
	14: 'Date Converter',
	15: 'Điền theo Smart Logic',
	16: 'Lọc bỏ cột',
	17: 'Xoay bảng',
	18: 'Nối bảng',
};

function getStepSummary(step, availableTables = []) {
	// Tạo phần thông tin về cột đã lưu (sau khi xử lý)
	const columnInfo = step.config?.outputColumns ? ` | Columns: ${step.config.outputColumns.length}` : '';

	let baseSummary = '';
	switch (step.type) {
		case 1:
			baseSummary = `Columns: ${(step.config?.columns || []).join(', ')} | Keep: ${step.config?.keepFirst ? 'First' : 'Last'}`;
			break;
		case 2:
			const newColInfo = step.config?.newColumn ? ` → ${step.config?.columnName}` : '';
			baseSummary = `Column: ${step.config?.column}${newColInfo}, Fill: ${step.config?.fillType}`;
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
			baseSummary = `Column: ${step.config?.column}, Method: ${outlierMethodName}, Action: ${outlierAction}${outlierNewColInfo}`;
			break;
		case 4: {
			// Lookup step: show concise, max 2 lines
			const tableStr = String(step.config?.lookupTable ?? '').slice(0, 20);
			const returnColStr = String(step.config?.returnColumn ?? '').slice(0, 20);
			const joinColStr = String(step.config?.joinColumn ?? '').slice(0, 20);
			const lookupColStr = String(step.config?.lookupColumn ?? '').slice(0, 20);
			const newColStr = String(step.config?.newColumnName ?? '').slice(0, 20);

			// Helper to truncate and add ... if too long
			function trunc(str, max = 18) {
				if (!str) return '';
				return str.length > max ? str.slice(0, max) + '...' : str;
			}

			const line1 = `Lookup: ${trunc(tableStr)} → ${trunc(returnColStr)}`;
			const line2 = `Join: ${trunc(joinColStr)}=${trunc(lookupColStr)} → ${trunc(newColStr)}`;
			return `${line1}\n${line2}`;
		}
		case 5:
			baseSummary = `New: ${step.config?.newColumnName}, Formula: ${step.config?.formula}`;
			break;
		case 6:
			baseSummary = `Add: ${step.config?.columnName}, Type: ${step.config?.dataType}`;
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
				baseSummary = `Smart Fill (AI): ${smartFillTargetCol} - "${step.config?.aiPrompt?.substring(0, 50)}..."`;
			} else {
				const conditionCount = step.config?.conditions?.length || 0;
				baseSummary = `Smart Fill: ${smartFillTargetCol} (${conditionCount} điều kiện)`;
			}
			break;
		case 9:
			baseSummary = `Filter: ${step.config?.conditions?.length || 0} conditions`;
			break;
		case 10:
			const aggCount = step.config?.aggregations?.length || 0;
			const groupByCols = step.config?.groupBy || [];
			const groupByText = Array.isArray(groupByCols) ? groupByCols.join(' → ') : (typeof groupByCols === 'string' ? groupByCols : 'N/A');
			baseSummary = `Group by: ${groupByText} | Aggregations: ${aggCount}`;
			break;
		case 11:
			baseSummary = `Add: ${step.config?.columnName}, JS: ${step.config?.expression}`;
			break;
		case 12:
			baseSummary = `Source: ${step.config?.uploadType || 'Chưa cấu hình'}`;
			break;
		case 13:
			const splitMethod = step.config?.splitMethod || 'separator';
			const targetCol13 = step.config?.targetColumn || 'N/A';
			if (splitMethod === 'separator') {
				const separator = step.config?.separator || ',';
				baseSummary = `Split: ${targetCol13} by "${separator}"`;
			} else {
				const position = step.config?.position || 'left';
				const length = step.config?.length || 1;
				baseSummary = `Split: ${targetCol13} ${position.toUpperCase()} ${length} chars`;
			}
			break;
		case 14:
			const yearCol = step.config?.yearColumn || 'N/A';
			const monthCol = step.config?.monthColumn || 'N/A';
			const dayCol = step.config?.dayColumn || 'N/A';
			const dateOutputCol = step.config?.outputColumn || 'date';
			baseSummary = `Date: ${yearCol}/${monthCol}/${dayCol} → ${dateOutputCol}`;
			break;
		case 15:
			const smartRuleInputCols = step.config?.inputColumns || [];
			const smartRuleOutputCol = step.config?.createNewColumn ? step.config?.newColumnName : step.config?.outputColumn;
			const exampleCount = step.config?.exampleIdentifier?.values?.length || 0;
			baseSummary = `Smart Rule: [${smartRuleInputCols.join(', ')}] → ${smartRuleOutputCol} (${exampleCount} examples)`;
			break;
		case 16:
			const filterMode = step.config?.filterMode === 'include' ? 'Giữ lại' : 'Loại bỏ';
			const selectedCount = step.config?.selectedColumns?.length || 0;
			const selectedCols = step.config?.selectedColumns || [];
			const colsPreview = selectedCols.length > 3
				? `${selectedCols.slice(0, 3).join(', ')}...`
				: selectedCols.join(', ');
			baseSummary = `${filterMode}: ${selectedCount} cột${selectedCount > 0 ? ` (${colsPreview})` : ''}`;
			break;
		case 17:
			const identifierCols = step.config?.identifierColumns || [];
			const pivotCols = step.config?.pivotColumns || [];
			const itemColName = step.config?.itemColumnName || 'Khoản mục';
			const valueColName = step.config?.valueColumnName || 'Giá trị';
			baseSummary = `Xoay: ${pivotCols.length} cột → ${itemColName}/${valueColName} | ID: ${identifierCols.join(', ')}`;
			break;
		case 18:
			const targetTableId = step.config?.targetTable || '';
			const targetTableName = availableTables.find(t => t.id === targetTableId)?.name || targetTableId;
			const targetVersion = step.config?.targetVersion || '';
			const joinType = step.config?.joinType || 'inner';
			const joinColumns = step.config?.joinColumns || [];
			const validJoinPairs = joinColumns.filter(col => col.sourceColumn && col.targetColumn);
			const joinDescription = validJoinPairs.map(col => `${col.sourceColumn} = ${col.targetColumn}`).join(', ');
			baseSummary = `Nối: ${joinDescription} | ${targetTableName}(${targetVersion}) | ${joinType} join`;
			break;
		default:
			baseSummary = '';
	}

	return baseSummary + columnInfo;
}

export { fallbackStats, stats, stepTypeName, getStepSummary }; 