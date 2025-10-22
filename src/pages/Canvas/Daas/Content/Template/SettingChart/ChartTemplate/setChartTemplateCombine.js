import { formatCurrency } from '../../../../Logic/SetupChart.js';


export function prepareChartSeriesTemp2CB(uniqueGroups, data, interpolation, xKey, hasGroupKey = true, yName = '', fills = {}) {
    // Trường hợp không có group: dữ liệu đã được tổng hợp ở thuộc tính "value"
    if (!hasGroupKey) {
        return [{
            type: 'line',
            xKey: xKey,
            yKey: 'value',        // dữ liệu tổng hợp của line chart được lưu vào "value"
            yName: yName,
            yAxisKey: 'rightAxis', // Dùng trục y bên phải
            marker: { enabled: true, fill: fills[1] },
            tooltip: {
                renderer: function(params) {
                    return {
                        content: ' ' + (params.datum[params.yKey].toFixed(2)),
                    };
                }
            },
            stroke: fills[1],
            interpolation: interpolation,
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                    strokeWidth: 4
                }
            }
        }];
    }

    // Trường hợp có group (sẽ chạy nếu selectedItem.v4 không null)
    uniqueGroups = uniqueGroups.filter(function(e) { return e; });
    return uniqueGroups.map(function(group) {
        return {
            type: 'line',
            xKey: xKey,
            yKey: group.toLowerCase(),
            yName: group,
            yAxisKey: 'rightAxis', // Dùng trục y bên phải
            marker: { enabled: true },
            tooltip: {
                renderer: function(params) {
                    return {
                        content: ' ' + formatCurrency(params.datum[params.yKey])
                    };
                }
            },
            interpolation: interpolation,
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                    strokeWidth: 4
                }
            }
        };
    });
}

export function createAxesCB(customY) {
    return [
        {
            type: 'category',
            position: 'bottom',
            key: 'xAxis',
            label: {
                color: "#262626",
                fontFamily: "Reddit Sans, sans-serif",
                fontWeight: "500"
            },
            gridLine: {
                enabled: true
            }
        },
        {
            // Trục cho Bar Chart (dữ liệu nằm ở "valueb")
            ...customY,
            type: 'number',
            position: 'left',
            key: 'leftAxis',
            keys: ['valueb'], // Dùng key "valueb" từ transformDataForBarChart2CB
            label: {
                formatter: function(params) {
                    return Math.abs(params.value) > 1000000
                        ? (formatCurrency((params.value / 1000000).toFixed(0)) + 'M')
                        : formatCurrency(params.value);
                },
                color: "#262626",
                fontFamily: "Reddit Sans, sans-serif",
                fontWeight: "500"
            },
            gridLine: {
                enabled: true
            },
            interval: {
                minSpacing: 10,
                maxSpacing: 100
            }
        },
        {
            // Trục cho Line Chart (dữ liệu nằm ở "value")
            type: 'number',
            position: 'right',
            key: 'rightAxis',
            keys: ['value'], // Dùng key "value" từ transformData2 (khi không có group) hoặc các key tương ứng khi có group
            label: {
                formatter: function(params) {
                    return Math.abs(params.value) > 1000000
                        ? (formatCurrency((params.value / 1000000).toFixed(0)) + 'M')
                        : formatCurrency(params.value);
                },
                color: "#262626",
                fontFamily: "Reddit Sans, sans-serif",
                fontWeight: "500"
            },
            gridLine: {
                enabled: false
            },
            interval: {
                minSpacing: 10,
                maxSpacing: 100
            }
        }
    ];
}

