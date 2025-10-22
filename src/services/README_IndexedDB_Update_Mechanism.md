# IndexedDB Update Mechanism - Cơ chế cập nhật dữ liệu

## Tổng quan

Tài liệu này mô tả cơ chế cập nhật dữ liệu cho IndexedDB trong hệ thống BCanvas, bao gồm các chiến lược cache, invalidation, và synchronization.

## Cấu trúc Database

### Schema hiện tại:
```javascript
db.version(1).stores({
    data: '++id, key, value, createdAt, updatedAt',
    cache: '++id, key, data, expiresAt, createdAt',
    settings: '++id, key, value, type, updatedAt',
    logs: '++id, level, message, data, timestamp',
    soKeToan: '++id, updateAt, isPending'
});
```

## Cơ chế cập nhật dữ liệu

### 1. TemplateRow Cache Update Strategy

#### Cache Key Format:
```
templateRow_{id_template}_{id_version}_{page}_{pageSize}
```

#### Per-Page Cache Strategy (Phân trang và lưu theo trang)
- Dữ liệu lớn (200k–300k dòng) sẽ được tải theo nhiều trang (mặc định pageSize = 5000) và lưu cache theo từng trang để tránh quá tải bộ nhớ và tăng độ ổn định.
- Các trang được lưu độc lập theo cache key phía trên. Không lưu một “bản ghép khổng lồ” trong IndexedDB.
- Khi hiển thị, dữ liệu được ghép lại trong bộ nhớ tạm thời (RAM) từ nhiều trang đã cache.

#### Update Triggers:
- **Manual Refresh**: User click refresh button
- **Force Refresh**: `forceRefresh = true` parameter
- **TTL Expiry (Centralized)**: TTL mặc định 24 giờ (1440 phút), quản lý tập trung trong `templateRowCacheService` qua `getDefaultTTL()`/`setDefaultTTL()` và export `TEMPLATE_ROW_CACHE_TTL`
- **Version Change**: Khi user chọn version khác
- **Template Change**: Khi user chọn template khác

#### Update Flow:
```javascript
// 1. Kiểm tra cache có tồn tại và còn hạn không
const cachedData = await indexedDBService.getCache(cacheKey);

if (cachedData && !isExpired) {
    return cachedData; // Sử dụng cache
}

// 2. Nếu cache không có hoặc hết hạn, gọi API
const freshData = await getTemplateRow(idTemplate, idVersion, page, pageSize);

// 3. Lưu dữ liệu mới vào cache
await indexedDBService.setCache(cacheKey, freshData, ttlMinutes /* nên dùng TEMPLATE_ROW_CACHE_TTL */);

// 4. Trả về dữ liệu mới
return freshData;
```

### 2. Cache Invalidation Strategies

#### A. Time-based Invalidation (TTL)
```javascript
// TTL mặc định 24 giờ (quản lý tại service)
await indexedDBService.setCache(key, data, TEMPLATE_ROW_CACHE_TTL);

// Kiểm tra hết hạn khi lấy cache
const cacheRecord = await indexedDBService.getCache(key);
if (new Date() > cacheRecord.expiresAt) {
    // Cache đã hết hạn, xóa và gọi API mới
    await indexedDBService.deleteCache(key);
    return await fetchFreshData();
}
```

#### B. Manual Invalidation
```javascript
// Xóa cache cho một template cụ thể
await clearTemplateCache(idTemplate, idVersion);

// Xóa tất cả cache
await clearAllTemplateCache();

// Xóa cache hết hạn
await cleanExpiredCache();
```

#### C. Event-based Invalidation
```javascript
// Khi user thay đổi settings
const handleSettingsChange = async () => {
    await clearAllTemplateCache();
    // Reload data với settings mới
    await loadTableData();
};

// Khi user thay đổi version - PRESERVE CACHE CHO TẤT CẢ VERSIONS
const handleVersionChange = async (newVersion) => {
    // KHÔNG xóa cache của version cũ - preserve cache cho tất cả versions
    // Chỉ preload cache cho version mới được chọn
    await preloadApprovedVersionsCache([newVersion]); // dùng TTL mặc định từ service
    console.log('Cache preserved for all versions, preloaded for new version:', newVersion.id);
};

// Preserve cache cho tất cả versions
const preserveCacheForAllVersions = async () => {
    const requests = approvedVersions.map(version => ({
        idTemplate: version.id_template,
        idVersion: version.id_version,
        page: 1,
        pageSize: 500000 // preload mặc định full-size cho trải nghiệm tốt
    }));
    
    const result = await getMultipleTemplateRows(requests, false);
    console.log('Cache preserved for all versions:', result);
    return result;
};
```

