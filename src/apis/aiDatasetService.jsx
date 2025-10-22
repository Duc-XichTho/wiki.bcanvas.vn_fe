import instance from './axiosInterceptors';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/ai-dataset`;

// Dataset APIs
export const createDataset = (data) => {
  return instance.post(BASE_URL, data);
};

export const getAllDatasets = () => {
  return instance.get(BASE_URL);
};

export const getDatasetById = (id) => {
  return instance.get(`${BASE_URL}/${id}`);
};

export const updateDataset = (data) => {
  return instance.put(BASE_URL, data);
};

export const deleteDataset = (id) => {
  return instance.delete(`${BASE_URL}/${id}`);
};

export const addFilesToDataset = (datasetId, files) => {
  return instance.post(`${BASE_URL}/${datasetId}/files`, { files });
};

// File APIs
const FILE_BASE_URL = `${import.meta.env.VITE_API_URL}/api/ai-dataset-file`;

export const createDatasetFile = (data) => {
  return instance.post(FILE_BASE_URL, data);
};

export const getDatasetFileById = (id) => {
  return instance.get(`${FILE_BASE_URL}/${id}`);
};

export const getFilesByDatasetId = (datasetId) => {
  return instance.get(`${FILE_BASE_URL}/dataset/${datasetId}`);
};

export const updateDatasetFile = (data) => {
  return instance.put(FILE_BASE_URL, data);
};

export const updateFileProcessingStatus = (fileId, status, processingResult) => {
  return instance.put(`${FILE_BASE_URL}/status`, {
    fileId,
    status,
    processingResult
  });
};

export const updateFileProcessingConfig = (fileId, processingConfig) => {
  return instance.put(`${FILE_BASE_URL}/config`, {
    fileId,
    processingConfig
  });
};

export const deleteDatasetFile = (id) => {
  return instance.delete(`${FILE_BASE_URL}/${id}`);
};

// Translation APIs
const TRANSLATION_BASE_URL = `${import.meta.env.VITE_API_URL}/api/ai-translation`;

export const createTranslation = (data) => {
  return instance.post(TRANSLATION_BASE_URL, data);
};

export const createBulkTranslations = (translations) => {
  return instance.post(`${TRANSLATION_BASE_URL}/bulk`, { translations });
};

export const getTranslationById = (id) => {
  return instance.get(`${TRANSLATION_BASE_URL}/${id}`);
};

export const getTranslationsByFileId = (fileId) => {
  return instance.get(`${TRANSLATION_BASE_URL}/file/${fileId}`);
};

export const getTranslationsByDatasetId = (datasetId) => {
  return instance.get(`${TRANSLATION_BASE_URL}/dataset/${datasetId}`);
};

export const updateTranslation = (data) => {
  return instance.put(TRANSLATION_BASE_URL, data);
};

export const updateTranslationStatus = (translationId, status, translatedContent, translationMetadata) => {
  return instance.put(`${TRANSLATION_BASE_URL}/status`, {
    translationId,
    status,
    translatedContent,
    translationMetadata
  });
};

export const deleteTranslation = (id) => {
  return instance.delete(`${TRANSLATION_BASE_URL}/${id}`);
};

// New APIs for restore functionality
export const getChunkVersions = (datasetId, fileId, chunkIndex) => {
  return instance.get(`${TRANSLATION_BASE_URL}/versions/${datasetId}/${fileId}/${chunkIndex}`);
};

export const deleteNewerVersions = (datasetId, fileId, chunkIndex, keepVersionId) => {
  return instance.post(`${TRANSLATION_BASE_URL}/delete-newer-versions`, {
    datasetId,
    fileId,
    chunkIndex,
    keepVersionId
  });
};

export const updateTranslationConfig = (translationId, config) => {
  return instance.put(`${TRANSLATION_BASE_URL}/config`, {
    translationId,
    config
  });
};
