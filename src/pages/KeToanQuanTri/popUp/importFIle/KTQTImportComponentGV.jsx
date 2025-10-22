import React from 'react';
import { Modal } from 'antd';
import KTQTImportContentGV from './KTQTImportContentGV.jsx';

export default function KTQTImportComponentGV({ open, onClose, onSuccess, phanLoaiDefault }) {
    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={1100}
            title="Import KTQT - Doanh thu/Giá vốn"
            centered
        >
            <KTQTImportContentGV onSuccess={onSuccess} phanLoaiDefault={'GV'} />
        </Modal>
    );
} 