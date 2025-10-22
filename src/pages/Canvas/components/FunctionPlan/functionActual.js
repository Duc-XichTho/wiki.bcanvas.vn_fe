import {createSeries} from "../../Daas/Logic/SetupChart.js";
import {getSummaryInRange, parseDate} from "./functionPlan.js";
import {SuggestedRecent as item} from "emoji-picker-react/src/config/categoryConfig.js";
import {LIST_NHOM_NGANH} from "../../../../Consts/LIST_NHOM_NGANH.js";

export function distributeSales(data, dateFrom, dateTo) {
    const result = {};

    const parseDate = (str) => {
        const [day, month, year] = str.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (date) => {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const startDate = parseDate(dateFrom);
    const endDate = parseDate(dateTo);

    // Tạo danh sách các ngày trong khoảng thời gian
    const allDates = {};
    let tempDate = new Date(startDate);
    while (tempDate <= endDate) {
        allDates[formatDate(tempDate)] = 0;
        tempDate.setDate(tempDate.getDate() + 1);
    }

    // Gộp dữ liệu theo {brand, sku, thời gian}
    const aggregatedData = {};
    data.forEach(({Brand, SKU, "Tiền thu": revenue, "Thời gian": time}) => {
        const key = `${Brand}_${SKU}_${time}`;
        if (!aggregatedData[key]) {
            aggregatedData[key] = {Brand, SKU, "Tiền thu": 0, "Thời gian": time};
        }
        aggregatedData[key]["Tiền thu"] += revenue;
    });

    // Chuyển đổi dữ liệu đã gộp thành mảng
    const mergedData = Object.values(aggregatedData);

    mergedData.forEach(({Brand, SKU, "Tiền thu": revenue, "Thời gian": time}) => {
        const saleDate = parseDate(time);

        if (saleDate >= startDate && saleDate <= endDate) {
            const key = `${Brand}_${SKU}`;
            if (!result[key]) {
                result[key] = {brand: Brand, sku: SKU, ...allDates};
            }

            const dateKey = formatDate(saleDate);
            result[key][dateKey] += revenue;
        }
    });

    // Tính toán lũy kế theo ngày
    Object.values(result).forEach((entry) => {
        let cumulativeSum = 0;
        Object.keys(allDates).forEach((dateKey) => {
            cumulativeSum += entry[dateKey];
            entry[dateKey] = cumulativeSum;
        });
    });

    return Object.values(result);
}

export function convertDataActual(inputData) {
    const groupedData = {};

    inputData.forEach(item => {
        const key = `${item.Brand}-${item.SKU}-${item['Thời gian_display']}`;

        if (!groupedData[key]) {
            groupedData[key] = {
                Brand: item.Brand,
                SKU: item.SKU,
                "Tiền thu": 0,
                "Thời gian": item['Thời gian_display']
            };
        }

        groupedData[key]["Tiền thu"] += item["Tiền thu"] || 0;
    });

    return Object.values(groupedData);
}


export function convertDataActualField(inputData, field, level) {
    const groupedData = {};

    inputData.forEach(item => {
        const key = `${item.Brand}-${item.SKU}-${item['Thời gian_display']}`;

        if (!groupedData[key]) {
            groupedData[key] = {
                Brand: item.Brand,
                SKU: item.SKU,
                "Tiền thu": 0,
                "Thời gian": item['Thời gian_display'],
                [field]: item[field],
                group_value: item[field],
                level
            };
        }

        groupedData[key]["Tiền thu"] += item["Tiền thu"] || 0;
    });

    return Object.values(groupedData);
}


export function getFilteredData(dataActual, dataTarget) {
    // Lấy result từ dataTarget (chỉ lấy brand và sku)
    const result = dataTarget.map(item => ({brand: item.brand, sku: item.sku}));

    // Tạo Set để tra cứu nhanh
    const resultSet = new Set(result.map(item => `${item.brand}-${item.sku}`));

    // Lọc dataActual
    return dataActual.filter(item => resultSet.has(`${item.Brand}-${item.SKU}`));
}

export function calculateProjections(data) {
    return data.map(item => {
        const difference = item.actual - item.targetToday;
        let projectedFullTerm = (difference * item.target) / item.targetToday;
        if (Math.abs(difference) < 1) {
            projectedFullTerm = item.target
        }
        let projectedDifferenceFullTerm = projectedFullTerm - item.target;

        return {
            ...item,
            difference,
            projectedFullTerm,
            projectedDifferenceFullTerm
        };
    });
}

export function addProfitLoss(data) {
    const revenue = data.find(item => item.name === "Doanh thu");

    if (!revenue) {
        console.error("Không tìm thấy mục 'Doanh thu'");
        return data;
    }

    const profitLoss = {
        name: "Lãi lỗ",
        targetToday: revenue.targetToday - data.filter(i => i.name !== "Doanh thu").reduce((sum, item) => sum + item.targetToday, 0),
        target: revenue.target - data.filter(i => i.name !== "Doanh thu").reduce((sum, item) => sum + item.target, 0),
        actual: revenue.actual - data.filter(i => i.name !== "Doanh thu").reduce((sum, item) => sum + item.actual, 0),
    };

    profitLoss.difference = profitLoss.actual - profitLoss.targetToday;
    profitLoss.projectedFullTerm = (profitLoss.difference * profitLoss.target) / profitLoss.targetToday;
    profitLoss.projectedDifferenceFullTerm = profitLoss.projectedFullTerm - profitLoss.target;

    return [...data, profitLoss];
}

export function prepareChart() {
    let actual = createSeries('date', 'actual', 'Thực hiện', 'line', false, false);
    let projectedFullTerm = createSeries('date', 'projectedFullTerm', 'Dự phóng thực hiện cả kì', 'line', false, false, true);
    let target = createSeries('date', 'target', 'Kế hoạch', 'line', false, false);
    // return [actual, target]
    return [target, actual, projectedFullTerm]
}

export function getSummaryForDateRange(rs8, rs8Actual, date_from, date_to, name) {
    let dateRange = getDateRange(date_from, date_to);
    return dateRange.map(date => {
        let rowData = getSummaryInRange(rs8, date, date);
        let rowDataActual = getSummaryInRange(rs8Actual, date, date);

        let updatedRowData = rowData.map(item => {
            const actualItem = rowDataActual.find(a => a.name === item.name);
            return actualItem ? {...item, actual: actualItem.targetToday} : item;
        });

        updatedRowData = calculateProjections(updatedRowData);
        updatedRowData = addProfitLoss(updatedRowData);
        let data = updatedRowData.find(a => a.name === name);
        return {
            date,
            actual: data?.actual || 0,
            projectedFullTerm: data?.projectedFullTerm || 0,
            target: data?.target || 0,
        };
    });
}

export function getDateRange(startDate, endDate) {
    let dates = [];
    let currentDate = parseDate(startDate);
    let stopDate = parseDate(endDate);

    while (currentDate <= stopDate) {
        let formattedDate = `${String(currentDate.getDate())}/${String(currentDate.getMonth() + 1)}/${currentDate.getFullYear()}`;
        dates.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

export function processData(data, currentDateStr) {
    const today = new Date();
    const currentDate = new Date(currentDateStr.split('/').reverse().join('-'));
    const currentEntry = data.find(d => d.date == currentDateStr);
    if (!currentEntry) return data;

    const actualCurrent = currentEntry.actual;
    const targetCurrent = currentEntry.target || 1;
    return data.map(entry => {
        const entryDate = new Date(entry.date.split('/').reverse().join('-'));
        const updatedActual = entryDate > today ? null : entry.actual;
        return {
            ...entry,
            actual: updatedActual,
            projectedFullTerm: entryDate <= currentDate
                ? (updatedActual)
                : ((actualCurrent) * (entry.target)) / targetCurrent
        };
    });
}

export function getHeaderName(pmvSettingKH, categoryType, selectedGroup) {
    try {
        let dm = LIST_NHOM_NGANH.find(e => e.value == categoryType)
        const category = pmvSettingKH.find(cat => cat.name == dm.name);
        if (!category) return selectedGroup;
        const group = category.data.find(g => g.field == selectedGroup);
        return group ? group.headerName : selectedGroup;

    } catch (e) {
        return selectedGroup;
    }
}


