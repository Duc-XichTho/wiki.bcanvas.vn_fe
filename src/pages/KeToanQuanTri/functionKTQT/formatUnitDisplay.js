/**
 * Format số theo đơn vị hiển thị
 * @param {number} value - Giá trị cần format
 * @param {string} unitDisplay - 'thousand' hoặc 'million'
 * @returns {string} - Chuỗi đã được format
 */
export function formatUnitDisplay(value, unitDisplay) {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
        return '';
    }
    
    if (unitDisplay === 'thousand') {
        // Hiển thị theo nghìn, không lấy số thập phân
        return Math.round(numValue / 1000).toLocaleString('vi-VN');
    } else if (unitDisplay === 'million') {
        // Hiển thị theo triệu, lấy 2 số thập phân
        const millionValue = numValue / 1000000;
        return millionValue.toLocaleString('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    return numValue.toLocaleString('vi-VN');
}

/**
 * Format số theo đơn vị hiển thị với đơn vị
 * @param {number} value - Giá trị cần format
 * @param {string} unitDisplay - 'thousand' hoặc 'million'
 * @returns {string} - Chuỗi đã được format với đơn vị
 */
export function formatUnitDisplayWithUnit(value, unitDisplay) {
    const formattedValue = formatUnitDisplay(value, unitDisplay);
    if (!formattedValue) return '';
    
    if (unitDisplay === 'thousand') {
        return `${formattedValue}K`;
    } else if (unitDisplay === 'million') {
        return `${formattedValue}M`;
    }
    
    return formattedValue;
}
