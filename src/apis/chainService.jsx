import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/chain";
const URL = BASE_URL + SUB_URL;

export const getAllChainTemplateStepSubStep = async () => {
    try {
        const response = await instance.get(URL + "/ctss");
        response.data.result.forEach(item => {
            if (item.templates) {
                item.templates.forEach(template => {
                    template.cards.sort((a, b) => b.id - a.id);
                })
            }
        })
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin:", error);
        throw error;
    }
};

export const getAllChain = async () => {
    try {
        const {data} = await instance.get(URL);
        data.sort((a, b) => a.stt - b.stt);
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin:", error);
        throw error;
    }
};

export const getChainDataById = async (id) => {
    try {
        const result = await instance.get(URL + "/" + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
};

export const createNewChain = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData);
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
export const updateChain = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData);
        return res;
    } catch (error) {
        console.log(1, error);
        throw error;
    }
};
export const deleteChain = async (id) => {
    try {
        let res = await instance.delete(URL + "/" + id);
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
