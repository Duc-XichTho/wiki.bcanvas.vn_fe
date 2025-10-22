import { postgresService as postgresAPI } from '../apis/postgresService.jsx';

class PostgresService {
  constructor() {
    this.isConnected = false;
    this.connectionInfo = null;
    this.currentDatabase = null;
    this.currentSchema = null;
  }

  // Kết nối đến PostgreSQL
  async connect(connectionInfo) {
    try {
      this.connectionInfo = connectionInfo;
      
      const result = await postgresAPI.connect(connectionInfo);
      
      if (result && result.success) {
        this.isConnected = true;
        console.log('Kết nối PostgreSQL thành công!');
        return { success: true, message: 'Kết nối thành công' };
      } else {
        this.isConnected = false;
        return { 
          success: false, 
          message: result?.message || 'Không thể kết nối đến PostgreSQL' 
        };
      }
    } catch (error) {
      console.error('Lỗi kết nối PostgreSQL:', error);
      this.isConnected = false;
      return { 
        success: false, 
        message: error.message || 'Có lỗi khi kết nối PostgreSQL'
      };
    }
  }

  // Lấy danh sách database
  async getDatabases() {
    if (!this.connectionInfo) {
      throw new Error('Chưa có thông tin kết nối PostgreSQL');
    }

    try {
      const result = await postgresAPI.getDatabases(this.connectionInfo);
      
      if (result && result.success) {
        return result.databases || [];
      } else {
        throw new Error(result?.message || 'Không thể lấy danh sách database');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách database:', error);
      throw error;
    }
  }

  // Chuyển đổi database
  async switchDatabase(databaseName) {
    if (!this.connectionInfo) {
      throw new Error('Chưa có thông tin kết nối PostgreSQL');
    }

    try {
      const newConnectionInfo = {
        ...this.connectionInfo,
        database: databaseName
      };
      
      // Test kết nối với database mới
      const result = await postgresAPI.testConnection(newConnectionInfo);
      
      if (result && result.success) {
        this.connectionInfo = newConnectionInfo;
        this.currentDatabase = databaseName;
        return { success: true, message: `Đã chuyển sang database: ${databaseName}` };
      } else {
        throw new Error(result?.message || 'Không thể chuyển database');
      }
    } catch (error) {
      console.error('Lỗi khi chuyển database:', error);
      throw error;
    }
  }

  // Lấy danh sách schema
  async getSchemas() {
    if (!this.connectionInfo) {
      throw new Error('Chưa có thông tin kết nối PostgreSQL');
    }

    try {
      const result = await postgresAPI.getSchemas(this.connectionInfo);
      
      if (result && result.success) {
        return result.schemas || [];
      } else {
        throw new Error(result?.message || 'Không thể lấy danh sách schema');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách schema:', error);
      throw error;
    }
  }

  // Lấy danh sách bảng trong schema
  async getTables(schemaName) {
    if (!this.connectionInfo) {
      throw new Error('Chưa có thông tin kết nối PostgreSQL');
    }

    try {
      const result = await postgresAPI.getTables({
        ...this.connectionInfo,
        schema: schemaName
      });
      
      if (result && result.success) {
        return result.tables || [];
      } else {
        throw new Error(result?.message || 'Không thể lấy danh sách bảng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bảng:', error);
      throw error;
    }
  }

  // Lấy dữ liệu từ bảng
  async getTableData(schemaName, tableName, limit = 1000) {
    if (!this.connectionInfo) {
      throw new Error('Chưa có thông tin kết nối PostgreSQL');
    }

    try {
      const result = await postgresAPI.getTableData({
        ...this.connectionInfo,
        schema: schemaName,
        table: tableName,
        limit: limit
      });
      
      if (result) {
        return result;
      } else {
        throw new Error('Không thể lấy dữ liệu từ bảng');
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu từ bảng:', error);
      throw error;
    }
  }

  // Lấy thông tin cột của bảng
  async getTableColumns(schemaName, tableName) {
    if (!this.connectionInfo) {
      throw new Error('Chưa có thông tin kết nối PostgreSQL');
    }

    try {
      const result = await postgresAPI.getTableColumns({
        ...this.connectionInfo,
        schema: schemaName,
        table: tableName
      });
      
      if (result && result.success) {
        return result.columns || [];
      } else {
        throw new Error(result?.message || 'Không thể lấy thông tin cột');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin cột:', error);
      throw error;
    }
  }

  // Kiểm tra kết nối
  async testConnection() {
    if (!this.connectionInfo) {
      return false;
    }

    try {
      const result = await postgresAPI.testConnection(this.connectionInfo);
      return result && result.success;
    } catch (error) {
      console.error('Lỗi kiểm tra kết nối:', error);
      return false;
    }
  }

  // Đóng kết nối
  async disconnect() {
    if (this.connectionInfo) {
      try {
        await postgresAPI.disconnect(this.connectionInfo);
        
        this.isConnected = false;
        this.connectionInfo = null;
        this.currentDatabase = null;
        this.currentSchema = null;
        console.log('Đã đóng kết nối PostgreSQL');
      } catch (error) {
        console.error('Lỗi khi đóng kết nối:', error);
      }
    }
  }

  // Lấy thông tin kết nối hiện tại
  getConnectionInfo() {
    return this.connectionInfo;
  }

  // Lấy database hiện tại
  getCurrentDatabase() {
    return this.currentDatabase;
  }

  // Lấy schema hiện tại
  getCurrentSchema() {
    return this.currentSchema;
  }
}

// Tạo instance singleton
const postgresService = new PostgresService();

export default postgresService; 