import React from 'react';
import ChartItem from './ChartItem';
import ComparisonItem from './ComparisonItem';
import TableItem from './TableItem';
import TableChartItem from './TableChartItem';
import TableChart2Item from './TableChart2Item';
import TopItem from './TopItem';

const DashboardItemRenderer = ({
	item,
	tableData,
	chartOptions,
	tableDateRanges,
	tableQuickDateRanges,
	showAnalysis,
	loading,
	currentUser,
	deleteLoading,
	deletingItemId,
	kpi2Calculators,
	styles,
	onOpenEditModal,
	onOpenUserClassModal,
	onDeleteDashboardItem,
	onLoadChartData,
	onLoadComparisonData,
	onLoadTableChartData,
	onLoadTableChart2Data,
	onLoadTopData,
	onSetTableDateRanges,
	onSetTableQuickDateRanges,
	getDateRangeFromOption,
	formatValueBySettings,
	renderDataBar,
	formatCurrency,
}) => {
	// Render based on item type
	switch (item.type) {
		case 'chart':
			return (
				<ChartItem
					item={item}
					tableData={tableData}
					chartOptions={chartOptions}
					showAnalysis={showAnalysis}
					loading={loading}
					currentUser={currentUser}
					deleteLoading={deleteLoading}
					deletingItemId={deletingItemId}
					onOpenEditModal={onOpenEditModal}
					onOpenUserClassModal={onOpenUserClassModal}
					onDeleteDashboardItem={onDeleteDashboardItem}
					onLoadChartData={onLoadChartData}
				/>
			);

		case 'comparison':
			return (
				<ComparisonItem
					item={item}
					chartOptions={chartOptions}
					loading={loading}
					currentUser={currentUser}
					deleteLoading={deleteLoading}
					deletingItemId={deletingItemId}
					kpi2Calculators={kpi2Calculators}
					onOpenEditModal={onOpenEditModal}
					onOpenUserClassModal={onOpenUserClassModal}
					onDeleteDashboardItem={onDeleteDashboardItem}
					onLoadComparisonData={onLoadComparisonData}
				/>
			);

		case 'table':
			return (
				<TableItem
					item={item}
					tableData={tableData}
					tableDateRanges={tableDateRanges}
					tableQuickDateRanges={tableQuickDateRanges}
					showAnalysis={showAnalysis}
					loading={loading}
					currentUser={currentUser}
					deleteLoading={deleteLoading}
					deletingItemId={deletingItemId}
					styles={styles}
					onOpenEditModal={onOpenEditModal}
					onOpenUserClassModal={onOpenUserClassModal}
					onDeleteDashboardItem={onDeleteDashboardItem}
					onSetTableDateRanges={onSetTableDateRanges}
					onSetTableQuickDateRanges={onSetTableQuickDateRanges}
					getDateRangeFromOption={getDateRangeFromOption}
					formatValueBySettings={formatValueBySettings}
					renderDataBar={renderDataBar}
				/>
			);

		case 'table_chart':
			return (
				<TableChartItem
					item={item}
					chartOptions={chartOptions}
					showAnalysis={showAnalysis}
					loading={loading}
					currentUser={currentUser}
					deleteLoading={deleteLoading}
					deletingItemId={deletingItemId}
					onOpenEditModal={onOpenEditModal}
					onOpenUserClassModal={onOpenUserClassModal}
					onDeleteDashboardItem={onDeleteDashboardItem}
					onLoadTableChartData={onLoadTableChartData}
				/>
			);

		case 'table_chart_2':
			return (
				<TableChart2Item
					item={item}
					chartOptions={chartOptions}
					tableDateRanges={tableDateRanges}
					tableQuickDateRanges={tableQuickDateRanges}
					showAnalysis={showAnalysis}
					loading={loading}
					currentUser={currentUser}
					deleteLoading={deleteLoading}
					deletingItemId={deletingItemId}
					styles={styles}
					onOpenEditModal={onOpenEditModal}
					onOpenUserClassModal={onOpenUserClassModal}
					onDeleteDashboardItem={onDeleteDashboardItem}
					onSetTableDateRanges={onSetTableDateRanges}
					onSetTableQuickDateRanges={onSetTableQuickDateRanges}
					onLoadTableChart2Data={onLoadTableChart2Data}
				/>
			);

		default:
			// For top type and any other types
			return (
				<TopItem
					item={item}
					tableData={tableData}
					loading={loading}
					currentUser={currentUser}
					deleteLoading={deleteLoading}
					deletingItemId={deletingItemId}
					onOpenEditModal={onOpenEditModal}
					onOpenUserClassModal={onOpenUserClassModal}
					onDeleteDashboardItem={onDeleteDashboardItem}
					onLoadTopData={onLoadTopData}
					formatCurrency={formatCurrency}
				/>
			);
	}
};

export default DashboardItemRenderer;
