import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/aiChatHistory2';
const URL = BASE_URL + SUB_URL;

export const createAiChatHistory2Record = async (recordData) => {
    try {
        const { data } = await instance.post(URL, recordData);
        return data;
    } catch (error) {
        console.error('Error creating AI Chat History 2 record:', error);
        throw error;
    }
};

export const getAllAiChatHistory2Records = async (params = {}) => {
    try {
        const { data } = await instance.get(URL, { params });
        return data;
    } catch (error) {
        console.error('Error fetching all AI Chat History 2 records:', error);
        throw error;
    }
};

export const getAiChatHistory2RecordById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error fetching AI Chat History 2 record by ID:', error);
        throw error;
    }
};

export const getAiChatHistory2RecordsByUser = async (userCreated, params = {}) => {
    try {
        const { data } = await instance.get(`${URL}/user/${userCreated}`, { params });
        return data;
    } catch (error) {
        console.error('Error fetching AI Chat History 2 records by user:', error);
        throw error;
    }
};

export const getAiChatHistory2RecordsByAdvisor = async (advisorType, params = {}) => {
    try {
        const { data } = await instance.get(`${URL}/advisor/${advisorType}`, { params });
        return data;
    } catch (error) {
        console.error('Error fetching AI Chat History 2 records by advisor type:', error);
        throw error;
    }
};

export const getAiChatHistory2RecordsByModel = async (model, params = {}) => {
    try {
        const { data } = await instance.get(`${URL}/model/${model}`, { params });
        return data;
    } catch (error) {
        console.error('Error fetching AI Chat History 2 records by model:', error);
        throw error;
    }
};

export const updateAiChatHistory2Record = async (recordData) => {
    try {
        const { data } = await instance.put(URL, recordData);
        return data;
    } catch (error) {
        console.error('Error updating AI Chat History 2 record:', error);
        throw error;
    }
};

export const deleteAiChatHistory2Record = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting AI Chat History 2 record:', error);
        throw error;
    }
};
