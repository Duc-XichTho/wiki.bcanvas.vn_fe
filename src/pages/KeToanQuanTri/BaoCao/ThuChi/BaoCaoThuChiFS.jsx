import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {formatCurrency} from '../../../function/formatMoney.js';
import ExportableGrid from '../../../popUp/exportFile/ExportableGrid.jsx';
import AG_GRID_LOCALE_VN from '../../../locale.jsx';
import {handleSaveAgl} from '../../../function/handleSaveAgl.js';
import {onFilterTextBoxChanged} from '../../../function/quickFilter.js';
import PopupCellActionCashReport from '../../../popUp/cellAction/PopUpCellActionCashReport.jsx';
import AnalysisSideBar from '../../../function/analysisSideBar.jsx';
import {getAllSoKeToan} from '../../../../../apisKTQT/soketoanService.jsx';
import {getAllMaCashPlan} from '../../../../../apisKTQT/maCashPlanService.jsx';
import {getAllKmns} from '../../../../../apisKTQT/kmnsService.jsx';
import {getAllVas} from '../../../../../apisKTQT/vasService.jsx';
import {CURRENT_MONTH} from '../../../../../CONST.js';
import {calculateBCTC} from './LogicBaoCaoThiChi.js';
import {MyContext} from "../../../../../MyContext.jsx";

