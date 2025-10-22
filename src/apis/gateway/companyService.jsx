import instance from "../axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/gw-company";
const URL = BASE_URL + SUB_URL;

// GET
export const getAllCompany = async () => {
  try {
    const { data } = await instance.get(URL);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

// UPDATE
export const updateCompany = async (newData) => {
  try {
    const { data } = await instance.put(URL, newData);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

// CREATE
export const createCompany = async (newData) => {
  try {
    const { data } = await instance.post(URL, newData);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

// DELETE
export const deleteCompany = async (id) => {
  try {
    const { data } = await instance.delete(`${URL}/${id}`);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};
