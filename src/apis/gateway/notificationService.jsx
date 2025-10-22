import instance from "../axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/gw-notification";
const URL = BASE_URL + SUB_URL;

// GET
export const getAllNotification = async () => {
  try {
    const { data } = await instance.get(URL);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const getNotificationsByTicketId = async (ticketId, page = 1, limit = 20) => {
  try {
    const { data } = await instance.get(`${URL}/ticket/${ticketId}`, {
      params: { page, limit },
    });
    return data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const getNotificationsByUser = async (userId, page = 1, limit = 10) => {
  try {
    const { data } = await instance.get(`${URL}/user/${userId}`, {
      params: { page, limit },
    });
    return data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// Update
export const updateNotification = async (notificationId, notificationData) => {
  try {
    const { data } = await instance.put(`${URL}/${notificationId}`, notificationData);
    return data;
  } catch (error) {
    console.error("Error updating notification:", error);
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const { data } = await instance.put(`${URL}/read/${notificationId}`);
    return data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Create
export const createNotification = async (notificationData) => {
  try {
    const { data } = await instance.post(URL, notificationData);
    return data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// DELETE
export const deleteNotification = async (notificationId) => {
  try {
    const { data } = await instance.delete(`${URL}/${notificationId}`);
    return data;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};







