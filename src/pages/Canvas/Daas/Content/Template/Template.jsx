import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import './Template.css';
import { toast } from 'react-toastify';
import { evaluate } from 'mathjs';
import AG_GRID_LOCALE_VN from '../../../../Home/AgridTable/locale';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';

import { deleteTemplateRows, getAllTemplateSheetTable } from '../../../../../apis/templateSettingService.jsx';
import {
	deleteFileNotePad,
	getAllFileNotePad,
	getFileNotePadByIdController,
	updateFileNotePad,
} from '../../../../../apis/fileNotePadService.jsx';

import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import SheetColumnSetting from './sheetColumnSetting/sheetColumnSetting';
import {
	createBathTemplateRow,
	createTemplateColumn,
	deleteTemplateColByTableId,
	deleteTemplateRowByTableId,
	getTableByid,
	getTemplateByFileNoteId,
	getTemplateColumn,
	getTemplateColumnForTemplate,
	getTemplateRow,
	getTemplateRowById,
	updateBatchTemplateRow,
	updateColumnIndexes,
	updateTemplateColumnWidth,
	updateTemplateRow,
	updateTemplateTable,
} from '../../../../../apis/templateSettingService';
import {
	Badge,
	Button,
	Checkbox,
	Dropdown,
	Input,
	message,
	Modal,
	Popconfirm,
	Spin,
	Table,
	Tag,
	Typography,
	Pagination,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import Dragger from 'antd/es/upload/Dragger.js';
import { getAllCrossCheck } from '../../../../../apis/crossCheckService';
import MappingElement from '../../../CrossCheck/components/Mapping/MappingElement/MappingElement.jsx';
import { getValidateData } from '../../../../../generalFunction/getValidateData.js';
import ValidateElementView from '../../../CrossCheck/components/Validate/ValidateElement/ValidateElementView.jsx';
import { IconUser } from '../../../../../icon/IconSVG.js';
import css from './Template.module.css';
import { getAllUserClass } from '../../../../../apis/userClassService.jsx';
import TemplateForm from './TemplateForm/TemplateForm';
import SettingChart from './SettingChart/SettingChart.jsx';
import { MyContext } from '../../../../../MyContext.jsx';
import SettingCombine2 from './SettingCombine/SettingCombine2.jsx';
import ViewCombine from './SettingCombine/ViewCombine.jsx';
import RichNoteKTQTRI from '../../../../Home/SelectComponent/RichNoteKTQTRI.jsx';
import ActionMenuDropdown from '../../../../KeToanQuanTri/ActionButton/ActionMenuDropdown.jsx';
import pLimit from 'p-limit';
import { SettingCraw } from './Craw/SettingCraw.jsx';
import RotateTable from '../RotateTable/RotateTable.jsx';
import { Template_Table_Type } from '../../../../../CONST.js';
import VLookUp from '../VLookUp/VLookUp.jsx';
import BangGhep from '../../../DuLieu/CanvasDuLieuDauVao/WaitScreen/BangGhep.jsx';
import BangDuLieu from '../../../DuLieu/CanvasDuLieuDauVao/WaitScreen/BangDuLieu.jsx';
import SheetDetail from './TemplateForm/SheetDeital.jsx';
import { loadAndMergeData } from './SettingCombine/logicCombine.js';
import { buildColumn, buildColumnDef } from './TemplateLogic/buildColumnDef.jsx';
import UpdateAllRotateTablesButton from './UpdateAllRotateTablesButton';
import { ChevronLeft, ChevronRight, Plus, Table2, Settings } from 'lucide-react';
import ActionDeleteMany from '../../../../Home/AgridTable/actionButton/ActionDeleteMany.jsx';
import ActionSave from '../../../../Home/AgridTable/actionButton/ActionSave.jsx';
import PreviewRenderer
	from '../../../../Home/SubStep/SubStepItem/SubStepSheet/popUpPreviewRenderer/PreviewRenderer.jsx';
import { getSettingByType } from '../../../../../apis/settingService.jsx';
import ModalAddOriginalData from './ModalAddOriginalData.jsx';

const limit = pLimit(30);

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

const columnTypeOptions = [
	{
		value: 'text',
		label: 'Text',
		desc: 'Định dạng chữ, dùng để hiển thị các nội dung không phải số liệu, giá trị',
		type: 'Định dạng',
	},
	{
		value: 'number',
		label: 'Number',
		desc: 'Định dạng số, dùng để hiển thị các nội dung số liệu, giá trị',
		type: 'Định dạng',
	},
	{
		value: 'date',
		label: 'Date',
		desc: 'Định dạng thời gian DD/MM/YYYY hoặc MM/DD/YYYY và cài đặt đầu vào từ excel',
		type: 'Chức năng',
	},
	{ value: 'select', label: 'Select', desc: 'Danh sách lựa chọn', type: 'Định dạng' },
	{ value: 'formula', label: 'Công thức', desc: 'Tính toán giá trị từ các cột khác', type: 'Chức năng' },
	{ value: 'file', label: 'Đính kèm', desc: 'Tải lên file ảnh, excel, pdf, word, ...', type: 'Định dạng' },
	{
		value: 'duyet',
		label: 'Xác nhận',
		desc: 'Cho phép nhóm người dùng cụ thể được xác nhận dòng',
		type: 'Chức năng',
	},
	{ value: 'conditional', label: 'Điều kiện', desc: 'Điều kiện', type: 'Chức năng' },
	{ value: 'dateCalc', label: 'Tính Ngày', desc: 'Tính khoảng thời gian', type: 'Chức năng' },
	// { value: 'lookup', label: 'Lookup' },
	{
		value: 'duyet_dieu_kien',
		label: 'Duyệt',
		desc: 'Cho phép nhóm người dùng cụ thể được duyệt dòng khi thỏa mãn các điều kiện nhất định',
		type: 'Chức năng',
	},
	{
		value: 'bieu_tuong_phan_tram',
		label: 'Progress Bar',
		desc: 'Hiện thị số, giá trị theo dạng thanh ngang',
		type: 'Định dạng',
	},
	{
		value: 'date_time_picker',
		label: 'Date - Time (Ngày/Tháng/Năm - Giờ/Phút)',
		desc: 'Hiện thị thời gian dạng ngày, tháng, năm và giờ, phút',
		type: 'Định dạng',
	},
	{
		value: 'time_diff',
		label: 'Tính chênh lệch thời gian',
		desc: 'Tính chênh lệch thời gian giữa 2 cột',
		type: 'Định dạng',
	},
	{
		value: 'date_split',
		label: 'Tách ngày tháng năm',
		desc: 'Tách riêng ngày, tháng, năm từ 1 cột dạng Date',
		type: 'Chức năng',
	}];

const Template = ({ showFormModal }) => {
	const [menuSettingsVersion, setMenuSettingsVersion] = useState(null);
	useEffect(() => {
		getSettingByType('MenuSettings').then(res => {
			setMenuSettingsVersion(res.setting.version);
		});

	}, []);
	const [editCount, setEditCount] = useState(0);
	const fileNoteId = useParams().id;
	const gridRef = useRef();
	const [showSettingsPopup, setShowSettingsPopup] = useState(false);
	const [fileNote, setFileNote] = useState(null);
	const [templateData, setTemplateData] = useState(null);
	const [templateColumns, setTemplateColumns] = useState([]);
	const [rowData, setRowData] = useState([]);
	const [colDefs, setColDefs] = useState([]);
	const [dropdownOptions, setDropdownOptions] = useState({});
	const {
		currentUser,
		listUC_CANVAS,
		isUpdateNoti,
		setLoadData,
		loadData,
		uCSelected_CANVAS,
	} = useContext(MyContext);
	const [isDataLoaded, setIsDataLoaded] = useState(false);
	const [isImportModalVisible, setIsImportModalVisible] = useState(false);
	const [importedData, setImportedData] = useState([]);
	const [importColumns, setImportColumns] = useState([]);
	const [selectedmapping, setSelectedMapping] = useState({});
	const [isMappingModalVisible, setIsMappingModalVisible] = useState(false);
	const [isMappingChoicePopoverVisible, setIsMappingChoicePopoverVisible] = useState(false);
	const [itemsMapping, setItemsMapping] = useState([]);
	const [isImportChoicePopoverVisible, setIsImportChoicePopoverVisible] = useState(false);
	const [countErr, setCountErr] = useState(0);
	const [validates, setValidates] = useState([]);
	const [isValidateModalVisible, setIsValidateModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState(false);
	const [duplicateHighlightColumns, setDuplicateHighlightColumns] = useState([]);
	const [showDuplicateColumnSelector, setShowDuplicateColumnSelector] = useState(false);
	const [isStatusFilter, setIsStatusFilter] = useState(false);
	const [selectedUC, setSelectedUC] = useState(new Set([]));
	const [listUC, setListUC] = useState([]);
	const [isView, setIsView] = useState(false);
	const [openSetupUC, setOpenSetupUC] = useState(false);
	const [isFormModalVisible, setIsFormModalVisible] = useState(false);
	const location = useLocation();
	const [isCustomRowModalVisible, setIsCustomRowModalVisible] = useState(false);
	const [customRowCount, setCustomRowCount] = useState(1);
	const [showSettingsChartPopup, setShowSettingsChartPopup] = useState(false);
	const [showSettingsCombine, setShowSettingsCombine] = useState(false);
	const [showSettingsCraw, setShowSettingsCraw] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [showInfo, setShowInfo] = useState(false);
	const [isProcessingFile, setIsProcessingFile] = useState(false);
	const [loading, setLoading] = useState(false);
	const [textLoad, setTextLoad] = useState('Đang xử lý dữ liệu ...');
	const [isUpdating, setIsUpdating] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [templateList, setTemplateList] = useState([]);

	const [filteredRecords, setFilteredRecords] = useState([]);
	const [selectedRecords, setSelectedRecords] = useState([]);
	const [status, setStatus] = useState(null);
	const [isMainTab, setIsMainTab] = useState(false);
	const [tabRotates, setTabRotates] = useState([]);
	// trong component
	const [selectedTabId, setSelectedTabId] = useState(fileNoteId);
	const [selectedTab, setSelectedTab] = useState(null);
	const { companySelect, buSelect, id } = useParams();
	const [columnsGocData, setColumnsGocData] = useState([]);
	const [rowDataGocData, setRowDataGocData] = useState([]);
	const [renameTabModal, setRenameTabModal] = useState({ visible: false, tab: null, name: '' });
	const sheetTabsRef = useRef();
	const [showLeft, setShowLeft] = useState(false);
	const [showRight, setShowRight] = useState(false);
	const [isDuLieuNen, setIsDuLieuNen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(50000);
	const [totalRows, setTotalRows] = useState(0);

	const handlePageChange = (page, size) => {
		setCurrentPage(page);
		if (size !== pageSize) {
			setPageSize(size);
		}
	};

	const [isMobileMenu, setIsMobileMenu] = useState(window.innerWidth < 1400);
	const [updatedData, setUpdatedData] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const [fills, setFills] = useState([]);
	useEffect(() => {
		const fetchColors = async () => {
			try {
				const data = await getSettingByType('SettingThemeColor');
				setFills([data.setting.themeColor]);
			} catch (error) {
				console.error('Error fetching colors:', error);
				setFills(['#454545']);
			}
		};

		fetchColors();
	}, []);

	useEffect(() => {
		const handleResize = () => {
			setIsMobileMenu(window.innerWidth < 1300);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);


	useEffect(() => {
		const checkPath = () => {
			const path = window.location.pathname;
			setIsDuLieuNen(path.includes('du-lieu-nen'));
		};

		// Run on initial load
		checkPath();

		// Listen to URL changes (popstate for back/forward)
		window.addEventListener('popstate', checkPath);

		// Optional: also listen to pushState/replaceState if your router does that without reloading
		const originalPushState = history.pushState;
		history.pushState = function() {
			originalPushState.apply(this, arguments);
			checkPath();
		};

		return () => {
			window.removeEventListener('popstate', checkPath);
			history.pushState = originalPushState; // cleanup
		};
	}, []);

	function filter() {
		if (isStatusFilter) {
			return {
				filter: 'agMultiColumnFilter', floatingFilter: true, filterParams: {
					filters: [{
						filter: 'agTextColumnFilter',
					}, {
						filter: 'agSetColumnFilter',
					}],
				},
			};
		}
	}

	const handleChangeStatusFilter = () => {
		setIsStatusFilter((prev) => {
			return !prev;
		});
	};

	const toggleDuplicateHighlight = (columnName) => {
		setDuplicateHighlightColumns((prev) => {
			if (prev.includes(columnName)) {
				return prev.filter((col) => col !== columnName);
			} else {
				return [...prev, columnName];
			}
		});
	};

	const fetchDataCrossCheckAndValidate = async () => {
		try {
			const result = await getAllCrossCheck();
			const filteredDataValidate = result.filter((item) => item.type === 'Validate');
			let dataValivate = [];
			let count = 0;
			try {
				for (const filteredDataValidateElement of filteredDataValidate) {
					let countValidate = 0;
					let data = await getValidateData(filteredDataValidateElement);
					if (data) {
						if (data.result.length > 0) {
							for (const resultElement of data.result) {
								if (!resultElement.existsInChecking) {
									countValidate++;
								}
							}
						}
					}

					if (countValidate > 0) {
						let bo_du_lieu = filteredDataValidateElement.primarySource?.bo_du_lieu;
						let idTemp = bo_du_lieu?.split('_')[1];
						let key = filteredDataValidateElement.primarySource.cot_du_lieu;
						let item = {
							name: filteredDataValidateElement.name,
							count: countValidate,
							cot_du_lieu: key,
							key: key,
							onClick: () => {
								setSelectedItem(filteredDataValidateElement);
								setIsValidateModalVisible(true);
							},
							label: (<span>
								{' '}
								Cột {key} có {countValidate} dòng chưa điền hoặc chưa đúng{' '}
							</span>),
							idTemp, ...filteredDataValidateElement,
						};
						dataValivate.push(item);
					}
				}
				dataValivate = dataValivate.filter((item) => item.idTemp == templateData.id);
				dataValivate.forEach((item) => {
					count += item.count;
				});
				setCountErr(count);
				setValidates(dataValivate);
			} catch (e) {
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu:', error);
		}
	};

	const fetchAllCrossCheck = async () => {
		try {
			const res = await getAllCrossCheck();
			const filtersMapping = res.filter((item) => item.type == 'Mapping');
			let mapping = [];
			if (filtersMapping.length > 0) {
				for (const filtersMappingElement of filtersMapping) {
					if (filtersMappingElement?.info?.validateRecord?.primarySource?.id == fileNoteId) {
						mapping.push({
							onClick: () => {
								setSelectedMapping(filtersMappingElement);
								setIsMappingModalVisible(true);
							}, key: filtersMappingElement.id, label: (<span style={{ width: '100%', height: '100%' }}>
								{' '}
								{filtersMappingElement.name}{' '}
							</span>),
						});
					}
				}
			}
			setItemsMapping(mapping);
		} catch (error) {
			console.error('Lỗi khi lấy danh sách cross check:', error);
		}
	};

	const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

	// Hàm xuất Excel
	const exportToExcel = () => {
		// Tạo dữ liệu cho file Excel
		const headers = templateColumns.map((col) => col.columnName); // Lấy tên cột từ templateColumns
		const data = rowData.map((row) => {
			const rowData = {};
			templateColumns.forEach((col) => {
				rowData[col.columnName] = row[col.columnName] || ''; // Lấy giá trị từ rowData
			});
			return rowData;
		});

		// Tạo worksheet
		const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

		// Tạo workbook và thêm worksheet
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

		// Xuất file Excel
		XLSX.writeFile(workbook, `${templateData.name || 'Template'}.xlsx`);
	};
	// Hàm xuất Excel
	const exportTemplateToExcel = () => {
		// Tạo dữ liệu cho file Excel
		const headers = templateColumns
			.filter((col) => col.columnName !== 'Thời gian')
			.map((col) => col.columnName); // Lấy tên cột từ templateColumns

		// Tạo worksheet
		const worksheet = XLSX.utils.json_to_sheet([], { header: headers });

		// Tạo workbook và thêm worksheet
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

		// Xuất file Excel
		XLSX.writeFile(workbook, `${fileNote && fileNote.name ? `Template_${fileNote.name}` : 'Template'}.xlsx`);
	};

	const handleFileUpload = (file) => {
		setLoading(true);
		setTextLoad('Đang đọc dữ liệu từ file...');
		try {
			setIsProcessingFile(true);
			const reader = new FileReader();
			reader.onload = (e) => {
				const data = new Uint8Array(e.target.result);
				const workbook = XLSX.read(data, { type: 'array' });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

				if (jsonData.length > 0) {
					const headers = jsonData[0]
						.map((header) => (header ? header.trim() : null))
						.filter((header) => header);

					const missingColumns = templateColumns
						.map((column) => column.columnName.trim())
						.filter((columnName) => !headers.includes(columnName));

					if (missingColumns.length > 0) {
						message.error(`Thiếu các cột bắt buộc: ${missingColumns.join(', ')}`);
						return;
					}

					const rows = jsonData.slice(1);

					const columns = headers.map((header) => ({
						title: header, dataIndex: header, key: header,
					}));

					const dataSource = rows.map((row, index) => {
						const rowData = {};
						headers.forEach((header, i) => {
							rowData[header] = row[i];
						});
						return { ...rowData, key: index };
					});

					setImportColumns(columns);
					setImportedData(dataSource);
					setLoading(false);
					setTextLoad('Đang xử lý dữ liệu ...');
					message.success('Đọc file thành công!', 2);
				}
			};
			reader.readAsArrayBuffer(file);
		} catch (error) {
			message.error('Có lỗi khi xử lý file');
		} finally {
			setIsProcessingFile(false);
		}
	};

	const handleImport = async () => {
		setIsImportModalVisible(false);
		try {
			const highestId = rowData.reduce((max, item) => (item.id > max ? item.id : max), 0);
			const newRows = importedData.map((row, index) => {
				const newRow = {};
				templateColumns.forEach((column) => {
					newRow[column.columnName] = row[column.columnName] || null;
				});
				newRow.id = highestId + index + 1;
				return newRow;
			});

			const batchSize = 2000;
			const batches = [];
			for (let i = 0; i < newRows.length; i += batchSize) {
				batches.push(newRows.slice(i, i + batchSize));
			}

			await Promise.all(batches.map(async (batch) => {
				setEditCount((prev) => prev + batch.length);
				await limit(async () => {
					try {
						const dataCreate = {
							tableId: templateData.id, data: batch,
						};
						await createBathTemplateRow(dataCreate);
					} finally {
						setEditCount((prev) => prev - batch.length);
					}
				});
			}));

			// Small delay to ensure data is committed on the server
			await new Promise(resolve => setTimeout(resolve, 300));

			// Reload data with a clean state
			await loadFetchData();
			toast.success('Import thành công!');
			setImportedData([]);
			setImportColumns([]);
		} catch (error) {
			console.error('Lỗi khi import dữ liệu:', error);
			toast.error('Đã xảy ra lỗi khi import dữ liệu!');
		} finally {
		}
	};

	const handleMappingUpdate = async () => {
		try {
			setIsMappingModalVisible(false);
			const mappingList = selectedmapping.info.mappingList;

			if (templateData.id && selectedRecords.length > 0) {
				// Process only selected records
				for (const record of selectedRecords) {
					// Find the matching mapping rule
					const mapping = mappingList.find(m => m.du_lieu_chinh === record.data[selectedmapping.info.cotDuLieuPrimary]);

					if (mapping && mapping.du_lieu_nguon) {
						// Update only if there's a valid mapping
						record.data[selectedmapping.info.cotDuLieuPrimary] = mapping.du_lieu_nguon;
						await updateTemplateRow(record);
					}
				}

				setSelectedMapping({});
				message.success(`Đã cập nhật ${selectedRecords.length} bản ghi thành công!`, 2);

				// Add small delay to ensure all updates are committed
				await new Promise(resolve => setTimeout(resolve, 300));

				// Reload the table data
				await loadFetchData();
			}
		} catch (error) {
			console.error('Lỗi khi cập nhật mapping:', error);
			message.error('Đã xảy ra lỗi khi cập nhật mapping!');
		}
	};

	const handleImportChoice = (choice) => {
		setIsImportChoicePopoverVisible(false);
		if (choice == 'overwrite') {
			setLoading(true);
			setTextLoad('Đang xóa dữ liệu cũ ...');
			deleteTemplateRowByTableId(templateData.id).then(() => {
				setLoading(false);
				message.success('Đã xóa dữ liệu cũ, chuẩn bị import!');
				handleImport();
			});
		} else {
			handleImport();
		}
	};

	const closeImportModal = () => {
		setIsImportModalVisible(false);
		setImportedData([]);
		setImportColumns([]);
		setLoading(false);
	};

	const showDuplicateColumnSelectorModal = () => {
		setShowDuplicateColumnSelector(true);
		setDropdownOpen(false);
	};

	const handleShowInfo = () => {
		setShowInfo(prevState => !prevState);
	};

	const showDuplicateHighlightColumns = () => {
		setDuplicateHighlightColumns([]);
		setDropdownOpen(false);
	};

	const handleFormButtonClick = () => {
		setIsFormModalVisible(true);
		const currentUrl = window.location.pathname;
		window.history.pushState({}, '', `${currentUrl}/form`);
		setDropdownOpen(false);
	};

	const handleCloseFormModal = () => {
		setIsFormModalVisible(false);
		const currentUrl = window.location.pathname;
		const newUrl = currentUrl.replace('/form', '');
		window.history.pushState({}, '', newUrl);
	};

	const handleAddRow = async () => {
		setLoading(true);
		setTextLoad('Đang thêm dòng mới...');
		try {
			let newRow = {};
			templateColumns.forEach((column) => {
				newRow[column.columnName] = null;
			});
			const highestId = rowData.reduce((max, item) => (item.id > max ? item.id : max), 0);
			newRow.id = highestId + 1;

			const dataCreate = {
				tableId: templateData.id, data: [newRow],
			};

			await createBathTemplateRow(dataCreate);
			await new Promise(resolve => setTimeout(resolve, 300));
			await loadFetchData();
			message.success('Đã thêm dòng mới thành công!');
		} catch (error) {
			console.error('Error adding row:', error);
			toast.error('Failed to add row');
		}
	};

	useEffect(() => {
		const loadColumnsGoc = async () => {
			try {
				if (templateData?.isCombine) {
					const mergedData = await loadAndMergeData(templateData);
					if (mergedData && mergedData.length > 0) {
						setRowDataGocData(mergedData);
						const columns = Object.keys(mergedData[0]);
						setColumnsGocData(columns);
						return;
					}
				} else {
					setRowDataGocData(rowData);
				}

				if (!colDefs || !Array.isArray(colDefs)) {
					console.warn('colDefs không hợp lệ');
					setColumnsGocData([]);
					return;
				}

				const columns = colDefs
					.filter(e => e.headerName && e.headerName !== '' && e.headerName !== 'STT' && e.headerName !== 'ID Phiếu')
					.map(e => e.headerName);

				setColumnsGocData(columns);
			} catch (error) {
				console.error('Lỗi trong quá trình xử lý columnGoc:', error);
				setColumnsGocData([]);
			}
		};

		loadColumnsGoc();
	}, [templateData, colDefs, rowData]);

	const handleGhepBang1 = () => {
		setShowSettingsCombine(true);
		setDropdownOpen(false);
	};

	const items = [
		templateData?.isCombine && { key: '1', label: 'Ghép bảng', onClick: handleGhepBang1 },
		{
			key: '2', label: (<div style={{ margin: -5, padding: -5 }}>
				<VLookUp
					currentFileNote={fileNote}
					currentColumns={colDefs && colDefs.length > 0 ? colDefs
						.filter(e => e.headerName && e.headerName !== '' && e.headerName !== 'STT' && e.headerName !== 'ID Phiếu')
						.map(e => e.headerName) : []}
					currentTable={templateData}
					reload={loadFetchData}
				/>
			</div>),
		},
		//
		// { key: '11', label: 'Xuất dữ liệu', onClick: exportToExcel },
		// {
		// 	key: '22',
		// 	label: 'Xuất Template',
		// 	onClick: exportTemplateToExcel,
		// },
		// {
		// 	key: '33', label: 'Import', onClick: () => {
		// 		setIsImportModalVisible(true);
		// 		setDropdownOpen(false);
		// 	},
		// },
		{ key: '44', label: 'Kiểm tra trùng lặp', onClick: showDuplicateColumnSelectorModal },
		{
			key: '55',
			label: 'Bỏ kiểm tra trùng lặp',
			onClick: showDuplicateHighlightColumns,
		},
		// {
		// 	key: 'settings',
		// 	label: 'Cài đặt bảng',
		// 	onClick: () => setShowSettingsPopup(true),
		// },
		!isDuLieuNen && countErr > 0 && {
			key: 'validate',
			label: (
				<Dropdown menu={{ items: validates }} trigger={['click']}>
					<Badge count={countErr} offset={[30, 6]}>
						<span>Validate</span>
					</Badge>
				</Dropdown>
			),
			onClick: (e) => e.stopPropagation(), // để dropdown không bị click mất
		},
		!isDuLieuNen && { key: 'chart', label: 'Tạo biểu đồ', onClick: () => setShowSettingsChartPopup(true) },

		{
			key: '77', label: 'Lấy dữ liệu API', onClick: () => {
				setShowSettingsCraw(true);
				setDropdownOpen(false);
			},
		},

		templateData?.isCombine && {
			key: '100', label: 'Xem bảng thành phần',
			onClick: async () => {
				if (templateData && templateData.setting.selectedTemplates) {
					const templateIds = Object.keys(templateData.setting.selectedTemplates);
					const fileNoteNames = await Promise.all(templateIds.map(async (id) => {
						try {
							const table = await getTableByid(id);
							if (!table || !table.fileNote_id) {
								console.error(`No fileNote_id found for table ID ${id}`);
								return {
									templateId: id,
									name: null,
									error: 'No fileNote_id found',
								};
							}

							const fileNote = await getFileNotePadByIdController(table.fileNote_id);
							if (!fileNote || !fileNote.name) {
								console.error(`No name found for fileNote ID ${table.fileNote_id}`);
								return {
									templateId: id,
									name: null,
									error: 'No name found',
								};
							}

							return { templateId: id, name: fileNote.name };
						} catch (error) {
							console.error(`Error processing table ID ${id}:`, error);
							return {
								templateId: id, name: null, error: error.message,
							};
						}
					}));

					const validData = fileNoteNames.filter(item => item.name !== null);
					setTemplateList(validData);
					setIsModalVisible(true);
				}
			},
		},
		// { key: '88', label: '+ form', onClick: handleFormButtonClick },
		// {
		// 	key: '99',
		// 	label: '+ dòng',
		// 	onClick: handleAddRow,
		// },
		{
			key: '100', label: '+ n dòng', onClick: () => {
				setIsCustomRowModalVisible(true);
				setDropdownOpen(false);
			},
		},
	].filter(Boolean);

	const handleGhepBang = () => {
		setShowSettingsCombine(true);
		setDropdownOpen(false);
	};

	const handleCaiDatBang = () => {
		setShowSettingsPopup(true);
	};

	const defaultColDef = useMemo(() => {
		return {
			editable: true, cellStyle: {
				fontSize: '14.5px',
			}, filter: false, suppressMenu: true, wrapHeaderText: true, autoHeaderHeight: true,
		};
	}, [templateData]);

	const getHeaderTemplate = (columnName) => {
		const isHighlighted = duplicateHighlightColumns.includes(columnName);
		return `<span>${columnName} ${isHighlighted ? '📌' : ''}</span>`;
	};

	const fetchDataCheck = async (data) => {
		const validColumns = [];

		const allValid = data.every(item => {
			const name = item?.columnName?.trim();
			const isValid = validColumns.includes(name);
			if (!isValid) {
				console.warn('Invalid column:', name);
			}
			return isValid;
		});

		return !allValid;
	};

	const fetchData = async () => {
		setSelectedRows([]);
		if (!fileNoteId) return;
		try {
			const [templateInfo, fileNote] = await Promise.all([
				getTemplateByFileNoteId(id),
				getFileNotePadByIdController(id),
			]);

			const template = templateInfo[0];
			setTemplateData(template);
			setFileNote(fileNote);

			if (template) {
				// Get existing columns first
				const [existingColumns] = await Promise.all([
					getTemplateColumnForTemplate(template.id),
				]);
				setIsDataLoaded(true);
				setTemplateColumns(existingColumns);
				const check = await fetchDataCheck(existingColumns);
				setStatus(check);
			}
		} catch (e) {
			console.error(e);
		}
	};

	const onColumnMoved = useCallback(async (event) => {
		if (event.finished && event.api && 	event.source === 'uiColumnMoved') {
			try {
				const allColumns = event.api
					.getColumnDefs()
					.filter((col) => col.field !== 'rowId' && col.field !== 'delete')
					.map((column, index) => ({
						id: templateColumns.find((col) => col.columnName == column.field)?.id, columnIndex: index,
					}))
					.filter((col) => col.id);
				await updateColumnIndexes({
					tableId: templateData.id, columns: allColumns,
				});
			} catch (e) {
				console.error('Error saving column indexes:', e);
				toast.error('Đã xảy ra lỗi khi lưu thứ tự cột');
				fetchData();
			}
		}
	}, [fileNoteId, templateColumns]);

	const handleChange = (name) => {
		setSelectedUC((prev) => {
			const newSet = new Set(prev);
			newSet.has(name) ? newSet.delete(name) : newSet.add(name);
			return newSet;
		});
	};

	async function loadFetchData() {
		// setLoading(true);
		if (templateData?.id) {

			try {
				setRowData([]);
				await new Promise(resolve => setTimeout(resolve, 50));
				const response = await getTemplateRow(templateData.id, null, false, currentPage, pageSize);
				if (response && response.rows) {
					const rows = response.rows.map((row) => ({
						...row.data,
						rowId: row.id,
						idPhieu: row.id_DataOriginal,
						checkbox: false,
					}));
					setRowData(rows);
					setTotalRows(response.count);
				} else {
					setRowData([]);
					setTotalRows(0);
				}
				if (gridRef.current && gridRef.current.api) {
					gridRef.current.api.refreshCells({ force: true });
				}
			} catch (error) {
				console.error('Error loading row data:', error);
				toast.error('Error loading row data');
			}
		}
	};

	const handleAddColumn = async () => {
		const newColumn = { name: '', type: 'text', show: true };

		try {
			const createdColumn = await createTemplateColumn({
				tableId: templateData.id, columnName: newColumn.name, columnType: newColumn.type, show: true,
			});

			setTemplateColumns([...templateColumns, { ...createdColumn, show: true }]);
		} catch (error) {
			console.error('Error creating new column:', error);
			toast.error('Đã xy ra lỗi khi tạo cột mới.');
		}
	};

	const handleCloneColumn = async (columnIndex) => {
		const columnToClone = templateColumns[columnIndex];
		if (!columnToClone) return;
		const generateUniqueName = (baseName) => {
			let counter = 1;
			let newName = `${baseName} - Copy`;
			while (templateColumns.some(col => col.columnName === newName)) {
				counter++;
				newName = `${baseName} - Copy (${counter})`;
			}
			return newName;
		};

		const newColumnName = generateUniqueName(columnToClone.columnName);
		const newColumn = {
			...columnToClone,
			columnName: newColumnName,
			columnIndex: templateColumns.length,
		};
		delete newColumn.id;
		createTemplateColumn(newColumn);
		fetchData();
	};


	const handleClosePopUpSetting = async () => {
		setShowSettingsPopup(false);
		fetchData();
	};


	const handleSaveData = async () => {
		if (updatedData.length === 0) return;

		try {
			setLoading(true);
			const dataUpdate = {
				tableId: templateData.id,
				data: updatedData,
			};

			await updateBatchTemplateRow(dataUpdate);
			// Fetch latest template data to update isNeedUpdatePivot status
			const [templateInfo] = await Promise.all([
				getTemplateByFileNoteId(id),
			]);
			setTimeout(() => {
				loadFetchData();
				toast.success('Đã lưu thành công');
				setUpdatedData([]); // clear sau khi lưu
				setLoading(false);
				setTextLoad('Đang xử lý dữ liệu');

				const template = templateInfo[0];
				if (template) {
					setTemplateData(template);
				}
			}, 300);

		} catch (err) {
			console.error('Lỗi khi lưu:', err);
			toast.error('Có lỗi khi lưu dữ liệu');
		}
	};

	const handleCellValueChanged = async (event) => {
		try {
			const { data, column, newValue, colDef } = event;
			const { rowId, ...updatedData } = data;
			let newData = { ...updatedData };
			if (colDef.field == 'checkbox') {
				setSelectedRows((prevSelected) => {
					const exists = prevSelected.some((row) => row.rowId === rowId);
					if (newValue === true && !exists) {
						return [...prevSelected, { ...data, ...newData }];
					}
					if (newValue === false && exists) {
						return prevSelected.filter((row) => row.rowId !== rowId);
					}
					return prevSelected;
				});
				return;
			}

			const updatedRow = await getTemplateRowById(rowId);

			if (updatedRow) {
				newData = { ...updatedRow.data, ...newData };

				// Handle formula columns
				for (const col of templateColumns) {
					if (col.columnType === 'formula' && col.selectFormula?.variables) {
						try {
							const scope = {};
							for (const variable of col.selectFormula.variables) {
								const [key, columnName] = Object.entries(variable)[0];
								const value = newData[columnName];
								scope[key] = value === null || value === undefined || value === '' || value === '-' ? 0 : typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) || 0 : Number(value) || 0;
							}
							const result = evaluate(col.selectFormula.formula, scope);
							newData[col.columnName] = isNaN(result) ? null : result;
						} catch (error) {
							console.error(`Formula evaluation error for column ${col.columnName}:`, error);
							newData[col.columnName] = null;
						}
					}
				}

				// Handle date_split columns
				const changedCol = column.getColId();
				const dateSplitColumns = templateColumns.filter(col =>
					col.columnType === 'date_split' &&
					col.formulaDate?.sourceColumn === changedCol,
				);

				for (const splitCol of dateSplitColumns) {
					const sourceValue = newData[splitCol.formulaDate.sourceColumn];
					if (sourceValue) {
						try {
							const date = new Date(sourceValue);
							if (!isNaN(date.getTime())) {
								switch (splitCol.formulaDate.part) {
									case 'day':
										newData[splitCol.columnName] = String(date.getDate()).padStart(2, '0');
										break;
									case 'month':
										newData[splitCol.columnName] = String(date.getMonth() + 1).padStart(2, '0');
										break;
									case 'year':
										newData[splitCol.columnName] = date.getFullYear().toString();
										break;
								}
							}
						} catch (error) {
							console.error(`Error processing date_split for column ${splitCol.columnName}:`, error);
							newData[splitCol.columnName] = '';
						}
					}
				}

				// --- Bổ sung cập nhật time_diff ---
				const timeDiffColumns = templateColumns.filter(col => col.columnType === 'time_diff' && col.setting_time_diff && (col.setting_time_diff.startColumn === changedCol || col.setting_time_diff.endColumn === changedCol));
				for (const diffCol of timeDiffColumns) {
					const startVal = newData[diffCol.setting_time_diff.startColumn];
					const endVal = newData[diffCol.setting_time_diff.endColumn];
					if (startVal && endVal) {
						const startDate = new Date(startVal);
						const endDate = new Date(endVal);
						if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
							const diffMs = endDate.getTime() - startDate.getTime();
							newData[diffCol.columnName] = diffMs;
						}
					}
				}

				setUpdatedData(prev => {
					const withoutDup = prev.filter(row => row.id !== rowId);
					return [...withoutDup, { id: rowId, data: newData }];
				});
			}
		} catch (err) {
			message.error('Không thể cập nhật dữ liệu');
		}
	};

	// const onColumnResized = async (event) => {
	// 	if (event.finished) {
	// 		const resizedColumn = templateColumns.find((column) => column.columnName == event.column?.getColId());
	// 		console.log(resizedColumn);
	// 		if (resizedColumn) {
	// 			await updateTemplateColumnWidth({
	// 				id: resizedColumn.id, width: event.column.getActualWidth(),
	// 			});
	// 		}
	// 	}
	// };

	const onColumnResized = async (event) => {
		if (event.source === 'uiColumnResized') {
			const resizedColumn = templateColumns.find(
				(column) => column.columnName === event.column?.getColId()
			);
			if (resizedColumn) {
				await updateTemplateColumnWidth({
					id: resizedColumn.id,
					width: event.column.getActualWidth(),
				});
			}
		}
	};

	const handleAddCustomRows = async (count) => {
		setLoading(true);
		setTextLoad('Đang thêm dòng mới...');
		try {
			const highestId = rowData.reduce((max, item) => (item.id > max ? item.id : max), 0);

			// Tạo mảng chứa các dòng mới cần thêm
			const newRows = Array(count).fill(null).map((_, index) => {
				const newRow = {};
				templateColumns.forEach((column) => {
					newRow[column.columnName] = null;
				});
				newRow.id = highestId + index + 1;
				return newRow;
			});

			const dataCreate = {
				tableId: templateData.id,
				data: newRows,
			};

			await createBathTemplateRow(dataCreate);
			await new Promise(resolve => setTimeout(resolve, 300));
			await loadFetchData();
			message.success(`Đã thêm ${count} dòng mới thành công!`);
		} catch (error) {
			console.error('Error adding rows:', error);
			message.error('Không thể thêm dòng mới');
		} finally {
			setLoading(false);
			setIsCustomRowModalVisible(false);
		}
	};

	const handleShareLink = () => {
		const baseUrl = window.location.origin;
		const shareUrl = `${baseUrl}/form-template/${fileNoteId}`;
		navigator.clipboard.writeText(shareUrl).then(() => {
			message.success('Link đã được sao chép vào clipboard!');
		}).catch((err) => {
			message.error('Có lỗi khi sao chép đường dẫn!');
		});
	};

	const handleMappingConfirm = async () => {
		setLoading(true);
		setTextLoad('Đang cập nhật mapping...');
		try {
			await handleMappingUpdate();
		} finally {
			setLoading(false);
		}
	};

	const popoverContent = (<div className={css.popoverContent}>
		{items.map((item) => (<div
			key={item.key}
			onClick={item.onClick}
			className={css.popoverItem}
		>
			{item.label}
		</div>))}
	</div>);

	const transformData = (originalData, selectedCols, columnsGoc, groupColumnName, valueColumnName) => {

		// Get remaining columns (not selected for transformation)
		const remainingColumns = columnsGoc.filter(col => !selectedCols.includes(col));
		console.log('remainingColumns', remainingColumns);
		const newRows = [];

		// For each original row, create multiple new rows based on selected columns
		originalData.forEach(originalRow => {
			// For each selected column, create a new row
			selectedCols.forEach(selectedCol => {

				const newRow = {};

				// Copy all remaining columns first
				remainingColumns.forEach(col => {
					newRow[col] = originalRow[col];
				});

				// Add transformed data
				newRow[groupColumnName] = selectedCol;
				newRow[valueColumnName] = originalRow[selectedCol];

				newRows.push(newRow);
			});
		});
		return newRows;

	};

	const handleDeleteTab = async (tabId) => {
		try {
			await deleteFileNotePad(tabId);
			message.success('Đã xóa tab thành công');
			// Nếu đang ở tab bị xóa thì chuyển về tab đầu tiên
			if (selectedTabId === tabId) {
				const firstTab = tabRotates.find(tab => tab.id !== tabId);
				if (firstTab) {
					setSelectedTabId(firstTab.id);
				}
			}
			// Cập nhật lại danh sách tab
			setTabRotates(prev => prev.filter(tab => tab.id !== tabId));
		} catch (error) {
			console.error('Lỗi khi xóa tab:', error);
			message.error('Có lỗi xảy ra khi xóa tab');
		}
	};

	const getTabContextMenu = (tabId) => {
		const tab = tabRotates.find(t => t.id === tabId);
		return {
			items: [
				{
					key: 'rename',
					label: (
						<span onClick={() => handleOpenRenameTab(tab)}>Đổi tên</span>
					),
				},
				{
					key: 'delete',
					label: (
						<Popconfirm
							title="Xóa tab"
							description="Bạn có chắc chắn muốn xóa tab này không?"
							onConfirm={() => handleDeleteTab(tabId)}
							okText="Đồng ý"
							cancelText="Hủy"
						>
							<span>Xóa tab</span>
						</Popconfirm>
					),
					danger: true,
				},
			],
		};
	};

	async function handleUpdateRotatedTable() {
		setIsUpdating(true);
		setLoading(true);
		try {
			if (templateData) {
				let columnsGoc = await getTemplateColumn(templateData?.mother_table_id);
				columnsGoc = columnsGoc.map(e => e.columnName);
				let originalData = await getTemplateRow(templateData?.mother_table_id);
				originalData = originalData.map(e => e.data);
				const selectedCols = templateData?.mother_rotate_columns?.selected_columns;
				const groupColumnName = templateData?.mother_rotate_columns?.new_columns?.group_column_name;
				const valueColumnName = templateData?.mother_rotate_columns?.new_columns?.value_column_name;
				const data = transformData(originalData, selectedCols, columnsGoc, groupColumnName, valueColumnName);
				await deleteTemplateRowByTableId(templateData.id);

				await createBathTemplateRow({
					tableId: templateData.id, data: data,
				}).then(() => {
					setLoadData(!loadData);
				});
			}
		} catch (error) {
			console.error(error);
		} finally {
			setTimeout(() => {
				setLoading(false);
				setIsUpdating(false);
			}, 1000);
		}
	}


	// Hàm lưu dữ liệu và cột của bảng isCombine
	const handleSaveCombineTable = async (tableData, columns) => {
		if (!tableData || !columns || columns.length === 0) {
			message.error('Không có dữ liệu để lưu');
			return;
		}

		try {
			setLoading(true);

			// Xóa dữ liệu cũ
			await deleteTemplateRowByTableId(templateData.id);

			// Xóa tất cả các cột cũ trước khi tạo cột mới
			await deleteTemplateColByTableId(templateData.id);

			// Tạo các cột mới cho bảng kết hợp
			let columnIndex = 0;

			// Tạo các cột mới
			await Promise.all(columns.map(column => {
				// Xác định loại cột dựa trên định dạng
				let columnType = 'text';
				if (column.cellStyle && column.cellStyle.textAlign === 'right') {
					columnType = 'number';
				}

				return createTemplateColumn({
					tableId: templateData.id,
					columnName: column.headerName,
					columnType: columnType,
					show: true,
					columnIndex: columnIndex++,
				});
			}));

			// Lưu dữ liệu mới
			await createBathTemplateRow({
				tableId: templateData.id,
				data: tableData,
			});

			message.success('Đã lưu bảng kết hợp thành công');
			setLoadData(!loadData);
		} catch (error) {
			console.error('Lỗi khi lưu bảng kết hợp:', error);
			message.error('Đã xảy ra lỗi khi lưu bảng kết hợp');
		} finally {
			setLoading(false);
		}
	};


	const CustomRowModal = ({
								visible,
								onCancel,
								onOk,
								initialCount = 1,
							}) => {
		const [count, setCount] = useState(initialCount);

		const handleOk = () => {
			onOk(count);
		};

		return (
			<Modal
				title="Thêm nhiều dòng"
				open={visible}
				onCancel={onCancel}
				onOk={handleOk}
				okText="Thêm dòng"
				cancelText="Hủy"
				centered
			>
				<div style={{ padding: '10px 0' }}>
					<label htmlFor="rowCount">Số lượng dòng cần thêm:</label>
					<input
						id="rowCount"
						type="number"
						min="1"
						value={count}
						onChange={(e) => setCount(Number(e.target.value))}
						style={{
							marginLeft: '10px',
							width: '100px',
							padding: '5px',
							border: '1px solid #d9d9d9',
							borderRadius: '4px',
						}}
					/>
				</div>
			</Modal>
		);
	};


	useEffect(() => {
		getAllUserClass().then((data) => {
			setListUC(data.filter((e) => e.module == 'CANVAS'));
		});
	}, []);

	async function fetchTabs() {
		const [res, fns] = await Promise.all([
			getAllTemplateSheetTable(),
			getAllFileNotePad(),
		]);
		const mainFileNote = fns.find(e => e.id == fileNoteId);
		const mainTable = res.find(e => e.fileNote_id == fileNoteId);

		if (mainTable && mainTable.id && mainFileNote) {
			const rotateTables = res.filter(e =>
				e.table_type === Template_Table_Type.ROTATE &&
				e.mother_table_id == mainTable.id,
			)
				.map(tab => fns.find(f => f.id == tab.fileNote_id))
				.filter(tab => tab !== undefined); // Lọc bỏ các tab không tìm thấy fileNote

			if (rotateTables.length > 0) {
				const allTabs = rotateTables.map(e => ({
					...e,
					isMainTab: false,
				}));
				allTabs.unshift({ ...mainFileNote, isMainTab: true });
				setTabRotates(allTabs);
				setSelectedTabId(mainFileNote.id);
				setIsMainTab(true);
			} else {
				// Nếu không có bảng xoay, chỉ set tab chính
				setTabRotates([]);
				setSelectedTabId(mainFileNote.id);
				setIsMainTab(true);
			}
		}
	}

	useEffect(() => {
		setLoading(true);
		setTextLoad('Đang xử lý dữ liệu ...');
		setUpdatedData([]);
		setIsStatusFilter(false);
		setShowInfo(false);
		const fetchAll = async () => {
			try {
				await Promise.all([
					fetchTabs(),
					fetchData(),
					fetchAllCrossCheck(),
				]);
			} catch (error) {
				console.error('Lỗi khi tải dữ liệu:', error);
				message.error('Có lỗi xảy ra khi tải dữ liệu');
			}
		};
		fetchAll();
	}, [fileNoteId, loadData, currentPage, pageSize]);

	const getFormattedRowData = (params) => {
		const columns = params.columnApi.getAllDisplayedColumns();
		const formattedData = {};

		columns.forEach((col) => {
			const colDef = col.getColDef();
			const field = colDef.field;
			if (!field) return;

			const rawValue = params.data[field];
			const formattedValue = colDef.valueFormatter
				? colDef.valueFormatter({ value: rawValue, data: params.data })
				: rawValue;

			formattedData[field] = formattedValue;
		});

		return formattedData;
	};


	useEffect(() => {
		const fetchColumn = async () => {
			try {
				const full = await getFileNotePadByIdController(fileNoteId);
				const info = full?.info || {};
				let colDefs = [{
					pinned: 'left',
					width: '45',
					field: 'delete',
					suppressHeaderMenuButton: true,
					cellStyle: { textAlign: 'center' },
					headerName: '',
					cellRenderer: (params) => {
						if (!params.data || !params.data.rowId) {
							return null;
						}
						return (
							<PreviewRenderer
								formatData={getFormattedRowData(params)}
								fileNote={full}
							/>
						);
					},
					editable: false,
				},
					{
						field: 'checkbox',
						headerName: '',
						width: 40,
						pinned: 'left',
						suppressMenu: true,
						editable: true,
						headerComponent: CustomCheckboxHeader,
						headerComponentParams: {
							setSelectedRows: setSelectedRows,
						},
						cellStyle: {
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						},
					},
					{
						headerName: 'STT-Mã phiếu',
						valueGetter: (params) => {
							const rowIndex = params.node.rowIndex + 1;
							const idPhieu = params.data?.idPhieu;

							if (idPhieu !== undefined && idPhieu !== null) {
								return `${rowIndex} - ID${idPhieu}`;
							}

							return rowIndex;
						},
						field: 'stt',
						width: 80,
						pinned: 'left',
						hide: info?.hideOrderNumber !== undefined ? info.hideOrderNumber : true, ...filter(),
						// hide: info?.hideOrderNumber || false, ...filter(),
					},
				];
				const sortedColumns = [...templateColumns].sort((a, b) => (a.columnIndex || 0) - (b.columnIndex || 0));
				for (const col of sortedColumns) {
					const columnDef = buildColumnDef({
						col,
						rowData,
						duplicateHighlightColumns,
						templateColumns,
						currentUser,
						getHeaderTemplate,
						toggleDuplicateHighlight,
						filter,
					});
					buildColumn(col, columnDef, fileNoteId, loadFetchData);
					colDefs.push(columnDef);
				}
				const fileNoteData = full;
				if (fileNoteData) {
					setColDefs([...colDefs]);
				}
				setTimeout(() => {
					if (!gridRef.current?.columnApi) return;

					const orderedState = colDefs
						.filter(col => col.field) // bỏ các cột không có field
						.map(col => ({
							colId: col.field,
							pinned: col.pinned || null,
							hide: col.hide || false,
							width: col.width,
						}));

					gridRef.current.columnApi.applyColumnState({
						state: orderedState,
						applyOrder: true, // 💥 Quan trọng nhất!
					});
				}, 0);

			} catch (e) {
				console.error('Error setting column definitions:', e);
				toast.error('Error setting up columns');
			}
		};

		fetchColumn();
	}, [templateColumns, isDataLoaded, duplicateHighlightColumns, isStatusFilter, fileNoteId]);

	useEffect(() => {
		if (templateData) fetchDataCrossCheckAndValidate();
	}, [templateData, fileNoteId, isUpdateNoti]);

	useEffect(() => {
		let isView = false;
		if (currentUser?.isAdmin) {
			isView = true;
		} else {
			try {
				const ucObj = listUC_CANVAS?.find(uc => uc.id == uCSelected_CANVAS);
				const ucId = ucObj?.id;
				if (!fileNote?.userClass || !Array.isArray(fileNote.userClass) || fileNote.userClass.length === 0) {
					isView = false;
				} else {
					isView = fileNote.userClass.includes(ucId);
				}
			} catch (e) {
				isView = false;
			}
		}
		setSelectedUC(new Set(fileNote?.userClass || []));
		setIsView(isView);
		setLoading(false);
	}, [fileNote, listUC_CANVAS, uCSelected_CANVAS, currentUser]);

	useEffect(() => {
		loadFetchData();
	}, [templateData, currentPage, pageSize]);

	useEffect(() => {
		if (templateColumns.length > 0 && rowData !== undefined) {
			const timeout = setTimeout(() => {
				setLoading(false);
			}, 50);

			return () => clearTimeout(timeout);
		}
	}, [templateColumns, rowData]);


	useEffect(() => {
		if (editCount == 0) {
			// fetchDataCrossCheckAndValidate().then();
		}
	}, [editCount]);

	useEffect(() => {
		if (location.pathname.endsWith('/form')) {
			setIsFormModalVisible(true);
		} else {
			setIsFormModalVisible(false);
		}
	}, [location.pathname]);

	useEffect(() => {
		if (showFormModal) {
			setIsFormModalVisible(true);
		}
	}, [showFormModal]);

	useEffect(() => {
		const processMapping = async () => {
			if (selectedmapping?.info?.mappingList && templateData?.id) {
				const fileNoteData = await getTemplateRow(templateData.id);
				const allFilteredRecords = selectedmapping.info.mappingList.reduce((acc, mapping) => {
					const { du_lieu_chinh } = mapping;
					const records = fileNoteData.rows.filter((record) => record.data[selectedmapping?.info?.cotDuLieuPrimary] == du_lieu_chinh);
					return [...acc, ...records];
				}, []);
				setFilteredRecords(allFilteredRecords);
			}
		};
		processMapping();
	}, [selectedmapping, templateData]);

	// Handler to open rename modal
	const handleOpenRenameTab = (tab) => {
		setRenameTabModal({ visible: true, tab, name: tab.name || '' });
	};

	// Handler to confirm rename
	const handleConfirmRenameTab = async () => {
		if (!renameTabModal.name.trim()) {
			message.error('Tên tab không được để trống!');
			return;
		}
		try {
			await updateFileNotePad({ ...renameTabModal.tab, name: renameTabModal.name });
			setRenameTabModal({ visible: false, tab: null, name: '' });
			await fetchTabs();
			message.success('Đổi tên tab thành công!');
		} catch (e) {
			message.error('Đổi tên tab thất bại!');
		}
	};

	// Handler to close modal
	const handleCloseRenameTab = () => {
		setRenameTabModal({ visible: false, tab: null, name: '' });
	};

	const updateArrowVisibility = useCallback(() => {
		const container = sheetTabsRef.current;
		if (!container) return;
		const { scrollLeft, scrollWidth, clientWidth } = container;
		setShowLeft(scrollLeft > 2); // 2px tolerance
		setShowRight(scrollLeft + clientWidth < scrollWidth - 2);
	}, []);

	useEffect(() => {
		updateArrowVisibility();
		const container = sheetTabsRef.current;
		if (!container) return;
		container.addEventListener('scroll', updateArrowVisibility);
		window.addEventListener('resize', updateArrowVisibility);
		return () => {
			container.removeEventListener('scroll', updateArrowVisibility);
			window.removeEventListener('resize', updateArrowVisibility);
		};
	}, [updateArrowVisibility, tabRotates.length]);


	const onFilterChanged = () => {
		const filterModel = gridRef.current.api.getFilterModel();
		if (Object.keys(filterModel).length !== 0) {
			setIsStatusFilter(true);
		}
		onSelectionChanged();
	};

	const onSelectionChanged = () => {
		const visibleCheckedData = [];

		gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
			if (node.data?.checkbox === true) {
				visibleCheckedData.push({ ...node.data, show: false });
			}
		});

		setSelectedRows(visibleCheckedData);
	};

	const handleDeleteData = async (value) => {
		try {
			setLoading(true);
			await deleteTemplateRows((value || []).map(e => e?.rowId));
			setTimeout(async () => {
				await loadFetchData();
				setSelectedRows([]);
				setLoading(false);
			}, 1000);
			toast.success('Cập nhật thành công', { autoClose: 1000 });
		} catch (error) {
			console.error('Lỗi khi cập nhật dữ liệu', error);
		}
	};

	const CustomCheckboxHeader = (props) => {
		const [checked, setChecked] = useState(false);
		const updatedSelectedRows = [];

		const handleChange = (e) => {
			const isChecked = e.target.checked;
			setChecked(isChecked);

			// Chỉ lấy những hàng đang hiển thị (đã qua filter)
			props.api.forEachNodeAfterFilterAndSort((node) => {
				node.setDataValue('checkbox', isChecked);
				if (isChecked) {
					updatedSelectedRows.push(node.data);
				}
			});
			if (typeof props.setSelectedRows === 'function') {
				props.setSelectedRows(updatedSelectedRows);
			}
		};

		return (
			<div style={{ display: 'flex', justifyContent: 'center' }}>
				<Checkbox checked={checked} onChange={handleChange} />
			</div>
		);
	};

	const handleUpdateAll = async () => {
		setLoading(true);
		try {
			console.log('Before update - isNeedUpdatePivot:', templateData.isNeedUpdatePivot);
			// ... existing code ...
			await updateTemplateTable({ id: templateData.id, isNeedUpdatePivot: false });
			setTemplateData(pre => {
				console.log('After update - isNeedUpdatePivot:', false);
				return { ...pre, isNeedUpdatePivot: false };
			});
		} catch (error) {
			console.error('Lỗi khi cập nhật lại tất cả bảng xoay:', error);
			message.error('Lỗi khi cập nhật lại tất cả bảng xoay!');
		} finally {
			setLoading(false);
		}
	};

	return (<>
		{openSetupUC && (<>

			<Modal
				title={`Cài đặt nhóm người dùng`}
				open={openSetupUC}
				onCancel={() => setOpenSetupUC(false)}
				onOk={() => {
					updateFileNotePad({
						...fileNote, userClass: Array.from(selectedUC),
					}).then((data) => {
						setOpenSetupUC(false);
						fetchData();
					});
				}}
				okButtonProps={{
					style: {
						backgroundColor: '#2d9d5b',
					},
				}}
				centered
				width={400}
				bodyStyle={{ height: '20vh', overflowY: 'auto' }}
			>
				{listUC.map((uc) => {
					const isDisabled = !currentUser?.isAdmin && !(uc.userAccess?.includes(currentUser?.email));
					return (
						<Checkbox
							key={uc.name}
							checked={selectedUC.has(uc.name)}
							onChange={() => handleChange(uc.name)}
							disabled={isDisabled}
						>
							{uc.name}
						</Checkbox>
					);
				})}
			</Modal>
		</>)}
		{(currentUser.isAdmin
			|| isView
		) ? (<>
			{(editCount >= 10) && (<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100vw',
					zIndex: '1000',
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					color: '#fff',
				}}
			>
				<img src="/loading_moi_2.svg" alt="Loading..."
					 style={{ width: '150px', height: '350px' }} />
				{editCount >= 10 && <>Đang xử lý {editCount} bản ghi</>}
			</div>)}
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100vw',
					zIndex: 1000,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					color: '#fff',
					opacity: loading ? 1 : 0,
					pointerEvents: loading ? 'auto' : 'none',
					transition: 'opacity 0.4s ease-in-out',
				}}
			>
				<button
					onClick={() => setLoading(false)}
					style={{
						position: 'fixed',
						top: '10px',
						right: '10px',
						background: 'none',
						border: 'none',
						color: '#fff',
						fontSize: '24px',
						cursor: 'pointer',
						padding: '5px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: '30px',
						height: '30px',
						borderRadius: '50%',
						backgroundColor: 'rgba(255, 255, 255, 0)',
						zIndex: 1001,
					}}
				>
					×
				</button>
				<img
					src="/loading_moi_2.svg"
					alt="Loading..."
					style={{
						width: '150px',
						height: '350px',
					}}
				/>
				<span style={{ fontSize: '18px', marginLeft: '15px' }}>{textLoad} </span>
			</div>
			{/*RenderComponent*/}
			{templateData?.isCombine
				? (templateData?.setting ?
					<>
						{isMainTab ?
							<>
								<div className="report__header">
									<div className="sheet_title">
										<span>{fileNote && fileNote.name}

										</span>


										<div className="setting_userClass">
											<img
												style={{ width: '25px', height: '25px', cursor: 'pointer' }}
												src={IconUser}
												alt=""
												onClick={() => (currentUser.isAdmin || fileNote.user_create == currentUser.email) && setOpenSetupUC(true)}
											/>
											{fileNote?.userClass && fileNote.userClass.map((uc) => <span
												className={css.tag}>{uc}</span>)}
										</div>
										{
											(templateData?.isCombine || (templateData?.mother_table_id && !isNaN(Number(templateData?.mother_table_id)))) && (
												<Tag color="green"
													 style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
													{templateData?.isCombine ? '#Bảng ghép' :
														(templateData?.mother_table_id && !isNaN(Number(templateData?.mother_table_id))) ? '#Bảng xoay' :
															null}
												</Tag>
											)
										}
										<ActionSave handleSaveData={handleSaveData} updateData={updatedData} />
										{updatedData.length > 0 && (
											<div className={css.blinkText}>
												<span>Có dữ liệu thay đổi, vui lòng lưu lại! &nbsp; &nbsp;</span>
											</div>
										)}
									</div>
									<div className="report__button-group">
										<div className={'buttonAction'}>

											{templateData?.table_type === Template_Table_Type.ROTATE && (<>
												<Button
													className={css.customButton}
													onClick={() => handleUpdateRotatedTable()}
													loading={isUpdating}
													disabled={isUpdating}
												>
													<span>Cập nhập lại từ bảng gốc</span>
												</Button>
											</>)}

											{itemsMapping.length > 0 && countErr > 0 && (<Dropdown
												menu={{
													items: itemsMapping,
												}}
												placement="bottom"
											>
												<Badge count={itemsMapping.length}>
													<Button className={css.customButton}>
														Mapping
													</Button>
												</Badge>
											</Dropdown>)}

											{!templateData?.isCombine && <>
												{/*<Button className={css.customButton}*/}
												{/*    onClick={handleFormButtonClick}>*/}
												{/*    <span>+ form</span>*/}
												{/*</Button>*/}

												{/*<Button className={css.customButton}*/}
												{/*    onClick={handleAddRow}>*/}
												{/*    <span>+ dòng</span>*/}
												{/*</Button>*/}

												{/*<Button className={css.customButton}*/}
												{/*    onClick={() => setIsCustomRowModalVisible(true)}>*/}
												{/*    <span>+ n dòng</span>*/}
												{/*</Button>*/}

												<Button className={css.customButton}
														onClick={() => setShowSettingsPopup(true)}>
													<Table2 size={14} style={{ marginRight: '4px' }} />
													<span>Cài đặt bảng</span>
												</Button>


												{countErr > 0 && <Dropdown
													menu={{
														items: validates,
													}}
													placement="bottom"
												>
													<Badge count={countErr} offset={[30, 6]}>
														<Button className={css.customButton}>
															<span>Validate</span>
														</Button>
													</Badge>
												</Dropdown>
												}

											</>


											}


											{templateData?.isCombine && <>

												{
													!isDuLieuNen && <RotateTable rowDataGoc={rowDataGocData}
																				 columnsGoc={columnsGocData}
																				 fileNote={fileNote}
																				 motherTable={templateData}
																				 setLoading={setLoading}
													/>
												}

												{
													!isDuLieuNen && templateData.isNeedUpdatePivot &&
													<UpdateAllRotateTablesButton tabRotates={tabRotates}
																				 templateData={templateData}
																				 setTemplateData={setTemplateData}
																				 setLoadData={setLoadData}
																				 loading={loading}
																				 setLoading={setLoading}
																				 css={css}
													/>
												}


												<Modal
													title="Danh sách bảng thành phần"
													visible={isModalVisible}
													onCancel={() => setIsModalVisible(false)}
													footer={null}
													width={800}
													centered
												>
													<Table
														dataSource={templateList}
														columns={[{
															title: 'Template ID',
															dataIndex: 'templateId',
															key: 'templateId',
														}, { title: 'Name', dataIndex: 'name', key: 'name' }]}
														rowKey="templateId"
														pagination={false}
													/>
												</Modal>
											</>}

											{templateData?.table_type === Template_Table_Type.ROTATE && (<>
												<Button
													className={css.customButton}
													onClick={async () => {
														if (templateData?.mother_table_id) {
															try {
																const tableData = await getTableByid(templateData.mother_table_id);
																if (!tableData || !tableData.fileNote_id) {
																	console.error(`No fileNote_id found for mother table ID ${templateData.mother_table_id}`);
																	return;
																}

																const fileNote = await getFileNotePadByIdController(tableData.fileNote_id);
																if (!fileNote || !fileNote.name) {
																	console.error(`No name found for fileNote ID ${tableData.fileNote_id}`);
																	return;
																}

																setTemplateList([{
																	templateId: templateData.mother_table_id,
																	name: fileNote.name,
																}]);
																setIsModalVisible(true);
															} catch (error) {
																console.error('Error fetching mother table or fileNote data:', error);
															}
														}
													}}
												>
													<span>Xem bảng gốc</span>
												</Button>

												<Modal
													title="Danh sách bảng gốc"
													visible={isModalVisible}
													onCancel={() => setIsModalVisible(false)}
													footer={null}
												>
													<Table
														dataSource={templateList}
														columns={[{
															title: 'Template ID',
															dataIndex: 'templateId',
															key: 'templateId',
														}, { title: 'Name', dataIndex: 'name', key: 'name' }]}
														rowKey="templateId"
														pagination={false}
													/>
												</Modal>
											</>)}
											{/* <Button className={css.customButton}
													onClick={() => setShowSettingsChartPopup(true)}>
												<span>Tạo biểu đồ</span>
											</Button> */}


											<Button className={css.customButton} onClick={handleChangeStatusFilter}>
												<span>{isStatusFilter ? '❌ Tắt filter' : '✅ Bật filter'}</span>
											</Button>

											<Button className={css.customButton} onClick={handleShowInfo}>
												<span>{showInfo ? '❌ Tắt ghi chú' : '✅ Bật ghi chú'}</span>
											</Button>

											<ActionDeleteMany handleSaveData={handleDeleteData}
															  updateData={selectedRows} />

											{/*<Button className={css.customButton}*/}
											{/*    onClick={() => setShowSettingsCombine(true)}>*/}
											{/*    <span>Ghép bảng</span>*/}
											{/*</Button>*/}

											{/*<Button className={css.customButton}*/}
											{/*    onClick={() => setShowSettingsCraw(true)}>*/}
											{/*    <span>Craw</span>*/}
											{/*</Button>*/}

											<ActionMenuDropdown popoverContent={popoverContent}
																dropdownOpen={dropdownOpen}
																setDropdownOpen={setDropdownOpen} />
										</div>

									</div>

								</div>
								{showInfo && <div style={{ marginBottom: 10 }}>
									<div style={{ marginBottom: 10 }}>
										<RichNoteKTQTRI table={`RichNote_Template_${fileNoteId}`} />
									</div>
								</div>}

								<div
									style={{
										height: showInfo ? '66vh': (isMobileMenu ? '64vh' : '75vh') ,
										display: 'flex',
										flexDirection: 'column',
										position: 'relative',
										marginTop: '15px',
									}}
								>


									{!templateData?.isCombine &&
										<div className="report">
											<div
												className={`ag-theme-quartz`}
												style={{
													height: '100%', width: '100%',
													transition: 'opacity 0.25s',
													// opacity: loading ? 0.1 : 1,
												}}>
												<AgGridReact
													statusBar={statusBar}
													ref={gridRef}
													rowData={rowData} // Sử dụng rowData đã fetch cho tab hiện tại
													columnDefs={colDefs} // Sử dụng colDefs đã fetch cho tab hiện tại
													defaultColDef={defaultColDef}
													rowSelection="multiple"
													enableRangeSelection={true}
													onCellValueChanged={handleCellValueChanged}
													animateRows={true}
													localeText={AG_GRID_LOCALE_VN}
													onColumnResized={onColumnResized}
													onColumnMoved={onColumnMoved}
													suppressScrollOnNewData={true}
													maintainColumnOrder={true}
													groupDefaultExpanded={0}
													pagination={false}
												/>
											</div>

											<div style={{
												padding: '8px 16px',
												display: 'flex',
												justifyContent: 'flex-end',
												borderTop: '1px solid #e5e7eb',
											}}>
												<Pagination
													current={currentPage}
													pageSize={pageSize}
													total={totalRows}
													onChange={handlePageChange}
													showSizeChanger
													pageSizeOptions={[10000, 20000, 50000, 100000]}
													showQuickJumper
													showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
												/>
											</div>
											{
												isMappingModalVisible && <Modal
													open={isMappingModalVisible}
													onCancel={() => setIsMappingModalVisible(false)}
													footer={<div
														style={{
															width: '100%',
															display: 'flex',
															justifyContent: 'end',
															gap: '10px',
														}}
													>
														<Button
															key="cancel"
															onClick={() => {
																setIsMappingModalVisible(false);
																setSelectedMapping({});
															}}
														>
															Hủy
														</Button>

														<Popconfirm
															title="Ghi đè dữ liệu"
															description="Bạn có muốn ghi đè dữ liệu đã được mapping? (Không thể hoàn tác)"
															onConfirm={handleMappingConfirm}
															okText="Đồng ý"
															cancelText="Từ chối"
														>
															<Button
																type="primary"
																disabled={selectedRecords.length === 0}
															>
																{selectedRecords.length === 0 ? 'Cập nhật' : selectedRecords.length === filteredRecords.length ? 'Cập nhật tất cả' : `Cập nhật (${selectedRecords.length}) bản ghi`}
															</Button>
														</Popconfirm>
													</div>}
													width={'90vw'}
													title={<Typography.Title level={3}>Thông tin mapping</Typography.Title>}
													bodyStyle={{
														width: '100%', height: '80vh', overflow: 'auto',
													}}
													centered
												>
													{selectedmapping && Object.keys(selectedmapping).length > 0 && (
														<MappingElement
															selectedItem={selectedmapping}
															records={filteredRecords}
															isMappingModalVisible={isMappingModalVisible}
															setSelectedRecords={setSelectedRecords}
															selectedRecords={selectedRecords}
														/>)}
												</Modal>
											}


											{
												isImportModalVisible && <Modal
													title="Import File Excel"
													open={isImportModalVisible}
													onCancel={closeImportModal}
													width={1400}
													footer={[<Button key="cancel" onClick={closeImportModal}>
														Hủy
													</Button>, <Popconfirm
														title="Chọn phương thức import"
														description="Bạn muốn ghi đè dữ liệu hiện tại hay thêm mới?"
														onConfirm={() => handleImportChoice('add')}
														onCancel={() => handleImportChoice('overwrite')}
														okText="Thêm mới"
														cancelText="Ghi đè"
														disabled={importedData.length === 0}
													>
														<Button
															key="import"
															type="primary"
															disabled={importedData.length === 0}
														>
															Import
														</Button>
													</Popconfirm>]}
												>
													{loading && (<div
														style={{
															display: 'flex',
															justifyContent: 'center',
															alignItems: 'center',
															height: '100vh',
															position: 'fixed',
															top: 0,
															left: 0,
															width: '100vw',
															zIndex: '1000',
															backgroundColor: 'rgba(255, 255, 255, 1)',
														}}
													>
														<img src="/loading_moi_2.svg" alt="Loading..."
															 style={{ width: '600px', height: '500px' }} />
														{textLoad}
													</div>)}
													<Dragger
														accept=".xls,.xlsx"
														beforeUpload={(file) => {
															handleFileUpload(file);
															return false;
														}}
														showUploadList={false}
														disabled={isProcessingFile}
													>
														{isProcessingFile ? (<Spin tip="Đang xử lý file...">
															<div style={{ padding: '20px' }}>
																<p>Vui lòng đợi trong giây lát</p>
															</div>
														</Spin>) : (<>
															<p className="ant-upload-drag-icon">
																<InboxOutlined />
															</p>
															<p className="ant-upload-text">
																Kéo và thả file Excel vào đây hoặc nhấn để chọn file
															</p>
															<p className="ant-upload-hint">Chỉ hỗ trợ file có định dạng .xls
																hoặc
																.xlsx</p>
														</>)}
													</Dragger>
													{importedData.length > 0 && (<Table
														columns={importColumns}
														dataSource={importedData}
														pagination={{
															pageSize: 50,
															total: importedData.length,
															showSizeChanger: true,
															showTotal: (total) => `Tổng số ${total} dòng`,
														}}
														scroll={{ x: true }}
														style={{ marginTop: 16, height: '400px', overflow: 'auto' }}
													/>)}
												</Modal>
											}


											{isValidateModalVisible && (<Modal
												title="Validate dữ liệu"
												open={isValidateModalVisible}
												onCancel={() => {
													setIsValidateModalVisible(false);
												}}
												width={1200}
												styles={{
													body: {
														padding: 0, margin: 0, height: '80vh',
													},
												}}
												centered
											>
												<ValidateElementView selectedItem={selectedItem} />
											</Modal>)}

											{
												showDuplicateColumnSelector && <Modal
													title="Chọn Cột kiểm tra"
													open={showDuplicateColumnSelector}
													onCancel={() => setShowDuplicateColumnSelector(false)}
													centered
													footer={false}
												>
													<div className="check__Duplicates__container">
														{templateColumns.map((column) => (
															<div key={column.columnName} className="check__Duplicates">
																<input
																	type="checkbox"
																	checked={duplicateHighlightColumns.includes(column.columnName)}
																	onChange={() => toggleDuplicateHighlight(column.columnName)}
																	className="check__Duplicates__input"
																/>
																{column.columnName}
															</div>))}
													</div>
												</Modal>
											}


											<Modal
												title={<div style={{
													display: 'flex', justifyContent: 'start', alignItems: 'center',
												}}>
													<span style={{
														fontSize: '25px',
													}}>{`Nhập liệu ${fileNote?.name}`}</span>
													<Button type="link" onClick={handleShareLink}>
														Chia sẻ link
													</Button>
												</div>}
												open={isFormModalVisible}
												onCancel={handleCloseFormModal}
												footer={null} // Remove the default footer since we have buttons in the form
												width={800}
												centered
											>
												<TemplateForm
													templateColumns={templateColumns}
													templateData={templateData}
													fileNote={fileNote}
													onSuccess={() => {
														handleCloseFormModal();
														fetchData(); // Refresh the data after adding a new row
													}}
													onCancel={handleCloseFormModal}
												/>
											</Modal>

											<CustomRowModal
												visible={isCustomRowModalVisible}
												onCancel={() => setIsCustomRowModalVisible(false)}
												onOk={handleAddCustomRows}
												initialCount={1}
											/>
										</div>}

									{templateData?.isCombine && <>
										<ViewCombine templateData={templateData}
													 isStatusFilter={isStatusFilter}
													 handleSaveCombineTable={handleSaveCombineTable}
													 isMobileMenu={isMobileMenu}
										/>
									</>}

								</div>

							</>

							: <>

								<SheetDetail selectedTab={selectedTab} isMobileMenu={isMobileMenu} />
							</>
						}
						{tabRotates && tabRotates.length > 0 && (
							<div className={css.sheetTabsWrapper}>
								{showLeft && (
									<button
										className={`${css.arrowButton} ${css.arrowButtonLeft}`}
										onClick={() => {
											const container = sheetTabsRef.current;
											if (container) container.scrollBy({ left: -120, behavior: 'smooth' });
										}}
										tabIndex={-1}
										aria-label="Scroll left"
										type="button"
										style={{ left: 0 }}
									>
										<ChevronLeft size={20} />
									</button>
								)}
								<div
									className={css.sheetTabs}
									ref={sheetTabsRef}
									style={{ width: '100%', margin: '0 32px', scrollBehavior: 'smooth' }}
								>
									{/* tab list */}
									{tabRotates.map((tab, idx) => (
										idx === 0 ? (
											<div
												key={tab?.id}
												className={css.sheetTabItem}
												style={selectedTabId === tab?.id ? { color: fills[0], fontWeight: 'bold' } : {}}
												onClick={() => {
													setSelectedTabId(tab.id);
													setIsMainTab(tab?.isMainTab);
													setSelectedTab(tab);
												}}
												title={tab?.name}
											>
												{tab?.name || 'Untitled'}
											</div>
										) : (
											<Dropdown
												key={tab.id}
												menu={getTabContextMenu(tab.id)}
												trigger={['contextMenu']}
											>
												<div
													key={tab?.id}
													className={css.sheetTabItem}
													style={selectedTabId === tab?.id ? { color: fills[0], fontWeight: 'bold' } : {}}
													onClick={() => {
														setSelectedTabId(tab.id);
														setIsMainTab(tab?.isMainTab);
														setSelectedTab(tab);
													}}
													title={tab?.name}
												>
													{tab?.name || 'Untitled'}
												</div>
											</Dropdown>
										)
									))}
								</div>
								{showRight && (
									<button
										className={`${css.arrowButton} ${css.arrowButtonRight}`}
										onClick={() => {
											const container = sheetTabsRef.current;
											if (container) container.scrollBy({ left: 120, behavior: 'smooth' });
										}}
										tabIndex={-1}
										aria-label="Scroll right"
										type="button"
										style={{ right: 0 }}
									>
										<ChevronRight size={20} />
									</button>
								)}
							</div>
						)}
					</> : <BangGhep handleGhepBang={handleGhepBang} />)
				: (status ? <>
					{isMainTab ?
						<>
							<div className="report__header">
								<div className="sheet_title">
									<span>{fileNote && fileNote.name}
									</span>


									<div className="setting_userClass">
										<img
											style={{ width: '25px', height: '25px', cursor: 'pointer' }}
											src={IconUser}
											alt=""
											onClick={() => (currentUser.isAdmin || fileNote.user_create == currentUser.email) && setOpenSetupUC(true)}
										/>
										{fileNote?.userClass && fileNote.userClass.map((uc) => <span
											className={css.tag}>{uc}</span>)}
									</div>
									{
										(templateData?.isCombine || (templateData?.mother_table_id && !isNaN(Number(templateData?.mother_table_id)))) && (
											<Tag color="green"
												 style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
												{templateData?.isCombine ? '#Bảng ghép' :
													(templateData?.mother_table_id && !isNaN(Number(templateData?.mother_table_id))) ? '#Bảng xoay' :
														null}
											</Tag>
										)
									}


									<ActionSave handleSaveData={handleSaveData} updateData={updatedData} />
									{updatedData.length > 0 && (
										<div className={css.blinkText}>
											<span>Có dữ liệu thay đổi, vui lòng lưu lại! &nbsp; &nbsp;</span>
										</div>
									)}
								</div>
								<div className="report__button-group">
									<div className={'buttonAction'}>
										{menuSettingsVersion === 'compact' && (
											<Button className={css.customButton}
													onClick={() => setIsModalVisible(true)}
											>
												<span style={{display: 'flex', alignItems: 'center', color: fills[0]}}> <Plus size={18}/> Dữ liệu</span>
											</Button>
										)}
										<ModalAddOriginalData
											isModalVisible={isModalVisible}
											setIsModalVisible={setIsModalVisible}
										/>
										{templateData?.table_type === Template_Table_Type.ROTATE && (<>
											<Button
												className={css.customButton}
												onClick={() => handleUpdateRotatedTable()}
												loading={isUpdating}
												disabled={isUpdating}
											>
												<span>Cập nhập lại từ bảng gốc</span>
											</Button>
										</>)}

										{itemsMapping.length > 0 && countErr > 0 && (<Dropdown
											menu={{
												items: itemsMapping,
											}}
											placement="bottom"
										>
											<Badge count={itemsMapping.length}>
												<Button className={css.customButton}>
													Mapping
												</Button>
											</Badge>
										</Dropdown>)}

										{!templateData?.isCombine && <>
											{/*<Button className={css.customButton}*/}
											{/*    onClick={handleFormButtonClick}>*/}
											{/*    <span>+ form</span>*/}
											{/*</Button>*/}

											{/*<Button className={css.customButton}*/}
											{/*    onClick={handleAddRow}>*/}
											{/*    <span>+ dòng</span>*/}
											{/*</Button>*/}

											{/*<Button className={css.customButton}*/}
											{/*    onClick={() => setIsCustomRowModalVisible(true)}>*/}
											{/*    <span>+ n dòng</span>*/}
											{/*</Button>*/}

											{/*<Button className={css.customButton}*/}
											{/*	onClick={() => setShowSettingsPopup(true)}>*/}
											{/*	<span>Cài đặt bảng</span>*/}
											{/*</Button>*/}
											{
												!isDuLieuNen && <RotateTable rowDataGoc={rowDataGocData}
																			 columnsGoc={columnsGocData}
																			 fileNote={fileNote}
																			 motherTable={templateData}
																			 setLoading={setLoading}
												/>
											}
											{
												!isDuLieuNen && templateData.isNeedUpdatePivot &&
												<UpdateAllRotateTablesButton tabRotates={tabRotates}
																			 templateData={templateData}
																			 setTemplateData={setTemplateData}
																			 setLoadData={setLoadData}
																			 loading={loading}
																			 setLoading={setLoading}
																			 css={css}
												/>
											}

											{/*<Dropdown*/}
											{/*	menu={{*/}
											{/*		items: validates,*/}
											{/*	}}*/}
											{/*	placement="bottom"*/}
											{/*>*/}
											{/*	<Badge count={countErr}>*/}
											{/*		<Button className={css.customButton}>*/}
											{/*			<span>Validate</span>*/}
											{/*		</Button>*/}
											{/*	</Badge>*/}
											{/*</Dropdown>*/}

										</>


										}
										{templateData?.isCombine && <>


											<Modal
												title="Danh sách bảng thành phần"
												visible={isModalVisible}
												onCancel={() => setIsModalVisible(false)}
												footer={null}
											>
												<Table
													dataSource={templateList}
													columns={[{
														title: 'Template ID',
														dataIndex: 'templateId',
														key: 'templateId',
													}, { title: 'Name', dataIndex: 'name', key: 'name' }]}
													rowKey="templateId"
													pagination={false}
												/>
											</Modal>
										</>}
										{templateData?.table_type === Template_Table_Type.ROTATE && (<>
											<Button
												className={css.customButton}
												onClick={async () => {
													if (templateData?.mother_table_id) {
														try {
															const tableData = await getTableByid(templateData.mother_table_id);
															if (!tableData || !tableData.fileNote_id) {
																console.error(`No fileNote_id found for mother table ID ${templateData.mother_table_id}`);
																return;
															}

															const fileNote = await getFileNotePadByIdController(tableData.fileNote_id);
															if (!fileNote || !fileNote.name) {
																console.error(`No name found for fileNote ID ${tableData.fileNote_id}`);
																return;
															}

															setTemplateList([{
																templateId: templateData.mother_table_id,
																name: fileNote.name,
															}]);
															setIsModalVisible(true);
														} catch (error) {
															console.error('Error fetching mother table or fileNote data:', error);
														}
													}
												}}
											>
												<span>Xem bảng gốc</span>
											</Button>

											<Modal
												title="Danh sách bảng gốc"
												visible={isModalVisible}
												onCancel={() => setIsModalVisible(false)}
												footer={null}
											>
												<Table
													dataSource={templateList}
													columns={[{
														title: 'Template ID',
														dataIndex: 'templateId',
														key: 'templateId',
													}, { title: 'Name', dataIndex: 'name', key: 'name' }]}
													rowKey="templateId"
													pagination={false}
												/>
											</Modal>
										</>)}
										{/*<Button className={css.customButton}*/}
										{/*	onClick={() => setShowSettingsChartPopup(true)}>*/}
										{/*	<span>Tạo biểu đồ</span>*/}
										{/*</Button>*/}
										<Button className={css.customButton}
														onClick={() => setShowSettingsPopup(true)}>
													<Table2 size={14}  />
													<span>Cài đặt bảng</span>
												</Button>

										<Button className={css.customButton} onClick={handleChangeStatusFilter}>
											<span>{isStatusFilter ? '❌ Tắt filter' : '✅ Bật filter'}</span>
										</Button>

										<Button className={css.customButton} onClick={handleShowInfo}>
											<span>{showInfo ? '❌ Tắt ghi chú' : '✅ Bật ghi chú'}</span>
										</Button>

										<ActionDeleteMany handleSaveData={handleDeleteData} updateData={selectedRows} />


										{/*<Button className={css.customButton}*/}
										{/*    onClick={() => setShowSettingsCombine(true)}>*/}
										{/*    <span>Ghép bảng</span>*/}
										{/*</Button>*/}

										{/*<Button className={css.customButton}*/}
										{/*    onClick={() => setShowSettingsCraw(true)}>*/}
										{/*    <span>Craw</span>*/}
										{/*</Button>*/}

										<ActionMenuDropdown popoverContent={popoverContent}
															dropdownOpen={dropdownOpen}
															setDropdownOpen={setDropdownOpen} />
									</div>

								</div>

							</div>
							{showInfo && <div style={{ marginBottom: 10 }}>
								<div style={{ marginBottom: 10 }}>
									<RichNoteKTQTRI table={`RichNote_Template_${fileNoteId}`} />
								</div>
							</div>}

							<div
								style={{
									height: showInfo ? '66vh': (isMobileMenu ? '64vh' : '75vh') ,
									display: 'flex',
									flexDirection: 'column',
									position: 'relative',
									marginTop: '15px',
								}}
							>


								{!templateData?.isCombine &&
									<div className="report">
										<div
											className={`ag-theme-quartz`}
											style={{
												height: '100%', width: '100%',
												transition: 'opacity 0.25s',
												// opacity: loading ? 0.1 : 1,
											}}>
											<AgGridReact
												suppressRowClickSelection={true}
												onSelectionChanged={onSelectionChanged}
												onFilterChanged={onFilterChanged}
												statusBar={statusBar}
												ref={gridRef}
												rowData={rowData} // Sử dụng rowData đã fetch cho tab hiện tại
												columnDefs={colDefs} // Sử dụng colDefs đã fetch cho tab hiện tại
												defaultColDef={defaultColDef}
												rowSelection="multiple"
												enableRangeSelection={true}
												onCellValueChanged={handleCellValueChanged}
												animateRows={true}
												localeText={AG_GRID_LOCALE_VN}
												onColumnResized={onColumnResized}
												onColumnMoved={onColumnMoved}
												suppressScrollOnNewData={true}
												maintainColumnOrder={true}
												groupDefaultExpanded={0}
												pagination={false}
											/>
										</div>

										<div style={{
											padding: '8px 16px',
											display: 'flex',
											justifyContent: 'flex-end',
											borderTop: '1px solid #e5e7eb',
										}}>
											<Pagination
												current={currentPage}
												pageSize={pageSize}
												total={totalRows}
												onChange={handlePageChange}
												showSizeChanger
												pageSizeOptions={[10000, 20000, 50000, 100000]}
												showQuickJumper
												showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
											/>
										</div>
										{
											isMappingModalVisible && <Modal
												open={isMappingModalVisible}
												onCancel={() => setIsMappingModalVisible(false)}
												footer={<div
													style={{
														width: '100%', display: 'flex', justifyContent: 'end', gap: '10px',
													}}
												>
													<Button
														key="cancel"
														onClick={() => {
															setIsMappingModalVisible(false);
															setSelectedMapping({});
														}}
													>
														Hủy
													</Button>

													<Popconfirm
														title="Ghi đè dữ liệu"
														description="Bạn có muốn ghi đè dữ liệu đã được mapping? (Không thể hoàn tác)"
														onConfirm={handleMappingConfirm}
														okText="Đồng ý"
														cancelText="Từ chối"
													>
														<Button
															type="primary"
															disabled={selectedRecords.length === 0}
														>
															{selectedRecords.length === 0 ? 'Cập nhật' : selectedRecords.length === filteredRecords.length ? 'Cập nhật tất cả' : `Cập nhật (${selectedRecords.length}) bản ghi`}
														</Button>
													</Popconfirm>
												</div>}
												width={'90vw'}
												title={<Typography.Title level={3}>Thông tin mapping</Typography.Title>}
												bodyStyle={{
													width: '100%', height: '80vh', overflow: 'auto',
												}}
												centered
											>
												{selectedmapping && Object.keys(selectedmapping).length > 0 && (
													<MappingElement
														selectedItem={selectedmapping}
														records={filteredRecords}
														isMappingModalVisible={isMappingModalVisible}
														setSelectedRecords={setSelectedRecords}
														selectedRecords={selectedRecords}
													/>)}
											</Modal>
										}


										{
											isImportModalVisible && <Modal
												title="Import File Excel"
												open={isImportModalVisible}
												onCancel={closeImportModal}
												width={1400}
												footer={[<Button key="cancel" onClick={closeImportModal}>
													Hủy
												</Button>, <Popconfirm
													title="Chọn phương thức import"
													description="Bạn muốn ghi đè dữ liệu hiện tại hay thêm mới?"
													onConfirm={() => handleImportChoice('add')}
													onCancel={() => handleImportChoice('overwrite')}
													okText="Thêm mới"
													cancelText="Ghi đè"
													disabled={importedData.length === 0}
												>
													<Button
														key="import"
														type="primary"
														disabled={importedData.length === 0}
													>
														Import
													</Button>
												</Popconfirm>]}
											>
												{loading && (<div
													style={{
														display: 'flex',
														justifyContent: 'center',
														alignItems: 'center',
														height: '100vh',
														position: 'fixed',
														top: 0,
														left: 0,
														width: '100vw',
														zIndex: '1000',
														backgroundColor: 'rgba(255, 255, 255, 1)',
													}}
												>
													<img src="/loading_moi_2.svg" alt="Loading..."
														 style={{ width: '600px', height: '500px' }} />
													{textLoad}
												</div>)}
												<Dragger
													accept=".xls,.xlsx"
													beforeUpload={(file) => {
														handleFileUpload(file);
														return false;
													}}
													showUploadList={false}
													disabled={isProcessingFile}
												>
													{isProcessingFile ? (<Spin tip="Đang xử lý file...">
														<div style={{ padding: '20px' }}>
															<p>Vui lòng đợi trong giây lát</p>
														</div>
													</Spin>) : (<>
														<p className="ant-upload-drag-icon">
															<InboxOutlined />
														</p>
														<p className="ant-upload-text">
															Kéo và thả file Excel vào đây hoặc nhấn để chọn file
														</p>
														<p className="ant-upload-hint">Chỉ hỗ trợ file có định dạng .xls
															hoặc
															.xlsx</p>
													</>)}
												</Dragger>
												{importedData.length > 0 && (<Table
													columns={importColumns}
													dataSource={importedData}
													pagination={{
														pageSize: 50,
														total: importedData.length,
														showSizeChanger: true,
														showTotal: (total) => `Tổng số ${total} dòng`,
													}}
													scroll={{ x: true }}
													style={{ marginTop: 16, height: '400px', overflow: 'auto' }}
												/>)}
											</Modal>
										}


										{isValidateModalVisible && (<Modal
											title="Validate dữ liệu"
											open={isValidateModalVisible}
											onCancel={() => {
												setIsValidateModalVisible(false);
											}}
											width={1200}
											styles={{
												body: {
													padding: 0, margin: 0, height: '80vh',
												},
											}}
											centered
										>
											<ValidateElementView selectedItem={selectedItem} />
										</Modal>)}

										{
											showDuplicateColumnSelector && <Modal
												title="Chọn Cột kiểm tra"
												open={showDuplicateColumnSelector}
												onCancel={() => setShowDuplicateColumnSelector(false)}
												centered
												footer={false}
											>
												<div className="check__Duplicates__container">
													{templateColumns.map((column) => (
														<div key={column.columnName} className="check__Duplicates">
															<input
																type="checkbox"
																checked={duplicateHighlightColumns.includes(column.columnName)}
																onChange={() => toggleDuplicateHighlight(column.columnName)}
																className="check__Duplicates__input"
															/>
															{column.columnName}
														</div>))}
												</div>
											</Modal>
										}

										{/* {openSetupUC && (<>
											<Modal
												title={`Cài đặt nhóm người dùng`}
												open={openSetupUC}
												onCancel={() => setOpenSetupUC(false)}
												onOk={() => {
													updateFileNotePad({
														...fileNote, userClass: Array.from(selectedUC),
													}).then((data) => {
														setOpenSetupUC(false);
														fetchData();
													});
												}}
												okButtonProps={{
													style: {
														backgroundColor: '#2d9d5b',
													},
												}}
												centered
												width={400}
												bodyStyle={{ height: '20vh', overflowY: 'auto' }}
											>
												{listUC.map((uc) => {
													const isDisabled = !currentUser?.isAdmin && !(uc.userAccess?.includes(currentUser?.email));
													return (
														<Checkbox
															key={uc.name}
															checked={selectedUC.has(uc.name)}
															onChange={() => handleChange(uc.name)}
															disabled={isDisabled}
														>
															{uc.name}
														</Checkbox>
													);
												})}
											</Modal>
										</>)} */}

										<Modal
											title={<div style={{
												display: 'flex', justifyContent: 'start', alignItems: 'center',
											}}>
												<span style={{
													fontSize: '25px',
												}}>{`Nhập liệu ${fileNote?.name}`}</span>
												<Button type="link" onClick={handleShareLink}>
													Chia sẻ link
												</Button>
											</div>}
											open={isFormModalVisible}
											onCancel={handleCloseFormModal}
											footer={null} // Remove the default footer since we have buttons in the form
											width={800}
											centered
										>


											<TemplateForm
												templateColumns={templateColumns}
												templateData={templateData}
												fileNote={fileNote}
												onSuccess={() => {
													handleCloseFormModal();
													fetchData(); // Refresh the data after adding a new row
												}}
												onCancel={handleCloseFormModal}
											/>
										</Modal>

										<CustomRowModal
											visible={isCustomRowModalVisible}
											onCancel={() => setIsCustomRowModalVisible(false)}
											onOk={handleAddCustomRows}
											initialCount={1}
										/>
									</div>}

								{templateData?.isCombine && <>
									<ViewCombine
										templateData={templateData}
										isStatusFilter={isStatusFilter}
										handleSaveCombineTable={handleSaveCombineTable}
										isMobileMenu={isMobileMenu}
									/>

								</>}

							</div>

						</>

						: <>

							<SheetDetail selectedTab={selectedTab} isMobileMenu={isMobileMenu} />
						</>
					}
					{tabRotates && tabRotates.length > 0 && (
						<div className={css.sheetTabsWrapper}>
							{showLeft && (
								<button
									className={`${css.arrowButton} ${css.arrowButtonLeft}`}
									onClick={() => {
										const container = sheetTabsRef.current;
										if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
									}}
									tabIndex={-1}
									aria-label="Scroll left"
									type="button"
									style={{ left: 0 }}
								>
									<ChevronLeft size={20} />
								</button>
							)}
							<div
								className={css.sheetTabs}
								ref={sheetTabsRef}
								style={{ width: '100%', margin: '0 32px', scrollBehavior: 'smooth' }}
							>
								{/* tab list */}
								{tabRotates.map((tab, idx) => (
									idx === 0 ? (
										<div
											key={tab?.id}
											className={css.sheetTabItem}
											style={selectedTabId === tab?.id ? { color: fills[0], fontWeight: 'bold' } : {}}
											onClick={() => {
												setSelectedTabId(tab.id);
												setIsMainTab(tab?.isMainTab);
												setSelectedTab(tab);
											}}
											title={tab?.name}
										>
											{tab?.name || 'Untitled'}
										</div>
									) : (
										<Dropdown
											key={tab.id}
											menu={getTabContextMenu(tab.id)}
											trigger={['contextMenu']}
										>
											<div
												key={tab?.id}
												className={css.sheetTabItem}
												style={selectedTabId === tab?.id ? { color: fills[0], fontWeight: 'bold' } : {}}
												onClick={() => {
													setSelectedTabId(tab.id);
													setIsMainTab(tab?.isMainTab);
													setSelectedTab(tab);
												}}
												title={tab?.name}
											>
												{tab?.name || 'Untitled'}
											</div>
										</Dropdown>
									)
								))}
							</div>
							{showRight && (
								<button
									className={`${css.arrowButton} ${css.arrowButtonRight}`}
									onClick={() => {
										const container = sheetTabsRef.current;
										if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
									}}
									tabIndex={-1}
									aria-label="Scroll right"
									type="button"
									style={{ right: 0 }}
								>
									<ChevronRight size={20} />
								</button>
							)}
						</div>
					)}
				</> : <BangDuLieu handleCaiDatBang={handleCaiDatBang} />)
			}

		</>) : (<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '90vh',
				color: 'red',
				fontSize: '18px',
			}}
		>
			Không có quyền để xem
		</div>)}
		{showSettingsChartPopup && <><SettingChart showSettingsChartPopup={showSettingsChartPopup}
												   setShowSettingsChartPopup={setShowSettingsChartPopup}
												   colDefs={colDefs}
												   templateData={templateData}
		/>
		</>}
		{showSettingsCombine && <><SettingCombine2 showSettingsChartPopup={showSettingsCombine}
												   setShowSettingsChartPopup={setShowSettingsCombine}
												   templateData={templateData}
												   fetchData={fetchData}
		/>
		</>}
		{showSettingsCraw && <><SettingCraw showSettingsChartPopup={showSettingsCraw}
											setShowSettingsChartPopup={setShowSettingsCraw}
											templateData={templateData}
											fetchData={fetchData}
		/>
		</>}
		{showSettingsPopup && (<SheetColumnSetting
			fileNote={fileNote}
			id={templateData.id}
			templateData={templateData}
			rowData={rowData}
			handleAddColumn={handleAddColumn}
			handleCloneColumn={handleCloneColumn}
			sheetColumns={templateColumns}
			setSheetColumns={setTemplateColumns}
			columnTypeOptions={columnTypeOptions}
			handleClosePopUpSetting={handleClosePopUpSetting}
			dropdownOptions={dropdownOptions}
			setDropdownOptions={setDropdownOptions}
			getData={fetchData}
			currentUser={currentUser}
			listUC={listUC}
		/>)}
		{/* Rename Tab Modal */}
		{renameTabModal.visible && (
			<Modal
				title="Đổi tên tab"
				open={renameTabModal.visible}
				onOk={handleConfirmRenameTab}
				onCancel={handleCloseRenameTab}
				okText="Lưu"
				cancelText="Hủy"
				centered
			>
				<Input
					value={renameTabModal.name}
					onChange={e => setRenameTabModal({ ...renameTabModal, name: e.target.value })}
					placeholder="Nhập tên tab mới"
					onPressEnter={handleConfirmRenameTab}
					maxLength={100}
					autoFocus
				/>
			</Modal>

		)}

	</>);
};


export default Template;
