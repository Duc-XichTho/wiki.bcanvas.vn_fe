import css from './CanvasMain.module.css';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import {
	Button,
	Checkbox,
	ConfigProvider,
	Dropdown,
	Flex,
	Input,
	Menu,
	message,
	Modal,
	Popconfirm,
	Radio,
	Select,
	Space,
	Spin,
	Switch,
	Tag,
	Typography,
	FloatButton,
} from 'antd';


import { DownOutlined } from '@ant-design/icons';
import {
	AIDataAnalyst,
	AIDataAnalystIcon, DocumentWikiBot,
	DocumentWikiBotIcon,
	SettingIcon,
	UserClass_Navbar,
	ICON_AI_CHAT_ICON_DARK
} from '../../icon/svg/IconSvg.jsx';
import { MyContext } from '../../MyContext.jsx';
// COMPONENT
import DataManagement from './DataManagement/DataManagement.jsx';
import BotManagement from './BotManagement/BotManagement.jsx';
import SettingColor from './SettingColor/SettingColor.jsx';
import SettingThemeColor from './SettingColor/SettingThemeColor';
import SettingPrompt from './SettingPrompt/SettingPrompt';
import ChatBot from './ChatBot/ChatBot.jsx';
import { getAllUserClass } from '../../apis/userClassService.jsx';
import { getCurrentUserLogin } from '../../apis/userService.jsx';
import ProfileSelect from '../Home/SelectComponent/ProfileSelect.jsx';
import CrossRoadPopup2 from '../../components/CrossRoadPopup/CrossRoadPopup2.jsx';
import DataCheckingTools from './CrossCheck/DataCheckingTools.jsx';
import CanvasFolder from './CanvasFolder/CanvasFolder.jsx';
import KPICalculator from './CanvasFolder/KPICalculator/KPICalculator.jsx';
import KPI2Calculator from './CanvasFolder/KPI2Calculator/KPI2Calculator.jsx';
import { getAllCrossCheck } from '../../apis/crossCheckService.jsx';
import { getDataFromSheet } from './CrossCheck/components/getDataFromSheet.js';
import { getAllTemplateSheetTable, getTemplateRow } from '../../apis/templateSettingService.jsx';
import { getAllKmf } from '../../apisKTQT/kmfService.jsx';
import { getAllKmns } from '../../apisKTQT/kmnsService.jsx';
import { getAllUnits } from '../../apisKTQT/unitService.jsx';
import { getAllProject } from '../../apisKTQT/projectService.jsx';
import { getAllProduct } from '../../apisKTQT/productService.jsx';
import { getAllKenh } from '../../apisKTQT/kenhService.jsx';
import { getAllVendor } from '../../apisKTQT/vendorService.jsx';
import HistoryResult from './CrossCheck/components/CrossCheck/HistoryResult/HistoryResult.jsx';
import { getAllFileNotePad } from '../../apis/fileNotePadService.jsx';
import { QRCodeSVG } from 'qrcode.react';
import { createSetting, getSettingByType, updateSetting } from '../../apis/settingService.jsx';
import OnboardingGuide from '../GuildeLine/OnboardingGuide.jsx';
import { RefreshCw, Settings, MessageSquare, FileText, Minimize2, X } from 'lucide-react';
import SettingSidebar from './Dashboard/SettingSidebar.jsx';
import AI from '../../pages/AI/AI.jsx';
import AiBuilderMoi from '../AI/AiBuilderMoi.jsx';
import ExternalAI from '../../pages/AI/External/ExternalAI.jsx';
import AIGen from '../../pages/AI/AIGen.jsx';
import IconButton from '@mui/material/IconButton';
import AIFreeChat from '../AI/AIFreeChat/AIFreeChat.jsx';
import { ICON_AI_CHAT, ICON_AI_CHAT_ICON, B_Logo_Icon } from '../../icon/svg/IconSvg.jsx';

