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
import {EllipsisIcon} from "../../../../../icon/IconSVG.js";
import AG_GRID_LOCALE_VN from "../../../../Home/AgridTable/locale.jsx";

import {useParams} from 'react-router-dom';
import ActionSelectTypeBaoCao from "../../../ActionButton/ActionSelectTypeBaoCao.jsx";
import ActionSelectDanhMucBaoCao from "../../../ActionButton/ActionSelectDanhMucBaoCao.jsx";
import {getFileNotePadByIdController} from "../../../../../apis/fileNotePadService.jsx";
import ExportableGrid from "../../../popUp/exportFile/ExportableGrid.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import {getPermissionDataNhomDV} from "../../../../Canvas/getPermissionDataNhomBC.js";
import NotAccessible from "../../../../Canvas/NotAccessible.jsx";
import ActionDisplayRichNoteSwitch from "../../../ActionButton/ActionDisplayRichNoteSwitch.jsx";
import RichNoteKTQTRI from "../../../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionToggleSwitch2 from "../../../ActionButton/ActionToggleSwitch2.jsx";
import {getAllSettingGroup} from "../../../../../apisKTQT/settingGroupService.jsx";
import { Button, Dropdown } from 'antd';
import { ChevronDown } from 'lucide-react';
import ActionMenuDropdown from '../../../ActionButton/ActionMenuDropdown.jsx';
import Loading from '../../../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function BaoCaoGroupMonth_CANVAS() {
    const {companySelect, id, tabSelect} = useParams();
    const table = 'BaoCaoGroupMonthCanvas';
    const {
        isNotePadBaoCao,
        loadDataSoKeToan,
        currentMonthCanvas,
        currentYearCanvas,
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
    } = useContext(MyContext);
    let selectedCompany = companySelect;

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
    const key = 'KQKD_NHOMDV2';
    const tableStatusButton = 'BCGroupMonthStatusButtonCanvas';
    const [isShowView, setShowView] = useState(null);
    const [isShowView2, setShowView2] = useState(null);
    const [isShowView3, setShowView3] = useState(null);
    const [isShowAll1, setShowAll1] = useState(null);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(null);
    const [isHideChart, setIsHideChart] = useState(null);
    const [titleName, setTitleName] = useState('');
    const [isShowInfo, setIsShowInfo] = useState(tabSelect == 'daas' ? true : false);

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
            setSelectedUnit(settings?.selectedUnit || null)
            setIsHideChart(settings?.isHideChart ?? false)
            setShowAll1(settings?.isShowAll1 ?? true);
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? true);
            setShowView(settings?.isShowView ?? false);
            setShowView2(settings?.isShowView2 ?? true);
            setShowView3(settings?.isShowView3 ?? false);
            setIsShowInfo(settings?.isShowInfo ?? false);
        };
        fetchSettings();
        fetchAndSetTitleName(id);

    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                isShowView,
                selectedUnit,
                isShowView2,
                isShowView3,
                isShowAll1,
                isHideEmptyColumns,
                isHideChart,
                isShowInfo,
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowView,
        isShowView2,
        isShowView3,
        isShowAll1,
        isHideEmptyColumns,
        isHideChart,
        selectedUnit,
        isShowInfo,
    ]);

    function isBold(params) {
        const isBold = params.data.layer.toString()?.includes('.');
        return {
            textAlign: 'left',
            paddingRight: 10,
            // background: isBold ? "" : 'rgb(237, 237, 237)',
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
    const handleShowInfo = () => {
        setIsShowInfo(prevState => !prevState);
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
            suppressMenu: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    async function prepareData() {
        setLoading(true);
        let data = await loadDataSoKeToan();
        data = data.filter(e => e.year == currentYearCanvas
            // && (e.company == selectedCompany || selectedCompany == 'HQ')
        );
        data = data.filter((e) => e.consol?.toLowerCase() == 'consol');
        const user = await getCurrentUserLogin();
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
        units = await getPermissionDataNhomDV('unit', user, userClasses, fetchUserClasses, uCSelected_CANVAS, units)
        if (units?.length == 0 || !units) {
            setTitleName(KHONG_THE_TRUY_CAP)
            units = []
        }
        // units = units.filter(e => e.company == selectedCompany || selectedCompany == 'HQ');
        // units = setPermissionsListUnit(units, currentUser)
        if (units?.length > 0) {
            units = units.filter(e => !e.group?.includes('Internal'))
        }
        setListUnit(units)
        // if (!selectedUnit) setSelectedUnit(units[0]?.group)
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
        // let rowData = isShowView2
        //     ? await getItemFromIndexedDB('BCNDV2_2' + '_' + currentYearCanvas + '_' + companySelect)
        //     : await getItemFromIndexedDB('BCNDV2_1' + '_' + currentYearCanvas + '_' + companySelect);
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
                // for (let j = 1; j <= 12; j++) {
                //     if ((item[`${selectedUnit}_${j}`] !== 0 && item[`${selectedUnit}_${j}`]) || !item.layer.includes('.')) {
                //         return true;
                //     }
                // }
                return false;
            });
        }

        // if (isShowView2) {
        //     await setItemInIndexedDB('BCNDV2_2' + '_' + currentYearCanvas + '_' + companySelect, rowData);
        // } else {
        //     await setItemInIndexedDB('BCNDV2_1' + '_' + currentYearCanvas + '_' + companySelect, rowData);
        // }
        await setItemInIndexedDB2(key, newRowData);
        setRowData(newRowData);
        if (selectedUnit) {
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
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
    }, [selectedCompany, currentYearCanvas]);

    useEffect(() => {
        prepareData();
    }, [isShowAll1, selectedUnit, isShowView, isShowView2, isShowView3, selectedCompany, currentYearCanvas]);

    const rendHeader = (teamKey) => {
        const parts = teamKey.split('_');
        if (parts[1] == '0') {
            return 'Lũy kế năm';
        }
        let header = 'Tháng ' + parts[1] || 'Khác';
        return `${header}`;
    };

    function createField(field, hide) {
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
                                             view={isShowView2} currentYear={currentYearCanvas}/>
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
        {value: 'C', label: 'Nhóm theo dạng trực tiếp, phân bổ', used: isShowView3},
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
                <div style={{width: isNotePadBaoCao ? "80%" : "100%"}}>
                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>{titleName}</span>
                            {/*<div className={css.toogleChange}>*/}
                            {/*    <ActionToggleSwitch label="Ẩn dòng trống" isChecked={isShowAll1}*/}
                            {/*                        onChange={handleIsShowAll1}/>*/}
                            {/*</div>*/}

                        </div>
                    </div>
                    <div className={css.headerPowersheet2}>
                        <img src="/Group%20197.png" alt="Đơn vị: VND" style={{ width: '130px', marginLeft: '3px' }} />
                        {/*<div className={css.toogleChange}>*/}
                        {/*    <ActionToggleSwitch2 label="Ẩn dữ liệu trống"*/}
                        {/*                         isChecked={isShowAll1 && isHideEmptyColumns}*/}
                        {/*                         onChange={toggleSwitch}/>*/}
                        {/*</div>*/}
                        {/*<div className={css.toogleChange}>*/}
                        {/*    <ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo}/>*/}
                        {/*</div>*/}
                        <div className={css.headerAction}>
                            <ActionSelectTypeBaoCao options={options} handlers={handlers}/>
                            <ActionSelectDanhMucBaoCao selectedUnit={selectedUnit} listUnit={listUnit}
                                                       handlers={handleUnitChange}/>
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

                            <ActionMenuDropdown popoverContent={popoverContent}
                                                dropdownOpen={dropdownOpen}
                                                setDropdownOpen={setDropdownOpen}
                            />
                        </div>
                    </div>
                    {isShowInfo && <div style={{width: '100%', height: 'max-content', boxSizing: "border-box"}}>
                        <RichNoteKTQTRI table={`${table}_Canvas_note`}/>
                    </div>}
                    <Loading loading={loading}/>
                    <div
                        style={{
                            height: isShowInfo ? '50vh' : '50vh',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            marginTop: '15px',
                        }}
                    >

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
                        <div className="ag-theme-quartz"
                             style={{height: '100%', width: '100%', display: 'flex'}}>
                            <div style={{maxHeight: '50vh', width: '100%',}}>
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
                                    domLayout="normal"
                                    rowClassRules={{
                                        'row-head': (params) => {
                                            return params.data.layer?.toString().split('.').length === 1;
                                        },
                                    }}
                                />
                            </div>
                            {/*{isSidebarVisible && <AnalysisSideBar table={table} gridRef={gridRef}/>}*/}
                        </div>
                        {/*<div style={{height: '76vh'}}>{isNoteVisible &&*/}
                        {/*    <NoteComponent type={noteType} onClose={() => setNoteVisible(false)}/>}*/}
                        {/*</div>*/}
                    </div>
                    {
                        isNotePadBaoCao &&
                        <div className={css.phantich}>
                            {/*<PhanTichNote table={table}/>*/}
                        </div>
                    }
                </div>
            </div>
        </>
    );
}
