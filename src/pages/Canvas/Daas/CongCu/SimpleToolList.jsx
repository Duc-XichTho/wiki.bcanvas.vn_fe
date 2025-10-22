import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import css from './ListCongCu.module.css';
import { GroupSideBarCanvas, BackCanvas, ICON_CROSSROAD_LIST } from '../../../../icon/svg/IconSvg.jsx';
import { IconCloseFolder, IconOpenFolder } from '../../../../icon/IconSVG.js';
import { LIST_KHKD_CANVAS } from '../../../../Consts/LIST_KHKD_CANVAS.jsx';
import { SAB_KHKD } from '../../../../Consts/FOLDER_CANVAS.js';
import { getSettingByType, getSchemaTools } from '../../../../apis/settingService.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import ProfileSelect from '../../../Home/SelectComponent/ProfileSelect.jsx';

export default function SimpleToolList({
	setSelectedKey,
	selectedKey,
	selectedTap,
	setSelectedTap,
	setSelectedType,
	selectedType,
}) {
	const navigate = useNavigate();
	const location = useLocation();
	const { companySelect, buSelect, tabSelect, id } = useParams();
	const { currentUser } = useContext(MyContext);
	const [folderState, setFolderState] = useState({ [SAB_KHKD]: true });
	const [nameTable, setNameTable] = useState(null);
	const [tool, setTool] = useState(null);
	const [masterTool, setMasterTool] = useState(null);

	const handleToggleFolder = (folderName) => {
		setFolderState((prev) => ({
			...prev,
			[folderName]: !prev[folderName],
		}));
	};


	useEffect(() => {
		if (location.pathname == "/khkd") {
		  handleNavigateKHKD(1);
		}
	  }, [location?.pathname]); 

	const handleNavigateKHKD = (id) => {
		localStorage.setItem('typeSelectCanvas', 'CongCu');
		localStorage.setItem('tabSelectCanvas', SAB_KHKD);
		setSelectedType && setSelectedType('CongCu');
		setSelectedTap && setSelectedTap(SAB_KHKD);
		setSelectedKey && setSelectedKey(id);
		navigate(`/khkd/${id}`);
	};

	// Helper function to get icon source by ID
	const getIconSrcById = (tool) => {
		const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
		return found ? found.icon : undefined;
	};

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
			console.error('Error getting master apps for KHKD header:', error);
			return currentTool;
		}
	};

	// Load dashboard setting for header
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
				console.error('Error loading dashboard setting for KHKD:', error);
			}
		};

		getDashboardSetting();
	}, [location]);

	const checkSelected = (type, tap, key) => {
		return (
			selectedType == type &&
			selectedTap == tap &&
			selectedKey == key
		);
	};

	return (
		<div style={{ 
			display: 'flex', 
			justifyContent: 'space-between', 
			alignItems: 'center',
			padding: '12px 16px',
			borderBottom: '1px solid #eee',
			backgroundColor: '#fff'
		}}>
			{/* Left side: Back button, icon, name, and tool list */}
			<div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
				{/* Back button, icon and name */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div 
						style={{ 
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							padding: '4px',
							borderRadius: '4px'
						}}
						onClick={() => navigate('/dashboard')}
					>
						<BackCanvas height={20} width={20} />
					</div>
					{masterTool && (
						<>
							{masterTool.icon ? (
								(() => {
									const iconSrc = getIconSrcById(masterTool);
									return iconSrc ? (
										<img src={iconSrc} alt={masterTool.name} width={24} height={24} />
									) : (
										<span style={{ fontSize: '16px' }}>{masterTool.icon}</span>
									);
								})()
							) : (
								<span style={{ fontSize: '16px' }}>🛠️</span>
							)}
						</>
					)}
					<div style={{ fontWeight: 'bold', fontSize: '16px' }}>
						{masterTool ? masterTool.name : nameTable || 'KHKD Tools'}
					</div>
				</div>

				{/* Tool list */}
				<div style={{ display: 'flex', gap: '8px' }}>
					{LIST_KHKD_CANVAS.map(subItem => (
						<div
							key={subItem.key}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
								padding: '6px 12px',
								borderRadius: '6px',
								cursor: 'pointer',
								backgroundColor: checkSelected('CongCu', SAB_KHKD, subItem.key) ? '#e6f7ff' : 'transparent',
								border: checkSelected('CongCu', SAB_KHKD, subItem.key) ? '1px solid #1890ff' : '1px solid transparent',
								transition: 'all 0.2s'
							}}
							onClick={() => handleNavigateKHKD(subItem.key)}
						>
							{subItem.icon}
							<span style={{ fontSize: '14px', fontWeight: '500' }}>{subItem.label}</span>
						</div>
					))}
				</div>
			</div>

			{/* Right side: User info */}
			<div style={{ display: 'flex', alignItems: 'center' }}>
				<ProfileSelect />
			</div>
		</div>
	);
}


