import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/feedback'
const URL = BASE_URL + SUB_URL;

export const createFeedback = async (data) => {
  try {
    const response = await instance.post(URL, data);
    console.log("🔍 response", response)
    return response;
  } catch (error) {
    console.error('Error creating feedback:', error);
  }
};