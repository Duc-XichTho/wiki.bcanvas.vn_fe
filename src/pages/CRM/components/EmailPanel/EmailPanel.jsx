import React, { useState, useEffect } from 'react';
import { Mail, Send, Calendar } from 'lucide-react';
import { getSettingByType } from '../../../../apis/settingService.jsx';
import { getAllEmailTemplate } from '../../../../apis/emailTemplateService.jsx';
import styles from './EmailPanel.module.css';

const EmailPanel = ({
  isVisible,
  onClose,
  emailSettings,
  onTemplateChange,
  onEmailSettingsChange,
  onSendEmail,
  selectedCustomers
}) => {
  const [templates, setTemplates] = useState([]);
  const [senders, setSenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  
  // Load templates from API
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAllEmailTemplate();
      setTemplates(data || []);
    } catch (error) {
      console.error('Lỗi khi tải templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
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
      setSenders([]);
    }
  };

  // Load templates and senders when panel opens
  useEffect(() => {
    if (isVisible) {
      loadTemplates();
      loadSenders();
    }
  }, [isVisible]);

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    const selectedTemplate = templates.find(t => t.id == templateId);
    console.log('Selected template:', selectedTemplate);
    if (selectedTemplate) {
      // Auto-fill subject, content, short_name, and sender_email from selected template
      onEmailSettingsChange('subject', selectedTemplate.subject || '');
      onEmailSettingsChange('template', selectedTemplate.content || '');
      onEmailSettingsChange('shortName', selectedTemplate.short_name || '');
      
      // Debug sender_email
      console.log('Template sender_email:', selectedTemplate.sender_email);
      onEmailSettingsChange('senderEmail', selectedTemplate.sender_email || '');
    }
    onTemplateChange(templateId);
  };

  // Handle send email with loading state
  const handleSendEmail = async () => {
    try {
      setSending(true);
      await onSendEmail();
      // Close panel on success
      if (typeof onClose === 'function') onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSending(false);
    }
  };

  // Extract variables from current content
  const getVariablesFromContent = () => {
    const content = emailSettings.template || '';
    const variableRegex = /\{\{[^}]+\}\}/g;
    const matches = content.match(variableRegex);
    return matches ? [...new Set(matches)] : []; // Remove duplicates
  };

  // Handle variable click to jump to position in textarea
  const handleVariableClick = (variable) => {
    const textarea = document.querySelector(`.${styles.textarea}`);
    if (textarea) {
      const content = emailSettings.template;
      const variableIndex = content.indexOf(variable);

      if (variableIndex !== -1) {
        // Focus textarea first
        textarea.focus();

        // Set selection range to highlight the variable
        textarea.setSelectionRange(variableIndex, variableIndex + variable.length);

        // Scroll to the variable position
        const textareaHeight = textarea.clientHeight;
        const lineHeight = 20; // Approximate line height
        const variableLine = Math.floor(variableIndex / 50); // Approximate characters per line
        const targetScrollTop = variableLine * lineHeight - textareaHeight / 2;

        textarea.scrollTop = Math.max(0, targetScrollTop);

        // Force a re-render to ensure the selection is visible
        setTimeout(() => {
          textarea.blur();
          textarea.focus();
        }, 10);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>
            <Mail size={20} />
            Email Campaign
          </h3>
          <button onClick={onClose} className={styles.closeBtn}>
            ×
          </button>
        </div>

        <div className={styles.panelContent}>
          <div className={styles.contentLayout}>
            {/* Left side - Content */}
            <div className={styles.contentSide}>
              <div className={styles.settingsGrid}>
                <div className={styles.settingGroup}>
                  <label className={styles.label}>Email Template</label>
                  <select
                    value={emailSettings.templateId || ''}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className={styles.select}
                    disabled={loading}
                  >
                    <option value="">Chọn template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template?.name || 'Unnamed Template'}
                      </option>
                    ))}
                  </select>
                  {loading && <div className={styles.loadingText}>Đang tải templates...</div>}
                </div>

                <div className={styles.settingGroup}>
                  <label className={styles.label}>Schedule</label>
                  <select
                    value={emailSettings.schedule}
                    onChange={(e) => onEmailSettingsChange('schedule', e.target.value)}
                    className={styles.select}
                  >
                    <option value="immediate">Send Now</option>
                    <option value="scheduled">Schedule</option>
                  </select>
                </div>
              </div>

              {emailSettings.schedule === 'scheduled' && (
                <div className={styles.scheduleGroup}>
                  <label className={styles.label}>
                    <Calendar size={16} />
                    Schedule Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={emailSettings.scheduleDate}
                    onChange={(e) => onEmailSettingsChange('scheduleDate', e.target.value)}
                    className={styles.datetimeInput}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                  <div className={styles.helpText}>
                    Chọn thời gian trong tương lai để lên lịch gửi email
                  </div>
                </div>
              )}

              <div className={styles.subjectGroup}>
                <label className={styles.label}>Email Subject</label>
                <input
                  type="text"
                  value={emailSettings.subject}
                  onChange={(e) => onEmailSettingsChange('subject', e.target.value)}
                  className={styles.input}
                  placeholder="Enter email subject"
                />
              </div>

              <div className={styles.subjectGroup}>
                <label className={styles.label}>Short Name (for Email History)</label>
                <input
                  type="text"
                  value={emailSettings.shortName || ''}
                  onChange={(e) => onEmailSettingsChange('shortName', e.target.value)}
                  className={styles.input}
                  placeholder="Enter short name (e.g., Welcome, Follow-up, etc.)"
                />
                <div className={styles.helpText}>
                  Tên rút gọn sẽ hiển thị trong Email History thay vì thời gian
                </div>
              </div>

              <div className={styles.subjectGroup}>
                <label className={styles.label}>Sender Email <span style={{ color: 'red' }}>*</span></label>
                <select
                  value={emailSettings.senderEmail || ''}
                  onChange={(e) => onEmailSettingsChange('senderEmail', e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="">Chọn sender email...</option>
                  {senders
                    .filter(sender => sender.email && sender.app_password)
                    .map(sender => (
                      <option key={sender.id} value={sender.email}>
                        {sender.email}
                      </option>
                    ))}
                </select>
                <div className={styles.helpText}>
                  Chọn sender email để gửi email này
                </div>
              </div>

              <div className={styles.templateGroup}>
                <label className={styles.label}>Email Content</label>
                <div className={styles.templateVariables}>
                  <small className={styles.variablesLabel}>
                    Variables in content (click to jump to position):

                  </small>
                  <div className={styles.variablesList}>
                    {getVariablesFromContent().length > 0 ? (
                      getVariablesFromContent().map((variable, index) => (
                        <code
                          key={index}
                          onClick={() => handleVariableClick(variable)}
                          title={`Jump to ${variable} in content`}
                        >
                          {variable}
                        </code>
                      ))
                    ) : (
                      <span style={{ color: '#666', fontSize: '12px' }}>
                        No variables found in content
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#666', fontSize: '12px' , marginTop: '5px'}}>
                    Các trường variable cố định có sẵn: {'{{customer_name}}'}, {'{{customer_email}}'}, {'{{customer_phone}}'}, {'{{customer_company}}'}, {'{{customer_address}}, {{customer_date}}, {{customer_time}}'}. 
                  </p>
                  <p style={{ color: '#666', fontSize: '12px' , marginTop: '5px'}}>
                     Trường hợp tùy biến, cần liên hệ Developer.
                  </p>
                </div>
                <textarea
                  value={emailSettings.template}
                  onChange={(e) => onEmailSettingsChange('template', e.target.value)}
                  className={styles.textarea}
                  placeholder="Enter your email message..."
                  rows={12}
                />
              </div>
            </div>

            {/* Right side - Preview */}
            <div className={styles.previewSide}>
              <div className={styles.previewGroup}>
                <label className={styles.label}>Preview</label>
                <div className={styles.previewContent}>
                  <div className={styles.previewHeader}>
                    <strong>Subject:</strong> {emailSettings.subject || 'No subject'}
                  </div>
                  {emailSettings.shortName && (
                    <div className={styles.previewHeader}>
                      <strong>Short Name:</strong> {emailSettings.shortName}
                    </div>
                  )}
                  <div className={styles.previewBody}>
                    <iframe
                      srcDoc={emailSettings.template}
                      className={styles.previewIframe}
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.panelFooter}>
          <div className={styles.recipientInfo}>
            <span className={styles.recipientCount}>
              {selectedCustomers.length} recipients selected
            </span>
          </div>
          <div className={styles.panelActions}>
            <button onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={selectedCustomers.length === 0 || !emailSettings.subject || sending}
              className={styles.sendBtn}
            >
              {sending ? (
                <>
                  <div className={styles.spinner}></div>
                  {emailSettings.schedule === 'scheduled' ? 'Scheduling...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {emailSettings.schedule === 'scheduled' ? 'Schedule Email' : 'Send Email'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPanel;
