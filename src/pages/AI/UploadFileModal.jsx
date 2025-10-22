import React, { useState } from 'react';
import { Modal, Upload, Button, message, List, Progress, Typography } from 'antd';
import { UploadOutlined, FileExcelOutlined, DeleteOutlined } from '@ant-design/icons';
import { parseUploadedFiles, validateUploadedData } from './fileUploadUtils';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const UploadFileModal = ({ open, onClose, onFilesUploaded }) => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = ({ fileList: newFileList }) => {
        // Filter only CSV and Excel files
        const validFiles = newFileList.filter(file => {
            const fileName = file.name || file.originFileObj?.name || '';
            const extension = fileName.split('.').pop()?.toLowerCase();
            return ['csv', 'xlsx', 'xls'].includes(extension);
        });

        if (validFiles.length !== newFileList.length) {
            message.warning('Chỉ hỗ trợ file CSV và Excel (.xlsx, .xls)');
        }

        setFileList(validFiles);
    };

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning('Vui lòng chọn ít nhất một file để tải lên');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Extract file objects from fileList
            const files = fileList.map(file => file.originFileObj || file);
            
            // Parse files
            const parsedData = await parseUploadedFiles(files);
            
            // Validate data
            validateUploadedData(parsedData);
            
            // Simulate progress
            setUploadProgress(50);
            
            // Create files metadata for saving
            const filesMetadata = fileList.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                lastModified: file.lastModified || Date.now(),
                // Note: URL would be added here if files were uploaded to server
                // For now, we'll just save the metadata for local files
                url: null // This could be a download URL if files were uploaded to server
            }));
            
            // Return parsed data and files metadata to parent
            onFilesUploaded(parsedData, filesMetadata);
            
            setUploadProgress(100);
            message.success(`Đã tải lên và phân tích thành công ${fileList.length} file!`);
            
            // Reset state
            setFileList([]);
            setUploadProgress(0);
            onClose();
            
        } catch (error) {
            console.error('Error uploading files:', error);
            message.error(error.message || 'Lỗi khi tải lên file');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = (file) => {
        const newFileList = fileList.filter(item => item.uid !== file.uid);
        setFileList(newFileList);
    };

    const handleCancel = () => {
        setFileList([]);
        setUploadProgress(0);
        onClose();
    };

    const beforeUpload = (file) => {
        const fileName = file.name;
        const extension = fileName.split('.').pop()?.toLowerCase();
        
        if (!['csv', 'xlsx', 'xls'].includes(extension)) {
            message.error(`File ${fileName} không được hỗ trợ. Chỉ hỗ trợ CSV và Excel.`);
            return false;
        }

        // Check file size (limit to 50MB)
        const isLt50M = file.size / 1024 / 1024 < 50;
        if (!isLt50M) {
            message.error(`File ${fileName} quá lớn. Giới hạn 50MB.`);
            return false;
        }

        return false; // Prevent auto upload
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileExcelOutlined style={{ color: '#1890ff' }} />
                    Tải lên file để phân tích
                </div>
            }
            open={open}
            onCancel={handleCancel}
            width={700}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Hủy
                </Button>,
                <Button 
                    key="upload" 
                    type="primary" 
                    onClick={handleUpload}
                    loading={uploading}
                    disabled={fileList.length === 0}
                    icon={<UploadOutlined />}
                >
                    Sử dụng file này ({fileList.length} file)
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <Title level={5}>Chọn file CSV hoặc Excel để phân tích</Title>
                <Text type="secondary">
                    File sẽ được gắn liền với câu hỏi này. Hỗ trợ định dạng: .csv, .xlsx, .xls. 
                    Giới hạn kích thước: 50MB/file. Có thể tải lên nhiều file cùng lúc.
                </Text>
            </div>

            <Dragger
                multiple
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={beforeUpload}
                accept=".csv,.xlsx,.xls"
                style={{ marginBottom: 16 }}
            >
                <p className="ant-upload-drag-icon">
                    <FileExcelOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">
                    Kéo thả file vào đây hoặc nhấn để chọn file
                </p>
                <p className="ant-upload-hint">
                    Hỗ trợ file CSV và Excel (.xlsx, .xls)
                </p>
            </Dragger>

            {fileList.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <Title level={5}>File đã chọn ({fileList.length})</Title>
                    <List
                        size="small"
                        dataSource={fileList}
                        renderItem={file => (
                            <List.Item
                                actions={[
                                    <Button 
                                        type="text" 
                                        icon={<DeleteOutlined />} 
                                        onClick={() => handleRemoveFile(file)}
                                        danger
                                        size="small"
                                    />
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<FileExcelOutlined style={{ color: '#1890ff' }} />}
                                    title={file.name}
                                    description={`Kích thước: ${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            )}

            {uploading && (
                <div style={{ marginTop: 16 }}>
                    <Text>Đang xử lý file...</Text>
                    <Progress percent={uploadProgress} />
                </div>
            )}
        </Modal>
    );
};

export default UploadFileModal; 