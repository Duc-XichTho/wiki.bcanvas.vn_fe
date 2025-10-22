import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/tk-tien";
const URL = BASE_URL + SUB_URL;

export const getTkTien = async (year, account) => {
    try {
        const result = await instance.get(`${URL}/${year}/${account}`);
        return result.data[0];
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu thu chi: ", e);
        throw e;
    }
}

export const updateTkTien = async (data) => {
    try {
        const result = await instance.put(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu thu chi: ", e);
        throw e;
    }
}