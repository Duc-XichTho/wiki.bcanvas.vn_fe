import '../../../index.css';
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
import {MyContext} from "../../../MyContext.jsx";
import AG_GRID_LOCALE_VN from "../../Home/AgridTable/locale.jsx";
import {getAllCompany} from "../../../apis/companyService.jsx";
import {calculateTotal} from "../../Home/AgridTable/SoLieu/CDPS/logicCDPS.js";
import {formatCurrency} from "../functionKTQT/formatMoney.js";
import css from "../KeToanQuanTriComponent/KeToanQuanTri.module.css";
import {Select} from "antd";
import {LIST_REVIEW_SAB} from "../../../Consts/LIST_REVIEW_SAB.js";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function ReviewSAB(factory, deps) {
    const {currentYearKTQT, loadDataSoKeToan, listCompany, selectedCompany} = useContext(MyContext);
    const listCompanys = [...listCompany, {id: 99999999, name: 'HQ', code: 'HQ'}]
    const table = 'ReviewSAB';
    const tableCol = 'ReviewSABCol';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [companySelected, setCompanySelected] = useState([{id: 99999999, name: 'HQ', code: 'HQ'}] || [])
    let listPLType = LIST_REVIEW_SAB


    const statusBar = useMemo(() => {
        return {
            statusPanels: [{statusPanel: 'agAggregationComponent'}],
        };
    }, []);

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

    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            cellStyle: {
                fontSize: '14.5px',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-family)',
            },
            width: 120,
            wrapHeaderText: true,
            autoHeaderHeight: true,
            ...filter()
        };
    }, deps);

    async function prepareData() {
        setLoading(true);
        setRowData(listPLType);
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }

    const onGridReady = useCallback(async () => {
        await prepareData();
    }, [])

    useEffect(() => {
        prepareData().then();
    }, [currentYearKTQT, companySelected]);

    const rendHeader = (suffix) => {
        return `Tháng ${suffix}`;
    };

    function createField(field, hide) {
        return {
            field: field,
            headerName: rendHeader(parseInt(field.replace("t", ""))),
            headerClass: 'right-align-important-2',
            width: 150,
            cellStyle: () => {
                return {textAlign: 'right'}
            },
            ...hide
        };
    }

    function redenderFields() {
        let fields = [
            {
                field: 'name',
                headerName: 'Chỉ tiêu',
                width: 250,
                pinned: 'left',
            },
            {
                field: 'desc',
                headerName: 'Mô tả',
                width: 550,
                pinned: 'left',
            },
            {
                field: 'calc',
                headerName: 'Cách tính',
                width: 250,
                pinned: 'left',
            },
            ...renderFieldMoney(),
        ];
        return fields;
    }

    function renderFieldMoney() {
        const teamFields = [];
        for (let y = 1; y <= 12; y++) {
            const fieldName = `t${y}`;
            let hide = false;
            teamFields.push({
                ...createField(fieldName, {hide}),
            });
        }
        return teamFields;
    }

    useEffect(() => {
        setSidebarVisible(false);
        const fetchData = async () => {
            try {
                let updatedColDefs = redenderFields()
                ;
                setColDefs(updatedColDefs);

            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady, rowData, table, currentYearKTQT]);

    return (
        <>
            <div
                style={{
                    height: '95vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                }}
            >
                <div className={css.headerTitle}>
                    <span>Review {selectedCompany}</span>
                </div>

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
                            backgroundColor: 'white',
                        }}
                    >
                        <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>
                    </div>
                )}
                <div className="ag-theme-quartz" style={{height: '90%', width: '100%', display: 'flex', marginTop: 15}}>
                    <div style={{
                        flex: '100%',
                        transition: 'flex 0.3s',
                        height: '85vh',
                    }}>
                        <AgGridReact
                            statusBar={statusBar}
                            ref={gridRef}
                            rowData={rowData}
                            enableRangeSelection={true}
                            defaultColDef={defaultColDef}
                            columnDefs={colDefs}
                            rowSelection="multiple"
                            animateRows={true}
                            localeText={AG_GRID_LOCALE_VN}
                            onGridReady={onGridReady}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
