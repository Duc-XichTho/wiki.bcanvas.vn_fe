import instance from './axiosInterceptors';
import { tinhSoNgayDaQuaTuChuoi } from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/lenh-sx'
const URL = BASE_URL + SUB_URL;

// GET
export const getAllLenhSanXuat = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getLenhSanXuatDataById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getLenhSanXuatNLByLSXId = async (id) => {
    try {
        const result = await instance.get(URL + '/nl/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getLenhSanXuatSPByLSXId = async (id) => {
    try {
        const result = await instance.get(URL + '/sp/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

// CREATE
export const createNewLenhSanXuat = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const createNewLenhSanXuatNL = async (newRowData) => {
    try {
        let res = await instance.post(URL + '/nl', newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const createNewLenhSanXuatSP = async (newRowData) => {
    try {
        let res = await instance.post(URL + '/sp', newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// UPDATE
export const updateLenhSanXuat = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}

export const updateLenhSanXuatNL = async (newRowData) => {
    try {
        let res = await instance.put(URL + '/nl', newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateLenhSanXuatSP = async (newRowData) => {
    try {
        let res = await instance.put(URL + '/sp', newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// DELETE
export const deleteLenhSanXuat = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const deleteLenhSanXuatNL = async (id) => {
    try {
        let res = await instance.delete(URL + '/nl/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const deleteLenhSanXuatSP = async (id) => {
    try {
        let res = await instance.delete(URL + '/sp/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}