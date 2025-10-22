import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_WEATHER;
const API_PATH = "/api/historical-weather";

export const createHistoricalWeather = async (data) => {
  try {
    const response = await instance.post(`${BASE_URL}${API_PATH}/`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllHistoricalWeather = async () => {
  try {
    const response = await instance.get(`${BASE_URL}${API_PATH}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getHistoricalWeatherById = async (id) => {
  try {
    const response = await instance.get(`${BASE_URL}${API_PATH}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateHistoricalWeatherById = async (id, data) => {
  try {
    const response = await instance.put(`${BASE_URL}${API_PATH}/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteHistoricalWeatherById = async (id) => {
  try {
    const response = await instance.delete(`${BASE_URL}${API_PATH}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchHistoricalWeatherByName = async (name) => {
  try {
    const response = await instance.get(`${BASE_URL}${API_PATH}/search/name`, { params: { name } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchHistoricalWeatherByDatetime = async (datetime) => {
  try {
    const response = await instance.get(`${BASE_URL}${API_PATH}/search/datetime`, { params: { datetime } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchHistoricalWeatherByNameAndDatetime = async (name, datetime) => {
  try {
    const response = await instance.get(`${BASE_URL}${API_PATH}/search/name-datetime`, { params: { name, datetime } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchHistoricalWeatherByDatetimeRange = async (start, end) => {
  try {
    const response = await instance.get(`${BASE_URL}${API_PATH}/search/datetime-range`, { params: { start, end } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchHistoricalWeatherByNameAndDatetimeRange = async (name, start, end) => {
  try {
    const response = await instance.get(`${BASE_URL}${API_PATH}/search/name-datetime-range`, { params: { name, start, end } });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 