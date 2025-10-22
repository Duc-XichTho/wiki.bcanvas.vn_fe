import instance from './axiosInterceptors';
const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/template-setting-ai-report-builder';
const URL = BASE_URL + SUB_URL;

// Get all chat history for a user
export const getAllTemplateSettingAIReportBuilder = async () => {
    try {
        const response = await instance.get(`${URL}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching AI free chat history:', error);
        throw error;
    }
};

// Get specific chat history by ID
export const getTemplateSettingAIReportBuilderById = async (id) => {
    try {
        const response = await instance.get(`${URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching AI free chat history by ID:', error);
        throw error;
    }
};

// Create new chat history entry
export const createTemplateSettingAIReportBuilder = async (data) => {
    try {
        const response = await instance.post(`${URL}`, data);
        return response.data;
    } catch (error) {
        console.error('Error creating AI free chat history:', error);
        throw error;
    }
};

// Update chat history entry
export const updateTemplateSettingAIReportBuilder = async (data) => {
    try {
        const response = await instance.put(`${URL}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating AI free chat history:', error);
        throw error;
    }
};

// Delete chat history entry
export const deleteTemplateSettingAIReportBuilder = async (id) => {
    try {
        const response = await instance.delete(`${URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting AI free chat history:', error);
        throw error;
    }
};
