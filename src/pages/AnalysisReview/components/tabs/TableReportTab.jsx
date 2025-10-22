import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Button, Checkbox, Modal, message, Collapse, Card, List, Typography, Divider, Tooltip } from 'antd';
import {
	Database,
	FileText,
	Settings,
	ChevronRight,
	ChevronDown,
	BarChart3,
	Table as TableIcon,
	Eye,
	EyeOff,
	Shield,
} from 'lucide-react';
import { MyContext } from '../../../../MyContext.jsx';
import { getSettingByType, createSetting, updateSetting } from '../../../../apis/settingService.jsx';
import { getAllUserClass, getUserClassByEmail } from '../../../../apis/userClassService.jsx';
import TableAnalysisTab from './TableAnalysisTab';
import AuthorizationModal from '../modals/AuthorizationModal';
import YearSelectKTQT from '../../../Home/SelectComponent/YearSelectKTQT.jsx';
import BaoCaoGroupMonth from '../../../KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoGroupMonth';
import BaoCaoGroupUnit from '../../../KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoGroupUnit';
import BaoCaoNhomKenh from '../../../KeToanQuanTri/BaoCao/KQKD/Kenh/BaoCaoNhomKenh';
import BaoCaoPBNhomKenh2 from '../../../KeToanQuanTri/BaoCao/KQKD/Kenh/BaoCaoPBNhomKenh2';
import BaoCaoPBNhomSP from '../../../KeToanQuanTri/BaoCao/KQKD/SP/BaoCaoPBNhomSP';
import BaoCaoPBNhomSP2 from '../../../KeToanQuanTri/BaoCao/KQKD/SP/BaoCaoPBNhomSP2';
import BaoCaoPBNhomVV2 from '../../../KeToanQuanTri/BaoCao/KQKD/VV/BaoCaoPBNhomVV2';
import BCNhomVV from '../../../KeToanQuanTri/BaoCao/KQKD/VV/BCNhomVV';
import BaoCaoTongQuat from '../../../KeToanQuanTri/BaoCao/BaoCaoTongQuat';
import styles from './TableReportTab.module.css';
import { getAllDashBoardItems } from '../../../../apis/dashBoardItemService.jsx';

const { Panel } = Collapse;
const { Title, Text } = Typography;

// Danh sách các báo cáo KTQT
const KTQT_REPORTS = [
	{ id: 'baocao-group-month', name: 'Báo cáo nhóm đơn vị theo tháng', component: BaoCaoGroupMonth, key: 'BaoCaoGroupMonth' },
	{ id: 'baocao-group-unit', name: 'Báo cáo nhóm đơn vị', component: BaoCaoGroupUnit, key: 'BaoCaoGroupUnit' },
	{ id: 'baocao-nhom-kenh', name: 'Báo cáo nhóm kênh', component: BaoCaoNhomKenh, key: 'BaoCaoNhomKenh' },
	{
		id: 'baocao-pb-nhom-kenh2',
		name: 'Báo cáo nhóm kênh theo tháng',
		component: BaoCaoPBNhomKenh2,
		key: 'BaoCaoPBNhomKenh2',
	},
	{ id: 'baocao-pb-nhom-sp', name: 'Báo cáo nhóm sản phẩm', component: BaoCaoPBNhomSP, key: 'BaoCaoPBNhomSP' },
	{ id: 'baocao-pb-nhom-sp2', name: 'Báo cáo nhóm sản phẩm theo tháng', component: BaoCaoPBNhomSP2, key: 'BaoCaoPBNhomSP2' },
	{ id: 'bc-nhom-vv', name: 'Báo cáo nhóm vụ việc', component: BCNhomVV, key: 'BCNhomVV' },
	{ id: 'baocao-pb-nhom-vv2', name: 'Báo cáo nhóm vụ việc theo tháng', component: BaoCaoPBNhomVV2, key: 'BaoCaoPBNhomVV2' },
	{ id: 'baocao-tong-quat', name: 'Báo cáo Tổng quát', component: BaoCaoTongQuat, key: 'BaoCaoTongQuat' },
];

