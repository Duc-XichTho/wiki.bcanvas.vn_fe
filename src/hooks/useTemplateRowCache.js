import { useState, useCallback, useEffect } from 'react';
import templateRowCacheService from '../services/templateRowCacheService.js';

/**
 * Hook để sử dụng TemplateRowCacheService trong React components
 */
export const useTemplateRowCache = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cacheStats, setCacheStats] = useState(null);

    // Load cache stats
    const loadCacheStats = useCallback(async () => {
        try {
            const stats = await templateRowCacheService.getCacheStats();
            setCacheStats(stats);
            return stats;
        } catch (err) {
            console.error('Failed to load cache stats:', err);
            setError(err);
            return null;
        }
    }, []);

    // Get template row with cache
    const getTemplateRow = useCallback(async (
        idTemplate, 
        idVersion = null, 
        forceRefresh = false, 
        page = 1, 
        pageSize = null,
        ttlMinutes = 30
    ) => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await templateRowCacheService.getTemplateRowWithCache(
                idTemplate, 
                idVersion, 
                forceRefresh, 
                page, 
                pageSize,
                ttlMinutes
            );
            
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get multiple template rows
    const getMultipleTemplateRows = useCallback(async (requests, forceRefresh = false, ttlMinutes = 30) => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await templateRowCacheService.getMultipleTemplateRows(
                requests, 
                forceRefresh, 
                ttlMinutes
            );
            
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Clear template cache
    const clearTemplateCache = useCallback(async (idTemplate, idVersion = null) => {
        try {
            setLoading(true);
            setError(null);
            
            const deletedCount = await templateRowCacheService.clearTemplateCache(idTemplate, idVersion);
            
            // Reload cache stats
            await loadCacheStats();
            
            return deletedCount;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadCacheStats]);

    // Clear all template cache
    const clearAllTemplateCache = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const deletedCount = await templateRowCacheService.clearAllTemplateCache();
            
            // Reload cache stats
            await loadCacheStats();
            
            return deletedCount;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadCacheStats]);

    // Preload approved versions
    const preloadApprovedVersions = useCallback(async (approvedVersions, ttlMinutes = 30) => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await templateRowCacheService.preloadApprovedVersions(
                approvedVersions, 
                ttlMinutes
            );
            
            // Reload cache stats
            await loadCacheStats();
            
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadCacheStats]);

    // Check if cache exists
    const hasCache = useCallback(async (idTemplate, idVersion, page = 1, pageSize = null) => {
        try {
            return await templateRowCacheService.hasCache(idTemplate, idVersion, page, pageSize);
        } catch (err) {
            console.error('Failed to check cache:', err);
            return false;
        }
    }, []);

    // Get cache info
    const getCacheInfo = useCallback(async (idTemplate, idVersion, page = 1, pageSize = null) => {
        try {
            return await templateRowCacheService.getCacheInfo(idTemplate, idVersion, page, pageSize);
        } catch (err) {
            console.error('Failed to get cache info:', err);
            return null;
        }
    }, []);

    // Load cache stats on mount
    useEffect(() => {
        loadCacheStats();
    }, [loadCacheStats]);

    return {
        // State
        loading,
        error,
        cacheStats,
        
        // Actions
        getTemplateRow,
        getMultipleTemplateRows,
        clearTemplateCache,
        clearAllTemplateCache,
        preloadApprovedVersions,
        hasCache,
        getCacheInfo,
        loadCacheStats
    };
};

/**
 * Hook chuyên dụng cho việc load table data với cache
 */
export const useTableDataWithCache = () => {
    const { 
        getTemplateRow, 
        loading, 
        error, 
        hasCache,
        getCacheInfo 
    } = useTemplateRowCache();

    const [tableData, setTableData] = useState({});
    const [cacheInfo, setCacheInfo] = useState({});

    // Load table data với cache
    const loadTableData = useCallback(async (
        idTemplate, 
        idVersion, 
        page = 1, 
        pageSize = null,
        forceRefresh = false
    ) => {
        try {
            const cacheKey = `${idTemplate}_${idVersion || 'null'}_${page}_${pageSize || 'null'}`;
            
            // Kiểm tra cache trước
            const cacheExists = await hasCache(idTemplate, idVersion, page, pageSize);
            const cacheInfoData = await getCacheInfo(idTemplate, idVersion, page, pageSize);
            
            setCacheInfo(prev => ({
                ...prev,
                [cacheKey]: {
                    exists: cacheExists,
                    info: cacheInfoData
                }
            }));

            // Lấy dữ liệu
            const data = await getTemplateRow(idTemplate, idVersion, forceRefresh, page, pageSize);
            
            setTableData(prev => ({
                ...prev,
                [cacheKey]: data
            }));

            return data;

        } catch (err) {
            console.error('Failed to load table data:', err);
            throw err;
        }
    }, [getTemplateRow, hasCache, getCacheInfo]);

    // Clear specific table data
    const clearTableData = useCallback((idTemplate, idVersion, page = 1, pageSize = null) => {
        const cacheKey = `${idTemplate}_${idVersion || 'null'}_${page}_${pageSize || 'null'}`;
        setTableData(prev => {
            const newData = { ...prev };
            delete newData[cacheKey];
            return newData;
        });
        setCacheInfo(prev => {
            const newInfo = { ...prev };
            delete newInfo[cacheKey];
            return newInfo;
        });
    }, []);

    // Clear all table data
    const clearAllTableData = useCallback(() => {
        setTableData({});
        setCacheInfo({});
    }, []);

    return {
        // State
        tableData,
        cacheInfo,
        loading,
        error,
        
        // Actions
        loadTableData,
        clearTableData,
        clearAllTableData
    };
};

export default useTemplateRowCache;
