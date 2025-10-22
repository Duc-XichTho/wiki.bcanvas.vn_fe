import { getAllProduct } from '../../../apisKTQT/productService.jsx';
import { getAllKenh } from '../../../apisKTQT/kenhService.jsx';
import { getAllKmf } from '../../../apisKTQT/kmfService.jsx';
import { getAllProject } from '../../../apisKTQT/projectService.jsx';
import { getAllVendor } from '../../../apisKTQT/vendorService.jsx';
import { getAllUnits } from '../../../apisKTQT/unitService.jsx';
import { createBulkNewSoKeToan } from '../../../apisKTQT/soketoanService.jsx';
import { handleCGCompanies } from '../popUp/importFIle/hamTinh.js';
import instance from '../../../apis/axiosInterceptors.jsx';
import { message } from 'antd';

// Helpers to correctly extract names and unit_code from composite codes
export const extractNameFromUnitCode = (code, company) => {
	if (typeof code !== 'string') return '';
	const suffix = `-${company}`;
	if (company && code.endsWith(suffix)) return code.slice(0, -suffix.length);
	const parts = code.split('-');
	return parts.length > 1 ? parts.slice(0, -1).join('-') : code;
};

export const extractNameFromComposite = (code) => {
	if (typeof code !== 'string') return '';
	const parts = code.split('-');
	return parts.length > 2 ? parts.slice(0, -2).join('-') : (parts[0] || code);
};

export const extractUnitCodeFromComposite = (code, company) => {
	if (typeof code !== 'string') return '';
	if (!company) return '';
	const marker = `-${company}-`;
	const idx = code.indexOf(marker);
	if (idx === -1) return '';
	return code.slice(idx + marker.length);
};

