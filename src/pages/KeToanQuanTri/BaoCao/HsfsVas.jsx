import '../../../index.css';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {formatCurrency} from "../functionKTQT/formatMoney.js";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
export default function HsfsVas({ data }) {
    const table = 'HsfsVas';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    const defaultColDef = useMemo(() => {
        return {
            filter: true,
            cellStyle: {
                fontSize: '14.5px',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-family)',
            },
            editable: false, width: 140,
        };
    });

    function prepareData() {
        if (data.length > 0) {
            const [quy0, quy1, quy2, quy3, quy4] = data.map(item => item.data);
            const rowConfigs = [{
                name: "TS ngắn hạn",
                // description: "Tổng bên nợ của EB nhóm TS ngắn hạn + Nợ ngắn hạn",
                getFieldValue: (quy) => quy.tsNHCuoiKi,
                dauKi: quy0.tsNHDauKi
            }, {
                name: "TS dài hạn",
                // description: "Tổng bên nợ của TS dài hạn",
                getFieldValue: (quy) => quy.tsDHCuoiKi,
                dauKi: quy0.tsDHDauKi
            }, {
                name: "Nợ ngắn hạn",
                // description: "Tổng bên có của EB nhóm Nợ ngắn hạn + TS ngắn hạn",
                getFieldValue: (quy) => quy.noNHCuoiKi,
                dauKi: quy0.noNHDauKi
            }, {
                name: "Nợ dài hạn",
                // description: "Tổng bên có của TS dài hạn",
                getFieldValue: (quy) => quy.noDHCuoiKi,
                dauKi: quy0.noDHDauKi
            }, {
                name: "Tổng nợ",
                // description: "Tổng dư bên có của TS ngắn hạn + TS dài hạn + nợ ngắn hạn + nợ dài hạn",
                getFieldValue: () => quy1.noCuoiKi,
                dauKi: quy0.noDauKi
            }, {
                name: "Tổng tài sản",
                // description: "Tổng dư bên nợ của TS ngắn hạn + TS dài hạn + nợ ngắn hạn + nợ dài hạn",
                getFieldValue: () => quy1.tsCuoiKi,
                dauKi: quy0.tsDauKi,
            }, {
                name: "Vốn chủ",
                // description: "Tổng bên có của VCSH - Tổng bên nợ của VCSH",
                getFieldValue: () => quy1.giaTriVas4,
                dauKi: quy0.giaTriVas4DauKi
            }, {
                name: "Công nợ phải thu",
                // description: "Dư bên nợ của 131, 331, 138, 333, 334, 3382, 3383, 3384, 3386, 335",
                getFieldValue: (quy) => quy.congNoPhaiThuCuoi,
                dauKi: quy0.congNoPhaiThuDau
            }, {
                name: "Công nợ phải trả",
                // description: "Dư bên có của 131, 331, 138, 333, 334, 3382, 3383, 3384, 3386, 335",
                getFieldValue: (quy) => quy.congNoPhaiTraCuoi,
                dauKi: quy0.congNoPhaiTraDau
            },];
            const rowData = rowConfigs.map(row => {
                const quyProperties = {
                    quy0: row.getFieldValue(quy0),
                    quy1: row.getFieldValue(quy1),
                    quy2: row.getFieldValue(quy2),
                    quy3: row.getFieldValue(quy3),
                    quy4: row.getFieldValue(quy4),
                };

                return {
                    name: row.name, dauKi: row.dauKi, description: row.description, ...quyProperties,
                };
            });
            setRowData(rowData)
        }
    }

    useEffect(() => {
        prepareData();
    }, [data]);

    const onGridReady = useCallback(async () => {
        prepareData();
    }, []);

    const createColumn = (field, headerName) => ({
        field,
        headerName,
        editable: true,
        headerClass: 'right-align-important',
        valueFormatter: (params) => formatCurrency(params.value),
        cellStyle: () => ({
            textAlign: 'right', paddingRight: 10,
            color: 'var(--text-color)',
            fontFamily: 'var(--font-family)',
        })
    });
    useEffect(() => {
        const fetchData = async () => {
            try {
                setColDefs([{
                    field: 'name', headerName: 'Tên', width: 200, editable: true, pinned: 'left'
                }, createColumn('dauKi', 'Đầu kì'), createColumn('quy1', 'Quý 1'), createColumn('quy2', 'Quý 2'), createColumn('quy3', 'Quý 3'), createColumn('quy4', 'Quý 4'), createColumn('quy0', 'YTM'),]);
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table]);

    return (<>
        <div
            style={{
                height: '375px', display: 'flex', flexDirection: 'column', position: 'relative', marginTop: '15px',
            }}
        >
            {loading && (<div
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
            </div>)}
            <div style={{ height: '100%', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    statusBar={statusBar}
                    enableRangeSelection
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    columnDefs={colDefs}
                    rowSelection="multiple"
                    animateRows={true}
                    localeText={AG_GRID_LOCALE_VN}
                    onGridReady={onGridReady}
                />
            </div>
        </div>
    </>);
}
