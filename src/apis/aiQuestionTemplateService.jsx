import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ai-question-template';
const URL = BASE_URL + SUB_URL;

export const getAllQuestionTemplate = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.data;
    } catch (error) {
        console.error('Error fetching question template:', error);
        throw error;
    }
};

export const getQuestionTemplateById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching question template by ID:', error);
        throw error;
    }
};

export const createQuestionTemplate = async (chatData) => {
    try {
        const { data } = await instance.post(URL, chatData);
        return data;
    } catch (error) {
        console.error('Error creating question template:', error);
        throw error;
    }
};

export const updateQuestionTemplate = async (questionTemplateData) => {
    try {
        const { data } = await instance.put(`${URL}`, questionTemplateData);
        return data;
    } catch (error) {
        console.error('Error updating question template:', error);
        throw error;
    }
};

export const deleteQuestionTemplate = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
            console.error('Error deleting question template:', error);
        throw error;
    }
}; 