export default function TableReportTab() {
	const {
		currentUser,
		currentYearKTQT,
		setCurrentYearKTQT,
		currentCompanyKTQT,
		setCurrentCompanyKTQT,
		listCompany
	} = useContext(MyContext);
	const [activeFolder, setActiveFolder] = useState('data'); // Mặc định mở folder "Bảng dữ liệu"
	const [expandedFolders, setExpandedFolders] = useState({ data: true, ktqt: false });
	const [selectedTableItem, setSelectedTableItem] = useState(null);
	const [selectedKTQTReport, setSelectedKTQTReport] = useState(null);
	const [tableItems, setTableItems] = useState([]);
	const [ktqtReportsVisible, setKtqtReportsVisible] = useState({});
	const [settingsModalVisible, setSettingsModalVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [scrollToItemId, setScrollToItemId] = useState(null);

	// UserClass states for permissions
	const [allUserClasses, setAllUserClasses] = useState([]);
	const [currentUserClasses, setCurrentUserClasses] = useState([]);
	const [selectedUserClasses, setSelectedUserClasses] = useState(new Set());
	const [selectedKTQTReportForPermission, setSelectedKTQTReportForPermission] = useState(null);
	const [ktqtReportPermissions, setKtqtReportPermissions] = useState({});
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [userClassSearchText, setUserClassSearchText] = useState('');
	const [userClassFilter, setUserClassFilter] = useState('all');

	// Tạo listCompanyToShow tương tự như trong Sidebar
	const listCompanyToShow = useMemo(() => {
		if (!listCompany || listCompany.length === 0) return [];

		// Kiểm tra xem đã có HQ chưa
		const ensureHQCompany = (companies) => {
			if (!companies.some(c => c.code === 'HQ')) {
				return [
					...companies,
					{ id: 99999999, name: 'Hợp nhất', code: 'HQ' }
				];
			}
			return companies;
		};

		return ensureHQCompany(listCompany);
	}, [listCompany]);

	const [hasAnalysisReview, setHasAnalysisReview] = useState(false);
	const getDashboardApp = async () => {
		try {
			const dashboard = await getSettingByType('DASHBOARD_SETTING');
			if (Array.isArray(dashboard.setting) && dashboard.setting.some(app => (app?.id === 'fdr'))) {
				setHasAnalysisReview(true);
			}

		} catch (error) {
			console.error('Error loading dashboard app:', error);
		}
	}


	// Load dashboard items có type = table2
	useEffect(() => {
		getDashboardApp();
		const loadTableItems = async () => {
			try {
				setLoading(true);
				const response = await getAllDashBoardItems();
				const tableItems = response.filter(item => item.type === 'table2');
				setTableItems(tableItems);
			} catch (error) {
				console.error('Error loading table items:', error);
				message.error('Lỗi khi tải danh sách bảng dữ liệu');
			} finally {
				setLoading(false);
			}
		};

		loadTableItems();
	}, []);

	// Load settings cho KTQT reports
	useEffect(() => {
		const loadKTQTSettings = async () => {
			try {
				const setting = await getSettingByType('KTQT_REPORTS_VISIBLE');
				if (setting?.setting) {
					setKtqtReportsVisible(setting.setting);
				} else {
					// Default: tất cả đều ẩn
					const defaultVisible = {};
					KTQT_REPORTS.forEach(report => {
						defaultVisible[report.id] = false;
					});
					setKtqtReportsVisible(defaultVisible);
				}
			} catch (error) {
				console.error('Error loading KTQT settings:', error);
			}
		};

		loadKTQTSettings();
	}, []);

	// Load user classes
	useEffect(() => {
		const loadUserClasses = async () => {
			try {
				const userClasses = await getAllUserClass();
				setAllUserClasses(userClasses);
			} catch (error) {
				console.error('Error loading user classes:', error);
			}
		};

		const loadCurrentUserClasses = async () => {
			try {
				const userClasses = await getUserClassByEmail();
				setCurrentUserClasses(userClasses);
			} catch (error) {
				console.error('Error loading current user classes:', error);
				setCurrentUserClasses([]);
			}
		};

		loadUserClasses();
		loadCurrentUserClasses();
	}, []);

	// Load KTQT report permissions
	useEffect(() => {
		const loadKTQTPermissions = async () => {
			try {
				const setting = await getSettingByType('KTQT_REPORTS_PERMISSIONS');
				if (setting?.setting) {
					setKtqtReportPermissions(setting.setting);
				} else {
					// Default: không có hạn chế quyền
					const defaultPermissions = {};
					KTQT_REPORTS.forEach(report => {
						defaultPermissions[report.id] = [];
					});
					setKtqtReportPermissions(defaultPermissions);
				}
			} catch (error) {
				console.error('Error loading KTQT permissions:', error);
			}
		};

		loadKTQTPermissions();
	}, []);

	const handleTableItemClick = (item) => {
		setSelectedTableItem(item);
		setActiveFolder('data');
		setSelectedKTQTReport(null);
		// Set scrollToItemId để scroll đến item trong TableAnalysisTab
		setScrollToItemId(item.id);
	};

	const handleDataFolderClick = () => {
		setActiveFolder('data');
		setSelectedKTQTReport(null);
		setExpandedFolders(prev => ({ ...prev, data: !prev.data }));
		// Luôn hiển thị TableAnalysisTab khi click vào folder Bảng dữ liệu
		// Không cần set selectedTableItem vì renderTableAnalysis sẽ hiển thị TableAnalysisTab mặc định
	};

	const handleKTQTReportClick = (report) => {
		setSelectedKTQTReport(report);
		setActiveFolder('ktqt');
		setSelectedTableItem(null);
	};

	const handleSettingsClick = () => {
		setSettingsModalVisible(true);
	};

	const handleSaveSettings = async () => {
		try {
			const existing = await getSettingByType('KTQT_REPORTS_VISIBLE');
			if (existing && existing.id) {
				await updateSetting({
					...existing,
					setting: ktqtReportsVisible,
				});
			} else {
				await createSetting({
					type: 'KTQT_REPORTS_VISIBLE',
					setting: ktqtReportsVisible,
				});
			}
			setSettingsModalVisible(false);
			message.success('Cài đặt đã được lưu thành công');
		} catch (error) {
			console.error('Error saving settings:', error);
			message.error('Lỗi khi lưu cài đặt');
		}
	};

	const handleReportVisibilityChange = (reportId, visible) => {
		setKtqtReportsVisible(prev => ({
			...prev,
			[reportId]: visible,
		}));
	};

	// Filter user classes based on search and filter
	const filteredUserClasses = allUserClasses
		.filter(userClass => userClass.module === 'DASHBOARD') // Chỉ lấy module DASHBOARD
		.filter(userClass => {
			const matchesSearch = userClass.name.toLowerCase().includes(userClassSearchText.toLowerCase());

			const matchesFilter = userClassFilter === 'all' || (userClassFilter === 'selected' && selectedUserClasses.has(userClass.id)) || (userClassFilter === 'unselected' && !selectedUserClasses.has(userClass.id));

			return matchesSearch && matchesFilter;
		});

	// Kiểm tra quyền truy cập báo cáo KTQT
	const canAccessKTQTReport = useCallback((reportId) => {
		// Nếu user là admin, editor hoặc super admin thì có thể truy cập tất cả
		if (currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) {
			return true;
		}

		// Lấy quyền của báo cáo
		const reportPermissions = ktqtReportPermissions[reportId] || [];

		// Nếu báo cáo chưa gắn quyền (không có userClasses), chỉ admin/superAdmin/editor mới truy cập được
		if (!reportPermissions || reportPermissions.length === 0) {
			return false; // User thường không thể truy cập báo cáo chưa gắn quyền
		}

		// Kiểm tra xem user hiện tại có trong userClasses của báo cáo không
		const userClassIds = currentUserClasses.map(uc => uc.id);
		return reportPermissions.some(userClassId => userClassIds.includes(userClassId));
	}, [currentUser, currentUserClasses, ktqtReportPermissions]);

	const handleUserClassChange = (userClassId) => {
		setSelectedUserClasses(prev => {
			const newSet = new Set(prev);
			if (newSet.has(userClassId)) {
				newSet.delete(userClassId);
			} else {
				newSet.add(userClassId);
			}
			return newSet;
		});
	};

	const handleSelectAllVisible = () => {
		const visibleUserClassIds = filteredUserClasses.map(uc => uc.id);
		setSelectedUserClasses(prev => new Set([...prev, ...visibleUserClassIds]));
	};

	const handleDeselectAllVisible = () => {
		const visibleUserClassIds = filteredUserClasses.map(uc => uc.id);
		setSelectedUserClasses(prev => {
			const newSet = new Set(prev);
			visibleUserClassIds.forEach(id => newSet.delete(id));
			return newSet;
		});
	};

	const handleOpenPermissionModal = (report) => {
		setSelectedKTQTReportForPermission(report);
		setSelectedUserClasses(new Set(ktqtReportPermissions[report.id] || []));
		setUserClassSearchText('');
		setUserClassFilter('all');
		setShowAuthModal(true);
	};

	const handleSaveKTQTPermission = async () => {
		try {
			if (selectedKTQTReportForPermission) {
				const newPermissions = {
					...ktqtReportPermissions,
					[selectedKTQTReportForPermission.id]: Array.from(selectedUserClasses),
				};

				// Lưu vào settings
				const existing = await getSettingByType('KTQT_REPORTS_PERMISSIONS');
				if (existing && existing.id) {
					await updateSetting({
						...existing,
						setting: newPermissions,
					});
				} else {
					await createSetting({
						type: 'KTQT_REPORTS_PERMISSIONS',
						setting: newPermissions,
					});
				}

				setKtqtReportPermissions(newPermissions);
				setShowAuthModal(false);
				setSelectedKTQTReportForPermission(null);
				setSelectedUserClasses(new Set());
				message.success('Cập nhật quyền báo cáo thành công');
			}
		} catch (error) {
			console.error('Error saving KTQT permission:', error);
			message.error('Có lỗi xảy ra khi lưu quyền báo cáo');
		}
	};

	const handleItemCreated = async () => {
		// Reload danh sách table items khi có item mới được tạo
		try {
			setLoading(true);
			const response = await getAllDashBoardItems();
			const tableItems = response.filter(item => item.type === 'table2');
			setTableItems(tableItems);
		} catch (error) {
			console.error('Error reloading table items:', error);
			message.error('Lỗi khi tải lại danh sách bảng dữ liệu');
		} finally {
			setLoading(false);
		}
	};

	// Reset scrollToItemId sau khi scroll xong
	useEffect(() => {
		if (scrollToItemId) {
			const timer = setTimeout(() => {
				setScrollToItemId(null);
			}, 1000); // Reset sau 1 giây
			return () => clearTimeout(timer);
		}
	}, [scrollToItemId]);

	const renderTableAnalysis = () => {
		// Luôn hiển thị TableAnalysisTab khi folder "Bảng dữ liệu" được chọn
		return <TableAnalysisTab onItemCreated={handleItemCreated}
			scrollToItemId={scrollToItemId}
			isEmbedded={true}
			setTableItems={setTableItems} />;

	};

	const renderKTQTReport = () => {
		if (!selectedKTQTReport) return null;
		const ReportComponent = selectedKTQTReport.component;
		return <ReportComponent />;
	};

	const visibleKTQTReports = KTQT_REPORTS.filter(report => {
		// Kiểm tra xem báo cáo có được hiển thị không
		if (!ktqtReportsVisible[report.id]) return false;

		// Lấy quyền của báo cáo
		const reportPermissions = ktqtReportPermissions[report.id] || [];

		// Nếu báo cáo chưa gắn quyền (không có userClasses), chỉ admin/superAdmin/editor mới thấy
		if (!reportPermissions || reportPermissions.length === 0) {
			return currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin;
		}

		// Nếu có quyền, kiểm tra theo user class
		return canAccessKTQTReport(report.id);
	});

	return (
		<div className={styles.container}>
			{/* Sidebar */}
			<div className={styles.sidebar}>

				<div className={styles.folders}>
					{/* Thư mục Bảng dữ liệu */}
					<div className={styles.folder}>
						<div
							className={`${styles.folderHeader} ${expandedFolders.data ? styles.active : ''}`}
							onClick={handleDataFolderClick}
						>
							{expandedFolders.data ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
							<Database size={16} />
							<span>Bảng số liệu</span>
						</div>
						{expandedFolders.data && (
							<div className={styles.folderContent}>
								{loading ? (
									<div className={styles.loading}>Đang tải...</div>
								) : tableItems.length === 0 ? (
									<div className={styles.empty}>Không có bảng dữ liệu</div>
								) : (
									<List
										size="small"
										dataSource={tableItems}
										renderItem={(item) => (
											<List.Item
												className={`${styles.listItem} ${selectedTableItem?.id === item.id ? styles.selected : ''}`}
												onClick={() => handleTableItemClick(item)}
											>
												<TableIcon size={14} />
												<span className={styles.itemName}>{item.name}</span>
											</List.Item>
										)}
									/>
								)}
							</div>
						)}
					</div>
				
					{/* Thư mục Báo cáo KTQT */}
					{hasAnalysisReview && (
						<div className={styles.folder}>
							<div
								className={`${styles.folderHeader} ${expandedFolders.ktqt ? styles.active : ''}`}
								onClick={() => {
									setActiveFolder('ktqt');
									setExpandedFolders(prev => ({ ...prev, ktqt: !prev.ktqt }));
								}}
							>
								{expandedFolders.ktqt ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
								<FileText size={16} />
								<span>Báo cáo KTQT</span>
								{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
									<Tooltip title="Cài đặt hiển thị">
										<Button
											type="text"
											size="small"
											icon={<Settings size={14} />}
											onClick={(e) => {
												e.stopPropagation();
												handleSettingsClick();
											}}
											style={{ marginLeft: 'auto' }}
										/>
									</Tooltip>
								)}
							</div>
							{expandedFolders.ktqt && (
								<div className={styles.folderContent}>
									{visibleKTQTReports.length === 0 ? (
										<div className={styles.empty}>Chưa có báo cáo nào được hiển thị</div>
									) : (
										<List
											size="small"
											dataSource={visibleKTQTReports}
											renderItem={(report) => (
												<List.Item
													className={`${styles.listItem} ${selectedKTQTReport?.id === report.id ? styles.selected : ''}`}
													onClick={() => handleKTQTReportClick(report)}
												>
													<BarChart3 size={14} />
													<span className={styles.itemName}>{report.name}</span>
												</List.Item>
											)}
										/>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Main Content */}
			<div className={styles.mainContent}>
				{activeFolder === 'data' && renderTableAnalysis()}
				<div style={{ padding: '16px 16px 16px 24px' }}>
					{selectedKTQTReport && renderKTQTReport()}
				</div>
				{activeFolder !== 'data' && !selectedKTQTReport && (
					<div className={styles.placeholder}>
						<TableIcon size={48} style={{ color: '#d9d9d9' }} />
						<Title level={3} style={{ color: '#999' }}>Chọn một bảng dữ liệu hoặc báo cáo</Title>
						<Text type="secondary">Từ sidebar bên trái để bắt đầu xem dữ liệu</Text>
					</div>
				)}
			</div>

			{/* Settings Modal */}
			<Modal
				title="Cài đặt hiển thị báo cáo KTQT"
				open={settingsModalVisible}
				onCancel={() => setSettingsModalVisible(false)}
				onOk={handleSaveSettings}
				okText="Lưu"
				cancelText="Hủy"
				width={600}
			>
				<div className={styles.settingsContent}>
					{/* Year và Company Selector */}
					<div style={{ marginBottom: 24, padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
						<Text strong style={{ marginBottom: 12, display: 'block' }}>
							Cài đặt năm và công ty cho dữ liệu báo cáo:
						</Text>
						<div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
							<div>
								<Text style={{ marginBottom: 4, display: 'block' }}>Năm:</Text>
								<YearSelectKTQT />
							</div>
							<div style={{ flex: 1, minWidth: '200px' }}>
								<Text style={{ marginBottom: 4, display: 'block' }}>Công ty:</Text>
								<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
									{listCompanyToShow.map(item => (
										<Button
											key={item.code || item.id || item.name}
											type={item.code == currentCompanyKTQT ? "primary" : "default"}
											onClick={() => setCurrentCompanyKTQT(item.code)}
											style={{
												marginBottom: 4,
												backgroundColor: item.code == currentCompanyKTQT ? '#1C6EBB' : '#fff',
												borderColor: item.code == currentCompanyKTQT ? '#1C6EBB' : '#DADADA',
											}}
										>
											<span style={{
												fontWeight: item.code == currentCompanyKTQT ? 'bold' : 'normal',
												color: item.code == currentCompanyKTQT ? '#fff' : '#262626',
											}}>
												{item.name}
											</span>
										</Button>
									))}
								</div>
							</div>
						</div>
					</div>

					<Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
						Chọn các báo cáo KTQT sẽ hiển thị trong danh sách:
					</Text>
					{KTQT_REPORTS.map((report) => {
						const reportPermissions = ktqtReportPermissions[report.id] || [];
						const hasPermissions = reportPermissions && reportPermissions.length > 0;
						const canSeeReport = currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin || hasPermissions;

						// Chỉ hiển thị báo cáo nếu user có quyền xem
						if (!canSeeReport) return null;

						return (
							<div key={report.id} className={styles.settingItem} style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: '8px 0',
								borderBottom: '1px solid #f0f0f0'
							}}>
								<div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
									<Checkbox
										checked={ktqtReportsVisible[report.id] || false}
										onChange={(e) => handleReportVisibilityChange(report.id, e.target.checked)}
										style={{ marginRight: 8 }}
									>
										{report.name}
									</Checkbox>
									{hasPermissions ? (
										<Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
											({reportPermissions.length} quyền)
										</Text>
									) : (
										<Text type="warning" style={{ fontSize: '12px', marginLeft: 8 }}>
											(Chưa gắn quyền)
										</Text>
									)}
								</div>
								{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
									<Button
										size="small"
										type="text"
										icon={<Shield size={14} />}
										onClick={() => handleOpenPermissionModal(report)}
										title="Cài đặt quyền"
										style={{ color: '#1890ff' }}
									>
									</Button>
								)}
							</div>
						);
					})}
				</div>
			</Modal>

			{/* Authorization Modal for KTQT Reports */}
			<AuthorizationModal
				visible={showAuthModal}
				onCancel={() => {
					setShowAuthModal(false);
					setUserClassSearchText('');
					setUserClassFilter('all');
					setSelectedKTQTReportForPermission(null);
				}}
				selectedDashboardItem={selectedKTQTReportForPermission ? {
					id: selectedKTQTReportForPermission.id,
					name: selectedKTQTReportForPermission.name,
					userClasses: ktqtReportPermissions[selectedKTQTReportForPermission.id] || []
				} : null}
				dashboardItems={[]}
				allUserClasses={allUserClasses}
				userClassSearchText={userClassSearchText}
				setUserClassSearchText={setUserClassSearchText}
				userClassFilter={userClassFilter}
				setUserClassFilter={setUserClassFilter}
				filteredUserClasses={filteredUserClasses}
				selectedUserClasses={selectedUserClasses}
				handleUserClassChange={handleUserClassChange}
				handleSelectAllVisible={handleSelectAllVisible}
				handleDeselectAllVisible={handleDeselectAllVisible}
				handleSaveUserClass={handleSaveKTQTPermission}
				handleOpenUserClassModal={() => { }}
			/>
		</div>
	);
}
