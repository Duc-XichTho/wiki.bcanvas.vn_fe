import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';

import {getAllKmns} from '../../../apisKTQT/kmnsService.jsx';
import {onFilterTextBoxChanged} from "../../../generalFunction/quickFilter.js";
import {MyContext} from "../../../MyContext.jsx";
import {handleSaveAgl} from "../functionKTQT/handleSaveAgl.js";
import {getCurrentDateTimeWithHours} from "../functionKTQT/formatDate.js";
import {handleAddAgl} from "../functionKTQT/handleAddAgl.js";
import PopupDeleteRenderer from "../popUp/popUpDelete.jsx";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import TooltipHeaderIcon from "../HeaderTooltip/TooltipHeaderIcon.jsx";
import css from "../KeToanQuanTriComponent/KeToanQuanTri.module.css"
import {getAllUnits} from "../../../apisKTQT/unitService.jsx";
import RichNoteKTQTRI from "../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionDeleteDataAllowed from "../ActionButton/ActionDeleteDataAllowed.jsx";
import ActionCreate from "../../Home/AgridTable/actionButton/ActionCreate.jsx";
import {setItemInIndexedDB2} from '../storage/storageService.js';
import SettingGroup from "./SettingGroup.jsx";
import {getAllSettingGroup} from "../../../apisKTQT/settingGroupService.jsx";
import {Button} from "antd";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {permissionForKtqt} from "../functionKTQT/permissionForKtqt/permissionForKtqt.js";
import {LoadingOutlined} from "@ant-design/icons";
import '../VanHanh/cssSKT.css'
import ActionSave from "../../Home/AgridTable/actionButton/ActionSave.jsx";
import DropdownImportDM_VV_K from "../popUp/importDanhMuc/DropdownImportDM_VV_K.jsx";
import DropdownImportDM_KMNS from "../popUp/importDanhMuc/DropdownImportDM_KMNS.jsx";
import Loading from '../../Loading/Loading.jsx';

