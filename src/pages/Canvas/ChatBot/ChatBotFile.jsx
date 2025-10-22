import { Modal } from 'antd';
import React, { useState } from 'react';
import FileUploader from './FileUploader.jsx';
import { answerSingleQuestionFile, uploadPdfFile } from '../../../apis/botService.jsx';
import css from './ChatBot.module.css';
import { Loader, Send } from 'lucide-react';

export function ChatBotFile({ isModalOpen, setIsModalOpen }) {
	const [isLoading, setIsLoading] = useState(false);
	const [fileData, setFileData] = useState(null);
	const [answer, setAnswer] = useState('');
	const [pdfUrl, setPdfUrl] = useState('');

	const handleFileFromUrl = async (url) => {
		try {
			setIsLoading(true);
			const response = await fetch(url);
			const blob = await response.blob();
			const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
			const result = await uploadPdfFile(file);
			console.log(result);
		} catch (error) {
			console.error('Error processing file from URL:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleFileChange = async (event) => {
		const file = event.target.files[0];
		if (file) {
			try {
				setIsLoading(true);
				const result = await uploadPdfFile(file);
				console.log(result);
			} catch (error) {
				console.error('Error uploading file:', error);
			} finally {
				setIsLoading(false);
			}
		}
	};

	const AnswerText = ({ text }) => {
		if (!text) return null;

		return (
			<div className={css.answerText}>
				{text.split('\n').map((paragraph, index) => (
					<p key={index} className={css.paragraph}>
						{paragraph}
					</p>
				))}
			</div>
		);
	};

	return (
		<Modal
			title="Gửi ảnh cho AI"
			open={isModalOpen}
			onCancel={() => setIsModalOpen(false)}
			cancelText="Hủy"
		>
			<div className={css.form}>
				<div className={css.inputGroup}>
					<input
						type="text"
						placeholder="Nhập URL của file PDF"
						value={pdfUrl}
						onChange={(e) => setPdfUrl(e.target.value)}
						className={css.urlInput}
					/>
					<button
						onClick={() => handleFileFromUrl(pdfUrl)}
						className={css.button}
						disabled={!pdfUrl || isLoading}
					>
						{isLoading ? (
							<Loader className={css.spinner} size={20} />
						) : (
							<Send size={20} />
						)}
					</button>
				</div>
				<div className={css.divider}>
					<span>hoặc</span>
				</div>
				<input type="file" accept="application/pdf" onChange={handleFileChange} />
			</div>
			{isLoading ? <p>Đang xử lý câu hỏi...</p> :
				<AnswerText text={answer} />}
		</Modal>
	);
}