### 3. Data Synchronization

#### A. Optimistic Updates
```javascript
// Cập nhật UI ngay lập tức, sync với server sau
const updateDataOptimistically = async (newData) => {
    // 1. Cập nhật UI ngay
    setTableData(newData);
    
    // 2. Cập nhật cache
    await indexedDBService.setCache(cacheKey, newData, 60);
    
    // 3. Sync với server (background)
    try {
        await syncWithServer(newData);
    } catch (error) {
        // Rollback nếu sync fail
        await rollbackData();
    }
};
```

#### B. Background Sync
```javascript
// Sync dữ liệu trong background
const backgroundSync = async () => {
    const staleCacheKeys = await getStaleCacheKeys();
    
    for (const key of staleCacheKeys) {
        try {
            const freshData = await fetchFreshData(key);
            await indexedDBService.setCache(key, freshData, TEMPLATE_ROW_CACHE_TTL);
        } catch (error) {
            console.warn('Background sync failed for key:', key);
        }
    }
};

// Chạy background sync mỗi 30 phút
setInterval(backgroundSync, 30 * 60 * 1000);
```

### 4. Conflict Resolution

#### A. Last-Write-Wins
```javascript
const updateWithConflictResolution = async (key, newData) => {
    const existingData = await indexedDBService.get(key);
    
    if (existingData && existingData.updatedAt > newData.updatedAt) {
        // Server data is newer, keep server data
        return existingData;
    } else {
        // Local data is newer or equal, update
        await indexedDBService.update(key, {
            ...newData,
            updatedAt: new Date()
        });
        return newData;
    }
};
```

#### B. Merge Strategy
```javascript
const mergeData = (localData, serverData) => {
    return {
        ...localData,
        ...serverData,
        // Merge arrays
        rows: [...(localData.rows || []), ...(serverData.rows || [])],
        // Keep latest timestamp
        updatedAt: new Date()
    };
};
```

## Multi-Version Cache Management

### 1. Preserve Cache cho Multiple Versions

#### A. Cache Key Strategy
```javascript
// Mỗi version có cache key riêng biệt
const cacheKey1 = `templateRow_1_1_1_50`; // Template 1, Version 1
const cacheKey2 = `templateRow_1_2_1_50`; // Template 1, Version 2
const cacheKey3 = `templateRow_2_1_1_50`; // Template 2, Version 1

// Cache được preserve độc lập cho từng version
```

#### B. Version Change Strategy
```javascript
const handleVersionChange = async (newVersion) => {
    // KHÔNG xóa cache của version cũ
    // Chỉ preload cache cho version mới nếu chưa có
    try {
        const cacheExists = await hasTemplateCache(
            newVersion.id_template, 
            newVersion.id_version, 
            1, 
            50
        );
        
        if (!cacheExists) {
            await preloadApprovedVersionsCache([newVersion]);
            console.log('Cache preloaded for new version:', newVersion.id);
        } else {
            console.log('Cache already exists for version:', newVersion.id);
        }
    } catch (error) {
        console.warn('Cache preload failed for version:', newVersion.id, error);
    }
};
```

#### C. Preserve All Versions Cache
```javascript
const preserveCacheForAllVersions = async () => {
    try {
        const requests = approvedVersions.map(version => ({
            idTemplate: version.id_template,
            idVersion: version.id_version,
            page: 1,
            pageSize: 500000
        }));

        const result = await getMultipleTemplateRows(requests, false);
        
        console.log('Cache preserved for all versions:', {
            successful: result.successful.length,
            failed: result.failed.length,
            total: result.total
        });

        return result;
    } catch (error) {
        console.error('Error preserving cache for all versions:', error);
        return null;
    }
};
```

#### D. Cache Status Monitoring
```javascript
const getCacheStatusForAllVersions = async () => {
    const status = {};
    
    for (const version of approvedVersions) {
        const cacheExists = await hasTemplateCache(
            version.id_template, 
            version.id_version, 
            1, 
            500000
        );
        
        const cacheInfo = await getCacheInfo(
            version.id_template, 
            version.id_version, 
            1, 
            500000
        );
        
        status[`${version.id_template}_${version.id_version}`] = {
            exists: cacheExists,
            info: cacheInfo,
            version: version
        };
    }
    
    return status;
};
```

