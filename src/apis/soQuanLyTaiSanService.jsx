import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/so-quan-ly-tai-san';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllSoQuanLyTaiSan = async () => {
    try {
        const response = await instance.get(URL);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

// CREATE
export const createNewSoQuanLyTaiSan = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData);
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// UPDATE
export const updateSoQuanLyTaiSan = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData);
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// DELETE
export const deleteSoQuanLyTaiSan = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id);
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};