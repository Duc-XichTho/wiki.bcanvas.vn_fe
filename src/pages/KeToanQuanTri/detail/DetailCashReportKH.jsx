import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import AG_GRID_LOCALE_VN from '../locale.jsx';
import {AgGridReact} from 'ag-grid-react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {toast} from 'react-toastify';
import '../agComponent.css';
import {formatCurrency} from '../function/formatMoney.js';
import {getAllMaCashPlan} from '../../../apisKTQT/maCashPlanService.jsx';
import CheckboxRenderer from '../function/MuiSwitchCustom.jsx';
import {CgAddR} from 'react-icons/cg';
import {getCurrentDateTimeWithHours} from '../function/formatDate.js';
import {handleAddAgl} from '../function/handleAddAgl.js';
import {handleSaveAgl} from '../function/handleSaveAgl.js';
import {getAllKmns} from "../../../apisKTQT/kmnsService.jsx";
import {getAllUnits} from "../../../apisKTQT/unitService.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function DetailCashReportKH({header, kmf, month, company}) {
    const table = 'DetailCashReportKH';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [listCashItem, setListCashItem] = useState([]);
    const [listUnit, setListUnit] = useState([]);
    const [loading, setLoading] = useState(false);
    const defaultColDef = useMemo(() => {
        return {
            filter: true,
            width: 180,
            cellStyle: {fontSize: '14.5px'},
            editable: true,
        };
    });
    const statusBar = useMemo(() => {
        return {
            statusPanels: [{statusPanel: 'agAggregationComponent'}],
        };
    }, []);
    useEffect(() => {
        setLoading(true)
        getAllKmns().then((data) => {
            setListCashItem(data);
        });
        getAllUnits().then((data) => {
            setListUnit(data);
        });
        loadData();
        setLoading(false)
    }, []);

    async function loadData() {
        let data = await getAllMaCashPlan()
        let listCashItem = await getAllKmns();
        let filteredData = data.filter((e) => e.khoan_thu_chi === header);
        filteredData.map(item => {
            if (item.company) {
              item.unitOptions = listUnit.filter(e => e.company === item.company);
            }
            if (item.khoan_thu_chi) {
                let kmtc = listCashItem.find(e => e.name === item.khoan_thu_chi);
                item.khoan_thu_chi = kmtc?.dp;
            }
        })
        setRowData(filteredData);
    }

    const onGridReady = useCallback(async () => {
        loadData()
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setColDefs([
                    {
                        field: 'id',
                        headerName: 'ID',
                        hide: true,
                    },
                    {
                        field: 'approve',
                        suppressMenu: true,
                        headerName: 'Duyệt chi',
                        width: 80,
                        editable: false,
                        cellRenderer: CheckboxRenderer,
                        cellStyle: {display: 'flex', justifyContent: 'center', alignItems: 'center'},
                        pinned: 'left',
                    }, {
                        field: 'company',
                        headerName: 'Công ty',
                      cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            values: ['DEHA', 'SOL']
                        },
                        width: 100,
                        pinned: 'left',
                    },
                    {
                        field: 'unit_code',
                        headerName: 'Đơn vị',
                      cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: (params) => {
                            return {
                                searchType: "match",
                                allowTyping: true,
                                filterList: true,
                                highlightMatch: true,
                                values: params.data.unitOptions ? params.data.unitOptions.map((unit) => unit.name) : listUnit.map((unit) => unit.name),
                            }
                        },
                        width: 100,
                        pinned: 'left',
                    },
                    {
                        field: 'khoan_thu_chi',
                        headerName: 'Khoản mục thu chi',
                        width: 160,
                        editable: false,
                    },
                    {
                        field: 'mo_ta',
                        headerName: 'Diễn giải',
                        flex: 1,
                    },

                    {
                        field: 'note',
                        headerName: 'Ghi chú',
                        width: 150,
                    },
                    {
                        field: `t${month}_kehoach`,
                        headerName: 'Số tiền',
                        width: 120,
                        headerClass: 'right-align-important',
                        valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
                        cellStyle: {textAlign: 'right'},
                    },
                ]);
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table]);

    function headerRenderer(subs, col) {
        let sum = 0;
        subs.map((node) => {
            if (node.show && node.approve === "1") {
                sum += +node[col];
            }
        });
        return sum;
    }

    const handleCellValueChanged = async (event) => {
        const rowExistsInUpdatedData = updatedData.some((row) => row.id === event.data.id);
        let newUpdatedData;
        if (rowExistsInUpdatedData) {
            newUpdatedData = updatedData.map((row) => {
                if (row.id === event.data.id) {
                    return {...event.data};
                }
                return row;
            });
        } else {
            newUpdatedData = [...updatedData, event.data];
        }
        if (event.data.khoan_thu_chi) {
            let kmtc = listCashItem.find(e => e.dp === event.data.khoan_thu_chi);
            event.data.khoan_thu_chi = kmtc.name;
        }
        setUpdatedData(newUpdatedData);
        await handleSaveAgl(newUpdatedData, 'MaCashPlan', setUpdatedData);
      loadData()
    };

    function calSum() {
        let sum = headerRenderer(rowData, `t${month}_kehoach`);
        return sum ? (sum / 1000).toFixed(0) : 0;
    }

    const handleAddRow = useCallback(async () => {
        const newRow = {
            approve: false,
            khoan_thu_chi: header,
            mo_ta: '',
            note: '',
            createAt: getCurrentDateTimeWithHours(),
            show: true,
            [`t${month}_kehoach`]: 0,
        };
        await handleAddAgl(company, newRow, 'MaCashPlan');
        onGridReady();
    }, [rowData]);

    return (
        <>
            <div>
                <div className={'header-detail'}>
                    <button
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '35px',
                            height: '35px',
                        }}
                        onClick={handleAddRow}
                    >
                        <CgAddR style={{width: '50%', height: '50%'}}/>
                    </button>
                    <div>Tổng: {formatCurrency(calSum())}</div>
                </div>
                <div
                    style={{
                        height: '50vh',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        marginTop: '15px',
                    }}
                >
                    <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                        <AgGridReact
                            statusBar={statusBar}
                            enableRangeSelection={true}
                            ref={gridRef}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                            columnDefs={colDefs}
                            rowSelection="multiple"
                            animateRows={true}
                            localeText={AG_GRID_LOCALE_VN}
                            onGridReady={onGridReady}
                            onCellValueChanged={handleCellValueChanged}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
