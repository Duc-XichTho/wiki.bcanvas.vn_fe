import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/phieu-chi2-detail'
const URL = BASE_URL + SUB_URL;


export const getPhieuChi2Detail = async (id) => {
  try {
    const res = await instance.get(URL + '/' + id)
    return res;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin:', error);
    throw error;
  }
}
export const createPhieuChi2Detail = async (data) => {
  try {
    const res = await instance.post(URL, data)
    return res
  } catch (error) {
    console.log("createPhieuChi2Detail", error);
    throw error;
  }
}

export const updatePhieuChi2Detail = async (id, data) => {
  try {
    const res = await instance.put(URL + '/' + id, data)
    return res
  } catch (error) {
    console.log("updatePhieuChi2Detail", error);
    throw error;
  }
}

export const deletePhieuChi2Detail = async (id) => {
  try {
    const res = await instance.delete(URL + '/' + id)
    return res
  } catch (error) {
    console.log("deletePhieuChi2Detail", error);
    throw error;
  }
}