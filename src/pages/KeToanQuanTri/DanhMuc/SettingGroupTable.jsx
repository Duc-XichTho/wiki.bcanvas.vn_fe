'use strict';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
// Ag Grid Function
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {ModuleRegistry} from '@ag-grid-community/core';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {AgGridReact} from 'ag-grid-react';
import {toast} from 'react-toastify';
import '../../Home/AgridTable/agComponent.css';
import css from "../KeToanQuanTriComponent/KeToanQuanTri.module.css"
import {MyContext} from "../../../MyContext.jsx";
import {handleSaveAgl} from "../functionKTQT/handleSaveAgl.js";
import {getCurrentDateTimeWithHours} from "../functionKTQT/formatDate.js";
import {handleAddAgl} from "../functionKTQT/handleAddAgl.js";
import PopupDeleteRenderer from "../popUp/popUpDelete.jsx";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import TooltipHeaderIcon from "../HeaderTooltip/TooltipHeaderIcon.jsx";
import ActionCreate from "../../Home/AgridTable/actionButton/ActionCreate.jsx";
import {createNewSettingGroup, getAllSettingGroup} from "../../../apisKTQT/settingGroupService.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function SettingGroupTable({selectedType}) {
    const table = 'SettingGroupTable';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: true,
            cellStyle: {fontSize: '14.5px'},
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);

    const fetchSettingGroupTable = async () => {
        const data = await getAllSettingGroup()
        let filteredData = data.filter(e=>e?.type === selectedType?.type)

        setRowData(filteredData)
        setLoading(false)
    };

    const onGridReady = useCallback(async () => {
        await fetchSettingGroupTable()
    }, [selectedType]);

    useEffect(() => {
        setLoading(true);
        fetchSettingGroupTable()
    }, [selectedType]);

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
                        hide: true,
                        width: 70,
                        ...filter(),
                        editable: false,
                        cellStyle: {textAlign: "left"}
                    },
                    {
                        pinned: 'left',
                        width: '40',
                        field: 'action',
                        suppressHeaderMenuButton: true,
                        cellStyle: {textAlign: 'center'},
                        headerName: '',

                        cellRenderer: (params) => {
                            if (!params.data || !params.data.id ) {
                                return null;
                            }

                            return (
                                <PopupDeleteRenderer {...params.data} id={params.data.id} table={table}
                                                     reloadData={onGridReady}/>
                            );
                        },
                        editable: false,
                    },
                    ...selectedType?.listCol,
                ]);
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, selectedType]);

    const handleAddRow = useCallback(async () => {
        const newItems = {
            createAt: getCurrentDateTimeWithHours(),
            type: selectedType?.type,
            show: true,
        };
        await createNewSettingGroup(newItems).then(()=>{
            fetchSettingGroupTable()
        })
    }, [onGridReady]);

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
        setUpdatedData(newUpdatedData);
        // await handleSaveAgl(newUpdatedData, table, setUpdatedData);
        await handleSaveAgl(newUpdatedData, table, setUpdatedData, onGridReady,);
    };

    return (
        <>
            <div className={'header-powersheet'}>

                <div className={css.headerAction}>
                    <ActionCreate handleAddRow={handleAddRow}/>
                </div>
            </div>

            <div
                style={{
                    height: '90%',
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
