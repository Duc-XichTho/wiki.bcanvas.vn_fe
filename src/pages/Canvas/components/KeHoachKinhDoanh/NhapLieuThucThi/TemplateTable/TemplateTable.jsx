import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { evaluate } from 'mathjs';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { Button, Checkbox, Dropdown, message, Modal, Popconfirm, Table } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { ChevronDown } from 'lucide-react';
import css from '../../../../Daas/Content/Content.module.css';
import AG_GRID_LOCALE_VN from '../../../../../Home/AgridTable/locale.jsx';
import PopupDeleteRenderer from '../../../../../Home/SubStep/SubStepItem/SubStepSheet/popUpDelete/popUpDelete.jsx';
import SheetColumnSetting from '../../../../Daas/Content/Template/sheetColumnSetting/sheetColumnSetting.jsx';
import {
    createBathTemplateRow,
    createTemplateColumn,
    createTemplateRow,
    deleteTemplateRowByTableId,
    getTemplateColumn,
    getTemplateRow,
    updateColumnIndexes,
    updateTemplateColumnWidth,
    updateTemplateRow,
} from '../../../../../../apis/templateSettingService.jsx';
import Dragger from 'antd/es/upload/Dragger.js';
import { updateFileNotePad } from '../../../../../../apis/fileNotePadService.jsx';
import ActionChangeFilter from '../../../../../Home/AgridTable/actionButton/ActionChangeFilter.jsx';
import { IconUser } from '../../../../../../icon/IconSVG.js';
import { getAllUserClass } from '../../../../../../apis/userClassService.jsx';
import TemplateForm from '../../../../Daas/Content/Template/TemplateForm/TemplateForm.jsx';
import PopUpUploadFile from '../../../../../../components/UploadFile/PopUpUploadFile.jsx';
import SettingChart from '../../../../Daas/Content/Template/SettingChart/SettingChart.jsx';
import { MyContext } from '../../../../../../MyContext.jsx';

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);
const columnTypeOptions = [
    { value: 'text', label: 'Text', desc: 'Định dạng chữ, dùng để hiển thị các nội dung không phải số liệu, giá trị', type: 'Định dạng' },
    { value: 'number', label: 'Number', desc: 'Định dạng số, dùng để hiển thị các nội dung số liệu, giá trị', type: 'Định dạng' },
    { value: 'date', label: 'Date', desc: 'Định dạng thời gian DD/MM/YYYY hoặc MM/DD/YYYY và cài đặt đầu vào từ excel', type: 'Chức năng' },
    { value: 'select', label: 'Select',desc: 'Danh sách lựa chọn', type: 'Định dạng' },
    { value: 'formula', label: 'Công thức', desc: 'Tính toán giá trị từ các cột khác', type: 'Chức năng' },
    { value: 'file', label: 'Đính kèm', desc: 'Tải lên file ảnh, excel, pdf, word, ...', type: 'Định dạng' },
    { value: 'duyet', label: 'Xác nhận', desc: 'Cho phép nhóm người dùng cụ thể được xác nhận dòng', type: 'Chức năng'  },
    { value: 'conditional', label: 'Điều kiện', desc: 'Điều kiện', type: 'Chức năng' },
    { value: 'dateCalc', label: 'Tính Ngày', desc: 'Tính khoảng thời gian', type: 'Chức năng' },
    // { value: 'lookup', label: 'Lookup' },
    { value: 'duyet_dieu_kien', label: 'Duyệt', desc: 'Cho phép nhóm người dùng cụ thể được duyệt dòng khi thỏa mãn các điều kiện nhất định', type: 'Chức năng' },
    { value: 'bieu_tuong_phan_tram', label: 'Progress Bar', desc: 'Hiện thị số, giá trị theo dạng thanh ngang', type: 'Định dạng' },
    { value: 'date_time_picker', label: 'Date - Time (Ngày/Tháng/Năm - Giờ/Phút)', desc: 'Hiện thị thời gian dạng ngày, tháng, năm và giờ, phút', type: 'Định dạng' },
    { value: 'time_diff', label: 'Tính chênh lệch thời gian', desc: 'Tính chênh lệch thời gian giữa 2 cột', type: 'Định dạng' },
    { value: 'date_split', label: 'Tách ngày tháng năm', desc: 'Tách riêng ngày, tháng, năm từ 1 cột dạng Date', type: 'Chức năng' }];


