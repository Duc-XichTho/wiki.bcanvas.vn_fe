import React, { useEffect, useState } from 'react';
import style from '../Content/Content.module.css';
import css from '../../components/KeHoachKinhDoanh/Plan/PlanningModal.module.css';
import { useParams } from 'react-router-dom';
import KeHoachKinhDoanh from '../../components/KeHoachKinhDoanh/KeHoachKinhDoanh.jsx';
import { InputNumber } from 'antd';
import { getPMVDeploymentsByPlanId } from '../../../../apis/pmvDeploymentService.jsx';
import { getAllPMVPlan } from '../../../../apis/pmvPlanService.jsx';
import { functionPlan1, parseDate } from '../../components/FunctionPlan/functionPlan.js';
import ViewPlanActual from '../../components/KeHoachKinhDoanh/ViewPlan/ViewPlanActual.jsx';
import { getAllPMVDeploymentDetail } from '../../../../apis/pmvDeploymentDetailService.jsx';
import BottomDownView from '../../components/KeHoachKinhDoanh/BottomDown/BottomDownView.jsx';
import NhapLieuThucThi from '../../components/KeHoachKinhDoanh/NhapLieuThucThi/NhapLieuThucThi.jsx';
import { getAllPMVSettingKH } from '../../../../apis/pmvSettingKHService.jsx';
import { getDepTableByPlanIdService, getTemplateRow } from '../../../../apis/templateSettingService.jsx';
import { convertDataActualField, getHeaderName } from '../../components/FunctionPlan/functionActual.js';


