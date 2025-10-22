import indexedDBService from './indexedDBService.js';
import { getTemplateRow } from '../apis/templateSettingService.jsx';

/**
 * Service chuyên dụng để cache dữ liệu TemplateRow
 * Cache key format: templateRow_{id_template}_{id_version}_{page}_{pageSize}
 */
class TemplateRowCacheService {
    constructor() {
        this.cachePrefix = 'templateRow';
        this.defaultTTL = 1440; // 24 giờ (1440 phút)
    }

    /**
     * Thay đổi TTL mặc định cho toàn bộ service
     * @param {number} ttlMinutes - Thời gian cache mới (phút)
     */
    setDefaultTTL(ttlMinutes) {
        this.defaultTTL = ttlMinutes;
        console.log(`[TemplateRowCache] Default TTL updated to ${ttlMinutes} minutes`);
    }

    /**
     * Lấy TTL mặc định hiện tại
     * @returns {number} - TTL hiện tại (phút)
     */
    getDefaultTTL() {
        return this.defaultTTL;
    }

    /**
     * Tạo cache key cho TemplateRow
     * @param {number} idTemplate - ID của template
     * @param {number|null} idVersion - ID của version (null nếu version = 1)
     * @param {number} page - Số trang
     * @param {number|null} pageSize - Kích thước trang
     * @returns {string} - Cache key
     */
    generateCacheKey(idTemplate, idVersion, page = 1, pageSize = null) {
        const version = idVersion || 'null';
        const size = pageSize || 'null';
        return `${this.cachePrefix}_${idTemplate}_${version}_${page}_${size}`;
    }

