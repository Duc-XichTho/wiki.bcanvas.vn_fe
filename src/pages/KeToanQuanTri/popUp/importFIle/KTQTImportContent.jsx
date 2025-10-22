import React, { useState, useEffect, useContext } from 'react';
import { message, Switch, Button, Progress, Upload, Divider, Modal, Tabs, Select, Radio, Spin } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { TfiImport } from 'react-icons/tfi';
import * as XLSX from 'xlsx';
import CustomImportSelect from './CustomImportSelect.jsx';
import { createKTQTImport } from '../../../../apis/ktqtImportService.jsx';
import { createSetting, updateSetting, getSettingByType } from '../../../../apis/settingService.jsx';
import { createKtqtImportHistory, getAllKtqtImportHistory, hideAllKtqtImportHistoryByType, getKtqtImportHistoryByType } from '../../../../apisKTQT/ktqtImportHistoryService.jsx';
import './import.css';
import { MyContext } from '../../../../MyContext.jsx';
import { getAllApprovedVersion, getApprovedVersionDataById } from '../../../../apis/approvedVersionTemp.jsx';
import { getTemplateColumn, getTemplateInfoByTableId, getTemplateRow } from '../../../../apis/templateSettingService.jsx';

const editableColumns = [
    { field: 'phan_loai', label: 'Phân loại (DT/GV)' },
    { field: 'day', label: 'Ngày' },
    { field: 'month', label: 'Tháng' },
    { field: 'year', label: 'Năm' },
    { field: 'diengiai', label: 'Diễn giải' },
    { field: 'so_tien', label: 'Số tiền' },
    { field: 'so_luong', label: 'Số lượng' },
    { field: 'kmfGoc', label: 'Khoản mục KQKD' },
    { field: 'projectGoc', label: 'Vụ việc' },
    { field: 'unit_codeGoc', label: 'Bộ phận' },
    { field: 'productGoc', label: 'Sản phẩm' },
    { field: 'kenhGoc', label: 'Kênh' },
    { field: 'company', label: 'Công ty' },
];

const numericFields = ['so_tien', 'day', 'month', 'year'];

