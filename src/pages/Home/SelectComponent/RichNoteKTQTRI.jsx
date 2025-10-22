import { toast } from 'react-toastify';
import React, { useState, useEffect, useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import css from './RichNote.module.css';
import { TiptapToolbar } from '../../Canvas/StrategicAnalysis/ComponentWarehouse/TiptapToolbar';
import { useEditor } from '../../Canvas/StrategicAnalysis/ComponentWarehouse/useEditor';
import { createPhanTichNote, getAllPhanTichNote, updatePhanTichNote } from '../../../apisKTQT/phantichNoteService.jsx';
import { CancelIcon } from '../../../icon/IconSVG.js';
import { getCurrentUserLogin } from '../../../apis/userService.jsx';
import { requestSpeech } from '../../../apis/audioPlayService.jsx';
import { MuteIcon, SpeakerIcon } from '../../../icon/svg/IconSvg.jsx';
import { Button } from 'antd';
import { EditIcon, SaveIcon } from '../../Canvas/DuLieu/HomeCanvas/TiptapHome/ListIcon.jsx';

const RichNoteKTQTRI = ({ table, fromMapping, fetchData }) => {
	const { editor } = useEditor();
	const [phantichNote, setPhanTichNote] = useState({});
	const [isEditing, setIsEditing] = useState(false);
	const [currentUser, setCurrentUser] = useState(null);
	const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [fontMenuOpen, setFontMenuOpen] = useState(false);
	const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
	const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);

	// Audio states
	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef(null);
	const [progress, setProgress] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [showButton, setShowButton] = useState(false);

	useEffect(() => {
		if (editor) {
			editor.setEditable(isEditing);
		}
	}, [isEditing, editor]);

	const fetchCurrentUser = async () => {
		const result = await getCurrentUserLogin();
		if (result?.data) {
			setCurrentUser(result.data);
		} else {
			console.error(result?.error?.message);
		}
	};

	const fetchAllPhanTichNote = async () => {
		try {
			if (currentUser && currentUser !== null && editor) {
				const notes = await getAllPhanTichNote();
				const foundNote = notes.find(note => note.table == table);

				if (foundNote) {
					setPhanTichNote(foundNote);
					editor.commands.setContent(foundNote.body);
				} else {
					const newNoteData = {
						body: '<p></p>',
						user_email: currentUser.email,
						user_name: currentUser.name,
						table: table,
					};

					const newNote = await createPhanTichNote(newNoteData);
					setPhanTichNote(newNote);
					editor.commands.setContent(newNote.body);
				}
			}
		} catch (error) {
			console.error('Error fetching or creating PhanTichNote:', error);
		}
	};

	useEffect(() => {
		fetchCurrentUser();
	}, []);

	useEffect(() => {
		if (editor) {
			const init = async () => {
				await fetchAllPhanTichNote();
			};
			init();
		}
	}, [table, currentUser, editor]);

	const handleEditClick = async () => {
		audioRef?.current?.pause();
		setIsPlaying(false);
		setIsLoading(false);
		setProgress(0);
		if (currentUser.isAdmin) {
			setIsEditing(true);
		} else {
			toast.warn('Bạn không có quyền sửa vì không phải là Admin!', {
				autoClose: 2000,
			});
		}
	};

	const handleSaveClick = () => {
		try {
			const content = editor.getHTML();
			updatePhanTichNote(phantichNote.id, {
				body: content,
				user_name: currentUser.name,
				user_email: currentUser.email,
			});
			setIsEditing(false);

			toast.success('Đã lưu!', {
				position: 'bottom-center',
				autoClose: 2000,
			});
			if (fetchData) {
				fetchData();
			}
		} catch (error) {
			console.error('Error updating wiki note:', error);
		}
	};

	const handleCancelClick = () => {
		editor.commands.setContent(phantichNote.body);
		setIsEditing(false);
	};

	const removeHtmlTags = (htmlString) => {
		const doc = new DOMParser().parseFromString(htmlString, 'text/html');
		return doc.body.textContent || '';
	};

	const handleSpeaks = async () => {
		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
			return;
		}

		try {
			setIsLoading(true);
			const text = editor.getHTML();
			const response = await requestSpeech(removeHtmlTags(text));
			if (response.message === 'SUCCESS') {
				const newAudio = new Audio(response.audioUrl);
				audioRef.current = newAudio;
				newAudio.play();
				setIsPlaying(true);
				setIsLoading(false);
				newAudio.onloadedmetadata = () => {
					setDuration(newAudio.duration);
				};
				newAudio.ontimeupdate = () => {
					setCurrentTime(newAudio.currentTime);
					setProgress((newAudio.currentTime / newAudio.duration) * 100);
				};
				newAudio.onended = () => {
					setIsPlaying(false);
					setIsLoading(false);
					setProgress(0);
				};
			}
		} catch (error) {
			toast.error('Không thể phát âm thanh. Vui lòng thử lại!');
			setIsLoading(false);
		}
	};

	const handleSeek = (event) => {
		const newTime = (event.target.value / 100) * audioRef.current.duration;
		audioRef.current.currentTime = newTime;
	};

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
			}
		};
	}, []);

	const formatTime = (timeInSeconds) => {
		const minutes = Math.floor(timeInSeconds / 60);
		const seconds = Math.floor(timeInSeconds % 60);
		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	};

	if (!editor) {
		return null;
	}

	return (
		<div className={'chuGiai'} style={{ maxWidth: fromMapping ? '500px' : '1210px', marginLeft: 10 }}>

			<div className={css.tool_bar} style={{ display: isEditing ? 'block' : 'none' }}>
				<TiptapToolbar
					editor={editor}
					headingMenuOpen={headingMenuOpen}
					setHeadingMenuOpen={setHeadingMenuOpen}
					tableMenuOpen={tableMenuOpen}
					setTableMenuOpen={setTableMenuOpen}
					fontMenuOpen={fontMenuOpen}
					setFontMenuOpen={setFontMenuOpen}
					colorPickerMenuOpen={colorPickerMenuOpen}
					setColorPickerMenuOpen={setColorPickerMenuOpen}
					fontSizeMenuOpen={fontSizeMenuOpen}
					setFontSizeMenuOpen={setFontSizeMenuOpen}
				/>
			</div>


			<div className={css.tiptap}>

				<div className={isEditing ? css.editorContent : css.editorContentFull}>
					<EditorContent
						className={css.editorContentWrap}
						editor={editor}
					/>
				</div>
			</div>
			<div className={css.buttons2}>
				{isEditing ? (
					<div className={css.buttonWrapAF}>
						<div onClick={handleSaveClick} className={css.buttonWrap}>
							<img src={SaveIcon} alt="" />
							<span>Lưu</span>
						</div>
						<div onClick={handleCancelClick} className={css.buttonWrap}>
							<img src={CancelIcon} alt="" />
							<span>Hủy</span>
						</div>
					</div>
				) : (
					<div className={css.buttonWrapAF}>
						{isLoading ? (
							<div className={css.loadingCircle}></div>
						) : (
							isPlaying ? (
								<div className={css.buttonWrap} onClick={handleSpeaks}>
									<MuteIcon width={20} height={20} />
								</div>) : (
								// <div className={css.buttonWrap} onClick={handleSpeaks}>
								//     <SpeakerIcon width={20} height={20} />
								// </div>
								''
							)
						)}
						{isPlaying && (
							<>
								<div className={css.buttonWrap}>
									<input
										type="range"
										min="0"
										max="100"
										value={progress}
										onChange={handleSeek}
										step="1"
									/>
								</div>
								<div className={css.timeDisplay}>
									<span>{formatTime(currentTime)} / {formatTime(duration)}</span>
								</div>
							</>
						)}
						{currentUser && currentUser.isAdmin && (
							<>
								{!showButton ? (
									<Button onClick={handleEditClick} icon={<EditIcon />}>
										Cập nhật
									</Button>
								) : (
									<Button onClick={handleSaveClick} icon={<SaveIcon />}>
										Lưu
									</Button>
								)}
							</>
						)}

					</div>
				)}
			</div>
		</div>

	);
};

export default RichNoteKTQTRI;
