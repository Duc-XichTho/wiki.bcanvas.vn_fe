import instance from './axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/storage-folder'
const URL = BASE_URL + SUB_URL;

export const getAllStorageFolders = async (parentId = null) => {
    try {
        const params = parentId ? { parentId } : {};
        const {data} = await instance.get(URL, { params });
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách thư mục:', error);
        throw error;
    }
};

export const getStorageFolderById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu thư mục: ", e);
        throw e;
    }
}

export const createNewStorageFolder = async (newFolderData) => {
    try {
        let res = await instance.post(URL, newFolderData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateStorageFolder = async (folderData) => {
    try {
        console.log('Updating storage folder with data:', folderData);
        let res = await instance.put(URL, folderData)
        console.log('Update response:', res);
        return res
    } catch (error) {
        console.error('Error updating storage folder:', error);
        throw error;
    }
}

export const deleteStorageFolder = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const getAllFoldersForBreadcrumb = async () => {
    try {
        const {data} = await instance.get(URL + '/all');
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy tất cả thư mục:', error);
        throw error;
    }
};

export const getFolderTree = async () => {
    try {
        const {data} = await instance.get(URL + '/tree');
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy cây thư mục:', error);
        throw error;
    }
};
