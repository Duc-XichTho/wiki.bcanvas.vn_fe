import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/canvas-notepad'
const URL = BASE_URL + SUB_URL;

// GET
export const getAllCanvasNotepad = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getCanvasNotepadById = async (id) => {
    try {
        const { data } = await instance.get(URL + '/' + id);
        return data[0];
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

// CREATE
export const createNewCanvasNotepad = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log('Lỗi khi tạo mới:', error);
        throw error;
    }
};

// UPDATE
export const updateCanvasNotepad = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res.data
    } catch (error) {
        console.log('Lỗi khi cập nhật:', error);
        throw error;
    }
};

// DELETE
export const deleteCanvasNotepad = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log('Lỗi khi xóa:', error);
        throw error;
    }
};