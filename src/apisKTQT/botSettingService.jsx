import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/bot-setting";
const URL = BASE_URL + SUB_URL;

export const getAllBotSetting = async () => {
    try {
        const data = await instance.get(URL);
        return data.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin:", error);
        throw error;
    }
};

export const updateBotSetting = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateFileBotSetting = async (id, newFileData) => {
    try {
        let res = await instance.put(`${URL}/${id}`, newFileData)
    } catch (error) {
        console.error(error);
        throw error;
    }
}