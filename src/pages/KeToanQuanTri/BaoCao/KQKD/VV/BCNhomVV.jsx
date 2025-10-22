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
import css from '../../../BaoCao/BaoCao.module.css';
import AG_GRID_LOCALE_VN from '../../../../Home/AgridTable/locale.jsx';
import { MyContext } from '../../../../../MyContext.jsx';
import { saveColumnStateToLocalStorage } from '../../../functionKTQT/coloumnState.jsx';
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from '../../../storage/storageService.js';
import PopupCellActionBCKD from '../../../popUp/cellAction/PopUpCellActionBCKD.jsx';
import { getAllProject } from '../../../../../apisKTQT/projectService.jsx';
import ActionSelectTypeBaoCao from '../../../ActionButton/ActionSelectTypeBaoCao.jsx';
import ActionSelectMonthBaoCao from '../../../ActionButton/ActionSelectMonthBaoCao.jsx';
import ActionSelectUnitDisplay from '../../../ActionButton/ActionSelectUnitDisplay.jsx';
import DanhMucPopUpDiaglog from '../../../detail/DanhMucPopupDialog.jsx';
import ActionMenuDropdown from '../../../ActionButton/ActionMenuDropdown.jsx';
import ActionModalButton from '../../../ActionButton/ActionModalButton.jsx';
import AnalysisModalBCNhomVV from '../../../components/AnalysisModalBCNhomVV.jsx';
import Loading3DTower from '../../../../../components/Loading3DTower.jsx';
import { getAllSoKeToan } from '../../../../../apisKTQT/soketoanService.jsx';
import KQKDCharts from '../../../components/KQKDCharts.jsx';
import { formatUnitDisplay } from '../../../functionKTQT/formatUnitDisplay.js';
import { bcNhomVVCacheService } from '../../../../../services/index.js';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BCNhomVV({company}) {
    const table = 'BCNhomVV';
    const tableCol = 'BCNhomVVCol';
    const {currentYearKTQT, currentMonthKTQT, loadDataSoKeToan, currentCompanyKTQT, unitDisplay, currentUser} = useContext(MyContext);
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [groups, setGroups] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const tableStatusButton = 'BCNhomVVStatusButton';
    const [isShowView, setShowView] = useState(false);
    const [isShowView2, setShowView2] = useState(false);
    const [isShowAll1, setShowAll1] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(false);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheInfo, setCacheInfo] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            setShowAll1(settings?.isShowAll1 ?? true);
            setShowView(settings?.isShowView ?? false);
            setShowView2(settings?.isShowView2 ?? true);
            setSelectedMonth(settings?.selectedMonth ?? 0);
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
                isHideEmptyColumns,
                selectedMonth,
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowView, isShowView2, isShowAll1, isHideEmptyColumns, selectedMonth,]);


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

    const handleSelectedMonthChange = (e) => {
        setSelectedMonth(Number(e));
    };
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
                type: 'BCNhomVV',
                currentYearKTQT,
                currentCompanyKTQT,
            };
            await bcNhomVVCacheService.deleteCache(cacheParams);
            console.log('BCNhomVV: Cache cleared, refreshing data...');
            
            // Tính toán lại dữ liệu
            await prepareData(true);
        } catch (error) {
            console.error('BCNhomVV: Error refreshing data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Hàm xóa tất cả cache
    const handleClearAllCache = async () => {
        try {
            await bcNhomVVCacheService.clearAllCache();
            console.log('BCNhomVV: All cache cleared');
            // Tính toán lại dữ liệu
            await prepareData(true);
        } catch (error) {
            console.error('BCNhomVV: Error clearing all cache:', error);
        }
    };

    // Hàm lấy thông tin cache
    const handleGetCacheInfo = async () => {
        try {
            const info = await bcNhomVVCacheService.getCacheInfo();
            setCacheInfo(info);
            console.log('BCNhomVV: Cache info:', info);
        } catch (error) {
            console.error('BCNhomVV: Error getting cache info:', error);
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
            cellStyle: {fontSize: '14.5px'},
            width: 130,
        };
    });

    async function prepareData(reload = false) {
        setLoading(true);

        // Tạo cache key dựa trên các tham số hiện tại
        const cacheParams = {
            type: 'BCNhomVV',
            currentYearKTQT,
            currentCompanyKTQT,
        };

        // Kiểm tra cache trước khi tính toán
        if (!reload) {
            const cachedData = await bcNhomVVCacheService.getCache(cacheParams);
            if (cachedData) {
                console.log('BCNhomVV: Using cached data');
                setRowData(cachedData.rowData);
                setGroups(cachedData.groups);
                
                // Tái tạo colDefs vì không lưu được functions trong cache
                const colDefs = await redenderFields();
                setColDefs(colDefs);
                
                setLoading(false);
                return;
            }
        }

        console.log('BCNhomVV: Computing fresh data');
        let rowData = [];

        let data = await getAllSoKeToan();
        data = data.filter((e) => e.isUse && e.daHopNhat);
        if (currentCompanyKTQT.toLowerCase() === 'hq') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
        else data = data.filter((e) => e.company?.toLowerCase() === currentCompanyKTQT?.toLowerCase());
        data = data.filter(e => currentYearKTQT === 'toan-bo' || e.year == currentYearKTQT);
        let units = await getAllProject();
        const uniqueUnits = units.reduce((acc, current) => {
            if (!acc.find((unit) => unit.code === current.code)) {
                acc.push(current);
            }
            return acc;
        }, []);

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

        if (isShowAll1) {
            rowData = rowData.filter((item) => {
                for (let j = 0; j < uniqueUnits.length; j++) {
                    if (
                        item[`${uniqueUnits[j].code}_${selectedMonth}`] !== 0 ||
                        !item.layer.includes('.')
                    ) {
                        return true;
                    }
                }
                return false;
            });
        }

        rowData = rowData.map((row) => {
            let newRow = {...row};
            uniqueGroups.forEach((group) => {
                const groupSums = sumGroupColumns(row, group, uniqueUnits);
                newRow = {...newRow, ...groupSums};
            });
            return newRow;
        });

        // Lưu vào cache (chỉ lưu dữ liệu, không lưu colDefs vì có functions)
        const cacheData = {
            rowData,
            groups: uniqueGroups,
            // Không lưu colDefs vì có functions không thể serialize
        };

        try {
            await bcNhomVVCacheService.setCache(cacheParams, cacheData);
            console.log('BCNhomVV: Data cached successfully');
        } catch (error) {
            console.error('BCNhomVV: Failed to cache data:', error);
        }

        // Tạo colDefs cho trường hợp tính toán mới
        const colDefs = await redenderFields();

        setRowData(rowData);
        setGroups(uniqueGroups);
        setColDefs(colDefs);
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
    }, []);

    useEffect(() => {
        prepareData();
    }, [selectedMonth, isShowAll1, currentYearKTQT, isShowView, currentCompanyKTQT]);

    // Load cache info khi component mount
    useEffect(() => {
        handleGetCacheInfo();
    }, []);

    const rendHeader = (teamKey) => {
        const parts = teamKey.split('_');
        let prefix = parts[0];
        if (!teamKey || teamKey.includes('null')) {
            prefix = "Khác"
        }
        if (prefix === 'ALL') {
            return 'Tổng';
        }
        return `${prefix}`;
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
                return (
                    <div className="cell-action-group">
                        <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'NVV'}
                                             view={isShowView2} currentYear={currentYearKTQT}
                                             plType={isShowView2 ? params.data.code : null}/>
                    </div>
                );
            },
            ...Color(),
            cellStyle: (params) => {
                return {...isBold(params), textAlign: 'right'}
            },
            ...(parts[0] === 'ALL' && { pinned: 'left' }),
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
            ...(await renderFieldMoney()),
        ];
        return fields;
    }

    async function renderFieldMoney() {
        const teamFields = [];
        for (let y = 0; y <= 12; y++) {
            if (selectedMonth === null || selectedMonth == y) {
                teamFields.push({
                    ...createField(`ALL_${y}`),
                });
            }
        }
        const validFields = [];
        let units = await getAllProject();
        const uniqueGroups = [...new Set(units.map((unit) => unit.group))];
        uniqueGroups.forEach((team) => {
            for (let y = 0; y <= 12; y++) {
                if (selectedMonth === null || selectedMonth == y) {
                    const fieldName = `${team}_${y}`;
                    let hide = false;
                    teamFields.push({
                        ...createField(fieldName, {hide}),
                    });
                }
            }
        });
        if (isHideEmptyColumns) {
            teamFields.map((team) => {
                const fieldName = `${team.field}`;
                const allValuesAreZeroOrNull = rowData.every((row) => row[fieldName] === 0 || row[fieldName] === null);
                if (allValuesAreZeroOrNull) {
                    team.hide = true;
                }
            });
        }
        return teamFields;
    }

    useEffect(() => {
        const fetchData = async () => {
            let updatedColDefs = await redenderFields()
            setColDefs(updatedColDefs);
        };
        fetchData();
    }, [onGridReady, rowData, table, selectedMonth, isHideEmptyColumns]);


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

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [openView, setOpenView] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedType, setSelectedType] = useState(null);

    const handleOpenViewKMF = () => {
        setOpenView(true);
        setSelectedItem('KMF')
        setSelectedType(1)
        setDropdownOpen(false)
    };
    const handleOpenViewVV = () => {
        setOpenView(true);
        setSelectedItem('Vuviec')
        setSelectedType(1)
        setDropdownOpen(false)
    };

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
                🔄 Xem KMF
            </span>
            ),
            onClick: handleOpenViewKMF,
        },
        {
            key: '2',
            label: (
                <span>
                🔄 Xem Vụ việc
            </span>
            ),
            onClick: handleOpenViewVV,
        },
        {
            key: '3',
            label: (
                <span>
                🔄 {isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
                </span>
            ),
            onClick: handleRefreshData,
            disabled: isRefreshing,
        },
        {
            key: '4',
            label: (
                <span>
                🗑️ Xóa tất cả cache
                </span>
            ),
            onClick: handleClearAllCache,
        },
        {
            key: '5',
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
                        {/*<img onClick={handleUpdate}*/}
                        {/*     className={css.IoIosArrowDropleft}*/}
                        {/*     src={RefIcon}*/}
                        {/*     alt="Arrow Back Icon"*/}
                        {/*     width="25"*/}
                        {/*     height="25"*/}
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
                                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    background: '#fff',
                                    border: '1px solid #d9d9d9',
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
                            <ActionSelectMonthBaoCao selectedMonth={selectedMonth}
                                                     handleSelectedMonthChange={handleSelectedMonthChange}/>
                            {/*<div className="navbar-item" ref={dropdownRef}>*/}
                            {/*    /!* <img*/}
                            {/*        src={EllipsisIcon}*/}
                            {/*        style={{width: 32, height: 32, cursor: 'pointer'}}*/}
                            {/*        alt="Ellipsis Icon"*/}
                            {/*        onClick={handleDropdownToggle}*/}
                            {/*    /> *!/*/}
                            {/*    {isDropdownOpen && (*/}
                            {/*        <div className="dropdown-menu-button1">*/}
                            {/*            <ExportableGrid*/}
                            {/*                api={gridRef.current ? gridRef.current.api : null}*/}
                            {/*                columnApi={gridRef.current ? gridRef.current.columnApi : null}*/}
                            {/*                table={table}*/}
                            {/*                isDropdownOpen={isDropdownOpen}*/}
                            {/*            />*/}
                            {/*        </div>*/}
                            {/*    )}*/}
                            {/*</div>*/}

                            <ActionMenuDropdown popoverContent={popoverContent}
                                                dropdownOpen={dropdownOpen}
                                                setDropdownOpen={setDropdownOpen}
                            />
                        </div>
                        {/*<div>*/}
                        {/*    <ActionViewSetting table={table}/>*/}
                        {/*</div>*/}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            marginTop: '15px',
                        }}
                    >
                        {loading && (
                            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,1)', zIndex: 5}}>
                                <Loading3DTower/>
                            </div>
                        )}
                        <KQKDCharts
                            rowData={rowData}
                            selectedMonth={selectedMonth}
                            unitDisplay={unitDisplay}
                            formatUnitDisplay={formatUnitDisplay}
                            groups={groups}
                        />
                        <div className="ag-theme-quartz" style={{height: '70vh', width: '100%', display: 'flex'}}>
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
            {
                openView && <DanhMucPopUpDiaglog onClose={() => setOpenView(false)}
                                                 open={openView}
                                                 view={selectedItem}
                                                 table={table}
                                                 type={selectedType}
                />
            }
            <AnalysisModalBCNhomVV
                visible={isAnalysisModalOpen}
                onClose={handleCloseAnalysisModal}
                rowData={rowData}
                groups={groups}
                currentYearKTQT={currentYearKTQT}
                currentCompanyKTQT={currentCompanyKTQT}
                currentUser={currentUser}
            />
        </>
    );
}
