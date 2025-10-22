import instance from "../axiosInterceptors.jsx";

const API_BASE_URL = import.meta.env.VITE_API_WEATHER ;

// Get all predictions
export const getAllPredictionService = async () => {
  try {
    const response = await instance.get(`${API_BASE_URL}/api/prediction`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch predictions');
  }
};

// Get predictions by date
export const getPredictionsByDateService = async (date) => {
  try {
      const response = await instance.get(`${API_BASE_URL}/api/prediction/date/${date}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch predictions by date');
  }
};

// Get prediction by ID
export const getPredictionByIdService = async (id) => {
  try {
    const response = await instance.get(`${API_BASE_URL}/api/prediction/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch prediction');
  }
};

// Create new prediction
export const createPredictionService = async (data) => {
  try {
    const response = await instance.post(`${API_BASE_URL}/api/prediction`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create prediction');
  }
};

// Update existing prediction
export const updatePredictionService = async (id, data) => {
  try {
    const response = await instance.put(`${API_BASE_URL}/api/prediction/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update prediction');
  }
};

// Delete prediction by ID
export const deletePredictionService = async (id) => {
  try {
    const response = await instance.delete(`${API_BASE_URL}/api/prediction/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete prediction');
  }
}; 