import { useState, useEffect, useCallback } from 'react';
import indexedDBService from '../services/indexedDBService.js';

/**
 * Custom hook để sử dụng IndexedDB Service trong React components
 */
export const useIndexedDB = () => {
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Khởi tạo database
    useEffect(() => {
        const initDB = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const ready = await indexedDBService.isReady();
                setIsReady(ready);
                
                if (ready) {
                    await indexedDBService.log('info', 'IndexedDB initialized successfully');
                }
            } catch (err) {
                setError(err);
                console.error('Failed to initialize IndexedDB:', err);
            } finally {
                setLoading(false);
            }
        };

        initDB();
    }, []);

    // CRUD operations
    const create = useCallback(async (key, value) => {
        try {
            setError(null);
            const id = await indexedDBService.create(key, value);
            await indexedDBService.log('info', `Created record with key: ${key}`, { id, key });
            return id;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', `Failed to create record: ${key}`, { error: err.message });
            throw err;
        }
    }, []);

    const get = useCallback(async (key) => {
        try {
            setError(null);
            const data = await indexedDBService.get(key);
            return data;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', `Failed to get record: ${key}`, { error: err.message });
            throw err;
        }
    }, []);

    const update = useCallback(async (key, newValue) => {
        try {
            setError(null);
            const count = await indexedDBService.update(key, newValue);
            await indexedDBService.log('info', `Updated record: ${key}`, { count, key });
            return count;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', `Failed to update record: ${key}`, { error: err.message });
            throw err;
        }
    }, []);

    const remove = useCallback(async (key) => {
        try {
            setError(null);
            const count = await indexedDBService.delete(key);
            await indexedDBService.log('info', `Deleted record: ${key}`, { count, key });
            return count;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', `Failed to delete record: ${key}`, { error: err.message });
            throw err;
        }
    }, []);

    const getAll = useCallback(async () => {
        try {
            setError(null);
            const data = await indexedDBService.getAll();
            return data;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', 'Failed to get all records', { error: err.message });
            throw err;
        }
    }, []);

    // Cache operations
    const setCache = useCallback(async (key, data, ttlMinutes = 60) => {
        try {
            setError(null);
            const id = await indexedDBService.setCache(key, data, ttlMinutes);
            return id;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', `Failed to set cache: ${key}`, { error: err.message });
            throw err;
        }
    }, []);

    const getCache = useCallback(async (key) => {
        try {
            setError(null);
            const data = await indexedDBService.getCache(key);
            return data;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', `Failed to get cache: ${key}`, { error: err.message });
            throw err;
        }
    }, []);

    const deleteCache = useCallback(async (key) => {
        try {
            setError(null);
            const count = await indexedDBService.deleteCache(key);
            return count;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', `Failed to delete cache: ${key}`, { error: err.message });
            throw err;
        }
    }, []);

    // Settings operations
    const setSetting = useCallback(async (key, value, type = 'string') => {
        try {
            setError(null);
            const id = await indexedDBService.setSetting(key, value, type);
            await indexedDBService.log('info', `Setting saved: ${key}`, { key, type });
            return id;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', `Failed to save setting: ${key}`, { error: err.message });
            throw err;
        }
    }, []);

    const getSetting = useCallback(async (key) => {
        try {
            setError(null);
            const value = await indexedDBService.getSetting(key);
            return value;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', `Failed to get setting: ${key}`, { error: err.message });
            throw err;
        }
    }, []);

    const getAllSettings = useCallback(async () => {
        try {
            setError(null);
            const settings = await indexedDBService.getAllSettings();
            return settings;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', 'Failed to get all settings', { error: err.message });
            throw err;
        }
    }, []);

    // Logging operations
    const log = useCallback(async (level, message, data = null) => {
        try {
            setError(null);
            const id = await indexedDBService.log(level, message, data);
            return id;
        } catch (err) {
            setError(err);
            console.error('Failed to log:', err);
            throw err;
        }
    }, []);

    const getLogs = useCallback(async (level = null, limit = 100) => {
        try {
            setError(null);
            const logs = await indexedDBService.getLogs(level, limit);
            return logs;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', 'Failed to get logs', { error: err.message });
            throw err;
        }
    }, []);

    // Utility operations
    const getDatabaseInfo = useCallback(async () => {
        try {
            setError(null);
            const info = await indexedDBService.getDatabaseInfo();
            return info;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', 'Failed to get database info', { error: err.message });
            throw err;
        }
    }, []);

    const exportData = useCallback(async () => {
        try {
            setError(null);
            const data = await indexedDBService.exportData();
            return data;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', 'Failed to export data', { error: err.message });
            throw err;
        }
    }, []);

    const importData = useCallback(async (importData) => {
        try {
            setError(null);
            const results = await indexedDBService.importData(importData);
            await indexedDBService.log('info', 'Data imported successfully', { results });
            return results;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', 'Failed to import data', { error: err.message });
            throw err;
        }
    }, []);

    const cleanExpiredCache = useCallback(async () => {
        try {
            setError(null);
            const count = await indexedDBService.cleanExpiredCache();
            return count;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', 'Failed to clean expired cache', { error: err.message });
            throw err;
        }
    }, []);

    const cleanOldLogs = useCallback(async (daysOld = 30) => {
        try {
            setError(null);
            const count = await indexedDBService.cleanOldLogs(daysOld);
            return count;
        } catch (err) {
            setError(err);
            await indexedDBService.log('error', 'Failed to clean old logs', { error: err.message });
            throw err;
        }
    }, []);

    return {
        // State
        isReady,
        loading,
        error,
        
        // CRUD operations
        create,
        get,
        update,
        delete: remove,
        getAll,
        
        // Cache operations
        setCache,
        getCache,
        deleteCache,
        
        // Settings operations
        setSetting,
        getSetting,
        getAllSettings,
        
        // Logging operations
        log,
        getLogs,
        
        // Utility operations
        getDatabaseInfo,
        exportData,
        importData,
        cleanExpiredCache,
        cleanOldLogs
    };
};