export const createSKTDM = async (cleanedData) => {
	cleanedData.forEach(item => {
		item.diengiai = `${item.phan_loai} ${item.id} - ${item.diengiai}`
		item.idKTQT = item.id
		item.id = null
		item.daHopNhat = true
	})
	let company = cleanedData[0]?.company
	let data = cleanedData;
	const BASE_URL = import.meta.env.VITE_API_URL;

	const fetchAllLists = async () => {
		const kmfList = await getAllKmf();
		const unitList = await getAllUnits();
		const projectList = await getAllProject();
		const productList = await getAllProduct();
		const vendorList = await getAllVendor();
		const kenhList = await getAllKenh();

		return {
			kmfList,
			unitList,
			projectList,
			productList,
			vendorList,
			kenhList,
		};
	};

	let {
		kmfList,
		unitList,
		projectList,
		productList,
		vendorList,
		kenhList,
	} = await fetchAllLists();

	const uniqueKMFs = new Set();
	const uniqueUnits = new Set();
	const uniqueProjects = new Set();
	const uniqueProducts = new Set();
	const uniqueVendors = new Set();
	const uniqueKenh = new Set();

	data.forEach(row => {
		row.company = company;
		row.consol = 'CONSOL';
		if (row.company != null && row.company !== '' && row.company !== undefined) {
			if (row.unit_code != null && row.unit_code !== '' && row.unit_code !== undefined) {
				row.unit_code2 = `${row.unit_code}-${company}`;
				if (row.product != null && row.product !== '' && row.product !== undefined) {
					row.product2 = `${row.product}-${company}-${row.unit_code}`;
				}
				if (row.kenh != null && row.kenh !== '' && row.kenh !== undefined) {
					row.kenh2 = `${row.kenh}-${company}-${row.unit_code}`;
				}
				if (row.project != null && row.project !== '' && row.project !== undefined) {
					row.project2 = `${row.project}-${company}-${row.unit_code}`;
				}
			}

		}
		if (row.kmf) uniqueKMFs.add(row.kmf);
		if (row.unit_code2) uniqueUnits.add(row.unit_code2);
		if (row.project2) uniqueProjects.add(row.project2);
		if (row.product2) uniqueProducts.add(row.product2);
		if (row.kenh2) uniqueKenh.add(row.kenh2);
		if (row.vender) uniqueVendors.add(row.vender);
	});


	const newKMFsSet = new Set();
	const newUnitsSet = new Set();
	const newProjectsSet = new Set();
	const newProductsSet = new Set();
	const newVendorsSet = new Set();
	const newKenhSet = new Set();


	Array.from(uniqueKMFs).forEach(kmf => {
		if (!kmfList.some(existingKMF => existingKMF.name == kmf && existingKMF.company == company)) {
			if (kmf !== null && kmf !== undefined && kmf !== '') {
				newKMFsSet.add(kmf);
			}
		}
	});

	Array.from(uniqueUnits).forEach(unit => {
		if (!unitList.some(existingUnit => existingUnit.code == unit && existingUnit.company == company)) {
			const name = extractNameFromUnitCode(unit, company);
			if (name !== null && name !== undefined && name !== '') {
				newUnitsSet.add(unit);
			}
		}
	});

	Array.from(uniqueProjects).forEach(project => {
		if (!projectList.some(existingProduct => existingProduct.code == project && existingProduct.company == company)) {
			const name = extractNameFromComposite(project);
			if (name !== null && name !== undefined && name !== '') {
				newProjectsSet.add(project);
			}
		}
	});

	Array.from(uniqueProducts).forEach(product => {
		if (!productList.some(existingProduct => existingProduct.code == product && existingProduct.company == company)) {
			const name = extractNameFromComposite(product);
			if (name !== null && name !== undefined && name !== '') {
				newProductsSet.add(product);
			}
		}
	});

	Array.from(uniqueKenh).forEach(kenh => {
		if (!kenhList.some(existingKenh => existingKenh.code == kenh && existingKenh.company == company)) {
			const name = extractNameFromComposite(kenh);
			if (name !== null && name !== undefined && name !== '') {
				newKenhSet.add(kenh);
			}

		}
	});

	// Array.from(uniqueDeal).forEach(deal => {
	//     if (!dealList.some(existingDeal => existingDeal.code == deal && existingDeal.company == company)) {
	//         let name = deal.split('-')[0]
	//         if (name !== null && name !== undefined && name !== '') {
	//             newProductsSet.add(deal);
	//         }
	//     }
	// });

	Array.from(uniqueVendors).forEach(vendor => {
		if (!vendorList.some(existingVendor => existingVendor.name == vendor && existingVendor.company == company)) {
			if (vendor !== null && vendor !== undefined && vendor !== '') {
				newVendorsSet.add(vendor);
			}
		}
	});

	if (newKMFsSet.size > 0) {
		for (const kmf of newKMFsSet) {
			await instance.post(`${BASE_URL}/api/ktqt-kmf`, {
				name: kmf,
				dp: kmf,
				company: company,
			});
		}
		kmfList = await getAllKmf();
	}

	if (newUnitsSet.size > 0) {
		for (const unit of newUnitsSet) {
			const unitName = extractNameFromUnitCode(unit, company);
			await instance.post(`${BASE_URL}/api/ktqt-unit`, {
				code: unit,
				name: unitName,
				dp: unitName,
				company: company,
			});
		}
		unitList = await getAllUnits();
	}

	if (newProjectsSet.size > 0) {
		for (const project of newProjectsSet) {
			const projectName = extractNameFromComposite(project);
			const unit_code = extractUnitCodeFromComposite(project, company);
			await instance.post(`${BASE_URL}/api/ktqt-project`, {
				code: project,
				name: projectName,
				dp: projectName,
				unit_code: unit_code,
				company: company,
			});
		}
		projectList = await getAllProject();
	}

	if (newProductsSet.size > 0) {
		for (const product of newProductsSet) {
			const productName = extractNameFromComposite(product);
			const unit_code = extractUnitCodeFromComposite(product, company);
			await instance.post(`${BASE_URL}/api/ktqt-product`, {
				code: product,
				name: productName,
				dp: productName,
				unit_code: unit_code,
				company: company,
			});
		}
		productList = await getAllProduct();
	}

	if (newKenhSet.size > 0) {
		for (const kenh of newKenhSet) {
			const kenhName = extractNameFromComposite(kenh);
			const unit_code = extractUnitCodeFromComposite(kenh, company);
			await instance.post(`${BASE_URL}/api/ktqt-kenh`, {
				code: kenh,
				name: kenhName,
				dp: kenhName,
				unit_code: unit_code,
				company: company,
			});
		}
		kenhList = await getAllKenh();
	}

	if (newVendorsSet.size > 0) {
		for (const vendor of newVendorsSet) {
			await instance.post(`${BASE_URL}/api/ktqt-vendor`, {
				name: vendor,
				dp: vendor,
				company: company,
			});
		}
		vendorList = await getAllVendor();
	}
	const batchSize = 1000;
	const processedData = data.map(row => {
		if (row.phan_loai === 'DT') {
			row.tk_no = 511;
			row.tk_co = 999;
			row.ps_co = row.so_tien;
			row.ps_no = 0;
		}
		if (row.phan_loai === 'GV') {
			row.tk_no = 632;
			row.tk_co = 999;
			row.ps_no = row.so_tien;
			row.ps_co = 0;
		}
		const processedRow = { ...row };
		handleCGCompanies(processedRow);
		return processedRow;
	});

	for (let i = 0; i < processedData.length; i += batchSize) {
		const batch = processedData.slice(i, Math.min(i + batchSize, processedData.length));
		await createBulkNewSoKeToan(batch);
	}
	message.success(`Đã thêm ${processedData.length} dòng vào sổ kế toán`)
};

