import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import {toast} from 'react-toastify';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {createNewLuong, getAllLuong} from "../../../../apis/luongService.jsx";
import ReviewDialog from "./ReviewDialog.jsx";
import MappingLuong from "./MappingLuong.jsx";
import PopupDeleteAgrid from "../../popUpDelete/popUpDeleteAgrid.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import AG_GRID_LOCALE_VN from "../locale.jsx";
import {EllipsisIcon} from "../../../../icon/IconSVG.js";
import {handleSave} from "../handleAction/handleSave.js";
import {getAllPhongBan} from "../../../../apis/phongBanService.jsx";
import {onFilterTextBoxChanged} from "../../../../generalFunction/quickFilter.js";
import css from "../DanhMuc/KeToanQuanTri.module.css";
import ActionCreate from "../actionButton/ActionCreate.jsx";
import {loadColumnState, saveColumnStateToLocalStorage} from "../logicColumnState/columnState.jsx";
import {getItemFromIndexedDB} from "../../../../storage/storageService.js";
import ExportableGrid from "../exportFile/ExportableGrid.jsx";
import {createTimestamp, formatCurrency} from "../../../../generalFunction/format.js";
import ImportBtnLuong from "../ImportFIle/ImportBtnLuong.jsx";
import ActionResetColumn from "../actionButton/ActionResetColumn.jsx";
import ActionChangeFilter from "../actionButton/ActionChangeFilter.jsx";
import ActionSearch from "../actionButton/ActionSearch.jsx";
import ActionClearFilter from "../actionButton/ActionClearAllFilter.jsx";
import {Luongg} from "../../../../Consts/TITLE_HEADER.js";
import ActionBookMark from "../actionButton/ActionBookMark.jsx";

