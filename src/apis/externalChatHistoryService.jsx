import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/external-chat-history';
const URL = BASE_URL + SUB_URL;

export const getUserExternalChatHistory = async (currentUser) => {
    try {
        const response = await instance.post(`${URL}` ,  {
            email: currentUser.email
        }, {
            params: { limit: 100 }
        });
        return response.data; // { success: true, data: { totalChats, chatsToday } }
    } catch (error) {
        console.error('Lỗi khi lấy thống kê chat: ', error);
        throw error;
    }
};

export const getUserChatStats = async (currentUser) => {
    try {
        const response = await instance.post(`${URL}/stats` , {email : currentUser.email});
        return response.data; // { success: true, data: { totalChats, chatsToday } }
    } catch (error) {
        console.error('Lỗi khi lấy thống kê chat: ', error);
        throw error;
    }
};


export const clearExternalChatHistory = async (currentUser) => {
    try {
        const response = await instance.delete(URL ,  {
            params: { email: currentUser.email }
        });
        return response.data; // { success: true, message: '...' }
    } catch (error) {
        console.error('Lỗi khi xóa lịch sử chat: ', error);
        throw error;
    }
};


export const deleteExternalChatHistory = async (id) => {
    try {
        return await instance.delete(`${URL}/${id}`) ;
    } catch (error) {
        console.error('Lỗi khi xóa lịch sử chat: ', error);
        throw error;
    }
};