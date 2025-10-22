import {createNormalisedBarProductGroup, createSectionData, createSeries, createSeriesCMSP,} from "./setUpChart.js";
import {getAllVas} from "../../../../apisKTQT/vasService.jsx";
import {loadBCCCTC} from "../../BaoCao/CDTC/logicBCCDTC.js";
import {getChartData} from "../../../../apisKTQT/chartDataService.jsx";
import {calculateValueTotalYear} from "../../BaoCao/logic/logicActual.js";
import {getAllPlan} from "../../../../apisKTQT/planService.jsx";
import {calSupAndT0, getDataUnit, mergeDataByHeader} from "../../BaoCao/Plan2/logicPlan2.js";
import {getAllUnits} from "../../../../apisKTQT/unitService.jsx";
import {getAllKmf} from "../../../../apisKTQT/kmfService.jsx";
import {calculateDataViewKQKDFS2} from "../../BaoCao/logic/logicKQKDFS.js"
import {getReportManagement} from "../../../../apisKTQT/reportManagementService.jsx";
import {calculateData} from "../../BaoCao/KQKD/logicKQKD.js";
import {localStorageKeys} from "../localStorageSetUp.jsx";

export async function setUpSection(data, uniqueKMF, units, products, currentMonth, reportList, reloadData) {

    let plans = await getAllPlan();
    let listUnit = await getAllUnits()
    let listKMF = await getAllKmf()
    let listSoKeToan = data
    let sections = [];
    uniqueKMF = uniqueKMF.reduce((acc, current) => {
        if (!acc.find((unit) => unit.name === current.name)) {
            acc.push(current);
        }
        return acc;
    }, []);
    let uniqueGroupsSP = filterGroup([...new Set(products.map((unit) => unit.group))]).sort();
    let uniqueGroupsDV = filterGroup([...new Set(units.map((unit) => unit.group))]).sort();
    uniqueGroupsDV = uniqueGroupsDV.filter(e => e !== '15-Internal');
    let uniqueGroupsKMF = filterGroup([...new Set(uniqueKMF.map((unit) => unit.group))]).sort();
    const interpolation = {type: 'smooth'};

    let result_bkkd = localStorage.getItem(localStorageKeys.result_bkkd);
    let result_bcdv = localStorage.getItem(localStorageKeys.result_bcdv);
    let result_bcsp = localStorage.getItem(localStorageKeys.result_bcsp);
    if (!result_bcsp || !result_bcdv || !result_bcsp || reloadData) {
        result_bkkd = calculateDataViewKQKDFS2(data, uniqueKMF, currentMonth);
        result_bcdv = calculateData(data.filter(e => e.year == 2024), units, uniqueKMF, 'code', 'unit_code2', 'PBDV', 'teams');
        result_bcsp = calculateData(data.filter(e => e.year == 2024), products, uniqueKMF, 'code', 'product2', 'PBSP', 'teams');
        result_bcsp = transformDataBCKD(result_bcsp, uniqueGroupsSP, products);
        result_bcdv = transformDataBCKD(result_bcdv, uniqueGroupsDV, units);
        localStorage.setItem(localStorageKeys.result_bkkd, JSON.stringify(result_bkkd))
        localStorage.setItem(localStorageKeys.result_bcdv, JSON.stringify(result_bcdv))
        localStorage.setItem(localStorageKeys.result_bcsp, JSON.stringify(result_bcsp))
    } else {
        result_bkkd = JSON.parse(result_bkkd)
        result_bcdv = JSON.parse(result_bcdv)
        result_bcsp = JSON.parse(result_bcsp)
    }
    // dt, cp, ln don vi
    let doanh_thu_data_BCDV = localStorage.getItem(localStorageKeys.doanh_thu_data_BCDV)
    let chi_phi_data_BCDV = localStorage.getItem(localStorageKeys.chi_phi_data_BCDV)
    let gia_von_data_BCDV = localStorage.getItem(localStorageKeys.gia_von_data_BCDV)
    let cm_data_BCDV = localStorage.getItem(localStorageKeys.cm_data_BCDV)
    if (!doanh_thu_data_BCDV || !chi_phi_data_BCDV || !gia_von_data_BCDV || !cm_data_BCDV || reloadData) {
        doanh_thu_data_BCDV = filterAndSumData(result_bcdv, 'Doanh thu', '.');
        chi_phi_data_BCDV = filterAndSumData(result_bcdv, 'CF', '.');
        gia_von_data_BCDV = filterAndSumData(result_bcdv, 'Giá vốn', '.');
        cm_data_BCDV = filterAndSumDataByCode(result_bcdv, ['DT', 'GV', 'VC']);
        localStorage.setItem(localStorageKeys.doanh_thu_data_BCDV, JSON.stringify(doanh_thu_data_BCDV))
        localStorage.setItem(localStorageKeys.chi_phi_data_BCDV, JSON.stringify(chi_phi_data_BCDV))
        localStorage.setItem(localStorageKeys.gia_von_data_BCDV, JSON.stringify(gia_von_data_BCDV))
        localStorage.setItem(localStorageKeys.cm_data_BCDV, JSON.stringify(cm_data_BCDV))
    } else {
        doanh_thu_data_BCDV = JSON.parse(doanh_thu_data_BCDV)
        chi_phi_data_BCDV = JSON.parse(chi_phi_data_BCDV)
        gia_von_data_BCDV = JSON.parse(gia_von_data_BCDV)
        cm_data_BCDV = JSON.parse(cm_data_BCDV)
    }

    // dt, cp, ln sp
    let doanh_thu_data_BCSP = localStorage.getItem(localStorageKeys.doanh_thu_data_BCSP)
    let chi_phi_data_BCSP = localStorage.getItem(localStorageKeys.chi_phi_data_BCSP)
    let gia_von_data_BCSP = localStorage.getItem(localStorageKeys.gia_von_data_BCSP)
    let cm_data_BCSP = localStorage.getItem(localStorageKeys.cm_data_BCSP)
    if (!doanh_thu_data_BCSP || !chi_phi_data_BCSP || !gia_von_data_BCSP || !cm_data_BCSP || reloadData) {
        doanh_thu_data_BCSP = filterAndSumData(result_bcsp, 'Doanh thu', '.');
        chi_phi_data_BCSP = filterAndSumData(result_bcsp, 'CF', '.');
        gia_von_data_BCSP = filterAndSumData(result_bcsp, 'Giá vốn', '.');
        cm_data_BCSP = filterAndSumDataByCode(result_bcsp, ['DT', 'GV', 'VC']);
        localStorage.setItem(localStorageKeys.doanh_thu_data_BCSP, JSON.stringify(doanh_thu_data_BCSP))
        localStorage.setItem(localStorageKeys.chi_phi_data_BCSP, JSON.stringify(chi_phi_data_BCSP))
        localStorage.setItem(localStorageKeys.gia_von_data_BCSP, JSON.stringify(gia_von_data_BCSP))
        localStorage.setItem(localStorageKeys.cm_data_BCSP, JSON.stringify(cm_data_BCSP))
    } else {
        doanh_thu_data_BCSP = JSON.parse(doanh_thu_data_BCSP)
        chi_phi_data_BCSP = JSON.parse(chi_phi_data_BCSP)
        gia_von_data_BCSP = JSON.parse(gia_von_data_BCSP)
        cm_data_BCSP = JSON.parse(cm_data_BCSP)
    }

    let data_for_chart_line_BCDV = localStorage.getItem(localStorageKeys.data_for_chart_line_BCDV);
    let data_for_chart_line_LNDV = localStorage.getItem(localStorageKeys.data_for_chart_line_LNDV)
    let data_for_chart_line_CMDV = localStorage.getItem(localStorageKeys.data_for_chart_line_CMDV)
    let data_for_chart_line_LNSP = localStorage.getItem(localStorageKeys.data_for_chart_line_LNSP)
    let data_for_chart_line_CMSP = localStorage.getItem(localStorageKeys.data_for_chart_line_CMSP)
    let data_for_chart_line_BCSP = localStorage.getItem(localStorageKeys.data_for_chart_line_BCSP)
    if (!data_for_chart_line_BCDV || !data_for_chart_line_LNDV || !data_for_chart_line_CMDV
        || !data_for_chart_line_LNSP || !data_for_chart_line_CMSP || !data_for_chart_line_BCSP
        || reloadData
    ) {
        data_for_chart_line_BCDV = [];
        data_for_chart_line_LNDV = [];
        data_for_chart_line_CMDV = [];
        data_for_chart_line_LNSP = [];
        data_for_chart_line_CMSP = [];
        data_for_chart_line_BCSP = [];
        for (let month = 1; month <= currentMonth; month++) {
            const rowBCDV = {month: `T${month}`};
            const rowLNDV = {month: `T${month}`};
            const rowCMDV = {month: `T${month}`};

            const rowBCSP = {month: `T${month}`};
            const rowLNSP = {month: `T${month}`};
            const rowCMSP = {month: `T${month}`};

            const mon = `${month}`;
            uniqueGroupsDV.forEach((unit) => {
                rowBCDV[unit?.toLowerCase()] = caculateSumRevenueWithMonthAndUnitSP(doanh_thu_data_BCDV, mon, unit);
                rowLNDV[unit?.toLowerCase()] = caculateSumRevenueWithMonthAndUnitSP(doanh_thu_data_BCDV, mon, unit) + caculateSumRevenueWithMonthAndUnitSP(chi_phi_data_BCDV, mon, unit) + caculateSumRevenueWithMonthAndUnitSP(gia_von_data_BCDV, mon, unit);
                rowCMDV[unit?.toLowerCase()] = caculateSumRevenueWithMonthAndUnitSP(cm_data_BCDV, mon, unit) * 100 / caculateSumRevenueWithMonthAndUnitSP(doanh_thu_data_BCDV, mon, unit);
            });
            data_for_chart_line_BCDV = [...data_for_chart_line_BCDV, rowBCDV];
            data_for_chart_line_LNDV = [...data_for_chart_line_LNDV, rowLNDV];
            data_for_chart_line_CMDV = [...data_for_chart_line_CMDV, rowCMDV];

            uniqueGroupsSP.forEach((unit) => {
                rowBCSP[unit?.toLowerCase()] = caculateSumRevenueWithMonthAndUnitSP(doanh_thu_data_BCSP, mon, unit);
                rowLNSP[unit?.toLowerCase()] = caculateSumRevenueWithMonthAndUnitSP(doanh_thu_data_BCSP, mon, unit) + caculateSumRevenueWithMonthAndUnitSP(chi_phi_data_BCSP, mon, unit) + caculateSumRevenueWithMonthAndUnitSP(gia_von_data_BCSP, mon, unit);
                rowCMSP[unit?.toLowerCase()] = caculateSumRevenueWithMonthAndUnitSP(cm_data_BCSP, mon, unit) * 100 / caculateSumRevenueWithMonthAndUnitSP(doanh_thu_data_BCSP, mon, unit);
            });
            data_for_chart_line_BCSP = [...data_for_chart_line_BCSP, rowBCSP];
            data_for_chart_line_LNSP = [...data_for_chart_line_LNSP, rowLNSP];
            data_for_chart_line_CMSP = [...data_for_chart_line_CMSP, rowCMSP];
        }
        localStorage.setItem(localStorageKeys.data_for_chart_line_BCDV, JSON.stringify(data_for_chart_line_BCDV))
        localStorage.setItem(localStorageKeys.data_for_chart_line_LNDV, JSON.stringify(data_for_chart_line_LNDV))
        localStorage.setItem(localStorageKeys.data_for_chart_line_CMDV, JSON.stringify(data_for_chart_line_CMDV))
        localStorage.setItem(localStorageKeys.data_for_chart_line_LNSP, JSON.stringify(data_for_chart_line_LNSP))
        localStorage.setItem(localStorageKeys.data_for_chart_line_CMSP, JSON.stringify(data_for_chart_line_CMSP))
        localStorage.setItem(localStorageKeys.data_for_chart_line_BCSP, JSON.stringify(data_for_chart_line_BCSP))
    } else {
        data_for_chart_line_BCDV = JSON.parse(data_for_chart_line_BCDV)
        data_for_chart_line_LNDV = JSON.parse(data_for_chart_line_LNDV)
        data_for_chart_line_CMDV = JSON.parse(data_for_chart_line_CMDV)
        data_for_chart_line_LNSP = JSON.parse(data_for_chart_line_LNSP)
        data_for_chart_line_CMSP = JSON.parse(data_for_chart_line_CMSP)
        data_for_chart_line_BCSP = JSON.parse(data_for_chart_line_BCSP)
    }
    const keys = Object.keys(data_for_chart_line_BCDV[0]).filter(key => key !== "month");
    const unValueC5 = keys.filter(key => data_for_chart_line_BCDV.every(obj => obj[key] == 0));
    let uniqueGroupsDVHasValue = uniqueGroupsDV.filter(e => !unValueC5.includes(e.toLowerCase()));
    const keysSP = Object.keys(data_for_chart_line_BCSP[0]).filter(key => key !== "month");
    const unValueC10 = keysSP.filter(key => data_for_chart_line_BCSP.every(obj => obj[key] == 0));
    let uniqueGroupsSPHasValue = uniqueGroupsSP.filter(e => !unValueC10.includes(e.toLowerCase()));
    const series_for_chart_line_bcdv = prepareChartSeries(uniqueGroupsDVHasValue, data_for_chart_line_BCDV, interpolation);
    const series_for_chart_line_bcsp = prepareChartSeries(uniqueGroupsSPHasValue, data_for_chart_line_BCSP, interpolation);
    //data_for_chart_waterfall_cocau_chi_phi
    let data_for_chart_waterfall_cocau_chi_phi = localStorage.getItem(localStorageKeys.data_for_chart_waterfall_cocau_chi_phi);
    if (!data_for_chart_waterfall_cocau_chi_phi || reloadData) {
        const AllExpense = result_bkkd
            .filter((e) => e.code)
            .filter((e) => !(e.code == 'DT' || e.code == 'OI' || e.code == 'DTTC'));
        const AllRevenue = result_bkkd
            .filter((e) => e.code)
            .filter((e) => e.code == 'DT' || e.code == 'OI' || e.code == 'DTTC');
        let revenue = AllRevenue.map((e) => {
            return {
                khoản: e.dp, 'giá trị': e['0'],
            };
        });
        let costs = AllExpense.map((e) => {
            return {
                khoản: e.dp, 'giá trị': e['0'],
            };
        });
        const sum_revenue = revenue.reduce((prev, e) => {
            return prev + e['giá trị'];
        }, 0);
        const sum_costs = costs.reduce((prev, e) => {
            return prev + e['giá trị'];
        }, 0);
        revenue = revenue.map((e) => {
            return {...e, 'giá trị': (e['giá trị'] / sum_revenue) * 100};
        });
        costs = costs.map((e) => {
            return {...e, 'giá trị': (-e['giá trị'] / sum_costs) * 100};
        });
        let data_for_chart_waterfall_cocau_chi_phi = [...revenue, ...costs].filter((e) => e['giá trị'] !== 0);
        const object_cccp = {};
        data_for_chart_waterfall_cocau_chi_phi.forEach(item => {
            const khoan = item["khoản"];
            const giaTri = item["giá trị"];
            if (object_cccp[khoan]) {
                object_cccp[khoan] += giaTri;
            } else {
                object_cccp[khoan] = giaTri;
            }
        });
        data_for_chart_waterfall_cocau_chi_phi = Object.keys(object_cccp).map(khoan => {
            return {
                "khoản": khoan, "giá trị": object_cccp[khoan]
            };
        });
        localStorage.setItem(localStorageKeys.data_for_chart_waterfall_cocau_chi_phi, JSON.stringify(data_for_chart_waterfall_cocau_chi_phi));
    } else {
        data_for_chart_waterfall_cocau_chi_phi = JSON.parse(data_for_chart_waterfall_cocau_chi_phi);
    }
    if (typeof data_for_chart_waterfall_cocau_chi_phi === 'string') {
        data_for_chart_waterfall_cocau_chi_phi = JSON.parse(data_for_chart_waterfall_cocau_chi_phi);
    }
    //Data DT, CDTC
    let data_for_chart_stack_DT = localStorage.getItem(localStorageKeys.data_for_chart_stack_DT);
    let data_for_chart_stack_CDTC = localStorage.getItem(localStorageKeys.data_for_chart_stack_CDTC);
    let data_for_chart_stack_TT = localStorage.getItem(localStorageKeys.data_for_chart_stack_TT);
    if (!data_for_chart_stack_CDTC || !data_for_chart_stack_DT || !data_for_chart_stack_TT || reloadData) {
        await getAllVas().then((data) => {
            data = data.filter(e => e.consol?.toLowerCase() == 'consol' && e.year == 2024)
            let dataCDTC = loadBCCCTC(data, currentMonth);
            data_for_chart_stack_DT = Array.from({length: currentMonth}, (_, index) => ({
                month: `T${index + 1}`, total_11: 0, total_12: 0,
            }));
            data_for_chart_stack_CDTC = Array.from({length: currentMonth}, (_, index) => ({
                month: `T${index + 1}`, pl_TSNH: 0, pl_TSDH: 0, pl_NGH: 0, pl_NDH: 0, pl_VCSH: 0,
            }));
            const filterData = data.filter((item) => item?.ma_tai_khoan?.startsWith('11') || item?.ma_tai_khoan?.startsWith('12'));
            filterData.forEach((item) => {
                for (let i = 1; i <= currentMonth; i++) {
                    const key = `t${i}_ending_net`;
                    if (item?.ma_tai_khoan?.startsWith('11')) {
                        data_for_chart_stack_DT[i - 1].total_11 += parseFloat(item[key]) || 0;
                    } else if (item?.ma_tai_khoan?.startsWith('12')) {
                        data_for_chart_stack_DT[i - 1].total_12 += parseFloat(item[key]) || 0;
                    }
                }
            });
            dataCDTC.forEach((item) => {
                for (let i = 1; i <= currentMonth; i++) {
                    const key = `t${i}_tien`;
                    if (item.header === 'Tài sản ngắn hạn') {
                        data_for_chart_stack_CDTC[i - 1].pl_TSNH = parseFloat(item[key]) || 0;
                    } else if (item.header === 'Tài sản dài hạn') {
                        data_for_chart_stack_CDTC[i - 1].pl_TSDH = parseFloat(item[key]) || 0;
                    } else if (item.header === 'Nợ ngắn hạn') {
                        data_for_chart_stack_CDTC[i - 1].pl_NGH = parseFloat(item[key]) || 0;
                    } else if (item.header === 'Nợ dài hạn') {
                        data_for_chart_stack_CDTC[i - 1].pl_NDH = parseFloat(item[key]) || 0;
                    } else if (item.header === 'Vốn chủ sở hữu') {
                        data_for_chart_stack_CDTC[i - 1].pl_VCSH = parseFloat(item[key]) || 0;
                    }
                }
            });
        });
        data_for_chart_stack_TT = Array.from({length: currentMonth}, (_, index) => ({
            month: `T${index + 1}`, soTien: 0
        }));
        data.filter(e => e.year == 2024).map((item) => {
            for (let i = 1; i <= currentMonth; i++) {
                if (item.month == i && item.cash_value >= 0 && item.cash_value) data_for_chart_stack_TT[i - 1].soTien += parseFloat(item.cash_value);
            }
        })
        localStorage.setItem(localStorageKeys.data_for_chart_stack_DT, JSON.stringify(data_for_chart_stack_DT))
        localStorage.setItem(localStorageKeys.data_for_chart_stack_CDTC, JSON.stringify(data_for_chart_stack_CDTC))
        localStorage.setItem(localStorageKeys.data_for_chart_stack_TT, JSON.stringify(data_for_chart_stack_TT))
    } else {
        data_for_chart_stack_DT = JSON.parse(data_for_chart_stack_DT);
        data_for_chart_stack_CDTC = JSON.parse(data_for_chart_stack_CDTC);
        data_for_chart_stack_TT = JSON.parse(data_for_chart_stack_TT);
    }

    // DT, CP, LN
    let doanhThuData = localStorage.getItem(localStorageKeys.doanhThuData);
    let chiPhiData = localStorage.getItem(localStorageKeys.chiPhiData);
    let loiNhuanData = localStorage.getItem(localStorageKeys.loiNhuanData);
    if (!doanhThuData || !chiPhiData || !loiNhuanData || reloadData) {
        let planData = [];
        plans = plans.filter((item) => item.type === 'View3')
        if (!plans[0].rowData) {
        } else {
            plans.forEach((plan) => {
                plan.rowData?.forEach(data => {
                    planData = [...planData, ...calSupAndT0(data.data)]
                })
            })
        }
        planData = mergeDataByHeader(planData)
        let actualData = [];
        uniqueGroupsKMF.forEach((item) => {
            if (item) {
                let actualItem = {dp: item};
                for (let i = 1; i <= currentMonth; i++) {
                    actualItem[`t${i}`] = calculateValueTotalYear(item, uniqueKMF, data, i, 2024);
                    actualItem[`t${i}_ck`] = calculateValueTotalYear(item, uniqueKMF, data, i, 2023);
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
        let doanhThuList = actualData.filter((item) =>item.dp && item.dp.toLowerCase().includes('doanh thu'));
        let chiPhiList = actualData.filter((item) => item.dp && !item.dp.toLowerCase().includes('doanh thu'));
        doanhThuData = sumColumns(doanhThuList);
        chiPhiData = sumColumns(chiPhiList);
        loiNhuanData = {};
        if (doanhThuData && chiPhiData) {
            for (const key in doanhThuData) {
                loiNhuanData[key] = doanhThuData[key] + chiPhiData[key];
            }
            doanhThuData = convertToArrayForSection1(doanhThuData, currentMonth);
            chiPhiData = convertToArrayForSection1CF(chiPhiData, currentMonth);
            loiNhuanData = convertToArrayForSection1(loiNhuanData, currentMonth);
        }

        localStorage.setItem(localStorageKeys.doanhThuData, JSON.stringify(doanhThuData))
        localStorage.setItem(localStorageKeys.chiPhiData, JSON.stringify(chiPhiData))
        localStorage.setItem(localStorageKeys.loiNhuanData, JSON.stringify(loiNhuanData))
    } else {
        doanhThuData = JSON.parse(doanhThuData);
        chiPhiData = JSON.parse(chiPhiData);
        loiNhuanData = JSON.parse(loiNhuanData);
    }

    // Chart KH
    let dataChartKH = [];
    plans = plans.find(e => e.type === 'View3');
    plans = plans.rowData
    const uniqueGroupKH = [...new Set(listUnit
        .map(item => item.groupKH)
        .filter(groupKH => groupKH !== null)
    )];
    uniqueGroupKH.forEach(e => {
        dataChartKH.push({
            name: e,
            data: getDataUnit(listUnit, listKMF, plans, e, listSoKeToan)
        })
    })
    const series_for_chart_line_khdv = uniqueGroupKH.filter(e => e !== 'Internal').map((e, i) => {
        return {
            type: 'line', xKey: 'month', yKey: e, yName: e, marker: {
                enabled: true,
            }, tooltip: {
                renderer: (params) => {
                    return {
                        content: ` ${new Intl.NumberFormat('vi-VN', {
                            style: 'currency', currency: 'VND', maximumFractionDigits: 0,
                        }).format(params.datum[params.yKey])}`,
                    };
                },
            }, interpolation, highlightStyle: {
                series: {
                    dimOpacity: 0.2, strokeWidth: 4,
                },
            },
        };
    });
    let {
        revenueTransformed,
        expenseTransformed
    } = processRevenueAndExpense(dataChartKH?.filter(item => item.name !== 'Internal'));
    let percentageDV = calculatePercentagesPerMonth(data_for_chart_line_BCDV);
    let percentageSP = calculatePercentagesPerMonth(data_for_chart_line_BCSP);

    let thucHienSeries = createSeries('month', 'th', 'Thực hiện', 'line');
    let keHoachSeries = createSeries('month', 'kh', 'Kế hoạch', 'line');
    let cungKySeries = createSeries('month', 'ck', 'Cùng kỳ', 'line');
    let doanhThuTong = createSectionData('C1-Doanh thu tổng - TH-KH-CK', doanhThuData, [thucHienSeries, keHoachSeries, cungKySeries], 'C1-Doanh thu tổng - TH-KH-CK')
    let chiPhiTong = createSectionData('C2-Chi phí tổng - TH-KH-CK', chiPhiData, [thucHienSeries, keHoachSeries, cungKySeries], 'C2-Chi phí tổng - TH-KH-CK')
    let loiNhuanTong = createSectionData('C3-Lợi nhuận tổng - TH-KH-CK', loiNhuanData, [thucHienSeries, keHoachSeries, cungKySeries], 'C3-Lợi nhuận tổng - TH-KH-CK')
    let doanhThuTongNonCK = createSectionData('C1B-Doanh thu tổng - TH-KH', doanhThuData, [thucHienSeries, keHoachSeries], 'C1B-Doanh thu tổng - TH-KH')
    let chiPhiTongNonCK = createSectionData('C2B-Chi phí tổng - TH-KH', chiPhiData, [thucHienSeries, keHoachSeries], 'C2B-Chi phí tổng - TH-KH')
    let loiNhuanTongNonCK = createSectionData('C3B-Lợi nhuận tổng - TH-KH', loiNhuanData, [thucHienSeries, keHoachSeries], 'C3B-Lợi nhuận tổng - TH-KH')
    let doanhThuDonVi = createSectionData('C5-Doanh thu nhóm đơn vị', data_for_chart_line_BCDV, series_for_chart_line_bcdv, 'C5-Doanh thu nhóm đơn vị')
    let marginDonVi = createSectionData('C7-Lãi lỗ trực tiếp theo nhóm đơn vị', data_for_chart_line_CMDV, createSeriesCMSP(uniqueGroupsDV), 'C7-Lãi lỗ trực tiếp theo nhóm đơn vị');
    let dongGopDonVi = createSectionData('C6-Đóng góp doanh thu theo nhóm đơn vị', percentageDV, [...createNormalisedBarProductGroup(uniqueGroupsDVHasValue)], 'C6-Đóng góp doanh thu theo nhóm đơn vị');
    let doanhThuSanPham = createSectionData('C10-Doanh thu nhóm sản phẩm', data_for_chart_line_BCSP, series_for_chart_line_bcsp, 'C10-Doanh thu nhóm sản phẩm');
    let marginSanPham = createSectionData('C12-Lãi lỗ trực tiếp theo nhóm sản phẩm', data_for_chart_line_CMSP, createSeriesCMSP(uniqueGroupsSP), 'C12-Lãi lỗ trực tiếp theo nhóm sản phẩm');
    let dongGopSanPham = createSectionData('C11-Đóng góp doanh thu theo nhóm sản phẩm', percentageSP, [...createNormalisedBarProductGroup(uniqueGroupsSPHasValue)], 'C11-Đóng góp doanh thu theo nhóm sản phẩm');
    let thuTrongKy = createSectionData('C16-Tiền thu trong kỳ', data_for_chart_stack_TT, [createSeries('month', 'soTien', 'Tiền', 'bar'),], 'C16-Tiền thu trong kỳ');
    let duTien = createSectionData('C17-Số dư tiền và tương đương tiền', data_for_chart_stack_DT, [createSeries('month', 'total_11', 'Tiền và tương đương tiền', 'bar'), createSeries('month', 'total_12', 'Đầu tư ngắn hạn', 'bar'),], 'C17-Số dư tiền và tương đương tiền');
    let cdtc = createSectionData('C18- Cân đối tài chính', data_for_chart_stack_CDTC,
        [
            {
                type: 'bar', xKey: 'month', yKey: 'pl_TSNH', yName: 'Tài sản ngắn hạn', stackGroup: 'COL1',
            },
            {
                type: 'bar', xKey: 'month', yKey: 'pl_TSDH', yName: 'Tài sản dài hạn', stackGroup: 'COL1',
            }, {
            type: 'bar', xKey: 'month', yKey: 'pl_NGH', yName: 'Nợ ngắn hạn', stackGroup: 'COL2',
        }, {
            type: 'bar', xKey: 'month', yKey: 'pl_NDH', yName: 'Nợ dài hạn', stackGroup: 'COL2',
        }, {
            type: 'bar', xKey: 'month', yKey: 'pl_VCSH', yName: 'VCSH', stackGroup: 'COL2',
        },
        ], 'C18- Cân đối tài chính');
    let loiNhuanSanPham = createSectionData('C13-Lợi nhuận theo nhóm sản phẩm', data_for_chart_line_LNSP, series_for_chart_line_bcsp, 'C13-Lợi nhuận theo nhóm sản phẩm');
    let loiNhuanDonVi = createSectionData('C8-Lợi nhuận theo nhóm đơn vị', data_for_chart_line_LNDV, series_for_chart_line_bcdv, 'C8-Lợi nhuận theo nhóm đơn vị');
    let cccp = createSectionData('C20 - Cấu trúc doanh thu chi phí lũy kế', data_for_chart_waterfall_cocau_chi_phi, [{
        type: 'waterfall', xKey: 'khoản', yKey: 'giá trị', marker: {enabled: true}, tooltip: {
            renderer: (params) => {
                const {datum, xKey, yKey} = params;
                const formattedValue = datum[yKey] ? `${datum[yKey].toFixed(2)}%` : ' ';
                return {content: `${datum[xKey]}: ${formattedValue}`};
            },
        },
    },], 'C20 - Cấu trúc doanh thu chi phí lũy kế', {min: -100, max: 100}, {position: 'left'});
    let doanhThuKH = createSectionData('C1F-Dự kiến kế hoạch doanh thu các BU', revenueTransformed, series_for_chart_line_khdv, 'C1F-Dự kiến kế hoạch doanh thu các nhóm BU KH')
    let chiPhiKH = createSectionData('C2F-Dự kiến kế hoạch chi phí các BU', expenseTransformed, series_for_chart_line_khdv, 'C2F-Dự kiến kế hoạch chi phí các nhóm BU KH')
    sections = [{
        section_title: 'Tổng quan doanh thu chi phí lợi nhuận', section_data: [doanhThuTong, chiPhiTong, loiNhuanTong,],
    }, // 1
    ];
    const prepareChartData = (report) => {
        if (!report) return;
        const periods = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'];
        return periods.map(period => ({
            period: period.toUpperCase(),
            result: parseFloat(report[`result_${period}`]) || null,
            target: parseFloat(report[`target_${period}`]) || null,
            consult: parseFloat(report[`consult_${period}`]) || null,
        }));
    };

    let listChart = {
        doanhThuTong,
        chiPhiTong,
        loiNhuanTong,
        doanhThuDonVi,
        doanhThuSanPham,
        cccp,
        cdtc,
        loiNhuanSanPham,
        loiNhuanDonVi,
        duTien,
        thuTrongKy,
        marginSanPham,
        marginDonVi,
        dongGopSanPham,
        dongGopDonVi,
        doanhThuTongNonCK,
        chiPhiTongNonCK,
        loiNhuanTongNonCK,
        doanhThuKH,
        chiPhiKH
    };

    let baoCaoCharts = {};

    for (const report of reportList) {
        let chartListRP = [];
        let reportChartSeries = [];
        const selectedReport = await getReportManagement(report.id);
        const reportData = await getReportData(data, selectedReport);

        if (reportData) {
            for (let i = 1; i <= currentMonth; i++) {
                selectedReport[`result_t${i}`] = reportData[0][`t${i}`];
            }
        }

        const reportChartData = prepareChartData(selectedReport);
        if (reportChartData) {
            chartListRP = Object.keys(reportChartData[0]).filter((key) => key !== 'period');
        }

        chartListRP.forEach((item) => {
            if (!selectedReport.show_benchmark1 && item == 'target') return;
            if (!selectedReport.show_benchmark2 && item == 'consult') return;

            const name = item + '_name';
            reportChartSeries.push(createSeries('period', item, selectedReport[name] || (item.charAt(0).toUpperCase() + item.slice(1)), 'line'));
        });

        let baoCaoChartKey = `baoCaoChart_${report.id}`;

        baoCaoCharts[baoCaoChartKey] = createSectionData(selectedReport?.name, reportChartData, reportChartSeries, selectedReport?.name, {}, {
            position: 'bottom',
        });

        listChart[baoCaoChartKey] = baoCaoCharts[baoCaoChartKey];

        sections.push({section_title: selectedReport?.name, section_data: [baoCaoCharts[baoCaoChartKey]]});
    }
    return listChart

}

function sumGroupColumns(row, group, units) {
    let result = {};
    for (let i = 0; i <= 12; i++) {
        let sum = 0;
        units.forEach((unit) => {
            if (unit.group === group) {
                const columnName = `${unit.code}_${i}`;
                sum += row[columnName] || 0;
            }
        });
        result[`${group}_${i}`] = sum;
    }
    return result;
}

export function sumColumns(data) {
    if (!data[0]) {
        return
    }
    const result = {dp: data[0].dp};
    data.forEach((item) => {
        for (const key in item) {
            if (typeof item[key] === 'number') {
                if (!result[key]) {
                    result[key] = 0;
                }
                result[key] += item[key];
            }
        }
    });

    return result;
}

function filterBetweenLists(listA, listB, code) {
    return listA.filter((itemA) => listB.some((itemB) => itemA.kmf === itemB.name && itemB.code === code));
}

export async function getData(table) {
    let allData = [];
    if (table) {
        const data = await getChartData(table);
        const filteredData = data.filter((item) => item.show === true);
        filteredData.forEach((item) => {
            allData.push({
                ...item.metadata, TableId: item.id,
            });
        });
        return allData;
    }
};

const formatNumber = (value) => {
    if (value === 0 || value === '0' || isNaN(parseFloat(value))) return '-';
    let numValue
    if (typeof value != 'number' || isNaN(parseFloat(value))) {
        numValue = parseInt(value.replace(/,/g, ''));
    } else {
        numValue = parseInt(value);

    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true,
    }).format(numValue);
};

export async function getReportData(listSoKeToan, selectedReport) {
    if (!selectedReport) return;
    const reportType = selectedReport.type || 'unit_code';
    const selectedUnit = selectedReport.type_value || '';
    const selectedFilter = selectedReport.filter || 'CTL';
    const filterValue = selectedReport.filter_value && selectedReport.filter_value[0];

    const filteredSoKeToan = listSoKeToan.filter(item => {
        if (reportType !== 'all' && selectedUnit !== 'Tất cả' && item[reportType] !== selectedUnit) return false;
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'CTL') {
            const plTypeFilters = {
                'DT': ['DT'],
                'GV': ['GV'],
                'DT_DTK_DTTC': ['DT', 'DTK', 'DTTC'],
                'GV_CFBH_CFQL': ['GV', 'CFBH', 'CFQL'],
                'GV_CFBH_CFQL_CFK_TAX': ['GV', 'CFBH', 'CFQL', 'CFK', 'TAX'],
                'ALL': null
            };
            return plTypeFilters[filterValue] ? plTypeFilters[filterValue].includes(item.pl_type) : item.pl_type !== null;
        }
        return true;
    });

    const summary = {
        t1: 0,
        t2: 0,
        t3: 0,
        t4: 0,
        t5: 0,
        t6: 0,
        t7: 0,
        t8: 0,
        t9: 0,
        t10: 0,
        t11: 0,
        t12: 0,
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
        fy: 0
    };

    filteredSoKeToan.forEach(item => {
        const month = parseInt(item.month);
        const value = parseFloat(item.pl_value) || 0;
        if (month >= 1 && month <= 12) {
            summary[`t${month}`] += value;
        }
    });

    summary.q1 = summary.t1 + summary.t2 + summary.t3;
    summary.q2 = summary.t4 + summary.t5 + summary.t6;
    summary.q3 = summary.t7 + summary.t8 + summary.t9;
    summary.q4 = summary.t10 + summary.t11 + summary.t12;
    summary.fy = summary.q1 + summary.q2 + summary.q3 + summary.q4;

    const summaryRow = {name: selectedReport.type_name};
    const monthFields = Array.from({length: 12}, (_, i) => `t${i + 1}`);
    monthFields.forEach(field => {
        summaryRow[field] = formatNumber(selectedReport.report_management_lists.reduce((total, row) => total + (parseFloat(row[field]) || 0), 0));
    });

    const result = {
        result_name: selectedReport.result_name, ...Object.fromEntries(monthFields.map(field => [field, (parseInt(summary[field] || 0) === 0 || parseInt(summaryRow[field] || 0) === 0) ? 0 : (parseInt(summary[field] || 0) / parseInt(summaryRow[field] || 0))]))
    };

    const createRowData = (prefix) => ({
        name: selectedReport[`${prefix}_name`] || (prefix === 'target' ? 'Mục tiêu' : 'Cùng kỳ năm trước'), ...Object.fromEntries([...monthFields, 'q1', 'q2', 'q3', 'q4', 'y'].map(field => [field, selectedReport[`${prefix}_${field}`]]))
    });

    const targetRowData = createRowData('target');
    const consultRowData = createRowData('consult');

    return [result, targetRowData, consultRowData];
}

export const convertToArrayForSection1 = (data, currentMonth) => {
    let result = [];
    for (let i = 1; i <= currentMonth; i++) {
        result.push({
            month: i, 'th': data[`t${i}`], 'ck': data[`t${i}_ck`], 'kh': data[`t${i}_kh`]
        });
    }
    return result;
};

export const convertToArrayForSection1CF = (data, currentMonth) => {
    let result = [];
    for (let i = 1; i <= currentMonth; i++) {
        result.push({
            month: i, 'th': Math.abs(data[`t${i}`]), 'ck': Math.abs(data[`t${i}_ck`]), 'kh': Math.abs(data[`t${i}_kh`])
        });
    }
    return result;
};

export function filterGroup(groups) {
    return groups.map(group => !group ? 'Khác' : group);
}

function calculateTotalPerMonth(row) {
    return Object.keys(row).reduce((total, key) => {
        if (key !== 'month') {
            total += row[key];
        }
        return total;
    }, 0);
}

function calculatePercentagesPerMonth(data) {
    return data.map(row => {
        const total = calculateTotalPerMonth(row);
        const newRow = {month: row.month};
        Object.keys(row).forEach(key => {
            if (key !== 'month') {
                newRow[key] = parseFloat(total === 0 ? 0 : ((row[key] / total) * 100).toFixed(2));
            }
        });
        return newRow;
    });
}

function separateRevenueAndExpense(data) {
    const revenueData = [];
    const expenseData = [];

    data.forEach(item => {
        const revenueItem = {name: item.name};
        const expenseItem = {name: item.name};

        item.data.forEach(entry => {
            if (entry.header && entry.header.toLowerCase().includes("doanh thu")) {
                for (let i = 0; i <= 12; i++) {
                    const key = `t${i}`;
                    revenueItem[key] = +entry[key] || 0;
                }
            }

            if (entry.header && entry.header.toLowerCase().includes("chi phí")) {
                for (let i = 0; i <= 12; i++) {
                    const key = `t${i}`;
                    expenseItem[key] = +entry[key] || 0;
                }
            }
        });

        revenueData.push(revenueItem);
        expenseData.push(expenseItem);
    });

    return {revenueData, expenseData};
}

function transformDataChartKH(data) {
    if (!data || data.length === 0) return [];

    return Array.from({length: 12}, (_, i) => {
        const month = `T${i + 1}`;
        const result = {month};
        data.forEach(item => {
            result[item.name] = item[`t${i + 1}`] || 0;
        });
        return result;
    });
}

function processRevenueAndExpense(data) {
    const {revenueData, expenseData} = separateRevenueAndExpense(data);
    const revenueTransformed = transformDataChartKH(revenueData);
    const expenseTransformed = transformDataChartKH(expenseData);

    return {revenueTransformed, expenseTransformed};
}

function prepareChartSeries(uniqueGroups, data, interpolation) {
    return uniqueGroups.map((group) => ({
        type: 'line',
        xKey: 'month',
        yKey: group.toLowerCase(),
        yName: extractString(group),
        marker: {enabled: true},
        tooltip: {
            renderer: (params) => ({
                content: ` ${new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 0,
                }).format(params.datum[params.yKey])}`,
            }),
        },
        interpolation,
        highlightStyle: {series: {dimOpacity: 0.2, strokeWidth: 4}},
    }));
};


function filterAndSumData(data, startsWith, excludeLayer) {
    return sumColumns(data.filter((e) => e.dp?.startsWith(startsWith) && !e.layer?.includes(excludeLayer))) || [];
}

function filterAndSumDataByCode(data, codes) {
    return sumColumns(data.filter((e) => codes.includes(e.code)));
};

function transformDataBCKD(result, uniqueGroups, items) {
    return result.map((row) => {
        let newRow = {...row};
        uniqueGroups.forEach((group) => {
            const groupSums = sumGroupColumns(row, group, items);
            newRow = {...newRow, ...groupSums};
        });
        return newRow;
    });
}

function caculateSumRevenueWithMonthAndUnitSP (list, month, unit) {
    let total = 0;
    for (const key in list) {
        if (key.split('_')[1] == month && key.split('_')[0] == unit) {
            total += list[key];
        }
    }
    return total;
}

function extractString(str) {
    const parts = str.split('-');
    return parts.length > 1 ? parts[1] : parts[0];
}
