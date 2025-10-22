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
    filterAndSumDataByCode
} from "../../../../KeToanQuanTri/BaoCao/KQKD/setUpSection";
import { createSeriesCMSP } from "../../../../KeToanQuanTri/functionKTQT/chartSetUp/setUpChart";
// CHART FUNCTION
import { createSectionData } from "../../Logic/SetupChart";
// API
import { getAllProject } from "../../../../../apisKTQT/projectService";
import { getAllUnits } from "../../../../../apisKTQT/unitService";
import { getAllKmf } from "../../../../../apisKTQT/kmfService";
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService";
import { useParams } from "react-router-dom";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataNhomBC} from "../../../getPermissionDataNhomBC.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import NotAccessible from "../../../NotAccessible.jsx";

export default function ChartNhomVVLaiLo() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas, userClasses, fetchUserClasses, uCSelected_CANVAS,  } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "NHOMVV_LAILO_CHART";
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
            let result_bcdv = calculateData(data.filter(e => e.year == currentYearCanvas), units, uniqueKMF, 'code', 'project2', 'PBPROJECT', 'teams');
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
            let marginDonVi = createSectionData('C1165 - Lãi lỗ trực tiếp theo nhóm vụ việc', data_for_chart_line_CMDV, createSeriesCMSP(uniqueGroupsDV), 'C1165 - Lãi lỗ trực tiếp theo nhóm vụ việc');
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
