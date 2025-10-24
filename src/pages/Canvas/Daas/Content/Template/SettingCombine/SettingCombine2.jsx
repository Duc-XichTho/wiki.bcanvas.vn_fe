import { Button, Checkbox, Col, Input, Modal, Popconfirm, Row, Select, Spin } from 'antd';
import React, { useEffect, useState, useMemo } from 'react';
import {
	getAllTemplateTables,
	getTemplateColumn,
	updateTemplateTable,
} from '../../../../../../apis/templateSettingService.jsx';
import { getFileNotePadByIdController } from '../../../../../../apis/fileNotePadService.jsx';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams } from 'react-router-dom';

const { Search } = Input;

export default function SettingCombine2({
											showSettingsChartPopup,
											setShowSettingsChartPopup,
											templateData,
											fetchData,
										}) {
	const [listTemp, setListTemp] = useState([]);
	const [selectedTemplates, setSelectedTemplates] = useState({});
	const [joinConditions, setJoinConditions] = useState([]);
	const [selectedFields, setSelectedFields] = useState({
		template1: null,
		field1: null,
		template2: null,
		field2: null,
	});
	const [currentStep, setCurrentStep] = useState(1); // Quản lý bước hiện tại: 1 = Bước 1, 2 = Bước 2, 3 = Bước 3
	const [sortColumn, setSortColumn] = useState(null); // Cột để sắp xếp
	const [sortOrder, setSortOrder] = useState('ascend');
	const [computedColumns, setComputedColumns] = useState([]);
	const [groupColumn, setGroupColumn] = useState(null);
	const [valueColumn, setValueColumn] = useState([]);
	const [groupFunc, setGroupFunc] = useState('sum');
	const [filterConditions, setFilterConditions] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [isJoinTable, setIsJoinTable] = useState(false);
	const [isJoinTable2, setIsJoinTable2] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selectedTemplateNames, setSelectedTemplateNames] = useState({});


	const filteredTemplates = useMemo(() => {
		if (!searchTerm.trim()) {
			return listTemp;
		}
		return listTemp.filter(template =>
			template.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [listTemp, searchTerm]);


	useEffect(() => {
		if (listTemp.length === 0)  {
			setLoading(false);

			return;
		}
		const timeout = setTimeout(() => {
			setLoading(false);
		}, 250);

		return () => clearTimeout(timeout);
	}, [filteredTemplates, listTemp]);



	function getAllColumnNames() {
		return Object.values(selectedTemplates).flat();
	}

	async function getAllTemplate() {
		let data = await getAllTemplateTables();
		data = data.filter(item => !item.isCombine);
		for (const item of data) {
			if (typeof item !== 'object' || item === null) {
				continue;
			}
			let fileNote = await getFileNotePadByIdController(item.fileNote_id);
			item.name = fileNote?.name;
			item.value = 'TEMP_' + item.id;
			item.type = fileNote.table;
			let columns = await getTemplateColumn(item.id);
			item.fields = columns.map(col => ({
				headerName: col.columnName,
				field: col.columnName,
				type: col.columnType,
			}));
		}
		data = data.filter(item => item.type === 'Template');
		setListTemp(data);
	}

	useEffect(() => {
		setLoading(true);
		getAllTemplate();
	}, []);


	useEffect(() => {
		if (templateData?.setting) {
			setJoinConditions(templateData.setting.joinConditions || []);
			setSortColumn(templateData.setting.sortColumn || null);
			setSortOrder(templateData.setting.sortOrder || 'ascend');
			setSelectedTemplates(templateData.setting.selectedTemplates || {});
			setSelectedTemplateNames(templateData.setting.selectedTemplateNames || {});
			setComputedColumns(templateData.setting.computedColumns || []);
			setGroupColumn(templateData.setting.groupColumn || null);
			setGroupFunc(templateData.setting.groupFunc || null);
			setValueColumn(templateData.setting.valueColumn || null);
			setFilterConditions(templateData.setting.filterConditions || []);
			setIsJoinTable(templateData.setting.isJoinTable || false);
			setIsJoinTable2(templateData.setting.isJoinTable2 || false);

		}
	}, [templateData]);

	const handleTemplateSelection = (id) => {
		const template = listTemp.find(t => t.id === id);
		setSelectedTemplates(prev => ({
			...prev,
			[id]: prev[id] ? undefined : [],
		}));
		setSelectedTemplateNames(prev => {
			if (prev[id]) {
				const newObj = { ...prev };
				delete newObj[id];
				return newObj;
			} else {
				return { ...prev, [id]: template?.name };
			}
		});
	};

	const handleConditionChange = (index, type, value) => {
		const newConditions = [...joinConditions];
		newConditions[index] = {
			...newConditions[index],
			[type]: value,
		};
		setJoinConditions(newConditions);
	};

	const handleFieldSelection = (templateId, field) => {
		setSelectedTemplates(prev => {
			const selectedFields = prev[templateId] || [];
			const newFields = selectedFields.includes(field)
				? selectedFields.filter(f => f !== field)
				: [...selectedFields, field];
			return { ...prev, [templateId]: newFields };
		});
	};

	const handleAddCondition = () => {
		setJoinConditions(prev => [...prev, {
			template1: selectedFields.template1,
			field1: selectedFields.field1,
			template2: selectedFields.template2,
			field2: selectedFields.field2,
			joinType: selectedFields.joinType || 'LEFT', // <-- bổ sung
		}]);
		setSelectedFields({}); // reset chọn
	};

	const handleRemoveCondition = (index) => {
		const newConditions = [...joinConditions];
		newConditions.splice(index, 1);
		setJoinConditions(newConditions);
	};

	const handleAddFilterCondition = () => {
		setFilterConditions([...filterConditions, {
			column: '',
			operator: '=',
			value: '',
			logicalOperator: 'AND',
		}]);
	};

	// Hàm xử lý cập nhật điều kiện lọc
	const handleUpdateFilterCondition = (index, field, value) => {
		const newConditions = [...filterConditions];
		newConditions[index] = {
			...newConditions[index],
			[field]: value,
		};
		setFilterConditions(newConditions);
	};

	// Hàm xóa điều kiện lọc
	const handleRemoveFilterCondition = (index) => {
		const newConditions = filterConditions.filter((_, i) => i !== index);
		// Nếu xóa phần tử và còn phần tử khác, đảm bảo phần tử đầu không có logicalOperator
		if (newConditions.length > 0) {
			newConditions[0] = {
				...newConditions[0],
				logicalOperator: null, // hoặc delete newConditions[0].logicalOperator
			};
		}
		setFilterConditions(newConditions);
	};


	const handleSaveSettings = async () => {
		let finalComputedColumns = computedColumns;

		if (isJoinTable || isJoinTable2) {
			const commonColumns = getCommonColumns();
			finalComputedColumns = commonColumns.map(col => ({ field: col }));

			if (isJoinTable2) {
				const additionalColumns = Array.from({ length: 12 }, (_, i) => ({
					field: String(i + 1),
				}));
				finalComputedColumns = [...finalComputedColumns, ...additionalColumns];
			}
		}

		const isJoinMode = isJoinTable || isJoinTable2;

		await updateTemplateTable({
			...templateData,
			isCombine: true,
			setting: {
				joinConditions: isJoinMode ? [] : joinConditions,
				sortColumn: isJoinMode ? null : sortColumn,
				sortOrder: isJoinMode ? 'ascend' : sortOrder,
				selectedTemplates,
				selectedTemplateNames,
				computedColumns: finalComputedColumns,
				groupColumn: isJoinMode ? null : groupColumn,
				valueColumn: isJoinMode ? null : valueColumn,
				groupFunc: isJoinMode ? null : groupFunc,
				filterConditions: isJoinMode ? [] : filterConditions,
				isJoinTable,
				isJoinTable2,
			},
		});

		await fetchData();
		setShowSettingsChartPopup(false);
	};

	const handleSelectAllFields = (templateId, fields) => {
		const allFieldKeys = fields.map(field => field.field);
		const isAllSelected =
			selectedTemplates[templateId]?.length === allFieldKeys.length;

		setSelectedTemplates(prev => ({
			...prev,
			[templateId]: isAllSelected ? [] : allFieldKeys,
		}));
	};

	const getCommonColumns = () => {
		const selectedIds = Object.keys(selectedTemplates);
		if (selectedIds.length === 0) return [];

		const selectedTemplatesData = selectedIds.map(id =>
			listTemp.find(t => t.id === Number(id)),
		).filter(Boolean);
		const columnSets = selectedTemplatesData.map(template =>
			new Set(template.fields.map(f => f.field)),
		);
		// Lấy giao nhau của tất cả các tập cột
		return Array.from(columnSets.reduce((acc, set) =>
			new Set([...acc].filter(x => set.has(x))),
		));
	};



	return (
		<Modal
			open={showSettingsChartPopup}
			onCancel={() => setShowSettingsChartPopup(false)}
			width={1300}
			title={
				<span>Ghép bảng</span>
			}
			footer={
				!loading && (
					<div style={{ textAlign: 'right' }}>
						<Button type="primary" onClick={handleSaveSettings}>
							Lưu cài đặt
						</Button>
					</div>
				)
			}

			centered={true}
			style={{ padding: '20px', overflow: 'auto' }}
		>
			{
				loading ?
					<Spin spinning={loading}>
						<div style={{ height: '70vh'}}>
						</div>
					</Spin>
					:

				<div style={{ height: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
					<div>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 16,
								marginBottom: 10,
								flexWrap: 'wrap',
							}}
						>
							<span style={{ fontSize: 18, fontWeight: 600 }}>Bước 1: Chọn bảng dữ liệu</span>
							<Input
								placeholder='Tìm bảng dữ liệu...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								allowClear
								style={{ width: 250 }}
							/>
						</div>

						<div
							style={{
								padding: 10,
								marginBottom: 20,
								display: 'grid',
								gridTemplateColumns: 'repeat(3, 1fr)',
								gap: '8px 16px',
							}}
						>
							{filteredTemplates.map((template) => (
								<Checkbox
									key={template.id}
									checked={!!selectedTemplates[template.id]}
									onChange={() => handleTemplateSelection(template.id)}
									style={{
										display: 'flex',
										alignItems: 'center',
										whiteSpace: 'nowrap',
									}}
								>
									{template.name}
								</Checkbox>
							))}
						</div>

					</div>
					{/*End 1*/}
					<Checkbox
						checked={isJoinTable}
						onChange={(e) => {
							setIsJoinTable(e.target.checked)
							setIsJoinTable2(false)
						}}
					>
						<span style={{ fontWeight: 'bold' }}>* Nối bảng lấy cột chung</span>
					</Checkbox>
					<Checkbox
						checked={isJoinTable2}
						onChange={(e) => {
							setIsJoinTable(false)
							setIsJoinTable2(e.target.checked)
						}}
					>
						<span style={{ fontWeight: 'bold' }}>* Nối bảng cho kế hoạch</span>
					</Checkbox>

					{!isJoinTable && !isJoinTable2 && (
						<>
							<div style={{ marginTop: '10px' }}>
								<h3>Bước 2: Chọn cột trong bảng dữ liệu đã chọn</h3>
								{Object.entries(selectedTemplates).length === 0 ? (
									<p>Chưa có bảng dữ liệu nào được chọn.</p>
								) : (
									Object.entries(selectedTemplates).map(([templateId, selectedFields]) => {
										const template = listTemp.find(t => t.id === Number(templateId));
										if (!template || !Array.isArray(template.fields) || !Array.isArray(selectedFields)) {
											return null;
										}
										return (
											<div
												key={template.id}
												style={{
													border: '1px solid #ddd',
													padding: 10,
													margin: '20px 0',
													borderRadius: 8,
												}}
											>
												<h4>{template.name}</h4>

												<Checkbox
													indeterminate={
														selectedFields.length > 0 && selectedFields.length < template.fields.length
													}
													checked={selectedFields.length === template.fields.length}
													onChange={() => handleSelectAllFields(template.id, template.fields)}
													style={{ fontWeight: 500, marginBottom: 8 }}
												>
													Chọn tất cả
												</Checkbox>

												<div
													style={{
														display: 'grid',
														gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', // tự chia cột
														gap: '8px 16px',
													}}
												>
													{template.fields.map((field) => (
														<Checkbox
															key={field.field}
															checked={selectedFields.includes(field.field)}
															onChange={() => handleFieldSelection(template.id, field.field)}
															style={{
																display: 'flex',
																alignItems: 'center',
																whiteSpace: 'nowrap', // không xuống dòng chữ
															}}
														>
															{field.headerName}
														</Checkbox>
													))}
												</div>
											</div>

										);
									})
								)}
							</div>
							<div style={{ marginTop: '10px' }}>
								<h3>Bước 3: Chọn điều kiện ghép bảng</h3>
								<div style={{ marginTop: 20 }}>
									<div>
										{joinConditions.map((cond, idx) => (
											<div key={idx}>
												<Row gutter={10} style={{ marginBottom: '10px' }}>
													<Col span={4}>
														<Select
															style={{ width: '100%' }}
															value={cond.template1}
															onChange={value => handleConditionChange(idx, 'template1', value)}
														>
															{listTemp.map(t => selectedTemplates[t.id] &&
																<Select.Option key={t.id}
																			   value={t.id}>{t.name}</Select.Option>)}
														</Select>
													</Col>
													<Col span={4}>
														<Select
															style={{ width: '100%' }}
															value={cond.field1}
															onChange={value => handleConditionChange(idx, 'field1', value)}
														>
															{listTemp.find(t => t.id === cond.template1)?.fields.map(f => (
																<Select.Option key={f.field}
																			   value={f.field}>{f.headerName}</Select.Option>
															))}
														</Select>
													</Col>
													<Col span={1}
														 style={{ textAlign: 'center', paddingTop: '8px' }}>=</Col>
													<Col span={4}>
														<Select
															style={{ width: '100%' }}
															value={cond.template2}
															onChange={value => handleConditionChange(idx, 'template2', value)}
														>
															{listTemp.map(t => selectedTemplates[t.id] &&
																<Select.Option key={t.id}
																			   value={t.id}>{t.name}</Select.Option>)}
														</Select>
													</Col>
													<Col span={4}>
														<Select
															style={{ width: '100%' }}
															value={cond.field2}
															onChange={value => handleConditionChange(idx, 'field2', value)}
														>
															{listTemp.find(t => t.id === cond.template2)?.fields.map(f => (
																<Select.Option key={f.field}
																			   value={f.field}>{f.headerName}</Select.Option>
															))}
														</Select>
													</Col>
													<Col span={4}>
														<Select
															style={{ width: '100%' }}
															value={cond.joinType || 'LEFT'}
															onChange={value => handleConditionChange(idx, 'joinType', value)}
														>
															<Select.Option value='LEFT'>LEFT JOIN</Select.Option>
															<Select.Option value='RIGHT'>RIGHT JOIN</Select.Option>
															<Select.Option value='FULL'>FULL JOIN</Select.Option>
														</Select>
													</Col>
													<Col span={2}>
														<Popconfirm
															title='Bạn có chắc chắn muốn xóa điều kiện này?'
															onConfirm={() => handleRemoveCondition(idx)}
														>
															<Button type='link' icon={<DeleteIcon />}
																	style={{ padding: 0 }} />
														</Popconfirm>
													</Col>
												</Row>
											</div>
										))}
									</div>

									{/* Form add condition */}
									<Row gutter={10} style={{ marginBottom: '20px' }}>
										<Col span={4}>
											<Select
												placeholder='Chọn template 1'
												style={{ width: '100%' }}
												onChange={value => setSelectedFields(prev => ({
													...prev,
													template1: value,
												}))}
												value={selectedFields.template1}
											>
												{listTemp.map(t => selectedTemplates[t.id] &&
													<Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}
											</Select>
										</Col>
										<Col span={4}>
											<Select
												placeholder='Chọn cột 1'
												style={{ width: '100%' }}
												onChange={value => setSelectedFields(prev => ({
													...prev,
													field1: value,
												}))}
												value={selectedFields.field1}
												disabled={!selectedFields.template1}
											>
												{selectedFields.template1 && listTemp.find(t => t.id === selectedFields.template1)?.fields.map(f => (
													<Select.Option key={f.field}
																   value={f.field}>{f.headerName}</Select.Option>
												))}
											</Select>
										</Col>
										<Col span={1} style={{ textAlign: 'center', paddingTop: '8px' }}>=</Col>
										<Col span={4}>
											<Select
												placeholder='Chọn template 2'
												style={{ width: '100%' }}
												onChange={value => setSelectedFields(prev => ({
													...prev,
													template2: value,
												}))}
												value={selectedFields.template2}
											>
												{listTemp.map(t => selectedTemplates[t.id] &&
													<Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}
											</Select>
										</Col>
										<Col span={4}>
											<Select
												placeholder='Chọn cột 2'
												style={{ width: '100%' }}
												onChange={value => setSelectedFields(prev => ({
													...prev,
													field2: value,
												}))}
												value={selectedFields.field2}
												disabled={!selectedFields.template2}
											>
												{selectedFields.template2 && listTemp.find(t => t.id === selectedFields.template2)?.fields.map(f => (
													<Select.Option key={f.field}
																   value={f.field}>{f.headerName}</Select.Option>
												))}
											</Select>
										</Col>
										<Col span={4}>
											<Select
												placeholder='Loại JOIN'
												style={{ width: '100%' }}
												onChange={value => setSelectedFields(prev => ({
													...prev,
													joinType: value,
												}))}
												value={selectedFields.joinType || 'LEFT'}
											>
												<Select.Option value='LEFT'>LEFT JOIN</Select.Option>
												<Select.Option value='RIGHT'>RIGHT JOIN</Select.Option>
												<Select.Option value='FULL'>FULL JOIN</Select.Option>
											</Select>
										</Col>
										<Col span={2}>
											<Button
												type='primary'
												onClick={handleAddCondition}
												style={{ width: '100%' }}
												disabled={!selectedFields.template1 || !selectedFields.field1 || !selectedFields.template2 || !selectedFields.field2}
											>
												+ Điều kiện
											</Button>
										</Col>
									</Row>
								</div>

							</div>
							<div>
								<h3>Bước 3: Chọn cột để sắp xếp</h3>
								<Row gutter={10} style={{ margin: '20px 0' }}>
									<Col span={10}>
										<Select
											placeholder='Chọn cột để sắp xếp'
											style={{ width: '100%' }}
											onChange={value => setSortColumn(value)}
											value={sortColumn}
										>
											{listTemp.map(t =>
												selectedTemplates[t.id] &&
												t.fields.map(f =>
													<Select.Option key={`${t.id}_${f.field}`} value={f.field}>
														{f.headerName}
													</Select.Option>,
												),
											)}
										</Select>
									</Col>
									<Col span={10}>
										<Select
											placeholder='Chọn thứ tự sắp xếp'
											style={{ width: '100%' }}
											onChange={value => setSortOrder(value)}
											value={sortOrder}
										>
											<Select.Option value='ascend'>Tăng dần</Select.Option>
											<Select.Option value='descend'>Giảm dần</Select.Option>
										</Select>
									</Col>
								</Row>

							</div>
							<div>
								<h3>Bước 4: Thiết lập điều kiện lọc cho dữ liệu</h3>
								<div style={{ margin: '20px 0' }}>
									{filterConditions.map((condition, index) => (
										<Row key={index} gutter={10} style={{ marginBottom: '10px' }}>
											<Col span={7}>
												<Select
													style={{ width: '100%' }}
													placeholder='Chọn cột'
													value={condition.column}
													onChange={(value) => handleUpdateFilterCondition(index, 'column', value)}
												>
													{[...getAllColumnNames(), ...computedColumns.map(e => e.columnName)].map(column => (
														<Select.Option key={column} value={column}>
															{column}
														</Select.Option>
													))}
												</Select>
											</Col>

											<Col span={7}>
												<Select
													style={{ width: '100%' }}
													value={condition.operator}
													onChange={(value) => handleUpdateFilterCondition(index, 'operator', value)}
												>
													<Select.Option value='='>=</Select.Option>
													<Select.Option value='!='>≠</Select.Option>
													<Select.Option value='>'>{'>'}</Select.Option>
													<Select.Option value='<'>{'<'}</Select.Option>
													<Select.Option value='>='>≥</Select.Option>
													<Select.Option value='<='>≤</Select.Option>
												</Select>
											</Col>

											<Col span={7}>
												<Input
													placeholder='Nhập giá trị'
													value={condition.value}
													onChange={(e) => handleUpdateFilterCondition(index, 'value', e.target.value)}
												/>
											</Col>

											{index > 0 && (
												<Col span={4}>
													<Select
														style={{ width: '100%' }}
														value={condition.logicalOperator}
														onChange={(value) => handleUpdateFilterCondition(index, 'logicalOperator', value)}
													>
														<Select.Option value='AND'>VÀ (AND)</Select.Option>
														<Select.Option value='OR'>HOẶC (OpenRouter)</Select.Option>
													</Select>
												</Col>
											)}

											<Col span={2}>
												<Button
													type='link'
													icon={<DeleteIcon
														style={{ color: '#1890ff' }} />} // màu xanh giống Ant Design primary
													onClick={() => handleRemoveFilterCondition(index)}
													style={{ padding: 0 }}
												/>
											</Col>
										</Row>
									))}

									<Button
										type='dashed'
										onClick={handleAddFilterCondition}
										style={{ width: '100%', marginTop: '10px' }}
									>
										+ Thêm điều kiện lọc
									</Button>
								</div>
							</div>
						</>
					)}

				</div>
					}


		</Modal>
	);
}
