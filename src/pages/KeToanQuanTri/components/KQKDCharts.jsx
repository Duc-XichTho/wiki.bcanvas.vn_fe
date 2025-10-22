import React, { useEffect, useMemo, useState } from 'react';
import { AgCharts } from 'ag-charts-react';
import { createSeries, createSectionData, createSeriesPie } from '../../Canvas/Daas/Logic/SetupChart.js';
import { getSettingByType } from '../../../apis/settingService.jsx';

const KQKDCharts = ({ rowData, selectedMonth, unitDisplay, formatUnitDisplay, groups }) => {
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

	// Tính toán dữ liệu cho biểu đồ
	const chartData = useMemo(() => {
		if (!rowData || rowData.length === 0) return { pieRevenueData: [], pieProfitData: [], barData: [] };

		// Lọc dữ liệu theo tháng được chọn (chỉ cần biết còn giá trị khác 0)
		const filteredData = rowData.filter(row => {
			if (selectedMonth === 0) return true;
			const suffix = `_${selectedMonth}`;
			return Object.keys(row).some(k => k.endsWith(suffix) && Number(row[k]) !== 0);
		});

		// Xác định danh sách nhóm hiệu lực
		const effectiveGroups = (Array.isArray(groups) && groups.length > 0)
			? groups
			: (() => {
				const sample = filteredData[0] || {};
				const suffix = `_${selectedMonth}`;
				return Object.keys(sample)
					.filter(k => k.endsWith(suffix))
					.map(k => k.substring(0, k.length - suffix.length))
					.filter(g => g && g !== 'ALL' && g !== 'null');
			})();

		// Tính tổng theo nhóm theo quy ước layer: 1 = Doanh thu, 12 = Lợi nhuận
		const totals = {}; // groupName -> { revenue, profit }
		filteredData.forEach(row => {
			const isRevenueRow = row.dp === 'Doanh thu';
			const isProfitRow = row.dp === 'Lãi lỗ ròng';

			effectiveGroups.forEach(group => {
				const key = `${group}_${selectedMonth}`;
				const value = Number(row[key]) || 0;
				if (!totals[group]) totals[group] = { revenue: 0, profit: 0 };
				if (isRevenueRow) totals[group].revenue += value;
				if (isProfitRow) totals[group].profit += value;
			});
		});

		// Chuyển sang revenue/profit per group
		const groupTotals = Object.entries(totals).reduce((acc, [group, { revenue = 0, profit = 0 }]) => {
			acc[group] = { revenue: Math.abs(revenue), profit };
			return acc;
		}, {});

		// Tạo dữ liệu cho pie chart doanh thu với phần trăm
		const pieRevenueData = Object.entries(groupTotals)
			.filter(([group, data]) => group && group !== 'null' && data.revenue !== 0)
			.map(([group, data], index) => {
				const value = Math.abs(data.revenue);
				return {
					group,
					value,
					color: chartColors[index % (chartColors.length || 1)] || '#13C2C2',
				};
			});

		// Tính tổng doanh thu để tính phần trăm
		const totalRevenue = pieRevenueData.reduce((sum, item) => sum + item.value, 0);
		pieRevenueData.forEach(item => {
			item.percent = totalRevenue > 0 ? +((item.value / totalRevenue) * 100).toFixed(1) : 0;
			item.formattedValue = `${formatUnitDisplay(item.value, unitDisplay)} (${item.percent}%)`;
		});

		// Tạo dữ liệu cho pie chart lợi nhuận với phần trăm
		const pieProfitData = Object.entries(groupTotals)
			.filter(([group, data]) => group && group !== 'null' && data.profit !== 0)
			.map(([group, data], index) => {
				const value = Math.abs(data.profit);
				return {
					group,
					value,
					color: chartColors[index % (chartColors.length || 1)] || '#3196D1',
				};
			});

		// Tính tổng lợi nhuận để tính phần trăm
		const totalProfit = pieProfitData.reduce((sum, item) => sum + Math.abs(item.value), 0);
		pieProfitData.forEach(item => {
			item.percent = totalProfit > 0 ? +((item.value / totalProfit) * 100).toFixed(1) : 0;
			item.formattedValue = `${formatUnitDisplay(item.value, unitDisplay)} (${item.percent}%)`;
		});

		// Tạo dữ liệu cho bar chart: mỗi DP (khoản mục) là 1 phần tử X, mỗi nhóm là một series
		const suffix = `_${selectedMonth}`;
		const totalsByDp = {}; // { dp: { [group]: value } }
		filteredData.forEach(row => {
			const layerText = (row.layer ?? '').toString();
			if (!layerText || layerText.includes('.')) return; // chỉ lấy layer top-level
			const dp = (row.dp ?? '').toString();
			if (!dp) return;
			if (!totalsByDp[dp]) totalsByDp[dp] = {};
			effectiveGroups.forEach(group => {
				const key = `${group}${suffix}`;
				const value = Number(row[key]) || 0;
				totalsByDp[dp][group] = (totalsByDp[dp][group] || 0) + value;
			});
		});

		const barData = Object.entries(totalsByDp).map(([dp, groupValues]) => {
			const entry = { dp };
			effectiveGroups.forEach(g => {
				entry[g] = Math.abs(groupValues[g] || 0);
			});
			return entry;
		});

		return { pieRevenueData, pieProfitData, barData, effectiveGroups };
	}, [rowData, selectedMonth, unitDisplay, formatUnitDisplay, groups, chartColors]);

	// Cấu hình pie chart doanh thu dùng helper
	const pieRevenueSeries = (() => {
		const s = createSeriesPie('value', 'group', chartData.pieRevenueData.map(d => d.color));
		s.sectorLabelKey = 'formattedValue';
		s.tooltip = {
			renderer: (params) => ({
				content: params.datum.formattedValue || `${params.datum.group}: ${formatUnitDisplay(params.datum.value, unitDisplay)}`,
			}),
		};
		return s;
	})();

	const pieRevenueOptions = {
		data: chartData.pieRevenueData,
		title: { text: 'Doanh thu theo nhóm', fontSize: 16, fontWeight: 'bold' },
		series: [pieRevenueSeries],
		legend: { position: 'bottom' },
	};

	// Cấu hình pie chart lợi nhuận dùng helper
	const pieProfitSeries = (() => {
		const s = createSeriesPie('value', 'group', chartData.pieProfitData.map(d => d.color));
		s.sectorLabelKey = 'formattedValue';
		s.tooltip = {
			renderer: (params) => ({
				content: params.datum.formattedValue || `${params.datum.group}: ${formatUnitDisplay(params.datum.value, unitDisplay)}`,
			}),
		};
		return s;
	})();

	const pieProfitOptions = {
		data: chartData.pieProfitData,
		title: { text: 'Lợi nhuận theo nhóm', fontSize: 16, fontWeight: 'bold' },
		series: [pieProfitSeries],
		legend: { position: 'bottom' },
	};

	// Cấu hình bar chart dùng helper
	const barDataWithFormatted = useMemo(() => {
		if (!chartData.barData || !Array.isArray(chartData.effectiveGroups)) return chartData.barData;
		return chartData.barData.map((entry) => {
			const enriched = { ...entry };
			chartData.effectiveGroups.forEach((g) => {
				const raw = Number(entry[g]) || 0;
				enriched[`${g}_formatted`] = formatUnitDisplay(raw, unitDisplay);
			});
			return enriched;
		});
	}, [chartData.barData, chartData.effectiveGroups, unitDisplay, formatUnitDisplay]);

	const barSeries = (Array.isArray(chartData.effectiveGroups) ? chartData.effectiveGroups : []).map((g, idx) =>
		createSeries('dp', g, g, 'bar', chartColors[idx % (chartColors.length || 1)] || '#13C2C2')
	);

	const barOptions = createSectionData(
		'',
		barDataWithFormatted,
		barSeries,
		'',
		{ label: { formatter: (params) => formatUnitDisplay(params.value, unitDisplay) } },
		{ position: 'bottom' }
	);
	barOptions.title = { text: 'Tổng quan theo nhóm theo từng khoản mục', fontSize: 16, fontWeight: 'bold' };

	if (chartData.pieRevenueData.length === 0 && chartData.pieProfitData.length === 0 && chartData.barData.length === 0) {
		return (
			<div style={{
				padding: '20px',
				textAlign: 'center',
				color: '#666',
				backgroundColor: '#f5f5f5',
				borderRadius: '8px',
				margin: '10px 0',
			}}>
				Không có dữ liệu để hiển thị biểu đồ
			</div>
		);
	}

	return (
		<div style={{
			display: 'grid',
			gridTemplateColumns: '2fr 2fr 5fr',
			gap: '20px',
			marginBottom: '20px',
			padding: '20px',
			backgroundColor: '#fafafa',
			borderRadius: '8px',
		}}>
			<div style={{ minHeight: '400px' }}>
				<AgCharts options={pieRevenueOptions} style={{ height: '100%' }} />
			</div>
			<div style={{ minHeight: '400px' }}>
				<AgCharts options={pieProfitOptions} style={{ height: '100%' }} />
			</div>
			<div style={{ minHeight: '400px' }}>
				<AgCharts options={barOptions} style={{ height: '100%' }} />
			</div>
		</div>
	);
};

export default KQKDCharts;
