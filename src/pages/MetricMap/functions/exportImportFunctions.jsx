import instance from '../../../apis/axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/metric-map';
const URL = BASE_URL + SUB_URL;

/**
 * Export Metric Map data to file
 * @param {string} format - Export format (json, csv, xlsx)
 * @param {Object} params - Export parameters
 * @returns {Promise<Object>} Result object
 */
export const exportMetricMapData = async (format = 'json', params = {}) => {
    try {
        const response = await instance.get(URL + '/export', {
            params: { format, ...params },
            responseType: format === 'json' ? 'json' : 'blob'
        });
        
        if (response.data.success) {
            // Create and download file
            const blob = new Blob([
                typeof response.data.data === 'string' 
                    ? response.data.data 
                    : JSON.stringify(response.data.data, null, 2)
            ], {
                type: format === 'json' ? 'application/json' : 'text/plain'
            });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `metric-map-data.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return { 
                success: true, 
                message: `Dữ liệu đã được xuất thành công với định dạng ${format.toUpperCase()}` 
            };
        } else {
            throw new Error(response.data.message || 'Failed to export data');
        }
    } catch (error) {
        console.error('Lỗi khi xuất dữ liệu Metric Map:', error);
        return { 
            success: false, 
            error: error.message || 'Lỗi khi xuất dữ liệu' 
        };
    }
};

/**
 * Import Metric Map data from file
 * @param {File} file - File to import
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Result object
 */
export const importMetricMapData = async (file, options = {}) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add options to form data
        Object.keys(options).forEach(key => {
            formData.append(key, options[key]);
        });

        const response = await instance.post(URL + '/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        if (response.data.success) {
            return { 
                success: true, 
                data: response.data.data,
                message: 'Dữ liệu đã được nhập thành công' 
            };
        } else {
            throw new Error(response.data.message || 'Failed to import data');
        }
    } catch (error) {
        console.error('Lỗi khi nhập dữ liệu Metric Map:', error);
        return { 
            success: false, 
            error: error.message || 'Lỗi khi nhập dữ liệu' 
        };
    }
};

/**
 * Export specific category data
 * @param {number} categoryId - Business category ID
 * @param {string} format - Export format
 * @returns {Promise<Object>} Result object
 */
export const exportCategoryData = async (categoryId, format = 'json') => {
    try {
        const params = { categoryId };
        return await exportMetricMapData(format, params);
    } catch (error) {
        console.error('Lỗi khi xuất dữ liệu category:', error);
        return { 
            success: false, 
            error: error.message || 'Lỗi khi xuất dữ liệu category' 
        };
    }
};

/**
 * Export KPI data only
 * @param {string} format - Export format
 * @returns {Promise<Object>} Result object
 */
export const exportKPIData = async (format = 'json') => {
    try {
        const params = { type: 'kpi' };
        return await exportMetricMapData(format, params);
    } catch (error) {
        console.error('Lỗi khi xuất dữ liệu KPI:', error);
        return { 
            success: false, 
            error: error.message || 'Lỗi khi xuất dữ liệu KPI' 
        };
    }
};

/**
 * Export Measure data only
 * @param {string} format - Export format
 * @returns {Promise<Object>} Result object
 */
export const exportMeasureData = async (format = 'json') => {
    try {
        const params = { type: 'measure' };
        return await exportMetricMapData(format, params);
    } catch (error) {
        console.error('Lỗi khi xuất dữ liệu Measure:', error);
        return { 
            success: false, 
            error: error.message || 'Lỗi khi xuất dữ liệu Measure' 
        };
    }
};

/**
 * Validate import file
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateImportFile = (file) => {
    const allowedTypes = [
        'application/json',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!file) {
        return { 
            valid: false, 
            error: 'Vui lòng chọn file để nhập' 
        };
    }
    
    if (!allowedTypes.includes(file.type)) {
        return { 
            valid: false, 
            error: 'Định dạng file không được hỗ trợ. Vui lòng chọn file JSON, CSV hoặc Excel' 
        };
    }
    
    if (file.size > maxSize) {
        return { 
            valid: false, 
            error: 'Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB' 
        };
    }
    
    return { valid: true };
};
