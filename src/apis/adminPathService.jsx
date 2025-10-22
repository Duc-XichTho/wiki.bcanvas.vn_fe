import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/path'
const URL = BASE_URL + SUB_URL;

export const getAllPath = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getPathDataById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}

export const createNewPath = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updatePath = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deletePath = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateSchema = async () => {
    try {
        let res = await instance.post(URL + '/sync/from-sample')
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Hàm để tạo instance với schema được chọn
export const createInstanceWithSchema = (schemaId) => {
    if (!schemaId) return instance;
    
    // Tạo instance mới với header schema
    const instanceWithSchema = instance.create();
    instanceWithSchema.defaults.headers['x-schema'] = schemaId;
    return instanceWithSchema;
};

// Hàm để gọi API với schema cụ thể
export const callApiWithSchema = async (apiCall, schemaId) => {
    if (!schemaId) {
        return apiCall();
    }
    
    try {
        // Tạo instance tạm thời với schema
        const tempInstance = instance.create();
        tempInstance.defaults.headers['x-schema'] = schemaId;
        
        // Thay thế instance trong axiosInterceptors tạm thời
        const originalInstance = instance;
        Object.assign(instance, tempInstance);
        
        const result = await apiCall();
        
        // Khôi phục instance gốc
        Object.assign(instance, originalInstance);
        
        return result;
    } catch (error) {
        console.error('Error calling API with schema:', error);
        throw error;
    }
};