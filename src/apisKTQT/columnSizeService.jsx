import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/column-size';
const URL = BASE_URL + SUB_URL;

// GET API
export const getAllDataByTableName = async (schema, tableName) => {
    try {
        const response = await instance.get(`${URL}/${schema}/${tableName}`);
        return response.data.data;
    }
    catch (error) {
        console.error('Error fetching column size data:', error);
        throw error;
    }
}

// UPDATE API
export const updateColumnWidth = async (data) => {
    try {
        const response = await instance.put(`${URL}/update-column-width`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating column width:', error);
        throw error;
    }
}
