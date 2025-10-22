import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
	Radio,
	List,
	Upload,
	Input,
	Button,
	message,
	Card,
	Space,
	Modal,
	Select,
	Table,
	Progress,
	Spin,
	TreeSelect,
	Switch,
	Form,
	Typography,
	Divider,
	Alert,
	Popover,
	Popconfirm,
	Checkbox
} from 'antd';
import { InputNumber } from 'antd';
import {
	FileExcelOutlined,
	GoogleOutlined,
	CloudOutlined,
	UploadOutlined,
	LinkOutlined,
	FolderOutlined,
	InboxOutlined,
	DatabaseOutlined,
	ApiOutlined,
	KeyOutlined,
	PlusOutlined,
	DeleteOutlined,
	InfoCircleOutlined,
	ReloadOutlined,
	SettingOutlined,
} from '@ant-design/icons';
import { DatabaseZap, Table2 } from 'lucide-react';
import Dragger from 'antd/es/upload/Dragger.js';
import * as XLSX from 'xlsx';
import { n8nWebhook, n8nWebhookGoogleDrive, n8nWebhookGetFileFromGoogleDrive } from '../../../../apis/n8nWebhook.jsx';
import {
	getAllRecentFolders,
	getRecentFoldersByUserClass,
	createRecentFolder,
	updateRecentFolder,
	deleteRecentFolder
} from '../../../../apis/recentFolderService.jsx';
import { getAllUserClass } from '../../../../apis/userClassService.jsx';
import axios from 'axios';
import PostgresExplorer from '../../../../components/PostgresExplorer/PostgresExplorer.jsx';
import { postgresService } from '../../../../apis/postgresService.jsx';
import { getAllTemplateTableInfo, getTemplateRow } from '../../../../apis/templateSettingService.jsx';
import { useParams } from 'react-router-dom';
import { processAggregate } from '../tableData/logic/aggregateUtils.js';
import { getAllSoKeToan } from '../../../../apisKTQT/soketoanService.jsx';
import { getAllKmf } from '../../../../apisKTQT/kmfService.jsx';
import { calculateDataViewKQKDFS2 } from '../../../KeToanQuanTri/BaoCao/logic/logicKQKDFS.js';
import { MyContext } from '../../../../MyContext.jsx';
import { getAllUnits } from '../../../../apisKTQT/unitService.jsx';
import { checkUploadLimits, checkColumnLimit } from '../../../../utils/uploadLimitUtils.js';
import { calculateDataView2 } from '../../../KeToanQuanTri/BaoCao/KQKD/logicKQKD.js';
import { getAllProject } from '../../../../apisKTQT/projectService.jsx';
import { fetchGoogleDriveFolder } from '../../../../apis/googleDriveFolderService.jsx';
import { createFrequencyConfig } from '../../../../apis/frequencyConfigService.jsx';
const { Option } = Select;
const { Text } = Typography;

const functionOptions = [
	{ value: 'sum', label: 'Sum', description: 'Tổng các giá trị số' },
	{ value: 'count', label: 'Count', description: 'Số lượng bản ghi' },
	{ value: 'avg', label: 'Average', description: 'Giá trị trung bình' },
	{ value: 'min', label: 'Min', description: 'Giá trị nhỏ nhất' },
	{ value: 'max', label: 'Max', description: 'Giá trị lớn nhất' },
	{ value: 'std', label: 'Standard Deviation', description: 'Độ lệch chuẩn' },
	{ value: 'distinct_count', label: 'Distinct Count', description: 'Số lượng giá trị khác nhau' },
];

const defaultAgg = { column: '', function: 'sum', alias: '' };

