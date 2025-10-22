import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import {formatCurrency} from '../../../function/formatMoney.js';
import AG_GRID_LOCALE_VN from '../../../locale.jsx';
import AnalysisSideBar from '../../../function/analysisSideBar.jsx';
import PopupCellActionCDTC from '../../../popUp/cellAction/PopUpCellActionCDTC.jsx';
import {MyContext} from "../../../../../MyContext.jsx";
import {getAllUnits} from "../../../../../apisKTQT/unitService.jsx";
import {getAllProduct} from "../../../../../apisKTQT/productService.jsx";
import {getAllVendor} from "../../../../../apisKTQT/vendorService.jsx";
import {getAllKmf} from "../../../../../apisKTQT/kmfService.jsx";
import loadDataPlan, {calSupAndT0, mergeDataByHeader} from "./logicPlan.js";
import {getAllPlan} from "../../../../../apisKTQT/planService.jsx";
import css from "../../../../B-Canvas/BCanvasComponent/BCanvas.module.css";
import {calculateValue, calculateValueByKmf, calculateValueProduct, calculateValueTotalYear} from "../logic/logicActual.js";
import setUpHeaderPlan from "./setUpHeaderPlan.js";
import {setUpDataChartKH} from "./setUpDataChartKH.js";
import {createSectionData, createSeries} from "../FinanceDashboard/BI/chartSetUp/setUpChart.js";
import {AgCharts} from "ag-charts-react";
import {setPermissionsListUnit} from "../logic/logicPermissions.js";
import {COMPANY_LIST} from "../../../../../CONST.js";
import {Loading} from "../../../../../Loading.jsx";

