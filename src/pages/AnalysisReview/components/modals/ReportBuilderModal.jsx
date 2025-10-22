import React, { useState, useEffect } from 'react';
import { Modal, Button, Tooltip } from 'antd';
import { Minus, X, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReportBuilderNonPD from '../tabs/ReportBuilderNonPD';
import styles from './Modal.module.css';

const ReportBuilderModal = ({ 
  isOpen, 
  onClose, 
  onMinimize,
  isMinimized = false,
  onMaximize 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMaximize = () => {
    setIsFullscreen(!isFullscreen);
    if (onMaximize) {
      onMaximize(!isFullscreen);
    }
  };

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    }
  };

  const handleClose = () => {
    setIsFullscreen(false);
    if (onClose) {
      onClose();
    }
    // Navigate về tab data khi đóng modal
    if (location.pathname.includes('/builder')) {
      navigate('/analysis-review/data');
    }
  };

  // Custom header với các nút điều khiển
  const customHeader = (
    <div className={styles.modalHeader}>
      <div className={styles.modalTitle}>
        <span>Report Builder</span>
        {isMinimized && (
          <span className={styles.minimizedIndicator}>
            (Đang chạy AI...)
          </span>
        )}
      </div>
      <div className={styles.modalControls}>
        <Tooltip title="Thu nhỏ">
          <Button
            type="text"
            icon={<Minus size={16} />}
            onClick={handleMinimize}
            className={styles.controlButton}
          />
        </Tooltip>
        <Tooltip title={isFullscreen ? "Thu nhỏ màn hình" : "Phóng to"}>
          <Button
            type="text"
            icon={isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            onClick={handleMaximize}
            className={styles.controlButton}
          />
        </Tooltip>
        <Tooltip title="Đóng">
          <Button
            type="text"
            icon={<X size={16} />}
            onClick={handleClose}
            className={styles.controlButton}
          />
        </Tooltip>
      </div>
    </div>
  );

  return (
    <>
      {/* Modal chính */}
      <Modal
        title={customHeader}
        open={isOpen && !isMinimized}
        onCancel={handleClose}
        footer={null}
        width={isFullscreen ? '95vw' : '90vw'}
        style={{
          top: isFullscreen ? 10 : 20,
          maxHeight: isFullscreen ? '95vh' : '90vh',
        }}
        className={styles.reportBuilderModal}
        destroyOnClose={false}
        maskClosable={false}
      >
        <div className={styles.modalContent}>
          <ReportBuilderNonPD />
        </div>
      </Modal>

      {/* Minimized bar */}
      {isOpen && isMinimized && (
        <div className={styles.minimizedBar}>
          <div className={styles.minimizedContent}>
            <span className={styles.minimizedTitle}>
              Report Builder - Đang chạy AI...
            </span>
            <div className={styles.minimizedControls}>
              <Tooltip title="Mở lại">
                <Button
                  type="text"
                  size="small"
                  onClick={handleMaximize}
                  className={styles.minimizedButton}
                >
                  <Maximize2 size={14} />
                </Button>
              </Tooltip>
              <Tooltip title="Đóng">
                <Button
                  type="text"
                  size="small"
                  onClick={handleClose}
                  className={styles.minimizedButton}
                >
                  <X size={14} />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportBuilderModal; 