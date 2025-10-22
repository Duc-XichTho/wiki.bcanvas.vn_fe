import {generateDatesByPeriod, getPMVDeploymentsByPlanId} from "../../../../apis/pmvDeploymentService.jsx";
import {getPMVDeploymentDetailByDeploymentIdService} from "../../../../apis/pmvDeploymentDetailService.jsx";
import {getAllPMVSkuAllocationByDeployDetailIdService} from "../../../../apis/pmvSkuAllocationService.jsx";
import {addProfitLoss, calculateProjections} from "./functionActual.js";

export function calculateTargetForSA(data) {
    data.forEach(item => {
        if (item.listSA && item.listSA.length > 0) {
            let totalRatio = item.listSA.reduce((sum, sa) => sum + Number(sa.ratio), 0);

            item.listSA.forEach(sa => {
                sa.target = (Number(sa.ratio) / totalRatio) * Number(item.data.target);
            });
        }
    });

    return data;
}

export function distributeTargets(depDetails) {
    depDetails.forEach(detail => {
        let totalPeriodValue = detail.periods.reduce((sum, p) => sum + p.value, 0);

        detail.listSA.forEach(sa => {
            let dailyTargets = [];
            let remainingTarget = sa.target;
            detail.periods.forEach((period, index) => {
                let dailyTarget = (period.value / totalPeriodValue) * sa.target;
                dailyTarget = Math.round(dailyTarget * 100) / 100;

                remainingTarget -= dailyTarget;

                if (index === detail.periods.length - 1) {
                    dailyTarget += remainingTarget;
                }

                dailyTargets.push({date: period.date, target: dailyTarget});
            });

            sa.dailyTargets = dailyTargets;
        });
    });
    return depDetails;
}

export function flattenTargetData(deploymentDetails) {
    let result = [];
    deploymentDetails.forEach(detail => {
        detail.listSA.forEach(sa => {
            Object.entries(sa.dailyTargets).forEach(([date, target]) => {
                result.push({
                    brand: sa.brand,
                    sku: sa.sku,
                    target: target.target,
                    date: target.date,
                    userClass: detail.userClass
                });
            });
        });
    });

    return result;
}

export function groupDepDetails(depDetails) {
    const groupedData = {};

    depDetails.forEach(({brand, sku, userClass, date, target}) => {
        const key = `${brand}-${sku}-${userClass}`;
        if (!groupedData[key]) {
            groupedData[key] = {brand, sku, userClass};
        }
        groupedData[key][date] = (groupedData[key][date] || 0) + target;
    });

    return Object.values(groupedData);
}

export const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
};

export const generateDateRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= new Date(endDate)) {
        const formattedDate = currentDate.toLocaleDateString("vi-VN");
        dates.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
};

export function hasChildren(id, data) {
    return data.some(item => item.data.parentId === id);
}


export async function functionPlan(id, selectedCard) {

    const listPMVDeployment = await getPMVDeploymentsByPlanId(id);
    let listDepDetail = []
    for (const dep of listPMVDeployment) {
        let listDepDetailById = await getPMVDeploymentDetailByDeploymentIdService(dep.id);
        for (const depDetail of listDepDetailById) {
            if (dep.config_period) depDetail.config_period = dep.config_period
            depDetail.date_from = selectedCard.date_from
            depDetail.date_to = selectedCard.date_to
            depDetail.userClass = dep.userClass
        }
        listDepDetail.push(...listDepDetailById);
    }
    for (const dep of listDepDetail) {
        let listSAById = await getAllPMVSkuAllocationByDeployDetailIdService(dep.id);
        listSAById = listSAById.filter(e => e.isUse)
        if (!hasChildren(dep.id, listDepDetail)) {
            dep.listSA = listSAById;
        }
        let chuKy = []
        if (dep.date_to && dep.date_from && dep.config_period) {
            chuKy = await generateDatesByPeriod({
                date_from: dep.date_from,
                date_to: dep.date_to, ...dep.config_period
            });
        }
        dep.periods = chuKy;
    }
    listDepDetail = listDepDetail.filter(e => e.listSA && e.listSA.length > 0);
    let rs1 = calculateTargetForSA(listDepDetail)
    let rs2 = distributeTargets(rs1)
    let rs3 = flattenTargetData(rs2)
    let rs4 = groupDepDetails(rs3)
    return rs4
}

