import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Col, ColorPicker, Divider, Form, Input, Modal, Popconfirm, Row, Space, Table, message } from 'antd';
import React, { useState } from 'react';
import { getSettingByType, updateSetting } from '../../apis/settingService';
import styles from './TagManagementModal.module.css';

const TagManagementModal = ({ visible, onClose, tagOptions, setTagOptions }) => {
    const [form] = Form.useForm();
    const [editingTag, setEditingTag] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Use tagOptions directly from parent component

    // Save tags to settings
    const saveTags = async () => {
        try {
            setSaving(true);
            const existing = await getSettingByType('TAG_MODULE_MANAGEMENT_SETTING');
            const settingData = {
                id: existing.id,
                type: 'TAG_MODULE_MANAGEMENT_SETTING',
                setting: tagOptions,
            };

            if (existing) {
                await updateSetting(settingData);
            }

            message.success('Đã lưu cài đặt tags thành công!');
        } catch (error) {
            console.error('Error saving tags:', error);
            message.error('Không thể lưu cài đặt tags');
        } finally {
            setSaving(false);
        }
    };

    // Add new tag
    const handleAddTag = () => {
        const newTag = {
            value: `tag-${Date.now()}`,
            label: '',
            color: '#1890ff',
            borderColor: '#1890ff',
            fillColor: '#e6f7ff',
            textColor: '#1890ff'
        };
        setTagOptions([...tagOptions, newTag]);
        setEditingTag(newTag.value);
    };

    // Update tag
    const handleUpdateTag = (tagId, field, value) => {
        setTagOptions(prev => prev.map(tag =>
            tag.value === tagId ? { ...tag, [field]: value } : tag
        ));
    };

    // Delete tag
    const handleDeleteTag = (tagId) => {
        setTagOptions(prev => prev.filter(tag => tag.value !== tagId));
        if (editingTag === tagId) {
            setEditingTag(null);
        }
    };

    // Start editing
    const handleEditTag = (tagId) => {
        setEditingTag(tagId);
    };

    // Stop editing
    const handleStopEdit = () => {
        setEditingTag(null);
    };

    // No need to load tags - using props from parent

    const columns = [
        {
            title: 'Tên Tag',
            dataIndex: 'label',
            key: 'label',
            render: (text, record) => (
                editingTag === record.value ? (
                    <Input
                        value={text}
                        onChange={(e) => handleUpdateTag(record.value, 'label', e.target.value)}
                        placeholder="Nhập tên tag"
                        size="small"
                    />
                ) : (
                    <span>{text || 'Chưa đặt tên'}</span>
                )
            ),
        },
        {
            title: 'Màu Border',
            dataIndex: 'borderColor',
            key: 'borderColor',
            width: 120,
            render: (color, record) => (
                <div className={styles.colorDisplay}>
                    <div
                        className={styles.colorPreview}
                        style={{ backgroundColor: color }}
                    />
                    {editingTag === record.value && (
                        <ColorPicker
                            value={color}
                            onChange={(color) => handleUpdateTag(record.value, 'borderColor', color.toHexString())}
                            size="small"
                        />
                    )}
                </div>
            ),
        },
        {
            title: 'Màu Fill',
            dataIndex: 'fillColor',
            key: 'fillColor',
            width: 120,
            render: (color, record) => (
                <div className={styles.colorDisplay}>
                    <div
                        className={styles.colorPreview}
                        style={{ backgroundColor: color }}
                    />
                    {editingTag === record.value && (
                        <ColorPicker
                            value={color}
                            onChange={(color) => handleUpdateTag(record.value, 'fillColor', color.toHexString())}
                            size="small"
                        />
                    )}
                </div>
            ),
        },
        {
            title: 'Màu Text',
            dataIndex: 'textColor',
            key: 'textColor',
            width: 120,
            render: (color, record) => (
                <div className={styles.colorDisplay}>
                    <div
                        className={styles.colorPreview}
                        style={{ backgroundColor: color }}
                    />
                    {editingTag === record.value && (
                        <ColorPicker
                            value={color}
                            onChange={(color) => handleUpdateTag(record.value, 'textColor', color.toHexString())}
                            size="small"
                        />
                    )}
                </div>
            ),
        },
     
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    {editingTag === record.value ? (
                        <Button
                            type="primary"
                            size="small"
                            icon={<SaveOutlined />}
                            onClick={handleStopEdit}
                        >
                            Lưu
                        </Button>
                    ) : (
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditTag(record.value)}
                        >
                            Sửa
                        </Button>
                    )}
                    <Popconfirm
                        title="Xóa tag"
                        description="Bạn có chắc chắn muốn xóa tag này?"
                        onConfirm={() => handleDeleteTag(record.value)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Modal
            title={<div>
                Quản lý Tag Module  
                <Button key="add" type="dashed" icon={<PlusOutlined />} onClick={handleAddTag}>
                    Thêm Tag
                </Button>
            </div>
            }
            open={visible}
            onCancel={onClose}
            width={1200}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Hủy
                </Button>,

                <Button key="save" type="primary" loading={saving} onClick={saveTags}>
                    Lưu Cài Đặt
                </Button>,
            ]}
            destroyOnClose
        >
            <div className={styles.modalContent}>
                <Card title="Danh sách Tags" className={styles.tagsCard}>
                    <Table
                        columns={columns}
                        dataSource={tagOptions}
                        rowKey="value"
                        loading={loading}
                        pagination={false}
                        size="small"
                        className={styles.tagsTable}
                    />
                </Card>

                <Divider />


            </div>
        </Modal>
    );
};

export default TagManagementModal;
