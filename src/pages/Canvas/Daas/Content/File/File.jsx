import React, { useContext, useEffect, useState } from 'react';
import css from '../Content.module.css';
import { MyContext } from '../../../../../MyContext.jsx';
import UploadFileForm from './UploadFileForm.jsx';
import { IconUser, OffFavoriteIcon, OnFavoriteIcon, SearchIcon } from '../../../../../icon/IconSVG.js';
import { Button, Checkbox, Modal, Popover } from 'antd';
import { FaEllipsisV } from 'react-icons/fa';
import { IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { deleteFileChild, getAllFileChild, updateFileChild } from '../../../../../apis/fileChildService.jsx';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { formatDateISO } from '../../../../../generalFunction/format.js';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getAllUserClass } from '../../../../../apis/userClassService.jsx';
import { updateFileNotePad } from '../../../../../apis/fileNotePadService.jsx';
import { Settings } from 'lucide-react';
import DialogSettingTagForFile from '../../Dialog/DialogSettingTagForFile.jsx';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { getAllTag, getTagDataById } from '../../../../../apis/tagService.jsx';
import {
	Card_Icon,
	Search_Icon,
	Upload_Icon,
	Form_Icon,
	SettingTable_Icon, APIIcon,
} from '../../../../../icon/svg/IconSvg.jsx';
import { n8nWebhookV2 } from '../../../../../apis/n8nWebhook.jsx';


