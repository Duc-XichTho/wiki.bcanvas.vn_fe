import '../../../../index.css';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';

import PopupCellActionCDTC from '../../popUp/cellAction/PopUpCellActionCDTC.jsx';
import {MyContext} from "../../../../MyContext.jsx";
import {getAllUnits} from "../../../../apisKTQT/unitService.jsx";
import {getAllKmf} from "../../../../apisKTQT/kmfService.jsx";
import loadDataPlan, {calSupAndT0} from "./logicPlan2.js";
import {getAllPlan} from "../../../../apisKTQT/planService.jsx";
import css from "../../BaoCao/BaoCao.module.css";
import {calculateValueByKmfAndGroupKH} from "../logic/logicActual.js";
import {AgCharts} from "ag-charts-react";
import {formatCurrency} from "../../functionKTQT/formatMoney.js";
import {createSectionData, createSeries} from "../../functionKTQT/chartSetUp/setUpChart.js";
import AG_GRID_LOCALE_VN from "../../../Home/AgridTable/locale.jsx";
import ActionSelectDanhMucPlan from "../../ActionButton/ActionSelectDanhMucPlan.jsx";
import ActionDisplayModeSwitch from "../../ActionButton/ActionDisplayModeSwitch.jsx";
import {cutStringGroup} from "../../../../generalFunction/catChuoi/cutGroupCategory.js";
import ActionMenuDropdown from '../../ActionButton/ActionMenuDropdown.jsx';


