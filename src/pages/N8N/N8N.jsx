
import React, { useState } from 'react';
import { SiN8N } from "react-icons/si";
import { useNavigate } from 'react-router-dom';
import ProfileSelect from '../Home/SelectComponent/ProfileSelect.jsx';
import { BackCanvas } from '../../icon/svg/IconSvg.jsx';
import { useTheme } from '../../contexts/ThemeContext';

export default function N8N() {
  const navigate = useNavigate();
  const { Theme } = useTheme();
  const [iframeError, setIframeError] = useState(false);

  const handleGoBack = () => {
    navigate('/dashboard/app');
  };

  // Lấy token từ localStorage hoặc context nếu có
  const getAuthToken = () => {
    // Thay đổi này tùy thuộc vào cách bạn lưu trữ authentication token
    return localStorage.getItem('authToken') || localStorage.getItem('n8n_token');
  };

  const authToken = getAuthToken();
  const n8nUrl = authToken 
    ? `https://n8n.sab.io.vn?token=${authToken}`
    : 'https://n8n.sab.io.vn';

  const handleIframeError = () => {
    setIframeError(true);
  };

  const handleOpenInNewTab = () => {
    window.open('https://n8n.sab.io.vn', '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1000,
      background: 'white',
      animation: 'slideInFromRight 0.5s ease-out',
      overflow: 'hidden'
    }}>
      {/* N8N Minimal Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        background: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        height: '60px',
        boxSizing: 'border-box'
      }}>
        {/* Left side - Back button + N8N Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div
            onClick={handleGoBack}
            style={{
              width: '40px',
              height: '38px',
              backgroundColor: Theme === 'dark' ? 'transparent' : '#fff',
              borderRadius: '12px',
              boxShadow: Theme === 'dark' ? 'none' : '0 0 10px 0 rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (Theme === 'dark') {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              } else {
                e.target.style.backgroundColor = '#f8f9fa';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = Theme === 'dark' ? 'transparent' : '#fff';
            }}
          >
            <BackCanvas 
              height={Theme === 'dark' ? 25 : 20} 
              width={Theme === 'dark' ? 25 : 20} 
              color={Theme === 'dark' ? '#fff' : '#454545'}
            />
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#333',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            <SiN8N size={24} color="#ff6b35" />
            <span>N8N Workflow</span>
          </div>
        </div>

        {/* Right side - Profile Select */}
        <div>
          <ProfileSelect />
        </div>
      </div>

      {/* N8N iframe */}
      <div style={{
        height: 'calc(100vh - 60px)',
        width: '100%'
      }}>
        
        <iframe src="https://n8n.sab.io.vn" title="n8n-editor" width="100%" height="100%" style={{border: 'none'}} />
   
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}