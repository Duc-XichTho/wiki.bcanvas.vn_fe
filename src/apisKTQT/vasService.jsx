import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/ktqt-vas";
const URL = BASE_URL + SUB_URL;

export const getAllVas = async () => {
  try {
    const data = await instance.get(URL);
    const filteredData = data.data.filter((item) => item.show === true);
    return filteredData;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const createNewVas = async (newRowData) => {
  try {
    let res = await instance.post(URL, newRowData)
    console.log(res)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const updateVas = async (newRowData) => {
  try {
    let res = await instance.put(URL, newRowData)
    return res
  } catch (error) {
    console.log(1, error);
    throw error;
  }
}

export const deleteVas = async (id) => {

  try {
    let res = await instance.delete(`${URL}/${id}`);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
