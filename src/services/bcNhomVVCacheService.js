import { indexedDBService } from './indexedDBService.js';

/**
 * Service chuyên dụng cho việc cache dữ liệu BCNhomVV
 * Lưu trữ kết quả tính toán theo từng bộ tham số để tránh tính toán lại
 */
class BCNhomVVCacheService {
    constructor() {
        this.cachePrefix = 'BCNhomVV_';
        this.cacheTTL = 60; // 60 phút
    }

    /**
     * Tạo cache key dựa trên các tham số
     * @param {Object} params - Các tham số để tạo key
     * @returns {string} - Cache key
     */
    generateCacheKey(params) {
        const { type, currentYearKTQT, currentCompanyKTQT } = params;
        const typePart = type || 'BCNhomVV';
        return `${this.cachePrefix}${typePart}_${currentCompanyKTQT}_${currentYearKTQT}`;
    }

    /**
     * Lưu dữ liệu vào cache
     * @param {Object} params - Các tham số để tạo key
     * @param {Object} data - Dữ liệu cần cache
     * @returns {Promise<number>} - ID của cache record
     */
    async setCache(params, data) {
        try {
            const cacheKey = this.generateCacheKey(params);
            
            // Chỉ lưu dữ liệu có thể serialize được
            const cacheData = {
                rowData: data.rowData,
                groups: data.groups,
                // Không lưu colDefs vì có functions không thể serialize
                cachedAt: new Date().toISOString(),
                params: params
            };

            return await indexedDBService.setCache(cacheKey, cacheData, this.cacheTTL);
        } catch (error) {
            console.error('Error setting BCNhomVV cache:', error);
            throw error;
        }
    }

    /**
     * Lấy dữ liệu từ cache
     * @param {Object} params - Các tham số để tạo key
     * @returns {Promise<Object|null>} - Dữ liệu cache hoặc null
     */
    async getCache(params) {
        try {
            const cacheKey = this.generateCacheKey(params);
            const cachedData = await indexedDBService.getCache(cacheKey);
            
            if (cachedData) {
                console.log(`BCNhomVV: Cache hit for key: ${cacheKey}`);
                return cachedData;
            }
            
            console.log(`BCNhomVV: Cache miss for key: ${cacheKey}`);
            return null;
        } catch (error) {
            console.error('Error getting BCNhomVV cache:', error);
            return null;
        }
    }

    /**
     * Xóa cache theo tham số
     * @param {Object} params - Các tham số để tạo key
     * @returns {Promise<number>} - Số records được xóa
     */
    async deleteCache(params) {
        try {
            const cacheKey = this.generateCacheKey(params);
            return await indexedDBService.deleteCache(cacheKey);
        } catch (error) {
            console.error('Error deleting BCNhomVV cache:', error);
            throw error;
        }
    }

    /**
     * Xóa tất cả cache của BCNhomVV
     * @returns {Promise<number>} - Số records được xóa
     */
    async clearAllCache() {
        try {
            // Lấy tất cả cache keys có prefix BCNhomVV
            const allCache = await indexedDBService.db.cache.toArray();
            const bcNhomVVCacheKeys = allCache
                .filter(cache => cache.key.startsWith(this.cachePrefix))
                .map(cache => cache.key);

            let deletedCount = 0;
            for (const key of bcNhomVVCacheKeys) {
                const count = await indexedDBService.deleteCache(key);
                deletedCount += count;
            }

            console.log(`BCNhomVV: Cleared ${deletedCount} cache entries`);
            return deletedCount;
        } catch (error) {
            console.error('Error clearing BCNhomVV cache:', error);
            throw error;
        }
    }

    /**
     * Lấy thông tin cache hiện tại
     * @returns {Promise<Object>} - Thông tin cache
     */
    async getCacheInfo() {
        try {
            const allCache = await indexedDBService.db.cache.toArray();
            const bcNhomVVCache = allCache.filter(cache => cache.key.startsWith(this.cachePrefix));
            
            return {
                totalEntries: bcNhomVVCache.length,
                entries: bcNhomVVCache.map(cache => ({
                    key: cache.key,
                    cachedAt: cache.createdAt,
                    expiresAt: cache.expiresAt,
                    params: cache.data?.params || null
                }))
            };
        } catch (error) {
            console.error('Error getting BCNhomVV cache info:', error);
            throw error;
        }
    }

    /**
     * Kiểm tra cache có tồn tại không
     * @param {Object} params - Các tham số để tạo key
     * @returns {Promise<boolean>} - True nếu cache tồn tại
     */
    async hasCache(params) {
        try {
            const cacheKey = this.generateCacheKey(params);
            const cachedData = await indexedDBService.getCache(cacheKey);
            return cachedData !== null;
        } catch (error) {
            console.error('Error checking BCNhomVV cache:', error);
            return false;
        }
    }

    /**
     * Cập nhật TTL cho cache
     * @param {number} ttlMinutes - Thời gian sống mới (phút)
     */
    setCacheTTL(ttlMinutes) {
        this.cacheTTL = ttlMinutes;
    }

    /**
     * Lấy danh sách các cache keys hiện tại
     * @returns {Promise<Array>} - Danh sách cache keys
     */
    async getCacheKeys() {
        try {
            const allCache = await indexedDBService.db.cache.toArray();
            return allCache
                .filter(cache => cache.key.startsWith(this.cachePrefix))
                .map(cache => cache.key);
        } catch (error) {
            console.error('Error getting BCNhomVV cache keys:', error);
            return [];
        }
    }
}

// Tạo instance duy nhất
const bcNhomVVCacheService = new BCNhomVVCacheService();

export default bcNhomVVCacheService;
