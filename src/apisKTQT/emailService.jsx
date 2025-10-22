import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/email";
const URL = BASE_URL + SUB_URL;

export const sendEmail = async (data) => {
    try {
        const result = await instance.post(URL + '/send', data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi gửi email: ", e);
        throw e;
    }
}

export const sendEmailWithTemplate = async (data) => {
    try {
        const result = await instance.post(URL + '/send-template', data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi gửi email: ", e);
        throw e;
    }
}

export const sendEmailWithAttachments = async (data) => {
    try {
        const result = await instance.post(URL + '/send-with-attachments', data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi gửi email: ", e);
        throw e;
    }
}
