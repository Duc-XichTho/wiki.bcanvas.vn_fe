import { getAllSoKeToan } from '../../../../../../apisKTQT/soketoanService.jsx';
import { getAllProduct } from '../../../../../../apisKTQT/productService.jsx';
import {
	createBathTemplateRow,
	createTemplateColumn,
	deleteTemplateColByTableId,
	deleteTemplateRowByTableId,
} from '../../../../../../apis/templateSettingService.jsx';
import { toast } from 'react-toastify';
import { getAllCompany } from '../../../../../../apis/companyService.jsx';
import { getAllUnits } from '../../../../../../apisKTQT/unitService.jsx';
import { getAllVas } from '../../../../../../apisKTQT/vasService.jsx';
import { loadBCCCTC } from '../../../../../KeToanQuanTri/BaoCao/CDTC/logicBCCDTC.js';

const LIST_PL_TYPE = [
	{ key: 'DT', label: 'Doanh thu' },
	{ key: 'GV', label: 'Giá vốn' },
	{ key: 'CFBH', label: 'Chi phí bán hàng' },
	{ key: 'CFQL', label: 'Chi phí quản lí' },
	{ key: 'DTTC', label: 'Doanh thu tài chính' },
	{ key: 'CFTC', label: 'Chi phí tài chính' },
	{ key: 'CFK', label: 'Chi phí khác' },
	{ key: 'DTK', label: 'Doanh thu khác' },
	{ key: 'TAX', label: 'Thuế' },
];
const LIST_TEXT_COL = [
	'Tên',
	'Tháng BC',
	'Năm BC',
	'Công ty'
];

export async function loadDataCraw(type, templateData) {
	let data = [];
	if (type === 'KQKD_SP') {
		data = await calKQKDSP();
	}
	if (type === 'KQKD_TQ') {
		data = await calKQKDTQ();
	}
	if (type === 'KQKD_DV') {
		data = await calKQKDDV();
	}
	if (type === 'CDTC') {
		data = await calCDTC();
	}
	await createDataCraw(data, templateData);
	return data;
}

async function calKQKDSP() {
	let data = await getAllSoKeToan();
	let listProduct = await getAllProduct();
	data = data.sort((a, b) => b.id - a.id).filter((e) => e.pl_type !== null && e.pl_type !== '');
	for (let i = 0; i < data.length; i++) {
		for (let j = 0; j < listProduct.length; j++) {
			let unitCode = listProduct[j].code;
			data[i][unitCode] = null;
		}
	}
	for (let i = 0; i < data.length; i++) {
		if (data[i].PBSP !== null) {
			let parsedPBSP = JSON.parse(data[i].PBSP);
			parsedPBSP.teams.forEach((team) => {
				data[i][team.team] = +team.tien || 0;
			});
		}
		if (data[i].product2 !== null && data[i].product2 !== '' && (!data[i].CCBSP || data[i].CCBSP === '')) {
			data[i][data[i].product2] = +data[i].pl_value || 0;
		}
	}
	let convertData = transformData(listProduct.map(e => e.code), data);
	return renameFields(convertData);
}

async function calKQKDTQ() {
	let data = await getAllSoKeToan();
	let listProduct = await getAllCompany();
	data = data.sort((a, b) => b.id - a.id).filter((e) => e.pl_type !== null && e.pl_type !== '');
	let convertData = transformCompanyData(listProduct.map(e => e.code), data);
	return renameFields(convertData);
}

async function calKQKDDV() {
	let data = await getAllSoKeToan();
	let listProduct = await getAllUnits();
	data = data.sort((a, b) => b.id - a.id).filter((e) => e.pl_type !== null && e.pl_type !== '');
	for (let i = 0; i < data.length; i++) {
		for (let j = 0; j < listProduct.length; j++) {
			let unitCode = listProduct[j].code;
			data[i][unitCode] = null;
		}
	}
	for (let i = 0; i < data.length; i++) {
		if (data[i].PBDV !== null) {
			let parsedPBSP = JSON.parse(data[i].PBDV);
			parsedPBSP.teams.forEach((team) => {
				data[i][team.team] = +team.tien || 0;
			});
		}
		if (data[i].unit_code2 !== null && data[i].unit_code2 !== '' && (!data[i].CCPBDV || data[i].CCPBDV === '')) {
			data[i][data[i].unit_code2] = +data[i].pl_value || 0;
		}
	}
	let convertData = transformData(listProduct.map(e => e.code), data);
	return renameFields(convertData);
}


function transformData(listProduct, data) {
	const map = new Map();
	const plTypeKeys = LIST_PL_TYPE.map(t => t.key);

	for (let item of data) {
		for (let product of listProduct) {
			if (item[product] !== undefined) {
				const key = `${product}_${item.month}_${item.year}`;
				if (!map.has(key)) {
					// Tạo object với tên sản phẩm, tháng, năm và khởi tạo các pl_type
					const newItem = {
						name: product,
						month: parseInt(item.month),
						year: parseInt(item.year),
					};
					plTypeKeys.forEach(type => newItem[type] = 0);
					map.set(key, newItem);
				}

				const record = map.get(key);
				if (plTypeKeys.includes(item.pl_type)) {
					record[item.pl_type] += item[product];
				}
			}
		}
	}

	return Array.from(map.values());
}

