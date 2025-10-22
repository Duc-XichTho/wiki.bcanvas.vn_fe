import instance from "./axiosInterceptors"
const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/tab-content';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllTabContent = async () => {
    try {
        const respone = await instance.get(URL);
        return respone.data;
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu TabContent: ', error);
        throw error;
    }
}

// UPDATE
export const updateTabContent = async (data) => {
    try {
        const respone = await instance.post(URL, data);
        return respone.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật dữ liệu Tab Content: ', error);
        throw error;
    }
}

// CREATE
export const createTabContent = async (data) => {
    try {
        const respone = await instance.post(URL + '/create', data);
        return respone.data;
    } catch (error) {
        console.error('Lỗi khi tạo dữ liệu Tab Content mới: ', error);
        throw error;
    }
}