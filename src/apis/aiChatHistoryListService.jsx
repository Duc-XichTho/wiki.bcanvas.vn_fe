import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ai-chatHistory-list';
const URL = BASE_URL + SUB_URL;

export const getAllAIChatHistoryList = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
    }
};

export const getAIChatHistoryListById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error fetching chat history by ID:', error);
        throw error;
    }
};

export const createAIChatHistoryList = async (chatData) => {
    try {
        const { data } = await instance.post(URL, chatData);
        return data;
    } catch (error) {
        console.error('Error creating chat history:', error);
        throw error;
    }
};

export const updateAIChatHistoryList = async ( chatData) => {
    try {
        const { data } = await instance.put(URL, chatData);
        return data;
    } catch (error) {
        console.error('Error updating chat history:', error);
        throw error;
    }
};

export const deleteAIChatHistoryList = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting chat history:', error);
        throw error;
    }
}; 