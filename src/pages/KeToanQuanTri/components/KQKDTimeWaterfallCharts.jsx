import React, { useEffect, useMemo, useState } from 'react';
import { AgCharts } from 'ag-charts-react';
import { createSeries, createSectionData } from '../../Canvas/Daas/Logic/SetupChart.js';
import { getSettingByType } from '../../../apis/settingService.jsx';

export default function KQKDTimeWaterfallCharts({ rowData, selectedMonth = 0, unitDisplay, formatUnitDisplay, selectedUnit }) {
    const [chartColors, setChartColors] = useState([]);
    useEffect(() => {
        (async () => {
            try {
                const colorSetting = await getSettingByType('SettingColor');
                if (colorSetting && colorSetting.setting && Array.isArray(colorSetting.setting)) {
                    const colors = colorSetting.setting.map(item => item.color).filter(Boolean);
                    if (colors.length) setChartColors(colors);
                }
            } catch (e) {
                console.error('Error loading chart colors:', e);
            }
        })();
    }, []);

    const charts = useMemo(() => {
        if (!Array.isArray(rowData) || rowData.length === 0) {
            return { revenueLine: null, profitLine: null, waterfallBar: null };
        }

        // Helper: check top-level layer (no dot)
        const isTopLevel = (layer) => {
            const s = String(layer ?? '');
            return s !== '' && !s.includes('.');
        };

        // Build months list
        const months = selectedMonth && selectedMonth > 0 ? [...Array(selectedMonth).keys()].map(i => i + 1) : [...Array(12).keys()].map(i => i + 1);

        // Sum value for a row at month m
        // If selectedUnit is provided, only take that column `${selectedUnit}_${m}`; otherwise sum all `*_${m}` columns
        const sumRowByMonth = (row, m) => {
            const suffix = `_${m}`;
            if (selectedUnit) {
                const val = Number(row[`${selectedUnit}${suffix}`]) || 0;
                return val;
            }
            let s = 0;
            Object.keys(row).forEach(k => {
                if (k.endsWith(suffix)) {
                    const v = Number(row[k]) || 0;
                    s += v;
                }
            });
            return s;
        };

        // Revenue over time (dp === 'Doanh thu', top-level only)
        const revenueSeriesData = months.map(m => {
            const total = rowData.reduce((acc, row) => {
                if (row.dp === 'Doanh thu' && isTopLevel(row.layer)) {
                    return acc + sumRowByMonth(row, m);
                }
                return acc;
            }, 0);
            return { month: m, value: total };
        });

        // Profit over time (dp === 'Lãi lỗ ròng', top-level only)
        const profitSeriesData = months.map(m => {
            const total = rowData.reduce((acc, row) => {
                if (row.dp === 'Lãi lỗ ròng' && isTopLevel(row.layer)) {
                    return acc + sumRowByMonth(row, m);
                }
                return acc;
            }, 0);
            return { month: m, value: total };
        });

        const numberAxisFormatter = (p) => formatUnitDisplay(p.value, unitDisplay);

        // Inject formatted values for custom tooltip in helpers
        const revenueSeriesDataFormatted = revenueSeriesData.map(d => ({
            ...d,
            value_formatted: formatUnitDisplay(d.value, unitDisplay),
        }));
        const profitSeriesDataFormatted = profitSeriesData.map(d => ({
            ...d,
            value_formatted: formatUnitDisplay(d.value, unitDisplay),
        }));

        const revenueSeries = [
            createSeries('month', 'value', 'Doanh thu', 'line', chartColors[0] || '#2563eb', false, false, false),
        ];
        const profitSeries = [
            createSeries('month', 'value', 'Lợi nhuận', 'line', chartColors[0] || '#16a34a', false, false, false),
        ];

        const revenueLine = createSectionData(
            '',
            revenueSeriesDataFormatted,
            revenueSeries,
            '',
            { label: { formatter: numberAxisFormatter } },
            { position: 'bottom' }
        );
        revenueLine.title = { text: 'Doanh thu', fontSize: 16, fontWeight: 'bold' };

        const profitLine = createSectionData(
            '',
            profitSeriesDataFormatted,
            profitSeries,
            '',
            { label: { formatter: numberAxisFormatter } },
            { position: 'bottom' }
        );
        profitLine.title = { text: 'Lãi lỗ ròng', fontSize: 16, fontWeight: 'bold' };

        // Waterfall-like bar for lũy kế năm (month 0) with top-level rows
        const waterfallMonth = 0;
        const suffix0 = `_${waterfallMonth}`;
        const byDp = {};
        rowData.forEach(row => {
            if (!isTopLevel(row.layer)) return;
            const dp = String(row.dp ?? '');
            let sum0 = 0;
            if (selectedUnit) {
                sum0 = Number(row[`${selectedUnit}${suffix0}`]) || 0;
            } else {
                Object.keys(row).forEach(k => {
                    if (k.endsWith(suffix0)) sum0 += (Number(row[k]) || 0);
                });
            }
            byDp[dp] = (byDp[dp] || 0) + sum0;
        });
        const waterfallData = Object.entries(byDp)
            .filter(([dp]) => dp)
            .map(([dp, value]) => {
                const keepSign = dp === 'Doanh thu' || dp === 'Hoạt động tài chính' || /Lãi|Lợi nhuận/i.test(dp);
                return { dp, value: keepSign ? value : -value };
            })
            .slice(0, 25);

        // Add formatted tooltip field
        const waterfallDataFormatted = waterfallData.map(d => ({
            ...d,
            value_formatted: formatUnitDisplay(d.value, unitDisplay),
        }));
        const waterfallSeries = [
            createSeries('dp', 'value', 'Giá trị', 'bar', chartColors[0] || '#22c55e', false, false, false),
        ];
        const waterfallBar = createSectionData(
            '',
            waterfallDataFormatted,
            waterfallSeries,
            '',
            { label: { formatter: numberAxisFormatter } },
            { position: 'bottom' }
        );
        waterfallBar.title = { text: '', fontSize: 16, fontWeight: 'bold' };

        return { revenueLine, profitLine, waterfallBar };
    }, [rowData, selectedMonth, unitDisplay, formatUnitDisplay, selectedUnit, chartColors]);

    if (!charts.revenueLine && !charts.profitLine && !charts.waterfallBar) {
        return null;
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '10px 0',
            padding: '20px',
            backgroundColor: '#fafafa', }}>
            <div style={{ minHeight: 400 }}>
                {charts.revenueLine && <AgCharts options={charts.revenueLine} style={{ height: '100%' }} />}
            </div>
            <div style={{ minHeight: 400 }}>
                {charts.profitLine && <AgCharts options={charts.profitLine} style={{ height: '100%' }} />}
            </div>
            <div style={{ minHeight: 400 }}>
                {charts.waterfallBar && <AgCharts options={charts.waterfallBar} style={{ height: '100%' }} />}
            </div>
        </div>
    );
}



