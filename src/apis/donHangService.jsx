import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/don-hang'
const URL = BASE_URL + SUB_URL;

export const getDonHangById = async (id) => {
  try {
    const { data } = await instance.get(`${URL}/id/${id}`);
    return data;
  } catch (error) {
    console.log("getDonHangById", error);
    return null
  }
};


export const getDonHangByCode = async (code) => {
  try {
    const { data } = await instance.get(URL + '/' + code);
    return data
  } catch (error) {
    console.log("getDonHangByCode", error);
    throw error;
  }
}
export const getDonHangByCode2 = async (code) => {
  try {
    code = encodeURIComponent(code);
    const { data } = await instance.get(URL + '/code2/' + code);
    return data
  } catch (error) {
    console.log("getDonHangByCode", error);
    throw error;
  }
}

export const getAllDonHang = async () => {
  try {
    const { data } = await instance.get(URL);
    data.forEach((d) => {
      d.id_card_create = d.code2
    })
    return data
  } catch (error) {
    console.log("getAllDonHang", error);
    throw error;
  }
}

export const createDonHang = async (value) => {
  try {
    const {data} = await instance.post(URL, value)
    return data
  } catch (error) {
    console.log("createDonHang", error);
    throw error;
  }
}

export const updateDonHang = async (id, data) => {
  try {
    const res = await instance.put(URL + '/' + id, data)
    return res
  } catch (error) {
    console.log("updateDonHang", error);
    throw error;
  }
}

export const deleteDonHang = async (id) => {
  try {
    const res = await instance.delete(URL + '/' + id)
    return res
  } catch (error) {
    console.log("deleteDonHang", error);
    throw error;
  }
}