const ContentKHKD = () => {
    const [pmvSettingKH, setPmvSettingKH] = useState([]);

    async function getData() {
        let listSettingKH = await getAllPMVSettingKH()
        setPmvSettingKH(listSettingKH)
    }

    async function getActualData(deployment) {
        try {
            let table = await getDepTableByPlanIdService(deployment.id);
            if (table && table.id) {
                let rowsResponse = await getTemplateRow(table.id)
                let rows = rowsResponse.rows || [];
                rows = rows.map(row => row.data);
                let setup = deployment.setup_config.at(-1)
                if (!setup) return []
                return convertDataActualField(rows, setup.headerName, deployment.setup_config.length)
            }
            return []
        } catch (e){
            // console.log(e)
            return []
        }
    }

    const {idKHKD} = useParams();
    const [listPMVDeployment, setListPMVDeployment] = useState([])
    const [selectedCard, setSelectedCard] = useState(null)
    const [totals, setTotal] = useState({})
    const [rs, setRs] = useState(null)
    const fetchDataPlan = async () => {
        const data = await getAllPMVPlan()
        setSelectedCard(data.find((p) => p.duyet == 'Đã duyệt'))
    }

    useEffect(() => {
        getData().then()
        fetchDataPlan().then()
    }, [])

    const updateParentValues = (planData) => {
        const updatedData = [...planData];
        const calculateTotals = (parentId) => {
            const children = updatedData.filter(item => item?.parentId === parentId);
            if (children.length > 0) {
                const totalBenchmark = children.reduce((sum, child) => sum + child?.targetCumulativeToday, 0);
                const totalTarget = children.reduce((sum, child) => sum + child?.target, 0);
                const totalActual = children.reduce((sum, child) => sum + child?.actualToday, 0);
                updatedData.forEach(item => {
                    if (item && item?.id === parentId) {
                        item.targetCumulativeToday = totalBenchmark;
                        item.target = totalTarget;
                        item.actualToday = totalActual;
                    }
                });

                const parent = updatedData.find(item => item?.id === parentId);
                if (parent && parent?.parentId !== null) {
                    calculateTotals(parent.parentId);
                }
            }
        };

        updatedData.forEach(item => {
            if (item?.parentId !== null) calculateTotals(item?.parentId);
        });

        return updatedData;
    };
    const [processedData, setProcessedData] = useState({});

    const fetchDataDeployment = async (id) => {
        try {
            const listPMVDeployment = await getPMVDeploymentsByPlanId(id);
            const rs = await functionPlan1(id, selectedCard);
            const depsDetail = await getAllPMVDeploymentDetail();
            setListPMVDeployment(listPMVDeployment);
            setRs(rs);

            // Process data for each deployment
            const deploymentData = {};
            const deploymentTotals = [];

            for (const deployment of listPMVDeployment) {
                deployment.setup_config.forEach(e => {
                    e.headerName = getHeaderName(pmvSettingKH, e.category_type, e.selected_group);
                })
                let actuals = await getActualData(deployment);
                const relatedDetails = depsDetail
                    .filter(detail => detail.deployment_id === deployment.id)
                    .map(item => {
                        const data = {...item.data};
                        const rsItem = rs?.find(r => r.id === data.id);

                        data.targetCumulativeToday = rsItem ?
                            +rsItem.targetCumulativeToday.toFixed(0) : 0;

                        // Use a deterministic random value based on deployment ID
                        const randomSeed = (deployment.id * 123) % 100;
                        const randomFactor = 0.8 + (randomSeed / 100) * 0.3;
                        data.actualToday = 0;

                        return data;
                    });
                const today = new Date();
                if (actuals && actuals.length > 0) {
                    relatedDetails.forEach(plan => {
                        plan.actualToday = actuals
                            .filter(act => act.level === plan.level && act.group_value === plan.group_value && parseDate(act["Thời gian"]) < today)
                            .reduce((sum, act) => sum + act["Tiền thu"], 0);
                    });
                }
                // Calculate totals and update parent values
                const updatedPlanData = updateParentValues(relatedDetails);

                // Calculate level 1 totals
                const levelOneTotals = relatedDetails
                    .filter(item => item?.level === 1)
                    .reduce(
                        (totals, item) => ({
                            targetCumulativeToday: totals.targetCumulativeToday + Number(item.targetCumulativeToday || 0),
                            actualToday: totals.actualToday + Number(item.actualToday || 0),
                            target: totals.target + Number(item.target || 0)
                        }),
                        {targetCumulativeToday: 0, target: 0, actualToday: 0}
                    );

                // Add total row
                const totalRow = {
                    group_value: 'Tổng',
                    level: 0,
                    parentId: null,
                    ...levelOneTotals
                };

                updatedPlanData.unshift(totalRow);
                deploymentData[deployment.id] = updatedPlanData;
                deploymentTotals.push(totalRow);
            }

            // Calculate grand total
            const grandTotal = deploymentTotals.reduce(
                (total, row) => ({
                    actualToday: total.actualToday + Number(row.actualToday || 0),
                    targetCumulativeToday: total.targetCumulativeToday + Number(row.targetCumulativeToday || 0),
                    target: total.target + Number(row.target || 0)
                }),
                {actualToday: 0, targetCumulativeToday: 0, target: 0}
            );
            setProcessedData(deploymentData);
            setTotal({
                actualToday: Math.round(grandTotal.actualToday),
                targetCumulativeToday: Math.round(grandTotal.targetCumulativeToday),
                target: Math.round(grandTotal.target)
            });

        } catch (error) {
            console.error("Error in fetchDataDeployment:", error);
        }
    };
    useEffect(() => {
        if (selectedCard) {
            fetchDataDeployment(selectedCard.id)
        }
    }, [selectedCard, pmvSettingKH]);

    const [viewTotals, setViewTotals] = useState([]);

    useEffect(() => {
        if (viewTotals.length > 0) {
            const grandTotal = viewTotals.reduce(
                (total, row) => {
                    total.actualToday += Number(row.actualToday || 0);
                    total.targetCumulativeToday += Number(row.targetCumulativeToday || 0);
                    total.target += Number(row.target || 0);
                    return total;
                },
                {actualToday: 0, targetCumulativeToday: 0, target: 0}
            );

            setTotal({
                actualToday: Math.round(grandTotal.actualToday),
                targetCumulativeToday: Math.round(grandTotal.targetCumulativeToday),
                target: Math.round(grandTotal.target),
            });
        }
    }, [viewTotals]);

    // Modify the BottomDownTo component to pass the updateViewTotal function
    const BottomDownTo = () => {
        return (
            <>
                <div className={css.section}>
                    <div className={style.headerContainer}>
                        <div>
                            <span className={css.titleText}> {selectedCard?.name} </span>
                        </div>
                        <div className={style.headerInfo}>
                            <span>Kì lập kế hoạch</span>
                            <span>Từ {selectedCard?.date_from} </span>
                            <span>Đến {selectedCard?.date_to}</span>
                        </div>
                    </div>
                </div>
                <div className={style.planInfo}>
                    <div className={style.container_top}>
                        <div className={style.total}>
                            <span>TỔNG CỘNG</span>
                        </div>
                        <div className={style.ip_con}>
                            <span>Thực hiện trong kì</span>
                            <InputNumber
                                value={totals?.actualToday || 0}
                                style={{width: "100%", textAlign: "right"}}
                                readOnly={true}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </div>
                        <div className={style.ip_con}>
                            <span>Kế hoạch theo tiến độ</span>
                            <InputNumber
                                value={totals?.targetCumulativeToday || 0}
                                style={{width: "100%", textAlign: "right"}}
                                readOnly={true}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </div>
                        <div className={style.ip_con}>
                            <span>Kế hoạch cả kỳ</span>
                            <InputNumber
                                value={totals?.target || 0}
                                style={{width: "100%", textAlign: "right"}}
                                readOnly={true}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </div>
                    </div>
                </div>
                {listPMVDeployment.map(value => (
                    <div className={css.sectionContainer} key={value.id}>
                        <BottomDownView
                            deployment={value}
                            planData={processedData[value.id] || []}
                            show={true}
                        />
                    </div>
                ))}
            </>
        )
    }

    const componentsMap = {
        1: KeHoachKinhDoanh,
        2: NhapLieuThucThi,
        3: BottomDownTo,
        4: ViewPlanActual,
    };

    const CurrentComponent = componentsMap[idKHKD];


    return (
        <div className={style.container}>
            {CurrentComponent && <CurrentComponent
            />}
        </div>
    );
};

export default ContentKHKD;
