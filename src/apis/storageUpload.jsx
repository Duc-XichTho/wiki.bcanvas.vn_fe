import instance from './axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/storage-upload'
const URL = BASE_URL + SUB_URL;

export const uploadFiles = async (files, parentId = null, userCreate = 'system') => {
    try {
        const formData = new FormData();
        
        // Add files to FormData
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        // Add additional data
        formData.append('parentId', parentId || '');
        formData.append('user_create', userCreate);

        const {data} = await instance.post(URL + '/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error) {
        console.error('Lỗi khi upload file:', error);
        throw error;
    }
};

export const createFolder = async (folderData) => {
    try {
        const {data} = await instance.post(URL + '/create-folder', folderData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo thư mục:', error);
        throw error;
    }
};
