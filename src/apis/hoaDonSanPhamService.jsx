import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/hoa-don-san-pham'
const URL = BASE_URL + SUB_URL;

export const getAllHoaDonSanPhamByHoaDonId = async (id) => {
    try {
        const res = await instance.get(URL + '/' + id);
        return res;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};


export const createNewHoaDonSanPham = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const updateHoaDonSanPham = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}