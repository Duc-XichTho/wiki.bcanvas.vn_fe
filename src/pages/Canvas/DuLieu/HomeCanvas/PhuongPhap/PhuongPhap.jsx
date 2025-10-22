import css from './PhuongPhap.module.css';
import { addNoteChartData, getALLNoteChartData, updateNoteChart } from '../../../../../apis/noteChartService.jsx';
import React, { useEffect, useState } from 'react';
import { Button, Dropdown, Input, message, Modal, Popconfirm } from 'antd';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { ADD_NEW, ICON_SIDEBAR_LIST, Search_Icon } from '../../../../../icon/svg/IconSvg.jsx';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';


export default function PhuongPhap() {
	const [loading, setLoading] = useState(false);
	const [notes, setNotes] = useState([]);
	const [selectedNote, setSelectedNote] = useState(null);
	const [isModalOpenCreate, setIsModalOpenCreate] = useState(false);
	const [inputCreate, setInputCreate] = useState('');
	const navigate = useNavigate();
	const { companySelect, buSelect, idNoteChart } = useParams();
	const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [newFileName, setNewFileName] = useState('');
	const [selectedIcon, setSelectedIcon] = useState( null);
	const [searchText, setSearchText] = useState('');

	const fetchNotes = async () => {
		try {
			const data = await getALLNoteChartData();
			const filtered = data.filter(note => note.type == 'PhuongPhap');
			if (filtered.length > 0 && !selectedNote  && !idNoteChart) handleClick(filtered[0])
			const sorted = filtered.sort((a, b) => {
				const indexA = a.info?.index ?? 0;  // nếu a.info hoặc index không có thì mặc định 0
				const indexB = b.info?.index ?? 0;
				return indexA - indexB;
			});

			setNotes(sorted);
		} catch (e) {
			console.error(e);
		}
	};

	const handleSearchChange = (e) => {
		setSearchText(e.target.value);
	};


	useEffect(() => {
		const fetchAllData = async () => {
			try {
				await Promise.all([
					fetchNotes(),
				]);
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};
		fetchAllData();
	}, []);


	const handleOpenModalCreate = () => setIsModalOpenCreate(true);
	const handleCloseModalCreate = () => {
		setInputCreate('');
		setIsModalOpenCreate(false);
	};


	const handleSubmitCreate = async () => {
		setLoading(true);
		try {
			const itemCreate = {
				type: 'PhuongPhap',
				name: inputCreate,
			};
			const response = await addNoteChartData(itemCreate);
			const newData = {
				chartTitle: `PhuongPhap_${response.id}`,
			};
			const data = await updateNoteChart(response.id, newData);
			await fetchNotes();
			handleCloseModalCreate();
		} catch (error) {
			console.error('Update failed:', error);
		} finally {
			setLoading(false);
		}
	};


	const handleClick = (note) => {
		navigate(`/canvas/${companySelect}/${buSelect}/home/phuong-phap/${note.id}`);
		setSelectedNote(note);
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

	const handleDelete = async (id) => {
		try {
			await updateNoteChart(id , {show : false});
			message.success('Xóa thành công');
			await fetchNotes();
			let newPath ;
			if (id == idNoteChart) {
				newPath = `/canvas/${companySelect}/${buSelect}/home/phuong-phap`;
			} else {
				newPath = `/canvas/${companySelect}/${buSelect}/home/phuong-phap/${idNoteChart}`;
			}
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

			await updateNoteChart(
				selectedFile.id,
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
			await fetchNotes();
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
	const removeVietnameseTones = (str) => {
		return str
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim();
	};

	const keyword = removeVietnameseTones(searchText || '');

	const filteredNote = searchText
		? notes?.filter((tab) =>
			removeVietnameseTones(tab?.name?.trim() || '').includes(keyword),
		)
		: notes;


	const reorder = (list, startIndex, endIndex) => {
		const result = Array.from(list);
		const [removed] = result.splice(startIndex, 1);
		result.splice(endIndex, 0, removed);
		return result;
	};

	const onDragEnd = async (result) => {
		if (!result.destination) return;

		const newNotes = reorder(notes, result.source.index, result.destination.index);

		const updatedNotes = newNotes.map((note, idx) => {
			return {
				...note,
				info: {
					...(note.info || {}),
					index: idx,
				},
			};
		});

		setNotes(updatedNotes);

		try {
			await Promise.all(
				updatedNotes.map(note =>
					updateNoteChart(note.id, { info: note.info })
				)
			);

			message.success('Cập nhật vị trí thành công');
		} catch (error) {
			console.error('Lỗi cập nhật vị trí:', error);
			message.error('Có lỗi khi cập nhật vị trí');
		}
	};


	return (
		<div className={css.contentMid}>
			<div className={css.sidebar}>
				<div className={css.topSection}>
					<div className={css.headerSidebar}>
						<div className={css.textGroup}>
							<div className={css.title}>
								Quản trị Điều hành 4.0 - Tổng quan & Phương pháp luận
							</div>
							<div
								className={css.description}
								contentEditable
								suppressContentEditableWarning
							>
								B-Canvas thay đổi triệt để, nâng tầm năng lực điều hành, tạo ra ưu thế cạnh tranh mới trên cơ sở dữ liệu,
								ứng dụng những công nghệ chắt lọc và tinh hoa quản lý, kinh nghiệm thực tế từ các chuyên gia hàng đầu.
							</div>
						</div>
						<div className={css.buttonActionGroup}>
							<div className={css.buttonAction} onClick={handleOpenModalCreate}>
								<ADD_NEW width={15} height={15}/>
							</div>
						</div>
					</div>
				</div>

				{/* PHẦN DƯỚI - DANH SÁCH */}
				<div className={css.bottomSection}>
					<DragDropContext onDragEnd={onDragEnd}>
						<Droppable droppableId="notes">
							{(provided) => (
								<div className={css.menu} ref={provided.innerRef} {...provided.droppableProps}>
									{filteredNote.map((item, idx) => (
										<Draggable key={item.id} draggableId={String(item.id)} index={idx}>
											{(provided, snapshot) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
													style={{
														marginTop : '20px',
														...provided.draggableProps.style,
														userSelect: 'none',
														background: snapshot.isDragging ? '#f0f0f0' : 'transparent',
													}}
												>
													<Dropdown
														trigger={['contextMenu']}
														menu={{
															items: contextMenuItems,
															onClick: ({ key }) => {
																if (key === '1') {
																	setSelectedFile(item);
																	setSelectedIcon(item.info?.iconSideBar);
																	setNewFileName(item.name);
																	setIsRenameModalVisible(true);
																}
															},
														}}
													>
														<div className={css.sidebarTitle}>
															<div
																className={`${css.folderRight} ${item.id == (idNoteChart || selectedNote?.id) ? css.activeItem : ''}`}
																onClick={() => handleClick(item)}
																onContextMenu={(e) => handleContextMenu(e, item)}
															>
																<div className={css.iconCard}>
																	{item.info?.iconSideBar && (
																		<img
																			src={ICON_SIDEBAR_LIST.find(data => data.name == item.info?.iconSideBar)?.icon}
																			alt={item.info?.iconSideBar}
																			width={16}
																			height={16}
																		/>
																	)}
																</div>
																<span>{item.name || `Note ${item.id}`}</span>
															</div>
														</div>
													</Dropdown>
												</div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				</div>
			</div>

			<div className={css.content} >
				<Outlet />
			</div>


			<Modal
				title='Thêm mới'
				open={isModalOpenCreate}
				onOk={handleSubmitCreate}
				onCancel={handleCloseModalCreate}
				okText='Áp dụng'
				cancelText='Hủy'
			>
				<Input
					placeholder='Nhập title...'
					value={inputCreate}
					onChange={(e) => setInputCreate(e.target.value)}
				/>
			</Modal>

			{
				isRenameModalVisible &&
				<Modal
					title='Đổi tên'
					open={isRenameModalVisible}
					onOk={handleRenameFileNotePad}
					onCancel={() => {
						setIsRenameModalVisible(false);
						setSelectedIcon( null);
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
		</div>
	);
};
