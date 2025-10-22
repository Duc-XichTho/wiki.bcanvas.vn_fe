import React from 'react';
import { FolderOpen, FileText, Plus } from 'lucide-react';
import styles from './DefaultView.module.css';

const DefaultView = () => {
  return (
    <div className={styles.defaultContainer}>
      <div className={styles.defaultContent}>
        <div className={styles.iconContainer}>
          <FolderOpen size={64} className={styles.mainIcon} />
        </div>
        
        <h1 className={styles.title}>Customer Folders</h1>
        <p className={styles.description}>
          Chọn một item từ sidebar để xem chi tiết, hoặc tạo folder và item mới.
        </p>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <FolderOpen size={24} className={styles.featureIcon} />
            <div>
              <h3>Tạo Folder</h3>
              <p>Nhóm các item liên quan vào folder</p>
            </div>
          </div>
          
          <div className={styles.feature}>
            <FileText size={24} className={styles.featureIcon} />
            <div>
              <h3>Thêm Item</h3>
              <p>Tạo item mới trong folder</p>
            </div>
          </div>
          
          <div className={styles.feature}>
            <Plus size={24} className={styles.featureIcon} />
            <div>
              <h3>Quản lý dễ dàng</h3>
              <p>Tìm kiếm và tổ chức dữ liệu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultView;
