import instance from './axiosInterceptors';

const URL = '/api/metric-map/import';

export const importMetricMapData = async (jsonData) => {
  try {
    const result = await instance.post(URL, jsonData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return result.data;
  } catch (error) {
    console.error('Lỗi khi import dữ liệu Metric Map:', error);
    throw error;
  }
};
