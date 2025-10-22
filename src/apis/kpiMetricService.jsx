import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/kpi-metric';
const URL = BASE_URL + SUB_URL;

export const fetchAllKpiMetrics = async (params = {}) => {
    try {
        const result = await instance.get(URL, { params });
        return result.data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách KPI Metric:', error);
        throw error;
    }
};

export const fetchKpiMetricById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin KPI Metric:', error);
        throw error;
    }
};

export const createKpiMetric = async (newRowData) => {
    try {
        const res = await instance.post(URL, newRowData);
        return res.data;
    } catch (error) {
        console.error('Lỗi khi tạo KPI Metric:', error);
        throw error;
    }
};

export const updateKpiMetric = async (newRowData) => {
    try {
        const res = await instance.put(URL, newRowData);
        return res.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật KPI Metric:', error);
        throw error;
    }
};

export const deleteKpiMetric = async (id) => {
    try {
        const res = await instance.delete(URL + '/' + id);
        return res.data;
    } catch (error) {
        console.error('Lỗi khi xóa KPI Metric:', error);
        throw error;
    }
};

export const deleteMultipleKpiMetrics = async (ids) => {
    try {
        const res = await instance.delete(URL + '/multiple', { data: { ids } });
        return res.data;
    } catch (error) {
        console.error('Lỗi khi xóa nhiều KPI Metrics:', error);
        throw error;
    }
};
