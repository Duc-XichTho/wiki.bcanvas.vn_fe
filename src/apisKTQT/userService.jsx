import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllUsers = async () => {
  try {
    const { data } = await instance.get(`${BASE_URL}/api/user`);
    return data;
  } catch (error) {
    console.error('Lỗi khi lọc người dùng:', error);
    throw error;
  }
}

export const createUser = async (newData) => {
  try {
    const response = await instance.post(`${BASE_URL}/api/user`, newData);
    return { success: true, data: response.data };
  } catch (error) {

    if (error.response) {
      const { status, data } = error.response;
      if (status === 400) {

        return { success: false, code: data.code, message: data.message };
      } else if (status === 500) {

        return { success: false, code: 'INTERNAL_SERVER_ERROR', message: data.message || 'Lỗi từ server.' };
      }
    }

    console.error('Lỗi khi tạo người dùng:', error);
    throw error;
  }
};


export const createUserServiceBCANVAS_KETOANQUANTRI = async (data) => {
  try {
    const { data: responseData } = await instance.post(`${BASE_URL}/api/user/bcanvas-ketoanquantri`, data);
    return responseData;
  } catch (error) {
    throw error;
  }
}

export const createUserServiceQUANLYTHANHTOAN = async (data) => {
  try {
    const { data: responseData } = await instance.post(`${BASE_URL}/api/user/qltt`, data);
    return responseData;
  } catch (error) {
    throw error;
  }
}

export const updateUsers = async (emails, newData) => {
  try {
    const { data } = await instance.put(`${BASE_URL}/api/user/update-users`, {
      emails,
      userData: newData
    });
    return data;
  } catch (error) {
    console.error('Lỗi khi cập nhật người dùng:', error);
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
