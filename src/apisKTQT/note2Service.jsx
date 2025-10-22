import instance from './axiosInterceptors';
const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/note2';
const URL = BASE_URL + SUB_URL;

export const getNote2Data = async (company, title, table, field) => {
  try {
    // let response = await instance.get(`${URL}/${company}/${title}/${table}/${field}`);
    // return response.data;
  } catch (error) {
    console.error('Error getting note: ', error);
    throw error;
  }
};
export const addNote2Data = async (company, title, table, field, note) => {
  try {
    // let data = { note };
    // let response = await instance.post(`${URL}/${company}/${title}/${table}/${field}`, data);
    // return response.data;
  } catch (error) {
    console.error('Error adding note: ', error);
    throw error;
  }
};
