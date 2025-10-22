import React, {useEffect, useMemo, useState} from 'react';
import {Button, Col, DatePicker, Modal, Row, Typography} from 'antd';
import css from './PlanningModal.module.css';
import {getAllPMVPlan} from "../../../../../apis/pmvPlanService.jsx";
import {AgGridReact} from "ag-grid-react";
import {formatCurrency} from "../../../../KeToanQuanTri/functionKTQT/formatMoney.js";
import {
    aggregateByBrandAndSku,
    calculateCosts,
    calculateCumulativeData,
    functionPlan,
    getDailyCostsAndRevenue,
    getSummaryInRange,
    summarizeDailyTotals
} from "../../FunctionPlan/functionPlan.js";
import dayjs from "dayjs";
import CostConfig from "./CostConfig.jsx";
import {getCFConfigByPlanIdService} from "../../../../../apis/CFConfigService.jsx";
import {
    addProfitLoss,
    calculateProjections, convertDataActual,
    distributeSales,
    getFilteredData,
    getSummaryForDateRange,
    prepareChart,
    processData
} from "../../FunctionPlan/functionActual.js";
import {createSectionData} from "../../../Daas/Logic/SetupChart.js";
import {AgCharts} from "ag-charts-react";
import {getTemplateRow, getTemplateTableByPlanIdService} from "../../../../../apis/templateSettingService.jsx";

const {Title, Text} = Typography;

