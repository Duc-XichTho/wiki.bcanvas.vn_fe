import React, { useEffect, useState } from 'react';
import { Modal, Select, Button, message, Spin, Row, Col } from 'antd';
import { getFileTabByTypeData } from '../../../../apis/fileTabService.jsx';
import { createKTQTMapping, getAllKTQTMapping, updateKTQTMapping } from '../../../../apis/ktqtMappingService.jsx';
import { getTemplateColumnForTemplate, getTemplateRow,getTemplateByFileNoteId } from '../../../../apis/templateSettingService.jsx';
import { getTemplateDataById } from '../../../../apis/templateService.jsx';
import { getAllKTQTImport, updateKTQTImport } from '../../../../apis/ktqtImportService.jsx';
import { getAllSoKeToan, updateBulkSoKeToan } from '../../../../apisKTQT/soketoanService.jsx';
import { getAllApprovedVersion, getApprovedVersionDataById } from '../../../../apis/approvedVersionTemp.jsx';
import { getTemplateInfoByTableId } from '../../../../apis/templateSettingService.jsx';

const MAPPING_CATEGORIES = [
    { id: 'kmf', label: 'Khoản mục KQKD' },
    { id: 'san_pham', label: 'Sản phẩm' },
    { id: 'kenh', label: 'Kênh' },
    { id: 'vu_viec', label: 'Vụ việc' },
    { id: 'bo_phan', label: 'Bộ phận' }
];

const ALL_CONFIGS = MAPPING_CATEGORIES.map(cat => ({ category: cat.id, categoryLabel: cat.label }));

const TYPE_OPTIONS = [
    { value: 'doanh_thu', label: 'Doanh thu' },
    { value: 'gia_von', label: 'Giá vốn' },
    { value: 'chi_phi', label: 'Chi phí' },
];

