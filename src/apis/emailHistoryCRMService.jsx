import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/email-history-crm'
const URL = BASE_URL + SUB_URL;

export const getAllEmailHistoryCRM = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách email:', error);
        throw error;
    }
};


export const createEmailHistoryCRM = async (templateData) => {
    try {
        let res = await instance.post(URL, templateData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateEmailHistoryCRM = async (templateData) => {
    try {
        let res = await instance.put(URL, templateData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}

export const deleteEmailHistoryCRM = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// API để lấy báo cáo email đã được tính toán sẵn
export const getEmailReportData = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        
        // Thêm các filter nếu có
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.templateId) params.append('templateId', filters.templateId);
        if (filters.customerId) params.append('customerId', filters.customerId);
        if (filters.status) params.append('status', filters.status);
        if (filters.type) params.append('type', filters.type);
        if (filters.scriptName) params.append('scriptName', filters.scriptName);
        
        const queryString = params.toString();
        const endpoint = queryString ? `${URL}/report?${queryString}` : `${URL}/report`;
        
        
        const { data } = await instance.get(endpoint);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy báo cáo email:', error);
        throw error;
    }
}