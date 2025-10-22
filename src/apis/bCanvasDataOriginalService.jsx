import instance from './axiosInterceptors';
import {tinhSoNgayDaQuaTuChuoi} from "../generalFunction/format.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/b-canvas-data-original'
const URL = BASE_URL + SUB_URL;
export const getAllBCanvasDataOriginal = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getBCanvasDataOriginalDataAndRowById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}

export const createNewBCanvasDataOriginal = async (newRowData) => {
    try {
        let {data} = await instance.post(URL, newRowData)
        return data
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateBCanvasDataOriginal = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteBCanvasDataOriginal = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const getAllTemplateDataByDataOriginal = async (id) => {
    try {
        let res = await instance.get(URL + '/template-data-by-original-data/' + id)
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const deleteAllTemplateDataByDataOriginal = async (id) => {
    try {
        let res = await instance.delete(URL + '/template-data-by-original-data/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}


