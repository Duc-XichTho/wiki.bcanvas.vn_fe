import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/don-mua-hang'
const URL = BASE_URL + SUB_URL;

export const getDonMuaHangByCode = async (code) => {
  try {
    const { data } = await instance.get(URL + '/' + code);
    return data
  } catch (error) {
    console.log("getDonMuaHangByCode", error);
    throw error;
  }
}
export const getDonMuaHangByCode2 = async (code) => {
  try {
    code = encodeURIComponent(code);
    const { data } = await instance.get(URL + '/code2/' + code);
    return data
  } catch (error) {
    console.log("getDonMuaHangByCode", error);
    throw error;
  }
}

export const getAllDonMuaHang = async () => {
  try {
    const { data } = await instance.get(URL);
    data.forEach((d) => {
      d.id_card_create = d.code2
    })
    return data
  } catch (error) {
    console.log("getAllDonMuaHang", error);
    throw error;
  }
}

export const createDonMuaHang = async (data) => {
  try {
    const res = await instance.post(URL, data)
    return res.data
  } catch (error) {
    console.log("createDonMuaHang", error);
    throw error;
  }
}

export const updateDonMuaHang = async (id, data) => {
  try {
    const res = await instance.put(URL + '/' + id, data)
    return res
  } catch (error) {
    console.log("updateDonMuaHang", error);
    throw error;
  }
}

export const deleteDonMuaHang = async (id) => {
  try {
    const res = await instance.delete(URL + '/' + id)
    return res
  } catch (error) {
    console.log("deleteDonMuaHang", error);
    throw error;
  }
}