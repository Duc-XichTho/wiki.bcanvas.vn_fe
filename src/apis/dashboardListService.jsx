import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/dashboard-list";
const URL = BASE_URL + SUB_URL;

// GET
export const getAllDashboardList = async () => {
    const { data } = await instance.get(URL);
    return data;
};

// CREATE
export const createDashboardList = async (data) => {
    const result = await instance.post(URL, data);
    return result.data;
};

// UPDATE
export const updateDashboardList = async (data) => {
    const result = await instance.put(URL, data);
    return result.data;
};

// DELETE
export const deleteDashboardList = async (id) => {
    const { data } = await instance.delete(`${URL}/${id}`);
    return data;
};