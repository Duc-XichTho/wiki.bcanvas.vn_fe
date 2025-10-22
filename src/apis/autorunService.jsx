import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/autorun';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllAutoRun = async () => {
    try {
        const response = await instance.get(URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching Auto Runs:', error);
        throw error;
    }
};  

// CREATE
export const createAutoRun = async (data) => {
    try {
        const response = await instance.post(URL, data);
        return response.data;
    } catch (error) {
        console.error('Error creating Auto Run:', error);
        throw error;
    };
};

// UPDATE
export const updateAutoRun = async (data) => {
    try {
        const response = await instance.put(`${URL}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating Auto Run:', error);
        throw error;
    };
};

// DELETE
export const deleteAutoRun = async (id) => {
    try {
        const response = await instance.delete(`${URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting Auto Run:', error);
        throw error;
    };
};

export const getAutoRunByTableId = async (tableId) => {
    try {
        const response = await instance.get(`${URL}/table/${tableId}`);
        const sortedData = response.data.sort((a, b) => b.id - a.id); // sort từ lớn đến bé
        return sortedData;
    } catch (error) {
        console.error('Error fetching Auto Runs by Table Id:', error);
        throw error;
    }
}
export const getAutoRunById = async (id) => {   
    try {
        const response = await instance.get(`${URL}/${id}`);
        const sortedData = response.data.sort((a, b) => b.id - a.id); // sort từ lớn đến bé
        return sortedData;
    } catch (error) {
            console.error('Error fetching Auto Runs by KHKD:', error);
        throw error;
    }
}
