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
import Loading from '../../Loading/Loading.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function ReviewSKT(factory, deps) {
    const {currentYearKTQT, loadDataSoKeToan, listCompany} = useContext(MyContext);
    const listCompanys = [...listCompany, {id: 99999999, name: 'HQ', code: 'HQ'}]
    const table = 'ReviewSKT';
    const tableCol = 'ReviewSKTCol';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [companySelected, setCompanySelected] = useState([{id: 99999999, name: 'HQ', code: 'HQ'}] || [])
    let listPLType = [
        {key: 'DT', name: 'Doanh thu'},
        {key: 'DTK', name: 'Doanh thu khác'},
        {key: 'DTTC', name: 'Doanh thu tài chính'},
        {key: 'GV', name: 'Giá vốn'},
        {key: 'CFBH', name: 'Chi phí bán hàng'},
        {key: 'CFK', name: 'Chi phí khác'},
        {key: 'CFQL', name: 'Chi phí quản lý'},
        {key: 'CFTC', name: 'Chi phí tài chính'},
        {key: 'TAX', name: 'Thuế'},
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

        let dataSKT = await loadDataSoKeToan();
        dataSKT = dataSKT.filter(e => e.year == currentYearKTQT && e.pl_value && e.pl_value != '');
        if(companySelected && companySelected.length>0 && companySelected.some(e=> !e.code.includes('HQ'))){{
            dataSKT =dataSKT.filter(e => companySelected.some(c=> c.code == e.company))
        }
        }
        console.log(companySelected.some(e=> e.code.includes('HQ')) || companySelected.length === 0)
        let companyList = companySelected.some(e=> e.code.includes('HQ')) || companySelected.length === 0 ? await getAllCompany(): companySelected;
        console.log(companyList)
        let data = [];
        for (let j = 0; j < companyList.length; j++) {
            let dataSKTF = dataSKT.filter(e => e.company == companyList[j].code);
            for (let i = 0; i < listPLType.length; i++) {
                let dataSKTFT = dataSKTF.filter(e => e.pl_type == listPLType[i].key);
                let item = {
                    type: listPLType[i].key,
                    name: listPLType[i].name,
                    company: companyList[j].code,
                }

                for (let y = 1; y <= 12; y++) {
                    let dataSKTFTM = dataSKTFT.filter(e => e.month == y);
                    item[`${y}`] = calculateTotal(dataSKTFTM, 'pl_value')
                }
                data.push(item)
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
    const handleSelectChange = (selectedIds) => {

        const selectedOptions = listCompanys.filter(com => selectedIds.includes(com.id));

        // Nếu có HQ trong lựa chọn, thì truyền HQ thay vì các lựa chọn khác.
        if (selectedOptions?.length > 0 && selectedOptions.some(e => e.code === 'HQ')) {
            setCompanySelected([{id: 99999999, name: 'HQ', code: 'HQ'}]);
        } else {
            setCompanySelected(selectedOptions);
        }
    };
    useEffect(() => {
        prepareData().then();
    }, [currentYearKTQT, companySelected]);

    const rendHeader = (suffix) => {
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
                headerName: 'PL Type',
                width: 280,
                pinned: 'left',
            },
            {
                field: 'type',
                headerName: 'Code',
                width: 80,
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
        for (let y = 1; y <= 12; y++) {
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
                    <span>Review Sổ kế toán {currentYearKTQT}</span>
                    <Select
                        value={(companySelected && companySelected.length > 0 && companySelected.map(item => item.id)) || []}
                        mode="multiple"
                        allowClear
                        onChange={handleSelectChange}
                        style={{
                            width: "max-content",
                            minWidth: '150px',
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                        placeholder={'Chọn công ty'}
                    >
                        {listCompanys?.length > 0 &&
                            listCompanys.map((com) => (
                                <Option
                                    key={com.id}
                                    value={com.id}
                                    // Nếu HQ được chọn thì disable các lựa chọn khác
                                    disabled={companySelected.some(e => e.code === 'HQ') && com.code !== 'HQ'}
                                >
                                    {com.name}
                                </Option>
                            ))
                        }
                    </Select>
                </div>

                <Loading loading={loading}/>
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
