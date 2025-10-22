import React, { useContext, useEffect, useState } from "react";
import { message } from "antd";
import { MyContext } from "../../../../../MyContext";
import { AgCharts } from "ag-charts-react";
import { useParams } from "react-router-dom";
// CHART FUNCTION
import { createSectionData, createSeries } from "../../Logic/SetupChart";
import { prepareChartSeries } from "../../../../KeToanQuanTri/BaoCao/KQKD/setUpSection";
// API
import { getAllUnits } from "../../../../../apisKTQT/unitService";
import { getAllKmf } from "../../../../../apisKTQT/kmfService";
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService";
import { getAllDataCRM } from "../../../../../apis/dataCRMService";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../../getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import ActionSelectCompanyBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";

export default function ChartMatrixThongKe() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "CHART_MATRIX_THONGKE";

    const table = key+ "_COMPANY";
    const getLocalStorageSettings = () => {
        const storedSettings = JSON.parse(localStorage.getItem(table));
        return {
            companySelected: storedSettings?.companySelected ?? [],
        };
    };

    const [titleName, setTitleName] = useState('');
    const [listCom, setListCom] = useState([])
    const [companySelected, setCompanySelected] = useState(getLocalStorageSettings().companySelected || [])
    const {
        userClasses,
        fetchUserClasses,
        uCSelected_CANVAS,
    } = useContext(MyContext) || {};

    const fetchAndSetTitleName = async () => {
        try {
            const user = await getCurrentUserLogin();
            const listComs = await getPermissionDataCty('cty', user, userClasses, fetchUserClasses, uCSelected_CANVAS)
            if (listComs?.length > 0 || user.data.isAdmin || listComs.some(e => e.code == 'HQ')) {
                setListCom(listComs);
                setTitleName(CANVAS_DATA_PACK.find(e => e.value == key)?.name)
            } else {
                setTitleName(KHONG_THE_TRUY_CAP)
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        }
    };

    useEffect(() => {
        fetchAndSetTitleName();
    }, [])

    useEffect(() => {
        loadChart();
        const tableSettings = {
            companySelected: companySelected
        }
        localStorage.setItem(table, JSON.stringify(tableSettings));
    }, [currentYearCanvas, currentMonthCanvas, companySelected])

    const loadChart = async () => {
        if (companySelected && companySelected.length > 0) {
        try {
            if (tabSelect == 'daas') {
                currentMonthCanvas = 12;
            }
            let crmData = await getAllDataCRM()
            if (companySelected.some(e => e.code != 'HQ')) {
                crmData = crmData.filter(e => companySelected.some(c => c.code == e.company));
            }
            // FILTER CRM DATA THEO YEAR
            let chartData = []
            crmData.forEach(data => {
                if (!data.thanh_tien || !data.ten_san_pham) {
                    return;
                }
                const weekData = chartData.find(item => item.week == data.week && item.ten_san_pham == data.ten_san_pham);
                if (weekData) {
                    weekData.thanh_tien += parseInt(data.thanh_tien);
                } else {
                    const newWeekData = {
                        week: data.week,
                        thanh_tien: parseInt(data.thanh_tien),
                        ten_san_pham: data.ten_san_pham
                    }
                    chartData.push(newWeekData);
                }
            });
            chartData.sort((a, b) => {
                const numA = parseInt(a.week.replace("W", ""), 10);
                const numB = parseInt(b.week.replace("W", ""), 10);
                return numA - numB;
            });

            const chart = {
                data: chartData,
                title: {
                    text: "C1805 - Ma trận sản phẩm và doanh số",
                },
                series: [
                    {
                        type: "heatmap",
                        xKey: "week",
                        xName: "Tuần",
                        yKey: "ten_san_pham",
                        yName: "Tên Sản phẩm",
                        colorKey: "thanh_tien",
                        colorName: "Tổng giá bán trong tuần",
                        colorRange: ["#D7E8D4", "#A8DDB5", "#52C180"],
                    },
                ],
                gradientLegend: {
                    position: "right",
                    gradient: {
                        thickness: 30,
                        preferredLength: 400,
                    },
                },
            };
            await setItemInIndexedDB2(key, chartData);
            setOptions(chart)
        } catch (error) {
            console.log(error)
            message.error("Lỗi khi load chart");
        }
        }
    }

    return (
        <div style={{height: '90%'}}>
            {options && <AgCharts style={{ width: '100%', height: '90%' }} options={options}/>}
            <div style={{position: "absolute", top: 30, left: 40}}>
                <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                           valueSelected={companySelected}/>
            </div>
        </div>
    )
};
