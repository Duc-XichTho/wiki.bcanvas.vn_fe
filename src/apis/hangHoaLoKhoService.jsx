import instance from './axiosInterceptors';
import {tinhSoNgayDaQuaTuChuoi} from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/hang-hoa-lo-kho'
const URL = BASE_URL + SUB_URL;
export const getAllHangHoaLoKho = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getHangHoaLoKhoDataById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}

export const createNewHangHoaLoKho = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.error(error);
        throw error;
    }
}
export const updateHangHoaLoKho = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.error(1, error);
        throw error;
    }
}
export const deleteHangHoaLoKho = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.error(error);
        throw error;
    }
}