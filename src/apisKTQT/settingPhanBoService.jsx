import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/setting-phan-bo";
const URL = BASE_URL + SUB_URL;

// GET
export const getSettingPhanBoData = async (tab_id) => {
    try {
        const result = await instance.get(URL + `/${tab_id}`);
        return result.data[0];
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu cài đặt phân bổ: ", e);
        throw e;
    }
}

// UPDATE
export const updatedSettingPhanBoData = async (data) => {
    try {
        const result = await instance.put(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi cập nhật dữ liệu cài đặt phân bổ: ", e);
        throw e;
    }
}