import React, { useEffect, useContext, useState } from "react";
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
    filterAndSumDataByCode, prepareChartSeriesRatio
} from "../../../../KeToanQuanTri/BaoCao/KQKD/setUpSection";
import { createSeriesCMSP } from "../../../../KeToanQuanTri/functionKTQT/chartSetUp/setUpChart";
// CHART FUNCTION
import { createSectionData } from "../../Logic/SetupChart";
// API
import { getAllUnits } from "../../../../../apisKTQT/unitService";
import { getAllKmf } from "../../../../../apisKTQT/kmfService";
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService";
import { useParams } from "react-router-dom";
import NotAccessible from "../../../NotAccessible.jsx";
import {getPermissionDataNhomDV} from "../../../getPermissionDataNhomBC.js";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import {getAllSettingGroup} from "../../../../../apisKTQT/settingGroupService.jsx";

export default function ChartNhomDVLaiLo() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas, userClasses, fetchUserClasses, uCSelected_CANVAS, } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "NHOMDV_LAILO_CHART";
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
            let uniqueGroupsDV = filterGroup([...new Set(units.map((unit) => unit.group))]).sort();
            uniqueGroupsDV = uniqueGroupsDV.filter(e => e !== '15-Internal');
            let uniqueKMF = await getAllKmf();
            uniqueKMF = uniqueKMF.reduce((acc, current) => {
                if (!acc.find((unit) => unit.name === current.name)) {
                    acc.push(current);
                }
                return acc;
            }, []);
            let data_for_chart_line_CMDV = [];
            let result_bcdv = calculateData(data.filter(e => e.year == currentYearCanvas), units, uniqueKMF, 'code', 'unit_code2', 'PBDV', 'teams');
            result_bcdv = transformDataBCKD(result_bcdv, uniqueGroupsDV, units);
            let cm_data_BCDV = filterAndSumDataByCode(result_bcdv, ['DT', 'GV', 'VC']);
            let doanh_thu_data_BCDV = filterAndSumData(result_bcdv, 'Doanh thu', '.');
            for (let month = 1; month <= (currentMonthCanvas == 0 ? 12 : currentMonthCanvas); month++) {
                const rowCMDV = {
                    month: `T${month}`
                };
                const mon = `${month}`;
                uniqueGroupsDV.forEach((unit) => {
                    rowCMDV[unit?.toLowerCase()] = caculateSumRevenueWithMonthAndUnitSP(cm_data_BCDV, mon, unit) * 100 / caculateSumRevenueWithMonthAndUnitSP(doanh_thu_data_BCDV, mon, unit);
                });
                data_for_chart_line_CMDV = [...data_for_chart_line_CMDV, rowCMDV];
            }
            const keys = Object.keys(data_for_chart_line_CMDV[0]).filter(key => key !== "month");
            const unValueC5 = keys.filter(key => data_for_chart_line_CMDV.every(obj => (obj[key] == 0 || obj[key] == -Infinity || obj[key] == Infinity || isNaN(obj[key]))));
            let uniqueGroupsDVHasValue = uniqueGroupsDV.filter(e => !unValueC5.includes(e.toLowerCase()));
            let marginDonVi = createSectionData('C1085 - Lãi lỗ theo nhóm đơn vị', data_for_chart_line_CMDV, createSeriesCMSP(uniqueGroupsDVHasValue), 'C1085 - Lãi lỗ theo nhóm đơn vị');
            await setItemInIndexedDB2(key, data_for_chart_line_CMDV);
            setOptions(marginDonVi)
        } catch (error) {
            console.log(error);
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