const UploadConfig = ({
	initialConfig = {},
	onChange,
	templateData = null,
	currentStepId = null,
	availableColumns = [],
	onStepStatusUpdate = null,
	onSaveData = null,
	onSaveAndAddStep = null,
	uploadSaving = false,
	modalOpen = false,
	onDataUpdate = null,
	mode = null,
	onPrepare = null,
}) => {
	const { idFileNote } = useParams();
	const { currentYearKTQT, currentCompanyKTQT, currentUser, currentSchemaPathRecord } = useContext(MyContext);
	const [config, setConfig] = useState({
		uploadType: initialConfig.uploadType || 'excel',
		file: null,
		googleSheetUrl: '',
		googleDriveUrl: '',
		googleDriveMultiFiles: initialConfig.googleDriveMultiFiles || false,
		intervalUpdate: initialConfig.intervalUpdate || 0, // 0 = không tự động, > 0 = số phút
		lastUpdate: initialConfig.lastUpdate || null,
		enableAutoUpdate: initialConfig.enableAutoUpdate || false, // Thêm cấu hình tự động cập nhật
		googleSheetsHeaderRow: initialConfig.googleSheetsHeaderRow || 0, // Thêm dòng này để lưu hàng header được chọn
		// Thêm cấu hình cho Excel processing
		excelProcessingMode: initialConfig.excelProcessingMode || 'normal', // 'normal' hoặc 'aggregate'
		excelAggregateInfo: initialConfig.excelAggregateInfo || null, // Thông tin hiển thị cho aggregate
		...initialConfig,
	});


	// States for Excel upload
	const [importedData, setImportedData] = useState([]);
	const [importColumns, setImportColumns] = useState([]);
	const [loading, setLoading] = useState(false);
	const [importProgress, setImportProgress] = useState(0);

	// States for Excel sheet and header selection
	const [excelSheets, setExcelSheets] = useState([]);
	const [selectedSheet, setSelectedSheet] = useState('');
	const [excelRawData, setExcelRawData] = useState([]);
	const [selectedExcelHeaderRow, setSelectedExcelHeaderRow] = useState(0);
	const [excelHeaderOptions, setExcelHeaderOptions] = useState([]);
	const [isExcelModalVisible, setIsExcelModalVisible] = useState(false);
	const [excelWorkbook, setExcelWorkbook] = useState(null);

	// States for Excel aggregate processing
	const [excelGroupBy, setExcelGroupBy] = useState([]);
	const [excelAggregations, setExcelAggregations] = useState([defaultAgg]);
	const [processedData, setProcessedData] = useState([]);
	const [showAggregateConfig, setShowAggregateConfig] = useState(false);

	// States for column filtering
	const [selectedExcelColumns, setSelectedExcelColumns] = useState([]);
	const [selectedGgsColumns, setSelectedGgsColumns] = useState([]);
	const [selectedPostgresColumns, setSelectedPostgresColumns] = useState([]);
	const [selectedApiColumns, setSelectedApiColumns] = useState([]);
	const [selectedSystemColumns, setSelectedSystemColumns] = useState([]);
	const [showColumnFilter, setShowColumnFilter] = useState(false);

	// States for Google Sheets
	const [ggsData, setGgsData] = useState([]);
	const [ggsColumns, setGgsColumns] = useState([]);
	const [ggsLoading, setGgsLoading] = useState(false);
	const [ggsStep, setGgsStep] = useState('input'); // input | preview | done
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [rawGgsData, setRawGgsData] = useState([]);
	const [selectedHeaderRow, setSelectedHeaderRow] = useState(0);
	const [headerOptions, setHeaderOptions] = useState([]);
	const [ggsHeaders, setGgsHeaders] = useState([]); // Lưu trữ headers metadata

	// State for validation error modal
	const [validationErrorModal, setValidationErrorModal] = useState(false);
	const [validationErrorMessage, setValidationErrorMessage] = useState('');

	// States for Google Drive
	const [driveData, setDriveData] = useState([]);
	const [driveColumns, setDriveColumns] = useState([]);
	const [driveLoading, setDriveLoading] = useState(false);
	const [driveRawData, setDriveRawData] = useState([]);
	// const [driveSheetNames, setDriveSheetNames] = useState([]);
	// const [selectedDriveSheet, setSelectedDriveSheet] = useState('');
	const [driveStep, setDriveStep] = useState('input'); // 'input', 'selectHeader', 'preview'
	const [selectedDriveHeaderRow, setSelectedDriveHeaderRow] = useState(0);
	const [isDriveModalVisible, setIsDriveModalVisible] = useState(false);
	const [hiddenDriveColumns, setHiddenDriveColumns] = useState([]);
	// New: Google Drive folder -> file selection
	const [driveFileList, setDriveFileList] = useState([]);
	const [isDriveFileModalVisible, setIsDriveFileModalVisible] = useState(false);
	const [selectedDriveFileId, setSelectedDriveFileId] = useState('');
	// Multi-file selection support
	const [selectedDriveFileIds, setSelectedDriveFileIds] = useState([]); // multiple
	const [driveFileMeta, setDriveFileMeta] = useState({}); // { [fileId]: { sheetNames: [], selectedSheet: '', headerRow: number } }
	const [driveOrderMap, setDriveOrderMap] = useState({}); // { [fileId]: order }
	const [driveSheetNames, setDriveSheetNames] = useState([]);
	const [selectedDriveSheet, setSelectedDriveSheet] = useState('');

	// States for Recent Folders
	const [recentFolders, setRecentFolders] = useState([]);
	const [userClass, setUserClass] = useState(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isSuperAdmin, setIsSuperAdmin] = useState(false);
	const [isRecentFolderSettingsVisible, setIsRecentFolderSettingsVisible] = useState(false);
	const [selectedRecentFolder, setSelectedRecentFolder] = useState(null);
	const [userClassList, setUserClassList] = useState([]);
	const [editingFolder, setEditingFolder] = useState(null);
	const [editingFolderName, setEditingFolderName] = useState('');
	// Folder form modal state
	const [isFolderFormModalVisible, setIsFolderFormModalVisible] = useState(false);
	const [folderFormMode, setFolderFormMode] = useState('create'); // 'create' | 'edit'
	const [folderFormData, setFolderFormData] = useState({ id: null, name: '', link: '', userClass: [] });

	// States for Google Drive Folder import
	const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');
	const [fileNameCondition, setFileNameCondition] = useState('');
	const [lastUpdateCondition, setLastUpdateCondition] = useState('');
	const [frequencyHours, setFrequencyHours] = useState(24);
	const [isFrequencyActive, setIsFrequencyActive] = useState(false);
	const [headerRow, setHeaderRow] = useState(1);
	const [mergeColumns, setMergeColumns] = useState([]);
	const [removeDuplicateColumns, setRemoveDuplicateColumns] = useState([]);
	const [sortColumns, setSortColumns] = useState([]);
	const [googleDriveFolderData, setGoogleDriveFolderData] = useState([]);
	const [googleDriveFolderColumns, setGoogleDriveFolderColumns] = useState([]);
	const [googleDriveFolderLoading, setGoogleDriveFolderLoading] = useState(false);
	const [isGoogleDriveFolderModalVisible, setIsGoogleDriveFolderModalVisible] = useState(false);

	const openCreateFolderModal = () => {
		setFolderFormMode('create');
		setFolderFormData({ id: null, name: '', link: '', userClass: [] });
		setIsFolderFormModalVisible(true);
	};

	const openEditFolderModal = (folder) => {
		setFolderFormMode('edit');
		setFolderFormData({
			id: folder.id,
			name: folder.name || '',
			link: folder.link || '',
			userClass: Array.isArray(folder.userClass) ? folder.userClass : (folder.userClass ? [folder.userClass] : []),
			// show & usedAt are not editable here
		});
		setIsFolderFormModalVisible(true);
	};

	const handleFolderFormChange = (field, value) => {
		setFolderFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleFolderFormCancel = () => {
		setIsFolderFormModalVisible(false);
	};
	useEffect(() => {
		if (isDriveFileModalVisible) {

			console.log('isRecentFolderSettingsVisible');
			setDriveFileMeta({});
			setSelectedDriveFileIds([]);
		}
	}, [isDriveFileModalVisible]);

	const handleFolderFormSave = async () => {
		try {
			const payload = {
				name: folderFormData.name,
				link: folderFormData.link,
				userClass: folderFormData.userClass
			};
			let resp;
			if (folderFormMode === 'create') {
				resp = await createRecentFolder(payload);
			} else {
				resp = await updateRecentFolder(folderFormData.id, payload);
			}
			if (resp && resp.success) {
				message.success(folderFormMode === 'create' ? 'Đã tạo folder' : 'Đã cập nhật folder');
				setIsFolderFormModalVisible(false);
				await refreshRecentFolders();
			} else {
				message.error(resp?.message || 'Lỗi khi lưu folder');
			}
		} catch (e) {
			console.error('FolderForm save error:', e);
			message.error('Lỗi khi lưu folder');
		}
	};

	const handleDeleteFolder = async (folderId) => {
		try {
			await deleteRecentFolder(folderId);
			message.success('Đã xóa folder');
			await refreshRecentFolders();
		} catch (e) {
			console.error('Delete folder error:', e);
			message.error('Lỗi khi xóa folder');
		}
	};

	// States for PostgreSQL
	const [postgresData, setPostgresData] = useState([]);
	const [postgresColumns, setPostgresColumns] = useState([]);
	const [postgresLoading, setPostgresLoading] = useState(false);
	const [postgresStep, setPostgresStep] = useState('connection'); // connection | database | schema | table | preview | done
	const [connectionInfo, setConnectionInfo] = useState({
		host: '',
		port: '5432',
		user: '',
		password: '',
	});
	const [databases, setDatabases] = useState([]);
	const [schemas, setSchemas] = useState([]);
	const [tables, setTables] = useState([]);
	const [selectedDatabase, setSelectedDatabase] = useState('');
	const [selectedSchema, setSelectedSchema] = useState('');
	const [selectedTable, setSelectedTable] = useState('');
	const [connectionLoading, setConnectionLoading] = useState(false);
	const [showPostgresExplorer, setShowPostgresExplorer] = useState(false);

	// States for API Connector
	const [apiData, setApiData] = useState([]);
	const [apiColumns, setApiColumns] = useState([]);
	const [apiLoading, setApiLoading] = useState(false);
	const [apiStep, setApiStep] = useState('input'); // input | preview | done

	// States for HTQC
	const [htqcReportType, setHtqcReportType] = useState('tong_quat'); // tong_quat | nhom_dv | nhom_vv
	const [htqcData, setHtqcData] = useState([]);
	const [htqcColumns, setHtqcColumns] = useState(['DD', 'MM', 'YYYY', 'Khoản mục', 'Số tiền']);

	// States for System Import (Import từ hệ thống)
	const [systemData, setSystemData] = useState([]);
	const [systemColumns, setSystemColumns] = useState([]);
	const [systemLoading, setSystemLoading] = useState(false);
	const [systemStep, setSystemStep] = useState('select'); // select | preview | done
	const [availableTemplateTables, setAvailableTemplateTables] = useState([]);
	const [selectedTemplateTable, setSelectedTemplateTable] = useState(null);
	const [selectedStepId, setSelectedStepId] = useState(null);
	const [availableSteps, setAvailableSteps] = useState([]);
	const [showSystemImportModal, setShowSystemImportModal] = useState(false);

	const [driveSheetsMap, setDriveSheetsMap] = useState({});

	useEffect(() => {
		if (initialConfig && Object.keys(initialConfig).length > 0) {
			setConfig(prev => ({
				...prev,
				...initialConfig,
				uploadType: initialConfig.uploadType || prev.uploadType,
			}));

			// Khôi phục selectedHeaderRow từ config nếu có
			if (initialConfig.googleSheetsHeaderRow !== undefined) {
				// selectedHeaderRow sẽ được khôi phục khi load dữ liệu từ n8n
				// vì cần tìm index tương ứng với rowNumber
			}

			// Khôi phục Excel processing mode
			if (initialConfig.excelProcessingMode === 'aggregate') {
				setShowAggregateConfig(true);
			}

			// Khôi phục Excel sheet và header selection
			if (initialConfig.excelSheet) {
				setSelectedSheet(initialConfig.excelSheet);
			}
			if (initialConfig.excelHeaderRow !== undefined) {
				setSelectedExcelHeaderRow(initialConfig.excelHeaderRow);
			}

			// Khôi phục HTQC report type
			if (initialConfig.htqcReportType) {
				setHtqcReportType(initialConfig.htqcReportType);
			}
		}
	}, [initialConfig]);

	const handleConfigChange = useCallback((key, value) => {
		setConfig(prev => {
			const newConfig = {
				...prev,
				[key]: value,
			};
			// Gọi onChange với config mới
			onChange(newConfig);
			return newConfig;
		});
	}, [onChange]);

	// Function to find all userClass IDs based on user email
	const findAllUserClassIds = async (userEmail) => {
		try {
			const response = await getAllUserClass();
			if (response.success && response.data) {
				const userClasses = response.data.filter(uc =>
					uc.userAccess && uc.userAccess.includes(userEmail)
				);
				return userClasses.map(uc => uc.id);
			}
			return [];
		} catch (error) {
			console.error('Error finding userClasses:', error);
			return [];
		}
	};

	// Load user info and recent folders on component mount
	useEffect(() => {
		const loadUserInfoAndRecentFolders = async () => {
			try {
				// Get user info from currentUser context
				const userEmail = currentUser?.email;
				const isAdminUser = currentUser?.isAdmin || false;
				const isSuperAdminUser = currentUser?.isSuperAdmin || false;

				// Find all userClass IDs based on email and module
				let userClassIds = [];
				if (userEmail && !isAdminUser && !isSuperAdminUser) {
					const result = await findAllUserClassIds(userEmail);
					const userClassData = result.userClassData;

					// Filter only DASHBOARD module userClasses
					const dashboardUserClasses = userClassData.filter(uc => uc.module === 'DASHBOARD');
					userClassIds = dashboardUserClasses.map(uc => uc.id);
				}

				setUserClass(userClassIds);
				setIsAdmin(isAdminUser);
				setIsSuperAdmin(isSuperAdminUser);

				// Load recent folders based on user role
				if (isAdminUser || isSuperAdminUser) {
					// Admin can see all folders
					const response = await getAllRecentFolders();
					if (response.success) {
						setRecentFolders(response.data || []);
					}
				} else if (userClassIds.length > 0) {
					// Regular user can see folders for any of their userClasses
					// Pass all userClass IDs to get folders for all userClasses
					const response = await getRecentFoldersByUserClass(userClassIds);
					if (response.success) {
						setRecentFolders(response.data || []);
					}
				}
			} catch (error) {
				console.error('Error loading user info and recent folders:', error);
			}
		};

		loadUserInfoAndRecentFolders();
	}, [currentUser]);


	// Function to select recent folder
	const handleSelectRecentFolder = (folder) => {
		setSelectedRecentFolder(folder);
		handleConfigChange('googleDriveUrl', folder.link);
		message.success(`Đã chọn folder: ${folder.name}`);
	};

	// Function to refresh recent folders
	const refreshRecentFolders = async () => {
		try {
			if (currentUser?.isAdmin || currentUser?.isSuperAdmin) {
				const response = await getAllRecentFolders();
				if (response.success) {
					setRecentFolders(response.data || []);
				}
			} else if (currentUser?.email && !currentUser?.isAdmin && !currentUser?.isSuperAdmin) {
				// Find all userClass IDs based on email and module
				const result = await findAllUserClassIds(currentUser.email);
				const userClassData = result.userClassData;

				// Filter only DASHBOARD module userClasses
				const dashboardUserClasses = userClassData.filter(uc => uc.module === 'DASHBOARD');
				const userClassIds = dashboardUserClasses.map(uc => uc.id);

				if (userClassIds.length > 0) {
					// Pass all userClass IDs to get folders for all userClasses
					const response = await getRecentFoldersByUserClass(userClassIds);
					if (response.success) {
						setRecentFolders(response.data || []);
					}
				}
			}
		} catch (error) {
			console.error('Error refreshing recent folders:', error);
		}
	};

	// Function to load user classes for admin settings
	const loadUserClasses = async () => {
		try {
			const response = await getAllUserClass();
			const filteredData = response.filter(item => item.module === 'DASHBOARD');
			setUserClassList(filteredData || []);

		} catch (error) {
			console.error('Error loading user classes:', error);
		}
	};

	// Function to update folder userClass
	const handleUpdateFolderUserClass = async (folderId, newUserClass) => {
		try {
			console.log('Updating folder userClass:', { folderId, newUserClass });
			const response = await updateRecentFolder(folderId, { userClass: newUserClass });
			if (response.success) {
				message.success('Đã cập nhật userClass cho folder');
				await refreshRecentFolders();
				setEditingFolder(null);
			}
		} catch (error) {
			console.error('Error updating folder userClass:', error);
			message.error('Có lỗi khi cập nhật userClass');
		}
	};

	// Function to update folder name
	const handleUpdateFolderName = async (folderId, newName) => {
		try {
			const response = await updateRecentFolder(folderId, { name: newName });
			if (response.success) {
				message.success('Cập nhật tên folder thành công');
				// Refresh the recent folders list
				await refreshRecentFolders();
				// Reset editing state
				setEditingFolder(null);
				setEditingFolderName('');
			}
		} catch (error) {
			console.error('Error updating folder name:', error);
			message.error('Lỗi khi cập nhật tên folder');
		}
	};

	// Function to start editing folder name
	const handleStartEditFolderName = (folder) => {
		setEditingFolder(folder);
		setEditingFolderName(folder.name);
	};

	// Function to cancel editing
	const handleCancelEdit = () => {
		setEditingFolder(null);
		setEditingFolderName('');
	};

	useEffect(() => {
		setSelectedDriveFileId('')
	}, [isDriveFileModalVisible]);

	// Load user classes when settings modal opens
	useEffect(() => {
		if (isRecentFolderSettingsVisible && (currentUser?.isAdmin || currentUser?.isSuperAdmin)) {
			loadUserClasses();
		}
	}, [isRecentFolderSettingsVisible, currentUser]);
	// Helper: last day (DD) for month
	const getLastDayOfMonth = (year, month) => {
		try {
			return new Date(Number(year) || new Date().getFullYear(), month, 0).getDate();
		} catch (e) {
			return 30;
		}
	};

	// Fetch and transform HTQC Tổng quát
	const fetchHtqcTongQuat = useCallback(async () => {
		let data = await getAllSoKeToan();
		data = data.filter((e) => e.isUse && e.daHopNhat);
		if (String(currentCompanyKTQT || '').toLowerCase() === 'hq') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
		else data = data.filter((e) => e.company?.toLowerCase() === String(currentCompanyKTQT || '').toLowerCase());
		data = data.filter(e => currentYearKTQT === 'toan-bo' || e.year == currentYearKTQT);

		let kmfList = await getAllKmf();
		const uniqueKMF = kmfList.reduce((acc, current) => {
			if (!acc.find((unit) => unit.name === current.name)) acc.push(current);
			return acc;
		}, []);

		// Build summary-like dataset with months 1..12
		const rowData = calculateDataViewKQKDFS2(data, uniqueKMF, 12);
		const parents = (rowData || []).filter(r => !String(r.layer || '').includes('.'));
		const yearVal = currentYearKTQT === 'toan-bo' ? new Date().getFullYear() : Number(currentYearKTQT);

		const flat = [];
		parents.forEach((row) => {
			for (let m = 1; m <= 12; m++) {
				const amount = Number(row[`${m}`] || 0);
				flat.push({
					DD: getLastDayOfMonth(yearVal, m),
					MM: m,
					YYYY: yearVal,
					'Khoản mục': row.dp,
					'Số tiền': amount,
				});
			}
		});

		setHtqcData(flat);
		setHtqcColumns(['DD', 'MM', 'YYYY', 'Khoản mục', 'Số tiền']);

		// Cập nhật outputColumns thay vì lưu data vào config
		const outputColumns = ['DD', 'MM', 'YYYY', 'Khoản mục', 'Số tiền'].map(col => ({
			name: col,
			type: col === 'Số tiền' ? 'number' : 'text',
		}));
		handleConfigChange('outputColumns', outputColumns);
		handleConfigChange('htqcReportType', 'tong_quat');

		// Cập nhật dữ liệu HTQC vào config để truyền qua tempConfig
		handleConfigChange('htqcData', flat);
		handleConfigChange('htqcColumns', ['DD', 'MM', 'YYYY', 'Khoản mục', 'Số tiền']);
	}, [currentCompanyKTQT, currentYearKTQT, handleConfigChange]);

	// Fetch and transform HTQC Nhóm Đơn vị
	const fetchHtqcNhomDv = useCallback(async () => {
		let data = await getAllSoKeToan();
		data = data.filter((e) => e.isUse && e.daHopNhat);
		if (String(currentCompanyKTQT || '').toLowerCase() === 'hq') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
		else data = data.filter((e) => e.company?.toLowerCase() === String(currentCompanyKTQT || '').toLowerCase());
		data = data.filter(e => currentYearKTQT === 'toan-bo' || e.year == currentYearKTQT);

		let units = await getAllUnits();
		const uniqueUnits = units.reduce((acc, current) => {
			if (!acc.find((unit) => unit.code === current.code)) acc.push(current);
			return acc;
		}, []);

		let kmfList = await getAllKmf();
		kmfList = kmfList.reduce((acc, current) => {
			if (!acc.find((unit) => unit.name === current.name)) acc.push(current);
			return acc;
		}, []);

		let rowData = calculateDataView2(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams');
		const parents = (rowData || []).filter(r => !String(r.layer || '').includes('.'));
		const yearVal = currentYearKTQT === 'toan-bo' ? new Date().getFullYear() : Number(currentYearKTQT);

		const flat = [];
		parents.forEach((row) => {
			uniqueUnits.forEach((u) => {
				for (let m = 1; m <= 12; m++) {
					const key = `${u.code}_${m}`;
					const amount = Number(row[key] || 0);
					flat.push({
						DD: getLastDayOfMonth(yearVal, m),
						MM: m,
						YYYY: yearVal,
						'Đơn vị': u.code,
						'Nhóm đơn vị': u.group,
						'Khoản mục': row.dp,
						'Số tiền': amount,
					});
				}
			});
		});

		setHtqcData(flat);
		setHtqcColumns(['DD', 'MM', 'YYYY', 'Đơn vị', 'Nhóm đơn vị', 'Khoản mục', 'Số tiền']);

		// Cập nhật outputColumns thay vì lưu data vào config
		const outputColumns = ['DD', 'MM', 'YYYY', 'Đơn vị', 'Nhóm đơn vị', 'Khoản mục', 'Số tiền'].map(col => ({
			name: col,
			type: col === 'Số tiền' ? 'number' : 'text',
		}));
		handleConfigChange('outputColumns', outputColumns);
		handleConfigChange('htqcReportType', 'nhom_dv');

		// Cập nhật dữ liệu HTQC vào config để truyền qua tempConfig
		handleConfigChange('htqcData', flat);
		handleConfigChange('htqcColumns', ['DD', 'MM', 'YYYY', 'Đơn vị', 'Nhóm đơn vị', 'Khoản mục', 'Số tiền']);
	}, [currentCompanyKTQT, currentYearKTQT, handleConfigChange]);

	// Fetch and transform HTQC Nhóm Vụ việc
	const fetchHtqcNhomVv = useCallback(async () => {
		let data = await getAllSoKeToan();
		data = data.filter((e) => e.isUse && e.daHopNhat);
		if (String(currentCompanyKTQT || '').toLowerCase() === 'hq') data = data.filter((e) => e.consol?.toLowerCase() === 'consol');
		else data = data.filter((e) => e.company?.toLowerCase() === String(currentCompanyKTQT || '').toLowerCase());
		data = data.filter(e => currentYearKTQT === 'toan-bo' || e.year == currentYearKTQT);

		let projects = await getAllProject();
		const uniqueProjects = projects.reduce((acc, current) => {
			if (!acc.find((unit) => unit.code === current.code)) acc.push(current);
			return acc;
		}, []);

		let kmfList = await getAllKmf();
		kmfList = kmfList.reduce((acc, current) => {
			if (!acc.find((unit) => unit.name === current.name)) acc.push(current);
			return acc;
		}, []);

		let rowData = calculateDataView2(data, uniqueProjects, kmfList, 'code', 'project2', 'PBPROJECT', 'teams');
		const parents = (rowData || []).filter(r => !String(r.layer || '').includes('.'));
		const yearVal = currentYearKTQT === 'toan-bo' ? new Date().getFullYear() : Number(currentYearKTQT);

		const flat = [];
		parents.forEach((row) => {
			uniqueProjects.forEach((p) => {
				for (let m = 1; m <= 12; m++) {
					const key = `${p.code}_${m}`;
					const amount = Number(row[key] || 0);
					flat.push({
						DD: getLastDayOfMonth(yearVal, m),
						MM: m,
						YYYY: yearVal,
						'Vụ việc': p.code,
						'Nhóm vụ việc': p.group,
						'Khoản mục': row.dp,
						'Số tiền': amount,
					});
				}
			});
		});

		setHtqcData(flat);
		setHtqcColumns(['DD', 'MM', 'YYYY', 'Vụ việc', 'Nhóm vụ việc', 'Khoản mục', 'Số tiền']);

		// Cập nhật outputColumns thay vì lưu data vào config
		const outputColumns = ['DD', 'MM', 'YYYY', 'Vụ việc', 'Nhóm vụ việc', 'Khoản mục', 'Số tiền'].map(col => ({
			name: col,
			type: col === 'Số tiền' ? 'number' : 'text',
		}));
		handleConfigChange('outputColumns', outputColumns);
		handleConfigChange('htqcReportType', 'nhom_vv');

		// Cập nhật dữ liệu HTQC vào config để truyền qua tempConfig
		handleConfigChange('htqcData', flat);
		handleConfigChange('htqcColumns', ['DD', 'MM', 'YYYY', 'Vụ việc', 'Nhóm vụ việc', 'Khoản mục', 'Số tiền']);
	}, [currentCompanyKTQT, currentYearKTQT, handleConfigChange]);


	// Hàm cập nhật outputColumns cho aggregate
	const updateOutputColumns = useCallback(() => {


		if (config.excelProcessingMode === 'aggregate' && excelGroupBy.length > 0) {
			const validAggregations = excelAggregations.filter(agg => agg.column && agg.function);


			// Tạo groupBy columns
			const groupByColumns = excelGroupBy.map(col => ({
				name: col,
				type: 'text',
			}));

			// Tạo aggregation columns
			const aggregationColumns = validAggregations.map((agg, index) => {
				const columnName = agg.alias || `${agg.function}_${agg.column}`;

				return {
					name: columnName,
					type: 'number',
				};
			});

			// Kết hợp tất cả columns
			const outputColumns = [...groupByColumns, ...aggregationColumns];


			handleConfigChange('outputColumns', outputColumns);
		} else if (config.excelProcessingMode === 'normal') {
			console.log('Normal mode - updating outputColumns');
			// Cập nhật outputColumns cho mode normal
			if (importColumns.length > 0) {
				// Lấy cột được chọn hoặc tất cả cột
				const columnsToUse = getFilteredColumns(
					importColumns.map(col => String(typeof col === 'string' ? col : col.title || col.name)),
					selectedExcelColumns,
				);

				const normalColumns = columnsToUse.map(col => ({
					name: col,
					type: 'text',
				}));
				handleConfigChange('outputColumns', normalColumns);
			}
		}
		console.log('=== updateOutputColumns finished ===');
	}, [config.excelProcessingMode, excelGroupBy, excelAggregations, importColumns, selectedExcelColumns, handleConfigChange]);

	// Hàm cập nhật thông tin aggregate
	const updateAggregateInfo = useCallback(() => {
		if (config.excelProcessingMode === 'aggregate' && excelGroupBy.length > 0) {
			const validAggregations = excelAggregations.filter(agg => agg.column && agg.function);
			const info = {
				groupBy: excelGroupBy,
				aggregationCount: validAggregations.length,
				summary: `Nhóm theo: ${excelGroupBy.join(', ')} | ${validAggregations.length} phép tính`,
			};
			handleConfigChange('excelAggregateInfo', info);
		} else if (config.excelProcessingMode === 'normal') {
			handleConfigChange('excelAggregateInfo', null);
		}
	}, [config.excelProcessingMode, excelGroupBy, excelAggregations, handleConfigChange]);


	const addExcelAggregation = () => {
		const newAggregations = [...excelAggregations, { ...defaultAgg }];

		setExcelAggregations(newAggregations);
	};

	const removeExcelAggregation = (idx) => {
		const newAggregations = excelAggregations.filter((_, i) => i !== idx);
		setExcelAggregations(newAggregations);
	};

	const updateExcelAggregation = (idx, key, value) => {
		const newAggregations = excelAggregations.map((agg, i) =>
			i === idx ? { ...agg, [key]: value } : agg,
		);

		setExcelAggregations(newAggregations);
	};

	const getFunctionDescription = (functionType) => {
		const option = functionOptions.find(opt => opt.value === functionType);
		return option ? option.description : '';
	};

	// Helper function to filter data by selected columns
	const filterDataByColumns = (data, columns, selectedColumns) => {
		if (!data || data.length === 0) return data;
		if (!selectedColumns || selectedColumns.length === 0) return data;

		return data.map(row => {
			const filteredRow = {};
			selectedColumns.forEach(col => {
				if (row.hasOwnProperty(col)) {
					filteredRow[col] = row[col];
				}
			});
			return filteredRow;
		});
	};

	// Helper function to get filtered columns
	const getFilteredColumns = (allColumns, selectedColumns) => {
		if (!selectedColumns || selectedColumns.length === 0) return allColumns;
		return selectedColumns;
	};

	// Helper function to render column filter UI
	const renderColumnFilter = (availableColumns, selectedColumns, setSelectedColumns, uploadType) => {
		if (!availableColumns || availableColumns.length === 0) return null;

		return (
			<Card size="small" title="Lọc cột để import" style={{ marginTop: 16 }}>
				<Space direction="vertical" style={{ width: '100%' }}>
					<div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
						Chọn các cột bạn muốn import. Để trống để import tất cả cột.
					</div>

					<Select
						mode="multiple"
						placeholder="Chọn cột để import (để trống = tất cả cột)"
						value={selectedColumns}
						onChange={setSelectedColumns}
						style={{ width: '100%' }}
						showSearch
						filterOption={(input, option) =>
							option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
						}
						options={availableColumns.map(col => ({
							value: col,
							label: col,
						}))}
					/>

					<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
						<Button
							size="small"
							onClick={() => setSelectedColumns(availableColumns)}
						>
							Chọn tất cả
						</Button>
						<Button
							size="small"
							onClick={() => setSelectedColumns([])}
						>
							Bỏ chọn tất cả
						</Button>
						<Button
							size="small"
							onClick={() => setShowColumnFilter(false)}
						>
							Đóng
						</Button>
					</div>

					{selectedColumns.length > 0 && (
						<div style={{ fontSize: '12px', color: '#52c41a' }}>
							✓ Đã chọn {selectedColumns.length}/{availableColumns.length} cột
						</div>
					)}
				</Space>
			</Card>
		);
	};

	const validateExcelAggregateConfig = () => {
		if (!excelGroupBy || (Array.isArray(excelGroupBy) && excelGroupBy.length === 0)) {
			return 'Vui lòng chọn ít nhất một cột nhóm';
		}
		if (!excelAggregations.some(agg => agg.column && agg.function)) {
			return 'Vui lòng cấu hình ít nhất một aggregation';
		}
		return null;
	};

	// Hàm xử lý dữ liệu Excel với aggregate
	const processExcelDataWithAggregate = useCallback((data) => {


		if (config.excelProcessingMode !== 'aggregate') {

			return data;
		}

		const validAggregations = excelAggregations.filter(agg => agg.column && agg.function);

		if (validAggregations.length === 0) {
			// Chỉ có groupBy, không có aggregation - thực hiện groupBy đơn giản
			const groupedData = data.reduce((acc, row) => {
				const groupKey = excelGroupBy.map(col => row[col]).join('|');
				if (!acc[groupKey]) {
					acc[groupKey] = {};
					excelGroupBy.forEach(col => {
						acc[groupKey][col] = row[col];
					});
				}
				return acc;
			}, {});

			return Object.values(groupedData);
		}

		const aggregateConfig = {
			groupBy: excelGroupBy,
			aggregations: validAggregations,
		};


		try {
			const result = processAggregate(data, aggregateConfig);

			return result;
		} catch (error) {
			console.error('Lỗi khi xử lý aggregate:', error);
			message.error('Có lỗi khi xử lý nhóm dữ liệu');
			return data;
		}
	}, [config.excelProcessingMode, excelGroupBy, excelAggregations]);

	// Excel file upload handler
	const handleFileUpload = (file) => {
		setLoading(true);
		try {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const data = new Uint8Array(e.target.result);
					const workbook = XLSX.read(data, { type: 'array' });

					// Lưu trữ workbook và danh sách sheets
					setExcelWorkbook(workbook);
					const sheetNames = workbook.SheetNames;
					setExcelSheets(sheetNames.map(name => ({ value: name, label: name })));

					// Mặc định chọn sheet đầu tiên
					setSelectedSheet(sheetNames[0]);

					// Xử lý sheet đầu tiên để tạo header options
					const worksheet = workbook.Sheets[sheetNames[0]];
					let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

					if (jsonData.length > 0) {
						// Lưu trữ raw data


						// Tạo header options tương tự Google Sheets
						const options = [];
						const dataModified = []
						jsonData
							.filter(row => Array.isArray(row) && row.length > 0)
							.forEach((row, index) => {

								let hasData = false;
								let previewText = '';

								if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
									hasData = true;
									const previewValues = row.slice(0, 3).map(cell =>
										cell ? String(cell).trim().substring(0, 20) : '',
									).filter(val => val).join(', ');
									previewText = previewValues ? ` - ${previewValues}...` : '';
								}

								let label = `Hàng ${index + 1}`;
								if (hasData) {
									label += previewText;
								} else {
									label += ' (trống)';
								}

								options.push({
									value: index,
									label: label,
									disabled: false,
								});
								dataModified.push(row);
							});
						console.log('jsonData', dataModified);
						setExcelRawData(dataModified);
						setExcelHeaderOptions(options);

						// Khôi phục từ config hoặc mặc định chọn hàng 1 (index 0)
						const savedHeaderRow = config.excelHeaderRow;
						const savedSheet = config.excelSheet;

						if (savedSheet && sheetNames.includes(savedSheet)) {
							setSelectedSheet(savedSheet);
						}

						if (savedHeaderRow !== undefined && savedHeaderRow < dataModified.length) {
							setSelectedExcelHeaderRow(savedHeaderRow);
						} else {
							setSelectedExcelHeaderRow(0); // Mặc định chọn hàng đầu tiên
						}

						handleConfigChange('file', file);
						setIsExcelModalVisible(true);
					} else {
						throw new Error('File Excel không có dữ liệu');
					}
				} catch (error) {
					message.error(error.message || 'Có lỗi khi xử lý file');
					setLoading(false);
				}
			};
			reader.readAsArrayBuffer(file);
		} catch (error) {
			message.error('Có lỗi khi đọc file');
			setLoading(false);
		}
		return false;
	};

	// Google Sheets handler
	const handleFetchGgsData = async () => {
		if (!config.googleSheetUrl.trim()) {
			message.error('Vui lòng nhập URL Google Sheet!');
			return;
		}

		setGgsLoading(true);
		try {
			const res = await n8nWebhook({ urlSheet: config.googleSheetUrl, email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com' });
			console.log(res);
			if (Array.isArray(res) && res.length > 0 && res[0].rows) {
				// Lưu trữ dữ liệu mới từ n8n
				setRawGgsData(res[0].rows);

				// Lưu trữ headers metadata
				if (res[0].headers) {
					setGgsHeaders(res[0].headers);
				}

				const options = [];

				// Tìm hàng có dữ liệu đầu tiên để xác định header candidate
				const firstDataRowIndex = res[0].rows.findIndex(row =>
					row.data && row.data.some(cell => cell && cell.toString().trim() !== ''),
				);

				// Tạo options cho TẤT CẢ các hàng (bao gồm cả hàng trống) để user có thể chọn header
				res[0].rows.forEach((row, index) => {
					let hasData = false;
					let previewText = '';
					let isHeaderCandidate = false;

					// Kiểm tra xem hàng có dữ liệu không
					if (row.data && row.data.some(cell => cell && cell.toString().trim() !== '')) {
						hasData = true;
						// Lấy một vài giá trị đầu tiên để preview
						const previewValues = row.data.slice(0, 3).map(cell =>
							cell ? cell.toString().trim().substring(0, 20) : '',
						).filter(val => val).join(', ');
						previewText = previewValues ? ` - ${previewValues}...` : '';
					} else {
						// Kiểm tra xem có phải hàng header được phát hiện tự động không
						// Hoặc kiểm tra theo detectedHeaderRow
						// Hoặc là hàng trống ngay trước hàng có dữ liệu đầu tiên (có thể là header thực tế)
						const isDetectedHeader = row.isDetectedHeader || row.rowNumber === res[0].detectedHeaderRow;
						const isRowBeforeFirstData = firstDataRowIndex > 0 && index === firstDataRowIndex - 1;

						if ((isDetectedHeader || isRowBeforeFirstData) && res[0].headers && res[0].headers.length > 0) {
							isHeaderCandidate = true;
							const headerValues = res[0].headers.slice(0, 3).map(header =>
								header ? header.toString().trim().substring(0, 20) : '',
							).filter(val => val).join(', ');
							previewText = headerValues ? ` - ${headerValues}...` : '';
						}
					}

					// Thêm TẤT CẢ các hàng vào options để user có thể chọn bất kỳ hàng nào làm header
					let label = `Hàng ${row.rowNumber}`;

					if (hasData) {
						label += previewText;
					} else if (isHeaderCandidate) {
						label += previewText;
					} else {
						// Hàng trống - kiểm tra xem có thể là header không
						if (res[0].headers && res[0].headers.length > 0) {
							const headerValues = res[0].headers.slice(0, 3).map(header =>
								header ? header.toString().trim().substring(0, 20) : '',
							).filter(val => val).join(', ');
							label += ` (trống) - có thể chọn làm header: ${headerValues}...`;
						} else {
							label += ' (trống)';
						}
					}

					options.push({
						value: index, // Sử dụng index trong mảng để làm value
						label: label,
						disabled: false,
					});
				});

				setHeaderOptions(options);

				// Khôi phục selectedHeaderRow từ config hoặc sử dụng header được phát hiện tự động
				const savedHeaderRow = config.googleSheetsHeaderRow;
				const detectedHeaderRow = res[0].detectedHeaderRow;

				if (savedHeaderRow) {
					// Tìm index của hàng có rowNumber tương ứng
					const headerIndex = res[0].rows.findIndex(row => row.rowNumber === savedHeaderRow);
					if (headerIndex >= 0) {
						setSelectedHeaderRow(headerIndex);
					} else {
						// Fallback: chọn header được phát hiện hoặc hàng trước hàng có dữ liệu đầu tiên
						const detectedIndex = res[0].rows.findIndex(row => row.rowNumber === detectedHeaderRow);
						const beforeFirstDataIndex = firstDataRowIndex > 0 ? firstDataRowIndex - 1 : 0;
						setSelectedHeaderRow(detectedIndex >= 0 ? detectedIndex : beforeFirstDataIndex);
					}
				} else if (detectedHeaderRow) {
					// Sử dụng hàng header được phát hiện tự động
					const headerIndex = res[0].rows.findIndex(row => row.rowNumber === detectedHeaderRow);
					if (headerIndex >= 0) {
						setSelectedHeaderRow(headerIndex);
					} else {
						// Fallback: chọn hàng trước hàng có dữ liệu đầu tiên
						setSelectedHeaderRow(firstDataRowIndex > 0 ? firstDataRowIndex - 1 : 0);
					}
				} else {
					// Mặc định chọn hàng 2 (thường là vị trí header thực tế)
					// Nếu không có hàng 2, chọn hàng trước hàng có dữ liệu đầu tiên
					const row2Index = res[0].rows.findIndex(row => row.rowNumber === 2);
					if (row2Index >= 0) {
						setSelectedHeaderRow(row2Index);
					} else {
						const defaultHeaderIndex = firstDataRowIndex > 0 ? firstDataRowIndex - 1 : 0;
						setSelectedHeaderRow(defaultHeaderIndex);
					}
				}

				setIsModalVisible(true);
			} else {
				message.error('Không lấy được dữ liệu từ Google Sheet!');
			}
		} catch (error) {
			message.error('Có lỗi khi lấy dữ liệu từ Google Sheet!');
		} finally {
			setGgsLoading(false);
		}
	};

	const handleHeaderRowSelect = (value) => {
		setSelectedHeaderRow(value);
	};

	// Handler for Excel sheet selection
	const handleExcelSheetSelect = (sheetName) => {
		setSelectedSheet(sheetName);

		if (excelWorkbook && excelWorkbook.Sheets[sheetName]) {
			const worksheet = excelWorkbook.Sheets[sheetName];
			const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

			// Cập nhật raw data cho sheet mới
			setExcelRawData(jsonData);

			// Tạo lại header options cho sheet mới
			const options = [];
			jsonData.forEach((row, index) => {
				let hasData = false;
				let previewText = '';

				if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
					hasData = true;
					const previewValues = row.slice(0, 3).map(cell =>
						cell ? String(cell).trim().substring(0, 20) : '',
					).filter(val => val).join(', ');
					previewText = previewValues ? ` - ${previewValues}...` : '';
				}

				let label = `Hàng ${index + 1}`;
				if (hasData) {
					label += previewText;
				} else {
					label += ' (trống)';
				}

				options.push({
					value: index,
					label: label,
					disabled: false,
				});
			});

			setExcelHeaderOptions(options);

			// Reset header row selection về 0
			setSelectedExcelHeaderRow(0);
		}
	};

	// Handler for Excel header row selection
	const handleExcelHeaderRowSelect = (value) => {
		setSelectedExcelHeaderRow(value);
	};

	// Handler for Excel modal OK button
	const handleExcelModalOk = async () => {
		if (!excelWorkbook || !selectedSheet || selectedExcelHeaderRow < 0) {
			message.error('Vui lòng chọn sheet và hàng header hợp lệ!');
			return;
		}

		try {
			const worksheet = excelWorkbook.Sheets[selectedSheet];
			const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

			if (selectedExcelHeaderRow >= jsonData.length) {
				message.error('Hàng header được chọn không tồn tại!');
				return;
			}

			// Lấy header từ hàng được chọn
			const headerRow = jsonData[selectedExcelHeaderRow];


			if (!headerRow || headerRow.length === 0) {
				message.error('Hàng header được chọn không có dữ liệu!');
				return;
			}

			// Tạo header indices từ hàng được chọn
			const headerIndices = headerRow.reduce((acc, header, index) => {
				if (header !== null && header !== undefined && header !== '') {
					const headerStr = String(header).trim();
					if (headerStr !== '') {
						acc.push({ header: headerStr, index });
					}
				}
				return acc;
			}, []);

			if (headerIndices.length === 0) {
				message.error('Hàng header được chọn không có tiêu đề cột hợp lệ');
				return;
			}

			// Kiểm tra giới hạn số cột
			const columnCheck = await checkColumnLimit(headerIndices.map(({ header }) => String(header)));
			if (!columnCheck.isValid) {
				message.error(columnCheck.message);
				setIsExcelModalVisible(false);
				setLoading(false);
				return;
			}

			// Lấy dữ liệu từ các hàng sau header
			const dataRows = jsonData.slice(selectedExcelHeaderRow + 1);
			const rows = dataRows.filter(row => Array.isArray(row) && row.length > 0).map((row) => {

				const rowData = {};
				headerIndices.forEach(({ header, index }) => {
					rowData[header] = row[index] !== undefined ? row[index] : null;
				});
				return rowData;
			});

			// Cập nhật state
			const allColumns = headerIndices.map(({ header }) => ({
				title: String(header),
				dataIndex: String(header),
				key: String(header),
			}));
			setImportColumns(allColumns);

			// Lọc dữ liệu theo cột được chọn
			const filteredRows = filterDataByColumns(rows, headerIndices.map(({ header }) => String(header)), selectedExcelColumns);


			// Xử lý aggregate nếu cần
			let finalData;
			if (config.excelProcessingMode === 'aggregate' && excelGroupBy.length > 0) {
				finalData = processExcelDataWithAggregate(filteredRows);
			} else {
				finalData = filteredRows;
			}

			// Kiểm tra giới hạn số dòng
			const limitCheck = await checkUploadLimits(
				headerIndices.map(({ header }) => String(header)),
				finalData
			);
			if (!limitCheck.isValid) {
				message.error(limitCheck.message);
				setIsExcelModalVisible(false);
				setLoading(false);
				return;
			}
			setImportedData(filteredRows);
			setProcessedData(finalData);

			// Lưu vào config
			const columnsToSave = getFilteredColumns(headerIndices.map(({ header }) => String(header)), selectedExcelColumns);
			handleConfigChange('excelData', finalData);
			handleConfigChange('excelColumns', columnsToSave);
			handleConfigChange('excelSheet', selectedSheet);
			handleConfigChange('excelHeaderRow', selectedExcelHeaderRow);

			// Cập nhật outputColumns
			updateOutputColumns();

			setIsExcelModalVisible(false);
			setLoading(false);
			message.success(`Đã tải ${rows.length} dòng dữ liệu từ sheet "${selectedSheet}"!`);
		} catch (error) {
			message.error(error.message || 'Có lỗi khi xử lý dữ liệu Excel');
			setLoading(false);
		}
	};

	const handleModalOk = async () => {
		// Kiểm tra xem selectedHeaderRow có hợp lệ không
		if (selectedHeaderRow < 0) {
			message.error('Hàng header được chọn không hợp lệ!');
			return;
		}

		// Lấy hàng header được chọn từ rawGgsData
		const selectedRow = rawGgsData[selectedHeaderRow];
		if (!selectedRow) {
			message.error('Hàng header được chọn không tồn tại!');
			return;
		}

		// Lấy dữ liệu từ hàng được chọn làm header
		let headerRow = selectedRow.data;

		// Kiểm tra xem header row có dữ liệu không
		if (!headerRow || headerRow.length === 0 || headerRow.every(cell => !cell || cell.toString().trim() === '')) {
			// Nếu hàng được chọn trống, sử dụng headers metadata từ n8n
			if (ggsHeaders && ggsHeaders.length > 0) {
				headerRow = ggsHeaders;
				console.log('Sử dụng headers từ metadata:', headerRow);
			} else {
				// Fallback: tạo tên cột mặc định
				const maxColumns = Math.max(...rawGgsData.map(row => row.data ? row.data.length : 0));
				headerRow = Array.from({ length: maxColumns }, (_, index) => `Cột ${index + 1}`);
				console.log('Sử dụng tên cột mặc định:', headerRow);
			}
		} else {
			console.log('Sử dụng dữ liệu từ hàng được chọn:', headerRow);
		}

		// Lấy dữ liệu từ các hàng sau header row được chọn
		// Chỉ lấy những hàng có dữ liệu thực tế
		const data = rawGgsData
			.slice(selectedHeaderRow + 1)
			.filter(row => row.data && row.data.some(cell => cell && cell.toString().trim() !== '')) // Chỉ lấy hàng có dữ liệu
			.map(row => {
				const newRow = {};
				headerRow.forEach((header, index) => {
					// Kiểm tra xem row có đủ phần tử không
					if (row.data && row.data[index] !== undefined) {
						newRow[header] = row.data[index];
					} else {
						newRow[header] = null; // hoặc '' tùy theo yêu cầu
					}
				});
				return newRow;
			});

		// Lọc dữ liệu theo cột được chọn
		const filteredData = filterDataByColumns(data, headerRow, selectedGgsColumns);
		const columnsToUse = getFilteredColumns(headerRow, selectedGgsColumns);

		// Kiểm tra giới hạn upload
		const limitCheck = await checkUploadLimits(columnsToUse.map(col => col.name), filteredData);
		if (!limitCheck.isValid) {
			message.error(limitCheck.message);
			setIsModalVisible(false);
			return;
		}

		setGgsData(filteredData);
		setGgsColumns(columnsToUse);
		setGgsStep('preview');
		setIsModalVisible(false);

		// Update config

		handleConfigChange('googleSheetsData', filteredData);
		handleConfigChange('googleSheetsColumns', columnsToUse);
		handleConfigChange('googleSheetsHeaderRow', selectedRow.rowNumber); // Lưu số hàng thực tế được chọn
	};

	// Google Drive handler
	const handleFetchDriveData = async () => {
		if (!config.googleDriveUrl.trim()) {
			message.error('Vui lòng nhập URL Google Drive!');
			return;
		}

		// Save folder URL for later reference
		handleConfigChange('googleDriveFolderUrl', config.googleDriveUrl);

		setDriveLoading(true);
		try {
			// New step: list files from Google Drive folder URL
			const res = await n8nWebhookGetFileFromGoogleDrive({ googleDriveUrl: config.googleDriveUrl, email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com' });
			if (res && res.success && Array.isArray(res.n8nResponse)) {
				setDriveFileList(res.n8nResponse);
		
					setIsDriveFileModalVisible(true);
			
			} else {
				message.error(res?.message || 'Không thể lấy danh sách file từ Google Drive');
			}
		} catch (error) {
			message.error('Có lỗi khi lấy dữ liệu từ Google Drive!');
		} finally {
			setDriveLoading(false);
		}
	};

	// Google Drive sheet selection handler
	const handleDriveSheetSelect = (sheetName) => {
		setSelectedDriveSheet(sheetName);
		// Load matrix for the selected sheet if available
		if (driveSheetsMap && driveSheetsMap[sheetName] && Array.isArray(driveSheetsMap[sheetName].data)) {
			const matrix = driveSheetsMap[sheetName].data;
			setDriveRawData(matrix);
			setSelectedDriveHeaderRow(0);
		}
		// If no map (older flow), keep current behavior
	};

	// Google Drive header row selection handler
	const handleDriveHeaderRowSelect = (rowIndex) => {
		setSelectedDriveHeaderRow(rowIndex);
	};

	// Google Drive modal OK handler
	const handleDriveModalOk = async () => {
		if (!driveRawData || driveRawData.length === 0) {
			message.error('Không có dữ liệu để xử lý!');
			return;
		}

		try {
			// Check if data is in XLSX object format (not matrix). Must be plain object with keys like "1" or "__EMPTY"
			const isXlsxFormat = (
				driveRawData[0] &&
				!Array.isArray(driveRawData[0]) &&
				typeof driveRawData[0] === 'object' &&
				Object.keys(driveRawData[0]).some(key => key.startsWith('__EMPTY') || /^\d+$/.test(key))
			);

			let processedData, headers, columns;

			if (isXlsxFormat) {
				// Handle XLSX format: use keys for row 0, values for other rows as column names
				const headerRow = driveRawData[selectedDriveHeaderRow];
				// Include the header row itself in data processing
				const dataRows = driveRawData.slice(selectedDriveHeaderRow);

				// Extract column keys from the selected row (keep ALL original keys including empty ones)
				const columnKeys = Object.keys(headerRow); // Don't filter, keep all keys including empty ones

				let columnNames;
				if (selectedDriveHeaderRow === 0) {
					// Row 0: use original keys as column names
					columnNames = columnKeys;
				} else {
					// Other rows: use values from the previous row as column names
					const previousRow = driveRawData[selectedDriveHeaderRow - 1];
					columnNames = Object.values(previousRow);
				}

				// Create processed data (skip header row, data starts from row 2)
				processedData = dataRows.slice(1).map(row => {
					const obj = {};
					columnKeys.forEach((key, index) => {
						// Use column names as property names
						const columnName = columnNames[index] || key;
						obj[columnName] = row[key] || '';
					});
					return obj;
				});

				// Create columns with appropriate names
				columns = columnNames.map((name, index) => ({
					name: name || columnKeys[index],
					type: 'text'
				}));
			} else {
				// Handle regular array format (matrix)
				headers = driveRawData[selectedDriveHeaderRow] || [];
				// Normalize headers to strings and ensure uniqueness
				const seen = new Map();
				const normalizedHeaders = headers.map((h, idx) => {
					let name = (h === null || h === undefined || String(h).trim() === '') ? `Cột ${idx + 1}` : String(h);
					if (!seen.has(name)) {
						seen.set(name, 1);
						return name;
					}
					const count = seen.get(name) + 1;
					seen.set(name, count);
					return `${name}_${count}`;
				});
				// Include rows after header
				const rows = driveRawData.slice(selectedDriveHeaderRow + 1);
				processedData = rows.map(row => {
					const obj = {};
					normalizedHeaders.forEach((header, index) => {
						obj[header] = Array.isArray(row) ? (row[index] ?? '') : '';
					});
					return obj;
				});
				columns = normalizedHeaders.map(h => ({ name: h, type: 'text' }));
			}

			// Kiểm tra giới hạn upload
			const columnNames = columns.map(col => col.name);
			const limitCheck = await checkUploadLimits(columnNames, processedData);
			if (!limitCheck.isValid) {
				message.error(limitCheck.message);
				setIsDriveModalVisible(false);
				return;
			}

			setDriveData(processedData);
			setDriveColumns(columns);
			setHiddenDriveColumns([]); // Show all columns by default
			setDriveStep('preview');
			setIsDriveModalVisible(false);
			// Update config
			handleConfigChange('googleDriveData', processedData);
			handleConfigChange('googleDriveColumns', columns);
			handleConfigChange('googleDriveSheet', selectedDriveSheet);
			handleConfigChange('googleDriveHeaderRow', selectedDriveHeaderRow);
			// Also persist folder link, selected file name and file ID (if available)
			handleConfigChange('googleDriveFolderUrl', config.googleDriveUrl);
			handleConfigChange('googleDriveSelectedFileName', config.googleDriveSelectedFileName || '');
			handleConfigChange('googleDriveFileId', config.googleDriveFileId || '');



			message.success(`Đã xử lý thành công ${processedData.length} dòng dữ liệu`);
		} catch (error) {
			console.error('Lỗi khi xử lý dữ liệu:', error);
			message.error('Có lỗi khi xử lý dữ liệu');
		}
	};

	// PostgreSQL connection handler
	const handlePostgresConnection = async () => {
		if (!connectionInfo.host.trim() || !connectionInfo.user.trim() || !connectionInfo.password.trim()) {
			message.error('Vui lòng nhập đầy đủ thông tin kết nối!');
			return;
		}

		setConnectionLoading(true);
		try {
			// Sử dụng endpoint kiểm tra kết nối với gợi ý
			const checkResult = await postgresService.checkConnection({
				host: connectionInfo.host,
				port: connectionInfo.port || '5432',
				user: connectionInfo.user,
				password: connectionInfo.password,
			});


			if (checkResult.success) {
				// Nếu kiểm tra thành công, thử kết nối thực tế
				const result = await postgresService.connect({
					host: connectionInfo.host,
					port: connectionInfo.port || '5432',
					user: connectionInfo.user,
					password: connectionInfo.password,
				});

				if (result.success) {
					message.success(`Kết nối PostgreSQL thành công! (${checkResult.connectionType})`);
					setShowPostgresExplorer(true);
				} else {
					message.error(result.message || 'Kết nối PostgreSQL thất bại!');
				}
			} else {
				// Hiển thị lỗi với gợi ý
				let errorMessage = checkResult.message;
				if (checkResult.suggestions && checkResult.suggestions.length > 0) {
					errorMessage += '\n\nGợi ý:\n' + checkResult.suggestions.join('\n');
				}

				message.error(errorMessage);

				// Log chi tiết để debug
				console.error('Chi tiết lỗi kết nối:', checkResult);
			}
		} catch (error) {
			console.error('Lỗi khi kết nối PostgreSQL:', error);
			message.error('Có lỗi khi kết nối PostgreSQL!');
		} finally {
			setConnectionLoading(false);
		}
	};

	// Get schemas when database is selected
	const handleDatabaseSelect = async (database) => {
		setSelectedDatabase(database);
		setSelectedSchema('');
		setSelectedTable('');
		setSchemas([]);
		setTables([]);

		try {
			const res = await n8nWebhook({
				postgresGetSchemas: {
					host: connectionInfo.host,
					port: connectionInfo.port || '5432',
					user: connectionInfo.user,
					password: connectionInfo.password,
					database: database,
				},
			});

			if (res && res.success) {
				setSchemas(res.schemas || []);
				setPostgresStep('schema');
			} else {
				message.error(res?.message || 'Không thể lấy danh sách schema!');
			}
		} catch (error) {
			console.error('Lỗi khi lấy danh sách schema:', error);
			message.error('Có lỗi khi lấy danh sách schema!');
		}
	};

	// Get tables when schema is selected
	const handleSchemaSelect = async (schema) => {
		setSelectedSchema(schema);
		setSelectedTable('');
		setTables([]);

		try {
			const res = await n8nWebhook({
				postgresGetTables: {
					host: connectionInfo.host,
					port: connectionInfo.port || '5432',
					user: connectionInfo.user,
					password: connectionInfo.password,
					database: selectedDatabase,
					schema: schema,
				},
			});

			if (res && res.success) {
				setTables(res.tables || []);
				setPostgresStep('table');
			} else {
				message.error(res?.message || 'Không thể lấy danh sách bảng!');
			}
		} catch (error) {
			console.error('Lỗi khi lấy danh sách bảng:', error);
			message.error('Có lỗi khi lấy danh sách bảng!');
		}
	};

	// Handle table selection from PostgresExplorer
	const handleTableSelectFromExplorer = async (tableInfo) => {
		setSelectedDatabase(tableInfo.database);
		setSelectedSchema(tableInfo.schema);
		setSelectedTable(tableInfo.table);
		setShowPostgresExplorer(false);

		// Load data from selected table
		setPostgresLoading(true);
		try {
			// Sử dụng connectionInfo từ tableInfo nếu có, hoặc từ state
			const connectionInfoToUse = tableInfo.connectionInfo || connectionInfo;

			// Cập nhật connection info với database mới
			const newConnectionInfo = {
				...connectionInfoToUse,
				database: tableInfo.database,
				schema: tableInfo.schema,
				table: tableInfo.table,
			};

			const data = await postgresService.getTableData(newConnectionInfo);

			if (Array.isArray(data) && data.length > 0) {
				// Lấy columns từ object đầu tiên
				const allColumns = Object.keys(data[0]);

				// Lọc dữ liệu theo cột được chọn
				const filteredData = filterDataByColumns(data, allColumns, selectedPostgresColumns);
				const columnsToUse = getFilteredColumns(allColumns, selectedPostgresColumns);

				// Kiểm tra giới hạn upload
				const limitCheck = await checkUploadLimits(columnsToUse.map(col => col.name), filteredData);
				if (!limitCheck.isValid) {
					message.error(limitCheck.message);
					setPostgresLoading(false);
					setShowPostgresExplorer(false);
					return;
				}

				setPostgresData(filteredData);
				setPostgresColumns(columnsToUse);
				setPostgresStep('preview');

				// Cập nhật config với thông tin PostgreSQL
				const newConfig = {
					...config,
					uploadType: 'postgresql',
					postgresConfig: {
						host: connectionInfoToUse.host,
						port: connectionInfoToUse.port || '5432',
						user: connectionInfoToUse.user,
						password: connectionInfoToUse.password,
						database: tableInfo.database,
						schema: tableInfo.schema,
						table: tableInfo.table,
					},
					postgresData: filteredData,
					postgresColumns: columnsToUse,
				};

				setConfig(newConfig);
				onChange(newConfig);

				message.success(`Đã lấy được ${data.length} dòng dữ liệu từ PostgreSQL`);
			} else {
				message.error('Không lấy được dữ liệu từ bảng!');
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu từ PostgreSQL:', error);
			message.error('Có lỗi khi lấy dữ liệu từ PostgreSQL!');
		} finally {
			setPostgresLoading(false);
		}
	};

	// API Connector handler
	const handleApiFetch = async () => {
		if (!config.apiUrl?.trim()) {
			message.error('Vui lòng nhập URL API!');
			return;
		}

		setApiLoading(true);
		try {
			const headers = {};
			if (config.apiKey?.trim()) {
				headers['Authorization'] = `Bearer ${config.apiKey}`;
			}

			const response = await fetch(config.apiUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...headers,
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			// Kiểm tra xem data có phải là array không
			let processedData = data;
			if (Array.isArray(data)) {
				processedData = data;
			} else if (data.data && Array.isArray(data.data)) {
				processedData = data.data;
			} else if (data.results && Array.isArray(data.results)) {
				processedData = data.results;
			} else if (data.items && Array.isArray(data.items)) {
				processedData = data.items;
			} else {
				// Nếu không phải array, chuyển thành array với 1 object
				processedData = [data];
			}

			if (processedData.length > 0) {
				const allColumns = Object.keys(processedData[0]);

				// Lọc dữ liệu theo cột được chọn
				const filteredData = filterDataByColumns(processedData, allColumns, selectedApiColumns);
				const columnsToUse = getFilteredColumns(allColumns, selectedApiColumns);

				// Kiểm tra giới hạn upload
				const limitCheck = await checkUploadLimits(columnsToUse.map(col => col.name), filteredData);
				if (!limitCheck.isValid) {
					message.error(limitCheck.message);
					setApiLoading(false);
					return;
				}

				setApiData(filteredData);
				setApiColumns(columnsToUse);
				setApiStep('preview');

				// Cập nhật config với thông tin API
				const newConfig = {
					...config,
					uploadType: 'api',
					apiData: filteredData,
					apiColumns: columnsToUse,
				};

				setConfig(newConfig);
				onChange(newConfig);

				message.success(`Đã lấy được ${processedData.length} dòng dữ liệu từ API`);
			} else {
				message.error('Không lấy được dữ liệu từ API!');
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu từ API:', error);
			message.error(`Có lỗi khi lấy dữ liệu từ API: ${error.message}`);
		} finally {
			setApiLoading(false);
		}
	};

	// Get data when table is selected (legacy function)
	const handleTableSelect = async (table) => {
		setSelectedTable(table);
		setPostgresLoading(true);

		try {
			const res = await n8nWebhook({
				getDataFromPostgres: {
					host: connectionInfo.host,
					port: connectionInfo.port || '5432',
					user: connectionInfo.user,
					password: connectionInfo.password,
					database: selectedDatabase,
					schema: selectedSchema,
					table: table,
				},
			});

			if (Array.isArray(res) && res.length > 0) {
				// Lấy columns từ object đầu tiên
				const columns = Object.keys(res[0]);
				setPostgresData(res);
				setPostgresColumns(columns);
				setPostgresStep('preview');

				// Cập nhật config với thông tin PostgreSQL
				const newConfig = {
					...config,
					uploadType: 'postgresql',
					postgresConfig: {
						host: connectionInfo.host,
						port: connectionInfo.port || '5432',
						user: connectionInfo.user,
						password: connectionInfo.password,
						database: selectedDatabase,
						schema: selectedSchema,
						table: table,
					},
					postgresData: res,
					postgresColumns: Object.keys(res[0]),
				};

				setConfig(newConfig);
				onChange(newConfig);

				message.success(`Đã lấy được ${res.length} dòng dữ liệu từ PostgreSQL`);
			} else {
				message.error('Không lấy được dữ liệu từ bảng!');
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu từ PostgreSQL:', error);
			message.error('Có lỗi khi lấy dữ liệu từ PostgreSQL!');
		} finally {
			setPostgresLoading(false);
		}
	};

	// Hàm xử lý save cho từng loại upload - đã chuyển sang PipelineSteps
	const handleSaveData = async () => {
		if (!templateData?.id) {
			message.error('Không tìm thấy template');
			return false;
		}

		console.log('handleSaveData - config.uploadType:', config.uploadType);
		console.log('handleSaveData - htqcData.length:', htqcData.length);

		// Chuẩn bị config với dữ liệu để truyền cho PipelineSteps
		const uploadConfigWithData = {
			...config,
			excelData: processedData.length > 0 ? processedData : importedData, // Sử dụng dữ liệu đã xử lý nếu có
			// Lưu excelColumns vào config để giữ thứ tự cột
			excelColumns: importColumns.map(col => String(col.title)),
			googleSheetsData: ggsData,
			googleSheetsColumns: ggsColumns,
			googleDriveData: driveData,
			googleDriveColumns: driveColumns,
			// Google Drive Folder data
			googleDriveFolderData: googleDriveFolderData,
			googleDriveFolderColumns: googleDriveFolderColumns,
			// PostgreSQL data đã được cập nhật vào config thông qua onChange
			// API data đã được cập nhật vào config thông qua onChange
			// System Import data đã được cập nhật vào config thông qua onChange
		};

		// Nếu là Google Drive Folder và đã có columns, tạo outputColumns để bước sau lưu vào step
		if (config.uploadType === 'googleDriveFolder' && Array.isArray(googleDriveFolderColumns) && googleDriveFolderColumns.length > 0) {
			uploadConfigWithData.outputColumns = googleDriveFolderColumns.map(h => ({ name: String(h), type: 'text' }));
		}

		// Nếu là HTQC, chỉ truyền dữ liệu tạm thời để lưu (không lưu vào config)
		if (config.uploadType === 'htqc') {
			console.log('HTQC Debug - htqcData length:', htqcData.length);
			console.log('HTQC Debug - htqcData:', htqcData);
			console.log('HTQC Debug - config.outputColumns:', config.outputColumns);

			if (htqcData.length > 0) {
				uploadConfigWithData.excelData = htqcData;
				uploadConfigWithData.excelColumns = htqcColumns;
				uploadConfigWithData.htqcReportType = htqcReportType;
				// Truyền outputColumns đã được tạo sẵn
				uploadConfigWithData.outputColumns = config.outputColumns;
			} else {
				console.error('HTQC Error - No data to save. htqcData is empty.');
				message.error('Chưa có dữ liệu HTQC. Vui lòng chọn loại báo cáo và nhấn "Lấy dữ liệu" trước khi lưu.');
				return false;
			}
		}

		// Đảm bảo uploadType được set đúng dựa trên dữ liệu có sẵn
		if (!uploadConfigWithData.uploadType) {
			if (importedData.length > 0) {
				uploadConfigWithData.uploadType = 'excel';
			} else if (ggsData.length > 0) {
				uploadConfigWithData.uploadType = 'googleSheets';
			} else if (driveData.length > 0) {
				uploadConfigWithData.uploadType = 'googleDrive';
			} else if (googleDriveFolderData.length > 0) {
				uploadConfigWithData.uploadType = 'googleDriveFolder';
			} else if (uploadConfigWithData.postgresData && uploadConfigWithData.postgresData.length > 0) {
				uploadConfigWithData.uploadType = 'postgresql';
			} else if (uploadConfigWithData.apiData && uploadConfigWithData.apiData.length > 0) {
				uploadConfigWithData.uploadType = 'api';
			} else if (uploadConfigWithData.systemData && uploadConfigWithData.systemData.length > 0) {
				uploadConfigWithData.uploadType = 'system';
			}
		}

		// Xử lý Google Drive Folder config
		if (config.uploadType === 'googleDriveFolder') {
			if (googleDriveFolderData.length === 0) {
				message.error('Chưa có dữ liệu Google Drive Folder. Vui lòng nhấn "Cập nhật ngay" trước khi lưu.');
				return false;
			}

			// Thêm config cho Google Drive Folder
			uploadConfigWithData.googleDriveFolderUrl = googleDriveFolderUrl;
			uploadConfigWithData.fileNameCondition = fileNameCondition;
			uploadConfigWithData.lastUpdateCondition = lastUpdateCondition;
			uploadConfigWithData.frequencyHours = frequencyHours;
			uploadConfigWithData.isFrequencyActive = isFrequencyActive;
			uploadConfigWithData.headerRow = headerRow - 1; // Chuyển từ 1-based sang 0-based
			uploadConfigWithData.mergeColumns = mergeColumns;
			uploadConfigWithData.removeDuplicateColumns = removeDuplicateColumns;
			uploadConfigWithData.sortColumns = sortColumns;

			// Lưu frequency config nếu được bật
			if (isFrequencyActive && templateData?.id) {
				try {
					const frequencyConfig = {
						frequency_hours: frequencyHours,
						is_active: isFrequencyActive,
						config: {
							googleDriveFolderUrl,
							fileNameCondition,
							lastUpdateCondition,
							headerRow: headerRow - 1, // Chuyển từ 1-based sang 0-based
							mergeColumns,
							removeDuplicateColumns,
							sortColumns
						},
						created_by: currentUser?.email || null
					};

					await createFrequencyConfig({
						tableId: templateData.id,
						config: frequencyConfig,
						schema: currentSchemaPathRecord?.path
					});
				} catch (error) {
					console.error('Error saving frequency config:', error);
					message.warning('Đã lưu dữ liệu nhưng không thể lưu cấu hình tự động cập nhật');
				}
			}
		}

		// Nếu được cung cấp hàm lưu từ parent thì gọi, ngược lại trả về cấu hình đã chuẩn bị
		if (onSaveData) {
			console.log('UploadConfig - Calling onSaveData with:', uploadConfigWithData);
			return await onSaveData(uploadConfigWithData, currentStepId);
		}

		return uploadConfigWithData;
	};

	// Hàm render cấu hình aggregate cho Excel
	const renderExcelAggregateConfig = () => {
		const error = validateExcelAggregateConfig();
		const availableColumns = importColumns.map(col => String(col.title));


		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 400 }}>
				{error && (
					<Alert
						message="Cấu hình chưa hoàn chỉnh"
						description={error}
						type="warning"
						showIcon
						style={{ marginBottom: 8 }}
					/>
				)}

				<Card size="small" title="Cấu hình nhóm dữ liệu" style={{ marginBottom: 8 }}>
					<Form.Item label="Nhóm theo cột" required>
						<Select
						   virtual={false}
							mode="multiple"
							placeholder="Chọn cột để nhóm dữ liệu (có thể chọn nhiều cột)"
							value={excelGroupBy}
							onChange={(value) => {
								setExcelGroupBy(value);

								if (config.excelProcessingMode === 'aggregate' && value.length > 0 && importedData?.length > 0) {

									const finalData = processExcelDataWithAggregate(importedData);
									setProcessedData(finalData);
									handleConfigChange('excelData', finalData);
								} else {
									console.log('Skipping processExcelDataWithAggregate from groupBy onChange');
								}
							}}
							style={{ width: '100%' }}
							showSearch
							filterOption={(input, option) =>
								option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
							}
						>
							{availableColumns
								// Ẩn các cột đã được chọn trong Cấu hình tính toán
								.filter(col => !excelAggregations.some(agg => agg.column === col))
								.map(col => (
									<Option key={col} value={col}>{col}</Option>
								))}
						</Select>
						{excelGroupBy && excelGroupBy.length > 0 && (
							<div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
								Sẽ nhóm
								theo: <strong>{Array.isArray(excelGroupBy) ? excelGroupBy.join(' → ') : excelGroupBy}</strong>
							</div>
						)}
					</Form.Item>
				</Card>

				<Card size="small" title="Cấu hình tính toán" extra={
					<>
						<Button
							type="dashed"
							icon={<PlusOutlined />}
							onClick={addExcelAggregation}
							size="small"
						>
							Thêm tính toán
						</Button>


					</>
				}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
						{excelAggregations.map((agg, idx) => (
							<Card
								key={idx}
								size="small"
								style={{ border: '1px solid #d9d9d9' }}
								extra={
									<Button
										type="text"
										danger
										icon={<DeleteOutlined />}
										onClick={() => removeExcelAggregation(idx)}
										disabled={excelAggregations.length === 1}
										size="small"
									/>
								}
							>
								<Space direction="vertical" style={{ width: '100%' }} size="small">
									<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
										<Select
											placeholder="Chọn cột"
											value={agg.column}
											onChange={v => {
												updateExcelAggregation(idx, 'column', v);

												if (config.excelProcessingMode === 'aggregate' && excelGroupBy.length > 0 && importedData?.length > 0) {

													const finalData = processExcelDataWithAggregate(importedData);
													setProcessedData(finalData);
													handleConfigChange('excelData', finalData);
												} else {
													console.log('Skipping processExcelDataWithAggregate from column onChange');
												}
											}}
											style={{ flex: 1 }}
											showSearch
											filterOption={(input, option) =>
												option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
											}
										>
											{availableColumns
												// Ẩn các cột đã chọn ở Nhóm theo cột
												.filter(col => !excelGroupBy.includes(col))
												.map(col => (
													<Option key={col} value={col}>{col}</Option>
												))}
										</Select>
										<Select
											placeholder="Chọn hàm"
											value={agg.function}
											onChange={v => {

												updateExcelAggregation(idx, 'function', v);
												// Xử lý lại dữ liệu khi thay đổi aggregation

												if (config.excelProcessingMode === 'aggregate' && excelGroupBy.length > 0 && importedData?.length > 0) {

													const finalData = processExcelDataWithAggregate(importedData);
													setProcessedData(finalData);
													handleConfigChange('excelData', finalData);
												} else {
													console.log('Skipping processExcelDataWithAggregate from function onChange');
												}
											}}
											style={{ flex: 1 }}
										>
											{functionOptions.map(opt => (
												<Option key={opt.value} value={opt.value}>
													<div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
														<span style={{ fontSize: '16px' }}>{opt.label} - </span>
														<span style={{
															fontSize: '14px',
															color: '#666',
															fontStyle: 'italic',
														}}>{opt.description}</span>
													</div>
												</Option>
											))}
										</Select>
									</div>

									<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
										<Input
											placeholder="Tên cột kết quả (tùy chọn)"
											value={agg.alias}
											onChange={e => {
												updateExcelAggregation(idx, 'alias', e.target.value);
											}}
											style={{ flex: 1 }}
										/>
										<Text type="secondary" style={{ fontSize: '12px' }}>
											{agg.alias || `${agg.function}_${agg.column || 'column'}`}
										</Text>
									</div>

									{agg.function && (
										<div style={{
											padding: 8,
											backgroundColor: '#f6ffed',
											borderRadius: 4,
											fontSize: '12px',
											color: '#52c41a',
										}}>
											<InfoCircleOutlined style={{ marginRight: 4 }} />
											{getFunctionDescription(agg.function)}
										</div>
									)}
								</Space>
							</Card>
						))}
					</div>
				</Card>

				<Card size="small" title="Thông tin kết quả">
					<div style={{ fontSize: '12px', color: '#666' }}>
						<p>• Dữ liệu sẽ được nhóm
							theo: <strong>{excelGroupBy && excelGroupBy.length > 0 ? (Array.isArray(excelGroupBy) ? excelGroupBy.join(' → ') : excelGroupBy) : 'N/A'}</strong>
						</p>
						<p>• Sẽ tạo
							ra <strong>{excelAggregations.filter(agg => agg.column && agg.function).length}</strong> cột
							tính toán</p>
						<p>• Số cột có sẵn: <strong>{availableColumns.length}</strong></p>
						<p>• Dữ liệu gốc: <strong>{importedData.length}</strong> dòng</p>
						<p>• Dữ liệu sau xử lý: <strong>{processedData.length}</strong> dòng</p>
					</div>
				</Card>
			</div>
		);
	};

	const renderExcelUpload = () => (
		<Card title="Upload Excel File" size="small">


			<Space direction="vertical" style={{ width: '100%' }}>
				{importedData.length === 0 ? (
					<Dragger
						accept=".xls,.xlsx"
						beforeUpload={handleFileUpload}
						showUploadList={false}
						disabled={loading}
					>
						<p className="ant-upload-drag-icon">
							<InboxOutlined />
						</p>
						<p className="ant-upload-text">
							Kéo và thả file Excel vào đây hoặc nhấn để chọn file
						</p>
						<p className="ant-upload-hint">
							Chỉ hỗ trợ file có định dạng .xls hoặc .xlsx
						</p>
					</Dragger>
				) : (
					<div>
						<div style={{
							fontSize: '12px',
							color: '#52c41a',
							marginBottom: 8,
							display: 'flex',
							gap: 8,
							justifyContent: 'space-between',
							alignItems: 'center',
						}}>
							✓ Đã tải {importedData.length} dòng dữ liệu với {importColumns.length} cột
							{selectedSheet && (
								<span style={{ fontSize: '11px', color: '#1890ff', fontStyle: 'italic' }}>
									(Sheet: {selectedSheet}, Header: Hàng {selectedExcelHeaderRow + 1})
								</span>
							)}
							<div style={{ display: 'flex', gap: 8 }}>
								<Button
									type="default"
									size="small"
									icon={<InfoCircleOutlined />}
									onClick={() => setShowColumnFilter(!showColumnFilter)}
								>
									{showColumnFilter ? 'Ẩn lọc cột' : 'Lọc cột'}
								</Button>
								<Button
									type="default"
									size="small"
									icon={<UploadOutlined />}
									onClick={() => {
										// Reset lại file và dữ liệu liên quan
										setImportedData([]);
										setImportColumns([]);
										setProcessedData([]);
										setImportProgress(0);
										setLoading(false);
										setShowAggregateConfig(false);
										// Reset Excel sheet selection states
										setExcelSheets([]);
										setSelectedSheet('');
										setExcelRawData([]);
										setSelectedExcelHeaderRow(0);
										setExcelHeaderOptions([]);
										setIsExcelModalVisible(false);
										setExcelWorkbook(null);
										// Reset column filter
										setSelectedExcelColumns([]);
										setShowColumnFilter(false);

										handleConfigChange('file', null);
										handleConfigChange('excelProcessingMode', 'normal');
										handleConfigChange('excelAggregateInfo', null);
										// Quan trọng: xoá outputColumns cũ để tránh lưu nhầm khi đổi file
										handleConfigChange('outputColumns', []);
										// Reset excelData và excelColumns
										handleConfigChange('excelData', []);
										handleConfigChange('excelColumns', []);
										handleConfigChange('excelSheet', '');
										handleConfigChange('excelHeaderRow', 0);
									}}
								>
									Chọn file khác
								</Button>
							</div>
						</div>


						{/* Component lọc cột */}
						{showColumnFilter && renderColumnFilter(
							importColumns.map(col => String(typeof col === 'string' ? col : col.title || col.name)),
							selectedExcelColumns,
							setSelectedExcelColumns,
							'excel',
						)}

						{/* Hiển thị dữ liệu */}
						<Table
							columns={importColumns}
							dataSource={(processedData.length > 0 ? processedData : importedData).slice(0, 5)} // Chỉ hiển thị 5 dòng đầu
							pagination={false}
							size="small"
							scroll={{ x: true }}
						/>
						{/* 2 tùy chọn xử lý dữ liệu */}
						<div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
							<div style={{ fontWeight: 'bold', marginBottom: 8 }}>Chọn cách xử lý dữ liệu:</div>
							<Radio.Group
								value={config.excelProcessingMode}
								onChange={(e) => {
									handleConfigChange('excelProcessingMode', e.target.value);
									if (e.target.value === 'aggregate') {
										setShowAggregateConfig(true);
									} else {
										setShowAggregateConfig(false);
										// Xử lý lại dữ liệu với mode normal
										const finalData = processExcelDataWithAggregate(importedData);
										setProcessedData(finalData);
										handleConfigChange('excelData', finalData);
										// Xóa thông tin aggregate
										handleConfigChange('excelAggregateInfo', null);
									}
								}}
							>
								<Space direction="vertical">
									<Radio value="normal">
										<div>
											<div style={{ fontWeight: 'bold' }}>Tải lên bình thường</div>
											<div style={{ fontSize: '12px', color: '#666' }}>Sử dụng dữ liệu gốc từ file
												Excel
											</div>
										</div>
									</Radio>
									<Radio value="aggregate">
										<div>
											<div style={{ fontWeight: 'bold' }}>Xử lý dữ liệu trước khi tải lên</div>
											<div style={{ fontSize: '12px', color: '#666' }}>Nhóm và tính toán dữ liệu
												trước khi lưu
											</div>
										</div>
									</Radio>
								</Space>
							</Radio.Group>

							{/* Tips cho dữ liệu lớn */}
							<Alert
								message="💡 Tips cho dữ liệu lớn"
								description="Với dữ liệu lớn (> 50,000 dòng), khuyến nghị sử dụng lựa chọn 'Xử lý dữ liệu trước khi tải lên' để đạt tốc độ xử lý cao nhất"
								type="info"
								showIcon
								style={{ marginTop: 12 }}
							/>
						</div>


						{/* Cấu hình aggregate */}
						{showAggregateConfig && config.excelProcessingMode === 'aggregate' && (
							<div style={{ marginBottom: 16 }}>
								{renderExcelAggregateConfig()}
							</div>
						)}

						{/* Thông tin dữ liệu đã xử lý */}
						{config.excelProcessingMode === 'aggregate' && processedData.length > 0 && (
							<div style={{ fontSize: '12px', color: '#1890ff', marginTop: 8 }}>
								📊 Dữ liệu đã được nhóm: {importedData.length} dòng → {processedData.length} dòng
							</div>
						)}

						{importProgress > 0 && (
							<div style={{ marginTop: 8 }}>
								<Progress percent={importProgress} status="active" size="small" />
								<div style={{ fontSize: '12px', color: '#1890ff' }}>
									Đang lưu dữ liệu... {importProgress}%
								</div>
							</div>
						)}
					</div>
				)}
				{loading && (
					<div style={{ textAlign: 'center', padding: '8px' }}>
						<Spin size="small" /> Đang xử lý file...
					</div>
				)}
			</Space>
		</Card>
	);

	const renderGoogleSheets = () => (
		<Card title="Google Sheets" size="small">
			<Space direction="vertical" style={{ width: '100%' }}>
				{ggsStep === 'input' && (
					<>
						<Input
							placeholder="Enter Google Sheets URL"
							prefix={<LinkOutlined />}
							value={config.googleSheetUrl}
							onChange={(e) => handleConfigChange('googleSheetUrl', e.target.value)}
						/>
						<div style={{ fontSize: '12px', color: '#666' }}>
							Example: https://docs.google.com/spreadsheets/d/...
						</div>
						<div style={{ fontSize: '12px', color: '#666' }}>
							Lưu ý:
							<br />
							- Chuyển tới đúng tab muốn kéo dữ liệu rồi copy link
							<br />
							- Chi hỗ trợ định dạng google sheet, không hỗ trợ xlsx view qua google sheet. (Có thể thực
							hiện đổi định dạng qua File/ Save As Google Sheet trong giao diện của Google Sheet)
							<br />
							- Cần phân quyền view cho Admin (mặc định có thể phân quyền cho gateway@bcanvas.vn)
						</div>

						{/* Cấu hình tự động cập nhật */}
						<div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
							<div style={{ fontWeight: 'bold', marginBottom: 8 }}>Cấu hình tự động cập nhật:</div>
							<Space direction="vertical" style={{ width: '100%' }}>
								<div>
									<label style={{ display: 'block', marginBottom: 4 }}>Thời gian tự động cập
										nhật:</label>
									<div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
										Chọn khoảng thời gian để tự động lấy dữ liệu mới từ Google Sheet (Chỉ hoạt động khi bật chế độ Autorun)
									</div>
									<Select
										style={{ width: '100%' }}
										value={config.intervalUpdate}
										onChange={(value) => handleConfigChange('intervalUpdate', value)}
										placeholder="Chọn thời gian"
									>
										<Option value={0}>Không tự động cập nhật</Option>
										<Option value={0.25}>15 giây</Option>
										<Option value={0.5}>30 giây</Option>
										<Option value={1}>1 phút</Option>
										<Option value={5}>5 phút</Option>
										<Option value={15}>15 phút</Option>
										<Option value={30}>30 phút</Option>
										<Option value={60}>1 giờ</Option>
										<Option value={180}>3 giờ</Option>
										<Option value={360}>6 giờ</Option>
										<Option value={720}>12 giờ</Option>
										<Option value={1440}>1 ngày</Option>
									</Select>
								</div>

								{config.lastUpdate && (
									<div style={{ fontSize: '12px', color: '#666' }}>
										Lần cập nhật cuối: {new Date(config.lastUpdate).toLocaleString('vi-VN')}
									</div>
								)}
							</Space>
						</div>

						<Button
							type="primary"
							loading={ggsLoading}
							onClick={handleFetchGgsData}
							disabled={!config.googleSheetUrl.trim()}
						>
							Kéo dữ liệu
						</Button>
					</>
				)}
				{ggsStep === 'preview' && (
					<div>
						<div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
							<Button
								type="default"
								size="small"
								icon={<InfoCircleOutlined />}
								onClick={() => setShowColumnFilter(!showColumnFilter)}
							>
								{showColumnFilter ? 'Ẩn lọc cột' : 'Lọc cột'}
							</Button>
							<Button
								type="primary"
								size="small"
								onClick={() => {
									setGgsStep('input');
									setGgsData([]);
									setGgsColumns([]);
									setSelectedHeaderRow(0); // Reset state selectedHeaderRow
									setSelectedGgsColumns([]);
									setShowColumnFilter(false);
									handleConfigChange('googleSheetsData', []);
									handleConfigChange('googleSheetsColumns', []);
									handleConfigChange('googleSheetsHeaderRow', null); // Reset về null
								}}
							>
								Chọn URL khác
							</Button>
							{/* {onSaveData && (
                <Button 
                  type="primary" 
                  size="small"
                  loading={uploadSaving}
                  onClick={async () => {
                    const success = await handleSaveData();
                    if (success && onDataUpdate) {
                      await onDataUpdate();
                    }
                  }}
                >
                  {currentStepId && currentStepId > 1 ? 'Thêm dữ liệu' : 'Lưu dữ liệu'}
                </Button>
              )} */}
						</div>
						<div style={{ fontSize: '12px', color: '#52c41a', marginBottom: 8 }}>
							✓ Đã tải {ggsData.length} dòng dữ liệu với {ggsColumns.length} cột
						</div>

						{/* Component lọc cột */}
						{showColumnFilter && renderColumnFilter(
							ggsColumns,
							selectedGgsColumns,
							setSelectedGgsColumns,
							'googleSheets',
						)}

						<Table
							columns={ggsColumns.map(col => ({
								title: col,
								dataIndex: col,
								key: col,
								ellipsis: false,
							}))}
							dataSource={ggsData.slice(0, 5).map((row, idx) => ({ ...row, key: idx }))}
							pagination={false}
							size="small"
							scroll={{ x: true }}
						/>
						{importProgress > 0 && (
							<div style={{ marginTop: 8 }}>
								<Progress percent={importProgress} status="active" size="small" />
								<div style={{ fontSize: '12px', color: '#1890ff' }}>
									Đang lưu dữ liệu... {importProgress}%
								</div>
							</div>
						)}
					</div>
				)}
			</Space>
		</Card>
	);

	const renderGoogleDrive = () => (
		<Card title={<div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
			<span>Google Drive </span>
			{(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
				<Button
					size="small"
					onClick={() => setIsRecentFolderSettingsVisible(true)}
					icon={<SettingOutlined />}
				>
					Cài đặt
				</Button>
			)}
		</div>} size="small">

			<Space direction="vertical" style={{ width: '100%' }}>
				<div style={{ fontSize: '12px', color: '#666', marginBottom: 8, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
					Lưu ý:
					<br />
					- Bắt buộc phải là link thư mục trong Google Drive
					<br />
					- Cần phân quyền view cho Admin (mặc định có thể phân quyền cho <strong>gateway@bcanvas.vn</strong>)
				</div>

				{/* Recent Folders Section */}
				{recentFolders.length > 0 && (
					<div style={{ marginBottom: 16 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
							<div style={{ fontWeight: 500, fontSize: '14px' }}>Shared By Admin:</div>
							<div style={{ display: 'flex', gap: 8 }}>
								<Button
									size="small"
									onClick={refreshRecentFolders}
									icon={<ReloadOutlined />}
								>
									Refresh
								</Button>

							</div>
						</div>
						<div style={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: 8,
							maxHeight: '120px',
							overflowY: 'auto',
							padding: '8px',
							border: '1px solid #d9d9d9',
							borderRadius: '6px',
							backgroundColor: '#fafafa'
						}}>
							{recentFolders.map((folder) => (
								<Button
									key={folder.id}
									size="small"
									type={selectedRecentFolder?.id === folder.id ? 'primary' : 'default'}
									onClick={() => handleSelectRecentFolder(folder)}
									style={{
										fontSize: '12px',
										height: '28px',
										display: 'flex',
										alignItems: 'center',
										gap: '4px'
									}}
								>
									<FolderOutlined />
									<span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
										{folder.name}
									</span>
								</Button>
							))}
						</div>
					</div>
				)}


				<Input
					placeholder="Enter Google Drive folder URL"
					prefix={<FolderOutlined />}
					value={config.googleDriveUrl}
					onChange={(e) => handleConfigChange('googleDriveUrl', e.target.value)}
				/>
				<div style={{ fontSize: '12px', color: '#666' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
						<Switch
							checked={!!config.googleDriveMultiFiles}
							onChange={(checked) => handleConfigChange('googleDriveMultiFiles', checked)}
						/>
						<span>Gộp dữ liệu từ nhiều file trong thư mục</span>
					</div>
				</div>
			
				{/* Cấu hình tự động cập nhật */}
				<div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
					<div style={{ fontWeight: 'bold', marginBottom: 8 }}>Cấu hình tự động cập nhật:</div>
					<Space direction="vertical" style={{ width: '100%' }}>
						<div>
							<label style={{ display: 'block', marginBottom: 4 }}>Thời gian tự động cập
								nhật:</label>
							<div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
								Chọn khoảng thời gian để tự động lấy dữ liệu mới từ Google Drive (Chỉ hoạt động khi bật chế độ Autorun)
							</div>
							<Select
								style={{ width: '100%' }}
								value={config.intervalUpdate}
								onChange={(value) => handleConfigChange('intervalUpdate', value)}
								placeholder="Chọn thời gian"
							>
								<Option value={0}>Không tự động cập nhật</Option>
								<Option value={0.25}>15 giây</Option>
								<Option value={0.5}>30 giây</Option>
								<Option value={1}>1 phút</Option>
								<Option value={5}>5 phút</Option>
								<Option value={15}>15 phút</Option>
								<Option value={30}>30 phút</Option>
								<Option value={60}>1 giờ</Option>
								<Option value={180}>3 giờ</Option>
								<Option value={360}>6 giờ</Option>
								<Option value={720}>12 giờ</Option>
								<Option value={1440}>1 ngày</Option>
							</Select>
						</div>

						{config.lastUpdate && (
							<div style={{ fontSize: '12px', color: '#666' }}>
								Lần cập nhật cuối: {new Date(config.lastUpdate).toLocaleString('vi-VN')}
							</div>
						)}
					</Space>
				</div>

				<Button
					type="primary"
					loading={driveLoading}
					onClick={handleFetchDriveData}
					disabled={!config.googleDriveUrl.trim()}
				>
					Kéo dữ liệu
				</Button>

				{/* Inline file picker and sheet/header selectors for multi-file mode */}

				{driveData.length > 0 && (
					<div>
						<div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
							{/* {onSaveData && (
                <Button 
                  type="primary" 
                  size="small"
                  loading={uploadSaving}
                  onClick={async () => {
                    const success = await handleSaveData();
                    if (success && onDataUpdate) {
                      await onDataUpdate();
                    }
                  }}
                >
                  {currentStepId && currentStepId > 1 ? 'Thêm dữ liệu' : 'Lưu dữ liệu'}
                </Button>
              )} */}
						</div>
						<div style={{ fontSize: '12px', color: '#52c41a', marginBottom: 8 }}>
							✓ Đã tải {driveData.length} dòng dữ liệu với {driveColumns.length} cột
						</div>

						{/* Column Filter - Google Sheets Style */}
						<div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
							<div style={{ fontWeight: 500 }}>Lọc cột:</div>
							<Button
								size="small"
								onClick={() => setHiddenDriveColumns([])}
								disabled={hiddenDriveColumns.length === 0}
							>
								Hiện tất cả
							</Button>
							<Button
								size="small"
								onClick={() => setHiddenDriveColumns(driveColumns.map(col => col.name))}
								disabled={hiddenDriveColumns.length === driveColumns.length}
							>
								Ẩn tất cả
							</Button>
							<Select
								mode="multiple"
								style={{ minWidth: 200 }}
								placeholder="Chọn cột để ẩn"
								value={hiddenDriveColumns}
								onChange={setHiddenDriveColumns}
								options={driveColumns.map(col => ({
									label: col.name,
									value: col.name
								}))}
								maxTagCount="responsive"
							/>
						</div>

						<Table
							columns={driveColumns
								.filter(col => !hiddenDriveColumns.includes(col.name))
								.map(col => ({
									title: col.name,
									dataIndex: col.name,
									key: col.name,
									ellipsis: false,
								}))}
							dataSource={driveData.slice(0, 5).map((row, idx) => ({ ...row, key: idx }))}
							pagination={false}
							size="small"
							scroll={{ x: true }}
						/>
						{importProgress > 0 && (
							<div style={{ marginTop: 8 }}>
								<Progress percent={importProgress} status="active" size="small" />
								<div style={{ fontSize: '12px', color: '#1890ff' }}>
									Đang lưu dữ liệu... {importProgress}%
								</div>
							</div>
						)}
					</div>
				)}
			</Space>
		</Card>
	);

	const renderPostgreSQL = () => (
		<Card title="PostgreSQL Database" size="small">
			<Space direction="vertical" style={{ width: '100%' }}>
				{postgresStep === 'connection' && (
					<div>
						<div style={{ marginBottom: 16 }}>
							<h4>Thông tin kết nối</h4>
							<Space direction="vertical" style={{ width: '100%' }}>
								<Input
									placeholder="Host (ví dụ: localhost)"
									prefix={<DatabaseOutlined />}
									value={connectionInfo.host}
									onChange={(e) => setConnectionInfo(prev => ({ ...prev, host: e.target.value }))}
								/>
								<Input
									placeholder="Port (mặc định: 5432)"
									prefix={<DatabaseOutlined />}
									value={connectionInfo.port}
									onChange={(e) => setConnectionInfo(prev => ({ ...prev, port: e.target.value }))}
								/>
								<Input
									placeholder="Username"
									prefix={<DatabaseOutlined />}
									value={connectionInfo.user}
									onChange={(e) => setConnectionInfo(prev => ({ ...prev, user: e.target.value }))}
								/>
								<Input.Password
									placeholder="Password"
									prefix={<DatabaseOutlined />}
									value={connectionInfo.password}
									onChange={(e) => setConnectionInfo(prev => ({ ...prev, password: e.target.value }))}
								/>
							</Space>
						</div>
						<Button
							type="primary"
							loading={connectionLoading}
							onClick={handlePostgresConnection}
							disabled={!connectionInfo.host.trim() || !connectionInfo.user.trim() || !connectionInfo.password.trim()}
						>
							Kết nối & Chọn bảng
						</Button>
					</div>
				)}

				{postgresStep === 'preview' && postgresData.length > 0 && (
					<div>
						{/* Cấu hình tự động cập nhật */}
						<div style={{
							marginBottom: 16,
							padding: 12,
							backgroundColor: '#f6ffed',
							border: '1px solid #b7eb8f',
							borderRadius: 6,
						}}>
							<h4>Cấu hình tự động cập nhật</h4>
							<Space direction="vertical" style={{ width: '100%' }}>
								<div>
									<label>Thời gian tự động cập nhật:</label>
									<Select
										style={{ width: '100%', marginTop: 4 }}
										value={config.intervalUpdate}
										onChange={(value) => handleConfigChange('intervalUpdate', value)}
										options={[
											{ value: 0, label: 'Không tự động' },
											{ value: 0.25, label: '15 giây' },
											{ value: 0.5, label: '30 giây' },
											{ value: 1, label: '1 phút' },
											{ value: 5, label: '5 phút' },
											{ value: 15, label: '15 phút' },
											{ value: 30, label: '30 phút' },
											{ value: 60, label: '1 giờ' },
											{ value: 180, label: '3 giờ' },
											{ value: 360, label: '6 giờ' },
											{ value: 720, label: '12 giờ' },
											{ value: 1440, label: '1 ngày' },
										]}
									/>
								</div>
								{config.lastUpdate && (
									<div style={{ fontSize: '12px', color: '#666' }}>
										Lần cập nhật cuối: {new Date(config.lastUpdate).toLocaleString('vi-VN')}
									</div>
								)}
							</Space>
						</div>

						<div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
							<Button
								type="default"
								size="small"
								icon={<InfoCircleOutlined />}
								onClick={() => setShowColumnFilter(!showColumnFilter)}
							>
								{showColumnFilter ? 'Ẩn lọc cột' : 'Lọc cột'}
							</Button>
							<Button onClick={() => {
								setPostgresStep('connection');
								setConfig({
									...config,
									postgresData: [],
									postgresColumns: [],
									lastUpdate: null,
								});
								setConnectionInfo({
									host: '',
									port: 5432,
									user: '',
									password: '',
								});
								setSelectedPostgresColumns([]);
								setShowColumnFilter(false);
							}}>
								Kết nối mới
							</Button>
							<Button onClick={() => setShowPostgresExplorer(true)}>
								Chọn bảng khác
							</Button>

							{/* {onSaveData && (
                <Button 
                  type="primary" 
                  size="small"
                  loading={uploadSaving}
                  onClick={async () => {
                    const success = await handleSaveData();
                    if (success && onDataUpdate) {
                      await onDataUpdate();
                    }
                  }}
                >
                  {currentStepId && currentStepId > 1 ? 'Thêm dữ liệu' : 'Lưu dữ liệu'}
                </Button>
              )} */}
						</div>
						<div style={{ fontSize: '12px', color: '#52c41a', marginBottom: 8 }}>
							✓ Đã tải {postgresData.length} dòng dữ liệu với {postgresColumns.length} cột
						</div>

						{/* Component lọc cột */}
						{showColumnFilter && renderColumnFilter(
							postgresColumns,
							selectedPostgresColumns,
							setSelectedPostgresColumns,
							'postgresql',
						)}

						<Table
							columns={postgresColumns.map(col => ({
								title: col,
								dataIndex: col,
								key: col,
								ellipsis: false,
							}))}
							dataSource={postgresData.slice(0, 5).map((row, idx) => ({ ...row, key: idx }))}
							pagination={false}
							size="small"
							scroll={{ x: true }}
						/>
					</div>
				)}

				{postgresLoading && (
					<div style={{ textAlign: 'center', padding: '20px' }}>
						<Spin size="large" />
						<div style={{ marginTop: 8 }}>Đang lấy dữ liệu từ PostgreSQL...</div>
					</div>
				)}
			</Space>

			{/* PostgreSQL Explorer Modal */}
			<PostgresExplorer
				visible={showPostgresExplorer}
				connectionInfo={connectionInfo}
				onTableSelect={handleTableSelectFromExplorer}
				onClose={() => setShowPostgresExplorer(false)}
			/>
		</Card>
	);

	const renderApiConnector = () => (
		<Card title="API Connector" size="small">
			<Space direction="vertical" style={{ width: '100%' }}>
				{apiStep === 'input' && (
					<div>
						<div style={{ marginBottom: 16 }}>
							<h4>Thông tin kết nối API</h4>
							<Space direction="vertical" style={{ width: '100%' }}>
								<Input
									placeholder="URL API (ví dụ: https://api.example.com/data)"
									prefix={<ApiOutlined />}
									value={config.apiUrl || ''}
									onChange={(e) => handleConfigChange('apiUrl', e.target.value)}
								/>
								<Input.Password
									placeholder="API Key (tùy chọn)"
									prefix={<KeyOutlined />}
									value={config.apiKey || ''}
									onChange={(e) => handleConfigChange('apiKey', e.target.value)}
								/>
							</Space>
						</div>
						<Button
							type="primary"
							loading={apiLoading}
							onClick={handleApiFetch}
							disabled={!config.apiUrl?.trim()}
						>
							Lấy dữ liệu
						</Button>
					</div>
				)}

				{apiStep === 'preview' && apiData.length > 0 && (
					<div>
						{/* Cấu hình tự động cập nhật */}
						<div style={{
							marginBottom: 16,
							padding: 12,
							backgroundColor: '#f6ffed',
							border: '1px solid #b7eb8f',
							borderRadius: 6,
						}}>
							<h4>Cấu hình tự động cập nhật</h4>
							<Space direction="vertical" style={{ width: '100%' }}>
								<div>
									<label>Thời gian tự động cập nhật:</label>
									<Select
										style={{ width: '100%', marginTop: 4 }}
										value={config.intervalUpdate}
										onChange={(value) => handleConfigChange('intervalUpdate', value)}
										options={[
											{ value: 0, label: 'Không tự động' },
											{ value: 0.25, label: '15 giây' },
											{ value: 0.5, label: '30 giây' },
											{ value: 1, label: '1 phút' },
											{ value: 5, label: '5 phút' },
											{ value: 15, label: '15 phút' },
											{ value: 30, label: '30 phút' },
											{ value: 60, label: '1 giờ' },
											{ value: 180, label: '3 giờ' },
											{ value: 360, label: '6 giờ' },
											{ value: 720, label: '12 giờ' },
											{ value: 1440, label: '1 ngày' },
										]}
									/>
								</div>
								{config.lastUpdate && (
									<div style={{ fontSize: '12px', color: '#666' }}>
										Lần cập nhật cuối: {new Date(config.lastUpdate).toLocaleString('vi-VN')}
									</div>
								)}
							</Space>
						</div>

						<div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
							<Button
								type="default"
								size="small"
								icon={<InfoCircleOutlined />}
								onClick={() => setShowColumnFilter(!showColumnFilter)}
							>
								{showColumnFilter ? 'Ẩn lọc cột' : 'Lọc cột'}
							</Button>
							<Button onClick={() => {
								setApiStep('input');
								setApiData([]);
								setApiColumns([]);
								setSelectedApiColumns([]);
								setShowColumnFilter(false);
								const resetConfig = {
									...config,
									uploadType: undefined,
									apiUrl: '',
									apiKey: '',
									apiData: undefined,
									apiColumns: undefined,
									intervalUpdate: undefined,
									lastUpdate: undefined,
								};
								setConfig(resetConfig);
								onChange(resetConfig);
							}}>
								Kết nối mới
							</Button>
						</div>
						<div style={{ fontSize: '12px', color: '#52c41a', marginBottom: 8 }}>
							✅ Đã kết nối thành công với API
						</div>
						<div style={{ fontSize: '12px', color: '#666', marginBottom: 16 }}>
							URL: {config.apiUrl}
						</div>

						{/* Component lọc cột */}
						{showColumnFilter && renderColumnFilter(
							apiColumns,
							selectedApiColumns,
							setSelectedApiColumns,
							'api',
						)}

						{/* Preview data */}
						<div style={{ marginBottom: 16 }}>
							<h4>Xem trước dữ liệu ({apiData.length} dòng)</h4>
							<Table
								dataSource={apiData.slice(0, 10)}
								columns={apiColumns.map(col => ({
									title: col,
									dataIndex: col,
									key: col,
									render: (text) => {
										if (typeof text === 'object') {
											return JSON.stringify(text);
										}
										return text;
									},
								}))}
								size="small"
								pagination={false}
								scroll={{ x: 'max-content' }}
							/>
							{apiData.length > 10 && (
								<div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
									Hiển thị 10 dòng đầu tiên trong tổng số {apiData.length} dòng
								</div>
							)}
						</div>
					</div>
				)}

				{apiLoading && (
					<div style={{ textAlign: 'center', padding: '20px' }}>
						<Spin size="large" />
						<div style={{ marginTop: 8 }}>Đang lấy dữ liệu từ API...</div>
					</div>
				)}
			</Space>
		</Card>
	);

	// System Import handler
	const handleSystemImport = async () => {
		if (!selectedTemplateTable) {
			message.error('Vui lòng chọn templateTable!');
			return;
		}

		setSystemLoading(true);
		try {
			// Lấy dữ liệu từ templateTable được chọn
			let dataResponse;
			if (selectedStepId !== null) {
				if (selectedStepId === 1) {
					dataResponse = await getTemplateRow(selectedTemplateTable.id, null, false);
					dataResponse = dataResponse.rows || [];
				} else {
					dataResponse = await getTemplateRow(selectedTemplateTable.id, selectedStepId, false);
					dataResponse = dataResponse.rows || [];
				}
			} else {
				// Lấy dữ liệu gốc từ templateTable
				dataResponse = await getTemplateRow(selectedTemplateTable.id, null, false);
				dataResponse = dataResponse.rows || [];
			}
			const data = (dataResponse.rows || []).map(item => item.data);

			if (data && Array.isArray(data) && data.length > 0) {
				// Lấy columns từ object đầu tiên
				const allColumns = Object.keys(data[0]);

				// Lọc dữ liệu theo cột được chọn
				const filteredData = filterDataByColumns(data, allColumns, selectedSystemColumns);
				const columnsToUse = getFilteredColumns(allColumns, selectedSystemColumns);

				setSystemData(filteredData);
				setSystemColumns(columnsToUse);
				setSystemStep('preview');

				// Cập nhật config với thông tin System Import
				const newConfig = {
					...config,
					uploadType: 'system',
					systemConfig: {
						templateTableId: selectedTemplateTable.id,
						templateTableName: selectedTemplateTable.name,
						stepId: selectedStepId,
						tableName: selectedTemplateTable.name,
					},
					systemData: filteredData,
					systemColumns: columnsToUse,
				};

				setConfig(newConfig);
				onChange(newConfig);

				message.success(`Đã lấy được ${data.length} dòng dữ liệu từ hệ thống`);
			} else {
				message.error('Không lấy được dữ liệu từ hệ thống!');
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu từ hệ thống:', error);
			message.error('Có lỗi khi lấy dữ liệu từ hệ thống!');
		} finally {
			setSystemLoading(false);
		}
	};


	// Helper function to get step type name
	const getStepTypeName = (type) => {
		const stepTypes = {
			1: 'Remove Duplicate',
			2: 'Fill Missing',
			3: 'Outlier Detection',
			4: 'Lookup',
			5: 'Calculated Column',
			6: 'Add Column',
			7: 'Cross Mapping',
			8: 'Smart Fill',
			9: 'Filter',
			10: 'Aggregate',
			11: 'Code Column',
			12: 'Upload Data',
			13: 'Column Split',
			14: 'Date Converter',
			15: 'Smart Rule Fill',
			16: 'Column Filter',
			17: 'Pivot Table',
			18: 'Join Table',
			19: 'Value To Time',
		};
		return stepTypes[type] || `Type ${type}`;
	};

	const renderSystemImport = () => (
		<Card title="Import từ hệ thống" size="small">
			<Space direction="vertical" style={{ width: '100%' }}>
				{systemStep === 'select' && (
					<div>
						<div style={{ marginBottom: 16 }}>
							<h4>Chọn dữ liệu để import</h4>
							<p style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
								Chọn một bảng dữ liệu có sẵn trong hệ thống để import dữ liệu từ các step của nó
							</p>
						</div>

						<div style={{ marginBottom: 16 }}>
							<label style={{ display: 'block', marginBottom: 4 }}>Bảng dữ liệu:</label>
							<Select
								style={{ width: '100%' }}
								placeholder="Chọn bảng dữ liệu"
								value={selectedTemplateTable?.id}
								onChange={(value) => {
									const selected = availableTemplateTables.find(template => template.id === value);
									setSelectedTemplateTable(selected);
									setSelectedStepId(null);
									setAvailableSteps([]);
								}}
								options={availableTemplateTables.filter(template => template.fileNote_id != idFileNote).map(template => ({
									value: template.id,
									label: `${template.name || template.title}`,
								}))}
							/>
						</div>

						{selectedTemplateTable && (
							<div style={{ marginBottom: 16 }}>
								<label style={{ display: 'block', marginBottom: 4 }}>Step (tùy chọn):</label>
								<Select
									style={{ width: '100%' }}
									placeholder="Chọn step cụ thể (để trống để lấy dữ liệu gốc)"
									value={selectedStepId}
									onChange={setSelectedStepId}
									allowClear
									options={availableSteps}
								/>
								<div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
									Để trống để lấy dữ liệu gốc từ templateTable, hoặc chọn step cụ thể để lấy dữ liệu
									đã qua xử lý
								</div>
							</div>
						)}

						<Button
							type="primary"
							loading={systemLoading}
							onClick={handleSystemImport}
							disabled={!selectedTemplateTable || systemLoading}
							style={{ marginTop: 10 }}
						>
							Tải dữ liệu
						</Button>
					</div>
				)}

				{systemStep === 'preview' && systemData.length > 0 && (
					<div>
						{/* Cấu hình tự động cập nhật */}
						{/* <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
              <h4>Cấu hình tự động cập nhật</h4>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <label>Thời gian tự động cập nhật:</label>
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    value={config.intervalUpdate}
                    onChange={(value) => handleConfigChange('intervalUpdate', value)}
                    options={[
                      { value: 0, label: 'Không tự động' },
                      { value: 0.25, label: '15 giây' },
                      { value: 0.5, label: '30 giây' },
                      { value: 1, label: '1 phút' },
                      { value: 5, label: '5 phút' },
                      { value: 15, label: '15 phút' },
                      { value: 30, label: '30 phút' },
                      { value: 60, label: '1 giờ' },
                      { value: 180, label: '3 giờ' },
                      { value: 360, label: '6 giờ' },
                      { value: 720, label: '12 giờ' },
                      { value: 1440, label: '1 ngày' }
                    ]}
                  />
                </div>
                {config.lastUpdate && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Lần cập nhật cuối: {new Date(config.lastUpdate).toLocaleString('vi-VN')}
                  </div>
                )}
              </Space>
            </div> */}

						<div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
							<Button
								type="default"
								size="small"
								icon={<InfoCircleOutlined />}
								onClick={() => setShowColumnFilter(!showColumnFilter)}
							>
								{showColumnFilter ? 'Ẩn lọc cột' : 'Lọc cột'}
							</Button>
							<Button onClick={() => {
								setSystemStep('select');
								setSystemData([]);
								setSystemColumns([]);
								setSelectedTemplateTable(null);
								setSelectedStepId(null);
								setSelectedSystemColumns([]);
								setShowColumnFilter(false);
								const resetConfig = {
									...config,
									uploadType: undefined,
									systemConfig: undefined,
									systemData: undefined,
									systemColumns: undefined,
									intervalUpdate: undefined,
									lastUpdate: undefined,
								};
								setConfig(resetConfig);
								onChange(resetConfig);
							}}>
								Chọn fileNote khác
							</Button>
						</div>

						<div style={{ fontSize: '12px', color: '#52c41a', marginBottom: 8 }}>
							✓ Đã tải {systemData.length} dòng dữ liệu với {systemColumns.length} cột
						</div>
						<div style={{ fontSize: '12px', color: '#666', marginBottom: 16 }}>
							TemplateTable: {selectedTemplateTable?.name} | ID: {selectedTemplateTable?.id}
							{selectedStepId !== null && ` | Step: ${selectedStepId}`}
						</div>

						{/* Component lọc cột */}
						{showColumnFilter && renderColumnFilter(
							systemColumns,
							selectedSystemColumns,
							setSelectedSystemColumns,
							'system',
						)}

						{/* Preview data */}
						<div style={{ marginBottom: 16 }}>
							<h4>Xem trước dữ liệu ({systemData.length} dòng)</h4>
							<Table
								dataSource={systemData.slice(0, 10)}
								columns={systemColumns.map(col => ({
									title: col,
									dataIndex: col,
									key: col,
									render: (text) => {
										if (typeof text === 'object') {
											return JSON.stringify(text);
										}
										return text;
									},
								}))}
								size="small"
								pagination={false}
								scroll={{ x: 'max-content' }}
							/>
							{systemData.length > 10 && (
								<div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
									Hiển thị 10 dòng đầu tiên trong tổng số {systemData.length} dòng
								</div>
							)}
						</div>
					</div>
				)}

				{systemLoading && (
					<div style={{ textAlign: 'center', padding: '20px' }}>
						<Spin size="large" />
						<div style={{ marginTop: 8 }}>Đang tải dữ liệu từ hệ thống...</div>
					</div>
				)}
			</Space>
		</Card>
	);


	useEffect(() => {
		updateAggregateInfo();
	}, [config.excelProcessingMode, excelGroupBy, excelAggregations, importColumns]);


	useEffect(() => {

		updateOutputColumns();
	}, [config.excelProcessingMode, excelGroupBy, excelAggregations, importColumns]);


	// 4.5. Tự động xử lý aggregate khi cấu hình thay đổi
	useEffect(() => {


		if (config.excelProcessingMode === 'aggregate' &&
			excelGroupBy.length > 0 &&
			importedData?.length > 0) {

			const validAggs = excelAggregations.filter(agg => agg.column && agg.function);
			if (validAggs.length > 0) {
				// Có cột tính toán - thực hiện aggregation đầy đủ
				const result = processExcelDataWithAggregate(importedData);
				setProcessedData(result);
				handleConfigChange('excelData', result);
			} else {
				// Chỉ có cột nhóm - thực hiện groupBy đơn giản để loại bỏ duplicate
				const groupedData = importedData.reduce((acc, row) => {
					const groupKey = excelGroupBy.map(col => row[col]).join('|');
					if (!acc[groupKey]) {
						acc[groupKey] = {};
						excelGroupBy.forEach(col => {
							acc[groupKey][col] = row[col];
						});
					}
					return acc;
				}, {});

				const result = Object.values(groupedData);
				setProcessedData(result);
				handleConfigChange('excelData', result);
			}
		}
	}, [config.excelProcessingMode, excelGroupBy, excelAggregations, importedData]);

	// 5. Load available templateTables when component mounts
	useEffect(() => {
		const loadAvailableTemplateTables = async () => {
			try {
				const response = await getAllTemplateTableInfo();

				// Kiểm tra cấu trúc response và lấy data
				let templateTables;
				if (response && response.data && Array.isArray(response.data)) {
					templateTables = response.data;
				} else if (Array.isArray(response)) {
					templateTables = response;
				} else {
					console.error('Cấu trúc response không đúng:', response);
					return;
				}

				if (Array.isArray(templateTables)) {
					// Chuyển đổi dữ liệu để phù hợp với Select
					const formattedTemplateTables = templateTables.map(template => ({
						id: template.id,
						fileNote_id: template.fileNote_id,
						name: template.name || template.title || `Template ${template.id}`,
						table: template.name, // Sử dụng name làm table
						description: template.description,
						steps: template.steps || [], // Lưu trữ steps để sử dụng sau
					}));

					setAvailableTemplateTables(formattedTemplateTables);
				}
			} catch (error) {
				console.error('Lỗi khi tải danh sách templateTable:', error);
			}
		};

		if (config.uploadType === 'system') {
			loadAvailableTemplateTables();
		}
	}, [config.uploadType]);

	// 6. Load available steps when templateTable is selected
	useEffect(() => {
		if (selectedTemplateTable && selectedTemplateTable.steps) {
			const steps = selectedTemplateTable.steps
				.filter(step => step.status === 'completed') // Chỉ hiển thị các step đã hoàn thành
				.map(step => ({
					value: step.id,
					label: `Step ${step.id} - ${getStepTypeName(step.type)}`,
					step: step,
				}));
			setAvailableSteps(steps);
		} else {
			console.log('No steps available for templateTable:', selectedTemplateTable);
			setAvailableSteps([]);
		}
	}, [selectedTemplateTable]);

	// 7. Auto-select all columns when data is first loaded
	useEffect(() => {
		if (importColumns.length > 0 && selectedExcelColumns.length === 0) {
			setSelectedExcelColumns(importColumns.map(col => String(typeof col === 'string' ? col : col.title || col.name)));
		}
	}, [importColumns, selectedExcelColumns]);

	useEffect(() => {
		if (ggsColumns.length > 0 && selectedGgsColumns.length === 0) {
			setSelectedGgsColumns(ggsColumns);
		}
	}, [ggsColumns, selectedGgsColumns]);

	useEffect(() => {
		if (postgresColumns.length > 0 && selectedPostgresColumns.length === 0) {
			setSelectedPostgresColumns(postgresColumns);
		}
	}, [postgresColumns, selectedPostgresColumns]);

	useEffect(() => {
		if (apiColumns.length > 0 && selectedApiColumns.length === 0) {
			setSelectedApiColumns(apiColumns);
		}
	}, [apiColumns, selectedApiColumns]);

	useEffect(() => {
		if (systemColumns.length > 0 && selectedSystemColumns.length === 0) {
			setSelectedSystemColumns(systemColumns);
		}
	}, [systemColumns, selectedSystemColumns]);

	// 8. Re-process data when selected columns change
	useEffect(() => {
		if (selectedExcelColumns.length > 0 && importedData.length > 0) {
			const filteredData = filterDataByColumns(importedData, importColumns.map(col => String(typeof col === 'string' ? col : col.title || col.name)), selectedExcelColumns);


			// Update processed data if in aggregate mode
			if (config.excelProcessingMode === 'aggregate' && excelGroupBy.length > 0) {
				const finalData = processExcelDataWithAggregate(filteredData);
				setProcessedData(finalData);
				handleConfigChange('excelData', finalData);
			} else {
				setProcessedData(filteredData);
				handleConfigChange('excelData', filteredData);
			}
			setImportedData(filteredData);
			// Update columns
			const columnsToUse = getFilteredColumns(importColumns.map(col => String(typeof col === 'string' ? col : col.title || col.name)), selectedExcelColumns);
			handleConfigChange('excelColumns', columnsToUse);
		}
	}, [selectedExcelColumns]);

	useEffect(() => {
		if (selectedGgsColumns.length > 0 && ggsData.length > 0) {
			const filteredData = filterDataByColumns(ggsData, ggsColumns, selectedGgsColumns);
			setGgsData(filteredData);
			handleConfigChange('googleSheetsData', filteredData);

			const columnsToUse = getFilteredColumns(ggsColumns, selectedGgsColumns);
			setGgsColumns(columnsToUse);
			handleConfigChange('googleSheetsColumns', columnsToUse);
		}
	}, [selectedGgsColumns]);

	useEffect(() => {
		if (selectedPostgresColumns.length > 0 && postgresData.length > 0) {
			const filteredData = filterDataByColumns(postgresData, postgresColumns, selectedPostgresColumns);
			setPostgresData(filteredData);
			handleConfigChange('postgresData', filteredData);

			const columnsToUse = getFilteredColumns(postgresColumns, selectedPostgresColumns);
			setPostgresColumns(columnsToUse);
			handleConfigChange('postgresColumns', columnsToUse);
		}
	}, [selectedPostgresColumns]);

	useEffect(() => {
		if (selectedApiColumns.length > 0 && apiData.length > 0) {
			const filteredData = filterDataByColumns(apiData, apiColumns, selectedApiColumns);
			setApiData(filteredData);
			handleConfigChange('apiData', filteredData);

			const columnsToUse = getFilteredColumns(apiColumns, selectedApiColumns);
			setApiColumns(columnsToUse);
			handleConfigChange('apiColumns', columnsToUse);
		}
	}, [selectedApiColumns]);

	useEffect(() => {
		if (selectedSystemColumns.length > 0 && systemData.length > 0) {
			const filteredData = filterDataByColumns(systemData, systemColumns, selectedSystemColumns);
			setSystemData(filteredData);
			handleConfigChange('systemData', filteredData);

			const columnsToUse = getFilteredColumns(systemColumns, selectedSystemColumns);
			setSystemColumns(columnsToUse);
			handleConfigChange('systemColumns', columnsToUse);
		}
	}, [selectedSystemColumns]);

	// 9. Cleanup khi component unmount
	useEffect(() => {
		return () => {
			// Cleanup resources nếu cần
		};
	}, []);

	const handleConfirmSelectDriveFile = async () => {
		setDriveLoading(true);
		try {
			// Multi-file flow
			if (config.googleDriveMultiFiles) {
				if (!Array.isArray(selectedDriveFileIds) || selectedDriveFileIds.length === 0) {
					message.error('Vui lòng chọn ít nhất một file!');
					return;
				}
				// Sắp xếp theo thứ tự cấu hình nếu có
				const orderMap = (config.googleDriveOrder || {});
				const filesOrdered = [...selectedDriveFileIds].sort((a, b) => {
					const oa = Number(orderMap[a] ?? 0);
					const ob = Number(orderMap[b] ?? 0);
					return oa - ob;
				});

				let mergedData = [];
				let mergedColumns = null;
				for (const fileId of filesOrdered) {
					const meta = driveFileMeta[fileId] || {};
					const selectedSheet = meta.selectedSheet;
					const headerRow = Number(meta.headerRow || 1);
					if (!selectedSheet || !headerRow) continue;

					const res = await n8nWebhookGoogleDrive({ googleDriveUrl: fileId, email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com' });
					if (!(res && res.success && res.sheets)) continue;
					const matrix = res.sheets[selectedSheet]?.data || [];
					const headerRowIndex = Math.max(0, headerRow - 1);
					const headerRowArr = matrix[headerRowIndex] || [];
					const dataRows = matrix.slice(headerRowIndex + 1);
					const columns = headerRowArr
						.filter(h => h !== undefined && h !== null && String(h).trim() !== '')
						.map((h, idx) => ({ name: String(h), key: String(h) || `col_${idx}` }));

					if (!mergedColumns) mergedColumns = columns;
					const rows = dataRows.map(row => {
						const obj = {};
						(mergedColumns || columns).forEach((col, idx) => { obj[col.name] = row?.[idx]; });
						return obj;
					});
					const orderIndex = Number(orderMap[fileId] ?? 0);
					// rows.forEach(r => { r.__fileId = fileId; r.__fileOrder = orderIndex; });
					mergedData = mergedData.concat(rows);
				}

				if (!mergedColumns) {
					message.error('Không có dữ liệu hợp lệ từ các file đã chọn');
					return;
				}

            setDriveColumns(mergedColumns);
            setDriveData(mergedData);
            // Persist into config so modal validations and save flow recognize fetched data
            handleConfigChange('googleDriveData', mergedData);
            handleConfigChange('googleDriveColumns', mergedColumns);
            handleConfigChange('googleDriveOrder', driveOrderMap || {});
            // Persist per-file meta and names for downstream views
            const idToName = new Map((driveFileList || []).map(f => [f.id, f.name]));
            const filesInfo = (selectedDriveFileIds || []).map(fid => ({
                id: fid,
                name: idToName.get(fid) || fid,
                selectedSheet: driveFileMeta[fid]?.selectedSheet || null,
                headerRow: driveFileMeta[fid]?.headerRow || null,
                order: Number((driveOrderMap || {})[fid] ?? 0)
            })).sort((a,b)=>a.order-b.order);
            handleConfigChange('googleDriveFilesInfo', filesInfo);
            // handleConfigChange('googleDriveFilesMeta', driveFileMeta || {});
            handleConfigChange('uploadType', 'googleDrive');
				setIsDriveFileModalVisible(false);
				message.success(`Đã nhập ${mergedData.length} dòng từ ${filesOrdered.length} file`);
				return;
			}

			// Single-file flow (giữ nguyên)
			if (!selectedDriveFileId) {
				message.error('Vui lòng chọn một file!');
				return;
			}
			const picked = (driveFileList || []).find(f => f.id === selectedDriveFileId);
			handleConfigChange('googleDriveSelectedFileName', picked?.name || '');
			handleConfigChange('googleDriveFileId', selectedDriveFileId);
			const res = await n8nWebhookGoogleDrive({ googleDriveUrl: selectedDriveFileId, email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com' });
			if (res && res.success && res.sheets && Array.isArray(res.sheetNames)) {
				setDriveSheetsMap(res.sheets);
				setDriveSheetNames(res.sheetNames);
				const firstSheet = res.sheetNames[0];
				setSelectedDriveSheet(firstSheet);
				const matrix = (res.sheets[firstSheet] && res.sheets[firstSheet].data) || [];
				setDriveRawData(matrix);
				setDriveStep('selectHeader');
				setIsDriveModalVisible(true);
				setIsDriveFileModalVisible(false);
				message.success(`Đã tải thành công ${res.sheetNames.length} sheet`);
			} else if (res.success && res.rawData && res.sheetNames) {
				const jsonData = res.rawData;
				const sheetNames = res.sheetNames;
				if (jsonData.length > 0) {
					setDriveRawData(jsonData);
					setDriveSheetNames(sheetNames);
					setSelectedDriveSheet(sheetNames[0]);
					setDriveStep('selectHeader');
					setIsDriveModalVisible(true);
					setIsDriveFileModalVisible(false);
					message.success(`Đã tải thành công file`);
				} else {
					message.warning('Không tìm thấy dữ liệu trong file Excel');
				}
			} else if (res.success && res.n8nResponse && Array.isArray(res.n8nResponse)) {
				const jsonData = res.n8nResponse;
				if (jsonData.length > 0) {
					setDriveRawData(jsonData);
					setDriveSheetNames(['Sheet1']);
					setSelectedDriveSheet('Sheet1');
					setDriveStep('selectHeader');
					setIsDriveModalVisible(true);
					setIsDriveFileModalVisible(false);
					message.success(`Đã tải thành công file Excel với ${jsonData.length} dòng dữ liệu`);
				} else {
					message.warning('Không tìm thấy dữ liệu trong file Excel');
				}
			} else {
				message.error('Không thể parse file Excel đã chọn');
			}
		} catch (error) {
			message.error('Có lỗi khi tải file từ Google Drive!');
		} finally {
			setDriveLoading(false);
		}
	};

	// Render Google Drive Folder import
	const renderGoogleDriveFolder = () => (
		<Card title="Google Drive Folder & Tự động tổng hợp" size="small">
			<Space direction="vertical" style={{ width: '100%' }}>
				{/* Folder URL */}
				<div>
					<label style={{ display: 'block', marginBottom: 4 }}>Link Google Drive Folder:</label>
					<Input
						value={googleDriveFolderUrl}
						onChange={(e) => {
							setGoogleDriveFolderUrl(e.target.value);
							handleConfigChange('googleDriveFolderUrl', e.target.value);
						}}
						placeholder="https://drive.google.com/drive/folders/..."
						prefix={<FolderOutlined />}
					/>
				</div>

				{/* File Name Condition */}
				<div>
					<label style={{ display: 'block', marginBottom: 4 }}>Điều kiện tên file:</label>
					<Input
						value={fileNameCondition}
						onChange={(e) => {
							setFileNameCondition(e.target.value);
							handleConfigChange('fileNameCondition', e.target.value);
						}}
						placeholder="Ví dụ: *.xlsx, report_*.csv, hoặc để trống để lấy tất cả"
					/>
				</div>

				{/* Last Update Condition */}
				<div>
					<label style={{ display: 'block', marginBottom: 4 }}>Điều kiện thời gian cập nhật:</label>
					<Select
						value={lastUpdateCondition}
						onChange={(value) => {
							setLastUpdateCondition(value);
							handleConfigChange('lastUpdateCondition', value);
						}}
						style={{ width: '100%' }}
						placeholder="Chọn điều kiện thời gian"
					>
						<Option value="">Tất cả file</Option>
						<Option value="1d">Cập nhật trong 1 ngày</Option>
						<Option value="7d">Cập nhật trong 7 ngày</Option>
						<Option value="30d">Cập nhật trong 30 ngày</Option>
					</Select>
				</div>

				{/* Frequency Configuration */}
				<div>
					<label style={{ display: 'block', marginBottom: 4 }}>Tần suất tự động cập nhật:</label>
					<Space>
						<Select
							value={frequencyHours}
							onChange={(value) => {
								setFrequencyHours(value);
								handleConfigChange('frequencyHours', value);
							}}
							style={{ width: 120 }}
						>
							<Option value={3}>3 giờ</Option>
							<Option value={6}>6 giờ</Option>
							<Option value={12}>12 giờ</Option>
							<Option value={24}>24 giờ</Option>
						</Select>
						<Switch
							checked={isFrequencyActive}
							onChange={(checked) => {
								setIsFrequencyActive(checked);
								handleConfigChange('isFrequencyActive', checked);
							}}
							checkedChildren="Bật"
							unCheckedChildren="Tắt"
						/>
					</Space>
				</div>

				{/* Data Processing Configuration */}
				<Divider orientation="left">Cấu hình xử lý dữ liệu</Divider>

				{/* Header Row */}
				<div>
					<label style={{ display: 'block', marginBottom: 4 }}>Hàng làm header:</label>
					<InputNumber
						value={headerRow}
						onChange={(value) => {
							setHeaderRow(value);
							handleConfigChange('headerRow', value);
						}}
						min={1}
						style={{ width: '100%' }}
						placeholder="Số thứ tự hàng (bắt đầu từ 1)"
					/>
				</div>

				{/* Merge Columns */}
				<div>
					<label style={{ display: 'block', marginBottom: 4 }}>Merge các cột trùng tên:</label>
					<Button 
						type="dashed" 
						onClick={() => {
							const newMergeColumns = [...mergeColumns, { sourceColumns: [], targetColumn: '', mergeType: 'concat' }];
							setMergeColumns(newMergeColumns);
							handleConfigChange('mergeColumns', newMergeColumns);
						}}
						icon={<PlusOutlined />}
						style={{ width: '100%' }}
					>
						Thêm cấu hình merge
					</Button>
					{mergeColumns.map((merge, index) => (
						<Card key={index} size="small" style={{ marginTop: 8 }}>
							<Space direction="vertical" style={{ width: '100%' }}>
								<Input
									placeholder="Tên cột đích"
									value={merge.targetColumn}
									onChange={(e) => {
										const newMerge = [...mergeColumns];
										newMerge[index].targetColumn = e.target.value;
										setMergeColumns(newMerge);
										handleConfigChange('mergeColumns', newMerge);
									}}
								/>
								<Select
									mode="tags"
									placeholder="Chọn cột nguồn"
									value={merge.sourceColumns}
									onChange={(values) => {
										const newMerge = [...mergeColumns];
										newMerge[index].sourceColumns = values;
										setMergeColumns(newMerge);
										handleConfigChange('mergeColumns', newMerge);
									}}
									style={{ width: '100%' }}
								/>
								<Select
									value={merge.mergeType}
									onChange={(value) => {
										const newMerge = [...mergeColumns];
										newMerge[index].mergeType = value;
										setMergeColumns(newMerge);
										handleConfigChange('mergeColumns', newMerge);
									}}
									style={{ width: '100%' }}
								>
									<Option value="concat">Nối chuỗi</Option>
									<Option value="sum">Tổng số</Option>
									<Option value="first">Lấy giá trị đầu</Option>
									<Option value="last">Lấy giá trị cuối</Option>
								</Select>
								<Button 
									danger 
									size="small" 
									onClick={() => {
										const newMerge = mergeColumns.filter((_, i) => i !== index);
										setMergeColumns(newMerge);
										handleConfigChange('mergeColumns', newMerge);
									}}
									icon={<DeleteOutlined />}
								>
									Xóa
								</Button>
							</Space>
						</Card>
					))}
				</div>

				{/* Remove Duplicate Columns */}
				<div>
					<label style={{ display: 'block', marginBottom: 4 }}>Cột để remove duplicate:</label>
					<Button 
						type="dashed" 
						onClick={() => {
							const newRemoveDuplicateColumns = [...removeDuplicateColumns, ''];
							setRemoveDuplicateColumns(newRemoveDuplicateColumns);
							handleConfigChange('removeDuplicateColumns', newRemoveDuplicateColumns);
						}}
						icon={<PlusOutlined />}
						style={{ width: '100%' }}
					>
						Thêm cột remove duplicate
					</Button>
					{removeDuplicateColumns.map((column, index) => (
						<Card key={index} size="small" style={{ marginTop: 8 }}>
							<Space>
								<Input
									placeholder="Tên cột định danh"
									value={column}
									onChange={(e) => {
										const newColumns = [...removeDuplicateColumns];
										newColumns[index] = e.target.value;
										setRemoveDuplicateColumns(newColumns);
										handleConfigChange('removeDuplicateColumns', newColumns);
									}}
									style={{ width: 300 }}
								/>
								<Button 
									danger 
									size="small" 
									onClick={() => {
										const newColumns = removeDuplicateColumns.filter((_, i) => i !== index);
										setRemoveDuplicateColumns(newColumns);
										handleConfigChange('removeDuplicateColumns', newColumns);
									}}
									icon={<DeleteOutlined />}
								>
									Xóa
								</Button>
							</Space>
						</Card>
					))}
				</div>

				{/* Sort Columns */}
				<div>
					<label style={{ display: 'block', marginBottom: 4 }}>Sắp xếp dữ liệu:</label>
					<Button 
						type="dashed" 
						onClick={() => {
							const newSortColumns = [...sortColumns, { column: '', direction: 'desc' }];
							setSortColumns(newSortColumns);
							handleConfigChange('sortColumns', newSortColumns);
						}}
						icon={<PlusOutlined />}
						style={{ width: '100%' }}
					>
						Thêm cột sắp xếp
					</Button>
					{sortColumns.map((sort, index) => (
						<Card key={index} size="small" style={{ marginTop: 8 }}>
							<Space>
								<Input
									placeholder="Tên cột"
									value={sort.column}
									onChange={(e) => {
										const newSort = [...sortColumns];
										newSort[index].column = e.target.value;
										setSortColumns(newSort);
										handleConfigChange('sortColumns', newSort);
									}}
									style={{ width: 200 }}
								/>
								<Select
									value={sort.direction}
									onChange={(value) => {
										const newSort = [...sortColumns];
										newSort[index].direction = value;
										setSortColumns(newSort);
										handleConfigChange('sortColumns', newSort);
									}}
									style={{ width: 100 }}
								>
									<Option value="asc">Tăng dần</Option>
									<Option value="desc">Giảm dần</Option>
								</Select>
								<Button 
									danger 
									size="small" 
									onClick={() => {
										const newSort = sortColumns.filter((_, i) => i !== index);
										setSortColumns(newSort);
										handleConfigChange('sortColumns', newSort);
									}}
									icon={<DeleteOutlined />}
								>
									Xóa
								</Button>
							</Space>
						</Card>
					))}
				</div>

				{/* Action Buttons */}
				{/* <Space>
					<Button 
						type="primary" 
						loading={googleDriveFolderLoading}
						onClick={handleFetchGoogleDriveFolderData}
						icon={<ReloadOutlined />}
					>
						Cập nhật ngay
					</Button>
					<Button 
						onClick={() => setIsGoogleDriveFolderModalVisible(true)}
						icon={<SettingOutlined />}
					>
						Xem cấu hình
					</Button>
				</Space> */}
			</Space>
		</Card>
	);

	// Handle fetch Google Drive Folder data
	const handleFetchGoogleDriveFolderData = async () => {
		if (!googleDriveFolderUrl) {
			message.error('Vui lòng nhập link Google Drive Folder');
			return;
		}

		setGoogleDriveFolderLoading(true);
		try {
			// Gọi API để lấy dữ liệu từ Google Drive Folder
			const response = await 	fetchGoogleDriveFolder({
				googleDriveFolderUrl,
				fileNameCondition,
				lastUpdateCondition,
				headerRow,
				mergeColumns,
				removeDuplicateColumns,
				sortColumns
			});

			if (response.data.success) {
				setGoogleDriveFolderData(response.data.data);
				setGoogleDriveFolderColumns(response.data.columns);
				message.success(`Đã lấy ${response.data.data.length} dòng dữ liệu từ ${response.data.fileCount} file`);
			} else {
				message.error(response.data.message || 'Có lỗi xảy ra khi lấy dữ liệu');
			}
		} catch (error) {
			console.error('Error fetching Google Drive Folder data:', error);
			message.error('Có lỗi xảy ra khi lấy dữ liệu');
		} finally {
			setGoogleDriveFolderLoading(false);
		}
	};

	return (
		<div style={{ padding: '16px 0' }}>
			{/* Thông báo validation cho step từ bước 2 trở đi */}
			{currentStepId && currentStepId > 1 && availableColumns.length > 0 && (
				<div style={{
					marginBottom: 16,
					padding: 12,
					backgroundColor: '#fff7e6',
					border: '1px solid #ffd591',
					borderRadius: 6,
					color: '#d46b08',
				}}>
					⚠️ <strong>Lưu ý:</strong> Từ bước {currentStepId} trở đi, dữ liệu upload phải có cấu trúc cột giống
					hệt với bảng hiện tại.
					<br />
					<strong>Cột hiện tại:</strong> {availableColumns.join(', ')}
				</div>
			)}

			<Radio.Group
				value={config.uploadType}
				onChange={(e) => handleConfigChange('uploadType', e.target.value)}
				style={{ marginBottom: 16 }}
			>
				<Space direction="vertical">
					<Radio value="excel">
						<Space>
							<FileExcelOutlined style={{ color: '#52c41a' }} />
							Upload Excel File
						</Space>
					</Radio>
					<Radio value="googleSheets">
						<Space>
							<GoogleOutlined style={{ color: '#1890ff' }} />
							Google Sheets
						</Space>
					</Radio>
					<Radio value="googleDrive">
						<Space>
							<CloudOutlined style={{ color: '#722ed1' }} />
							Google Drive
						</Space>
					</Radio>
					<Radio value="googleDriveFolder">
						<Space>
							<FolderOutlined style={{ color: '#52c41a' }} />
							Google Drive Folder & Tự động tổng hợp
						</Space>
					</Radio>
					<Radio value="postgresql">
						<Space>
							<DatabaseOutlined style={{ color: '#13c2c2' }} />
							PostgreSQL
						</Space>
					</Radio>
					<Radio value="api">
						<Space>
							<ApiOutlined style={{ color: '#fa8c16' }} />
							API Connector
						</Space>
					</Radio>
					<Radio value="system">
						<Space style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<DatabaseZap style={{ color: '#faad14' }} size={16} />
							Import từ hệ thống
						</Space>
					</Radio>
			
					<Radio value="htqc">
						<Space>
							<CloudOutlined style={{ color: '#0958d9' }} />
							Lấy từ app HTQC
						</Space>
					</Radio>
				</Space>
			</Radio.Group>

			{config.uploadType === 'excel' && renderExcelUpload()}
			{config.uploadType === 'googleSheets' && renderGoogleSheets()}
			{config.uploadType === 'googleDrive' && renderGoogleDrive()}
			{config.uploadType === 'googleDriveFolder' && renderGoogleDriveFolder()}
			{config.uploadType === 'postgresql' && renderPostgreSQL()}
			{config.uploadType === 'api' && renderApiConnector()}
			{config.uploadType === 'system' && renderSystemImport()}
			{config.uploadType === 'htqc' && (
				<Card title="Lấy từ app HTQC" size="small">
					<Space direction="vertical" style={{ width: '100%' }}>
						<div>
							<label style={{ display: 'block', marginBottom: 4 }}>Loại báo cáo:</label>
							<Select
								style={{ width: '100%' }}
								value={htqcReportType}
								onChange={(v) => {
									setHtqcReportType(v);
									// Reset dữ liệu khi thay đổi loại báo cáo
									setHtqcData([]);
									setHtqcColumns([]);
									// Reset outputColumns
									handleConfigChange('outputColumns', []);
									// Cập nhật htqcReportType vào config
									handleConfigChange('htqcReportType', v);
								}}
								options={[
									{ value: 'tong_quat', label: 'Báo cáo tổng quát' },
									{ value: 'nhom_dv', label: 'Báo cáo nhóm đơn vị' },
									{ value: 'nhom_vv', label: 'Báo cáo nhóm vụ việc' },
								]}
							/>
						</div>
						<div>
							<Button type="primary" onClick={async () => {
								if (htqcReportType === 'tong_quat') {
									await fetchHtqcTongQuat();
									message.success('Đã lấy dữ liệu HTQC - Báo cáo tổng quát');
								} else if (htqcReportType === 'nhom_dv') {
									await fetchHtqcNhomDv();
									message.success('Đã lấy dữ liệu HTQC - Báo cáo nhóm đơn vị');
								} else if (htqcReportType === 'nhom_vv') {
									await fetchHtqcNhomVv();
									message.success('Đã lấy dữ liệu HTQC - Báo cáo nhóm vụ việc');
								} else {
									message.info('Loại báo cáo này sẽ được hỗ trợ sớm.');
								}
							}}>Lấy dữ liệu</Button>
						</div>
						{htqcData.length > 0 && (
							<>
								<div style={{ fontSize: '12px', color: '#52c41a' }}>
									✓ Đã tải {htqcData.length} dòng dữ liệu (HTQC - {htqcReportType})
								</div>
								<Table
									columns={htqcColumns.map(col => ({ title: col, dataIndex: col, key: col }))}
									dataSource={htqcData.slice(0, 10).map((row, idx) => ({ ...row, key: idx }))}
									size="small"
									pagination={false}
									scroll={{ x: true }}
								/>
							</>
						)}
					</Space>
				</Card>
			)}

			{/* Modal for Google Sheets header selection */}
			<Modal
				title="Chọn hàng tiêu đề"
				open={isModalVisible}
				onCancel={() => setIsModalVisible(false)}
				footer={[
					<Button key="cancel" onClick={() => setIsModalVisible(false)}>
						Hủy
					</Button>,
					<Button key="ok" type="primary" onClick={handleModalOk}>
						OK
					</Button>,
				]}
			>
				<div style={{ marginBottom: 16 }}>
					<p>Vui lòng chọn hàng sẽ trở thành tên cột:</p>
					<Select
						style={{ width: '100%' }}
						options={headerOptions}
						value={selectedHeaderRow}
						onChange={handleHeaderRowSelect}
						placeholder="Chọn hàng tiêu đề"
					/>
				</div>
			</Modal>

			{/* Modal for Excel sheet and header selection */}
			<Modal
				title="Chọn Sheet và Hàng tiêu đề"
				open={isExcelModalVisible}
				onCancel={() => {
					setIsExcelModalVisible(false);
					setLoading(false);
				}}
				footer={[
					<Button key="cancel" onClick={() => {
						setIsExcelModalVisible(false);
						setLoading(false);
					}}>
						Hủy
					</Button>,
					<Button key="ok" type="primary" onClick={handleExcelModalOk}>
						OK
					</Button>,
				]}
				width={600}
			>
				<Space direction="vertical" style={{ width: '100%' }}>
					<div>
						<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
							Chọn Sheet:
						</label>
						<Select
							style={{ width: '100%' }}
							options={excelSheets}
							value={selectedSheet}
							onChange={handleExcelSheetSelect}
							placeholder="Chọn sheet"
						/>
						<div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
							File có {excelSheets.length} sheet(s) khả dụng
						</div>
					</div>

					<div>
						<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
							Chọn hàng làm tiêu đề cột:
						</label>
						<Select
							style={{ width: '100%' }}
							options={excelHeaderOptions}
							value={selectedExcelHeaderRow}
							onChange={handleExcelHeaderRowSelect}
							placeholder="Chọn hàng tiêu đề"
						/>
						<div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
							Dữ liệu sẽ được lấy từ các hàng sau hàng tiêu đề được chọn
						</div>
					</div>

				</Space>



			</Modal>

			{/* Modal for Google Drive header selection */}
			<Modal
				title="Chọn Sheet và Hàng tiêu đề - Google Drive"
				open={isDriveModalVisible}
				onCancel={() => setIsDriveModalVisible(false)}
				footer={[
					<Button key="cancel" onClick={() => setIsDriveModalVisible(false)}>
						Hủy
					</Button>,
					<Button key="ok" type="primary" onClick={handleDriveModalOk}>
						OK
					</Button>
				]}
				width={1000}
			>
				<Space direction="vertical" style={{ width: '100%' }}>
					{/* File Info */}
					<div style={{ padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '6px', fontSize: '12px' }}>
						<div><strong>File:</strong> {config.googleDriveSelectedFileName || 'Chưa chọn'}</div>
						<div><strong>File ID:</strong> {config.googleDriveFileId || 'Chưa có'}</div>
					</div>

					{/* Sheet Selection */}
					<div>
						<div style={{ marginBottom: 8, fontWeight: 500 }}>Chọn Sheet:</div>
						<Select
							style={{ width: '100%' }}
							value={selectedDriveSheet}
							onChange={handleDriveSheetSelect}
							options={driveSheetNames.map(name => ({ label: name, value: name }))}
						/>
					</div>

					{/* Header Row Selection */}
					<div>
						<div style={{ marginBottom: 8, fontWeight: 500 }}>Chọn hàng tiêu đề:</div>
						<Select
							style={{ width: '100%' }}
							value={selectedDriveHeaderRow}
							onChange={handleDriveHeaderRowSelect}
							options={driveRawData.slice(0, Math.min(10, driveRawData.length)).map((row, index) => {
								// Handle both array and object formats
								let previewText;
								if (Array.isArray(row)) {
									previewText = row.slice(0, 3).join(' | ');
								} else if (typeof row === 'object') {
									// For XLSX format, show KEYS for first row, VALUES from previous row for others
									if (index === 0) {
										// First row: show keys (original header structure)
										const keys = Object.keys(row).slice(0, 3);
										previewText = keys.join(' | ');
									} else {
										// Other rows: show values from the previous row
										const previousRow = driveRawData[index - 1];
										const values = Object.values(previousRow).slice(0, 3);
										previewText = values.join(' | ');
									}
								} else {
									previewText = String(row);
								}
								return {
									label: `Hàng ${index + 1}: ${previewText}${previewText.length > 50 ? '...' : ''}`,
									value: index
								};
							})}
						/>
					</div>

					{/* Preview */}
					<div>
						<div style={{ marginBottom: 8, fontWeight: 500 }}>Xem trước dữ liệu:</div>
						{(() => {
							// Matrix-based preview using selected header row
							if (!driveRawData || driveRawData.length === 0 || selectedDriveHeaderRow >= driveRawData.length) {
								return <div>Không có dữ liệu để hiển thị</div>;
							}

							const headerRow = driveRawData[selectedDriveHeaderRow] || [];
							// Normalize headers: string, non-empty, unique
							const seen = new Map();
							const normalizedHeaders = headerRow.map((h, idx) => {
								let name = (h === null || h === undefined || String(h).trim() === '') ? `Cột ${idx + 1}` : String(h);
								if (!seen.has(name)) {
									seen.set(name, 1);
									return name;
								}
								const count = seen.get(name) + 1;
								seen.set(name, count);
								return `${name}_${count}`;
							});

							const columns = [
								{ title: '#', dataIndex: 'rowNumber', key: 'rowNumber', width: 60, fixed: 'left' },
								...normalizedHeaders.map((title, index) => ({
									title,
									dataIndex: `col_${index}`,
									key: `col_${index}`,
									width: 120,
									render: (text) => text ?? ''
								}))
							];

							// Include only data rows after the header for preview (next 10 rows)
							const dataSource = driveRawData.slice(selectedDriveHeaderRow + 1, selectedDriveHeaderRow + 1 + 10).map((row, rowIndex) => {
								const actualRowIndex = selectedDriveHeaderRow + 1 + rowIndex;
								const rowData = { key: rowIndex, rowNumber: actualRowIndex + 1 };
								normalizedHeaders.forEach((_, colIndex) => {
									rowData[`col_${colIndex}`] = Array.isArray(row) ? (row[colIndex] ?? '') : '';
								});
								return rowData;
							});

							return (
								<div key={`preview-${selectedDriveHeaderRow}`}>
									<style>
										{`
											.header-row {
												background-color: #e6f7ff !important;
												font-weight: bold;
											}
											.header-row:hover {
												background-color: #bae7ff !important;
											}
										`}
									</style>
									<Table
										columns={columns}
										dataSource={dataSource}
										pagination={false}
										scroll={{ x: 'max-content', y: 300 }}
										size="small"
										bordered
										rowClassName={() => ''}
										style={{ fontSize: '12px' }}
									/>
								</div>
							);
						})()}
					</div>
				</Space>
			</Modal>

			{/* Modal for validation error */}
			<Modal
				title="❌ Lỗi cấu trúc cột"
				open={validationErrorModal}
				onCancel={() => setValidationErrorModal(false)}
				footer={[
					<Button key="ok" type="primary" onClick={() => setValidationErrorModal(false)}>
						Đóng
					</Button>,
				]}
				width={600}
			>
				<div style={{
					whiteSpace: 'pre-line',
					fontFamily: 'monospace',
					fontSize: '14px',
					lineHeight: '1.6',
				}}>
					{validationErrorMessage}
				</div>
			</Modal>

			{/* Modal for selecting a Google Drive file from folder */}
			<Modal
				title="Chọn file từ Google Drive"
				open={isDriveFileModalVisible}
				onCancel={() => setIsDriveFileModalVisible(false)}
				footer={[
					<Button key="cancel" onClick={() => setIsDriveFileModalVisible(false)}>
						Hủy
					</Button>,
                    <Button key="ok" type="primary" onClick={handleConfirmSelectDriveFile} disabled={config.googleDriveMultiFiles ? !(Array.isArray(selectedDriveFileIds) && selectedDriveFileIds.length > 0) : !selectedDriveFileId} loading={driveLoading}>
						Chọn file
					</Button>
				]}
				width={700}
			>



				{config.googleDriveMultiFiles && Array.isArray(driveFileList) && driveFileList.length > 0 ? (
					<div style={{ marginTop: 12, padding: 12, border: '1px dashed #d9d9d9', borderRadius: 6 }}>
						<div style={{ fontWeight: 500, marginBottom: 8 }}>Chọn file trong thư mục (có thể chọn nhiều):</div>
						<Checkbox.Group
							value={selectedDriveFileIds}
                            onChange={async (ids) => {
								setSelectedDriveFileIds(ids);
								// Lazy fetch sheet names for newly added IDs
								const newlyAdded = ids.filter(id => !driveFileMeta[id]);
                                // Auto-assign order for new selections
                                const nextOrder = (arr) => (arr.length);
                                setDriveOrderMap(prev => {
                                    const copy = { ...prev };
                                    ids.forEach((id, idx) => {
                                        if (copy[id] === undefined || copy[id] === null) copy[id] = idx + 1;
                                    });
                                    // Remove unselected ids from order map
                                    Object.keys(copy).forEach(k => { if (!ids.includes(k)) delete copy[k]; });
                                    return copy;
                                });
                                if (newlyAdded.length > 0) {
                                    setDriveLoading(true);
                                    try {
                                        const updates = {};
                                        for (const fileId of newlyAdded) {
                                            try {
                                                const metaRes = await n8nWebhookGoogleDrive({ googleDriveUrl: fileId, email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com' });
                                                const sheetNames = metaRes?.sheetNames || Object.keys(metaRes?.sheets || {});
                                                const list = Array.isArray(sheetNames)
                                                    ? sheetNames.map(x => (typeof x === 'string' ? x : (x?.name || x?.title || String(x))))
                                                    : [];
                                                const defaultSheet = list.length > 0 ? list[0] : '';
                                                updates[fileId] = { sheetNames: list, selectedSheet: null, headerRow: null, sheetPreview: {} };
                                            } catch (_) {
                                                updates[fileId] = { sheetNames: [], selectedSheet: null, headerRow: null, sheetPreview: {} };
                                            }
                                        }
                                        setDriveFileMeta(prev => ({ ...prev, ...updates }));
                                    } finally {
                                        setDriveLoading(false);
                                    }
                                }
							}}
							style={{ width: '100%' }}
						>
							<List
								dataSource={driveFileList}
								renderItem={(item) => (
									<List.Item style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<label style={{ display: 'flex', cursor: 'pointer', alignItems: 'center', gap: 8 }}>
											<Checkbox value={item.id} />
											{item.name.toLowerCase().endsWith('.xlsx') ? (
												<FileExcelOutlined style={{ color: '#52c41a', fontSize: 16 }} />
											) : (
												<Table2 size={16} style={{ color: '#52c41a' }} />
											)}
											<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
												{item.name}
											</span>
										</label>
										{/* Per-file selectors when this file is selected */}
                                        {selectedDriveFileIds.includes(item.id) && (
											<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
                                                <InputNumber
                                                    min={1}
                                                    value={driveOrderMap[item.id] || undefined}
                                                    onChange={(val) => {
                                                        setDriveOrderMap(prev => ({ ...prev, [item.id]: Number(val || 1) }));
                                                    }}
                                                    style={{ width: 80 }}
                                                    placeholder="#"
                                                />
												<Select
													style={{ minWidth: 200 }}
													placeholder="Chọn sheet"
													value={driveFileMeta[item.id]?.selectedSheet || undefined}
													onChange={async (val) => {
														setDriveFileMeta(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), selectedSheet: val } }));
														// fetch preview matrix lazily to show header row values
														try {
															setDriveLoading(true);
															const metaRes = await n8nWebhookGoogleDrive({ googleDriveUrl: item.id, email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com' });
															const sheetsMap = metaRes?.sheets || {};
															const matrix = Array.isArray(sheetsMap[val]?.data) ? sheetsMap[val].data : [];
															setDriveFileMeta(prev => ({
																...prev,
																[item.id]: {
																	...(prev[item.id] || {}),
																	sheetPreview: {
																		...((prev[item.id] && prev[item.id].sheetPreview) || {}),
																		[val]: matrix
																	},
																	headerRow: (prev[item.id]?.headerRow && prev[item.id].headerRow > 0) ? prev[item.id].headerRow : 1
																}
															}));
														} catch (_) {
															// ignore
														} finally {
															setDriveLoading(false);
														}
													}}
													disabled={!((driveFileMeta[item.id]?.sheetNames || []).length > 0)}
													options={(driveFileMeta[item.id]?.sheetNames || []).map(name => ({ label: name, value: name }))}
												/>
												<Select
													style={{ width: 140 }}
													placeholder="Dòng header"
													value={driveFileMeta[item.id]?.headerRow || undefined}
													onChange={(val) => {
														setDriveFileMeta(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), headerRow: val } }));
													}}
												disabled={!driveFileMeta[item.id]?.selectedSheet}
													dropdownMatchSelectWidth={false}
													dropdownStyle={{ width: 640, maxWidth: 800 }}
													options={(() => {
														const sel = driveFileMeta[item.id]?.selectedSheet;
														const matrix = sel ? (driveFileMeta[item.id]?.sheetPreview?.[sel] || []) : [];
														const max = Math.min(200, matrix.length || 100);
														const toLabel = (row = []) => {
															const parts = (Array.isArray(row) ? row : []).map(v => (v === null || v === undefined ? '' : String(v))).filter(Boolean).slice(0, 8);
															return parts.length ? parts.join(' | ') : '(trống)';
														};
														return Array.from({ length: max }, (_, i) => ({
															label: `Dòng ${i + 1}: ${toLabel(matrix[i])}`,
															value: i + 1
														}));
													})()}
												/>
											</div>
										)}
									</List.Item>
								)}
							/>
						</Checkbox.Group>
					</div>
				) :
					(<>
						<Space direction="vertical" style={{ width: '100%' }}>
							<div style={{ fontSize: '12px', color: '#666' }}>Hãy chọn một file Excel (.xlsx) từ thư mục:</div>
							<Radio.Group
								value={selectedDriveFileId}
								onChange={(e) => setSelectedDriveFileId(e.target.value)}
								style={{ width: '100%' }}
							>
								<List

									dataSource={driveFileList || []}
									renderItem={(item) => (
										<List.Item style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<label style={{ display: 'flex', cursor: 'pointer' }}>
												<Radio value={item.id} />
												<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, border: '1px solid #f0f0f0', borderRadius: 6 }}>
													{item.name.toLowerCase().endsWith('.xlsx') ? (
														<FileExcelOutlined style={{ color: '#52c41a', fontSize: 16 }} />
													) : (
														<Table2 size={16} style={{ color: '#52c41a' }} />
													)}
													<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
														{item.name}
													</span>
												</div>
											</label>
										</List.Item>
									)}
								/>
							</Radio.Group>
						</Space>
					</>)
				}
			</Modal>

			{/* Recent Folder Settings Modal for Admin */}
			<Modal
				title="Cài đặt Shared Folders"
				open={isRecentFolderSettingsVisible}
				onCancel={() => {
					setIsRecentFolderSettingsVisible(false);
					handleCancelEdit();
				}}
				width={1000}
				footer={[
					<Button key="close" onClick={() => {
						setIsRecentFolderSettingsVisible(false);
						handleCancelEdit();
					}}>
						Đóng
					</Button>
				]}
				centered
			>
				<div style={{ height: '80vh', overflowY: 'auto' }}>
					<div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
						<div style={{ fontWeight: 500, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span>Hướng dẫn:</span>
							{(isAdmin || isSuperAdmin) && (
								<Popover
									placement="right"
									trigger="click"
									open={isFolderFormModalVisible && folderFormMode === 'create'}
									onOpenChange={(open) => {
										if (open) {
											openCreateFolderModal();
										} else {
											handleFolderFormCancel();
										}
									}}
									content={(
										<div style={{ display: 'grid', gap: 8, width: 360 }}>
											<div>
												<div style={{ fontWeight: 500, marginBottom: 4 }}>Tên folder</div>
												<Input value={folderFormData.name} onChange={(e) => handleFolderFormChange('name', e.target.value)} placeholder="Nhập tên" />
											</div>
											<div>
												<div style={{ fontWeight: 500, marginBottom: 4 }}>Link folder</div>
												<Input value={folderFormData.link} onChange={(e) => handleFolderFormChange('link', e.target.value)} placeholder="https://drive.google.com/..." />
											</div>
											<div>
												<div style={{ fontWeight: 500, marginBottom: 4 }}>UserClass (có thể chọn nhiều)</div>
												<Select
													mode="multiple"
													value={folderFormData.userClass}
													onChange={(vals) => handleFolderFormChange('userClass', vals)}
													options={userClassList.map(uc => ({ label: uc.name, value: uc.id }))}
													style={{ width: '100%' }}
													placeholder="Chọn userClass"
												/>
											</div>
											<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
												<Button size="small" onClick={handleFolderFormCancel}>Hủy</Button>
												<Button size="small" type="primary" onClick={handleFolderFormSave}>Tạo mới</Button>
											</div>
										</div>
									)}
								>
									<Button size="small" type="primary">Tạo mới</Button>
								</Popover>
							)}
						</div>
						<div style={{ fontSize: '12px', color: '#666' }}>
							- UserClass xác định ai có thể xem folder này
							<br />
							- Admin có thể xem/tạo/sửa folders tại đây
						</div>
					</div>

					<Table
						dataSource={recentFolders}
						columns={[
							{
								title: 'Tên Folder',
								dataIndex: 'name',
								key: 'name',
								render: (text, record) => {
									if (editingFolder?.id === record.id) {
										return (
											<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<FolderOutlined />
												<Input
													value={editingFolderName}
													onChange={(e) => setEditingFolderName(e.target.value)}
													onPressEnter={() => handleUpdateFolderName(record.id, editingFolderName)}
													style={{ maxWidth: '200px' }}
													autoFocus
												/>


											</div>
										);
									}
									return (
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<FolderOutlined />
											<span
												style={{
													maxWidth: '200px',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													cursor: 'pointer',
													padding: '4px 8px',
													borderRadius: '4px'
												}}
												title={text}
											// onClick={() => handleStartEditFolderName(record)}
											>
												{text}
											</span>
										</div>
									);
								}
							},
							{
								title: 'UserClass',
								dataIndex: 'userClass',
								key: 'userClass',
								render: (userClassIds, record) => {
									if (editingFolder?.id === record.id) {
										return (
											<Select
												mode="multiple"
												value={Array.isArray(userClassIds) ? userClassIds : [userClassIds]}
												// onChange={(value) => handleUpdateFolderUserClass(record.id, value)}
												style={{ width: '100%' }}
												options={userClassList.map(uc => ({
													label: uc.name,
													value: uc.id
												}))}
												placeholder="Chọn userClass"
											/>
										);
									}

									// Display userClass names
									const displayUserClasses = () => {
										if (Array.isArray(userClassIds)) {
											return userClassIds.map(id => {
												const userClass = userClassList.find(uc => uc.id === id);
												return userClass?.name || id;
											}).join(', ');
										} else {
											const userClass = userClassList.find(uc => uc.id === userClassIds);
											return userClass?.name || userClassIds;
										}
									};

									return (
										<span
											style={{
												cursor: 'pointer',
												padding: '4px 8px',
												backgroundColor: '#f0f0f0',
												borderRadius: '4px',
												display: 'inline-block',
												maxWidth: '200px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap'
											}}
											title={displayUserClasses()}
											onClick={() => setEditingFolder(record)}
										>
											{displayUserClasses()}
										</span>
									);
								}
							},
							{
								title: 'Sử dụng lần cuối',
								dataIndex: 'usedAt',
								key: 'usedAt',
								render: (date) => new Date(date).toLocaleString('vi-VN')
							},
							{
								title: 'Thao tác',
								key: 'actions',
								render: (_, record) => (
									<Space>
										{(isAdmin || isSuperAdmin) && (
											<>
												<Popover
													placement="right"
													trigger="click"
													open={isFolderFormModalVisible && folderFormMode === 'edit' && folderFormData?.id === record.id}
													onOpenChange={(open) => {
														if (open) {
															openEditFolderModal(record);
														} else {
															handleFolderFormCancel();
														}
													}}
													content={(
														<div style={{ display: 'grid', gap: 8, width: 360 }}>
															<div>
																<div style={{ fontWeight: 500, marginBottom: 4 }}>Tên folder</div>
																<Input value={folderFormData.name} onChange={(e) => handleFolderFormChange('name', e.target.value)} placeholder="Nhập tên" />
															</div>
															<div>
																<div style={{ fontWeight: 500, marginBottom: 4 }}>Link folder</div>
																<Input value={folderFormData.link} onChange={(e) => handleFolderFormChange('link', e.target.value)} placeholder="https://drive.google.com/..." />
															</div>
															<div>
																<div style={{ fontWeight: 500, marginBottom: 4 }}>UserClass (có thể chọn nhiều)</div>
																<Select
																	mode="multiple"
																	value={folderFormData.userClass}
																	onChange={(vals) => handleFolderFormChange('userClass', vals)}
																	options={userClassList.map(uc => ({ label: uc.name, value: uc.id }))}
																	style={{ width: '100%' }}
																	placeholder="Chọn userClass"
																/>
															</div>
															<div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
																<Popconfirm title="Xóa folder này?" okText="Xóa" cancelText="Hủy" onConfirm={() => handleDeleteFolder(record.id)}>
																	<Button size="small" danger icon={<DeleteOutlined />} />
																</Popconfirm>
																<div style={{ display: 'flex', gap: 8 }}>
																	<Button size="small" onClick={handleFolderFormCancel}>Hủy</Button>
																	<Button size="small" type="primary" onClick={handleFolderFormSave}>Lưu</Button>
																</div>
															</div>
														</div>
													)}
												>
													<Button size="small">Sửa</Button>
												</Popover>
												<Popconfirm title="Xóa folder này?" okText="Xóa" cancelText="Hủy" onConfirm={() => handleDeleteFolder(record.id)}>
													<Button size="small" danger icon={<DeleteOutlined />} />
												</Popconfirm>
											</>
										)}
									</Space>
								)
							}
						]}
						pagination={{ pageSize: 10 }}
						size="small"
					/>
				</div>

				{/* Modal: Create/Edit Recent Folder */}
				{/* <Modal
				title={folderFormMode === 'create' ? 'Tạo Recent Folder' : 'Sửa Recent Folder'}
				open={isFolderFormModalVisible}
				onCancel={handleFolderFormCancel}
				onOk={handleFolderFormSave}
				okText={folderFormMode === 'create' ? 'Tạo mới' : 'Lưu'}
				width={600}
			>
				<div style={{ display: 'grid', gap: 12 }}>
					<div>
						<div style={{ fontWeight: 500, marginBottom: 4 }}>Tên folder</div>
						<Input value={folderFormData.name} onChange={(e) => handleFolderFormChange('name', e.target.value)} placeholder="Nhập tên" />
					</div>
					<div>
						<div style={{ fontWeight: 500, marginBottom: 4 }}>Link folder</div>
						<Input value={folderFormData.link} onChange={(e) => handleFolderFormChange('link', e.target.value)} placeholder="https://drive.google.com/..." />
					</div>
					<div>
						<div style={{ fontWeight: 500, marginBottom: 4 }}>UserClass (có thể chọn nhiều)</div>
						<Select
							mode="multiple"
							value={folderFormData.userClass}
							onChange={(vals) => handleFolderFormChange('userClass', vals)}
							options={userClassList.map(uc => ({ label: uc.name, value: uc.id }))}
							style={{ width: '100%' }}
							placeholder="Chọn userClass"
						/>
					</div>
				</div>
			</Modal> */}

			</Modal>
		</div>
	);
};

export default UploadConfig; 