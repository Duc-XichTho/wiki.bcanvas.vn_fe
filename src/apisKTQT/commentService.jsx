import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/comment";
const URL = BASE_URL + SUB_URL;

// GET
export const getCommentData = async (tab, row_id) => {
    try {
        const result = await instance.get(`${URL}/${tab}/${row_id}`);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu thảo luận: ", e);
        throw e;
    }
}

// CREATE
export const createCommentData = async (data) => {
    try {
        const result = await instance.post(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi tạo dữ liệu thảo luận: ", e);
        throw e;
    }
}

// PUT
export const updateUserNickName = async (data) => {
    try {
        const result = await instance.put(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi tạo dữ liệu thảo luận: ", e);
        throw e;
    }
}