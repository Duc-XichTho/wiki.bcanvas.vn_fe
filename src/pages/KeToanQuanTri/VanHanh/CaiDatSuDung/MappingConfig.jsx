import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Typography, message, Button } from 'antd';
import { MyContext } from '../../../../MyContext.jsx';
import axios from 'axios';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale.jsx';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { Settings } from 'lucide-react';
import MappingCategorySettingModal from './MappingCategorySettingModal';
import { getAllKTQTMapping, updateKTQTMapping } from '../../../../apis/ktqtMappingService.jsx';
import {
	getTemplateByFileNoteId,
	getTemplateColumnForTemplate,
	getTemplateRow,
} from '../../../../apis/templateSettingService.jsx';
import { getAllKTQTImport, updateKTQTImport } from '../../../../apis/ktqtImportService.jsx';
import { getAllSoKeToan, updateBulkSoKeToan } from '../../../../apisKTQT/soketoanService.jsx';
import { getApprovedVersionDataById } from '../../../../apis/approvedVersionTemp.jsx';
import { getTemplateInfoByTableId } from '../../../../apis/templateSettingService.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const { Title } = Typography;

const DATASET_OPTIONS = [
	{ id: 'DT', label: 'Doanh thu' },
	{ id: 'GV', label: 'Giá vốn' },
	{ id: 'CP', label: 'Chi phí' },
];

const MAPPING_CATEGORIES = [
	{ id: 'kmf', label: 'Khoản mục KQKD' },
	{ id: 'san_pham', label: 'Sản phẩm' },
	{ id: 'kenh', label: 'Kênh' },
	{ id: 'vu_viec', label: 'Vụ việc' },
	{ id: 'bo_phan', label: 'Bộ phận' },
];

