import templateRowCacheService, { TEMPLATE_ROW_CACHE_TTL } from '../services/templateRowCacheService.js';
import { getTemplateRow as originalGetTemplateRow } from '../apis/templateSettingService.jsx';

/**
 * Wrapper function cho getTemplateRow với cache
 * Sử dụng function này thay vì gọi getTemplateRow trực tiếp
 */
export const getTemplateRowWithCache = async (
    tableId, 
    version = null, 
    forceRefresh = false, 
    page = 1, 
    pageSize = null,
    ttlMinutes = TEMPLATE_ROW_CACHE_TTL
) => {
    try {
        return await templateRowCacheService.getTemplateRowWithCache(
            tableId, 
            version, 
            forceRefresh, 
            page, 
            pageSize,
            ttlMinutes
        );
    } catch (error) {
        console.error('Error in getTemplateRowWithCache:', error);
        throw error;
    }
};

/**
 * Function để preload cache cho danh sách approved versions
 */
export const preloadApprovedVersionsCache = async (approvedVersions, ttlMinutes = TEMPLATE_ROW_CACHE_TTL) => {
    try {
        return await templateRowCacheService.preloadApprovedVersions(approvedVersions, ttlMinutes);
    } catch (error) {
        console.error('Error preloading approved versions cache:', error);
        throw error;
    }
};

/**
 * Function để clear cache cho một template cụ thể
 */
export const clearTemplateCache = async (idTemplate, idVersion = null) => {
    try {
        return await templateRowCacheService.clearTemplateCache(idTemplate, idVersion);
    } catch (error) {
        console.error('Error clearing template cache:', error);
        throw error;
    }
};

/**
 * Function để clear tất cả template cache
 */
export const clearAllTemplateCache = async () => {
    try {
        return await templateRowCacheService.clearAllTemplateCache();
    } catch (error) {
        console.error('Error clearing all template cache:', error);
        throw error;
    }
};

/**
 * Function để lấy cache stats
 */
export const getTemplateCacheStats = async () => {
    try {
        return await templateRowCacheService.getCacheStats();
    } catch (error) {
        console.error('Error getting template cache stats:', error);
        throw error;
    }
};

/**
 * Function để kiểm tra cache có tồn tại không
 */
export const hasTemplateCache = async (idTemplate, idVersion, page = 1, pageSize = null) => {
    try {
        return await templateRowCacheService.hasCache(idTemplate, idVersion, page, pageSize);
    } catch (error) {
        console.error('Error checking template cache:', error);
        return false;
    }
};

/**
 * Function để lấy thông tin cache
 */
export const getTemplateCacheInfo = async (idTemplate, idVersion, page = 1, pageSize = null) => {
    try {
        return await templateRowCacheService.getCacheInfo(idTemplate, idVersion, page, pageSize);
    } catch (error) {
        console.error('Error getting template cache info:', error);
        return null;
    }
};

/**
 * Helper function để tạo cache key
 */
export const generateTemplateCacheKey = (idTemplate, idVersion, page = 1, pageSize = null) => {
    return templateRowCacheService.generateCacheKey(idTemplate, idVersion, page, pageSize);
};

// Export original function để có thể sử dụng khi cần
export { originalGetTemplateRow as getTemplateRow };

// Export service để có thể sử dụng trực tiếp nếu cần
export { templateRowCacheService };

// Export constant để các component có thể sử dụng
export { TEMPLATE_ROW_CACHE_TTL };

/**
 * Fetch all template rows by paging and emit progress updates.
 * Returns a flat array of row.data objects.
 */
export const getAllTemplateRowsWithProgress = async (
    tableId,
    version = null,
    options = {}
) => {
    const {
        pageSize = 5000,
        forceRefresh = false,
        onProgress = () => {}
    } = options;

    // First request to know total count
    const firstPage = 1;
    const firstResponse = await getTemplateRowWithCache(
        tableId,
        version,
        forceRefresh,
        firstPage,
        pageSize
    );

    const totalCount = Number(firstResponse?.count || 0);
    const collected = [];
    const pushRows = (resp) => {
        const rows = resp?.rows || [];
        if (Array.isArray(rows)) {
            rows.forEach((r) => collected.push(r?.data ?? r));
        } else {
            // rows might be an object map
            Object.values(rows).forEach((r) => collected.push(r?.data ?? r));
        }
    };

    pushRows(firstResponse);
    onProgress({ fetched: collected.length, total: totalCount, percent: totalCount ? Math.min(100, Math.round((collected.length / totalCount) * 100)) : 100 });

    if (totalCount <= collected.length) {
        return { rows: collected, count: totalCount };
    }

    const totalPages = Math.ceil(totalCount / pageSize);
    for (let page = 2; page <= totalPages; page += 1) {
        const resp = await getTemplateRowWithCache(
            tableId,
            version,
            forceRefresh,
            page,
            pageSize
        );
        pushRows(resp);
        onProgress({ fetched: collected.length, total: totalCount, percent: Math.min(100, Math.round((collected.length / totalCount) * 100)) });
    }

    return { rows: collected, count: totalCount };
};
