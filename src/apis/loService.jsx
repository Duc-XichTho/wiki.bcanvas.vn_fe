import instance from './axiosInterceptors';
import {tinhSoNgayDaQuaTuChuoi} from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/lo'
const URL = BASE_URL + SUB_URL;
export const getAllLo = async () => {
    try {
        const {data} = await instance.get(URL);
        const updatedData = data.map((item) => {
            const daysElapsed = tinhSoNgayDaQuaTuChuoi(item.created_at);
            return {
                ...item,
                ngay_con_lai: daysElapsed,
            };
        });
        return updatedData;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getLoDataById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}

export const createNewLo = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateLo = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteLo = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}