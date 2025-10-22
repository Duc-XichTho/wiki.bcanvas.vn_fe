import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;

export const logout = async () => {
  try {
    await instance.post(`${BASE_URL}/logout`);
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    throw error;
  }
};

export const getCurrentUserLogin = async () => {
  try {
    const response = await instance.get(`${BASE_URL}/api/user/profile`);
    if (!response?.data) {
      return { data: null, error: new Error("No data received from server") };
    }

    return {
      data: response.data,
      error: null,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      return {
        data: null,
        error: new Error("Đăng nhập để tiếp tục truy cập"),
      };
    }

    if (error.response?.status === 404) {
      return {
        data: null,
        error: new Error("User profile not found"),
      };
    }

    if (error.code === "ECONNABORTED") {
      return {
        data: null,
        error: new Error("Request timeout - Please check your connection"),
      };
    }

    return {
      data: null,
      error: new Error(error.message || "Failed to fetch user profile"),
    };
  }
};

export const getAllUser = async () => {
  try {
    const { data } = await instance.get(`${BASE_URL}/api/user`);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const createUser = async (newData) => {
  try {
    const { data } = await instance.post(`${BASE_URL}/api/user`, newData);
    return data;
  } catch (error) {
    console.error("Lỗi khi tạo người dùng:", error);
    throw error;
  }
};

export const updateUser = async (email, newData) => {
  try {
    const { data } = await instance.put(`${BASE_URL}/api/user/${email}`, newData);
    return data;
  } catch (error) {
    console.error("Lỗi khi cập nhật người dùng:", error);
    throw error;
  }
};

export const deleteUser = async (emails) => {
  try {
    const { data } = await instance.delete(`${BASE_URL}/api/user/`, {
      data: { emails },
    });
    return data;
  } catch (error) {
    throw error;
  }
};
