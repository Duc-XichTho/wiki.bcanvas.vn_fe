'use strict';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
// Ag Grid Function
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import {toast} from 'react-toastify';
import '../../../../agComponent.css';
import {onFilterTextBoxChanged} from '../../../../function/quickFilter.js';
import AG_GRID_LOCALE_VN from '../../../../locale.jsx';
// Component
import AnalysisSideBar from '../../../../function/analysisSideBar.jsx';

import {IoIosSearch} from 'react-icons/io';
import {getAllKmf} from '../../../../../../apisKTQT/kmfService.jsx';
import {getAllProduct} from '../../../../../../apisKTQT/productService.jsx';
import {
    AiButton,
    AiButton2,
    AllViewIcon,
    AllViewIcon2,
    EllipsisIcon,
    NoteIcon,
    TimeSymbolIcon,
} from '../../../../../../image/IconSVG.js';
import {MyContext} from '../../../../../../MyContext.jsx';
import NoteComponent from '../../../../function/Note/noteComponent.jsx';
import PopupCellActionBCKD from '../../../../popUp/cellAction/PopUpCellActionBCKD.jsx';
import ExportableGrid from '../../../../popUp/exportFile/ExportableGrid.jsx';
import {Color} from '../../Color.js';
import {calculateData, calculateDataView2} from '../logicKQKD.js';
import {getAllDeal} from '../../../../../../apisKTQT/dealService.jsx';
import ActionSelectUnitDisplay from '../../../ActionButton/ActionSelectUnitDisplay.jsx';
import css from "../../../../../B-Canvas/BCanvasComponent/BCanvas.module.css";
import KQKDCharts from '../../components/KQKDCharts.jsx';
import { formatUnitDisplay } from '../../functionKTQT/formatUnitDisplay.js';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoDeal({company}) {
    const table = 'BaoCaoDeal';
    const {currentMonth, listSoKeToan, loadDataSoKeToan, unitDisplay} = useContext(MyContext);
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [isShowView, setShowView] = useState(() => {
        const tableSettings = JSON.parse(localStorage.getItem(table)) || {};
        return tableSettings.isShowView || false;
    });
    const [isShowView2, setShowView2] = useState(() => {
        const tableSettings = JSON.parse(localStorage.getItem(table)) || {};
        return tableSettings.isShowView2 || true;
    });
    const [isShowAll1, setShowAll1] = useState(() => {
        const tableSettings = JSON.parse(localStorage.getItem(table)) || {};
        return tableSettings.isShowAll1 || true;
    });
    const [isNoteVisible, setNoteVisible] = useState(false);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(() => {
        const tableSettings = JSON.parse(localStorage.getItem(table)) || {};
        return tableSettings.isHideEmptyColumns || true;
    });


    useEffect(() => {
        // Save filter states for this specific table to localStorage
        const tableSettings = {
            isShowView,
            isShowView2,
            isShowAll1,
            isHideEmptyColumns
        };
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [table, isShowView, isShowView2, isShowAll1, isHideEmptyColumns]);
    const handleClickView = () => {
        setShowView(prev => !prev);
        setShowView2(false);
    };

    const handleClickView2 = () => {
        setShowView2(prev => !prev);
        setShowView(false);
    };

    const handleIsShowAll1 = () => {
        setShowAll1(prev => !prev);
    };
    const handleHideEmptyColumns = () => {
        setHideEmptyColumns(prev => !prev);
    };

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // const handleClickOutside = (event) => {
    //     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
    //         setIsDropdownOpen(false);
    //     }
    // };
    //
    // useEffect(() => {
    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, []);

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
        let data = await loadDataSoKeToan();
        data = data.filter(e => e.year == 2024);
        data = data.filter((e) => e.consol?.toLowerCase() == 'consol');
        let units = await getAllDeal();
        const uniqueUnits = units.reduce((acc, current) => {
            if (!acc.find((unit) => unit.code === current.code)) {
                acc.push(current);
            }
            return acc;
        }, []);
        let kmfList = await getAllKmf();
        kmfList = kmfList.reduce((acc, current) => {
            if (!acc.find((unit) => unit.name === current.name)) {
                acc.push(current);
            }
            return acc;
        }, []);
        let rowData = isShowView2
            ? calculateDataView2(data, uniqueUnits, kmfList, 'code', 'deal2', 'deal')
            : calculateData(data, uniqueUnits, kmfList, 'code', 'deal2', 'deal');
        if (isShowAll1) {
            rowData = rowData.filter((item) => {
                for (let j = 0; j < uniqueUnits.length; j++) {
                    if (item[`${uniqueUnits[j].code}_${selectedMonth}`] !== 0 || !item.layer.includes('.')) {
                        return true;
                    }
                }

                return false;
            });
        }
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
    }, [selectedMonth, isShowAll1, isShowView]);

    const rendHeader = (teamKey) => {
        const parts = teamKey.split('_');
        const prefix = parts[0];
        if (prefix === 'ALL') {
            return 'Tổng';
        }
        return `${prefix}`;
    };

    function createField(field) {
        return {
            field: field,
            headerName: rendHeader(field),
            headerClass: 'right-align-business-name',
            cellRenderer: (params) => {
                return (
                    <div className="cell-action-group">
                        <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'SP'}/>
                    </div>
                );
            },
            ...Color(),
        };
    }

    async function redenderFields() {
        let fields = [
            {
                field: 'dp',
                headerName: 'Khoản mục phí',
                width: 300,
                pinned: 'left',
                ...Color(),
            },
            ...(await renderFieldMoney()),
        ];
        return fields;
    }

    async function renderFieldMoney() {
        const teamFields = [];
        const validFields = [];
        for (let y = 0; y <= 12; y++) {
            if (selectedMonth === null || selectedMonth === y) {
                teamFields.push({
                    ...createField(`ALL_${y}`),
                });
            }
        }
        let units = await getAllProduct();
        if (isHideEmptyColumns) {
            units.forEach((team) => {
                for (let y = 0; y <= 12; y++) {
                    if (selectedMonth === null || selectedMonth == y) {
                        const fieldName = `${team.code}_${y}`;
                        if (rowData.some((row) => row[fieldName] !== 0 && row[fieldName] !== null)) {
                            validFields.push(fieldName);
                        }
                    }
                }
            });
            validFields.forEach((field) => {
                teamFields.push(createField(field));
            });
        } else {
            units.forEach((team) => {
                for (let y = 0; y <= 12; y++) {
                    if (selectedMonth === null || selectedMonth == y) {
                        const fieldName = `${team.code}_${y}`;
                        teamFields.push(createField(fieldName));
                    }
                }
            });
        }

        return teamFields;
    }

    const toggleNoteVisibility = () => {
        setNoteVisible(!isNoteVisible);
    };

    const noteType = `KQKD-Deal-T${selectedMonth}`; // Construct the type based on selectedMonth

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
    }, [onGridReady, rowData, table, selectedMonth, isHideEmptyColumns]);


    return (
        <>
            <div style={{display: 'flex'}}>
                <div style={{flex: 1, height: '90%'}}>
                    <div className="header-powersheet navbar_kqkd">
                        <div className="navbar_title">
                            <div className="navbar_action">
                                <span className={'title-bc-14-10'}>Báo cáo KQKD Deal</span>
                                <ActionSelectUnitDisplay />
                            </div>
                            <div className="navbar_button_action">
                                <div className={`${css.viewItem} ${isShowView ? css.fullView : css.compactView}`}
                                     onClick={handleClickView}>
                                    <span>Kiểu A</span>
                                </div>
                                <div className={`${css.viewItem} ${isShowView2 ? css.fullView : css.compactView}`}
                                     onClick={handleClickView2}>
                                    <span>Kiểu B</span>
                                </div>
                                <div
                                    className={`${css.viewItem} ${isHideEmptyColumns ? css.fullView : css.compactView}`}
                                    onClick={handleHideEmptyColumns}>
                                    <span>Ẩn cột trống</span>
                                </div>

                                <div className={`${css.viewItem} ${isShowAll1 ? css.fullView : css.compactView}`}
                                     onClick={handleIsShowAll1}>
                                    <span>Ẩn dòng trống</span>
                                </div>
                                <div className={`${css.viewItem} ${css.selectItem}`}>
                                    <select className={css.selectContent}
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    >
                                        {Array.from({length: currentMonth}, (_, index) => (
                                            <option key={index + 1} value={index + 1}>
                                                Tháng {index + 1}
                                            </option>
                                        ))}
                                        <option value={0}>Luỹ kế năm</option>
                                    </select>
                                </div>

                                {/*<div className={`navbar-item ${isNoteVisible ? 'note-visible' : 'note-unvisible'}`}*/}
                                {/*     onClick={toggleNoteVisibility}*/}
                                {/*>*/}
                                {/*    <img className="noteIcon" src={NoteIcon}/>*/}
                                {/*    <span className="maginRight">Note</span>*/}
                                {/*</div>*/}
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
                            <KQKDCharts 
                                rowData={rowData} 
                                selectedMonth={selectedMonth} 
                                unitDisplay={unitDisplay}
                                formatUnitDisplay={formatUnitDisplay}
                            />
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
                                        <img src='/loading3.gif' alt="Loading..."
                                             style={{width: '250px', height: '170px'}}/>
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
                        {/*<div style={{height: '83vh'}}>{isNoteVisible && <NoteComponent type={noteType}/>}</div>*/}
                    </div>
                </div>
            </div>
        </>
    );
}
