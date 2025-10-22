import '../../../../../index.css';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {formatCurrency} from '../../../function/formatMoney.js';
import AG_GRID_LOCALE_VN from '../../../locale.jsx';
import AnalysisSideBar from '../../../function/analysisSideBar.jsx';
import {MyContext} from "../../../../../MyContext.jsx";
import {getAllUnits} from "../../../../../apisKTQT/unitService.jsx";
import {getAllProduct} from "../../../../../apisKTQT/productService.jsx";
import {getAllVendor} from "../../../../../apisKTQT/vendorService.jsx";
import {getAllKmf} from "../../../../../apisKTQT/kmfService.jsx";
import loadDataPlan, {calSupAndT0, mergeDataByHeader} from "./logicPlan.js";
import {getAllPlan, updatePlan} from "../../../../../apisKTQT/planService.jsx";
import PopupCellActionPlan from "../../../popUp/cellAction/PopUpCellActionPlan.jsx";
import css from "../../../../B-Canvas/BCanvasComponent/BCanvas.module.css"
import {toast} from "react-toastify";
import setUpHeaderPlan from "./setUpHeaderPlan.js";
import {Popconfirm} from "antd";
import {setPermissionsListUnit} from "../logic/logicPermissions.js";
import {COMPANY_LIST} from "../../../../../CONST.js";