export default function PlanActual2({company}) {
    const {currentMonth, loadDataSoKeToan, currentUser} = useContext(MyContext)
    const table = 'PlanActual';
    const gridRef = useRef();
    let [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const [listUnits, setListUnits] = useState([]);
    const [monthCL, setMonthCL] = useState(currentMonth);
    const [chartOption, setChartOption] = useState({});
    const [chartOptionCF, setChartOptionCF] = useState({});
    const [listGroupKH, setGroupKH] = useState([]);

    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            isFullView3: storedSettings?.isFullView3 ?? true,
            selectedUnit: storedSettings?.selectedUnit ?? 'Total',
            isShowAll: storedSettings?.isShowAll ?? true,
            isView: storedSettings?.isView ?? 'View1',
        };
    };

    const [isFullView3, setIsFullView3] = useState(getLocalStorageSettings().isFullView3);
    const [selectedUnit, setSelectedUnit] = useState(getLocalStorageSettings().selectedUnit);
    const [isShowAll, setShowAll] = useState(getLocalStorageSettings().isShowAll);
    const [isView, setView] = useState(getLocalStorageSettings().isView);


    useEffect(() => {
        const tableSettings = {
            isFullView3,
            selectedUnit,
            isShowAll,
            isView,
        };
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [isFullView3, selectedUnit, isShowAll, isView,]);

    const defaultColDef = useMemo(() => ({
        filter: true,
        cellStyle: {fontSize: '14.5px', color: 'var(--text-color)', fontFamily: 'var(--font-family)'},
        resizeable: true,
        width: 20,
    }), []);
    const getField = (month, sub = '') => {
        return `t${month}${sub}`
    };
    const createColumn = (month, headerKey, sub = '', headerSub = '') => ({
        field: getField(month, sub),
        headerName: month === 0 ? headerSub : sub.includes('_v') ? '' : headerSub,
        headerClass: 'center-align-important',
        suppressMenu: true,
        width: sub === '_v' ? 20 : 130,
        cellRenderer: (params) => {
            return (
                <div className="cell-action-group">
                    <PopupCellActionCDTC
                        {...params}
                        id={params.data.header}
                        table={table}
                        field={params.field}
                        monthCL={monthCL}
                        company={company}
                    />
                </div>);
        },
        valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
        editable: (params) => {
            return params.data.layer?.toString().split('.').length === 1 ? false : true;
        },
        cellStyle: (params) => {
            return {...isBold(params), textAlign: 'right'}
        },

    });

    function isBold(params) {
        const isBold = params.data.layer.toString()?.includes('.');
        return {
            textAlign: 'left', paddingRight: 10, background: isBold ? "" : 'rgb(237, 237, 237)',
        };
    }

    const handleCellValueChanged = async (event) => {

    };
    const createMonthGroupColumns = (month) => ({
        headerName: `Tháng ${month}`,
        children: [
            createColumn(month, 'Tháng', '_th', 'Thực hiện'),
            createColumn(month, 'Tháng', '', 'Kế hoạch'),
            createColumn(month, 'Tháng', '_cl', 'Chênh lệch'),
            createColumn(month, 'Tháng', '_v', ''),
        ],
    });
    const createCumulative2024Columns = () => ({
        headerName: 'Lũy kế năm',
        children: [
            createColumn(0, 'Tháng', '_th', 'Thực hiện'),
            createColumn(0, 'Tháng', '', 'Kế hoạch'),
            createColumn(0, 'Tháng', '_cl', 'Chênh lệch'),
            createColumn(0, 'Tháng', '_v', ''),
        ]
    });
    const onGridReady = useCallback(async () => {
        loadData();
    }, [isShowAll]);
    const getColumnDefs = () => {
        let cols = [
            {field: 'id', headerName: 'ID', hide: true},
            {
                field: 'header',
                headerName: 'Tiêu đề',
                width: 250,
                pinned: 'left',
                cellStyle: isBold,
                valueFormatter: (params) => cutStringGroup(params.value)
            },
            createCumulative2024Columns(),
        ];

        const startMonth = 1;
        const endMonth = !isFullView3 ? currentMonth : 12;

        // Add columns for each month, grouped with KH, TH, CL, V sub-columns
        for (let i = startMonth; i <= endMonth; i++) {
            if (i <= 12) {
                cols.push(createMonthGroupColumns(i));
            }
        }

        return cols;
    };

    async function loadData() {
        setLoading(true);
        let listUnit = await getAllUnits();
        // listUnit = setPermissionsListUnit(listUnit, currentUser)
        // listUnit = listUnit.filter(e=> !e.group?.includes('Internal'))
        setListUnits(listUnit)
        const uniqueGroupKH = [...new Set(listUnit
            .map(item => item.groupKH)
            .filter(groupKH => groupKH !== null)
        )];
        setGroupKH(uniqueGroupKH);
        let listKMF = await getAllKmf();
        let listSoKeToan = await loadDataSoKeToan();
        listSoKeToan = listSoKeToan.filter(item => item.consol?.toLowerCase() == 'consol')
        let plans = await getAllPlan();
        plans = plans.find(e => e.type === 'View3');
        plans = plans.rowData
        let rowData = getDataUnit(listUnit, listKMF, plans, selectedUnit, listSoKeToan, uniqueGroupKH)
        let dataChart = [
            // {name: 'Total', data: getDataTotal(listUnit, listVendor, listKMF, listProduct, listSoKeToan, plans)}
        ];
        uniqueGroupKH.forEach(e => {
            dataChart.push({
                name: e,
                data: getDataUnit(listUnit, listKMF, plans, e, listSoKeToan, uniqueGroupKH),
            })
        })
        let dataChartDT = dataChart.map(item => {
            const layer1 = item.data.find(d => d.header.toLowerCase().includes('doanh thu'));
            return {
                name: item.name,
                t0: layer1 ? layer1.t0 : 0,
                t0_th: layer1 ? layer1.t0_th : 0,
            };
        });
        let dataChartCF = dataChart.map(item => {
            const layer1 = item.data.find(d => d.header.toLowerCase().includes('chi phí'));

            return {
                name: item.name,
                t0: layer1 ? -layer1.t0 : 0,
                t0_th: layer1 ? -layer1.t0_th : 0,
            };
        });
        dataChartDT = dataChartDT.filter(item => item.name !== 'Internal');
        dataChartCF = dataChartCF.filter(item => item.name !== 'Internal');
        setChartOption(
            createSectionData('Doanh thu', dataChartDT, [
                createSeries('name', 't0', 'Kế hoạch', 'bar'),
                createSeries('name', 't0_th', 'Thực hiện', 'bar'),
            ], 'Doanh Thu'))
        setChartOptionCF(
            createSectionData('Chi phí', dataChartCF, [
                createSeries('name', 't0', 'Kế hoạch', 'bar'),
                createSeries('name', 't0_th', 'Thực hiện', 'bar'),
            ], 'Chi phí'))
        setRowData(rowData);
        setLoading(false);
    }

    function getDataUnit(listUnit, listKMF, plans, selectedUnit, listSoKeToan, uniqueGroupKH) {
        let rowData = loadDataPlan(listUnit, listKMF, plans, selectedUnit)
        rowData.forEach(e => {
            for (let i = 0; i <= 12; i++) {
                e[`t${i}_th`] = 0;
                e[`t${i}_cl`] = 0;
                e[`t${i}_v`] = 0;
            }
        })

        if (selectedUnit === 'Total') {
            for (let i = 0; i < rowData.length; i++) {
                let groupKmf = rowData[i].header;
                for (let j = 1; j <= 12; j++) {
                    let key = `t${j}_th`;
                    rowData[i][key] = uniqueGroupKH.reduce((total, unit) => {
                        return (
                            total +
                            calculateValueByKmfAndGroupKH(
                                listUnit,
                                groupKmf,
                                listKMF,
                                listSoKeToan,
                                j,
                                unit,
                                2025
                            )
                        );
                    }, 0);
                }
            }
        } else {
            for (let i = 0; i < rowData.length; i++) {
                let groupKmf = rowData[i].header;
                for (let j = 1; j <= 12; j++) {
                    let key = `t${j}_th`;
                    rowData[i][key] = calculateValueByKmfAndGroupKH(
                        listUnit,
                        groupKmf,
                        listKMF,
                        listSoKeToan,
                        j,
                        selectedUnit,
                        2025
                    );
                }
            }
        }

        rowData = calSupAndT0(rowData);
        rowData = rowData.filter(e => e.layer !== '100')
        rowData.map((e) => {
            for (let i = 0; i <= 12; i++) {
                e[`t${i}_cl`] = parseFloat(e[`t${i}_th`]) - parseFloat(e[`t${i}`]);
                e[`t${i}_v`] = parseFloat(e[`t${i}_th`]) - parseFloat(e[`t${i}`]);
                setMonthCL(i)
            }

        });
        return rowData

    }

    const updateColDefs = useCallback(() => {
        setColDefs(getColumnDefs(isFullView3));
    }, [currentMonth, isFullView3])

    useEffect(() => {
        updateColDefs();
    }, [updateColDefs]);

    useEffect(() => {
        loadData();
    }, [isShowAll, isView, selectedUnit]);

    useEffect(() => {
        getAllUnits().then((listUnit) => {
            setListUnits(listUnit)
            const uniqueGroupKH = [...new Set(listUnit
                .map(item => item.groupKH)
                .filter(groupKH => groupKH !== null)
            )];
            setGroupKH(uniqueGroupKH);
        });
    }, []);

    const handleUnitChange = (value) => {
        setSelectedUnit(value);
    };

    const handleViewFull3 = () => {
        setIsFullView3(!isFullView3);
    };

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const items = [
        {
            key: '0',
            label: (
                <span>{isFullView3 ? '✅ Bật rút gọn' : '❌ Tắt rút gọn'}</span>
            ),
            onClick: handleViewFull3,
        },
    ];

    const popoverContent = (
        <div className={css.popoverContent}>
            {items.map((item) => (
                <div
                    key={item.key}
                    onClick={item.onClick}
                    className={css.popoverItem}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );


    return (
        <>
            <div style={{display: "flex", width: "100%"}}>
                <div style={{width: "100%"}}>
                    <div style={{paddingBottom: '20px'}}>
                        <div className="chart" style={{display: 'flex'}}>
                            <div style={{flex: 1}}>
                                <AgCharts options={chartOption}/>
                            </div>
                            <div style={{flex: 1}}>
                                <AgCharts options={chartOptionCF}/>
                            </div>
                        </div>
                    </div>
                    <div className={css.headerPowersheet}>
                        <div className={css.headerTitle}>
                            <span>Báo cáo Kế hoạch và thực hiện mục tiêu KQKD </span>
                            <img src='/Group%20197.png' alt='Đơn vị: VND'
                                 style={{ width: '130px', marginLeft: '3px' }} />
                        </div>
                        <div className={css.headerAction}>
                            <ActionSelectDanhMucPlan selectedUnit={selectedUnit}
                                                     listUnit={listGroupKH}
                                                     handlers={handleUnitChange}/>
                            {/*<ActionDisplayModeSwitch isChecked={isFullView3}*/}
                            {/*                         onChange={handleViewFull3}/>*/}

                        </div>

                        <ActionMenuDropdown popoverContent={popoverContent}
                                            dropdownOpen={dropdownOpen}
                                            setDropdownOpen={setDropdownOpen}
                        />
                    </div>
                    <div style={{display: 'flex', gap: 20, marginTop: '10px'}}>
                        <div style={{flex: 1, height: '90%'}}>
                            <div
                                style={{
                                    height: '43.1vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                }}
                            >

                                <div className="ag-theme-quartz"
                                     style={{height: '100%', width: '100%', display: 'flex'}}>
                                    <div style={{flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s',}}>
                                        <AgGridReact
                                            statusBar={statusBar}
                                            enableRangeSelection
                                            ref={gridRef}
                                            rowData={rowData}
                                            defaultColDef={defaultColDef}
                                            columnDefs={colDefs}
                                            rowSelection="multiple"
                                            onCellValueChanged={handleCellValueChanged}
                                            animateRows
                                            localeText={AG_GRID_LOCALE_VN}
                                            onGridReady={onGridReady}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>);
}
