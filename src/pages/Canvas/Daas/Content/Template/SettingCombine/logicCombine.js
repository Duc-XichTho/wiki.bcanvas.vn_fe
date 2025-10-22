import { getAllTemplateTables, getTemplateRow } from '../../../../../../apis/templateSettingService.jsx';
import { getAllFileNotePad } from '../../../../../../apis/fileNotePadService.jsx';

export async function loadAndMergeData(templateData) {
	if (!templateData?.setting?.selectedTemplates) return [];
	let { selectedTemplates, isJoinTable, isJoinTable2,  computedColumns, selectedTemplateNames } = templateData.setting;
	let tempIds = Object.keys(selectedTemplates);
	let allData = {};
	// Lấy dữ liệu của tất cả template
	let listTemplateTable = await getAllTemplateTables();
	let listFileNote = await getAllFileNotePad();
	listTemplateTable = listTemplateTable.filter(t => listFileNote.some(fileNote => fileNote.id === t.fileNote_id));
	await Promise.all(
		tempIds
			.filter(tempId => listTemplateTable.some(t => t.id == tempId))
			.map(async (tempId) => {
				const rowsResponse = await getTemplateRow(tempId);
				const rows = rowsResponse.rows || [];
				allData[tempId] = rows.map(r => r.data);
			})
	);
	if (isJoinTable || isJoinTable2) {
		if (!selectedTemplateNames) selectedTemplateNames = []
		const result = [];
		const fields = computedColumns.map(col => col.field);
		for (const tempId of tempIds) {
			if (!allData[tempId]) continue;
			const rows = allData[tempId];
			const templateName = selectedTemplateNames[tempId] || `Template ${tempId}`;

			for (const row of rows) {
				const filtered = {};

				fields.forEach(field => {
					if (row.hasOwnProperty(field)) {
						filtered[field] = row[field];
					}
				});
				if (Object.keys(filtered).length > 0) {
					// Gắn thêm tên template vào dòng dữ liệu
					filtered.templateName = templateName;
					result.push(filtered);
				}
			}
		}

		return result;
	}
	let rs = mergeMultipleData(templateData.setting, allData);

	rs.map(e => {
		if (e['Thời gian']) {
			e['Thời gian_display'] = formatDateToDDMMYYYY(e['Thời gian']);
		}
	});

	return rs.filter(item => Object.keys(item).length > 0);
}

function mergeMultipleData(setting, allData) {
	const { joinConditions, selectedTemplates } = setting;
	let result = [];

	if (!joinConditions || joinConditions.length === 0) {
		return [];
	}

	const { field1, field2, template1, template2, joinType } = joinConditions[0];
	const data1 = allData[template1] || [];
	const data2 = allData[template2] || [];

	const matchedSet = new Set();

	// LEFT + INNER JOIN
	data1.forEach(row1 => {
		const matchedRows = data2.filter(row2 => row1[field1] === row2[field2]);
		if (matchedRows.length > 0) {
			matchedRows.forEach(row2 => {
				matchedSet.add(row2);
				result.push(buildCombinedRow(row1, row2, selectedTemplates, template1, template2));
			});
		} else if (joinType === "LEFT" || joinType === "FULL") {
			result.push(buildCombinedRow(row1, null, selectedTemplates, template1, template2));
		}
	});

	// RIGHT JOIN hoặc FULL JOIN (thêm các dòng bên phải không match)
	if (joinType === "RIGHT" || joinType === "FULL") {
		data2.forEach(row2 => {
			const matchedRows = data1.filter(row1 => row1[field1] === row2[field2]);
			if (matchedRows.length === 0) {
				result.push(buildCombinedRow(null, row2, selectedTemplates, template1, template2));
			}
		});
	}

	return result;
}

function buildCombinedRow(row1, row2, selectedTemplates, template1, template2) {
	const combined = {};

	selectedTemplates[template1]?.forEach(col => {
		combined[col] = row1 ? row1[col] : null;
	});

	selectedTemplates[template2]?.forEach(col => {
		combined[col] = row2 ? row2[col] : null;
	});

	return combined;
}

export function formatDateToDDMMYYYY(isoString) {
	const date = new Date(isoString);
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
}
