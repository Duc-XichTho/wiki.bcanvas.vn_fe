import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/phan-bo";
const URL = BASE_URL + SUB_URL;

export const getAllPhanBo = async () => {
  try {
    const data = await instance.get(URL);
    const filteredData = data.data.filter((item) => item.show === true);
    return filteredData;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const createNewPhanBo = async (newRowData) => {
  try {
    let res = await instance.post(URL, newRowData)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const updatePhanBo = async (newRowData) => {
  try {
    let res = await instance.put(URL, newRowData)
    return res
  } catch (error) {
    console.log(1, error);
    throw error;
  }
}

export const deletePhanBo = async (id) => {
  try {
    let res = await instance.delete(`${URL}/${id}`);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
