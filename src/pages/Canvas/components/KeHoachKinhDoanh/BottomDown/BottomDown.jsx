import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button, Card, Input, InputNumber, message, Popconfirm, Row, Select, Space, Modal } from "antd";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import styles from "./BottomDown.module.css";
import { getAllPMVCategories } from "../../../../../apis/pmvCategoriesService.jsx";
import {
    createNewPMVDeployment, generateDatesByPeriod,
    getAllPMVDeployment,
    updatePMVDeployment
} from "../../../../../apis/pmvDeploymentService.jsx";
import {
    createNewPMVDeploymentDetail,
    deletePMVDeploymentDetail,
    getAllPMVDeploymentDetail,
    updatePMVDeploymentDetail
} from "../../../../../apis/pmvDeploymentDetailService.jsx";
import css from "../Plan/PlanningModal.module.css";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import BangPhanBo from '../../BangPhanBo/BangPhanBo.jsx'
import { LIST_NHOM_NGANH } from "../../../../../Consts/LIST_NHOM_NGANH.js";
import { getAllPMVSettingKH } from "../../../../../apis/pmvSettingKHService.jsx";
import { getAllDetailIDService } from "../../../../../apis/pmvSkuAllocationService.jsx";
import { PencilLine } from "lucide-react";
import {
    createTemplateColumn,
    createTemplateTable,
    getAllTablesPlan
} from "../../../../../apis/templateSettingService.jsx";
import { LIST_OBLIGATORY_COLUMN_TEMP_PLAN } from "../../../../../Consts/LIST_OBLIGATORY_COLUMN_TEMP_PLAN.js";
import * as item from "date-fns/locale";

const { Option } = Select;

