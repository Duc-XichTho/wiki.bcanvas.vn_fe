import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
// Ag Grid Function
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import '../../../../Home/AgridTable/agComponent.css';
import css from '../../../BaoCao/BaoCao.module.css';

import { Color } from '../../Color.js';
import { calculateData, calculateDataView2 } from '../logicKQKD.js';
import { calculateData3 } from '../logicKQKDKieuC.js';
import { MyContext } from '../../../../../MyContext.jsx';
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from '../../../storage/storageService.js';
import { getAllUnits } from '../../../../../apisKTQT/unitService.jsx';
import { getAllKmf } from '../../../../../apisKTQT/kmfService.jsx';
import PopupCellActionBCKD from '../../../popUp/cellAction/PopUpCellActionBCKD.jsx';
import AG_GRID_LOCALE_VN from '../../../../Home/AgridTable/locale.jsx';
import ActionSelectTypeBaoCao from '../../../ActionButton/ActionSelectTypeBaoCao.jsx';
import ActionSelectDanhMucBaoCao from '../../../ActionButton/ActionSelectDanhMucBaoCao.jsx';
import ActionSelectUnitDisplay from '../../../ActionButton/ActionSelectUnitDisplay.jsx';
import ActionSelectMonthBaoCao from '../../../ActionButton/ActionSelectMonthBaoCao.jsx';
import ExportableGrid from '../../../popUp/exportFile/ExportableGrid.jsx';
import { getAllSettingGroup } from '../../../../../apisKTQT/settingGroupService.jsx';
import { getAllSoKeToan } from '../../../../../apisKTQT/soketoanService.jsx';
import ActionMenuDropdown from '../../../ActionButton/ActionMenuDropdown.jsx';
import Loading3DTower from '../../../../../components/Loading3DTower.jsx';
import { baoCaoGroupMonthCacheService } from '../../../../../services/index.js';
import KQKDTimeWaterfallCharts from '../../../../KeToanQuanTri/components/KQKDTimeWaterfallCharts.jsx';
import { formatUnitDisplay } from '../../../functionKTQT/formatUnitDisplay.js';
import { getSettingByType } from '../../../../../apis/settingService.jsx';
import ActionModalButton from '../../../ActionButton/ActionModalButton.jsx';
import AnalysisModalGroupUnit from '../../../components/AnalysisModalGroupUnit.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoGroupMonth() {
    const table = 'BaoCaoGroupMonth';
    const {isNotePadBaoCao, loadDataSoKeToan, currentYearKTQT, selectedCompany, currentCompanyKTQT, unitDisplay, currentUser} = useContext(MyContext);
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [chartColors, setChartColors] = useState([]);
    let [chartOptions, setChartOptions] = useState({})
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [listUnit, setListUnit] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(0);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const tableStatusButton = 'BCGroupMonthStatusButton';
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
            setSelectedUnit(settings?.selectedUnit ?? null);

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
                selectedUnit
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [
        isShowView,
        isShowView2,
        isShowView3,
        isShowAll1,
        isHideEmptyColumns,
        isHideChart,
        selectedUnit
    ]);

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

    const handleRefreshData = async () => {
        setIsRefreshing(true);
        try {
            const cacheParams = { type: 'BaoCaoGroupMonth', currentYearKTQT, currentCompanyKTQT };
            await baoCaoGroupMonthCacheService.deleteCache(cacheParams);
            await prepareData(true);
        } catch (e) {
            console.error('BaoCaoGroupMonth refresh error:', e);
        } finally {
            setIsRefreshing(false);
        }
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

    async function prepareData(reload = false) {
        setLoading(true);

        const cacheParams = { type: 'BaoCaoGroupMonth', currentYearKTQT, currentCompanyKTQT };

        if (!reload) {
            const cached = await baoCaoGroupMonthCacheService.getCache(cacheParams);
            if (cached && cached.rowData) {
                setRowData(cached.rowData);
                setListUnit(cached.listUnit || listUnit);
                setTimeout(() => setLoading(false), 100);
                return;
            }
        }
        let data = await getAllSoKeToan();
        data = data.filter((e) => e.isUse && e.daHopNhat);
        if (currentCompanyKTQT.toLowerCase() === 'hq') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
        else data = data.filter((e) => e.company?.toLowerCase() === currentCompanyKTQT?.toLowerCase());
        data = data.filter(e => currentYearKTQT == 'toan-bo' || e.year == currentYearKTQT);
        let units = await getAllUnits();
        const value = await getAllSettingGroup()
        let groupSettingList = value.filter(e => e?.type == 'unit');
        units.forEach(e => {
            if (e.group) {
                let group = groupSettingList.find((g) => e.group === g.name);
                if (group) e.group = group.stt + '-' + e.group
                else e.group = 1 + '-' + e.group
            }
        })
        // units = setPermissionsListUnit(units, currentUser)
        setListUnit(units)
        units = units.filter(e => !e.group?.includes('Internal'))
        
        // Lấy danh sách groups để truyền cho AI analysis
        const uniqueGroups = [...new Set(units.map((unit) => unit.group))].filter(Boolean);

        // if (!selectedUnit) setSelectedUnit(null)
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
        let rowData = [];
        if (isShowView3) rowData = calculateData3(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams');
        if (isShowView2) rowData = calculateDataView2(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams')
        if (isShowView) rowData = calculateData(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams')
        let newRowData = rowData.map((row) => {
            let newRow = {...row};
            uniqueGroups.forEach((group) => {
                const groupSums = sumGroupColumns(row, group, uniqueUnits);
                newRow = {...newRow, ...groupSums};
            });
            return newRow;
        });
        if (isShowAll1) {
            newRowData = newRowData.filter((item) => {
                if ((item[`${selectedUnit}_${0}`] !== 0 && item[`${selectedUnit}_${0}`]) || !item.layer.includes('.')) {
                    return true;
                }
                return false;
            });
        }
        setRowData(newRowData);

        try {
            await baoCaoGroupMonthCacheService.setCache(cacheParams, { rowData: newRowData, listUnit: units });
        } catch (e) { console.error(e); }

        setTimeout(() => {
            setLoading(false);
        }, 500);

    }

    function sumGroupColumns(row, group, units) {
        let result = {};
        for (let i = 0; i <= 12; i++) {
            let sum = 0;
            units.forEach((unit) => {
                if (unit.group === group) {
                    const columnName = `${unit.code}_${i}`;
                    sum += row[columnName] || 0;
                }
            });
            result[`${group}_${i}`] = sum;
        }
        return result;
    }

    const onGridReady = useCallback(async () => {
        prepareData();
    }, [selectedCompany, currentYearKTQT]);

    useEffect(() => {
        (async () => {
            try {
                const colorSetting = await getSettingByType('SettingColor');
                if (colorSetting && colorSetting.setting && Array.isArray(colorSetting.setting)) {
                    const colors = colorSetting.setting.map(item => item.color).filter(Boolean);
                    if (colors.length) setChartColors(colors);
                }
            } catch (e) {
                console.error('Error loading chart colors:', e);
            }
        })();
    }, []);

    useEffect(() => {
        prepareData();
    }, [isShowAll1, selectedUnit, isShowView, isShowView2, isShowView3, selectedCompany, currentYearKTQT, currentCompanyKTQT, selectedMonth]);

    const rendHeader = (teamKey) => {
        const parts = teamKey.split('_');
        if (parts[1] == '0') {
            return 'Lũy kế năm';
        }
        let header = 'Tháng ' + parts[1] || 'Khác';
        return `${header}`;
    };

    function createField(field , hide) {
        const parts = field.split('_');
        const isLuyKeNam = parts[1] == '0';
        
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
                        <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'NDV2'}
                                             view={isShowView2} currentYear={currentYearKTQT}
                                             plType={isShowView2 ? params.data.code : null}/>
                    </div>
                );
            },
            ...Color(),
            ...(isLuyKeNam && { pinned: 'left' }),
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
        // Push Lũy kế năm first
        teamFields.push({
            ...createField(`${selectedUnit}_0`, {hide: false}),
        });

        // Sparkline column next to Lũy kế năm showing monthly trend
        teamFields.push({
            field: 'spark',
            width: 140,
            headerClass: 'right-align-business-name',
            headerName: `Sparkline T1 - T12`,
            cellRenderer: 'agSparklineCellRenderer',
            pinned: 'left',
            valueGetter: (params) => {
                const values = [];
                for (let i = 1; i <= 12; i++) {
                    const v = params.data?.[`${selectedUnit}_${i}`];
                    let numValue = v === null || v === undefined || isNaN(v) ? 0 : Number(v);
                    // Reverse sign for CF or Chi phí
                    if (params.data.dp && (params.data.dp.includes('CF') || params.data.dp.includes('Chi phí'))) {
                        numValue = -numValue;
                    }
                    values.push(numValue);
                }
                return values;
            },
            cellRendererParams: {
                sparklineOptions: {
                    type: 'area',
                    tooltip: {
                        renderer: (p) => {
                            const { yValue } = p;
                            return { content: (yValue || 0).toLocaleString(), fontSize: '12px' };
                        },
                    },
                    fill: chartColors[0] ? `${chartColors[0]}20` : 'rgba(174,211,191,0.59)',
                    line: { stroke: chartColors[0] || '#4ca171', strokeWidth: 1 },
                    marker: { enabled: false },
                },
            },
            ...Color(),
            cellStyle: isBold,
        });

        // Push remaining months
        for (let y = 1; y <= 12; y++) {
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

    const handleSelectedMonthChange = (e) => {
        setSelectedMonth(Number(e));
    };

    const handleOpenAnalysisModal = () => {
        setIsAnalysisModalOpen(true);
    };

    const handleCloseAnalysisModal = () => {
        setIsAnalysisModalOpen(false);
    };

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const items = [
        {
            key: '0',
            label: (
                <span>{isShowAll1 && isHideEmptyColumns ? '✅ Bật ẩn dữ liệu trống' : '❌ Tắt ẩn dữ liệu trống'}</span>

            ),
            onClick: toggleSwitch,
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
            <div style={{display: 'flex'}}>
                <div style={{width: isNotePadBaoCao ? "80%" : "100%"}}>
                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>Báo cáo KQKD nhóm Đơn vị theo tháng</span>
                        </div>

                    </div>
                    <div className={css.headerPowersheet2}>
                        <ActionSelectUnitDisplay />
                        {/*<div className={css.toogleChange}>*/}
                        {/*    <ActionToggleSwitch2 label="Ẩn dữ liệu trống" isChecked={isShowAll1 && isHideEmptyColumns}*/}
                        {/*                         onChange={toggleSwitch}/>*/}
                        {/*</div>*/}
                        <div className={css.headerAction}>
                            <button
                                onClick={handleRefreshData}
                                disabled={isRefreshing}
                                style={{
                                    padding: '5px 12px',
                                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    background: '#fff',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '16px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    marginRight: 8,
                                }}
                                title={isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
                            >
                                {isRefreshing ? '⏳' : '🔄'} {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
                            </button>
                            <ActionSelectTypeBaoCao options={options} handlers={handlers} />
                            <ActionModalButton 
                                onClick={handleOpenAnalysisModal}
                                title="Phân tích AI"
                            />
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
                        <ActionMenuDropdown popoverContent={popoverContent}
                                            dropdownOpen={dropdownOpen}
                                            setDropdownOpen={setDropdownOpen}
                        />
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
                            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 5}}>
                                <Loading3DTower/>
                            </div>
                        )}
                        <KQKDTimeWaterfallCharts
                            rowData={rowData}
                            selectedMonth={selectedMonth}
                            unitDisplay={unitDisplay}
                            formatUnitDisplay={formatUnitDisplay}
                            selectedUnit={selectedUnit}
                        />
                        <div className="ag-theme-quartz"
                             style={{height: '70vh', width: '100%', display: 'flex'}}>
                            <div style={{height: '70vh',flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s'}}>
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
                        </div>
                    </div>
                    {
                        isNotePadBaoCao &&
                        <div className={css.phantich}>
                        </div>
                    }
                </div>
            </div>
            
            <AnalysisModalGroupUnit
                visible={isAnalysisModalOpen}
                onClose={handleCloseAnalysisModal}
                rowData={rowData}
                groups={[...new Set(listUnit.map(unit => unit.group).filter(Boolean))]}
                currentYearKTQT={currentYearKTQT}
                currentCompanyKTQT={currentCompanyKTQT}
                currentUser={currentUser}
                reportType="GroupMonth"
            />
        </>
    );
}