const MappingConfig = () => {
	const { company, yearCDSD } = useContext(MyContext);
	const [loading, setLoading] = useState(false);
	const [selectedDataset, setSelectedDataset] = useState('DT');
	const [selectedCategory, setSelectedCategory] = useState('');
	const [rowData, setRowData] = useState([]);
	const gridRef = useRef();
	const [showSettingModal, setShowSettingModal] = useState(false);
	const [mappingOptions, setMappingOptions] = useState([]);
	const [categoryTypesMap, setCategoryTypesMap] = useState({});

	const defaultColDef = useMemo(() => ({
		editable: true,
		filter: true,
		suppressMenu: true,
		cellStyle: { fontSize: '14.5px' },
		wrapHeaderText: true,
		autoHeaderHeight: true,
	}), []);

	const columnDefs = useMemo(() => [
		{
			headerName: 'Danh mục lấy từ dữ liệu nhập vào',
			field: 'current_value',
			editable: false,
			flex: 1,
		},
		{
			headerName: 'Danh mục chuẩn',
			field: 'mapped_value',
			flex: 1,
			cellEditor: 'agRichSelectCellEditor',
			cellEditorParams: {
				values: mappingOptions,
			},
		},
	], [mappingOptions]);

	// Map dataset id to type string in setting.types
	const DATASET_TYPE_MAP = {
		DT: 'doanh_thu',
		CP: 'chi_phi',
		GV: 'gia_von',
	};

	// Hàm lấy tên cột theo category
	const getCategoryField = (category) => {
		switch (category) {
			case 'kmf':
				return 'kmf';
			case 'vu_viec':
				return 'project';
			case 'san_pham':
				return 'product';
			case 'kenh':
				return 'kenh';
			case 'bo_phan':
				return 'unit_code';
			default:
				return null;
		}
	};

	// Fetch mapping data and types
	const fetchMappingData = async () => {
		setLoading(true);
		try {
			// Lấy mapping đã lưu
			const mappings = await getAllKTQTMapping();
			// Lưu lại types cho từng category
			const typesMap = {};
			(mappings || []).forEach(m => {
				if (m.setting && Array.isArray(m.setting.types)) {
					typesMap[m.danhMuc] = m.setting.types;
				} else {
					typesMap[m.danhMuc] = [];
				}
			});
			setCategoryTypesMap(typesMap);
			const mapping = (mappings || []).find(m => m.danhMuc === selectedCategory);

			// Lấy danh mục hiện có từ import hoặc sổ kế toán
			const field = getCategoryField(selectedCategory) + 'Goc';
			let importData = [];
			if (selectedDataset === 'CP') {
				importData = await getAllSoKeToan();
			} else {
				importData = await getAllKTQTImport();
			}
			let currentList = [];
			if (field) {
				// Lọc theo phan_loai (dataset) nếu không phải CP
				const filtered = (selectedDataset === 'CP')
					? (importData || []).filter(row => !row.idKTQT)
					: (importData || []).filter(row => row.phan_loai === selectedDataset);
				currentList = Array.from(new Set(filtered.map(row => row[field]).filter(v => v !== undefined && v !== null)));
			}
			// Lấy danh mục chuẩn (mappingOptions)
			let mappingOptions = [];
			if (mapping && mapping.nguon && mapping.dich) {
				// Lấy đúng dữ liệu bảng Rubik đã chọn, đúng version
				try {
					const info = await getApprovedVersionDataById(mapping.nguon);
					const templateInfo = await getTemplateInfoByTableId(info.id_template);
					let versionObj;
					if (info.id_version == 1 || info.id_version == null) {
						versionObj = templateInfo.versions.find(v => v.version == null);
					} else {
						versionObj = templateInfo.versions.find(v => v.version == info.id_version);
					}
					// Lấy rowData đúng version
					const rowDataResponse = await getTemplateRow(info.id_template, info.id_version == 1 || info.id_version == null ? null : info.id_version);
					const rowData = rowDataResponse.rows || [];
					mappingOptions = Array.from(new Set((rowData || []).map(row => row.data?.[mapping.dich]).filter(v => v !== undefined && v !== null)));
				} catch (e) {
					mappingOptions = [];
				}
			}
			setMappingOptions(mappingOptions);
			// --- Lấy đúng mảng mapping theo dataset ---
			let allKeysSet = new Set(currentList);
			let mappingDataArr = [];
			if (mapping && mapping.data && typeof mapping.data === 'object') {
				mappingDataArr = mapping.data[selectedDataset] || [];
				mappingDataArr.forEach(d => {
					if (d.danh_muc_hien_co) allKeysSet.add(d.danh_muc_hien_co);
				});
			}
			const allKeys = Array.from(allKeysSet);

			let mappedData = allKeys.map(val => {
				const found = mappingDataArr ? mappingDataArr.find(d => d.danh_muc_hien_co === val) : null;
				return {
					current_value: val,
					mapped_value: found ? found.danh_muc_chuan : null,
				};
			});
			setRowData(mappedData);
		} catch (error) {
			console.error('Error fetching mapping data:', error);
			message.error('Không thể tải dữ liệu mapping');
			setMappingOptions([]);
			setRowData([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMappingData();
	}, [selectedDataset, selectedCategory, showSettingModal]);
	// Đảm bảo selectedCategory luôn hợp lệ với dataset hiện tại
	useEffect(() => {
		const DATASET_TYPE_MAP = {
			DT: 'doanh_thu',
			CP: 'chi_phi',
			GV: 'gia_von',
		};
		const validCategories = MAPPING_CATEGORIES.filter(category => {
			const types = categoryTypesMap[category.id] || [];
			return types.includes(DATASET_TYPE_MAP[selectedDataset]);
		});
		if (validCategories.length === 0) {
			setSelectedCategory(null);
		} else if (!validCategories.some(cat => cat.id === selectedCategory)) {
			setSelectedCategory(validCategories[0].id);
		}
	}, [selectedDataset, categoryTypesMap]);

	const handleRunMapping = async () => {
		setLoading(true);
		try {
			let importData = [];
			if (selectedDataset === 'CP') {
				importData = await getAllSoKeToan();
			} else {
				importData = await getAllKTQTImport();
			}
			const field = getCategoryField(selectedCategory);
			if (!field) {
				message.error('Không xác định được trường cần mapping');
				setLoading(false);
				return;
			}

			const mappingMap = {};
			rowData.forEach(row => {
				if (row.mapped_value) {
					mappingMap[row.current_value] = row.mapped_value;
				}
			});

			// Lọc các dòng cần update
			let filteredRows = [];
			if (selectedDataset === 'CP') {
				filteredRows = (importData || []).filter(row => !row.idKTQT);
			} else {
				filteredRows = (importData || []).filter(row => row.phan_loai === selectedDataset);
			}

			// Tạo mảng các bản ghi cần update
			const updates = [];
			for (const row of filteredRows) {
				const currentValue = row[field + 'Goc'];
				if (mappingMap.hasOwnProperty(currentValue)) {
					const newValue = mappingMap[currentValue];
					if (newValue && newValue !== currentValue) {
						updates.push({ ...row, [field]: newValue });
						continue
					}
				}
				updates.push({ ...row, [field]: currentValue });

			}
			if (updates.length === 0) {
				message.info('Không có dòng nào cần cập nhật.');
			} else if (updates.length === 1) {
				if (selectedDataset === 'CP') {
					await updateBulkSoKeToan([updates[0]]);
				} else {
					await updateKTQTImport(updates[0]);
				}
				message.success('Chạy mapping thành công. Đã cập nhật 1 dòng.');
			} else {
				if (selectedDataset === 'CP') {
					await updateBulkSoKeToan(updates);
				} else {
					await updateKTQTImport(updates);
				}
				message.success(`Chạy mapping thành công. Đã cập nhật ${updates.length} dòng.`);
			}
			// Cập nhật lại bảng mapping sau khi chạy xong
			await fetchMappingData();
		} catch (error) {
			console.error('Error running mapping:', error);
			message.error('Không thể chạy mapping');
		} finally {
			setLoading(false);
		}
	};

	// Hàm cập nhật mapping khi bảng thay đổi
	const updateMappingOnChange = async (newRowData) => {
		try {
			const mappings = await getAllKTQTMapping();
			const mapping = (mappings || []).find(m => m.danhMuc === selectedCategory);
			if (mapping && mapping.id) {
				// Nếu data chưa có dạng object thì chuyển đổi
				let newData = {};
				if (mapping.data && typeof mapping.data === 'object' && !Array.isArray(mapping.data)) {
					newData = { ...mapping.data };
				} else {
					// Nếu là mảng cũ thì convert sang object
					newData = { DT: [], GV: [], CP: [] };
				}
				newData[selectedDataset] = newRowData.map(row => ({
					danh_muc_hien_co: row.current_value,
					danh_muc_chuan: row.mapped_value,
				}));
				await updateKTQTMapping(mapping.id, {
					danhMuc: selectedCategory,
					nguon: mapping.nguon,
					dich: mapping.dich,
					data: newData,
				});
			}
		} catch (e) {
			message.error('Cập nhật mapping thất bại');
		}
	};

	const onCellValueChanged = (params) => {
		const updatedData = rowData.map(row =>
			row.current_value === params.data.current_value
				? { ...row, mapped_value: params.newValue }
				: row,
		);
		setRowData(updatedData);
		updateMappingOnChange(updatedData);
	};

	return (
		<div style={{ display: 'flex', height: '100%' }}>
			{/* Dataset Sidebar */}
			<div style={{
				width: '200px',
				borderRight: '1px solid #f0f0f0',
				padding: '20px',
				backgroundColor: '#fafafa',
			}}>
				<Title level={5}
					onClick={() => setShowSettingModal(true)}
					style={{cursor : 'pointer', display: 'flex', justifyContent: 'start', alignItems: 'center', gap: '10px' }}>Thiết lập danh mục chuẩn

					{/* <Button icon={<Settings size={20} />} onClick={() => setShowSettingModal(true)}
							style={{ border: 'none', boxShadow: 'none', background: 'none' }} /> */}

				</Title>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
					{DATASET_OPTIONS.map(option => (
						<div
							key={option.id}
							onClick={() => {
								setSelectedDataset(option.id);
								// Set default category for the selected dataset
								setSelectedCategory(MAPPING_CATEGORIES[0].id);
							}}
							style={{
								padding: '10px',
								cursor: 'pointer',
								backgroundColor: selectedDataset === option.id ? '#e6f7ff' : 'transparent',
								borderRadius: '4px',
							}}
						>
							{option.label}
						</div>
					))}
				</div>
			</div>

			{/* Category Sidebar */}
			<div style={{
				width: '200px',
				borderRight: '1px solid #f0f0f0',
				padding: '20px',
				backgroundColor: '#fff',
			}}>
				<Title level={5}>Danh mục</Title>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
					{MAPPING_CATEGORIES.filter(category => {
						const types = categoryTypesMap[category.id] || [];
						return types.includes(DATASET_TYPE_MAP[selectedDataset]);
					}).map(category => (
						<div
							key={category.id}
							onClick={() => setSelectedCategory(category.id)}
							style={{
								padding: '10px',
								cursor: 'pointer',
								backgroundColor: selectedCategory === category.id ? '#e6f7ff' : 'transparent',
								borderRadius: '4px',
							}}
						>
							{category.label}
						</div>
					))}
				</div>
			</div>

			{/* Main Content */}
			<div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>

				{selectedCategory ? (<>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<Title level={4}>
							Mapping {DATASET_OPTIONS.find(d => d.id === selectedDataset)?.label} - {MAPPING_CATEGORIES.find(c => c.id === selectedCategory)?.label}
						</Title>
						<Button
							onClick={handleRunMapping}
							disabled={loading}
						>
							{loading ? 'Đang xử lý...' : 'Chạy'}
						</Button>
					</div>

					{mappingOptions.length === 0 && (
						<div style={{ color: 'red', marginBottom: 8 }}>Không có danh mục chuẩn để chọn!</div>
					)}

					<div className="ag-theme-quartz" style={{ width: '100%', height: '100%' }}>
						<AgGridReact
							ref={gridRef}
							rowData={rowData}
							columnDefs={columnDefs}
							defaultColDef={defaultColDef}
							onCellValueChanged={onCellValueChanged}
							localeText={AG_GRID_LOCALE_VN}
							suppressRowClickSelection={true}
							rowSelection="multiple"
							enableRangeSelection={true}
						/>
					</div>
				</>

				) : (
					<div style={{
						width: '100%',
						height: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 20,
						color: '#888',
					}}>
						Cấu hình dataset để sử dụng
					</div>
				)}
			</div>
			<MappingCategorySettingModal open={showSettingModal} onClose={() => setShowSettingModal(false)} />
		</div>
	);
};

export default MappingConfig;