import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllWikiFiles = async () => {
  try {
    const { data } = await instance.get(`${BASE_URL}/api/wiki-file`);
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    throw error;
  }
}

export const createWikiFile = async (newData) => {
  try {
      const { data } = await instance.post(`${BASE_URL}/api/wiki-file`, newData);
      return data;
  } catch (error) {
      console.error('Lỗi khi tạo file:', error);
      throw error;
  }
}

export const updateWikiFile = async (id, newData) => {
  try {
      const { data } = await instance.put(`${BASE_URL}/api/wiki-file/${id}`, newData);
      return data;
  } catch (error) {
      console.error('Lỗi khi cập nhật file:', error);
      throw error;
  }
}

export const deleteWikiFile = async (id) => {
  try {
      const { data } = await instance.delete(`${BASE_URL}/api/wiki-file/${id}`);
      return data;
  } catch (error) {
      throw error;
  }
}