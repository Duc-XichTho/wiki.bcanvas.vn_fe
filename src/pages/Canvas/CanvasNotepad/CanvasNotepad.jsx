import css from './CanvasNotepad.module.css';
import React, { useEffect, useState, useRef } from 'react';
// API
import {
	getCanvasNotepadById,
	createNewCanvasNotepad,
	updateCanvasNotepad,
	deleteCanvasNotepad,
} from '../../../apis/canvasNotepadService';

import {
	EditOutlined, CheckOutlined, CloseOutlined,
} from '@ant-design/icons';

import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize';

Quill.register('modules/imageResize', ImageResize);
import { Button, message } from 'antd';

const Block = Quill.import('blots/block');
Block.tagName = 'div';
Quill.register(Block);

import { uploadFiles } from '../../../apis/uploadImageWikiNoteService';
import { requestSpeech } from '../../../apis/audioPlayService.jsx';
import { toast } from 'react-toastify';
import { MuteIcon, SpeakerIcon } from '../../../icon/svg/IconSvg.jsx';

const usePasteHandler = (quillMainRef, onPasteImage) => {
	useEffect(() => {
		const quillEditor = quillMainRef.current?.getEditor();
		if (!quillEditor) return;

		const handleImagePaste = async (file) => {
			if (!file.type.startsWith('image/')) {
				console.warn('File is not an image:', file);
				return;
			}

			try {
				const timestamp = Date.now();
				const newFileName = `image-${timestamp}${file.name.slice(file.name.lastIndexOf('.'))}`;
				const newFile = new File([file], newFileName, { type: file.type });

				const uploadedImageUrls = await uploadFiles([newFile]);
				if (uploadedImageUrls.files.length > 0) {
					const imageUrl = uploadedImageUrls.files[0].fileUrl;
					onPasteImage(imageUrl);
				}
			} catch (error) {
				console.error('Error uploading image:', error);
				toast.error('Đã xảy ra lỗi khi tải lên hình ảnh.');
			}
		};

		const handlePaste = (event) => {
			const clipboardData = event.clipboardData;
			if (clipboardData && clipboardData.files.length > 0) {
				Array.from(clipboardData.files).forEach(file => {
					if (file.type.startsWith('image/')) {
						event.preventDefault();
						handleImagePaste(file);
					}
				});
			}
		};

		quillEditor.root.addEventListener('paste', handlePaste);

		return () => {
			quillEditor.root.removeEventListener('paste', handlePaste);
		};
	}, [quillMainRef, onPasteImage]);
};


