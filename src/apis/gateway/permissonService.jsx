import instance from "../axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/gw-permission";
const URL = BASE_URL + SUB_URL;

// GET
export const getAllPermission = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error("Error fetching permissions:", error);
        throw error;
    }
};

export const getPermissionByUserAndCompany = async (userEmail, companyId) => {
    try {
        const { data } = await instance.get(`${URL}/user/${userEmail}/company/${companyId}`);
        return data;
    } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
    }
};

export const getPermissionsByCompanyId = async (companyId) => {
    try {
        const { data } = await instance.get(`${URL}/company/${companyId}`);
        return data;
    } catch (error) {
        console.error("Error fetching permissions:", error);
        throw error;
    }
};

export const getPermissionsByUser = async (userEmail) => {
    try {
        const { data } = await instance.get(`${URL}/user/${userEmail}`);
        return data;
    } catch (error) {
        console.error("Error fetching permissions:", error);
        throw error;
    }
};

// Update
export const updatePermission = async (permissionData) => {
    try {
        const { data } = await instance.put(`${URL}`, permissionData);
        return data;
    } catch (error) {
        console.error("Error updating permission:", error);
        throw error;
    }
};

// Create
export const createPermission = async (permissionData) => {
    try {
        const { data } = await instance.post(URL, permissionData);
        return data;
    } catch (error) {
        console.error("Error creating permission:", error);
        throw error;
    }
};

// DELETE
export const deletePermission = async (permissionId) => {
    try {
        const { data } = await instance.delete(`${URL}/${permissionId}`);
        return data;
    } catch (error) {
        console.error("Error deleting permission:", error);
        throw error;
    }
};







