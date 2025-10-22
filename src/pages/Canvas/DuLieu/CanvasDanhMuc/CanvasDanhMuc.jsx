import css from './CanvasDanhMuc.module.css';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MyContext } from '../../../../MyContext.jsx';
import { createFileTab, getFileTabByType, updateFileTab } from '../../../../apis/fileTabService.jsx';
import { IconCloseFolder, IconOpenFolder } from '../../../../icon/IconSVG.js';
import { Button, message, Dropdown, Menu, Popconfirm, Modal, Input } from 'antd';
import AddFolder from '../../Daas/Sidebar/Action/AddFolder.jsx';
import AddDataHub from '../../Daas/Sidebar/Action/AddDataHub.jsx';
import {
	getAllFileNotePad,
	updateFileNotePad,
	deleteFileNotePad,
	getFileNotePadByIdController,
} from '../../../../apis/fileNotePadService.jsx';
import { getCurrentUserLogin, updateUser } from '../../../../apis/userService.jsx';
import { getAllKpi2Calculator } from '../../../../apis/kpi2CalculatorService.jsx';
import { getAllChartTemplate } from '../../../../apis/chartTemplateService.jsx';
import CreateData from '../CreateData/CreateData.jsx';
import {
	BookMark_Off, BookMark_On,
	Create_Icon,
	Folder_Icon,
	FolderSetting_Icon,
	Search_Icon,
} from '../../../../icon/svg/IconSvg.jsx';
import IconButton from '@mui/material/IconButton';
import { findRecordsByConditions } from '../../../../apis/searchModelService.jsx';
import { getFileNotePadById } from '../../../../apis/public/fileNotePadService.jsx';

