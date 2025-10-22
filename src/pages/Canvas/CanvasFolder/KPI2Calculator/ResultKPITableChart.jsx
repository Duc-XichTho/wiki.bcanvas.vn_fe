import styles from "./KPICalculator2.module.css";
import {AgCharts} from "ag-charts-react";
import React, {useEffect, useState} from "react";
import {getKpiCalculatorById} from "../../../../apis/kpiCalculatorService.jsx";
import {evaluate} from "mathjs";
import {createSectionData, createSeries} from "../../Daas/Logic/SetupChart.js";
import {getAllKpi2Calculator, getKpi2CalculatorById} from "../../../../apis/kpi2CalculatorService.jsx";

const ResultKPITableChart = ({idKpi}) => {

    const [selectedKpi, setSelectedKpi] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [period, setPeriod] = useState("day");
    const [options, setOptions] = useState([]);
    const [formula, setFormula] = useState("");
    const [selectedItems, setSelectedItems] = useState({
        kpiList: [],
        varList: [],
    });
    const [variables, setVariables] = useState({});
    useEffect(() => {
        const getKpi = async () => {
            if (idKpi){
                console.log(idKpi)
                let kpi = await getKpi2CalculatorById(idKpi)

                if(kpi){
                    console.log(kpi)
                    setSelectedKpi(kpi)
                }
            }
        }
        getKpi()
    }, [idKpi]);

    const convertPeriodData = (kpiData, targetPeriod) => {
        const {period: sourcePeriod, tableData} = kpiData;

        if (sourcePeriod == targetPeriod) {
            return tableData;
        }

        const periodConversions = {
            weekToDay: (data) => {
                const result = [];

                data.forEach((item) => {
                    const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
                    if (!matches) return;

                    const weekNum = parseInt(matches[1]);
                    const year = parseInt(matches[2]);

                    const firstDayOfWeek = getFirstDayOfWeek(weekNum, year);

                    const dailyValue = item.value / 7;

                    for (let i = 0; i < 7; i++) {
                        const currentDate = new Date(firstDayOfWeek);
                        currentDate.setDate(firstDayOfWeek.getDate() + i);

                        result.push({
                            date: formatDate(currentDate),
                            value: dailyValue,
                        });
                    }
                });

                return result;
            },

            monthToDay: (data) => {
                const result = [];

                data.forEach((item) => {
                    const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
                    if (!matches) return;

                    const monthNum = parseInt(matches[1]);
                    const year = parseInt(matches[2]);

                    const daysInMonth = getDaysInMonth(monthNum - 1, year);

                    const dailyValue = item.value / daysInMonth;

                    for (let i = 0; i < daysInMonth; i++) {
                        const currentDate = new Date(year, monthNum - 1, i + 1);

                        result.push({
                            date: formatDate(currentDate),
                            value: dailyValue,
                        });
                    }
                });

                return result;
            },

            monthToWeek: (data) => {
                const result = [];

                data.forEach((item) => {
                    const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
                    if (!matches) return;

                    const monthNum = parseInt(matches[1]);
                    const year = parseInt(matches[2]);

                    const weeksInMonth = 4;
                    const weeklyValue = item.value / weeksInMonth;

                    const weekNumbers = getWeeksInMonth(monthNum - 1, year);

                    weekNumbers.forEach((weekNum) => {
                        result.push({
                            date: `Tuần ${weekNum}/${year}`,
                            value: weeklyValue,
                        });
                    });
                });

                return result;
            },

            dayToWeek: (data) => {
                const weekMap = new Map();

                data.forEach((item) => {
                    const [day, month, year] = item.date.split("/").map(Number);

                    const weekNum = getWeekNumber(new Date(year, month - 1, day));
                    const weekKey = `Tuần ${weekNum}/${year}`;

                    if (weekMap.has(weekKey)) {
                        weekMap.set(weekKey, weekMap.get(weekKey) + item.value);
                    } else {
                        weekMap.set(weekKey, item.value);
                    }
                });

                return Array.from(weekMap.entries()).map(([date, value]) => ({
                    date,
                    value,
                }));
            },

            dayToMonth: (data) => {
                const monthMap = new Map();

                data.forEach((item) => {
                    const [day, month, year] = item.date.split("/").map(Number);
                    const monthKey = `Tháng ${month}/${year}`;

                    if (monthMap.has(monthKey)) {
                        monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
                    } else {
                        monthMap.set(monthKey, item.value);
                    }
                });

                return Array.from(monthMap.entries()).map(([date, value]) => ({
                    date,
                    value,
                }));
            },

            weekToMonth: (data) => {
                const monthMap = new Map();

                data.forEach((item) => {
                    const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
                    if (!matches) return;

                    const weekNum = parseInt(matches[1]);
                    const year = parseInt(matches[2]);

                    const monthNum = Math.ceil(weekNum / 4);
                    const monthKey = `Tháng ${monthNum}/${year}`;

                    if (monthMap.has(monthKey)) {
                        monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
                    } else {
                        monthMap.set(monthKey, item.value);
                    }
                });

                return Array.from(monthMap.entries()).map(([date, value]) => ({
                    date,
                    value,
                }));
            },
        };

        function formatDate(date) {
            return `${String(date.getDate()).padStart(2, "0")}/${String(
                date.getMonth() + 1
            ).padStart(2, "0")}/${date.getFullYear()}`;
        }

        function getDaysInMonth(month, year) {
            return new Date(year, month + 1, 0).getDate();
        }

        function getFirstDayOfWeek(weekNum, year) {
            const firstDayOfYear = new Date(year, 0, 1);
            const daysToAdd = (weekNum - 1) * 7;
            const firstDayOfWeek = new Date(firstDayOfYear);
            firstDayOfWeek.setDate(firstDayOfYear.getDate() + daysToAdd);
            return firstDayOfWeek;
        }

        function getWeekNumber(date) {
            const d = new Date(
                Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
            );
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
        }

        function getWeeksInMonth(month, year) {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            const firstWeek = getWeekNumber(firstDay);
            const lastWeek = getWeekNumber(lastDay);

            const weekNumbers = [];
            for (let week = firstWeek; week <= lastWeek; week++) {
                weekNumbers.push(week);
            }

            return weekNumbers;
        }

        const conversionKey = `${sourcePeriod}To${
            targetPeriod.charAt(0).toUpperCase() + targetPeriod.slice(1)
        }`;

        if (periodConversions[conversionKey]) {
            return periodConversions[conversionKey](tableData);
        } else {
            console.error(
                `Conversion from ${sourcePeriod} to ${targetPeriod} is not supported`
            );
            return tableData;
        }
    };


    const loadTable = async () => {
        const rawDataByVariable = {};
        const currentYear = new Date().getFullYear();

        for (const kpi of selectedItems.kpiList) {
            const kpiData = await getKpiCalculatorById(kpi);
            if (kpiData.period && kpiData.tableData) {
                const convertedData = convertPeriodData(kpiData, period);
                const variableKey = Object.keys(variables).find(
                    (key) => variables[key].type === "kpi" && variables[key].id === kpi
                );
                if (variableKey) rawDataByVariable[variableKey] = convertedData;
            }
        }



        const allDates = new Set();
        Object.values(rawDataByVariable).forEach((dataArray) =>
            dataArray.forEach((item) => allDates.add(item.date))
        );

        const sortedDates = Array.from(allDates).sort((a, b) => {
            if (a.startsWith("Tuần") && b.startsWith("Tuần")) {
                const [aWeek, aYear] = a.replace("Tuần ", "").split("/").map(Number);
                const [bWeek, bYear] = b.replace("Tuần ", "").split("/").map(Number);
                return aYear !== bYear ? aYear - bYear : aWeek - bWeek;
            } else if (a.startsWith("Tháng") && b.startsWith("Tháng")) {
                const [aMonth, aYear] = a.replace("Tháng ", "").split("/").map(Number);
                const [bMonth, bYear] = b.replace("Tháng ", "").split("/").map(Number);
                return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
            } else if (
                a.includes("/") &&
                b.includes("/") &&
                a.split("/").length === 3 &&
                b.split("/").length === 3
            ) {
                const [aDay, aMonth, aYear] = a.split("/").map(Number);
                const [bDay, bMonth, bYear] = b.split("/").map(Number);
                if (aYear !== bYear) return aYear - bYear;
                if (aMonth !== bMonth) return aMonth - bMonth;
                return aDay - bDay;
            }
            return a.localeCompare(b);
        });
        const result = sortedDates.map((date) => {
            const row = {date};
            Object.keys(variables).forEach((varKey) => {
                if (rawDataByVariable[varKey]) {
                    const dataPoint = rawDataByVariable[varKey].find(
                        (item) => item.date === date
                    );
                    row[varKey] = dataPoint ? dataPoint.value : 0;
                } else {
                    row[varKey] = 0;
                }
            });
            row.value = evaluate(formula, row);
            return row;
        });

        let series = [
            createSeries('date', 'value', 'Giá trị', 'line'),
            createSeries('date', 'benchmark1', selectedKpi?.benchmark1_name, 'line'),
            createSeries('date', 'benchmark2', selectedKpi?.benchmark2_name, 'line'),
        ];

        let chartData = result.map(item => ({
            date: item.date,
            value: item.value
        }));
        let benchmarks = selectedKpi.benchmark;
        chartData = chartData.map(item => {
            const date = item.date;
            console.log({
                ...item,
                benchmark1: parseInt(benchmarks[date]?.benchmark1) || NaN,
                benchmark2: parseInt(benchmarks[date]?.benchmark2) || NaN
            })
            return {
                ...item,
                benchmark1: parseInt(benchmarks[date]?.benchmark1) || NaN,
                benchmark2: parseInt(benchmarks[date]?.benchmark2) || NaN
            };
        });

        let chartOption = createSectionData('', chartData, series, '');
        setOptions(chartOption)
        console.log(result)
        setTableData(result);
        return result;
    };

    useEffect(() => {
        if (selectedKpi) {
            try {
                const kpiList = Array.isArray(selectedKpi.kpiList)
                    ? selectedKpi.kpiList
                    : [];
                const varList = Array.isArray(selectedKpi.varList)
                    ? selectedKpi.varList
                    : [];
                const newItems = {kpiList, varList};
                setSelectedItems(newItems);
                setPeriod(selectedKpi.period || "day");
                if (selectedKpi.calc) {
                    const calcData = JSON.parse(selectedKpi.calc);
                    setFormula(calcData.formula || "");
                    setVariables(calcData.variables || {});
                } else {
                    setFormula("");
                    setVariables({});
                }
            } catch (error) {
                console.error("Error handling data:", error);
                const emptyItems = {kpiList: [], varList: []};
                setSelectedItems(emptyItems);
                setPeriod("day");
                setFormula("");
                setVariables({});
            }
        } else {
            const emptyItems = {kpiList: [], varList: []};
            setSelectedItems(emptyItems);
            setPeriod("day");
            setFormula("");
            setVariables({});
        }
    }, [selectedKpi]);


    useEffect(() => {
        loadTable()
    }, [idKpi, selectedKpi]);

    return (
        <div>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Kết quả</h2>
                </div>
                <div className={styles.sectionContent}>
                    {tableData.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.resultsTable}>
                                <thead>
                                <tr>
                                    {tableData.map((item, index) => (
                                        <th key={index} className={styles.tableHeader}>
                                            {item.date}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    {tableData.map((item, index) => (
                                        <td key={index} className={styles.tableCell}>
                                            {item.value !== null && !isNaN(item.value)
                                                ? Number(item.value).toLocaleString("vn-VN", {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                    useGrouping: true,
                                                })
                                                : "-"}
                                        </td>
                                    ))}
                                </tr>
                                </tbody>
                            </table>
                            {options && <AgCharts options={options}/>}
                        </div>
                    ) : (
                        <p>No results available yet.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ResultKPITableChart