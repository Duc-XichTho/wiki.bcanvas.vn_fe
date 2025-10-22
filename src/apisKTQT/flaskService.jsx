import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_CODEGYM_FLASK_URL;
const SUB_URL = "/api/openai";
const URL = BASE_URL + SUB_URL;

// Function to embed data
export const addEmbedding = async (data) => {
    try {
        const response = await axios.post(URL + '/flask/add_embedding', { data }, { withCredentials: true });
        return response.data;
    } catch (e) {
        console.error("Error during embedding: ", e);
        throw e;
    }
}

export const updateEmbedding = async (data) => {
    try {
        const response = await axios.post(URL + '/flask/update_embedding', { data }, { withCredentials: true });
        return response.data;
    } catch (e) {
        console.error("Error during embedding: ", e);
        throw e;
    }
}

export const updateEmbeddingBot = async (data) => {
    try {
        const response = await axios.post(URL + '/flask/bot_embedding', { data }, { withCredentials: true });
        return response.data;
    } catch (e) {
        console.error("Error during embedding: ", e);
        throw e;
    }
}

// Function to answer questions
export const askQuestion = async (id, question) => {
    try {
        const response = await axios.post(URL + '/flask/question', { id, question });
        return response.data;
    } catch (e) {
        console.error("Error during question answering: ", e);
        throw e;
    }
}