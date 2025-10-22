import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/canvas-bot'
const URL = BASE_URL + SUB_URL;

// GET
export const getAllCanvasBot = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

// CREATE
export const createNewCanvasBot = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data
    } catch (error) {
        console.log('Lỗi khi tạo mới:', error);
        throw error;
    }
};

// UPDATE
export const updateCanvasBot = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res.data
    } catch (error) {
        console.log('Lỗi khi cập nhật:', error);
        throw error;
    }
};

// DELETE
export const deleteCanvasBot = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res.data
    } catch (error) {
        console.log('Lỗi khi xóa:', error);
        throw error;
    }
}

export const getCanvasBotByIdCanvasContainer = async (idCanvasContainer) => {
    try {
        const { data } = await instance.get(URL + '/canvas-container/' + idCanvasContainer);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};
export const getCanvasBotByIdKHKD = async (idCanvasContainer) => {
    try {
        const { data } = await instance.get(URL + '/khkd/' + idCanvasContainer);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};
