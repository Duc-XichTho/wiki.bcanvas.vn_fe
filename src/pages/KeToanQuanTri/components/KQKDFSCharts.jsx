import React, { useEffect, useMemo, useState } from 'react';
import { AgCharts } from 'ag-charts-react';
import { createSeries, createSectionData } from '../../Canvas/Daas/Logic/SetupChart.js';
import { getSettingByType } from '../../../apis/settingService.jsx';
import { colors } from '@mui/material';

export default function KQKDFSCharts({ rowData, selectedMonth = 12, unitDisplay, formatUnitDisplay }) {
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

        const isTopLevel = (layer) => {
            const s = String(layer ?? '');
            return s !== '' && !s.includes('.');
        };

        const months = selectedMonth && selectedMonth > 0
            ? Array.from({ length: selectedMonth }, (_, i) => i + 1)
            : Array.from({ length: 12 }, (_, i) => i + 1);

        const sumRowMonthField = (row, m) => Number(row?.[String(m)]) || 0;

        const numberAxisFormatter = (p) => formatUnitDisplay(p.value, unitDisplay);

        // Doanh thu (dp === 'Doanh Thu')
        const revenueSeriesData = months.map(m => {
            const total = rowData.reduce((acc, row) => {
                if (row.dp === 'Doanh thu' && isTopLevel(row.layer)) {
                    return acc + sumRowMonthField(row, m);
                }
                return acc;
            }, 0);
            return { month: m, value: total, value_formatted: formatUnitDisplay(total, unitDisplay) };
        });

        // Lãi lỗ ròng (dp === 'Lãi lỗ ròng')
        const profitSeriesData = months.map(m => {
            const total = rowData.reduce((acc, row) => {
                if (row.dp === 'Lãi lỗ ròng' && isTopLevel(row.layer)) {
                    return acc + sumRowMonthField(row, m);
                }
                return acc;
            }, 0);
            return { month: m, value: total, value_formatted: formatUnitDisplay(total, unitDisplay) };
        });

        const revenueSeries = [createSeries('month', 'value', 'Doanh thu', 'line', chartColors[0] || '#000dff')];
        const profitSeries = [createSeries('month', 'value', 'Lãi lỗ ròng', 'line', chartColors[0] || '#3700ff')];

        const revenueLine = createSectionData(
            '',
            revenueSeriesData,
            revenueSeries,
            '',
            { label: { formatter: numberAxisFormatter } },
            { position: 'bottom' }
        );
        revenueLine.title = { text: 'Doanh thu', fontSize: 16, fontWeight: 'bold' };

        const profitLine = createSectionData(
            '',
            profitSeriesData,
            profitSeries,
            '',
            { label: { formatter: numberAxisFormatter } },
            { position: 'bottom' }
        );
        profitLine.title = { text: 'Lãi lỗ ròng', fontSize: 16, fontWeight: 'bold' };

        // Bar (tháng 0) cho top-level
        const byDp = {};
        rowData.forEach(row => {
            if (!isTopLevel(row.layer)) return;
            const dp = String(row.dp ?? '');
            const val0 = Number(row?.['0']) || 0;
            byDp[dp] = (byDp[dp] || 0) + val0;
        });

        const barData = Object.entries(byDp)
            .filter(([dp]) => dp)
            .map(([dp, value]) => {
                const keepSign = dp === 'Doanh thu' || dp === 'Hoạt động tài chính'|| dp === 'EBITDA' || /Lãi|Lợi nhuận/i.test(dp);
                const v = keepSign ? value : -value;
                return { dp, value: v, value_formatted: formatUnitDisplay(v, unitDisplay) };
            })
            .slice(0, 25);

        const barSeries = [createSeries('dp', 'value', 'Giá trị', 'bar', chartColors[0] || '#3600ff')];
        const waterfallBar = createSectionData(
            '',
            barData,
            barSeries,
            '',
            { label: { formatter: numberAxisFormatter } },
            { position: 'bottom' }
        );
        waterfallBar.title = { text: '', fontSize: 16, fontWeight: 'bold' };
        return { revenueLine, profitLine, waterfallBar };
    }, [rowData, selectedMonth, unitDisplay, formatUnitDisplay]);

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