const MappingCategorySettingModal = ({ open, onClose }) => {
    const [fileTabs, setFileTabs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // Lưu id fileTab cho từng dòng
    const [selectedTabs, setSelectedTabs] = useState({});
    // Lưu danh sách cột cho từng bảng
    const [columnsByTab, setColumnsByTab] = useState({});
    // Lưu rowData cho từng bảng
    const [rowDataByTab, setRowDataByTab] = useState({});
    // Lưu id cột đã chọn cho từng dòng
    const [selectedColumns, setSelectedColumns] = useState({});
    // State để lưu mappingMap (key: type_danhMuc, value: mapping object)
    const [mappingMapState, setMappingMapState] = useState({});
    const [selectedTypes, setSelectedTypes] = useState({});

    useEffect(() => {
        if (open) {
            setLoading(true);
            Promise.all([
                getAllApprovedVersion(),
                getAllKTQTMapping()
            ])
                .then(async ([allData, mappings]) => {
                    // Lấy danh sách file Rubik đã duyệt (apps.includes('fdr'))
                    const rubikFiles = (allData || []).filter(item => Array.isArray(item.apps) && item.apps.includes('fdr'));
                    console.log(rubikFiles);
                    setFileTabs(rubikFiles.map(item => ({
                        id: item.id,
                        name: item.name,
                        id_version: item.id_version,
                        id_fileNote: item.id_fileNote,
                        updated_at: item.updated_at,
                        created_at: item.created_at
                    })));
                    // mapping: danhMuc, nguon, dich
                    const selectedTabsInit = {};
                    const selectedColumnsInit = {};
                    const columnsByTabInit = {};
                    const rowDataByTabInit = {};
                    const selectedTypesInit = {};
                    // Đảm bảo đủ bản ghi mapping cho từng danh mục
                    const mappingMap = {};
                    (mappings || []).forEach(m => {
                        mappingMap[m.danhMuc] = m;
                    });
                    // Tạo mới nếu thiếu
                    for (const cfg of ALL_CONFIGS) {
                        const key = cfg.category;
                        if (!mappingMap[key]) {
                            try {
                                const res = await createKTQTMapping({
                                    danhMuc: cfg.category,
                                    nguon: null,
                                    dich: null,
                                    data: [],
                                    setting: { types: [] }
                                });
                                if (res?.data) {
                                    mappingMap[key] = res.data;
                                }
                            } catch (e) {}
                        }
                    }
                    // Set lại state
                    for (const key in mappingMap) {
                        const m = mappingMap[key];
                        if (m.nguon) {
                            selectedTabsInit[key] = m.nguon;
                            if (!columnsByTabInit[m.nguon]) {
                                try {
                                    // Lấy thông tin version và cột từ Rubik
                                    const data = rubikFiles.find(f => f.id == m.nguon);
                                    console.log('m.nguon:', m.nguon, 'data:', data, 'rubikFiles:', rubikFiles);
                                    if (!data) {
                                        console.warn('Không tìm thấy bảng Rubik với id:', m.nguon);
                                        columnsByTabInit[m.nguon] = [];
                                        rowDataByTabInit[m.nguon] = [];
                                        continue; // hoặc return;
                                    }
                                    const info = await getApprovedVersionDataById(data.id);
                                    console.log(info);
                                    const templateInfo = await getTemplateInfoByTableId(info.id_template);
                                    let versionObj;
                                    if (info.id_version == 1 || info.id_version == null) {
                                        versionObj = templateInfo.versions.find(v => v.version == null);
                                    } else {
                                        versionObj = templateInfo.versions.find(v => v.version == info.id_version);
                                    }
                                    columnsByTabInit[m.nguon] = (versionObj ? versionObj.columns.map(col => ({ columnName: col })) : []);
                                    const rowDataResponse = await getTemplateRow(info.id_template, info.id_version == 1 || info.id_version == null ? null : info.id_version);
                                    const rowData = rowDataResponse.rows || [];
                                    rowDataByTabInit[m.nguon] = rowData;
                                } catch (e) {}
                            }
                        }
                        if (m.dich) {
                            selectedColumnsInit[key] = m.dich;
                        }
                        // Lấy setting.types nếu có
                        if (m.setting && Array.isArray(m.setting.types)) {
                            selectedTypesInit[key] = m.setting.types;
                        } else {
                            selectedTypesInit[key] = [];
                        }
                    }
                    setSelectedTabs(selectedTabsInit);
                    setSelectedColumns(selectedColumnsInit);
                    setColumnsByTab(columnsByTabInit);
                    setRowDataByTab(rowDataByTabInit);
                    setMappingMapState(mappingMap);
                    setSelectedTypes(selectedTypesInit);
                })
                .catch(() => {
                    message.error('Không thể tải danh sách bảng dữ liệu hoặc mapping');
                })
                .finally(() => setLoading(false));
        }
    }, [open]);

    // Reset khi mở lại modal
    useEffect(() => {
        if (open) {
            // Nếu không fetch mapping thì reset
            // setSelectedTabs({});
            // setColumnsByTab({});
            // setRowDataByTab({});
            // setSelectedColumns({});
        }
    }, [open]);

    // Khi chọn bảng dữ liệu cho từng dòng, fetch cột và rowData
    const handleSelectTab = async (key, tabId) => {
        setSelectedTabs(prev => ({ ...prev, [key]: tabId }));
        setSelectedColumns(prev => ({ ...prev, [key]: undefined })); // reset cột đã chọn

        if (tabId) {
            setLoading(true);
            try {
                // Tìm file Rubik đã chọn
                const file = fileTabs.find(f => f.id == tabId);
                if (file) {
                    // Lấy thông tin version
                    const info = await getApprovedVersionDataById(file.id);
                    // Lấy thông tin cột
                    const templateInfo = await getTemplateInfoByTableId(info.id_template);
                    let versionObj;
                    if (info.id_version == 1 || info.id_version == null) {
                        versionObj = templateInfo.versions.find(v => v.version == null);
                    } else {
                        versionObj = templateInfo.versions.find(v => v.version == info.id_version);
                    }
                    setColumnsByTab(prev => ({
                        ...prev,
                        [tabId]: (versionObj ? versionObj.columns.map(col => ({ columnName: col })) : [])
                    }));
                    // Lấy dữ liệu dòng nếu cần
                    const rowDataResponse = await getTemplateRow(info.id_template, info.id_version == 1 || info.id_version == null ? null : info.id_version);
                    const rowData = rowDataResponse.rows || [];
                    setRowDataByTab(prev => ({ ...prev, [tabId]: rowData }));
                }
            } catch (e) {
                message.error('Không thể tải cột hoặc dữ liệu bảng');
            } finally {
                setLoading(false);
            }
        }
    };

    // Khi chọn cột dữ liệu
    const handleSelectColumn = (key, columnId) => {
        setSelectedColumns(prev => ({ ...prev, [key]: columnId }));
    };

    // Lấy unique value của cột đã chọn
    const getUniqueValues = (tabId, columnId) => {
        const rows = rowDataByTab[tabId] || [];
        if (!columnId) return [];
        const values = rows.map(row => row.data?.[columnId]).filter(v => v !== undefined && v !== null);
        return Array.from(new Set(values));
    };

    const handleSelectTypes = (key, typesArr) => {
        setSelectedTypes(prev => ({ ...prev, [key]: typesArr }));
    };

    const handleSave = async () => {
        setSaving(true);
        const startTime = Date.now();
        console.log('[Mapping] Bắt đầu lưu cấu hình mapping:', new Date(startTime).toLocaleString());
        try {
            await Promise.all(ALL_CONFIGS.map(async cfg => {
                const tabId = selectedTabs[cfg.category];
                const columnId = selectedColumns[cfg.category];
                const key = cfg.category;
                const mapping = mappingMapState[key];
                const typesArr = selectedTypes[key] || [];
                const setting = { types: typesArr };
                // Chỉ lưu lại các lựa chọn bảng/cột/types
                if (mapping && mapping.id) {
                    await updateKTQTMapping(mapping.id, {
                        danhMuc: cfg.category,
                        nguon: tabId || null,
                        dich: columnId || null,
                        data: mapping.data || { DT: [], GV: [], CP: [] },
                        setting
                    });
                } else if (tabId || columnId || typesArr.length > 0) {
                    await createKTQTMapping({
                        danhMuc: cfg.category,
                        nguon: tabId || null,
                        dich: columnId || null,
                        data: { DT: [], GV: [], CP: [] },
                        setting
                    });
                }
            }));
            const endTime = Date.now();
            console.log('[Mapping] Lưu cấu hình mapping thành công. Tổng thời gian:', (endTime - startTime) / 1000, 'giây');
            message.success('Lưu cấu hình thành công');
            onClose();
        } catch (e) {
            console.error('[Mapping] Lỗi khi lưu cấu hình mapping:', e);
            message.error('Lưu cấu hình thất bại');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title="Cài đặt danh mục chuẩn cho Mapping"
            footer={(<>
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                        <Button onClick={onClose} style={{ marginRight: 8 }}>Hủy</Button>
                        <Button type="primary" loading={saving} onClick={handleSave}>Lưu</Button>
                    </div>
            </>)}
            destroyOnClose
            width={'60vw'}
            centered
        >
            <Spin spinning={loading}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowX: 'hidden' }}>
                    <Row style={{ fontWeight: 'bold', marginBottom: 8 }} gutter={8}>
                        <Col span={6}>Danh mục</Col>
                        <Col span={6}>Bảng đang chứa</Col>
                        <Col span={6}>Bảng lấy danh sách chuẩn</Col>
                        <Col span={6}>Cột lấy danh sách chuẩn</Col>
               
                    </Row>
                    {ALL_CONFIGS.map(cfg => {
                        const key = cfg.category;
                        const tabId = selectedTabs[key];
                        const columns = tabId ? columnsByTab[tabId] || [] : [];
                        return (
                            <Row key={key} gutter={8} align="middle">
                                <Col span={6} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.categoryLabel}</Col>
                                
                                <Col span={6} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Select
                                        mode="multiple"
                                        value={selectedTypes[key] || []}
                                        onChange={val => handleSelectTypes(key, val)}
                                        style={{ width: '100%' }}
                                        placeholder="Chọn Dataset"
                                        allowClear
                                    >
                                        {TYPE_OPTIONS.map(opt => (
                                            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                        ))}
                                    </Select>
                                </Col>
                                <Col span={6} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Select
                                        value={tabId ? String(tabId) : null}
                                        onChange={val => handleSelectTab(key, val)}
                                        style={{ width: '100%' }}
                                        showSearch
                                        optionFilterProp="children"
                                        allowClear
                                        placeholder="Chọn bảng dữ liệu"
                                    >
                                        {fileTabs.map(tab => (
                                            <Select.Option key={String(tab.id)} value={String(tab.id)}>
                                                {tab.name} ({tab.updated_at?.slice(0, 10) || tab.created_at?.slice(0, 10)})
                                            </Select.Option>
                                        ))}
                                        {tabId && !fileTabs.find(f => String(f.id) === String(tabId)) && (
                                            <Select.Option key={String(tabId)} value={String(tabId)} disabled>
                                                [Bảng đã bị xóa hoặc không tồn tại] ({tabId})
                                            </Select.Option>
                                        )}
                                    </Select>
                                    {/* Hiển thị tên bảng đã chọn thay vì id nếu có */}
                                 
                                </Col>
                                <Col span={6} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <Select
                                        value={selectedColumns[key]}
                                        onChange={val => handleSelectColumn(key, val)}
                                        style={{ width: '100%' }}
                                        showSearch
                                        optionFilterProp="children"
                                        allowClear
                                        placeholder="Chọn cột dữ liệu"
                                        disabled={!tabId || columns.length == 0}
                                    >
                                        {columns.map(col => (
                                            <Select.Option key={col.columnName} value={col.columnName}>{col.columnName}</Select.Option>
                                        ))}
                                    </Select>
                                </Col>
                                
                            </Row>
                        );
                    })}
                  
                </div>
            </Spin>
        </Modal>
    );
};

export default MappingCategorySettingModal; 