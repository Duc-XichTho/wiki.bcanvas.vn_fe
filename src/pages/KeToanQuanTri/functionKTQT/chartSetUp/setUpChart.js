import {formatCurrency} from "../formatMoney.js";

export function createData(id, month, thucHien, keHoach) {
    return {
        id,
        month,
        'thực hiện': thucHien,
        'kế hoạch': keHoach,
        'cùng kỳ': null
    };
}

export function createSeries(xKey, yKey, yName, type) {
    return {
        type: type,
        xKey,
        yKey,
        yName,
        marker: { enabled: true },
        tooltip: {
            renderer: (params) => {
                return {
                    content: ` ${new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        maximumFractionDigits: 0,
                    }).format(params.datum[params.yKey])}`,
                };
            },
        },
        interpolation: {
            type: 'smooth',
        }, highlightStyle: {
            series: {
                dimOpacity: 0.2,
                strokeWidth: 4,
            },
        },
    };
}

export function createAxes(customY) {
    return [
        {
            type: 'category',
            position: 'bottom',
            label: {
                color: "#262626",
                fontFamily: "Roboto Flex, sans-serif",
            },
            gridLine: {
                enabled: true,
            },
        },
        {
            ...customY,
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => Math.abs(params.value) > 1000000 ? (formatCurrency((params.value / 1000000).toFixed(0)) + 'M') : formatCurrency(params.value),
                color: "#262626",
                fontFamily: "Roboto Flex, sans-serif",
            },
            gridLine: {
                enabled: true,
            },
            interval: {
                minSpacing: 10,
                maxSpacing: 100,
            }
        },
    ];
}

export function createSectionData(title, data, series, chartTitle, customY = {}, legend = { position: 'top', }) {
    return {
        theme: 'ag-vivid',
        data,
        series,
        axes: createAxes(customY),
        title: {
            text: chartTitle,
            color: "#262626",
            fontFamily: "Roboto Flex, sans-serif",

        },
        legend: {
            ...legend,
            label: {
                color: "#262626",
                fontFamily: "Roboto Flex, sans-serif",
            }
        }
    };
}

export function createNormalisedBar(xKey, yKey, yName) {
    return {
        type: 'bar',
        xKey,
        yKey,
        yName: yName.includes('-') ? yName.split('-')[1] : yName,
        normalizedTo: 100,
        stacked: true,
        // fill:  ['#ff0000', '#374e37', '#212c68', '#6c1b1b', '#A133FF', '#33FFF5', '#F5FF33', '#FF8C33'],
        tooltip: {
            renderer: (params) => {
                return {
                    content: params.datum[params.yKey] + '%',
                };
            },
        },
        interpolation: {
            type: 'smooth',
        },
        strokeWidth: 1,
    };
}

export function createNormalisedBarProductGroup(listGroup) {
    let rs = [];
    listGroup.sort()
    listGroup.map(e => {
        rs.push(createNormalisedBar('month', e?.toLowerCase(), e));
    })
    return rs;
}

export function createSeriesCMSP(units) {
    const series_for_chart_line_cm = units.map((e) => {
        return {
            type: 'line',
            xKey: 'month',
            yKey: e?.toLowerCase(),
            yName: e.includes('-') ? e.split('-')[1] : e,
            marker: {
                enabled: true,
            },
            tooltip: {
                renderer: (params) => {
                    return {
                        content: ` ${(params.datum[params.yKey]).toFixed(2)}%`,
                    };
                },
            },
            interpolation: {
                type: 'smooth',
            },
            highlightStyle: {
                series: {
                    dimOpacity: 0.2,
                    strokeWidth: 4,
                },
            },

        };
    });
    return series_for_chart_line_cm;
}
