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
import {getAllTeam} from '../../../apisKTQT/teamService';
import '../../Home/AgridTable/agComponent.css';
import css from "../KeToanQuanTriComponent/KeToanQuanTri.module.css"
import {onFilterTextBoxChanged} from "../../../generalFunction/quickFilter.js";
import {MyContext} from "../../../MyContext.jsx";
import {handleSaveAgl} from "../functionKTQT/handleSaveAgl.js";
import {getCurrentDateTimeWithHours} from "../functionKTQT/formatDate.js";
import PopupDeleteRenderer from "../popUp/popUpDelete.jsx";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";

import {getAllUnits} from "../../../apisKTQT/unitService.jsx";
import TooltipHeaderIcon from "../HeaderTooltip/TooltipHeaderIcon.jsx";
import RichNoteKTQTRI from "../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import ActionCreate from "../../Home/AgridTable/actionButton/ActionCreate.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function Team({company}) {
    const table = 'Team';
    const gridRef = useRef();
    const {loadDataSoKeToan , listCompany} = useContext(MyContext)
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [updatedData, setUpdatedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listUnit, setListUnit] = useState([]);

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

    const fetchTeamData = async (company) => {
        const [listSoKeToan, data] = await Promise.all([loadDataSoKeToan(), getAllTeam()]);

        const relevantTeam = company === "HQ" ? data : data.filter(v => v.company === company);
        const relevantSoKeToan = company === "HQ" ? listSoKeToan : listSoKeToan.filter(s => s.company === company);

        const sktSet = new Set(relevantSoKeToan.map(s => s.team_code));

        // Cập nhật thuộc tính `isEditable` dựa trên điều kiện
        relevantTeam.forEach(team => {
            team.isEditable = team.name === '' || !team.name || !sktSet.has(team.name);
        });
        getAllUnits().then(data => {
            if (company === "HQ") {
                setListUnit(data);
            } else {
                const filteredData = data.filter((e) => e.company === company);
                setListUnit(filteredData);
            }
        })
        return relevantTeam;

    };

    const onGridReady = useCallback(async () => {
        let data;
        if (company === "HQ") {
            data = await fetchTeamData("HQ");
        } else {
            data = await fetchTeamData(company);
        }
        setRowData(data);
    }, [company]);

    useEffect(() => {
        setLoading(true);
        const loadData = async () => {
            let data;
            if (company === "HQ") {
                data = await fetchTeamData("HQ");
            } else {
                data = await fetchTeamData(company);
            }
            setRowData(data);
            setLoading(false);
        };

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
                        width: 70,
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

                    },
                    {
                        field: 'code',
                        headerName: 'Code',
                        width: 200,
                        editable: params => params.data.isEditable,
                        ...filter(),
                    },
                    {
                        field: 'dp',
                        headerName: 'Tên thể hiện',
                        width: 250,
                        editable: true,
                        ...filter(),
                    },
                    {
                        field: 'name',
                        headerName: 'Name',
                        width: 250,
                        editable: params => params.data.isEditable,
                        ...filter(),
                    },
                    {
                        field: 'stt',
                        headerName: 'Thứ tự trên báo cáo',
                        flex: 1,
                        editable: true,
                        ...filter(),
                    },
                    {
                        field: 'unit_code',
                        headerName: 'Unit Code',
                        flex: 1,
                        editable: true,
                        ...filter(),
                    },
                    {
                        pinned: 'left',
                        width: '40',
                        field: 'action',
                        suppressHeaderMenuButton: true,
                        cellStyle: {textAlign: 'center', paddingTop: 5},
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
            createAt: getCurrentDateTimeWithHours(),
            company: company,
            show: true,
        };
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
                <div className={css.headerTitle}>
                    <span>Quản lý Team <TooltipHeaderIcon table={table}/></span>
                </div>
                <div className={css.headerAction}>
                    <ActionCreate handleAddRow={handleAddRow}/>
                </div>
            </div>
            <div style={{width: '100%', boxSizing: "border-box"}}>
                <RichNoteKTQTRI table={`${table + '-' + company}`}/>
            </div>
            <div
                style={{
                    height: '61vh',
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
