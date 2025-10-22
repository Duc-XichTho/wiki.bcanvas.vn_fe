import React from 'react';
import { Modal } from 'antd';
import KPICalculator from '../../../Canvas/CanvasFolder/KPICalculator/KPICalculator.jsx';
import styles from './Modal.module.css';

const StatisticsModal = ({ visible, onClose }) => {
  return (
    <Modal
      title="Thiết lập thống kê"
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ top: 20 }}
      destroyOnClose
      className={styles.modalTitle}
    >
      <div className={styles.modalContainer}>
        <KPICalculator />
      </div>
    </Modal>
  );
};

export default StatisticsModal; 