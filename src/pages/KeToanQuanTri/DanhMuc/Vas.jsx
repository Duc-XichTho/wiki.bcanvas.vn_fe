'use strict';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import {AgGridReact} from 'ag-grid-react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {toast} from 'react-toastify';
import '../../Home/AgridTable/agComponent.css';
import {getAllVas} from '../../../apisKTQT/vasService.jsx';
import {formatCurrency} from '../functionKTQT/formatMoney.js';
import css from "../KeToanQuanTriComponent/KeToanQuanTri.module.css"
import {onFilterTextBoxChanged} from "../../../generalFunction/quickFilter.js";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import PopupDeleteRenderer from "../popUp/popUpDelete.jsx";
import ExportableGrid from "../popUp/exportFile/ExportableGrid.jsx";
import {EllipsisIcon} from "../../../icon/IconSVG.js";
import ActionResetColumn from "../ActionButton/ActionResetColumn.jsx";
import {getCurrentDateTimeWithHours} from "../functionKTQT/formatDate.js";
import {getAllCompany} from "../../../apis/companyService.jsx";
import {loadColumnState, saveColumnStateToLocalStorage} from "../functionKTQT/coloumnState.jsx";
import {handleSaveAgl} from "../functionKTQT/handleSaveAgl.js";
import {getItemFromIndexedDB2, setItemInIndexedDB2} from "../storage/storageService.js";
import {MyContext} from "../../../MyContext.jsx";
import {updateAll} from "../functionKTQT/updateAll.js";
import {updateAllVASFromSKT} from "../functionKTQT/updateAllVASFromSKT.js";
import {Typography} from "antd";
import ActionCreate from "../../Home/AgridTable/actionButton/ActionCreate.jsx";
import ActionDisplayModeSwitch from "../ActionButton/ActionDisplayModeSwitch.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {permissionForKtqt} from "../functionKTQT/permissionForKtqt/permissionForKtqt.js";
import Loading from '../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function Vas({company, updateVas, call}) {
    const {currentMonth, currentYearKTQT, isTriggeredVas, loadData, yearCDSD, userClasses, fetchUserClasses, setIsUpdateNoti ,isUpdateNoti} = useContext(MyContext)
    const [selectedYear, setSelectedYear] = useState(`${2024}`);
    const [permission, setPermission] = useState(false);
    const table = 'Vas';
    const tableCol = 'VasCol';
    const key = 'DANHMUC_CDPS';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [checkColumn, setCheckColumn] = useState(true);
    const [tongDauKy, setTongDauKy] = useState(true);

    const tableStatusButton = 'VasStatusButton';
    const [isShowAll1, setShowAll1] = useState(false);
    const [isFullView, setIsFullView] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getItemFromIndexedDB2(tableStatusButton);
            // setShowAll1(settings?.isShowAll1 ?? true);
            setIsFullView(settings?.isFullView ?? true);
        };

        fetchSettings();
    }, [call]);

    useEffect(() => {
        const saveSettings = async () => {
            const tableSettings = {
                isShowAll1,
                isFullView,
            };
            await setItemInIndexedDB2(tableStatusButton, tableSettings);
        };

        saveSettings();
    }, [isShowAll1, isFullView]);
    async function EditTable() {
        // const user = await getCurrentUserLogin()
        // let permissions = await permissionForKtqt(user, userClasses, fetchUserClasses)
        // setPermission(permissions)
        return {editable: true}
    }


    const defaultColDef = useMemo(async () => {
        return {
            // ... await EditTable(),
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            wrapHeaderText: true,
            autoHeaderHeight: true,
            editable: true
        };
    });
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const handleFileImported = (importedData) => {
        setRowData((prevRowData) => [...prevRowData, ...importedData]);
    };
    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    function fetchData() {
        getAllVas().then(async (data) => {
            let filteredData = data
                .filter((e) => company === 'HQ' ? e.consol?.toLowerCase() == 'consol' : e.company === company)
                .sort((a, b) => {
                    if (!a.ma_tai_khoan && a.ma_tai_khoan !== 0) return -1; // null, '', undefined -> move a to top
                    if (!b.ma_tai_khoan && b.ma_tai_khoan !== 0) return 1;  // null, '', undefined -> move b to top
                    return a.ma_tai_khoan.localeCompare(b.ma_tai_khoan);
                });
            if (call == 'cdsd') {
                filteredData = filteredData.filter(e => e.year == yearCDSD);
            } else {
                if (currentYearKTQT !== 'toan-bo') {
                    filteredData = filteredData.filter(e => e.year == currentYearKTQT);
                }
            }
            let tdk = 0
            filteredData.forEach(e => {
                tdk += parseFloat(e.t1_open_net || 0)
            });

            setTongDauKy(tdk);
            setLoading(false);
            await setItemInIndexedDB2(key, filteredData);
            setRowData(filteredData); // Cập nhật dữ liệu đã lọc
        });
    }


    const handleUpdateVAS = async () => {
        setIsSyncing(true); // Bắt đầu hiệu ứng xoay
        try {
            const updatedVas = company === 'HQ' ? await updateAll() : await updateAllVASFromSKT(company, selectedYear); // Cập nhật toàn bộ VAS
            if (updatedVas.length > 0) {
                await onGridReady()
                toast.success('Dữ liệu VAS đã được cập nhật thành công!');
            } else {
                toast.info('Không có thay đổi nào cần cập nhật.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi cập nhật VAS.');
        } finally {
            setIsSyncing(false); // Kết thúc hiệu ứng xoay
        }
    };
    const onGridReady = useCallback(async () => {
        fetchData();
        setLoading(true);
    }, [company, updateVas, selectedYear, loadData]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [company, currentYearKTQT, isTriggeredVas, loadData]);

    const createColumn = (field, headerName, hide) => ({
        field,
        headerName,
        headerClass: 'right-align-important',
        valueFormatter: (params) => formatCurrency(params.value),
        cellStyle: {
            textAlign: 'right', color: headerName.toLowerCase().includes("nợ")
                ? '#28a745'
                : headerName.toLowerCase().includes("có")
                    ? '#dc3545'
                    : undefined,
        },
        width: 120,
        hide,
        editable: (field === 't1_open_no' || field === "t1_open_co"),
        ...filter(),
        cellClass: headerName.toLowerCase().includes("net") ? 'custom-blue-cell' : '',

    });

    const createFieldsForMonth = (month, isFullView) => {
        const baseFields = [
            {
                field: `t${month}_no`, headerName: `Tháng ${month} nợ`, headerClass: 'right-align-important',
                valueFormatter: (params) => formatCurrency(params.value),
                cellStyle: {textAlign: 'right'},
                hide: !isFullView
            },
            {
                field: `t${month}_co`, headerName: `Tháng ${month} có`, headerClass: 'right-align-important',
                valueFormatter: (params) => formatCurrency(params.value),
                cellStyle: {textAlign: 'right'},
                hide: !isFullView
            },
            {
                field: `t${month}_ending_no`, headerName: `Tháng ${month} EB nợ`, headerClass: 'right-align-important',
                valueFormatter: (params) => formatCurrency(params.value),
                cellStyle: {textAlign: 'right'},
                hide: !isFullView
            },
            {
                field: `t${month}_ending_co`, headerName: `Tháng ${month} EB có`, headerClass: 'right-align-important',
                valueFormatter: (params) => formatCurrency(params.value),
                cellStyle: {textAlign: 'right'},
                hide: !isFullView
            },
            {
                field: `t${month}_ending_net`,
                headerName: `Tháng ${month} EB net`,
                headerClass: 'right-align-important',
                valueFormatter: (params) => formatCurrency(params.value),
                cellStyle: {textAlign: 'right'},
            },
        ];
        if (month === 1) {
            baseFields.unshift(
                {
                    field: `t${month}_open_no`,
                    headerName: `Tháng ${month} OB nợ`,
                    headerClass: 'right-align-important',
                    valueFormatter: (params) => formatCurrency(params.value),
                    cellStyle: {textAlign: 'right'},
                },
                {
                    field: `t${month}_open_co`,
                    headerName: `Tháng ${month} OB có`,
                    headerClass: 'right-align-important',
                    valueFormatter: (params) => formatCurrency(params.value),
                    cellStyle: {textAlign: 'right'},
                },
                {
                    field: `t${month}_open_net`,
                    headerName: `Tháng ${month} OB net`,
                    headerClass: 'right-align-important',
                    valueFormatter: (params) => formatCurrency(params.value),
                    cellStyle: {textAlign: 'right'},
                }
            );
        }

        // Lọc các cột dựa trên isFullView
        // const filteredFields = isFullView
        //     ? baseFields // Hiển thị tất cả các cột
        //     : baseFields.filter(({field}) => field.includes('open_net') || field.includes('ending_net'));
        return baseFields.map(({field, headerName, hide}) => createColumn(field, headerName, hide));
    };

    function filter() {
        return {
            filter: 'agMultiColumnFilter',
            floatingFilter: true,
            filterParams: {
                filters: [
                    {
                        filter: 'agTextColumnFilter',
                    },
                    {
                        filter: 'agSetColumnFilter',
                    },
                ],
            },
        };
    }

    function loadField() {
        let fields = []
        if (isShowAll1) {
            fields.push(
                {
                    field: `t${currentMonth - 1}_ending_net`,
                    headerName: `Tháng ${currentMonth - 1} EB net`,
                    headerClass: 'right-align-important',
                    valueFormatter: (params) => formatCurrency(params.value),
                    editable: false,
                },
                {
                    field: `t${currentMonth}_no`,
                    headerName: `Tháng ${currentMonth} nợ`,
                    headerClass: 'right-align-important',
                    valueFormatter: (params) => formatCurrency(params.value),
                    cellStyle: {textAlign: 'right'},
                    editable: false,
                },
                {
                    field: `t${currentMonth}_co`,
                    headerName: `Tháng ${currentMonth} có`,
                    headerClass: 'right-align-important',
                    valueFormatter: (params) => formatCurrency(params.value),
                    cellStyle: {textAlign: 'right'},
                    editable: false,
                },
                {
                    field: `t${currentMonth}_ending_net`,
                    headerName: `Tháng ${currentMonth} EB net`,
                    headerClass: 'right-align-important',
                    valueFormatter: (params) => formatCurrency(params.value),
                    cellStyle: {textAlign: 'right'},
                    editable: false,
                },
            )
            return fields
        }
        for (let i = 1; i <= 12; i++) {
            fields.push(...createFieldsForMonth(i, isFullView))
        }
        return fields
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const listCompany = await getAllCompany();
                let updatedColDefs = [
                    {
                        pinned: 'left',
                        width: '40',
                        field: 'action',
                        suppressHeaderMenuButton: true,
                        cellStyle: {textAlign: 'center', paddingTop: 5},
                        headerName: '',
                        cellRenderer: (params) => {
                            //
                            // if (!params.data || !params.data.id) {
                            //     return null;
                            // }

                            return (
                                <PopupDeleteRenderer {...params.data}
                                                     id={params.data.id}
                                                     table={table}
                                                     refetchData={onGridReady}/>
                            );
                        },
                        editable: false,
                    },
                    {
                        field: 'id',
                        headerName: 'ID',
                        pinned: 'left',
                        width: 70,
                        ...filter(),
                    },
                    {
                        field: 'year',
                        headerName: 'Năm',
                        width: 80,
                        pinned: 'left',
                        ...filter(),
                        ...sortMoi(),
                        hide: false,
                    },
                    {
                        field: 'company',
                        headerName: 'Công ty',
                        width: 110,
                        pinned: 'left',
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listCompany.map((p) => p.code),
                        },
                    },
                    {
                        field: 'consol',
                        suppressHeaderMenuButton: true,
                        headerName: 'Consol',
                        width: 100,
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ['CONSOL', ''],
                        },
                        editable: true,
                        // ...await EditTable(),
                    },

                    {
                        field: 'ma_tai_khoan',
                        headerName: 'Mã TK',
                        width: 80,
                        editable: false,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        hide: isShowAll1 && !isFullView,
                        pinned: 'left',
                    },
                    {
                        field: 'ten_tai_khoan',
                        headerName: 'Tên tài khoản',
                        width: 250,
                        pinned: 'left',
                        filter: 'agMultiColumnFilter',
                        floatingFilter: true,
                        filterParams: {
                            filters: [
                                {
                                    filter: 'agTextColumnFilter',
                                    filterParams: {
                                        filterOptions: ['startsWith'],
                                        defaultOption: 'startsWith',
                                    },
                                },
                                {
                                    filter: 'agSetColumnFilter',
                                },
                            ],
                        },
                        editable: true
                    },
                    // {
                    //     field: 'dp',
                    //     headerName: 'Tên đầy đủ',
                    //     width: 250,
                    //     pinned: 'left',
                    //     filter: 'agMultiColumnFilter',
                    //     floatingFilter: true,
                    //     filterParams: {
                    //         filters: [
                    //             {
                    //                 filter: 'agTextColumnFilter',
                    //                 filterParams: {
                    //                     filterOptions: ['startsWith'],
                    //                     defaultOption: 'startsWith',
                    //                 },
                    //             },
                    //             {
                    //                 filter: 'agSetColumnFilter',
                    //             },
                    //         ],
                    //     },
                    // },
                    ...loadField()
                ];
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
                ;
                // setColDefs(updatedColDefs);

            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, isFullView, isShowAll1, currentMonth, checkColumn, permission]);

    const handleAddRow = useCallback(async () => {
        const newItems = {
            company: company !== 'HQ' ? company : '',
            consol: company === 'HQ' ? 'CONSOL' : '',
            createAt: getCurrentDateTimeWithHours(),
            year: selectedYear,
            show: true,
        };
        await handleAddAgl(company, newItems, table, onGridReady,setIsUpdateNoti ,isUpdateNoti);
    }, [rowData]);

    const handleCellValueChanged = async (event) => {
        // if (!event.data.ten_tai_khoan || event.data.ten_tai_khoan.trim() === '') {
        //     toast.error('Tên tài khoản không thể để trống!');
        //     event.node.setDataValue('ten_tai_khoan', event.oldValue);
        //     return;
        // }
        if (event.colDef.field === 't1_open_no' || event.colDef.field === 't1_open_co') {
            event.data.t1_open_net = await event.data.t1_open_no - event.data.t1_open_co
        }
        const rowExistsInUpdatedData = updatedData.some((row) => row.id === event.data.id);
        let newUpdatedData;
        if (rowExistsInUpdatedData) {
            newUpdatedData = updatedData.map((row) => {
                if (row.id === event.data.id) {
                    return {...event.data};
                }
                return row;
            });
        } else {
            newUpdatedData = [...updatedData, event.data];
        }
        let updatedArray = newUpdatedData.map((item) =>
            item.id === event?.data?.id ? {...item, oldValue: event.oldValue} : item
        );
        newUpdatedData = updatedArray;
        setUpdatedData(newUpdatedData);
        await handleSaveAgl(newUpdatedData, table, setUpdatedData,setIsUpdateNoti ,isUpdateNoti);
    };
    const checkAccountVasRenderPhanLoai = (ma_tai_khoan) => {
        ma_tai_khoan = ma_tai_khoan + ''
        if (!ma_tai_khoan || ma_tai_khoan.trim() === "") {
            return "";
        }

        if (ma_tai_khoan.startsWith("1")) return "Tài sản ngắn hạn";
        if (ma_tai_khoan.startsWith("2")) return "Tài sản dài hạn";

        if (["31", "32", "33", "341", "3411"].some(prefix => ma_tai_khoan.startsWith(prefix))) {
            return "Nợ ngắn hạn";
        }

        if (ma_tai_khoan.startsWith("3412")) return "Nợ dài hạn";
        if (ma_tai_khoan.startsWith("4111")) return "Vốn điều lệ";

        if (ma_tai_khoan.startsWith("4") && !ma_tai_khoan.startsWith("4111")) {
            return "Vốn chủ sở hữu khác";
        }

        return "";
    };

    const handleAutoFillPhanLoaiVAS = async () => {
        const updatedData = rowData.map((item) => {
            const newClassification = checkAccountVasRenderPhanLoai(item.ma_tai_khoan);
            if (item.phan_loai === newClassification) {
                return item;
            }

            return {
                ...item,
                phan_loai: newClassification
            };
        });
        const isDataUpdated = updatedData.some((item, index) => item.phan_loai !== rowData[index].phan_loai);
        if (isDataUpdated) {
            setRowData(updatedData)
            await handleSaveAgl(updatedData, table, setUpdatedData,setIsUpdateNoti ,isUpdateNoti);
        } else {
            console.log("Không có thay đổi nào cần cập nhật.");
        }
    };

    function sortMoi() {
        return {
            comparator: (valueA, valueB) => {
                // Loại bỏ các ký tự không phải là số và dấu chấm hoặc dấu trừ khỏi chuỗi
                let a = parseFloat(valueA?.replace(/[^\d.-]/g, ''));
                let b = parseFloat(valueB?.replace(/[^\d.-]/g, ''));

                // Kiểm tra nếu một trong hai giá trị là NaN
                const isANaN = isNaN(a);
                const isBNaN = isNaN(b);

                // Nếu cả hai đều là NaN, chúng được xem là bằng nhau
                if (isANaN && isBNaN) {
                    return 0;
                }

                // Nếu a là NaN, đặt nó ở cuối
                if (isANaN) {
                    return 1;
                }

                // Nếu b là NaN, đặt nó ở cuối
                if (isBNaN) {
                    return -1;
                }

                // Sắp xếp theo giá trị số
                return a - b;
            },
        };
    }

    const isAnyItemUnclassified = rowData.some(item => {
        const newClassification = checkAccountVasRenderPhanLoai(item.ma_tai_khoan);
        return item.phan_loai !== newClassification;
    });

    const handleKyChotSo = () => {
        setShowAll1(!isShowAll1);
    }

    const handleViewFull = () => {
        setIsFullView(!isFullView);
    };

    return (
        <>
            <div className={css.headerPowersheet}>

                {!call &&
                    <>
                        <div className={css.headerTitle}>
                            <span>Tài khoản kế toán</span>
                            <div style={{marginLeft: '20px'}}>
                                <ActionResetColumn tableCol={tableCol} checkColumn={checkColumn}
                                                   setCheckColumn={setCheckColumn}/>
                            </div>
                            <div className={css.toogleChange}>
                                <ActionDisplayModeSwitch isChecked={isFullView} onChange={handleViewFull}/>
                            </div>
                        </div>

                    </>

                }
                {(call && Math.abs(tongDauKy || 0) > 0) &&
                    <Typography.Title level={5} style={{color: "red"}}>Tổng đầu kỳ chưa cân!!!
                        ( Lệch: {tongDauKy}₫)</Typography.Title>}
                <div className={css.headerAction}>
                    {/*<div className={`${css.headerActionButton} ${css.selectItem}`}>*/}
                    {/*    <select className={css.selectContent}*/}
                    {/*            value={selectedYear}*/}
                    {/*            onChange={(e) => setSelectedYear(e.target.value)}*/}
                    {/*    >*/}
                    {/*        {listYear.map((year) => (<option key={year} value={year}>*/}
                    {/*            {year}*/}
                    {/*        </option>))}*/}
                    {/*        <option value="toan-bo">Toàn bộ</option>*/}
                    {/*    </select>*/}
                    {/*</div>*/}
                    {/*{isAnyItemUnclassified && (*/}
                    {/*    <div className={`${css.headerActionButton} ${css.autoPhanLoai}`}*/}
                    {/*         onClick={handleAutoFillPhanLoaiVAS}>*/}
                    {/*        <span>Tự động phân loại</span>*/}
                    {/*    </div>*/}
                    {/*)}*/}
                    {/*<div className={`${css.headerActionButton} ${isShowAll1 ? css.buttonOn : css.buttonOff}`}*/}
                    {/*     onClick={handleKyChotSo}>*/}
                    {/*    <span>Kỳ chốt sổ</span>*/}
                    {/*</div>*/}
                    <ActionCreate handleAddRow={handleAddRow}/>
                    {/*{company !== 'HQ' && (*/}
                    <div className="navbar-item" ref={dropdownRef}>
                        <img
                            src={EllipsisIcon}
                            style={{width: 32, height: 32, cursor: 'pointer'}}
                            alt="Ellipsis Icon"
                            onClick={handleDropdownToggle}
                        />
                        {isDropdownOpen && (
                            <div className={css.dropdownMenu}>
                                <ExportableGrid
                                    api={gridRef.current ? gridRef.current.api : null}
                                    columnApi={gridRef.current ? gridRef.current.columnApi : null}
                                    table={table}
                                    isDropdownOpen={isDropdownOpen}
                                />
                                {/*<ImportBtn*/}
                                {/*    apiUrl={`${import.meta.env.VITE_API_URL}/api/ktqt-vas`}*/}
                                {/*    onFileImported={handleFileImported}*/}
                                {/*    onGridReady={onGridReady}*/}
                                {/*    company={company}*/}
                                {/*    isDropdownOpen={setIsDropdownOpen}*/}
                                {/*    table={table}*/}
                                {/*/>*/}
                            </div>
                        )}
                    </div>
                    {/*)}*/}
                </div>
            </div>
            {/*<div style={{width: '100%', boxSizing: "border-box"}}>*/}
            {/*    <RichNoteKTQTRI table={`${table + '-' + company}`}/>*/}
            {/*</div>*/}
            <div
                style={{
                    height: call === 'cdsd' ? '99%' : '77.5vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                }}
            >
                <Loading loading={loading}/>
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={rowData}
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        //   pagination={true}
                        onCellValueChanged={handleCellValueChanged}
                        // paginationPageSize={500}
                        animateRows={true}
                        // paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                    />
                </div>
            </div>
        </>
    );
}
