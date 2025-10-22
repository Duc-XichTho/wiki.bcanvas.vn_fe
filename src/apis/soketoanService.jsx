import instance from './axiosInterceptors';
import {logicListT} from "../pages/Home/AgridTable/SoLieu/CDPS/logicCDPS.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/so-ke-toan';
const URL = BASE_URL + SUB_URL;

export const getAllSoKeToan = async () => {
    try {
        const response = await instance.get(URL);
        const filteredData = response.data
            .filter((item) => item.show === true)
            .map((item) => ({
                ...item,
                tax: item.tax ?? false,
                quan_tri_noi_bo: item.quan_tri_noi_bo ?? false,
            }));
        return filteredData;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const createNewSoKeToan = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData);
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const updateSoKeToan = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData);
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const deleteSoKeToan = async (id) => {
    try {
        let res = await instance.delete(`${URL}/${id}`);
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const deleteAllSoKeToanService = async (company) => {
    try {
        let res = await instance.delete(`${URL}/all/${company}`);
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const deleteSoKeToanByMonth = async (month, company) => {
    try {
        let res = await instance.delete(`${URL}/month/${month}/${company}`);
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
export const getLastUpdateSoKeToan = async () => {
    try {
        const response = await instance.get(`${URL}/last-update`);
        return response.data;
    } catch (error) {
        // console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};
export const getLastIdSoKeToan = async () => {
    try {
        const response = await instance.get(`${URL}/last-id`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const deleteAccountingJournalByDaDung1 = async (da_dung_1) => {
    try {
        const response = await instance.delete(`${URL}/deleteByDaDung1/${da_dung_1}`);

        if (response.status !== 200) {
            throw new Error('Failed to delete accounting journal entries');
        }
        console.log(response.data)
        return response.data;
    } catch (error) {
        console.error('Error deleting accounting journal entries:', error);
        throw error;
    }
};

// New function to get data and process it
export const fetchAndProcessSoKeToanSAB = async () => {
    try {
        const listSKT = await getAllSoKeToan();
        const processedData = logicListT(listSKT);
        return processedData;
    } catch (error) {
        console.error("Error fetching and processing So Ke Toan:", error);
        throw error; // Rethrow the error for further handling if needed
    }
}
