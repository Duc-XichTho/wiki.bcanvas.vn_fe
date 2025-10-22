import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/recent-folder';
const URL = BASE_URL + SUB_URL;

// Lấy tất cả recent folders
export const getAllRecentFolders = async () => {
    try {
        const response = await instance.get(URL);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách recent folders:', error);
        throw error;
    }
};

// Lấy recent folders theo userClass
export const getRecentFoldersByUserClass = async (userClass) => {
    try {
        console.log('API - Getting recent folders for userClass:', userClass);
        let response;
        
        if (Array.isArray(userClass)) {
            // If userClass is an array, send as POST with body
            response = await instance.post(`${URL}/user-class`, { userClass });
        } else {
            // If userClass is a single ID, use GET
            response = await instance.get(`${URL}/user-class/${userClass}`);
        }
        
        console.log('API - Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy recent folders theo userClass:', error);
        console.error('Error details:', error.response?.data);
        throw error;
    }
};

// Tạo recent folder mới
export const createRecentFolder = async (folderData) => {
    try {
        console.log('API - Creating recent folder:', folderData);
        console.log('API - URL:', URL);
        const response = await instance.post(URL, folderData);
        console.log('API - Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi tạo recent folder:', error);
        console.error('Error details:', error.response?.data);
        throw error;
    }
};

// Cập nhật recent folder
export const updateRecentFolder = async (id, folderData) => {
    try {
        console.log('API - Updating recent folder:', id, folderData);
        const response = await instance.put(`${URL}/${id}`, folderData);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật recent folder:', error);
        throw error;
    }
};

// Xóa recent folder (soft delete)
export const deleteRecentFolder = async (id) => {
    try {
        console.log('API - Deleting recent folder:', id);
        const response = await instance.delete(`${URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi xóa recent folder:', error);
        throw error;
    }
};

// Xóa vĩnh viễn recent folder
export const permanentDeleteRecentFolder = async (id) => {
    try {
        console.log('API - Permanently deleting recent folder:', id);
        const response = await instance.delete(`${URL}/${id}/permanent`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi xóa vĩnh viễn recent folder:', error);
        throw error;
    }
};

// Làm sạch các recent folders cũ
export const cleanupOldRecentFolders = async (daysOld = 30) => {
    try {
        console.log('API - Cleaning up old recent folders:', daysOld);
        const response = await instance.post(`${URL}/cleanup`, { daysOld });
        return response.data;
    } catch (error) {
        console.error('Lỗi khi làm sạch recent folders cũ:', error);
        throw error;
    }
};

// Helper function để thêm folder vào recent (tự động tạo hoặc cập nhật)
export const addToRecentFolders = async (folderName, folderLink, userClass) => {
    try {
        const folderData = {
            name: folderName,
            link: folderLink,
            userClass: userClass
        };
        
        const result = await createRecentFolder(folderData);
        console.log('Folder đã được thêm vào recent:', result);
        return result;
    } catch (error) {
        console.error('Lỗi khi thêm folder vào recent:', error);
        throw error;
    }
};
