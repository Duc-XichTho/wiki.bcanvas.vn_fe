import instance from "../axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/gw-message";
const URL = BASE_URL + SUB_URL;

// GET
export const getAllMessage = async () => {
  try {
    const { data } = await instance.get(URL);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

// GET paginated messages by ticket ID
export const getMessagesByTicketId = async (ticketId, page = 1, limit = 20) => {
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

// Load more messages (earlier messages) for a ticket
export const loadMoreMessages = async (
  ticketId,
  beforeMessageId,
  limit = 20
) => {
  try {
    const { data } = await instance.get(
      `${URL}/ticket/${ticketId}/before/${beforeMessageId}`,
      {
        params: { limit },
      }
    );
    return data;
  } catch (error) {
    console.error("Error loading more messages:", error);
    throw error;
  }
};

// UPDATE
export const updateMessage = async (messageData) => {
  try {
    // Always update timestamp when updating message
    const updatedData = {
      ...messageData,
      timestamp: new Date().toISOString(),
    };

    const { data } = await instance.put(`${URL}`, updatedData);
    return data;
  } catch (error) {
    console.error("Error updating message:", error);
    throw error;
  }
};

// CREATE
export const createMessage = async (messageData) => {
  try {
    // Add timestamp if it doesn't exist
    const dataToSend = {
      ...messageData,
      timestamp: messageData.timestamp || new Date().toISOString(),
    };

    const { data } = await instance.post(URL, dataToSend);
    return data;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
};

// DELETE
export const deleteMessage = async (messageId) => {
  try {
    const { data } = await instance.delete(`${URL}/${messageId}`);
    return data;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

// Hide a message (set show: false)
export const hideMessage = async (messageId) => {
  try {
    const { data } = await instance.put(`${URL}/${messageId}/hide`, {
      show: false,
      timestamp: new Date().toISOString(),
    });
    return data;
  } catch (error) {
    console.error("Error hiding message:", error);
    throw error;
  }
};
