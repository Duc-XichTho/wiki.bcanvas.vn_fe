import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import '../../../../Home/AgridTable/agComponent.css';
import AG_GRID_LOCALE_VN from '../../../../Home/AgridTable/locale';
import { Plus, Edit3, Trash2, Search as SearchIcon, X, Check, BarChart2, ListChecks } from 'lucide-react';
import { message, Popover } from 'antd';
import styles from './IndicatorMap.module.css';
import { updateKpiMetric } from '../../../../../apis/kpiMetricService.jsx';
import { updateMeasure } from '../../../../../apis/measureService.jsx';

const TableView = ({
	currentData,
	onAddKPI,
	onAddMeasure,
	onEditKPI,
	onEditMeasure,
	onRequestDeleteKPI,
	onRequestDeleteMeasure,
	isEditing = false,
	onRequestDeleteKPIs,
	onRequestDeleteMeasures
}) => {
    // Description modal state
    const [showDescModal, setShowDescModal] = useState(false);
    const [descEntityType, setDescEntityType] = useState('kpi');
    const [descRecord, setDescRecord] = useState(null);
    const [descText, setDescText] = useState('');

    // Local row data mirrors to enable internal updates
    const [kpiRows, setKpiRows] = useState(currentData.kpis || []);
    const [measureRows, setMeasureRows] = useState(currentData.measures || []);

    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    useEffect(() => {
        setKpiRows(currentData.kpis || []);
    }, [currentData.kpis]);
    useEffect(() => {
        setMeasureRows(currentData.measures || []);
    }, [currentData.measures]);

    // Quick filters and grid APIs
    const [quickFilterKpi, setQuickFilterKpi] = useState('');
    const [quickFilterMeasure, setQuickFilterMeasure] = useState('');
    const kpiGridApiRef = useRef(null);
    const measureGridApiRef = useRef(null);

    // View switch (tabs)
    const [activeTable, setActiveTable] = useState('kpi'); // 'kpi' | 'measure'

    // Multi-select state
    const [selectedKpiIds, setSelectedKpiIds] = useState([]);
    const [selectedMeasureIds, setSelectedMeasureIds] = useState([]);

    // Pending edits collected by onCellValueChanged (per grid)
    const kpiEditsRef = useRef({});
    const measureEditsRef = useRef({});
    const [kpiEditCount, setKpiEditCount] = useState(0);
    const [measureEditCount, setMeasureEditCount] = useState(0);

    // Link measures to KPI modal
    const [showLinkMeasureModal, setShowLinkMeasureModal] = useState(false);
    const [linkingKpi, setLinkingKpi] = useState(null);
    const [selectedMeasureIdsTemp, setSelectedMeasureIdsTemp] = useState([]);

    const openLinkMeasureModal = useCallback((kpiRow) => {
        setLinkingKpi(kpiRow);
        const initial =
            (kpiEditsRef.current[kpiRow.id]?.measures)
            ?? (kpiEditsRef.current[kpiRow.id]?.measureIds)
            ?? (Array.isArray(kpiRow.measures)
                ? kpiRow.measures
                : (Array.isArray(kpiRow.measureIds) ? kpiRow.measureIds : []));
        setSelectedMeasureIdsTemp(initial);
        setShowLinkMeasureModal(true);
    }, []);

    const toggleTempMeasureId = useCallback((measureId, checked) => {
        setSelectedMeasureIdsTemp(prev => {
            if (checked) return Array.from(new Set([...(prev || []), measureId]));
            return (prev || []).filter(id => id !== measureId);
        });
    }, []);

    const confirmLinkMeasures = useCallback(async () => {
        if (!linkingKpi) return;
        const kpiId = linkingKpi.id;
        const next = { ...(kpiEditsRef.current[kpiId] || {}), id: kpiId, measures: selectedMeasureIdsTemp, measureIds: selectedMeasureIdsTemp };
        kpiEditsRef.current[kpiId] = next;
        setKpiEditCount(Object.keys(kpiEditsRef.current).length);
        // reflect pending selection in UI immediately (ensure both props available)
        setKpiRows(prev => prev.map(r => (r.id === kpiId ? { ...r, measures: selectedMeasureIdsTemp, measureIds: selectedMeasureIdsTemp } : r)));

        try {
            const updated = await updateKpiMetric({ id: kpiId, measures: selectedMeasureIdsTemp, measureIds: selectedMeasureIdsTemp });
            setKpiRows(prev => prev.map(r => (r.id === kpiId ? updated : r)));
            // clear pending for this KPI
            delete kpiEditsRef.current[kpiId];
            setKpiEditCount(Object.keys(kpiEditsRef.current).length);
            message.success('Đã lưu liên kết đo lường');
        } catch (e) {
            console.error('Lỗi lưu liên kết đo lường:', e);
            message.error('Lưu liên kết đo lường thất bại');
        }

        setShowLinkMeasureModal(false);
        setLinkingKpi(null);
        setSelectedMeasureIdsTemp([]);
    }, [linkingKpi, selectedMeasureIdsTemp]);

    const cancelLinkMeasures = useCallback(() => {
        setShowLinkMeasureModal(false);
        setLinkingKpi(null);
        setSelectedMeasureIdsTemp([]);
    }, []);

    // Inline editing: save immediately per-cell via onCellValueChanged

    const openDescModal = (record, type) => {
        setDescEntityType(type);
        setDescRecord(record);
        setDescText(record?.description || '');
        setShowDescModal(true);
    };

    const trySaveDescription = async () => {
        if (!descRecord) return;
        try {
            if (descEntityType === 'kpi') {
                const updated = await updateKpiMetric({ id: descRecord.id, description: descText });
                setKpiRows(prev => prev.map(r => (r.id === descRecord.id ? updated : r)));
            } else {
                const updated = await updateMeasure({ id: descRecord.id, description: descText });
                setMeasureRows(prev => prev.map(r => (r.id === descRecord.id ? updated : r)));
            }
            message.success('Đã lưu mô tả');
            setShowDescModal(false);
            setDescRecord(null);
            setDescText('');
        } catch (e) {
            console.error('Lỗi lưu mô tả:', e);
            message.error('Lưu mô tả thất bại');
        }
    };

    const handleCellValueChangedKpi = useCallback(async (event) => {
        const id = event?.data?.id;
        const field = event?.colDef?.field;
        const newValue = event?.newValue;
        if (!id || !field) return;
        // buffer change
        const next = { ...(kpiEditsRef.current[id] || {}), id, [field]: newValue };
        kpiEditsRef.current[id] = next;
        setKpiEditCount(Object.keys(kpiEditsRef.current).length);
    }, []);

    const handleCellValueChangedMeasure = useCallback(async (event) => {
        const id = event?.data?.id;
        const field = event?.colDef?.field;
        const newValue = event?.newValue;
        if (!id || !field) return;
        const next = { ...(measureEditsRef.current[id] || {}), id, [field]: newValue };
        measureEditsRef.current[id] = next;
        setMeasureEditCount(Object.keys(measureEditsRef.current).length);
    }, []);

    const handleSaveKpiEdits = useCallback(async () => {
        const entries = Object.values(kpiEditsRef.current);
        if (entries.length === 0) return;
        try {
            for (const change of entries) {
                const { id, ...payload } = change;
                const updated = await updateKpiMetric({ id, ...payload });
                setKpiRows(prev => prev.map(r => (r.id === id ? updated : r)));
            }
            kpiEditsRef.current = {};
            setKpiEditCount(0);
            message.success('Đã lưu các thay đổi chỉ số');
        } catch (e) {
            console.error('Lỗi lưu chỉ số:', e);
            message.error('Lưu chỉ số thất bại');
        }
    }, []);

    const handleSaveMeasureEdits = useCallback(async () => {
        const entries = Object.values(measureEditsRef.current);
        if (entries.length === 0) return;
        try {
            for (const change of entries) {
                const { id, ...payload } = change;
                const updated = await updateMeasure({ id, ...payload });
                setMeasureRows(prev => prev.map(r => (r.id === id ? updated : r)));
            }
            measureEditsRef.current = {};
            setMeasureEditCount(0);
            message.success('Đã lưu các thay đổi đo lường');
        } catch (e) {
            console.error('Lỗi lưu đo lường:', e);
            message.error('Lưu đo lường thất bại');
        }
    }, []);

    // Selection handlers
    const onKpiSelectionChanged = useCallback(() => {
        if (!kpiGridApiRef.current) return;
        const rows = kpiGridApiRef.current.getSelectedRows?.() || [];
        setSelectedKpiIds(rows.map(r => r.id));
    }, []);

    const onMeasureSelectionChanged = useCallback(() => {
        if (!measureGridApiRef.current) return;
        const rows = measureGridApiRef.current.getSelectedRows?.() || [];
        setSelectedMeasureIds(rows.map(r => r.id));
    }, []);

    const kpiColumnDefs = useMemo(() => ([
        { headerName: '', width: 36, pinned: true, checkboxSelection: true, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true , hide : !isEditing},
        { headerName: 'Tên', field: 'name', width: 350, sortable: true, filter: true, editable: isEditing },
        { headerName: 'Danh mục', field: 'category', width: 160, sortable: true, filter: true, editable: isEditing },
        {
            headerName: 'Đo lường', field: 'measures',
            flex: 2, wrapText: false, autoHeight: false, filter: true,
            editable: false,
            cellStyle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
            cellRenderer: (params) => {
                const row = params.data || {};
                const ids = Array.isArray(row.measures)
                    ? row.measures
                    : (Array.isArray(row.measureIds) ? row.measureIds : []);
                const names = ids
                    .map(id => (measureRows.find(m => m.id === id)?.name))
                    .filter(Boolean);
                const summary = names.length === 0
                    ? 'Chưa chọn'
                    : names.length <= 20
                        ? names.join(', ')
                        : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
                return (
                    <div className={styles.descCell}>
                        <Popover
                            placement="topLeft"
                            overlayStyle={{ maxWidth: 360 }}
                            content={
                                <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                                    {names.length === 0 ? (
                                        <div style={{ color: '#6b7280', fontSize: 12 }}>Chưa chọn</div>
                                    ) : (
                                        <div style={{ display: 'grid', rowGap: 6 }}>
                                            {names.map((n, idx) => (
                                                <div key={idx} style={{ fontSize: 12, color: '#111827' }}>• {n}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            }
                        >
                            <span
                                style={{ display: 'inline-block', maxWidth: 'calc(100% - 64px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: names.length > 0 ? 'pointer' : 'default' }}
                                title={names.join(', ')}
                            >
                                {summary}
                            </span>
                        </Popover>
                        {isEditing && (
                            <button className={styles.descBtn} onClick={() => openLinkMeasureModal(params.data)}>Chọn</button>
                        )}
                    </div>
                );
            }
        },
        {
            headerName: 'Mô tả', field: 'description',
            flex: 2, wrapText: false, autoHeight: false, filter: true,
            editable: false,
            tooltipField: 'description',
            cellStyle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
            cellRenderer: (params) => (
                <div className={styles.descCell}>
                    <span
                        style={{ display: 'inline-block', maxWidth: 'calc(100% - 64px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                        {params.data?.description || ''}
                    </span>
                    <button className={styles.descBtn} onClick={() => openDescModal(params.data, 'kpi')}>Chi tiết</button>
                </div>
            )
        },
        {
            headerName: '', field: 'id', width: 40, pinned: true, hide : !isEditing,
            cellRenderer: (params) => {
                const d = params.data;
                return (
                    <div style={{ display: 'flex', gap: 6 }}>
                            <button className={styles.gridActionBtnDanger} onClick={() => onRequestDeleteKPI(d)} title="Xóa">
                                <Trash2 size={14} />
                            </button>
                    </div>
                );
            }
        }
    ]), [onEditKPI, onRequestDeleteKPI, measureRows, openLinkMeasureModal, isEditing]);

    const measureColumnDefs = useMemo(() => ([
        { headerName: '', width: 36, pinned: true, checkboxSelection: true, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true , hide : !isEditing},
        { headerName: 'Tên', field: 'name',width: 350, sortable: true, filter: true, editable: isEditing },
        { headerName: 'Nguồn', field: 'source', width: 160, sortable: true, filter: true, editable: isEditing },

        {
            headerName: 'Mô tả', field: 'description', flex: 2, wrapText: false, autoHeight: false, filter: true,
            editable: false,
            tooltipField: 'description',
            cellStyle: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
            cellRenderer: (params) => (
                <div className={styles.descCell}>
                    <span
                        style={{ display: 'inline-block', maxWidth: 'calc(100% - 64px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                        {params.data?.description || ''}
                    </span>
                    <button className={styles.descBtn} onClick={() => openDescModal(params.data, 'measure')}>Chi tiết</button>
                </div>
            )
        },
        {
            headerName: '', field: 'id', width: 40, pinned: true, hide : !isEditing,
            cellRenderer: (params) => {
                const d = params.data;
                return (
                    <div style={{ display: 'flex', gap: 6 }}>
                            <button className={styles.gridActionBtnDanger} onClick={() => onRequestDeleteMeasure(d)} title="Xóa">
                                <Trash2 size={14} />
                            </button>
                    </div>
                );
            }
        }
    ]), [onEditMeasure, onRequestDeleteMeasure, isEditing]);

    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        filter: true,
        suppressMenu: true,
        cellStyle: { fontSize: '14.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        tooltipValueGetter: (params) => (params && params.value != null ? String(params.value) : '')
    }), []);

    const onKpiGridReady = useCallback((params) => {
        kpiGridApiRef.current = params.api;
        if (quickFilterKpi) params.api.setGridOption('quickFilterText', quickFilterKpi);
    }, [quickFilterKpi]);

    const onMeasureGridReady = useCallback((params) => {
        measureGridApiRef.current = params.api;
        if (quickFilterMeasure) params.api.setGridOption('quickFilterText', quickFilterMeasure);
    }, [quickFilterMeasure]);

    useEffect(() => {
        if (kpiGridApiRef.current) kpiGridApiRef.current.setGridOption('quickFilterText', quickFilterKpi);
    }, [quickFilterKpi]);
    useEffect(() => {
        if (measureGridApiRef.current) measureGridApiRef.current.setGridOption('quickFilterText', quickFilterMeasure);
    }, [quickFilterMeasure]);

    // No row-leave auto-save; handled by onCellValueChanged


    // Handlers above per grid

    return (
        <div className={styles.tableContainer}>
            <div className={styles.viewSwitch}>
                <button
                    className={`${styles.viewBtn} ${activeTable === 'kpi' ? styles.viewBtnActive : ''}`}
                    onClick={() => setActiveTable('kpi')}
                    title="Xem bảng Chỉ số (KPIs)"
                >
                    <BarChart2 size={16} /> KPIs
                </button>
                <button
                    className={`${styles.viewBtn} ${activeTable === 'measure' ? styles.viewBtnActive : ''}`}
                    onClick={() => setActiveTable('measure')}
                    title="Xem bảng Đo lường (Measures)"
                >
                    <ListChecks size={16} /> Measures
                </button>
            </div>

            {activeTable === 'kpi' && (
            <div className={`${styles.tablePanel} ${styles.tablePanelFlex}`}>
                <div className={styles.tableHeader}>
                    <h4 className={styles.columnTitle}>Chỉ số (KPIs)</h4>
                    <div className={styles.tableHeaderActions}>
                        <div className={styles.quickFilterWrap}>
                            <SearchIcon size={14} />
                            <input className={styles.quickFilterInput} placeholder="Tìm kiếm..." value={quickFilterKpi} onChange={(e) => setQuickFilterKpi(e.target.value)} />
                        </div>
                        {kpiEditCount > 0 && (
                            <button className={styles.saveButton} onClick={handleSaveKpiEdits} title="Lưu thay đổi">
                                <Check size={14} /> Lưu ({kpiEditCount})
                            </button>
                        )}
                        {isEditing && selectedKpiIds.length > 0 && (
                            <button className={styles.gridActionBtnDanger} onClick={() => onRequestDeleteKPIs?.(selectedKpiIds)} title="Xóa đã chọn">
                                <Trash2 size={14} /> Xóa ({selectedKpiIds.length})
                            </button>
                        )}
                        {isEditing && (
                            <button onClick={onAddKPI} className={styles.addButton} title="Thêm chỉ số"><Plus className={styles.addIcon} /></button>
                        )}
                    </div>
                </div>
                <div className={`ag-theme-quartz ${styles.gridAuto}`}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        rowData={kpiRows}
                        columnDefs={kpiColumnDefs}
                        defaultColDef={defaultColDef}
                        onGridReady={onKpiGridReady}
                        onCellValueChanged={handleCellValueChangedKpi}
                        rowSelection="multiple"
                        suppressRowClickSelection={true}
                        onSelectionChanged={onKpiSelectionChanged}
                        localeText={AG_GRID_LOCALE_VN}
                    />
                </div>
            </div>
            )}

            {activeTable === 'measure' && (
            <div className={`${styles.tablePanel} ${styles.tablePanelFlex}`}>
                <div className={styles.tableHeader}>
                    <h4 className={styles.columnTitle}>Đo lường (Measures)</h4>
                    <div className={styles.tableHeaderActions}>
                        <div className={styles.quickFilterWrap}>
                            <SearchIcon size={14} />
                            <input className={styles.quickFilterInput} placeholder="Tìm kiếm..." value={quickFilterMeasure} onChange={(e) => setQuickFilterMeasure(e.target.value)} />
                        </div>
                        {measureEditCount > 0 && (
                            <button className={styles.saveButton} onClick={handleSaveMeasureEdits} title="Lưu thay đổi">
                                <Check size={14} /> Lưu ({measureEditCount})
                            </button>
                        )}
                        {isEditing && selectedMeasureIds.length > 0 && (
                            <button className={styles.gridActionBtnDanger} onClick={() => onRequestDeleteMeasures?.(selectedMeasureIds)} title="Xóa đã chọn">
                                <Trash2 size={14} /> Xóa ({selectedMeasureIds.length})
                            </button>
                        )}
                        {isEditing && (
                            <button onClick={onAddMeasure} className={styles.addButton} title="Thêm đo lường"><Plus className={styles.addIcon} /></button>
                        )}
                    </div>
                </div>
                <div className={`ag-theme-quartz ${styles.gridAuto}`}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        rowData={measureRows}
                        columnDefs={measureColumnDefs}
                        defaultColDef={defaultColDef}
                        onGridReady={onMeasureGridReady}
                        onCellValueChanged={handleCellValueChangedMeasure}
                        rowSelection="multiple"
                        suppressRowClickSelection={true}
                        onSelectionChanged={onMeasureSelectionChanged}
                        localeText={AG_GRID_LOCALE_VN}
                    />
                </div>
            </div>
            )}

            {showDescModal && (
                <div className={styles.descModalOverlay}>
                    <div className={styles.descModal}>
                        <div className={styles.descModalHeader}>
                            <h4 className={styles.descModalTitle}>{descEntityType === 'kpi' ? 'Mô tả chỉ số' : 'Mô tả đo lường'}</h4>
                            <button className={styles.descCloseBtn} onClick={() => setShowDescModal(false)} title="Đóng"><X size={16} /></button>
                        </div>
                        <div className={styles.descModalBody}>
                            <textarea className={styles.descTextarea} rows={8} value={descText} onChange={(e) => setDescText(e.target.value)} placeholder="Nhập mô tả chi tiết..." />
                        </div>
                        {
                            isEditing && (
                            
                                <div className={styles.descModalFooter}>
                                <button className={styles.cancelButton} onClick={() => setShowDescModal(false)}><X size={14} /> Hủy</button>
                                <button className={styles.saveButton} onClick={trySaveDescription}><Check size={14} /> Lưu</button>
                            </div>
                            )
                        }
                       
                    </div>
                </div>
            )}

            {showLinkMeasureModal && (
                <div className={styles.descModalOverlay}>
                    <div className={styles.descModal}>
                        <div className={styles.descModalHeader}>
                            <h4 className={styles.descModalTitle}>Chọn đo lường cho chỉ số</h4>
                            <button className={styles.descCloseBtn} onClick={cancelLinkMeasures} title="Đóng"><X size={16} /></button>
                        </div>
                        <div className={styles.descModalBody}>
                            <div style={{ maxHeight: 360, overflow: 'auto', padding: 8 }}>
                                {measureRows.map(m => (
                                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedMeasureIdsTemp.includes(m.id)}
                                            onChange={(e) => toggleTempMeasureId(m.id, e.target.checked)}
                                        />
                                        <span>{m.name}</span>
                                    </label>
                                ))}
                                {measureRows.length === 0 && <div>Chưa có đo lường</div>}
                            </div>
                        </div>
                        <div className={styles.descModalFooter}>
                            <button className={styles.cancelButton} onClick={cancelLinkMeasures}><X size={14} /> Hủy</button>
                            <button className={styles.saveButton} onClick={confirmLinkMeasures}><Check size={14} /> Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableView;


