import React, { useEffect, useContext, useState } from "react";
import css from '../chart.module.css';
import {message, Typography} from "antd";
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
import { calculateDataViewKQKDFS2 } from "../../../../KeToanQuanTri/BaoCao/logic/logicKQKDFS";
// CHART FUNCTION
import { createSectionData, createNormalisedBarProductGroup } from "../../Logic/SetupChart";
// API
import { getAllProduct } from "../../../../../apisKTQT/productService";
import { getAllKmf } from "../../../../../apisKTQT/kmfService";
import { setItemInIndexedDB2 } from "../../../../KeToanQuanTri/storage/storageService";
import { useParams } from "react-router-dom";
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../../getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import ActionSelectCompanyBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";

export default function ChartChiPhiLuyKe() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "CHIPHILUYKE_CHART";
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

    useEffect(()=> {
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
                let data = await loadDataSoKeToan();
                if (companySelected.some(e => e.code != 'HQ')) {
                    data = data.filter(e => companySelected.some(c => c.code == e.company));
                }
                let uniqueKMF = await getAllKmf();
                uniqueKMF = uniqueKMF.reduce((acc, current) => {
                    if (!acc.find((unit) => unit.name === current.name)) {
                        acc.push(current);
                    }
                    return acc;
                }, []);
                let result_bkkd = calculateDataViewKQKDFS2(data, uniqueKMF, (currentMonthCanvas == 0 ? 12 : currentMonthCanvas));
                const AllExpense = result_bkkd
                    .filter((e) => e.code)
                    .filter((e) => !(e.code == 'DT' || e.code == 'OI' || e.code == 'DTTC'));
                const AllRevenue = result_bkkd
                    .filter((e) => e.code)
                    .filter((e) => e.code == 'DT' || e.code == 'OI' || e.code == 'DTTC');
                let revenue = AllRevenue.map((e) => {
                    return {
                        khoản: e.dp,
                        'giá trị': e['0'],
                    };
                });
                let costs = AllExpense.map((e) => {
                    return {
                        khoản: e.dp,
                        'giá trị': e['0'],
                    };
                });
                const sum_revenue = revenue.reduce((prev, e) => {
                    return prev + e['giá trị'];
                }, 0);
                const sum_costs = costs.reduce((prev, e) => {
                    return prev + e['giá trị'];
                }, 0);
                revenue = revenue.map((e) => {
                    return {
                        ...e,
                        'giá trị': (e['giá trị'] / sum_revenue) * 100
                    };
                });
                costs = costs.map((e) => {
                    return {
                        ...e,
                        'giá trị': (-e['giá trị'] / sum_costs) * 100
                    };
                });
                let data_for_chart_waterfall_cocau_chi_phi = [...revenue, ...costs].filter((e) => e['giá trị'] !== 0);
                let cccp = createSectionData('C1185 - Cấu trúc doanh thu chi phí', data_for_chart_waterfall_cocau_chi_phi, [{
                    type: 'waterfall',
                    xKey: 'khoản',
                    yKey: 'giá trị',
                    marker: {
                        enabled: true
                    },
                    tooltip: {
                        renderer: (params) => {
                            const {
                                datum,
                                xKey,
                                yKey
                            } = params;
                            const formattedValue = datum[yKey] ? `${datum[yKey].toFixed(2)}%` : ' ';
                            return {
                                content: `${datum[xKey]}: ${formattedValue}`
                            };
                        },
                    },
                },], 'C1185 - Cấu trúc doanh thu chi phí', {
                    min: -100,
                    max: 100
                }, {
                    position: 'left'
                });
                await setItemInIndexedDB2(key, data_for_chart_waterfall_cocau_chi_phi);
                setOptions(cccp)
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
