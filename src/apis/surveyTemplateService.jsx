import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/survey-template';
const URL = BASE_URL + SUB_URL;

// Create a new survey template
export const createSurveyTemplate = async (templateData) => {
    try {
        const { data } = await instance.post(URL, templateData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo template survey mới:', error);
        throw error;
    }
};

// Get all survey templates
export const getAllSurveyTemplates = async (params = {}) => {
    try {
        const { data } = await instance.get(URL, { params });
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách templates survey:', error);
        throw error;
    }
};

// Get survey template by ID
export const getSurveyTemplateById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy template survey theo ID:', error);
        throw error;
    }
};

// Update a survey template
export const updateSurveyTemplate = async (templateData) => {
    try {
        const { data } = await instance.put(URL, templateData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật template survey:', error);
        throw error;
    }
};

// Delete a survey template (soft delete)
export const deleteSurveyTemplate = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa template survey:', error);
        throw error;
    }
};

// Search survey templates by title (case-insensitive)
export const searchSurveyTemplatesByTitle = async (title) => {
    try {
        const { data } = await instance.get(`${URL}/title/${title}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi tìm kiếm templates survey theo tiêu đề:', error);
        throw error;
    }
};
