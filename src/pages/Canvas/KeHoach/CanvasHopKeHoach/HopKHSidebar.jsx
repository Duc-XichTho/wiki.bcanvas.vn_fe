import css from './HopKHSidebar.module.css';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MyContext } from '../../../../MyContext.jsx';
import { Form, Input, Checkbox, message, Popconfirm, Dropdown, Modal, Button } from 'antd';
import { getCurrentUserLogin, updateUser } from '../../../../apis/userService.jsx';
import { deleteKHKD, getAllKHKD, getKHKDById, updateKHKD } from '../../../../apis/khkdService.jsx';
import CreateHopKH from './Action/CreateHopKH.jsx';
import {
	deleteKHKDTongHop,
	getAllKHKDTongHop,
	getKHKDTongHopById,
	updateKHKDTongHop,
} from '../../../../apis/khkdTongHopService.jsx';
import {
	ICON_SIDEBAR_LIST,
	Search_Icon,ADD_NEW,
} from '../../../../icon/svg/IconSvg.jsx';
import { IconPMAccept, IconPMAll } from '../../../../icon/IconSVG.js';

export default function HopKHSidebar() {
	const { companySelect, buSelect, idHopKH } = useParams();
	const navigate = useNavigate();
	const [tabs, setTabs] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);
	const [isKHKDTongHopModalOpen, setIsKHKDTongHopModalOpen] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [isFeatureBarVisible, setIsFeatureBarVisible] = useState(false);
	const [khkdTongHopForm] = Form.useForm();
	const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [newFileName, setNewFileName] = useState('');
	const [selectedIcon, setSelectedIcon] = useState(selectedFile?.info?.iconSideBar || null);
	const {
		currentUser,
		loadSidebarHopKH, setLoadSidebarHopKH

	} = useContext(MyContext);

	const handleOpenModal = () => {
		setIsKHKDTongHopModalOpen(true);
	};

	const handleFeatureBarToggle = (e) => {
		setIsFeatureBarVisible(e.target.checked);
	};

	const fetchData = async () => {
		let fileTabs = await getAllKHKDTongHop();
		fileTabs = fileTabs.filter(e => !e.isOnlyTH)
		const tabsWithDuyet = await Promise.all(
			fileTabs.map(async (tab) => {
				const details = await getKHKDTongHopById(tab.id);
				return { ...tab, duyet: details.duyet };
			})
		);
		setTabs(tabsWithDuyet || []);
	};

	useEffect(() => {
		fetchData();
	}, [loadSidebarHopKH]);

	useEffect(() => {
		fetchLastView();
	}, []);

	const handleSearchChange = (e) => {
		setSearchText(e.target.value);
	};


	const handleNavigate = (value) => {
		const tabKey = 'hop-ke-hoach';
		let newPath;
		newPath = `/canvas/${companySelect}/${buSelect}/ke-hoach/${tabKey}/${value.id}`;
		navigate(newPath);
	};


	const handleClickMenu = async (value) => {

		handleNavigate(value);

		await updateViewStateForDuLieu({
			data: {
				selectedItemId: value.id,
			},
			updateActiveSubTab: true,
		});
	};


	const updateViewStateForDuLieu = async ({ data, updateActiveSubTab = false }) => {
		const user = (await getCurrentUserLogin()).data;
		const tabKey = 'hop-ke-hoach';
		const info = user.info || {};
		const viewState = info.viewState || {};
		const keHoach = viewState.keHoach || {};
		const tabs = keHoach.tabs || {};
		const newUser = {
			...user,
			info: {
				...info,
				viewState: {
					...viewState,
					keHoach: {
						...keHoach,
						activeSubTab: updateActiveSubTab ? tabKey : keHoach.activeSubTab,
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
		if (!user?.info?.viewState?.keHoach) return;

		const tabKey = 'hop-ke-hoach';
		const tabData = user.info.viewState.keHoach.tabs?.[tabKey] || {};

		const selectedItem = tabData.selectedItemId || null;
		if (selectedItem) {
			try {
				setSelectedItem(selectedItem);
				const dataCheck = await getKHKDTongHopById(selectedItem);
				if (dataCheck) {
					handleNavigate(dataCheck);
				}
			} catch (error) {
				console.error('Lỗi khi lấy NotePad:', error.message);
			}
		}
	};


	const removeVietnameseTones = (str) => {
		return str
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim();
	};
	const keyword = removeVietnameseTones(searchText || '');

	const filteredTabs = searchText
		? tabs?.filter((tab) =>
			removeVietnameseTones(tab?.name?.trim() || '').includes(keyword),
		)
		: tabs;

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

	const handleDelete = async (id) => {
		try {
			await deleteKHKDTongHop(id);
			message.success('Xóa thành công');
			await fetchData();
			const newPath = `/canvas/${companySelect}/${buSelect}/ke-hoach/hop-ke-hoach`;
			navigate(newPath);
		} catch (error) {
			console.error('Error deleting file:', error);
			message.error('Có lỗi xảy ra khi xóa');
		}
	};

	const handleRenameFileNotePad = async () => {
		try {
			if (!newFileName.trim()) {
				message.warning('Tên không được để trống');
				return;
			}

			await updateKHKDTongHop(
				{
					...selectedFile,
					name: newFileName,
					info: {
						...(selectedFile.info || {}),
						iconSideBar: selectedIcon,
					},
				});

			message.success('Đổi tên thành công');
			setIsRenameModalVisible(false);
			await fetchData();
		} catch (error) {
			console.error('Error renaming file:', error);
			message.error('Có lỗi xảy ra khi đổi tên');
		}
	};


	const handleContextMenu = (e, value) => {
		e.preventDefault();

		contextMenuItems[0].onClick = () => {
			setSelectedFile(value);
			setNewFileName(value.name);
			setIsRenameModalVisible(true);
		};
		contextMenuItems[1].label = (
			<Popconfirm
				title='Bạn có chắc chắn muốn xóa?'
				onConfirm={() => handleDelete(value.id)}
				okText='Có'
				cancelText='Không'
				onCancel={(e) => e.stopPropagation()}
			>
				<div onClick={(e) => e.stopPropagation()}>Xóa</div>
			</Popconfirm>
		);
	};


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
						<div className={css.buttonActionGroup}>
							<button
								className={`${css.buttonAction} ${isKHKDTongHopModalOpen ? css.active : ''}`}
								onClick={handleOpenModal}
							>
								<ADD_NEW width={15} height={15}/>
							</button>
						</div>
						{/*<Checkbox onChange={handleFeatureBarToggle}>Thanh chức năng</Checkbox>*/}
					</div>
					<div className={`${css.menu} ${isFeatureBarVisible ? css.menuWithButton : ''}`}>
						{filteredTabs.map((item, idx) => {
							return <>
							<Dropdown
								key={idx}
								trigger={['contextMenu']}
								menu={{
									items: contextMenuItems,
									onClick: ({ key }) => {
										if (key === '1') {
											setSelectedFile(item);
											setNewFileName(item.name);
											setIsRenameModalVisible(true);
										}
									},
								}}
							>
							<div className={css.sidebarTitle} key={item.id}>
								<div
									className={`${css.folderRight} ${item.id == (idHopKH || selectedItem) ? css.activeItem : ''}`}
									onClick={() => handleClickMenu(item)}
									onContextMenu={(e) => handleContextMenu(e, item)}
								>
									<div className={css.iconCard}>
										{item.info?.iconSideBar && (
											<>
												<img
													src={ICON_SIDEBAR_LIST.find(data => data.name == item.info?.iconSideBar)?.icon}
													alt={item.info?.iconSideBar}
													width={16}
													height={16}
												/>
											</>
										)}
									</div>

									<span>
  										{item.name}
									</span>
									{item.duyet && <div className={`${css.statusIcon} ${css.completedIcon}`}>
										<img src={IconPMAccept} className={css.icon} alt="Status complete" /></div>}
								</div>
							</div>
							</Dropdown>
							</>
							},
						)}
					</div>
				</div>
			</div>
			{isKHKDTongHopModalOpen && <CreateHopKH khkdTongHopForm={khkdTongHopForm}
											 isKHKDTongHopModalOpen={isKHKDTongHopModalOpen}
											 setIsKHKDTongHopModalOpen={setIsKHKDTongHopModalOpen}
											 fetchData={fetchData}
			/>
			}
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
										border: selectedIcon == name ? '2px solid #1890ff' : '2px solid transparent',
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

