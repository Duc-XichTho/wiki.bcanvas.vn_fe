import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/progress-step'
const URL = BASE_URL + SUB_URL;

export const getAllProgressStep = async (progressId) => {
    try {
        const { data } = await instance.get(`${URL}/${progressId}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const createProgressStep = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateProgressStep = async (id, newRowData) => {
    try {
        let res = await instance.put(URL + '/' + id, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const deleteProgressStep = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}