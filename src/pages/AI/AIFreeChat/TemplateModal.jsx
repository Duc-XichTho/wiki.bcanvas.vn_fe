import { Modal, Input, Button, message, Popconfirm } from 'antd';
import { useState, useEffect } from 'react';
import { createSetting, getSettingByType, updateSetting } from '../../../apis/settingService.jsx';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import css from './TemplateModal.module.css';
import { v4 as uuidv4 } from 'uuid';

const TEMPLATE_SETTING_TYPE = 'AI_FREE_CHAT_TEMPLATE_QUESTIONS';

export default function TemplateModal({ isOpen, onClose, onSelectTemplate, currentUser }) {
    const [templates, setTemplates] = useState([]);
    const [newTemplate, setNewTemplate] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [settingId, setSettingId] = useState(null);
    const [editingTemplate, setEditingTemplate] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        try {
            const data = await getSettingByType(TEMPLATE_SETTING_TYPE);
            if (data) {
                setTemplates(data.setting || []);
                setSettingId(data.id);
            } else {
                setTemplates([]);
                setSettingId(null);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            message.error('Không thể tải danh sách mẫu câu hỏi');
        }
    };

    const handleAddTemplate = async () => {
        if (!newTemplate.trim()) {
            message.warning('Vui lòng nhập câu hỏi mẫu');
            return;
        }

        if (!currentUser?.isAdmin) {
            message.error('Chỉ quản trị viên mới có thể thêm mẫu câu hỏi');
            return;
        }

        try {
            const newTemplateObj = {
                id: uuidv4(),
                question: newTemplate.trim(),
                createdAt: new Date().toISOString(),
                createdBy: currentUser.email
            };

            const updatedTemplates = [...templates, newTemplateObj];

            if (settingId) {
                await updateSetting({
                    id: settingId,
                    type: TEMPLATE_SETTING_TYPE,
                    setting: updatedTemplates
                });
            } else {
                const response = await createSetting({
                    type: TEMPLATE_SETTING_TYPE,
                    setting: updatedTemplates
                });
                setSettingId(response.id);
            }

            setTemplates(updatedTemplates);
            setNewTemplate('');
            message.success('Đã thêm mẫu câu hỏi thành công');
        } catch (error) {
            console.error('Error adding template:', error);
            message.error('Không thể thêm mẫu câu hỏi');
        }
    };

    const handleEditTemplate = async (template) => {
        if (!currentUser?.isAdmin) {
            message.error('Chỉ quản trị viên mới có thể chỉnh sửa mẫu câu hỏi');
            return;
        }

        try {
            const updatedTemplates = templates.map(t =>
                t.id === template.id ? { ...t, question: editingTemplate.question } : t
            );

            await updateSetting({
                id: settingId,
                type: TEMPLATE_SETTING_TYPE,
                setting: updatedTemplates
            });

            setTemplates(updatedTemplates);
            setEditingTemplate(null);
            message.success('Đã cập nhật mẫu câu hỏi thành công');
        } catch (error) {
            console.error('Error updating template:', error);
            message.error('Không thể cập nhật mẫu câu hỏi');
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (!currentUser?.isAdmin) {
            message.error('Chỉ quản trị viên mới có thể xóa mẫu câu hỏi');
            return;
        }

        try {
            const updatedTemplates = templates.filter(t => t.id !== templateId);

            await updateSetting({
                id: settingId,
                type: TEMPLATE_SETTING_TYPE,
                setting: updatedTemplates
            });

            setTemplates(updatedTemplates);
            if (selectedTemplate?.id === templateId) {
                setSelectedTemplate(null);
            }
            message.success('Đã xóa mẫu câu hỏi thành công');
        } catch (error) {
            console.error('Error deleting template:', error);
            message.error('Không thể xóa mẫu câu hỏi');
        }
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template.id === selectedTemplate?.id ? null : template);
    };

    const handleApplyTemplate = () => {
        if (selectedTemplate) {
            onSelectTemplate(selectedTemplate.question);
            onClose();
        }
    };

    return (
        <Modal
            title="Mẫu câu hỏi"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={1200}
        >
            <div className={css.templateContainer}>
                <div className={css.templateList}>
                    <div className={css.templateListHeader}>
                        <div className={css.templateListTitle}>Danh sách mẫu câu hỏi</div>
                        <div className={css.templateCount}>{templates.length} mẫu</div>
                    </div>
                    {templates.map(template => (
                        <div 
                            key={template.id}
                            className={`${css.templateItem} ${selectedTemplate?.id === template.id ? css.selected : ''}`}
                            onClick={() => handleSelectTemplate(template)}
                        >
                            <div className={css.templateQuestion}>
                                {editingTemplate?.id === template.id ? (
                                    <Input.TextArea
                                        value={editingTemplate.question}
                                        onChange={e => setEditingTemplate({
                                            ...editingTemplate,
                                            question: e.target.value
                                        })}
                                        autoSize={{ minRows: 2 }}
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : (
                                    template.question
                                )}
                            </div>
                            <div className={css.templateMeta}>
                                <span>
                                    Thêm bởi {template.createdBy} vào{' '}
                                    {new Date(template.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                                {currentUser?.isAdmin && (
                                    <div className={css.templateActions} onClick={e => e.stopPropagation()}>
                                        {editingTemplate?.id === template.id ? (
                                            <>
                                                <Button 
                                                    type="primary" 
                                                    size="small"
                                                    onClick={() => handleEditTemplate(template)}
                                                >
                                                    Lưu
                                                </Button>
                                                <Button 
                                                    size="small"
                                                    onClick={() => setEditingTemplate(null)}
                                                >
                                                    Hủy
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    className={`${css.actionButton} ${css.editButton}`}
                                                    onClick={() => setEditingTemplate(template)}
                                                />
                                                <Popconfirm
                                                    title="Xóa mẫu câu hỏi"
                                                    description="Bạn có chắc chắn muốn xóa mẫu câu hỏi này?"
                                                    onConfirm={() => handleDeleteTemplate(template.id)}
                                                    okText="Có"
                                                    cancelText="Không"
                                                >
                                                    <Button
                                                        type="text"
                                                        icon={<DeleteOutlined />}
                                                        className={`${css.actionButton} ${css.deleteButton}`}
                                                    />
                                                </Popconfirm>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {currentUser?.isAdmin && (
                    <div className={css.addTemplateSection}>
                        <div className={css.addTemplateHeader}>Thêm mẫu câu hỏi mới</div>
                        <div className={css.templateInput}>
                            <Input.TextArea
                                value={newTemplate}
                                onChange={(e) => setNewTemplate(e.target.value)}
                                placeholder="Nhập mẫu câu hỏi mới..."
                                autoSize={{ minRows: 4 }}
                            />
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddTemplate}
                        >
                            Thêm mẫu
                        </Button>
                    </div>
                )}
            </div>

            <div className={css.modalFooter}>
                <Button onClick={onClose}>
                    Đóng
                </Button>
                <Button
                    type="primary"
                    onClick={handleApplyTemplate}
                    disabled={!selectedTemplate}
                >
                    Áp dụng
                </Button>
            </div>
        </Modal>
    );
} 