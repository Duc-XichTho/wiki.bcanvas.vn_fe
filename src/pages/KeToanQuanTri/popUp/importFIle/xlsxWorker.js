import * as XLSX from 'xlsx';

export async function processExcelChunk(data) {
    try {
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Get the range of the worksheet
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Get headers (first row)
        const headers = [];
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cell = worksheet[XLSX.utils.encode_cell({r: 0, c: C})];
            headers.push(cell ? cell.v : '');
        }
        
        // Get data rows
        const rows = [];
        for (let R = 1; R <= range.e.r; R++) {
            const row = [];
            for (let C = 0; C <= range.e.c; C++) {
                const cell = worksheet[XLSX.utils.encode_cell({r: R, c: C})];
                row.push(cell ? cell.v : '');
            }
            if (row.some(cell => cell !== '')) { // Only add non-empty rows
                rows.push(row);
            }
        }

        return {
            headers: headers.filter(header => header && header.trim() !== ''),
            data: rows,
            totalRows: rows.length
        };
    } catch (error) {
        console.error('Worker error:', error);
        throw new Error(`Error processing Excel file: ${error.message}`);
    }
}