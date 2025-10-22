import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/file-note-pad'
const URL = BASE_URL + SUB_URL;

export const getFileNotePadById = async (id) => {
    try {
        const { data } = await axios.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};