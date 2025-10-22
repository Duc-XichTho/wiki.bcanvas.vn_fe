import {
	DeleteOutlined,
	InfoCircleOutlined,
	LinkOutlined,
	PauseCircleOutlined,
	PlayCircleOutlined,
	PlusOutlined,
	ReloadOutlined,
	ToolOutlined,
} from '@ant-design/icons';
import {
	Button,
	Card,
	Checkbox,
	Col,
	Divider,
	Form,
	Input,
	message,
	Modal,
	Popconfirm,
	Popover,
	Row,
	Select,
	Space,
	Statistic,
	Switch,
	Table,
	Tag,
	Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { createNewPath, deletePath, getAllPath, updatePath, updateSchema } from '../../apis/adminPathService';
import { getSchemaTools, updateSchemaTools, getSettingByType, updateSetting } from '../../apis/settingService';
import { createTimestamp, formatDateToDDMMYYYY } from '../../generalFunction/format.js';
import { v4 as uuidv4 } from 'uuid';

// Hàm format ngày tháng và thời gian theo định dạng Việt Nam
const formatDateVietnam = (dateString) => {
	if (!dateString) return 'N/A';
	const date = new Date(dateString);
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const year = date.getFullYear();
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	return `${day}/${month}/${year} ${hours}:${minutes}`;
};
import { BackCanvas } from '../../icon/svg/IconSvg.jsx';
import { useNavigate } from 'react-router-dom';
import Loading3DTower from '../../components/Loading3DTower.jsx';
import { FULL_DASHBOARD_APPS } from '../../CONST.js';
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Search } = Input;

