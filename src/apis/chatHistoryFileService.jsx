import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/chat-history-file';
const URL = BASE_URL + SUB_URL;

export const getUserChatHistoryFile = async (currentUser , idFile) => {
    try {
        const response = await instance.post(`${URL}` ,  {
            email: currentUser.email,
            id_file : idFile
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

export const deleteChatHistoryFile = async (id) => {
    try {
        const response = await instance.delete(`${URL}/${id}` , );
        return response.data; // { success: true, data: { totalChats, chatsToday } }
    } catch (error) {
        console.error('Lỗi khi lấy thống kê chat: ', error);
        throw error;
    }
};
