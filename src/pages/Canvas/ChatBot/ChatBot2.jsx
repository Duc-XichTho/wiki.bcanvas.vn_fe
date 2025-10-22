// ChatBot.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Loader, MessageSquare, Send, Trash2 } from 'lucide-react';
import css from './ChatBot.module.css';
import { message } from 'antd';
import { htmlToText } from 'html-to-text';
import { MyContext } from '../../../MyContext.jsx';
// API
import {
	createCanvasChat,
	deleteCanvasChat,
	getAllCanvasChatByIdCanvasContainer,
} from '../../../apis/CanvasChatService.jsx';
import { getAllCanvasBot } from '../../../apis/canvasBotService.jsx';
import { answerSingleQuestion } from '../../../apis/botService.jsx';
import { getAllFileNotePad } from '../../../apis/fileNotePadService.jsx';
import { updateSetting } from '../../../apis/settingService.jsx';
import { getAllTemplateTables, getTemplateRow } from '../../../apis/templateSettingService.jsx';
import { loadAndMergeData } from '../Daas/Content/Template/SettingCombine/logicCombine.js';
import { getAllChartTemplate } from '../../../apis/chartTemplateService.jsx';
import { loadDataChartTemp, loadKPIData } from './logicLoadDataChatBot.js';
import { getAllKpi2Calculator } from '../../../apis/kpi2CalculatorService.jsx';
import { CollapseIconOff, CollapseIconOn } from '../../../icon/svg/IconSvg.jsx';
import IconButton from '@mui/material/IconButton';

