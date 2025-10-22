import {LIST_TD_TKKT} from "../../Consts/LIST_TD_TKKT.js";
import {calSTKDT2} from "../../pages/Home/AgridTable/SoLieu/CDPS/logicCDPS.js";
import {createSoDauKyDinhDanh} from "./createSoDinhDanh.js";

let tkNos = ['1311'];
let tkCos = ['3311'];

export function createOffsetList1(sktT, listDauKy, startMonth, endMonth, listNV, listKH, listNCC) {
    const relevantFields = ['TD_NCC', 'TD_KhachHang'];
    const TD_FIELDS = relevantFields.reduce((acc, field) => {
        acc[field] = LIST_TD_TKKT.find(item => item.field === field);
        return acc;
    }, {});

    // Filter listDauKy based on relevantFields
    listDauKy = listDauKy.filter(item => relevantFields.some(field => item[field] && item[field] !== ''));

    // Filter sktT based on relevantFields
    let sktT1 = sktT.filter(item => relevantFields.some(field => item[TD_FIELDS[field].fieldSKT] && item[TD_FIELDS[field].fieldSKT] !== ''));

    const filterByTkType = (data, type, tkList) => data.filter(item => tkList.includes(item[type]));

    let results = {};
    relevantFields.forEach(field => {
        const tkList = (field === 'TD_NCC') ? tkCos : tkNos; // Select tkNos for TD_KhachHang and tkCos for TD_NCC
        const sktFiltered = filterByTkType(sktT1, 'tkkt', tkList);
        const dauKyFiltered = filterByTkType(listDauKy, 'ma_tk', tkList);

        tkList.forEach(tk => {
            const calcKey = `${field}_${tk}`;
            const calcData = calSTKDT2(
                sktFiltered,
                JSON.parse(JSON.stringify(dauKyFiltered)),
                field,
                TD_FIELDS[field].fieldSKT,
                startMonth,
                endMonth,
                tk
            );
            results[calcKey] = createSoDauKyDinhDanh(calcData, listNV, listKH, listNCC);
        });
    });

    // Flatten results into a single array
    const flattenedResults = Object.values(results).flat();
    flattenedResults.forEach(item => {
        if (item.no_cuoi_ky < item.co_cuoi_ky) {
            item.tien = item.no_cuoi_ky;
        } else {
            item.tien = item.co_cuoi_ky;
        }
    })
    return filterNonZeroNetCuoiKy(flattenedResults.filter(item => item));
}

function filterNonZeroNetCuoiKy(data) {
    return data.filter(item => {
        return (+item.no_cuoi_ky !== 0  && item.co_cuoi_ky) ||( +item.co_cuoi_ky !== 0 && item.no_cuoi_ky);
    });
}