export default function Luong() {
    // let {sheetPermissionsInfo, currentUser} = useContext(MyContext);
    const headerTitle = Luongg
    const table = 'Luong';
    const tableCol = 'LuongCol';
    const tableFilter = 'LuongFilter'
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [openMapping, setOpenMapping] = useState(false);
    const [reviewData, setReviewData] = useState([]);
    const [checkMappingChange, setCheckMappingChange] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [showClearFilter, setShowClearFilter] = useState(false);
    const [checkColumn, setCheckColumn] = useState(true);

    // useEffect(() => {
    //     FilterText(gridRef, text_input);
    // }, []);

    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            isStatusFilter: storedSettings?.isStatusFilter ?? false,
        };
    };
    const [isStatusFilter, setIsStatusFilter] = useState(getLocalStorageSettings().isStatusFilter);

    useEffect(() => {
        const tableSettings = {
            isStatusFilter
        };

        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isStatusFilter]);

    const handleChangeStatusFilter = () => {
        setIsStatusFilter((prev) => {
            return !prev;
        });
    };

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const defaultColDef = useMemo(
        () => ({
            editable: true,
            suppressMenu: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
            cellStyle: {fontSize: '14.5px'},
            resizeable: true,
        }),
        []
    );

    function filter() {
        if (isStatusFilter) {
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
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const savedColumnState = await getItemFromIndexedDB(tableCol) || []
                let updatedColDefs = [
                    {field: 'id', headerName: 'ID', editable: false, hide: true, filter: 'agMultiColumnFilter'},

                    {
                        field: 'doi_tuong',
                        headerName: "Đối tượng",
                        ...filter(),
                        width: 200,

                    },
                    {
                        field: 'cost_object',
                        headerName: "Cost object",
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: async (params) => {
                                let listTeam = await getAllPhongBan()
                                return listTeam.map(d => d?.name)
                            }
                        },
                        ...filter(),
                        width: 200,
                    },
                    {
                        field: 'bu',
                        headerName: "Business unit",
                        ...filter(),
                        width: 200,

                    },
                    {
                        field: 'month',
                        headerName: "Tháng",
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            values: params => {
                                let list = []
                                for (let i = 1; i <= 12; i++) {
                                    list.push(`${i}`)
                                }
                                return list

                            },
                        },
                        ...filter(),
                        width: 200,

                    },
                    {
                        field: 'year',
                        headerName: "Năm",
                        cellEditor: 'agNumberCellEditor',
                        ...filter(),
                        width: 200,

                    },
                    {
                        field: 'cf_luong_gross',
                        headerName: "CF lương gross",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,
                    },
                    {
                        field: 'luong_co_dinh',
                        headerName: "Lương cố định",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,
                    },
                    {
                        field: 'luong_bo_sung',
                        headerName: "Lương bổ sung",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },
                    {
                        field: 'ot',
                        headerName: "OT",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },
                    {
                        field: 'phu_cap',
                        headerName: "Phụ cấp",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },
                    {
                        field: 'thuong',
                        headerName: "Thưởng",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },
                    {
                        field: 'khac',
                        headerName: "Khác",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,
                    },
                    {
                        field: 'bhxh_cty_tra',
                        headerName: "BHXH Cty trả",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,
                    },
                    {
                        field: 'bhyt_cty_tra',
                        headerName: "BHYT Cty trả",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },
                    {
                        field: 'bhtn_cty_tra',
                        headerName: "BHTN Cty trả",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },
                    {
                        field: 'cong_doan',
                        headerName: "Công đoàn",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },
                    {
                        field: 'bhxh_nv_tra',
                        headerName: "BHXH NV trả",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },
                    {
                        field: 'bhyt_nv_tra',
                        headerName: "BHYT NV trả",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,


                    },
                    {
                        field: 'bhtn_nv_tra',
                        headerName: "BHTN NV trả",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },
                    {
                        field: 'thue_tncn',
                        headerName: "Thuế TNCN",
                        ...filter(),
                        cellRenderer: params => formatCurrency(params.value) || 'N/A',
                        cellEditor: 'agNumberCellEditor',
                        width: 200,

                    },

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
                ];
                if (savedColumnState.length) {
                    setColDefs(loadColumnState(updatedColDefs, savedColumnState));
                } else {
                    setColDefs(updatedColDefs);
                }
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [isStatusFilter, showClearFilter, checkColumn]);

    const handleFileImported = (importedData) => {
        setRowData((prevRowData) => [...prevRowData, ...importedData]);
    };
    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    const handleReview = () => {
        const groupedData = rowData.reduce((acc, curr) => {
            const team = curr.cost_object;

            if (!acc[team]) {
                acc[team] = {
                    team,
                    unit_code: curr.cost_object,
                    luong_co_dinh: 0,
                    luong_bo_sung: 0,
                    ot: 0,
                    phu_cap: 0,
                    thuong: 0,
                    khac: 0,
                    bhxh_cty_tra: 0,
                    bhyt_cty_tra: 0,
                    bhtn_cty_tra: 0,
                    cong_doan: 0,
                    bhxh_nv_tra: 0,
                    bhyt_nv_tra: 0,
                    bhtn_nv_tra: 0,
                    thue_tncn: 0,
                    month: Number(curr.month),
                };
            }
            acc[team].luong_co_dinh += Number(curr.luong_co_dinh);
            acc[team].luong_bo_sung += Number(curr.luong_bo_sung);
            acc[team].ot += Number(curr.ot);
            acc[team].phu_cap += Number(curr.phu_cap);
            acc[team].thuong += Number(curr.thuong);
            acc[team].khac += Number(curr.khac);
            acc[team].bhxh_cty_tra += Number(curr.bhxh_cty_tra);
            acc[team].bhyt_cty_tra += Number(curr.bhyt_cty_tra);
            acc[team].bhtn_cty_tra += Number(curr.bhtn_cty_tra);
            acc[team].cong_doan += Number(curr.cong_doan);
            acc[team].bhxh_nv_tra += Number(curr.bhxh_nv_tra);
            acc[team].bhyt_nv_tra += Number(curr.bhyt_nv_tra);
            acc[team].bhtn_nv_tra += Number(curr.bhtn_nv_tra);
            acc[team].thue_tncn += Number(curr.thue_tncn);
            return acc;
        }, {});
        const reviewTableData = Object.values(groupedData);
        let filterRevierData = reviewTableData.filter(e => e?.team && e?.month)
        setReviewData(filterRevierData);
        setOpen(true);
    };
    const handleOpenMaipping = () => {
        setOpenMapping(true)
    }
    const handleClose = () => {
        setOpen(false);
    };
    const handleMaippingClose = () => {
        setOpenMapping(false);
    };
    const handleCellValueChanged = async (event) => {

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
        await handleSave(newUpdatedData, table, setUpdatedData, onGridReady);
    };
    const loadData = async () => {
        await getAllLuong().then((data) => {
            const savedFilters = sessionStorage.getItem(tableFilter);
            const filters = JSON.parse(savedFilters);
            setRowData(data)
            if (gridRef.current && gridRef.current.api) {

                if (savedFilters) {
                    gridRef.current.api.setRowData(data);
                    gridRef.current.api.setFilterModel(filters);

                } else {
                    gridRef.current.api.setRowData(data);
                }
            } else {
                console.warn('Grid chưa được khởi tạo hoặc gridRef.current là null');
            }

            setLoading(false);
        });
    }

    const onGridReady = useCallback(async () => {
        await loadData()
    }, [rowData]);

    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    useEffect(() => {
        fetchCurrentUser()
        setLoading(true);
        loadData()
    }, []);

    // useEffect(() => {
    //     fetchData();
    // }, [fetchData]);

    const handleAddRow = async () => {
        const newData = {
            create_at: createTimestamp(),
            user_create: currentUser.email
        };
        await createNewLuong(newData);
        toast.success("Tạo dòng thành công", {autoClose: 1000})
        await loadData()
    };

    const onFilterChanged = () => {
        const filterModel = gridRef.current.api.getFilterModel();

        if (Object.keys(filterModel).length !== 0) {
            sessionStorage.setItem(tableFilter, JSON.stringify(filterModel));
            setShowClearFilter(true)
        } else {
            sessionStorage.removeItem(tableFilter);
        }
    };

    const clearFilters = () => {
        // Kiểm tra nếu grid đã sẵn sàng
        if (gridRef.current && gridRef.current.api) {
            gridRef.current.api.setFilterModel(null); // Xóa tất cả bộ lọc
        }
        setShowClearFilter(false)
    };

    return (
        <>
            <div className={css.headerPowersheet}>
                <div className={css.headerTitle}>
                    <span>{headerTitle}</span>
                </div>
                <div className={css.headerActionFilter}>
                    <ActionBookMark headerTitle={headerTitle}/>
                    <ActionSearch handleFilterTextBoxChanged={handleFilterTextBoxChanged}/>
                    <ActionChangeFilter isStatusFilter={isStatusFilter}
                                        handleChangeStatusFilter={handleChangeStatusFilter}/>
                    <ActionResetColumn tableCol={tableCol} checkColumn={checkColumn} setCheckColumn={setCheckColumn}/>
                    <ActionClearFilter showClearFilter={showClearFilter} clearFilters={clearFilters}/>
                </div>
                <div className={css.headerAction}>
                    <div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={handleReview}>
                        <div className={css.buttonContent}>
                            <span>Review</span>
                        </div>
                    </div>
                    <div className={`${css.headerActionButton} ${css.buttonOn}`} onClick={handleOpenMaipping}>
                        <div className={css.buttonContent}>
                            <span>Mapping</span>
                        </div>
                    </div>
                    <ActionCreate handleAddRow={handleAddRow}/>
                    <div className="navbar-item" ref={dropdownRef}>
                        <img
                            src={EllipsisIcon}
                            style={{width: 32, height: 32, cursor: 'pointer'}}
                            alt="Ellipsis Icon"
                            onClick={handleDropdownToggle}
                        />
                        {isDropdownOpen && (
                            <div className={css['dropdown-menu-button1']}>
                                <ExportableGrid
                                    api={gridRef.current ? gridRef.current.api : null}
                                    columnApi={gridRef.current ? gridRef.current.columnApi : null}
                                    table={table}
                                    isDropdownOpen={isDropdownOpen}
                                />

                                <ImportBtnLuong
                                    apiUrl={`${import.meta.env.VITE_API_URL}/api/luong`}
                                    onFileImported={handleFileImported}
                                    onGridReady={() => loadData()}
                                    isDropdownOpen={setIsDropdownOpen}
                                    table={table}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div
                style={{
                    height: '79vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '10px',
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
                        statusBar={statusBar}
                        enableRangeSelection
                        ref={gridRef}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        animateRows={true}
                        pagination={true}
                        onCellValueChanged={handleCellValueChanged}
                        paginationPageSize={1000}
                        suppressRowClickSelection={true}
                        paginationPageSizeSelector={[1000, 5000, 10000, 30000, 50000]}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onFilterChanged={onFilterChanged}
                        onColumnMoved={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                        onColumnResized={(params) => saveColumnStateToLocalStorage(params.api, tableCol)}
                    />
                </div>
            </div>
            <ReviewDialog open={open} onClose={handleClose} reviewData={reviewData}
                          checkMappingChange={checkMappingChange}/>
            <MappingLuong open={openMapping} onClose={handleMaippingClose}
                          setCheckMappingChange={setCheckMappingChange}
                          checkMappingChange={checkMappingChange}/>
        </>
    );
}
