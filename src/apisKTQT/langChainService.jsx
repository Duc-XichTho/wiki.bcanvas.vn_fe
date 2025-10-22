import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/lang-chain/";
const URL = BASE_URL + SUB_URL;


export const analysisGenerate = async (prompt, data, system_context) => {

    try {
        const res = await instance.post(URL + 'analysis', {
            prompt,
            data,
            system_context
        }

        );
        return res;
    } catch (error) {
        console.error("Lỗi khi phân tích dữ liệu: ", error);
        throw error;
    }
}