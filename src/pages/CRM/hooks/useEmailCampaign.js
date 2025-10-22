import React, { useState } from 'react';
import { scheduleEmailAdvanced   ,sendEmailImmediate, checkEmailStatus } from '../../../apis/emailSchedulerService';
import { message } from 'antd';

export const useEmailCampaign = (emailTemplates) => {
  const [emailSettings, setEmailSettings] = useState({
    templateId: '',
    subject:  '',
    template:  '',
    shortName:  '',
    senderEmail: '',
    schedule: 'immediate',
    scheduleDate: '',
    templates:  ''
  });

  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [sending, setSending] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [jobStatus, setJobStatus] = useState({});

  // Update email settings
  const updateEmailSettings = (field, value) => {
    setEmailSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle template change
  const handleTemplateChange = (templateId) => {
    const template = emailTemplates.find(t => t.id == templateId);
    console.log(template);
    if (template) {
      setEmailSettings(prev => ({
        ...prev,
        templateId: template.id,
        subject: template.subject,
        template: template.content,
        shortName: template.short_name || '',
        senderEmail: template.sender_email || ''
      }));
    }
  };

  // Send email campaign với advanced scheduling
  const sendEmailCampaign = async (selectedCustomers) => {
    if (selectedCustomers.length === 0) {
      message.warning('Vui lòng chọn ít nhất một khách hàng!');
      return;
    }

    if (!emailSettings.subject) {
      message.warning('Vui lòng nhập tiêu đề email!');
      return;
    }

    // Validate schedule date if scheduled
    if (emailSettings.schedule === 'scheduled') {
      if (!emailSettings.scheduleDate) {
        message.warning('Vui lòng chọn thời gian lên lịch!');
        return;
      }

      const scheduleDate = new Date(emailSettings.scheduleDate);
      const now = new Date();

      if (scheduleDate <= now) {
        message.error('Thời gian lên lịch phải trong tương lai!');
        return;
      }
    }

    try {
      setSending(true);

      const emailData = {
        customerIds: selectedCustomers.map(c => c.id),
        customerEmails: selectedCustomers.map(c => c.email),
        subject: emailSettings.subject,
        template: emailSettings.template,
        template_id: emailSettings.templateId, // Đảm bảo template_id được gửi
        templateId: emailSettings.templateId, // Giữ lại để tương thích
        shortName: emailSettings.shortName,
        senderEmail: emailSettings.senderEmail,
        schedule: emailSettings.schedule,
        scheduleDate: emailSettings.scheduleDate,
        metadata: {
          templateName: emailTemplates?.find(t => t.id === emailSettings.templateId)?.name || 'Custom',
          templateShortName: emailSettings.shortName,
          templateId: emailSettings.templateId, // Thêm vào metadata
          totalRecipients: selectedCustomers.length,
          createdAt: new Date().toISOString()
        }
      };

      let result;

      if (emailSettings.schedule === 'immediate') {
        // Gửi ngay với advanced service
        try {
          result = await sendEmailImmediate(emailData);
          message.success(`Email "${emailSettings.subject}" đã gửi thành công đến ${selectedCustomers.length} khách hàng!`);
          setShowEmailPanel(false);
        } catch (error) {
          message.error(`Email "${emailSettings.subject}" đã gửi thất bại đến ${selectedCustomers.length} khách hàng!`);
          // Fallback to old service
          console.warn('Advanced service failed, using fallback:', error);
        }
      } else {
        // Lên lịch với advanced service
        try {
          result = await scheduleEmailAdvanced(emailData);
          message.success(`Email "${emailSettings.subject}" đã được lên lịch gửi lúc ${new Date(emailSettings.scheduleDate).toLocaleString('vi-VN')}!`);
          setShowEmailPanel(false);

          // Thêm job vào danh sách theo dõi
          if (result.jobId) {
            setScheduledJobs(prev => [...prev, {
              id: result.jobId,
              subject: emailSettings.subject,
              scheduledAt: emailSettings.scheduleDate,
              recipients: selectedCustomers.length,
              status: 'scheduled'
            }]);
          }
        } catch (error) {
          // Fallback to old service
          console.warn('Advanced scheduling failed, using fallback:', error);
        }
      }
      
      // Close panel after successful send
      
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      message.error('Lỗi khi gửi email. Vui lòng thử lại!');
      throw error;
    }
  };

  // Toggle email panel
  const toggleEmailPanel = () => {
    setShowEmailPanel(!showEmailPanel);
  };

  // Check job status
  const checkJobStatus = async (jobId) => {
    try {
      const status = await checkEmailStatus(jobId);
      setJobStatus(prev => ({
        ...prev,
        [jobId]: status
      }));
      return status;
    } catch (error) {
      console.error('Error checking job status:', error);
      return null;
    }
  };

  // Monitor all scheduled jobs
  const monitorScheduledJobs = async () => {
    for (const job of scheduledJobs) {
      if (job.status === 'scheduled') {
        const status = await checkJobStatus(job.id);
        if (status && status.status === 'completed') {
          setScheduledJobs(prev => 
            prev.map(j => 
              j.id === job.id 
                ? { ...j, status: 'completed', completedAt: new Date() }
                : j
            )
          );
          message.success(`Email "${job.subject}" đã được gửi thành công!`);
        } else if (status && status.status === 'failed') {
          setScheduledJobs(prev => 
            prev.map(j => 
              j.id === job.id 
                ? { ...j, status: 'failed', failedAt: new Date() }
                : j
            )
          );
          message.error(`Email "${job.subject}" gửi thất bại!`);
        }
      }
    }
  };

  // Auto-monitor jobs every 30 seconds
  React.useEffect(() => {
    if (scheduledJobs.length > 0) {
      const interval = setInterval(monitorScheduledJobs, 30000);
      return () => clearInterval(interval);
    }
  }, [scheduledJobs]);

  return {
    emailSettings,
    showEmailPanel,
    sending,
    scheduledJobs,
    jobStatus,
    updateEmailSettings,
    handleTemplateChange,
    sendEmailCampaign,
    toggleEmailPanel,
    checkJobStatus,
    monitorScheduledJobs
  };
};
