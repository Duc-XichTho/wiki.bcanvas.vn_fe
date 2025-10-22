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
// Component
import { Color } from '../../Color.js';
import { calculateData, calculateDataView2 } from '../logicKQKD.js';
import { calculateData3 } from '../logicKQKDKieuC.js';
import { onFilterTextBoxChanged } from '../../../../../generalFunction/quickFilter.js';
import { MyContext } from '../../../../../MyContext.jsx';
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from '../../../storage/storageService.js';
import { getAllKmf } from '../../../../../apisKTQT/kmfService.jsx';
import { getAllUnits } from '../../../../../apisKTQT/unitService.jsx';
import PopupCellActionBCKD from '../../../popUp/cellAction/PopUpCellActionBCKD.jsx';
import AG_GRID_LOCALE_VN from '../../../../Home/AgridTable/locale.jsx';
import KQKDCharts from '../../../components/KQKDCharts.jsx';
import { formatUnitDisplay } from '../../../functionKTQT/formatUnitDisplay.js';
import ActionSelectTypeBaoCao from '../../../ActionButton/ActionSelectTypeBaoCao.jsx';
import ActionSelectMonthBaoCao from '../../../ActionButton/ActionSelectMonthBaoCao.jsx';
import ActionSelectUnitDisplay from '../../../ActionButton/ActionSelectUnitDisplay.jsx';
import { getAllSoKeToan } from '../../../../../apisKTQT/soketoanService.jsx';
import DanhMucPopUpDiaglog from '../../../detail/DanhMucPopupDialog.jsx';
import ActionMenuDropdown from '../../../ActionButton/ActionMenuDropdown.jsx';
import Loading3DTower from '../../../../../components/Loading3DTower.jsx';
import { baoCaoGroupUnitCacheService } from '../../../../../services/index.js';
import ActionModalButton from '../../../ActionButton/ActionModalButton.jsx';
import AnalysisModalGroupUnit from '../../../components/AnalysisModalGroupUnit.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoUnit() {
    const table = 'BaoCaoGroupUnit';
    const {
        currentMonthKTQT,
        isNotePadBaoCao,
        loadDataSoKeToan,
        currentYearKTQT,
        selectedCompany,
        currentCompanyKTQT,
        unitDisplay,
        currentUser
    } = useContext(MyContext);
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [groups, setGroups] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [isNoteVisible, setNoteVisible] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);


    function isBold(params) {
        const isBold = params.data.layer.toString()?.includes('.');
        return {
            textAlign: 'left', paddingRight: 10,
        };
    }


    const tableStatusButton = 'BCUnitStatusButton';
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [isShowAll1, setShowAll1] = useState(null);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(null);
    const [isShowView, setShowView] = useState(null);
    const [isShowView2, setShowView2] = useState(null);
    const [isShowView3, setShowView3] = useState(null);


    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            setSelectedMonth(settings?.selectedMonth ?? currentMonthKTQT)
            setShowAll1(settings?.isShowAll1 ?? true);
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? false);
            setShowView(settings?.isShowView ?? false);
            setShowView2(settings?.isShowView2 ?? true);
            setShowView3(settings?.isShowView3 ?? false);
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                selectedMonth,
                isShowAll1,
                isHideEmptyColumns,
                isShowView,
                isShowView2,
                isShowView3
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowView, isShowView2, isShowAll1, isHideEmptyColumns, selectedMonth, isShowView3,]);

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


    const handleSelectedMonthChange = (e) => {
        setSelectedMonth(Number(e));
    };

    const handleOpenAnalysisModal = () => {
        setIsAnalysisModalOpen(true);
    };

    const handleCloseAnalysisModal = () => {
        setIsAnalysisModalOpen(false);
    };

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleRefreshData = async () => {
        setIsRefreshing(true);
        try {
            const cacheParams = { type: 'BaoCaoGroupUnit', currentYearKTQT, currentCompanyKTQT };
            await baoCaoGroupUnitCacheService.deleteCache(cacheParams);
            await prepareData(true);
        } catch (e) {
            console.error('BaoCaoGroupUnit refresh error:', e);
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
        };
    });

    async function prepareData(reload = false) {
        setLoading(true);

        const cacheParams = { type: 'BaoCaoGroupUnit', currentYearKTQT, currentCompanyKTQT };

        if (!reload) {
            const cached = await baoCaoGroupUnitCacheService.getCache(cacheParams);
            if (cached && cached.rowData) {
                setRowData(cached.rowData);
                setGroups(cached.groups || groups);
                setTimeout(() => setLoading(false), 100);
                return;
            }
        }
        let data = await getAllSoKeToan();
        data = data.filter((e) => e.isUse && e.daHopNhat);
        if (currentCompanyKTQT.toLowerCase() === 'hq') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
        else data = data.filter((e) => e.company?.toLowerCase() === currentCompanyKTQT?.toLowerCase());
        data = data.filter(e => currentYearKTQT === 'toan-bo' || e.year == currentYearKTQT);

        let units = await getAllUnits();
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
        let rowData = []
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
                for (let j = 0; j < uniqueUnits.length; j++) {
                    if ((item[`${uniqueUnits[j].code}_${selectedMonth}`] && item[`${uniqueUnits[j].code}_${selectedMonth}`] !== 0) || !item.layer.includes('.')) {
                        return true;
                    }
                }

                return false;
            });
        }
        setRowData(newRowData);
        setGroups(uniqueGroups);

        try {
            await baoCaoGroupUnitCacheService.setCache(cacheParams, { rowData: newRowData, groups: uniqueGroups });
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
        prepareData().then();
    }, []);

    useEffect(() => {
        prepareData().then();
    }, [isShowView, isShowView3, isShowView2, selectedMonth, isShowAll1, selectedCompany, currentYearKTQT, currentCompanyKTQT]);

    const rendHeader = (teamKey) => {
        const parts = teamKey.split('_');
        const prefix = parts[0];
        if (prefix === 'ALL') {
            return 'Tổng';
        }
        let header = prefix.split('-')[1];
        if (header)
        return `${header}`;
        else return prefix;
    };

    function createField(field) {
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
                                             view={isShowView2} currentYear={currentYearKTQT}
                        plType={!isShowView ? params.data.code : null}/>
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
                cellStyle: isBold
            },
            ...(await renderFieldMoney()),
        ];

        return fields;
    }

    async function renderFieldMoney() {
        const teamFields = [];
        const validFields = [];
        for (let y = 0; y <= 12; y++) {
            if (selectedMonth === null || selectedMonth == y) {
                teamFields.push({
                    ...createField(`ALL_${y}`),
                });
            }
        }

        let units = await getAllUnits();
        let uniqueGroups = [...new Set(units.map((unit) => unit.group))];
        uniqueGroups = uniqueGroups.map((group) => group === null ? '100-Khác' : group)
        uniqueGroups.sort((a, b) => {
            let idxA = parseFloat(a.split('-')[0]) || 100
            let idxB = parseFloat(b.split('-')[0]) || 100
            return idxA - idxB;
        });
        if (isHideEmptyColumns) {
            for (const team of uniqueGroups) {
                for (let y = 0; y <= 12; y++) {
                    if (selectedMonth === null || selectedMonth == y) {
                        const fieldName = `${team}_${y}`;
                        if (rowData.some((row) => row[fieldName] !== 0 && row[fieldName] !== null)) {
                            validFields.push(fieldName);
                        }

                    }
                }
            }
            validFields.forEach((field) => {
                teamFields.push(createField(field));
            });
            return teamFields;
        } else {
            for (const team of uniqueGroups) {
                for (let y = 0; y <= 12; y++) {
                    if (selectedMonth === null || selectedMonth == y) {
                        const fieldName = `${team}_${y}`;
                        teamFields.push({
                            ...createField(fieldName),
                        });
                    }
                }
            }
            return teamFields;
        }
    }
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
    }, [selectedMonth, isHideEmptyColumns, rowData])

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
        // {value: 'C', label: 'Nhóm theo dạng trực tiếp, phân bổ', used: isShowView3},
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
    const handleOpenViewDV = () => {
        setOpenView(true);
        setSelectedItem('DonVi')
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
                🔄 Xem Đơn vị
            </span>
            ),
            onClick: handleOpenViewDV,
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
                            <span>  Báo cáo KQKD nhóm Đơn vị</span>
                            {/*<div className={css.toogleChange}>*/}
                            {/*    <ActionToggleSwitch label="Ẩn dòng trống" isChecked={isShowAll1}*/}
                            {/*                        onChange={handleIsShowAll1}/>*/}
                            {/*</div>*/}
                            {/*<div className={css.toogleChange}>*/}
                            {/*    <ActionToggleSwitch label="Ẩn cột trống" isChecked={isHideEmptyColumns}*/}
                            {/*                        onChange={handleHideEmptyColumns}/>*/}
                            {/*</div>*/}

                        </div>
                    </div>
                    <div className={css.headerPowersheet2}>
                        <ActionSelectUnitDisplay />
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
                                    marginRight: 8,
                                }}
                                title={isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
                            >
                                {isRefreshing ? '⏳' : '🔄'} {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
                            </button>
                            <ActionSelectTypeBaoCao options={options} handlers={handlers}/>
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
                            {/*        <div className={css.dropdownMenu}>*/}
                            {/*            <ExportableGrid*/}
                            {/*                api={gridRef.current ? gridRef.current.api : null}*/}
                            {/*                columnApi={gridRef.current ? gridRef.current.columnApi : null}*/}
                            {/*                table={table}*/}
                            {/*                isDropdownOpen={isDropdownOpen}*/}
                            {/*            />*/}
                            {/*        </div>*/}
                            {/*    )}*/}
                            {/*</div>*/}
                            {/*<div>*/}
                            {/*    <ActionViewSetting table={table}/>*/}
                            {/*</div>*/}
                            <ActionMenuDropdown popoverContent={popoverContent}
                                                dropdownOpen={dropdownOpen}
                                                setDropdownOpen={setDropdownOpen}
                            />
                        </div>
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
                            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 5}}>
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
                        <div className="ag-theme-quartz"
                             style={{height: '70vh', width: '100%', display: 'flex'}}>
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
                            {/*{isSidebarVisible && <AnalysisSideBar table={table} gridRef={gridRef}/>}*/}
                        </div>
                    </div>
                </div>
                {
                    isNotePadBaoCao &&
                    <div className={css.phantich}>
                        {/*<PhanTichNote table={table}/>*/}
                    </div>
                }
            </div>
            {
                openView && <DanhMucPopUpDiaglog onClose={() => setOpenView(false)}
                                                 open={openView}
                                                 view={selectedItem}
                                                 table={table}
                                                 type={selectedType}
                />
            }
            
            <AnalysisModalGroupUnit
                visible={isAnalysisModalOpen}
                onClose={handleCloseAnalysisModal}
                rowData={rowData}
                groups={groups}
                currentYearKTQT={currentYearKTQT}
                currentCompanyKTQT={currentCompanyKTQT}
                currentUser={currentUser}
                reportType="GroupUnit"
            />
        </>
    );
}
