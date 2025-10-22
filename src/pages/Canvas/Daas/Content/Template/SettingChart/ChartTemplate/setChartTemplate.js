import {formatCurrency} from "../../../../../../../generalFunction/format.js";
import {createNormalisedBar} from "../../../../Logic/SetupChart.js";
import { getSettingByType } from '../../../../../../../apis/settingService';
let defaultColors = [{"id": 1, "color": "#FF0000"}, {"id": 2, "color": "#914343"}, {"id": 3, "color": "#5C5858"}, {"id": 4, "color": "#4255B3"}, {"id": 5, "color": "#000DFC"}, {"id": 6, "color": "#DCA0A0"}, {"id": 7, "color": "#FF006A"}, {"id": 8, "color": "#FFFB00"}]
export function transformData(rows, selectedItem) {
    let xKey = selectedItem.v1;
    let yKey = selectedItem.v3;
    let groupKey = selectedItem.v2;

    let processedRows = rows.map(row => ({
        ...row,
        [yKey]: row[yKey] !== null ? +row[yKey] : 0
    }));
    let uniqueGroups = [...new Set(processedRows.map(row => row[groupKey]))];
    let groupedData = {};

    processedRows.forEach(row => {
        let xValue = row[xKey];
        if (row[groupKey]) {
            let groupValue = row[groupKey].toLowerCase();
            let yValue = row[yKey];
            if (!groupedData[xValue]) {
                groupedData[xValue] = { [xKey]: xValue };
                uniqueGroups.forEach(g => {
                    if (g) groupedData[xValue][g.toLowerCase()] = 0;
                });
            }
            groupedData[xValue][groupValue] += yValue;
        }
    });
    return Object.values(groupedData);
}

export async function fetchDataColor() {
    try {
        const data = await getSettingByType('SettingColor');
        if (data?.setting?.length > 0) {
            const colors = data.setting.map(item => item.color);
            return colors;
        } else {
            console.warn('No data found, using default colors.');
            const defaultColorsList = defaultColors.map(item => item.color);
            return defaultColorsList;
        }
    } catch (error) {
        console.error('Error fetching SettingColor:', error);
        const defaultColorsList = defaultColors.map(item => item.color);
        return defaultColorsList;
    }
}

export function getUniqueValues(data, field) {
    return [...new Set(data.map(item => item[field]))];
}


