import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid Function
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import '../../Home/AgridTable/agComponent.css';
import { getAllProject } from '../../../apisKTQT/projectService.jsx';
import css from '../KeToanQuanTriComponent/KeToanQuanTri.module.css';
import TooltipHeaderIcon from '../HeaderTooltip/TooltipHeaderIcon.jsx';
import { getAllUnits } from '../../../apisKTQT/unitService.jsx';
import { onFilterTextBoxChanged } from '../../../generalFunction/quickFilter.js';
import { MyContext } from '../../../MyContext.jsx';
import { handleSaveAgl } from '../functionKTQT/handleSaveAgl.js';
import { getCurrentDateTimeWithHours } from '../functionKTQT/formatDate.js';
import { handleAddAgl } from '../functionKTQT/handleAddAgl.js';
import PopupDeleteRenderer from '../popUp/popUpDelete.jsx';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import RichNoteKTQTRI from '../../Home/SelectComponent/RichNoteKTQTRI.jsx';
import ActionDeleteDataAllowed from '../ActionButton/ActionDeleteDataAllowed.jsx';
import ActionCreate from '../../Home/AgridTable/actionButton/ActionCreate.jsx';
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
export default function Project({company, call, type}) {
    let {
        fetchAllProject,
        listProject,
        loadDataSoKeToan,
        listCompany,
        userClasses,
        fetchUserClasses,
        setIsUpdateNoti,
        isUpdateNoti
    } = useContext(MyContext);
    const table = 'Project';
    const key = 'DANHMUC_VU_VIEC';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [updatedData, setUpdatedData] = useState([]);
    const [listUnit, setListUnit] = useState([]);
    const [listGroup, setListGroup] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [oldData, setOldData] = useState({});
    const [showProjectFormUpdate, setShowProjectFormUpdate] = useState(false);
    const [listEditData, setListEditData] = useState([]);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const [listGroupNull, setListGroupNull] = useState([]);
    const [isFilteredGroup, setIsFilteredGroup] = useState(false);
    const [loadingCount, setLoadingCount] = useState(false);

    async function EditTable() {
        const user = await getCurrentUserLogin()
        let permission = await permissionForKtqt(user, userClasses, fetchUserClasses)
        return {editable: permission}
    }

    const defaultColDef = useMemo(() => {
        return {
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            editable: true,
            cellClassRules: {
                'cell-small': (params) => params.colDef.width < 150,
            },
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    const onGridReady = useCallback(async () => {
        loadData()
    }, [company]);

    const fetchProjectData = async (company) => {
        const [listSoKeToan, data] = await Promise.all([getAllSoKeToan(), getAllProject()]);

        const relevantProject = company === "HQ" ? data : data.filter(v => v.company === company);
        const relevantSoKeToan = company === "HQ" ? listSoKeToan : listSoKeToan.filter(s => s.company === company);

        const nonEditableProjects = [];

        relevantProject.forEach(project => {
            const matchingRecord = relevantSoKeToan.find(skt => skt.project2 === project.code && skt.company === project.company);
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
        return relevantProject;
    };

    function countGroupNull(data) {
        getAllSettingGroup().then(value => {
            const filteredData = value.filter((e) => e?.type === 'project');
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
            data = await fetchProjectData("HQ");
        } else {
            data = await fetchProjectData(company);
        }
        // data = data.filter((e) => !e.isEditable);
        await setItemInIndexedDB2(key, data);
        // countGroupNull(data);
        getAllSettingGroup().then(data => {
            const filteredData = data.filter((e) => e?.type === 'project');
            setListGroup(filteredData);
        })
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
                    //     // hide: !type
                    // },
                    // {
                    //     field: 'unit_code',
                    //     headerName: 'Đơn vị',
                    //     width: 80,
                    //     ...filter(),
                    //     cellEditor: 'agRichSelectCellEditor',
                    //     editable: params => params.data.isEditable,
                    //     cellEditorParams: {
                    //         allowTyping: true,
                    //         filterList: true,
                    //         highlightMatch: true,
                    //         values: listUnit.map((p) => p.name),
                    //     },
                    //     // hide: type == 1
                    //
                    // },
                    {
                        field: 'name',
                        headerName: 'Tên trên sổ hợp nhất',
                        flex: 1,
                        ...filter(),
                        editable: params => params.data.isEditable,
                    },
                    {
                        field: 'code',
                        headerName: 'Mã để tính số liệu báo cáo',
                        flex: 1,
                        ...filter(),
                        editable: params => params.data.isEditable,
                    },
                    {
                        field: 'group',
                        headerName: 'Nhóm báo cáo KQKD',
                        flex: 1,
                        ...filter(),
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined || !listGroup.map((p) => p?.name).includes(params.value);
                            },
                        },
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: listGroup.map(p => p.name),
                        },
                        ...await EditTable()
                    },
                ]);
            } catch (error) {
                console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table]);

    const onRowDoubleClicked = (event) => {
        setOldData(event.data);
        setShowProjectFormUpdate(true);
    };

    const handleAddRow = useCallback(async () => {
        setListGroupNull(false)
        setIsFilteredGroup(false)
        await handleAddAgl(
            company,
            {
                system_created_at: getCurrentDateTimeWithHours(),
                company: company,
                show: true,
            },
            table,
            onGridReady, setIsUpdateNoti, isUpdateNoti
        );
    }, [onGridReady]);

    const handleCellValueChanged = (event) => {
        const updatedRow = {...event.data};
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
                        <span>Quản lý vụ việc <TooltipHeaderIcon table={table}/></span>
                    </div>
                </>}
                <div className={css.headerAction}>
                    <SettingGroup table={table} reload={onGridReady}/>
                    {
                        listEditData.length > 0 &&
                        <ActionDeleteDataAllowed listDataAllowDelete={listEditData} table={table}
                                                 loadData={loadData}/>

                    }
                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>
                    <ActionCreate handleAddRow={handleAddRow}/>

                        <DropdownImportDM_VV_K
                            table={table}
                            reload={loadData}
                            columnDefs={colDefs}
                            company={company}
                            data={rowData}
                            title_table={'Quản lý vụ việc'}
                            type_setting_group={'project'}
                            listGroup={listGroup}
                            listUnit={listUnit}
                            groupFieldName={'group'}
                        />

                </div>
            </div>
            <div className={css.headerPowersheet2}>
                <div className={`${css.headerActionButton}`}>
                    {listGroupNull.length > 0 &&
                        <div className={`${css.checkKM} ${isFilteredGroup ? css.activeNotification : ''}`}
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
                        ref={gridRef}
                        rowData={rowData}
                        statusBar={statusBar}
                        enableRangeSelection={true}
                        defaultColDef={defaultColDef}
                        columnDefs={colDefs}
                        rowSelection="multiple"
                        animateRows={true}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                        onRowDoubleClicked={onRowDoubleClicked}
                        paginationPageSize={500}
                        paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                        onCellValueChanged={handleCellValueChanged}

                    />
                </div>
            </div>
        </>
    );
}
