import React from 'react';
import { Modal } from 'antd';
import KTQTImportContent from './KTQTImportContent.jsx';

export default function KTQTImportComponent({ open, onClose, onSuccess, phanLoaiDefault }) {
    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={1100}
            title="Import KTQT - Doanh thu/Giá vốn"
            centered
        >
            <KTQTImportContent onSuccess={onSuccess} phanLoaiDefault={phanLoaiDefault} />
        </Modal>
    );
} 