### 2. Cache Persistence Strategy

#### A. Independent Cache per Version
```javascript
// Cache được lưu độc lập cho từng version
const version1Cache = await getTemplateRowWithCache(1, 1, false, 1, 500000, TEMPLATE_ROW_CACHE_TTL);
const version2Cache = await getTemplateRowWithCache(1, 2, false, 1, 500000, TEMPLATE_ROW_CACHE_TTL);

// Chuyển đổi giữa versions không ảnh hưởng đến cache của nhau
```

#### B. Smart Cache Loading
```javascript
const smartLoadData = async (version) => {
    // 1. Kiểm tra cache có tồn tại không
    const cacheExists = await hasTemplateCache(
        version.id_template, 
        version.id_version, 
        1, 
        50
    );
    
    if (cacheExists) {
        // 2. Sử dụng cache nếu có
        return await getTemplateRowWithCache(
            version.id_template, 
            version.id_version, 
            false, 
            1, 
            50, 
            60
        );
    } else {
        // 3. Load từ API và cache lại
        const data = await getTemplateRowWithCache(
            version.id_template, 
            version.id_version, 
            false, 
            1, 
            50, 
            60
        );
        
        console.log('Data loaded and cached for version:', version.id);
        return data;
    }
};
```

#### C. Background Cache Warming
```javascript
const warmCacheForAllVersions = async () => {
    const promises = approvedVersions.map(async (version) => {
        try {
            // Preload cache cho version này
            await getTemplateRowWithCache(
                version.id_template, 
                version.id_version, 
                false, 
                1, 
                500000, 
                TEMPLATE_ROW_CACHE_TTL
            );
            console.log('Cache warmed for version:', version.id);
        } catch (error) {
            console.warn('Failed to warm cache for version:', version.id, error);
        }
    });
    
    await Promise.allSettled(promises);
    console.log('Cache warming completed for all versions');
};
```

## Update Patterns

### 1. Read-Through Cache
```javascript
const readThroughCache = async (key, fetchFunction) => {
    // 1. Kiểm tra cache
    let data = await indexedDBService.getCache(key);
    
    if (!data) {
        // 2. Cache miss, fetch từ source
        data = await fetchFunction();
        
        // 3. Lưu vào cache
        await indexedDBService.setCache(key, data, TEMPLATE_ROW_CACHE_TTL);
    }
    
    return data;
};
```

### 2. Write-Through Cache
```javascript
const writeThroughCache = async (key, data) => {
    // 1. Cập nhật cache
    await indexedDBService.setCache(key, data, TEMPLATE_ROW_CACHE_TTL);
    
    // 2. Cập nhật source (API)
    await updateSource(key, data);
};
```

### 3. Write-Behind Cache
```javascript
const writeBehindCache = async (key, data) => {
    // 1. Cập nhật cache ngay lập tức
    await indexedDBService.setCache(key, data, TEMPLATE_ROW_CACHE_TTL);
    
    // 2. Queue để sync với server sau
    await queueForSync(key, data);
};
```

### 4. Refresh-Ahead Cache
```javascript
const refreshAheadCache = async (key, fetchFunction) => {
    const cacheRecord = await indexedDBService.getCacheInfo(key);
    
    if (cacheRecord && cacheRecord.isExpired) {
        // Cache hết hạn, refresh trong background
        setTimeout(async () => {
            const freshData = await fetchFunction();
            await indexedDBService.setCache(key, freshData, TEMPLATE_ROW_CACHE_TTL);
        }, 0);
    }
    
    // Trả về cache hiện tại (có thể stale)
    return await indexedDBService.getCache(key);
};
```

## Performance Optimization

### 1. Batch Updates
```javascript
const batchUpdate = async (updates) => {
    const transaction = indexedDBService.db.transaction(['cache'], 'readwrite');
    
    for (const update of updates) {
        await transaction.cache.put(update);
    }
    
    await transaction.complete;
};
```

### 2. Lazy Loading
```javascript
const lazyLoadData = async (key, fetchFunction) => {
    // Chỉ load khi cần thiết
    if (isDataNeeded(key)) {
        return await readThroughCache(key, fetchFunction);
    }
    return null;
};
```

