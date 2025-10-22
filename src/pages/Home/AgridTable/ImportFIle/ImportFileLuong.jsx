import React, {useContext, useEffect, useRef, useState} from 'react';
import * as XLSX from 'xlsx';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Typography
} from "@mui/material";
import {styled} from '@mui/system';
import {CgCloseR} from "react-icons/cg";
import {AgGridReact} from 'ag-grid-react';
import {toast} from "react-toastify";
import {TfiImport} from "react-icons/tfi";
import instance from "../../../../apis/axiosInterceptors.jsx";
import './import.css';
import CustomImportSelect from "./CustomImportSelect.jsx";
import {getAllKmf} from "../../../../apis/kmfService.jsx";
import {deleteAllSoKeToanService, deleteSoKeToanByMonth} from "../../../../apis/soketoanService.jsx";
import CustomMultiSelect from "./CustomImportMultiSelect.jsx";
import stringSimilarity from 'string-similarity';
import {formatCurrency} from "../../../../generalFunction/format.js";
import {getAllKmtc} from "../../../../apis/kmtcService.jsx";
import {getAllPhongBan} from "../../../../apis/phongBanService.jsx";
import {getAllDuAn} from "../../../../apis/duAnService.jsx";
import {getAllHangHoa} from "../../../../apis/hangHoaService.jsx";
import {getAllKhachHang} from "../../../../apis/khachHangService.jsx";
import {createNewTaiKhoan, getAllTaiKhoan, updateTaiKhoan} from "../../../../apis/taiKhoanService.jsx";
import {getAllKenh} from "../../../../apisKTQT/kenhService.jsx";
import {MyContext} from "../../../../MyContext.jsx";
import {getAllBusinessUnit} from "../../../../apis/businessUnitService.jsx";
import {getAllUnits} from "../../../../apisKTQT/unitService.jsx";
import {getAllDeal} from "../../../../apisKTQT/dealService.jsx"; // You can use 'string-similarity' package
const Input = styled('input')({
    display: 'none',
});

