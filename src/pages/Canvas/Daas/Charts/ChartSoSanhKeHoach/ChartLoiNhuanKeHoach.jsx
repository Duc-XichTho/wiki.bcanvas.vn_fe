import React, { useContext, useEffect, useState } from "react";
import { message } from "antd";
import { MyContext } from "../../../../../MyContext";
import { AgCharts } from "ag-charts-react";
// LOGIC
// CHART FUNCTION
import { createSectionData, createSeries } from '../../Logic/SetupChart';
import { calculateValueTotalYear } from "../../../../KeToanQuanTri/BaoCao/logic/logicActual";
import { calSupAndT0, mergeDataByHeader, } from '../../../../KeToanQuanTri/BaoCao/Plan2/logicPlan2';
import { convertToArrayForSection1, filterGroup, sumColumns, } from "../../../../KeToanQuanTri/BaoCao/KQKD/setUpSection";
// API
import { getAllPlan } from "../../../../../apisKTQT/planService";
import { getAllKmf } from "../../../../../apisKTQT/kmfService";
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService";
import { useParams } from "react-router-dom";

export default function ChartLoiNhuanKeHoach() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "CHART_LOINHUAN_KEHOACH";

    useEffect(() => {
        loadChart();
    }, [currentYearCanvas, currentMonthCanvas])

    const loadChart = async () => {
        try {
            if (tabSelect == 'daas') {
                currentMonthCanvas = 12;
            }
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
            if (!plans[0]?.rowData) {
            } else {
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
                    for (let i = 1; i <= currentMonthCanvas; i++) {
                        let th = calculateValueTotalYear(item, uniqueKMF, data, i, currentYearCanvas);
                        actualItem[`t${i}`] = th;
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
            let cfList = actualData.filter((item) => item.dp && item.dp.toLowerCase().includes('chi phí'));
            let doanhThuData = sumColumns(doanhThuList);
            let cfData = sumColumns(cfList);
            if (doanhThuData) {
                doanhThuData = convertToArrayForSection1(doanhThuData, currentMonthCanvas);
            }
            if (cfData) {
                cfData = convertToArrayForSection1(cfData, currentMonthCanvas);
            }
            let lnData = []
            for (let i = 0; i < currentMonthCanvas; i++) {
                let ln = { month: i + 1, th: 0, kh: 0, ck: 0 };
                ln.th = doanhThuData[i]?.th + cfData[i]?.th;
                ln.kh = doanhThuData[i]?.kh + cfData[i]?.kh;
                ln.ck = doanhThuData[i]?.ck + cfData[i]?.ck;
                lnData.push(ln)
            }
            let thucHienSeries = createSeries('month', 'th', 'Thực hiện', 'line');
            let keHoachSeries = createSeries('month', 'kh', 'Kế hoạch', 'line');
            let cungKySeries = createSeries('month', 'ck', 'Cùng kỳ', 'line');
            let seriesArr = [thucHienSeries];
            let field0 = getField0(lnData);
            if (!field0.includes('ck')) {
                seriesArr.push(cungKySeries)
            }
            if (!field0.includes('kh')) {
                seriesArr.push(keHoachSeries)
            }
            let doanhThuTong = createSectionData('C1020 - Lợi nhuận thực hiện, với KH và với cùng kỳ', lnData, seriesArr, 'C1020 - Lợi nhuận thực hiện, với KH và với cùng kỳ')
            await setItemInIndexedDB2(key, lnData);
            setOptions(doanhThuTong)
        } catch (error) {
            console.log(error);
            message.error("Lỗi khi load chart");
        }
    }

    function getField0(data) {
        if (!data) return []
        const keys = Object.keys(data[0]);
        return keys.filter(key =>
            data.every(item => item[key] === 0)
        )
    }

    return (
        <div style={{height: '90%'}}>
            {options && <AgCharts style={{ width: '100%', height: '90%' }} options={options} />}
        </div>
    )
};
