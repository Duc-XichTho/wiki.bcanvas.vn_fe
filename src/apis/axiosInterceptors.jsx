import axios from 'axios';

const instance = axios.create({
  withCredentials: true,
});

// Thêm interceptor để tự động thêm schema header nếu có
instance.interceptors.request.use(
  config => {
    // Kiểm tra xem có schema được chọn trong localStorage không
    const selectedSchemaId = localStorage.getItem('selectedSchemaId');
    if (selectedSchemaId) {
      config.headers['x-schema'] = selectedSchemaId;
    }
    return config;
  },
  error => Promise.reject(error)
);

instance.interceptors.response.use(
  response => response,
  error => {
    if (!error.response || error.response.status === 401) {
      console.error('Lỗi phản hồi từ server:', error);
    }
    return Promise.reject(error);
  }
);

// Hàm để cập nhật schema header cho tất cả request tiếp theo
export const updateSchemaHeader = (schemaId) => {
  if (schemaId) {
    instance.defaults.headers['x-schema'] = schemaId;
  } else {
    delete instance.defaults.headers['x-schema'];
  }
};

// Hàm để tạo instance mới với schema cụ thể
export const createInstanceWithSchema = (schemaId) => {
  const newInstance = axios.create({
    withCredentials: true,
    headers: {
      'x-schema': schemaId
    }
  });
  
  // Copy interceptors
  newInstance.interceptors.request.use(
    config => config,
    error => Promise.reject(error)
  );
  
  newInstance.interceptors.response.use(
    response => response,
    error => {
      if (!error.response || error.response.status === 401) {
        console.error('Lỗi phản hồi từ server:', error);
      }
      return Promise.reject(error);
    }
  );
  
  return newInstance;
};

export default instance;