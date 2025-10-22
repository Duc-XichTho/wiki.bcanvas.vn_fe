import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/sheet';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllSheet = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getSheetDataById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
};

// CREATE
export const createNewSheet = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// UPDATE
export const updateSheet = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res.data;
    } catch (error) {
        console.log(1, error);
        throw error;
    }
};

// DELETE
export const deleteSheet = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
};