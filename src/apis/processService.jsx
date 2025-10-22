import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/process';
const URL = BASE_URL + SUB_URL;

// Create a new process
export const createProcess = async (processData) => {
    try {
        // Add default values for the actual table structure
        const dataToSend = {
            title: processData.title,
            description: processData.description, // Include description for order
            processTabId: processData.processTabId, // Required for 3-level hierarchy
            show: processData.show !== undefined ? processData.show : true,
            metadata: processData.metadata || {}
        };
        
        const { data } = await instance.post(URL, dataToSend);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo process:', error);
        throw error;
    }
};

// Get all processes
export const getAllProcesses = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách processes:', error);
        throw error;
    }
};

// Get process by ID
export const getProcessById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy process theo ID:', error);
        throw error;
    }
};

// Update a process
export const updateProcess = async (processData) => {
    try {
        // Add default values for the actual table structure
        const dataToSend = {
            id: processData.id,
            title: processData.title,
            description: processData.description, // Include description for order
            processTabId: processData.processTabId, // Required for 3-level hierarchy
            show: processData.show !== undefined ? processData.show : true,
            metadata: processData.metadata || {}
        };
        
        const { data } = await instance.put(URL, dataToSend);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật process:', error);
        throw error;
    }
};

// Delete a process
export const deleteProcess = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa process:', error);
        throw error;
    }
};

// Get processes by process tab ID
export const getProcessesByProcessTab = async (processTabId) => {
    try {
        const { data } = await instance.get(`${URL}/processTab/${processTabId}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy processes theo process tab:', error);
        throw error;
    }
};

// Get deleted processes
export const getDeletedProcesses = async () => {
    try {
        const { data } = await instance.get(`${URL}/deleted`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách deleted processes:', error);
        throw error;
    }
};

// Restore a deleted process
export const restoreProcess = async (id) => {
    try {
        const { data } = await instance.put(`${URL}/restore/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi khôi phục process:', error);
        throw error;
    }
};

// Update process privacy settings
export const updateProcessPrivacy = async (processId, privacySettings) => {
    try {
        const { data } = await instance.put(`${URL}/${processId}/privacy`, privacySettings);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật quyền riêng tư process:', error);
        throw error;
    }
};
