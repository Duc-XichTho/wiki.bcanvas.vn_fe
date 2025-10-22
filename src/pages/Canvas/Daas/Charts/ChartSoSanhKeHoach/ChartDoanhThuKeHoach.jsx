import React, { useContext, useEffect, useState } from "react";
import { message } from "antd";
import { MyContext } from "../../../../../MyContext";
// import { AgGauge } from "ag-charts-react";
// LOGIC
// CHART FUNCTION
import { createSectionData, createSeries, createSectionDataLinearGauge } from '../../Logic/SetupChart';
import { calculateValueTotalYear } from "../../../../KeToanQuanTri/BaoCao/logic/logicActual";
import { calSupAndT0, mergeDataByHeader, } from '../../../../KeToanQuanTri/BaoCao/Plan2/logicPlan2';
import { convertToArrayForSection1, filterGroup, sumColumns, } from "../../../../KeToanQuanTri/BaoCao/KQKD/setUpSection";
// API
import { getAllPlan } from "../../../../../apisKTQT/planService";
import { getAllKmf } from "../../../../../apisKTQT/kmfService";
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService";
import { useParams } from "react-router-dom";

export default function ChartDoanhThuKeHoach() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas } = useContext(MyContext);
    const [optionsDT, setOptionsDT] = useState([]);
    const [optionsLK, setOptionsLK] = useState([]);
    const key = "CHART_DOANHTHU_KEHOACH";

    useEffect(() => {
        loadChart();
    }, [currentYearCanvas, currentMonthCanvas])

    const loadChart = async () => {
        try {
            let plans = await getAllPlan();
            let uniqueKMF = await getAllKmf();
            let data = await loadDataSoKeToan();
            uniqueKMF = uniqueKMF.reduce((acc, current) => {
                if (!acc.find((unit) => unit.name === current.name)) {
                    acc.push(current);
                }
                return acc;
            }, []);
            let planData = [];
            plans = plans.filter((item) => item.type === 'View3')
            if (!plans[0]?.rowData) { } else {
                plans.forEach((plan) => {
                    plan.rowData?.forEach(data => {
                        planData = [...planData, ...calSupAndT0(data.data)]
                    })
                })
            }
            planData = mergeDataByHeader(planData)
            let actualData = [];
            let uniqueGroupsKMF = filterGroup([...new Set(uniqueKMF.map((unit) => unit.group))]).sort();

            uniqueGroupsKMF.forEach((item) => {
                if (item) {
                    let actualItem = {
                        dp: item
                    };
                    for (let i = 1; i <= (currentMonthCanvas == 0 ? 12 : currentMonthCanvas); i++) {
                        let th = calculateValueTotalYear(item, uniqueKMF, data, i, currentYearCanvas);
                        actualItem[`t${i}`] = th == 0 ? NaN : th;
                        actualItem[`t${i}_ck`] = calculateValueTotalYear(item, uniqueKMF, data, i, currentYearCanvas - 1);
                    }
                    actualData.push(actualItem)

                }
            })
            actualData.forEach((actual) => {
                planData.forEach((plan) => {
                    if (plan.header === actual.dp) {
                        for (let i = 1; i <= 12; i++) {
                            actual[`t${i}_kh`] = +plan[`t${i}`] || 0
                        }
                    }
                })
            })
            let doanhThuList = actualData.filter((item) => item.dp && item.dp.toLowerCase().includes('doanh thu'));
            let doanhThuData = sumColumns(doanhThuList);
            if (doanhThuData) {
                doanhThuData = convertToArrayForSection1(doanhThuData, (currentMonthCanvas == 0 ? 12 : currentMonthCanvas));
            }
            const doanhThuThang = doanhThuData.find((item) => item.month == currentMonthCanvas);
            const doanhThuThangChart = createSectionDataLinearGauge(
                doanhThuThang.th < doanhThuThang.kh ? doanhThuThang.th : doanhThuThang.kh,
                0,
                (doanhThuThang.th < doanhThuThang.kh ? doanhThuThang.kh : doanhThuThang.th) * 1.1,
                doanhThuThang.kh,
                "Kế hoạch",
                `Doanh thu so với Kế hoạch trong tháng ${currentMonthCanvas}`
            )
            let THLuyKe = 0
            let KHLuyKe = 0
            doanhThuData.forEach((item) => {
                THLuyKe += item.th
                KHLuyKe += item.kh
            })
            const doanhThuLuyKeChart = createSectionDataLinearGauge(
                THLuyKe < KHLuyKe ? THLuyKe : KHLuyKe,
                0,
                (THLuyKe < KHLuyKe ? KHLuyKe : THLuyKe) * 1.1,
                KHLuyKe,
                "Kế hoạch",
                `Doanh thu so với Kế hoạch trong Lũy Kế`
            )
            await setItemInIndexedDB2(key, doanhThuData);
            setOptionsDT(doanhThuThangChart)
            setOptionsLK(doanhThuLuyKeChart)
        } catch (error) {
            console.log(error);
            message.error("Lỗi khi load chart");
        }
    }

    return (
        <div>
            {/*{optionsDT && <AgGauge options={optionsDT} />}*/}
            <br />
            {/*{optionsLK && <AgGauge options={optionsLK} />}*/}
        </div>
    )
};
