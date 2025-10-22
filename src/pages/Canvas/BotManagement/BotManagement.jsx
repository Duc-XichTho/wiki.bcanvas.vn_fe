import React, {useEffect, useState} from 'react';
import {Edit2, PlusCircle, Save, Trash2, Eye} from 'lucide-react';
import css from './BotManagement.module.css';
import {Input, message} from 'antd';
// COMPONENTS
import NewAnalysisDialog from './NewAnalysisDialog/NewAnalysisDialog';
// API
import {deleteCanvasBot, getAllCanvasBot, updateCanvasBot} from '../../../apis/canvasBotService';
import {getAllFileNotePad} from '../../../apis/fileNotePadService';
import {CANVAS_DATA_PACK} from '../../../CONST.js';
import {getAllFileTab} from '../../../apis/fileTabService.jsx';
import PreviewDataBot from "./PrevewDataBot/PreviewDataBot.jsx";
import NewAnalysisDialog2 from './NewAnalysisDialog/NewAnalysisDialog2.jsx';

const BotManagement = ({ isOpen, onClose }) => {
	const [analyses, setAnalyses] = useState([]);
	const [selectedAnalysis, setSelectedAnalysis] = useState({});
	const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false);
	const [systemInstructions, setSystemInstructions] = useState('');
	const [dataPacks, setDataPacks] = useState([]);
	const [notePacks, setNotePacks] = useState([]);
	const [tempPacks, setTempPacks] = useState([]);
	const [KPIPacks, setKPIPacks] = useState([]);
	const [tempChartPacks, setTempChartPacks] = useState([]);
	const [selectedPacks, setSelectedPacks] = useState();
	const [selectedPackPreview, setSelectedPackPreview] = useState();
	const [selectedNotePacks, setSelectedNotePacks] = useState([]);
	const [selectedTempPacks, setSelectedTempPacks] = useState([]);
	const [selectedKPIPacks, setSelectedKPIPacks] = useState([]);
	const [selectedTempChartPacks, setSelectedChartTempPacks] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [show, setShow] = useState(false);
	const models = [
		{ key: 'claude-3-5-sonnet-20240620', value: 'Claude 3.5 Sonnet' },
		{ key: 'haiku', value: 'Haiku 3.5' },
	];
	const filteredDataPacks = dataPacks.filter((pack) =>
		pack.name.toLowerCase().includes(searchTerm.toLowerCase())
	);
	const filteredNotePacks = notePacks.filter((pack) =>
		pack.name.toLowerCase().includes(searchTerm.toLowerCase())
	);
	const filteredTempPacks = tempPacks.filter((pack) =>
		pack.name.toLowerCase().includes(searchTerm.toLowerCase())
	);
	const filteredKPIPacks = KPIPacks.filter((pack) =>
		pack.name.toLowerCase().includes(searchTerm.toLowerCase())
	);
	const filteredTempChartPacks = tempChartPacks.filter((pack) =>
		pack.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const loadData = async () => {
		const data = await getAllCanvasBot();
		setAnalyses(data);
		if (!selectedAnalysis?.id) {
			setSelectedAnalysis(data[0]);
			setSystemInstructions(data[0]?.system || '');
		}
		const tabs = await getAllFileTab();
		let PacksData = await getAllFileNotePad();
		PacksData = PacksData.filter((pack) => tabs.some((tab) => tab.key === pack.tab));
		const notePacksData = PacksData.filter((pack) => pack.table == 'Tiptap');
		const tempPacksData = PacksData.filter((pack) => pack.table == 'Template');
		const tempChartPacksData = PacksData.filter((pack) => pack.table == 'ChartTemplate');
		const dataPacksData = PacksData.filter((pack) => pack.table == 'Data');
		const dataKPIData = PacksData.filter((pack) => pack.table == 'KPI');
		dataPacksData.forEach((item) => {
			let typeItem = CANVAS_DATA_PACK.find((e) => e.value === item.type);
			if (typeItem && typeItem.isDM) {
				item.category = 'DM';
			} else if (typeItem && typeItem.isChart) {
				item.category = 'C';
			} else {
				item.category = 'BC';
			}
		});
		setDataPacks(dataPacksData);
		setNotePacks(notePacksData);
		setTempPacks(tempPacksData);
		setKPIPacks(dataKPIData);
		setTempChartPacks(tempChartPacksData);
	};

	const handleDelete = async (analysis, e) => {
		e.stopPropagation();
		try {
			await deleteCanvasBot(analysis.id);
			const updatedAnalyses = analyses.filter((a) => a.id !== analysis.id);
			setAnalyses(updatedAnalyses);
			if (selectedAnalysis.id === analysis.id) {
				setSelectedAnalysis(updatedAnalyses[0] || {});
			}
		} catch (error) {
			console.error('Failed to delete analysis:', error);
		}
	};

	useEffect(() => {
		loadData();
	}, [isOpen]);

	useEffect(() => {
		setSystemInstructions(selectedAnalysis?.system || '');
		setSelectedPacks(selectedAnalysis?.dataPacks || []);
		setSelectedNotePacks(selectedAnalysis?.notePacks || []);
		setSelectedTempPacks(selectedAnalysis?.tempPacks || []);
		setSelectedChartTempPacks(selectedAnalysis?.tempChartPacks || []);
		setSelectedKPIPacks(selectedAnalysis?.kpiPacks || []);
	}, [selectedAnalysis]);

	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
		};
	}, [isOpen, onClose]);

	const toggleEdit = (id) => {
		setAnalyses(analyses.map((a) => (a.id === id ? { ...a, isEditing: !a.isEditing } : a)));
	};

	const handleDescriptionSave = async (analysis) => {
		try {
			const updatedBot = await updateCanvasBot({
				...analysis,
				isEditing: false,
			});

			setAnalyses((prevAnalyses) =>
				prevAnalyses.map((a) => (a.id === analysis.id ? updatedBot : a))
			);
			setSelectedAnalysis(updatedBot);

			toggleEdit(analysis.id);
		} catch (error) {
			console.error('Failed to update description:', error);
		}
	};

	const handleRightPanelSave = async () => {
		try {
			const updatedBot = await updateCanvasBot({
				...selectedAnalysis,
				system: systemInstructions,
				dataPacks: selectedPacks,
				notePacks: selectedNotePacks,
				tempPacks: selectedTempPacks,
				tempChartPacks: selectedTempChartPacks,
				kpiPacks: selectedKPIPacks,
			});

			setAnalyses((prevAnalyses) =>
				prevAnalyses.map((a) => (a.id === selectedAnalysis.id ? updatedBot : a))
			);
			setSelectedAnalysis(updatedBot);
			message.success('Chập nhật bot thành công!');
			loadData();
		} catch (error) {
			console.error('Failed to update bot settings:', error);
		}
	};

	if (!isOpen) return null;

	function handlePreview(pack) {
		setShow(true)
		setSelectedPackPreview(pack)
	}

	return (
		<div
			className={`${css.overlay} ${isOpen ? css.overlayVisible : ''}`}
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div className={css.container}>
				{/* Left Panel */}
				<div className={css.leftPanel}>
					<div className={css.header}>
						<button
							className={`${css.button} ${css.buttonOutline}`}
							onClick={() => setIsNewAnalysisOpen(true)}
						>
							<PlusCircle />
							Tạo mới Bot
						</button>
					</div>

					<div className={css.scrollArea}>
						<div className={css.cardList}>
							{analyses.length !== 0 &&
								analyses.map((analysis) => (
									<div
										key={analysis.id}
										className={`${css.card} ${
											selectedAnalysis.id === analysis.id
												? css.cardSelected
												: ''
										}`}
										onClick={() => setSelectedAnalysis(analysis)}
									>
										<div className={css.cardHeader}>
											<h3 className={css.cardTitle}>{analysis.name}</h3>
											<div className={css.cardActions}>
												<button
													className={`${css.button} ${css.buttonGhost}`}
													onClick={(e) => {
														e.stopPropagation();
														if (analysis.isEditing) {
															handleDescriptionSave(analysis);
														} else {
															toggleEdit(analysis.id);
														}
													}}
												>
													{analysis.isEditing ? <Save /> : <Edit2 />}
												</button>
												<button
													className={`${css.button} ${css.buttonGhost}`}
													onClick={(e) => handleDelete(analysis, e)}
												>
													<Trash2 className={css.deleteIcon} />
												</button>
											</div>
										</div>

										{analysis.isEditing ? (
											<textarea
												className={css.textarea}
												value={analysis.description}
												onChange={(e) => {
													setAnalyses(
														analyses.map((a) =>
															a.id === analysis.id
																? {
																		...a,
																		description: e.target.value,
																  }
																: a
														)
													);
												}}
												onClick={(e) => e.stopPropagation()}
											/>
										) : (
											<p className={css.description}>
												{analysis.description}
											</p>
										)}

										<div className={css.model}>
											Model:{' '}
											{models.find((model) => model.key == analysis.model)
												?.value || analysis.model}
										</div>
									</div>
								))}
						</div>
					</div>
				</div>

				{/* Main Panel */}
				<div className={css.rightPanel}>
					{selectedAnalysis && (
						<div>
							{selectedAnalysis && selectedAnalysis.name && (
								<h2 className={css.sectionTitle}>{selectedAnalysis.name}</h2>
							)}
							<Input
								type="text"
								placeholder="Search..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
							<div>
								<div className={css.formGroup}>
									<label className={css.label}>Tập dữ liệu Note</label>
									<div className={css.dataPacks}>
										{filteredNotePacks.map((pack) => (
											<button
												key={pack.id}
												className={`${css.button} ${
													selectedNotePacks.includes(pack.id)
														? css.buttonPrimary
														: css.buttonOutline
												}`}
												onClick={() => {
													setSelectedNotePacks((prev) =>
														prev.includes(pack.id)
															? prev.filter((p) => p !== pack.id)
															: [...prev, pack.id]
													);
												}}
											>
												{pack.name}
												<Eye size={16} style={{marginLeft: 8, opacity: 0, transition: 'opacity 0.3s'}} onClick={(e) => {e.stopPropagation();handlePreview(pack)}} />
											</button>
										))}
									</div>
									<label className={css.label}>Tập dữ liệu Bảng dữ liệu</label>
									<div className={css.dataPacks}>
										{filteredTempPacks.map((pack) => (
											<button
												key={pack.id}
												className={`${css.button} ${
													selectedTempPacks.includes(pack.id)
														? css.buttonPrimary
														: css.buttonOutline
												}`}
												onClick={() => {
													setSelectedTempPacks((prev) =>
														prev.includes(pack.id)
															? prev.filter((p) => p !== pack.id)
															: [...prev, pack.id]
													);
												}}
											>
												{pack.name}
											</button>
										))}
									</div>
									<label className={css.label}>Tập dữ liệu Chart Bảng dữ liệu</label>
									<div className={css.dataPacks}>
										{filteredTempChartPacks.map((pack) => (
											<button
												key={pack.id}
												className={`${css.button} ${
													selectedTempChartPacks.includes(pack.id)
														? css.buttonPrimary
														: css.buttonOutline
												}`}
												onClick={() => {
													setSelectedChartTempPacks((prev) =>
														prev.includes(pack.id)
															? prev.filter((p) => p !== pack.id)
															: [...prev, pack.id]
													);
												}}
											>
												{pack.name}
											</button>
										))}
									</div>
									<label className={css.label}>Tập dữ liệu KPI</label>
									<div className={css.dataPacks}>
										{filteredKPIPacks.map((pack) => (
											<button
												key={pack.id}
												className={`${css.button} ${
													selectedKPIPacks.includes(pack.id)
														? css.buttonPrimary
														: css.buttonOutline
												}`}
												onClick={() => {
													setSelectedKPIPacks((prev) =>
														prev.includes(pack.id)
															? prev.filter((p) => p !== pack.id)
															: [...prev, pack.id]
													);
												}}
											>
												{pack.name}
											</button>
										))}
									</div>
								</div>

								<div className={css.formGroup}>
									<label className={css.label}>Mô hình AI</label>
									<div className={css.cardTitle}>
										{
											models.find(
												(model) => model.key == selectedAnalysis.model
											)?.value
										}
									</div>
								</div>

								<div className={css.formGroup}>
									<label className={css.label}>Hướng dẫn hệ thống</label>
									<textarea
										className={css.textarea}
										placeholder="Hướng dẫn hệ thống..."
										style={{ height: '8rem' }}
										value={systemInstructions}
										onChange={(e) => setSystemInstructions(e.target.value)}
									/>
								</div>

								<button
									className={`${css.button} ${css.buttonPrimary}`}
									style={{ width: '100%' }}
									onClick={handleRightPanelSave}
								>
									Save
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
			<NewAnalysisDialog2
				isOpen={isNewAnalysisOpen}
				onClose={() => setIsNewAnalysisOpen(false)}
				dataPacks={dataPacks}
				loadData={loadData}
				models={models}
			/>
			{show && selectedPackPreview && <PreviewDataBot show={show} setShow={setShow} pack={selectedPackPreview} />}
		</div>
	);
};

export default BotManagement;
