import React from 'react';
import styles from '../../AnalysisReview.module.css';

const TabButton = ({ tab, icon: Icon, children, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`${styles.tabButton} ${isActive ? styles.active : styles.inactive}`}
  >
    <Icon className={`${styles.h4} ${styles.w4}`} />
    <span className={styles.tabButtonText}>{children}</span>
  </button>
);

export default TabButton; 