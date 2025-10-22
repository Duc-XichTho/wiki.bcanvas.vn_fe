import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { Form, Select, Checkbox, Input, Radio, Button, Space, Divider, Alert, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { getAllTemplateTableInfo, getTemplateInfoByTableId } from '../../../apis/templateSettingService.jsx';
import { MODEL_TEXT_AI_LIST } from '../../../CONST.js';
import styles from './CrossMappingConfig.module.css';
import { MyContext } from '../../../MyContext.jsx';

const { Option } = Select;
const { TextArea } = Input;

const CrossMappingConfig = ({
								currentTableColumns = [],
								availableTables = [],
								referenceTableColumns = [],
								initialConfig = {},
								onChange,
								visible = false,
								onClose,
							}) => {
	// Basic configuration states - khởi tạo từ initialConfig
	const [targetColumn, setTargetColumn] = useState(initialConfig.targetColumn || '');
	const [referenceType, setReferenceType] = useState(initialConfig.referenceType || 'table');
	const [referenceList, setReferenceList] = useState(initialConfig.referenceList || '');
	const [referenceTable, setReferenceTable] = useState(initialConfig.referenceTable || '');
	const [referenceColumn, setReferenceColumn] = useState(initialConfig.referenceColumn || '');
	const [mappingAction, setMappingAction] = useState(initialConfig.mappingAction || 'similarity');
	const [similarityThreshold, setSimilarityThreshold] = useState(initialConfig.similarityThreshold || '85');
	const [failureAction, setFailureAction] = useState(initialConfig.failureAction || 'keep_original');
	const [aiModel, setAiModel] = useState(initialConfig.aiModel || MODEL_TEXT_AI_LIST[0].value);
	const [manualRules, setManualRules] = useState(() => {
		const initialManualRules = initialConfig.manualRules || [];
		return initialManualRules.length > 0 ? initialManualRules : [{ input: '', output: '' }];
	});
	const [createNewColumn, setCreateNewColumn] = useState(initialConfig.createNewColumn !== undefined ? initialConfig.createNewColumn : true);
	const [overwriteOriginal, setOverwriteOriginal] = useState(initialConfig.overwriteOriginal || false);
	const [newColumnName, setNewColumnName] = useState(initialConfig.newColumnName || '');
	const { currentUser } = useContext(MyContext);

	// Process currentTableColumns to ensure it's always an array of strings
	const processedCurrentTableColumns = useMemo(() => {
		if (!Array.isArray(currentTableColumns)) return [];

		return currentTableColumns.map(col => {
			if (typeof col === 'object' && col !== null) {
				return col.name || col.column_name || col.type || String(col);
			}
			return String(col);
		});
	}, [currentTableColumns]);

	// Process availableTables to ensure it's always an array of valid table objects
	const processedAvailableTables = useMemo(() => {
		if (!Array.isArray(availableTables)) return [];

		return availableTables.filter(table => {
			if (typeof table === 'object' && table !== null) {
				return table.id && table.name;
			}
			return false;
		});
	}, [availableTables]);

	// Process referenceTableColumns to ensure it's always an array of strings
	const processedReferenceTableColumns = useMemo(() => {
		if (!Array.isArray(referenceTableColumns)) return [];

		return referenceTableColumns.map(col => {
			if (typeof col === 'object' && col !== null) {
				return col.name || col.column_name || col.type || String(col);
			}
			return String(col);
		});
	}, [referenceTableColumns]);

	// Table reference specific states
	const [templateTableList, setTemplateTableList] = useState([]);
	const [selectedTableInfo, setSelectedTableInfo] = useState(null);
	const [selectedTableColumns, setSelectedTableColumns] = useState([]);
	const [availableVersions, setAvailableVersions] = useState([]);
	const [referenceTableVersion, setReferenceTableVersion] = useState(initialConfig.referenceTableVersion !== undefined ? initialConfig.referenceTableVersion : null);
	const [loadingColumns, setLoadingColumns] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [changingVersion, setChangingVersion] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);
	const [hasInitialized, setHasInitialized] = useState(false);
	const onChangeRef = useRef(onChange);

	// Update ref when onChange changes
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	// Load initial data when component mounts or initialConfig changes
	useEffect(() => {
		getAllTemplateTableInfo().then(res => {
			// Ensure res.data is an array and contains valid table objects
			if (Array.isArray(res.data)) {
				const validTables = res.data.filter(table =>
					typeof table === 'object' && table !== null && table.id && table.name,
				);
				setTemplateTableList(validTables);
			} else {
				setTemplateTableList([]);
			}
		}).catch(error => {
			console.error('Error loading template table info:', error);
			setTemplateTableList([]);
		});
	}, []);

	// Load table info when initialConfig has referenceTable
	useEffect(() => {
		if (initialConfig.referenceTable && initialConfig.referenceType === 'table') {
			getTemplateInfoByTableId(initialConfig.referenceTable).then(tableInfo => {
				console.log('Loading initial table info:', tableInfo);
				setSelectedTableInfo(tableInfo);

				// Extract available versions from table info
				if (tableInfo.versions && Array.isArray(tableInfo.versions)) {
					// Ensure versions are valid objects with version property
					const validVersions = tableInfo.versions.filter(version =>
						typeof version === 'object' && version !== null && version.version !== undefined,
					);
					setAvailableVersions(validVersions);
				} else {
					setAvailableVersions([]);
				}
			}).catch(error => {
				console.error('Error loading initial table info:', error);
				setSelectedTableInfo(null);
				setAvailableVersions([]);
			});
		}
	}, [initialConfig.referenceTable, initialConfig.referenceType]);

	// Load columns when initialConfig has referenceTableVersion
	useEffect(() => {
		if (initialConfig.referenceTable && selectedTableInfo && initialConfig.referenceTableVersion !== undefined) {
			const versionData = selectedTableInfo.versions?.find(v => v.version === initialConfig.referenceTableVersion);
			console.log('Loading initial version data:', versionData);

			if (versionData && versionData.columns) {
				if (Array.isArray(versionData.columns)) {
					// Check if the first element is an object with name/column_name property
					if (versionData.columns.length > 0 && typeof versionData.columns[0] === 'object' && versionData.columns[0] !== null) {
						// Extract name or column_name from objects
						setSelectedTableColumns(versionData.columns.map(col => col.name || col.column_name || col));
					} else {
						// Already an array of strings
						setSelectedTableColumns(versionData.columns);
					}
				} else {
					setSelectedTableColumns(versionData.columns.map(col => {
						if (typeof col === 'string') {
							return col;
						} else if (col && typeof col === 'object') {
							return col.name || col.column_name;
						}
						return col;
					}));
				}

				// Nếu đang edit và có referenceColumn trong initialConfig, set nó
				if (isEditing && initialConfig.referenceColumn) {
					setReferenceColumn(initialConfig.referenceColumn);
				}
			} else {
				setSelectedTableColumns([]);
			}
		}
	}, [initialConfig.referenceTable, initialConfig.referenceTableVersion, selectedTableInfo, isEditing, initialConfig.referenceColumn]);

	// Reset all states when initialConfig changes (when switching between add/edit modes)
	useEffect(() => {
		console.log('InitialConfig changed:', initialConfig);

		// Set initializing flag to prevent onChange calls during initialization
		setIsInitializing(true);

		// Check if we're switching to edit mode
		const hasExistingConfig = initialConfig.referenceTable || initialConfig.targetColumn;
		setIsEditing(!!hasExistingConfig);

		// Reset all states to initialConfig values
		setTargetColumn(initialConfig.targetColumn || '');
		setReferenceType(initialConfig.referenceType || 'table');
		setReferenceList(initialConfig.referenceList || '');
		setReferenceTable(initialConfig.referenceTable || '');
		// Không set referenceColumn ngay ở đây, để useEffect khác xử lý
		setMappingAction(initialConfig.mappingAction || 'similarity');
		setSimilarityThreshold(initialConfig.similarityThreshold || '85');
		setFailureAction(initialConfig.failureAction || 'keep_original');
		setAiModel(initialConfig.aiModel || MODEL_TEXT_AI_LIST[0].value);

		// Ensure manualRules has at least one rule
		const initialManualRules = initialConfig.manualRules || [];
		const newManualRules = initialManualRules.length > 0 ? initialManualRules : [{ input: '', output: '' }];
		console.log('Setting manual rules:', newManualRules);
		setManualRules(newManualRules);

		setCreateNewColumn(initialConfig.createNewColumn !== undefined ? initialConfig.createNewColumn : true);
		setOverwriteOriginal(initialConfig.overwriteOriginal || false);
		setNewColumnName(initialConfig.newColumnName || '');
		setReferenceTableVersion(initialConfig.referenceTableVersion !== undefined ? initialConfig.referenceTableVersion : null);

		// Only reset table-related states if we're not editing (i.e., switching from add to edit mode)
		if (!hasExistingConfig) {
			setSelectedTableInfo(null);
			setSelectedTableColumns([]);
			setAvailableVersions([]);
			setLoadingColumns(false);
			setChangingVersion(false);
		}

		// Mark as initialized and allow onChange calls
		setHasInitialized(true);
		setIsInitializing(false);
	}, [initialConfig]);

	// Set referenceColumn when initialConfig changes and we're editing
	useEffect(() => {
		if (isEditing && initialConfig.referenceColumn && hasInitialized) {
			// Đợi một chút để đảm bảo các state khác đã được set
			const timer = setTimeout(() => {
				if (referenceColumn !== initialConfig.referenceColumn) {
					console.log('Setting referenceColumn from initialConfig after initialization:', initialConfig.referenceColumn);
					setReferenceColumn(initialConfig.referenceColumn);
				}
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [isEditing, initialConfig.referenceColumn, hasInitialized, referenceColumn]);

	// Set referenceColumn when selectedTableColumns changes and we're editing
	useEffect(() => {
		if (isEditing && initialConfig.referenceColumn && selectedTableColumns.length > 0) {
			const columnExists = selectedTableColumns.includes(initialConfig.referenceColumn);
			if (columnExists && referenceColumn !== initialConfig.referenceColumn) {
				console.log('Auto-setting referenceColumn when selectedTableColumns changes:', initialConfig.referenceColumn);
				setReferenceColumn(initialConfig.referenceColumn);
			}
		}
	}, [selectedTableColumns, isEditing, initialConfig.referenceColumn, referenceColumn]);

	// Fetch table information when reference table is selected
	useEffect(() => {
		console.log('Fetching table info for:', { referenceTable, referenceType, isEditing });

		if (referenceTable && referenceType === 'table') {
			getTemplateInfoByTableId(referenceTable).then(tableInfo => {
				console.log('Table info received:', tableInfo);
				setSelectedTableInfo(tableInfo);

				// Extract available versions from table info
				if (tableInfo.versions && Array.isArray(tableInfo.versions)) {
					// Ensure versions are valid objects with version property
					const validVersions = tableInfo.versions.filter(version =>
						typeof version === 'object' && version !== null && version.version !== undefined,
					);
					setAvailableVersions(validVersions);
				} else {
					setAvailableVersions([]);
				}

				// Reset version and columns when table changes (only if not editing)
				if (!isEditing) {
					console.log('Resetting version and columns for new table');
					setReferenceTableVersion(null);
					setReferenceColumn('');
					setSelectedTableColumns([]);
				}
			}).catch(error => {
				console.error('Error fetching table info:', error);
				setSelectedTableInfo(null);
				setAvailableVersions([]);
				setSelectedTableColumns([]);
			});
		} else {
			console.log('Resetting table info - no reference table or wrong type');
			setSelectedTableInfo(null);
			setAvailableVersions([]);
			setSelectedTableColumns([]);
		}
	}, [referenceTable, referenceType, isEditing]);

	// Fetch columns when version is selected
	useEffect(() => {
		console.log('Fetching columns for:', { referenceTable, referenceTableVersion, selectedTableInfo });

		if (referenceTable && selectedTableInfo && referenceTableVersion !== undefined) {
			setLoadingColumns(true);

			// Find the specific version data
			const versionData = selectedTableInfo.versions?.find(v => v.version === referenceTableVersion);
			console.log('Version data found:', versionData);

			if (versionData && versionData.columns) {
				// Check if the first element is an object with name/column_name property
				if (Array.isArray(versionData.columns) && versionData.columns.length > 0 && typeof versionData.columns[0] === 'object' && versionData.columns[0] !== null) {
					// Extract name or column_name from objects
					const columnNames = versionData.columns.map(col => col.name || col.column_name || col);
					console.log('Setting columns (objects):', columnNames);
					setSelectedTableColumns(columnNames);
				} else if (Array.isArray(versionData.columns)) {
					// Already an array of strings
					console.log('Setting columns (array):', versionData.columns);
					setSelectedTableColumns(versionData.columns);
				} else {
					// If columns is an array of objects, extract the name/column_name
					const columnNames = versionData.columns.map(col => {
						if (typeof col === 'string') {
							return col;
						} else if (col && typeof col === 'object') {
							return col.name || col.column_name;
						}
						return col;
					});
					console.log('Setting columns (objects):', columnNames);
					setSelectedTableColumns(columnNames);

					// Nếu đang edit và có referenceColumn trong initialConfig, kiểm tra và set nó
					if (isEditing && initialConfig.referenceColumn) {
						const columnExists = columnNames.includes(initialConfig.referenceColumn);
						if (columnExists && referenceColumn !== initialConfig.referenceColumn) {
							console.log('Auto-setting referenceColumn after columns loaded:', initialConfig.referenceColumn);
							setReferenceColumn(initialConfig.referenceColumn);
						}
					}
				}
			} else {
				console.log('No columns found in version data');
				setSelectedTableColumns([]);
			}

			setLoadingColumns(false);
		} else {
			console.log('Conditions not met for loading columns:', {
				hasReferenceTable: !!referenceTable,
				hasSelectedTableInfo: !!selectedTableInfo,
				referenceTableVersion,
			});
			// Only reset if we don't have the required data
			if (!referenceTable || !selectedTableInfo) {
				setSelectedTableColumns([]);
			}
			setLoadingColumns(false);
		}
	}, [referenceTable, referenceTableVersion, selectedTableInfo, isEditing, initialConfig.referenceColumn, referenceColumn]);

	// Debug useEffect for referenceTableVersion changes
	useEffect(() => {
		console.log('referenceTableVersion changed:', referenceTableVersion);
	}, [referenceTableVersion]);

	// Auto-set referenceColumn when selectedTableColumns changes and we're editing
	useEffect(() => {
		if (isEditing && initialConfig.referenceColumn && selectedTableColumns.length > 0) {
			// Kiểm tra xem referenceColumn có tồn tại trong selectedTableColumns không
			const columnExists = selectedTableColumns.includes(initialConfig.referenceColumn);
			if (columnExists && referenceColumn !== initialConfig.referenceColumn) {
				console.log('Auto-setting referenceColumn from initialConfig:', initialConfig.referenceColumn);
				setReferenceColumn(initialConfig.referenceColumn);
			}
		}
	}, [selectedTableColumns, isEditing, initialConfig.referenceColumn, referenceColumn]);

	// Force set referenceColumn when initialConfig changes and we're editing
	useEffect(() => {
		if (isEditing && initialConfig.referenceColumn && hasInitialized) {
			// Đợi một chút để đảm bảo các state khác đã được set
			const timer = setTimeout(() => {
				if (referenceColumn !== initialConfig.referenceColumn) {
					console.log('Force setting referenceColumn from initialConfig:', initialConfig.referenceColumn);
					setReferenceColumn(initialConfig.referenceColumn);
				}
			}, 200);

			return () => clearTimeout(timer);
		}
	}, [isEditing, initialConfig.referenceColumn, hasInitialized, referenceColumn]);

	// Final fallback: set referenceColumn when all conditions are met
	useEffect(() => {
		if (isEditing &&
			initialConfig.referenceColumn &&
			selectedTableColumns.length > 0 &&
			referenceColumn !== initialConfig.referenceColumn) {

			const columnExists = selectedTableColumns.includes(initialConfig.referenceColumn);
			if (columnExists) {
				console.log('Final fallback: setting referenceColumn:', initialConfig.referenceColumn);
				setReferenceColumn(initialConfig.referenceColumn);
			}
		}
	}, [isEditing, initialConfig.referenceColumn, selectedTableColumns, referenceColumn]);

	// Debug useEffect to track state changes
	useEffect(() => {
		if (isEditing) {
			console.log('CrossMappingConfig - State debug:', {
				targetColumn,
				referenceType,
				referenceTable,
				referenceTableVersion,
				referenceColumn,
				initialConfigReferenceColumn: initialConfig.referenceColumn,
				selectedTableColumns: selectedTableColumns.length,
				hasInitialized,
				isInitializing,
			});
		}
	}, [isEditing, targetColumn, referenceType, referenceTable, referenceTableVersion, referenceColumn, initialConfig.referenceColumn, selectedTableColumns.length, hasInitialized, isInitializing]);

	// Force set referenceColumn when initialConfig changes and we're editing
	useEffect(() => {
		if (isEditing && initialConfig.referenceColumn && hasInitialized && !isInitializing) {
			// Đợi một chút để đảm bảo các state khác đã được set
			const timer = setTimeout(() => {
				if (referenceColumn !== initialConfig.referenceColumn) {
					console.log('Force setting referenceColumn from initialConfig (final):', initialConfig.referenceColumn);
					setReferenceColumn(initialConfig.referenceColumn);
				}
			}, 300);

			return () => clearTimeout(timer);
		}
	}, [isEditing, initialConfig.referenceColumn, hasInitialized, isInitializing, referenceColumn]);

	// Memoize the config object to prevent unnecessary re-renders
	const configObject = useMemo(() => ({
		targetColumn,
		referenceType,
		referenceList,
		referenceTable,
		referenceTableVersion,
		referenceColumn,
		mappingAction,
		similarityThreshold,
		failureAction,
		aiModel,
		manualRules,
		createNewColumn,
		overwriteOriginal,
		newColumnName,
	}), [targetColumn, referenceType, referenceList, referenceTable, referenceTableVersion, referenceColumn, mappingAction, similarityThreshold, failureAction, aiModel, manualRules, createNewColumn, overwriteOriginal, newColumnName]);

	// Notify parent component of changes
	useEffect(() => {
		// Don't notify parent during initialization or if not yet initialized
		if (isInitializing || !hasInitialized) {
			console.log('Skipping onChange during initialization');
			return;
		}

		console.log('Notifying parent of config changes:', {
			targetColumn,
			referenceType,
			mappingAction,
			createNewColumn,
			newColumnName,
		});

		if (onChangeRef.current) {
			onChangeRef.current(configObject);
		}
	}, [configObject, isInitializing, hasInitialized]);

	// Manual rules management
	const addManualRule = () => {
		setManualRules([...manualRules, { input: '', output: '' }]);
	};

	const removeManualRule = (index) => {
		if (manualRules.length > 1) {
			setManualRules(manualRules.filter((_, i) => i !== index));
		}
	};

	const updateManualRule = (index, field, value) => {
		const newRules = [...manualRules];
		newRules[index][field] = value;
		setManualRules(newRules);
	};

	const handleSave = () => {
		// Save configuration logic here
		onClose?.();
	};

	return (
		<div className={styles.container}>
			<div className={styles.modalContainerXLarge}>
		

				{/* Content */}
				<div className={styles.cardContent}>
					<div className={`${styles.spaceY6}`}>
						{/* Target Column Selection */}
						<div>
							<label className={styles.formLabel}>Cột cần kiểm tra *</label>
							<Select
								value={targetColumn}
								onChange={(value) => {
									console.log('Target column changed:', value);
									setTargetColumn(value);
									// Auto-generate new column name if createNewColumn is checked
									if (createNewColumn && value) {
										setNewColumnName(`${value}_standardized`);
									}
								}}
								className={styles.formSelect}
								virtual={false}
							>
								{processedCurrentTableColumns.map(col => (
									<Option key={col} value={col}>{col}</Option>
								))}
							</Select>
						</div>

						{/* Reference Source Selection */}
						<div>
							<label className={styles.formLabel}>Nguồn danh sách chuẩn *</label>
							<div className={`${styles.spaceY3}`}>
								<label className={`${styles.flex} ${styles.itemsCenter}`}>
									<input
										type="radio"
										name="referenceType"
										value="list"
										checked={referenceType === 'list'}
										onChange={(e) => {
											setReferenceType(e.target.value);
											// Reset table-related fields when switching to list
											if (e.target.value === 'list') {
												setReferenceTable('');
												setReferenceTableVersion(null);
												setReferenceColumn('');
											}
										}}
										className={`${styles.mr2}`}
									/>
									<span className={styles.textSm}>Nhập danh sách trực tiếp</span>
								</label>
								<label className={`${styles.flex} ${styles.itemsCenter}`}>
									<input
										type="radio"
										name="referenceType"
										value="table"
										checked={referenceType === 'table'}
										onChange={(e) => {
											setReferenceType(e.target.value);
											// Reset list field when switching to table
											if (e.target.value === 'table') {
												setReferenceList('');
											}
										}}
										className={`${styles.mr2}`}
									/>
									<span className={styles.textSm}>Chọn từ bảng khác</span>
								</label>
							</div>
						</div>

						{/* List Input */}
						{referenceType === 'list' && (
							<div>
								<label className={styles.formLabel}>Danh sách giá trị chuẩn *</label>
								<TextArea
									value={referenceList}
									onChange={(e) => setReferenceList(e.target.value)}
									placeholder="Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ"
									rows={3}
									className={styles.formTextarea}
								/>
								<div className={`${styles.mt1} ${styles.textXs} ${styles.textGray500}`}>
									Nhập các giá trị hợp lệ, phân cách bằng dấu phẩy
								</div>
							</div>
						)}

						{/* Table Selection */}
						{referenceType === 'table' && (
							<div className={`${styles.grid} ${styles.gridCols2} ${styles.gap4}`}>
								<div>
									<label className={styles.formLabel}>Bảng tham chiếu *</label>
									<Select
										value={referenceTable}
										onChange={setReferenceTable}
										className={styles.formSelect}
									>
										<Option value="">-- Chọn bảng --</Option>
										{templateTableList.length > 0 && templateTableList.map(table => (
											<Option key={table.id} value={table.id}>{table.name}</Option>
										))}
									</Select>
								</div>
								{referenceTable && availableVersions.length > 0 && (
									<div>
										<label className={styles.formLabel}>Phiên bản bảng tham chiếu *</label>
										<Select
											placeholder="Chọn phiên bản"
											value={referenceTableVersion}
											onChange={(value) => {
												console.log('Version selected:', value);
												setChangingVersion(true);
												setReferenceTableVersion(value);
												// Reset reference column when version changes
												setReferenceColumn('');
												// Force re-render after a short delay to ensure state is updated
												setTimeout(() => {
													console.log('Version change completed:', value);
													setChangingVersion(false);
												}, 100);
											}}
											className={styles.formSelect}
										>
											{availableVersions.map(version => (
												<Option key={version.version} value={version.version}>
													Phiên bản {version.version === null ? 'gốc' : version.version}
												</Option>
											))}
										</Select>
									</div>
								)}
							</div>
						)}

						{/* Reference Column Selection - Show when version is selected, even if columns are still loading */}
						{(() => {
							const shouldShow = referenceType === 'table' && referenceTable && referenceTableVersion !== undefined;
							console.log('Reference column selection render check:', {
								referenceType,
								referenceTable,
								referenceTableVersion,
								shouldShow,
								loadingColumns,
								selectedTableColumnsLength: selectedTableColumns.length,
								isEditing,
								changingVersion,
							});
							return shouldShow ? (
								<div>
									<label className={styles.formLabel}>Cột tham chiếu *</label>
									<Select
										key={`${referenceTable}-${referenceTableVersion}`}
										value={referenceColumn}
										onChange={setReferenceColumn}
										className={styles.formSelect}
										placeholder={loadingColumns || changingVersion ? 'Đang tải cột...' : '-- Chọn cột --'}
										loading={loadingColumns || changingVersion}
										disabled={loadingColumns || changingVersion}
									>
										<Option value="">-- Chọn cột --</Option>
										{selectedTableColumns.map(col => (
											<Option key={col} value={col}>{col}</Option>
										))}
									</Select>
									{(loadingColumns || changingVersion) && (
										<div className={`${styles.mt1} ${styles.textXs} ${styles.textGray500}`}>
											Đang tải danh sách cột từ phiên bản đã chọn...
										</div>
									)}
									{!loadingColumns && !changingVersion && selectedTableColumns.length === 0 && (
										<div className={`${styles.mt1} ${styles.textXs} ${styles.textRed500}`}>
											Không tìm thấy cột nào trong phiên bản này
										</div>
									)}
								</div>
							) : null;
						})()}

						{/* Mapping Method Selection */}
						<div>
							<label className={styles.formLabel}>Phương pháp mapping *</label>
							<div className={`${styles.spaceY3}`}>
								<label className={`${styles.flex} ${styles.itemsCenter}`}>
									<input
										type="radio"
										name="mappingAction"
										value="similarity"
										checked={mappingAction === 'similarity'}
										onChange={(e) => {
											setMappingAction(e.target.value);
											// Reset other mapping fields when switching to similarity
											if (e.target.value === 'similarity') {
												setManualRules([{ input: '', output: '' }]);
											}
										}}
										className={`${styles.mr2}`}
									/>
									<span className={styles.textSm}>Similarity Rule (độ tương đồng)</span>
								</label>
								<label className={`${styles.flex} ${styles.itemsCenter}`}>
									<input
										type="radio"
										name="mappingAction"
										value="ai_assisted"
										checked={mappingAction === 'ai_assisted'}
										onChange={(e) => {
											setMappingAction(e.target.value);
											// Reset other mapping fields when switching to AI
											if (e.target.value === 'ai_assisted') {
												setManualRules([{ input: '', output: '' }]);
											}
										}}
										className={`${styles.mr2}`}
									/>
									<span className={styles.textSm}>AI Assisted mapping</span>
								</label>
								<label className={`${styles.flex} ${styles.itemsCenter}`}>
									<input
										type="radio"
										name="mappingAction"
										value="manual"
										checked={mappingAction === 'manual'}
										onChange={(e) => {
											setMappingAction(e.target.value);
											// Reset similarity fields when switching to manual
											if (e.target.value === 'manual') {
												setSimilarityThreshold('85');
												setFailureAction('keep_original');
											}
										}}
										className={`${styles.mr2}`}
									/>
									<span className={styles.textSm}>Manual mapping rule</span>
								</label>
							</div>
						</div>

						{/* Similarity Rule Configuration */}
						{mappingAction === 'similarity' && (
							<div
								className={`${styles.bgBlue50} ${styles.border} ${styles.borderBlue200} ${styles.roundedLg} ${styles.p4}`}>
								<div className={`${styles.grid} ${styles.gridCols2} ${styles.gap4}`}>
									<div>
										<label className={styles.formLabel}>Ngưỡng tương đồng (%)</label>
										<Select
											value={similarityThreshold}
											onChange={setSimilarityThreshold}
											className={styles.formSelect}
										>
											<Option value="80">80% (Rộng rãi)</Option>
											<Option value="85">85% (Cân bằng)</Option>
											<Option value="90">90% (Nghiêm ngặt)</Option>
											<Option value="95">95% (Rất nghiêm ngặt)</Option>
										</Select>
									</div>
									<div>
										<label className={styles.formLabel}>Nếu không mapping được</label>
										<Select
											value={failureAction}
											onChange={setFailureAction}
											className={styles.formSelect}
										>
											<Option value="keep_original">Giữ giá trị gốc</Option>
											<Option value="mark_invalid">Đánh dấu không hợp lệ</Option>
											<Option value="set_empty">Để trống</Option>
											<Option value="set_default">Đặt giá trị mặc định</Option>
										</Select>
									</div>
								</div>
								<div className={`${styles.mt2} ${styles.textXs} ${styles.textBlue600}`}>
									Sử dụng thuật toán Levenshtein distance để tính độ tương đồng chuỗi
								</div>
							</div>
						)}

						{/* AI Assisted Configuration */}
						{mappingAction === 'ai_assisted' && (
							<div
								className={`${styles.bgGreen50} ${styles.border} ${styles.borderGreen200} ${styles.roundedLg} ${styles.p4}`}>
								<div className={`${styles.textSm} ${styles.textGreen800} ${styles.mb2}`}>
									<strong>🤖 AI-Powered Mapping:</strong> Sử dụng AI để hiểu ngữ cảnh và mapping thông
									minh
								</div>
								<div className={`${styles.textXs} ${styles.textGreen700} ${styles.mb3}`}>
									• Hiểu được các viết tắt và biến thể (VD: "HN" → "Hà Nội")<br />
									• Phát hiện lỗi chính tả và sửa tự động<br />
									• Học từ context và pattern trong dữ liệu<br />
									• Xử lý được nhiều ngôn ngữ và format khác nhau
								</div>

								{/* Model AI Selection */}
								{currentUser.isSuperAdmin &&
									<div className={`${styles.mb3}`}>
										<label
											className={`${styles.block} ${styles.textSm} ${styles.fontMedium} ${styles.textGreen800} ${styles.mb1}`}>
											Model AI <span className={`${styles.textRed500}`}>*</span>
										</label>
										<Select
											value={aiModel}
											onChange={setAiModel}
											className={`${styles.wFull}`}
											showSearch
											filterOption={(input, option) =>
												option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
											}
										>
											{MODEL_TEXT_AI_LIST.map(model => (
												<Option key={model.value} value={model.value}>
													{model.name}
												</Option>
											))}
										</Select>
										<div className={`${styles.textXs} ${styles.textGreen600} ${styles.mt1}`}>
											<InfoCircleOutlined /> Model AI sẽ được sử dụng để xử lý mapping thông minh
										</div>
									</div>
								}
							</div>
						)}

						{/* Manual Rules Configuration */}
						{mappingAction === 'manual' && (
							<div
								className={`${styles.border} ${styles.borderGray200} ${styles.roundedLg} ${styles.p4}`}>
								<div
									className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyBetween} ${styles.mb3}`}>
									<label className={`${styles.textSm} ${styles.fontMedium} ${styles.textGray700}`}>
										Quy tắc mapping thủ công
									</label>
									<button
										onClick={addManualRule}
										className={`${styles.flex} ${styles.itemsCenter} ${styles.gap1} ${styles.px2} ${styles.py1} ${styles.textXs} ${styles.bgBlue600} ${styles.textWhite} ${styles.rounded} ${styles.hoverBgBlue700}`}
									>
										<PlusOutlined className={`${styles.h3} ${styles.w3}`} />
										Thêm quy tắc
									</button>
								</div>

								{manualRules.map((rule, index) => (
									<div key={index}
										 className={`${styles.flex} ${styles.itemsCenter} ${styles.gap2} ${styles.mb2}`}>
										<span
											className={`${styles.textXs} ${styles.textGray500} ${styles.w8}`}>Nếu:</span>
										<Input
											value={rule.input}
											onChange={(e) => updateManualRule(index, 'input', e.target.value)}
											placeholder="Giá trị đầu vào"
											className={`${styles.border} ${styles.borderGray300} ${styles.rounded} ${styles.px2} ${styles.py1} ${styles.textSm} ${styles.flex1}`}
										/>
										<span
											className={`${styles.textXs} ${styles.textGray500} ${styles.w8}`}>Thì:</span>
										<Input
											value={rule.output}
											onChange={(e) => updateManualRule(index, 'output', e.target.value)}
											placeholder="Giá trị chuẩn"
											className={`${styles.border} ${styles.borderGray300} ${styles.rounded} ${styles.px2} ${styles.py1} ${styles.textSm} ${styles.flex1}`}
										/>
										{manualRules.length > 1 && (
											<button
												onClick={() => removeManualRule(index)}
												className={`${styles.p1} ${styles.textRed600} ${styles.hoverBgRed50} ${styles.rounded}`}
											>
												<DeleteOutlined className={`${styles.h4} ${styles.w4}`} />
											</button>
										)}
									</div>
								))}
								<div className={`${styles.textXs} ${styles.textGray500} ${styles.mt2}`}>
									Hỗ trợ wildcard (*) và regex patterns
								</div>
							</div>
						)}

						{/* Output Options */}
						<div>
							<label className={styles.formLabel}>Tùy chọn đầu ra</label>
							<div className={`${styles.spaceY2}`}>
								<label className={`${styles.flex} ${styles.itemsCenter}`}>
									<input
										type="checkbox"
										checked={createNewColumn}
										onChange={(e) => {
											setCreateNewColumn(e.target.checked);
											// If creating new column, uncheck overwrite original
											if (e.target.checked) {
												setOverwriteOriginal(false);
												// Auto-generate new column name if targetColumn is selected
												if (targetColumn && !newColumnName) {
													setNewColumnName(`${targetColumn}_standardized`);
												}
											} else if (!e.target.checked && !overwriteOriginal) {
												// If unchecking create new column and overwrite original is also unchecked,
												// force create new column to be true (at least one must be selected)
												setCreateNewColumn(true);
											}
										}}
										className={`${styles.mr2}`}
									/>
									<span className={styles.textSm}>Tạo cột mới (mặc định)</span>
								</label>
								<label className={`${styles.flex} ${styles.itemsCenter}`}>
									<input
										type="checkbox"
										checked={overwriteOriginal}
										onChange={(e) => {
											setOverwriteOriginal(e.target.checked);
											// If overwriting original, uncheck create new column
											if (e.target.checked) {
												setCreateNewColumn(false);
											} else if (!e.target.checked && !createNewColumn) {
												// If unchecking overwrite original and create new column is also unchecked,
												// force create new column to be true (at least one must be selected)
												setCreateNewColumn(true);
											}
										}}
										className={`${styles.mr2}`}
									/>
									<span className={styles.textSm}>Ghi đè cột gốc</span>
								</label>
							</div>

							{createNewColumn && (
								<div className={`${styles.mt3}`}>
									<label className={styles.formLabel}>Tên cột mới *</label>
									<Input
										type="text"
										value={newColumnName}
										onChange={(e) => setNewColumnName(e.target.value)}
										placeholder={`${targetColumn}_standardized`}
										className={styles.formInput}
									/>
								</div>
							)}
						</div>

						{/* Result Configuration */}
						<div className={`${styles.mt4}`}>
							<label className={styles.formLabel}>Cấu hình kết quả</label>
							<div className={`${styles.mt2}`}>
								<label className={styles.formLabel}>Khi không tìm thấy giá trị mapping:</label>
								<Select
									value={failureAction}
									onChange={setFailureAction}
									className={styles.formSelect}
								>
									<Option value="keep_original">Giữ giá trị gốc</Option>
									<Option value="return_empty">Trả về rỗng</Option>
									<Option value="mark_invalid">Đánh dấu không hợp lệ</Option>
								</Select>
								<div className={`${styles.textXs} ${styles.textGray500} ${styles.mt1}`}>
									- <strong>Giữ giá trị gốc:</strong> Giữ nguyên giá trị ban đầu<br/>
									- <strong>Trả về rỗng:</strong> Để trống giá trị<br/>
									- <strong>Đánh dấu không hợp lệ:</strong> Gán giá trị "INVALID"
								</div>
							</div>
						</div>

						{/* Preview Section */}
						<div
							className={`${styles.bgBlue50} ${styles.border} ${styles.borderBlue200} ${styles.roundedLg} ${styles.p4}`}>
							<div className={`${styles.textSm} ${styles.textBlue800}`}>
								<div className={`${styles.fontMedium} ${styles.mb2}`}>Xem trước mapping:</div>
								<div className={`${styles.spaceY1}`}>
									{mappingAction === 'similarity' && (
										<div>Độ tương đồng {similarityThreshold}%: "HN" → "Hà Nội" (95% match)</div>
									)}
									{mappingAction === 'ai_assisted' && (
										<div>AI mapping: "Hanoi", "HN", "Ha Noi" → "Hà Nội"</div>
									)}
									{mappingAction === 'manual' && (
										<div>Manual rules: {manualRules.filter(r => r.input && r.output).length} quy tắc
											được định nghĩa</div>
									)}
									<div><strong>Kết quả:</strong> 4 giá trị hợp lệ, 1 cần mapping</div>
									{createNewColumn && newColumnName && (
										<div><strong>Cột mới:</strong> {newColumnName}</div>
									)}
									{overwriteOriginal && (
										<div><strong>Ghi đè:</strong> Cột gốc sẽ được cập nhật</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CrossMappingConfig; 