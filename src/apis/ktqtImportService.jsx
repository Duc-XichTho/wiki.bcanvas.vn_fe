import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ktqt-import'
const URL = BASE_URL + SUB_URL;

export const getAllKTQTImport = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getKTQTImportById = async (id) => {
    try {
        const {data} = await instance.get(URL + '/' + id);
        return data.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const createKTQTImport = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateKTQTImport = async (data) => {
    try {
        let res = await instance.put(URL, data);
        return res;
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}

export const deleteKTQTImport = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}