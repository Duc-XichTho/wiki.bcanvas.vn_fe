import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/survey';
const URL = BASE_URL + SUB_URL;

export const getAllSurveys = async (params = {}) => {
    try {
        const { data } = await instance.get(URL, { params });
        return data;
    } catch (error) {
        console.error('Error fetching surveys:', error);
        throw error;
    }
};

export const getSurveyById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error fetching survey by ID:', error);
        throw error;
    }
};

export const getSurveysByStatus = async (status) => {
    try {
        const { data } = await instance.get(`${URL}/status/${status}`);
        return data;
    } catch (error) {
        console.error('Error fetching surveys by status:', error);
        throw error;
    }
};

export const getSurveysByTemplate = async (templateId) => {
    try {
        const { data } = await instance.get(`${URL}/template/${templateId}`);
        return data;
    } catch (error) {
        console.error('Error fetching surveys by template:', error);
        throw error;
    }
};

export const getSurveysByDateRange = async (startDate, endDate) => {
    try {
        const params = {
            startDate: startDate,
            endDate: endDate
        };
        const { data } = await instance.get(`${URL}/date-range`, { params });
        return data;
    } catch (error) {
        console.error('Error fetching surveys by date range:', error);
        throw error;
    }
};

export const createSurvey = async (surveyData) => {
    try {
        const { data } = await instance.post(URL, surveyData);
        return data;
    } catch (error) {
        console.error('Error creating survey:', error);
        throw error;
    }
};

export const updateSurvey = async (surveyData) => {
    try {
        const { data } = await instance.put(URL, surveyData);
        return data;
    } catch (error) {
        console.error('Error updating survey:', error);
        throw error;
    }
};

export const deleteSurvey = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting survey:', error);
        throw error;
    }
};

export const getDeletedSurveys = async (params = {}) => {
    try {
        const { data } = await instance.get(`${URL}/deleted`, { params });
        return data;
    } catch (error) {
        console.error('Error fetching deleted surveys:', error);
        throw error;
    }
};

export const restoreSurvey = async (id) => {
    try {
        const response = await instance.put(`${URL}/restore/${id}`);
        console.log('Raw restore survey response:', response);
        
        // Handle different response structures
        if (response.data) {
            return response.data;
        } else if (response.message) {
            return { message: response.message };
        } else {
            return { message: 'Survey restored successfully' };
        }
    } catch (error) {
        console.error('Error restoring survey:', error);
        throw error;
    }
};
