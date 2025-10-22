import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllSectionCharts = async () => {
  try {
    const { data } = await instance.get(`${BASE_URL}/api/section-chart`);
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    throw new Error('Không thể lấy danh sách Section Chart.');
  }
}

export const createSectionChart = async (newData) => {
  try {
    const { data } = await instance.post(`${BASE_URL}/api/section-chart`, newData);
    return data;
  } catch (error) {
    console.error('Lỗi khi tạo Section Chart:', error);
    throw new Error('Không thể tạo Section Chart.');
  }
}

export const updateSectionChart = async (id, newData) => {
  try {
    const { data } = await instance.put(`${BASE_URL}/api/section-chart/${id}`, newData);
    return data;
  } catch (error) {
    console.error('Lỗi khi cập nhật Section Chart:', error);
    throw new Error('Không thể cập nhật Section Chart.');
  }
}

export const deleteSectionChart = async (id) => {
  try {
    const { data } = await instance.delete(`${BASE_URL}/api/section-chart/${id}`);
    return data;
  } catch (error) {
    console.error('Lỗi khi xóa Section Chart:', error);
    throw new Error('Không thể xóa Section Chart.');
  }
}

export const updateAndShowSectionChart = async (newData) => {
  try {
    const { data } = await instance.post(`${BASE_URL}/api/section-chart/update-and-show`, newData);
    return data;
  } catch (error) {
    console.error('Lỗi khi tạo Section Chart:', error);
    throw new Error('Không thể tạo Section Chart.');
  }
}