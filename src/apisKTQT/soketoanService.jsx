import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ktqt-skt';
const URL = BASE_URL + SUB_URL;

export const getAllSoKeToan = async () => {
  try {
    const response = await instance.get(URL);
    return response.data;
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

export const createBulkNewSoKeToan = async (newData) => {
  try {
    let res = await instance.post(`${URL}/create-bulk`, newData);
    console.log(res);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
}


export const updateSoKeToan = async (newRowData) => {
  try {
    let res = await instance.put(URL, newRowData);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateBulkSoKeToan = async (newRowData) => {
  try {
    let res = await instance.put(`${URL}/update-bulk`, newRowData);
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

export const deleteAllSoKeToanService = async () => {
  try {
    let res = await instance.delete(`${URL}/all/`);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteSoKeToanByMonth = async (month,year,company) => {
  try {
    let res = await instance.delete(`${URL}/month/${month}/year/${year}/company/${company}`);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const deleteSoKeToanByYear = async (year,company) => {
  try {
    let res = await instance.delete(`${URL}/year/${year}/company/${company}`);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const deleteBulkSoKeToan = async (ids) => {
  try {
    let res = await instance.delete(`${URL}/delete-bulk`, { data: { ids } });
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

    return response.data;
  } catch (error) {
    console.error('Error deleting accounting journal entries:', error);
    throw error;
  }
};
