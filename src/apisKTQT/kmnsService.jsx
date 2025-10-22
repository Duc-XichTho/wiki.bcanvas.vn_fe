import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ktqt-kmns';
const URL = BASE_URL + SUB_URL;

export const getAllKmns = async () => {
  try {
    const data = await instance.get(URL);

    return data.data.sort((a, b) => b.id - a.id).filter((item) => item.show === true).sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin:', error);
    throw error;
  }
};

export const createNewKmns = async (newRowData) => {
  try {
    let res = await instance.post(URL, newRowData);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateKmns = async (newRowData) => {
  try {
    let res = await instance.put(URL, newRowData);
    return res;
  } catch (error) {
    console.log(1, error);
    throw error;
  }
};

export const deleteKmns = async (id) => {
  try {
    let res = await instance.delete(`${URL}/${id}`);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
