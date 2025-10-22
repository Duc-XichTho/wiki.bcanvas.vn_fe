import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ktqt-import-history';
const URL = BASE_URL + SUB_URL;

// Tạo mới lịch sử import
export const createKtqtImportHistory = async (data) => {
  try {
    const res = await instance.post(URL, data);
    return res.data;
  } catch (error) {
    console.error('Lỗi khi tạo mới lịch sử import:', error);
    throw error;
  }
};

// Lấy tất cả lịch sử import
export const getAllKtqtImportHistory = async () => {
  try {
    const res = await instance.get(URL);
    return res.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch sử import:', error);
    throw error;
  }
};

// Lấy chi tiết lịch sử import theo id
export const getKtqtImportHistoryById = async (id) => {
  try {
    const res = await instance.get(`${URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết lịch sử import:', error);
    throw error;
  }
};

// Lấy lịch sử import theo loại
export const getKtqtImportHistoryByType = async (phan_loai) => {
  try {
    const res = await instance.post(`${URL}/get-by-type`, {phan_loai});
    return res.data;
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử import theo loại:', error);
    throw error;
  }
};

// Cập nhật lịch sử import
export const updateKtqtImportHistory = async (data) => {
  try {
    const res = await instance.put(URL, data);
    return res;
  } catch (error) {
    console.error('Lỗi khi cập nhật lịch sử import:', error);
    throw error;
  }
};

// Xóa lịch sử import theo id
export const deleteKtqtImportHistory = async (id) => {
  try {
    const res = await instance.delete(`${URL}/${id}`);
    return res;
  } catch (error) {
    console.error('Lỗi khi xóa lịch sử import:', error);
    throw error;
  }
};

// Ẩn tất cả lịch sử import theo loại import
export const hideAllKtqtImportHistoryByType = async (data) => {
  try {
    const res = await instance.post(`${URL}/hide-by-type`, data);
    return res;
  } catch (error) {
    console.error('Lỗi khi ẩn lịch sử import theo loại:', error);
    throw error;
  }
};
