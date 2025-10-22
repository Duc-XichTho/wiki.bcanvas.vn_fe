import instance from './axiosInterceptors';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/frequency-config`;

// Google Drive Folder APIs
export const createFrequencyConfig = async (data) => {
  return instance.post(`${BASE_URL}`, data);
};  


// Cập nhật cấu hình frequency
export const updateFrequencyConfig = async (id, data) => {
  return instance.put(`${BASE_URL}/${id}`, data);
};

// Xóa cấu hình frequency
export const deleteFrequencyConfig = async (id) => {
  return instance.delete(`${BASE_URL}/${id}`);
};

// Lấy cấu hình frequency theo table_id
export const getFrequencyConfigByTableId = async (tableId, schema) => {

  return instance.get(`${BASE_URL}/table/${tableId}`, {schema});
};

// Lấy tất cả cấu hình frequency đang hoạt động
export const getActiveFrequencyConfigs = async () => {
  return instance.get(`${BASE_URL}/active`);
};

// Chạy kiểm tra và thực thi các frequency config
export const runFrequencyCheck = async () => {
  return instance.post(`${BASE_URL}/run-check`);
};