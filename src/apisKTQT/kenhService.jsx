import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/ktqt-kenh";
const URL = BASE_URL + SUB_URL;

export const getAllKenh = async () => {
  try {
    const data = await instance.get(URL);
    return data.data.filter((item) => item.show === true).sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const createNewKenh = async (newRowData) => {
  try {
    let res = await instance.post(URL, newRowData)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const updateKenh = async (newRowData) => {
  try {
    let res = await instance.put(URL, newRowData)
    return res
  } catch (error) {
    console.log(1, error);
    throw error;
  }
}

export const deleteKenh = async (id) => {
  try {
    let res = await instance.delete(`${URL}/${id}`);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
