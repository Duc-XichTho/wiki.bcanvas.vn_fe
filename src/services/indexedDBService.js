import Dexie from 'dexie';

// Khởi tạo database
const db = new Dexie('BCanvasDB');

// Định nghĩa schema cho database
db.version(1).stores({
    // Bảng lưu trữ dữ liệu chung
    data: '++id, key, value, createdAt, updatedAt',
    // Bảng lưu trữ cache
    cache: '++id, key, data, expiresAt, createdAt',
    // Bảng lưu trữ settings
    settings: '++id, key, value, type, updatedAt',
    // Bảng lưu trữ logs
    logs: '++id, level, message, data, timestamp',
    // Bảng lưu trữ sổ kế toán (giữ nguyên từ cấu hình cũ)
    soKeToan: '++id, updateAt, isPending'
});

// Class service chính cho IndexedDB operations
class IndexedDBService {
    constructor() {
        this.db = db;
    }

    // ========== CRUD OPERATIONS FOR DATA TABLE ==========
    
    /**
     * Tạo mới một record
     * @param {string} key - Key để identify data
     * @param {any} value - Giá trị cần lưu
     * @returns {Promise<number>} - ID của record vừa tạo
     */
    async create(key, value) {
        try {
            const now = new Date();
            const id = await this.db.data.add({
                key,
                value,
                createdAt: now,
                updatedAt: now
            });
            return id;
        } catch (error) {
            console.error('Error creating record:', error);
            throw error;
        }
    }

    /**
     * Lấy dữ liệu theo key
     * @param {string} key - Key cần tìm
     * @returns {Promise<any>} - Dữ liệu tìm được
     */
    async get(key) {
        try {
            const record = await this.db.data.where('key').equals(key).first();
            return record ? record.value : null;
        } catch (error) {
            console.error('Error getting record:', error);
            throw error;
        }
    }

    /**
     * Lấy tất cả dữ liệu
     * @returns {Promise<Array>} - Danh sách tất cả records
     */
    async getAll() {
        try {
            return await this.db.data.toArray();
        } catch (error) {
            console.error('Error getting all records:', error);
            throw error;
        }
    }

    /**
     * Cập nhật dữ liệu theo key
     * @param {string} key - Key cần cập nhật
     * @param {any} newValue - Giá trị mới
     * @returns {Promise<number>} - Số records được cập nhật
     */
    async update(key, newValue) {
        try {
            const updatedCount = await this.db.data
                .where('key')
                .equals(key)
                .modify({
                    value: newValue,
                    updatedAt: new Date()
                });
            return updatedCount;
        } catch (error) {
            console.error('Error updating record:', error);
            throw error;
        }
    }

    /**
     * Xóa dữ liệu theo key
     * @param {string} key - Key cần xóa
     * @returns {Promise<number>} - Số records được xóa
     */
    async delete(key) {
        try {
            const deletedCount = await this.db.data.where('key').equals(key).delete();
            return deletedCount;
        } catch (error) {
            console.error('Error deleting record:', error);
            throw error;
        }
    }

    /**
     * Xóa tất cả dữ liệu
     * @returns {Promise<number>} - Số records được xóa
     */
    async deleteAll() {
        try {
            return await this.db.data.clear();
        } catch (error) {
            console.error('Error deleting all records:', error);
            throw error;
        }
    }

    // ========== CACHE OPERATIONS ==========
    
    /**
     * Lưu dữ liệu vào cache với thời gian hết hạn
     * @param {string} key - Key cho cache
     * @param {any} data - Dữ liệu cần cache
     * @param {number} ttlMinutes - Thời gian sống (phút)
     * @returns {Promise<number>} - ID của cache record
     */
    async setCache(key, data, ttlMinutes = 60) {
        try {
            const now = new Date();
            const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
            
            // Xóa cache cũ nếu có
            await this.db.cache.where('key').equals(key).delete();
            
            const id = await this.db.cache.add({
                key,
                data,
                expiresAt,
                createdAt: now
            });
            return id;
        } catch (error) {
            console.error('Error setting cache:', error);
            throw error;
        }
    }

    /**
     * Lấy dữ liệu từ cache
     * @param {string} key - Key của cache
     * @returns {Promise<any>} - Dữ liệu cache hoặc null nếu hết hạn
     */
    async getCache(key) {
        try {
            const cacheRecord = await this.db.cache.where('key').equals(key).first();
            
            if (!cacheRecord) {
                return null;
            }

            // Kiểm tra hết hạn
            if (new Date() > cacheRecord.expiresAt) {
                await this.db.cache.where('key').equals(key).delete();
                return null;
            }

            return cacheRecord.data;
        } catch (error) {
            console.error('Error getting cache:', error);
            throw error;
        }
    }

    /**
     * Xóa cache theo key
     * @param {string} key - Key cần xóa
     * @returns {Promise<number>} - Số records được xóa
     */
    async deleteCache(key) {
        try {
            return await this.db.cache.where('key').equals(key).delete();
        } catch (error) {
            console.error('Error deleting cache:', error);
            throw error;
        }
    }

    /**
     * Dọn dẹp cache hết hạn
     * @returns {Promise<number>} - Số cache records được xóa
     */
    async cleanExpiredCache() {
        try {
            const now = new Date();
            return await this.db.cache.where('expiresAt').below(now).delete();
        } catch (error) {
            console.error('Error cleaning expired cache:', error);
            throw error;
        }
    }

