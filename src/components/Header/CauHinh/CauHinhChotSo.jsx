import React, { useEffect, useMemo, useRef, useState } from 'react';
// AG GRID
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../../../pages/Home/AgridTable/locale';
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
// ANTD
import { Modal, Button, message, Select, Switch } from 'antd';
// API
import { getAllCauHinh, updateCauHinh } from '../../../apis/cauHinhService.jsx';
import { getSettingByType, createSetting, updateSetting } from '../../../apis/settingService.jsx';
//  CONSTANT
import { SETTING_TYPE, SETTING_CHOTSO } from '../../../CONST.js';
import { FIELD_VALUE_CAU_HINH } from '../../../Consts/FIELD_VALUE_CAU_HINH.js';

const CauHinhChotSo = ({ showCauHinhChotSo, setShowCauHinhChotSo }) => {
    const gridRef = useRef();
    const [settingId, setSettingId] = useState(null);
    const [settingData, setSettingData] = useState(null);
    const [rowId, setRowId] = useState(null);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [typeDropDown, setTypeDropDown] = useState([]);
    const [selectedView, setSelectedView] = useState(SETTING_CHOTSO.month);

    const SwitchRenderer = props => {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Switch
                    checkedChildren="Mở"
                    unCheckedChildren="Khóa"
                    checked={props.value}
                    disabled={!editMode}
                    onChange={(checked) => {
                        props.setValue(checked);
                    }}
                    size="big"
                />
            </div>
        );
    };

    const generateColumns = () => {
        const baseColumns = [
            {
                field: 'id',
                headerName: 'ID',
                hide: true
            }
        ];

        if (selectedView === SETTING_CHOTSO.month) {
            for (let month = 1; month <= 12; month++) {
                baseColumns.push({
                    field: `T${month}`,
                    headerName: `Tháng ${month}`,
                    editable: editMode,
                    cellRenderer: SwitchRenderer,
                    flex: 1,
                    cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
                });
            }
        } else {
            for (let month = 1; month <= 12; month++) {
                baseColumns.push(
                    {
                        field: `T${month}_K1`,
                        headerName: `T${month} - Kỳ 1`,
                        editable: editMode,
                        cellRenderer: SwitchRenderer,
                        width: 100,
                        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
                    },
                    {
                        field: `T${month}_K2`,
                        headerName: `T${month} - Kỳ 2`,
                        editable: editMode,
                        cellRenderer: SwitchRenderer,
                        width: 100,
                        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
                    }
                );
            }
        }

        return baseColumns;
    };

    const initializeDefaultData = (type) => {
        const data = { id: 1 };
        if (type == 'month') {
            for (let month = 1; month <= 12; month++) {
                data[`T${month}`] = false;
            }
        } else {
            for (let month = 1; month <= 12; month++) {
                data[`T${month}_K1`] = false;
                data[`T${month}_K2`] = false;
            }
        }
        return [data];
    };

    const loadSetting = async () => {
        const cauHinhData = await getAllCauHinh();
        setSelectedView(cauHinhData[0].value);
        setRowId(cauHinhData[0].id);
    }

    const fetchChotSo = async () => {
        try {
            let settingData = await getSettingByType(SETTING_TYPE.ChotSo);
            if (!settingData) {
                settingData = await createSetting({
                    type: SETTING_TYPE.ChotSo,
                    setting: {
                        month: initializeDefaultData('month'),
                        term: initializeDefaultData('term')
                    }
                });
            }
            setSettingId(settingData.id);
            setSettingData(settingData.setting);
            if (selectedView === SETTING_CHOTSO.month) {
                setRowData(settingData.setting.month || initializeDefaultData('month'));
            } else {
                setRowData(settingData.setting.term || initializeDefaultData('term'));
            }

            let obj = FIELD_VALUE_CAU_HINH.find(e => e.field === FIELD_VALUE_CAU_HINH[1].field);
            if (obj.values) {
                setTypeDropDown(obj.values);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    };

    useEffect(() => {
        loadSetting();
    }, [])

    useEffect(() => {
        fetchChotSo();
    }, [showCauHinhChotSo, selectedView]);

    useEffect(() => {
        const newColumns = generateColumns();
        setColDefs(newColumns);
    }, [selectedView, editMode]);

    const handleViewChange = (value) => {
        if (editMode) {
            setSelectedView(value);
        }
    };


    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            suppressMenu: true,
            cellStyle: { fontSize: '14.5px' },
        };
    }, []);

    const handleSaveSetting = async () => {
        try {
            const currentData = gridRef.current.api.getModel().rowsToDisplay[0].data;
            let newSettingData
            if (selectedView === SETTING_CHOTSO.month) {
                newSettingData = { ...settingData, month: [currentData] }
            } else {
                newSettingData = { ...settingData, term: [currentData] }
            }
            const updateData = {
                id: settingId,
                setting: newSettingData
            };
            await updateSetting(updateData);
            await updateCauHinh({
                id: rowId,
                value: selectedView
            });
            message.success('Cài đặt thành công');
            turnOffEditMode();
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu:', error);
            message.error('Lỗi khi lưu dữ liệu');
        }
    };

    const turnOnEditMode = () => {
        setEditMode(true);
    };

    const turnOffEditMode = () => {
        setEditMode(false);
        fetchChotSo();
    };

    return (
        <Modal
            title="Cấu hình chốt sổ"
            centered
            open={showCauHinhChotSo}
            onCancel={() => setShowCauHinhChotSo(false)}
            footer={
                !editMode ? (
                    <Button type="primary" onClick={turnOnEditMode}>Cập nhật</Button>
                ) : (
                    <>
                        <Button onClick={turnOffEditMode}>Hủy bỏ</Button>
                        <Button type="primary" onClick={handleSaveSetting}>Lưu lại</Button>
                    </>
                )
            }
            width='75%'
        >
            <div style={{ width: '100%', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Select
                    value={selectedView}
                    onChange={handleViewChange}
                    style={{ width: 300 }}
                    disabled={!editMode}
                    options={typeDropDown.map(type => ({ value: type, label: type }))}
                />
            </div>
            <div style={{ height: 150, width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    columnDefs={colDefs}
                    localeText={AG_GRID_LOCALE_VN}
                    className="ag-theme-quartz"
                />
            </div>
        </Modal>
    );
};

export default CauHinhChotSo;