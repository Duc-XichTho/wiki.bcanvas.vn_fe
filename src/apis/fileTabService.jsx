import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/file-tab";
const URL = BASE_URL + SUB_URL;

// GET
export const getAllFileTab = async () => {
  try {
    const { data } = await instance.get(URL);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const getFileTabByType = async (type , table  ) => {
  try {
    const { data } = await instance.get(`${URL}/by-type?table=${table}&type=${type}`);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const getFileTabByTypeData = async () => {
  try {
    const { data } = await instance.get(`${URL}/all-type-data`);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};


// CREATE
export const createFileTab = async (data) => {
  try {
    const result = await instance.post(URL, data);
    return result.data;
  } catch (error) {
    console.error("Lỗi khi tạo file tab:", error);
    throw error;
  }
};

// UPDATE
export const updateFileTab = async (data) => {
  try {
    const result = await instance.put(URL, data);
    return result.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật file tab:", error);
    throw error;
  }
};

// DELETE
export const deleteFileTab = async (id) => {
  try {
    const result = await instance.delete(URL + "/" + id);
    return result.data;
  } catch (error) {
    console.error("Lỗi khi xóa file tab:", error);
    throw error;
  }
};