    // ========== SETTINGS OPERATIONS ==========
    
    /**
     * Lưu setting
     * @param {string} key - Key của setting
     * @param {any} value - Giá trị setting
     * @param {string} type - Loại dữ liệu (string, number, boolean, object)
     * @returns {Promise<number>} - ID của setting record
     */
    async setSetting(key, value, type = 'string') {
        try {
            // Xóa setting cũ nếu có
            await this.db.settings.where('key').equals(key).delete();
            
            const id = await this.db.settings.add({
                key,
                value,
                type,
                updatedAt: new Date()
            });
            return id;
        } catch (error) {
            console.error('Error setting setting:', error);
            throw error;
        }
    }

    /**
     * Lấy setting
     * @param {string} key - Key của setting
     * @returns {Promise<any>} - Giá trị setting
     */
    async getSetting(key) {
        try {
            const setting = await this.db.settings.where('key').equals(key).first();
            return setting ? setting.value : null;
        } catch (error) {
            console.error('Error getting setting:', error);
            throw error;
        }
    }

    /**
     * Lấy tất cả settings
     * @returns {Promise<Array>} - Danh sách tất cả settings
     */
    async getAllSettings() {
        try {
            return await this.db.settings.toArray();
        } catch (error) {
            console.error('Error getting all settings:', error);
            throw error;
        }
    }

    // ========== LOGGING OPERATIONS ==========
    
    /**
     * Ghi log
     * @param {string} level - Mức độ log (info, warn, error, debug)
     * @param {string} message - Nội dung log
     * @param {any} data - Dữ liệu bổ sung
     * @returns {Promise<number>} - ID của log record
     */
    async log(level, message, data = null) {
        try {
            const id = await this.db.logs.add({
                level,
                message,
                data,
                timestamp: new Date()
            });
            return id;
        } catch (error) {
            console.error('Error logging:', error);
            throw error;
        }
    }

    /**
     * Lấy logs theo level
     * @param {string} level - Mức độ log
     * @param {number} limit - Số lượng logs tối đa
     * @returns {Promise<Array>} - Danh sách logs
     */
    async getLogs(level = null, limit = 100) {
        try {
            let query = this.db.logs.orderBy('timestamp').reverse();
            
            if (level) {
                query = query.filter(log => log.level === level);
            }
            
            return await query.limit(limit).toArray();
        } catch (error) {
            console.error('Error getting logs:', error);
            throw error;
        }
    }

    /**
     * Xóa logs cũ hơn số ngày chỉ định
     * @param {number} daysOld - Số ngày
     * @returns {Promise<number>} - Số logs được xóa
     */
    async cleanOldLogs(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            return await this.db.logs.where('timestamp').below(cutoffDate).delete();
        } catch (error) {
            console.error('Error cleaning old logs:', error);
            throw error;
        }
    }

    // ========== UTILITY METHODS ==========
    
    /**
     * Kiểm tra database có sẵn sàng không
     * @returns {Promise<boolean>}
     */
    async isReady() {
        try {
            await this.db.open();
            return true;
        } catch (error) {
            console.error('Database not ready:', error);
            return false;
        }
    }

    /**
     * Lấy thông tin database
     * @returns {Promise<Object>} - Thông tin database
     */
    async getDatabaseInfo() {
        try {
            const [dataCount, cacheCount, settingsCount, logsCount] = await Promise.all([
                this.db.data.count(),
                this.db.cache.count(),
                this.db.settings.count(),
                this.db.logs.count()
            ]);

            return {
                dataCount,
                cacheCount,
                settingsCount,
                logsCount,
                totalRecords: dataCount + cacheCount + settingsCount + logsCount
            };
        } catch (error) {
            console.error('Error getting database info:', error);
            throw error;
        }
    }

    /**
     * Export tất cả dữ liệu
     * @returns {Promise<Object>} - Dữ liệu export
     */
    async exportData() {
        try {
            const [data, cache, settings, logs] = await Promise.all([
                this.db.data.toArray(),
                this.db.cache.toArray(),
                this.db.settings.toArray(),
                this.db.logs.toArray()
            ]);

            return {
                data,
                cache,
                settings,
                logs,
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    /**
     * Import dữ liệu
     * @param {Object} importData - Dữ liệu cần import
     * @returns {Promise<Object>} - Kết quả import
     */
    async importData(importData) {
        try {
            const results = {};

            if (importData.data) {
                await this.db.data.clear();
                results.dataImported = await this.db.data.bulkAdd(importData.data);
            }

            if (importData.cache) {
                await this.db.cache.clear();
                results.cacheImported = await this.db.cache.bulkAdd(importData.cache);
            }

            if (importData.settings) {
                await this.db.settings.clear();
                results.settingsImported = await this.db.settings.bulkAdd(importData.settings);
            }

            if (importData.logs) {
                await this.db.logs.clear();
                results.logsImported = await this.db.logs.bulkAdd(importData.logs);
            }

            return results;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }
}

// Tạo instance duy nhất
const indexedDBService = new IndexedDBService();

// Export service và database
export { indexedDBService, db };
export default indexedDBService;
