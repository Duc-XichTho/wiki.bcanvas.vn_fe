import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/schema';
const URL = BASE_URL + SUB_URL;

// CREATE API
export const getAllSchema = async () => {
    try {
        const response = await instance.get(URL);
        return response.data.schemas;
    } catch (error) {
        console.error('Error getting schema:', error);
        throw error;
    }
}

export const createSchema = async (data) => {
    try {
        const response = await instance.post(URL, data);
        return response;
    } catch (error) {
        console.error('Error creating schema:', error);
        throw error;
    }
}