const ChatBot2 = ({
					  idCanvasContainer,
					  canvasBot,
					  newQuestion,
					  setNewQuestion,
					  selectedQuestion,
					  setSelectedQuestion,
					  isNewQuestion,
					  setIsNewQuestion,
				  }) => {
	const [questions, setQuestions] = useState([]);
	const [selectedData, setSelectedData] = useState('');
	const [dataSources, setDataSources] = useState([]);
	const [dataPacks, setDataPacks] = useState([]);
	const [notePacks, setNotePacks] = useState([]);
	const [tempPacks, setTempPacks] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [templateData, setTemplateData] = useState([]);
	const [chartTempData, setChartTempData] = useState([]);
	const [KPIData, setKPIData] = useState([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [questionToDelete, setQuestionToDelete] = useState(null);
	const { botSetting, setBotSetting } = useContext(MyContext);
	let { listCompany, listYear, listUC_CANVAS, currentUser } = useContext(MyContext);

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
		let fileNotes = await getAllFileNotePad();
		if (newQuestion.trim() === '') return;

		// if (selectedData === '') {
		// 	message.error('Hãy chọn nguồn dữ liệu.');
		// 	return;
		// }

		setIsLoading(true);
		// const selectedDataSource = dataSources.find(
		// 	(source) => source.id.toString() === selectedData.toString(),
		// );

		const selectedDataSource = canvasBot;

		if (!selectedDataSource) {
			message.error('Không tìm thấy nguồn dữ liệu Bot.');
			setIsLoading(false);
			return;
		}

		let data = '';
		for (const i of selectedDataSource.notePacks || []) {
			const notePack = notePacks.find((np) => np.id == i);
			if (notePack) {
				data +=
					htmlToText(notePack.url, {
						wordwrap: false,
						preserveNewlines: true,
					}) + ' || ';
				data += notePack.content;
			}
		}

		// for (const i of selectedDataSource.dataPacks) {
		// 	const dataPack = dataPacks.find((dp) => dp.id == i);
		// 	if (dataPack && dataPack.type) {
		// 		const newData = await getItemFromIndexedDB2(dataPack.type);
		// 		if (!newData || (Array.isArray(newData) && newData.length === 0)) {
		// 			message.warning(
		// 				'Chưa có dữ liệu của ' +
		// 				dataPack.name +
		// 				' cho Bot, hãy mở tài liệu này trong canvas để XichBot nhận được dữ liệu!',
		// 			);
		// 			setIsLoading(false);
		// 			return;
		// 		} else {
		// 			data += JSON.stringify(newData) + ' || ';
		// 		}
		// 	}
		// }

		for (const i of selectedDataSource.tempPacks) {
			const template = templateData.find((temp) => temp.fileNote_id == i);
			let rows = [];
			if (template) {
				if (template.isCombine) {
					rows = await loadAndMergeData(template);
				} else {
					const allDataResponse = await getTemplateRow(template.id);
					const allData = allDataResponse.rows || [];
					allData.map((row) => ({
						...row.data,
						rowId: row.id,
					}));
					rows = allData;
				}
			}
			data += JSON.stringify(rows);
		}

		for (const i of selectedDataSource.tempChartPacks) {
			const fileNote = fileNotes.find((temp) => temp.id == i);
			if (fileNote) {
				let chart = chartTempData.find((chart) => chart.id == fileNote.type);
				if (chart) {
					let chartData = await loadDataChartTemp(chart);
					data += JSON.stringify(chartData);
				}
			}
		}

		for (const i of selectedDataSource.kpiPacks) {
			const fileNote = fileNotes.find((temp) => temp.id == i);
			if (fileNote) {
				let kpiData = await loadKPIData(fileNote.type, listCompany, listYear);
				data += JSON.stringify(kpiData);
			}
		}

		try {
			const answer = await answerSingleQuestion({
				prompt: newQuestion,
				system: selectedDataSource.system + '. Dữ liệu như sau ' + data,
				model: selectedDataSource.model,
			});

			const newEntry = {
				id: questions.length + 1,
				question: newQuestion,
				answer: answer.answer,
			};

			const newData = {
				canvasDataId: selectedDataSource.id,
				question: newQuestion,
				answer: answer.answer,
				idCanvasContainer: idCanvasContainer,
			};

			let updatedBotSetting = botSetting;
			updatedBotSetting.setting.used =
				parseInt(updatedBotSetting.setting.used) + answer.usage.total_tokens;

			updatedBotSetting = await updateSetting(updatedBotSetting);

			setBotSetting(updatedBotSetting);

			await createCanvasChat(newData);

			setQuestions([...questions, newEntry]);
			setNewQuestion('');
			setSelectedQuestion(newEntry);
			setIsNewQuestion(false);
		} catch (error) {
			message.error('Có lỗi xảy ra khi xử lý câu hỏi.');
		} finally {
			setIsLoading(false);
		}
	};

	const loadData = async () => {
		try {
			const response = await getAllCanvasBot();
			const chatData = await getAllCanvasChatByIdCanvasContainer(idCanvasContainer);
			const templates = await getAllTemplateTables();
			const chartTemps = await getAllChartTemplate();
			const KPIs = await getAllKpi2Calculator();
			setDataSources(response);
			if (chatData && chatData.length > 0) {
				setSelectedQuestion(chatData[0]);
			}
			setQuestions(chatData);
			setTemplateData(templates);
			setChartTempData(chartTemps);
			setKPIData(KPIs);
			const PacksData = await getAllFileNotePad();
			const notePacksData = PacksData.filter((pack) => pack.table == 'Tiptap');
			const dataPacksData = PacksData.filter((pack) => pack.table == 'Data');
			const tempPacksData = PacksData.filter((pack) => pack.table == 'Template');
			setDataPacks(dataPacksData);
			setNotePacks(notePacksData);
			setTempPacks(tempPacksData);
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	useEffect(() => {
		loadData();
	}, [idCanvasContainer]);

	useEffect(() => {
		loadData();
	}, []);


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

	const [isCollapse, setIsCollapse] = useState(false);

	const handleCollapse = () => {
		setIsCollapse(!isCollapse);
	};
	return (

		<div className={css.popup}>
			<div className={css.container}>
				<div className={css.sidebar} style={{ width: isCollapse ? '10%' : '35%' }}>
					<div className={css.sidebarHeader}>
						<IconButton onClick={handleCollapse}>
							{
								isCollapse ? <CollapseIconOn width={20} height={20} /> : <CollapseIconOff width={20} height={20} />
							}
						</IconButton>
					</div>
					{
						!isCollapse &&
						<div className={css.questionsList}>
							{questions.length > 0 ? (
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
										<p className={css.questionItemText}>{q.question}</p>
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
							{/* <select
								value={selectedData}
								onChange={(e) => setSelectedData(e.target.value)}
								className={css.select}
							>
								<option value="">Chọn AI Analyst</option>
								{dataSources.map((source) => (
									<option key={source.id} value={source.id}>
										{source.name}
									</option>
								))}
							</select> */}

							<form onSubmit={handleSubmit} className={css.form}>
								<textarea
									value={newQuestion}
									onChange={(e) => setNewQuestion(e.target.value)}
									placeholder='Type your question...'
									className={css.textarea}
									rows={4}
								/>
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

export default ChatBot2;
