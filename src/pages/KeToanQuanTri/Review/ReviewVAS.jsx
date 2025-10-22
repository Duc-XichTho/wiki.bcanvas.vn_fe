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
import {getAllVas} from "../../../apisKTQT/vasService.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function ReviewVAS(factory, deps) {
    const {currentYearKTQT, loadDataSoKeToan} = useContext(MyContext);
    const table = 'ReviewVAS';
    const tableCol = 'ReviewVASCol';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    let listPLType = [
        {key: 'Các TK đầu 1, 2', name: 'Tổng tài sản', code: ['1', '2']},
        {key: 'Các TK đầu 3', name: 'Tổng nợ', code: ['3']},
        {key: 'Các TK đầu 4, 5, 6, 7, 8, 9', name: 'Tổng vốn chủ và lợi nhuận', code: ['4', '5', '6', '7', '8', '9']},
        {key: 'Khác', name: 'Khác', code: null},
    ];


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
        let companyList = await getAllCompany();
        let dataVAS = await getAllVas()
        dataVAS = dataVAS.filter(e => e.year == currentYearKTQT);
        let data = [];
        for (let j = 0; j < companyList.length; j++) {
            let dataVASF = dataVAS.filter(e => e.company == companyList[j].code);
            for (let i = 0; i < listPLType.length; i++) {
                let group = listPLType[i].code;
                if (group) {
                    let dataVASType = dataVASF.filter(e => e.ma_tai_khoan && group.includes(e.ma_tai_khoan.charAt(0)))
                    let item = {
                        type: listPLType[i].key,
                        name: listPLType[i].name,
                        company: companyList[j].code,
                    }
                    item['0'] = calculateTotal(dataVASType, 't1_open_net')
                    for (let y = 1; y <= 12; y++) {
                        item[`${y}`] = calculateTotal(dataVASType, `t${y}_ending_net`)
                    }
                    data.push(item)
                }
            }
        }
        setRowData(data);
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }

    const onGridReady = useCallback(async () => {
        await prepareData();
    }, [])

    useEffect(() => {
        prepareData().then();
    }, [currentYearKTQT]);

    const rendHeader = (suffix) => {
        if (suffix == 0) return 'Đầu kỳ'
        return `Tháng ${suffix}/${currentYearKTQT}`;
    };

    function createField(field, hide) {
        return {
            field: field,
            headerName: rendHeader(field),
            headerClass: 'right-align-important-2',
            width: 150,
            cellStyle: () => {
                return {textAlign: 'right'}
            },
            valueFormatter: (params) => formatCurrency(params.value),
            ...hide
        };
    }

    function redenderFields() {
        let fields = [
            {
                field: 'name',
                headerName: 'Mô tả',
                width: 280,
                pinned: 'left',
            },
            {
                field: 'type',
                headerName: 'Tài khoản',
                width: 180,
                pinned: 'left',
            },
            {
                field: 'company',
                headerName: 'Company',
                width: 100,
                pinned: 'left',
            },
            ...renderFieldMoney(),
        ];
        return fields;
    }

    function renderFieldMoney() {
        const teamFields = [];
        for (let y = 0; y <= 12; y++) {
            const fieldName = `${y}`;
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
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
            >
                <div className={css.headerTitle}>
                    <span>Review VAS {currentYearKTQT}</span>
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
                        <img src='/loading_moi_2.svg' alt='Loading...' style={{ width: '150px', height: '150px' }} />
                    </div>
                )}
                <div className="ag-theme-quartz" style={{height: '90%', width: '100%', display: 'flex', marginTop: 15}}>
                    <div style={{
                        flex: '100%',
                        transition: 'flex 0.3s',
                        height: '78.5vh',
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
