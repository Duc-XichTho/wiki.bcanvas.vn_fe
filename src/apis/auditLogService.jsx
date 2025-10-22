import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/audit-log";
const URL = BASE_URL + SUB_URL;

export const getAuditLogs = async (page = 1, limit = 50) => {
  try {
    const { data } = await instance.get(`${URL}?page=${page}&limit=${limit}`);
    return data.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const getCountAuditLogByTableName = async (tableName) => {
  try {
    const { data } = await instance.get(URL + "/count/" + tableName);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const getAuditLogByTableName = async (tableName) => {
  try {
    const { data } = await instance.get(URL + "/table/" + tableName+'?limit=2000');
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};
