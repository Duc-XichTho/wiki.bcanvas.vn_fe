import instance from './axiosInterceptors';
const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/mapping-card'
const URL = BASE_URL + SUB_URL;
export const getAllMappingCard = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
    }
};

export const getMappingCardDataById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
  }
}

export const createNewMappingCard = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
    }
}
export const updateMappingCard = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
    }
}
export const deleteMappingCard = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
    }
}