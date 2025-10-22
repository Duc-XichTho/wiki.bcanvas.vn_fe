import { Button, Checkbox, List, message, Spin } from 'antd';
import { useState, useEffect } from 'react';
import { getAllFileChild, updateFileChild } from '../../../apis/fileChildService.jsx';
import { uploadPdfFile } from '../../../apis/botService.jsx';
import { sendRequestEmbedDataFile } from '../../../apis/serviceApi/serviceApi.jsx';
import css from './ExternalAI.module.css';

export default function FileOCRSettings() {
    const [fileList, setFileList] = useState([]);
    const [fileSelected, setFileSelected] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchFileList();
    }, []);

    async function fetchFileList() {
        try {
            let response = await getAllFileChild();
            response = response.filter(item => item.name.includes('.pdf'));
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

    const handleOCR = async () => {
        try {
            setIsLoading(true);
            const selectedFiles = fileList.filter(file => fileSelected.includes(file.id));
            const results = [];

            for (const file of selectedFiles) {
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
                    console.error(`Error processing file ${file.name}:`, error);
                }
            }
            const data = await sendRequestEmbedDataFile(results);
            if (data.success) {
                for (const file of data.data.data) {
                    await updateFileChild({ ...file, embed: true });
                }
                message.success('Embed thành công các file đã chọn');
                fetchFileList(); // Refresh the list after OCR
            }
        } catch (error) {
            console.error('Error in handleOCR:', error);
            message.error('Có lỗi xảy ra khi xử lý file');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={css.ocrSettings}>
            <h2>Cài đặt OCR File</h2>
            <div className={css.fileList}>
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
                                            disabled={item.embed}
                                        />
                                        <span>{item.name}</span>
                                    </div>
                                    <div className={css.listFileItemActions}>
                                        {item.embed && <span className={'chuGiai2'}>Đã Embed</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                </Spin>
            </div>
            <div className={css.ocrActions}>
                <Button 
                    type="primary" 
                    onClick={handleOCR}
                    loading={isLoading}
                    disabled={fileSelected.length === 0}
                >
                    OCR các file đã chọn
                </Button>
            </div>
        </div>
    );
} 