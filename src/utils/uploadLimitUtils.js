import { getSettingByType } from '../apis/settingService.jsx';

/**
 * Kiểm tra giới hạn upload dựa trên cấu hình hệ thống
 * @param {Array} columns - Mảng các cột
 * @param {Array} data - Mảng dữ liệu (optional, để kiểm tra số dòng)
 * @returns {Promise<{isValid: boolean, message: string, limits: {max_record: number, max_column: number}}>}
 */
export const checkUploadLimits = async (columns = [], data = []) => {
  try {
    // Lấy cấu hình giới hạn từ hệ thống
    const limitConfig = await getSettingByType('LIMIT_UPLOAD_SIZE_CONFIG');
    
    let maxRecord = 50000; // Giá trị mặc định
    let maxColumn = 25;    // Giá trị mặc định
    
    if (limitConfig && limitConfig.setting) {
      maxRecord = limitConfig.setting.max_record || 50000;
      maxColumn = limitConfig.setting.max_column || 25;
    }
    
    const currentColumnCount = columns.length;
    const currentRecordCount = data.length;
    
    // Kiểm tra số cột
    if (currentColumnCount > maxColumn) {
      return {
        isValid: false,
        message: `Số cột (${currentColumnCount}) vượt quá giới hạn cho phép (${maxColumn}). Vui lòng giảm số cột hoặc liên hệ quản trị viên để điều chỉnh giới hạn.`,
        limits: { max_record: maxRecord, max_column: maxColumn },
        current: { record: currentRecordCount, column: currentColumnCount }
      };
    }
    
    // Kiểm tra số dòng (nếu có dữ liệu)
    if (data.length > 0 && currentRecordCount > maxRecord) {
      return {
        isValid: false,
        message: `Số dòng (${currentRecordCount}) vượt quá giới hạn cho phép (${maxRecord}). Vui lòng giảm số dòng hoặc liên hệ quản trị viên để điều chỉnh giới hạn.`,
        limits: { max_record: maxRecord, max_column: maxColumn },
        current: { record: currentRecordCount, column: currentColumnCount }
      };
    }
    
    return {
      isValid: true,
      message: 'Dữ liệu hợp lệ',
      limits: { max_record: maxRecord, max_column: maxColumn },
      current: { record: currentRecordCount, column: currentColumnCount }
    };
    
  } catch (error) {
    console.error('Error checking upload limits:', error);
    // Nếu có lỗi khi lấy cấu hình, cho phép upload với giới hạn mặc định
    return {
      isValid: true,
      message: 'Không thể kiểm tra giới hạn, sử dụng giới hạn mặc định',
      limits: { max_record: 50000, max_column: 25 },
      current: { record: data.length, column: columns.length }
    };
  }
};

/**
 * Kiểm tra giới hạn chỉ cho số cột (không kiểm tra số dòng)
 * @param {Array} columns - Mảng các cột
 * @returns {Promise<{isValid: boolean, message: string, limits: {max_column: number}}>}
 */
export const checkColumnLimit = async (columns = []) => {
  try {
    const limitConfig = await getSettingByType('LIMIT_UPLOAD_SIZE_CONFIG');
    
    let maxColumn = 25; // Giá trị mặc định
    
    if (limitConfig && limitConfig.setting) {
      maxColumn = limitConfig.setting.max_column || 25;
    }
    
    const currentColumnCount = columns.length;
    
    if (currentColumnCount > maxColumn) {
      return {
        isValid: false,
        message: `Số cột (${currentColumnCount}) vượt quá giới hạn cho phép (${maxColumn}). Vui lòng giảm số cột hoặc liên hệ quản trị viên để điều chỉnh giới hạn.`,
        limits: { max_column: maxColumn },
        current: { column: currentColumnCount }
      };
    }
    
    return {
      isValid: true,
      message: 'Số cột hợp lệ',
      limits: { max_column: maxColumn },
      current: { column: currentColumnCount }
    };
    
  } catch (error) {
    console.error('Error checking column limit:', error);
    return {
      isValid: true,
      message: 'Không thể kiểm tra giới hạn cột',
      limits: { max_column: 25 },
      current: { column: columns.length }
    };
  }
};

