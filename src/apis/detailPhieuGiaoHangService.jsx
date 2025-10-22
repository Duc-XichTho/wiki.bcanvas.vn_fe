import instance from './axiosInterceptors';
import { tinhSoNgayDaQuaTuChuoi } from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/chi-tiet-phieu-giao-hang'
const URL = BASE_URL + SUB_URL;

export const getDetailPhieuGiaoHangByPhieuGiaoHangIdService = async (id) => {
    try {
        const data  = await instance.get(URL +'/'+id)
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
}


export const createNewDetailPhieuGiaoHang = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateDetailPhieuGiaoHang = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteDetailPhieuGiaoHang = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}