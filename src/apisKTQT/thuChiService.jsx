import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/thu-chi";
const URL = BASE_URL + SUB_URL;

// GET
export const getThuChiData = async () => {
    try {
        const result = await instance.get(URL);
        result.data.forEach((data) => {
            data.tien_thu = +data.tien_thu
            data.tien_chi = +data.tien_chi
        })
        return result.data.sort((a, b) => b.id - a.id);
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu thu chi: ", e);
        throw e;
    }
}

// UPDATE
export const updateThuChi = async (data) => {
    try {
        const result = await instance.put(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu thu chi: ", e);
        throw e;
    }
}

// CREATE
export const createThuChi = async (data) => {
    try {
        const result = await instance.post(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi tạo dữ liệu thu chi: ", e);
        throw e;
    }
}
