import '../../../../index.css';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';

import {MyContext} from "../../../../MyContext.jsx";
import {getAllUnits} from "../../../../apisKTQT/unitService.jsx";
import {getAllKmf} from "../../../../apisKTQT/kmfService.jsx";
import {getAllPlan, updatePlan} from "../../../../apisKTQT/planService.jsx";
import PopupCellActionPlan from "../../popUp/cellAction/PopUpCellActionPlan.jsx";
import css from "../../BaoCao/BaoCao.module.css";
import {Popconfirm , Button} from "antd";
import loadDataPlan from "../Plan2/logicPlan2.js";
import {calSupAndT0} from "../Plan/logicPlan.js";
import {toast} from "react-toastify";
import AG_GRID_LOCALE_VN from "../../../Home/AgridTable/locale.jsx";
import {formatCurrency} from "../../functionKTQT/formatMoney.js";
import ActionViewSetting from "../../ActionButton/ActionViewSetting.jsx";
import ActionSelectDanhMucPlan from "../../ActionButton/ActionSelectDanhMucPlan.jsx";
import {cutStringGroup} from "../../../../generalFunction/catChuoi/cutGroupCategory.js";
import Loading from '../../../Loading/Loading.jsx';
import ActionMenuDropdown from '../../ActionButton/ActionMenuDropdown.jsx';
import DanhMucPopUpDiaglog from '../../detail/DanhMucPopupDialog.jsx';

