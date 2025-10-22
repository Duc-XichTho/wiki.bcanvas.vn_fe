import { Col, Row, Switch, Typography, Modal, Input, Button, Space, message } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { AgGridReact } from 'ag-grid-react';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import css from './Action.module.css';
import {
    createNewPMVCategories,
    getAllPMVCategories,
    updatePMVCategories
} from "../../../../../apis/pmvCategoriesService.jsx";
import ActionCreate from "../../../../Home/AgridTable/actionButton/ActionCreate.jsx";
import { getCurrentDateTimeWithHours } from "../../../../KeToanQuanTri/functionKTQT/formatDate.js";
import { LIST_COLUMNS_NGANH, LIST_NHOM_NGANH } from "../../../../../Consts/LIST_NHOM_NGANH.js";
import PopupDeleteAgrid from "../../../../Home/popUpDelete/popUpDeleteAgrid.jsx";
import PopupDeleteRenderer from "../../../../KeToanQuanTri/popUp/popUpDelete.jsx";
import { getAllPMVSettingKHFull, createNewPMVSettingKH, updatePMVSettingKH } from "../../../../../apis/pmvSettingKHService.jsx";

export default function CreateCategories() {
    const [modalSetting, setModalSetting] = useState(false);
    const [modalToggleUse, setModalToggleUse] = useState(false);
    const [rowData, setRowData] = useState([]);
    const [rowDataSetting, setRowDataSetting] = useState([]);
    const [listPMVSettingKH, setListPMVSettingKH] = useState([]);
    const [categoryTypeSelected, setCategoryTypeSelected] = useState(null);
    const table = 'PMV_CATEGORY';

    const columnDefs = useMemo(() => {
        const generalProperties = {
            editable: true,
            flex: 1,
            sortable: true,
            filter: true
        }

        // Base columns
        let defaultColumns = [
            {
                field: 'action',
                headerName: '',
                pinned: 'left',
                width: 50,
                editable: false,
                cellRenderer: (params) => {
                    return (
                        <PopupDeleteRenderer {...params.data}
                            id={params.data.id}
                            table={table}
                            reloadData={onGridReady} />
                    );
                },
            },
            {
                field: 'name',
                headerName: categoryTypeSelected?.value === 'sanpham' ? 'Diễn giải' : 'Tên',
                ...generalProperties,
            },
            {
                field: 'group1',
                headerName: 'Group 1',
                ...generalProperties,
            },
            {
                field: 'group2',
                headerName: categoryTypeSelected?.value === 'sanpham' ? 'Brand' : 'Group 2',
                ...generalProperties,
            },
            {
                field: 'group3',
                headerName: 'Group 3',
                ...generalProperties,
            },
            {
                field: 'group4',
                headerName: 'Group 4',
                ...generalProperties,
            },
            {
                field: 'group5',
                headerName: categoryTypeSelected?.value === 'sanpham' ? 'SKU' : 'Group 5',
                ...generalProperties,
            },
        ];

        // For 'sanpham' reorder columns: SKU, Brand, Group1, Group3, Group4, Diễn giải (keep action pinned first)
        if (categoryTypeSelected?.value === 'sanpham') {
            const byField = Object.fromEntries(defaultColumns.map(c => [c.field, c]));
            defaultColumns = [
                byField['action'],
                byField['group5'], // SKU
                byField['group2'], // Brand
                byField['group1'],
                byField['group3'],
                byField['group4'],
                byField['name'],    // Diễn giải
            ].filter(Boolean);
        }

        // For 'user_class' category: only show name column (no groups, no isUse per column)
        if (categoryTypeSelected?.value === 'user_class') {
            return defaultColumns.filter(col => ['action', 'name'].includes(col.field));
        }

        if (categoryTypeSelected && categoryTypeSelected.name && listPMVSettingKH.length > 0) {
            const matchingSetting = listPMVSettingKH.find(setting => setting.name === categoryTypeSelected.name);

            // Only apply setting customizations when the setting is enabled (isUse = true) AND has data
            if (matchingSetting && matchingSetting.isUse && matchingSetting.data && matchingSetting.data.length > 0) {
                const result = defaultColumns.map(column => {
                    // Apply settings only to group columns (not name column)
                    if (column.field.startsWith('group')) {
                        const matchingField = matchingSetting.data.find(item => item.field === column.field);

                        if (matchingField) {
                            // Enforce rules for 'sanpham': group2 (Brand) and group5 (SKU) always enabled
                            const isSanPham = categoryTypeSelected?.value === 'sanpham';
                            const isLocked = isSanPham && (column.field === 'group2' || column.field === 'group5');
                            return {
                                ...column,
                                headerName: matchingField.headerName || column.headerName,
                                hide: isLocked ? false : matchingField.isUse === false,
                            };
                        }
                    }

                    // Ensure name header for sanpham remains 'Diễn giải'
                    if (categoryTypeSelected?.value === 'sanpham' && column.field === 'name') {
                        return { ...column, headerName: 'Diễn giải' };
                    }
                    return column;
                });
                return result;
            } else {
                return defaultColumns;
            }
        }

        return defaultColumns;
    }, [categoryTypeSelected, listPMVSettingKH]);

    useEffect(() => {
        // No settings for user_class
        if (categoryTypeSelected?.value === 'user_class') {
            setRowDataSetting([]);
            return;
        }

        if (categoryTypeSelected?.name && listPMVSettingKH.length > 0) {
            const matchingSetting = listPMVSettingKH.find(setting => setting.name === categoryTypeSelected.name);

            if (matchingSetting?.data && matchingSetting.data.length > 0) {
                // Use existing setting data, enforce product rules (group2/group5 always enabled, default names)
                const rowDataSettingPre = matchingSetting.data.map(item => {
                    let next = {
                        ...item,
                        old: item.headerName,
                        new: item.headerName, // default to current name
                        isUse: item.isUse
                    };
                    if (categoryTypeSelected?.value === 'sanpham') {
                        if (item.field === 'group2') {
                            next.isUse = true;
                            next.new = next.new || 'Brand';
                        }
                        if (item.field === 'group5') {
                            next.isUse = true;
                            next.new = next.new || 'SKU';
                        }
                    }
                    return next;
                });
                setRowDataSetting(rowDataSettingPre);
                return;
            }
        }

        // If no existing setting, get all columns for this category type
        const getDefaultSettings = () => {
            const categoryColumns = LIST_COLUMNS_NGANH.filter(item => {
                // Get only group columns (not name column)
                if (categoryTypeSelected?.value === 'sanpham') {
                    return item.field.startsWith('group');
                } else if (categoryTypeSelected?.value === 'vung') {
                    return item.field.startsWith('group');
                } else if (categoryTypeSelected?.value === 'kenh') {
                    return item.field.startsWith('group');
                } else if (categoryTypeSelected?.value === 'duan') {
                    return item.field.startsWith('group');
                }
                return false;
            });

            return categoryColumns.map(column => {
                let newName = column.headerName;
                if (categoryTypeSelected?.value === 'sanpham') {
                    if (column.field === 'group2') newName = 'Brand';
                    if (column.field === 'group5') newName = 'SKU';
                }
                return ({
                    ...column,
                    old: column.headerName,
                    new: newName,
                    isUse: true
                });
            });
        };

        const rowDataSettingPre = getDefaultSettings();
        setRowDataSetting(rowDataSettingPre);
    }, [categoryTypeSelected, listPMVSettingKH]);

    const [colDefsSetting, setColDefsSetting] = useState([
        {
            field: "old",
            headerName: 'Tên cột cũ',
            flex: 1,
        },
        {
            field: "new",
            headerName: 'Tên cột mới',
            editable: true,
            flex: 1,
        },
        {
            field: "isUse",
            headerName: 'Áp dụng',
            editable: true,
            width: 100,
            maxWidth: 100,
        },
    ]);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
    }), []);

    const onGridReady = useCallback((params) => {
        fetchData()
    }, [categoryTypeSelected]);

    const fetchData = async () => {
        let data = await getAllPMVCategories()
        if (categoryTypeSelected && categoryTypeSelected.value && data.length > 0) {
            data = data.filter((item) => item.category_type === categoryTypeSelected.value)
            setRowData(data)
        }
        try {
            const settingsData = await getAllPMVSettingKHFull()
            setListPMVSettingKH(settingsData)
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchData()
    }, [categoryTypeSelected])

    const handleCellValueChanged = useCallback(async (params) => {
        const { data, colDef, newValue, oldValue } = params;
        if (newValue === oldValue) return;

        // Update your backend here
        await updatePMVCategories(data);
    }, []);

    const handleCellValueChangedSetting = useCallback(async (params) => {
        const { data, colDef, newValue, oldValue } = params;
        if (newValue === oldValue) return;

        const updatedRowData = rowDataSetting.map(row => {
            if (row.field === data.field) {
                let next = {
                    ...row,
                    [colDef.field]: newValue,
                    headerName: colDef.field === 'new' && newValue ? newValue : row.headerName
                };
                // Enforce sanpham rules: group2/group5 cannot be turned off and default names
                if (categoryTypeSelected?.value === 'sanpham') {
                    if (row.field === 'group2') {
                        next.isUse = true;
                        if (colDef.field === 'new' && !newValue) next.new = 'Brand';
                    }
                    if (row.field === 'group5') {
                        next.isUse = true;
                        if (colDef.field === 'new' && !newValue) next.new = 'SKU';
                    }
                }
                return next;
            }
            return row;
        });

        setRowDataSetting(updatedRowData);
    }, [rowDataSetting, categoryTypeSelected]);

    const handleAddRow = async () => {
        if (categoryTypeSelected.value) {
            await createNewPMVCategories({
                category_type: categoryTypeSelected.value,
                createAt: getCurrentDateTimeWithHours(),
                show: true,
            })
            await fetchData()
        }
    }

    const gridSettingRef = useRef(null);

    const handleCreateNewPMVSettingKH = async () => {
        try {
            // Ensure latest in-cell edits are committed before reading state
            if (gridSettingRef.current && gridSettingRef.current.api) {
                gridSettingRef.current.api.stopEditing();
            }

            // Check if setting already exists
            const existingSetting = listPMVSettingKH.find(setting => setting.name === categoryTypeSelected.name);
            
            // Enforce product rules: group2 (Brand) and group5 (SKU) always enabled with default names
            const enforcedRowData = rowDataSetting.map(item => {
                if (categoryTypeSelected?.value === 'sanpham') {
                    if (item.field === 'group2') {
                        return { ...item, isUse: true, new: item.new || 'Brand' };
                    }
                    if (item.field === 'group5') {
                        return { ...item, isUse: true, new: item.new || 'SKU' };
                    }
                }
                return item;
            });

            const data = {
                name: categoryTypeSelected.name,
                data: enforcedRowData.map(item => ({
                    field: item.field,
                    headerName: item.new || item.old,
                    isUse: item.isUse
                })),
                isUse: existingSetting?.isUse ?? true
            }

            if (existingSetting) {
                // Update existing setting
                await updatePMVSettingKH({
                    ...existingSetting,
                    data: data.data
                });
            } else {
                // Create new setting
                await createNewPMVSettingKH(data);
            }
            
            await fetchData();
            setModalSetting(false);
            message.success('Cập nhật cài đặt cột thành công!');
        } catch (error) {
            console.log(error);
            message.error('Có lỗi xảy ra khi lưu cài đặt!');
        }
    }

    // Toggle category-level isUse from the modal
    const handleToggleCategoryUse = async (categoryName, nextState) => {
        try {
            if (!categoryName) return;
            const itemSetting = listPMVSettingKH.find(item => item.name === categoryName);

            if (!itemSetting) {
                const data = {
                    name: categoryName,
                    data: [],
                    isUse: !!nextState,
                };
                await createNewPMVSettingKH(data);
                await fetchData();
                return;
            }

            const dataUpdate = {
                ...itemSetting,
                isUse: typeof nextState === 'boolean' ? nextState : !itemSetting.isUse,
            };
            await updatePMVSettingKH(dataUpdate);
            await fetchData();
        } catch (error) {
            console.log(error);
        }
    };

    const renderContentSetting = () => (
        <div className={css.setting}>
            <div className={css.body}>
                <div className="ag-theme-quartz" style={{ width: "100%", height: "95%" }}>
                    <AgGridReact
                        ref={gridSettingRef}
                        rowData={rowDataSetting}
                        columnDefs={colDefsSetting}
                        enableRangeSelection
                        onCellValueChanged={handleCellValueChangedSetting}
                    />
                </div>
            </div>
            <div className={css.footer}>
                <Button onClick={() => handleCreateNewPMVSettingKH()}>Lưu</Button>
            </div>
        </div>
    )

    const handleChangeIsUseSetting = async () => {
        try {
            if (!categoryTypeSelected || !categoryTypeSelected.name) return;

            const itemSetting = listPMVSettingKH.find(item => item.name === categoryTypeSelected.name)

            // If no setting exists yet for this category, create one from current rowDataSetting
            if (!itemSetting) {
                const data = {
                    name: categoryTypeSelected.name,
                    data: rowDataSetting.map(item => ({
                        field: item.field,
                        headerName: (item.new || item.old),
                        isUse: item.isUse
                    })),
                    isUse: true,
                }
                await createNewPMVSettingKH(data)
                await fetchData()
                message.success('Đã tạo cấu hình và bật sử dụng')
                return;
            }

            const dataUpdate = {
                ...itemSetting,
                isUse: !itemSetting.isUse
            }
            await updatePMVSettingKH(dataUpdate)
            await fetchData()
            message.success('Cập nhật thành công')
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
            <Row className={css.categories_container}>
                <Col span={4} className={css.left_section}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography.Title level={4} style={{ marginBottom: 0 }}>Thiết lập danh mục</Typography.Title>
                        <Button type="text" icon={<SettingOutlined />} onClick={() => setModalToggleUse(true)} />
                    </div>
                    <div className={css.categories_list}>
                        {LIST_NHOM_NGANH
                            .filter(item => {
                                if (item.value === 'user_class') return true;
                                const st = listPMVSettingKH.find(s => s.name === item.name);
                                return !!(st && st.isUse);
                            })
                            .map((item) => (
                                <div key={item.value} onClick={() => setCategoryTypeSelected(item)}
                                    className={`${categoryTypeSelected?.value === item.value ? css.selected : css.option_item}`}>
                                    <span>{item.name}</span>
                                </div>
                            ))}
                    </div>


                </Col>
                <Col span={20} className={css.right_section}>
                    {categoryTypeSelected && categoryTypeSelected.value && (<>
                        <div>
                            <Typography.Title level={4}>{categoryTypeSelected.name}</Typography.Title>
                        </div>
                        {categoryTypeSelected.value !== 'user_class' && (
                            <div className={css.categories_list3}>
                                <div>
                                    <Switch
                                        checked={listPMVSettingKH.some(item => item.name === categoryTypeSelected.name && item.isUse)}
                                        checkedChildren="Có"
                                        unCheckedChildren="Không"
                                        onChange={() => handleChangeIsUseSetting()}
                                    /> <span>sử dụng</span>
                                </div>
                                <div className={css.button}>
                                    <div className={css.headerActionButton} onClick={() => setModalSetting(true)}>
                                        <span>Cài đặt</span>
                                    </div>
                                    <ActionCreate handleAddRow={handleAddRow} />
                                </div>
                            </div>
                        )}
                        {categoryTypeSelected.value === 'user_class' && (
                            <div className={css.categories_list3}>
                                <div className={css.button}>
                                    <ActionCreate handleAddRow={handleAddRow} />
                                </div>
                            </div>
                        )}
                        <div className="ag-theme-quartz"
                            style={{ height: 'calc(100% - 100px)', width: '100%', marginTop: '20px' }}>
                            <AgGridReact
                                key={categoryTypeSelected?.value || 'default'}
                                enableRangeSelection={true}
                                columnDefs={columnDefs}
                                rowData={rowData}
                                defaultColDef={defaultColDef}
                                onGridReady={onGridReady}
                                onCellValueChanged={handleCellValueChanged}
                                animateRows={true}
                                rowSelection="multiple"
                            />
                        </div>
                    </>
                    )}

                </Col>
            </Row>
            <Modal
                title="Cài đặt tên cột"
                centered
                open={modalSetting}
                onOk={() => setModalSetting(false)}
                onCancel={() => setModalSetting(false)}
                footer={null}
                maskClosable={false}
                width={600}
                styles={{ body: { height: '250px' } }}
            >
                {categoryTypeSelected?.value !== 'user_class' && renderContentSetting()}
            </Modal>
            <Modal
                title="Bật/tắt danh mục sử dụng"
                centered
                open={modalToggleUse}
                onOk={() => setModalToggleUse(false)}
                onCancel={() => setModalToggleUse(false)}
                okText="Đóng"
                cancelButtonProps={{ style: { display: 'none' } }}
                width={520}
            >
                <div className={css.categories_list}>
                    {LIST_NHOM_NGANH.map((item) => {
                        const st = listPMVSettingKH.find(s => s.name === item.name);
                        const isUserClass = item.value === 'user_class';
                        return (
                            <div key={item.value}
                                 className={css.option_item}
                                 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>{item.name}</span>
                                {!isUserClass && (
                                    <Switch
                                        checked={!!(st && st.isUse)}
                                        onChange={(checked) => handleToggleCategoryUse(item.name, checked)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </>
    );
}