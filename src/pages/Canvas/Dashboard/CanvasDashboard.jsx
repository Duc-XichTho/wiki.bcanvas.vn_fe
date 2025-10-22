import css from './CanvasDashboard.module.css';
import { Outlet } from 'react-router-dom';
import SidebarDashboard from './Sidebar/SidebarDashboard.jsx';
import React, { useEffect, useState } from 'react';
import SidebarPhanTichChienLuoc from './Sidebar/SidebarPhanTichChienLuoc.jsx';
import SidebarChiSoKinhDoanh from './Sidebar/SidebarChiSoKinhDoanh.jsx';
import { SettingOutlined } from '@ant-design/icons';
import SettingSidebar from './SettingSidebar';
import { getSettingByType } from '../../../apis/settingService.jsx';

const LOCAL_STORAGE_KEY = 'isShowChienLuocSidebar';
const LOCAL_STORAGE_KEY_ChiSoKinhDoanh = 'isShowChiSoKinhDoanhSidebar';
const LOCAL_STORAGE_KEY_Dashboard = 'isShowDashboardSidebar';

const CanvasDashboard = () => {
	const getInitialState = (data) => {
		const savedState = localStorage.getItem(data);
		return savedState !== null ? JSON.parse(savedState) : true;
	};
	const [isShowChienLuoc, setIsShowChienLuoc] = useState(getInitialState(LOCAL_STORAGE_KEY));
	const [isShowChiSoKinhDoanh, setIsShowChiSoKinhDoanh] = useState(getInitialState(LOCAL_STORAGE_KEY_ChiSoKinhDoanh));
	const [isShowDashboard, setIsShowDashboard] = useState(getInitialState(LOCAL_STORAGE_KEY_Dashboard));

	const [isModalOpen, setIsModalOpen] = useState(false);

	const [isShowChienLuoc1, setIsShowChienLuoc1] = useState(true);
	const [isShowChiSoKinhDoanh1, setIsShowChiSoKinhDoanh1] = useState(true);
	const [isShowDashboard1, setIsShowDashboard1] = useState(true);


	useEffect(() => {
		const loadPreviousSettings = async () => {
			try {
				const data = await getSettingByType('SidebarSettings');
				console.log(data);
				if (data) {
					setIsShowChienLuoc1(data.setting.isShowChienLuoc ?? true);
					setIsShowChiSoKinhDoanh1(data.setting.isShowChiSoKinhDoanh ?? true);
					setIsShowDashboard1(data.setting.isShowDashboard ?? true);
				}
			} catch (error) {
				console.error('Error loading settings:', error)
			}
		};

		loadPreviousSettings();
	}, []);

	// Separate useEffect for localStorage settings
	useEffect(() => {
		const loadLocalStorageSettings = () => {
			const savedChienLuoc = localStorage.getItem(LOCAL_STORAGE_KEY);
			const savedChiSoKinhDoanh = localStorage.getItem(LOCAL_STORAGE_KEY_ChiSoKinhDoanh);
			const savedDashboard = localStorage.getItem(LOCAL_STORAGE_KEY_Dashboard);

			if (savedChienLuoc !== null) setIsShowChienLuoc(JSON.parse(savedChienLuoc));
			if (savedChiSoKinhDoanh !== null) setIsShowChiSoKinhDoanh(JSON.parse(savedChiSoKinhDoanh));
			if (savedDashboard !== null) setIsShowDashboard(JSON.parse(savedDashboard));
		};

		loadLocalStorageSettings();
	}, []);

	const showModal = () => {
		setIsModalOpen(true);
	};

	const handleClose = () => {
		setIsModalOpen(false);
	};

	const handleSettingsChange = (newSettings) => {
		setIsShowChienLuoc1(newSettings.isShowChienLuoc);
		setIsShowChiSoKinhDoanh1(newSettings.isShowChiSoKinhDoanh);
		setIsShowDashboard1(newSettings.isShowDashboard);
	};

	return (
		<div className={css.container}>
			<div className={css.sidebarContainer}>
				{isShowChienLuoc1 && (
					<div className={`${css.sidebarMid} ${!isShowChienLuoc ? css.sidebarMidCollapsed : ''}`}>
						<SidebarPhanTichChienLuoc
							isShowChienLuoc={isShowChienLuoc}
							setIsShowChienLuoc={setIsShowChienLuoc}
						/>
					</div>
				)}
				{isShowChiSoKinhDoanh1 && (
					<div className={`${css.sidebarTop} ${!isShowChiSoKinhDoanh ? css.sidebarTopCollapsed : ''}`}>
						<SidebarChiSoKinhDoanh
							isShowChiSoKinhDoanh={isShowChiSoKinhDoanh}
							setIsShowChiSoKinhDoanh={setIsShowChiSoKinhDoanh}
						/>
					</div>
				)}
				{isShowDashboard1 && (
					<div className={css.sidebarBottom} style={{height:!isShowChienLuoc1 && !isShowChiSoKinhDoanh1 ? '100%' : isShowChienLuoc1 && !isShowChiSoKinhDoanh1 ? 'calc(100% - 220px)' : !isShowChienLuoc1 && isShowChiSoKinhDoanh1 ? 'calc(100% - 180px)' : ''}}>
						<SidebarDashboard />
					</div>
				)}
				<div className={css.settingsIcon} onClick={showModal}>
					<SettingOutlined />
				</div>
			</div>
			<div className={css.content}>
				<Outlet />
			</div>

			<SettingSidebar
				isOpen={isModalOpen}
				onClose={handleClose}
				onSettingsChange={handleSettingsChange}
			/>
		</div>
	);
};

export default CanvasDashboard;