export function prepareChartSeriesTemp(uniqueGroups, data, interpolation, xKey) {
    uniqueGroups = uniqueGroups.filter(e => e)
    return uniqueGroups.map((group) => ({
        type: 'line',
        xKey: xKey,
        yKey: group.toLowerCase(),
        yName: group,
        marker: {
            enabled: true
        },
        tooltip: {
            renderer: (params) => ({
                content: ` ${formatCurrency(params.datum[params.yKey])}`,
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

export function transformDataForHeatmap(rows, selectedItem) {
    let xKey = selectedItem.v1; // Trục X (ví dụ: "Tháng")
    let groupKey = selectedItem.v2; // Nhóm dữ liệu (ví dụ: "Loại sản phẩm")

    let transformedData = [];

    rows.forEach(row => {
        let xValue = row[xKey]; // Giá trị theo trục X (ví dụ: tháng)
        Object.keys(row).forEach(key => {
            if (key !== xKey && key !== groupKey) {
                transformedData.push({
                    xKey: xValue,  // Trục X (ví dụ: Tháng)
                    yKey: key,      // Trục Y (tên sản phẩm)
                    value: row[key] !== null ? +row[key] : 0 // Giá trị
                });
            }
        });
    });

    return transformedData;
}

export function createHeatMapSeries(xKey, yKey) {
    return {
        type: "heatmap",
        xKey: "xKey",
        xName: xKey,
        yKey: "yKey",
        yName: yKey,
        colorKey: "value",
        colorName: "Giá trị",
        colorRange: ["#D7E8D4", "#A8DDB5", "#52C180"],

        tooltip: {
            renderer: ({ datum }) => {
                return {
                    title: `${xKey} - ${yKey}`,
                    content: `Giá trị: ${formatCurrency(datum.value.toFixed(2))}`
                };
            }
        },
    }
}

export function createHeatMap(title, data, series) {
    return {
        data: data,
        title: {
            text: "",
        },
        series: series,
        gradientLegend: {
            position: "right",
            gradient: {
                thickness: 30,
                preferredLength: 400,
            },
        },
    };
}
export function transformDataForBarChart(rows, selectedItem) {
    let xKey = selectedItem.v1;  // Trục X (ví dụ: "Tháng")
    let yKey = selectedItem.v3;  // Giá trị Y (ví dụ: "Tổng giá trị")
    let groupKey = selectedItem.v2;  // Nhóm theo (ví dụ: "Sản phẩm")

    let processedRows = rows.map(row => ({
        ...row,
        [`${yKey}b`]: row[yKey] !== null ? +row[yKey] : 0
    }));

    let uniqueGroups = [...new Set(processedRows.map(row => row[groupKey]))];

    let groupedData = {};
    let totalPerXKey = {};

    processedRows.forEach(row => {
        let xValue = row[xKey];
        if (row[groupKey]) {
            let groupValue = row[groupKey].toLowerCase();
            let yValue = row[`${yKey}b`];

            if (!groupedData[xValue]) {
                groupedData[xValue] = { [xKey]: xValue };
                totalPerXKey[xValue] = 0;

                uniqueGroups.forEach(g => {
                    if (g) {
                        let key = `${g.toLowerCase()}b`;
                        groupedData[xValue][key] = 0;
                    }
                });
            }

            groupedData[xValue][`${groupValue}b`] += yValue;
            totalPerXKey[xValue] += yValue;
        }
    });

    // Tính phần trăm từng nhóm
    Object.entries(groupedData).forEach(([xVal, row]) => {
        const total = totalPerXKey[xVal] || 0;
        if (total > 0) {
            uniqueGroups.forEach(g => {
                if (g) {
                    const key = `${g.toLowerCase()}b`;
                    const percentKey = `${key}_percent`;
                    const value = row[key] || 0;
                    row[percentKey] = +(value / total * 100).toFixed(2);
                }
            });
        }
    });

    return Object.values(groupedData);
}

export function createNormalisedBarTemp(listGroup, xKey, fills = []) {
    let rs = [];
    listGroup = listGroup.filter(e => e);
    listGroup.sort();

    listGroup.forEach((e, index) => {
        const yKey = e?.toLowerCase() + 'b_percent';
        const fill = fills[index % fills.length] || '#00FF00'; // fallback màu mặc định
        rs.push(createNormalisedBar(xKey, yKey, e, fill));
    });

    return rs;
}


export function transformDataForPieChart(rows, selectedItem) {
    let categoryKey = selectedItem.v2;  // Nhóm (ví dụ: "Sản phẩm")
    let valueKey = selectedItem.v3;     // Giá trị (ví dụ: "Tổng số lượng")

    let aggregatedData = {};

    // Gom nhóm dữ liệu theo categoryKey
    rows.forEach(row => {
        let category = row[categoryKey];
        let value = row[valueKey] !== null ? +row[valueKey] : 0;

        if (!aggregatedData[category]) {
            aggregatedData[category] = { name: category, value: 0 };
        }
        aggregatedData[category].value += value;
    });

    const result = Object.values(aggregatedData);

    // Tính tổng để tính phần trăm
    const total = result.reduce((sum, item) => sum + item.value, 0);

    // Thêm phần trăm vào từng phần tử
    result.forEach(item => {
        item.percent = total > 0 ? +(item.value / total * 100).toFixed(1) : 0;
    });
    return result;
}

export function prepareChartSeriesForPieChart(fills = []) {
    return [
        {
            type: 'pie',
            labelKey: 'name',   // Tên nhóm (ví dụ: Sản phẩm A, B, C)
            angleKey: 'percent',  // Giá trị tương ứng (ví dụ: Tổng số lượng)
            fills: fills, // Use fetched colors
            tooltip: {
                renderer: (params) => ({
                    content: `${params.datum.name}: ${formatCurrency(params.datum.value)} (${params.datum.percent}%)`,
                }),
            },
            highlightStyle: {
                item: {
                    fillOpacity: 0.8,
                    strokeWidth: 0.5
                }
            },
            calloutLabelKey: 'name',  // Hiển thị nhãn bên ngoài
            sectorLabelKey: 'percent',  // Hiển thị giá trị bên trong Pie Chart
            sectorLabel: {
                formatter: ({ datum }) => `${datum.percent}%`,  // Hiển thị phần trăm với dấu %
            },
        }
    ];
}
export function filterRows(rows, conditions) {
    return rows.filter(row => {
        let result = null;

        for (let i = 0; i < conditions.length; i++) {
            const { field, value, operator, logic } = conditions[i];
            const rowValue = row[field];
            const conditionValue = isNaN(value) ? value : Number(value);

            let conditionResult = false;

            if (typeof rowValue === "string" || typeof conditionValue === "string") {
                switch (operator) {
                    case '>': conditionResult = rowValue > conditionValue; break;
                    case '<': conditionResult = rowValue < conditionValue; break;
                    case '>=': conditionResult = rowValue >= conditionValue; break;
                    case '<=': conditionResult = rowValue <= conditionValue; break;
                    case '=': conditionResult = rowValue == conditionValue; break;
                    case '!=': conditionResult = rowValue != conditionValue; break;
                }
            } else {
                switch (operator) {
                    case '>': conditionResult = rowValue > conditionValue; break;
                    case '<': conditionResult = rowValue < conditionValue; break;
                    case '>=': conditionResult = rowValue >= conditionValue; break;
                    case '<=': conditionResult = rowValue <= conditionValue; break;
                    case '=': conditionResult = rowValue == conditionValue; break;
                    case '!=': conditionResult = rowValue != conditionValue; break;
                }
            }

            if (i === 0) {
                result = conditionResult;
            } else {
                if (conditions[i].logic === 'AND') {
                    result = result && conditionResult;
                } else if (conditions[i].logic === 'OR') {
                    result = result || conditionResult;
                }
            }
        }

        return result;
    });
}


export function createNorBarSeries(listGroup, xKey) {
    return listGroup.map(group => ({
        type: "bar",
        xKey,
        yKey: group.toLowerCase()+'b',
        yName: group,
        stacked: true,
        tooltip: {
            renderer: (params) => ({
                content: `${params.datum[params.yKey]}`,
            }),
        },
        stroke: '#fff',
        strokeWidth: 0.3,
    }));
}
export function createBarSeries(listGroup, xKey) {
    listGroup = listGroup.filter(e => e)
    return listGroup.map(group => ({
        type: "bar",
        xKey,
        yKey: group.toLowerCase()+'b',
        yName: group,
        stacked: false, // Không sử dụng stacked
        tooltip: {
            renderer: (params) => ({
                content: `${params.datum[params.yKey]}`,
            }),
        },
        stroke: '#fff',
        strokeWidth: 0.3,
    }));
}

export function createBarSeriesHorizontal(listGroup, xKey) {
    return listGroup.map(group => ({
        type: "bar",
        direction: "horizontal",
        xKey,
        yKey: group.toLowerCase()+'b',
        yName: group,
        stacked: false, // Không sử dụng stacked
        tooltip: {
            renderer: (params) => ({
                content: `${params.datum[params.yKey]}`,
            }),
        },
        stroke: '#fff',
        strokeWidth: 0.3,
    }));
}

export function createLineSeries(keys, xKey) {
    return keys.map(key => ({
        type: "line",
        xKey,
        yKey: key.toLowerCase(),
        yName: key,
        marker: { enabled: true },
        tooltip: {
            renderer: (params) => ({
                content: `${params.datum[params.yKey]}`,
            }),
        },
        strokeWidth: 2,
    }));
}

export function transformDataForLineChart2(rows, selectedItem) {
    let xKey = selectedItem.v1;
    let yKey = selectedItem.v5;
    let groupKey = selectedItem.v4;
    let processedRows = rows.map(row => ({
        ...row,
        [yKey]: row[yKey] !== null ? +row[yKey] : 0
    }));
    let uniqueGroups = [...new Set(processedRows.map(row => row[groupKey]))];
    let groupedData = {};
    processedRows.forEach(row => {
        let xValue = row[xKey];
        if (row[groupKey]) {
            let groupValue = row[groupKey].toLowerCase();
            let yValue = row[yKey];
            if (!groupedData[xValue]) {
                groupedData[xValue] = { [xKey]: xValue };
                uniqueGroups.forEach(g => {
                    if (g) groupedData[xValue][g.toLowerCase()] = 0;
                });
            }
            groupedData[xValue][groupValue] += yValue;
        }
    });
    return Object.values(groupedData);
}

export function transformDataForWaterfallChart(rows, selectedItem) {
    let xKey = selectedItem.v2;  // Thay vì v1, ta dùng v2 làm trục X
    let yKey = selectedItem.v3;  // Giá trị Y (ví dụ: "Tổng giá trị")

    let processedRows = rows.map(row => ({
        ...row,
        [yKey]: row[yKey] !== null ? +row[yKey] : 0
    }));

    let uniqueGroups = [...new Set(processedRows.map(row => row[xKey]))];  // Tạo danh sách các nhóm theo v2
    let groupedData = [];
    let totalPerXKey = 0;

    processedRows.forEach(row => {
        let xValue = row[xKey];
        let yValue = row[yKey];

        // Đảm bảo có dữ liệu tổng cho mỗi nhóm (xValue)
        if (!groupedData[xValue]) {
            groupedData[xValue] = { [xKey]: xValue };
        }

        if (!groupedData[xValue][yKey]) {
            groupedData[xValue][yKey] = 0;
        }

        groupedData[xValue][yKey] += yValue;
        totalPerXKey += yValue;
    });

    return Object.values(groupedData);
}

export function createWaterfallSeries(rows, selectedItem, fills = []) {
    const xKey = selectedItem.v2; // Sử dụng v2 làm xKey
    const yKey = selectedItem.v3; // Giá trị Y (ví dụ: "Tổng giá trị")

    // Tạo series cho Waterfall chart
    let series = [];
    let processedData = transformDataForWaterfallChart(rows, selectedItem);
    const [positiveColor, negativeColor, totalColor] = fills.slice(0, 3);

    processedData.forEach(dataPoint => {
        let xValue = dataPoint[xKey];
        let value = dataPoint[yKey];

        // Tạo các series "start", "increase", "decrease", "total"
        series.push({
            type: "waterfall",
            xKey,
            yKey: yKey,
            yName: `${xValue}`,
            marker: { enabled: true },
            tooltip: {
                enabled: true,
                renderer: (params) => ({
                    title: `${params.datum[xKey]}`,
                    content: `${formatCurrency(params.datum[yKey])}`,
                }),
            },

            start: value < 0 ? 0 : value, // Nếu giá trị nhỏ hơn 0 thì bắt đầu từ 0, nếu không thì từ giá trị hiện tại
            increase: value >= 0 ? value : 0, // Nếu giá trị tăng thì thêm vào phần tăng
            decrease: value < 0 ? Math.abs(value) : 0, // Nếu giá trị giảm thì thêm vào phần giảm
            total: value, // Tổng kết
            // Customize colors
            item: {
                positive: {
                    fill: positiveColor,
                },
                negative: {
                    fill: negativeColor,
                },
                total: {
                    name: 'Total',
                    fill: totalColor,
                },
            },
        });
    });

    return series;
}

export function transformData2(rows, selectedItem) {
    let xKey = selectedItem.v1;
    let yKey = selectedItem.v3;
    let groupKey = selectedItem.v2;

    let processedRows = rows.map(row => ({
        ...row,
        [yKey]: row[yKey] !== null ? +row[yKey] : 0
    }));

    if (!groupKey) {
        // Trường hợp không có groupKey: Tính tổng theo v1
        let summedData = {};
        processedRows.forEach(row => {
            let xValue = row[xKey];
            let yValue = row[yKey];
            if (!summedData[xValue]) {
                summedData[xValue] = { [xKey]: xValue, value: 0 };
            }
            summedData[xValue].value += yValue;
        });
        return Object.values(summedData);
    }

    // Trường hợp có groupKey
    let uniqueGroups = [...new Set(processedRows.map(row => row[groupKey]))];
    let groupedData = {};

    processedRows.forEach(row => {
        let xValue = row[xKey];
        if (row[groupKey]) {
            let groupValue = row[groupKey].toLowerCase();
            let yValue = row[yKey];
            if (!groupedData[xValue]) {
                groupedData[xValue] = { [xKey]: xValue };
                uniqueGroups.forEach(g => {
                    if (g) groupedData[xValue][g.toLowerCase()] = 0;
                });
            }
            groupedData[xValue][groupValue] += yValue;
        }
    });

    return Object.values(groupedData);
}

export function prepareChartSeriesTemp2(uniqueGroups, data, interpolation, xKey, hasGroupKey = true, yName = '', fills = []) {
    if (!hasGroupKey) {
        return [{
            type: 'line',
            xKey: xKey,
            yKey: 'value',
            yName: yName,
            marker: { enabled: true, fill: fills[0], },
            stroke: fills[0],
            tooltip: {
                renderer: (params) => ({
                    content: ` ${formatCurrency(params.datum[params.yKey])}`,
                }),
            },
            interpolation,
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                    strokeWidth: 4
                }
            },
        }];
    }

    uniqueGroups = uniqueGroups.filter(e => e);
    return uniqueGroups.map((group, index) => ({
        type: 'line',
        xKey: xKey,
        yKey: group.toLowerCase(),
        yName: group,
        marker: {
            enabled: true,
            fill: fills[index % fills.length], // Assign marker color from the array
        },
        tooltip: {
            renderer: (params) => ({
                content: ` ${formatCurrency(params.datum[params.yKey])}`,
            }),
        },
        interpolation,
        highlightStyle: {
            series: {
                dimOpacity: 0.2,
                strokeWidth: 4
            }
        },
        stroke: fills[uniqueGroups.indexOf(group) % fills.length], // Chọn màu sắc cho từng nhóm
    }));
}

export function getUniqueValues2(data, field) {
    return [...new Set(data.map(item => item[field]))];
}

export function transformDataForBarChart2(rows, selectedItem, shouldSort = false) {
    const xKey = selectedItem.v1;
    const yKey = selectedItem.v3;
    const groupKey = selectedItem.v2;

    const processedRows = rows.map(row => ({
        ...row,
        [`${yKey}b`]: row[yKey] !== null ? +row[yKey] : 0
    }));

    if (!groupKey) {
        // Trường hợp không có groupKey: Tổng giá trị theo xKey
        const summedData = {};
        processedRows.forEach(row => {
            const xValue = row[xKey];
            const yValue = row[`${yKey}b`];
            if (!summedData[xValue]) {
                summedData[xValue] = { [xKey]: xValue, valueb: 0 };
            }
            summedData[xValue].valueb += yValue;
        });

        const result = Object.values(summedData);
        return shouldSort
            ? result.sort((a, b) => b.valueb - a.valueb)
            : result;
    }

    // Trường hợp có groupKey: chia nhóm
    const uniqueGroups = [...new Set(processedRows.map(row => row[groupKey]))];
    const groupedData = {};
    const totalPerXKey = {};

    processedRows.forEach(row => {
        const xValue = row[xKey];
        if (row[groupKey]) {
            const groupValue = row[groupKey].toLowerCase();
            const yValue = row[`${yKey}b`];

            if (!groupedData[xValue]) {
                groupedData[xValue] = { [xKey]: xValue };
                totalPerXKey[xValue] = 0;

                uniqueGroups.forEach(g => {
                    if (g) groupedData[xValue][`${g.toLowerCase()}b`] = 0;
                });
            }

            groupedData[xValue][`${groupValue}b`] += yValue;
            totalPerXKey[xValue] += yValue;
        }
    });

    return Object.values(groupedData);
}

export function createBarSeries2(listGroup, xKey, hasGroupKey = true, yName = '', fills = []) {
    if (!hasGroupKey) {
        return [{
            type: "bar",
            xKey,
            yKey: 'valueb',
            yName: yName,
            stacked: false,
            fill: fills[0],
            tooltip: {
                renderer: (params) => ({
                    content: `${formatCurrency(params.datum[params.yKey])}`,
                }),
            },
            stroke: '#fff',
            strokeWidth: 0.3,
        }];
    }
    listGroup = listGroup.filter(e => e);
    return listGroup.map((group, index) => ({
        type: "bar",
        xKey,
        yKey: group.toLowerCase() + 'b',
        yName: group,
        stacked: false,
        tooltip: {
            renderer: (params) => ({
                content: `${formatCurrency(params.datum[params.yKey])}`,
            }),
        },
        fill: fills[index % fills.length],
        stroke: '#fff',
        strokeWidth: 0.3,
    }));
}

export function sortWF(data, key) {
    // Sắp xếp data ban đầu theo yêu cầu
    try {
        const sortedData = data.sort((a, b) => {
            const aValue = a[key];
            const bValue = b[key];

            // Ưu tiên số dương
            if (aValue >= 0 && bValue < 0) return -1;
            if (aValue < 0 && bValue >= 0) return 1;

            // Nếu cả hai cùng dương: sắp giảm dần
            if (aValue >= 0 && bValue >= 0) return bValue - aValue;

            // Nếu cả hai âm: sắp tăng dần theo |giá trị| (lớn hơn lên trước)
            return Math.abs(bValue) - Math.abs(aValue);
        });
        return sortedData
    } catch (e) {
        return data
    }
}

export function transformDataWithV6(rows, selectedItem) {
    let xKey = selectedItem.v1; // "Tháng"
    let yKeys = selectedItem.v6; // ["Giá trị tuyệt đối", "Số tiền"]
    let groupKey = selectedItem.v2; // null

    // First, get all unique x values (months)
    let uniqueXValues = [...new Set(rows.map(row => row[xKey]))].sort();

    // Create the base data structure with all x values
    let result = uniqueXValues.map(xValue => {
        let item = { [xKey]: xValue };
        // Initialize each y value from v6 to 0
        yKeys.forEach(yKey => {
            item[yKey] = 0;
        });
        return item;
    });

    // Sum up the values for each x value
    rows.forEach(row => {
        let xValue = row[xKey];
        let targetItem = result.find(item => item[xKey] === xValue);
        if (targetItem) {
            yKeys.forEach(yKey => {
                if (row[yKey] !== null && row[yKey] !== undefined) {
                    targetItem[yKey] += Number(row[yKey]);
                }
            });
        }
    });

    return result;
}

export function prepareChartSeriesWithV6(uniqueGroups, data, interpolation, xKey, hasGroupKey = true, yKeys = [], fills = []) {
    if (!hasGroupKey) {
        return yKeys.map((yKey, index) => ({
            type: 'line',
            xKey: xKey,
            yKey: yKey,
            yName: yKey,
            marker: {
                enabled: true,
                fill: fills[index % fills.length]
            },
            stroke: fills[index % fills.length],
            tooltip: {
                renderer: (params) => ({
                    content: ` ${formatCurrency(params.datum[params.yKey])}`,
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

    uniqueGroups = uniqueGroups.filter(e => e);
    return uniqueGroups.map((group, index) => ({
        type: 'line',
        xKey: xKey,
        yKey: group.toLowerCase(),
        yName: group,
        marker: {
            enabled: true,
            fill: fills[index % fills.length], // Assign marker color from the array
        },
        tooltip: {
            renderer: (params) => ({
                content: ` ${formatCurrency(params.datum[params.yKey])}`,
            }),
        },
        interpolation,
        highlightStyle: {
            series: {
                dimOpacity: 0.2,
                strokeWidth: 4
            }
        },
        stroke: fills[uniqueGroups.indexOf(group) % fills.length], // Chọn màu sắc cho từng nhóm
    }));
}

// export function transformDataForBarChartWithV6(rows, selectedItem) {
//     let xKey = selectedItem.v1; // "Tháng"
//     let yKeys = selectedItem.v6; // ["Giá trị tuyệt đối", "Số tiền"]
//     let groupKey = selectedItem.v2; // null
//
//     // First, get all unique x values (months)
//     let uniqueXValues = [...new Set(rows.map(row => row[xKey]))].sort();
//
//     // Create the base data structure with all x values
//     let result = uniqueXValues.map(xValue => {
//         let item = { [xKey]: xValue };
//         // Initialize each y value from v6 to 0
//         yKeys.forEach(yKey => {
//             item[yKey] = 0;
//         });
//         return item;
//     });
//
//     // Sum up the values for each x value
//     rows.forEach(row => {
//         let xValue = row[xKey];
//         let targetItem = result.find(item => item[xKey] === xValue);
//         if (targetItem) {
//             yKeys.forEach(yKey => {
//                 if (row[yKey] !== null && row[yKey] !== undefined) {
//                     targetItem[yKey] += Number(row[yKey]);
//                 }
//             });
//         }
//     });
//
//     return result;
// }

// export function createBarSeriesWithV6(uniqueGroups, data, interpolation, xKey, hasGroupKey = true, yKeys = [], fills = []) {
//     if (!hasGroupKey) {
//         return yKeys.map((yKey, index) => ({
//             type: 'bar',
//             xKey: xKey,
//             yKey: yKey,
//             yName: yKey,
//             stacked: false,
//             fill: fills[index % fills.length],
//             tooltip: {
//                 renderer: (params) => ({
//                     content: `${formatCurrency(params.datum[params.yKey])}`,
//                 }),
//             },
//             stroke: '#fff',
//             strokeWidth: 0.3,
//         }));
//     }
//
//     uniqueGroups = uniqueGroups.filter(e => e);
//     return uniqueGroups.map((group, index) => ({
//         type: 'bar',
//         xKey: xKey,
//         yKey: group.toLowerCase(),
//         yName: group,
//         stacked: false,
//         fill: fills[index % fills.length],
//         tooltip: {
//             renderer: (params) => ({
//                 content: `${formatCurrency(params.datum[params.yKey])}`,
//             }),
//         },
//         stroke: '#fff',
//         strokeWidth: 0.3,
//     }));
// }

export function transformDataForBarChartWithV6(rows, selectedItem) {
    const xKey = selectedItem.v1; // X-axis key
    const yKeys = selectedItem.v6; // Array of Y-axis keys

    // Get unique x values
    const uniqueXValues = [...new Set(rows.map(row => row[xKey]))].sort();

    // Initialize the result structure
    const result = uniqueXValues.map(xValue => {
        const item = { [xKey]: xValue };
        yKeys.forEach(yKey => {
            item[yKey] = 0; // Initialize each yKey to 0
        });
        return item;
    });

    // Aggregate values for each xKey
    rows.forEach(row => {
        const xValue = row[xKey];
        const targetItem = result.find(item => item[xKey] === xValue);
        if (targetItem) {
            yKeys.forEach(yKey => {
                if (row[yKey] !== null && row[yKey] !== undefined) {
                    targetItem[yKey] += Number(row[yKey]);
                }
            });
        }
    });

    // Calculate percentages for each yKey independently
    result.forEach(item => {
        yKeys.forEach(yKey => {
            const total = rows.reduce((sum, row) => sum + (+row[yKey] || 0), 0);
            if (total > 0) {
                item[yKey] = +(item[yKey] / total * 100).toFixed(2); // Normalize to percentage
            }
        });
    });
    return result;
}

export function createBarSeriesWithV6(uniqueGroups, data, interpolation, xKey, hasGroupKey = true, yKeys = [], fills = [], normalizedTo = null) {
    if (!hasGroupKey) {
        return yKeys.map((yKey, index) => ({
            type: 'bar',
            xKey: xKey,
            yKey: yKey,
            yName: yKey,
            stacked: !!normalizedTo, // Enable stacking if normalization is applied
            normalizedTo: normalizedTo, // Apply normalization if provided
            fill: fills[index % fills.length],
            tooltip: {
                renderer: (params) => ({
                    content: `${formatCurrency(params.datum[params.yKey])}`,
                }),
            },
            stroke: '#fff',
            strokeWidth: 0.3,
        }));
    }

    uniqueGroups = uniqueGroups.filter(e => e);
    return uniqueGroups.map((group, index) => ({
        type: 'bar',
        xKey: xKey,
        yKey: group.toLowerCase(),
        yName: group,
        stacked: !!normalizedTo, // Enable stacking if normalization is applied
        normalizedTo: normalizedTo, // Apply normalization if provided
        fill: fills[index % fills.length],
        tooltip: {
            renderer: (params) => ({
                content: `${formatCurrency(params.datum[params.yKey])}`,
            }),
        },
        stroke: '#fff',
        strokeWidth: 0.3,
    }));
}