export default function Plan({company}) {
    const {currentMonth, listUnit, currentUser, setIsLoggedIn} = useContext(MyContext)

    const table = 'Plan';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [rowDataBeforeFilter, setRowDataBeforeFilter] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const [isSyncing, setIsSyncing] = useState(false);
    const [listUnits, setListUnits] = useState([]);
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

    const handleClickView = () => {
        setView("View1");
    };

    const handleClickView2 = () => {
        setView("View2");
    };


    const getField = (month) => `t${month}`;
    const getHeader = (headerKey, key) => `${headerKey} ${key}`;
    const createColumn = (month, headerKey) => ({
        field: getField(month),
        headerName: month === 0 ? 2024 : getHeader(headerKey, month),
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
        editable: (params) => {
            return (params.data.layer?.includes('.') || !params.data.header?.includes('*')) && selectedUnit !== 'Total' ? true : false;
        },
    });

    const handleCellValueChanged = async (event) => {
        for (let i = 0; i < rowDataBeforeFilter.length; i++) {
            let row = rowDataBeforeFilter[i];
            if (row.layer === event.data.layer) {
                row = event.data;
            }
        }
        let plans = await getAllPlan();
        let checkPlan = {};
        if (isView === 'View1') {
            checkPlan = plans.find(e => e.type === 'View2');
            plans = plans.find(e => e.type === 'View1');
        } else {
            checkPlan = plans.find(e => e.type === 'View1');
            plans = plans.find(e => e.type === 'View2');
        }
        let id = plans.id;
        plans = plans.rowData;
        let isNotExistBUPlan = true;
        if (!plans) {
            plans = []
        }
        if (plans.length > 0) {
            plans.forEach((plan) => {
                if (plan.bu === selectedUnit) {
                    plan.data = rowDataBeforeFilter;
                    isNotExistBUPlan = false;
                }
            })
        }
        if (isNotExistBUPlan || plans.length === 0) {
            plans.push({
                bu: selectedUnit,
                data: rowDataBeforeFilter
            })
        }
        await updatePlan({id: id, rowData: plans});
        if (!checkPlan.rowData) {
            await updatePlan({id: checkPlan.id, rowData: []});
        }
        await loadData();
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
            cellStyle: (params) => {
                const isBold = params.data.layer?.includes('.');
                return {
                    textAlign: 'left', fontWeight: isBold ? "normal" : 'bold',
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-family)',
                };
            },
            valueFormatter: (params) => setUpHeaderPlan(params.value)
        }, {
            field: 't0',
            headerName: '2024',
            valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
            headerClass: 'right-align-important',
            cellStyle: (params) => {
                const isBold = params.data.layer?.includes('.');
                return {
                    textAlign: 'right', paddingRight: 10, fontWeight: isBold ? "normal" : 'bold',
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-family)',
                };
            },
        },
        ];

        const startMonth = isFullView3 ? 1 : currentMonth - 2;
        const endMonth = !isFullView3 ? currentMonth : 12;
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
        let listVendor = await getAllVendor();
        let listKMF = await getAllKmf();
        let listProduct = await getAllProduct();
        let plans = await getAllPlan();

        // Tiếp tục xử lý dữ liệu khác
        listUnit = setPermissionsListUnit(listUnit, currentUser)
        setListUnits(listUnit)
        if (selectedUnit === 'Total') {
            let newRowData = [];
            if (!plans[0].rowData && !plans[1].rowData) {
                newRowData = loadDataPlan(listUnit, listVendor, listKMF, listProduct, null, selectedUnit)
            } else {
                plans.forEach((plan) => {
                    if (plan.rowData) {
                        plan.rowData?.forEach(data => {
                            newRowData = [...newRowData, ...calSupAndT0(data.data)]
                        })
                    }
                })
            }
            newRowData = newRowData.filter(e => e.layer !== '100')
            setRowData(mergeDataByHeader(newRowData))
        } else {
            if (isView === 'View1') {
                plans = plans.find(e => e.type === 'View1');
            } else {
                plans = plans.find(e => e.type === 'View2');
            }
            plans = plans.rowData;
            let rowData = loadDataPlan(listUnit, listVendor, listKMF, listProduct, plans, selectedUnit);
            setRowDataBeforeFilter(rowData);
            rowData = calSupAndT0(rowData);
            rowData = filterViewRowData(rowData, isView);
            rowData = rowData.filter(e => e.layer !== '100');
            setRowData(rowData);
        }

        setLoading(false);
    }


    function filterViewRowData(data, view) {
        return data.filter(item => {
            const parts = item.layer.split('.');
            return parts.length === 1 || (parts.length > 1 && parts[1].charAt(0) === (view == "View1" ? '1' : "2"));
        });
    }


    const updateColDefs = useCallback(() => {
        setColDefs(getColumnDefs(isFullView3));
    }, [currentMonth, isFullView3, selectedUnit])

    useEffect(() => {
        updateColDefs();
    }, [updateColDefs]);

    useEffect(() => {

        loadData()
    }, [isShowAll, isView, selectedUnit]);

    // useEffect(() => {
    //     getAllUnits().then((listUnit) => {
    //         setListUnits(listUnit)
    //     });
    // }, []);

    const handleResetPlan = async () => {
        try {
            setIsSyncing(true);
            let plans = await getAllPlan();
            plans.forEach(plan => {
                if (plan.type === 'View1' || plan.type === 'View2')
                    updatePlan({...plan, rowData: null})
            })
            toast.success('Dữ liệu kế hoạch đã được reset thành công!');
            await loadData()
            setTimeout(() => {
                setIsSyncing(false);
            }, 2000);
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi reset kế hoạch.');
        }
    };


    return (<>
        <div className="collapsible-nav">
            <button className="collapsible-header" style={{cursor: "default"}}>
                <div className="navbar_action2">
                    <span className={'title-bc-14-10'}>Báo cáo Kế hoạch mục tiêu KQKD</span>
                    <span className={'title-bc-01-11'}> (ĐV: ‘000VND)</span>
                </div>
            </button>
            <div className="button-action-coll">

                <div className={`${css.viewItem} ${css.selectItem}`}>
                    <select className={css.selectContent}
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                    >

                        {listUnits.map((unit) => (<option key={unit.code} value={unit.code}>
                            {unit.code === 'Total' ? 'Total' : (COMPANY_LIST.length > 0 ? unit.code : unit.name)}
                        </option>))}
                    </select>
                </div>
                {selectedUnit !== 'Total' && (<>
                    <div className={`${css.viewItem} ${isView == "View1" ? css.fullView : css.compactView}`}
                         onClick={handleClickView}>
                        <span>Theo nhóm SP</span>
                    </div>
                    <div className={`${css.viewItem} ${isView == "View2" ? css.fullView : css.compactView}`}
                         onClick={handleClickView2}>
                        <span>Theo nhóm KH</span>
                    </div>
                </>)}


                {/*<div className={`${css.viewItem} ${isFullView3 ? css.fullView : css.compactView}`}*/}
                {/*     onClick={() => setIsFullView3(true)}>*/}
                {/*    <span>Đầy đủ</span>*/}
                {/*</div>*/}

                {/*<div className={`${css.viewItem} ${!isFullView3 ? css.fullView : css.compactView}`}*/}
                {/*     onClick={() => setIsFullView3(false)}>*/}
                {/*<span>Rút gọn</span>*/}
                {/*</div>*/}
                <Popconfirm
                    placement="leftTop"
                    title="Xác nhận xóa toàn bộ kế hoạch"
                    description="Hành động này không thể hoàn tác !!"
                    okText="Reset"
                    cancelText="Hủy"
                    onConfirm={handleResetPlan}
                >
                    <div className={`${css.viewItem} ${css.resetItem}`}>
                        <span> Reset</span>
                    </div>
                </Popconfirm>
            </div>

        </div>
        <div style={{display: 'flex', gap: 20}}>
            <div style={{flex: 1, height: '90%'}}>
                <div
                    style={{
                        height: '75vh',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                    }}
                >
                    {loading && (<div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            position: 'absolute',
                            width: '100%',
                            zIndex: '1000',
                            backgroundColor: 'rgba(255, 255, 255, 0.96)',
                        }}
                    >
                        <img src='/loading3.gif' alt="Loading..." style={{width: '250px', height: '170px'}}/>
                    </div>)}
                    <div className="ag-theme-quartz" style={{height: '100%', width: '100%', display: 'flex'}}>
                        <div style={{flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s',}}>
                            <AgGridReact
                                treeData={true}
                                getDataPath={(data) => data.layer?.toString().split('.')}
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
                                autoGroupColumnDef={{
                                    headerName: '', maxWidth: 30, floatingFilter: false, cellRendererParams: {
                                        suppressCount: true,
                                    }, pinned: 'left',
                                }}
                                rowClassRules={{
                                    'row-head': (params) => {
                                        return params.data.layer?.toString().split('.').length === 1;
                                    },
                                }}
                            />
                        </div>
                        {isSidebarVisible && <AnalysisSideBar table={table + ` - ${team}`} gridRef={gridRef}/>}
                    </div>
                </div>
            </div>
        </div>
    </>);
}