### 3. Preloading
```javascript
const preloadData = async (keys, fetchFunction) => {
    const promises = keys.map(key => 
        readThroughCache(key, () => fetchFunction(key))
    );
    
    await Promise.all(promises);
};
```

## Error Handling

### 1. Cache Failure Recovery
```javascript
const getDataWithFallback = async (key, fetchFunction) => {
    try {
        // Thử lấy từ cache trước
        return await indexedDBService.getCache(key);
    } catch (cacheError) {
        console.warn('Cache failed, falling back to API:', cacheError);
        
        try {
            // Fallback về API
            const data = await fetchFunction();
            
            // Thử lưu cache lại
            try {
                await indexedDBService.setCache(key, data, TEMPLATE_ROW_CACHE_TTL);
            } catch (saveError) {
                console.warn('Failed to save to cache:', saveError);
            }
            
            return data;
        } catch (apiError) {
            console.error('Both cache and API failed:', apiError);
            throw apiError;
        }
    }
};
```

### 2. Retry Mechanism
```javascript
const retryOperation = async (operation, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            // Exponential backoff
            await new Promise(resolve => 
                setTimeout(resolve, Math.pow(2, i) * 1000)
            );
        }
    }
};
```

## Monitoring và Debugging

### 1. Cache Statistics
```javascript
const getCacheStats = async () => {
    const stats = await indexedDBService.getDatabaseInfo();
    
    return {
        totalEntries: stats.cacheCount,
        hitRate: calculateHitRate(),
        averageSize: calculateAverageSize(),
        expiredEntries: await countExpiredEntries()
    };
};
```

### 2. Cache Health Check
```javascript
const healthCheck = async () => {
    const issues = [];
    
    // Kiểm tra cache size
    const stats = await getCacheStats();
    if (stats.totalEntries > 1000) {
        issues.push('Cache size too large');
    }
    
    // Kiểm tra expired entries
    if (stats.expiredEntries > 100) {
        issues.push('Too many expired entries');
    }
    
    // Kiểm tra hit rate
    if (stats.hitRate < 0.5) {
        issues.push('Low cache hit rate');
    }
    
    return {
        healthy: issues.length === 0,
        issues
    };
};
```

### 3. Debug Logging
```javascript
const debugCache = async (key) => {
    const cacheInfo = await indexedDBService.getCacheInfo(key);
    const stats = await getCacheStats();
    
    console.log('Cache Debug Info:', {
        key,
        exists: !!cacheInfo,
        expired: cacheInfo?.isExpired,
        size: cacheInfo?.dataSize,
        createdAt: cacheInfo?.createdAt,
        expiresAt: cacheInfo?.expiresAt,
        globalStats: stats
    });
};
```

## Best Practices

### 1. Cache Key Design
- Sử dụng consistent naming convention
- Include version information
- Avoid special characters
- Keep keys descriptive but concise

### 2. TTL Strategy
- Short TTL cho data thường xuyên thay đổi (5-15 phút)
- Medium TTL cho data ít thay đổi (30-60 phút)
- Long TTL cho static data (24 giờ)

### 3. Memory Management
- Regular cleanup expired entries
- Monitor cache size
- Implement cache eviction policies
- Use compression for large data

### 4. Error Handling
- Always have fallback mechanisms
- Log cache errors for debugging
- Implement retry logic
- Graceful degradation

### 5. Multi-Version Cache Best Practices
- **Preserve cache cho tất cả versions** - không xóa cache khi chuyển version
- **Independent cache keys** - mỗi version có cache key riêng biệt
- **Smart preloading** - chỉ preload khi cần thiết
- **Cache status monitoring** - theo dõi cache status cho tất cả versions
- **Background warming** - warm cache cho tất cả versions trong background
- **Selective invalidation** - chỉ invalidate khi thực sự cần thiết

## Implementation Examples

