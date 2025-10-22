import {CPB, LSX, TT, VV} from "../../../../Consts/GIA_VON.js";

export function genMoHinh(dataSettingPPTGT, record) {
    if (!dataSettingPPTGT || !dataSettingPPTGT.setting) return CPB;

    const {month, vu_viec_code, lenh_sx} = record;

    const monthKey = month ? Number(month).toString() : null;

    const dataSettingVuViec = dataSettingPPTGT.setting.find(item => item.code === "W");
    const dataSettingLenhSX = dataSettingPPTGT.setting.find(item => item.code === "M");

    if (dataSettingLenhSX && dataSettingLenhSX.thoigian[monthKey] && lenh_sx) {
        return LSX;
    }

    if (dataSettingVuViec && dataSettingVuViec.thoigian[monthKey] && vu_viec_code) {
        return VV;
    }

    return CPB;
}

export function genDataW(dataSoKeToan, dataPBGV3, dataSettingPPTGT) {
    let newData = dataSoKeToan.map((item) => {
        const existingItem = dataPBGV3.find(pbItem => pbItem.KMF === item.kmf);

        return ({
            'month': item.month,
            'year': item.year,
            'day': item.day,
            'tk_co': item.tk_co,
            'so_tien_VND': item.so_tien_VND,
            'kmf': item.kmf,
            'vu_viec_code': item.vu_viec_code,
            'lenh_sx': item.lenh_sx,
            'mo_hinh_tinh_gia': genMoHinh(dataSettingPPTGT, item),
            'CCPBVV': genMoHinh(dataSettingPPTGT, item) === VV ? TT : (existingItem ? existingItem.CCPBVV : null),
            'ky': `${item?.day<=15?'P1':'P2'}_T${parseInt(item?.month)}_${item?.year}`
        })
    })
    return newData
}

export function mergeDataGV3W(rowData, dataPBGV2B, dataCCPB) {
    rowData.forEach(item => {
        let pb2b = dataPBGV2B.find(pb => pb.TK == item.tk_co && pb.KMF === item.kmf);
        let wRate = +pb2b?.W / (+pb2b?.W + +pb2b?.M)
        item.so_tien_VND = item.so_tien_VND * wRate;
    })
    rowData = rowData.reduce((acc, current) => {
        const existing = acc.find(item => item.kmf === current.kmf);
        if (existing) {
            existing.so_tien_VND = (parseFloat(existing.so_tien_VND) + parseFloat(current.so_tien_VND)).toString();
        } else {
            acc.push({...current});
        }

        return acc;
    }, []);
    rowData.forEach(item => {
        if (item.CCPBVV) {
            let ccpb = dataCCPB.find(cc => cc.name === item.CCPBVV)
            if (!ccpb || !ccpb.PB || ccpb.PB.length === 0) {
                return item;
            }
            let totalRate = ccpb.PB.reduce((sum, pb) => sum + parseFloat(pb.ty_le), 0);
            if (totalRate === 0) {
                return item;
            }
            let totalMoney = parseFloat(item.so_tien_VND);
            ccpb.PB.forEach(pb => {
                let proportion = parseFloat(pb.ty_le) / totalRate;
                let allocatedMoney = totalMoney * proportion;
                item[pb.ten_don_vi] = allocatedMoney;
            });
        }
    })
    return rowData
}

export function processDataGV3W(inputArray, listVV) {
    let groupedData = {};
    inputArray.forEach(item => {
        let key = `${item.kmf}-${item.mo_hinh_tinh_gia}`;
        let so_tien = parseFloat(item.so_tien_VND);
        if (!groupedData[key]) {
            groupedData[key] = {
                so_tien_VND: 0,
                kmf: item.kmf,
                mo_hinh_tinh_gia: item.mo_hinh_tinh_gia,
                CCPBVV: item.CCPBVV,
                ky:item.ky
            };
        }
        groupedData[key].so_tien_VND += so_tien;
        if (!groupedData[key][item.vu_viec_code]) {
            groupedData[key][item.vu_viec_code] = 0;
        }
        groupedData[key][item.vu_viec_code] += so_tien;
    });
    return Object.values(groupedData).map(item => {
        item.so_tien_VND = item.so_tien_VND;
        Object.keys(item).forEach(key => {
            if (listVV.some(e=> e.code === key)) {
                item[key] = item[key];
            }
        });
        return item;
    });
}

export function isEditable(data) {
    return data.mo_hinh_tinh_gia === CPB
}