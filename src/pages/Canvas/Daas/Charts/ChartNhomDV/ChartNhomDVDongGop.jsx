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
import { useParams } from "react-router-dom";
import {getPermissionDataNhomDV} from "../../../getPermissionDataNhomBC.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import NotAccessible from "../../../NotAccessible.jsx";
import {getAllSettingGroup} from "../../../../../apisKTQT/settingGroupService.jsx";

export default function ChartNhomDVDongGop() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas, userClasses, fetchUserClasses, uCSelected_CANVAS, } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const [titleName, setTitleName] = useState('');
    const key = "NHOMDV_DONGGOP_CHART";

    useEffect(() => {
        loadChart();
    }, [currentYearCanvas, currentMonthCanvas])

    const loadChart = async () => {
        try {
            if (tabSelect == 'daas') {
                currentMonthCanvas = 12;
            }
            let data = await loadDataSoKeToan();
            // if (companySelect) {
            //     data = data.filter(item => item.company == companySelect || companySelect == 'HQ');
            // }
            const user = await getCurrentUserLogin();
            let units = await getAllUnits();
            const value = await getAllSettingGroup()
            let groupSettingList = value.filter(e => e?.type == 'unit');
            units.forEach(e => {
                if (e.group) {
                    let group = groupSettingList.find((g) => e.group === g.name);
                    if (group) e.group = group.stt + '-' + e.group
                    else e.group = 1 + '-' + e.group
                }
            })
            units = await getPermissionDataNhomDV('unit', user, userClasses, fetchUserClasses, uCSelected_CANVAS, units)
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
            let result_bcdv = calculateData(data.filter(e => e.year == currentYearCanvas), units, uniqueKMF, 'code', 'unit_code2', 'PBDV', 'teams');
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
            let dongGopDonVi = createSectionData('C1090 - Đóng góp doanh thu BU', percentageDV, [...createNormalisedBarProductGroup(uniqueGroupsDVHasValue)], 'C1090 - Đóng góp doanh thu BU');
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
