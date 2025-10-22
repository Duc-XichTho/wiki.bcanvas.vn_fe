import { useEffect } from 'react';
import { message } from 'antd';

export const useMessageConfig = () => {
  useEffect(() => {
    // Cấu hình message toàn cục
    message.config({
      top: 100,
      right: 16,
      maxCount: 3,
      duration: 3,
      rtl: false,
      getContainer: () => document.body,
    });

    // Thêm CSS inline với độ ưu tiên cao nhất
    const styleId = 'antd-message-custom-style';
    let existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      existingStyle = document.createElement('style');
      existingStyle.id = styleId;
      document.head.appendChild(existingStyle);
    }

    existingStyle.textContent = `
      /* CSS mạnh nhất để ghi đè tất cả */
      body .ant-message,
      html .ant-message,
      #root .ant-message,
      .ant-message {
        position: fixed !important;
        top: 100px !important;
        right: 16px !important;
        left: auto !important;
        transform: none !important;
        -webkit-transform: none !important;
        -moz-transform: none !important;
        -ms-transform: none !important;
        z-index: 9999 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: auto !important;
        max-width: calc(100vw - 32px) !important;
      }
      
      body .ant-message .ant-message-notice,
      html .ant-message .ant-message-notice,
      #root .ant-message .ant-message-notice,
      .ant-message .ant-message-notice {
        margin-bottom: 8px !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        margin-top: 0 !important;
      }
      
      body .ant-message .ant-message-notice-content,
      html .ant-message .ant-message-notice-content,
      #root .ant-message .ant-message-notice-content,
      .ant-message .ant-message-notice-content {
        position: relative !important;
        display: flex !important;
        align-items: center !important;
        padding: 8px 12px !important;
        border-radius: 6px !important;
        box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05) !important;
        background: white !important;
      }
    `;

    return () => {
      // Cleanup khi component unmount
      if (existingStyle && existingStyle.parentNode) {
        existingStyle.parentNode.removeChild(existingStyle);
      }
    };
  }, []);
}; 