import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/process-item';
const URL = BASE_URL + SUB_URL;

// Create a new process item
export const createProcessItem = async (processItemData) => {
    try {
        // Add default values for the actual table structure
        const dataToSend = {
            title: processItemData.title,
            description: processItemData.description,
            content: processItemData.content || '',
            processId: processItemData.processId,
            order: processItemData.order || 0,
            show: processItemData.show !== undefined ? processItemData.show : true,
            privacyType: processItemData.privacyType || 'public',
            users: processItemData.users || [],
            metadata: processItemData.metadata || {}
        };
        
        const { data } = await instance.post(URL, dataToSend);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo process item:', error);
        throw error;
    }
};

// Get all process items
export const getAllProcessItems = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách process items:', error);
        throw error;
    }
};

// Get process item by ID
export const getProcessItemById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy process item theo ID:', error);
        throw error;
    }
};

// Get all items for a specific process
export const getProcessItemsByProcessId = async (processId) => {
    try {
        const { data } = await instance.get(`${URL}/process/${processId}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy process items theo process ID:', error);
        throw error;
    }
};

// Update a process item
export const updateProcessItem = async (processItemData) => {
    try {
        // Build partial update payload: only include fields explicitly provided
        const dataToSend = { id: processItemData.id };
        if ('title' in processItemData) dataToSend.title = processItemData.title;
        if ('description' in processItemData) dataToSend.description = processItemData.description;
        if ('content' in processItemData) dataToSend.content = processItemData.content; // do not default to ''
        if ('processId' in processItemData) dataToSend.processId = processItemData.processId;
        if ('order' in processItemData) dataToSend.order = processItemData.order;
        if ('show' in processItemData) dataToSend.show = processItemData.show;
        if ('privacyType' in processItemData) dataToSend.privacyType = processItemData.privacyType;
        if ('users' in processItemData) dataToSend.users = processItemData.users;
        if ('metadata' in processItemData) dataToSend.metadata = processItemData.metadata;
        
        const { data } = await instance.put(URL, dataToSend);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật process item:', error);
        throw error;
    }
};

// Delete a process item
export const deleteProcessItem = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa process item:', error);
        throw error;
    }
};

// Get deleted process items
export const getDeletedProcessItems = async () => {
    try {
        const { data } = await instance.get(`${URL}/deleted`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách deleted process items:', error);
        throw error;
    }
};

// Restore a deleted process item
export const restoreProcessItem = async (id) => {
    try {
        const { data } = await instance.put(`${URL}/restore/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi khôi phục process item:', error);
        throw error;
    }
};
