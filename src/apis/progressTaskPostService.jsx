import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/progress-task-post'
const URL = BASE_URL + SUB_URL;

export const getAllProgressTaskPost = async (progressTaskId) => {
    try {
        const { data } = await instance.get(URL + '/' + progressTaskId);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const createProgressTaskPost = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateProgressTaskPost = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const deleteProgressTaskPost = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}