import instance from "../axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/gw-email";
const URL = BASE_URL + SUB_URL;

export const sendNotificationEmail = async (data) => {
    try {
        const response = await instance.post(`${URL}/notification`, data);
        return response.data;
    } catch (error) {
        console.error("Error sending notification email:", error);
        throw error;
    }
};

export const sendRequestEmail = async (data) => {
    try {
        const response = await instance.post(`${URL}/request`, data);
        return response.data;
    } catch (error) {
        console.error("Error sending notification email:", error);
        throw error;
    }
};

export const sendChangeStatusTicket = async (data) => {
    try {
        const response = await instance.post(`${URL}/change-status`, data);
        return response.data;
    } catch (error) {
        console.error("Error sending change status ticket email:", error);
        throw error;
    }
};

export const sendRegistrationEmail = async (data) => {
    try {
        const response = await instance.post(`${URL}/registration`, data);
        return response.data;
    } catch (error) {
        console.error("Error sending registration email:", error);
        throw error;
    }
};