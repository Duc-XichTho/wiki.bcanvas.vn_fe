import React from 'react';
import { Spin } from 'antd';
import styles from '../K9.module.css';

const BusinessAnalysisTab = ({ loading }) => {
  return (
    <div className={styles.tabContent}>
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>Đang tải dữ liệu phân tích doanh nghiệp...</p>
        </div>
      ) : (
        <div className={styles.analysisContainer}>
          <div className={styles.analysisHeader}>
            <h2>Phân tích Doanh nghiệp</h2>
            <p>Công cụ phân tích chuyên sâu về các doanh nghiệp</p>
          </div>
          
          <div className={styles.analysisContent}>
            <div className={styles.comingSoon}>
              <h3>Tính năng đang được phát triển</h3>
              <p>Phân tích doanh nghiệp sẽ sớm có mặt với các tính năng:</p>
              <ul>
                <li>Phân tích báo cáo tài chính</li>
                <li>Đánh giá hiệu quả kinh doanh</li>
                <li>So sánh với đối thủ cạnh tranh</li>
                <li>Dự báo xu hướng phát triển</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessAnalysisTab; 