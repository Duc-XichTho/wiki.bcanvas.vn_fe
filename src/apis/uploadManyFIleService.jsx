import instance from './axiosInterceptors';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/upload-many-file`;

export const uploadFiles = (files, onUploadProgress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      // Chỉ thêm onUploadProgress nếu có callback
      if (onUploadProgress && typeof onUploadProgress === 'function') {
        config.onUploadProgress = (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onUploadProgress(percentCompleted);
          }
        };
      }

      const response = await instance.post(BASE_URL, formData, config);

      resolve(response.data);
    } catch (error) {
      console.log(error)
      reject(error);
    }
  });
};
