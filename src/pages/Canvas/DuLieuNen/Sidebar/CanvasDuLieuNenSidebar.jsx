import css from './CanvasDuLieuNenSidebar.module.css';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createFileTab, getFileTabByTypeData, updateFileTab } from '../../../../apis/fileTabService.jsx';
import { Button, Checkbox, Dropdown, Input, message, Modal, Popconfirm } from 'antd';
import {
	ADD_NEW,
	BookMark_Off,
	BookMark_On,
	ICON_BANG_XOAY,
	ICON_SIDEBAR_LIST,
	ICON_VECTOR, Search_Icon,
} from '../../../../icon/svg/IconSvg.jsx';
import AddFolder from '../../Daas/Sidebar/Action/AddFolder.jsx';
import { deleteFileNotePad, updateFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { getCurrentUserLogin, updateUser } from '../../../../apis/userService.jsx';
import { findRecordsByConditions } from '../../../../apis/searchModelService.jsx';
import { getFileNotePadById } from '../../../../apis/public/fileNotePadService.jsx';
import { Dot } from 'lucide-react';
import CreateData from '../../DuLieu/CreateData/CreateData.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import CreateDataTemplate from '../../DuLieu/CreateData/CreateDataTemplate.jsx';

export default function CanvasDuLieuNenSidebar() {
	const { companySelect, buSelect, id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const [tabs, setTabs] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);
	const [selectedTap, setSelectedTap] = useState(null);
	const [openCategories, setOpenCategories] = useState({});
	const [isModalFolderVisible, setIsModalFolderVisible] = useState(false);
	const [newFolderData, setNewFolderData] = useState({ label: '' });
	const [editTabName, setEditTabName] = useState('');
	const [editTabId, setEditTabId] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
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
	const { uCSelected_CANVAS, listUC_CANVAS } = useContext(MyContext);
	const [isFeatureBarVisible, setIsFeatureBarVisible] = useState(false);
	const [currentUser, setCurrentUser] = useState(null);
	const loadFileTab = async () => {
		let fileTabs = await getFileTabByTypeData();
		fileTabs = fileTabs.filter((tab) => tab.position < 100 && tab.table == 'danh-muc' && tab.type == 'data');
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
		
		// Tự động mở tất cả tabs khi load lần đầu
		const newOpenCategories = {};
		fileTabs.forEach(tab => {
			newOpenCategories[tab.id] = true;
		});
		setOpenCategories(newOpenCategories);
	};

	const handleFeatureBarToggle = (e) => {
		setIsFeatureBarVisible(e.target.checked);
	};

	const handleOpenBookmark = () => {
		setIsOpenBookmark(!isOpenBookmark);
	};

	const handleOpenModal = () => {
		setIsModalVisible(true);
	};



	const handleSearchChange = (e) => {
		setSearchText(e.target.value);
	};


	const handleNavigate = (value) => {
		let newPath;
		newPath = `/canvas/${companySelect}/${buSelect}/du-lieu-nen/${value.id}`;
		navigate(newPath);
	};

	const handleClickMenu = async (tabKey, itemId, value) => {
		setSelectedTap(tabKey);
		setSelectedItem(itemId);
		handleNavigate(value);

		await updateViewStateForDuLieuNen({
			data: {
				selectedItemId: itemId,
				selectedFolder: tabKey,
			},
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

		await updateViewStateForDuLieuNen({
			data: {
				openFolderIds,
			},
		});
	};


	const updateViewStateForDuLieuNen = async ({ data }) => {
		const user = (await getCurrentUserLogin()).data;

		const info = user.info || {};
		const viewState = info.viewState || {};
		const duLieuNen = viewState.duLieuNen || {};

		const newUser = {
			...user,
			info: {
				...info,
				viewState: {
					...viewState,
					duLieuNen: {
						...duLieuNen,
						...data,
					},
				},
			},
		};

		await updateUser(user.email, newUser);
		setCurrentUser(newUser);
	};

	const fetchLastView = async () => {
		const user = (await getCurrentUserLogin()).data;
		if (!user?.info?.viewState?.duLieuNen) return;
		const duLieuNen = user.info.viewState.duLieuNen || {};

		const openFolders = duLieuNen.openFolderIds || [];
		const selectedItem = duLieuNen.selectedItemId || null;
		const selectedFolder = duLieuNen.selectedFolder || null;

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
		loadFileTab();
		fetchLastView();
	}, []);

	

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
			(isOpenBookmark ? tab.id === 0 : tab.id !== 0),
		);
		console.log('filteredTabs', filteredTabs);

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
			await deleteFileNotePad(id);
			message.success('Xóa thành công');
			await loadFileTab();
			const currentPath = location.pathname;

			let newPath = '';
			newPath = `/canvas/${companySelect}/${buSelect}/du-lieu-nen`;
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
			const favorites = user?.info?.bookmark_DuLieuNen || [];
			await finDataByFavorites(favorites);
			setFavoriteIds(favorites);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu bookmark:', error);
		}
	};


	useEffect(() => {
		fetchFavorites();
		loadFileTab();
	}, []);


	const handleFavoriteClick = async (id) => {
		try {
			const user = (await getCurrentUserLogin()).data;

			let existingFavorites = user?.info?.bookmark_DuLieuNen || [];

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
					bookmark_DuLieuNen: existingFavorites,
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
		loadFileTab();
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
		loadFileTab();
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

	const RenderCaiDat = () => {
		return (
			<div className={`${css.buttonAction} ${isModalFolderVisible ? '' : ''}`}
					onClick={() => setIsModalFolderVisible(true)}
			>
				<span>Cài đặt thư mục</span>
			</div>
		);
	};

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
						<Checkbox onChange={handleFeatureBarToggle}>Thanh chức năng</Checkbox>
					</div>
					{isFeatureBarVisible && (
						<div className={css.buttonActionGroup}>
							<div className={`${css.buttonAction} ${isModalVisible ? css.active : ''}`}
									onClick={handleOpenModal}
							>
								<ADD_NEW width={15} height={15}/>
							</div>
							<RenderCaiDat />
							<div className={`${css.buttonAction} ${isOpenBookmark ? css.active : ''}`}
									onClick={handleOpenBookmark}
							>
								<span>Yêu thích</span>
							</div>
						</div>
					)}

					<div className={`${css.menu} ${isFeatureBarVisible ? css.menuWithButton : ''}`}>
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
											<span>{item.label}</span>
										</div>
									</div>

									{console.log('isOpen for item', item.id, ':', isOpen)}
									{isOpen &&
										<div style={{ marginBottom: '10px' }}>

											{item.listFileNote?.length > 0 ? (() => {
												console.log('item.listFileNote', item.listFileNote);
												let hasVisible = false;
												const renderedNotes = item.listFileNote.map((value, idx) => {
													let canView = true;
													// Tạm thời disable permission check để debug
													/*
													if (!currentUser?.isAdmin) {
														try {
															console.log('uCSelected_CANVAS', uCSelected_CANVAS);
															const ucObj = listUC_CANVAS?.find(uc => uc.id == uCSelected_CANVAS);
															const ucName = ucObj?.name;
															if (!value.userClass || !Array.isArray(value.userClass) || value.userClass.length === 0) {
																canView = false;
															} else {
																canView = value.userClass.includes(ucName);
															}
														} catch (e) {
															canView = false;
														}
													}
													*/
													if (!canView) return null;
													hasVisible = true;
													const isBookmarked = favoriteIds.includes(value.id) || hoveredId == value.id;
													const isNotEdit = location?.pathname.includes('du-lieu-dau-vao') ? value.isNotEdit : false;
													return (
														<Dropdown
															key={idx}
															trigger={ isNotEdit || !(currentUser?.isAdmin || value.user_create == currentUser?.email) ? [] : ['contextMenu']}
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
																				{(value.created_at && ((new Date() - new Date(value.created_at)) <= 24 * 60 * 60 * 1000)) &&
																					<span style={{
																						display: 'inline-block',
																						position: 'relative',
																						width: '16px',
																						height: '16px',
																						marginLeft: '4px',
																						verticalAlign: 'middle',
																					}}>
																					<Dot size={30} color='red' style={{
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
																			{(value.created_at && ((new Date() - new Date(value.created_at)) <= 24 * 60 * 60 * 1000)) &&
																				<span style={{
																					display: 'inline-block',
																					position: 'relative',
																					width: '16px',
																					height: '16px',
																					marginLeft: '4px',
																					verticalAlign: 'middle',
																				}}>
																					<Dot size={30} color='red' style={{
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
																<div className={css.option_card}>

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
																					  <img
																						  src={ICON_VECTOR}
																						  alt='ICON_VECTOR'
																						  width={22}
																						  height={16}
																				  />
																				</span>
																			)}

																			{value?.so_luong_bang_xoay > 0 && (
																				<span style={{
																					display: 'flex',
																					color: '#868686',
																					fontSize: '13px',
																					alignItems: 'center',
																				}}>
																						<img
																							src={ICON_BANG_XOAY}
																							alt='ICON_BANG_XOAY'
																							width={22}
																							height={14}
																						/>
																						{value.so_luong_bang_xoay}
																				</span>
																			)}
																		</div>

																	</div>
																</div>
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
												swapFileNotePosition={swapFileNotePosition}
			/>}

			{isModalVisible &&
				<CreateDataTemplate isModalVisible={isModalVisible}
									handleCloseModal={handleCloseModal}
									tabs={tabs}
									listUC_CANVAS={listUC_CANVAS}
									uCSelected_CANVAS={uCSelected_CANVAS}
									fetchData={loadFileTab}

				/>}
			{

				isRenameModalVisible &&
				<Modal
					title='Đổi tên'
					open={isRenameModalVisible}
					onOk={handleRenameFileNotePad}
					onCancel={() => {
						setIsRenameModalVisible(false);
						setSelectedIcon(selectedFile?.info?.iconSideBar || null);
					}}
					okText='Lưu'
					cancelText='Hủy'
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
									type='text'
									danger
									size='small'
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
									<img src={icon} alt={name} width={20} height={20} />
								</div>
							))}
						</div>
					</div>
					<Input
						value={newFileName}
						onChange={(e) => setNewFileName(e.target.value)}
						placeholder='Nhập tên mới'
					/>
				</Modal>
			}
		</>
	);
};