export default function ActualCungKy({company}) {
    const {currentMonth,currentUser, loadDataSoKeToan} = useContext(MyContext)
    const table = 'ActualCungKy';
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const statusBar = useMemo(() => ({statusPanels: [{statusPanel: 'agAggregationComponent'}]}), []);
    const [listUnits, setListUnits] = useState([]);
    const [monthCL, setMonthCL] = useState(currentMonth);
    const [rowDataBeforeFilter, setRowDataBeforeFilter] = useState([]);
    const [chartOption, setChartOption] = useState({});
    const [chartOptionCF, setChartOptionCF] = useState({});

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

    const handleClickView = () => {
        setView("View1");
    };

    const handleClickView2 = () => {
        setView("View2");
    };

    const defaultColDef = useMemo(() => ({
        filter: true, cellStyle: {fontSize: '14.5px'}, resizeable: true, width: 20,
    }), []);
    const getField = (month, sub = '') => {
        return `t${month}${sub}`
    };
    ;
    const getHeader = (headerKey, key, sub = '') => {
        return `${headerKey} ${key} ${sub}`
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
                </div>
            );
        },
        valueFormatter: (params) => formatCurrency((params.value / 1000).toFixed(0)),
        editable: (params) => params.data.layer?.toString().split('.').length === 1 ? false : true,
    });

    const createYearComparisonColumns = () => ({
        headerName: 'Lũy kế năm',
        children: [

            {
                ...createColumn(0, '', '_th', 'Thực hiện'),
                valueGetter: (params) => {
                    let totalTH = 0;
                    for (let month = 1; month <= 12; month++) {
                        totalTH += parseFloat(params.data[`t${month}_th`]) || 0;
                    }
                    return totalTH;
                }
            },
            {
                ...createColumn(0, '', '_ck', 'Cùng kỳ'),
                valueGetter: (params) => {
                    let totalCK = 0;
                    for (let month = 1; month <= 12; month++) {
                        totalCK += parseFloat(params.data[`t${month}_ck`]) || 0;
                    }
                    return totalCK;
                }
            },
            {
                // cols.push(createColumn(i, 'Tháng', '_cl', 'CL'));
                ...createColumn(0, '', '_cl', 'Chênh lệch'),
                valueGetter: (params) => {
                    return params.data[`t0_cl`] || 0;
                }
            },
            {
                // cols.push(createColumn(i, 'Tháng', '_cl', 'CL'));
                ...createColumn(0, '', '_v', ''),
                valueGetter: (params) => {
                    return params.data[`t0_v`] || 0;
                }
            },
        ],
    });

    const createMonthGroupColumns = (month) => ({
        headerName: `Tháng ${month}`,
        children: [
            createColumn(month, 'Tháng', '_th', 'Thực hiện'),  // Thực hiện (This Year)
            createColumn(month, 'Tháng', '_ck', 'Cùng kỳ'),  // Cùng kỳ (Last Year)
            createColumn(month, 'Tháng', '_cl', 'Chênh lệch'),  // Difference between CK and TH
            createColumn(month, 'Tháng', '_v', 'CL')       // Additional calculated value
        ],
    });

    const handleCellValueChanged = async (event) => {

    };

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
                cellStyle: (params) => {
                    const isBold = params.data.layer?.includes('.');
                    return {textAlign: 'left', paddingRight: 10, fontWeight: isBold ? "normal" : 'bold'};
                },
                valueFormatter: (params) => setUpHeaderPlan(params.value)
            },
            createYearComparisonColumns(),  // Add Cùng kỳ 2023 and 2024 columns
        ];


        const startMonth = isFullView3 ? 1 : currentMonth;
        const endMonth = !isFullView3 ? currentMonth : 12;

        // Group the columns by month
        for (let i = startMonth; i <= endMonth; i++) {
            if (i <= 12) {
                cols.push(createMonthGroupColumns(i));  // Use the helper function to group columns
            }
        }

        return cols;
    };

    async function loadData() {
        setLoading(true);
        let listUnit = await getAllUnits();
        let listVendor = await getAllVendor();
        let listKMF = await getAllKmf();
        let listProduct = await getAllProduct();
        let listSoKeToan = await loadDataSoKeToan();
        let plans = await getAllPlan();
        let rowData = [];
        listUnit = setPermissionsListUnit(listUnit, currentUser)
        setListUnits(listUnit)

        if (selectedUnit === 'Total') {
            rowData = getDataTotal(listUnit, listVendor, listKMF, listProduct, listSoKeToan, plans)
        } else {
            rowData = getDataUnit(listUnit, listVendor, listKMF, listProduct, listSoKeToan, plans, selectedUnit)
        }
        rowData = rowData.filter(e => e.layer !== '100')
        let dataChart = [
            // {name: 'Total', data: getDataTotal(listUnit, listVendor, listKMF, listProduct, listSoKeToan, plans)}
        ];
        listUnit.forEach(e => {
            dataChart.push({
                name: (COMPANY_LIST.length > 0 ? e.code : e.name),
                data: getDataUnit(listUnit, listVendor, listKMF, listProduct, listSoKeToan, plans, e.code)
            })
        })
        let dataChartDT = dataChart.map(item => {
            // Tìm phần tử trong mảng data có layer là "1"
            const layer1 = item.data.find(d => d.layer === "1");

            return {
                name: item.name,
                t0: layer1 ? layer1.t0 : 0,
                t0_th: layer1 ? layer1.t0_th : 0,
                t0_ck: layer1 ? layer1.t0_ck : 0,
            };
        });
        let dataChartCF = dataChart.map(item => {
            // Tìm phần tử trong mảng data có layer là "1"
            const layer1 = item.data.find(d => d.layer === "2");

            return {
                name: item.name,
                t0: layer1 ? -layer1.t0 : 0,
                t0_th: layer1 ? -layer1.t0_th : 0,
                t0_ck: layer1 ? -layer1.t0_ck : 0,
            };
        });
        dataChartDT.pop();
        dataChartCF.pop();
        setChartOption(
            createSectionData('Doanh thu', dataChartDT, [
                createSeries('name', 't0', 'Kế hoạch', 'bar'),
                createSeries('name', 't0_th', 'Thực hiện', 'bar'),
                createSeries('name', 't0_ck', 'Cùng kì', 'bar'),
            ], 'Doanh Thu'))
        setChartOptionCF(
            createSectionData('Chi phí', dataChartCF, [
                createSeries('name', 't0', 'Kế hoạch', 'bar'),
                createSeries('name', 't0_th', 'Thực hiện', 'bar'),
                createSeries('name', 't0_ck', 'Cùng kì', 'bar'),
            ], 'Chi phí'))
        setRowData(rowData);
        setLoading(false);
    }

    function getDataTotal(listUnit, listVendor, listKMF, listProduct, listSoKeToan, plans) {
        let rowData = []
        let newRowData = [];
        if (!plans[0].rowData || !plans[1].rowData) {
            newRowData = loadDataPlan(listUnit, listVendor, listKMF, listProduct, null, selectedUnit)
        } else {
            plans.forEach((plan) => {
                plan.rowData?.forEach(data => {
                    newRowData = [...newRowData, ...calSupAndT0(data.data)]
                })
            })
        }
        rowData = mergeDataByHeader(newRowData);
        rowData.forEach(e => {
            for (let i = 0; i <= 12; i++) {
                e[`t${i}_th`] = 0;
                e[`t${i}_ck`] = 0;
                e[`t${i}_cl`] = 0;
                e[`t${i}_v`] = 0;
            }
        })
        for (let i = 0; i < rowData.length; i++) {
            let supLayer = rowData[i].layer.split('.')[0];
            let groupKmf = rowData.find(e => e.layer === supLayer).header;
            for (let j = 1; j <= 12; j++) {
                let key = `t${j}_th`
                rowData[i][key] = calculateValueTotalYear(groupKmf, listKMF, listSoKeToan, j, 2024)
                let keyCK = `t${j}_ck`
                rowData[i][keyCK] = calculateValueTotalYear(groupKmf, listKMF, listSoKeToan, j, 2023)
            }
            // if (!rowData[i].header.includes('*')) {
            //     let supLayer = rowData[i].layer.split('.')[0];
            //     let groupKmf = rowData.find(e => e.layer === supLayer).header;
            //     for (let j = 1; j <= 12; j++) {
            //         let key = `t${j}_th`
            //         rowData[i][key] = calculateValueByKmf(groupKmf, listKMF, listSoKeToan, j, selectedUnit, 2024)
            //         let keyCK = `t${j}_ck`
            //         rowData[i][keyCK] = calculateValueByKmf(groupKmf, listKMF, listSoKeToan, j, selectedUnit, 2023)
            //     }
            // }

        }
        //Sup & T0
        rowData.forEach((item) => {
            item['t0'] = 0;
            for (let month = 1; month <= 12; month++) {
                if (item.layer.includes('.')) {
                    item['t0'] += parseFloat(item[`t${month}`] || 0);
                    item['t0_th'] += parseFloat(item[`t${month}_th`] || 0);
                    item['t0_ck'] += parseFloat(item[`t${month}_ck`] || 0);
                }
            }
            for (let month = 0; month <= 12; month++) {
                if (!item.layer.includes('.')) {
                    item['t0'] += parseFloat(item[`t${month}`] || 0);
                    item['t0_th'] += parseFloat(item[`t${month}_th`] || 0);
                    item['t0_ck'] += parseFloat(item[`t${month}_ck`] || 0);
                }
            }
        });
        let l100 = rowData.find(e => e.layer === '100');
        let l101 = rowData.find(e => e.layer === '101');
        if (!l100 || !l101) {
            rowData.push(
                {header: 'Lãi lỗ hoạt động', layer: '100'},
                {header: 'Lãi lỗ ròng', layer: '101'},
            )
            rowData.forEach(e => {
                for (let i = 0; i <= 12; i++) {
                    e[`t${i}`] = 0;
                }
            })
            l100 = rowData.find(e => e.layer === '100');
            l101 = rowData.find(e => e.layer === '101');
        }
        for (let month = 0; month <= 12; month++) {
            l101[`t${month}_th`] = 0;
            l100[`t${month}_th`] = 0;
            l101[`t${month}_ck`] = 0;
            l100[`t${month}_ck`] = 0;
        }
        rowData.forEach((item) => {
            for (let month = 0; month <= 12; month++) {
                if (!item.layer.includes('.') && item.layer !== '100' && item.layer !== '101') {
                    l101[`t${month}_th`] += parseFloat(item[`t${month}_th`]) || 0;
                    l101[`t${month}_ck`] += parseFloat(item[`t${month}_ck`]) || 0;
                }
                if (item.header.includes('#') && item.layer !== '100' && item.layer !== '101') {
                    l100[`t${month}_th`] +=parseFloat(item[`t${month}_th`])  || 0;
                    l100[`t${month}_ck`] += parseFloat(item[`t${month}_ck`])  || 0;
                }
            }
        })
        rowData.map((e) => {
            for (let i = 0; i <= 12; i++) {
                e[`t${i}_cl`] = Math.abs(e[`t${i}_th`]) - Math.abs(e[`t${i}_ck`]);
                e[`t${i}_v`] = Math.abs(e[`t${i}_th`]) - Math.abs(e[`t${i}_ck`]);
                setMonthCL(i)
            }
        });
        return rowData
    }

    function getDataUnit(listUnit, listVendor, listKMF, listProduct, listSoKeToan, plans, selectedUnit) {
        let rowData = [];
        if (isView === 'View1') {
            plans = plans.find(e => e.type === 'View1');
        } else {
            plans = plans.find(e => e.type === 'View2');
        }
        plans = plans.rowData;
        rowData = loadDataPlan(listUnit, listVendor, listKMF, listProduct, plans, selectedUnit);
        setRowDataBeforeFilter(rowData)
        rowData = filterViewRowData(rowData, isView);
        rowData = calSupAndT0(rowData)
        rowData.forEach(e => {
            for (let i = 0; i <= 12; i++) {
                e[`t${i}_th`] = 0;
                e[`t${i}_ck`] = 0;
                e[`t${i}_cl`] = 0;
                e[`t${i}_v`] = 0;
            }
        })
        for (let i = 0; i < rowData.length; i++) {
            if (rowData[i].layer.includes('.')) {
                let supLayer = rowData[i].layer.split('.')[0];
                let groupKmf = rowData.find(e => e.layer === supLayer).header;
                for (let j = 1; j <= 12; j++) {
                    let key = `t${j}_th`
                    let keyCK = `t${j}_ck`
                    if (isView == "View2") {
                        rowData[i][key] = calculateValue(groupKmf, listKMF, rowData[i].header, listVendor, listSoKeToan, j, 'vender', 'name', selectedUnit, 2024)
                        rowData[i][keyCK] = calculateValue(groupKmf, listKMF, rowData[i].header, listVendor, listSoKeToan, j, 'vender', 'name', selectedUnit, 2023)
                    } else {
                        rowData[i][key] = calculateValueProduct(groupKmf, listKMF, rowData[i].header, listProduct, listSoKeToan, j, selectedUnit, 2024)
                        rowData[i][keyCK] = calculateValueProduct(groupKmf, listKMF, rowData[i].header, listProduct, listSoKeToan, j, selectedUnit, 2023)
                    }
                }
            } else if (!rowData[i].header.includes('*')) {
                let supLayer = rowData[i].layer.split('.')[0];
                let groupKmf = rowData.find(e => e.layer === supLayer).header;
                for (let j = 1; j <= 12; j++) {
                    let key = `t${j}_th`
                    rowData[i][key] = calculateValueByKmf(groupKmf, listKMF, listSoKeToan, j, selectedUnit, 2024)
                    let keyCK = `t${j}_ck`
                    rowData[i][keyCK] = calculateValueByKmf(groupKmf, listKMF, listSoKeToan, j, selectedUnit, 2023)

                }
            }

        }

        //Sup & T0
        rowData.forEach((item) => {
            if (!item.layer.includes('.') && item.header.includes('*')) {
                for (let month = 0; month <= 12; month++) {
                    item[`t${month}`] = 0;
                    item[`t${month}_th`] = 0;
                    item[`t${month}_ck`] = 0;
                }
            }
            item['t0'] = 0;
            for (let month = 1; month <= 12; month++) {
                if (item.layer.includes('.')) {
                    item['t0'] += parseFloat(item[`t${month}`] || 0);
                    item['t0_th'] += parseFloat(item[`t${month}_th`] || 0);
                    item['t0_ck'] += parseFloat(item[`t${month}_ck`] || 0);
                }
            }
            for (let month = 1; month <= 12; month++) {
                const layerPrefix = item.layer + '.';
                const layerItems = rowData.filter((subItem) => subItem.layer && subItem.layer.startsWith(layerPrefix));
                const total = layerItems.reduce((acc, subItem) => acc + (subItem[`t${month}`] || 0), 0);
                if (!item.layer.includes('.') && item.header.includes('*')) item[`t${month}`] = total;
                const totalTH = layerItems.reduce((acc, subItem) => acc + (subItem[`t${month}_th`] || 0), 0);
                const totalCK = layerItems.reduce((acc, subItem) => acc + (subItem[`t${month}_ck`] || 0), 0);
                if (!item.layer.includes('.') && item.header.includes('*')) {
                    item[`t${month}_th`] = totalTH;
                    item[`t${month}_ck`] = totalCK;
                }
            }
            for (let month = 0; month <= 12; month++) {
                if (!item.layer.includes('.')) {
                    item['t0'] += parseFloat(item[`t${month}`] || 0);
                    item['t0_th'] += parseFloat(item[`t${month}_th`] || 0);
                    item['t0_ck'] += parseFloat(item[`t${month}_ck`] || 0);
                }
            }
        });
        let l100 = rowData.find(e => e.layer === '100');
        let l101 = rowData.find(e => e.layer === '101');
        if (!l100 || !l101) {
            rowData.push(
                {header: 'Lãi lỗ hoạt động', layer: '100'},
                {header: 'Lãi lỗ ròng', layer: '101'},
            )
            rowData.forEach(e => {
                for (let i = 0; i <= 12; i++) {
                    e[`t${i}`] = 0;
                }
            })
            l100 = rowData.find(e => e.layer === '100');
            l101 = rowData.find(e => e.layer === '101');
        }
        for (let month = 0; month <= 12; month++) {
            l101[`t${month}_th`] = 0;
            l101[`t${month}_ck`] = 0;
            l100[`t${month}_th`] = 0;
            l100[`t${month}_ck`] = 0;
        }
        rowData.forEach((item) => {
            for (let month = 0; month <= 12; month++) {
                if (!item.layer.includes('.') && item.layer !== '100' && item.layer !== '101') {
                    l101[`t${month}_th`] += parseFloat(item[`t${month}_th`])  || 0;
                    l101[`t${month}_ck`] += parseFloat(item[`t${month}_ck`])  || 0;
                }
                if (item.header.includes('#') && item.layer !== '100' && item.layer !== '101') {
                    l100[`t${month}_th`] += parseFloat(item[`t${month}_th`])  || 0;
                    l100[`t${month}_ck`] += parseFloat(item[`t${month}_ck`] )|| 0;
                }
            }
        })
        rowData.map((e) => {
            for (let i = 0; i <= 12; i++) {
                e[`t${i}_cl`] = parseFloat(e[`t${i}_th`]) - parseFloat(e[`t${i}_ck`]);
                e[`t${i}_v`] = parseFloat(e[`t${i}_th`]) - parseFloat(e[`t${i}_ck`]);
                setMonthCL(i)
            }

        });
        rowData = filterViewRowData(rowData, isView);
        return rowData
    }

    function filterViewRowData(data, view) {
        return data.filter(item => {
            const parts = item.layer.split('.');
            return parts.length === 1 || (parts.length > 1 && parts[1].charAt(0) === (view == "View1" ? '1' : "2"));
        });
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
        });
    }, []);

    return (<>
        {loading && <Loading/>}
        <div>
            <div className="chart" style={{display: 'flex'}}>
                <div style={{flex: 1}}>
                <AgCharts options={chartOption}/>
                </div>
                <div style={{flex: 1}}>
                <AgCharts options={chartOptionCF}/>
                </div>
            </div>
        </div>
        <div className="collapsible-nav">
            <button className="collapsible-header" style={{cursor: "default"}}>
                <div className="navbar_action2">
                    <span className={'title-bc-14-10'}>Báo cáo Thực hiện và Cùng kỳ mục tiêu KQKD </span>
                    <span>(ĐV: ‘000VND)</span>
                </div>
            </button>
            <div className="button-action-coll">
                <div className={`${css.viewItem} ${css.selectItem}`}>
                    <select className={css.selectContent}
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                    >
                        {listUnits.map((unit) => (<option key={unit.code} value={unit.code}>
                            {unit.name}
                        </option>))}
                    </select>
                </div>

                {selectedUnit !== 'Total' && (<>
                    <div className={`${css.viewItem} ${isView == "View1" ? css.fullView : css.compactView}`}
                         onClick={handleClickView}>
                        <span>Theo nhóm SP</span>
                    </div>
                    <div className={`${css.viewItem} ${isView == "View2" ? css.fullView : css.compactView}`}
                         onClick={handleClickView2}>
                        <span>Theo nhóm KH</span>
                    </div>
                </>)}

                <div className={`${css.viewItem} ${isFullView3 ? css.fullView : css.compactView}`}
                     onClick={() => setIsFullView3(true)}>
                    <span>Đầy đủ</span>
                </div>

                <div className={`${css.viewItem} ${!isFullView3 ? css.fullView : css.compactView}`}
                     onClick={() => setIsFullView3(false)}>
                    <span>Rút gọn</span>
                </div>
                {/*<div*/}
                {/*    className={isShowAll ? 'navbar-item2' : 'navbar-item'}*/}
                {/*    onClick={() => {*/}
                {/*        setShowAll(!isShowAll);*/}
                {/*    }}*/}
                {/*>*/}
                {/*    <img src={isShowAll ? AllViewIcon2 : AllViewIcon} className="imgIcon"/>*/}
                {/*    <span className="maginRight">Ẩn dòng trống</span>*/}
                {/*</div>*/}
            </div>
        </div>
        <div style={{display: 'flex', gap: 20}}>
            <div style={{flex: 1, height: '90%'}}>
                <div
                    style={{
                        height: '52.1vh',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                    }}
                >

                    <div className="ag-theme-quartz" style={{height: '100%', width: '100%', display: 'flex'}}>
                        <div style={{flex: isSidebarVisible ? '75%' : '100%', transition: 'flex 0.3s',}}>
                            <AgGridReact
                                treeData={true}
                                getDataPath={(data) => data.layer?.toString().split('.')}
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
                                autoGroupColumnDef={{
                                    headerName: '', maxWidth: 30, floatingFilter: false, cellRendererParams: {
                                        suppressCount: true,
                                    }, pinned: 'left',
                                }}
                                rowClassRules={{
                                    'row-head': (params) => {
                                        return params.data.layer?.toString().split('.').length === 1;
                                    },
                                }}
                            />
                        </div>
                        {isSidebarVisible && <AnalysisSideBar table={table + ` - ${team}`} gridRef={gridRef}/>}
                    </div>
                </div>
            </div>
        </div>
    </>);
}
