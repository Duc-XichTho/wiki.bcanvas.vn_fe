import React, { useContext, useEffect, useState } from 'react';
import { createSetting, getSettingByType, updateSetting } from '../../../../apis/settingService.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import css from './ListCongCu.module.css';
import {
	CheckPointSideBarCanvas,
	DashboardSideBarCanvas,
	FollowKPISideBarCanvas,
	GroupSideBarCanvas,
	KHKDIcon,
	Ktqt_TaiChinhSideBarCanvas,
	ManageSideBarCanvas,
	PhoneSideBarCanvas,
	StrategicAnalysisSideBarCanvas,
	TinhBienSoIcon,
	TinhKPIIcon,
	ToDoSideBarCanvas,
	VectorSideBarCanvas,
} from '../../../../icon/svg/IconSvg.jsx';
import { IconCloseFolder, IconOpenFolder } from '../../../../icon/IconSVG.js';
import { LIST_KHKD_CANVAS } from '../../../../Consts/LIST_KHKD_CANVAS.jsx';
import {
	createNewReportCanvas,
	deleteReportCanvas,
	getAllReportCanvas,
	updateReportCanvas,
} from '../../../../apis/reportCanvasService.jsx';
import { createTimestamp, formatDateISO } from '../../../../generalFunction/format.js';
import { Button, Checkbox, Divider, Input, message, Modal, Popover, Select } from 'antd';
import { FaEllipsisV } from 'react-icons/fa';
import { MyContext } from '../../../../MyContext.jsx';
import { getAllTag } from '../../../../apis/tagService.jsx';
import { MenuItem } from '@mui/material';
import {
	BAN_DO_DU_LIEU, CHECK_POINT_NV,
	CONG_CU_BCTC,
	Dashboard, FollowKPI, SA,
	SAB_KHKD,
	SAB_KT_QTTC,
	SAB_QUY_TRINH_CV, To_Do,
} from '../../../../Consts/FOLDER_CANVAS.js';