const AdminPath = () => {
	const navigate = useNavigate();

	const [paths, setPaths] = useState([]);
	const [filteredPaths, setFilteredPaths] = useState([]);
	const [loading, setLoading] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [toolsModalVisible, setToolsModalVisible] = useState(false);
	const [versionsModalVisible, setVersionsModalVisible] = useState(false);
	const [globalVersionsModalVisible, setGlobalVersionsModalVisible] = useState(false);
	const [editDetailsModalVisible, setEditDetailsModalVisible] = useState(false);
	const [editingPath, setEditingPath] = useState(null);
	const [editingToolsPath, setEditingToolsPath] = useState(null);
	const [editingVersionsPath, setEditingVersionsPath] = useState(null);
	const [editingDetailsPath, setEditingDetailsPath] = useState(null);
	const [searchText, setSearchText] = useState('');
	const [form] = Form.useForm();
	const [toolsForm] = Form.useForm();

	const [selectedToolIds, setSelectedToolIds] = useState([]);
	const [loadingTools, setLoadingTools] = useState(false);
	const [stats, setStats] = useState({
		total: 0,
		active: 0,
		inactive: 0,
		admin: 0,
		user: 0,
	});

	// State for email_import popover
	const [emailPopoverVisible, setEmailPopoverVisible] = useState({});
	const [emailForm] = Form.useForm();

	// State for user limit popover
	const [limitPopoverVisible, setLimitPopoverVisible] = useState({});
	const [limitForm] = Form.useForm();

	// Form for edit details modal
	const [editDetailsForm] = Form.useForm();

	// State for versions manager
	const [schemaVersions, setSchemaVersions] = useState([]);
	const [versionsSettingId, setVersionsSettingId] = useState(null);
	
	// State for global versions
	const [globalVersions, setGlobalVersions] = useState([]);
	const [globalVersionsSettingId, setGlobalVersionsSettingId] = useState(null);

	const [availableTools, setAvailableTools] = useState(FULL_DASHBOARD_APPS);
	
	// Trial apps state
	const [trialApps, setTrialApps] = useState([]);

	// Validation function cho path format
	const validatePathFormat = (_, value) => {
		if (!value) {
			return Promise.reject(new Error('Vui lòng nhập đường dẫn!'));
		}

		// Kiểm tra không có khoảng trắng

		// Kiểm tra không có ký tự đặc biệt không hợp lệ
		// Cho phép: chữ cái (có dấu), số, dấu gạch ngang, dấu gạch dưới, dấu chấm, dấu gạch chéo
		// Không cho phép: < > : " | ? * \ và các ký tự điều khiển khác
		// Sử dụng Unicode property escapes để hỗ trợ tốt hơn cho các ngôn ngữ có dấu
		const validPathRegex = /^[\p{L}\p{N}\-_./]+$/u;


		// Kiểm tra không bắt đầu bằng dấu chấm (để tránh file ẩn)
		if (value.startsWith('.')) {
			return Promise.reject(new Error('Đường dẫn không được bắt đầu bằng dấu chấm'));
		}

		// Kiểm tra trùng lặp với những đường dẫn đã có
		const normalizedValue = value.toLowerCase();
		const isDuplicate = paths.some(path => {
			// Bỏ qua path đang edit nếu đang cập nhật
			if (editingPath && path.id === editingPath.id) {
				return false;
			}
			return path.path.toLowerCase() === normalizedValue;
		});

		if (isDuplicate) {
			return Promise.reject(new Error('Đường dẫn này đã tồn tại!'));
		}

		return Promise.resolve();
	};

	// Lấy danh sách paths
	const fetchPaths = async () => {
		setLoading(true);
		try {
			const response = await getAllPath();
			if (response) {
				const data = response.data || [];
				setPaths(data);
				setFilteredPaths(data);
				message.success('Lấy danh sách paths thành công!');

				// Tính toán thống kê từ dữ liệu
				setStats({
					total: data.length,
					active: data.filter(p => p.show === true).length,
					inactive: data.filter(p => p.show === false).length,
					admin: data.filter(p => p.type === 'admin').length,
					user: data.filter(p => p.type === 'user').length,
				});
			} else {
				message.error('Có lỗi xảy ra khi tải danh sách paths!');
			}
		} catch (error) {
			console.error('Lỗi khi lấy danh sách paths:', error);
			message.error('Có lỗi xảy ra khi tải danh sách paths!');
		} finally {
			setLoading(false);
		}
	};

	// const fetchTools = async () => {
	// 	try {
	// 		const response = await getSettingByType('DASHBOARD_SETTING');
	// 		setAvailableTools(response.setting || []);
	// 	} catch (error) {
	// 		console.error('Lỗi khi lấy tools từ API:', error);
	// 		setAvailableTools([]);
	// 	}
	// }

	useEffect(() => {
		fetchPaths();
		// fetchTools();
	}, []);

	// Load trial apps
	useEffect(() => {
		const loadTrialApps = async () => {
			try {
				const response = await getSettingByType('DASHBOARD_TRIAL_APPS');
				if (response && Array.isArray(response.setting)) {
					setTrialApps(response.setting);
				} else if (response && response.setting) {
					setTrialApps([]);
				}
			} catch (error) {
				// Nếu chưa có setting, bỏ qua
				setTrialApps([]);
			}
		};
		loadTrialApps();
	}, []);

	// Helper functions for trial apps
	const isTrialExpired = (trialApp) => {
		if (!trialApp?.endDate) return false;
		return new Date() > new Date(trialApp.endDate);
	};

	const getTrialStatus = (toolId) => {
		const trial = trialApps.find(t => t.id === toolId);
		if (!trial) return null;
		
		if (trial.isActive === false) return null;
		
		return {
			isActive: !isTrialExpired(trial),
			isExpired: isTrialExpired(trial),
			endDate: trial.endDate,
			startDate: trial.startDate
		};
	};

	// Hàm tìm kiếm
	const handleSearch = (value) => {
		setSearchText(value);
		if (!value.trim()) {
			setFilteredPaths(paths);
			return;
		}

		const filtered = paths.filter(path =>
			path.path?.toLowerCase().includes(value.toLowerCase()) ||
			path.name?.toLowerCase().includes(value.toLowerCase()) ||
			path.description?.toLowerCase().includes(value.toLowerCase()),
		);
		setFilteredPaths(filtered);
	};

	const handleCopyPath = (path) => {
		navigator.clipboard.writeText(path);
		message.success('Đã sao chép đường dẫn!');
	};

	const handleViewPath = (path) => {
		window.open(path, '_blank');
	};

	const handleRefresh = () => {
		fetchPaths();
		setSearchText('');
	};

	const handleAdd = async () => {
		setEditingPath(null);
		form.resetFields();
		
		// Load global versions để chọn
		try {
			const response = await getSettingByType('GLOBAL_SCHEMA_VERSIONS');
			const versions = response?.setting || [];
			setGlobalVersions(versions.map((v, idx) => ({
				id: v.id ?? uuidv4(),
				name: v.name ?? `Version ${idx + 1}`,
				contextInstruction: v.contextInstruction ?? '',
				tokenSize: v.tokenSize ?? null,
				rubikDataRowsLimit: v.rubikDataRowsLimit ?? null,
				rubikDataColumnsLimit: v.rubikDataColumnsLimit ?? null,
				userNumberLimit: v.userNumberLimit ?? null,
				created_at: v.created_at ?? createTimestamp(),
			})));
		} catch (error) {
			console.error('Lỗi khi lấy global versions:', error);
			setGlobalVersions([]);
		}
		
		form.setFieldsValue({
			duration: 90, // Default 90 days
			status: true,
		});
		setModalVisible(true);
	};

	const handleUpdateSchema = async () => {
		try {
			await updateSchema();
			message.success('Cập nhật schema thành công!');
			fetchPaths();
		} catch (error) {
			message.error('Có lỗi xảy ra khi cập nhật schema!');
		}
	};

	// Toggle trạng thái hoạt động
	const handleToggleStatus = async (record) => {
		try {
			const updatedPath = {
				...record,
				show: !record.show,
				updated_at: createTimestamp(),
			};

			await updatePath(updatedPath);
			message.success(`${record.show ? 'Tắt' : 'Bật'} hoạt động thành công!`);
			fetchPaths();
		} catch (error) {
			console.error('Lỗi khi cập nhật trạng thái:', error);
			message.error('Có lỗi xảy ra khi cập nhật trạng thái!');
		}
	};

	const handleEdit = (record) => {
		setEditingPath(record);
		
		// Tính duration từ created_at và expired_at
		let duration = 90; // default
		if (record.created_at && record.expired_at) {
			const createdDate = new Date(record.created_at);
			const expiredDate = new Date(record.expired_at);
			const diffTime = expiredDate - createdDate;
			duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
		}
		
		form.setFieldsValue({
			...record,
			status: record.show, // Map show field to status for Switch component
			duration: duration,
		});
		setModalVisible(true);
	};

	// Hàm mở modal quản lý tools
	const handleManageTools = async (record) => {
		setEditingToolsPath(record);
		setLoadingTools(true);

		try {
			// Lấy tools hiện tại của schema
			const response = await getSchemaTools(record.path);
			console.log('Schema tools response:', response);

			// Lấy id của setting record và tools
			const settingId = response?.id; // ID của setting record
			const currentTools = response?.setting || [];

			console.log('Setting ID:', settingId);
			console.log('Current tools:', currentTools);

			// Cập nhật selectedTools với tools hiện tại
			setSelectedToolIds(currentTools.map(tool => tool.id));

			// Lưu setting ID để sử dụng khi update
			setEditingToolsPath(prev => ({
				...prev,
				settingId: settingId,
			}));
		} catch (error) {
			console.error('Lỗi khi lấy tools:', error);
			setSelectedToolIds([]);
		} finally {
			setLoadingTools(false);
			setToolsModalVisible(true);
		}
	};

	// Hàm cập nhật tools cho schema
	const handleUpdateTools = async () => {
		try {
			setLoadingTools(true);

			// Lọc ra các tools objects từ selectedToolIds
			const selectedTools = availableTools.filter(tool => selectedToolIds.includes(tool.id));

			console.log('Selected tool IDs:', selectedToolIds);
			console.log('Selected tools objects:', selectedTools);
			console.log('Setting ID:', editingToolsPath?.settingId);

			await updateSchemaTools(
				editingToolsPath.path,
				selectedTools, // Gửi tools objects thay vì IDs
				editingToolsPath?.settingId,
			);
			message.success('Cập nhật tools thành công!');
			setToolsModalVisible(false);
		} catch (error) {
			console.error('Lỗi khi cập nhật tools:', error);
			message.error('Có lỗi xảy ra khi cập nhật tools!');
		} finally {
			setLoadingTools(false);
		}
	};

	const handleDelete = async (id) => {
		try {
			await deletePath(id);
			message.success('Xóa path thành công!');
			fetchPaths();
		} catch (error) {
			message.error('Có lỗi xảy ra khi xóa path!');
		}
	};


	const handleAddVersion = () => {
		setSchemaVersions(prev => ([
			...prev,
			{
				id: (prev[prev.length - 1]?.id ?? 0) + 1,
				name: `Version ${prev.length + 1}`,
				contextInstruction: '',
				tokenSize: null,
				rubikDataSizeLimit: null,
				userNumberLimit: null,
				created_at: createTimestamp(),
			}
		]))
	};

	const handleRemoveVersion = (id) => {
		setSchemaVersions(prev => prev.filter(v => v.id !== id));
	};

	const handleChangeVersionField = (id, field, value) => {
		setSchemaVersions(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
	};

	const handleSaveVersions = async () => {
		try {
			const cleaned = schemaVersions.map(({ id, name, contextInstruction, tokenSize, rubikDataSizeLimit, userNumberLimit, created_at }) => ({
				id,
				name,
				contextInstruction,
				tokenSize: tokenSize !== null && tokenSize !== '' ? Number(tokenSize) : null,
				rubikDataSizeLimit: rubikDataSizeLimit !== null && rubikDataSizeLimit !== '' ? Number(rubikDataSizeLimit) : null,
				userNumberLimit: userNumberLimit !== null && userNumberLimit !== '' ? Number(userNumberLimit) : null,
				created_at,
			}));

			// Lưu vào bảng setting
			await updateSetting(
				`SCHEMA_VERSIONS_${editingVersionsPath.path}`,
				cleaned,
				versionsSettingId
			);
			
			message.success('Cập nhật versions thành công!');
			setVersionsModalVisible(false);
		} catch (e) {
			console.error(e);
			message.error('Lưu versions thất bại!');
		}
	};

	// Global versions management
	const handleManageGlobalVersions = async () => {
		setGlobalVersionsModalVisible(true);
		
		try {
			// Lấy global versions từ setting
			const response = await getSettingByType('GLOBAL_SCHEMA_VERSIONS');
			const versions = response?.setting || [];
			
			setGlobalVersions(versions.map((v, idx) => ({
				id: v.id ?? uuidv4(),
				name: v.name ?? `Version ${idx + 1}`,
				contextInstruction: v.contextInstruction ?? '',
				tokenSize: v.tokenSize ?? null,
				rubikDataRowsLimit: v.rubikDataRowsLimit ?? null,
				rubikDataColumnsLimit: v.rubikDataColumnsLimit ?? null,
				userNumberLimit: v.userNumberLimit ?? null,
				created_at: v.created_at ?? createTimestamp(),
			})));
			
			// Lưu setting ID để update sau
			setGlobalVersionsSettingId(response?.id);
		} catch (error) {
			console.error('Lỗi khi lấy global versions:', error);
			setGlobalVersions([]);
			setGlobalVersionsSettingId(null);
		}
	};

	const handleAddGlobalVersion = () => {
		setGlobalVersions(prev => ([
			...prev,
			{
				id: uuidv4(),
				name: `Version ${prev.length + 1}`,
				contextInstruction: '',
				tokenSize: null,
				rubikDataRowsLimit: null,
				rubikDataColumnsLimit: null,
				userNumberLimit: null,
				created_at: createTimestamp(),
			}
		]))
	};

	const handleRemoveGlobalVersion = (id) => {
		setGlobalVersions(prev => prev.filter(v => v.id !== id));
	};

	const handleChangeGlobalVersionField = (id, field, value) => {
		setGlobalVersions(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
	};

	const handleSaveGlobalVersions = async () => {
		try {
			const cleaned = globalVersions.map(({ id, name, contextInstruction, tokenSize, rubikDataRowsLimit, rubikDataColumnsLimit, userNumberLimit, created_at }) => ({
				id,
				name,
				contextInstruction,
				tokenSize: tokenSize !== null && tokenSize !== '' ? Number(tokenSize) : null,
				rubikDataRowsLimit: rubikDataRowsLimit !== null && rubikDataRowsLimit !== '' ? Number(rubikDataRowsLimit) : null,
				rubikDataColumnsLimit: rubikDataColumnsLimit !== null && rubikDataColumnsLimit !== '' ? Number(rubikDataColumnsLimit) : null,
				userNumberLimit: userNumberLimit !== null && userNumberLimit !== '' ? Number(userNumberLimit) : null,
				created_at,
			}));

			// Lưu vào bảng setting
			await updateSetting(
				{id: globalVersionsSettingId, type: 'GLOBAL_SCHEMA_VERSIONS', setting: cleaned}
			);
			
			message.success('Cập nhật global versions thành công!');
			setGlobalVersionsModalVisible(false);
		} catch (e) {
			console.error(e);
			message.error('Lưu global versions thất bại!');
		}
	};

	// Handle user limit update
	const handleUpdateUserLimit = async (record, limitValue) => {
		try {
			const updatedPath = {
				...record,
				limit_user: Number(limitValue), // Ensure it's a number
				updated_at: createTimestamp(),
			};

			await updatePath(updatedPath);
			message.success('Cập nhật giới hạn người dùng thành công!');
			fetchPaths();
			setLimitPopoverVisible(prev => ({ ...prev, [record.id]: false }));
		} catch (error) {
			console.error('Lỗi khi cập nhật giới hạn người dùng:', error);
			message.error('Có lỗi xảy ra khi cập nhật giới hạn người dùng!');
		}
	};

	// Handle email_import update
	const handleUpdateEmailImport = async (record, email) => {
		try {
			const updatedPath = {
				...record,
				email_import: email?.trim() || null,
				updated_at: createTimestamp(),
			};

			await updatePath(updatedPath);
			message.success('Cập nhật email nhận/xuất dữ liệu thành công!');
			fetchPaths();
			setEmailPopoverVisible(prev => ({ ...prev, [record.id]: false }));
		} catch (error) {
			console.error('Lỗi khi cập nhật email_import:', error);
			message.error('Có lỗi xảy ra khi cập nhật email!');
		}
	};

	// Handle edit details modal
	const handleEditDetails = (record) => {
		setEditingDetailsPath(record);
		
		// Tính duration từ created_at và expired_at
		let duration = 90; // default
		if (record.created_at && record.expired_at) {
			const createdDate = new Date(record.created_at);
			const expiredDate = new Date(record.expired_at);
			const diffTime = expiredDate - createdDate;
			duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
		}
		
		editDetailsForm.setFieldsValue({
			limit_user: record.limit_user || '',
			email_import: record.email_import || '',
			duration: duration,
			description: record.description || '',
		});
		setEditDetailsModalVisible(true);
	};

	// Handle update details
	const handleUpdateDetails = async () => {
		try {
			const values = await editDetailsForm.validateFields();
			
			// Tính expired_at dựa trên created_at + duration
			const createdDate = new Date(editingDetailsPath.created_at);
			const expiredDate = new Date(createdDate);
			expiredDate.setDate(expiredDate.getDate() + Number(values.duration));

			const updatedPath = {
				...editingDetailsPath,
				limit_user: Number(values.limit_user) || null,
				email_import: values.email_import?.trim() || null,
				description: values.description?.trim() || null,
				expired_at: expiredDate.toISOString(),
				updated_at: createTimestamp(),
			};

			await updatePath(updatedPath);
			message.success('Cập nhật thông tin thành công!');
			setEditDetailsModalVisible(false);
			fetchPaths();
		} catch (error) {
			console.error('Lỗi khi cập nhật thông tin:', error);
			message.error('Có lỗi xảy ra khi cập nhật thông tin!');
		}
	};

	const handleModalOk = async () => {
		try {
			setModalVisible(false);
			setLoading(true);
			const values = await form.validateFields();

			// Tính expired_at dựa trên created_at + duration
			const createdDate = new Date();
			const expiredDate = new Date(createdDate);
			expiredDate.setDate(expiredDate.getDate() + Number(values.duration));

			// Tìm version được chọn
			const selectedVersion = globalVersions.find(v => v.id === values.selectedVersionId);
			
			if (editingPath) {
				// Cập nhật path - tính từ created_at gốc
				const originalCreatedDate = new Date(editingPath.created_at);
				const newExpiredDate = new Date(originalCreatedDate);
				newExpiredDate.setDate(newExpiredDate.getDate() + Number(values.duration));
				
				await updatePath({
					...values,
					path: values.path.trim(),
					id: editingPath.id,
					show: values.status, // Map status back to show field
					expired_at: newExpiredDate.toISOString(),
					updated_at: createTimestamp(),
					...(selectedVersion && {
						limit_user: selectedVersion.userNumberLimit,
						version_id: selectedVersion.id,
						version_data: {
							contextInstruction: selectedVersion.contextInstruction,
							tokenSize: selectedVersion.tokenSize,
							rubikDataRowsLimit: selectedVersion.rubikDataRowsLimit,
							rubikDataColumnsLimit: selectedVersion.rubikDataColumnsLimit,
							userNumberLimit: selectedVersion.userNumberLimit,
						}
					})
				});
				message.success('Cập nhật path thành công!');
			} else {
				// Tạo path mới
				await createNewPath({
					...values,
					path: values.path.trim(),
					show: values.status, // Map status to show field
					created_at: createdDate.toISOString(),
					expired_at: expiredDate.toISOString(),
					...(selectedVersion && {
						version_id: selectedVersion.id,
						version_data: {
							contextInstruction: selectedVersion.contextInstruction,
							tokenSize: selectedVersion.tokenSize,
							rubikDataRowsLimit: selectedVersion.rubikDataRowsLimit,
							rubikDataColumnsLimit: selectedVersion.rubikDataColumnsLimit,
							userNumberLimit: selectedVersion.userNumberLimit,
						}
					})
				});
				message.success('Tạo path thành công!');
			}

			fetchPaths();
		} catch (error) {
			console.error('Lỗi khi lưu path:', error);
			message.error('Có lỗi xảy ra khi lưu path!');
		} finally {
			setLoading(false);
		}
	};

	const columns = [
		{
			title: 'Schema',
			dataIndex: 'path',
			width: 220,
			key: 'path',
			render: (path) => (
				<Space>
					<LinkOutlined style={{ color: '#1890ff' }} />
					<Text code style={{ fontSize: '12px' }}>{path}</Text>
				</Space>
			),
		},
		{
			title: 'Trạng thái',
			dataIndex: 'show',
			key: 'show',
			width: 220,
			render: (show, record) => (
				<Space>
					<Tag color={show ? 'green' : 'red'}>
						{show ? 'Hoạt động' : 'Không hoạt động'}
					</Tag>
					<Button
						type="text"
						size="small"
						icon={show ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
						onClick={() => handleToggleStatus(record)}
						style={{ padding: '0 4px' }}
					/>
				</Space>
			),
		},
		{
			title: 'Ngày tạo',
			dataIndex: 'created_at',
			key: 'created_at',
			render: (date) => <Text type="secondary">{formatDateVietnam(date)}</Text>,
			width: 150,
		},
		{
			title: 'Ngày hết hạn',
			dataIndex: 'expired_at',
			key: 'expired_at',
			render: (date) => {
				if (!date) return <Text type="secondary">N/A</Text>;
				const expiredDate = new Date(date);
				const now = new Date();
				const isExpired = expiredDate < now;
				return (
					<Text type={isExpired ? 'danger' : 'secondary'}>
						{formatDateVietnam(date)}
						{isExpired && <Tag color="red" size="small" style={{ marginLeft: 4 }}>Hết hạn</Tag>}
					</Text>
				);
			},
			width: 150,
		},
		{
			title: 'Thời hạn còn lại',
			key: 'duration_remaining',
			width: 150,
			render: (_, record) => {
				if (!record.created_at || !record.expired_at) return <Text type="secondary">N/A</Text>;
				
				const createdDate = new Date(record.created_at);
				const expiredDate = new Date(record.expired_at);
				const now = new Date();
				
				// Tính tổng duration (ngày)
				const totalDuration = Math.ceil((expiredDate - createdDate) / (1000 * 60 * 60 * 24));
				
				// Tính số ngày còn lại
				const remainingDays = Math.ceil((expiredDate - now) / (1000 * 60 * 60 * 24));
				
				
				if (remainingDays < 0) {
					return (
						<div>
							<Text type="danger">Hết hạn</Text>
							<div style={{ fontSize: '12px', color: '#999' }}>
								{totalDuration} ngày
							</div>
						</div>
					);
				}
				
				return (
					<div>
						<Text type={remainingDays <= 7 ? 'warning' : 'secondary'}>
							{remainingDays} ngày
						</Text>
				
					</div>
				);
			},
		},
		{
			title: 'Giới hạn người dùng',
			dataIndex: 'limit_user',
			key: 'limit_user',
			width: 120,
			render: (limit_user) => (
				<Text type="secondary">{limit_user || 'N/A'}</Text>
			),
		},
		{
			title: 'Email nhận/xuất dữ liệu',
			dataIndex: 'email_import',
			key: 'email_import',
			width: 200,
			render: (email_import) => (
				<Text type="secondary" style={{ 
					display: 'block', 
					overflow: 'hidden', 
					textOverflow: 'ellipsis', 
					whiteSpace: 'nowrap',
					maxWidth: '180px'
				}}>
					{email_import || 'N/A'}
				</Text>
			),
		},
		{
			title: 'Thao tác',
			key: 'action',
			render: (_, record) => (
				<Space size="small">
					<Button
						type="primary"
						icon={<ToolOutlined />}
						size="small"
						onClick={() => handleManageTools(record)}
						title="Quản lý Tools cho Schema này"
					>
						Tools
					</Button>
					{/* Version button removed per requirement */}
					<Button
						type="default"
						icon={<InfoCircleOutlined />}
						size="small"
						onClick={() => handleEditDetails(record)}
						title="Sửa chi tiết (giới hạn, email, thời hạn)"
					>
						Sửa chi tiết
					</Button>
					<Popconfirm
						title="Xác nhận xóa"
						description="Bạn có chắc chắn muốn xóa đường dẫn này không? Hành động này không thể hoàn tác."
						onConfirm={() => handleDelete(record.id)}
						okText="Xóa"
						cancelText="Hủy"
						okType="danger"
					>
						<Button
							type="primary"
							danger
							icon={<DeleteOutlined />}
							size="small"
						>
							Xóa
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f5f5f5', position: 'relative' }}>

			{/* Loading toàn màn hình - nằm đè lên tất cả */}
			{loading && (
				<div style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					width: '100vw',
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(255, 255, 255, 0.8)',
					zIndex: 9999,
				}}>
					<Loading3DTower />
				</div>
			)}

			<div style={{ maxWidth: '1600px', margin: '0 auto' }}>
				<Card style={{ marginBottom: '24px' }}>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '24px',
					}}>
						<div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
							<div
								onClick={() =>
									navigate('/dashboard')
								}
								style={{
									width: 40,
									height: 38,
									backgroundColor: 'rgba(250, 250, 250, 1)',
									borderRadius: 12,
									boxShadow: '1px 1px 2px 1px rgba(0, 0, 0, 0.25)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
								}}
							>
								<BackCanvas height={20} width={20} color={'#454545'} />

							</div>
							<div>
								<Title level={2} style={{ marginBottom: '8px', color: '#1890ff' }}>
									Admin Schema
								</Title>
								<Text type="secondary">
									Quản lý và theo dõi tất cả các đường dẫn trong hệ thống
								</Text>

							</div>
						</div>
						<Space>
							<Input
								placeholder="Tìm kiếm theo schema"
								value={searchText}
								onChange={(e) => handleSearch(e.target.value)}
								style={{ width: '250px' }}
							/>
							<Button
								type="primary"
								onClick={handleUpdateSchema}
							>
								Update Schema
							</Button>
							<Button
								type="default"
								icon={<ReloadOutlined />}
								onClick={handleManageGlobalVersions}
							>
								Quản lý Version
							</Button>
							<Button
								type="primary"
								icon={<PlusOutlined />}
								onClick={handleAdd}
							>
								Thêm mới
							</Button>
							<Button
								type="primary"
								icon={<ReloadOutlined />}
								onClick={handleRefresh}
								loading={loading}
							>
								Làm mới
							</Button>
						</Space>
					</div>

					{/* Thống kê */}
					<Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
						<Col xs={24} sm={12} md={6}>
							<Card size="small">
								<Statistic
									title="Tổng số schema"
									value={stats.total}
									valueStyle={{ color: '#1890ff' }}
								/>
							</Card>
						</Col>
						<Col xs={24} sm={12} md={6}>
							<Card size="small">
								<Statistic
									title="Đang hoạt động"
									value={stats.active}
									valueStyle={{ color: '#52c41a' }}
								/>
							</Card>
						</Col>
						<Col xs={24} sm={12} md={6}>
							<Card size="small">
								<Statistic
									title="Không hoạt động"
									value={stats.inactive}
									valueStyle={{ color: '#faad14' }}
								/>
							</Card>
						</Col>
					</Row>
				</Card>

				<Card>
					<Table
						columns={columns}
						dataSource={filteredPaths}
						rowKey="id"
						loading={loading}
						pagination={{
							total: filteredPaths.length,
							pageSize: 10,
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đường dẫn`,
						}}
						scroll={{ x: 1200, y: '50vh' }}
					/>
				</Card>

				{/* Modal tạo/sửa path */}
				<Modal
					title={editingPath ? 'Sửa Schema' : 'Thêm Schema mới'}
					visible={modalVisible}
					onOk={handleModalOk}
					onCancel={() => setModalVisible(false)}
					width={600}
					okText={editingPath ? 'Cập nhật' : 'Tạo mới'}
					cancelText="Hủy"
				>
					<Form
						form={form}
						layout="vertical"
					>
						<Form.Item
							name="path"
							label="Đường dẫn"
							rules={[
								{ required: true, message: 'Vui lòng nhập đường dẫn!' },
								{ validator: validatePathFormat },
							]}
						>
							<Input
								placeholder=""
								onChange={(e) => {
									// Auto-format path input
									let value = e.target.value;
									// Remove leading spaces


									form.setFieldsValue({ path: value });
								}}
							/>
						</Form.Item>


						<Form.Item
							name="duration"
							label="Thời hạn (ngày)"
							rules={[
								{ required: true, message: 'Vui lòng nhập thời hạn!' },
								{
									validator: (_, value) => {
										const numValue = Number(value);
										if (isNaN(numValue) || numValue <= 0) {
											return Promise.reject(new Error('Thời hạn phải là số lớn hơn 0!'));
										}
										return Promise.resolve();
									}
								}
							]}
						>
							<Input
								type="number"
								placeholder="Nhập số ngày (ví dụ: 90)"
								min={1}
							/>
						</Form.Item>

						<Form.Item
							name="selectedVersionId"
							label="Chọn Version Template"
							help="Chọn version template để áp dụng cho schema này"
						>
							<Select
								placeholder="Chọn version template..."
								allowClear							
							>
								{globalVersions.map((version) => (
									<Option key={version.id} value={version.id}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
											<span style={{ 
												background: '#1890ff', 
												color: 'white', 
												padding: '2px 6px', 
												borderRadius: '3px',
												fontSize: '10px',
												fontWeight: '600'
											}}>
												#{globalVersions.indexOf(version) + 1}
											</span>
											<span>{version.name}</span>
											{version.tokenSize && (
												<Tag size="small" color="blue">{version.tokenSize} tokens</Tag>
											)}
										</div>
									</Option>
								))}
							</Select>
						</Form.Item>

						<Form.Item
							name="status"
							label="Trạng thái"
							valuePropName="checked"
							initialValue={true}
						>
							<Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
						</Form.Item>
					</Form>
				</Modal>

				{/* Modal quản lý Version Schema */}
				<Modal
					title={
						<Space>
							<span>Quản lý Version cho: </span>
							<Tag color="blue">{editingVersionsPath?.path}</Tag>
						</Space>
					}
					visible={versionsModalVisible}
					onOk={handleSaveVersions}
					onCancel={() => setVersionsModalVisible(false)}
					width={800}
					okText="Lưu Versions"
					cancelText="Hủy"
					bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
				>
					<Space direction="vertical" style={{ width: '100%' }} size={16}>
						{schemaVersions.map((v) => (
							<Card key={v.id} size="small" title={v.name} extra={<Button danger size="small" onClick={() => handleRemoveVersion(v.id)}>Xóa</Button>}>
								<Row gutter={12}>
									<Col span={24}>
										<Form layout="vertical">
											<Form.Item label="Context Instruction">
												<TextArea rows={3} value={v.contextInstruction} onChange={(e) => handleChangeVersionField(v.id, 'contextInstruction', e.target.value)} />
											</Form.Item>
											<Row gutter={12}>
												<Col span={8}>
													<Form.Item label="Token size">
														<Input type="number" placeholder="vd: 8192" value={v.tokenSize ?? ''} onChange={(e) => handleChangeVersionField(v.id, 'tokenSize', e.target.value)} />
													</Form.Item>
												</Col>
												<Col span={8}>
													<Form.Item label="RubikData Size limit">
														<Input type="number" placeholder="MB" value={v.rubikDataSizeLimit ?? ''} onChange={(e) => handleChangeVersionField(v.id, 'rubikDataSizeLimit', e.target.value)} />
													</Form.Item>
												</Col>
												<Col span={8}>
													<Form.Item label="User number limit">
														<Input type="number" placeholder="vd: 50" value={v.userNumberLimit ?? ''} onChange={(e) => handleChangeVersionField(v.id, 'userNumberLimit', e.target.value)} />
													</Form.Item>
												</Col>
											</Row>
										</Form>
									</Col>
								</Row>
							</Card>
						))}
						<Button onClick={handleAddVersion} icon={<PlusOutlined />}>Thêm Version</Button>
					</Space>
				</Modal>

				{/* Modal quản lý tools */}
				<Modal
					title={
						<Space>
							<ToolOutlined style={{ color: '#1890ff' }} />
							<span>Quản lý Tools cho Schema: {editingToolsPath?.path}</span>
						</Space>
					}
					visible={toolsModalVisible}
					onOk={handleUpdateTools}
					onCancel={() => setToolsModalVisible(false)}
					width={1200}
					okText="Lưu Tools"
					cancelText="Hủy"
					confirmLoading={loadingTools}
					style={{ top: 20 }}
					bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
				>

					{/* Thống kê tools */}
					<div style={{
						marginBottom: '16px',
						padding: '12px',
						backgroundColor: '#f6f6f6',
						borderRadius: '6px',
						position: 'relative',
					}}>
						<Space>
							<Text strong>Tools đã chọn: </Text>
							<Tag color="blue">{selectedToolIds.length}</Tag>
							<Text type="secondary">/ {availableTools.length} tools có sẵn</Text>
							<Divider type="vertical" />
							<Button
								size="small"
								type="link"
								onClick={() => setSelectedToolIds(availableTools.map(tool => tool.id))}
							>
								Chọn tất cả
							</Button>
							<Button
								size="small"
								type="link"
								onClick={() => setSelectedToolIds([])}
							>
								Bỏ chọn tất cả
							</Button>
						</Space>
					</div>

					{/* Checkbox list thay thế Transfer */}
					<div style={{
						border: '1px solid #d9d9d9',
						borderRadius: '8px',
						padding: '16px',
						backgroundColor: '#fafafa',
						maxHeight: '500px',
						overflow: 'auto',
					}}>
						<Checkbox.Group
							value={selectedToolIds}
							onChange={(checkedValues) => {
								console.log('Checkbox onChange:', checkedValues);
								setSelectedToolIds(checkedValues);
							}}
							style={{ width: '100%' }}
						>
							<Row gutter={[16, 12]}>
								{availableTools.map((tool) => (
									<Col xs={24} sm={12} md={8} lg={6} key={tool.id}>
										<div style={{
											padding: '12px',
											border: '1px solid #e8e8e8',
											borderRadius: '6px',
											backgroundColor: '#fff',
											height: '100%',
											transition: 'all 0.3s',
											cursor: 'pointer',
											':hover': {
												borderColor: '#1890ff',
												boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)',
											},
										}}>
											<Checkbox
												value={tool.id}
												style={{
													width: '100%',
													marginBottom: '8px',
												}}
											>
												<div style={{
													fontWeight: 'bold',
													fontSize: '14px',
													marginBottom: '4px',
												}}>
													{tool.name}
												</div>
											</Checkbox>
											<div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
												{tool.description}
											</div>
											<div style={{ fontSize: '11px', color: '#999' }}>
												ID: {tool.id}
											</div>
											
											{/* Trial Status */}
											{(() => {
												const trialStatus = getTrialStatus(tool.id);
												if (!trialStatus) return null;
												
												return (
													<div style={{ marginTop: '8px' }}>
														{trialStatus.isActive ? (
															<Tag color="blue" size="small" style={{ marginBottom: '4px' }}>
																TRIAL
															</Tag>
														) : (
															<Tag color="red" size="small" style={{ marginBottom: '4px' }}>
																HẾT HẠN TRIAL
															</Tag>
														)}
														<div style={{ 
															fontSize: '10px', 
															color: trialStatus.isActive ? '#1890ff' : '#ff4d4f',
															fontWeight: '500'
														}}>
															{trialStatus.isActive 
																? `Còn lại: ${Math.ceil((new Date(trialStatus.endDate) - new Date()) / (1000 * 60 * 60 * 24))} ngày`
																: `Hết hạn: ${new Date(trialStatus.endDate).toLocaleDateString('vi-VN')}`
															}
														</div>
													</div>
												);
											})()}
											
											{tool.tag && (
												<Tag
													color={tool.tag === 'Working' ? 'green' : 'orange'}
													size="small"
													style={{ marginTop: '4px' }}
												>
													{tool.tag}
												</Tag>
											)}
										</div>
									</Col>
								))}
							</Row>
						</Checkbox.Group>
					</div>

					{/* Thông tin bổ sung */}
					<div style={{
						marginTop: '16px',
						padding: '12px',
						backgroundColor: '#fff7e6',
						borderRadius: '6px',
						border: '1px solid #ffd591',
					}}>
						<Space>
							<InfoCircleOutlined style={{ color: '#faad14' }} />
							<Text type="secondary">
								<strong>Tip:</strong> Bạn có thể tìm kiếm tools theo tên, mô tả hoặc ID.
								Tools được chọn sẽ được lưu vào database và hiển thị trong dashboard của schema này.
							</Text>
						</Space>
					</div>
				</Modal>

				{/* Modal sửa chi tiết */}
				<Modal
					title={`Sửa chi tiết - ${editingDetailsPath?.path}`}
					visible={editDetailsModalVisible}
					onOk={handleUpdateDetails}
					onCancel={() => setEditDetailsModalVisible(false)}
					width={500}
					okText="Cập nhật"
					cancelText="Hủy"
				>
					<Form
						form={editDetailsForm}
						layout="vertical"
					>
						<Form.Item
							name="limit_user"
							label="Giới hạn người dùng"
							rules={[
								{
									validator: (_, value) => {
										if (!value) return Promise.resolve();
										const numValue = Number(value);
										if (isNaN(numValue) || numValue <= 0) {
											return Promise.reject(new Error('Giới hạn phải là số lớn hơn 0!'));
										}
										return Promise.resolve();
									}
								}
							]}
						>
							<Input
								type="number"
								placeholder="Nhập số lượng người dùng (để trống nếu không giới hạn)"
								min={1}
							/>
						</Form.Item>

						<Form.Item
							name="email_import"
							label="Email nhận/xuất dữ liệu"
							rules={[
								{
									validator: (_, value) => {
										if (!value) return Promise.resolve();
										const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
										if (!emailRegex.test(value)) {
											return Promise.reject(new Error('Email không hợp lệ!'));
										}
										return Promise.resolve();
									}
								}
							]}
						>
							<Input placeholder="Nhập email (để trống nếu không cần)" />
						</Form.Item>

						<Form.Item
							name="duration"
							label="Thời hạn (ngày)"
							rules={[
								{ required: true, message: 'Vui lòng nhập thời hạn!' },
								{
									validator: (_, value) => {
										const numValue = Number(value);
										if (isNaN(numValue) || numValue <= 0) {
											return Promise.reject(new Error('Thời hạn phải là số lớn hơn 0!'));
										}
										return Promise.resolve();
									}
								}
							]}
						>
							<Input
								type="number"
								placeholder="Nhập số ngày (ví dụ: 90)"
								min={1}
							/>
						</Form.Item>

						<Form.Item
							name="description"
							label="Mô tả"
						>
							<TextArea
								placeholder="Nhập mô tả cho schema này..."
								rows={3}
							/>
						</Form.Item>
					</Form>
				</Modal>

				{/* Modal quản lý Global Versions */}
				<Modal
					title={
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<span style={{ fontSize: '18px', fontWeight: '600' }}>🎯 Quản lý Version Schema</span>
							<Tag color="blue" style={{ fontSize: '12px' }}>Chung cho tất cả Schema</Tag>
						</div>
					}
					visible={globalVersionsModalVisible}
					onOk={handleSaveGlobalVersions}
					onCancel={() => setGlobalVersionsModalVisible(false)}
					width={1000}
					okText="💾 Lưu Versions"
					cancelText="❌ Hủy"
					bodyStyle={{ 
						maxHeight: '75vh', 
						overflow: 'auto',
						background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
						padding: '20px'
					}}
					style={{ top: 20 }}
				>
					<div style={{ marginBottom: '20px', textAlign: 'center' }}>
						<Text type="secondary" style={{ fontSize: '14px' }}>
							📋 Tạo và quản lý các version template để áp dụng cho Schema
						</Text>
					</div>

					<Space direction="vertical" style={{ width: '100%' }} size={20}>
						{globalVersions.map((v, index) => (
							<Card 
								key={v.id} 
								style={{ 
									borderRadius: '12px',
									boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
									background: 'white',
									border: '1px solid #e8e8e8'
								}}
								title={
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
											<span style={{ 
												background: '#1890ff', 
												color: 'white', 
												padding: '4px 8px', 
												borderRadius: '4px',
												fontSize: '12px',
												fontWeight: '600'
											}}>
												#{index + 1}
											</span>
											<Input 
												value={v.name} 
												onChange={(e) => handleChangeGlobalVersionField(v.id, 'name', e.target.value)}
												style={{ 
													border: 'none', 
													boxShadow: 'none',
													fontSize: '16px',
													fontWeight: '600',
													background: 'transparent'
												}}
												placeholder="Tên version..."
											/>
										</div>
										<Button 
											danger 
											size="small" 
											onClick={() => handleRemoveGlobalVersion(v.id)}
											style={{ borderRadius: '6px' }}
										>
											🗑️ Xóa
										</Button>
									</div>
								}
							>
								<Space direction="vertical" style={{ width: '100%' }} size={16}>
									{/* Context Instruction */}
									<div style={{ 
										background: '#f8f9fa', 
										padding: '16px', 
										borderRadius: '8px',
										border: '1px solid #e9ecef'
									}}>
										<Text strong style={{ color: '#495057', marginBottom: '8px', display: 'block' }}>
											📝 Context Instruction
										</Text>
										<TextArea 
											rows={3} 
											value={v.contextInstruction} 
											onChange={(e) => handleChangeGlobalVersionField(v.id, 'contextInstruction', e.target.value)}
											placeholder="Nhập hướng dẫn sử dụng cho version này..."
											style={{ 
												borderRadius: '6px',
												border: '1px solid #ced4da'
											}}
										/>
									</div>

									{/* Parameters Grid */}
									<div style={{ 
										background: '#ffffff', 
										padding: '16px', 
										borderRadius: '8px',
										border: '1px solid #dee2e6'
									}}>
										<Text strong style={{ color: '#495057', marginBottom: '12px', display: 'block' }}>
											⚙️ Thông số kỹ thuật
										</Text>
										<Row gutter={[16, 16]}>
											<Col span={12}>
												<div style={{ 
													background: '#e3f2fd', 
													padding: '12px', 
													borderRadius: '6px',
													border: '1px solid #bbdefb'
												}}>
													<Text strong style={{ color: '#1976d2', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
														🔢 Token Size
													</Text>
													<Input 
														type="number" 
														placeholder="Ví dụ: 8192" 
														value={v.tokenSize ?? ''} 
														onChange={(e) => handleChangeGlobalVersionField(v.id, 'tokenSize', e.target.value)}
														style={{ borderRadius: '4px' }}
													/>
												</div>
											</Col>
											<Col span={12}>
												<div style={{ 
													background: '#f3e5f5', 
													padding: '12px', 
													borderRadius: '6px',
													border: '1px solid #ce93d8'
												}}>
													<Text strong style={{ color: '#7b1fa2', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
														👥 User Limit
													</Text>
													<Input 
														type="number" 
														placeholder="Ví dụ: 50" 
														value={v.userNumberLimit ?? ''} 
														onChange={(e) => handleChangeGlobalVersionField(v.id, 'userNumberLimit', e.target.value)}
														style={{ borderRadius: '4px' }}
													/>
												</div>
											</Col>
											<Col span={12}>
												<div style={{ 
													background: '#e8f5e8', 
													padding: '12px', 
													borderRadius: '6px',
													border: '1px solid #a5d6a7'
												}}>
													<Text strong style={{ color: '#2e7d32', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
														📊 RubikData Rows
													</Text>
													<Input 
														type="number" 
														placeholder="Ví dụ: 5000" 
														value={v.rubikDataRowsLimit ?? ''} 
														onChange={(e) => handleChangeGlobalVersionField(v.id, 'rubikDataRowsLimit', e.target.value)}
														style={{ borderRadius: '4px' }}
													/>
												</div>
											</Col>
											<Col span={12}>
												<div style={{ 
													background: '#fff3e0', 
													padding: '12px', 
													borderRadius: '6px',
													border: '1px solid #ffcc02'
												}}>
													<Text strong style={{ color: '#f57c00', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
														📋 RubikData Columns
													</Text>
													<Input 
														type="number" 
														placeholder="Ví dụ: 20" 
														value={v.rubikDataColumnsLimit ?? ''} 
														onChange={(e) => handleChangeGlobalVersionField(v.id, 'rubikDataColumnsLimit', e.target.value)}
														style={{ borderRadius: '4px' }}
													/>
												</div>
											</Col>
										</Row>
									</div>
								</Space>
							</Card>
						))}
						
						{/* Add Version Button */}
						<div style={{ textAlign: 'center', marginTop: '20px' }}>
							<Button 
								onClick={handleAddGlobalVersion} 
								icon={<PlusOutlined />}
								size="large"
								style={{
									background: 'linear-gradient(45deg, #1890ff, #40a9ff)',
									border: 'none',
									borderRadius: '8px',
									color: 'white',
									fontWeight: '600',
									padding: '12px 24px',
									height: 'auto',
									boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
								}}
							>
								✨ Thêm Version Mới
							</Button>
						</div>
					</Space>
				</Modal>
			</div>
		</div>
	);
};

export default AdminPath; 