const FileImportComponent = ({
                                 apiUrl, onFileImported, onClose, onGridReady, table
                             }) => {
    const [selectedFile, setSelectedFile] = useState(false);
    const {selectedCompany} = useContext(MyContext);
    const [company, setCompany] = useState(selectedCompany)
    const [uploadProgress, setUploadProgress] = useState(0);
    const [fileName, setFileName] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [fileHeaders, setFileHeaders] = useState([]);
    const [invalidCells, setInvalidCells] = useState([]);
    const [mappingValues, setMappingValues] = useState({});
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [statusButton, setStatusButton] = useState(false);
    const [isMonthSelectDisabled, setIsMonthSelectDisabled] = useState(false); // Mặc định disable
    const [isSelectDisabled, setIsSelectDisabled] = useState(false); // Mặc định không disable các select khác
    const [invalidFields, setInvalidFields] = useState({});
    const [validDate, setValidDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const originalParsedData = useRef([]); // Lưu dữ liệu gốc

    useEffect(() => {
        setCompany(selectedCompany)
    }, [selectedCompany]);
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                // Chặn hành vi mặc định của phím Esc
                event.preventDefault();
                event.stopPropagation();
            }
        };

        // Lắng nghe sự kiện keydown khi component được mount
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup khi component bị unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const monthOptions = [
        {value: 1, label: 'Tháng 1'},
        {value: 2, label: 'Tháng 2'},
        {value: 3, label: 'Tháng 3'},
        {value: 4, label: 'Tháng 4'},
        {value: 5, label: 'Tháng 5'},
        {value: 6, label: 'Tháng 6'},
        {value: 7, label: 'Tháng 7'},
        {value: 8, label: 'Tháng 8'},
        {value: 9, label: 'Tháng 9'},
        {value: 10, label: 'Tháng 10'},
        {value: 11, label: 'Tháng 11'},
        {value: 12, label: 'Tháng 12'},
        {value: 'all', label: 'Toàn bộ'},
    ];
    const yearOptions = [
        {value: 'all', label: 'Toàn bộ'},
    ];


    const editableColumnsSKT = [
        {field: 'day', label: 'Ngày'},
        {field: 'month', label: 'Tháng'},
        {field: 'year', label: 'Năm'},
        {field: 'dien_giai', label: 'Diễn giải'},
        {field: 'tk_no', label: 'Tài khoản nợ'},
        {field: 'tk_co', label: 'Tài khoản có'},
        {field: 'ps_no', label: 'Phát sinh nợ'},
        {field: 'ps_co', label: 'Phát sinh có'},
        // {field: 'so_tien', label: 'Số tiền'},
        {field: 'vender', label: 'Khách hàng'},
        {field: 'kmns', label: 'Khoản mục thu chi'},
        {field: 'kmf', label: 'Khoản mục phí'},
        {field: 'hopDong', label: 'Hợp đồng'},
        {field: 'hoaDon', label: 'Hóa đơn'},
        {field: 'project', label: 'Dự án'},
        {field: 'team_code', label: 'Nhóm'},
        {field: 'product', label: 'Sản phẩm'},
        {field: 'kenh', label: 'Kênh'},
        {field: 'deal', label: 'Deal'},
        {field: 'unit_code', label: 'Đơn vị'},
        {field: 'chuThich', label: 'Chú thích'},
        {field: 'soChungTu', label: 'Chứng từ'},
        {field: 'noiBo', label: 'Nội bộ'},
        {field: 'consol', label: 'Consol'},
    ];

    const editableColumnsVas = [
        {field: 'year', label: 'Năm'},
        {field: 'code', label: 'Tên tài khoản'},
        {field: 'dp', label: 'Tên thể hiện'},
        {field: 't1_open_no', label: 'Tháng 1 OB nợ'},
        {field: 't1_open_co', label: 'Tháng 1 OB có'},
        {field: 't1_open_net', label: 'Tháng 1 OB net'},
        {field: 'phan_loai', label: 'Phân loại'},
        {field: 'chu_thich_tai_khoan', label: 'Chú thích'},
        {field: 'kc_co', label: 'Kết chuyển nợ'},
        {field: 'kc_no', label: 'Kết chuyển có'},
        {field: 'kc_net', label: 'Kết chuyển net'},
        {field: 'kc_net2', label: 'Kết chuyển net 2'},
        {field: 'consol', label: 'Consol'},
    ];

    // Define Luong-specific columns
    const editableColumnsLuong = [
        // { field: 'company', label: 'Công ty' },
        {field: 'doi_tuong', label: 'Đối tượng'},
        {field: 'cost_object', label: 'Cost object'},
        {field: 'bu', label: 'Business unit'},
        {field: 'month', label: 'Tháng'},
        {field: 'year', label: 'Năm'},
        {field: 'cf_luong_gross', label: 'CF lương gross'},
        {field: 'luong_co_dinh', label: 'Lương cố định'},
        {field: 'luong_bo_sung', label: 'Lương bổ sung'},
        {field: 'ot', label: 'OT'},
        {field: 'phu_cap', label: 'Phụ cấp'},
        {field: 'thuong', label: 'Thưởng'},
        {field: 'khac', label: 'Khác'},
        {field: 'bhxh_cty_tra', label: 'BHXH Cty trả'},
        {field: 'bhyt_cty_tra', label: 'BHYT Cty trả'},
        {field: 'bhtn_cty_tra', label: 'BHTN Cty trả'},
        {field: 'cong_doan', label: 'Công đoàn'},
        {field: 'bhxh_nv_tra', label: 'BHXH NV trả'},
        {field: 'bhyt_nv_tra', label: 'BHYT NV trả'},
        {field: 'bhtn_nv_tra', label: 'BHTN NV trả'},
        {field: 'thue_tncn', label: 'Thuế TNCN'}
    ];
    const editableColumnsDataCRM = [
        {field: 'code', label: 'Code'},
        {field: 'ngay', label: 'Thời gian'},
        {field: 'khach_hang', label: 'Khách hàng'},
        {field: 'dia_chi', label: 'Địa chỉ'},
        {field: 'sdt', label: 'SĐT'},
        {field: 'doanh_thu', label: 'Doanh thu'},
        {field: 'giam_gia', label: 'Giảm giá'},
        {field: 'doanh_thu_thuan', label: 'Doanh thu thuần'},
        {field: 'code_sp', label: 'Mã sản phẩm'},
        {field: 'name_sp', label: 'Tên sản phẩm'},
        {field: 'kenh', label: 'Kênh'},
        {field: 'shop', label: 'Shop'},
    ];

    // Choose the correct columns based on table type
    const editableColumns = table === 'SoKeToan-KTQT' ? editableColumnsSKT
        : table === 'Vas' ? editableColumnsVas
            : table === 'Luong' ? editableColumnsLuong
                : table === 'DataCRM' ? editableColumnsDataCRM
                    : [];
    // Handle select change
    const handleSelectChange = (selected) => {
        if (selected.find(option => option.value === 'all')) {
            setSelectedMonths([{value: 'all', label: 'Toàn bộ'}]);
            setIsAllSelected(true);
        } else {
            setSelectedMonths(selected);
            if (selected.length === 12) {
                setSelectedMonths([{value: 'all', label: 'Toàn bộ'}]);
                setIsAllSelected(true);
            } else {
                setIsAllSelected(false);
            }
        }
    };


    // Auto-mapping function
    const autoMapColumns = (fileHeaders, editableColumns) => {
        const mapping = {};
        let invalidFieldsUpdated = {};
        let invalidCells = [];
        let errorMessages = {}; // Object to store error messages for each field

        fileHeaders.forEach((header) => {
            const bestMatch = stringSimilarity.findBestMatch(
                header.toLowerCase(),
                editableColumns.map((column) => column.label.toLowerCase())
            );
            const bestMatchColumn = editableColumns[bestMatch.bestMatchIndex];

            if (bestMatch.bestMatch.rating > 0.5) {
                mapping[bestMatchColumn.field] = header;

                // Initialize error messages array for this column
                errorMessages[bestMatchColumn.field] = [];

                parsedData.forEach((row, rowIndex) => {
                    let value = row[header];
                    value = cleanValue(value, header)
                    // Validate 'day' (Ngày)
                    if (bestMatchColumn.field === 'day') {
                        if (!/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(value) && !/^\d{1,2}$/.test(value)) {
                            invalidFieldsUpdated['day'] = true;
                            invalidCells.push({row: rowIndex, col: bestMatchColumn.field});
                            errorMessages['day'].push("Ngày không hợp lệ, yêu cầu định dạng dd hoặc dd/mm/yyyy.");
                        }
                    }

                    // Validate 'month' (Tháng)
                    if (bestMatchColumn.field === 'month') {
                        const monthValue = parseInt(value, 10);
                        if (isNaN(monthValue) || monthValue < 1 || monthValue > 12) {
                            invalidFieldsUpdated['month'] = true;
                            invalidCells.push({row: rowIndex, col: bestMatchColumn.field});
                            errorMessages['month'].push("Tháng không hợp lệ, giá trị phải nằm trong khoảng từ 1 đến 12.");
                        }
                    }

                    // Validate numeric fields and set default value to 0 if null, undefined, or empty
                    if (['ps_no', 'ps_co', 'so_tien', 't1_open_no', 't1_open_co', 't1_open_net', 'cf_luong_gross', 'luong_co_dinh', 'luong_bo_sung', 'ot', 'phu_cap', 'thuong', 'khac', 'bhxh_cty_tra', 'bhyt_cty_tra', 'bhtn_cty_tra', 'cong_doan', 'bhxh_nv_tra', 'bhyt_nv_tra', 'bhtn_nv_tra', 'thue_tncn'].includes(bestMatchColumn.field)) {
                        if (value === null || value === undefined || value === "") {
                            parsedData[rowIndex][header] = '0';
                        } else if (typeof value === 'string' && value.includes(',') || isNaN(parseFloat(value))) {
                            invalidFieldsUpdated[bestMatchColumn.field] = true;
                            invalidCells.push({row: rowIndex, col: bestMatchColumn.field});
                            errorMessages[bestMatchColumn.field].push(`${bestMatchColumn.label} không hợp lệ, vui lòng nhập số hợp lệ.`);
                        }
                    }
                });
            }
        });

        // Show toast for each invalid field
        Object.keys(errorMessages).forEach((field) => {
            if (errorMessages[field].length > 0) {
                toast.error(`Cột ${field}: ${[...new Set(errorMessages[field])].join(" ")}`);
            }
        });

        setInvalidCells(invalidCells); // Update invalid cells state
        setInvalidFields(invalidFieldsUpdated); // Update invalid fields state
        return mapping;
    };

    // Usage Example
    useEffect(() => {
        if (fileHeaders.length > 0) {
            const autoMappingValues = autoMapColumns(fileHeaders, table === 'SoKeToan-KTQT' ? editableColumnsSKT : editableColumnsVas);
            setMappingValues(autoMappingValues);
        }
    }, [fileHeaders]);

    const validateAndFormatData = (rowData, mappingValues, editableColumns, invalidFieldsUpdated = {}) => {
        const validatedData = [];
        const invalidCells = [];
        const errorDetails = {}; // Lưu chi tiết lỗi cho từng cột

        rowData.forEach((row, rowIndex) => {
            const mappedRow = {serial_number: rowIndex + 1}; // Add serial number
            let hasError = false; // Flag to track if the row has any errors

            editableColumns.forEach((column) => {
                const selectedHeader = mappingValues[column.field];
                let value = row[selectedHeader];
                if (!selectedHeader) {
                    // Skip processing if the column is not mapped
                    return;
                }
                value = cleanValue(value, selectedHeader)
                // Validation for 'day' (Ngày)
                if (column.field === 'day') {
                    if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(value)) {
                        const [dayValue, monthValue] = value.split('/');
                        mappedRow[column.field] = dayValue;
                        mappedRow['month'] = monthValue;
                    } else if (/^\d{1,2}$/.test(value)) {
                        mappedRow[column.field] = value;
                    } else {
                        invalidFieldsUpdated['day'] = true;
                        hasError = true;
                        invalidCells.push({row: rowIndex, col: column.field});
                        errorDetails['day'] = 'Ngày không hợp lệ. Vui lòng nhập ngày theo định dạng dd hoặc dd/mm/yyyy';
                    }
                }

                // Validation for 'month' (Tháng)
                if (column.field === 'month') {
                    const monthValue = parseInt(value, 10);
                    if (monthValue >= 1 && monthValue <= 12) {
                        mappedRow[column.field] = monthValue;
                    } else {
                        invalidFieldsUpdated['month'] = true;
                        hasError = true;
                        invalidCells.push({row: rowIndex, col: column.field});
                        errorDetails['month'] = 'Tháng không hợp lệ. Tháng phải nằm trong khoảng từ 1 đến 12.';
                    }
                }

                // Validation for numeric fields
                if (['ps_no', 'ps_co', 'so_tien', 't1_open_no', 't1_open_co', 't1_open_net', 'cf_luong_gross', 'luong_co_dinh', 'luong_bo_sung', 'ot', 'phu_cap', 'thuong', 'khac', 'bhxh_cty_tra', 'bhyt_cty_tra', 'bhtn_cty_tra', 'cong_doan', 'bhxh_nv_tra', 'bhyt_nv_tra', 'bhtn_nv_tra', 'thue_tncn'].includes(column.field)) {
                    if (value === null || value === undefined || value === "") {
                        mappedRow[column.field] = '0'; // Set value to 0 if null, undefined, or empty
                    } else if (typeof value === 'string' && value.includes(',') || isNaN(parseFloat(value))) {
                        invalidFieldsUpdated[column.field] = true;
                        hasError = true;
                        invalidCells.push({row: rowIndex, col: column.field});
                        errorDetails[column.field] = `${column.label} chứa giá trị không hợp lệ. Giá trị phải là số và không chứa dấu phẩy.`;
                    } else {
                        mappedRow[column.field] = parseFloat(value); // Convert string to float
                    }
                }

                // Default handling for other fields
                mappedRow[column.field] = value || "";
            });

            if (hasError) {
                invalidFieldsUpdated[rowIndex] = true;
            }

            validatedData.push(mappedRow);
        });

        return {validatedData, invalidCells, invalidFieldsUpdated, errorDetails};
    };
    // Open confirmation dialog
    const handleUploadClick = () => {

        setConfirmDialogOpen(true);
    };

    // Confirmation logic for deleting old data and then importing new data
    const handleConfirmDelete = async () => {
        setConfirmDialogOpen(false);

        if (isAllSelected) {
            // await deleteAllSoKeToan(company); // Delete all data
        } else {
            const monthsToDelete = selectedMonths.map(month => month.value);
            await deleteDataForMonths(monthsToDelete); // Delete records by month
        }

        // Now import the new data
        try {
            // await handleUpload(parsedData); // Assuming parsedData contains the new records
            toast.success("Dữ liệu đã được nhập thành công.");
        } catch (error) {
            toast.error("Lỗi khi nhập dữ liệu.");
        }
    };


    // Cancel and close dialog
    const handleCancelDelete = () => {
        setConfirmDialogOpen(false);
    };
    const deleteDataForMonths = async (months) => {
        try {
            for (const month of months) {
                await deleteSoKeToanByMonth(month, company)
            }
            toast.success(`Dữ liệu của các tháng ${months.join(", ")} đã được xóa thành công.`);
        } catch (error) {
            toast.error("Lỗi khi xóa dữ liệu.");
        }
    };


    // Function to delete all records
    const deleteAllSoKeToan = async () => {
        try {
            await deleteAllSoKeToanService(company)
            toast.success("Toàn bộ dữ liệu đã được xóa thành công.");
        } catch (error) {
            toast.error("Lỗi khi xóa toàn bộ dữ liệu.");
        }
    };


    const handleMappingChange = (selectedOption, field) => {
        const selectedHeader = selectedOption ? selectedOption.value : "";
        // Reset errors for the field when a new value is selected or cleared
        setInvalidFields((prev) => ({
            ...prev,
            [field]: false,
        }));

        let invalidCells = [];
        let errorMessages = []; // Array to collect error messages for this field

        if (!selectedHeader) {
            // Remove the mapping if the header is cleared
            setMappingValues((prev) => {
                const updatedMapping = {...prev};
                delete updatedMapping[field]; // Remove the mapping for this field
                return updatedMapping;
            });

            // Also remove any invalid cells related to this field
            setInvalidCells((prev) => prev.filter(cell => cell.col !== field));

            // Optionally, you can reset errors for this field in invalidFields
            setInvalidFields((prev) => {
                const updatedInvalidFields = {...prev};
                delete updatedInvalidFields[field]; // Remove invalid state for this field
                return updatedInvalidFields;
            });

            // Exit early since we are clearing the selection
            return;
        }

        // If selectedHeader is valid, continue with validation
        parsedData.forEach((row, rowIndex) => {
            let value = row[selectedHeader.trim()];
            value = cleanValue(value, selectedHeader)
            // Validate 'day' (Ngày)
            if (field === "day") {
                if (!/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(value) && !/^\d{1,2}$/.test(value)) {
                    setInvalidFields((prev) => ({
                        ...prev,
                        day: true,
                    }));
                    invalidCells.push({row: rowIndex, col: field});
                    errorMessages.push("Ngày không hợp lệ, yêu cầu định dạng dd hoặc dd/mm/yyyy.");
                }
            }

            // Validate 'month' (Tháng)
            if (field === "month") {
                const monthValue = parseInt(value, 10);
                if (isNaN(monthValue) || monthValue < 1 || monthValue > 12) {
                    setInvalidFields((prev) => ({
                        ...prev,
                        month: true,
                    }));
                    invalidCells.push({row: rowIndex, col: field});
                    errorMessages.push("Tháng không hợp lệ, giá trị phải nằm trong khoảng từ 1 đến 12.");
                }
            }

            // Validate numeric fields
            if (['ps_no', 'ps_co', 'so_tien', 't1_open_no', 't1_open_co', 't1_open_net', 'cf_luong_gross', 'luong_co_dinh', 'luong_bo_sung', 'ot', 'phu_cap', 'thuong', 'khac', 'bhxh_cty_tra', 'bhyt_cty_tra', 'bhtn_cty_tra', 'cong_doan', 'bhxh_nv_tra', 'bhyt_nv_tra', 'bhtn_nv_tra', 'thue_tncn'].includes(field)) {
                if (value === null || value === undefined || value === "") {
                    parsedData[rowIndex][selectedHeader] = "0"; // Set value to 0 if empty
                } else if (typeof value === 'string' && value.includes(',') || isNaN(parseFloat(value))) {
                    setInvalidFields((prev) => ({
                        ...prev,
                        [field]: true,
                    }));
                    invalidCells.push({row: rowIndex, col: field});
                    errorMessages.push(`${selectedHeader} chứa giá trị không hợp lệ. Vui lòng nhập số hợp lệ.`);
                }
            }
        });
        if (errorMessages.length > 0) {
            toast.error(`Cột ${field}: ${[...new Set(errorMessages)].join(" ")}`);
        }

        setInvalidCells(invalidCells); // Update invalid cells state

        setMappingValues((prev) => ({
            ...prev,
            [field]: selectedHeader,
        }));
    };

    useEffect(() => {
        if (selectedMonths.length > 0) {
            // Lấy các giá trị tháng đã chọn

            let selectedMonthValues = selectedMonths.map(option => option.value);
            if (selectedMonthValues.includes('all')) {
                selectedMonthValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            }
            // Lọc lại dữ liệu theo tháng từ dữ liệu gốc
            const filteredData = originalParsedData.current.filter(row => {
                const monthField = mappingValues['month'];
                if (monthField && row[monthField]) {
                    const rowMonth = parseInt(row[monthField], 10);
                    return selectedMonthValues.includes(rowMonth);
                }
                return true; // Nếu không có trường 'month', giữ lại tất cả các hàng
            });

            setParsedData(filteredData); // Cập nhật lại parsedData với dữ liệu đã lọc

        } else {
            // Khôi phục dữ liệu gốc từ ref mà không cần đọc lại file
            setParsedData(originalParsedData.current);
            // toast.info("Đã hiển thị toàn bộ dữ liệu.");
        }

    }, [selectedMonths, mappingValues]);


    const handlePreview = (showErrorsOnly = false) => {
        let invalidFieldsUpdated = {};

        const {
            validatedData,
            invalidCells,
            errorDetails
        } = validateAndFormatData(parsedData, mappingValues, editableColumns, invalidFieldsUpdated);

        // Update the state with validated data and invalid cells
        setPreviewData(showErrorsOnly ? validatedData.filter(row => invalidCells.some(cell => cell.row === row.serial_number - 1)) : validatedData);
        setInvalidCells(invalidCells);
        setInvalidFields(invalidFieldsUpdated);

        // Check if there are any errors and show detailed notifications
        if (Object.keys(errorDetails).length > 0) {
            Object.keys(errorDetails).forEach((field) => {
                toast.warn(`${editableColumns.find(col => col.field === field)?.label || field}: ${errorDetails[field]}`);
            });
        }

        setIsPreviewOpen(true); // Open the preview modal
    };


    const handleShowErrorRows = () => {
        handlePreview(true); // Hiển thị chỉ các dòng lỗi
    };


    // Updated cleanValue function to set numeric fields to 0 when null, undefined, or empty
    const cleanValue = (value, isNumeric) => {
        if (value === undefined || value === null || value === "") {
            return isNumeric ? 0 : ""; // Set 0 for numeric fields, "" for others
        }
        if (typeof value === "string") {
            value = value.trim(); // Trim spaces
            return value === "" ? "" : value; // Return empty string if value becomes empty after trimming
        }
        return value;
    };

    const isValidNumber = (value) => {
        return !isNaN(value) && value !== null && value !== undefined;
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setLoading(true)
            setSelectedFile(file);
            setFileName(file.name);
            readFile(file);
        }
    };

    const readFile = async (file) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = await new Uint8Array(e.target.result);
            const workbook = await XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = await workbook.Sheets[sheetName];
            let headers = await XLSX.utils.sheet_to_json(worksheet, {header: 1})[0];
            headers = await headers.filter(header => header && header.trim() !== "");
            const json = XLSX.utils.sheet_to_json(worksheet);
            originalParsedData.current = json;  // Lưu dữ liệu vào ref
            setParsedData(json); // Hiển thị dữ liệu
            setFileHeaders(headers);
            toast.success("File uploaded successfully!");
            setStatusButton(true);
            setLoading(false);
        };
        reader.readAsArrayBuffer(file);
    };

    const generateColDefs = (mappings) => {
        const cols = [{
            headerName: 'Số thứ tự',
            field: 'serial_number',
            width: 100,
            editable: false,
            cellStyle: {textAlign: 'center'},
            pinned: 'left',
        }, ...Object.entries(mappings).map(([header, field]) => {
            const isNumericField = ['ps_no', 'ps_co', 'so_tien', 'pl_value', 'cash_value', 't1_open_no', 't1_open_co', 't1_open_net', "bhyt_nv_tra", "bhxh_cty_tra", "ot", "bhtn_cty_tra", "bhtn_nv_tra", "cong_doan", "thuong", "phu_cap", "luong_bo_sung", "luong_co_dinh", "bhxh_nv_tra", "bhyt_cty_tra", "khac", "thue_tncn",].includes(field);


            return {
                headerName: header,
                field: field,
                editable: true,
                valueFormatter: isNumericField ? (params) => formatCurrency(params.value) : null,
                cellStyle: (params) => {
                    const isInvalidCell = invalidCells.some(cell => cell.row === params.node.rowIndex && cell.col === field);
                    return isInvalidCell ? {
                        backgroundColor: 'rgb(255,75,75)',
                        color: 'white',
                        textAlign: 'right'
                    } : {textAlign: 'right'};
                }
            };
        })];

        setColDefs(cols);
    };


    const handleSOLCompany = (row) => {
        let so_tien = parseFloat(row.so_tien);
        let tk_no = row.tk_no + '';
        let tk_co = row.tk_co + '';

        if (tk_no || tk_co) {
            if (tk_no.startsWith("91") || tk_co.startsWith("91")) {
                row.pl_type = "KC";
            } else if (tk_no.startsWith("515") || tk_co.startsWith("515")) {
                row.pl_type = "DTTC";
            } else if (tk_no.startsWith("51") || tk_co.startsWith("51")) {
                row.pl_type = "DT";
            } else if (tk_no.startsWith("71") || tk_co.startsWith("71")) {
                row.pl_type = "DTK";
            } else if (tk_no.startsWith("635") || tk_co.startsWith("635")) {
                row.pl_type = "CFTC";
            } else if (tk_no.startsWith('641') || tk_co.startsWith('641')) {
                row.pl_type = 'CFBH';
            } else if (tk_no.startsWith('642') || tk_co.startsWith('642')) {
                row.pl_type = 'CFQL';
            } else if (tk_no.startsWith('632') || tk_co.startsWith('632') || tk_no.startsWith('62') || tk_co.startsWith('62')) {
                row.pl_type = 'GV';
            } else if (tk_no.startsWith("52") || tk_co.startsWith("52") || tk_no.startsWith("6") || tk_co.startsWith("6")) {
                row.pl_type = "CF";
            } else if (tk_no.startsWith("81") || tk_co.startsWith("81")) {
                row.pl_type = "CFK";
            } else if (tk_no.startsWith("82") || tk_co.startsWith("82")) {
                row.pl_type = "Tax";
            } else {
                row.pl_type = "";
            }

            if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
                row.cf_Check = "";
            } else if (tk_no.startsWith("11")) {
                row.cf_Check = "Cashin";
            } else if (tk_co.startsWith("11")) {
                row.cf_Check = "Cashout";
            } else {
                row.cf_Check = "";
            }

            if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_co.startsWith('51') || tk_co.startsWith('7'))) {
                row.pl_value = so_tien;
            } else if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_no.startsWith('51') || tk_co.startsWith('7'))) {
                row.pl_value = -so_tien;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_co.startsWith('52') || tk_co.startsWith('6') || tk_co.startsWith('8'))) {
                row.pl_value = so_tien;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_no.startsWith('52') || tk_no.startsWith('6') || tk_no.startsWith('8'))) {
                row.pl_value = -so_tien;
            } else {
                row.pl_value = "";
            }

            if (row.cf_Check === "Cashin") {
                row.cash_value = so_tien;
            } else if (row.cf_Check === "Cashout") {
                row.cash_value = -so_tien;
            } else {
                row.cash_value = "";
            }
        }
    };

