import css from './SidebarDM.module.css';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Input, Checkbox, Modal, Dropdown, Menu, Button, Popconfirm, Switch, message, Radio, Form, Select, Tooltip } from 'antd';
import { MyContext } from '../../../MyContext.jsx';
import { createFileTab, getFileTabByTypeData, updateFileTab } from '../../../apis/fileTabService.jsx';
import AddFolder from '../../Canvas/Daas/Sidebar/Action/AddFolder.jsx';
import { deleteFileNotePad, getAllFileNotePad, updateFileNotePad, createNewFileNotePad } from '../../../apis/fileNotePadService.jsx';
import { getCurrentUserLogin, updateUser } from '../../../apis/userService.jsx';
import CreateData from '../../Canvas/DuLieu/CreateData/CreateData.jsx';
import { findRecordsByConditions } from '../../../apis/searchModelService.jsx';
import { getFileNotePadById } from '../../../apis/public/fileNotePadService.jsx';
import { getAllTemplateSheetTable, getTemplateByFileNoteId, createTemplateTable, getTemplateColumn, createTemplateColumn, updateTemplateTable, getTableByid } from '../../../apis/templateSettingService.jsx';
import { Dot, Paperclip, FolderOpen, FolderClosed } from 'lucide-react';
import SidebarLoadingIcon from '../../../components/SidebarLoadingIcon.jsx';
import CreateDataCombine from '../../Canvas/DuLieu/CreateData/CreateDataCombine.jsx';
import CheckDuplicate from '../../Canvas/DuLieu/CheckDuplicate/CheckDuplicate.jsx';
import ListChartTemplate from '../../Canvas/Daas/Content/Template/SettingChart/ChartTemplate/ChartTemplateList/ListChartTemplate.jsx';
import { getAllKpi2Calculator } from '../../../apis/kpi2CalculatorService.jsx';
import { getAllChartTemplate } from '../../../apis/chartTemplateService.jsx';
import KPI from '../../Canvas/DuLieu/CanvasDuLieuTongHop/KPI.jsx';
import CreateDataFullType from '../../Canvas/DuLieu/CreateData/CreateDataFullType.jsx';
import { createSetting, getSettingByType, updateSetting } from '../../../apis/settingService.jsx';
import { getAllApprovedVersion, deleteApprovedVersion } from '../../../apis/approvedVersionTemp.jsx';
import { Link as LucideLink } from 'lucide-react';
import { getAllUserClass, getUserClassByEmail } from '../../../apis/userClassService.jsx';
import { LoadingOutlined, SettingOutlined } from '@ant-design/icons';
import {
	ADD_NEW,
	BookMark_Off,
	BookMark_On,
	ICON_BANG_XOAY,
	ICON_CHART,
	ICON_SIDEBAR_LIST,
	ICON_VECTOR,
	Search_Icon,
} from '../../../icon/svg/IconSvg.jsx';

