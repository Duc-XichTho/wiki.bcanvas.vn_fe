import React, { useContext, useEffect, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { Play, X, Maximize2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MyContext } from '../../../MyContext.jsx';
import styles from '../AnalysisReview.module.css';

const ProcessingBar = () => {
  const { currentUser } = useContext(MyContext);
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingInfo, setProcessingInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Kiểm tra trạng thái xử lý từ localStorage hoặc context
  useEffect(() => {
    const checkProcessingStatus = () => {
      // Kiểm tra localStorage để xem có đang xử lý không
      const processingData = localStorage.getItem('reportBuilderProcessing');
      if (processingData) {
        try {
          const data = JSON.parse(processingData);
          if (data.isProcessing && data.user === currentUser?.email) {
            setIsProcessing(true);
            setProcessingInfo(data);
            setIsVisible(true);
          } else {
            setIsProcessing(false);
            setIsVisible(false);
            setElapsedTime(0);
          }
        } catch (error) {
          console.error('Error parsing processing data:', error);
        }
      } else {
        setIsProcessing(false);
        setIsVisible(false);
        setElapsedTime(0);
      }
    };

    checkProcessingStatus();
    
    // Kiểm tra mỗi 2 giây
    const interval = setInterval(checkProcessingStatus, 2000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Tính thời gian đã trôi qua
  useEffect(() => {
    if (isProcessing && processingInfo?.startTime) {
      const updateElapsedTime = () => {
        const elapsed = Date.now() - processingInfo.startTime;
        setElapsedTime(Math.floor(elapsed / 1000));
      };
      
      updateElapsedTime();
      const timer = setInterval(updateElapsedTime, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isProcessing, processingInfo]);

  const handleStopProcessing = () => {
    localStorage.removeItem('reportBuilderProcessing');
    setIsProcessing(false);
    setIsVisible(false);
    setElapsedTime(0);
  };

  const handleMaximize = () => {
    // Navigate về tab builder
    navigate('/analysis-review/builder');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.processingBar}>
      <div className={styles.processingContent}>
        <div className={styles.processingInfo}>
          <div className={styles.processingIcon}>
            <Play size={16} />
          </div>
          <span className={styles.processingTitle}>
            Report Builder - Đang xử lý AI...
          </span>
          {processingInfo && (
            <span className={styles.processingDetails}>
              {processingInfo.prompt ? `${processingInfo.prompt.substring(0, 50)}...` : 'Đang phân tích dữ liệu'}
            </span>
          )}
          {elapsedTime > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              marginLeft: '12px',
              fontSize: '11px',
              opacity: 0.8
            }}>
              <Clock size={12} />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>
        <div className={styles.processingControls}>
          <Tooltip title="Mở Report Builder">
            <Button
              type="text"
              size="small"
              icon={<Maximize2 size={14} />}
              onClick={handleMaximize}
              className={styles.processingButton}
            />
          </Tooltip>
          <Tooltip title="Dừng xử lý">
            <Button
              type="text"
              size="small"
              icon={<X size={14} />}
              onClick={handleStopProcessing}
              className={styles.processingButton}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default ProcessingBar; 