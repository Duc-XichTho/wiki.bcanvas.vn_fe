import {getAllTemplateSheetTable, getTemplateRow} from "../apis/templateSettingService.jsx";
import {getAllKmf} from "../apisKTQT/kmfService.jsx";
import {getAllKmns} from "../apisKTQT/kmnsService.jsx";
import {getAllUnits} from "../apisKTQT/unitService.jsx";
import {getAllProject} from "../apisKTQT/projectService.jsx";
import {getAllProduct} from "../apisKTQT/productService.jsx";
import {getAllKenh} from "../apisKTQT/kenhService.jsx";
import {getAllVendor} from "../apisKTQT/vendorService.jsx";
const danhMucValues = [
    {value: 'KQKD', getApi: getAllKmf},
    {value: 'KMTC', getApi: getAllKmns},
    {value: 'DV', getApi: getAllUnits},
    {value: 'VV', getApi: getAllProject},
    {value: 'SP', getApi: getAllProduct},
    {value: 'KENH', getApi: getAllKenh},
    {value: 'KH', getApi: getAllVendor}
];

export async function getValidateData(selectedItem) {
    if (!selectedItem) return;

    const {primarySource, checkingSource} = selectedItem;

    if (!primarySource || !checkingSource) {
        console.warn("Thiếu dữ liệu primarySource hoặc checkingSource");
        return;
    }

    const primaryData = await getDataForSource(primarySource);
    const checkingData = await getDataForSource(checkingSource);
    if (!primaryData || !checkingData) {
        console.warn("Không có dữ liệu để so sánh");
        return;
    }

    const primaryColumn = primarySource.cot_du_lieu;
    const checkingColumn = checkingSource.cot_du_lieu;

    const uniqueCheckingValues = [...new Set(checkingData.map(item =>
        item[checkingColumn] ? item[checkingColumn].toString() : ""))];


    const result = markExistence(primaryData, checkingData, primaryColumn, checkingColumn);

    return {
        uniqueCheckingValues,
        result,
        selectedItem
    }
}
async function getDataForSource(source) {
    if (!source) return null;

    if (source.type === "Template") {
        return await getTemplateData(source.id);
    } else {
        const data = await getDanhMucData(source.bo_du_lieu);
        return data
    }
}

async function getTemplateData(sourceId) {
    try {
        const templateSheets = await getAllTemplateSheetTable();
        const matchingSheet = templateSheets.find(sheet => sheet.fileNote_id === sourceId);

        if (matchingSheet) {
            const templateRowDataResponse = await getTemplateRow(matchingSheet.id);
            const templateRowData = templateRowDataResponse.rows || [];
            return templateRowData.map(item => item.data);
        } else {
            console.warn("Không tìm thấy sheet phù hợp với source ID:", sourceId);
            return null;
        }
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu Template:", error);
        return null;
    }
}

async function getDanhMucData(boDuLieu) {
    try {
        if (!boDuLieu) {
            console.warn("Không có bộ dữ liệu để lấy");
            return null;
        }

        const danhMuc = danhMucValues.find(item => item.value === boDuLieu);

        if (!danhMuc) {
            console.warn("Bộ dữ liệu không hợp lệ:", boDuLieu);
            return null;
        }

        return await danhMuc.getApi();
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu DanhMuc:", error);
        return null;
    }
}

function markExistence(primaryData, checkingData, primaryColumn, checkingColumn) {
    const checkingValues = new Set(checkingData.map(item => item[checkingColumn]));
    return primaryData.map(item => ({
        ...item,
        existsInChecking: checkingValues.has(item[primaryColumn])
    }));
}
