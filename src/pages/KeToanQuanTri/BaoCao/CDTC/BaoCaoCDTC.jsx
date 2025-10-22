import '../../../../index.css';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';

import {getAllVas} from '../../../../apisKTQT/vasService.jsx';
import PopupCellActionCDTC from '../../popUp/cellAction/PopUpCellActionCDTC.jsx';
import {MyContext} from "../../../../MyContext.jsx";
import VasDataPopup from "../../popUp/cellAction/VasDataPopUp.jsx";
import {loadBCCCTC} from "./logicBCCDTC.js";
import css from "../BaoCao.module.css";
import {RefIcon} from "../../../../icon/IconSVG.js";
import {getItemFromIndexedDB2, setItemInIndexedDB2} from "../../storage/storageService.js";
import {formatCurrency} from "../../functionKTQT/formatMoney.js";
import {loadColumnState, saveColumnStateToLocalStorage} from "../../functionKTQT/coloumnState.jsx";
import AG_GRID_LOCALE_VN from "../../../Home/AgridTable/locale.jsx";
import ActionHideEmptyRows from "../../ActionButton/ActionHideEmptyRows.jsx";
import ActionDisplayModeSwitch from "../../ActionButton/ActionDisplayModeSwitch.jsx";
import ActionToggleSwitch from "../../ActionButton/ActionToggleSwitch.jsx";
import ActionToggleSwitch2 from "../../ActionButton/ActionToggleSwitch2.jsx";
import '../../../Home/AgridTable/agComponent.css'
import { Button, Dropdown } from 'antd';
import { ChevronDown } from 'lucide-react';
import ActionMenuDropdown from '../../ActionButton/ActionMenuDropdown.jsx';
import Loading from '../../../Loading/Loading.jsx';

