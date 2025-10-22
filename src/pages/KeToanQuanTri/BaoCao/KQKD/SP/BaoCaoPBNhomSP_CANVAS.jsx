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
// import AnalysisSideBar from '../../../../function/analysisSideBar.jsx';
import { getAllKmf } from '../../../../../apisKTQT/kmfService.jsx';
import { getAllProduct } from '../../../../../apisKTQT/productService.jsx';
import { calculateData, calculateDataView2 } from '../logicKQKD.js';
import { EllipsisIcon, } from '../../../../../icon/IconSVG.js';
import { Color } from '../../Color.js';
import css from "../../../BaoCao/BaoCao.module.css";
import AG_GRID_LOCALE_VN from "../../../../Home/AgridTable/locale.jsx";
import { MyContext } from "../../../../../MyContext.jsx";
import { saveColumnStateToLocalStorage } from "../../../functionKTQT/coloumnState.jsx";
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from "../../../storage/storageService.js";
import PopupCellActionBCKD from "../../../popUp/cellAction/PopUpCellActionBCKD.jsx";
import ActionViewSetting from "../../../ActionButton/ActionViewSetting.jsx";

import { useParams } from 'react-router-dom';
import ActionHideEmptyRows from "../../../ActionButton/ActionHideEmptyRows.jsx";
import ActionSelectTypeBaoCao from "../../../ActionButton/ActionSelectTypeBaoCao.jsx";
import ActionSelectMonthBaoCao from "../../../ActionButton/ActionSelectMonthBaoCao.jsx";
import ActionHideEmptyColumns from "../../../ActionButton/ActionHideEmptyColumns.jsx";
import { getFileNotePadByIdController } from "../../../../../apis/fileNotePadService.jsx";
import ActionToggleSwitch from "../../../ActionButton/ActionToggleSwitch.jsx";
import ExportableGrid from "../../../popUp/exportFile/ExportableGrid.jsx";
import { Button, Dropdown, Typography } from 'antd';
import { KHONG_THE_TRUY_CAP } from "../../../../../Consts/TITLE_HEADER.js";
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { getPermissionDataNhomBC } from "../../../../Canvas/getPermissionDataNhomBC.js";
import NotAccessible from "../../../../Canvas/NotAccessible.jsx";
import ActionDisplayRichNoteSwitch from "../../../ActionButton/ActionDisplayRichNoteSwitch.jsx";
import RichNoteKTQTRI from "../../../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionToggleSwitch2 from "../../../ActionButton/ActionToggleSwitch2.jsx";
import ActionSelectGroupTypeBaoCao from "../../../ActionButton/ActionSelectGroupTypeBaoCao.jsx";
import { ChevronDown } from 'lucide-react';
import DanhMucPopUpDiaglog from '../../../detail/DanhMucPopupDialog.jsx';
import ActionMenuDropdown from '../../../ActionButton/ActionMenuDropdown.jsx';
import Loading from '../../../../Loading/Loading.jsx';


ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoPBNhomSP_CANVAS({ company }) {
    const { companySelect, id } = useParams();
    const pathDashboard = window.location.pathname.includes('dashboard');
    const table = 'BaoCaoPBNhomSPCanvas';
    const tableCol = 'BCPBNSPCol';
    const key = 'KQKD_NHOMSP'
    const {
        loadDataSoKeToan,
        currentYearCanvas,
        currentMonthCanvas,
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
    } = useContext(MyContext);
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const tableStatusButton = 'BCPBNhomSPStatusButtonCanvas';
    const [isShowView, setShowView] = useState(false);
    const [isShowView2, setShowView2] = useState(false);
    const [isShowAll1, setShowAll1] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(0);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(false);
    const [titleName, setTitleName] = useState('');
    const [isShowInfo, setIsShowInfo] = useState(false);
    const [selectedTypeGroup, setSelectedTypeGroup] = useState('group');

    useEffect(() => {
        handleSelectedMonthChange(currentMonthCanvas);
    }, [currentMonthCanvas])

    const fetchAndSetTitleName = async (id) => {
        try {
            const data = await getFileNotePadByIdController(id);
            setTitleName(data.name);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            console.log("🔍 settings", settings)
            setShowAll1(settings?.isShowAll1 ?? false);
            setShowView(settings?.isShowView ?? false);
            setShowView2(settings?.isShowView2 ?? true);
            setSelectedMonth(settings?.selectedMonth || 0)
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? false);
            setIsShowInfo(settings?.isShowInfo ?? false);
        };
        fetchSettings();
        fetchAndSetTitleName(id);
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                isShowView,
                isShowView2,
                isShowAll1,
                isHideEmptyColumns,
                selectedMonth,
                isShowInfo,
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowView, isShowView2, isShowAll1, isHideEmptyColumns, selectedMonth, isShowInfo,]);


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
    const handleShowInfo = () => {
        setIsShowInfo(prevState => !prevState);
    };

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
            width: 150,
            suppressMenu: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    async function prepareData(reload = false) {
        setLoading(true)
        let rowData = [];
        let data = await loadDataSoKeToan();
        data = data.filter(e => e.year == currentYearCanvas && (e.company == companySelect || companySelect == 'HQ'));
        data = data.filter((e) => e.consol?.toLowerCase() == 'consol');

        const user = await getCurrentUserLogin();
        let units = await getAllProduct();

        units = await getPermissionDataNhomBC('product', user, userClasses, fetchUserClasses, uCSelected_CANVAS, units)
        if (units?.length == 0 || !units) {
            setTitleName(KHONG_THE_TRUY_CAP)
            return
        }
        const uniqueUnits = units.reduce((acc, current) => {
            if (!acc.find((unit) => unit.code === current.code)) {
                acc.push(current);
            }
            return acc;
        }, []);

        const uniqueGroups = [...new Set(units.map((unit) => unit[selectedTypeGroup]))];
        let kmfList = await getAllKmf();
        kmfList = kmfList.reduce((acc, current) => {
            if (!acc.find((unit) => unit.name === current.name)) {
                acc.push(current);
            }
            return acc;
        }, []);

        rowData = isShowView2
            ? calculateDataView2(data, uniqueUnits, kmfList, 'code', 'product2', 'PBSP', 'teams')
            : calculateData(data, uniqueUnits, kmfList, 'code', 'product2', 'PBSP', 'teams');

        if (isShowAll1) {
            rowData = rowData.filter((item) => {
                for (let j = 0; j < uniqueUnits.length; j++) {
                    if (
                        item[`${uniqueUnits[j].code}_${currentMonthCanvas}`] !== 0 ||
                        !item.layer.includes('.')
                    ) {
                        return true;
                    }
                }
                return false;
            });
        }

        rowData = rowData.map((row) => {
            let newRow = { ...row };
            uniqueGroups.forEach((group) => {
                const groupSums = sumGroupColumns(row, group, uniqueUnits);
                newRow = { ...newRow, ...groupSums };
            });
            return newRow;
        });
        await setItemInIndexedDB2(key, rowData);
        setRowData(rowData);
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }

    function sumGroupColumns(row, group, units) {
        let result = {};
        for (let i = 0; i <= 12; i++) {
            let sum = 0;
            units.forEach((unit) => {
                if (unit[selectedTypeGroup] === group) {
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
    }, [selectedMonth, isShowAll1, isShowView, currentYearCanvas, selectedTypeGroup]);

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
            textAlign: 'left',
            paddingRight: 10,
            // background: isBold ? "" : 'rgb(237, 237, 237)',
        };
    }

    function createField(field, hide) {
        return {
            field: field,
            headerName: rendHeader(field),
            headerClass: 'right-align-business-name',
            cellRenderer: (params) => {
                return (
                    <div className="cell-action-group">
                        <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'NSP'}
                            view={isShowView2} currentYear={currentYearCanvas} />
                    </div>
                );
            },
            ...Color(),
            cellStyle: (params) => {
                return { ...isBold(params), textAlign: 'right' }
            },
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
        const validFields = [];
        for (let y = 0; y <= 12; y++) {
            if (selectedMonth === null || currentMonthCanvas == y) {
                teamFields.push({
                    ...createField(`ALL_${y}`),
                });
            }
        }
        let units = await getAllProduct();
        const uniqueGroups = [...new Set(units.map((unit) => unit[selectedTypeGroup]))];
        uniqueGroups.forEach((team) => {
            for (let y = 0; y <= 12; y++) {
                if (selectedMonth === null || currentMonthCanvas == y) {
                    const fieldName = `${team}_${y}`;
                    let hide = false;
                    teamFields.push({
                        ...createField(fieldName, { hide }),
                    });
                }
            }
        });
        if (isHideEmptyColumns) {
            teamFields.map((team) => {
                const fieldName = `${team.field}`;
                const allValuesAreZeroOrNull = rowData.every((row) => row[fieldName] === 0 || row[fieldName] === null);
                if (allValuesAreZeroOrNull && !fieldName.startsWith('ALL')) {
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
    }, [onGridReady, rowData, table, currentMonthCanvas, isHideEmptyColumns, selectedTypeGroup]);

    function handleUpdate() {
        prepareData(true);
    }

    const handlers = {
        A: () => {
            handleClickView()
        },
        B: () => {
            handleClickView2()
        },

    };

    const options = [
        { value: 'A', label: 'Nhóm theo bản chất biến phí, định phí', used: isShowView },
        { value: 'B', label: 'Nhóm khoản mục KQKD dựa theo TK kế toán', used: isShowView2 },
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

    const handleOpenViewSP = () => {
        setOpenView(true);
        setSelectedItem('SanPham')
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
                <span>{isShowInfo ? '✅ Bật ghi chú' : '❌ Tắt ghi chú'}</span>
            ),
            onClick: handleShowInfo,
        },
        {
            key: '2',
            label: (
                <span>
                🔄 Xem KMF
            </span>
            ),
            onClick: handleOpenViewKMF,
        },
        {
            key: '3',
            label: (
                <span>
                🔄 Xem Sản phẩm
            </span>
            ),
            onClick: handleOpenViewSP,
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
            <div className={css.main}>
                <NotAccessible NotAccessible={titleName} />
                <div style={{ width: "100%" }}>
                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>{titleName}</span>
                        </div>
                    </div>
                    <div className={css.headerPowersheet2}>
                        <img src="/Group%20197.png" alt="Đơn vị: VND" style={{ width: '130px', marginLeft: '3px' }} />
                        {/*<div className={css.toogleChange}>*/}
                        {/*    <ActionToggleSwitch2 label="Ẩn dữ liệu trống"*/}
                        {/*        isChecked={isShowAll1 && isHideEmptyColumns}*/}
                        {/*        onChange={toggleSwitch} />*/}
                        {/*    <ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo} />*/}
                        {/*</div>*/}
                        <div className={css.headerAction}>
                            <ActionSelectGroupTypeBaoCao selectedTypeGroup={selectedTypeGroup}
                                                         setSelectedTypeGroup={setSelectedTypeGroup}/>
                            <ActionSelectTypeBaoCao options={options}
                                handlers={handlers} />
                            {!pathDashboard && (
                                <ActionSelectMonthBaoCao selectedMonth={selectedMonth}
                                    handleSelectedMonthChange={handleSelectedMonthChange} />
                            )}

                            {/*<div className="navbar-item" ref={dropdownRef}>*/}
                            {/*    /!* <img*/}
                            {/*        src={EllipsisIcon}*/}
                            {/*        style={{ width: 32, height: 32, cursor: 'pointer' }}*/}
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
                            {/*    <ActionViewSetting table={table} />*/}
                            {/*</div>*/}
                            <ActionMenuDropdown popoverContent={popoverContent}
                                                dropdownOpen={dropdownOpen}
                                                setDropdownOpen={setDropdownOpen}
                            />
                        </div>
                    </div>
                    <Loading loading={loading}/>
                    {isShowInfo && <div style={{ width: '100%', height: 'max-content', boxSizing: "border-box" }}>
                        <RichNoteKTQTRI table={`${table}_Canvas_note`} />
                    </div>}
                    <div
                        style={{
                            height: isShowInfo ? '50vh' : '50vh',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            marginTop: '15px',
                        }}
                    >

                        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%', display: 'flex' }}>
                            <div style={{ maxHeight: '50vh', width: '100%', }}>
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
                                    domLayout="normal"
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
        </>
    );
}
