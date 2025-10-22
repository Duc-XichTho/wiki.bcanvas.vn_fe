import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/ktqt-plan";
const URL = BASE_URL + SUB_URL;

export const getAllPlan = async () => {
  try {
    const data = await instance.get(URL);
    const filteredData = data.data.sort((a, b) => a.id - b.id).filter((item) => item.show === true);
    return filteredData;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const createNewPlan = async (data) => {
  try {
    let res = await instance.post(URL, data)
    return res
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const updatePlan = async (data) => {

  try {
    let res = await instance.put(URL, data)
    return res
  } catch (error) {
    console.log(1, error);
    throw error;
  }
}

export const deletePlan = async (id) => {

  try {
    let res = await instance.delete(`${URL}/${id}`);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