const File = ({ fileNotePad, fetchData }) => {
	const location = useLocation();
	const {
		selectedTapCanvas,
		setSelectedTapCanvas,
		listUC_CANVAS,
		currentUser,
		uCSelected_CANVAS,
		loadData,
		setLoadData,

	} = useContext(MyContext);
	const navigate = useNavigate();
	const { companySelect, buSelect, tabSelect, id, idFile } = useParams();
	const [fileChildren, setFileChildren] = useState([]);
	const [tagFileChildren, setTagFileChildren] = useState([]);
	const [tagFileNote, setTagFileNote] = useState('');
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
	const [bookmarkedFiles, setBookmarkedFiles] = useState([]);
	const [open, setOpen] = useState(false);
	const [openSetupUC, setOpenSetupUC] = useState(false);
	const [selectedTag, setSelectedTag] = useState(null);
	const [selectedTagEdit, setSelectedTagEdit] = useState(null);
	const [isView, setIsView] = useState(false);
	const [listUC, setListUC] = useState([]);
	const [selectedUC, setSelectedUC] = useState(new Set(fileNotePad?.userClass || []));
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [isHidden, setIsHidden] = useState(false);

	useEffect(() => {
		getAllUserClass().then((data) => {
			setListUC(data.filter(e => e.module == 'CANVAS'));
		});
	}, []);

	useEffect(() => {
		let isView = false;
		if (fileNotePad?.userClass) {
			isView = listUC_CANVAS.filter(item => fileNotePad.userClass.includes(item.id)).length > 0;
		}
		setIsView(isView);
	}, [fileNotePad?.userClass, listUC_CANVAS, currentUser]);


	const filteredFiles = fileChildren.filter(file => {
		let isValid = true;

		if (searchText) {
			isValid = file.name.toLowerCase().includes(searchText.toLowerCase());
		}

		if (showOnlyBookmarked) {
			const bookmarkedIds = bookmarkedFiles
				.filter(item => item.id == id)
				.flatMap(item => item.files.map(f => f.idFile));
			isValid = isValid && bookmarkedIds.includes(file.id);
		}

		if (selectedTag) {
			isValid = isValid && file.tag_id == selectedTag.id;
		}
		return isValid;
	});


	const fetchDataFileChild = async () => {
		try {
			const data = await getAllFileChild();
			if (fileNotePad?.id || id) {
				let filteredData = data;
				if (isHidden) {
					filteredData = filteredData.filter(item => item.table_id == (id || fileNotePad.id) && item.show == false);
				} else {
					filteredData = filteredData.filter(item => item.table_id == (id || fileNotePad.id) && item.show == true);
				}
				setFileChildren(filteredData);
			}
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu file con:', error);
		}
	};

	const fetchDataTagFileChild = async () => {
		try {
			const data = await getAllTag();
			const filteredData = data.filter(tag => tag.table == 'file_note_child' && tag.table_id == id);
			setTagFileChildren(filteredData);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu file con:', error);
		}
	};

	const fetchDataTagFileNote = async (fileNotePad) => {
		try {
			const numericId = Number(fileNotePad.tag_id);
			if (isNaN(numericId)) {
				console.error('ID không hợp lệ:', id);
				return;
			}

			const data = await getTagDataById(numericId);
			if (data) setTagFileNote(data.name);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu file con:', error);
		}
	};


	useEffect(() => {
		if (fileNotePad?.id || id) {
			fetchDataFileChild();
			// fetchDataTagFileNote(fileNotePad)
		}
		fetchDataTagFileChild();
	}, [fileNotePad, id]);

	useEffect(() => {
		fetchDataFileChild();
	}, [isHidden]);


	const handleSearchChange = (e) => {
		setSearchText(e.target.value);
	};

	const handleClick = async (value) => {
		const currentPath = location.pathname;

		let newPath = '';

		if (currentPath.includes('du-lieu-tong-hop')) {
			newPath = `/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-tong-hop/${id}/file/${value.id}`;
		} else if (currentPath.includes('du-lieu-dau-vao')) {
			newPath = `/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-dau-vao/${id}/file/${value.id}`;
		} else {
			// fallback nếu không khớp
			newPath = `/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-tong-hop/${id}/file/${value.id}`;
		}

		navigate(newPath);
	};

	const getFileTypeStyle = (type) => {
		const styles = {
			pdf: { color: '#CA6751', backgroundColor: '#F8D5CE', border: '1px solid #CA6751' },
			png: { color: '#C28919', backgroundColor: '#FFE2BE', border: '1px solid #C28919' },
			jpg: { color: '#C28919', backgroundColor: '#FFE2BE', border: '1px solid #C28919' },
			doc: { color: '#3D7DE5', backgroundColor: '#BED7FF', border: '1px solid #3D7DE5' },
			docx: { color: '#3D7DE5', backgroundColor: '#e8f3fc', border: '1px solid #54a1e4' },
			xlsx: { color: '#3D7F3F', backgroundColor: '#DFEFE0', border: '1px solid #3D7F3F' },
		};

		return styles[type] || { color: '#000', backgroundColor: '#f0f0f0' };
	};

	const handleBookmark = (rowId, fileId) => {
		const key = 'bookmarkedItemsCanvasFile';

		let bookmarks = JSON.parse(localStorage.getItem(key)) || [];

		const existingItem = bookmarks.find(item => item.id === rowId);

		if (existingItem) {
			const fileIndex = existingItem.files.findIndex(file => file.idFile === fileId);

			if (fileIndex === -1) {
				existingItem.files.push({ idFile: fileId });
			} else {
				existingItem.files.splice(fileIndex, 1);
				if (existingItem.files.length === 0) {
					bookmarks = bookmarks.filter(item => item.id !== rowId);
				}
			}
		} else {
			bookmarks.push({ id: rowId, files: [{ idFile: fileId }] });
		}
		localStorage.setItem(key, JSON.stringify(bookmarks));
		setBookmarkedFiles([...bookmarks]);

	};


	useEffect(() => {
		const key = 'bookmarkedItemsCanvasFile';
		const bookmarks = JSON.parse(localStorage.getItem(key)) || [];
		setBookmarkedFiles(bookmarks);
		setShowOnlyBookmarked(false);
		setSelectedTag(null);
	}, [fileNotePad, id]);


	const handleOpenChange = (visible) => {
		setOpen(visible);
	};

	const handleChangeTag = (data) => {
		setOpen(false);
		setSelectedTag(data);
	};

	const content = (
		<div>
			<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
				<li className={css.item} onClick={() => handleChangeTag(null)}>Tất cả</li>
				{
					tagFileChildren.map(item => (
						<li className={css.item} onClick={() => handleChangeTag(item)}>{item.name}</li>
					))
				}
			</ul>
		</div>
	);


	const handleOpenPopover = (file, event) => {
		event.stopPropagation();
		setSelectedFile(file);
	};

	const handleEdit = async (data) => {
		const updatedFile = {
			...selectedFile,
			tag_id: data.id,
		};
		await updateFileChild(updatedFile);
		setSelectedFile(updatedFile);
		await fetchDataFileChild();
	};


	const handleDelete = async () => {
		if (selectedFile) {
			Modal.confirm({
				title: 'Xác nhận xóa',
				content: 'Bạn có chắc chắn muốn xóa mục dữ liệu này không?',
				okText: 'Đồng ý',
				cancelText: 'Hủy',
				onOk: async () => {
					if (selectedFile) {
						await deleteFileChild(selectedFile.id);
						await fetchDataFileChild();
						navigate(`/canvas/${companySelect}/${buSelect}/thuc-hien/du-lieu-tong-hop/${id}`);
						setLoadData(!loadData);
					}
				},
			});
		}
	};

	const handleBackUp = async () => {
		if (selectedFile) {
			const updatedData = {
				id: selectedFile.id,
				show: true,
			};
			await updateFileChild(updatedData);
			await fetchDataFileChild();
			navigate(`/canvas/${companySelect}/${buSelect}/${tabSelect}/daas/${id}`);
		}
	};


	const popoverContent = (
		<div className={css.popoverContainer}>
			<div className={css.popoverTags}>
				{
					tagFileChildren.map(item => (
						<span onClick={() => handleEdit(item)}
							  className={`${css.tagPopUp} ${selectedFile?.tag_id == item.id ? css.selectedTag : ''}`}
						># {item.name}
                        </span>
					))
				}
			</div>
			{
				isHidden ?
					<div className={css.turnOnOption} onClick={handleBackUp}>
						Khôi phục lại
					</div> :
					<div className={css.deleteOption} onClick={handleDelete}>
						Xóa mục dữ liệu
					</div>
			}


		</div>
	);

	const handleChange = (name) => {
		setSelectedUC((prev) => {
			const newSet = new Set(prev);
			newSet.has(name) ? newSet.delete(name) : newSet.add(name);
			return newSet;
		});
	};


	const toggleHidden = () => {
		setIsHidden(prevState => !prevState);
	};

	const isEncoded = (str) => {
		return /%[0-9A-F]{2}|\\x[0-9A-F]{2}|Ã|Â|¼|½|¾|¿|ý|ÿ|�/.test(str);
	};

	const tryDecoding = (str, encoding) => {
		try {
			const bytes = new Uint8Array([...str].map(char => char.charCodeAt(0)));
			return new TextDecoder(encoding).decode(bytes);
		} catch {
			return str;
		}
	};

	const fixEncoding = (str) => {
		let decoded = str;
		let attempts = 0;
		const encodings = ['utf-8', 'windows-1252', 'iso-8859-1'];

		while (isEncoded(decoded) && attempts < 10) {
			for (const encoding of encodings) {
				const newDecoded = tryDecoding(decoded, encoding);
				if (newDecoded !== decoded) {
					decoded = newDecoded;
					break;
				}
			}
			attempts++;
		}

		return decoded;
	};


	return (
		currentUser.isAdmin || isView ?
			<div className={css.mainContent}>
				<div className={`${css.sidebar} ${isSidebarCollapsed ? css.collapsed : ''}`}>
					{/* Header */}
					{!isSidebarCollapsed ?
						<>
							<div className={css.header2}>
								<div className={css.headerLeft}>
									{/*<span title={fileNotePad.name}>{fileNotePad.name}</span>*/}
									<span title={fileNotePad.name}>Danh sách các file</span>
								</div>

								{/*<div className={css.icons} onClick={() => setIsSidebarCollapsed(true)}>*/}
								{/*    <IconButton size="small">*/}
								{/*        <ChevronLeftIcon/>*/}
								{/*    </IconButton>*/}
								{/*</div>*/}
							</div>

							{/* Tags */}
							<div className={css.tagsContainer}>
								<div className={css.tags}>

									<UploadFileForm
										id={fileNotePad.id}
										table={'FileUpLoad'}
										style={{ fontSize: 15 }}
										onGridReady={() => {
											fetchData();
											setLoadData(!loadData);
										}}
									/>
									<div className={css.tagRight}>
										<div className={css.filterTag}>
											<img src={IconUser} alt=''
												 onClick={() => (currentUser.isAdmin || fileNotePad.user_create == currentUser.email) && setOpenSetupUC(true)}
											/>
											{fileNotePad.userClass &&
												fileNotePad.userClass.map(uc =>
													<span className={css.tag}>{uc}</span>,
												)
											}
										</div>
										<div className={css.filterTag}>
											<div onClick={toggleHidden} style={{ cursor: 'pointer', fontSize: '20px' }}>
												{isHidden ? (
													<EyeInvisibleOutlined style={{ fontSize: 18, opacity: 0.5 }} />
												) : (
													<EyeOutlined style={{ fontSize: 18, opacity: 0.5 }} />
												)}
											</div>
										</div>
										<div className={css.filterTag}>
											<div onClick={() => setShowOnlyBookmarked(prev => !prev)}
												 className={css.bookmark}>
												<img src={
													showOnlyBookmarked
														? OnFavoriteIcon
														: OffFavoriteIcon
												}
													 alt=''
													 width={16}
													 height={16}
												/>
											</div>
										</div>
									</div>
									{/*<p>#{tagFileNote}</p>*/}
									{/*<div className={css.setting}>*/}
									{/*    {currentUser.isAdmin && (*/}
									{/*        <Settings className={css.settingIcon} size={18}*/}
									{/*                  onClick={() => setIsDialogOpen(true)} />*/}
									{/*    )}*/}
									{/*</div>*/}
									{/*<DialogSettingTagForFile visible={isDialogOpen} onClose={() => setIsDialogOpen(false)}*/}
									{/*                         setTags={setTagFileChildren} />*/}
									{/*<img src={IconUser} alt=""*/}
									{/*     onClick={() => (currentUser.isAdmin || fileNotePad.user_create == currentUser.email) && setOpenSetupUC(true)}*/}
									{/*/>*/}
									{/*{fileNotePad.userClass &&*/}
									{/*    fileNotePad.userClass.map(uc =>*/}
									{/*        <span className={css.tag}>{uc}</span>,*/}
									{/*    )*/}
									{/*}*/}
								</div>
								<div className={css.search}>
									<div className={css.searchWrap}>
										<Search_Icon width={19} />
										<input className={css.searchBox}
											   placeholder='Tìm kiếm'
											   value={searchText}
											   onChange={handleSearchChange}
										/>
									</div>
								</div>
								<div className={css.headerOption}>
									{/*<div onClick={() => setShowOnlyBookmarked(prev => !prev)}>*/}
									{/*    <img src={*/}
									{/*        showOnlyBookmarked*/}
									{/*            ? OnFavoriteIcon*/}
									{/*            : OffFavoriteIcon*/}
									{/*    }*/}
									{/*         alt=""*/}
									{/*         width={16}*/}
									{/*         height={16}*/}
									{/*    />*/}
									{/*</div>*/}
									{/*<Popover*/}
									{/*    content={content}*/}
									{/*    trigger="click"*/}
									{/*    open={open}*/}
									{/*    onOpenChange={handleOpenChange}*/}
									{/*    placement="bottom"*/}
									{/*>*/}
									{/*    <div className={css.filterTag}>*/}
									{/*        <span># {selectedTag ? selectedTag.name : "Phân loại"} </span>*/}
									{/*    </div>*/}
									{/*</Popover>*/}
									{/*<div onClick={toggleHidden} style={{cursor: 'pointer', fontSize: '20px'}}>*/}
									{/*    {isHidden ? (*/}
									{/*        <EyeInvisibleOutlined style={{fontSize: 18, opacity: 0.5}}/>*/}
									{/*    ) : (*/}
									{/*        <EyeOutlined style={{fontSize: 18, opacity: 0.5}}/>*/}
									{/*    )}*/}
									{/*</div>*/}
									{/*<div className={css.buttonSearch}>*/}
									{/*    <img src={SearchIcon} alt="" width={16} height={16}/>*/}
									{/*    <input*/}
									{/*        type="text"*/}
									{/*        className={css.quickFilterInput}*/}
									{/*        value={searchText}*/}
									{/*        // placeholder="Tìm kiếm"*/}
									{/*        onChange={handleSearchChange}*/}
									{/*    />*/}
									{/*</div>*/}
								</div>


								{/* File List */}
								<div className={css.fileList}>
									{filteredFiles.map((file) => {
										const isBookmarked = bookmarkedFiles.some(item =>
											item.id === id && item.files.some(f => f.idFile === file.id),
										);
										const check = tagFileChildren.find(tag => tag.id == file.tag_id);

										return (
											<div key={file.id} className={css.fileCard}
												 style={{ border: idFile == file.id && '1px solid #5797B4' }}
												 onClick={() => handleClick(file)}
											>
												{/*<div className={css.fileType} style={getFileTypeStyle(file.type)}>*/}
												{/*	<span className={css.fileTypeName}>*/}
												{/*		{file.type}*/}
												{/*	</span>*/}
												{/*</div>*/}
												<div className={css.fileInfo}>
													<div className={css.fileTitle}>{fixEncoding(file.name)}</div>
													<div>
														<div className={css.fileMeta}>
															<div className={css.tagName}>
																{check ? (
																	<span>#{tagFileChildren.find(tag => tag.id == file.tag_id)?.name}</span>
																) : (
																	<span></span>
																)}
															</div>
															{/*<div >*/}
															{/*</div>*/}
															<div className={css.fileActions}>
                                                            <span className={css.updateAt}>
                                                                {formatDateISO(file.updated_at || file.created_at)} ({file.user_update?.split('@')[0] || file.user_create?.split('@')[0]})
                                                            </span>
																<img
																	onClick={(e) => {
																		e.stopPropagation();
																		handleBookmark(id, file.id);
																	}}
																	src={
																		isBookmarked
																			? OnFavoriteIcon
																			: OffFavoriteIcon
																	}
																	alt=''
																	width={14}
																	height={14}
																/>
																<Popover content={popoverContent} trigger='click'
																		 placement='right'>
																	<FaEllipsisV
																		className={css.optionsIcon}
																		style={{
																			width: '12px',
																			height: '12px',
																			cursor: 'pointer',
																		}}
																		onClick={(e) => handleOpenPopover(file, e)}
																	/>
																</Popover>
															</div>
														</div>
													</div>
												</div>
											</div>
										);
									})}

								</div>
							</div>
						</>
						:

						<div className={css.icons} onClick={() => setIsSidebarCollapsed(false)}>
							<IconButton size='small'>
								<ChevronRightIcon />
							</IconButton>
						</div>
					}
				</div>


				<div className={css.valueContent2}>
					<div className={css.funciton}>
					</div>
					<div className={css.placeholder}>
						<Outlet />
					</div>
				</div>

				{openSetupUC &&
					<>
						<Modal
							title={`Cài đặt nhóm người dùng`}
							open={openSetupUC}
							onCancel={() => setOpenSetupUC(false)}
							onOk={() => {
								updateFileNotePad({
									...fileNotePad,
									userClass: Array.from(selectedUC),
								}).then(data => {
									setOpenSetupUC(false);
									fetchData();
								});
							}}
							centered
							width={400}
							bodyStyle={{ height: '20vh', overflowY: 'auto' }}
						>
							{listUC.map((uc) => {
								const isDisabled = !currentUser?.isAdmin && !(uc.userAccess?.includes(currentUser?.email));
								return (
									<Checkbox
										key={uc.name}
										checked={selectedUC.has(uc.name)}
										onChange={() => handleChange(uc.name)}
										disabled={isDisabled}
									>
										{uc.name}
									</Checkbox>
								);
							})}
						</Modal>
					</>
				}
			</div>

			:
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '90vh',
				color: 'red',
				fontSize: '18px',
			}}>
				Không có quyền để xem
			</div>
	);
};

export default File;
