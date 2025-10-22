import React from 'react';
import ReportBuilderNonPD from './ReportBuilderNonPD';
import styles from './ReportBuilderTab.module.css';

const ReportBuilderTab = () => {
  return (
    <div className={styles.reportBuilderTabContent}>
      <ReportBuilderNonPD />
    </div>
  );
};

export default ReportBuilderTab; 