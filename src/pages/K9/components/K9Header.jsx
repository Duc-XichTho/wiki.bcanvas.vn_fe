import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../../icon/svg/IconSvg.jsx';
import { getSettingByType, getSchemaTools } from '../../../apis/settingService.jsx';
import ProfileSelect from '../../Home/SelectComponent/ProfileSelect.jsx';
import styles from '../K9.module.css';

const K9Header = ({ onBack, activeTab, onTabChange, tabOptions }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [nameTable, setNameTable] = useState(null);
	const [tool, setTool] = useState(null);
	const [masterTool, setMasterTool] = useState(null);
	const [isMobile, setIsMobile] = useState(false);

	// Hàm kết hợp với thông tin từ schema master
	const combineWithMasterInfo = async (currentTool) => {
		try {
			const masterResponse = await getSchemaTools('master');
			const masterAppsList = masterResponse?.setting || [];
			
			if (masterAppsList && masterAppsList.length > 0) {
				const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
				if (masterApp) {
					console.log(`K9Header: Combining tool ${currentTool.id} with master info`);
					return {
						...currentTool,
						name: masterApp.name,
						icon: masterApp.icon
					};
				}
			}
			return currentTool;
		} catch (error) {
			console.error('Error getting master apps for K9 header:', error);
			return currentTool;
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
					} else {
						// Fallback for K9Service page
						setNameTable('Business Databook | Bách khoa kinh doanh 4.0');
					}
				}
			} catch (error) {
				console.error('Error loading dashboard setting for K9:', error);
			}
		};
		
		getDashboardSetting();
	}, [location]);

	// Check screen size for responsive behavior
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth <= 400);
		};

		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);

		return () => window.removeEventListener('resize', checkScreenSize);
	}, []);

	const getIconSrcById = (tool) => {
		const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
		return found ? found.icon : undefined;
	};

	const handleBackToDashboard = () => {
		if (onBack) {
			onBack();
		} else {
			navigate('/dashboard');
		}
	};

	const handleSelectChange = (event) => {
		onTabChange(event.target.value);
	};

	return (
		<div className={styles.header}>
			<div className={styles.navContainer}>
				<div className={styles.header_left}>
					<div className={styles.backCanvas}
						 onClick={handleBackToDashboard}
					>
						<BackCanvas height={20} width={20} />
					</div>
					{masterTool && (
						<>
							{masterTool.icon ? (
								(() => {
									const iconSrc = getIconSrcById(masterTool);
									return iconSrc ? (
										<img src={iconSrc} alt={masterTool.name} width={30} height={30} />
									) : (
										<span style={{ fontSize: '20px' }}>{masterTool.icon}</span>
									);
								})()
							) : (
								<span style={{ fontSize: '20px' }}>🛠️</span>
							)}
						</>
					)}
					<div className={styles.headerLogo}>
						{masterTool ? masterTool.name : nameTable}
					</div>
				</div>
				<div className={styles.header_right}>
					{/* Tabs Section */}
					{tabOptions && tabOptions.length > 0 && (
						<div className={styles.tabsWrapper}>
							{isMobile ? (
								// Mobile: Show select dropdown
								<select 
									className={styles.tabSelect}
									value={activeTab}
									onChange={handleSelectChange}
								>
									{tabOptions.map(tab => (
										<option key={tab.key} value={tab.key}>
											{tab.label}
										</option>
									))}
								</select>
							) : (
								// Desktop: Show tabs
								<div className={styles.tabs}>
									{tabOptions.map(tab => (
										<button
											key={tab.key}
											className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ''}`}
											onClick={() => onTabChange(tab.key)}
										>
											{tab.label}
										</button>
									))}
								</div>
							)}
						</div>
					)}
					<div className={styles.username}>
						<ProfileSelect />
					</div>
				</div>
			</div>
		</div>
	);
};

export default K9Header;
