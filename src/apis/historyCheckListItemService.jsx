import instance from './axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/history-checklist-item'
const URL = BASE_URL + SUB_URL;

export const getAllHistoryCheckListItem = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getHistoryCheckListItemDataById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}

export const getHistoryCheckListItemDataByEmailUser = async (email) => {
    try {
      const result = await instance.get(URL + '/email/' + email);
      return result.data;
    } catch (e) {
      console.error("Lỗi khi lấy dữ liệu : ", e);
      throw e;
    }
  }


export const createNewHistoryCheckListItem = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateHistoryCheckListItem = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteHistoryCheckListItem = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}