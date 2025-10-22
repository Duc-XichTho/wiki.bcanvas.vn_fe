import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/drop-down";
const URL = BASE_URL + SUB_URL;

// GET
export const getDropDownData = async () => {
    try {
        const result = await instance.get(URL);
        return result.data.map(item => ({
            ...item,
            value: item.name_type === 'nhom_thu_chi'
                ? item.value.sort((a, b) => (a.type === 'thu' ? -1 : 1))
                : item.value
        }));
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu thu chi: ", e);
        throw e;
    }
}


// UPDATE
export const updatedDropDownData = async (data) => {
    try {
        const result = await instance.put(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu thu chi: ", e);
        throw e;
    }
}

// CREATE
export const createDropDownData = async (data) => {
    try {
        const result = await instance.post(URL, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu thu chi: ", e);
        throw e;
    }
}