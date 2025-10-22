import '../../../../index.css';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';

import {getAllKmns} from '../../../../apisKTQT/kmnsService.jsx';
import {getAllVas} from '../../../../apisKTQT/vasService.jsx';
import {EllipsisIcon} from '../../../../icon/IconSVG.js';
import {calculateBCTC} from './LogicBaoCaoThiChi.js';
import {MyContext} from '../../../../MyContext.jsx';
import css from "../../BaoCao/BaoCao.module.css";
import {handleSaveAgl} from "../../functionKTQT/handleSaveAgl.js";
import {onFilterTextBoxChanged} from "../../../../generalFunction/quickFilter.js";
import {loadColumnState, saveColumnStateToLocalStorage} from "../../functionKTQT/coloumnState.jsx";
import AG_GRID_LOCALE_VN from "../../../Home/AgridTable/locale.jsx";
import {getItemFromIndexedDB2, setItemInIndexedDB2} from "../../storage/storageService.js";
import {formatCurrency} from "../../functionKTQT/formatMoney.js";
import ActionViewSetting from "../../ActionButton/ActionViewSetting.jsx";
import {useParams} from 'react-router-dom';
import ActionHideEmptyRows from "../../ActionButton/ActionHideEmptyRows.jsx";
import ActionDisplayModeSwitch from "../../ActionButton/ActionDisplayModeSwitch.jsx";
import {getFileNotePadByIdController} from "../../../../apis/fileNotePadService.jsx";
import ExportableGrid from "../../popUp/exportFile/ExportableGrid.jsx";
import ActionToggleSwitch from "../../ActionButton/ActionToggleSwitch.jsx";
import NotAccessible from "../../../Canvas/NotAccessible.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import {getPermissionDataBC} from "../../../Canvas/getPermissionDataBC.js";
import {getPermissionDataCty} from "../../../Canvas/getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../Consts/TITLE_HEADER.js";
import ActionDisplayRichNoteSwitch from "../../ActionButton/ActionDisplayRichNoteSwitch.jsx";
import RichNoteKTQTRI from "../../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionToggleSwitch2 from "../../ActionButton/ActionToggleSwitch2.jsx";
import {getAllSettingGroup} from "../../../../apisKTQT/settingGroupService.jsx";


