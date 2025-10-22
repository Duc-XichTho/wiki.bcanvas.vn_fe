import css from './CanvasDuLieuSidebar.module.css';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MyContext } from '../../../../MyContext.jsx';
import { createFileTab, getFileTabByTypeData, updateFileTab } from '../../../../apis/fileTabService.jsx';
import { Button, Checkbox, Dropdown, Input, Menu, message, Modal, Popconfirm, Switch } from 'antd';
import {
	ADD_NEW,
	BookMark_Off,
	BookMark_On,
	ICON_BANG_XOAY,
	ICON_CHART,
	ICON_SIDEBAR_LIST,
	ICON_VECTOR,
	Search_Icon,
} from '../../../../icon/svg/IconSvg.jsx';
import AddFolder from '../../Daas/Sidebar/Action/AddFolder.jsx';
import { deleteFileNotePad, getAllFileNotePad, updateFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { getCurrentUserLogin, updateUser } from '../../../../apis/userService.jsx';
import CreateData from '../CreateData/CreateData.jsx';
import { findRecordsByConditions } from '../../../../apis/searchModelService.jsx';
import { getFileNotePadById } from '../../../../apis/public/fileNotePadService.jsx';
import { getAllTemplateSheetTable, getTemplateByFileNoteId } from '../../../../apis/templateSettingService.jsx';
import { Dot, Paperclip  } from 'lucide-react';
import CreateDataCombine from '../CreateData/CreateDataCombine.jsx';
import CheckDuplicate from '../CheckDuplicate/CheckDuplicate.jsx';
import ListChartTemplate
	from '../../Daas/Content/Template/SettingChart/ChartTemplate/ChartTemplateList/ListChartTemplate.jsx';
import { getAllKpi2Calculator } from '../../../../apis/kpi2CalculatorService.jsx';
import { getAllChartTemplate } from '../../../../apis/chartTemplateService.jsx';
import KPI from '../CanvasDuLieuTongHop/KPI.jsx';
import CreateDataFullType from '../CreateData/CreateDataFullType.jsx';
import { createSetting, getSettingByType } from '../../../../apis/settingService.jsx';

export default function CanvasDuLieuSidebar() {
	const { companySelect, buSelect, id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const [listChain, setListChain] = useState([]);
	const [tabs, setTabs] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);
	const [selectedTap, setSelectedTap] = useState(null);
	const [openCategories, setOpenCategories] = useState({});
	const [isModalFolderVisible, setIsModalFolderVisible] = useState(false);
	const [newFolderData, setNewFolderData] = useState({ label: '' });
	const [editTabName, setEditTabName] = useState('');
	const [editTabId, setEditTabId] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [kpiList, setKpiList] = useState([]);
	const [ctList, setCtList] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [newFileName, setNewFileName] = useState('');
	const [isOpenBookmark, setIsOpenBookmark] = useState(false);
	const [hoveredId, setHoveredId] = useState(null);
	const [favoriteIds, setFavoriteIds] = useState([]);
	const [listFavorite, setListFavorite] = useState([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [contextValue, setContextValue] = useState(null);
	const [contextParentKey, setContextParentKey] = useState(null);
	const popconfirmRef = useRef(null);
	const [selectedIcon, setSelectedIcon] = useState(selectedFile?.info?.iconSideBar || null);
	const [isModalChartVisible, setIsModalChartVisible] = useState(false);
	const [isModalKpiVisible, setIsModalKpiVisible] = useState(false);
	const [showKpi, setShowKpi] = useState(false);
	const [isShowModalDuplicate, setIsShowModalDuplicate] = useState(false);
	const [fileNotes, setFileNotes] = useState([]);
	const [isFeatureBarVisible, setIsFeatureBarVisible] = useState(false);
	const [filteredTabs, setFilteredTabs] = useState([]);
	const [selectedTemplates, setSelectedTemplates] = useState([]);
	const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
	const [templateData, setTemplateData] = useState([]);
	const [templateTables, setTemplateTables] = useState([]);

	const handleOpenBookmark = () => {
		setIsOpenBookmark(!isOpenBookmark);
	};
	const {
		selectedTapCanvas,
		setSelectedTapCanvas,
		loadDataDuLieu,
		userClasses,
		fetchUserClasses,
		uCSelected_CANVAS,
		currentUser,
		setCurrentUser,
		listUC_CANVAS,
		currenStepDuLieu,
		setCurrenStepDuLieu,
	} = useContext(MyContext);

	const handleOpenModal = () => {
		setIsModalVisible(true);
	};

	const handleFeatureBarToggle = (e) => {
		setIsFeatureBarVisible(e.target.checked);
	};


	const loadFileTab = async () => {
		// const fileTabs = await getFileTabByType('data', 'du-lieu-dau-vao');
		let fileTabs = await getFileTabByTypeData();
		fileTabs = fileTabs.filter((tab) => tab.position < 100 && tab.table == 'du-lieu-dau-vao' && tab.type == 'data');
		fileTabs.sort((a, b) => a.position - b.position);
		setTabs([
			{
				id: 0,
				key: 'tapFavorite',
				label: 'Danh sách yêu thích',
				listFileNote: listFavorite,
				alt: 'Favorite',
			},
			...fileTabs,
		]);
	};

	const handleSearchChange = (e) => {
		setSearchText(e.target.value);
	};


	const handleNavigate = (value) => {
		const tabKey = currenStepDuLieu?.path;
		let newPath;
		if (tabKey == 'du-lieu-dau-vao') {
			switch (value.table) {
				case 'FileUpLoad':
					newPath = `/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-dau-vao/${value.id}/file`;
					break;
				case 'Template':
					newPath = `/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-dau-vao/${value.id}/thong-ke`;
					break;
				case 'Tiptap':
					newPath = `/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-dau-vao/${value.id}/tiptap`;
					break;
			}
		} else if (tabKey == 'du-lieu-tong-hop') {
			newPath = `/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-tong-hop/${value.id}`;

		}
		navigate(newPath);
	};

	const chunkArray = (array, size) => {
		const result = [];
		for (let i = 0; i < array.length; i += size) {
			result.push(array.slice(i, i + size));
		}
		return result;
	};

	const handleClickMenu = async (tabKey, itemId, value) => {
		setSelectedTap(tabKey);
		setSelectedItem(itemId);
		handleNavigate(value);

		await updateViewStateForDuLieu({
			data: {
				selectedItemId: itemId,
				selectedFolder: tabKey,
			},
			updateActiveSubTab: true,
		});


	};


	const toggleCategory = async (folderId) => {
		const newOpenCategories = {
			...openCategories,
			[folderId]: !openCategories[folderId],
		};
		setOpenCategories(newOpenCategories);

		const openFolderIds = Object.entries(newOpenCategories)
			.filter(([_, isOpen]) => isOpen)
			.map(([id]) => id);

		await updateViewStateForDuLieu({
			data: {
				openFolderIds,
			},
		});
	};

	const fetchData = async () => {
		try {
			const [data, user, templateTablesData, kpis, cts] = await Promise.all([
				getAllFileNotePad(),
				getCurrentUserLogin(),
				getAllTemplateSheetTable(),
				getAllKpi2Calculator(),
				getAllChartTemplate(),
			]);
			setTemplateTables(templateTablesData);


			let fileNotesWithRotateCount = data.map(fileNote => {
				const ctsCount = cts.filter(t =>
					t.id_filenote === fileNote.id,
				).length;
				return { ...fileNote, so_luong_chart: ctsCount };
			});

			setFileNotes(fileNotesWithRotateCount);
			setKpiList(kpis);
			setCtList(cts);
			if (!(userClasses?.length > 0)) {
				fetchUserClasses();
			}

			let userAccess = [];

			if (user.data?.isAdmin) {
				userAccess = fileNotesWithRotateCount; // Admin có quyền truy cập tất cả
			} else {
				let reportChartTypes = [];
				for (const e of userClasses) {
					if (e?.module === 'CANVAS' && e.id == uCSelected_CANVAS) {
						reportChartTypes = reportChartTypes.concat(e?.reportChart || []);
					}
				}
				userAccess = fileNotesWithRotateCount.filter((item) =>
					reportChartTypes.includes(item?.type) || listUC_CANVAS.every(uc => item.userClass?.includes(uc.id)) || item?.table === 'NotePad' || item?.table === 'KPI',
				);
			}
			setListChain(userAccess);
		} catch (error) {
			console.error('Error fetching card data:', error);
		}
	};

	useEffect(() => {
		if (currenStepDuLieu?.path == 'du-lieu-tong-hop') {
			fetchData();
		}
	}, [currenStepDuLieu?.path, loadDataDuLieu]);

	const updateViewStateForDuLieu = async ({ data, updateActiveSubTab = false }) => {
		const user = (await getCurrentUserLogin()).data;
		if (Array.isArray(data?.openFolderIds)) {
			data.openFolderIds = data.openFolderIds.filter(item => item !== 'undefined');
		}
		const tabKey = 'du-lieu-dau-vao';
		const info = user.info || {};
		const viewState = info.viewState || {};
		const duLieu = viewState.duLieu || {};
		const tabs = duLieu.tabs || {};
		const newUser = {
			...user,
			info: {
				...info,
				viewState: {
					...viewState,
					duLieu: {
						...duLieu,
						activeSubTab: updateActiveSubTab ? tabKey : duLieu.activeSubTab,
						tabs: {
							...tabs,
							[tabKey]: {
								...(tabs[tabKey] || {}),
								...data,
							},
						},
					},
				},
			},
		};
		await updateUser(currentUser.email, newUser);
	};

	const fetchLastView = async () => {
		const user = (await getCurrentUserLogin()).data;
		if (!user?.info?.viewState?.duLieu) return;

		const tabKey = 'du-lieu-dau-vao';
		const tabData = user.info.viewState.duLieu.tabs?.[tabKey] || {};

		const openFolders = tabData.openFolderIds || [];
		const selectedItem = tabData.selectedItemId || null;
		const selectedFolder = tabData.selectedFolder || null;
		setOpenCategories(
			openFolders.reduce((acc, folderId) => {
				acc[folderId] = true;
				return acc;
			}, {}),
		);

		if (selectedItem && selectedFolder) {
			try {
				setSelectedItem(selectedItem);
				setSelectedTap(selectedFolder);
				const dataCheck = await getFileNotePadById(selectedItem);
				if (dataCheck) {
					handleNavigate(dataCheck);
				}
			} catch (error) {
				console.error('Lỗi khi lấy NotePad:', error.message);
			}
		}
	};

	useEffect(() => {
		if (!id) fetchLastView();
	}, [currenStepDuLieu?.path, id]);

	// const handleSelectSideBarFromLink = async (itemId) => {
	// 	try {
	// 		const fileTabs = await getFileTabByType('data', 'du-lieu-dau-vao');
	// 		fileTabs.sort((a, b) => a.position - b.position);
	// 		let listFileNote = await getAllFileNotePad();
	// 		let fileNote = listFileNote.find((item) => item.id == itemId);
	// 		let tab = fileTabs.find((tab) => tab.key === fileNote?.tab);
	// 		const newOpenCategories = {
	// 			...openCategories,
	// 			[tab?.id]: true,
	// 		};
	// 		// setSelectedTap(fileNote?.tab);
	// 		// setSelectedItem(fileNote?.id);
	// 		// setOpenCategories(newOpenCategories);
	// 	} catch (error) {
	// 		console.error('Lỗi khi lấy NotePad:', error);
	// 	}
	// };
	//
	// useEffect(() => {
	// 	handleSelectSideBarFromLink(id);
	// }, [id]);


	useEffect(() => {
		loadFileTab();
	}, [listFavorite, loadDataDuLieu]);

	const handleCreateFolder = async () => {
		const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(newFolderData.key);
		const hasInvalidChars = /[\s/]/.test(newFolderData.key);

		if (hasVietnameseChars || hasInvalidChars) {
			message.error('Key không được chứa khoảng trắng, dấu \'/\' hoặc ký tự tiếng Việt');
			return;
		}

		if (!newFolderData.label) {
			message.error('Vui lòng nhập đầy đủ thông tin');
			return;
		}

		try {
			const maxPosition = Math.max(...tabs.map(tab => tab.position || 0), 0);

			await createFileTab({
				...newFolderData,
				position: maxPosition + 1,
				table: 'du-lieu-dau-vao',
				type: 'data',
				hide: false,
			});

			message.success('Tạo thư mục thành công');
			await loadFileTab();
			await fetchData();
			setIsModalFolderVisible(false);
			setNewFolderData({ label: '' });
		} catch (error) {
			console.error('Error creating folder:', error);
			message.error('Có lỗi xảy ra khi tạo thư mục');
		}
	};

	const updateTabName = async (tabId, newName) => {
		try {
			await updateFileTab({ id: tabId, label: newName });
			await loadFileTab();
			setEditTabId(null);
		} catch (error) {
			console.error('Lỗi khi cập nhật:', error);
			message.error('Có lỗi xảy ra khi cập nhật');
		}
	};

	const swapPosition = async (tab1, tab2) => {
		if (!tab1 || !tab2) return;

		try {
			await updateFileTab({ id: tab1.id, position: tab2.position });
			await updateFileTab({ id: tab2.id, position: tab1.position });
			await loadFileTab();
		} catch (error) {
			console.error('Error swapping position:', error);
			message.error('Có lỗi xảy ra khi đổi vị trí');
		}
	};

	const handleCloseModal = () => {
		setIsModalVisible(false);
	};

	const removeVietnameseTones = (str) => {
		return str
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim();
	};
	const keyword = removeVietnameseTones(searchText || '');

	useEffect(() => {
		const updatedFilteredTabs = tabs
			.map((tab) => {
				const filteredNotes = tab.listFileNote.filter((note) =>
					removeVietnameseTones(note.name?.trim()).includes(keyword),
				);

				return {
					...tab,
					listFileNote: filteredNotes,
				};
			})
			.filter((tab) =>
				(tab.listFileNote.length > 0 || !searchText) &&
				(isOpenBookmark ? tab.id === 0 : tab.id !== 0),
			);

		setFilteredTabs(updatedFilteredTabs);
	}, [tabs, searchText, isOpenBookmark]);

	const handleToggleAllCategories = () => {
		const allOpen = tabs.every(tab => openCategories[tab.id]);
		const newOpenCategories = {};
		tabs.forEach(tab => {
			newOpenCategories[tab.id] = !allOpen;
		});
		setOpenCategories(newOpenCategories);

		// Optionally update view state if needed
		updateViewStateForDuLieu({
			data: {
				openFolderIds: !allOpen ? tabs.map(tab => tab.id) : [],
			},
		});
	};

	const handleRenameFileNotePad = async () => {
		try {
			if (!newFileName.trim()) {
				message.warning('Tên không được để trống');
				return;
			}

			await updateFileNotePad({
				...selectedFile,
				name: newFileName,
				info: {
					...(selectedFile.info || {}),
					iconSideBar: selectedIcon,
				},
			});

			message.success('Đổi tên thành công');
			setIsRenameModalVisible(false);
			await loadFileTab();
		} catch (error) {
			console.error('Error renaming file:', error);
			message.error('Có lỗi xảy ra khi đổi tên');
		}
	};

	const handleDeleteFileNotePad = async (id, parentKey) => {
		try {
			// First get all template tables and find related fileNotes
			const [templateTables, allFileNotes] = await Promise.all([
				getAllTemplateSheetTable(),
				getAllFileNotePad(),
			]);

			// Find the main table associated with the fileNote to be deleted
			const mainTable = templateTables.find(e => e.fileNote_id == id);

			// Initialize an array to track all fileNotes to delete
			const fileNotesToDelete = [id];

			// If this is a main table, find all related rotate tables and their fileNotes
			if (mainTable) {
				// Find rotate tables that have this table as their mother_table
				const relatedRotateTables = templateTables.filter(e =>
					e.mother_table_id == mainTable.id,
				);

				// Add the fileNote IDs of the related rotate tables to the deletion list
				relatedRotateTables.forEach(table => {
					if (table.fileNote_id && !fileNotesToDelete.includes(table.fileNote_id)) {
						fileNotesToDelete.push(table.fileNote_id);
					}
				});
			}

			// Delete all related fileNotes
			let deletedCount = 0;
			let notFoundCount = 0;
			for (const fileNoteId of fileNotesToDelete) {
				try {
					await deleteFileNotePad(fileNoteId);
					deletedCount++;
				} catch (deleteError) {
					// If fileNote doesn't exist (404), just continue
					if (deleteError.response?.status === 404) {
						console.log(`FileNote ${fileNoteId} không tồn tại, bỏ qua`);
						notFoundCount++;
						continue;
					}
					throw deleteError; // Re-throw other errors
				}
			}

			// Show success message based on how many were deleted
			if (deletedCount > 1) {
				message.success(`Xóa thành công ${deletedCount - 1} pivot liên quan`);
			} else if (deletedCount === 1) {
				message.success('Xóa thành công');
			} else if (notFoundCount > 0) {
				// If some files were not found but we tried to delete them, consider it a success
				message.success('Xóa thành công');
			} else {
				message.warning('Không có file nào được xóa');
			}

			// Clear selection after deletion
			setSelectedItem(null);
			setSelectedTap(null);

			await loadFileTab();
			const currentPath = location.pathname;

			let newPath = '';
			if (currentPath.includes('du-lieu-dau-vao')) {
				newPath = `/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-dau-vao`;
			} else if (currentPath.includes('du-lieu-tong-hop')) {
				newPath = `/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-tong-hop`;
			}

			if (newPath) {
				navigate(newPath);
			}
		} catch (error) {
			console.error('Error deleting file:', error);
			message.error('Có lỗi xảy ra khi xóa');
		}
	};


	const finDataByFavorites = async (favorites) => {

		const dataFavorite = await findRecordsByConditions('FileNotePad', {
			id: favorites,
		});
		const sortedDataFavorite = dataFavorite.sort((a, b) => {
			return favorites.indexOf(a.id) - favorites.indexOf(b.id);
		});
		setListFavorite(sortedDataFavorite);
	};


	const fetchFavorites = async () => {
		try {
			const user = (await getCurrentUserLogin()).data;
			const favorites = user?.info?.bookmark_DuLieuDauVao || [];
			await finDataByFavorites(favorites);
			setFavoriteIds(favorites);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu bookmark:', error);
		}
	};


	useEffect(() => {
		fetchFavorites();
	}, []);


	const handleFavoriteClick = async (id) => {
		try {
			const user = (await getCurrentUserLogin()).data;

			let existingFavorites = user?.info?.bookmark_DuLieuDauVao || [];

			if (existingFavorites.includes(id)) {
				existingFavorites = existingFavorites.filter((favId) => favId !== id);
				const updatedFavorites = listFavorite.filter((fav) => fav.id !== id);
				setListFavorite(updatedFavorites);
			} else {
				existingFavorites.push(id);
				await finDataByFavorites(existingFavorites);
			}

			const updatedUser = {
				...user,
				info: {
					...user.info,
					bookmark_DuLieuDauVao: existingFavorites,
				},
			};
			await updateUser(user.email, updatedUser);


			setFavoriteIds(existingFavorites);
		} catch (error) {
			console.error('Lỗi khi cập nhật bookmark_report:', error);
		}
	};


	const contextMenuItems = [
		{
			key: '1',
			label: 'Đổi tên',
		},
		{
			key: '2',
			label: 'Xóa',
		},
	];

	const handleMenuClick = ({ key }) => {
		if (key === '1') {
			setSelectedFile(contextValue);
			setNewFileName(contextValue?.name);
			setIsRenameModalVisible(true);
		} else if (key === '2') {
			setShowDeleteConfirm(true);
		}
	};

	const handleContextMenu = (e, value, parentKey) => {
		e.preventDefault();
		setContextValue(value);
		setContextParentKey(parentKey);
	};


	useEffect(() => {
		const handleClickOutside = (event) => {
			const isInsideMenuItem =
				popconfirmRef.current && popconfirmRef.current.contains(event.target);
			const isInsidePopover = event.target.closest('.ant-popover');

			if (showDeleteConfirm && !isInsideMenuItem && !isInsidePopover) {
				setShowDeleteConfirm(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showDeleteConfirm]);

	useEffect(() => {
		setSelectedIcon(selectedFile?.info?.iconSideBar || null);
	}, [selectedFile]);


	const swapFileNotePosition = async (tabId, noteA, noteB, indexA, indexB) => {
		if (!noteA || !noteB) return;

		const positionA = noteA.position ?? indexA;
		const positionB = noteB.position ?? indexB;

		try {
			await Promise.all([
				updateFileNotePad({ id: noteA.id, position: positionB }),
				updateFileNotePad({ id: noteB.id, position: positionA }),
			]);
			await loadFileTab();
			message.success('Cập nhật vị trí thành công');
		} catch (error) {
			console.error('Lỗi cập nhật vị trí fileNote:', error);
			message.error('Cập nhật vị trí thất bại');
		}
	};

	const [isDropdownVisible, setIsDropdownVisible] = useState(false);

	const handleDropdownVisibleChange = (visible) => {
		setIsDropdownVisible(visible);
	};


	const RenderCaiDat = () => {
		return (
			currenStepDuLieu?.path == 'du-lieu-tong-hop' ?
				<Dropdown
					overlay={
						<Menu>
							{/*<Menu.Item key="1" onClick={() => {*/}
							{/*	setIsShowModalDuplicate(true);*/}
							{/*	setIsDropdownVisible(false); // đóng dropdown*/}
							{/*}}>*/}
							{/*	<Create_Icon width={20} height={12} />*/}
							{/*	Dữ liệu trùng lặp*/}
							{/*</Menu.Item>*/}

							<Menu.Item key="2" onClick={() => {
								setIsModalFolderVisible(true);
								setIsDropdownVisible(false); // đóng dropdown
							}}
									   style={{ fontSize: 15 }}
							>
								{/*<FolderSetting_Icon width={22} height={12} />*/}
								Thư mục
							</Menu.Item>

							{/*<Menu.Item key="3" onClick={() => {*/}
							{/*	setShowKpi(true);*/}
							{/*	setIsDropdownVisible(false);*/}
							{/*}}>*/}
							{/*	<KPI_Icon width={22} height={12} />*/}
							{/*	Thống kê, đo lường*/}
							{/*</Menu.Item>*/}

							<Menu.Item key="4" onClick={() => {
								setIsModalChartVisible(true);
								setIsDropdownVisible(false);
							}}
									   style={{ fontSize: 15 }}>
								{/*<KPI_Icon width={22} height={12} />*/}
								Xem danh sách biểu đồ
							</Menu.Item>

							{/*<Menu.Item key="5" onClick={() => {*/}
							{/*	setIsModalKpiVisible(true);*/}
							{/*	setIsDropdownVisible(false);*/}
							{/*}}>*/}
							{/*	<KPI_Icon width={22} height={12} />*/}
							{/*	Xem KPI đang có*/}
							{/*</Menu.Item>*/}
						</Menu>
					}
					trigger={['click']}
					visible={isDropdownVisible}
					onVisibleChange={handleDropdownVisibleChange} // Điều khiển sự kiện click của dropdown
				>
					<div
						className={`
								${css.buttonAction}
								${(
							isDropdownVisible ||
							isModalFolderVisible ||
							isShowModalDuplicate ||
							isModalChartVisible ||
							isModalKpiVisible ||
							showKpi
						) ? '' : ''}
  						`}
					>
						<span>Cài đặt</span>
					</div>

				</Dropdown>
				:
				<div className={`${css.buttonAction} ${isModalFolderVisible ? '' : ''}`}
					 onClick={() => setIsModalFolderVisible(true)}
				>
					<span>Cài đặt thư mục</span>
				</div>
		);
	};

	const [menuVisibility, setMenuVisibility] = useState({
		version: 'full', // 'full' or 'compact'
		'du-lieu-nen': true,
		'home': true,
		'ke-hoach': true,
		'thuc-hien': true,
		'dashboard': true,
		id: null,
	});

	useEffect(() => {
		const fetchMenuSettings = async () => {
			try {
				const data = await getSettingByType('MenuSettings');
				if (data) {
					setMenuVisibility({
						...data.setting,
						id: data.id,
					});
				} else {
					// If no settings exist, create default settings
					const defaultSettings = {
						version: 'full',
						'du-lieu-nen': true,
						'home': true,
						'ke-hoach': true,
						'thuc-hien': true,
						'dashboard': true,
						'ai': true,
					};
					const newSetting = await createSetting({
						type: 'MenuSettings',
						setting: defaultSettings,
					});
					setMenuVisibility({
						...defaultSettings,
						id: newSetting.id,
					});
				}
			} catch (error) {
				console.error('Error loading menu settings:', error);
			}
		};
		fetchMenuSettings();
	}, []);

	return (
		<>
			<div className={css.main}>
				<div className={css.sidebar}>
					<div className={css.headerSidebar}>
						<Input
							className={css.searchBox}
							placeholder="Tìm kiếm"
							value={searchText}
							onChange={handleSearchChange}
							prefix={<Search_Icon width={16} />}
						/>
						<span onClick={handleToggleAllCategories} style={{ cursor: 'pointer', marginBottom: '2px', color: '#000000e0' }}>Đóng mở</span>
						<Checkbox onChange={handleFeatureBarToggle}>Thanh chức năng</Checkbox>
					</div>
					{isFeatureBarVisible && ( // Conditionally render the "+ Mới" button
						<div className={css.buttonActionGroup}>
							<div className={`${css.buttonAction} ${isModalVisible ? css.active : ''}`}
								 onClick={handleOpenModal}
							>
								<ADD_NEW width={15} height={15} />
							</div>
							<RenderCaiDat />
							<div className={`${css.buttonAction} ${isOpenBookmark ? css.active : ''}`}
								 onClick={handleOpenBookmark}
							>
								<span>Yêu thích</span>
							</div>
						</div>
					)}
					<div
						className={`${css.menu} ${isFeatureBarVisible ? css.menuWithButton : ''}`}
					>
						{filteredTabs.map((item) => {
								if (item.hide) return null;
								const isOpen = openCategories[item.id];
								return <>
									<div
										className={css.sidebarTitle}
										onClick={() => toggleCategory(item.id)}
										style={{ cursor: 'pointer' }}
									>
										<div className={css.folderRight}>
											{/*<Folder_Icon width={18} />*/}
											<span>{item.label}</span>
										</div>
									</div>

									{isOpen &&
										<div style={{ marginBottom: '15px' }}>

											{item.listFileNote?.length > 0 ? (() => {
												let hasVisible = false;
												const renderedNotes = item.listFileNote.map((value, idx) => {
													let canView = true;
													if (!currentUser?.isAdmin) {
														try {
															const ucObj = listUC_CANVAS?.find(uc => uc.id == uCSelected_CANVAS);
															const ucId = ucObj?.id;
															if (!value.userClass || !Array.isArray(value.userClass) || value.userClass.length === 0) {
																canView = false;
															} else {
																canView = value.userClass.includes(ucId);
															}
														} catch (e) {
															canView = false;
														}
													}
													if (!canView) return null;
													hasVisible = true;
													const isBookmarked = favoriteIds.includes(value.id) || hoveredId == value.id;
													const isNotEdit = location?.pathname.includes('du-lieu-dau-vao') ? value.isNotEdit : false;
													return (
														<Dropdown
															key={idx}
															trigger={isNotEdit ? [] : ['contextMenu']}
															menu={!isNotEdit ? {
																items: contextMenuItems,
																onClick: handleMenuClick,
															} : undefined}
														>
															<div
																ref={showDeleteConfirm && contextValue?.id === value.id ? popconfirmRef : null}
																onMouseEnter={() => setHoveredId(value.id)}
																onMouseLeave={() => setHoveredId(null)}
																className={`${css.menuItem} ${isNotEdit ? css.disabledItem : ''} ${selectedTap == item.key && ((id || selectedItem) == value.id)
																	? css.menuItemActive
																	: ''
																}`}
																onClick={!isNotEdit ? () => handleClickMenu(item.key, value.id, value) : undefined}
																onContextMenu={!isNotEdit ? (e) => handleContextMenu(e, value, item.key) : undefined}
															>
																{showDeleteConfirm && contextValue?.id === value.id ? (
																	<Popconfirm
																		open={true}
																		placement="topRight"
																		title="Bạn có chắc chắn muốn xóa?"
																		onConfirm={() => {
																			handleDeleteFileNotePad(contextValue?.id, contextParentKey);
																			setShowDeleteConfirm(false);
																		}}
																		onCancel={(e) => {
																			e.stopPropagation();
																			setShowDeleteConfirm(false);
																		}}
																		okText="Có"
																		cancelText="Không"
																	>
																		<div className={css.cardLabel}>
																			{/*<div className={css.iconCard}>*/}
																			{/*	{value?.info?.iconSideBar && (*/}
																			{/*		<>*/}
																			{/*			<img*/}
																			{/*				src={ICON_SIDEBAR_LIST.find(item => item.name === value.info.iconSideBar)?.icon}*/}
																			{/*				alt={value.info.iconSideBar}*/}
																			{/*				width={16}*/}
																			{/*				height={16}*/}
																			{/*			/>*/}
																			{/*		</>*/}
																			{/*	)}*/}
																			{/*</div>*/}
																			<span className={css.titleCard}>{value.name}
																				{(value.created_at && ((new Date() - new Date(value.created_at)) <= 24 * 60 * 60 * 1000)) &&
																					<span style={{
																						display: 'inline-block',
																						position: 'relative',
																						width: '16px',
																						height: '16px',
																						marginLeft: '4px',
																						verticalAlign: 'middle',
																					}}>
																					<Dot size={30} color="red" style={{
																						padding: 0,
																						position: 'absolute',
																						top: '10%',
																						left: '30%',
																						transform: 'translate(-50%, -50%)',
																					}} />
																				</span>
																				}</span>
																		</div>
																	</Popconfirm>
																) : (
																	<div className={css.cardLabel}>
																		<div className={css.iconCard}>
																			{value?.info?.iconSideBar && (
																				<>
																					<img
																						src={ICON_SIDEBAR_LIST.find(item => item.name === value.info.iconSideBar)?.icon}
																						alt={value.info.iconSideBar}
																						width={16}
																						height={16}
																					/>

																				</>
																			)}
																		</div>
																		<span className={css.titleCard}>{value.name}
																			{value.table === "TiptapWithChart" && (
																				<span style={{
																					marginLeft: 6,
																					color: "#ffffff",
																					backgroundColor: "#A3A3A3",
																					fontWeight: 500,
																					padding: "1px 10px",
																					borderRadius: "15px",
																					display: "inline-block",
																					fontSize: "12px"
																				}}>
																						  Report
																						</span>
																			)}
																			{value.table === "FileUpLoad" && (
																				<span style={{
																					marginLeft: 6,
																					color: "#ffffff",
																					backgroundColor: "#ED9480",
																					fontWeight: 500,
																					padding: "1px 10px",
																					borderRadius: "15px",
																					display: "inline-block",
																					fontSize: "12px"
																				}}>
																						  Files
																						</span>
																			)}

																			{(value.created_at && ((new Date() - new Date(value.created_at)) <= 24 * 60 * 60 * 1000)) &&
																				<span style={{
																					display: 'inline-block',
																					position: 'relative',
																					width: '16px',
																					height: '16px',
																					marginLeft: '4px',
																					verticalAlign: 'middle',
																				}}>
																					<Dot size={30} color="red" style={{
																						padding: 0,
																						position: 'absolute',
																						top: '10%',
																						left: '30%',
																						transform: 'translate(-50%, -50%)',
																					}} />
																				</span>
																			}


																		</span>


																	</div>

																)}
																{isFeatureBarVisible && (
																<div className={css.option_card}>
																	<div>
																		<div style={{
																			display: 'inline-flex',
																			alignItems: 'center',
																		}}>
																			{value.templateTable?.[0]?.isCombine && (
																				<span style={{
																					display: 'flex',
																					alignItems: 'center',
																					position: 'relative',
																					top: '1px',
																				}}>
																					  <ICON_VECTOR width={22}
																								   height={16} />
																					</span>
																			)}
																			{
																				value.table === 'FileUpLoad' &&
																				<span style={{
																					display: 'flex',
																					alignItems: 'center',
																					position: 'relative',
																					top: '1px',
																				}}>
																					<Paperclip  width={22}
																								height={16} color={'#868686'}/>
																					</span>
																			}

																			{ctList.filter(ct => ct.id_filenote == value?.id).length > 0 && (
																				<span style={{
																					display: 'flex',
																					color: '#868686',
																					fontSize: '13px',
																					alignItems: 'center',
																				}}
																					  onClick={async () => {
																						  try {
																							  const templateInfo = await getTemplateByFileNoteId(value?.id);
																							  const template = templateInfo[0];
																							  setTemplateData(template); // Set the template data
																							  setIsTemplateModalVisible(true); // Open the modal
																						  } catch (error) {
																							  console.error('Error fetching template data:', error);
																						  }
																					  }}

																				>
      																				<ICON_CHART width={22}
																								height={20} />
																					{ctList.filter(ct => ct.id_filenote == value.id).length}
    																		</span>
																			)}

																			{(() => {
																					const rotateCount = templateTables.filter(t =>
																					t.mother_table_id === value.templateTable?.[0]?.id &&
																					fileNotes.find(f => f.id === t.fileNote_id && f.show === true)
																					).length ;

																				return rotateCount > 0 && (
																					<span style={{
																						display: 'flex',
																						color: '#868686',
																						fontSize: '13px',
																						alignItems: 'center',
																					}}>
																						<ICON_BANG_XOAY width={22} height={14} />
																						{rotateCount}
																					</span>
																				);
																			})()}
																		</div>
																	</div>
																	{isBookmarked && !isNotEdit && (
																		<div
																			onClick={(e) => {
																				e.stopPropagation();
																				handleFavoriteClick(value.id);
																			}}
																		>
																			{favoriteIds.includes(value.id) ? (
																				<BookMark_On width={22} height={16} />
																			) : (
																				<BookMark_Off width={22} height={15} />
																			)}
																		</div>
																	)}
																</div>
																)}
															</div>
														</Dropdown>
													);
												});
												if (!hasVisible) {
													return <div className={`${css.menuItem}`}>Không có dữ liệu</div>;
												}
												return renderedNotes;
											})() : (
												<div className={`${css.menuItem}`}>Không có dữ liệu</div>
											)}
										</div>}
								</>;
							},
						)
						}

					</div>
					{/*<div className={css.extraInfo}>*/}
					{/*	<Button type={'text'}*/}
					{/*			onClick={handleOpenModal}>*/}
					{/*		<Create_Icon width={20} height={22} />*/}
					{/*		<span className={css.titleButton}>Mới</span>*/}
					{/*	</Button>*/}
					{/*	<Button type={'text'}*/}
					{/*			onClick={() => setIsModalFolderVisible(true)}*/}
					{/*	>*/}
					{/*		<FolderSetting_Icon width={22} height={22} />*/}
					{/*		<span className={css.titleButton}>Folder</span>*/}
					{/*	</Button>*/}
					{/*</div>*/}
					{/*<div className={css.textFooter}>*/}
					{/*	B-Canvas - SAB Platform*/}
					{/*</div>*/}
				</div>
				{/*<div className={css.content}>*/}
				{/*	<Outlet />*/}
				{/*</div>*/}
			</div>
			{isModalFolderVisible && <AddFolder isModalFolderVisible={isModalFolderVisible}
												setIsModalFolderVisible={setIsModalFolderVisible}
												handleCreateFolder={handleCreateFolder}
												setNewFolderData={setNewFolderData}
												newFolderData={newFolderData}
												tabs={tabs}
												editTabName={editTabName}
												editTabId={editTabId}
												setEditTabName={setEditTabName}
												updateTabName={updateTabName}
												swapPosition={swapPosition}
												setEditTabId={setEditTabId}
												loadFileTab={loadFileTab}
												swapFileNotePosition={swapFileNotePosition}
			/>}

			{isModalVisible && currenStepDuLieu?.path == 'du-lieu-dau-vao' &&
				<CreateData isModalVisible={isModalVisible}
							handleCloseModal={handleCloseModal}
							tabs={tabs}
							listUC_CANVAS={listUC_CANVAS}
							uCSelected_CANVAS={uCSelected_CANVAS}
							fetchData={loadFileTab}
							kpiList={kpiList}
							ctList={ctList}

				/>}

			{isModalVisible && currenStepDuLieu?.path == 'du-lieu-tong-hop' && menuVisibility.version == 'compact' &&
				<CreateDataFullType isModalVisible={isModalVisible}
									handleCloseModal={handleCloseModal}
									tabs={tabs}
									listUC_CANVAS={listUC_CANVAS}
									uCSelected_CANVAS={uCSelected_CANVAS}
									fetchData={loadFileTab}
									kpiList={kpiList}
									ctList={ctList}

				/>}

			{isModalVisible && currenStepDuLieu?.path == 'du-lieu-tong-hop' && menuVisibility.version == 'full' &&
				<CreateDataCombine isModalVisible={isModalVisible}
								   handleCloseModal={handleCloseModal}
								   tabs={tabs}
								   listUC_CANVAS={listUC_CANVAS}
								   uCSelected_CANVAS={uCSelected_CANVAS}
								   fetchData={loadFileTab}
								   kpiList={kpiList}
								   ctList={ctList}
								   listFileNote={listChain}

				/>}

			{isShowModalDuplicate && <CheckDuplicate isShowModalDuplicate={isShowModalDuplicate}
													 setIsShowModalDuplicate={setIsShowModalDuplicate}
													 fileNotes={fileNotes} // Pass the fileNote data here
			/>}

			{isModalChartVisible && (
				<Modal title="Danh sách Chart Template"
					   open={isModalChartVisible}
					   onCancel={() => setIsModalChartVisible(false)}
					   width={1300}
					   footer={false}
					   styles={{
						   body: {
							   padding: 0,
							   margin: 0,
							   height: '70vh',
							   overflow: 'auto',
						   },
					   }}
				>

					<ListChartTemplate />
					{/*	<div style={{ display: 'flex', gap: '16px' }}>*/}
					{/*		{chunkArray(ctList, 20).map((chunk, columnIndex) => (*/}
					{/*			<div key={columnIndex} style={{ flex: '1', width: '200px',  }}>*/}
					{/*				{chunk.map((chart, index) => (*/}
					{/*					<div key={index} style={{ display: 'flex', marginBottom: '16px', alignItems: 'center', justifyContent: 'space-between', width: '200px' }}>*/}
					{/*						<span>{chart.name}</span>*/}
					{/*						<Switch*/}
					{/*							checked={chart.created}*/}
					{/*							onChange={async (checked) => {*/}
					{/*								const updatedCtList = ctList.map((item) =>*/}
					{/*									item.id === chart.id*/}
					{/*										? { ...item, created: checked, id_fileNote: checked ? item.id_filenote : 3 }*/}
					{/*										: item*/}
					{/*								);*/}
					{/*								setCtList(updatedCtList);*/}

					{/*								// Update the database*/}
					{/*								try {*/}
					{/*									await updateChartTemplate({*/}
					{/*										id: chart.id,*/}
					{/*										created: checked,*/}
					{/*										id_fileNote: checked ? chart.id_fileNote : 3,*/}
					{/*									});*/}

					{/*								} catch (error) {*/}
					{/*									console.error('Error updating database:', error);*/}
					{/*								}*/}
					{/*							}}*/}
					{/*						/>*/}
					{/*					</div>*/}
					{/*				))}*/}
					{/*			</div>*/}
					{/*		))}*/}
					{/*	</div>*/}


				</Modal>
			)}
			{isTemplateModalVisible && (
				<Modal
					title="Danh sách biểu đồ"
					open={isTemplateModalVisible}
					onCancel={() => setIsTemplateModalVisible(false)}
					footer={null}
					width={1300}
				>
					<ListChartTemplate templateData={templateData} />
				</Modal>
			)}

			{isModalKpiVisible && (
				<Modal
					title="Danh sách chỉ số"
					open={isModalKpiVisible}
					onCancel={() => setIsModalKpiVisible(false)}
					footer={null}
					bodyStyle={{ padding: '16px', maxHeight: '80vh', overflowY: 'auto' }}
					style={{ width: 'auto', maxWidth: '90%' }}
				>
					<div style={{ display: 'flex', gap: '16px' }}>
						{chunkArray(kpiList, 10).map((chunk, columnIndex) => (
							<div key={columnIndex} style={{ flex: '1', width: '200px' }}>
								{chunk.map((kpi, index) => (
									<div
										key={index}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											marginBottom: '16px',
											width: '200px',
										}}
									>
										<span>{kpi.name}</span>
										<Switch
											checked={kpi.created}
											onChange={(checked) => {
												const updatedKpiList = kpiList.map((item) =>
													item.id === kpi.id ? { ...item, created: checked } : item,
												);
												setKpiList(updatedKpiList);
											}}
										/>
									</div>
								))}
							</div>
						))}
					</div>
				</Modal>
			)}
			{
				showKpi && <Modal title=""
								  centered
								  width={1500}
								  open={showKpi}
								  onOk={() => setShowKpi(false)}
								  onCancel={() => setShowKpi(false)}
								  styles={{
									  body: {
										  height: '850px',
									  },
								  }}
								  footer={null}
								  maskClosable={false}
								  className={css.modalKPI}
				>
					<KPI />
				</Modal>
			}


			<Modal
				title="Đổi tên"
				open={isRenameModalVisible}
				onOk={handleRenameFileNotePad}
				onCancel={() => {
					setIsRenameModalVisible(false);
					setSelectedIcon(selectedFile?.info?.iconSideBar || null);
				}}
				okText="Lưu"
				cancelText="Hủy"
			>
				<div style={{ marginBottom: 16 }}>
					<div style={{
						marginBottom: 8,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}>
						<span>Chọn biểu tượng:</span>
						{selectedIcon && (
							<Button
								type="text"
								danger
								size="small"
								onClick={() => setSelectedIcon(null)}
							>
								Xóa icon
							</Button>
						)}
					</div>
					<div style={{
						display: 'flex',
						gap: 8,
						flexWrap: 'wrap',
						maxHeight: '120px',
						overflowY: 'auto',
						padding: '8px',
						border: '1px solid #d9d9d9',
						borderRadius: '4px',
					}}>
						{ICON_SIDEBAR_LIST.map(({ name, icon }) => (
							<div
								key={name}
								onClick={() => setSelectedIcon(name)}
								style={{
									padding: '8px',
									cursor: 'pointer',
									border: selectedIcon === name ? '2px solid #1890ff' : '2px solid transparent',
									borderRadius: '4px',
								}}
							>
								<img
									src={icon}
									alt={name}
									width={20}
									height={20}
								/>
							</div>
						))}
					</div>
				</div>
				<Input
					value={newFileName}
					onChange={(e) => setNewFileName(e.target.value)}
					placeholder="Nhập tên mới"
				/>
			</Modal>
		</>
	);
};

