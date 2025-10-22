export function caculateSumRevenueWithMonthAndUnitSP(list, month, unit) {
    let total = 0;
    for (const key in list) {
        if (key.split('_')[1] == month && key.split('_')[0] == unit) {
            total += list[key];
        }
    }
    return total;
}

export function filterAndSumData(data, startsWith, excludeLayer) {
    return sumColumns(data.filter((e) => e.dp?.startsWith(startsWith) && !e.layer?.includes(excludeLayer))) || [];
}

export function filterAndSumDataByCode(data, codes) {
    return sumColumns(data.filter((e) => codes.includes(e.code)));
}

export function filterGroup(groups) {
    return groups.map(group => !group ? 'Khác' : group);
}

export function transformDataBCKD(result, uniqueGroups, items) {
    return result.map((row) => {
        let newRow = {
            ...row
        };
        uniqueGroups.forEach((group) => {
            const groupSums = sumGroupColumns(row, group, items);
            newRow = {
                ...newRow,
                ...groupSums
            };
        });
        return newRow;
    }
    );
}

const sumGroupColumns = (row, group, units) => {
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

export function prepareChartSeries(uniqueGroups, data, interpolation) {
    return uniqueGroups.map((group) => ({
        type: 'line',
        xKey: 'month',
        yKey: group.toLowerCase(),
        yName: extractString(group),
        marker: {
            enabled: true
        },
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
        highlightStyle: {
            series: {
                dimOpacity: 0.2,
                strokeWidth: 4
            }
        },
    }));
}

export function prepareChartSeriesRatio(uniqueGroups, data, interpolation) {
    return uniqueGroups.map((group) => ({
        type: 'line',
        xKey: 'month',
        yKey: group.toLowerCase(),
        yName: extractString(group),
        marker: {
            enabled: true
        },
        tooltip: {
            renderer: (params) => {
                const value = params.datum[params.yKey];
                if (typeof value === 'number') {
                    return {
                        content: value.toFixed(1) + '%'
                    };
                }
                return {
                    content: 'N/A'
                };
            },
        },
        yAxis: {
            min: 0,
            max: 1,
            label: {
                formatter: (v) => `${v}%`
            }
        },
        interpolation,
        highlightStyle: {
            series: {
                dimOpacity: 0.2,
                strokeWidth: 4
            }
        },
    }));
}

const extractString = (str) => {
    if (str == 'thanh_tien') {
        return 'Thành tiền';
    } else if (str == 'giam_gia') {
        return 'Giảm giá';
    }
    const parts = str.split('-');
    return parts.length > 1 ? parts[1] : parts[0];
}

export function calculatePercentagesPerMonth(data) {
    return data.map(row => {
        const total = calculateTotalPerMonth(row);
        const newRow = {
            month: row.month
        };
        Object.keys(row).forEach(key => {
            if (key !== 'month') {
                newRow[key] = parseFloat(total === 0 ? 0 : ((row[key] / total) * 100).toFixed(2));
            }
        });
        return newRow;
    });
}

const calculateTotalPerMonth = (row) => {
    return Object.keys(row).reduce((total, key) => {
        if (key !== 'month') {
            total += row[key];
        }
        return total;
    }, 0);
}

export const convertToArrayForSection1CF = (data, currentMonth) => {
    let result = [];
    for (let i = 1; i <= currentMonth; i++) {
        result.push({
            month: i,
            'th': Math.abs(data[`t${i}`]),
            'ck': Math.abs(data[`t${i}_ck`]),
            'kh': Math.abs(data[`t${i}_kh`])
        });
    }
    return result;
};

export const convertToArrayForSection1 = (data, currentMonth) => {
    let result = [];
    for (let i = 1; i <= currentMonth; i++) {
        result.push({
            month: i,
            'th': data[`t${i}`],
            'ck': data[`t${i}_ck`],
            'kh': data[`t${i}_kh`]
        });
    }
    return result;
};

export const sumColumns = (data) => {
    if (!data[0]) {
        return
    }
    const result = {
        dp: data[0].dp
    };
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