async function createDataCraw(data, templateData) {
	try {
		if (data && data[0] && templateData && templateData.id) {
			await deleteTemplateColByTableId(templateData.id);
			let listCol = Object.keys(data[0]);
			for (let item of listCol) {
				await createTemplateColumn({
					tableId: templateData.id,
					columnName: item,
					columnType: LIST_TEXT_COL.includes(item) ? 'text' : 'number',
					show: true,
				});
			}
			await deleteTemplateRowByTableId(templateData.id);
			for (let item of data) {
				const dataCreate = {
					tableId: templateData.id,
					data: [item],
				};

				await createBathTemplateRow(dataCreate);
			}
		}
	} catch (error) {
		console.error('Error creating new column:', error);
		toast.error('Đã xay ra lỗi khi tạo cột mới.');
	}
}

function renameFields(data) {
	const keyMap = {
		name: 'Tên',
		month: 'Tháng BC',
		year: 'Năm BC',
	};

	// Map từ key (VD: DT, CF) sang label (VD: Doanh thu, Chi phí)
	LIST_PL_TYPE.forEach(item => {
		keyMap[item.key] = item.label;
	});

	return data.map(row => {
		const newRow = {};
		for (let key in row) {
			const newKey = keyMap[key] || key; // Nếu không có map thì giữ nguyên
			newRow[newKey] = row[key];
		}
		return newRow;
	});
}

function transformCompanyData(listCompany, data) {
	const resultMap = new Map();

	// Loop qua từng dòng dữ liệu gốc
	for (const row of data) {
		const { month, year, company, pl_type, pl_value } = row;

		// Bỏ qua nếu company không nằm trong danh sách
		if (!listCompany.includes(company)) continue;

		const key = `${company}-${month}-${year}`;
		if (!resultMap.has(key)) {
			resultMap.set(key, {
				name: company,
				month: Number(month),
				year: Number(year),
			});
		}

		const target = resultMap.get(key);
		target[pl_type] = (target[pl_type] || 0) + (+pl_value);
	}

	// Tạo mảng kết quả đầy đủ cho mỗi công ty + tháng + năm
	const result = [];

	for (const name of listCompany) {
		for (let month = 1; month <= 12; month++) {
			for (const year of [...new Set(data.map(d => Number(d.year)))]) {
				const key = `${name}-${month}-${year}`;
				const row = resultMap.get(key) || {
					name,
					month,
					year,
				};

				// Đảm bảo đủ các field DT, CF, v.v.
				LIST_PL_TYPE.forEach(type => {
					if (!(type.key in row)) {
						row[type.key] = 0;
					}
				});

				result.push(row);
			}
		}
	}

	return result;
}


async function calCDTC() {
	let vasList = await getAllVas();
	vasList = vasList.filter(e => e.consol?.toLowerCase() == 'consol');
	let listCompany = await getAllCompany();
	const years = [...new Set(vasList.map(d => d.year))];
	let result = []
	for (let company of listCompany) {
		let vasListCompany = vasList.filter(e => e.company == company.code);
		for (let year of years) {
			let vasListYear = vasListCompany.filter(e => e.year == year);
			let rowDataList = loadBCCCTC(vasListYear, 12);
			rowDataList = rowDataList.filter(r => !r.refercode.includes('.'));
			rowDataList = rowDataList.map(e => {
				return { ...e, year, company: company.code };
			});
			result.push(...rowDataList)
		}
	}
	return renameFieldsCDTC(transformDataCDTC(listCompany.map(e => e.code), result));
}

function transformDataCDTC(listCompany, data) {
	const result = [];

	for (let company of listCompany) {
		const companyData = data.filter(item => item.company === company);

		// Lấy các năm có trong dữ liệu của công ty này
		const years = [...new Set(companyData.map(d => d.year))];

		for (let year of years) {
			for (let month = 1; month <= 12; month++) {
				const monthKey = `t${month - 1}_tien`;

				const row = {
					month,
					year,
					company,
				};

				// Duyệt qua từng dòng theo từng header và gán vào row
				for (let item of companyData) {
					row[item.header] = item[monthKey] ?? 0;
				}

				result.push(row);
			}
		}
	}

	return result;
}


function renameFieldsCDTC(data) {
	const keyMap = {
		name: 'Tên',
		month: 'Tháng BC',
		year: 'Năm BC',
		company: 'Công ty'
	};

	return data.map(row => {
		const newRow = {};
		for (let key in row) {
			const newKey = keyMap[key] || key; // Nếu không có map thì giữ nguyên
			newRow[newKey] = row[key];
		}
		return newRow;
	});
}