const CanvasNotepad = ({ canvasId }) => {
	const quillMainRef = useRef(null);
	const [notePad, setNotePad] = useState(null);
	const [contentMain, setContentMain] = useState('');
	const [originalContentMain, setOriginalContentMain] = useState('');
	const [isEditing, setIsEditing] = useState(false);

	const fetchDataNotePad = async () => {
		try {
			const response = await getCanvasNotepadById(canvasId);
			setNotePad(response);
			setContentMain(response.content);
			setOriginalContentMain(response.content);
		} catch (error) {
			console.error('Failed to fetch canvas containers:', error);
		}
	};

	useEffect(() => {
		fetchDataNotePad();
	}, []);

	const handlePasteImage = (pastedImage) => {
		const range = quillMainRef.current?.getEditor().getSelection();
		if (range) {
			quillMainRef.current?.getEditor().insertEmbed(range.index, 'image', pastedImage);
			quillMainRef.current?.getEditor().setSelection(range.index + 1);
		}
	};

	usePasteHandler(quillMainRef, handlePasteImage);

	const modules = {
		toolbar: [
			[
				{ 'header': [1, 2, 3, false] },
				'bold',
				'italic',
				'underline',
				'strike',
				{ color: [] },
				{ background: [] },
				{ list: 'ordered' },
				{ list: 'bullet' },
				{ align: [] },
				{ 'indent': '-1' },
				{ 'indent': '+1' },
			],
		],
		imageResize: {},
		clipboard: {
			matchVisual: true,
		},
	};

	const toolBarOff = {
		toolbar: false,
	};


	const handleEditClick = () => {
		// audioRef.current.pause();
		setIsPlaying(false);
		setIsLoading(false);
		setProgress(0);
		setIsEditing(true);
	};

	const handleSaveNote = async () => {
		try {
			const dataUpdatedNote = {
				...notePad,
				content: contentMain,
			};

			await updateCanvasNotepad(dataUpdatedNote);
			await fetchDataNotePad();

			setIsEditing(false);
			setOriginalContentMain(contentMain);

		} catch (error) {
			console.error('Error updating note:', error);
		} finally {
			message.success('Cập nhật thành công');
		}
	};

	const handleCancelEdit = async () => {
		setContentMain(originalContentMain);
		setIsEditing(false);
	};

	const [isPlaying, setIsPlaying] = useState(false);
	const audioRef = useRef(null);
	const [progress, setProgress] = useState(0);
	const [isLoading, setIsLoading] = useState(false); // Trạng thái loading
	const [duration, setDuration] = useState(0); // Thời gian tổng
	const [currentTime, setCurrentTime] = useState(0); // Thời gian hiện tại

	const removeHtmlTags = (htmlString) => {
		const doc = new DOMParser().parseFromString(htmlString, 'text/html');
		return doc.body.textContent || '';
	};

	const downloadAudio = async (text) => {
		try {
			const dataVoice = await requestSpeech(removeHtmlTags(text));
			const filename = 'aaa';
			const response = await fetch(dataVoice.audioUrl);
			const blob = await response.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (error) {
			console.error('Lỗi khi tải file:', error);
		}
	};


	const handleSpeaks = async (text) => {
		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
			return;
		}

		try {
			setIsLoading(true);
			const response = await requestSpeech(removeHtmlTags(text));
			if (response.message === 'SUCCESS') {
				const newAudio = new Audio(response.audioUrl);
				audioRef.current = newAudio;
				newAudio.play();
				setIsPlaying(true);
				setIsLoading(false);
				newAudio.onloadedmetadata = () => {
					setDuration(newAudio.duration); // Set duration
				};

				newAudio.ontimeupdate = () => {
					setCurrentTime(newAudio.currentTime); // Set current time
					setProgress((newAudio.currentTime / newAudio.duration) * 100);
				};

				// Khi âm thanh kết thúc, tự động dừng lại
				newAudio.onended = () => {
					setIsPlaying(false);
					setIsLoading(false);
					setProgress(0);
				};
			}
		} catch (error) {
			toast.error('Không thể phát âm thanh. Vui lòng thử lại!');
			setIsLoading(false); // Dừng loading khi có lỗi

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

	return (
		<div className={css.main}>
			<div className={css.quillContainer}>
				<div className={css.quillMain}>
					<ReactQuill
						ref={quillMainRef}
						key={isEditing ? 'edit' : 'view'}
						className={css.reactQuillMain}
						theme='snow'
						value={contentMain}
						onChange={setContentMain}
						modules={isEditing ? modules : toolBarOff}
						readOnly={!isEditing}
					/>
				</div>
			</div>
			<div className={css.action}>

				{!isEditing ? (
					<>
						{isLoading ? (
							<div className={css.loadingCircle}></div>
						) : (
							isPlaying ? (
								<div className={css.buttonWrap} onClick={() => handleSpeaks(contentMain)}>
									<MuteIcon width={20} height={20} />
								</div>) : (
								<>
									<div className={css.buttonWrap} onClick={() => handleSpeaks(contentMain)}>
										<SpeakerIcon width={20} height={20} />
									</div>
								</>

							)
						)}
						{isPlaying && (
							<>
								<div className={css.buttonWrap}>
									<input
										type='range'
										min='0'
										max='100'
										value={progress}
										onChange={handleSeek}
										step='1'
									/>
								</div>
								<div className={css.timeDisplay}>
									<span>{formatTime(currentTime)} / {formatTime(duration)}</span>
								</div>
							</>


						)}
						<Button
							type='text'
							shape='circle'
							icon={<EditOutlined />}
							onClick={handleEditClick}
						/>
					</>

				) : (
					<>
						<Button
							type='text'
							shape='circle'
							icon={<CloseOutlined />}
							onClick={handleCancelEdit}
						/>
						<Button
							type='text'
							shape='circle'
							icon={<CheckOutlined />}
							onClick={handleSaveNote}
						/>
					</>
				)}
			</div>
		</div>
	);
};

export default CanvasNotepad;