import React, { useEffect, useMemo, useState } from 'react';
import {Col, Row, Typography, Button} from 'antd';
import styles from './ViewPlan.module.css';
import {checkDuyetPMVPlan, getAllPMVPlan} from "../../../../../apis/pmvPlanService.jsx";
import {AgGridReact} from "ag-grid-react";
import {formatCurrency} from "../../../../KeToanQuanTri/functionKTQT/formatMoney.js";
import {functionPlan, generateDateRange, parseDate} from "../../FunctionPlan/functionPlan.js";
import { PlusOutlined } from '@ant-design/icons';
const {Title, Text} = Typography;

export default function ViewPlan({ plan: selectedPlanFromProps }) {
    const [listPlan, setListPlan] = useState([])
    const [selectedCard, setSelectedCard] = useState(null)
    const [listRs, setListRs] = useState([])
    const [colDefs, setColDefs] = useState([]);
    
    // Sử dụng selectedPlanFromProps nếu có, ngược lại dùng selectedCard
    const currentSelectedPlan = selectedPlanFromProps || selectedCard;
    const statusBar = useMemo(() => ({
        statusPanels: [{ statusPanel: 'agAggregationComponent' }],
    }), []);

    const fetchDataPlan = async () => {
        const checkDuyet = await checkDuyetPMVPlan()
        let data = await getAllPMVPlan();
        if (data && data.length > 0) {
            if (checkDuyet) {
                setListPlan(data)
            } else {
                setListPlan(data.sort((a, b) => {
                    if (a.duyet === 'Đã duyệt') return -1;
                    if (b.duyet === 'Đã duyệt') return 1;
                    return 0;
                }))
            }

            setSelectedCard(data[0])
            if (data.length > 0) {
                await fetchDataDeployment(data[0].id)
            }
        }

    }

    const fetchDataDeployment = async (id, planData = null) => {
        const planToUse = planData || currentSelectedPlan;
        if (planToUse) {
            let rs4 = await functionPlan(id, planToUse);
            const dateColumns = generateDateRange(parseDate(planToUse.date_from), parseDate(planToUse.date_to)).map((date) => ({
                field: date,
                headerName: date,
                filter: "agNumberColumnFilter",
                headerClass: 'right-align-important',
                width: 110,
                cellStyle: {textAlign: 'right'},
                valueFormatter: (params) => formatCurrency(params.value),
            }));

            const columnDefs = [
                {field: "brand", headerName: "Brand", pinned: "left", width: 100},
                {field: "sku", headerName: "SKU", pinned: "left", width: 100},
                {field: "userClass", headerName: "User Class", pinned: "left", width: 100},
                ...dateColumns
            ];
            setListRs(rs4)
            setColDefs(columnDefs)
        }
    }

    useEffect(() => {
        // Chỉ load data nếu không có selectedPlanFromProps
        if (!selectedPlanFromProps) {
            fetchDataPlan()
        }
    }, [selectedPlanFromProps]);

    // Reload data khi selectedPlanFromProps thay đổi
    useEffect(() => {
        if (selectedPlanFromProps) {
            setSelectedCard(selectedPlanFromProps);
            fetchDataDeployment(selectedPlanFromProps.id, selectedPlanFromProps);
        }
    }, [selectedPlanFromProps]);

    useEffect(() => {
        if (selectedCard) {
            fetchDataDeployment(selectedCard.id)
        }
    }, [selectedCard]);

    const handleClick = (data) => {
        setSelectedCard(data)
    }

    return (
        <>
            <Row className={styles.container}>
                {currentSelectedPlan && (
                    <>
                        {/* Sidebar - List Plans */}
                        {/* <Col span={4} className={styles.sidebar}>
                            <div className={styles.addButton}>
                                <Button 
                                    icon={<PlusOutlined />} 
                                    type="dashed" 
                                >
                                    Thêm kế hoạch mới
                                </Button>
                            </div>
                            <div className={styles.listTitle}>
                                <Text>Danh sách kế hoạch</Text>
                            </div>
                            <div className={styles.list}>
                                {listPlan.map(value => (
                                    <div
                                        key={value.id}
                                        onClick={() => handleClick(value)}
                                        className={`${styles.listItem} ${currentSelectedPlan?.id == value.id ? styles.activeItem : ''}`}
                                    >
                                        <div style={{ flex: 1, overflow: 'hidden',
                                            display: 'flex',
                                            justifyContent: 'space-between', }}>
                                            <div>
                                                <h4 className={styles.itemTitle}>{value.name}</h4>
                                                <div className={styles.itemDates}>
                                                    <span className={styles.itemDateLine}>{value.date_from} - {value.date_to}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className={styles.itemStatus} style={{ color: value.duyet && value.duyet == 'Đã duyệt' ? '#52c41a' : '#666' }}>
                                                    {value.duyet && value.duyet == 'Đã duyệt' ? value.duyet : 'Nháp'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Col> */}

                        {/* Main Content */}
                        <Col span={24} className={styles.main}>
                            {/* Header with plan info */}
                            <div className={styles.header}>
                                <div>
                                    <Title level={3} style={{ margin: 0 }}>{currentSelectedPlan?.name}</Title>
                                    <div style={{ marginTop: '8px' }}>
                                        <Text>Kì lập kế hoạch: Từ {currentSelectedPlan?.date_from} đến {currentSelectedPlan?.date_to}</Text>
                                    </div>
                                </div>
                            </div>

                            {/* AG Grid */}
                            <div className={`ag-theme-quartz ${styles.gridWrap}`}>
                                <AgGridReact
                                    rowData={listRs}
                                    columnDefs={colDefs}
                                    defaultColDef={{sortable: true, resizable: true, filter: true}}
                                    statusBar={statusBar}
                                    enableRangeSelection={true}
                                />
                            </div>
                        </Col>
                    </>
                )}
            </Row>
        </>
    );
}
