import React from 'react';
import styles from '../K9.module.css';

const K9SubTabs = ({ activeSubTab, onSubTabChange, subTabOptions }) => {
  return (
    <div className={styles.subTabsContainer}>
      <div className={styles.subTabsList}>
        {subTabOptions.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.subTab} ${
              activeSubTab === tab.key ? styles.active : ''
            }`}
            onClick={() => onSubTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default K9SubTabs; 