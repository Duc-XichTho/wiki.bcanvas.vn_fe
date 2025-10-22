import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/sheet-data';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllSheetDataBySheetId = async (sheet_id) => {
    try {
        const { data } = await instance.get(URL + '/' + sheet_id);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

// CREATE
export const createNewSheetData = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data;
    } catch (error) {
        console.error("Lỗi khi tạo mới dòng:", error);
        throw error;
    }
};

// UPDATE
export const updateSheetData = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật dòng:", error);
        throw error;
    }
};

// DELETE
export const deleteSheetData = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res.data;
    } catch (error) {
        console.error("Lỗi khi xóa dòng:", error);
        throw error;
    }
};