const CanvasMain = () => {
	const {
		currentUser,
		listUC_CANVAS,
		setListUC_CANVAS,
		uCSelected_CANVAS,
		setUCSelected_CANVAS,
		botSetting,
		listCompany,
		setCurrenStepDuLieu,
		isLoggedIn,
	} = useContext(MyContext) || {};
	const navigate = useNavigate();
	const location = useLocation();
	const { companySelect, buSelect, id, siderId } = useParams();
	const [companySelectCanvas, setCompanySelectCanvas] = useState('HQ');
	const [buSelectCanvas, setBuSelectCanvas] = useState(null);
	const [tabSelectCanvas, setTabSelectCanvas] = useState(null);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isBotOpen, setIsBotOpen] = useState(false);
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [isCrossCheckOpen, setIsCrossCheckOpen] = useState(false);
	const [value, setValue] = useState(0);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isModalMappingDataOpen, setIsModalMappingDataOpen] = useState(false);
	const [isModalCheckErrorOpen, setIsModalCheckErrorOpen] = useState(false);
	const [isModalRSCrossCheckOpen, setIsModalRSCrossCheckOpen] = useState(false);
	const [isFolderOpen, setIsFolderOpen] = useState(false);
	const [isFolder2Open, setIsFolder2Open] = useState(false);
	const [loadingCount, setLoadingCount] = useState(false);
	const [dataCrossCheck, setDataCrossCheck] = useState(0);
	const [dataCheckValidate, setDataCheckValidate] = useState([]);
	const [isSettingColorOpen, setIsSettingColorOpen] = useState(false);
	const [isThemeColorModalOpen, setIsThemeColorModalOpen] = useState(false);
	const [isSettingPromptOpen, setIsSettingPromptOpen] = useState(false);
	const [isSettingSidebarOpen, setIsSettingSidebarOpen] = useState(false);
	const [isSettingMenuOpen, setIsSettingMenuOpen] = useState(false);
	const [menuVisibility, setMenuVisibility] = useState({
		version: 'full', // 'full' or 'compact'
		'du-lieu-nen': true,
		'home': true,
		'ke-hoach': true,
		'thuc-hien': true,
		'dashboard': true,
		id: null,
	});


	const [loadingCheckValidate, setLoadingCheckValidate] = useState(false);
	const [loadingCrossCheck, setLoadingCrossCheck] = useState(false);

	const [isQRModalVisible, setIsQRModalVisible] = useState(false);
	const [inputText, setInputText] = useState('');
	const [showQR, setShowQR] = useState(false);
	const [fills, setFills] = useState([]);

	const [isModalCheckDataOpen, setIsModalCheckDataOpen] = useState(false);

	const componentName = 'ALL';
	const [openSlideManager, setOpenSlideManager] = useState(false);
	const [openDialog, setOpenDialog] = useState(false);
	const [hideOnboarding, setHideOnboarding] = useState(() => {
		return localStorage.getItem('hideOnboardingGuide') === 'true';
	});

	const [isMobileMenu, setIsMobileMenu] = useState(window.innerWidth < 1400);

	const [usedTokens, setUsedTokens] = useState(0);

	const [isAICollapsed, setIsAICollapsed] = useState(true);
	const [isExternalAICollapsed, setIsExternalAICollapsed] = useState(true);
	const [isAIChatCollapsed, setIsAIChatCollapsed] = useState(true);
	const [isAIGenCollapsed, setIsAIGenCollapsed] = useState(true);
	const [isAiBuilderMoiCollapsed, setIsAiBuilderMoiCollapsed] = useState(true);
	const [aiQueueLength, setAIQueueLength] = useState(0);
	const [aiFreeChatQueueLength, setAIFreeChatQueueLength] = useState(0);
	const [externalAIQueueLength, setExternalAIQueueLength] = useState(0);
	const [aiGenQueueLength, setAIGenQueueLength] = useState(0);

	// Thêm state để theo dõi AI nào đã được kích hoạt
	const [activatedAIs, setActivatedAIs] = useState(() => {
		// Load trạng thái từ localStorage khi component mount
		const savedState = localStorage.getItem('activatedAIs');
		return savedState ? JSON.parse(savedState) : {
			'ai-builder-moi': false,
			'externalAI': false,
			'aiChat': false,
			'aiGen': false,
		};
	});

	useEffect(() => {
		const handleResize = () => {
			setIsMobileMenu(window.innerWidth < 1300);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		loadUsedTokens();
	}, []);

	const loadUsedTokens = async () => {
		try {
			const tokens = await getSettingByType('USED_TOKEN');
			if (tokens) {
				setUsedTokens(tokens.setting);
			}
		} catch (error) {
			console.error('Error loading used tokens:', error);
		}
	};

	const showModalCheckData = () => {
		setIsModalCheckDataOpen(true);
	};

	const handleCloseCheckDataModal = () => {
		setIsModalCheckDataOpen(false);
	};


	useEffect(() => {
		if (!hideOnboarding) {
			setOpenDialog(true);
		}
	}, [hideOnboarding]);

	const handleCheckboxChange = (event) => {
		setHideOnboarding(event.target.checked);
	};

	const handleCloseDialog = () => {
		if (hideOnboarding) {
			localStorage.setItem('hideOnboardingGuide', 'true');
		} else {
			localStorage.removeItem('hideOnboardingGuide');
		}
		setOpenDialog(false);
	};

	const danhMucValues = [
		{ value: 'KQKD', getApi: getAllKmf },
		{ value: 'KMTC', getApi: getAllKmns },
		{ value: 'DV', getApi: getAllUnits },
		{ value: 'VV', getApi: getAllProject },
		{ value: 'SP', getApi: getAllProduct },
		{ value: 'KENH', getApi: getAllKenh },
		{ value: 'KH', getApi: getAllVendor },
	];

	const dropdownRef = useRef(null);


	const showModal = () => {
		setIsModalOpen(true);
	};
	const handleOk = () => {
		setIsModalOpen(false);
	};
	const handleCancel = () => {
		setIsModalOpen(false);
	};

	useEffect(() => {
		const calculateValue = Math.round(
			(botSetting.setting.used / botSetting.setting.limit) * 100,
		);
		setValue(calculateValue);
	}, [botSetting]);
	useEffect(() => {
		const fetchColors = async () => {
			try {
				const data = await getSettingByType('SettingThemeColor');
				setFills([data.setting.themeColor]);
			} catch (error) {
				console.error('Error fetching colors:', error);
				setFills(['#454545']);
			}
		};

		fetchColors();
	}, []);

	const fetchUC = async () => {
		let uc = await getAllUserClass();
		let user = await getCurrentUserLogin();
		let ucPermission = [];
		if (user.data.isAdmin || user.data.isSuperAdmin ) {
			console.log(uc)
			setListUC_CANVAS(uc);
		} else {
			for (const e of uc) {
				if (
					e.userAccess &&
					user.data &&
					e.userAccess?.includes(user.data.email)
				) {
					ucPermission.push(e);
				}
			}
			console.log(ucPermission)
			setListUC_CANVAS(ucPermission);
		}
	};
	useEffect(() => {
		navigate(
			localStorage.getItem('prePath')
				? localStorage.getItem('prePathCanvas')
				: '/canvas/HQ',
		);
	}, []);

	useEffect(() => {
		fetchUC();
	}, [companySelectCanvas]);


	useEffect(() => {
		if (buSelect) {
			setUCSelected_CANVAS(buSelect);
		}
	}, [buSelect]);

	useEffect(() => {
		setCompanySelectCanvas(companySelect || 'HQ');
		setBuSelectCanvas(buSelect);
	}, [companySelect, buSelect]);

	const handleCompanySelectChange = useCallback(
		(value) => {
			setCompanySelectCanvas(value);
			setBuSelectCanvas(null);
			setTabSelectCanvas('');
			navigate(`/canvas/${value}/`);
		},
		[navigate],
	);

	async function getDataForSource(source) {
		if (!source) return null;

		if (source.type === 'Template') {
			return await getTemplateData(source.id);
		} else {
			const data = await getDanhMucData(source.bo_du_lieu);
			return data;
		}
	}

	async function getTemplateData(sourceId) {
		try {
			const templateSheets = await getAllTemplateSheetTable();
			const matchingSheet = templateSheets.find(sheet => sheet.fileNote_id === sourceId);

			if (matchingSheet) {
				const templateRowDataResponse = await getTemplateRow(matchingSheet.id);
				const templateRowData = templateRowDataResponse.rows || [];
				return templateRowData.map(item => item.data);
			} else {
				console.warn('Không tìm thấy sheet phù hợp với source ID:', sourceId);
				return null;
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu Template:', error);
			return null;
		}
	}

	async function getDanhMucData(boDuLieu) {
		try {
			if (!boDuLieu) {
				console.warn('Không có bộ dữ liệu để lấy');
				return null;
			}

			const danhMuc = danhMucValues.find(item => item.value === boDuLieu);

			if (!danhMuc) {
				console.warn('Bộ dữ liệu không hợp lệ:', boDuLieu);
				return null;
			}

			return await danhMuc.getApi();
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu DanhMuc:', error);
			return null;
		}
	}

	function markExistence(primaryData, checkingData, primaryColumn, checkingColumn) {
		const checkingValues = new Set(checkingData.map(item => item[checkingColumn]));
		return primaryData.map(item => ({
			...item,
			existsInChecking: checkingValues.has(item[primaryColumn]),
			// existsInChecking: checkingValues.has(item[primaryColumn]) ? "Có trong danh sách kiểm tra" : "Không có trong danh sách kiểm tra"
		}));
	}

	async function handleChay(selectedItem) {
		if (!selectedItem) return;

		const { primarySource, checkingSource } = selectedItem;

		if (!primarySource || !checkingSource) {
			console.warn('Thiếu dữ liệu primarySource hoặc checkingSource');
			return;
		}

		const primaryData = await getDataForSource(primarySource);
		const checkingData = await getDataForSource(checkingSource);
		if (!primaryData || !checkingData) {
			console.warn('Không có dữ liệu để so sánh');
			return;
		}

		const primaryColumn = primarySource.cot_du_lieu;
		const checkingColumn = checkingSource.cot_du_lieu;

		const uniqueCheckingValues = [...new Set(checkingData.map(item =>
			item[checkingColumn] ? item[checkingColumn].toString() : ''))];


		const result = markExistence(primaryData, checkingData, primaryColumn, checkingColumn);

		return {
			uniqueCheckingValues,
			result,
			selectedItem,
		};
	}

	const fetchDataCrossCheckAndValidate = async () => {
		try {
			let rs = [];
			const result = await getAllCrossCheck();
			const filteredDataCrossCheck = result.filter(item => item.type === 'CrossCheck');
			const filteredDataValidate = result.filter(item => item.type === 'Validate');
			let allFileNote = await getAllFileNotePad();
			let countCrossCheck = 0;
			let dataValivate = [];

			// Check CrossCheck items
			for (const selectedItem of filteredDataCrossCheck) {
				// Verify if FileNote still exists
				if (selectedItem.primarySource &&
					selectedItem.primarySource.id &&
					allFileNote.some(note => note.id === selectedItem.primarySource.id)) {
					const data = await getDataFromSheet(selectedItem, listCompany);
					data.name = selectedItem.name;
					rs.push(data);
				}
			}

			if (rs.length > 0) {
				for (const filteredDatum of rs) {
					if (filteredDatum.isOK == false) {
						countCrossCheck++;
					}
				}
			}

			setDataCrossCheck(countCrossCheck);
			setLoadingCrossCheck(false);

			// Check Validate items
			for (const filteredDataValidateElement of filteredDataValidate) {
				// Verify if FileNote still exists
				if (filteredDataValidateElement.primarySource &&
					filteredDataValidateElement.primarySource.id &&
					allFileNote.some(note => note.id === filteredDataValidateElement.primarySource.id)) {
					let countValidate = 0;
					let data = await handleChay(filteredDataValidateElement);
					if (data) {
						if (data.result.length > 0) {
							for (const resultElement of data.result) {
								if (!resultElement.existsInChecking) {
									countValidate++;
								}
							}
						}
					}

					if (countValidate > 0) {
						dataValivate.push({
							name: filteredDataValidateElement.name,
							count: countValidate,
							primarySource: filteredDataValidateElement.primarySource,
						});
					}
				}
			}

			setDataCheckValidate(dataValivate);
			setLoadingCheckValidate(false);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu:', error);
			setLoadingCrossCheck(false);
			setLoadingCheckValidate(false);
		}
	};

	useEffect(() => {
		if (isModalCheckErrorOpen) {
			setLoadingCheckValidate(true);
			setLoadingCrossCheck(true);
			fetchDataCrossCheckAndValidate();
		}
	}, [isModalCheckErrorOpen]);

	const ContentCheckError = () => {

		return (
			<div style={{ width: '100%', height: 'auto', padding: '5px 0' }}>
				<div style={{ width: '100%', padding: '5px 0' }}>

					<>
						<div style={{
							color: '#fff',
							backgroundColor: '#259c63',
							marginBottom: '10px',
							width: '100%',
							textAlign: 'center',
							padding: '5px 0',
						}}>
							<span style={{ fontWeight: 'bold' }}>Cross Check</span>
						</div>
						{loadingCrossCheck ?
							<div style={{
								width: '100%',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
							}}>
								<Spin />
							</div>
							: (
								<>
									{dataCrossCheck > 0 &&
										<div className={css.warning}
											 onClick={() => {
												 setIsModalRSCrossCheckOpen(true);
												 closeModalCheckErrorOpen();
											 }}
										>
											<div className={css.warning_title}>
												Lỗi cross check
											</div>
											<div className={css.warning_content}>
												Có {dataCrossCheck} lỗi
											</div>
										</div>
									}
								</>
							)}

					</>

				</div>
				<div style={{ width: '100%', padding: '5px 0' }}>

					<>
						<div style={{
							marginBottom: '10px',
							width: '100%',
							textAlign: 'center',
							color: '#fff',
							backgroundColor: '#259c63',
							padding: '5px 0',
						}}>
							<span style={{ fontWeight: 'bold' }}>Validate Check</span>
						</div>
						{loadingCheckValidate ?
							<div style={{
								width: '100%',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
							}}>
								<Spin />
							</div>
							: <>
								{dataCheckValidate.length > 0 &&
									dataCheckValidate.map((item, index) => (
										<div key={item.name}
											 className={css.warning}
											 onClick={() => {
												 navigate(`/canvas/${companySelectCanvas}/${buSelect}/thuc-hien/du-lieu-tong-hop/${item.primarySource.id}`);
												 closeModalCheckErrorOpen();
											 }}
										>
											<div className={css.warning_title}>
												Lỗi validate: {item.name}
											</div>
											<div className={css.warning_content}>
												Có {item.count} lỗi
											</div>
										</div>
									))}
							</>}


					</>

				</div>

			</div>
		);
	};

	const handleBuSelectChange = async (value) => {
		setUCSelected_CANVAS(value);
		setTabSelectCanvas('thuc-hien');
		setCurrenStepDuLieu(1);
		const path = `/canvas/${companySelectCanvas}/${value}/thuc-hien`;
		navigate(path);
	};

	const handleBuSelectChange2 = async (value) => {
		setCurrenStepDuLieu(0);
		setTabSelectCanvas('');
		setUCSelected_CANVAS(value);
		const path = `/canvas/${companySelectCanvas}/${value}`;
		navigate(path);
	};

	const [selectedKeyAI, setSelectedKeyAI] = useState('');
	const handleTabClick = useCallback((e) => {
		const { domEvent } = e;
		const selectedText = domEvent.target.innerText;
		const tabKey = e.key;
		if (tabKey == 'cong-cu') {
			// setTabSelectCanvas('cong-cu');
			return;
		}
		if (tabKey === 'ai' || tabKey === 'ai-builder-moi') {
			return;
		}
		setSelectedKeyAI('');
		setTabSelectCanvas(tabKey);

		const savedStepDuLieu = JSON.parse(localStorage.getItem('stepSelectDuLieu'));
		const savedStepKeHoach = JSON.parse(localStorage.getItem('stepSelectKeHoach'));
		const savedStepThucHien = JSON.parse(localStorage.getItem('stepSelectThucHien'));
		const savedStepSelectHome = JSON.parse(localStorage.getItem('stepSelectHome'));
		const basePath = `/canvas/${companySelectCanvas}/${buSelectCanvas}`;
		if (tabKey === 'thuc-hien' && savedStepDuLieu?.path) {
			navigate(`${basePath}/thuc-hien/${savedStepDuLieu?.path}`);
			return;
		} else if (tabKey === 'ke-hoach' && savedStepKeHoach?.path) {
			navigate(`${basePath}/ke-hoach/${savedStepKeHoach?.path}`);
			return;
		} else if (tabKey === 'du-lieu-nen') {
			navigate(`${basePath}/du-lieu-nen`);
			return;
		} else if (tabKey === 'home' && savedStepSelectHome) {
			navigate(`${basePath}/home/${savedStepSelectHome?.path}`);
			return;
		} else if (tabKey === 'analyst') {
			setSelectedKeyAI('analyst');
			// navigate(`${basePath}/ai`);
			return;
		} else if (tabKey === 'document-bot') {
			setSelectedKeyAI('document-bot');
			// navigate(`${basePath}/ai-external`);
			return;
		} else if (tabKey === 'free-ai') {
			setSelectedKeyAI('free-ai');
			return;
		} else if (tabKey === 'ai-gen') {
			setSelectedKeyAI('ai-gen');
			return;
		}
		else if (tabKey === 'ai-builder-moi') {
			setSelectedKeyAI('ai-builder-moi');
			return;
		}
		else {
			navigate(`${basePath}/${tabKey}`);
		}
	}, [navigate, companySelectCanvas, buSelectCanvas, tabSelectCanvas]);

	const menu = (
		<Menu onClick={handleTabClick} selectedKeys={[selectedKeyAI]}>
			<Menu.Item
				key='analyst'
				icon={<span style={{ marginRight: 8, marginTop: 5 }}><AIDataAnalystIcon /></span>}
				onClick={() => {
					setIsExternalAICollapsed(true);
					setIsAICollapsed(false);
					setIsAIChatCollapsed(true);
					setIsAIGenCollapsed(true);
					setIsAiBuilderMoiCollapsed(true);
					setSelectedKeyAI('analyst');
				}}
			>
				AI Report Builder
			</Menu.Item>
			<Menu.Item
				key='ai-builder-moi'
				icon={<span style={{ marginRight: 8, marginTop: 5 }}><AIDataAnalystIcon /></span>}
				onClick={() => {
					setIsExternalAICollapsed(true);
					setIsAICollapsed(true);
					setIsAIChatCollapsed(true);
					setIsAIGenCollapsed(true);
					setIsAiBuilderMoiCollapsed(false);
					setSelectedKeyAI('ai-builder-moi');
				}}
			>
				AI Report Builder
			</Menu.Item>
			<Menu.Item
				key='document-bot'
				icon={<span style={{ marginRight: 8, marginTop: 5 }}><DocumentWikiBotIcon /></span>}
				onClick={() => {
					setIsExternalAICollapsed(false);
					setIsAICollapsed(true);
					setIsAIChatCollapsed(true);
					setIsAIGenCollapsed(true);
					setIsAiBuilderMoiCollapsed(true);
					setSelectedKeyAI('document-bot');
				}}
			>
				Document & Wiki Bot
			</Menu.Item>
			<Menu.Item
				key='free-ai'
				icon={<span style={{ marginRight: 8, marginTop: 5, color: 'black' }}><ICON_AI_CHAT width={15} height={15} color='#686868' /></span>}
				onClick={() => {
					setIsExternalAICollapsed(true);
					setIsAICollapsed(true);
					setIsAIChatCollapsed(false);
					setIsAIGenCollapsed(true);
					setIsAiBuilderMoiCollapsed(true);
					setSelectedKeyAI('free-ai');
				}}
			>
				AI Creator
			</Menu.Item>
			{/*<Menu.Item*/}
			{/*	key='ai-gen'*/}
			{/*	icon={<span style={{ marginRight: 8, marginTop: 5, color: 'black' }}><ICON_AI_CHAT width={15} height={15} color='#686868' /></span>}*/}
			{/*	onClick={() => {*/}
			{/*		setIsExternalAICollapsed(true);*/}
			{/*		setIsAICollapsed(true);*/}
			{/*		setIsAIChatCollapsed(true);*/}
			{/*		setIsAIGenCollapsed(false);*/}
			{/*		setSelectedKeyAI('ai-gen');*/}
			{/*	}}*/}
			{/*>*/}
			{/*	AI Generator*/}
			{/*</Menu.Item>*/}
		</Menu>
	);


	const itemsMenu = useMemo(() => {
		// If pathname includes 'ke-toan-quan-tri' or 'cong-cu/project-manager', return empty array
		if (
			location.pathname.includes('ke-toan-quan-tri') ||
			location.pathname.includes('cong-cu/project-manager')
		) {
			return [];
		}

		const selectedColor = fills[0] || '#2E424E';
		const defaultColor = '#555555';

		const items = [
			{
				key: 'home',
				label: (
					<>
						<div
							className={css.canvasTab}
							style={{
								fontWeight: 'bold',
								color: tabSelectCanvas === 'home' ? selectedColor : defaultColor,
								paddingTop: 1,
								backgroundColor: 'rgba(0,0,0,0)',
							}}
						>
							<div className={css.tabContainer}>
								<span className={css.tabLabel}>HDSD</span>
								{tabSelectCanvas === 'home' && !isMobileMenu && <div className={css.tabUnderline} style={{backgroundColor: selectedColor}} />}
							</div>
						</div>
					</>
				),
			},
			{
				key: 'du-lieu-nen',
				label: (
					<>
						<div
							className={css.canvasTab}
							style={{
								fontWeight: 'bold',
								color: tabSelectCanvas === 'du-lieu-nen' ? selectedColor : defaultColor,
								paddingTop: 1,
								backgroundColor: 'rgba(0,0,0,0)',
							}}
						>
							<div className={css.tabContainer}>
								<span className={css.tabLabel}>Danh mục</span>
								{tabSelectCanvas === 'du-lieu-nen' && !isMobileMenu && <div className={css.tabUnderline} style={{backgroundColor: selectedColor}} />}
							</div>
						</div>
					</>
				),
			},
			{
				key: 'ke-hoach',
				label: (
					<>
						<div
							className={css.canvasTab}
							style={{
								fontWeight: 'bold',
								color: tabSelectCanvas === 'ke-hoach' ? selectedColor : defaultColor,
								paddingTop: 1,
								backgroundColor: 'rgba(0,0,0,0)',
							}}
						>
							<div className={css.tabContainer}>
								<span className={css.tabLabel}>Kế hoạch kinh doanh</span>
								{tabSelectCanvas === 'ke-hoach' && !isMobileMenu && <div className={css.tabUnderline} style={{backgroundColor: selectedColor}} />}
							</div>
						</div>
					</>
				),
			},
			{
				key: 'thuc-hien',
				label: (
					<>
						<div
							className={css.canvasTab}
							style={{
								fontWeight: 'bold',
								color: tabSelectCanvas === 'thuc-hien' ? selectedColor : defaultColor,
								paddingTop: 1,
								backgroundColor: 'rgba(0,0,0,0)',
							}}
						>
							<div className={css.tabContainer}>
								<span className={css.tabLabel}>Dữ liệu</span>
								{tabSelectCanvas === 'thuc-hien' && !isMobileMenu && <div className={css.tabUnderline} style={{backgroundColor: selectedColor}} />}
							</div>
						</div>
					</>
				),
			},
			{
				key: 'dashboard',
				label: (
					<div
						className={css.canvasTab}
						style={{
							fontWeight: 'bold',
							color: tabSelectCanvas === 'dashboard' ? selectedColor : defaultColor,
							paddingTop: 1,
							backgroundColor: 'rgba(0,0,0,0)',
						}}
					>
						<div className={css.tabContainer}>
							<span className={css.tabLabel}>Dashboard</span>
							{tabSelectCanvas === 'dashboard' && !isMobileMenu && <div className={css.tabUnderline} style={{backgroundColor: selectedColor}} />}
						</div>
					</div>
				),
			},
			{
				key: 'ai',
				label: (
					<div
						className={css.canvasTab}
						style={{
							fontWeight: 'bold',
							color: tabSelectCanvas === 'ai' ? selectedColor : defaultColor,
							paddingTop: 1,
							backgroundColor: 'rgba(0,0,0,0)',
							cursor: 'pointer',
						}}
						onClick={() => {
							navigate(`/canvas/${companySelectCanvas}/${buSelectCanvas}/ai-center`);
							setTabSelectCanvas('ai');
						}}
					>
						<div className={css.tabContainer}>
							<span className={css.tabLabel}>AI Center</span>
							{tabSelectCanvas === 'ai' && !isMobileMenu && <div className={css.tabUnderline} style={{backgroundColor: selectedColor}} />}
						</div>
					</div>
				),
			},
		];

		// If version is compact, only show enabled items from compact settings
		if (menuVisibility.version === 'compact') {
			return items.filter(item => menuVisibility[item.key]);
		}
		// For full version, show all enabled items
		return items.filter(item => menuVisibility[item.key]);
	}, [tabSelectCanvas, isMobileMenu, menuVisibility, location.pathname, fills]);

	const itemsMenuMobile = useMemo(() => {
		return itemsMenu;
	}, [itemsMenu, companySelect, buSelect, navigate, isMobileMenu]);

	const itemsCongCu = [
		{
			key: 'ke-toan-quan-tri',
			label: <span style={{ color: 'white', fontSize: 16 }}>Công cụ phân bố & hợp nhất BCTC</span>,
			onClick: () => {
				navigate(`/canvas/${companySelect}/${buSelect}/ke-toan-quan-tri`);
			},
		},
		{
			key: 'project-manager',
			label: <span style={{ color: 'white', fontSize: 16 }}>Quản lý To-do</span>,
			onClick: () => {
				navigate(`/canvas/${companySelect}/${buSelect}/cong-cu/project-manager`);
			},
		},
	];

	const handleMobileMenuClick = (e) => {
		let item = itemsMenuMobile.find(i => i.key === e.key);
		if (item) {
			handleTabClick(e);
		} else {
			item = itemsCongCu.find(i => i.key === e.key);
			item.onClick();
		}
	};

	const handleSettingsClick = () => setIsSettingsOpen(true);
	const handleCloseSettings = () => setIsSettingsOpen(false);
	const handleBotClick = () => setIsBotOpen(true);
	const handleCloseBot = () => setIsBotOpen(false);
	const handleChatClick = () => setIsChatOpen(true);
	const handleCloseChat = () => setIsChatOpen(false);
	const handleFolderClick = () => setIsFolderOpen(true);
	const handleFolder2Click = () => setIsFolder2Open(true);
	const handleCloseFolder = () => setIsFolderOpen(false);
	const handleCloseFolder2 = () => setIsFolder2Open(false);
	const handleSettingColor = () => setIsSettingColorOpen(true);
	const handleCloseSettingColor = () => setIsSettingColorOpen(false);
	const [isPromptModalVisible, setIsPromptModalVisible] = useState(false);
	const [promptValue, setPromptValue] = useState('');


	const handleMenuClick = (e) => {
		if (e.key === '1') {
			handleFolderClick();
		} else if (e.key === '2') {
			handleFolder2Click();
		}
	};

	const handleMenuClick2 = (e) => {
		if (e.key === '1') {
			handleBotClick();
		} else if (e.key === '2') {
			handleSettingsClick();
		} else if (e.key === '4') {
			handleSettingColor();
		} else if (e.key === '5') {
			handleOpenSettingPrompt();
		} else if (e.key === '6') {
			setIsQRModalVisible(true);
		} else if (e.key === '7') {
			handleOpenThemeColorModal();
		} else if (e.key === '8') {
			navigate(`/canvas/${companySelect}/${buSelect}/n8n`);
		} else if (e.key === '9') {
			handleOpenSettingSidebar();
		} else if (e.key === '10') {
			handleOpenSettingMenu();
		} else if (e.key === '11') {
			// Handle the new menu item
		}
	};

	const handleOpenSettingPrompt = () => {
		setIsSettingPromptOpen(true);
	};

	const handleCloseSettingPrompt = () => {
		setIsSettingPromptOpen(false);
	};
	const handleOpenThemeColorModal = () => {
		setIsThemeColorModalOpen(true);
	};

	const handleCloseThemeColorModal = () => {
		setIsThemeColorModalOpen(false);
	};

	const handleOpenSettingSidebar = () => {
		setIsSettingSidebarOpen(true);
	};

	const handleCloseSettingSidebar = () => {
		setIsSettingSidebarOpen(false);
	};

	const handleOpenSettingMenu = () => {
		setIsSettingMenuOpen(true);
	};

	const handleCloseSettingMenu = () => {
		setIsSettingMenuOpen(false);
	};

	const handleSaveMenuSettings = async () => {
		try {
			const fullSettings = {
				type: 'MenuSettings',
				name: 'full',
				setting: {
					version: 'full',
					data: {
						'du-lieu-nen': menuVisibility['du-lieu-nen'],
						'home': menuVisibility['home'],
						'ke-hoach': menuVisibility['ke-hoach'],
						'thuc-hien': menuVisibility['thuc-hien'],
						'dashboard': menuVisibility['dashboard'],
						'ai': menuVisibility['ai'],
					},
				},
			};

			const compactSettings = {
				type: 'MenuSettings',
				name: 'compact',
				setting: {
					version: 'compact',
					data: {
						'thuc-hien': menuVisibility['thuc-hien'],
						'ai': menuVisibility['ai'],
						'dashboard': menuVisibility['dashboard'],
					},
				},
			};

			if (menuVisibility.id) {
				// Update existing settings
				if (menuVisibility.version === 'full') {
					await updateSetting({
						id: menuVisibility.id,
						...fullSettings,
					});
				} else {
					await updateSetting({
						id: menuVisibility.id,
						...compactSettings,
					});
				}
			} else {
				// Create new settings if none exist
				const defaultFullSettings = {
					version: 'full',
					data: {
						'du-lieu-nen': true,
						'home': true,
						'ke-hoach': true,
						'thuc-hien': true,
						'dashboard': true,
						'ai': true,
					},
				};

				const defaultCompactSettings = {
					version: 'compact',
					data: {
						'thuc-hien': true,
						'ai': true,
					},
				};

				// Create both settings
				const [fullSetting, compactSetting] = await Promise.all([
					createSetting({
						type: 'MenuSettings',
						name: 'full',
						setting: defaultFullSettings,
					}),
					createSetting({
						type: 'MenuSettings',
						name: 'compact',
						setting: defaultCompactSettings,
					}),
				]);

				setMenuVisibility(prev => ({
					...prev,
					id: menuVisibility.version === 'full' ? fullSetting.id : compactSetting.id,
				}));
			}
			message.success('Cài đặt menu đã được lưu');
			handleCloseSettingMenu();
			window.location.reload();
		} catch (error) {
			console.error('Error saving menu settings:', error);
			message.error('Không thể lưu cài đặt menu');
		}
	};

	const handleVersionChange = (version) => {
		if (version === 'compact') {
			setMenuVisibility(prev => ({
				...prev,
				version: 'compact',
				// Keep existing values for thuc-hien, ai, and dashboard
				'thuc-hien': true,
				'ai': true,
				'dashboard': true,
			}));
		} else {
			// When switching to full version, ensure all items are visible
			setMenuVisibility(prev => ({
				...prev,
				version: 'full',
				'du-lieu-nen': true,
				'home': true,
				'ke-hoach': true,
				'thuc-hien': true,
				'dashboard': true,
				'ai': true,
			}));
		}
	};

	const menuSetting = (
		<Menu onClick={handleMenuClick2}>
			{/*<Menu.Item key='3'>*/}
			{/*		<span*/}
			{/*			onClick={showModalCheckData}*/}
			{/*		>*/}
			{/*			Kiểm tra dữ liệu*/}
			{/*		</span>*/}
			{/*</Menu.Item>*/}
			<Menu.Item key='4'>Chọn palette màu</Menu.Item>
			<Menu.Item key='7'>Chọn theme màu</Menu.Item>
			<Menu.Item key='5'>Cấu hình Prompt mặc định</Menu.Item>
			<Menu.Item key='6'>Tạo mã QR</Menu.Item>
			<Menu.Item key='8'>N8N</Menu.Item>
			<Menu.Item key='9'>Cấu hình Panel Dashboard</Menu.Item>
			<Menu.Item key='10'>Cấu hình TopBar</Menu.Item>
			{/*<Menu.Item key='11' style={{ color: '#666' }}>*/}

			{/*</Menu.Item>*/}
		</Menu>
	);

	const handleDownloadQR = () => {
		const svg = document.getElementById('qr-code');
		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const img = new Image();
		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0);
			const pngFile = canvas.toDataURL('image/png');
			const downloadLink = document.createElement('a');
			downloadLink.download = 'QRCode';
			downloadLink.href = pngFile;
			downloadLink.click();
		};
		img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
	};
	useEffect(() => {
		if (location.pathname.includes('/thuc-hien')) {
			setTabSelectCanvas('thuc-hien');
		} else if (location.pathname.includes('/dashboard')) {
			setTabSelectCanvas('dashboard');
		} else if (location.pathname.includes('/ke-hoach')) {
			setTabSelectCanvas('ke-hoach');
		} else if (location.pathname.includes('/du-lieu-nen')) {
			setTabSelectCanvas('du-lieu-nen');
		} else if (location.pathname.includes('/home')) {
			setTabSelectCanvas('home');
		} else if (location.pathname.includes('/ai')) {
			setTabSelectCanvas('ai');
		}
	}, [location.pathname]);

	useEffect(() => {
		const fetchMenuSettings = async () => {
			try {
				const [fullData, compactData] = await Promise.all([
					getSettingByType('MenuSettings', 'full'),
					getSettingByType('MenuSettings', 'compact'),
				]);

				if (fullData && compactData) {
					// Both settings exist
					const currentVersion = localStorage.getItem('menuVersion') || 'full';
					const currentSettings = currentVersion === 'full' ? fullData : compactData;

					setMenuVisibility({
						version: currentSettings.setting.version,
						...currentSettings.setting.data,
						id: currentSettings.id,
					});
				} else {
					// Create default settings if they don't exist
					const defaultFullSettings = {
						version: 'full',
						data: {
							'du-lieu-nen': true,
							'home': true,
							'ke-hoach': true,
							'thuc-hien': true,
							'dashboard': true,
							'ai': true,
						},
					};

					const defaultCompactSettings = {
						version: 'compact',
						data: {
							'thuc-hien': true,
							'ai': true,
							'dashboard': true,
						},
					};

					const [fullSetting, compactSetting] = await Promise.all([
						createSetting({
							type: 'MenuSettings',
							name: 'full',
							setting: defaultFullSettings,
						}),
						createSetting({
							type: 'MenuSettings',
							name: 'compact',
							setting: defaultCompactSettings,
						}),
					]);

					const currentVersion = localStorage.getItem('menuVersion') || 'full';
					const currentSettings = currentVersion === 'full' ? fullSetting : compactSetting;

					setMenuVisibility({
						version: currentSettings.setting.version,
						...currentSettings.setting.data,
						id: currentSettings.id,
					});
				}
			} catch (error) {
				console.error('Error loading menu settings:', error);
				// Set default settings in case of error
				setMenuVisibility({
					version: 'full',
					'du-lieu-nen': true,
					'home': true,
					'ke-hoach': true,
					'thuc-hien': true,
					'dashboard': true,
					'ai': true,
				});
			}
		};
		fetchMenuSettings();
	}, []);

	useEffect(() => {
		const handleToggleAI = (event) => {
			const { type } = event.detail;
			switch (type) {
				case 'ai-builder-moi':
					// Kích hoạt AI Builder Moi
					setActivatedAIs(prev => {
						const newState = { ...prev, 'ai-builder-moi': true };
						localStorage.setItem('activatedAIs', JSON.stringify(newState));
						return newState;
					});
					if (selectedKeyAI === 'ai-builder-moi') {
						setIsAiBuilderMoiCollapsed(true);
						setSelectedKeyAI('');
					} else {
						setIsAICollapsed(true);
						setIsExternalAICollapsed(true);
						setIsAIChatCollapsed(true);
						setIsAIGenCollapsed(true);
						setIsAiBuilderMoiCollapsed(false);
						setSelectedKeyAI('ai-builder-moi');
					}
					break;
				case 'dataAnalyst':
					// Kích hoạt AI Report Builder
					setActivatedAIs(prev => {
						const newState = { ...prev, 'ai-builder-moi': true };
						localStorage.setItem('activatedAIs', JSON.stringify(newState));
						return newState;
					});
					if (selectedKeyAI === 'dataAnalyst') {
						setIsAICollapsed(true);
						setIsExternalAICollapsed(true);
						setIsAIChatCollapsed(true);
						setIsAIGenCollapsed(true);
						setIsAiBuilderMoiCollapsed(true);
						setSelectedKeyAI('dataAnalyst');
					} else {
						setIsAICollapsed(false);
						setIsExternalAICollapsed(true);
						setIsAIChatCollapsed(true);
						setIsAIGenCollapsed(true);
						setSelectedKeyAI('dataAnalyst');
					}
					break;
				case 'externalAI':
					// Kích hoạt Document & Wiki Bot
					setActivatedAIs(prev => {
						const newState = { ...prev, 'externalAI': true };
						localStorage.setItem('activatedAIs', JSON.stringify(newState));
						return newState;
					});
					if (selectedKeyAI === 'externalAI') {
						setIsExternalAICollapsed(true);
						setSelectedKeyAI('');
					} else {
						setIsAICollapsed(true);
						setIsExternalAICollapsed(false);
						setIsAIChatCollapsed(true);
						setIsAIGenCollapsed(true);
						setSelectedKeyAI('externalAI');
					}
					break;
				case 'aiChat':
					// Kích hoạt AI Creator
					setActivatedAIs(prev => {
						const newState = { ...prev, 'aiChat': true };
						localStorage.setItem('activatedAIs', JSON.stringify(newState));
						return newState;
					});
					if (selectedKeyAI === 'aiChat') {
						setIsAIChatCollapsed(true);
						setSelectedKeyAI('');
					} else {
						setIsAICollapsed(true);
						setIsExternalAICollapsed(true);
						setIsAIChatCollapsed(false);
						setIsAIGenCollapsed(true);
						setSelectedKeyAI('aiChat');
					}
					break;
				case 'aiGen':
					// Kích hoạt AI Generator
					setActivatedAIs(prev => {
						const newState = { ...prev, 'aiGen': true };
						localStorage.setItem('activatedAIs', JSON.stringify(newState));
						return newState;
					});
					if (selectedKeyAI === 'aiGen') {
						setIsAIGenCollapsed(true);
						setSelectedKeyAI('');
					} else {
						setIsAICollapsed(true);
						setIsExternalAICollapsed(true);
						setIsAIChatCollapsed(true);
						setIsAIGenCollapsed(false);
						setSelectedKeyAI('aiGen');
					}
					break;
				default:
					break;
			}
		};

		window.addEventListener('toggleAI', handleToggleAI);
		return () => {
			window.removeEventListener('toggleAI', handleToggleAI);
		};
	}, [selectedKeyAI]);

	return (
		<>
			<div className={css.main}>
				<div className={css.container}>
					<div
						className={css.header}
						style={{
							backgroundColor: '#FFFFFF'
						}}>
						<div className={css.headerLeft}>
							<Space size='large' css={{ gap: '5px !important' }}>
								<Space
									style={{
										cursor: 'pointer',
										marginBottom: '1px',
										marginRight: '-1px',
									}}
								>
									<div className={css.nameApp} onClick={showModal}>
										<img src="/logo.svg" alt="Logo"/>
									</div>
								</Space>
								<Flex justify='center' align='center'>
								<span style={{ color: '#555555', fontSize: 15, marginLeft: 20, fontWeight: 'bold', marginBottom: '-4px' }}>Xin chào</span>
									<ConfigProvider
										theme={{
											components: {
												Select: {
													optionSelectedBg: '#e6e6e6', // Background color of the selected option
													optionSelectedColor: '#1b67b0', // Text color of the selected option
												},
											},
										}}
									>
										<Select
											value={uCSelected_CANVAS}
											style={{ width: 'max-content', marginLeft: 5, backgroundColor: '#e6f4ff', marginBottom: '-4px', border: '1px solid #bde3fd', borderRadius: '10px', padding: '2px 2px' }}
											dropdownStyle={{ backgroundColor: '#ffffff' }}
											variant='borderless'
											onChange={handleBuSelectChange2}
											options={listUC_CANVAS.map((e) => ({
												value: e?.id,
												label: (
													<span
														style={{ color: '#1b67b0', fontSize: '17px' }}>{e?.name}</span>
												),
											}))}
											suffixIcon={null}
										/>
									</ConfigProvider>
								</Flex>
							</Space>
							<ConfigProvider
								theme={{
									components: {
										Menu: {
											horizontalItemSelectedColor: '#ffffff', // Cho menu ngang
											colorBgElevated: '#000000', // Đổi nền popup dropdown sang đen
											colorItemBg: '#000000', // Nền các item
											colorItemText: '#FFFFFF', // Màu chữ
											colorItemTextHover: '#1890ff', // Hover chữ
											colorItemBgSelected: '#1a1a1a', // Nền của item đang được chọn
											colorItemTextSelected: '#ffffff', // Màu chữ khi chọn
										},
									},
								}}
							>
								{isMobileMenu ? (
									<ConfigProvider
										theme={{
											components: {
												Menu: {
													itemSelectedBg: 'rgba(0, 0, 0, 0)',
													itemSelectedColor: '#fff',
												},
											},
										}}
									>
										<Menu
											className={css.customHorizontal}
											onClick={handleTabClick}
											selectedKeys={tabSelectCanvas}
											mode='horizontal'
											items={itemsMenu}
											style={{
												flex: 1,
												backgroundColor: '#ffffff',
												display: 'inline-flex',
												marginLeft: 20,
												gap: 5,
											}}
										/>
									</ConfigProvider>
								) : (
									<Menu
										className={css.customHorizontal}
										onClick={handleTabClick}
										selectedKeys={tabSelectCanvas}
										mode='horizontal'
										items={itemsMenu}
										style={{
											flex: 1,
											backgroundColor: '#ffffff',
											display: 'inline-flex',
											marginLeft: 20,
											gap: 5,
										}}
									/>
								)}
							</ConfigProvider>

						</div>
						<div className={css.headerRight}>
								<span onClick={(e) => {
									e.stopPropagation();
									loadUsedTokens();
								}} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#555555' }}>
								AI Meter: {Math.round(usedTokens / 10000)} jobs
								<RefreshCw size={14} />
							</span>
							<Dropdown overlay={menuSetting} trigger={['click']}>
								<Button type={'text'}>
									<SettingIcon width={18} height={20} />
								</Button>
							</Dropdown>
							<ProfileSelect />
						</div>
					</div>
					<div className={css.headerLine}></div>
					<div className={css.content}>
						<Outlet />
					</div>
				</div>
				<DataCheckingTools
					isOpen={isCrossCheckOpen}
					setIsOpen={setIsCrossCheckOpen}
				/>
				<Modal
					title='Kiểm định dữ liệu & Automation Tools'
					centered
					open={isModalRSCrossCheckOpen}
					onCancel={() => setIsModalRSCrossCheckOpen(false)}
					width={1500}
					footer={null}
					maskClosable={false}
					styles={{
						body: {
							padding: 0,
							margin: 0,
							height: '800px',
							overflow: 'auto',
						},
					}}
				>
					<HistoryResult />
				</Modal>

				<DataManagement isOpen={isSettingsOpen} onClose={handleCloseSettings} />
				<BotManagement isOpen={isBotOpen} onClose={handleCloseBot} />
				<ChatBot isOpen={isChatOpen} onClose={handleCloseChat} />
				<SettingColor isOpen={isSettingColorOpen} onClose={handleCloseSettingColor} />
				<SettingThemeColor
					isOpen={isThemeColorModalOpen}
					onClose={handleCloseThemeColorModal}
				/>
				<SettingPrompt
					isOpen={isSettingPromptOpen}
					onClose={handleCloseSettingPrompt}
				/>
				<SettingSidebar
					isOpen={isSettingSidebarOpen}
					onClose={handleCloseSettingSidebar}
					onSettingsChange={(newSettings) => {
						// Handle settings change if needed
					}}
				/>
				<Modal
					title='Cấu hình Menu'
					open={isSettingMenuOpen}
					onCancel={handleCloseSettingMenu}
					footer={[
						<Button key='cancel' onClick={handleCloseSettingMenu}>
							Hủy
						</Button>,
						<Button key='save' type='primary' onClick={handleSaveMenuSettings}>
							Lưu
						</Button>,
					]}
					width={800}
					bodyStyle={{ padding: '24px' }}
				>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* <div style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '12px 16px',
							borderRadius: '4px',
							marginBottom: '16px',
						}}>
							<span style={{ fontSize: '16px', fontWeight: 500 }}>Phiên bản</span>
							<Radio.Group
								value={menuVisibility.version}
								onChange={(e) => handleVersionChange(e.target.value)}
							>
								<Radio.Button value='full'>Đầy đủ</Radio.Button>
								<Radio.Button value='compact'>Thu gọn</Radio.Button>
							</Radio.Group>
						</div> */}

						{menuVisibility.version === 'full' && (
							<>
								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '12px 16px',
									borderRadius: '4px',
								}}>
									<span style={{ fontSize: '16px', fontWeight: 500 }}>HDSD</span>
									<Switch
										checked={menuVisibility['home']}
										onChange={(checked) => {
											setMenuVisibility(prev => ({ ...prev, 'home': checked }));
										}}
									/>
								</div>
								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '12px 16px',
									borderRadius: '4px',
								}}>
									<span style={{ fontSize: '16px', fontWeight: 500 }}>Danh mục</span>
									<Switch
										checked={menuVisibility['du-lieu-nen']}
										onChange={(checked) => {
											setMenuVisibility(prev => ({ ...prev, 'du-lieu-nen': checked }));
										}}
									/>
								</div>
								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '12px 16px',
									borderRadius: '4px',
								}}>
									<span style={{ fontSize: '16px', fontWeight: 500 }}>Kế hoạch kinh doanh</span>
									<Switch
										checked={menuVisibility['ke-hoach']}
										onChange={(checked) => {
											setMenuVisibility(prev => ({ ...prev, 'ke-hoach': checked }));
										}}
									/>
								</div>
							</>
						)}

						<div style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '12px 16px',
							borderRadius: '4px',
						}}>
							<span style={{ fontSize: '16px', fontWeight: 500 }}>Dữ liệu</span>
							<Switch
								checked={menuVisibility['thuc-hien']}
								onChange={(checked) => {
									setMenuVisibility(prev => ({ ...prev, 'thuc-hien': checked }));
								}}
							/>
						</div>
						<div style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '12px 16px',
							borderRadius: '4px',
						}}>
							<span style={{ fontSize: '16px', fontWeight: 500 }}>Dashboard</span>
							<Switch
								checked={menuVisibility['dashboard']}
								onChange={(checked) => {
									setMenuVisibility(prev => ({ ...prev, 'dashboard': checked }));
								}}
							/>
						</div>
						<div style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '12px 16px',
							borderRadius: '4px',
						}}>
							<span style={{ fontSize: '16px', fontWeight: 500 }}>AI CENTER</span>
							<Switch
								checked={menuVisibility['ai']}
								onChange={(checked) => {
									setMenuVisibility(prev => ({ ...prev, 'ai': checked }));
								}}
							/>
						</div>
					</div>
				</Modal>
				<CanvasFolder
					isOpen={isFolderOpen}
					onClose={handleCloseFolder}
					children={<KPICalculator />}
					name={'Biến số'}
				/>
				<CanvasFolder
					isOpen={isFolder2Open}
					onClose={handleCloseFolder2}
					children={<KPI2Calculator />}
					name={'KPI'}
				/>
				{!uCSelected_CANVAS && (
					<Modal
						title={<div className={css.modalTitle}>Chọn nhóm User sử dụng</div>}
						open={!uCSelected_CANVAS}
						footer={null}
						closable={false}
						width={550}
						centered
						bodyStyle={{ height: 'auto' }}
					>
						{listUC_CANVAS.length === 0
							? (
								<div style={{
									textAlign: 'center',
									display: 'flex',
									flexDirection: 'column',
									gap: '10px',
								}}>
									<Typography.Text style={{ color: '#999', fontSize: '12px', maxWidth: '100%' }}>
										*Chưa có nhóm User nào được phân quyền sử dụng. Liên hệ
										Admin để được phân quyền.
									</Typography.Text>
									{/*<Button onClick={() => navigate('/cross-road')} type='text'>Quay lại</Button>*/}
								</div>
							)
							: listUC_CANVAS.length === 1
								? (
									<div style={{ display: 'none' }}>
										{setTimeout(() => handleBuSelectChange(listUC_CANVAS[0]?.id), 100)}
									</div>
								) : (
									<div className={css.modalBody}>
										<div className={css.tagContainer}>
											{listUC_CANVAS.map((e) => (
												<Tag
													key={e.id}
													className={css.tagItem}
													onClick={() => handleBuSelectChange(e.id)}
												>
													{e.name}
												</Tag>
											))}
										</div>

										{/* Phần mô tả */}
										<Typography.Text
											style={{ color: '#999', fontSize: '12px', maxWidth: '100%' }}
										>
											*Danh sách User mà tài khoản của bạn được phân quyền sử dụng.
											Lựa chọn tại đây quyết định về giới hạn Data và khả năng truy
											cập của bạn tại module chức năng này. Liên hệ Admin để tùy biến
											chỉnh sửa.
										</Typography.Text>
									</div>
								)
						}
					</Modal>
				)}
			</div>


			<CrossRoadPopup2
				openCrossRoad={isModalOpen}
				onOkCrossRoad={handleOk}
				onCancelCrossRoad={handleCancel}
			/>
			<Modal
				title='Tạo mã QR'
				open={isQRModalVisible}
				onCancel={() => {
					setIsQRModalVisible(false);
					setInputText('');
					setShowQR(false);
				}}
				footer={null}
				width={800}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					<Input
						placeholder='Nhập nội dung cần tạo mã QR'
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
					/>
					<Button
						type='primary'
						onClick={() => setShowQR(true)}
						disabled={!inputText.trim()}
					>
						Tạo mã QR
					</Button>


					{showQR && inputText && (
						<div style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '16px',
							marginTop: '16px',
						}}>
							<QRCodeSVG
								id='qr-code'
								value={inputText}
								size={600}
								level='H'
							/>
							<Button onClick={handleDownloadQR}>
								Tải xuống mã QR
							</Button>
						</div>
					)}
				</div>
			</Modal>

			{(isLoggedIn && Object.keys(currentUser).length > 0) && (
				<>

					{/*<FloatButton.Group*/}
					{/*	key={'top'}*/}
					{/*	trigger="hover"*/}
					{/*	placement={'top'}*/}
					{/*	icon={<PlusIcon size={20} />}*/}
					{/*	style={{*/}
					{/*		position: 'fixed',*/}
					{/*		bottom: 16,*/}
					{/*		right: 16,*/}
					{/*		zIndex: 100000,*/}
					{/*		display: 'flex',*/}
					{/*		justifyContent: 'center',*/}
					{/*		alignItems: 'center',*/}
					{/*		width: '40px',*/}
					{/*		height: '40px',*/}
					{/*	}}*/}
					{/*>*/}
					{/*	<FloatButton*/}
					{/*		icon={<CommentOutlined />}*/}
					{/*		style={{*/}
					{/*			width: '30px',*/}
					{/*			height: '30px',*/}
					{/*			fontSize: '12px',*/}
					{/*		}}*/}
					{/*	/>*/}
					{/*	<FloatButton*/}
					{/*		icon={<QuestionCircleOutlined size={10} />}*/}
					{/*		type="primary"*/}
					{/*		onClick={() => setOpenDialog(true)}*/}
					{/*		style={{*/}
					{/*			width: '30px',*/}
					{/*			height: '30px',*/}
					{/*			fontSize: '12px',*/}
					{/*		}}*/}
					{/*	/>*/}
					{/*</FloatButton.Group>*/}


					{/* AntD Modal for Onboarding Guide */}
					<Modal
						title={
							(
								<div style={{
									display: 'flex',
									justifyContent: 'start',
									alignItems: 'center',
									marginBottom: '16px',
									gap: '10px',
								}}>
									<div> Onboarding Guide</div>
									{(currentUser?.isAdmin || currentUser?.isSecretary) && (
										<Button
											onClick={() => setOpenSlideManager(true)}
											style={{ border: 'none' }}
											icon={<Settings size={16} />}
										/>
									)}
								</div>
							)
						}
						open={openDialog}
						onCancel={handleCloseDialog}
						width='80vw'
						centered
						style={{ top: 20 }}
						bodyStyle={{
							height: '75vh',
							padding: 0,
							overflow: 'hidden',
							position: 'relative',
						}}
						footer={[
							<Checkbox
								key='hideOnboardingCheckbox'
								checked={hideOnboarding}
								onChange={(e) => handleCheckboxChange(e)}
							>
								Không hiển thị lại
							</Checkbox>,
							<Button key='closeButton' type='primary' onClick={handleCloseDialog}>
								Close
							</Button>,
						]}
					>
						<div style={{
							height: '100%',
							position: 'relative',
							overflow: 'hidden',
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
						}}>
							<OnboardingGuide
								componentName={componentName}
								openSlideManager={openSlideManager}
								setOpenSlideManager={setOpenSlideManager}
							/>
						</div>
					</Modal>
				</>
			)}

			<Modal
				title='Kiểm tra dữ liệu'
				centered
				open={isModalCheckDataOpen}
				onCancel={handleCloseCheckDataModal}
				footer={null}
			>
				<ContentCheckError />
			</Modal>

			<div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
				<FloatButton.Group
					style={{
						right: 10,
						bottom: 10,
						position: 'fixed',
						display: 'flex',
						flexDirection: 'column',
						gap: '10px',
					}}
				>
					{/* AI Builder Moi - chỉ hiển thị khi đã được kích hoạt */}
					{activatedAIs['ai-builder-moi'] && (
						<IconButton onClick={() => {
							setIsAiBuilderMoiCollapsed(!isAiBuilderMoiCollapsed);
							setIsAICollapsed(true);
							setIsExternalAICollapsed(true);
							setIsAIChatCollapsed(true);
							setIsAIGenCollapsed(true);
							setSelectedKeyAI('');
						}}
									tooltip='AI Report Builder'
									style={{
										backgroundColor: fills[0] || '#00BFFF',
										borderColor: fills[0] || '#00BFFF',
										color: '#fff',
										transform: !isAiBuilderMoiCollapsed ? 'scale(1.3)' : 'scale(1)',
										transition: 'transform 0.3s ease',
										position: 'relative',
									}}
						>
							<AIDataAnalyst width={20} height={20} />
						</IconButton>
					)}
					
					{/* Document & Wiki Bot - chỉ hiển thị khi đã được kích hoạt */}
					{activatedAIs['externalAI'] && (
						<IconButton onClick={() => {
							setIsExternalAICollapsed(!isExternalAICollapsed);
							setIsAICollapsed(true);
							setIsAIChatCollapsed(true);
							setIsAIGenCollapsed(true);
							setIsAiBuilderMoiCollapsed(true);
							setSelectedKeyAI('');
						}}
									tooltip='Document & Wiki Bot'
									style={{
										backgroundColor: fills[0] || '#00BFFF',
										borderColor: fills[0] || '#00BFFF',
										color: '#fff',
										transform: !isExternalAICollapsed ? 'scale(1.3)' : 'scale(1)',
										transition: 'transform 0.3s ease',
										position: 'relative',
									}}
						>
							<DocumentWikiBot width={20} height={20} />
						</IconButton>
					)}
					
					{/* AI Creator - chỉ hiển thị khi đã được kích hoạt */}
					{activatedAIs['aiChat'] && (
						<IconButton onClick={() => {
							setIsAIChatCollapsed(!isAIChatCollapsed);
							setIsExternalAICollapsed(true);
							setIsAICollapsed(true);
							setIsAIGenCollapsed(true);
							setIsAiBuilderMoiCollapsed(true);
							setSelectedKeyAI('');
						}}
									tooltip='AI Creator'
									style={{
										backgroundColor: fills[0] || '#00BFFF',
										borderColor: '#00BFFF',
										color: '#fff',
										transform: !isAIChatCollapsed ? 'scale(1.3)' : 'scale(1)',
										transition: 'transform 0.3s ease',
										position: 'relative',
									}}
						>
							<ICON_AI_CHAT width={20} height={20} />
						</IconButton>
					)}
					
					{/* AI Generator - chỉ hiển thị khi đã được kích hoạt */}
					{activatedAIs['aiGen'] && (
						<IconButton onClick={() => {
							setIsAIGenCollapsed(!isAIGenCollapsed);
							setIsExternalAICollapsed(true);
							setIsAICollapsed(true);
							setIsAIChatCollapsed(true);
							setIsAiBuilderMoiCollapsed(true);
							setSelectedKeyAI('');
						}}
									tooltip='AI Generator'
									style={{
										backgroundColor: fills[0] || '#00BFFF',
										borderColor: '#00BFFF',
										color: '#fff',
										transform: !isAIGenCollapsed ? 'scale(1.3)' : 'scale(1)',
										transition: 'transform 0.3s ease',
										position: 'relative',
									}}
						>
							<ICON_AI_CHAT width={20} height={20} />
						</IconButton>
					)}
				</FloatButton.Group>
			</div>

			{/* Overlay for AI windows */}
			<div
				className={`${css.aiOverlay} ${(!isAICollapsed || !isExternalAICollapsed || !isAIChatCollapsed || !isAIGenCollapsed || !isAiBuilderMoiCollapsed) ? css.aiOverlayOpen : ''}`}
			/>

			<div
				className={`${css.aiWindow} ${!isAiBuilderMoiCollapsed ? css.aiWindowOpen : ''}`}
			>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '16px',
					borderBottom: '1px solid #f0f0f0',
				}}>
					<h3 style={{ margin: 0, alignItems: 'center', display: 'flex', gap: 10 }}>
						<AIDataAnalystIcon width={20} height={20} />AI Report Builder
						<span style={{
							fontSize: '13px',
							color: '#999',
							backgroundColor: 'transparent',
							padding: '4px 12px',
							borderRadius: '20px',
							marginLeft: '8px',
							border: '1px solid #999',
						}}>
      						Shift + 1
    					</span>
					</h3>

					<div style={{ display: 'flex', gap: '8px' }}>
						<Button type='text' onClick={() => {
							setIsAiBuilderMoiCollapsed(true);
							setSelectedKeyAI('');
						}}><Minimize2 /></Button>
						<Popconfirm
							title="Tắt AI"
							description="Bạn có chắc chắn muốn tắt AI này không?"
							onConfirm={() => {
								setIsAiBuilderMoiCollapsed(true);
								setSelectedKeyAI('');
								setActivatedAIs(prev => {
									const newState = { ...prev, 'ai-builder-moi': false };
									localStorage.setItem('activatedAIs', JSON.stringify(newState));
									return newState;
								});
							}}
							okText="Có"
							cancelText="Không"
						>
							<Button 
								type='text' 
								style={{ color: '#ff4d4f' }}
							>
								<X />
							</Button>
						</Popconfirm>
					</div>
				</div>
				{activatedAIs['ai-builder-moi'] && (
					<div style={{ height: 'calc(100% - 57px)', overflow: 'auto' }}>
						<AiBuilderMoi onQueueLengthChange={() => {}} isActivated={activatedAIs['ai-builder-moi']} />
					</div>
				)}
			</div>

			<div
				className={`${css.aiWindow} ${!isAICollapsed ? css.aiWindowOpen : ''}`}
			>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '16px',
					borderBottom: '1px solid #f0f0f0',
				}}>
					<h3 style={{ margin: 0, alignItems: 'center', display: 'flex', gap: 10 }}>
						<AIDataAnalystIcon width={20} height={20} />AI Report Builder
						<span style={{
							fontSize: '13px',
							color: '#999',
							backgroundColor: 'transparent',
							padding: '4px 12px',
							borderRadius: '20px',
							marginLeft: '8px',
							border: '1px solid #999',
						}}>
      						Shift + 1
    					</span>
					</h3>

					<div style={{ display: 'flex', gap: '8px' }}>
						<Button type='text' onClick={() => {
							setIsAICollapsed(true);
							setSelectedKeyAI('');
						}}><Minimize2 /></Button>
						<Popconfirm
							title="Tắt AI"
							description="Bạn có chắc chắn muốn tắt AI này không?"
							onConfirm={() => {
								setIsAICollapsed(true);
								setSelectedKeyAI('');
								setActivatedAIs(prev => {
									const newState = { ...prev, 'ai-builder-moi': false };
									localStorage.setItem('activatedAIs', JSON.stringify(newState));
									return newState;
								});
							}}
							okText="Có"
							cancelText="Không"
						>
							<Button 
								type='text' 
								style={{ color: '#ff4d4f' }}
							>
								✕
							</Button>
						</Popconfirm>
					</div>
				</div>
				<div style={{ height: 'calc(100% - 57px)', overflow: 'auto' }}>
					{activatedAIs['ai-report-builder'] && (
						<AI onQueueLengthChange={() => {}} isActivated={activatedAIs['ai-report-builder']} />
					)}
				</div>
			</div>

			<div
				className={`${css.aiWindow} ${!isExternalAICollapsed ? css.aiWindowOpen : ''}`}
			>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '16px',
					borderBottom: '1px solid #f0f0f0',
				}}>
					<h3 style={{ margin: 0, alignItems: 'center', display: 'flex', gap: 10 }}>
						<DocumentWikiBotIcon width={20} height={20} />Document & Wiki Bot
						<span style={{
							fontSize: '13px',
							color: '#999',
							backgroundColor: 'transparent',
							padding: '4px 12px',
							borderRadius: '20px',
							marginLeft: '8px',
							border: '1px solid #999',
						}}>
      						Shift + 2
    					</span>
					</h3>
					<div style={{ display: 'flex', gap: '8px' }}>
						<Button type='text' onClick={() => {
							setIsExternalAICollapsed(true);
							setSelectedKeyAI('');
						}}><Minimize2 /></Button>
						<Popconfirm
							title="Tắt AI"
							description="Bạn có chắc chắn muốn tắt AI này không?"
							onConfirm={() => {
								setIsExternalAICollapsed(true);
								setSelectedKeyAI('');
								setActivatedAIs(prev => {
									const newState = { ...prev, 'externalAI': false };
									localStorage.setItem('activatedAIs', JSON.stringify(newState));
									return newState;
								});
							}}
							okText="Có"
							cancelText="Không"
						>
							<Button 
								type='text' 
								style={{ color: '#ff4d4f' }}
							>
								✕
							</Button>
						</Popconfirm>
					</div>
				</div>
				<div style={{ height: 'calc(100% - 57px)', overflow: 'auto' }}>
					{activatedAIs['externalAI'] && (
						<ExternalAI onQueueLengthChange={setExternalAIQueueLength} isActivated={activatedAIs['externalAI']} />
					)}
				</div>
			</div>

			<div
				className={`${css.aiWindow} ${!isAIChatCollapsed ? css.aiWindowOpen : ''}`}
			>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '16px',
					borderBottom: '1px solid #f0f0f0',
				}}>
					<h3 style={{ margin: 0, alignItems: 'center', display: 'flex', gap: 10 }}>
						<ICON_AI_CHAT_ICON_DARK />AI Creator
						<span style={{
							fontSize: '13px',
							color: '#999',
							backgroundColor: 'transparent',
							padding: '4px 12px',
							borderRadius: '20px',
							marginLeft: '8px',
							border: '1px solid #999',
						}}>
      						Shift + 3
    					</span>
					</h3>
					<div style={{ display: 'flex', gap: '8px' }}>
						<Button type='text' onClick={() => {
							setIsAIChatCollapsed(true);
							setSelectedKeyAI('');
						}}><Minimize2 /></Button>
						<Popconfirm
							title="Tắt AI"
							description="Bạn có chắc chắn muốn tắt AI này không?"
							onConfirm={() => {
								setIsAIChatCollapsed(true);
								setSelectedKeyAI('');
								setActivatedAIs(prev => {
									const newState = { ...prev, 'aiChat': false };
									localStorage.setItem('activatedAIs', JSON.stringify(newState));
									return newState;
								});
							}}
							okText="Có"
							cancelText="Không"
						>
							<Button 
								type='text' 
								style={{ color: '#ff4d4f' }}
							>
						<X/>
							</Button>
						</Popconfirm>
					</div>
				</div>
				<div style={{ height: 'calc(100% - 57px)', overflow: 'auto' }}>
					{activatedAIs['aiChat'] && (
						<AIFreeChat onQueueLengthChange={setAIFreeChatQueueLength} isActivated={activatedAIs['aiChat']} />
					)}
				</div>
			</div>

			<div
				className={`${css.aiWindow} ${!isAIGenCollapsed ? css.aiWindowOpen : ''}`}
			>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					padding: '16px',
					borderBottom: '1px solid #f0f0f0',
				}}>
					<h3 style={{ margin: 0, alignItems: 'center', display: 'flex', gap: 10 }}>
						<ICON_AI_CHAT_ICON />AI Generator
						<span style={{
							fontSize: '13px',
							color: '#999',
							backgroundColor: 'transparent',
							padding: '4px 12px',
							borderRadius: '20px',
							marginLeft: '8px',
							border: '1px solid #999',
						}}>
      						Shift + 4
    					</span>
					</h3>
					<div style={{ display: 'flex', gap: '8px' }}>
						<Button type='text' onClick={() => {
							setIsAIGenCollapsed(true);
							setSelectedKeyAI('');
						}}><Minimize2 /></Button>
						<Popconfirm
							title="Tắt AI"
							description="Bạn có chắc chắn muốn tắt AI này không?"
							onConfirm={() => {
								setIsAIGenCollapsed(true);
								setSelectedKeyAI('');
								setActivatedAIs(prev => {
									const newState = { ...prev, 'aiGen': false };
									localStorage.setItem('activatedAIs', JSON.stringify(newState));
									return newState;
								});
							}}
							okText="Có"
							cancelText="Không"
						>
							<Button 
								type='text' 
								style={{ color: '#ff4d4f' }}
							>
								<X />
							</Button>
						</Popconfirm>
					</div>
				</div>
				<div style={{ height: 'calc(100% - 57px)', overflow: 'auto' }}>
					{activatedAIs['aiGen'] && (
						<AIGen onQueueLengthChange={setAIGenQueueLength} isActivated={activatedAIs['aiGen']} />
					)}
				</div>
			</div>
		</>
	);
};
export default CanvasMain;
