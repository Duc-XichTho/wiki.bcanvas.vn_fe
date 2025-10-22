import { getTableByid, getTemplateRow } from '../../../../apis/templateSettingService.jsx';

export async function viewDetailTH(khkdData, templateKey) {
	if (!khkdData?.listTemplate?.[templateKey]?.templateId) return;

	const templateId = khkdData.listTemplate[templateKey].templateId;
	const allTemplatesData = {};

	// Helper: lấy table và row và lưu lại theo level
	async function fetchTemplateData(id, label = "", level = 0) {
		if (!id || allTemplatesData[id]) return { table: allTemplatesData[id]?.table }; // Tránh gọi lại
		const [table, rowsResponse] = await Promise.all([
			getTableByid(id),
			getTemplateRow(id),
		]);
		const rows = rowsResponse.rows || [];

		if (table) {
			allTemplatesData[id] = {
				label,
				level,
				table,
				rows: rows.map(row => row.data),
			};
		} else {
			console.warn(`⚠️ Không tìm thấy template với id: ${id} (${label})`);
		}

		return { table, rows };
	}

	// Bảng chính (level 0)
	const { table: templateTable } = await fetchTemplateData(templateId, "Main Template", 0);

	// Bảng mẹ của bảng chính (level 1)
	if (templateTable?.mother_table_id) {
		await fetchTemplateData(templateTable.mother_table_id, "Main Template's Mother", 1);
	}

	// Nếu là bảng Combine (nhiều bảng con)
	if (templateTable?.isCombine && templateTable?.setting?.selectedTemplates) {
		const selectedTemplates = templateTable.setting.selectedTemplates;
		const tempIds = Object.keys(selectedTemplates);

		await Promise.all(
			tempIds.map(async (tempId) => {
				// Bảng con (level 1)
				const { table: childTable } = await fetchTemplateData(tempId, "Child Template", 1);
				if (!childTable) return;

				// Mẹ của bảng con (level 2)
				if (childTable.mother_table_id) {
					await fetchTemplateData(childTable.mother_table_id, "Child Template's Mother", 2);
				}

				// Lặp lại với chính childTable.id để đảm bảo toàn bộ đường dẫn (level 2)
				if (childTable.id) {
					const { table: childTableAgain } = await fetchTemplateData(childTable.id, "Child Template (Again)", 2);
					if (childTableAgain?.mother_table_id) {
						await fetchTemplateData(childTableAgain.mother_table_id, "Child Template's Mother (Again)", 3);
					}
				}
			})
		);
	}

	// ✅ In ra toàn bộ dữ liệu đã gom được
	console.log("📦 All Templates Data with Levels:", allTemplatesData);

	// Bạn có thể return nếu muốn dùng ngoài:
	return allTemplatesData;
}

export function getDeepestLevelRows(allTemplatesData) {
	console.log(allTemplatesData);
	const maxLevel = Math.max(...Object.values(allTemplatesData).map(t => t.level ?? 0));
	const deepestTemplates = Object.values(allTemplatesData).filter(t => t.level === maxLevel);
	return deepestTemplates.flatMap(t => t.rows);
}



