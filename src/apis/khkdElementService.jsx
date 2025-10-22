import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/khkd-element'
const URL = BASE_URL + SUB_URL;

export const getAllKHKDElement = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getKHKDElementById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}
export const getKHKDElementByKHKDId = async (id) => {
    try {
        const { data } = await instance.get(URL + '/khkd/' + id);
        return data.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getKHKDElementByKhoanMuc = async (name) => {
    try {
        const { data } = await instance.get(URL + '/khoan-muc/' + name);
        return data.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getKHKDElementByLabelSoLuong = async (labelSoLuong) => {
    try {
        const { data } = await instance.get(URL + '/label-so-luong/' + labelSoLuong);
        return data.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const createKHKDElement = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateKHKDElement = async (id,  newRowData) => {
    try {
        let res = await instance.put(URL + '/' + id, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteKHKDElement = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}