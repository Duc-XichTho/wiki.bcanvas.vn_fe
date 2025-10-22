/**
 * Process Tab Service
 * 
 * API endpoints:
 * - POST /api/process-tab - Create new process tab
 * - GET /api/process-tab - Get all active process tabs
 * - GET /api/process-tab/:id - Get process tab by ID
 * - PUT /api/process-tab - Update process tab
 * - DELETE /api/process-tab/:id - Soft delete process tab
 * - GET /api/process-tab/deleted - Get all deleted process tabs
 * - PUT /api/process-tab/restore/:id - Restore deleted process tab
 */
import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/process-tab';
const URL = BASE_URL + SUB_URL;

// Create a new process tab
export const createProcessTab = async (processTabData) => {
    try {
        // Add default values for the actual table structure
        const dataToSend = {
            title: processTabData.title,
            description: processTabData.description || '',
            url: processTabData.url || '',
            show: processTabData.show !== undefined ? processTabData.show : true,
            isActive: processTabData.isActive !== undefined ? processTabData.isActive : false,
            metadata: processTabData.metadata || {}
        };
        
        const { data } = await instance.post(URL, dataToSend);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo process tab:', error);
        throw error;
    }
};

// Get all active process tabs
export const getAllProcessTabs = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách process tabs:', error);
        throw error;
    }
};

// Get process tab by ID
export const getProcessTabById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy process tab theo ID:', error);
        throw error;
    }
};

// Update a process tab
export const updateProcessTab = async (processTabData) => {
    try {
        // Add default values for the actual table structure
        const dataToSend = {
            id: processTabData.id,
            title: processTabData.title,
            description: processTabData.description || '',
            url: processTabData.url || '',
            show: processTabData.show !== undefined ? processTabData.show : true,
            isActive: processTabData.isActive !== undefined ? processTabData.isActive : false,
            metadata: processTabData.metadata || {}
        };
        
        const { data } = await instance.put(URL, dataToSend);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật process tab:', error);
        throw error;
    }
};

// Delete a process tab
export const deleteProcessTab = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa process tab:', error);
        throw error;
    }
};

// Note: Active tab management is handled locally in the component
// since the API doesn't provide active tab endpoints

// Get deleted process tabs
export const getDeletedProcessTabs = async () => {
    try {
        const { data } = await instance.get(`${URL}/deleted`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách deleted process tabs:', error);
        throw error;
    }
};

// Restore a deleted process tab
export const restoreProcessTab = async (id) => {
    try {
        const { data } = await instance.put(`${URL}/restore/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi khôi phục process tab:', error);
        throw error;
    }
};