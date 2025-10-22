import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/cf-config'
const URL = BASE_URL + SUB_URL;

export const getAllCFConfigService = async () => {
  try {
    const { data } = await instance.get(URL);
    return data;
  } catch (error) {
    console.error('Lỗi getAllCFConfigService', error);
  }
}

export const getCFConfigByIdService = async (id) => {
  try {
    const { data } = await instance.get(`${URL}/${id}`);
    return data;
  } catch (error) {
    console.error("Lỗi getCFConfigByIdService", error);
  }
}

export const getCFConfigByPlanIdService = async (planId) => {
  try {
    const { data } = await instance.get(`${URL}/plan/${planId}`);
    return data;
  } catch (error) {
    console.error("Lỗi getCFConfigByPlanIdService", error);
  }
}

export const createCFConfigService = async (newData) => {
  try {
    const { data } = await instance.post(URL, newData);
    return data;
  } catch (error) {
    console.error("Lỗi createCFConfigService", error);
  }
}

export const updateCFConfigService = async (id, newData) => {
  try {
    const { data } = await instance.put(`${URL}/${id}`, newData);
    return data;
  } catch (error) {
    console.error("Lỗi updateCFConfigService", error);
  }
}

export const deleteCFConfigService = async (id) => {
  try {
    const { data } = await instance.delete(`${URL}/${id}`);
    return data;
  } catch (error) {
    console.error("Lỗi deleteCFConfigService", error);
  }
}