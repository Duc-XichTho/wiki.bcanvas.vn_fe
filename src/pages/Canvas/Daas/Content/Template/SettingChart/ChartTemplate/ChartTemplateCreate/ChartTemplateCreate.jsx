import React, { useContext, useEffect, useState } from 'react';
import { Alert, Button, Input, message, Radio, Select, Switch } from 'antd'; // Thêm Input và Switch
import { createNewChartTemplate } from '../../../../../../../../apis/chartTemplateService.jsx';
import { createTimestamp } from '../../../../../../../../generalFunction/format.js';
import { getCurrentUserLogin } from '../../../../../../../../apis/userService.jsx';
import css from './ChartTemplateCreate.module.css';
import { MyContext } from '../../../../../../../../MyContext.jsx';
import ChartTemplateElementPreview from '../ChartTemplateElement/ChartTemplateElementPreview.jsx';
import HuongDanChartTemplateCreate from './HuongDanChartTemplateCreate.jsx';

export default function ChartTemplateCreate({ colDefs, templateData }) {
	const [selectedChart, setSelectedChart] = useState('pie');
	const [selectedColumns, setSelectedColumns] = useState({ v1: null, v2: null, v3: null, v4: null, v5: null, v6: [] });
	const [chartName, setChartName] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [conditions, setConditions] = useState([]);
	const [sort, setSort] = useState(false);
	const [preview, setPreview] = useState(false);
	const [previewItem, setPreviewItem] = useState(null);
	const [combinedColDefs, setCombinedColDefs] = useState([]);
	const [showTutorial, setShowTutorial] = useState(true);
	const { currentUser, uCSelected_CANVAS, listUC_CANVAS, loadData, setLoadData } = useContext(MyContext);

	useEffect(() => {
		if (!showTutorial) {
			setPreviewItem({
				type: selectedChart,
				name: chartName,
				conditions,
				v1: selectedColumns.v1,
				v2: selectedColumns.v2,
				v3: selectedColumns.v3,
				v4: selectedColumns.v4,
				v5: selectedColumns.v5,
				v6: selectedColumns.v6,
				isSort: sort,
				id_template: templateData.id,
				id_filenote: templateData.fileNote_id,
			});
			setPreview(true);
		}
	}, [showTutorial, selectedChart, chartName, conditions, selectedColumns, sort, templateData]);

	const handleChartChange = (e) => {
		setSelectedChart(e.target.value);
		setSelectedColumns({ v1: null, v2: null, v3: null, v4: null, v5: null, v6: [] });
		setErrorMessage('');
	};
	useEffect(() => {
		setCombinedColDefs(getAllCols());
	}, [templateData, colDefs]);

	function getAllCols() {
		if (templateData?.isCombine) {
			let cols = []
			if (templateData.setting?.isJoinTable || templateData.setting?.isJoinTable2) {
				const computedColumns = templateData.setting?.computedColumns || [];
				cols = computedColumns.map(col => ({
					headerName: col.field,
					field: col.field,
				}));
			} else {
				const selectedTemplates = templateData.setting?.selectedTemplates || {};
				const computedColumns = templateData.setting?.computedColumns || [];
				const allColumns = Object.values(selectedTemplates).flat();
				const computedColumnDefs = computedColumns.map(col => ({
					headerName: col.columnName,
					field: col.columnName,
				}));
				cols = [...allColumns.map(col => ({ headerName: col, field: col })), ...computedColumnDefs];
				try {
					if (templateData?.setting.valueColumn && templateData?.setting.groupFunc) {
						templateData?.setting.valueColumn.map(valueCol => {
							let col = `${valueCol} (${templateData?.setting.groupFunc.toUpperCase()})`;
							cols.push({ headerName: col, field: col });
						});
					}
				} catch (e) {
					console.log(e);
				}
			}
			return cols;
		}
		return colDefs;
	}


	const handleColumnChange = (value, field) => {
		setShowTutorial(true);
		setSelectedColumns(prev => ({ ...prev, [field]: value }));
	};

	const getColumnLimit = () => {
		switch (selectedChart) {
			case 'pie':
			case 'map':
			case 'waterfall':
			case 'funnel':
				return 2;
			case 'combine':
				return 5;
			case 'bubble':
				return 4;
			case 'line':
			case 'area':
			case 'stackedBar':
			case 'normalisedBar':
			case 'bar':
			case 'horizontalBar':
			case 'heatmap':
			case 'radar':
				return 3;
			default:
				return 0;
		}
	};

	const handleCreateChart = async () => {
		const { data } = await getCurrentUserLogin();
		const { v1, v2, v3, v4, v5, v6 } = selectedColumns;

		if (!chartName.trim()) {
			setErrorMessage('Vui lòng nhập tên biểu đồ.');
			return;
		}

		const requestData = {
			type: selectedChart,
			name: chartName,
			conditions,
			v1,
			v2,
			v3,
			v4,
			v5,
			v6,
			isSort: sort,
			updated_at: createTimestamp(),
			user_update: data.email,
			id_template: templateData.id,
			id_filenote: templateData.fileNote_id,
		};

		try {
			let newChart = await createNewChartTemplate(requestData);
			setLoadData(prev => !prev);
			message.success('Tạo biểu đồ thành công!');
			setLoadData(!loadData);
			setSelectedColumns({ v1: null, v2: null, v3: null, v4: null, v5: null, v6: [] });
			setChartName('');
		} catch (error) {
			message.error('Đã xảy ra lỗi khi tạo biểu đồ. Vui lòng thử lại!');
		}
	};

	const handleAddCondition = () => {
		setConditions([...conditions, { field: null, operator: '=', value: '', logic: 'AND' }]);
	};

	const handleConditionChange = (index, key, value) => {
		const newConditions = [...conditions];
		newConditions[index][key] = value;
		setConditions(newConditions);
	};

	const handleRemoveCondition = (index) => {
		setConditions(conditions.filter((_, i) => i !== index));
	};

	return (
		<div className={css.container}>
			<div className={css.contentContainer}>
				<div className={css.columnSelection}>
					<h3>Chọn loại biểu đồ</h3>

					<Radio.Group
						onChange={handleChartChange}
						value={selectedChart}
						className={css.chartOptions}
					>
						<Radio value="pie">Pie Chart</Radio>
						<Radio value="line">Line Chart</Radio>
						<Radio value="stackedBar">Stacked Bar</Radio>
						<Radio value="bar">Bar</Radio>
						<Radio value="area">Area</Radio>
						<Radio value="bubble">Bubble</Radio>
						{/*<Radio value="horizontalBar">Horizontal Bar</Radio>*/}
						<Radio value="normalisedBar">Normalised Bar</Radio>
						<Radio value="heatmap">Heat Map</Radio>
						<Radio value="waterfall">Waterfall</Radio>
						<Radio value="combine">Combine</Radio>
						<Radio value="funnel">Funnel</Radio>
						<Radio value="map">Map</Radio>
						<Radio value="radar">Radar</Radio>
					</Radio.Group>
					<h3>Chọn cột dữ liệu</h3>

					<div className={css.selectField}>
						<label>Tên :</label>
						<Input
							value={chartName}
							onChange={(e) => setChartName(e.target.value)}
							placeholder="Nhập tên"
						/>
					</div>
					{(getColumnLimit() === 3 || getColumnLimit() === 5) && (
						<div className={css.selectField}>
							<label>Cột X:</label>
							<Select
								options={combinedColDefs
									.filter(col => col.field !== 'delete')
									.map(col => ({
										label: col.headerName,
										value: col.field,
									}))}
								value={selectedColumns.v1}
								onChange={(value) => handleColumnChange(value, 'v1')}
								placeholder="Chọn cột dữ liệu làm chiều ngang của chart"
								style={{ width: '100%' }}
								showSearch
								filterOption={(input, option) =>
									option.label.toLowerCase().includes(input.toLowerCase())
								}
							/>

						</div>
					)}
					{(getColumnLimit() !== 4) && (
						<>
							<div className={css.selectField}>
								<label>Cột gom dữ liệu:</label>
								<Select
									options={[
										{ label: 'Không chọn', value: null }, // lựa chọn rỗng
										...combinedColDefs
											.filter(col => col.field !== 'delete')
											.map(col => ({
												label: col.headerName,
												value: col.field,
											})),
									]}
									value={selectedColumns.v2}
									onChange={(value) => handleColumnChange(value, 'v2')}
									placeholder="Chọn cột gom dữ liệu"
									style={{ width: '100%' }}
									showSearch
									filterOption={(input, option) =>
										option.label.toLowerCase().includes(input.toLowerCase())
									}
								/>

							</div>
							<div className={css.selectField}>
								<label>Cột giá trị:</label>
								{(selectedChart === 'line' || selectedChart === 'bar' || selectedChart === 'stackedBar' || selectedChart === 'normalisedBar') ? (
									<>
										{!selectedColumns.v2 ? (
											<>
												<Select
													mode="multiple"
													options={combinedColDefs
														.filter(col => col.field !== 'delete')
														.map(col => ({
															label: col.headerName,
															value: col.field,
														}))}
													value={selectedColumns.v6}
													onChange={(value) => handleColumnChange(value, 'v6')}
													placeholder="Chọn cột giá trị"
													style={{ width: '100%' }}
													showSearch
													filterOption={(input, option) =>
														option.label.toLowerCase().includes(input.toLowerCase())
													}
												/>
												<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
													Hỗ trợ chọn nhiều trường giá trị
												</div>
											</>
										) : (
											<Select
												options={combinedColDefs
													.filter(col => col.field !== 'delete')
													.map(col => ({
														label: col.headerName,
														value: col.field,
													}))}
												value={selectedColumns.v3}
												onChange={(value) => handleColumnChange(value, 'v3')}
												placeholder="Chọn cột giá trị"
												style={{ width: '100%' }}
												showSearch
												filterOption={(input, option) =>
													option.label.toLowerCase().includes(input.toLowerCase())
												}
											/>
										)}
									</>
								) : (
									<Select
										options={combinedColDefs
											.filter(col => col.field !== 'delete')
											.map(col => ({
												label: col.headerName,
												value: col.field,
											}))}
										value={selectedColumns.v3}
										onChange={(value) => handleColumnChange(value, 'v3')}
										placeholder="Chọn cột giá trị"
										style={{ width: '100%' }}
										showSearch
										filterOption={(input, option) =>
											option.label.toLowerCase().includes(input.toLowerCase())
										}
									/>
								)}
							</div>
						</>
					)}
					{(getColumnLimit() === 4) && (
						<>
							<div className={css.selectField}>
								<label>X:</label>
								<Select
									options={combinedColDefs
										.filter(col => col.field !== 'delete')
										.map(col => ({
											label: col.headerName,
											value: col.field,
										}))}
									value={selectedColumns.v1}
									onChange={(value) => handleColumnChange(value, 'v1')}
									placeholder="Chọn cột giá trị phải"
									style={{ width: '100%' }}
									showSearch
									filterOption={(input, option) =>
										option.label.toLowerCase().includes(input.toLowerCase())
									}
								/>
							</div>
							<div className={css.selectField}>
								<label>Y:</label>
								<Select
									options={combinedColDefs
										.filter(col => col.field !== 'delete')
										.map(col => ({
											label: col.headerName,
											value: col.field,
										}))}
									value={selectedColumns.v2}
									onChange={(value) => handleColumnChange(value, 'v2')}
									placeholder="Chọn cột giá trị phải"
									style={{ width: '100%' }}
									showSearch
									filterOption={(input, option) =>
										option.label.toLowerCase().includes(input.toLowerCase())
									}
								/>
							</div>
							<div className={css.selectField}>
								<label>Size:</label>
								<Select
									options={combinedColDefs
										.filter(col => col.field !== 'delete')
										.map(col => ({
											label: col.headerName,
											value: col.field,
										}))}
									value={selectedColumns.v3}
									onChange={(value) => handleColumnChange(value, 'v3')}
									placeholder="Chọn cột giá trị phải"
									style={{ width: '100%' }}
									showSearch
									filterOption={(input, option) =>
										option.label.toLowerCase().includes(input.toLowerCase())
									}
								/>
							</div>
							<div className={css.selectField}>
								<label>Label:</label>
								<Select
									options={combinedColDefs
										.filter(col => col.field !== 'delete')
										.map(col => ({
											label: col.headerName,
											value: col.field,
										}))}
									value={selectedColumns.v4}
									onChange={(value) => handleColumnChange(value, 'v4')}
									placeholder="Chọn cột giá trị phải"
									style={{ width: '100%' }}
									showSearch
									filterOption={(input, option) =>
										option.label.toLowerCase().includes(input.toLowerCase())
									}
								/>
							</div>
							<div className={css.selectField}>
								<label>Group:</label>
								<Select
									options={combinedColDefs
										.filter(col => col.field !== 'delete')
										.map(col => ({
											label: col.headerName,
											value: col.field,
										}))}
									value={selectedColumns.v5}
									onChange={(value) => handleColumnChange(value, 'v5')}
									placeholder="Chọn cột giá trị phải"
									style={{ width: '100%' }}
									showSearch
									filterOption={(input, option) =>
										option.label.toLowerCase().includes(input.toLowerCase())
									}
								/>
							</div>
						</>
					)}
					{(getColumnLimit() === 5) && (
						<>

							<div className={css.selectField}>
								<label>Cột gom dữ liệu:</label>
								<Select
									options={[
										{ label: 'Không chọn', value: null }, // lựa chọn rỗng
										...combinedColDefs
											.filter(col => col.field !== 'delete')
											.map(col => ({
												label: col.headerName,
												value: col.field,
											})),
									]}
									value={selectedColumns.v4}
									onChange={(value) => handleColumnChange(value, 'v4')}
									placeholder="Chọn cột gom dữ liệu phải"
									style={{ width: '100%' }}
									showSearch
									filterOption={(input, option) =>
										option.label.toLowerCase().includes(input.toLowerCase())
									}
								/>

							</div>

						</>
					)}
					{(selectedChart === 'bar' || selectedChart === 'combine') && (
						<div className={css.selectField}>
							<label>
								<input
									type="checkbox"
									checked={sort}
									onChange={(e) => setSort(e.target.checked)}
								/>
								&nbsp;Sắp xếp dữ liệu (Sort)
							</label>
						</div>
					)}

					<div>
						<h3 style={{ margin: '10px 0' }}>Điều kiện</h3>
						{conditions.map((condition, index) => (
							<div key={index} className={css.conditions}>
								{index !== 0 && (
									<Select
										options={[
											{ label: 'AND', value: 'AND' },
											{ label: 'OR', value: 'OR' },
										]}
										value={condition.logic || 'AND'}
										onChange={(value) => handleConditionChange(index, 'logic', value)}
										className={css.logicSelect}
									/>
								)}
								<Select
									options={combinedColDefs
										.filter(col => col.headerName !== 'Thời gian')
										.map(col => ({ label: col.headerName, value: col.field }))}
									value={condition.field}
									onChange={(value) => handleConditionChange(index, 'field', value)}
									placeholder="Chọn cột"
								/>
								<Select
									options={['<', '>', '<=', '>=', '='].map(op => ({ label: op, value: op }))}
									value={condition.operator}
									onChange={(value) => handleConditionChange(index, 'operator', value)}
								/>
								<Input
									value={condition.value}
									onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
									placeholder="Giá trị"
								/>
								<Button onClick={() => handleRemoveCondition(index)}>Xóa</Button>
							</div>
						))}
						<Button onClick={handleAddCondition}>Thêm điều kiện</Button>
					</div>
				</div>
				<div className={css.preview}>
					<h3>Preview</h3>
					{showTutorial ? (
						<HuongDanChartTemplateCreate />
					) : (
						preview && previewItem && <ChartTemplateElementPreview selectedItem={previewItem} />
					)}
				</div>
			</div>

			{
				errorMessage && (
					<Alert
						message={errorMessage}
						type="warning"
						showIcon
						className={css.alert}
					/>
				)
			}

			<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
				<Button
					type="primary"
					onClick={handleCreateChart}
				>
					Tạo
				</Button>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<Switch
						checked={!showTutorial}
						onChange={(checked) => {
							setShowTutorial(!checked);
							if (checked) {
								setPreviewItem({
									type: selectedChart,
									name: chartName,
									conditions,
									v1: selectedColumns.v1,
									v2: selectedColumns.v2,
									v3: selectedColumns.v3,
									v4: selectedColumns.v4,
									v5: selectedColumns.v5,
									v6: selectedColumns.v6,
									isSort: sort,
									id_template: templateData.id,
									id_filenote: templateData.fileNote_id,
								});
								setPreview(true);
							}
						}}
					/>
					<span>Preview</span>
				</div>
			</div>
		</div>
	)
		;
}
