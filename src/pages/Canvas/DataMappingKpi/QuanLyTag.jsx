import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {onFilterTextBoxChanged} from "../../../generalFunction/quickFilter.js";
import {MyContext} from "../../../MyContext.jsx";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import css from "../../KeToanQuanTri/KeToanQuanTriComponent/KeToanQuanTri.module.css"
import RichNoteKTQTRI from "../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionCreate from "../../Home/AgridTable/actionButton/ActionCreate.jsx";
import {createNewQuanLyTag, getAllQuanLyTag, updateQuanLyTag} from "../../../apis/quanLyTagService.jsx";
import {handleSaveAgl} from "../../KeToanQuanTri/functionKTQT/handleSaveAgl.js";
import TooltipHeaderIcon from "../../KeToanQuanTri/HeaderTooltip/TooltipHeaderIcon.jsx";
import {getCurrentDateTimeWithHours} from "../../KeToanQuanTri/functionKTQT/formatDate.js";
import PopupDeleteRenderer from "../../KeToanQuanTri/popUp/popUpDelete.jsx";
import {message} from "antd";
import {Menu} from 'antd';

export default function QuanLyTag() {
    let {
        setIsUpdateNoti,
        isUpdateNoti
    } = useContext(MyContext);
    const table = 'QL_TAG';
    const key = 'QL_TAG_ID';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nhomSelected, setGroupSelected] = useState('nganhReal');
    const [listUnit, setListUnit] = useState([]);
    const [listEditData, setListEditData] = useState([]);

    const [filteredData, setFilteredData] = useState([]);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [hasEditableRows, setHasEditableRows] = useState(false);
    const [reload, setReload] = useState(false);

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const items = [
        {
            label: 'NGÀNH',
            key: 'nganhReal',
        },

        {
            label: 'OBJECTIVES',
            key: 'nganh',
        },

        {
            label: 'METRICS',
            key: 'objective',
        },

        {
            label: 'DATA REQUIREMENT',
            key: 'kpi',
        },

        {
            label: 'ORIGINAL SOURCE',
            key: 'data',
        },

    ];
    const selectGroup = (e) => {
        console.log('click ', e);
        setGroupSelected(e.key);
    };

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
            setColDefs([
                {
                    field: 'id',
                    headerName: 'ID',
                    hide: true,
                    width: 100,
                    ...filter(),
                    editable: false,
                    cellStyle: {textAlign: "left"}
                },
                {
                    field: 'name',
                    headerName: 'Tên',
                    flex: 1, ...filter(),

                },

                {
                    pinned: 'left',
                    width: 40,
                    field: 'action',
                    suppressMenu: true,
                    headerName: '',
                    cellStyle: {textAlign: 'center'},
                    cellRenderer: (params) => {
                        return (
                            <PopupDeleteRenderer {...params.data} id={params.data.id} table={table}
                                                 reloadData={loadData}/>
                        );
                    },
                    editable: false,
                },
            ]);
        } catch (error) {
            console.log(error)
        }
    }, []);

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
        for (const updateElement of newUpdatedData) {
            await updateQuanLyTag(updateElement);
        }



        await loadData()

    };

    const onGridReady = useCallback(async () => {
        await loadData()
    }, [reload, nhomSelected]);


    const loadData = async () => {
        if (nhomSelected) {
            let data = await getAllQuanLyTag();
            data = data.filter(item => item.nhom == nhomSelected);
            setRowData(data);
        } else {
            setRowData([])
        }

        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [reload, nhomSelected]);

    const checkEditableRows = (data) => {
        const nhomed = data.reduce((acc, item) => {
            if (!acc[item.name]) acc[item.name] = new Set();
            acc[item.name].add(item.dp);
            return acc;
        }, {});

        const filteredData = data.filter(item => nhomed[item.name].size > 1);
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
        await createNewQuanLyTag(
            {
                createAt: getCurrentDateTimeWithHours(),
                show: true,
                nhom: nhomSelected,
            },
        ).then(() => {
            message.success('Tạo mới thành công')
            loadData()
        })

    }

    return (
        <>
            {/*{loading && (*/}
            {/*    <div*/}
            {/*        style={{*/}
            {/*            display: 'flex',*/}
            {/*            justifyContent: 'center',*/}
            {/*            alignItems: 'center',*/}
            {/*            height: '100%',*/}
            {/*            position: 'absolute',*/}
            {/*            width: '100%',*/}
            {/*            zIndex: '1000',*/}
            {/*            backgroundColor: 'rgba(255, 255, 255, 0.96)',*/}
            {/*        }}*/}
            {/*    >*/}
            {/*        <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>*/}
            {/*    </div>*/}
            {/*)}*/}
            <Menu style={{marginBottom: '10px'}} onClick={selectGroup} selectedKeys={[nhomSelected]} mode="horizontal"
                  items={items}/>
            <div className={'header-powersheet'}>

                <div className={css.headerTitle}>
                </div>


                <div className={css.headerAction}>

                    <ActionCreate handleAddRow={handleAddRow}/>

                </div>
            </div>

            <div
                style={{
                    height: '80%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                }}
            >

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
