import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/pmv-deployment'
const URL = BASE_URL + SUB_URL;
export const getAllPMVDeployment = async () => {
    try {
        const { data } = await instance.get(URL);
        return data
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getPMVDeploymentsByPlanId = async (id) => {
    try {
        const { data } = await instance.get(URL + '/plan/' + id);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const generateDatesByPeriod = async (newData) => {
    try {
        const { data } = await instance.post(URL + '/tinh', newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getAllPMVDeploymentFull = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getPMVDeploymentDataById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const createNewPMVDeployment = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updatePMVDeployment = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deletePMVDeployment = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