export default function BottomDown({ selectedCard, listPMVDeployment, deployment, plan, show, activeStep, onMetricsChange }) {
    const [levels, setLevels] = useState([]);
    const [planData, setPlanData] = useState([]);
    const [step, setStep] = useState(show ? 2 : 1);

    const [pmvCategories, setPmvCategories] = useState([]);
    const [tablePlan, setTablePlan] = useState([]);
    const [pmvDeployment, setPmvDeployment] = useState([]);
    const [pmvSettingKH, setPmvSettingKH] = useState([]);
    const [pmvDeploymentDetail, setPmvDeploymentDetail] = useState([]);
    const [isModalBangPhanBo, setIsModalBangPhanBo] = useState(false);
    const [deploymentDetail, setDeploymentDetail] = useState({});
    const [listDetailId, setListDetailId] = useState([]);
    const [viewMode, setViewMode] = useState('aggrid'); // State để quản lý view mode
    const gridRef = useRef(null);



    async function tinh() {
        if (deployment.config_period && plan.date_from && plan.date_to) {
            let rs = await generateDatesByPeriod({
                date_from: plan.date_from,
                date_to: plan.date_to,
                ...deployment.config_period
            });
        }
    }

    useEffect(() => {
        tinh().then()
    }, [deployment, plan])
    const showModalBangPhanBo = (item) => {
        setDeploymentDetail(item);
        setIsModalBangPhanBo(true);
    }

    const handleCancelBangPhanBo = () => {
        setIsModalBangPhanBo(false);
    }

    async function fetchData() {
        let categories = await getAllPMVCategories();
        let deps = await getAllPMVDeployment();
        let depsDetail = await getAllPMVDeploymentDetail();
        let listSettingKH = await getAllPMVSettingKH();
        let tables = await getAllTablesPlan()
        setTablePlan(tables)
        setPmvCategories(categories);
        setPmvDeployment(deps);
        setPmvDeploymentDetail(depsDetail);
        setPmvSettingKH(listSettingKH);

        const detailIds = await getAllDetailIDService();
        setListDetailId(detailIds)

        if (deployment?.id) {
            const relatedDetails = depsDetail
                .filter(detail => detail.deployment_id === deployment.id)
                .map(item => item.data);

            // Cập nhật lại giá trị của cha dựa trên con
            const updatedPlanData = updateParentValues(relatedDetails);
            setPlanData(updatedPlanData);
        }
    }


    useEffect(() => {
        fetchData()
    }, [deployment?.id, selectedCard])

    // Sync internal step with external controller from PlanningModal
    useEffect(() => {
        if (activeStep === 0) setStep(1);
        if (activeStep === 1) setStep(2);
    }, [activeStep]);

    useEffect(() => {
        if (deployment?.setup_config) {
            setLevels(deployment.setup_config);
        }
    }, [deployment.setup_config]);

    // Persist Step 1 (Configure Levels) automatically whenever levels change
    useEffect(() => {
        async function persistSetup() {
            try {
                if (deployment?.id && Array.isArray(levels)) {
                    const payload = { id: deployment.id, setup_config: levels };
                    await updatePMVDeployment(payload);
                }
            } catch (e) {
                console.error('Failed to save setup_config', e);
            }
        }
        persistSetup();
    }, [levels, deployment?.id]);

    // Ensure selected category and group remain valid when settings change (hide disabled ones)
    useEffect(() => {
        if (!levels || levels.length === 0) return;

        setLevels(prev => prev.map(level => {
            const categoryName = LIST_NHOM_NGANH.find(nn => nn.value === level.category_type)?.name;
            const setting = categoryName ? pmvSettingKH.find(s => s.name === categoryName) : null;

            // If the category itself is disabled, clear both type and group
            if (setting && setting.isUse === false) {
                return { ...level, category_type: "", selected_group: "" };
            }

            // If category is enabled but the selected group is disabled, clear group only
            if (setting && Array.isArray(setting.data) && level?.selected_group) {
                const enabledFields = setting.data.filter(d => d.isUse).map(d => d.field);
                if (!enabledFields.includes(level.selected_group)) {
                    return { ...level, selected_group: "" };
                }
            }
            return level;
        }));
    }, [pmvSettingKH]);


    const handleAddLevel = () => {
        setLevels([...levels, { id: Date.now(), category_type: "", selected_group: "", level: levels.length + 1 }]);
    };

    const updateLevelConfig = (id, field, value) => {
        setLevels(prevLevels => prevLevels.map(level => level.id === id ? { ...level, [field]: value } : level));
    };

    const getGroupValues = (categoryType, group) => {
        return [...new Set(
            pmvCategories
                .filter(cat => cat.category_type === categoryType)
                .map(cat => cat[group])
        )].filter(Boolean);
    };

    const handleInitializePlan = async () => {
        if (deployment?.id) {
            const updatedDeployment = { ...deployment, setup_config: levels };
            await updatePMVDeployment(updatedDeployment);
            setPmvDeployment(prev => prev.map(dep => dep.id === deployment.id ? updatedDeployment : dep));
        } else {
            const newDeployment = await createNewPMVDeployment({ setup_config: levels });
            if (newDeployment) {
                setPmvDeployment([...pmvDeployment, newDeployment]);
            }
        }

        setStep(2);
    };


    const handleAddPlanItem = async (parentId, level, deployment_id) => {
        // Sử dụng deployment_id được truyền vào, nếu không có thì dùng deployment?.id
        const currentDeploymentId = deployment_id || deployment?.id;

        if (!currentDeploymentId) {
            message.error('Không tìm thấy deployment ID');
            return;
        }

        const newItem = {
            parentId,
            level,
            group_value: "",
            benchmark: 0,
            target: 0,
            deployment_id: currentDeploymentId
        };

        console.log('Creating item with deployment_id:', currentDeploymentId, newItem);

        try {
            // Lưu vào DB
            const savedItem = await createNewPMVDeploymentDetail({
                ...newItem,
                data: newItem
            });

            await updatePMVDeploymentDetail({
                id: savedItem.id,
                data: {
                    id: savedItem.id,
                    ...savedItem.data,
                    deployment_id: currentDeploymentId
                }
            });

            if (savedItem) {
                const itemWithCorrectDeploymentId = {
                    ...savedItem.data,
                    id: savedItem.id,
                    deployment_id: currentDeploymentId
                };
                setPlanData(prev => [...prev, itemWithCorrectDeploymentId]);
                message.success('Thêm item thành công');
            }
        } catch (error) {
            console.error('Error creating item:', error);
            message.error('Lỗi khi tạo item mới');
        }
    };

    const handleRemovePlanItem = async (id) => {
        const item = planData.find(i => i.id === id);


        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa item "${item?.group_value || 'N/A'}"?`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okType: 'danger',
            onOk: async () => {
                try {
                    await deletePMVDeploymentDetail(id);
                    setPlanData(prev => prev.filter(item => item.id !== id && item.parentId !== id));
                    message.success('Xóa thành công');
                } catch (error) {
                    message.error('Lỗi khi xóa item');
                }
            }
        });
    };

    const handleRemoveLevel = async (id) => {
        setLevels(prev => prev.filter(level => level.id !== id));
    };

    const updateValues = async (id, field, value) => {
        setPlanData(prevData => {
            const updatedData = prevData.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            );

            const updatedItem = updatedData.find(item => item.id === id);
            if (updatedItem) {
                updatePMVDeploymentDetail({ id, data: updatedItem });
            }

            return updateParentValues(updatedData);
        });
    };

    const updateParentValues = (planData) => {
        const updatedData = [...planData];

        const calculateTotals = (parentId) => {
            const children = updatedData.filter(item => item?.parentId === parentId);
            if (children.length > 0) {
                const totalBenchmark = children.reduce((sum, child) => sum + child?.benchmark, 0);
                const totalTarget = children.reduce((sum, child) => sum + child?.target, 0);

                updatedData.forEach(item => {
                    if (item && item?.id === parentId) {
                        item.benchmark = totalBenchmark;
                        item.target = totalTarget;
                    }
                });

                const parent = updatedData.find(item => item?.id === parentId);
                if (parent && parent?.parentId !== null) {
                    calculateTotals(parent.parentId);
                }
            }
        };

        updatedData.forEach(item => {
            if (item?.parentId !== null) calculateTotals(item?.parentId);
        });

        return updatedData;
    };

    const calculateTotalValues = () => {
        return planData
            .filter(item => item?.level === 1) // Chỉ lấy level 1
            .reduce(
                (totals, item) => {
                    totals.benchmark += item.benchmark || 0;
                    totals.target += item.target || 0;
                    return totals;
                },
                { benchmark: 0, target: 0 }
            );
    };

    const calculateGrowth = (benchmark, target) => {
        if (!benchmark || !target || benchmark === 0) return '';
        return ((target - benchmark) / benchmark * 100).toFixed(2);
    };

    // React components for AG Grid cell renderers


    const statusBar = useMemo(() => ({
        statusPanels: [{ statusPanel: 'agAggregationComponent' }]
    }), []);



    // AG Grid Tree Data Component - Simple and Clean
    const renderAGGridTree = () => {
        // Flatten data for AG Grid with proper hierarchy and groupPath for treeData
        const flattenDataForAGGrid = (items) => {
            const result = [];

            // Tạo map để dễ tìm parent-child relationships
            const itemMap = new Map();
            items.forEach(item => {
                itemMap.set(item.id, item);
            });

            // Tìm root items (level 1, parentId = null)
            const rootItems = items.filter(item => item.level === 1 && item.parentId === null);

            const processItem = (item, path = []) => {
                const currentPath = [...path, item.id];
                const hasChildren = items.some(child => child.parentId === item.id);

                result.push({
                    id: item.id,
                    level: item.level,
                    group_value: item.group_value || '',
                    benchmark: item.benchmark || 0,
                    target: item.target || 0,
                    growth: calculateGrowth(item.benchmark, item.target),
                    distribution: listDetailId?.some(i => i.deploy_detail_id == item.id) ? 'Đã bổ' : 'Chưa bổ',
                    parentId: item.parentId,
                    hasChildren: hasChildren,
                    groupPath: currentPath
                });

                // Process children recursively
                if (hasChildren) {
                    const children = items.filter(child => child.parentId === item.id);
                    children.forEach(child => {
                        processItem(child, currentPath);
                    });
                }
            };

            // Process all root items
            rootItems.forEach(rootItem => {
                processItem(rootItem);
            });

            return result;
        };

        const flatData = flattenDataForAGGrid(planData);

        const columnDefs = [
            {
                headerName: 'Thao tác',
                pinned: 'left',
                width: 90,
                editable: false, // Không edit vì là button actions
                cellRenderer: (params) => (
                    <div className={styles.actionButtons}>
                        <button
                            className={styles.addChildBtn}
                            onClick={() => params.context.addChildItem(params.data.id, params.data.level + 1)}
                            title="Thêm cấp con"
                        >
                            +
                        </button>
                        <button
                            className={styles.deleteBtn}
                            onClick={() => params.context.deleteItem(params.data.id)}
                            title="Xóa"
                        >
                            ×
                        </button>
                    </div>
                )
            },
            {
                field: 'group_value',
                headerName: 'Giá trị',
                width: 250,
                editable: true,
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                    values: getGroupValues(levels[0]?.category_type, levels[0]?.selected_group)
                },
                onCellValueChanged: (params) => {
                    updateValues(params.data.id, 'group_value', params.newValue);
                },
                cellStyle: {
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    padding: '8px 12px'
                },
                cellRenderer: (params) => {
                    const level = params.data.level;
                    const isParent = params.data.hasChildren;
                    const indent = (level - 1) * 20; // Indent đơn giản

                    return (
                        <div style={{
                            paddingLeft: `${indent}px`,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {/* Chỉ hiển thị text với indent */}
                            <span style={{
                                fontWeight: isParent ? 'bold' : 'normal',
                                color: isParent ? '#1890ff' : '#333',
                                fontSize: '14px'
                            }}>
                                {params.value || 'Chưa chọn'}
                            </span>
                        </div>
                    );
                }
            },
            // {
            //     field: 'benchmark',
            //     headerName: 'Benchmark',
            //     width: 150,
            //     editable: (params) => !params.data.hasChildren, // Không edit cho group rows
            //     cellEditor: 'agNumberCellEditor',
            //     cellEditorParams: {
            //         precision: 2,
            //         step: 0.01
            //     },
            //     onCellValueChanged: (params) => {
            //         if (!params.data.hasChildren) {
            //             updateValues(params.data.id, 'benchmark', params.newValue);
            //         }
            //     },
            //     cellStyle: {
            //         fontSize: '14px',
            //         fontWeight: '500',
            //         color: '#333',
            //         textAlign: 'right',
            //         padding: '8px 12px'
            //     },
            //     valueFormatter: (params) => {
            //         return params.value ? Number(params.value).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
            //     }
            // },
            {
                field: 'target',
                headerName: 'Target',
                width: 150,
                editable: (params) => !params.data.hasChildren, // Không edit cho group rows
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                    precision: 2,
                    step: 0.01
                },
                onCellValueChanged: (params) => {
                    if (!params.data.hasChildren) {
                        updateValues(params.data.id, 'target', params.newValue);
                    }
                },
                cellStyle: {
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    textAlign: 'right',
                    padding: '8px 12px'
                },
                valueFormatter: (params) => {
                    return params.value ? Number(params.value).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
                }
            },
            // {
            //     field: 'growth',
            //     headerName: 'Tăng giảm (%)',
            //     width: 120,
            //     editable: false, // Không edit vì là cột tính toán
            //     valueFormatter: (params) => params.value ? `${params.value}%` : '',
            //     cellStyle: (params) => ({
            //         fontSize: '14px',
            //         fontWeight: '500',
            //         textAlign: 'right',
            //         padding: '8px 12px',
            //         color: params.value && parseFloat(params.value) > 0 ? '#52c41a' : '#ff4d4f'
            //     })
            // },
            {
                field: 'distribution',
                headerName: 'Phân bổ',
                width: 120,
                editable: false, // Không edit vì là button action
                cellStyle: {
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    padding: '8px 12px'
                },
                cellRenderer: (params) => {
                    const isDistributed = params.value === 'Đã bổ';
                    return (
                        <button
                            className={`${styles.distributionBtn} ${isDistributed ? styles.distributed : styles.notDistributed}`}
                            onClick={() => params.context.showDistributionModal(params.data.id)}
                            style={{
                                fontSize: '12px',
                                fontWeight: '500',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {params.value}
                        </button>
                    );
                }
            },

        ];

        const defaultColDef = {
            resizable: true,
            sortable: true,
            filter: true,
            flex: 1,
            cellStyle: {
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                padding: '8px 12px'
            }
        };

        return (
            <div style={{ width: '100%' }}>
                <div
                    className="ag-theme-quartz"
                    style={{
                        height: '100%',
                        width: '100%',

                    }}
                >
                    <AgGridReact
                        domLayout='autoHeight'
                        rowData={flatData}
                        columnDefs={columnDefs}
                        statusBar={statusBar}
                        ref={gridRef}
                        defaultColDef={defaultColDef}
                        treeData={false}
                        getDataPath={(data) => data.groupPath}
                        getRowId={(params) => String(params.data.id)}
                        groupDefaultExpanded={-1}
                        animateRows={true}
                        enableRangeSelection={true}
                        suppressRowClickSelection={true}
                        context={gridContext}
                        onGridReady={(params) => {
                            params.api.sizeColumnsToFit();
                        }}
                        autoGroupColumnDef={{
                            headerName: '',
                            width: 0,
                            hide: true,
                            cellRenderer: () => null, // Ẩn hoàn toàn nội dung
                            cellRendererParams: {
                                suppressCount: true,
                                innerRenderer: () => null
                            }
                        }}
                        rowClassRules={{
                            'row-group': (params) => {
                                return params.data.hasChildren;
                            },
                        }}
                        getRowStyle={(params) => {
                            const isParent = params.data.hasChildren;

                            // Chỉ phân biệt parent và child đơn giản
                            if (isParent) {
                                return {
                                    backgroundColor: '#f8f9fa',
                                    borderLeft: '2px solid #1890ff'
                                };
                            } else {
                                return {
                                    backgroundColor: '#ffffff'
                                };
                            }
                        }}
                    />
                </div>
            </div>
        );
    };

    // Notify parent (PlanningModal) about totals for header metrics
    useEffect(() => {
        if (typeof onMetricsChange === 'function' && deployment?.id) {
            const totals = calculateTotalValues();
            onMetricsChange(deployment.id, totals);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planData, deployment?.id]);

    // Context cho AG Grid
    const gridContext = useMemo(() => ({
        addChildItem: (parentId, level) => {
            console.log('Adding child item via context:', { parentId, level, currentDeployment: deployment?.id });
            handleAddPlanItem(parentId, level, deployment?.id);
        },
        deleteItem: (itemId) => {
            handleRemovePlanItem(itemId);
        },
        showDistributionModal: (itemId) => {
            const item = planData.find(i => i.id === itemId);
            if (item) showModalBangPhanBo(item);
        }
    }), [deployment?.id, planData]);

    const handleCreateTemplateTable = async () => {
        if (plan?.id && deployment?.id) {
            const columns = levels.map(level => {
                const categoryType = level.category_type;
                const selectedGroup = level.selected_group;
                const categoryName = LIST_NHOM_NGANH.find(nn => nn.value === categoryType)?.name;

                const settingCategory = pmvSettingKH.find(setting => setting.name === categoryName);
                if (settingCategory) {
                    const selectedField = settingCategory.data.find(item => item.field === selectedGroup);
                    if (selectedField?.headerName) {
                        return {
                            columnName: selectedField.headerName,
                            columnType: 'text'
                        };
                    }
                }
                return null;
            }).filter(Boolean);
            const fullColumn = [...columns, ...LIST_OBLIGATORY_COLUMN_TEMP_PLAN]
            await createTemplateTable({ plan_id: plan.id, deployment_id: deployment.id }).then(table => {

                fullColumn.forEach(column => {
                    createTemplateColumn({
                        ...column,
                        tableId: table.id,
                    })
                })


            })
        }
    };


    const renderPlanItems = (parentId, level) => {
        return planData
            .filter(item => item?.parentId === parentId && item?.level === level)
            .map(item => (
                <div key={item.id} className={`${styles.levelContainer} ${styles.childLevel}`}>
                    <Card size="small">
                        <Row className={styles.flexRowOut}>
                            <Row className={styles.flexRow}>
                                <Select
                                    className={styles.selectBox}
                                    placeholder="Select Value"
                                    value={item.group_value}
                                    onChange={(value) => updateValues(item.id, "group_value", value)}
                                >
                                    {getGroupValues(levels[level - 1]?.category_type, levels[level - 1]?.selected_group).map(value => (
                                        <Option key={value} value={value}>{value}</Option>
                                    ))}
                                </Select>
                                <InputNumber
                                    className={styles.selectBox}
                                    placeholder="Benchmark"
                                    value={item.benchmark}
                                    onChange={(value) => updateValues(item.id, "benchmark", value)}
                                />
                                <InputNumber
                                    className={styles.selectBox}
                                    placeholder="Target"
                                    value={item.target}
                                    onChange={(value) => updateValues(item.id, "target", value)}
                                />
                            </Row>
                            <Row>
                                <Button onClick={() => showModalBangPhanBo(item)}>
                                    {listDetailId?.some(i => i.deploy_detail_id == item.id) ? 'Đã bổ' : 'Chưa bổ'}
                                </Button>
                                <Button icon={<PlusOutlined />} type="dashed" className={css.addButton}
                                    onClick={() => handleAddPlanItem(item.id, level + 1)}></Button>
                                <Popconfirm
                                    title="Xác nhận xóa"
                                    description="Bạn có chắc chắn muốn xóa item này?"
                                    onConfirm={() => handleRemovePlanItem(item.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okType="danger"
                                >
                                    <Button icon={<DeleteOutlined />} type="danger">
                                    </Button>
                                </Popconfirm>
                            </Row>
                        </Row>
                    </Card>
                    {renderPlanItems(item.id, level + 1)}
                </div>
            ));
    };

    return (
        <>
            <div className={styles.container}>
                {step === 1 && (
                    <div>
                        <div className={styles.levels}>
                            {levels.map((level, index) => (
                                <Card key={level.id} size="small" className={styles.levelContainer}>
                                    <Space direction="horizontal" className={styles.flexRow}>
                                        <strong>Level {index + 1}</strong>
                                        <Select
                                            allowClear
                                            className={styles.selectBox}
                                            placeholder="Select Type"
                                            value={level.category_type}
                                            onChange={(value) => updateLevelConfig(level.id, "category_type", value)}
                                            style={{ width: '250px' }}
                                        >
                                            {LIST_NHOM_NGANH.filter(e => {
                                                const st = pmvSettingKH?.find(s => s.name === e.name);
                                                if (e.value === 'user_class') return false; // never selectable in levels
                                                return (st && st.isUse === true);
                                            }).map(e => (
                                                <Option value={e.value}>{e.name}</Option>
                                            ))}
                                        </Select>
                                        <Select
                                            allowClear
                                            className={styles.selectBox}
                                            placeholder="Select Group"
                                            value={level.category_type ? level.selected_group : null}
                                            onChange={(value) => updateLevelConfig(level.id, "selected_group", value)}
                                            disabled={!level.category_type}
                                        >
                                            {pmvSettingKH && pmvSettingKH.length > 0 && pmvSettingKH.map(s => {
                                                let options = []
                                                let name = LIST_NHOM_NGANH.find(nn => nn.value == level?.category_type)?.name
                                                if (s.name == name) {
                                                    options = Array.isArray(s.data) ? s.data.filter(x => x.isUse) : []
                                                    // Fallback for products: show all groups with defaults when no saved settings
                                                    if ((options.length === 0 || !Array.isArray(s.data)) && level?.category_type === 'sanpham') {
                                                        options = [
                                                            { field: 'group2', headerName: 'Brand', isUse: true },
                                                            { field: 'group5', headerName: 'SKU', isUse: true },
                                                            { field: 'group1', headerName: 'Group 1', isUse: true },
                                                            { field: 'group3', headerName: 'Group 3', isUse: true },
                                                            { field: 'group4', headerName: 'Group 4', isUse: true },
                                                        ]
                                                    }
                                                }
                                                if (options.length > 0) {
                                                    return options.map(opt => (
                                                        <>
                                                            <Option value={opt?.field}>{opt?.headerName}</Option>
                                                        </>
                                                    ))
                                                }
                                                return null
                                            })}

                                        </Select>
                                        <Button type="danger" icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveLevel(level.id)}></Button>
                                    </Space>
                                </Card>
                            ))}
                        </div>

                        <div style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'start',
                            gap: '10px'
                        }}>
                            <Button type="primary" onClick={handleAddLevel}>Add Level</Button>

                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div>
                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Button type="primary" onClick={() => handleAddPlanItem(null, 1)}>Thêm Level 1</Button>

                                <span style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    padding: '4px 8px',
                                    background: '#f5f5f5',
                                    borderRadius: '4px'
                                }}>
                                    View: {viewMode === 'aggrid' ? 'AG Grid Tree' : 'Card View'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button
                                    type={viewMode === 'aggrid' ? 'primary' : 'default'}
                                    onClick={() => setViewMode('aggrid')}
                                    size="small"
                                >
                                    📊 AG Grid
                                </Button>
                                <Button
                                    type={viewMode === 'card' ? 'primary' : 'default'}
                                    onClick={() => setViewMode('card')}
                                    size="small"
                                >
                                    🗂️ Card View
                                </Button>
                            </div>
                        </div>
                        <div style={{
                            transition: 'all 0.3s ease-in-out',
                            opacity: 1
                        }}>
                            {viewMode === 'card' ? renderPlanItems(null, 1) : renderAGGridTree()}
                        </div>
                    </div>
                )}
            </div>

            <BangPhanBo
                planData={planData}
                listPMVDeployment={listPMVDeployment}
                deploymentDetail={deploymentDetail}
                isModalBangPhanBo={isModalBangPhanBo}
                handleCancelBangPhanBo={handleCancelBangPhanBo}
                fetchData={fetchData}
            />
        </>
    );
}
