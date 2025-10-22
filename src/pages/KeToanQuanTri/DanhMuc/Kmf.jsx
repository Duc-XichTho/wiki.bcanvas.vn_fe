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
import { getAllUnits } from '../../../apisKTQT/unitService.jsx';
import { getAllCoCauPhanBo } from '../../../apisKTQT/coCauPhanBoService.jsx';
import css from '../KeToanQuanTriComponent/KeToanQuanTri.module.css';
import { onFilterTextBoxChanged } from '../../../generalFunction/quickFilter.js';
import { MyContext } from '../../../MyContext.jsx';
import { handleSaveAgl } from '../functionKTQT/handleSaveAgl.js';
import { getCurrentDateTimeWithHours } from '../functionKTQT/formatDate.js';
import { handleAddAgl } from '../functionKTQT/handleAddAgl.js';
import PopupDeleteRenderer from '../popUp/popUpDelete.jsx';
import AG_GRID_LOCALE_VN from '../../Home/AgridTable/locale.jsx';
import TooltipHeaderIcon from '../HeaderTooltip/TooltipHeaderIcon.jsx';
import RichNoteKTQTRI from '../../Home/SelectComponent/RichNoteKTQTRI.jsx';
// API
import { setItemInIndexedDB2 } from '../storage/storageService.js';
import { getAllKmf } from '../../../apisKTQT/kmfService.jsx';
import { getAllSettingGroup } from '../../../apisKTQT/settingGroupService.jsx';
import { getCurrentUserLogin } from '../../../apis/userService.jsx';
import { permissionForKtqt } from '../functionKTQT/permissionForKtqt/permissionForKtqt.js';
import { LoadingOutlined } from '@ant-design/icons';
import ActionSave from '../../Home/AgridTable/actionButton/ActionSave.jsx';
import Loading from '../../Loading/Loading.jsx';
import { getAllSoKeToan } from '../../../apisKTQT/soketoanService.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function Kmf({company, call, type}) {
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
    const table = 'Kmf';
    const key = 'DANHMUC_KM_KQKD'
    const gridRef = useRef();
    const [listUnit, setListUnit] = useState([]);
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listCoChePhanBo, setListCoChePhanBo] = useState([]);
    const [listEditData, setListEditData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [hasEditableRows, setHasEditableRows] = useState(false);
    const [listCodeNull, setListCodeNull] = useState([]);
    const [listGroupNull, setListGroupNull] = useState([]);
    const [isFilteredCode, setIsFilteredCode] = useState(false);
    const [isFilteredGroup, setIsFilteredGroup] = useState(false);
    const [loadingCount, setLoadingCount] = useState(false);

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

    const fetchKmfData = async (company) => {
        const [listSoKeToan, data] = await Promise.all([getAllSoKeToan(), getAllKmf()]);

        const relevantKMF = company === "HQ" ? data : data.filter(v => v.company === company);
        const relevantSoKeToan = company === "HQ" ? listSoKeToan : listSoKeToan.filter(s => s.company === company);
        const nonEditableProjects = [];
        relevantKMF.forEach(kmf => {
            const matchingRecord = relevantSoKeToan.find(skt => skt.kmf === kmf.name && skt.company === kmf.company);
            kmf.isEditable = !matchingRecord;
            if (kmf.isEditable) {
                nonEditableProjects.push(kmf);
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

        return relevantKMF;
    };

    const loadData = async () => {
        const datas = await getAllSettingGroup()
        let filteredData = datas.filter(e => e?.type == 'kh_kmf');
        let groupKHOption = filteredData.map(item => item.stt + '. ' + item.name + ' (' + item.phan_loai + ')')
        let data;
        if (company === "HQ") {
            data = await fetchKmfData("HQ");
        } else {
            data = await fetchKmfData(company);
        }
        let checkCode = []
        let checkGroup = []
        // data = data.filter((e) => !e.isEditable);
        data.forEach(e => {
            if (e.group) {
                e.groupDP = e.group

                if (e.group.includes("*")) {
                    e['*'] = true
                }
                if (e.group.includes("#")) {
                    e['#'] = true
                }
            }
            if (e.code === '' || e.code === null || e.code === undefined || !['DT', 'DTTC', 'VC', 'FC', 'MC', 'CFTC', 'OI', 'OE', 'TAX', 'KH'].includes(e.code)) checkCode.push(e)
            if (e.group === '' || e.group === null || e.group === undefined || !groupKHOption.includes(e.group)) checkGroup.push(e)
        })
        setListGroupNull(checkGroup)
        setListCodeNull(checkCode)
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

            const data = await getAllSettingGroup()
            let filteredData = data.filter(e => e?.type == 'kh_kmf');
            let groupKHOption = filteredData.map(item => item.stt + '. ' + item.name + ' (' + item.phan_loai + ')')
            try {
                setColDefs([
                    // {
                    //     field: 'id',
                    //     headerName: 'ID',
                    //     hide: false,
                    //     width: 100,
                    //     ...filter(),
                    //     editable: false,
                    //     cellStyle: {textAlign: "left"}
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
                    //     // hide: type == 1 || type == 2
                    //
                    // },
                    {
                        field: 'name',
                        flex: 1,
                        headerName: 'Tên trên sổ hợp nhất',
                        ...filter(),
                        editable: params => params.data.isEditable,
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined;
                            },
                        },
                    },
                    // {
                    //     field: 'dp',
                    //     flex: 1,
                    //     headerName: 'Tên trên báo cáo KQKD',
                    //     ...filter(),
                    //     ...await EditTable()
                    // },

                    // {
                    //     field: '*',
                    //     headerName: '* (?)',
                    //     headerTooltip: 'Điền chi tiết ở kế hoạch',
                    //     width: 45,
                    //     suppressMenu: true,
                    //     cellRenderer: 'agCheckboxCellRenderer',
                    //     editable: true,
                    // },
                    // {
                    //     field: '#',
                    //     headerName: '# (?)',
                    //     headerTooltip: 'Tính lãi lộ hoạt động ở kế hoạch',
                    //     width: 45,
                    //     suppressMenu: true,
                    //     cellRenderer: 'agCheckboxCellRenderer',
                    //     editable: true,
                    // },
                    // {
                    //     field: 'groupDP',
                    //     flex: 1,
                    //     headerName: 'Nhóm kế hoạch KQKD',
                    //     ...filter(),
                    //     cellClassRules: {
                    //         'data-error': (params) => {
                    //             return params.value === '' || params.value === null || params.value === undefined || !groupKHOption.includes(params.value);
                    //         },
                    //     },
                    //     // hide: (type === undefined || type === null) && call !== 'cdsd' ? true : (type === 1 ? true : false),
                    //     cellEditor: 'agRichSelectCellEditor',
                    //     cellEditorParams: {
                    //         allowTyping: true,
                    //         filterList: true,
                    //         highlightMatch: true,
                    //         values: groupKHOption,
                    //     },
                    //     ...await EditTable()
                    //
                    // },
                    {
                        field: 'code',
                        headerName: 'Nhóm báo cáo KQKD',
                        flex: 1,
                        cellClassRules: {
                            'data-error': (params) => {
                                return params.value === '' || params.value === null || params.value === undefined || !['DT', 'DTTC', 'VC', 'FC', 'MC', 'CFTC', 'OI', 'OE', 'TAX', 'KH'].includes(params.value);
                            },
                        },
                        cellEditor: 'agRichSelectCellEditor',
                        cellEditorParams: {
                            allowTyping: true,
                            filterList: true,
                            highlightMatch: true,
                            values: ['DT', 'DTTC', 'VC', 'FC', 'MC', 'CFTC', 'OI', 'OE', 'TAX'],
                        },
                        valueFormatter: (params) => {
                            const mapping = {
                                'DT': 'DT - Doanh thu',
                                'DTTC': 'DTTC - Doanh thu tài chính',
                                'VC': 'VC - Chi phí biến đổi',
                                'FC': 'FC - Chi phí cố định',
                                'MC': 'MC - Chi phí hỗn hợp',
                                'CFTC': 'CFTC - Không đổi',
                                'OI': 'OI - Thu nhập khác',
                                'OE': 'OE - Chi phí khác',
                                'TAX': 'TAX - Thuế',
                                'KH': 'KH - Khấu hao'
                            };
                            return mapping[params.value] || params.value;
                        },
                        valueParser: (params) => {
                            return params.newValue.split(' - ')[0]; // Lưu giá trị gốc khi nhập từ ô chỉnh sửa
                        },
                        ...filter(),
                        ...await EditTable()
                    },
                    // {
                    //     field: 'mo_ta',
                    //     flex: 1,
                    //     headerName: 'Mô tả',
                    //     ...filter(),
                    //     // hide: type == 2 || type == 1
                    // },
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
        setIsFilteredCode(false)
        setIsFilteredGroup(false)
        const newItems = {
            company: company,
            createAt: getCurrentDateTimeWithHours(),
            show: true,
        };
        await handleAddAgl(company, newItems, table, onGridReady, setIsUpdateNoti, isUpdateNoti);
    }, [onGridReady]);

    const handleCellValueChanged = async (event) => {
        const updatedRow = {...event.data};
        let group = '';
        if (event.colDef.field === '*') {
            if (event.value) group += '*';
            else updatedRow.group = updatedRow.group.replace(/[()*]/g, '');
        }
        if (event.colDef.field === '#') {
            if (event.value) group += '#';
            else updatedRow.group = updatedRow.group.replace(/[()#]/g, '');
        }

        updatedRow.group = (updatedRow.groupDP || '') + (group || '');

        updatedRow.user = currentUser;
        updatedRow.oldValue = event.oldValue;

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
        if (!isEditingMode) {
            await loadData();
        }
        setLoading(false)
    };


    function handleFilterNotKM(type, data) {
        if (type == 'code') {
            if (!isFilteredCode) {
                setRowData(listCodeNull);
            } else {
                loadData();
            }
            setIsFilteredCode(!isFilteredCode);
        }

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
                        <span>Khoản mục KQKD <TooltipHeaderIcon table={table}/></span>
                    </div>

                </>}
                <div className={css.headerAction}>
                    {/*<SettingGroup table={table} reload={onGridReady}/>*/}
                    {/*{*/}
                    {/*    listEditData.length > 0 &&*/}
                    {/*    <ActionDeleteDataAllowed listDataAllowDelete={listEditData} table={table}*/}
                    {/*                             loadData={loadData}/>*/}

                    {/*}*/}
                    {/*{*/}
                    {/*    hasEditableRows &&*/}
                    {/*    <Button*/}
                    {/*        type="primary"*/}
                    {/*        onClick={toggleEditMode}*/}
                    {/*        style={{backgroundColor: "#ee8b67", borderColor: "#ee8b67"}}*/}
                    {/*    >*/}
                    {/*        {isEditingMode ? "Tắt chế độ sửa" : "Lọc dòng cần sửa"}*/}
                    {/*    </Button>*/}
                    {/*}*/}

                    <ActionSave handleSaveData={handleSaveData} updateData={updatedData}/>
                    {/*<ActionCreate handleAddRow={handleAddRow}/>*/}
                    {/*<DropdownImportDM_KMF*/}
                    {/*    table={table}*/}
                    {/*    reload={loadData}*/}
                    {/*    columnDefs={colDefs}*/}
                    {/*    company={company}*/}
                    {/*    data={rowData}*/}
                    {/*    title_table={'Quản lý khoản mục KQKD'}*/}
                    {/*    type_setting_group={'kmf'}*/}
                    {/*    listGroup={listGroupNull}*/}
                    {/*    listUnit={listUnit}*/}
                    {/*    groupFieldName={'code'}*/}
                    {/*/>*/}
                </div>
            </div>
            <div className={css.headerPowersheet2}>
                <div className={`${css.headerActionButton}`}>
                    {listCodeNull.length > 0 &&
                        <div
                            className={`${css.checkKM} ${isFilteredCode ? css.activeNotification : ''}`}
                            onClick={() => {
                                handleFilterNotKM('code', listCodeNull)
                            }}>
                            {loadingCount ? <LoadingOutlined/> : <>Có {listCodeNull.length} dòng chưa điền nhóm lên KQKD
                                hoặc sai với thiết lập nhóm
                            </>}

                        </div>
                    }
                    {/*{listGroupNull.length > 0 &&*/}
                    {/*    <div*/}
                    {/*        className={`${css.checkKM} ${isFilteredGroup ? css.activeNotification : ''}`}*/}
                    {/*        onClick={() => {*/}
                    {/*            handleFilterNotKM('group', listGroupNull)*/}
                    {/*        }}>*/}
                    {/*        {loadingCount ? <LoadingOutlined/> : <>Có {listGroupNull.length} dòng chưa điền nhóm Kế*/}
                    {/*            hoạch KQKD hoặc sai với thiết lập nhóm*/}
                    {/*        </>}*/}
                    {/*    </div>*/}
                    {/*}*/}
                </div>
            </div>


            <div style={{width: '100%', boxSizing: "border-box"}}>
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