let dataActual = [
    {"Brand": "Pepsi", "SKU": "250ML", "Tiền thu": 28160000, "Thời gian": "28/3/2025"},
    {"Brand": "Pepsi", "SKU": "350ML", "Tiền thu": 20900000, "Thời gian": "24/3/2025"},
    {"Brand": "Coca", "SKU": "250ML", "Tiền thu": 48750000, "Thời gian": "24/3/2025"},
    {"Brand": "Xtra", "SKU": "250ML", "Tiền thu": 26000000, "Thời gian": "20/4/2025"},
    {"Brand": "Xtra", "SKU": "350ML", "Tiền thu": 7000000, "Thời gian": "22/3/2025"},
    {"Brand": "Pepsi", "SKU": "350ML", "Tiền thu": 456000000, "Thời gian": "1/5/2025"},
    {"Brand": "Coca", "SKU": "250ML", "Tiền thu": 187500000, "Thời gian": "22/3/2025"},
    {"Brand": "Coca", "SKU": "350ML", "Tiền thu": 217800000, "Thời gian": "28/3/2025"},
    {"Brand": "Coca", "SKU": "350ML", "Tiền thu": 3000000, "Thời gian": "24/3/2025"}
];
let today = new Date();
let day = today.getDate();
let month = today.getMonth() + 1;
let year = today.getFullYear();
let currentDate = `${day}/${month}/${year}`;
export default function ViewPlanActual() {
    const [options, setOptions] = useState([]);
    const [options2, setOptions2] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [listRs, setListRs] = useState([]);
    const [listRsLK, setListRsLK] = useState([]);
    const [listRsLK2, setListRsLK2] = useState([]);
    const [rowData1, setRowData1] = useState([]);
    const [rowData2, setRowData2] = useState([]);
    const [rowData2Actual, setRowData2Actual] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [colDefs2, setColDefs2] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const {RangePicker} = DatePicker;
    const [dateFrom, setDateFrom] = useState(dayjs("2025-03-26"));
    const [dateTo, setDateTo] = useState(dayjs("2025-03-26"));
    const defaultColDef = useMemo(() => {
        return {
            editable: false,
            filter: true,
            cellStyle: {
                fontSize: '14.5px',
                color: 'var(--text-color)',
                fontFamily: 'var(--font-family)',
            },
            width: 125,
            wrapHeaderText: true,
            autoHeaderHeight: true,
        };
    });

    const statusBar = useMemo(() => ({
        statusPanels: [{statusPanel: 'agAggregationComponent'}],
    }), []);

    const fetchDataPlan = async () => {
        const data = await getAllPMVPlan();
        let plan = data.find(e => e.duyet == 'Đã duyệt');
        setSelectedCard(plan);
    };

    const fetchDataDeployment = async (id) => {
        if (selectedCard) {
            const configs = await getCFConfigByPlanIdService(id);
            let tableIds = await getTemplateTableByPlanIdService(id);
            let dataActual = [];
            for (const tableId of tableIds) {
                let rowsResponse = await getTemplateRow(tableId.id)
                let rows = rowsResponse.rows || [];
                rows = rows.map(row => row.data);
                console.log('Raw template rows:', rows);
                dataActual.push(...convertDataActual(rows));
            }
            console.log('After convertDataActual:', dataActual);
            
            let rs4 = await functionPlan(id, selectedCard);
            dataActual = getFilteredData(dataActual, rs4)
            console.log('After getFilteredData:', dataActual);
            
            let rs5 = calculateCumulativeData(rs4);
            let rs6 = aggregateByBrandAndSku(rs5);
            let rs6Actual = distributeSales(dataActual, selectedCard.date_from, selectedCard.date_to);
            console.log('After distributeSales:', rs6Actual);
            
            let rs7 = calculateCosts(rs6, configs, selectedCard.date_to);
            let rs7Actual = calculateCosts(rs6Actual, configs, selectedCard.date_to);
            console.log('After calculateCosts:', rs7Actual);
            
            let rs8 = summarizeDailyTotals(rs7, configs);
            let rs8Actual = summarizeDailyTotals(rs7Actual, configs);
            console.log('After summarizeDailyTotals:', rs8Actual);
            
            let rowData1 = getSummaryInRange(rs8, currentDate, selectedCard.date_to);
            let rowData1Actual = getSummaryInRange(rs8Actual, currentDate, selectedCard.date_to);
            console.log('rowData1:', rowData1);
            console.log('rowData1Actual:', rowData1Actual);
            
            let updatedRowData1 = rowData1.map(item => {
                const actualItem = rowData1Actual.find(a => a.name === item.name);
                console.log('Mapping item:', item.name, 'Found actualItem:', actualItem);
                return actualItem ? {...item, actual: actualItem.targetToday} : item;
            });
            updatedRowData1 = calculateProjections(updatedRowData1)
            updatedRowData1 = addProfitLoss(updatedRowData1)
            let rowData2 = getDailyCostsAndRevenue(rs7, currentDate);
            let rowData2Actual = getDailyCostsAndRevenue(rs7Actual, currentDate);
            const columnDefs = [
                {field: "name", headerName: "", width: 150},
                {
                    field: "actual", headerName: "Thực hiện",
                    headerClass: 'right-align-important',
                    cellStyle: {textAlign: 'right'},
                    valueFormatter: params => formatCurrency(params.value),
                },
                {
                    field: "targetToday", headerName: "Kì vọng lũy kế",
                    headerClass: 'right-align-important',
                    cellStyle: {textAlign: 'right'},
                    valueFormatter: params => formatCurrency(params.value),
                },
                {
                    field: "difference", headerName: "Chênh lệch",
                    headerClass: 'right-align-important',
                    cellStyle: {textAlign: 'right'},
                    valueFormatter: params => formatCurrency(params.value),
                },
                {
                    field: "target", headerName: "Kế hoạch cả kì",
                    headerClass: 'right-align-important',
                    cellStyle: {textAlign: 'right'},
                    valueFormatter: params => formatCurrency(params.value),
                },
                {
                    field: "projectedFullTerm", headerName: " Dự phóng thực hiện cả kì",
                    headerClass: 'right-align-important',
                    cellStyle: {textAlign: 'right'},
                    valueFormatter: params => formatCurrency(params.value),
                },
                {
                    field: "projectedDifferenceFullTerm", headerName: "Dự phóng chênh lệch cả kì",
                    headerClass: 'right-align-important',
                    cellStyle: {textAlign: 'right'},
                    valueFormatter: params => formatCurrency(params.value),
                },
            ];
            // Thêm các cột chi phí

            const columnDefs2 = [
                {field: "brand", headerName: "Brand", pinned: "left",},
                {field: "sku", headerName: "SKU", pinned: "left",},
                {
                    field: "DoanhThu",
                    headerName: "Doanh thu",
                    headerClass: "right-align-important",
                    width: 150,
                    cellStyle: {textAlign: "right"},
                    valueFormatter: params => formatCurrency(params.value),
                }
            ];
            const costKeys = configs.map(e => e.name);
            costKeys.forEach(costKey => {
                columnDefs2.push({
                    field: costKey,
                    headerName: costKey,
                    headerClass: "right-align-important",
                    cellStyle: {textAlign: "right"},
                    valueFormatter: params => formatCurrency(params.value),
                });
            });
            columnDefs2.push({
                field: 'LoiNhuan',
                headerName: 'Lợi nhuận',
                headerClass: "right-align-important",
                width: 150,
                cellStyle: {textAlign: "right"},
                valueFormatter: params => formatCurrency(params.value),
            });
            columnDefs2.push({
                field: 'PhanTramLoiNhuan',
                headerName: '% Lợi nhuận',
                headerClass: "right-align-important",
                width: 150,
                cellStyle: {textAlign: "right"},
            });
            setListRs(rs4);
            setListRsLK(rs5);
            setRowData1(updatedRowData1);
            setColDefs(columnDefs);
            setRowData2(rowData2);
            setColDefs2(columnDefs2);
            let dataChartDT = getSummaryForDateRange(rs8, rs8Actual, selectedCard.date_from, selectedCard.date_to, 'Doanh thu');
            let dataChartLN = getSummaryForDateRange(rs8, rs8Actual, selectedCard.date_from, selectedCard.date_to, 'Lãi lỗ');
            let doanhThuChart = createSectionData('', processData(dataChartDT, currentDate), prepareChart(), '');
            let laiLoChart = createSectionData('', processData(dataChartLN, currentDate), prepareChart(), '');
            setOptions(doanhThuChart)
            setOptions2(laiLoChart)
        }
    };

    useEffect(() => {
        fetchDataPlan();
    }, []);

    useEffect(() => {
        if (selectedCard) {
            fetchDataDeployment(selectedCard.id);
        }
    }, [selectedCard]);

    return (
        <>
            {selectedCard && (
                <>
                    <Modal
                        title="Cấu hình chi phí"
                        open={isModalOpen}
                        onCancel={() => {
                            setIsModalOpen(false);
                            if (selectedCard) {
                                fetchDataDeployment(selectedCard.id);
                            }
                        }}
                        footer={null}
                        width={'80vw'}
                    >
                        {
                            selectedCard && selectedCard.date_from && selectedCard.date_to && listRsLK
                            && <CostConfig listRsLK={listRsLK} date_from={selectedCard.date_from}
                                           date_to={selectedCard.date_to} planId={selectedCard.id}/>
                        }

                    </Modal>
                    <div className={css.container}>
                        <div className={css.headerContainer}>
                            <div>
                                <span className={css.titleText}>KẾ HOẠCH KINH DOANH</span>
                            </div>
                            <div className={css.planInfo}>
                                <Text>Kì lập kế hoạch</Text>
                                <Text>Từ {selectedCard.date_from} </Text>
                                <Text>Đến {selectedCard.date_to}</Text>
                            </div>
                            {/*<RangePicker*/}
                            {/*    format="DD/MM/YYYY"*/}
                            {/*    value={[dayjs(dateFrom, "DD/MM/YYYY"), dayjs(dateTo, "DD/MM/YYYY")]}*/}
                            {/*    onChange={(dates, dateStrings) => {*/}
                            {/*        if (dates) {*/}
                            {/*            setDateFrom(dateStrings[0]);*/}
                            {/*            setDateTo(dateStrings[1]);*/}
                            {/*        }*/}
                            {/*    }}*/}
                            {/*/>*/}
                            <Button onClick={() => setIsModalOpen(true)}>
                                Cấu hình chi phí
                            </Button>
                            <Button>
                                Thu gọn
                            </Button>
                        </div>
                        <Row className={css.top}>
                            <Col span={12} style={{padding: '0px 5px 0 0px'}}>
                                <div style={{paddingTop: 5}}>
                                    <span>Doanh thu</span>
                                    {options && <AgCharts options={options}/>}
                                </div>
                            </Col>
                            <Col span={12} style={{padding: '0px 0px 0 5px'}}>
                                <div style={{paddingTop: 5}}>
                                    <span>Lợi nhuân</span>
                                    {options2 && <AgCharts options={options2}/>}
                                </div>
                            </Col>
                        </Row>
                        <Row className={css.top}>
                            <Col span={24}>
                                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                                    <AgGridReact
                                        rowData={rowData1}
                                        columnDefs={colDefs}
                                        statusBar={statusBar}
                                        enableRangeSelection={true}
                                        defaultColDef={defaultColDef}
                                    />
                                </div>
                            </Col>
                        </Row>
                        <Row className={css.bot}>
                            <Col span={24}>
                                <h3>Kế hoạch</h3>
                                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                                    <AgGridReact
                                        rowData={rowData2}
                                        columnDefs={colDefs2}
                                        defaultColDef={defaultColDef}
                                        statusBar={statusBar}
                                        enableRangeSelection={true}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </div>
                </>
            )}
        </>
    );
}
