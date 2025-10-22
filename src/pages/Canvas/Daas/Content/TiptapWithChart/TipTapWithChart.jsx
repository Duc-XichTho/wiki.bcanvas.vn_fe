import css from './TipTap.module.css';
import React, { useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { TiptapToolbar } from './TiptapToolbar';
import { useEditor } from './useEditor';
import { Button, message, Progress, Tooltip, Collapse } from 'antd';
import { updateFileNotePad } from '../../../../../apis/fileNotePadService.jsx';
import { createTimestamp, formatDateToDDMMYYYY } from '../../../../../generalFunction/format.js';
import { getCurrentUserLogin } from '../../../../../apis/userService.jsx';
import { FaDownload, FaPause, FaPlay } from 'react-icons/fa';
import { requestSpeech } from '../../../../../apis/audioPlayService.jsx';
import { toast } from 'react-toastify';
import { AgCharts } from 'ag-charts-react';
import ChartComponent from '../../../../AI/ChartComponent.jsx';
import TableViewer from '../../../../AI/TableViewer.jsx';
import { getAIPowerdrillHistoryById } from '../../../../../apis/aiAnalysisPowerdrillHistoryService';

export default function TipTapWithChart({ fileNotePad, fetchData,  }) {
	const { editor } = useEditor();
	const [currentUser, setCurrentUser] = useState(null);
	const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [fontMenuOpen, setFontMenuOpen] = useState(false);
	const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
	const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
	const [isEditMode, setEditMode] = useState(false);
	const [showButton, setShowButton] = useState(false);
	const [isDownload, setIsDownload] = useState(false);
	const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);
	const [chartOptions, setChartOptions] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [showAudioControls, setShowAudioControls] = useState(false);
	const [tableData, setTableData] = useState([]);
	const [historyTables, setHistoryTables] = useState([]);

	const audioRef = useRef(null);

	// Kiểm tra xem có dữ liệu chart, table hoặc image không
	const hasChartData = fileNotePad?.chart || fileNotePad?.chartData || fileNotePad?.info?.chart;
	const hasTableData = fileNotePad?.url && fileNotePad.url.includes('TABLE');

	useEffect(() => {
		if (editor) {
			editor.setEditable(isEditMode);
		}
	}, [isEditMode, editor]);

	const fetchCurrentUser = async () => {
		const { data, error } = await getCurrentUserLogin();
		if (data) {
			setCurrentUser(data);
		}
	};

	useEffect(() => {
		fetchCurrentUser();
	}, []);

	useEffect(() => {
		if (fileNotePad?.url) {
			editor.commands.setContent(fileNotePad.url);
		}
	}, [fileNotePad?.url]);

	// Xử lý dữ liệu chart nếu có
	useEffect(() => {
		if (hasChartData) {
			try {
				const chartData = fileNotePad?.chart || fileNotePad?.chartData || fileNotePad?.info?.chart;
				if (chartData && Array.isArray(chartData) && chartData.length > 0) {
					// Nếu là array của chart objects
					setChartOptions(chartData);
				} else if (chartData && typeof chartData === 'object' && !Array.isArray(chartData)) {
					// Nếu là single chart object
					setChartOptions(chartData);
				} else if (typeof chartData === 'string') {
					// Nếu là JSON string
					const parsedChart = JSON.parse(chartData);
					setChartOptions(parsedChart);
				}
			} catch (error) {
				console.error('Error parsing chart data:', error);
			}
		}
	}, [fileNotePad, hasChartData]);

	// Xử lý dữ liệu table và image nếu có
	useEffect(() => {
		if ((hasTableData) && fileNotePad?.url) {
			try {
				// Parse table data từ URL trong content
				const tableMatches = fileNotePad.url.match(/Table URL: (https?:\/\/[^\s\n]+)/g);
				if (tableMatches) {
					const tables = tableMatches.map(match => {
						const url = match.replace('Table URL: ', '');
						return { url };
					});
					setTableData(tables);
				}
				
				// Parse image data từ HTML img tags trong content
				const imageMatches = fileNotePad.url.match(/<img[^>]+src="([^"]+)"[^>]*>/g);
				if (imageMatches) {
					const images = imageMatches.map(match => {
						const srcMatch = match.match(/src="([^"]+)"/);
						const altMatch = match.match(/alt="([^"]+)"/);
						const titleMatch = match.match(/title="([^"]+)"/);
						return {
							title: titleMatch ? titleMatch[1] : (altMatch ? altMatch[1] : 'Biểu đồ'),
							url: srcMatch ? srcMatch[1] : ''
						};
					});
					// Có thể lưu images vào state nếu cần hiển thị riêng
					console.log('Parsed images:', images);
				}
			} catch (error) {
				console.error('Error parsing table/image data:', error);
			}
		}
	}, [fileNotePad, hasTableData]);

	useEffect(() => {
		if (fileNotePad?.info?.historyId) {
			getAIPowerdrillHistoryById(fileNotePad.info.historyId).then(res => {
				const blocks = res?.data?.more_info?.analysisResult?.blocks || [];
				setHistoryTables(blocks.filter(block => block.type === 'TABLE' && block.group_name === 'Conclusions'));
			});
		}
	}, [fileNotePad?.info?.historyId]);

	const handleSave = async () => {
		try {
			const content = editor.getHTML();
			const data = {
				...fileNotePad,
				url: content,
				updated_at: createTimestamp(),
				user_update: currentUser.email,
			};
			await updateFileNotePad(data);
			await fetchData();
			setShowButton(false);
			setEditMode(false);
			message.success('Đã lưu thành công!');
		} catch (error) {
			console.log(error);
			message.error('Có lỗi khi lưu');
		}
	};

	const toggleEditMode = () => {
		setEditMode(!isEditMode);
		setShowButton(true);
	};

	const handleShare = async () => {
		try {
			const url = `${import.meta.env.VITE_DOMAIN_URL}/share/document/${fileNotePad.id}`;
			await navigator.clipboard.writeText(url);
			message.success('Đã sao chép link vào bộ nhớ tạm');
		} catch (error) {
			console.error('Failed to copy text: ', error);
			message.error('Không thể sao chép link');
		}
	};

	const toggleShare = async () => {
		try {
			const data = {
				...fileNotePad,
				info: {
					...fileNotePad.info,
					hide: !fileNotePad.info.hide,
				},
			};
			await updateFileNotePad(data);
			await fetchData();
			message.success('Đã thay đổi trạng thái chia sẻ');
		} catch (error) {
			console.log(error);
			message.error('Có lỗi khi thay đổi trạng thái');
		}
	};

	if (!editor) {
		return (
			<div className={css.main}>
				<div className={css.loadingContainer}>
					<div className={css.loadingCircle}></div>
					<span>Đang tải editor...</span>
				</div>
			</div>
		);
	}

	const removeHtmlTags = (htmlString) => {
		const doc = new DOMParser().parseFromString(htmlString, 'text/html');
		return doc.body.textContent || '';
	};

	const handleDownload = async (text) => {
		try {
			setIsDownload(true);
			const dataVoice = await requestSpeech(removeHtmlTags(text));
			const filename = `${fileNotePad.name}_Audio`;
			const response = await fetch(dataVoice.audioUrl);
			const blob = await response.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
			setIsDownload(false);
			message.success('Tải xuống thành công!');
		} catch (error) {
			console.error('Lỗi khi tải file:', error);
			message.error('Có lỗi khi tải xuống file');
			setIsDownload(false);
		}
	};

	const handleSpeaks = async (text) => {
		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
			setShowAudioControls(false);
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
				setShowAudioControls(true);

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
					setShowAudioControls(false);
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

	return (
		<div className={css.main}>
			{/* Header Section */}
			<div className={css.info}>
				<div className={css.infoLeft}>
					<div className={css.nameElement}>
						<span>{fileNotePad.name}</span>
					</div>
					<div className={css.infoElement}>
						{fileNotePad.updated_at && (
							<span>
								Cập nhật lúc {formatDateToDDMMYYYY(fileNotePad.updated_at || fileNotePad.created_at)} bởi{' '}
								{fileNotePad.user_update || fileNotePad.user_create}
							</span>
						)}
					</div>
				</div>
				<div className={css.infoRight}>
					<div className={css.controlContainer}>
						{/* Audio Controls */}
						 {!showButton && (
							<></>
							// <div className={css.audioControls}>
							// 	{isLoading ? (
							// 		<div className={css.buttonWrap}>
							// 			<div className={css.loadingCircle}></div>
							// 		</div>
							// 	) : (
							// 		<>
							// 			<Tooltip title='Tải xuống âm thanh'>
							// 				<div
							// 					className={css.buttonWrap}
							// 					onClick={() => handleDownload(fileNotePad.url)}
							// 				>
							// 					{isDownload ? (
							// 						<div className={css.loadingCircle}></div>
							// 					) : (
							// 						<FaDownload size={16} style={{ color: '#52c41a' }} />
							// 					)}
							// 				</div>
							// 			</Tooltip>
							// 			<Tooltip title={isPlaying ? 'Dừng phát' : 'Phát âm thanh'}>
							// 				<div
							// 					className={css.buttonWrap}
							// 					onClick={() => handleSpeaks(fileNotePad.url)}
							// 				>
							// 					{isPlaying ? (
							// 						<FaPause size={16} style={{ color: '#ff4d4f' }} />
							// 					) : (
							// 						<FaPlay size={16} style={{ color: '#1890ff' }} />
							// 					)}
							// 				</div>
							// 			</Tooltip>
							// 		</>
							// 	)}

							// 	{/* Audio Progress */}
							// 	{showAudioControls && (
							// 		<div className={css.audioProgressContainer}>
							// 			<Progress
							// 				percent={progress}
							// 				showInfo={false}
							// 				strokeColor='#007bff'
							// 				className={css.audioProgress}
							// 			/>
							// 			<div className={css.timeDisplay}>
							// 				<span>{formatTime(currentTime)} / {formatTime(duration)}</span>
							// 			</div>
							// 		</div>
							// 	)}
							// </div>
						)} 
					
						{/* Edit/Save Button */}
						{!showButton ? (
							<Tooltip title='Chỉnh sửa nội dung'>
								<Button
									onClick={toggleEditMode}
									// icon={<EditIcon />}
									type='primary'
									className={css.editButton}
								>
									Chỉnh sửa
								</Button>
							</Tooltip>
						) : (
							<Tooltip title='Lưu thay đổi'>
								<Button
									onClick={handleSave}
									type='primary'
									className={css.saveButton}
								>
									Lưu
								</Button>
							</Tooltip>
						)}

						{/* Share Button */}
						{/*{!fileNotePad?.info.hide && (*/}
						{/*	<Tooltip title='Chia sẻ tài liệu'>*/}
						{/*		<Button*/}
						{/*			onClick={handleShare}*/}
						{/*			icon={<ShareIcon />}*/}
						{/*			className={css.shareButton}*/}
						{/*		>*/}
						{/*			Chia sẻ*/}
						{/*		</Button>*/}
						{/*	</Tooltip>*/}
						{/*)}*/}

						{/*/!* Admin Switch *!/*/}
						{/*{currentUser?.isAdmin && (*/}
						{/*	<Tooltip title='Thay đổi trạng thái chia sẻ'>*/}
						{/*		<Switch*/}
						{/*			className={css.customSwitch}*/}
						{/*			checked={!fileNotePad?.info?.hide}*/}
						{/*			checkedChildren='Chia sẻ'*/}
						{/*			unCheckedChildren='Riêng tư'*/}
						{/*			onChange={toggleShare}*/}
						{/*		/>*/}
						{/*	</Tooltip>*/}
						{/*)}*/}
					</div>
				</div>
			</div>

			{/* Main Content Layout */}
			<div className={css.singleLayout}>
				{/* Split Layout: Content Left, Charts Right */}
				<div className={css.fullEditor}>
					<div className={css.tiptap}>
						<div className={css.splitContentLayout}>
							{/* Left Side - Content */}
							<div className={css.contentSection}>
								<div className={css.editorContentWrap}>
									{isEditMode && (
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
											lineHeightMenuOpen={lineHeightMenuOpen}
											setLineHeightMenuOpen={setLineHeightMenuOpen}
										/>
									)}
									<EditorContent editor={editor} />
								</div>
							</div>

							{/* Right Side - Charts, Tables and Images */}
							{(hasChartData || hasTableData || historyTables.length > 0) && (
								<div className={css.chartsSection}>
									<div className={css.chartsContainer}>
										{/* Charts */}
										{chartOptions && (
											<>
												{Array.isArray(chartOptions) ? (
													<div className={css.multipleCharts}>
														{chartOptions.map((chart, index) => (
															<div key={index} className={css.singleChart}>
																<div style={{
																	border: '1px solid #e8e8e8',
																	borderRadius: '8px',
																	padding: '16px',
																	marginBottom: '16px',
																	backgroundColor: '#fafafa',
																}}>
																	<h4 style={{
																		marginBottom: '12px',
																		color: '#1890ff',
																		fontSize: '16px',
																		fontWeight: '600',
																	}}>
																		{chart.tableName || `Biểu đồ ${index + 1}`}
																	</h4>
																	{chart.chartData && chart.chartConfig ? (
																		<ChartComponent
																			chartData={chart.chartData}
																			chartConfig={chart.chartConfig}
																		/>
																	) : (
																		<div style={{ 
																			padding: '20px', 
																			textAlign: 'center', 
																			color: '#666' 
																		}}>
																			Không có dữ liệu biểu đồ
																		</div>
																	)}
																</div>
															</div>
														))}
													</div>
												) : (
													<div style={{
														border: '1px solid #e8e8e8',
														borderRadius: '8px',
														padding: '16px',
														marginBottom: '16px',
														backgroundColor: '#fafafa',
													}}>
														<AgCharts options={chartOptions} />
													</div>
												)}
											</>
										)}

										{/* Tables */}
										{(tableData.length > 0 || historyTables.length > 0) && (
											<div className={css.multipleCharts}>
												{/* Tables from content parsing */}
												{tableData.length > 0 && (
													<Collapse
														items={tableData.map((table, index) => ({
															key: `table-${index}`,
															label: (
																<span style={{
																	color: '#1890ff',
																	fontSize: '14px',
																	fontWeight: '500',
																}}>
																	Bảng {index + 1}
																</span>
															),
															children: (
																<div>
																	<TableViewer url={table.url} />
																</div>
															),
														}))}
														style={{
															border: 'none',
														}}
														expandIconPosition="end"
														ghost
													/>
												)}

												{/* Tables from history */}
												{historyTables.length > 0 && (
													<Collapse
														items={historyTables.map((tableBlock, index) => ({
															key: `history-table-${index}`,
															label: (
																<span style={{
																	color: '#0C6DC7',
																	fontSize: '14px',
																	fontWeight: '500',
																}}>
																	{tableBlock.content.name || `Bảng ${index + 1}`}
																</span>
															),
															children: (
																<div>
																	<TableViewer url={tableBlock.content.url} />
																</div>
															),
														}))}
														style={{
															border: 'none',
														}}
														expandIconPosition="end"
														ghost
													/>
												)}
											</div>
										)}

										{/* Placeholder when no data */}
										{!chartOptions && tableData.length === 0 && historyTables.length === 0 && (
											<div className={css.chartPlaceholder}>
												<div className={css.loadingCircle}></div>
												<span>Đang tải dữ liệu...</span>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
