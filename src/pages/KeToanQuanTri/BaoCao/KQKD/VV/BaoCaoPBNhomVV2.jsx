
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
import { getAllProject } from '../../../../../apisKTQT/projectService.jsx';
import ActionSelectTypeBaoCao from '../../../ActionButton/ActionSelectTypeBaoCao.jsx';
import ActionSelectDanhMucBaoCao from '../../../ActionButton/ActionSelectDanhMucBaoCao.jsx';
import ActionSelectUnitDisplay from '../../../ActionButton/ActionSelectUnitDisplay.jsx';
import ActionMenuDropdown from '../../../ActionButton/ActionMenuDropdown.jsx';
import ActionModalButton from '../../../ActionButton/ActionModalButton.jsx';
import AnalysisModalBCNhomVV from '../../../components/AnalysisModalBCNhomVV.jsx';
import Loading3DTower from '../../../../../components/Loading3DTower.jsx';
import KQKDTimeWaterfallCharts from '../../../../KeToanQuanTri/components/KQKDTimeWaterfallCharts.jsx';
import { formatUnitDisplay } from '../../../functionKTQT/formatUnitDisplay.js';
import { getSettingByType } from '../../../../../apis/settingService.jsx';
import { getAllSoKeToan } from '../../../../../apisKTQT/soketoanService.jsx';
import { baoCaoPBNhomVV2CacheService } from '../../../../../services/index.js';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoPBNhomVV2({company}) {
    const table = 'BaoCaoPBNhomVV2';
    const tableCol = 'BaoCaoPBNhomVV2Col';
    const {currentMonthKTQT, loadDataSoKeToan, currentYearKTQT, currentCompanyKTQT, currentUser} = useContext(MyContext);
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
    const tableStatusButton = 'BaoCaoPBNhomVV2StatusButton';
    const [isShowView, setShowView] = useState(false);
    const [isShowView2, setShowView2] = useState(false);
    const [isShowAll1, setShowAll1] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [isHideChart, setIsHideChart] = useState(false);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(null);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheInfo, setCacheInfo] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            setShowAll1(settings?.isShowAll1 ?? true);
            setShowView(settings?.isShowView ?? false);
            setShowView2(settings?.isShowView2 ?? true);
            setSelectedUnit(settings?.selectedUnit ?? null);
            setIsHideChart(settings?.isHideChart ?? false);
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? true);
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
    }, [isShowView, isShowView2, isShowAll1, selectedUnit, isHideChart]);

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

    const handleOpenAnalysisModal = () => {
        setIsAnalysisModalOpen(true);
    };

    const handleCloseAnalysisModal = () => {
        setIsAnalysisModalOpen(false);
    };

    // Hàm refresh dữ liệu - xóa cache và tính toán lại
    const handleRefreshData = async () => {
        setIsRefreshing(true);
        try {
            // Xóa cache hiện tại
            const cacheParams = {
                type: 'BaoCaoPBNhomVV2',
                currentYearKTQT,
                currentCompanyKTQT,
            };
            await baoCaoPBNhomVV2CacheService.deleteCache(cacheParams);
            console.log('BaoCaoPBNhomVV2: Cache cleared, refreshing data...');
            
            // Tính toán lại dữ liệu
            await prepareData(true);
        } catch (error) {
            console.error('BaoCaoPBNhomVV2: Error refreshing data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Hàm xóa tất cả cache
    const handleClearAllCache = async () => {
        try {
            await baoCaoPBNhomVV2CacheService.clearAllCache();
            console.log('BaoCaoPBNhomVV2: All cache cleared');
            // Tính toán lại dữ liệu
            await prepareData(true);
        } catch (error) {
            console.error('BaoCaoPBNhomVV2: Error clearing all cache:', error);
        }
    };

    // Hàm lấy thông tin cache
    const handleGetCacheInfo = async () => {
        try {
            const info = await baoCaoPBNhomVV2CacheService.getCacheInfo();
            setCacheInfo(info);
            console.log('BaoCaoPBNhomVV2: Cache info:', info);
        } catch (error) {
            console.error('BaoCaoPBNhomVV2: Error getting cache info:', error);
        }
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
        setLoading(true);

        // Tạo cache key dựa trên các tham số hiện tại
        const cacheParams = {
            type: 'BaoCaoPBNhomVV2',
            currentYearKTQT,
            currentCompanyKTQT,
        };

        // Kiểm tra cache trước khi tính toán
        if (!reload) {
            const cachedData = await baoCaoPBNhomVV2CacheService.getCache(cacheParams);
            if (cachedData) {
                console.log('BaoCaoPBNhomVV2: Using cached data');
                setRowData(cachedData.rowData);
                setListUnit(cachedData.listUnit);
                
                // Tái tạo chartOptions và colDefs vì có functions không thể serialize
                let dataChart = loadDataChart(cachedData.rowData);
                setChartOptions(dataChart);
                const colDefs = await redenderFields();
                setColDefs(colDefs);
                
                setLoading(false);
                return;
            }
        }

        console.log('BaoCaoPBNhomVV2: Computing fresh data');
        let rowData = [];

        let units = await getAllProject();
        const uniqueUnits = units.reduce((acc, current) => {
            if (!acc.find((unit) => unit.code === current.code)) {
                acc.push(current);
            }
            return acc;
        }, []);
        setListUnit(uniqueUnits);

        let data = await getAllSoKeToan();
        data = data.filter((e) => e.isUse);
        if (currentCompanyKTQT) data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
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
            ? calculateDataView2(data, uniqueUnits, kmfList, 'code', 'project2', 'PBPROJECT', 'teams')
            : calculateData(data, uniqueUnits, kmfList, 'code', 'project2', 'PBPROJECT', 'teams');
        rowData = rowData.map((row) => {
            let newRow = {...row};
            uniqueGroups.forEach((group) => {
                const groupSums = sumGroupColumns(row, group, uniqueUnits);
                newRow = {...newRow, ...groupSums};
            });
            return newRow;
        });

        // Xử lý change data
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

        // Tạo chart options
        let dataChart = loadDataChart(rowData);
        setChartOptions(dataChart);

        // Lưu vào cache (chỉ lưu dữ liệu, không lưu colDefs và chartOptions vì có functions)
        const cacheData = {
            rowData,
            listUnit: uniqueUnits,
            // Không lưu chartOptions và colDefs vì có functions không thể serialize
        };

        try {
            await baoCaoPBNhomVV2CacheService.setCache(cacheParams, cacheData);
            console.log('BaoCaoPBNhomVV2: Data cached successfully');
        } catch (error) {
            console.error('BaoCaoPBNhomVV2: Failed to cache data:', error);
        }

        setRowData(rowData);
        
        setTimeout(() => {
            setLoading(false);
        }, 500);
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

    // Load cache info khi component mount
    useEffect(() => {
        handleGetCacheInfo();
    }, []);

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

    function createField(field, hide) {
        const parts = field.split('_');
        const isLuyKeNam = parts[1] == '0';
        
        return {
            field: field,
            headerName: rendHeader(field),
            headerClass: 'right-align-business-name',
            cellRenderer: (params) => {
                return (<div className="cell-action-group">
                    <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'NVV'} view={isShowView2}
                                         currentYear={currentYearKTQT}
                                         plType={isShowView2 ? params.data.code : null}/>
                </div>);
            }, ...Color(),
            cellStyle: (params) => {
                return {...isBold(params), textAlign: 'right'}
            },
            ...(isLuyKeNam && { pinned: 'left' }),
            ...hide
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
            const fieldName = `${selectedUnit}_${y}`;
            let hide = false;
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
                console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, selectedUnit]);

    function handleUpdate() {
        prepareData(true);
    }

    const getUniqueUnits = (units) => {
        return units
            .map((unit) => ({
                ...unit,
                group: unit.group ?? "Chưa nhóm",
            }))
            .filter(
                (unit, index, self) =>
                    self.findIndex((u) => u.group === unit.group) === index &&
                    !unit.group.includes("Internal")
            );
    };

    const formatGroupName = (group) => {
        if (group.includes("-")) {
            return group.split("-").slice(1).join("-");
        }
        return group;
    };

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
        {
            key: '1',
            label: (
                <span>
                🔄 {isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
                </span>
            ),
            onClick: handleRefreshData,
            disabled: isRefreshing,
        },
        {
            key: '2',
            label: (
                <span>
                🗑️ Xóa tất cả cache
                </span>
            ),
            onClick: handleClearAllCache,
        },
        {
            key: '3',
            label: (
                <span>
                ℹ️ Thông tin cache ({cacheInfo?.totalEntries || 0} items)
                </span>
            ),
            onClick: handleGetCacheInfo,
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
                            <span>Báo cáo KQKD Vụ việc</span>
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
                            <button 
                                onClick={handleRefreshData}
                                disabled={isRefreshing}
                                style={{
                                    padding: '5px 12px',
                                    border: 'none',
                                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    background: '#fff',
                                    borderRadius: '16px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                }}
                                title={isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
                            >
                                {isRefreshing ? '⏳' : '🔄'} {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
                            </button>
                            <ActionSelectTypeBaoCao options={options}
                                                    handlers={handlers}/>
                            <ActionModalButton 
                                onClick={handleOpenAnalysisModal}
                                title="Phân tích AI"
                            />
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
                            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,1)', zIndex: 5, height: '90vh'}}>
                                <Loading3DTower/>
                            </div>
                        )}
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
            <AnalysisModalBCNhomVV
                visible={isAnalysisModalOpen}
                onClose={handleCloseAnalysisModal}
                rowData={rowData}
                groups={listUnit.map(unit => unit.group).filter((group, index, self) => self.indexOf(group) === index)}
                currentYearKTQT={currentYearKTQT}
                currentCompanyKTQT={currentCompanyKTQT}
                currentUser={currentUser}
            />
        </>
    );
}