export default function BaoCaoThuchi_CANVAS() {
    const table = 'BaoCaoThuChiCanvas';
    const tableCol = 'BCThuChiCol';
    const key = 'DONGTIEN';
    const tableField = key + "_FIELD";
    const {companySelect, tabSelect, id} = useParams();
    let company = companySelect;
    const {
        currentMonthKTQT,
        listSoKeToan,
        loadDataSoKeToan,
        currentYearKTQT,
        currentMonthCanvas,
        currentYearCanvas
    } = useContext(MyContext);
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInputDauky, setShowInputDauky] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const tableStatusButton = 'BaoCaoThuChiStatusButtonCanvas';
    const [isFullView, setIsFullView] = useState(false);
    const [isShowAll, setShowAll] = useState(false);
    const [titleName, setTitleName] = useState('');
    const [listCom, setListCom] = useState([])
    const [isShowInfo, setIsShowInfo] = useState(false);
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(null);

    const {
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
    } = useContext(MyContext) || {};
    const fetchAndSetTitleName = async () => {
        try {
            const user = await getCurrentUserLogin();
            const listComs = await getPermissionDataCty('cty', user, userClasses, fetchUserClasses, uCSelected_CANVAS)
            if (listComs?.length > 0 || user.data.isAdmin || listComs.some(e => e.code == 'HQ')) {
                setListCom(listComs);
                setTitleName(CANVAS_DATA_PACK.find(e => e.value == key)?.name)
            } else {
                setTitleName(KHONG_THE_TRUY_CAP)
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            setIsFullView(settings?.isFullView ?? false);
            setShowAll(settings?.isShowAll ?? false);
            setIsShowInfo(settings?.isShowInfo ?? false);
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? true);

        };
        fetchAndSetTitleName(id);
        fetchSettings();
    }, []);

    const handleIsFullView = () => {
        setIsFullView((prev) => !prev);
    };
    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                isShowAll,
                isFullView,
                isShowInfo,
                isHideEmptyColumns
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowAll, isFullView, isShowInfo,]);


    const handleIsShowAll = () => {
        setShowAll((prevIsShowAll1) => {
            setHideEmptyColumns(!prevIsShowAll1);
            return !prevIsShowAll1;
        });
    };

    const toggleSwitch = () => {
        handleIsShowAll()
    }
    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
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
            width: 140,
            suppressMenu: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        }),
        []
    );

    function isBold(params) {
        const isBold = params.data.refercode.toString()?.includes('.');
        return {
            textAlign: 'left',
            paddingRight: 10,
        };
    }

    const getField = (month, key) => `t${month}_${key}`;
    const getHeader = (month, key) => `Tháng ${month} ${key}`;
    const createColumn = (month, fieldKey, headerKey, hide) => ({
        field: getField(month, fieldKey),
        headerName: month === 0 ? currentYearCanvas : getHeader(month, headerKey),
        headerClass: 'right-align-important-2',
        suppressMenu: true,
        cellStyle: (params) => {
            return {...isBold(params), textAlign: 'right'}
        },
        width: fieldKey === 'chenhlech' ? 70 : 120,
        cellRenderer: (params) => {
            return (
                <div className="cell-action-group">
                    {formatCurrency(params.value)}
                </div>
            );
        },
        ...hide
    });
    const handleCellValueChanged = async (event) => {
        const rowExistsInUpdatedData = updatedData.some((row) => row.id === event.data.id);
        let newUpdatedData;
        if (rowExistsInUpdatedData) {
            newUpdatedData = updatedData.map((row) => {
                if (row.id === event.data.id) {
                    return {...event.data, business_unit: team};
                }
                return row;
            });
        } else {
            newUpdatedData = [...updatedData, {...event.data, business_unit: team}];
        }
        let updateMonth = event.colDef.field[1];
        let duDauKi = rowData.find((e) => e.refercode === '1');
        let duCuoiKi = rowData.find((e) => e.refercode === '6');
        setUpdatedData(newUpdatedData);
        await handleSaveAgl([...newUpdatedData, duDauKi], table, setUpdatedData);
        loadData();
    };

    const onGridReady = useCallback(async () => {
        loadData();
    }, [company, isShowAll, company]);
    const handleShowInfo = () => {
        setIsShowInfo(prevState => !prevState);
    };
    const getColumnDefs = () => {
        let cols = [
            {field: 'id', headerName: 'ID', hide: true},
            {
                field: 'dp',
                headerName: 'Tiêu đề',
                width: 400,
                pinned: 'left',
                // cellStyle: isBold
            },
            // {
            //     field: 'avg',
            //     headerName: `TB T${currentMonthKTQT - 2}-${currentMonthKTQT - 1}-${currentMonthKTQT}`,
            //     cellStyle: (params) => {
            //         const isBold = params.data.refercode?.includes('.');
            //         return {
            //             textAlign: 'right', paddingRight: 10, fontWeight: isBold ? "normal" : 'bold',
            //         };
            //     },
            //     valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
            //     headerClass: 'right-align-important',
            //     width: 120,
            //     cellClassRules: {
            //         'bold-header': (params) => {
            //             if (!params.data) return;
            //             return params.data.refercode?.toString().split('.').length == 1;
            //         },
            //         'normal-header': (params) => {
            //             if (!params.data) return;
            //             return params.data.refercode?.toString().split('.').length > 1;
            //         },
            //     },
            // },
            {
                field: 't0_thuchien',
                headerName: currentYearCanvas,
                cellStyle: (params) => {
                    // return { ...isBold(params), textAlign: 'right' }
                },
                valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
                headerClass: 'right-align-important',
                width: 120,
            },
            // {
            //     field: 'change',
            //     width: 130,
            //     columnGroupShow: 'open',
            //     headerClass: 'right-align-important',
            //     headerName: `Sparkline T1 - T${currentMonthCanvas}`,
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
        ];
        // let startMonth = isFullView ? 1 : currentMonthKTQT - 5;
        // if (startMonth <= 0) startMonth = 1;
        // const month = currentMonthKTQT;
        // for (let i = startMonth; i <= month; i++) {
        //     cols.push(createColumn(i, 'thuchien', ''));
        //
        // }
        // return cols;
        for (let y = 1; y <= 12; y++) {
            const fieldName = `${y}`;
            let hide = false;
            if (!isFullView) {
                if (!(y >= currentMonthCanvas - 5 && y <= currentMonthCanvas)) {
                    hide = true;
                }
            }
            if (isHideEmptyColumns) {
                const isAllZero = rowData.every((record) => record[`t${fieldName}_thuchien`] === 0);
                if (isAllZero) {
                    hide = true;
                }
            }
            cols.push({
                ...createColumn(fieldName, 'thuchien', '', {hide}),
            });
        }
        return cols;

    };

    async function loadData() {
        setSidebarVisible(false);
        setLoading(true);

        let result = [];
        let soKeToanList = await loadDataSoKeToan();
        soKeToanList = soKeToanList.filter((e) => e.year == currentYearCanvas && (e.company == company || company == 'HQ'));
        soKeToanList = soKeToanList.filter((e) => e.consol?.toLowerCase() == 'consol');
        let kmnsList = await getAllKmns();
        const value = await getAllSettingGroup()
        let groupSettingList = value.filter(e => e?.type == 'kmns');
        kmnsList.forEach(e => {
            if (e.mo_ta) {
                let group = groupSettingList.find((g) => e.mo_ta === g.name);
                e.mo_ta = group.stt + '.' + e.mo_ta
            }
        })
        let vasList = await getAllVas();
        vasList = vasList.filter((e) => e.consol?.toLowerCase() == 'consol' && e.year == currentYearCanvas && (e.company == company || company == 'HQ'));
        result = calculateBCTC(soKeToanList, kmnsList, vasList, currentMonthCanvas);
        if (isShowAll) {
            result = result.filter((item) => {
                for (let i = 1; i <= 12; i++) {
                    const thuchienKey = `t${i}_thuchien`;
                    if (
                        (item[thuchienKey] && item[thuchienKey] != 0) || !item.refercode.includes('.')
                    ) {
                        return true;
                    }
                }
                return false;
            });
        }
        result = result.map((item) => {
            const kmnsItem = kmnsList.find((kmns) => kmns.name === item.header);
            if (kmnsItem) {
                item.dp = kmnsItem.dp;
            } else {
                item.dp = item.header;
            }
            return item;
        });
        await setItemInIndexedDB2(key, result);
        setRowData(result);
        setLoading(false);
    }

    const updateColDefs = async () => {
        let updatedColDefs = getColumnDefs()
        console.log(key + '_FIELD', updatedColDefs.map(item => {
            return {field: item.field, headerName: item.headerName}
        }))
        setColDefs(updatedColDefs);
    };

    useEffect(() => {
        updateColDefs();
    }, [isFullView, currentMonthCanvas, company, currentYearCanvas, rowData]);

    useEffect(() => {
        loadData();
    }, [company, isShowAll, currentMonthCanvas, currentYearCanvas]);

    return (
        <>
            <div className={css.main}>
                <NotAccessible NotAccessible={titleName}/>
                <div style={{width: "100%"}}>
                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>{titleName}</span>

                        </div>

                    </div>
                    <div className={css.headerPowersheet2}>
                        <p> <img src="/Group%20197.png" alt="Đơn vị: VND" style={{ width: '130px', marginLeft: '3px' }} /></p>
                        <div className={css.toogleChange}>
                            <ActionToggleSwitch2 label="Ẩn dữ liệu trống"
                                                 isChecked={isShowAll && isHideEmptyColumns}
                                                 onChange={toggleSwitch}/>
                            <ActionDisplayModeSwitch isChecked={isFullView} onChange={handleIsFullView}/>
                            <ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo}/>
                        </div>
                        <div className={css.headerAction}>
                            <div className="navbar-item">
                                {/* <img
                                    src={EllipsisIcon}
                                    style={{width: 32, height: 32}}
                                    alt="Ellipsis Icon"
                                    onClick={handleDropdownToggle}
                                /> */}
                                {isDropdownOpen && (
                                    <div className={css.dropdownMenu}>
                                        <ExportableGrid
                                            api={gridRef.current ? gridRef.current.api : null}
                                            columnApi={gridRef.current ? gridRef.current.columnApi : null}
                                            table={table}
                                            setDropdownOpen={setIsDropdownOpen}
                                            ref={dropdownRef}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <ActionViewSetting table={table}/>
                            </div>
                        </div>
                    </div>
                    {isShowInfo && <div style={{width: '100%', height: '11%', boxSizing: "border-box"}}>
                        <RichNoteKTQTRI table={`${table}_Canvas_note`}/>
                    </div>}
                    <div
                        style={{
                            height: isShowInfo ? '76vh' : '85vh',
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
                                <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>
                            </div>
                        )}
                        <div className="ag-theme-quartz" style={{height: '100%', width: '100%', display: 'flex'}}>
                            <div
                                style={{
                                    flex: isSidebarVisible ? '75%' : '100%',
                                    transition: 'flex 0.3s',
                                }}
                            >
                                <AgGridReact
                                    treeData={true}
                                    getDataPath={(data) => data.refercode?.toString().split('.')}
                                    statusBar={statusBar}
                                    enableRangeSelection
                                    ref={gridRef}
                                    rowData={rowData}
                                    defaultColDef={defaultColDef}
                                    columnDefs={colDefs}
                                    rowSelection="multiple"
                                    onCellValueChanged={handleCellValueChanged}
                                    animateRows
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
                                            if (!params.data) return;
                                            return params.data?.refercode?.toString().split('.').length === 1;
                                        },
                                    }}
                                    onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                                    onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                                />
                            </div>
                            {/*{isSidebarVisible && <AnalysisSideBar table={table + ` - ${team}`} gridRef={gridRef}/>}*/}
                            {/*{showInputDauky && <CreateInputDauky onClose={handleClosePopup} company={company}/>}*/}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
