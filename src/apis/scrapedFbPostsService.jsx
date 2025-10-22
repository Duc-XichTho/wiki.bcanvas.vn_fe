import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/scraped-fb-posts';
const URL = BASE_URL + SUB_URL;

// Create a new scraped Facebook post
export const createScrapedFbPost = async (postData) => {
  try {
    const { data } = await instance.post(URL, postData);
    return data;
  } catch (error) {
    console.error('Lỗi khi tạo scraped Facebook post:', error);
    throw error;
  }
};

// Get all scraped Facebook posts
export const getAllScrapedFbPosts = async (params = {}) => {
  try {
    const { data } = await instance.get(URL, { params });
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách scraped Facebook posts:', error);
    throw error;
  }
};

// Get a specific scraped Facebook post by ID
export const getScrapedFbPostById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (error) {
    console.error('Lỗi khi lấy scraped Facebook post theo ID:', error);
    throw error;
  }
};

// Update a scraped Facebook post
export const updateScrapedFbPost = async (postData) => {
  try {
    let res = await instance.put(URL, postData);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// Delete (soft delete) a scraped Facebook post
export const deleteScrapedFbPost = async (id) => {
  try {
    let res = await instance.delete(URL + '/' + id);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// Get scraped Facebook posts with pagination
export const getScrapedFbPostsWithPagination = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters,
    };
    
    const { data } = await instance.get(URL, { params });
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy scraped Facebook posts với phân trang:', error);
    throw error;
  }
};

// Search scraped Facebook posts
export const searchScrapedFbPosts = async (searchTerm, filters = {}) => {
  try {
    const params = {
      search: searchTerm,
      ...filters,
    };
    
    const { data } = await instance.get(URL, { params });
    return data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm scraped Facebook posts:', error);
    throw error;
  }
};

// Get scraped Facebook posts by date range
export const getScrapedFbPostsByDateRange = async (startDate, endDate, filters = {}) => {
  try {
    const params = {
      startDate,
      endDate,
      ...filters,
    };
    
    const { data } = await instance.get(URL, { params });
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy scraped Facebook posts theo khoảng thời gian:', error);
    throw error;
  }
};

// Bulk operations
export const bulkUpdateScrapedFbPosts = async (postIds, updateData) => {
  try {
    let res = await instance.put(URL + '/bulk', {
      postIds,
      updateData,
    });
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const bulkDeleteScrapedFbPosts = async (postIds) => {
  try {
    let res = await instance.delete(URL + '/bulk', {
      data: { postIds },
    });
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// Export scraped Facebook posts
export const exportScrapedFbPosts = async (format = 'csv', filters = {}) => {
  try {
    const params = {
      export: format,
      ...filters,
    };
    
    const { data } = await instance.get(URL + '/export', {
      params,
      responseType: 'blob',
    });
    return data;
  } catch (error) {
    console.error('Lỗi khi export scraped Facebook posts:', error);
    throw error;
  }
};

// Get statistics for scraped Facebook posts
export const getScrapedFbPostsStats = async (filters = {}) => {
  try {
    const params = {
      stats: true,
      ...filters,
    };
    
    const { data } = await instance.get(URL + '/stats', { params });
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy thống kê scraped Facebook posts:', error);
    throw error;
  }
}; 