export const createDM = async (cleanedData) => {
	let company = cleanedData[0]?.company
	let data = cleanedData;
	const BASE_URL = import.meta.env.VITE_API_URL;

	const fetchAllLists = async () => {
		const kmfList = await getAllKmf();
		const unitList = await getAllUnits();
		const projectList = await getAllProject();
		const productList = await getAllProduct();
		const vendorList = await getAllVendor();
		const kenhList = await getAllKenh();

		return {
			kmfList,
			unitList,
			projectList,
			productList,
			vendorList,
			kenhList,
		};
	};

	let {
		kmfList,
		unitList,
		projectList,
		productList,
		vendorList,
		kenhList,
	} = await fetchAllLists();

	const uniqueKMFs = new Set();
	const uniqueUnits = new Set();
	const uniqueProjects = new Set();
	const uniqueProducts = new Set();
	const uniqueVendors = new Set();
	const uniqueKenh = new Set();

	data.forEach(row => {
		row.company = company;
		if (row.company != null && row.company !== '' && row.company !== undefined) {
			if (row.unit_code != null && row.unit_code !== '' && row.unit_code !== undefined) {
				row.unit_code2 = `${row.unit_code}-${company}`;
				if (row.product != null && row.product !== '' && row.product !== undefined) {
					row.product2 = `${row.product}-${company}-${row.unit_code}`;
				}
				if (row.kenh != null && row.kenh !== '' && row.kenh !== undefined) {
					row.kenh2 = `${row.kenh}-${company}-${row.unit_code}`;
				}
				if (row.project != null && row.project !== '' && row.project !== undefined) {
					row.project2 = `${row.project}-${company}-${row.unit_code}`;
				}
			}

		}
		if (row.kmf) uniqueKMFs.add(row.kmf);
		if (row.unit_code2) uniqueUnits.add(row.unit_code2);
		if (row.project2) uniqueProjects.add(row.project2);
		if (row.product2) uniqueProducts.add(row.product2);
		if (row.kenh2) uniqueKenh.add(row.kenh2);
		if (row.vender) uniqueVendors.add(row.vender);
	});


	const newKMFsSet = new Set();
	const newUnitsSet = new Set();
	const newProjectsSet = new Set();
	const newProductsSet = new Set();
	const newVendorsSet = new Set();
	const newKenhSet = new Set();

	Array.from(uniqueKMFs).forEach(kmf => {
		if (!kmfList.some(existingKMF => existingKMF.name == kmf && existingKMF.company == company)) {
			if (kmf !== null && kmf !== undefined && kmf !== '') {
				newKMFsSet.add(kmf);
			}
		}
	});

	Array.from(uniqueUnits).forEach(unit => {
		if (!unitList.some(existingUnit => existingUnit.code == unit && existingUnit.company == company)) {
			const name = extractNameFromUnitCode(unit, company);
			if (name !== null && name !== undefined && name !== '') {
				newUnitsSet.add(unit);
			}
		}
	});

	Array.from(uniqueProjects).forEach(project => {
		if (!projectList.some(existingProduct => existingProduct.code == project && existingProduct.company == company)) {
			const name = extractNameFromComposite(project);
			if (name !== null && name !== undefined && name !== '') {
				newProjectsSet.add(project);
			}
		}
	});

	Array.from(uniqueProducts).forEach(product => {
		if (!productList.some(existingProduct => existingProduct.code == product && existingProduct.company == company)) {
			const name = extractNameFromComposite(product);
			if (name !== null && name !== undefined && name !== '') {
				newProductsSet.add(product);
			}
		}
	});

	Array.from(uniqueKenh).forEach(kenh => {
		if (!kenhList.some(existingKenh => existingKenh.code == kenh && existingKenh.company == company)) {
			const name = extractNameFromComposite(kenh);
			if (name !== null && name !== undefined && name !== '') {
				newKenhSet.add(kenh);
			}
		}
	});
	Array.from(uniqueVendors).forEach(vendor => {
		if (!vendorList.some(existingVendor => existingVendor.name == vendor && existingVendor.company == company)) {
			if (vendor !== null && vendor !== undefined && vendor !== '') {
				newVendorsSet.add(vendor);
			}
		}
	});

	if (newKMFsSet.size > 0) {
		for (const kmf of newKMFsSet) {
			await instance.post(`${BASE_URL}/api/ktqt-kmf`, {
				name: kmf,
				dp: kmf,
				company: company,
			});
		}
		kmfList = await getAllKmf();
	}

	if (newUnitsSet.size > 0) {
		for (const unit of newUnitsSet) {
			const unitName = extractNameFromUnitCode(unit, company);
			await instance.post(`${BASE_URL}/api/ktqt-unit`, {
				code: unit,
				name: unitName,
				dp: unitName,
				company: company,
			});
		}
		unitList = await getAllUnits();
	}

	if (newProjectsSet.size > 0) {
		for (const project of newProjectsSet) {
			const projectName = extractNameFromComposite(project);
			const unit_code = extractUnitCodeFromComposite(project, company);
			await instance.post(`${BASE_URL}/api/ktqt-project`, {
				code: project,
				name: projectName,
				dp: projectName,
				unit_code: unit_code,
				company: company,
			});
		}
		projectList = await getAllProject();
	}

	if (newProductsSet.size > 0) {
		for (const product of newProductsSet) {
			const productName = extractNameFromComposite(product);
			const unit_code = extractUnitCodeFromComposite(product, company);
			await instance.post(`${BASE_URL}/api/ktqt-product`, {
				code: product,
				name: productName,
				dp: productName,
				unit_code: unit_code,
				company: company,
			});
		}
		productList = await getAllProduct();
	}

	if (newKenhSet.size > 0) {
		for (const kenh of newKenhSet) {
			const kenhName = extractNameFromComposite(kenh);
			const unit_code = extractUnitCodeFromComposite(kenh, company);
			await instance.post(`${BASE_URL}/api/ktqt-kenh`, {
				code: kenh,
				name: kenhName,
				dp: kenhName,
				unit_code: unit_code,
				company: company,
			});
		}
		kenhList = await getAllKenh();
	}

	if (newVendorsSet.size > 0) {
		for (const vendor of newVendorsSet) {
			await instance.post(`${BASE_URL}/api/ktqt-vendor`, {
				name: vendor,
				dp: vendor,
				company: company,
			});
		}
		vendorList = await getAllVendor();
	}
};
