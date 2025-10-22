import '../../../../index.css';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import '../../../Home/AgridTable/agComponent.css'
import {getAllVas} from '../../../../apisKTQT/vasService.jsx';
import PopupCellActionCDTC from '../../popUp/cellAction/PopUpCellActionCDTC.jsx';
import {MyContext} from "../../../../MyContext.jsx";
import VasDataPopup from "../../popUp/cellAction/VasDataPopUp.jsx";
import {loadBCCCTC} from "./logicBCCDTC.js";
import css from "../BaoCao.module.css";
import {getItemFromIndexedDB2, setItemInIndexedDB2} from "../../storage/storageService.js";
import {formatCurrency} from "../../functionKTQT/formatMoney.js";
import {saveColumnStateToLocalStorage} from "../../functionKTQT/coloumnState.jsx";
import AG_GRID_LOCALE_VN from "../../../Home/AgridTable/locale.jsx";
import {useParams} from 'react-router-dom';
import ActionHideEmptyRows from "../../ActionButton/ActionHideEmptyRows.jsx";
import ActionDisplayModeSwitch from "../../ActionButton/ActionDisplayModeSwitch.jsx";
import {getFileNotePadByIdController} from "../../../../apis/fileNotePadService.jsx";
import ActionToggleSwitch from "../../ActionButton/ActionToggleSwitch.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import {getPermissionDataBC} from "../../../Canvas/getPermissionDataBC.js";
import NotAccessible from "../../../Canvas/NotAccessible.jsx";
import {getPermissionDataCty} from "../../../Canvas/getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../Consts/TITLE_HEADER.js";
import {Typography} from "antd";
import ActionSelectCompanyBaoCao from "../../ActionButton/ActionSelectCompanyBaoCao.jsx";
import ActionSelectTypeBaoCao from "../../ActionButton/ActionSelectTypeBaoCao.jsx";
import ActionViewSetting from "../../ActionButton/ActionViewSetting.jsx";
import ActionDisplayRichNoteSwitch from "../../ActionButton/ActionDisplayRichNoteSwitch.jsx";
import RichNoteKTQTRI from "../../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionToggleSwitch2 from "../../ActionButton/ActionToggleSwitch2.jsx";

export default function BaoCaoCDTC_CANVAS() {
    const {companySelect, tabSelect, id} = useParams();
    let company = companySelect;
    let key = 'CANDOI_TAICHINH'
    const table = key + "_COMPANY";
    const tableField = key + "_FIELD";

    const tableCol = 'CDTCCol';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const {currentMonthKTQT, currentYearKTQT, currentMonthCanvas, currentYearCanvas} = useContext(MyContext)
    const currentMonth = tabSelect == 'daas' ? 12 : currentMonthCanvas;
    const tableStatusButton = 'CanDoiTaiChinhStatusButtonCanvas';
    const [isFullView3, setIsFullView3] = useState(false);
    const [isShowAll, setShowAll] = useState(false);
    const [titleName, setTitleName] = useState('');
    const [listCom, setListCom] = useState([])

    const [isShowInfo, setIsShowInfo] = useState(false);
    const [companySelected, setCompanySelected] = useState([])
    const [isHideEmptyColumns, setHideEmptyColumns] = useState(false);

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
            setIsFullView3(settings?.isFullView3 ?? false);
            setShowAll(settings?.isShowAll ?? false);
            setIsShowInfo(settings?.isShowInfo ?? false);
            setCompanySelected(settings?.companySelected || []);
            setHideEmptyColumns(settings?.isHideEmptyColumns ?? false);
        };
        fetchAndSetTitleName(id);
        fetchSettings();
    }, []);

    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                isShowAll,
                isFullView3,
                isShowInfo,
                isHideEmptyColumns,
                companySelected
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowAll, isFullView3, isShowInfo,]);


    const handleIsShowAll = () => {
        setShowAll((prevIsShowAll1) => {
            setHideEmptyColumns(!prevIsShowAll1);
            return !prevIsShowAll1;
        });
    };

    const toggleSwitch = () => {
        handleIsShowAll()
    }

    const handleIsFullView3 = () => {
        setIsFullView3((prev) => !prev);
    };
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
            suppressMenu: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        }),
        []
    );
    const getField = (month, key) => `t${month}_${key}`;
    const getHeader = (headerKey, key) => `${key} ${headerKey}`;
    // cols.push(createColumn(i, 'ending_net', 'Tháng'));
    const createColumn = (month, fieldKey, headerKey, hide) => ({
        field: getField(month, fieldKey),
        headerName: month === 0 ? currentYearCanvas : getHeader(month, headerKey),
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
            textAlign: 'left',
            paddingRight: 10,
            // background: isBold ? "" : 'rgb(237, 237, 237)',
        };
    }

    const handleShowInfo = () => {
        setIsShowInfo(prevState => !prevState);
    };
    const onGridReady = useCallback(async () => {
        loadData();
    }, [company, isShowAll, currentMonth, currentYearCanvas, companySelected]);
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
                if (!(y >= currentMonth - 2 && y <= currentMonth)) {
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

        if (companySelected && companySelected.length > 0) {
            setSidebarVisible(false);
            setLoading(true);
            let vasList = await getAllVas();
            vasList = vasList.filter(e => e.year == currentYearCanvas);
            await setItemInIndexedDB2(key, loadBCCCTC(vasList, currentMonth));
            if (companySelected.some(e => e.code != 'HQ')) {
                vasList = vasList.filter(e => companySelected.some(c => c.code == e.company));
            }
            vasList = vasList.filter(e => e.consol?.toLowerCase() == 'consol');
            let rowDataList = loadBCCCTC(vasList, currentMonth)
            if (isShowAll) {
                rowDataList = rowDataList.filter(e => {
                    let isShow = false;
                    for (let i = 1; i <= currentMonth; i++) {
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
    }


    const updateColDefs = async () => {
        let updatedColDefs = getColumnDefs()
        setColDefs(updatedColDefs);
    };


    useEffect(() => {
        updateColDefs();
    }, [isFullView3, currentMonth, company, isShowAll, rowData]);

    useEffect(() => {
        loadData();
        const tableSettings = {
            companySelected,
            isShowAll,
            isHideEmptyColumns
        }
        setItemInIndexedDB2(tableStatusButton, tableSettings);
    }, [company, isShowAll, currentMonth, currentYearCanvas, companySelected]);


    return (
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
                        <ActionDisplayModeSwitch isChecked={isFullView3}
                                                 onChange={handleIsFullView3}/>

                        <ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo}/>
                    </div>
                    <div className={css.headerAction}>
                        <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                                   valueSelected={companySelected}/>
                        <VasDataPopup/>

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
    );
}
