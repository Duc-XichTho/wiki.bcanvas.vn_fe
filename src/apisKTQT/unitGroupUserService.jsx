import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllUnitGroupUser = async () => {
  try {
    const { data } = await instance.get(`${BASE_URL}/api/unit-group-user`);
    return data;
  } catch (error) {
    console.error('Lỗi khi lọc nhóm người dùng:', error);
    throw error;
  }
}

export const createUnitGroupUser = async (newData) => {
  try {
    const { data } = await instance.post(`${BASE_URL}/api/unit-group-user`, newData);
    return data;
  } catch (error) {
    throw error;
  }
}

export const deleteUnitGroupUser = async (ids) => {
  try {
    const { data } = await instance.delete(`${BASE_URL}/api/unit-group-user`, {
      data: { ids },
    });
    return data;
  } catch (error) {
    throw error;
  }
}