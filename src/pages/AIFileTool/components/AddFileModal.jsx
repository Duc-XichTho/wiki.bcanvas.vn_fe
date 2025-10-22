import React, { useState } from 'react';
import { Modal, Form, Upload, List, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { validateFile } from '../fileProcessingUtils';

const AddFileModal = ({ visible, onCancel, onConfirm, uploading }) => {
    const [files, setFiles] = useState([]);

    const handleFileChange = ({ fileList }) => {
        // Lọc ra các file có originFileObj (file mới được chọn)
        const allFiles = fileList
            .filter(file => file.originFileObj) // Chỉ lấy file có originFileObj (file mới)
            .map(file => file.originFileObj);

        // Nếu có file mới được thêm, thay thế toàn bộ danh sách
        if (allFiles.length > 0) {
            setFiles(allFiles);
        }
    };

    const handleRemoveFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        if (files.length === 0) {
            message.warning('Vui lòng chọn ít nhất một file');
            return;
        }
        onConfirm(files);
    };

    const handleCancel = () => {
        setFiles([]);
        onCancel();
    };

    return (
        <Modal
            title="Thêm file vào dataset"
            open={visible}
            onOk={handleConfirm}
            onCancel={handleCancel}
            okText="Thêm file"
            cancelText="Hủy"
            confirmLoading={uploading}
        >
            <Form layout="vertical">
                <Form.Item label="Chọn file (.docx, .txt)">
                    <Upload
                        multiple
                        beforeUpload={(file) => {
                            const allowedTypes = ['.docx', '.txt'];
                            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

                            if (!allowedTypes.includes(fileExtension)) {
                                message.error(`Chỉ cho phép file định dạng .docx và .txt. File ${file.name} không được hỗ trợ.`);
                                return false; // Reject file
                            }

                            return false; // Prevent auto upload
                        }}
                        onChange={handleFileChange}
                        showUploadList={false}
                    >
                        <Button icon={<UploadOutlined />}>Chọn file</Button>
                    </Upload>
                </Form.Item>

                {/* Selected Files List */}
                {files.length > 0 && (
                    <Form.Item label={`Danh sách file đã chọn (${files.length} file)`}>
                        <List
                            size="small"
                            dataSource={files}
                            renderItem={(file, index) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveFile(index)}
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
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

export default AddFileModal;