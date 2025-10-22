import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/step-export';
const URL = BASE_URL + SUB_URL;

/**
 * Lấy thông tin preview trước khi export
 * @param {string} templateId - ID của template
 * @param {string} stepId - ID của step
 * @returns {Promise<Object>} - Thông tin preview
 */
export const getStepExportPreview = async (templateId, stepId) => {
    try {
        const response = await instance.get(`${URL}/preview/${templateId}/${stepId}`);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin preview export:', error);
        throw error;
    }
};

/**
 * Export dữ liệu step thành file Excel
 * @param {string} templateId - ID của template
 * @param {string} stepId - ID của step
 * @param {string} fileName - Tên file (optional)
 * @returns {Promise<void>}
 */
export const exportStepDataToExcel = async (templateId, stepId, fileName = null) => {
    try {
        console.log(`🚀 exportStepDataToExcel - Starting export for template ${templateId}, step ${stepId}`);
        
        const response = await instance.get(`${URL}/${templateId}/${stepId}`, {
            responseType: 'blob', // Quan trọng: phải set responseType là 'blob' để nhận file binary
        });

        // Tạo URL cho file blob
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        // Tạo tên file nếu không được cung cấp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const finalFileName = fileName || `step_${stepId}_data_${timestamp}.xlsx`;
        
        // Tạo link download
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = finalFileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        console.log(`✅ exportStepDataToExcel - Successfully downloaded ${finalFileName}`);
        
        return {
            success: true,
            fileName: finalFileName,
            message: 'Tải xuống thành công!'
        };
        
    } catch (error) {
        console.error('❌ exportStepDataToExcel - Error:', error);
        
        // Xử lý lỗi từ server
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        
        throw new Error('Lỗi khi tải xuống file Excel: ' + error.message);
    }
};

/**
 * Kiểm tra xem có thể export step không
 * @param {string} templateId - ID của template
 * @param {string} stepId - ID của step
 * @returns {Promise<boolean>} - True nếu có thể export
 */
export const canExportStep = async (templateId, stepId) => {
    try {
        const preview = await getStepExportPreview(templateId, stepId);
        return preview.success && preview.data.totalRows > 0;
    } catch (error) {
        console.error('Lỗi khi kiểm tra khả năng export:', error);
        return false;
    }
};

export default {
    getStepExportPreview,
    exportStepDataToExcel,
    canExportStep
};
