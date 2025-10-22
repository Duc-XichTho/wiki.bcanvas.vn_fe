import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, Button } from 'antd';
import { getSettingByType, getSchemaGuideline } from '../apis/settingService';
import { marked } from 'marked';
import styles from './FirstTimePopup.module.css';

const FirstTimePopup = ({ visible, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [guidelineSettings, setGuidelineSettings] = useState(null);
  const [loading, setLoading] = useState(true);



  // Fetch guideline settings when component mounts or becomes visible
  useEffect(() => {
    const fetchGuidelineSettings = async () => {
      if (visible) {
        setLoading(true);
        try {
          const settings = await getSchemaGuideline('master');
          setGuidelineSettings(settings);
        } catch (error) {
          setGuidelineSettings(null);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGuidelineSettings();
  }, [visible]);

  const handleClose = () => {
    if (dontShowAgain) {
      // Save to localStorage to prevent showing again
      // Use different keys based on the current route
      const currentPath = window.location.pathname;
      if (currentPath === '/dashboard' || currentPath === '/dashboard/app') {
        localStorage.setItem('firstTimeDashboardPopup', 'shown');
      } else {
        localStorage.setItem('firstTimeHomePopup', 'shown');
      }
    }
    onClose();
  };

  const handleCheckboxChange = (e) => {
    setDontShowAgain(e.target.checked);
  };

  // Default values
  const defaultImageUrl = '/1756269168400 (Custom).png';
  const defaultTitle = '';
  const defaultText = '';

  // Use guideline settings if available, otherwise use defaults
  const imageUrl = guidelineSettings?.setting?.imageUrl || defaultImageUrl;
  const title = defaultTitle; // Keep default title for now
  const text = guidelineSettings?.setting?.markdownText || defaultText;



  // Show loading or default content based on loading state
  if (loading) {
    return (
      <Modal
        open={visible}
        onCancel={handleClose}
        footer={[
          <div key="footer-content" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%'
          }}>
            <Checkbox 
              checked={dontShowAgain} 
              onChange={handleCheckboxChange}
            >
              Không xuất hiện lần sau
            </Checkbox>
            <Button type="primary" onClick={handleClose}>
              Đóng
            </Button>
          </div>
        ]}
        centered
        width={500}
        className={styles.firstTimePopup}
        bodyStyle={{ 
          padding: '0', 
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        styles={{
          content: {
            padding: '0'
          }
        }}
      >
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div>Loading...</div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={[
        <div key="footer-content" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%'
        }}>
          <Checkbox 
            checked={dontShowAgain} 
            onChange={handleCheckboxChange}
          >
            Không xuất hiện lần sau
          </Checkbox>
          <Button type="primary" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      ]}
      centered
      width={500}
      className={styles.firstTimePopup}
      bodyStyle={{ 
        padding: '0', 
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      styles={{
        content: {
          padding: '0'
        },
        body: {
          height: '600px !important',
          maxHeight: '600px !important'
        }
      }}
    >
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <img 
          src={imageUrl} 
          alt="AiMBA Logo" 
          className={styles.welcomeImage}
          style={{
            flexShrink: 0,
            width: '100%',
            maxWidth: '500px',
            height: 'auto',
            maxHeight: '500px',
            margin: '0',
            borderRadius: '0',
            boxShadow: 'none'
          }}
          onError={(e) => {
            e.target.src = defaultImageUrl;
          }}
        />
        <div className={styles.contentSection} style={{ 
          marginTop: '20px',
          marginBottom: '10px', 
          padding: '0 24px',
          flexShrink: 0
        }}>
          <div 
            className={styles.welcomeText}
            dangerouslySetInnerHTML={{ __html: marked(text) }}
            style={{ 
              overflowX: 'hidden',
              wordWrap: 'break-word'
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default FirstTimePopup;
