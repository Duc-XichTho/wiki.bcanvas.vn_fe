import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ktqt-report-management'
const URL = BASE_URL + SUB_URL;

// GET
export const getReportManagement = async (id) => {
    try {
        const response = await instance.get(URL + '/' + id);
        return response.data[0];
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const getReportManagementList = async () => {
    try {
        const response = await instance.get(URL + '/list');
        return response.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// CREATE
export const createReportManagement = async (data) => {
    try {
        const { response } = await instance.post(URL, data);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const createReportManagementList = async (id) => {
    try {
        const response = await instance.post(URL + '/' + id + '/list');
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// UPDATE
export const updateReportManagement = async (id, data) => {
    try {
        const { response } = await instance.put(URL + '/' + id, data);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateReportManagementList = async (id, data) => {
    try {
        const { response } = await instance.put(URL + '/' + id + '/list', data);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const deleteReportManagement = async (id) => {
    try {
        const { response } = await instance.delete(URL + '/' + id);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}