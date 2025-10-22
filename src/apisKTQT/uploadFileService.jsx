import instance from ".//axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/uploadFile';
const URL = BASE_URL + SUB_URL;

export const uploadFileService = (file, onUploadProgress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await instance.post(URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        },
      });

      resolve(response.data);
    } catch (error) {
      reject(error);
    }
  });
};