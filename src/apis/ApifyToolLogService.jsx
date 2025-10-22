import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/apify-tool-log';
const URL = BASE_URL + SUB_URL;

export const getAllApifyToolLog = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.data;
    } catch (error) {
        console.error('Error fetching Apify tool log:', error);
        throw error;
    }
};

export const getApifyToolLogById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching Apify tool log by ID:', error);
        throw error;
    }
};

export const createApifyToolLog = async (logData) => {
    try {
        const { data } = await instance.post(URL, logData);
        return data;
    } catch (error) {
        console.error('Error creating Apify tool log:', error);
        throw error;
    }
};

export const updateApifyToolLog = async (logData) => {
    try {
        const { data } = await instance.put(URL, logData);
        return data;
    } catch (error) {
        console.error('Error updating Apify tool log:', error);
        throw error;
    }
};

export const deleteApifyToolLog = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting Apify tool log:', error);
        throw error;
    }
}; 