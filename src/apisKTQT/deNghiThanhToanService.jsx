import instance from './axiosInterceptors';
import {DNTT_TYPE, DNTU_TYPE, DUKIENTHUCHI_APPROVE, QTTU_TYPE} from "../Constant.jsx";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/de-nghi-thanh-toan'
const URL = BASE_URL + SUB_URL;

export const getAllDeNghiThanhToan = async () => {
    try {
        const {data} = await instance.get(URL);
        let filteredData = data.filter(item => item.show === true).sort((a, b) => b.id - a.id);
        filteredData = filteredData.map(item => ({
            ...item,
            da_tao_qtoan: 0
        }));
        let DNTT = filteredData.filter(item => item.phan_loai === DNTT_TYPE)
        let DNTU = filteredData.filter(item => item.phan_loai === DNTU_TYPE)
        let QTTU = filteredData.filter(item => item.phan_loai === QTTU_TYPE);
        let QTTU_DONE = QTTU.filter(item => item.duyet1 === DUKIENTHUCHI_APPROVE && item.duyet2 === DUKIENTHUCHI_APPROVE && item.duyet3 === DUKIENTHUCHI_APPROVE);

        for (const dntu of DNTU) {
            dntu.tienDaQuyetToan = 0;
            for (const qttu of QTTU_DONE) {
                if (dntu.id == qttu.id_TamUng) {
                    dntu.tienDaQuyetToan += +qttu.so_tien || 0;
                }
            }
        }
        for (const dntu of DNTU) {
            let da_tao_qtoan = 0;
            for (const qttu of QTTU_DONE) {
                if (qttu.id_TamUng == dntu.id) {
                    da_tao_qtoan++;
                }
            }
            dntu.da_tao_qtoan = da_tao_qtoan;
        }
        return [...DNTT, ...DNTU, ...QTTU];
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
        console.error("Lỗi khi lấy dữ liệu DeNghiThanhToan: ", e);
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
