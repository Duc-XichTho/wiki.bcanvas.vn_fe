import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/tts'
const URL = BASE_URL + SUB_URL;
export const requestSpeech = async (htmlText) => {
    try {
        const  {data}  = await instance.post(`${URL}/speak`, { htmlText });
        return data;
    } catch (error) {
        console.error('Lỗi khi gửi yêu cầu TTS:', error.response?.data || error.message);
        throw error;
    }
};

export const handleTTSCallback = async (callbackData) => {
    try {
        const { data } = await instance.post(`${URL}/callback`, callbackData);
        return data;
    } catch (error) {
        console.error('Lỗi khi xử lý callback:', error.response?.data || error.message);
        throw error;
    }
};