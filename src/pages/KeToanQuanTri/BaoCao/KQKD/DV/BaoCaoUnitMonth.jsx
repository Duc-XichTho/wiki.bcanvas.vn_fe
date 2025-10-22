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
import '../../../../Home/AgridTable/agComponent.css';
import css from "../../../BaoCao/BaoCao.module.css";

import {Color} from '../../Color.js';
import {calculateData, calculateDataView2} from '../logicKQKD.js';
// import {createSectionData, createSeries} from "../../FinanceDashboard/BI/chartSetUp/setUpChart.js";
// import {sumColumns} from "../../FinanceDashboard/BI/chartSetUp/setUpSection.js";
// import PhanTichNote from "../../../../../B-Canvas/PhanTichNote/PhanTichNote.jsx";
import {calculateData3} from "../logicKQKDKieuC.js";
import {MyContext} from "../../../../../MyContext.jsx";
import {getItemFromIndexedDB2, setItemInIndexedDB2} from "../../../storage/storageService.js";
import {getAllUnits} from "../../../../../apisKTQT/unitService.jsx";
import {getAllKmf} from "../../../../../apisKTQT/kmfService.jsx";
import PopupCellActionBCKD from "../../../popUp/cellAction/PopUpCellActionBCKD.jsx";
import {ChartOpen, DisableChart, EllipsisIcon} from "../../../../../icon/IconSVG.js";
import AG_GRID_LOCALE_VN from "../../../../Home/AgridTable/locale.jsx";
import ActionSelectTypeBaoCao from "../../../ActionButton/ActionSelectTypeBaoCao.jsx";
import ActionHideEmptyRows from "../../../ActionButton/ActionHideEmptyRows.jsx";
import ActionSelectDanhMucBaoCao from "../../../ActionButton/ActionSelectDanhMucBaoCao.jsx";
import ExportableGrid from "../../../popUp/exportFile/ExportableGrid.jsx";
import ActionToggleSwitch from "../../../ActionButton/ActionToggleSwitch.jsx";
import ActionToggleSwitch2 from "../../../ActionButton/ActionToggleSwitch2.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoUnitMonth() {
    const table = 'BaoCaoUnitMonth';
    const {isNotePadBaoCao, loadDataSoKeToan, currentYearKTQT, selectedCompany} = useContext(MyContext);
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    let [chartOptions, setChartOptions] = useState({})
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [listUnit, setListUnit] = useState([]);

    const tableStatusButton = 'BaoCaoUnitMonthStatusButton';
    const [isShowView, setShowView] = useState(null);
    const [isShowView2, setShowView2] = useState(null);
    const [isShowView3, setShowView3] = useState(null);
    const [isShowAll1, setShowAll1] = useState(null);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(null);
    const [isHideChart, setIsHideChart] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            setIsHideChart(settings?.isHideChart ?? false)
            setShowAll1(settings?.isShowAll1 ?? true);
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? true);
            setShowView(settings?.isShowView ?? false);
            setShowView2(settings?.isShowView2 ?? true);
            setShowView3(settings?.isShowView3 ?? false);
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                isShowView,
                isShowView2,
                isShowView3,
                isShowAll1,
                isHideEmptyColumns,
                isHideChart,
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowView,
        isShowView2,
        isShowView3,
        isShowAll1,
        isHideEmptyColumns,
        isHideChart,]);

    function isBold(params) {
        const isBold = params.data.layer.toString()?.includes('.');
        return {
            textAlign: 'left', paddingRight: 10,
        };
    }


    const handleClickView = () => {
        setShowView(true);
        setShowView2(false);
        setShowView3(false);
    };

    const handleClickView2 = () => {
        setShowView2(true);
        setShowView(false);
        setShowView3(false);
    };
    const handleClickView3 = () => {
        setShowView3(true);
        setShowView(false);
        setShowView2(false);
    };

    const handleIsShowAll1 = () => {
        setShowAll1((prevIsShowAll1) => {
            setHideEmptyColumns(!prevIsShowAll1);
            return !prevIsShowAll1;
        });
    };

    const toggleSwitch = () => {
        handleIsShowAll1()
    }

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleHideChart = () => {
        setIsHideChart((prev) => !prev);
    };


    const statusBar = useMemo(() => {
        return {
            statusPanels: [{statusPanel: 'agAggregationComponent'}],
        };
    }, []);
    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            cellStyle: {
                fontSize: '14.5px',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-family)',
            },
            width: 140,
            suppressMenu: true
        };
    });

    async function prepareData() {
        setLoading(true);
        let data = await loadDataSoKeToan();
        data = data.filter(e => currentYearKTQT == 'toan-bo' || e.year == currentYearKTQT);
        data = data.filter((e) => e.consol?.toLowerCase() == 'consol');
        let units = await getAllUnits();
        setListUnit(units)
        units = units.filter(e => !e.group?.includes('Internal'))

        if (!selectedUnit) setSelectedUnit(units[0]?.group)
        let kmfList = await getAllKmf();
        kmfList = kmfList.reduce((acc, current) => {
            if (!acc.find((unit) => unit.name === current.name)) {
                acc.push(current);
            }
            return acc;
        }, []);
        let rowData = [];
        if (isShowView3) rowData = calculateData3(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams');
        if (isShowView2) rowData = calculateDataView2(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams')
        if (isShowView) rowData = calculateData(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams')
        let newRowData = rowData
        if (isShowAll1) {
            newRowData = newRowData.filter((item) => {
                if ((item[`${selectedUnit}_${0}`] !== 0 && item[`${selectedUnit}_${0}`]) || !item.layer.includes('.')) {
                    return true;
                }
                return false;
            });
        }
        setRowData(newRowData);
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }

    const onGridReady = useCallback(async () => {
        prepareData();
    }, [selectedCompany, currentYearKTQT]);

    useEffect(() => {
        prepareData();
    }, [isShowAll1, selectedUnit, isShowView, isShowView2, isShowView3, selectedCompany, currentYearKTQT]);

    const rendHeader = (teamKey) => {
        const parts = teamKey.split('_');
        if (parts[1] == '0') {
            return 'Lũy kế năm';
        }
        let header = 'Tháng ' + parts[1] || 'Khác';
        return `${header}`;
    };

    function createField(field , hide) {
        return {
            field: field,
            headerName: rendHeader(field),
            headerClass: 'right-align-business-name',
            cellStyle: (params) => {
                return {...isBold(params), textAlign: 'right'}
            },
            cellRenderer: (params) => {
                return (
                    <div className="cell-action-group">
                        <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'NDV'}
                                             view={isShowView2} currentYear={currentYearKTQT}/>
                    </div>
                );
            },
            ...Color(),
            ...hide

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
                cellStyle: isBold
            },
            {
                field: 'code',
                headerName: 'Code',
                width: 60,
                pinned: 'left',
                ...Color(),
                cellStyle: isBold
            },
            ...(await renderFieldMoney()),
        ];
        return fields;
    }

    async function renderFieldMoney() {
        const teamFields = [];
        for (let y = 0; y <= 12; y++) {
            let hide = false;
            const fieldName = `${selectedUnit}_${y}`;
            if (isHideEmptyColumns) {
                const isAllZero = rowData.every((record) => record[fieldName] === 0);
                if (isAllZero) {
                    hide = true;
                }
            }
            teamFields.push({
                ...createField(fieldName, {hide}),
            });
        }
        return teamFields;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setColDefs(await redenderFields());
            } catch (error) {
                console.log(error);
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, selectedUnit, isHideEmptyColumns]);

    const handlers = {
        A: () => {
            handleClickView()
        },
        B: () => {
            handleClickView2()
        },
        C: () => {
            handleClickView3()
        },
    };

    const options = [
        {value: 'A', label: 'Nhóm theo bản chất biến phí, định phí', used: isShowView},
        {value: 'B', label: 'Nhóm khoản mục KQKD dựa theo TK kế toán', used: isShowView2},
        // { value: 'C', label: 'Nhóm theo dạng trực tiếp, phân bổ' ,  used : isShowView3},
    ];

    const handleUnitChange = (value) => {
        setSelectedUnit(value);
    };


    return (
        <>
            <div style={{display: 'flex'}}>
                <div style={{width: isNotePadBaoCao ? "80%" : "100%"}}>
                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>Báo cáo KQKD nhóm Đơn vị theo tháng</span>
                            <p> <img src="/Group%20197.png" alt="Đơn vị: VND" style={{ width: '130px', marginLeft: '3px' }} /></p>
                            <div className={css.toogleChange}>
                                <ActionToggleSwitch2 label="Ẩn dữ liệu trống" isChecked={isShowAll1 && isHideEmptyColumns}
                                                     onChange={toggleSwitch}/>                            </div>
                        </div>

                        <div className={css.headerAction}>
                            <ActionSelectTypeBaoCao options={options} handlers={handlers} />
                            <ActionSelectDanhMucBaoCao selectedUnit={selectedUnit} listUnit={listUnit} handlers={handleUnitChange}  />

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
                    <div
                        style={{
                            height: '85vh',
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
                                <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>
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
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
