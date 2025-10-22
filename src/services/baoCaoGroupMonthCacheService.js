import { indexedDBService } from './indexedDBService.js';

class BaoCaoGroupMonthCacheService {
    constructor() {
        this.cachePrefix = 'BaoCaoGroupMonth_';
        this.cacheTTL = 60;
    }

    generateCacheKey(params) {
        const { type, currentYearKTQT, currentCompanyKTQT } = params;
        const typePart = type || 'BaoCaoGroupMonth';
        return `${this.cachePrefix}${typePart}_${currentCompanyKTQT}_${currentYearKTQT}`;
    }

    async setCache(params, data) {
        const key = this.generateCacheKey(params);
        const cacheData = {
            rowData: data.rowData,
            listUnit: data.listUnit,
            cachedAt: new Date().toISOString(),
            params
        };
        return indexedDBService.setCache(key, cacheData, this.cacheTTL);
    }

    async getCache(params) {
        const key = this.generateCacheKey(params);
        return indexedDBService.getCache(key);
    }

    async deleteCache(params) {
        const key = this.generateCacheKey(params);
        return indexedDBService.deleteCache(key);
    }

    async clearAllCache() {
        const all = await indexedDBService.db.cache.toArray();
        const keys = all.filter(c => c.key.startsWith(this.cachePrefix)).map(c => c.key);
        let deleted = 0;
        for (const k of keys) deleted += await indexedDBService.deleteCache(k);
        return deleted;
    }

    async getCacheInfo() {
        const all = await indexedDBService.db.cache.toArray();
        const entries = all.filter(c => c.key.startsWith(this.cachePrefix));
        return { totalEntries: entries.length, entries };
    }
}

const baoCaoGroupMonthCacheService = new BaoCaoGroupMonthCacheService();
export default baoCaoGroupMonthCacheService;

