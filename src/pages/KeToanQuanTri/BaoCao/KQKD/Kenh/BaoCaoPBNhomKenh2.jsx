'use strict';
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
import '../../../../Home/AgridTable/agComponent.css';
// Component
import { getAllKmf } from '../../../../../apisKTQT/kmfService.jsx';
import { calculateData, calculateDataView2 } from '../logicKQKD.js';
import { Color } from '../../Color.js';
import css from '../../BaoCao.module.css';
import { MyContext } from '../../../../../MyContext.jsx';
import { loadColumnState, saveColumnStateToLocalStorage } from '../../../functionKTQT/coloumnState.jsx';
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from '../../../storage/storageService.js';
import PopupCellActionBCKD from '../../../popUp/cellAction/PopUpCellActionBCKD.jsx';
import AG_GRID_LOCALE_VN from '../../../../Home/AgridTable/locale.jsx';
import { sumColumns } from '../../../functionKTQT/chartSetUp/setUpSection.js';
import { createSectionData, createSeries } from '../../../functionKTQT/chartSetUp/setUpChart.js';
import { getAllKenh } from '../../../../../apisKTQT/kenhService.jsx';
import ActionSelectTypeBaoCao from '../../../ActionButton/ActionSelectTypeBaoCao.jsx';
import ActionSelectDanhMucBaoCao from '../../../ActionButton/ActionSelectDanhMucBaoCao.jsx';
import ActionSelectUnitDisplay from '../../../ActionButton/ActionSelectUnitDisplay.jsx';
import ActionMenuDropdown from '../../../ActionButton/ActionMenuDropdown.jsx';
import KQKDTimeWaterfallCharts from '../../../../KeToanQuanTri/components/KQKDTimeWaterfallCharts.jsx';
import { formatUnitDisplay } from '../../../functionKTQT/formatUnitDisplay.js';
import { getSettingByType } from '../../../../../apis/settingService.jsx';
import { getAllSoKeToan } from '../../../../../apisKTQT/soketoanService.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoPBNhomKenh2({company}) {
    const table = 'BaoCaoPBNhomKenh2';
    const tableCol = 'BaoCaoPBNhomKenh2Col';
    const {currentMonthKTQT, loadDataSoKeToan, currentYearKTQT, currentCompanyKTQT} = useContext(MyContext);
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [chartColors, setChartColors] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [listUnit, setListUnit] = useState([]);
    let [chartOptions, setChartOptions] = useState({})
    const tableStatusButton = 'BaoCaoPBNhomKenh2StatusButton';
    const [isShowView, setShowView] = useState(false);
    const [isShowView2, setShowView2] = useState(false);
    const [isShowAll1, setShowAll1] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [isHideChart, setIsHideChart] = useState(false);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            setShowAll1(settings?.isShowAll1 ?? false);
            setShowView(settings?.isShowView ?? false);
            setShowView2(settings?.isShowView2 ?? true);
            setSelectedUnit(settings?.selectedUnit ?? null);
            setIsHideChart(settings?.isHideChart ?? false);
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? false);
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                isShowView,
                isShowView2,
                isShowAll1,
                selectedUnit,
                isHideChart,
                isHideEmptyColumns,
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowView, isShowView2, isShowAll1, selectedUnit, isHideChart, isHideEmptyColumns,
    ]);

    const handleClickView = () => {
        setShowView((prev) => !prev);
        setShowView2(false);
    };

    const handleClickView2 = () => {
        setShowView2((prev) => !prev);
        setShowView(false);
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

    const statusBar = useMemo(() => {
        return {
            statusPanels: [{statusPanel: 'agAggregationComponent'}],
        };
    }, []);
    const defaultColDef = useMemo(() => {
        return {
            editable: false, filter: true, cellStyle: {fontSize: '14.5px'}, width: 150,
        };
    });

    async function prepareData(reload = false) {
        let units = await getAllKenh();
        const uniqueUnits = units.reduce((acc, current) => {
            if (!acc.find((unit) => unit.code === current.code)) {
                acc.push(current);
            }
            return acc;
        }, []);
        setListUnit(uniqueUnits)
        // if (!selectedUnit) setSelectedUnit(units[0]?.group)
        let rowData = []
        setLoading(true);
        let data = await getAllSoKeToan();
        data = data.filter((e) => e.isUse && e.daHopNhat);
        if (currentCompanyKTQT.toLowerCase() === 'hq') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
        else data = data.filter((e) => e.company?.toLowerCase() === currentCompanyKTQT?.toLowerCase());
        data = data.filter(e => currentYearKTQT === 'toan-bo' || e.year == currentYearKTQT);
        const uniqueGroups = [...new Set(units.map((unit) => unit.group))];
        let kmfList = await getAllKmf();
        kmfList = kmfList.reduce((acc, current) => {
            if (!acc.find((unit) => unit.name === current.name)) {
                acc.push(current);
            }
            return acc;
        }, []);
        rowData = isShowView2
            ? calculateDataView2(data, uniqueUnits, kmfList, 'code', 'kenh2', 'PBKENH', 'teams')
            : calculateData(data, uniqueUnits, kmfList, 'code', 'kenh2', 'PBKENH', 'teams');
        rowData = rowData.map((row) => {
            let newRow = {...row};
            uniqueGroups.forEach((group) => {
                const groupSums = sumGroupColumns(row, group, uniqueUnits);
                newRow = {...newRow, ...groupSums};
            });
            return newRow;
        });
        rowData.forEach((row) => {
            row[`change`] = []
            for (let i = 1; i <= 12; i++) {
                let key = `${selectedUnit}_${i}`;
                if (row.dp.toLowerCase().includes('doanh thu') || row.dp.toLowerCase().includes('lãi') || row.dp.toLowerCase().includes('lợi nhuận')) row[`change`].push(row[key])
                else row[`change`].push(-row[key])
            }
        })
        if (isShowAll1) {
            rowData = rowData.filter((item) => {
                if (item.layer.includes('.')) {
                    let shouldKeepItem = false;
                    for (let j = 1; j <= 12; j++) {
                        if (item[`${selectedUnit}_${j}`] != 0) {
                            shouldKeepItem = true;
                            break;
                        }
                    }
                    return shouldKeepItem;
                }
                return true;
            });
        }
        setRowData(rowData)
        let dataChart = loadDataChart(rowData)
        setChartOptions(dataChart)
        if (selectedUnit) {
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
    }

    function loadDataChart(data) {
        data = data.filter(e => !e.layer.includes('.'));
        let doanhThuList = data.filter(e => e.dp.toLowerCase().startsWith('doanh thu'));
        let loiNhuanList = data.filter(e => e.dp.toLowerCase().startsWith('lãi lỗ ròng'));
        let chiPhiList = data.filter(e => e.dp.toLowerCase().startsWith('cf') || e.dp.toLowerCase().startsWith('chi phí') || e.dp.toLowerCase().startsWith('giá vốn'));
        let doanhThuData = sumColumns(doanhThuList);
        doanhThuData = convertToArrayForSection(doanhThuData, currentMonthKTQT);
        let chiPhiData = sumColumns(chiPhiList);
        chiPhiData = convertToArrayForSectionCF(chiPhiData, currentMonthKTQT);
        let loiNhuanData = sumColumns(loiNhuanList);
        loiNhuanData = convertToArrayForSection(loiNhuanData, currentMonthKTQT);
        let series = createSeries('month', 'th', 'Tiền', 'line');
        let doanhThu = createSectionData('C1-Doanh thu tổng - TH-KH-CK', doanhThuData, [series], 'Doanh thu', null, {enabled: false,})
        let chiPhi = createSectionData('C1-Doanh thu tổng - TH-KH-CK', chiPhiData, [series], 'Chi phí', null, {enabled: false,})
        let loiNhuan = createSectionData('C1-Doanh thu tổng - TH-KH-CK', loiNhuanData, [series], 'Lợi nhuận', null, {enabled: false,})
        return {
            doanhThu,
            chiPhi,
            loiNhuan
        }
    }

    function convertToArrayForSection(data, currentMonthKTQT) {
        let result = [];
        for (let i = 1; i <= currentMonthKTQT; i++) {
            result.push({
                month: i, 'th': data[`${selectedUnit}_${i}`]
            });
        }
        return result;
    }

    function convertToArrayForSectionCF(data, currentMonthKTQT) {
        let result = [];
        for (let i = 1; i <= currentMonthKTQT; i++) {
            result.push({
                month: i, 'th': -data[`${selectedUnit}_${i}`]
            });
        }
        return result;
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
    }, []);

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
    }, [selectedUnit, isShowAll1, isShowView, currentCompanyKTQT, currentYearKTQT]);

    const rendHeader = (teamKey) => {
        const parts = teamKey.split('_');
        if (parts[1] == '0') {
            return 'Lũy kế năm';
        }
        let header = 'Tháng ' + parts[1] || 'Khác';
        return `${header}`;
    };

    function isBold(params) {
        const isBold = params.data.layer.toString()?.includes('.');
        return {
            textAlign: 'left', paddingRight: 10,
        };
    }

    function createField(field) {
        const parts = field.split('_');
        const isLuyKeNam = parts[1] == '0';
        
        return {
            field: field,
            headerName: rendHeader(field),
            headerClass: 'right-align-business-name',
            cellRenderer: (params) => {
                return (<div className="cell-action-group">
                    <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'K'} view={isShowView2}
                                         currentYear={currentYearKTQT}
                                         plType={isShowView2 ? params.data.code : null}/>
                </div>);
            }, ...Color(),
            cellStyle: (params) => {
                return {...isBold(params), textAlign: 'right'}
            },
            ...(isLuyKeNam && { pinned: 'left' }),

        };
    }

    async function redenderFields() {
        let fields = [
            {
                field: 'dp', headerName: 'Khoản mục phí', width: 300, pinned: 'left', ...Color(), cellStyle: isBold,
            },
            ...(await renderFieldMoney())];
        return fields;
    }

    async function renderFieldMoney() {
        const teamFields = [];
        // Push Lũy kế năm first
        teamFields.push({
            ...createField(`${selectedUnit}_0`),
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
            const fieldName = `${selectedUnit}_${y}`;
            teamFields.push({
                ...createField(fieldName),
            });
        }
        return teamFields;
    }


    useEffect(() => {
        const fetchData = async () => {
            try {
                let updatedColDefs = await redenderFields()
                const savedColumnState = await getItemFromIndexedDB2(tableCol);
                if (savedColumnState.length) {
                    setColDefs(loadColumnState(updatedColDefs, savedColumnState));
                } else {
                    const simplifiedColumnState = updatedColDefs.map(({field, pinned, width, hide}) => ({
                        colId: field,
                        pinned,
                        width,
                        hide,
                    }));
                    await setItemInIndexedDB2(tableCol, simplifiedColumnState);
                    setColDefs(updatedColDefs);
                }
            } catch (error) {
                console.log(error);
                console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, selectedUnit]);


    const handlers = {
        A: () => {
            handleClickView()
        },
        B: () => {
            handleClickView2()
        },

    };

    const options = [
        {value: 'A', label: 'Nhóm theo bản chất biến phí, định phí', used: isShowView},
        {value: 'B', label: 'Nhóm khoản mục KQKD dựa theo TK kế toán', used: isShowView2},
    ];

    const handleUnitChange = (value) => {
        setSelectedUnit(value);
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
            <div style={{display: "flex", width: "100%"}}>
                <div style={{width: "100%"}}>
                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>Báo cáo KQKD Nhóm Kênh</span>
                        </div>
                    </div>
                    <div className={css.headerPowersheet2}>
                        <ActionSelectUnitDisplay />
                        {/*<img*/}
                        {/*    onClick={handleUpdate}*/}
                        {/*    className={'IoIosArrowDropleft'}*/}
                        {/*    src={RefIcon}*/}
                        {/*    alt="Arrow Back Icon"*/}
                        {/*    width="25"*/}
                        {/*    height="25"*/}
                        {/*/>*/}
                        {/*<div className={css.toogleChange}>*/}
                        {/*    <ActionToggleSwitch2 label="Ẩn dữ liệu trống"*/}
                        {/*                         isChecked={isShowAll1 && isHideEmptyColumns}*/}
                        {/*                         onChange={toggleSwitch}/>*/}
                        {/*</div>*/}
                        <div className={css.headerAction}>
                            <ActionSelectTypeBaoCao options={options}
                                                    handlers={handlers}/>

                            <ActionSelectDanhMucBaoCao selectedUnit={selectedUnit} listUnit={listUnit}
                                                       handlers={handleUnitChange}/>

                            {/*<div className="navbar-item" ref={dropdownRef}>*/}
                            {/*    /!* <img*/}
                            {/*        src={EllipsisIcon}*/}
                            {/*        style={{width: 32, height: 32, cursor: 'pointer'}}*/}
                            {/*        alt="Ellipsis Icon"*/}
                            {/*        onClick={handleDropdownToggle}*/}
                            {/*    /> *!/*/}
                            {/*    {isDropdownOpen && (<div className="dropdown-menu-button1">*/}
                            {/*        <ExportableGrid*/}
                            {/*            api={gridRef.current ? gridRef.current.api : null}*/}
                            {/*            columnApi={gridRef.current ? gridRef.current.columnApi : null}*/}
                            {/*            table={table}*/}
                            {/*            isDropdownOpen={isDropdownOpen}*/}
                            {/*        />*/}
                            {/*    </div>)}*/}
                            {/*</div>*/}
                            <ActionMenuDropdown popoverContent={popoverContent}
                                                dropdownOpen={dropdownOpen}
                                                setDropdownOpen={setDropdownOpen}
                            />
                        </div>
                    </div>
                    {/*<Loading loading={loading}/>*/}
                    {/*<div style={{display: isHideChart ? 'none' : "flex", gap: 5, margin: '10px 0'}}>*/}
                    {/*    <div style={{flex: 1}}>*/}
                    {/*        <AgCharts options={chartOptions.doanhThu}/>*/}
                    {/*    </div>*/}
                    {/*    <div style={{flex: 1}}>*/}
                    {/*        <AgCharts options={chartOptions.chiPhi}/>*/}
                    {/*    </div>*/}
                    {/*    <div style={{flex: 1}}>*/}
                    {/*        <AgCharts options={chartOptions.loiNhuan}/>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                    <div
                        style={{
                            height: '75vh',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            marginTop: '15px',
                        }}
                    >
                        <KQKDTimeWaterfallCharts
                            rowData={rowData}
                            selectedMonth={currentMonthKTQT}
                            unitDisplay={undefined}
                            formatUnitDisplay={formatUnitDisplay}
                            selectedUnit={selectedUnit}
                        />
                        <div className="ag-theme-quartz" style={{height: '100%', width: '100%', display: 'flex'}}>
                            <div style={{height: '70vh',flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s'}}>
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
                                    onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                                    onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                                />
                            </div>
                            {/*{isSidebarVisible && <AnalysisSideBar table={table} gridRef={gridRef}/>}*/}
                        </div>
                        {/*<div style={{height: '76%'}}>{isNoteVisible && <NoteComponent type={noteType}/>}</div>*/}
                    </div>
                </div>
            </div>
        </>
    );
}
