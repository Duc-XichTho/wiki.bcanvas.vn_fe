import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/setting';
const URL = BASE_URL + SUB_URL;

export const getSettingByType = async (type ) => {
    try {
        const data = await instance.get(`${URL}/${type}`);
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const createSetting = async (newData) => {
    try {
        const response = await instance.post(URL, newData);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi tạo mới:', error);
        throw error;
    }
};

export const updateSetting = async (updatedData) => {
    try {
        const response = await instance.put(URL, updatedData);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật:', error);
        throw error;
    }
};

// API cập nhật tools cho từng schema
export const updateSchemaTools = async (schema, listTools, settingId = null) => {
    try {
        const data = {
            id: settingId,
            type: 'DASHBOARD_SETTING',
            setting: listTools 
        };
        console.log('API - Data to send:', data);
        console.log('API - Schema:', schema);
        console.log('API - ListTools:', listTools);
        
        const response = await instance.put(`${URL}/schema-tools`, {
            data: data, 
            schema: schema 
        });
        
        console.log('API - Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật tools cho schema:', error);
        throw error;
    }
};

// API lấy tools của một schema cụ thể
export const getTypeSchema = async (schema, type) => {
    try {
        const data = await instance.post(`${URL}/schema-tools`, { 
            schema: schema, 
            type: type
        });
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy tools của schema:', error);
        throw error;
    }
};
// API lấy tools của một schema cụ thể
export const getSchemaTools = async (schema) => {
    try {
        const data = await instance.post(`${URL}/schema-tools`, {
            schema: schema,
            type: 'DASHBOARD_SETTING'
        });
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy tools của schema:', error);
        throw error;
    }
};

// API lấy resources của một schema cụ thể
export const getSchemaResources = async (schema) => {
    try {
        const data = await instance.post(`${URL}/schema-tools`, { 
            schema: schema, 
            type: 'DASHBOARD_RESOURCES' 
        });
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy tools của schema:', error);
        throw error;
    }
};

export const getSchemaGuideline = async (schema) => {
    try {
        const data = await instance.post(`${URL}/schema-tools`, { 
            schema: schema, 
            type: 'GUIDELINE_SETTING' 
        });
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy tools của schema:', error);
        throw error;
    }
};


export const getSchemaBackground = async (schema) => {
    try {
        const data = await instance.post(`${URL}/schema-tools`, { 
            schema: schema, 
            type: 'DASHBOARD_BACKGROUND' 
        });
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy tools của schema:', error);
        throw error;
    }
};

// API cập nhật tools cho từng schema
// export const updateSchemaBackground = async (schema, backgroundImageUrl, settingId = null) => {
//     try {
//         const data = {
//             id: settingId,
//             type: 'DASHBOARD_BACKGROUND',
//             setting: backgroundImageUrl 
//         };
//         console.log('API - Data to send:', data);
//         console.log('API - Schema:', schema);
//         console.log('API - BackgroundImageUrl:', backgroundImageUrl);
        
//         const response = await instance.put(`${URL}/schema-tools`, {
//             data: data, 
//             schema: schema 
//         });
        
//         console.log('API - Response:', response.data);
//         return response.data;
//     } catch (error) {
//         console.error('Lỗi khi cập nhật tools cho schema:', error);
//         throw error;
//     }
// };
