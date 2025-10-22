import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/ktqt-unit"
const URL = BASE_URL + SUB_URL;
export const getAllUnits = async () => {
  try {
    const data = await instance.get(URL);
    const filteredData = data.data.filter(item => item.show === true).sort((a, b) => b.id - a.id);
    return filteredData;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách unit:', error);
    throw error;
  }
};
export const createNewUnit = async (newRowData) => {
  try {
    let res = await instance.post(URL, newRowData)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export const updateUnit = async (newRowData) => {
  try {
    let res = await instance.put(URL, newRowData)
    return res
  } catch (error) {
    console.log(1, error);
    throw error;
  }
}
export const deleteUnit = async (id) => {
  try {
    let res = await instance.delete(URL+'/'+id)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}
