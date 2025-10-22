import React, { useState, useEffect, useContext } from 'react';
import { Settings, FileText, BarChart3, Wrench, PieChart, TrendingUp, BarChart, Bell, Table, FileBarChart } from 'lucide-react';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { Button, Dropdown, Badge, Tooltip, Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import TabButton from './common/TabButton';
import styles from '../AnalysisReview.module.css';
import { getSettingByType, getSchemaTools, createSetting, updateSetting } from '../../../apis/settingService.jsx';
import { getAuditLogs, getCountAuditLogByTableName } from '../../../apis/auditLogService.jsx';
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../../icon/svg/IconSvg.jsx';
import css from '../../DataManager/header/HeaderDM.module.css';
import ProfileSelect from '../../Home/SelectComponent/ProfileSelect.jsx';
import AuditLogViewer from './AuditLogViewer';
import { MyContext } from '../../../MyContext.jsx';

const Header = ({
	setActiveTab,
	headerSettings,
	setHeaderSettings,
	activeTab,
	onBackToDashboard,
	isMobile = false,
	canAccessDataAndStats = true,
	canAccessTableReport = true,
	canAccessReports = true,
	canAccessReportBuilder = true,
	canAccessBusiness = true,
	canAccessDashboard = true,
	canAccessStatistics = true,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { currentUser } = useContext(MyContext);
	const [nameTable, setNameTable] = useState(null);
	const [tool, setTool] = useState(null);
	const [masterTool, setMasterTool] = useState(null);

	const [auditLogCounts, setAuditLogCounts] = useState({
		AiChatHistory: 0,
		DashboardItem: 0,
		KPICalculator: 0,
		KPI2Calculator: 0
	});
	const [totalAuditLogs, setTotalAuditLogs] = useState(0);
	const [auditLogModalVisible, setAuditLogModalVisible] = useState(false);
	const [settingModalVisible, setSettingModalVisible] = useState(false);
	const [tableAnalysisEnabled, setTableAnalysisEnabled] = useState(false);
	const [dashboardEnabled, setDashboardEnabled] = useState(true);
	const [statisticsEnabled, setStatisticsEnabled] = useState(true);
	const [tableReportEnabled, setTableReportEnabled] = useState(true);
	const [defaultTab, setDefaultTab] = useState('data');
	const [selectedColors, setSelectedColors] = useState([
		{ id: 1, color: '#13C2C2' },
		{ id: 2, color: '#3196D1' },
		{ id: 3, color: '#6DB8EA' },
		{ id: 4, color: '#87D2EA' },
		{ id: 5, color: '#9BAED7' },
		{ id: 6, color: '#C695B7' },
		{ id: 7, color: '#EDCCA1' },
		{ id: 8, color: '#A4CA9C' }
	]);

	// Hàm kết hợp với thông tin từ schema master
	const combineWithMasterInfo = async (currentTool) => {
		try {
			const masterResponse = await getSchemaTools('master');
			const masterAppsList = masterResponse?.setting || [];

			if (masterAppsList && masterAppsList.length > 0) {
				const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
				if (masterApp) {
					return {
						...currentTool,
						name: masterApp.name,
						icon: masterApp.icon
					};
				}
			}
			return currentTool;
		} catch (error) {
			console.error('Error getting master apps for analysis header:', error);
			return currentTool;
		}
	};


	// Hàm xử lý logic điều hướng mặc định
	const getDefaultTab = () => {
		// Kiểm tra tab mặc định có được bật không
		const isDefaultTabEnabled = () => {
			switch (defaultTab) {
				case 'business':
					return dashboardEnabled;
				case 'statistics':
					return statisticsEnabled;
				case 'table-report':
					return tableReportEnabled;
				case 'data':
					return true; // Data tab luôn available
				default:
					return false;
			}
		};

		// Nếu tab mặc định được bật, sử dụng nó
		if (isDefaultTabEnabled()) {
			return defaultTab;
		}

		// Nếu tab mặc định bị tắt, tìm tab khác có sẵn
		const availableTabs = [];

		if (dashboardEnabled) {
			availableTabs.push('business');
		}
		if (tableReportEnabled) {
			availableTabs.push('table-report');
		}
		if (statisticsEnabled) {
			availableTabs.push('statistics');
		}
		// Data tab luôn available
		availableTabs.push('data');

		// Trả về tab đầu tiên có sẵn, hoặc 'data' làm fallback
		return availableTabs.length > 0 ? availableTabs[0] : 'data';
	};

	// Load setting cho header analysis review
	const loadHeaderAnalysisReviewSetting = async () => {
		try {
			const settingData = headerSettings

			// Debug log trước khi set state

			setTableAnalysisEnabled(settingData.tableAnalysisEnabled === true);
			setDashboardEnabled(settingData.dashboardEnabled !== false); // Default true nếu undefined/null
			setStatisticsEnabled(settingData.statisticsEnabled !== false); // Default true nếu undefined/null
			setTableReportEnabled(settingData.tableReportEnabled !== false); // Default true nếu undefined/null
			setDefaultTab(settingData.defaultTab || 'data'); // Default business nếu undefined/null


		} catch (error) {
			console.error('Error loading header analysis review setting:', error);
			// Default setting nếu không load được
			setTableAnalysisEnabled(false);
			setDashboardEnabled(true);
			setStatisticsEnabled(true);
			setTableReportEnabled(true);
			setDefaultTab('data');
		}
	};

	// Hàm mở modal setting
	const handleOpenSettingModal = () => {
	
		setSettingModalVisible(true);
	};

	// Hàm đóng modal setting
	const handleCloseSettingModal = () => {
		setSettingModalVisible(false);
	};

	// Hàm lưu setting
	const handleSaveSetting = async () => {
		try {
			const newSetting = {
				tableAnalysisEnabled: tableAnalysisEnabled,
				dashboardEnabled: dashboardEnabled,
				statisticsEnabled: statisticsEnabled,
				tableReportEnabled: tableReportEnabled,
				defaultTab: defaultTab
			};

			// Cập nhật state local
			// Lưu vào database
			const existing = await getSettingByType('SettingHeaderAnalysisReview');
			if (existing && existing.id) {
				// Update existing setting
				await updateSetting({
					...existing,
					setting: newSetting
				});
				setHeaderSettings(newSetting);

			} else {
				// Create new setting
				await createSetting({
					type: 'SettingHeaderAnalysisReview',
					setting: newSetting
				});
				setHeaderSettings(newSetting);
			}

			setSettingModalVisible(false);
			console.log('Setting saved successfully:', newSetting);
		} catch (error) {
			console.error('Error saving setting:', error);
		}
	};

	useEffect(() => {
		const getDashboardSetting = async () => {
			try {
				const res = await getSettingByType('DASHBOARD_SETTING');
				if (res.setting.length > 0) {
					let dashboardSetting = res.setting.find(item => location.pathname.includes(item.id));
					if (dashboardSetting) {
						// Kết hợp với thông tin từ schema master
						const combinedTool = await combineWithMasterInfo(dashboardSetting);
						setNameTable(combinedTool.name);
						setTool(combinedTool);
						setMasterTool(combinedTool);
					}
				}
			} catch (error) {
				console.error('Error loading dashboard setting for analysis:', error);
			}
		};

		getDashboardSetting();
	}, [location]);

	// Load header analysis review setting on component mount
	useEffect(() => {
		loadHeaderAnalysisReviewSetting();
	}, [headerSettings]);

	// Load color settings on component mount
	useEffect(() => {
		const loadColorSettings = async () => {
			try {
				const existing = await getSettingByType('SettingColor');

				if (existing && existing.setting && Array.isArray(existing.setting)) {
					const isValidColorArray = existing.setting.every(item =>
						item && typeof item === 'object' &&
						typeof item.id === 'number' &&
						typeof item.color === 'string'
					);

					if (isValidColorArray) {
						setSelectedColors(existing.setting);
					}
				}
			} catch (error) {
				console.error('Error loading initial color settings:', error);
			}
		};

		loadColorSettings();
	}, []);

	
	const handleTab = (tab) => {
		setActiveTab(tab);
		if (tab === 'data') {
			navigate('/analysis-review/data');
		} else if (tab === 'reports') {
			navigate('/analysis-review/reports');
		} else if (tab === 'builder') {
			navigate('/analysis-review/builder');
		} else if (tab === 'statistics') {
			navigate('/analysis-review/statistics');
		} else if (tab === 'measurement') {
			navigate('/analysis-review/measurement');
		} else if (tab === 'business') {
			navigate('/analysis-review/business');
		} else if (tab === 'table-analysis') {
			navigate('/analysis-review/table-analysis');
		} else if (tab === 'table-report') {
			navigate('/analysis-review/table-report');
		} else if (tab === 'dashboard') {
			navigate('/analysis-review/business');
		}
	};

	// Lắng nghe sự kiện từ KeyboardShortcut để chuyển tab
	useEffect(() => {
		const handleSwitchTab = (event) => {
			const tab = event.detail;
			console.log('Received switchTab event:', tab);
			
			// Kiểm tra quyền truy cập trước khi chuyển tab
			const canSwitch = () => {
				switch (tab) {
					case 'data':
						return canAccessDataAndStats;
					case 'statistics':
						return canAccessStatistics && statisticsEnabled;
					case 'business':
						return canAccessDashboard && dashboardEnabled;
					case 'table-report':
						return canAccessTableReport && tableReportEnabled;
					default:
						return false;
				}
			};

			if (canSwitch()) {
				handleTab(tab);
			} else {
				console.log(`Cannot switch to tab ${tab} - access denied or tab disabled`);
			}
		};

		window.addEventListener('switchTab', handleSwitchTab);
		
		return () => {
			window.removeEventListener('switchTab', handleSwitchTab);
		};
	}, [ handleTab]);

	// Fetch audit log counts for all tables
	useEffect(() => {
		const fetchAuditLogCounts = async () => {
			try {
				let logs = await getAuditLogs();
				const tableNames = ['AiChatHistory', 'DashboardItem', 'KPICalculator', 'KPI2Calculator'];
				const promises = tableNames.map(tableName => getCountAuditLogByTableName(tableName));
				const results = await Promise.all(promises);

				const counts = {};
				let total = 0;
				tableNames.forEach((tableName, index) => {
					counts[tableName] = results[index] || 0;
					total += results[index] || 0;
				});

				setAuditLogCounts(counts);
				setTotalAuditLogs(total);
			} catch (error) {
				console.error('Error fetching audit log counts:', error);
			}
		};

		fetchAuditLogCounts();
	}, []);
	const getIconSrcById = (tool) => {
		const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
		return found ? found.icon : undefined;
	};


	// Hàm điều hướng đến tab mặc định
	const navigateToDefaultTab = () => {
		const defaultTab = getDefaultTab();
		handleTab(defaultTab);
	};

	const handleAuditLogClick = () => {
		// Mở modal hiển thị tất cả các loại audit log
		setAuditLogModalVisible(true);
	};



	return (
		<>
			<div className={styles.topNav} style={{
				'--custom-active-color': selectedColors[0]?.color || '#13C2C2'
			}}>
				<div className={styles.navContent}>
					<div className={styles.navInner}>
						<div className={styles.navLeft}>
							<div className={css.backCanvas}
								onClick={() =>
									navigate('/dashboard')
								}
							>
								<BackCanvas height={isMobile ? 16 : 20} width={isMobile ? 16 : 20} />
							</div>
							{masterTool && (
								<>
									{masterTool.icon ? (
										(() => {
											const iconSrc = getIconSrcById(masterTool);
											return iconSrc ? (
												<img src={iconSrc} alt={masterTool.name} width={isMobile ? 24 : 30} height={isMobile ? 24 : 30} />
											) : (
												<span style={{ fontSize: isMobile ? '16px' : '20px' }}>{masterTool.icon}</span>
											);
										})()
									) : (
										<span style={{ fontSize: isMobile ? '16px' : '20px' }}>🛠️</span>
									)}
								</>
							)}
							<div className={css.headerLogo}>
								{isMobile ? null : (masterTool ? masterTool.name : nameTable)}
							</div>
							{/*<button className={styles.settingsButton}>*/}
							{/*	<Settings className={`${styles.h4} ${styles.w4}`} />*/}
							{/*</button>*/}

							<div className={styles.navRight}>
								{isMobile ? (
									// Mobile: Dropdown menu
									<Dropdown
										menu={{
											items: [
												...(  [{
													key: 'business',
													label: (
														<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
															<FileText size={16} />
															<span>Dashboard</span>
														</div>
													),
													onClick: () => handleTab('business'),
												}] ),
												// ...(canAccessReports ? [{
												// 	key: 'reports',
												// 	label: (
												// 		<div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
												// 			<BarChart3 size={isMobile ? 14 : 16} />
												// 			<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Reports</span>
												// 		</div>
												// 	),
												// 	onClick: () => handleTab('reports'),
												// }] : []),
												// ...(canAccessReportBuilder ? [{
												// 	key: 'builder',
												// 	label: (
												// 		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
												// 			<Wrench size={16} />
												// 			<span>Report Builder</span>
												// 		</div>
												// 	),
												// 	onClick: () => handleTab('builder'),
												// }] : []),
												// ...(canAccessDataAndStats ? [{
												// 	key: 'statistics',
												// 	label: (
												// 		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
												// 			<PieChart size={16} />
												// 			<span>Thiết lập thống kê</span>
												// 		</div>
												// 	),
												// 	onClick: () => handleTab('statistics'),
												// }] : []),
												// ...(canAccessDataAndStats ? [{
												// 	key: 'measurement',
												// 	label: (
												// 		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
												// 			<TrendingUp size={16} />
												// 			<span>Kết quả đo lường</span>
												// 		</div>
												// 	),
												// 	onClick: () => handleTab('measurement'),
												// }] : []),
												// ...(canAccessDashboard && dashboardEnabled ? [{
												// 	key: 'dashboard',
												// 	label: (
												// 		<div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
												// 			<BarChart size={isMobile ? 14 : 16} />
												// 			<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Dashboard</span>
												// 		</div>
												// 	),
												// 	onClick: () => handleTab('dashboard'),
												// }] : []),
												// ...(canAccessStatistics && statisticsEnabled ? [{
												// 	key: 'statistics',
												// 	label: (
												// 		<div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
												// 			<PieChart size={isMobile ? 14 : 16} />
												// 			<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Xây chỉ số</span>
												// 		</div>
												// 	),
												// 	onClick: () => handleTab('statistics'),
												// }] : []),
												// ...(canAccessDataAndStats && canShowTableAnalysis() ? [{
												// 	key: 'table-analysis',
												// 	label: (
												// 		<div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
												// 			<Table size={isMobile ? 14 : 16} />
												// 			<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Table Analysis</span>
												// 		</div>
												// 	),
												// 	onClick: () => handleTab('table-analysis'),
												// }] : []),
												// ...(canAccessTableReport && tableReportEnabled ? [{
												// 	key: 'table-report',
												// 	label: (
												// 		<div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
												// 			<FileBarChart size={isMobile ? 14 : 16} />
												// 			<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Table Report</span>
												// 		</div>
												// 	),
												// 	onClick: () => handleTab('table-report'),
												// }] : []),
											],
										}}
										trigger={['click']}
										placement="bottomRight"
									>
										<Button
											type="text"
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: isMobile ? '4px' : '8px',
												color: '#1890ff',
												fontWeight: 500,
												padding: isMobile ? '4px 8px' : '8px 12px',
												fontSize: isMobile ? '12px' : '14px',
											}}
										>
											{activeTab === 'data' ? 'Data' :
												activeTab === 'reports' ? 'Reports' :
													activeTab === 'builder' ? 'Report Builder' :
														activeTab === 'statistics' ? 'Xây chỉ số' :
															activeTab === 'measurement' ? 'Kết quả đo lường' :
																activeTab === 'business' ? 'Dashboard' :
																	activeTab === 'dashboard' ? 'Dashboard' :
																		activeTab === 'table-analysis' ? 'Table Analysis' :
																			activeTab === 'table-report' ? 'Table Report' : 'Data'}
											<ChevronDown size={isMobile ? 14 : 16} />
										</Button>
									</Dropdown>
								) : (
									// Desktop: Normal tabs
									<div className={styles.tabButtons}>
                                        {canAccessDataAndStats && (
                                            <Tooltip title="Màn Data (ALT + 1)">
                                                <span>
                                                    <TabButton
                                                        tab="data"
                                                        icon={FileText}
                                                        isActive={activeTab === 'data'}
                                                        onClick={() => handleTab('data')}
                                                    >
                                                        Data
                                                    </TabButton>
                                                </span>
                                            </Tooltip>
                                        )}


                                        {canAccessStatistics && statisticsEnabled && (
                                            <Tooltip title="Màn Xây chỉ số (ALT + 2)">
                                                <span>
                                                    <TabButton
                                                        tab="statistics-measurement"
                                                        icon={PieChart}
                                                        isActive={activeTab === 'statistics' || activeTab === 'measurement'}
                                                        onClick={() => handleTab('statistics')}
                                                    >
                                                        Xây chỉ số
                                                    </TabButton>
                                                </span>
                                            </Tooltip>
                                        )}

                                        {canAccessDashboard && dashboardEnabled && (
                                            <Tooltip title="Màn Dashboard (ALT + 3)">
                                                <span>
                                                    <TabButton
                                                        tab="dashboard"
                                                        icon={BarChart}
                                                        isActive={activeTab === 'business' || activeTab === 'dashboard'}
                                                        onClick={() => handleTab('dashboard')}
                                                    >
                                                        
                                                        Dashboard
                                                    </TabButton>
                                                </span>
                                            </Tooltip>
                                        )}

										{/*{canAccessReportBuilder && (*/}
										{/*	<TabButton*/}
										{/*		tab="builder"*/}
										{/*		icon={Wrench}*/}
										{/*		isActive={activeTab === 'builder'}*/}
										{/*		onClick={() => handleTab('builder')}*/}
										{/*	>*/}
										{/*		Trợ lý báo cáo*/}
										{/*	</TabButton>*/}
										{/*)}*/}

										{/*{canAccessReports && (*/}
										{/*	<TabButton*/}
										{/*		tab="reports"*/}
										{/*		icon={BarChart3}*/}
										{/*		isActive={activeTab === 'reports'}*/}
										{/*		onClick={() => handleTab('reports')}*/}
										{/*	>*/}
										{/*		Báo cáo*/}
										{/*	</TabButton>*/}
										{/*)}*/}


										{/*{canAccessDataAndStats && canShowTableAnalysis() && (*/}
										{/*	<TabButton*/}
										{/*		tab="table-analysis"*/}
										{/*		icon={Table}*/}
										{/*		isActive={activeTab === 'table-analysis'}*/}
										{/*		onClick={() => handleTab('table-analysis')}*/}
										{/*	>*/}
										{/*		Bảng số liệu*/}
										{/*	</TabButton>*/}
										{/*)}*/}

                                        {canAccessTableReport && tableReportEnabled && (
                                            <Tooltip title="Màn Table Analytics (ALT + 4)">
                                                <span>
                                                    <TabButton
                                                        tab="table-report"
                                                        icon={FileBarChart}
                                                        isActive={activeTab === 'table-report'}
                                                        onClick={() => handleTab('table-report')}
                                                    >
                                                        Table Analytics
                                                    </TabButton>
                                                </span>
                                            </Tooltip>
                                        )}
									</div>
								)}
							</div>
						</div>

						<div className={css.header_right}>
							{isMobile ? null : (
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<Tooltip title={`Tổng số lượt audit log: ${totalAuditLogs}`}>
										<Badge count={totalAuditLogs} offset={[0, 0]}>
											<Bell
												size={20}
												style={{ cursor: 'pointer' }}
												onClick={handleAuditLogClick}
											/>
										</Badge>
									</Tooltip>
									{(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
										<Tooltip title="Cài đặt hiển thị các tab">
											<Settings
												size={20}
												style={{ cursor: 'pointer' }}
												onClick={handleOpenSettingModal}
											/>
										</Tooltip>
									)}
								</div>
							)}
							<div className={css.username}>
								<ProfileSelect />
							</div>
						</div>
					</div>
				</div>
			</div>



			{/* Audit Log Modal */}
			<Modal
				// title="Lịch sử thay đổi - Tất cả các loại"
				open={auditLogModalVisible}
				onCancel={() => setAuditLogModalVisible(false)}
				footer={null}
				width="90%"
				style={{ top: 20 }}
				bodyStyle={{
					maxHeight: 'calc(100vh - 200px)',
					overflow: 'auto',
					padding: '24px'
				}}
			>
				{auditLogModalVisible && (
					<>
						{console.log('🔍 Opening modal with all audit log types')}
						<AuditLogViewer tableNames={['AiChatHistory', 'DashboardItem', 'KPICalculator', 'KPI2Calculator']} />
					</>
				)}
			</Modal>

			{/* Setting Modal */}
			<Modal
				title="Cài đặt hiển thị các tab"
				open={settingModalVisible}
				onCancel={handleCloseSettingModal}
				onOk={handleSaveSetting}
				okText="Lưu"
				cancelText="Hủy"
				width={500}
			>
				<div style={{ padding: '16px 0' }}>
					{/* Tab mặc định */}
					<div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
						<h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Tab mặc định</h4>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
								<input
									type="radio"
									name="defaultTab"
									value="business"
									checked={defaultTab === 'business'}
									onChange={(e) => setDefaultTab(e.target.value)}
									disabled={!dashboardEnabled}
								/>
								<span style={{ color: !dashboardEnabled ? '#999' : '#333' }}>
									Dashboard {!dashboardEnabled && '(Đã tắt)'}
								</span>
							</label>
							<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
								<input
									type="radio"
									name="defaultTab"
									value="statistics"
									checked={defaultTab === 'statistics'}
									onChange={(e) => setDefaultTab(e.target.value)}
									disabled={!statisticsEnabled}
								/>
								<span style={{ color: !statisticsEnabled ? '#999' : '#333' }}>
									Xây chỉ số {!statisticsEnabled && '(Đã tắt)'}
								</span>
							</label>
							<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
								<input
									type="radio"
									name="defaultTab"
									value="table-report"
									checked={defaultTab === 'table-report'}
									onChange={(e) => setDefaultTab(e.target.value)}
									disabled={!tableReportEnabled}
								/>
								<span style={{ color: !tableReportEnabled ? '#999' : '#333' }}>
									Table Analytics {!tableReportEnabled && '(Đã tắt)'}
								</span>
							</label>
							<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
								<input
									type="radio"
									name="defaultTab"
									value="data"
									checked={defaultTab === 'data'}
									onChange={(e) => setDefaultTab(e.target.value)}
								/>
								<span>Data</span>
							</label>
						</div>
					</div>

					{/* Hiển thị các tab */}
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
						<span>Hiển thị tab "Dashboard"</span>
						<Button
							type={dashboardEnabled ? 'primary' : 'default'}
							onClick={() => setDashboardEnabled(!dashboardEnabled)}
							style={{ minWidth: '80px' }}
						>
							{!dashboardEnabled ? 'Bật' : 'Tắt'}
						</Button>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
						<span>Hiển thị tab "Xây chỉ số"</span>
						<Button
							type={statisticsEnabled ? 'primary' : 'default'}
							onClick={() => setStatisticsEnabled(!statisticsEnabled)}
							style={{ minWidth: '80px' }}
						>
							{!statisticsEnabled ? 'Bật' : 'Tắt'}
						</Button>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
						<span>Hiển thị tab "Table Analytics"</span>
						<Button
							type={tableReportEnabled ? 'primary' : 'default'}
							onClick={() => setTableReportEnabled(!tableReportEnabled)}
							style={{ minWidth: '80px' }}
						>
							{!tableReportEnabled ? 'Bật' : 'Tắt'}
						</Button>
					</div>

				</div>
			</Modal>
		</>
	);
};

export default Header;