// Đổi tên component thành SidebarDM
export default function SidebarDM() {
	const { companySelect, buSelect, idFileNote } = useParams();
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
	const [isDeleting, setIsDeleting] = useState(false);
	const [contextValue, setContextValue] = useState(null);
	const [contextParentKey, setContextParentKey] = useState(null);
	const popconfirmRef = useRef(null);
	const [selectedIcon, setSelectedIcon] = useState(selectedFile?.info?.iconSideBar || null);
	const [isModalChartVisible, setIsModalChartVisible] = useState(false);
	const [isModalKpiVisible, setIsModalKpiVisible] = useState(false);
	const [showKpi, setShowKpi] = useState(false);
	const [isShowModalDuplicate, setIsShowModalDuplicate] = useState(false);
	const [fileNotes, setFileNotes] = useState([]);
	const [isFeatureBarVisible, setIsFeatureBarVisible] = useState(true);
	const [filteredTabs, setFilteredTabs] = useState([]);
	const [selectedTemplates, setSelectedTemplates] = useState([]);
	const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
	const [templateData, setTemplateData] = useState([]);
	const [templateTables, setTemplateTables] = useState([]);
	// const [userClasses, setUserClasses] = useState([]);
	const [approvedVersionMap, setApprovedVersionMap] = useState({});
	const [isUserClassModalVisible, setIsUserClassModalVisible] = useState(false);
	const [isUploadLimitModalVisible, setIsUploadLimitModalVisible] = useState(false);
	const [uploadLimitConfig, setUploadLimitConfig] = useState({
		max_record: 50000,
		max_column: 25
	});
	const [uploadLimitLoading, setUploadLimitLoading] = useState(false);
	const [existingUploadLimitSetting, setExistingUploadLimitSetting] = useState(null);
	const [selectedUserClassFile, setSelectedUserClassFile] = useState(null);
	const [selectedUserClasses, setSelectedUserClasses] = useState(new Set());
	const [allUserClasses, setAllUserClasses] = useState([]);
	const [userClassSearchText, setUserClassSearchText] = useState('');
	const [userClassFilter, setUserClassFilter] = useState('all');
	const [currentUserClasses, setCurrentUserClasses] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const theme = localStorage.getItem('theme') || 'light';

	const [form] = Form.useForm();

	const handleOpenBookmark = () => {
		setIsOpenBookmark(!isOpenBookmark);
	};
	const {
		loadDataDuLieu,
		userClasses,
		fetchUserClasses,
		uCSelected_CANVAS,
		currentUser,
		listUC_CANVAS,
		currenStepDuLieu,
		runningStep,
		currentFileNoteId,
		runningFileNotes,
		fileNoteQueue,
		isProcessingQueue,
		currentRunningFileNote,
	} = useContext(MyContext);
	
	const handleOpenModal = () => {
		setIsModalVisible(true);
		// Auto focus vào ô input đầu tiên sau khi modal mở
		setTimeout(() => {
			const firstInput = document.querySelector('input[placeholder*="Nhập tên"]');
			if (firstInput) {
				firstInput.focus();
				firstInput.select();
			}
		}, 100);
	};



	const handleFeatureBarToggle = (e) => {
		setIsFeatureBarVisible(e.target.checked);
	};


	const loadFileTab = async () => {
		// const fileTabs = await getFileTabByType('data', 'du-lieu-dau-vao');
		let fileTabs = await getFileTabByTypeData();
		fileTabs = fileTabs.filter((tab) => tab.position < 100 && tab.table == 'du-lieu-dau-vao' && tab.type == 'data');
		fileTabs.sort((a, b) => a.position - b.position);

		// Lọc danh sách yêu thích theo quyền truy cập
		const filteredFavorites = listFavorite.filter(favorite => hasFileAccess(favorite));

		setTabs([
			{
				id: 0,
				key: 'tapFavorite',
				label: 'Danh sách yêu thích',
				listFileNote: filteredFavorites,
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

		switch (value.table) {
			case 'FileUpLoad':
				newPath = `/data-manager/file/${value.id}`;
				break;
			case 'Template':
				newPath = `/data-manager/data/${value.id}`;
				break;
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
		// Xóa trạng thái unread cho fileNote này khi người dùng click vào
		try {
			const key = 'unreadFileNotes';
			const raw = localStorage.getItem(key);
			const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw).map(String) : [];
			const next = arr.filter((id) => id !== String(itemId));
			localStorage.setItem(key, JSON.stringify(next));
		} catch (_) { }
		handleNavigate(value);

		await updateViewStateForDuLieu({
			data: {
				selectedItemId: itemId,
				selectedFolder: tabKey,
			},
			updateActiveSubTab: true,
		});


	};
const fetchUploadLimitConfig = async () => {
		try {
			const data = await getSettingByType('LIMIT_UPLOAD_SIZE_CONFIG');
			if (data && (!data.setting || data.setting == '' )) {
				updateSetting({
					...data,
					setting: {
						max_record: 50000,
						max_column: 25
					}
				});
			}
		} catch (error) {
			console.error('Error fetching upload limit config:', error);
		}
	};

	useEffect(() => {
		
			fetchUploadLimitConfig();
		
	}, []);


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

			// Lọc file theo quyền truy cập sử dụng hàm hasFileAccess
			const userAccess = fileNotesWithRotateCount.filter((item) => hasFileAccess(item));
			setListChain(userAccess);
		} catch (error) {
			console.error('Error fetching card data:', error);
		}
	};

	useEffect(() => {
		if (currenStepDuLieu?.path == 'du-lieu-tong-hop' && currentUserClasses.length > 0) {
			fetchData();
		}
	}, [currenStepDuLieu?.path, loadDataDuLieu, currentUserClasses]);

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

	// useEffect(() => {
	// 	if (!id) fetchLastView();
	// }, [currenStepDuLieu?.path, id]);

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
	}, [listFavorite, loadDataDuLieu, currentUserClasses]);

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
		if (isSubmitting) return; // Prevent closing while submitting
		setIsModalVisible(false);
		setIsSubmitting(false); // Reset submitting state when modal closes
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
		setIsDeleting(true);
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

			// Xóa tất cả approveVersion liên quan đến các fileNote trước khi xóa fileNote
			try {
				const allApprovedVersions = await getAllApprovedVersion();
				let deletedApprovedVersionCount = 0;

				for (const fileNoteId of fileNotesToDelete) {
					// Tìm tất cả approveVersion có id_fileNote trùng khớp
					const relatedApprovedVersions = allApprovedVersions.filter(v => v.id_fileNote == fileNoteId);

					// Xóa từng approveVersion
					for (const approvedVersion of relatedApprovedVersions) {
						try {
							await deleteApprovedVersion(approvedVersion.id);
							deletedApprovedVersionCount++;
						} catch (deleteError) {
							console.error(`Lỗi khi xóa approveVersion ${approvedVersion.id}:`, deleteError);
							// Tiếp tục xóa các approveVersion khác nếu có lỗi
						}
					}
				}

				if (deletedApprovedVersionCount > 0) {
					console.log(`Đã xóa tổng cộng ${deletedApprovedVersionCount} approveVersion liên quan`);
				}
			} catch (error) {
				console.error('Lỗi khi xóa approveVersion:', error);
				// Không dừng quá trình xóa fileNote nếu có lỗi xóa approveVersion
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
		} finally {
			setIsDeleting(false);
			setShowDeleteConfirm(false);
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

	// Lắng nghe sự kiện từ KeyboardShortcut
	useEffect(() => {
		const handleOpenCreateModal = () => {
			handleOpenModal();
		};

		const handleAddFile = () => {
			// Gọi form submit để trigger onFinish
			form.submit();
		};

		const handleFocusSearch = () => {
			// Focus vào ô tìm kiếm
			const searchInput = document.querySelector('input[placeholder*="Tìm kiếm"]');
			if (searchInput) {
				searchInput.focus();
				searchInput.select();
			}
		};

		window.addEventListener('openCreateModal', handleOpenCreateModal);
		window.addEventListener('addFile', handleAddFile);
		window.addEventListener('focusSearch', handleFocusSearch);
		
		return () => {
			window.removeEventListener('openCreateModal', handleOpenCreateModal);
			window.removeEventListener('addFile', handleAddFile);
			window.removeEventListener('focusSearch', handleFocusSearch);
		};
	}, [handleOpenModal, form]);


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


	const getContextMenuItems = (value) => {
		const isNotEdit = location?.pathname.includes('du-lieu-dau-vao') ? value.isNotEdit : false;
		const canManagePermissions = currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin;

		const baseItems = [
			{
				key: '1',
				label: 'Đổi tên',
				disabled: isNotEdit,
			},
			{
				key: '2',
				label: 'Xóa',
				disabled: isNotEdit,
			},
			{
				key: '4',
				label: 'Nhân bản',
				disabled: isNotEdit,
			},
		];

		if (canManagePermissions) {
			baseItems.push({
				key: '3',
				label: 'Cài đặt quyền',
				disabled: isNotEdit,
			});
		}

		return baseItems;
	};

	const handleMenuClick = ({ key }) => {
		if (key === '1') {
			setSelectedFile(contextValue);
			setNewFileName(contextValue?.name);
			setIsRenameModalVisible(true);
		} else if (key === '2') {
			setShowDeleteConfirm(true);
		} else if (key === '3') {
			setSelectedUserClassFile(contextValue);
			setSelectedUserClasses(new Set(contextValue?.userClass || []));
			setUserClassSearchText('');
			setUserClassFilter('all');
			setIsUserClassModalVisible(true);
		} else if (key === '4') {
			if (contextValue) {
				duplicateFileNoteAndTemplate(contextValue, contextParentKey);
			}
		}
	};

	// Duplicate a FileNotePad and its associated TemplateTable (structure only)
	const duplicateFileNoteAndTemplate = async (fileNote, parentKey) => {
		const hideLoading = message.loading('Đang nhân bản...', 0);
		try {
			// 1) Create new FileNotePad
			const newName = `${fileNote.name} - Copy`;
			const payload = {
				name: newName,
				tab: parentKey || fileNote.tab,
				table: 'Template',
				user_create: currentUser?.email,
				created_at: new Date().toISOString(),
				show: true,
				info: fileNote.info || {},
				userClass: Array.isArray(fileNote.userClass) ? fileNote.userClass : [],
			};
			const created = await createNewFileNotePad(payload);
			const newFileNote = created?.data || created;
			if (newFileNote?.id) {
				newFileNote.code = `Template_${newFileNote.id}`;
				await updateFileNotePad(newFileNote);
			}

			// 2) Fetch source template table
			const templates = await getTemplateByFileNoteId(fileNote.id);
			const sourceTemplate = Array.isArray(templates) ? templates[0] : null;

			// 3) Create new template table for the new FileNotePad
			let newTemplate = null;
			if (newFileNote?.id) {
				const ctPayload = {
					fileNote_id: newFileNote.id,
					isCombine: sourceTemplate?.isCombine || false,
				};
				newTemplate = await createTemplateTable(ctPayload);
			}

			// 4) Duplicate columns (structure)
			if (sourceTemplate?.id && newTemplate?.id) {
				const columns = await getTemplateColumn(sourceTemplate.id);
				if (Array.isArray(columns)) {
					for (const col of columns) {
						try {
							await createTemplateColumn({
								tableId: newTemplate.id,
								columnName: col.columnName || col.name || col.title,
								type: col.type || col.dataType || 'text',
								show: col.show !== false,
								frozen: !!col.frozen,
								width: col.width || 120,
								index: col.index || col.order || undefined,
							});
						} catch (e) {
							// continue creating other columns
						}
					}
				}
			}

			// 5) Duplicate steps configuration (pipeline)
			try {
				let sourceSteps = sourceTemplate?.steps;
				if (!sourceSteps && sourceTemplate?.id) {
					const fullSource = await getTableByid(sourceTemplate.id);
					sourceSteps = fullSource?.steps;
				}
				if (newTemplate?.id && Array.isArray(sourceSteps)) {
					const clonedSteps = sourceSteps.map(step => ({ ...step, needUpdate: true }));
					await updateTemplateTable({ id: newTemplate.id, steps: clonedSteps });
				}
			} catch (e) {
				// ignore step copy failure; columns already duplicated
			}

			// 6) Refresh and navigate to new node
			await loadFileTab();
			if (newFileNote?.id) {
				const itemNavigate = { id: newFileNote.id, table: 'Template' };
				handleNavigate(itemNavigate);
			}
			message.success('Nhân bản thành công');
		} catch (error) {
			console.error('Duplicate error:', error);
			message.error('Nhân bản thất bại');
		} finally {
			hideLoading();
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

	const handleSaveUserClass = async () => {
		try {
			await updateFileNotePad({
				...selectedUserClassFile,
				userClass: Array.from(selectedUserClasses),
			});
			message.success('Cập nhật quyền thành công');
			setIsUserClassModalVisible(false);
			await loadFileTab();
		} catch (error) {
			console.error('Error updating user class:', error);
			message.error('Có lỗi xảy ra khi cập nhật quyền');
		}
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

	// Upload limit modal handlers
	const handleOpenUploadLimitModal = async () => {
		try {
			setUploadLimitLoading(true);
			const existingSetting = await getSettingByType('LIMIT_UPLOAD_SIZE_CONFIG');
			if (existingSetting && existingSetting.setting) {
				setUploadLimitConfig(existingSetting.setting);
				setExistingUploadLimitSetting(existingSetting);
			} else {
				setExistingUploadLimitSetting(null);
			}
			setIsUploadLimitModalVisible(true);
		} catch (error) {
			console.error('Error loading upload limit config:', error);
			message.error('Không thể tải cấu hình giới hạn upload');
		} finally {
			setUploadLimitLoading(false);
		}
	};

	const handleUploadLimitConfigChange = (field, value) => {
		setUploadLimitConfig(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleSaveUploadLimitConfig = async () => {
		try {
			setUploadLimitLoading(true);
			const settingData = {
				type: 'LIMIT_UPLOAD_SIZE_CONFIG',
				setting: uploadLimitConfig
			};
			
			if (existingUploadLimitSetting) {
				// Update existing setting
				await updateSetting({
					...settingData,
					id: existingUploadLimitSetting.id
				});
			} else {
				// Create new setting
				await createSetting(settingData);
			}
			
			message.success('Cấu hình giới hạn upload đã được lưu thành công');
			setIsUploadLimitModalVisible(false);
		} catch (error) {
			console.error('Error saving upload limit config:', error);
			message.error('Có lỗi xảy ra khi lưu cấu hình');
		} finally {
			setUploadLimitLoading(false);
		}
	};

	const handleCancelUploadLimitModal = () => {
		setIsUploadLimitModalVisible(false);
		setUploadLimitConfig({
			max_record: 50000,
			max_column: 25
		});
		setExistingUploadLimitSetting(null);
	};

	// Kiểm tra quyền truy cập file
	const hasFileAccess = (fileNote) => {
		// Admin, Editor, SuperAdmin có quyền truy cập tất cả
		if (currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) {
			return true;
		}

		// Kiểm tra userClass của file có khớp với userClass của user không
		if (fileNote?.userClass && Array.isArray(fileNote.userClass) && fileNote.userClass.length > 0) {
			const userClassIds = currentUserClasses.map(uc => uc.id);
			return fileNote.userClass.some(fileUserClassId => userClassIds.includes(fileUserClassId));
		}

		return false;
	};

	// Filter user classes based on search and filter
	const filteredUserClasses = allUserClasses
		.filter(userClass => userClass.module === 'DASHBOARD') // Chỉ lấy module DASHBOARD
		.filter(userClass => {
			const matchesSearch = userClass.name.toLowerCase().includes(userClassSearchText.toLowerCase());

			const matchesFilter = userClassFilter === 'all' ||
				(userClassFilter === 'selected' && selectedUserClasses.has(userClass.id)) ||
				(userClassFilter === 'unselected' && !selectedUserClasses.has(userClass.id));

			return matchesSearch && matchesFilter;
		});


	const RenderCaiDat = () => {
		return (
			currenStepDuLieu?.path == 'du-lieu-tong-hop' ?
				<Dropdown
					overlay={
						<Menu>
							<Menu.Item key="2" onClick={() => {
								setIsModalFolderVisible(true);
								setIsDropdownVisible(false); // đóng dropdown
							}}
								style={{ fontSize: 15 }}
							>
								Thư mục
							</Menu.Item>

							<Menu.Item key="4" onClick={() => {
								setIsModalChartVisible(true);
								setIsDropdownVisible(false);
							}}
								style={{ fontSize: 15 }}>
								Xem danh sách biểu đồ
							</Menu.Item>
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
					style={{ backgroundColor: theme === 'dark' ? ' #5B7191' : '' }}
					onClick={() => setIsModalFolderVisible(true)}
				>
					<span style={{ color: theme === 'dark' ? '#fff' : '#000000e0', }}>Cài đặt thư mục</span>

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


	useEffect(() => {
		if (isModalVisible) {
			const firstFolderId = tabs.filter(tab => tab.id !== 0 && !tab.hide)[0]?.id;
			form.setFieldsValue({
				type: 'Template',
				name: '',
				folderId: firstFolderId
			});
		}
	}, [isModalVisible, tabs]);

	// Fetch approved versions and map fileNoteId to distributed apps
	useEffect(() => {
		async function fetchApprovedVersions() {
			try {
				const approvedVersions = await getAllApprovedVersion();
				// Map fileNoteId to a Set of distributed apps (excluding null/empty)
				const map = {};
				approvedVersions.forEach(v => {
					if (Array.isArray(v.apps) && v.apps.length > 0 && v.id_fileNote) {
						if (!map[v.id_fileNote]) map[v.id_fileNote] = new Set();
						v.apps.forEach(app => map[v.id_fileNote].add(app));
					}
				});
				setApprovedVersionMap(map);
			} catch (e) {
				// ignore error
			}
		}
		fetchApprovedVersions();
	}, []);

	// Fetch all user classes
	useEffect(() => {
		async function fetchUserClasses() {
			try {
				const userClasses = await getAllUserClass();
				setAllUserClasses(userClasses);
			} catch (error) {
				console.error('Error fetching user classes:', error);
			}
		}
		fetchUserClasses();
	}, []);

	// Fetch current user's user classes
	useEffect(() => {
		async function fetchCurrentUserClasses() {
			try {
				const userClasses = await getUserClassByEmail();
				setCurrentUserClasses(userClasses);
			} catch (error) {
				console.error('Error fetching current user classes:', error);
				setCurrentUserClasses([]);
			}
		}
		fetchCurrentUserClasses();
	}, []);

	useEffect(() => {
		// Mở hết tất cả folder khi tabs thay đổi (chỉ lần đầu hoặc khi tabs thay đổi)
		if (tabs.length > 0) {
			const allOpen = {};
			tabs.forEach(tab => {
				allOpen[tab.id] = true;
			});
			setOpenCategories(allOpen);
		}
	}, [tabs]);

	useEffect(() => {
		// Nếu có param id trên URL, tự động chọn file trên sidebar
		if (idFileNote && tabs.length > 0) {
			// Tìm tab chứa fileNotePad có id này
			let foundTab = null;
			let foundFile = null;
			tabs.forEach(tab => {
				if (tab.listFileNote && Array.isArray(tab.listFileNote)) {
					const file = tab.listFileNote.find(note => String(note.id) === String(idFileNote));
					if (file) {
						foundTab = tab;
						foundFile = file;
					}
				}
			});
			if (foundTab && foundFile) {
				setSelectedTap(foundTab.key);
				setSelectedItem(foundFile.id);
				setOpenCategories(prev => ({ ...prev, [foundTab.id]: true }));
				// Scroll tới file nếu cần (nếu có ref, hoặc có thể highlight)
			}
		}
	}, [idFileNote, tabs]);

	return (
		<>
			<div className={css.main} style={{ backgroundColor: theme === 'dark' ? '#334155' : '#f0f0f0', borderRadius: theme === 'dark' ? '0px' : '' }}>
				<div className={css.sidebar} >
					<div className={css.headerSidebar}>
						<div className={css.searchContainer}>
							<Input
								className={theme === 'dark' ? css.searchBoxDark : css.searchBox}
								value={searchText}
								onChange={handleSearchChange}
								prefix={<Search_Icon width={16} />}
								placeholder="Tìm kiếm..."
								style={{
									backgroundColor: theme === 'dark' ? 'rgb(90, 113, 145)' : '',
									height: '100%',
								}}
							/>
						</div>
						<div className={css.toggleContainer} style={{ height: '100%' }}>
							<Button
								onClick={handleToggleAllCategories}
								className={` ${isOpenBookmark ? theme === 'dark' ? css.activeDark : css.active : ''}`}
								style={{
									width: '120px', backgroundColor: theme === 'dark' ? 'rgb(90, 113, 145)' : '', color: theme === 'dark' ? '#fff' : '#000000e0'
									, display: 'flex',
									alignItems: 'center',
									justifyContent: 'start',
									height: '100%',

								}}

							>
								<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', gap: '10px' }}>	{Object.values(openCategories).every(isOpen => isOpen) ? <FolderOpen width={16} /> : <FolderClosed width={16} />}</span>
								<span className={css.toggleText}>
									{Object.values(openCategories).every(isOpen => isOpen) ? 'Đóng Folder' : 'Mở Folder'}
								</span>
							</Button>
						</div>
					</div>
					{currentUser && (currentUser.isAdmin || currentUser.isSuperAdmin || currentUser.isEditor) && isFeatureBarVisible && (
						<div className={css.buttonActionGroup}>
							<Tooltip title="Shift + N">
								<div className={`${css.buttonAction} ${isModalVisible ? css.active : ''}`}
									style={{ backgroundColor: theme === 'dark' ? 'rgb(90, 113, 145)' : '' }}
									onClick={handleOpenModal}
								>
									<ADD_NEW width={15} height={15} color={theme === 'dark' ? '#fff' : '#000000e0'} />
								</div>
							</Tooltip>
							<RenderCaiDat />
							<div className={`${css.buttonAction} ${isOpenBookmark ? theme === 'dark' ? css.activeDark : css.active : ''}`}
								style={{ backgroundColor: theme === 'dark' ? 'rgb(90, 113, 145)' : '', color: theme === 'dark' ? '#fff' : '#000000e0' }}
								onClick={handleOpenBookmark}
							>
								<span style={{ color: theme === 'dark' ? '#fff' : '#000000e0' }}>Yêu thích</span>
							</div>
							<div>
								{(runningFileNotes && runningFileNotes.size > 0) ? (
									<Button style={{ height: '100%', width: '31px', borderRadius: '50%', border: '1px solid #d9d9d9', position: 'relative', padding: '0px' }} title="Số file đang chạy queue">
										<span style={{ fontSize: '12px', fontWeight: 'bold', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>{runningFileNotes.size}</span>
										<LoadingOutlined style={{ position: 'absolute', fontSize: '30px', color: '#1890ff' }} />
									</Button>
								) :
									<>
										{currentUser && (currentUser.isSuperAdmin) && (
											<Tooltip title="Cài đặt giới hạn file">	
											<Button 
												className={`${css.buttonAction}`} 
												style={{ backgroundColor: theme === 'dark' ? 'rgb(90, 113, 145)' : '', color: theme === 'dark' ? '#fff' : '#000000e0', borderRadius: '50%', width: '31px', height: '100%' }}
												onClick={handleOpenUploadLimitModal}
												loading={uploadLimitLoading}
											>
												<SettingOutlined />
											</Button>
											</Tooltip>
										)}
									</>
								}
							</div>
						</div>
					)}
					<div
						className={`${theme === 'dark' ? css.menuDark : css.menu} ${isFeatureBarVisible ? css.menuWithButton : ''}`}
					>
						{filteredTabs.map((item) => {
							if (item.hide) return null;
							const isOpen = openCategories[item.id];
							return (
								<div key={item.id}>
									<div
										className={css.sidebarTitle}
										onClick={() => toggleCategory(item.id)}
										style={{ cursor: 'pointer' }}
									>
										<div className={css.folderRight}>
											{/*<Folder_Icon width={18} />*/}
											<span style={{ color: theme === 'dark' ? '#fff' : '#000000e0' }}>{item.label}</span>
										</div>
									</div>

									{isOpen &&
										<div style={{ marginBottom: '15px' }}>

											{item.listFileNote?.length > 0 ? (() => {
												let hasVisible = false;
												const renderedNotes = item.listFileNote.filter(item => item.table === 'Template' || item.table === 'FileUpLoad').map((value, idx) => {
													// Kiểm tra quyền truy cập sử dụng hàm hasFileAccess
													if (!hasFileAccess(value)) return null;
													hasVisible = true;
													const isBookmarked = favoriteIds.includes(value.id) || hoveredId == value.id;
													const isNotEdit = location?.pathname.includes('du-lieu-dau-vao') ? value.isNotEdit : false;
													return (
														<Dropdown
															key={idx}
															trigger={isNotEdit ? [] : ['contextMenu']}
															menu={!isNotEdit ? {
																items: getContextMenuItems(value),
																onClick: handleMenuClick,
															} : undefined}
														>
															<div
																ref={showDeleteConfirm && contextValue?.id === value.id ? popconfirmRef : null}
																onMouseEnter={() => setHoveredId(value.id)}
																onMouseLeave={() => setHoveredId(null)}
																className={`${theme === 'dark' ? css.menuItemDark : css.menuItem} ${isNotEdit ? css.disabledItem : ''} ${selectedTap == item.key && ((idFileNote || selectedItem) == value.id)
																	? theme === 'dark' ? css.menuItemActiveDark : css.menuItemActive
																	: ''
																	}`}
																onClick={!isNotEdit ? () => handleClickMenu(item.key, value.id, value) : undefined}
																onContextMenu={!isNotEdit ? (e) => handleContextMenu(e, value, item.key) : undefined}
																style={{ color: theme === 'dark' ? '#fff' : '#000000e0', }}
															>
																{showDeleteConfirm && contextValue?.id === value.id ? (
																	<Popconfirm
																		open={true}
																		placement="topRight"
																		title="Bạn có chắc chắn muốn xóa?"
																		onConfirm={() => {
																			handleDeleteFileNotePad(contextValue?.id, contextParentKey);
																		}}
																		onCancel={(e) => {
																			e.stopPropagation();
																			setShowDeleteConfirm(false);
																		}}
																		okText={isDeleting ? "Đang xóa..." : "Có"}
																		cancelText="Không"
																		okButtonProps={{
																			loading: isDeleting,
																			disabled: isDeleting
																		}}
																		cancelButtonProps={{
																			disabled: isDeleting
																		}}
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
																			<span className={css.titleCard}>
																				{/* Show loading icon if this file is in the running list */}
																				{runningFileNotes.has(String(value.id)) && (
																					<SidebarLoadingIcon size={12} color={theme === 'dark' ? '#fff' : '#1890ff'} />
																				)}
																				{value.name}
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
																		<span className={css.titleCard}>
																			{value.name}
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
																			{/* Link icon if distributed to other apps */}
																			{approvedVersionMap[value.id] && approvedVersionMap[value.id].size > 0 && (
																				<span style={{ marginLeft: 8, alignItems: 'center', display: 'flex', justifyContent: 'center' }} title="Có phân phối sang app khác" >
																					<LucideLink size={14} color="#888" />
																				</span>
																			)}

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
																					).length;

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
																				style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}
																			>
																				{favoriteIds.includes(value.id) ? (
																					<BookMark_On width={22} height={14} />
																				) : (
																					<BookMark_Off width={22} height={14} />
																				)}
																			</div>
																		)}

																		{/* Show loading icon if this file is in the running list */}
																		{runningFileNotes.has(String(value.id)) && (
																			<div style={{ margin: '0 8px' }}>
																				<SidebarLoadingIcon size={12} color={theme === 'dark' ? '#fff' : '#1890ff'} />
																			</div>
																		)}
																		{(() => {
																			try {
																				const raw = localStorage.getItem('unreadFileNotes');
																				const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw).map(String) : [];
																				if (arr.includes(String(value.id))) {
																					return (
																						<span title="Có cập nhật chưa xem" >
																							<Dot size={30} color="#faad14" />
																						</span>
																					);
																				}
																			} catch (_) { }
																			return null;
																		})()}
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
								</div>
							);
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

			<Modal
				title="Thêm dữ liệu"
				open={isModalVisible}
				onCancel={handleCloseModal}
				width={500}
				footer={false}
				closable={!isSubmitting}
				maskClosable={!isSubmitting}
			>
				<Form
					form={form}
					layout="vertical"
					onFinish={async (values) => {
						if (isSubmitting) return; // Prevent multiple submissions

						setIsSubmitting(true);
						try {
							let newData = {
								name: values.name,
								tab: tabs.find(tab => tab.id === values.folderId)?.key,
								table: values.type,
								user_create: currentUser?.email,
								created_at: new Date().toISOString(),
								show: true,
							};
							const data = await createNewFileNotePad(newData);
							data.data.code = `${values.type}_${data.data.id}`;
							await updateFileNotePad(data.data);
							message.success('Tạo dữ liệu thành công!');
							handleCloseModal();
							await loadFileTab();
						} catch (err) {
							message.error('Tạo dữ liệu thất bại!');
						} finally {
							setIsSubmitting(false);
						}
					}}
					initialValues={{
						type: 'Template',
						folderId: tabs.filter(tab => tab.id !== 0 && !tab.hide)[0]?.id
					}}
				>
					<Form.Item
						label="Loại dữ liệu"
						name="type"
						rules={[{ required: true, message: 'Vui lòng chọn loại dữ liệu!' }]}
					>
						<Radio.Group>
							<Radio.Button value="Template">Bảng dữ liệu</Radio.Button>
						</Radio.Group>
					</Form.Item>
					<Form.Item
						label="Tên"
						name="name"
						rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
					>
						<Input placeholder="Nhập tên dữ liệu..." />
					</Form.Item>
					<Form.Item
						label="Thư mục"
						name="folderId"
						rules={[{ required: true, message: 'Vui lòng chọn thư mục!' }]}
					>
						<Select
							placeholder="Chọn thư mục"
							showSearch
							optionFilterProp="children"
						>
							{tabs
								.filter(tab => tab.id !== 0 && !tab.hide)
								.map(tab => (
									<Select.Option key={tab.id} value={tab.id}>
										{tab.label}
									</Select.Option>
								))}
						</Select>
					</Form.Item>
					<Form.Item>
						<Tooltip title="Shift + A">
							<Button
								type="primary"
								htmlType="submit"
								loading={isSubmitting}
								disabled={isSubmitting}
								style={{ marginRight: 8 }}
							>
								{isSubmitting ? 'Đang tạo...' : 'Tạo mới'}
							</Button>
						</Tooltip>
						<Button onClick={handleCloseModal} disabled={isSubmitting}>Hủy</Button>
					</Form.Item>
				</Form>
			</Modal>

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

			<Modal
				title={`Cài đặt quyền - ${selectedUserClassFile?.name}`}
				open={isUserClassModalVisible}
				onOk={handleSaveUserClass}
				onCancel={() => {
					setIsUserClassModalVisible(false);
					setUserClassSearchText('');
					setUserClassFilter('all');
				}}
				okText="Lưu"
				cancelText="Hủy"
				width={800}
			>
				<div style={{ marginBottom: 16 }}>
					<div style={{
						marginBottom: 12,
						padding: '8px',
						backgroundColor: '#f0f8ff',
						border: '1px solid #91d5ff',
						borderRadius: '4px',
						fontSize: '12px'
					}}>
						<strong>File:</strong> {selectedUserClassFile?.name}
					</div>
					<p style={{ marginBottom: 12, color: '#666', fontSize: '13px' }}>
						Chọn các nhóm người dùng có quyền truy cập:
					</p>

					{/* Search and Filter Controls */}
					<div style={{ marginBottom: 8 }}>
						<Input
							placeholder="Tìm kiếm..."
							value={userClassSearchText}
							onChange={(e) => setUserClassSearchText(e.target.value)}
							style={{ marginBottom: 6 }}
							size="small"
							prefix={<Search_Icon width={12} />}
						/>
						<div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
							<Button
								size="small"
								type={userClassFilter === 'all' ? 'primary' : 'default'}
								onClick={() => setUserClassFilter('all')}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Tất cả
							</Button>
							<Button
								size="small"
								type={userClassFilter === 'selected' ? 'primary' : 'default'}
								onClick={() => setUserClassFilter('selected')}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Đã chọn
							</Button>
							<Button
								size="small"
								type={userClassFilter === 'unselected' ? 'primary' : 'default'}
								onClick={() => setUserClassFilter('unselected')}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Chưa chọn
							</Button>
						</div>
						<div style={{ display: 'flex', gap: 4 }}>
							<Button
								size="small"
								onClick={handleSelectAllVisible}
								disabled={filteredUserClasses.length === 0}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Chọn tất cả
							</Button>
							<Button
								size="small"
								onClick={handleDeselectAllVisible}
								disabled={filteredUserClasses.length === 0}
								style={{ fontSize: '11px', padding: '0 6px' }}
							>
								Bỏ chọn tất cả
							</Button>
						</div>
					</div>

					<div style={{
						maxHeight: '250px',
						overflowY: 'auto',
						border: '1px solid #d9d9d9',
						borderRadius: '4px',
						padding: '8px',
					}}>
						{filteredUserClasses.length > 0 ? (
							filteredUserClasses.map((userClass) => (
								<div key={userClass.id}>
									<input type={'checkbox'}
										checked={selectedUserClasses.has(userClass.id)}
										onChange={() => handleUserClassChange(userClass.id)}
										style={{
											display: 'inline-block',
											borderRadius: '4px',
											margin: 5,
											height: '16px !important',
											backgroundColor: selectedUserClasses.has(userClass.id) ? '#f0f8ff' : 'transparent'
										}}
									/>
									{userClass.name}
								</div>
							))
						) : (
							<div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
								Không tìm thấy nhóm người dùng nào phù hợp
							</div>
						)}
					</div>
					{selectedUserClasses.size > 0 && (
						<div style={{
							marginTop: '8px',
							padding: '6px 8px',
							backgroundColor: '#f6ffed',
							border: '1px solid #b7eb8f',
							borderRadius: '4px',
							fontSize: '12px'
						}}>
							<strong>Đã chọn:</strong> {Array.from(selectedUserClasses).map(id => {
								const userClass = allUserClasses.find(uc => uc.id === id);
								return userClass ? userClass.name : `ID: ${id}`;
							}).join(', ')}
						</div>
					)}
					{selectedUserClasses.size === 0 && (
						<div style={{
							marginTop: '8px',
							padding: '6px 8px',
							backgroundColor: '#fff2e8',
							border: '1px solid #ffbb96',
							borderRadius: '4px',
							textAlign: 'center',
							color: '#d46b08',
							fontSize: '12px'
						}}>
							Chưa chọn nhóm người dùng nào
						</div>
					)}
				</div>
			</Modal>

			{/* Upload Limit Configuration Modal */}
			<Modal
				title="Cấu hình giới hạn upload"
				open={isUploadLimitModalVisible}
				onOk={handleSaveUploadLimitConfig}
				onCancel={handleCancelUploadLimitModal}
				okText="Lưu"
				cancelText="Hủy"
				confirmLoading={uploadLimitLoading}
				width={500}
			>
				<div style={{ padding: '16px 0' }}>
					<div style={{ marginBottom: '16px' }}>
						<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
							Số dòng tối đa (max_record):
						</label>
						<Input
							type="number"
							value={uploadLimitConfig.max_record}
							onChange={(e) => handleUploadLimitConfigChange('max_record', parseInt(e.target.value) || 0)}
							placeholder="Nhập số dòng tối đa"
							min={1}
							style={{ width: '100%' }}
						/>
						<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
							Giới hạn số dòng dữ liệu có thể upload (mặc định: 50,000)
						</div>
					</div>

					<div style={{ marginBottom: '16px' }}>
						<label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
							Số cột tối đa (max_column):
						</label>
						<Input
							type="number"
							value={uploadLimitConfig.max_column}
							onChange={(e) => handleUploadLimitConfigChange('max_column', parseInt(e.target.value) || 0)}
							placeholder="Nhập số cột tối đa"
							min={1}
							style={{ width: '100%' }}
						/>
						<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
							Giới hạn số cột dữ liệu có thể upload (mặc định: 25)
						</div>
					</div>

					<div style={{
						padding: '12px',
						backgroundColor: '#f6ffed',
						border: '1px solid #b7eb8f',
						borderRadius: '6px',
						fontSize: '13px',
						color: '#52c41a'
					}}>
						<strong>Lưu ý:</strong> Cấu hình này sẽ áp dụng cho tất cả người dùng trong hệ thống. 
						Việc đặt giới hạn quá thấp có thể ảnh hưởng đến trải nghiệm người dùng.
					</div>
				</div>
			</Modal>
		</>
	);

}