export default function KTQTImportContent({ onSuccess, phanLoaiDefault = 'DT' }) {
    const {currentCompanyKTQT} = useContext(MyContext)
    const [fileName, setFileName] = useState('');
    const [fileHeaders, setFileHeaders] = useState([]);
    const [parsedData, setParsedData] = useState([]);
    const [mappingValues, setMappingValues] = useState({});
    const [invalidCells, setInvalidCells] = useState([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [activeTab, setActiveTab] = useState('1');
    const [showUpload, setShowUpload] = useState(false);
    const [oldImportData, setOldImportData] = useState([]);
    const [useOldData, setUseOldData] = useState(false);
    const [loadingOldData, setLoadingOldData] = useState(false);
    const phanLoai = phanLoaiDefault;

    const [mappingFromGroup, setMappingFromGroup] = useState({});
    const [lastGroupKey, setLastGroupKey] = useState('');
    const [importSource, setImportSource] = useState('rubik'); // 'upload' | 'rubik'
    const [rubikFiles, setRubikFiles] = useState([]);
    const [rubikLoading, setRubikLoading] = useState(false);
    const [selectedRubikFile, setSelectedRubikFile] = useState(null);
    const [forceChooseSource, setForceChooseSource] = useState(false);

    // Thêm hàm load dữ liệu gần nhất
    const handleLoadLatestData = async () => {
        setLoadingOldData(true);
        try {
            await handleFetchHistory();
            setShowUpload(false);
            setUseOldData(true);
        } finally {
            setLoadingOldData(false);
        }
    };

    const saveMapping = async (mapping) => {
        // Kiểm tra đã có setting chưa
        const existing = await getSettingByType(phanLoai);
        console.log(existing);
        
        if (existing) {
            await updateSetting({...existing, setting: mapping });
        } else {
            await createSetting({ type: phanLoai, setting: mapping });
        }
    };

    useEffect(() => {
        setFileName('');
        setFileHeaders([]);
        setParsedData([]);
        setMappingValues({});
        setInvalidCells([]);
        setPreviewData([]);
        setUploadProgress(0);
    }, [phanLoaiDefault]);

    useEffect(() => {
        setOldImportData([]); // Đảm bảo luôn rỗng khi mount hoặc khi phanLoaiDefault đổi
    }, [phanLoaiDefault]);

    // Thêm hàm lấy dữ liệu cũ khi bấm nút
    const handleFetchHistory = async () => {
        try {
            const res = await getKtqtImportHistoryByType(phanLoai);
            console.log(res);
            if (res && res.data) {
                setOldImportData(res.data);
                message.success('Lấy dữ liệu cũ thành công!');
            } else {
                setOldImportData([]);
                message.info('Không có dữ liệu cũ.');
            }
        } catch (err) {
            setOldImportData([]);
            message.error('Lỗi khi lấy dữ liệu cũ!');
        }
    };

    // Sau khi import xong thì reload bảng cũ (KHÔNG setShowUpload(false) ở đây)
    const reloadHistory = async () => {
        try {
            const res = await getKtqtImportHistoryByType(phanLoai);
            if (res && res.data) {
                setOldImportData(res.data);
            } else {
                setOldImportData([]);
            }
        } catch (err) {
            setOldImportData([]);
        }
        // KHÔNG setShowUpload(false) ở đây
    };

    const beforeUpload = async (file) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await hideAllKtqtImportHistoryByType({ import_type: phanLoai });
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                if (!json.length) throw new Error('File rỗng hoặc không đúng định dạng');
                const headers = json[0].map(h => (typeof h === 'string' ? h : String(h)));
                const rows = json.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));
                console.log(headers);
                console.log(rows);
                setFileHeaders(headers);
                setParsedData(rows.map(row => {
                    const obj = {};
                    headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
                    return obj;
                }));
                // Lưu lịch sử import
                try {
                    const bulkArr = rows.map(row => ({
                        import_type: phanLoai,
                        column: headers,
                        data: row,
                        createAt: new Date().toISOString(),
                        show: true
                    }));
                    await createKtqtImportHistory(bulkArr);
                } catch (err) {
                    console.error('Lỗi lưu lịch sử import:', err);
                }
                // Đọc mapping đã lưu
                let mapping = {};
                try {
                    const saved = await getSettingByType(phanLoai);
                    if (saved && saved.setting) {
                        Object.entries(saved.setting).forEach(([field, colName]) => {
                            if (headers.includes(colName)) {
                                mapping[field] = colName;
                            }
                        });
                    }
                } catch (e) { /* ignore */ }
                if (Object.keys(mapping).length === 0) {
                    editableColumns.forEach(col => {
                        const found = headers.find(h => h.toLowerCase().includes(col.label.toLowerCase().split('(')[0].trim()));
                        if (found) mapping[col.field] = found;
                    });
                }
                setMappingValues(mapping);
                message.success('Đọc file thành công!');
                reloadHistory();
            } catch (err) {
                message.error('Lỗi đọc file: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
        return false;
    };

    const validateDataWithMapping = (mapping) => {
        const invalids = [];
        const validated = parsedData.map((row, rowIdx) => {
            const obj = { serial_number: rowIdx + 1 };
            editableColumns.forEach(col => {
                const header = mapping[col.field];
                let value = header ? row[header] : '';
                if (col.field === 'phan_loai') value = phanLoai;
                if (col.field === 'company') value = currentCompanyKTQT;
                if (numericFields.includes(col.field)) {
                    if (value === '' || value === null || value === undefined) value = 0;
                    if (isNaN(Number(value))) {
                        invalids.push({ row: rowIdx, col: col.field });
                    }
                }
                obj[col.field] = value;
            });
            return obj;
        });
        return { validated, invalids };
    };

    const handleMappingChange = async (selected, field) => {
        if (showUpload && fileHeaders.length > 0) {
            setMappingValues(prev => {
                const newMapping = { ...prev, [field]: selected ? selected.value : undefined };
                const { validated, invalids } = validateDataWithMapping(newMapping);
                setPreviewData(validated);
                setInvalidCells(invalids);
                if (invalids.length > 0) {
                    message.warning('Có dữ liệu không hợp lệ trong mapping!');
                }
                saveMapping(newMapping);
                return newMapping;
            });
        } else {
            // Đang xem dữ liệu cũ, update mappingFromGroup, previewData, invalidCells
            setMappingFromGroup(prev => {
                const newMapping = { ...prev, [field]: selected ? selected.value : undefined };
                // update previewData và invalidCells cho tab preview
                if (group && group.rows) {
                    const newPreview = group.rows.map((row, rowIdx) => {
                        const obj = { serial_number: rowIdx + 1 };
                        editableColumns.forEach(col => {
                            const header = newMapping[col.field];
                            let value = header ? row[group.column.indexOf(header)] : '';
                            if (col.field === 'phan_loai') value = phanLoai;
                            if (numericFields.includes(col.field)) {
                                if (value === '' || value === null || value === undefined) value = 0;
                            }
                            obj[col.field] = value;
                        });
                        return obj;
                    });
                    // validate lại
                    const invalids = [];
                    newPreview.forEach((row, rowIdx) => {
                        editableColumns.forEach(col => {
                            let value = row[col.field];
                            if (numericFields.includes(col.field)) {
                                if (value === '' || value === null || value === undefined) value = 0;
                                if (isNaN(Number(value))) {
                                    invalids.push({ row: rowIdx, col: col.field });
                                }
                            }
                        });
                    });
                    setPreviewData(newPreview);
                    setInvalidCells(invalids);
                }
                saveMapping(newMapping); // Lưu mapping khi đổi mapping ở dữ liệu cũ
                return newMapping;
            });
        }
    };

    const validateData = () => {
        const invalids = [];
        const validated = parsedData.map((row, rowIdx) => {
            const obj = { serial_number: rowIdx + 1 };
            editableColumns.forEach(col => {
                const header = mappingValues[col.field];
                let value = header ? row[header] : '';
                if (col.field === 'phan_loai') value = phanLoai;
                if (col.field === 'company') value = currentCompanyKTQT;
                if (numericFields.includes(col.field)) {
                    if (value === '' || value === null || value === undefined) value = 0;
                    if (isNaN(Number(value))) {
                        invalids.push({ row: rowIdx, col: col.field });
                    }
                }
                obj[col.field] = value;
            });
            return obj;
        });
        setInvalidCells(invalids);
        return { validated, invalids };
    };

    const handlePreview = () => {
        const { validated } = validateData();
        setPreviewData(validated);
        setIsPreviewOpen(true);
    };

    const handleUpload = async () => {
        let validated, invalids;
        if (showUpload) {
            // Đang import mới
            ({ validated, invalids } = validateData());
        } else {
            // Đang xem dữ liệu cũ, lấy từ effectivePreviewData
            validated = effectivePreviewData.map(row => ({ ...row, company: currentCompanyKTQT }));
            invalids = invalidCells;
        }
        if (invalids.length > 0) {
            // Hiển thị chi tiết lỗi
            const errorDetails = invalids.slice(0, 10).map(cell => 
                `Dòng ${cell.row + 1}, cột "${editableColumns.find(c => c.field === cell.col)?.label || cell.col}"`
            ).join('; ');
            message.error(`Có ${invalids.length} lỗi. Ví dụ: ${errorDetails}${invalids.length > 10 ? ' ...' : ''}`);
            return;
        }
        setLoading(true);
        setUploadProgress(0);
        let success = 0;
        // Thay vì gửi từng bản ghi, gửi theo batch để tránh quá tải
        const BATCH_SIZE = 5000;
        for (let i = 0; i < validated.length; i += BATCH_SIZE) {
            const batch = validated.slice(i, i + BATCH_SIZE).map(row => ({
                ...row,
                kmfGoc: row.kmf !== undefined ? row.kmf : row.kmfGoc,
                kmf: row.kmf !== undefined ? row.kmf : row.kmfGoc,
                productGoc: row.product !== undefined ? row.product : row.productGoc,
                product: row.product !== undefined ? row.product : row.productGoc,
                projectGoc: row.project !== undefined ? row.project : row.projectGoc,
                project: row.project !== undefined ? row.project : row.projectGoc,
                kenhGoc: row.kenh !== undefined ? row.kenh : row.kenhGoc,
                kenh: row.kenh !== undefined ? row.kenh : row.kenhGoc,
                unit_codeGoc: row.unit_code !== undefined ? row.unit_code : row.unit_codeGoc,
                unit_code: row.unit_code !== undefined ? row.unit_code : row.unit_codeGoc,
            }));
            await createKTQTImport(batch);
        }
        setLoading(false);
        // Nếu không có lỗi thì báo thành công
        if (!invalids || invalids.length === 0) {
            message.success('Import thành công!');
            onSuccess && onSuccess();
        } else {
            // Hiển thị chi tiết lỗi
            const errorDetails = invalids.slice(0, 10).map(cell => 
                `Dòng ${cell.row + 1}, cột "${editableColumns.find(c => c.field === cell.col)?.label || cell.col}"`
            ).join('; ');
            message.error(`Có ${invalids.length} lỗi. Ví dụ: ${errorDetails}${invalids.length > 10 ? ' ...' : ''}`);
        }
    };

    useEffect(() => {
        if (fileHeaders.length > 0 && Object.keys(mappingValues).length > 0) {
            saveMapping(mappingValues);
        }
    }, [mappingValues, fileHeaders]);

    // Lấy danh sách file rubik khi chọn nguồn là rubik
    useEffect(() => {
        if (importSource === 'rubik') {
            setRubikLoading(true);
            getAllApprovedVersion().then(allData => {
                const data = allData.filter(item =>
                    (Array.isArray(item.apps) && item.apps?.includes('fdr'))
                );
                setRubikFiles(data.map(item => ({
                    id: item.id,
                    name: item.name,
                    id_version: item.id_version,
                    id_fileNote: item.id_fileNote,
                    updated_at: item.updated_at,
                    created_at: item.created_at
                })));
            }).finally(() => setRubikLoading(false));
        }
    }, [importSource]);

    // Hàm lấy dữ liệu file rubik và parse như upload file
    const handleRubikImport = async () => {
        if (!selectedRubikFile) return message.warning('Vui lòng chọn file!');
        setRubikLoading(true);
        try {
            // Ẩn hết lịch sử cũ trước khi tạo mới
            await hideAllKtqtImportHistoryByType({ import_type: phanLoai });
            // 1. Lấy thông tin version
            const data = await getApprovedVersionDataById(selectedRubikFile.id);
            console.log(data);
            // 2. Lấy headers
            const info = await getTemplateInfoByTableId(data.id_template);
            let versionObj;
            if (data.id_version == 1 || data.id_version == null) {
                versionObj = info.versions.find(v => v.version == null);
            } else {
                versionObj = info.versions.find(v => v.version == data.id_version);
            }
            const headerNames = versionObj ? versionObj.columns : [];
            console.log(headerNames);
            // 3. Lấy rowData
            const rowVersionResponse = await getTemplateRow(data.id_template, data.id_version == 1 || data.id_version == null ? null : data.id_version);
            const rowVersion = rowVersionResponse.rows || [];
            console.log(rowVersion);
            // 4. Parse rows thành mảng giá trị
            const rows = rowVersion.map(row => {
                const dataObj = row.data;
                return headerNames.map(h => dataObj[h]);
            });
            console.log(rows);
            setFileHeaders(headerNames);
            setParsedData(
                rows.map(rowArr => {
                    const obj = {};
                    headerNames.forEach((h, i) => { obj[h] = rowArr[i] ?? ''; });
                    return obj;
                })
            );
            // Lưu lịch sử import khi lấy file từ Rubik (chia nhỏ batch 5000 bản ghi)
            try {
                const BATCH_SIZE = 5000;
                for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                    const batch = rows.slice(i, i + BATCH_SIZE);
                    const bulkArr = batch.map(row => ({
                        import_type: phanLoai,
                        column: headerNames,
                        data: row,
                        createAt: new Date().toISOString(),
                        show: true
                    }));
                    await createKtqtImportHistory(bulkArr);
                }
            } catch (err) {
                console.error('Lỗi lưu lịch sử import từ Rubik:', err);
            }
            // Đọc mapping đã lưu từ setting trước, nếu không có thì mới auto mapping
            let mapping = {};
            try {
                const saved = await getSettingByType(phanLoai);
                if (saved && saved.setting) {
                    Object.entries(saved.setting).forEach(([field, colName]) => {
                        if (headerNames.includes(colName)) {
                            mapping[field] = colName;
                        }
                    });
                }
            } catch (e) { /* ignore */ }
            
            // Nếu không có mapping từ setting, mới tạo auto mapping
            if (Object.keys(mapping).length === 0) {
                editableColumns.forEach(col => {
                    const found = headerNames.find(h =>
                        h.toLowerCase().replace(/[^a-z0-9]/g, '') === col.label.toLowerCase().split('(')[0].replace(/[^a-z0-9]/g, '')
                        || h.toLowerCase().replace(/[^a-z0-9]/g, '') === col.field.toLowerCase().replace(/[^a-z0-9]/g, '')
                    );
                    if (found) mapping[col.field] = found;
                });
            }
            setMappingValues(mapping);
            
            setPreviewData([]);
            setInvalidCells([]);
            setShowUpload(true);
            setFileName(selectedRubikFile.name);
            message.success('Lấy file từ rubik thành công!');
        } catch (err) {
            message.error('Lỗi lấy file từ rubik: ' + err.message);
        } finally {
            setRubikLoading(false);
        }
    };

    // Helper: group các bản ghi theo import_type, column, createAt
    function groupImportHistory(dataArr) {
        if (!dataArr.length) return null;
        // group theo import_type, column, createAt
        const groupMap = {};
        dataArr.forEach(item => {
            const key = `${item.import_type}__${JSON.stringify(item.column)}__${item.createAt}`;
            if (!groupMap[key]) {
                groupMap[key] = {
                    import_type: item.import_type,
                    column: item.column,
                    createAt: item.createAt,
                    rows: []
                };
            }
            groupMap[key].rows.push(item.data);
        });
        // Lấy group mới nhất (theo createAt)
        const groups = Object.values(groupMap);
        if (!groups.length) return null;
        groups.sort((a, b) => new Date(b.createAt) - new Date(a.createAt));
        return groups[0];
    }

    // Chuẩn bị dữ liệu cho 3 tab khi có dữ liệu cũ
    const group = groupImportHistory(oldImportData);
    // Nếu chưa import mới, lấy headers/mapping/preview từ group
    const effectiveFileHeaders = (showUpload && fileHeaders.length > 0) ? fileHeaders : (group ? group.column : []);
    useEffect(() => {
        if (!showUpload && group && group.column) {
            const groupKey = `${group.createAt}__${JSON.stringify(group.column)}`;
            if (groupKey === lastGroupKey) return; // Đã set rồi, không set lại nữa
            (async () => {
                let mapping = {};
                try {
                    const saved = await getSettingByType(phanLoai);
                    if (saved && saved.setting) {
                        Object.entries(saved.setting).forEach(([field, colName]) => {
                            if (group.column.includes(colName)) {
                                mapping[field] = colName;
                            }
                        });
                    }
                } catch (e) { /* ignore */ }
                if (Object.keys(mapping).length === 0) {
                    editableColumns.forEach(col => {
                        const found = group.column.find(h => h.toLowerCase().includes(col.label.toLowerCase().split('(')[0].trim()));
                        if (found) mapping[col.field] = found;
                    });
                }
                setMappingFromGroup(mapping);
                setLastGroupKey(groupKey);

                // Validate và set preview/invalidCells ngay khi mappingFromGroup thay đổi
                if (group && group.rows) {
                    const newPreview = group.rows.map((row, rowIdx) => {
                        const obj = { serial_number: rowIdx + 1 };
                        editableColumns.forEach(col => {
                            const header = mapping[col.field];
                            let value = header ? row[group.column.indexOf(header)] : '';
                            if (col.field === 'phan_loai') value = phanLoai;
                            if (numericFields.includes(col.field)) {
                                if (value === '' || value === null || value === undefined) value = 0;
                            }
                            obj[col.field] = value;
                        });
                        return obj;
                    });
                    // validate lại
                    const invalids = [];
                    newPreview.forEach((row, rowIdx) => {
                        editableColumns.forEach(col => {
                            let value = row[col.field];
                            if (numericFields.includes(col.field)) {
                                if (value === '' || value === null || value === undefined) value = 0;
                                if (isNaN(Number(value))) {
                                    invalids.push({ row: rowIdx, col: col.field });
                                }
                            }
                        });
                    });
                    // Đảm bảo set preview và invalidCells cùng lúc với mappingFromGroup
                    setPreviewData(newPreview);
                    setInvalidCells(invalids);
                }
            })();
        }
        // eslint-disable-next-line
    }, [group?.createAt, group?.column, phanLoaiDefault, showUpload]);

    useEffect(() => {
        // Chỉ validate khi đang xem dữ liệu cũ (không phải import mới)
        if (!showUpload && group && group.rows && Object.keys(mappingFromGroup).length > 0) {
            const newPreview = group.rows.map((row, rowIdx) => {
                const obj = { serial_number: rowIdx + 1 };
                editableColumns.forEach(col => {
                    const header = mappingFromGroup[col.field];
                    let value = header ? row[group.column.indexOf(header)] : '';
                    if (col.field === 'phan_loai') value = phanLoai;
                    if (numericFields.includes(col.field)) {
                        if (value === '' || value === null || value === undefined) value = 0;
                    }
                    obj[col.field] = value;
                });
                return obj;
            });
            // validate lại
            const invalids = [];
            newPreview.forEach((row, rowIdx) => {
                editableColumns.forEach(col => {
                    let value = row[col.field];
                    if (numericFields.includes(col.field)) {
                        if (value === '' || value === null || value === undefined) value = 0;
                        if (isNaN(Number(value))) {
                            invalids.push({ row: rowIdx, col: col.field });
                        }
                    }
                });
            });
            // Chỉ setState nếu giá trị thực sự thay đổi để tránh loop
            setPreviewData(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(newPreview)) return newPreview;
                return prev;
            });
            setInvalidCells(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(invalids)) return invalids;
                return prev;
            });
        }
        // eslint-disable-next-line
    }, [
        showUpload,
        group?.createAt,
        group?.column && group.column.join(','),
        phanLoai,
        JSON.stringify(mappingFromGroup)
    ]);

    const effectiveMappingValues = (showUpload && fileHeaders.length > 0) ? mappingValues : mappingFromGroup;
    // Preview: map lại dữ liệu group.rows thành object theo mapping
    const effectivePreviewData = (showUpload && fileHeaders.length > 0) ? previewData : (
        group && group.rows ? group.rows.map((row, rowIdx) => {
            const obj = { serial_number: rowIdx + 1 };
            editableColumns.forEach(col => {
                const header = effectiveMappingValues[col.field];
                let value = header ? row[group.column.indexOf(header)] : '';
                if (col.field === 'phan_loai') value = phanLoai;
                if (col.field === 'company') value = currentCompanyKTQT;
                if (numericFields.includes(col.field)) {
                    if (value === '' || value === null || value === undefined) value = 0;
                }
                obj[col.field] = value;
            });
            return obj;
        }) : []
    );

    // Tạo dữ liệu cho tab lỗi
    const errorRows = React.useMemo(() => {
        if (!invalidCells.length) return [];
        // Lấy index các dòng lỗi
        const errorRowIdxs = Array.from(new Set(invalidCells.map(cell => cell.row)));
        // Lấy dữ liệu dòng lỗi từ effectivePreviewData
        return errorRowIdxs.map(idx => effectivePreviewData[idx]);
    }, [invalidCells, effectivePreviewData]);

    // Thêm useEffect để validate lại preview khi parsedData hoặc mappingValues thay đổi
    useEffect(() => {
        if (parsedData.length > 0 && Object.keys(mappingValues).length > 0) {
            const { validated, invalids } = validateData();
            setPreviewData(validated);
            setInvalidCells(invalids);
        }
    }, [parsedData, mappingValues]);

    // Nếu không có dữ liệu cũ và không đang upload file mới, hiện màn chọn file
    if (forceChooseSource || ((!group || !group.rows || group.rows.length === 0) && !showUpload)) {
        return (
            <div style={{ width: '100%', height: '100%' }}>
                <Radio.Group
                    value={importSource}
                    onChange={e => setImportSource(e.target.value)}
                    style={{ marginBottom: 16 }}
                    optionType="button"
                    buttonStyle="solid"
                >
                    <Radio.Button value="upload">Tải file từ máy</Radio.Button>
                    <Radio.Button value="rubik">Chọn từ Rubik</Radio.Button>
                </Radio.Group>
                <div style={{ display: 'flex', gap: 32 }}>
                    {/* Upload file từ máy */}
                    <div style={{ flex: 1, opacity: importSource === 'upload' ? 1 : 0.5, pointerEvents: importSource === 'upload' ? 'auto' : 'none' }}>
                        <div className="file-upload-container">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Upload
                                    accept=".xls,.xlsx,.csv"
                                    showUploadList={false}
                                    beforeUpload={beforeUpload}
                                    maxCount={1}
                                    onChange={() => setForceChooseSource(false)}
                                >
                                    <Button icon={<TfiImport />}>Chọn file</Button>
                                </Upload>
                                {fileName && <span className="upload-file-name">{fileName}</span>}
                                <Button onClick={handleLoadLatestData} type="default" loading={loadingOldData}>Load dữ liệu gần nhất</Button>
                            </div>
                            <div className="notice-text">
                                Định dạng file: .xls, .xlsx, .csv. Hàng đầu là header. Mapping các cột dữ liệu bên dưới.<br />
                                Các trường số phải là số, không chứa ký tự đặc biệt.
                            </div>
                        </div>
                    </div>
                    {/* Chọn file từ rubik */}
                    <div style={{ flex: 1, opacity: importSource === 'rubik' ? 1 : 0.5, pointerEvents: importSource === 'rubik' ? 'auto' : 'none' }}>
                        <div className="file-upload-container">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Select
                                    showSearch
                                    style={{ minWidth: 220 }}
                                    placeholder="Chọn file từ Rubik"
                                    loading={rubikLoading}
                                    value={selectedRubikFile ? selectedRubikFile.id : undefined}
                                    onChange={id => {
                                        const file = rubikFiles.find(f => f.id === id);
                                        setSelectedRubikFile(file);
                                    }}
                                    optionFilterProp="children"
                                    filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                                >
                                    {rubikFiles.map(file => (
                                        <Select.Option key={file.id} value={file.id}>
                                            {file.name} ({file.updated_at?.slice(0, 10) || file.created_at?.slice(0, 10)})
                                        </Select.Option>
                                    ))}
                                </Select>
                                <Button type="primary" onClick={() => { handleRubikImport(); setForceChooseSource(false); }} loading={rubikLoading} disabled={!selectedRubikFile}>
                                    Lấy file này
                                </Button>
                            </div>
                            <div className="notice-text">
                                Chọn file đã duyệt từ Rubik (Analysis Review). File sẽ được lấy và import như file tải lên.<br />
                                Định dạng file: .xls, .xlsx, .csv. Hàng đầu là header. Mapping các cột dữ liệu bên dưới.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Nếu đang upload file mới mà chưa chọn file, cũng hiện màn chọn file
    if (showUpload && fileHeaders.length === 0) {
        return (
            <div style={{ width: '100%', height: '100%' }}>
                <div className="file-upload-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Upload
                            accept=".xls,.xlsx,.csv"
                            showUploadList={false}
                            beforeUpload={beforeUpload}
                            maxCount={1}
                        >
                            <Button icon={<TfiImport />}>Chọn file</Button>
                        </Upload>
                        {fileName && <span className="upload-file-name">{fileName}</span>}
                        <Button onClick={handleLoadLatestData} type="default" loading={loadingOldData}>Load dữ liệu gần nhất</Button>
                    </div>
                    <div className="notice-text">
                        Định dạng file: .xls, .xlsx, .csv. Hàng đầu là header. Mapping các cột dữ liệu bên dưới.<br />
                        Các trường số phải là số, không chứa ký tự đặc biệt.
                    </div>
                </div>
            </div>
        );
    }

    // Nếu đã có dữ liệu hoặc đang import mới, luôn hiển thị Tabs (3 tab)
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* <Button
                    onClick={() => {
                        setShowUpload(false);
                        setUseOldData(true);
                    }}
                    type="primary"
                    disabled={!oldImportData || oldImportData.length === 0}
                >
                    Sử dụng dữ liệu cũ
                </Button> */}
            </div>
            {loading && <div style={{ marginBottom: 16 }}><Progress percent={uploadProgress} status={uploadProgress < 100 ? 'active' : 'success'} /></div>}
            <Tabs activeKey={activeTab} onChange={setActiveTab} style={{marginTop: 16, height: '100%'}}>
                <Tabs.TabPane tab="Data File (A)" key="1">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        type="primary"
                        style={{ minWidth: 120, marginBottom: 16 }}
                        onClick={() => {
                            setShowUpload(false);
                            setImportSource('upload'); // hoặc null nếu muốn reset hoàn toàn
                            setFileHeaders([]);
                            setParsedData([]);
                            setFileName('');
                            setMappingValues({});
                            setInvalidCells([]);
                            setPreviewData([]);
                            setUploadProgress(0);
                            setForceChooseSource(true);
                        }}
                    >
                        Import dữ liệu mới
                    </Button>
                    <Button type="primary"
                        onClick={() => {
                            setActiveTab('2');
                        }}
                    >
                        Mapping cột dữ liệu
                    </Button>
                    </div>
                    <div style={{ height: '600px', width: '100%' }} className="ag-theme-quartz">
                        <AgGridReact
                            rowData={
                                (showUpload && fileHeaders.length > 0)
                                    ? parsedData.map((row, idx) => ({ ...row, STT: idx + 1 }))
                                    : group
                                        ? group.rows.map((row, idx) => {
                                            const obj = {};
                                            (group.column || []).forEach((col, i) => { obj[col] = row[i]; });
                                            obj.STT = idx + 1;
                                            return obj;
                                        })
                                        : []
                            }
                            columnDefs={[
                                { headerName: 'STT', field: 'STT', width: 80, pinned: 'left' },
                                ...((showUpload && fileHeaders.length > 0)
                                    ? fileHeaders.map(col => ({ headerName: col, field: col }))
                                    : group && group.column
                                        ? group.column.map(col => ({ headerName: col, field: col }))
                                        : [])
                            ]}
                            defaultColDef={{ resizable: true }}
                            pagination={true}
                            paginationPageSize={300}
                        />
                    </div>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Mapping (A - B)" key="2">
                    <div className="mapping-section" style={{ width: '100%' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                            <p style={{ marginBottom: 8 }}>Mapping cột dữ liệu</p>
                            <Button type="primary"
                                onClick={() => {
                                    setActiveTab('3');
                                }}
                            >Preview dữ liệu</Button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {editableColumns.filter(col => col.field !== 'phan_loai').map((col, idx) => (
                                <div className="select-box" key={col.field} style={{ marginBottom: 0 }}>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>{col.label}</label>
                                    <CustomImportSelect
                                        options={effectiveFileHeaders.map(h => ({ value: h, label: h }))}
                                        value={effectiveMappingValues[col.field] ? { value: effectiveMappingValues[col.field], label: effectiveMappingValues[col.field] } : null}
                                        onChange={opt => handleMappingChange(opt, col.field)}
                                        placeholder="Chọn cột"
                                        isInvalid={invalidCells.some(cell => cell.col === col.field)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Preview" key="3">
                    <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'end' }}>
                        <Button type="primary" onClick={handleUpload} loading={loading} style={{ minWidth: 120 }} disabled={invalidCells.length > 0}>Nhập dữ liệu</Button>
                    </div>
                    <div style={{ height: '600px', width: '100%' }} className="ag-theme-quartz">
                        <AgGridReact
                            rowData={effectivePreviewData}
                            columnDefs={[
                                { headerName: 'STT', field: 'serial_number', width: 80, pinned: 'left' },
                                ...editableColumns.map(col => ({
                                    headerName: col.label,
                                    field: col.field,
                                    cellStyle: params => invalidCells.some(cell => cell.row === (params.data.serial_number - 1) && cell.col === col.field)
                                        ? { backgroundColor: 'rgb(255,75,75)', color: 'white' } : {},
                                }))
                            ]}
                            defaultColDef={{ resizable: true }}
                            pagination={true}
                            paginationPageSize={300}
                        />
                    </div>
                </Tabs.TabPane>
                {invalidCells.length > 0 && (
                    <Tabs.TabPane tab="Lỗi" key="error">
                        <div style={{ height: '600px', width: '100%' }} className="ag-theme-quartz">
                            <AgGridReact
                                rowData={errorRows}
                                columnDefs={[
                                    { headerName: 'STT', field: 'serial_number', width: 80, pinned: 'left' },
                                    ...editableColumns.map(col => ({
                                        headerName: col.label,
                                        field: col.field,
                                        cellStyle: params => invalidCells.some(cell => cell.row === (params.data.serial_number - 1) && cell.col === col.field)
                                            ? { backgroundColor: 'rgb(255,75,75)', color: 'white' } : {},
                                    }))
                                ]}
                                defaultColDef={{ resizable: true }}
                                pagination={true}
                                paginationPageSize={300}
                            />
                        </div>
                    </Tabs.TabPane>
                )}
            </Tabs>
            <Modal open={isPreviewOpen} onCancel={() => setIsPreviewOpen(false)} footer={null} width={1000} title="Preview dữ liệu">
                <div style={{ height: '600px', width: '100%' }}>
                    <div style={{ height: '100%', width: '100%' }} className="ag-theme-quartz">
                        <AgGridReact
                            rowData={effectivePreviewData}
                            columnDefs={[
                                { headerName: 'STT', field: 'serial_number', width: 80, pinned: 'left' },
                                ...editableColumns.map(col => ({
                                    headerName: col.label,
                                    field: col.field,
                                    cellStyle: params => invalidCells.some(cell => cell.row === (params.data.serial_number - 1) && cell.col === col.field)
                                        ? { backgroundColor: 'rgb(255,75,75)', color: 'white' } : {},
                                }))
                            ]}
                            defaultColDef={{ resizable: true }}
                            pagination={true}
                            paginationPageSize={300}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
} 