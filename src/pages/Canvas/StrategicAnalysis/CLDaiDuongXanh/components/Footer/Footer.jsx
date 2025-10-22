import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Input } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import css from './Footer.module.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AgChartCus from './AgChartCus.jsx';
import { AgCharts } from 'ag-charts-react';
import { fetchDataColor } from '../../../../Daas/Content/Template/SettingChart/ChartTemplate/setChartTemplate';
import { createSetting, updateSetting, getSettingByType } from '../../../../../../apis/settingService';

const EditableHeader = ({ displayName, column, setColumnDefs, columnDefs, isEditing }) => {
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(displayName);

	const handleDoubleClick = () => {
		if (isEditing) {
			setEditing(true);
		}
	};

	const handleBlur = () => {
		setEditing(false);
		setColumnDefs(
			columnDefs.map((col) =>
				col.field === column.colId ? { ...col, headerName: name } : col,
			),
		);
	};

	return editing ? (
		<input
			type="text"
			value={name}
			onChange={(e) => setName(e.target.value)}
			onBlur={handleBlur}
			autoFocus
		/>
	) : (
		<span onDoubleClick={handleDoubleClick}>{name}</span>
	);
};

const CompetitiveFactorsGrid = () => {
	const [options, setOptions] = useState(null);
	const [rowData, setRowData] = useState([]);
	const [columnDefs, setColumnDefs] = useState([]);
	const [isEditing, setIsEditing] = useState(false);
	const [showSettingsChartPopup, setShowSettingsChartPopup] = useState(false);
	const [activeTab, setActiveTab] = useState('columns');
	const [fills, setColors] = useState([]);
	const [settingId, setSettingId] = useState(null);
	const [hasSetting, setHasSetting] = useState(false);

	// Function to ensure styling is applied to column definitions
	const applyColumnStyling = (columns) => {
		return columns.map(col => ({
			...col,
			getHeaderCellStyle: () => ({
				whiteSpace: 'normal',
				wordWrap: 'break-word',
			}),
		}));
	};

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const response = await getSettingByType('competitive_factors');
				if (response && response.setting) {
					setRowData(response.setting.rowData || [
						{ company: 'Công ty 1' },
						{ company: 'Công ty 2' },
						{ company: 'Công ty 3' },
						{ company: 'Công ty 4' },
						{ company: 'Công ty 5' },
					]);
					const savedColumnDefs = response.setting.columnDefs;
					const defaultColumnDefs = [
						{
							headerName: 'Company',
							field: 'company',
							pinned: 'left',
							flex: 1,
							editable: false,
							cellEditor: 'agNumberCellEditor',
							cellEditorParams: {
								min: 0,
								max: 100,
							},
						},
						...Array.from({ length: 7 }, (_, i) => ({
							headerName: `Yếu tố cạnh tranh ${i + 1}`,
							field: `factor${i + 1}`,
							editable: true,
							flex: 1,
							headerComponent: EditableHeader,
							headerComponentParams: { isEditing: false },
						})),
					];
					const columnsWithStyling = applyColumnStyling(savedColumnDefs || defaultColumnDefs);
					setColumnDefs(columnsWithStyling);
					setSettingId(response.id);
					setHasSetting(true); // Mark that a setting exists
				} else {
					// Default data if no settings exist
					const defaultRowData = [
						{ company: 'Công ty 1' },
						{ company: 'Công ty 2' },
						{ company: 'Công ty 3' },
						{ company: 'Công ty 4' },
						{ company: 'Công ty 5' },
					];
					const defaultColumnDefs = [
						{
							headerName: 'Company',
							field: 'company',
							pinned: 'left',
							flex: 1,
							editable: false,
							cellEditor: 'agNumberCellEditor',
							cellEditorParams: {
								min: 0,
								max: 5,
							},
						},
						...Array.from({ length: 7 }, (_, i) => ({
							headerName: `Yếu tố cạnh tranh ${i + 1}`,
							field: `factor${i + 1}`,
							editable: true,
							flex: 1,
							headerComponent: EditableHeader,
							headerComponentParams: { isEditing: false },
						})),
					];
					const columnsWithStyling = applyColumnStyling(defaultColumnDefs);
					setRowData(defaultRowData);
					setColumnDefs(columnsWithStyling);
					setHasSetting(false); // No setting exists yet
				}
			} catch (error) {
				console.error('Error fetching settings:', error);
			}
		};

		fetchSettings();
	}, []);

	useEffect(() => {
		// Fetch color data
		const fetchColors = async () => {
			try {
				const data = await fetchDataColor();
				setColors(data); // Store fetched colors
			} catch (error) {
				console.error('Error fetching color data:', error);
			}
		};

		fetchColors();
	}, []);

	// Save settings to the server
	const saveSettings = async () => {
		const settingsData = {
			id: settingId,
			type: 'competitive_factors',
			setting: {
				rowData,
				columnDefs,
			},
		};

		try {
			if (hasSetting) {
				// Update existing setting
				await updateSetting(settingsData);
			} else {
				// Create new setting
				const response = await createSetting({
					type: 'competitive_factors',
					setting: {
						rowData,
						columnDefs,
					},
				});
				setSettingId(response.id); // Store the new setting ID
				setHasSetting(true); // Mark that a setting now exists
			}
		} catch (error) {
			console.error('Error saving settings:', error);
		}
	};

	// Save settings whenever rowData or columnDefs change
	useEffect(() => {
		if (rowData.length > 0 && columnDefs.length > 0) {
			saveSettings();
		}
	}, [rowData, columnDefs]);

	const transformData = (data, columnMap) => {
		const companies = data.map(item => item.company);
		const factorIndexes = Object.keys(data[0]).filter(key => key.startsWith('factor')).map(key => key.replace('factor', ''));

		return factorIndexes.map(factorIndex => {
			const seriesItem = { x: columnMap[`factor${factorIndex}`] || `Factor ${factorIndex}` }; // Trục X là tên factory từ columnMap
			companies.forEach(company => {
				const companyData = data.find(item => item.company === company);
				const factorKey = `factor${factorIndex}`;
				seriesItem[company] = parseInt(companyData[factorKey], 10);
			});
			return seriesItem;
		});
	};

	useEffect(() => {
		if (rowData && columnDefs && rowData[0] && fills.length > 0) {
			const columnMap = columnDefs.reduce((acc, col) => {
				if (col.field.startsWith('factor')) {
					acc[col.field] = col.headerName;
				}
				return acc;
			}, {});
			let chartData = transformData(rowData, columnMap);
			if (chartData[0]) {
				const options = {
					data: chartData,
					series: Object.keys(chartData[0])
						.filter(key => key !== 'x')
						.map((company, index) => ({
							xKey: 'x',
							yKey: company,
							title: company,
							type: 'line',
							stroke: fills[index % fills.length], // Use fetched colors
							marker: {
								enabled: true,
								fill: fills[index % fills.length], // Use fetched colors for marker
							},
							interpolation: {
								type: 'smooth',
							},
						})),
					axes: [
						{ type: 'category', position: 'bottom', title: { text: 'Factory' } },
						{ type: 'number', position: 'left', title: { text: 'Factors' } },
					],
					theme: 'ag-vivid',
					legend: {
						position: 'top',
						label: {
							color: "#262626",
							fontFamily: "Reddit Sans, sans-serif",
							fontWeight: "500",
						}
					},
				};
				setOptions(options);
			}
		}
	}, [rowData, columnDefs, fills]);

	const addCompany = () => {
		const newCompany = `Công ty ${rowData.length + 1}`;
		setRowData([...rowData, { company: newCompany }]);
	};

	const addFactor = () => {
		const newFactorIndex = columnDefs.length;
		const newFactor = {
			headerName: `Yếu tố cạnh tranh ${newFactorIndex}`,
			field: `factor${newFactorIndex}`,
			editable: true,
			flex: 1,
			headerComponent: EditableHeader,
			headerComponentParams: { isEditing },
		};
		setColumnDefs([...columnDefs, ...applyColumnStyling([newFactor])]);
	};

	const deleteCompany = (index) => {
		if (window.confirm('Bạn có chắc muốn xoá hàng này không?')) {
			const newRowData = rowData.filter((_, i) => i !== index);
			setRowData(newRowData);
		}
	};

	const copyCompany = (index) => {
		const companyToCopy = rowData[index];
		const newCompany = { ...companyToCopy, company: `${companyToCopy.company} (Copy)` };
		setRowData([...rowData, newCompany]);
	};

	const deleteColumn = (index) => {
		if (window.confirm('Bạn có chắc muốn xoá cột này không?')) {
			const columnToDelete = columnDefs[index].field;

			const newColumnDefs = columnDefs.filter((_, i) => i !== index);
			setColumnDefs(newColumnDefs);

			const newRowData = rowData.map(row => {
				const { [columnToDelete]: _, ...rest } = row;
				return rest;
			});
			setRowData(newRowData);
		}
	};

	const copyColumn = (index) => {
		const columnToCopy = columnDefs[index];
		const newColumn = {
			...columnToCopy,
			headerName: `${columnToCopy.headerName} (Copy)`,
			headerComponentParams: { isEditing },
		};
		const newColumnWithStyling = applyColumnStyling([newColumn])[0];
		setColumnDefs([...columnDefs, newColumnWithStyling]);
	};

	const handleCellValueChanged = (params) => {
		const updatedRowData = [...rowData];
		updatedRowData[params.node.rowIndex] = params.data;
		setRowData(updatedRowData);
	};

	return (
		<div className={css.main}>
			<div style={{ height: '320px'}}>
				<AgCharts options={options} />
			</div>
			<div className={css.header}>
				<h2 className={css.title}>TỔNG HỢP CÁC YẾU TỐ CẠNH TRANH TRONG NGÀNH</h2>
				<Button onClick={() => setShowSettingsChartPopup(true)}>
					{isEditing ? 'Lưu cấu hình' : 'Cấu hình (Yếu tố cạnh tranh)'}
				</Button>
			</div>
			{isEditing && (
				<div style={{ marginBottom: '10px' }}>
					<Button onClick={addCompany} style={{ backgroundColor: '#259c63', color: 'white' }}>Thêm công
						ty</Button>
					<Button onClick={addFactor} style={{ backgroundColor: '#259c63', color: 'white' }}>Thêm yếu tố cạnh
						tranh</Button>
				</div>
			)}
			<div className="ag-theme-quartz"
				 style={{ height: 250, width: '100%', '--ag-border-color': 'white', '--ag-row-border-color': 'white' }}>
				<AgGridReact
					rowData={rowData}
					columnDefs={columnDefs}
					defaultColDef={{ resizable: true, sortable: true, suppressMenu: true, wrapHeaderText: true, autoHeaderHeight: true, }}
					frameworkComponents={{ EditableHeader }}
					onCellValueChanged={handleCellValueChanged}
					getRowStyle={() => ({ fontFamily: 'Reddit Sans, sans-serif' })}
					getCellStyle={() => ({ fontFamily: 'Reddit Sans, sans-serif', color: '#262626' })}
					enableRangeSelection={true}
				/>
			</div>
			<Modal
				open={showSettingsChartPopup}
				onCancel={() => setShowSettingsChartPopup(false)}
				width={1300}
				title={`Setting Chart`}
				footer={false}
				style={{
					body: {
						padding: 0,
						margin: 0,
						height: '70vh',
						overflow: 'auto',
					},
				}}
			>
				<Tabs activeKey={activeTab} onChange={setActiveTab}>
					<Tabs.TabPane tab="Cột" key="columns">
						<div style={{ marginBottom: '10px' }}>
							<Button onClick={addFactor} style={{ backgroundColor: '#259c63', color: 'white' }}>Thêm
								cột</Button>
						</div>
						<div>
							{columnDefs.map((col, index) => (
								<div key={index} style={{ display: 'flex', alignItems: 'center' }}>
									<Input
										value={col.headerName}
										onChange={(e) => {
											const newColDefs = [...columnDefs];
											newColDefs[index].headerName = e.target.value;
											setColumnDefs(applyColumnStyling(newColDefs));
										}}
										placeholder="Column Name"
									/>
									<Button onClick={() => copyColumn(index)} style={{
										marginLeft: '10px',
										backgroundColor: '#259c63',
										color: 'white',
									}}>Copy</Button>
									<Button onClick={() => deleteColumn(index)} style={{
										marginLeft: '10px',
										backgroundColor: '#d9534f',
										color: 'white',
									}}>Delete</Button>
								</div>
							))}
						</div>
					</Tabs.TabPane>
					<Tabs.TabPane tab="Hàng" key="rows">
						<div style={{ marginBottom: '10px' }}>
							<Button onClick={addCompany} style={{ backgroundColor: '#259c63', color: 'white' }}>Thêm
								hàng</Button>
						</div>
						<div>
							{rowData.map((row, index) => (
								<div key={index} style={{ display: 'flex', alignItems: 'center' }}>
									<Input
										value={row.company}
										onChange={(e) => {
											const newRowData = [...rowData];
											newRowData[index].company = e.target.value;
											setRowData(newRowData);
										}}
										placeholder="Company Name"
									/>
									<Button onClick={() => copyCompany(index)} style={{
										marginLeft: '10px',
										backgroundColor: '#259c63',
										color: 'white',
									}}>Copy</Button>
									<Button onClick={() => deleteCompany(index)} style={{
										marginLeft: '10px',
										backgroundColor: '#d9534f',
										color: 'white',
									}}>Delete</Button>
								</div>
							))}
						</div>
					</Tabs.TabPane>
				</Tabs>
			</Modal>
		</div>
	);
};

export default CompetitiveFactorsGrid;