### 1. TemplateRow Cache với Multi-Version Support
```javascript
const templateRowCache = {
    async get(idTemplate, idVersion, page, pageSize) {
        const key = `templateRow_${idTemplate}_${idVersion}_${page}_${pageSize}`;
        
        return await getDataWithFallback(key, async () => {
            return await getTemplateRow(idTemplate, idVersion, page, pageSize);
        });
    },
    
    // Chỉ invalidate khi thực sự cần thiết (settings change, data corruption)
    async invalidate(idTemplate, idVersion) {
        const pattern = `templateRow_${idTemplate}_${idVersion}_`;
        await clearCacheByPattern(pattern);
    },
    
    // Preload cho tất cả versions - preserve cache
    async preload(approvedVersions) {
        const requests = approvedVersions.map(v => ({
            idTemplate: v.id_template,
            idVersion: v.id_version,
            page: 1,
            pageSize: 50
        }));
        
        const result = await getMultipleTemplateRows(requests, false, 60);
        console.log('Preloaded cache for all versions:', {
            successful: result.successful.length,
            failed: result.failed.length
        });
        return result;
    },
    
    // Kiểm tra cache status cho tất cả versions
    async getCacheStatus(approvedVersions) {
        const status = {};
        
        for (const version of approvedVersions) {
            const cacheExists = await hasTemplateCache(
                version.id_template, 
                version.id_version, 
                1, 
                50
            );
            
            status[`${version.id_template}_${version.id_version}`] = {
                exists: cacheExists,
                version: version
            };
        }
        
        return status;
    },
    
    // Smart load - chỉ load khi cần thiết
    async smartLoad(version, page = 1, pageSize = 50) {
        const cacheExists = await hasTemplateCache(
            version.id_template, 
            version.id_version, 
            page, 
            pageSize
        );
        
        if (cacheExists) {
            console.log('Using existing cache for version:', version.id);
            return await this.get(version.id_template, version.id_version, page, pageSize);
        } else {
            console.log('Loading and caching new data for version:', version.id);
            return await this.get(version.id_template, version.id_version, page, pageSize);
        }
    }
};
```

### 2. Tải toàn bộ dữ liệu với tiến độ (phân trang + gộp trong RAM)
```javascript
// Helper mới trong utils: getAllTemplateRowsWithProgress(tableId, version, options)
// - Tải trang 1 để biết count
// - Lặp trang 2..N tới khi đủ count (mặc định pageSize = 5000)
// - Gọi onProgress({ fetched, total, percent }) mỗi trang
// - Trả về { rows, count } với rows đã gộp (map sang row.data)

const { rows, count } = await getAllTemplateRowsWithProgress(
    idTemplate,
    idVersion,
    {
        pageSize: 5000,
        onProgress: ({ fetched, total, percent }) => {
            console.log(`Đang tải: ${fetched}/${total} (${percent}%)`);
        }
    }
);

// Lưu ý: Cache IndexedDB vẫn lưu theo từng trang (per-page). Việc gộp là trong RAM khi hiển thị/processing.
```

### 2. Settings Cache với Persistence
```javascript
const settingsCache = {
    async get(key) {
        let setting = await indexedDBService.getSetting(key);
        
        if (!setting) {
            // Load từ server
            setting = await loadSettingFromServer(key);
            await indexedDBService.setSetting(key, setting.value, setting.type);
        }
        
        return setting.value;
    },
    
    async set(key, value, type = 'string') {
        // Cập nhật cache
        await indexedDBService.setSetting(key, value, type);
        
        // Sync với server
        await saveSettingToServer(key, value, type);
    }
};
```

## Kết luận

Cơ chế cập nhật dữ liệu IndexedDB trong BCanvas được thiết kế để:

1. **Tối ưu performance** thông qua intelligent caching với multi-version support
2. **Preserve cache cho tất cả versions** - không reset cache khi chuyển version
3. **Đảm bảo data consistency** với conflict resolution
4. **Cung cấp fallback mechanisms** khi cache fail
5. **Monitor và debug** cache performance cho tất cả versions
6. **Scale efficiently** với batch operations và independent cache keys

### Key Benefits của Multi-Version Cache:

- ✅ **Instant switching** giữa các versions (cache đã có sẵn)
- ✅ **Reduced API calls** - không cần gọi API lại khi chuyển version
- ✅ **Better UX** - user experience mượt mà hơn
- ✅ **Efficient memory usage** - cache được quản lý thông minh
- ✅ **Scalable architecture** - dễ dàng mở rộng cho nhiều templates/versions

Hệ thống cache được tích hợp seamlessly vào BusinessMeasurementTab và có thể được sử dụng ở bất kỳ đâu trong ứng dụng khi cần lấy dữ liệu theo template và version.
