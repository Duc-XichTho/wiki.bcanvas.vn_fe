import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/dash-board-item';
const URL = BASE_URL + SUB_URL;

export const getAllDashBoardItems = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.filter(item => item.show === true);
    } catch (error) {
        console.error('Error fetching dashboard items:', error);
        throw error;
    }
};

export const getDashBoardItemById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error fetching dashboard item by ID:', error);
        throw error;
    }
};

// Lấy dashboard item theo schema cụ thể (tham chiếu cách làm của getSchemaTools)
export const getDashBoardItemByIdSchema = async (schema, id) => {
    try {
        const { data } = await instance.post(`${URL}/schema-item`, {
            schema: schema,
            id: id,
        });
        return data;
    } catch (error) {
        console.error('Error fetching dashboard item by ID with schema:', error);
        throw error;
    }
};

export const getDashBoardItemsByType = async (type) => {
    try {
        const { data } = await instance.get(`${URL}/type/${type}`);
        return data;
    } catch (error) {
        console.error('Error fetching dashboard items by type:', error);
        throw error;
    }
};

export const getDashBoardItemsByCategory = async (category) => {
    try {
        const { data } = await instance.get(`${URL}/category/${category}`);
        return data;
    } catch (error) {
        console.error('Error fetching dashboard items by category:', error);
        throw error;
    }
};

export const createDashBoardItem = async (itemData) => {
    try {
        const { data } = await instance.post(URL, itemData);
        return data;
    } catch (error) {
        console.error('Error creating dashboard item:', error);
        throw error;
    }
};

export const updateDashBoardItem = async (itemData) => {
    try {
        const { data } = await instance.put(URL, itemData);
        return data;
    } catch (error) {
        console.error('Error updating dashboard item:', error);
        throw error;
    }
};

export const deleteDashBoardItem = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting dashboard item:', error);
        throw error;
    }
}; 