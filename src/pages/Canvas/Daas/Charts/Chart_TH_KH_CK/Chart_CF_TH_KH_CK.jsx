import React, { useContext, useEffect, useState } from "react";
import {message, Typography} from "antd";
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
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getPermissionDataCty} from "../../../getPermissionDataNhomBC.js";
import {CANVAS_DATA_PACK} from "../../../../../CONST.js";
import {KHONG_THE_TRUY_CAP} from "../../../../../Consts/TITLE_HEADER.js";
import ActionSelectCompanyBaoCao from "../../../../KeToanQuanTri/ActionButton/ActionSelectCompanyBaoCao.jsx";

export default function ChartCF_TH_KH_CK() {
    let { tabSelect, companySelect } = useParams();
    let { loadDataSoKeToan, currentYearCanvas, currentMonthCanvas } = useContext(MyContext);
    const [options, setOptions] = useState([]);
    const key = "CHART_CF_TH_KH_CK";
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
                let plans = await getAllPlan();
                let uniqueKMF = await getAllKmf();
                let data = await loadDataSoKeToan();
                if (companySelected.some(e => e.code != 'HQ')) {
                    data = data.filter(e => companySelected.some(c => c.code == e.company));
                }
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
                let doanhThuList = actualData.filter((item) => item.dp && item.dp.toLowerCase().includes('chi phí'));
                let doanhThuData = sumColumns(doanhThuList);
                if (doanhThuData) {
                    doanhThuData = convertToArrayForSection1(doanhThuData, currentMonthCanvas);
                }
                let thucHienSeries = createSeries('month', 'th', 'Thực hiện', 'line');
                let keHoachSeries = createSeries('month', 'kh', 'Kế hoạch', 'line');
                let cungKySeries = createSeries('month', 'ck', 'Cùng kỳ', 'line');
                let seriesArr = [thucHienSeries];
                let field0 = getField0(doanhThuData);
                if (!field0.includes('ck')) {
                    seriesArr.push(cungKySeries)
                }
                if (!field0.includes('kh')) {
                    seriesArr.push(keHoachSeries)
                }
                let doanhThuTong = createSectionData('C1010 - Chi phí thực hiện, với KH và cùng kỳ', doanhThuData, seriesArr, 'C1010 - Chi phí thực hiện, với KH và cùng kỳ')
                await setItemInIndexedDB2(key, doanhThuData);
                setOptions(doanhThuTong)
            } catch (error) {
                console.log(error);
                message.error("Lỗi khi load chart");
            }
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
            {options && <AgCharts style={{ width: '100%', height: '90%' }} options={options}/>}
            <div style={{position: "absolute", top: 30, left: 40}}>
                <ActionSelectCompanyBaoCao options={listCom} handlers={setCompanySelected}
                                           valueSelected={companySelected}/>
            </div>
        </div>
    )
};
