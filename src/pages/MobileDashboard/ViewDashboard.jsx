import React, { useEffect, useRef, useState } from 'react';
import css from './ViewDashboard.module.css';
import { ICON_DOWNLOAD, PauseIconMobile, SpeakerIconMobile } from '../../icon/svg/IconSvg.jsx';
import { getAllCanvasChat, getAllCanvasChatByIdKHKD } from '../../apis/CanvasChatService';
import { Checkbox, Dropdown, Menu, message, Modal, Select } from 'antd';
import { createSetting, getSettingByType, updateSetting } from '../../apis/settingService';
import { requestSpeech } from '../../apis/audioPlayService.jsx';
import { toast } from 'react-toastify';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import { getAllPhanTichNote } from '../../apisKTQT/phantichNoteService.jsx';
import DataTieuDiem from './DataTieuDiem/DataTieuDiem.jsx';
import ContentPhanTich from './ContentPhanTich/ContentPhanTich.jsx';
import { getAllKHKDTongHop } from '../../apis/khkdTongHopService.jsx';
import { getAllFile } from '../../apis/fileService.jsx';
import dayjs from 'dayjs';
import { ArrowUpOutlined } from '@ant-design/icons';
import { getCurrentUserLogin, updateUser } from '../../apis/userService.jsx';
import { getReportCanvasDataById } from '../../apis/reportCanvasService.jsx';

