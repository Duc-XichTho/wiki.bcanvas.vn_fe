import * as XLSX from 'xlsx';

// Parse CSV file
const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return data;
};

// Parse Excel file
const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

// Main function to parse uploaded files
export const parseUploadedFiles = async (files) => {
    const parsedData = {};
    
    for (let file of files) {
        try {
            let data;
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            if (fileExtension === 'csv') {
                // Parse CSV
                const csvText = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });
                data = parseCSV(csvText);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                // Parse Excel
                data = await parseExcel(file);
            } else {
                throw new Error(`Định dạng file không được hỗ trợ: ${fileExtension}`);
            }
            
            // Clean table name (remove special characters and file extension)
            const cleanTableName = fileName
                .replace(/\.[^/.]+$/, '') // Remove file extension
                .replace(/[:\\/\?\*\[\]]/g, '_') // Replace special characters
                .replace(/\s+/g, '_') // Replace spaces with underscore
                .replace(/_+/g, '_') // Remove multiple underscores
                .replace(/^_|_$/g, '') // Remove leading/trailing underscores
                .substring(0, 50); // Limit length
            
            // Ensure unique table name
            let finalTableName = cleanTableName;
            let counter = 1;
            while (parsedData[finalTableName]) {
                finalTableName = `${cleanTableName}_${counter}`;
                counter++;
            }
            
            parsedData[finalTableName] = data;
            
        } catch (error) {
            console.error(`Error parsing file ${file.name}:`, error);
            throw new Error(`Lỗi khi xử lý file ${file.name}: ${error.message}`);
        }
    }
    
    return parsedData;
};

// Validate uploaded data format
export const validateUploadedData = (data) => {
    if (!data || typeof data !== 'object') {
        throw new Error('Dữ liệu không hợp lệ');
    }
    
    const tableNames = Object.keys(data);
    if (tableNames.length === 0) {
        throw new Error('Không có dữ liệu để phân tích');
    }
    
    for (let tableName of tableNames) {
        const tableData = data[tableName];
        if (!Array.isArray(tableData) || tableData.length === 0) {
            throw new Error(`Bảng ${tableName} không có dữ liệu`);
        }
        
        // Check if all rows have consistent structure
        const firstRowKeys = Object.keys(tableData[0] || {});
        if (firstRowKeys.length === 0) {
            throw new Error(`Bảng ${tableName} không có cột nào`);
        }
    }
    
    return true;
}; 