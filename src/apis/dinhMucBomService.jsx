import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/dinh-muc';
const URL = BASE_URL + SUB_URL;

// GET
export const getAllDinhMucSP = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getAllDinhMucNLBySPId = async (idSP) => {
    try {
        const { data } = await instance.get(URL + '/' + idSP);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

// CREATE
export const createNewDinhMucSP = async (newData) => {
    try {
        const { data } = await instance.post(URL, newData);
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const createNewDinhMucNL = async (newData) => {
    try {
        const { data } = await instance.post(URL + '/nl', newData);
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// UPDATE
export const updateDinhMucSP = async (newData) => {
    try {
        const { data } = await instance.put(URL, newData);
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const updateDinhMucNL = async (newData) => {
    try {
        const { data } = await instance.put(URL + '/nl', newData);
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// DELETE
export const deleteDinhMucSP = async (id) => {
    try {
        const { data } = await instance.delete(URL + '/' + id);
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const deleteDinhMucNL = async (id) => {
    try {
        const { data } = await instance.delete(URL + '/nl/' + id);
        return data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};