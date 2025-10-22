import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Select, Input, Checkbox, Button, Spin, Progress } from 'antd';
import { message } from 'antd';
import mammoth from 'mammoth';
import { marked } from 'marked';
import { aiGen2 } from '../../../apis/botService';
import { getSettingByType } from '../../../apis/settingService';
import { updateUsedTokenApp } from '../../DataManager/main/tableData/processors/aiTransformerProcessor';
import styles from '../AIFile.module.css';
import { Undo2, Bot } from 'lucide-react';
// import { processFileContent } from '../fileProcessingUtils'; // Using local function instead

const ConfigModal = ({ file, visible, onClose, onSave, initialConfig }) => {
    const [config, setConfig] = useState({
        splitMethod: 'chunk',
        chunkSize: 1000,
        overlapSize: 100,
        pageSize: 1,
        splitCharacter: '\n',
        useLowerCase: false,
        useTrim: false,
        keepCharacter: 'start', // 'start', 'end', or 'none' - giữ ký tự ở đầu, cuối, hoặc không giữ
        config_for_ai: {
            enabled: false,
            selectedChunks: [], // Array of chunk indices to send to AI
            range: { start: 1, end: 1 } // Range selection like printer
        },
        ai_prompt: '' // Custom prompt for this file
    });
    const [previewChunks, setPreviewChunks] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [processingProgress, setProcessingProgress] = useState({ percent: 0, message: '' });
    const [sortOrder, setSortOrder] = useState('original'); // 'original', 'asc', 'desc'
    const [testAiModal, setTestAiModal] = useState({ visible: false, chunk: null, result: null, loading: false });
    const [defaultPrompt, setDefaultPrompt] = useState(''); // Default prompt from system setting
    const [displayPrompt, setDisplayPrompt] = useState(''); // Display value for TextArea

    useEffect(() => {
        setPreviewChunks([]);
    }, [visible]);

    // Load default prompt from system setting
    useEffect(() => {
        const loadDefaultPrompt = async () => {
            try {
                const response = await getSettingByType('MODEL_AI_FILE');
                const aiConfigData = await response;
                
                if (aiConfigData && aiConfigData.setting && aiConfigData.setting.prompt) {
                    setDefaultPrompt(aiConfigData.setting.prompt);
                }
            } catch (error) {
                console.error('Error loading default prompt:', error);
            }
        };

        if (visible) {
            loadDefaultPrompt();
        }
    }, [visible]);

    // Update display prompt when defaultPrompt changes
    useEffect(() => {
        if (defaultPrompt && !config.ai_prompt) {
            setDisplayPrompt(defaultPrompt);
        }
    }, [defaultPrompt, config.ai_prompt]);
  

    // Load cấu hình từ initialConfig hoặc file.processing_config
    useEffect(() => {
        if (!visible) return; // Chỉ load khi modal đang mở
        
        let loadedConfig = {};

        // Ưu tiên load từ file.processing_config (database) trước
        console.log('file', file);
        
        if (file && file.processing_config) {
            if (file.processing_config.type && file.processing_config.config) {

                // Format mới: { type: 'chunk', config: {...} }
                loadedConfig = {
                    splitMethod: file.processing_config.type,
                    ...file.processing_config.config
                };
            } else {
                // Format cũ: { splitMethod: 'chunk', chunkSize: 1000, ... }
                loadedConfig = file.processing_config;
            }
        } else if (initialConfig) {
            // Fallback: sử dụng cấu hình từ state local
            loadedConfig = initialConfig;
        }

        console.log('ConfigModal - Loading config:', {
            file: file?.file_name,
            processing_config: file?.processing_config,
            initialConfig,
            loadedConfig
        });

        if (Object.keys(loadedConfig).length > 0) {
            setConfig(prev => ({
                ...prev,
                ...loadedConfig,
                // Đảm bảo các giá trị có mặc định đúng
                keepCharacter: loadedConfig.keepCharacter || 'start',
                useLowerCase: loadedConfig.useLowerCase !== undefined ? loadedConfig.useLowerCase : false,
                useTrim: loadedConfig.useTrim !== undefined ? loadedConfig.useTrim : false,
                config_for_ai: loadedConfig.config_for_ai || {
                    enabled: false,
                    selectedChunks: [],
                    range: { start: 1, end: 1 }
                },
                ai_prompt: loadedConfig.ai_prompt || ''
            }));
            if (loadedConfig?.ai_prompt) {
                setDisplayPrompt(loadedConfig.ai_prompt);
            } else{
                if ( defaultPrompt) {
                    setDisplayPrompt(defaultPrompt);
                }
                else {
                    setDisplayPrompt('');
                }
            }


            // Tự động load preview khi có file và config
            if (file && Object.keys(loadedConfig).length > 0) {
                // Delay một chút để config được set trước
                setTimeout(() => {
                    handlePreviewWithConfig(loadedConfig);
                }, 200);
            }
        }
    }, [file, initialConfig, visible]);

    // Update config when split method changes
    const handleSplitMethodChange = (newMethod) => {
        if (newMethod === 'character') {
            setConfig(prev => ({
                ...prev,
                splitMethod: newMethod,
                useLowerCase: false,
                useTrim: false,
                keepCharacter: 'start'
            }));
        } else {
            setConfig(prev => ({
                ...prev,
                splitMethod: newMethod,
                useLowerCase: false,
                useTrim: false
            }));
        }
    };

    // Memory-optimized file processing with streaming approach
    const processFileContent = async (content, config, progressCallback) => {
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
                return await processLargeFileStreaming(content, config, CHUNK_PROCESSING_SIZE, MAX_CHUNKS_COUNT, progressCallback);
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
    const processLargeFileStreaming = async (content, config, batchSize, maxChunks, progressCallback) => {
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
            
            // Cập nhật progress
            if (progressCallback) {
                const percent = Math.round((batchIndex / totalBatches) * 100);
                progressCallback({
                    percent,
                    message: `Đang xử lý batch ${batchIndex + 1}/${totalBatches} (${(start / 1024 / 1024).toFixed(1)}MB/${(content.length / 1024 / 1024).toFixed(1)}MB)`
                });
            }
            
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
        
        // Hoàn thành progress
        if (progressCallback) {
            progressCallback({
                percent: 100,
                message: `Hoàn thành! Đã tạo ${chunks.length} đoạn`
            });
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

    
    const handlePreviewWithConfig = useCallback(async (configToUse) => {
 
        if (!file) {
            console.log('No file, returning');
            return;
        }

        setPreviewLoading(true);
        try {
            // Get file content
            let content = '';
            console.log('Getting file content...');

            if (file.file_url) {
                // Check file type
                const fileExtension = file.file_name?.toLowerCase().split('.').pop();

                if (fileExtension === 'docx') {
                    // For .docx files, fetch and convert to text using mammoth
                    const response = await fetch(file.file_url);
                    const arrayBuffer = await response.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    content = result.value;

                    // Show warnings if any
                    if (result.messages && result.messages.length > 0) {
                        console.warn('Mammoth warnings:', result.messages);
                    }
                } else if (fileExtension === 'txt') {
                    // For .txt files, fetch content
                    const response = await fetch(file.file_url);
                    content = await response.text();
                } else {
                    message.error('Chỉ hỗ trợ xem trước cho file .txt và .docx');
                    return;
                }
            } else if (file.content) {
                content = file.content;
            } else {
                message.error('Không thể đọc nội dung file');
                return;
            }

            // Process content based on config
            console.log('ConfigModal - Preview with config:', configToUse);
            console.log('Content length before processing:', content?.length);
            console.log('Content preview:', content?.substring(0, 200) + '...');
            
            // Tách file từ dữ liệu gốc: CHỈ cắt trước, KHÔNG áp dụng chọn đoạn ở bước này
            console.log('Calling processFileContent (cut only, no AI selection)...');
            const cuttingConfig = {
                ...configToUse,
                // Bỏ qua chọn đoạn khi cắt: luôn trả về đầy đủ các chunks
                config_for_ai: { enabled: false, selectedChunks: [], range: { start: 1, end: 1 } }
            };
            console.log('Cutting config:', cuttingConfig);
            console.log('Content length being processed:', content.length);
            
            // Progress callback để hiển thị tiến trình
            const progressCallback = (progress) => {
                setProcessingProgress(progress);
            };
            
            const chunks = await processFileContent(content, cuttingConfig, progressCallback);
            console.log('Received chunks from processFileContent:', chunks?.length);
            setPreviewChunks(chunks);
            
            // Reset progress sau khi hoàn thành
            setProcessingProgress({ percent: 0, message: '' });

        } catch (error) {
            console.error('Error processing file:', error);
            message.error('Lỗi khi xử lý file: ' + error.message);
        } finally {
            setPreviewLoading(false);
        }
    }, [file, config]);

    const handlePreview = useCallback(async () => {
        await handlePreviewWithConfig(config);
    }, [config, handlePreviewWithConfig]);

    const handleSubmit = async () => {
        // Chuyển đổi config sang format mới để lưu vào database
        const newFormatConfig = {
            type: config.splitMethod,
            config: {}
        };

        // Chỉ lưu ai_prompt nếu nó khác với default prompt
        const shouldSaveCustomPrompt = config.ai_prompt && config.ai_prompt.trim() !== defaultPrompt.trim();
        
        // Cấu hình theo từng loại
        if (config.splitMethod === 'chunk') {
            newFormatConfig.config = {
                chunkSize: config.chunkSize,
                overlapSize: config.overlapSize,
                useLowerCase: config.useLowerCase,
                useTrim: config.useTrim,
                config_for_ai: config.config_for_ai,
                ...(shouldSaveCustomPrompt && { ai_prompt: config.ai_prompt })
            };
        } else if (config.splitMethod === 'page') {
            newFormatConfig.config = {
                pageSize: config.pageSize,
                useLowerCase: config.useLowerCase,
                useTrim: config.useTrim,
                config_for_ai: config.config_for_ai,
                ...(shouldSaveCustomPrompt && { ai_prompt: config.ai_prompt })
            };
        } else if (config.splitMethod === 'character') {
            newFormatConfig.config = {
                splitCharacter: config.splitCharacter,
                keepCharacter: config.keepCharacter,
                useLowerCase: config.useLowerCase,
                useTrim: config.useTrim,
                config_for_ai: config.config_for_ai,
                ...(shouldSaveCustomPrompt && { ai_prompt: config.ai_prompt })
            };
        }

        await onSave(newFormatConfig, file);
        onClose();
    };

    const getSortedChunks = (chunks, order) => {
        if (order === 'original') {
            return chunks;
        } else if (order === 'asc') {
            return [...chunks].sort((a, b) => a.content.length - b.content.length);
        } else if (order === 'desc') {
            return [...chunks].sort((a, b) => b.content.length - a.content.length);
        }
        return chunks;
    };

    const handleSortChange = (order) => {
        setSortOrder(order);
    };

    // Test AI function
    const handleTestAI = async (chunk) => {
        try {
            setTestAiModal(prev => ({ ...prev, visible: true, chunk, loading: true, result: null }));
            
            // Get AI configuration
            const response = await getSettingByType('MODEL_AI_FILE');
            console.log('AI configuration:', response);
            const aiConfigData = await response;
            
            if (!aiConfigData || !aiConfigData.setting) {
                message.error('Chưa cấu hình AI. Vui lòng cấu hình AI trước.');
                setTestAiModal(prev => ({ ...prev, loading: false }));
                return;
            }
            
            const aiConfig = aiConfigData.setting;
            console.log('Testing AI with config:', aiConfig);
            console.log('Testing chunk:', chunk);
            
            // Use custom prompt if available, otherwise use default prompt
            const customPrompt = config.ai_prompt?.trim();
            const finalPrompt = customPrompt || aiConfig.prompt;
            const systemMessage = customPrompt 
                ? "Bạn là một AI chuyên phân tích và tóm tắt nội dung. Hãy trả lời trực tiếp bằng markdown, không chào hỏi, không giới thiệu, chỉ đưa ra nội dung trọng tâm và cấu trúc rõ ràng với các heading (H1, H2) phù hợp. không cần phải đánh dấu kiểu 'đây là dữ liệu phân tích' chỉ cần trả lời ngay."
                : "Bạn là một AI chuyên phân tích và tóm tắt nội dung. Hãy trả lời trực tiếp bằng markdown, không chào hỏi, không giới thiệu, chỉ đưa ra nội dung trọng tâm và cấu trúc rõ ràng với các heading (H1, H2) phù hợp. không cần phải đánh dấu kiểu 'đây là dữ liệu phân tích' chỉ cần trả lời ngay.";
            
            // Call AI
            const aiResponse = await aiGen2(
                `${finalPrompt}\n\nNội dung:\n${chunk.content}`,
                systemMessage,
                aiConfig.model,
                'text'
            );
            
            // Cập nhật token đã sử dụng
            await updateUsedTokenApp(aiResponse, aiConfig.model);
            
            const result = aiResponse?.generated || '';
            
            setTestAiModal(prev => ({ 
                ...prev, 
                loading: false, 
                result: {
                    original: chunk.content,
                    translated: result,
                    chunkIndex: chunk.index,
                    aiModel: aiConfig.model,
                    prompt: finalPrompt
                }
            }));
            
        } catch (error) {
            console.error('Error testing AI:', error);
            message.error('Lỗi khi test AI: ' + error.message);
            setTestAiModal(prev => ({ ...prev, loading: false }));
        }
    };

    const closeTestAiModal = () => {
        setTestAiModal({ visible: false, chunk: null, result: null, loading: false });
    };

    // Calculate statistics
    const calculateStats = (chunks) => {
        if (chunks.length === 0) return null;
        
        const lengths = chunks.map(chunk => chunk.content.length);
        const total = lengths.reduce((sum, len) => sum + len, 0);
        const average = total / lengths.length;
        const max = Math.max(...lengths);
        const min = Math.min(...lengths);
        
        // Standard deviation
        const variance = lengths.reduce((sum, len) => sum + Math.pow(len - average, 2), 0) / lengths.length;
        const stdDev = Math.sqrt(variance);
        
        // Count chunks > 1000 chars
        const longChunks = lengths.filter(len => len > 1000).length;
        
        return { total, average, max, min, stdDev, longChunks, count: lengths.length };
    };

    const stats = calculateStats(previewChunks);

    return (
        <Modal
            title={`Cấu hình xử lý cho ${file?.file_name || file?.name}`}
            open={visible}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Lưu cấu hình"
            cancelText="Hủy"
            width={1200}
            centered
        >
            <div style={{ display: 'flex', gap: '20px', height: '80vh' }}>
                {/* Left Column - Configuration */}
                <div style={{ flex: 1, minWidth: '400px', height: '100%' }}>
                    <Form layout="vertical" className={styles['config-form']}>
                        <Form.Item label="Phương thức tách">
                            <Select
                                value={config.splitMethod}
                                onChange={handleSplitMethodChange}
                                style={{ width: '100%' }}
                                options={[
                                    { value: 'chunk', label: 'Theo số ký tự (Chunk)' },
                                    { value: 'page', label: 'Theo số trang' },
                                    { value: 'character', label: 'Theo ký tự chỉ định' }
                                ]}
                            />
                        </Form.Item>

                        {config.splitMethod === 'chunk' && (
                            <>
                                <Form.Item label="Kích thước đoạn (ký tự)">
                                    <Input
                                        type="number"
                                        value={config.chunkSize}
                                        onChange={(e) => setConfig(prev => ({ ...prev, chunkSize: parseInt(e.target.value) || 0 }))}
                                        min={100}
                                        max={10000}
                                        placeholder="Nhập kích thước đoạn"
                                    />
                                </Form.Item>
                                <Form.Item label="Kích thước chồng lấp (ký tự)">
                                    <Input
                                        type="number"
                                        value={config.overlapSize}
                                        onChange={(e) => setConfig(prev => ({ ...prev, overlapSize: parseInt(e.target.value) || 0 }))}
                                        min={0}
                                        max={500}
                                        placeholder="Nhập kích thước chồng lấp"
                                    />
                                </Form.Item>
                            </>
                        )}

                        {config.splitMethod === 'page' && (
                            <Form.Item label="Số trang mỗi đoạn">
                                <Input
                                    type="number"
                                    value={config.pageSize}
                                    onChange={(e) => setConfig(prev => ({ ...prev, pageSize: parseInt(e.target.value) || 1 }))}
                                    min={1}
                                    max={10}
                                    placeholder="Nhập số trang"
                                />
                            </Form.Item>
                        )}

                        {config.splitMethod === 'character' && (
                            <>
                                <Form.Item label="Ký tự tách">
                                    <Input
                                        value={config.splitCharacter}
                                        onChange={(e) => setConfig(prev => ({ ...prev, splitCharacter: e.target.value }))}
                                        placeholder="VD: \n, ., ;, &quot;ID1&quot;:"
                                    />
                                    {/* <div style={{ 
                                        fontSize: '11px', 
                                        color: '#666', 
                                        marginTop: '4px',
                                        padding: '4px 8px',
                                        backgroundColor: '#f6f8fa',
                                        borderRadius: '4px'
                                    }}>
                                        💡 <strong>Gợi ý:</strong><br/>
                                        • <code>\n</code> - Xuống dòng<br/>
                                        • <code>.</code> - Dấu chấm<br/>
                                        • <code>"ID1":</code> - Ký tự JSON phức tạp<br/>
                                        • <code>---</code> - Dấu gạch ngang<br/>
                                        • <code>Điều</code> - Từ khóa tiếng Việt
                                    </div> */}
                                </Form.Item>

                                <Form.Item label="Vị trí giữ ký tự">
                                    <Select
                                        value={config.keepCharacter}
                                        onChange={(value) => setConfig(prev => ({ ...prev, keepCharacter: value }))}
                                        style={{ width: '100%' }}
                                        options={[
                                            { value: 'start', label: 'Giữ ở đầu đoạn (mặc định)' },
                                            { value: 'end', label: 'Giữ ở cuối đoạn' },
                                            { value: 'none', label: 'Không giữ ký tự tách' }
                                        ]}
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Checkbox
                                        checked={config.useTrim}
                                        onChange={(e) => setConfig(prev => ({ ...prev, useTrim: e.target.checked }))}
                                    >
                                        Loại bỏ khoảng trắng thừa
                                    </Checkbox>
                                </Form.Item>
                            </>
                        )}

                        {/* AI Configuration */}
                        <Form.Item label="Cấu hình gửi AI">
                            <Checkbox
                                checked={config.config_for_ai.enabled}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    config_for_ai: {
                                        ...prev.config_for_ai,
                                        enabled: e.target.checked
                                    }
                                }))}
                            >
                                Chọn đoạn gửi cho AI xử lý
                            </Checkbox>
                        </Form.Item>

                        {/* AI Prompt Configuration */}
                        <Form.Item>
                        <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                        }}
                        >Prompt tùy chỉnh cho file này {(config.ai_prompt && config.ai_prompt.trim() !== defaultPrompt.trim()) && (
                                    <Button
                                        type="text"
                                        onClick={() => {
                                            setConfig(prev => ({ ...prev, ai_prompt: '' }));
                                            setDisplayPrompt(defaultPrompt || '');
                                        }}
                                        style={{
                                            padding: 0,
                                            marginLeft: 4,
                                            fontSize: '11px',
                                            height: 'auto',
                                            color: 'rgb(255, 132, 24)',
                                            display: 'flex',
                                            gap: '2px'
                                        }}
                                    >
                                        Default<Undo2  size={14} style={{ marginRight: -5, paddingRight: 0 }}/>
                                    
                                    </Button>
                                )}</div>
                            <div style={{ position: 'relative' }}>
                                <Input.TextArea
                                    value={displayPrompt}
                                    onChange={(e) => {
                                        setDisplayPrompt(e.target.value);
                                        setConfig(prev => ({ ...prev, ai_prompt: e.target.value }));
                                    }}
                                    placeholder="Nhập prompt tùy chỉnh cho file này. Để trống sẽ sử dụng prompt mặc định từ cấu hình hệ thống."
                                    rows={4}
                                    style={{ marginBottom: '8px' }}
                                />
                                
                            </div>
                        </Form.Item>

                        {config.config_for_ai.enabled && previewChunks.length > 0 && (
                            <>
                                <Form.Item label="Chọn đoạn (giống chọn trang in)">
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span>Từ đoạn:</span>
                                        <Input
                                            type="number"
                                            value={config.config_for_ai.range.start}
                                            onChange={(e) => setConfig(prev => ({
                                                ...prev,
                                                config_for_ai: {
                                                    ...prev.config_for_ai,
                                                    range: {
                                                        ...prev.config_for_ai.range,
                                                        start: Math.max(1, Math.min(parseInt(e.target.value) || 1, previewChunks.length))
                                                    }
                                                }
                                            }))}
                                            min={1}
                                            max={previewChunks.length}
                                            style={{ width: '80px' }}
                                        />
                                        <span>đến đoạn:</span>
                                        <Input
                                            type="number"
                                            value={config.config_for_ai.range.end}
                                            onChange={(e) => setConfig(prev => ({
                                                ...prev,
                                                config_for_ai: {
                                                    ...prev.config_for_ai,
                                                    range: {
                                                        ...prev.config_for_ai.range,
                                                        end: Math.max(1, Math.min(parseInt(e.target.value) || 1, previewChunks.length))
                                                    }
                                                }
                                            }))}
                                            min={1}
                                            max={previewChunks.length}
                                            style={{ width: '80px' }}
                                        />
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                const start = Math.min(config.config_for_ai.range.start, config.config_for_ai.range.end);
                                                const end = Math.max(config.config_for_ai.range.start, config.config_for_ai.range.end);
                                                const selectedChunks = Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
                                                
                                                setConfig(prev => ({
                                                    ...prev,
                                                    config_for_ai: {
                                                        ...prev.config_for_ai,
                                                        selectedChunks: selectedChunks
                                                    }
                                                }));
                                            }}
                                        >
                                            Áp dụng
                                        </Button>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Tổng: {previewChunks.length} đoạn | Đã chọn: {config.config_for_ai.selectedChunks.length} đoạn
                                    </div>
                                </Form.Item>

                                <Form.Item label="Chọn đoạn cụ thể">
                                    <div style={{ 
                                        maxHeight: '120px', 
                                        overflow: 'auto', 
                                        border: '1px solid #d9d9d9', 
                                        borderRadius: '4px',
                                        padding: '8px'
                                    }}>
                                        {previewChunks.map((chunk, index) => (
                                            <div key={index} style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                marginBottom: '4px',
                                                padding: '4px',
                                                backgroundColor: config.config_for_ai.selectedChunks.includes(index) ? '#e6f7ff' : 'transparent',
                                                borderRadius: '4px'
                                            }}>
                                                <Checkbox
                                                    checked={config.config_for_ai.selectedChunks.includes(index)}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        setConfig(prev => ({
                                                            ...prev,
                                                            config_for_ai: {
                                                                ...prev.config_for_ai,
                                                                selectedChunks: isChecked
                                                                    ? [...prev.config_for_ai.selectedChunks, index]
                                                                    : prev.config_for_ai.selectedChunks.filter(i => i !== index)
                                                            }
                                                        }));
                                                    }}
                                                />
                                                <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                                    Đoạn {chunk.index} ({chunk.content.length} ký tự)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Form.Item>
                            </>
                        )}

                        {/* Preview Button */}
                        <Form.Item>
                            <Button
                                type="primary"
                                onClick={handlePreview}
                                loading={previewLoading}
                                style={{ width: '100%' }}
                            >
                                🔍 Xem trước kết quả cắt
                            </Button>
                        </Form.Item>

                        {/* Progress Indicator */}
                        {processingProgress.percent > 0 && (
                            <Form.Item>
                                <div style={{ 
                                    padding: '12px', 
                                    backgroundColor: '#f6f8fa', 
                                    borderRadius: '6px',
                                    border: '1px solid #e1e4e8'
                                }}>
                                    <Progress 
                                        percent={processingProgress.percent} 
                                        status={processingProgress.percent === 100 ? 'success' : 'active'}
                                        strokeColor={{
                                            '0%': '#108ee9',
                                            '100%': '#87d068',
                                        }}
                                    />
                                    <div style={{ 
                                        marginTop: '8px', 
                                        fontSize: '12px', 
                                        color: '#666',
                                        textAlign: 'center'
                                    }}>
                                        {processingProgress.message}
                                    </div>
                                </div>
                            </Form.Item>
                        )}

                        {/* Memory Optimization Info */}
                        {/* <Form.Item>
                            <div style={{ 
                                padding: '8px 12px', 
                                backgroundColor: '#e6f7ff', 
                                borderRadius: '4px',
                                border: '1px solid #91d5ff',
                                fontSize: '11px',
                                color: '#1890ff'
                            }}>
                                💡 <strong>Tối ưu hóa RAM:</strong> File lớn sẽ được xử lý theo từng phần để tránh tràn RAM. 
                                Giới hạn tối đa 10,000 đoạn để đảm bảo hiệu suất.
                            </div>
                        </Form.Item> */}

                        {/* Character Split Info */}
                        {/* {config.splitMethod === 'character' && config.splitCharacter && config.splitCharacter.length > 1 && (
                            <Form.Item>
                                <div style={{ 
                                    padding: '8px 12px', 
                                    backgroundColor: '#f6ffed', 
                                    borderRadius: '4px',
                                    border: '1px solid #b7eb8f',
                                    fontSize: '11px',
                                    color: '#52c41a'
                                }}>
                                    ✅ <strong>Ký tự phức tạp:</strong> <code>"{config.splitCharacter}"</code> sẽ được tìm kiếm ở mọi vị trí trong file, 
                                    không chỉ ở đầu dòng. Phù hợp cho JSON, XML, hoặc các định dạng có cấu trúc.
                                </div>
                            </Form.Item>
                        )} */}
                    </Form>
                </div>

                {/* Right Column - Preview */}
                <div style={{ flex: 1, minWidth: '400px', height: '100%' }}>
                    <div style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        padding: '16px',
                        height: '100%',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                        }}>
                            <h4 style={{ margin: 0, color: '#1890ff' }}>
                                📋 Kết quả cắt file ({previewChunks.length} đoạn)
                            </h4>

                            {/* Sort buttons */}
                            {previewChunks.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button
                                        size="small"
                                        type={sortOrder === 'original' ? 'primary' : 'default'}
                                        onClick={() => handleSortChange('original')}
                                        style={{ fontSize: '11px' }}
                                    >
                                        📄 Gốc
                                    </Button>
                                    <Button
                                        size="small"
                                        type={sortOrder === 'asc' ? 'primary' : 'default'}
                                        onClick={() => handleSortChange('asc')}
                                        style={{ fontSize: '11px' }}
                                    >
                                        ⬆️ Ngắn → Dài
                                    </Button>
                                    <Button
                                        size="small"
                                        type={sortOrder === 'desc' ? 'primary' : 'default'}
                                        onClick={() => handleSortChange('desc')}
                                        style={{ fontSize: '11px' }}
                                    >
                                        ⬇️ Dài → Ngắn
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Thống kê độ dài đoạn */}
                        {previewChunks.length > 0 && (
                            <div style={{
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: '#f6f8fa',
                                borderRadius: '6px',
                                border: '1px solid #e1e4e8'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                    gap: '12px',
                                    fontSize: '12px'
                                }}>
                                    <div>
                                        <strong>Dài nhất:</strong> {stats.max} ký tự
                                    </div>
                                    <div>
                                        <strong>Ngắn nhất:</strong> {stats.min} ký tự
                                    </div>
                                    <div>
                                        <strong>Trung bình:</strong> {Math.round(stats.average)} ký tự
                                    </div>
                                    <div>
                                        <strong>Tổng:</strong> {stats.total} ký tự
                                    </div>
                                    <div>
                                        <strong>Độ lệch chuẩn:</strong> {Math.round(stats.stdDev)} ký tự
                                    </div>
                                    <div>
                                        <strong>Đoạn &gt; 1000 ký tự:</strong> {stats.longChunks}
                                    </div>
                                </div>
                            </div>
                        )}

                        {previewChunks.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                color: '#999',
                                padding: '40px 0',
                                fontStyle: 'italic'
                            }}>
                                Nhấn "Xem trước kết quả cắt" để xem các đoạn được chia
                            </div>
                        ) : (
                            <div style={{ height: 'calc(100% - 150px)', overflow: 'auto' }}>
                                {getSortedChunks(previewChunks, sortOrder).map((chunk, index) => {
                                    const originalIndex = previewChunks.findIndex(c => c === chunk);
                                    const isSelectedForAI = config.config_for_ai.enabled && config.config_for_ai.selectedChunks.includes(originalIndex);
                                    
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                border: isSelectedForAI ? '2px solid #52c41a' : '1px solid #f0f0f0',
                                                borderRadius: '4px',
                                                padding: '12px',
                                                marginBottom: '12px',
                                                backgroundColor: isSelectedForAI ? '#f6ffed' : '#fafafa',
                                                position: 'relative'
                                            }}
                                        >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <strong style={{ color: '#1890ff' }}>
                                                    Đoạn {chunk.index}
                                                </strong>
                                                {sortOrder !== 'original' && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        color: '#999',
                                                        backgroundColor: '#f0f0f0',
                                                        padding: '2px 6px',
                                                        borderRadius: '8px'
                                                    }}>
                                                        #{index + 1}
                                                    </span>
                                                )}
                                                {isSelectedForAI && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        color: '#52c41a',
                                                        backgroundColor: '#f6ffed',
                                                        padding: '2px 6px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #b7eb8f',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '2px'
                                                    }}>
                                                        <Bot size={14}/> AI
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    onClick={() => handleTestAI(chunk)}
                                                    style={{ fontSize: '11px' }}
                                                >
                                                    🧪 Test AI
                                                </Button>
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#666',
                                                    backgroundColor: '#e6f7ff',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {chunk.content.length} ký tự
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{
                                            maxHeight: '300px',
                                            overflow: 'auto',
                                            fontSize: '12px',
                                            lineHeight: '1.4',
                                            color: '#333',
                                            backgroundColor: 'white',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #e8e8e8'
                                        }}>
                                            {chunk.content}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Test AI Result Modal */}
            <Modal
                title={`🧪 Kết quả test AI`}
                open={testAiModal.visible}
                onCancel={closeTestAiModal}
                footer={[
                    <Button key="close" onClick={closeTestAiModal}>
                        Đóng
                    </Button>
                ]}
                width={1000}
                centered
            >
                {testAiModal.loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '16px', color: '#666' }}>
                            Đang test AI...
                        </div>
                    </div>
                ) : testAiModal.result ? (
                    <div style={{ display: 'flex', gap: '20px', height: '70vh' }}>
                        {/* Original Content */}
                        <div style={{ flex: 1, minWidth: '400px' }}>
                            <h4 style={{ color: '#1890ff', marginBottom: '12px' }}>
                                📄 Nội dung gốc
                            </h4>
                            <div style={{
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                padding: '16px',
                                height: 'calc(100% - 50px)',
                                overflow: 'auto',
                                backgroundColor: '#fafafa'
                            }}>
                                <pre style={{
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    fontSize: '12px',
                                    lineHeight: '1.4',
                                    margin: 0,
                                    fontFamily: 'inherit'
                                }}>
                                    {testAiModal.result.original}
                                </pre>
                            </div>
                        </div>

                        {/* AI Result */}
                        <div style={{ flex: 1, minWidth: '400px' }}>
                            <h4 style={{ color: '#52c41a', marginBottom: '12px' }}>
                                🤖 Kết quả AI
                            </h4>
                            <div style={{
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                padding: '16px',
                                height: 'calc(100% - 50px)',
                                overflow: 'auto',
                                backgroundColor: '#f6ffed'
                            }}>
                                <div 
                                    dangerouslySetInnerHTML={{
                                        __html: marked(testAiModal.result.translated || 'Chưa có nội dung...', {
                                            headerIds: true,
                                            mangle: false
                                        })
                                    }}
                                    style={{
                                        fontSize: '12px',
                                        lineHeight: '1.4',
                                        color: '#333'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </Modal>
    );
};

export default ConfigModal;
