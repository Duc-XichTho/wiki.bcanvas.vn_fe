import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/canvas-chat';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllCanvasChat = async () => {
    try {
        const response = await instance.get(URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching Canvas Chats:', error);
        throw error;
    }
};

// CREATE
export const createCanvasChat = async (data) => {
    try {
        const response = await instance.post(URL, data);
        return response.data;
    } catch (error) {
        console.error('Error creating Canvas Chat:', error);
        throw error;
    };
};

// UPDATE
export const updateCanvasChat = async (data) => {
    try {
        const response = await instance.put(`${URL}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating Canvas Chat:', error);
        throw error;
    };
};

// DELETE
export const deleteCanvasChat = async (id) => {
    try {
        const response = await instance.delete(`${URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting Canvas Chat:', error);
        throw error;
    };
};

export const getAllCanvasChatByIdCanvasContainer = async (idCanvasContainer) => {
    try {
        const response = await instance.get(`${URL}/canvas-container/${idCanvasContainer}`);
        const sortedData = response.data.sort((a, b) => b.id - a.id); // sort từ lớn đến bé
        return sortedData;
    } catch (error) {
        console.error('Error fetching Canvas Chats by Canvas Container:', error);
        throw error;
    }
}
export const getAllCanvasChatByIdKHKD = async (id) => {
    try {
        const response = await instance.get(`${URL}/khkd/${id}`);
        const sortedData = response.data.sort((a, b) => b.id - a.id); // sort từ lớn đến bé
        return sortedData;
    } catch (error) {
        console.error('Error fetching Canvas Chats by Canvas Container:', error);
        throw error;
    }
}
