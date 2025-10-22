import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/deal'
const URL = BASE_URL + SUB_URL;
export const getAllDeal = async () => {
  try {
    const { data } = await instance.get(URL);
    const filteredData = data.filter(item => item.show === true).sort((a, b) => b.id - a.id);
    return filteredData;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin:', error);
    throw error;
  }
};

export const createNewDeal = async (newRowData) => {
  try {
    let res = await instance.post(URL, newRowData)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export const updateDeal = async ( newRowData) => {
  try {
    let res = await instance.put(URL, newRowData)
    return res
  } catch (error) {
    console.log(1, error);
    throw error;
  }
}
export const deleteDeal = async (id) => {
  try {
    let res = await instance.delete(URL+'/'+id)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}