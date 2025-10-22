import instance from './axiosInterceptors';
import { tinhSoNgayDaQuaTuChuoi } from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/de-nghi-thanh-toan-detail'
const URL = BASE_URL + SUB_URL;


export const getDetailDeNghiThanhToanDetailByDeNghiThanhToanDetailIdService = async (id) => {
    try {
        const { data } = await instance.get(URL + '/card/'+id)
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
}

export const getDeNghiThanhToanDetailByDeNghiThanhToanIdService = async (id) => {
    try {
        const res = await instance.get(URL + '/dntt/'+ id)
        return res
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
}


export const createNewDetailDeNghiThanhToanDetail = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateDetailDeNghiThanhToanDetail = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteDetailDeNghiThanhToanDetail = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}