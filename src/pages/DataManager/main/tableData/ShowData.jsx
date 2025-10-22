import React, { useEffect, useState, useMemo, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MyContext } from '../../../../MyContext.jsx';
import { AgGridReact } from 'ag-grid-react';
import AG_GRID_LOCALE_VN from '../../../Home/AgridTable/locale';
import { getTemplateByFileNoteId, getTemplateColumn, getTemplateRow, updateTemplateColumnWidth, updateColumnIndexes, updateTemplateTable, getTemplateInfoByTableId, batchRunAllSteps, clearTestData, resetTemplateFlow, deleteTemplateRowByTableId, createBathTemplateRow } from '../../../../apis/templateSettingService.jsx';
import { getFileNotePadByIdController, getAllFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import { getAllTemplateSheetTable } from '../../../../apis/templateSettingService.jsx';
import { buildColumn, buildColumnDef } from '../../../Canvas/Daas/Content/Template/TemplateLogic/buildColumnDef.jsx';
import { Button, Input, Breadcrumb, Select, Pagination, Spin, Switch, message, Tooltip, Tag, Modal } from 'antd';
import { SearchOutlined, HomeOutlined, DownloadOutlined, InfoCircleOutlined, RedoOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import PipelineSteps from './PipelineSteps';
import Loading3DTower from '../../../../components/Loading3DTower.jsx';
import { createAutoRun, getAutoRunByTableId, deleteAutoRun, getAutoRunById } from '../../../../apis/autorunService.jsx';
import { exportStepDataToExcel, getStepExportPreview } from '../../../../apis/stepExportService.jsx';
import { postgresService } from '../../../../apis/postgresService.jsx';
import { n8nWebhook, n8nWebhookGoogleDrive } from '../../../../apis/n8nWebhook.jsx';
import { getFrequencyConfigByTableId, deleteFrequencyConfig } from '../../../../apis/frequencyConfigService.jsx';
import { FaRegArrowAltCircleLeft, FaRegArrowAltCircleRight } from "react-icons/fa"
// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Import custom dark theme override
import './ag-grid-dark-override.css';

// Import CSS module
import css from './ShowData.module.css';
// Import stepTypeName từ PipelineSteps
const stepTypeName = {
    1: 'Bỏ trùng lặp',
    2: 'Điền giá trị thiếu',
    3: 'Phát hiện ngoại lệ',
    4: 'Lookup', // 11
    22: 'Lookup nâng cao', // Lookup nhiều điều kiện
    5: 'Thêm cột tính toán',
    // 6: 'Add Column',
    8: 'Điền có điều kiện', //6
    7: 'Validation & Mapping', //7
    9: 'Lọc dữ liệu', //8
    10: 'Aggregate',
    // 11: 'Code-based New column',
    12: 'Tạo mới',
    13: 'Text-to-column',
    14: 'Date Converter',
    15: 'AI Audit',
    16: 'Lọc bỏ cột',
    17: 'Xoay bảng',
    18: 'Nối bảng',
    19: 'Value to time',
    20: 'Thao tác ngày tháng',
    21: 'AI Transformer',
    23: 'Xoay bảng từ hàng thành cột',
    25: 'Chuyển đổi kiểu dữ liệu',
    27: 'Nối giá trị các cột',
    29: 'Thêm giá trị',
    32: 'Week Number',
    34: 'Xử lý cơ bản',
};

const ShowData = ({ idFileNote, stepId }) => {
    const theme = localStorage.getItem('theme') || 'light';
    const {
        runningStep, setRunningStep,
        setCurrentFileNoteId,
        runningFileNotes, setRunningFileNotes,
        fileNoteQueue,
        isProcessingQueue,
        currentRunningFileNote,
        currentSchemaPathRecord
    } = useContext(MyContext);
    const [template, setTemplate] = useState(null);
    const [templateColumns, setTemplateColumns] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isStatusFilter, setIsStatusFilter] = useState(true);
    const [duplicateHighlightColumns, setDuplicateHighlightColumns] = useState([]);
    const [steps, setSteps] = useState([]);
    const [selectedStepId, setSelectedStepId] = useState(null); // ID của step được chọn để xem dữ liệu
    const [inputColumns, setInputColumns] = useState([]); // Columns từ bước trước đó cho config
    const [searchQuery, setSearchQuery] = useState('');
    // 1. Thêm state gridApi
    const [gridApi, setGridApi] = useState(null);
    const [fileNote, setFileNote] = useState(null); // Thêm state để lưu thông tin filenote
    const [listApprovedVersion, setListApprovedVersion] = useState([]); // Thêm state để lưu danh sách approved version
    const [availableTables, setAvailableTables] = useState([]); // State để lưu danh sách bảng có thể nối
    const [showModifiedColumns, setShowModifiedColumns] = useState(true); // State để bật/tắt highlight cột đã thao tác
    const [hasNewDataUpdate, setHasNewDataUpdate] = useState(false); // State để theo dõi có cập nhật dữ liệu mới

    // State cho modal reset luồng
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');

    // Function để xử lý reset luồng
    const handleResetFlow = async () => {
        try {
            if (!template?.id) {
                message.error('Không tìm thấy template ID');
                return;
            }
            message.loading('Đang reset luồng dữ liệu...', 0);

            // Xóa frequency config nếu có trước khi reset luồng
            try {
                const existingConfig = await getFrequencyConfigByTableId({
                    tableId: template.id,
                    schema: currentSchemaPathRecord?.path
                });
                if (existingConfig?.data?.data) {
                    await deleteFrequencyConfig(existingConfig.data.data.id);
                }
            } catch (error) {
                console.warn('Error deleting frequency config before reset (bỏ qua):', error);
                // Không chặn luồng chính nếu có lỗi với frequency config
            }

            await resetTemplateFlow(template.id);
            message.destroy();
            message.success('Reset luồng thành công!');
            fetchData();
            // Reload dữ liệu sau khi reset
            // window.location.reload();
        } catch (error) {
            message.destroy();
            message.error('Có lỗi xảy ra khi reset luồng: ' + (error.response?.data?.message || error.message));
            console.error('Reset luồng error:', error);
        }
    };

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5000);
    const [totalRows, setTotalRows] = useState(0);
    const [totalColumns, setTotalColumns] = useState(0);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [autorun, setAutorun] = useState(false); // State để điều khiển autorun
    const [isErrorFilterActive, setIsErrorFilterActive] = useState(false); // State để kiểm tra có đang filter lỗi không
    const [stepsWithErrors, setStepsWithErrors] = useState(new Set()); // State để lưu trữ các step có lỗi
    const loadingTimeoutRef = useRef(null);
    const [loadingRunningStep, setLoadingRunningStep] = useState(false);
    const [isTestMode, setIsTestMode] = useState(false); // State để kiểm tra có đang ở chế độ test không
    const [isBatchRunning, setIsBatchRunning] = useState(false); // State để kiểm tra có đang chạy batch không
    const [hasLargeDataset, setHasLargeDataset] = useState(false); // State để kiểm tra có dataset lớn không
    const [isExporting, setIsExporting] = useState(false); // State để kiểm tra có đang export không
    // Version strip scroll controls
    const versionStripRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    // Filter logic giống Template.jsx
    function filter() {
        if (isStatusFilter) {
            return {
                filter: 'agMultiColumnFilter',
                floatingFilter: true,
                filterParams: {
                    filters: [
                        {
                            filter: 'agTextColumnFilter',
                        },
                        {
                            filter: 'agSetColumnFilter',
                            filterParams: {
                                convertValuesToStrings: true,
                            },
                        },
                    ],
                },
            };
        }
        return {};
    }
    useEffect(() => {
        // Chỉ hiển thị loading khi step/batch đang chạy thuộc đúng filenote đang mở
        const isRunningForThisFile = (
            !!runningStep || !!isBatchRunning
        ) && (
                (runningFileNotes && runningFileNotes.has && runningFileNotes.has(String(idFileNote))) ||
                (currentRunningFileNote && String(currentRunningFileNote.fileNoteId) === String(idFileNote))
            );
        setLoadingRunningStep(!!isRunningForThisFile);
    }, [runningStep, isBatchRunning, runningFileNotes, currentRunningFileNote, idFileNote]);

    // Set current file note ID when component mounts
    useEffect(() => {
        if (idFileNote) {
            setCurrentFileNoteId(idFileNote);
        }
    }, [idFileNote, setCurrentFileNoteId]);

    // Force apply dark theme styles to AG Grid
    useEffect(() => {
        if (theme == 'dark' && gridApi) {
            const applyDarkTheme = () => {
                const gridElement = document.querySelector('.ag-theme-quartz-dark');
                if (gridElement) {
                    // Force apply styles to all cells and headers
                    const cells = gridElement.querySelectorAll('.ag-cell, .ag-header-cell');
                    cells.forEach(cell => {
                        cell.style.color = '#ffffff';
                        cell.style.setProperty('color', '#ffffff', 'important');
                    });

                    // Force apply to cell values
                    const cellValues = gridElement.querySelectorAll('.ag-cell-value, .ag-header-cell-text');
                    cellValues.forEach(cellValue => {
                        cellValue.style.color = '#ffffff';
                        cellValue.style.setProperty('color', '#ffffff', 'important');
                    });
                }
            };

            // Apply immediately
            applyDarkTheme();

            // Apply after a short delay to ensure grid is rendered
            setTimeout(applyDarkTheme, 100);

            // Apply after grid updates
            setTimeout(applyDarkTheme, 500);
        }
    }, [theme, gridApi]);

    // Cập nhật trạng thái nút cuộn trái/phải
    useEffect(() => {
        const el = versionStripRef.current;
        if (!el) return;

        let rafId = null;

        const update = () => {
            const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
            const hasOverflow = maxScroll > 0;
            const left = el.scrollLeft;
            const epsilon = 1; // tolerance to handle fractional scroll positions
            const atStart = left <= epsilon;
            const atEnd = left >= maxScroll - epsilon;
            setCanScrollLeft(hasOverflow && !atStart);
            setCanScrollRight(hasOverflow && !atEnd);
        };

        const scheduleUpdate = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(update);
        };

        // Gọi sau khi DOM render để đo đúng scrollWidth
        scheduleUpdate();

        el.addEventListener('scroll', scheduleUpdate, { passive: true });
        el.addEventListener('wheel', scheduleUpdate, { passive: true });
        el.addEventListener('touchmove', scheduleUpdate, { passive: true });

        // Quan sát thay đổi kích thước container
        const ro = new ResizeObserver(scheduleUpdate);
        ro.observe(el);

        // Quan sát thay đổi children (số lượng nút phiên bản thay đổi)
        const mo = new MutationObserver(scheduleUpdate);
        mo.observe(el, { childList: true, subtree: true });

        return () => {
            el.removeEventListener('scroll', scheduleUpdate);
            el.removeEventListener('wheel', scheduleUpdate);
            el.removeEventListener('touchmove', scheduleUpdate);
            ro.disconnect();
            mo.disconnect();
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [steps, selectedStepId, idFileNote]);

    // Tự động cuộn tới step được chọn khi selectedStepId thay đổi

    const startLoading = useCallback(() => {
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
        }
        setLoading(true);
    }, []);

    const stopLoading = useCallback((delay = 1000) => {
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
        }
        loadingTimeoutRef.current = setTimeout(() => {
            setLoading(false);
            loadingTimeoutRef.current = null;
        }, delay);
    }, []);


    useEffect(() => {
        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
            // Cleanup gridApi reference
            if (gridApi && !gridApi.isDestroyed()) {
                setGridApi(null);
            }
        };
    }, []);

    const navigate = useNavigate();

    // Function để xác định các cột đã được thao tác trong step hiện tại
    const getModifiedColumns = useCallback((currentStepId) => {
        if (!currentStepId || !steps.length) return [];

        const currentStep = steps.find(step => step.id == currentStepId);
        if (!currentStep || !currentStep.config) return [];

        // Không highlight cho step 1
        if (currentStep.id == 1) {
            return [];
        }

        const modifiedColumns = [];
        const config = currentStep.config;

        switch (currentStep.type) {
            case 1: // Bỏ trùng lặp
                if (config.columns && Array.isArray(config.columns)) {
                    modifiedColumns.push(...config.columns);
                }
                break;

            case 2: // Điền giá trị thiếu
                if (config.column) {
                    modifiedColumns.push(config.column);
                }
                if (config.newColumn && config.columnName) {
                    modifiedColumns.push(config.columnName);
                }
                break;

            case 3: // Phát hiện ngoại lệ
                if (config.column) {
                    modifiedColumns.push(config.column);
                }
                if (config.newColumn && config.columnName) {
                    modifiedColumns.push(config.columnName);
                }
                break;

            case 4: // Lookup
                if (config.joinColumn) {
                    modifiedColumns.push(config.joinColumn);
                }
                if (config.newColumnName) {
                    modifiedColumns.push(config.newColumnName);
                }
                break;

            case 5: // Thêm cột tính toán
                if (config.newColumnName) {
                    modifiedColumns.push(config.newColumnName);
                }
                break;

            case 7: // Validation & Mapping
                if (config.targetColumn) {
                    modifiedColumns.push(config.targetColumn);
                }
                if (config.createNewColumn && config.newColumnName) {
                    modifiedColumns.push(config.newColumnName);
                }
                break;

            case 8: // Điền có điều kiện
                if (config.targetColumn) {
                    modifiedColumns.push(config.targetColumn);
                }
                break;

            case 9: // Lọc dữ liệu
                if (config.column) {
                    modifiedColumns.push(config.column);
                }
                break;

            case 10: // Aggregate
                if (config.groupByColumns && Array.isArray(config.groupByColumns)) {
                    modifiedColumns.push(...config.groupByColumns);
                }
                if (config.aggregateColumns && Array.isArray(config.aggregateColumns)) {
                    config.aggregateColumns.forEach(col => {
                        if (col.column) {
                            modifiedColumns.push(col.column);
                        }
                    });
                }
                break;

            case 12: // Tạo mới (Upload)
                if (config.outputColumns && Array.isArray(config.outputColumns)) {
                    config.outputColumns.forEach(col => {
                        if (typeof col == 'string') {
                            modifiedColumns.push(col);
                        } else if (col && typeof col == 'object' && col.name) {
                            modifiedColumns.push(col.name);
                        }
                    });
                }
                break;

            case 13: // Text-to-column
                if (config.targetColumn) {
                    modifiedColumns.push(config.targetColumn);
                }
                // Use newlyCreatedColumns if available, otherwise filter outputColumns
                if (config.newlyCreatedColumns && Array.isArray(config.newlyCreatedColumns)) {
                    modifiedColumns.push(...config.newlyCreatedColumns);
                } else if (config.outputColumns && Array.isArray(config.outputColumns)) {
                    // Filter out the targetColumn from outputColumns to get only new columns
                    const targetColumn = config.targetColumn;
                    config.outputColumns.forEach(col => {
                        if (typeof col == 'string' && col !== targetColumn) {
                            modifiedColumns.push(col);
                        } else if (col && typeof col == 'object' && col.name && col.name !== targetColumn) {
                            modifiedColumns.push(col.name);
                        }
                    });
                }
                break;

            case 14: // Date Converter
                if (config.yearColumn) {
                    modifiedColumns.push(config.yearColumn);
                }
                if (config.monthColumn) {
                    modifiedColumns.push(config.monthColumn);
                }
                if (config.dayColumn) {
                    modifiedColumns.push(config.dayColumn);
                }
                if (config.outputColumn) {
                    modifiedColumns.push(config.outputColumn);
                }
                // Use newlyCreatedColumns if available
                if (config.newlyCreatedColumns && Array.isArray(config.newlyCreatedColumns)) {
                    modifiedColumns.push(...config.newlyCreatedColumns);
                }
                break;

            case 15: // AI Logic
                if (config.targetColumn) {
                    modifiedColumns.push(config.targetColumn);
                }
                break;

            case 16: // Lọc bỏ cột
                if (config.columnsToRemove && Array.isArray(config.columnsToRemove)) {
                    modifiedColumns.push(...config.columnsToRemove);
                }
                break;

            case 17: // Xoay bảng
                if (config.indexColumn) {
                    modifiedColumns.push(config.indexColumn);
                }
                if (config.columnsColumn) {
                    modifiedColumns.push(config.columnsColumn);
                }
                if (config.valuesColumn) {
                    modifiedColumns.push(config.valuesColumn);
                }
                break;

            case 18: // Nối bảng
                if (config.joinColumn) {
                    modifiedColumns.push(config.joinColumn);
                }
                if (config.lookupColumn) {
                    modifiedColumns.push(config.lookupColumn);
                }
                break;

            case 19: // Value to time
                if (Array.isArray(config.mappings) && config.mappings.length > 0) {
                    config.mappings.forEach(m => {
                        if (m.column) modifiedColumns.push(m.column);
                        if (m.outputColumn) modifiedColumns.push(m.outputColumn);
                    });
                } else {
                    if (config.column) {
                        modifiedColumns.push(config.column);
                    }
                    if (config.outputColumn) {
                        modifiedColumns.push(config.outputColumn);
                    }
                }
                // Use newlyCreatedColumns if available
                if (config.newlyCreatedColumns && Array.isArray(config.newlyCreatedColumns)) {
                    modifiedColumns.push(...config.newlyCreatedColumns);
                }
                break;

            case 20: // Thao tác ngày tháng
                if (config.sourceDateColumn) {
                    modifiedColumns.push(config.sourceDateColumn);
                }
                if (config.targetDateColumn) {
                    modifiedColumns.push(config.targetDateColumn);
                }
                if (config.referenceDateColumn) {
                    modifiedColumns.push(config.referenceDateColumn);
                }
                if (config.newColumnName) {
                    modifiedColumns.push(config.newColumnName);
                }
                break;

            case 22: // Lookup nâng cao
                if (Array.isArray(config.lookupConditions)) {
                    config.lookupConditions.forEach(cond => {
                        if (cond.currentColumn) modifiedColumns.push(cond.currentColumn);
                    });
                }
                if (config.newColumnName) {
                    modifiedColumns.push(config.newColumnName);
                }
                break;

            case 25: // Chuyển đổi kiểu dữ liệu
                if (Array.isArray(config.columnMappings)) {
                    config.columnMappings.forEach(m => {
                        if (m.column) modifiedColumns.push(m.column);
                    });
                }
                break;

            case 27: // Nối giá trị các cột
                if (Array.isArray(config.selectedColumns)) {
                    config.selectedColumns.forEach(col => {
                        if (col) modifiedColumns.push(col);
                    });
                }
                if (config.newColumnName) {
                    modifiedColumns.push(config.newColumnName);
                }
                break;

            case 29: // Thêm giá trị cố định
                if (config.fieldName) {
                    modifiedColumns.push(config.fieldName);
                }
                break;

            case 32: // Week Number
                if (config.sourceColumn) {
                    modifiedColumns.push(config.sourceColumn);
                }
                if (config.newColumnName) {
                    modifiedColumns.push(config.newColumnName);
                }
                break;

            case 34: // Xử lý cơ bản (Basic Processing)
                // Trim
                if (config.enableTrim) {
                    if (config.trimAllColumns && Array.isArray(rowData) && rowData.length > 0) {
                        const allCols = Object.keys(rowData[0]).filter(k => k !== 'rowId');
                        modifiedColumns.push(...allCols);
                    } else if (Array.isArray(config.trimColumns)) {
                        modifiedColumns.push(...config.trimColumns);
                    }
                }
                // Data type conversion
                if (config.enableDataTypeConversion && Array.isArray(config.dataTypeMappings)) {
                    config.dataTypeMappings.forEach(m => { if (m.column) modifiedColumns.push(m.column); });
                }
                // Value to date
                if (config.enableValueToDate && Array.isArray(config.dateMappings)) {
                    config.dateMappings.forEach(m => {
                        if (m.outputColumn) modifiedColumns.push(m.outputColumn);
                        else if (m.column) modifiedColumns.push(m.column);
                    });
                }
                // Case conversion
                if (config.enableCaseConversion) {
                    if (config.caseAllColumns && Array.isArray(rowData) && rowData.length > 0) {
                        const allCols = Object.keys(rowData[0]).filter(k => k !== 'rowId');
                        modifiedColumns.push(...allCols);
                    } else if (Array.isArray(config.caseColumns)) {
                        modifiedColumns.push(...config.caseColumns);
                    }
                }
                // Rename
                if (config.enableRename && Array.isArray(config.renameMappings)) {
                    config.renameMappings.forEach(m => { if (m.newName) modifiedColumns.push(m.newName); });
                }
                break;

            case 21: // AI Transformer
                if (Array.isArray(config.conditionColumns)) {
                    modifiedColumns.push(...config.conditionColumns);
                }
                if (config.resultColumn) {
                    modifiedColumns.push(config.resultColumn);
                }
                break;
        }

        return [...new Set(modifiedColumns)]; // Loại bỏ trùng lặp
    }, [steps]);

    // Function để lấy thông tin chi tiết về thao tác trên cột
    const getColumnOperationInfo = useCallback((currentStepId, columnName) => {
        if (!currentStepId || !steps.length) return null;

        const currentStep = steps.find(step => step.id == currentStepId);
        if (!currentStep || !currentStep.config) return null;

        const config = currentStep.config;
        const stepType = stepTypeName[currentStep.type] || `Loại ${currentStep.type}`;

        switch (currentStep.type) {
            case 1: // Bỏ trùng lặp
                if (config.columns && config.columns.includes(columnName)) {
                    return `${stepType} - Cột kiểm tra trùng lặp`;
                }
                break;

            case 2: // Điền giá trị thiếu
                if (config.column == columnName) {
                    return `${stepType} - Cột được điền giá trị thiếu`;
                }
                if (config.newColumn && config.columnName == columnName) {
                    return `${stepType} - Cột mới được tạo`;
                }
                break;

            case 3: // Phát hiện ngoại lệ
                if (config.column == columnName) {
                    return `${stepType} - Cột được phát hiện ngoại lệ`;
                }
                if (config.newColumn && config.columnName == columnName) {
                    return `${stepType} - Cột flag ngoại lệ`;
                }
                break;

            case 4: // Lookup
                if (config.joinColumn == columnName) {
                    return `${stepType} - Cột join`;
                }
                if (config.newColumnName == columnName) {
                    return `${stepType} - Cột lookup kết quả`;
                }
                break;

            case 5: // Thêm cột tính toán
                if (config.newColumnName == columnName) {
                    return `${stepType} - Cột tính toán mới`;
                }
                break;

            case 7: // Validation & Mapping
                if (config.targetColumn == columnName) {
                    return `${stepType} - Cột được validate/map`;
                }
                if (config.createNewColumn && config.newColumnName == columnName) {
                    return `${stepType} - Cột mapping kết quả`;
                }
                break;

            case 8: // Điền có điều kiện
                if (config.targetColumn == columnName) {
                    return `${stepType} - Cột được điền có điều kiện`;
                }
                break;

            case 9: // Lọc dữ liệu
                if (config.column == columnName) {
                    return `${stepType} - Cột được lọc`;
                }
                break;

            case 10: // Aggregate
                if (config.groupByColumns && config.groupByColumns.includes(columnName)) {
                    return `${stepType} - Cột group by`;
                }
                if (config.aggregateColumns && config.aggregateColumns.some(col => col.column == columnName)) {
                    return `${stepType} - Cột được aggregate`;
                }
                break;

            case 12: // Tạo mới (Upload)
                return `${stepType} - Cột từ dữ liệu upload`;

            case 13: // Text-to-column
                if (config.targetColumn == columnName) {
                    return `${stepType} - Cột nguồn được tách`;
                }
                // Check if this column is one of the newly created columns
                if (config.newlyCreatedColumns && config.newlyCreatedColumns.includes(columnName)) {
                    return `${stepType} - Cột mới được tạo ra`;
                } else if (config.outputColumns && Array.isArray(config.outputColumns)) {
                    // Fallback: check if this column is in outputColumns but not the targetColumn
                    const targetColumn = config.targetColumn;
                    const isNewColumn = config.outputColumns.some(col => {
                        if (typeof col == 'string') {
                            return col == columnName && col !== targetColumn;
                        } else if (col && typeof col == 'object' && col.name) {
                            return col.name == columnName && col.name !== targetColumn;
                        }
                        return false;
                    });
                    if (isNewColumn) {
                        return `${stepType} - Cột mới được tạo ra`;
                    }
                }
                break;

            case 14: // Date Converter
                if (config.yearColumn == columnName) {
                    return `${stepType} - Cột năm`;
                }
                if (config.monthColumn == columnName) {
                    return `${stepType} - Cột tháng`;
                }
                if (config.dayColumn == columnName) {
                    return `${stepType} - Cột ngày`;
                }
                if (config.outputColumn == columnName) {
                    return `${stepType} - Cột kết quả chuyển đổi`;
                }
                // Check if this column is one of the newly created columns
                if (config.newlyCreatedColumns && config.newlyCreatedColumns.includes(columnName)) {
                    return `${stepType} - Cột mới được tạo ra`;
                }
                break;

            case 15: // AI Logic
                if (config.targetColumn == columnName) {
                    return `${stepType} - Cột được xử lý AI`;
                }
                break;

            case 16: // Lọc bỏ cột
                if (config.columnsToRemove && config.columnsToRemove.includes(columnName)) {
                    return `${stepType} - Cột bị loại bỏ`;
                }
                break;

            case 17: // Xoay bảng
                if (config.indexColumn == columnName) {
                    return `${stepType} - Cột index`;
                }
                if (config.columnsColumn == columnName) {
                    return `${stepType} - Cột columns`;
                }
                if (config.valuesColumn == columnName) {
                    return `${stepType} - Cột values`;
                }
                break;

            case 18: // Nối bảng
                if (config.joinColumn == columnName) {
                    return `${stepType} - Cột join`;
                }
                if (config.lookupColumn == columnName) {
                    return `${stepType} - Cột lookup`;
                }
                break;

            case 19: // Value to time
                if (Array.isArray(config.mappings) && config.mappings.length > 0) {
                    const isSource = config.mappings.some(m => m.column == columnName);
                    const isOutput = config.mappings.some(m => m.outputColumn == columnName);
                    if (isSource) return `${stepType} - Cột nguồn chuyển đổi`;
                    if (isOutput) return `${stepType} - Cột kết quả chuyển đổi`;
                } else {
                    if (config.column == columnName) {
                        return `${stepType} - Cột nguồn chuyển đổi`;
                    }
                    if (config.outputColumn == columnName) {
                        return `${stepType} - Cột kết quả chuyển đổi`;
                    }
                }
                // Check if this column is one of the newly created columns
                if (config.newlyCreatedColumns && config.newlyCreatedColumns.includes(columnName)) {
                    return `${stepType} - Cột mới được tạo ra`;
                }
                break;

            case 20: // Thao tác ngày tháng
                if (config.sourceDateColumn == columnName) {
                    return `${stepType} - Cột ngày nguồn`;
                }
                if (config.targetDateColumn == columnName) {
                    return `${stepType} - Cột ngày đích`;
                }
                if (config.referenceDateColumn == columnName) {
                    return `${stepType} - Cột ngày tham chiếu`;
                }
                if (config.newColumnName == columnName) {
                    return `${stepType} - Cột kết quả ngày`;
                }
                break;

            case 22: // Lookup nâng cao
                if (Array.isArray(config.lookupConditions)) {
                    const isCondCol = config.lookupConditions.some(c => c.currentColumn == columnName);
                    if (isCondCol) return `${stepType} - Cột điều kiện lookup`;
                }
                if (config.newColumnName == columnName) {
                    return `${stepType} - Cột kết quả lookup`;
                }
                break;

            case 25: // Chuyển đổi kiểu dữ liệu
                if (Array.isArray(config.columnMappings)) {
                    const mapping = config.columnMappings.find(m => m.column == columnName);
                    if (mapping) return `${stepType} - Chuyển sang kiểu ${mapping.dataType}`;
                }
                break;

            case 27: // Nối giá trị các cột
                if (Array.isArray(config.selectedColumns) && config.selectedColumns.includes(columnName)) {
                    return `${stepType} - Cột tham gia nối`;
                }
                if (config.newColumnName == columnName) {
                    return `${stepType} - Cột kết quả nối`;
                }
                break;

            case 29: // Thêm giá trị cố định
                if (config.fieldName == columnName) {
                    return `${stepType} - Cột mới thêm giá trị cố định`;
                }
                break;

            case 32: // Week Number
                if (config.sourceColumn == columnName) {
                    return `${stepType} - Cột nguồn ngày tính tuần`;
                }
                if (config.newColumnName == columnName) {
                    return `${stepType} - Cột tuần (ISO Week Number)`;
                }
                break;

            case 34: // Xử lý cơ bản
                // Rename new name
                if (config.enableRename && Array.isArray(config.renameMappings)) {
                    const rm = config.renameMappings.find(m => m.newName == columnName);
                    if (rm) return `${stepType} - Đổi tên từ "${rm.oldName}"`;
                }
                // Data type conversion
                if (config.enableDataTypeConversion && Array.isArray(config.dataTypeMappings)) {
                    const m = config.dataTypeMappings.find(m => m.column == columnName);
                    if (m) return `${stepType} - Chuyển kiểu sang ${m.dataType}`;
                }
                // Trim
                if (config.enableTrim) {
                    const isTrimCol = (config.trimAllColumns && true) || (Array.isArray(config.trimColumns) && config.trimColumns.includes(columnName));
                    if (isTrimCol) return `${stepType} - Trim (${config.trimType || 'both'})`;
                }
                // Case conversion
                if (config.enableCaseConversion) {
                    const isCaseCol = (config.caseAllColumns && true) || (Array.isArray(config.caseColumns) && config.caseColumns.includes(columnName));
                    if (isCaseCol) return `${stepType} - Case: ${config.caseType || 'sentencecase'}`;
                }
                // Value to date
                if (config.enableValueToDate && Array.isArray(config.dateMappings)) {
                    const dm = config.dateMappings.find(m => (m.outputColumn || m.column) == columnName);
                    if (dm) return `${stepType} - Chuyển giá trị thành ngày (${dm.dateFormat || 'YYYY-MM-DD'})`;
                }
                break;

            case 21: // AI Transformer
                if (Array.isArray(config.conditionColumns) && config.conditionColumns.includes(columnName)) {
                    return `${stepType} - Cột điều kiện AI`;
                }
                if (config.resultColumn == columnName) {
                    return `${stepType} - Cột kết quả AI`;
                }
                break;
        }

        return null;
    }, [steps]);

    // Count errors by looking for "ERROR" strings in the data
    const errorFilter = useMemo(() => {
        if (!selectedStepId || !steps.length || !rowData.length) return null;

        const selectedStep = steps.find(step => step.id == selectedStepId);
        if (!selectedStep) return null;

        // Only check for errors in calculation-based steps
        if (![2, 4, 5, 13, 14, 19, 22, 25, 34].includes(selectedStep.type)) return null;

        // Count rows that contain "ERROR" in any cell
        const errorRows = rowData.filter(row => {
            return Object.values(row).some(value => value == 'ERROR');
        });

        if (errorRows.length == 0) return null;

        return {
            errorCount: errorRows.length,
            errorRows: errorRows.map(row => ({ rowData: row })),
            stepType: selectedStep.type,
            stepTypeName: selectedStep.name || `Step ${selectedStep.id}`
        };
    }, [selectedStepId, steps, rowData]);

    // Filter data based on search query and error filter
    const filteredData = useMemo(() => {
        let filtered = [...rowData];

        // Apply search filter
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(row => {
                return Object.values(row).some(value =>
                    String(value).toLowerCase().includes(searchQuery.toLowerCase())
                );
            });
        }

        // Apply error filter if active
        if (isErrorFilterActive && errorFilter) {
            filtered = filtered.filter(row => {
                return Object.values(row).some(value => value == 'ERROR');
            });
        }

        return filtered;
    }, [rowData, searchQuery, isErrorFilterActive, errorFilter]);

    // Page size options
    // const pageSizeOptions = [
    //     { value: 500, label: '500 dòng/trang' },
    //     { value: 1000, label: '1000 dòng/trang' },
    //     { value: 2000, label: '2000 dòng/trang' },
    //     { value: 5000, label: '5000 dòng/trang' },
    //     { value: 10000, label: '10000 dòng/trang' },
    //     { value: 20000, label: '20000 dòng/trang' },
    //     { value: 50000, label: '50000 dòng/trang' },
    // ];

    const pageSizeOptions = [
        // { value: 1000, label: '1000 dòng/trang' },
        { value: 5000, label: '5000 dòng/trang' },
        { value: 10000, label: '10000 dòng/trang' },
        { value: 20000, label: '20000 dòng/trang' },
        { value: 50000, label: '50000 dòng/trang' },
    ];

    // Update statistics when data changes
    useEffect(() => {
        // totalRows is now set directly from API response
        setTotalColumns(colDefs.length);

        // Find last update time from steps
        if (steps && steps.length > 0) {
            const lastStepWithTimestamp = [...steps]
                .reverse()
                .find(step => step.config?.outputColumnsTimestamp);

            if (lastStepWithTimestamp?.config?.outputColumnsTimestamp) {
                setLastUpdateTime(new Date(lastStepWithTimestamp.config.outputColumnsTimestamp));
            }
        }
    }, [rowData, colDefs.length, steps]);

    // Reset pagination when data source changes (e.g., stepId)
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStepId]);

    // Handle page size change
    const handlePageSizeChange = (newPageSize) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Reset to first page when searching
        setCurrentPage(1);
    };



    const handleChangeStatusFilter = () => {
        // Don't clear error filter when toggling status filter
        // Let the user maintain their error filter if they want to
        setIsStatusFilter((prev) => !prev);
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

    // Lấy thông tin filenote
    const fetchFileNote = async () => {
        const requestedId = idFileNote;
        try {
            const fileNoteData = await getFileNotePadByIdController(idFileNote);
            if (String(requestedId) !== String(idFileNote)) {
                console.warn('⚠️ Ignoring stale fetchFileNote result for', requestedId, 'current is', idFileNote);
                return;
            }
            setFileNote(fileNoteData);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin filenote:', error);
        }
    };

    // Lấy danh sách approved version
    const fetchListApprovedVersion = async () => {
        const requestedId = idFileNote;
        try {
            const approvedVersions = await getAllApprovedVersion();
            if (String(requestedId) !== String(idFileNote)) {
                console.warn('⚠️ Ignoring stale fetchListApprovedVersion result for', requestedId, 'current is', idFileNote);
                return;
            }
            setListApprovedVersion(approvedVersions);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách approved version:', error);
        }
    };

    // Lấy danh sách bảng có thể nối (tương tự như trong JoinTableConfig)
    const fetchAvailableTables = async () => {
        const requestedId = idFileNote;
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
                const noteTemplates = templateTablesData.filter(template => template.fileNote_id == fileNote.id);

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
                        versions: versions.filter(v => v.template.id == template.id) // Filter versions for this template
                    });
                });
            });

            if (String(requestedId) !== String(idFileNote)) {
                console.warn('⚠️ Ignoring stale fetchAvailableTables result for', requestedId, 'current is', idFileNote);
                return;
            }
            setAvailableTables(targetTables);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách bảng có thể nối:', error);
            setAvailableTables([]);
        }
    };

    // Function kiểm tra step đã được published
    const isStepPublished = (stepId) => {
        return (
            listApprovedVersion &&
            listApprovedVersion.some(
                v => v.id_version == stepId && v.id_fileNote == idFileNote
            )
        );
    };

    // Lấy dữ liệu bảng
    const fetchData = async () => {
        const requestedId = idFileNote;
        startLoading();
        try {
            // Lấy thông tin filenote trước
            await fetchFileNote();

            // Lấy danh sách approved version
            await fetchListApprovedVersion();

            // Lấy danh sách bảng có thể nối
            await fetchAvailableTables();

            const templateInfo = await getTemplateByFileNoteId(requestedId);
            // If during await user switched to another filenote, ignore this result
            if (String(requestedId) != String(idFileNote)) {
                console.warn('⚠️ Ignoring stale fetchData result for fileNote', requestedId, 'current is', idFileNote);
                return;
            }

            if (!templateInfo || !templateInfo[0]) {
                setTemplate(null);
                setSteps([]);
                return;
            };

            const currentTemplate = templateInfo[0];
            setTemplate(currentTemplate);
            setSteps(currentTemplate.steps || []);

            // Khởi tạo autorun từ template setting
            if (currentTemplate.setting && currentTemplate.setting.autorun !== undefined) {
                setAutorun(currentTemplate.setting.autorun);
            } else {
                setAutorun(false);
            }
        } finally {
            stopLoading();
        }
    };

    // Lấy dữ liệu theo version của step
    const fetchDataByStep = async (stepId, forceRefresh = false) => {
        if (!template || !stepId) {
            return;
        }
        const requestedId = idFileNote;
        if (!forceRefresh) {
            startLoading();
        }
        try {
            let dataResponse;
            let columns;
            const stepToFetch = steps.find(s => s.id == stepId);

            if (stepToFetch && stepToFetch.type == 12 && stepToFetch.config?.uploadType == 'system' && stepToFetch.config?.systemConfig) {
                const { templateTableId: sourceTableId, stepId: sourceStepId } = stepToFetch.config.systemConfig;
                if (sourceTableId) {
                    const [sourceDataResponse, sourceColumns] = await Promise.all([
                        getTemplateRow(sourceTableId, sourceStepId, forceRefresh, currentPage, pageSize),
                        getTemplateColumn(sourceTableId)
                    ]);
                    dataResponse = sourceDataResponse;
                    columns = sourceColumns;
                } else {
                    message.error('Step "Import từ hệ thống" bị thiếu cấu hình nguồn.');
                    setRowData([]);
                    setTotalRows(0);
                    setSelectedStepId(stepId);
                    stopLoading();
                    return;
                }
            } else {
                if (stepId == 1) {
                    const [dataRes, cols] = await Promise.all([
                        getTemplateRow(template.id, null, forceRefresh, currentPage, pageSize),
                        getTemplateColumn(template.id)
                    ]);
                    dataResponse = dataRes;
                    columns = cols;
                } else {
                    const [dataRes, cols] = await Promise.all([
                        getTemplateRow(template.id, stepId, forceRefresh, currentPage, pageSize),
                        getTemplateColumn(template.id)
                    ]);
                    dataResponse = dataRes;
                    columns = cols;
                }
            }

            // Guard against stale async: ensure still on same filenote
            if (String(requestedId) !== String(idFileNote)) {
                console.warn('⚠️ Ignoring stale fetchDataByStep result for fileNote', requestedId, 'current is', idFileNote);
                return;
            }

            if (dataResponse && dataResponse.rows) {
                let processedData = dataResponse.rows.map(row => ({ ...row.data, rowId: row.id }));

                // Lọc dữ liệu dựa trên outputColumns của step (chỉ áp dụng cho Aggregate và các step đặc biệt)
                if (stepToFetch && stepToFetch.config && stepToFetch.config.outputColumns && Array.isArray(stepToFetch.config.outputColumns) && stepToFetch.type == 10) {
                    // Chỉ áp dụng cho Aggregate step (type 10)
                    const allowedColumns = stepToFetch.config.outputColumns.map(col => col.name);
                    processedData = processedData.map(row => {
                        const filteredRow = { rowId: row.rowId };
                        allowedColumns.forEach(colName => {
                            if (row.hasOwnProperty(colName)) {
                                filteredRow[colName] = row[colName];
                            }
                        });
                        return filteredRow;
                    });
                }
                setRowData(processedData);
                setTotalRows(dataResponse.count);
                setTemplateColumns(columns); // Cập nhật columns tương ứng
                setLastUpdateTime(new Date());
                setSelectedStepId(stepId);
            } else {
                setRowData([]);
                setTotalRows(0);
                setSelectedStepId(stepId);
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu step:', error);
            setRowData([]);
            setTotalRows(0);
            setSelectedStepId(stepId);
        } finally {
            if (!forceRefresh) {
                stopLoading();
            }
        }
    };

    // Hàm xử lý refresh dữ liệu
    const handleRefreshData = async () => {
        try {
            message.loading({ content: 'Đang làm mới dữ liệu...', key: 'refresh' });

            if (selectedStepId) {
                // Refresh dữ liệu của step hiện tại
                await fetchDataByStep(selectedStepId, true);
            } else {
                // Refresh dữ liệu gốc
                await fetchData();
            }

            message.success({ content: 'Dữ liệu đã được làm mới thành công!', key: 'refresh' });
            setHasNewDataUpdate(false); // Reset trạng thái sau khi refresh thành công
        } catch (error) {
            console.error('Lỗi khi refresh dữ liệu:', error);
            message.error({ content: 'Có lỗi khi làm mới dữ liệu', key: 'refresh' });
        }
    };

    useEffect(() => {
        if (idFileNote) {
            // Immediately reset states to clear old data from memory
            setRowData([]);
            setColDefs([]);
            setTemplate(null);
            setTemplateColumns([]);
            setSteps([]);
            setSelectedStepId(null);
            setTotalRows(0);
            setHasNewDataUpdate(false); // Reset trạng thái cập nhật khi chuyển filenote

            // Fetch new data
            fetchData();
        }

        // Cleanup function to run when the component unmounts or idFileNote changes
        return () => {
            if (gridApi && !gridApi.isDestroyed()) {
                gridApi.destroy();
            }
            setGridApi(null);
            setRowData([]);
            setColDefs([]);
            setTemplate(null);
            setTemplateColumns([]);
            setSteps([]);
        };
    }, [idFileNote]);

    // Lắng nghe event autorunDataUpdated từ HeaderDM để tự động refresh
    useEffect(() => {
        const handleAutorunDataUpdate = (event) => {
            const { templateId, templateName } = event.detail;

            // Kiểm tra xem có phải template hiện tại không
            if (template && template.id === templateId) {
                setHasNewDataUpdate(true); // Đánh dấu có cập nhật dữ liệu mới
                // handleRefreshData();
            }
        };

        // Thêm event listener
        window.addEventListener('autorunDataUpdated', handleAutorunDataUpdate);

        // Cleanup function
        return () => {
            window.removeEventListener('autorunDataUpdated', handleAutorunDataUpdate);
        };
    }, [template]); // Dependency: template để đảm bảo so sánh đúng templateId

    // Refetch data when page or pageSize changes
    useEffect(() => {
        if (selectedStepId) {
            fetchDataByStep(selectedStepId);
        }
    }, [currentPage, pageSize]);

    // Khi stepId thay đổi (từ URL) hoặc khi template được tải lần đầu, tự động chọn step
    useEffect(() => {
        // Prevent fetching when template is not yet loaded
        if (!template) {
            return;
        }

        if (stepId) {
            const stepNum = isNaN(Number(stepId)) ? null : Number(stepId);
            if (stepNum) {
                fetchDataByStep(stepNum);
            } else {
                // If stepId is a path (string), find the matching step
                const foundStep = steps.find(s => s.path == stepId);
                if (foundStep) {
                    fetchDataByStep(foundStep.id);
                }
            }
        } else {
            // If no stepId in URL, default to step 1 (original data)
            fetchDataByStep(1);
        }
    }, [stepId, template]); // Intentionally not including 'steps' to avoid re-fetching when steps are modified in the UI

    // Build colDefs dựa trên dữ liệu hiện tại thay vì templateColumns
    useEffect(() => {
        if (!rowData.length || !template) return;

        // Lấy danh sách cột từ outputColumns của step hiện tại
        let dataColumns = [];

        if (selectedStepId && steps.length > 0) {
            const currentStep = steps.find(step => step.id == selectedStepId);
            if (currentStep && currentStep.config && currentStep.config.outputColumns && Array.isArray(currentStep.config.outputColumns)) {
                // Lấy danh sách tên cột từ outputColumns
                dataColumns = currentStep.config.outputColumns.map(col => {
                    if (typeof col == 'string') {
                        return col;
                    } else if (col && typeof col == 'object' && col.name) {
                        return col.name;
                    }
                    return null;
                }).filter(Boolean);
            }
        }

        // Nếu không có outputColumns hoặc không có step được chọn, lấy tất cả columns từ dữ liệu
        if (dataColumns.length === 0) {
            const allColumns = [];
            rowData.forEach(row => {
                Object.keys(row).forEach(key => {
                    if (key !== 'rowId' && !allColumns.includes(key)) { // Bỏ qua rowId và tránh trùng lặp
                        allColumns.push(key);
                    }
                });
            });
            dataColumns = allColumns;
        }

        // Lấy danh sách cột đã được thao tác trong step hiện tại
        const modifiedColumns = getModifiedColumns(selectedStepId);

        // Lấy thông tin về step hiện tại để kiểm tra type
        const currentStep = steps.find(step => step.id == selectedStepId);
        const isJoinTableStep = currentStep && currentStep.type == 18;

        // Lấy danh sách các cột key để join nếu là step Join Table
        const joinKeyColumns = isJoinTableStep && currentStep.config?.joinColumns ?
            currentStep.config.joinColumns
                .filter(col => col.sourceColumn && col.targetColumn)
                .map(col => col.sourceColumn) : [];

        // Tạo colDefs dựa trên columns của dữ liệu hiện tại
        const colDefs = dataColumns.map(columnName => {
            // Kiểm tra xem cột này có được thao tác trong step hiện tại không
            const isModified = modifiedColumns.includes(columnName);

            // Kiểm tra xem cột này có chứa '(Bảng nối)' trong headerName không
            const isJoinColumn = isJoinTableStep && columnName.includes('(Bảng nối)');

            // Kiểm tra xem cột này có phải là cột key để join không
            const isJoinKeyColumn = isJoinTableStep && joinKeyColumns.includes(columnName);

            // Tìm template column tương ứng (nếu có)
            const templateColumn = templateColumns.find(col => col.columnName == columnName);

            // Tạo cellStyle để highlight cột đã thao tác, cột từ bảng nối, hoặc cột key để join
            const cellStyle = {
                fontSize: '13px',
                ...(isModified && showModifiedColumns && {
                    backgroundColor: '#ffe3c3',
                    fontWeight: 'bold'
                }),
                ...(isJoinColumn && {
                    backgroundColor: '#c2ecff',
                    fontWeight: 'bold'
                }),
                ...(isJoinKeyColumn && {
                    backgroundColor: ' #ffebdc',
                    fontWeight: 'bold'
                })
            };

            // Tạo tooltip cho cột đã thao tác, cột từ bảng nối, hoặc cột key để join
            let tooltipValueGetter = undefined;
            if (isModified && showModifiedColumns) {
                tooltipValueGetter = (params) => {
                    const operationInfo = getColumnOperationInfo(selectedStepId, columnName);
                    return operationInfo || `Cột ${columnName} đã được thao tác trong step này`;
                };
            } else if (isJoinColumn) {
                tooltipValueGetter = (params) => {
                    return `Cột ${columnName} từ bảng nối (Join Table)`;
                };
            } else if (isJoinKeyColumn) {
                tooltipValueGetter = (params) => {
                    return `Cột ${columnName} - Key để join với bảng khác`;
                };
            }

            // Nếu có template column, sử dụng buildColumnDef
            // Tạo column definition cơ bản
            let colDef = {
                headerName: columnName,
                field: columnName,
                // width: 150,
                resizable: true,
                sortable: true,
                cellStyle: cellStyle,
                ...filter(),
                ...(tooltipValueGetter && { tooltipValueGetter }),
            };

            // Nếu có template column, sử dụng buildColumnDef và buildColumn
            // if (templateColumn) {
            //     const def = buildColumnDef({
            //         col: templateColumn,
            //         rowData,
            //         duplicateHighlightColumns,
            //         templateColumns: templateColumns,
            //         currentUser: { email: '', isAdmin: true },
            //         getHeaderTemplate: (name) => `<span>${name}${duplicateHighlightColumns.includes(name) ? ' 📌' : ''}${isModified && showModifiedColumns ? '' : ''}${isJoinColumn ? ' 🔗' : ''}${isJoinKeyColumn ? ' 🔑' : ''}</span>`,
            //         toggleDuplicateHighlight,
            //         filter,
            //     });
            //     buildColumn(templateColumn, def, template?.id, () => { });

            //     // Cập nhật cellStyle để highlight
            //     def.cellStyle = cellStyle;

            //     // Thêm tooltip nếu cần
            //     if (tooltipValueGetter) {
            //         def.tooltipValueGetter = tooltipValueGetter;
            //     }

            //     // Merge với colDef cơ bản
            //     colDef = { ...colDef, ...def };
            // }

            // Kiểm tra kiểu dữ liệu từ outputColumns để áp dụng format
            let outputCol = null;
            if (selectedStepId && steps.length > 0) {
                const currentStep = steps.find(step => step.id == selectedStepId);
                if (currentStep && currentStep.config && currentStep.config.outputColumns) {
                    outputCol = currentStep.config.outputColumns.find(col =>
                        (typeof col == 'string' ? col : col.name) == columnName
                    );

                    // Luôn ưu tiên sử dụng outputColumns để hiển thị cho tất cả các cột
                    if (outputCol && typeof outputCol == 'object' && outputCol.type) {
                        // Override columnType từ outputColumns
                        colDef.columnType = outputCol.type;

                        // Xử lý theo kiểu dữ liệu từ outputColumns
                        switch (outputCol.type) {
                            case 'number':
                                // Override valueFormatter cho number
                                colDef.valueFormatter = (params) => {
                                    // Kiểm tra ERROR trước tiên
                                    if (params.value === 'ERROR') return 'ERROR';

                                    if (params.value == null || params.value == undefined || params.value == '') return '-';
                                    if (params.value == 0) return '-';

                                    const numValue = Number(params.value);
                                    if (isNaN(numValue)) return '-';

                                    // Định dạng số với dấu phân cách
                                    return numValue.toLocaleString('en-EN', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 2,
                                        useGrouping: true
                                    });
                                };

                                // Override valueParser cho number
                                colDef.valueParser = (params) => {
                                    if (params.newValue == null || params.newValue == undefined || params.newValue == '') {
                                        return null;
                                    }
                                    if (typeof params.newValue == 'string') {
                                        // Loại bỏ dấu phân cách và khoảng trắng
                                        const cleanValue = params.newValue.replace(/[\s,\.]/g, function (match) {
                                            // Giữ dấu . cuối cùng làm dấu thập phân
                                            if (match == '.' && params.newValue.lastIndexOf('.') == params.newValue.indexOf(match)) {
                                                return '.';
                                            }
                                            return '';
                                        });
                                        const numValue = parseFloat(cleanValue);
                                        return isNaN(numValue) ? null : numValue;
                                    }
                                    const numValue = Number(params.newValue);
                                    return isNaN(numValue) ? null : numValue;
                                };

                                // Override cellStyle cho number
                                const originalCellStyle = colDef.cellStyle;
                                colDef.cellStyle = (params) => {
                                    let originalStyles = {};
                                    if (typeof originalCellStyle == 'function') {
                                        originalStyles = originalCellStyle(params);
                                    } else if (originalCellStyle && typeof originalCellStyle == 'object') {
                                        originalStyles = originalCellStyle;
                                    }
                                    return {
                                        ...originalStyles,
                                        textAlign: 'right',
                                    };
                                };

                                // Override cellEditor cho number
                                colDef.cellEditor = 'agNumberCellEditor';
                                // Set headerClass cho number
                                colDef.headerClass = 'right-align-important';
                                break;

                            case 'text':
                                // Override valueFormatter cho text
                                colDef.valueFormatter = (params) => {
                                    return params.value || '';
                                };

                                // Override cellEditor cho text
                                colDef.cellEditor = 'agTextCellEditor';
                                break;

                            case 'date':
                                // Override valueFormatter cho date
                                colDef.valueFormatter = (params) => {
                                    // Kiểm tra ERROR trước tiên
                                    if (params.value === 'ERROR') return 'ERROR';

                                    if (!params.value) return '';
                                    const date = new Date(params.value);
                                    if (isNaN(date.getTime())) return params.value;
                                    return date.toLocaleDateString('vi-VN');
                                };

                                // Override cellEditor cho date
                                colDef.cellEditor = 'agTextCellEditor';
                                break;

                            case 'boolean':
                                // Override valueFormatter cho boolean
                                colDef.valueFormatter = (params) => {
                                    // Kiểm tra ERROR trước tiên
                                    if (params.value === 'ERROR') return 'ERROR';

                                    if (params.value == true) return 'Có';
                                    if (params.value == false) return 'Không';
                                    return params.value || '';
                                };

                                // Override cellEditor cho boolean
                                colDef.cellEditor = 'agSelectCellEditor';
                                colDef.cellEditorParams = {
                                    values: ['Có', 'Không']
                                };
                                break;

                            default:
                                // Override valueFormatter mặc định cho các kiểu khác
                                colDef.valueFormatter = (params) => {
                                    return params.value || '';
                                };

                                // Override cellEditor mặc định
                                colDef.cellEditor = 'agTextCellEditor';
                                break;
                        }
                    }
                }
            }

            return colDef;
        });

        setColDefs(colDefs);
    }, [rowData, template, duplicateHighlightColumns, isStatusFilter, templateColumns, selectedStepId, getModifiedColumns, showModifiedColumns, getColumnOperationInfo, steps]);

    // Auto size columns khi colDefs thay đổi
    useEffect(() => {
        if (gridApi && colDefs.length > 0) {
            setTimeout(() => {
                gridApi.autoSizeAllColumns();
            }, 200);
        }
    }, [gridApi, colDefs]);

    // statusBar giống Template.jsx
    const statusBar = useMemo(() => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }), []);

    // defaultColDef giống Template.jsx
    const defaultColDef = useMemo(() => ({
        maxWidth: 300,
        minWidth: 100,
        editable: false,
        filter: false,
        suppressMenu: true,
        wrapHeaderText: true, // Bật wrap text để ưu tiên hiển thị đầy đủ
        autoHeaderHeight: true, // Bật auto height để tự động điều chỉnh theo nội dung
        cellStyle: { fontSize: '13px' },
        headerClass: 'custom-header-class', // Thêm class tùy chỉnh cho header
    }), []);

    // onColumnResized giống Template.jsx
    const onColumnResized = useCallback(async (event) => {
        if (event.source == 'uiColumnResized') {
            const resizedColumn = templateColumns.find(
                (column) => column.columnName == event.column?.getColId()
            );
            if (resizedColumn) {
                await updateTemplateColumnWidth({
                    id: resizedColumn.id,
                    width: event.column.getActualWidth(),
                });
            }
        }
    }, [templateColumns]);

    // onColumnMoved giống Template.jsx
    const onColumnMoved = useCallback(async (event) => {
        if (event.finished && event.api && event.source == 'uiColumnMoved') {
            try {
                const allColumns = event.api
                    .getColumnDefs()
                    .filter((col) => col.field !== 'rowId' && col.field !== 'delete')
                    .map((column, index) => ({
                        id: templateColumns.find((col) => col.columnName == column.field)?.id,
                        columnIndex: index,
                    }))
                    .filter((col) => col.id);
                await updateColumnIndexes({
                    tableId: template.id,
                    columns: allColumns,
                });
            } catch (e) {
                console.error('Error saving column indexes:', e);
                toast.error('Đã xảy ra lỗi khi lưu thứ tự cột');
                fetchData();
            }
        }
    }, [template, templateColumns]);

    useEffect(() => {
        if (gridApi && colDefs && !gridApi.isDestroyed()) {
            gridApi.setColumnDefs(colDefs);
        }
    }, [colDefs, gridApi]);    // Khi update steps
    const handleUpdateSteps = async (newSteps) => {
        // Reset error state when steps are updated
        clearErrorState();

        setSteps(newSteps);
        if (template) {
            // Cập nhật template với steps mới
            const updatedTemplate = { ...template, steps: newSteps };
            await updateTemplateTable(updatedTemplate);

            // Cập nhật template state để đồng bộ
            setTemplate(updatedTemplate);
            setLastUpdateTime(new Date());
        }

        // Kiểm tra nếu step hiện tại vừa được hoàn thành, tự động refresh dữ liệu
        if (selectedStepId) {
            const currentStep = newSteps.find(s => s.id == selectedStepId);
            if (currentStep && currentStep.status == 'completed') {
                // Không cần fetch dữ liệu ở đây vì handleStepRunComplete sẽ xử lý
            }
        }
    };

    // Callback khi data được cập nhật sau khi chạy step
    const handleDataUpdate = async (newData = null) => {

        // Reset error state when data is updated
        clearErrorState();

        if (newData) {
            // Nếu có dữ liệu mới được truyền vào, cập nhật trực tiếp
            const processedData = newData.map((row, index) => ({
                ...row,
                rowId: row.rowId || `temp_${index}`
            }));
            setRowData(processedData);
            setLastUpdateTime(new Date());
        } else {
            // Nếu không có dữ liệu mới, reload từ database
            if (selectedStepId) {
                // Reload dữ liệu của step hiện tại
                await fetchDataByStep(selectedStepId, true);
            } else {
                // Reload dữ liệu gốc
                await fetchData();
            }
        }
    };

    // Callback khi click vào step card
    const handleStepClick = (stepIdOrPath) => {
        // Nếu stepIdOrPath là null, reset về dữ liệu gốc
        if (stepIdOrPath == null) {
            clearErrorState();
            setSelectedStepId(null);
            navigate(`/data-manager/data/${idFileNote}`);
            fetchData(); // Fetch dữ liệu gốc
            return;
        }

        // Tìm step theo id hoặc path
        let step = null;
        if (typeof stepIdOrPath == 'number') {
            step = steps.find(s => s.id == stepIdOrPath);
        } else {
            step = steps.find(s => s.path == stepIdOrPath || s.id == Number(stepIdOrPath));
        }

        if (step) {
            // Only clear error filter if we're changing to a different step
            if (selectedStepId !== step.id) {
                clearErrorState();
            }

            navigate(`/data-manager/data/${idFileNote}/step/${step.id}`);
            fetchDataByStep(step.id);
        }
    };

    // Callback khi step chạy xong để cập nhật selectedStepId
    const handleStepRunComplete = async (stepId) => {
        setSelectedStepId(stepId);

        // Đợi một chút để đảm bảo database đã được cập nhật hoàn toàn
        await new Promise(resolve => setTimeout(resolve, 500));

        // Tự động fetch dữ liệu của step vừa được chạy với force refresh
        await fetchDataByStep(stepId, true);

        // Cập nhật danh sách steps có lỗi sau khi step chạy xong
        // await updateStepsWithErrors();

        // Khi step chạy xong hoàn toàn, kết thúc loading ngay lập tức
        stopLoading(0);
    };

    // Handler để filter dữ liệu lỗi
    const handleErrorFilter = () => {
        setIsErrorFilterActive(!isErrorFilterActive); // Toggle error filter
    };

    // Handler để thay đổi autorun
    const handleAutorunChange = async (checked) => {
        setAutorun(checked);
        if (template) {
            try {
                if (checked) {
                    const autoRun = await createAutoRun({
                        tableId: template.id,
                        tableConfig: template.steps,
                        updated_at: new Date().toISOString(),
                    });
                } else {
                    try {
                        const autoRun = await getAutoRunByTableId(template.id);
                        await deleteAutoRun(autoRun[0]?.id);
                    } catch (error) {
                        console.error('Lỗi khi xóa autorun:', error);
                    }
                }
                const updatedTemplate = {
                    ...template,
                    setting: {
                        ...template.setting,
                        autorun: checked
                    }
                };
                await updateTemplateTable(updatedTemplate);
                setTemplate(updatedTemplate);
                setLastUpdateTime(new Date().toISOString());
                message.success(`Autorun đã ${checked ? 'bật' : 'tắt'}`);
            } catch (error) {
                console.error('Lỗi khi cập nhật autorun:', error);
                message.error('Không thể cập nhật autorun');
                // Revert state nếu có lỗi
                setAutorun(!checked);
            }
        }
    };

    // Handler để chạy tất cả steps
    const handleBatchRunAll = async () => {
        if (!template || !template.steps || template.steps.length <= 1) {
            message.warning('Không có steps để chạy');
            return;
        }

        setIsBatchRunning(true);
        setRunningStep('batch'); // Set running step for sidebar loading indicator
        setCurrentFileNoteId(idFileNote); // Set current file note ID for sidebar loading indicator
        setRunningFileNotes(prev => new Set([...prev, String(idFileNote)])); // Add to running files list
        try {
            // Log danh sách steps sẽ chạy (bỏ qua Upload Data type 12)
            try {
                const stepsToRun = (template?.steps || []).filter(s => s && s.type !== 12);
                console.log('[BatchRunAll] Start', {
                    fileNoteId: template?.fileNote_id,
                    templateId: template?.id,
                    totalSteps: (template?.steps || []).length,
                    stepsToRunIds: stepsToRun.map(s => s.id),
                    stepsToRunTypes: stepsToRun.map(s => s.type),
                });
            } catch (e) { }
            message.info('Đang xóa dữ liệu test và chạy tất cả steps với dữ liệu thật...');

            const result = await batchRunAllSteps(template.id, template.steps);

            if (result.success) {
                message.success(`Đã chạy thành công ${result.completedSteps}/${result.totalSteps} steps trong ${result.processingTime}ms`);

                // Tắt chế độ test sau khi chạy thành công
                setIsTestMode(false);

                // // Cập nhật lastUpdate/lastRunTimestamp cho các step vừa chạy
                // try {
                // 	const nowIso = new Date().toISOString();
                // 	const updatedSteps = (template.steps || []).map(s => {
                // 		// Bỏ qua step Upload Data (type 12) nếu không muốn gán chung
                // 		if (s && s.type !== 12) {
                // 			return {
                // 				...s,
                // 				config: { ...(s.config || {}), lastUpdate: nowIso },
                // 				lastRunTimestamp: nowIso,
                // 			};
                // 		}
                // 		return s;
                // 	});
                // 	await updateTemplateTable({ ...template, steps: updatedSteps });
                // } catch (e) {
                // 	console.warn('Không thể cập nhật lastUpdate cho steps sau batch run:', e);
                // }

                // Refresh dữ liệu sau khi batch run hoàn thành


                // Đánh dấu unread nếu đang không mở fileNote này
                try {
                    // Lấy id filenote đang mở NGAY TẠI THỜI ĐIỂM này từ URL để tránh bị closure giữ id cũ
                    const path = window.location?.pathname || '';
                    const match = path.match(/\/data-manager\/data\/(\d+)/);
                    const openedId = match ? String(match[1]) : null;
                    const key = 'unreadFileNotes';
                    const raw = localStorage.getItem(key);
                    const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw).map(String) : [];
                    if (openedId && String(openedId) === String(template.fileNote_id)) {
                        // Đang đứng đúng filenote vừa chạy xong ⇒ refresh
                        await fetchData();
                    } else if (!openedId || String(openedId) !== String(template.fileNote_id)) {
                        const s = new Set(list);
                        s.add(String(template.fileNote_id));
                        localStorage.setItem(key, JSON.stringify(Array.from(s)));
                    }
                } catch (_) { }
            } else {
                message.error(`Batch run thất bại: ${result.message}`);
            }
        } catch (error) {
            console.error('Lỗi khi chạy batch:', error);
            message.error('Có lỗi khi chạy batch');
        } finally {
            setIsBatchRunning(false);
            setRunningStep(null); // Clear running step when batch completes
            setRunningFileNotes(prev => {
                const newSet = new Set(prev);
                newSet.delete(String(idFileNote));
                return newSet;
            }); // Remove from running files list
        }
    };

    // Hàm lưu dữ liệu vào database (phiên bản đơn giản)
    const saveDataToDatabase = async (data, templateId, currentStepId) => {
        if (!data || data.length === 0) {
            console.warn('Không có dữ liệu để lưu');
            return false;
        }

        try {
            const batchSize = 5000;
            const totalBatches = Math.ceil(data.length / batchSize);

            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                const batchData = {
                    tableId: templateId,
                    data: batch,
                    ...(currentStepId && currentStepId > 1 && { version: currentStepId }),
                };

                await createBathTemplateRow(batchData);
            }
            return true;
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu:', error);
            return false;
        }
    };

    // Các hàm fetch data cho từng loại kết nối
    const fetchGoogleSheetData = async (firstStep) => {
        try {
            if (!firstStep.config?.googleSheetUrl?.trim()) {
                console.warn('Không có URL Google Sheet');
                return false;
            }
            const res = await n8nWebhook({ urlSheet: firstStep.config.googleSheetUrl, email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com' });
            console.log('Response từ N8N Google Sheet:', res);

            if (Array.isArray(res) && res.length > 0) {
                const firstResp = res[0];
                let headerRow = Array.isArray(firstResp.headers) ? firstResp.headers : [];
                let dataRows = [];

                if (Array.isArray(firstResp.rows) && firstResp.rows.length > 0) {
                    // Ưu tiên cấu hình người dùng nếu có (1-based)
                    const cfgIndexRaw = Number.parseInt(firstStep?.config?.googleSheetsHeaderRow, 10);
                    const hasCfgIndex = Number.isFinite(cfgIndexRaw);
                    if (hasCfgIndex) {
                        const headerIndexFromConfig = cfgIndexRaw - 1; // 1-based -> 0-based
                        const safeIndex = Math.max(0, Math.min(firstResp.rows.length - 1, headerIndexFromConfig));
                        headerRow = firstResp.rows[safeIndex]?.data || [];
                        dataRows = firstResp.rows
                            .slice(safeIndex + 1)
                            .filter(r => !r.isEmpty && Array.isArray(r.data))
                            .map(r => r.data);
                    } else {
                        // Fallback: dùng detectedHeaderRow nếu không có cấu hình
                        if (headerRow.length === 0) {
                            const detectedHeaderRow = typeof firstResp.detectedHeaderRow === 'number' ? firstResp.detectedHeaderRow : 1; // 1-based
                            const fallbackIndex = detectedHeaderRow - 1;
                            const safeIndex = Math.max(0, Math.min(firstResp.rows.length - 1, fallbackIndex));
                            headerRow = firstResp.rows[safeIndex]?.data || [];
                            dataRows = firstResp.rows
                                .slice(safeIndex + 1)
                                .filter(r => !r.isEmpty && Array.isArray(r.data))
                                .map(r => r.data);
                        } else {
                            dataRows = firstResp.rows
                                .filter(r => !r.isEmpty && !r.isDetectedHeader && Array.isArray(r.data))
                                .map(r => r.data);
                        }
                    }
                } else if (Array.isArray(firstResp.data)) {
                    const cfgIndexRaw = Number.parseInt(firstStep?.config?.googleSheetsHeaderRow, 10);
                    const headerRowIndex = Number.isFinite(cfgIndexRaw) ? (cfgIndexRaw - 1) : 0;
                    const safeIndex = Math.max(0, Math.min(firstResp.data.length - 1, headerRowIndex));
                    headerRow = firstResp.data[safeIndex] || [];
                    dataRows = firstResp.data.slice(safeIndex + 1);
                }

                if (!Array.isArray(headerRow) || headerRow.length === 0 || !Array.isArray(dataRows)) {
                    console.warn('Không lấy được dữ liệu từ Google Sheet');
                    return false;
                }

                const data = dataRows.map(row => {
                    const newRow = {};
                    headerRow.forEach((header, index) => {
                        newRow[header] = row?.[index];
                    });
                    return newRow;
                });

                // Thay thế dữ liệu trong database
                await deleteTemplateRowByTableId(template.id);
                const success = await saveDataToDatabase(data, template.id, 1);

                if (success) {
                    // Cập nhật cấu hình step với lastUpdate và outputColumns mới
                    const newOutputColumns = headerRow.map(header => ({
                        name: header,
                        type: 'text',
                    }));

                    const updatedSteps = template.steps.map(step =>
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

                    // Cập nhật template với steps mới
                    const updatedTemplate = { ...template, steps: updatedSteps };
                    await updateTemplateTable(updatedTemplate);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Lỗi khi fetch Google Sheet data:', error);
            return false;
        }
    };

    const fetchGoogleDriveData = async (firstStep) => {
        try {
            // Multi-file Google Drive import
            if (firstStep?.config?.googleDriveMultiFiles && Array.isArray(firstStep.config.googleDriveFilesInfo) && firstStep.config.googleDriveFilesInfo.length > 0) {
                const filesInfo = [...firstStep.config.googleDriveFilesInfo].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
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
                        mergedRows.push(obj);
                    }
                }

                const allHeaders = Array.from(allHeadersSet);
                if (allHeaders.length === 0 || mergedRows.length === 0) {
                    console.warn('Không lấy được dữ liệu từ các file đã chọn.');
                    return false;
                }

                // Replace data in database
                await deleteTemplateRowByTableId(template.id);
                const success = await saveDataToDatabase(mergedRows, template.id, 1);
                if (success) {
                    const newOutputColumns = allHeaders.map(h => ({ name: h, type: 'text' }));
                    const updatedSteps = template.steps.map(step =>
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
                                    googleDriveOrder: filesInfo.map(f => ({ id: f.id, order: Number(f.order || 0) })),
                                },
                                needUpdate: false,
                            }
                            : step,
                    );

                    const updatedTemplate = { ...template, steps: updatedSteps };
                    await updateTemplateTable(updatedTemplate);
                    return true;
                }
                return false;
            }

            if (!firstStep.config?.googleDriveFileId?.trim()) {
                console.warn('Không có File ID Google Drive');
                return false;
            }

            const res = await n8nWebhookGoogleDrive({
                googleDriveUrl: firstStep.config.googleDriveFileId,
                email_import: currentSchemaPathRecord?.email_import || 'gateway@xichtho-vn.com'

            });

            if (res && res.success && res.sheets && Array.isArray(res.sheetNames)) {
                // New backend response: { success, sheets: { name: { data: matrix } }, sheetNames }
                const selectedSheet = firstStep.config?.googleDriveSheet || res.sheetNames[0];
                const sheetData = res.sheets[selectedSheet];

                if (!sheetData || !Array.isArray(sheetData.data)) {
                    console.warn('Không có dữ liệu trong sheet được chọn');
                    return false;
                }

                const matrix = sheetData.data;
                const headerRowIndex = typeof firstStep.config?.googleDriveHeaderRow === 'number' ? firstStep.config.googleDriveHeaderRow : 0;

                if (headerRowIndex >= matrix.length) {
                    console.warn('Hàng tiêu đề không hợp lệ');
                    return false;
                }

                const headerRow = matrix[headerRowIndex] || [];
                const dataRows = matrix.slice(headerRowIndex + 1);

                if (!Array.isArray(headerRow) || headerRow.length === 0 || !Array.isArray(dataRows)) {
                    console.warn('Không lấy được dữ liệu từ Google Drive');
                    return false;
                }

                // Xử lý dữ liệu theo cấu trúc mới
                const data = dataRows.map(row => {
                    const newRow = {};
                    headerRow.forEach((header, index) => {
                        newRow[header] = row?.[index];
                    });
                    return newRow;
                });

                // Thay thế dữ liệu trong database
                await deleteTemplateRowByTableId(template.id);
                const success = await saveDataToDatabase(data, template.id, 1);

                if (success) {
                    // Cập nhật cấu hình step với lastUpdate và outputColumns mới
                    const newOutputColumns = headerRow.map(header => ({
                        name: header,
                        type: 'text',
                    }));

                    const updatedSteps = template.steps.map(step =>
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

                    // Cập nhật template với steps mới
                    const updatedTemplate = { ...template, steps: updatedSteps };
                    await updateTemplateTable(updatedTemplate);

                    return true;
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

                    // Thay thế dữ liệu trong database
                    await deleteTemplateRowByTableId(template.id);
                    const success = await saveDataToDatabase(data, template.id, 1);

                    if (success) {
                        const newOutputColumns = headerRow.map(header => ({
                            name: header,
                            type: 'text',
                        }));

                        const updatedSteps = template.steps.map(step =>
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

                        const updatedTemplate = { ...template, steps: updatedSteps };
                        await updateTemplateTable(updatedTemplate);

                        return true;
                    }
                }
            }
            return false;
        } catch (error) {
            console.error('Lỗi khi fetch Google Drive data:', error);
            return false;
        }
    };

    const fetchPostgresData = async (firstStep) => {
        try {
            if (!firstStep.config?.postgresConfig) {
                console.warn('Không có cấu hình PostgreSQL');
                return false;
            }

            const res = await postgresService.getTableData(firstStep.config.postgresConfig);
            if (Array.isArray(res) && res.length > 0) {
                // Thay thế dữ liệu trong database
                await deleteTemplateRowByTableId(template.id);
                const success = await saveDataToDatabase(res, template.id, 1);

                if (success) {
                    // Cập nhật cấu hình step với lastUpdate
                    const updatedSteps = template.steps.map(step =>
                        step.id === firstStep.id
                            ? {
                                ...step,
                                config: {
                                    ...step.config,
                                    lastUpdate: new Date().toISOString(),
                                },
                            }
                            : step,
                    );

                    // Cập nhật template với steps mới
                    const updatedTemplate = { ...template, steps: updatedSteps };
                    await updateTemplateTable(updatedTemplate);

                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Lỗi khi fetch PostgreSQL data:', error);
            return false;
        }
    };

    const fetchApiData = async (firstStep) => {
        try {
            if (!firstStep.config?.apiUrl) {
                console.warn('Không có URL API');
                return false;
            }

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
                processedData = [data];
            }

            if (processedData.length > 0) {
                // Thay thế dữ liệu trong database
                await deleteTemplateRowByTableId(template.id);
                const success = await saveDataToDatabase(processedData, template.id, 1);

                if (success) {
                    // Cập nhật cấu hình step với lastUpdate
                    const updatedSteps = template.steps.map(step =>
                        step.id === firstStep.id
                            ? {
                                ...step,
                                config: {
                                    ...step.config,
                                    lastUpdate: new Date().toISOString(),
                                },
                            }
                            : step,
                    );

                    // Cập nhật template với steps mới
                    const updatedTemplate = { ...template, steps: updatedSteps };
                    await updateTemplateTable(updatedTemplate);

                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Lỗi khi fetch API data:', error);
            return false;
        }
    };

    // Handler để đồng bộ dữ liệu và chạy tất cả steps
    const handleSyncAndRunAll = async () => {
        if (!template || !template.steps || template.steps.length <= 1) {
            message.warning('Không có steps để chạy');
            return;
        }

        // Kiểm tra loại kết nối của step đầu tiên (Upload Data)
        const firstStep = template.steps.find(step => step.type == 12); // Upload Data
        if (!firstStep || !firstStep.config) {
            message.warning('Không tìm thấy cấu hình Upload Data');
            return;
        }

        // Các loại kết nối được hỗ trợ cho chức năng đồng bộ
        const supportedConnectionTypes = ['googleSheets', 'googleDrive', 'postgresql', 'apiConnector'];

        if (!supportedConnectionTypes.includes(firstStep.config.uploadType)) {
            message.warning(`Chức năng đồng bộ chỉ hỗ trợ: Google Sheets, Google Drive, PostgreSQL, và API Connector. Loại hiện tại: ${firstStep.config.uploadType}`);
            return;
        }

        setIsBatchRunning(true);
        setRunningStep('batch'); // Set running step for sidebar loading indicator
        setCurrentFileNoteId(idFileNote); // Set current file note ID for sidebar loading indicator
        setRunningFileNotes(prev => new Set([...prev, String(idFileNote)])); // Add to running files list
        try {
            // Log danh sách steps sẽ chạy
            try {
                const stepsToRun = (template?.steps || []).filter(s => s && s.type !== 12);
                console.log('[SyncAndRunAll] Start', {
                    fileNoteId: template?.fileNote_id,
                    templateId: template?.id,
                    totalSteps: (template?.steps || []).length,
                    stepsToRunIds: stepsToRun.map(s => s.id),
                    stepsToRunTypes: stepsToRun.map(s => s.type),
                    connectionType: firstStep.config.uploadType,
                });
            } catch (e) { }

            message.info(`Đang đồng bộ dữ liệu mới nhất từ ${firstStep.config.uploadType} và chạy lại toàn bộ các bước...`);

            // Bước 1: Kéo dữ liệu mới nhất từ nguồn dữ liệu
            try {

                let fetchSuccess = false;

                switch (firstStep.config.uploadType) {
                    case 'googleSheets':
                        fetchSuccess = await fetchGoogleSheetData(firstStep);
                        break;
                    case 'googleDrive':
                        fetchSuccess = await fetchGoogleDriveData(firstStep);
                        break;
                    case 'postgresql':
                        fetchSuccess = await fetchPostgresData(firstStep);
                        break;
                    case 'apiConnector':
                        fetchSuccess = await fetchApiData(firstStep);
                        break;
                    default:
                        console.warn(`Không hỗ trợ fetch data cho loại: ${firstStep.config.uploadType}`);
                        // Fallback về reset template flow
                        await resetTemplateFlow(template.id);
                        fetchSuccess = true;
                }

                if (fetchSuccess) {
                    // Refresh dữ liệu sau khi fetch thành công
                    await fetchData();
                } else {
                    console.warn(`⚠️ Không thể kéo dữ liệu từ ${firstStep.config.uploadType}, tiếp tục với dữ liệu hiện tại...`);
                    message.warning(`Không thể kéo dữ liệu mới từ ${firstStep.config.uploadType}, tiếp tục với dữ liệu hiện tại...`);
                }
            } catch (fetchError) {
                console.warn('⚠️ Lỗi khi kéo dữ liệu mới:', fetchError.message);
                message.warning('Không thể kéo dữ liệu mới, tiếp tục với dữ liệu hiện tại...');
            }

            // Bước 2: Chạy lại tất cả các steps theo logic đã được lưu
            const result = await batchRunAllSteps(template.id, template.steps);

            if (result.success) {
                message.success(`Đã đồng bộ và chạy thành công ${result.completedSteps}/${result.totalSteps} steps trong ${result.processingTime}ms`);

                // Tắt chế độ test sau khi chạy thành công
                setIsTestMode(false);

                // Refresh dữ liệu sau khi batch run hoàn thành
                try {
                    // Lấy id filenote đang mở NGAY TẠI THỜI ĐIỂM này từ URL để tránh bị closure giữ id cũ
                    const path = window.location?.pathname || '';
                    const match = path.match(/\/data-manager\/data\/(\d+)/);
                    const openedId = match ? String(match[1]) : null;
                    const key = 'unreadFileNotes';
                    const raw = localStorage.getItem(key);
                    const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw).map(String) : [];
                    if (openedId && String(openedId) === String(template.fileNote_id)) {
                        // Đang đứng đúng filenote vừa chạy xong ⇒ refresh
                        await fetchData();
                    } else if (!openedId || String(openedId) !== String(template.fileNote_id)) {
                        const s = new Set(list);
                        s.add(String(template.fileNote_id));
                        localStorage.setItem(key, JSON.stringify(Array.from(s)));
                    }
                } catch (_) { }
            } else {
                message.error(`Đồng bộ và chạy thất bại: ${result.message}`);
            }
        } catch (error) {
            console.error('Lỗi khi đồng bộ và chạy batch:', error);
            message.error('Có lỗi khi đồng bộ và chạy batch');
        } finally {
            setIsBatchRunning(false);
            setRunningStep(null); // Clear running step when batch completes
            setRunningFileNotes(prev => {
                const newSet = new Set(prev);
                newSet.delete(String(idFileNote));
                return newSet;
            }); // Remove from running files list
        }
    };


    // Kiểm tra dataset lớn từ step 1 (Upload Data) - isTestMode luôn dựa vào step 1
    useEffect(() => {
        const checkLargeDataset = async () => {
            if (template && template.steps) {
                const step1 = template.steps.find(step => step.type == 12); // Upload Data
                const step1Data = await getTemplateRow(template.id, null, false, 1, 1);

                if (step1 && step1.config && step1Data) {
                    const isLargeDataset = step1Data?.count > 5000;

                    setHasLargeDataset(isLargeDataset);
                    setIsTestMode(isLargeDataset);

                } else {
                    // Nếu chưa có step 1 hoặc config, reset về false
                    setHasLargeDataset(false);
                    setIsTestMode(false);
                }
            }
        }
        checkLargeDataset();
    }, [template, totalRows]);

    // Handler để tắt filter lỗi
    const clearErrorFilter = () => {
        setIsErrorFilterActive(false);
    };

    // Function to completely clear error state (used when changing data sources)
    const clearErrorState = () => {
        setIsErrorFilterActive(false);
    };

    // Function to check if a step has errors (synchronous, uses cached state)
    const checkStepErrors = useCallback((step) => {
        return stepsWithErrors.has(step.id);
    }, [stepsWithErrors]);

    // Function to update steps with errors (called when data changes)
    const updateStepsWithErrors = useCallback(async () => {
        if (!template || !steps.length) return;

        const newStepsWithErrors = new Set();

        for (const step of steps) {
            // Only check calculation-based steps that can have errors
            if (![2, 5, 13, 14, 19].includes(step.type)) {
                continue;
            }

            // Only check if the step has been run (has status 'completed')
            if (step.status !== 'completed') {
                continue;
            }

            try {
                // Get the data for this step
                const stepDataResponse = await getTemplateRow(template.id, step.id, false);
                const stepData = stepDataResponse.rows || [];
                if (!stepData || stepData.length == 0) {
                    continue;
                }

                // Check if any row contains "ERROR" values
                const hasErrors = stepData.some(row => {
                    if (row.data) {
                        return Object.values(row.data).some(value => value == 'ERROR');
                    }
                    return false;
                });

                if (hasErrors) {
                    newStepsWithErrors.add(step.id);
                }
            } catch (error) {
                console.error('Error checking step errors:', error);
            }
        }

        setStepsWithErrors(newStepsWithErrors);
    }, [template, steps, getTemplateRow]);

    // Update steps with errors when steps or template changes
    useEffect(() => {
        updateStepsWithErrors();
    }, [updateStepsWithErrors]);

    // availableColumns dựa trên dữ liệu hiện tại, availableTables, referenceTableColumns demo
    const availableColumns = useMemo(() => {
        if (!rowData.length) return [];

        // Lấy tất cả columns từ tất cả các phần tử trong dữ liệu và giữ nguyên thứ tự
        const allColumns = [];

        rowData.forEach(row => {
            Object.keys(row).forEach(key => {
                if (key !== 'rowId' && !allColumns.includes(key)) { // Bỏ qua rowId và tránh trùng lặp
                    allColumns.push(key);
                }
            });
        });

        // Sắp xếp cột dựa theo outputColumns trong config của step hiện tại
        if (selectedStepId && steps.length > 0) {
            const currentStep = steps.find(step => step.id == selectedStepId);
            if (currentStep && currentStep.config && currentStep.config.outputColumns && Array.isArray(currentStep.config.outputColumns)) {
                // Lấy danh sách tên cột từ outputColumns
                const outputColumnNames = currentStep.config.outputColumns.map(col => {
                    if (typeof col == 'string') {
                        return col;
                    } else if (col && typeof col == 'object' && col.name) {
                        return col.name;
                    }
                    return null;
                }).filter(Boolean);

                // Sắp xếp: cột có trong outputColumns trước, theo thứ tự của outputColumns
                // Các cột không có trong outputColumns sẽ được thêm vào cuối
                const orderedColumns = [];
                const remainingColumns = [...allColumns];

                // Thêm các cột theo thứ tự outputColumns
                outputColumnNames.forEach(outputColName => {
                    if (allColumns.includes(outputColName)) {
                        orderedColumns.push(outputColName);
                        // Xóa khỏi danh sách còn lại
                        const index = remainingColumns.indexOf(outputColName);
                        if (index > -1) {
                            remainingColumns.splice(index, 1);
                        }
                    }
                });

                // Thêm các cột còn lại vào cuối
                orderedColumns.push(...remainingColumns);

                return orderedColumns;
            }
        }

        // Giữ nguyên thứ tự ban đầu nếu không có outputColumns
        return allColumns;
    }, [rowData, selectedStepId, steps]);

    // Function để lấy columns từ bước trước đó cho config
    const getInputColumnsForConfig = useCallback(async (inputStepId) => {
        if (!template || inputStepId == null || inputStepId == undefined) {
            return [];
        }

        try {
            const templateInfo = await getTemplateInfoByTableId(template.id);

            let data;

            // Nếu inputStepId là 0 hoặc 1, lấy dữ liệu gốc
            if (inputStepId == 0 || inputStepId == 1) {
                data = await getTemplateRow(template.id, null, false);
                data = data.rows || [];
            } else {
                // Lấy dữ liệu từ step được chỉ định
                data = await getTemplateRow(template.id, inputStepId, false);
                data = data.rows || [];
            }

            if (data && data.length > 0) {
                // Lấy tất cả columns từ tất cả các phần tử trong dữ liệu và giữ nguyên thứ tự
                const allColumns = [];

                data.forEach(row => {
                    if (row.data) {
                        Object.keys(row.data).forEach(key => {
                            if (key !== 'rowId' && !allColumns.includes(key)) { // Bỏ qua rowId và tránh trùng lặp
                                allColumns.push(key);
                            }
                        });
                    }
                });

                // Sắp xếp cột dựa theo outputColumns trong config của step hiện tại (nếu có)
                if (inputStepId && steps.length > 0) {
                    const currentStep = steps.find(step => step.id == inputStepId);
                    if (currentStep && currentStep.config && currentStep.config.outputColumns && Array.isArray(currentStep.config.outputColumns)) {
                        // Lấy danh sách tên cột từ outputColumns
                        const outputColumnNames = currentStep.config.outputColumns.map(col => {
                            if (typeof col == 'string') {
                                return col;
                            } else if (col && typeof col == 'object' && col.name) {
                                return col.name;
                            }
                            return null;
                        }).filter(Boolean);

                        // Sắp xếp: cột có trong outputColumns trước, theo thứ tự của outputColumns
                        // Các cột không có trong outputColumns sẽ được thêm vào cuối
                        const orderedColumns = [];
                        const remainingColumns = [...allColumns];

                        // Thêm các cột theo thứ tự outputColumns
                        outputColumnNames.forEach(outputColName => {
                            if (allColumns.includes(outputColName)) {
                                orderedColumns.push(outputColName);
                                // Xóa khỏi danh sách còn lại
                                const index = remainingColumns.indexOf(outputColName);
                                if (index > -1) {
                                    remainingColumns.splice(index, 1);
                                }
                            }
                        });

                        // Thêm các cột còn lại vào cuối
                        orderedColumns.push(...remainingColumns);

                        return orderedColumns;
                    }
                }

                // Giữ nguyên thứ tự ban đầu nếu không có outputColumns
                return allColumns;
            }
        } catch (error) {
            console.error('Lỗi khi lấy inputColumns cho config:', error);
        }

        return [];
    }, [template]);

    // Function để export dữ liệu step thành Excel
    const handleExportStepData = async () => {
        if (!template || !selectedStepId) {
            message.warning('Vui lòng chọn step để export');
            return;
        }

        setIsExporting(true);
        try {

            // Lấy thông tin preview trước
            const preview = await getStepExportPreview(template.id, selectedStepId);

            if (!preview.success || preview.data.totalRows === 0) {
                message.warning('Không có dữ liệu để export');
                return;
            }

            // Export dữ liệu
            const result = await exportStepDataToExcel(template.id, selectedStepId);

            if (result.success) {
                message.success(`Tải xuống thành công! File: ${result.fileName}`);
            }

        } catch (error) {
            console.error('❌ handleExportStepData - Error:', error);
            message.error(error.message || 'Lỗi khi tải xuống file Excel');
        } finally {
            setIsExporting(false);
        }
    };

    // Cập nhật inputColumns khi rowData thay đổi (fallback)
    useEffect(() => {
        if (rowData && rowData.length > 0 && (!inputColumns || inputColumns.length == 0)) {
            // Lấy columns từ rowData nếu inputColumns vẫn rỗng và giữ nguyên thứ tự
            const allColumns = [];
            rowData.forEach(row => {
                Object.keys(row).forEach(key => {
                    if (key !== 'rowId' && !allColumns.includes(key)) { // Bỏ qua rowId và tránh trùng lặp
                        allColumns.push(key);
                    }
                });
            });

            // Sắp xếp cột dựa theo outputColumns trong config của step hiện tại (nếu có)
            if (selectedStepId && steps.length > 0) {
                const currentStep = steps.find(step => step.id == selectedStepId);
                if (currentStep && currentStep.config && currentStep.config.outputColumns && Array.isArray(currentStep.config.outputColumns)) {
                    // Lấy danh sách tên cột từ outputColumns
                    const outputColumnNames = currentStep.config.outputColumns.map(col => {
                        if (typeof col == 'string') {
                            return col;
                        } else if (col && typeof col == 'object' && col.name) {
                            return col.name;
                        }
                        return null;
                    }).filter(Boolean);

                    // Sắp xếp: cột có trong outputColumns trước, theo thứ tự của outputColumns
                    // Các cột không có trong outputColumns sẽ được thêm vào cuối
                    const orderedColumns = [];
                    const remainingColumns = [...allColumns];

                    // Thêm các cột theo thứ tự outputColumns
                    outputColumnNames.forEach(outputColName => {
                        if (allColumns.includes(outputColName)) {
                            orderedColumns.push(outputColName);
                            // Xóa khỏi danh sách còn lại
                            const index = remainingColumns.indexOf(outputColName);
                            if (index > -1) {
                                remainingColumns.splice(index, 1);
                            }
                        }
                    });

                    // Thêm các cột còn lại vào cuối
                    orderedColumns.push(...remainingColumns);

                    setInputColumns(orderedColumns);
                    return;
                }
            }

            setInputColumns(allColumns);
        }
    }, [rowData, inputColumns, selectedStepId, steps]);
    useEffect(() => {
        if (!selectedStepId) return;
        const container = versionStripRef.current;
        if (!container) return;
        // Đợi DOM cập nhật list button
        const to = setTimeout(() => {
            const btn = document.getElementById(`version-btn-${selectedStepId}`);
            if (btn && typeof btn.scrollIntoView === 'function') {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else if (btn && container) {
                // Fallback tính toán thủ công
                const btnRect = btn.getBoundingClientRect();
                const contRect = container.getBoundingClientRect();
                const offset = (btnRect.left + btnRect.right) / 2 - (contRect.left + contRect.right) / 2;
                container.scrollBy({ left: offset, behavior: 'smooth' });
            }
        }, 0);
        return () => clearTimeout(to);
    }, [selectedStepId, steps, idFileNote]);
    // Reset scroll and recompute arrows when switching file
    useEffect(() => {
        const el = versionStripRef.current;
        if (!el) return;
        // Reset to start for new file's versions list
        el.scrollLeft = 0;
        // setCanScrollRight(false);
        const recompute = () => {
            const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
            const hasOverflow = maxScroll > 0;
            const left = el.scrollLeft;
            const epsilon = 1;
            const atStart = left <= epsilon;
            const atEnd = left >= maxScroll - epsilon;
            setCanScrollLeft(hasOverflow && !atStart);
            setCanScrollRight(hasOverflow && !atEnd);
        };

        // Recompute on next frame and shortly after to catch DOM updates
        const rafId = requestAnimationFrame(recompute);
        const to = setTimeout(recompute, 60);
        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(to);
        };
    }, [idFileNote]);
    const referenceTableColumns = ['ref_id', 'ref_name', 'ref_value'];

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Breadcrumb
                        style={{ fontWeight: 'bold', fontSize: 17, color: theme == 'dark' ? '#fff' : '#495057' }}
                        items={[
                            {
                                title: <span style={{ color: theme == 'dark' ? '#fff' : '#495057' }}>{fileNote?.name || 'Tên file'}</span> || 'Tên file',
                            },
                            ...(selectedStepId && selectedStepId !== 1 ? [{
                                title: <span style={{ color: theme == 'dark' ? '#fff' : '#495057' }}>Version {selectedStepId}{isStepPublished(selectedStepId) ? ' (published)' : ''}</span>,
                            }] : []),
                        ]}
                    />

                    {/* Nút Chạy tất cả - hiển thị khi có dataset lớn */}

                    {template && template.steps && template.steps.length > 1 && (() => {
                        // Kiểm tra loại kết nối của step đầu tiên (Upload Data)
                        const firstStep = template.steps.find(step => step.type == 12); // Upload Data
                        const supportedConnectionTypes = ['googleSheets', 'googleDrive', 'postgresql', 'apiConnector'];
                        const isSupportedConnection = firstStep && firstStep.config && supportedConnectionTypes.includes(firstStep.config.uploadType);

                        if (!isSupportedConnection) {
                            return null; // Không hiển thị nút nếu không hỗ trợ loại kết nối này
                        }

                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {hasLargeDataset && <Tag color="orange">Preview</Tag>}
                                <Tooltip title="Đồng bộ dữ liệu mới nhất, sau đó chạy tuần tự  tất cả các bước xử lý dữ liệu">
                                    <Button

                                        type="default"

                                        size="small"
                                        loading={isBatchRunning && runningFileNotes.has(String(idFileNote))}
                                        onClick={handleSyncAndRunAll}
                                        style={{
                                            borderColor: '#4092F8',
                                            color: '#4092F8',

                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {isBatchRunning && runningFileNotes.has(String(idFileNote)) ? 'Đang chạy...' : 'Đồng bộ Data và Chạy toàn bộ'}
                                    </Button>
                                </Tooltip>
                            </div>
                        );
                    })()}

                    {
                        // hasLargeDataset && 
                        template && template.steps && template.steps.length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Tooltip title="Thực hiện chạy tuần tự tất cả các bước xử lý dữ liệu nhưng không thay đổi dữ liệu gốc">
                                    <Button

                                        type="default"
                                        color="primary"
                                        size="small"
                                        loading={isBatchRunning && runningFileNotes.has(String(idFileNote))}
                                        onClick={handleBatchRunAll}
                                        style={{
                                            borderColor: '#4092F8',
                                            color: '#4092F8',

                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {isBatchRunning && runningFileNotes.has(String(idFileNote)) ? 'Đang chạy...' : 'Chạy toàn bộ'}
                                    </Button>
                                </Tooltip>
                            </div>
                        )}
                </div>
                {/* Last Update và Autorun Switch - chỉ hiển thị khi có steps */}
                {template && template.steps && template.steps.length > 0 && (
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: theme == 'dark' ? '#3f4853' : '#f8f9fa',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'start',
                        alignItems: 'center',
                        gap: 10
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {hasNewDataUpdate &&
                                <Button
                                      type="default"
                                    onClick={handleRefreshData}
                                    icon={<RedoOutlined  />}
                                >
                                    Refresh dữ liệu
                                </Button>
                            }

                            <Button
                                type="default"
                                danger
                                icon={<RedoOutlined style={{ color: '#fa0303' }} />}
                                onClick={() => {
                                    setResetModalVisible(true);
                                    setResetConfirmText('');
                                }}

                            >
                                Reset luồng
                            </Button>
                            <button
                                className={`${css.buttonAction}`}
                                style={{ backgroundColor: theme == 'dark' ? 'rgb(90, 113, 145)' : '', color: theme == 'dark' ? '#fff' : '#000000e0' }}
                                onClick={() => {
                                    navigate('/process-guide/2/30')
                                }}
                            >HDSD</button>
                            <span style={{ fontWeight: 500, color: theme == 'dark' ? '#fff' : '#495057' }}>Last Update:</span>
                            <span style={{ color: theme == 'dark' ? '#fff' : '#6c757d' }}>
                                {(() => {
                                    // Tìm thời gian cập nhật gần nhất từ tất cả các step
                                    let latestUpdateTime = null;

                                    if (template.steps && template.steps.length > 0) {
                                        template.steps.forEach(step => {
                                            let stepUpdateTime = null;

                                            // Kiểm tra config.lastUpdate của step (nếu có)
                                            if (step.config && step.config.lastUpdate) {
                                                stepUpdateTime = new Date(step.config.lastUpdate);
                                            }
                                            // Kiểm tra config.lastRunTimestamp của step (nếu có)
                                            else if (step.config && step.config.lastRunTimestamp) {
                                                stepUpdateTime = new Date(step.config.lastRunTimestamp);
                                            }

                                            // Cập nhật thời gian gần nhất
                                            if (stepUpdateTime && (!latestUpdateTime || stepUpdateTime > latestUpdateTime)) {
                                                latestUpdateTime = stepUpdateTime;
                                            }
                                        });
                                    }

                                    // Nếu không có thời gian cập nhật từ steps, sử dụng lastUpdateTime
                                    if (!latestUpdateTime && lastUpdateTime) {
                                        latestUpdateTime = new Date(lastUpdateTime);
                                    }

                                    return latestUpdateTime ?
                                        latestUpdateTime.toLocaleString('vi-VN') :
                                        'Chưa có cập nhật';
                                })()}
                            </span>
                        </div>

                        {/* Chỉ hiển thị Switch Autorun khi step đầu tiên là loại được hỗ trợ và không có AI steps */}
                        {(() => {
                            // Kiểm tra xem step đầu tiên có phải là loại được hỗ trợ không
                            const firstStep = template.steps.find(step => step.type == 12); // Upload Data
                            if (!firstStep || !firstStep.config) {
                                return null;
                            }

                            // Các loại step được hỗ trợ cho autorun
                            const supportedTypes = ['googleSheets', 'postgresql', 'apiConnector', 'system', 'googleDrive'];

                            if (!supportedTypes.includes(firstStep.config.uploadType)) {
                                return null;
                            }

                            // // Kiểm tra xem có step AI Audit (type 15) hoặc AI textgen không
                            // const hasAISteps = template.steps.some(step => {
                            //     // AI Audit (type 15) hoặc AI textgen (có thể là type khác, cần kiểm tra thêm)
                            //     return step.type === 15 ||
                            //         (step.type === 21 && step.config?.aiPrompt); // AI Transformer với aiPrompt
                            // });

                            // if (hasAISteps) {
                            //     return null; // Không hiển thị autorun nếu có AI steps
                            // }

                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 500, color: theme == 'dark' ? '#fff' : '#495057' }}>Autorun:</span>
                                    <Switch
                                        checked={autorun}
                                        onChange={handleAutorunChange}
                                        checkedChildren="Khóa"
                                        unCheckedChildren="Mở"
                                        style={{ backgroundColor: autorun ? '#52c41a' : '#d9d9d9' }}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>


            <PipelineSteps
                steps={steps}
                onChange={handleUpdateSteps}
                availableColumns={inputColumns} // Thay đổi từ availableColumns sang inputColumns
                availableTables={availableTables}
                referenceTableColumns={referenceTableColumns}
                templateData={template}
                onDataUpdate={handleDataUpdate}
                onStepClick={handleStepClick}
                checkRunningStep={setRunningStep}
                update={fetchData}
                hasData={(() => {
                    // Kiểm tra step 1 (Upload Data) có dữ liệu hay không
                    const step1 = steps.find(step => step.type == 12); // Type 12 = Upload Data
                    if (!step1) {
                        return false; // Chưa có step Upload Data
                    }

                    // Kiểm tra step 1 đã completed và có dữ liệu
                    if (step1.status == 'completed') {
                        return true; // Step 1 đã hoàn thành = có dữ liệu
                    }

                    // Nếu step 1 chưa completed, kiểm tra có config dữ liệu không
                    const config = step1.config;
                    if (!config) return false;

                    // Kiểm tra từng loại upload có dữ liệu không
                    const hasUploadData = (
                        (config.excelData && config.excelData.length > 0) ||
                        (config.googleSheetsData && config.googleSheetsData.length > 0) ||
                        (config.googleDriveData && config.googleDriveData.length > 0) ||
                        (config.postgresData && config.postgresData.length > 0) ||
                        (config.apiData && config.apiData.length > 0) ||
                        (config.systemData && config.systemData.length > 0) ||
                        (config.uploadType == 'system' && config.systemConfig) // System import luôn có dữ liệu
                    );

                    return hasUploadData;
                })()}
                idFileNote={idFileNote}
                onStepStatusUpdate={(stepId, status) => {
                    const updatedSteps = steps.map(step =>
                        step.id == stepId ? { ...step, status } : step
                    );
                    handleUpdateSteps(updatedSteps);
                }}
                // Thêm callback để cập nhật inputColumns khi inputStepId thay đổi
                // onInputStepChange={async (inputStepId) => {
                //     const newInputColumns = await getInputColumnsForConfig(inputStepId);
                //     setInputColumns(newInputColumns);
                // }}
                // Truyền getTemplateRow để PipelineSteps có thể sử dụng
                getTemplateRow={getTemplateRow}
                // Callback khi step chạy xong
                onStepRunComplete={handleStepRunComplete}
                selectedStepId={selectedStepId}
                onErrorFilter={handleErrorFilter}
                checkStepErrors={checkStepErrors}
                autorun={autorun} // Truyền trạng thái autorun
                // Thêm props cho batch processing
                isTestMode={isTestMode}
                isBatchRunning={isBatchRunning}
                totalRows={totalRows}
                runningFileNotes={runningFileNotes}
                setRunningFileNotes={setRunningFileNotes}
            />
            {colDefs.length > 0 && rowData.length > 0 ? (
                <>
                    <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Input
                                placeholder="Tìm kiếm bảng"
                                value={searchQuery}
                                onChange={handleSearch}
                                style={{ width: 200 }}
                                className={theme == 'dark' ? css.darkInput : ''}
                                prefix={<SearchOutlined />}
                            />
                            <Button onClick={handleChangeStatusFilter}>
                                {isStatusFilter ? '❌ Tắt filter' : '✅ Bật filter'}
                            </Button>
                            <Button
                                onClick={() => {
                                    // Reset error state when going back to original data
                                    clearErrorState();
                                    navigate(`/data-manager/data/${idFileNote}`);
                                    setSelectedStepId(null);
                                    fetchData();
                                }}
                                type={selectedStepId == null || selectedStepId == 1 ? 'primary' : 'default'}
                                style={{ height: '32px' }}
                            >
                                Dữ liệu gốc / V1
                            </Button>

                            <Button
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    width: '16px',
                                    opacity: canScrollLeft ? 1 : 0,
                                    pointerEvents: canScrollLeft ? 'auto' : 'none',

                                }}
                                onClick={() => {
                                    const el = versionStripRef.current;
                                    if (el) el.scrollBy({ left: -100, behavior: 'smooth' });
                                }}
                                icon={<FaRegArrowAltCircleLeft size={16} color='#666' />}
                            />

                            <div ref={versionStripRef} style={{ width: '460px', overflowX: 'auto', display: 'flex', gap: 8, position: 'relative' }}
                                className={css.noScrollbar}>


                                {steps.slice(1).map((step) => (
                                    <Button
                                        key={step.id}
                                        id={`version-btn-${step.id}`}
                                        onClick={() => {
                                            // Reset error state when changing versions
                                            clearErrorState();
                                            handleStepClick(step.path || step.id);
                                        }}
                                        type={selectedStepId == step.id ? 'primary' : 'default'}
                                        style={{ height: '32px', width: 32 }}
                                    >
                                        V{step.id}
                                    </Button>
                                ))}


                            </div>

                            <Button
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    width: '16px',
                                    opacity: canScrollRight ? 1 : 0,
                                    pointerEvents: canScrollRight ? 'auto' : 'none',
                                    transition: 'opacity 0.3s ease-in-out',

                                }}
                                onClick={() => {
                                    const el = versionStripRef.current;
                                    if (el) el.scrollBy({ left: 100, behavior: 'smooth' });
                                }}
                                icon={<FaRegArrowAltCircleRight size={16} color='#666' />}
                            >
                            </Button>
                        </div>

                        {/* Hiển thị tổng số cột và số dòng */}
                        <div style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            fontSize: '12px',
                            color: theme == 'dark' ? '#fff' : '#666',
                            fontWeight: '500'
                        }}>
                            <span>
                                <strong>{totalColumns}</strong> cột
                            </span>
                            <span>
                                <strong>{isErrorFilterActive || searchQuery.trim() !== '' ? filteredData.length : totalRows}</strong> dòng
                                {(isErrorFilterActive || searchQuery.trim() !== '') && (
                                    <span style={{ color: '#1890ff', marginLeft: '4px' }}>
                                        (đã lọc)
                                    </span>
                                )}
                            </span>
                            {(() => {
                                // Kiểm tra step hiện tại có isTestData = true không
                                const currentStep = steps.find(step => step.id == selectedStepId);
                                const isTestData = currentStep && currentStep.config && currentStep.config.isTestData == true;

                                return isTestData && selectedStepId && selectedStepId > 1 ? (
                                    <span style={{
                                        marginLeft: 8,
                                        padding: '2px 6px',
                                        backgroundColor: '#1890ff',
                                        color: '#fff',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}>THỬ NGHIỆM
                                    </span>
                                ) : null;
                            })()}
                            {/* Hiển thị thông tin lỗi khi có lỗi */}
                            {errorFilter && (
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        color: '#ff4d4f',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: isErrorFilterActive ? '#fff2f0' : 'transparent',
                                        border: isErrorFilterActive ? '1px solid #ffccc7' : '1px solid transparent'
                                    }}
                                    onClick={() => {
                                        if (isErrorFilterActive) {
                                            clearErrorFilter();
                                        } else {
                                            handleErrorFilter();
                                        }
                                    }}
                                    title={isErrorFilterActive ? "Bấm để tắt filter lỗi" : "Bấm để xem các dòng lỗi"}
                                >
                                    <span>⚠️</span>
                                    <span>
                                        {errorFilter.errorCount} lỗi được phát hiện
                                    </span>
                                    {isErrorFilterActive && (
                                        <Button
                                            size="small"
                                            type="text"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearErrorFilter();
                                            }}
                                            style={{ padding: '0 4px', height: 'auto', color: '#ff4d4f' }}
                                        >
                                            ✕
                                        </Button>
                                    )}
                                </span>
                            )}
                            {selectedStepId && lastUpdateTime && (
                                <span style={{ color: theme == 'dark' ? '#fff' : '#495057' }}>
                                    Cập nhật: <strong style={{ color: theme == 'dark' ? '#fff' : '#495057' }}>
                                        {lastUpdateTime.toLocaleString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </strong>
                                </span>
                            )}
                            {/* Nút tải xuống Excel */}
                            {selectedStepId && (() => {
                                const currentStep = steps.find(step => step.id == selectedStepId);
                                const isCompleted = currentStep && currentStep.status == 'completed';
                                const isTestData = currentStep && currentStep.config && currentStep.config.isTestData == true;
                                const needUpdate = currentStep && currentStep.needUpdate == true;
                                const disabled = !isCompleted || isTestData || needUpdate;
                                return (
                                    <Tooltip title={disabled ? 'Chỉ cho phép tải khi step đã hoàn thành, không là dữ liệu test và không cần cập nhật' : 'Tải xuống dữ liệu step thành file Excel với đầy đủ dữ liệu'}>
                                        <Button
                                            type="primary"
                                            icon={<DownloadOutlined />}
                                            loading={isExporting}
                                            onClick={handleExportStepData}
                                            disabled={disabled}
                                            size="small"
                                            style={{
                                                backgroundColor: disabled ? undefined : '#52c41a',
                                                borderColor: disabled ? undefined : '#52c41a',
                                                color: disabled ? undefined : '#fff'
                                            }}
                                        >
                                            {isExporting ? 'Đang tải...' : 'Tải Excel'}
                                        </Button>
                                    </Tooltip>
                                );
                            })()}
                        </div>
                    </div>


                    <div className='ag-theme-quartz' style={{ width: '100%', height: 'calc(100% - 220px)', position: 'relative' }}>
                        {loadingRunningStep && (<div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: theme == 'dark' ? 'rgba(63, 72, 83, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 9999
                        }}>
                            <Loading3DTower />
                        </div>)}
                        <style>
                            {`
                            .custom-header-class {
                                overflow: hidden !important;
                                text-overflow: ellipsis !important;
                                white-space: nowrap !important;
                                max-width: 100% !important;
                            }
                        `}
                        </style>
                        {loading && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: theme == 'dark' ? 'rgba(63, 72, 83, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backdropFilter: 'blur(10px)',
                                zIndex: 9999
                            }}>
                                <Loading3DTower />
                            </div>
                        )}
                        {selectedStepId && rowData.length == 0 && !loading ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                fontSize: '16px',
                                color: '#666'
                            }}>
                                Bước này chưa được chạy
                            </div>
                        ) : (
                            <div
                                className={`ag-theme-quartz ${theme == 'dark' ? 'ag-theme-quartz-dark' : ''}`}
                                style={
                                    {
                                        width: '100%',
                                        height: '100%',

                                        ...theme == 'dark' ?
                                            {
                                                '--ag-background-color': '#1f2836',
                                                '--ag-foreground-color': '#ffffff',
                                                '--ag-header-background-color': '#2d3748',
                                                '--ag-header-foreground-color': '#ffffff',
                                                '--ag-row-hover-color': '#4a5568',
                                                '--ag-selected-row-background-color': '#3182ce',
                                                '--ag-border-color': '#4a5568',
                                                '--ag-cell-data-color': '#ffffff',
                                                '--ag-header-cell-text-color': '#ffffff'
                                            } : {}
                                    }
                                }
                            >
                                <AgGridReact
                                    rowData={filteredData}
                                    columnDefs={colDefs}
                                    defaultColDef={defaultColDef}
                                    animateRows={true}
                                    localeText={AG_GRID_LOCALE_VN}
                                    statusBar={statusBar}
                                    onColumnResized={onColumnResized}
                                    onColumnMoved={onColumnMoved}
                                    enableRangeSelection={true}

                                    onGridReady={(params) => {
                                        setGridApi(params.api);
                                        // Auto size all columns khi grid ready
                                        setTimeout(() => {
                                            params.api.autoSizeAllColumns({
                                                skipHeader: false,
                                                defaultMaxWidth: 200,
                                                defaultMinWidth: 80,
                                            });
                                        }, 100);
                                    }}
                                    onGridDestroyed={() => {
                                        setGridApi(null);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    {/* Pagination Controls */}
                    <div style={{
                        marginBottom: 8,
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                    }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: theme == 'dark' ? '#fff' : '#666' }}>
                                Hiển thị:
                            </span>
                            <Select
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                style={{ width: 150 }}
                                options={pageSizeOptions}
                            />
                            {pageSize < totalRows && (
                                <span style={{ fontSize: '12px', color: '#1890ff', fontStyle: 'italic' }}>
                                    (Preview - {pageSize} dòng đầu tiên)
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: theme == 'dark' ? '#fff' : '#666' }}>
                            <span style={{ fontSize: '14px', color: theme == 'dark' ? '#fff' : '#666' }}>
                                Trang {currentPage} / {Math.ceil(totalRows / pageSize) || 1}
                            </span>
                            <Pagination
                                style={{
                                    color: theme == 'dark' ? '#fff' : '#666',
                                }}
                                current={currentPage}
                                total={totalRows}
                                pageSize={pageSize}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                                showQuickJumper
                                showTotal={(total, range) =>
                                    <span style={{ color: theme == 'dark' ? '#fff' : '#666' }}>
                                        {range[0]}-{range[1]} của {total} dòng
                                    </span>
                                }
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div
                    className={`ag-theme-quartz ${theme == 'dark' ? 'ag-theme-quartz-dark' : ''} `}
                    style={{
                        width: '100%',
                        height: 'calc(100% - 220px)',
                        position: 'relative',
                        ...(theme == 'dark' ? {
                            '--ag-background-color': '#1f2836',
                            '--ag-foreground-color': '#ffffff',
                            '--ag-header-background-color': '#2d3748',
                            '--ag-header-foreground-color': '#ffffff',
                            '--ag-row-hover-color': '#4a5568',
                            '--ag-selected-row-background-color': '#3182ce',
                            '--ag-border-color': '#4a5568',
                            '--ag-font-size': '14px',
                            '--ag-header-font-size': '14px',
                            '--ag-font-weight': '500',
                            '--ag-header-font-weight': '600',
                            '--ag-cell-data-color': '#ffffff',
                            '--ag-header-cell-text-color': '#ffffff'
                        } : {})
                    }}
                >
                    {loadingRunningStep && (<div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: theme == 'dark' ? 'rgba(63, 72, 83, 0.95)' : 'rgba(249, 249, 249, 0.95)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                    }}>
                        <Loading3DTower />
                    </div>)}

                    {loading ? (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: theme == 'dark' ? 'rgba(63, 72, 83, 0.95)' : 'rgba(249, 249, 249, 0.95)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 9999
                        }}>
                            <Loading3DTower />
                        </div>


                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {(steps.length > 0 && rowData.length == 0) ?
                                'Chưa xử lý dữ liệu, vui lòng chạy tác vụ xử lý dữ liệu' :
                                (steps.length == 0 ? ' Vui lòng tạo kết nối dữ liệu ' : 'Đang tải...')}
                        </div>
                    )}
                </div>
            )
            }

            {/* Modal xác nhận reset luồng */}
            <Modal
                title="Reset luồng dữ liệu"
                open={resetModalVisible}
                onCancel={() => {
                    setResetModalVisible(false);
                    setResetConfirmText('');
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setResetModalVisible(false);
                            setResetConfirmText('');
                        }}
                    >
                        Hủy
                    </Button>,
                    <Button
                        key="confirm"
                        type="primary"
                        danger
                        disabled={resetConfirmText !== 'OK'}
                        onClick={() => {
                            setResetModalVisible(false);
                            handleResetFlow();
                        }}
                    >
                        Xác nhận Reset
                    </Button>
                ]}
                width={500}
            >
                <div style={{ marginBottom: 16 }}>
                    <p style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
                        <strong>Cảnh báo:</strong> Hành động này sẽ xóa sạch toàn bộ dữ liệu template bao gồm:
                    </p>
                    <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
                        <li>Dữ liệu trong các steps</li>
                        <li>Cấu hình cột</li>
                        <li>Các bước xử lý dữ liệu</li>
                    </ul>
                    <p style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
                        Dữ liệu sẽ quay về trạng thái ban đầu và không thể khôi phục.
                    </p>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Để xác nhận, vui lòng nhập <strong>"OK"</strong> vào ô bên dưới:
                    </label>
                    <Input
                        value={resetConfirmText}
                        onChange={(e) => setResetConfirmText(e.target.value)}
                        placeholder="Nhập OK để xác nhận"
                        onPressEnter={(e) => {
                            if (e.key === 'Enter' && e.target.value === 'OK') {
                                setResetModalVisible(false);
                                handleResetFlow();
                            }
                        }}
                        style={{ marginBottom: 8 }}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default ShowData;
