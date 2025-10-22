import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Modal } from 'antd';

const KHKDChuKy = ({ }) => {
	const jsonData = logYearDataAsJson();

	const rowData = generateRowDataFromJson(jsonData);

	const columnDefs = useMemo(() => {
		const columns = [
			{ headerName: 'Month', field: 'month', pinned: 'left', editable: false },
		];

		// Add columns for up to 31 days
		for (let day = 1; day <= 31; day++) {
			columns.push({
				headerName: `Day ${day}`,
				field: `day_${day}`,
				editable: true,
			});
		}

		return columns;
	}, []);

	function generateRowDataFromJson(jsonData) {
		const rows = [];

		jsonData.forEach((monthData) => {
			const monthRow = { month: `Tháng ${monthData.month}`, type: 'non-editable' };

			// Populate weekday data for each day
			for (let day = 1; day <= 31; day++) {
				monthRow[`day_${day}`] = monthData[day] || ''; // Use empty string if no data for the day
			}

			rows.push(monthRow);

			// Add an editable row below the month
			const editableRow = { month: `Tháng ${monthData.month}`, type: 'editable' };
			for (let day = 1; day <= 31; day++) {
				editableRow[`day_${day}`] = ''; // Empty cells for user input
			}

			rows.push(editableRow);
		});

		return rows;
	}

	function logYearDataAsJson() {
		const currentYear = new Date().getFullYear();
		const yearData = [];

		for (let month = 0; month < 12; month++) {
			const daysInMonth = new Date(currentYear, month + 1, 0).getDate();

			for (let day = 1; day <= daysInMonth; day++) {
				const date = new Date(currentYear, month, day);
				yearData.push({
					day: day,
					month: date.toLocaleString('vi-VN', { month: 'long' }),
					weekday: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
				});
			}
		}

		const grouped = {};

		yearData.forEach(({ day, month, weekday }) => {
			const monthNum = parseInt(month.replace('Tháng ', ''));
			if (!grouped[monthNum]) {
				grouped[monthNum] = { month: monthNum };
			}
			grouped[monthNum][day] = weekday;
		});
		console.log(grouped);
		return Object.values(grouped);
	}

	logYearDataAsJson();

	return (
		<>
			<Modal>
				<div className="ag-theme-quartz" style={{ width: '100%', overflow: 'auto' }}>
					<AgGridReact
						rowData={rowData}
						columnDefs={columnDefs}
						defaultColDef={{
							resizable: true,
							sortable: true,
							filter: true,
							editable: (params) => params.data.type === 'editable', // Make only editable rows editable
						}}
						domLayout="autoHeight"
					/>
				</div>
			</Modal>
		</>

	);
};

export default KHKDChuKy;
