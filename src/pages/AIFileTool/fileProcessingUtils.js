// File Processing Utilities for AI File Tool

/**
 * Process file content based on configuration
 * @param {File} file - The file to process
 * @param {Object} config - Processing configuration
 * @returns {Promise<Array>} Array of processed chunks
 */
export const processFileContent = async (file, config) => {
    const content = await readFileContent(file);
    let processedContent = content;

    // Apply text transformations
    if (config.useTrim) {
        processedContent = processedContent.trim();
    }
    if (config.useLowerCase) {
        processedContent = processedContent.toLowerCase();
    }

    // Split content based on method
    switch (config.splitMethod) {
        case 'chunk':
            return splitByChunk(processedContent, config);
        case 'page':
            return splitByPage(processedContent, config);
        case 'character':
            return splitByCharacter(processedContent, config);
        default:
            return [processedContent];
    }
};

/**
 * Read file content as text
 * @param {File} file - The file to read
 * @returns {Promise<string>} File content as string
 */
const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
};

/**
 * Split content by character count with overlap
 * @param {string} content - Content to split
 * @param {Object} config - Configuration with chunkSize and overlapSize
 * @returns {Array} Array of chunks
 */
const splitByChunk = (content, config) => {
    const { chunkSize, overlapSize } = config;
    const chunks = [];
    let start = 0;

    while (start < content.length) {
        const end = Math.min(start + chunkSize, content.length);
        let chunk = content.slice(start, end);

        // Try to break at word boundary if not at end
        if (end < content.length) {
            const lastSpaceIndex = chunk.lastIndexOf(' ');
            if (lastSpaceIndex > chunkSize * 0.8) { // Only break at word if it's not too short
                chunk = chunk.slice(0, lastSpaceIndex);
                start = start + lastSpaceIndex + 1;
            } else {
                start = end;
            }
        } else {
            start = end;
        }

        chunks.push({
            content: chunk,
            start: start - chunk.length,
            end: start,
            method: 'chunk'
        });

        // Move start position with overlap
        start = start - overlapSize;
    }

    return chunks;
};

/**
 * Split content by page count (approximate)
 * @param {string} content - Content to split
 * @param {Object} config - Configuration with pageSize
 * @returns {Array} Array of page chunks
 */
const splitByPage = (content, config) => {
    const { pageSize } = config;
    const lines = content.split('\n');
    const linesPerPage = 50; // Approximate lines per page
    const totalPages = Math.ceil(lines.length / linesPerPage);
    const pagesPerChunk = Math.min(pageSize, totalPages);
    
    const chunks = [];
    
    for (let i = 0; i < totalPages; i += pagesPerChunk) {
        const startPage = i;
        const endPage = Math.min(i + pagesPerChunk, totalPages);
        const startLine = startPage * linesPerPage;
        const endLine = endPage * linesPerPage;
        
        const chunkLines = lines.slice(startLine, endLine);
        const chunk = chunkLines.join('\n');
        
        chunks.push({
            content: chunk,
            startPage,
            endPage,
            startLine,
            endLine,
            method: 'page'
        });
    }

    return chunks;
};

/**
 * Split content by specific character
 * @param {string} content - Content to split
 * @param {Object} config - Configuration with splitCharacter
 * @returns {Array} Array of character-split chunks
 */
const splitByCharacter = (content, config) => {
    const { splitCharacter } = config;
    const parts = content.split(splitCharacter);
    
    return parts.map((part, index) => ({
        content: part,
        index,
        splitCharacter,
        method: 'character'
    }));
};

/**
 * Get file type information
 * @param {File} file - The file
 * @returns {Object} File type information
 */
export const getFileTypeInfo = (file) => {
    const type = file.type;
    const extension = file.name.split('.').pop().toLowerCase();
    
    const typeMap = {
        'text/plain': { icon: '📄', category: 'text' },
        'text/csv': { icon: '📊', category: 'data' },
        'application/pdf': { icon: '📕', category: 'document' },
        'application/msword': { icon: '📘', category: 'document' },
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📘', category: 'document' },
        'application/vnd.ms-excel': { icon: '📗', category: 'spreadsheet' },
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📗', category: 'spreadsheet' },
        'text/html': { icon: '🌐', category: 'web' },
        'application/json': { icon: '🔧', category: 'data' },
        'text/xml': { icon: '🔧', category: 'data' }
    };

    return typeMap[type] || { icon: '📄', category: 'unknown' };
};

/**
 * Validate file for processing
 * @param {File} file - The file to validate
 * @returns {Object} Validation result
 */
export const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'text/plain', // .txt files
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx files
    ];

    const errors = [];

    if (file.size > maxSize) {
        errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`);
    }

    if (!allowedTypes.includes(file.type)) {
        errors.push(`Chỉ hỗ trợ file .docx và .txt. File type (${file.type}) không được hỗ trợ`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Estimate processing time based on content size and configuration
 * @param {string} content - Content to process
 * @param {Object} config - Processing configuration
 * @returns {number} Estimated time in seconds
 */
export const estimateProcessingTime = (content, config) => {
    const baseTimePerChunk = 2; // seconds
    const chunks = processFileContent({ content }, config);
    return chunks.length * baseTimePerChunk;
};

/**
 * Generate processing summary
 * @param {Array} chunks - Processed chunks
 * @param {Object} config - Processing configuration
 * @returns {Object} Processing summary
 */
export const generateProcessingSummary = (chunks, config) => {
    const totalChunks = chunks.length;
    const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
    const averageChunkSize = Math.round(totalCharacters / totalChunks);
    
    return {
        totalChunks,
        totalCharacters,
        averageChunkSize,
        splitMethod: config.splitMethod,
        estimatedTime: estimateProcessingTime('', config)
    };
};
