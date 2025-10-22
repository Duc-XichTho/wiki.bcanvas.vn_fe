import {getAllSheetDataBySheetId} from "../../../../apis/sheetDataService.jsx";
import {calGiaBan} from "../../AgridTable/SoLieu/TonKho/logicTonKho.js";

export function getDetailData(idCard, dssp, hhs) {
    let dataDefault = []
    let key = 1;
    dssp.forEach(sp => {
        let hh = hhs.find(item => item.id == sp.id_hang_hoa);
        let sl = sp.so_luong;
        let item = {
            key: key++,
            so_luong: sl,
            id_hang_hoa: hh?.id,
            code_hang_hoa: hh?.code,
            label: hh?.name,
        }
        dataDefault.push(item);
    })
    return dataDefault
}
export function getDetailDataGom(idCard, dssp, hhs) {
    let dataDefault = []
    let key = 1;
    dssp.forEach(sp => {
        let hh = hhs.find(item => item.id == sp.id_hang_hoa);
        let sl = sp.so_luong;
        let item = {
            key: key++,
            so_luong: sl,
            id_hang_hoa: hh?.id,
            code_hang_hoa: hh?.code,
            label: hh?.name,
            ...sp
        }
        dataDefault.push(item);
    })
    return dataDefault
}
export function getDetailDataGomPhieuNhap(idCard, dssp, hhs) {
    let dataDefault = []
    let key = 1;
    dssp.forEach(sp => {
        let hh = hhs.find(item => item.id == sp.id_hang_hoa);
        let item = {
            key: key++,
            id_hang_hoa: hh?.id,
            code_hang_hoa: hh?.code,
            label: hh?.name,
            ...sp
        }
        dataDefault.push(item);
    })
    return dataDefault
}

export async function getDetailData2(idCard, subStepId, sheets, hhs, khos, los,) {
    let dataDefault = []
    let sheet = sheets.find(item => item.sub_step_id == subStepId && item.card_id == idCard)
    if (sheet) {
        let dataSheet = await getAllSheetDataBySheetId(sheet.id);
        if (dataSheet && dataSheet.length > 0) {
            dataSheet.forEach(data => {
                data = data.data;
                if (data) {
                    let hh = hhs.find(item => item.code == data['Mã SP']);
                    let sl = data['Số lượng'];
                    let kho = khos.find(item => item.code == data['Kho']);
                    let lo = los.find(item => item.code == data['Lô']);
                    let gia_xuat = calGiaBan(hh?.code, kho?.code)
                    let item = {
                        key: hh?.id + '' + kho?.id,
                        so_luong: sl,
                        id_hang_hoa: hh?.id,
                        code_hang_hoa: hh?.code,
                        label: hh?.name,
                        id_kho: kho?.id,
                        id_lo: lo?.id,
                        gia_xuat: gia_xuat
                    }
                    dataDefault.push(item);
                }
            })
        }
    }
    return dataDefault
}

export function createDataDK(data) {
    const groupedData = data.reduce((acc, item) => {
        if (!acc[item.code]) {
            acc[item.code] = 0;
        }
        acc[item.code] += item.gia_xuat * item.so_luong;
        return acc;
    }, {});
    return Object.keys(groupedData).map((code) => ({
        sanPham: code,
        soTien: groupedData[code],
    }));
}
export function createDataDK_SL(data) {
    const groupedData = data.reduce((acc, item) => {
        if (!acc[item.hh_code]) {
            acc[item.hh_code] = 0;
        }
        acc[item.hh_code] += item.gia_nhap * item.so_luong;
        return acc;
    }, {});
    return Object.keys(groupedData).map((code) => ({
        sanPham: code,
        soTien: groupedData[code],
    }));
}

export function createDataDKFromPhieuXuat(data) {
    let listHH = [];
    data.forEach(item => {
        listHH.push(...item.danh_sach_hang_hoa)
    })
    const groupedData = listHH.reduce((acc, item) => {
        if (!acc[item.code]) {
            acc[item.code] = 0;
        }
        acc[item.code] += item.gia_xuat * item.so_luong;
        return acc;
    }, {});
    return Object.keys(groupedData).map((code_hang_hoa) => ({
        sanPham: code_hang_hoa,
        soTien: groupedData[code_hang_hoa],
    }));
}

export function getListIdCardGom(data) {
    let listID = [];
    data.forEach(item => {
        if (item.don_hang) {
            let idCardLQ = item.don_hang.split('|')[1];
            if (idCardLQ && listID.indexOf(idCardLQ) === -1) {
                listID.push(idCardLQ);
            }
        }
    })
    return listID
}
