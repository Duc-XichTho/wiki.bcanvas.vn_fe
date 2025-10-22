import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/search-model'
const URL = BASE_URL + SUB_URL;
export const findRecordsByConditions = async (modelType, conditions) => {
    try {
        const {data} = await instance.post(URL , { modelType, conditions });
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};
