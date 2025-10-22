import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/conversation';
const URL = BASE_URL + SUB_URL;

// GET
export const getConversationByEmail = async (email) => {
    try {
        const response = await instance.get(URL + '/' + email);
        return response.data[0];
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu conversation bằng email: ', error);
        throw error;
    }
};

// UPDATE
export const updateConversation = async (data) => {
    try {
        const response = await instance.put(URL, data);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật conversation: ', error);
        throw error;
    }
}