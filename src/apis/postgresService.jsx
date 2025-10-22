import instance from '../apis/axiosInterceptors.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL ;

// PostgreSQL Service API
export const postgresService = {
  // Kết nối đến PostgreSQL
  async connect(connectionInfo) {
    try {
      const response = await instance.post(`${API_BASE_URL}/api/postgres/connect`, connectionInfo);
      return response.data;
    } catch (error) {
      console.error('Lỗi kết nối PostgreSQL:', error);
      throw error;
    }
  },

  // Lấy danh sách databases
  async getDatabases(connectionInfo) {
    try {
      const response = await instance.post(`${API_BASE_URL}/api/postgres/databases`, connectionInfo);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách databases:', error);
      throw error;
    }
  },

  // Lấy danh sách schemas
  async getSchemas(connectionInfo) {
    try {
      const response = await instance.post(`${API_BASE_URL}/api/postgres/schemas`, connectionInfo);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách schemas:', error);
      throw error;
    }
  },

  // Lấy danh sách tables
  async getTables(connectionInfo) {
    try {
      const response = await instance.post(`${API_BASE_URL}/api/postgres/tables`, connectionInfo);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tables:', error);
      throw error;
    }
  },

  // Lấy dữ liệu từ table
  async getTableData(connectionInfo) {
    try {
      // Đảm bảo có đủ thông tin cần thiết
      if (!connectionInfo.host || !connectionInfo.user || !connectionInfo.password || 
          !connectionInfo.database || !connectionInfo.schema || !connectionInfo.table) {
        throw new Error('Thiếu thông tin kết nối, database, schema hoặc table');
      }
      
      const response = await instance.post(`${API_BASE_URL}/api/postgres/data`, connectionInfo);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu từ table:', error);
      throw error;
    }
  },

  // Lấy thông tin columns của table
  async getTableColumns(connectionInfo) {
    try {
      const response = await instance.post(`${API_BASE_URL}/api/postgres/columns`, connectionInfo);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin columns:', error);
      throw error;
    }
  },

  // Test kết nối
  async testConnection(connectionInfo) {
    try {
      const response = await instance.post(`${API_BASE_URL}/api/postgres/test`, connectionInfo);
      return response.data;
    } catch (error) {
      console.error('Lỗi test kết nối:', error);
      throw error;
    }
  },

  // Kiểm tra kết nối với gợi ý
  async checkConnection(connectionInfo) {
    try {
      const response = await instance.post(`${API_BASE_URL}/api/postgres/check-connection`, connectionInfo);
      return response.data;
    } catch (error) {
      console.error('Lỗi kiểm tra kết nối:', error);
      throw error;
    }
  },

  // Đóng kết nối
  async disconnect(connectionInfo) {
    try {
      const response = await instance.post(`${API_BASE_URL}/api/postgres/disconnect`, connectionInfo);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi đóng kết nối:', error);
      throw error;
    }
  }
};

export default postgresService; 