import instance from './axiosInterceptors';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/google-drive-folder`;

// Google Drive Folder APIs
export const fetchGoogleDriveFolder = async (data) => {
  return instance.post(`${BASE_URL}/fetch`, data);
};