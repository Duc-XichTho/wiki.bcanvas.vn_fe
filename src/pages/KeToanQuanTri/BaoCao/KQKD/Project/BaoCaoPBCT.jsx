'use strict';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import AG_GRID_LOCALE_VN from '../../../../locale.jsx';
import {onFilterTextBoxChanged} from '../../../../function/quickFilter.js';
import {AgGridReact} from 'ag-grid-react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {toast} from 'react-toastify';
import '../../../../agComponent.css';
// Component
import AnalysisSideBar from '../../../../function/analysisSideBar.jsx';

import ExportableGrid from '../../../../popUp/exportFile/ExportableGrid.jsx';
import {getAllSoKeToan} from '../../../../../../apisKTQT/soketoanService.jsx';
import PopupCellActionBCKD from '../../../../popUp/cellAction/PopUpCellActionBCKD.jsx';
import {getAllKmf} from '../../../../../../apisKTQT/kmfService.jsx';
import {getAllUnits} from '../../../../../../apisKTQT/unitService.jsx';
import {getAllProject} from '../../../../../../apisKTQT/projectService.jsx';
import {calculateData, calculateDataView2} from '../logicKQKD.js';
import {AiButton, AiButton2, EllipsisIcon, NoteIcon, TimeSymbolIcon} from '../../../../../../image/IconSVG.js';
import {IoIosSearch} from 'react-icons/io';
import NoteComponent from '../../../../function/Note/noteComponent.jsx';
import {CURRENT_MONTH} from "../../../../../../CONST.js";
import {MyContext} from "../../../../../../MyContext.jsx";
import css from "../../../../../KeToanQuanTri/KeToanQuanTriComponent/KeToanQuanTri.module.css"; // Import the NoteComponent

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoPBCT({company}) {
    const table = 'BaoCaoPBCT';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const {currentMonth, listSoKeToan, loadDataSoKeToan} = useContext(MyContext);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [isNoteVisible, setNoteVisible] = useState(false); // State to manage note visibility
    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            isShowView: storedSettings?.isShowView ?? false,
            isShowView2: storedSettings?.isShowView2 ?? true,
            isShowAll1: storedSettings?.isShowAll1 ?? true,
            isHideEmptyColumns: storedSettings?.isHideEmptyColumns ?? true,
            selectedMonth: storedSettings?.selectedMonth ?? currentMonth,
        };
    };
    const [selectedMonth, setSelectedMonth] = useState(getLocalStorageSettings().selectedMonth);
    const [isShowView, setShowView] = useState(getLocalStorageSettings().isShowView);
    const [isShowView2, setShowView2] = useState(getLocalStorageSettings().isShowView2);
    useEffect(() => {
        const tableSettings = {
            isShowView,
            isShowView2,
            selectedMonth,
        };
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isShowView, isShowView2, selectedMonth]);

    const handleClickView = () => {
        setShowView((prev) => !prev);
        setShowView2(false);
    };

    const handleClickView2 = () => {
        setShowView2((prev) => !prev);
        setShowView(false);
    };


    const handleSelectedMonthChange = (e) => {
        setSelectedMonth(Number(e.target.value));
    };
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
    const statusBar = useMemo(() => {
        return {
            statusPanels: [{statusPanel: 'agAggregationComponent'}],
        };
    }, []);
    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            width: 140,
        };
    });

    async function prepareData() {
        setLoading(true);
        let data =  await loadDataSoKeToan();
        data = data.filter(e => e.year ==2024);
        data = data.filter(e => e.company === company)
        let units = await getAllProject();
        units = units.filter(e => e.company === company)
        let kmfList = await getAllKmf();
        kmfList = kmfList.filter(e => e.company === company)
        let rowData = isShowView2
            ? await calculateDataView2(data, units, null, 'project_viet_tat', 'project')
            : await calculateData(data, units, kmfList, 'project_viet_tat', 'project');

        setRowData(rowData);
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }

    const onGridReady = useCallback(async () => {
        prepareData();
    }, []);

    useEffect(() => {
        prepareData();
    }, [selectedMonth]);
    useEffect(() => {
        prepareData();
    }, [isShowView]);

    const rendHeader = (teamKey) => {
        const parts = teamKey.split('_');
        const prefix = parts[0];
        if (prefix === 'ALL') {
            return 'Tổng';
        }
        return `${prefix}`;
    };

    function createField(field) {
        const parts = field.split('_');
        const isLuyKeNam = parts[1] == '0';
        
        return {
            field: field,
            headerName: rendHeader(field),
            headerClass: 'right-align-business-name',
            cellRenderer: (params) => {
                return (
                    <div className="cell-action-group">
                        <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'CT'} />
                    </div>
                );
            },
            ...(isLuyKeNam && { pinned: 'left' }),
        };
    }

    async function redenderFields() {
        let fields = [
            {
                field: 'kmf',
                headerName: 'Khoản mục phí',
                width: 300,
                pinned: 'left',
                cellClassRules: {
                    'bold-header': (params) => {
                        return params.data.layer?.toString().split('.').length == 1;
                    },
                    'normal-header': (params) => {
                        return params.data.layer?.toString().split('.').length > 1;
                    },
                },
            },
            ...(await renderFieldMoney()),
        ];
        return fields;
    }

    async function renderFieldMoney() {
        const teamFields = [];
        for (let y = 0; y <= 12; y++) {
            if (selectedMonth === null || selectedMonth === y) {
                teamFields.push({
                    ...createField(`ALL_${y}`),
                });
            }
        }
        let units = await getAllProject();
        units
            .filter((e) => e.duyet == 1)
            .forEach((team) => {
                for (let y = 0; y <= 12; y++) {
                    if (selectedMonth === null || selectedMonth === y) {
                        const fieldName = `${team.project_viet_tat}_${y}`;
                        teamFields.push({
                            ...createField(fieldName),
                        });
                    }
                }
            });
        return teamFields;
    }

    const openAnalysis = async () => {
        setSidebarVisible(!isSidebarVisible);
    };

    const toggleNoteVisibility = () => {
        setNoteVisible(!isNoteVisible);
    };

    const noteType = `KQKD-DA-T${selectedMonth}`; // Construct the type based on selectedMonth

    useEffect(() => {
        const fetchData = async () => {
            try {
                setColDefs(await redenderFields());
            } catch (error) {
                console.log(error);
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, selectedMonth]);

    return (
        <>
            <div style={{display: 'flex'}}>
                <div style={{flex: 1, height: '90%'}}>
                    <div className="header-powersheet navbar_kqkd">
                        <div className="navbar_title">
              <span className="text-header-bao-cao">
                Báo cáo KQKD Theo Dự Án - {selectedMonth === 0 ? 'Luỹ kế năm' : 'Tháng ' + selectedMonth}
              </span>
                        </div>
                        <div className="navbar_title">
                            <div className="navbar_action">
                                <span><img src="/Group%20197.png" alt="Đơn vị: VND" style={{ width: '130px', marginLeft: '3px' }} /></span>
                            </div>

                            <div className="navbar_button_action">
                                <div className={isShowView ? 'navbar-item2' : 'navbar-item'} onClick={handleClickView}>
                                    <img src={isShowView ? AiButton2 : AiButton} className="imgIcon"/>
                                    <span className="maginRight">Kiểu A</span>
                                </div>

                                <div className={isShowView2 ? 'navbar-item2' : 'navbar-item'}
                                     onClick={handleClickView2}>
                                    <img src={isShowView2 ? AiButton2 : AiButton} className="imgIcon"/>
                                    <span className="maginRight">Kiểu B</span>
                                </div>

                                <div className="navbar-item3">
                                    <img src={TimeSymbolIcon} style={{width: '30px', marginLeft: '12px'}}/>
                                    <select
                                        className="header-select"
                                        value={selectedMonth}
                                        onChange={handleSelectedMonthChange}
                                        style={{background: '#EEEEEE', color: '#5F5E5B'}}
                                    >
                                        <option value={currentMonth - 2}>Tháng {currentMonth - 2}</option>
                                        <option value={currentMonth - 1}>Tháng {currentMonth - 1}</option>
                                        <option value={currentMonth}>Tháng {currentMonth}</option>
                                        <option value={0}>Luỹ kế năm</option>
                                    </select>
                                </div>

                                <div className="navbar-item" onClick={toggleNoteVisibility}>
                                    <img src={NoteIcon} style={{width: '27px'}}/>
                                    <span className="maginRight">Note</span>
                                </div>



                                <div className="navbar-item" ref={dropdownRef}>
                                    {/* <img
                                        src={EllipsisIcon}
                                        style={{width: 32, height: 32, cursor: 'pointer'}}
                                        alt="Ellipsis Icon"
                                        onClick={handleDropdownToggle}
                                    /> */}
                                    {isDropdownOpen && (
                                        <div className="dropdown-menu-button1">
                                            <ExportableGrid
                                                api={gridRef.current ? gridRef.current.api : null}
                                                columnApi={gridRef.current ? gridRef.current.columnApi : null}
                                                table={table}
                                                isDropdownOpen={isDropdownOpen}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                <div className="ag-theme-quartz"
                                     style={{height: '100%', width: '100%', display: 'flex'}}>
                                    <div style={{flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s'}}>
                                        <AgGridReact
                                            statusBar={statusBar}
                                            ref={gridRef}
                                            rowData={rowData}
                                            enableRangeSelection={true}
                                            defaultColDef={defaultColDef}
                                            treeData={true}
                                            // groupDefaultExpanded={-1}
                                            getDataPath={(data) => data.layer?.toString().split('.')}
                                            columnDefs={colDefs}
                                            rowSelection="multiple"
                                            // pagination={true}
                                            // paginationPageSize={500}
                                            animateRows={true}
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
                                                    return params.data.layer?.toString().split('.').length === 1;
                                                },
                                            }}
                                        />
                                    </div>
                                    {isSidebarVisible && <AnalysisSideBar table={table} gridRef={gridRef}/>}
                                </div>
                            </div>
                        </div>
                        <div style={{height: '76vh'}}>
                            {isNoteVisible &&
                            <NoteComponent type={noteType}
                            />
                        }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
