import React, { useContext, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
	Box,
	Button as MuiButton,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	LinearProgress,
	Typography,
} from '@mui/material';
import { Button, message, Modal, Radio, Select as AntdSelect, Tabs, Upload } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { TfiImport } from 'react-icons/tfi';
import instance from '../../../../apis/axiosInterceptors.jsx';
import './import.css';
import CustomImportSelect from './CustomImportSelect.jsx';
import { createNewVas, getAllVas, updateVas } from '../../../../apisKTQT/vasService.jsx';
import { deleteSoKeToanByMonth, deleteSoKeToanByYear } from '../../../../apisKTQT/soketoanService.jsx';
import CustomMultiSelect from './CustomImportMultiSelect.jsx';
import { formatCurrency } from '../../functionKTQT/formatMoney.js';
import { logicListT_KTQT } from '../../../Home/AgridTable/SoLieu/CDPS/logicCDPS.js';
import { getAllKmf } from '../../../../apisKTQT/kmfService.jsx';
import { getAllKmns } from '../../../../apisKTQT/kmnsService.jsx';
import { getAllUnits } from '../../../../apisKTQT/unitService.jsx';
import { getAllProject } from '../../../../apisKTQT/projectService.jsx';
import { getAllProduct } from '../../../../apisKTQT/productService.jsx';
import { getAllVendor } from '../../../../apisKTQT/vendorService.jsx';
import { getAllTeam } from '../../../../apisKTQT/teamService.jsx';
import { getAllKenh } from '../../../../apisKTQT/kenhService.jsx';
import { createNewDataCRM } from '../../../../apis/dataCRMService.jsx';
import { createNewLeadManagement } from '../../../../apis/leadManagementService.jsx';
import { MyContext } from '../../../../MyContext.jsx'; // You can use 'string-similarity' package
import { getAllApprovedVersion, getApprovedVersionDataById } from '../../../../apis/approvedVersionTemp.jsx';
import { getTemplateInfoByTableId, getTemplateRow } from '../../../../apis/templateSettingService.jsx';
import { extractNameFromUnitCode, extractNameFromComposite, extractUnitCodeFromComposite } from '../../VanHanh/createDM.js';


const TABS = {
	DATA: '1',
	MAPPING: '2',
	PREVIEW: '3',
	ERROR: '4',
};

