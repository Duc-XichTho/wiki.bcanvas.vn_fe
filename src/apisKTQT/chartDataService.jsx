import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/chart-data";
const URL = BASE_URL + SUB_URL;

// GET
export const getChartData = async (table) => {
    try {
        const data = await instance.get(`${URL}/${table}`);
        return data.data;
    } catch (e) {
        console.error("Lỗi khi lấy thông tin: ", e);
        throw e;
    }
}

// UPDATE
export const updateChartData = async (data) => {
    try {
        const res = await instance.put(URL, data);
        return res;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin:", error);
        throw error;
    }
}

// CREATE
export const createChartData = async (table, data) => {
    try {
        const res = await instance.post(`${URL}/${table}`, data);
        return res;
    } catch (e) {
        console.error("Lỗi khi lấy thông tin:", e);
        throw e;
    }
}

// DELETE
export const deleteChartData = async (id) => {
    try {
        const res = await instance.delete(`${URL}/${id}`)
        return res;
    } catch (e) {
        console.error("Lỗi khi xóa dữ liệu: " + e);
        throw e;
    }
}