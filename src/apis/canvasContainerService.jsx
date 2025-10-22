import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/canvas-container';
const URL = BASE_URL + SUB_URL;

export const getAllCanvasContainer = async () => {
  try {
    const response = await instance.get(URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching Canvas Containers:', error);
    throw error;
  }
};

export const createCanvasContainer = async (data) => {
  try {
    const response = await instance.post(URL, data);
    return response.data;
  } catch (error) {
    console.error('Error creating Canvas Container:', error);
    throw error;
  }
};

export const updateCanvasContainer = async (id, data) => {
  try {
    const response = await instance.put(`${URL}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating Canvas Container:', error);
    throw error;
  }
};

export const deleteCanvasContainer = async (id) => {
  try {
    const response = await instance.delete(`${URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting Canvas Container:', error);
    throw error;
  }
};
