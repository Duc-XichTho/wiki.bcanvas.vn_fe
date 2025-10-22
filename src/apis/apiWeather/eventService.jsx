import instance from "../axiosInterceptors.jsx";

const API_BASE_URL = import.meta.env.VITE_API_WEATHER;

// Get all events ordered by date (descending)
export const getAllEventService = async () => {
  try {
    const response = await instance.get(`${API_BASE_URL}/api/event`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch events');
  }
};

// Get event by ID
export const getEventByIdService = async (id) => {
  try {
    const response = await instance.get(`${API_BASE_URL}/api/event/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch event');
  }
};

// Get events by date
export const getEventsByDateService = async (date) => {
  try {
    const response = await instance.get(`${API_BASE_URL}/api/event/date/${date}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch events by date');
  }
};

// Create new event
export const createEventService = async (data) => {
  try {
    const response = await instance.post(`${API_BASE_URL}/api/event`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create event');
  }
};

// Update existing event
export const updateEventService = async (id, data) => {
  try {
    const response = await instance.put(`${API_BASE_URL}/api/event/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update event');
  }
};

// Delete event by ID
export const deleteEventService = async (id) => {
  try {
    const response = await instance.delete(`${API_BASE_URL}/api/event/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete event');
  }
}; 