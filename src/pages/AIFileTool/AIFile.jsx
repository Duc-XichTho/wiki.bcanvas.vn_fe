import React, { useState, useEffect } from 'react';
import { message, Popconfirm, Dropdown, Menu, Modal, Input, Button, List, Typography, Upload } from 'antd';
import { PlusOutlined, UploadOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';
import { marked } from 'marked';
import styles from './AIFile.module.css';
import Header from './header/Header';
// import { processFileContent } from './fileProcessingUtils'; // Sử dụng logic local thay vì import
import {
    createDataset,
    getAllDatasets,
    addFilesToDataset,
    getFilesByDatasetId,
    createBulkTranslations,
    getTranslationsByFileId,
    getTranslationsByDatasetId,
    deleteDataset,
    deleteDatasetFile,
    deleteTranslation,
    updateDataset,
    updateDatasetFile,
    updateFileProcessingConfig,
    getChunkVersions,
    deleteNewerVersions,
    updateTranslationConfig
} from '../../apis/aiDatasetService';
import { uploadFiles as uploadFilesService } from '../../apis/uploadManyFIleService';
import ConfigModal from './components/ConfigModal';
import AddFileModal from './components/AddFileModal';
import AiConfigModal from './components/AiConfigModal';
import {aiGen2} from '../../apis/botService';
import { getSettingByType } from '../../apis/settingService';
import { FileStack, Copy } from 'lucide-react';
// Copy logic xử lý file từ ConfigModal.jsx
// Memory-optimized file processing with streaming approach
const processFileContent = async (content, config) => {
    try {
        console.log('=== PROCESS FILE CONTENT START (MEMORY OPTIMIZED) ===');
        console.log('Content length:', content?.length);
        console.log('Config:', config); 
        
        // Memory limits để tránh tràn RAM
        const MAX_CONTENT_SIZE = 50 * 1024 * 1024; // 50MB
        const MAX_CHUNKS_COUNT = 10000; // Giới hạn số chunks
        const CHUNK_PROCESSING_SIZE = 1024 * 1024; // 1MB per processing batch
        
        if (content.length > MAX_CONTENT_SIZE) {
            console.warn(`File quá lớn (${(content.length / 1024 / 1024).toFixed(2)}MB). Sẽ xử lý theo từng phần để tránh tràn RAM.`);
            return await processLargeFileStreaming(content, config, CHUNK_PROCESSING_SIZE, MAX_CHUNKS_COUNT);
        }
        
        let processedContent = content;

        // Apply lowercase if enabled
        if (config.useLowerCase) {
            processedContent = processedContent.toLowerCase();
            console.log('Applied lowercase');
        }

        // Apply trim if enabled
        if (config.useTrim) {
            processedContent = processedContent.trim();
            console.log('Applied trim');
        }

        let chunks = [];
        console.log('Processed content length:', processedContent?.length);

        if (config.splitMethod === 'chunk') {
            console.log('Using CHUNK method');
            chunks = await processChunkMethod(processedContent, config, MAX_CHUNKS_COUNT);
        } else if (config.splitMethod === 'page') {
            console.log('Using PAGE method');
            chunks = await processPageMethod(processedContent, config, MAX_CHUNKS_COUNT);
        } else if (config.splitMethod === 'character') {
            console.log('Using CHARACTER method');
            chunks = await processCharacterMethod(processedContent, config, MAX_CHUNKS_COUNT);
        }

        // Kiểm tra tổng độ dài chunks TRƯỚC KHI áp dụng logic chọn đoạn
        console.log('=== PROCESS FILE CONTENT END ===');
        console.log('Final chunks count:', chunks.length);
        console.log('First chunk preview:', chunks[0]?.content?.substring(0, 100) + '...');
        
        // Kiểm tra tổng độ dài chunks
        const totalChunkLength = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
        console.log('Total chunks length:', totalChunkLength);
        console.log('Original content length:', processedContent.length);
        console.log('Length ratio:', (totalChunkLength / processedContent.length).toFixed(2));
        
        if (totalChunkLength > processedContent.length * 1.1) {
            console.warn('WARNING: Total chunks length is significantly larger than original content!');
        }

        // Áp dụng logic chọn đoạn nếu có config_for_ai
        if (config.config_for_ai && config.config_for_ai.enabled) {
            console.log('=== APPLYING AI SELECTION LOGIC ===');
            console.log('Original chunks count:', chunks.length);
            console.log('Config for AI:', config.config_for_ai);
            
            const { selectedChunks, range } = config.config_for_ai;
            
            // Ưu tiên range trước selectedChunks
            if (range && range.start && range.end) {
                console.log('Using range method');
                console.log('Range:', range);
                const slicedChunks = chunks.slice(range.start - 1, range.end);
                console.log('Sliced chunks count:', slicedChunks.length);
                
                return slicedChunks;
            } else if (selectedChunks && selectedChunks.length > 0) {
                console.log('Using selectedChunks method');
                console.log('Selected chunks:', selectedChunks);
                const filteredChunks = chunks.filter((_, index) => selectedChunks.includes(index + 1));
                console.log('Filtered chunks count:', filteredChunks.length);
                
                return filteredChunks;
            }
        }

        return chunks;
    } catch (error) {
        console.error('Error processing file content:', error);
        // Trả về một chunk duy nhất với toàn bộ nội dung nếu có lỗi
        return [{
            index: 1,
            content: content || 'Không thể xử lý nội dung file'
        }];
    }
};

// Xử lý file lớn theo streaming để tránh tràn RAM
const processLargeFileStreaming = async (content, config, batchSize, maxChunks) => {
    console.log('=== PROCESSING LARGE FILE WITH STREAMING ===');
    console.log('File size:', (content.length / 1024 / 1024).toFixed(2), 'MB');
    console.log('Batch size:', (batchSize / 1024).toFixed(2), 'KB');
    
    const chunks = [];
    let processedLength = 0;
    let chunkIndex = 1;
    const totalBatches = Math.ceil(content.length / batchSize);
    
    // Xử lý theo từng batch để tránh tràn RAM
    for (let batchIndex = 0; batchIndex < totalBatches && chunks.length < maxChunks; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, content.length);
        const batch = content.substring(start, end);
        
        console.log(`Processing batch ${batchIndex + 1}/${totalBatches}: ${start}-${end} (${batch.length} chars)`);
        
        // Xử lý batch này
        let batchChunks = [];
        
        if (config.splitMethod === 'chunk') {
            batchChunks = await processChunkMethod(batch, config, maxChunks - chunks.length);
        } else if (config.splitMethod === 'page') {
            batchChunks = await processPageMethod(batch, config, maxChunks - chunks.length);
        } else if (config.splitMethod === 'character') {
            batchChunks = await processCharacterMethod(batch, config, maxChunks - chunks.length);
        }
        
        // Cập nhật index cho chunks
        batchChunks.forEach(chunk => {
            chunk.index = chunkIndex++;
            chunks.push(chunk);
        });
        
        processedLength += batch.length;
        console.log(`Processed: ${(processedLength / content.length * 100).toFixed(1)}%`);
        
        // Yield control để tránh block UI
        if (chunks.length % 100 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    console.log('Streaming processing completed. Total chunks:', chunks.length);
    return chunks;
};

// Xử lý theo chunk method với memory optimization
const processChunkMethod = async (content, config, maxChunks) => {
    const chunkSize = config.chunkSize || 1000;
    const overlapSize = config.overlapSize || 100;
    const chunks = [];
    
    console.log('Chunk size:', chunkSize, 'Overlap size:', overlapSize);

    for (let i = 0; i < content.length && chunks.length < maxChunks; i += chunkSize - overlapSize) {
        const chunk = content.slice(i, i + chunkSize);
        if (chunk.trim().length > 0) {
            chunks.push({
                index: chunks.length + 1,
                content: chunk.trim()
            });
        }
        
        // Yield control mỗi 100 chunks
        if (chunks.length % 100 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    console.log('Created', chunks.length, 'chunks with chunk method');
    return chunks;
};

// Xử lý theo page method với memory optimization
const processPageMethod = async (content, config, maxChunks) => {
    const pageSize = config.pageSize || 1;
    const pages = content.split('\n\n').filter(page => page.trim().length > 0);
    const chunks = [];
    
    console.log('Found', pages.length, 'pages');

    for (let i = 0; i < pages.length && chunks.length < maxChunks; i += pageSize) {
        const pageGroup = pages.slice(i, i + pageSize).join('\n\n');
        if (pageGroup.trim().length > 0) {
            chunks.push({
                index: chunks.length + 1,
                content: pageGroup.trim()
            });
        }
        
        // Yield control mỗi 50 chunks
        if (chunks.length % 50 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    console.log('Created', chunks.length, 'chunks with page method');
    return chunks;
};

// Xử lý theo character method với memory optimization
const processCharacterMethod = async (content, config, maxChunks) => {
    const splitChar = config.splitCharacter || '\n';
    const keepCharacter = config.keepCharacter || 'start';
    const chunks = [];
    
    console.log('Split character:', JSON.stringify(splitChar), 'Keep character:', keepCharacter);

    if (keepCharacter === 'none') {
        console.log('Using keepCharacter: none');
        const parts = content.split(splitChar).filter(part => part.trim().length > 0);
        console.log('Found', parts.length, 'parts after split');

        for (let i = 0; i < parts.length && chunks.length < maxChunks; i++) {
            chunks.push({
                index: chunks.length + 1,
                content: parts[i].trim()
            });
            
            // Yield control mỗi 200 chunks
            if (chunks.length % 200 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        console.log('Created', chunks.length, 'chunks with character method (none)');
    } else if (keepCharacter === 'start') {
        console.log('Using keepCharacter: start');
        chunks.push(...await processCharacterStart(content, splitChar, maxChunks));
    } else if (keepCharacter === 'end') {
        console.log('Using keepCharacter: end');
        chunks.push(...await processCharacterEnd(content, splitChar, maxChunks));
    }
    
    return chunks;
};

// Xử lý character method với keepCharacter = 'start'
const processCharacterStart = async (content, splitChar, maxChunks) => {
    const chunks = [];
    const MAX_SPLIT_POSITIONS = Math.min(5000, maxChunks * 2); // Giảm giới hạn để tránh tràn RAM
    const splitPositions = [];
    
    // Tìm vị trí split với memory optimization
    let pos = 0;
    while (pos < content.length && splitPositions.length < MAX_SPLIT_POSITIONS) {
        pos = content.indexOf(splitChar, pos);
        if (pos === -1) break;
        
        // Kiểm tra xem có phải là ký tự cắt hợp lệ không
        // Đối với ký tự đơn giản như \n, kiểm tra đầu dòng
        // Đối với ký tự phức tạp như "ID1":, chấp nhận mọi vị trí
        let isValidSplit = true;
        
        if (splitChar === '\n' || splitChar.length === 1) {
            // Ký tự đơn giản: chỉ chấp nhận ở đầu dòng hoặc sau xuống dòng
            const isAtLineStart = pos === 0 || content[pos - 1] === '\n';
            const isAfterNewline = pos > 0 && content[pos - 1] === '\n';
            isValidSplit = isAtLineStart || isAfterNewline;
        } else {
            // Ký tự phức tạp: chấp nhận mọi vị trí (như "ID1":)
            isValidSplit = true;
        }
        
        if (isValidSplit) {
            splitPositions.push(pos);
        }
        
        pos = content.indexOf(splitChar, pos + 1);
        
        // Yield control mỗi 1000 positions
        if (splitPositions.length % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    console.log('Found', splitPositions.length, 'split positions');

    if (splitPositions.length >= MAX_SPLIT_POSITIONS) {
        console.warn(`Đã đạt giới hạn ${MAX_SPLIT_POSITIONS} vị trí tách. Một số phần có thể bị bỏ qua.`);
    }

    if (splitPositions.length === 0) {
        chunks.push({
            index: 1,
            content: content.trim()
        });
    } else {
        // Tạo chunks với memory optimization
        for (let i = 0; i < splitPositions.length && chunks.length < maxChunks; i++) {
            const currentStartPos = splitPositions[i];
            const endPos = i < splitPositions.length - 1 ? splitPositions[i + 1] : content.length;

            const chunkContent = content.substring(currentStartPos, endPos).trim();
            
            if (chunkContent.length > 0) {
                // Kiểm tra duplicate với memory optimization
                const isDuplicate = chunks.some(existingChunk => 
                    existingChunk.content === chunkContent
                );
                
                if (!isDuplicate) {
                    chunks.push({
                        index: chunks.length + 1,
                        content: chunkContent
                    });
                }
            }
            
            // Yield control mỗi 100 chunks
            if (chunks.length % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }
    
    console.log('Created', chunks.length, 'chunks with character method (start)');
    return chunks;
};

// Xử lý character method với keepCharacter = 'end'
const processCharacterEnd = async (content, splitChar, maxChunks) => {
    const chunks = [];
    const MAX_SPLIT_POSITIONS = Math.min(5000, maxChunks * 2);
    const splitPositions = [];
    
    // Tìm vị trí split với memory optimization
    let pos = 0;
    while (pos < content.length && splitPositions.length < MAX_SPLIT_POSITIONS) {
        pos = content.indexOf(splitChar, pos);
        if (pos === -1) break;
        
        // Kiểm tra xem có phải là ký tự cắt hợp lệ không
        // Đối với ký tự đơn giản như \n, kiểm tra đầu dòng
        // Đối với ký tự phức tạp như "ID1":, chấp nhận mọi vị trí
        let isValidSplit = true;
        
        if (splitChar === '\n' || splitChar.length === 1) {
            // Ký tự đơn giản: chỉ chấp nhận ở đầu dòng hoặc sau xuống dòng
            const isAtLineStart = pos === 0 || content[pos - 1] === '\n';
            const isAfterNewline = pos > 0 && content[pos - 1] === '\n';
            isValidSplit = isAtLineStart || isAfterNewline;
        } else {
            // Ký tự phức tạp: chấp nhận mọi vị trí (như "ID1":)
            isValidSplit = true;
        }
        
        if (isValidSplit) {
            splitPositions.push(pos);
        }
        
        pos = content.indexOf(splitChar, pos + 1);
        
        // Yield control mỗi 1000 positions
        if (splitPositions.length % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    if (splitPositions.length >= MAX_SPLIT_POSITIONS) {
        console.warn(`Đã đạt giới hạn ${MAX_SPLIT_POSITIONS} vị trí tách. Một số phần có thể bị bỏ qua.`);
    }

    if (splitPositions.length === 0) {
        chunks.push({
            index: 1,
            content: content.trim()
        });
    } else {
        let startPos = 0;
        
        for (let i = 0; i < splitPositions.length && chunks.length < maxChunks; i++) {
            const currentEndPos = splitPositions[i] + splitChar.length;
            const chunkContent = content.substring(startPos, currentEndPos).trim();
            
            if (chunkContent.length > 0) {
                const isDuplicate = chunks.some(existingChunk => 
                    existingChunk.content === chunkContent
                );
                
                if (!isDuplicate) {
                    chunks.push({
                        index: chunks.length + 1,
                        content: chunkContent
                    });
                }
            }

            startPos = currentEndPos;
            
            // Yield control mỗi 100 chunks
            if (chunks.length % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // Xử lý phần cuối với memory check
        if (startPos < content.length && chunks.length < maxChunks) {
            const remainingContent = content.substring(startPos).trim();
            const maxRemainingRatio = 0.1;
            
            if (remainingContent.length > 0 && remainingContent.length < content.length * maxRemainingRatio) {
                chunks.push({
                    index: chunks.length + 1,
                    content: remainingContent
                });
            }
        }
    }
    
    console.log('Created', chunks.length, 'chunks with character method (end)');
    return chunks;
};

const AIFile = () => {
    // State management
    const [datasets, setDatasets] = useState([]);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [datasetFiles, setDatasetFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeTab, setActiveTab] = useState('original');
    const [fileContents, setFileContents] = useState({});
    const [processedContents, setProcessedContents] = useState({});
    const [processingSummary, setProcessingSummary] = useState(null);
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(false);
    const [renameModal, setRenameModal] = useState({ visible: false, type: '', item: null, newName: '' });
    const [uploadModal, setUploadModal] = useState({ visible: false, datasetName: '', uploading: false });
    const [addFileModal, setAddFileModal] = useState({ visible: false, uploading: false });
    const [uploadFiles, setUploadFiles] = useState([]); // State riêng cho danh sách file upload
    const [addFiles, setAddFiles] = useState([]); // State riêng cho danh sách file add
    const [aiConfigModal, setAiConfigModal] = useState({ visible: false });
    const [fileConfigs, setFileConfigs] = useState({});
    const [configFile, setConfigFile] = useState(null);
    const [selectedChunkIndex, setSelectedChunkIndex] = useState(0);
    const [tocItems, setTocItems] = useState([]);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [restoreModal, setRestoreModal] = useState({ visible: false, chunkIndex: null, versions: [], loading: false });
    const [chunkVersionCounts, setChunkVersionCounts] = useState({}); // { chunkIndex: count }
    const [refreshingLists, setRefreshingLists] = useState(false); // Loading state for refreshing lists
    const [chunkConfigModal, setChunkConfigModal] = useState({ 
        visible: false, 
        chunkIndex: null, 
        translationId: null,
        prompt: '', 
        loading: false 
    });
    const [improvingChunk, setImprovingChunk] = useState(null); // { chunkIndex, fileId, datasetId }

    // Reset files when modals open
    const handleOpenUploadModal = () => {
        setUploadFiles([]); // Reset files
        setUploadModal({ visible: true, datasetName: '', uploading: false });
    };

    const handleOpenAddFileModal = () => {
        setAddFiles([]); // Reset files
        setAddFileModal({ visible: true, uploading: false });
    };

    // Function to copy all displayed content with formatting
    const handleCopyAllContent = async () => {
        try {
            const currentTranslations = translations[selectedFile.id] || [];
            if (currentTranslations.length === 0) {
                message.warning('Không có nội dung để sao chép');
                return;
            }

            // Create HTML content with formatting
            let htmlContent = '';
            currentTranslations.forEach((translation, index) => {
                // Get HTML content with markdown formatting
                const html = marked(translation.translated_content || 'Chưa có bản dịch...', {
                    headerIds: true,
                    mangle: false
                });
                
                // Add content directly without chunk headers
                htmlContent += html;
                
                // Add space between chunks (except for the last one)
                if (index < currentTranslations.length - 1) {
                    htmlContent += ' ';
                }
            });

            // Try modern clipboard API first
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    const clipboardItem = new ClipboardItem({
                        'text/html': new Blob([htmlContent], { type: 'text/html' }),
                        'text/plain': new Blob([htmlContent.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
                    });
                    await navigator.clipboard.write([clipboardItem]);
                    message.success(`Đã sao chép toàn bộ nội dung (có định dạng) vào clipboard`);
                    return;
                } catch (clipboardError) {
                    console.log('Modern clipboard API failed, falling back to execCommand');
                }
            }

            // Fallback to execCommand for older browsers
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '-9999px';
            document.body.appendChild(tempDiv);

            // Select and copy
            const range = document.createRange();
            range.selectNodeContents(tempDiv);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            const success = document.execCommand('copy');
            document.body.removeChild(tempDiv);
            selection.removeAllRanges();

            if (success) {
                message.success(`Đã sao chép toàn bộ nội dung (có định dạng) vào clipboard`);
            } else {
                throw new Error('execCommand failed');
            }
        } catch (error) {
            console.error('Error copying content:', error);
            message.error('Lỗi khi sao chép nội dung');
        }
    };

    // Function to refresh all related lists
    const refreshAllLists = async () => {
        setRefreshingLists(true);
        try {
            // Refresh datasets
            const datasetsResponse = await getAllDatasets();
            setDatasets(datasetsResponse.data || []);
            
            // If a dataset is selected, refresh its files
            if (selectedDataset) {
                const filesResponse = await getFilesByDatasetId(selectedDataset.id);
                setDatasetFiles(filesResponse.data || []);
                
                // If a file is selected, refresh its translations
                if (selectedFile) {
                    await loadFileTranslations(selectedFile.id);
                }
            }
            
            // message.success('Đã cập nhật danh sách thành công!');
        } catch (error) {
            console.error('Error refreshing lists:', error);
            message.error('Lỗi khi cập nhật danh sách');
        } finally {
            setRefreshingLists(false);
        }
    };
// 
    // Function to count versions for each chunk
    const getChunkVersionCount = async (chunkIndex) => {
        if (!selectedFile || !selectedDataset) return 1;
        try {
            const response = await getChunkVersions(selectedDataset.id, selectedFile.id, chunkIndex);
            return response.data.versions?.length || 1;
        } catch (error) {
            console.error('Error getting chunk versions count:', error);
            return 1;
        }
    };

    // Hàm tạo table of contents từ nội dung AI
    const generateTOC = (translations) => {
        if (!translations || translations.length === 0) return [];
        
        const toc = [];
        
        translations.forEach((translation, chunkIndex) => {
            if (!translation.translated_content) return;
            
            // Thêm chunk level (lớn nhất)
            toc.push({
                id: `chunk-${translation.chunk_index}`,
                text: `Đoạn ${translation.chunk_index}`,
                level: 0, // Chunk level
                chunkIndex,
                chunkNumber: translation.chunk_index,
                isChunk: true,
                type: 'chunk',
                translationId: translation.id // Add translation ID for restore functionality
            });
            
            // Parse HTML để tìm các mục quan trọng trong chunk này
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = marked(translation.translated_content, {
                headerIds: true,
                mangle: false
            });
            
            // Chỉ tìm headings chính (H1, H2) - không lấy H3-H6
            const headings = tempDiv.querySelectorAll('h1, h2');
            headings.forEach(heading => {
                const level = parseInt(heading.tagName.charAt(1));
                const text = heading.textContent.trim();
                const id = heading.id || `heading-${Math.random().toString(36).substr(2, 9)}`;
                
                toc.push({
                    id,
                    text,
                    level: 1, // Tất cả heading đều là level 1
                    chunkIndex,
                    chunkNumber: translation.chunk_index,
                    isChunk: false,
                    type: 'heading'
                });
            });
            
            // Bỏ các loại nội dung khác, chỉ giữ headings chính
        });
        
        return toc;
    };
    
    // Progress tracking state
    const [aiProgress, setAiProgress] = useState({
        visible: false,
        currentFile: '',
        currentChunk: 0,
        totalChunks: 0,
        totalFiles: 0,
        processedFiles: 0,
        percentage: 0,
        cancelled: false
    });
    const [isAICancelled, setIsAICancelled] = useState(false);

    // Function to cancel AI processing
    const handleCancelAI = () => {
        setIsAICancelled(true);
        setAiProgress(prev => ({
            ...prev,
            cancelled: true
        }));
        message.warning('Đang hủy quá trình xử lý AI...');
    };

    // Generate TOC when translations change
    useEffect(() => {
        if (selectedFile && translations[selectedFile.id]) {
            const toc = generateTOC(translations[selectedFile.id]);
            setTocItems(toc);
        } else {
            setTocItems([]);
        }
    }, [selectedFile, translations]);

    // Load datasets on component mount
    useEffect(() => {
        loadDatasets();
    }, []);

    // Refresh lists when dataset selected changes
    useEffect(() => {
        if (selectedDataset) {
            refreshAllLists();
        }
    }, [selectedDataset]);

    // Load datasets from API
    const loadDatasets = async () => {
        try {
            setLoading(true);
            const response = await getAllDatasets();
            setDatasets(response.data || []);
        } catch (error) {
            console.error('Error loading datasets:', error);
            message.error('Lỗi khi tải danh sách dataset');
        } finally {
            setLoading(false);
        }
    };

    // Load files for a specific dataset
    const loadFilesForDataset = async (datasetId) => {
        try {
            const filesResponse = await getFilesByDatasetId(datasetId);
            setDatasetFiles(filesResponse.data || []);
        } catch (error) {
            console.error('Error loading dataset files:', error);
            message.error('Lỗi khi tải danh sách file');
        }
    };

    // Handle dataset selection
    const handleDatasetSelect = async (dataset) => {
        setSelectedDataset(dataset);
        setSelectedFile(null);
        try {
            await loadFilesForDataset(dataset.id);
        } catch (error) {
            console.error('Error loading files for dataset:', error);
        }
    };

    // Handle file selection
    const handleFileSelect = async (file) => {
        setSelectedFile(file);
        setSelectedChunkIndex(0); // Reset chunk selection when switching files

        // Load file content if not already loaded
        if (!fileContents[file.file_name]) {
            try {
                let content = '';
                
                // Xử lý file .docx (binary) và .txt (text) khác nhau
                if (file.file_name?.toLowerCase().endsWith('.docx')) {
                    // File .docx cần xử lý binary
                    const response = await fetch(file.file_url);
                    const arrayBuffer = await response.arrayBuffer();
                    
                    // Sử dụng mammoth để chuyển đổi .docx sang text
                    const mammoth = await import('mammoth');
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    content = result.value;
                } else {
                    // File .txt xử lý bình thường
                    const response = await fetch(file.file_url);
                    content = await response.text();
                }
                
                setFileContents(prev => ({
                    ...prev,
                    [file.file_name]: content
                }));
            } catch (error) {
                console.error('Error loading file content:', error);
                message.error('Lỗi khi tải nội dung file');
            }
        }

        // Load file configs from database if not in state
        if (!fileConfigs[file.file_name] && file.processing_config) {
            setFileConfigs(prev => ({
                ...prev,
                [file.file_name]: file.processing_config
            }));
        }

        // Load translations for this file
        try {
            const translationsResponse = await getTranslationsByFileId(file.id);
            const translationsData = translationsResponse.data || [];
            
            // Filter to show only the latest version for each chunk
            const latestTranslations = translationsData.reduce((acc, translation) => {
                const key = `${translation.id_dataset}_${translation.id_file}_${translation.chunk_index}`;
                
                // Only include non-deleted translations (show: true or show is undefined)
                if (translation.show !== false) {
                    if (!acc[key] || translation.id > acc[key].id) {
                        acc[key] = translation;
                    }
                }
                
                return acc;
            }, {});
            
            const filteredTranslations = Object.values(latestTranslations).sort((a, b) => a.chunk_index - b.chunk_index);
            
            // Debug log to check for duplicates
            console.log('Original translations count:', translationsData.length);
            console.log('Original translations:', translationsData.map(t => ({ id: t.id, chunk_index: t.chunk_index, show: t.show })));
            console.log('Filtered translations count:', filteredTranslations.length);
            console.log('Filtered translations:', filteredTranslations.map(t => ({ id: t.id, chunk_index: t.chunk_index })));
            
            setTranslations(prev => ({
                ...prev,
                [file.id]: filteredTranslations
            }));
            
            // Load version counts for each chunk (using filtered translations)
            if (selectedDataset && filteredTranslations.length > 0) {
                const versionCounts = {};
                for (const translation of filteredTranslations) {
                    try {
                        const versionsResponse = await getChunkVersions(selectedDataset.id, file.id, translation.chunk_index);
                        versionCounts[translation.chunk_index] = versionsResponse.data.versions?.length || 1;
                    } catch (error) {
                        console.error(`Error loading versions for chunk ${translation.chunk_index}:`, error);
                        versionCounts[translation.chunk_index] = 1;
                    }
                }
                setChunkVersionCounts(versionCounts);
            }
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    };

    // Handle configuration save
    const handleConfigSave = async (config, file) => {
        const targetFile = file || selectedFile;
        if (!targetFile) return;

        try {
            console.log('Config:', config);
            console.log('Target file:', targetFile);
            await updateFileProcessingConfig(targetFile.id, config);
            setFileConfigs(prev => ({
                ...prev,
                [targetFile.file_name]: config
            }));
            refreshAllLists();
            message.success('Cấu hình đã được lưu thành công!');
        } catch (error) {
            console.error('Error saving config:', error);
            message.error('Lỗi khi lưu cấu hình');
        }
    };

    // Function to get previous AI results for a specific chunk
    const getPreviousAIResult = async (datasetId, fileId, chunkIndex) => {
        try {
            const response = await getTranslationsByDatasetId(datasetId);
            if (response?.data) {
                // Tìm kết quả cũ cho chunk cụ thể
                const previousResult = response.data.find(
                    translation => 
                        translation.id_file === fileId && 
                        translation.chunk_index === chunkIndex &&
                        translation.translation_status === 'completed' &&
                        translation.translated_content
                );
                
                if (previousResult) {
                    console.log(`Found previous AI result for chunk ${chunkIndex}:`, previousResult.translated_content.substring(0, 100) + '...');
                    return previousResult.translated_content;
                }
            }
        } catch (error) {
            console.warn('Error getting previous AI result:', error);
        }
        return null;
    };

    // Function to show chunk config modal
    const handleShowChunkConfigModal = async (chunkIndex) => {
        try {
            setChunkConfigModal(prev => ({ ...prev, visible: true, chunkIndex, loading: true }));
            
            // Lấy translation cho chunk này
            const currentTranslations = translations[selectedFile.id] || [];
            const chunkTranslation = currentTranslations.find(t => t.chunk_index === chunkIndex);
            
            if (!chunkTranslation) {
                message.error('Không tìm thấy đoạn này');
                setChunkConfigModal(prev => ({ ...prev, visible: false, loading: false }));
                return;
            }
            
            let currentPrompt = '';
            
            // Ưu tiên: config của đoạn > config của file > config của dataset
            if (chunkTranslation.config?.prompt) {
                currentPrompt = chunkTranslation.config.prompt;
            } else {
                // Lấy prompt từ file config (từ database hoặc state local)
                let filePrompt = '';
                console.log('File config from state:', fileConfigs);
                // Ưu tiên từ fileConfigs state trước
                const fileConfigFromState = fileConfigs[selectedFile.file_name];
                if (fileConfigFromState.config?.ai_prompt) {
                    filePrompt = fileConfigFromState.config.ai_prompt;
                } else if (selectedFile.processing_config?.ai_prompt) {
                    // Nếu không có trong state, lấy từ database
                    filePrompt = selectedFile.processing_config.config.ai_prompt;
                }
                
                if (filePrompt) {
                    currentPrompt = filePrompt;
                } else {
                    // Lấy prompt mặc định từ AI config
                    const aiConfigResponse = await getSettingByType('MODEL_AI_FILE');
                    if (aiConfigResponse?.setting?.prompt) {
                        currentPrompt = aiConfigResponse.setting.prompt;
                    }
                }
            }
            
            setChunkConfigModal(prev => ({ 
                ...prev, 
                translationId: chunkTranslation.id,
                prompt: currentPrompt, 
                loading: false 
            }));
        } catch (error) {
            console.error('Error loading chunk config:', error);
            message.error('Lỗi khi tải cấu hình');
            setChunkConfigModal(prev => ({ ...prev, visible: false, loading: false }));
        }
    };

    // Function to save chunk config
    const handleSaveChunkConfig = async () => {
        try {
            setChunkConfigModal(prev => ({ ...prev, loading: true }));
            
            const { translationId, prompt } = chunkConfigModal;
            
            if (!translationId) {
                message.error('Không tìm thấy bản dịch để cập nhật');
                return;
            }
            
            if (!prompt || !prompt.trim()) {
                message.error('Prompt không được để trống');
                return;
            }
            
            // Cập nhật config trong database
            const config = { prompt: prompt.trim() };
            await updateTranslationConfig(translationId, config);
            
            // Cập nhật state local
            setTranslations(prev => ({
                ...prev,
                [selectedFile.id]: prev[selectedFile.id].map(t => 
                    t.id === translationId 
                        ? { ...t, config: config }
                        : t
                )
            }));
            
            message.success('Đã lưu cấu hình cho đoạn này');
            setChunkConfigModal({ visible: false, chunkIndex: null, translationId: null, prompt: '', loading: false });
        } catch (error) {
            console.error('Error saving chunk config:', error);
            
            // Xử lý các loại lỗi khác nhau
            let errorMessage = 'Lỗi khi lưu cấu hình';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            message.error(errorMessage);
            setChunkConfigModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Function to reset chunk config to default (null)
    const handleResetChunkConfig = async () => {
        try {
            setChunkConfigModal(prev => ({ ...prev, loading: true }));
            
            const { translationId } = chunkConfigModal;
            
            if (!translationId) {
                message.error('Không tìm thấy bản dịch để cập nhật');
                return;
            }
            
            // Xóa config (set về null)
            await updateTranslationConfig(translationId, null);
            
            // Cập nhật state local - xóa config
            setTranslations(prev => ({
                ...prev,
                [selectedFile.id]: prev[selectedFile.id].map(t => 
                    t.id === translationId 
                        ? { ...t, config: null }
                        : t
                )
            }));
            
            message.success('Đã reset về mặc định cho đoạn này');
            setChunkConfigModal({ visible: false, chunkIndex: null, translationId: null, prompt: '', loading: false });
        } catch (error) {
            console.error('Error resetting chunk config:', error);
            
            // Xử lý các loại lỗi khác nhau
            let errorMessage = 'Lỗi khi reset cấu hình';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            message.error(errorMessage);
            setChunkConfigModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Function to improve a specific chunk
    const handleImproveChunk = async (chunkIndex, fileId, datasetId) => {
        try {
            setImprovingChunk({ chunkIndex, fileId, datasetId });
            
            // Load AI configuration
            const aiConfigResponse = await getSettingByType('MODEL_AI_FILE');
            if (!aiConfigResponse) {
                message.error('Chưa cấu hình AI. Vui lòng cấu hình AI trước.');
                return;
            }
            
            const aiConfig = aiConfigResponse.setting;
            
            // Lấy file info
            const file = datasetFiles.find(f => f.id === fileId);
            if (!file) {
                message.error('Không tìm thấy file');
                return;
            }
            
            // Lấy nội dung file
            let content = '';
            if (file.file_name?.toLowerCase().endsWith('.docx')) {
                const response = await fetch(file.file_url);
                const arrayBuffer = await response.arrayBuffer();
                const mammoth = await import('mammoth');
                const result = await mammoth.extractRawText({ arrayBuffer });
                content = result.value;
            } else {
                const response = await fetch(file.file_url);
                content = await response.text();
            }
            
            // Lấy config của file
            let config = null;
            if (fileConfigs[file.file_name]) {
                const fileConfig = fileConfigs[file.file_name];
                if (fileConfig.type && fileConfig.config) {
                    config = {
                        splitMethod: fileConfig.type,
                        ...fileConfig.config
                    };
                } else {
                    config = fileConfig;
                }
            } else if (file.processing_config) {
                if (file.processing_config.type && file.processing_config.config) {
                    config = {
                        splitMethod: file.processing_config.type,
                        ...file.processing_config.config
                    };
                } else {
                    config = file.processing_config;
                }
            }
            
            if (!config) {
                config = {
                    splitMethod: 'chunk',
                    chunkSize: 1000,
                    overlapSize: 100,
                    useLowerCase: false,
                    useTrim: false,
                    config_for_ai: {
                        enabled: false,
                        selectedChunks: [],
                        range: { start: 1, end: 1 }
                    }
                };
            }
            
            // Cắt file thành chunks
            const cuttingConfig = {
                ...config,
                config_for_ai: { enabled: false, selectedChunks: [], range: { start: 1, end: 1 } }
            };
            const allChunks = processFileContent(content, cuttingConfig);
            
            // Lấy chunk cần cải thiện
            const targetChunk = allChunks[chunkIndex - 1];
            if (!targetChunk) {
                message.error('Không tìm thấy đoạn này');
                return;
            }
            
            // Lấy kết quả AI cũ nếu có
            const previousResult = await getPreviousAIResult(datasetId, fileId, chunkIndex);
            
            // Lấy prompt theo thứ tự ưu tiên
            let customPrompt = '';
            const currentTranslations = translations[fileId] || [];
            const chunkTranslation = currentTranslations.find(t => t.chunk_index === chunkIndex);
            
            if (chunkTranslation?.config?.prompt) {
                customPrompt = chunkTranslation.config.prompt.trim();
            } else {
                // Lấy prompt từ file config
                let filePrompt = '';
                const fileConfigFromState = fileConfigs[file.file_name];
                if (fileConfigFromState?.config?.ai_prompt) {
                    filePrompt = fileConfigFromState.config.ai_prompt;
                } else if (file.processing_config?.config?.ai_prompt) {
                    filePrompt = file.processing_config.config.ai_prompt;
                }
                
                if (filePrompt) {
                    customPrompt = filePrompt.trim();
                }
            }
            
            let finalPrompt = customPrompt || aiConfig.prompt;
            
            // Nếu có kết quả cũ, tích hợp vào prompt
            if (previousResult) {
                finalPrompt = `${finalPrompt}\n\nKết quả phân tích trước đó:\n${previousResult}\n\nHãy phát triển và cải thiện dựa trên kết quả trên, hoặc tạo mới nếu cần thiết.`;
            }
            
            const systemMessage = customPrompt 
                ? "Bạn là một AI chuyên phân tích và tóm tắt nội dung. Hãy trả lời trực tiếp bằng markdown, không chào hỏi, không giới thiệu, chỉ đưa ra nội dung trọng tâm và cấu trúc rõ ràng với các heading (H1, H2) phù hợp. Nếu được cung cấp kết quả phân tích trước đó, hãy phát triển và cải thiện dựa trên đó."
                : "Bạn là một AI chuyên phân tích và tóm tắt nội dung. Hãy trả lời trực tiếp bằng markdown, không chào hỏi, không giới thiệu, chỉ đưa ra nội dung trọng tâm và cấu trúc rõ ràng với các heading (H1, H2) phù hợp. Nếu được cung cấp kết quả phân tích trước đó, hãy phát triển và cải thiện dựa trên đó.";
            
            console.log(`Improving chunk ${chunkIndex} with prompt:`, finalPrompt);
            
            // Gọi AI
            const aiResponse = await aiGen2(
                `${finalPrompt}\n\nNội dung:\n${targetChunk.content}`,
                systemMessage,
                aiConfig.model,
                'text'
            );
            
            const translatedContent = aiResponse?.data || aiResponse?.result || aiResponse || '';
            
            // Lưu kết quả mới vào database
            const translationData = {
                id_dataset: datasetId,
                id_file: fileId,
                chunk_index: chunkIndex,
                original_content: targetChunk.content,
                translated_content: translatedContent,
                translation_status: 'completed',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            
            await createBulkTranslations([translationData]);
            
            // Refresh translations
            await loadFileTranslations(fileId);
            
            message.success(`Đã cải thiện đoạn ${chunkIndex} thành công!`);
            
        } catch (error) {
            console.error('Error improving chunk:', error);
            message.error('Lỗi khi cải thiện đoạn: ' + error.message);
        } finally {
            setImprovingChunk(null);
        }
    };

    // Handle AI processing with aiGen2
    const handleRunAI = async (datasetId) => {
        try {
            setLoading(true);
            setIsAICancelled(false); // Reset cancel state
            
            // Load AI configuration
            const aiConfigResponse = await getSettingByType('MODEL_AI_FILE');
            if (!aiConfigResponse) {
                message.error('Chưa cấu hình AI. Vui lòng cấu hình AI trước.');
                return;
            }
            
            const aiConfig = aiConfigResponse.setting;
            console.log('AI Config:', aiConfig);
            
            const files = await getFilesByDatasetId(datasetId);
            const totalFiles = files.data?.length || 0;
            
            // Initialize progress tracking
            setAiProgress({
                visible: true,
                currentFile: '',
                currentChunk: 0,
                totalChunks: 0,
                totalFiles: totalFiles,
                processedFiles: 0,
                percentage: 0,
                cancelled: false
            });
            
            for (let fileIndex = 0; fileIndex < (files.data || []).length; fileIndex++) {
                // Check if cancelled
                if (isAICancelled) {
                    console.log('AI processing cancelled by user');
                    message.warning('Đã hủy quá trình xử lý AI');
                    break;
                }
                
                const file = files.data[fileIndex];
                let content = '';
                
                // Update progress - current file
                setAiProgress(prev => ({
                    ...prev,
                    currentFile: file.file_name,
                    processedFiles: fileIndex,
                    percentage: Math.round((fileIndex / totalFiles) * 100)
                }));
                
                // Xử lý file .docx (binary) và .txt (text) khác nhau
                if (file.file_name?.toLowerCase().endsWith('.docx')) {
                    // File .docx cần xử lý binary
                    const response = await fetch(file.file_url);
                    const arrayBuffer = await response.arrayBuffer();
                    
                    // Sử dụng mammoth để chuyển đổi .docx sang text
                    const mammoth = await import('mammoth');
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    content = result.value;
                } else {
                    // File .txt xử lý bình thường
                    const response = await fetch(file.file_url);
                    content = await response.text();
                }

                // Đọc config của file từ database hoặc state local
                let config = null;
                
                // Ưu tiên đọc từ fileConfigs (state local) trước
                if (fileConfigs[file.file_name]) {
                    const fileConfig = fileConfigs[file.file_name];
                    // Kiểm tra format của config từ fileConfigs
                    if (fileConfig.type && fileConfig.config) {
                        // Format mới: { type: 'character', config: {...} }
                        config = {
                            splitMethod: fileConfig.type,
                            ...fileConfig.config
                        };
                        console.log(`Using config from fileConfigs (new format) for file: ${file.file_name}`);
                    } else {
                        // Format cũ: { splitMethod: 'chunk', chunkSize: 1000, ... }
                        config = fileConfig;
                        console.log(`Using config from fileConfigs (old format) for file: ${file.file_name}`);
                    }
                }
                // Nếu không có, đọc từ file.processing_config (database)
                else if (file.processing_config) {
                    if (file.processing_config.type && file.processing_config.config) {
                        // Format mới: { type: 'chunk', config: {...} }
                        config = {
                            splitMethod: file.processing_config.type,
                            ...file.processing_config.config
                        };
                        console.log(`Using config from database (new format) for file: ${file.file_name}`);
                    } else {
                        // Format cũ: { splitMethod: 'chunk', chunkSize: 1000, ... }
                        config = file.processing_config;
                        console.log(`Using config from database (old format) for file: ${file.file_name}`);
                    }
                }
                
                // Nếu vẫn không có config, sử dụng config mặc định
                if (!config) {
                    config = {
                        splitMethod: 'chunk',
                        chunkSize: 1000,
                        overlapSize: 100,
                        useLowerCase: false,
                        useTrim: false,
                        config_for_ai: {
                            enabled: false,
                            selectedChunks: [],
                            range: { start: 1, end: 1 }
                        }
                    };
                    console.log(`Using default config for file: ${file.file_name}`);
                }
                
                console.log(`Final config for file ${file.file_name}:`, config);

                // BƯỚC 1: Lấy tất cả chunks (không áp dụng AI selection)
                console.log('=== STEP 1: GET ALL CHUNKS ===');
                const cuttingConfig = {
                    ...config,
                    // Bỏ qua chọn đoạn khi cắt: luôn trả về đầy đủ các chunks
                    config_for_ai: { enabled: false, selectedChunks: [], range: { start: 1, end: 1 } }
                };
                console.log('Cutting config (no AI selection):', cuttingConfig);
                
                const allChunks = await processFileContent(content, cuttingConfig);
                console.log(`Total chunks after splitting: ${allChunks.length}`);
                
                setProcessedContents(prev => ({
                    ...prev,
                    [file.file_name]: allChunks
                }));

                // BƯỚC 2: Chọn các đoạn để xử lý AI theo config của file
                console.log('=== STEP 2: APPLY AI SELECTION ===');
                let chunksToProcess = allChunks;
                
                console.log(`AI config for file ${file.file_name}:`, config.config_for_ai);
                
                if (config.config_for_ai && config.config_for_ai.enabled) {
                    const { selectedChunks, range } = config.config_for_ai;
                    
                    // Ưu tiên range trước selectedChunks
                    if (range && range.start && range.end) {
                        // Chọn theo khoảng (range.start và range.end là 1-based)
                        chunksToProcess = allChunks.slice(range.start - 1, range.end);
                        console.log(`Using range method: chunks ${range.start} to ${range.end}`);
                        console.log(`Range selection will process ${chunksToProcess.length} chunks`);
                    } else if (selectedChunks && selectedChunks.length > 0) {
                        // Chọn theo danh sách cụ thể (selectedChunks chứa index của chunks)
                        chunksToProcess = allChunks.filter((_, index) => selectedChunks.includes(index + 1));
                        console.log(`Using selectedChunks method: ${selectedChunks.length} chunks selected`);
                        console.log(`Selected chunk indices:`, selectedChunks);
                    } else {
                        console.log(`AI enabled but no selection method specified, processing all chunks`);
                    }
                } else {
                    console.log(`AI selection disabled, processing all chunks`);
                }

                console.log(`Final chunks to process: ${chunksToProcess.length} out of ${allChunks.length} total chunks for file: ${file.file_name}`);

                // Update progress - total chunks for current file
                setAiProgress(prev => ({
                    ...prev,
                    totalChunks: chunksToProcess.length,
                    currentChunk: 0
                }));

                // Xử lý từng đoạn được chọn với aiGen2 - TUẦN TỰ
                
                for (let i = 0; i < chunksToProcess.length; i++) {
                    // Check if cancelled
                    if (isAICancelled) {
                        console.log('AI processing cancelled by user during chunk processing');
                        message.warning('Đã hủy quá trình xử lý AI');
                        break;
                    }
                    
                    const chunk = chunksToProcess[i];
                    const originalIndex = allChunks.findIndex(c => c === chunk);
                    
                    // Update progress - current chunk
                    setAiProgress(prev => ({
                        ...prev,
                        currentChunk: i + 1,
                        percentage: Math.round(((fileIndex + (i + 1) / chunksToProcess.length) / totalFiles) * 100)
                    }));
                    
                    try {
                        console.log(`\n=== PROCESSING CHUNK ${i + 1}/${chunksToProcess.length} ===`);
                        console.log(`File: ${file.file_name}`);
                        console.log(`Original chunk index: ${originalIndex + 1}`);
                        console.log(`Chunk content length: ${chunk.content.length} characters`);
                        console.log(`Chunk content preview: ${chunk.content.substring(0, 100)}...`);
                        
                        // Lấy kết quả AI cũ nếu có
                        const previousResult = await getPreviousAIResult(datasetId, file.id, originalIndex + 1);
                        
                        // Lấy prompt theo thứ tự ưu tiên: config của đoạn > config của file > config của dataset
                        let customPrompt = '';
                        
                        // Kiểm tra xem có translation nào cho chunk này không
                        const currentTranslations = translations[file.id] || [];
                        const chunkTranslation = currentTranslations.find(t => t.chunk_index === originalIndex + 1);
                        
                        if (chunkTranslation?.config?.prompt) {
                            // Ưu tiên 1: Prompt của đoạn
                            customPrompt = chunkTranslation.config.prompt.trim();
                            console.log(`Using chunk-specific prompt for chunk ${originalIndex + 1}`);
                        } else {
                            // Ưu tiên 2: Prompt của file
                            let filePrompt = '';
                            
                            // Ưu tiên từ fileConfigs state trước
                            const fileConfigFromState = fileConfigs[file.file_name];
                            if (fileConfigFromState?.config?.ai_prompt) {
                                filePrompt = fileConfigFromState.config.ai_prompt;
                                console.log(`Using file prompt from state for chunk ${originalIndex + 1}`);
                            } else if (file.processing_config?.config?.ai_prompt) {
                                // Nếu không có trong state, lấy từ database
                                filePrompt = file.processing_config.config.ai_prompt;
                                console.log(`Using file prompt from database for chunk ${originalIndex + 1}`);
                            }
                            
                            if (filePrompt) {
                                customPrompt = filePrompt.trim();
                            } else {
                                // Ưu tiên 3: Prompt mặc định hệ thống (sẽ được set ở dưới)
                                console.log(`No file prompt found, will use system default for chunk ${originalIndex + 1}`);
                            }
                        }
                        
                        let finalPrompt = customPrompt || aiConfig.prompt;
                        
                        // Nếu có kết quả cũ, tích hợp vào prompt
                        if (previousResult) {
                            finalPrompt = `${finalPrompt}\n\nKết quả phân tích trước đó:\n${previousResult}\n\nHãy phát triển và cải thiện dựa trên kết quả trên, hoặc tạo mới nếu cần thiết.`;
                            console.log(`Including previous AI result in prompt for chunk ${originalIndex + 1}`);
                        }
                        
                        const systemMessage = customPrompt 
                            ? "Bạn là một AI chuyên phân tích và tóm tắt nội dung. Hãy trả lời trực tiếp bằng markdown, không chào hỏi, không giới thiệu, chỉ đưa ra nội dung trọng tâm và cấu trúc rõ ràng với các heading (H1, H2) phù hợp. Nếu được cung cấp kết quả phân tích trước đó, hãy phát triển và cải thiện dựa trên đó."
                            : "Bạn là một AI chuyên phân tích và tóm tắt nội dung. Hãy trả lời trực tiếp bằng markdown, không chào hỏi, không giới thiệu, chỉ đưa ra nội dung trọng tâm và cấu trúc rõ ràng với các heading (H1, H2) phù hợp. Nếu được cung cấp kết quả phân tích trước đó, hãy phát triển và cải thiện dựa trên đó.";
                        
                        // Gọi aiGen2 với model và prompt từ config
                        console.log(`Calling AI with model: ${aiConfig.model}`);
                        console.log(`Prompt source: ${chunkTranslation?.config?.prompt ? 'Chunk-specific' : (customPrompt ? 'File config' : 'System default')}`);
                        console.log(`Previous result included: ${previousResult ? 'Yes' : 'No'}`);
                        console.log(`Final prompt: ${finalPrompt}`);
                        
                        const aiResponse = await aiGen2(
                            `${finalPrompt}\n\nNội dung:\n${chunk.content}`,
                            systemMessage,
                            aiConfig.model,
                            'text'
                        );
                        
                        const translatedContent = aiResponse?.data || aiResponse?.result || aiResponse || '';
                        console.log(`AI response length: ${translatedContent.length} characters`);
                        console.log(`AI response preview: ${translatedContent.substring(0, 100)}...`);
                        
                        // Check if AI response is empty or invalid
                        if (!translatedContent || translatedContent.trim().length === 0) {
                            console.error(`❌ AI returned empty response for chunk ${i + 1}`);
                            message.error(`AI không tạo ra nội dung cho đoạn ${i + 1}. Dừng quá trình xử lý.`);
                            
                            // Save error chunk and stop processing
                            const errorData = {
                                id_dataset: datasetId,
                                id_file: file.id,
                                chunk_index: originalIndex + 1,
                                original_content: chunk.content,
                                translated_content: '',
                                translation_status: 'error',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            };
                            
                            await createBulkTranslations([errorData]);
                            console.log(`❌ Saved error chunk ${i + 1}/${chunksToProcess.length} for file: ${file.file_name}`);
                            
                            // Stop processing this file and all remaining files
                            message.error('Dừng quá trình xử lý do AI không tạo ra nội dung');
                            break;
                        }
                        
                        
                        // Lưu NGAY LẬP TỨC từng chunk vào database
                        const translationData = {
                            id_dataset: datasetId,
                            id_file: file.id,
                            chunk_index: originalIndex + 1, // Sử dụng index gốc
                            original_content: chunk.content,
                            translated_content: translatedContent,
                            translation_status: 'completed',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        };
                        
                        await createBulkTranslations([translationData]);
                        console.log(`✅ Saved chunk ${i + 1}/${chunksToProcess.length} for file: ${file.file_name}`);
                        
                    } catch (error) {
                        console.error(`❌ Error processing chunk ${i + 1}:`, error);
                        message.error(`Lỗi khi xử lý đoạn ${i + 1}: ${error.message}. Dừng quá trình xử lý.`);
                        
                        // Lưu chunk với status lỗi NGAY LẬP TỨC
                        const errorData = {
                            id_dataset: datasetId,
                            id_file: file.id,
                            chunk_index: originalIndex + 1,
                            original_content: chunk.content,
                            translated_content: '',
                            translation_status: 'error',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        };
                        
                        await createBulkTranslations([errorData]);
                        console.log(`❌ Saved error chunk ${i + 1}/${chunksToProcess.length} for file: ${file.file_name}`);
                        
                        // Stop processing this file and all remaining files
                        break;
                    }
                }

            }

            // Refresh all lists after AI processing
            await refreshAllLists();
            
            if (isAICancelled) {
                message.warning('Quá trình xử lý AI đã bị hủy');
            } else {
                message.success(`Xử lý AI hoàn tất! Đã xử lý ${files.data?.length || 0} file(s).`);
            }

        } catch (error) {
            console.error('Error processing files with AI:', error);
            message.error('Lỗi khi xử lý file với AI');
        } finally {
            setLoading(false);
            setIsAICancelled(false); // Reset cancel state
            // Hide progress bar when done
            setAiProgress(prev => ({
                ...prev,
                visible: false,
                cancelled: false
            }));
        }
    };

    // Modal handlers (moved above)

    const handleOpenAiConfigModal = () => {
        setAiConfigModal({ visible: true });
    };

    const handleConfigFile = (file) => {
        setConfigFile(file);
        setShowConfigModal(true);
    };

    // Restore functionality
    const handleShowRestoreModal = async (chunkIndex) => {
        if (!selectedFile || !selectedDataset) return;
        
        setRestoreModal(prev => ({ ...prev, visible: true, chunkIndex, loading: true, versions: [] }));
        
        try {
            const response = await getChunkVersions(selectedDataset.id, selectedFile.id, chunkIndex);
            setRestoreModal(prev => ({ 
                ...prev, 
                loading: false, 
                versions: response.data.versions || [] 
            }));
        } catch (error) {
            console.error('Error loading chunk versions:', error);
            message.error('Lỗi khi tải danh sách phiên bản: ' + error.message);
            setRestoreModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleRestoreToVersion = async (versionId) => {
        if (!selectedFile || !selectedDataset || !restoreModal.chunkIndex) return;
        
        try {
            setRestoreModal(prev => ({ ...prev, loading: true }));
            
            await deleteNewerVersions(
                selectedDataset.id, 
                selectedFile.id, 
                restoreModal.chunkIndex, 
                versionId
            );
            
            message.success('Đã khôi phục về phiên bản cũ thành công!');
            
            // Reload translations to reflect changes
            await loadFileTranslations(selectedFile.id);
            
            setRestoreModal({ visible: false, chunkIndex: null, versions: [], loading: false });
        } catch (error) {
            console.error('Error restoring version:', error);
            message.error('Lỗi khi khôi phục phiên bản: ' + error.message);
            setRestoreModal(prev => ({ ...prev, loading: false }));
        }
    };

    const closeRestoreModal = () => {
        setRestoreModal({ visible: false, chunkIndex: null, versions: [], loading: false });
    };

    // Load file translations with latest version filtering
    const loadFileTranslations = async (fileId) => {
        try {
            const translationsResponse = await getTranslationsByFileId(fileId);
            const translationsData = translationsResponse.data || [];
            
            // Filter to show only the latest version for each chunk
            const latestTranslations = translationsData.reduce((acc, translation) => {
                const key = `${translation.id_dataset}_${translation.id_file}_${translation.chunk_index}`;
                
                // Only include non-deleted translations (show: true or show is undefined)
                if (translation.show !== false) {
                    if (!acc[key] || translation.id > acc[key].id) {
                        acc[key] = translation;
                    }
                }
                
                return acc;
            }, {});
            
            const filteredTranslations = Object.values(latestTranslations).sort((a, b) => a.chunk_index - b.chunk_index);
            
            // Debug log to check for duplicates
            // console.log('loadFileTranslations - Original translations count:', translationsData.length);
            // console.log('loadFileTranslations - Original translations:', translationsData.map(t => ({ id: t.id, chunk_index: t.chunk_index, show: t.show })));
            // console.log('loadFileTranslations - Filtered translations count:', filteredTranslations.length);
            // console.log('loadFileTranslations - Filtered translations:', filteredTranslations.map(t => ({ id: t.id, chunk_index: t.chunk_index })));
            
            setTranslations(prev => ({
                ...prev,
                [fileId]: filteredTranslations
            }));
            
            // Load version counts for each chunk
            if (selectedDataset && filteredTranslations.length > 0) {
                const versionCounts = {};
                for (const translation of filteredTranslations) {
                    try {
                        const versionsResponse = await getChunkVersions(selectedDataset.id, fileId, translation.chunk_index);
                        versionCounts[translation.chunk_index] = versionsResponse.data.versions?.length || 1;
                    } catch (error) {
                        console.error(`Error loading versions for chunk ${translation.chunk_index}:`, error);
                        versionCounts[translation.chunk_index] = 1;
                    }
                }
                setChunkVersionCounts(versionCounts);
            }
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    };

    // Upload handlers
    const handleUploadConfirm = async () => {
        if (uploadFiles.length === 0) {
            message.warning('Vui lòng chọn ít nhất một file');
            return;
        }

        setUploadModal(prev => ({ ...prev, uploading: true }));

        try {
            const uploadResponse = await uploadFilesService(uploadFiles);
            
            const datasetData = {
                name: uploadModal.datasetName || `Dataset ${new Date().toLocaleTimeString()} ${new Date().toLocaleDateString()}`,
                description: `Dataset chứa ${uploadResponse.files.length} file`,
                total_files: uploadResponse.files.length,
                status: 'draft'
            };

            const datasetResponse = await createDataset(datasetData);
            const newDataset = datasetResponse.data;

            const fileData = uploadResponse.files.map(file => ({
                file_name: file.fileName,
                file_url: file.fileUrl,
                file_size: 0,
                file_type: file.fileExtension,
                upload_time: new Date(),
                processing_status: 'pending'
            }));

            await addFilesToDataset(newDataset.id, fileData);
            message.success(`Tạo dataset "${uploadModal.datasetName}" thành công với ${uploadResponse.files.length} file!`);

            await refreshAllLists();
            setSelectedDataset(newDataset);
            setUploadFiles([]);
            setUploadModal({ visible: false, datasetName: '', uploading: false });

        } catch (error) {
            console.error('Error uploading files:', error);
            message.error('Lỗi khi tải lên file');
        } finally {
            setUploadModal(prev => ({ ...prev, uploading: false }));
        }
    };

    const handleAddFileConfirm = async (files) => {
        if (!selectedDataset || files.length === 0) return;

        setAddFileModal(prev => ({ ...prev, uploading: true }));

        try {
            const uploadResponse = await uploadFilesService(files);
            
            const fileData = uploadResponse.files.map(file => ({
                file_name: file.fileName,
                file_url: file.fileUrl,
                file_size: 0,
                file_type: file.fileExtension,
                upload_time: new Date(),
                processing_status: 'pending'
            }));

            await addFilesToDataset(selectedDataset.id, fileData);
            message.success(`Đã thêm ${uploadResponse.files.length} file vào dataset "${selectedDataset.name}"!`);

            await loadFilesForDataset(selectedDataset.id);
            setAddFiles([]);
            setAddFileModal({ visible: false, uploading: false });

        } catch (error) {
            console.error('Error uploading files:', error);
            message.error('Lỗi khi tải lên file');
        } finally {
            setAddFileModal(prev => ({ ...prev, uploading: false }));
        }
    };

    // File upload handlers
    const handleFileUpload = ({ fileList }) => {
        const allFiles = fileList
            .filter(file => file.originFileObj)
            .map(file => file.originFileObj);

        setUploadFiles(allFiles);
    };

    // Delete handlers
    const handleDeleteDataset = async (datasetId) => {
        try {
            await deleteDataset(datasetId);
            message.success('Xóa dataset thành công!');
            await refreshAllLists();

            if (selectedDataset && selectedDataset.id === datasetId) {
                setSelectedDataset(null);
                setDatasetFiles([]);
                setSelectedFile(null);
            }
        } catch (error) {
            console.error('Error deleting dataset:', error);
            message.error('Lỗi khi xóa dataset');
        }
    };

    const handleDeleteFile = async (fileId) => {
        try {
            await deleteDatasetFile(fileId);
            message.success('Xóa file thành công!');

            if (selectedDataset) {
                const filesResponse = await getFilesByDatasetId(selectedDataset.id);
                setDatasetFiles(filesResponse.data || []);
            }

            if (selectedFile && selectedFile.id === fileId) {
                setSelectedFile(null);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            message.error('Lỗi khi xóa file');
        }
    };

    // Rename handlers
    const handleRenameDataset = (dataset) => {
        setRenameModal({ visible: true, type: 'dataset', item: dataset, newName: dataset.name });
    };

    const handleRenameFile = (file) => {
        setRenameModal({ visible: true, type: 'file', item: file, newName: file.file_name });
    };

    const handleRenameConfirm = async () => {
        try {
            if (renameModal.type === 'dataset') {
                await updateDataset(renameModal.item.id, { name: renameModal.newName });
                message.success('Đổi tên dataset thành công!');
                await refreshAllLists();
            } else if (renameModal.type === 'file') {
                await updateDatasetFile(renameModal.item.id, { file_name: renameModal.newName });
                message.success('Đổi tên file thành công!');

                if (selectedDataset) {
                    const filesResponse = await getFilesByDatasetId(selectedDataset.id);
                    setDatasetFiles(filesResponse.data || []);
                }
            }

            setRenameModal({ visible: false, type: '', item: null, newName: '' });
        } catch (error) {
            console.error('Error renaming:', error);
            message.error('Lỗi khi đổi tên');
        }
    };

    return (
        <div className={styles['ai-file-container']}>
            <div className={styles['ai-file-header']}>
                <Header />
            </div>

            <div className={styles['ai-file-panels']}>
                {/* Panel 1: File Upload & File Sets */}
                <div className={`${styles.panel} ${styles['panel-1']}`}>
                    <div className={styles['panel-header']}>
                        <h3>Tải lên & Bộ file</h3>
                        <div>
                        <Button
                            type="text"
                            onClick={handleOpenUploadModal}
                            icon={<UploadOutlined style={{fontSize: 20}} />}
                        >
                            {/* Tạo dataset */}
                        </Button>
                        <Button
                            type="text"
                            onClick={handleOpenAiConfigModal}
                            icon={<SettingOutlined style={{fontSize: 20}} />}
                        >
                            {/* Cấu hình AI */}
                        </Button>
                        </div>
                        {/* <Button
                            type="text"
                            onClick={refreshAllLists}
                            loading={refreshingLists}
                            icon={<ReloadOutlined style={{fontSize: 20}} />}
                            title="Làm mới danh sách"
                        >
           
                        </Button> */}
                    </div>

                    <div className={styles['file-sets-list']}>
                        {loading ? (
                            <div className={styles['no-selection']}>
                                <p>Đang tải danh sách dataset...</p>
                            </div>
                        ) : datasets.length === 0 ? (
                            <div className={styles['no-selection']}>
                                <p>Chưa có dataset nào. Hãy tải lên file để tạo dataset mới.</p>
                            </div>
                        ) : (
                            datasets.map(dataset => {
                                const datasetMenu = (
                                    <Menu>
                                        <Menu.Item key="rename" onClick={() => handleRenameDataset(dataset)}>
                                            ✏️ Đổi tên dataset
                                        </Menu.Item>
                                        <Menu.Item key="delete">
                                            <Popconfirm
                                                title="Xóa dataset"
                                                description="Bạn có chắc chắn muốn xóa dataset này không?"
                                                onConfirm={() => handleDeleteDataset(dataset.id)}
                                                okText="Xóa"
                                                cancelText="Hủy"
                                            >
                                                <span style={{ color: '#ff4d4f' }}>🗑️ Xóa dataset</span>
                                            </Popconfirm>
                                        </Menu.Item>
                                    </Menu>
                                );

                                return (
                                    <Dropdown overlay={datasetMenu} trigger={['contextMenu']} key={dataset.id}>
                                        <div
                                            className={`${styles['file-set-item']} ${selectedDataset?.id === dataset.id ? styles.selected : ''}`}
                                            onClick={() => handleDatasetSelect(dataset)}
                                        >
                                            <div className={styles['file-set-info']}>
                                                <h4>{dataset.name}</h4>
                                                <p>{dataset.total_files} file</p>
                                                <p className={styles['upload-date']}>
                                                    {dataset.created_at ?
                                                        new Date(dataset.created_at).toLocaleDateString() :
                                                        'Chưa xác định'
                                                    }
                                                </p>
                                                <span className={`${styles.status} ${styles[dataset.status]}`}>
                                                    {dataset.status === 'draft' ? 'Nháp' :
                                                        dataset.status === 'processing' ? 'Đang xử lý' :
                                                            dataset.status === 'completed' ? 'Hoàn thành' : 'Lỗi'}
                                                </span>
                                            </div>
                                            <button
                                                className={styles['run-btn']}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRunAI(dataset.id);
                                                }}
                                                disabled={loading || dataset.status === 'processing'}
                                            >
                                                {loading ? 'Đang xử lý...' : 'Chạy AI'}
                                            </button>
                                        </div>
                                    </Dropdown>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Panel 2: File List */}
                <div className={`${styles.panel} ${styles['panel-2']}`}>
                    <div className={styles['panel-header']}>
                        <h3>File trong dataset</h3>
                        <div className={styles['header-actions']}>
                            {selectedDataset && (
                                <span className={styles['file-count']}>
                                    {datasetFiles.length} file
                                </span>
                            )}
                            {selectedDataset && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={handleOpenAddFileModal}
                                    title="Thêm file vào dataset"
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles['files-list']}>
                        {selectedDataset ? (
                            datasetFiles.length === 0 ? (
                                <div className={styles['no-selection']}>
                                    <p>Đang tải danh sách file...</p>
                                </div>
                            ) : (
                                datasetFiles.map((file, index) => {
                                    const fileMenu = (
                                        <Menu>
                                            <Menu.Item key="rename" onClick={() => handleRenameFile(file)}>
                                                ✏️ Đổi tên file
                                            </Menu.Item>
                                            <Menu.Item key="delete">
                                                <Popconfirm
                                                    title="Xóa file"
                                                    description="Bạn có chắc chắn muốn xóa file này không?"
                                                    onConfirm={() => handleDeleteFile(file.id)}
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                >
                                                    <span style={{ color: '#ff4d4f' }}>🗑️ Xóa file</span>
                                                </Popconfirm>
                                            </Menu.Item>
                                        </Menu>
                                    );

                                    return (
                                        <Dropdown overlay={fileMenu} trigger={['contextMenu']} key={file.id}>
                                            <div
                                                className={`${styles['file-item']} ${selectedFile?.id === file.id ? styles.selected : ''}`}
                                                onClick={() => handleFileSelect(file)}
                                            >
                                                <div className={styles['file-icon']}>
                                                    📄
                                                </div>
                                                <div className={styles['file-info']}>
                                                    <h4>
                                                        {file.file_name}
                                                        {/* <span className={`${styles['config-status']} ${(fileConfigs[file.file_name] || (file.processing_config && (file.processing_config.type || file.processing_config.splitMethod))) ? styles.configured : styles.default}`}>
                                                            {(fileConfigs[file.file_name] || (file.processing_config && (file.processing_config.type || file.processing_config.splitMethod))) ? '⚙️' : '⚪'}
                                                        </span> */}
                                                    </h4>
                                                    <div className={`${styles['config-status']} ${(fileConfigs[file.file_name] || (file.processing_config && (file.processing_config.type || file.processing_config.splitMethod))) ? styles.configured : styles.default}`}>
                                                    {(fileConfigs[file.file_name] || (file.processing_config && (file.processing_config.type || file.processing_config.splitMethod))) ? 'Đã cấu hình' : 'Chưa cấu hình'}
                                                    </div>
                                                    {/* <p className={`${styles['processing-status']} ${styles[file.processing_status]}`}>
                                                        {file.processing_status === 'pending' ? 'Chờ xử lý' :
                                                            file.processing_status === 'processing' ? 'Đang xử lý' :
                                                                file.processing_status === 'completed' ? 'Hoàn thành' : 'Lỗi'}
                                                    </p> */}
                                                </div>
                                               
                                                    <Button
                                                        type='text'
                                                        size='small'
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            setConfigFile(file);
                                                            setShowConfigModal(true);
                                                        }}
                                                    >
                                                        ⚙️
                                                    </Button>
                                               
                                            </div>
                                        </Dropdown>
                                    );
                                })
                            )
                        ) : (
                            <div className={styles['no-selection']}>
                                <p>Chọn một dataset để xem danh sách file</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel 3: Content Display */}
                <div className={`${styles.panel} ${styles['panel-3']}`}>
                    <div className={styles['panel-header']}>
                        <h3>Nội dung file</h3>
                        {selectedFile && (
                            <div className={styles['tab-buttons']}>
                                <button
                                    className={`${styles['tab-btn']} ${activeTab === 'original' ? styles.active : ''}`}
                                    onClick={() => setActiveTab('original')}
                                >
                                    Gốc
                                </button>
                                <button
                                    className={`${styles['tab-btn']} ${activeTab === 'ai' ? styles.active : ''}`}
                                    onClick={() => setActiveTab('ai')}
                                >
                                    AI
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles['content-display']}>
                        {selectedFile ? (
                            activeTab === 'original' ? (
                                <div className={styles['file-content']}>
                                    {selectedFile.file_name?.toLowerCase().endsWith('.docx') ? (
                                        <DocViewer
                                            documents={[{
                                                uri: selectedFile.file_url,
                                                fileName: selectedFile.file_name,
                                                fileType: 'docx'
                                            }]}
                                            pluginRenderers={DocViewerRenderers}
                                            style={{ height: '100%', width: '100%' }}
                                            config={{
                                                header: {
                                                    disableHeader: true,
                                                },
                                                loadingRenderer: {
                                                    overrideComponent: () => <div>Đang tải file...</div>
                                                },
                                                errorRenderer: {
                                                    overrideComponent: () => <div>Lỗi khi tải file. Vui lòng thử lại.</div>
                                                }
                                            }}
                                        />
                                    ) : (
                                        <pre className={styles['text-content']}>
                                            {fileContents[selectedFile.file_name] || 'Đang tải nội dung...'}
                                        </pre>
                                    )}
                                </div>
                            ) : (
                                <div className={styles['ai-content-with-sidebar']}>
                                    {/* Sidebar - Table of Contents */}
                                    <div className={styles['chunks-sidebar']}>
                                        <div className={styles['sidebar-header']}>
                                            <h4>📑 Mục lục</h4>
                                            <span className={styles['chunks-count']}>
                                                {tocItems.length} mục
                                            </span>
                                        </div>
                                        <div className={styles['toc-list']}>
                                            {tocItems.length > 0 ? (
                                                tocItems.map((item, index) => (
                                                    <div 
                                                        key={index} 
                                                        className={`${styles['toc-item']} ${styles[`level-${item.level}`]}`}
                                                        data-type={item.type}
                                                        onClick={() => {
                                                            if (item.isChunk) {
                                                                setSelectedChunkIndex(item.chunkNumber);
                                                                // Scroll đến chunk được chọn
                                                                const element = document.getElementById(`chunk-${item.chunkNumber}`);
                                                                if (element) {
                                                                    element.scrollIntoView({ 
                                                                        behavior: 'smooth', 
                                                                        block: 'start' 
                                                                    });
                                                                    // Thêm hiệu ứng highlight
                                                                    element.classList.add(styles['highlight-flash']);
                                                                    setTimeout(() => {
                                                                        element.classList.remove(styles['highlight-flash']);
                                                                    }, 2000);
                                                                }
                                                            } else {
                                                                setSelectedChunkIndex(item.chunkNumber);
                                                                // Scroll đến element được chọn
                                                                let element = document.getElementById(item.id);
                                                                
                                                                // Nếu không tìm thấy element với id, thử tìm trong chunk tương ứng
                                                                if (!element) {
                                                                    const chunkElement = document.getElementById(`chunk-${item.chunkNumber}`);
                                                                    if (chunkElement) {
                                                                        // Tìm heading trong chunk đó - tìm kiếm linh hoạt hơn
                                                                        const headings = chunkElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
                                                                        for (let heading of headings) {
                                                                            const headingText = heading.textContent.trim();
                                                                            // So sánh chính xác hoặc chứa text
                                                                            if (headingText === item.text || 
                                                                                headingText.includes(item.text) || 
                                                                                item.text.includes(headingText)) {
                                                                                element = heading;
                                                                                break;
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                                
                                                                if (element) {
                                                                    element.scrollIntoView({ 
                                                                        behavior: 'smooth', 
                                                                        block: 'start' 
                                                                    });
                                                                    // Thêm hiệu ứng highlight
                                                                    element.classList.add(styles['highlight-flash']);
                                                                    setTimeout(() => {
                                                                        element.classList.remove(styles['highlight-flash']);
                                                                    }, 2000);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0 }}>
                                                            <span className={styles['toc-text']} style={{ 
                                                                wordWrap: 'break-word', 
                                                                wordBreak: 'break-word', 
                                                                overflowWrap: 'break-word',
                                                                flex: 1,
                                                                minWidth: 0,
                                                                marginRight: '8px'
                                                            }}>
                                                                {item.text}
                                                            </span>
                                                             <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                                 
                                                             {item.isChunk && chunkVersionCounts[item.chunkNumber] > 1 && (
                                                                     <Button
                                                                         size="small"
                                                                         type="link"
                                                                         onClick={(e) => {
                                                                             e.stopPropagation();
                                                                             handleShowRestoreModal(item.chunkNumber);
                                                                         }}
                                                                         style={{ 
                                                                             fontSize: '14px', 
                                                                             padding: '0 4px',
                                                                             color: '#1890ff',
                                                                             textDecoration: 'none',
                                                                             display: 'flex',
                                                                             alignItems: 'center',
                                                                             gap: '4px'
                                                                         }}
                                                                     >
                                                                         {chunkVersionCounts[item.chunkNumber]}<FileStack size={15} /> 
                                                                     </Button>
                                                                 )}
                                                                 {item.isChunk && (
                                                                     <Button
                                                                         size="small"
                                                                         type="link"
                                                                         onClick={(e) => {
                                                                             e.stopPropagation();
                                                                             handleShowChunkConfigModal(item.chunkNumber);
                                                                         }}
                                                                         style={{ 
                                                                             fontSize: '12px', 
                                                                             padding: '0 4px',
                                                                             color: '#52c41a',
                                                                             textDecoration: 'none',
                                                                             display: 'flex',
                                                                             alignItems: 'center',
                                                                             gap: '2px'
                                                                         }}
                                                                         title="Cấu hình prompt cho đoạn này"
                                                                     >
                                                                         ⚙️
                                                                     </Button>
                                                                 )}
                                                                 {item.isChunk && (
                                                                     <Button
                                                                         size="small"
                                                                         type="link"
                                                                         onClick={(e) => {
                                                                             e.stopPropagation();
                                                                             handleImproveChunk(item.chunkNumber, selectedFile.id, selectedDataset.id);
                                                                         }}
                                                                         loading={improvingChunk?.chunkIndex === item.chunkNumber}
                                                                         disabled={improvingChunk?.chunkIndex === item.chunkNumber}
                                                                         style={{ 
                                                                             fontSize: '12px', 
                                                                             padding: '0 4px',
                                                                             color: '#fa8c16',
                                                                             textDecoration: 'none',
                                                                             display: 'flex',
                                                                             alignItems: 'center',
                                                                             gap: '2px'
                                                                         }}
                                                                         title="Cải thiện đoạn này với AI"
                                                                     >
                                                                         {improvingChunk?.chunkIndex === item.chunkNumber ? '⏳' : '✨'}
                                                                     </Button>
                                                                 )}
                                                                 
                                                             </div>
                                                        </div>
                                                        {/* {!item.isChunk && (
                                                            <span className={styles['toc-chunk']}>
                                                                Đoạn {item.chunkNumber}
                                                            </span>
                                                        )} */}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={styles['no-toc']}>
                                                    <p>Chưa có mục lục</p>
                                                    <small>Nội dung AI cần chứa heading (H1-H6)</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Nội dung chính - Hiển thị tất cả đoạn nối tiếp (chỉ phiên bản mới nhất) */}
                                    <div className={styles['ai-content-main']} style={{ position: 'relative' }}>
                                        {/* Copy button */}
                                        <Button
                                            type="text"
                                            size="small"
                                            onClick={handleCopyAllContent}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                zIndex: 10,
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                border: '1px solid #d9d9d9',
                                                borderRadius: '4px',
                                                padding: '4px 8px',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            title="Sao chép toàn bộ nội dung"
                                        >
                                            <Copy size={14} />
                                            Sao chép
                                        </Button>
                                        
                                        {(() => {
                                            const currentTranslations = translations[selectedFile.id] || [];
                                            // console.log('Rendering translations:', currentTranslations.map(t => ({ id: t.id, chunk_index: t.chunk_index })));
                                            return currentTranslations;
                                        })().map((translation, index) => (
                                            <div 
                                                key={`chunk-${translation.chunk_index}-${translation.id}`} 
                                                className={`${styles['translation-item']} ${selectedChunkIndex == translation?.chunk_index ? styles['highlighted'] : ''}`}
                                                id={`chunk-${translation.chunk_index}`}
                                            >
                                                <div 
                                                    className={styles['translation-content']}
                                                    dangerouslySetInnerHTML={{
                                                        __html: marked(translation.translated_content || 'Chưa có bản dịch...', {
                                                            headerIds: true,
                                                            mangle: false
                                                        })
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className={styles['no-selection']}>
                                <p>Chọn một file để xem nội dung</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            <Modal
                title="Tải lên file"
                open={uploadModal.visible}
                onOk={handleUploadConfirm}
                onCancel={() => {
                    setUploadFiles([]);
                    setUploadModal({ visible: false, datasetName: '', uploading: false });
                }}
                okText="Tải lên"
                cancelText="Hủy"
                confirmLoading={uploadModal.uploading}
            >
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <label>Tên dataset:</label>
                        <Input
                            value={uploadModal.datasetName}
                            onChange={(e) => setUploadModal(prev => ({ ...prev, datasetName: e.target.value }))}
                            placeholder="Nhập tên dataset (để trống sẽ tự động tạo)"
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label>Chọn file (.docx, .txt):</label>
                        <Upload
                            multiple
                            fileList={uploadFiles.map((file, index) => ({
                                uid: `file-${index}`,
                                name: file.name,
                                status: 'done',
                                originFileObj: file
                            }))}
                            beforeUpload={(file) => {
                                const allowedTypes = ['.docx', '.txt'];
                                const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

                                if (!allowedTypes.includes(fileExtension)) {
                                    message.error(`Chỉ cho phép file định dạng .docx và .txt. File ${file.name} không được hỗ trợ.`);
                                    return false;
                                }
                                return false;
                            }}
                            onChange={handleFileUpload}
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />}>Chọn file</Button>
                        </Upload>
                    </div>

                    {uploadFiles.length > 0 && (
                        <div>
                            <label>Danh sách file đã chọn ({uploadFiles.length} file):</label>
                            <List
                                size="small"
                                dataSource={uploadFiles}
                                renderItem={(file, index) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                type="text"
                                                danger
                                                onClick={() => {
                                                    const newFiles = uploadFiles.filter((_, i) => i !== index);
                                                    setUploadFiles(newFiles);
                                                }}
                                                size="small"
                                            >
                                                Xóa
                                            </Button>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={file.name}
                                            description={`${(file.size / 1024).toFixed(1)} KB`}
                                        />
                                    </List.Item>
                                )}
                                style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: '6px',
                                    padding: '8px'
                                }}
                            />
                        </div>
                    )}
                </div>
            </Modal>

            {/* Rename Modal */}
            <Modal
                title={`Đổi tên ${renameModal.type === 'dataset' ? 'dataset' : 'file'}`}
                open={renameModal.visible}
                onOk={handleRenameConfirm}
                onCancel={() => setRenameModal({ visible: false, type: '', item: null, newName: '' })}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Input
                    value={renameModal.newName}
                    onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                    placeholder={`Nhập tên ${renameModal.type === 'dataset' ? 'dataset' : 'file'} mới`}
                />
            </Modal>

            {/* Configuration Modal */}
            <ConfigModal
                file={configFile}
                initialConfig={fileConfigs[configFile?.file_name]}
                visible={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                onSave={handleConfigSave}
            />

            {/* Add File Modal */}
            <AddFileModal
                visible={addFileModal.visible}
                onCancel={() => {
                    setAddFiles([]);
                    setAddFileModal({ visible: false, uploading: false });
                }}
                onConfirm={handleAddFileConfirm}
                uploading={addFileModal.uploading}
            />

            {/* AI Configuration Modal */}
            <AiConfigModal
                visible={aiConfigModal.visible}
                onCancel={() => setAiConfigModal({ visible: false })}
            />

            {/* AI Processing Progress Bar */}
            {aiProgress.visible && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '350px',
                    maxWidth: 'calc(100vw - 40px)',
                    backgroundColor: 'white',
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: aiProgress.cancelled ? '#ff4d4f' : '#1890ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '8px',
                                animation: aiProgress.cancelled ? 'none' : 'spin 1s linear infinite'
                            }}>
                                <span style={{ color: 'white', fontSize: '12px' }}>
                                    {aiProgress.cancelled ? '⏹️' : '🤖'}
                                </span>
                            </div>
                            <h4 style={{ margin: 0, color: aiProgress.cancelled ? '#ff4d4f' : '#1890ff' }}>
                                {aiProgress.cancelled ? 'Đang hủy...' : 'Đang xử lý AI...'}
                            </h4>
                        </div>
                        <Button
                            type="text"
                            danger
                            size="small"
                            onClick={handleCancelAI}
                            disabled={aiProgress.cancelled}
                            style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                height: 'auto'
                            }}
                        >
                            {aiProgress.cancelled ? 'Đang hủy...' : 'Hủy'}
                        </Button>
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: '#666',
                            marginBottom: '4px'
                        }}>
                            <span>File: {aiProgress.currentFile}</span>
                            <span>{aiProgress.percentage}%</span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${aiProgress.percentage}%`,
                                height: '100%',
                                backgroundColor: '#1890ff',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                    
                    <div style={{
                        fontSize: '11px',
                        color: '#999',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>Chunk: {aiProgress.currentChunk}/{aiProgress.totalChunks}</span>
                        <span>File: {aiProgress.processedFiles + 1}/{aiProgress.totalFiles}</span>
                    </div>
                </div>
            )}

            {/* Restore Modal */}
            <Modal
                title={`🔄 Khôi phục phiên bản - Đoạn ${restoreModal.chunkIndex}`}
                open={restoreModal.visible}
                onCancel={closeRestoreModal}
                footer={[
                    <Button key="close" onClick={closeRestoreModal}>
                        Đóng
                    </Button>
                ]}
                width={800}
                centered
            >
                {restoreModal.loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                            🔍 Đang tải danh sách phiên bản...
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                            Có {restoreModal.versions.length} phiên bản cho đoạn này. Chọn phiên bản để khôi phục:
                        </div>
                        
                        {restoreModal.versions.length > 0 ? (
                            <List
                                itemLayout="vertical"
                                dataSource={[...restoreModal.versions].sort((a, b) => a.id - b.id)}
                                renderItem={(version, index) => {
                                    // Versions are already sorted by ID (oldest first: 1, 2, 3)
                                    const isLatest = index === restoreModal.versions.length - 1;
                                    const createDate = new Date(version.created_at).toLocaleString('vi-VN');
                                    
                                    return (
                                        <List.Item
                                            style={{
                                                border: isLatest ? '2px solid #52c41a' : '1px solid #d9d9d9',
                                                borderRadius: '6px',
                                                marginBottom: '8px',
                                                padding: '16px',
                                                backgroundColor: isLatest ? '#f6ffed' : '#fafafa'
                                            }}
                                            actions={[
                                                !isLatest && (
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        onClick={() => handleRestoreToVersion(version.id)}
                                                        disabled={restoreModal.loading}
                                                    >
                                                        🔄 Khôi phục
                                                    </Button>
                                                )
                                            ].filter(Boolean)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: '100%' }}>
                                                <div style={{ flex: 1, maxWidth: '100%', minWidth: 0 }}>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'space-between',
                                                        marginBottom: '8px',
                                                        gap: '8px',
                                                        maxWidth: '100%',
                                                        minWidth: 0
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <strong>
                                                                Phiên bản #{index + 1} 
                                                            </strong>
                                                            {isLatest && (
                                                                <span style={{
                                                                    backgroundColor: '#52c41a',
                                                                    color: 'white',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '11px'
                                                                }}>
                                                                    HIỆN TẠI
                                                                </span>
                                                            )}
                                                            <span style={{ fontSize: '12px', color: '#999' }}>
                                                                {createDate}
                                                            </span>
                                                        </div>
                                                        {/* Count ký tự và nút xóa ở góc trên bên phải */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{
                                                                backgroundColor: '#f0f0f0',
                                                                color: '#666',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {(version.translated_content || '').length} ký tự
                                                            </div>
                                                            {!isLatest && (
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    size="small"
                                                                    style={{ 
                                                                        padding: '2px 6px',
                                                                        fontSize: '11px',
                                                                        height: 'auto'
                                                                    }}
                                                                    onClick={() => {
                                                                        Modal.confirm({
                                                                            title: 'Xác nhận xóa phiên bản',
                                                                            content: `Bạn có chắc chắn muốn xóa phiên bản #${index + 1}?`,
                                                                            okText: 'Xóa',
                                                                            okType: 'danger',
                                                                            cancelText: 'Hủy',
                                                                            onOk: async () => {
                                                                                try {
                                                                                    await deleteTranslation(version.id);
                                                                                    message.success('Đã xóa phiên bản thành công');
                                                                                    // Refresh translations
                                                                                    if (selectedFile) {
                                                                                        const updatedTranslations = await getTranslationsByFileId(selectedFile.id);
                                                                                        setTranslations(updatedTranslations.result || []);
                                                                                    }
                                                                                } catch (error) {
                                                                                    console.error('Error deleting translation:', error);
                                                                                    message.error('Lỗi khi xóa phiên bản');
                                                                                }
                                                                            }
                                                                        });
                                                                    }}
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        maxHeight: '200px',
                                                        overflow: 'auto',
                                                        border: '1px solid #e8e8e8',
                                                        borderRadius: '4px',
                                                        padding: '8px',
                                                        backgroundColor: 'white',
                                                        fontSize: '12px',
                                                        lineHeight: '1.4',
                                                        wordWrap: 'break-word',
                                                        wordBreak: 'break-word',
                                                        overflowWrap: 'break-word',
                                                        maxWidth: '100%',
                                                        width: '100%',
                                                        boxSizing: 'border-box'
                                                    }}>
                                                        <div 
                                                            dangerouslySetInnerHTML={{
                                                                __html: marked(version.translated_content || 'Chưa có nội dung...', {
                                                                    headerIds: true,
                                                                    mangle: false
                                                                })
                                                            }}
                                                            style={{
                                                                fontSize: '12px',
                                                                lineHeight: '1.4',
                                                                color: '#333',
                                                                wordWrap: 'break-word',
                                                                wordBreak: 'break-word',
                                                                overflowWrap: 'break-word',
                                                                maxWidth: '100%'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                Không tìm thấy phiên bản nào cho đoạn này.
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal cấu hình prompt cho chunk */}
            <Modal
                title={`Cấu hình Prompt - Đoạn ${chunkConfigModal.chunkIndex}`}
                open={chunkConfigModal.visible}
                onCancel={() => setChunkConfigModal({ visible: false, chunkIndex: null, translationId: null, prompt: '', loading: false })}
                onOk={handleSaveChunkConfig}
                confirmLoading={chunkConfigModal.loading}
                width={800}
                okText="Lưu"
                cancelText="Hủy"
                footer={[
                    <Button 
                        key="reset" 
                        onClick={handleResetChunkConfig}
                        loading={chunkConfigModal.loading}
                        disabled={chunkConfigModal.loading}
                        style={{ 
                            color: '#ff4d4f',
                            borderColor: '#ff4d4f'
                        }}
                    >
                        Reset về mặc định
                    </Button>,
                    <Button 
                        key="cancel" 
                        onClick={() => setChunkConfigModal({ visible: false, chunkIndex: null, translationId: null, prompt: '', loading: false })}
                        disabled={chunkConfigModal.loading}
                    >
                        Hủy
                    </Button>,
                    <Button 
                        key="save" 
                        type="primary" 
                        onClick={handleSaveChunkConfig}
                        loading={chunkConfigModal.loading}
                        disabled={chunkConfigModal.loading}
                    >
                        Lưu
                    </Button>
                ]}
            >
                {chunkConfigModal.loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        Đang tải cấu hình...
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                            Chỉnh sửa prompt cho đoạn {chunkConfigModal.chunkIndex}. Prompt này sẽ được ưu tiên sử dụng khi chạy AI cho đoạn này.
                        </div>
                        
                        <Input.TextArea
                            value={chunkConfigModal.prompt}
                            onChange={(e) => setChunkConfigModal(prev => ({ ...prev, prompt: e.target.value }))}
                            placeholder="Nhập prompt cho đoạn này..."
                            rows={12}
                            style={{ 
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                lineHeight: '1.5'
                            }}
                        />
                        
                        <div style={{ 
                            marginTop: '12px', 
                            padding: '12px', 
                            backgroundColor: '#f5f5f5', 
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#666'
                        }}>
                            <strong>Thứ tự ưu tiên prompt:</strong>
                            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                                <li><strong>Prompt của đoạn</strong> (đang chỉnh sửa) - Ưu tiên cao nhất</li>
                                <li>Prompt của file - Nếu đoạn chưa có prompt riêng</li>
                                <li>Prompt của dataset - Nếu file chưa có prompt</li>
                                <li>Prompt mặc định hệ thống - Nếu dataset chưa có prompt</li>
                            </ol>
                            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff2e8', borderRadius: '4px', border: '1px solid #ffd591' }}>
                                <strong>💡 Lưu ý:</strong> Nút "Reset về mặc định" sẽ xóa prompt riêng của đoạn này, khi đó hệ thống sẽ sử dụng prompt của file hoặc prompt mặc định.
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AIFile;
