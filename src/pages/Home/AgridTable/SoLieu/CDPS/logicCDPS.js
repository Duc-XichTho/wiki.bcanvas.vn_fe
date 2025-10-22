import { log } from "mathjs";
import {getArrFieldAndTK, getArrFromFieldOfList} from "../../../../../generalFunction/getArrFromFieldOfList.js";

export function logicListT(listSKT) {
    const newListSKT = [];

    listSKT.forEach(item => {
        const so_tien_VND = item.so_tien_VND ? parseInt(item.so_tien_VND, 10) : 0;
        if (item.tk_no && item.tk_co) {
            newListSKT.push({
                tkkt: item.tk_no,
                tkdu: item.tk_co,
                tien_no: so_tien_VND,
                tien_co: 0,
                ...item
            });
            newListSKT.push({
                tkkt: item.tk_co,
                tkdu: item.tk_no,
                tien_no: 0,
                tien_co: so_tien_VND,
                ...item
            });
        }
    });
    return newListSKT;
}
export function logicListT_KTQT(listSKT) {

    const newListSKT = [];
    for (const item of listSKT) {
        const so_tien_VND = item.so_tien ? parseInt(item.so_tien, 10) : 0;
        if (item.tk_no && item.tk_co) {
            newListSKT.push({
                ...item,
                tk_no: item.tk_no,
                tk_co: item.tk_co,
                ps_no: so_tien_VND,
                ps_co: 0,
            });
            newListSKT.push({
                ...item,
                tk_co: item.tk_no,
                tk_no : item.tk_co,
                ps_no: 0,
                ps_co: so_tien_VND,
            });
        }
    }
    return newListSKT;
}

export function calCDPS(listSKT, listVAS, startMonth, endMonth) {
    try {
        let listSKT2 = listSKT.filter(item => +item.month >= startMonth && +item.month <= endMonth);
        listSKT2 = logicListT(listSKT2);
        listVAS.forEach(vas => {
            let listSKTFilter = listSKT2.filter(item => item.tkkt == vas.code);
            vas.no = calculateTotal(listSKTFilter, 'tien_no');
            vas.co = calculateTotal(listSKTFilter, 'tien_co');
            vas.net_trong_ky = vas.no - vas.co;
            vas.no_cuoi_ky = +vas.no_dau_ky + vas.no;
            vas.co_cuoi_ky = +vas.co_dau_ky + vas.co;
            vas.net_dau_ky = +vas.no_dau_ky - vas.co_dau_ky;
            vas.net_cuoi_ky = +vas.no_cuoi_ky - vas.co_cuoi_ky;
        })
        return listVAS
    } catch (e) {
        return listVAS;
    }
}
export function calCDPS2(listSKT, listVAS, startMonth, endMonth) {
    let dauKy = calCDPS(JSON.parse(JSON.stringify(listSKT)), JSON.parse(JSON.stringify(listVAS)), 1, startMonth-1)
    let resultList = calCDPS(JSON.parse(JSON.stringify(listSKT)), JSON.parse(JSON.stringify(listVAS)), 1, endMonth)
    if (startMonth == 1) {
        return resultList;
    }
    resultList.forEach(item => {
        let itemDauKy = dauKy.find(dk => dk.code === item.code);
        item.no_dau_ky = itemDauKy.no_cuoi_ky;
        item.co_dau_ky = itemDauKy.co_cuoi_ky;
        item.no = item.no - itemDauKy.no
        item.co = item.co - itemDauKy.co
    })
    return resultList;
}

export function calSTKDT(listSKT, listDauKy, TD, fieldSKT, startMonth, endMonth) {
    listSKT = listSKT.filter(skt => skt.month <= endMonth)
    let resultList = [];
    listDauKy.forEach(item => {
        let rs = resultList.find(rs => rs[TD] === item[TD]);
        if (rs) {
            rs.no_dau_ky = +rs.no_dau_ky + +item.no_dau_ky;
            rs.co_dau_ky = +rs.co_dau_ky + +item.co_dau_ky;
        } else {
            resultList.push(item);
        }
    })
    try {
        resultList.forEach(dauKy => {
            dauKy.doiTuong = dauKy[TD];
            let listSKTFilter = listSKT.filter(item => dauKy.doiTuong == item[fieldSKT]);
            dauKy.no = calculateTotal(listSKTFilter, 'tien_no');
            dauKy.co = calculateTotal(listSKTFilter, 'tien_co');
            dauKy.net_trong_ky = dauKy.no - dauKy.co;
            dauKy.no_cuoi_ky = +dauKy.no_dau_ky + dauKy.no;
            dauKy.co_cuoi_ky = +dauKy.co_dau_ky + dauKy.co;
            dauKy.net_dau_ky = +dauKy.no_dau_ky - dauKy.co_dau_ky;
            dauKy.net_cuoi_ky = +dauKy.no_cuoi_ky - dauKy.co_cuoi_ky;
        })
        return resultList
    } catch (e) {
        return resultList;
    }
}

export function calSTKDT2(listSKT, listDauKy, TD, fieldSKT, startMonth, endMonth, selectedTK) {
    let arrTD = getArrFieldAndTK(listSKT.filter(skt => skt.month >= startMonth && skt.month <= endMonth), fieldSKT);
    arrTD.forEach(item => {
        let dauKy = listDauKy.find(dk => dk[TD] === item.field)
        if (!dauKy) {
            listDauKy.push({[TD]: item.field, no_dau_ky: 0, co_dau_ky: 0, ma_tk: item.ma_tk});
        }
    })
    listDauKy = listDauKy.filter(item => (item.ma_tk == selectedTK));
    listDauKy = listDauKy.filter(item => arrTD.find(e => e.field == item[TD]));
    let dauKy = calSTKDT(listSKT, JSON.parse(JSON.stringify(listDauKy)), TD, fieldSKT, 1, startMonth - 1);
    let resultList = calSTKDT(listSKT, JSON.parse(JSON.stringify(listDauKy)), TD, fieldSKT, 1, endMonth);
    resultList.forEach(item => {
        let itemDauKy = dauKy.find(dk => dk[TD] === item[TD]);
        item.no_dau_ky = itemDauKy.no_cuoi_ky;
        item.co_dau_ky = itemDauKy.co_cuoi_ky;
        item.no = item.no - itemDauKy.no
        item.co = item.co - itemDauKy.co
    })
    return resultList;
}

export function calculateTotal(list, field) {
    try {

        return list.reduce((total, item) => {
            const value = item[field] ? parseFloat(item[field]) : 0;
            return total + value;
        }, 0);
    } catch (e) {
        return 0;
    }
}