    /**
     * Lấy dữ liệu TemplateRow từ cache hoặc API
     * @param {number} idTemplate - ID của template
     * @param {number|null} idVersion - ID của version
     * @param {boolean} forceRefresh - Bỏ qua cache và gọi API
     * @param {number} page - Số trang
     * @param {number|null} pageSize - Kích thước trang
     * @param {number} ttlMinutes - Thời gian cache (phút)
     * @returns {Promise<Object>} - Dữ liệu TemplateRow
     */
    async getTemplateRowWithCache(
        idTemplate, 
        idVersion = null, 
        forceRefresh = false, 
        page = 1, 
        pageSize = null,
        ttlMinutes = this.defaultTTL
    ) {
        try {
            const cacheKey = this.generateCacheKey(idTemplate, idVersion, page, pageSize);
            
            // Nếu không force refresh, thử lấy từ cache trước
            if (!forceRefresh) {
                const cachedData = await indexedDBService.getCache(cacheKey);
                if (cachedData) {
                    await indexedDBService.log('info', 'TemplateRow cache hit', {
                        key: cacheKey,
                        idTemplate,
                        idVersion,
                        page,
                        pageSize
                    });
                    return cachedData;
                }
            }
            // Gọi API để lấy dữ liệu
            const apiData = await getTemplateRow(idTemplate, idVersion, forceRefresh, page, pageSize);
            
            // Lưu vào cache
            await indexedDBService.setCache(cacheKey, apiData, ttlMinutes);
            
            await indexedDBService.log('info', 'TemplateRow cached from API', {
                key: cacheKey,
                idTemplate,
                idVersion,
                page,
                pageSize,
                rowCount: apiData?.rows?.length || 0,
                totalCount: apiData?.count || 0
            });

            return apiData;

        } catch (error) {
            console.error('[TemplateRowCache] Error getting template row:', error);
            await indexedDBService.log('error', 'TemplateRow cache error', {
                idTemplate,
                idVersion,
                page,
                pageSize,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Lấy dữ liệu TemplateRow cho nhiều version cùng lúc
     * @param {Array} requests - Mảng các request {idTemplate, idVersion, page, pageSize}
     * @param {boolean} forceRefresh - Bỏ qua cache
     * @param {number} ttlMinutes - Thời gian cache
     * @returns {Promise<Array>} - Mảng kết quả
     */
    async getMultipleTemplateRows(requests, forceRefresh = false, ttlMinutes = this.defaultTTL) {
        try {
            const results = await Promise.allSettled(
                requests.map(request => 
                    this.getTemplateRowWithCache(
                        request.idTemplate,
                        request.idVersion,
                        forceRefresh,
                        request.page || 1,
                        request.pageSize || null,
                        ttlMinutes
                    )
                )
            );

            const successfulResults = [];
            const failedResults = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfulResults.push({
                        request: requests[index],
                        data: result.value
                    });
                } else {
                    failedResults.push({
                        request: requests[index],
                        error: result.reason
                    });
                }
            });

            if (failedResults.length > 0) {
                await indexedDBService.log('warn', 'Some TemplateRow requests failed', {
                    failedCount: failedResults.length,
                    totalCount: requests.length,
                    failedRequests: failedResults
                });
            }

            return {
                successful: successfulResults,
                failed: failedResults,
                total: requests.length
            };

        } catch (error) {
            console.error('[TemplateRowCache] Error getting multiple template rows:', error);
            await indexedDBService.log('error', 'Multiple TemplateRow cache error', {
                requestCount: requests.length,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Xóa cache cho một template cụ thể
     * @param {number} idTemplate - ID của template
     * @param {number|null} idVersion - ID của version (optional)
     * @returns {Promise<number>} - Số cache records đã xóa
     */
    async clearTemplateCache(idTemplate, idVersion = null) {
        try {
            const allCacheKeys = await indexedDBService.getAll();
            const templateCacheKeys = allCacheKeys.filter(item => 
                item.key.startsWith(`${this.cachePrefix}_${idTemplate}`) &&
                (idVersion === null || item.key.includes(`_${idVersion}_`))
            );

            let deletedCount = 0;
            for (const item of templateCacheKeys) {
                await indexedDBService.deleteCache(item.key);
                deletedCount++;
            }

            await indexedDBService.log('info', 'TemplateRow cache cleared', {
                idTemplate,
                idVersion,
                deletedCount
            });

            return deletedCount;

        } catch (error) {
            console.error('[TemplateRowCache] Error clearing template cache:', error);
            await indexedDBService.log('error', 'TemplateRow cache clear error', {
                idTemplate,
                idVersion,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Xóa tất cả cache TemplateRow
     * @returns {Promise<number>} - Số cache records đã xóa
     */
    async clearAllTemplateCache() {
        try {
            const allCacheKeys = await indexedDBService.getAll();
            const templateCacheKeys = allCacheKeys.filter(item => 
                item.key.startsWith(this.cachePrefix)
            );

            let deletedCount = 0;
            for (const item of templateCacheKeys) {
                await indexedDBService.deleteCache(item.key);
                deletedCount++;
            }

            await indexedDBService.log('info', 'All TemplateRow cache cleared', {
                deletedCount
            });

            return deletedCount;

        } catch (error) {
            console.error('[TemplateRowCache] Error clearing all template cache:', error);
            await indexedDBService.log('error', 'All TemplateRow cache clear error', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Lấy thống kê cache TemplateRow
     * @returns {Promise<Object>} - Thống kê cache
     */
    async getCacheStats() {
        try {
            const allCacheKeys = await indexedDBService.getAll();
            const templateCacheKeys = allCacheKeys.filter(item => 
                item.key.startsWith(this.cachePrefix)
            );

            const stats = {
                totalCacheEntries: templateCacheKeys.length,
                templates: {},
                totalSize: 0
            };

            templateCacheKeys.forEach(item => {
                const parts = item.key.split('_');
                if (parts.length >= 3) {
                    const templateId = parts[1];
                    const version = parts[2];
                    
                    if (!stats.templates[templateId]) {
                        stats.templates[templateId] = {
                            versions: {},
                            totalEntries: 0
                        };
                    }
                    
                    if (!stats.templates[templateId].versions[version]) {
                        stats.templates[templateId].versions[version] = 0;
                    }
                    
                    stats.templates[templateId].versions[version]++;
                    stats.templates[templateId].totalEntries++;
                }

                // Ước tính kích thước (không chính xác 100%)
                stats.totalSize += JSON.stringify(item.value).length;
            });

            return stats;

        } catch (error) {
            console.error('[TemplateRowCache] Error getting cache stats:', error);
            throw error;
        }
    }

    /**
     * Preload cache cho danh sách approved versions
     * @param {Array} approvedVersions - Danh sách approved versions
     * @param {number} ttlMinutes - Thời gian cache
     * @returns {Promise<Object>} - Kết quả preload
     */
    async preloadApprovedVersions(approvedVersions, ttlMinutes = this.defaultTTL) {
        try {
            const requests = approvedVersions.map(version => ({
                idTemplate: version.id_template,
                idVersion: version.id_version,
                page: 1,
            }));

            const result = await this.getMultipleTemplateRows(requests, false, ttlMinutes);

            await indexedDBService.log('info', 'TemplateRow preload completed', {
                totalVersions: approvedVersions.length,
                successful: result.successful.length,
                failed: result.failed.length
            });

            return result;

        } catch (error) {
            console.error('[TemplateRowCache] Error preloading approved versions:', error);
            await indexedDBService.log('error', 'TemplateRow preload error', {
                versionCount: approvedVersions.length,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Kiểm tra cache có tồn tại không
     * @param {number} idTemplate - ID của template
     * @param {number|null} idVersion - ID của version
     * @param {number} page - Số trang
     * @param {number|null} pageSize - Kích thước trang
     * @returns {Promise<boolean>} - Cache có tồn tại không
     */
    async hasCache(idTemplate, idVersion, page = 1, pageSize = null) {
        try {
            const cacheKey = this.generateCacheKey(idTemplate, idVersion, page, pageSize);
            const cachedData = await indexedDBService.getCache(cacheKey);
            return cachedData !== null;
        } catch (error) {
            console.error('[TemplateRowCache] Error checking cache:', error);
            return false;
        }
    }

    /**
     * Lấy thông tin cache cho một key cụ thể
     * @param {number} idTemplate - ID của template
     * @param {number|null} idVersion - ID của version
     * @param {number} page - Số trang
     * @param {number|null} pageSize - Kích thước trang
     * @returns {Promise<Object|null>} - Thông tin cache
     */
    async getCacheInfo(idTemplate, idVersion, page = 1, pageSize = null) {
        try {
            const cacheKey = this.generateCacheKey(idTemplate, idVersion, page, pageSize);
            const cacheRecord = await indexedDBService.db.cache.where('key').equals(cacheKey).first();
            
            if (!cacheRecord) {
                return null;
            }

            return {
                key: cacheRecord.key,
                createdAt: cacheRecord.createdAt,
                expiresAt: cacheRecord.expiresAt,
                isExpired: new Date() > cacheRecord.expiresAt,
                dataSize: JSON.stringify(cacheRecord.data).length,
                rowCount: cacheRecord.data?.rows?.length || 0,
                totalCount: cacheRecord.data?.count || 0
            };

        } catch (error) {
            console.error('[TemplateRowCache] Error getting cache info:', error);
            return null;
        }
    }
}

// Tạo instance duy nhất
const templateRowCacheService = new TemplateRowCacheService();

// Export constants để các component có thể sử dụng
export const TEMPLATE_ROW_CACHE_TTL = templateRowCacheService.getDefaultTTL();

// Export service
export { templateRowCacheService };
export default templateRowCacheService;