/**
 * Hook chuyên dụng cho Settings
 */
export const useSettings = () => {
    const { setSetting, getSetting, getAllSettings, error, loading } = useIndexedDB();
    const [settings, setSettings] = useState({});
    const [settingsLoading, setSettingsLoading] = useState(false);

    const loadSettings = useCallback(async () => {
        try {
            setSettingsLoading(true);
            const allSettings = await getAllSettings();
            const settingsObj = {};
            allSettings.forEach(setting => {
                settingsObj[setting.key] = setting.value;
            });
            setSettings(settingsObj);
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setSettingsLoading(false);
        }
    }, [getAllSettings]);

    const saveSetting = useCallback(async (key, value, type = 'string') => {
        try {
            await setSetting(key, value, type);
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (err) {
            console.error('Failed to save setting:', err);
        }
    }, [setSetting]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return {
        settings,
        loading: settingsLoading || loading,
        error,
        saveSetting,
        loadSettings
    };
};

/**
 * Hook chuyên dụng cho Cache
 */
export const useCache = () => {
    const { setCache, getCache, deleteCache, error, loading } = useIndexedDB();

    const cacheData = useCallback(async (key, data, ttlMinutes = 60) => {
        try {
            await setCache(key, data, ttlMinutes);
        } catch (err) {
            console.error('Failed to cache data:', err);
        }
    }, [setCache]);

    const getCachedData = useCallback(async (key) => {
        try {
            return await getCache(key);
        } catch (err) {
            console.error('Failed to get cached data:', err);
            return null;
        }
    }, [getCache]);

    const removeCachedData = useCallback(async (key) => {
        try {
            await deleteCache(key);
        } catch (err) {
            console.error('Failed to remove cached data:', err);
        }
    }, [deleteCache]);

    return {
        cacheData,
        getCachedData,
        removeCachedData,
        loading,
        error
    };
};

export default useIndexedDB;
