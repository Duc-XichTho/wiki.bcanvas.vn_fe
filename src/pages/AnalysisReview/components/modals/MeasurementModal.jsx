import React from 'react';
import { Modal } from 'antd';
import KPI2Calculator from '../../../Canvas/CanvasFolder/KPI2Calculator/KPI2Calculator.jsx';
import styles from './Modal.module.css';

const MeasurementModal = ({ visible, onClose }) => {
  return (
    <Modal
      title="Kết quả đo lường"
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ top: 20 }}
      destroyOnClose
      className={styles.modalTitle}
    >
      <div className={styles.modalContainer}>
        <KPI2Calculator />
      </div>
    </Modal>
  );
};

export default MeasurementModal; 