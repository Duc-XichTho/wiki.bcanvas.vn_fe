// Hàm xử lý cho công ty SOL
import {toast} from "react-toastify";
import {message} from "antd";
import {parseCurrencyInput} from "../../functionKTQT/formatMoney.js";
import {getAllKmns} from "../../../../apisKTQT/kmnsService.jsx";
import {getAllKmf} from "../../../../apisKTQT/kmfService.jsx";
import {getAllUnits} from "../../../../apisKTQT/unitService.jsx";
import {getAllProduct} from "../../../../apisKTQT/productService.jsx";
import {getAllProject} from "../../../../apisKTQT/projectService.jsx";
import {getAllVendor} from "../../../../apisKTQT/vendorService.jsx";
import {getAllTeam} from "../../../../apisKTQT/teamService.jsx";
import {createNewVas, getAllVas, updateVas} from "../../../../apisKTQT/vasService.jsx";
import {getAllDeal} from "../../../../apisKTQT/dealService.jsx";
import instance from "../../../../apis/axiosInterceptors.jsx";
import {createNewSoKeToan} from "../../../../apisKTQT/soketoanService.jsx";
import {load} from "@syncfusion/ej2-react-richtexteditor";

export const handleSOLCompany = (row) => {
    let so_tien = parseFloat(row.so_tien);
    let tk_no = row.tk_no + '';
    let tk_co = row.tk_co + '';

    if (tk_no || tk_co) {
        if (tk_no.startsWith("91") || tk_co.startsWith("91")) {
            row.pl_type = "KC";
        } else if (tk_no.startsWith("515") || tk_co.startsWith("515")) {
            row.pl_type = "DTTC";
        } else if (tk_no.startsWith("51") || tk_co.startsWith("51")) {
            row.pl_type = "DT";
        } else if (tk_no.startsWith("71") || tk_co.startsWith("71")) {
            row.pl_type = "DTK";
        } else if (tk_no.startsWith("635") || tk_co.startsWith("635")) {
            row.pl_type = "CFTC";
        } else if (tk_no.startsWith('641') || tk_co.startsWith('641')) {
            row.pl_type = 'CFBH';
        } else if (tk_no.startsWith('642') || tk_co.startsWith('642')) {
            row.pl_type = 'CFQL';
        } else if (tk_no.startsWith('632') || tk_co.startsWith('632') || tk_no.startsWith('62') || tk_co.startsWith('62')) {
            row.pl_type = 'GV';
        } else if (tk_no.startsWith("52") || tk_co.startsWith("52") || tk_no.startsWith("6") || tk_co.startsWith("6")) {
            row.pl_type = "CF";
        } else if (tk_no.startsWith("81") || tk_co.startsWith("81")) {
            row.pl_type = "CFK";
        } else if (tk_no.startsWith("82") || tk_co.startsWith("82")) {
            row.pl_type = "Tax";
        } else {
            row.pl_type = "";
        }

        if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
            row.cf_Check = "";
        } else if (tk_no.startsWith("11")) {
            row.cf_Check = "Cashin";
        } else if (tk_co.startsWith("11")) {
            row.cf_Check = "Cashout";
        } else {
            row.cf_Check = "";
        }

        if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_co.startsWith('51') || tk_co.startsWith('7'))) {
            row.pl_value = so_tien;
        } else if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_no.startsWith('51') || tk_co.startsWith('7'))) {
            row.pl_value = -so_tien;
        } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_co.startsWith('52') || tk_co.startsWith('6') || tk_co.startsWith('8'))) {
            row.pl_value = so_tien;
        } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_no.startsWith('52') || tk_no.startsWith('6') || tk_no.startsWith('8'))) {
            row.pl_value = -so_tien;
        } else {
            row.pl_value = "";
        }

        if (row.cf_Check === "Cashin") {
            row.cash_value = so_tien;
        } else if (row.cf_Check === "Cashout") {
            row.cash_value = -so_tien;
        } else {
            row.cash_value = "";
        }
    }
};