export default function BaoCaoCDTC({
                                       company,
                                   }) {
    const table = 'CanDoiTaiChinh';
    const tableCol = 'CDTCCol';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    let {currentMonthKTQT, currentYearKTQT} = useContext(MyContext)


    const tableStatusButton = 'CanDoiTaiChinhStatusButton';
    const [isFullView3, setIsFullView3] = useState(false);
    const [isShowAll, setShowAll] = useState(false);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            setIsFullView3(settings?.isFullView3 ?? false);
            setShowAll(settings?.isShowAll ?? false);
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? false);
        };

        fetchSettings();
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                isShowAll,
                isFullView3,
                isHideEmptyColumns,
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowAll, isFullView3]);


    const handleIsShowAll = () => {
        setShowAll((prevIsShowAll1) => {
            setHideEmptyColumns(!prevIsShowAll1);
            return !prevIsShowAll1;
        });
    };

    const toggleSwitch = () => {
        handleIsShowAll()
    }

    const defaultColDef = useMemo(
        () => ({
            editable: false,
            filter: true,
            cellStyle: {
                fontSize: '14.5px',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-family)',
            },
            resizeable: true,
            width: 150,
        }),
        []
    );
    const getField = (month, key) => `t${month}_${key}`;
    const getHeader = (headerKey, key) => `${key} ${headerKey}`;
    // cols.push(createColumn(i, 'ending_net', 'Tháng'));
    const createColumn = (month, fieldKey, headerKey, hide) => ({
        field: getField(month, fieldKey),
        headerName: month === 0 ? currentYearKTQT : getHeader(month, headerKey),
        headerClass: 'right-align-important-2',
        suppressMenu: true,
        cellRenderer: (params) => {
            return (
                <div className="cell-action-group">
                    <PopupCellActionCDTC
                        {...params}
                        id={params.data.header}
                        table={table}
                        field={params.field}
                        company={company}
                    />
                </div>
            );
        },
        valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
        cellStyle: (params) => {
            // return {...isBold(params), textAlign: 'right'}
        },
        ...hide

    });

    function isBold(params) {
        const isBold = params.data.refercode.toString()?.includes('.');
        return {
            textAlign: 'left', paddingRight: 10,
        };
    }

    const onGridReady = useCallback(async () => {
        loadData();
    }, [company, isShowAll, currentMonthKTQT, currentYearKTQT]);
    const getColumnDefs = () => {
        let cols = [
            {field: 'id', headerName: 'ID', hide: true},
            {
                field: 'header',
                headerName: 'Tiêu đề',
                width: 430,
                pinned: 'left',
                // cellStyle: isBold,
            },
            {
                field: 'code',
                headerName: 'Code',
                width: 60,
                headerClass: 'right-align-important',
                // cellStyle: isBold,
            },
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
            //             // marker: {size: 2},
            //             tooltip: {
            //                 renderer: (params) => {
            //                     const {yValue, xValue} = params;
            //                     return {
            //                         content: formatCurrency((yValue / 1000).toFixed(0)),
            //                         fontSize: '12px',
            //                     };
            //                 },
            //             },
            //             fill: 'rgba(174,211,191,0.59)',
            //             line: {
            //                 stroke: '#4ca171',
            //                 strokeWidth: 1
            //             },
            //         },
            //         valueFormatter: (params) => {
            //             const changeArray = params.value || [];
            //             return changeArray.map((value) => {
            //                 return value === null || isNaN(value) ? 0 : Number(value);
            //             });
            //         },
            //     },
            //     cellStyle: isBold
            // },
            {
                field: 't0_tien',
                headerName: 'Đầu kỳ',
                valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
                headerClass: 'right-align-important',
                width: 100,
                cellStyle: (params) => {
                    // return {...isBold(params), textAlign: 'right'}
                },
            },
        ];

        for (let y = 1; y <= 12; y++) {
            let hide = false;
            if (!isFullView3) {
                if (!(y >= currentMonthKTQT - 2 && y <= currentMonthKTQT)) {
                    hide = true;
                }
            }
            if (isHideEmptyColumns) {
                const isAllZero = rowData.every((record) => record[`t${y}_tien`] === 0);
                if (isAllZero) {
                    hide = true;
                }
            }
            cols.push(createColumn(y, 'tien', 'Tháng', {hide}));
        }
        return cols;
    };


    async function loadData() {
        setSidebarVisible(false);
        setLoading(true);
        let vasList = await getAllVas();
        vasList = vasList.filter(e => e.year == currentYearKTQT);
        vasList = vasList.filter(e => e.consol?.toLowerCase() == 'consol');
        let rowDataList = loadBCCCTC(vasList,12)
        if (isShowAll) {
            rowDataList = rowDataList.filter(e => {
                let isShow = false;
                for (let i = 1; i <= currentMonthKTQT; i++) {
                    if (e[`t${i}_tien`] !== 0) {
                        isShow = true;
                        break;
                    }
                }
                return isShow || !e.refercode.includes('.')
            })
        }
        setRowData(rowDataList);
        setLoading(false);
    }


    const updateColDefs = async () => {
        let updatedColDefs = getColumnDefs()
        setColDefs(updatedColDefs);

        // const savedColumnState = await getItemFromIndexedDB2(tableCol);
        //     if (savedColumnState.length) {
        //         setColDefs(loadColumnState(updatedColDefs, savedColumnState));
        //     } else {
        //         const simplifiedColumnState = updatedColDefs.map(({field, pinned, width, hide}) => ({
        //             colId: field,
        //             pinned,
        //             width,
        //             hide,
        //         }));
        //         await setItemInIndexedDB2(tableCol, simplifiedColumnState);
        //         setColDefs(updatedColDefs);
        // }
    };


    useEffect(() => {
        updateColDefs();
    }, [isFullView3, currentMonthKTQT, isShowAll, company, rowData]);

    useEffect(() => {
        loadData();
    }, [company, isShowAll, currentMonthKTQT, currentYearKTQT]);

    function handleUpdate() {
        loadData();
    }

    const handleViewFull3 = () => {
        setIsFullView3(!isFullView3);
    };

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const items = [
        {
            key: '0',
            label: (
                <span>{isShowAll && isHideEmptyColumns ? '✅ Bật ẩn dữ liệu trống' : '❌ Tắt ẩn dữ liệu trống'}</span>

            ),
            onClick: toggleSwitch,
        },
        {
            key: '1',
            label: (
                <span>{isFullView3 ? '✅ Bật rút gọn' : '❌ Tắt rút gọn'}</span>
            ),
            onClick: handleViewFull3,
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
                            <span>Báo cáo Cân đối tài chính</span>
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
                            {/*                         isChecked={isShowAll && isHideEmptyColumns}*/}
                            {/*                         onChange={toggleSwitch}/>*/}
                            {/*    <ActionDisplayModeSwitch isChecked={isFullView3} onChange={handleViewFull3}/>*/}
                            {/*</div>*/}
                        </div>
                        <div className={css.headerAction}>
                            <VasDataPopup/>
                        </div>
                        <ActionMenuDropdown popoverContent={popoverContent}
                                            dropdownOpen={dropdownOpen}
                                            setDropdownOpen={setDropdownOpen}
                        />
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
                        <Loading loading={loading}/>

                        <div className="ag-theme-quartz" style={{height: '100%', width: '100%', display: 'flex'}}>
                            <div style={{flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s',}}>
                                <AgGridReact
                                    treeData={true}
                                    // groupDefaultExpanded={-1}
                                    getDataPath={(data) => data.refercode?.toString().split('.')}
                                    statusBar={statusBar}
                                    enableRangeSelection
                                    ref={gridRef}
                                    rowData={rowData}
                                    defaultColDef={defaultColDef}
                                    columnDefs={colDefs}
                                    rowSelection="multiple"
                                    //   pagination
                                    // onCellValueChanged={handleCellValueChanged}
                                    //   paginationPageSize={500}
                                    animateRows
                                    //   paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
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
                                            return params.data.refercode?.toString().split('.').length === 1;
                                        },
                                    }}
                                    onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                                    onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                                />
                            </div>
                            {/*{isSidebarVisible && <AnalysisSideBar table={table + ` - ${team}`} gridRef={gridRef}/>}*/}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
