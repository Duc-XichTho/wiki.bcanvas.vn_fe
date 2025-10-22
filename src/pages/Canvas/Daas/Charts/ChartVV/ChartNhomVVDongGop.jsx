import React, { useEffect, useContext, useState } from "react";
import css from '../chart.module.css';
import { message } from "antd";
import { MyContext } from "../../../../../MyContext";
import { AgCharts } from "ag-charts-react";
// LOGIC
import { calculateData } from "../../../../KeToanQuanTri/BaoCao/KQKD/logicKQKD";
import {
    caculateSumRevenueWithMonthAndUnitSP,
    filterAndSumData,
    filterGroup,
    transformDataBCKD,
    prepareChartSeries,
    calculatePercentagesPerMonth
} from "../../../../KeToanQuanTri/BaoCao/KQKD/setUpSection";
// CHART FUNCTION
import { createSectionData, createNormalisedBarProductGroup } from "../../Logic/SetupChart";
// API
import { getAllUnits } from "../../../../../apisKTQT/unitService";
import { getAllKmf } from "../../../../../apisKTQT/kmfService";
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService";
import { getAllKenh } from "../../../../../apisKTQT/kenhService.jsx";
import { getAllProject } from "../../../../../apisKTQT/projectService.jsx";
import { useParams } from "react-router-dom";
import NotAccessible from "../../../NotAccessible.jsx";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataNhomBC} from "../../../getPermissionDataNhomBC.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";

export default function ChartNhomVVDongGop() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas, userClasses, fetchUserClasses, uCSelected_CANVAS } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "NHOMVV_DONGGOP_CHART";
    const [titleName, setTitleName] = useState('');

    useEffect(() => {
        loadChart();
    }, [currentYearCanvas, currentMonthCanvas])

    const loadChart = async () => {
        try {
            if (tabSelect == 'daas') {
                currentMonthCanvas = 12;
            }
            let data = await loadDataSoKeToan();
            if (companySelect) {
                data = data.filter(item => item.company == companySelect || companySelect == 'HQ');
            }
            let units = await getAllProject();
            const user = await getCurrentUserLogin();
            units = await getPermissionDataNhomBC('project', user, userClasses, fetchUserClasses, uCSelected_CANVAS, units)

            if (units?.length == 0 || !units) {
                setTitleName(KHONG_THE_TRUY_CAP)
                units = []
            }
            let uniqueKMF = await getAllKmf();
            uniqueKMF = uniqueKMF.reduce((acc, current) => {
                if (!acc.find((unit) => unit.name === current.name)) {
                    acc.push(current);
                }
                return acc;
            }, []);
            let uniqueGroupsDV = filterGroup([...new Set(units.map((unit) => unit.group))]).sort();
            uniqueGroupsDV = uniqueGroupsDV.filter(e => e !== '15-Internal');
            let result_bcdv = calculateData(data.filter(e => e.year == currentYearCanvas), units, uniqueKMF, 'code', 'project2', 'PBPROJECT', 'teams');
            result_bcdv = transformDataBCKD(result_bcdv, uniqueGroupsDV, units);
            let data_for_chart_line_BCDV = [];
            let doanh_thu_data_BCDV = filterAndSumData(result_bcdv, 'Doanh thu', '.');
            for (let month = 1; month <= (currentMonthCanvas == 0 ? 12 : currentMonthCanvas); month++) {
                const rowBCDV = {
                    month: `T${month}`
                };
                const mon = `${month}`;
                uniqueGroupsDV.forEach((unit) => {
                    rowBCDV[unit?.toLowerCase()] = caculateSumRevenueWithMonthAndUnitSP(doanh_thu_data_BCDV, mon, unit);
                });
                data_for_chart_line_BCDV = [...data_for_chart_line_BCDV, rowBCDV];
            }
            const keys = Object.keys(data_for_chart_line_BCDV[0]).filter(key => key !== "month");
            const unValueC5 = keys.filter(key => data_for_chart_line_BCDV.every(obj => obj[key] == 0));
            let uniqueGroupsDVHasValue = uniqueGroupsDV.filter(e => !unValueC5.includes(e.toLowerCase()));
            let percentageDV = calculatePercentagesPerMonth(data_for_chart_line_BCDV);
            let dongGopDonVi = createSectionData('C1170 - Đóng góp doanh thu vụ việc', percentageDV, [...createNormalisedBarProductGroup(uniqueGroupsDVHasValue)], 'C1170 - Đóng góp doanh thu vụ việc');
            await setItemInIndexedDB2(key, data_for_chart_line_BCDV);
            setOptions(dongGopDonVi)
        } catch (error) {
            console.log(error)
            message.error("Lỗi khi load chart");
        }
    }

    return (
        <div>
            <NotAccessible NotAccessible={titleName}/>
            {options && <AgCharts style={{ width: '100%', height: '90%' }} options={options} />}
        </div>
    )
};
