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
    prepareChartSeriesRatio
} from "../../../../KeToanQuanTri/BaoCao/KQKD/setUpSection";
// CHART FUNCTION
import { createSectionData } from "../../Logic/SetupChart";
// API
import { getAllUnits } from "../../../../../apisKTQT/unitService";
import { getAllProduct } from "../../../../../apisKTQT/productService";
import { getAllKmf } from "../../../../../apisKTQT/kmfService";
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService";
import { useParams } from "react-router-dom";
import NotAccessible from "../../../NotAccessible.jsx";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataNhomBC} from "../../../getPermissionDataNhomBC.js";
import ActionSelectGroupTypeBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectGroupTypeBaoCao.jsx";
import {transformDataBCKDMoi} from "./functionLogicChartSPMoi/logicSPChartMoi.js";

export default function ChartNhomSPLaiNhom() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas, userClasses, fetchUserClasses, uCSelected_CANVAS,  } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "NHOMSP_LAINHOM_CHART";
    const [titleName, setTitleName] = useState('');
    const [selectedTypeGroup, setSelectedTypeGroup] = useState('group');

    useEffect(() => {
        loadChart();
    }, [currentYearCanvas, currentMonthCanvas , setSelectedTypeGroup])

    const loadChart = async () => {
        try {
            if (tabSelect == 'daas') {
                currentMonthCanvas = 12;
            }
            let data = await loadDataSoKeToan();
            if (companySelect) {
                data = data.filter(item => item.company == companySelect || companySelect == 'HQ');
            }
            let uniqueKMF = await getAllKmf();
            let products = await getAllProduct();
            const user = await getCurrentUserLogin();
            products = await getPermissionDataNhomBC('product', user, userClasses, fetchUserClasses, uCSelected_CANVAS, products)

            if (products?.length == 0 || !products) {
                setTitleName(KHONG_THE_TRUY_CAP)
                products = []
            }

            let uniqueGroupsSP = filterGroup([...new Set(products.map((unit) => unit[selectedTypeGroup]))]).sort();
            uniqueKMF = uniqueKMF.reduce((acc, current) => {
                if (!acc.find((unit) => unit.name === current.name)) {
                    acc.push(current);
                }
                return acc;
            }, []);
            let result_bcsp = calculateData(data.filter(e => e.year == currentYearCanvas), products, uniqueKMF, 'code', 'product2', 'PBSP', 'teams');
            result_bcsp = transformDataBCKDMoi(result_bcsp, uniqueGroupsSP, products,selectedTypeGroup);
            let doanh_thu_data_BCSP = filterAndSumData(result_bcsp, 'Doanh thu', '.');
            let loi_nhuan_data_BCSP = filterAndSumData(result_bcsp, 'Lợi nhuận', '.');
            let data_for_chart_line_BCSP = [];
            for (let month = 1; month <= (currentMonthCanvas == 0 ? 12 : currentMonthCanvas); month++) {
                const rowBCSP = {
                    month: `T${month}`
                };
                const mon = `${month}`;
                uniqueGroupsSP.forEach((unit) => {
                    rowBCSP[unit?.toLowerCase()] = caculateSumRevenueWithMonthAndUnitSP(loi_nhuan_data_BCSP, mon, unit) * 100 / caculateSumRevenueWithMonthAndUnitSP(doanh_thu_data_BCSP, mon, unit);
                });
                data_for_chart_line_BCSP = [...data_for_chart_line_BCSP, rowBCSP];
            }
            const interpolation = {
                type: 'smooth'
            };
            const keysSP = Object.keys(data_for_chart_line_BCSP[0]).filter(key => key !== "month");
            const unValueC10 = keysSP.filter(key => data_for_chart_line_BCSP.every(obj => obj[key] == 0));
            let uniqueGroupsSPHasValue = uniqueGroupsSP.filter(e => !unValueC10.includes(e.toLowerCase()));
            const series_for_chart_line_bcsp = prepareChartSeriesRatio(uniqueGroupsSPHasValue, data_for_chart_line_BCSP, interpolation);
            let doanhThuSanPham = createSectionData('C1060 - Tỷ lệ lãi nhóm SP', data_for_chart_line_BCSP, series_for_chart_line_bcsp, 'C1060 - Tỷ lệ lãi nhóm SP');
            await setItemInIndexedDB2(key, data_for_chart_line_BCSP);
            setOptions(doanhThuSanPham)
        } catch (error) {
            console.log(error);
            message.error("Lỗi khi load chart");
        }
    }

    return (
        <div>
            <NotAccessible NotAccessible={titleName}/>
            {options && <AgCharts style={{ width: '100%', height: '90%' }} options={options} />}
            <div style={{position: "absolute", top: 30, left: 40}}>
                <ActionSelectGroupTypeBaoCao selectedTypeGroup={selectedTypeGroup}
                                             setSelectedTypeGroup={setSelectedTypeGroup}/>
            </div>
        </div>
    )
};