const TemplateTable = ({ selectedCard }) => {
    const gridRef = useRef();
    const [showSettingsPopup, setShowSettingsPopup] = useState(false);
    const [fileNote, setFileNote] = useState(null);
    const [templateData, setTemplateData] = useState([]);
    const [templateColumns, setTemplateColumns] = useState([]);
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [dropdownOptions, setDropdownOptions] = useState({});
    const { currentUser, listUC_CANVAS, isUpdateNoti } = useContext(MyContext);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [importedData, setImportedData] = useState([]);
    const [importColumns, setImportColumns] = useState([]);
    const [isImportChoicePopoverVisible, setIsImportChoicePopoverVisible] = useState(false);
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
    useEffect(() => {
        getAllUserClass().then((data) => {
            setListUC(data.filter((e) => e.module == 'CANVAS'));
        });
    }, []);


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
                        },
                    ],
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





    const statusBar = useMemo(
        () => ({ statusPanels: [{ statusPanel: 'agAggregationComponent' }] }),
        []
    );

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
        XLSX.writeFile(
            workbook,
            `${fileNote && fileNote.name ? `Template_${fileNote.name}` : 'Template'}.xlsx`
        );
    };

    const handleFileUpload = (file) => {
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
                    .filter(
                        (columnName) => !headers.includes(columnName) && !['Thời gian', 'Ngày', 'Tháng', 'Năm'].includes(columnName)
                    );

                if (missingColumns.length > 0) {
                    message.error(`Thiếu các cột bắt buộc: ${missingColumns.join(', ')}`);
                    return;
                }

                const rows = jsonData.slice(1);

                const columns = headers.map((header) => ({
                    title: header,
                    dataIndex: header,
                    key: header,
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
                message.success('Đọc file thành công!', 2);
            }
        };
        reader.readAsArrayBuffer(file);
    };


    const handleImport = async () => {
        try {
            const highestId = rowData.reduce((max, item) => (item.id > max ? item.id : max), 0);
            const newRows = importedData.map((row, index) => {
                const newRow = {};
                templateColumns.forEach((column) => {
                    newRow[column.columnName] = row[column.columnName] || null;
                });
                newRow.id = highestId + index + 1;
                newRow['Thời gian'] = new Date(newRow['Năm'], newRow['Tháng'] - 1, newRow['Ngày']);
                return newRow;
            });
            for (const row of newRows) {
                await createTemplateRow({ tableId: templateData.id, data: row });
            }
            fetchData();
            toast.success('Import thành công!');
            setIsImportModalVisible(false);
            setImportedData([]);
            setImportColumns([]);
        } catch (error) {
            console.error('Lỗi khi import dữ liệu:', error);
            toast.error('Đã xảy ra lỗi khi import dữ liệu!');
        }
    };

    const showImportChoiceModal = () => {
        setIsImportChoicePopoverVisible(true);
    };

    const handleImportChoice = (choice) => {
        setIsImportChoicePopoverVisible(false);
        if (choice == 'overwrite') {
            deleteTemplateRowByTableId(templateData.id).then(() => {
                handleImport();
            });
        } else {
            handleImport();
        }
    };
    const importChoiceContent = (
        <div
            style={{
                width: '300px',
                height: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
            }}
        >
            <p>Bạn muốn ghi đè dữ liệu hiện tại hay thêm mới?</p>
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                }}
            >
                <Button
                    key="overwrite"
                    type="primary"
                    onClick={() => handleImportChoice('overwrite')}
                >
                    Ghi đè
                </Button>
                <Button key="add" type="primary" onClick={() => handleImportChoice('add')}>
                    Thêm mới
                </Button>
            </div>
        </div>
    );



    const closeImportModal = () => {
        setIsImportModalVisible(false);
        setImportedData([]);
        setImportColumns([]);
    };

    const showDuplicateColumnSelectorModal = () => {
        setShowDuplicateColumnSelector(true);
    };

    const items = [
        { key: '11', label: 'Xuất dữ liệu', onClick: exportToExcel, className: css.item_dropDown },
        { key: '22', label: 'Xuất Template', onClick: exportTemplateToExcel, className: css.item_dropDown },
        { key: '33', label: 'Import', onClick: () => setIsImportModalVisible(true), className: css.item_dropDown },
        {
            key: '44',
            label: 'Kiểm tra trùng lặp',
            onClick: showDuplicateColumnSelectorModal,
            className: css.item_dropDown
        },
        {
            key: '55',
            label: 'Bỏ kiểm tra trùng lặp',
            onClick: () => setDuplicateHighlightColumns([]),
            className: css.item_dropDown
        },
    ];

    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            cellStyle: {
                fontSize: '14.5px',
            },
            filter: false,
            suppressMenu: true,
        };
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedCard]);

    useEffect(() => {
        loadData();
    }, [templateData]);

    const getHeaderTemplate = (columnName) => {
        const isHighlighted = duplicateHighlightColumns.includes(columnName);
        return `<span>${columnName} ${isHighlighted ? '📌' : ''}</span>`;
    };

    useEffect(() => {
        const fetchColumn = async () => {
            try {
                let colDefs = [
                    {
                        headerName: 'STT',
                        field: 'rowId',
                        width: '40',
                        editable: false,
                        ...filter(),
                    },
                    {
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
                            return <PopupDeleteRenderer id={params.data.rowId} reload={loadData} />;
                        },
                        editable: false,
                    },
                ];

                const sortedColumns = [...templateColumns].sort(
                    (a, b) => (a.columnIndex || 0) - (b.columnIndex || 0)
                );

                for (const col of sortedColumns) {
                    const columnDef = {
                        headerName: col.columnName,
                        field: col.columnName,
                        width: col.columnWidth ? col.columnWidth : 100,
                        cellEditor: 'agTextCellEditor',
                        cellStyle: (params) => {
                            const styles = {
                                backgroundColor: col.bgColor || "#ffffff",
                                color: col.textColor || "#000000",
                            };

                            if (duplicateHighlightColumns.includes(col.columnName) && params.data) {
                                const fieldValue = params.value;
                                if (
                                    fieldValue !== null &&
                                    fieldValue !== undefined &&
                                    fieldValue !== ''
                                ) {
                                    const soLanXuatHien = rowData.filter(
                                        (row) => row[col.columnName] === fieldValue
                                    ).length;

                                    if (soLanXuatHien > 1) {
                                        styles.backgroundColor = '#FFF3CD';
                                        styles.color = '#856404';
                                        styles.fontWeight = 'bold';
                                    }
                                }
                            }

                            // Handle conditional column rendering
                            if (col.columnType === 'conditional' && params.data && col.conditionalOptions) {
                                const { sourceColumn, compareValue, displayText } = col.conditionalOptions;
                                if (sourceColumn && compareValue !== undefined && displayText && params.data[sourceColumn] === compareValue) {
                                    // Apply distinctive styling to highlight the conditional display
                                    styles.fontWeight = 'bold';
                                    styles.backgroundColor = '#E6F7FF';  // Light blue background
                                    styles.color = '#1890FF';            // Blue text
                                }
                            }

                            if (col.columnType === 'number' && col.columnName !== 'Năm') {
                                styles.textAlign = 'right';
                            }

                            return styles;
                        },
                        headerComponentParams: {
                            template: getHeaderTemplate(col.columnName),
                            onClick: (e) => {
                                e.stopPropagation();
                                toggleDuplicateHighlight(col.columnName);
                            },
                        },
                        editable: (params) => {
                            if (['Thời gian'].includes(col.columnName)) {
                                return false;
                            }
                            if (!params.data) return false;
                            const columnConfig = templateColumns.find(
                                (c) => c.columnName == params.colDef.field
                            );
                            if (!columnConfig) return true;
                            if (!columnConfig.editor?.restricted) return true;
                            return columnConfig.editor.users.includes(currentUser.email);
                        },
                        ...filter(),
                        valueGetter: (params) => {
                            if (col.columnType === 'conditional' && params.data && col.conditionalOptions) {
                                const { sourceColumn, compareValue, displayText } = col.conditionalOptions;
                                if (sourceColumn && compareValue !== undefined && params.data[sourceColumn] === compareValue) {
                                    return displayText;
                                }
                                return '';  // Return empty if condition not met
                            }
                            return params.data ? params.data[col.columnName] : '';
                        },
                    };

                    if (
                        col.columnType == 'select' ||
                        col.columnName == 'Ngày' ||
                        col.columnName == 'Tháng'
                    ) {
                        columnDef.cellEditor = 'agSelectCellEditor';
                        if (col.columnName == 'Ngày') {
                            columnDef.cellEditorParams = {
                                values: Array.from({ length: 31 }, (_, i) => i + 1),
                            };
                        } else if (col.columnName == 'Tháng') {
                            columnDef.cellEditorParams = {
                                values: Array.from({ length: 12 }, (_, i) => i + 1),
                            };
                        } else {
                            columnDef.cellEditorParams = {
                                values: col.selectOptions || [],
                            };
                        }
                    }

                    if (col.columnName == 'Năm') {
                        columnDef.cellEditor = 'agNumberCellEditor';
                        columnDef.valueParser = (params) => {
                            const value = Number(params.newValue);
                            return isNaN(value) ? null : value;
                        };
                        columnDef.cellEditorParams = {
                            min: 1900,
                            max: 3000,
                        };
                    }

                    const originalCellStyle = columnDef.cellStyle;

                    if (col.columnType == 'number' && col.columnName !== 'Năm') {
                        columnDef.cellEditor = 'agNumberCellEditor';
                        columnDef.valueFormatter = (params) => {
                            if (
                                params.value == null ||
                                params.value == undefined ||
                                params.value == 0
                            )
                                return '-';
                            return Number(params.value).toLocaleString('en-US', {
                                useGrouping: true,
                            });
                        };
                        columnDef.cellStyle = (params) => {
                            const originalStyles = originalCellStyle(params);
                            return {
                                ...originalStyles,
                                textAlign: 'right',
                            };
                        };
                        columnDef.valueParser = (params) => {
                            if (typeof params.newValue == 'string') {
                                const cleanValue = params.newValue.replace(/,/g, '');
                                return isNaN(parseFloat(cleanValue)) ? 0 : parseFloat(cleanValue);
                            }
                            return params.newValue;
                        };
                    }

                    if (col.columnType == 'select') {
                        columnDef.cellEditor = 'agSelectCellEditor';
                        columnDef.cellEditorParams = {
                            values: col.selectOptions || [],
                        };
                    }

                    if (col.columnType == 'file') {
                        columnDef.editable = false;
                        columnDef.cellRenderer = (params) => {
                            console.log('params', params);
                            return (
                                <>
                                    <PopUpUploadFile
                                        id={`PMVPLAN_${params.data.rowId}`}
                                        table={`PMVPLAN_Template`}
                                        onGridReady={loadData}
                                        card={'PMVPLAN'}
                                    />
                                </>
                            );
                        };
                    }

                    if (col.columnType == 'date') {
                        columnDef.cellRenderer = (params) => {
                            if (params.value) {
                                return params.value;
                            }
                            return '';
                        };

                        columnDef.cellEditor = 'agDateCellEditor';
                        columnDef.cellEditorParams = {
                            formatString: 'dd/MM/yyyy',
                            minDate: new Date('1900-01-01'),
                            maxDate: new Date('2100-12-31'),
                        };
                        columnDef.valueParser = (params) => {
                            return new Date(params.newValue);
                        };
                    }

                    if (col.columnType == 'formula') {
                        columnDef.cellEditor = 'agNumberCellEditor';
                        columnDef.aggFunc = 'sum';
                        columnDef.valueGetter = (params) => {
                            try {
                                const scope = col.selectFormula.variables.reduce((acc, curr) => {
                                    const key = Object.keys(curr)[0];
                                    const value = params.data[curr[key]];
                                    acc[key] =
                                        value == null || value == undefined
                                            ? 0
                                            : typeof value == 'string'
                                                ? value == '-'
                                                    ? 0
                                                    : isNaN(parseFloat(value.replace(/,/g, '')))
                                                        ? NaN
                                                        : parseFloat(value.replace(/,/g, ''))
                                                : Number(value);

                                    return acc;
                                }, {});

                                if (Object.values(scope).some((val) => isNaN(val))) {
                                    console.log(scope);
                                    return NaN;
                                }

                                const result = evaluate(col.selectFormula.formula, scope);
                                return isNaN(result) ? NaN : result;
                            } catch (error) {
                                console.error('Formula evaluation error:', error);
                                return NaN;
                            }
                        };
                        columnDef.valueFormatter = (params) => {
                            if (
                                params.value == null ||
                                params.value == undefined ||
                                isNaN(params.value)
                            ) {
                                return 'NaN';
                            }
                            return params.value.toLocaleString('en-US', {
                                useGrouping: true,
                            });
                        };
                        columnDef.valueParser = (params) => {
                            if (
                                params.newValue == null ||
                                params.newValue == undefined ||
                                params.newValue == ''
                            ) {
                                return NaN;
                            }
                            return Number(params.newValue.replace(/,/g, ''));
                        };

                        columnDef.editable = false;
                        columnDef.cellStyle = (params) => {
                            const originalStyles = originalCellStyle(params);
                            return {
                                ...originalStyles,
                                textAlign: 'right',
                            };
                        };
                    }

                    if (col.columnName == 'Thời gian') {
                        columnDef.valueGetter = (params) => {
                            if (!params.data) return '';
                            const day = params.data['Ngày'];
                            const month = params.data['Tháng'];
                            const year = params.data['Năm'];

                            if (!day || !month || !year) return '';

                            return `${day}/${month}/${year}`;
                        };
                        columnDef.editable = false;
                    }

                    if (col.columnType === 'duyet') {
                        columnDef.cellEditor = 'agSelectCellEditor';

                        // Default options for duyet column
                        const duyetOptions = ['Chưa Duyệt', 'Duyệt'];

                        columnDef.cellEditorParams = {
                            values: duyetOptions,
                        };

                        // Add cell renderer to show different colors based on value
                        columnDef.cellStyle = (params) => {
                            const originalStyles = originalCellStyle
                                ? originalCellStyle(params)
                                : {};

                            if (params.value === 'Duyệt') {
                                return {
                                    ...originalStyles,
                                    backgroundColor: '#e6f7e6', // Light green for approved
                                    color: '#008000',
                                    fontWeight: 'bold',
                                };
                            } else if (params.value === 'Chưa Duyệt') {
                                return {
                                    ...originalStyles,
                                    backgroundColor: '#fff3cd', // Light yellow for not approved
                                    color: '#856404',
                                };
                            }

                            return originalStyles;
                        };

                        // Check if user has permission to edit this cell
                        columnDef.editable = (params) => {
                            if (!params.data) return false;

                            // Get the column configuration
                            const columnConfig = templateColumns.find(
                                (c) => c.columnName === params.colDef.field
                            );

                            if (!columnConfig || !columnConfig.duyetOptions) return true;

                            // Check if current user's UC matches the allowed UC
                            const allowedUC = columnConfig.duyetOptions.selectedUC;

                            // If user is admin, they can always edit
                            if (currentUser.isAdmin) return true;

                            // Check if user has the UC that's allowed to edit
                            return listUC_CANVAS.some((uc) => uc.id === allowedUC);
                        };
                    }

                    if (col.columnType === 'conditional') {
                        // Make sure conditional columns are not editable
                        columnDef.editable = false;

                        // Override the valueGetter function with a more robust implementation
                        columnDef.valueGetter = (params) => {
                            if (!params.data) return '';

                            if (col.conditionalOptions) {
                                const { sourceColumn, compareValue, displayText } = col.conditionalOptions;

                                // Check if the source column exists in the data
                                if (sourceColumn && params.data) {
                                    let cellValue;

                                    // Special handling for Thời gian
                                    if (sourceColumn === 'Thời gian' && params.data['Ngày'] && params.data['Tháng'] && params.data['Năm']) {
                                        // Format Thời gian as "dd/mm/yyyy" for comparison
                                        cellValue = `${params.data['Ngày']}/${params.data['Tháng']}/${params.data['Năm']}`;
                                    } else {
                                        // Normal handling for other columns
                                        cellValue = params.data[sourceColumn];
                                    }

                                    // Convert both values to strings for comparison to handle different data types
                                    const cellValueStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
                                    const compareValueStr = compareValue !== null && compareValue !== undefined ? String(compareValue) : '';

                                    // Log values for debugging
                                    console.log(`Conditional column "${col.columnName}": comparing "${cellValueStr}" with "${compareValueStr}"`);

                                    // Compare as strings to handle different types
                                    if (cellValueStr === compareValueStr) {
                                        return displayText || '';
                                    }
                                }
                                return '';  // Return empty string if condition not met
                            }
                            return '';  // Default empty string
                        };
                    }

                    if (col.columnType === 'dateCalc') {
                        // Date calculation columns should not be editable
                        columnDef.editable = false;

                        // Function to parse a date from data
                        const getDateFromField = (params, fieldName) => {
                            if (!params.data || !fieldName) return null;

                            if (fieldName === 'Thời gian') {
                                // Handle special Thời gian field
                                const day = params.data['Ngày'];
                                const month = params.data['Tháng'];
                                const year = params.data['Năm'];

                                if (!day || !month || !year) return null;

                                return new Date(year, month - 1, day);
                            }

                            // Regular date field or specified date field
                            if (params.data[fieldName]) {
                                if (typeof params.data[fieldName] === 'string') {
                                    // Handle date string formats
                                    return new Date(params.data[fieldName]);
                                } else if (params.data[fieldName] instanceof Date) {
                                    // Handle Date objects
                                    return params.data[fieldName];
                                }
                            }

                            return null;
                        };

                        // Get a static date or today's date based on settings
                        const getStaticDate = (calcDateSettings, isStart) => {
                            if (isStart) {
                                if (calcDateSettings?.useStartToday) {
                                    return new Date();
                                } else if (calcDateSettings?.startDate) {
                                    return new Date(calcDateSettings.startDate);
                                }
                            } else {
                                if (calcDateSettings?.useEndToday) {
                                    return new Date();
                                } else if (calcDateSettings?.endDate) {
                                    return new Date(calcDateSettings.endDate);
                                }
                            }
                            return null;
                        };

                        // Define valueGetter for dateCalc
                        columnDef.valueGetter = (params) => {
                            if (!params.data || !col.selectCalcDate) return '';

                            // Get start date
                            let startDate = null;
                            if (col.selectCalcDate.useColumnDate && col.selectCalcDate.columnName) {
                                startDate = getDateFromField(params, col.selectCalcDate.columnName);
                            } else {
                                startDate = getStaticDate(col.selectCalcDate, true);
                            }

                            // Get end date
                            let endDate = null;
                            if (col.selectCalcDate.useEndDateColumn && col.selectCalcDate.endDateColumnName) {
                                endDate = getDateFromField(params, col.selectCalcDate.endDateColumnName);
                            } else {
                                endDate = getStaticDate(col.selectCalcDate, false);
                            }

                            // Calculate days difference
                            if (startDate && endDate) {
                                // Convert both dates to midnight for accurate day calculation
                                const d1 = new Date(startDate);
                                d1.setHours(0, 0, 0, 0);

                                const d2 = new Date(endDate);
                                d2.setHours(0, 0, 0, 0);

                                // Calculate difference in milliseconds and convert to days
                                const diffTime = d2.getTime() - d1.getTime();
                                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                                return diffDays;
                            }

                            return '';
                        };

                        // Format the display of the days difference
                        columnDef.valueFormatter = (params) => {
                            if (params.value === null || params.value === undefined || params.value === '') {
                                return '';
                            }

                            const days = Number(params.value);

                            if (isNaN(days)) {
                                return 'N/A';
                            }

                            return days > 0
                                ? `Còn ${days} ngày`
                                : days < 0
                                    ? `Quá ${Math.abs(days)} ngày`
                                    : 'Hôm nay';
                        };

                        // Add styling based on the value
                        const originalCellStyleFn = columnDef.cellStyle;
                        columnDef.cellStyle = (params) => {
                            const originalStyles = originalCellStyleFn ? originalCellStyleFn(params) : {};

                            if (!params.value && params.value !== 0) return originalStyles;

                            const days = Number(params.value);

                            if (isNaN(days)) return originalStyles;

                            if (days > 5) {
                                // Plenty of time left - green
                                return {
                                    ...originalStyles,
                                    backgroundColor: '#e6f7e6',
                                    color: '#008000',
                                };
                            } else if (days > 0) {
                                // Getting closer - yellow
                                return {
                                    ...originalStyles,
                                    backgroundColor: '#fff3cd',
                                    color: '#856404',
                                };
                            } else if (days === 0) {
                                // Today - blue
                                return {
                                    ...originalStyles,
                                    backgroundColor: '#cce5ff',
                                    color: '#004085',
                                    fontWeight: 'bold',
                                };
                            } else {
                                // Overdue - red
                                return {
                                    ...originalStyles,
                                    backgroundColor: '#f8d7da',
                                    color: '#721c24',
                                    fontWeight: 'bold',
                                };
                            }
                        };
                    }

                    colDefs.push(columnDef);
                }
                setColDefs(colDefs);
            } catch (e) {
                console.error('Error setting column definitions:', e);
                toast.error('Error setting up columns');
            }
        };

        fetchColumn();
    }, [templateColumns, isDataLoaded, duplicateHighlightColumns, isStatusFilter]);

    const fetchData = async () => {
        if (!selectedCard) return;
        try {
            console.log(selectedCard);
            const templateColumn = await getTemplateColumn(selectedCard?.id);
            const templateRow = await getTemplateRow(selectedCard?.id);

            console.log(templateColumn);
            setIsDataLoaded(true);
            setTemplateData(selectedCard);
            setTemplateColumns(templateColumn);
            loadData();
        } catch (e) {
            console.error(e);
            // toast.error('Lỗi khi lấy dữ liệu');
        }
    };

    const onColumnMoved = useCallback(
        async (event) => {
            if (event.finished && event.api) {
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
                        tableId: templateData.id,
                        columns: allColumns,
                    });
                } catch (e) {
                    console.error('Error saving column indexes:', error);
                    toast.error('Đã xảy ra lỗi khi lưu thứ tự cột');
                    fetchData();
                }
            }
        },
        [selectedCard, templateColumns]
    );

    const handleChange = (name) => {
        setSelectedUC((prev) => {
            const newSet = new Set(prev);
            newSet.has(name) ? newSet.delete(name) : newSet.add(name);
            return newSet;
        });
    };

    const loadData = async () => {
        if (templateData.id) {
            try {
                const dataResponse = await getTemplateRow(selectedCard.id);
                const data = dataResponse.rows || [];
                const rows = data.map((row) => ({
                    ...row.data,
                    rowId: row.id,
                }));
                setRowData(rows);
            } catch (e) {
                console.error('Error loading row data:', error);
                toast.error('Error loading row data');
            }
        }
    };

    const handleAddColumn = async () => {
        const newColumn = { name: '', type: 'text', show: true };

        try {
            const createdColumn = await createTemplateColumn({
                tableId: templateData.id,
                columnName: newColumn.name,
                columnType: newColumn.type,
                show: true,
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
        const { id, ...clonedColumn } = columnToClone;
        const generateUniqueName = (baseName) => {
            let newName = baseName;
            let count = 1;
            while (templateColumns.some((column) => column.columnName == newName)) {
                newName = `${baseName} (${count++})`;
            }
            return newName;
        };
        clonedColumn.columnName = generateUniqueName(columnToClone.columnName);
        try {
            const createdColumn = await createTemplateColumn(clonedColumn);
            toast.success('Cột đã được nhân bản thành công!');
            setTemplateColumns([...templateColumns, { ...createdColumn, show: true }]);
        } catch (error) {
            console.error('Error creating new column:', error);
            toast.error('Đã xảy ra lỗi copy tạo.');
        }
    };

    const handleClosePopUpSetting = async () => {
        setShowSettingsPopup(false);
        fetchData();
    };

    const handleAddRow = async () => {
        let newRow = {};
        templateColumns.forEach((column) => {
            newRow[column.columnName] = null;
        });
        const highestId = rowData.reduce((max, item) => (item.id > max ? item.id : max), 0);
        newRow.id = highestId + 1;
        await createTemplateRow({ tableId: selectedCard.id, data: newRow });
        fetchData();
    };

    const handleAdd10Row = async () => {
        const highestId = rowData.reduce((max, item) => (item.id > max ? item.id : max), 0);
        let newRows = [];
        for (let i = 1; i <= 10; i++) {
            let newRow = {};
            templateColumns.forEach((column) => {
                newRow[column.columnName] = null;
            });
            newRow.id = highestId + i;
            newRows.push(newRow);
        }
        for (const row of newRows) {
            await createTemplateRow({ tableId: templateData.id, data: row });
        }
        fetchData();
    };

    const handleCellValueChanged = async (event) => {
        const { data, column } = event;
        const { rowId, ...updatedData } = data;
        let newData = { ...updatedData };

        // Get the latest data first
        const updatedRowDataResponse = await getTemplateRow(templateData.id);
        const updatedRowData = updatedRowDataResponse.rows || [];
        const updatedRow = updatedRowData.find((row) => row.id === rowId);

        if (updatedRow) {
            // Merge the latest changes with existing data
            newData = { ...updatedRow.data, ...newData };

            // Handle time-related columns
            if (['Ngày', 'Tháng', 'Năm'].includes(column.getColId())) {
                const day = newData['Ngày'] || updatedRow.data['Ngày'];
                const month = newData['Tháng'] || updatedRow.data['Tháng'];
                const year = newData['Năm'] || updatedRow.data['Năm'];

                if (day && month && year) {
                    newData['Thời gian'] = new Date(year, month - 1, day);
                    // Format the date as dd/mm/yyyy for display
                    newData['Thời gian_display'] = `${day}/${month}/${year}`;
                } else {
                    newData['Thời gian'] = null;
                    newData['Thời gian_display'] = '';
                }
            }

            // Handle formula columns
            for (const col of templateColumns) {
                if (col.columnType === 'formula' && col.selectFormula?.variables) {
                    try {
                        const scope = {};
                        for (const variable of col.selectFormula.variables) {
                            const [key, columnName] = Object.entries(variable)[0];
                            const value = newData[columnName];

                            scope[key] = value === null || value === undefined || value === '' || value === '-'
                                ? 0
                                : typeof value === 'string'
                                    ? parseFloat(value.replace(/,/g, '')) || 0
                                    : Number(value) || 0;
                        }

                        const result = evaluate(col.selectFormula.formula, scope);
                        newData[col.columnName] = isNaN(result) ? null : result;
                    } catch (error) {
                        console.error(`Formula evaluation error for column ${col.columnName}:`, error);
                        newData[col.columnName] = null;
                    }
                }
            }

            // Update the row with all changes
            await updateTemplateRow({ id: rowId, data: newData });
        }
    };

    const onColumnResized = async (event) => {
        if (event.finished) {
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
    };

    const handleFormButtonClick = () => {
        setIsFormModalVisible(true);
        const currentUrl = window.location.pathname;
        window.history.pushState({}, '', `${currentUrl}/form`);
    };

    const handleCloseFormModal = () => {
        setIsFormModalVisible(false);
        const currentUrl = window.location.pathname;
        const newUrl = currentUrl.replace('/form', '');
        window.history.pushState({}, '', newUrl);
    };

    useEffect(() => {
        if (location.pathname.endsWith('/form')) {
            setIsFormModalVisible(true);
        } else {
            setIsFormModalVisible(false);
        }
    }, [location.pathname]);



    const handleAddCustomRows = async () => {
        const count = parseInt(customRowCount);
        if (isNaN(count) || count <= 0) {
            message.error('Vui lòng nhập số lượng dòng hợp lệ');
            return;
        }

        const highestId = rowData.reduce((max, item) => (item.id > max ? item.id : max), 0);

        let newRows = [];
        for (let i = 1; i <= count; i++) {
            let newRow = {};
            templateColumns.forEach((column) => {
                newRow[column.columnName] = null;
            });
            newRow.id = highestId + i;
            newRow.tableId = templateData.id
            newRows.push(newRow);
        }

        await createBathTemplateRow(newRows).then(a=>{
            console.log(a);
        })
        await fetchData();
        setIsCustomRowModalVisible(false);
        message.success(`Đã thêm ${count} dòng mới`);
    };

    return currentUser.isAdmin ? (
        <div className="report">
            <div className="report__header">
                <div className="sheet_title">
                    <span>{fileNote && fileNote.name && fileNote.name}</span>
                    <div className="setting_userClass">
                        <img
                            style={{ width: '25px', height: '25px' }}
                            src={IconUser}
                            alt=""
                            onClick={() =>
                                (currentUser.isAdmin ||
                                    fileNote.user_create == currentUser.email) &&
                                setOpenSetupUC(true)
                            }
                        />
                        {fileNote?.userClass &&
                            fileNote.userClass.map((uc) => <span className={css.tag}>{uc}</span>)}
                    </div>
                </div>
                <div className="report__button-group">
                    <ActionChangeFilter
                        isStatusFilter={isStatusFilter}
                        handleChangeStatusFilter={handleChangeStatusFilter}
                    />


                    <div className="buttonSection" onClick={handleFormButtonClick}>
                        <span>+ form</span>
                    </div>
                    <div className="buttonSection" onClick={handleAddRow}>
                        <span>+ dòng</span>
                    </div>
                    <div className="buttonSection" onClick={() => setIsCustomRowModalVisible(true)}>
                        <span>+ n dòng</span>
                    </div>
                    <div className="buttonSection" onClick={() => setShowSettingsPopup(true)}>
                        <span>Cài đặt bảng</span>
                    </div>
                    <div className="buttonSection" onClick={() => setShowSettingsChartPopup(true)}>
                        <span>Tạo biểu đồ</span>
                    </div>
                    <Dropdown
                        menu={{
                            items,
                        }}
                    >
                        <span
                            className="buttonSection"
                            style={{ borderRadius: 10, border: 'none', width: '30px' }}
                        >
                            <ChevronDown size={20} />
                        </span>
                    </Dropdown>
                </div>
            </div>
            <div className="ag-theme-quartz" style={{ height: '75vh', width: '100%' }}>
                <AgGridReact
                    statusBar={statusBar}
                    ref={gridRef}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    columnDefs={colDefs}
                    rowSelection="multiple"
                    pagination={true}
                    enableRangeSelection={true}
                    onCellValueChanged={handleCellValueChanged}
                    paginationPageSize={500}
                    animateRows={true}
                    paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                    localeText={AG_GRID_LOCALE_VN}
                    onColumnResized={onColumnResized}
                    onColumnMoved={onColumnMoved}
                    suppressScrollOnNewData={true}
                    maintainColumnOrder={true}
                    groupDefaultExpanded={0}
                />
            </div>

            {showSettingsPopup && (
                <SheetColumnSetting
                    id={templateData.id}
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
                />
            )}


            <Modal
                title="Import File Excel"
                open={isImportModalVisible}
                onCancel={closeImportModal}
                width={800}
                footer={[
                    <Button key="cancel" onClick={closeImportModal}>
                        Hủy
                    </Button>,

                    <Popconfirm
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
                    </Popconfirm>,
                ]}
            >
                <Dragger
                    accept=".xls,.xlsx" // Chỉ cho phép chọn file Excel
                    beforeUpload={(file) => {
                        handleFileUpload(file);
                        return false; // Ngăn chặn việc tự động upload
                    }}
                    showUploadList={false}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined /> {/* Icon kéo thả */}
                    </p>
                    <p className="ant-upload-text">
                        Kéo và thả file Excel vào đây hoặc nhấn để chọn file
                    </p>
                    <p className="ant-upload-hint">Chỉ hỗ trợ file có định dạng .xls hoặc .xlsx</p>
                </Dragger>
                {importedData.length > 0 && (
                    <Table
                        columns={importColumns}
                        dataSource={importedData}
                        pagination={false}
                        scroll={{ x: true }}
                        style={{ marginTop: 16, height: '400px', overflow: 'auto' }}
                    />
                )}
            </Modal>


            <Modal
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
                        </div>
                    ))}
                </div>
            </Modal>
            {openSetupUC && (
                <>
                    <Modal
                        title={`Cài đặt nhóm người dùng`}
                        open={openSetupUC}
                        onCancel={() => setOpenSetupUC(false)}
                        onOk={() => {
                            updateFileNotePad({
                                ...fileNote,
                                userClass: Array.from(selectedUC),
                            }).then((data) => {
                                setOpenSetupUC(false);
                                fetchData();
                            });
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
                </>
            )}

            <Modal
                title="Thêm dòng mới"
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

            <Modal
                title="Thêm nhiều dòng"
                open={isCustomRowModalVisible}
                onCancel={() => setIsCustomRowModalVisible(false)}
                onOk={handleAddCustomRows}
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
                        value={customRowCount}
                        onChange={(e) => setCustomRowCount(e.target.value)}
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
            {showSettingsChartPopup && <><SettingChart showSettingsChartPopup={showSettingsChartPopup}
                setShowSettingsChartPopup={setShowSettingsChartPopup}
                colDefs={colDefs}
                templateData={templateData}
            />
            </>}
        </div>
    ) : (
        <div
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
        </div>
    );
};

export default TemplateTable;
