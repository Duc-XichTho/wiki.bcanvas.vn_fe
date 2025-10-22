import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from '../CustomerSurveyApp.module.css';

const SalesActionSection = ({ file, onUpdate, onRefetch }) => {
  const [salesData, setSalesData] = useState(() => {
    // Convert actionDate to proper format for date input (YYYY-MM-DD)
    let formattedActionDate = '';
    if (file.actionDate) {
      try {
        const date = new Date(file.actionDate);
        if (!isNaN(date.getTime())) {
          formattedActionDate = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error formatting initial actionDate:', error);
      }
    }
    
    return {
      successScore: file.successScore || 0,
      summaryNotes: file.summaryNotes || '',
      nextAction: file.nextAction || '',
      actionDate: formattedActionDate,
      status: file.status || 'waiting'
    };
  });

  // Update salesData when file prop changes (after refetch)
  useEffect(() => {
    // Convert actionDate to proper format for date input (YYYY-MM-DD)
    let formattedActionDate = '';
    if (file.actionDate) {
      try {
        const date = new Date(file.actionDate);
        if (!isNaN(date.getTime())) {
          formattedActionDate = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error formatting actionDate:', error);
      }
    }
    
    setSalesData({
      successScore: file.successScore || 0,
      summaryNotes: file.summaryNotes || '',
      nextAction: file.nextAction || '',
      actionDate: formattedActionDate,
      status: file.status || 'waiting'
    });
  }, [file.successScore, file.summaryNotes, file.nextAction, file.actionDate, file.status]);

  const handleSave = async () => {
    try {
      await onUpdate(file.id, salesData);
      // Refetch survey data after saving to ensure we have the latest data
      if (onRefetch) {
        await onRefetch();
      }
      toast.success('Đánh giá đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại!');
    }
  };

  return (
    <div className={styles.salesActionSection}>
      <h3 className={styles.salesActionTitle}>Đánh giá & Hành động tiếp theo</h3>
      
      <div className={styles.salesActionContent}>
        {/* Success Score */}
        <div className={styles.scoreSection}>
          <label className={styles.scoreLabel}>
            Đánh giá khả năng thành công (1-5):
          </label>
          <div className={styles.scoreButtons}>
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                onClick={() => setSalesData({ ...salesData, successScore: score })}
                className={`${styles.scoreButton} ${
                  salesData.successScore === score ? styles.selected : ''
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Notes */}
        <div className={styles.summarySection}>
          <label className={styles.summaryLabel}>
            Ghi chú tổng kết:
          </label>
          <textarea
            value={salesData.summaryNotes}
            onChange={(e) => setSalesData({ ...salesData, summaryNotes: e.target.value })}
            placeholder="Tóm tắt tình hình, đánh giá khách hàng..."
            className={styles.summaryTextarea}
            rows="3"
          />
        </div>

        {/* Next Action */}
        <div className={styles.actionGrid}>
          <div>
            <label className={styles.actionLabel}>
              Hành động tiếp theo: <span className={styles.actionLabelOptional}>(Tùy chọn)</span>
            </label>
            <textarea
              value={salesData.nextAction}
              onChange={(e) => setSalesData({ ...salesData, nextAction: e.target.value })}
              placeholder="Gửi proposal, lên lịch demo..."
              className={styles.actionInput}
              rows="2"
            />
          </div>
          
          <div>
            <label className={styles.actionLabel}>
              Thời gian thực hiện: <span className={styles.actionLabelOptional}>(Tùy chọn)</span>
            </label>
            <input
              type="date"
              value={salesData.actionDate}
              onChange={(e) => setSalesData({ ...salesData, actionDate: e.target.value })}
              className={styles.actionInput}
            />
          </div>
        </div>

        {/* Status Buttons */}
        <div className={styles.statusSection}>
          <label className={styles.statusLabel}>
            Trạng thái:
          </label>
          <div className={styles.statusButtons}>
            <button
              onClick={() => setSalesData({ ...salesData, status: 'waiting' })}
              className={`${styles.statusButton} ${styles.waiting} ${salesData.status === 'waiting' ? styles.active : ''}`}
            >
              Đang chờ
            </button>
            <button
              onClick={() => setSalesData({ ...salesData, status: 'frozen' })}
              className={`${styles.statusButton} ${styles.frozen} ${salesData.status === 'frozen' ? styles.active : ''}`}
            >
              Đóng băng
            </button>
            <button
              onClick={() => setSalesData({ ...salesData, status: 'progressing' })}
              className={`${styles.statusButton} ${styles.progressing} ${salesData.status === 'progressing' ? styles.active : ''}`}
            >
              Đang triển khai bước tiếp
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className={styles.saveSection}>
          <button
            onClick={handleSave}
            className={styles.saveButton}
          >
            Lưu đánh giá
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesActionSection;
