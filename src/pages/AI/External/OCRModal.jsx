import { Button, Checkbox, List, message, Modal, Spin } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { updateFileChild } from '../../../apis/fileChildService.jsx';
import { uploadPdfFile } from '../../../apis/botService.jsx';
import { sendRequestEmbedDataFile } from '../../../apis/serviceApi/serviceApi.jsx';
import css from './ExternalAI.module.css';
import { MyContext } from '../../../MyContext.jsx';

export default function OCRModal({ fileListData , isOpen, onClose, onSuccess, onProcessingChange }) {
    const [fileList, setFileList] = useState([]);
    const [fileSelected, setFileSelected] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processingFiles, setProcessingFiles] = useState([]);
    const [currentBatch, setCurrentBatch] = useState([]);
    const { currentUser , loadData , setLoadData } = useContext(MyContext);

    useEffect(() => {
        fetchFileList();
    }, [fileListData]);

    useEffect(() => {
        onProcessingChange?.(processingFiles);
    }, [processingFiles]);

    async function fetchFileList() {
        try {
            let response = fileListData;
            response = response.filter(item => item.name.includes('.pdf') && !item.embed && item.show == true);
            if (Array.isArray(response)) {
                setFileList(response);
            }
        } catch (error) {
            console.error('Error fetching file list:', error);
        }
    }

    const handleFileSelect = (id) => {
        const newSelection = fileSelected.includes(id)
            ? fileSelected.filter(fileId => fileId !== id)
            : [...fileSelected, id];
        setFileSelected(newSelection);
    };

    const processFiles = async (files) => {
        setCurrentBatch(files);
        try {
            const results = [];
            for (const file of files) {
                try {
                    const response = await fetch(file.url);
                    const blob = await response.blob();
                    const fileObj = new File([blob], file.name, { type: 'application/pdf' });
                    const result = await uploadPdfFile(fileObj);
                    results.push({
                        id: file.id,
                        type: file.type,
                        name: file.name,
                        text: result.text,
                        url: file.url,
                    });
                } catch (error) {
                    setProcessingFiles(prev => prev.filter(f => f.id !== file.id));
                    message.error(`Lỗi khi xử lý OCR file "${file.name}"`);
                    console.error(`Error processing file ${file.name}:`, error);
                    return
                }
            }
            const invalidFiles = results.filter(file => !file.text || file.text.trim() === "");
            invalidFiles.forEach(file => {
                setProcessingFiles(prev => prev.filter(f => f.id !== file.id));
                message.error(`File "${file.name}" không có dữ liệu`);
            });
            const validFiles = results.filter(file => file.text && file.text.trim() !== "");

            if (validFiles.length > 0) {
                const data = await sendRequestEmbedDataFile(validFiles);
                if (data.success) {
                    for (const file of data.data.data) {
                        await updateFileChild({ ...file, embed: true });
                        setLoadData(!loadData)
                    }
                    message.success(`Đã OCR và embedding thành công ${validFiles.length} file`);
                }
            } else {
                message.warning("Không có file hợp lệ để gửi lên embedding");
            }
            setProcessingFiles(prev => prev.filter(f => !files.some(pf => pf.id === f.id)));
            setCurrentBatch([]);
            onSuccess?.();
            if (processingFiles.length === files.length) {
                setIsLoading(false);
                onClose();
            }
        } catch (error) {
            console.error('Error in processFiles:', error);
            message.error('Có lỗi xảy ra khi xử lý file');
            setProcessingFiles(prev => prev.filter(f => !files.some(pf => pf.id === f.id)));
            setCurrentBatch([]);
            if (processingFiles.length === files.length) {
                setIsLoading(false);
            }
        }
    };

    const handleOCR = async () => {
        if (fileSelected.length === 0) return;

        const selectedFiles = fileList.filter(file => fileSelected.includes(file.id));
        const alreadyProcessing = selectedFiles.some(file =>
            processingFiles.some(pf => pf.id === file.id)
        );

        if (alreadyProcessing) {
            message.warning('Một số file đang được xử lý, vui lòng chọn file khác');
            return;
        }

        setProcessingFiles(prev => [...prev, ...selectedFiles]);
        setFileSelected([]);

        if (!isLoading) {
            // setIsLoading(true);
        }
        onClose();
        processFiles(selectedFiles);
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>OCR File</span>
                    {processingFiles.length > 0 && (
                        <span style={{ color: '#1890ff', fontWeight: 500 }}>
                            Đang xử lý: {processingFiles.length} file
                        </span>
                    )}
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={handleOCR}
                    loading={isLoading}
                    disabled={fileSelected.length === 0}
                >
                    OCR các file đã chọn
                </Button>
            ]}
            width={800}
        >
            <div className={css.ocrModalContent}>
                <Spin spinning={isLoading}>
                    <List
                        dataSource={fileList}
                        renderItem={item => (
                            <div className={css.listFileItem} key={item.id}>
                                <div className={css.listFileItemTitle}>
                                    <div className={css.listFileItemName}>
                                        <Checkbox
                                            checked={fileSelected.includes(item.id)}
                                            onChange={() => handleFileSelect(item.id)}
                                            disabled={processingFiles.some(f => f.id === item.id)}
                                        />
                                        <span>{item.name}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                </Spin>
            </div>
        </Modal>
    );
} 