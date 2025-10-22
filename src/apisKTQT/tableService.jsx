import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/table';
const URL = BASE_URL + SUB_URL;

// CREATE API
export const createTable = async (data) => {
    try {
        const response = await instance.post(URL, data);
        return response.data;
    } catch (error) {
        console.error('Error creating table:', error);
        throw error;
    }
}

export const createColumn = async (data) => {
    try {
        const response = await instance.post(`${URL}/create-column`, data);
        return response.data;
    } catch (error) {
        console.error('Error creating column:', error);
        throw error;
    }
}

export const createRow = async (data) => {
    try {
        const response = await instance.post(`${URL}/create-row`, data);
        return response.data;
    } catch (error) {
        console.error('Error creating row:', error);
        throw error;
    }
}

// GET API
export const getAllTables = async (schema) => {
    try {
        const response = await instance.get(`${URL}/get-table/${schema}`);
        return response.data;
    } catch (error) {
        console.error('Error getting table:', error);
        throw error;
    }
}

export const getTableDetail = async (schema, tableName) => {
    try {
        const response = await instance.get(`${URL}/${schema}/${tableName}`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching table details:', error);
        throw error;
    }
};

// UPDATE API
export const updateColumn = async (data) => {
    try {
        const response = await instance.put(`${URL}/update-column`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating column:', error);
        throw error;
    }
}

export const updateRow = async (data) => {
    try {
        const response = await instance.put(`${URL}/update-row`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating row:', error);
        throw error;
    }
}

export const updateTableName = async (data) => {
    try {
        const response = await instance.put(`${URL}/update-table-name`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating table name:', error);
        throw error;
    }
}


// DELETE API
export const deleteRow = async (data) => {
    try {
        const response = await instance.delete(`${URL}/delete-row`, { data });
        return response.data;
    } catch (error) {
        console.error('Error deleting row:', error);
        throw error;
    }
}

export const deleteColumn = async (data) => {
    try {
        const response = await instance.delete(`${URL}/delete-column`, { data });
        return response.data;
    } catch (error) {
        console.error('Error deleting column:', error);
        throw error;
    }
}

export const deleteTable = async (data) => {
    try {
        const response = await instance.delete(`${URL}/delete-table`, { data });
        return response.data;
    } catch (error) {
        console.error('Error deleting table:', error);
        throw error;
    }
}