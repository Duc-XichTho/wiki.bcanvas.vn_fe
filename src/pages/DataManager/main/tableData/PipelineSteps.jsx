import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postgresService } from '../../../../apis/postgresService.jsx';
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Dropdown,
    Input,
    InputNumber,
    List,
    message,
    Modal,
    Popconfirm,
    Radio,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Tooltip,
} from 'antd';
import {
    DeleteOutlined,
    ExclamationCircleOutlined,
    GoogleOutlined,
    ImportOutlined,
    InboxOutlined,
    InfoCircleOutlined,
    LinkOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    SettingOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import Dragger from 'antd/es/upload/Dragger.js';
import { Link } from 'lucide-react';
import Draggable from 'react-draggable';
import {
    createNewApprovedVersion,
    deleteApprovedVersion,
    getAllApprovedVersion,
} from '../../../../apis/approvedVersionTemp.jsx';
import { createRecentFolder } from '../../../../apis/recentFolderService.jsx';
import { getAllUserClass } from '../../../../apis/userClassService.jsx';
import {
    createBathTemplateRow,
    createTemplateColumn,
    deleteTemplateRow,
    deleteTemplateRowByTableId,
    getTemplateInfoByTableId,
    processStepData,
    updateTemplateTable,
} from '../../../../apis/templateSettingService.jsx';
import {
    exportTableToGoogleSheets,
    n8nWebhook,
    n8nWebhookGetFileFromGoogleDrive,
    n8nWebhookGoogleDrive,
} from '../../../../apis/n8nWebhook.jsx';
import { checkColumnLimit, checkUploadLimits } from '../../../../utils/uploadLimitUtils.js';
import styles from './PipelineSteps.module.css';
import { MyContext } from '../../../../MyContext.jsx';
import fileNoteQueueService from '../../../../services/FileNoteQueueService.js';
import UploadConfig from '../stepConfig/UploadConfig.jsx';
import {
    configComponentMap,
    generateAIConditions,
    getStepSummary,
    Option,
    stepTypeName,
} from './logic/LogicPipeLine.js';
import AddStepModal from './components/AddStepModal.jsx';
// Fallback functions nếu simple-statistics không load được
import { fetchGoogleDriveFolder } from '../../../../apis/googleDriveFolderService.jsx';
import {
    createFrequencyConfig,
    deleteFrequencyConfig,
    getFrequencyConfigByTableId,
    updateFrequencyConfig,
} from '../../../../apis/frequencyConfigService.jsx';

const PipelineSteps = ({
    steps = [],
    onChange,
    availableColumns = [],
    availableTables = [],
    referenceTableColumns = [],
    templateData = null,
    onDataUpdate = null,
    onStepClick = null, // Thêm prop để handle click vào step
    hasData = true, // Thêm prop để kiểm tra có dữ liệu hay không
    onStepStatusUpdate = null, // Thêm prop để cập nhật status step
    update,
    onInputStepChange = null, // Callback để cập nhật inputColumns từ parent
    getTemplateRow = null, // Function để lấy dữ liệu template
    onStepRunComplete = null, // Callback khi step chạy xong để cập nhật selectedStepId
    idFileNote = null,
    selectedStepId = null, // Thêm prop để nhận step đang chọn
    onErrorFilter = null, // Thêm prop để handle filter lỗi
    checkStepErrors = null, // Thêm prop để kiểm tra lỗi của step
    checkRunningStep = null,
    autorun = false, // Thêm prop để kiểm tra trạng thái autorun
    // Thêm props cho batch processing
    isTestMode = false, // Chế độ thử nghiệm
    isBatchRunning = false, // Đang chạy batch
    totalRows = 0, // Tổng số dòng dữ liệu
    runningFileNotes = new Set(), // Danh sách file đang chạy
    setRunningFileNotes = null, // Function để cập nhật danh sách file đang chạy
}) => {
    const navigate = useNavigate();
    const {
        currentUser,
        runningStep,
        setRunningStep,
        fileNoteQueue,
        isProcessingQueue,
        currentRunningFileNote,
        currentSchemaPathRecord
    } = useContext(MyContext);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addStepType, setAddStepType] = useState(null);
    const [tempConfig, setTempConfig] = useState({});
    const [showEditModal, setShowEditModal] = useState(false);
    const [editIdx, setEditIdx] = useState(null);
    const [aiTransformerTestStatus, setAiTransformerTestStatus] = useState(false);
    // Thêm state để kiểm soát loading khi lưu dữ liệu upload
    const [uploadSaving, setUploadSaving] = useState(false);
    // State để theo dõi tiến trình xử lý AI Transformer
    const [aiProcessingProgress, setAiProcessingProgress] = useState({
        stepId: null,
        current: 0,
        total: 0,
        message: '',
    });
    const [inputColumns, setInputColumns] = useState(availableColumns);
    const [inputColumnsLoading, setInputColumnsLoading] = useState(false);
    const [listApprovedVersion, setListApprovedVersion] = useState([]);
    // State cho modal xuất bản
    const [publishModal, setPublishModal] = useState({ visible: false, stepId: null, name: '' });
    const [showImportMoreDataModal, setShowImportMoreDataModal] = useState(false);
    
    // AI Transformer run options modal state
    const [aiTransformerRunModal, setAiTransformerRunModal] = useState({
        visible: false,
        stepIndex: null,
        step: null,
        runMode: 'full', // 'full', 'filtered', 'empty_only'
        filterConditions: [],
        filterMode: 'include'
    });
    // State cho modal xuất Google Sheets
    const [googleSheetsModal, setGoogleSheetsModal] = useState({
        visible: false,
        stepId: null,
        sheetUrl: '',
        loading: false
    });

    // States cho import thêm dữ liệu
    const [importMoreDataConfig, setImportMoreDataConfig] = useState({
        uploadType: 'excel',
        file: null,
        googleSheetUrl: '',
        googleSheetsHeaderRow: 0,
        outputColumns: [],
        googleDriveUrl: '',
        googleDriveFileId: '',
        googleDriveSheet: '',
        googleDriveHeaderRow: 0,
        googleDriveSelectedFileName: '',
        importMode: 'add_new', // 'add_new' | 'replace_all'
        duplicateCheck: false,
        duplicateKeys: [],
        duplicateAction: 'keep_both', // 'skip' | 'replace' | 'keep_both'
        isGoogleSheetSource: false,
        isGoogleDriveSource: false,
        isGoogleDriveFolderSource: false,
        isPostgresSource: false,
        postgresConfig: {},
        intervalUpdate: 0,
        lastUpdate: null,
    });
    const [importedMoreData, setImportedMoreData] = useState([]);
    const [importedMoreColumns, setImportedMoreColumns] = useState([]);
    const [importMoreLoading, setImportMoreLoading] = useState(false);
    const [importMoreProgress, setImportMoreProgress] = useState(0);
    const [originalDataColumns, setOriginalDataColumns] = useState([]);
    const [originalData, setOriginalData] = useState([]); // Lưu trữ dữ liệu gốc ban đầu

    // States cho draggable modal
    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const draggleRef = useRef(null);

    // States cho AI config cache
    const [aiConfigCache, setAiConfigCache] = useState({});
    const [aiProcessingSteps, setAiProcessingSteps] = useState(new Set());

    // State để lưu trữ config ban đầu cho so sánh
    const [initialConfigs, setInitialConfigs] = useState({});
    // State để lưu trữ config hiện tại đang được chỉnh sửa
    const [currentConfigs, setCurrentConfigs] = useState({});

    // State để track modal key - force re-render components
    const [modalKey, setModalKey] = useState(0);
    const theme = localStorage.getItem('theme') || 'light';
    // Removed socket listener here; handled in MainContentDM.jsx to avoid duplicate messages
    // State cho modal hiển thị chi tiết lỗi

    // States for Excel sheet/header selection (Import More)
    const [importMoreExcelSheets, setImportMoreExcelSheets] = useState([]);
    const [importMoreSelectedSheet, setImportMoreSelectedSheet] = useState('');
    const [importMoreExcelRawData, setImportMoreExcelRawData] = useState([]);
    const [importMoreSelectedHeaderRow, setImportMoreSelectedHeaderRow] = useState(0);
    const [importMoreExcelHeaderOptions, setImportMoreExcelHeaderOptions] = useState([]);
    const [isImportMoreExcelModalVisible, setIsImportMoreExcelModalVisible] = useState(false);
    const [importMoreExcelWorkbook, setImportMoreExcelWorkbook] = useState(null);
    const [showStepSelector, setShowStepSelector] = useState(true);
    // Reset File (Excel) flow states
    const [isResetExcelModalVisible, setIsResetExcelModalVisible] = useState(false);
    const [resetExcelWorkbook, setResetExcelWorkbook] = useState(null);
    const [resetExcelSheets, setResetExcelSheets] = useState([]);
    const [resetSelectedSheet, setResetSelectedSheet] = useState('');
    const [resetExcelRawData, setResetExcelRawData] = useState([]);
    const [resetHeaderOptions, setResetHeaderOptions] = useState([]);
    const [resetSelectedHeaderRow, setResetSelectedHeaderRow] = useState(0);
    const [resetConfirmVisible, setResetConfirmVisible] = useState(false);
    const [resetUploading, setResetUploading] = useState(false);
    const [resetTargetStepIndex, setResetTargetStepIndex] = useState(null);
    const [resetPreparedConfig, setResetPreparedConfig] = useState({});
    const [resetModalKey, setResetModalKey] = useState(0);
    // Hàm helper để reset tất cả state về trạng thái mặc định
    const resetAllStates = () => {
        setImportedMoreData([]);
        setImportedMoreColumns([]);
        setOriginalData([]);
        setOriginalDataColumns([]);
        setImportMoreProgress(0);
        setImportMoreLoading(false);
        setImportMoreDataConfig({
            uploadType: 'excel',
            file: null,
            googleSheetUrl: '',
            googleSheetsHeaderRow: 0,
            outputColumns: [],
            googleDriveUrl: '',
            importMode: 'add_new',
            duplicateCheck: false,
            duplicateKeys: [],
            duplicateAction: 'keep_both',
            isGoogleSheetSource: false,
            isPostgresSource: false,
            postgresConfig: {},
            intervalUpdate: 0,
            lastUpdate: null,
        });
    };


    // Hàm xử lý khi bắt đầu kéo modal
    const onStart = (_event, uiData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };

    // Hàm tạo cache key cho AI config
    const generateAICacheKey = (stepId, aiPrompt, targetColumn, dataHash) => {
        return `${stepId}_${aiPrompt}_${targetColumn}_${dataHash}`;
    };

    // Hàm tạo hash đơn giản cho dữ liệu
    const generateDataHash = (data) => {
        if (!data || data.length === 0) return 'empty';
        const sampleData = data.slice(0, 10); // Lấy 10 dòng đầu để tạo hash
        const columns = Object.keys(sampleData[0] || {});
        const uniqueValues = {};

        columns.forEach(col => {
            const values = [...new Set(sampleData.map(row => row[col]).filter(v => v !== null && v !== undefined))];
            uniqueValues[col] = values.slice(0, 5); // Lấy 5 giá trị unique đầu tiên
        });

        return JSON.stringify(uniqueValues);
    };

    // Hàm lấy AI config từ cache hoặc tạo mới
    const getOrCreateAIConfig = async (step, data, config) => {
        const cacheKey = generateAICacheKey(step.id, config.aiPrompt, config.targetColumn, generateDataHash(data));

        // Kiểm tra xem step có needUpdate không
        if (step.needUpdate) {
            // Xóa cache cũ nếu có
            setAiConfigCache(prev => {
                const newCache = { ...prev };
                delete newCache[cacheKey];
                return newCache;
            });
        } else if (aiConfigCache[cacheKey]) {
            return aiConfigCache[cacheKey];
        }

        // Tạo AI config mới
        setAiProcessingSteps(prev => new Set([...prev, step.id]));

        try {
            const aiConditions = await generateAIConditions(data, config.aiPrompt, config.targetColumn, config);

            // Lưu vào cache
            const newConfig = {
                conditions: aiConditions.conditions,
                elseValue: aiConditions.elseValue,
                timestamp: Date.now(),
            };

            setAiConfigCache(prev => ({
                ...prev,
                [cacheKey]: newConfig,
            }));

            return newConfig;
        } catch (error) {
            console.error(`Lỗi khi tạo AI config cho step ${step.id}:`, error);
            throw error;
        } finally {
            setAiProcessingSteps(prev => {
                const newSet = new Set(prev);
                newSet.delete(step.id);
                return newSet;
            });
        }
    };

    // Function to find all userClass data (for filtering by email and module)
    const findAllUserClassIds = async (userEmail) => {
        try {
            console.log('findAllUserClassIds - Getting userClass list for email:', userEmail);
            const response = await getAllUserClass();
            console.log('findAllUserClassIds - Response:', response);

            // Handle both direct array response and object with success/data
            let userClassData;
            if (Array.isArray(response)) {
                userClassData = response.filter(uc => uc.module === 'DASHBOARD');
            } else if (response.success && response.data) {
                userClassData = response.data.filter(uc => uc.module === 'DASHBOARD');
            } else {
                console.log('findAllUserClassIds - No data found, returning empty array');
                return { ids: [], userClassData: [] };
            }

            console.log('findAllUserClassIds - UserClass data:', userClassData);

            // Filter userClasses that contain the user email
            const userClasses = userClassData.filter(uc =>
                uc.userAccess && uc.userAccess.includes(userEmail)
            );
            console.log('findAllUserClassIds - UserClasses containing email:', userClasses);

            // Return all userClass data for further filtering by module
            return { ids: [], userClassData: userClasses };
        } catch (error) {
            console.error('Error finding userClasses:', error);
            return { ids: [], userClassData: [] };
        }
    };

    // Function to save folder to recent folders
    const saveToRecentFolders = async (folderName, folderUrl) => {
        try {
            console.log('saveToRecentFolders called with:', { folderName, folderUrl });

            // Get user info from currentUser context
            const userEmail = currentUser?.email;
            const isAdmin = currentUser?.isAdmin || false;
            const isSuperAdmin = currentUser?.isSuperAdmin || false;

            console.log('Current user info:', { userEmail, isAdmin, isSuperAdmin });

            if (!userEmail) {
                console.warn('No user email found in currentUser, skipping recent folder save');
                return;
            }

            let userClassIds = [];

            // If user is admin or super admin, don't save userClass (empty array)
            if (isAdmin || isSuperAdmin) {
                console.log('User is admin/superadmin, not saving userClass');
                userClassIds = [];
            } else {
                // Find all userClass IDs based on email for regular users
                console.log('Finding userClass IDs for email:', userEmail);
                const result = await findAllUserClassIds(userEmail);
                const userClassData = result.userClassData;
                console.log('Found userClass data:', userClassData);

                // Filter only DASHBOARD module userClasses
                const dashboardUserClasses = userClassData.filter(uc => uc.module === 'DASHBOARD');
                console.log('Dashboard userClasses:', dashboardUserClasses);

                userClassIds = dashboardUserClasses.map(uc => uc.id);
                console.log('UserClass IDs for DASHBOARD:', userClassIds);

                if (userClassIds.length === 0) {
                    console.warn('No DASHBOARD userClasses found for user email, skipping recent folder save');
                    console.log('Available userAccess in userClass:', userClassData?.map(uc => ({ id: uc.id, userAccess: uc.userAccess, module: uc.module })));
                    return;
                }
            }

            const folderData = {
                name: folderName,
                link: folderUrl,
                userClass: userClassIds // Store array of userClass IDs
            };

            console.log('Creating recent folder with data:', folderData);
            const response = await createRecentFolder(folderData);
            console.log('createRecentFolder response:', response);

            if (response.success) {
                console.log('Folder saved to recent folders:', folderName, 'for userClasses:', userClassIds);
            } else {
                console.error('Failed to save folder to recent folders:', response);
            }
        } catch (error) {
            console.error('Error saving to recent folders:', error);
        }
    };

    // Hàm cập nhật needUpdate cho step khi config thay đổi
    const updateStepNeedUpdate = (stepIndex, hasChanges) => {
        if (hasChanges) {
            const currentStep = normalizedSteps[stepIndex];

            const updatedSteps = normalizedSteps.map((step, index) =>
                index === stepIndex ? { ...step, needUpdate: true } : step,
            );
            onChange(updatedSteps);
        }
    };

    // Lấy danh sách xuất bản
    const fetchListApprovedVersion = async () => {
        const res = await getAllApprovedVersion();
        setListApprovedVersion(res);
    };
    useEffect(() => {
        if (idFileNote && templateData && templateData.id) {
            fetchListApprovedVersion();
        }
    }, [idFileNote, templateData]);

    // Migrate dữ liệu cũ để tương thích
    const migrateSteps = (oldSteps) => {
        return oldSteps.map((step, index) => ({
            ...step,
            useCustomInput: step.useCustomInput || false,
            inputStepId: step.inputStepId !== undefined && step.inputStepId !== null
                ? step.inputStepId
                : (index > 0 ? index : null), // Mặc định là step trước đó (hoặc null cho step đầu tiên)
        }));
    };

    // Đảm bảo steps có đầy đủ thuộc tính
    const normalizedSteps = useMemo(() => migrateSteps(steps), [steps]);

    // Chỉ coi là đang chạy khi thuộc đúng filenote đang mở (so khớp theo URL hiện tại, giống ShowData)
    const isRunningForThisFile = useMemo(() => {
        const path = window.location?.pathname || '';
        const match = path.match(/\/data-manager\/data\/(\d+)/);
        const openedId = match ? String(match[1]) : null;
        const sameFileInQueue = currentRunningFileNote && openedId && String(currentRunningFileNote.fileNoteId) == openedId;
        const sameFileInSet = openedId && runningFileNotes && runningFileNotes.has && runningFileNotes.has(openedId);
        const somethingRunning = !!runningStep || !!isBatchRunning;
        console.log('-----------', somethingRunning && (sameFileInSet || sameFileInQueue));
        return somethingRunning && (sameFileInSet || sameFileInQueue);
    }, [runningStep, isBatchRunning, runningFileNotes, currentRunningFileNote, idFileNote]);

    // Lưu initial config khi edit modal mở
    useEffect(() => {
        if (showEditModal && editIdx !== null) {
            const step = normalizedSteps[editIdx];
            if (step && !initialConfigs[editIdx]) {
                setInitialConfigs(prev => ({
                    ...prev,
                    [editIdx]: JSON.parse(JSON.stringify(step.config)), // Deep copy
                }));
            }
        }
    }, [showEditModal, editIdx, normalizedSteps, initialConfigs]);

    // Cập nhật inputColumns khi availableColumns thay đổi
    useEffect(() => {
        setInputColumns(availableColumns);
    }, [availableColumns]);

    // Cập nhật inputColumns khi editIdx thay đổi (khi mở modal sửa bước)
    useEffect(() => {
        const updateInputColumnsForEdit = async () => {
            if (editIdx !== null && normalizedSteps[editIdx]) {
                const step = normalizedSteps[editIdx];
                try {
                    console.log('PipelineSteps - Updating inputColumns for edit step:', { editIdx, step });
                    setInputColumnsLoading(true);
                    const newInputColumns = await getInputColumns(editIdx, step.inputStepId);
                    console.log('PipelineSteps - New inputColumns for edit step:', newInputColumns);
                    setInputColumns(newInputColumns);
                } catch (error) {
                    console.error('Error updating input columns for edit step:', error);
                    setInputColumns(availableColumns);
                } finally {
                    setInputColumnsLoading(false);
                }
            }
        };

        updateInputColumnsForEdit();
    }, [editIdx, templateData, normalizedSteps, getTemplateRow, availableColumns]);

    // Cập nhật inputColumns khi mở modal Add Step
    useEffect(() => {
        const updateInputColumnsForModal = async () => {
            if (showAddModal && !tempConfig.useCustomInput) {
                // Trong modal và chế độ mặc định - cập nhật inputColumns
                try {
                    setInputColumnsLoading(true);
                    const newInputColumns = await getInputColumns(null, null);
                    setInputColumns(newInputColumns);
                } catch (error) {
                    console.error('Error updating input columns:', error);
                    setInputColumns(availableColumns);
                } finally {
                    setInputColumnsLoading(false);
                }
            }
        };

        updateInputColumnsForModal();
    }, [showAddModal, tempConfig.useCustomInput, normalizedSteps.length, templateData, getTemplateRow]);

    // Tự động chọn type 12 (tạo mới) khi chưa có dữ liệu hoặc chưa có bước nào
    useEffect(() => {
        // Nếu chưa có step nào hoặc chưa có dữ liệu, mặc định chọn type 12 (tạo mới)
        if (steps.length === 0) {
            setAddStepType(12);
        } else {
            // Nếu đã có step, reset về null để người dùng chọn
            setAddStepType(null);
        }
    }, [steps.length]);

    // Kiểm tra và thực hiện cập nhật tự động từ Google Sheet
    // useEffect(() => {
    // 	const checkAutoUpdate = async () => {
    // 		const firstStep = normalizedSteps.find(step => step.type === 12);
    // 		if (firstStep && firstStep.config && firstStep.config.enableAutoUpdate && firstStep.config.intervalUpdate > 0) {
    // 			const lastUpdate = firstStep.config.lastUpdate ? new Date(firstStep.config.lastUpdate) : null;
    // 			const now = new Date();

    // 			// Chuyển đổi intervalUpdate từ phút sang milliseconds
    // 			const intervalMs = firstStep.config.intervalUpdate * 60 * 1000;

    // 			if (!lastUpdate || (now - lastUpdate) >= intervalMs) {
    // 				// Xử lý Google Sheets
    // 				if (firstStep.config.uploadType === 'googleSheets') {
    // 					message.info('Đang tự động cập nhật dữ liệu từ Google Sheet...');

    // 					try {
    // 						const res = await n8nWebhook({ urlSheet: firstStep.config.googleSheetUrl });
    // 						if (Array.isArray(res) && res.length > 0 && res[0].data) {
    // 							const rawData = res[0].data;
    // 							const headerRow = rawData[0];
    // 							const data = rawData.slice(1).map(row => {
    // 								const newRow = {};
    // 								headerRow.forEach((header, index) => {
    // 									newRow[header] = row[index];
    // 								});
    // 								return newRow;
    // 							});

    // 							// Thực hiện thay thế toàn bộ dữ liệu
    // 							await performGoogleSheetReplace(data, headerRow);

    // 							// Cập nhật lastUpdate
    // 							const updatedSteps = normalizedSteps.map(step =>
    // 								step.id === firstStep.id
    // 									? { ...step, config: { ...step.config, lastUpdate: new Date().toISOString() } }
    // 									: step,
    // 							);
    // 							onChange(updatedSteps);

    // 							// Lưu vào backend
    // 							const updatedTemplateData = { ...templateData, steps: updatedSteps };
    // 							await updateTemplateTable(updatedTemplateData);

    // 							// Thông báo cho người dùng
    // 							message.success(`Đã tự động cập nhật ${data.length} dòng dữ liệu từ Google Sheet`);

    // 							// Gọi callback để cập nhật dữ liệu hiển thị
    // 							if (onDataUpdate) {
    // 								await onDataUpdate();
    // 							}

    // 							// Gọi callback để cập nhật selectedStepId nếu cần
    // 							if (onStepRunComplete) {
    // 								await onStepRunComplete(firstStep.id);
    // 							}
    // 						}
    // 					} catch (error) {
    // 						console.error('Lỗi khi tự động cập nhật dữ liệu:', error);
    // 						message.error('Lỗi khi tự động cập nhật dữ liệu từ Google Sheet');
    // 					}
    // 				}

    // 				// Xử lý PostgreSQL
    // 				else if (firstStep.config.uploadType === 'postgresql' && firstStep.config.postgresConfig) {
    // 					message.info('Đang tự động cập nhật dữ liệu từ PostgreSQL...');

    // 					try {
    // 						// Lấy dữ liệu từ PostgreSQL thông qua service mới
    // 						const res = await postgresService.getTableData(firstStep.config.postgresConfig);

    // 						if (Array.isArray(res) && res.length > 0) {
    // 							// Thực hiện thay thế toàn bộ dữ liệu
    // 							await performPostgresReplace(res);

    // 							// Cập nhật lastUpdate
    // 							const updatedSteps = normalizedSteps.map(step =>
    // 								step.id === firstStep.id
    // 									? { ...step, config: { ...step.config, lastUpdate: new Date().toISOString() } }
    // 									: step,
    // 							);
    // 							onChange(updatedSteps);

    // 							// Lưu vào backend
    // 							const updatedTemplateData = { ...templateData, steps: updatedSteps };
    // 							await updateTemplateTable(updatedTemplateData);

    // 							// Thông báo cho người dùng
    // 							message.success(`Đã tự động cập nhật ${res.length} dòng dữ liệu từ PostgreSQL`);

    // 							// Gọi callback để cập nhật dữ liệu hiển thị
    // 							if (onDataUpdate) {
    // 								await onDataUpdate();
    // 							}

    // 							// Gọi callback để cập nhật selectedStepId nếu cần
    // 							if (onStepRunComplete) {
    // 								await onStepRunComplete(firstStep.id);
    // 							}
    // 						}
    // 					} catch (error) {
    // 						console.error('Lỗi khi tự động cập nhật dữ liệu PostgreSQL:', error);
    // 						message.error('Lỗi khi tự động cập nhật dữ liệu từ PostgreSQL');
    // 					}
    // 				}

    // 				// Xử lý System Import
    // 				else if (firstStep.config.uploadType === 'system' && firstStep.config.systemConfig) {
    // 					message.info('Đang tự động cập nhật dữ liệu từ hệ thống...');

    // 					try {
    // 						const { templateTableId, stepId } = firstStep.config.systemConfig;
    // 						// Lấy dữ liệu mới từ hệ thống
    // 						let data = await getTemplateRow(templateTableId, stepId, false);
    // 						// Xử lý dữ liệu theo format mới (có thể có { data: {...}, id: ... })
    // 						if (data && Array.isArray(data) && data.length > 0) {
    // 							data = data.map(item => {
    // 								if (item.data && item.id) {
    // 									return {
    // 										...item.data,
    // 										rowId: item.id
    // 									};
    // 								}
    // 								return item;
    // 							});
    // 						}
    // 						if (data && Array.isArray(data) && data.length > 0) {
    // 							// Thực hiện thay thế toàn bộ dữ liệu
    // 							await performSystemReplace(data);

    // 							// Cập nhật lastUpdate
    // 							const updatedSteps = normalizedSteps.map(step =>
    // 								step.id === firstStep.id
    // 									? { ...step, config: { ...step.config, lastUpdate: new Date().toISOString() } }
    // 									: step,
    // 							);
    // 							onChange(updatedSteps);

    // 							// Lưu vào backend
    // 							const updatedTemplateData = { ...templateData, steps: updatedSteps };
    // 							await updateTemplateTable(updatedTemplateData);

    // 							// Thông báo cho người dùng
    // 							message.success(`Đã tự động cập nhật ${data.length} dòng dữ liệu từ hệ thống`);

    // 							// Gọi callback để cập nhật dữ liệu hiển thị
    // 							if (onDataUpdate) {
    // 								await onDataUpdate();
    // 							}

    // 							// Gọi callback để cập nhật selectedStepId nếu cần
    // 							if (onStepRunComplete) {
    // 								await onStepRunComplete(firstStep.id);
    // 							}
    // 						}
    // 					} catch (error) {
    // 						console.error('Lỗi khi tự động cập nhật dữ liệu từ hệ thống:', error);
    // 						message.error('Lỗi khi tự động cập nhật dữ liệu từ hệ thống');
    // 					}
    // 				}

    // 				// Xử lý API
    // 				else if (firstStep.config.uploadType === 'api' && firstStep.config.apiUrl) {
    // 					message.info('Đang tự động cập nhật dữ liệu từ API...');

    // 					try {
    // 						const headers = {};
    // 						if (firstStep.config.apiKey) {
    // 							headers['Authorization'] = `Bearer ${firstStep.config.apiKey}`;
    // 						}

    // 						const response = await fetch(firstStep.config.apiUrl, {
    // 							method: 'GET',
    // 							headers: {
    // 								'Content-Type': 'application/json',
    // 								...headers,
    // 							},
    // 						});

    // 						if (!response.ok) {
    // 							throw new Error(`HTTP error! status: ${response.status}`);
    // 						}

    // 						const data = await response.json();
    // 						// Kiểm tra xem data có phải là array không
    // 						let processedData = data;
    // 						if (Array.isArray(data)) {
    // 							processedData = data;
    // 						} else if (data.data && Array.isArray(data.data)) {
    // 							processedData = data.data;
    // 						} else if (data.results && Array.isArray(data.results)) {
    // 							processedData = data.results;
    // 						} else if (data.items && Array.isArray(data.items)) {
    // 							processedData = data.items;
    // 						} else {
    // 							// Nếu không phải array, chuyển thành array với 1 object
    // 							processedData = [data];
    // 						}

    // 						if (processedData.length > 0) {
    // 							// Thực hiện thay thế toàn bộ dữ liệu
    // 							await performApiReplace(processedData);

    // 							// Cập nhật lastUpdate
    // 							const updatedSteps = normalizedSteps.map(step =>
    // 								step.id === firstStep.id
    // 									? { ...step, config: { ...step.config, lastUpdate: new Date().toISOString() } }
    // 									: step,
    // 							);
    // 							onChange(updatedSteps);

    // 							// Lưu vào backend
    // 							const updatedTemplateData = { ...templateData, steps: updatedSteps };
    // 							await updateTemplateTable(updatedTemplateData);

    // 							// Thông báo cho người dùng
    // 							message.success(`Đã tự động cập nhật ${processedData.length} dòng dữ liệu từ API`);

    // 							// Gọi callback để cập nhật dữ liệu hiển thị
    // 							if (onDataUpdate) {
    // 								await onDataUpdate();
    // 							}

    // 							// Gọi callback để cập nhật selectedStepId nếu cần
    // 							if (onStepRunComplete) {
    // 								await onStepRunComplete(firstStep.id);
    // 							}
    // 						}
    // 					} catch (error) {
    // 						console.error('Lỗi khi tự động cập nhật dữ liệu từ API:', error);
    // 						message.error('Lỗi khi tự động cập nhật dữ liệu từ API');
    // 					}
    // 				}
    // 			}
    // 		}
    // 	};

    // 	// Kiểm tra mỗi 10 giây để hỗ trợ cập nhật nhanh (15 giây, 30 giây)
    // 	// Chỉ chạy interval khi có step upload với enableAutoUpdate = true
    // 	const firstStep = normalizedSteps.find(step => step.type === 12);
    // 	let interval;
    // 	if (firstStep && firstStep.config && firstStep.config.enableAutoUpdate && firstStep.config.intervalUpdate > 0) {
    // 		interval = setInterval(checkAutoUpdate, 10000);
    // 	}

    // 	return () => {
    // 		if (interval) {
    // 			clearInterval(interval);
    // 		}
    // 	};
    // }, [normalizedSteps, templateData]);
    // Thêm bước mới với ID duy nhất và đảm bảo làm sạch config, reset state tạm, chỉ cho phép Upload Data đầu tiên khi chưa có dữ liệu
    const handleAddStep = async (customStatus = 'pending') => {
        // Nếu chưa chọn loại step thì không làm gì
        if (!addStepType) {
            message.error('Vui lòng chọn loại step');
            return false;
        }

        // Kiểm tra xem có step Upload Data (type 12) nào trong danh sách steps hiện tại không
        const hasUploadStep = normalizedSteps.some(step => step.type === 12);

        // Nếu chưa có step Upload Data, chỉ cho phép thêm step Upload Data (type 12)
        if (!hasUploadStep && addStepType !== 12) {
            message.error('Bước đầu tiên phải là "Upload Data"');
            return false;
        }

        try {
            // Làm sạch config: xóa các trường tạm liên quan upload/file/url
            const cleanedConfig = { ...tempConfig };
            delete cleanedConfig.excelData;
            delete cleanedConfig.excelColumns;
            delete cleanedConfig.googleSheetsData;
            delete cleanedConfig.googleSheetsColumns;
            delete cleanedConfig.googleDriveData;
            delete cleanedConfig.googleDriveColumns;
            delete cleanedConfig.googleDriveFolderData;
            delete cleanedConfig.googleDriveFolderColumns;
            delete cleanedConfig.file;
            // KHÔNG xóa googleSheetUrl, intervalUpdate, lastUpdate vì cần cho Google Sheet
            // delete cleanedConfig.googleSheetUrl;
            delete cleanedConfig.googleDriveUrl;
            delete cleanedConfig.needUpdate;

            // Tạo ID duy nhất bằng cách tìm ID lớn nhất hiện tại và cộng thêm 1
            const maxId = normalizedSteps.length > 0 ? Math.max(...normalizedSteps.map(step => step.id)) : 0;
            const newId = maxId + 1;

            // Tạo step mới với id duy nhất
            let stepConfig = {
                ...cleanedConfig,
                // Thêm lastUpdate nếu là Google Sheet
                ...(cleanedConfig.uploadType === 'googleSheets' && {
                    lastUpdate: new Date().toISOString(),
                }),
            };

            // Special handling for steps that create new columns to preserve newlyCreatedColumns
            if (addStepType === 13) {
                // Text-to-column: store newly created columns from the configuration
                if (cleanedConfig.outputColumns && Array.isArray(cleanedConfig.outputColumns)) {
                    const targetColumn = cleanedConfig.targetColumn;
                    const newlyCreatedColumns = cleanedConfig.outputColumns
                        .filter(col => {
                            if (typeof col === 'string') {
                                return col !== targetColumn;
                            } else if (col && typeof col === 'object' && col.name) {
                                return col.name !== targetColumn;
                            }
                            return true;
                        })
                        .map(col => typeof col === 'string' ? col : col.name);

                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: newlyCreatedColumns,
                    };
                }
            } else if (addStepType === 10) {
                // Aggregate: thiết lập outputColumns dựa trên groupBy và aggregations
                const aggregateOutputColumns = [];

                // Thêm các cột groupBy
                if (cleanedConfig.groupBy) {
                    const groupByColumns = Array.isArray(cleanedConfig.groupBy) ? cleanedConfig.groupBy : [cleanedConfig.groupBy];
                    groupByColumns.forEach(col => {
                        aggregateOutputColumns.push({
                            name: col,
                            type: 'text',
                        });
                    });
                }

                // Thêm các cột aggregate
                if (cleanedConfig.aggregations && Array.isArray(cleanedConfig.aggregations)) {
                    cleanedConfig.aggregations.forEach(agg => {
                        if (agg.column && agg.function) {
                            const columnName = agg.alias || `${agg.function}_${agg.column}`;
                            aggregateOutputColumns.push({
                                name: columnName,
                                type: 'text',
                            });
                        }
                    });
                }

                stepConfig = {
                    ...stepConfig,
                    outputColumns: aggregateOutputColumns,
                    outputColumnsTimestamp: new Date().toISOString(),
                };
            } else if (addStepType === 14) {
                // Date Converter: store the output column as newly created
                if (cleanedConfig.outputColumn) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: [cleanedConfig.outputColumn],
                    };
                }
            } else if (addStepType === 19) {
                // Value to Time: store the output columns as newly created (supports multi-mapping)
                const mappings = Array.isArray(cleanedConfig.mappings) && cleanedConfig.mappings.length > 0
                    ? cleanedConfig.mappings
                    : (cleanedConfig.outputColumn ? [{ outputColumn: cleanedConfig.outputColumn }] : []);
                const newCols = mappings
                    .map(m => m?.outputColumn)
                    .filter(Boolean);
                if (newCols.length > 0) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: newCols,
                    };
                }
            } else if (addStepType === 7) {
                // Cross Mapping/Validation & Mapping: store the new column as newly created
                if (cleanedConfig.createNewColumn && cleanedConfig.newColumnName) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: [cleanedConfig.newColumnName],
                    };
                }
            } else if (addStepType === 20) {
                // Date Operation: store the new column as newly created
                if (cleanedConfig.newColumnName) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: [cleanedConfig.newColumnName],
                    };
                }
            } else if (addStepType === 24) {
                // AI Formula: store the new column as newly created
                if (cleanedConfig.createNewColumn && cleanedConfig.newColumnName) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: [cleanedConfig.newColumnName],
                    };
                }
            } else if (addStepType === 26) {
                // Letter Case: store the new column as newly created
                if (cleanedConfig.newColumn && cleanedConfig.newColumnName) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: [cleanedConfig.newColumnName],
                    };
                }
            } else if (addStepType === 27) {
                // Concatenate: store the new column as newly created
                if (cleanedConfig.newColumnName) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: [cleanedConfig.newColumnName],
                    };
                }
            } else if (addStepType === 28) {
                // Trim: store the new column as newly created
                if (cleanedConfig.newColumn && cleanedConfig.newColumnName) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: [cleanedConfig.newColumnName],
                    };
                }
            } else if (addStepType === 29) {
                // Write Field: store the new field as newly created
                if (cleanedConfig.fieldName) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: [cleanedConfig.fieldName],
                    };
                }
            } else if (addStepType === 32) {
                // Week Number: store the new column as newly created
                if (cleanedConfig.newColumnName) {
                    stepConfig = {
                        ...stepConfig,
                        newlyCreatedColumns: [cleanedConfig.newColumnName],
                    };
                }
            }

            const newStep = {
                id: newId,
                type: addStepType,
                config: stepConfig,
                status: customStatus,
                useCustomInput: tempConfig.useCustomInput || false,
                inputStepId: tempConfig.inputStepId,
            };

            const newSteps = [...normalizedSteps, newStep];
            onChange(newSteps);

            // Lưu step vào template_table (backend)
            if (templateData && templateData.id) {
                await updateTemplateTable({ ...templateData, steps: newSteps });
                message.success(`Đã thêm step "${stepTypeName[addStepType]}" thành công`);
            }

            // Reset toàn bộ state tạm sau khi thêm step thành công
            setShowAddModal(false);
            setAddStepType(null);
            setTempConfig({
                useCustomInput: false,
                inputStepId: null,
            });

            return true;
        } catch (error) {
            console.error('Lỗi khi thêm step:', error);
            message.error('Lỗi khi lưu step vào template_table!');
            return false;
        }
    };

    // Xóa bước
    const handleDeleteStep = async (idx) => {
        const stepToDelete = normalizedSteps[idx];

        // Xóa approveVersion liên quan trước khi xóa step
        if (idFileNote && stepToDelete) {
            try {
                const approvedVersion = listApprovedVersion.find(v => v.id_version == stepToDelete.id && v.id_fileNote == idFileNote);
                if (approvedVersion) {
                    await deleteApprovedVersion(approvedVersion.id);
                    console.log('Đã xóa approveVersion liên quan:', approvedVersion.id);
                }
            } catch (error) {
                console.error('Lỗi khi xóa approveVersion:', error);
                // Không hiển thị error message vì có thể approveVersion chưa có
            }
        }

        // Xóa dữ liệu version tương ứng với step
        if (templateData && templateData.id && stepToDelete) {
            try {
                await deleteTemplateRowByTableId(templateData.id, stepToDelete.id);

            } catch (error) {
                console.error('Lỗi khi xóa dữ liệu version:', error);
                // Không hiển thị error message vì có thể version chưa có dữ liệu
            }
        }

        const newSteps = normalizedSteps.filter((_, i) => i !== idx);
        // Giữ nguyên ID của các step còn lại, chỉ cập nhật inputStepId nếu cần
        const updatedSteps = newSteps.map((step) => {
            let newInputStepId = step.inputStepId;

            // Nếu step này đang sử dụng step bị xóa làm input, reset về null
            if (step.inputStepId === stepToDelete.id) {
                newInputStepId = null;
            }

            return {
                ...step,
                inputStepId: newInputStepId,
            };
        });
        onChange(updatedSteps);

        // Nếu step bị xóa là step đang được chọn, chọn step trước đó
        if (selectedStepId === stepToDelete.id) {
            // Tìm step trước đó trong danh sách steps cũ (trước khi xóa)
            const currentStepIndex = normalizedSteps.findIndex(step => step.id === stepToDelete.id);
            let previousStep = null;

            if (currentStepIndex > 0) {
                // Nếu có step trước đó, chọn step trước đó
                previousStep = normalizedSteps[currentStepIndex - 1];
            } else if (updatedSteps.length > 0) {
                // Nếu không có step trước đó nhưng còn steps khác, chọn step đầu tiên
                previousStep = updatedSteps[0];
            }

            // Gọi callback để chọn step trước đó hoặc step đầu tiên
            if (onStepClick && previousStep) {
                onStepClick(previousStep.id);
            } else if (onStepClick) {
                // Nếu không có step nào, reset về dữ liệu gốc
                onStepClick(null);
            }
        }

        // Lưu thay đổi vào database
        if (templateData && templateData.id) {
            try {
                await updateTemplateTable({ ...templateData, steps: updatedSteps });
                message.success(`Đã xóa step ${stepToDelete.id}, dữ liệu version và approveVersion tương ứng`);

                // Refresh UI và danh sách approveVersion
                if (onDataUpdate) {
                    setTimeout(() => {
                        onDataUpdate();
                    }, 500);
                }

                if (typeof update === 'function') {
                    setTimeout(() => {
                        update();
                    }, 1000);
                }

                // Refresh lại danh sách approveVersion sau khi xóa
                if (idFileNote) {
                    setTimeout(() => {
                        fetchListApprovedVersion();
                    }, 500);
                }
            } catch (error) {
                console.error('Lỗi khi lưu thay đổi:', error);
                message.error('Có lỗi khi lưu thay đổi');
            }
        }
    };
    // Sửa bước
    const handleEditStep = async () => {
        if (editIdx === null) return;

        try {
            const cleanedConfig = { ...tempConfig };
            delete cleanedConfig.excelData;
            delete cleanedConfig.excelColumns;
            delete cleanedConfig.googleSheetsData;
            delete cleanedConfig.googleSheetsColumns;
            delete cleanedConfig.googleDriveData;
            delete cleanedConfig.googleDriveColumns;
            delete cleanedConfig.file;
            // KHÔNG xóa googleSheetUrl, intervalUpdate, lastUpdate vì cần cho Google Sheet
            // delete cleanedConfig.googleSheetUrl;
            delete cleanedConfig.googleDriveUrl;
            delete cleanedConfig.needUpdate;

            // So sánh config hiện tại với config ban đầu
            const initialConfig = initialConfigs[editIdx];
            const currentConfig = currentConfigs[editIdx];

            let hasChanges = false;
            if (initialConfig && currentConfig) {
                // So sánh các field quan trọng
                const importantFields = [
                    'useAI', 'aiPrompt', 'targetColumn', 'createNewColumn', 'newColumnName',
                    'conditions', 'elseValue', 'duplicateCheck', 'duplicateKeys', 'duplicateAction',
                    'importMode', 'uploadType', 'file', 'googleSheetUrl', 'googleDriveUrl',
                    'intervalUpdate', 'lastUpdate',
                ];

                for (const field of importantFields) {
                    const initialValue = initialConfig[field];
                    const currentValue = currentConfig[field];

                    // Xử lý các trường hợp đặc biệt
                    let isEqual = false;
                    if (initialValue === currentValue) {
                        isEqual = true;
                    } else if (initialValue == null && currentValue == null) {
                        isEqual = true;
                    } else if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
                        isEqual = JSON.stringify(initialValue) === JSON.stringify(currentValue);
                    } else if (typeof initialValue === 'object' && typeof currentValue === 'object') {
                        isEqual = JSON.stringify(initialValue) === JSON.stringify(currentValue);
                    } else {
                        isEqual = false;
                    }

                    if (!isEqual) {
                        hasChanges = true;
                        break;
                    }
                }
            }

            // Lấy giá trị hiện tại từ step đã được cập nhật (không phải từ tempConfig)
            const currentStep = normalizedSteps[editIdx];

            // Special handling for steps that create new columns to preserve newlyCreatedColumns
            let updatedConfig = {
                ...cleanedConfig,
                // Thêm lastUpdate nếu là Google Sheet và chưa có
                ...(cleanedConfig.uploadType === 'googleSheets' && !cleanedConfig.lastUpdate && {
                    lastUpdate: new Date().toISOString(),
                }),
            };

            // Preserve newlyCreatedColumns for steps that create new columns
            if (currentStep.type === 13) {
                // Text-to-column: preserve newly created columns from the configuration
                if (cleanedConfig.outputColumns && Array.isArray(cleanedConfig.outputColumns)) {
                    const targetColumn = cleanedConfig.targetColumn;
                    const newlyCreatedColumns = cleanedConfig.outputColumns
                        .filter(col => {
                            if (typeof col === 'string') {
                                return col !== targetColumn;
                            } else if (col && typeof col === 'object' && col.name) {
                                return col.name !== targetColumn;
                            }
                            return true;
                        })
                        .map(col => typeof col === 'string' ? col : col.name);

                    updatedConfig = {
                        ...updatedConfig,
                        newlyCreatedColumns: newlyCreatedColumns,
                    };
                }
            } else if (currentStep.type === 10) {
                // Aggregate: thiết lập outputColumns dựa trên groupBy và aggregations
                const aggregateOutputColumns = [];

                // Thêm các cột groupBy
                if (cleanedConfig.groupBy) {
                    const groupByColumns = Array.isArray(cleanedConfig.groupBy) ? cleanedConfig.groupBy : [cleanedConfig.groupBy];
                    groupByColumns.forEach(col => {
                        aggregateOutputColumns.push({
                            name: col,
                            type: 'text',
                        });
                    });
                }

                // Thêm các cột aggregate
                if (cleanedConfig.aggregations && Array.isArray(cleanedConfig.aggregations)) {
                    cleanedConfig.aggregations.forEach(agg => {
                        if (agg.column && agg.function) {
                            const columnName = agg.alias || `${agg.function}_${agg.column}`;
                            aggregateOutputColumns.push({
                                name: columnName,
                                type: 'text',
                            });
                        }
                    });
                }

                updatedConfig = {
                    ...updatedConfig,
                    outputColumns: aggregateOutputColumns,
                    outputColumnsTimestamp: new Date().toISOString(),
                };
            } else if (currentStep.type === 14) {
                // Date Converter: preserve the output column as newly created
                if (cleanedConfig.outputColumn) {
                    updatedConfig = {
                        ...updatedConfig,
                        newlyCreatedColumns: [cleanedConfig.outputColumn],
                    };
                }
            } else if (currentStep.type === 19) {
                // Value to Time: preserve the output columns as newly created (supports multi-mapping)
                const mappings = Array.isArray(cleanedConfig.mappings) && cleanedConfig.mappings.length > 0
                    ? cleanedConfig.mappings
                    : (cleanedConfig.outputColumn ? [{ outputColumn: cleanedConfig.outputColumn }] : []);
                const newCols = mappings
                    .map(m => m?.outputColumn)
                    .filter(Boolean);
                if (newCols.length > 0) {
                    updatedConfig = {
                        ...updatedConfig,
                        newlyCreatedColumns: newCols,
                    };
                }
            }

            const newSteps = normalizedSteps.map((s, i) => i === editIdx ? {
                ...s,
                config: updatedConfig,
                useCustomInput: currentStep.useCustomInput,
                inputStepId: currentStep.inputStepId,
                needUpdate: true, // Luôn set needUpdate: true khi lưu thay đổi
            } : s);

            // Cập nhật state local
            onChange(newSteps);

            // Lưu thay đổi vào database
            if (templateData && templateData.id) {
                await updateTemplateTable({
                    ...templateData,
                    steps: newSteps,
                });
            }

            // Cập nhật inputColumns cho step đã edit
            const newInputColumns = await getInputColumns(editIdx, currentStep.inputStepId);
            setInputColumns(newInputColumns);

            // Gọi callback để cập nhật inputColumns ở parent component
            // if (onInputStepChange) {
            // 	onInputStepChange(currentStep.inputStepId);
            // }

            setShowEditModal(false);
            setEditIdx(null);
            setTempConfig({
                useCustomInput: false,
                inputStepId: null,
            });

            // Reset initial config và current config cho step đã edit
            if (editIdx !== null) {
                setInitialConfigs(prev => {
                    const newConfigs = { ...prev };
                    delete newConfigs[editIdx];
                    return newConfigs;
                });
                setCurrentConfigs(prev => {
                    const newConfigs = { ...prev };
                    delete newConfigs[editIdx];
                    return newConfigs;
                });
            }
        } catch (error) {
            console.error('Lỗi khi sửa step:', error);
            message.error('Lỗi khi lưu cấu hình step vào database');
        }
    };

    // Cập nhật cấu hình nguồn dữ liệu
    const handleUpdateInputSource = async (stepIndex, useCustomInput, inputStepId) => {
        try {
            const currentStep = normalizedSteps[stepIndex];
            const hasInputSourceChanged =
                currentStep.useCustomInput !== useCustomInput ||
                currentStep.inputStepId !== inputStepId;

            const newSteps = normalizedSteps.map((s, i) =>
                i === stepIndex ? {
                    ...s,
                    useCustomInput,
                    inputStepId,
                    needUpdate: hasInputSourceChanged || s.needUpdate,
                } : s,
            );

            // Cập nhật state local
            onChange(newSteps);

            // Lưu thay đổi vào database
            if (templateData && templateData.id) {
                await updateTemplateTable({
                    ...templateData,
                    steps: newSteps,
                });
            }

            // Cập nhật inputColumns cho step hiện tại
            const newInputColumns = await getInputColumns(stepIndex, inputStepId);
            setInputColumns(newInputColumns);

            // Gọi callback để cập nhật inputColumns ở parent component
            // if (onInputStepChange) {
            // 	onInputStepChange(inputStepId);
            // }
        } catch (error) {
            console.error('Lỗi khi cập nhật cấu hình nguồn dữ liệu:', error);
            message.error('Lỗi khi lưu cấu hình nguồn dữ liệu');
        }
    };

    // Click vào step card để xem dữ liệu
    const handleStepCardClick = async (step) => {

        // Gọi callback gốc để xem dữ liệu
        if (onStepClick) {
            onStepClick(step.id);
        }
    };

    // Cập nhật status của step
    const handleStepStatusUpdate = (stepId, newStatus) => {
        console.log('🔄 Cập nhật step:', { stepId, newStatus });
        const updatedSteps = steps.map(step => {
            if (step.id === stepId) {
                const updatedStep = { ...step, ...newStatus };
                console.log('✅ Step được cập nhật:', {
                    oldStatus: step.status,
                    newStatus: updatedStep.status,
                    extractToGGS: updatedStep.extractToGGS
                });
                return updatedStep;
            }
            return step;
        });
        onChange(updatedSteps);
    };

    // Cập nhật thông tin export Google Sheets
    const handleUpdateExportInfo = (stepId, exportInfo) => {
        console.log('💾 Cập nhật thông tin export:', { stepId, exportInfo });
        const updatedSteps = steps.map(step => {
            if (step.id === stepId) {
                const updatedStep = {
                    ...step,
                    extractToGGS: exportInfo
                };
                console.log('✅ Thông tin export được cập nhật:', {
                    stepId,
                    oldStatus: step.status,
                    newStatus: updatedStep.status,
                    extractToGGS: updatedStep.extractToGGS
                });
                return updatedStep;
            }
            return step;
        });
        onChange(updatedSteps);
    };

    // Xóa thông tin export Google Sheets
    const handleRemoveExportInfo = (stepId) => {
        console.log('🗑️ Xóa thông tin export:', { stepId });
        const updatedSteps = steps.map(step => {
            if (step.id === stepId) {
                const { extractToGGS, ...stepWithoutExport } = step;
                console.log('✅ Thông tin export đã được xóa:', {
                    stepId,
                    removedExtractToGGS: extractToGGS
                });
                return stepWithoutExport;
            }
            return step;
        });
        onChange(updatedSteps);
        message.success('Đã bỏ kết nối với Google Sheets');
    };
    // Function để chạy step thực tế (được gọi từ queue)
    const executeStep = async (fileNoteId, stepId, forceNormalMode = false) => {
        const isSameFileNote = String(fileNoteId) === String(templateData?.fileNote_id);
        const stepIndex = normalizedSteps.findIndex(s => s.id === stepId);
        const step = normalizedSteps[stepIndex];

        if (!step) {
            throw new Error('Không thể chạy step này');
        }

        if (isSameFileNote) {
            setRunningStep(step.id);
        }

        try {
            // Cập nhật status thành running (chỉ khi cùng fileNote đang mở)
            if (isSameFileNote) {
                const updatedSteps = normalizedSteps.map((s, i) =>
                    i === stepIndex ? { ...s, status: 'running' } : s,
                );
                onChange(updatedSteps);
            }

            // Xác định inputStepId
            let inputStepId = null;
            if (step.useCustomInput) {
                inputStepId = step.inputStepId;
            } else {
                // Nếu là AI Transformer và chạy "dòng trống", lấy dữ liệu từ bước hiện tại
                if (step.type === 21 && step._runOptions && step._runOptions.runMode === 'empty_only') {
                    inputStepId = step.id; // Lấy dữ liệu từ bước hiện tại
                    console.log(`🤖 AI Transformer Empty Only: Lấy dữ liệu từ bước hiện tại (step ${step.id}) thay vì bước trước`);
            } else {
                inputStepId = stepIndex === 0 ? 0 : normalizedSteps[stepIndex - 1].id;
                }
            }

            // Hiển thị loading message (chỉ UI hiện tại)
            if (isSameFileNote) {
                const typeLabel = stepTypeName[step.type] || `Type ${step.type}`;
                message.loading(`Đang xử lý step ${step.id} (${typeLabel})...`, 0);
            }

            // OPTIMIZATION: Gọi API backend để xử lý step (backend xử lý tất cả)
            // Chỉ áp dụng test mode cho các step > 1, step 1 (dữ liệu gốc) luôn chạy với dữ liệu thật
            // Nếu forceNormalMode = true, bỏ qua test mode để chạy với đầy đủ dữ liệu
            const shouldUseTestMode = !step._forceNormalMode && isTestMode && step.id > 1;
            const options = shouldUseTestMode ? { testMode: true, testLimit: 1000 } : {};

            console.log(`🚀 Frontend executeStep - Test mode check:`, {
                isTestMode,
                stepId: step.id,
                shouldUseTestMode,
                forceNormalMode: step._forceNormalMode,
                options
            });

            // Nếu khác fileNote, lấy template id của fileNote đó
            let targetTemplateId = templateData?.id;
            if (!isSameFileNote) {
                try {
                    const { getTemplateByFileNoteId } = await import('../../../../apis/templateSettingService.jsx');
                    const tpl = await getTemplateByFileNoteId(fileNoteId);
                    targetTemplateId = Array.isArray(tpl) && tpl[0] ? tpl[0].id : null;
                } catch (e) {
                    console.error('Không lấy được templateId cho fileNote khác:', e);
                }
            }

            // Xử lý runOptions cho step type 21 (AI Transformer)
            let finalConfig = step.config;
            if (step.type === 21 && step._runOptions) {
                const { runMode, filterConditions, filterMode, emptyEnableFilter, emptyFilterConditions, emptyFilterMode, includeChangesInEmptyMode } = step._runOptions;
                
                // Cập nhật config với runOptions
                finalConfig = {
                    ...step.config,
                    runEmptyOnly: runMode === 'empty_only',
                    enableFilter: runMode === 'filtered',
                    filterConditions: runMode === 'filtered' ? filterConditions : [],
                    filterMode: runMode === 'filtered' ? filterMode : 'include',
                    // empty-only filtering
                    emptyModeEnableFilter: runMode === 'empty_only' ? Boolean(emptyEnableFilter) : false,
                    emptyModeFilterConditions: runMode === 'empty_only' ? (emptyFilterConditions || []) : [],
                    emptyModeFilterMode: runMode === 'empty_only' ? (emptyFilterMode || 'include') : 'include',
                    includeChangesInEmptyMode: runMode === 'empty_only' ? (typeof includeChangesInEmptyMode === 'boolean' ? includeChangesInEmptyMode : true) : undefined,
                };
                
                console.log('🤖 AI Transformer runOptions:', { runMode, filterConditions, filterMode, emptyEnableFilter, emptyFilterConditions, emptyFilterMode, includeChangesInEmptyMode, finalConfig });
            }

            const result = await processStepData(
                targetTemplateId,
                finalConfig,
                step.type,
                inputStepId,
                step.id,
                options
            );
            console.log('result', result);

            if (isSameFileNote) {
                message.destroy(); // Xóa loading message
            }

            if (!result.success) {
                throw new Error(result.message || 'Backend processing failed');
            }

            console.log(`✅ Backend processing thành công: ${result.inputDataCount} → ${result.outputDataCount} dòng (${result.processingTime}ms)`);

            let updatedFinalSteps;
            if (isSameFileNote) {
                const updatedConfig = {
                    ...step.config,
                    outputColumns: result.outputColumns,
                    outputColumnsTimestamp: new Date().toISOString(),
                    lastRunTimestamp: new Date().toISOString(),
                    lastUpdate: new Date().toISOString(),
                };

                updatedFinalSteps = normalizedSteps.map((s, i) => {
                    if (i === stepIndex) {
                        const { needUpdate, ...stepWithoutNeedUpdate } = s;
                        return {
                            ...stepWithoutNeedUpdate,
                            config: updatedConfig,
                            status: 'completed'
                        };
                    }
                    if (s.inputStepId === step.id) {
                        return { ...s, needUpdate: true };
                    }
                    return s;
                });

                onChange(updatedFinalSteps);
            }

            // Lưu template với steps đã cập nhật
            // Cập nhật isTestData ở frontend sau khi chạy process xong
            // CHỈ lưu isTestData: true khi thực sự chạy test mode (không phải forceNormalMode)
            if (isSameFileNote && typeof updatedFinalSteps !== 'undefined' && updatedFinalSteps && shouldUseTestMode && !step._forceNormalMode) {
                console.log('🧪 TEST MODE - Adding isTestData: true to step config');
                const stepToUpdate = updatedFinalSteps.find(s => s.id === step.id);
                if (stepToUpdate && stepToUpdate.config) {
                    stepToUpdate.config = {
                        ...stepToUpdate.config,
                        isTestData: true
                    };
                    console.log('🧪 Updated step config with isTestData:', stepToUpdate.config);
                }
            } else if (isSameFileNote && typeof updatedFinalSteps !== 'undefined' && updatedFinalSteps && step._forceNormalMode) {
                console.log('🚀 FULL DATA MODE - Removing isTestData from step config');
                const stepToUpdate = updatedFinalSteps.find(s => s.id === step.id);
                if (stepToUpdate && stepToUpdate.config) {
                    // Xóa isTestData khi chạy với đầy đủ dữ liệu
                    const { isTestData, ...configWithoutTestData } = stepToUpdate.config;
                    stepToUpdate.config = configWithoutTestData;
                    console.log('🚀 Updated step config without isTestData:', stepToUpdate.config);
                }
            }
            console.log('step', step);
            
            // Xóa _runOptions sau khi xử lý xong để tránh ảnh hưởng đến lần chạy tiếp theo
            if (step._runOptions) {
                delete step._runOptions;
                console.log('🧹 Đã xóa _runOptions sau khi xử lý xong');
            }
            
            // Lưu và thông báo chỉ khi là fileNote hiện tại
            if (isSameFileNote && typeof updatedFinalSteps !== 'undefined' && updatedFinalSteps) {
                try {
                    await updateTemplateTable({ ...templateData, steps: updatedFinalSteps });
                } catch (updateError) {
                    console.error('Lỗi khi lưu template:', updateError);
                }
                const typeLabel = stepTypeName[step.type] || `Type ${step.type}`;
                message.success(`Step ${step.id} (${typeLabel}) hoàn thành thành công!`);

                // Nếu đang mở đúng fileNote, điều hướng đến view của step vừa chạy xong
                try {
                    const path = window.location?.pathname || '';
                    const match = path.match(/\/data-manager\/data\/(\d+)/);
                    const openedId = match ? String(match[1]) : null;
                    // Chỉ điều hướng nếu fileNote đang mở CHÍNH LÀ fileNote của job này
                    if (openedId && String(openedId) === String(fileNoteId)) {
                        navigate(`/data-manager/data/${fileNoteId}/step/${step.id}`);
                    }
                } catch (navErr) {
                    // ignore navigation errors
                }
            }

        } catch (error) {
            console.error('Lỗi khi chạy step:', error);
            message.error(`Lỗi khi chạy step ${step.id}: ${error.message}`);

            if (isSameFileNote) {
                const errorSteps = normalizedSteps.map((s, i) =>
                    i === stepIndex ? { ...s, status: 'error' } : s,
                );
                onChange(errorSteps);
            }

            // Không lưu/navigate cho fileNote khác từ UI hiện tại

            throw error; // Re-throw để queue service biết có lỗi
        } finally {
            // Xóa forceNormalMode flag sau khi chạy xong
            if (step._forceNormalMode) {
                delete step._forceNormalMode;
            }

            if (isSameFileNote) {
                setRunningStep(null);
                // Reset AI processing progress
                setAiProcessingProgress({ stepId: null, current: 0, total: 0, message: '' });
                checkRunningStep(null);
            }
            // Safety: đảm bảo xóa trạng thái running cho đúng fileNote đang được xử lý
            try {
                if (setRunningFileNotes && fileNoteId) {
                    setRunningFileNotes(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(String(fileNoteId));
                        return newSet;
                    });
                }
            } catch (e) {
                // ignore
            }
        }
    };

    // Mở modal chọn điều kiện lọc cho AI Transformer
    const openAiTransformerRunModal = (stepIndex) => {
        const step = normalizedSteps[stepIndex];
        if (!step || step.type !== 21) {
            message.error('Chỉ áp dụng cho step AI Transformer');
            return;
        }

        // Load _runOptions từ step nếu có
        const savedRunOptions = step._runOptions || {};
        
        // Debug log
        console.log('🔍 [DEBUG] openAiTransformerRunModal - step:', step);
        console.log('🔍 [DEBUG] openAiTransformerRunModal - step._runOptions:', step._runOptions);
        console.log('🔍 [DEBUG] openAiTransformerRunModal - savedRunOptions:', savedRunOptions);

        setAiTransformerRunModal({
            visible: true,
            stepIndex,
            step,
            runMode: savedRunOptions.runMode || 'full',
            filterConditions: savedRunOptions.filterConditions || [],
            filterMode: savedRunOptions.filterMode || 'include'
        });
    };

    // Chạy AI Transformer với điều kiện lọc
    const runAiTransformerWithFilter = async (runOptions) => {
        const { stepIndex, runMode, filterConditions, filterMode, emptyEnableFilter, emptyFilterConditions, emptyFilterMode, includeChangesInEmptyMode } = runOptions;
        const step = normalizedSteps[stepIndex];
        
        if (!step || !templateData) {
            message.error('Không thể chạy step này');
            return;
        }

        // Tạo config mới với điều kiện lọc tạm thời
        const originalConfig = { ...step.config };
        const tempConfig = {
            ...originalConfig,
            enableFilter: runMode === 'filtered',
            filterConditions: runMode === 'filtered' ? filterConditions : [],
            filterMode: runMode === 'filtered' ? filterMode : 'include',
            runEmptyOnly: runMode === 'empty_only',
            // empty-only options
            emptyModeEnableFilter: runMode === 'empty_only' ? Boolean(emptyEnableFilter) : false,
            emptyModeFilterConditions: runMode === 'empty_only' ? (emptyFilterConditions || []) : [],
            emptyModeFilterMode: runMode === 'empty_only' ? (emptyFilterMode || 'include') : 'include',
            includeChangesInEmptyMode: runMode === 'empty_only' ? (typeof includeChangesInEmptyMode === 'boolean' ? includeChangesInEmptyMode : true) : undefined,
        };

        // Cập nhật config tạm thời
        step.config = tempConfig;

        // Lưu forceNormalMode và runOptions vào step để executeStep có thể sử dụng
        step._forceNormalMode = true;
        step._runOptions = {
            runMode,
            filterConditions,
            filterMode,
            emptyEnableFilter,
            emptyFilterConditions,
            emptyFilterMode,
            includeChangesInEmptyMode,
        };
        
        // Debug log
        console.log('🔍 [DEBUG] runAiTransformerWithFilter - Saving _runOptions:', step._runOptions);
        console.log('🔍 [DEBUG] runAiTransformerWithFilter - step after saving:', step);
        
        // Lưu _runOptions vào database để persist sau F5
        try {
            const updatedSteps = [...normalizedSteps];
            const stepIndex = updatedSteps.findIndex(s => s.id === step.id);
            if (stepIndex !== -1) {
                updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], _runOptions: step._runOptions };
                await updateTemplateTable({ ...templateData, steps: updatedSteps });
                console.log('🔍 [DEBUG] runAiTransformerWithFilter - _runOptions saved to database');
            }
        } catch (error) {
            console.error('🔍 [DEBUG] runAiTransformerWithFilter - Error saving _runOptions to database:', error);
        }

        // Đăng ký executeStep function cho queue service
        fileNoteQueueService.setExecuteStep(executeStep);

        // Thêm vào queue thay vì chạy trực tiếp
        fileNoteQueueService.addToQueue(
            templateData.fileNote_id,
            step.id,
            // onStart callback
            (fileNoteId, stepId) => {
                console.log(`🚀 Bắt đầu chạy AI Transformer cho fileNote ${fileNoteId}, step ${stepId}`);
                if (setRunningFileNotes && templateData?.fileNote_id) {
                    setRunningFileNotes(prev => new Set([...prev, String(templateData.fileNote_id)]));
                }
                checkRunningStep(step.id);
            },
            // onComplete callback
            (fileNoteId, stepId) => {
                console.log(`✅ Hoàn thành AI Transformer cho fileNote ${fileNoteId}, step ${stepId}`);
                if (setRunningFileNotes && templateData?.fileNote_id) {
                    setRunningFileNotes(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(String(templateData.fileNote_id));
                        return newSet;
                    });
                }
                setRunningStep(null);
            },
            // onError callback
            (fileNoteId, stepId, error) => {
                console.error(`❌ Lỗi AI Transformer cho fileNote ${fileNoteId}, step ${stepId}:`, error);
                if (setRunningFileNotes && templateData?.fileNote_id) {
                    setRunningFileNotes(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(String(templateData.fileNote_id));
                        return newSet;
                    });
                }
                setRunningStep(null);
                message.error(`Lỗi khi chạy AI Transformer: ${error.message || error}`);
            }
        );

        // Khôi phục config gốc
        step.config = originalConfig;
    };

    // Chạy step
    const handleRunStep = async (stepIndex, forceNormalMode = false) => {
        const step = normalizedSteps[stepIndex];
        if (!step || !templateData) {
            message.error('Không thể chạy step này');
            return;
        }

        // Step type 21 (AI Transformer) giờ đã có nút riêng, không cần xử lý ở đây

        // Lưu forceNormalMode vào step để executeStep có thể sử dụng
        if (forceNormalMode) {
            step._forceNormalMode = true;
        } else {
            // Đảm bảo xóa flag khi không phải forceNormalMode
            delete step._forceNormalMode;
        }

        // Đăng ký executeStep function cho queue service
        fileNoteQueueService.setExecuteStep(executeStep);

        // Thêm vào queue thay vì chạy trực tiếp
        fileNoteQueueService.addToQueue(
            templateData.fileNote_id,
            step.id,
            // onStart callback
            (fileNoteId, stepId) => {
                console.log(`🚀 Bắt đầu chạy step ${stepId} cho filenote ${fileNoteId}`);
                // Đưa fileNote vào danh sách đang chạy (để Sidebar hiển thị spinner)
                // Không tự thêm ở đây nữa; spinner dựa vào queue service khi item bắt đầu chạy thực sự
            },
            // onComplete callback
            (fileNoteId, stepId) => {
                console.log(`✅ Hoàn thành step ${stepId} cho filenote ${fileNoteId}`);
                // Gỡ fileNote khỏi danh sách đang chạy
                // Không tự remove ở đây nữa; queue service sẽ remove khi xong hoặc lỗi
            },
            // onError callback
            (fileNoteId, stepId, error) => {
                console.error(`❌ Lỗi step ${stepId} cho filenote ${fileNoteId}:`, error);
                // Gỡ fileNote khỏi danh sách đang chạy để tránh kẹt spinner
                // Không tự remove ở đây nữa; queue service sẽ remove khi lỗi
            }
        );
    };
    // Callback nhận từ UploadConfig khi lưu dữ liệu thành công
    const handleUploadSaveAndAddStep = async (uploadConfig) => {
        console.log('handleUploadSaveAndAddStep called with uploadConfig:', {
            uploadType: uploadConfig.uploadType,
            excelProcessingMode: uploadConfig.excelProcessingMode,
            outputColumns: uploadConfig.outputColumns,
            outputColumnsLength: uploadConfig.outputColumns?.length,
        });
        setUploadSaving(true);
        try {
            // Tính toán stepId của step sẽ được tạo
            const newStepId = normalizedSteps.length > 0 ? Math.max(...normalizedSteps.map(step => step.id)) + 1 : 1;

            // Gọi hàm lưu cấu hình upload (googleDriveFolder sẽ trả về object có outputColumns)
            const saveResult = await handleSaveUploadData(uploadConfig, newStepId);
            const success = typeof saveResult === 'object' ? !!saveResult?.success : !!saveResult;

            if (success) {
                // Lấy thông tin cột từ dữ liệu đã được parse
                try {

                    // Lưu thông tin các cột từ dữ liệu đã upload
                    let outputColumns = [];

                    // Ưu tiên sử dụng outputColumns từ uploadConfig nếu có (cho Excel aggregate)
                    if (uploadConfig.outputColumns && uploadConfig.outputColumns.length > 0) {
                        console.log('Using outputColumns from uploadConfig:', uploadConfig.outputColumns);
                        console.log('outputColumns details:', uploadConfig.outputColumns.map((col, index) => ({
                            index,
                            name: col.name,
                            type: col.type,
                        })));
                        console.log('Full outputColumns:', JSON.stringify(uploadConfig.outputColumns, null, 2));
                        outputColumns = uploadConfig.outputColumns;
                    } else if (tempConfig.uploadType === 'excel' && tempConfig.excelData && tempConfig.excelData.length > 0) {
                        // Từ dữ liệu Excel đã upload (fallback)
                        const sampleRow = tempConfig.excelData[0];
                        Object.keys(sampleRow).forEach(columnName => {
                            if (columnName !== 'key') { // Bỏ qua key được thêm tự động
                                outputColumns.push({
                                    name: columnName,
                                    type: 'text', // Mặc định là text như yêu cầu
                                });
                            }
                        });
                    } else if (tempConfig.uploadType === 'googleSheets' && tempConfig.googleSheetsData && tempConfig.googleSheetsData.length > 0) {
						// Từ dữ liệu Google Sheets đã upload - GIỮ THỨ TỰ CỘT THEO googleSheetsColumns nếu có
						const headersOrdered = Array.isArray(tempConfig.googleSheetsColumns) && tempConfig.googleSheetsColumns.length > 0
							? tempConfig.googleSheetsColumns
							: Object.keys(tempConfig.googleSheetsData[0] || {});
						headersOrdered.forEach(columnName => {
							if (columnName !== 'key') {
                            outputColumns.push({
                                name: columnName,
                                type: 'text',
                            });
							}
                        });
                    } else if (tempConfig.uploadType === 'googleDrive' && tempConfig.googleDriveData && tempConfig.googleDriveData.length > 0) {
                        // Từ dữ liệu Google Drive đã upload
                        const sampleRow = tempConfig.googleDriveData[0];
                        Object.keys(sampleRow).forEach(columnName => {
                            outputColumns.push({
                                name: columnName,
                                type: 'text',
                            });
                        });
                    } else if (tempConfig.uploadType === 'googleDriveFolder') {
                        console.log('uploadConfig.outputColumns', uploadConfig.outputColumns);
                        // Ưu tiên outputColumns từ saveResult nếu có
                        if (saveResult && typeof saveResult === 'object' && Array.isArray(saveResult.outputColumns) && saveResult.outputColumns.length > 0) {
                            outputColumns = saveResult.outputColumns.map(col =>
                                typeof col === 'string' ? ({ name: col, type: 'text' }) : col
                            );
                        } else if (uploadConfig.outputColumns && uploadConfig.outputColumns.length > 0) {
                            outputColumns = uploadConfig.outputColumns.map(col =>
                                typeof col === 'string' ? ({ name: col, type: 'text' }) : col
                            );
                        } else if (Array.isArray(tempConfig.googleDriveFolderColumns) && tempConfig.googleDriveFolderColumns.length > 0) {
                            // Hoặc từ googleDriveFolderColumns (ưu tiên giữ nguyên thứ tự)
                            outputColumns = tempConfig.googleDriveFolderColumns.map(col =>
                                typeof col === 'string' ? ({ name: col, type: 'text' }) : col
                            );
                        }
                    } else if (tempConfig.uploadType === 'postgresql' && tempConfig.postgresData && tempConfig.postgresData.length > 0) {
                        // Từ dữ liệu PostgreSQL đã upload
                        const sampleRow = tempConfig.postgresData[0];
                        Object.keys(sampleRow).forEach(columnName => {
                            outputColumns.push({
                                name: columnName,
                                type: 'text',
                            });
                        });
                    } else if (tempConfig.uploadType === 'api' && tempConfig.apiData && tempConfig.apiData.length > 0) {
                        // Từ dữ liệu API đã upload
                        const sampleRow = tempConfig.apiData[0];
                        Object.keys(sampleRow).forEach(columnName => {
                            outputColumns.push({
                                name: columnName,
                                type: 'text',
                            });
                        });
                    }


                    // Tạo config với outputColumns
                    const cleanedConfig = { ...tempConfig };
                    // Xóa tất cả dữ liệu và thông tin không cần thiết
                    delete cleanedConfig.excelData;
                    delete cleanedConfig.excelColumns;
                    delete cleanedConfig.googleSheetsData;
                    delete cleanedConfig.googleSheetsColumns;
                    delete cleanedConfig.googleDriveData;
                    delete cleanedConfig.googleDriveColumns;
                    delete cleanedConfig.googleDriveFolderData;
                    delete cleanedConfig.googleDriveFolderColumns;
                    delete cleanedConfig.googleDriveFilesMeta;
                    delete cleanedConfig.postgresData;
                    delete cleanedConfig.postgresColumns;
                    delete cleanedConfig.apiData;
                    delete cleanedConfig.apiColumns;
                    delete cleanedConfig.htqcData;
                    delete cleanedConfig.htqcColumns;
                    delete cleanedConfig.file;
                    // KHÔNG xóa googleSheetUrl, intervalUpdate, lastUpdate vì cần cho Google Sheet
                    // delete cleanedConfig.googleSheetUrl;
                    delete cleanedConfig.googleDriveUrl;
                    delete cleanedConfig.needUpdate;

                    const finalConfig = {
                        ...cleanedConfig,
                        outputColumns: outputColumns,
                        outputColumnsTimestamp: new Date().toISOString(),
                        // Thêm lastUpdate nếu là Google Sheet hoặc Google Drive Folder
                        ...(cleanedConfig.uploadType === 'googleSheets' && {
                            lastUpdate: new Date().toISOString(),
                        }),
                        ...(cleanedConfig.uploadType === 'googleDriveFolder' && {
                            lastUpdate: new Date().toISOString(),
                            isFrequencyActive: !!cleanedConfig.isFrequencyActive,
                            frequencyHours: cleanedConfig.isFrequencyActive ? (cleanedConfig.frequencyHours || 3) : 0,
                        }),
                    };

                    // Tạo step mới với config bao gồm outputColumns
                    const newStep = {
                        id: newStepId,
                        type: 12,
                        config: finalConfig,
                        status: 'completed',
                        useCustomInput: false,
                        inputStepId: null,
                    };

                    const newSteps = [...normalizedSteps, newStep];
                    onChange(newSteps);

                    // Lưu step vào template_table (backend)
                    const updatedTemplateData = { ...templateData, steps: newSteps };

                    await updateTemplateTable(updatedTemplateData);

                    // Đối với Import từ hệ thống, hiển thị thông báo khác
                    if (finalConfig.uploadType === 'system') {
                        message.success(`Đã thêm step "Import từ hệ thống" thành công với ${outputColumns.length} cột`);
                    } else {
                        message.success(`Đã thêm step "Upload Data" thành công với ${outputColumns.length} cột`);
                    }
                } catch (error) {
                    console.error('Lỗi khi lưu outputColumns cho Upload step:', error);
                    // Nếu lỗi, vẫn tạo step nhưng không có outputColumns
                    await handleAddStep('completed');
                }

                setShowAddModal(false);
                setAddStepType(null);
                setTempConfig({ useCustomInput: false, inputStepId: null });

                // Gọi onDataUpdate để thông báo component cha cập nhật dữ liệu
                if (onDataUpdate) {
                    await onDataUpdate();
                }

                // Gọi callback để cập nhật selectedStepId thành step upload vừa được tạo
                if (onStepRunComplete) {
                    await onStepRunComplete(newStepId);
                }

                // Không cần gọi update() nếu đã có onStepRunComplete vì nó đã fetch dữ liệu và render bảng
                // Chỉ gọi update() nếu không có onStepRunComplete
                if (typeof update === 'function' && !onStepRunComplete) {
                    await update();
                }
            } else {

                message.error('Lưu dữ liệu thất bại, không thể tạo step');
            }
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu và tạo step:', error);
            message.error('Có lỗi xảy ra khi lưu dữ liệu và tạo step');
        } finally {
            setUploadSaving(false);
        }
    };
    // Function để lấy columns từ inputStepId - OPTIMIZED sử dụng outputColumns từ step trước
    const getInputColumns = async (stepIndex, inputStepId) => {

        if (!templateData) {
            return availableColumns;
        }

        try {
            let actualInputStepId = null;
            let sourceStep = null;

            // Xác định inputStepId thực tế và tìm step tương ứng
            if (stepIndex !== null && normalizedSteps) {
                const currentStep = normalizedSteps[stepIndex];
                if (currentStep?.useCustomInput) {
                    actualInputStepId = currentStep.inputStepId;
                } else {
                    // Sử dụng step trước đó
                    if (stepIndex === 0) {
                        actualInputStepId = 0; // Sử dụng dữ liệu gốc
                    } else {
                        actualInputStepId = normalizedSteps[stepIndex - 1].id;
                        sourceStep = normalizedSteps[stepIndex - 1];
                    }
                }
            } else {
                // Trong modal - xử lý theo inputStepId được truyền vào
                if (inputStepId !== null && inputStepId !== undefined) {
                    actualInputStepId = inputStepId;
                    // Tìm step tương ứng với inputStepId
                    sourceStep = normalizedSteps?.find(step => step.id === inputStepId);
                } else {
                    // Chế độ mặc định - lấy step cuối cùng
                    if (normalizedSteps && normalizedSteps.length > 0) {
                        sourceStep = normalizedSteps[normalizedSteps.length - 1];
                        actualInputStepId = sourceStep.id;
                    } else {
                        actualInputStepId = 0; // Sử dụng dữ liệu gốc
                    }
                }
            }

            // OPTIMIZATION: Sử dụng outputColumns từ config của step trước thay vì gọi API
            if (sourceStep && sourceStep.config && sourceStep.config.outputColumns) {
                const outputColumns = sourceStep.config.outputColumns;

                // Chuyển đổi outputColumns thành array string đơn giản
                let columns = [];
                if (Array.isArray(outputColumns)) {
                    columns = outputColumns.map(col => {
                        if (typeof col === 'string') {
                            return col;
                        } else if (col && col.name) {
                            return col.name;
                        } else if (col && col.title) {
                            return col.title;
                        } else {
                            return String(col);
                        }
                    });
                }

                return columns;
            }

            // Fallback: Nếu không có outputColumns hoặc là dữ liệu gốc, sử dụng availableColumns
            if (actualInputStepId === null || actualInputStepId === 0) {
                return availableColumns;
            }

            let inputData = [];
            const customStepDataResponse = await getTemplateRow(templateData.id, actualInputStepId, false, 1, 10); // Chỉ lấy 10 dòng
            const customStepData = customStepDataResponse.rows || [];
            inputData = customStepData.map(row => ({ ...row.data, rowId: row.id }));

            if (inputData.length > 0) {
                const allColumns = new Set();
                inputData.forEach(row => {
                    Object.keys(row).forEach(columnName => {
                        if (columnName !== 'rowId') {
                            allColumns.add(columnName);
                        }
                    });
                });

                const columns = Array.from(allColumns).sort();
                return columns;
            }

            return availableColumns;

        } catch (error) {
            console.error('Lỗi khi lấy columns từ inputStepId:', error);
            return availableColumns;
        }
    };

    // Function để lấy outputColumns từ step trước (với thông tin kiểu dữ liệu)
    const getPreviousStepOutputColumns = (stepIndex, inputStepId) => {
        if (stepIndex > 0) {
            const previousStep = normalizedSteps[stepIndex - 1];
            if (previousStep && previousStep.config && previousStep.config.outputColumns) {
                console.log('getPreviousStepOutputColumns - Using outputColumns from previous step:', previousStep.config.outputColumns);
                return previousStep.config.outputColumns;
            }
        }

        // Fallback: tìm step theo inputStepId
        if (inputStepId && inputStepId > 0) {
            const previousStep = normalizedSteps.find(s => s.id === inputStepId);
            if (previousStep && previousStep.config && previousStep.config.outputColumns) {
                console.log('getPreviousStepOutputColumns - Using outputColumns from inputStepId:', previousStep.config.outputColumns);
                return previousStep.config.outputColumns;
            }
        }

        return null;
    };

    // Render form cấu hình
    const handleConfigChange = useCallback((newConfig, type, stepIndex, onChangeConfig) => {

        // Cập nhật currentConfigs cho step đang edit
        if (stepIndex !== null) {
            setCurrentConfigs(prev => ({
                ...prev,
                [stepIndex]: newConfig,
            }));
        }

        // Gọi onChangeConfig gốc
        onChangeConfig(newConfig);
    }, []);

    function renderConfigForm(type, config, onChangeConfig, stepIndex = null) {
        const Comp = configComponentMap[type];
        if (!Comp) return null;

        // Wrapper function để cập nhật currentConfigs khi config thay đổi
        const handleConfigChangeWrapper = (newConfig) => {
            handleConfigChange(newConfig, type, stepIndex, onChangeConfig);
        };

        // Tạo key để force re-render component khi modal mở lại
        // Sử dụng stepIndex nếu đang edit, hoặc modalKey nếu đang thêm mới
        const componentKey = stepIndex !== null ? `edit-${stepIndex}` : `add-${modalKey}`;

        // Truyền props phù hợp từng loại
        const commonProps = {
            key: componentKey, // Force re-render
            initialConfig: config,
            onChange: handleConfigChangeWrapper,
            templateData: templateData,
            getTemplateRow: getTemplateRow,
        };
        if ([1, 2, 5, 6, 9, 11, 13, 14, 15, 16, 17, 19, 20, 21, 24, 25, 26, 27, 28, 29, 32, 33, 34].includes(type)) {
            // Special handling for Text-to-column (type 13) and DateOperationConfig (type 20) to use correct availableColumns
            let columnsToUse = inputColumns;
            if ((type === 13 || type === 20) && stepIndex !== null) {
                // For Text-to-column and DateOperationConfig edit, use columns from the step's input source
                const currentStep = normalizedSteps[stepIndex];
                if (currentStep && currentStep.inputStepId !== null && currentStep.inputStepId !== undefined) {
                    // Use columns from the input step, not all columns
                    // This will be handled by the parent component through onInputStepChange
                    columnsToUse = inputColumns;
                }
            }

            // Debug logging for DateOperationConfig
            if (type === 20) {
                console.log('PipelineSteps - Rendering DateOperationConfig:', {
                    stepIndex,
                    type,
                    inputColumns: inputColumns,
                    columnsToUse: columnsToUse,
                    normalizedSteps: normalizedSteps,
                    currentStep: stepIndex !== null ? normalizedSteps[stepIndex] : null,
                });
            }

            // Special handling for AI Transformer (type 21) and AI Formula (type 24) to pass templateData
            if (type === 21 || type === 24) {
                // Thêm callback cho AI Transformer để track test status
                const aiTransformerProps = type === 21 ? {
                    ...commonProps,
                    availableColumns: columnsToUse,
                    templateData: templateData,
                    getTemplateRow: getTemplateRow,
                    onTestStatusChange: setAiTransformerTestStatus,
                } : {
                    ...commonProps,
                    availableColumns: columnsToUse,
                    templateData: templateData,
                    getTemplateRow: getTemplateRow,
                };
                return <Comp {...aiTransformerProps} />;
            }

            // Special handling for Convert to Value (type 25) to pass outputColumns
            if (type === 25) {
                return <Comp {...commonProps} availableColumns={columnsToUse} outputColumns={inputColumns} />;
            }

            // Special handling for Calculated Column (type 5) to pass inputColumns with type info
            if (type === 5) {
                // Lấy inputColumns với thông tin type từ step trước
                let actualInputStepId = null;
                let sourceStep = null;

                // Xác định step nguồn
                if (stepIndex !== null && normalizedSteps) {
                    const currentStep = normalizedSteps[stepIndex];
                    if (currentStep?.useCustomInput) {
                        actualInputStepId = currentStep.inputStepId;
                        sourceStep = normalizedSteps.find(step => step.id === actualInputStepId);
                    } else {
                        if (stepIndex === 0) {
                            actualInputStepId = 0;
                        } else {
                            actualInputStepId = normalizedSteps[stepIndex - 1].id;
                            sourceStep = normalizedSteps[stepIndex - 1];
                        }
                    }
                } else {
                    // Trong modal
                    if (tempConfig?.inputStepId !== null && tempConfig?.inputStepId !== undefined) {
                        actualInputStepId = tempConfig.inputStepId;
                        sourceStep = normalizedSteps?.find(step => step.id === actualInputStepId);
                    } else {
                        if (normalizedSteps && normalizedSteps.length > 0) {
                            sourceStep = normalizedSteps[normalizedSteps.length - 1];
                            actualInputStepId = sourceStep.id;
                        } else {
                            actualInputStepId = 0;
                        }
                    }
                }

                // Tạo inputColumns với thông tin type
                let inputColumnsWithType = [];
                if (sourceStep && sourceStep.config && sourceStep.config.outputColumns) {
                    inputColumnsWithType = sourceStep.config.outputColumns; // Đã có thông tin type
                } else {
                    // Fallback: chuyển availableColumns thành format có type
                    inputColumnsWithType = columnsToUse.map(col => ({
                        name: typeof col === 'string' ? col : col.name || col,
                        type: 'text' // Mặc định là text
                    }));
                }

                return <Comp {...commonProps}
                    availableColumns={columnsToUse}
                    inputColumns={inputColumnsWithType}
                />;
            }

            // Step 33 (Percentile Group Filter) expects initialConfig instead of initialConfig->config
            if (type === 33) {
                return <Comp {...commonProps} initialConfig={config} availableColumns={columnsToUse} />;
            }
            return <Comp {...commonProps} availableColumns={columnsToUse} />;
        }

        if (type === 23) {
            // Special handling for Reverse Pivot Table (type 23)
            return <Comp {...commonProps} availableColumns={inputColumns} />;
        }
        // Pass input context for SumIf (type 35) like other input-aware steps
        if ([35].includes(type)) {
            let currentInputStepId = null;
            if (stepIndex !== null) {
                currentInputStepId = normalizedSteps[stepIndex]?.inputStepId;
                if (currentInputStepId === null || currentInputStepId === undefined) {
                    currentInputStepId = stepIndex === 0 ? 0 : normalizedSteps[stepIndex - 1]?.id;
                }
            } else {
                currentInputStepId = tempConfig?.inputStepId;
                if (currentInputStepId === null || currentInputStepId === undefined) {
                    currentInputStepId = normalizedSteps && normalizedSteps.length > 0 ? normalizedSteps[normalizedSteps.length - 1].id : 0;
                }
            }
            return <Comp {...commonProps}
                availableColumns={inputColumns}
                inputStepId={currentInputStepId}
                templateData={templateData}
                getTemplateRow={getTemplateRow}
                stepIndex={stepIndex}
                normalizedSteps={normalizedSteps}
            />;
        }
        if ([10].includes(type)) {
            // Xác định inputStepId dựa trên context (modal hay không)
            let currentInputStepId = null;
            if (stepIndex !== null) {
                // Ngoài modal - lấy từ normalizedSteps
                currentInputStepId = normalizedSteps[stepIndex]?.inputStepId;
            } else {
                // Trong modal - lấy từ tempConfig hoặc sử dụng logic mặc định
                currentInputStepId = tempConfig?.inputStepId;

                // Nếu tempConfig.inputStepId là null (thêm step mới), sử dụng logic mặc định
                if (currentInputStepId === null && normalizedSteps && normalizedSteps.length > 0) {
                    // Sử dụng step cuối cùng làm nguồn dữ liệu mặc định
                    currentInputStepId = normalizedSteps[normalizedSteps.length - 1].id;
                } else if (currentInputStepId === null) {
                    // Nếu không có step nào, sử dụng dữ liệu gốc
                    currentInputStepId = 0;
                }
            }

            return <Comp {...commonProps}
                availableColumns={inputColumns}
                inputStepId={currentInputStepId}
                templateData={templateData}
                getTemplateRow={getTemplateRow}
                stepIndex={stepIndex}
                normalizedSteps={normalizedSteps} />;
        }
        if ([3].includes(type)) return <Comp {...commonProps} numericColumns={inputColumns} />;
        if ([4, 7, 22].includes(type)) return <Comp {...commonProps} availableTables={availableTables}
            currentTableColumns={inputColumns}
            lookupTableColumns={referenceTableColumns} />;
        if ([18].includes(type)) return <Comp {...commonProps}
            availableColumns={inputColumns}
            availableTables={availableTables}
            normalizedSteps={normalizedSteps}
            templateData={templateData}
            getTemplateRow={getTemplateRow} />;
        if ([8, 24].includes(type)) return <Comp {...commonProps} availableColumns={inputColumns}
            availableTables={availableTables}
            referenceTableColumns={referenceTableColumns}
            currentStepId={stepIndex !== null ? normalizedSteps[stepIndex]?.id : (normalizedSteps.length > 0 ? Math.max(...normalizedSteps.map(step => step.id)) + 1 : 1)}
            steps={normalizedSteps}
            templateData={templateData}
            initialConfigs={initialConfigs}
            currentConfigs={currentConfigs}
            stepIndex={stepIndex} />;
        if ([12].includes(type)) {
            const currentStepId = editIdx !== null ? steps[editIdx]?.id : (showAddModal ? (steps.length > 0 ? Math.max(...steps.map(step => step.id)) + 1 : 1) : null);
            return <Comp {...commonProps} templateData={templateData} currentStepId={currentStepId}
                availableColumns={inputColumns} onStepStatusUpdate={handleStepStatusUpdate}
                onSaveData={handleSaveUploadData}
                onSaveAndAddStep={handleUploadSaveAndAddStep}
                uploadSaving={uploadSaving}
                modalOpen={showAddModal}
                onDataUpdate={onDataUpdate}
            />;
        }
        return <Comp {...commonProps} />;
    }

    // Render form cấu hình nguồn dữ liệu
    function renderInputSourceForm(stepIndex, step) {
        // Xác định nguồn dữ liệu để hiển thị
        const isModalMode = stepIndex === null; // Đang trong modal thêm/sửa
        const currentUseCustomInput = isModalMode ? (step?.useCustomInput || false) : (normalizedSteps[stepIndex]?.useCustomInput || false);
        const currentInputStepId = isModalMode ? step?.inputStepId : normalizedSteps[stepIndex]?.inputStepId;

        return (
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                {/*<div style={{ fontWeight: 'bold', marginBottom: 8 }}>Cấu hình nguồn dữ liệu:</div>*/}
                {/*<div*/}
                {/*	style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>*/}
                {/*	<span>Nguồn dữ liệu:</span>*/}
                {/*	<Switch*/}
                {/*		size="small"*/}
                {/*		checked={currentUseCustomInput}*/}
                {/*		onChange={async (checked) => {*/}
                {/*			if (isModalMode) {*/}
                {/*				// Trong modal thêm/sửa - cập nhật tempConfig*/}
                {/*				const newInputStepId = checked ? (tempConfig.inputStepId !== null ? tempConfig.inputStepId : 0) : null;*/}
                {/*				setTempConfig(prev => ({*/}
                {/*					...prev,*/}
                {/*					useCustomInput: checked,*/}
                {/*					inputStepId: newInputStepId,*/}
                {/*				}));*/}

                {/*				// Nếu đang trong modal edit, cập nhật ngay lập tức vào step thực tế*/}
                {/*				if (editIdx !== null) {*/}
                {/*					const currentStep = normalizedSteps[editIdx];*/}
                {/*					const hasInputSourceChanged =*/}
                {/*						currentStep.useCustomInput !== checked ||*/}
                {/*						currentStep.inputStepId !== newInputStepId;*/}

                {/*					const newSteps = normalizedSteps.map((s, i) =>*/}
                {/*						i === editIdx ? {*/}
                {/*							...s,*/}
                {/*							useCustomInput: checked,*/}
                {/*							inputStepId: newInputStepId,*/}
                {/*							needUpdate: hasInputSourceChanged ? true : s.needUpdate,*/}
                {/*						} : s,*/}
                {/*					);*/}
                {/*					onChange(newSteps);*/}

                {/*					// Lưu vào database ngay lập tức*/}
                {/*					if (templateData && templateData.id) {*/}
                {/*						try {*/}
                {/*							await updateTemplateTable({*/}
                {/*								...templateData,*/}
                {/*								steps: newSteps,*/}
                {/*							});*/}
                {/*							console.log('Đã cập nhật cấu hình nguồn dữ liệu ngay lập tức');*/}
                {/*							if (hasInputSourceChanged) {*/}
                {/*								console.log('Đã đánh dấu step cần update do thay đổi nguồn dữ liệu');*/}
                {/*							}*/}
                {/*						} catch (error) {*/}
                {/*							console.error('Lỗi khi lưu cấu hình:', error);*/}
                {/*						}*/}
                {/*					}*/}
                {/*				}*/}

                {/*				// Cập nhật inputColumns cho modal*/}
                {/*				let newInputColumns = [];*/}
                {/*				if (checked) {*/}
                {/*					// Custom input - lấy từ step được chọn*/}
                {/*					newInputColumns = await getInputColumns(null, newInputStepId);*/}
                {/*				} else {*/}
                {/*					// Chế độ mặc định - lấy từ step trước*/}
                {/*					newInputColumns = await getInputColumns(null, null);*/}
                {/*				}*/}
                {/*				setInputColumns(newInputColumns);*/}
                {/*				console.log('Switch change - Updated inputColumns:', newInputColumns);*/}

                {/*				// Gọi callback để cập nhật inputColumns ở parent component*/}
                {/*				if (onInputStepChange) {*/}
                {/*					onInputStepChange(newInputStepId);*/}
                {/*				}*/}
                {/*			} else {*/}
                {/*				// Ngoài modal - cập nhật trực tiếp*/}
                {/*				const currentStep = normalizedSteps[stepIndex];*/}
                {/*				handleUpdateInputSource(stepIndex, checked, currentStep.inputStepId);*/}
                {/*			}*/}
                {/*		}}*/}
                {/*	/>*/}
                {/*</div>*/}

                {currentUseCustomInput ? (
                    <div>
                        <span style={{ marginRight: 8 }}>Chọn step:</span>
                        <Select
                            size="small"
                            style={{ width: 120 }}
                            value={currentInputStepId !== undefined && currentInputStepId !== null ? currentInputStepId : null}
                            onChange={async (value) => {
                                if (isModalMode) {
                                    // Trong modal thêm/sửa - cập nhật tempConfig
                                    setTempConfig(prev => ({
                                        ...prev,
                                        useCustomInput: true,
                                        inputStepId: value,
                                    }));

                                    // Nếu đang trong modal edit, cập nhật ngay lập tức vào step thực tế
                                    if (editIdx !== null) {
                                        const currentStep = normalizedSteps[editIdx];
                                        const hasInputSourceChanged =
                                            currentStep.useCustomInput !== true ||
                                            currentStep.inputStepId !== value;

                                        const newSteps = normalizedSteps.map((s, i) =>
                                            i === editIdx ? {
                                                ...s,
                                                useCustomInput: true,
                                                inputStepId: value,
                                                needUpdate: hasInputSourceChanged ? true : s.needUpdate,
                                            } : s,
                                        );
                                        onChange(newSteps);

                                        // Lưu vào database ngay lập tức
                                        if (templateData && templateData.id) {
                                            try {
                                                await updateTemplateTable({
                                                    ...templateData,
                                                    steps: newSteps,
                                                });
                                                console.log('Đã cập nhật cấu hình nguồn dữ liệu ngay lập tức');
                                                if (hasInputSourceChanged) {
                                                    console.log('Đã đánh dấu step cần update do thay đổi nguồn dữ liệu');
                                                }
                                            } catch (error) {
                                                console.error('Lỗi khi lưu cấu hình:', error);
                                            }
                                        }
                                    }

                                    // Cập nhật inputColumns cho modal
                                    const newInputColumns = await getInputColumns(null, value);
                                    setInputColumns(newInputColumns);

                                    // Gọi callback để cập nhật inputColumns ở parent component
                                    // if (onInputStepChange) {
                                    // 	onInputStepChange(value);
                                    // }
                                } else {
                                    // Ngoài modal - cập nhật trực tiếp
                                    handleUpdateInputSource(stepIndex, true, value);
                                }
                            }}
                        >
                            {/* Chỉ hiển thị lựa chọn "Gốc" khi step đầu tiên không phải type = 12 (Upload Data) */}
                            {(() => {
                                // Kiểm tra step đầu tiên trong pipeline
                                const firstStepType = normalizedSteps.length > 0 ? normalizedSteps[0].type : null;

                                // Không hiển thị "Gốc" nếu step đầu tiên có type = 12
                                if (firstStepType !== 12) {
                                    return <Option value={0}>Gốc</Option>;
                                }
                                return null;
                            })()}
                            {normalizedSteps
                                .filter(s => isModalMode || s.id < (stepIndex + 1))
                                .filter(s => s.status === 'completed' || s.type === 12)
                                .map(s => (
                                    <Option key={s.id} value={s.id}>Step {s.id}</Option>
                                ))
                            }
                        </Select>
                    </div>
                ) : (
                    <div style={{ color: '#666' }}>
                        Bước trước
                    </div>
                )}
            </div>
        );
    }

    // Lấy màu tag theo status
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'default';
            case 'running':
                return 'processing';
            case 'completed':
                return 'success';
            case 'error':
                return 'error';
            default:
                return 'default';
        }
    };

    // Lấy text tag theo status
    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'running':
                return 'Running';
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Error';
            default:
                return 'Pending';
        }
    };

    // Tính Last Update tổng hợp cho một step từ nhiều field thời gian
    const getStepLastUpdate = (step) => {
        if (!step) return null;
        const timestampStrings = [
            step?.config?.lastUpdate,
            step?.lastRunTimestamp,
            step?.config?.outputColumnsTimestamp,
            step?.extractToGGS?.extractAt,
        ];
        const dates = timestampStrings
            .filter(Boolean)
            .map((t) => new Date(t))
            .filter((d) => !Number.isNaN(d.getTime()));
        if (dates.length === 0) return null;
        const latestMs = Math.max(...dates.map((d) => d.getTime()));
        return new Date(latestMs);
    };

    // States for Google Drive multi-file modal in Import More Data
    const [driveFileList, setDriveFileList] = useState([]);
    const [isDriveFileModalVisible, setIsDriveFileModalVisible] = useState(false);
    const [selectedDriveFileIds, setSelectedDriveFileIds] = useState([]);
    const [driveFileMeta, setDriveFileMeta] = useState({}); // { [fileId]: { sheetNames: [], selectedSheet: '', headerRow: number, sheetPreview: {} } }
    const [driveOrderMap, setDriveOrderMap] = useState({});
    const [driveLoading, setDriveLoading] = useState(false);

    // Khi mở modal, tích sẵn các file đã lưu cùng cấu hình
    useEffect(() => {
        const primeModalSelections = async () => {
            try {
                if (!isDriveFileModalVisible) return;
                const savedInfos = Array.isArray(importMoreDataConfig?.googleDriveFilesInfo) ? importMoreDataConfig.googleDriveFilesInfo : [];
                if (savedInfos.length === 0) return;

                // Set selected ids and order map
                const ids = savedInfos.map(f => f.id).filter(Boolean);
                setSelectedDriveFileIds(ids);
                const order = {};
                savedInfos.forEach(f => { if (f?.id) order[f.id] = Number(f.order ?? 0) || 0; });
                setDriveOrderMap(order);

                // Khởi tạo meta từ filesInfo (không dùng googleDriveFilesMeta đã lưu)
                const mergedFromInfos = {};
                for (const info of savedInfos) {
                    if (!info?.id) continue;
                    mergedFromInfos[info.id] = {
                        selectedSheet: info.selectedSheet ?? null,
                        headerRow: Number(info.headerRow) || 1,
                        sheetNames: [],
                        sheetPreview: {}
                    };
                }
                setDriveFileMeta(prev => ({ ...mergedFromInfos, ...prev }));

                // Luôn fetch sheetNames mới từ API cho các file đã lưu
                const idsNeedingSheets = ids;
                if (idsNeedingSheets.length > 0) {
                    setDriveLoading(true);
                    try {
                        const listMap = {};
                        for (const fileId of idsNeedingSheets) {
                            try {
                                const res = await n8nWebhookGoogleDrive({ googleDriveUrl: fileId });
                                const sheetNames = res?.sheetNames || Object.keys(res?.sheets || {});
                                const list = Array.isArray(sheetNames)
                                    ? sheetNames.map(x => (typeof x === 'string' ? x : (x?.name || x?.title || String(x))))
                                    : [];
                                listMap[fileId] = list;
                            } catch (_) {
                                // ignore per-file errors
                            }
                        }
                        setDriveFileMeta(prev => {
                            const next = { ...prev };
                            Object.keys(listMap).forEach(fid => {
                                const prior = next[fid] || {};
                                next[fid] = { ...prior, sheetNames: listMap[fid] };
                            });
                            return next;
                        });
                    } finally {
                        setDriveLoading(false);
                    }
                }

                // Preload sheet preview for saved selectedSheet to show header options
                const infosNeedingPreview = savedInfos.filter(f => f.id && f.selectedSheet);
                if (infosNeedingPreview.length > 0) {
                    setDriveLoading(true);
                    try {
                        const previewUpdates = {};
                        for (const info of infosNeedingPreview) {
                            const fileId = info.id;
                            const sel = info.selectedSheet;
                            const hasPreview = !!(mergedFromInfos?.[fileId]?.sheetPreview && mergedFromInfos[fileId].sheetPreview[sel]);
                            if (hasPreview) continue;
                            try {
                                const metaRes = await n8nWebhookGoogleDrive({ googleDriveUrl: fileId });
                                const sheetsMap = metaRes?.sheets || {};
                                const matrix = Array.isArray(sheetsMap[sel]?.data) ? sheetsMap[sel].data : [];
                                previewUpdates[fileId] = { sheetPreview: { [sel]: matrix } };
                            } catch (_) {
                                // ignore per-file errors
                            }
                        }
                        setDriveFileMeta(prev => {
                            const next = { ...prev };
                            Object.keys(previewUpdates).forEach(fid => {
                                const prior = next[fid] || {};
                                const priorPreview = prior.sheetPreview || {};
                                const addedPreview = previewUpdates[fid].sheetPreview || {};
                                next[fid] = {
                                    ...prior,
                                    sheetPreview: { ...priorPreview, ...addedPreview }
                                };
                            });
                            return next;
                        });
                    } finally {
                        setDriveLoading(false);
                    }
                }
            } catch (_) { /* noop */ }
        };
        primeModalSelections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDriveFileModalVisible]);

    // Lấy tóm tắt nguồn dữ liệu
    const getInputSourceSummary = (step, stepIndex) => {
        if (step.useCustomInput && step.inputStepId !== undefined && step.inputStepId !== null) {
            if (step.inputStepId === 0) {
                return 'Dữ liệu gốc';
            } else {
                return `Step ${step.inputStepId}`;
            }
        } else {
            // Khi không bật switch, sử dụng step trước đó
            if (stepIndex === 0 || step.inputStepId === null) {
                return 'Dữ liệu gốc';
            } else {
                return `Step ${normalizedSteps[stepIndex - 1]?.id || 'N/A'}`;
            }
        }
    };

    // Hàm tạo cột tự động dựa trên dữ liệu hoặc outputColumns
    const createColumnsFromData = async (data, templateId, outputColumns = null, originalColumns = null) => {
        if (!data || data.length === 0) return [];

        // Ưu tiên sử dụng outputColumns nếu có (cho Excel aggregate)
        let columns;
        if (outputColumns && outputColumns.length > 0) {
            console.log('Using outputColumns for column creation:', outputColumns);
            columns = outputColumns.map(col => col.name);
        } else if (originalColumns && originalColumns.length > 0) {
            // Sử dụng thứ tự cột gốc nếu có
            console.log('Using original columns for column creation:', originalColumns);
            columns = originalColumns;
        } else {
            // Fallback: lấy từ dữ liệu thực tế (có thể bị sắp xếp)
            columns = Object.keys(data[0]);
            console.log('Using data columns for column creation (may be sorted):', columns);
        }

        try {
            // Tạo cột cho mỗi field
            const columnPromises = columns.map(async (columnName, index) => {
                // Use original column name without sanitization
                let sanitizedColumnName = columnName;
                if (typeof columnName === 'string') {
                    // Keep original column name as is
                    sanitizedColumnName = columnName;
                } else {
                    // Handle non-string column names
                    sanitizedColumnName = `column_${index + 1}`;
                }

                const columnData = {
                    tableId: templateId,
                    columnName: sanitizedColumnName,
                    columnType: 'text', // Mặc định là text
                    columnIndex: index,
                    width: 120,
                };

                // Debug: Check if this is Google Drive data
                if (typeof columnName === 'string' && columnName.includes(' ')) {
                    console.log('Google Drive column detected:', columnName);
                }
                // Gọi API để tạo cột
                try {
                    await createTemplateColumn(columnData);
                } catch (error) {
                    console.error('Error creating column:', error);
                    console.error('Request data:', columnData);
                    throw error;
                }
                return columnData;
            });

            const createdColumns = await Promise.all(columnPromises);
            message.success(`Đã tạo ${columns.length} cột thành công`);

            // Return sanitized column names for data mapping
            return createdColumns.map(col => col.columnName);
        } catch (error) {
            console.error('Lỗi khi tạo cột:', error);
            message.error('Có lỗi khi tạo cột');
            return [];
        }
    };

    // Hàm validate cột cho step từ bước 2 trở đi
    const validateColumns = (uploadedData, availableColumns) => {
        if (!uploadedData || uploadedData.length === 0) {
            return { isValid: false, message: 'Không có dữ liệu để validate' };
        }

        // Lấy cột từ dữ liệu upload
        const uploadedColumns = Object.keys(uploadedData[0]);

        // So sánh với cột hiện tại
        const missingColumns = availableColumns.filter(col => !uploadedColumns.includes(col));
        const extraColumns = uploadedColumns.filter(col => !availableColumns.includes(col));

        if (missingColumns.length > 0 || extraColumns.length > 0) {
            let errorMessage = 'Cấu trúc cột không khớp với bảng hiện tại:';

            if (missingColumns.length > 0) {
                errorMessage += `\n\n❌ Thiếu các cột: ${missingColumns.join(', ')}`;
            }

            if (extraColumns.length > 0) {
                errorMessage += `\n\n❌ Thừa các cột: ${extraColumns.join(', ')}`;
            }

            errorMessage += `\n\n✅ Cột hiện tại: ${availableColumns.join(', ')}`;
            errorMessage += `\n📤 Cột upload: ${uploadedColumns.join(', ')}`;

            return { isValid: false, message: errorMessage };
        }

        return { isValid: true, message: 'Cấu trúc cột hợp lệ' };
    };

    // Hàm lưu dữ liệu vào database
    // Hàm lưu dữ liệu vào database
const saveDataToDatabase = async (data, templateId, currentStepId, outputColumns = null, originalColumns = null) => {
    if (!data || data.length === 0) {
        message.warning('Không có dữ liệu để lưu');
        return false;
    }

    try {
        console.log('data', data);
        // Làm sạch meta từ multi-file trước khi lưu và chuẩn hoá mảng
        const cleanData = (Array.isArray(data) ? data : [data]).map((row) => {
            const { __fileId, __fileOrder, ...rest } = row || {};
            return rest;
        });

        // Chuẩn bị dữ liệu để lưu
        let dataToSave = {
            tableId: templateId,
            data: cleanData, // Truyền trực tiếp mảng dữ liệu đã làm sạch
        };

        // Nếu là step từ bước 2 trở đi, thêm version để tạo dữ liệu mới
        if (currentStepId && currentStepId > 1) {
            dataToSave.version = currentStepId;
        }

        // Đảm bảo cột tồn tại trước khi lưu (đặc biệt với step 1)
        if (!currentStepId || currentStepId === 1) {
            const columns = await createColumnsFromData(cleanData, templateId, outputColumns, originalColumns);
            if (!columns || columns.length === 0) {
                message.error('Không thể tạo cột');
                return false;
            }
        }

        // Lưu dữ liệu theo batch tuần tự để đảm bảo thứ tự dữ liệu
        const batchSize = 1000; // Tăng batch size để tối ưu hóa hiệu suất xử lý
        const totalBatches = Math.ceil(cleanData.length / batchSize);

        // Hiển thị progress cho user nếu có nhiều batch
        // if (totalBatches > 1) {
        //  message.loading(`Đang lưu ${data.length} dòng dữ liệu... (0/${totalBatches} batches)`, 0);
        // }

        // Xử lý batch tuần tự để đảm bảo thứ tự dữ liệu được giữ nguyên
        for (let i = 0; i < cleanData.length; i += batchSize) {
            const batch = cleanData.slice(i, i + batchSize);
            if (batch.length === 0) break;

            // Kiểm tra xem có phải batch cuối cùng không
            const isLastBatch = (i + batchSize) >= cleanData.length;
            const shouldClearCache = isLastBatch;

            const batchData = {
                tableId: templateId,
                data: batch, // Truyền trực tiếp mảng batch
                id_DataOriginal: null,
                version: currentStepId && currentStepId > 1 ? currentStepId : null,
                skipCacheClear: !shouldClearCache, // Skip cache clear cho tất cả batch trừ batch cuối
            };

            try {
                await createBathTemplateRow(batchData);

                // Cập nhật progress
                const completedBatches = Math.floor((i + batchSize) / batchSize);

                // if (totalBatches > 1) {
                //  message.loading(`Đang lưu ${data.length} dòng dữ liệu... (${completedBatches}/${totalBatches} batches)`, 0);
                // }

                // Delay nhỏ giữa các batch để tránh overload server
                if (!isLastBatch) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            } catch (batchError) {
                if (totalBatches > 1) {
                    message.destroy();
                }
                throw new Error(`Lỗi khi lưu dữ liệu: ${batchError.message}`);
            }
        }

        // Xóa loading message khi hoàn thành
        // if (totalBatches > 1) {
        //  message.destroy();
        // }

        // Cột đã được đảm bảo trước khi lưu ở trên

        const actionText = currentStepId && currentStepId > 1 ? 'thêm' : 'lưu';
        message.success(`Đã ${actionText} ${data.length} dòng dữ liệu thành công`);
        return true;
    } catch (error) {
        console.error('Lỗi khi lưu dữ liệu:', error);
        message.error('Có lỗi khi lưu dữ liệu');
        return false;
    }
};
    // Hàm xử lý save cho từng loại upload
    const handleSaveUploadData = async (uploadConfig, currentStepId) => {
        if (!templateData?.id) {
            message.error('Không tìm thấy template');
            return false;
        }

        console.log('PipelineSteps - handleSaveUploadData received:', uploadConfig);

        // Fallback: xác định uploadType dựa trên dữ liệu có sẵn nếu uploadType không được set
        let uploadType = uploadConfig.uploadType;
        if (!uploadType) {
            if (uploadConfig.excelData && uploadConfig.excelData.length > 0) {
                uploadType = 'excel';
            } else if (uploadConfig.googleSheetsData && uploadConfig.googleSheetsData.length > 0) {
                uploadType = 'googleSheets';
            } else if (uploadConfig.googleDriveData && uploadConfig.googleDriveData.length > 0) {
                uploadType = 'googleDrive';
            } else if (uploadConfig.googleDriveFolderUrl) {
                uploadType = 'googleDriveFolder';
            } else if (uploadConfig.postgresData && uploadConfig.postgresData.length > 0) {
                uploadType = 'postgresql';
            } else if (uploadConfig.apiData && uploadConfig.apiData.length > 0) {
                uploadType = 'api';
            } else if (uploadConfig.systemData && uploadConfig.systemData.length > 0) {
                uploadType = 'system';
            } else if (uploadConfig.htqcData && uploadConfig.htqcData.length > 0) {
                uploadType = 'htqc';
            }
        }

        // Nếu vẫn không xác định được uploadType, báo lỗi
        if (!uploadType) {
            message.error('Không thể xác định loại upload. Vui lòng kiểm tra lại dữ liệu.');
            return false;
        }

        let dataToSave = [];
        let success = false;

        // Chuẩn hoá dữ liệu đối với HTQC trước khi switch (fallback cho tương thích ngược)
        if (uploadType === 'htqc' && (!uploadConfig.excelData || uploadConfig.excelData.length === 0) && uploadConfig.htqcData && uploadConfig.htqcData.length > 0) {
            console.log('HTQC Pipeline Debug - uploadConfig.htqcData:', uploadConfig.htqcData);
            uploadConfig.excelData = uploadConfig.htqcData;
            uploadConfig.excelColumns = uploadConfig.htqcColumns || Object.keys(uploadConfig.htqcData[0] || {});
        }

        switch (uploadType) {
            case 'htqc':
                // Lưu dữ liệu từ nguồn HTQC (đã transform thành excelData & excelColumns)
                console.log('HTQC Pipeline Debug - uploadConfig:', uploadConfig);
                console.log('HTQC Pipeline Debug - excelData length:', uploadConfig.excelData?.length);
                console.log('HTQC Pipeline Debug - outputColumns:', uploadConfig.outputColumns);

                if (uploadConfig.excelData && uploadConfig.excelData.length > 0) {
                    dataToSave = uploadConfig.excelData;
                    // Validate trước khi lưu
                    if (currentStepId && currentStepId > 1 && availableColumns.length > 0) {
                        const validation = validateColumns(dataToSave, availableColumns);
                        if (!validation.isValid) {
                            message.error(validation.message);
                            return false;
                        }
                    }
                    success = await saveDataToDatabase(dataToSave, templateData.id, currentStepId, uploadConfig.outputColumns, uploadConfig.excelColumns);
                } else {
                    console.error('HTQC Pipeline Error - No excelData found');
                    message.warning('Chưa có dữ liệu HTQC để lưu');
                    return false;
                }
                break;
            case 'excel':
                console.log('uploadConfig', uploadConfig);
                if (uploadConfig.excelData && uploadConfig.excelData.length > 0) {
                    dataToSave = uploadConfig.excelData;
                    console.log('dataToSave', dataToSave);
                    // Validate trước khi lưu
                    if (currentStepId && currentStepId > 1 && availableColumns.length > 0) {
                        const validation = validateColumns(dataToSave, availableColumns);
                        if (!validation.isValid) {
                            message.error(validation.message);
                            return false;
                        }
                    }
                    success = await saveDataToDatabase(dataToSave, templateData.id, currentStepId, uploadConfig.outputColumns, uploadConfig.excelColumns);
                } else {
                    message.warning('Chưa có dữ liệu Excel để lưu');
                    return false;
                }
                break;
            case 'googleSheets':
                if (uploadConfig.googleSheetsData && uploadConfig.googleSheetsData.length > 0) {
                    dataToSave = uploadConfig.googleSheetsData;
                    // Validate trước khi lưu
                    if (currentStepId && currentStepId > 1 && availableColumns.length > 0) {
                        const validation = validateColumns(dataToSave, availableColumns);
                        if (!validation.isValid) {
                            message.error(validation.message);
                            return false;
                        }
                    }
                    success = await saveDataToDatabase(dataToSave, templateData.id, currentStepId, null, uploadConfig.googleSheetsColumns);
                } else {
                    message.warning('Chưa có dữ liệu Google Sheets để lưu');
                    return false;
                }
                break;
            case 'googleDrive':
                if (uploadConfig.googleDriveData && uploadConfig.googleDriveData.length > 0) {
                    dataToSave = uploadConfig.googleDriveData;

                    // For Google Drive data, use original column names without sanitization
                    if (currentStepId === 1 && uploadConfig.googleDriveColumns) {
                        const originalColumns = uploadConfig.googleDriveColumns.map(col => col.name);
                        // Use original column names as is
                        const sanitizedColumns = originalColumns;

                        console.log('Google Drive column mapping:', {
                            originalColumns,
                            sanitizedColumns,
                            headerRow: uploadConfig.googleDriveHeaderRow,
                            sampleData: dataToSave[0]
                        });


                        // No need to map data since we're using original column names
                        console.log('Using original column names without mapping:', {
                            originalColumns,
                            sampleData: dataToSave[0]
                        });

                        // Debug: Check if data is preserved
                        console.log('Google Drive data preservation check:', {
                            originalColumns,
                            sampleData: dataToSave[0],
                            totalRows: dataToSave.length
                        });
                    }

                    // Validate trước khi lưu
                    if (currentStepId && currentStepId > 1 && availableColumns.length > 0) {
                        const validation = validateColumns(dataToSave, availableColumns);
                        if (!validation.isValid) {
                            message.error(validation.message);
                            return false;
                        }
                    }
                    success = await saveDataToDatabase(dataToSave, templateData.id, currentStepId, null, uploadConfig.googleDriveColumns);

                    // Save to recent folders if successful
                    // Auto-saving recent folders is disabled. Admin manages recent folders manually in Settings popover.
                } else {
                    message.warning('Chưa có dữ liệu Google Drive để lưu');
                    return false;
                }
                break;
            case 'googleDriveFolder':
                // Gọi BE tổng hợp giống processGoogleDriveFolder và lưu ngay
                try {
                    const headerRow1Based = Number(uploadConfig.headerRow || 1);
                    const payloadAgg = {
                        googleDriveFolderUrl: uploadConfig.googleDriveFolderUrl,
                        fileNameCondition: uploadConfig.fileNameCondition || '',
                        lastUpdateCondition: uploadConfig.lastUpdateCondition || '',
                        headerRow: Math.max(0, headerRow1Based - 1),
                        mergeColumns: uploadConfig.mergeColumns || [],
                        removeDuplicateColumns: uploadConfig.removeDuplicateColumns || [],
                        sortColumns: uploadConfig.sortColumns || [],
                        schema: currentSchemaPathRecord?.path,
                    };

                    const aggRes = await fetchGoogleDriveFolder(payloadAgg);
                    console.log('aggRes', aggRes);
                    const resBody = aggRes?.data || aggRes;
                    if (!resBody || !resBody.success) {
                        message.error(resBody?.error || 'Không thể tổng hợp dữ liệu từ Google Drive Folder');
                        return false;
                    }

                    const outputColumns = resBody.columns
                    dataToSave = Array.isArray(resBody.data) ? resBody.data : [];

                    if (!dataToSave || dataToSave.length === 0) {
                        message.warning('Không có dữ liệu để lưu từ Google Drive Folder');
                        return false;
                    }

                    // Validate trước khi lưu nếu không phải bước đầu
                    if (currentStepId && currentStepId > 1 && availableColumns.length > 0) {
                        const validation = validateColumns(dataToSave, availableColumns);
                        if (!validation.isValid) {
                            message.error(validation.message);
                            return false;
                        }
                    }
               
                    success = await saveDataToDatabase(dataToSave, templateData.id, currentStepId, outputColumns, resBody.columns);
         
                  
                    if (success) {
                        // Cập nhật outputColumns vào step hiện tại (nếu đã có step upload) và persist vào template_table
                        const baseSteps = Array.isArray(steps) ? steps : [];
                        const targetStepId = currentStepId || (baseSteps.find(s => s.type === 12)?.id);
                        if (targetStepId && baseSteps.length > 0) {
                            const updatedSteps = baseSteps.map(step =>
                                step.id === targetStepId
                                    ? {
                                        ...step,
                                        config: {
                                            ...step.config,
                                            outputColumns,
                                            outputColumnsTimestamp: new Date().toISOString(),
                                            isFrequencyActive: !!uploadConfig.isFrequencyActive,
                                            frequencyHours: uploadConfig.isFrequencyActive ? (uploadConfig.frequencyHours || 3) : 0,
                                        },
                                    }
                                    : step,
                            );
                            onChange && onChange(updatedSteps);
                            await updateTemplateTable({ ...templateData, steps: updatedSteps });
                        }

                        // Nếu bật tự động cập nhật, tạo/cập nhật FrequencyConfig
                        try {
                            if (uploadConfig.isFrequencyActive && templateData?.id) {
                                const frequency_hours = uploadConfig.frequencyHours || 3;
                                const freqPayload = {
                                    tableId: templateData.id,
                                    frequency_hours,
                                    is_active: true,
                                    config: {
                                        uploadType: 'googleDriveFolder',
                                        outputColumns,
                                        googleDriveFolderUrl: uploadConfig.googleDriveFolderUrl,
                                        fileNameCondition: uploadConfig.fileNameCondition || '',
                                        lastUpdateCondition: uploadConfig.lastUpdateCondition || '',
                                        headerRow: Math.max(0, (uploadConfig.headerRow || 1) - 1),
                                        mergeColumns: uploadConfig.mergeColumns || [],
                                        removeDuplicateColumns: uploadConfig.removeDuplicateColumns || [],
                                        sortColumns: uploadConfig.sortColumns || [],
                                    },
                                    schema: currentSchemaPathRecord?.path,
                                };
                                await createFrequencyConfig({ tableId: templateData.id, config: freqPayload, schema: currentSchemaPathRecord?.path });
                            }
                        } catch (e) {
                            console.warn('Lưu FrequencyConfig (save flow) thất bại (bỏ qua):', e);
                        }
                    }

                    // Trả về object để handleUploadSaveAndAddStep có thể lấy outputColumns tạo step mới
                    return { success: true, outputColumns, originalColumns: resBody.columns };
                } catch (e) {
                    console.error('Lỗi tổng hợp Google Drive Folder khi lưu:', e);
                    message.error('Có lỗi khi tổng hợp dữ liệu Google Drive Folder');
                    return false;
                }
                break;
            case 'postgresql':
                if (uploadConfig.postgresData && uploadConfig.postgresData.length > 0) {
                    dataToSave = uploadConfig.postgresData;
                    // Validate trước khi lưu
                    if (currentStepId && currentStepId > 1 && availableColumns.length > 0) {
                        const validation = validateColumns(dataToSave, availableColumns);
                        if (!validation.isValid) {
                            message.error(validation.message);
                            return false;
                        }
                    }
                    success = await saveDataToDatabase(dataToSave, templateData.id, currentStepId, null, uploadConfig.postgresColumns);
                } else {
                    message.warning('Chưa có dữ liệu PostgreSQL để lưu');
                    return false;
                }
                break;
            case 'api':
                if (uploadConfig.apiData && uploadConfig.apiData.length > 0) {
                    dataToSave = uploadConfig.apiData;
                    // Validate trước khi lưu
                    if (currentStepId && currentStepId > 1 && availableColumns.length > 0) {
                        const validation = validateColumns(dataToSave, availableColumns);
                        if (!validation.isValid) {
                            message.error(validation.message);
                            return false;
                        }
                    }
                    success = await saveDataToDatabase(dataToSave, templateData.id, currentStepId, null, uploadConfig.apiColumns);
                } else {
                    message.warning('Chưa có dữ liệu API để lưu');
                    return false;
                }
                break;
            case 'system':
                // Đối với Import từ hệ thống, không lưu dữ liệu vào database
                // Chỉ lưu cấu hình và luôn hiển thị dữ liệu mới nhất từ nguồn gốc
                if (uploadConfig.systemConfig) {
                    // Chỉ cần lưu cấu hình, không cần lưu dữ liệu
                    success = true;
                    message.success('Đã lưu cấu hình Import từ hệ thống thành công');
                } else {
                    message.warning('Chưa có cấu hình để Import từ hệ thống');
                    return false;
                }
                break;
            
            default:
                message.error('Loại upload không hợp lệ');
                return false;
        }

        return success;
    };

    const handlePublishStep = async (stepId, name) => {
        const stepToPublish = normalizedSteps.find(s => s.id === stepId);
        if (!stepToPublish) {
            message.error('Không tìm thấy step để xuất bản');
            return;
        }

        let payload;

        // Nếu là step "Import từ hệ thống", xuất bản dữ liệu từ nguồn
        if (stepToPublish.type === 12 && stepToPublish.config?.uploadType === 'system' && stepToPublish.config?.systemConfig) {
            const { templateTableId: sourceTableId, stepId: sourceStepId } = stepToPublish.config.systemConfig;
            if (sourceTableId && sourceStepId) {
                try {
                    const sourceTemplate = await getTemplateInfoByTableId(sourceTableId);
                    if (!sourceTemplate || !sourceTemplate.fileNote_id) {
                        message.error('Không tìm thấy thông tin file note của bảng dữ liệu gốc.');
                        return;
                    }

                    payload = {
                        id_version: sourceStepId,
                        id_template: sourceTableId,
                        id_fileNote: sourceTemplate.fileNote_id,
                        created_at: new Date().toISOString(),
                        user_create: currentUser.email,
                        name: name || `Published from: ${templateData.name} - Step ${stepId}`, // Gợi ý tên để dễ nhận biết
                    };
                } catch (error) {
                    console.error('Lỗi khi lấy thông tin bảng gốc:', error);
                    message.error('Không thể lấy thông tin của bảng dữ liệu gốc để xuất bản.');
                    return;
                }
            } else {
                message.error('Cấu hình của step "Import từ hệ thống" bị thiếu thông tin nguồn.');
                return;
            }
        } else {
            // Logic xuất bản mặc định cho các step khác
            payload = {
                id_version: stepId,
                id_template: templateData.id,
                id_fileNote: idFileNote,
                created_at: new Date().toISOString(),
                user_create: currentUser.email,
                name: name || '',
            };
        }

        let res = await createNewApprovedVersion(payload);
        if (res) {
            message.success('Đã xuất bản thành công!');
            fetchListApprovedVersion();
        } else {
            message.error('Xuất bản thất bại!');
        }
    };

    // Thêm hàm kiểm tra đã xuất bản
    const isStepPublished = (stepId) => {
        const step = normalizedSteps.find(s => s.id === stepId);

        // Xử lý trường hợp đặc biệt cho "Import từ hệ thống"
        if (step && step.type === 12 && step.config?.uploadType === 'system' && step.config?.systemConfig) {
            const { templateTableId: sourceTableId, stepId: sourceStepId } = step.config.systemConfig;
            const sourceTemplate = availableTables.find(t => t.id === sourceTableId);
            const sourceFileNoteId = sourceTemplate ? sourceTemplate.fileNote_id : null;

            if (sourceFileNoteId && sourceStepId) {
                return listApprovedVersion && listApprovedVersion.some(
                    v => v.id_version == sourceStepId && v.id_fileNote == sourceFileNoteId,
                );
            }
        }

        // Logic mặc định
        return (
            listApprovedVersion &&
            listApprovedVersion.some(
                v => v.id_version == stepId && v.id_fileNote == idFileNote,
            )
        );
    };

    // Hàm kiểm tra step có được link sang công cụ khác không
    const isStepLinkedToOtherApps = (stepId) => {
        const approvedVersion = listApprovedVersion.find(v => v.id_version == stepId && v.id_fileNote == idFileNote);
        if (!approvedVersion) return false;

        // Kiểm tra thuộc tính apps
        const apps = approvedVersion.apps;
        // Trả về true nếu apps không null và có length > 0
        return apps !== null && apps !== undefined && Array.isArray(apps) && apps.length > 0;
    };

    // Hàm thu hồi xuất bản với cảnh báo
    const handleUnpublishStepWithWarning = async (stepId) => {
        const isLinked = isStepLinkedToOtherApps(stepId);

        if (isLinked) {
            // Hiển thị modal cảnh báo
            Modal.confirm({
                title: 'Cảnh báo thu hồi dữ liệu',
                content: 'Data này đang được link sang công cụ khác, thu hồi data này có thể ảnh hưởng tới hoạt động của công cụ được cấp dữ liệu, hãy xác nhận!',
                onOk: () => handleUnpublishStep(stepId),
            });
        } else {
            // Thu hồi trực tiếp
            handleUnpublishStep(stepId);
        }
    };


    // Hàm thu hồi xuất bản
    const handleUnpublishStep = async (stepId) => {
        const step = normalizedSteps.find(s => s.id === stepId);
        let versionToDelete = null;

        if (step && step.type === 12 && step.config?.uploadType === 'system' && step.config?.systemConfig) {
            const { templateTableId: sourceTableId, stepId: sourceStepId } = step.config.systemConfig;
            const sourceTemplate = availableTables.find(t => t.id === sourceTableId);
            const sourceFileNoteId = sourceTemplate ? sourceTemplate.fileNote_id : null;

            versionToDelete = listApprovedVersion.find(
                v => v.id_version == sourceStepId && v.id_fileNote == sourceFileNoteId,
            );
        } else {
            versionToDelete = listApprovedVersion.find(
                v => v.id_version == stepId && v.id_fileNote == idFileNote,
            );
        }

        if (versionToDelete) {
            await deleteApprovedVersion(versionToDelete.id);
            message.success('Đã thu hồi xuất bản!');
            fetchListApprovedVersion();
        } else {
            message.error('Không tìm thấy phiên bản để thu hồi!');
        }
    };

    // Hàm xử lý xuất dữ liệu ra Google Sheets
    const handleExportToGoogleSheets = async () => {
        // Bắt buộc nhập URL
        if (!googleSheetsModal.sheetUrl.trim()) {
            message.error('Vui lòng nhập link Google Sheets!');
            return;
        }

        // Validate Google Sheets URL
        const googleSheetsUrlPattern = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
        if (!googleSheetsUrlPattern.test(googleSheetsModal.sheetUrl)) {
            message.error('Link Google Sheets không hợp lệ! Định dạng đúng: https://docs.google.com/spreadsheets/d/your-sheet-id/edit');
            return;
        }

        // Kiểm tra step có tồn tại không
        const step = normalizedSteps.find(s => s.id === googleSheetsModal.stepId);
        if (!step) {
            message.error('Không tìm thấy step để xuất dữ liệu!');
            return;
        }

        // Kiểm tra step đã hoàn thành chưa
        if (step.status !== 'completed') {
            message.error('Chỉ có thể xuất dữ liệu từ step đã hoàn thành!');
            return;
        }

        setGoogleSheetsModal(prev => ({ ...prev, loading: true }));

        try {
            const stepId = googleSheetsModal.stepId;
            let tableData = [];

            // Lấy dữ liệu từ step được chọn
            if (stepId && templateData && getTemplateRow) {
                let dataResponse;
                if (stepId === 1) {
                    // Step 1: Lấy dữ liệu gốc
                    console.log('🔍 Lấy dữ liệu gốc cho step 1:', { templateId: templateData.id });
                    dataResponse = await getTemplateRow(templateData.id, null, false);
                } else {
                    // Các step khác: Lấy dữ liệu từ step đó
                    console.log('🔍 Lấy dữ liệu từ step:', { templateId: templateData.id, stepId });
                    dataResponse = await getTemplateRow(templateData.id, stepId, false);
                }
                const rawData = dataResponse.rows || [];
                tableData = rawData.map(row => row.data);
                console.log('📊 Dữ liệu lấy được:', { stepId, dataRows: tableData.length, rawDataLength: rawData.length });
            }

            if (tableData.length === 0) {
                message.warning('Không có dữ liệu để xuất!');
                setGoogleSheetsModal(prev => ({ ...prev, loading: false }));
                return;
            }

            // Lấy thứ tự cột theo outputColumns của step
            const step = normalizedSteps.find(s => s.id === stepId);
            let columnOrder = [];


            if (step && step.config && step.config.outputColumns && step.config.outputColumns.length > 0) {
                // Sử dụng outputColumns từ step.config - giữ nguyên thứ tự
                columnOrder = step.config.outputColumns.map(col => col.name || col);
                console.log('Sử dụng outputColumns từ step.config (giữ nguyên thứ tự):', columnOrder);
            } else if (step && step.outputColumns && step.outputColumns.length > 0) {
                // Fallback: sử dụng outputColumns từ step
                columnOrder = step.outputColumns.map(col => col.name || col);
                console.log('Fallback: sử dụng outputColumns từ step:', columnOrder);
            } else {
                // Fallback: sử dụng thứ tự từ dữ liệu
                const firstRow = tableData[0];
                columnOrder = Object.keys(firstRow);
                console.log('Fallback: sử dụng thứ tự từ dữ liệu:', columnOrder);
            }

            // Tạo object thứ tự cột theo format {1: "tên cột", 2: "tên cột", ...}
            const columnOrderObject = {};
            columnOrder.forEach((columnName, index) => {
                columnOrderObject[index + 1] = columnName;
            });

            // Sắp xếp lại dữ liệu theo thứ tự cột từ outputColumns
            const orderedTableData = tableData.map(row => {
                const orderedRow = {};
                // Chỉ sắp xếp theo outputColumns, bỏ qua rowId
                columnOrder.forEach(key => {
                    if (row.hasOwnProperty(key)) {
                        orderedRow[key] = row[key];
                    }
                });
                // Thêm rowId vào cuối nếu có
                if (row.hasOwnProperty('rowId')) {
                    orderedRow['rowId'] = row['rowId'];
                }
                return orderedRow;
            });


            // Gọi API để xuất dữ liệu bảng
            const result = await exportTableToGoogleSheets(
                googleSheetsModal.sheetUrl,
                orderedTableData,
                {
                    stepId: stepId,
                    templateId: templateData?.id,
                    timestamp: new Date().toISOString(),
                    columnOrder: columnOrderObject, // Gửi thứ tự cột dạng object {1: "tên cột", 2: "tên cột", ...}
                   
                },
                currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com'
            );
            console.log('result', result);
            if (result.success) {
                message.success('Đã xuất dữ liệu ra Google Sheets thành công! Dữ liệu đã được ghi đè toàn bộ.');

                // Lưu thông tin export vào step
                if (stepId) {
                    const exportInfo = {
                        link: googleSheetsModal.sheetUrl,
                        extractAt: new Date().toISOString()
                    };
                    console.log('💾 Lưu thông tin export:', { stepId, exportInfo });
                    handleUpdateExportInfo(stepId, exportInfo);
                } else {
                    console.log('⚠️ Không thể lưu thông tin export:', { stepId });
                }

                setGoogleSheetsModal({ visible: false, stepId: null, sheetUrl: '', loading: false });
            } else {
                message.error(result.message || 'Có lỗi xảy ra khi xuất dữ liệu!');
            }
        } catch (error) {
            console.error('Lỗi khi xuất Google Sheets:', error);
            message.error('Có lỗi xảy ra khi xuất dữ liệu ra Google Sheets!');
        } finally {
            setGoogleSheetsModal(prev => ({ ...prev, loading: false }));
        }
    };

    const [publishModalVisible, setPublishModalVisible] = useState(false);
    const [publishStepId, setPublishStepId] = useState(null);

    // Hàm mở modal import thêm dữ liệu
    const handleOpenImportMoreDataModal = async () => {
        // Lấy cột dữ liệu gốc từ step đầu tiên (Upload Data) (bỏ qua cột key)
        const firstStep = normalizedSteps.find(step => step.type === 12);
        console.log(firstStep);

        // Kiểm tra xem dữ liệu gốc có phải từ Google Sheet, Google Drive, Google Drive Folder, PostgreSQL, API hoặc System Import không
        const isGoogleSheetSource = firstStep && firstStep.config && firstStep.config.uploadType === 'googleSheets';
        const isGoogleDriveSource = firstStep && firstStep.config && firstStep.config.uploadType === 'googleDrive';
        const isGoogleDriveFolderSource = firstStep && firstStep.config && firstStep.config.uploadType === 'googleDriveFolder';
        const isPostgresSource = firstStep && firstStep.config && firstStep.config.uploadType === 'postgresql';
        const isApiSource = firstStep && firstStep.config && firstStep.config.uploadType === 'api';
        const isSystemSource = firstStep && firstStep.config && firstStep.config.uploadType === 'system';

        if (firstStep && firstStep.config && firstStep.config.outputColumns) {
            setOriginalDataColumns(firstStep.config.outputColumns.map(col => col.name).filter(col => col !== 'key'));
        } else {
            setOriginalDataColumns(availableColumns.filter(col => col !== 'key'));
        }

        // Lấy dữ liệu gốc từ database thay vì từ state đã được cập nhật
        if (templateData && templateData.id) {
            try {
                const originalDataFromDBResponse = await getTemplateRow(templateData.id);
                const originalDataFromDB = originalDataFromDBResponse.rows || [];
                console.log('Dữ liệu gốc từ database:', originalDataFromDB);

                // Chuẩn hóa dữ liệu từ database để có format giống dữ liệu import
                const normalizedData = originalDataFromDB.map(row => {
                    // Nếu dữ liệu có format { data: {...}, id: ... }
                    if (row.data && row.id) {
                        return {
                            ...row.data,
                            rowId: row.id, // Thêm rowId để có thể xóa sau này
                        };
                    }
                    // Nếu dữ liệu đã có format đúng
                    return row;
                });

                console.log('Dữ liệu đã chuẩn hóa:', normalizedData);
                setOriginalData(normalizedData || []);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu gốc từ database:', error);
                // Fallback: sử dụng dữ liệu từ step nếu không lấy được từ database
                if (firstStep && firstStep.config && firstStep.config.excelData) {
                    setOriginalData(firstStep.config.excelData);
                } else {
                    setOriginalData([]);
                }
            }
        } else {
            // Fallback: sử dụng dữ liệu từ step nếu không có templateData
            if (firstStep && firstStep.config && firstStep.config.excelData) {
                setOriginalData(firstStep.config.excelData);
            } else {
                setOriginalData([]);
            }
        }

        setShowImportMoreDataModal(true);

        // Nếu là Google Sheet, Google Drive, PostgreSQL, API hoặc System Import, lưu thông tin để hiển thị UI khác
        if (isGoogleSheetSource) {
            setImportMoreDataConfig(prev => ({
                ...prev,
                isGoogleSheetSource: true,
                isGoogleDriveSource: false,
                isPostgresSource: false,
                isApiSource: false,
                isSystemSource: false,
                googleSheetUrl: firstStep.config.googleSheetUrl || '',
                googleSheetsHeaderRow: firstStep.config.googleSheetsHeaderRow || 0,
                outputColumns: firstStep.config.outputColumns || [],
                intervalUpdate: firstStep.config.intervalUpdate || 0,
                lastUpdate: firstStep.config.lastUpdate || null,
            }));
        } else if (isGoogleDriveSource) {
            if(firstStep.config.googleDriveMultiFiles){
                setImportMoreDataConfig(prev => ({
                    ...prev,
                    isGoogleSheetSource: false,
                    isGoogleDriveSource: true,
                    isPostgresSource: false,
                    isApiSource: false,
                    isSystemSource: false,
                    googleDriveMultiFiles: true,
                    googleDriveFilesInfo: firstStep.config.googleDriveFilesInfo || [],
                    outputColumns: firstStep.config.outputColumns || [],
                    intervalUpdate: firstStep.config.intervalUpdate || 0,
                    lastUpdate: firstStep.config.lastUpdate || null,
                    googleDriveFolderUrl: firstStep.config.googleDriveFolderUrl || '',
                    
                }));
            }else{  
            setImportMoreDataConfig(prev => ({
                ...prev,
                isGoogleSheetSource: false,
                isGoogleDriveSource: true,
                isPostgresSource: false,
                isApiSource: false,
                isSystemSource: false,
                googleDriveUrl: firstStep.config.googleDriveUrl || '',
                googleDriveFileId: firstStep.config.googleDriveFileId || '',
                googleDriveSheet: firstStep.config.googleDriveSheet || '',
                googleDriveHeaderRow: firstStep.config.googleDriveHeaderRow || 0,
                googleDriveSelectedFileName: firstStep.config.googleDriveSelectedFileName || '',
                outputColumns: firstStep.config.outputColumns || [],
                intervalUpdate: firstStep.config.intervalUpdate || 0,
                lastUpdate: firstStep.config.lastUpdate || null,
                googleDriveFolderUrl: firstStep.config.googleDriveFolderUrl || '',
            }));
            }
        } else if (isGoogleDriveFolderSource) {
            setImportMoreDataConfig(prev => ({
                ...prev,
                isGoogleSheetSource: false,
                isGoogleDriveSource: false,
                isGoogleDriveFolderSource: true,
                isPostgresSource: false,
                isApiSource: false,
                isSystemSource: false,
                googleDriveFolderUrl: firstStep.config.googleDriveFolderUrl || '',
                fileNameCondition: firstStep.config.fileNameCondition || '',
                lastUpdateCondition: firstStep.config.lastUpdateCondition || '',
                headerRow: firstStep.config.headerRow || 1,
                // Tần suất theo giờ và trạng thái bật/tắt
                frequencyHours: typeof firstStep.config.frequencyHours === 'number'
                    ? firstStep.config.frequencyHours
                    : Math.round(((firstStep.config.intervalUpdate || 0) / 60) || 0),
                isFrequencyActive: typeof firstStep.config.isFrequencyActive === 'boolean'
                    ? firstStep.config.isFrequencyActive
                    : ((typeof firstStep.config.frequencyHours === 'number' && firstStep.config.frequencyHours > 0) || (firstStep.config.intervalUpdate || 0) > 0),
                outputColumnsTimestamp: firstStep.config.outputColumnsTimestamp || '',
                mergeColumns: firstStep.config.mergeColumns || [],
                removeDuplicateColumns: firstStep.config.removeDuplicateColumns || [],
                sortColumns: firstStep.config.sortColumns || [],
                outputColumns: firstStep.config.outputColumns || [],
                lastUpdate: firstStep.config.lastUpdate || null,
            }));
        } else if (isPostgresSource) {
            setImportMoreDataConfig(prev => ({
                ...prev,
                isGoogleSheetSource: false,
                isPostgresSource: true,
                isApiSource: false,
                isSystemSource: false,
                postgresConfig: firstStep.config.postgresConfig || {},
                intervalUpdate: firstStep.config.intervalUpdate || 0,
                lastUpdate: firstStep.config.lastUpdate || null,
            }));
        } else if (isApiSource) {
            setImportMoreDataConfig(prev => ({
                ...prev,
                isGoogleSheetSource: false,
                isPostgresSource: false,
                isApiSource: true,
                isSystemSource: false,
                apiUrl: firstStep.config.apiUrl || '',
                apiKey: firstStep.config.apiKey || '',
                intervalUpdate: firstStep.config.intervalUpdate || 0,
                lastUpdate: firstStep.config.lastUpdate || null,
            }));
        } else if (isSystemSource) {
            setImportMoreDataConfig(prev => ({
                ...prev,
                isGoogleSheetSource: false,
                isPostgresSource: false,
                isApiSource: false,
                isSystemSource: true,
                systemConfig: firstStep.config.systemConfig || {},
                intervalUpdate: firstStep.config.intervalUpdate || 0,
                lastUpdate: firstStep.config.lastUpdate || null,
            }));
        } else {
            setImportMoreDataConfig(prev => ({
                ...prev,
                isGoogleSheetSource: false,
                isGoogleDriveSource: false,
                isPostgresSource: false,
                isApiSource: false,
                isSystemSource: false,
            }));
        }
    };

    // Hàm xử lý upload file cho import thêm dữ liệu
    const handleImportMoreFileUpload = (file) => {
        setImportMoreLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    setImportMoreExcelWorkbook(workbook);

                    const sheetNames = workbook.SheetNames || [];
                    if (!sheetNames.length) throw new Error('File Excel không có sheet');
                    setImportMoreExcelSheets(sheetNames.map(name => ({ value: name, label: name })));
                    setImportMoreSelectedSheet(sheetNames[0]);

                    // Build header row options for first sheet
                    const firstWorksheet = workbook.Sheets[sheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstWorksheet, { header: 1 });

                    const dataModified = [];
                    const options = [];
                    jsonData.filter(row => Array.isArray(row) && row.length > 0).forEach((row, index) => {
                        
                        let hasData = false;
                        let previewText = '';
                        if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
                            hasData = true;
                            const previewValues = row.slice(0, 3).map(cell => cell ? String(cell).trim().substring(0, 20) : '').filter(Boolean).join(', ');
                            previewText = previewValues ? ` - ${previewValues}...` : '';
                        }
                        options.push({ value: index, label: `Hàng ${index + 1}${previewText}`, disabled: false });
                        dataModified.push(row);
                    });
                    setImportMoreExcelHeaderOptions(options);
                    setImportMoreExcelRawData(jsonData);
                    setImportMoreSelectedHeaderRow(0);

                    // Save file and open modal for selection
                    setImportMoreDataConfig(prev => ({ ...prev, file }));
                    setIsImportMoreExcelModalVisible(true);
                } catch (error) {
                    message.error(error.message || 'Có lỗi khi xử lý file');
                }
                setImportMoreLoading(false);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            message.error('Có lỗi khi đọc file');
            setImportMoreLoading(false);
        }
        return false;
    };

    // Handlers for Import More Excel sheet/header selection
    const handleImportMoreExcelSheetSelect = (sheetName) => {
        setImportMoreSelectedSheet(sheetName);
        if (importMoreExcelWorkbook && importMoreExcelWorkbook.Sheets[sheetName]) {
            const worksheet = importMoreExcelWorkbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            setImportMoreExcelRawData(jsonData);
            const options = [];
            jsonData.forEach((row, index) => {
                let hasData = false;
                let previewText = '';
                if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
                    hasData = true;
                    const previewValues = row.slice(0, 3).map(cell => cell ? String(cell).trim().substring(0, 20) : '').filter(Boolean).join(', ');
                    previewText = previewValues ? ` - ${previewValues}...` : '';
                }
                options.push({ value: index, label: `Hàng ${index + 1}${previewText}`, disabled: false });
            });
            setImportMoreExcelHeaderOptions(options);
            setImportMoreSelectedHeaderRow(0);
        }
    };

    const handleImportMoreExcelHeaderRowSelect = (value) => {
        setImportMoreSelectedHeaderRow(value);
    };

    // Tạo các cột còn thiếu và cập nhật outputColumns cho bước nhập dữ liệu (step 1)
    const ensureOutputColumnsForNewHeaders = async (newHeaders = []) => {
        try {
            const safeHeaders = Array.isArray(newHeaders) ? newHeaders.filter(h => h && h !== 'key') : [];
            if (!templateData?.id || safeHeaders.length === 0) return;

            // Tạo cột mới trên TemplateColumn
            for (let i = 0; i < safeHeaders.length; i++) {
                const header = String(safeHeaders[i]);
                try {
                    await createTemplateColumn({
                        tableId: templateData.id,
                        columnName: header,
                        columnType: 'text',
                        width: 120,
                    });
                } catch (err) {
                    // Bỏ qua nếu cột đã tồn tại hoặc lỗi nhẹ
                    // console.warn('createTemplateColumn error for', header, err);
                }
            }

            // Cập nhật outputColumns trong config của step 1
            const firstStep = normalizedSteps.find(step => step.type === 12);
            if (!firstStep) return;

            const existing = Array.isArray(firstStep.config?.outputColumns)
                ? firstStep.config.outputColumns.map(col => (typeof col === 'string' ? col : col?.name)).filter(Boolean)
                : [];
            const mergedNames = Array.from(new Set([...existing, ...safeHeaders]));
            const mergedOutputColumns = mergedNames.map(name => ({ name, type: 'text' }));

            const updatedSteps = normalizedSteps.map(step => (
                step.id === firstStep.id
                    ? {
                        ...step,
                        config: {
                            ...step.config,
                            outputColumns: mergedOutputColumns,
                            outputColumnsTimestamp: new Date().toISOString(),
                        },
                    }
                    : step
            ));

            onChange(updatedSteps);
            await updateTemplateTable({ ...templateData, steps: updatedSteps });
        } catch (e) {
            // Không chặn flow import nếu lỗi cập nhật outputColumns
        }
    };

    const handleImportMoreExcelModalOk = async () => {
        try {
            if (!importMoreExcelWorkbook || !importMoreSelectedSheet || importMoreSelectedHeaderRow < 0) {
                message.error('Vui lòng chọn sheet và hàng header hợp lệ!');
                return;
            }
            const worksheet = importMoreExcelWorkbook.Sheets[importMoreSelectedSheet];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (importMoreSelectedHeaderRow >= jsonData.length) {
                message.error('Hàng header được chọn không tồn tại!');
                return;
            }
            const headerRow = jsonData[importMoreSelectedHeaderRow] || [];
            const headerIndices = headerRow.reduce((acc, header, index) => {
                if (header !== null && header !== undefined && String(header).trim() !== '') {
                    acc.push({ header: String(header).trim(), index });
                }
                return acc;
            }, []);
            if (!headerIndices.length) {
                message.error('Hàng header được chọn không có tiêu đề cột hợp lệ');
                return;
            }

            // Kiểm tra giới hạn số cột
            const columnCheck = await checkColumnLimit(headerIndices.map(({ header }) => header));
            if (!columnCheck.isValid) {
                message.error(columnCheck.message);
                setIsImportMoreExcelModalVisible(false);
                setImportMoreLoading(false);
                return;
            }
            const dataRows = jsonData.slice(importMoreSelectedHeaderRow + 1);
            const rows = dataRows.filter(row => Array.isArray(row) && row.length > 0).map(row => {
                const rowData = {};
                headerIndices.forEach(({ header, index }) => {
                    rowData[header] = row[index] !== undefined ? row[index] : null;
                });
                return rowData;
            });

            // Kiểm tra giới hạn số dòng
            const limitCheck = await checkUploadLimits(
                headerIndices.map(({ header }) => header),
                rows
            );
            if (!limitCheck.isValid) {
                message.error(limitCheck.message);
                setIsImportMoreExcelModalVisible(false);
                setImportMoreLoading(false);
                return;
            }

            setImportedMoreColumns(headerIndices.map(({ header }) => ({ title: header, dataIndex: header, key: header })).filter(col => col.title !== 'key'));
            setImportedMoreData(rows);

            // Validate columns vs original (ignore 'key')
            const newColumns = headerIndices.map(({ header }) => header).filter(col => col !== 'key');
            const missingColumns = originalDataColumns.filter(col => col !== 'key' && !newColumns.includes(col));
            const extraColumns = newColumns.filter(col => col !== 'key' && !originalDataColumns.includes(col));
            if (missingColumns.length > 0) {
                message.warning(`Thiếu các cột: ${missingColumns.join(', ')}`);
            }
            if (extraColumns.length > 0) {
                message.info(`Có thêm các cột mới: ${extraColumns.join(', ')}`);
                // Tự động tạo TemplateColumn và cập nhật outputColumns cho step 1
                await ensureOutputColumnsForNewHeaders(extraColumns);
            }

            setIsImportMoreExcelModalVisible(false);
            setImportMoreLoading(false);
            message.success(`Đã tải ${rows.length} dòng dữ liệu từ sheet "${importMoreSelectedSheet}"!`);
        } catch (err) {
            message.error(err.message || 'Có lỗi khi xử lý dữ liệu Excel');
            setImportMoreLoading(false);
        }
    };

    // Hàm xử lý import thêm dữ liệu
    const handleImportMoreData = async () => {
        if (importedMoreData.length === 0) {
            message.error('Vui lòng chọn file để import');
            return;
        }

        // Kiểm tra validation cho duplicate check
        if (importMoreDataConfig.duplicateCheck && importMoreDataConfig.duplicateKeys.length === 0) {
            message.error('Vui lòng chọn ít nhất một cột để kiểm tra trùng lặp');
            return;
        }

        // Kiểm tra xem các cột có khớp với dữ liệu gốc không (bỏ qua cột key)
        const newColumns = importedMoreColumns.map(col => col.title).filter(col => col !== 'key');
        const missingColumns = originalDataColumns.filter(col => col !== 'key' && !newColumns.includes(col));
        if (missingColumns.length > 0) {
            Modal.confirm({
                title: 'Cảnh báo về cột thiếu',
                content: `File import thiếu các cột: ${missingColumns.join(', ')}. Bạn có muốn tiếp tục không?`,
                okText: 'Tiếp tục',
                cancelText: 'Hủy',
                onOk: () => {
                    // Tiếp tục import
                    performImport();
                },
            });
            return;
        }

        // Nếu không có vấn đề gì, thực hiện import
        performImport();
    };

    // Hàm lưu cấu hình intervalUpdate
    const handleSaveIntervalConfig = async () => {
        const firstStep = normalizedSteps.find(step => step.type === 12);
        if (firstStep && (importMoreDataConfig.isGoogleSheetSource || importMoreDataConfig.isGoogleDriveSource || importMoreDataConfig.isGoogleDriveFolderSource || importMoreDataConfig.isPostgresSource || importMoreDataConfig.isApiSource || importMoreDataConfig.isSystemSource)) {
            const updatedSteps = normalizedSteps.map(step =>
                step.id === firstStep.id
                    ? {
                        ...step,
                        config: {
                            ...step.config,
                            intervalUpdate: importMoreDataConfig.intervalUpdate || 0, // Lưu intervalUpdate
                            frequencyHours: importMoreDataConfig.isFrequencyActive ? (importMoreDataConfig.frequencyHours || 3) : 0,
                            isFrequencyActive: !!importMoreDataConfig.isFrequencyActive,
                            enableAutoUpdate: !!importMoreDataConfig.isFrequencyActive, // Tương thích cũ
                            lastUpdate: importMoreDataConfig.intervalUpdate > 0 ? new Date().toISOString() : null, // Reset lastUpdate khi bật auto-update
                            // Thêm các config cho Google Drive Folder
                            ...(importMoreDataConfig.isGoogleDriveFolderSource && {
                                fileNameCondition: importMoreDataConfig.fileNameCondition,
                                lastUpdateCondition: importMoreDataConfig.lastUpdateCondition,
                                headerRow: importMoreDataConfig.headerRow,
                                mergeColumns: importMoreDataConfig.mergeColumns,
                                removeDuplicateColumns: importMoreDataConfig.removeDuplicateColumns,
                                sortColumns: importMoreDataConfig.sortColumns,
                            }),
                        },
                    }
                    : step,
            );
            onChange(updatedSteps);

            // Lưu vào backend
            const updatedTemplateData = { ...templateData, steps: updatedSteps };
            const res = await updateTemplateTable(updatedTemplateData);
            console.log('res', res);

            // Xử lý frequency config chỉ cho Google Drive Folder
            try {
                if (res?.id && res.steps[0].config.uploadType === 'googleDriveFolder') {
                    // Kiểm tra xem đã có frequency config chưa
                    const existingConfig = await getFrequencyConfigByTableId(res.id);
                    console.log('existingConfig', existingConfig);
                    if (importMoreDataConfig.isFrequencyActive) {
                        // Tạo hoặc cập nhật frequency config
                        console.log('importMoreDataConfig', importMoreDataConfig);
                        const frequency_hours = Number(importMoreDataConfig.frequencyHours || 3);
                        console.log('frequency_hours', frequency_hours);
                        const configData = {
                            frequency_hours,
                            is_active: true,
                            last_run: null,
                            next_run: null,
                            config: {
                                uploadType: 'googleDriveFolder',
                                googleDriveFolderUrl: importMoreDataConfig.googleDriveFolderUrl,
                                fileNameCondition: importMoreDataConfig.fileNameCondition || '',
                                lastUpdateCondition: importMoreDataConfig.lastUpdateCondition || '',
                                headerRow: Math.max(0, (importMoreDataConfig.headerRow || 1) - 1),
                                mergeColumns: importMoreDataConfig.mergeColumns || [],
                                removeDuplicateColumns: importMoreDataConfig.removeDuplicateColumns || [],
                                sortColumns: importMoreDataConfig.sortColumns || [],
                            },
                        };

                        if (existingConfig?.data?.data) {
                            // Cập nhật config hiện có
                            console.log('configData', configData);
                            const res = await updateFrequencyConfig(existingConfig.data.data.id, configData);
                            console.log('res111111', res);
                            console.log('Updated frequency config for Google Drive Folder table:', templateData.id);
                        } else {
                            // Tạo config mới
                            await createFrequencyConfig({
                                tableId: templateData.id,
                                schema: currentSchemaPathRecord?.path,
                                config: {...configData}
                            });
                            console.log('Created frequency config for Google Drive Folder table:', templateData.id);
                        }
                    } else {
                        // Xóa frequency config nếu có
                        if (existingConfig?.data?.data) {
                            console.log('existingConfig', existingConfig);
                            console.log('currentSchemaPathRecord?.path', currentSchemaPathRecord?.path);
                            await deleteFrequencyConfig( existingConfig.data.data.id);
                            console.log('Deleted frequency config for Google Drive Folder table:', templateData.id);
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling frequency config for Google Drive Folder:', error);
                // Không chặn luồng chính nếu có lỗi với frequency config
                message.warning('Đã lưu cấu hình thành công, nhưng có lỗi khi xử lý tự động cập nhật cho Google Drive Folder');
            }

            message.success('Đã lưu cấu hình thành công!');
        }
    };

    // Hàm lấy dữ liệu từ Google Sheet ngay lập tức
    const handleFetchGoogleSheetDataNow = async () => {
        const firstStep = normalizedSteps.find(step => step.type === 12);
        if (!firstStep || !firstStep.config?.googleSheetUrl?.trim()) {
            message.error('Vui lòng nhập URL Google Sheet!');
            return;
        }

        setImportMoreLoading(true);
        try {
            console.log('Gửi tới N8N:', firstStep.config.googleSheetUrl);
            const res = await n8nWebhook({ urlSheet: firstStep.config.googleSheetUrl , email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com' });
            console.log('Response từ N8N:', res);
            if (Array.isArray(res) && res.length > 0) {
                const firstResp = res[0];

                // Ưu tiên cấu trúc mới: { rows: [...], headers: [...], detectedHeaderRow }
                let headerRow = Array.isArray(firstResp.headers) ? firstResp.headers : [];
                let dataRows = [];

                if (Array.isArray(firstResp.rows) && firstResp.rows.length > 0) {
                    // Ưu tiên cấu hình người dùng: nếu có cấu hình, luôn dùng hàng đó làm header
                    const detectedHeaderRow = typeof firstResp.detectedHeaderRow === 'number' ? firstResp.detectedHeaderRow : 1; // 1-based
                    const cfgIndexRaw = Number.parseInt(firstStep?.config?.googleSheetsHeaderRow, 10);
                    const hasCfgIndex = Number.isFinite(cfgIndexRaw);
                    if (hasCfgIndex) {
                        const headerIndexFromConfig = cfgIndexRaw - 1; // convert 1-based -> 0-based
                        const safeIndex = Math.max(0, Math.min(firstResp.rows.length - 1, headerIndexFromConfig));
                        headerRow = firstResp.rows[safeIndex]?.data || [];
                        // Dữ liệu lấy sau dòng header đã chọn, bỏ trống
                        dataRows = firstResp.rows
                            .slice(safeIndex + 1)
                            .filter(r => !r.isEmpty && Array.isArray(r.data))
                            .map(r => r.data);
                    } else {
                        // Không có cấu hình: fallback theo metadata/detected
                        if (headerRow.length === 0) {
                            const fallbackIndex = detectedHeaderRow - 1;
                            const safeIndex = Math.max(0, Math.min(firstResp.rows.length - 1, fallbackIndex));
                            headerRow = firstResp.rows[safeIndex]?.data || [];
                            dataRows = firstResp.rows
                                .slice(safeIndex + 1)
                                .filter(r => !r.isEmpty && Array.isArray(r.data))
                                .map(r => r.data);
                        } else {
                            // Đã có headers từ metadata: dùng như cũ, lấy các hàng dữ liệu (bỏ header detected/trống)
                            dataRows = firstResp.rows
                                .filter(r => !r.isEmpty && !r.isDetectedHeader && Array.isArray(r.data))
                                .map(r => r.data);
                        }
                    }
                } else if (Array.isArray(firstResp.data)) {
                    // Tương thích ngược với cấu trúc cũ: data = [ [header...], [row...], ... ]
                    const cfgIndexRaw = Number.parseInt(firstStep?.config?.googleSheetsHeaderRow, 10);
                    const headerRowIndex = Number.isFinite(cfgIndexRaw) ? (cfgIndexRaw - 1) : 0;
                    const safeIndex = Math.max(0, Math.min(firstResp.data.length - 1, headerRowIndex));
                    headerRow = firstResp.data[safeIndex] || [];
                    dataRows = firstResp.data.slice(safeIndex + 1);
                }

                if (!Array.isArray(headerRow) || headerRow.length === 0 || !Array.isArray(dataRows)) {
                    message.error('Không lấy được dữ liệu từ Google Sheet!');
                    setImportMoreLoading(false);
                    return;
                }

                const data = dataRows.map(row => {
                    const newRow = {};
                    headerRow.forEach((header, index) => {
                        newRow[header] = row?.[index];
                    });
                    return newRow;
                });

                // Tạo outputColumns mới dựa trên header row hiện tại
                const newOutputColumns = headerRow.map(header => ({
                    name: header,
                    type: 'text', // Mặc định là text, có thể cải thiện logic phát hiện type sau
                }));

                // Kiểm tra giới hạn upload
                const limitCheck = await checkUploadLimits(headerRow, data);
                if (!limitCheck.isValid) {
                    message.error(limitCheck.message);
                    setImportMoreLoading(false);
                    setShowImportMoreDataModal(false);
                    return;
                }

                // Thực hiện thay thế toàn bộ dữ liệu
                await performGoogleSheetReplace(data, headerRow);

                // Cập nhật step config với lastUpdate và outputColumns mới
                const updatedSteps = normalizedSteps.map(step =>
                    step.id === firstStep.id
                        ? {
                            ...step,
                            config: {
                                ...step.config,
                                lastUpdate: new Date().toISOString(),
                                outputColumns: newOutputColumns,
                                outputColumnsTimestamp: new Date().toISOString(),
                            },
                        }
                        : step,
                );
                onChange(updatedSteps);

                // Lưu vào backend
                const updatedTemplateData = { ...templateData, steps: updatedSteps };
                await updateTemplateTable(updatedTemplateData);

                message.success('Đã cập nhật dữ liệu từ Google Sheet thành công!');
                setShowImportMoreDataModal(false);

                // Cập nhật dữ liệu
                if (onDataUpdate) {
                    await onDataUpdate();
                }

                // Gọi callback để cập nhật selectedStepId
                if (onStepRunComplete) {
                    await onStepRunComplete(firstStep.id);
                }
            } else {
                message.error('Không lấy được dữ liệu từ Google Sheet!');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu từ Google Sheet:', error);
            message.error('Có lỗi khi lấy dữ liệu từ Google Sheet!');
        } finally {
            setImportMoreLoading(false);
        }
    };

    // Hàm thay thế toàn bộ dữ liệu từ Google Sheet
    const performGoogleSheetReplace = async (newData, columns) => {
        if (!templateData?.id) {
            message.error('Không tìm thấy template');
            return false;
        }

        try {
            // Xóa toàn bộ dữ liệu cũ
            await deleteTemplateRowByTableId(templateData.id);

            // Lưu dữ liệu mới
            const success = await saveDataToDatabase(newData, templateData.id, 1);

            if (success) {
                message.success(`Đã thay thế ${newData.length} dòng dữ liệu từ Google Sheet`);
                return true;
            } else {
                message.error('Có lỗi khi lưu dữ liệu mới');
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi thay thế dữ liệu:', error);
            message.error('Có lỗi khi thay thế dữ liệu');
            return false;
        }
    };

    // Hàm lấy dữ liệu từ PostgreSQL ngay lập tức
    const handleFetchPostgresDataNow = async () => {
        const firstStep = normalizedSteps.find(step => step.type === 12);
        if (!firstStep || !firstStep.config?.postgresConfig) {
            message.error('Không tìm thấy cấu hình PostgreSQL!');
            return;
        }

        setImportMoreLoading(true);
        try {
            const res = await postgresService.getTableData(firstStep.config.postgresConfig);
            if (Array.isArray(res) && res.length > 0) {
                // Kiểm tra giới hạn upload
                const allColumns = Object.keys(res[0]);
                const limitCheck = await checkUploadLimits(allColumns, res);
                if (!limitCheck.isValid) {
                    message.error(limitCheck.message);
                    setImportMoreLoading(false);
                    setShowImportMoreDataModal(false);
                    return;
                }

                // Thực hiện thay thế toàn bộ dữ liệu
                await performPostgresReplace(res);

                // Cập nhật lastUpdate
                const updatedSteps = normalizedSteps.map(step =>
                    step.id === firstStep.id
                        ? { ...step, config: { ...step.config, lastUpdate: new Date().toISOString() } }
                        : step,
                );
                onChange(updatedSteps);

                // Lưu vào backend
                const updatedTemplateData = { ...templateData, steps: updatedSteps };
                await updateTemplateTable(updatedTemplateData);

                message.success('Đã cập nhật dữ liệu từ PostgreSQL thành công!');
                setShowImportMoreDataModal(false);

                // Cập nhật dữ liệu
                if (onDataUpdate) {
                    await onDataUpdate();
                }

                // Gọi callback để cập nhật selectedStepId
                if (onStepRunComplete) {
                    await onStepRunComplete(firstStep.id);
                }
            } else {
                message.error('Không lấy được dữ liệu từ PostgreSQL!');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu từ PostgreSQL:', error);
            message.error('Có lỗi khi lấy dữ liệu từ PostgreSQL!');
        } finally {
            setImportMoreLoading(false);
        }
    };
    // Hàm lấy dữ liệu từ API ngay lập tức
    const handleFetchApiDataNow = async () => {
        const firstStep = normalizedSteps.find(step => step.type === 12);
        if (!firstStep || !firstStep.config?.apiUrl) {
            message.error('Không tìm thấy cấu hình API!');
            return;
        }

        setImportMoreLoading(true);
        try {
            const headers = {};
            if (firstStep.config.apiKey) {
                headers['Authorization'] = `Bearer ${firstStep.config.apiKey}`;
            }

            const response = await fetch(firstStep.config.apiUrl, {
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
                // Kiểm tra giới hạn upload
                const allColumns = Object.keys(processedData[0]);
                const limitCheck = await checkUploadLimits(allColumns, processedData);
                if (!limitCheck.isValid) {
                    message.error(limitCheck.message);
                    setImportMoreLoading(false);
                    setShowImportMoreDataModal(false);
                    return;
                }

                // Thực hiện thay thế toàn bộ dữ liệu
                await performApiReplace(processedData);

                // Cập nhật lastUpdate
                const updatedSteps = normalizedSteps.map(step =>
                    step.id === firstStep.id
                        ? { ...step, config: { ...step.config, lastUpdate: new Date().toISOString() } }
                        : step,
                );
                onChange(updatedSteps);

                // Lưu vào backend
                const updatedTemplateData = { ...templateData, steps: updatedSteps };
                await updateTemplateTable(updatedTemplateData);

                message.success('Đã cập nhật dữ liệu từ API thành công!');
                setShowImportMoreDataModal(false);

                // Cập nhật dữ liệu
                if (onDataUpdate) {
                    await onDataUpdate();
                }

                // Gọi callback để cập nhật selectedStepId
                if (onStepRunComplete) {
                    await onStepRunComplete(firstStep.id);
                }
            } else {
                message.error('Không lấy được dữ liệu từ API!');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu từ API:', error);
            message.error('Có lỗi khi lấy dữ liệu từ API!');
        } finally {
            setImportMoreLoading(false);
        }
    };

    // Hàm lấy dữ liệu từ Google Drive ngay lập tức
    const handleFetchGoogleDriveDataNow = async () => {
        // Trường hợp import gộp nhiều file từ Drive
        
        const firstStep = normalizedSteps.find(step => step.type === 12);
     
        if (importMoreDataConfig?.googleDriveMultiFiles && Array.isArray(importMoreDataConfig.googleDriveFilesInfo) && importMoreDataConfig.googleDriveFilesInfo.length > 0) {
            setImportMoreLoading(true);
            let multiFileSuccess = false;
            try {
                const filesInfo = [...importMoreDataConfig.googleDriveFilesInfo].sort((a,b)=>Number(a.order||0)-Number(b.order||0));
                const mergedRows = [];
                const allHeadersSet = new Set();
                for (const file of filesInfo) {
                    const fileId = file.id;
                    if (!fileId) continue;
                    const selectedSheet = file.selectedSheet;
                    const headerRowNumber = Number(file.headerRow) || 1; // 1-based from UI
                    const headerRowIndex = Math.max(0, headerRowNumber - 1);
                    const res = await n8nWebhookGoogleDrive({ 
                        googleDriveUrl: fileId,
                        email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com'
                    });
                    // Handle both new and fallback structure
                    let matrix = [];
                    if (res && res.success && res.sheets && Array.isArray(res.sheetNames)) {
                        const sheetName = selectedSheet || res.sheetNames[0];
                        const sheetData = res.sheets?.[sheetName];
                        matrix = Array.isArray(sheetData?.data) ? sheetData.data : [];
                    } else if (res && res.success && Array.isArray(res.rawData)) {
                        matrix = res.rawData;
                    } else {
                        continue;
                    }
                    if (!Array.isArray(matrix) || matrix.length === 0) continue;
                    if (headerRowIndex >= matrix.length) continue;
                    const headerRow = Array.isArray(matrix[headerRowIndex]) ? matrix[headerRowIndex] : [];
                    const dataRows = matrix.slice(headerRowIndex + 1);
                    headerRow.forEach(h => { if (h !== undefined && h !== null && String(h).trim() !== '') allHeadersSet.add(String(h)); });
                    for (const row of dataRows) {
                        const obj = {};
                        headerRow.forEach((h, i) => {
                            if (h === undefined || h === null) return;
                            obj[String(h)] = Array.isArray(row) ? row[i] : undefined;
                        });
                        // obj.__fileId = fileId;
                        // obj.__fileOrder = Number(file.order || 0);
                        mergedRows.push(obj);
                    }
                }
                const allHeaders = Array.from(allHeadersSet);
                if (allHeaders.length === 0 || mergedRows.length === 0) {
                    message.error('Không lấy được dữ liệu từ các file đã chọn.');
                    setImportMoreLoading(false);
                    return;
                }
                // Kiểm tra giới hạn upload theo header hợp nhất
                const limitCheck = await checkUploadLimits(allHeaders, mergedRows);
                if (!limitCheck.isValid) {
                    message.error(limitCheck.message);
                    setImportMoreLoading(false);
                    return;
                }
console.log('mergedRows', mergedRows);
console.log('allHeaders', allHeaders);
                // Thay thế toàn bộ dữ liệu bằng dữ liệu gộp
                await performGoogleDriveReplace(mergedRows, allHeaders);

                // Cập nhật cấu hình step: lastUpdate, outputColumns, multi-file config
                if (firstStep) {
                    const newOutputColumns = allHeaders.map(h => ({ name: h, type: 'text' }));
                    const updatedSteps = normalizedSteps.map(step =>
                        step.id === firstStep.id
                            ? {
                                ...step,
                                config: {
                                    ...step.config,
                                    lastUpdate: new Date().toISOString(),
                                    outputColumns: newOutputColumns,
                                    outputColumnsTimestamp: new Date().toISOString(),
                                    googleDriveMultiFiles: true,
                                    googleDriveFilesInfo: filesInfo,
                                    googleDriveOrder: filesInfo.map(f => ({ id: f.id, order: Number(f.order||0) })),
                                },
                                needUpdate: false,
                            }
                            : step,
                    );
                    onChange(updatedSteps);
                    try {
                        await updateTemplateTable({ ...templateData, steps: updatedSteps });
                    } catch (err) {
                        console.error('Lỗi khi lưu template sau khi thay dữ liệu multi-file:', err);
                    }
                }

                // Cập nhật state tạm để UI hiển thị đúng
                setImportMoreDataConfig(prev => ({
                    ...prev,
                    googleDriveColumns: allHeaders,
                    googleDriveOrder: filesInfo.map(f => ({ id: f.id, order: Number(f.order||0) })),
                }));

                message.success(`Đã lấy ${mergedRows.length} dòng từ ${filesInfo.length} file Google Drive.`);
                multiFileSuccess = true;
                setShowImportMoreDataModal(false);
              if (onDataUpdate) { await onDataUpdate(); }
              if (onStepRunComplete) { await onStepRunComplete(firstStep.id); } 
            } catch (e) {
                console.error(e);
                if (!multiFileSuccess) {
                    message.error('Có lỗi khi lấy dữ liệu gộp nhiều file từ Google Drive');
                }
            } finally {
                setImportMoreLoading(false);
   
            }
            return;
        }
        if (!firstStep || !firstStep.config?.googleDriveFileId?.trim()) {
            message.error('Vui lòng nhập File ID Google Drive!');
            return;
        }
        setImportMoreLoading(true);
        try {
            console.log('Gửi tới N8N Google Drive:', firstStep.config.googleDriveFileId);
            const res = await n8nWebhookGoogleDrive({ 
                googleDriveUrl: firstStep.config.googleDriveFileId,
                email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com'
            });
            console.log('Response từ N8N Google Drive:', res);
            
            if (res && res.success && res.sheets && Array.isArray(res.sheetNames)) {
                // New backend response: { success, sheets: { name: { data: matrix } }, sheetNames }
                const selectedSheet = firstStep.config?.googleDriveSheet || res.sheetNames[0];
                const sheetData = res.sheets[selectedSheet];
                
                if (!sheetData || !Array.isArray(sheetData.data)) {
                    message.error('Không có dữ liệu trong sheet được chọn');
                    setImportMoreLoading(false);
                    return;
                }

                const matrix = sheetData.data;
                const headerRowIndex = typeof firstStep.config?.googleDriveHeaderRow === 'number' ? firstStep.config.googleDriveHeaderRow : 0;
                
                if (headerRowIndex >= matrix.length) {
                    message.error('Hàng tiêu đề không hợp lệ');
                    setImportMoreLoading(false);
                    return;
                }

                const headerRow = matrix[headerRowIndex] || [];
                const dataRows = matrix.slice(headerRowIndex + 1);

                if (!Array.isArray(headerRow) || headerRow.length === 0 || !Array.isArray(dataRows)) {
                    message.error('Không lấy được dữ liệu từ Google Drive');
                    setImportMoreLoading(false);
                    return;
                }

                // Xử lý dữ liệu theo cấu trúc mới
                const data = dataRows.map(row => {
                    const newRow = {};
                    headerRow.forEach((header, index) => {
                        newRow[header] = row?.[index];
                    });
                    return newRow;
                });

                // Tạo outputColumns mới dựa trên header row hiện tại
                const newOutputColumns = headerRow.map(header => ({
                    name: header,
                    type: 'text', // Mặc định là text, có thể cải thiện logic phát hiện type sau
                }));

                // Kiểm tra giới hạn upload
                const limitCheck = await checkUploadLimits(headerRow, data);
                if (!limitCheck.isValid) {
                    message.error(limitCheck.message);
                    setImportMoreLoading(false);
                    setShowImportMoreDataModal(false);
                    return;
                }

                // Thực hiện thay thế toàn bộ dữ liệu
                await performGoogleDriveReplace(data, headerRow);

                // Cập nhật step config với lastUpdate và outputColumns mới
                const updatedSteps = normalizedSteps.map(step =>
                    step.id === firstStep.id
                        ? {
                            ...step,
                            config: {
                                ...step.config,
                                lastUpdate: new Date().toISOString(),
                                outputColumns: newOutputColumns,
                                outputColumnsTimestamp: new Date().toISOString(),
                                // Đảm bảo googleDriveFileId được giữ nguyên
                                googleDriveFileId: firstStep.config?.googleDriveFileId || step.config?.googleDriveFileId || '',
                                // Cập nhật thông tin sheet và header row
                                googleDriveSheet: selectedSheet,
                                googleDriveHeaderRow: headerRowIndex,
                            },
                        }
                        : step,
                );
                onChange(updatedSteps);

                // Lưu vào backend
                const updatedTemplateData = { ...templateData, steps: updatedSteps };
                await updateTemplateTable(updatedTemplateData);

                message.success(`Đã cập nhật ${data.length} dòng dữ liệu từ Google Drive (Sheet: ${selectedSheet}, Header Row: ${headerRowIndex + 1})`);
                setShowImportMoreDataModal(false);

                // Cập nhật dữ liệu
                if (onDataUpdate) {
                    await onDataUpdate();
                }

                // Gọi callback để cập nhật selectedStepId
                if (onStepRunComplete) {
                    await onStepRunComplete(firstStep.id);
                }

            } else if (res && res.success && res.rawData && res.sheetNames) {
                // Fallback cho cấu trúc cũ
                const jsonData = res.rawData;
                const sheetNames = res.sheetNames;
                const selectedSheet = firstStep.config?.googleDriveSheet || sheetNames[0];
                
                if (jsonData.length > 0) {
                    const headerRowIndex = typeof firstStep.config?.googleDriveHeaderRow === 'number' ? firstStep.config.googleDriveHeaderRow : 0;
                    const headerRow = jsonData[headerRowIndex] || [];
                    const dataRows = jsonData.slice(headerRowIndex + 1);

                    const data = dataRows.map(row => {
                        const newRow = {};
                        headerRow.forEach((header, index) => {
                            newRow[header] = row?.[index];
                        });
                        return newRow;
                    });

                    // Tạo outputColumns mới dựa trên header row hiện tại
                    const newOutputColumns = headerRow.map(header => ({
                        name: header,
                        type: 'text', // Mặc định là text, có thể cải thiện logic phát hiện type sau
                    }));

                    // Kiểm tra giới hạn upload
                    const limitCheck = await checkUploadLimits(headerRow, data);
                    if (!limitCheck.isValid) {
                        message.error(limitCheck.message);
                        setImportMoreLoading(false);
                        setShowImportMoreDataModal(false);
                        return;
                    }

                    // Thực hiện thay thế toàn bộ dữ liệu
                    await performGoogleDriveReplace(data, headerRow);

                    // Cập nhật step config với lastUpdate và outputColumns mới
                    const updatedSteps = normalizedSteps.map(step =>
                        step.id === firstStep.id
                            ? {
                                ...step,
                                config: {
                                    ...step.config,
                                    lastUpdate: new Date().toISOString(),
                                    outputColumns: newOutputColumns,
                                    outputColumnsTimestamp: new Date().toISOString(),
                                    googleDriveFileId: firstStep.config?.googleDriveFileId || step.config?.googleDriveFileId || '',
                                    googleDriveSheet: selectedSheet,
                                    googleDriveHeaderRow: headerRowIndex,
                                },
                            }
                            : step,
                    );
                    onChange(updatedSteps);

                    // Lưu vào backend
                    const updatedTemplateData = { ...templateData, steps: updatedSteps };
                    await updateTemplateTable(updatedTemplateData);

                    message.success(`Đã cập nhật ${data.length} dòng dữ liệu từ Google Drive (Fallback mode, Sheet: ${selectedSheet}, Header Row: ${headerRowIndex + 1})`);
                setShowImportMoreDataModal(false);

                // Cập nhật dữ liệu
                if (onDataUpdate) {
                    await onDataUpdate();
                }

                // Gọi callback để cập nhật selectedStepId
                if (onStepRunComplete) {
                    await onStepRunComplete(firstStep.id);
                    }
                } else {
                    message.error('Không có dữ liệu trong sheet được chọn');
                }
            } else {
                message.error('Không lấy được dữ liệu từ Google Drive!');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu từ Google Drive:', error);
            message.error('Có lỗi khi lấy dữ liệu từ Google Drive!');
        } finally {
            setImportMoreLoading(false);
        }
    };

    // Hàm thay thế toàn bộ dữ liệu từ Google Drive
    const performGoogleDriveReplace = async (newData, headers) => {
        if (!templateData?.id) {
            message.error('Không tìm thấy template');
            return false;
        }

        try {
            // Xóa toàn bộ dữ liệu cũ
            await deleteTemplateRowByTableId(templateData.id);

            // Lưu dữ liệu mới
            const success = await saveDataToDatabase(newData, templateData.id, 1);

            if (success) {
                message.success(`Đã thay thế ${newData.length} dòng dữ liệu từ Google Drive`);
                return true;
            } else {
                message.error('Có lỗi khi lưu dữ liệu mới');
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi thay thế dữ liệu Google Drive:', error);
            message.error('Có lỗi khi thay thế dữ liệu Google Drive');
            return false;
        }
    };

    // Hàm lấy dữ liệu từ Google Drive Folder ngay lập tức
    const handleFetchGoogleDriveFolderDataNow = async () => {
        const firstStep = normalizedSteps.find(step => step.type === 12);
        if (!firstStep || !firstStep.config?.googleDriveFolderUrl?.trim()) {
            message.error('Vui lòng nhập URL Google Drive Folder!');
            return;
        }

        setImportMoreLoading(true);
        try {
            console.log('Bắt đầu lấy dữ liệu từ Google Drive Folder:', firstStep.config.googleDriveFolderUrl);
            console.log('ImportMoreDataConfig:', importMoreDataConfig);
            
            // Bước 1: Lấy danh sách file từ folder sử dụng n8nWebhookGoogleDrive
            const folderResponse = await n8nWebhookGetFileFromGoogleDrive({ 
                googleDriveUrl: firstStep.config.googleDriveFolderUrl,
                email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com'
            });

            console.log('Response từ folder:', folderResponse);

            if (!folderResponse || !folderResponse.success) {
                message.error('Không thể lấy danh sách file từ Google Drive Folder!');
                setImportMoreLoading(false);
                return;
            }

            // Bước 2: Lấy danh sách file từ response
            let files = [];
            if (folderResponse.files && Array.isArray(folderResponse.files)) {
                files = folderResponse.files;
            } else if (folderResponse.n8nResponse && Array.isArray(folderResponse.n8nResponse)) {
                files = folderResponse.n8nResponse;
            } else if (folderResponse.sheets) {
                // Nếu response có sheets, có thể là folder chứa các file
                files = Object.keys(folderResponse.sheets).map(sheetName => ({
                    id: sheetName,
                    name: sheetName,
                    sheetName: sheetName
                }));
            }

            console.log(`Tìm thấy ${files.length} file trong folder:`, files.map(f => f.name));

            if (files.length === 0) {
                message.warning('Không tìm thấy file nào trong folder!');
                setImportMoreLoading(false);
                return;
            }

            // Bước 3: Lọc file theo điều kiện
            let filteredFiles = files;
            console.log(`Tổng số file trước khi lọc: ${files.length}`);
            console.log(`Điều kiện tên file: "${importMoreDataConfig.fileNameCondition}"`);
            console.log(`Điều kiện thời gian: "${importMoreDataConfig.lastUpdateCondition}"`);
            
            if (importMoreDataConfig.fileNameCondition) {
                const pattern = importMoreDataConfig.fileNameCondition.replace(/\*/g, '.*');
                const regex = new RegExp(pattern, 'i');
                filteredFiles = filteredFiles.filter(file => regex.test(file.name));
                console.log(`Lọc theo tên file "${importMoreDataConfig.fileNameCondition}": ${filteredFiles.length} file`);
            }

            if (importMoreDataConfig.lastUpdateCondition) {
                const now = new Date();
                const days = parseInt(importMoreDataConfig.lastUpdateCondition.replace('d', ''));
                const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
                filteredFiles = filteredFiles.filter(file => {
                    // Sử dụng modifiedTime từ Google Drive API response
                    const fileDate = new Date(file.modifiedTime || file.lastModified || now);
                    return fileDate >= cutoffDate;
                });
                console.log(`Lọc theo thời gian "${importMoreDataConfig.lastUpdateCondition}": ${filteredFiles.length} file`);
                console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
                console.log(`Files after time filter:`, filteredFiles.map(f => ({
                    name: f.name,
                    modifiedTime: f.modifiedTime,
                    modifiedDate: new Date(f.modifiedTime).toISOString()
                })));
            }

            if (filteredFiles.length === 0) {
                message.warning('Không có file nào thỏa mãn điều kiện lọc!');
                setImportMoreLoading(false);
                return;
            }

            console.log(`Tìm thấy ${filteredFiles.length} file để xử lý`);

            // Bước 4: Lấy dữ liệu từ từng file
            const mergedRows = [];
            const allHeadersSet = new Set();
            // Giữ nguyên thứ tự cột: bắt đầu từ header của file đầu tiên,
            // sau đó nối thêm các cột mới khi gặp ở các file tiếp theo
            let columnOrder = [];
            const headerRow = importMoreDataConfig.headerRow || 1; // 1-based từ UI
            const headerRowIndex = Math.max(0, headerRow - 1); // Chuyển sang 0-based

            for (const file of filteredFiles) {
                try {
                    console.log(`Đang xử lý file: ${file.name}`);
                    
                    // Lấy dữ liệu từ file riêng lẻ
                    const fileResponse = await n8nWebhookGoogleDrive({ 
                        googleDriveUrl: file.id,
                        email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com'
                    });

                    if (!fileResponse || !fileResponse.success) {
                        console.warn(`Không thể lấy dữ liệu từ file ${file.name}`);
                        continue;
                    }

                    // Xử lý dữ liệu từ file
                    let matrix = [];
                    if (fileResponse.sheets && Array.isArray(fileResponse.sheetNames)) {
                        const sheetName = file.sheetName || fileResponse.sheetNames[0];
                        const sheetData = fileResponse.sheets[sheetName];
                        matrix = Array.isArray(sheetData?.data) ? sheetData.data : [];
                    } else if (fileResponse.rawData && Array.isArray(fileResponse.rawData)) {
                        matrix = fileResponse.rawData;
                    }

                    if (!Array.isArray(matrix) || matrix.length === 0) {
                        console.warn(`File ${file.name} không có dữ liệu`);
                        continue;
                    }

                    if (headerRowIndex >= matrix.length) {
                        console.warn(`File ${file.name}: Header row ${headerRow} không hợp lệ`);
                        continue;
                    }

                    const fileHeaderRow = matrix[headerRowIndex] || [];
                    const dataRows = matrix.slice(headerRowIndex + 1);

                    // Thêm headers vào set tổng hợp
                    fileHeaderRow.forEach(h => { 
                        if (h !== undefined && h !== null && String(h).trim() !== '') {
                            allHeadersSet.add(String(h));
                        }
                    });

                    // Cập nhật columnOrder để giữ nguyên thứ tự cột theo lần xuất hiện đầu tiên
                    if (columnOrder.length === 0) {
                        columnOrder = fileHeaderRow
                            .filter(h => h !== undefined && h !== null && String(h).trim() !== '')
                            .map(h => String(h));
                    } else {
                        fileHeaderRow.forEach(h => {
                            if (h === undefined || h === null) return;
                            const name = String(h);
                            if (name.trim() !== '' && !columnOrder.includes(name)) {
                                columnOrder.push(name);
                            }
                        });
                    }

                    // Xử lý dữ liệu từng dòng
                    for (const row of dataRows) {
                        const obj = {};
                        fileHeaderRow.forEach((h, i) => {
                            if (h === undefined || h === null) return;
                            obj[String(h)] = Array.isArray(row) ? row[i] : undefined;
                        });
                        mergedRows.push(obj);
                    }

                    console.log(`Đã xử lý file ${file.name}: ${dataRows.length} dòng`);
                } catch (error) {
                    console.error(`Lỗi khi xử lý file ${file.name}:`, error);
                    // Tiếp tục với file khác
                }
            }

            const allHeaders = columnOrder.length > 0 ? columnOrder : Array.from(allHeadersSet);
            if (allHeaders.length === 0 || mergedRows.length === 0) {
                message.error('Không lấy được dữ liệu từ các file đã lọc.');
                setImportMoreLoading(false);
                return;
            }

            console.log(`Tổng hợp: ${mergedRows.length} dòng từ ${filteredFiles.length} file, ${allHeaders.length} cột`);

            // Bước 5: Kiểm tra giới hạn upload
            const limitCheck = await checkUploadLimits(allHeaders, mergedRows);
            if (!limitCheck.isValid) {
                message.error(limitCheck.message);
                setImportMoreLoading(false);
                setShowImportMoreDataModal(false);
                return;
            }

            // Bước 6: Thay thế toàn bộ dữ liệu (truyền thứ tự cột gốc để lưu theo đúng thứ tự)
            await performGoogleDriveFolderReplace(mergedRows, allHeaders);

            // Bước 7: Cập nhật step config
            const newOutputColumns = allHeaders.map(h => ({ name: h, type: 'text' }));
            const updatedSteps = normalizedSteps.map(step =>
                step.id === firstStep.id
                    ? {
                        ...step,
                        config: {
                            ...step.config,
                            lastUpdate: new Date().toISOString(),
                            outputColumns: newOutputColumns,
                            outputColumnsTimestamp: new Date().toISOString(),
                            // Đồng bộ trạng thái auto update hiện tại
                            isFrequencyActive: !!importMoreDataConfig.isFrequencyActive,
                            frequencyHours: importMoreDataConfig.isFrequencyActive ? (importMoreDataConfig.frequencyHours || 3) : 0,
                        }
                    }
                    : step
            );

            onChange(updatedSteps);
            
            // Bước 8: Lưu steps đã cập nhật để đảm bảo outputColumns được persisted
            try {
               
                    delete updatedSteps[0].config.googleDriveFolderData;
                    delete updatedSteps[0].config.googleDriveFolderColumns;
              
                const updatedTemplateData = { ...templateData, steps: updatedSteps };

                await updateTemplateTable(updatedTemplateData);
            } catch (e) {
                console.warn('Cập nhật template steps thất bại (bỏ qua):', e);
            }

            // Bước 9: Xử lý frequency config (tạo/cập nhật/xóa) ở BE (không chặn luồng nếu lỗi)
            try {
                if (templateData?.id) {
                    // Kiểm tra xem đã có frequency config chưa
                    const existingConfig = await getFrequencyConfigByTableId(templateData.id);
                    
                    if (importMoreDataConfig.isFrequencyActive) {
                        // Tạo hoặc cập nhật frequency config
                        const frequency_hours = Number(importMoreDataConfig.frequencyHours || 3);
                        const configData = {
                            frequency_hours,
                            is_active: true,
                            config: {
                                uploadType: 'googleDriveFolder',
                                googleDriveFolderUrl: importMoreDataConfig.googleDriveFolderUrl,
                                fileNameCondition: importMoreDataConfig.fileNameCondition || '',
                                lastUpdateCondition: importMoreDataConfig.lastUpdateCondition || '',
                                headerRow: Math.max(0, (importMoreDataConfig.headerRow || 1) - 1),
                                mergeColumns: importMoreDataConfig.mergeColumns || [],
                                removeDuplicateColumns: importMoreDataConfig.removeDuplicateColumns || [],
                                sortColumns: importMoreDataConfig.sortColumns || [],
                            },
                            schema: currentSchemaPathRecord?.path,
                        };

                        if (existingConfig?.data?.data) {
                            // Cập nhật config hiện có
                            await updateFrequencyConfig(existingConfig.data.data.id, configData);
                            console.log('Updated frequency config for Google Drive Folder table:', templateData.id);
                        } else {
                            // Tạo config mới
                            await createFrequencyConfig({
                                tableId: templateData.id,
                                schema: currentSchemaPathRecord?.path,
                                config: configData
                            });
                            console.log('Created frequency config for Google Drive Folder table:', templateData.id);
                        }
                    } else {
                        // Xóa frequency config nếu có
                        if (existingConfig?.data?.data) {
                            await deleteFrequencyConfig(existingConfig.data.data.id);   
                            console.log('Deleted frequency config for Google Drive Folder table:', templateData.id);
                        }
                    }
                }
            } catch (e) {
                console.warn('Lưu FrequencyConfig thất bại (bỏ qua):', e);
            }

            // Lưu vào backend
            const updatedTemplateData = { ...templateData, steps: updatedSteps };
            await updateTemplateTable(updatedTemplateData);

            message.success(`Đã cập nhật ${mergedRows.length} dòng dữ liệu từ ${filteredFiles.length} file Google Drive Folder`);
            setShowImportMoreDataModal(false);

            // Cập nhật dữ liệu
            if (onDataUpdate) {
                await onDataUpdate();
            }

            // Gọi callback để cập nhật selectedStepId
            if (onStepRunComplete) {
                await onStepRunComplete(firstStep.id);
            }

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu từ Google Drive Folder:', error);
            message.error('Có lỗi khi lấy dữ liệu từ Google Drive Folder!');
        } finally {
            setImportMoreLoading(false);
        }
    };

    // Hàm thay thế toàn bộ dữ liệu từ Google Drive Folder
    const performGoogleDriveFolderReplace = async (newData, columns) => {
        if (!templateData?.id) {
            message.error('Không tìm thấy template');
            return false;
        }

        try {
            // Xóa toàn bộ dữ liệu cũ
            await deleteTemplateRowByTableId(templateData.id);

            // Lưu dữ liệu mới
            // Giữ nguyên thứ tự cột: columns là mảng tên cột theo thứ tự gốc
            const outputColumns = (columns || []).map(name => ({ name, type: 'text' }));
            const success = await saveDataToDatabase(newData, templateData.id, 1, outputColumns, columns);

            if (success) {
                message.success(`Đã thay thế ${newData.length} dòng dữ liệu từ Google Drive Folder`);
                return true;
            } else {
                message.error('Có lỗi khi lưu dữ liệu mới');
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi thay thế dữ liệu Google Drive Folder:', error);
            message.error('Có lỗi khi thay thế dữ liệu Google Drive Folder');
            return false;
        }
    };

    // Hàm thay thế toàn bộ dữ liệu từ PostgreSQL
    const performPostgresReplace = async (newData) => {
        if (!templateData?.id) {
            message.error('Không tìm thấy template');
            return false;
        }

        try {
            // Xóa toàn bộ dữ liệu cũ
            await deleteTemplateRowByTableId(templateData.id);

            // Lưu dữ liệu mới
            const success = await saveDataToDatabase(newData, templateData.id, 1);

            if (success) {
                message.success(`Đã thay thế ${newData.length} dòng dữ liệu từ PostgreSQL`);
                return true;
            } else {
                message.error('Có lỗi khi lưu dữ liệu mới');
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi thay thế dữ liệu PostgreSQL:', error);
            message.error('Có lỗi khi thay thế dữ liệu PostgreSQL');
            return false;
        }
    };
    // Hàm lấy dữ liệu từ System Import ngay lập tức
    const handleFetchSystemDataNow = async () => {
        const firstStep = normalizedSteps.find(step => step.type === 12);
        if (!firstStep || !firstStep.config?.systemConfig) {
            message.error('Không tìm thấy cấu hình System Import!');
            return;
        }

        setImportMoreLoading(true);
        try {
            const { templateTableId, stepId } = firstStep.config.systemConfig;

            // Lấy dữ liệu mới từ hệ thống
            let dataResponse = await getTemplateRow(templateTableId, stepId, false);
            let data = dataResponse.rows || [];

            // Xử lý dữ liệu theo format mới (có thể có { data: {...}, id: ... })
            if (data && Array.isArray(data) && data.length > 0) {
                data = data.map(item => {
                    if (item.data && item.id) {
                        return {
                            ...item.data,
                            rowId: item.id,
                        };
                    }
                    return item;
                });
            }

            if (data && Array.isArray(data) && data.length > 0) {
                // Thực hiện thay thế toàn bộ dữ liệu
                await performSystemReplace(data);

                // Cập nhật lastUpdate
                const updatedSteps = normalizedSteps.map(step =>
                    step.id === firstStep.id
                        ? { ...step, config: { ...step.config, lastUpdate: new Date().toISOString() } }
                        : step,
                );
                onChange(updatedSteps);

                // Lưu vào backend
                const updatedTemplateData = { ...templateData, steps: updatedSteps };
                await updateTemplateTable(updatedTemplateData);

                message.success('Đã cập nhật dữ liệu từ hệ thống thành công!');
                setShowImportMoreDataModal(false);

                // Cập nhật dữ liệu
                if (onDataUpdate) {
                    await onDataUpdate();
                }

                // Gọi callback để cập nhật selectedStepId
                if (onStepRunComplete) {
                    await onStepRunComplete(firstStep.id);
                }
            } else {
                message.error('Không lấy được dữ liệu từ hệ thống!');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu từ hệ thống:', error);
            message.error('Có lỗi khi lấy dữ liệu từ hệ thống!');
        } finally {
            setImportMoreLoading(false);
        }
    };
    // Hàm thay thế toàn bộ dữ liệu từ System Import
    const performSystemReplace = async (newData) => {
        if (!templateData?.id) {
            message.error('Không tìm thấy template');
            return false;
        }

        try {
            // Xóa toàn bộ dữ liệu cũ
            await deleteTemplateRowByTableId(templateData.id);

            // Lưu dữ liệu mới
            const success = await saveDataToDatabase(newData, templateData.id, 1);

            if (success) {
                message.success(`Đã thay thế ${newData.length} dòng dữ liệu từ hệ thống`);
                return true;
            } else {
                message.error('Có lỗi khi lưu dữ liệu mới');
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi thay thế dữ liệu:', error);
            message.error('Có lỗi khi thay thế dữ liệu');
            return false;
        }
    };

    // Hàm thay thế toàn bộ dữ liệu từ API
    const performApiReplace = async (newData) => {
        if (!templateData?.id) {
            message.error('Không tìm thấy template');
            return false;
        }

        try {
            // Xóa toàn bộ dữ liệu cũ
            await deleteTemplateRowByTableId(templateData.id);

            // Lưu dữ liệu mới
            const success = await saveDataToDatabase(newData, templateData.id, 1);

            if (success) {
                message.success(`Đã thay thế ${newData.length} dòng dữ liệu từ API`);
                return true;
            } else {
                message.error('Có lỗi khi lưu dữ liệu mới');
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi thay thế dữ liệu từ API:', error);
            message.error('Có lỗi khi thay thế dữ liệu từ API');
            return false;
        }
    };
    // Hàm thực hiện import thực tế
    const performImport = async () => {

        setImportMoreLoading(true);
        try {
            // Sử dụng dữ liệu gốc đã lưu trữ từ khi mở modal
            let baseData = originalData;
            console.log('=== DEBUG: Dữ liệu gốc sử dụng ===');
            console.log('originalData (từ database):', originalData);
            console.log('baseData length:', baseData.length);
            if (baseData.length > 0) {
                console.log('Cấu trúc dữ liệu gốc:', Object.keys(baseData[0]));
                console.log('Mẫu dữ liệu gốc:', baseData[0]);
            }

            let finalData = [];
            let rowsToCreate = [];

            console.log('=== DEBUG: Xử lý import mode ===');
            console.log('importMode:', importMoreDataConfig.importMode);
            console.log('duplicateCheck:', importMoreDataConfig.duplicateCheck);
            console.log('duplicateKeys:', importMoreDataConfig.duplicateKeys);

            if (importMoreDataConfig.importMode === 'replace_all') {
                // Thay thế toàn bộ dữ liệu
                finalData = importedMoreData;
                rowsToCreate = importedMoreData;
                console.log('Chế độ replace_all - finalData:', finalData);
            } else {
                // Thêm mới dữ liệu
                if (importMoreDataConfig.duplicateCheck && importMoreDataConfig.duplicateKeys.length > 0) {
					// Xử lý trùng lặp (bỏ qua cột key) với chuẩn hóa giá trị để so khớp ổn định
					const normalizeValue = (v) => {
						if (v === null || v === undefined) return '';
						// Chuẩn hóa: chuyển sang string, bỏ dấu ' đầu và trim khoảng trắng
						return String(v).replace(/^'/, '').trim();
					};
					const createKey = (row) => importMoreDataConfig.duplicateKeys
						.filter(col => col !== 'key')
						.map(col => normalizeValue(row[col]))
						.join('|');

                    const existingKeys = new Set();
                    baseData.forEach(row => {
						const key = createKey(row);
                        existingKeys.add(key);
                    });

                    const newData = [];
                    const duplicateData = [];

                    importedMoreData.forEach(row => {
						const key = createKey(row);
                        if (existingKeys.has(key)) {
                            duplicateData.push(row);
                        } else {
                            newData.push(row);
                            existingKeys.add(key);
                        }
                    });

                    switch (importMoreDataConfig.duplicateAction) {
                        case 'skip':
                            finalData = [...baseData, ...newData];
                            rowsToCreate = newData; // chỉ tạo các dòng mới, bỏ qua trùng
                            message.info(`Đã bỏ qua ${duplicateData.length} dòng trùng lặp`);
                            break;
                        case 'replace':
                            // Xác định các dòng cần xóa từ database
                            const rowsToDelete = [];
                            baseData.forEach(row => {
								const key = createKey(row);
								const isDuplicate = duplicateData.some(dupRow => createKey(dupRow) === key);
                                if (isDuplicate && row.rowId) { // Sử dụng rowId thay vì id
                                    rowsToDelete.push(row.rowId);
                                }
                            });

                            console.log('Các dòng cần xóa:', rowsToDelete);

                            // Xóa các dòng trùng lặp từ database
                            if (rowsToDelete.length > 0) {
                                try {
                                    for (const rowId of rowsToDelete) {
                                        await deleteTemplateRow(rowId);
                                    }
                                    message.info(`Đã xóa ${rowsToDelete.length} dòng trùng lặp từ database`);
                                } catch (error) {
                                    console.error('Lỗi khi xóa dòng trùng lặp:', error);
                                    message.error('Lỗi khi xóa dòng trùng lặp từ database');
                                }
                            }

                            // Lọc dữ liệu cũ để không hiển thị trùng lặp
                            const filteredOriginal = baseData.filter(row => {
								const key = createKey(row);
								return !duplicateData.some(dupRow => createKey(dupRow) === key);
                            });

                            console.log('Dữ liệu gốc sau khi lọc:', filteredOriginal.length, 'dòng');
                            console.log('Dữ liệu mới import:', importedMoreData.length, 'dòng');

                            finalData = [...filteredOriginal, ...importedMoreData];
                            rowsToCreate = importedMoreData; // đã xóa trùng, tạo toàn bộ dữ liệu import
                            message.info(`Đã thay thế ${duplicateData.length} dòng trùng lặp`);
                            break;
                        default:
                            // Mặc định giữ cả 2
                            finalData = [...baseData, ...importedMoreData];
                            rowsToCreate = importedMoreData; // tạo tất cả dữ liệu import
                            message.info(`Đã giữ cả ${duplicateData.length} dòng trùng lặp`);
                            break;
                    }
                } else {
                    // Không kiểm tra trùng lặp, thêm tất cả
                    finalData = [...baseData, ...importedMoreData];
                    rowsToCreate = importedMoreData; // tạo tất cả dữ liệu import
                    console.log('Không kiểm tra trùng lặp - finalData:', finalData);
                    console.log('baseData length:', baseData.length);
                    console.log('importedMoreData length:', importedMoreData.length);
                }
            }
            // Cập nhật các step để đánh dấu cần update
            const updatedSteps = normalizedSteps.map(step => {
                if (step.type === 12) {
                    // Step 1: Không cập nhật gì trong config, chỉ đánh dấu needUpdate cho các step phụ thuộc
                    return {
                        ...step,
                    };
                } else if (
                    // Chỉ đánh dấu needUpdate cho những step chọn step 1 làm nguồn dữ liệu
                    (step.inputSource && step.inputSource.useCustomInput && step.inputSource.inputStepId === 1) ||
                    (step.inputStepId === 1)
                ) {
                    return {
                        ...step,
                        needUpdate: true,
                    };
                }
                return step;
            });

            onChange(updatedSteps);

            // Lưu cập nhật steps vào database
            try {
                await updateTemplateTable({ ...templateData, steps: updatedSteps });
                console.log('Đã cập nhật steps với needUpdate vào database');
            } catch (error) {
                console.error('Lỗi khi cập nhật steps:', error);
            }

            // Lưu dữ liệu vào database
            console.log('=== DEBUG: Bắt đầu lưu database ===');
            console.log('templateData:', templateData);
            console.log('importMoreDataConfig:', importMoreDataConfig);
            console.log('importedMoreData:', importedMoreData);
            if (importedMoreData.length > 0) {
                console.log('Cấu trúc dữ liệu import:', Object.keys(importedMoreData[0]));
                console.log('Mẫu dữ liệu import:', importedMoreData[0]);
            }
            console.log('finalData:', finalData);

            if (templateData && templateData.id) {
                try {
                    // Nếu có cột mới so với schema gốc, đảm bảo tạo cột trước khi lưu
                    try {
                        const currentColumns = Array.isArray(originalDataColumns) ? originalDataColumns.filter(c => c !== 'key') : [];
                        const importColumnsNow = importedMoreColumns.map(c => c.title).filter(c => c !== 'key');
                        const extra = importColumnsNow.filter(c => !currentColumns.includes(c));
                        if (extra.length > 0) {
                            await ensureOutputColumnsForNewHeaders(extra);
                        }
                    } catch (_) { }

                    if (importMoreDataConfig.importMode === 'replace_all') {
                        console.log('=== Chế độ: Thay thế toàn bộ ===');
                        // Xóa tất cả dữ liệu cũ trước khi thêm mới
                        await deleteTemplateRowByTableId(templateData.id);

                        // Chuẩn bị dữ liệu để lưu vào database
                        const batchData = finalData.map((row, index) => {
                            const rowData = {};
                            // Bỏ qua cột key và chỉ lưu các cột dữ liệu thực tế
                            Object.keys(row).forEach(key => {
                                if (key !== 'key') {
                                    rowData[key] = row[key];
                                }
                            });
                            return rowData;
                        });

                        console.log('batchData (replace_all):', batchData);

                        // Gọi API để lưu dữ liệu
                        await createBathTemplateRow({
                            tableId: templateData.id,
                            data: batchData,
                            version: null,
                        }).then(res => {
                            console.log('res:', res);
                        }).catch(err => {
                            console.log('err:', err);
                        });
                        message.success('Đã thay thế toàn bộ dữ liệu trong database thành công');
                    } else {
                        console.log('=== Chế độ: Thêm mới ===');
                        // Chế độ thêm mới - lưu đúng dữ liệu cần tạo theo duplicateAction
                        const newDataToSave = rowsToCreate.map((row, index) => {
                            const rowData = {};
                            // Bỏ qua cột key và chỉ lưu các cột dữ liệu thực tế
                            Object.keys(row).forEach(key => {
                                if (key !== 'key') {
                                    rowData[key] = row[key];
                                }
                            });
                            return rowData;
                        });

                        console.log('newDataToSave (add_new):', newDataToSave);
                        console.log('Số lượng dữ liệu mới:', newDataToSave.length);

                        // Gọi API để lưu dữ liệu mới
                        await createBathTemplateRow({
                            tableId: templateData.id,
                            data: newDataToSave,
                            version: null,
                        }).then(res => {
                            console.log('res:', res);
                        }).catch(err => {
                            console.log('err:', err);
                        });
                        message.success(`Đã thêm ${newDataToSave.length} dòng dữ liệu mới vào database thành công`);
                    }
                } catch (error) {
                    console.error('Lỗi khi lưu dữ liệu vào database:', error);
                    message.error('Lỗi khi lưu dữ liệu vào database');
                }
            } else {
                console.log('=== LỖI: Không có templateData hoặc templateData.id ===');
                console.log('templateData:', templateData);
            }
            console.log('=== DEBUG: Kết thúc lưu database ===');

            // Cập nhật dữ liệu cho parent component
            if (onDataUpdate) {
                onDataUpdate(finalData);
            }

            message.success(`Import thành công! Tổng cộng ${finalData.length} dòng dữ liệu`);

            // Reload lại dữ liệu bảng bên dưới
            if (onDataUpdate) {
                // Gọi callback để reload dữ liệu bảng
                setTimeout(() => {
                    onDataUpdate();
                }, 100); // Delay nhỏ để đảm bảo database đã được cập nhật
                console.log('Đã reload dữ liệu bảng sau khi import');
            }
            setShowImportMoreDataModal(false);

            // Reset state
            setImportedMoreData([]);
            setImportedMoreColumns([]);
            setOriginalData([]);
            setImportMoreDataConfig({
                uploadType: 'excel',
                file: null,
                googleSheetUrl: '',
                googleSheetsHeaderRow: 0,
                outputColumns: [],
                googleDriveUrl: '',
                importMode: 'add_new',
                duplicateCheck: false,
                duplicateKeys: [],
                duplicateAction: 'keep_both',
            });

        } catch (error) {
            message.error('Có lỗi khi import dữ liệu: ' + error.message);
        } finally {
            setImportMoreLoading(false);
        }
    };

    useEffect(() => {
        if (!hasData) {
            setAddStepType(12);
        } else {
            setAddStepType(null);
        }
    }, [hasData]);

    // Reset AI Transformer test status khi thay đổi step type
    useEffect(() => {
        if (addStepType !== 21) {
            setAiTransformerTestStatus(false);
        }
    }, [addStepType]);

    // Reset AI Transformer test status khi thay đổi edit step type
    useEffect(() => {
        if (editIdx !== null && normalizedSteps[editIdx] && normalizedSteps[editIdx].type !== 21) {
            setAiTransformerTestStatus(false);
        }
    }, [editIdx, normalizedSteps]);

    // Lắng nghe sự kiện từ KeyboardShortcut
    useEffect(() => {
        const handleOpenAddStepModal = async () => {
            if (autorun) return; // Không cho phép thêm step khi autorun bật

            // Tăng modalKey để force re-render components
            setModalKey(prev => prev + 1);

            // Xác định inputStepId mặc định khi thêm step mới
            let defaultInputStepId = null;
            if (normalizedSteps && normalizedSteps.length > 0) {
                // Sử dụng step cuối cùng làm nguồn dữ liệu mặc định
                defaultInputStepId = normalizedSteps[normalizedSteps.length - 1].id;
            } else {
                // Nếu không có step nào, sử dụng dữ liệu gốc
                defaultInputStepId = 0;
            }

            setTempConfig({
                useCustomInput: false,
                inputStepId: defaultInputStepId,
                type: 12,
            });

            // Cập nhật inputColumns dựa trên chế độ mặc định (step trước)
            const newInputColumns = await getInputColumns(null, null);
            setInputColumns(newInputColumns);
            console.log('Add Step - Updated inputColumns:', newInputColumns);

            setShowAddModal(true);
            renderConfigForm(12);
            setShowStepSelector(false);
        };

        window.addEventListener('openAddStepModal', handleOpenAddStepModal);

        return () => {
            window.removeEventListener('openAddStepModal', handleOpenAddStepModal);
        };
    }, [hasData]);

    return (
        <div style={{ marginBottom: 8 }}>
            <div
                className={styles.stepsContainer}
                style={{
                    display: 'flex',
                    gap: 16,
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    paddingBottom: 8,
                    paddingTop: 5,
                    minHeight: '140px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d1d5db #f3f4f6',

                }}
            >
                {normalizedSteps.map((step, idx) => (
                    <Card
                        key={idx}
                        title={
                            <span
                                style={{
                                    fontWeight: selectedStepId === step.id ? 'bold' : undefined,
                                    fontSize: 16,
                                    padding: '0 4px',
                                    borderRadius: 4,
                                    // textDecoration: selectedStepId === step.id ? 'underline' : undefined,
                                    color: selectedStepId === step.id ? theme === 'dark' ? '#fff' : '#1A64BE' : theme === 'dark' ? '#fff' : undefined,
                                    textShadow: selectedStepId === step.id && theme === 'dark' ? '0 0 5px #fff, 0 0 10px #fff' : undefined,
                                    transition: 'all 0.1s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    width: 'fit-content',
                                }}
                            >
                                {stepTypeName[step.type] || 'Unknown'}
                            </span>
                        }
                        extra={step.type !== 12 && idx !== 0 ? (
                            <span>
                                {/* Nút riêng cho step type 21 (AI Transformer) */}
                                {step.type === 21 ? (
                                    <Tooltip title={
                                        autorun ? 'Không thể chạy step khi Autorun đang bật' :
                                            'Chạy AI Transformer với tùy chọn lọc dữ liệu'
                                    }>
                                        <Button
                                            icon={<PlayCircleOutlined />}
                                            size="small"
                                            type="primary"
                                            loading={isRunningForThisFile && runningStep === step.id}
                                            disabled={autorun || (isRunningForThisFile && (runningStep !== null || isBatchRunning))}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Ngăn event bubble lên card
                                                // Chỉ mở modal chọn điều kiện lọc, không gửi yêu cầu về BE
                                                if (!autorun && !(isRunningForThisFile && isBatchRunning)) {
                                                    openAiTransformerRunModal(idx);
                                                }
                                            }}
                                            style={{
                                                marginRight: 8,
                                                backgroundColor: '#52c41a',
                                                borderColor: '#52c41a'
                                            }}
                                        >
                                            AI Run
                                        </Button>
                                    </Tooltip>
                                ) : (
                                <Tooltip title={
                                    autorun ? 'Không thể chạy step khi Autorun đang bật' :
                                        (isTestMode && step.id > 1) ? 'Chạy thử step với 1000 dòng dữ liệu' :
                                            'Run Step'
                                }>
                                    {(isTestMode && step.id > 1) ? (
                                        <Dropdown
                                            menu={{
                                                items: [
                                                    {
                                                        key: 'normal',
                                                        label: 'Run',
                                                        tooltip: 'Chạy với đầy đủ dữ liệu',
                                                        icon: <PlayCircleOutlined />,
                                                        onClick: (e) => {
                                                            e.domEvent.stopPropagation();
                                                            if (!autorun && !(isRunningForThisFile && isBatchRunning)) {
                                                                if (setRunningFileNotes && templateData?.fileNote_id) {
                                                                    setRunningFileNotes(prev => new Set([...prev, String(templateData.fileNote_id)]));
                                                                }
                                                                // Chạy với đầy đủ dữ liệu (forceNormalMode = true)
                                                                handleRunStep(idx, true);
                                                                checkRunningStep(step.id);
                                                            }
                                                        }
                                                    }
                                                ]
                                            }}
                                            trigger={['contextMenu']}
                                            placement="bottom"
                                            disabled={autorun || (isRunningForThisFile && (runningStep !== null || isBatchRunning))}
                                        >
                                            <Button
                                                icon={<PlayCircleOutlined />}
                                                size="small"
                                                type="primary"
                                                loading={isRunningForThisFile && runningStep === step.id}
                                                disabled={autorun || (isRunningForThisFile && (runningStep !== null || isBatchRunning))}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Ngăn event bubble lên card
                                                    // Cho phép chạy nếu không autorun và KHÔNG chạy batch cho chính filenote này
                                                    if (!autorun && !(isRunningForThisFile && isBatchRunning)) {
                                                        if (setRunningFileNotes && templateData?.fileNote_id) {
                                                            setRunningFileNotes(prev => new Set([...prev, String(templateData.fileNote_id)]));
                                                        }
                                                        handleRunStep(idx);
                                                        checkRunningStep(step.id);
                                                    }
                                                }}
                                                style={{
                                                    marginRight: 8,
                                                    backgroundColor: '#1890ff',
                                                    borderColor: '#1890ff'
                                                }}
                                            >
                                                Test
                                            </Button>
                                        </Dropdown>
                                    ) : (
                                        <Button
                                            icon={<PlayCircleOutlined />}
                                            size="small"
                                            type="primary"
                                            loading={isRunningForThisFile && runningStep === step.id}
                                            disabled={autorun || (isRunningForThisFile && (runningStep !== null || isBatchRunning))}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Ngăn event bubble lên card
                                                // Cho phép chạy nếu không autorun và KHÔNG chạy batch cho chính filenote này
                                                if (!autorun && !(isRunningForThisFile && isBatchRunning)) {
                                                    if (setRunningFileNotes && templateData?.fileNote_id) {
                                                        setRunningFileNotes(prev => new Set([...prev, String(templateData.fileNote_id)]));
                                                    }
                                                    handleRunStep(idx);
                                                    checkRunningStep(step.id);
                                                }
                                            }}
                                            style={{
                                                marginRight: 8
                                            }}
                                        >
                                        </Button>
                                    )}
                                </Tooltip>
                                )}
                                <Tooltip title={autorun ? 'Không thể chỉnh sửa step khi Autorun đang bật' : 'Edit'}>
                                    <Button
                                        icon={<SettingOutlined />}
                                        size="small"
                                        disabled={autorun || (isRunningForThisFile && (runningStep !== null || isBatchRunning))}
                                        onClick={async (e) => {
                                            console.log('autorun', autorun);
                                            if (autorun) return; // Không cho phép edit khi autorun bật
                                            e.stopPropagation(); // Ngăn event bubble lên card
                                            setEditIdx(idx);

                                            // Tăng modalKey để force re-render components
                                            setModalKey(prev => prev + 1);

                                            // Lưu initial config cho step này khi mở modal edit
                                            const initialConfig = {
                                                ...step.config,
                                                useCustomInput: step.useCustomInput || false,
                                                inputStepId: step.inputStepId !== undefined ? step.inputStepId : null,
                                            };
                                            setInitialConfigs(prev => ({
                                                ...prev,
                                                [idx]: initialConfig,
                                            }));
                                            console.log(`Saved initial config for step ${idx} when opening edit modal:`, initialConfig);

                                            // Reset current config cho step này
                                            setCurrentConfigs(prev => {
                                                const newConfigs = { ...prev };
                                                delete newConfigs[idx];
                                                console.log(`Reset current config for step ${idx} when opening edit modal`);
                                                return newConfigs;
                                            });

                                            // Special handling for Text-to-column step (type 13) to preserve original outputColumns
                                            let configToUse = { ...step.config };

                                            if (step.type === 13) {
                                                // For Text-to-column, we need to preserve the original outputColumns configuration
                                                // that contains only the newly created columns, not the full schema
                                                if (step.config.newlyCreatedColumns) {
                                                    // Use newlyCreatedColumns if available (from our previous fix)
                                                    // Keep both newlyCreatedColumns and set outputColumns for backward compatibility
                                                    configToUse = {
                                                        ...configToUse,
                                                        newlyCreatedColumns: step.config.newlyCreatedColumns,
                                                        outputColumns: step.config.newlyCreatedColumns.map(col => ({
                                                            name: col,
                                                            type: 'text',
                                                        }))
                                                    };
                                                } else if (step.config.outputColumns && Array.isArray(step.config.outputColumns)) {
                                                    // If newlyCreatedColumns is not available, try to filter outputColumns
                                                    // to exclude the targetColumn and keep only new columns
                                                    const targetColumn = step.config.targetColumn;
                                                    const filteredColumns = step.config.outputColumns.filter(col => {
                                                        if (typeof col === 'string') {
                                                            return col !== targetColumn;
                                                        } else if (col && typeof col === 'object' && col.name) {
                                                            return col.name !== targetColumn;
                                                        }
                                                        return true;
                                                    }).map(col => typeof col === 'string' ? col : col.name);

                                                    // Only use filtered columns if the number is significantly less than total
                                                    // (indicating this is a full schema, not just new columns)
                                                    if (filteredColumns.length > 0 && filteredColumns.length < step.config.outputColumns.length * 0.8) {
                                                        configToUse = {
                                                            ...configToUse,
                                                            newlyCreatedColumns: filteredColumns,
                                                            outputColumns: filteredColumns.map(col => ({
                                                                name: col,
                                                                type: 'text',
                                                            }))
                                                        };
                                                    }
                                                }
                                            }

                                            setTempConfig({
                                                ...configToUse,
                                                useCustomInput: step.useCustomInput || false,
                                                inputStepId: step.inputStepId !== undefined ? step.inputStepId : null,
                                            });

                                            // Cập nhật inputColumns cho step đang edit
                                            const newInputColumns = await getInputColumns(idx, step.inputStepId);
                                            setInputColumns(newInputColumns);

                                            // Gọi callback để cập nhật inputColumns ở parent component
                                            // if (onInputStepChange) {
                                            // 	onInputStepChange(step.inputStepId);
                                            // }

                                            setShowEditModal(true);
                                        }}
                                    />
                                </Tooltip>
                                <Popconfirm
                                    title={autorun ? 'Không thể xóa step khi Autorun đang bật' : 'Xóa bước này?'}
                                    onConfirm={async (e) => {
                                        if (autorun) return; // Không cho phép xóa khi autorun bật
                                        e?.stopPropagation(); // Ngăn event bubble lên card
                                        await handleDeleteStep(idx);
                                    }}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    disabled={autorun}
                                >
                                    <Button
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        danger
                                        disabled={autorun || (isRunningForThisFile && (runningStep !== null || isBatchRunning))}
                                        style={{ marginLeft: 8 }}
                                        onClick={(e) => e.stopPropagation()} // Ngăn event bubble lên card
                                    />
                                </Popconfirm>
                            </span>
                        ) : (
                            hasData &&
                            (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {step.type === 12 && step.config?.uploadType !== 'system' && step.config?.excelProcessingMode !== 'aggregate' && (
                                        <div className={styles.importMoreButtonContainer}>
                                            <Tooltip
                                                title={autorun ? 'Không thể import thêm dữ liệu khi Autorun đang bật' : 'Import thêm dữ liệu'}>
                                                <Button
                                                    size="small"
                                                    icon={<ImportOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenImportMoreDataModal();
                                                    }}
                                                    disabled={autorun}
                                                >
                                                    Edit dữ liệu
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    )}
                                    {step.type === 12 && step.config?.uploadType === 'googleDrive' && (
                                        <Tooltip
                                            title={
                                                <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                                                    <div><b>Nguồn:</b> Google Drive</div>
                                                    <div><b>Folder link:</b> {step.config?.googleDriveFolderUrl || 'Chưa có'}</div>
                                                    <div><b>File:</b> {step.config?.googleDriveSelectedFileName || 'Chưa chọn'}</div>
                                                    <div><b>File ID:</b> {step.config?.googleDriveFileId || 'Chưa có'}</div>
                                                    <div><b>Sheet:</b> {step.config?.googleDriveSheet || 'Chưa chọn'}</div>
                                                    <div><b>Hàng tiêu đề:</b> {typeof step.config?.googleDriveHeaderRow === 'number' ? step.config.googleDriveHeaderRow + 1 : 'Chưa chọn'}</div>
                                                    <div><b>Số cột:</b> {(step.config?.googleDriveColumns || []).length}</div>
                                                    <div><b>Số dòng:</b> {(step.config?.googleDriveData || []).length}</div>
                                                </div>
                                            }
                                        >
                                            <Button
                                                size="small"
                                                type="primary"
                                                icon={<InfoCircleOutlined />}
                                            />
                                        </Tooltip>
                                    )}
                                    {step.type === 12 && step.config?.uploadType === 'googleDriveFolder' && (
                                        <Tooltip
                                            title={
                                                <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                                                    <div><b>Nguồn:</b> Google Drive Folder & Tự động tổng hợp</div>
                                                    <div><b>Folder link:</b> {step.config?.googleDriveFolderUrl || 'Chưa có'}</div>
                                                    <div><b>Điều kiện tên file:</b> {step.config?.fileNameCondition || 'Tất cả file'}</div>
                                                    <div><b>Điều kiện thời gian:</b> {step.config?.lastUpdateCondition || 'Tất cả file'}</div>
                                                    <div><b>Hàng tiêu đề:</b> {step.config?.headerRow || 1}</div>
                                                    <div><b>Tần suất:</b> {step.config?.frequencyHours || 24} giờ</div>
                                                    <div><b>Số cột:</b> {(step.config?.googleDriveFolderColumns || []).length}</div>
                                                    <div><b>Số dòng:</b> {(step.config?.googleDriveFolderData || []).length}</div>
                                                </div>
                                            }
                                        >
                                            <Button
                                                size="small"
                                                type="primary"
                                                icon={<InfoCircleOutlined />}
                                            />
                                        </Tooltip>
                                    )}
                                    {step.type === 12 && (
                                        <Tooltip title={'Reset file (thay thế toàn bộ dữ liệu)'}>
                                            <Button
                                                size="small"
                                                icon={<ReloadOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsResetExcelModalVisible(true);
                                                    const idx = normalizedSteps.findIndex(s => s.id === step.id);
                                                    setResetTargetStepIndex(idx >= 0 ? idx : null);
                                                    setResetModalKey(prev => prev + 1);
                                                }}
                                                danger
                                            />
                                        </Tooltip>
                                    )}


                                </div>
                            )

                        )}
                        className={theme === 'dark' ? styles.cardStepDark : styles.cardStep}
                        style={{
                            transition: 'all 0.1s ease',
                            border: (selectedStepId === step.id ? '2px solid #1677ff' : theme === 'dark' ? '1px solid #334155' : '1px solid #f0f0f0'),
                            minWidth: '320px',
                            flexShrink: 0,
                            opacity: isRunningForThisFile ? 0.7 : 1,
                            pointerEvents: isRunningForThisFile ? 'none' : 'auto',
                            cursor: isRunningForThisFile ? 'not-allowed' : 'pointer',
                        }}

                        onClick={() => handleStepCardClick(step)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                        }}
                    >
                        <div style={{
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#fff' : '#3F94FC',
                            width: '100%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                            height: 22
                        }}>
                            {!step.config?.isTestData && listApprovedVersion.find(v => v.id_version == step.id && v.id_fileNote == idFileNote) ? (

                                <><span style={{ fontWeight: 'bold' }}>Tên file:</span> {listApprovedVersion.find(v => v.id_version == step.id && v.id_fileNote == idFileNote)?.name || ''}</>

                            ) : (
                                <div></div>
                            )}
                        </div>
                        <Tooltip title={getStepSummary(step, availableTables)}>
                            <div style={{ height: 22, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 5 }}>{getStepSummary(step, availableTables)}</div>
                        </Tooltip>


                        <div style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: 8,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Tag color={step.needUpdate ? 'orange' : getStatusColor(step.status)} style={{}}>
                                    {step.needUpdate ? 'Need Update' : getStatusText(step.status)}
                                </Tag>
                                {/* Hiển thị icon lỗi nếu step có lỗi */}
                                {checkStepErrors && checkStepErrors(step) && (
                                    <Tooltip title="Step này có lỗi">
                                        <ExclamationCircleOutlined
                                            style={{
                                                color: '#ff4d4f',
                                                fontSize: '16px',
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                {/* Icon Link nếu step được link sang công cụ khác */}
                                {isStepPublished(step.id) && isStepLinkedToOtherApps(step.id) && (
                                    <Tooltip title="Data này đang được link sang công cụ khác">
                                        <Link size={16} color="#1890ff" style={{ cursor: 'pointer' }} />
                                    </Tooltip>
                                )}
                                {/* Switch xuất bảng */}
                                {!(step.type === 12 && step.config?.uploadType === 'system') && (currentUser.isAdmin || currentUser.isEditor || currentUser.isSuperAdmin) && !step.config?.isTestData ? (
                                    <Tooltip
                                        title="Bật để phát hành bảng tại bước này. Chỉ có bảng ở trạng thái được xuất bản mới có thể phân phối tới các ứng dụng khác">
                                        <Switch
                                            size="small"
                                            checked={isStepPublished(step.id)}
                                            onChange={checked => {
                                                if (checked) {
                                                    setPublishModal({ visible: true, stepId: step.id, name: '' });
                                                } else {
                                                    handleUnpublishStepWithWarning(step.id);
                                                }
                                            }}

                                        />
                                    </Tooltip>
                                ) : <>
                                    Dữ liệu test
                                </>}
                                {/* Nút Export to Google Sheets */}
                                {step.id && (currentUser.isAdmin || currentUser.isEditor || currentUser.isSuperAdmin) && !step.config?.isTestData && (
                                    <Tooltip title={(() => {
                                        const currentStep = normalizedSteps.find(s => s.id === step.id);
                                        const existingExport = currentStep?.extractToGGS;

                                        // Kiểm tra trạng thái step
                                        if (step.status !== 'completed') {
                                            return `Chỉ có thể xuất dữ liệu từ step đã Completed`;
                                        }

                                        if (existingExport) {
                                            return `Đã xuất: ${new Date(existingExport.extractAt).toLocaleString('vi-VN')}`;
                                        }
                                        return "Xuất dữ liệu ra Google Sheets";
                                    })()}>
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={<GoogleOutlined />}
                                            disabled={step.status !== 'completed'}
                                            onClick={() => {
                                                // Kiểm tra lại trạng thái trước khi mở modal
                                                if (step.status !== 'completed') {
                                                    message.error('Chỉ có thể xuất dữ liệu từ step đã hoàn thành!');
                                                    return;
                                                }

                                                const currentStep = normalizedSteps.find(s => s.id === step.id);
                                                const existingExport = currentStep?.extractToGGS;
                                                setGoogleSheetsModal({
                                                    visible: true,
                                                    stepId: step.id,
                                                    sheetUrl: existingExport?.link || '',
                                                    loading: false
                                                });
                                            }}
                                            style={{
                                                color: (() => {
                                                    if (step.status !== 'completed') {
                                                        return '#d9d9d9'; // Màu xám khi disabled
                                                    }
                                                    const currentStep = normalizedSteps.find(s => s.id === step.id);
                                                    return currentStep?.extractToGGS ? '#1677FF' : '#949494';
                                                })(),
                                                padding: '4px 8px',
                                                height: 'auto',
                                                minWidth: 'auto'
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
                {/* Hiển thị phần thêm step khi đã có dữ liệu, đã có step, hoặc luôn hiển thị để có thể tạo step đầu tiên */}
                <div style={{
                    display: 'flex',
                    gap: 8,
                    flexDirection: 'column',
                    minWidth: '220px',
                    flexShrink: 0,
                }}>
                    {hasData ? (
                        <Tooltip title="Shift + P">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setShowAddModal(true)}
                                disabled={autorun}
                                style={{ minWidth: 220 }}
                            >
                                {autorun ? 'Không thể chỉnh sửa khi Autorun đang bật' : 'Chọn Process'}
                            </Button>
                        </Tooltip>
                    ) :
                        (
                            <Tooltip title="Shift + P">

                                <Button
                                    type="primary"

                                    icon={<PlusOutlined style={{ fontSize: 20 }} />}
                                    onClick={async () => {
                                        if (autorun) return; // Không cho phép thêm step khi autorun bật

                                        // Tăng modalKey để force re-render components
                                        setModalKey(prev => prev + 1);

                                        // Xác định inputStepId mặc định khi thêm step mới
                                        let defaultInputStepId = null;
                                        if (normalizedSteps && normalizedSteps.length > 0) {
                                            // Sử dụng step cuối cùng làm nguồn dữ liệu mặc định
                                            defaultInputStepId = normalizedSteps[normalizedSteps.length - 1].id;
                                        } else {
                                            // Nếu không có step nào, sử dụng dữ liệu gốc
                                            defaultInputStepId = 0;
                                        }

                                        setTempConfig({
                                            useCustomInput: false,
                                            inputStepId: defaultInputStepId,
                                            type: 12,
                                        });

                                        // Cập nhật inputColumns dựa trên chế độ mặc định (step trước)
                                        const newInputColumns = await getInputColumns(null, null);
                                        setInputColumns(newInputColumns);
                                        console.log('Add Step - Updated inputColumns:', newInputColumns);

                                        // Gọi callback để cập nhật inputColumns ở parent component
                                        // if (onInputStepChange) {
                                        //     onInputStepChange(null);
                                        // }


                                        setShowAddModal(true);
                                        renderConfigForm(12);
                                        setShowStepSelector(false);
                                    }}
                                    disabled={!addStepType || autorun}
                                >
                                    Add
                                </Button>
                            </Tooltip>

                        )
                    }
                </div>
            </div>
            {/* Modal thêm bước */}
            <AddStepModal
                showStepSelector={showStepSelector}
                setShowStepSelector={setShowStepSelector}
                visible={showAddModal}
                onCancel={() => {
                    setShowAddModal(false);
                    // Reset tempConfig về trạng thái mặc định
                    setTempConfig({
                        useCustomInput: false,
                        inputStepId: null,
                    });
                    // Reset addStepType về null
                    if (hasData) {
                        setAddStepType(null);
                    } else {
                        setAddStepType(12);
                    }
                    // Reset AI Transformer test status
                    setAiTransformerTestStatus(false);
                }}
                onOk={() => handleAddStep('pending')}
                addStepType={addStepType}
                setAddStepType={setAddStepType}
                tempConfig={tempConfig}
                setTempConfig={setTempConfig}
                renderConfigForm={renderConfigForm}
                steps={normalizedSteps}
                autorun={autorun}
                getInputColumns={getInputColumns}
                setInputColumns={setInputColumns}
                modalKey={modalKey}
                aiTransformerTestStatus={aiTransformerTestStatus}
                setAiTransformerTestStatus={setAiTransformerTestStatus}
                uploadSaving={uploadSaving}
                handleUploadSaveAndAddStep={handleUploadSaveAndAddStep}
            />

            {/* Modal sửa bước */}
            <Modal
                open={showEditModal}
                onCancel={() => {
                    setShowEditModal(false);
                    setEditIdx(null);
                    // Reset tempConfig về trạng thái mặc định
                    setTempConfig({
                        useCustomInput: false,
                        inputStepId: null,
                    });
                    // Reset AI Transformer test status
                    setAiTransformerTestStatus(false);
                }}
                centered
                onOk={() => handleEditStep()}
                okText="Lưu thay đổi"
                okButtonProps={{
                    disabled: editIdx !== null && normalizedSteps[editIdx] && normalizedSteps[editIdx].type === 21 && !aiTransformerTestStatus,
                }}
                footer={editIdx !== null && normalizedSteps[editIdx] && normalizedSteps[editIdx].type === 21 ? [
                    <Button
                        key="cancel"
                        onClick={() => {
                            setShowEditModal(false);
                            setEditIdx(null);
                            setTempConfig({
                                useCustomInput: false,
                                inputStepId: null,
                            });
                        }}
                    >
                        Hủy
                    </Button>,
                    <Tooltip
                        key="save-ai"
                        title={!aiTransformerTestStatus ? 'Cần test thành công trước khi lưu thay đổi' : ''}
                    >
                        <Popconfirm
                            title="Xác nhận lưu thay đổi"
                            description="Bạn có chắc chắn muốn lưu thay đổi step này?"
                            onConfirm={() => handleEditStep()}
                            okText="Có, lưu"
                            cancelText="Hủy"
                        >
                            <Button
                                type="primary"
                                disabled={!aiTransformerTestStatus}
                            >
                                Lưu thay đổi
                            </Button>
                        </Popconfirm>
                    </Tooltip>,
                ] : undefined}
                title={
                    <div
                        style={{ width: '100%', cursor: 'move' }}
                        onMouseOver={() => {
                            if (disabled) {
                                setDisabled(false);
                            }
                        }}
                        onMouseOut={() => {
                            setDisabled(true);
                        }}
                        onFocus={() => {
                        }}
                        onBlur={() => {
                        }}
                    >
                        {editIdx !== null && normalizedSteps[editIdx] ? `Sửa bước: ${stepTypeName[normalizedSteps[editIdx].type]}` : 'Sửa bước'}
                    </div>
                }
                styles={{
                    body: {
                        height: 'calc(90vh - 120px)',
                        overflowY: 'auto',
                        paddingRight: '8px',
                    },
                    header: {
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        backgroundColor: '#fff',
                        borderBottom: '1px solid #f0f0f0',
                    },
                    footer: {
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 1,
                        backgroundColor: '#fff',
                        borderTop: '1px solid #f0f0f0',
                    },
                }}
                width={'50vw'}
                style={{ top: 20, height: '90vh' }}
                modalRender={modal => (
                    <Draggable
                        disabled={disabled}
                        bounds={bounds}
                        nodeRef={draggleRef}
                        onStart={(event, uiData) => onStart(event, uiData)}
                    >
                        <div ref={draggleRef}>{modal}</div>
                    </Draggable>
                )}
            >
                {editIdx !== null && normalizedSteps[editIdx] && (
                    <>
                        {/*{renderInputSourceForm(editIdx, normalizedSteps[editIdx])}*/}
                        {renderConfigForm(normalizedSteps[editIdx].type, tempConfig, setTempConfig, editIdx)}
                    </>
                )}
            </Modal>

            {/* Modal nhập tên khi xuất bản */}
            <Modal
                open={publishModal.visible}
                title="Nhập tên phiên bản xuất bản"
                onCancel={() => {
                    // Reset publish modal về trạng thái mặc định
                    setPublishModal({ visible: false, stepId: null, name: '' });
                }}
                onOk={async () => {
                    if (!publishModal.name.trim()) {
                        message.error('Vui lòng nhập tên phiên bản!');
                        return;
                    }
                    await handlePublishStep(publishModal.stepId, publishModal.name.trim());
                    setPublishModal({ visible: false, stepId: null, name: '' });
                }}

                width={'30vw'}
                style={{ top: 100 }}
            >
                <Input
                    placeholder="Nhập tên phiên bản"
                    value={publishModal.name}
                    onChange={e => setPublishModal(modal => ({ ...modal, name: e.target.value }))}
                />
            </Modal>

            {/* Modal xuất Google Sheets */}
            <Modal
                open={googleSheetsModal.visible}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <GoogleOutlined style={{ color: '#4285f4' }} />
                        Xuất dữ liệu ra Google Sheets
                    </div>
                }
                onCancel={() => {
                    setGoogleSheetsModal({ visible: false, stepId: null, sheetUrl: '', loading: false });
                }}
                onOk={handleExportToGoogleSheets}
                confirmLoading={googleSheetsModal.loading}
                width={600}
                okText="Xuất dữ liệu"
                cancelText="Hủy"
            >
                <div style={{ marginBottom: 20 }}>
                    {/* Thông tin step */}
                    {googleSheetsModal.stepId && (
                        <div style={{
                            marginBottom: 16,
                            padding: 12,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 6,
                            border: '1px solid #d9d9d9'
                        }}>
                            <div style={{ fontWeight: 500, marginBottom: 4 }}>
                                Step được chọn: {(() => {
                                    const step = normalizedSteps.find(s => s.id === googleSheetsModal.stepId);
                                    return step ? `${stepTypeName[step.type] || `Step ${step.type}`} (ID: ${step.id})` : 'Không xác định';
                                })()}
                            </div>
                            <div style={{ color: '#666', fontSize: 12 }}>
                                Dữ liệu từ step này sẽ được xuất ra Google Sheets
                            </div>
                        </div>
                    )}


                    {/* Input URL hoặc nút bỏ kết nối */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>
                            Link Google Sheets <span style={{ color: 'red' }}>*</span>:
                        </div>
                        {(() => {
                            const step = normalizedSteps.find(s => s.id === googleSheetsModal.stepId);
                            const existingExport = step?.extractToGGS;
                            return existingExport?.link ? (
                                <div style={{
                                    padding: 12,
                                    backgroundColor: '#f6ffed',
                                    border: '1px solid #b7eb8f',
                                    borderRadius: 6,
                                    position: 'relative'
                                }}>
                                    <div >
                                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4, wordBreak: 'break-all' }}>
                                            <strong>Link:</strong> <a href={existingExport.link} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>{existingExport.link}</a>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#666' }}>
                                            <strong>Thời gian:</strong> {new Date(existingExport.extractAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                    <Button
                                        type="text"
                                        danger
                                        style={{
                                            position: 'absolute',
                                            bottom: 8,
                                            right: 8,
                                            zIndex: 1
                                        }}
                                        size="small"
                                        onClick={() => {
                                            Modal.confirm({
                                                title: 'Xác nhận bỏ kết nối',
                                                content: 'Bạn có chắc chắn muốn bỏ kết nối với Google Sheets này? Thông tin export sẽ bị xóa và không thể hoàn tác.',
                                                okText: 'Xác nhận',
                                                cancelText: 'Hủy',
                                                onOk: () => {
                                                    // Xóa thuộc tính extractToGGS khỏi step
                                                    handleRemoveExportInfo(googleSheetsModal.stepId);
                                                    setGoogleSheetsModal(prev => ({ ...prev, visible: false }));
                                                }
                                            });
                                        }}
                                        icon={<DeleteOutlined />}
                                    >
                                        Bỏ kết nối
                                    </Button>
                                </div>
                            ) : (
                                <Input
                                    placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                                    value={googleSheetsModal.sheetUrl}
                                    onChange={e => setGoogleSheetsModal(prev => ({ ...prev, sheetUrl: e.target.value }))}
                                    style={{ width: '100%' }}
                                    prefix={<GoogleOutlined style={{ color: '#4285f4' }} />}
                                />
                            );
                        })()}
                    </div>

                    {/* Hướng dẫn */}
                    <div style={{
                        padding: 12,
                        backgroundColor: '#fff7e6',
                        borderRadius: 6,
                        border: '1px solid #ffd591'
                    }}>
                        <div style={{
                            fontWeight: 500,
                            marginBottom: 8,
                            color: '#d46b08'
                        }}>
                            ⚠️ Lưu ý quan trọng:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 20, color: '#8c5e00' }}>
                            <li>Dữ liệu sẽ được <strong>ghi đè toàn bộ</strong> lên Google Sheets</li>
                            <li>Đảm bảo Google Sheets có quyền chỉnh sửa cho hệ thống (mặc định có thể phân quyền cho <strong>gateway@bcanvas.vn</strong>)</li>
                            <li>Định dạng URL phải đúng: https://docs.google.com/spreadsheets/d/[sheet-id]/edit</li>
                            <li>Dữ liệu cũ trong sheet sẽ bị xóa hoàn toàn</li>
                        </ul>
                    </div>
                </div>
            </Modal>

            {/* Modal: Reset File - chọn file/sheet/header */}
            <Modal
                open={isResetExcelModalVisible}
                width={980}
                centered
                destroyOnClose
                zIndex={1000}
                title="Reset dữ liệu nguồn"
                onCancel={() => {
                    setIsResetExcelModalVisible(false);
                }}
                footer={[
                    <Button key="cancel" onClick={() => setIsResetExcelModalVisible(false)}>Hủy</Button>,
                    <Button key="ok" type="primary" onClick={() => setResetConfirmVisible(true)}>Tiếp tục</Button>
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '80vh', overflowY: 'auto' }}>


                    {/* Giao diện reset dùng lại UI của UploadConfig cho tất cả nguồn */}
                    <UploadConfig
                        key={resetModalKey}
                        initialConfig={{ uploadType: (resetPreparedConfig && resetPreparedConfig.uploadType) || 'excel' }}
                        onChange={(cfg) => setResetPreparedConfig(cfg)}
                        templateData={templateData}
                        currentStepId={1}
                        availableColumns={[]}
                        uploadSaving={false}
                        modalOpen={true}
                        onSaveData={async (prepared, stepId) => {
                            setResetPreparedConfig(prepared);
                            return prepared; // do not save here
                        }}
                        mode="prepare"
                        onPrepare={(prepared) => setResetPreparedConfig(prepared)}
                    />
                    <div style={{ marginTop: 12, background: '#fffbe6', border: '1px solid #ffe58f', padding: 12, borderRadius: 6 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Lưu ý:</div>
                        <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                            <li>Xóa dữ liệu step 1 và các step phía sau (theo version). Giữ nguyên cấu hình.</li>
                            <li>Sau khi chọn nguồn và dữ liệu mới, nhấn Tiếp tục để xác nhận xóa và tải lên.</li>
                        </ul>
                    </div>
                </div>
            </Modal>

            {/* Modal xác nhận xóa và tải lên */}
            <Modal
                open={resetConfirmVisible}
                title="Xác nhận thay thế dữ liệu"
                onCancel={() => setResetConfirmVisible(false)}
                onOk={async () => {
                    try {
                        if (!templateData?.id) {
                            message.error('Thiếu thông tin bảng (tableId)');
                            return;
                        }
                        // Validate prepared config
                        const prepared = resetPreparedConfig && Object.keys(resetPreparedConfig).length ? resetPreparedConfig : null;
                        if (!prepared) {
                            message.error('Vui lòng chuẩn bị dữ liệu nguồn mới trước khi xác nhận');
                            return;
                        }
                        setResetUploading(true);
                        // 1) Xóa toàn bộ template_data theo tableId (step 1)
                        await deleteTemplateRowByTableId(templateData.id);

                        // 1b) Xóa template_data của các step sau đó (theo version = step.id), giữ nguyên config
                        if (Array.isArray(normalizedSteps) && normalizedSteps.length > 0) {
                            const startIdx = (resetTargetStepIndex !== null && resetTargetStepIndex >= 0) ? resetTargetStepIndex + 1 : 0;
                            const deletePromises = normalizedSteps
                                .slice(startIdx)
                                .map(step => deleteTemplateRowByTableId(templateData.id, step.id));
                            if (deletePromises.length > 0) {
                                await Promise.allSettled(deletePromises);
                            }
                        }

                        // 1c) Xóa frequency config cũ nếu có (trước khi thay đổi loại upload)
                        try {
                            const existingConfig = await getFrequencyConfigByTableId(templateData.id);
                            if (existingConfig?.data?.data) {
                                await deleteFrequencyConfig(existingConfig.data.data.id);   
                                console.log('Deleted old frequency config before reset:', templateData.id);
                            }
                        } catch (error) {
                            console.warn('Error deleting old frequency config (bỏ qua):', error);
                        }

                        // 2) Lấy dữ liệu và cột từ prepared config theo nguồn
                        let newData = [];
                        let outputColumns = [];
                        let originalColumnsOrder = [];
                        if (prepared.uploadType === 'excel' && prepared.excelData) {
                            newData = prepared.excelData;
                            outputColumns = prepared.outputColumns || (prepared.excelColumns || []).map(name => ({ name, type: 'text' }));
                            originalColumnsOrder = prepared.excelColumns || [];
                        } else if (prepared.uploadType === 'googleSheets' && prepared.googleSheetsData) {
                            newData = prepared.googleSheetsData;
                            outputColumns = prepared.outputColumns || (prepared.googleSheetsColumns || []).map(name => ({ name, type: 'text' }));
                            originalColumnsOrder = prepared.googleSheetsColumns || [];
                        } else if (prepared.uploadType === 'googleDrive' && prepared.googleDriveData) {
                            newData = prepared.googleDriveData;
                            // Fix: Ensure outputColumns is properly structured
                            if (prepared.outputColumns && prepared.outputColumns.length > 0) {
                                // If outputColumns already exists, ensure it's properly formatted
                                outputColumns = prepared.outputColumns.map(col => {
                                    if (typeof col === 'string') {
                                        return { name: col, type: 'text' };
                                    } else if (col && typeof col.name === 'string') {
                                        return { name: col.name, type: col.type || 'text' };
                                    } else if (col && col.name && typeof col.name === 'object') {
                                        // Fix nested object structure
                                        return { name: col.name.name || String(col.name), type: col.type || 'text' };
                                    } else {
                                        return { name: String(col), type: 'text' };
                                    }
                                });
                            } else {
                                // Create from googleDriveColumns
                                outputColumns = (prepared.googleDriveColumns || []).map(col => {
                                    if (typeof col === 'string') {
                                        return { name: col, type: 'text' };
                                    } else if (col && col.name) {
                                        return { name: col.name, type: 'text' };
                                    } else {
                                        return { name: String(col), type: 'text' };
                                    }
                                });
                            }
                            originalColumnsOrder = (prepared.googleDriveColumns || []).map(col => {
                                if (typeof col === 'string') {
                                    return col;
                                } else if (col && col.name) {
                                    return col.name;
                                } else {
                                    return String(col);
                                }
                            });
                            
                            // Debug log để kiểm tra googleDriveFileId
                            console.log('Google Drive prepared config:', {
                                googleDriveFileId: prepared.googleDriveFileId,
                                googleDriveSelectedFileName: prepared.googleDriveSelectedFileName,
                                googleDriveFolderUrl: prepared.googleDriveFolderUrl,
                                googleDriveSheet: prepared.googleDriveSheet,
                                googleDriveHeaderRow: prepared.googleDriveHeaderRow
                            });
                        } else if (prepared.uploadType === 'postgresql' && prepared.postgresData) {
                            newData = prepared.postgresData;
                            outputColumns = prepared.outputColumns || (prepared.postgresColumns || []).map(name => ({ name, type: 'text' }));
                            originalColumnsOrder = prepared.postgresColumns || [];
                        } else if (prepared.uploadType === 'api' && prepared.apiData) {
                            newData = prepared.apiData;
                            outputColumns = prepared.outputColumns || (prepared.apiColumns || []).map(name => ({ name, type: 'text' }));
                            originalColumnsOrder = prepared.apiColumns || [];
                        } else if (prepared.uploadType === 'system' && prepared.systemData) {
                            newData = prepared.systemData;
                            outputColumns = prepared.outputColumns || (prepared.systemColumns || []).map(name => ({ name, type: 'text' }));
                            originalColumnsOrder = prepared.systemColumns || [];
                        } else if (prepared.uploadType === 'googleDriveFolder') {
                            // Lấy dữ liệu từ Google Drive Folder sử dụng logic tương tự handleFetchGoogleDriveFolderDataNow
                            try {
                                console.log('Fetching Google Drive Folder data for reset:', {
                                    googleDriveFolderUrl: prepared.googleDriveFolderUrl,
                                    fileNameCondition: prepared.fileNameCondition,
                                    lastUpdateCondition: prepared.lastUpdateCondition,
                                    headerRow: prepared.headerRow,
                                    mergeColumns: prepared.mergeColumns,
                                    removeDuplicateColumns: prepared.removeDuplicateColumns,
                                    sortColumns: prepared.sortColumns
                                });

                                // Bước 1: Lấy danh sách file từ folder sử dụng n8nWebhookGoogleDrive
                                const folderResponse = await n8nWebhookGetFileFromGoogleDrive({ 
                                    googleDriveUrl: prepared.googleDriveFolderUrl,
                                    email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com'
                                });

                                console.log('Response từ folder:', folderResponse);

                                if (!folderResponse || !folderResponse.success) {
                                    message.error('Không thể lấy danh sách file từ Google Drive Folder!');
                                    setResetUploading(false);
                                    return;
                                }

                                // Bước 2: Lấy danh sách file từ response
                                let files = [];
                                if (folderResponse.files && Array.isArray(folderResponse.files)) {
                                    files = folderResponse.files;
                                } else if (folderResponse.n8nResponse && Array.isArray(folderResponse.n8nResponse)) {
                                    files = folderResponse.n8nResponse;
                                } else if (folderResponse.sheets) {
                                    files = Object.keys(folderResponse.sheets).map(sheetName => ({
                                        id: sheetName,
                                        name: sheetName,
                                        sheetName: sheetName
                                    }));
                                }

                                console.log(`Tìm thấy ${files.length} file trong folder:`, files.map(f => f.name));

                                if (files.length === 0) {
                                    message.warning('Không tìm thấy file nào trong folder!');
                                    setResetUploading(false);
                                    return;
                                }

                                // Bước 3: Lọc file theo điều kiện
                                let filteredFiles = files;
                                console.log(`Tổng số file trước khi lọc: ${files.length}`);
                                console.log(`Điều kiện tên file: "${prepared.fileNameCondition}"`);
                                console.log(`Điều kiện thời gian: "${prepared.lastUpdateCondition}"`);
                                
                                if (prepared.fileNameCondition) {
                                    const pattern = prepared.fileNameCondition.replace(/\*/g, '.*');
                                    const regex = new RegExp(pattern, 'i');
                                    filteredFiles = filteredFiles.filter(file => regex.test(file.name));
                                    console.log(`Lọc theo tên file "${prepared.fileNameCondition}": ${filteredFiles.length} file`);
                                }

                                if (prepared.lastUpdateCondition) {
                                    const now = new Date();
                                    const days = parseInt(prepared.lastUpdateCondition.replace('d', ''));
                                    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
                                    filteredFiles = filteredFiles.filter(file => {
                                        // Sử dụng modifiedTime từ Google Drive API response
                                        const fileDate = new Date(file.modifiedTime || file.lastModified || now);
                                        return fileDate >= cutoffDate;
                                    });
                                    console.log(`Lọc theo thời gian "${prepared.lastUpdateCondition}": ${filteredFiles.length} file`);
                                    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
                                    console.log(`Files after time filter:`, filteredFiles.map(f => ({
                                        name: f.name,
                                        modifiedTime: f.modifiedTime,
                                        modifiedDate: new Date(f.modifiedTime).toISOString()
                                    })));
                                }

                                if (filteredFiles.length === 0) {
                                    message.warning('Không có file nào thỏa mãn điều kiện lọc!');
                                    setResetUploading(false);
                                    return;
                                }

                                console.log(`Tìm thấy ${filteredFiles.length} file để xử lý`);

                                // Bước 4: Lấy dữ liệu từ từng file
                                const mergedRows = [];
                                const allHeadersSet = new Set();
                                let columnOrder = [];
                                const headerRow = prepared.headerRow || 1; // 1-based từ UI
                                const headerRowIndex = Math.max(0, headerRow - 1); // Chuyển sang 0-based

                                for (const file of filteredFiles) {
                                    try {
                                        console.log(`Đang xử lý file: ${file.name}`);
                                        
                                        // Lấy dữ liệu từ file riêng lẻ
                                        const fileResponse = await n8nWebhookGoogleDrive({ 
                                            googleDriveUrl: file.id,
                                            email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com'
                                        });

                                        if (!fileResponse || !fileResponse.success) {
                                            console.warn(`Không thể lấy dữ liệu từ file ${file.name}`);
                                            continue;
                                        }

                                        // Xử lý dữ liệu từ file
                                        let matrix = [];
                                        if (fileResponse.sheets && Array.isArray(fileResponse.sheetNames)) {
                                            const sheetName = file.sheetName || fileResponse.sheetNames[0];
                                            const sheetData = fileResponse.sheets[sheetName];
                                            matrix = Array.isArray(sheetData?.data) ? sheetData.data : [];
                                        } else if (fileResponse.rawData && Array.isArray(fileResponse.rawData)) {
                                            matrix = fileResponse.rawData;
                                        }

                                        if (!Array.isArray(matrix) || matrix.length === 0) {
                                            console.warn(`File ${file.name} không có dữ liệu`);
                                            continue;
                                        }

                                        if (headerRowIndex >= matrix.length) {
                                            console.warn(`File ${file.name}: Header row ${headerRow} không hợp lệ`);
                                            continue;
                                        }

                                        const fileHeaderRow = matrix[headerRowIndex] || [];
                                        const dataRows = matrix.slice(headerRowIndex + 1);

                                        // Thêm headers vào set tổng hợp
                                        fileHeaderRow.forEach(h => { 
                                            if (h !== undefined && h !== null && String(h).trim() !== '') {
                                                allHeadersSet.add(String(h));
                                            }
                                        });

                                        // Cập nhật columnOrder để giữ nguyên thứ tự cột theo lần xuất hiện đầu tiên
                                        if (columnOrder.length === 0) {
                                            columnOrder = fileHeaderRow
                                                .filter(h => h !== undefined && h !== null && String(h).trim() !== '')
                                                .map(h => String(h));
                                        } else {
                                            fileHeaderRow.forEach(h => {
                                                if (h === undefined || h === null) return;
                                                const name = String(h);
                                                if (name.trim() !== '' && !columnOrder.includes(name)) {
                                                    columnOrder.push(name);
                                                }
                                            });
                                        }

                                        // Xử lý dữ liệu từng dòng
                                        for (const row of dataRows) {
                                            const obj = {};
                                            fileHeaderRow.forEach((h, i) => {
                                                if (h === undefined || h === null) return;
                                                obj[String(h)] = Array.isArray(row) ? row[i] : undefined;
                                            });
                                            mergedRows.push(obj);
                                        }

                                        console.log(`Đã xử lý file ${file.name}: ${dataRows.length} dòng`);
                                    } catch (error) {
                                        console.error(`Lỗi khi xử lý file ${file.name}:`, error);
                                        // Tiếp tục với file khác
                                    }
                                }

                                const allHeaders = columnOrder.length > 0 ? columnOrder : Array.from(allHeadersSet);
                                if (allHeaders.length === 0 || mergedRows.length === 0) {
                                    message.error('Không lấy được dữ liệu từ các file đã lọc.');
                                    setResetUploading(false);
                                    return;
                                }

                                console.log(`Tổng hợp: ${mergedRows.length} dòng từ ${filteredFiles.length} file, ${allHeaders.length} cột`);

                                // Gán dữ liệu đã lấy được
                                newData = mergedRows;
                                outputColumns = allHeaders.map(h => ({ name: h, type: 'text' }));
                                originalColumnsOrder = allHeaders;

                                console.log(`Successfully fetched ${newData.length} rows from ${filteredFiles.length} files`);
                            } catch (error) {
                                console.error('Error fetching Google Drive Folder data:', error);
                                message.error('Có lỗi xảy ra khi lấy dữ liệu từ Google Drive Folder');
                                setResetUploading(false);
                                return;
                            }
                        } else if (prepared.uploadType === 'htqc') {
                            // HTQC lưu tạm vào htqcData/htqcColumns trong config
                            if (prepared.htqcData && prepared.htqcData.length > 0) {
                                newData = prepared.htqcData;
                                originalColumnsOrder = prepared.htqcColumns || [];
                                outputColumns = prepared.outputColumns || (prepared.htqcColumns || []).map(name => ({ name, type: name === 'Số tiền' ? 'number' : 'text' }));
                            } else if (prepared.excelData && prepared.excelData.length > 0) {
                                // Fallback nếu đã được chuyển sang excelData
                                newData = prepared.excelData;
                                originalColumnsOrder = prepared.excelColumns || [];
                                outputColumns = prepared.outputColumns || (prepared.excelColumns || []).map(name => ({ name, type: 'text' }));
                            }
                        }

                        if (!newData || newData.length === 0) {
                            message.warning('File không có dữ liệu để tải lên');
                            setResetUploading(false);
                            return;
                        }

                        // 3) Upload dữ liệu mới (step 1) với outputColumns và thứ tự cột gốc
                        // Fallback: nếu không có originalColumnsOrder, lấy từ khóa đối tượng
                        if ((!originalColumnsOrder || originalColumnsOrder.length === 0) && newData && newData.length > 0) {
                            originalColumnsOrder = Object.keys(newData[0]);
                        }
                        const success = await saveDataToDatabase(newData, templateData.id, 1, outputColumns, originalColumnsOrder);
                        if (success) {
                            // 4) Cập nhật outputColumns cho step upload theo file mới
                            const newOutputColumns = (outputColumns || [])
                                .filter(col => (typeof col === 'string' ? col : col?.name) !== 'key')
                                .map(col => typeof col === 'string' ? ({ name: col, type: 'text' }) : col);
                            let updatedSteps = [...normalizedSteps];
                            if (resetTargetStepIndex !== null && updatedSteps[resetTargetStepIndex]) {
                                const uploadStep = updatedSteps[resetTargetStepIndex];
                                
                                // Tạo config mới dựa trên loại upload
                                let extraConfig = {};
                                
                                switch (prepared.uploadType) {
                                    case 'excel':
                                        extraConfig = {
                                            uploadType: 'excel',
                                            excelData: prepared.excelData || [],
                                            excelColumns: prepared.excelColumns || [],
                                            lastUpdate: new Date().toISOString(),
                                        };
                                        break;
                                    case 'googleSheets':
                                        extraConfig = {
                                            uploadType: 'googleSheets',
                                            googleSheetUrl: prepared.googleSheetUrl || uploadStep.config?.googleSheetUrl || '',
                                            // googleSheetsData: prepared.googleSheetsData || [],
                                            googleSheetsColumns: prepared.googleSheetsColumns || [],
                                            googleSheetsHeaderRow: typeof prepared.googleSheetsHeaderRow === 'number' ? prepared.googleSheetsHeaderRow : uploadStep.config?.googleSheetsHeaderRow || 0,
                                            lastUpdate: new Date().toISOString(),
                                        };
                                        break;
                                    case 'googleDrive':
                                        extraConfig = {
                                            uploadType: 'googleDrive',
                                            googleDriveFileId: prepared.googleDriveFileId || uploadStep.config?.googleDriveFileId || '',
                                            googleDriveMimeType: prepared.googleDriveMimeType || uploadStep.config?.googleDriveMimeType || 'application/vnd.google-apps.spreadsheet',
                                            googleDriveFolderUrl: prepared.googleDriveFolderUrl || uploadStep.config?.googleDriveFolderUrl || '',
                                            googleDriveUrl: prepared.googleDriveFolderUrl || uploadStep.config?.googleDriveUrl || '',
                                            googleDriveSelectedFileName: prepared.googleDriveSelectedFileName || uploadStep.config?.googleDriveSelectedFileName || '',
                                            googleDriveSheet: prepared.googleDriveSheet || uploadStep.config?.googleDriveSheet || '',
                                            googleDriveHeaderRow: typeof prepared.googleDriveHeaderRow === 'number' ? prepared.googleDriveHeaderRow : uploadStep.config?.googleDriveHeaderRow || 0,
                                            googleDriveColumns: prepared.googleDriveColumns || uploadStep.config?.googleDriveColumns || [],
                                            googleDriveData: prepared.googleDriveData || [],
                                            lastUpdate: new Date().toISOString(),
                                        };
                                        break;
                                    case 'googleDriveFolder':
                                       
                                        extraConfig = {
                                            uploadType: 'googleDriveFolder',
                                                googleDriveFolderUrl: prepared.googleDriveFolderUrl || uploadStep.config?.googleDriveFolderUrl || '',
                                                
                                                lastUpdate: new Date().toISOString(),
                                        };
                                        break;
                                    case 'postgresql':
                                        extraConfig = {
                                            uploadType: 'postgresql',
                                            postgresConfig: prepared.postgresConfig || uploadStep.config?.postgresConfig || {},
                                            postgresData: prepared.postgresData || [],
                                            postgresColumns: prepared.postgresColumns || [],
                                            lastUpdate: new Date().toISOString(),
                                        };
                                        break;
                                    case 'api':
                                        extraConfig = {
                                            uploadType: 'api',
                                            apiUrl: prepared.apiUrl || uploadStep.config?.apiUrl || '',
                                            apiKey: prepared.apiKey || uploadStep.config?.apiKey || '',
                                            apiData: prepared.apiData || [],
                                            apiColumns: prepared.apiColumns || [],
                                            lastUpdate: new Date().toISOString(),
                                        };
                                        break;
                                    case 'system':
                                        extraConfig = {
                                            uploadType: 'system',
                                            systemConfig: prepared.systemConfig || uploadStep.config?.systemConfig || {},
                                            systemData: prepared.systemData || [],
                                            systemColumns: prepared.systemColumns || [],
                                            lastUpdate: new Date().toISOString(),
                                        };
                                        break;
                                    case 'htqc':
                                        extraConfig = {
                                            uploadType: 'htqc',
                                            htqcData: prepared.htqcData || [],
                                            htqcColumns: prepared.htqcColumns || [],
                                            lastUpdate: new Date().toISOString(),
                                        };
                                        break;
                                    default:
                                        extraConfig = {
                                            lastUpdate: new Date().toISOString(),
                                        };
                                }
                                
                                // Xóa các config cũ không còn liên quan
                                const cleanConfig = { ...uploadStep.config };
                                
                                // Xóa tất cả config của các loại upload khác
                                const allUploadTypes = ['excel', 'googleSheets', 'googleDrive', 'postgresql', 'api', 'system', 'htqc'];
                                allUploadTypes.forEach(type => {
                                    if (type !== prepared.uploadType) {
                                        // Xóa data và columns của các loại khác
                                        delete cleanConfig[`${type}Data`];
                                        delete cleanConfig[`${type}Columns`];
                                        
                                        // Xóa các config đặc biệt
                                        if (type === 'googleSheets') {
                                            delete cleanConfig.googleSheetUrl;
                                            delete cleanConfig.googleSheetsHeaderRow;
                                            delete cleanConfig.googleSheetsData;
                                        } else if (type === 'googleDrive') {
                                            delete cleanConfig.googleDriveFileId;
                                            delete cleanConfig.googleDriveMimeType;
                                            delete cleanConfig.googleDriveFolderUrl;
                                            delete cleanConfig.googleDriveUrl;
                                            delete cleanConfig.googleDriveSelectedFileName;
                                            delete cleanConfig.googleDriveSheet;
                                            delete cleanConfig.googleDriveHeaderRow;
                                        }
                                        
                                        else if (type === 'googleDriveFolder') {
                                            delete cleanConfig.googleDriveFolderData;
                                            delete cleanConfig.googleDriveFolderColumns;
                                        } else if (type === 'postgresql') {
                                            delete cleanConfig.postgresConfig;
                                        } else if (type === 'api') {
                                            delete cleanConfig.apiUrl;
                                            delete cleanConfig.apiKey;
                                        } else if (type === 'system') {
                                            delete cleanConfig.systemConfig;
                                        }
                                    }
                                });
                                
                                const newConfig = {
                                    ...cleanConfig,
                                    ...extraConfig,
                                    outputColumns: newOutputColumns,
                                    outputColumnsTimestamp: new Date().toISOString(),
                                };
                                
                                updatedSteps[resetTargetStepIndex] = { ...uploadStep, config: newConfig, needUpdate: false };
                                
                                // 5) Đánh dấu needUpdate cho các step phía sau
                                updatedSteps = updatedSteps.map((s, idx) => idx > resetTargetStepIndex ? { ...s, needUpdate: true } : s);
                                onChange(updatedSteps);
                                
                                if (templateData && templateData.id) {
                                    try {
                                        await updateTemplateTable({ ...templateData, steps: updatedSteps });
                                    } catch (error) {
                                        console.error('Lỗi khi cập nhật template:', error);
                                    }
                                }

                                // 6) Xử lý frequency config cho Google Drive Folder
                                try {
                                    if (templateData?.id && prepared.uploadType === 'googleDriveFolder') {
                                        // Kiểm tra xem có cấu hình frequency không
                                        const isFrequencyActive = prepared.isFrequencyActive || false;
                                        const frequencyHours = Number(prepared.frequencyHours || 3);
                                        
                                        if (isFrequencyActive && frequencyHours > 0) {
                                            // Kiểm tra xem đã có frequency config chưa
                                            const existingConfig = await getFrequencyConfigByTableId(templateData.id);
                                            
                                            const configData = {
                                                frequency_hours: frequencyHours,
                                                is_active: true,
                                                config: {
                                                    uploadType: 'googleDriveFolder',
                                                    googleDriveFolderUrl: prepared.googleDriveFolderUrl,
                                                    fileNameCondition: prepared.fileNameCondition || '',
                                                    lastUpdateCondition: prepared.lastUpdateCondition || '',
                                                    headerRow: Math.max(0, (prepared.headerRow || 1) - 1),
                                                    mergeColumns: prepared.mergeColumns || [],
                                                    removeDuplicateColumns: prepared.removeDuplicateColumns || [],
                                                    sortColumns: prepared.sortColumns || [],
                                                },
                                                schema: currentSchemaPathRecord?.path,
                                            };

                                            if (existingConfig?.data?.data) {
                                                // Cập nhật config hiện có
                                                await updateFrequencyConfig(existingConfig.data.data.id, configData);
                                                console.log('Updated frequency config for Google Drive Folder table:', templateData.id);
                                            } else {
                                                // Tạo config mới
                                                await createFrequencyConfig({
                                                    tableId: templateData.id,
                                                    schema: currentSchemaPathRecord?.path,
                                                    config: configData
                                                });
                                                console.log('Created frequency config for Google Drive Folder table:', templateData.id);
                                            }
                                        } 
                                    }
                                } catch (error) {
                                    console.error('Error handling frequency config for Google Drive Folder:', error);
                                    // Không chặn luồng chính nếu có lỗi với frequency config
                                }
                            }
                            message.success('Đã reset và tải dữ liệu mới thành công');
                            setResetConfirmVisible(false);
                            setIsResetExcelModalVisible(false);
                            // làm mới dữ liệu hiển thị nếu có hàm reload
                            if (typeof fetchTemplateData === 'function') {
                                try { await fetchTemplateData(); } catch { }
                            }
                        }
                    } catch (err) {
                        message.error(err.message || 'Có lỗi khi reset và tải dữ liệu');
                    } finally {
                        setResetUploading(false);
                    }
                }}
                confirmLoading={resetUploading}
                zIndex={2000}
                okText="Xóa hết và tải lên"
                okButtonProps={{ danger: true }}
                cancelText="Hủy"
            >
                <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', padding: 12, borderRadius: 6 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Cảnh báo quan trọng:</div>
                        <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                            <li>Xóa toàn bộ dữ liệu hiện có của step 1 (bảng gốc).</li>
                            <li>Xóa toàn bộ dữ liệu của các step phía sau (theo version), nhưng vẫn giữ nguyên cấu hình.</li>
                            <li>Các step phía sau sẽ được đánh dấu cần cập nhật <Tag color="orange">Need Update</Tag> để chạy lại.</li>
                        </ul>
                    </div>
                    {/* <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', padding: 12, borderRadius: 6 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Bạn đã kiểm tra:</div>
                        <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                            <li>Đã chọn đúng Sheet: <span style={{ fontWeight: 'bold' }}>{resetSelectedSheet || '(chưa chọn)'}</span></li>
                            <li>Đã chọn đúng hàng tiêu đề: <span style={{ fontWeight: 'bold' }}>Hàng {resetSelectedHeaderRow + 1}</span></li>
                            <li>Đã xem preview 5 dòng đầu để đảm bảo đúng cấu trúc cột.</li>
                        </ul>
                    </div> */}
                </div>
            </Modal>

            {/* Modal import thêm dữ liệu */}
            <Modal
                open={showImportMoreDataModal}
                onCancel={() => {
                    setShowImportMoreDataModal(false);
                    resetAllStates();
                }}
                title={importMoreDataConfig.isGoogleSheetSource ? 'Cấu hình Google Sheet' : importMoreDataConfig.isGoogleDriveSource ? 'Cấu hình Google Drive' : importMoreDataConfig.isGoogleDriveFolderSource ? 'Cấu hình Google Drive Folder' : importMoreDataConfig.isPostgresSource ? 'Cấu hình PostgreSQL' : importMoreDataConfig.isApiSource ? 'Cấu hình API' : importMoreDataConfig.isSystemSource ? 'Cấu hình System Import' : 'Edit dữ liệu'}
                width="80vw"
                centered
                styles={{
                    body: {
                        height: 'calc(90vh - 120px)',
                        overflowY: 'auto',
                        paddingRight: '8px',
                    },
                    header: {
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        backgroundColor: '#fff',
                        borderBottom: '1px solid #f0f0f0',
                    },
                    footer: {
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 1,
                        backgroundColor: '#fff',
                        borderTop: '1px solid #f0f0f0',
                    },
                }}
                style={{ top: 20, height: '90vh' }}
                footer={importMoreDataConfig.isGoogleSheetSource ? [
                    <Button key="cancel" onClick={() => {
                        setShowImportMoreDataModal(false);
                        resetAllStates();
                    }}>
                        Hủy
                    </Button>,
                    <Button
                        key="save-config"
                        onClick={handleSaveIntervalConfig}
                    >
                        Lưu cấu hình
                    </Button>,
                    <Button
                        key="fetch-now"
                        type="primary"
                        loading={importMoreLoading}
                        onClick={handleFetchGoogleSheetDataNow}
                    >
                        Lấy dữ liệu ngay
                    </Button>,
                ] : importMoreDataConfig.isGoogleDriveFolderSource ? [
                    <Button key="cancel" onClick={() => {
                        setShowImportMoreDataModal(false);
                        resetAllStates();
                    }}>
                        Hủy
                    </Button>,
                    <Button
                        key="save-config"
                        onClick={handleSaveIntervalConfig}
                    >
                        Lưu cấu hình
                    </Button>,
                    <Button
                        key="fetch-now"
                        type="primary"
                        loading={importMoreLoading}
                        onClick={handleFetchGoogleDriveFolderDataNow}
                    >
                        Lấy dữ liệu ngay
                    </Button>,
                ] : importMoreDataConfig.isGoogleDriveSource ? [
                    <Button key="cancel" onClick={() => {
                        setShowImportMoreDataModal(false);
                        resetAllStates();
                    }}>
                        Hủy
                    </Button>,
                    <Button
                        key="save-config"
                        onClick={handleSaveIntervalConfig}
                    >
                        Lưu cấu hình
                    </Button>,
                    <Button
                        key="fetch-now"
                        type="primary"
                        loading={importMoreLoading}
                        onClick={handleFetchGoogleDriveDataNow}
                    >
                        Lấy dữ liệu ngay
                    </Button>,
                ] : importMoreDataConfig.isPostgresSource ? [
                    <Button key="cancel" onClick={() => {
                        setShowImportMoreDataModal(false);
                        resetAllStates();
                    }}>
                        Hủy
                    </Button>,
                    <Button
                        key="save-config"
                        onClick={handleSaveIntervalConfig}
                    >
                        Lưu cấu hình
                    </Button>,
                    <Button
                        key="fetch-now"
                        type="primary"
                        loading={importMoreLoading}
                        onClick={handleFetchPostgresDataNow}
                    >
                        Lấy dữ liệu ngay
                    </Button>,
                ] : importMoreDataConfig.isApiSource ? [
                    <Button key="cancel" onClick={() => {
                        setShowImportMoreDataModal(false);
                        resetAllStates();
                    }}>
                        Hủy
                    </Button>,
                    <Button
                        key="fetch-now"
                        type="primary"
                        loading={importMoreLoading}
                        onClick={handleFetchApiDataNow}
                    >
                        Lấy dữ liệu ngay
                    </Button>,
                ] : importMoreDataConfig.isSystemSource ? [
                    <Button key="cancel" onClick={() => {
                        setShowImportMoreDataModal(false);
                        resetAllStates();
                    }}>
                        Hủy
                    </Button>,
                    <Button
                        key="fetch-now"
                        type="primary"
                        loading={importMoreLoading}
                        onClick={handleFetchSystemDataNow}
                    >
                        Lấy dữ liệu ngay
                    </Button>,
                ] : [
                    <Button key="cancel" onClick={() => {
                        setShowImportMoreDataModal(false);
                        resetAllStates();
                    }}>
                        Hủy
                    </Button>,
                    <Button
                        key="import"
                        type="primary"
                        loading={importMoreLoading}
                        onClick={handleImportMoreData}
                        disabled={importedMoreData.length === 0}
                    >
                        Import dữ liệu
                    </Button>,
                ]}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {importMoreDataConfig.isGoogleSheetSource ? (
                        <>
                            {/* UI cho Google Sheet */}
                            <Card title="Cấu hình Google Sheet" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <strong>URL Google Sheet:</strong>
                                        <div style={{
                                            marginTop: 4,
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                        }}>
                                            {importMoreDataConfig.googleSheetUrl}
                                        </div>
                                    </div>

                                    {importMoreDataConfig.lastUpdate && (
                                        <div>
                                            <strong>Lần cập nhật cuối:</strong>
                                            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                                                {new Date(importMoreDataConfig.lastUpdate).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                    )}
                                </Space>
                            </Card>

                          

                            <Card title="Cấu hình tự động cập nhật" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 4 }}>Thời gian tự động cập
                                            nhật:</label>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                                            Chọn khoảng thời gian để tự động lấy dữ liệu mới từ Google Sheet (Chỉ hoạt động khi bật chế độ Autorun)
                                        </div>
                                        <Select
                                            style={{ width: '100%' }}
                                            value={importMoreDataConfig.intervalUpdate}
                                            onChange={(value) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                intervalUpdate: value,
                                            }))}
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

                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        ⚠️ Khi bấm "Lấy dữ liệu ngay", hệ thống sẽ xóa toàn bộ dữ liệu cũ và thay thế
                                        bằng dữ liệu mới từ Google Sheet.
                                    </div>
                                </Space>
                            </Card>
                        </>
                    ) : importMoreDataConfig.isGoogleDriveFolderSource ? (
                        <>
                            {/* UI cho Google Drive Folder */}
                            <Card title="Google Drive Folder & Tự động tổng hợp" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <strong>Folder URL:</strong>
                                        <div style={{ marginTop: 4, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                            {importMoreDataConfig.googleDriveFolderUrl || 'Chưa có'}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <strong>Điều kiện tên file:</strong>
                                        <Input
                                            value={importMoreDataConfig.fileNameCondition || ''}
                                            onChange={(e) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                fileNameCondition: e.target.value
                                            }))}
                                            placeholder="Ví dụ: *.xlsx, report_*.csv, hoặc để trống để lấy tất cả"
                                            style={{ marginTop: 4 }}
                                        />
                                    </div>
                                    
                                    <div>
                                        <strong>Điều kiện thời gian cập nhật:</strong>
                                        <Select
                                            value={importMoreDataConfig.lastUpdateCondition || ''}
                                            onChange={(value) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                lastUpdateCondition: value
                                            }))}
                                            style={{ width: '100%', marginTop: 4 }}
                                            placeholder="Chọn điều kiện thời gian"
                                        >
                                            <Option value="">Tất cả file</Option>
                                            <Option value="1d">Trong 1 ngày</Option>
                                            <Option value="3d">Trong 3 ngày</Option>
                                            <Option value="7d">Trong 7 ngày</Option>
                                            <Option value="30d">Trong 30 ngày</Option>
                                        </Select>
                                    </div>
                                    
                                    <div>
                                        <strong>Hàng làm header:</strong>
                                        <InputNumber
                                            value={importMoreDataConfig.headerRow || 1}
                                            onChange={(value) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                headerRow: value
                                            }))}
                                            min={1}
                                            style={{ width: '100%', marginTop: 4 }}
                                            placeholder="Số thứ tự hàng (bắt đầu từ 1)"
                                        />
                                    </div>
                                    
                                    <div>
                                        <strong>Tự động cập nhật:</strong>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                            <Switch
                                                checked={!!importMoreDataConfig.isFrequencyActive}
                                                onChange={(checked) => setImportMoreDataConfig(prev => ({
                                                    ...prev,
                                                    isFrequencyActive: checked,
                                                    frequencyHours: checked ? (prev.frequencyHours && prev.frequencyHours > 0 ? prev.frequencyHours : 3) : 0
                                                }))}
                                            />
                                            <span>{importMoreDataConfig.isFrequencyActive ? 'Đang bật' : 'Không tự động cập nhật'}</span>
                                        </div>
                                        {importMoreDataConfig.isFrequencyActive && (
                                            <Select
                                                value={importMoreDataConfig.frequencyHours || 0}
                                                onChange={(value) => setImportMoreDataConfig(prev => ({
                                                    ...prev,
                                                    frequencyHours: value
                                                }))}
                                                style={{ width: '100%', marginTop: 8 }}
                                                placeholder="Chọn tần suất (giờ)"
                                            >
                                                {/* <Option value={0.008333}>30 giây</Option> */}
                                                <Option value={0.25}>15 phút</Option>
                                                <Option value={0.5}>30 phút</Option>
                                                <Option value={1}>1 giờ</Option>
                                                <Option value={3}>3 giờ</Option>
                                                <Option value={6}>6 giờ</Option>
                                                <Option value={12}>12 giờ</Option>
                                                <Option value={24}>24 giờ</Option>
                                            </Select>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <strong>Lần cập nhật cuối:</strong>
                                        <div style={{ marginTop: 4, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                                            {importMoreDataConfig.outputColumnsTimestamp ? new Date(importMoreDataConfig.outputColumnsTimestamp).toLocaleString('vi-VN') : 'Chưa có'}
                                        </div>
                                    </div>

                                    {/* Merge Columns */}
                                    <div>
                                        <strong>Merge columns:</strong>
                                        <div style={{ marginTop: 4 }}>
                                            <Button
                                                type="dashed"
                                                onClick={() => {
                                                    const newMergeColumns = [...(importMoreDataConfig.mergeColumns || [])];
                                                    newMergeColumns.push({
                                                        sourceColumns: [],
                                                        targetColumn: '',
                                                        mergeType: 'concat'
                                                    });
                                                    setImportMoreDataConfig(prev => ({
                                                        ...prev,
                                                        mergeColumns: newMergeColumns
                                                    }));
                                                }}
                                                style={{ width: '100%', marginBottom: 8 }}
                                            >
                                                Thêm merge column
                                            </Button>
                                            {(importMoreDataConfig.mergeColumns || []).map((merge, index) => (
                                                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <div>
                                                            <label>Cột nguồn (cách nhau bằng dấu phẩy):</label>
                                                            <Input
                                                                value={merge.sourceColumns.join(', ')}
                                                                onChange={(e) => {
                                                                    const sourceColumns = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                                                    const newMergeColumns = [...(importMoreDataConfig.mergeColumns || [])];
                                                                    newMergeColumns[index] = { ...merge, sourceColumns };
                                                                    setImportMoreDataConfig(prev => ({
                                                                        ...prev,
                                                                        mergeColumns: newMergeColumns
                                                                    }));
                                                                }}
                                                                placeholder="Ví dụ: col1, col2, col3"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label>Cột đích:</label>
                                                            <Input
                                                                value={merge.targetColumn}
                                                                onChange={(e) => {
                                                                    const newMergeColumns = [...(importMoreDataConfig.mergeColumns || [])];
                                                                    newMergeColumns[index] = { ...merge, targetColumn: e.target.value };
                                                                    setImportMoreDataConfig(prev => ({
                                                                        ...prev,
                                                                        mergeColumns: newMergeColumns
                                                                    }));
                                                                }}
                                                                placeholder="Tên cột đích"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label>Kiểu merge:</label>
                                                            <Select
                                                                value={merge.mergeType}
                                                                onChange={(value) => {
                                                                    const newMergeColumns = [...(importMoreDataConfig.mergeColumns || [])];
                                                                    newMergeColumns[index] = { ...merge, mergeType: value };
                                                                    setImportMoreDataConfig(prev => ({
                                                                        ...prev,
                                                                        mergeColumns: newMergeColumns
                                                                    }));
                                                                }}
                                                                style={{ width: '100%' }}
                                                            >
                                                                <Option value="concat">Nối chuỗi</Option>
                                                                <Option value="sum">Tổng số</Option>
                                                                <Option value="first">Giá trị đầu tiên</Option>
                                                                <Option value="last">Giá trị cuối cùng</Option>
                                                            </Select>
                                                        </div>
                                                        <Button
                                                            type="text"
                                                            danger
                                                            onClick={() => {
                                                                const newMergeColumns = (importMoreDataConfig.mergeColumns || []).filter((_, i) => i !== index);
                                                                setImportMoreDataConfig(prev => ({
                                                                    ...prev,
                                                                    mergeColumns: newMergeColumns
                                                                }));
                                                            }}
                                                        >
                                                            Xóa
                                                        </Button>
                                                    </Space>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Remove Duplicate Columns */}
                                    <div>
                                        <strong>Remove duplicate columns:</strong>
                                        <Select
                                            mode="tags"
                                            value={importMoreDataConfig.removeDuplicateColumns || []}
                                            onChange={(value) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                removeDuplicateColumns: value
                                            }))}
                                            style={{ width: '100%', marginTop: 4 }}
                                            placeholder="Chọn các cột để remove duplicate"
                                            tokenSeparators={[',']}
                                        />
                                    </div>

                                    {/* Sort Columns */}
                                    <div>
                                        <strong>Sort columns:</strong>
                                        <div style={{ marginTop: 4 }}>
                                            <Button
                                                type="dashed"
                                                onClick={() => {
                                                    const newSortColumns = [...(importMoreDataConfig.sortColumns || [])];
                                                    newSortColumns.push({
                                                        column: '',
                                                        direction: 'asc'
                                                    });
                                                    setImportMoreDataConfig(prev => ({
                                                        ...prev,
                                                        sortColumns: newSortColumns
                                                    }));
                                                }}
                                                style={{ width: '100%', marginBottom: 8 }}
                                            >
                                                Thêm sort column
                                            </Button>
                                            {(importMoreDataConfig.sortColumns || []).map((sort, index) => (
                                                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <div>
                                                            <label>Tên cột:</label>
                                                            <Input
                                                                value={sort.column}
                                                                onChange={(e) => {
                                                                    const newSortColumns = [...(importMoreDataConfig.sortColumns || [])];
                                                                    newSortColumns[index] = { ...sort, column: e.target.value };
                                                                    setImportMoreDataConfig(prev => ({
                                                                        ...prev,
                                                                        sortColumns: newSortColumns
                                                                    }));
                                                                }}
                                                                placeholder="Tên cột để sort"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label>Thứ tự:</label>
                                                            <Select
                                                                value={sort.direction}
                                                                onChange={(value) => {
                                                                    const newSortColumns = [...(importMoreDataConfig.sortColumns || [])];
                                                                    newSortColumns[index] = { ...sort, direction: value };
                                                                    setImportMoreDataConfig(prev => ({
                                                                        ...prev,
                                                                        sortColumns: newSortColumns
                                                                    }));
                                                                }}
                                                                style={{ width: '100%' }}
                                                            >
                                                                <Option value="asc">Tăng dần</Option>
                                                                <Option value="desc">Giảm dần</Option>
                                                            </Select>
                                                        </div>
                                                        <Button
                                                            type="text"
                                                            danger
                                                            onClick={() => {
                                                                const newSortColumns = (importMoreDataConfig.sortColumns || []).filter((_, i) => i !== index);
                                                                setImportMoreDataConfig(prev => ({
                                                                    ...prev,
                                                                    sortColumns: newSortColumns
                                                                }));
                                                            }}
                                                        >
                                                            Xóa
                                                        </Button>
                                                    </Space>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <Alert
                                        message="Thông tin"
                                        description="Hệ thống sẽ tự động lấy dữ liệu từ Google Drive Folder theo cấu hình đã thiết lập và tổng hợp dữ liệu từ nhiều file."
                                        type="info"
                                        showIcon
                                    />
                                </Space>
                            </Card>
                        </>
                    ) : importMoreDataConfig.isGoogleDriveSource ? (
                        <>
                            {/* UI cho Google Drive */}
                   
                            <Card title="" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {importMoreDataConfig?.googleDriveMultiFiles ? <div>
                                        <div>
                                        <strong>Folder URL:</strong>
                                        <div style={{
                                            marginTop: 4,
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                        }}>
                                            {importMoreDataConfig?.googleDriveFolderUrl}
                                        </div>
                                    </div>
                                        </div> : (
                                    <div>
                                        <strong>Tên file:</strong>
                                        <div style={{
                                            marginTop: 4,
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                        }}>
                                            {importMoreDataConfig?.googleDriveSelectedFileName}
                                        </div>
                                    </div>
                                    ) }
                                      {!importMoreDataConfig?.googleDriveMultiFiles ? (
                                    <div>
                                        <strong>Folder URL:</strong>
                                        <div style={{
                                            marginTop: 4,
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                        }}>
                                            {importMoreDataConfig.googleDriveFolderUrl ? <a href={`${importMoreDataConfig?.googleDriveFolderUrl}`} 
                                                                target="_blank" rel="noopener noreferrer"
                                                                style={{display: 'flex', alignItems: 'center', gap: 4}}
                                                                >
                                                                <LinkOutlined />
                                                                {importMoreDataConfig?.googleDriveFolderUrl}
                                                                </a> : 'Folder URL'}
                                        </div>
                                    </div>
                                    ) : null}
                                         {!importMoreDataConfig?.googleDriveMultiFiles ? (
                                    <div>
                                        <strong>File URL:</strong>
                                        <div style={{
                                            marginTop: 4,
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                        }}>
                                            {importMoreDataConfig.googleDriveFileId ? <a href={`https://docs.google.com/spreadsheets/d/${importMoreDataConfig.googleDriveFileId}`} 
                                                                target="_blank" rel="noopener noreferrer"
                                                                style={{display: 'flex', alignItems: 'center', gap: 4}}
                                                                >
                                                                <LinkOutlined />
                                                                https://docs.google.com/spreadsheets/d/${importMoreDataConfig.googleDriveFileId}
                                                                </a> : 'File URL'}
                                        </div>
                                    </div>
                                    ) : null}
                                    {!importMoreDataConfig?.googleDriveMultiFiles ? (
                                    <div>
                                        <strong>Sheet:</strong>
                                        <div style={{
                                            marginTop: 4,
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                        }}>
                                            {importMoreDataConfig.googleDriveSheet || 'Sheet mặc định'}
                                        </div>
                                    </div>
                                    ) : null}

                                    {!importMoreDataConfig.googleDriveMultiFiles ? (
                                    <div>
                                        <strong>Hàng làm header:</strong>
                                        <div style={{
                                            marginTop: 4,
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                        }}>
                                            Hàng {typeof importMoreDataConfig.googleDriveHeaderRow === 'number' ? importMoreDataConfig.googleDriveHeaderRow + 1 : 1}
                                        </div>
                                    </div>
                                    ) : null}

                                    {importMoreDataConfig.googleDriveMultiFiles && Array.isArray(importMoreDataConfig.googleDriveFilesInfo) && importMoreDataConfig.googleDriveFilesInfo.length > 0 && (
                                        <div>
                                            <strong>Danh sách file đã chọn:</strong>
                                            <div style={{ marginTop: 8 }}>
                                                <Table
                                                    size="small"
                                                    dataSource={importMoreDataConfig.googleDriveFilesInfo.map((f, idx) => ({ key: f.id || idx, ...f }))}
                                                    columns={[
                                                        { title: '#', dataIndex: 'order', key: 'order', width: 60 },
                                                        { title: 'Tên file', dataIndex: 'name', key: 'name' },
                                                        { title: 'Sheet', dataIndex: 'selectedSheet', key: 'selectedSheet' },
                                                        { title: 'Header row', dataIndex: 'headerRow', key: 'headerRow', render: r => (typeof r === 'number' ? r : '') },
                                                        { title: 'Liên kết', dataIndex: 'id', key: 'id', 
                                                            render: r => (<a href={`https://docs.google.com/spreadsheets/d/${r}`} 
                                                                target="_blank" rel="noopener noreferrer">
                                                                <LinkOutlined />
                                                                </a>) },
                                                    ]}
                                                    pagination={false}
                                                />
                                            </div>
                                            <div style={{ marginTop: 12 }}>
                                                <Button
                                                    icon={<PlusOutlined />}
                                                    onClick={async () => {
                                                        try {
                                                            const folderUrl = importMoreDataConfig.googleDriveFolderUrl || '';
                                                            if (!folderUrl) {
                                                                message.error('Chưa có link folder Google Drive đã lưu trong cấu hình step đầu tiên.');
                                                                return;
                                                            }
                                                            const res = await n8nWebhookGetFileFromGoogleDrive({ googleDriveUrl: folderUrl });
                                                            if (res && Array.isArray(res.n8nResponse)) {
                                                                console.log('res', res);
                                                                // Open a modal similar to UploadConfig multi-file
                                                                setDriveFileList(res.n8nResponse);
                                                                setIsDriveFileModalVisible(true);
                                                            } else {
                                                                message.error(res?.message || 'Không thể lấy danh sách file từ Google Drive');
                                                            }
                                                        } catch (e) {
                                                            message.error('Lỗi khi lấy danh sách file từ folder đã lưu');
                                                        }
                                                    }}
                                                >
                                                    Chọn thêm file từ folder đã lưu
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {importMoreDataConfig.lastUpdate && (
                                        <div>
                                            <strong>Lần cập nhật cuối:</strong>
                                            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                                                {new Date(importMoreDataConfig.lastUpdate).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                    )}
                                </Space>
                            </Card>

                            <Card title="Cấu hình tự động cập nhật" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 4 }}>Thời gian tự động cập
                                            nhật:</label>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                                            Chọn khoảng thời gian để tự động lấy dữ liệu mới từ Google Drive (Chỉ hoạt động khi bật chế độ Autorun)
                                        </div>
                                        <Select
                                            style={{ width: '100%' }}
                                            value={importMoreDataConfig.intervalUpdate}
                                            onChange={(value) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                intervalUpdate: value,
                                            }))}
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

                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        ⚠️ Khi bấm "Lấy dữ liệu ngay", hệ thống sẽ xóa toàn bộ dữ liệu cũ và thay thế
                                        bằng dữ liệu mới từ Google Drive.
                                    </div>
                                </Space>
                            </Card>

                              {/* Modal chọn nhiều file (giống UploadConfig) */}
                              <Modal
                                title="Chọn file từ Google Drive"
                                open={isDriveFileModalVisible}
                                onCancel={() => setIsDriveFileModalVisible(false)}
                                footer={[
                                    <Button key="cancel" onClick={() => setIsDriveFileModalVisible(false)}>
                                        Hủy
                                    </Button>,
                                    <Button
                                        key="ok"
                                        type="primary"
                                        loading={driveLoading}
                                        disabled={!(Array.isArray(selectedDriveFileIds) && selectedDriveFileIds.length > 0)}
                                        onClick={async () => {
                                            setDriveLoading(true);
                                            try {
                                                const idToName = new Map((driveFileList || []).map(f => [f.id, f.name]));
                                                const filesInfo = (selectedDriveFileIds || []).map(fid => ({
                                                    id: fid,
                                                    name: idToName.get(fid) || fid,
                                                    selectedSheet: driveFileMeta[fid]?.selectedSheet || null,
                                                    headerRow: driveFileMeta[fid]?.headerRow || null,
                                                    order: Number((driveOrderMap || {})[fid] ?? 0)
                                                })).sort((a,b)=>a.order-b.order);

                                                // Cập nhật state tạm cho UI
                                                setImportMoreDataConfig(prev => ({
                                                    ...prev,
                                                    googleDriveMultiFiles: true,
                                                    googleDriveFilesInfo: filesInfo,
                                                }));

                                                // Lưu vào step config và backend
                                                const firstStep = normalizedSteps.find(step => step.type === 12);
                                                if (firstStep) {
                                                    const updatedSteps = normalizedSteps.map(step =>
                                                        step.id === firstStep.id
                                                            ? {
                                                                ...step,
                                                                config: {
                                                                    ...step.config,
                                                                    googleDriveMultiFiles: true,
                                                                    googleDriveFilesInfo: filesInfo,
                                                                    googleDriveFolderUrl: importMoreDataConfig?.googleDriveFolderUrl || step.config?.googleDriveFolderUrl || '',
                                                                    // googleDriveFilesMeta: driveFileMeta,
                                                
                                                                },
                                                                needUpdate: true,
                                                            }
                                                            : step,
                                                    );
                                                    onChange(updatedSteps);
                                                    const updatedTemplateData = { ...templateData, steps: updatedSteps };
                                                    await updateTemplateTable(updatedTemplateData);
                                                }

                                                setIsDriveFileModalVisible(false);
                                                message.success('Đã lưu cấu hình file đã chọn. Bạn có thể bấm Lấy dữ liệu ngay để nhập.');
                                            } finally {
                                                setDriveLoading(false);
                                            }
                                        }}
                                    >
                                        Xác nhận
                                    </Button>
                                ]}
                                width={800}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Checkbox.Group
                                        value={selectedDriveFileIds}
                                        onChange={async (ids) => {
                                            setSelectedDriveFileIds(ids);
                                            setDriveOrderMap(prev => {
                                                const copy = { ...prev };
                                                ids.forEach((id, idx) => { if (copy[id] === undefined || copy[id] === null) copy[id] = idx + 1; });
                                                Object.keys(copy).forEach(k => { if (!ids.includes(k)) delete copy[k]; });
                                                return copy;
                                            });
                                            const newlyAdded = ids.filter(id => !driveFileMeta[id]);
                                            if (newlyAdded.length > 0) {
                                                setDriveLoading(true);
                                                try {
                                                    const updates = {};
                                                    for (const fileId of newlyAdded) {
                                                        try {
                                                            const res = await n8nWebhookGoogleDrive({ googleDriveUrl: fileId });
                                                            const sheetNames = res?.sheetNames || Object.keys(res?.sheets || {});
                                                            const list = Array.isArray(sheetNames)
                                                                ? sheetNames.map(x => (typeof x === 'string' ? x : (x?.name || x?.title || String(x))))
                                                                : [];
                                                            const savedInfo = (importMoreDataConfig?.googleDriveFilesInfo || []).find(x => x.id === fileId) || {};
                                                            updates[fileId] = {
                                                                sheetNames: list,
                                                                selectedSheet: savedInfo.selectedSheet ?? null,
                                                                headerRow: (Number(savedInfo.headerRow) || 1),
                                                                sheetPreview: {}
                                                            };
                                                        } catch (_) {
                                                            const savedInfo = (importMoreDataConfig?.googleDriveFilesInfo || []).find(x => x.id === fileId) || {};
                                                            updates[fileId] = {
                                                                sheetNames: [],
                                                                selectedSheet: savedInfo.selectedSheet ?? null,
                                                                headerRow: (Number(savedInfo.headerRow) || 1),
                                                                sheetPreview: {}
                                                            };
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
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                                                            {item.name}
                                                        </span>
                                                    </label>
                                                    {selectedDriveFileIds.includes(item.id) && (
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
                                                            <InputNumber
                                                                min={1}
                                                                value={driveOrderMap[item.id] || undefined}
                                                                onChange={(val) => setDriveOrderMap(prev => ({ ...prev, [item.id]: Number(val || 1) }))}
                                                                style={{ width: 70 }}
                                                                placeholder="#"
                                                            />
                                                            <Select
                                                                style={{ minWidth: 180 }}
                                                                placeholder="Chọn sheet"
                                                                value={driveFileMeta[item.id]?.selectedSheet || undefined}
                                                                onChange={async (val) => {
                                                                    setDriveFileMeta(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), selectedSheet: val } }));
                                                                    try {
                                                                        setDriveLoading(true);
                                                                        const metaRes = await n8nWebhookGoogleDrive({ googleDriveUrl: item.id });
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
                                                                onChange={(val) => setDriveFileMeta(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), headerRow: val } }))}
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
                                </Space>
                            </Modal>
                        </>
                    ) : importMoreDataConfig.isPostgresSource ? (
                        <>
                            {/* UI cho PostgreSQL */}
                            <Card title="Cấu hình PostgreSQL" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <strong>Thông tin kết nối:</strong>
                                        <div style={{
                                            marginTop: 4,
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                        }}>
                                            <div><strong>Host:</strong> {importMoreDataConfig.postgresConfig?.host}
                                            </div>
                                            <div><strong>Port:</strong> {importMoreDataConfig.postgresConfig?.port}
                                            </div>
                                            <div>
                                                <strong>Database:</strong> {importMoreDataConfig.postgresConfig?.database}
                                            </div>
                                            <div><strong>Schema:</strong> {importMoreDataConfig.postgresConfig?.schema}
                                            </div>
                                            <div><strong>Table:</strong> {importMoreDataConfig.postgresConfig?.table}
                                            </div>
                                        </div>
                                    </div>

                                    {importMoreDataConfig.lastUpdate && (
                                        <div>
                                            <strong>Lần cập nhật cuối:</strong>
                                            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                                                {new Date(importMoreDataConfig.lastUpdate).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                    )}
                                </Space>
                            </Card>

                            <Card title="Cấu hình tự động cập nhật" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 4 }}>Thời gian tự động cập
                                            nhật:</label>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                                            Chọn khoảng thời gian để tự động lấy dữ liệu mới từ PostgreSQL (Chỉ hoạt động khi bật chế độ Autorun)
                                        </div>
                                        <Select
                                            style={{ width: '100%' }}
                                            value={importMoreDataConfig.intervalUpdate}
                                            onChange={(value) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                intervalUpdate: value,
                                            }))}
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

                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        ⚠️ Khi bấm "Lấy dữ liệu ngay", hệ thống sẽ xóa toàn bộ dữ liệu cũ và thay thế
                                        bằng dữ liệu mới từ PostgreSQL.
                                    </div>
                                </Space>
                            </Card>
                        </>
                    ) : importMoreDataConfig.isApiSource ? (
                        <>
                            {/* UI cho API */}
                            <Card title="Cấu hình API" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <strong>URL API:</strong>
                                        <div style={{
                                            marginTop: 4,
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 4,
                                            fontSize: '12px',
                                        }}>
                                            {importMoreDataConfig.apiUrl}
                                        </div>
                                    </div>

                                    {importMoreDataConfig.lastUpdate && (
                                        <div>
                                            <strong>Lần cập nhật cuối:</strong>
                                            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                                                {new Date(importMoreDataConfig.lastUpdate).toLocaleString('vi-VN')}
                                            </div>
                                        </div>
                                    )}
                                </Space>
                            </Card>

                            <Card title="Cấu hình tự động cập nhật" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 4 }}>Thời gian tự động cập
                                            nhật:</label>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                                            Chọn khoảng thời gian để tự động lấy dữ liệu mới từ API (Chỉ hoạt động khi bật chế độ Autorun)
                                        </div>
                                        <Select
                                            style={{ width: '100%' }}
                                            value={importMoreDataConfig.intervalUpdate}
                                            onChange={(value) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                intervalUpdate: value,
                                            }))}
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

                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        ⚠️ Khi bấm "Lấy dữ liệu ngay", hệ thống sẽ xóa toàn bộ dữ liệu cũ và thay thế
                                        bằng dữ liệu mới từ API.
                                    </div>
                                </Space>
                            </Card>
                        </>
                    ) : (
                        <>
                            {/* UI cho import thông thường */}
                            <Card title="Thông tin dữ liệu gốc" size="small">
                                <div>
                                    <strong>Các cột hiện có:</strong> {originalDataColumns.filter(col => col !== 'key').join(', ')}
                                </div>
                                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                                    ⚠️ File import mới phải có các cột tương tự để đảm bảo tính nhất quán (cột "key" sẽ
                                    được bỏ qua)
                                </div>
                            </Card>

                            <Card title="" size="small">
                                {/* <Radio.Group
                                    value={importMoreDataConfig.uploadType}
                                    onChange={(e) => setImportMoreDataConfig(prev => ({
                                        ...prev,
                                        uploadType: e.target.value,
                                    }))}
                                >
                                    <Radio value="excel">Upload file Excel</Radio>
                                    <Radio value="googleSheets">Google Sheets</Radio>
                                    <Radio value="googleDrive">Google Drive</Radio>
                                </Radio.Group> */}

                                {importMoreDataConfig.uploadType === 'excel' && (
                                    <div style={{ marginTop: 16 }}>
                                        {importedMoreData.length === 0 ? (
                                            <Dragger
                                                accept=".xls,.xlsx"
                                                beforeUpload={handleImportMoreFileUpload}
                                                showUploadList={false}
                                                disabled={importMoreLoading}
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
                                                    ✓ Đã tải {importedMoreData.length} dòng dữ liệu
                                                    với {importedMoreColumns.length} cột
                                                    <Button
                                                        type="default"
                                                        size="small"
                                                        icon={<UploadOutlined />}
                                                        onClick={() => {
                                                            // Reset lại file và dữ liệu liên quan
                                                            setImportedMoreData([]);
                                                            setImportedMoreColumns([]);
                                                            setImportMoreProgress(0);
                                                            setImportMoreLoading(false);
                                                            setImportMoreDataConfig(prev => ({ ...prev, file: null }));
                                                        }}
                                                    >
                                                        Chọn file khác
                                                    </Button>
                                                </div>
                                                <Table
                                                    columns={importedMoreColumns.filter(col => col.title !== 'key')} // Bỏ qua cột key trong hiển thị
                                                    dataSource={importedMoreData.slice(0, 5)}
                                                    pagination={false}
                                                    size="small"
                                                    scroll={{ x: true }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {importMoreDataConfig.uploadType === 'googleSheets' && (
                                    <div style={{ marginTop: 16 }}>
                                        <Input
                                            placeholder="Nhập URL Google Sheets"
                                            value={importMoreDataConfig.googleSheetUrl}
                                            onChange={(e) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                googleSheetUrl: e.target.value,
                                            }))}
                                        />
                                        <Button
                                            type="primary"
                                            style={{ marginTop: 8 }}
                                            onClick={() => {
                                                // TODO: Implement Google Sheets import
                                                message.info('Tính năng Google Sheets sẽ được phát triển sau');
                                            }}
                                        >
                                            Lấy dữ liệu từ Google Sheets
                                        </Button>
                                    </div>
                                )}

                                {importMoreDataConfig.uploadType === 'googleDrive' && (
                                    <div style={{ marginTop: 16 }}>
                                        <Input
                                            placeholder="Nhập URL Google Drive"
                                            value={importMoreDataConfig.googleDriveUrl}
                                            onChange={(e) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                googleDriveUrl: e.target.value,
                                            }))}
                                        />
                                        <Button
                                            type="primary"
                                            style={{ marginTop: 8 }}
                                            onClick={() => {
                                                // TODO: Implement Google Drive import
                                                message.info('Tính năng Google Drive sẽ được phát triển sau');
                                            }}
                                        >
                                            Lấy dữ liệu từ Google Drive
                                        </Button>
                                    </div>
                                )}
                            </Card>

                            {/* Cấu hình import */}
                            <Card title="Cấu hình import" size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div>
                                        <strong>Chế độ import:</strong>
                                        <Radio.Group
                                            value={importMoreDataConfig.importMode}
                                            onChange={(e) => setImportMoreDataConfig(prev => ({
                                                ...prev,
                                                importMode: e.target.value,
                                            }))}
                                            style={{ marginLeft: 16 }}
                                        >
                                            <Radio value="add_new">Thêm mới</Radio>
                                            {/* <Radio value="replace_all">Thay thế toàn bộ</Radio> */}
                                        </Radio.Group>
                                    </div>

                                    {importMoreDataConfig.importMode === 'add_new' && (
                                        <div>
                                            <Checkbox
                                                checked={importMoreDataConfig.duplicateCheck}
                                                onChange={(e) => setImportMoreDataConfig(prev => ({
                                                    ...prev,
                                                    duplicateCheck: e.target.checked,
                                                    duplicateKeys: e.target.checked ? prev.duplicateKeys : [],
                                                }))}
                                            >
                                                Kiểm tra trùng lặp
                                            </Checkbox>

                                            {importMoreDataConfig.duplicateCheck && (
                                                <div style={{ marginTop: 16, marginLeft: 24 }}>
                                                    <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                                                        <strong>Chọn cột làm key để kiểm tra trùng lặp:</strong>

                                                        {importedMoreColumns && importedMoreColumns.filter(col => col.title !== 'key').length > 0 && (
                                                        <div style={{ marginBottom: 8 }}>
                                                            <Button
                                                                size="small"
                                                                onClick={() => {
                                                                    const allKeys = importedMoreColumns
                                                                        .filter(col => col.title !== 'key')
                                                                        .map(col => col.title);
                                                                    setImportMoreDataConfig(prev => ({
                                                                        ...prev,
                                                                        duplicateKeys: allKeys,
                                                                    }));
                                                                }}
                                                            >
                                                                Chọn tất cả
                                                            </Button>
                                                    </div>
                                                    )}
                                                    </div>
                                                   
                                                    <Select
                                                        mode="multiple"
                                                        placeholder="Chọn các cột"
                                                        value={importMoreDataConfig.duplicateKeys}
                                                        onChange={(value) => setImportMoreDataConfig(prev => ({
                                                            ...prev,
                                                            duplicateKeys: value,
                                                        }))}
                                                        style={{ width: '100%' }}
                                                        options={importedMoreColumns
                                                            .filter(col => col.title !== 'key') // Bỏ qua cột key
                                                            .map(col => ({
                                                                label: col.title,
                                                                value: col.title,
                                                            }))}
                                                    />

                                                    <div style={{ marginTop: 16 }}>
                                                        <strong>Hành động khi phát hiện trùng lặp:</strong>
                                                        <Radio.Group
                                                            value={importMoreDataConfig.duplicateAction}
                                                            onChange={(e) => setImportMoreDataConfig(prev => ({
                                                                ...prev,
                                                                duplicateAction: e.target.value,
                                                            }))}
                                                            style={{ marginLeft: 16 }}
                                                        >
                                                            <Radio value="skip">Bỏ qua dữ liệu trùng lặp</Radio>
                                                            <Radio value="replace">Thay thế dữ liệu bị trùng lặp</Radio>
                                                        </Radio.Group>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {importMoreDataConfig.importMode === 'replace_all' && (
                                        <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                                            ⚠️ Cảnh báo: Thay thế toàn bộ sẽ xóa hết dữ liệu cũ và thay thế bằng dữ liệu
                                            mới!
                                        </div>
                                    )}
                                </Space>
                            </Card>
                        </>
                    )}
                </Space>
            </Modal>

            {/* Modal: Chọn Sheet và Hàng tiêu đề cho Import thêm dữ liệu (Excel) */}
            <Modal
                open={isImportMoreExcelModalVisible}
                title="Chọn Sheet và Hàng tiêu đề"
                onCancel={() => {
                    setIsImportMoreExcelModalVisible(false);
                    setImportMoreLoading(false);
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setIsImportMoreExcelModalVisible(false);
                        setImportMoreLoading(false);
                    }}>
                        Hủy
                    </Button>,
                    <Button key="ok" type="primary" onClick={handleImportMoreExcelModalOk}>
                        OK
                    </Button>,
                ]}
                width={600}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Chọn Sheet:</label>
                        <Select
                            style={{ width: '100%' }}
                            options={importMoreExcelSheets}
                            value={importMoreSelectedSheet}
                            onChange={handleImportMoreExcelSheetSelect}
                            placeholder="Chọn sheet"
                        />
                        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                            File có {importMoreExcelSheets.length} sheet(s) khả dụng
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Chọn hàng làm tiêu đề cột:</label>
                        <Select
                            style={{ width: '100%' }}
                            options={importMoreExcelHeaderOptions}
                            value={importMoreSelectedHeaderRow}
                            onChange={handleImportMoreExcelHeaderRowSelect}
                            placeholder="Chọn hàng tiêu đề"
                        />
                        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                            Dữ liệu sẽ được lấy từ các hàng sau hàng tiêu đề được chọn
                        </div>
                    </div>
                </Space>
            </Modal>

            {/* Modal chọn điều kiện lọc cho AI Transformer */}
            <AiTransformerRunModal
                modal={aiTransformerRunModal}
                onClose={() => setAiTransformerRunModal(prev => ({ ...prev, visible: false }))}
                onRun={runAiTransformerWithFilter}
                availableColumns={availableColumns}
            />

        </div>
    );
};



// Component cho modal chọn điều kiện lọc AI Transformer
const AiTransformerRunModal = ({ modal, onClose, onRun, availableColumns }) => {
    // Load từ _runOptions của step nếu có
    const savedRunOptions = modal.step?._runOptions || {};
    
    const [runMode, setRunMode] = useState(savedRunOptions.runMode || 'full');
    const [filterConditions, setFilterConditions] = useState(savedRunOptions.filterConditions || []);
    const [filterMode, setFilterMode] = useState(savedRunOptions.filterMode || 'include');
    // Empty-only specific options
    const [emptyEnableFilter, setEmptyEnableFilter] = useState(savedRunOptions.emptyEnableFilter || false);
    const [emptyFilterConditions, setEmptyFilterConditions] = useState(savedRunOptions.emptyFilterConditions || []);
    const [emptyFilterMode, setEmptyFilterMode] = useState(savedRunOptions.emptyFilterMode || 'include');
    const [includeChangesInEmptyMode, setIncludeChangesInEmptyMode] = useState(savedRunOptions.includeChangesInEmptyMode !== undefined ? savedRunOptions.includeChangesInEmptyMode : true);

    // Force update state khi modal mở với step mới
    useEffect(() => {
        if (modal.visible && modal.step?._runOptions) {
            const options = modal.step._runOptions;
            console.log('🔍 [DEBUG] AiTransformerRunModal - Force updating state with:', options);
            
            setRunMode(options.runMode || 'full');
            setFilterConditions(options.filterConditions || []);
            setFilterMode(options.filterMode || 'include');
            setEmptyEnableFilter(options.emptyEnableFilter || false);
            setEmptyFilterConditions(options.emptyFilterConditions || []);
            setEmptyFilterMode(options.emptyFilterMode || 'include');
            setIncludeChangesInEmptyMode(options.includeChangesInEmptyMode !== undefined ? options.includeChangesInEmptyMode : true);
        }
    }, [modal.visible, modal.step?._runOptions]);

    const columnOptions = availableColumns.map(col => ({
        label: col,
        value: col
    }));

    const handleAddCondition = () => {
        setFilterConditions([...filterConditions, {
            column: '',
            operator: '==',
            value: '',
            logic: 'AND'
        }]);
    };

    const handleAddEmptyCondition = () => {
        setEmptyFilterConditions([...emptyFilterConditions, {
            column: '',
            operator: '==',
            value: '',
            logic: 'AND'
        }]);
    };

    const handleRemoveCondition = (index) => {
        setFilterConditions(filterConditions.filter((_, i) => i !== index));
    };

    const handleRemoveEmptyCondition = (index) => {
        setEmptyFilterConditions(emptyFilterConditions.filter((_, i) => i !== index));
    };

    const handleUpdateCondition = (index, field, value) => {
        const newConditions = [...filterConditions];
        newConditions[index][field] = value;
        setFilterConditions(newConditions);
    };

    const handleUpdateEmptyCondition = (index, field, value) => {
        const newConditions = [...emptyFilterConditions];
        newConditions[index][field] = value;
        setEmptyFilterConditions(newConditions);
    };

    const handleRun = () => {
        onRun({
            stepIndex: modal.stepIndex,
            runMode,
            filterConditions: runMode === 'filtered' ? filterConditions : [],
            filterMode,
            // empty-only options
            emptyEnableFilter: runMode === 'empty_only' ? emptyEnableFilter : false,
            emptyFilterConditions: runMode === 'empty_only' ? emptyFilterConditions : [],
            emptyFilterMode: runMode === 'empty_only' ? emptyFilterMode : 'include',
            includeChangesInEmptyMode: runMode === 'empty_only' ? includeChangesInEmptyMode : undefined,
        });
        onClose();
    };

    return (
        <Modal
            title={`Chọn cách chạy AI Transformer - Step ${modal.step?.id}`}
            open={modal.visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Hủy
                </Button>,
                <Button key="run" type="primary" onClick={handleRun}>
                    Chạy
                </Button>
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Chọn chế độ chạy */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Chế độ chạy
                    </label>
                    <Radio.Group value={runMode} onChange={(e) => setRunMode(e.target.value)}>
                        <Space direction="vertical">
                            <Radio value="full">
                                <div>
                                    <strong>Chạy toàn bộ dữ liệu</strong>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        Xử lý tất cả dữ liệu với AI (có thể tốn nhiều token)
                                    </div>
                                </div>
                            </Radio>
                            <Radio value="filtered">
                                <div>
                                    <strong>Chạy theo điều kiện lọc</strong>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        Chỉ xử lý dữ liệu thỏa mãn điều kiện (tiết kiệm token)
                                    </div>
                                </div>
                            </Radio>
                            <Radio value="empty_only">
                                        <div>
                                            <strong>Chạy nốt dòng còn trống</strong>
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                Chỉ xử lý các dòng mà cột kết quả còn trống + tự động phát hiện dữ liệu mới/thay đổi
                                            </div>
                                        </div>
                                    </Radio>
                        </Space>
                    </Radio.Group>
                </div>

                {/* Điều kiện lọc - chỉ hiển thị khi chọn "filtered" */}
                {runMode === 'filtered' && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Điều kiện lọc
                        </label>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                            <InfoCircleOutlined /> Chỉ dữ liệu thỏa mãn điều kiện sẽ được gửi cho AI xử lý
                        </div>
                        
                        {/* Chế độ lọc */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Chế độ lọc
                            </label>
                            <Select
                                value={filterMode}
                                onChange={setFilterMode}
                                style={{ width: '100%' }}
                            >
                                <Option value="include">Chỉ xử lý dữ liệu thỏa mãn điều kiện</Option>
                                <Option value="exclude">Bỏ qua dữ liệu thỏa mãn điều kiện</Option>
                            </Select>
                        </div>

                        {/* Danh sách điều kiện lọc */}
                        <div style={{ marginBottom: '8px' }}>
                            {filterConditions.map((condition, index) => (
                                <div key={index} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    marginBottom: '8px',
                                    padding: '8px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '4px',
                                    backgroundColor: '#fafafa'
                                }}>
                                    {/* Logic operator (AND/OR) - chỉ hiển thị từ điều kiện thứ 2 */}
                                    {index > 0 && (
                                        <Select
                                            value={condition.logic || 'AND'}
                                            onChange={(value) => handleUpdateCondition(index, 'logic', value)}
                                            style={{ width: '80px' }}
                                        >
                                            <Option value="AND">AND</Option>
                                            <Option value="OR">OR</Option>
                                        </Select>
                                    )}
                                    
                                    {/* Chọn cột */}
                                    <Select
                                        placeholder="Chọn cột"
                                        value={condition.column}
                                        onChange={(value) => handleUpdateCondition(index, 'column', value)}
                                        style={{ width: '150px' }}
                                        options={columnOptions}
                                    />
                                    
                                    {/* Chọn toán tử */}
                                    <Select
                                        placeholder="Toán tử"
                                        value={condition.operator}
                                        onChange={(value) => handleUpdateCondition(index, 'operator', value)}
                                        style={{ width: '200px' }}
                                    >
                                        <Option value="==">Bằng (==)</Option>
                                        <Option value="!=">Khác (!=)</Option>
                                        <Option value=">">Lớn hơn (&gt;)</Option>
                                        <Option value="<">Nhỏ hơn (&lt;)</Option>
                                        <Option value=">=">Lớn hơn hoặc bằng (&gt;=)</Option>
                                        <Option value="<=">Nhỏ hơn hoặc bằng (&lt;=)</Option>
                                        <Option value="contains">Chứa</Option>
                                        <Option value="not_contains">Không chứa</Option>
                                        <Option value="is_empty">Trống</Option>
                                        <Option value="is_not_empty">Không trống</Option>
                                    </Select>
                                    
                                    {/* Nhập giá trị - ẩn nếu là is_empty hoặc is_not_empty */}
                                    {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                                        <Input
                                            placeholder="Giá trị"
                                            value={condition.value}
                                            onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                                            style={{ width: '120px' }}
                                        />
                                    )}
                                    
                                    {/* Nút xóa điều kiện */}
                                    <Button
                                        type="text"
                                        danger
                                        onClick={() => handleRemoveCondition(index)}
                                        style={{ minWidth: '32px' }}
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                        </div>
                        
                        {/* Nút thêm điều kiện */}
                        <Button
                            type="dashed"
                            onClick={handleAddCondition}
                            style={{ width: '100%' }}
                        >
                            + Thêm điều kiện lọc
                        </Button>
                    </div>
                )}

                {/* Điều kiện lọc trong chế độ dòng trống */}
                {runMode === 'empty_only' && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Lọc trong các dòng trống
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <Switch checked={emptyEnableFilter} onChange={setEmptyEnableFilter} />
                            <span style={{ fontSize: 12, color: '#666' }}>Bật lọc để chỉ xử lý các dòng trống thỏa điều kiện</span>
                        </div>

                        {emptyEnableFilter && (
                            <div style={{ marginLeft: 0 }}>
                                {/* Chế độ lọc */}
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                        Chế độ lọc
                                    </label>
                                    <Select
                                        value={emptyFilterMode}
                                        onChange={setEmptyFilterMode}
                                        style={{ width: '100%' }}
                                    >
                                        <Option value="include">Chỉ xử lý dữ liệu thỏa mãn điều kiện</Option>
                                        <Option value="exclude">Bỏ qua dữ liệu thỏa mãn điều kiện</Option>
                                    </Select>
                                </div>

                                {/* Danh sách điều kiện lọc */}
                                <div style={{ marginBottom: '8px' }}>
                                    {emptyFilterConditions.map((condition, index) => (
                                        <div key={index} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px', 
                                            marginBottom: '8px',
                                            padding: '8px',
                                            border: '1px solid #d9d9d9',
                                            borderRadius: '4px',
                                            backgroundColor: '#fafafa'
                                        }}>
                                            {index > 0 && (
                                                <Select
                                                    value={condition.logic || 'AND'}
                                                    onChange={(value) => handleUpdateEmptyCondition(index, 'logic', value)}
                                                    style={{ width: '80px' }}
                                                >
                                                    <Option value="AND">AND</Option>
                                                    <Option value="OR">OR</Option>
                                                </Select>
                                            )}
                                            <Select
                                                placeholder="Chọn cột"
                                                value={condition.column}
                                                onChange={(value) => handleUpdateEmptyCondition(index, 'column', value)}
                                                style={{ width: '200px' }}
                                                options={columnOptions}
                                            />
                                            <Select
                                                placeholder="Toán tử"
                                                value={condition.operator}
                                                onChange={(value) => handleUpdateEmptyCondition(index, 'operator', value)}
                                                style={{ width: '200px' }}
                                            >
                                                <Option value="==">Bằng (==)</Option>
                                                <Option value="!=">Khác (!=)</Option>
                                                <Option value=">">Lớn hơn (&gt;)</Option>
                                                <Option value="<">Nhỏ hơn (&lt;)</Option>
                                                <Option value=">=">Lớn hơn hoặc bằng (&gt;=)</Option>
                                                <Option value="<=">Nhỏ hơn hoặc bằng (&lt;=)</Option>
                                                <Option value="contains">Chứa</Option>
                                                <Option value="not_contains">Không chứa</Option>
                                                <Option value="is_empty">Trống</Option>
                                                <Option value="is_not_empty">Không trống</Option>
                                            </Select>
                                            {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                                                <Input
                                                    placeholder="Giá trị"
                                                    value={condition.value}
                                                    onChange={(e) => handleUpdateEmptyCondition(index, 'value', e.target.value)}
                                                    style={{ width: '120px' }}
                                                />
                                            )}
                                            <Button type="text" danger onClick={() => handleRemoveEmptyCondition(index)} style={{ minWidth: '32px' }}>
                                                ×
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <Button type="dashed" onClick={handleAddEmptyCondition} style={{ width: '100%' }}>
                                    + Thêm điều kiện lọc
                                </Button>
                            </div>
                        )}

                        {/* Bao gồm dòng mới/thay đổi */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                            <Switch checked={includeChangesInEmptyMode} onChange={setIncludeChangesInEmptyMode} />
                            <span style={{ fontSize: 12, color: '#666' }}>Bao gồm dòng mới/thay đổi so với bước trước</span>
                        </div>
                    </div>
                )}

                {/* Thông tin về step */}
                <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>
                    <div><strong>Job Type:</strong> {modal.step?.config?.jobType || 'Chưa chọn'}</div>
                    <div><strong>Cột điều kiện:</strong> {modal.step?.config?.conditionColumns?.join(', ') || 'Chưa chọn'}</div>
                    <div><strong>Cột kết quả:</strong> {modal.step?.config?.resultColumn || 'Chưa nhập'}</div>
                </div>
            </Space>
        </Modal>
    );
};

export default PipelineSteps;