'use strict';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
// Ag Grid Function
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { AgGridReact } from 'ag-grid-react';
import '../../Home/AgridTable/agComponent.css';
import css from '../KeToanQuanTriComponent/KeToanQuanTri.module.css';
import { onFilterTextBoxChanged } from '../../../generalFunction/quickFilter.js';
import { MyContext } from '../../../MyContext.jsx';
import { handleSaveAgl } from '../functionKTQT/handleSaveAgl.js';
import { getCurrentDateTimeWithHours } from '../functionKTQT/formatDate.js';
import { handleAddAgl } from '../functionKTQT/handleAddAgl.js';
import PopupDeleteRenderer from '../popUp/popUpDelete.jsx';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import TooltipHeaderIcon from '../HeaderTooltip/TooltipHeaderIcon.jsx';
import { getAllKenh } from '../../../apisKTQT/kenhService.jsx';
import { getAllUnits } from '../../../apisKTQT/unitService.jsx';
import RichNoteKTQTRI from '../../Home/SelectComponent/RichNoteKTQTRI.jsx';
import { setItemInIndexedDB2 } from '../storage/storageService.js';
import SettingGroup from './SettingGroup.jsx';
import { getAllSettingGroup } from '../../../apisKTQT/settingGroupService.jsx';
import { getCurrentUserLogin } from '../../../apis/userService.jsx';
import { permissionForKtqt } from '../functionKTQT/permissionForKtqt/permissionForKtqt.js';
import { LoadingOutlined } from '@ant-design/icons';
import '../VanHanh/cssSKT.css';
import ActionSave from '../../Home/AgridTable/actionButton/ActionSave.jsx';
import DropdownImportDM_VV_K from '../popUp/importDanhMuc/DropdownImportDM_VV_K.jsx';
import Loading from '../../Loading/Loading.jsx';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function Kenh({company, type, call}) {
    const table = 'Kenh';
    const key = 'DANHMUC_VU_VIEC';
    const gridRef = useRef();
    const {
        loadDataSoKeToan,
        listCompany,
        userClasses,
        fetchUserClasses,
        setIsUpdateNoti,
        isUpdateNoti
    } = useContext(MyContext)
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [listGroup, setListGroup] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listUnit, setListUnit] = useState([]);
    const [listEditData, setListEditData] = useState([]);
    const [listGroupNull, setListGroupNull] = useState([]);
    const [isFilteredGroup, setIsFilteredGroup] = useState(false);
    const [loadingCount, setLoadingCount] = useState(false);

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    async function EditTable() {
        const user = await getCurrentUserLogin()
        let permission = await permissionForKtqt(user, userClasses, fetchUserClasses)
        return {editable: permission}
    }


    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const fetchTeamData = async (company) => {
        const [listSoKeToan, data] = await Promise.all([getAllSoKeToan(), getAllKenh()]);

        const relevantTeam = company === "HQ" ? data : data.filter(v => v.company === company);
        const relevantSoKeToan = company === "HQ" ? listSoKeToan : listSoKeToan.filter(s => s.company === company);
        const nonEditableProjects = [];

        relevantTeam.forEach(project => {
            const matchingRecord = relevantSoKeToan.find(skt => skt.kenh2 === project.code && skt.company === project.company);
            project.isEditable = !matchingRecord;
            if (project.isEditable) {
                nonEditableProjects.push(project);
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
        getAllSettingGroup().then(data => {
            const filteredData = data.filter((e) => e?.type === 'kenh');
            setListGroup(filteredData);
        })
        return relevantTeam;

    };

    const onGridReady = useCallback(async () => {
        loadData()
    }, [company]);

    function countGroupNull(data) {
        getAllSettingGroup().then(value => {
            const filteredData = value.filter((e) => e?.type === 'kenh');
            let checkGroup = []
            data.forEach(e => {
                if (e.group === '' || e.group === null || e.group === undefined || !filteredData.map((p) => p?.name).includes(e.group)) checkGroup.push(e)
            })
            setListGroupNull(checkGroup)
        })

    }

    const loadData = async () => {
        let data;
        if (company === "HQ") {
            data = await fetchTeamData("HQ");
        } else {
            data = await fetchTeamData(company);
        }
        setIsUpdateNoti(!isUpdateNoti)
        await setItemInIndexedDB2(key, data);
        // data = data.filter((e) => !e.isEditable);
        // countGroupNull(data);
        setRowData(data);
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [company ]);

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
                    // {
                    //     field: 'id',
                    //     headerName: 'STT',
                    //     hide: false,
                    //     width: 80,
                    //     ...filter(),
                    // },
                    // {
                    //     field: 'company',
                    //     headerName: 'Công ty',
                    //     width: 90,
                    //     suppressHeaderMenuButton: true,
                    //     ...filter(),
                    //     editable: params => params.data.isEditable,
                    //     cellStyle: {textAlign: "left"},
                    //     cellEditor: 'agRichSelectCellEditor',
                    //     cellEditorParams: {
                    //         allowTyping: true,
                    //         filterList: true,
                    //         highlightMatch: true,
                    //         values: listCompany.map((p) => p.code),
                    //     },
                    //     // hide: type == 1
                    // },
                    // {
                    //     field: 'unit_code',
                    //     headerName: 'Đơn vị',
                    //     width: 80,
                    //     ...filter(),
                    //     cellEditor: 'agRichSelectCellEditor',
                    //     cellEditorParams: {
                    //         allowTyping: true,
                    //         filterList: true,
                    //         highlightMatch: true,
                    //         values: listUnit.map((p) => p.name),
                    //     },
                    //     editable: params => params.data.isEditable,
                    //     // hide: type == 1
                    // },
                    {
                        field: 'code',
                        headerName: 'Mã để tính số liệu báo cáo',
                        flex: 1,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Tên trên sổ hợp nhất',
                        flex: 1,
                        ...filter(),
                        editable: params => params.data.isEditable,
                    },
                    // {
                    //     field: 'dp',
                    //     flex: 1,
                    //     headerName: 'Tên thể hiện',
                    //     ...filter(),
                    //     // hide: !type
                    // },
                    {
                        field: 'group',
                        flex: 1,
                        headerName: 'Nhóm báo cáo KQKD',
                        ...filter(),
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listGroup.map((p) => p?.name),
                        },
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined || !listGroup.map((p) => p?.name).includes(params.value);
                            },
                        },
                        ...await EditTable()

                    },
                    // {
                    //     field: 'mo_ta',
                    //     headerName: 'Mô tả',
                    //     width: 150,
                    //     ...filter(),
                    //     // hide: type == 1
                    // },
                    // {
                    //     field: 'chu_thich',
                    //     headerName: 'Chú thích',
                    //     width: 150,
                    //     ...filter(),
                    //     // hide: type == 1
                    // },
                ]);
            } catch (error) {
                console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table]);

    const handleAddRow = useCallback(async () => {
        const newItems = {
            createAt: getCurrentDateTimeWithHours(),
            company: company,
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

    function handleFilterNotKM(type, data) {
        if (type == 'group') {
            if (!isFilteredGroup) {
                setRowData(listGroupNull);
            } else {
                loadData();
            }
            setIsFilteredGroup(!isFilteredGroup);
        }
    }

    return (
        <>

            <div className={'header-powersheet'}>
                {call !== 'cdsd' && <>
                    <div className={css.headerTitle}>
                        <span>Quản lý Kênh <TooltipHeaderIcon table={table}/></span>
                    </div>
                </>}
                <div className={css.headerAction}>
                    <SettingGroup table={table} reload={onGridReady}/>
                    {/*{*/}
                    {/*    listEditData.length > 0 &&*/}
                    {/*    <ActionDeleteDataAllowed listDataAllowDelete={listEditData} table={table}*/}
                    {/*                             loadData={loadData}/>*/}

                    {/*}*/}
                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>
                    {/*<ActionCreate handleAddRow={handleAddRow}/>*/}
                    <DropdownImportDM_VV_K
                        table={table}
                        reload={loadData}
                        columnDefs={colDefs}
                        company={company}
                        data={rowData}
                        title_table={'Quản lý kênh'}
                        type_setting_group={'kenh'}
                        listGroup={listGroup}
                        listUnit={listUnit}
                        groupFieldName={'group'}
                    />
                </div>
            </div>
            <div className={css.headerPowersheet2}>
                <div className={`${css.headerActionButton}`}>
                    {listGroupNull.length > 0 &&
                        <div
                            className={`${css.checkKM} ${isFilteredGroup ? css.activeNotification : ''}`}
                            onClick={() => {
                                handleFilterNotKM('group', listGroupNull)
                            }}>
                            {loadingCount ? <LoadingOutlined/> : <>Có {listGroupNull.length} dòng chưa điền nhóm lên báo
                                cáo KQKD hoặc sai với thiết lập nhóm
                            </>}

                        </div>}
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
                        onCellValueChanged={handleCellValueChanged}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                    />
                </div>
            </div>
        </>
    );
}
