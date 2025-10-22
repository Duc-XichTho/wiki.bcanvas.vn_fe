import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/phieu-chi2'
const URL = BASE_URL + SUB_URL;

export const getAllPhieuChi2 = async () => {
    try {
        const {data} = await instance.get(URL);
        return data
    } catch (error) {
        console.log("getAllPhieuChi2", error);
        throw error;
    }
}

export const getPhieuChiByCardId = async (id) => {
    try {
        let {data} = await instance.get(URL);
        if (!isNaN(id))
            data = data.filter(e => e.id_card_create == id)
        else {
            data = data.filter(e => e.id == parseInt(id.slice(1), 10))
        }
        return data
    } catch (error) {
        console.log("getAllPhieuChi2", error);
        throw error;
    }
}

export const createPhieuChi2 = async (data) => {
    try {
        const res = await instance.post(URL, data)
        return res.data
    } catch (error) {
        console.log("createPhieuChi2", error);
        throw error;
    }
}

export const updatePhieuChi2 = async (id, data) => {
    try {
        const res = await instance.put(URL + '/' + id, data)
        return res
    } catch (error) {
        console.log("updatePhieuChi2", error);
        throw error;
    }
}

export const deletePhieuChi2 = async (id) => {
    try {
        const res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log("deletePhieuChi2", error);
        throw error;
    }
}