export default function BaoCaoThuChiFS({company, isFullView2, isShowAll, currentMonth}) {
    const {listSoKeToan, loadDataSoKeToan} = useContext(MyContext);
    const table = 'BaoCaoThuChi';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(true);
    // const currentMonth = new Date().getMonth() + 1;
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const defaultColDef = useMemo(
        () => ({
            editable: false,
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            resizeable: true,
            width: 150,
        }),
        []
    );
    const getField = (month, key) => `t${month}_${key}`;
    const getHeader = (month, key) => `Tháng ${month} ${key}`;
    const createColumn = (month, fieldKey, headerKey) => ({
        field: getField(month, fieldKey),
        headerName: month === 0 ? 2024 : getHeader(month, headerKey),
        headerClass: 'right-align-important-2',
        suppressMenu: true,
        cellStyle: {textAlign: 'right'},
        cellRenderer: (params) => {
            return (
                <div className="cell-action-group">
                    <PopupCellActionCashReport {...params} field={getField(month, fieldKey)} company={company}/>
                </div>
            );
        },
        editable: (params) => {
            return fieldKey === 'kehoach' && params.data.refercode === '5';
        },
    });

    const onGridReady = useCallback(async () => {
        loadData();
    }, [company, isShowAll]);
    const getColumnDefs = () => {
        let cols = [
            {field: 'id', headerName: 'ID', hide: true},
            {
                field: 'dp',
                headerName: 'Tiêu đề',
                width: 310,
                pinned: 'left',
                cellClassRules: {
                    'bold-header': (params) => {
                        return params.data.refercode?.toString().split('.').length == 1;
                    },
                    'normal-header': (params) => {
                        return params.data.refercode?.toString().split('.').length > 1;
                    },
                },
            },
            {
                field: 'avg',
                headerName: `TB T${currentMonth - 2}-${currentMonth - 1}-${currentMonth}`,
                cellStyle: {textAlign: 'right', paddingRight: 10},
                valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
                headerClass: 'right-align-important',
                width: 120,
                cellClassRules: {
                    'bold-header': (params) => {
                        return params.data.refercode?.toString().split('.').length == 1;
                    },
                    'normal-header': (params) => {
                        return params.data.refercode?.toString().split('.').length > 1;
                    },
                },
            },

            {
                field: 'change',
                width: 130,
                columnGroupShow: 'open',
                headerClass: 'right-align-important',
                headerName: `Sparkline T1 - T${currentMonth}`,
                cellRenderer: 'agSparklineCellRenderer',
                cellRendererParams: {
                    sparklineOptions: {
                        type: 'area',
                        // marker: {size: 2},
                        tooltip: {
                            renderer: (params) => {
                                const {yValue, xValue} = params;
                                return {
                                    content: formatCurrency((yValue / 1000).toFixed(0)),
                                    fontSize: '12px',
                                };
                            },
                        },
                    },
                    valueFormatter: (params) => {
                        const changeArray = params.value || [];
                        return changeArray.map((value) => {
                            return value === null || isNaN(value) ? 0 : Number(value);
                        });
                    },
                },
            },
            {
                field: 't0_thuchien',
                headerName: '2024',
                cellStyle: {textAlign: 'right', paddingRight: 10},
                valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
                headerClass: 'right-align-important',
                width: 100,
                cellClassRules: {
                    'bold-header': (params) => {
                        return params.data.refercode?.toString().split('.').length == 1;
                    },
                    'normal-header': (params) => {
                        return params.data.refercode?.toString().split('.').length > 1;
                    },
                },
            },
        ];
        const startMonth = isFullView2 ? 1 : currentMonth - 2;
        for (let i = startMonth; i <= currentMonth; i++) {
            cols.push(createColumn(i, 'thuchien', ''));
        }
        return cols;
    };

    async function loadData() {
        setSidebarVisible(false);
        setLoading(true);
        let soKeToanList = await loadDataSoKeToan();
        soKeToanList = soKeToanList.filter((e) => e.consol?.toLowerCase() == 'consol');
        let kmnsList = await getAllKmns();
        let vasList = await getAllVas();
        vasList = vasList.filter((e) => e.consol?.toLowerCase() == 'consol');
        let cashPlan = await getAllMaCashPlan();
        let result = calculateBCTC(soKeToanList, kmnsList, vasList, cashPlan, currentMonth);
        if (isShowAll) {
            result = result.filter((item) => {
                for (let i = 1; i <= 12; i++) {
                    const thuchienKey = `t${i}_thuchien`;
                    if ((item[thuchienKey] && item[thuchienKey] != 0) || !item.refercode.includes('.')) {
                        return true;
                    }
                }
                return false;
            });
        }
        result = result.map((item) => {
            const kmnsItem = kmnsList.find((kmns) => kmns.name === item.header);
            if (kmnsItem) {
                item.dp = kmnsItem.dp;
            } else {
                item.dp = item.header;
            }
            return item;
        });
        setRowData(result);
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }

    const updateColDefs = useCallback(() => {
        setColDefs(getColumnDefs(isFullView2));
    }, [currentMonth, isFullView2, company]);

    useEffect(() => {
        updateColDefs();
    }, [updateColDefs]);

    useEffect(() => {
        loadData();
    }, [company, isShowAll]);

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
            >
                {loading && (
                    <div
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
                        <img src='/loading3.gif' alt="Loading..." style={{ width: '250px', height: '170px' }} />
                    </div>
                )}
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%', display: 'flex'}}>
                    <div
                        style={{
                            flex: isSidebarVisible ? '75%' : '100%',
                            transition: 'flex 0.3s',
                        }}
                    >
                        <AgGridReact
                            treeData={true}
                            // groupDefaultExpanded={-1}
                            getDataPath={(data) => data.refercode?.toString().split('.')}
                            statusBar={statusBar}
                            enableRangeSelection
                            ref={gridRef}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                            columnDefs={colDefs}
                            rowSelection="multiple"
                            // pagination
                            // paginationPageSize={500}
                            animateRows
                            // paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                            localeText={AG_GRID_LOCALE_VN}
                            onGridReady={onGridReady}
                            autoGroupColumnDef={{
                                headerName: '',
                                maxWidth: 30,
                                editable: false,
                                floatingFilter: false,
                                cellRendererParams: {
                                    suppressCount: true,
                                },
                                pinned: 'left',
                            }}
                            rowClassRules={{
                                'row-head': (params) => {
                                    return params.data.refercode?.toString().split('.').length === 1;
                                },
                            }}
                            domLayout={'autoHeight'}
                        />
                    </div>
                    {isSidebarVisible && <AnalysisSideBar table={table + ` - ${team}`} gridRef={gridRef}/>}
                </div>
            </div>
        </>
    );
}
