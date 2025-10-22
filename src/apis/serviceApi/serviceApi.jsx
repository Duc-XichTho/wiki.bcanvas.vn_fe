import instance from '../axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/service-proxy'
const URL = BASE_URL + SUB_URL;

export const sendQuestionToAIDPAS = async (value ) => {
    try {
        const {data} = await instance.post(URL+`/qa/ask` , value);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const sendQuestionSourceIDToAIDataFile = async (value ) => {
    try {
        const {data} = await instance.post(URL+`/ask-with-sources` , value);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const sendQuestionSourceIDToAIDataFileOne = async (value ) => {
    try {
        const {data} = await instance.post(URL+`/ask-with-sources-one` , value);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const sendRequestEmbedDataFile = async (value ) => {
    try {
        const {data} = await instance.post(URL+`/embed` , value);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const sendRequestDeleteEmbedDataFile = async (value ) => {
    try {
        const {data} = await instance.post(URL+`/delete-embed` , value);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

