import React, { useContext, useEffect, useRef, useState } from 'react';
import { MyContext } from '../../MyContext';
import { Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import styles from './K9.module.css';
import K9Header from './components/K9Header.jsx';
import NewsTab from './components/NewsTab.jsx';
import LibraryTab from './components/LibraryTab.jsx';
import StoryTab from './components/StoryTab.jsx';
import ReportTab from './components/ReportTab.jsx';
import CompanyReportTab from './components/CompanyReportTab.jsx';
import ReportOverviewCharts from './components/ReportOverviewCharts.jsx';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getAISummaries, getK9ByType, getSettingByTypeExternal } from '../../apis/serviceApi/k9Service.jsx';
import AiChatTab from './components/AiChatTab.jsx';
import { ThesisTab } from './components/index.js';

const K9Service = () => {
	const { currentUser, setCurrentUser } = useContext(MyContext);
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState('company');
	const [expandedItem, setExpandedItem] = useState(null);
	const [showDetailId, setShowDetailId] = useState(null);
	const [loading, setLoading] = useState(false);
	const [newsItems, setNewsItems] = useState([]);
	const [libraryItems, setLibraryItems] = useState([]);
	const [storyItems, setStoryItems] = useState([]);
	const [dropdownVisible, setDropdownVisible] = useState(false);

	// AI Config states
	const [aiConfigModalVisible, setAiConfigModalVisible] = useState(false);
	const [aiConfigForm] = Form.useForm();
	const [aiConfigLoading, setAiConfigLoading] = useState(false);
	const [currentPrompt, setCurrentPrompt] = useState('');


	// Prompt mặc định cho AI tóm tắt thesis
	const defaultThesisSummaryPrompt = `Hãy tạo một tóm tắt tổng hợp và súc tích cho toàn bộ nội dung thesis sau đây. Tóm tắt nên có độ dài khoảng 200-300 ký tự và nêu bật những điểm chính, kết luận quan trọng:

{content}
Chỉ trả về câu tóm tắt, không có gì khác.`;

	// Set form values when modal becomes visible
	useEffect(() => {
		if (aiConfigModalVisible && currentPrompt) {
			aiConfigForm.setFieldsValue({ prompt: currentPrompt });
		}
	}, [aiConfigModalVisible, currentPrompt, aiConfigForm]);

	// Audio player states
	const [currentPlayingId, setCurrentPlayingId] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const audioRef = useRef(null);

	// Background audio states
	const [bgAudioSettings, setBgAudioSettings] = useState({
		enabled: false,
		audioUrl: '',
		volume: 0.5,
	});
	const bgAudioRef = useRef(null);

	// 7start audio ref
	const startAudioRef = useRef(null);

	// Reset expanded item when changing tabs
	const handleTabChange = (tab) => {
		setActiveTab(tab);
		setExpandedItem(null);
		setShowDetailId(null);
		// Stop any playing audio when changing tabs
		if (audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(false);
			setCurrentPlayingId(null);
		}

		// Stop 7start audio when changing tabs
		if (startAudioRef.current) {
			startAudioRef.current.pause();
		}

		// Stop background audio when changing tabs
		stopBackgroundAudio();

		// Scroll to top when changing tabs for better UX
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};
	// Separate filter states for each tab
	const [streamFilters, setStreamFilters] = useState({
		time: 'all',
		category: 'all',
		filter: 'all',
		search: '',
	});

	const [libraryFilters, setLibraryFilters] = useState({
		category: 'all',
		search: '',
	});

	const [storyFilters, setStoryFilters] = useState({
		time: 'all',
		category: 'all',
		search: '',
	});

	const [reportFilters, setReportFilters] = useState({
		search: '',
		category: 'all',
	});

	// Separate filter state for report2 tab
	const [report2Filters, setReport2Filters] = useState({
		search: '',
		category: 'all',
	});

	const [reportItems, setReportItems] = useState([]);
	const [filteredReports, setFilteredReports] = useState([]);
	const [filteredReports2, setFilteredReports2] = useState([]);
	const [reportLoading, setReportLoading] = useState(false);
	const [companyReportItems, setCompanyReportItems] = useState([]);
	const [companyReportLoading, setCompanyReportLoading] = useState(false);
	const [reportOverviewData, setReportOverviewData] = useState(null);


	// Load data from API
	const loadData = async () => {
		setLoading(true);
		try {
			const [newsData, libraryData, storyData] = await Promise.all([
				getK9ByType('news'),
				getK9ByType('library'),
				getK9ByType('story'),
			]);

			setNewsItems(newsData || []);
			setLibraryItems(libraryData || []);
			setStoryItems(storyData || []);
		} catch (error) {
			console.error('Error loading K9Service data:', error);
			// Set empty arrays as fallback
			setNewsItems([]);
			setLibraryItems([]);
			setStoryItems([]);
		} finally {
			setLoading(false);
		}
	};

	// Load AI Summary data
	const loadReportData = async () => {
		setReportLoading(true);
		try {
			const data = await getAISummaries();

			// Filter out items with "draft" and "archived" status, only show "published" items
			const publishedData = (data || []).filter(item => item.status === 'published');

			setReportItems(publishedData);
			setFilteredReports(publishedData);
		} catch (error) {
			console.error('Error loading report data:', error);
			setReportItems([]);
			setFilteredReports([]);
		} finally {
			setReportLoading(false);
		}
	};

	// Load Company Report data
	const loadCompanyReportData = async () => {
		setCompanyReportLoading(true);
		try {
			const data = await getAISummaries();

			// Filter only company reports
			const companyReports = data?.filter(item => {
				try {
					const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
					return info?.sheetName === 'company_report';
				} catch (error) {
					return false;
				}
			}) || [];

			setCompanyReportItems(companyReports);
		} catch (error) {
			console.error('Error loading company report data:', error);
			setCompanyReportItems([]);
		} finally {
			setCompanyReportLoading(false);
		}
	};

	// Load background audio settings
	const loadBackgroundAudioSettings = async () => {
		try {
			const settings = await getSettingByTypeExternal('BACKGROUND_AUDIO');
			if (settings?.setting) {
				setBgAudioSettings(settings.setting);
			} else {
				console.log('🎵 No background audio settings found');
			}
		} catch (error) {
			console.log('🎵 Error loading background audio settings:', error);
		}
	};

	// Load report overview settings
	const loadReportOverviewSettings = async () => {
		try {
			const settings = await getSettingByTypeExternal('REPORT_OVERVIEW');
			if (settings?.setting) {
				setReportOverviewData(settings.setting);
			} else {
				console.log('📊 No report overview settings found');
			}
		} catch (error) {
			console.log('📊 Error loading report overview settings:', error);
		}
	};

	// Load AI config
	const loadAiConfig = async () => {
		try {
			const config = await getSettingByTypeExternal('SETTING_AI_THESIS_SUMMARY');
			if (config && config.setting) {
				setCurrentPrompt(config.setting);
			} else {
				setCurrentPrompt(defaultThesisSummaryPrompt);
			}
		} catch (error) {
			console.error('Error loading AI config:', error);
			setCurrentPrompt(defaultThesisSummaryPrompt);
		}
	};

	// Play background audio
	const playBackgroundAudio = async () => {

		if (!bgAudioSettings.enabled) {
			console.log('🎵 Background audio is disabled');
			return;
		}

		if (!bgAudioSettings.audioUrl) {
			console.log('🎵 No background audio URL');
			return;
		}

		try {
			// Stop existing background audio if playing
			if (bgAudioRef.current) {
				bgAudioRef.current.pause();
			}

			const bgAudio = new Audio(bgAudioSettings.audioUrl);
			bgAudioRef.current = bgAudio;
			bgAudio.volume = bgAudioSettings.volume || 0.5;
			bgAudio.loop = true;

			// Add error handling for the audio element
			bgAudio.onerror = (e) => {
				console.error('🎵 Background audio error:', e);
			};

			bgAudio.oncanplaythrough = () => {
			};

			await bgAudio.play();
		} catch (error) {
			console.error('🎵 Error playing background audio:', error);
		}
	};

	// Stop background audio
	const stopBackgroundAudio = () => {
		if (bgAudioRef.current) {
			bgAudioRef.current.pause();
		}
	};

	// Pause background audio
	const pauseBackgroundAudio = () => {
		if (bgAudioRef.current) {
			bgAudioRef.current.pause();
		}
	};

	// Resume background audio
	const resumeBackgroundAudio = async () => {
		if (bgAudioRef.current) {
			try {
				await bgAudioRef.current.play();
			} catch (error) {
				console.error('🎵 Error resuming background audio:', error);
			}
		}
	};

	// Play 7start.MP3 before story
	const play7StartAudio = () => {
		return new Promise((resolve, reject) => {
			try {
				// Stop existing 7start audio if playing
				if (startAudioRef.current) {
					startAudioRef.current.pause();
				}

				const startAudio = new Audio('/7sstart.MP3');
				startAudioRef.current = startAudio;
				startAudio.volume = 0.8; // Slightly louder for intro effect

				startAudio.onended = () => {
					resolve();
				};

				startAudio.onerror = (e) => {
					reject(e);
				};

				startAudio.play();
			} catch (error) {
				console.error('🎵 Error playing 7start audio:', error);
				reject(error);
			}
		});
	};

	// Filter functions
	const getFilteredItems = (items, currentFilters) => {
		return items.filter(item => {
			// Chỉ hiển thị news đã xuất bản và impact khác 'skip'
			if (item.status !== 'published' || item.impact === 'skip') {
				return false;
			}

			// Time filter dựa vào createdAt
			if (currentFilters.time && currentFilters.time !== 'all' && item.createdAt) {
				const itemDate = new Date(item.createdAt);
				const now = new Date();
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				const yesterday = new Date(today);
				yesterday.setDate(today.getDate() - 1);
				const weekAgo = new Date(today);
				weekAgo.setDate(today.getDate() - 7);

				switch (currentFilters.time) {
					case 'today':
						if (itemDate < today) return false;
						break;
					case 'yesterday':
						if (itemDate < yesterday || itemDate >= today) return false;
						break;
					case 'week':
						if (itemDate < weekAgo) return false;
						break;
				}
			}

			// Category filter
			if (currentFilters.category !== 'all' && item.category !== currentFilters.category) {
				return false;
			}

			// Sentiment/Impact filter (for news)
			if (currentFilters.filter !== 'all') {
				switch (currentFilters.filter) {
					case 'positive':
						if (item.sentiment !== 'positive') return false;
						break;
					case 'negative':
						if (item.sentiment !== 'negative') return false;
						break;
					case 'important':
						if (item.impact !== 'important') return false;
						break;
				}
			}

			// Search filter
			if (currentFilters.search) {
				const searchTerm = currentFilters.search.toLowerCase();
				const searchableText = `${item.title} ${item.summary || ''} ${item.description || ''} ${item.detail || ''}`.toLowerCase();
				if (!searchableText.includes(searchTerm)) {
					return false;
				}
			}

			return true;
		});
	};

	// Filter handlers for each tab
	const handleStreamFilterChange = (filterType, value) => {
		setStreamFilters(prev => ({
			...prev,
			[filterType]: value,
		}));
	};

	const handleStreamSearchChange = (e) => {
		setStreamFilters(prev => ({
			...prev,
			search: e.target.value,
		}));
	};

	const handleLibraryFilterChange = (filterType, value) => {
		setLibraryFilters(prev => ({
			...prev,
			[filterType]: value,
		}));
	};

	const handleLibrarySearchChange = (e) => {
		setLibraryFilters(prev => ({
			...prev,
			search: e.target.value,
		}));
	};

	const handleStoryFilterChange = (filterType, value) => {
		setStoryFilters(prev => ({
			...prev,
			[filterType]: value,
		}));
	};

	const handleStorySearchChange = (e) => {
		setStoryFilters(prev => ({
			...prev,
			search: e.target.value,
		}));
	};

	const handleReportFilterChange = (filterType, value) => {
		const newFilters = {
			...reportFilters,
			[filterType]: value,
		};
		setReportFilters(newFilters);
		applyReportFilters(reportItems, newFilters);
	};

	const handleReportSearchChange = (e) => {
		const searchTerm = e.target.value;
		setReportFilters(prev => ({
			...prev,
			search: searchTerm,
		}));

		applyReportFilters(reportItems, { ...reportFilters, search: searchTerm });
	};

	const handleReport2FilterChange = (filterType, value) => {
		const newFilters = {
			...report2Filters,
			[filterType]: value,
		};
		setReport2Filters(newFilters);
		applyReport2Filters(reportItems, newFilters);
	};

	const handleReport2SearchChange = (e) => {
		const searchTerm = e.target.value;
		setReport2Filters(prev => ({
			...prev,
			search: searchTerm,
		}));

		applyReport2Filters(reportItems, { ...report2Filters, search: searchTerm });
	};

	const applyReportFilters = (items, filters) => {
		let filtered = items;

		// Search filter
		if (filters.search && filters.search.trim()) {
			const searchTerm = filters.search.toLowerCase();
			filtered = filtered.filter(item => {
				try {
					const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
					const title = info?.title || '';
					const summary = item.summary1 || '';
					const detail = item.summary2 || '';

					const searchableText = `${title} ${summary} ${detail}`.toLowerCase();
					return searchableText.includes(searchTerm);
				} catch (error) {
					return false;
				}
			});
		}

		// Category filter - chỉ hiển thị 'Doanh nghiệp' và 'Vĩ mô' cho tab report
		filtered = filtered.filter(item => {
			return item.category === 'Doanh nghiệp' || item.category === 'Vĩ mô';
		});

		// Additional category filter if specified
		if (filters.category && filters.category !== 'all') {
			filtered = filtered.filter(item => {
				return item.category === filters.category;
			});
		}

		setFilteredReports(filtered);
	};

	const applyReport2Filters = (items, filters) => {
		let filtered = items;

		// Search filter
		if (filters.search && filters.search.trim()) {
			const searchTerm = filters.search.toLowerCase();
			filtered = filtered.filter(item => {
				try {
					const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
					const title = info?.title || '';
					const summary = item.summary1 || '';
					const detail = item.summary2 || '';

					const searchableText = `${title} ${summary} ${detail}`.toLowerCase();
					return searchableText.includes(searchTerm);
				} catch (error) {
					return false;
				}
			});
		}

		// Category filter - chỉ hiển thị 'Chiến lược' cho tab report2
		filtered = filtered.filter(item => {
			return item.category === 'Chiến lược';
		});

		// Additional category filter if specified
		if (filters.category && filters.category !== 'all') {
			filtered = filtered.filter(item => {
				return item.category === filters.category;
			});
		}

		setFilteredReports2(filtered);
	};

	const handleItemClick = (item) => {
		const newExpandedItem = expandedItem === item.id ? null : item.id;
		setExpandedItem(newExpandedItem);

		// Reset detail view when collapsing or switching to another item
		if (newExpandedItem !== item.id) {
			setShowDetailId(null);
		}
	};

	const showDetail = (item, e) => {
		e.stopPropagation();
		setShowDetailId(showDetailId === item.id ? null : item.id);
	};

	const openSource = (item, e) => {
		e.stopPropagation();
		if (item.source) {
			window.open(item.source, '_blank', 'noopener,noreferrer');
		}
	};

	const learnMore = (item, e) => {
		e.stopPropagation();
		alert(`Tìm hiểu thêm: ${item.title.substring(0, 50)}...`);
	};

	const handleOpenFile = (item, e) => {
		e.stopPropagation();
		try {
			const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
			if (info?.URLReport) {
				window.open(info.URLReport, '_blank', 'noopener,noreferrer');
			}
		} catch (error) {
			console.error('Error opening file:', error);
		}
	};

	const playStory = async (item, e) => {
		e.stopPropagation();

		// Nếu đang phát cùng một audio thì pause/resume
		if (currentPlayingId === item.id) {
			if (isPlaying) {
				audioRef.current?.pause();
				setIsPlaying(false);
				// Pause nhạc nền khi pause story
				pauseBackgroundAudio();
			} else {
				try {
					await audioRef.current?.play();
					setIsPlaying(true);
					// Resume nhạc nền khi resume story
					await resumeBackgroundAudio();
				} catch (error) {
					console.error('Error resuming audio:', error);
					alert('Không thể phát audio!');
				}
			}
			return;
		}

		// Nếu đang phát audio khác thì dừng và phát audio mới
		if (audioRef.current) {
			audioRef.current.pause();
		}

		// Stop 7start audio if playing
		if (startAudioRef.current) {
			startAudioRef.current.pause();
		}

		// Stop existing background audio
		stopBackgroundAudio();

		setIsLoading(true);
		setCurrentPlayingId(item.id);

		try {
			await playBackgroundAudio();
			await play7StartAudio();
			const audio = new Audio(item.audioUrl);
			audioRef.current = audio;

			// Xử lý events
			audio.onloadstart = () => setIsLoading(true);
			audio.oncanplay = () => setIsLoading(false);
			audio.onplay = () => {
				setIsPlaying(true);
			};
			audio.onpause = () => {
				setIsPlaying(false);
				pauseBackgroundAudio();
			};
			audio.onended = () => {
				setIsPlaying(false);
				setCurrentPlayingId(null);
				stopBackgroundAudio();
			};
			audio.onerror = () => {
				setIsLoading(false);
				setIsPlaying(false);
				setCurrentPlayingId(null);
				stopBackgroundAudio();
				alert('Không thể tải audio!');
			};

			// Phát audio của story
			await audio.play();

		} catch (error) {
			console.error('Error playing audio:', error);
			setIsLoading(false);
			setCurrentPlayingId(null);
			stopBackgroundAudio();

			// If 7start failed, try playing story directly
			if (error.message && error.message.includes('7start')) {
				try {
					const audio = new Audio(item.audioUrl);
					audioRef.current = audio;
					await audio.play();
					setIsPlaying(true);
					// Start background audio even if 7start failed
					await playBackgroundAudio();
				} catch (storyError) {
					console.error('Story audio also failed:', storyError);
					alert('Không thể phát audio!');
				}
			} else {
				alert('Không thể phát audio!');
			}
		}
	};

	const stopStory = (e) => {
		e.stopPropagation();

		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0; // Reset về đầu
		}

		// Stop 7start audio if playing
		if (startAudioRef.current) {
			startAudioRef.current.pause();
		}

		// Stop nhạc nền khi stop story
		stopBackgroundAudio();

		setIsPlaying(false);
		setCurrentPlayingId(null);
		setIsLoading(false);
	};

	useEffect(() => {
		loadData();
		loadReportData();
		loadCompanyReportData();
		loadBackgroundAudioSettings();
		loadReportOverviewSettings();
		loadAiConfig();
	}, []);

	// Listen for AI summaries updates
	useEffect(() => {
		const handleAISummariesUpdate = (event) => {
			if (event.detail && event.detail.type === 'ai_summaries_updated') {
				loadReportData();
			}
		};

		window.addEventListener('ai_summaries_updated', handleAISummariesUpdate);

		return () => {
			window.removeEventListener('ai_summaries_updated', handleAISummariesUpdate);
		};
	}, []);

	// Apply filters when reportItems change
	useEffect(() => {
		if (reportItems.length > 0) {
			applyReportFilters(reportItems, reportFilters);
			applyReport2Filters(reportItems, report2Filters);
		}
	}, [reportItems, reportFilters, report2Filters]);

	// Reload background audio settings when coming back to the page
	useEffect(() => {
		const handleFocus = () => {
			loadBackgroundAudioSettings();
		};

		window.addEventListener('focus', handleFocus);

		return () => {
			window.removeEventListener('focus', handleFocus);
		};
	}, []);

	// Cleanup audio when component unmounts
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
			if (bgAudioRef.current) {
				bgAudioRef.current.pause();
				bgAudioRef.current = null;
			}
			if (startAudioRef.current) {
				startAudioRef.current.pause();
				startAudioRef.current = null;
			}
		};
	}, []);

	const filteredNews = getFilteredItems(newsItems, streamFilters);
	const filteredLibrary = getFilteredItems(libraryItems, libraryFilters);
	const filteredStories = getFilteredItems(storyItems, storyFilters);

	// Tab options
	const tabOptions = [
		// { key: 'story', label: 'Podcast & Câu chuyện' },
		// { key: 'library', label: 'Forum khởi nghiệp' },
		{ key: 'report', label: ' Kinh tế vĩ mô - ngành' },
		{ key: 'report2', label: ' Chiến lược đầu tư' },
		{ key: 'company', label: 'Phân tích DN' },
		// { key: 'ai', label: 'Trợ lý AI' },
		// { key: 'thesis', label: 'Sổ cá nhân' },
		// { key: 'stream', label: 'Knowledge Base' },

	];


	const [showFullOverview, setShowFullOverview] = useState(false);
	// Xử lý tách tiêu đề và nội dung cho overview
	let overviewTitle = null;
	let overviewRest = reportOverviewData && reportOverviewData.overview ? reportOverviewData.overview : '';

	if (overviewRest) {
		// Lấy dòng đầu tiên
		const firstLineEnd = overviewRest.indexOf('\n');
		const firstLine = firstLineEnd !== -1 ? overviewRest.slice(0, firstLineEnd) : overviewRest;
		const restContent = firstLineEnd !== -1 ? overviewRest.slice(firstLineEnd + 1) : '';

		// Regex: ### <TIÊU ĐỀ> - ... hoặc ## <TIÊU ĐỀ> - ...
		const match = firstLine.match(/^#+\s*<([^>]+)>\s*-\s*(.*)$/);
		if (match) {
			overviewTitle = match[1].trim();
			// Phần còn lại: "- ..." + các dòng sau
			overviewRest = (match[2] ? '- ' + match[2] : '') + (restContent ? '\n' + restContent : '');
		}
	}

	const isLong = overviewRest.length > 800;
	const displayedContent = !showFullOverview && isLong
		? overviewRest.slice(0, 800) + '...'
		: overviewRest;

	const handleBackToDashboard = () => {
		navigate('/dashboard');
	};

	return (
		<div className={styles.background}>
			<div className={styles.container}>
				<K9Header
					onBack={handleBackToDashboard}
					activeTab={activeTab}
					onTabChange={handleTabChange}
					tabOptions={tabOptions}
				/>

				{/* Story Tab */}
				{activeTab === 'story' && (
					<StoryTab
						loading={loading}
						filteredStories={filteredStories}
						filters={storyFilters}
						expandedItem={expandedItem}
						showDetailId={showDetailId}
						currentPlayingId={currentPlayingId}
						isPlaying={isPlaying}
						isLoading={isLoading}
						onFilterChange={handleStoryFilterChange}
						onSearchChange={handleStorySearchChange}
						onItemClick={handleItemClick}
						onShowDetail={showDetail}
						onPlayStory={playStory}
						onStopStory={stopStory}
						totalCount={storyItems.filter(item => item.status === 'published').length}
						storyItems={storyItems}
					/>
				)}

				{/* Stream News Tab */}
				{activeTab === 'stream' && (
					<NewsTab
						loading={loading}
						filteredNews={filteredNews}
						filters={streamFilters}
						expandedItem={expandedItem}
						showDetailId={showDetailId}
						onFilterChange={handleStreamFilterChange}
						onSearchChange={handleStreamSearchChange}
						onItemClick={handleItemClick}
						onShowDetail={showDetail}
						onOpenSource={openSource}
						activeTab={activeTab}
						totalCount={newsItems.filter(item => item.status === 'published').length}
						newsItems={newsItems}
					/>
				)}

				{/* Library Tab */}
				{activeTab === 'library' && (
					<LibraryTab
						loading={loading}
						filteredLibrary={filteredLibrary}
						filters={libraryFilters}
						expandedItem={expandedItem}
						onFilterChange={handleLibraryFilterChange}
						onSearchChange={handleLibrarySearchChange}
						onItemClick={handleItemClick}
						totalCount={libraryItems.filter(item => item.status === 'published').length}
						libraryItems={libraryItems}
					/>
				)}

				{/* Report Tab */}
				{activeTab === 'report' && (
					<div>
						{/* Report Overview Section */}
						{reportOverviewData && (
							<div style={{
								borderBottom: '1px solid #e8e8e8',
								marginBottom: '10px',
							}}>
								<div style={{
									maxWidth: '1200px',
									margin: '0 auto',
								}}>
									{/* Overview Text */}
									{/*{reportOverviewData.overview && (*/}
									{/*	<div style={{*/}
									{/*		marginBottom: '10px',*/}
									{/*		padding: '16px',*/}
									{/*		backgroundColor: '#fff',*/}
									{/*		borderRadius: '8px',*/}
									{/*		border: '1px solid #e8e8e8',*/}
									{/*		position: 'relative',*/}
									{/*	}}>*/}
									{/*		/!* CreateAt timestamp ở góc bên phải *!/*/}
									{/*		{reportOverviewData.createAt && (*/}
									{/*			<div style={{*/}
									{/*				position: 'absolute',*/}
									{/*				top: '8px',*/}
									{/*				right: '12px',*/}
									{/*				fontSize: '12px',*/}
									{/*				color: '#999',*/}
									{/*				backgroundColor: '#f5f5f5',*/}
									{/*				padding: '2px 6px',*/}
									{/*				borderRadius: '3px',*/}
									{/*				border: '1px solid #e8e8e8',*/}
									{/*			}}>*/}
									{/*				{(() => {*/}
									{/*					const date = new Date(reportOverviewData.createAt);*/}
									{/*					if (isNaN(date.getTime())) return 'N/A';*/}

									{/*					const day = String(date.getDate()).padStart(2, '0');*/}
									{/*					const month = String(date.getMonth() + 1).padStart(2, '0');*/}
									{/*					const year = date.getFullYear();*/}
									{/*					const hours = String(date.getHours()).padStart(2, '0');*/}
									{/*					const minutes = String(date.getMinutes()).padStart(2, '0');*/}

									{/*					return `Tạo lúc: ${day}/${month}/${year} ${hours}:${minutes}`;*/}
									{/*				})()}*/}
									{/*			</div>*/}
									{/*		)}*/}
									{/*		<div className={styles.overViewReport}>*/}
									{/*			<div*/}
									{/*				className={styles.markdownContent}*/}
									{/*				dangerouslySetInnerHTML={{*/}
									{/*					__html: DOMPurify.sanitize(marked.parse(displayedContent)),*/}
									{/*				}}*/}
									{/*			/>*/}
									{/*			{isLong && !showFullOverview && (*/}
									{/*				<button*/}
									{/*					style={{*/}
									{/*						marginTop: 8,*/}
									{/*						background: 'none',*/}
									{/*						border: 'none',*/}
									{/*						color: '#1890ff',*/}
									{/*						cursor: 'pointer',*/}
									{/*						padding: 0,*/}
									{/*						fontSize: 14,*/}
									{/*					}}*/}
									{/*					onClick={() => setShowFullOverview(true)}*/}
									{/*				>*/}
									{/*					Xem thêm*/}
									{/*				</button>*/}
									{/*			)}*/}
									{/*			{isLong && showFullOverview && (*/}
									{/*				<button*/}
									{/*					style={{*/}
									{/*						marginTop: 8,*/}
									{/*						background: 'none',*/}
									{/*						border: 'none',*/}
									{/*						color: '#1890ff',*/}
									{/*						cursor: 'pointer',*/}
									{/*						padding: 0,*/}
									{/*						fontSize: 14,*/}
									{/*					}}*/}
									{/*					onClick={() => setShowFullOverview(false)}*/}
									{/*				>*/}
									{/*					Thu gọn*/}
									{/*				</button>*/}
									{/*			)}*/}
									{/*		</div>*/}
									{/*	</div>*/}
									{/*)}*/}
									{/* Overview Charts */}
									<ReportOverviewCharts overviewData={reportOverviewData} />
								</div>
							</div>
						)}
						{/* Report List */}
						<div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
							<div style={{ width: '64%' }}>
								<ReportTab
									loading={reportLoading}
									filteredReports={filteredReports}
									filters={reportFilters}
									expandedItem={expandedItem}
									showDetailId={showDetailId}
									onFilterChange={handleReportFilterChange}
									onSearchChange={handleReportSearchChange}
									onItemClick={handleItemClick}
									onShowDetail={showDetail}
									onOpenFile={handleOpenFile}
									activeTab={activeTab}
									totalCount={reportItems.filter(item => item.category === 'Doanh nghiệp' || item.category === 'Vĩ mô').length}
									reportItems={reportItems.filter(item => item.category === 'Doanh nghiệp' || item.category === 'Vĩ mô')}
								/>
							</div>
						</div>

					</div>
				)}

				{/* Report2 Tab - Chiến lược đầu tư */}
				{activeTab === 'report2' && (
					<div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
						<div style={{ width: '64%' }}>
							<ReportTab
								loading={reportLoading}
								filteredReports={filteredReports2}
								filters={report2Filters}
								expandedItem={expandedItem}
								showDetailId={showDetailId}
								onFilterChange={handleReport2FilterChange}
								onSearchChange={handleReport2SearchChange}
								onItemClick={handleItemClick}
								onShowDetail={showDetail}
								onOpenFile={handleOpenFile}
								activeTab={activeTab}
								totalCount={reportItems.filter(item => item.category === 'Chiến lược').length}
								reportItems={reportItems.filter(item => item.category === 'Chiến lược')}
							/>
						</div>
					</div>
				)}

				{/* Company Report Tab */}
				{activeTab === 'company' && (
					<CompanyReportTab
						loading={companyReportLoading}
						aiSummaries={reportItems}
						onOpenFile={handleOpenFile}
					/>
				)}

				{/*Thesis Tab*/}
				{activeTab === 'thesis' && (
					<ThesisTab currentPrompt={currentPrompt} />
				)}

				{/* AI Chat Tab */}
				{activeTab === 'ai' && (
					<AiChatTab />
				)}
			</div>
		</div>
	);
};

export default K9Service;
