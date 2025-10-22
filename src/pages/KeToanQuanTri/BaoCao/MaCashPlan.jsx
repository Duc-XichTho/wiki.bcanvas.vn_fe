'use strict';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import AG_GRID_LOCALE_VN from '../../locale.jsx';
import {onFilterTextBoxChanged} from '../../function/quickFilter.js';
import {AgGridReact} from 'ag-grid-react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {toast} from 'react-toastify';
import '../../agComponent.css';
import PopupDeleteRenderer from '../../popUp/PopUpDelete.jsx';
import {handleSaveAgl} from '../../function/handleSaveAgl.js';
import {handleAddAgl} from '../../function/handleAddAgl.js';
import {getAllMaCashPlan} from '../../../../apisKTQT/maCashPlanService.jsx';
import {getCurrentDateTimeWithHours} from '../../function/formatDate.js';

import ExportableGrid from '../../popUp/exportFile/ExportableGrid.jsx';
import {formatCurrency} from '../../function/formatMoney.js';
import CheckboxRenderer from '../../function/MuiSwitchCustom.jsx';
import {CgAddR} from 'react-icons/cg';
import {getAllKmns} from '../../../../apisKTQT/kmnsService.jsx';
import PopFormAdd from '../../popUp/popupForm/PopFormAdd.jsx';
import ProjectFormUpdate from '../../popUp/popupForm/ProjectFormUpdate.jsx';
import {EllipsisIcon, ExportSVG, FullnessIcon, IconSVG, NoteIcon, TimeSymbolIcon} from '../../../../image/IconSVG.js';
import {IoIosSearch} from 'react-icons/io';
import {CURRENT_MONTH} from '../../../../CONST.js';
import {getAllUnits} from "../../../../apisKTQT/unitService.jsx";
import {MyContext} from "../../../../MyContext.jsx";
import css from "../../../KeToanQuanTri/KeToanQuanTriComponent/KeToanQuanTri.module.css";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function MaCashPlan({company}) {
    const table = 'MaCashPlan';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listCashItem, setListCashItem] = useState([]);
    const [listUnit, setListUnit] = useState([]);
    const [isFullView, setIsFullView] = useState(false);
    const { currentMonth } = useContext(MyContext);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            cellStyle: {fontSize: '14.5px'},
        };
    });
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const onGridReady = useCallback(async () => {
        loadData();
    }, []);

    async function loadData() {
        let data = await getAllMaCashPlan();
        let listCashItem = await  getAllKmns();
        let listUnit = await  getAllUnits();
        let filteredData = data
            .sort((a, b) => b.id - a.id)
            .filter((e) => e.khoan_thu_chi !== 'Dư đầu kỳ');
        filteredData.map(item => {
            if (item.company) {
                item.kmnsOptions = listCashItem.filter(e => e.company === item.company);
                item.unitOptions = listUnit.filter(e => e.company === item.company);
            }
            if (item.khoan_thu_chi) {
                let kmtc = listCashItem.find(e => e.name === item.khoan_thu_chi);
                item.khoan_thu_chi = kmtc?.dp;
            }
        })
        setRowData(filteredData);
        setLoading(false)
    }

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

    const getField = (month) => `t${month}_kehoach`;
    const getHeader = (month) => `Tháng ${month} KH`;
    const createColumn = (month) => ({
        field: getField(month),
        headerName: getHeader(month),
        width: 140,
        headerClass: 'right-align-important',
        valueFormatter: (params) => formatCurrency(params.value),
        cellStyle: {textAlign: 'right'},
    });
    useEffect(() => {
        const fetchData = async () => {
            const startMonth = Math.max(1, currentMonth);
            const length = isFullView ? 12 : 3;
            try {
                setColDefs([
                    {
                        pinned: 'left',
                        width: '40',
                        field: 'delete',
                        suppressHeaderMenuButton: true,
                        cellStyle: {textAlign: 'center'},
                        headerName: '',
                        cellRenderer: (params) => {
                            if (!params.data || !params.data.id) {
                                return null;
                            }
                            return (
                                <PopupDeleteRenderer {...params.data} id={params.data.id} table={table}
                                                     reloadData={onGridReady}/>
                            );
                        },
                        editable: false,
                    },
                    {
                        field: 'id',
                        pinned: 'left',
                        headerName: 'ID',
                        width: '45',
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
                    },
                    {
                        field: 'company',
                        headerName: 'Công ty',
                        filter: 'agMultiColumnFilter',
                        floatingFilter: true,
                        filterParams: {
                            filters: [
                                {
                                    filter: 'agTextColumnFilter',
                                },
                                {
                                    filter: 'agSetColumnFilter',
                                },
                            ],
                        },
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
                        filter: 'agMultiColumnFilter',
                        floatingFilter: true,
                        filterParams: {
                            filters: [
                                {
                                    filter: 'agTextColumnFilter',
                                },
                                {
                                    filter: 'agSetColumnFilter',
                                },
                            ],
                        },
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
                        filter: 'agMultiColumnFilter',
                        floatingFilter: true,
                        filterParams: {
                            filters: [
                                {
                                    filter: 'agTextColumnFilter',
                                },
                                {
                                    filter: 'agSetColumnFilter',
                                },
                            ],
                        },
                      cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: (params) => {
                            return {
                                searchType: "match",
                                allowTyping: true,
                                filterList: true,
                                highlightMatch: true,
                                values: params.data.kmnsOptions ? params.data.kmnsOptions.map((e) => e.dp) : listCashItem.map((e) => e.dp),
                            }
                        },
                        width: 180,
                        pinned: 'left',
                    },
                    {
                        field: 'mo_ta',
                        headerName: 'Mô tả',
                        width: 380,
                        pinned: 'left',
                        filter: 'agMultiColumnFilter',
                        floatingFilter: true,
                        filterParams: {
                            filters: [
                                {
                                    filter: 'agTextColumnFilter',
                                },
                                {
                                    filter: 'agSetColumnFilter',
                                },
                            ],
                        },
                        editable: true,
                    },
                    {
                        field: 'note',
                        headerName: 'Ghi chú',
                        width: 150,
                        pinned: 'left',
                    },
                    ...Array.from({length}, (_, i) => createColumn(isFullView ? i + 1 : startMonth + i)),

                    {
                        field: 'total_fy_hehoach',
                        headerName: 'Total FY KH',
                        width: 140,
                        headerClass: 'right-align-important',
                        valueFormatter: (params) => formatCurrency(params.value),
                        cellStyle: {textAlign: 'right'},
                    },
                    {
                        field: 'business_unit',
                        headerName: 'Business Unit',
                        width: 140,
                        hide: true,
                    },

                    {
                        field: 'createAt',
                        headerName: 'Create At',
                        width: 140,
                        hide: true,
                    },
                ]);
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, isFullView, currentMonth]);

    const handleAddRow = useCallback(async () => {
        const newItems = {
            createAt: getCurrentDateTimeWithHours(),
            show: true,
        };
        await handleAddAgl('', newItems, table);
        onGridReady();
    }, [rowData]);

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
        await handleSaveAgl(newUpdatedData, table, setUpdatedData);
        loadData();
    };

    return (
        <>
            <div>
                <div
                    className={'header-powersheet'}
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                >
                    <div style={{display: 'flex', width: '50%', alignItems: 'center'}}>
            <span style={{color: '#165591', fontSize: 23, fontWeight: 'bold', lineHeight: '35.41px'}}>
              Kế hoạch ngân sách
            </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'flex-end', width: '50%', gap: 20}}>
                        <div
                            className="navbar-item"
                            style={{
                                borderRadius: '10px',
                                background: isFullView ? '#EEEEEE' : 'white',
                                display: 'flex',
                                width: '15%',
                            }}
                            onClick={() => setIsFullView(true)}
                        >
                            <img src={FullnessIcon} style={{width: '30px', marginLeft: '10px'}}/>
                            <span>Đầy đủ</span>
                        </div>
                        <div
                            className="navbar-item"
                            style={{
                                borderRadius: '10px',
                                background: isFullView ? 'white' : '#EEEEEE',
                                display: 'flex',
                                width: '15%',
                            }}
                            onClick={() => setIsFullView(false)}
                        >
                            <img src={FullnessIcon} style={{width: '30px', marginLeft: '10px'}}/>
                            <span>Rút gọn</span>
                        </div>
                        <div className="navbar-item" onClick={handleAddRow}>
                            <img src={IconSVG} style={{width: '32px', height: '37px'}} alt="Add Icon"/>
                            <span> Thêm mới</span>
                        </div>
                        <div className="navbar-item">
                            <img
                                src={EllipsisIcon}
                                style={{width: 32, height: 32}}
                                alt="Ellipsis Icon"
                                onClick={handleDropdownToggle}
                            />
                            {isDropdownOpen && (
                                <div className="dropdown-menu-button1">
                                    <ExportableGrid
                                        api={gridRef.current ? gridRef.current.api : null}
                                        columnApi={gridRef.current ? gridRef.current.columnApi : null}
                                        table={table}
                                        setDropdownOpen={setIsDropdownOpen}
                                        ref={dropdownRef}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        height: '75vh',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        marginTop: '15px',
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
                    <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                        <AgGridReact
                            statusBar={statusBar}
                            ref={gridRef}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                            columnDefs={colDefs}
                            rowSelection="multiple"
                            pagination={true}
                            enableRangeSelection={true}
                            onCellValueChanged={handleCellValueChanged}
                            paginationPageSize={500}
                            animateRows={true}
                            paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                            localeText={AG_GRID_LOCALE_VN}
                            onGridReady={onGridReady}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
