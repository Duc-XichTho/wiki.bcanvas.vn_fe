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
import '../../agComponent.css'
import {MyContext} from "../../../../../MyContext.jsx";
import PopupDeleteAgrid from "../../../popUpDelete/popUpDeleteAgrid.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {handleSave} from "../../handleAction/handleSave.js";
import {formatMoney} from "../../../../../generalFunction/format.js";
import {getAllKmtc} from "../../../../../apis/kmtcService.jsx";
import {Bao_Cao_B01} from "../../../../../Consts/TITLE_HEADER.js";
import {getAllB0123} from "../../../../../apis/b0123Service.jsx";
// import {OPTION_KC_NET_VAS} from "../../../CONST.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function KmtcDataTable ({headerTitle}) {
    const table = 'Kmtc';
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
            suppressMenu: true,
            editable: false,
            filter: true,
            width: 180,
        }),
        []
    );

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
        getAllKmtc().then((data) => {
            let filteredData = data
            filteredData = filteredData.sort((a, b) => {
                const loaiOrder = (loai) => (loai === "Thu" ? 0 : 1);
                const loaiCompare = loaiOrder(a?.loai) - loaiOrder(b?.loai);
                if (loaiCompare !== 0) {
                    return loaiCompare;
                }
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
                        headerName: 'STT',
                        hide: false,
                        width: 80,
                        ...filter(),
                        editable: false,
                    },
                    {
                        field: 'code',
                        headerName: 'Mã KMTC',
                        width: 100,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên KMTC',
                        width: 250,
                        ...filter(),
                    },
                    {
                        field: 'loai',
                        headerName: 'Loại chi phí',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'tk_hach_toan',
                        headerName: 'TK hạch toán',
                        width: 180,
                        ...filter(),
                    },
                    {
                        field: 'trang_thai',
                        headerName: 'Trạng thái',
                        width: 150,
                        ...filter(),
                    },
                    {
                        field: 'phan_loai',
                        headerName: 'Phân loại',
                        width:80,
                        editable: true,
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: filteredData.map(value => value?.code),
                        },

                    },
                    {
                        field: 'tinh_chat',
                        headerName: 'Tính chất',
                        width: 125,
                        editable: true,
                        ...filter(),
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
