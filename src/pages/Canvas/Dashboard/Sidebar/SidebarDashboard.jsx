import { createFileTab, getFileTabByType, updateFileTab } from '../../../../apis/fileTabService.jsx';
import {
	deleteReportCanvas,
	getReportCanvasDataById,
	updateReportCanvas,
} from '../../../../apis/reportCanvasService.jsx';
import React, { useContext, useEffect, useState } from 'react';
import css from './SidebarDashboard.module.css';
import { IconCloseFolder, IconOpenFolder } from '../../../../icon/IconSVG.js';
import { Button, Dropdown, Input, message, Modal, Popconfirm } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AddFolder from '../../Daas/Sidebar/Action/AddFolder.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import CreateData from '../CreateData/CreateData.jsx';
import { Create_Icon, FolderSetting_Icon, ICON_SIDEBAR_LIST } from '../../../../icon/svg/IconSvg.jsx';
import { getCurrentUserLogin, updateUser } from '../../../../apis/userService.jsx';
import { ChatBotFile } from '../../ChatBot/ChatBotFile.jsx';
import { SettingOutlined } from '@ant-design/icons';

export default function SidebarDashboard() {
	const [tabs, setTabs] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [openCategories, setOpenCategories] = useState({});
	const [selectedItem, setSelectedItem] = useState(null);
	const [selectedTap, setSelectedTap] = useState(null);
	const navigate = useNavigate();
	const { companySelect, buSelect, id, siderId } = useParams();
	const [isModalFolderVisible, setIsModalFolderVisible] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [newFolderData, setNewFolderData] = useState({ label: '' });
	const [editTabName, setEditTabName] = useState('');
	const [editTabId, setEditTabId] = useState(null);
	const [kpiList, setKpiList] = useState([]);
	const [ctList, setCtList] = useState([]);
	const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [newFileName, setNewFileName] = useState('');
	const [selectedIcon, setSelectedIcon] = useState(selectedFile?.info?.iconSideBar || null);
	const location = useLocation();
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
	} = useContext(MyContext);

	const handleOpenModal = () => {
		setIsModalVisible(true);
	};

	const loadFileTab = async () => {
		const fileTabs = await getFileTabByType('dashboard');
		fileTabs.sort((a, b) => a.position - b.position);
		setTabs([
			// {
			// 	id: 0,
			// 	key: 'tapFavorite',
			// 	label: 'Danh sách yêu thích',
			// 	alt: 'Favorite',
			// },
			...fileTabs,
		]);
	};
	useEffect(() => {
		loadFileTab();
	}, []);

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
		.filter((tab) => tab.listFileNote.length > 0 || !searchText);


	const handleClickMenu = async (tabKey, itemId) => {
		setSelectedTap(tabKey);
		setSelectedItem(itemId);

		await updateViewStateForDashboard({
			data: {
				selectedItemId: itemId,
				selectedFolder: tabKey,
			},
		});

		const newPath = `/canvas/${companySelect}/${buSelect}/dashboard/${itemId}`;
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

		await updateViewStateForDashboard({
			data: {
				openFolderIds,
			},
		});
	};

	const updateViewStateForDashboard = async ({ data }) => {
		const user = (await getCurrentUserLogin()).data

		const info = user.info || {};
		const viewState = info.viewState || {};
		const dashBoard = viewState.dashBoard || {};

		const newUser = {
			...user,
			info: {
				...info,
				viewState: {
					...viewState,
					dashBoard: {
						...dashBoard,
						...data,
					},
				},
			},
		};

		await updateUser(user.email, newUser);
		// setCurrentUser(newUser);
	};

	const fetchLastView = async () => {
		const user = (await getCurrentUserLogin()).data
		if (!user?.info?.viewState?.dashBoard) return;
		const dashBoard = user.info.viewState.dashBoard || {};

		const openFolders = dashBoard.openFolderIds || [];
		const selectedItem = dashBoard.selectedItemId || null;
		const selectedFolder = dashBoard.selectedFolder || null;

		setOpenCategories(
			openFolders.reduce((acc, folderId) => {
				acc[folderId] = true;
				return acc;
			}, {}),
		);

		if (selectedItem && selectedFolder) {
			try {
				const dataCheck = await getReportCanvasDataById(selectedItem);
				if (dataCheck) {
					setSelectedItem(selectedItem);
					setSelectedTap(selectedFolder);
					const newPath = `/canvas/${companySelect}/${buSelect}/dashboard/${selectedItem}`;
					navigate(newPath);
				}
			} catch (error) {
				console.error('Lỗi khi lấy NotePad:', error.message);
			}
		}
	};

	useEffect(() => {
		fetchLastView();
	}, []);

	const handleSelectSideBarFromLink = async (siderId) => {
		if (!siderId) {
			setSelectedTap(null);
			setSelectedItem(null);

			await updateViewStateForDashboard({
				data: {
					selectedItemId: null,
					selectedFolder: null,
				},
			});
			return;
		}

		try {
			// Lấy danh sách các tab
			const fileTabs = await getFileTabByType('dashboard');
			fileTabs.sort((a, b) => a.position - b.position);
			// Lấy thông tin file report
			const fileNote = await getReportCanvasDataById(siderId);

			// Nếu không tìm thấy file, không làm gì cả
			if (!fileNote) {
				console.log('Không tìm thấy report canvas với id:', siderId);
				setSelectedTap(null);
				setSelectedItem(null);

				await updateViewStateForDashboard({
					data: {
						selectedItemId: null,
						selectedFolder: null,
					},
				});
				return;
			}

			// Tìm tab chứa file này
			let foundTab = null;
			for (const tab of fileTabs) {
				const foundNote = tab.listFileNote?.find(note => note.id == siderId);
				if (foundNote) {
					foundTab = tab;
					break;
				}
			}

			// Nếu không tìm thấy tab chứa file, không làm gì cả
			if (!foundTab) {
				console.log('Không tìm thấy tab chứa report này');
				return;
			}

			// Cập nhật trạng thái UI
			const newOpenCategories = {
				...openCategories,
				[foundTab.id]: true,
			};

			setSelectedTap(foundTab.key);
			setSelectedItem(siderId);
			setOpenCategories(newOpenCategories);

			// Cập nhật view state để lưu trạng thái
			await updateViewStateForDashboard({
				data: {
					selectedItemId: siderId,
					selectedFolder: foundTab.key,
					openFolderIds: Object.entries(newOpenCategories)
						.filter(([_, isOpen]) => isOpen)
						.map(([id]) => id),
				},
			});
		} catch (error) {
			console.error('Lỗi khi lấy Report Canvas:', error);
		}
	};

	useEffect(() => {
		handleSelectSideBarFromLink(siderId);
	}, [siderId, location.pathname]);


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
				type: 'dashboard',
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

	const handleRename = async () => {
		try {
			if (!newFileName.trim()) {
				message.warning('Tên không được để trống');
				return;
			}

			await updateReportCanvas({
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

	const handleDelete = async (id) => {
		try {
			await deleteReportCanvas(id);
			message.success('Xóa thành công');
			await loadFileTab();
			const newPath = `/canvas/${companySelect}/${buSelect}/dashboard`;
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
			onClick: (e) => {
				setSelectedFile(e.selectedFile);
				setNewFileName(e.selectedFile?.name);
				setIsRenameModalVisible(true);
			},
		},
		{
			key: '2',
			label: 'Xóa',
			onClick: (e) => e.domEvent.stopPropagation(),
		},
	];

	const handleContextMenu = (e, value, parentKey) => {
		e.preventDefault();

		contextMenuItems[0].onClick = () => {
			setSelectedFile(value);
			setNewFileName(value.name);
			setIsRenameModalVisible(true);
		};
		contextMenuItems[1].label = (
			<Popconfirm
				title='Bạn có chắc chắn muốn xóa?'
				onConfirm={() => handleDelete(value.id, parentKey)}
				okText='Có'
				cancelText='Không'
				onCancel={(e) => e.stopPropagation()}
			>
				<div onClick={(e) => e.stopPropagation()}>Xóa</div>
			</Popconfirm>
		);
	};

	const handleOk = () => {

	};

	useEffect(() => {
		setSelectedIcon(selectedFile?.info?.iconSideBar || null);
	}, [selectedFile]);

	const swapReportCanvasPosition = async (tabId, noteA, noteB, indexA, indexB) => {
		if (!noteA || !noteB) return;

		// Nếu position bị null thì fallback về index
		const positionA = noteA.position ?? indexA;
		const positionB = noteB.position ?? indexB;

		try {
			await Promise.all([
				updateReportCanvas({ id: noteA.id, position: positionB, }),
				updateReportCanvas({ id: noteB.id, position: positionA,}),
			]);
			await loadFileTab();
			message.success('Cập nhật vị trí thành công');
		} catch (error) {
			console.error('Lỗi cập nhật vị trí fileNote:', error);
			message.error('Cập nhật vị trí thất bại');
		}
	};
	return (
		<>
			<div className={css.main}>
				<div className={css.sidebar}>
					<div className={css.header}>
						<span className={css.titleGroup}>
							<span className={css.dotDasboard}></span>
								TRUNG TÂM DỮ LIỆU QUẢN TRỊ - BI
						</span>
						<div className={css.dropdownWrapper}>
							<Dropdown
								menu={{
									items: [
										{
											key: '1',
											label: (
												<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
													<Create_Icon width={20} height={22} />
													<span>Mới</span>
												</div>
											),
											onClick: () => {
										
													handleOpenModal();
											},
										},
										...(currentUser?.isAdmin ? [
											{
												key: '2',
												onClick: () => {
													setIsModalFolderVisible(true);
												},
												label: (
													<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
														<FolderSetting_Icon width={22} height={22} />
														<span>Folder</span>
													</div>
												),
											},
											{
												key: '3',
												onClick: () => {
													setIsModalOpen(true);
												},
												label: (
													<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
														<FolderSetting_Icon width={22} height={22} />
														<span>Chat AI vs File</span>
													</div>
												),
											},
										] : [])
									],
								}}
							>
								<Button
									type="text"
									icon={<SettingOutlined />}
									className={css.settingsBtn}
								/>
							</Dropdown>
						</div>
					</div>
					<div className={css.menu}>
						{
							filteredTabs.map((item) => {
									if (item.hide) return null;
									const isOpen = openCategories[item.id];

									return <>
										<div className={css.sidebarTitle}>
											<div className={css.folderRight}>
												{/*<Folder_Icon width={18} />*/}
												<span>{item.label}</span>
											</div>
											<img style={{ width: '18px' }}
												 onClick={() => toggleCategory(item.id)}
												 src={openCategories[item.id] ? IconOpenFolder : IconCloseFolder}
												 alt='' />
										</div>
										<div style={{ marginTop: '10px' }}>
											{isOpen && (
												item.listFileNote?.length > 0 ? (() => {
													let hasVisible = false;
													const renderedNotes = item.listFileNote.map((value, idx) => {
														let canView = true;
														if (!currentUser?.isAdmin) {
															try {
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
														if (!canView) return null;
														hasVisible = true;
														const canEdit = currentUser?.isAdmin || value.user_create == currentUser?.email;
														return (
															<Dropdown
																key={idx}
																trigger={canEdit ? ['contextMenu'] : []}
																menu={canEdit ? {
																	items: contextMenuItems,
																	onClick: ({ key }) => {
																		if (key === '1') {
																			setSelectedFile(value);
																			setNewFileName(value.name);
																			setIsRenameModalVisible(true);
																		}
																	},
																} : undefined}
															>
																<div
																	className={`${css.menuItem} ${(id || selectedItem) == value.id ? css.menuItemActive : ''} ${!canEdit ? css.disabledItem : ''}`}
																	onClick={() => handleClickMenu(item.key, value.id)}
																	onContextMenu={canEdit ? (e) => handleContextMenu(e, value, item.key) : undefined}
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
																		<span className={css.titleCard}>{value.name}</span>
																	</div>
																</div>
															</Dropdown>
														)
													});
													if (!hasVisible) {
														return <div className={`${css.menuItem}`}>Không có dữ liệu</div>;
													}
													return renderedNotes;
												})() : (
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
					{/* <Button type={'text'}
							onClick={() => setIsModalOpen(true)}
					>
						<FolderSetting_Icon width={22} height={22} />
						<span className={css.titleButton}>Chat AI vs File</span>
					</Button>
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
					</div> */}
					{/*<div className={css.textFooter}>*/}
					{/*	B-Canvas - SAB Platform*/}
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
													swapFileNotePosition={swapReportCanvasPosition}
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
			</div>
			<Modal
				title='Đổi tên'
				open={isRenameModalVisible}
				onOk={handleRename}
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
			{isModalOpen && <ChatBotFile isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />}
		</>

	);
}
