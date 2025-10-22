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
import {getAllUnits} from '../../../apisKTQT/unitService.jsx';
import {getAllCoCauPhanBo} from '../../../apisKTQT/coCauPhanBoService.jsx';
import css from "../KeToanQuanTriComponent/KeToanQuanTri.module.css"
import {onFilterTextBoxChanged} from "../../../generalFunction/quickFilter.js";
import {MyContext} from "../../../MyContext.jsx";
import {handleSaveAgl} from "../functionKTQT/handleSaveAgl.js";
import {getCurrentDateTimeWithHours} from "../functionKTQT/formatDate.js";
import {handleAddAgl} from "../functionKTQT/handleAddAgl.js";
import PopupDeleteRenderer from "../popUp/popUpDelete.jsx";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import TooltipHeaderIcon from "../HeaderTooltip/TooltipHeaderIcon.jsx";
import RichNoteKTQTRI from "../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionDeleteDataAllowed from "../ActionButton/ActionDeleteDataAllowed.jsx";
import ActionCreate from "../../Home/AgridTable/actionButton/ActionCreate.jsx";
// API
import {setItemInIndexedDB2} from '../storage/storageService.js';
import {getAllKmf} from '../../../apisKTQT/kmfService.jsx';
import {Button} from "antd";
import SettingGroup from "./SettingGroup.jsx";
import {getAllSettingGroup} from "../../../apisKTQT/settingGroupService.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {permissionForKtqt} from "../functionKTQT/permissionForKtqt/permissionForKtqt.js";
import {getAllCostPool} from "../../../apis/costPoolService.jsx";
import ActionSave from "../../Home/AgridTable/actionButton/ActionSave.jsx";
import Loading from '../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function CostPool({company, call, type}) {
    let {
        sheetPermissionsInfo,
        currentUser,
        fetchAllProjects,
        loadDataSoKeToan,
        listCompany,
        userClasses,
        fetchUserClasses,
        setIsUpdateNoti,
        isUpdateNoti
    } = useContext(MyContext);
    const table = 'CostPool';
    const key = 'DANHMUC_KM_CP'
    const gridRef = useRef();
    const [listUnit, setListUnit] = useState([]);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [saveActive, setSaveActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [listCoChePhanBo, setListCoChePhanBo] = useState([]);
    const [listEditData, setListEditData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [hasEditableRows, setHasEditableRows] = useState(false);

    const statusBar = {
        statusPanels: [
            {
                statusPanel: 'agAggregationComponent',
            },
        ],
    };

    useEffect(() => {
        getAllCoCauPhanBo().then((data) => {
            setListCoChePhanBo(data);
        });
    }, []);


    async function EditTable() {
        const user = await getCurrentUserLogin()
        let permission = await permissionForKtqt(user, userClasses, fetchUserClasses)
        return {editable: permission}
    }

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            cellStyle: {fontSize: '14.5px'},
            floatingFilter: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    const onGridReady = useCallback(async () => {
        loadData()
    }, [company]);

    const fetchCostPoolData = async (company) => {
        const [listSoKeToan, data] = await Promise.all([loadDataSoKeToan(), getAllCostPool()]);

        const relevantCostPool = company === "HQ" ? data : data.filter(v => v.company === company);
        const relevantSoKeToan = company === "HQ" ? listSoKeToan : listSoKeToan.filter(s => s.company === company);

        const sktSet = new Set(relevantSoKeToan.map(s => s.costPool));
        const nonEditableProjects = [];

        relevantCostPool.forEach(costPool => {
            costPool.isEditable = costPool.name === '' || !costPool.name || !sktSet.has(costPool.name);
            if (costPool.isEditable) {
                nonEditableProjects.push(costPool);
            }
        });
        setListEditData(nonEditableProjects)

        getAllUnits().then(data => {
            if (company === "HQ") {
                setListUnit(data);
            } else {
                const filteredData = data.filter((e) => e.company === company);
                setListUnit(filteredData);
            }
        })

        return relevantCostPool;
    };

    const loadData = async () => {
        let data;
        if (company === "HQ") {
            data = await fetchCostPoolData("HQ");
        } else {
            data = await fetchCostPoolData(company);
        }
        await setItemInIndexedDB2(key, data);
        setRowData(data);
        checkEditableRows(data)
        setLoading(false);
    };

    const checkEditableRows = (data) => {
        const grouped = data.reduce((acc, item) => {
            if (!acc[item.name]) acc[item.name] = new Set();
            acc[item.name].add(item.dp);
            return acc;
        }, {});

        const filteredData = data.filter(item => grouped[item.name].size > 1);
        setFilteredData(filteredData);
        setHasEditableRows(filteredData.length > 0);

    };

    const viewEdit = () => {
        setRowData(filteredData)
    }

    const toggleEditMode = () => {
        if (!isEditingMode) {
            viewEdit();
        } else {
            loadData()
        }
        setIsEditingMode(!isEditingMode);
    };


    useEffect(() => {
        setLoading(true);
        loadData();
    }, [company]);

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                setColDefs([
                    {
                        field: 'id',
                        headerName: 'ID',
                        hide: false,
                        width: 100,
                        ...filter(),
                        editable: false,
                        cellStyle: {textAlign: "left"}
                    },
                    {
                        field: 'company',
                        headerName: 'Công ty',
                        width: 90,
                        suppressHeaderMenuButton: true,
                        ...filter(),
                        editable: params => params.data.isEditable,
                        cellStyle: {textAlign: "left"},
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listCompany.map((p) => p.code),
                        },
                        // hide: type == 1 || type == 2

                    },
                    {
                        field: 'code',
                        flex: 1,
                        headerName: 'Mã nhóm chi phí',
                        ...filter(),
                        editable: params => params.data.isEditable,
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined;
                            },
                        },
                    },
                    {
                        field: 'name',
                        headerName: 'Tên nhóm chi phí',
                        flex: 1,
                        ...filter(),
                        ...await EditTable()
                    },
                    {
                        field: 'cost_driver',
                        headerName: 'Nhân tố chi phí',
                        flex: 1,
                        ...filter(),
                        ...await EditTable()
                    },
                    {
                        field: 'trang_thai',
                        headerName: 'Trạng thái',
                        flex: 1,
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ['Sử dụng', 'Không sử dụng'],
                        },
                        ...filter(),
                        ...await EditTable()
                    },
                    {
                        field: 'type',
                        headerName: 'Loại',
                        flex: 1,
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined;
                            },
                        },
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ['VC', 'FC', 'MC'],
                        },
                        ...filter(),
                        ...await EditTable()
                    },
                    {
                        pinned: 'left',
                        width: 40,
                        field: 'action',
                        suppressMenu: true,
                        cellStyle: {textAlign: 'center'},
                        headerName: '',

                        cellRenderer: (params) => {
                            // if (!params.data || !params.data.id || !params.data.isEditable) {
                            //     return null;
                            // }
                            return (
                                <PopupDeleteRenderer {...params.data} id={params.data.id} table={table}
                                                     reloadData={onGridReady}/>
                            );
                        },
                        editable: false,
                    },
                ]);
            } catch (error) {
                console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table]);

    const handleAddRow = useCallback(async () => {
        const newItems = {
            company: company,
            createAt: getCurrentDateTimeWithHours(),
            show: true,
        };
        await handleAddAgl(company, newItems, table, onGridReady, setIsUpdateNoti, isUpdateNoti);
    }, [onGridReady]);

    const handleCellValueChanged = (event) => {
        const updatedRow = { ...event.data };
        setUpdatedData((prevData) => {
            const existingRowIndex = prevData.findIndex(item => item.id === updatedRow.id);
            if (existingRowIndex !== -1) {
                prevData[existingRowIndex] = updatedRow;
                return [...prevData];
            } else {
                return [...prevData, updatedRow];
            }
        });
    };

    const handleSaveData = async () => {
        setLoading(true)
        if (!updatedData.length) return;
        await handleSaveAgl(updatedData, table, setUpdatedData, setIsUpdateNoti, isUpdateNoti);
        await loadData();
        setLoading(false)
    };


    return (
        <>
            <div className={'header-powersheet'}>
                {call !== 'cdsd' && <>
                    <div className={css.headerTitle}>
                        <span>Danh mục Nhóm chi phí</span>
                    </div>
                </>}
                <div className={css.headerAction}>

                    <SettingGroup table={table} reload={onGridReady}/>
                    {
                        listEditData.length > 0 &&
                        <ActionDeleteDataAllowed listDataAllowDelete={listEditData} table={table}
                                                 loadData={loadData}/>

                    }
                    {
                        hasEditableRows &&
                        <Button
                            type="primary"
                            onClick={toggleEditMode}
                            style={{backgroundColor: "#ee8b67", borderColor: "#ee8b67"}}
                        >
                            {isEditingMode ? "Tắt chế độ sửa" : "Lọc dòng cần sửa"}
                        </Button>
                    }

                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>
                    <ActionCreate handleAddRow={handleAddRow}/>

                </div>
            </div>


            <div style={{width: '100%', height: '11%', boxSizing: "border-box"}}>
                <RichNoteKTQTRI table={`${table + '-' + company}`}/>
            </div>
            <div
                style={{
                    height: call === 'cdsd' ? '75%' : '61vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                }}
            >
                <Loading loading={loading}/>
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                    <AgGridReact
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        ref={gridRef}
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        // pagination={true}
                        onCellValueChanged={handleCellValueChanged}
                        paginationPageSize={500}
                        animateRows={true}
                        paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        rowHeight={31}
                    />
                </div>
            </div>
        </>
    );
}
