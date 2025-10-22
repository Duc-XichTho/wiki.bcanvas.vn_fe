import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function

import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import '../../../../Home/AgridTable/agComponent.css'
// Component
import { getAllUnits } from '../../../../../apisKTQT/unitService.jsx';
import { EllipsisIcon, } from '../../../../../icon/IconSVG.js';
import { calculateDataTeam } from '../logicKQKD2.js';
import { getAllTeam } from '../../../../../apisKTQT/teamService.jsx';
import { getAllKmf } from '../../../../../apisKTQT/kmfService.jsx';
import { MyContext } from '../../../../../MyContext.jsx';
import css from "../../BaoCao.module.css";
import { onFilterTextBoxChanged } from "../../../../../generalFunction/quickFilter.js";
import { formatCurrency } from "../../../functionKTQT/formatMoney.js";
import { formatUnitDisplay } from "../../../functionKTQT/formatUnitDisplay.js";
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from "../../../storage/storageService.js";
import { loadColumnState, saveColumnStateToLocalStorage } from "../../../functionKTQT/coloumnState.jsx";
import AG_GRID_LOCALE_VN from "../../../../Home/AgridTable/locale.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoPBT() {
    const table = 'BaoCaoPBT';
    const tableCol = 'BCPBTCol';
    const key = 'KQKD_Team';
    const { currentMonthKTQT, listSoKeToan, loadDataSoKeToan, listCompany, currentYearKTQT, unitDisplay } = useContext(MyContext);
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [units, setUnits] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filteredUnits, setFilteredUnits] = useState([]); // Để lưu trữ các đơn vị được lọc theo company
    const dropdownRef = useRef(null);
    const [selectedUnit, setSelectedUnit] = useState('');

    const [isShowAll1, setShowAll1] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isFullView, setIsFullView] = useState(false);
    console.log(selectedCompany)
    console.log(listCompany)

    useEffect(() => {
        setSelectedCompany(listCompany[0].code)
    }, [listCompany]);
    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    useEffect(() => {
        const fetchUnits = async () => {
            let allUnits = await getAllUnits();
            const filtered = allUnits.filter((unit) => unit.company === selectedCompany);
            setFilteredUnits(filtered);
            if (filtered.length > 0) {
                setSelectedUnit(filtered[0].name);
            }
        };

        fetchUnits();
    }, [selectedCompany]);

    const statusBar = useMemo(() => {
        return {
            statusPanels: [{ statusPanel: 'agAggregationComponent' }],
        };
    }, []);
    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            cellStyle: { fontSize: '14.5px' },
            width: 120,
        };
    });

    async function prepareData() {
        setLoading(true);
        let data = await loadDataSoKeToan();
        data = data.filter(e => e.year == currentYearKTQT);
        let kmfList = await getAllKmf();
        let teamListDB = await getAllTeam();
        kmfList = kmfList.reduce((acc, current) => {
            if (!acc.find((unit) => unit.name === current.name)) {
                acc.push(current);
            }
            return acc;
        }, []);
        data = data.filter((e) => e.consol?.toLowerCase() == 'consol' && e.company === selectedCompany && e.unit_code === selectedUnit);
        let result = calculateDataTeam(data, kmfList, currentMonthKTQT, teamListDB);
        if (isShowAll1) {
            result = result.filter((item) => {
                for (let i = 0; i <= 12; i++) {
                    if ((item[i] && item[i] != 0) || !item.layer.includes('.')) {
                        return true;
                    }
                }
                return false;
            });
        }
        await setItemInIndexedDB2(key, result);
        setRowData(result);
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }

    const onGridReady = useCallback(async () => {
        prepareData();
    }, []);
    useEffect(() => {
        prepareData();
    }, [selectedCompany, isShowAll1, selectedUnit, currentYearKTQT]);
    const rendHeader = (suffix) => {
        if (suffix == 0) return currentYearKTQT;
        return `Tháng ${suffix}`;
    };

    function createField(field, hide) {
        return {
            ...hide,
            field: field,
            headerName: rendHeader(field),
            headerClass: 'right-align-important',
            cellStyle: {
                textAlign: 'right',
            },
            width: 110,
            cellClassRules: {
                'bold-header': (params) => {
                    return params.data.layer?.toString().split('.').length == 1;
                },
                'normal-header': (params) => {
                    return params.data.layer?.toString().split('.').length > 1;
                },
            },
            valueFormatter: (params) => formatUnitDisplay(params.value, unitDisplay),
        };
    }

    function redenderFields() {
        let fields = [
            {
                field: 'dp',
                headerName: '',
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
            {
                field: 'change',
                width: 130,
                columnGroupShow: 'open',
                headerClass: 'right-align-important',
                headerName: `Sparkline T1 - T${currentMonthKTQT}`,
                cellRenderer: 'agSparklineCellRenderer',
                cellRendererParams: {
                    sparklineOptions: {
                        type: 'area',
                        tooltip: {
                            renderer: (params) => {
                                const { yValue, xValue } = params;
                                return {
                                    content: formatUnitDisplay(yValue, unitDisplay),
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
            ...renderFieldMoney(),
        ];
        return fields;
    }

    function renderFieldMoney() {
        const teamFields = [];
        teamFields.push({
            ...createField(`0`),
        });

        for (let y = 1; y <= 12; y++) {
            const fieldName = `${y}`;
            let hide = false;
            if (!isFullView) {
                if (!(y >= currentMonthKTQT - 2 && y <= currentMonthKTQT)) {
                    hide = true;
                }
            }
            teamFields.push({
                ...createField(fieldName, { hide }),
            });
        }
        return teamFields;
    }

    useEffect(() => {
        setSidebarVisible(false);
        const fetchData = async () => {
            let updatedColDefs = redenderFields()
            const savedColumnState = await getItemFromIndexedDB2(tableCol);
            if (savedColumnState.length) {
                setColDefs(loadColumnState(updatedColDefs, savedColumnState));
            } else {
                const simplifiedColumnState = updatedColDefs.map(({ field, pinned, width, hide }) => ({
                    colId: field,
                    pinned,
                    width,
                    hide,
                }));
                await setItemInIndexedDB2(tableCol, simplifiedColumnState);
                setColDefs(updatedColDefs);
            }
            ;
        };
        fetchData();
    }, [isFullView, currentMonthKTQT, currentYearKTQT]);

    const [isNoteVisible, setNoteVisible] = useState(false); // State to manage note visibility

    const noteType = `KQKD-Team-${selectedCompany === '' ? units[0]?.code : selectedCompany}`; // Construct the type based on selectedCompany\

    const handleIsShowAll1 = () => {
        setShowAll1(!isShowAll1);
    };
    return (
        <>
            <div style={{ display: 'flex' }}>
                <div style={{ flex: 1, height: '90%' }}>
                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>Báo cáo KQKD Nhóm</span>
                            <img src="/Group%20197.png" alt="Đơn vị: VND" style={{ width: '130px', marginLeft: '3px' }} />
                        </div>
                        <div className={css.headerAction}>
                            <div className={`${css.viewItem} ${css.selectItem}`}>
                                <select
                                    className={css.selectContent}
                                    value={selectedCompany}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                >
                                    {listCompany.map((unit) => (
                                        <option key={unit.code} value={unit.code}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={`${css.viewItem} ${css.selectItem}`}>
                                <select
                                    className={css.selectContent}
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                >
                                    {filteredUnits.map((unit) => (
                                        <option key={unit.code} value={unit.name}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={`${css.viewItem} ${isShowAll1 ? css.fullView : css.compactView}`}
                                onClick={handleIsShowAll1}>
                                <span>Ẩn dòng trống</span>
                            </div>
                            <div className={`${css.viewItem} ${isFullView ? css.fullView : css.compactView}`}
                                onClick={() => setIsFullView(true)}>
                                <span>Đầy đủ</span>
                            </div>

                            <div className={`${css.viewItem} ${!isFullView ? css.fullView : css.compactView}`}
                                onClick={() => setIsFullView(false)}>
                                <span>Rút gọn</span>
                            </div>

                            <div className="navbar-item" ref={dropdownRef}>
                                {/* <img
                                    src={EllipsisIcon}
                                    style={{ width: 32, height: 32, cursor: 'pointer' }}
                                    alt="Ellipsis Icon"
                                    onClick={handleDropdownToggle}
                                /> */}
                                {/*{isDropdownOpen && (*/}
                                {/*    <div className="dropdown-menu-button1">*/}
                                {/*        <ExportableGrid*/}
                                {/*            api={gridRef.current ? gridRef.current.api : null}*/}
                                {/*            columnApi={gridRef.current ? gridRef.current.columnApi : null}*/}
                                {/*            table={table}*/}
                                {/*            isDropdownOpen={isDropdownOpen}*/}
                                {/*        />*/}
                                {/*    </div>*/}
                                {/*)}*/}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1 }}>
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
                                        <img src='/loading_moi_2.svg' alt="Loading..."
                                            style={{ width: '650px', height: '550px' }} />
                                    </div>
                                )}
                                <div className="ag-theme-quartz">
                                    <div style={{ flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s' }}>
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
                                            domLayout={'autoHeight'}
                                            onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                                            onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                                        />
                                    </div>
                                    {/*{isSidebarVisible &&*/}
                                    {/*    <AnalysisSideBar table={table + ` - ${team}`} gridRef={gridRef}/>}*/}
                                </div>
                            </div>
                        </div>
                        <div style={{ height: '76vh' }}>
                            {/*{isNoteVisible &&*/}
                            {/*    <NoteComponent type={noteType}*/}
                            {/*    />*/}
                            {/*}*/}
                        </div>
                    </div>
                </div>
                <div className={css.phantich}>
                    {/*<PhanTichNote table={table}/>*/}
                </div>
            </div>
        </>
    )
        ;
}