// Hàm xử lý cho các công ty khác ngoài SOL
export const handleOtherCompanies = (row) => {
    let so_tien = parseFloat(row.so_tien);
    let tk_no = row.tk_no + '';
    let tk_co = row.tk_co + '';

    if (tk_no && tk_co) {
        if (tk_no.startsWith("91") || tk_co.startsWith("91")) {
            row.pl_type = "KC";
        } else if (tk_no.startsWith("515") || tk_co.startsWith("515")) {
            row.pl_type = "DTTC";
        } else if (tk_no.startsWith("51") || tk_co.startsWith("51")) {
            row.pl_type = "DT";
        } else if (tk_no.startsWith("71") || tk_co.startsWith("71")) {
            row.pl_type = "DTK";
        } else if (tk_no.startsWith("635") || tk_co.startsWith("635")) {
            row.pl_type = "CFTC";
        } else if (tk_no.startsWith('641') || tk_co.startsWith('641')) {
            row.pl_type = 'CFBH';
        } else if (tk_no.startsWith('642') || tk_co.startsWith('642')) {
            row.pl_type = 'CFQL';
        } else if (tk_no.startsWith('632') || tk_co.startsWith('632') || tk_no.startsWith('62') || tk_co.startsWith('62')) {
            row.pl_type = 'GV';
        } else if (tk_no.startsWith("52") || tk_co.startsWith("52") || tk_no.startsWith("6") || tk_co.startsWith("6")) {
            row.pl_type = "CF";
        } else if (tk_no.startsWith("81") || tk_co.startsWith("81")) {
            row.pl_type = "CFK";
        } else if (tk_no.startsWith("82") || tk_co.startsWith("82")) {
            row.pl_type = "Tax";
        } else {
            row.pl_type = "";
        }

        if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
            row.cf_Check = "";
        } else if (tk_no.startsWith("11")) {
            row.cf_Check = "Cashin";
        } else if (tk_co.startsWith("11")) {
            row.cf_Check = "Cashout";
        } else {
            row.cf_Check = "";
        }

        if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_co.startsWith('51') || tk_co.startsWith('7'))) {
            row.pl_value = so_tien;
        } else if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_no.startsWith('51') || tk_co.startsWith('7'))) {
            row.pl_value = -so_tien;
        } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_co.startsWith('52') || tk_co.startsWith('6') || tk_co.startsWith('8'))) {
            row.pl_value = so_tien;
        } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_no.startsWith('52') || tk_no.startsWith('6') || tk_no.startsWith('8'))) {
            row.pl_value = -so_tien;
        } else {
            row.pl_value = "";
        }

        if (row.cf_Check === "Cashin") {
            row.cash_value = so_tien;
        } else if (row.cf_Check === "Cashout") {
            row.cash_value = -so_tien;
        } else {
            row.cash_value = "";
        }
    }
};

export const handleCGCompanies = (row) => {
    row.so_tien = parseCurrencyInput(row.ps_no) - parseCurrencyInput(row.ps_co)
    let so_tien = parseFloat(row.so_tien);
    let tk_no = row.tk_no + '';
    let tk_co = row.tk_co + '';

    if (tk_no) {
        // Update PL Type based on the updated logic
        if (tk_no.startsWith("911") || tk_co.startsWith('911')) {
            row.pl_type = "KC";
        } else if (tk_no.startsWith("511")) {
            row.pl_type = "DT";
        } else if (tk_no.startsWith("62") || tk_no.startsWith("63")) {
            row.pl_type = "GV";
        } else if (tk_no.startsWith("52") || tk_no.startsWith("641")) {
            row.pl_type = "CFBH";
        } else if (tk_no.startsWith("642")) {
            row.pl_type = "CFQL";
        } else if (tk_no.startsWith("635")) {
            row.pl_type = "CFTC";
        } else if (tk_no.startsWith("515")) {
            row.pl_type = "DTTC";
        } else if (tk_no.startsWith("71")) {
            row.pl_type = "DTK";
        } else if (tk_no.startsWith("811")) {
            row.pl_type = "CFK";
        } else if (tk_no.startsWith("821")) {
            row.pl_type = "TAX";
        } else {
            row.pl_type = "";
        }

        // Update PL Value based on PL Type
        if (["DT", "DTK", "DTTC", "GV", "CFK", "CFTC", "CFBH", "CFQL", "TAX"].includes(row.pl_type)) {
            row.pl_value = -so_tien;
        } else {
            row.pl_value = "";
        }

        // Update Cash Value based on cash flow check
        if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
            row.cash_value = 0;
        } else if (tk_no.startsWith("11")) {
            row.cash_value = so_tien;
        } else {
            row.cash_value = "";
        }
    }
};
const processRow = async (row, apiUrl) => {


    // Gọi hàm xử lý theo từng loại công ty
    // if (company === 'SOL') {
    //     handleSOLCompany(row);
    // } else {
    //     handleOtherCompanies(row);
    // }
    handleCGCompanies(row)
    // Gửi bản ghi đã xử lý tới server
    await createNewSoKeToan(row);
};

