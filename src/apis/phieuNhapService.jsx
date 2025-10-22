import instance from './axiosInterceptors';
import { tinhSoNgayDaQuaTuChuoi } from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/phieu-nhap'
const URL = BASE_URL + SUB_URL;
export const getAllPhieuNhap = async () => {
    try {
        const { data } = await instance.get(URL);
        const updatedData = data.map((item) => {
            const daysElapsed = tinhSoNgayDaQuaTuChuoi(item.created_at);
            return {
                ...item,
                ngay_con_lai: daysElapsed,
            };
        });
        return updatedData;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getPhieuNhapDataById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}
export const getPhieuNhapByCardId = async (id) => {
    try {
        const result = await instance.get(URL + '/card/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const createNewPhieuNhap = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updatePhieuNhap = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deletePhieuNhap = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}