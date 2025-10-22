import {getTemplateRow} from "../../../../apis/templateSettingService.jsx";
import {getItemFromIndexedDB2} from "../../../KeToanQuanTri/storage/storageService.js";
import {calculateTotal} from "../../../Home/AgridTable/SoLieu/CDPS/logicCDPS.js";
import {filterDataByKey} from "../getDataByKey.js";
import {CANVAS_DATA_PACK} from "../../../../CONST.js";
import {calKQKD} from "../../../../generalFunction/calculateDataBaoCao/calKQKD.js";
import {getAllSoKeToan} from "../../../../apisKTQT/soketoanService.jsx";

function sumProperty(array, property) {
    return array.reduce((sum, item) => {
        const value = item.data[property];
        return sum + (typeof +value === 'number' ? +value : 0);
    }, 0);
}

export async function getDataFromSheet(selectedItem, listCompany, listYear) {
    let {primarySource: primary, checkingSource: checking, difference_ratio} = selectedItem || {};
    let valuePrimary = 0;
    let valueChecking = 0;
    let ratio = 0;
    if (!primary.isBaoCao) valuePrimary = await processSource(primary);
    else {
        valuePrimary = await getValueFromBC(primary, listCompany)
    }
    if (!checking.isBaoCao) valueChecking = await processSource(checking);
    else {
        valueChecking = await getValueFromBC(checking, listCompany)
    }

    ratio = calculateRatio(valuePrimary, valueChecking);

    return {
        valuePrimary,
        valueChecking,
        ratio,
        difference_ratio,
        isOK: +difference_ratio > ratio
    };
}

async function processSource(source) {
    try {
        if (!source || !source.bo_du_lieu?.startsWith('TEMP')) return 0;

        let idSheet = source.bo_du_lieu.split('_')[1];
        let listValue = await getTemplateRow(idSheet);
        listValue = listValue.rows || [];

        listValue = listValue.filter(item => item.show);
        listValue = filterData(listValue, source.dieu_kien);
        return sumProperty(listValue, source.cot_du_lieu);
    } catch (e) {
        return 0
    }
}

function calculateRatio(valuePrimary, valueChecking) {
    if (valuePrimary === 0) return 0;
    return Math.abs((valuePrimary - valueChecking) / valuePrimary) * 100;
}

function filterData(array, filters) {
    return array.filter(item => {
        return filters.every(filter => {
            const value = item.data[filter.cot_du_lieu];
            if (!value) return false;
            if (typeof value === "string" && !isNaN(Date.parse(value))) {
                // Xử lý ngày tháng
                const dateValue = new Date(value).getTime();
                const filterDates = filter.gia_tri_loc.map(date => new Date(date + "Z").getTime());
                if (filter.dieu_kien_loc === "equal_to") {
                    return filterDates.includes(dateValue);
                } else if (filter.dieu_kien_loc === "different") {
                    return !filterDates.includes(dateValue);
                } else if (filter.dieu_kien_loc === "greater_than") {
                    return dateValue > filterDates[0];
                } else if (filter.dieu_kien_loc === "less_than") {
                    return dateValue < filterDates[0];
                } else if (filter.dieu_kien_loc === "beetween") {
                    return dateValue >= filterDates[0] && dateValue <= filterDates[1];
                }
            } else {
                // Xử lý số
                const numericValue = typeof value === 'number' ? value : Number(value);
                if (filter.dieu_kien_loc === "equal_to") {
                    return filter.gia_tri_loc.includes(String(value));
                } else if (filter.dieu_kien_loc === "different") {
                    return !filter.gia_tri_loc.includes(String(value));
                } else if (filter.dieu_kien_loc === "greater_than") {
                    return typeof numericValue === 'number' && numericValue > Number(filter.gia_tri_loc[0]);
                } else if (filter.dieu_kien_loc === "less_than") {
                    return typeof numericValue === 'number' && numericValue < Number(filter.gia_tri_loc[0]);
                } else if (filter.dieu_kien_loc === "beetween") {
                    const [min, max] = filter.gia_tri_loc.map(Number);
                    return typeof numericValue === 'number' && numericValue >= min && numericValue <= max;
                }
            }
            return true;
        });
    });
}

async  function getValueFromBC(source, listCompany) {
    try {
        let allRS = await getItemFromIndexedDB2('allResult');
        // let allRS = [];
        if (!allRS || allRS.length === 0) {
            let data = await getAllSoKeToan();
            allRS = await calKQKD(
                data,
                listCompany.map((e) => e.code)
            );
        }
        let key = source.bo_du_lieu;
        let dp = source.cot_du_lieu;
        let year = source.dieu_kien[0].year;
        let company = source.dieu_kien[0].company;
        let from = source.dieu_kien[0].fromMonth;
        let to = source.dieu_kien[0].toMonth;

        let dataPack = CANVAS_DATA_PACK.find(e => e.value === key);
        let data = allRS[`${key}_${year}_${company}`];
        data = data.find(item => item[dataPack.keyDP] === dp);
        let rs = 0;
        for (let i = from; i <= to ; i++) {
            rs += data[dataPack.field(i)];
        }
        return rs
    } catch (e) {
        console.log(e)
        return 0;
    }
}
