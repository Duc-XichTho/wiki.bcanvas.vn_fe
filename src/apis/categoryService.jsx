import instance from './axiosInterceptors'
const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/category';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllCategory = async () => {
    try {
        const respone = await instance.get(URL);
        return respone.data;
    } catch (e) {
        console.error('Lỗi khi lấy dữ liệu category: ', error);
        throw error;
    }
}

// UPDATE
export const updateCategory = async (data) => {
    try {
        const respone = await instance.post(URL, data);
        return respone.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật dữ liệu category: ', error);
        throw error;
    }
}

// CREATE
export const createCategory = async (data) => {
    try {
        const respone = await instance.post(URL + '/create', data);
        return respone.data;
    } catch (error) {
        console.error('Lỗi khi tạo dữ liệu category mới: ', error);
        throw error;
    }
}