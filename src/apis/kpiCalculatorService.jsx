import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/kpi-calculator";
const URL = BASE_URL + SUB_URL;

export const getAllKpiCalculator = async () => {
  try {
    const { data } = await instance.get(URL);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const getKpiCalculatorById = async (id) => {
  try {
    const { data } = await instance.get(URL + "/" + id);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const createKpiCalculator = async (data) => {
  try {
    const result = await instance.post(URL, data);
    return result.data;
  } catch (error) {
    console.error("Lỗi khi tạo thông tin:", error);
    throw error;
  }
};

export const updateKpiCalculator = async (data) => {
  try {
    const result = await instance.put(URL, data);
    return result.data;
  } catch (error) {
    console.error("Lỗi khi tạo thông tin:", error);
    throw error;
  }
};

export const deleteKpiCalculator = async (id) => {
  try {
    const result = await instance.delete(URL + "/" + id);
    return result.data;
  } catch (error) {
    console.error("Lỗi khi tạo thông tin:", error);
    throw error;
  }
};

export const duplicateKpiCalculator = async (id) => {
  try {
    const result = await instance.post(URL + "/" + id + "/duplicate");
    return result.data;
  } catch (error) {
    console.error("Lỗi khi duplicate thông tin:", error);
    throw error;
  }
};