const { Option } = Select;
export default function ViewDashboard() {
	const [fills, setFills] = useState(['#454545']);
	const [files, setFiles] = useState(null);
	const [listAnswer, setListAnswer] = useState(null);
	const [selectedKHKDId, setSelectedKHKDId] = useState(null);
	const [selectedMonth, setSelectedMonth] = useState(null);
	const [listKHKDTH, setListKHKDTH] = useState([]);
	const [currentPlayingSection, setCurrentPlayingSection] = useState(null);
	const [sectionStatus, setSectionStatus] = useState({});
	const [openSection, setOpenSection] = useState({});
	const [audioStates, setAudioStates] = useState({});

	console.log(sectionStatus);

	const audioRef = useRef(null);
	const [progress, setProgress] = useState(0);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [showScrollButton, setShowScrollButton] = useState(false);
	const contentRef = useRef(null);

	async function loadFile(id) {
		let listFile = await getAllFile();
		let file = listFile.filter(item => item.table === 'KHKD' && item.table_id == id);
		setFiles(file);
	}

	useEffect(() => {
		const fetchData = async () => {
			try {

				let listKHKD = await getAllKHKDTongHop();
				setListKHKDTH(listKHKD);
			} catch (error) {
				console.error('Error fetching questions:', error);
			}
		};
		fetchData();
	}, []);

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


	const removeHtmlTags = (htmlString) => {
		const doc = new DOMParser().parseFromString(htmlString, 'text/html');
		return doc.body.textContent || '';
	};


	const handleSpeakRequest = async (section, text) => {
		// Kiểm tra nếu có bất kỳ section nào đang loading
		const isAnySectionLoading = Object.values(sectionStatus).some(status => status === 'loading');
		if (isAnySectionLoading) {
			message.warning('Vui lòng đợi audio đang tải xong');
			return;
		}

		// Nếu section này đang playing, pause nó
		if (sectionStatus[section] === 'playing') {
			audioStates[section]?.audio?.pause();
			setSectionStatus(prev => ({ ...prev, [section]: 'paused' }));
			return;
		}

		// Nếu section này đang paused, play nó và pause audio đang phát
		if (sectionStatus[section] === 'paused') {
			// Tìm và pause audio đang phát
			Object.entries(audioStates).forEach(([key, state]) => {
				if (key !== section && state.audio && sectionStatus[key] === 'playing') {
					state.audio.pause();
					setSectionStatus(prev => ({ ...prev, [key]: 'paused' }));
				}
			});

			// Play audio hiện tại
			audioStates[section]?.audio?.play();
			setSectionStatus(prev => ({ ...prev, [section]: 'playing' }));
			setCurrentPlayingSection(section);
			return;
		}

		// Tìm và pause audio đang phát trước khi phát audio mới
		Object.entries(audioStates).forEach(([key, state]) => {
			if (state.audio && sectionStatus[key] === 'playing') {
				state.audio.pause();
				setSectionStatus(prev => ({ ...prev, [key]: 'paused' }));
			}
		});

		// Bắt đầu phát audio mới
		setCurrentPlayingSection(section);
		setSectionStatus(prev => ({ ...prev, [section]: 'loading' }));

		try {
			const response = await requestSpeech(removeHtmlTags(text));
			if (response.message === 'SUCCESS') {
				const newAudio = new Audio(response.audioUrl);
				
				setAudioStates(prev => ({
					...prev,
					[section]: {
						audio: newAudio,
						duration: 0,
						currentTime: 0,
						progress: 0
					}
				}));

				newAudio.play();
				setSectionStatus(prev => ({ ...prev, [section]: 'playing' }));

				newAudio.onloadedmetadata = () => {
					setAudioStates(prev => ({
						...prev,
						[section]: {
							...prev[section],
							duration: newAudio.duration
						}
					}));
				};

				newAudio.ontimeupdate = () => {
					setAudioStates(prev => ({
						...prev,
						[section]: {
							...prev[section],
							currentTime: newAudio.currentTime,
							progress: (newAudio.currentTime / newAudio.duration) * 100
						}
					}));
				};

				newAudio.onended = () => {
					setSectionStatus(prev => ({ ...prev, [section]: 'idle' }));
					setCurrentPlayingSection(null);
					setAudioStates(prev => ({
						...prev,
						[section]: {
							...prev[section],
							progress: 0,
							currentTime: 0
						}
					}));
				};

				newAudio.onerror = () => {
					setSectionStatus(prev => ({ ...prev, [section]: 'idle' }));
					setCurrentPlayingSection(null);
					toast.error('Lỗi khi phát âm thanh');
				};

				newAudio.onpause = () => {
					setSectionStatus(prev => ({ ...prev, [section]: 'paused' }));
				};
			}
		} catch (error) {
			console.error(error);
			setSectionStatus(prev => ({ ...prev, [section]: 'idle' }));
			setCurrentPlayingSection(null);
			toast.error('Không thể phát âm thanh. Vui lòng thử lại!');
		}
	};

	const formatTime = (timeInSeconds) => {
		const minutes = Math.floor(timeInSeconds / 60);
		const seconds = Math.floor(timeInSeconds % 60);
		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	};


	const handleSeek = (section, event) => {
		const newTime = (event.target.value / 100) * audioStates[section].duration;
		audioStates[section].audio.currentTime = newTime;
	};

	const renderSpeakerIcon = (section, data) => {
		const audioState = audioStates[section] || { duration: 0, currentTime: 0, progress: 0 };

		switch (sectionStatus[section]) {
			case 'loading':
				return <div className={css.loadingCircle}></div>;
			case 'playing':
				return (
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
						<div onClick={() => {
							audioState.audio?.pause();
							setSectionStatus(prev => ({ ...prev, [section]: 'paused' }));
						}}>
							<PauseIconMobile />
						</div>
						<div className={css.buttonWrap}>
							<input
								type='range'
								min='0'
								max='100'
								value={audioState.progress}
								onChange={(e) => handleSeek(section, e)}
								step='1'
							/>
						</div>
						<div className={css.timeDisplay}>
							<span>{formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}</span>
						</div>
					</div>
				);
			case 'paused':
				return (
					<div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
						<div onClick={() => {
							audioState.audio?.play();
							setSectionStatus(prev => ({ ...prev, [section]: 'playing' }));
						}}>
							<SpeakerIconMobile />
						</div>
						<div className={css.buttonWrap}>
							<input
								type='range'
								min='0'
								max='100'
								value={audioState.progress}
								onChange={(e) => handleSeek(section, e)}
								step='1'
							/>
						</div>
						<div className={css.timeDisplay}>
							<span>{formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}</span>
						</div>
					</div>
				);

			case 'waiting':
				return <span>Chờ phát</span>;
			default:
				return <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
							onClick={() => handleSpeakRequest(section, data)}>
					<SpeakerIconMobile />
				</div>;
		}
	};

	const toggleSection = (section) => {
		setOpenSection(prev => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
			}
		};
	}, []);


	const highlightItem = {
		name: 'PESTEL_HIGHLIGHTS',
		subText: 'TIÊU ĐIỂM KHÁC',
	};


	const formatHighlightContent = (raw) => {
		if (!raw) return '';
		let html = raw;

		// Helper để xác định màu cho tiêu đề
		const getTitleColor = (title) => {
			const t = title.trim().toUpperCase();
			if (t === 'TÍCH CỰC') return '#006400';
			if (t === 'THÁCH THỨC') return '#d32f2f';
			if (t === 'TIN TỨC KHÁC' || t === 'TIN TỨC' || t === 'TRUNG TÍNH') return '#222';
			return '#1976d2'; // fallback mặc định xanh
		};

		// 1. Highlight các mục tiêu đề (dòng bắt đầu bằng #)
		html = html.replace(/(^|<br\/>|<br>)[ \t]*# ([^<\n]+)/g, (match, br, title) => {
			return `${br}<span class='highlight-title' style='color: ${getTitleColor(title)}'>${title.trim()}</span>`;
		});
		// 2. Highlight các mục nhóm (dòng bắt đầu bằng chữ in hoa, không có dấu hai chấm, ví dụ: TÍCH CỰC, THÁCH THỨC, TRUNG TÍNH, TIN TỨC KHÁC)
		html = html.replace(/(^|<br\/>|<br>)[ \t]*([A-ZĂÂĐÊÔƠƯÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ ]{3,})(?=<br|<br\/|$)/gm, (match, br, group) => {
			return `${br}<span class='highlight-title' style='color: ${getTitleColor(group)}'>${group.trim()}</span>`;
		});
		// 3. Highlight nếu là ## hoặc ### và là nhóm in hoa
		html = html.replace(/(^|<br\/>|<br>)[ \t]*##[ \t]*([A-ZĂÂĐÊÔƠƯÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ ]{3,})(?=<br|<br\/|$)/gm, (match, br, group) => {
			return `${br}<span class='highlight-title' style='color: ${getTitleColor(group)}'>${group.trim()}</span>`;
		});
		html = html.replace(/(^|<br\/>|<br>)[ \t]*###[ \t]*([A-ZĂÂĐÊÔƠƯÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ ]{3,})(?=<br|<br\/|$)/gm, (match, br, group) => {
			return `${br}<span class='highlight-title' style='color: ${getTitleColor(group)}'>${group.trim()}</span>`;
		});
		// 4. Highlight tiêu đề phụ in đậm **...**
		html = html.replace(/\*\*([^*\n]+)\*\*/g, (match, text) => {
			return `<span style=' font-weight: bold;'>${text.trim()}</span>`;
		});
		// 5. Chuyển markdown link thành thẻ a
		html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="highlight-link">$1</a>');
		return html;
	};

	const [highlightData, setHighlightData] = useState(null);
	const [openSectionPhanTich, setOpenSectionPhanTich] = useState(false);

	const handleClick = () => {
		setOpenSectionPhanTich(!openSectionPhanTich);
	};

	async function onChangeKHKD(id, month) {
		const validMonth = isNaN(Number(month)) ? selectedMonth : month;
		setSelectedKHKDId(id);
		await updateViewStateForDashboard({
			data: {
				selectedItemId: id,
				selectedMonth: validMonth,
			},
		});
		let listCanvasChat = await getAllCanvasChatByIdKHKD(id);
		const filteredData = listCanvasChat.filter(q => q.month == validMonth );
		await loadFile(id);
		setListAnswer(filteredData);
	}

	const fetchData = async () => {
		try {
			const data = await getAllPhanTichNote();
			const found = data.find(note => note.table === highlightItem.name);
			if (found) {

				setHighlightData({
					...found,
					body: formatHighlightContent(found.body),
				});
			}


		} catch (error) {
			console.log(error);
		}
	};


	const fetchLastView = async () => {
		const user = (await getCurrentUserLogin()).data
		if (!user?.info?.viewState?.dashBoardMobile) return;
		const dashBoard = user.info.viewState.dashBoardMobile || {};
		const selectedItem = dashBoard.selectedItemId || null;
		const selectedMonth = dashBoard.selectedMonth || null;
		setSelectedKHKDId(selectedItem)
		setSelectedMonth(selectedMonth)
		let listCanvasChat = await getAllCanvasChatByIdKHKD(selectedItem);
		const filteredData = listCanvasChat.filter(q => q.month == selectedMonth );
		await loadFile(selectedItem);
		setListAnswer(filteredData);
	};


	useEffect(() => {
		fetchLastView();
	}, []);

	useEffect(() => {
		fetchData();
	}, []);


	useEffect(() => {
		const handleScroll = () => {
			if (contentRef.current) {
				setShowScrollButton(contentRef.current.scrollTop > 300);
			}
		};

		if (contentRef.current) {
			contentRef.current.addEventListener('scroll', handleScroll, { passive: true });
		}

		return () => {
			if (contentRef.current) {
				contentRef.current.removeEventListener('scroll', handleScroll);
			}
		};
	}, []);

	const updateViewStateForDashboard = async ({ data }) => {
		const user = (await getCurrentUserLogin()).data

		const info = user.info || {};
		const viewState = info.viewState || {};
		const dashBoardMobile = viewState.dashBoardMobile || {};

		const newUser = {
			...user,
			info: {
				...info,
				viewState: {
					...viewState,
					dashBoardMobile: {
						...dashBoardMobile,
						...data,
					},
				},
			},
		};

		await updateUser(user.email, newUser);
		// setCurrentUser(newUser);
	};

	const scrollToTop = () => {
		if (contentRef.current) {
			contentRef.current.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}
	};

	const handleMonthChange = (value) => {
		setSelectedMonth(value);
		if (selectedKHKDId) {
			onChangeKHKD(selectedKHKDId, value);
		}
	};

	return (
		<div className={css.mobileDashboard}>
			<div className={css.header} style={{ backgroundColor: fills[0] }}>
				<div className={css.nameApp}>
					<img src='/Group 325.png' style={{ width: '160px' }} />
				</div>
				<span className={css.title}>Mobile Gateway</span>
			</div>
			<div className={css.content} ref={contentRef}>
				<DataTieuDiem highlightData={highlightData}
							  renderSpeakerIcon={renderSpeakerIcon}
				/>

				<div className={css.mobileContent}>
					<div className={css.headerTitle} onClick={handleClick}>
						<h2>Trợ lý phân tích</h2>
						<span className={css.arrow1}>{openSectionPhanTich ? <AiOutlineDown /> :
							<AiOutlineRight />}</span>
					</div>

					{/*<Button type={'text'} onClick={handleOpenModal}>*/}
					{/*	<DarkSettingIcon width={18} height={20} />*/}
					{/*</Button>*/}

				</div>

				{
					openSectionPhanTich && <>
						<div className={css.titleContent}>
							<div style={{ display: 'flex', gap: '10px', width: '80%' }}>
								<Select
									showSearch
									placeholder='Chọn kế hoạch kinh doanh'
									optionFilterProp='children'
									value={selectedKHKDId}
									onChange={onChangeKHKD}
									style={{ flex: 2 }}
									className={css.selectWrapper}
								>
									{listKHKDTH.map(item => (
										<Option key={item.id} value={item.id}>
											{item.name}
										</Option>
									))}
								</Select>
								<Select
									placeholder='Chọh tháng'
									value={selectedMonth}
									onChange={handleMonthChange}
									style={{ flex: 1 }}
									className={css.selectWrapper}
								>
									{Array.from({ length: 12 }, (_, i) => (
										<Option key={i + 1} value={i + 1}>
											Tháng {i + 1}
										</Option>
									))}
								</Select>
							</div>
							{files && (
								<Dropdown
									overlay={
										<Menu>
											{files.map((file, index) => (
												<Menu.Item key={index}>
													<a
														href={file.url}
														target='_blank'
														rel='noopener noreferrer'
														style={{ color: 'black', textDecoration: 'none' }}
													>
														Bản {dayjs(file.updated_at).format('HH:mm:ss - DD/MM/YYYY ')}
													</a>
												</Menu.Item>
											))}
										</Menu>
									}
									trigger={['click']}
									placement='bottomRight'
								>
									<div
										style={{
											display: 'flex',
											marginLeft: 'auto',
											gap: '8px',
											alignItems: 'center',
											cursor: 'pointer',
										}}
									>
										<ICON_DOWNLOAD width={17} height={17} />
									</div>
								</Dropdown>
							)}
						</div>
						{listAnswer && listAnswer.length > 0 && <>
							<ContentPhanTich toggleSection={toggleSection}
											 openSection={openSection}
											 renderSpeakerIcon={renderSpeakerIcon}
											 listAnswer={listAnswer}
							/></>}

					</>
				}

			</div>

			{showScrollButton && (
				<button
					onClick={scrollToTop}
					style={{
						position: 'fixed',
						bottom: '20px',
						right: '20px',
						zIndex: 100,
						width: '40px',
						height: '40px',
						borderRadius: '50%',
						backgroundColor: '#1890ff',
						color: 'white',
						border: 'none',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
					}}
				>
					<ArrowUpOutlined />
				</button>
			)}

		</div>
	);
};
