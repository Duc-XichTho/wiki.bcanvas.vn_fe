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
import {getAllVas} from "../../../apisKTQT/vasService.jsx";
import PopupDeleteRenderer from "../popUp/popUpDelete.jsx";
import {MyContext} from "../../../MyContext.jsx";
import {formatCurrency} from "../functionKTQT/formatMoney.js";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import {MAP_KC_LIST, OPTION_KC_NET_VAS} from "../../../Consts/OPTION_KC_NET_VAS.js";
import {handleSaveAgl} from "../functionKTQT/handleSaveAgl.js";
import {Button, Typography} from "antd";
import css from "../KeToanQuanTriComponent/KeToanQuanTri.module.css";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function VasDataTable({call, companyCDSD}) {
    const table = 'Vas';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatedData, setUpdatedData] = useState([]);
    const {currentMonth, listCompany, currentYearKTQT, yearCDSD, setIsUpdateNoti, isUpdateNoti} = useContext(MyContext);
    const [checkKC, setCheckKC] = useState(0);
    const [filterKC, setFilterKC] = useState(false);
    const [col, setCol] = useState([])

    useEffect(() => {
        setCol(
            [
                {
                    field: 'code',
                    headerName: 'Mã TK',
                    width: 100,
                    ...filter(),
                },
                {
                    field: 'header',
                    headerName: 'Tên',
                    width: 200,
                    ...filter(),
                },
            ]

        )
    }, []);

    const defaultColDef = useMemo(
        () => ({
            editable: false,
            filter: true,
            width: 180,
            cellStyle: {
                display: 'flex',
                alignItems: 'center',
            },
        }),
        []
    );

    function checkInputHighlight() {
        return {
            cellClassRules: {
                'highlight': (params) => {
                    return (!params.data.kc_co && !params.data.kc_no && !params.data.kc_net && !params.data.kc_net2);
                },
            },
        };
    }

    const statusBar = useMemo(
        () => ({
            statusPanels: [{statusPanel: 'agAggregationComponent'}],
        }),
        []
    );

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

    function loadData() {
        setLoading(true)
        getAllVas().then((data) => {
            let filteredData = data.sort((a, b) => {
                const aKey = a.ma_tai_khoan?.trim()?.slice(0, 3);
                const bKey = b.ma_tai_khoan?.trim()?.slice(0, 3);
                return aKey?.localeCompare(bKey);
            });
            filteredData = filteredData.filter((e) => e.consol?.toLowerCase() == 'consol');

            let check = 0
            filteredData.forEach(params => {
                if (call == 'cdsd') {
                    if (!params.kc_co && !params.kc_no && !params.kc_net && !params.kc_net2 && params.year == yearCDSD && params.company == companyCDSD) {
                        check++
                    }
                } else {
                    if (!params.kc_co && !params.kc_no && !params.kc_net && !params.kc_net2) {
                        check++
                    }
                }


            })
            setCheckKC(check)
            if (filterKC) {
                if (call == 'cdsd') {
                    filteredData = filteredData.filter((e) => !e.kc_co && !e.kc_no && !e.kc_net && !e.kc_net2 && e.year == yearCDSD && e.company == companyCDSD);
                } else {
                    filteredData = filteredData.filter((e) => !e.kc_co && !e.kc_no && !e.kc_net && !e.kc_net2);
                }

            }
            console.log(call)
            if (call == 'cdsd') {
                filteredData = filteredData.filter(e => e.year == yearCDSD);
                if (localStorage.getItem('company_cdsd')) {
                    filteredData = filteredData.filter(e => e.company == localStorage.getItem('company_cdsd'));
                }

            }
            setRowData(filteredData);
            setLoading(false)
        });
    }

    useEffect(() => {
        loadData();
    }, [filterKC, checkKC]);
    const onGridReady = useCallback(async () => {
        loadData();
    }, [filterKC]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setColDefs([
                    {
                        pinned: 'left',
                        width: '40',
                        field: 'action',
                        suppressHeaderMenuButton: true,
                        cellStyle: {textAlign: 'center', paddingTop: 5},
                        headerName: '',
                        cellRenderer: (params) => {
                            if (!params.data || !params.data.id) {
                                return null;
                            }

                            return (
                                <PopupDeleteRenderer {...params.data} id={params.data.id} table={table}
                                                     reloadData={onGridReady}/>
                            );
                        },
                        editable: false,
                    },
                    // {
                    //     field: 'id',
                    //     headerName: 'ID',
                    //     width: 70,
                    //     ...filter(),
                    // },
                    // {
                    //     field: 'consol',
                    //     suppressHeaderMenuButton: true,
                    //     headerName: 'Consol',
                    //     width: 100,
                    //     ...filter(),
                    //     cellEditor: 'agRichSelectCellEditor',
                    //     cellEditorParams: {
                    //         allowTyping: true,
                    //         filterList: true,
                    //         highlightMatch: true,
                    //         values: ['CONSOL', ''],
                    //     },
                    //     pinned: "left"
                    //
                    // },
                    {
                        field: 'year',
                        suppressHeaderMenuButton: true,
                        headerName: 'Năm',
                        width: 50,
                        ...filter(),

                        pinned: "left"

                    },
                    {
                        field: 'company',
                        headerName: 'Công ty',
                        width: 90,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        hide: false,
                        editable: params => params.data.isEditable,
                        cellStyle: {textAlign: "left"},
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listCompany.map((p) => p.code),
                        },
                        pinned: "left"

                    },
                    {
                        field: 'ten_tai_khoan',
                        headerName: 'Tên tài khoản',
                        width: 150,
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
                        pinned: "left"
                    },
                    {
                        field: 'ma_tai_khoan',
                        headerName: 'Mã TK',
                        width: 80,
                        editable: true,
                        suppressHeaderMenuButton: true,
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
                        pinned: "left"

                    },
                    {
                        field: 'kc_no',
                        headerName: 'Kết chuyển nợ',
                        width: 110,
                        editable: true,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        ...checkInputHighlight(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: OPTION_KC_NET_VAS,
                        },
                    },
                    {
                        field: 'kc_co',
                        headerName: 'Kết chuyển có',
                        width: 110,
                        editable: true,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        ...checkInputHighlight(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: OPTION_KC_NET_VAS,
                        },
                    },
                    {
                        field: 'kc_net',
                        headerName: 'Kết chuyển net nợ-có',
                        width: 150,
                        editable: true,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        ...checkInputHighlight(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: OPTION_KC_NET_VAS,
                        },
                    },
                    {
                        field: 'kc_net2',
                        headerName: 'Kết chuyển net có-nợ',
                        width: 150,
                        editable: true,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        ...checkInputHighlight(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: OPTION_KC_NET_VAS,
                        },
                    },


                ]);
            } catch (error) {
                console.log(error)
            }
        };
        fetchData();
    }, [filterKC]);
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
        await handleSaveAgl(newUpdatedData, table, setUpdatedData, setIsUpdateNoti, isUpdateNoti);
    };

    return (
        <>
            {checkKC > 0 &&
                <Typography.Title level={5} style={{color: "red"}}> Có {checkKC} bản ghi chưa điền mã kết
                    chuyển <Button className={` ${filterKC ? css.buttonOn2 : css.buttonOff}`}
                                   onClick={() => {
                                       setFilterKC(prevState => !prevState)
                                   }}>
                        <span>Lọc</span>
                    </Button></Typography.Title>}
            <div
                style={{
                    height: call === 'cdsd' ? '99%' : '90vh',
                    display: 'flex',
                    // flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                    gap: 20
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
                <div className="ag-theme-quartz" style={{height: '100%', width: '75%'}}>
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
                    />
                </div>
                <div className="ag-theme-quartz" style={{height: '100%', width: '25%'}}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={MAP_KC_LIST}
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        defaultColDef={defaultColDef}
                        columnDefs={col}
                        rowSelection="multiple"
                        //   pagination={true}
                        onCellValueChanged={handleCellValueChanged}
                        // paginationPageSize={500}
                        animateRows={true}
                        // paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                    />
                </div>

            </div>
        </>
    );
}