export const uploadSoKeToan = async (cleanedData, setIsLoading, setUploadProgress) => {
    setIsLoading(true)
    const fetchAllLists = async () => {
        const kmfList = await getAllKmf();
        const kmnsList = await getAllKmns();
        const unitList = await getAllUnits();
        const projectList = await getAllProject();
        const productList = await getAllProduct();
        const vendorList = await getAllVendor();
        const teamList = await getAllTeam();
        const vasList = await getAllVas();
        // const dealList = await getAllDeal();
        const dealList = [];

        return {kmfList, kmnsList, unitList, projectList, productList, vendorList, teamList, vasList, dealList};
    };

    let {
        kmfList,
        kmnsList,
        unitList,
        projectList,
        productList,
        vendorList,
        teamList,
        vasList,
        dealList
    } = await fetchAllLists();

    const uniqueKMFs = new Set();
    const uniqueKMNSs = new Set();
    const uniqueUnits = new Set();
    const uniqueProjects = new Set();
    const uniqueProducts = new Set();
    const uniqueVendors = new Set();
    const uniqueTeams = new Set();
    const uniqueVAS = new Set();
    const uniqueDeal = new Set();

    cleanedData.forEach(row => {
        row.so_tien = parseFloat(row.so_tien) || 0
        // row.so_tien = parseCurrencyInput(row.ps_no) - parseCurrencyInput(row.ps_co)

        row.consol = 'CONSOL'

        if (row.company != null && row.company !== "" && row.company !== undefined) {
            if (row.unit_code != null && row.unit_code !== "" && row.unit_code !== undefined) {
                row.unit_code2 = `${row.unit_code}-${row.company}`
                if (row.product != null && row.product !== "" && row.product !== undefined) {
                    row.product2 = `${row.product}-${row.company}-${row.unit_code}`
                }
                if (row.deal != null && row.deal !== "" && row.deal !== undefined) {
                    row.deal2 = `${row.deal}-${row.company}-${row.unit_code}`
                }
            }

        }
        if (row.kmf) uniqueKMFs.add(row.kmf);
        if (row.kmns) uniqueKMNSs.add(row.kmns);
        if (row.unit_code2) uniqueUnits.add(row.unit_code2);
        if (row.project) uniqueProjects.add(row.project);
        if (row.product2) uniqueProducts.add(row.product2);
        if (row.deal2) uniqueProducts.add(row.deal2);
        if (row.vender) uniqueVendors.add(row.vender);
        if (row.team_code) uniqueTeams.add(row.team_code);
        if (row.tk_no) uniqueVAS.add(`${row.tk_no}^${row.year}`);
        if (row.tk_co) uniqueVAS.add(`${row.tk_co}^${row.year}`);
    });

    const addNewEntities = async (row) => {

        const newKMFsSet = new Set();
        const newKMNSsSet = new Set();
        const newUnitsSet = new Set();
        const newProjectsSet = new Set();
        const newProductsSet = new Set();
        const newDealsSet = new Set();
        const newVendorsSet = new Set();
        const newTeamsSet = new Set();
        const newVASSet = new Set();

        Array.from(uniqueKMFs).forEach(kmf => {
            if (!kmfList.some(existingKMF => existingKMF.name == kmf && existingKMF.company === row.company)) {
                if (kmf !== null && kmf !== undefined && kmf !== '') {
                    newKMFsSet.add(kmf);
                }
            }
        });

        Array.from(uniqueKMNSs).forEach(kmns => {
            if (!kmnsList.some(existingKMNS => existingKMNS.name == kmns && existingKMNS.company === row.company)) {
                if (kmns !== null && kmns !== undefined && kmns !== '') {
                    newKMNSsSet.add(kmns);
                }
            }
        });

        Array.from(uniqueUnits).forEach(unit => {
            if (!unitList.some(existingUnit => existingUnit.code == unit && existingUnit.company === row.company)) {
                let name = unit.split('-')[0]
                if (name !== null && name !== undefined && name !== '') {
                    newUnitsSet.add(unit);
                }
            }
        });

        Array.from(uniqueProjects).forEach(project => {
            if (!projectList.some(existingProject => existingProject.project_name == project && existingProject.company === row.company)) {
                if (project !== null && project !== undefined && project !== '') {
                    newProjectsSet.add(project);
                }
            }
        });

        Array.from(uniqueProducts).forEach(product => {
            if (!productList.some(existingProduct => existingProduct.code == product && existingProduct.company === row.company)) {
                let name = product.split('-')[0]
                if (name !== null && name !== undefined && name !== '') {
                    newProductsSet.add(product);
                }
            }
        });
        Array.from(uniqueDeal).forEach(deal => {
            if (!dealList.some(existingDeal => existingDeal.code == deal && existingDeal.company === row.company)) {
                let name = deal.split('-')[0]
                if (name !== null && name !== undefined && name !== '') {
                    newProductsSet.add(deal);
                }
            }
        });

        Array.from(uniqueVendors).forEach(vendor => {
            if (!vendorList.some(existingVendor => existingVendor.name == vendor && existingVendor.company === row.company)) {
                if (vendor !== null && vendor !== undefined && vendor !== '') {
                    newVendorsSet.add(vendor);
                }
            }
        });

        Array.from(uniqueTeams).forEach(team => {
            if (!teamList.some(existingTeam => existingTeam.name == team && existingTeam.company === row.company)) {
                if (team !== null && team !== undefined && team !== '') {
                    newTeamsSet.add(team);
                }
            }
        });

        Array.from(uniqueVAS).forEach(vas => {

            if (!vasList.some(existingVAS => existingVAS.ma_tai_khoan == vas.split('^')[0] && existingVAS.company === row.company && existingVAS.year === vas.split('^')[1])) {
                if (vas !== null && vas !== undefined && vas !== '') {
                    newVASSet.add(vas);
                }
            }
        });
        const BASE_URL = import.meta.env.VITE_API_URL
        if (newKMFsSet.size > 0) {
            for (const kmf of newKMFsSet) {
                await instance.post(`${BASE_URL}/api/ktqt-kmf`, {
                    name: kmf,
                    dp: kmf,
                    company: row.company,
                });
            }
            kmfList = await getAllKmf();
        }

        if (newKMNSsSet.size > 0) {
            for (const kmns of newKMNSsSet) {
                await instance.post(`${BASE_URL}/api/ktqt-kmns`, {
                    name: kmns,
                    dp: kmns,
                    company: row.company,
                });
            }
            kmnsList = await getAllKmns();
        }

        if (newUnitsSet.size > 0) {
            for (const unit of newUnitsSet) {
                let unitIn4 = unit.split('-')
                await instance.post(`${BASE_URL}/api/ktqt-unit`, {
                    code: unit,
                    name: unitIn4[0],
                    dp: unitIn4[0],
                    company: row.company,
                });
            }
            unitList = await getAllUnits();
        }

        if (newProjectsSet.size > 0) {
            for (const project of newProjectsSet) {
                await instance.post(`${BASE_URL}/api/ktqt-project`, {
                    project_name: project,
                    dp: project,
                    project_viet_tat: project,
                    company: row.company,
                });
            }
            projectList = await getAllProject();
        }

        if (newProductsSet.size > 0) {
            for (const product of newProductsSet) {
                let productIn4 = product.split('-')
                await instance.post(`${BASE_URL}/api/ktqt-product`, {
                    code: product,
                    name: productIn4[0],
                    dp: productIn4[0],
                    unit_code: productIn4[2],
                    company: row.company,
                });
            }
            productList = await getAllProduct();
        }

        if (newDealsSet.size > 0) {
            for (const deal of newDealsSet) {
                let dealIn4 = deal.split('-')
                await instance.post(`${BASE_URL}/api/ktqt-deal`, {
                    code: deal,
                    name: dealIn4[0],
                    dp: dealIn4[0],
                    unit_code: dealIn4[2],
                    company: row.company,
                });
            }
            productList = await getAllProduct();
        }

        if (newVendorsSet.size > 0) {
            for (const vendor of newVendorsSet) {
                await instance.post(`${BASE_URL}/api/ktqt-vendor`, {
                    name: vendor,
                    dp: vendor,
                    company: row.company,
                });
            }
            vendorList = await getAllVendor();
        }

        if (newTeamsSet.size > 0) {
            for (const team of newTeamsSet) {
                await instance.post(`${BASE_URL}/api/ktqt-team`, {
                    name: team,
                    dp: team,
                    code: team,
                    // unit_code: row.unit_code,
                    company: row.company,
                });
            }
            teamList = await getAllTeam();
        }

        if (newVASSet.size > 0) {
            for (const vas of newVASSet) {
                await instance.post(`${BASE_URL}/api/ktqt-vas`, {
                    ma_tai_khoan: vas.split('^')[0],
                    dp: vas.split('^')[0],
                    company: row.company,
                    year: vas.split('^')[1],
                    consol:'CONSOL',
                });
            }
            vasList = await getAllVas();
        }
    };


    const totalRows = cleanedData.length;
    let uploadedRows = 0;

    for (let i = 0; i < cleanedData.length; i++) {
        const row = cleanedData[i];

        // Thêm entities mới trước khi xử lý dòng
        await addNewEntities(row);

        // Xử lý dòng hiện tại
        await handleCGCompanies(row)
        await processRow(row);
        uploadedRows++;
        const progress = Math.round((uploadedRows / totalRows) * 100);
        setUploadProgress(progress)
    }
    setIsLoading(false)
    message.success("Toàn bộ dữ liệu đã được tải lên thành công!");
};

