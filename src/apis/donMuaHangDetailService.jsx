import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/don-mua-hang-detail'
const URL = BASE_URL + SUB_URL;

export const getAllDonMuaHangDetailByDonMuaHangId = async (id) => {
  try {
    const res = await instance.get(URL + '/' + id)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const createDonMuaHangDetail = async (data) => {
  try {
    const res = await instance.post(URL, data)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const updateDonMuaHangDetail = async (id, data) => {
  try {
    const res = await instance.put(URL + '/' + id, data)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const deleteDonMuaHangDetail = async (id) => {
  try {
    const res = await instance.delete(URL + '/' + id)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}