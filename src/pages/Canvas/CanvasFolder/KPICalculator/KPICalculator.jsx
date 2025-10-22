import React, { useEffect, useState } from 'react';
import styles from './KPICalculator.module.css';
import KPIContent from './KPIContent';
import { Search, ArrowUpDown } from 'lucide-react';
// API
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import {
	createKpiCalculator,
	deleteKpiCalculator,
	getAllKpiCalculator,
	getKpiCalculatorById,
	updateKpiCalculator
} from '../../../../apis/kpiCalculatorService.jsx';
import { getSettingByType } from '../../../../apis/settingService.jsx';
import {
	getTableByid,
	getTemplateRow
} from '../../../../apis/templateSettingService';
import TagInput from '../../../../components/TagInput/TagInput.jsx';
import { createTimestamp, formatDateToDDMMYYYY } from '../../../../generalFunction/format.js';
import { loadAndMergeData } from '../../Daas/Content/Template/SettingCombine/logicCombine.js';

const KPICalculator = () => {
	const [activeTab, setActiveTab] = useState('definition');
	const [showCreatePopup, setShowCreatePopup] = useState(false);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
	const [kpiSearchTerm, setKpiSearchTerm] = useState('');
	const [templateList, setTemplateList] = useState([]);
	const [templateColumns, setTemplateColumns] = useState([]);
	const [templateData, setTemplateData] = useState([]);
	// Track loaded sources to avoid redundant loads
	const [loadedColumnsSourceId, setLoadedColumnsSourceId] = useState(null);
	const [loadedDataSourceId, setLoadedDataSourceId] = useState(null);
	const [kpiToDelete, setKpiToDelete] = useState(null);
	const [kpiToDuplicate, setKpiToDuplicate] = useState(null);
	const [duplicateKPIName, setDuplicateKPIName] = useState('');
	const [newKPIName, setNewKPIName] = useState('');
	const [newKPITags, setNewKPITags] = useState([]);
	const [duplicateKPITags, setDuplicateKPITags] = useState([]);
	const [showEditTagsPopup, setShowEditTagsPopup] = useState(false);
	const [kpiToEditTags, setKpiToEditTags] = useState(null);
	const [editKPITags, setEditKPITags] = useState([]);
	const [kpiList, setKpiList] = useState([]);
	const [selectedKpi, setSelectedKpi] = useState(null);
	const [loading, setLoading] = useState(false);
	const [sidebarLoading, setSidebarLoading] = useState(false);
	const [isFirstLoading, setIsFirstLoading] = useState(false);
	const [selectedColors, setSelectedColors] = useState([
		{ id: 1, color: '#13C2C2' },
		{ id: 2, color: '#3196D1' },
		{ id: 3, color: '#6DB8EA' },
		{ id: 4, color: '#87D2EA' },
		{ id: 5, color: '#9BAED7' },
		{ id: 6, color: '#C695B7' },
		{ id: 7, color: '#EDCCA1' },
		{ id: 8, color: '#A4CA9C' }
	]);
	// Sort state for updated_at
	const [sortUpdatedAt, setSortUpdatedAt] = useState('desc'); // 'desc' | 'asc'
	useEffect(() => {
		setIsFirstLoading(true);
		fetchKPIs();
		fetchTemplateList();
		setTimeout(() => {
			setIsFirstLoading(false);
		}, 1000);
	}, []);

	// Load color settings
	useEffect(() => {
		const loadColorSettings = async () => {
			try {
				const existing = await getSettingByType('SettingColor');
				if (existing && existing.setting && Array.isArray(existing.setting)) {
					const isValidColorArray = existing.setting.every(item =>
						item && typeof item === 'object' &&
						typeof item.id === 'number' &&
						typeof item.color === 'string'
					);

					if (isValidColorArray) {
						setSelectedColors(existing.setting);
					}
				}
			} catch (error) {
				console.error('Error loading initial color settings:', error);
			}
		};

		loadColorSettings();
	}, []);

	const fetchTemplateList = async () => {
		try {
			const approvedVersions = await getAllApprovedVersion();

			// Lọc approveVersion có apps bao gồm 'analysis-review'
			const filteredApprovedVersions = approvedVersions.filter(version =>
				version.apps && version.apps.includes('analysis-review')
			);

			// Chuyển đổi approveVersion thành format template để tương thích
			const templateList = filteredApprovedVersions.map((version) => ({
				id: version.id,
				name: version.name,
				fileNoteName: version.name,
				approveVersion_id: version.id,
				// Thêm các thuộc tính cần thiết khác
				description: version.description || '',
				created_at: version.created_at,
				updated_at: version.updated_at
			}));

			setTemplateList(templateList);
		} catch (error) {
			console.error('Error fetching template list:', error);
		}
	};

	const fetchKPIs = async () => {
		try {
			setSidebarLoading(true);
			const data = await getAllKpiCalculator();
			setKpiList(data);
			// Không tự động chọn item đầu tiên nữa
			// if (data.length > 0) {
			// 	await handleKpiSelect(data[0]);
			// }
		} catch (error) {
			console.error('Error fetching KPIs:', error);
		} finally {
			setSidebarLoading(false);
		}
	};

	const handleKpiSelect = async (kpi) => {
		try {
			const kpiData = await getKpiCalculatorById(kpi.id);
			setSelectedKpi(kpiData);
		} catch (error) {
			console.error('Error fetching KPI details:', error);
		}
	};

	const handleKpiNameUpdate = (kpiId, newName) => {
		setKpiList((prevList) =>
			prevList.map((kpi) => {
				if (kpi.id == kpiId) {
					kpi = {
						...kpi,
						name: newName,
						tableVersion: newName + ' - ' + new Date().toLocaleString(),
						updated_at: createTimestamp(),
					};
				}
				updateKpiCalculator(kpi);
				return kpi;
			},
			),
		);
	};

	const handleEditTagsClick = (kpi, e) => {
		e.stopPropagation();
		setKpiToEditTags(kpi);
		setEditKPITags(kpi.tags || []);
		setShowEditTagsPopup(true);
	};

	const handleEditTagsConfirm = async () => {
		if (!kpiToEditTags) return;

		try {
			setLoading(true);
			const updatedKpi = await updateKpiCalculator({
				...kpiToEditTags,
				tags: editKPITags,
				updated_at: createTimestamp(),
			});
			console.log(updatedKpi);
			// Cập nhật kpiList
			setKpiList((prevList) =>
				prevList.map((kpi) =>
					kpi.id === kpiToEditTags.id ? { ...kpi, tags: editKPITags, updated_at: createTimestamp() } : kpi
				)
			);

			// Cập nhật selectedKpi nếu đang được chọn
			if (selectedKpi?.id === kpiToEditTags.id) {
				setSelectedKpi({ ...selectedKpi, tags: editKPITags });
			}

			setShowEditTagsPopup(false);
			setKpiToEditTags(null);
			setEditKPITags([]);
		} catch (error) {
			console.error('Error updating KPI tags:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateKpi = async () => {
		if (!newKPIName.trim()) return;

		try {
			setLoading(true);
			const newKpi = await createKpiCalculator({
				name: newKPIName,
				generalName: '',
				unit: '%',
				code: '',
				period: 'month',
				dataSource: '',
				periodField: 'month_field',
				calcType: 'single',
				tableVersion: newKPIName + ' - ' + new Date().toLocaleString(),
				tags: newKPITags,
				created_at: createTimestamp(),
				updated_at: createTimestamp(),
			});
			setKpiList([{ id: newKpi.id, name: newKpi.name, updated_at: createTimestamp() }, ...kpiList]);
			await handleKpiSelect(newKpi); // Fetch full details for new KPI
			setShowCreatePopup(false);
			setNewKPIName('');
			setNewKPITags([]);
		} catch (error) {
			console.error('Error creating KPI:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteClick = (kpi, e) => {
		e.stopPropagation(); // Prevent KPI selection when clicking delete
		setKpiToDelete(kpi);
		setShowDeletePopup(true);
	};

	const handleDeleteConfirm = async () => {
		if (!kpiToDelete) return;

		try {
			setLoading(true);
			await deleteKpiCalculator(kpiToDelete.id);
			setKpiList((prevList) =>
				prevList.filter((kpi) => kpi.id !== kpiToDelete.id)
			);
			if (selectedKpi?.id === kpiToDelete.id) {
				const remainingKpis = kpiList.filter(
					(kpi) => kpi.id !== kpiToDelete.id
				);
				if (remainingKpis.length > 0) {
					await handleKpiSelect(remainingKpis[0]);
				} else {
					setSelectedKpi(null);
				}
			}
		} catch (error) {
			console.error('Error deleting KPI:', error);
		} finally {
			setShowDeletePopup(false);
			setKpiToDelete(null);
			setLoading(false);
		}
	};

	const handleDuplicateClick = (kpi, e) => {
		e.stopPropagation();
		setKpiToDuplicate(kpi);
		setDuplicateKPIName(kpi.name + ' - Copy');
		setDuplicateKPITags(kpi.tags || []);
		setShowDuplicatePopup(true);
	};

	const handleDuplicateConfirm = async () => {
		if (!kpiToDuplicate || !duplicateKPIName.trim()) return;

		try {
			setLoading(true);
			// Lấy dữ liệu chi tiết của KPI gốc
			const originalKpiData = await getKpiCalculatorById(kpiToDuplicate.id);

			// Tạo KPI mới với dữ liệu từ KPI gốc
			const newKpiData = {
				...originalKpiData,
				name: duplicateKPIName,
				id: undefined, // Loại bỏ ID để tạo mới
				tableVersion: duplicateKPIName + ' - ' + new Date().toLocaleString(),
				tags: duplicateKPITags,
				created_at: createTimestamp(),
				updated_at: createTimestamp(),
			};

			const duplicatedKpi = await createKpiCalculator(newKpiData);

			// Cập nhật kpiList với dữ liệu đầy đủ
			setKpiList((prevList) => [...prevList, duplicatedKpi]);

			// Chọn KPI mới được tạo
			setSelectedKpi(duplicatedKpi);

			// Đóng popup và reset state
			setShowDuplicatePopup(false);
			setKpiToDuplicate(null);
			setDuplicateKPIName('');
			setDuplicateKPITags([]);
		} catch (error) {
			console.error('Error duplicating KPI:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSaveKpi = async (formData) => {
		if (!selectedKpi) return;

		try {
			setLoading(true);
			const updatedKpi = await updateKpiCalculator(formData);
			setSelectedKpi(updatedKpi);

			// Update name in the list if it changed
			if (formData.name !== selectedKpi.name) {
				setKpiList((prevList) =>
					prevList.map((kpi) =>
						kpi.id === selectedKpi.id ? { ...kpi, name: formData.name, updated_at: createTimestamp() } : kpi,
					),
				);
			}
		} catch (error) {
			console.error('Error updating KPI:', error);
		} finally {
			setLoading(false);
		}
	};

    const handleTemplateChange = async (approveVersionId, options = {}) => {
		try {
			setLoading(true);
			// Clear request: when switching to KPI without dataSource
			if (!approveVersionId || options.clear) {
				setTemplateColumns([]);
				setTemplateData([]);
				setLoadedColumnsSourceId(null);
				setLoadedDataSourceId(null);
				return;
			}

			// Skip loads if we already have the needed data for this source
			if (options.onlyColumns) {
				// If columns already loaded for this source, no-op
				if (loadedColumnsSourceId === approveVersionId) {
					return;
				}
				// Source changed: clear rows to avoid stale preview
				if (loadedDataSourceId !== null && loadedDataSourceId !== approveVersionId) {
					setTemplateData([]);
					setLoadedDataSourceId(null);
				}
			} else {
				// Full data load requested; if already loaded for this source, skip
				if (loadedDataSourceId === approveVersionId && Array.isArray(templateData) && templateData.length > 0) {
					return;
				}
			}

			// 1. Lấy approveVersion data
			const approvedVersions = await getAllApprovedVersion();
			const selectedVersion = approvedVersions.find(version => version.id == approveVersionId);

			if (!selectedVersion) {
				setTemplateColumns([]);
				setTemplateData([]);
				return;
			}

			const templateId = selectedVersion.id_template;

			if (!templateId) {
				console.error('No template_id found in approveVersion');
				setTemplateColumns([]);
				setTemplateData([]);
				return;
			}

			// 2. Load templateTable trước để hiển thị cột nhanh hơn
			const templateTable = await getTableByid(templateId);
			if (!templateTable) {
				console.error('Template table not found');
				setTemplateColumns([]);
				setTemplateData([]);
				return;
			}

			// 3. Lấy version_id để tìm step cụ thể trong steps của templateTable
			let versionId = selectedVersion.id_version;
			let columns = [];

			if (templateTable.steps && templateTable.steps.length > 0) {
				// Tìm step có id_step trùng với version_id
				const targetStep = templateTable.steps.find(step => step.id === versionId);

				if (targetStep && targetStep.config.outputColumns) {
					columns = targetStep.config.outputColumns.map((column, index) => ({
						id: column.name || column,
						columnName: column.name || column
					}));
				} else {
					// Fallback: lấy step cuối cùng nếu không tìm thấy step cụ thể
					const lastStep = templateTable.steps[templateTable.steps.length - 1];
					if (lastStep && lastStep.outputColumns) {
						columns = lastStep.outputColumns.map((column, index) => ({
							id: column.name || column,
							columnName: column.name || column
						}));
					}
				}
			}

			// 4. Set columns ngay lập tức để hiển thị cột trước
			if (templateTable.isCombine) {
				// Đối với combine, cần load data trước để lấy columns
				// Nhưng vẫn set empty columns để UI không bị trống
				setTemplateColumns([]);
			} else {
				if (!columns) {
					setTemplateColumns([]);
				} else {
					setTemplateColumns(columns);
				}
			}

			// Nếu chỉ cần hiển thị cấu trúc bảng (cột) để cấu hình tiếp, không tải dữ liệu hàng
			if (options.onlyColumns) {
				setLoadedColumnsSourceId(approveVersionId);
				return;
			}

			// 5. Load template data sau (có thể mất thời gian hơn)
			if (versionId === 1) versionId = null;

			if (templateTable.isCombine) {
				let dataCombine = await loadAndMergeData(templateTable);
				const fields = Object.keys(dataCombine[0]);
				columns = fields.map((columnName, index) => ({
					id: columnName,
					columnName
				}));
				setTemplateColumns(columns);
				setTemplateData(dataCombine);
			} else {
				// Lấy rows với template_id và version_id
				const response = await getTemplateRow(templateId, versionId);
				const rows = response.rows || [];
				const combinedRows = Object.values(rows).map((row) => row.data);
				setTemplateData(combinedRows);
			}
			setLoadedColumnsSourceId(approveVersionId);
			setLoadedDataSourceId(approveVersionId);
		} catch (error) {
			console.error('Error fetching template data:', error);
			setTemplateColumns([]);
			setTemplateData([]);
			setLoadedColumnsSourceId(null);
			setLoadedDataSourceId(null);
		} finally {
			setLoading(false);
		}
	};

	// Giả lập dữ liệu kết quả
	const monthlyData = [
		{
			period: '01/2024',
			actual: 28.3,
			target1: 25,
			target2: 35,
			difference: 3.3,
		},
		{
			period: '02/2024',
			actual: 32.1,
			target1: 28,
			target2: 36,
			difference: 4.1,
		},
		{
			period: '03/2024',
			actual: 35.6,
			target1: 30,
			target2: 38,
			difference: 5.6,
		},
		{
			period: '04/2024',
			actual: 33.2,
			target1: 32,
			target2: 40,
			difference: 1.2,
		},
		{
			period: '05/2024',
			actual: 31.8,
			target1: 33,
			target2: 42,
			difference: -1.2,
		},
		{
			period: '06/2024',
			actual: null,
			target1: 35,
			target2: 45,
			difference: null,
		},
	];

	return (
		<div className={styles.container} style={{ position: 'relative' }}>
			{/*{(isFirstLoading || loading) && (*/}
			{/*	<div style={{*/}
			{/*		position: 'absolute',*/}
			{/*		top: 0,*/}
			{/*		left: 0,*/}
			{/*		right: 0,*/}
			{/*		bottom: 0,*/}
			{/*		display: 'flex',*/}
			{/*		justifyContent: 'center',*/}
			{/*		alignItems: 'center',*/}
			{/*		backgroundColor: 'rgba(255, 255, 255, 0.5)',*/}
			{/*		backdropFilter: 'blur(10px)',*/}
			{/*		zIndex: 1000,*/}
			{/*	}}>*/}
			{/*		<Loading3DTower />*/}
			{/*	</div>*/}
			{/*)}*/}
			<div className={styles.mainContent}>
				{/* Sidebar */}
				<div
					className={styles.sidebar}
					style={{
						'--tab-color-1': selectedColors[0]?.color || '#13C2C2',
						'--tab-color-1-hover': selectedColors[0]?.color || '#13C2C2'
					}}
				>
					<div className={styles.sidebarContent}>
						<h2 className={styles.sidebarTitle}>Danh sách đo lường</h2>

					<div className={styles.searchContainer}>
						<input
							type="text"
							className={styles.searchInput}
							placeholder="Tìm theo tên biến số hoặc tag..."
							value={kpiSearchTerm}
							onChange={(e) => setKpiSearchTerm(e.target.value)}
						/>
						{/* Sort toggle - compact, overlayed inside search container */}
						<button
							onClick={() => setSortUpdatedAt(prev => prev === 'desc' ? 'asc' : 'desc')}
							className={styles.sortButton}
							title={sortUpdatedAt === 'desc' ? 'Mới nhất trước' : 'Cũ nhất trước'}
						>
							<ArrowUpDown size={18}  style={{color: '#454545'}}/>
						</button>
						<Search size={20} style={{position: 'absolute', right: 12, top: 6, zIndex: 1000, color: '#13C2C2'}}/>
					</div>

				<div className={styles.kpiList}>
							{sidebarLoading && <div className={styles.loading}>Loading...</div>}
						{!sidebarLoading && kpiList.length === 0 && (
								<div className={styles.emptyState}>Không có biến số nào</div>
							)}
						{!sidebarLoading &&
							kpiList
								.filter((k) => {
									const searchTerm = kpiSearchTerm.toLowerCase().trim();
									if (!searchTerm) return true;
									
									// Tìm kiếm theo tên
									const nameMatch = (k.name || '')
										.toString()
										.toLowerCase()
										.includes(searchTerm);
									
									// Tìm kiếm theo tag
									const tagMatch = (k.tags || []).some(tag =>
										tag.toLowerCase().includes(searchTerm)
									);
									
									return nameMatch || tagMatch;
								})
								.sort((a, b) => {
									const toMs = (v) => {
										if (!v) return 0;
										const t = new Date(v).getTime();
										return isNaN(t) ? 0 : t;
									};
									const ams = toMs(a.updated_at);
									const bms = toMs(b.updated_at);
									return sortUpdatedAt === 'desc' ? bms - ams : ams - bms;
								})
								.map((kpi) => (
									<div
										key={kpi.id}
										className={`${styles.kpiItem} ${selectedKpi?.id === kpi.id ? styles.kpiItemActive : ''
											}`}
										onClick={() => handleKpiSelect(kpi)}
									>
										<div className={styles.kpiItemContent}>
											<div className={styles.kpiItemNameContainer}>
												<span className={styles.kpiItemName}>{kpi.name}</span>

											{kpi.tags && kpi.tags.length > 0 && (
												<div className={styles.kpiItemTags}>
													{kpi.tags.slice(0, 3).map((tag, index) => (
														<span key={index} className={styles.kpiTag}>
															{tag}
														</span>
													))}
													{kpi.tags.length > 3 && (
														<span className={styles.kpiTagMore}>
															+{kpi.tags.length - 3}
														</span>
													)}
												</div>
											)}
											</div>
											
											{/* <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 2 }}>
												Cập nhật: {kpi.updated_at ? formatDateToDDMMYYYY(kpi.updated_at) : 'Chưa có'}
											</div> */}
										</div>
										<div className={styles.kpiItemActions}>
											<button
												className={styles.editTagsButton}
												onClick={(e) => handleEditTagsClick(kpi, e)}
												title="Edit Tags"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													className={styles.editTagsIcon}
												>
													<path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
												</svg>
											</button>
											<button
												className={styles.duplicateButton}
												onClick={(e) => handleDuplicateClick(kpi, e)}
												title="Duplicate KPI"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													className={styles.duplicateIcon}
												>
													<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
													<path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
												</svg>
											</button>
											<button
												className={styles.deleteButton}
												onClick={(e) => handleDeleteClick(kpi, e)}
												title="Delete KPI"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													className={styles.deleteIcon}
												>
													<path
														fillRule="evenodd"
														d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
														clipRule="evenodd"
													/>
												</svg>
											</button>
										</div>
									</div>
								))}

						</div>
						<button
							className={styles.createButton}
							onClick={() => setShowCreatePopup(true)}
						>
							+ Tạo mới
						</button>
					</div>
				</div>

				{/* Create KPI Popup */}
				{showCreatePopup && (
					<div
						className={styles.popupOverlay}
						style={{
							'--tab-color-1': selectedColors[0]?.color || '#13C2C2',
							'--tab-color-1-hover': selectedColors[0]?.color || '#13C2C2'
						}}
					>
						<div className={styles.popupContent}>
							<h3 className={styles.popupTitle}>Tạo biến số mới</h3>
							<div className={styles.popupForm}>
								<label className={styles.label}>Tên biến số:</label>
								<input
									type="text"
									className={styles.input}
									value={newKPIName}
									onChange={(e) => setNewKPIName(e.target.value)}
									placeholder="Nhập tên biến số"
								/>
								{/*<label className={styles.label}>Tags:</label>*/}
								{/*<TagInput*/}
								{/*	tags={newKPITags}*/}
								{/*	onTagsChange={setNewKPITags}*/}
								{/*	placeholder="Nhập tag và nhấn Enter"*/}
								{/*	maxTags={10}*/}
								{/*/>*/}
							</div>
							<div className={styles.popupActions}>
								<button
									className={styles.cancelButton}
									onClick={() => {
										setShowCreatePopup(false);
										setNewKPIName('');
										setNewKPITags([]);
									}}
								>
									Hủy
								</button>
								<button
									className={styles.confirmButton}
									onClick={handleCreateKpi}
									disabled={!newKPIName.trim() || loading}
								>
									{loading ? 'Đang tạo...' : 'Tạo'}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Delete Confirmation Popup */}
				{showDeletePopup && (
					<div
						className={styles.popupOverlay}
						style={{
							'--tab-color-1': selectedColors[0]?.color || '#13C2C2',
							'--tab-color-1-hover': selectedColors[0]?.color || '#13C2C2'
						}}
					>
						<div className={styles.popupContent}>
							<h3 className={styles.popupTitle}>Xác nhận xóa</h3>
							<div className={styles.popupMessage}>
								Bạn có chắc chắn muốn xóa KPI "{kpiToDelete?.name}"?
								<br />
								<span className={styles.warningText}>
									Hành động này không thể hoàn tác.
								</span>
							</div>
							<div className={styles.popupActions}>
								<button
									className={styles.cancelButton}
									onClick={() => {
										setShowDeletePopup(false);
										setKpiToDelete(null);
									}}
								>
									Hủy
								</button>
								<button
									className={`${styles.confirmButton} ${styles.deleteConfirmButton}`}
									onClick={handleDeleteConfirm}
									disabled={loading}
								>
									{loading ? 'Đang xóa...' : 'Xóa'}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Duplicate Confirmation Popup */}
				{showDuplicatePopup && (
					<div
						className={styles.popupOverlay}
						style={{
							'--tab-color-1': selectedColors[0]?.color || '#13C2C2',
							'--tab-color-1-hover': selectedColors[0]?.color || '#13C2C2'
						}}
					>
						<div className={styles.popupContent}>
							<h3 className={styles.popupTitle}>Sao chép biến số</h3>
							<div className={styles.popupForm}>
								<label className={styles.label}>Tên biến số sao chép:</label>
								<input
									type="text"
									className={styles.input}
									value={duplicateKPIName}
									onChange={(e) => setDuplicateKPIName(e.target.value)}
									placeholder="Nhập tên biến số sao chép"
								/>
								<label className={styles.label}>Tags:</label>
								<TagInput
									tags={duplicateKPITags}
									onTagsChange={setDuplicateKPITags}
									placeholder="Nhập tag và nhấn Enter"
									maxTags={10}
								/>
							</div>
							<div className={styles.popupActions}>
								<button
									className={styles.cancelButton}
									onClick={() => {
										setShowDuplicatePopup(false);
										setKpiToDuplicate(null);
										setDuplicateKPIName('');
										setDuplicateKPITags([]);
									}}
								>
									Hủy
								</button>
								<button
									className={`${styles.confirmButton} ${styles.duplicateConfirmButton}`}
									onClick={handleDuplicateConfirm}
									disabled={loading || !duplicateKPIName.trim()}
								>
									{loading ? 'Đang sao chép...' : 'Sao chép'}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Edit Tags Popup */}
				{showEditTagsPopup && (
					<div
						className={styles.popupOverlay}
						style={{
							'--tab-color-1': selectedColors[0]?.color || '#13C2C2',
							'--tab-color-1-hover': selectedColors[0]?.color || '#13C2C2'
						}}
					>
						<div className={styles.popupContent}>
							<h3 className={styles.popupTitle}>Chỉnh sửa Tags</h3>
							<div className={styles.popupForm}>
								<label className={styles.label}>KPI: {kpiToEditTags?.name}</label>
								<br />
								<label className={styles.label}>Tags:</label>
								<TagInput
									tags={editKPITags}
									onTagsChange={setEditKPITags}
									placeholder="Nhập tag và nhấn Enter"
									maxTags={10}
								/>
							</div>
							<div className={styles.popupActions}>
								<button
									className={styles.cancelButton}
									onClick={() => {
										setShowEditTagsPopup(false);
										setKpiToEditTags(null);
										setEditKPITags([]);
									}}
								>
									Hủy
								</button>
								<button
									className={styles.confirmButton}
									onClick={handleEditTagsConfirm}
									disabled={loading}
								>
									{loading ? 'Đang lưu...' : 'Lưu'}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Main Content */}
				{selectedKpi ? (
					<KPIContent
						selectedKpi={selectedKpi}
						activeTab={activeTab}
						setActiveTab={setActiveTab}
						monthlyData={monthlyData}
						onSave={handleSaveKpi}
						onNameUpdate={handleKpiNameUpdate}
						templateList={templateList}
						templateColumns={templateColumns}
						templateData={templateData}
						onTemplateChange={handleTemplateChange}
						selectedColors={selectedColors}
					/>
				) : (
					<div
						className={styles.emptyContent}
						style={{
							'--tab-color-1': selectedColors[0]?.color || '#13C2C2',
							'--tab-color-1-hover': selectedColors[0]?.color || '#13C2C2'
						}}
					>
						<div className={styles.emptyContentMessage}>
							<p>Vui lòng chọn một biến số từ danh sách bên trái hoặc tạo mới một biến số để bắt đầu.</p>
							<div className={styles.emptyContentActions}>

								<button
									className={styles.createNewButton}
									onClick={() => setShowCreatePopup(true)}
								>
									Tạo biến số mới
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default KPICalculator;
