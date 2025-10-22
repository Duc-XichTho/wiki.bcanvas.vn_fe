'use strict';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import NoteComponent from '../../../../function/Note/noteComponent.jsx'; // Import the NoteComponent
import {AllViewIcon, AllViewIcon2, NoteIcon} from '../../../../../../image/IconSVG.js'; // Ensure you have the NoteIcon imported
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
import {getAllSoKeToan} from '../../../../../../apis/soketoanService.jsx';
import PopupCellActionBCKD from '../../../../popUp/cellAction/PopUpCellActionBCKD.jsx';
import {getAllKmf} from '../../../../../../apis/kmfService.jsx';
import {getAllUnits} from '../../../../../../apis/unitService.jsx';
import {calculateData, calculateDataView2} from '../logicKQKD.js';
import {AiButton, AiButton2, EllipsisIcon, TimeSymbolIcon} from '../../../../../../image/IconSVG.js';
import {IoIosSearch} from 'react-icons/io';
import {calculateBCTC} from '../../ThuChi/LogicBaoCaoThiChi.js';
import {MyContext} from '../../../../../../MyContext.jsx';
import {Color} from '../../Color.js';
import css from "../../../../../B-Canvas/BCanvasComponent/BCanvas.module.css"
import {setPermissionsListUnit} from "../../logic/logicPermissions.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoPBDV({company}) {
    const table = 'BaoCaoPBDV';
    const gridRef = useRef();
    const {currentMonth, listSoKeToan, loadDataSoKeToan, currentUser} = useContext(MyContext);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [isNoteVisible, setNoteVisible] = useState(false);


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
    const [isShowAll1, setShowAll1] = useState(getLocalStorageSettings().isShowAll1);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(getLocalStorageSettings().isHideEmptyColumns);

    useEffect(() => {
        const tableSettings = {
            isShowView,
            isShowView2,
            isShowAll1,
            isHideEmptyColumns,
            selectedMonth,
        };
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isShowView, isShowView2, isShowAll1, isHideEmptyColumns, selectedMonth]);

    const handleClickView = () => {
        setShowView((prev) => !prev);
        setShowView2(false);
    };

    const handleClickView2 = () => {
        setShowView2((prev) => !prev);
        setShowView(false);
    };

    const handleIsShowAll1 = () => {
        setShowAll1((prev) => !prev);
    };

    const handleHideEmptyColumns = () => {
        setHideEmptyColumns((prev) => !prev);
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
        data = data.filter(e => e.year ==2024);
        let units = await getAllUnits();
        units = setPermissionsListUnit(units, currentUser)
        let kmfList = await getAllKmf();
        kmfList = kmfList.reduce((acc, current) => {
            if (!acc.find((unit) => unit.name === current.name)) {
                acc.push(current);
            }
            return acc;
        }, []);
        let rowData = isShowView2
            ? calculateDataView2(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams')
            : calculateData(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams');
        if (isShowAll1) {
            rowData = rowData.filter((item) => {
                for (let j = 0; j < units.length; j++) {
                    if (item[`${units[j].code}_${selectedMonth}`] !== 0 || !item.layer.includes('.')) {
                        return true;
                    }
                }

                return false;
            });
        }
        setRowData(rowData);
        setTimeout(() => {
            setLoading(false);
        }, 800);
    }

    const onGridReady = useCallback(async () => {
        prepareData();
    }, []);

    useEffect(() => {
        prepareData();
    }, [selectedMonth]);
    useEffect(() => {
        prepareData();
    }, [isShowAll1]);

    useEffect(() => {
        prepareData();
    }, [isShowView]);

    const rendHeader = (teamKey, header) => {
        if (header) return header;
        const parts = teamKey.split('_');
        const prefix = parts[0].split('-')[0];
        if (prefix === undefined || prefix === null || prefix === "ALL") {
            return 'Tổng';
        }
        return `${prefix}`;
    };

    function createField(field, header) {
        return {
            field: field,
            headerName: rendHeader(field, header),
            headerClass: 'right-align-business-name',
            cellRenderer: (params) => {
                return (
                    <div className="cell-action-group">
                        <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'DV'}/>
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
                cellStyle: (params) => {
                    const isBold = params.data.layer?.includes('.');
                    return {
                        textAlign: 'left', paddingRight: 10, fontWeight: isBold ? "normal" : 'bold',
                    };
                },
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
        let units = await getAllUnits();
        units = setPermissionsListUnit(units, currentUser)
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
            units.filter(e => e.company !== 'Group').forEach((team) => {
                for (let y = 0; y <= 12; y++) {
                    if (selectedMonth === null || selectedMonth === y) {
                        const fieldName = `${team.code}_${y}`;
                        teamFields.push({
                            ...createField(fieldName, team.code),
                        });
                    }
                }
            });
        }
        return teamFields;
    }

    const openAnalysis = async () => {
        setSidebarVisible(!isSidebarVisible);
    };

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
    }, [onGridReady, rowData, table, selectedMonth , isHideEmptyColumns]);

    const toggleNoteVisibility = () => {
        setNoteVisible(!isNoteVisible);
    };

    const noteType = `KQKD-DV-T${selectedMonth}`;

    return (
        <>
            <div style={{display: 'flex'}}>
                <div style={{flex: 1, height: '90%'}}>
                    <div className="header-powersheet navbar_kqkd">
                        <div className="navbar_title">
                            <div className="navbar_action">
                                <span className={'title-bc-14-10'}>Báo cáo KQKD Đơn vị </span>
                                <span><img src="/Group%20197.png" alt="Đơn vị: VND" style={{ width: '130px', marginLeft: '3px' }} /></span>
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
                                <div className={`${css.viewItem} ${isHideEmptyColumns ? css.fullView : css.compactView}`}
                                     onClick={handleHideEmptyColumns}>
                                    <span>Ẩn cột trống</span>
                                </div>

                                <div className={`${css.viewItem} ${isShowAll1 ? css.fullView : css.compactView}`}
                                     onClick={handleIsShowAll1}>
                                    <span>Ẩn dòng trống</span>
                                </div>
                                {/*<div className={`navbar-item ${isNoteVisible ? 'note-visible' : 'note-unvisible'}`}*/}
                                {/*    onClick={toggleNoteVisibility}*/}
                                {/*>*/}
                                {/*    <img className="noteIcon" src={NoteIcon}/>*/}
                                {/*    <span className="maginRight">Note</span>*/}
                                {/*</div>*/}
                                <div className={`${css.viewItem} ${css.selectItem}`}>
                                    <img src={TimeSymbolIcon}/>
                                    <select
                                        className={css.selectContent}
                                        value={selectedMonth}
                                        onChange={handleSelectedMonthChange}
                                    >
                                        {Array.from({length: currentMonth}, (_, index) => (
                                            <option key={index + 1} value={index + 1}>
                                                Tháng {index + 1}
                                            </option>
                                        ))}
                                        <option value={0}>Luỹ kế năm</option>
                                    </select>
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
                    <div style={{display: 'flex' , gap : 20}}>
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
                                            animateRows={true}
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
                        <div style={{height: '76vh'}}>{isNoteVisible &&
                            <NoteComponent type={noteType} onClose={() => setNoteVisible(false)}/>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
