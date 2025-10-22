import React, { useState, useEffect, useContext } from 'react';
import {Mail, Save, Plus, Edit, Trash2, Eye, X, Check, AlertCircle, Sparkles, Loader2, Upload, Link, Paperclip } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Modal, Input, Button, Space, Card, Typography, Select, Tabs, Divider, Upload as AntUpload, List, Tag } from 'antd';
import { getSettingByType, updateSetting } from '../../../../apis/settingService.jsx';
import { getAllEmailTemplate, createNewEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '../../../../apis/emailTemplateService.jsx';
import { aiGen2 } from '../../../../apis/botService.jsx';
import { uploadFiles as uploadFilesService } from '../../../../apis/uploadManyFIleService.jsx';
import styles from './AutomatorTab.module.css';
import { marked } from 'marked';
import { MyContext } from '../../../../MyContext.jsx';
import { createTimestamp } from '../../../../generalFunction/format.js';

// Import modal components
import TemplateFormModal from './modals/TemplateFormModal';
import PreviewModal from './modals/PreviewModal';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import AIModal from './modals/AIModal';
import AttachmentModal from './modals/AttachmentModal';
import PreviewFile from '../../../../components/PreviewFile/PreviewFile';
import AIPreviewModal from './modals/AIPreviewModal';
import SenderManagementModal from './modals/SenderManagementModal';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const AutomatorTab = ({ refreshEmailTemplates }) => {
  const { currentUser } = useContext(MyContext);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [settingId, setSettingId] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSettings, setAiSettings] = useState(null);
  const [aiSettingsId, setAiSettingsId] = useState(null);
  const [activeTab, setActiveTab] = useState('prompt');
  const [attachments, setAttachments] = useState([]);
  const [attachmentsId, setAttachmentsId] = useState(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAIPreviewModal, setShowAIPreviewModal] = useState(false);
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [senders, setSenders] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    short_name: '',
    type: 'email_template',
    sender_email: ''
  });

  // Load templates from API
  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllEmailTemplate();

      // Xử lý dữ liệu từ API mới

      setTemplates(data);
    } catch (error) {
      console.error('Lỗi khi tải templates:', error);
      setError('Không thể tải danh sách templates. Vui lòng thử lại.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Load templates and AI settings on component mount
  useEffect(() => {
    loadTemplates();
    loadAISettings();
    loadSenders();
  }, []);


  useEffect(() => {
    if (showAttachmentModal || showAIModal) {
      loadAttachments();
    }
  }, [showAttachmentModal, showAIModal]);

  // Load AI settings from setting
  const loadAISettings = async () => {
    try {
      const data = await getSettingByType('AI_EMAIL_SETTINGS');
      if (data) {
        setAiSettings(data?.setting);
        setAiSettingsId(data.id);
      }
    } catch (error) {
      console.error('Lỗi khi tải AI settings:', error);
    }
  };

  // Load senders from setting
  const loadSenders = async () => {
    try {
      const data = await getSettingByType('EMAIL_SENDERS');
      if (data) {
        setSenders(data?.setting || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải senders:', error);
    }
  };

  // Load attachments from setting
  const loadAttachments = async () => {
    try {
      const data = await getSettingByType('EMAIL_ATTACHMENTS');
      if (data) {
        setAttachments(data?.setting || []);
        setAttachmentsId(data.id);
      }
    } catch (error) {
      console.error('Lỗi khi tải attachments:', error);
    }
  };

  // Save attachments
  const saveAttachments = async (newAttachments) => {
    try {
      await updateSetting({
        id: attachmentsId,
        type: 'EMAIL_ATTACHMENTS',
        setting: newAttachments
      });
      setAttachments(newAttachments);
      setSuccess('Đã lưu đính kèm thành công!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Lỗi khi lưu attachments:', error);
      setError('Lỗi khi lưu đính kèm. Vui lòng thử lại.');
    }
  };

  // Save AI settings
  const saveAISettings = async () => {
    try {
      await updateSetting({
        id: aiSettingsId, // ID của bản ghi setting
        type: 'AI_EMAIL_SETTINGS',
        setting: aiSettings
      });

      setSuccess('Đã lưu AI settings thành công!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Lỗi khi lưu AI settings:', error);
      setError('Lỗi khi lưu AI settings. Vui lòng thử lại.');
    }
  };

  // Handle form input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save template
  const handleSaveTemplate = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validation
      if (!formData.name.trim() || !formData.subject.trim()) {
        setError('Vui lòng nhập đầy đủ tên template và tiêu đề email.');
        return;
      }

      // Lấy danh sách templates hiện tại
      let currentTemplates = [...templates];

      // Lưu dữ liệu sử dụng API mới
      if (editingTemplate) {
        // Cập nhật template hiện có kèm user_update và updated_at
        await updateEmailTemplate({
          id: editingTemplate.id,
          ...formData,
          user_update: currentUser?.email,
          updated_at: createTimestamp(),
        });
        
        // Cập nhật template trong state local
        const index = currentTemplates.findIndex(t => t.id === editingTemplate.id);
        if (index !== -1) {
          currentTemplates[index] = {
            ...currentTemplates[index],
            ...formData
          };
        }
      } else {
        // Tạo template mới kèm user_create và created_at
        const payload = {
          ...formData,
          user_create: currentUser?.email,
          created_at: createTimestamp(),
        };
        const newTemplate = await createNewEmailTemplate(payload);
        // Đẩy phần tử mới trả về vào danh sách (tùy API trả data)
        const created = newTemplate?.data || newTemplate;
        if (created) {
          currentTemplates.push(created);
        }
      }

      // Cập nhật state local
      setTemplates(currentTemplates);

      // Reset form
      setFormData({
        name: '',
        subject: '',
        content: '',
        short_name: '',
        type: 'email_template',
        sender_email: ''
      });
      setEditingTemplate(null);
      setShowForm(false);
      setSuccess(editingTemplate ? 'Cập nhật template thành công!' : 'Tạo template mới thành công!');

      // Refresh email templates in CRM data
      if (refreshEmailTemplates) {
        refreshEmailTemplates();
      }

      // Auto hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Lỗi khi lưu template:', error);
      setError('Lỗi khi lưu template. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Edit template
  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      subject: template.subject || '',
      content: template.content || '',
      short_name: template.short_name || '',
      type: template.type || 'email_template',
      sender_email: template.sender_email || ''
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  // Show delete confirmation
  const handleDeleteClick = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setTemplateToDelete(template);
    setShowDeleteConfirm(true);
  };

  // Confirm delete template
  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Xóa template sử dụng API mới
      await deleteEmailTemplate(templateToDelete.id);

      // Cập nhật state local
      const updatedTemplates = templates.filter(t => t.id !== templateToDelete.id);
      setTemplates(updatedTemplates);
      setSuccess('Xóa template thành công!');

      // Refresh email templates in CRM data
      if (refreshEmailTemplates) {
        refreshEmailTemplates();
      }

      // Auto hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Lỗi khi xóa template:', error);
      setError('Lỗi khi xóa template. Vui lòng thử lại.');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
      setTemplateToDelete(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setTemplateToDelete(null);
  };

  // Cancel form
  const handleCancel = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      short_name: '',
      type: 'email_template',
      sender_email: ''
    });
    setEditingTemplate(null);
    setShowForm(false);
    setError(null);
    setSuccess(null);
  };

  // Preview template
  const handlePreviewTemplate = (template) => {
    setFormData({
      name: template.name || '',
      subject: template.subject || '',
      content: template.content || '',
      short_name: template.short_name || '',
      type: template.type || 'email_template',
      sender_email: template.sender_email || ''
    });
    setShowPreview(true);
  };

  // Handle file upload - xử lý multiple files
  const handleFileUpload = async (file, fileList) => {
    console.log('handleFileUpload called with file:', file);
    console.log('handleFileUpload called with fileList:', fileList);

    try {
      setUploading(true);
      setError(null);

      // Lấy tất cả files từ fileList
      const filesToUpload = fileList.map(item => item.originFileObj || item);
      console.log('Files to upload:', filesToUpload);

      // Upload files lên server
      const uploadResponse = await uploadFilesService(filesToUpload);
      console.log('Upload response:', uploadResponse);

      if (uploadResponse && uploadResponse.files && uploadResponse.files.length > 0) {
        const newAttachments = uploadResponse.files.map((uploadedFile, index) => {
          const originalFile = filesToUpload[index];
          return {
            id: uuidv4(),
            name: uploadedFile.fileName || originalFile.name,
            url: uploadedFile.fileUrl,
            type: originalFile.type,
            size: originalFile.size,
            uploadedAt: new Date().toISOString()
          };
        });

        const updatedAttachments = [...attachments, ...newAttachments];
        await saveAttachments(updatedAttachments);

        const fileNames = newAttachments.map(att => att.name).join(', ');
        setSuccess(`Upload thành công ${newAttachments.length} file: ${fileNames}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Không nhận được response từ server');
      }
    } catch (error) {
      console.error('Lỗi khi upload file:', error);
      setError(`Lỗi khi upload file. Vui lòng thử lại.`);
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload
  };

  // Delete attachment
  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
      await saveAttachments(updatedAttachments);
    } catch (error) {
      console.error('Lỗi khi xóa attachment:', error);
      setError('Lỗi khi xóa đính kèm. Vui lòng thử lại.');
    }
  };

  // Toggle attachment selection
  const handleToggleAttachment = (attachmentId) => {
    setSelectedAttachments(prev => {
      if (prev.includes(attachmentId)) {
        return prev.filter(id => id !== attachmentId);
      } else {
        return [...prev, attachmentId];
      }
    });
  };

  // Preview file
  const handlePreviewFile = (attachment) => {
    setPreviewFile(attachment);
    setShowPreviewModal(true);
  };

  // Preview AI generated content
  const handlePreviewAIContent = () => {
    setShowAIPreviewModal(true);
  };

  // AI Generate Content
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError('Vui lòng nhập yêu cầu để AI tạo content!');
      return;
    }

    try {
      setAiGenerating(true);
      setError(null);

      // Tạo prompt với thông tin đính kèm
      let fullPrompt = `Tạo nội dung email với yêu cầu: ${aiPrompt}`;

      if (selectedAttachments.length > 0) {
        const selectedFiles = attachments.filter(att => selectedAttachments.includes(att.id));
        fullPrompt += `\n\nTài liệu đính kèm:`;
        selectedFiles.forEach(file => {
          fullPrompt += `\n- ${file.name} (${file.type}): ${file.url}`;
        });
      }

      const aiResponse = await aiGen2(
        fullPrompt,
        aiSettings.systemMessage,
        aiSettings.model,
        'text'
      );

      // Lấy kết quả từ AI
      const generatedContent = aiResponse?.data || aiResponse?.result || aiResponse?.content || aiResponse || '';

      if (generatedContent) {
        // Cập nhật content vào form
        setFormData(prev => ({
          ...prev,
          content: generatedContent
        }));

        setSuccess('AI đã tạo content thành công!');
        setShowAIModal(false);
        setSelectedAttachments([]);

        // Auto hide success message
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('AI không thể tạo content. Vui lòng thử lại với yêu cầu khác.');
      }
    } catch (error) {
      console.error('Lỗi khi AI tạo content:', error);
      setError('Lỗi khi AI tạo content. Vui lòng thử lại.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Open AI Modal
  const handleOpenAIModal = () => {
    setShowAIModal(true);
    setError(null);
  };

  // Close AI Modal
  const handleCloseAIModal = () => {
    setShowAIModal(false);
    setSelectedAttachments([]);
    setError(null);
  };

  return (
    <div className={styles.automatorContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Quản lý Email Templates</h2>
          <p className={styles.subtitle}>Tạo và quản lý các mẫu email tự động</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowSenderModal(true)}
            className={styles.addButton}
            style={{ backgroundColor: '#722ed1' }}
          >
            <Mail size={16} />
            Quản lý Sender
          </button>
          <button
            onClick={() => setShowAttachmentModal(true)}
            className={styles.addButton}
            style={{ backgroundColor: '#52c41a' }}
          >
            <Paperclip size={16} />
            Quản lý Đính kèm
          </button>
          <button
            onClick={() => setShowForm(true)}
            className={styles.addButton}
            disabled={saving}
          >
            <Plus size={16} />
            Thêm Template
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className={styles.alertError}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.closeAlert}>
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className={styles.alertSuccess}>
          <Check size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className={styles.closeAlert}>
            <X size={14} />
          </button>
        </div>
      )}
      {/* File Preview Modal */}
      {
        showPreviewModal && (<Modal
          title={`Preview: ${previewFile?.name || 'File'}`}
          open={showPreviewModal}
          onCancel={() => {
            setShowPreviewModal(false);
            setPreviewFile(null);
          }}
          footer={null}
          width="90%"
          style={{ top: 20 }}
          bodyStyle={{ padding: 0, height: '80vh' }}
        >
          {previewFile && (
            <PreviewFile
              fileUrl={previewFile.url}
              fileName={previewFile.name}
              showHeader={false}
              showDownload={true}
              height="100%"
            />
          )}
        </Modal>
        )
      }


      {/* Template Form */}
      <TemplateFormModal
        showForm={showForm}
        onCancel={handleCancel}
        onSave={handleSaveTemplate}
        editingTemplate={editingTemplate}
        saving={saving}
        formData={formData}
        onInputChange={handleInputChange}
        onPreviewAIContent={handlePreviewAIContent}
        onOpenAIModal={handleOpenAIModal}
        aiGenerating={aiGenerating}
        senders={senders}
      />

      {/* Preview Modal */}
      <PreviewModal
        showPreview={showPreview}
        onClose={() => setShowPreview(false)}
        formData={formData}
      />

      {/* Templates List */}
      <div className={styles.templatesCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            Danh sách Templates
            <span className={styles.templateCount}>
              ({Array.isArray(templates) ? templates.length : 0})
            </span>
          </h3>
          {templates.length > 0 && (
            <button
              onClick={loadTemplates}
              className={styles.refreshButton}
              disabled={loading}
            >
              Làm mới
            </button>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải templates...</p>
          </div>
        ) : !Array.isArray(templates) || templates.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📧</div>
            <h4>Chưa có template nào</h4>
            <p>Hãy tạo template đầu tiên để bắt đầu sử dụng tính năng email tự động!</p>
            <button
              onClick={() => setShowForm(true)}
              className={styles.createFirstButton}
            >
              <Plus size={16} />
              Tạo Template Đầu Tiên
            </button>
          </div>
        ) : (
          <div className={styles.templatesList}>
            {templates.map((template) => (
              <div key={template.id} className={styles.templateItem}>
                <div className={styles.templateInfo}>
                  <div className={styles.templateHeader}>
                    <h4 className={styles.templateName}>
                      {template.name || 'Unnamed Template'}
                    </h4>
                    <span className={styles.templateType}>Email Template</span>
                  </div>

                  <div className={styles.templateDetails}>
                    <div className={styles.templateField}>
                      <span className={styles.fieldLabel}>Tiêu đề:</span>
                      <span className={styles.fieldValue}>
                        {template.subject || 'Chưa có tiêu đề'}
                      </span>
                    </div>

                    {template.short_name && (
                      <div className={styles.templateField}>
                        <span className={styles.fieldLabel}>Tên rút gọn:</span>
                        <span className={styles.fieldValue} style={{ color: '#1890ff', fontWeight: '500' }}>
                          {template.short_name}
                        </span>
                      </div>
                    )}

                    {template.sender_email && (
                      <div className={styles.templateField}>
                        <span className={styles.fieldLabel}>Sender:</span>
                        <span className={styles.fieldValue} style={{ color: '#722ed1', fontWeight: '500' }}>
                          {template.sender_email}
                        </span>
                      </div>
                    )}

                    <div className={styles.templateField}>
                      <span className={styles.fieldLabel}>Nội dung:</span>
                      <span className={styles.fieldValue}>
                        {template.content
                          ? `${template.content.substring(0, 80)}${template.content.length > 80 ? '...' : ''}`
                          : 'Chưa có nội dung'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.templateActions}>
                  <button
                    onClick={() => handlePreviewTemplate(template)}
                    className={styles.previewButton}
                    title="Xem trước"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className={styles.editButton}
                    title="Chỉnh sửa"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(template.id)}
                    className={styles.deleteButton}
                    title="Xóa"
                    disabled={saving}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        showDeleteConfirm={showDeleteConfirm}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        templateToDelete={templateToDelete}
        saving={saving}
      />

      {/* AI Generate Modal */}
      <AIModal
        showAIModal={showAIModal}
        onClose={handleCloseAIModal}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        aiPrompt={aiPrompt}
        onPromptChange={setAiPrompt}
        attachments={attachments}
        selectedAttachments={selectedAttachments}
        onToggleAttachment={handleToggleAttachment}
        onGenerate={handleAIGenerate}
        aiGenerating={aiGenerating}
        aiSettings={aiSettings}
        onSettingsChange={setAiSettings}
        onSaveSettings={saveAISettings}
        onPreviewFile={handlePreviewFile}
      />

      {/* Attachment Management Modal */}
      <AttachmentModal
        showAttachmentModal={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        attachments={attachments}
        uploading={uploading}
        onFileUpload={handleFileUpload}
        onDeleteAttachment={handleDeleteAttachment}
        onPreviewFile={handlePreviewFile}
      />



      {/* AI Content Preview Modal */}
      <AIPreviewModal
        showAIPreviewModal={showAIPreviewModal}
        onClose={() => setShowAIPreviewModal(false)}
        formData={formData}
      />

      {/* Sender Management Modal */}
      <SenderManagementModal
        showSenderModal={showSenderModal}
        onClose={() => setShowSenderModal(false)}
        
      />
    </div>
  );
};

export default AutomatorTab;
