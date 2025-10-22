import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/business-categories';
const URL = BASE_URL + SUB_URL;

export const fetchAllBusinessCategories = async () => {
    try {
        const result = await instance.get(URL);
        return result.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách business categories:', error);
        throw error;
    }
};


export const fetchBusinessCategoryById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (error) {
        console.error('Lỗi khi lấy business category:', error);
        throw error;
    }
};

export const createBusinessCategory = async (data) => {
    try {
        const result = await instance.post(URL, data);
        return result.data;
    } catch (error) {
        console.error('Lỗi khi tạo business category:', error);
        throw error;
    }
};


export const updateBusinessCategory = async (data) => {
    try {
        console.log(data);
        const result = await instance.put(URL , data);
        return result.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật business category:', error);
        throw error;
    }
};


export const deleteBusinessCategory = async (id) => {
    try {
        console.log(id);
        const result = await instance.delete(URL + '/' + id);
        return result.data;
    } catch (error) {
        console.error('Lỗi khi xóa business category:', error);
        throw error;
    }
};