export async function functionPlan1(id, selectedCard) {
    const listPMVDeployment = await getPMVDeploymentsByPlanId(id);
    let listDepDetail = []
    for (const dep of listPMVDeployment) {
        let listDepDetailById = await getPMVDeploymentDetailByDeploymentIdService(dep.id);
        listDepDetail.push(...listDepDetailById);
        for (const depDetail of listDepDetail) {
            if (dep.config_period) depDetail.config_period = dep.config_period
            depDetail.date_from = selectedCard.date_from
            depDetail.date_to = selectedCard.date_to
            depDetail.userClass = dep.userClass
        }
    }
    for (const dep of listDepDetail) {
        let listSAById = await getAllPMVSkuAllocationByDeployDetailIdService(dep.id);
        listSAById = listSAById.filter(e => e.isUse)
        if (!hasChildren(dep.id, listDepDetail)) {
            dep.listSA = listSAById;
        }
        let chuKy = []
        if (dep.date_to && dep.date_from && dep.config_period) {
            chuKy = await generateDatesByPeriod({
                date_from: dep.date_from,
                date_to: dep.date_to, ...dep.config_period
            });
        }
        dep.periods = chuKy;
    }
    listDepDetail = listDepDetail.filter(e => e.listSA && e.listSA.length > 0);
    let rs1 = calculateTargetForSA(listDepDetail)
    rs1.forEach(item => {
        item.periods = calculateCumulativePeriod(item.periods)
        item.periods = calculateAllocationTargets(item.periods, item.data.target);
        let toDay = item.periods.find(e => e.date == getCurrentDateFormatted());
        item.targetCumulativeToday = toDay?.targetCumulative || 0;
        item.targetCycleToday = toDay?.targetCumulative || 0;
    })
    return rs1
}

export function calculateCumulativeData(data) {
    return data.map(item => {
        let cumulativeSum = 0;
        const newItem = {...item};

        Object.keys(item).forEach(key => {
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(key)) {
                cumulativeSum += item[key];
                newItem[key] = parseFloat(cumulativeSum.toFixed(10));
            }
        });

        return newItem;
    });
}


function calculateCumulativePeriod(data) {
    const sortedData = data.slice().sort((a, b) => parseDate(a.date) - parseDate(b.date));
    let cumulative = 0;
    return sortedData.map(item => {
        cumulative = item.value;
        return {...item, cumulative};
    });
}

function calculateAllocationTargets(data, totalTarget) {
    // Tính tổng giá trị của toàn bộ các ngày
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    let runningAllocation = 0;

    return data.map(item => {
        // Tính target của ngày đó theo tỷ lệ
        const dailyAllocation = totalTarget * (item.value / totalValue);
        runningAllocation = dailyAllocation;
        return {
            ...item,
            targetCycle: dailyAllocation,
            targetCumulative: runningAllocation
        };
    });
}

export function getCurrentDateFormatted() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1); // Lưu ý: tháng trong JS là 0-indexed
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
}

export const aggregateByBrandAndSku = (data) => {
    const result = {};

    data.forEach(item => {
        const key = `${item.brand}-${item.sku}`;

        if (!result[key]) {
            result[key] = {brand: item.brand, sku: item.sku};
        }

        Object.keys(item).forEach(field => {
            if (!['brand', 'sku', 'userClass'].includes(field)) {
                result[key][field] = (result[key][field] || 0) + item[field];
            }
        });
    });

    return Object.values(result);
};

export function calculateCosts(rs6, configs) {
    const daysInMonth = {
        "01": 31, "02": 28, "03": 31, "04": 30, "05": 31, "06": 30,
        "07": 31, "08": 31, "09": 30, "10": 31, "11": 30, "12": 31
    };

    // Duyệt qua từng cấu hình chi phí cố định để tính toán trước
    configs.forEach(config => {
        if (config.type === "Số cố định") {
            Object.keys(config.data).forEach(monthYearKey => {
                let totalItems = rs6.length;
                if (totalItems > 0) {
                    let fixedCostPerItem = config.data[monthYearKey] / totalItems;
                    rs6.forEach(item => {
                        item[config.name] = item[config.name] || {};
                        let [month, year] = monthYearKey.split("/");
                        let days = daysInMonth[month] || 30;
                        let dailyCost = fixedCostPerItem / days;

                        // Áp dụng chi phí cố định chia đều cho mỗi ngày
                        Object.keys(item).forEach(date => {
                            if (date.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
                                let [day, m, y] = date.split('/');
                                if (`${m.padStart(2, '0')}/${y}` === monthYearKey) {
                                    item[config.name][date] = dailyCost;
                                }
                            }
                        });
                    });
                }
            });
        }
    });

    // Xử lý các loại chi phí khác
    rs6.forEach(item => {
        item["Doanh thu"] = {};
        Object.keys(item).forEach(date => {
            if (!date.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) return;
            item["Doanh thu"][date] = item[date];

            let [day, month, year] = date.split('/');
            let formattedMonth = month.padStart(2, '0');
            let monthYearKey = `${formattedMonth}/${year}`;

            configs.forEach(config => {
                if (config.type === "Theo tỷ lệ % doanh thu" && config.data[monthYearKey]) {
                    let percentage = config.data[monthYearKey] / 100;
                    item[config.name] = item[config.name] || {};
                    item[config.name][date] = (item[date] || 0) * percentage;
                } else if (config.type.includes("Chi tiết theo sản phẩm")) {
                    config.detailSKU.forEach(detail => {
                        if (item.brand === detail.brand && item.sku === detail.sku && detail[monthYearKey]) {
                            let value = parseFloat(detail[monthYearKey]);
                            let cost = config.type.includes("%") ? (item[date] * value / 100) : value;
                            item[config.name] = item[config.name] || {};
                            item[config.name][date] = cost;
                        }
                    });
                }
            });
        });
    });

    return rs6;
}

