import {LIST_TD_TKKT} from "../../Consts/LIST_TD_TKKT.js";
import {calSTKDT2} from "../../pages/Home/AgridTable/SoLieu/CDPS/logicCDPS.js";
import {createSoDauKyDinhDanh} from "./createSoDinhDanh.js";

let tkNos = ['1311', '138']
let tkCos = ['3311', '338']

export function createOffsetList(sktT, listDauKy, startMonth, endMonth, listNV, listKH, listNCC) {
    const relevantFields = ['TD_NCC', 'TD_KhachHang', 'TD_NhanVien'];
    const tkTypes = {
        No: tkNos,
        Co: tkCos
    };
    const TD_FIELDS = relevantFields.reduce((acc, field) => {
        acc[field] = LIST_TD_TKKT.find(item => item.field === field);
        return acc;
    }, {});
    listDauKy = listDauKy.filter(item => relevantFields.some(field => item[field] && item[field] !== ''));
    let sktT1 = sktT.filter(item => relevantFields.some(field => item[TD_FIELDS[field].fieldSKT] && item[TD_FIELDS[field].fieldSKT] !== ''));
    const filterByTkType = (data, type, tkList) => data.filter(item => tkList.includes(item[type]));
    let results = {};
    relevantFields.forEach(field => {
        Object.entries(tkTypes).forEach(([key, tkList]) => {
            const sktFiltered = filterByTkType(sktT1, key === 'No' ? 'tkkt' : 'tkkt', tkList);
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
    });
    return filterNonZeroNetCuoiKy(mergeByMaTkEnding(mergeByDinhDanhAndMaTk(mergeResultsByAccountGroups(results))));
}

function mergeResultsByAccountGroups(results) {
    const mergedResults = {};
    const groups = [
        { keys: ['_1311', '_3311'], mergedKey: '_x11' },
        { keys: ['_138', '_338'], mergedKey: '_x8' }
    ];

    Object.entries(results).forEach(([key, value]) => {
        const group = groups.find(g => g.keys.some(k => key.endsWith(k)));
        if (group) {
            const mergedKey = key.replace(/_\d+$/, group.mergedKey);
            if (!mergedResults[mergedKey]) mergedResults[mergedKey] = [];
            value.forEach(item => {
                if (key.includes('_33')) {
                    item.net_cuoi_ky = item.co_cuoi_ky
                } else {
                    item.net_cuoi_ky = item.no_cuoi_ky
                }
                const existing = mergedResults[mergedKey].find(m => m.doiTuong === item.doiTuong);
                if (existing) {
                    existing.net_cuoi_ky += item.net_cuoi_ky;
                } else {
                    mergedResults[mergedKey].push({ ...item });
                }
            });
        } else {
            mergedResults[key] = value;
        }
    });

    return mergedResults;
}

function mergeByDinhDanhAndMaTk(data) {
    const mergedResults = {};

    Object.keys(data).forEach(key => {
        data[key].forEach(item => {
            const { dinh_danh, ma_tk, net_cuoi_ky } = item;
            const uniqueKey = `${dinh_danh}_${ma_tk}`;

            if (!mergedResults[uniqueKey]) {
                mergedResults[uniqueKey] = { dinh_danh, ma_tk, net_cuoi_ky: 0 };
            }
            mergedResults[uniqueKey].net_cuoi_ky += net_cuoi_ky;
        });
    });

    return Object.values(mergedResults);
}

function mergeByMaTkEnding(data) {
    const mergedResults = {};

    data.forEach(item => {
        const { dinh_danh, ma_tk, net_cuoi_ky } = item;
        const ending = ma_tk.slice(-2);
        const key = `${dinh_danh}_${ending}`;

        if (!mergedResults[key]) {
            mergedResults[key] = { dinh_danh, ma_tk, net_cuoi_ky };
        } else {
            mergedResults[key][`ma_tk2`] = ma_tk;
            mergedResults[key][`net_cuoi_ky2`] = net_cuoi_ky;
        }
    });

    return Object.values(mergedResults); // Trả về mảng kết quả
}

function filterNonZeroNetCuoiKy(data) {
    return data.filter(item => {
        return +item.net_cuoi_ky !== 0 && +item.net_cuoi_ky2 !== 0 && item.net_cuoi_ky && item.net_cuoi_ky2;
    });
}
