import instance from './axiosInterceptors';
import { tinhSoNgayDaQuaTuChuoi } from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/detail-phieu-nhap'
const URL = BASE_URL + SUB_URL;

export const getFullDetailPhieuNhapService = async () => {
    try {
        const { data } = await instance.get(URL + '/full')
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
}

export const getAllDetailPhieuNhap = async () => {
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

export const getDetailPhieuNhapDataById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getDetailPhieuNhapDataByPhieuNhapId = async (id) => {
    try {
        const result = await instance.get(URL + '/phieuNhap/' + id);
        return result;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const createNewDetailPhieuNhap = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateDetailPhieuNhap = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteDetailPhieuNhap = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}