export default function ListCongCu({
									   checkFolder,
									   setCheckFolder,
									   setSelectedKey,
									   selectedKey,
									   selectedTap,
									   setSelectedTap,
									   setSelectedType,
									   selectedType,
								   }) {
	const {
		selectedTapCanvas,
		setSelectedTapCanvas,
		loadData,
		currentUser,
		setCurrentUser,
		listUC_CANVAS,
	} = useContext(MyContext);
	const navigate = useNavigate();
	const { companySelect, buSelect, tabSelect, id } = useParams();
	const [folderState, setFolderState] = useState({});
	const [listDataReport, setListDataReport] = useState([]);
	const [tags, setTags] = useState([]);
	const [openPopoverId, setOpenPopoverId] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [newCardName, setNewCardName] = useState('');
	const [newCardCode, setNewCardCode] = useState('');
	const [selectedTable, setSelectedTable] = useState(null);

	const [visibleFolders, setVisibleFolders] = useState({
		// [SAB_KHKD]: true,
		// [SAB_QUY_TRINH_CV]: true,
		// [SAB_KT_QTTC]: true,

		[BAN_DO_DU_LIEU]: true,
		[CHECK_POINT_NV]: true,
		[Dashboard]: true,
		[FollowKPI]: true,
		[CONG_CU_BCTC]: true,
		[To_Do]: true,
		[SA]: true,
	});

	const loadCheckFolderSetting = async () => {
		let folder = await getSettingByType('FolderSideBarCanvas');
		const defaultTitles = [
			// SAB_KHKD,
			// SAB_QUY_TRINH_CV,
			// SAB_KT_QTTC,

			BAN_DO_DU_LIEU,
			CHECK_POINT_NV,
			Dashboard,
			FollowKPI,
			CONG_CU_BCTC,
			To_Do,
			SA,
		];

		if (!folder || !folder.setting) {
			folder = await createSetting({
				type: 'FolderSideBarCanvas',
				setting: defaultTitles.map(title => ({
					name: title,
					open: true,
				})),
			});
		} else {
			const currentTitles = folder.setting.map(s => s.name);

			const missingTitles = defaultTitles.filter(title => !currentTitles.includes(title));

			const extraTitles = currentTitles.filter(title => !defaultTitles.includes(title));

			if (missingTitles.length > 0 || extraTitles.length > 0) {
				folder.setting = [
					...folder.setting.filter(s => !extraTitles.includes(s.name)),
					...missingTitles.map(title => ({ name: title, open: true })),
				];

				await updateSetting(folder);
			}
		}
		setCheckFolder(folder);
	};


	useEffect(() => {
		setVisibleFolders(checkFolder?.setting?.reduce((acc, item) => {
				if (item.open) acc[item.name] = true;
				return acc;
			}, {}),
		);
	}, [checkFolder]);

	const fetchDataReport = async () => {
		try {
            if (currentUser) {
                const data = await getAllReportCanvas();
                const filteredData = data.filter(e =>
                    (currentUser.isAdmin || (Array.isArray(e.user_class) && e.user_class.some(id => listUC_CANVAS.some(item => item.id == id)))),
                );
                setListDataReport(filteredData);
            } else {
                console.log('Chưa có currentUser');
            }
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu báo cáo:', error);
		}
	};


	const fetchTag = async () => {
		const data = await getAllTag();
		const filteredData = data.filter(tag => tag.table == 'report');
		setTags(filteredData);
	};


	useEffect(() => {
		fetchTag();
	}, []);


	useEffect(() => {
		fetchDataReport();
	}, []);

	useEffect(() => {
		loadCheckFolderSetting();
	}, []);


	const handleToggleFolder = (folderName) => {
		setFolderState((prev) => ({
			...prev,
			[folderName]: !prev[folderName],
		}));
	};


	const handleNavigateBanDo = () => {
		const newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/cong-cu/ban-do`;
		navigate(newPath);
	};
	const handleNavigateSA = () => {
		const newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/cong-cu/strategic-analysis`;
		navigate(newPath);
	};
	const handleNavigateMD = () => {
		const newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/cong-cu/master-detail`;
		navigate(newPath);
	};

	const handleNavigateAccounting = () => {
		const newPath = `/accounting`;
		navigate(newPath);
	};

	const handleNavigateKHKD = (id) => {
		localStorage.setItem('typeSelectCanvas', 'CongCu');
		localStorage.setItem('tabSelectCanvas', SAB_KHKD);
		setSelectedType('CongCu');
		setSelectedTap(SAB_KHKD);
		setSelectedKey(id);

		navigate(`/khkd/${id}`);
	};

	const handleNavigateFollowKPI = (value) => {
		localStorage.setItem('typeSelectCanvas', 'CongCu');
		localStorage.setItem('tabSelectCanvas', FollowKPI);
		setSelectedType('CongCu');
		setSelectedTap(FollowKPI);
		setSelectedKey(value);

		let newPath;
		if (value == '1') {
			newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/cong-cu/tinh-bien-so`;
		} else if (value == '2') {
			newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/cong-cu/tinh-kpi`;
		}
		navigate(newPath);
	};


	const handleCardClick = (parentKey) => {
		localStorage.setItem('typeSelectCanvas', 'CongCu');
		localStorage.setItem('tabSelectCanvas', Dashboard);
		setSelectedType('CongCu');
		setSelectedTap(Dashboard);
		setSelectedKey(parentKey);
		const newPath = `/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/cong-cu/report/${parentKey}`;
		navigate(newPath);
	};

	function getTypeColor(type) {
		const typeColors = {
			blue: '#234F96',
			green: '#3FA073',
			red: '#FF7C73',
		};

		return typeColors[type] || '#000000';
	}

	const listType = [
		{ color: '#234F96', text: 'Xanh dương', value: 'blue' },
		{ color: '#3FA073', text: 'Xanh lá', value: 'green' },
		{ color: '#FF7C73', text: 'Đỏ', value: 'red' },
	];


	const handleOpenPopover = (file, event) => {
		setOpenPopoverId(prevId => prevId === file.id ? null : file.id);
		event.stopPropagation();
		setSelectedFile(file);
		setIsEditing(false);
	};

	const handleEdit = async (data) => {
		await updateReportCanvas(data);
		setSelectedFile(data);
		await fetchDataReport();
		setIsSaving(false);

	};


	const handleDeleteFile = () => {
		Modal.confirm({
			title: 'Xác nhận xóa',
			content: 'Bạn có chắc chắn muốn xóa mục dữ liệu này không?',
			okText: 'Đồng ý',
			cancelText: 'Hủy',
			onOk: async () => {
				if (selectedFile) {
					await deleteReportCanvas(selectedFile.id);
					await fetchDataReport();
					navigate(`/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/`);
				}
			},
		});
	};

	const handleEditToggle = async () => {
		if (isEditing) {
			setIsSaving(true);
			await handleEdit(selectedFile);
			setOpenPopoverId(null);
		}
		setIsEditing(!isEditing);
	};

	const handleCancel = () => {
		setIsEditing(false);
	};

	const handleChange = (field, value) => {
		setSelectedFile(prev => ({
			...prev,
			[field]: field === 'list_tag' || field === 'user_class'
				? prev[field]?.includes(value)
					? prev[field].filter(id => id !== value)
					: [...(prev[field] || []), value]
				: value,
		}));
	};

	const popoverContent = (
		<div className={css.popoverContainer}>
			<div className={css.editFields}>
				<div className={css.inputGroup}>
					<label className={css.label}>Tên báo cáo:</label>
					<Input
						className={css.inputField}
						placeholder='Nhập tên báo cáo'
						value={selectedFile?.name}
						onChange={(e) => handleChange('name', e.target.value)}
						disabled={!isEditing}
					/>
				</div>

				<div className={css.inputGroup}>
					<label className={css.label}>Mã báo cáo:</label>
					<Input
						className={css.inputField}
						placeholder='Nhập mã báo cáo'
						value={selectedFile?.code}
						onChange={(e) => handleChange('code', e.target.value)}
						disabled={!isEditing}
					/>
				</div>
			</div>

			<div className={css.checkboxGroup}>
				<label className={css.label}>Chọn loại:</label>
				{listType.map((item) => (
					<div className={css.checkboxItem}>
						<Checkbox
							checked={selectedFile?.type == item.value}
							onChange={() => handleChange('type', item.value)}
							disabled={!isEditing}
						>
							{item.text}
						</Checkbox>
					</div>
				))}
			</div>

			{/*<div className={css.popoverTags}>*/}
			{/*    <label className={css.label}>Danh sách thẻ:</label>*/}
			{/*    <div className={css.tagsContainer}>*/}
			{/*        {tags.map(item => (*/}
			{/*            <span*/}
			{/*                key={item.id}*/}
			{/*                onClick={() => isEditing && handleChange("list_tag", item.id)}*/}
			{/*                className={`${css.tagPopUp} ${selectedFile?.list_tag?.includes(item.id) ? css.selectedTag : ''} ${!isEditing ? css.disabled : ''}`}*/}
			{/*            >*/}
			{/*                # {item.name}*/}
			{/*            </span>*/}
			{/*        ))}*/}
			{/*    </div>*/}
			{/*</div>*/}

			<div className={css.popoverTags}>
				<label className={css.label}>Danh sách nhóm người dùng:</label>
				<div className={css.tagsContainer}>
					{listUC_CANVAS.map(item => (
						<span
							key={item.id}
							onClick={() => isEditing && handleChange('user_class', item.id)}
							className={`${css.tagPopUp} ${selectedFile?.user_class?.includes(item.id) ? css.selectedTag : ''} ${!isEditing ? css.disabled : ''}`}
						>
                            # {item.name}
                        </span>
					))}
				</div>
			</div>


			<div className={css.deleteOption}>
				{isEditing ? (
					<>
						<Button type='primary' onClick={handleEditToggle} loading={isSaving}>Lưu</Button>
						<Button onClick={handleCancel}>Hủy</Button>
					</>
				) : (
					<>
						{currentUser && currentUser.isAdmin &&
							<>
								<Button onClick={handleEditToggle}>Sửa</Button>
								<Button
									onClick={handleDeleteFile}
									style={{
										color: '#d9534f',
										borderColor: '#c9302c',
									}}
									onMouseEnter={(e) => e.currentTarget.style.borderColor = '#c9302c'}
									onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
									onFocus={(e) => e.currentTarget.style.borderColor = '#c9302c'}
									onBlur={(e) => e.currentTarget.style.borderColor = ''}
								>
									Xóa
								</Button>
							</>
						}

					</>
				)}
			</div>

		</div>
	);

	const checkSelected = (type, tap, key) => {
		return (
			selectedType == type &&
			selectedTap == tap &&
			selectedKey == key
		);
	};

	const handleCloseModal = () => {
		setIsModalVisible(false);
		setNewCardName('');
		setSelectedTable(null);
	};


	const handleCreate = async () => {
		if (!newCardName) {
			message.error('Vui lòng chọn đầy đủ thông tin');
			return;
		}

		const itemsInSelectedTab = listDataReport.map(item => item.position || 0);

		const minPosition = itemsInSelectedTab.length > 0
			? Math.min(...itemsInSelectedTab)
			: 0;

		const newPosition = minPosition - 1;

		await createNewReportCanvas({
			name: newCardName,
			code: newCardCode,
			type: selectedTable || null,
			position: newPosition,
			user_create: currentUser.email,
			created_at: createTimestamp(),
		});

		handleCloseModal();
		fetchDataReport();
	};

	const [visible, setVisible] = useState(false);

	const handleRightClick = (event) => {
		event.preventDefault();

		if (event.type === 'contextmenu' && event.button === 2) {
			setVisible(true);
		}
	};

	const handleOpenModal = () => {
		setIsModalVisible(true);
		setVisible(false);

	};

	useEffect(() => {
		const handleClickOutside = () => setVisible(false);
		window.addEventListener('click', handleClickOutside);

		return () => {
			window.removeEventListener('click', handleClickOutside);
		};
	}, []);

	return (
		<div>

			{/*{visibleFolders?.[SAB_KHKD] && (*/}
			<div className={css.category}
				// onClick={showModalKeHoachKinhDoanh}
			>
				<div className={css.categoryTitle}>
					<div className={css.categoryTitleRight}>
						<GroupSideBarCanvas width={18} height={18} />
						<span>{SAB_KHKD}</span>
					</div>
					<img src={folderState[SAB_KHKD] ? IconOpenFolder : IconCloseFolder}
						 onClick={() => handleToggleFolder(SAB_KHKD)}
						 alt='' />
				</div>
				<div className={css.subItems}>
					{folderState[SAB_KHKD] && LIST_KHKD_CANVAS.map(subItem => {
							return (
								<div
									className={`${css.subItem} ${checkSelected('CongCu', SAB_KHKD, subItem.key) ? css.activeCard : ''}`}
									onClick={() => handleNavigateKHKD(subItem.key)}>
									{subItem.icon}
									<span>{subItem.label}</span>
								</div>
							);
						},
					)}
				</div>

			</div>
			{/*)}*/}

			{/*{visibleFolders?.[SAB_QUY_TRINH_CV] && (*/}
			<div className={css.category}>
				<div className={css.categoryTitle}>
					<div className={css.categoryTitleRight}>
						<ManageSideBarCanvas width={18} height={18} />
						<span>{SAB_QUY_TRINH_CV}</span>
					</div>

				</div>
			</div>
			{/*)}*/}

			{/*{visibleFolders?.[SAB_KT_QTTC] && (*/}
			<div className={css.category} onClick={handleNavigateAccounting}>
				<div className={css.categoryTitle}>
					<div className={css.categoryTitleRight}>
						<Ktqt_TaiChinhSideBarCanvas width={18} height={18} />
						<span>{SAB_KT_QTTC}</span>
					</div>

				</div>
			</div>
			{/*)}*/}

			<Divider
				dashed
				style={{ borderColor: 'rgba(188, 188, 188, 1)', margin: '25px 0' }}
			/>

			{visibleFolders?.[CHECK_POINT_NV] && (
				<div className={css.category} onClick={handleNavigateMD}>
					<div className={css.categoryTitle}>
						<div className={css.categoryTitleRight}>
							<CheckPointSideBarCanvas width={18} height={18} />
							<span>{CHECK_POINT_NV}</span>
						</div>
					</div>
				</div>
			)}

			{visibleFolders?.[SA] && (
				<div className={css.category} onClick={handleNavigateSA}>
					<div className={css.categoryTitle}>
						<div className={css.categoryTitleRight}>
							<StrategicAnalysisSideBarCanvas width={18} height={18} />
							<span>{SA}</span>
						</div>
					</div>
				</div>
			)}
			{visibleFolders?.[BAN_DO_DU_LIEU] && (
				<div className={css.category} onClick={handleNavigateBanDo}>
					<div className={css.categoryTitle}>
						<div className={css.categoryTitleRight}>
							<VectorSideBarCanvas width={18} height={18} />
							<span>{BAN_DO_DU_LIEU}</span>
						</div>
					</div>
				</div>
			)}


			{visibleFolders?.[CONG_CU_BCTC] && (
				<div
					className={css.category}
					onClick={() =>
						navigate('/ke-toan-quan-tri')
						// (window.location.href = `${import.meta.env.VITE_DOMAIN_URL}/ke-toan-quan-tri`)
					}
				>
					<div className={css.categoryTitle}>
						<div className={css.categoryTitleRight}>
							<PhoneSideBarCanvas width={18} height={18} />
							<span>{CONG_CU_BCTC}</span>
						</div>
					</div>
				</div>
			)}

			{visibleFolders?.[FollowKPI] && (
				<div className={css.category}>
					<div className={css.categoryTitle}>
						<div className={css.categoryTitleRight}>
							<FollowKPISideBarCanvas width={18} height={18} />
							<span>Theo dõi KPI</span>
						</div>
						<img src={folderState[FollowKPI] ? IconOpenFolder : IconCloseFolder}
							 onClick={() => handleToggleFolder(FollowKPI)}
							 alt='' />
					</div>
					{folderState[FollowKPI] && (
						<div className={css.subItems}>
							<div
								className={`${css.subItem} ${checkSelected('CongCu', FollowKPI, 1) ? css.activeCard : ''}`}
								onClick={() => handleNavigateFollowKPI(1)}>
								<TinhBienSoIcon width={20} height={20} />
								<span>Tính biến số kinh doanh</span>
							</div>
							<div
								className={`${css.subItem} ${checkSelected('CongCu', FollowKPI, 2) ? css.activeCard : ''}`}
								onClick={() => handleNavigateFollowKPI(2)}>
								<TinhKPIIcon width={20} height={20} />
								<span> Tính KPI</span>
							</div>
						</div>
					)}
				</div>
			)}

			{visibleFolders?.[To_Do] && (
				<div
					className={css.category}
					onClick={() =>
						navigate('/project-manager')
						// (window.location.href = `${import.meta.env.VITE_DOMAIN_URL}/project-manager`)
					}
				>
					<div className={css.categoryTitle}>
						<div className={css.categoryTitleRight}>
							<ToDoSideBarCanvas width={18} height={18} />
							<span>{To_Do}</span>
						</div>
					</div>
				</div>
			)}

			{visibleFolders?.[Dashboard] && (
				<div className={css.category}>
					<Popover content={
						<Button onClick={handleOpenModal}>
							Thêm báo cáo
						</Button>
					}
							 open={visible} // Chỉ mở khi visible = true
							 placement='right'

					>
						<div className={css.categoryTitle}
							 onContextMenu={handleRightClick}
							 onClick={(e) => e.stopPropagation()} // Ngăn Popover đóng ngay lập tức khi click

						>
							<div className={css.categoryTitleRight}>
								<DashboardSideBarCanvas width={18} height={18} />
								<span>Dashboard báo cáo</span>
							</div>

							<img
								src={folderState[Dashboard] ? IconOpenFolder : IconCloseFolder}
								onClick={() => handleToggleFolder(Dashboard)}
								alt=''
							/>
						</div>
					</Popover>
					{folderState[Dashboard] && (
						<div style={{ marginLeft: 9 }}>
							{
								listDataReport.length > 0 ?
									( listDataReport.map((subItem) => {
										const type = subItem.type ?? 'Không xác định';
										const color = getTypeColor(type);
										return subItem.key !== 'empty' ? (
											<div key={subItem.key}
												 className={`${css.card} ${checkSelected('CongCu', Dashboard, subItem.id) ? css.activeCard : ''}`}

												 style={{ borderLeft: `5px solid ${color}` }}
												// onMouseEnter={() => setHoveredId(subItem.id)}
												// onMouseLeave={() => setHoveredId(null)}
												 onClick={() => handleCardClick(subItem.id)}
											>
												<div className={css.cardContent}>
													<div className={css.cardTitle}
														 style={{ fontWeight: 'bold' }}>
														{subItem.name}
													</div>
													<div className={css.cardInfo}>
														<div className={css.cardInfoLeft}>
															<span>{subItem.code || ''}</span>
															{/*<span>*/}
															{/*                    {subItem.list_tag?.length*/}
															{/*                        ? subItem.list_tag.reduce((acc, id) => {*/}
															{/*                            const tag = tags.find(tag => tag.id === id)?.name;*/}
															{/*                            return tag ? [...acc, `#${tag}`] : acc;*/}
															{/*                        }, []).join(", ")*/}
															{/*                        : ""}*/}
															{/*                </span>*/}
														</div>
														<div className={css.cardInfoRight}>
															<span>{formatDateISO(subItem.updated_at || subItem.created_at)}</span>
															{currentUser.isAdmin && (
																<Popover
																	content={popoverContent}
																	trigger='click'
																	placement='right'
																	open={openPopoverId == subItem.id}
																	onOpenChange={setOpenPopoverId}
																>
																	<FaEllipsisV
																		className={css.optionsIcon}
																		style={{
																			width: '12px',
																			height: '12px',
																			cursor: 'pointer',
																		}}
																		onClick={(e) => handleOpenPopover(subItem, e)}
																	/>
																</Popover>
															)}
														</div>
													</div>
												</div>
											</div>
										) : (
											<div key={subItem.key} className={css.emptyMessage}>
												Không có dữ liệu
											</div>
										);
									})) : (
									<div className={css.emptyMessage}>
										Không có dữ liệu
									</div>
								)
							}
						</div>
					)}

				</div>
			)}

			<Modal
				title='Tạo Mới'
				open={isModalVisible}
				onOk={handleCreate}
				onCancel={handleCloseModal}
				okText='Tạo'
				cancelText='Hủy'
				okButtonProps={{ disabled: !(selectedTable && newCardName) }}
			>
				<div className={css.modalContent}>
					<Select
						showSearch
						placeholder='Phân loại'
						value={selectedTable}
						onChange={(value) => {
							setSelectedTable(value);
							if (value === 'Data') {
								setNewCardName('Data ' + Date.now());
							}
						}}
						style={{ width: '100%', marginBottom: 10 }}
						filterOption={(input, option) =>
							option.children
								?.toString()
								?.toLowerCase()
								?.includes(input.toLowerCase())
						}
					>
						{listType.map((table) => (
							<Select.Option key={table.value} value={table.value}>
								{table.text}
							</Select.Option>
						))}
					</Select>


					{selectedTable !== 'Data' && (
						<Input
							placeholder='Nhập tên'
							value={newCardName}
							onChange={(e) => setNewCardName(e.target.value)}
							style={{ marginBottom: 10 }}
						/>
					)}
				</div>
			</Modal>
		</div>
	);
}