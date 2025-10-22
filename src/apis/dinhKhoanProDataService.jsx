import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/dinh-khoan-pro-data';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllDinhKhoanProData = async () => {
    try {
        const response = await instance.get(URL);
        const filteredData = response.data.map((item) => ({
            ...item,
            duyet: item.duyet ?? false,
        }));
        return filteredData;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

// GET
export const getDinhKhoanProDataByDinhKhoanId = async (dinhKhoan_id) => {
    try {
        const { data } = await instance.get(URL + '/' + dinhKhoan_id);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
}

// CREATE
export const createNewDinhKhoanProData = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// UPDATE
export const updateDinhKhoanProData = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// DELETE
export const deleteDinhKhoanProData = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
