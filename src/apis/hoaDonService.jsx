import instance from './axiosInterceptors';
import {createTimestamp} from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/hoa-don'
const URL = BASE_URL + SUB_URL;
export const getAllHoaDon = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};
export const getHoaDonById = async (id) => {
    try {
        let { data } = await instance.get(URL);
        data = data.filter(item => item.id_card_create == parseInt(id.slice(1), 10));
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};
export const getHoaDonById2 = async (id) => {
    try {
        let { data } = await instance.get(URL);
        data = data.find(item => item.id == id);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getHoaDonDataById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}
export const getHoaDonByCardId = async (id) => {
    try {
        const result = await instance.get(URL + '/card/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const createNewHoaDon = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateHoaDon = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteHoaDon = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