// Hàm xử lý cho các công ty khác ngoài SOL
    const handleOtherCompanies = (row) => {
        let so_tien = parseFloat(row.so_tien);
        let tk_no = row.tk_no + '';
        let tk_co = row.tk_co + '';

        if (tk_no && tk_co) {
            if (tk_no.startsWith("91") || tk_co.startsWith("91")) {
                row.pl_type = "KC";
            } else if (tk_no.startsWith("515") || tk_co.startsWith("515")) {
                row.pl_type = "DTTC";
            } else if (tk_no.startsWith("51") || tk_co.startsWith("51")) {
                row.pl_type = "DT";
            } else if (tk_no.startsWith("71") || tk_co.startsWith("71")) {
                row.pl_type = "DTK";
            } else if (tk_no.startsWith("635") || tk_co.startsWith("635")) {
                row.pl_type = "CFTC";
            } else if (tk_no.startsWith('641') || tk_co.startsWith('641')) {
                row.pl_type = 'CFBH';
            } else if (tk_no.startsWith('642') || tk_co.startsWith('642')) {
                row.pl_type = 'CFQL';
            } else if (tk_no.startsWith('632') || tk_co.startsWith('632') || tk_no.startsWith('62') || tk_co.startsWith('62')) {
                row.pl_type = 'GV';
            } else if (tk_no.startsWith("52") || tk_co.startsWith("52") || tk_no.startsWith("6") || tk_co.startsWith("6")) {
                row.pl_type = "CF";
            } else if (tk_no.startsWith("81") || tk_co.startsWith("81")) {
                row.pl_type = "CFK";
            } else if (tk_no.startsWith("82") || tk_co.startsWith("82")) {
                row.pl_type = "Tax";
            } else {
                row.pl_type = "";
            }

            if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
                row.cf_Check = "";
            } else if (tk_no.startsWith("11")) {
                row.cf_Check = "Cashin";
            } else if (tk_co.startsWith("11")) {
                row.cf_Check = "Cashout";
            } else {
                row.cf_Check = "";
            }

            if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_co.startsWith('51') || tk_co.startsWith('7'))) {
                row.pl_value = so_tien;
            } else if (['DT', 'DTK', 'DTTC'].includes(row.pl_type) && (tk_no.startsWith('51') || tk_co.startsWith('7'))) {
                row.pl_value = -so_tien;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_co.startsWith('52') || tk_co.startsWith('6') || tk_co.startsWith('8'))) {
                row.pl_value = so_tien;
            } else if (['CFBH', 'CFQL', 'GV', 'CFK', 'CFTC', 'TAX', 'CF'].includes(row.pl_type) && (tk_no.startsWith('52') || tk_no.startsWith('6') || tk_no.startsWith('8'))) {
                row.pl_value = -so_tien;
            } else {
                row.pl_value = "";
            }

            if (row.cf_Check === "Cashin") {
                row.cash_value = so_tien;
            } else if (row.cf_Check === "Cashout") {
                row.cash_value = -so_tien;
            } else {
                row.cash_value = "";
            }
        }
    };

    const handleCGCompanies = (row) => {
        row.so_tien = parseCurrencyInput(row.ps_no) - parseCurrencyInput(row.ps_co)
        let so_tien = parseFloat(row.so_tien);
        let tk_no = row.tk_no + '';
        let tk_co = row.tk_co + '';

        if (tk_no) {
            // Update PL Type based on the updated logic
            if (tk_no.startsWith("511")) {
                row.pl_type = "DT";
            } else if (tk_no.startsWith("62") || tk_no.startsWith("63")) {
                row.pl_type = "GV";
            } else if (tk_no.startsWith("52") || tk_no.startsWith("641")) {
                row.pl_type = "CFBH";
            } else if (tk_no.startsWith("642")) {
                row.pl_type = "CFQL";
            } else if (tk_no.startsWith("635")) {
                row.pl_type = "CFTC";
            } else if (tk_no.startsWith("515")) {
                row.pl_type = "DTTC";
            } else if (tk_no.startsWith("71")) {
                row.pl_type = "DTK";
            } else if (tk_no.startsWith("811")) {
                row.pl_type = "CFK";
            } else if (tk_no.startsWith("821")) {
                row.pl_type = "TAX";
            } else {
                row.pl_type = "";
            }

            // Update PL Value based on PL Type
            if (["DT", "DTK", "DTTC", "GV", "CFK", "CFTC", "CFBH", "CFQL", "TAX"].includes(row.pl_type)) {
                row.pl_value = -so_tien;
            } else {
                row.pl_value = "";
            }

            // Update Cash Value based on cash flow check
            if (tk_no.startsWith("11") && tk_co.startsWith("11")) {
                row.cash_value = 0;
            } else if (tk_no.startsWith("11")) {
                row.cash_value = so_tien;
            } else {
                row.cash_value = "";
            }
        }
    };

    const processRow = async (row, company, apiUrl) => {


        // Gọi hàm xử lý theo từng loại công ty
        // if (company === 'SOL') {
        //     handleSOLCompany(row);
        // } else {
        //     handleOtherCompanies(row);
        // }
        handleCGCompanies(row)
        // Gửi bản ghi đã xử lý tới server
        await instance.post(apiUrl, row);
    };

    const handleUpload = async () => {
        setLoading(true);

        const errorColumns = new Set(); // Track invalid columns
        let invalidFieldsUpdated = {};

        const {
            validatedData,
            invalidCells
        } = validateAndFormatData(parsedData, mappingValues, editableColumns, invalidFieldsUpdated);

        if (Object.keys(invalidFieldsUpdated).length > 0) {
            toast.error("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các cột.");
            setLoading(false);
            return;
        }

        // Upload based on the type of table
        try {
            if (table === 'SoKeToan-KTQT') {
                await uploadSoKeToan(validatedData);
                toast.success("Dữ liệu Sổ Kế Toán đã được tải lên thành công.");
            } else if (table === 'Vas') {
                await uploadVas(validatedData);
                toast.success("Dữ liệu Cân Đối Phát Sinh đã được tải lên thành công.");
            } else if (table === 'Luong') {
                await uploadLuong(validatedData);  // New handler for Luong
                toast.success("Dữ liệu Lương đã được tải lên thành công.");
            } else if (table === 'DataCRM') {
                await uploadDataCRM(validatedData);  // New handler for Luong
                toast.success("Dữ liệu CRM đã được tải lên thành công.");
            }
        } catch (error) {
            console.log(error)
            toast.error("Lỗi khi tải lên dữ liệu.");
        }

        setLoading(false);
    };
    const uploadLuong = async (cleanedData) => {
        console.log(cleanedData)
        const BASE_URL = import.meta.env.VITE_API_URL;
        const url = `${BASE_URL}/api/luong`;  // Adjust the endpoint if necessary

        // Process each row of cleaned data and send it to the backend
        for (let row of cleanedData) {
            row.cf_luong_gross = parseFloat(row.cf_luong_gross) || 0;
            row.bhyt_nv_tra = parseFloat(row.bhyt_nv_tra) || 0;
            row.bhxh_cty_tra = parseFloat(row.bhxh_cty_tra) || 0;
            row.ot = parseFloat(row.ot) || 0;
            row.bhtn_cty_tra = parseFloat(row.bhtn_cty_tra) || 0;
            row.bhtn_nv_tra = parseFloat(row.bhtn_nv_tra) || 0;
            row.cong_doan = parseFloat(row.cong_doan) || 0;
            row.thuong = parseFloat(row.thuong) || 0;
            row.phu_cap = parseFloat(row.phu_cap) || 0;
            row.luong_bo_sung = parseFloat(row.luong_bo_sung) || 0;
            row.luong_co_dinh = parseFloat(row.luong_co_dinh) || 0;
            row.bhxh_nv_tra = parseFloat(row.bhxh_nv_tra) || 0;
            row.bhyt_cty_tra = parseFloat(row.bhyt_cty_tra) || 0;
            row.khac = parseFloat(row.khac) || 0;
            row.thue_tncn = parseFloat(row.thue_tncn) || 0;

            await instance.post(url, row);
        }
        await onGridReady()
        onClose()
    }
    const uploadDataCRM = async (cleanedData) => {
        console.log(cleanedData)
        const BASE_URL = import.meta.env.VITE_API_URL;
        const url = `${BASE_URL}/api/data-crm`;  // Adjust the endpoint if necessary

        // Process each row of cleaned data and send it to the backend
        for (let row of cleanedData) {
            row.doanh_thu = parseFloat(row.doanh_thu) || 0;
            row.giam_gia = parseFloat(row.giam_gia) || 0;
            row.doanh_thu_thuan = parseFloat(row.doanh_thu_thuan) || 0;

            await instance.post(url, row);
        }
        await onGridReady()
        onClose()
    };

    const uploadSoKeToan = async (cleanedData) => {
        const BASE_URL = import.meta.env.VITE_API_URL;

        const fetchAllLists = async () => {
            const kmfList = await getAllKmf();
            const kmnsList = await getAllKmtc();
            const unitList = await getAllUnits();
            const projectList = await getAllDuAn();
            const productList = await getAllHangHoa();
            const vendorList = await getAllKhachHang();
            const teamList = await getAllPhongBan();
            const vasList = await getAllTaiKhoan();
            const kenhList = await getAllKenh();
            const dealList = await getAllDeal();

            return {
                kmfList,
                kmnsList,
                unitList,
                projectList,
                productList,
                vendorList,
                teamList,
                vasList,
                dealList,
                kenhList
            };
        };

        let {
            kmfList,
            kmnsList,
            unitList,
            projectList,
            productList,
            vendorList,
            teamList,
            vasList,
            dealList,
            kenhList
        } = await fetchAllLists();

        const uniqueKMFs = new Set();
        const uniqueKMNSs = new Set();
        const uniqueUnits = new Set();
        const uniqueProjects = new Set();
        const uniqueProducts = new Set();
        const uniqueVendors = new Set();
        const uniqueTeams = new Set();
        const uniqueVAS = new Set();
        const uniqueDeal = new Set();
        const uniqueKenh = new Set();

        cleanedData.forEach(row => {
            row.so_tien = parseFloat(row.so_tien) || 0
            // row.so_tien = parseCurrencyInput(row.ps_no) - parseCurrencyInput(row.ps_co)
            row.company = company
            if (company === 'HQ') {
                row.consol = 'CONSOL'
            }
            if (row.company != null && row.company !== "" && row.company !== undefined) {
                if (row.unit_code != null && row.unit_code !== "" && row.unit_code !== undefined) {
                    row.unit_code2 = `${company}-${row.unit_code}`
                }
                if (row.product != null && row.product !== "" && row.product !== undefined) {
                    row.product2 = `${row.product}-${company}-${row.unit_code}`
                }
                if (row.kenh != null && row.kenh !== "" && row.kenh !== undefined) {
                    row.kenh2 = `${row.kenh}-${company}-${row.unit_code}`
                }
                if (row.deal != null && row.deal !== "" && row.deal !== undefined) {
                    row.deal2 = `${row.vu_viec_code}-${company}-${row.unit_code}`
                }
            }
            if (row.kmf) uniqueKMFs.add(row.kmf);
            if (row.kmns) uniqueKMNSs.add(row.kmns);
            if (row.unit_code2) uniqueUnits.add(row.unit_code2);
            if (row.vu_viec_code) uniqueProjects.add(row.vu_viec_code);
            if (row.product2) uniqueProducts.add(row.product2);
            if (row.deal2) uniqueProducts.add(row.deal2);
            if (row.vender) uniqueVendors.add(row.vender);
            if (row.team_code) uniqueTeams.add(row.team_code);
            if (row.kenh2) uniqueKenh.add(row.kenh2);
            if (row.tk_no) uniqueVAS.add(`${row.tk_no}^${row.year}`);
            if (row.tk_co) uniqueVAS.add(`${row.tk_co}^${row.year}`);
        });

        const addNewEntities = async (row) => {
            const newKMFsSet = new Set();
            const newKMNSsSet = new Set();
            const newUnitsSet = new Set();
            const newProjectsSet = new Set();
            const newProductsSet = new Set();
            const newDealsSet = new Set();
            const newVendorsSet = new Set();
            const newTeamsSet = new Set();
            const newVASSet = new Set();
            const newKenhSet = new Set();


            Array.from(uniqueKMFs).forEach(kmf => {
                if (!kmfList.some(existingKMF => existingKMF.name == kmf && existingKMF.company === company)) {
                    if (kmf !== null && kmf !== undefined && kmf !== '') {
                        newKMFsSet.add(kmf);
                    }
                }
            });

            Array.from(uniqueKMNSs).forEach(kmns => {
                if (!kmnsList.some(existingKMNS => existingKMNS.name == kmns && existingKMNS.company === company)) {
                    if (kmns !== null && kmns !== undefined && kmns !== '') {
                        newKMNSsSet.add(kmns);
                    }
                }
            });

            Array.from(uniqueUnits).forEach(unit => {
                if (!unitList.some(existingUnit => existingUnit.code == unit && existingUnit.company === company)) {
                    let name = unit.split('-')[0]
                    if (name !== null && name !== undefined && name !== '') {
                        newUnitsSet.add(unit);
                    }
                }
            });

            Array.from(uniqueProjects).forEach(project => {
                if (!projectList.some(existingProject => existingProject.project_name == project && existingProject.company === company)) {
                    if (project !== null && project !== undefined && project !== '') {
                        newProjectsSet.add(project);
                    }
                }
            });

            Array.from(uniqueProducts).forEach(product => {
                if (!productList.some(existingProduct => existingProduct.code == product && existingProduct.company === company)) {
                    let name = product.split('-')[0]
                    if (name !== null && name !== undefined && name !== '') {
                        newProductsSet.add(product);
                    }
                }
            });

            Array.from(uniqueKenh).forEach(kenh => {
                if (!kenhList.some(existingKenh => existingKenh.name == kenh && existingKenh.company === company)) {
                    let name = kenh.split('-')[0]
                    if (name !== null && name !== undefined && name !== '') {
                        newKenhSet.add(kenh);
                    }

                }
            });

            Array.from(uniqueDeal).forEach(deal => {
                if (!dealList.some(existingDeal => existingDeal.code == deal && existingDeal.company === company)) {
                    let name = deal.split('-')[0]
                    if (name !== null && name !== undefined && name !== '') {
                        newProductsSet.add(deal);
                    }
                }
            });

            Array.from(uniqueVendors).forEach(vendor => {
                if (!vendorList.some(existingVendor => existingVendor.name == vendor && existingVendor.company === company)) {
                    if (vendor !== null && vendor !== undefined && vendor !== '') {
                        newVendorsSet.add(vendor);
                    }
                }
            });

            Array.from(uniqueTeams).forEach(team => {
                if (!teamList.some(existingTeam => existingTeam.name == team && existingTeam.company === company)) {
                    if (team !== null && team !== undefined && team !== '') {
                        newTeamsSet.add(team);
                    }
                }
            });

            Array.from(uniqueVAS).forEach(vas => {

                if (!vasList.some(existingVAS => existingVAS.code == vas.split('^')[0] && existingVAS.company === company && existingVAS.year === vas.split('^')[1])) {
                    if (vas !== null && vas !== undefined && vas !== '') {
                        newVASSet.add(vas);
                    }
                }
            });

            if (newKMFsSet.size > 0) {
                for (const kmf of newKMFsSet) {
                    await instance.post(`${BASE_URL}/api/ktqt-kmf`, {
                        name: kmf,
                        dp: kmf,
                        company: company,
                    });
                }
                kmfList = await getAllKmf();
            }


            if (newKMNSsSet.size > 0) {
                for (const kmns of newKMNSsSet) {
                    await instance.post(`${BASE_URL}/api/ktqt-kmns`, {
                        name: kmns,
                        dp: kmns,
                        company: company,
                    });
                }
                kmnsList = await getAllKmns();
            }

            if (newUnitsSet.size > 0) {
                for (const unit of newUnitsSet) {
                    let unitIn4 = unit.split('-')
                    await instance.post(`${BASE_URL}/api/ktqt-unit`, {
                        code: unit,
                        name: unitIn4[1],
                        dp: unitIn4[1],
                        company: company,
                    });
                }
                unitList = await getAllUnits();
            }

            if (newProjectsSet.size > 0) {
                for (const project of newProjectsSet) {
                    await instance.post(`${BASE_URL}/api/ktqt-project`, {
                        project_name: project,
                        dp: project,
                        project_viet_tat: project,
                        company: company,
                    });
                }
                projectList = await getAllProject();
            }

            if (newProductsSet.size > 0) {
                for (const product of newProductsSet) {
                    let productIn4 = product.split('-')
                    await instance.post(`${BASE_URL}/api/ktqt-product`, {
                        code: product,
                        name: productIn4[0],
                        dp: productIn4[0],
                        unit_code: productIn4[2],
                        company: company,
                    });
                }
                productList = await getAllProduct();
            }


            if (newKenhSet.size > 0) {
                for (const kenh of newKenhSet) {
                    let kenhIn4 = kenh.split('-')
                    await instance.post(`${BASE_URL}/api/ktqt-kenh`, {
                        code: kenh,
                        name: kenhIn4[0],
                        dp: kenhIn4[0],
                        unit_code: kenhIn4[2],
                        company: company,
                    });
                }
                kenhList = await getAllKenh();
            }

            if (newDealsSet.size > 0) {
                for (const deal of newDealsSet) {
                    let dealIn4 = deal.split('-')
                    await instance.post(`${BASE_URL}/api/ktqt-deal`, {
                        code: deal,
                        name: dealIn4[0],
                        dp: dealIn4[0],
                        unit_code: dealIn4[2],
                        company: company,
                    });
                }
                productList = await getAllProduct();
            }

            if (newVendorsSet.size > 0) {
                for (const vendor of newVendorsSet) {
                    await instance.post(`${BASE_URL}/api/ktqt-vendor`, {
                        name: vendor,
                        dp: vendor,
                        company: company,
                    });
                }
                vendorList = await getAllVendor();
            }

            if (newTeamsSet.size > 0) {
                for (const team of newTeamsSet) {
                    await instance.post(`${BASE_URL}/api/ktqt-team`, {
                        name: team,
                        dp: team,
                        code: team,
                        // unit_code: row.unit_code,
                        company: company,
                    });
                }
                teamList = await getAllTeam();
            }

            if (newVASSet.size > 0) {
                for (const vas of newVASSet) {
                    await instance.post(`${BASE_URL}/api/ktqt-vas`, {
                        code: vas.split('^')[0],
                        dp: vas.split('^')[0],
                        company: company,
                        year: vas.split('^')[1]
                    });
                }
                vasList = await getAllTaiKhoan();
            }
        };

        const totalRows = cleanedData.length;
        let uploadedRows = 0;

        for (let i = 0; i < cleanedData.length; i++) {
            const row = cleanedData[i];

            // Thêm entities mới trước khi xử lý dòng
            await addNewEntities(row);

            // Xử lý dòng hiện tại
            await processRow(row, company, apiUrl);

            uploadedRows++;
            const progress = Math.round((uploadedRows / totalRows) * 100);
            setUploadProgress(progress);
        }

        toast.success("Toàn bộ dữ liệu đã được tải lên thành công!");
        onFileImported && onFileImported(cleanedData);
        onGridReady && onGridReady();
        onClose()

    };
    const handleCellValueChange = (params) => {
        const {rowIndex, colDef, newValue} = params;
        const field = colDef.field;

        // Update the corresponding value in parsedData
        setParsedData(prevData => {
            const updatedData = [...prevData];
            updatedData[rowIndex][field] = newValue;

            // Perform validation checks
            if (field === 'day') {
                const isValidDay = /^\d{1,2}$/.test(newValue);
                if (!isValidDay) {
                    toast.warn("Cột ngày không hợp lệ.");
                    setInvalidCells(prev => [...prev, {row: rowIndex, col: field}]);
                } else {
                    setInvalidCells(prev => prev.filter(cell => !(cell.row === rowIndex && cell.col === field)));
                }
            }

            if (field === 'month') {
                const isValidMonth = newValue >= 1 && newValue <= 12;
                if (!isValidMonth) {
                    toast.warn("Cột tháng không hợp lệ.");
                    setInvalidCells(prev => [...prev, {row: rowIndex, col: field}]);
                } else {
                    setInvalidCells(prev => prev.filter(cell => !(cell.row === rowIndex && cell.col === field)));
                }
            }

            // Validate numeric fields (e.g., 'ps_no', 'ps_co', 'so_tien', 'pl_value', 'cash_value')
            const numericFields = ['ps_no', 'ps_co', 'so_tien', 'pl_value', 'cash_value', 't1_open_no', 't1_open_co', 't1_open_net', "bhyt_nv_tra", "bhxh_cty_tra", "ot", "bhtn_cty_tra", "bhtn_nv_tra", "cong_doan", "thuong", "phu_cap", "luong_bo_sung", "luong_co_dinh", "bhxh_nv_tra", "bhyt_cty_tra", "khac", "thue_tncn",];
            if (numericFields.includes(field)) {
                const isValidNumber = !isNaN(parseFloat(newValue)) && newValue !== "" && newValue !== null && newValue !== undefined;
                if (!isValidNumber) {
                    toast.error(`${colDef.headerName} - Dữ liệu số không hợp lệ.`);
                    setInvalidCells(prev => [...prev, {row: rowIndex, col: field}]);
                } else {
                    // If valid, clean the value and remove the error
                    updatedData[rowIndex][field] = parseFloat(newValue);  // Ensure the value is saved as a number
                    setInvalidCells(prev => prev.filter(cell => !(cell.row === rowIndex && cell.col === field)));
                }
            }


            return updatedData;
        });
    };

    const uploadVas = async (mappedData) => {

        // Logic khi table === 'Vas'
        const totalRows = mappedData.length;
        let uploadedRows = 0;
        let getVas = await getAllTaiKhoan();
        // Lấy tất cả các bản ghi hiện có trong db
        const existingVas = getVas.filter(record => record.company === company); // Hàm lấy dữ liệu VAS từ db

        const existingAccountNames = existingVas.map(record => record.code); // Lấy danh sách tên tài khoản hiện có

        // Bước 1: Chuyển tất cả dữ liệu ở 3 cột t1_open_no, t1_open_co, t1_open_net về 0 cho tất cả các bản ghi hiện có
        for (let i = 0; i < getVas.length; i++) {
            const record = getVas[i];
            for (let j = 0; j < totalRows; j++) {
                if (record.company === company && mappedData[j].year == record.year) {
                    record.t1_open_no = 0;
                    record.t1_open_co = 0;
                    record.t1_open_net = 0;

                    // Gửi bản ghi đã cập nhật về server
                    await instance.put(`${apiUrl}`, record); // Giả định rằng API PUT sẽ cập nhật bản ghi theo id
                }
            }


        }

        // Bước 2: Kiểm tra và cập nhật/tạo mới dữ liệu từ file import
        for (let i = 0; i < totalRows; i++) {
            const row = mappedData[i];
            // Nếu tên tài khoản không có trong danh sách, tạo mới bản ghi
            if (!existingAccountNames.includes(row.code) || existingAccountNames.year != row.year) {
                row.company = company
                if (company === 'HQ') {
                    row.consol = 'CONSOL'
                }
                if (row.code != null && row.code !== "") {
                    row.t1_open_no = parseInt(row.t1_open_no);
                    row.t1_open_co = parseInt(row.t1_open_co);
                    row.t1_open_net = parseInt(row.t1_open_net);
                    row.year = parseInt(row.year)
                    await createNewTaiKhoan(row);
                }
                // Tạo mới bản ghi
            } else {
                // Nếu tên tài khoản đã tồn tại, cập nhật bản ghi với dữ liệu mới từ file import
                if (row.code != null && row.code !== "") {
                    const existingRecord = existingVas.find(record => record.code == row.code && record.company === company && record.year == row.year);
                    // Cập nhật dữ liệu tương ứng với các cột từ file import

                    existingRecord.t1_open_no = parseInt(row.t1_open_no);
                    existingRecord.t1_open_co = parseInt(row.t1_open_co);
                    existingRecord.t1_open_net = parseInt(row.t1_open_net);
                    existingRecord.chu_thich_tai_khoan = row.chu_thich_tai_khoan;
                    existingRecord.kc_no = row.kc_no;
                    existingRecord.kc_co = row.kc_co;
                    existingRecord.kc_net = row.kc_net;
                    existingRecord.kc_net2 = row.kc_net2;
                    existingRecord.kc_net2 = row.kc_net2;
                    existingRecord.phan_loai = row.phan_loai;
                    existingRecord.consol = row.consol;
                    existingRecord.dp = row.dp;
                    // Gửi bản ghi đã cập nhật về server
                    await updateTaiKhoan(existingRecord); // Cập nhật bản ghi
                }
            }

            uploadedRows++;
            const progress = Math.round((uploadedRows / totalRows) * 100);
            setUploadProgress(progress);
        }
        toast.success("Toàn bộ dữ liệu đã được tải lên thành công!");
        onGridReady && onGridReady();
        onClose()
    };

    return (
        <>
            {loading && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        position: 'absolute',
                        width: '100%',
                        zIndex: '20000',
                        backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    }}
                >
                    <div style={{width: '100%', height: '80%'}}>
                        <div style={{display: "flex", justifyContent: "center", alignItems: "center", width: '100%'}}>
                            <img src="/loading_moi_2.svg" alt="Loading..." style={{width: '70px', height: '70px'}}/>
                        </div>
                        <div style={{display: "flex", justifyContent: "center", alignItems: "center", width: '100%'}}>
                            {uploadProgress > 0 && (
                                <Box mt={3} sx={{width: "100%"}}>
                                    <LinearProgress variant="determinate" value={uploadProgress} sx={{height: "1em"}}/>
                                    <Typography variant="body2" align="center"
                                                mt={1}>{`${uploadProgress}%`}</Typography>
                                </Box>
                            )}
                        </div>
                    </div>


                </div>
            )}
            <Box display="flex" justifyContent="center" alignItems="center">
                <Paper elevation={3} sx={{p: 4, width: selectedFile ? "100%" : 400}}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Nạp dữ liệu - {table === 'SoKeToan-KTQT' ? `Sổ kế toán - ${company}` : table === 'Vas' ? `Cân đối phát sinh - ${company}` : table === 'Luong' ? "Lương" : table === 'DataCRM' ? "Data CRM" : ''}</Typography>

                        <IconButton onClick={() => {
                            onClose();
                        }}><CgCloseR style={{marginRight: '-10px'}} size={25}/></IconButton>
                    </Box>
                    {!selectedFile ? (
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12}>
                                <Box className={`upload-area`}
                                     sx={{border: "2px dashed gray", p: 4, textAlign: "center", cursor: "pointer"}}>
                                    <TfiImport size={25}/>
                                    <Typography variant="body1" mt={2}>Kéo thả tệp vào đây hoặc</Typography>
                                    <Button variant="outlined" component="label" startIcon={<TfiImport/>} sx={{mt: 2}}>
                                        Chọn tệp
                                        <Input type="file" accept=".xls,.xlsx,.csv" onChange={handleFileChange} hidden/>
                                    </Button>
                                </Box>
                                <span style={{fontFamily: 'Reddit Sans', color: "#7b7b7b"}}>
                                    <i style={{fontSize: 11}}>
                                        <br/> Lưu ý: <br/>
                                        - Định dạng file upload là <strong style={{fontSize: 12}}>excel</strong>(.xls, .xlsx, .csv) <br/>
                                        - Format của các trường số liệu là <strong
                                        style={{fontSize: 12}}>general</strong> (không có dấy phẩy thập phân) <br/>
                                        - Hàng đầu tiên là header <br/>
                                        - Đối với cột ngày phải là <strong style={{fontSize: 12}}>"dạng chuỗi"</strong>(text) và có thể nhận vào định dạng: <br/>
                                        DD/MM/YYYY hoặc ngày và tháng riêng biệt.( Không nhận các định dạng khác). <br/>
                                        - Preview để xem trước dữ liệu sẽ được nạp vào.
                                    </i>
                                </span>
                            </Grid>
                            {fileName && <Grid item xs={12}><Typography variant="body2">{fileName}</Typography></Grid>}
                        </Grid>
                    ) : (
                        <>
                            <div style={{width: "1100px"}}>
                                <div className="title-preview">
                                    <div className="left-title-preview">
                                        <label htmlFor="file">FILE: </label>
                                        <input
                                            type="text"
                                            id="file"
                                            value={fileName}
                                            disabled={true}
                                            style={{width: "300px", backgroundColor: "#D9D9D9"}}
                                        />
                                        <span style={{fontFamily: 'Reddit Sans', fontSize: 12}}>

                                            <i style={{fontSize: 11}}>
                                                <br/> Lưu ý: <br/>
                                                - Định dạng file upload là <strong style={{fontSize: 12}}>excel</strong>(.xls, .xlsx, .csv) <br/>
                                                - Format của các trường số liệu là <strong
                                                style={{fontSize: 12}}>general</strong> (không có dấy phẩy thập phân) <br/>
                                                - Hàng đầu tiên là header <br/>
                                                - Đối với cột ngày phải là <strong
                                                style={{fontSize: 12}}>"dạng chuỗi"</strong>(text) và có thể nhận vào định dạng: <br/>
                                                DD/MM/YYYY hoặc ngày và tháng riêng biệt.( Không nhận các định dạng khác). <br/>
                                                - Preview để xem trước dữ liệu sẽ được nạp vào.
                                            </i>
                                        </span>

                                    </div>

                                    <div className="right-title-preview">
                                        {invalidCells.length > 0 &&
                                            <button
                                                className={'button-preview duyet'}
                                                onClick={() => handleShowErrorRows()} // Hiển thị chỉ lỗi
                                                disabled={!statusButton}
                                            >
                                                Xem lỗi
                                            </button>
                                        }

                                        <button
                                            className={'button-preview duyet'}
                                            onClick={() => handlePreview(false)}
                                            disabled={!statusButton}
                                        >
                                            Xem trước
                                        </button>
                                    </div>
                                </div>
                                <Grid container spacing={2}>
                                    <Grid item xs={7.5}>
                                    </Grid>
                                    {table === 'SoKeToan-KTQT' &&
                                        <Grid item xs={4.5}>
                                            <Typography variant="body1" fontWeight="bold">Chọn tháng import</Typography>
                                            <CustomMultiSelect
                                                options={monthOptions}
                                                value={selectedMonths}
                                                onChange={handleSelectChange}
                                                placeholder="Chọn tháng..."
                                                isDisabled={!statusButton}
                                            />
                                        </Grid>}


                                </Grid>
                                <Dialog open={confirmDialogOpen} onClose={handleCancelDelete}>
                                    <DialogTitle>Xóa dữ liệu cũ</DialogTitle>
                                    <DialogContent>
                                        {isAllSelected
                                            ? "Toàn bộ dữ liệu sẽ bị xóa sạch. Bạn có muốn tiếp tục không? (Không thể hoàn tác)"
                                            : `Dữ liệu của các tháng ${selectedMonths.map(m => m.label).join(", ")} sẽ bị xóa. Bạn có muốn tiếp tục không? (Không thể hoàn tác)`}
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={handleCancelDelete}>Từ chối</Button>
                                        <Button onClick={handleConfirmDelete}>Đồng ý</Button>
                                    </DialogActions>
                                </Dialog>

                                <Grid container spacing={2}>

                                    <Grid item xs={3}>
                                        <Typography variant="body1" fontWeight="bold">Danh sách cột dữ liệu</Typography>
                                        <ul style={{
                                            listStyle: 'none',
                                            maxHeight: '400px',
                                            overflowY: 'auto', padding: '10px', backgroundColor: '#f7f7f7'
                                        }}>
                                            {fileHeaders.map((header, index) => (
                                                <li key={index}
                                                    style={{
                                                        padding: '10px 0',
                                                        borderBottom: '1px solid #ddd'
                                                    }}>{header}</li>
                                            ))}
                                        </ul>
                                    </Grid>
                                    <Grid item xs={9}>
                                        <Typography variant="body1" fontWeight="bold">Mapping</Typography>
                                        <div className="import-mapping">
                                            <Grid container spacing={2}>
                                                {table === 'SoKeToan-KTQT' && (<>
                                                    <Grid item xs={6}>
                                                        <Box mb={1}>
                                                            <label htmlFor={'day'}>Ngày</label>
                                                            <CustomImportSelect
                                                                value={fileHeaders.find(header => header === mappingValues.day) ? {
                                                                    value: mappingValues.day,
                                                                    label: mappingValues.day
                                                                } : null}
                                                                onChange={(selectedOption) => handleMappingChange(selectedOption, 'day')}
                                                                options={fileHeaders.map((header) => ({
                                                                    value: header,
                                                                    label: header
                                                                }))}
                                                                placeholder="Chọn cột"
                                                                isDisabled={isSelectDisabled}
                                                                isInvalid={invalidFields.day}  // Highlight khi ngày không hợp lệ
                                                            />
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box mb={1}>
                                                            <label htmlFor={'month'}>Tháng</label>
                                                            <CustomImportSelect
                                                                value={fileHeaders.find(header => header === mappingValues.month) ?
                                                                    {
                                                                        value: mappingValues.month,
                                                                        label: mappingValues.month
                                                                    } : null}
                                                                onChange={(selectedOption) => handleMappingChange(selectedOption, 'month')}
                                                                options={fileHeaders.map((header) => ({
                                                                    value: header,
                                                                    label: header
                                                                }))}
                                                                placeholder={isMonthSelectDisabled ? "Khóa" : "Chọn cột"}
                                                                isDisabled={isMonthSelectDisabled || isSelectDisabled}
                                                                isInvalid={invalidFields.month}/>

                                                        </Box>
                                                    </Grid>
                                                </>)}


                                                {editableColumns.map((column, index) =>

                                                    // column?.field === 'day' || column?.field === 'month' ? null : (
                                                    <Grid item xs={6} key={index}>
                                                        <Box mb={1}>
                                                            <label htmlFor={column.label}>{column.label}</label>
                                                            <CustomImportSelect
                                                                value={fileHeaders.find(header => header === mappingValues[column.field]) ? {
                                                                    value: mappingValues[column.field],
                                                                    label: mappingValues[column.field]
                                                                } : null}
                                                                onChange={(selectedOption) => handleMappingChange(selectedOption, column.field)}
                                                                options={fileHeaders.map((header) => ({
                                                                    value: header, label: header
                                                                }))}
                                                                placeholder="Chọn cột"
                                                                isDisabled={isSelectDisabled}
                                                                isInvalid={invalidFields[column.field]}
                                                            />


                                                        </Box>
                                                    </Grid>
                                                )
                                                    // )
                                                }
                                            </Grid>
                                        </div>
                                    </Grid>
                                </Grid>

                                <Grid item xs={12} mt={3} sx={{display: "flex", justifyContent: "center"}}>
                                    <Button variant="contained" color="primary" disabled={!statusButton}
                                            onClick={selectedMonths.length > 0 ? handleUploadClick : handleUpload}
                                            sx={{px: 20, py: 2}}>
                                        Nhập Dữ Liệu
                                    </Button>
                                </Grid>


                                <Dialog open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} maxWidth="extra"
                                        fullWidth>
                                    <DialogTitle>Preview Data</DialogTitle>
                                    <DialogContent>
                                        <div style={{
                                            width: "100%",
                                            height: "800px",
                                            maxHeight: "700px",
                                            overflow: "auto"
                                        }}
                                             className="ag-theme-quartz">
                                            <AgGridReact
                                                rowData={previewData}
                                                columnDefs={
                                                    [{
                                                        headerName: 'Số thứ tự',
                                                        field: 'serial_number',
                                                        width: 100,
                                                        editable: false,
                                                        cellStyle: {textAlign: 'center'},
                                                        pinned: 'left',
                                                    },
                                                        ...editableColumns.map(col => {
                                                            const isNumericField = ['ps_no', 'ps_co', 'so_tien', 't1_open_no', 't1_open_co', 't1_open_net', 'cf_luong_gross', 'luong_co_dinh', 'luong_bo_sung', 'ot', 'phu_cap', 'thuong', 'khac', 'bhxh_cty_tra', 'bhyt_cty_tra', 'bhtn_cty_tra', 'cong_doan', 'bhxh_nv_tra', 'bhyt_nv_tra', 'bhtn_nv_tra', 'thue_tncn'].includes(col.field);
                                                            return {
                                                                headerName: col.label,
                                                                field: col.field,
                                                                editable: true,
                                                                valueFormatter: isNumericField ? (params) => formatCurrency(params.value) : null,
                                                                cellStyle: (params) => {
                                                                    const isInvalidCell = invalidCells.some(cell => cell.row === params.node.rowIndex && cell.col === params.colDef.field);
                                                                    return isInvalidCell
                                                                        ? {
                                                                            backgroundColor: 'rgb(255,75,75)',
                                                                            color: 'white',
                                                                            textAlign: 'right'
                                                                        }
                                                                        : {textAlign: 'right'};
                                                                }
                                                            };
                                                        })
                                                    ]}
                                                defaultColDef={{
                                                    editable: true, // Allow editing
                                                    resizable: true,
                                                    cellValueChanged: (params) => handleCellValueChange(params), // Handle cell value changes
                                                }}
                                                domLayout='autoHeight'
                                            />

                                        </div>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={() => setIsPreviewOpen(false)} color="primary">Close</Button>
                                    </DialogActions>
                                </Dialog>
                            </div>
                        </>
                    )}
                </Paper>
            </Box>
        </>
    );
};

export default FileImportComponent;
