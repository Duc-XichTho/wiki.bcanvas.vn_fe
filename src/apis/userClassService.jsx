import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;

export const getUserClassById = async (id) => {
    try {
        const { data } = await instance.get(`${BASE_URL}/api/userclass/${id}`);
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        throw error;
    }
};

export const getUserClassByEmail = async () => {
    try {
        const { data } = await instance.get(`${BASE_URL}/api/userclass/userpermissions`);
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        throw error;
    }
};

export const getAllUserClass = async () => {
    try {
        const { data } = await instance.get(`${BASE_URL}/api/userclass`);
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin:", error);
        throw error;
    }
};

export const createUserClass = async (newData) => {
    try {
        const { data } = await instance.post(`${BASE_URL}/api/userclass`, newData);
        return data;
    } catch (error) {
        console.error("Lỗi khi tạo người dùng:", error);
        throw error;
    }
};

export const updateUserClass = async (id, newData) => {
    try {
        const { data } = await instance.put(`${BASE_URL}/api/userclass/${id}`, newData);
        return data;
    } catch (error) {
        console.error("Lỗi khi cập nhật người dùng:", error);
        throw error;
    }
};

export const deleteUserClass = async (id) => {
    try {
        const { data } = await instance.delete(`${BASE_URL}/api/userclass/${id}`);
        return data;
    } catch (error) {
        throw error;
    }
};