const FileImportComponent = ({
								 apiUrl, onFileImported, onClose, table, company, sktType,
							 }) => {
	const [selectedFile, setSelectedFile] = useState(false);
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
	const [selectedCompany, setSelectedCompany] = useState(null);
	const [isAllSelected, setIsAllSelected] = useState(false);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const originalParsedData = useRef([]); // Lưu dữ liệu gốc
	const { yearCDSD, listCompany } = useContext(MyContext);
	const [activeTab, setActiveTab] = useState(TABS.DATA);
	const [importSource, setImportSource] = useState('rubik'); // 'upload' | 'rubik'
	const [rubikFiles, setRubikFiles] = useState([]);
	const [rubikLoading, setRubikLoading] = useState(false);
	const [selectedRubikFile, setSelectedRubikFile] = useState(null);
	const [forceChooseSource, setForceChooseSource] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key == 'Escape') {
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

	useEffect(() => {
		if (importSource === 'rubik') {
			setRubikLoading(true);
			getAllApprovedVersion().then(allData => {
				const data = allData.filter(item =>
					(Array.isArray(item.apps) && item.apps?.includes('fdr')),
				);
				setRubikFiles(data.map(item => ({
					id: item.id,
					name: item.name,
					id_version: item.id_version,
					id_fileNote: item.id_fileNote,
					updated_at: item.updated_at,
					created_at: item.created_at,
				})));
			}).finally(() => setRubikLoading(false));
		}
	}, [importSource]);

	const monthOptions = [
		{ value: 1, label: 'Tháng 1' },
		{ value: 2, label: 'Tháng 2' },
		{ value: 3, label: 'Tháng 3' },
		{ value: 4, label: 'Tháng 4' },
		{ value: 5, label: 'Tháng 5' },
		{ value: 6, label: 'Tháng 6' },
		{ value: 7, label: 'Tháng 7' },
		{ value: 8, label: 'Tháng 8' },
		{ value: 9, label: 'Tháng 9' },
		{ value: 10, label: 'Tháng 10' },
		{ value: 11, label: 'Tháng 11' },
		{ value: 12, label: 'Tháng 12' },
		{ value: 'all', label: 'Toàn bộ' },
	];
	const yearOptions = [
		{ value: 'all', label: 'Toàn bộ' },
	];


	const editableColumnsSKTChuT = [
		{ field: 'day', label: 'DD', code_automp: 'S1' },
		{ field: 'month', label: 'MM', code_automp: 'S2' },
		{ field: 'year', label: 'Năm (YYYY)', code_automp: 'S3' },
		{ field: 'diengiai', label: 'Diễn giải', code_automp: 'S4' },
		{ field: 'tk_no', label: 'Tài khoản', code_automp: 'S5' },
		{ field: 'tk_co', label: 'Tài khoản đối ứng', code_automp: 'S6' },
		{ field: 'ps_no', label: 'Phát sinh nợ', code_automp: 'S7' },
		{ field: 'ps_co', label: 'Phát sinh có', code_automp: 'S8' },
		// { field: 'vender', label: 'Khách hàng', code_automp: 'S9' },
		// { field: 'kmns', label: 'Khoản mục thu chi', code_automp: 'S10' },
		{ field: 'kmfGoc', label: 'Khoản mục phí', code_automp: 'S11' },
		// { field: 'hopDong', label: 'Hợp đồng', code_automp: 'S12' },
		// { field: 'hoaDon', label: 'Hóa đơn', code_automp: 'S13' },
		{ field: 'projectGoc', label: 'Vụ việc', code_automp: 'S14' },
		// { field: 'team_codeGoc', label: 'Phòng ban', code_automp: 'S15' },
		{ field: 'productGoc', label: 'Sản phẩm', code_automp: 'S16' },
		// { field: 'kenhGoc', label: 'Kênh', code_automp: 'S17' },
		// {field: 'deal', label: 'Deal', code_automp: 'S18'},
		{ field: 'unit_code', label: 'Đơn vị', code_automp: 'S19' },
		// { field: 'chuThich', label: 'Chú thích', code_automp: 'S20' },
		// { field: 'soChungTu', label: 'Chứng từ', code_automp: 'S21' },
		// { field: 'noiBo', label: 'Nội bộ', code_automp: 'S22' },
		// {field: 'consol', label: 'Consol', code_automp: 'S23'},
	];

	const editableColumnsSKTDon = [
		{ field: 'day', label: 'Ngày', code_automp: 'S1' },
		{ field: 'month', label: 'Tháng', code_automp: 'S2' },
		{ field: 'year', label: 'Năm', code_automp: 'S3' },
		{ field: 'diengiai', label: 'Diễn giải', code_automp: 'S4' },
		{ field: 'tk_no', label: 'Tài khoản nợ', code_automp: 'S5' },
		{ field: 'tk_co', label: 'Tài khoản có', code_automp: 'S6' },
		{ field: 'so_tien', label: 'Số tiền', code_automp: 'S7' },
		// { field: 'vender', label: 'Khách hàng', code_automp: 'S8' },
		// { field: 'kmns', label: 'Khoản mục thu chi', code_automp: 'S9' },
		{ field: 'kmfGoc', label: 'Khoản mục phí', code_automp: 'S10' },
		// { field: 'hopDong', label: 'Hợp đồng', code_automp: 'S11' },
		// { field: 'hoaDon', label: 'Hóa đơn', code_automp: 'S12' },
		{ field: 'projectGoc', label: 'Vụ việc', code_automp: 'S13' },
		// { field: 'team_codeGoc', label: 'Phòng ban', code_automp: 'S14' },
		{ field: 'productGoc', label: 'Sản phẩm', code_automp: 'S15' },
		{ field: 'kenhGoc', label: 'Kênh', code_automp: 'S16' },
		// {field: 'deal', label: 'Deal', code_automp: 'S17'},
		{ field: 'unit_code', label: 'Đơn vị', code_automp: 'S18' },
		// { field: 'chuThich', label: 'Chú thích', code_automp: 'S19' },
		// { field: 'soChungTu', label: 'Chứng từ', code_automp: 'S20' },
		// { field: 'noiBo', label: 'Nội bộ', code_automp: 'S21' },
		// {field: 'consol', label: 'Consol', code_automp: 'S22'},
	];

	const editableColumnsVas = [
		{ field: 'year', label: 'Năm', code_automp: 'V1' },
		{ field: 'ma_tai_khoan', label: 'Mã tài khoản', code_automp: 'V2' },
		{ field: 'ten_tai_khoan', label: 'Tên tài khoản', code_automp: 'V3' },
		{ field: 'dp', label: 'Tên thể hiện', code_automp: 'V4' },
		{ field: 't1_open_no', label: 'Tháng 1 OB nợ', code_automp: 'V5' },
		{ field: 't1_open_co', label: 'Tháng 1 OB có', code_automp: 'V6' },
		{ field: 't1_open_net', label: 'Tháng 1 OB net', code_automp: 'V7' },
		{ field: 'phan_loai', label: 'Phân loại', code_automp: 'V8' },
		{ field: 'chu_thich_tai_khoan', label: 'Chú thích', code_automp: 'V9' },
		{ field: 'kc_co', label: 'Kết chuyển nợ', code_automp: 'V10' },
		{ field: 'kc_no', label: 'Kết chuyển có', code_automp: 'V11' },
		{ field: 'kc_net', label: 'Kết chuyển net', code_automp: 'V12' },
		{ field: 'kc_net2', label: 'Kết chuyển net 2', code_automp: 'V13' },
		// {field: 'consol', label: 'Consol', code_automp: 'V14'},
	];

	const editableColumnsLuong = [
		{ field: 'doi_tuong', label: 'Đối tượng', code_automp: 'L1' },
		{ field: 'cost_object', label: 'Cost object', code_automp: 'L2' },
		{ field: 'bu', label: 'Business unit', code_automp: 'L3' },
		{ field: 'month', label: 'Tháng', code_automp: 'L4' },
		{ field: 'year', label: 'Năm', code_automp: 'L5' },
		{ field: 'cf_luong_gross', label: 'CF lương gross', code_automp: 'L6' },
		{ field: 'luong_co_dinh', label: 'Lương cố định', code_automp: 'L7' },
		{ field: 'luong_bo_sung', label: 'Lương bổ sung', code_automp: 'L8' },
		{ field: 'ot', label: 'OT', code_automp: 'L9' },
		{ field: 'phu_cap', label: 'Phụ cấp', code_automp: 'L10' },
		{ field: 'thuong', label: 'Thưởng', code_automp: 'L11' },
		{ field: 'khac', label: 'Khác', code_automp: 'L12' },
		{ field: 'bhxh_cty_tra', label: 'BHXH Cty trả', code_automp: 'L13' },
		{ field: 'bhyt_cty_tra', label: 'BHYT Cty trả', code_automp: 'L14' },
		{ field: 'bhtn_cty_tra', label: 'BHTN Cty trả', code_automp: 'L15' },
		{ field: 'cong_doan', label: 'Công đoàn', code_automp: 'L16' },
		{ field: 'bhxh_nv_tra', label: 'BHXH NV trả', code_automp: 'L17' },
		{ field: 'bhyt_nv_tra', label: 'BHYT NV trả', code_automp: 'L18' },
		{ field: 'bhtn_nv_tra', label: 'BHTN NV trả', code_automp: 'L19' },
		{ field: 'thue_tncn', label: 'Thuế TNCN', code_automp: 'L20' },
	];

	const editableColumnsDataCRM = [
		{ field: 'code', label: 'Mã đơn hàng', code_automp: 'D1' },
		{ field: 'ngay', label: 'Ngày đơn hàng', code_automp: 'D2' },
		{ field: 'week', label: 'Tuần', code_automp: 'D3' },
		{ field: 'ma_khach_hang', label: 'Mã khách hàng', code_automp: 'D4' },
		{ field: 'ten_khach_hang', label: 'Tên khách hàng', code_automp: 'D5' },
		{ field: 'group', label: 'Group', code_automp: 'D6' },
		{ field: 'dia_chi', label: 'Địa chỉ', code_automp: 'D7' },
		{ field: 'province', label: 'Tỉnh thành', code_automp: 'D8' },
		{ field: 'ma_san_pham', label: 'Mã sản phẩm', code_automp: 'D9' },
		{ field: 'ten_san_pham', label: 'Tên sản phẩm', code_automp: 'D10' },
		{ field: 'sdt', label: 'Số điện thoại', code_automp: 'D11' },
		{ field: 'so_luong', label: 'Số lượng', code_automp: 'D12' },
		{ field: 'don_gia', label: 'Đơn giá', code_automp: 'D13' },
		{ field: 'thanh_tien', label: 'Thành tiền', code_automp: 'D14' },
		{ field: 'ty_le_giam_gia', label: 'Tỷ lệ giảm giá', code_automp: 'D15' },
		{ field: 'gia_tri_giam_gia', label: 'Giá trị giảm giá', code_automp: 'D16' },
		{ field: 'thanh_tien_sau_giam_gia', label: 'Thành tiền sau giảm giá', code_automp: 'D17' },
		{ field: 'ma_kenh', label: 'Mã kênh', code_automp: 'D18' },
		{ field: 'ten_kenh', label: 'Tên kênh', code_automp: 'D19' },
		{ field: 'nhan_vien_ban_hang', label: 'Nhân viên bán hàng', code_automp: 'D20' },
		{ field: 'phong_ban', label: 'Phòng ban', code_automp: 'D21' },
		{ field: 'ghi_chu', label: 'Ghi chú', code_automp: 'D22' },
	];


	const editableColumnsLeadManagement = [
		{ field: 'code', label: 'Lead ID', code_automp: 'D1' },
		{ field: 'name', label: 'Tên lead', code_automp: 'D2' },
		{ field: 'ngay', label: 'Ngày tạo', code_automp: 'D3' },
		{ field: 'type', label: 'Loại B2C/B2B', code_automp: 'D4' },
		{ field: 'ten_lien_he', label: 'Tên liên hệ', code_automp: 'D5' },
		{ field: 'chu_thich_lien_he', label: 'Chú thích liên hệ', code_automp: 'D6' },
		{ field: 'sdt', label: 'Số điện thoại', code_automp: 'D7' },
		{ field: 'dia_chi', label: 'Địa chỉ', code_automp: 'D8' },
		{ field: 'tinh_thanh', label: 'Tỉnh thành', code_automp: 'D9' },
		{ field: 'mail', label: 'Mail', code_automp: 'D10' },
		{ field: 'nguon_lead', label: 'Nguồn lead', code_automp: 'D11' },
		{ field: 'uu_tien', label: 'Ưu tiên', code_automp: 'D12' },
		{ field: 'da_convert', label: 'Đã convert', code_automp: 'D13' },
		{ field: 'pic', label: 'PIC', code_automp: 'D14' },
		{ field: 'thong_tin_khac', label: 'Thông tin khác', code_automp: 'D15' },
		{ field: 'ngay_cuoi_lien_he', label: 'Ngày liên hệ cuối', code_automp: 'D16' },
		{ field: 'trang_thai', label: 'Trạng thái', code_automp: 'D17' },
	];

	const numericFields = [
		'ps_no', 'ps_co', 'so_tien', 't1_open_no', 't1_open_co', 't1_open_net',
		'cf_luong_gross', 'luong_co_dinh', 'luong_bo_sung', 'ot', 'phu_cap',
		'thuong', 'khac', 'bhxh_cty_tra', 'bhyt_cty_tra', 'bhtn_cty_tra',
		'cong_doan', 'bhxh_nv_tra', 'bhyt_nv_tra', 'bhtn_nv_tra', 'thue_tncn',
	];
	// Choose the correct columns based on table type
	const editableColumns =
		table == 'SoKeToan-KTQT' ? (sktType == 'skt_t' ? editableColumnsSKTChuT : sktType == 'skt_don' ? editableColumnsSKTDon : [])
			: table == 'Vas' ? editableColumnsVas
				: table == 'Luong' ? editableColumnsLuong
					: table == 'Data-CRM' ? editableColumnsDataCRM
						: table == 'Lead-Management' ? editableColumnsLeadManagement
							: [];
	// Handle select change
	const handleSelectChange = (selected) => {
		if (selected.find(option => option.value == 'all')) {
			setSelectedMonths([{ value: 'all', label: 'Toàn bộ' }]);
			setIsAllSelected(true);
		} else {
			setSelectedMonths(selected);
			if (selected.length == 12) {
				setSelectedMonths([{ value: 'all', label: 'Toàn bộ' }]);
				setIsAllSelected(true);
			} else {
				setIsAllSelected(false);
			}
		}
	};


	const handleSelectCompanyChange = (selected) => {
		console.log(selected);
		setSelectedCompany(selected);
	};
	const validateField = (field, value, rowIndex, invalidFieldsUpdated, invalidCells, errorDetails) => {
		let isValid = true;
		let error = '';

		// Define validation field groups
		const numericFields = [
			'ps_no', 'ps_co', 'so_tien', 't1_open_no', 't1_open_co', 't1_open_net',
			'cf_luong_gross', 'luong_co_dinh', 'luong_bo_sung', 'ot', 'phu_cap',
			'thuong', 'khac', 'bhxh_cty_tra', 'bhyt_cty_tra', 'bhtn_cty_tra',
			'cong_doan', 'bhxh_nv_tra', 'bhyt_nv_tra', 'bhtn_nv_tra', 'thue_tncn',
		];

		const requiredFields = [
			'diengiai', 'ma_tai_khoan', 'ten_tai_khoan',
			'doi_tuong', 'cost_object', 'bu',
		];

		const uppercaseFields = [
			'company', 'consol', 'vender', 'kmns', 'kmf', 'unit_code',
			'kenh', 'project',
		];
		// Handle date fields
		if (field == 'day') {
			if (value == null || value == undefined || value == '' || value == '0') {
				isValid = false;
				error = 'Ngày không được để trống';
			} else if (!/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(value) && !/^\d{1,2}$/.test(value)) {
				isValid = false;
				error = 'Ngày không hợp lệ, yêu cầu định dạng dd hoặc dd/mm/yyyy';
			}
		} else if (field == 'month') {
			const monthValue = parseInt(value, 10);
			if (value == null || value == undefined || value == '' || value == '0') {
				isValid = false;
				error = 'Tháng không được để trống';
			} else if (isNaN(monthValue) || monthValue < 1 || monthValue > 12) {
				isValid = false;
				error = 'Tháng không hợp lệ, giá trị phải từ 1 đến 12';
			}
		} else if (field == 'year') {
			const yearValue = parseInt(value, 10);
			if (value == null || value == 0) {
				isValid = false;
				error = 'Năm không được để trống';
			} else if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
				isValid = false;
				error = 'Năm không hợp lệ, giá trị phải từ 1900 đến 2100';
			}
		}
		// Handle numeric fields
		else if (numericFields.includes(field)) {
			if (value == null || value == undefined || value == '' || value == '0') {
				value = '0';
			} else if (typeof value == 'string' && value.includes(',')) {
				isValid = false;
				error = `${field} không được chứa dấu phẩy, vui lòng sử dụng dấu chấm.`;
			} else if (isNaN(parseFloat(value))) {
				isValid = false;
				error = `${field} phải là số hợp lệ.`;
			}
		}
		// Handle required fields
		else if (requiredFields.includes(field)) {
			if (!value && (field !== 'so_tien' || sktType == 'skt_don')) {
				isValid = false;
				error = `${field} không được để trống.`;
			}
		}
		// Handle uppercase fields
		else if (uppercaseFields.includes(field) && value) {
			value = String(value).toUpperCase();
		}

		// Handle validation errors
		if (!isValid) {
			invalidFieldsUpdated[field] = true;
			invalidCells.push({ row: rowIndex, col: field });

			if (!errorDetails[field]) {
				errorDetails[field] = [];
			}

			if (!errorDetails[field].includes(error)) {
				errorDetails[field].push(error);
			}
		}

		return { isValid, error, value };
	};


	const validateInputData = (data, mappingValues, editableColumns) => {
		const validatedData = [];
		const invalidCells = [];
		const errorDetails = {};
		let invalidFieldsUpdated = {};
		let hasErrors = false;
		let rowsWithoutTK = [];

		// First pass: Validate required mappings
		const requiredFields = [];
		if (sktType == 'skt_don') {
			requiredFields.push('so_tien');
		}
		requiredFields.forEach(field => {
			if (!mappingValues[field]) {
				hasErrors = true;
				errorDetails[field] = [`Cột ${field} là bắt buộc`];
			}
		});

		// Second pass: Validate all rows
		data.forEach((row, rowIndex) => {
			const mappedRow = { serial_number: rowIndex + 1 };
			let hasError = false;

			// Check for missing tk_no and tk_co
			const tk_no = row[mappingValues['tk_no']];
			const tk_co = row[mappingValues['tk_co']];
			if (!tk_no && !tk_co) {

				rowsWithoutTK.push(row);
			}

			// Validate each column
			editableColumns.forEach((column) => {
				const selectedHeader = mappingValues[column.field];
				if (!selectedHeader) return;

				let value = row[selectedHeader];
				const isNumeric = numericFields.includes(column.field);
				value = cleanValue(value, isNumeric, column.field);
				mappedRow[column.field] = value;

				const validationResult = validateField(
					column.field,
					value,
					rowIndex,
					invalidFieldsUpdated,
					invalidCells,
					errorDetails,
				);

				if (!validationResult.isValid) {
					hasError = true;
					hasErrors = true;
				}
				mappedRow[column.field] = validationResult.value;
			});

			if (hasError) {
				invalidFieldsUpdated[rowIndex] = true;
			}
			validatedData.push(mappedRow);
		});

		// Show warning for rows without TK
		if (sktType && rowsWithoutTK && rowsWithoutTK.length > 0) {
			let name = rowsWithoutTK.map(row => row.__rowNum__).join(', ');
			message.warning(`Có ${rowsWithoutTK.length} dòng không có tài khoản Nợ và Có (Dòng ${name})`, 5);
		}

		// Third pass: Run logicListT_KTQT validation if sktType is 'skt_don'
		let finalData = validatedData;

		// Process data based on company type
		finalData.forEach(row => {
			// if (company == 'SOL') {
			//     handleSOLCompany(row);
			// } else if (company == 'CG') {
			handleCGCompanies(row);
			// } else {
			//     handleOtherCompanies(row);
			// }
		});

		return {
			validatedData: finalData,
			invalidCells,
			invalidFieldsUpdated,
			errorDetails,
			hasErrors,
		};
	};


	// Auto-mapping function
	const autoMapColumns = (fileHeaders, editableColumns) => {
		const mapping = {};

		// First pass: Map columns based on code
		fileHeaders.forEach((header) => {
			const matchingColumn = editableColumns.find((column) => {
				// Cách cũ: match code_automp trong header split
				if (column.code_automp && header?.split(' - ')[1]?.includes(column.code_automp) && header.split(' - ')[1]?.length == column.code_automp.length) {
					return true;
				}
				// Cách mới: match include toàn bộ header với label/code_automp
				const headerNorm = header.replace(/\s+/g, '').toLowerCase();
				const labelNorm = (column.label || '').replace(/\s+/g, '').toLowerCase();
				const codeNorm = (column.code_automp || '').replace(/\s+/g, '').toLowerCase();
				return (
					headerNorm.includes(labelNorm) ||
					headerNorm.includes(codeNorm) ||
					labelNorm.includes(headerNorm)
				);
			});
			if (matchingColumn) {
				mapping[matchingColumn.field] = header;
			}
		});

		// Validate mapped data
		const {
			validatedData,
			invalidCells,
			invalidFieldsUpdated,
			errorDetails,
			hasErrors,
		} = validateInputData(parsedData, mapping, editableColumns);

		// Show toast for each invalid field
		Object.keys(errorDetails).forEach((field) => {
			if (errorDetails[field].length > 0) {
				message.error(`Cột ${field}: ${[...new Set(errorDetails[field])].join(' ')}`);
			}
		});

		setInvalidCells(invalidCells);
		setInvalidFields(invalidFieldsUpdated);
		setMappingValues(mapping);
		setPreviewData(validatedData); // Cập nhật luôn bảng preview
		if (hasErrors) {
			setStatusButton(false);
		}
	};


	// Usage Example
	useEffect(() => {
		if (fileHeaders.length > 0) {
			autoMapColumns(fileHeaders, editableColumns);
		}

	}, [fileHeaders]);

	const validateAndFormatData = (rowData, mappingValues, editableColumns, invalidFieldsUpdated = {}) => {
		const validatedData = [];
		const invalidCells = [];
		const errorDetails = {};

		// First pass: Validate all rows
		rowData.forEach((row, rowIndex) => {
			const mappedRow = { serial_number: rowIndex + 1 };
			let hasError = false;

			editableColumns.forEach((column) => {
				const selectedHeader = mappingValues[column.field];
				if (!selectedHeader) return;

				let value = row[selectedHeader];
				const isNumeric = numericFields.includes(column.field);
				value = cleanValue(value, isNumeric, column.field);
				mappedRow[column.field] = value;

				const validationResult = validateField(column.field, value, rowIndex, invalidFieldsUpdated, invalidCells, errorDetails);
				if (!validationResult.isValid) {
					hasError = true;
				}
				mappedRow[column.field] = validationResult.value;
			});

			if (hasError) {
				invalidFieldsUpdated[rowIndex] = true;
			}
			validatedData.push(mappedRow);
		});

		return {
			validatedData,
			invalidCells,
			invalidFieldsUpdated,
			errorDetails,
		};
	};

	// Open confirmation dialog
	const handleUploadClick = () => {

		setConfirmDialogOpen(true);
	};

	// Confirmation logic for deleting old data and then importing new data
	const handleConfirmDelete = async () => {
		setConfirmDialogOpen(false);

		if (isAllSelected) {
			await deleteSoKeToanByYearF(yearCDSD, company); // Delete all data
		} else {
			const monthsToDelete = selectedMonths.map(month => month.value);
			await deleteDataForMonths(monthsToDelete); // Delete records by month
		}

		// Now import the new data
		try {
			await handleUpload(parsedData); // Assuming parsedData contains the new records
			message.success('Dữ liệu đã được nhập thành công.');
		} catch (error) {
			message.error('Lỗi khi nhập dữ liệu.');
		}
	};


	// Cancel and close dialog
	const handleCancelDelete = () => {
		setConfirmDialogOpen(false);
	};
	const deleteDataForMonths = async (months) => {
		try {
			for (const month of months) {
				await deleteSoKeToanByMonth(month, yearCDSD, company);
			}
			message.success(`Dữ liệu của các tháng ${months.join(', ')} đã được xóa thành công.`);
		} catch (error) {
			message.error('Lỗi khi xóa dữ liệu.');
		}
	};


	// Function to delete all records
	const deleteSoKeToanByYearF = async () => {
		try {
			await deleteSoKeToanByYear(yearCDSD, company);
			message.success('Toàn bộ dữ liệu đã được xóa thành công.');
		} catch (error) {
			message.error('Lỗi khi xóa toàn bộ dữ liệu.');
		}
	};


	const handleMappingChange = (selectedOption, field) => {
		const selectedHeader = selectedOption ? selectedOption.value : '';

		// Reset errors for the field
		setInvalidFields(prev => {
			const newState = { ...prev };
			delete newState[field];
			return newState;
		});

		// Clear mapping and related errors if no header is selected
		if (!selectedHeader) {
			setMappingValues(prev => {
				const newMapping = { ...prev };
				delete newMapping[field];
				return newMapping;
			});
			setInvalidCells(prev => prev.filter(cell => cell.col !== field));
			return;
		}

		// Validate the new mapping
		const invalidCells = [];
		const errorDetails = {};
		const invalidFieldsUpdated = {};

		// Validate each row with the new mapping
		parsedData.forEach((row, rowIndex) => {
			let value = row[selectedHeader];
			const isNumeric = numericFields.includes(field);
			value = cleanValue(value, isNumeric, field);

			// Update the original data with cleaned value
			parsedData[rowIndex][selectedHeader] = value;

			const validationResult = validateField(
				field,
				value,
				rowIndex,
				invalidFieldsUpdated,
				invalidCells,
				errorDetails,
			);
		});

		// Show validation errors if any
		if (Object.keys(errorDetails).length > 0) {
			Object.keys(errorDetails).forEach(field => {
				if (errorDetails[field].length > 0) {
					message.error(`${field}: ${[...new Set(errorDetails[field])].join(' ')}`);
				}
			});
		}

		// Update states
		setInvalidCells(prev => [
			...prev.filter(cell => cell.col !== field),
			...invalidCells,
		]);

		setMappingValues(prev => ({
			...prev,
			[field]: selectedHeader,
		}));

		// Validate all mapped data after each mapping change
		const {
			validatedData,
			invalidCells: allInvalidCells,
			invalidFieldsUpdated: allInvalidFields,
			errorDetails: allErrorDetails,
		} = validateInputData(parsedData, {
			...mappingValues,
			[field]: selectedHeader,
		}, editableColumns);

		setStatusButton(!allErrorDetails || Object.keys(allErrorDetails).length === 0);

		// Update preview and error rows immediately
		setPreviewData(validatedData);
		setInvalidCells(allInvalidCells);
		setInvalidFields(allInvalidFields);
	};

	useEffect(() => {
		if (selectedMonths.length > 0) {
			// Lấy các giá trị tháng đã chọn

			let selectedMonthValues = selectedMonths.map(option => option.value);
			if (selectedMonthValues.includes('all')) {
				selectedMonthValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
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
			// message.info("Đã hiển thị toàn bộ dữ liệu.");

		}

	}, [selectedMonths, mappingValues]);


	const handlePreview = (showErrorsOnly = false) => {
		const {
			validatedData,
			invalidCells,
			invalidFieldsUpdated,
			errorDetails,
		} = validateInputData(parsedData, mappingValues, editableColumns);

		// Show error notifications first
		Object.keys(errorDetails).forEach((field) => {
			if (errorDetails[field].length > 0) {
				message.warning(`${editableColumns.find(col => col.field == field)?.label || field}: ${errorDetails[field]}`);
			}
		});

		// Update states regardless of errors
		setInvalidCells(invalidCells);
		setInvalidFields(invalidFieldsUpdated);

		// Always allow preview, even with errors
		const filteredData = showErrorsOnly
			? validatedData.filter(row => invalidCells.some(cell => cell.row == row.serial_number - 1))
			: validatedData;

		setPreviewData(filteredData);
		setIsPreviewOpen(true);
	};

	const handleShowErrorRows = () => {
		handlePreview(true); // Hiển thị chỉ các dòng lỗi
	};


	// Updated cleanValue function to set numeric fields to 0 when null, undefined, or empty
	const cleanValue = (value, isNumeric, column) => {
		if (value == undefined || value == null || value == '') {
			return isNumeric ? 0 : ''; // Set 0 for numeric fields, "" for others
		}
		if (typeof value == 'string') {
			value = value.trim(); // Trim spaces
			if (['company', 'consol', 'vender', 'kmns', 'kmf', 'unit_code', 'kenh', 'project'].includes(column)) {
				if (value)
					value = value.toUpperCase();
			}
			return value == '' ? '' : value;
		}
		return value;
	};

	const isValidNumber = (value) => {
		return !isNaN(value) && value !== null && value !== undefined;
	};

	const handleFileChange = (event) => {
		const file = event.target.files[0];
		if (file) {
			setLoading(true);
			setSelectedFile(file);
			setFileName(file.name);
			readFile(file);
		}
	};

	const readFile = async (file) => {
		console.log(file);
		const reader = new FileReader();
		reader.onload = async (e) => {
			const data = await new Uint8Array(e.target.result);
			const workbook = await XLSX.read(data, { type: 'array' });
			const sheetName = workbook.SheetNames[0];
			const worksheet = await workbook.Sheets[sheetName];
			let headers = await XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
			headers = await headers.filter(header => header && header.trim() !== '');

			const json = XLSX.utils.sheet_to_json(worksheet);
			originalParsedData.current = json;  // Lưu dữ liệu vào ref
			setParsedData(json); // Hiển thị dữ liệu
			setFileHeaders(headers);
			message.success(`Đọc file ${file.name} nguồn thành công!`);
			setStatusButton(true);
			setLoading(false);
		};
		reader.readAsArrayBuffer(file);
	};

	const handleCGCompanies = (row) => {
		row.so_tien = (parseFloat(row.ps_no) || 0) - (parseFloat(row.ps_co) || 0);
		let so_tien = parseFloat(row.so_tien);
		let tk_no = row.tk_no + '';
		let tk_co = row.tk_co + '';

		if (tk_no) {
			// Update PL Type based on the updated logic
			if (tk_no.startsWith('911') || tk_co.startsWith('911')) {
				row.pl_type = 'KC';
			} else if (tk_no.startsWith('511')) {
				row.pl_type = 'DT';
			} else if (tk_no.startsWith('635')) {
				row.pl_type = 'CFTC';
			} else if (tk_no.startsWith('62') || tk_no.startsWith('63')) {
				row.pl_type = 'GV';
			} else if (tk_no.startsWith('52') || tk_no.startsWith('641')) {
				row.pl_type = 'CFBH';
			} else if (tk_no.startsWith('642')) {
				row.pl_type = 'CFQL';
			} else if (tk_no.startsWith('515')) {
				row.pl_type = 'DTTC';
			} else if (tk_no.startsWith('71')) {
				row.pl_type = 'DTK';
			} else if (tk_no.startsWith('811')) {
				row.pl_type = 'CFK';
			} else if (tk_no.startsWith('821')) {
				row.pl_type = 'TAX';
			} else {
				row.pl_type = '';
			}

			// Update PL Value based on PL Type
			if (['DT', 'DTK', 'DTTC', 'GV', 'CFK', 'CFTC', 'CFBH', 'CFQL', 'TAX'].includes(row.pl_type)) {
				row.pl_value = -so_tien;
			} else {
				row.pl_value = '';
			}

			// Update Cash Value based on cash flow check
			if (tk_no.startsWith('11') && tk_co.startsWith('11')) {
				row.cash_value = 0;
			} else if (tk_no.startsWith('11')) {
				row.cash_value = so_tien;
			} else {
				row.cash_value = '';
			}
		}
	};

		const processRow = async (row, company, apiUrl) => {
			handleCGCompanies(row);
			// Gửi bản ghi đã xử lý tới server
			await instance.post(apiUrl, row);
		};

	const handleRubikImport = async () => {
		if (!selectedRubikFile) return message.warning('Vui lòng chọn file!');
		setRubikLoading(true);
		try {
			// 1. Lấy thông tin version
			const data = await getApprovedVersionDataById(selectedRubikFile.id);
			// 2. Lấy headers
			const info = await getTemplateInfoByTableId(data.id_template);
			let versionObj;
			if (data.id_version == 1 || data.id_version == null) {
				versionObj = info.versions.find(v => v.version == null);
			} else {
				versionObj = info.versions.find(v => v.version == data.id_version);
			}
			const headerNames = versionObj ? versionObj.columns : [];
			// 3. Lấy rowData
			const rowVersionResponse = await getTemplateRow(data.id_template, data.id_version == 1 || data.id_version == null ? null : data.id_version);
			const rowVersion = rowVersionResponse.rows || [];
			// 4. Parse rows thành mảng giá trị
			const rows = rowVersion.map(row => headerNames.map(h => row.data[h]));
			setFileHeaders(headerNames);
			const parsed = rows.map(rowArr => {
				const obj = {};
				headerNames.forEach((h, i) => {
					obj[h] = rowArr[i] ?? '';
				});
				return obj;
			});
			setParsedData(parsed);
			originalParsedData.current = parsed; // <-- fix: lưu lại dữ liệu gốc để Data File tab luôn hiển thị đúng
			// Tự động mapping các field chuẩn hóa với tên cột thực tế
			let autoMapping = {};
			editableColumns.forEach(col => {
				const found = headerNames.find(h =>
					h.toLowerCase().replace(/[^a-z0-9]/g, '') === col.label.toLowerCase().split('(')[0].replace(/[^a-z0-9]/g, '')
					|| h.toLowerCase().replace(/[^a-z0-9]/g, '') === col.field.toLowerCase().replace(/[^a-z0-9]/g, ''),
				);
				if (found) autoMapping[col.field] = found;
			});
			setMappingValues(autoMapping);
			setPreviewData([]);
			setInvalidCells([]);
			setSelectedFile(true);
			setFileName(selectedRubikFile.name);
			message.success('Lấy file từ rubik thành công!');
		} catch (err) {
			message.error('Lỗi lấy file từ rubik: ' + err.message);
		} finally {
			setRubikLoading(false);
		}
	};

	const handleUpload = async () => {
		setLoading(true);

		const errorColumns = new Set(); // Track invalid columns
		let invalidFieldsUpdated = {};

		let {
			validatedData,
			invalidCells,
		} = validateAndFormatData(parsedData, mappingValues, editableColumns, invalidFieldsUpdated);
		if (Object.keys(invalidFieldsUpdated).length > 0) {
			message.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các cột.');
			setLoading(false);
			return;
		}


		try {
			if (table == 'SoKeToan-KTQT') {
				await uploadSoKeToan(validatedData);
				// message.success(`${validatedData?.length} bản ghi Sổ Kế Toán đã được tải lên thành công.`);
				message.success(<><span style={{ color: '#52C423', fontWeight: 'bold' }}>{validatedData?.length} </span>bản
					ghi Sổ Kế Toán đã được tải lên thành công.</>, 5);
			} else if (table == 'Vas') {
				await uploadVas(validatedData);
				// message.success(`${validatedData?.length} bản ghi Cân Đối Phát Sinh đã được tải lên thành công.`);
				message.success(<><span style={{ color: '#52C423', fontWeight: 'bold' }}>{validatedData?.length} </span>bản
					ghi Cân Đối Phát Sinh đã được tải lên thành công.</>, 5);
			} else if (table == 'Luong') {
				await uploadLuong(validatedData);  // New handler for Luong
				// message.success(`${validatedData?.length} bản ghi Lương đã được tải lên thành công.`);
				message.success(<><span style={{ color: '#52C423', fontWeight: 'bold' }}>{validatedData?.length} </span>bản
					ghi Lương đã được tải lên thành công.</>, 5);
			} else if (table == 'Data-CRM') {
				if (selectedCompany) {
					await uploadDataCRM(validatedData, selectedCompany);  // New handler for Luong
					// message.success(`${validatedData?.length} bản ghi CRM đã được tải lên thành công.`);
					message.success(<><span
						style={{ color: '#52C423', fontWeight: 'bold' }}>{validatedData?.length} </span>bản
						ghi CRM đã được tải lên thành công.</>, 5);
				} else {
					message.warning('Cần lựa chọn công ty để import', 2);
				}

			} else if (table == 'Lead-Management') {
				if (selectedCompany) {
					await uploadDataLeadManagement(validatedData, selectedCompany);  // New handler for Luong
					// message.success(`${validatedData?.length} bản ghi Lead đã được tải lên thành công.`);
					message.success(<><span
						style={{ color: '#52C423', fontWeight: 'bold' }}>{validatedData?.length} </span>bản
						ghi Lead đã được tải lên thành công.</>, 5);
				} else {
					message.warning('Cần lựa chọn công ty để import', 2);
				}

			}
		} catch (error) {
			console.log(error);
			message.error('Lỗi khi tải lên dữ liệu.');
		}

		setLoading(false);
	};
	const uploadLuong = async (cleanedData) => {
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
	};
	const uploadDataCRM = async (cleanedData, selectedCompany) => {

		const totalRows = cleanedData.length;
		let uploadedRows = 0;
		// Process each row of cleaned data and send it to the backend
		for (let row of cleanedData) {
			row.doanh_thu = parseFloat(row.doanh_thu) || 0;
			row.giam_gia = parseFloat(row.giam_gia) || 0;
			row.doanh_thu_thuan = parseFloat(row.doanh_thu_thuan) || 0;
			row.company = selectedCompany.value;

			await createNewDataCRM(row);
			const progress = Math.round((uploadedRows / totalRows) * 100);
			setUploadProgress(progress);
			uploadedRows++;
		}

	};

	const uploadDataLeadManagement = async (cleanedData, selectedCompany) => {

		const totalRows = cleanedData.length;
		let uploadedRows = 0;

		// Process each row of cleaned data and send it to the backend
		for (let row of cleanedData) {
			row.company = selectedCompany.value;
			await createNewLeadManagement(row);
			const progress = Math.round((uploadedRows / totalRows) * 100);
			setUploadProgress(progress);
			uploadedRows++;
		}

	};

		const uploadSoKeToan = async (cleanedData) => {
		let data = cleanedData;
		const BASE_URL = import.meta.env.VITE_API_URL;
		if (sktType && sktType == 'skt_don') {
			data = logicListT_KTQT(data);
		}

		const fetchAllLists = async () => {
			const kmfList = await getAllKmf();
			const kmnsList = await getAllKmns();
			const unitList = await getAllUnits();
			const projectList = await getAllProject();
			const productList = await getAllProduct();
			const vendorList = await getAllVendor();
			const teamList = await getAllTeam();
			const vasList = await getAllVas();
			const kenhList = await getAllKenh();
			// const dealList = await getAllDeal();

			return {
				kmfList,
				kmnsList,
				unitList,
				projectList,
				productList,
				vendorList,
				teamList,
				vasList,
				// dealList,
				kenhList,
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
			// dealList,
			kenhList,
		} = await fetchAllLists();

		const uniqueKMFs = new Set();
		const uniqueKMNSs = new Set();
		const uniqueUnits = new Set();
		const uniqueProjects = new Set();
		const uniqueProducts = new Set();
		const uniqueVendors = new Set();
		const uniqueTeams = new Set();
		const uniqueVAS = new Set();
		// const uniqueDeal = new Set();
		const uniqueKenh = new Set();

		data.forEach(row => {
			// row.so_tien = parseFloat(row.so_tien) || 0
			row.so_tien = (parseFloat(row.ps_no) || 0) - (parseFloat(row.ps_co) || 0);
			row.company = company;
			row.consol = 'CONSOL';
			row.kmf = row.kmfGoc;
			row.unit_codeGoc = row.unit_code;
			row.project = row.projectGoc;
			row.product = row.productGoc;
			row.kenh = row.kenhGoc;
			if (row.company != null && row.company !== '' && row.company !== undefined) {
				if (row.unit_codeGoc != null && row.unit_codeGoc !== '' && row.unit_codeGoc !== undefined) {
					row.unit_code2 = `${row.unit_codeGoc}-${company}`;
					if (row.productGoc != null && row.productGoc !== '' && row.productGoc !== undefined) {
						row.product2 = `${row.productGoc}-${company}-${row.unit_codeGoc}`;
					}
					if (row.kenhGoc != null && row.kenhGoc !== '' && row.kenhGoc !== undefined) {
						row.kenh2 = `${row.kenhGoc}-${company}-${row.unit_codeGoc}`;
					}
					if (row.projectGoc != null && row.projectGoc !== '' && row.projectGoc !== undefined) {
						row.project2 = `${row.projectGoc}-${company}-${row.unit_codeGoc}`;
					}
				}

			}
			if (row.kmfGoc) uniqueKMFs.add(row.kmfGoc);
			if (row.kmnsGoc) uniqueKMNSs.add(row.kmnsGoc);
			if (row.unit_code2) uniqueUnits.add(row.unit_code2);
			if (row.project2) uniqueProjects.add(row.project2);
			if (row.product2) uniqueProducts.add(row.product2);
			if (row.kenh2) uniqueKenh.add(row.kenh2);
			// if (row.deal2) uniqueProducts.add(row.deal2);
			if (row.vender) uniqueVendors.add(row.vender);
			if (row.team_code) uniqueTeams.add(row.team_code);
			if (row.tk_no) uniqueVAS.add(`${row.tk_no}^${row.year}`);
			if (row.tk_co) uniqueVAS.add(`${row.tk_co}^${row.year}`);
		});

		const addNewEntities = async (row) => {
			const newKMFsSet = new Set();
			const newKMNSsSet = new Set();
			const newUnitsSet = new Set();
			const newProjectsSet = new Set();
			const newProductsSet = new Set();
			// const newDealsSet = new Set();
			const newVendorsSet = new Set();
			const newTeamsSet = new Set();
			const newVASSet = new Set();
			const newKenhSet = new Set();
			Array.from(uniqueKMFs).forEach(kmf => {
				if (!kmfList.some(existingKMF => existingKMF.name == kmf && existingKMF.company == company)) {
					if (kmf !== null && kmf !== undefined && kmf !== '') {
						newKMFsSet.add(kmf);
					}
				}
			});

			Array.from(uniqueKMNSs).forEach(kmns => {
				if (!kmnsList.some(existingKMNS => existingKMNS.name == kmns && existingKMNS.company == company)) {
					if (kmns !== null && kmns !== undefined && kmns !== '') {
						newKMNSsSet.add(kmns);
					}
				}
			});

			Array.from(uniqueUnits).forEach(unit => {
				if (!unitList.some(existingUnit => existingUnit.code == unit && existingUnit.company == company)) {
					const name = extractNameFromUnitCode(unit, company);
					if (name !== null && name !== undefined && name !== '') {
						newUnitsSet.add(unit);
					}
				}
			});

			Array.from(uniqueProjects).forEach(project => {
				if (!projectList.some(existingProduct => existingProduct.code == project && existingProduct.company == company)) {
					const name = extractNameFromComposite(project);
					if (name !== null && name !== undefined && name !== '') {
						newProjectsSet.add(project);
					}
				}
			});


			Array.from(uniqueProducts).forEach(product => {
				if (!productList.some(existingProduct => existingProduct.code == product && existingProduct.company == company)) {
					const name = extractNameFromComposite(product);
					if (name !== null && name !== undefined && name !== '') {
						newProductsSet.add(product);
					}
				}
			});

			Array.from(uniqueKenh).forEach(kenh => {
				if (!kenhList.some(existingKenh => existingKenh.code == kenh && existingKenh.company == company)) {
					const name = extractNameFromComposite(kenh);
					if (name !== null && name !== undefined && name !== '') {
						newKenhSet.add(kenh);
					}

				}
			});

			// Array.from(uniqueDeal).forEach(deal => {
			//     if (!dealList.some(existingDeal => existingDeal.code == deal && existingDeal.company == company)) {
			//         let name = deal.split('-')[0]
			//         if (name !== null && name !== undefined && name !== '') {
			//             newProductsSet.add(deal);
			//         }
			//     }
			// });

			Array.from(uniqueVendors).forEach(vendor => {
				if (!vendorList.some(existingVendor => existingVendor.name == vendor && existingVendor.company == company)) {
					if (vendor !== null && vendor !== undefined && vendor !== '') {
						newVendorsSet.add(vendor);
					}
				}
			});

			Array.from(uniqueTeams).forEach(team => {
				if (!teamList.some(existingTeam => existingTeam.name == team && existingTeam.company == company)) {
					if (team !== null && team !== undefined && team !== '') {
						newTeamsSet.add(team);
					}
				}
			});

			Array.from(uniqueVAS).forEach(vas => {

				if (!vasList.some(existingVAS => existingVAS.ma_tai_khoan == vas.split('^')[0] && existingVAS.company == company && existingVAS.year == vas.split('^')[1])) {
					if (vas && vas !== '') {
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
					const unitName = extractNameFromUnitCode(unit, company);
					await instance.post(`${BASE_URL}/api/ktqt-unit`, {
						code: unit,
						name: unitName,
						dp: unitName,
						company: company,
					});
				}
				unitList = await getAllUnits();
			}

			if (newProjectsSet.size > 0) {
				for (const project of newProjectsSet) {
					const projectName = extractNameFromComposite(project);
					const unit_code = extractUnitCodeFromComposite(project, company);
					await instance.post(`${BASE_URL}/api/ktqt-project`, {
						code: project,
						name: projectName,
						dp: projectName,
						unit_code: unit_code,
						company: company,
					});
				}
				projectList = await getAllProject();
			}

			if (newProductsSet.size > 0) {
				for (const product of newProductsSet) {
					const productName = extractNameFromComposite(product);
					const unit_code = extractUnitCodeFromComposite(product, company);
					await instance.post(`${BASE_URL}/api/ktqt-product`, {
						code: product,
						name: productName,
						dp: productName,
						unit_code: unit_code,
						company: company,
					});
				}
				productList = await getAllProduct();
			}


			if (newKenhSet.size > 0) {
				for (const kenh of newKenhSet) {
					const kenhName = extractNameFromComposite(kenh);
					const unit_code = extractUnitCodeFromComposite(kenh, company);
					await instance.post(`${BASE_URL}/api/ktqt-kenh`, {
						code: kenh,
						name: kenhName,
						dp: kenhName,
						unit_code: unit_code,
						company: company,
					});
				}
				kenhList = await getAllKenh();
			}

			// if (newDealsSet.size > 0) {
			//     for (const deal of newDealsSet) {
			//         let dealIn4 = deal.split('-')
			//         await instance.post(`${BASE_URL}/api/ktqt-deal`, {
			//             code: deal,
			//             name: dealIn4[0],
			//             dp: dealIn4[0],
			//             unit_code: dealIn4[2],
			//             company: company,
			//         });
			//     }
			//     dealList = await getAllDeal();
			// }

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
						ma_tai_khoan: vas.split('^')[0],
						ten_tai_khoan: vas.split('^')[0],
						dp: vas.split('^')[0],
						company: company,
						year: vas.split('^')[1],
					});
				}
				vasList = await getAllVas();
			}
		};

			const totalRows = data.length;
			let uploadedRows = 0;

			// Tạo các danh mục liên quan một lần trước khi tạo bản ghi
			await addNewEntities(null);

			// Chuẩn hóa dữ liệu trước khi gửi
			const prepared = data.map((row) => {
				const r = { ...row };
				handleCGCompanies(r);
				return r;
			});

			// Gửi theo lô sử dụng create-bulk để tăng tốc độ
			const batchSize = 500;
			for (let i = 0; i < prepared.length; i += batchSize) {
				const batch = prepared.slice(i, i + batchSize);
				await instance.post(`${apiUrl}/create-bulk`, batch);
				uploadedRows += batch.length;
				const progress = Math.round((uploadedRows / totalRows) * 100);
				setUploadProgress(progress);
			}


		onFileImported && onFileImported(cleanedData);


	};
	const handleCellValueChange = (params) => {
		const { rowIndex, colDef, newValue } = params;
		const field = colDef.field;

		// Update the corresponding value in parsedData
		setParsedData(prevData => {
			const updatedData = [...prevData];
			updatedData[rowIndex][field] = newValue;

			// Perform validation checks
			if (field == 'day') {
				const isValidDay = /^\d{1,2}$/.test(newValue);
				if (!isValidDay) {
					message.warning('Cột ngày không hợp lệ.');
					setInvalidCells(prev => [...prev, { row: rowIndex, col: field }]);
				} else {
					setInvalidCells(prev => prev.filter(cell => !(cell.row == rowIndex && cell.col == field)));
				}
			}

			if (field == 'month') {
				const isValidMonth = newValue >= 1 && newValue <= 12;
				if (!isValidMonth) {
					message.warning('Cột tháng không hợp lệ.');
					setInvalidCells(prev => [...prev, { row: rowIndex, col: field }]);
				} else {
					setInvalidCells(prev => prev.filter(cell => !(cell.row == rowIndex && cell.col == field)));
				}
			}

			// Validate numeric fields (e.g., 'ps_no', 'ps_co', 'so_tien', 'pl_value', 'cash_value')
			const numericFields = ['ps_no', 'ps_co', 'so_tien', 'pl_value', 'cash_value', 't1_open_no', 't1_open_co', 't1_open_net', 'bhyt_nv_tra', 'bhxh_cty_tra', 'ot', 'bhtn_cty_tra', 'bhtn_nv_tra', 'cong_doan', 'thuong', 'phu_cap', 'luong_bo_sung', 'luong_co_dinh', 'bhxh_nv_tra', 'bhyt_cty_tra', 'khac', 'thue_tncn'];
			if (numericFields.includes(field)) {
				const isValidNumber = !isNaN(parseFloat(newValue)) && newValue !== '' && newValue !== null && newValue !== undefined;
				if (!isValidNumber) {
					message.error(`${colDef.headerName} - Dữ liệu số không hợp lệ.`);
					setInvalidCells(prev => [...prev, { row: rowIndex, col: field }]);
				} else {
					// If valid, clean the value and remove the error
					updatedData[rowIndex][field] = parseFloat(newValue);  // Ensure the value is saved as a number
					setInvalidCells(prev => prev.filter(cell => !(cell.row == rowIndex && cell.col == field)));
				}
			}


			return updatedData;
		});
	};

	const uploadVas = async (mappedData) => {
		const totalRows = mappedData.length;
		let uploadedRows = 0;
		let getVas = await getAllVas();

		// Create a lookup map for faster checking
		const existingVasMap = {};
		getVas.filter(record => record.company == company).forEach(record => {
			const key = `${record.ma_tai_khoan}_${record.year}`;
			existingVasMap[key] = record;
		});

		// Create year set for faster filtering
		const importYears = new Set(mappedData.map(row => row.year));

		// Reset t1_open values only for relevant years
		const resetPromises = getVas
			.filter(record => record.company == company && importYears.has(record.year))
			.map(record => {
				record.t1_open_no = 0;
				record.t1_open_co = 0;
				record.t1_open_net = 0;
				return updateVas(record);
			});
		await Promise.all(resetPromises);

		// Process import data
		for (let i = 0; i < totalRows; i++) {
			const row = mappedData[i];
			if (row.ma_tai_khoan == null || row.ma_tai_khoan === '') continue;

			const key = `${row.ma_tai_khoan}_${row.year}`;
			const existingRecord = existingVasMap[key];

			if (!existingRecord) {
				// Create new record
				row.company = company;
				row.consol = 'CONSOL';
				row.t1_open_no = parseInt(row.t1_open_no);
				row.t1_open_co = parseInt(row.t1_open_co);
				row.t1_open_net = parseInt(row.t1_open_net);
				row.year = parseInt(row.year);
				await createNewVas(row);
			} else {
				// Update existing record
				existingRecord.t1_open_no = parseInt(row.t1_open_no);
				existingRecord.t1_open_co = parseInt(row.t1_open_co);
				existingRecord.t1_open_net = parseInt(row.t1_open_net);
				existingRecord.chu_thich_tai_khoan = row.chu_thich_tai_khoan;
				existingRecord.kc_no = row.kc_no;
				existingRecord.kc_co = row.kc_co;
				existingRecord.kc_net = row.kc_net;
				existingRecord.kc_net2 = row.kc_net2;
				existingRecord.phan_loai = row.phan_loai;
				existingRecord.consol = 'CONSOL';
				existingRecord.dp = row.dp;
				await updateVas(existingRecord);
			}

			uploadedRows++;
			const progress = Math.round((uploadedRows / totalRows) * 100);
			setUploadProgress(progress);
		}
		message.success('Toàn bộ dữ liệu đã được tải lên thành công!');


	};

	// Tạo dữ liệu cho tab lỗi
	const errorRows = React.useMemo(() => {
		if (!invalidCells.length) return [];
		const errorRowIdxs = Array.from(new Set(invalidCells.map(cell => cell.row)));
		return errorRowIdxs.map(idx => previewData[idx] || parsedData[idx]);
	}, [invalidCells, previewData, parsedData]);

	// --- UI ---
	return (
		<div style={{ width: '100%', height: '100%' }}>

			{loading && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						height: '100%',
						position: 'fixed',
						width: '100%',
						top: 0,
						left: 0,
						zIndex: 20000,
						backgroundColor: 'rgba(255, 255, 255, 0.96)',
					}}
				>
					<div style={{ width: '100%', height: '80%' }}>
						<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
							<img src="/loading_moi.gif" alt="Loading..." style={{ width: '470px' }} />
						</div>
						<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
							{uploadProgress > 0 && (
								<Box mt={3} sx={{ width: '100%' }}>
									<LinearProgress variant="determinate" value={uploadProgress}
													sx={{ height: '1em' }} />
									<Typography variant="body2" align="center"
												mt={1}>{`${uploadProgress}%`}</Typography>
								</Box>
							)}
						</div>
					</div>
				</div>
			)}


			<Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 8 }}>
				<Tabs.TabPane tab="Data File" key={TABS.DATA}>

					{!selectedFile ? (
						// UI chọn nguồn import/upload/rubik
						<>
							{table === 'SoKeToan-KTQT' && sktType && !selectedFile && (
								<div style={{ marginBottom: 16 }}>
									<Radio.Group
										value={importSource}
										onChange={e => setImportSource(e.target.value)}
										style={{ marginBottom: 16 }}
										optionType="button"
										buttonStyle="solid"
									>
										<Radio.Button value="upload">Tải file từ máy</Radio.Button>
										<Radio.Button value="rubik">Chọn từ Rubik</Radio.Button>
									</Radio.Group>
									<div style={{ display: 'flex', gap: 32 }}>
										{/* Upload file từ máy */}
										<div style={{
											flex: 1,
											opacity: importSource === 'upload' ? 1 : 0.5,
											pointerEvents: importSource === 'upload' ? 'auto' : 'none',
										}}>
											<div className="file-upload-container">
												<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
													<Upload
														accept=".xls,.xlsx,.csv"
														showUploadList={false}
														beforeUpload={file => {
															handleFileChange({ target: { files: [file] } });
															return false;
														}}
														maxCount={1}
													>
														<Button icon={<TfiImport />}>Chọn file</Button>
													</Upload>
													{fileName && <span className="upload-file-name">{fileName}</span>}
												</div>
												<div className="notice-text">
													Định dạng file: .xls, .xlsx, .csv. Hàng đầu là header. Mapping các
													cột dữ liệu bên dưới.<br />
													Các trường số phải là số, không chứa ký tự đặc biệt.
												</div>
											</div>
										</div>
										{/* Chọn file từ rubik */}
										<div style={{
											flex: 1,
											opacity: importSource === 'rubik' ? 1 : 0.5,
											pointerEvents: importSource === 'rubik' ? 'auto' : 'none',
										}}>
											<div className="file-upload-container">
												<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
													<AntdSelect
														showSearch
														style={{ minWidth: 220 }}
														placeholder="Chọn file từ Rubik"
														loading={rubikLoading}
														value={selectedRubikFile ? selectedRubikFile.id : undefined}
														onChange={id => {
															const file = rubikFiles.find(f => f.id === id);
															setSelectedRubikFile(file);
														}}
														optionFilterProp="children"
														filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
													>
														{rubikFiles.map(file => (
															<AntdSelect.Option key={file.id} value={file.id}>
																{file.name} ({file.updated_at?.slice(0, 10) || file.created_at?.slice(0, 10)})
															</AntdSelect.Option>
														))}
													</AntdSelect>
													<Button type="primary" onClick={handleRubikImport}
															loading={rubikLoading} disabled={!selectedRubikFile}>
														Lấy file này
													</Button>
												</div>
												<div className="notice-text">
													Chọn file đã duyệt từ Rubik (Analysis Review). File sẽ được lấy và
													import như file tải lên.<br />
													Định dạng file: .xls, .xlsx, .csv. Hàng đầu là header. Mapping các
													cột dữ liệu bên dưới.
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</>
					) : (
						// Bảng dữ liệu sau khi đã chọn file
						<div style={{ width: '100%' }}>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 16,
								gap: 16,
							}}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
									<label htmlFor="file">FILE: </label>
									<input
										type="text"
										id="file"
										value={fileName}
										disabled={true}
										style={{ width: '300px', backgroundColor: '#D9D9D9' }}
									/>
									<Button
										onClick={() => {
											setSelectedFile(false);
											setFileName('');
											setParsedData([]);
											setFileHeaders([]);
											setMappingValues({});
											setPreviewData([]);
											setInvalidCells([]);
											setSelectedRubikFile(null);
										}}
									>
										Import dữ liệu mới
									</Button>
								</div>
								<div>
									<Button onClick={() => setActiveTab(TABS.MAPPING)} type="primary">Mapping dữ liệu</Button>
								</div>
							</div>
							<div style={{ height: '490px', width: '100%' , position: 'relative' }} className="ag-theme-quartz">
								<AgGridReact
									rowData={parsedData}
									columnDefs={
										fileHeaders.map(header => ({
											headerName: header,
											field: header,
											resizable: true,
										}))
									}
									defaultColDef={{ resizable: true }}
									pagination={true}
									paginationPageSize={300}
									paginationPageSizeSelector={[300, 500, 1000]}
								/>
							</div>
						</div>
					)}
				</Tabs.TabPane>

				<Tabs.TabPane tab="Mapping" key={TABS.MAPPING}>
					<div style={{ marginBottom: 24, display: 'flex', gap: 16, justifyContent: 'end' }}>
						{table == 'SoKeToan-KTQT' && (
							<>
								<div style={{ minWidth: 300 }}>
									<CustomMultiSelect
										options={monthOptions}
										value={selectedMonths}
										onChange={handleSelectChange}
										placeholder="Chọn tháng import..."
										isDisabled={!statusButton}
									/>
								</div>
								<Button onClick={() => setActiveTab(TABS.PREVIEW)} type="primary">Preview dữ liệu</Button>
							</>
						)}
						{(table == 'Data-CRM' || table == 'Lead-Management') && (
							<div style={{ minWidth: 300 }}>
								<Typography variant="body1" fontWeight="bold">Chọn công ty</Typography>
								<CustomImportSelect
									options={listCompany.map((e) => ({
										value: e.code,
										label: e.name,
									}))}
									value={selectedCompany}
									onChange={handleSelectCompanyChange}
									placeholder="Chọn công ty..."
								/>
							</div>
						)}
					</div>
					<div className="import-mapping">
						<Grid container spacing={2}>
							{table == 'SoKeToan-KTQT' && (<>
								<Grid item xs={6}>
									<Box mb={1}>
										<label htmlFor={'day'}>Ngày (DD)</label>
										<CustomImportSelect
											value={fileHeaders.find(header => header == mappingValues.day) ? {
												value: mappingValues.day,
												label: mappingValues.day,
											} : null}
											onChange={(selectedOption) => handleMappingChange(selectedOption, 'day')}
											options={fileHeaders.map((header) => ({
												value: header,
												label: header,
											}))}
											placeholder="Chọn cột"
											isDisabled={isSelectDisabled}
											isInvalid={invalidFields.day}  // Highlight khi ngày không hợp lệ
										/>
									</Box>
								</Grid>
								<Grid item xs={6}>
									<Box mb={1}>
										<label htmlFor={'month'}>Tháng (MM)</label>
										<CustomImportSelect
											value={fileHeaders.find(header => header == mappingValues.month) ?
												{
													value: mappingValues.month,
													label: mappingValues.month,
												} : null}
											onChange={(selectedOption) => handleMappingChange(selectedOption, 'month')}
											options={fileHeaders.map((header) => ({
												value: header,
												label: header,
											}))}
											placeholder={isMonthSelectDisabled ? 'Khóa' : 'Chọn cột'}
											isDisabled={isMonthSelectDisabled || isSelectDisabled}
											isInvalid={invalidFields.month} />
									</Box>
								</Grid>
							</>)}
							{editableColumns.map((column, index) =>
								(column?.field == 'day' || column?.field == 'month') ? <></> : (
									<Grid item xs={6} key={index}>
										<Box mb={1}>
											<label htmlFor={column.label}>{column.label}</label>
											<CustomImportSelect
												value={fileHeaders.find(header => header == mappingValues[column.field]) ? {
													value: mappingValues[column.field],
													label: mappingValues[column.field],
												} : null}
												onChange={(selectedOption) => handleMappingChange(selectedOption, column.field)}
												options={fileHeaders.map((header) => ({
													value: header, label: header,
												}))}
												placeholder="Chọn cột"
												isDisabled={isSelectDisabled}
												isInvalid={invalidFields[column.field]}
											/>
										</Box>
									</Grid>
								),
							)}
						</Grid>
					</div>

				</Tabs.TabPane>

				<Tabs.TabPane tab="Preview" key={TABS.PREVIEW}>
					<div style={{ marginBottom: 10, display: 'flex', gap: 8, justifyContent: 'end' }}>
						{/* <Button onClick={() => handlePreview(false)} type="default">Xem trước</Button>
						{invalidCells.length > 0 && (
							<Button onClick={() => handleShowErrorRows()} danger>Xem lỗi</Button>
						)} */}
						<Button type="primary" disabled={!statusButton}
								onClick={selectedMonths.length > 0 ? handleUploadClick : handleUpload}>
							Nhập Dữ Liệu
						</Button>
					</div>
					<div style={{ height: 500, width: '100%' , position: 'relative' }} className="ag-theme-quartz">
						<AgGridReact
							rowData={previewData}
							columnDefs={
								[{
									headerName: 'Số thứ tự',
									field: 'serial_number',
									width: 100,
									editable: false,
									cellStyle: { textAlign: 'center' },
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
													const isInvalidCell = invalidCells.some(cell =>
														cell.row == (params.data.serial_number - 1) &&
														cell.col == col.field,
													);
													return {
														backgroundColor: isInvalidCell ? 'rgb(255,75,75)' : 'transparent',
														color: isInvalidCell ? 'white' : 'inherit',
														textAlign: 'right',
													};
												},
											};
										}),
								]
							}
							defaultColDef={{
								editable: true,
								resizable: true,
								cellValueChanged: (params) => handleCellValueChange(params),
							}}
							pagination={true}
							paginationPageSize={500}
							paginationPageSizeSelector={[300, 500, 1000]}
						/>
					</div>
					<Modal open={isPreviewOpen} onCancel={() => setIsPreviewOpen(false)} footer={null} width={1000}
						   title="Preview dữ liệu">
						<div style={{ height: '600px', width: '100%' }}>
							<div style={{ height: '100%', width: '100%', position: 'relative' }} className="ag-theme-quartz">
								<AgGridReact
									rowData={previewData}
									columnDefs={
										[{
											headerName: 'Số thứ tự',
											field: 'serial_number',
											width: 100,
											editable: false,
											cellStyle: { textAlign: 'center' },
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
															const isInvalidCell = invalidCells.some(cell =>
																cell.row == (params.data.serial_number - 1) &&
																cell.col == col.field,
															);
															return {
																backgroundColor: isInvalidCell ? 'rgb(255,75,75)' : 'transparent',
																color: isInvalidCell ? 'white' : 'inherit',
																textAlign: 'right',
															};
														},
													};
												}),
										]
									}
									defaultColDef={{
										editable: true,
										resizable: true,
										cellValueChanged: (params) => handleCellValueChange(params),
									}}
									pagination={true}
									paginationPageSize={300}
									paginationPageSizeSelector={[300, 500, 1000]}
								/>
							</div>
						</div>
					</Modal>
				</Tabs.TabPane>

				{invalidCells.length > 0 && (
					<Tabs.TabPane tab="Lỗi" key={TABS.ERROR}>
						<div style={{ height: 500, width: '100%' , position: 'relative' }} className="ag-theme-quartz">
							<AgGridReact
								rowData={errorRows}
								columnDefs={
									[{
										headerName: 'Số thứ tự',
										field: 'serial_number',
										width: 100,
										editable: false,
										cellStyle: { textAlign: 'center' },
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
														const isInvalidCell = invalidCells.some(cell =>
															cell.row == (params.data.serial_number - 1) &&
															cell.col == col.field,
														);
														return {
															backgroundColor: isInvalidCell ? 'rgb(255,75,75)' : 'transparent',
															color: isInvalidCell ? 'white' : 'inherit',
															textAlign: 'right',
														};
													},
												};
											}),
										]
									}
									defaultColDef={{
										resizable: true,
									}}
								/>
							</div>
						</Tabs.TabPane>
					)}
			</Tabs>

			<Dialog open={confirmDialogOpen} onClose={handleCancelDelete}>
				<DialogTitle>Xóa dữ liệu cũ</DialogTitle>
				<DialogContent>
					{isAllSelected
						? `Toàn bộ dữ liệu năm ${yearCDSD} sẽ bị xóa sạch. Bạn có muốn tiếp tục không? (Không thể hoàn tác)`
						: `Dữ liệu của các tháng ${selectedMonths.map(m => m.label).join(', ')} - năm ${yearCDSD} sẽ bị xóa. Bạn có muốn tiếp tục không? (Không thể hoàn tác)`}
				</DialogContent>
				<DialogActions>
					<MuiButton onClick={handleCancelDelete}>Từ chối</MuiButton>
					<MuiButton onClick={handleConfirmDelete}>Đồng ý</MuiButton>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default FileImportComponent;