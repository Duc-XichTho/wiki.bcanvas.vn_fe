import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { getSettingByType } from '../../apis/settingService';

export default function ChartComponent({ chartData, chartConfig }) {
	const [chartColors, setChartColors] = useState([]);

	useEffect(() => {
		const fetchChartColors = async () => {
			try {
				// Lấy màu từ SettingColor setting
				const colorSetting = await getSettingByType('SettingColor');
				if (colorSetting && colorSetting.setting && Array.isArray(colorSetting.setting)) {
					const colors = colorSetting.setting.map(item => item.color);
					setChartColors(colors);
				} else {
					// Fallback to default colors if setting not found
					const defaultColors = [
						'#FF0000', '#914343', '#5C5858', '#4255B3', 
						'#000DFC', '#DCA0A0', '#FF006A', '#FFFB00'
					];
					setChartColors(defaultColors);
				}
			} catch (error) {
				console.error('Error fetching chart colors:', error);
				// Fallback to default colors on error
				const defaultColors = [
					'#FF0000', '#914343', '#5C5858', '#4255B3', 
					'#000DFC', '#DCA0A0', '#FF006A', '#FFFB00'
				];
				setChartColors(defaultColors);
			}
		};

		fetchChartColors();
	}, []);

	// Hàm format số
	const formatNumber = (value) => {
		if (value >= 1000000) {
			return (value / 1000000).toFixed(2) + 'M';
		}
		return value.toLocaleString();
	};

	const sortedData = useMemo(() => {
		if (!chartData || !chartConfig?.x) return [];
		// Sắp xếp data theo alphabet (A-Z, 0-9) thay vì theo giá trị
		return [...chartData].sort((a, b) => {
			const valueA = String(a[chartConfig.x] || '').toLowerCase();
			const valueB = String(b[chartConfig.x] || '').toLowerCase();
			return valueA.localeCompare(valueB);
		});
	}, [chartData, chartConfig]);

	const getYColumns = () => {
		// Handle combo chart type with series configuration
		if (chartConfig.chart_type === 'combo' && chartConfig.series && Array.isArray(chartConfig.series)) {
			return chartConfig.series.map(series => series.y);
		}
		
		// Handle regular chart types
		if (Array.isArray(chartConfig.y)) {
			return chartConfig.y;
		}
		return [chartConfig.y];
	};

	// Tạo traces dựa trên loại biểu đồ
	const createTraces = () => {
		if (chartColors.length === 0) {
			console.warn('⚠️ [ChartComponent] Chart colors not loaded yet, returning empty traces');
			return []; // Don't render chart if no colors are loaded yet
		}

		console.log('🎨 [ChartComponent] Creating traces for chart type:', chartConfig.chart_type, {
			colorsAvailable: chartColors.length,
			dataPoints: sortedData.length,
			config: chartConfig
		});

		switch (chartConfig.chart_type) {
			case 'line':
				const yColumnsLine = getYColumns();
				if (chartConfig.color) {
					const uniqueColors = [...new Set(sortedData.map(item => item[chartConfig.color]))];
					return uniqueColors.map((colorValue, index) => ({
						type: 'scatter',
						mode: 'lines',
						name: colorValue,
						x: sortedData.filter(item => item[chartConfig.color] === colorValue)
							.map(item => item[chartConfig.x]),
						y: sortedData.filter(item => item[chartConfig.color] === colorValue)
							.map(item => item[yColumnsLine[0]]),
						hovertemplate: `${chartConfig.labels?.x || chartConfig.x}: %{x}<br>${chartConfig.labels?.y || yColumnsLine[0]}: %{y}<extra></extra>`,
						line: {
							color: chartColors[index % chartColors.length]
						}
					}));
				}
				return [{
					type: 'scatter',
					mode: 'lines',
					x: sortedData.map(item => item[chartConfig.x]),
					y: sortedData.map(item => item[yColumnsLine[0]]),
					hovertemplate: `${chartConfig.labels?.x || chartConfig.x}: %{x}<br>${chartConfig.labels?.y || yColumnsLine[0]}: %{y}<extra></extra>`,
					line: {
						color: chartColors[0]
					}
				}];

			case 'bar':
				const yColumnsBar = getYColumns();
				if (chartConfig.color) {
					const uniqueColors = [...new Set(sortedData.map(item => item[chartConfig.color]))];
					return uniqueColors.map((colorValue, index) => ({
						type: 'bar',
						name: colorValue,
						x: sortedData.filter(item => item[chartConfig.color] === colorValue)
							.map(item => item[chartConfig.x]),
						y: sortedData.filter(item => item[chartConfig.color] === colorValue)
							.map(item => item[yColumnsBar[0]]),
						hovertemplate: `${chartConfig.labels?.x || chartConfig.x}: %{x}<br>${chartConfig.labels?.y || yColumnsBar[0]}: %{y}<extra></extra>`,
						marker: {
							color: sortedData.map((_, idx) => chartColors[idx % chartColors.length])
						}
					}));
				}

				// Create a trace for each bar to have individual legend items
				return sortedData.map((item, index) => ({
					type: 'bar',
					name: item[chartConfig.x],
					x: [item[chartConfig.x]],
					y: [item[yColumnsBar[0]]],
					hovertemplate: `${chartConfig.labels?.x || chartConfig.x}: %{x}<br>${chartConfig.labels?.y || yColumnsBar[0]}: %{y}<extra></extra>`,
					marker: {
						color: sortedData.map((_, idx) => chartColors[idx % chartColors.length])
					}
				}));

			case 'pie':
				const yColumnsPie = getYColumns();
				// Tính tổng giá trị
				const total = sortedData.reduce((sum, item) => sum + (Number(item[yColumnsPie[0]]) || 0), 0);

				// Chỉ lấy top 5 sản phẩm có giá trị cao nhất (nhưng vẫn sắp xếp theo alphabet)
				const top5Data = sortedData.slice(0, 5);
				const otherTotal = total - top5Data.reduce((sum, item) => sum + (Number(item[yColumnsPie[0]]) || 0), 0);

				// Tạo dữ liệu cho biểu đồ
				const pieData = [
					...top5Data.map(item => ({
						label: item[chartConfig.x],
						value: Number(item[yColumnsPie[0]]) || 0
					})),
					...(otherTotal > 0 ? [{
						label: 'Khác',
						value: otherTotal
					}] : [])
				];

				return [{
					type: 'pie',
					labels: pieData.map(item => item.label),
					values: pieData.map(item => item.value),
					textinfo: 'percent', // Chỉ hiển thị phần trăm, không hiển thị label
					insidetextorientation: 'radial',
					hovertemplate: `${chartConfig.labels?.x || chartConfig.x}: %{label}<br>${chartConfig.labels?.y || yColumnsPie[0]}: %{value:,.0f}<br>Phần trăm: %{percent:.1%}<extra></extra>`,
					textposition: 'inside',
					hole: 0.4,
					marker: {
						colors: chartColors,
					},
				}];

			case 'combo':
				console.log('🔧 [ChartComponent] Processing combo chart:', {
					hasSeriesConfig: !!(chartConfig.series && Array.isArray(chartConfig.series)),
					seriesCount: chartConfig.series?.length || 0,
					xField: chartConfig.x,
					dataLength: sortedData.length,
					sampleData: sortedData[0],
					seriesConfig: chartConfig.series
				});

				// Handle combo chart type with series configuration
				if (chartConfig.series && Array.isArray(chartConfig.series)) {
					const traces = chartConfig.series.map((series, index) => {
						const seriesData = sortedData.map(item => {
							const value = item[series.y];
							console.log(`📊 [ChartComponent] Series "${series.y}" value for "${item[chartConfig.x]}":`, value);
							return Number(value) || 0;
						});
						
						console.log(`🎯 [ChartComponent] Creating trace for series ${index}:`, {
							type: series.type,
							name: series.label || series.y,
							field: series.y,
							dataPoints: seriesData.length,
							sampleData: seriesData.slice(0, 3)
						});
						
						if (series.type === 'line') {
							return {
								type: 'scatter',
								mode: 'lines+markers',
								name: series.label || series.y,
								x: sortedData.map(item => item[chartConfig.x]),
								y: seriesData,
								hovertemplate: `${chartConfig.labels?.x || chartConfig.x}: %{x}<br>${series.label || series.y}: %{y:,.0f}<extra></extra>`,
								line: {
									color: chartColors[index % chartColors.length],
									width: 3
								},
								marker: {
									color: chartColors[index % chartColors.length],
									size: 8
								},
								yaxis: index === 0 ? 'y' : 'y2' // Use dual y-axis for combo charts
							};
						} else if (series.type === 'bar') {
							return {
								type: 'bar',
								name: series.label || series.y,
								x: sortedData.map(item => item[chartConfig.x]),
								y: seriesData,
								hovertemplate: `${chartConfig.labels?.x || chartConfig.x}: %{x}<br>${series.label || series.y}: %{y:,.0f}<extra></extra>`,
								marker: {
									color: chartColors[index % chartColors.length],
									opacity: 0.8
								},
								yaxis: index === 0 ? 'y' : 'y2' // Use dual y-axis for combo charts
							};
						} else {
							// Fallback to bar for unknown types
							console.warn(`⚠️ [ChartComponent] Unknown series type "${series.type}", using bar as fallback`);
							return {
								type: 'bar',
								name: series.label || series.y,
								x: sortedData.map(item => item[chartConfig.x]),
								y: seriesData,
								hovertemplate: `${chartConfig.labels?.x || chartConfig.x}: %{x}<br>${series.label || series.y}: %{y:,.0f}<extra></extra>`,
								marker: {
									color: chartColors[index % chartColors.length],
									opacity: 0.8
								}
							};
						}
					});
					
					console.log(`✅ [ChartComponent] Generated ${traces.length} traces for combo chart`);
					return traces;
				}
				
				// Fallback for combo charts without series config
				const yColumns = getYColumns();
				return yColumns.map((yCol, index) => ({
					type: index === 0 ? 'bar' : 'scatter',
					mode: index === 0 ? undefined : 'lines+markers',
					name: yCol,
					x: sortedData.map(item => item[chartConfig.x]),
					y: sortedData.map(item => item[yCol] || 0),
					hovertemplate: `${chartConfig.labels?.x || chartConfig.x}: %{x}<br>${yCol}: %{y}<extra></extra>`,
					marker: {
						color: sortedData.map((_, idx) => chartColors[idx % chartColors.length]),
						opacity: index === 0 ? 0.7 : 1
					},
					line: index === 0 ? undefined : {
						color: chartColors[index % chartColors.length],
						width: 3
					},
					yaxis: index === 0 ? 'y' : 'y2'
				}));

			default:
				console.warn(`Unsupported chart type: ${chartConfig.chart_type}`);
				return [];
		}
	};

	// Điều chỉnh layout dựa trên loại biểu đồ
	const getLayout = () => {
		if (chartConfig.chart_type === 'pie') {
			return {
				showlegend: false,
				margin: {
					l: 50,
					r: 50,
					b: 100,
					t: 50,
					pad: 4,
				},
			};
		}

		// Special layout for combo chart type with dual y-axis
		if (chartConfig.chart_type === 'combo') {
			const series = chartConfig.series || [];
			const hasMultipleSeries = series.length >= 2;
			
			if (hasMultipleSeries) {
				return {
					xaxis: {
						title: chartConfig.labels?.x || chartConfig.x,
						type: 'category',
						tickmode: 'array',
						ticktext: sortedData.map(item => item[chartConfig.x]),
						tickvals: sortedData.map(item => item[chartConfig.x]),
						tickangle: -45,
						tickfont: {
							size: 10,
						},
					},
					yaxis: {
						title: series[0]?.label || series[0]?.y || 'Giá trị 1',
						side: 'left',
						showgrid: true,
						gridcolor: '#f0f0f0',
					},
					yaxis2: {
						title: series[1]?.label || series[1]?.y || 'Giá trị 2',
						side: 'right',
						overlaying: 'y',
						showgrid: false,
					},
					showlegend: true,
					legend: {
						orientation: 'h',
						yanchor: 'bottom',
						y: 1.02,
						xanchor: 'right',
						x: 1
					},
					margin: {
						l: 60,
						r: 60,
						b: 100,
						t: 80,
						pad: 4,
					},
				};
			} else {
				// Single series combo chart
				return {
					xaxis: {
						title: chartConfig.labels?.x || chartConfig.x,
						type: 'category',
						tickmode: 'array',
						ticktext: sortedData.map(item => item[chartConfig.x]),
						tickvals: sortedData.map(item => item[chartConfig.x]),
						tickangle: -45,
						tickfont: {
							size: 10,
						},
					},
					yaxis: {
						title: series[0]?.label || series[0]?.y || 'Giá trị',
					},
					showlegend: true,
					legend: {
						orientation: 'h',
						yanchor: 'bottom',
						y: 1.02,
						xanchor: 'right',
						x: 1
					},
					margin: {
						l: 50,
						r: 50,
						b: 100,
						t: 80,
						pad: 4,
					},
				};
			}
		}

		return {
			xaxis: {
				title: chartConfig.labels?.x,
				type: 'category',
				tickmode: 'array',
				ticktext: sortedData.map(item => item[chartConfig.x]),
				tickvals: sortedData.map(item => item[chartConfig.x]),
				tickangle: -45,
				tickfont: {
					size: 10,
				},
			},
			yaxis: {
				title: chartConfig.labels?.y,
			},
			showlegend: false,
			margin: {
				l: 50,
				r: 50,
				b: 100,
				t: 50,
				pad: 4,
			},
		};
	};

	const traces = createTraces();
	const layout = getLayout();
	
	console.log('🎨 [ChartComponent] Final render:', {
		chartType: chartConfig?.chart_type,
		tracesCount: traces?.length || 0,
		hasLayout: !!layout,
		dataPoints: chartData?.length || 0,
		colorsLoaded: chartColors.length > 0,
		traces: traces,
		layout: layout
	});

	// Show loading if colors not loaded yet
	if (chartColors.length === 0) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				height: '400px',
				flexDirection: 'column',
				gap: '12px'
			}}>
				<div style={{ fontSize: '24px' }}>🔄</div>
				<div style={{ fontSize: '14px', color: '#666' }}>Đang tải cấu hình màu sắc...</div>
			</div>
		);
	}

	// Show error if no traces generated
	if (!traces || traces.length === 0) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				height: '400px',
				flexDirection: 'column',
				gap: '12px',
				border: '1px dashed #ddd',
				borderRadius: '8px',
				backgroundColor: '#fafafa'
			}}>
				<div style={{ fontSize: '24px' }}>⚠️</div>
				<div style={{ fontSize: '14px', color: '#666' }}>Không thể tạo biểu đồ</div>
				<div style={{ fontSize: '12px', color: '#999' }}>
					Loại: {chartConfig?.chart_type} • Dữ liệu: {chartData?.length || 0} điểm
				</div>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
			{/* Debug indicator */}
			<div style={{ 
				marginBottom: '8px', 
				fontSize: '11px', 
				color: '#666',
				backgroundColor: '#f0f8ff',
				padding: '4px 8px',
				borderRadius: '4px',
				border: '1px solid #e0e8f0'
			}}>
				🎯 {chartConfig?.chart_type} chart • {traces?.length || 0} traces • {chartData?.length || 0} data points
			</div>
			
			<Plot
				data={traces}
				layout={layout}
				style={{ width: '80%', height: '400px', marginBottom: '10px' }}
				config={{
					responsive: true,
					displayModeBar: true,
					displaylogo: false,
				}}
			/>
			<i style={{fontSize: 14}}>{chartConfig?.description || chartConfig?.title}</i>
		</div>
	);
}
