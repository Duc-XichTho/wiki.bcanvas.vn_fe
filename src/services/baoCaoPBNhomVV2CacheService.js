import { indexedDBService } from './indexedDBService.js';

/**
 * Service chuyên dụng cho việc cache dữ liệu BaoCaoPBNhomVV2
 * Lưu trữ kết quả tính toán theo từng bộ tham số để tránh tính toán lại
 */
class BaoCaoPBNhomVV2CacheService {
    constructor() {
        this.cachePrefix = 'BaoCaoPBNhomVV2_';
        this.cacheTTL = 60; // 60 phút
    }

    /**
     * Tạo cache key dựa trên các tham số
     * @param {Object} params - Các tham số để tạo key
     * @returns {string} - Cache key
     */
    generateCacheKey(params) {
        const { type, currentYearKTQT, currentCompanyKTQT } = params;
        const typePart = type || 'BaoCaoPBNhomVV2';
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
                listUnit: data.listUnit,
                // Không lưu chartOptions và colDefs vì có functions không thể serialize
                cachedAt: new Date().toISOString(),
                params: params
            };

            return await indexedDBService.setCache(cacheKey, cacheData, this.cacheTTL);
        } catch (error) {
            console.error('Error setting BaoCaoPBNhomVV2 cache:', error);
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
                console.log(`BaoCaoPBNhomVV2: Cache hit for key: ${cacheKey}`);
                return cachedData;
            }
            
            console.log(`BaoCaoPBNhomVV2: Cache miss for key: ${cacheKey}`);
            return null;
        } catch (error) {
            console.error('Error getting BaoCaoPBNhomVV2 cache:', error);
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
            console.error('Error deleting BaoCaoPBNhomVV2 cache:', error);
            throw error;
        }
    }

    /**
     * Xóa tất cả cache của BaoCaoPBNhomVV2
     * @returns {Promise<number>} - Số records được xóa
     */
    async clearAllCache() {
        try {
            // Lấy tất cả cache keys có prefix BaoCaoPBNhomVV2
            const allCache = await indexedDBService.db.cache.toArray();
            const pbNhomVVCacheKeys = allCache
                .filter(cache => cache.key.startsWith(this.cachePrefix))
                .map(cache => cache.key);

            let deletedCount = 0;
            for (const key of pbNhomVVCacheKeys) {
                const count = await indexedDBService.deleteCache(key);
                deletedCount += count;
            }

            console.log(`BaoCaoPBNhomVV2: Cleared ${deletedCount} cache entries`);
            return deletedCount;
        } catch (error) {
            console.error('Error clearing BaoCaoPBNhomVV2 cache:', error);
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
            const pbNhomVVCache = allCache.filter(cache => cache.key.startsWith(this.cachePrefix));
            
            return {
                totalEntries: pbNhomVVCache.length,
                entries: pbNhomVVCache.map(cache => ({
                    key: cache.key,
                    cachedAt: cache.createdAt,
                    expiresAt: cache.expiresAt,
                    params: cache.data?.params || null
                }))
            };
        } catch (error) {
            console.error('Error getting BaoCaoPBNhomVV2 cache info:', error);
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
            console.error('Error checking BaoCaoPBNhomVV2 cache:', error);
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
            console.error('Error getting BaoCaoPBNhomVV2 cache keys:', error);
            return [];
        }
    }
}

// Tạo instance duy nhất
const baoCaoPBNhomVV2CacheService = new BaoCaoPBNhomVV2CacheService();

export default baoCaoPBNhomVV2CacheService;
