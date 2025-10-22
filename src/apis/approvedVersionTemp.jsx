import instance from './axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/approved-version-temp'
const URL = BASE_URL + SUB_URL;

export const getAllApprovedVersion = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getApprovedVersionDataById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}

export const createNewApprovedVersion = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateApprovedVersion = async (newRowData) => {
    try {
        console.log('Updating approved version with data:', newRowData);
        let res = await instance.put(URL, newRowData)
        console.log('Update response:', res);
        return res
    } catch (error) {
        console.error('Error updating approved version:', error);
        throw error;
    }
}
export const deleteApprovedVersion = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
