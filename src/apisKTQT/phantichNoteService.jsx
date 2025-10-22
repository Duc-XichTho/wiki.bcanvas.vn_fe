import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/ktqt-phan-tich-note";
const URL = BASE_URL + SUB_URL;
export const getAllPhanTichNote = async () => {
  try {
    const { data } = await instance.get(URL);
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    throw error;
  }
}

export const createPhanTichNote = async (newData) => {
  try {
    const { data } = await instance.post(URL, newData);
    return data;
  } catch (error) {
    console.error('Lỗi khi tạo wikinote:', error);
    throw error;
  }
}

export const updatePhanTichNote = async (id, newData) => {
  try {
    const { data } = await instance.put(`${URL}/${id}`, newData);
    return data;
  } catch (error) {
    console.error('Lỗi khi cập nhật wikinote:', error);
    throw error;
  }
}

export const deletePhanTichNote = async (id) => {
  try {
    const { data } = await instance.delete(`${URL}/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};
