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
import { toast } from 'react-toastify';
import '../../../../Home/AgridTable/agComponent.css';
// Component
import { getAllKmf } from '../../../../../apisKTQT/kmfService.jsx';
import { getAllProduct } from '../../../../../apisKTQT/productService.jsx';
import { calculateData, calculateDataView2 } from '../logicKQKD.js';
import { EllipsisIcon, RefIcon, } from '../../../../../icon/IconSVG.js';
import { Color } from '../../Color.js';
import css from "../../BaoCao.module.css"
import { MyContext } from "../../../../../MyContext.jsx";
import { loadColumnState, saveColumnStateToLocalStorage } from "../../../functionKTQT/coloumnState.jsx";
import { getItemFromIndexedDB2, setItemInIndexedDB2 } from "../../../storage/storageService.js";
import PopupCellActionBCKD from "../../../popUp/cellAction/PopUpCellActionBCKD.jsx";
import { formatCurrency } from "../../../functionKTQT/formatMoney.js";
import AG_GRID_LOCALE_VN from "../../../../Home/AgridTable/locale.jsx";
import { sumColumns } from "../../../functionKTQT/chartSetUp/setUpSection.js";
import { createSectionData, createSeries } from "../../../functionKTQT/chartSetUp/setUpChart.js";
import { getAllKenh } from "../../../../../apisKTQT/kenhService.jsx";
import { getAllProject } from "../../../../../apisKTQT/projectService.jsx";
import { useParams } from 'react-router-dom';
import ActionHideEmptyRows from "../../../ActionButton/ActionHideEmptyRows.jsx";
import ActionSelectTypeBaoCao from "../../../ActionButton/ActionSelectTypeBaoCao.jsx";
import ActionSelectDanhMucBaoCao from "../../../ActionButton/ActionSelectDanhMucBaoCao.jsx";
import ActionToggleSwitch from "../../../ActionButton/ActionToggleSwitch.jsx";
import { getFileNotePadByIdController } from "../../../../../apis/fileNotePadService.jsx";
import { row } from 'mathjs';
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataNhomBC} from "../../../../Canvas/getPermissionDataNhomBC.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import NotAccessible from "../../../../Canvas/NotAccessible.jsx";
import ActionDisplayRichNoteSwitch from "../../../ActionButton/ActionDisplayRichNoteSwitch.jsx";
import RichNoteKTQTRI from "../../../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionToggleSwitch2 from "../../../ActionButton/ActionToggleSwitch2.jsx";
import { Button, Dropdown } from 'antd';
import { ChevronDown } from 'lucide-react';
import ActionMenuDropdown from '../../../ActionButton/ActionMenuDropdown.jsx';
import Loading from '../../../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoPBNhomVV2_CANVAS({ company }) {
    const { companySelect, tabSelect, id } = useParams();

    const table = 'BaoCaoPBNhomVV2Canvas';
    const tableCol = 'BaoCaoPBNhomVV2Col';
    const key = 'KQKD_NHOMVV2';
    const {
        currentMonthKTQT,
        loadDataSoKeToan,
        currentYearKTQT,
        currentMonthCanvas,
        currentYearCanvas,
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS
    } = useContext(MyContext);
    const currentMonth = tabSelect == 'daas' ? 12 : currentMonthCanvas;

    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [listUnit, setListUnit] = useState([]);
    let [chartOptions, setChartOptions] = useState({})
    const tableStatusButton = 'BaoCaoPBNhomVV2StatusButtonCanvas';
    const [isShowView, setShowView] = useState(false);
    const [isShowView2, setShowView2] = useState(false);
    const [isShowAll1, setShowAll1] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [isHideChart, setIsHideChart] = useState(false);
    const [titleName, setTitleName] = useState('');
    const [isShowInfo, setIsShowInfo] = useState( false);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(null);

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
            setShowAll1(settings?.isShowAll1 ?? true);
            setShowView(settings?.isShowView ?? false);
            setShowView2(settings?.isShowView2 ?? true);
            setSelectedUnit(settings?.selectedUnit ?? null);
            setIsHideChart(settings?.isHideChart ?? false);
            setIsShowInfo(settings?.isShowInfo ?? false);
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? true);
        };
        fetchAndSetTitleName(id);
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
                isShowInfo,
                isHideEmptyColumns,
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowView, isShowView2, isShowAll1, selectedUnit, isHideChart,
        isShowInfo,]);

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

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    };

    const handleShowInfo = () => {
        setIsShowInfo(prevState => !prevState);
    };
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const statusBar = useMemo(() => {
        return {
            statusPanels: [{ statusPanel: 'agAggregationComponent' }],
        };
    }, []);
    const defaultColDef = useMemo(() => {
        return {
            editable: false, filter: true, cellStyle: { fontSize: '14.5px' }, width: 150,
        };
    });

    async function prepareData(reload = false) {
        const user = await getCurrentUserLogin();
        let units = await getAllProject();
        units = await getPermissionDataNhomBC('project', user, userClasses, fetchUserClasses, uCSelected_CANVAS, units)
      if (units?.length == 0 || !units) {
            setTitleName(KHONG_THE_TRUY_CAP)
            units = []
        }

        const uniqueUnits = units.reduce((acc, current) => {
            if (!acc.find((unit) => unit.code === current.code)) {
                acc.push(current);
            }
            return acc;
        }, []);
        setListUnit(uniqueUnits)
        // if (!selectedUnit) setSelectedUnit(units[0]?.group)
        let rowData = isShowView2
            ? await getItemFromIndexedDB2('BCNVV_2' + '_' + currentYearCanvas + '_' + companySelect)
            : await getItemFromIndexedDB2('BCNVV_1' + '_' + currentYearCanvas + '_' + companySelect);

        // let rowData = []
        // if (!rowData.length || reload) {
        if (true) {
            setLoading(true);
            let data = await loadDataSoKeToan();
            data = data.filter(e => e.year == currentYearCanvas && (e.company == companySelect || companySelect == 'HQ'));
            data = data.filter((e) => e.consol?.toLowerCase() == 'consol');
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
                let newRow = { ...row };
                uniqueGroups.forEach((group) => {
                    const groupSums = sumGroupColumns(row, group, uniqueUnits);
                    newRow = { ...newRow, ...groupSums };
                });
                return newRow;
            });
            if (isShowView2) {
                await setItemInIndexedDB2('BCNVV_2' + '_' + currentYearCanvas + '_' + companySelect, rowData);
            } else {
                await setItemInIndexedDB2('BCNVV_1' + '_' + currentYearCanvas + '_' + companySelect, rowData);
            }

        }
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
        await setItemInIndexedDB2(key, rowData);
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
        doanhThuData = convertToArrayForSection(doanhThuData, currentMonth);
        let chiPhiData = sumColumns(chiPhiList);
        chiPhiData = convertToArrayForSectionCF(chiPhiData, currentMonth);
        let loiNhuanData = sumColumns(loiNhuanList);
        loiNhuanData = convertToArrayForSection(loiNhuanData, currentMonth);
        let series = createSeries('month', 'th', 'Tiền', 'line');
        let doanhThu = createSectionData('C1-Doanh thu tổng - TH-KH-CK', doanhThuData, [series], 'Doanh thu', null, { enabled: false, })
        let chiPhi = createSectionData('C1-Doanh thu tổng - TH-KH-CK', chiPhiData, [series], 'Chi phí', null, { enabled: false, })
        let loiNhuan = createSectionData('C1-Doanh thu tổng - TH-KH-CK', loiNhuanData, [series], 'Lợi nhuận', null, { enabled: false, })
        return {
            doanhThu,
            chiPhi,
            loiNhuan
        }
    }

    function convertToArrayForSection(data, currentMonth) {
        let result = [];
        for (let i = 1; i <= currentMonth; i++) {
            result.push({
                month: i, 'th': data[`${selectedUnit}_${i}`]
            });
        }
        return result;
    }

    function convertToArrayForSectionCF(data, currentMonth) {
        let result = [];
        for (let i = 1; i <= currentMonth; i++) {
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
        prepareData();
    }, [selectedUnit, isShowAll1, isShowView, currentYearCanvas, currentMonth]);

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
            textAlign: 'left', paddingRight: 10, background: isBold ? "" : 'rgb(237, 237, 237)',
        };
    }

    function createField(field, hide) {
        return {
            field: field,
            headerName: rendHeader(field),
            headerClass: 'right-align-business-name',
            cellRenderer: (params) => {
                return (<div className="cell-action-group">
                    <PopupCellActionBCKD {...params} field={field} allData={rowData} type={'NVV'} view={isShowView2} currentYear={currentYearCanvas}/>
                </div>);
            }, ...Color(),
            cellStyle: (params) => {
                // return { ...isBold(params), textAlign: 'right' }
            },
            ...hide
        };
    }

    async function redenderFields() {
        let fields = [
            {
                field: 'dp', headerName: 'Khoản mục phí', width: 300, pinned: 'left', ...Color(),
                // cellStyle: isBold,
            },
            ...(await renderFieldMoney())];
        return fields;
    }

    async function renderFieldMoney() {
        const teamFields = [
            // {
            //     field: 'change',
            //     width: 130,
            //     columnGroupShow: 'open',
            //     headerClass: 'right-align-important',
            //     headerName: `Sparkline`,
            //     cellRenderer: 'agSparklineCellRenderer',
            //     cellRendererParams: {
            //         sparklineOptions: {
            //             type: 'area',
            //             // marker: { size: 2 },
            //             tooltip: {
            //                 renderer: (params) => {
            //                     const {yValue, xValue} = params;
            //                     return {
            //                         content: formatCurrency((yValue / 1000).toFixed(0)),
            //                         fontSize: '12px',
            //                     };
            //                 },
            //             },
            //         },
            //         valueFormatter: (params) => {
            //             const changeArray = params.value || [];
            //             return changeArray.map((value) => {
            //                 return value === null || isNaN(value) ? 0 : Number(value);
            //             });
            //         },
            //     }
            // }
        ];
        for (let y = 0; y <= 12; y++) {
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
                // const savedColumnState = await getItemFromIndexedDB(tableCol);
                // if (savedColumnState.length) {
                //     setColDefs(loadColumnState(updatedColDefs, savedColumnState));
                // } else {
                //     const simplifiedColumnState = updatedColDefs.map(({field, pinned, width, hide}) => ({
                //         colId: field,
                //         pinned,
                //         width,
                //         hide,
                //     }));
                //     await setItemInIndexedDB(tableCol, simplifiedColumnState);
                //     setColDefs(updatedColDefs);
                // }
                setColDefs(updatedColDefs);
                // }
            } catch (error) {
                console.log(error);
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
        { value: 'A', label: 'Nhóm theo bản chất biến phí, định phí', used: isShowView },
        { value: 'B', label: 'Nhóm khoản mục KQKD dựa theo TK kế toán', used: isShowView2 },
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
                <span>{isShowInfo ? '✅ Bật ghi chú' : '❌ Tắt ghi chú'}</span>
            ),
            onClick: handleShowInfo,
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
                <NotAccessible NotAccessible={titleName}/>
                <div style={{ width: "100%" }}>
                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>{titleName}</span>
                        </div>
                    </div>
                    <div className={css.headerPowersheet2}>
                        <img src="/Group%20197.png" alt="Đơn vị: VND" style={{ width: '130px', marginLeft: '3px' }} />
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
                        {/*                         onChange={toggleSwitch}/>                                <ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo}/>*/}
                        {/*</div>*/}
                        <div className={css.headerAction}>
                            <ActionSelectTypeBaoCao options={options}
                                                    handlers={handlers} />

                            <ActionSelectDanhMucBaoCao selectedUnit={selectedUnit} listUnit={listUnit} handlers={handleUnitChange} />

                            {/*<div className="navbar-item" ref={dropdownRef}>*/}
                            {/*    /!* <img*/}
                            {/*        src={EllipsisIcon}*/}
                            {/*        style={{ width: 32, height: 32, cursor: 'pointer' }}*/}
                            {/*        alt="Ellipsis Icon"*/}
                            {/*        onClick={handleDropdownToggle}*/}
                            {/*    /> *!/*/}
                            {/*    /!*{isDropdownOpen && (<div className="dropdown-menu-button1">*!/*/}
                            {/*    /!*    <ExportableGrid*!/*/}
                            {/*    /!*        api={gridRef.current ? gridRef.current.api : null}*!/*/}
                            {/*    /!*        columnApi={gridRef.current ? gridRef.current.columnApi : null}*!/*/}
                            {/*    /!*        table={table}*!/*/}
                            {/*    /!*        isDropdownOpen={isDropdownOpen}*!/*/}
                            {/*    /!*    />*!/*/}
                            {/*    /!*</div>)}*!/*/}
                            {/*</div>*/}
                            <ActionMenuDropdown popoverContent={popoverContent}
                                                dropdownOpen={dropdownOpen}
                                                setDropdownOpen={setDropdownOpen}
                            />
                        </div>
                    </div>


                    <Loading loading={loading}/>
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
                    {isShowInfo && <div style={{width: '100%', height: 'max-content', boxSizing: "border-box"}}>
                        <RichNoteKTQTRI table={`${table}_Canvas_note`}/>
                    </div>}
                    <div
                        style={{
                            height:isShowInfo? '50vh':'50vh',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            marginTop: '15px',
                        }}
                    >
                        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%', display: 'flex' }}>
                            <div style={{ maxHeight: '50vh', width : '100%' , overflow: 'auto' }}>
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
        </>
    );
}
