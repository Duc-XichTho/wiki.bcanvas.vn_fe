import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Modal, Upload, message, Tooltip } from 'antd';
import { DownOutlined, UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

function PreviewTableRaw({ rows }) {
    if (!rows || rows.length === 0) return null;
    return (
        <div style={{ maxHeight: 350, overflow: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            {row.map((cell, j) => (
                                <td key={j} style={{ border: '1px solid #eee', padding: 4, textAlign: 'right' }}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Định nghĩa header mẫu cho import
const TEMPLATE_HEADERS = [
    'Chỉ số', 'Bộ phận',
    ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
];

// Parse dữ liệu từ file Excel thành object phù hợp với bảng KHKDElement3
const parseRowsToObjects = (rows) => {
    const result = [];
    for (let i = 1; i < rows.length; i++) { // bỏ header
        const row = rows[i];
        if (row[0]) {
            const labelSoLuong = row[0];
            const boPhan = row[1];
            const soLuongData = {
                name: 'Số lượng',
                label: row[0],
                ...Object.fromEntries(Array.from({ length: 12 }, (_, j) => [`T${j + 1}`, Number(row[2 + j]) || 0]))
            };
            const donGiaData={
                name: 'Đơn giá',
            }
            const item = {
                name,
                boPhan,
                labelSoLuong,
                khoanMuc: null,
                data: [soLuongData, donGiaData],
            };
            result.push(item);
        }
    }
    return result;
};

export default function KHKDElementImportExportDropdown({ onImportSuccess, importDisabled }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [importedData, setImportedData] = useState([]);
    const [fileValid, setFileValid] = useState(false);
    const [rawRows, setRawRows] = useState([]);

    useEffect(() => {
        if (!modalOpen) {
            setImportedData([]);
            setFileValid(false);
            setRawRows([]);
        }
    }, [modalOpen]);

    // Export template
    const handleExportTemplate = () => {
        // Tạo file mẫu động
        const wsData = [TEMPLATE_HEADERS];
        for (let i = 0; i < 3; i++) {
            wsData.push([
                '', '', '',
                ...Array(12).fill('')
            ]);
        }
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Template_CacTieuChiHoatDong.xlsx');
    };

    // Handle file upload
    const handleFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                setRawRows(rows);
                if (!rows || rows.length < 2) throw new Error('File không hợp lệ');
                // Kiểm tra header
                const header = rows[0] || [];
                const validHeader = TEMPLATE_HEADERS.every((h, idx) => (header[idx] || '').trim() === h);
                if (!validHeader) throw new Error('Header file không đúng định dạng!');
                const groups = parseRowsToObjects(rows);
                setImportedData(groups);
                setFileValid(groups.length > 0);
            } catch (err) {
                setFileValid(false);
                setImportedData([]);
                setRawRows([]);
                message.error('Không đọc được file hoặc file sai định dạng!');
            }
        };
        reader.readAsArrayBuffer(file);
        return false;
    };

    // Import action: trả về dữ liệu cho parent
    const handleImport = () => {
        if (fileValid && importedData.length > 0) {
            onImportSuccess && onImportSuccess(importedData);
            setModalOpen(false);
            setImportedData([]);
            setFileValid(false);
        }
    };

    const menuItems = [
        {
            key: 'export-template',
            label: (
                <span><FileExcelOutlined /> Xuất file mẫu</span>
            ),
            onClick: handleExportTemplate,
        },
        {
            key: 'import',
            label: (
                <Tooltip title={importDisabled ? "Import đang tạm khóa" : ""}>
                    <span style={importDisabled ? { color: '#ccc', cursor: 'not-allowed' } : {}}>
                        <UploadOutlined /> Import
                    </span>
                </Tooltip>
            ),
            onClick: () => !importDisabled && setModalOpen(true),
            disabled: importDisabled,
        },
    ];

    return (
        <>
            <Dropdown
                menu={{ items: menuItems }}
                trigger={['click']}
            >
                <Button className="actionButton" style={{ marginRight: 8 , border:'none'}}>
                    Import/Export <DownOutlined />
                </Button>
            </Dropdown>
            <Modal
                title="Import KHKD từ file Excel (1 dòng 1 mục: Tên, Bộ phận, Chỉ số, T1-T12)"
                open={modalOpen}
                onCancel={() => { setModalOpen(false); setImportedData([]); setFileValid(false); }}
                footer={null}
                width={'60vw'}
                centered
            >
                <div style={{ width: '100%', height: '60vh' }}>
                    <div style={{ height: '20%' }}>
                        <Upload.Dragger
                            accept=".xls,.xlsx"
                            beforeUpload={handleFile}
                            showUploadList={false}
                            style={{ marginBottom: 16 , }}
                        >
                            <p className="ant-upload-drag-icon">
                                <UploadOutlined />
                            </p>
                            <p>Kéo thả hoặc bấm để chọn file Excel (.xls, .xlsx)</p>
                        </Upload.Dragger>
                    </div>
                    <div style={{ height: 'calc(100% - 20% - 60px)', width: '100%' }}>
                        {rawRows.length > 0 && <PreviewTableRaw rows={rawRows} />}
                    </div>
                    <div style={{ marginTop: 16, textAlign: 'right', height: '30px' }}>
                        <Button onClick={() => setModalOpen(false)} style={{ marginRight: 8 }}>Đóng</Button>
                        <Button type="primary" disabled={!fileValid || importedData.length === 0} onClick={handleImport}>
                            Import
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
} 