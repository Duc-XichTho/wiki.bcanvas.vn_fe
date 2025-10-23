import { DownOutlined, HistoryOutlined, UserOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, Dropdown, Empty, message, Modal, Row, Select, Spin, Statistic, Table, Typography } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
// import { getListQuestionHistoryByUser } from '../../../apis/questionHistoryService';
import { formatDateToDDMMYYYY } from '../../../generalFunction/format';
import { MyContext } from '../../../MyContext';
import styles from '../K9.module.css';
import ProfileSelect from '../../Home/SelectComponent/ProfileSelect.jsx';
import { BackCanvas, Program_Icon, ICON_CROSSROAD_LIST } from '../../../icon/svg/IconSvg.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSchemaTools, getSettingByType } from '../../../apis/settingService.jsx';
// import confetti from 'canvas-confetti';

const { Option } = Select;

const K9Header = ({
	newsItems,
	caseTrainingItems,
	longFormItems,
	tag4Filter,
	setTag4Filter,
	getMenuItems,
	handleMenuClick,
	currentUser,
	dropdownVisible,
	setDropdownVisible,
	tag4Options,
	activeTab,
	streamFilters,
	longFormFilters,
	caseTrainingFilters,
	onStreamFilterChange,
	onLongFormFilterChange,
	onCaseTrainingFilterChange,
	selectedProgram,
	setSelectedProgram,
	showSearchSection,
	toggleSearchSection
}) => {
	const { loadQuiz, setLoadQuiz } = useContext(MyContext)
	const [isMobile, setIsMobile] = useState(false);
	const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
	const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
	const [historyData, setHistoryData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [historyProgramFilter, setHistoryProgramFilter] = useState('all');
	const [isProgramModalForced, setIsProgramModalForced] = useState(false);
	const [headerStats, setHeaderStats] = useState({
		completedQuizzes: 0,
		totalQuizzes: 0,
		averageScore: 0,
		highScoreCount: 0
	});
	const [showFireworks, setShowFireworks] = useState(false);

	const navigate = useNavigate();


	// Load history data and calculate stats for header display
	useEffect(() => {
		if (currentUser?.id && newsItems && caseTrainingItems) {
			// loadHeaderStats();
		}
	}, [currentUser?.id, newsItems, caseTrainingItems, loadQuiz, selectedProgram]);

	// Load header statistics
	// const loadHeaderStats = async () => {
	// 	try {
	// 		const response = await getListQuestionHistoryByUser({ where: { user_id: currentUser?.id } });
	// 		const historyData = response || [];
	//
	// 		// Create a set of current question IDs for fast lookup
	// 		const currentQuestionIds = new Set();
	//
	// 		// Add news items with questions, filtered by selectedProgram
	// 		newsItems.forEach(item => {
	// 			if (item.questionContent != null && item.questionContent != undefined) {
	// 				// Filter by selectedProgram if it's not 'all'
	// 				if (selectedProgram === 'all' || !selectedProgram) {
	// 					currentQuestionIds.add(item.id);
	// 				} else {
	// 					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
	// 					if (itemTag4Array.includes(selectedProgram)) {
	// 						currentQuestionIds.add(item.id);
	// 					}
	// 				}
	// 			}
	// 		});
	//
	// 		// Add case training items with questions, filtered by selectedProgram
	// 		caseTrainingItems.forEach(item => {
	// 			if (item.questionContent != null && item.questionContent != undefined) {
	// 				// Filter by selectedProgram if it's not 'all'
	// 				if (selectedProgram === 'all' || !selectedProgram) {
	// 					currentQuestionIds.add(item.id);
	// 				} else {
	// 					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
	// 					if (itemTag4Array.includes(selectedProgram)) {
	// 						currentQuestionIds.add(item.id);
	// 					}
	// 				}
	// 			}
	// 		});
	//
	// 		// Filter history to only include current questions
	// 		const validHistoryData = historyData.filter(item =>
	// 			currentQuestionIds.has(item.question_id)
	// 		);
	//
	// 		// Calculate stats based on valid history data
	// 		const completedQuizzes = validHistoryData.filter(item => item.score && parseFloat(item.score) >= 0).length;
	// 		const totalQuizzes = currentQuestionIds.size;
	//
	// 		// Calculate average score from valid history
	// 		const validScores = validHistoryData
	// 			.map(item => {
	// 				const score = parseFloat(item.score);
	// 				return isNaN(score) ? null : score;
	// 			})
	// 			.filter(score => score !== null && score >= 0 && score <= 100);
	//
	// 		const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;
	//
	// 		// Calculate high score count from valid history
	// 		const highScoreCount = validHistoryData.filter(item => (item.score || 0) >= 60).length;
	//
	//
	//
	// 		setHeaderStats({
	// 			completedQuizzes,
	// 			totalQuizzes,
	// 			averageScore,
	// 			highScoreCount
	// 		});
	// 	} catch (error) {
	// 		console.error('Error loading header stats:', error);
	// 	}
	// };getListQuestionHistoryByUser

	// Check program selection on component mount and when tag4Options change
	useEffect(() => {
		checkAndSetProgramSelection();
	}, [tag4Options,]);

	// Check program selection logic
	const checkAndSetProgramSelection = () => {
		if (!tag4Options || tag4Options.length === 0) return;

		// Get saved program from localStorage
		const savedProgram = localStorage.getItem('selectedProgram');

		if (savedProgram) {
			// Check if saved program still exists in current options
			const programExists = tag4Options.find(option => option.value === savedProgram);

			if (programExists) {
				// Program exists, set it and don't open modal
				setSelectedProgram(savedProgram);
				setTag4Filter(savedProgram);
				setIsProgramModalOpen(false);
				setIsProgramModalForced(false);
			} else {
				// Program doesn't exist anymore, set to 'all' and don't force modal
				setSelectedProgram('all');
				setTag4Filter('all');
				localStorage.setItem('selectedProgram', 'all');
				setIsProgramModalOpen(false);
				setIsProgramModalForced(false);
			}
		} else {
			// No saved program, set to 'all' and don't force modal
			setSelectedProgram('all');
			setTag4Filter('all');
			localStorage.setItem('selectedProgram', 'all');
			setIsProgramModalOpen(false);
			setIsProgramModalForced(false);
		}
	};



	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const handleHistoryClick = async () => {
		// if (!currentUser?.id) {
		// 	message.error('Vui lòng đăng nhập để xem lịch sử quiz');
		// 	return;
		// }
		// setIsHistoryModalOpen(true);
		// setLoading(true);
		//
		// try {
		// 	const response = await getListQuestionHistoryByUser({ where: { user_id: currentUser?.id } });
		// 	console.log(response);
		// 	const historyDataResponse = response || [];
		// 	setHistoryData(historyDataResponse);
		//
		// 	// Check if all completed quizzes are passed with the fresh data
		// 	checkForCompletion(historyDataResponse);
		// } catch (error) {
		// 	console.error('Error fetching history:', error);
		// 	message.error('Có lỗi xảy ra khi tải lịch sử quiz');
		// } finally {
		// 	setLoading(false);
		// }
	};

	// Check if all quizzes are completed and passed
	const checkForCompletion = (historyDataToCheck = historyData) => {
		// Create a set of current question IDs for fast lookup
		const currentQuestionIds = new Set();

		// Add news items with questions, filtered by selectedProgram
		newsItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				// Filter by selectedProgram if it's not 'all'
				if (selectedProgram === 'all' || !selectedProgram) {
					currentQuestionIds.add(item.id);
				} else {
					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
					if (itemTag4Array.includes(selectedProgram)) {
						currentQuestionIds.add(item.id);
					}
				}
			}
		});

		// Add case training items with questions, filtered by selectedProgram
		caseTrainingItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				// Filter by selectedProgram if it's not 'all'
				if (selectedProgram === 'all' || !selectedProgram) {
					currentQuestionIds.add(item.id);
				} else {
					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
					if (itemTag4Array.includes(selectedProgram)) {
						currentQuestionIds.add(item.id);
					}
				}
			}
		});

		// Filter history to only include current questions
		const validHistoryData = historyDataToCheck.filter(item =>
			currentQuestionIds.has(item.question_id)
		);

		const totalQuizzes = currentQuestionIds.size;
		const completedQuizzes = validHistoryData.filter(item => item.score && parseFloat(item.score) >= 0);
		const passedQuizzes = completedQuizzes.filter(item => (item.score || 0) >= 60);

		// Debug log
		console.log('Completion Check:', {
			totalQuizzes,
			completedQuizzes: completedQuizzes.length,
			passedQuizzes: passedQuizzes.length,
			shouldCelebrate: totalQuizzes > 0 && completedQuizzes.length === totalQuizzes && passedQuizzes.length === totalQuizzes,
			historyDataLength: historyDataToCheck.length,
			validHistoryDataLength: validHistoryData.length,
			selectedProgram
		});

		// Only celebrate if ALL quizzes are completed AND ALL are passed
		if (totalQuizzes > 0 && completedQuizzes.length === totalQuizzes && passedQuizzes.length === totalQuizzes) {
			console.log('🎉 CELEBRATION TRIGGERED! All quizzes completed and passed!');
			setShowFireworks(true);
			// Trigger confetti animation
			triggerConfetti();
			// Auto hide fireworks after 5 seconds
			setTimeout(() => setShowFireworks(false), 2000);
		}
	};

	// Trigger confetti animation
	const triggerConfetti = () => {
		// Multiple confetti bursts
		const duration = 3000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

		function randomInRange(min, max) {
			return Math.random() * (max - min) + min;
		}

		const interval = setInterval(function () {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			const particleCount = 50 * (timeLeft / duration);

			// Create multiple confetti bursts
			confetti(Object.assign({}, defaults, {
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
			}));
			confetti(Object.assign({}, defaults, {
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
			}));
		}, 250);
	};

	// Calculate average score
	const calculateAverageScore = () => {
		const dataToUse = getFilteredHistoryData();
		if (!dataToUse || dataToUse.length === 0) return 0;

		// Filter out invalid scores and convert to numbers
		const validScores = dataToUse
			.map(item => {
				const score = parseFloat(item.score);
				return isNaN(score) ? null : score;
			})
			.filter(score => score !== null && score >= 0 && score <= 100);

		if (validScores.length === 0) return 0;

		const totalScore = validScores.reduce((sum, score) => sum + score, 0);
		return Math.round(totalScore / validScores.length);
	};

	// Filter history data by program and current questions
	const getFilteredHistoryData = () => {
		// Create a set of current question IDs for fast lookup
		const currentQuestionIds = new Set();

		// Add news items with questions, filtered by selectedProgram
		newsItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				// Filter by selectedProgram if it's not 'all'
				if (selectedProgram === 'all' || !selectedProgram) {
					currentQuestionIds.add(item.id);
				} else {
					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
					if (itemTag4Array.includes(selectedProgram)) {
						currentQuestionIds.add(item.id);
					}
				}
			}
		});

		// Add case training items with questions, filtered by selectedProgram
		caseTrainingItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				// Filter by selectedProgram if it's not 'all'
				if (selectedProgram === 'all' || !selectedProgram) {
					currentQuestionIds.add(item.id);
				} else {
					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
					if (itemTag4Array.includes(selectedProgram)) {
						currentQuestionIds.add(item.id);
					}
				}
			}
		});

		// Filter history to only include current questions
		const validHistoryData = historyData.filter(item =>
			currentQuestionIds.has(item.question_id)
		);

		// Apply program filter if needed
		if (historyProgramFilter === 'all') {
			return validHistoryData;
		}

		// Filter by question type instead of tag4
		const filteredData = validHistoryData.filter(item => {
			if (historyProgramFilter === 'news') {
				return item.questionType === 'news';
			} else if (historyProgramFilter === 'caseTraining') {
				return item.questionType === 'caseTraining';
			} else if (historyProgramFilter === 'longForm') {
				return item.questionType === 'longForm';
			} else if (historyProgramFilter === 'home') {
				return item.questionType === 'home';
			}
			return true;
		});

		// Debug log
		console.log('Program Filter Debug:', {
			historyProgramFilter,
			selectedProgram,
			validHistoryDataLength: validHistoryData.length,
			filteredDataLength: filteredData.length,
			sampleItems: validHistoryData.slice(0, 3).map(item => ({
				questionType: item.questionType,
				questionName: item.questionName
			}))
		});

		return filteredData;
	};

	// Calculate completed quizzes count
	const getCompletedQuizzesCount = () => {
		const filteredData = getFilteredHistoryData();
		return filteredData.filter(item => item.score && parseFloat(item.score) >= 0).length;
	};

	// Get type label based on questionType
	const getTypeLabel = (questionType) => {
		switch (questionType) {
			case 'news':
				return 'Learning Block';
			case 'caseTraining':
				return 'Case Training';
			case 'longForm':
				return 'Kho Tài Nguyên';
			case 'home':
				return 'Home';
			default:
				return 'Khác';
		}
	};

	const filteredHistoryData = getFilteredHistoryData();

	// Handle tag4 filter change
	const handleTag4Change = (value) => {
		setTag4Filter(value);
		setSelectedProgram(value);
		// Save to localStorage
		localStorage.setItem('selectedProgram', value);
		setIsProgramModalOpen(false);
		setIsProgramModalForced(false);
	};

	// Get current selected program name
	const getCurrentProgramName = () => {
		if (!selectedProgram) return 'Chọn chương trình';
		if (selectedProgram === 'all') return 'Tất cả chủ đề';
		const selectedProgramOption = tag4Options?.find(option => option.value === selectedProgram);
		return selectedProgramOption?.label || 'Chọn chương trình';
	};

	// Calculate program statistics
	const getProgramStats = (programValue) => {
		if (!programValue) return { theory: 0, practice: 0, totalHours: 0, totalWeeks: 0 };

		// Combine all items
		const allItems = [
			...caseTrainingItems,
			...newsItems
		];

		// Filter items by program
		let programItems;
		if (programValue === 'all') {
			// For 'all', include all items
			programItems = allItems;
		} else {
			// Filter items by specific program
			programItems = allItems.filter(item => {
				const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
				return itemTag4Array.includes(programValue);
			});
		}

		// Count theory (news) vs practice (caseTraining)
		const theoryItems = programItems.filter(item =>
			item.type === 'news'
		);
		const practiceItems = programItems.filter(item =>
			item.type === 'caseTraining'
		);

		// Calculate time: 40 minutes per theory item, 20 minutes per practice item
		const theoryMinutes = theoryItems.length * 40; // 40 minutes per theory item
		const practiceMinutes = practiceItems.length * 20; // 20 minutes per practice item
		const totalMinutes = theoryMinutes + practiceMinutes;
		const totalHours = totalMinutes / 60; // Convert to hours
		const totalWeeks = totalHours / 3.5; // 3.5 hours per week

		return {
			theory: theoryItems.length,
			practice: practiceItems.length,
			totalHours,
			totalWeeks
		};
	};

	// Format time display
	const formatTimeDisplay = (totalHours, totalWeeks) => {
		if (totalWeeks === 0) {
			return '0 tuần';
		}

		const weeks = Math.ceil(totalWeeks); // Round up to nearest week

		if (weeks === 1) {
			return '1 tuần';
		} else {
			return `${weeks} tuần`;
		}
	};

	// Only show tag4 filter for specific tabs
	const shouldShowTag4Filter = ['stream', 'longForm', 'caseTraining', 'home', 'caseUser', 'ai'].includes(activeTab);

	const columns = [
		{
			title: 'Tên câu hỏi',
			dataIndex: 'questionName',
			key: 'questionName',
			ellipsis: true,
			width: '30%',
			render: (text) => (
				<span style={{ fontWeight: 500, color: '#262626' }}>
					{text}
				</span>
			),
		},
		{
			title: 'Type',
			dataIndex: 'questionType',
			key: 'questionType',
			width: '15%',
			render: (questionType) => (
				<span style={{
					fontWeight: '500',
					fontSize: '13px',
					color: questionType === 'learning_block' ? '#1890ff' : '#722ed1',
					backgroundColor: questionType === 'learning_block' ? '#e6f7ff' : '#f9f0ff',
					padding: '4px 8px',
					borderRadius: '4px',
					border: `1px solid ${questionType === 'learning_block' ? '#91d5ff' : '#d3adf7'}`
				}}>
					{getTypeLabel(questionType)}
				</span>
			),
		},
		{
			title: 'Điểm',
			dataIndex: 'score',
			key: 'score',
			width: '15%',
			render: (score) => (
				<span style={{
					fontWeight: 'bold',
					fontSize: '14px',
					color: score >= 60 ? '#52c41a' : '#ff4d4f',
					backgroundColor: score >= 60 ? '#f6ffed' : '#fff2f0',
					padding: '4px 8px',
					borderRadius: '4px',
					border: `1px solid ${score >= 60 ? '#b7eb8f' : '#ffccc7'}`
				}}>
					{score}%
				</span>
			),
		},
		{
			title: 'Thời gian',
			dataIndex: 'updated_at',
			key: 'updated_at',
			width: '40%',
			render: (date) => {
				const formattedDate = formatDateToDDMMYYYY(date);
				return (
					<span style={{ color: '#666', fontSize: '13px' }}>
						{formattedDate}
					</span>
				);
			},
		},
	];
	const handleBackToDashboard = () => {
		navigate('/dashboard');
	};

	const location = useLocation();
	const [nameTable, setNameTable] = useState(null);
	const [tool, setTool] = useState(null);
	const [masterTool, setMasterTool] = useState(null);
	// Hàm kết hợp với thông tin từ schema master
	const combineWithMasterInfo = async (currentTool) => {
		try {
			const masterResponse = await getSchemaTools('master');
			const masterAppsList = masterResponse?.setting || [];

			if (masterAppsList && masterAppsList.length > 0) {
				const masterApp = masterAppsList.find(masterApp => masterApp.id === currentTool.id);
				if (masterApp) {
					console.log(`K9Header: Combining tool ${currentTool.id} with master info`);
					return {
						...currentTool,
						name: masterApp.name,
						icon: masterApp.icon
					};
				}
			}
			return currentTool;
		} catch (error) {
			console.error('Error getting master apps for K9 header:', error);
			return currentTool;
		}
	};

	useEffect(() => {
		const getDashboardSetting = async () => {
			try {
				const res = await getSettingByType('DASHBOARD_SETTING');
				if (res.setting.length > 0) {
					let dashboardSetting = res.setting.find(item => location.pathname.includes(item.id));
					if (dashboardSetting) {
						// Kết hợp với thông tin từ schema master
						const combinedTool = await combineWithMasterInfo(dashboardSetting);
						setNameTable(combinedTool.name);
						setTool(combinedTool);
						setMasterTool(combinedTool);
					} else {
						// Fallback for K9Service page
						setNameTable('Business Databook | Bách khoa kinh doanh 4.0');
					}
				}
			} catch (error) {
				console.error('Error loading dashboard setting for K9:', error);
			}
		};

		getDashboardSetting();
	}, [location]);

	const getIconSrcById = (tool) => {
		const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
		return found ? found.icon : undefined;
	};

	return (
		<div className={styles.header}>
			<div className={styles.navContainer}>
				<div className={styles.header_left}>
					<div className={styles.header_left}>
						<div className={styles.backCanvas}
							onClick={handleBackToDashboard}
						>
							<BackCanvas height={20} width={20} />
						</div>
						{masterTool && (
							<>
								{masterTool.icon ? (
									(() => {
										const iconSrc = getIconSrcById(masterTool);
										return iconSrc ? (
											<img src={iconSrc} alt={masterTool.name} width={30} height={30} />
										) : (
											<span style={{ fontSize: '20px' }}>{masterTool.icon}</span>
										);
									})()
								) : (
									<span style={{ fontSize: '20px' }}>🛠️</span>
								)}
							</>
						)}
						<div className={styles.headerLogo}>
							{masterTool ? masterTool.name : nameTable}
						</div>
						<div className={styles.logo} style={{ padding: '0px 4px' }}>
							{/*<img style={{ width : isMobile ? '80px' : '35px', height: isMobile ? '20px' : '32px' }} src="/LogoAiMBA.png" alt="" />*/}
							{/*{*/}
							{/*	!isMobile && (*/}
							{/*		<div className={styles.desc}>*/}
							{/*			<p>Expert-Grade Knowledge</p>*/}
							{/*			<p>& Situation Training</p>*/}
							{/*		</div>*/}
							{/*	)*/}
							{/*}*/}
							{shouldShowTag4Filter && (
								<>
									<Button
										icon={<Program_Icon width={22} height={24} />}
										type="text"
										onClick={() => setIsProgramModalOpen(true)}
										style={{
											fontWeight: 'bold',
											width: isMobile ? 'auto' : 'auto',
											minWidth: isMobile ? '100px' : '150px',
											maxWidth: isMobile ? '120px' : '500px',
											marginRight: isMobile ? 8 : 12,
											height: isMobile ? '28px' : '36px',
											backgroundColor: '#F7F7F7',
											border: '1px solid #e0e0e0',
											borderRadius: '8px',
											boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
											transition: 'all 0.2s ease',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = '#e8e8e8';
											e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)';
											e.currentTarget.style.transform = 'translateY(-2px)';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = '#F7F7F7';
											e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
											e.currentTarget.style.transform = 'translateY(0)';
										}}
									>
										<span style={{
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
											fontSize: isMobile ? '14px' : '17px',
											color: '#454545',
											display: 'block'
										}}>
											{isMobile ? (selectedProgram ? getCurrentProgramName() : 'Chọn') : getCurrentProgramName()}
										</span>
									</Button>
								</>
							)}
						</div>
					</div>

				</div>

				<div className={styles.header_right}>
					<div className={styles.headerActions}>
						{/* Program Filter Button */}

						{/* Search Section Toggle Button */}
						{['stream', 'longForm', 'caseTraining'].includes(activeTab) && !isMobile && (
							<Button
								icon={showSearchSection ? <EyeInvisibleOutlined /> : <EyeOutlined />}
								onClick={toggleSearchSection}
								size="small"
								style={{
									color: '#666',
									fontSize: '16px',
									height: '28px',
									padding: '0 8px',
									marginRight: '8px',
									borderRadius: '4px',
									display: 'flex',
									alignItems: 'center',
									gap: '4px'
								}}
								title={showSearchSection ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
							>
								{(showSearchSection ? 'Ẩn' : 'Hiện') + ' thanh chức năng'}
							</Button>
						)}

						{/* Desktop - History Button */}
						{/*{isMobile && (*/}
						{/*	<Button*/}
						{/*		type="primary"*/}
						{/*		icon={<HistoryOutlined />}*/}
						{/*		onClick={handleHistoryClick}*/}
						{/*		size={isMobile ? "small" : "middle"}*/}
						{/*		style={{*/}
						{/*			background: '#1890ff',*/}
						{/*			borderColor: '#1890ff',*/}
						{/*			fontSize: isMobile ? '11px' : '14px',*/}
						{/*			height: isMobile ? '28px' : '36px',*/}
						{/*			padding: isMobile ? '0 8px' : '0 12px',*/}
						{/*			minWidth: isMobile ? 'auto' : 'auto'*/}
						{/*		}}*/}
						{/*	>*/}
						{/*		{!isMobile && 'Thống kê cá nhân'}*/}
						{/*	</Button>*/}
						{/*)}*/}

						{/*/!* Desktop - Statistics Cards *!/*/}
						{/*{!isMobile && currentUser?.id && (*/}
						{/*	<div className={styles.headerStatsContainer}>*/}
						{/*		/!* Completed Quizzes *!/*/}
						{/*		<div*/}
						{/*			onClick={handleHistoryClick}*/}
						{/*			className={`${styles.statCard} ${styles.completedQuizzes}`}*/}
						{/*		>*/}
						{/*			<div className={styles.statValue}>*/}
						{/*				{headerStats.completedQuizzes}/{headerStats.totalQuizzes}*/}
						{/*			</div>*/}
						{/*			<div className={styles.statLabel}>*/}
						{/*				Đã làm*/}
						{/*			</div>*/}
						{/*		</div>*/}

						{/*		/!* Average Score *!/*/}
						{/*		<div*/}
						{/*			onClick={handleHistoryClick}*/}
						{/*			className={`${styles.statCard} ${styles.averageScore} ${headerStats.averageScore >= 60 ? styles.high : styles.low}`}*/}
						{/*		>*/}
						{/*			<div className={styles.statValue}>*/}
						{/*				{headerStats.averageScore}%*/}
						{/*			</div>*/}
						{/*			<div className={styles.statLabel}>*/}
						{/*				Trung bình*/}
						{/*			</div>*/}
						{/*		</div>*/}

						{/*		/!* High Score Count *!/*/}
						{/*		<div*/}
						{/*			onClick={handleHistoryClick}*/}
						{/*			className={`${styles.statCard} ${styles.highScoreCount}`}*/}
						{/*		>*/}
						{/*			<div className={styles.statValue}>*/}
						{/*				{headerStats.highScoreCount}*/}
						{/*			</div>*/}
						{/*			<div className={styles.statLabel}>*/}
						{/*				≥60%*/}
						{/*			</div>*/}
						{/*		</div>*/}
						{/*	</div>*/}
						{/*)}*/}
					</div>
				</div>
				{/*<Dropdown*/}
				{/*	menu={{*/}
				{/*		items: getMenuItems(),*/}
				{/*		onClick: handleMenuClick,*/}
				{/*	}}*/}
				{/*	open={dropdownVisible}*/}
				{/*	onOpenChange={setDropdownVisible}*/}
				{/*	placement='bottomRight'*/}
				{/*	trigger={['click']}*/}
				{/*>*/}
				{/*	<div className={styles.userInfo} style={{*/}
				{/*		padding: isMobile ? '4px 8px' : '8px 12px',*/}
				{/*		minWidth: isMobile ? 'auto' : 'auto'*/}
				{/*	}}>*/}
				{/*		<Avatar*/}
				{/*			size={isMobile ? 20 : 24}*/}
				{/*			icon={currentUser?.picture ? (*/}
				{/*				<img*/}
				{/*					src={currentUser.picture}*/}
				{/*					alt='avatar'*/}
				{/*					style={{*/}
				{/*						width: isMobile ? 20 : 24,*/}
				{/*						height: isMobile ? 20 : 24,*/}
				{/*						borderRadius: '50%',*/}
				{/*						objectFit: 'cover',*/}
				{/*					}}*/}
				{/*				/>*/}
				{/*			) : (*/}
				{/*				<UserOutlined />*/}
				{/*			)}*/}
				{/*			className={styles.userAvatar}*/}
				{/*		/>*/}
				{/*		{!isMobile && (*/}
				{/*			<div className={styles.userDetails}>*/}
				{/*				<span className={styles.userName}>*/}
				{/*					{currentUser?.name || currentUser?.email || 'User'}*/}
				{/*				</span>*/}
				{/*			</div>*/}
				{/*		)}*/}
				{/*		<DownOutlined className={styles.dropdownIcon} style={{*/}
				{/*			fontSize: isMobile ? '10px' : '12px',*/}
				{/*			marginLeft: isMobile ? 4 : 8*/}
				{/*		}} />*/}
				{/*	</div>*/}
				{/*</Dropdown>*/}
				{currentUser?.isAdmin && (
					<div className={styles.username}>
						<ProfileSelect />
					</div>
				)}
			</div>

			{/* Program Selection Modal */}
			<Modal
				title={
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontSize: '18px',
						fontWeight: '600',
						color: '#262626'
					}}>
						📚 Chọn chương trình
					</div>
				}
				open={isProgramModalOpen}
				onCancel={isProgramModalForced ? undefined : () => setIsProgramModalOpen(false)}
				footer={null}
				width={isMobile ? '95%' : '1200px'}
				maskClosable={!isProgramModalForced}
				closable={!isProgramModalForced}
				style={{
					...(isMobile && { top: 10 }),
				}}
			>
				<div style={{ overflowY: 'scroll', height: '100%', paddingBottom: 60, overflowX: 'hidden' }}>
					<div style={{ marginBottom: '20px' }}>
						<Typography.Text type="secondary">
							Chọn chương trình bạn muốn lọc nội dung. Mỗi chương trình có các bài tập và tài liệu riêng biệt.
						</Typography.Text>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{/* All Programs Option */}
						<Card
							hoverable
							onClick={() => handleTag4Change('all')}
							style={{
								cursor: 'pointer',
								border: selectedProgram === 'all' ? '2px solid #1890ff' : '1px solid #d9d9d9',
								borderRadius: '8px',
								transition: 'all 0.3s ease',
								background: selectedProgram === 'all' ? '#f0f8ff' : 'white'
							}}
							bodyStyle={{ padding: '16px' }}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
								<div style={{ flex: 1 }}>
									<Typography.Title level={5} style={{ margin: 0, color: '#262626', marginBottom: '4px' }}>
										Tất cả chủ đề
									</Typography.Title>
									<Typography.Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.4', color: '#868686', marginBottom: '8px', display: 'block' }}>
										Xem tất cả nội dung từ tất cả các chương trình đào tạo có sẵn.
									</Typography.Text>

									{/* All Programs Statistics */}
									<div style={{
										display: 'flex',
										justifyContent: 'end',
										alignItems: 'center',
										gap: '8px',
										fontSize: '13px',
										color: '#495057',
										marginTop: '8px'
									}}>
										{(() => {
											const stats = getProgramStats('all');
											return (
												<>
													<span style={{
														backgroundColor: '#e3f2fd',
														color: '#1976d2',
														padding: '1px 4px',
														borderRadius: '3px',
														fontWeight: '500',
														fontSize: '12px'
													}}>
														{stats.theory} lý thuyết
													</span>
													<span style={{ color: '#6c757d', fontSize: '12px' }}>|</span>
													<span style={{
														backgroundColor: '#fff3e0',
														color: '#f57c00',
														padding: '1px 4px',
														borderRadius: '3px',
														fontWeight: '500',
														fontSize: '12px'
													}}>
														{stats.practice} thực hành
													</span>
													<span style={{ color: '#6c757d', fontSize: '12px' }}>|</span>
													<span style={{
														backgroundColor: '#e8f5e8',
														color: '#388e3c',
														padding: '1px 4px',
														borderRadius: '3px',
														fontWeight: '500',
														fontSize: '12px'
													}}>
														{formatTimeDisplay(stats.totalHours, stats.totalWeeks)}
													</span>
												</>
											);
										})()}
									</div>
								</div>
								{selectedProgram === 'all' && (
									<div style={{
										width: 20,
										height: 20,
										borderRadius: '50%',
										background: '#1890ff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										marginLeft: '12px',
										flexShrink: 0
									}}>
										<span style={{ color: 'white', fontSize: '12px' }}>✓</span>
									</div>
								)}
							</div>
						</Card>

						{/* Individual Program Options */}
						{tag4Options?.map(option => {
							const stats = getProgramStats(option.value);
							return (
								<Card
									key={option.value}
									hoverable
									onClick={() => handleTag4Change(option.value)}
									style={{
										cursor: 'pointer',
										border: selectedProgram === option.value ? '2px solid #1890ff' : '1px solid #d9d9d9',
										borderRadius: '8px',
										transition: 'all 0.3s ease'
									}}
									bodyStyle={{ padding: '16px' }}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
										<div style={{ flex: 1 }}>
											<Typography.Title level={5} style={{ margin: 0, color: '#262626', marginBottom: '4px' }}>
												{option.label}
											</Typography.Title>
											<Typography.Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.4', color: '#868686', marginBottom: '8px', display: 'block' }}>
												{option.description || 'Chương trình đào tạo chuyên nghiệp với các bài tập thực hành và tài liệu học tập chất lượng cao.'}
											</Typography.Text>

											{/* Program Statistics */}
											<div style={{
												display: 'flex',
												justifyContent: 'end',
												alignItems: 'center',
												gap: '8px',
												fontSize: '13px',
												color: '#495057',
												marginTop: '8px'
											}}>
												<span style={{
													backgroundColor: '#e3f2fd',
													color: '#1976d2',
													padding: '1px 4px',
													borderRadius: '3px',
													fontWeight: '500',
													fontSize: '12px'
												}}>
													{stats.theory} lý thuyết
												</span>
												<span style={{ color: '#6c757d', fontSize: '12px' }}>|</span>
												<span style={{
													backgroundColor: '#fff3e0',
													color: '#f57c00',
													padding: '1px 4px',
													borderRadius: '3px',
													fontWeight: '500',
													fontSize: '12px'
												}}>
													{stats.practice} thực hành
												</span>
												<span style={{ color: '#6c757d', fontSize: '12px' }}>|</span>
												<span style={{
													backgroundColor: '#e8f5e8',
													color: '#388e3c',
													padding: '1px 4px',
													borderRadius: '3px',
													fontWeight: '500',
													fontSize: '12px'
												}}>
													{formatTimeDisplay(stats.totalHours, stats.totalWeeks)}
												</span>
											</div>
										</div>
										{selectedProgram === option.value && (
											<div style={{
												width: 20,
												height: 20,
												borderRadius: '50%',
												background: '#1890ff',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												marginLeft: '12px',
												flexShrink: 0
											}}>
												<span style={{ color: 'white', fontSize: '12px' }}>✓</span>
											</div>
										)}
									</div>
								</Card>
							);
						})}
					</div>
				</div>
			</Modal>

			<Modal
				title={
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontSize: '18px',
						fontWeight: '600',
						color: '#262626'
					}}>
						<HistoryOutlined style={{ color: '#1890ff' }} />
						Thống kê cá nhân của bạn
					</div>
				}
				open={isHistoryModalOpen}
				onCancel={() => setIsHistoryModalOpen(false)}
				footer={null}
				width={isMobile ? '95%' : '90%'}
				style={{
					...(isMobile && { top: 10 }),
					maxHeight: '98vh'
				}}
				bodyStyle={{
					padding: '20px',
					maxHeight: 'calc(98vh - 100px)',
					overflow: 'auto'
				}}
			>
				{loading ? (
					<div style={{
						textAlign: 'center',
						padding: '60px 20px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '16px'
					}}>
						<Spin size="large" />
						<Typography.Text style={{ color: '#666', fontSize: '16px' }}>
							Đang tải dữ liệu...
						</Typography.Text>
					</div>
				) : historyData.length === 0 ? (
					<div style={{
						textAlign: 'center',
						padding: '60px 20px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '16px'
					}}>
						<Empty
							description={
								<Typography.Text style={{ color: '#666', fontSize: '16px' }}>
									Chưa có lịch sử quiz nào
								</Typography.Text>
							}
							style={{ padding: '40px 0' }}
						/>
					</div>
				) : (
					<div style={{ height: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
						{/* Program Filter */}
						<div style={{ marginBottom: '20px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
								<Typography.Text strong style={{ fontSize: '16px', color: '#262626' }}>
									Lọc theo tài liệu:
								</Typography.Text>
								<Select
									value={historyProgramFilter}
									onChange={setHistoryProgramFilter}
									style={{ minWidth: '200px' }}
									size="middle"
								>
									<Option value="all">Tất cả chủ đề</Option>
									<Option value="news">Learning Block</Option>
									<Option value="caseTraining">Case Training</Option>
									<Option value="longForm">Kho Tài Nguyên</Option>
									<Option value="home">Home</Option>
								</Select>
							</div>
						</div>

						{/* Statistics Cards */}
						<Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
							<Col xs={24} sm={12} md={8}>
								<Card
									size="small"
									style={{
										textAlign: 'center',
										borderRadius: '8px',
										boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
									}}
								>
									<Statistic
										title="Tổng số bài quiz Đã làm"
										value={headerStats.completedQuizzes + " / " + headerStats.totalQuizzes}
										valueStyle={{ color: '#1890ff', fontSize: '24px' }}
									/>

								</Card>
							</Col>
							<Col xs={24} sm={12} md={8}>
								<Card
									size="small"
									style={{
										textAlign: 'center',
										borderRadius: '8px',
										boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
									}}
								>
									<Statistic
										title="Điểm trung bình"
										value={headerStats.averageScore}
										suffix="%"
										valueStyle={{
											color: headerStats.averageScore >= 60 ? '#52c41a' : '#ff4d4f',
											fontSize: '24px',
											fontWeight: 'bold'
										}}
									/>
								</Card>
							</Col>
							<Col xs={24} sm={24} md={8}>
								<Card
									size="small"
									style={{
										textAlign: 'center',
										borderRadius: '8px',
										boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
									}}
								>
									<Statistic
										title="Bài đạt điểm cao (≥60%)"
										value={headerStats.highScoreCount}
										valueStyle={{ color: '#52c41a', fontSize: '24px' }}
									/>
								</Card>
							</Col>
						</Row>

						{/* History Display - Table for PC, Cards for Mobile */}
						<Card
							title={
								<Typography.Title level={5} style={{ margin: 0, color: '#262626' }}>
									Chi tiết lịch sử
								</Typography.Title>
							}
							style={{
								borderRadius: '8px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
							}}
							bodyStyle={{ padding: '16px' }}
						>
							{/* PC - Table View */}
							{!isMobile && (
								<Table
									columns={columns}
									pagination={false}
									dataSource={filteredHistoryData}
									rowKey="id"
									size="middle"
									style={{
										borderRadius: '6px',
										overflow: 'hidden'
									}}
								/>
							)}

							{/* Mobile - Cards View */}
							{isMobile && (
								<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
									{filteredHistoryData.map((item, index) => (
										<Card
											key={item.id || index}
											size="small"
											style={{
												borderRadius: '8px',
												border: '1px solid #f0f0f0',
												boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
											}}
											bodyStyle={{ padding: '12px' }}
										>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
												{/* Question Name */}
												<div>
													<Typography.Text strong style={{ fontSize: '13px', color: '#262626' }}>
														{item.questionName}
													</Typography.Text>
												</div>

												{/* Info Row */}
												<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
													{/* Type Badge */}
													<span style={{
														fontWeight: '500',
														fontSize: '10px',
														color: item.questionType === 'learning_block' ? '#1890ff' : '#722ed1',
														backgroundColor: item.questionType === 'learning_block' ? '#e6f7ff' : '#f9f0ff',
														padding: '2px 6px',
														borderRadius: '4px',
														border: `1px solid ${item.questionType === 'learning_block' ? '#91d5ff' : '#d3adf7'}`
													}}>
														{getTypeLabel(item.questionType)}
													</span>

													{/* Score Badge */}
													<span style={{
														fontWeight: 'bold',
														fontSize: '11px',
														color: (item.score || 0) >= 60 ? '#52c41a' : '#ff4d4f',
														backgroundColor: (item.score || 0) >= 60 ? '#f6ffed' : '#fff2f0',
														padding: '2px 6px',
														borderRadius: '4px',
														border: `1px solid ${(item.score || 0) >= 60 ? '#b7eb8f' : '#ffccc7'}`
													}}>
														{item.score || 0}%
													</span>

													{/* Date */}
													<Typography.Text type="secondary" style={{ fontSize: '10px' }}>
														{formatDateToDDMMYYYY(item.updated_at)}
													</Typography.Text>
												</div>
											</div>
										</Card>
									))}
								</div>
							)}
						</Card>
					</div>
				)}
			</Modal>

			{/* Celebration Modal */}
			<Modal
				title={null}
				open={showFireworks}
				onCancel={() => setShowFireworks(false)}
				footer={null}
				width={isMobile ? '95%' : '500px'}
				centered
				closable={false}
				maskClosable={false}
				style={{
					...(isMobile && { top: 10 }),
				}}
				bodyStyle={{
					padding: '0',
					background: 'linear-gradient(135deg, #91d5ff 0%, #69c0ff 100%)',
					borderRadius: '16px',
					overflow: 'hidden',
					position: 'relative'
				}}
				className={styles.modalComplete}
			>
				<div style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '40px 30px',
				}}>
					{/* Main Celebration Icon */}
					<div style={{
						fontSize: '60px',
						marginBottom: '16px',
						animation: 'float 3s ease-in-out infinite'
					}}>
						🎓
					</div>

					{/* Title */}
					<div style={{
						fontSize: '24px',
						fontWeight: '600',
						color: '#1f1f1f',
						marginBottom: '8px',
						textAlign: 'center'
					}}>
						Chúc mừng!
					</div>

					{/* Subtitle */}
					<div style={{
						fontSize: '16px',
						color: '#595959',
						marginBottom: '24px',
						textAlign: 'center',
						fontWeight: '400'
					}}>
						Bạn đã hoàn thành xuất sắc tất cả bài quiz
					</div>

					{/* Achievement Summary - Simplified */}
					<div style={{
						background: 'rgba(255,255,255,0.8)',
						borderRadius: '12px',
						padding: '20px',
						marginBottom: '24px',
						border: '1px solid rgba(24, 144, 255, 0.2)',
						width: '100%',
						maxWidth: '320px'
					}}>
						<div style={{
							fontSize: '14px',
							fontWeight: '500',
							color: '#1f1f1f',
							marginBottom: '12px',
							textAlign: 'center'
						}}>
							Thành tích
						</div>

						<div style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '12px'
						}}>
							<div style={{
								textAlign: 'center',
								padding: '8px',
								background: 'rgba(24, 144, 255, 0.08)',
								borderRadius: '8px'
							}}>
								<div style={{ color: '#595959', fontSize: '12px', marginBottom: '4px' }}>
									Tổng bài
								</div>
								<div style={{ color: '#1f1f1f', fontWeight: '600', fontSize: '16px' }}>
									{headerStats.totalQuizzes}
								</div>
							</div>

							<div style={{
								textAlign: 'center',
								padding: '8px',
								background: 'rgba(24, 144, 255, 0.08)',
								borderRadius: '8px'
							}}>
								<div style={{ color: '#595959', fontSize: '12px', marginBottom: '4px' }}>
									Đã làm
								</div>
								<div style={{ color: '#1f1f1f', fontWeight: '600', fontSize: '16px' }}>
									{headerStats.completedQuizzes}
								</div>
							</div>

							<div style={{
								textAlign: 'center',
								padding: '8px',
								background: 'rgba(24, 144, 255, 0.08)',
								borderRadius: '8px'
							}}>
								<div style={{ color: '#595959', fontSize: '12px', marginBottom: '4px' }}>
									Điểm TB
								</div>
								<div style={{
									color: '#1f1f1f',
									fontWeight: '600',
									fontSize: '16px',
									background: headerStats.averageScore >= 60 ? 'rgba(82, 196, 26, 0.15)' : 'rgba(255, 77, 79, 0.15)',
									borderRadius: '4px',
									padding: '2px 6px'
								}}>
									{headerStats.averageScore}%
								</div>
							</div>

							<div style={{
								textAlign: 'center',
								padding: '8px',
								background: 'rgba(24, 144, 255, 0.08)',
								borderRadius: '8px'
							}}>
								<div style={{ color: '#595959', fontSize: '12px', marginBottom: '4px' }}>
									Đạt ≥60%
								</div>
								<div style={{
									color: '#1f1f1f',
									fontWeight: '600',
									fontSize: '16px',
									background: 'rgba(82, 196, 26, 0.15)',
									borderRadius: '4px',
									padding: '2px 6px'
								}}>
									{headerStats.highScoreCount}
								</div>
							</div>
						</div>
					</div>

					{/* Success Message - Simplified */}
					<div style={{
						textAlign: 'center',
						padding: '16px',
						borderRadius: '8px',
						background: 'rgba(255,255,255,0.6)',
						border: '1px solid rgba(24, 144, 255, 0.15)'
					}}>
						<div style={{
							fontSize: '16px',
							fontWeight: '500',
							color: '#1f1f1f',
							marginBottom: '6px'
						}}>
							Xuất sắc!
						</div>
						<div style={{
							fontSize: '13px',
							color: '#595959',
							lineHeight: '1.4'
						}}>
							Bạn đã chứng minh khả năng học tập tuyệt vời!
						</div>
					</div>
				</div>

				{/* CSS Animations */}
				<style>{`
            		@keyframes float {
            			0%, 100% {
            				transform: translateY(0px);
            			}
            			50% {
            				transform: translateY(-8px);
            			}
            		}
            	`}</style>
			</Modal>
		</div>
	);
};

export default K9Header;
