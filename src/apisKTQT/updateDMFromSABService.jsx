import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/sab-update-dm-ktqt";
const URL = BASE_URL + SUB_URL;



export const updateDMFromSAB = async () => {
    try {
        const result = await instance.post(URL);
        return result.data;
    } catch (e) {
        console.error("Lỗi: ", e);
        throw e;
    }
}

