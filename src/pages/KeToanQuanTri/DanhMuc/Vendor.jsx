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
import '../../Home/AgridTable/agComponent.css';
import {getAllVendor} from '../../../apisKTQT/vendorService.jsx';
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
import ActionCreate from "../../Home/AgridTable/actionButton/ActionCreate.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {permissionForKtqt} from "../functionKTQT/permissionForKtqt/permissionForKtqt.js";
import {setItemInIndexedDB2} from "../storage/storageService.js";
import {getAllSettingGroup} from "../../../apisKTQT/settingGroupService.jsx";
import ActionSave from "../../Home/AgridTable/actionButton/ActionSave.jsx";
import ActionDeleteDataAllowed from "../ActionButton/ActionDeleteDataAllowed.jsx";
import Loading from '../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function Vendor({company, call}) {
    let {sheetPermissionsInfo, currentUser, fetchAllProjects, loadDataSoKeToan ,listCompany, userClasses, fetchUserClasses, setIsUpdateNoti ,isUpdateNoti} = useContext(MyContext);
    const table = 'Vendor';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [saveActive, setSaveActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [oldData, setOldData] = useState({});
    const [showProjectFormUpdate, setShowProjectFormUpdate] = useState(false);
    const [listEditData, setListEditData] = useState([]);

    const defaultColDef = useMemo(() => {
        return {
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            editable: false,
            cellClassRules: {
                'cell-small': (params) => params.colDef.width < 150,
            },
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    async function EditTable() {
        const user = await getCurrentUserLogin()
        let permission = await permissionForKtqt(user, userClasses, fetchUserClasses)
        return {editable: permission}
    }

    const onGridReady = useCallback(async () => {
        loadData();
    }, [company]);

    const fetchVendorData = async (company) => {
        const [listSoKeToan, vendors] = await Promise.all([loadDataSoKeToan(), getAllVendor()]);

        const relevantVendors = company === "HQ" ? vendors : vendors.filter(v => v.company === company);
        const relevantSoKeToan = company === "HQ" ? listSoKeToan : listSoKeToan.filter(s => s.company === company);

        const nonEditableProjects = [];
        relevantVendors.forEach(vendor => {
            const matchingRecord = relevantSoKeToan.find(skt => skt.vender === vendor.name && skt.company === vendor.company);
            vendor.isEditable = !matchingRecord;
            if (vendor.isEditable) {
                nonEditableProjects.push(vendor);
            }
        });
        setListEditData(nonEditableProjects)
        return relevantVendors;
    };


    const loadData = async () => {
        let data;
        if (company === "HQ") {
            data = await fetchVendorData("HQ");
        } else {
            data = await fetchVendorData(company);
        }
        setRowData(data);
        setLoading(false);
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
                        ...await EditTable()
                    },
                    {
                        field: 'name',
                        headerName: 'Tên khách hàng (lấy từ sổ kế toán)',
                        flex: 1,
                        editable: params => params.data.isEditable,
                        ...filter(),
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined;
                            },
                        },
                    },
                    {
                        field: 'group',
                        flex: 1,
                        headerName: 'Nhóm khách hàng khi lên báo cáo',
                        editable: true,
                        ...filter(),
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined;
                            },
                        },
                        ...await EditTable()
                    },
                    // {
                    //     field: "duyet",
                    //     width: 80,
                    //     headerName: 'Trạng thái',
                    //     cellEditor: 'agRichSelectCellEditor',
                    //     suppressHeaderMenuButton: true,
                    //     cellEditorParams: {
                    //         values: customSelectDuyet.map(item => item.id.toString()),
                    //         formatValue: function (value) {
                    //             const found = customSelectDuyet.find(item => item.id.toString() === value);
                    //             return found ? found.name : value;
                    //         }
                    //     },
                    //     valueFormatter: function (params) {
                    //         const selectedItem = customSelectDuyet.find(item => item.id.toString() === params.value);
                    //         return selectedItem ? selectedItem.name : null;
                    //     },
                    //     valueParser: function (params) {
                    //         const found = customSelectDuyet.find(item => item.name === params.newValue);
                    //         return found ? found.id.toString() : null;
                    //     },
                    //     cellClassRules: {
                    //         'daduyet': (params) => params.data.duyet == 1,
                    //     },
                    //     editable: false
                    // },
                    {
                        pinned: 'left',
                        width: '40',
                        field: 'action',
                        cellStyle: {textAlign: 'center'},
                        headerName: '',
                        cellRenderer: (params) => {
                            // if (!params.data || !params.data.id || params.data.duyet == 1 || !params.data.isEditable) {
                            //     return null;
                            // }
                            return (
                                <PopupDeleteRenderer
                                    {...params.data}
                                    id={params.data.id}
                                    table={table}
                                    reloadData={onGridReady}
                                    // disable={params.data.duyet == 1}
                                />
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

    // const onRowDoubleClicked = (event) => {
    //     setOldData(event.data);
    //     setShowProjectFormUpdate(true);
    // };
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

    const handleAddRow = useCallback(async () => {
        await handleAddAgl(
            company,
            {
                system_created_at: getCurrentDateTimeWithHours(),
                company: company,
                show: true,
            },
            table,
            onGridReady,setIsUpdateNoti ,isUpdateNoti
        );
    }, [onGridReady]);
    const onRowDoubleClicked = (event) => {
        setOldData(event.data);
        setShowProjectFormUpdate(true);
    };
    return (
        <>
            {call !== 'cdsd' && <>
            <div className={'header-powersheet'}>
                <div className={css.headerTitle}>
                    <span>Quản lý khách hàng <TooltipHeaderIcon table={table}/></span>
                </div>
                <div className={css.headerPowersheet2}>
                <div className={css.headerAction}>
                    {
                        listEditData.length > 0 &&
                        <ActionDeleteDataAllowed listDataAllowDelete={listEditData} table={table}
                                                 loadData={loadData}/>

                    }
                                      <ActionCreate handleAddRow={handleAddRow}/>
                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>
  
                </div>
            </div>
            </div>
            </>}
           
            <div style={{width: '100%', height: '11%', boxSizing: "border-box"}}>
                <RichNoteKTQTRI table={`${table + '-' + company}`}/>
            </div>
            <div
                style={{
                    height: call === 'cdsd' ? '79%' : '61vh',
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
                        enableRangeSelection={true}
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        onCellValueChanged={handleCellValueChanged}
                        rowSelection="multiple"
                        animateRows={true}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onRowDoubleClicked={onRowDoubleClicked}
                    />
                </div>
            </div>
        </>
    );
}
