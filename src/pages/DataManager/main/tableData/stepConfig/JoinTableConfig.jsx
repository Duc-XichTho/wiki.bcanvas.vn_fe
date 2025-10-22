import React, { useState, useEffect } from 'react';
import { Card, Select, Space, Divider, Typography, Alert, Input } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { getAllFileNotePad } from '../../../../../apis/fileNotePadService.jsx';
import { getAllTemplateSheetTable } from '../../../../../apis/templateSettingService.jsx';
import { getAllApprovedVersion } from '../../../../../apis/approvedVersionTemp.jsx';

const { Option } = Select;
const { Text } = Typography;

const JoinTableConfig = ({ 
	initialConfig = {}, 
	onChange, 
	availableColumns = [], 
	availableTables = [],
	normalizedSteps = [],
	templateData = null,
	getTemplateRow = null
}) => {
	const [config, setConfig] = useState({
		joinColumns: [
			{ sourceColumn: '', targetColumn: '' } // Cột để nối ở version trước của dữ liệu hiện tại
		], // Tối đa 3 cặp cột để join
		targetTable: '', // Bảng đích để nối
		targetVersion: '', // Version của bảng đích
		joinType: 'inner', // Loại join: inner, left, right, outer
		...initialConfig
	});

	const [targetTableColumns, setTargetTableColumns] = useState([]);
	const [targetTableVersions, setTargetTableVersions] = useState([]);
	const [availableTargetTables, setAvailableTargetTables] = useState([]);
	const [loading, setLoading] = useState(false);

	// Fetch available target tables (similar to DataPermission.jsx)
	useEffect(() => {
		const fetchTargetTables = async () => {
			setLoading(true);
			try {
				const [fileNotesData, templateTablesData, approvedVersionsData] = await Promise.all([
					getAllFileNotePad(),
					getAllTemplateSheetTable(),
					getAllApprovedVersion()
				]);

				// Build target tables structure - show all tables, not just those with approved versions
				const targetTables = [];
				
				fileNotesData.forEach(fileNote => {
					// Find template tables for this file note
					const noteTemplates = templateTablesData.filter(template => template.fileNote_id === fileNote.id);
					
					// Get versions from steps property of template tables
					const versions = [];
					
					noteTemplates.forEach(template => {
						if (template.steps && Array.isArray(template.steps)) {
							template.steps.forEach((step, index) => {
								if (step && step.id) {
									versions.push({
										id: step.id,
										name: `Version ${step.id}`,
										stepData: step,
										template: template
									});
								}
							});
						}
					});
					
					// Create target table entry for each template table, not file note
					noteTemplates.forEach(template => {
						targetTables.push({
							id: template.id.toString(), // Use template.id instead of fileNote.id
							name: `${fileNote.name}`,
							table: fileNote.table,
							versions: versions.filter(v => v.template.id === template.id) // Filter versions for this template
						});
					});
				});

				setAvailableTargetTables(targetTables);
			} catch (error) {
				console.error('Lỗi khi lấy danh sách bảng đích:', error);
				setAvailableTargetTables([]);
			} finally {
				setLoading(false);
			}
		};

		fetchTargetTables();
	}, []);

	useEffect(() => {
		onChange(config);
	}, [config, onChange]);

	// Lấy danh sách version của bảng đích
	useEffect(() => {
		if (config.targetTable) {
			const selectedTable = availableTargetTables.find(table => table.id === config.targetTable);
			if (selectedTable) {
				setTargetTableVersions(selectedTable.versions);
			} else {
				setTargetTableVersions([]);
			}
		} else {
			setTargetTableVersions([]);
		}
	}, [config.targetTable, availableTargetTables]);

	// Lấy danh sách cột của bảng đích
	useEffect(() => {
		if (config.targetTable && config.targetVersion) {
			// Lấy cột từ outputColumns của step được chọn
			const selectedTable = availableTargetTables.find(table => table.id === config.targetTable);
			if (selectedTable) {
				const selectedVersion = selectedTable.versions.find(version => version.id === config.targetVersion);
				if (selectedVersion && selectedVersion.stepData && selectedVersion.stepData.config) {
					const outputColumns = selectedVersion.stepData.config.outputColumns || [];
					const columns = outputColumns.map(col => ({
						name: col.name,
						type: col.type || 'text'
					}));
					setTargetTableColumns(columns);
				} else {
					setTargetTableColumns([]);
				}
			} else {
				setTargetTableColumns([]);
			}
		} else {
			setTargetTableColumns([]);
		}
	}, [config.targetTable, config.targetVersion, availableTargetTables]);

	const handleConfigChange = (key, value) => {
		const newConfig = { ...config, [key]: value };
		
		// Reset các giá trị phụ thuộc khi thay đổi bảng hoặc version
		if (key === 'targetTable') {
			newConfig.targetVersion = '';
			// Reset tất cả target columns
			newConfig.joinColumns = newConfig.joinColumns.map(col => ({ ...col, targetColumn: '' }));
			
			// Lưu tên bảng vào config để hiển thị trong summary
			const selectedTable = availableTargetTables.find(table => table.id === value);
			if (selectedTable) {
				newConfig.targetTableName = selectedTable.name;
			}
		} else if (key === 'targetVersion') {
			// Reset tất cả target columns
			newConfig.joinColumns = newConfig.joinColumns.map(col => ({ ...col, targetColumn: '' }));
		}
		
		setConfig(newConfig);
	};

	const handleJoinColumnChange = (index, field, value) => {
		const newJoinColumns = [...config.joinColumns];
		newJoinColumns[index] = { ...newJoinColumns[index], [field]: value };
		setConfig({ ...config, joinColumns: newJoinColumns });
	};

	const addJoinColumn = () => {
		if (config.joinColumns.length < 3) {
			setConfig({
				...config,
				joinColumns: [...config.joinColumns, { sourceColumn: '', targetColumn: '' }]
			});
		}
	};

	const removeJoinColumn = (index) => {
		if (config.joinColumns.length > 1) {
			const newJoinColumns = config.joinColumns.filter((_, i) => i !== index);
			setConfig({ ...config, joinColumns: newJoinColumns });
		}
	};

	return (
		<Space direction="vertical" style={{ width: '100%' }}>
			<Alert
				message="Nối bảng (Join Table)"
				description="Nối dữ liệu hiện tại với dữ liệu từ một bảng khác dựa trên cột chung."
				type="info"
				showIcon
				icon={<InfoCircleOutlined />}
				style={{ marginBottom: 16 }}
			/>

			<Card title="Cấu hình nối bảng" size="small">
				<Space direction="vertical" style={{ width: '100%' }}>
					<div>
						<Text strong>Bảng đích:</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Chọn bảng để nối với dữ liệu hiện tại
						</Text>
						<Select
							virtual={false}
							placeholder={loading ? "Đang tải..." : "Chọn bảng đích"}
							value={config.targetTable}
							onChange={(value) => handleConfigChange('targetTable', value)}
							style={{ width: '100%', marginTop: 8 }}
							loading={loading}
							options={availableTargetTables.map(table => ({
								label: `${table.name} (${table.versions.length} version)`,
								value: table.id
							}))}
						/>
					</div>

					{config.targetTable && (
						<div>
							<Text strong>Version của bảng đích:</Text>
							<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
								Chọn version của bảng đích để nối
							</Text>
							<Select
								placeholder="Chọn version"
								value={config.targetVersion}
								onChange={(value) => handleConfigChange('targetVersion', value)}
								style={{ width: '100%', marginTop: 8 }}
								options={targetTableVersions.map(version => ({
									label: version.name,
									value: version.id
								}))}
							/>
						</div>
					)}

					{config.targetTable && config.targetVersion && (
						<>
							<Divider />
							<div>
								<Text strong>Cột để nối (tối đa 3 cặp):</Text>
								<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
									Chọn các cặp cột để nối dữ liệu
								</Text>
								
								{config.joinColumns.map((joinColumn, index) => (
									<div key={index} style={{ marginTop: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
											<Text strong>Cặp cột {index + 1}</Text>
											{config.joinColumns.length > 1 && (
												<button
													type="button"
													onClick={() => removeJoinColumn(index)}
													style={{
														background: '#ff4d4f',
														color: 'white',
														border: 'none',
														borderRadius: 4,
														padding: '4px 8px',
														cursor: 'pointer',
														fontSize: '12px'
													}}
												>
													Xóa
												</button>
											)}
										</div>
										
										<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
											<div style={{ flex: 1 }}>
												<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
													Cột ở bảng hiện tại
												</Text>
												<Select

													placeholder="Chọn cột nguồn"
													value={joinColumn.sourceColumn}
													onChange={(value) => handleJoinColumnChange(index, 'sourceColumn', value)}
													style={{ width: '100%' }}
													options={availableColumns.map(col => ({
														label: col.name || col,
														value: col.name || col
													}))}
													virtual={false}
												/>
											</div>
											
											<div style={{ fontSize: '16px', color: '#666' }}>=</div>
											
											<div style={{ flex: 1 }}>
												<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
													Cột ở bảng cần nối vào
												</Text>
												<Select
													placeholder="Chọn cột đích"
													value={joinColumn.targetColumn}
													onChange={(value) => handleJoinColumnChange(index, 'targetColumn', value)}
													style={{ width: '100%' }}
													options={targetTableColumns.map(col => ({
														label: col.name || col,
														value: col.name || col
													}))}
												/>
											</div>
										</div>
									</div>
								))}
								
								{config.joinColumns.length < 3 && (
									<button
										type="button"
										onClick={addJoinColumn}
										style={{
											background: '#1890ff',
											color: 'white',
											border: 'none',
											borderRadius: 4,
											padding: '8px 16px',
											cursor: 'pointer',
											marginTop: 8,
											fontSize: '14px'
										}}
									>
										+ Thêm cặp cột
									</button>
								)}
							</div>
						</>
					)}

					<Divider />

					<div>
						<Text strong>Loại nối:</Text>
						<Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
							Chọn cách thức nối dữ liệu
						</Text>
						<Select
							placeholder="Chọn loại nối"
							value={config.joinType}
							onChange={(value) => handleConfigChange('joinType', value)}
							style={{ width: '100%', marginTop: 8 }}
							options={[
								{ label: 'Inner Join (Chỉ giữ các hàng khớp)', value: 'inner' },
								{ label: 'Left Join (Giữ tất cả hàng từ bảng nguồn)', value: 'left' },
								{ label: 'Right Join (Giữ tất cả hàng từ bảng đích)', value: 'right' },
								{ label: 'Full Outer Join (Giữ tất cả hàng từ cả hai bảng)', value: 'outer' }
							]}
						/>
					</div>
				</Space>
			</Card>

			{config.targetTable && config.targetVersion && config.joinColumns.some(col => col.sourceColumn && col.targetColumn) && (
				<Alert
					message="Kết quả dự kiến"
					description={`Sẽ nối dữ liệu hiện tại với bảng ${availableTargetTables.find(t => t.id === config.targetTable)?.name || config.targetTable} (version ${targetTableVersions.find(v => v.id === config.targetVersion)?.name || config.targetVersion}) dựa trên ${config.joinColumns.filter(col => col.sourceColumn && col.targetColumn).length} cặp cột (${config.joinType} join).`}
					type="success"
					showIcon
				/>
			)}
		</Space>
	);
};

export default JoinTableConfig; 