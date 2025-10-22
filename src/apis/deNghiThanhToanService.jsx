import instance from './axiosInterceptors';
import {tinhSoNgayDaQuaTuChuoi} from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/de-nghi-thanh-toan'
const URL = BASE_URL + SUB_URL;

export const getDeNghiThanhToanByCardId = async (id) => {
    try {
        const result = await instance.get(URL + '/card/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getDeNghiThanhToanNew = async (id) => {
    try {
        const result = await instance.get(URL + '/new');
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getAllDeNghiThanhToan = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getDeNghiThanhToanDataById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}
export const getDeNghiThanhToanDataByCardId = async (id) => {
  try {
    const result = await instance.get(URL + '/card/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}
export const getAllDeNghiThanhToanByTamUngId = async (id) => {
  try {
    const result = await instance.get(URL + '/tam-ung/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}

export const createNewDeNghiThanhToan = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateDeNghiThanhToan = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteDeNghiThanhToan = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
