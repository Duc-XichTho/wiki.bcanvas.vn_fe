import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/cross-check';
const URL = BASE_URL + SUB_URL;

export const getAllCrossCheck = async () => {
    try {
        const response = await instance.get(URL);
        return response.data;
    } catch (error) {
        console.log('ERROR getAllCrossCheck', error);
    }
};

export const getCrossCheckById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (error) {
        console.log('ERROR getCrossCheckById', error);
    }
};

export const createCrossCheck = async (data) => {
    try {
        const response = await instance.post(URL, data);
        return response.data;
    } catch (error) {
        console.log('ERROR createCrossCheck', error);
    }
};

export const updateCrossCheck = async (updateData) => {
    try {
        let res = await instance.put(URL, updateData)
        return res
    } catch (error) {
        console.log('ERROR updateCrossCheck', error);
    }
};

export const deleteCrossCheck = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log('ERROR deleteCrossCheck', error);
    }
};