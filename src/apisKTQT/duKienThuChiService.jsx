import instance from "./axiosInterceptors";
import {getAllDeNghiThanhToan} from "./deNghiThanhToanService.jsx";
import {DNTT_TYPE, DNTU_DONE, DNTU_TYPE, QTTU_TYPE} from "../Constant.jsx";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/du-kien-thu-chi";
const URL = BASE_URL + SUB_URL;

// GET
export const getDuKienThuChiData = async () => {
    try {
        const result = await instance.get(URL);
        let data = result.data;
        let dataChi = data.filter(item => item.isThu === 'Chi');
        let dataThu = data.filter(item => item.isThu === 'Thu');
        let dataDNTT = await getAllDeNghiThanhToan();
        for (const dk of dataChi) {
            let da_tao_phieu = 0;
            for (const dn of dataDNTT) {
                if (dn.id_DuKien == dk.id) {
                    da_tao_phieu++;
                }
            }
            dk.da_tao_phieu = da_tao_phieu;
        }
        // let DNTT = dataDNTT.filter(item => item.phan_loai === DNTT_TYPE)
        // let DNTU = dataDNTT.filter(item => item.phan_loai === DNTU_TYPE)
        // for (const dk of dataChi) {
        //     let da_tao_phieu = 0;
        //
        //     for (const dn of DNTT) {
        //         if (dn.id_DuKien == dk.id) {
        //             da_tao_phieu += +dn.so_tien || 0
        //         }
        //     }
        //     for (const dn of DNTU) {
        //         if (dn.id_DuKien == dk.id) {
        //             if (dn.daQuyetToan === DNTU_DONE) {
        //                 da_tao_phieu += +dn.tienDaQuyetToan || 0
        //             } else {
        //                 dn.tienDaQuyetToan = +dn.tienDaQuyetToan || 0;
        //                 dn.so_tien = +dn.so_tien || 0;
        //                 da_tao_phieu += dn.tienDaQuyetToan > dn.so_tien ? dn.tienDaQuyetToan : dn.so_tien;
        //             }
        //         }
        //     }
        //     dk.da_tao_phieu = da_tao_phieu - dk.so_tien_dung || 0;
        // }
        let finalData = [...dataThu, ...dataChi];
        finalData = finalData.sort((a, b) => b.id - a.id)
        return finalData;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu duKienThuChi: ", e);
        throw e;
    }
}

export const getDuKienThuChiDataById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu duKienThuChi: ", e);
        throw e;
    }
}

// UPDATE
export const updateDuKienThuChi = async (data) => {
    try {
        const result = await instance.put(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu duKienThuChi: ", e);
        throw e;
    }
}

// CREATE
export const createDuKienThuChi = async (data) => {
    try {
        const result = await instance.post(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi tạo dữ liệu duKienThuChi: ", e);
        throw e;
    }
}
