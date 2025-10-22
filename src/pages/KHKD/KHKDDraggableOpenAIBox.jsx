import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { RxMove } from 'react-icons/rx';
import { IoMdClose } from 'react-icons/io';
import { IoSettingsOutline } from 'react-icons/io5';
import { Plus } from 'lucide-react';
import { getCanvasBotByIdKHKD } from '../../apis/canvasBotService.jsx';
import NewAnalysisDialog3 from '../Canvas/BotManagement/NewAnalysisDialog/NewAnalysisDialog3.jsx';
import ChatBot3 from '../Canvas/ChatBot/ChatBot3.jsx';
import UpdateAnalysisDialog3 from '../Canvas/BotManagement/UpdateAnalysisDialog/UpdateAnalysisDialog3.jsx';
import css from './DraggableOpenAIBox.module.css';

const MIN_HEIGHT = 200;

const KHKDDraggableOpenAIBox = ({
									siderId,
									dataKQKD,
									dataDoLuong,
									dataDT,
									dKPIDataAI,
									dataTT,
									khkdTH,
									visible,
									setVisible
								}) => {
	const [canvasBot, setCanvasBot] = useState(null);
	const dragging = useRef(false);
	const offset = useRef({ x: 0, y: 0 });
	const resizing = useRef(false);
	const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

	const [position, setPosition] = useState({ x: 1000, y: 50 });
	const [size, setSize] = useState({ width: 900, height: 600 });

	const [openNewAnalysisDialog2, setOpenNewAnalysisDialog2] = useState(false);
	const [openUpdateAnalysisDialog, setOpenUpdateAnalysisDialog] = useState(false);

	const [newQuestion, setNewQuestion] = useState('');
	const [selectedQuestion, setSelectedQuestion] = useState(null);
	const [isNewQuestion, setIsNewQuestion] = useState(false);

	const fetchCanvasBotByIdCanvasContainer = async () => {
		try {
			const data = await getCanvasBotByIdKHKD(siderId);
			setCanvasBot(data[0]);
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		if (siderId) {
			fetchCanvasBotByIdCanvasContainer();
		}
	}, [siderId, openNewAnalysisDialog2]);

	const handleHeaderMouseDown = (e) => {
		dragging.current = true;
		offset.current = {
			x: e.clientX - position.x,
			y: e.clientY - position.y,
		};
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	};

	const handleMouseMove = (e) => {
		if (dragging.current) {
			setPosition({
				x: e.clientX - offset.current.x,
				y: e.clientY - offset.current.y,
			});
		} else if (resizing.current) {
			const dy = e.clientY - resizeStart.current.y;
			setSize({
				width: size.width,
				height: Math.max(MIN_HEIGHT, resizeStart.current.height + dy),
			});
		}
	};

	const handleMouseUp = () => {
		dragging.current = false;
		resizing.current = false;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	};

	const handleResizeMouseDown = (e) => {
		e.stopPropagation();
		resizing.current = true;
		resizeStart.current = {
			x: e.clientX,
			y: e.clientY,
			width: size.width,
			height: size.height,
		};
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	};

	const renderNoCanvasBot = () => (
		<div className={css.noCanvasBot}>
			<p>Chưa có Bot nào được tạo</p>
			<Button onClick={() => setOpenNewAnalysisDialog2(true)}>
				Tạo Bot
			</Button>
		</div>
	);

	const handleNewQuestion = () => {
		setIsNewQuestion(true);
		setSelectedQuestion(null);
		setNewQuestion('');
	};

	return (
		<>
			{visible && (
				<div
					className={css.boxStyle}
					style={{
						left: position.x,
						top: position.y,
						width: size.width,
						height: size.height,
					}}
				>
					<div className={css.headerStyle}>
						<div className={css.headerRight}>
							<span className={css.headerTitle}>Chat AI</span>
							<button className={css.newQuestionButton} onClick={handleNewQuestion}>
								<Plus size={16} />
								<span>Câu hỏi mới</span>
							</button>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<button
								className={css.closeBtnStyle}
								onClick={() => setOpenUpdateAnalysisDialog(true)}
							>
								{canvasBot?.idKHKD ? <IoSettingsOutline /> : ''}
							</button>
							<button
								className={css.dragHandleBtn}
								onMouseDown={handleHeaderMouseDown}
							>
								<RxMove />
							</button>
							<button
								className={css.closeBtnStyle}
								onClick={() => setVisible(false)}
							>
								<IoMdClose />
							</button>
						</div>
					</div>

					<div className={css.bodyStyle}>
						{canvasBot?.idKHKD ? (
							<ChatBot3
								idKHKD={siderId}
								canvasBot={canvasBot}
								newQuestion={newQuestion}
								setNewQuestion={setNewQuestion}
								isNewQuestion={isNewQuestion}
								setIsNewQuestion={setIsNewQuestion}
								selectedQuestion={selectedQuestion}
								setSelectedQuestion={setSelectedQuestion}
								dataKQKD={dataKQKD}
								dataDoLuong={dataDoLuong}
								dataDT={dataDT}
								dKPIDataAI={dKPIDataAI}
								khkdTH={khkdTH}
								dataTT={dataTT}
							/>
						) : renderNoCanvasBot()}
					</div>

					<button
						className={css.resizeHandle}
						onMouseDown={handleResizeMouseDown}
						aria-label="Resize"
					/>
				</div>
			)}

			<NewAnalysisDialog3
				isOpen={openNewAnalysisDialog2}
				onClose={() => setOpenNewAnalysisDialog2(false)}
				idKHKD={siderId}
				fetchData={fetchCanvasBotByIdCanvasContainer}
			/>
			<UpdateAnalysisDialog3
				isOpen={openUpdateAnalysisDialog}
				onClose={() => setOpenUpdateAnalysisDialog(false)}
				canvasBot={canvasBot}
				fetchData={fetchCanvasBotByIdCanvasContainer}
			/>
		</>
	);
};

export default KHKDDraggableOpenAIBox;
