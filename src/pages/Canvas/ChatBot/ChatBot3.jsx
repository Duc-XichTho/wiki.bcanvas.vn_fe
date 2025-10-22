// ChatBot.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Loader, MessageSquare, Send, Trash2 } from 'lucide-react';
import css from './ChatBot.module.css';
import { message, Select } from 'antd';
import { MyContext } from '../../../MyContext.jsx';
import { EditIcon } from '../StrategicAnalysis/ComponentWarehouse/ListIcon.jsx';
// API
import {
	createCanvasChat,
	deleteCanvasChat,
	getAllCanvasChatByIdKHKD,
	updateCanvasChat,
} from '../../../apis/CanvasChatService.jsx';
import { CollapseIconOff, CollapseIconOn } from '../../../icon/svg/IconSvg.jsx';
import IconButton from '@mui/material/IconButton';
import { filterArrayByMonth } from './logicFilterMonth.js';
import { fetchDataTHCKKH } from '../../KHKD/KHKDChuKy/logicKHKDBanHang.js';
import { autoAnalyzeAllTypes } from './logicRunAI.js';
import { loadKPIData } from '../../KHKD/KHKDTongHop/KPI/logicKHKDKPI.js';
import { answerSingleQuestion } from '../../../apis/botService.jsx';

const ChatBot3 = ({
					  idKHKD,
					  canvasBot,
					  newQuestion,
					  setNewQuestion,
					  selectedQuestion,
					  setSelectedQuestion,
					  isNewQuestion,
					  setIsNewQuestion, dataKQKD, dataDoLuong, dataDT, dKPIDataAI, dataTT, khkdTH
				  }) => {
	const [questions, setQuestions] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [questionToDelete, setQuestionToDelete] = useState(null);
	const { botSetting, setBotSetting } = useContext(MyContext);
	const [selectedMonth, setSelectedMonth] = useState(1);
	const [newTitle, setNewTitle] = useState('');
	const [isCollapse, setIsCollapse] = useState(false);

	const handleEditClick = (e, question) => {
		e.stopPropagation();
		setSelectedQuestion(question);
		setNewTitle(question.title);
		setNewQuestion(question.question);
		setIsNewQuestion(true); // Open the form for editing
	};


	const handleDeleteClick = (e, question) => {
		e.stopPropagation();
		setQuestionToDelete(question);
		setShowDeleteConfirm(true);
	};

	const handleConfirmDelete = async () => {
		try {
			await deleteCanvasChat(questionToDelete.id);
			setQuestions(questions.filter((q) => q.id !== questionToDelete.id));
			if (selectedQuestion?.id === questionToDelete.id) {
				setSelectedQuestion(null);
				setIsNewQuestion(true);
			}
			message.success('Câu hỏi đã được xóa thành công');
		} catch (error) {
			message.error('Có lỗi xảy ra khi xóa câu hỏi');
		} finally {
			setShowDeleteConfirm(false);
			setQuestionToDelete(null);
		}
	};

	const handleCancelDelete = () => {
		setShowDeleteConfirm(false);
		setQuestionToDelete(null);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (newQuestion.trim() === '') return;

		const selectedDataSource = canvasBot;
		if (!selectedDataSource) {
			message.error('Không tìm thấy nguồn dữ liệu Bot.');
			return;
		}
		setIsLoading(true);

		let data = '';
		for (const p of canvasBot.khkdPacks) {
			if (p === 'DL') {
				data += JSON.stringify({ 'Đo lường': filterArrayByMonth(dataKQKD, selectedMonth) });
			}
			if (p === 'KD') {
				data += JSON.stringify({ 'Kinh doanh': filterArrayByMonth(dataDoLuong, selectedMonth) });
			}
			if (p === 'DT') {
				data += JSON.stringify({ 'Dòng tiền': filterArrayByMonth(dataDT, selectedMonth) });
			}
			if (p === 'KPI') {
				let dKPIDataAI = await loadKPIData(dataDoLuong, khkdTH.id);
				data += JSON.stringify({ 'KPI': filterArrayByMonth(dKPIDataAI, selectedMonth) });
			}
			if (p === 'BH') {
				const dataBH = await fetchDataTHCKKH(khkdTH, selectedMonth, dataTT);
				data += JSON.stringify({ 'Bán hàng': dataBH });
			}
		}

		try {
			const answer = await answerSingleQuestion({
				prompt: newQuestion,
				system: selectedDataSource.system + '. Dữ liệu như sau ' + data +'. Câu trả lời dạng numbering, không markdown, không sử dụng ký tự #, và vẫn xuống dòng',
				model: selectedDataSource.model,
			});

			const updatedData = {
				id: selectedQuestion ? selectedQuestion.id : questions.length + 1,
				title: newTitle,
				question: newQuestion,
				answer: answer.answer,
				canvasDataId: selectedDataSource.id,
				idKHKD,
				month: selectedMonth
			};

			if (selectedQuestion) {
				await updateCanvasChat(updatedData);
				setQuestions(questions.map((q) => (q.id === selectedQuestion.id ? updatedData : q)));
				message.success('Câu hỏi và câu trả lời đã được cập nhật thành công');
			} else {
				await createCanvasChat(updatedData);
				setQuestions([...questions, updatedData]);
				message.success('Câu hỏi mới đã được thêm thành công');
			}

			setNewQuestion('');
			setNewTitle('');
			setSelectedQuestion(null);
			setIsNewQuestion(false);
		} catch (error) {
			message.error('Có lỗi xảy ra khi xử lý câu hỏi.');
		} finally {
			setIsLoading(false);
		}
	};

	const loadData = async () => {
		try {
			const chatData = await getAllCanvasChatByIdKHKD(idKHKD);
			const filteredData = chatData.filter(q => q.month == selectedMonth);
			if (filteredData && filteredData.length > 0) {
				setSelectedQuestion(filteredData[0]);
			}
			setQuestions(filteredData);
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	useEffect(() => {
		const loadAndAnalyze = async () => {
			setIsAnalyzing(true);
			try {
				await loadData();
				await autoAnalyzeAllTypes(dataKQKD, dataDoLuong, dataDT, selectedMonth, khkdTH, dataTT, canvasBot);
				await loadData(); // Load lại dữ liệu sau khi phân tích
			} catch (error) {
				console.error('Error in loadAndAnalyze:', error);
			} finally {
				setIsAnalyzing(false);
			}
		};
		loadAndAnalyze();
	}, [idKHKD, selectedMonth]);

	const handleMonthChange = (value) => {
		setSelectedMonth(value);
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
		<div className={css.popup}>
			<div className={css.container}>
				<div className={css.sidebar} style={{ width: isCollapse ? '10%' : '35%' }}>
					<div className={css.sidebarHeader}>
						<IconButton onClick={() => setIsCollapse(!isCollapse)}>
							{
								isCollapse ? <CollapseIconOn width={20} height={20} /> : <CollapseIconOff width={20} height={20} />
							}
						</IconButton>
						<Select
							value={selectedMonth}
							onChange={handleMonthChange}
							style={{ width: 120, marginLeft: 10 }}
							disabled={isAnalyzing}
						>
							{Array.from({ length: 12 }, (_, i) => (
								<Select.Option key={i + 1} value={i + 1}>
									Tháng {i + 1}
								</Select.Option>
							))}
						</Select>
					</div>
					{
						!isCollapse &&
						<div className={css.questionsList}>
							{isAnalyzing ? (
								<div className={css.loadingContainer}>
									<Loader className={css.spinner} size={32} />
									<p>Đang phân tích dữ liệu...</p>
								</div>
							) : questions.length > 0 ? (
								questions.map((q) => (
									<div
										key={q.id}
										onClick={() => {
											setSelectedQuestion(q);
											setIsNewQuestion(false);
										}}
										className={
											selectedQuestion?.id === q.id
												? css.questionItemSelected
												: css.questionItem
										}
									>
										<p className={css.questionItemText}>{q.title}</p>
										<EditIcon className={css.editButton} onClick={(e) => handleEditClick(e, q)}></EditIcon>
										<button
											className={css.deleteButton}
											onClick={(e) => handleDeleteClick(e, q)}
										>
											<Trash2 size={16} />
										</button>
									</div>
								))
							) : (
								<div className={css.noQuestions}>
									<p>No questions yet</p>
								</div>
							)}
						</div>
					}
				</div>

				<div className={css.mainPanel}>
					{isNewQuestion && (
						<div className={css.inputArea}>
							<form onSubmit={handleSubmit} className={css.form}>
								<div css={css.form2}>
									<input
										type="text"
										value={newTitle}
										onChange={(e) => setNewTitle(e.target.value)}
										placeholder="Nhập tiêu đề câu hỏi..."
										className={css.input}
									/>

									<textarea
										value={newQuestion}
										onChange={(e) => setNewQuestion(e.target.value)}
										placeholder='Nhập câu hỏi...'
										className={css.textarea}
									/>
								</div>
								<button
									type='submit'
									className={css.button}
									disabled={isLoading}
								>
									{isLoading ? (
										<Loader className={css.spinner} size={20} />
									) : (
										<Send size={20} />
									)}
								</button>
							</form>
						</div>
					)}

					<div className={css.answerArea}>
						{isLoading ? (
							<div className={css.loadingContainer}>
								<Loader className={css.spinner} size={32} />
								<p>Đang xử lý câu hỏi...</p>
							</div>
						) : selectedQuestion && !isNewQuestion ? (
							<div className={css.answerCard}>
								<div className={css.questionText}>
									{selectedQuestion.question}
								</div>
								<AnswerText text={selectedQuestion.answer} />
							</div>
						) : !isNewQuestion ? (
							<div className={css.placeholder}>
								<MessageSquare size={40} className={css.placeholderIcon} />
								<p>Select a question or ask a new one</p>
							</div>
						) : null}
					</div>
				</div>
			</div>
			{showDeleteConfirm && (
				<div className={css.modalOverlay}>
					<div className={css.modal}>
						<h3 className={css.modalTitle}>Xác nhận xóa</h3>
						<p className={css.modalText}>Bạn có chắc chắn muốn xóa câu hỏi này?</p>
						<div className={css.modalButtons}>
							<button className={css.cancelButton} onClick={handleCancelDelete}>
								Hủy
							</button>
							<button className={css.confirmButton} onClick={handleConfirmDelete}>
								Xóa
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ChatBot3;
