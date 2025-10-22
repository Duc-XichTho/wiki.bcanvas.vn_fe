import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/measure';
const URL = BASE_URL + SUB_URL;

export const fetchAllMeasures = async (params = {}) => {
    try {
        const result = await instance.get(URL, { params });
        return result.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách thống kê:', error);
        throw error;
    }
};

export const fetchMeasureById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin thống kê:', error);
        throw error;
    }
};

export const createMeasure = async (newRowData) => {
    try {
        const res = await instance.post(URL, newRowData);
        return res.data;
    } catch (error) {
        console.error('Lỗi khi tạo thống kê:', error);
        throw error;
    }
};

export const updateMeasure = async (newRowData) => {
    try {
        const res = await instance.put(URL, newRowData);
        return res.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật thống kê:', error);
        throw error;
    }
};

export const deleteMeasure = async (id) => {
    try {
        const res = await instance.delete(URL + '/' + id);
        return res.data;
    } catch (error) {
        console.error('Lỗi khi xóa thống kê:', error);
        throw error;
    }
};

export const deleteMultipleMeasures = async (ids) => {
    try {
        const res = await instance.delete(URL + '/multiple', { data: { ids } });
        return res.data;
    } catch (error) {
        console.error('Lỗi khi xóa nhiều Measures:', error);
        throw error;
    }
};