export function summarizeDailyTotals(rs6WithCosts, configs) {
    let summary = {};
    const daysInMonth = {
        "01": 31,
        "02": 28,
        "03": 31,
        "04": 30,
        "05": 31,
        "06": 30,
        "07": 31,
        "08": 31,
        "09": 30,
        "10": 31,
        "11": 30,
        "12": 31
    };

    // Tổng hợp dữ liệu theo ngày
    rs6WithCosts.forEach(item => {
        Object.keys(item).forEach(key => {
            if (typeof item[key] === "object") {
                Object.keys(item[key]).forEach(date => {
                    if (!summary[date]) {
                        summary[date] = {"Doanh thu": 0};
                    }

                    if (!summary[date][key]) {
                        summary[date][key] = 0;
                    }

                    summary[date][key] += item[key][date] || 0;
                });
            }
        });
    });
    //
    // // Áp dụng "Số cố định", chia đều theo ngày trong tháng
    // configs.forEach(config => {
    //     if (config.type === "Số cố định") {
    //         Object.keys(config.data).forEach(monthYearKey => {
    //             let [month, year] = monthYearKey.split('/');
    //             let days = daysInMonth[month] || 30;
    //             let dailyCost = config.data[monthYearKey] / days;
    //
    //             // Gán giá trị cho từng ngày của tháng đó
    //             for (let day = 1; day <= days; day++) {
    //                 let formattedDate = `${day}/${parseInt(month)}/${year}`;
    //                 if (!summary[formattedDate]) {
    //                     summary[formattedDate] = {};
    //                 }
    //                 summary[formattedDate][config.name] = (summary[formattedDate][config.name] || 0) + dailyCost;
    //             }
    //         });
    //     }
    // });

    return summary;
}

export function getSummaryInRange(summarizedData, currentDate, endDate) {
    // Chuyển ngày từ chuỗi "dd/mm/yyyy" thành Date object
    const parseDate = (dateStr) => {
        let [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    let current = parseDate(currentDate);
    let end = parseDate(endDate);

    // Lọc và sắp xếp danh sách ngày
    let allDates = Object.keys(summarizedData)
        .map(date => ({dateStr: date, dateObj: parseDate(date)}))
        .filter(({dateObj}) => dateObj >= current && dateObj <= end)
        .sort((a, b) => a.dateObj - b.dateObj)
        .map(({dateStr}) => dateStr);

    let lastDate = allDates.length > 0 ? allDates[allDates.length - 1] : currentDate;

    let cumulativeData = {};  // Tổng dồn trong khoảng
    let todayCumulative = {}; // Tổng dồn tính đến currentDate
    let todayData = {};       // Giá trị của currentDate

    for (let date of allDates) {
        for (let key in summarizedData[date]) {
            cumulativeData[key] = (cumulativeData[key] || 0) + summarizedData[date][key];

            if (!todayCumulative[key]) todayCumulative[key] = 0;
            if (parseDate(date) <= current) {
                todayCumulative[key] = summarizedData[date][key];
            }

            if (date === currentDate) {
                todayData[key] = todayCumulative[key];
            }
        }
    }

    return Object.keys(cumulativeData).map(name => ({
        name,
        targetToday: name === "Doanh thu" ? (summarizedData[currentDate]?.[name] || 0) : todayCumulative[name],
        target: name === "Doanh thu" ? (summarizedData[lastDate]?.[name] || 0) : cumulativeData[name]
    }));
}

export function getDailyCostsAndRevenue(rs6WithCosts, selectedDate) {
    let summary = [];

    rs6WithCosts.forEach(item => {
        let doanhThu = item["Doanh thu"]?.[selectedDate] || 0;
        let accumulatedCosts = {};
        let totalCost = 0;

        // Tính tổng chi phí
        Object.keys(item).forEach(key => {
            if (typeof item[key] === "object" && key !== "Doanh thu") {
                let cost = item[key][selectedDate] || 0;
                accumulatedCosts[key] = cost;
                totalCost += cost;
            }
        });

        // Tính lợi nhuận và % lợi nhuận
        let profit = doanhThu - totalCost;
        let profitMargin = doanhThu !== 0 ? (profit / doanhThu) * 100 : 0;

        summary.push({
            brand: item.brand,
            sku: item.sku,
            DoanhThu: doanhThu,
            ...accumulatedCosts,
            TongChiPhi: totalCost,
            LoiNhuan: profit,
            "PhanTramLoiNhuan": profitMargin.toFixed(2) + "%"
        });
    });

    return summary;
}


export function extractDateValues(array, targetDate) {
    return array.map(item => {
        let result = [];

        for (const key in item) {
            if (typeof item[key] === 'object' && item[key] !== null) {
                if (item[key][targetDate] !== undefined) {
                    result.push({name: key, value: item[key][targetDate]});
                }
            }
        }

        return result;
    });
}