export default function Kmns({company, call, type}) {
    let {
        loadDataSoKeToan,
        listCompany,
        userClasses,
        fetchUserClasses,
        setIsUpdateNoti,
        isUpdateNoti
    } = useContext(MyContext);
    const table = 'Kmns';
    const key = 'DANHMUC_THU_CHI';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listUnit, setListUnit] = useState([]);
    const [listGroup, setListGroup] = useState([]);
    const [listEditData, setListEditData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [hasEditableRows, setHasEditableRows] = useState(false);
    const [reload, setReload] = useState(false);
    const [listGroupNull, setListGroupNull] = useState([]);
    const [isFilteredGroup, setIsFilteredGroup] = useState(false);
    const [loadingCount, setLoadingCount] = useState(false);

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    async function EditTable() {
        const user = await getCurrentUserLogin()
        let permission = await permissionForKtqt(user, userClasses, fetchUserClasses)
        return {editable: permission}
    }

    function reloadFunc() {
        setReload(prevState => !prevState)
    }

    const defaultColDef = useMemo(
        () => ({
            editable: true,
            cellStyle: {fontSize: '14.5px'},
            resizeable: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
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

    const fetchData = useCallback(async () => {
        try {
            const data = await getAllSettingGroup()
            let unitGroup = data.filter(e => e?.type == 'kmns');
            setListGroup(unitGroup);
            let groupOption = unitGroup.map(item => item.name)
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
                    // hide: type == 1

                },
                {
                    field: 'name',
                    headerName: 'Tên trên sổ kế toán',
                    flex: 1, ...filter(),
                    editable: params => params.data.isEditable,
                },
                {
                    field: 'dp',
                    flex: 1,
                    headerName: 'Tên thể hiện trên báo cáo',
                    ...filter(),
                    ...await EditTable()
                },
                {
                    field: 'mo_ta',
                    headerName: 'Gom nhóm thể hiện trên báo cáo',
                    ...filter(),
                    flex: 1,
                    cellClassRules: {
                        'data-error': (params) => {
                            return params.value === '' || params.value === null || params.value === undefined || !groupOption.includes(params.value);
                        },
                    },
                    cellEditor: 'agRichSelectCellEditor',
                    cellEditorParams: {
                        allowTyping: true,
                        filterList: true,
                        highlightMatch: true,
                        values: groupOption,
                    },
                    ...await EditTable()
                },
                // {
                //     width: 40, field: "action",suppressMenu: true, headerName: "", cellRenderer: params => (
                //         <PopupActionRenderer {...params.data} id={params.data.id} table={table} userId={user.id} userTitle={user.name} />
                //     )
                // },
                {
                    pinned: 'left',
                    width: 40,
                    field: 'action',
                    suppressMenu: true,
                    headerName: '',
                    cellStyle: {textAlign: 'center'},
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
    }, []);

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

    const onGridReady = useCallback(async () => {
        await loadData()
    }, [company, reload]);

    const fetchKmnsData = async (company) => {
        const [listSoKeToan, data] = await Promise.all([loadDataSoKeToan(), getAllKmns()]);

        const relevantKMNS = company === "HQ" ? data : data.filter(v => v.company === company);
        const relevantSoKeToan = company === "HQ" ? listSoKeToan : listSoKeToan.filter(s => s.company === company);

        const sktSet = new Set(relevantSoKeToan.map(s => s.kmns));
        const nonEditableProjects = [];

        relevantKMNS.forEach(kmns => {
            const matchingRecord = relevantSoKeToan.find(skt => skt.kmns === kmns.name && skt.company === kmns.company);
            kmns.isEditable = !matchingRecord;
            if (kmns.isEditable) {
                nonEditableProjects.push(kmns);
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

        return relevantKMNS;
    };

    const countGroupNull = async (data) => {
        const value = await getAllSettingGroup()
        let unitGroup = value.filter(e => e?.type == 'kmns');
        let groupOption = unitGroup.map(item => item.name)

        let checkGroup = []
        data.forEach(e => {
            if (e.mo_ta === '' || e.mo_ta === null || e.mo_ta === undefined || !groupOption.includes(e.mo_ta)) checkGroup.push(e)
        })
        setListGroupNull(checkGroup)
    }

    const loadData = async () => {
        let data;
        if (company === "HQ") {
            data = await fetchKmnsData("HQ");
        } else {
            data = await fetchKmnsData(company);
        }
        await setItemInIndexedDB2(key, data);
        await countGroupNull(data);
        setRowData(data);
        checkEditableRows(data)
        setLoading(false);
    };


    useEffect(() => {
        setLoading(true);
        loadData();
    }, [company, reload]);

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
        fetchData();
    }, [fetchData, reload]);

    const handleAddRow = async () => {
        setIsFilteredGroup(false)
        await handleAddAgl(
            company,
            {
                company: company,
                createAt: getCurrentDateTimeWithHours(),
                show: true,
            },
            table, onGridReady, setIsUpdateNoti, isUpdateNoti
        );
    };


    function handleFilterNotKM(group, data) {
        if (!isFilteredGroup) {
            setRowData(listGroupNull);
        } else {
            loadData();
        }
        setIsFilteredGroup(!isFilteredGroup);
    }

    return (
        <>
            <div className={'header-powersheet'}>
                {!call && <>
                    <div className={css.headerTitle}>
                        <span>Khoản mục Thu chi<TooltipHeaderIcon table={table}/></span>
                    </div>
                </>}
                <div className={css.headerAction}>
                    <SettingGroup table={table} reload={reloadFunc}/>
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
                    <DropdownImportDM_KMNS
                        table={table}
                        reload={reloadFunc}
                        columnDefs={colDefs}
                        company={company}
                        data={rowData}
                        title_table={'Quản lý - Khoản mục thi chi'}
                        type_setting_group={'kmns'}
                        listGroup={listGroup}
                        listUnit={listUnit}
                        groupFieldName={'mo_ta'}
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
                                cáo thu chi hoặc sai với thiết lập nhóm
                            </>
                            }
                        </div>
                    }
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
                        // pagination
                        onCellValueChanged={handleCellValueChanged}
                        // paginationPageSize={500}
                        animateRows
                        // paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                        localeText={AG_GRID_LOCALE_VN}
                        onGridReady={onGridReady}
                    />
                </div>
            </div>
        </>
    );
}
