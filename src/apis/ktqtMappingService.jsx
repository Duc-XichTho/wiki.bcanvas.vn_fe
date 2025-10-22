import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ktqt-mapping'
const URL = BASE_URL + SUB_URL;

export const getAllKTQTMapping = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getKTQTMappingById = async (id) => {
    try {
        const {data} = await instance.get(URL + '/' + id);
        return data.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const createKTQTMapping = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateKTQTMapping = async (id , newRowData) => {
    try {
        let res = await instance.put(URL + '/' + id ,  newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteKTQTMapping = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}