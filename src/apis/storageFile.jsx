import instance from './axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/storage-file'
const URL = BASE_URL + SUB_URL;

export const getAllStorageFiles = async (parentId = null) => {
    try {
        const params = parentId ? { parentId } : {};
        const {data} = await instance.get(URL, { params });
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách file:', error);
        throw error;
    }
};

export const getStorageFileById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu file: ", e);
        throw e;
    }
}

export const createNewStorageFile = async (newFileData) => {
    try {
        let res = await instance.post(URL, newFileData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateStorageFile = async (fileData) => {
    try {
        console.log('Updating storage file with data:', fileData);
        let res = await instance.put(URL, fileData)
        console.log('Update response:', res);
        return res
    } catch (error) {
        console.error('Error updating storage file:', error);
        throw error;
    }
}

export const deleteStorageFile = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const searchStorageFiles = async (searchTerm) => {
    try {
        const {data} = await instance.get(URL + '/search', {
            params: { q: searchTerm }
        });
        return data;
    } catch (error) {
        console.error('Lỗi khi tìm kiếm file:', error);
        throw error;
    }
};
