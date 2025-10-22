import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Modal, Upload, message, Tooltip } from 'antd';
import { DownOutlined, UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { createKHKDElement, updateKHKDElement } from '../../apis/khkdElementService';
import { getSettingByType } from '../../apis/settingService';
import { getTemplateRow } from '../../apis/templateSettingService';
import { useParams } from 'react-router-dom';
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

const REQUIRED_FIELDS = ['name', 'khoanMuc', 'boPhan', 'labelSoLuong', 'phanLoai'];
const TEMPLATE_HEADERS = [
    'Tên', 'Khoản mục', 'Bộ phận', 'Tên đo lường', 'Phân loại',
    ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
];

const parseRowsToObjects = (rows) => {
    const result = [];
    for (let i = 1; i < rows.length;) { // bắt đầu từ dòng 1 (bỏ header)
        const row = rows[i];
        if (row[0]) { // có name
            const name = row[0];
            const khoanMuc = row[1];
            const boPhan = row[2];
            const labelSoLuong = row[3];
            const phanLoai = row[4];
            // Xác định isDT dựa vào phanLoai
            let isDT;
            if (typeof phanLoai === 'string') {
                const pl = phanLoai.trim().toLowerCase();
                if (pl.includes('chi phí')) isDT = false;
                else if (pl.includes('doanh thu')) isDT = true;
            }
            const soLuongRow = rows[i + 1] || [];
            const donGiaRow = rows[i + 2] || [];
            // Tạo object đúng format
            const item = {
                name,
                khoanMuc,
                boPhan,
                labelSoLuong,
                phanLoai,
                isDT,
                data: [
                    { name: 'Số lượng', ...Object.fromEntries(Array.from({ length: 12 }, (_, j) => [`T${j + 1}`, soLuongRow[5 + j] || 0])) },
                    { name: 'Đơn giá', ...Object.fromEntries(Array.from({ length: 12 }, (_, j) => [`T${j + 1}`, donGiaRow[5 + j] || 0])) },
                ],
            };
            // Tính thành tiền
            const thanhTien = { name: 'Thành tiền' };
            for (let j = 1; j <= 12; ++j) {
                const soLuong = Number(item.data[0][`T${j}`]) || 0;
                const donGia = Number(item.data[1][`T${j}`]) || 0;
                thanhTien[`T${j}`] = soLuong * donGia;
            }
            item.data.push(thanhTien);
            result.push(item);
            i += 3; // nhảy sang mục tiếp theo
        } else {
            i++; // bỏ qua dòng thừa
        }
    }
    return result;
};

export default function KHKDImportExportDropdown({ reload, importDisabled: importDisabledProp }) {
    const { idLapKH } = useParams();
    const [modalOpen, setModalOpen] = useState(false);
    const [importedData, setImportedData] = useState([]);
    const [fileValid, setFileValid] = useState(false);
    const [errorRows, setErrorRows] = useState([]);
    const [khoanMucOptions, setKhoanMucOptions] = useState([]);
    const [boPhanOptions, setBoPhanOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [rawRows, setRawRows] = useState([]);

    const importDisabled =
        typeof importDisabledProp === 'boolean'
            ? importDisabledProp
            : loadingOptions || khoanMucOptions.length === 0 || boPhanOptions.length === 0;

    useEffect(() => {
        const fetchOptions = async () => {
            setLoadingOptions(true);
            try {
                const settings = await getSettingByType('KHKD');
                const { boPhan, khoanMuc } = settings;
                let boPhanList = [];
                let khoanMucList = [];
                if (boPhan?.templateId) {
                    const boPhanDataResponse = await getTemplateRow(boPhan.templateId);
                    const boPhanData = boPhanDataResponse.rows || [];
                    boPhanList = boPhanData.map(row => row.data[boPhan.columnName]);
                }
                if (khoanMuc?.templateId) {
                    const khoanMucDataResponse = await getTemplateRow(khoanMuc.templateId);
                    const khoanMucData = khoanMucDataResponse.rows || [];
                    khoanMucList = khoanMucData.map(row => row.data[khoanMuc.columnName]);
                }
                setBoPhanOptions(boPhanList);
                setKhoanMucOptions(khoanMucList);
            } catch (e) {
                setBoPhanOptions([]);
                setKhoanMucOptions([]);
            }
            setLoadingOptions(false);
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        if (!modalOpen) {
            setImportedData([]);
            setFileValid(false);
            setErrorRows([]);
            setRawRows([]);
        }
    }, [modalOpen]);

    // Export template
    const handleExportTemplate = () => {
        window.open('https://bucket-xichtho.hn.ss.bfcplatform.vn/demo1.sab.io.vndemo1.sab.io.vndemo1.sab.io.vnTemplateKHKD.xlsx', '_blank');
    };

    // Handle file upload (3 dòng 1 nhóm)
    const handleFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                setErrorRows([]);
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                setRawRows(rows); // Lưu lại để preview
                if (!rows || rows.length < 4) throw new Error('File không hợp lệ');
                // Parse lại đúng format
                const groups = parseRowsToObjects(rows);
                setImportedData(groups);
                setFileValid(groups.length > 0);
            } catch (err) {
                setFileValid(false);
                setImportedData([]);
                setRawRows([]);
                setErrorRows([]);
                message.error('Không đọc được file!');
            }
        };
        reader.readAsArrayBuffer(file);
        return false; // prevent auto upload
    };

    // Import action: update nếu trùng name, create nếu mới
    const handleImport = async () => {
        if (fileValid && importedData.length > 0) {
            console.log(importedData);
            let success = 0, fail = 0;
            // Duyệt từng nhóm 3 dòng
            for (let i = 0; i < importedData.length; i++) {
                const item = importedData[i];
                try {
                    await createKHKDElement({ ...item, idKHKD: idLapKH, theoDoiDG: true, theoDoi: true });
                    success++;
                } catch (e) {
                    fail++;
                }
            }
            setModalOpen(false);
            setImportedData([]);
            setFileValid(false);
            setErrorRows([]);
            if (success > 0) message.success(`Import thành công ${success} mục!`);
            if (fail > 0) message.error(`Có ${fail} mục lỗi!`);
            reload && reload();
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
                <Tooltip title={importDisabled ? "Cần cấu hình khoản mục và bộ phận trong QL Danh mục trước khi import" : ""}>
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
                <Button className="actionButton" style={{ border: 'none' }}>
                    Import/Export <DownOutlined />
                </Button>
            </Dropdown>
            <Modal
                title="Import KHKD từ file Excel (3 dòng 1 nhóm: Tên, Số lượng, Đơn giá)"
                open={modalOpen}
                onCancel={() => { setModalOpen(false); setImportedData([]); setFileValid(false); setErrorRows([]); }}
                footer={null}
                width={'80vw'}
                centered
            >
                <div style={{ width: '100%', height: '70vh' }}>
                    <div style={{ height: '20%' }}>
                        <Upload.Dragger
                            accept=".xls,.xlsx"
                            beforeUpload={handleFile}
                            showUploadList={false}
                            style={{ marginBottom: 16 }}
                        >
                            <p className="ant-upload-drag-icon">
                                <UploadOutlined />
                            </p>
                            <p>Kéo thả hoặc bấm để chọn file Excel (.xls, .xlsx)</p>
                        </Upload.Dragger>
                        {errorRows.length > 0 && (
                            <div style={{ color: 'red', marginBottom: 8 }}>
                                <b>Lỗi dữ liệu:</b>
                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                    {errorRows.map(e => (
                                        <li key={e.idx}>Nhóm bắt đầu từ dòng {e.idx}: thiếu {e.missing.join(', ')}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
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