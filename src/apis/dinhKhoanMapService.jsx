import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/dinh-khoan-map';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllDinhKhoanMap = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

// CREATE
export const createNewDinhKhoanMap = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// UPDATE
export const updateDinhKhoanMap = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// DELETE
export const deleteDinhKhoanMap = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};