export default function Plan2({company}) {
    const {currentMonthKTQT, currentYearKTQT, currentUser} = useContext(MyContext)

    const table = 'Plan';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const [listUnits, setListUnits] = useState([]);
    const [listGroupKH, setGroupKH] = useState([]);
    const defaultColDef = useMemo(() => ({
        filter: true,
        cellStyle: {
            fontSize: '14.5px',
            color: 'var(--text-color)',
            fontFamily: 'var(--font-family)',
        },
        resizeable: true, width: 150,
    }), []);

    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            isFullView3: storedSettings?.isFullView3 ?? true,
            selectedUnit: storedSettings?.selectedUnit ?? 'Total',
            isShowAll: storedSettings?.isShowAll ?? true,
            isView: storedSettings?.isView ?? true,
        };
    };

    const [isFullView3, setIsFullView3] = useState(getLocalStorageSettings().isFullView3);
    const [selectedUnit, setSelectedUnit] = useState(getLocalStorageSettings().selectedUnit);
    const [isShowAll, setShowAll] = useState(getLocalStorageSettings().isShowAll);
    const [isView, setView] = useState(getLocalStorageSettings().isView);


    useEffect(() => {
        const tableSettings = {
            isFullView3,
            selectedUnit,
            isShowAll,
            isView,
        };
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isFullView3, selectedUnit, isShowAll, isView,]);

    const getField = (month) => `t${month}`;
    const getHeader = (headerKey, key) => `${headerKey} ${key}`;
    const createColumn = (month, headerKey) => ({
        field: getField(month),
        headerName: month === 0 ? currentYearKTQT : getHeader(headerKey, month),
        headerClass: 'right-align-important-2',
        suppressMenu: true,
        cellRenderer: (params) => {
            return (<div className="cell-action-group">
                <PopupCellActionPlan
                    {...params}
                    id={params.data.header}
                    table={table}
                    field={params.field}
                    company={company}
                />
            </div>);
        },
        valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
        editable: true,
        cellStyle: (params) => {
            return {textAlign: 'right'}
        },

    });

    const handleCellValueChanged = async (event) => {
        if (selectedUnit === 'Total') {
            return;
        }
        let plans = await getAllPlan();
        plans = plans.find(e => e.type === 'View3');
        let id = plans.id;
        plans = plans.rowData?.filter(e => e.layer !== '101');
        let isNotExistBUPlan = true;
        if (!plans) {
            plans = []
        }
        if (plans.length > 0) {
            plans.forEach((plan) => {
                if (plan.bu === selectedUnit) {
                    plan.data = rowData.filter(e => e.layer !== '101');
                    isNotExistBUPlan = false;
                }
            })
        }
        if (isNotExistBUPlan || plans.length === 0) {
            plans.push({
                bu: selectedUnit,
                data: rowData.filter(e => e.layer !== '101')
            })
        }
        await updatePlan({id: id, rowData: plans});
        // await loadData();
    };

    const onGridReady = useCallback(async () => {
        loadData();
    }, [isShowAll]);
    const getColumnDefs = () => {
        let cols = [{
            field: 'header',
            headerName: '',
            width: 200,
            editable: false,
            pinned: 'left',
            valueFormatter: (params) => cutStringGroup(params.value)
        }, {
            field: 't0',
            headerName: currentYearKTQT == "toan-bo" ? "Tổng" : currentYearKTQT,
            valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
            headerClass: 'right-align-important',
            cellStyle: (params) => {
                return {textAlign: 'right'}
            },
        },
        ];

        const startMonth = isFullView3 ? 1 : currentMonthKTQT - 2;
        const endMonth = !isFullView3 ? currentMonthKTQT : 12;
        for (let i = startMonth; i <= endMonth; i++) {
            if (i <= 12) {
                cols.push(createColumn(i, 'Tháng'));
            }
        }
        return cols;
    };

    async function loadData() {
        setLoading(true)
        let listUnit = await getAllUnits();
        // listUnit = setPermissionsListUnit(listUnit, currentUser)
        let listKMF = await getAllKmf();
        let plans = await getAllPlan();
        plans = plans.find(e => e.type === 'View3');
        plans = plans?.rowData;

        let rowData = loadDataPlan(listUnit, listKMF, plans, selectedUnit)
        rowData = calSupAndT0(rowData);
        rowData = rowData.filter(e => e.layer !== '100')
        setRowData(rowData)
        const uniqueGroupKH = [...new Set(listUnit
            .map(item => item.groupKH)
            .filter(groupKH => groupKH !== null)
        )];
        uniqueGroupKH.push('Total')
        setGroupKH(uniqueGroupKH);
        setListUnits(listUnit)
        setLoading(false);
    }


    const updateColDefs = useCallback(() => {
        setColDefs(getColumnDefs(isFullView3));
    }, [currentMonthKTQT, isFullView3, selectedUnit, currentYearKTQT])

    useEffect(() => {
        updateColDefs();
    }, [updateColDefs]);

    useEffect(() => {
        loadData()
    }, [isShowAll, isView, selectedUnit, currentYearKTQT]);

    const handleResetPlan = async () => {
        try {
            let plans = await getAllPlan();
            plans.forEach(plan => {
                if (plan.type === 'View3')
                    updatePlan({...plan, rowData: null})
            })
            toast.success('Dữ liệu kế hoạch đã được reset thành công!');
            await loadData()
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi reset kế hoạch.');
        }
    };

    const handleUnitChange = (value) => {
        setSelectedUnit(value);
    };

    const [openView, setOpenView] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleOpenViewKMF = () => {
        setOpenView(true);
        setSelectedItem('KMF')
        setSelectedType(1)
        setDropdownOpen(false)
    };
    const handleOpenViewDV = () => {
        setOpenView(true);
        setSelectedItem('DonVi')
        setSelectedType(1)
        setDropdownOpen(false)
    };

    const items = [
        {
            key: '0',
            label: (
                <span>
                🔄 Xem KMF
            </span>
            ),
            onClick: handleOpenViewKMF,
        },
        {
            key: '1',
            label: (
                <span>
                🔄 Xem Đơn Vị
            </span>
            ),
            onClick: handleOpenViewDV,
        },
    ];

    const popoverContent = (
        <div className={css.popoverContent}>
            {items.map((item) => (
                <div
                    key={item.key}
                    onClick={item.onClick}
                    className={css.popoverItem}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );


    return (
        <>
            <div style={{display: "flex", width: "100%"}}>
                <div style={{width: "100%"}}>

                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>Kế hoạch kinh doanh {currentYearKTQT == "toan-bo" ? "Tổng" : currentYearKTQT}</span>
                            <img src='/Group%20197.png' alt='Đơn vị: VND'
                                    style={{ width: '130px', marginLeft: '3px' }} />
                        </div>
                        <div className={css.headerAction}>
                            <ActionSelectDanhMucPlan selectedUnit={selectedUnit}
                                                     listUnit={listGroupKH}
                                                     handlers={handleUnitChange}/>
                            <Popconfirm
                                placement="leftTop"
                                title="Xác nhận xóa toàn bộ kế hoạch"
                                description="Hành động này không thể hoàn tác !!"
                                okText="Reset"
                                cancelText="Hủy"
                                onConfirm={handleResetPlan}
                            >
                                <Button className={css.customButton}>
                                    <span> Reset</span>
                                </Button>
                            </Popconfirm>
                            {/*<div>*/}
                            {/*    <ActionViewSetting table={table}/>*/}
                            {/*</div>*/}

                            <ActionMenuDropdown popoverContent={popoverContent}
                                                dropdownOpen={dropdownOpen}
                                                setDropdownOpen={setDropdownOpen}
                            />
                        </div>

                    </div>
                    <div style={{display: 'flex', gap: 20, marginTop: '10px'}}>
                        <div style={{flex: 1, height: '90%'}}>
                            <div
                                style={{
                                    height: '75vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                }}
                            >
                                <Loading loading={loading}/>

                                <div className="ag-theme-quartz"
                                     style={{height: '100%', width: '100%', display: 'flex'}}>
                                    <div style={{flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s',}}>
                                        <AgGridReact
                                            statusBar={statusBar}
                                            enableRangeSelection
                                            groupDefaultExpanded={-1}
                                            ref={gridRef}
                                            rowData={rowData}
                                            defaultColDef={defaultColDef}
                                            columnDefs={colDefs}
                                            rowSelection="multiple"
                                            onCellValueChanged={handleCellValueChanged}
                                            animateRows
                                            localeText={AG_GRID_LOCALE_VN}
                                            onGridReady={onGridReady}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {
                openView && <DanhMucPopUpDiaglog onClose={() => setOpenView(false)}
                                                 open={openView}
                                                 view={selectedItem}
                                                 table={table}
                                                 type={selectedType}
                />
            }

        </>
    );
}