const CanvasDanhMuc = () => {
	const {
		selectedTapCanvas,
		setSelectedTapCanvas,
		loadData,
		userClasses,
		fetchUserClasses,
		uCSelected_CANVAS,
		currentUser,
		setCurrentUser,
		listUC_CANVAS,
		currenStepDuLieu,
		setCurrenStepDuLieu,
	} = useContext(MyContext);

	console.log(currenStepDuLieu);

	const location = useLocation();
	const navigate = useNavigate();
	const { companySelect, buSelect, id } = useParams();

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

	const handleOpenBookmark = () => {
		setIsOpenBookmark(!isOpenBookmark);
	};


	const handleOpenModal = () => {
		setIsModalVisible(true);
	};


	const loadFileTab = async () => {
		const fileTabs = await getFileTabByType('data', 'danh-muc');
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


	const handleClickMenu = async (tabKey, itemId) => {
		setSelectedTap(tabKey);
		setSelectedItem(itemId);

		await updateViewStateForDuLieu({
			data: {
				selectedItemId: itemId,
				selectedFolder: tabKey,
			},
			updateActiveSubTab: true,
		});

		const newPath = `/canvas/${companySelect}/${buSelect}/du-lieu/danh-muc/${itemId}`;
		navigate(newPath);
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

	const updateViewStateForDuLieu = async ({ data, updateActiveSubTab = false }) => {
		const tabKey = currenStepDuLieu?.path;
		const info = currentUser.info || {};
		const viewState = info.viewState || {};
		const duLieu = viewState.duLieu || {};
		const tabs = duLieu.tabs || {};

		const newUser = {
			...currentUser,
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
		setCurrentUser(newUser);
	};


	const fetchLastView = async () => {
		if (!currentUser?.info?.viewState?.duLieu) return;

		const tabKey = currenStepDuLieu?.path;
		if (tabKey === 'danh-muc') {
			const tabData = currentUser.info.viewState.duLieu.tabs?.[tabKey] || {};

			const openFolders = tabData.openFolderIds || [];
			const selectedItem = tabData.selectedItemId || null;
			const selectedFolder = tabData.selectedFolder || null;

			setOpenCategories(
				openFolders.reduce((acc, folderId) => {
					acc[folderId] = true;
					return acc;
				}, {})
			);

			if (selectedItem && selectedFolder) {
				try {
					const dataCheck = await getFileNotePadById(selectedItem);
					if (dataCheck) {
						setSelectedItem(selectedItem);
						setSelectedTap(selectedFolder);
						const newPath = `/canvas/${companySelect}/${buSelect}/du-lieu/danh-muc/${selectedItem}`;
						navigate(newPath);
					}
				} catch (error) {
					console.error("Lỗi khi lấy NotePad:", error.message);
				}
			}
		}
	};

	useEffect(() => {
		fetchLastView()
	}, [currenStepDuLieu?.path]);

	const handleSelectSideBarFromLink = async (itemId) => {
		try {
			const fileTabs = await getFileTabByTypeData();
			fileTabs.sort((a, b) => a.position - b.position);
			let listFileNote = await getAllFileNotePad()
			let fileNote = listFileNote.find((item) => item.id == itemId);
			let tab = fileTabs.find((tab) => tab.key === fileNote?.tab)
			const newOpenCategories = {
				...openCategories,
				[tab?.id]: true,
			};
			setSelectedTap(fileNote?.tab);
			setSelectedItem(fileNote?.id);
			setOpenCategories(newOpenCategories);
		}
		catch (error) {
			console.error("Lỗi khi lấy NotePad:", error);
		}
	};

	useEffect(() => {
		handleSelectSideBarFromLink(id);
	}, [id]);


	useEffect(() => {
		loadFileTab();
	}, [listFavorite]);

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
				table: 'danh-muc',
				type: 'data',
				hide: false,
			});

			message.success('Tạo thư mục thành công');
			await loadFileTab();
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

	const filteredTabs = tabs
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
			(isOpenBookmark ? tab.id === 0 : tab.id !== 0)
		);


	const handleRenameFileNotePad = async () => {
		try {
			if (!newFileName.trim()) {
				message.warning('Tên không được để trống');
				return;
			}

			await updateFileNotePad({
				...selectedFile,
				name: newFileName,
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
			await deleteFileNotePad(id);
			message.success('Xóa thành công');
			await loadFileTab();
			const newPath = `/canvas/${companySelect}/${buSelect}/du-lieu/danh-muc`;
			navigate(newPath);
		} catch (error) {
			console.error('Error deleting file:', error);
			message.error('Có lỗi xảy ra khi xóa');
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
			const favorites = currentUser?.info?.bookmark_DanhMuc || [];
			await finDataByFavorites(favorites);
			setFavoriteIds(favorites);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu bookmark:', error);
		}
	};


	useEffect(() => {
		fetchFavorites();
	}, [currentUser]);


	const handleFavoriteClick = async (id) => {
		try {
			let existingFavorites = currentUser?.info?.bookmark_DanhMuc || [];

			if (existingFavorites.includes(id)) {
				existingFavorites = existingFavorites.filter((favId) => favId !== id);
				const updatedFavorites = listFavorite.filter((fav) => fav.id !== id);
				setListFavorite(updatedFavorites);
			} else {
				existingFavorites.push(id);
				await finDataByFavorites(existingFavorites);
			}

			const updatedUser = {
				...currentUser,
				info: {
					...currentUser.info,
					bookmark_DanhMuc: existingFavorites,
				},
			};
			setCurrentUser(updatedUser);
			await updateUser(currentUser.email, updatedUser);


			setFavoriteIds(existingFavorites);
		} catch (error) {
			console.error('Lỗi khi cập nhật bookmark_report:', error);
		}
	};

	const popconfirmRef = useRef(null);

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


	return (
		<>
			<div className={css.main}>
				<div className={css.sidebar}>
					<div className={css.headerSidebar}>
						<Input
							className={css.searchBox}
							placeholder='Tìm kiếm'
							value={searchText}
							onChange={handleSearchChange}
							prefix={<Search_Icon width={16} />}
						/>
						<div className={css.bookMark}>
							<IconButton onClick={handleOpenBookmark}>
								{isOpenBookmark ? <BookMark_On height={20} width={22} /> :
									<BookMark_Off height={20} width={22} />}
							</IconButton>

						</div>
					</div>
					<div className={css.menu}>
						{filteredTabs.map((item) => {
								if (item.hide) return null;
								const isOpen = openCategories[item.id];

								return <>
									<div className={css.sidebarTitle}>
										<div className={css.folderRight}>
											<Folder_Icon width={18} />
											<span>{item.label}</span>
										</div>

										<img style={{ width: '18px' }}
											 onClick={() => toggleCategory(item.id)}
											 src={openCategories[item.id] ? IconOpenFolder : IconCloseFolder}
											 alt='' />
									</div>
									<div style={{ marginTop: '10px' }}>
										{isOpen && (item.listFileNote?.length > 0 ? item.listFileNote.map((value, idx) => {
											const isBookmarked = favoriteIds.includes(value.id) || hoveredId == value.id;

											return (
												<>
													<Dropdown
														key={idx}
														trigger={['contextMenu']}
														menu={{ items: contextMenuItems, onClick: handleMenuClick }}
													>
														<div
															ref={showDeleteConfirm && contextValue?.id === value.id ? popconfirmRef : null}
															onMouseEnter={() => setHoveredId(value.id)}
															onMouseLeave={() => setHoveredId(null)}
															className={`${css.menuItem} ${
																selectedTap == item.key && ((id || selectedItem) == value.id)
																	? css.menuItemActive
																	: ''
															}`}
															onClick={() => handleClickMenu(item.key, value.id)}
															onContextMenu={(e) => handleContextMenu(e, value, item.key)}
														>
															<span className={css.titleCard}>{value.name}</span>

															{isBookmarked && (
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

															{/* ✅ Popconfirm hiển thị riêng cho đúng item đang chọn */}
															{showDeleteConfirm && contextValue?.id === value.id && (
																<Popconfirm
																	open={showDeleteConfirm}
																	placement='topRight'
																	title='Bạn có chắc chắn muốn xóa?'
																	onConfirm={() => {
																		handleDeleteFileNotePad(contextValue?.id, contextParentKey);
																		setShowDeleteConfirm(false);
																	}}
																	onCancel={(e) => {
																		e.stopPropagation();
																		setShowDeleteConfirm(false);
																	}}
																	okText='Có'
																	cancelText='Không'
																>
																	<span></span> {/* Bắt buộc có 1 phần tử con để Popconfirm bọc */}
																</Popconfirm>
															)}
														</div>
													</Dropdown>
												</>
											);
										}) : (
											<div className={`${css.menuItem}`}>
												Không có dữ liệu
											</div>

										))
										}
									</div>

								</>;

							},
						)
						}

					</div>
					<div className={css.extraInfo}>
						<Button type={'text'}
								onClick={handleOpenModal}>
							<Create_Icon width={20} height={22} />
							<span className={css.titleButton}>Mới</span>
						</Button>
						<Button type={'text'}
								onClick={() => setIsModalFolderVisible(true)}
						>
							<FolderSetting_Icon width={22} height={22} />
							<span className={css.titleButton}>Folder</span>
						</Button>
					</div>
					<div className={css.textFooter}>
						B-Canvas - SAB Platform
					</div>
				</div>
				<div className={css.content}>
					<Outlet />
				</div>
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
			/>}

			{isModalVisible && <CreateData isModalVisible={isModalVisible}
										   handleCloseModal={handleCloseModal}
										   tabs={tabs}
										   listUC_CANVAS={listUC_CANVAS}
										   uCSelected_CANVAS={uCSelected_CANVAS}
										   fetchData={loadFileTab}
										   kpiList={kpiList}
										   ctList={ctList}

			/>}
			<Modal
				title='Đổi tên'
				open={isRenameModalVisible}
				onOk={handleRenameFileNotePad}
				onCancel={() => setIsRenameModalVisible(false)}
				okText='Lưu'
				cancelText='Hủy'
			>
				<Input
					value={newFileName}
					onChange={(e) => setNewFileName(e.target.value)}
					placeholder='Nhập tên mới'
				/>
			</Modal>
		</>
	);
};

export default CanvasDanhMuc;