export const uploadVas = async (mappedData, setLoading, setUploadProgress) => {
    setLoading(true);
    const totalRows = mappedData.length;
    let uploadedRows = 0;
    const getVas = await getAllVas(); // Fetch all VAS data from the database
    const mappedYears = new Set(mappedData.map(e => parseInt(e.year)));

    // Filter records in DB matching company and year with import file
    const existingVas = getVas.filter(record => mappedYears.has(parseInt(record.year)));

    // Step 1: Update all records with matching year and company, set t1_open_* to 0
    const updatePromises = [];
    for (let i = 0; i < existingVas.length; i++) {
        const record = existingVas[i];
        record.t1_open_no = 0;
        record.t1_open_co = 0;
        record.t1_open_net = 0; // This will be updated later
        await updateVas(record);
    }
    await Promise.all(updatePromises);

    const createOrUpdatePromises = [];

    // Validate companies for new records
    const validCompanies = new Set(existingVas.map(record => record.company.trim()));
    for (let i = 0; i < totalRows; i++) {
        const row = mappedData[i];

        // Clean input data before checking (trim whitespace and convert types if necessary)
        row.ma_tai_khoan = row.ma_tai_khoan.toString();
        const cleanedTenTaiKhoan = typeof row.ma_tai_khoan === 'string' ? row.ma_tai_khoan.trim() : '';
        const cleanedYear = parseFloat(row.year);
        const cleanedCompany = row?.company?.trim();

        // Validate if the company exists in existing records
        if (!validCompanies.has(cleanedCompany)) {
            // console.warn(`Company "${cleanedCompany}" does not exist in existing records. Skipping row:`);
            continue;
        }

        // Check if a record exists matching `ma_tai_khoan`, `year`, `company`
        const existingRecord = existingVas.find(record => {
            const recordTenTaiKhoan = typeof record.ma_tai_khoan === 'string' ? record.ma_tai_khoan.trim() : '';
            const recordYear = parseInt(record.year);
            const recordCompany = record.company?.trim();

            return recordTenTaiKhoan === cleanedTenTaiKhoan && recordYear === cleanedYear && recordCompany === cleanedCompany;
        });

        if (existingRecord) {
            // Update existing record
            existingRecord.t1_open_no = parseFloat(row.t1_open_no || 0);
            existingRecord.t1_open_co = parseFloat(row.t1_open_co || 0);
            existingRecord.t1_open_net = parseFloat(row.t1_open_no || 0) - parseFloat(row.t1_open_co || 0);
            existingRecord.chu_thich_tai_khoan = row.chu_thich_tai_khoan;
            existingRecord.phan_loai = row.phan_loai;
            existingRecord.consol = row.consol;
            existingRecord.dp = row.dp;
            createOrUpdatePromises.push(updateVas(existingRecord));
        } else {
            // If no matching record exists for ma_tai_khoan and year for current company, create new
            if (cleanedTenTaiKhoan && cleanedYear) {

                row.t1_open_no = parseFloat(row.t1_open_no || 0);
                row.t1_open_co = parseFloat(row.t1_open_co || 0);
                row.t1_open_net = parseFloat(row.t1_open_no || 0) - parseFloat(row.t1_open_co || 0); // Calculate t1_open_net for new records
                row.year = cleanedYear;
                createOrUpdatePromises.push(createNewVas(row)); // Create new record
            }
        }

        // Calculate upload progress
        uploadedRows++;
        const progress = Math.round((uploadedRows / totalRows) * 100);
        setUploadProgress(progress)

    }

    // Wait for all updates or creations to complete
    await Promise.all(createOrUpdatePromises);
    setLoading(false);
};
