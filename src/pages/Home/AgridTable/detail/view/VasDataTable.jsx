import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import AG_GRID_LOCALE_VN from '../../locale.jsx';
import {AgGridReact} from 'ag-grid-react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {toast} from 'react-toastify';
import '../../agComponent.css';
import {MyContext} from "../../../../../MyContext.jsx";
import {getAllTaiKhoan} from "../../../../../apis/taiKhoanService.jsx";
import PopupDeleteAgrid from "../../../popUpDelete/popUpDeleteAgrid.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {handleSave} from "../../handleAction/handleSave.js";
import {Bao_Cao_B01, Bao_Cao_B02} from "../../../../../Consts/TITLE_HEADER.js";
import {getAllB0123} from "../../../../../apis/b0123Service.jsx";
// import {OPTION_KC_NET_VAS} from "../../../CONST.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function VasDataTable ({headerTitle}) {
    const table = 'TkKeToan';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatedData, setUpdatedData] = useState([]);
    const { currentMonth } = useContext(MyContext);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
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
            suppressHeaderMenuButton: true,
        }),
        []
    );
    function checkInputHighlight() {
        return {
            cellClassRules: {
                'highlight': (params) => {
                    return (!params.data.kc_co && !params.data.kc_no && !params.data.kc_net && !params.data.kc_net2 );
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
        getAllTaiKhoan().then((data) => {
            let filteredData = data.filter((item) => item.tk_chi_tiet === "Có")
            if (headerTitle === Bao_Cao_B02) {
                filteredData = filteredData.filter((item) => {
                    const codePrefix = item?.code?.trim()?.charAt(0);
                    return ["5", "6", "7", "8"].includes(codePrefix);
                })
            }
            filteredData = filteredData.sort((a, b) => {
                const aKey = a?.code?.trim()?.slice(0, 3);
                const bKey = b?.code?.trim()?.slice(0, 3);
                return aKey?.localeCompare(bKey);
            });

            setRowData(filteredData);
            setLoading(false)
        });
    }

    const onGridReady = useCallback(async () => {
        loadData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fetchedData = await getAllB0123();
                const filteredData = fetchedData.filter(item => item.loai === headerTitle);
                setColDefs([
                    {
                        pinned: 'left',
                        width: '50',
                        field: 'delete',
                        suppressHeaderMenuButton: true,
                        cellStyle: {alignItems: "center", display: "flex"},
                        headerName: '',
                        editable: false,
                        cellRenderer: (params) => {
                            if (!params.data || !params.data.id) {
                                return null;
                            }
                            return (
                                <PopupDeleteAgrid
                                    {...params.data}
                                    id={params.data.id}
                                    reload={loadData}
                                    table={table}
                                    currentUser={currentUser}
                                />
                            );
                        },
                    },
                    {
                        field: 'id',
                        headerName: 'ID',
                        width: 70,
                        ...filter(),
                    },
                    {
                        field: 'name',
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
                    },
                    {
                        field: 'code',
                        headerName: 'Mã TK',
                        width: 100,
                        editable: true,
                        ...filter(),

                    },
                    {
                        field: 'phan_loai',
                        headerName: 'Phân loại',
                        width:80,
                        editable: true,
                        ...filter(),
                        hide : headerTitle === Bao_Cao_B01,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: filteredData.map(value => value?.code),
                        },

                    },
                    {
                        field: 'kc_no',
                        headerName: 'Kết chuyển nợ',
                        width: 120,
                        editable: true,
                        ...filter(),
                        ...checkInputHighlight(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: filteredData.map(value => value?.code),
                        },
                        hide : headerTitle === Bao_Cao_B02
                    },
                    {
                        field: 'kc_co',
                        headerName: 'Kết chuyển có',
                        width: 120,
                        editable: true,
                        ...filter(),
                        ...checkInputHighlight(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: filteredData.map(value => value?.code),
                        },
                        hide : headerTitle === Bao_Cao_B02
                    },
                    {
                        field: 'kc_net',
                        headerName: 'Kết chuyển net',
                        width: 120,
                        editable: true,
                        ...filter(),
                        ...checkInputHighlight(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: filteredData.map(value => value?.code),
                        },
                        hide : headerTitle === Bao_Cao_B02
                    },
                    {
                        field: 'kc_net2',
                        headerName: 'Kết chuyển net2',
                        width: 125,
                        editable: true,
                        ...filter(),
                        ...checkInputHighlight(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: filteredData.map(value => value?.code),
                        },
                        hide : headerTitle === Bao_Cao_B02
                    },
                    {
                        field: 'tinh_chat',
                        headerName: 'Tính chất',
                        width: 125,
                        editable: true,
                        ...filter(),
                        hide : headerTitle === Bao_Cao_B01,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ["Doanh thu", "Chi phí"],
                        },
                    },

                ]);
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, []);
    const handleCellValueChanged = async (event) => {
        // if (!event.data.name || event.data.name.trim() === '') {
        //     toast.error('Tên tài khoản không thể để trống!');
        //     event.node.setDataValue('ten_tai_khoan', event.oldValue);
        //     return;
        // }
        if(event.colDef.field === 't1_open_no' || event.colDef.field === 't1_open_co' ){
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
        console.log(newUpdatedData)
        await handleSave(newUpdatedData, table, setUpdatedData , currentUser);
    };

    return (
        <>
            <div
                style={{
                    height: '70vh',
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
                    />
                </div>
            </div>
        </>
    );
}
