import React, { useState, useContext, useEffect } from 'react';
import { Select, Typography, Input, Button, message, Modal, Tabs, Table, Switch, Tooltip } from 'antd';
import { sendToN8nFacebookPostsScraper } from '../../apis/apifyService';
import { sendToN8nCrawlerGooglePlaces } from '../../apis/apifyService';
import { sendToN8nSocialMediaSentimentAnalysisTool } from '../../apis/apifyService';
import { sendToN8nGoogleTrendsFastScraper } from '../../apis/apifyService';
import { createApifyToolLog, getAllApifyToolLog, getApifyToolLogById } from '../../apis/ApifyToolLogService';
import { MyContext } from '../../MyContext';
import { getSettingByType, createSetting, updateSetting } from '../../apis/settingService';
// import { aiGen } from '../../apis/botService';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const TOOL_OPTIONS = [
	{ label: 'Facebook Post', value: 'facebook_post' },
	{ label: 'Google Maps Scraper', value: 'google_maps_scraper' },
	{ label: 'Social Media Sentiment Analysis Tool', value: 'sentiment_analysis' },
	{ label: 'Google Trends Scraper FAST', value: 'google_trends_scraper_fast' },
];

// Function to format response data for table display
const formatResponseForTable = (data, toolName) => {
	if (!data || typeof data !== 'object') {
		return { columns: [], dataSource: [] };
	}

	// Handle different response structures based on tool
	let tableData = [];
	let columns = [];

	if (toolName === 'Facebook Post') {
		if (Array.isArray(data)) {
			tableData = data;
		} else if (data.n8nResponse && Array.isArray(data.n8nResponse)) {
			tableData = data.n8nResponse;
		} else if (data.data && Array.isArray(data.data)) {
			tableData = data.data;
		} else if (data.results && Array.isArray(data.results)) {
			tableData = data.results;
		}
	} else if (toolName === 'Google Maps Scraper') {
		if (Array.isArray(data)) {
			tableData = data;
		} else if (data.n8nResponse && Array.isArray(data.n8nResponse)) {
			tableData = data.n8nResponse;
		} else if (data.data && Array.isArray(data.data)) {
			tableData = data.data;
		} else if (data.results && Array.isArray(data.results)) {
			tableData = data.results;
		}
	} else if (toolName === 'Social Media Sentiment Analysis Tool') {
		if (Array.isArray(data)) {
			tableData = data;
		} else if (data.n8nResponse && Array.isArray(data.n8nResponse)) {
			tableData = data.n8nResponse;
		} else if (data.data && Array.isArray(data.data)) {
			tableData = data.data;
		} else if (data.results && Array.isArray(data.results)) {
			tableData = data.results;
		}
	} else if (toolName === 'Google Trends Scraper FAST') {
		if (Array.isArray(data)) {
			tableData = data;
		} else if (data.n8nResponse && Array.isArray(data.n8nResponse)) {
			tableData = data.n8nResponse;
		} else if (data.data && Array.isArray(data.data)) {
			tableData = data.data;
		} else if (data.results && Array.isArray(data.results)) {
			tableData = data.results;
		}
	}

	// Add row keys
	tableData = tableData.map((item, index) => ({ ...item, key: index }));

	if (tableData.length > 0) {
		const sampleItem = tableData[0];
		const keys = Object.keys(sampleItem);
		// Columns to hide for Google Maps Scraper
		const hiddenColumns = toolName === 'Google Maps Scraper'
			? [
				'postalCode',
				'isAdvertisement',
				'claimThisBusiness',
				'permanentlyClosed',
				'temporarilyClosed',
				'Postal Code',
				'Is Advertisement',
				'Claim This Business',
				'Permanently Closed',
				'Temporarily Closed',
				'Hotel Ads',
				'Google Food Url',
				'Gas Prices',
				'hotelAds',
				'googleFoodUrl',
				'gasPrices',
				'Image Categories',
				'People Also Search',
				'Places Tags',
				'Reviews Tags',
				'imageCategories',
				'peopleAlsoSearch',
				'placesTags',
				'reviewsTags',
			]
			: [];
		columns = keys
			.filter(key => !hiddenColumns.includes(key))
			.map(key => {
				const header = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
				// Width based only on header length
				const width = Math.max(80, Math.min(header.length * 40, 400));
				let allNumbers = true;
				for (const row of tableData.slice(0, 10)) {
					let val = row[key];
					let strVal;
					if (typeof val === 'object' && val !== null) {
						allNumbers = false;
					} else if (typeof val === 'number') {
						strVal = val.toString();
					} else if (val == null) {
						strVal = '';
					} else {
						strVal = val.toString();
						if (isNaN(Number(strVal)) || strVal.trim() === '') allNumbers = false;
					}
				}
				return {
					title: header,
					dataIndex: key,
					key: key,
					width,
					align: allNumbers ? 'right' : 'left',
					render: (text) => {
						if (typeof text === 'object' && text !== null) {
							return <pre style={{ fontSize: '12px', margin: 0, maxHeight: 80, overflow: 'auto', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{JSON.stringify(text, null, 2)}</pre>;
						}
						return (
							<Tooltip title={text} placement="topLeft">
								<div className="clamp-2-lines">{text}</div>
							</Tooltip>
						);
					},
				};
			});
	}

	return { columns, dataSource: tableData };
};

const getNowISOString = () => new Date().toISOString();

// Function to extract profile name from URL
const extractProfileName = (url) => {
	if (!url) return '';

	// Remove leading/trailing whitespace
	const trimmedUrl = url.trim();

	// Facebook: https://www.facebook.com/Cristiano -> Cristiano
	if (trimmedUrl.includes('facebook.com/')) {
		const match = trimmedUrl.match(/facebook\.com\/([^\/\?]+)/);
		return match ? match[1] : trimmedUrl;
	}

	// Instagram: https://www.instagram.com/cristiano/ -> cristiano
	if (trimmedUrl.includes('instagram.com/')) {
		const match = trimmedUrl.match(/instagram\.com\/([^\/\?]+)/);
		return match ? match[1] : trimmedUrl;
	}

	// TikTok: https://www.tiktok.com/@cristianoronaldocr7_off -> cristianoronaldocr7_off
	if (trimmedUrl.includes('tiktok.com/@')) {
		const match = trimmedUrl.match(/tiktok\.com\/@([^\/\?]+)/);
		return match ? match[1] : trimmedUrl;
	}

	// If no URL pattern matches, return as is (might be just a profile name)
	return trimmedUrl;
};

const TOOL_NAME_MAP = {
	'Facebook Post': 'Facebook Post',
	'Google Maps Scraper': 'Google Maps Scraper',
	'Social Media Sentiment Analysis Tool': 'Social Media Sentiment Analysis Tool',
	'Google Trends Scraper FAST': 'Google Trends Scraper FAST',
};

const APIFY_TOOL_GROUP_SETTING_TYPE = 'ApifyToolGroup';
const DEFAULT_GROUPS = ['Khác'];

// Country options for select boxes
const COUNTRY_OPTIONS = [
	{ label: 'Vietnam', value: 'VN' },
	{ label: 'United States', value: 'US' },
	{ label: 'Japan', value: 'JP' },
	{ label: 'South Korea', value: 'KR' },
	{ label: 'France', value: 'FR' },
	{ label: 'Germany', value: 'DE' },
	{ label: 'United Kingdom', value: 'GB' },
	{ label: 'Thailand', value: 'TH' },
	{ label: 'Singapore', value: 'SG' },
	{ label: 'Australia', value: 'AU' },
	{ label: 'Canada', value: 'CA' },
	// Add more as needed
];

const TRENDING_TIMEFRAME_OPTIONS = [
	{ label: '4 tiếng qua', value: '4' },
	{ label: '24 tiếng qua', value: '24' },
	{ label: '48 tiếng qua', value: '48' },
	{ label: '7 ngày qua', value: '168' },
];

const PREDEFINED_TIMEFRAME_OPTIONS = [
	{ label: '1 tiếng qua', value: 'now 1-h' },
	{ label: '4 tiếng qua', value: 'now 4-h' },
	{ label: '1 ngày qua', value: 'now 1-d' },
	{ label: '7 ngày qua', value: 'now 7-d' },
	{ label: '30 ngày qua', value: 'today 1-m' },
	{ label: '90 ngày qua', value: 'today 3-m' },
	{ label: '12 tháng qua', value: 'today 12-m' },
	{ label: '5 năm qua', value: 'today 5-y' },
	{ label: '2004 - hiện tại', value: 'all' },
];

// Helper to flatten objects for CSV columns
function flattenObject(obj, prefix = '') {
	let res = {};
	for (const key in obj) {
		if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
		const value = obj[key];
		const newKey = prefix ? `${prefix}.${key}` : key;
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			Object.assign(res, flattenObject(value, newKey));
		} else {
			res[newKey] = value;
		}
	}
	return res;
}

// Helper to convert array of objects to CSV with custom columns and UTF-8 BOM, flattening objects and removing 'key' column
function jsonToCsvWithColumns(items, columns) {
	if (!items.length || !columns.length) return '';
	// Remove 'key' column
	const filteredColumns = columns.filter(col => col.dataIndex !== 'key');
	const header = filteredColumns.map(col => col.title);
	const keys = filteredColumns.map(col => col.dataIndex);
	const replacer = (key, value) => value === null || value === undefined ? '' : value;
	const csv = [
		header.join(','),
		...items.map(row => {
			const flat = flattenObject(row);
			return keys.map(fieldName => JSON.stringify(flat[fieldName], replacer)).join(',');
		})
	].join('\r\n');
	// Add UTF-8 BOM for Excel compatibility and Vietnamese
	return '\uFEFF' + csv;
}

function formatCellValue(value) {
	if (value === null || value === undefined) return '';
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
	if (Array.isArray(value)) {
		// If array of primitives, join; if array of objects, join summaries
		if (value.length && typeof value[0] === 'object') {
			return value.map(v => JSON.stringify(v)).join('; ');
		}
		return value.join('; ');
	}
	if (typeof value === 'object') {
		// For objects, show a compact JSON string
		return JSON.stringify(value);
	}
	return value;
}

function logsToCsvWithCreateTime(logs) {
	let rows = [];
	let allColumns = new Set();
	logs.forEach(({ log }) => {
		const createTime = log.create_at;
		const resp = log.response;
		if (Array.isArray(resp)) {
			resp.forEach(item => {
				rows.push({ create_at: createTime, ...item });
				Object.keys(item).forEach(k => allColumns.add(k));
			});
		} else if (resp && typeof resp === 'object') {
			rows.push({ create_at: createTime, ...resp });
			Object.keys(resp).forEach(k => allColumns.add(k));
		}
	});
	if (!rows.length) return '';
	// Remove 'key' column if present
	allColumns.delete('key');
	const columns = ['create_at', ...Array.from(allColumns)];
	const header = ['Thời gian tạo', ...Array.from(allColumns)];
	const csv = [
		header.join(','),
		...rows.map(row => columns.map(fieldName => {
			const val = row[fieldName];
			let formatted = formatCellValue(val);
			if (typeof formatted === 'string' && (formatted.includes(',') || formatted.includes('\n') || formatted.includes('"'))) {
				formatted = '"' + formatted.replace(/"/g, '""') + '"';
			}
			return formatted;
		}).join(','))
	].join('\r\n');
	return '\uFEFF' + csv;
}

export default function Apify() {
	const navigate = useNavigate();
	const [selectedTool, setSelectedTool] = useState();
	const [facebookUrls, setFacebookUrls] = useState(['']);
	const [soLuong, setSoLuong] = useState('');
	const [loading, setLoading] = useState(false);
	const [responseData, setResponseData] = useState(null);
	const [googleLocationQuery, setGoogleLocationQuery] = useState('');
	const [googleMaxCrawled, setGoogleMaxCrawled] = useState('');
	const [googleSearchStrings, setGoogleSearchStrings] = useState('');
	const [smFacebookProfile, setSmFacebookProfile] = useState('');
	const [smInstagramProfile, setSmInstagramProfile] = useState('');
	const [smTiktokProfile, setSmTiktokProfile] = useState('');
	const [smLatestComments, setSmLatestComments] = useState('');
	const [smLatestPosts, setSmLatestPosts] = useState('');
	const [trendsGeo, setTrendsGeo] = useState('');
	const [trendsKeyword, setTrendsKeyword] = useState('');
	const [trendsPredefinedTimeframe, setTrendsPredefinedTimeframe] = useState('');
	const [trendsCountry, setTrendsCountry] = useState('');
	const [trendsTimeframe, setTrendsTimeframe] = useState('');
	const [trendsEnableKeywordSearch, setTrendsEnableKeywordSearch] = useState(false);
	const { currentUser } = useContext(MyContext);

	const [historyModalOpen, setHistoryModalOpen] = useState(false);
	const [historyViewMode, setHistoryViewMode] = useState('tool');
	const [logsByTool, setLogsByTool] = useState({});
	const [logsByTime, setLogsByTime] = useState({});
	const [logsLoading, setLogsLoading] = useState(false);

	const [groups, setGroups] = useState(DEFAULT_GROUPS);
	const [selectedGroup, setSelectedGroup] = useState(DEFAULT_GROUPS[0]);
	const [groupSettingId, setGroupSettingId] = useState(null);
	const [groupLoading, setGroupLoading] = useState(false);
	const [addGroupModalOpen, setAddGroupModalOpen] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');

	const [responseViewMode, setResponseViewMode] = useState({});
	const [historyResponseViewMode, setHistoryResponseViewMode] = useState({});

	const [analyzingLogIds, setAnalyzingLogIds] = useState([]);
	const [selectedHistoryTabs, setSelectedHistoryTabs] = useState([]);
	const [analyzeInputs, setAnalyzeInputs] = useState({});
	const [analyzeResults, setAnalyzeResults] = useState({});

	const [multiAnalyzeInput, setMultiAnalyzeInput] = useState('Báo cáo đánh giá đoạn dữ liệu sau');
	const [multiAnalyzeLoading, setMultiAnalyzeLoading] = useState(false);
	const [multiAnalyzeResult, setMultiAnalyzeResult] = useState(null);

	const handleAddFacebookUrl = () => {
		setFacebookUrls([...facebookUrls, '']);
	};

	const handleRemoveFacebookUrl = (index) => {
		if (facebookUrls.length === 1) return;
		setFacebookUrls(facebookUrls.filter((_, i) => i !== index));
	};

	const handleChangeFacebookUrl = (index, value) => {
		const newUrls = [...facebookUrls];
		newUrls[index] = value;
		setFacebookUrls(newUrls);
	};

	const handleSaveFacebookPost = async () => {
		const validUrls = facebookUrls.map(url => url.trim()).filter(Boolean);
		if (validUrls.length === 0) {
			message.error('Vui lòng nhập ít nhất một Facebook URL!');
			return;
		}
		setLoading(true);
		setResponseData(null);
		try {
			const payload = {
				captionText: false,
				startUrls: validUrls.map(url => ({ url })),
			};
			if (soLuong) payload.resultsLimit = parseInt(soLuong, 10);
			const data = await sendToN8nFacebookPostsScraper(payload);
			message.success('Gửi thành công!');
			setFacebookUrls(['']);
			setSoLuong('');
			setResponseData(data);
			await createApifyToolLog({
				group: selectedGroup,
				toolName: 'Facebook Post',
				create_at: getNowISOString(),
				user_created: currentUser?.email,
				response: data,
				user_input: {
					urls: validUrls,
					resultLimit: soLuong ? parseInt(soLuong, 10) : undefined,
				},
			});
		} catch (error) {
			message.error('Có lỗi xảy ra!');
			setResponseData({ error: error.message });
		} finally {
			setLoading(false);
		}
	};

	const handleSaveGoogleMapsScraper = async () => {
		setLoading(true);
		setResponseData(null);
		try {
			const locationQuery = googleLocationQuery || undefined;
			const maxCrawledPlacesPerSearch = googleMaxCrawled ? Number(googleMaxCrawled) : undefined;
			const searchStringsArray = googleSearchStrings ? googleSearchStrings.split(',').map(s => s.trim()).filter(Boolean) : undefined;

			if (!searchStringsArray || !Array.isArray(searchStringsArray) || searchStringsArray.length === 0) {
				message.error("Vui lòng nhập ít nhất một từ khóa tìm kiếm (searchStringsArray)!");
				setLoading(false);
				return;
			}

			const payload = {
				includeWebResults: false,
				language: "vi",
				maxImages: 0,
				maximumLeadsEnrichmentRecords: 0,
				scrapeContacts: false,
				scrapeDirectories: false,
				scrapeImageAuthors: false,
				scrapePlaceDetailPage: false,
				scrapeReviewsPersonalData: true,
				scrapeTableReservationProvider: false,
				skipClosedPlaces: false,
				searchStringsArray,
			};
			if (locationQuery) payload.locationQuery = locationQuery;
			if (maxCrawledPlacesPerSearch) payload.maxCrawledPlacesPerSearch = maxCrawledPlacesPerSearch;

			const data = await sendToN8nCrawlerGooglePlaces(payload);
			message.success('Gửi thành công!');
			setGoogleLocationQuery('');
			setGoogleMaxCrawled('');
			setGoogleSearchStrings('');
			setResponseData(data);
			await createApifyToolLog({
				group: selectedGroup,
				toolName: 'Google Maps Scraper',
				create_at: getNowISOString(),
				user_created: currentUser?.email,
				response: data,
				user_input: {
					locationQuery,
					maxCrawledPlacesPerSearch,
					searchStringsArray,
				},
			});
		} catch (error) {
			message.error('Có lỗi xảy ra!');
			setResponseData({ error: error.message });
		} finally {
			setLoading(false);
		}
	};

	const handleSaveSocialMediaSentiment = async () => {
		if (!smFacebookProfile && !smInstagramProfile && !smTiktokProfile) {
			message.error('Vui lòng nhập ít nhất một profile Facebook, Instagram hoặc TikTok!');
			return;
		}
		setLoading(true);
		setResponseData(null);
		try {
			const payload = {
				scrapeFacebook: true,
				scrapeInstagram: true,
				scrapeTiktok: true,
				sentimentAnalysis: true,
			};
			if (smFacebookProfile) payload.facebookProfileName = extractProfileName(smFacebookProfile);
			if (smInstagramProfile) payload.instagramProfileName = extractProfileName(smInstagramProfile);
			if (smTiktokProfile) payload.tiktokProfileName = extractProfileName(smTiktokProfile);
			if (smLatestComments) payload.latestComments = Number(smLatestComments);
			if (smLatestPosts) payload.latestPosts = Number(smLatestPosts);
			const data = await sendToN8nSocialMediaSentimentAnalysisTool(payload);
			message.success('Gửi thành công!');
			setSmFacebookProfile('');
			setSmInstagramProfile('');
			setSmTiktokProfile('');
			setSmLatestComments('');
			setSmLatestPosts('');
			setResponseData(data);
			await createApifyToolLog({
				group: selectedGroup,
				toolName: 'Social Media Sentiment Analysis Tool',
				create_at: getNowISOString(),
				user_created: currentUser?.email,
				response: data,
				user_input: {
					facebookProfile: smFacebookProfile ? extractProfileName(smFacebookProfile) : undefined,
					instagramProfile: smInstagramProfile ? extractProfileName(smInstagramProfile) : undefined,
					tiktokProfile: smTiktokProfile ? extractProfileName(smTiktokProfile) : undefined,
					latestComments: smLatestComments || undefined,
					latestPosts: smLatestPosts || undefined,
				},
			});
		} catch (error) {
			message.error('Có lỗi xảy ra!');
			setResponseData({ error: error.message });
		} finally {
			setLoading(false);
		}
	};

	const handleSaveGoogleTrendsFastScraper = async () => {
		setLoading(true);
		setResponseData(null);
		try {
			const payload = {
				fetchRegionalData: false,
				enableTrendingSeaches: !trendsEnableKeywordSearch,
				proxyConfiguration: {
					useApifyProxy: true
				}
			};
			if (trendsGeo) payload.geo = trendsGeo;
			if (trendsKeyword) payload.keyword = trendsKeyword;
			if (trendsPredefinedTimeframe) payload.predefinedTimeframe = trendsPredefinedTimeframe;
			if (trendsCountry) payload.trendingSearchesCountry = trendsCountry;
			if (trendsTimeframe) payload.trendingSearchesTimeframe = trendsTimeframe;

			const data = await sendToN8nGoogleTrendsFastScraper(payload);
			message.success('Gửi thành công!');
			setTrendsGeo('');
			setTrendsKeyword('');
			setTrendsPredefinedTimeframe('');
			setTrendsCountry('');
			setTrendsTimeframe('');
			setTrendsEnableKeywordSearch(false);
			setResponseData(data);
			await createApifyToolLog({
				group: selectedGroup,
				toolName: 'Google Trends Scraper FAST',
				create_at: getNowISOString(),
				user_created: currentUser?.email,
				response: data,
				user_input: {
					geo: trendsGeo || undefined,
					keyword: trendsKeyword || undefined,
					predefinedTimeframe: trendsPredefinedTimeframe || undefined,
					trendingSearchesCountry: trendsCountry || undefined,
					trendingSearchesTimeframe: trendsTimeframe || undefined,
					enableTrendingSeaches: !trendsEnableKeywordSearch,
				},
			});
		} catch (error) {
			message.error('Có lỗi xảy ra!');
			setResponseData({ error: error.message });
		} finally {
			setLoading(false);
		}
	};

	const fetchLogs = async () => {
		setLogsLoading(true);
		try {
			const allLogs = await getAllApifyToolLog();
			console.log('DEBUG allLogs:', allLogs);
			const filteredLogs = allLogs.filter(log => log.group === selectedGroup);
			const grouped = {};
			filteredLogs.forEach(log => {
				if (!grouped[log.toolName]) grouped[log.toolName] = [];
				grouped[log.toolName].push(log);
			});
			console.log('DEBUG logsByTool:', grouped);
			setLogsByTool(grouped);

			// Group by created_at (date+time string)
			const groupedByTime = {};
			filteredLogs.forEach(log => {
				const timeKey = new Date(log.create_at).toLocaleString('vi-VN');
				if (!groupedByTime[timeKey]) groupedByTime[timeKey] = [];
				groupedByTime[timeKey].push(log);
			});
			console.log('DEBUG logsByTime:', groupedByTime);
			setLogsByTime(groupedByTime);
		} catch (e) {
			message.error('Không thể tải lịch sử!');
		} finally {
			setLogsLoading(false);
		}
	};

	const handleOpenHistory = () => {
		setHistoryModalOpen(true);
		fetchLogs();
	};

	const handleCloseHistory = () => {
		setHistoryModalOpen(false);
	};

	const fetchGroups = async () => {
		setGroupLoading(true);
		try {
			let data = await getSettingByType(APIFY_TOOL_GROUP_SETTING_TYPE);
			if (!data) {
				data = await createSetting({ type: APIFY_TOOL_GROUP_SETTING_TYPE, setting: DEFAULT_GROUPS });
			}
			setGroups(data.setting);
			setGroupSettingId(data.id);
			setSelectedGroup(data.setting[0]);
		} catch (e) {
			message.error('Không thể tải nhóm công cụ!');
		} finally {
			setGroupLoading(false);
		}
	};

	useEffect(() => {
		fetchGroups();
	}, []);

	const handleAddGroup = async () => {
		if (!newGroupName.trim()) {
			message.error('Tên nhóm không được để trống!');
			return;
		}
		if (groups.includes(newGroupName.trim())) {
			message.error('Nhóm đã tồn tại!');
			return;
		}
		const updatedGroups = [...groups, newGroupName.trim()];
		try {
			await updateSetting({ id: groupSettingId, type: APIFY_TOOL_GROUP_SETTING_TYPE, setting: updatedGroups });
			setGroups(updatedGroups);
			setSelectedGroup(newGroupName.trim());
			setAddGroupModalOpen(false);
			setNewGroupName('');
			message.success('Đã thêm nhóm mới!');
		} catch (e) {
			message.error('Không thể thêm nhóm!');
		}
	};

	useEffect(() => {
		if (historyModalOpen) {
			fetchLogs();
		}
	}, [selectedGroup]);

	const handleToggleResponseView = (toolKey) => {
		setResponseViewMode(prev => ({
			...prev,
			[toolKey]: prev[toolKey] === 'json' ? 'table' : 'json',
		}));
	};

	const handleToggleHistoryResponseView = (logId) => {
		setHistoryResponseViewMode(prev => ({
			...prev,
			[logId]: prev[logId] === 'json' ? 'table' : 'json',
		}));
	};

	useEffect(() => {
		if (!logsLoading && historyModalOpen) {
			const newViewMode = {};
			Object.keys(logsByTool).forEach(toolName => {
				const logs = logsByTool[toolName] || [];
				logs.forEach(log => {
					const { columns, dataSource } = formatResponseForTable(log.response, log.toolName);
					if (columns.length > 0 && dataSource.length > 0) {
						newViewMode[log.id] = 'table';
					} else {
						newViewMode[log.id] = 'json';
					}
				});
			});
			setHistoryResponseViewMode(newViewMode);
		}
	}, [logsByTool, logsLoading, historyModalOpen]);

	const handleAnalyzeLog = async (log) => {
		setAnalyzingLogIds(prev => [...prev, log.id]);
		const systemMsg = analyzeInputs[log.id] || 'Báo cáo đánh giá đoạn dữ liệu sau';
		try {
			const res = await aiGen(
				JSON.stringify(log.response),
				systemMsg,
				'claude-3-5-haiku-20241022'
			);
			setAnalyzeResults(prev => ({ ...prev, [log.id]: res }));
			console.log('AI Gen response:', res);
		} catch (e) {
			console.error('AI Gen error:', e);
			setAnalyzeResults(prev => ({ ...prev, [log.id]: 'Lỗi khi phân tích!' }));
		} finally {
			setAnalyzingLogIds(prev => prev.filter(id => id !== log.id));
		}
	};

	// Helper to get log by id
	const getLogById = (toolName, timeKey, logId) => {
		console.log('DEBUG getLogById args:', { toolName, timeKey, logId });
		const logs = logsByTool[toolName] || [];
		const logsByTime = {};
		logs.forEach(log => {
			const tKey = new Date(log.create_at).toLocaleString('vi-VN');
			if (!logsByTime[tKey]) logsByTime[tKey] = [];
			logsByTime[tKey].push(log);
		});
		console.log('DEBUG getLogById logsByTime:', logsByTime);
		const found = (logsByTime[timeKey] || []).find(log => log.id === logId);
		console.log('DEBUG getLogById found:', found);
		return found;
	};

	// Handler for checkbox change
	const handleHistoryTabCheckbox = (toolName, timeKey, logId, checked) => {
		setSelectedHistoryTabs(prev => {
			let next;
			const key = `${toolName}|||${timeKey}|||${logId}`;
			if (checked) {
				next = [...prev, key];
			} else {
				next = prev.filter(k => k !== key);
			}
			// Fetch and log responses for all selected logs
			Promise.all(
				next.map(async k => {
					const [ , , id ] = k.split('|||');
					try {
						const log = await getApifyToolLogById(id);
						return log ? log.response : undefined;
					} catch (e) {
						console.error('Error fetching log by id:', id, e);
						return undefined;
					}
				})
			).then(responses => {
				console.log('Selected tab responses:', responses.filter(Boolean));
			});
			return next;
		});
	};

	// Export selected responses to Excel
	const handleExportSelectedToExcel = async () => {
		// Get all selected log ids and toolNames
		const selected = selectedHistoryTabs.map(k => {
			const [tool, , id] = k.split('|||');
			return { tool, id };
		});
		const logs = await Promise.all(selected.map(async ({ tool, id }) => {
			try {
				const log = await getApifyToolLogById(id);
				return log ? { tool, log } : undefined;
			} catch (e) {
				return undefined;
			}
		}));
		const filtered = logs.filter(Boolean);
		if (!filtered.length) {
			message.warning('Không có dữ liệu để xuất!');
			return;
		}

		// Prepare rows as in logsToCsvWithCreateTime
		let rows = [];
		let allColumns = new Set();
		filtered.forEach(({ log }) => {
			const createTime = log.create_at;
			const resp = log.response;
			if (Array.isArray(resp)) {
				resp.forEach(item => {
					rows.push({ 'Thời gian tạo': createTime, ...item });
					Object.keys(item).forEach(k => allColumns.add(k));
				});
			} else if (resp && typeof resp === 'object') {
				rows.push({ 'Thời gian tạo': createTime, ...resp });
				Object.keys(resp).forEach(k => allColumns.add(k));
			}
		});
		if (!rows.length) {
			message.warning('Không có dữ liệu để xuất!');
			return;
		}
		allColumns.delete('key');
		const columns = ['Thời gian tạo', ...Array.from(allColumns)];

		// Format rows for Excel
		const excelRows = rows.map(row => {
			const formatted = {};
			columns.forEach(col => {
				formatted[col] = formatCellValue(row[col]);
			});
			return formatted;
		});

		// Create worksheet and workbook
		const ws = XLSX.utils.json_to_sheet(excelRows, { header: columns });
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Data');

		// Write to file and trigger download
		const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
		saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'apify_selected_responses.xlsx');
	};

	// Multi-analyze handler
	const handleMultiAnalyze = async () => {
		setMultiAnalyzeLoading(true);
		setMultiAnalyzeResult(null);
		try {
			// Get all selected log ids
			const selected = selectedHistoryTabs.map(k => {
				const [ , , id ] = k.split('|||');
				return id;
			});
			// Fetch all selected logs
			const logs = await Promise.all(selected.map(async id => {
				try {
					const log = await getApifyToolLogById(id);
					return log ? log.response : undefined;
				} catch (e) {
					return undefined;
				}
			}));
			const responses = logs.filter(Boolean);
			console.log('Multi-analyze input:', responses);
			const res = await aiGen(
				JSON.stringify(responses),
				multiAnalyzeInput || 'Báo cáo đánh giá đoạn dữ liệu sau',
				'claude-3-5-haiku-20241022'
			);
			console.log('Multi-analyze result:', res);
			setMultiAnalyzeResult(res);
		} catch (e) {
			console.error('Multi-analyze error:', e);
			setMultiAnalyzeResult('Lỗi khi phân tích!');
		} finally {
			setMultiAnalyzeLoading(false);
		}
	};

	return (
		<div style={{ padding: 24 }}>
			<div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
				<Button onClick={() => navigate('/dashboard')} style={{ marginRight: 16 }}>Quay lại</Button>
				<Tabs
					activeKey={selectedGroup}
					onChange={setSelectedGroup}
					items={groups.map(group => ({
						label: group,
						key: group,
					}))}
					type="card"
				/>
				<Button onClick={() => setAddGroupModalOpen(true)}>+ Thêm nhóm</Button>
			</div>
			<div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
				<Typography.Title level={4} style={{ margin: 0 }}>Select a Tool</Typography.Title>
				<Button onClick={handleOpenHistory}>Lịch sử</Button>
			</div>
			<Select
				style={{ width: 320 }}
				placeholder="Choose a tool..."
				value={selectedTool}
				onChange={setSelectedTool}
				options={TOOL_OPTIONS}
				allowClear
			/>

			{selectedTool === 'facebook_post' && (
				<div style={{ marginTop: 24, maxWidth: 400 }}>
					<Typography.Text strong>Facebook URL(s)</Typography.Text>
					{facebookUrls.map((url, idx) => (
						<div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
							<Input
								placeholder={`Facebook URL #${idx + 1}`}
								value={url}
								onChange={e => handleChangeFacebookUrl(idx, e.target.value)}
								style={{ flex: 1, marginRight: 8 }}
							/>
							<Button danger disabled={facebookUrls.length === 1} onClick={() => handleRemoveFacebookUrl(idx)}>-</Button>
						</div>
					))}
					<Button onClick={handleAddFacebookUrl} style={{ marginBottom: 12 }}>+ Thêm URL</Button>
					<Input
						placeholder="Số lượng (tuỳ chọn)"
						type="number"
						value={soLuong}
						onChange={e => setSoLuong(e.target.value)}
						style={{ marginBottom: 12 }}
					/>
					<Button type="primary" onClick={handleSaveFacebookPost} loading={loading}>
						Lưu
					</Button>
				</div>
			)}
			{selectedTool === 'facebook_post' && responseData && (
				<div style={{ marginTop: 24 }}>
					<Typography.Text strong>Kết quả phản hồi:</Typography.Text>
					<Button size="small" style={{ marginLeft: 12, marginBottom: 8 }} onClick={() => handleToggleResponseView('facebook_post')}>
						{responseViewMode['facebook_post'] === 'json' ? 'Xem dạng bảng' : 'Xem dạng JSON'}
					</Button>
					<style>{`
						.custom-apify-table .ant-table-container {
							border-radius: 8px;
							overflow: hidden;
						}
						.custom-apify-table .ant-table-thead > tr > th {
							background: #f0f2f5;
							font-weight: 600;
						}
						.custom-apify-table .ant-table-tbody > tr:hover > td {
							background: #e6f7ff;
						}
					`}</style>
					{(() => {
						const toolName = 'Facebook Post';
						const { columns, dataSource } = formatResponseForTable(responseData, toolName);
						if (responseViewMode['facebook_post'] === 'json') {
							return (
								<pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
									{JSON.stringify(responseData, null, 2)}
								</pre>
							);
						} else if (columns.length > 0 && dataSource.length > 0) {
							return <Table bordered className="custom-apify-table" columns={columns} dataSource={dataSource} pagination={{ pageSize: 10 }} scroll={{ x: true, y: 300 }} style={{ marginTop: 8 }} />;
						} else {
							return (
								<pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
									{JSON.stringify(responseData, null, 2)}
								</pre>
							);
						}
					})()}
				</div>
			)}
			{selectedTool === 'google_maps_scraper' && (
				<div style={{ marginTop: 24, maxWidth: 400 }}>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>Khu vực</Typography.Text>
						<Input
							placeholder="Nhập khu vực"
							value={googleLocationQuery}
							onChange={e => setGoogleLocationQuery(e.target.value)}
						/>
					</div>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>Số lượng địa điểm</Typography.Text>
						<Input
							placeholder="Nhập số lượng địa điểm"
							type="number"
							value={googleMaxCrawled}
							onChange={e => setGoogleMaxCrawled(e.target.value)}
						/>
					</div>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>Từ khoá tìm kiếm</Typography.Text>
						<Input
							placeholder="Nhập từ khoá, cách nhau bởi dấu phẩy"
							value={googleSearchStrings}
							onChange={e => setGoogleSearchStrings(e.target.value)}
						/>
					</div>
					<Button type="primary" onClick={handleSaveGoogleMapsScraper} loading={loading}>
						Lưu
					</Button>
				</div>
			)}
			{selectedTool === 'google_maps_scraper' && responseData && (
				<div style={{ marginTop: 24 }}>
					<Typography.Text strong>Kết quả phản hồi (đã ẩn một số cột):</Typography.Text>
					<Button size="small" style={{ marginLeft: 12, marginBottom: 8 }} onClick={() => handleToggleResponseView('google_maps_scraper')}>
						{responseViewMode['google_maps_scraper'] === 'json' ? 'Xem dạng bảng' : 'Xem dạng JSON'}
					</Button>
					<style>{`
						.custom-apify-table .ant-table-container {
							border-radius: 8px;
							overflow: hidden;
						}
						.custom-apify-table .ant-table-thead > tr > th {
							background: #f0f2f5;
							font-weight: 600;
						}
						.custom-apify-table .ant-table-tbody > tr:hover > td {
							background: #e6f7ff;
						}
					`}</style>
					{(() => {
						const toolName = 'Google Maps Scraper';
						const { columns, dataSource } = formatResponseForTable(responseData, toolName);
						if (responseViewMode['google_maps_scraper'] === 'json') {
							return (
								<pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
									{JSON.stringify(responseData, null, 2)}
								</pre>
							);
						} else if (columns.length > 0 && dataSource.length > 0) {
							return <Table bordered className="custom-apify-table" columns={columns} dataSource={dataSource} pagination={{ pageSize: 10 }} scroll={{ x: true, y: 300 }} style={{ marginTop: 8 }} />;
						} else {
							return (
								<pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
									{JSON.stringify(responseData, null, 2)}
								</pre>
							);
						}
					})()}
				</div>
			)}
			{selectedTool === 'sentiment_analysis' && (
				<div style={{ marginTop: 24, maxWidth: 400 }}>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>Facebook profile</Typography.Text>
						<Input
							placeholder="Nhập Facebook profile (tùy chọn)"
							value={smFacebookProfile}
							onChange={e => setSmFacebookProfile(e.target.value)}
						/>
					</div>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>Instagram profile</Typography.Text>
						<Input
							placeholder="Nhập Instagram profile (tùy chọn)"
							value={smInstagramProfile}
							onChange={e => setSmInstagramProfile(e.target.value)}
						/>
					</div>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>TikTok profile</Typography.Text>
						<Input
							placeholder="Nhập TikTok profile (tùy chọn)"
							value={smTiktokProfile}
							onChange={e => setSmTiktokProfile(e.target.value)}
						/>
					</div>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>Số lượng bình luận gần nhất (tuỳ chọn)</Typography.Text>
						<Input
							placeholder="10"
							type="number"
							value={smLatestComments}
							onChange={e => setSmLatestComments(e.target.value)}
						/>
					</div>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>Số lượng bài viết gần nhất(tuỳ chọn)</Typography.Text>
						<Input
							placeholder="50"
							type="number"
							value={smLatestPosts}
							onChange={e => setSmLatestPosts(e.target.value)}
						/>
					</div>
					<Button type="primary" onClick={handleSaveSocialMediaSentiment} loading={loading}>
						Lưu
					</Button>
				</div>
			)}
			{selectedTool === 'sentiment_analysis' && responseData && (
				<div style={{ marginTop: 24 }}>
					<Typography.Text strong>Kết quả phản hồi:</Typography.Text>
					<Button size="small" style={{ marginLeft: 12, marginBottom: 8 }} onClick={() => handleToggleResponseView('sentiment_analysis')}>
						{responseViewMode['sentiment_analysis'] === 'json' ? 'Xem dạng bảng' : 'Xem dạng JSON'}
					</Button>
					<style>{`
						.custom-apify-table .ant-table-container {
							border-radius: 8px;
							overflow: hidden;
						}
						.custom-apify-table .ant-table-thead > tr > th {
							background: #f0f2f5;
							font-weight: 600;
						}
						.custom-apify-table .ant-table-tbody > tr:hover > td {
							background: #e6f7ff;
						}
					`}</style>
					{(() => {
						const toolName = 'Social Media Sentiment Analysis Tool';
						const { columns, dataSource } = formatResponseForTable(responseData, toolName);
						if (responseViewMode['sentiment_analysis'] === 'json') {
							return (
								<pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
									{JSON.stringify(responseData, null, 2)}
								</pre>
							);
						} else if (columns.length > 0 && dataSource.length > 0) {
							return <Table bordered className="custom-apify-table" columns={columns} dataSource={dataSource} pagination={{ pageSize: 10 }} scroll={{ x: true, y: 300 }} style={{ marginTop: 8 }} />;
						} else {
							return (
								<pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
									{JSON.stringify(responseData, null, 2)}
								</pre>
							);
						}
					})()}
				</div>
			)}
			{selectedTool === 'google_trends_scraper_fast' && (
				<div style={{ marginTop: 24, maxWidth: 400 }}>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>Quốc gia cho tìm kiếm thịnh hành</Typography.Text>
						<Select
							showSearch
							placeholder="Chọn quốc gia"
							value={trendsCountry || undefined}
							onChange={setTrendsCountry}
							options={COUNTRY_OPTIONS}
							style={{ width: '100%' }}
							allowClear
						/>
					</div>
					<div style={{ marginBottom: 12 }}>
						<Typography.Text strong>Thời gian tìm kiếm thịnh hành</Typography.Text>
						<Select
							placeholder="Chọn thời gian"
							value={trendsTimeframe || undefined}
							onChange={setTrendsTimeframe}
							options={TRENDING_TIMEFRAME_OPTIONS}
							style={{ width: '100%' }}
							allowClear
						/>
					</div>
					<div style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
						<Switch checked={trendsEnableKeywordSearch} onChange={setTrendsEnableKeywordSearch} style={{ marginRight: 8 }} />
						<Typography.Text strong>Tìm kiếm theo từ khoá</Typography.Text>
					</div>
					{trendsEnableKeywordSearch && (
						<>
							<div style={{ marginBottom: 12 }}>
								<Typography.Text strong>Khu vực địa lý</Typography.Text>
								<Select
									showSearch
									placeholder="Chọn quốc gia"
									value={trendsGeo || undefined}
									onChange={setTrendsGeo}
									options={COUNTRY_OPTIONS}
									style={{ width: '100%' }}
									allowClear
								/>
							</div>
							<div style={{ marginBottom: 12 }}>
								<Typography.Text strong>Từ khóa tìm kiếm</Typography.Text>
								<Input
									placeholder="Nhập Từ khóa tìm kiếm (tuỳ chọn)"
									value={trendsKeyword}
									onChange={e => setTrendsKeyword(e.target.value)}
								/>
							</div>
							<div style={{ marginBottom: 12 }}>
								<Typography.Text strong>Khoảng thời gian</Typography.Text>
								<Select
									placeholder="Chọn khoảng thời gian"
									value={trendsPredefinedTimeframe || undefined}
									onChange={setTrendsPredefinedTimeframe}
									options={PREDEFINED_TIMEFRAME_OPTIONS}
									style={{ width: '100%' }}
									allowClear
								/>
							</div>
						</>
					)}
					<Button type="primary" onClick={handleSaveGoogleTrendsFastScraper} loading={loading}>
						Lưu
					</Button>
				</div>
			)}
			{selectedTool === 'google_trends_scraper_fast' && responseData && (
				<div style={{ marginTop: 24 }}>
					<Typography.Text strong>Kết quả phản hồi:</Typography.Text>
					<Button size="small" style={{ marginLeft: 12, marginBottom: 8 }} onClick={() => handleToggleResponseView('google_trends_scraper_fast')}>
						{responseViewMode['google_trends_scraper_fast'] === 'json' ? 'Xem dạng bảng' : 'Xem dạng JSON'}
					</Button>
					<style>{`
						.custom-apify-table .ant-table-container {
							border-radius: 8px;
							overflow: hidden;
						}
						.custom-apify-table .ant-table-thead > tr > th {
							background: #f0f2f5;
							font-weight: 600;
						}
						.custom-apify-table .ant-table-tbody > tr:hover > td {
							background: #e6f7ff;
						}
					`}</style>
					{(() => {
						const toolName = 'Google Trends Scraper FAST';
						const { columns, dataSource } = formatResponseForTable(responseData, toolName);
						if (responseViewMode['google_trends_scraper_fast'] === 'json') {
							return (
								<pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
									{JSON.stringify(responseData, null, 2)}
								</pre>
							);
						} else if (columns.length > 0 && dataSource.length > 0) {
							return <Table bordered className="custom-apify-table" columns={columns} dataSource={dataSource} pagination={{ pageSize: 10 }} scroll={{ x: true, y: 300 }} style={{ marginTop: 8 }} />;
						} else {
							return (
								<pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, marginTop: 8, maxHeight: 300, overflow: 'auto' }}>
									{JSON.stringify(responseData, null, 2)}
								</pre>
							);
						}
					})()}
				</div>
			)}
			<Modal
				title="Thêm nhóm công cụ Apify"
				open={addGroupModalOpen}
				onCancel={() => setAddGroupModalOpen(false)}
				onOk={handleAddGroup}
				okText="Thêm"
				cancelText="Hủy"
			>
				<Input
					placeholder="Nhập tên nhóm mới"
					value={newGroupName}
					onChange={e => setNewGroupName(e.target.value)}
					onPressEnter={handleAddGroup}
				/>
			</Modal>
			<Modal
				title="Lịch sử sử dụng công cụ Apify"
				open={historyModalOpen}
				onCancel={handleCloseHistory}
				footer={null}
				width={3100}
			>
				{/* {selectedHistoryTabs.length > 1 && (
					<div style={{ margin: '16px 0', padding: 12, background: '#f6f6f6', borderRadius: 4 }}>
						<Input
							style={{ width: 400, marginRight: 8 }}
							placeholder="System message cho AI"
							value={multiAnalyzeInput}
							onChange={e => setMultiAnalyzeInput(e.target.value)}
						/>
						<Button
							type="primary"
							loading={multiAnalyzeLoading}
							disabled={multiAnalyzeLoading}
							onClick={handleMultiAnalyze}
						>
							Phân tích các thông tin đã chọn
						</Button>
						{multiAnalyzeResult && (
							<div style={{ marginTop: 8, background: '#fffbe6', padding: 8, borderRadius: 4 }}>
								<Typography.Text strong>Kết quả AI:</Typography.Text>
								<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
									{multiAnalyzeResult && typeof multiAnalyzeResult === 'object' && 'result' in multiAnalyzeResult
										? multiAnalyzeResult.result
										: (typeof multiAnalyzeResult === 'object'
											? JSON.stringify(multiAnalyzeResult, null, 2)
											: multiAnalyzeResult)}
								</pre>
							</div>
						)}
					</div>
				)} */}
				{logsLoading ? (
					<Typography.Text>Đang tải...</Typography.Text>
				) : (
					<Tabs
						type="card"
						items={Object.keys(TOOL_NAME_MAP).map(toolName => {
							const logs = logsByTool[toolName] || [];
							// Group logs by time string for this tool
							const logsByTime = {};
							logs.forEach(log => {
								const timeKey = new Date(log.create_at).toLocaleString('vi-VN');
								if (!logsByTime[timeKey]) logsByTime[timeKey] = [];
								logsByTime[timeKey].push(log);
							});
							return {
								label: TOOL_NAME_MAP[toolName],
								key: toolName,
								children: (
									<Tabs
										type="card"
										tabPosition="left"
										items={Object.keys(logsByTime).sort((a, b) => new Date(b) - new Date(a)).map(timeKey => ({
											label: (
												<span style={{ display: 'flex', alignItems: 'center' }}>
													{/* Checkbox for all logs in this timeKey */}
													<input
														type="checkbox"
														style={{ marginRight: 8 }}
														onChange={e => {
															const checked = e.target.checked;
															const logs = logsByTime[timeKey] || [];
															logs.forEach(log => {
																handleHistoryTabCheckbox(toolName, timeKey, log.id, checked);
															});
														}}
														checked={(logsByTime[timeKey] || []).every(log => selectedHistoryTabs.includes(`${toolName}|||${timeKey}|||${log.id}`)) && (logsByTime[timeKey] || []).length > 0}
														indeterminate={(logsByTime[timeKey] || []).some(log => selectedHistoryTabs.includes(`${toolName}|||${timeKey}|||${log.id}`)) && !(logsByTime[timeKey] || []).every(log => selectedHistoryTabs.includes(`${toolName}|||${timeKey}|||${log.id}`))}
													/>
													{timeKey}
												</span>
											),
											key: timeKey,
											children: (
												<div>
													{logsByTime[timeKey].map(log => (
														<div key={log.id} style={{ marginBottom: 16, padding: 12, background: '#f6f6f6', borderRadius: 4, display: 'flex', alignItems: 'flex-start' }}>
															{/* Checkbox for this log */}
															<input
																type="checkbox"
																style={{ marginRight: 8, marginTop: 4 }}
																onChange={e => handleHistoryTabCheckbox(toolName, timeKey, log.id, e.target.checked)}
																checked={selectedHistoryTabs.includes(`${toolName}|||${timeKey}|||${log.id}`)}
															/>
															<div style={{ flex: 1 }}>
																{log.user_input && (
																	<>
																		<div><Typography.Text strong>Input:</Typography.Text></div>
																		<pre style={{ background: '#fff', padding: 8, borderRadius: 4, maxHeight: 200, overflow: 'auto', marginBottom: 8 }}>{JSON.stringify(log.user_input, null, 2)}</pre>
																	</>
																)}
																<div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
																	<Typography.Text strong>Response:</Typography.Text>
																	<Button size="small" style={{ marginLeft: 12 }} onClick={() => handleToggleHistoryResponseView(log.id)}>
																		{historyResponseViewMode[log.id] === 'table' ? 'Xem dạng JSON' : 'Xem dạng bảng'}
																	</Button>
																</div>
																{(() => {
																	const { columns, dataSource } = formatResponseForTable(log.response, log.toolName);
																	if (historyResponseViewMode[log.id] === 'table' && columns.length > 0 && dataSource.length > 0) {
																		return <Table bordered className="custom-apify-table" columns={columns} dataSource={dataSource} pagination={{ pageSize: 10 }} scroll={{ x: true, y: 300 }} style={{ marginTop: 8 }} />;
																	} else {
																		return (
																			<pre style={{ background: '#fff', padding: 8, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(log.response, null, 2)}</pre>
																		);
																	}
																})()}
																{/* <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
																	<Input
																		style={{ width: 320, marginRight: 8 }}
																		placeholder="System message cho AI"
																		value={analyzeInputs[log.id] !== undefined ? analyzeInputs[log.id] : 'Báo cáo đánh giá đoạn dữ liệu sau'}
																		onChange={e => setAnalyzeInputs(prev => ({ ...prev, [log.id]: e.target.value }))}
																	/>
																	<Button
																		type="primary"
																		loading={analyzingLogIds.includes(log.id)}
																		onClick={() => handleAnalyzeLog(log)}
																	>
																		Phân tích
																	</Button>
																</div> */}
																{analyzeResults[log.id] && (
																	<div style={{ marginTop: 8, background: '#f6f6f6', padding: 8, borderRadius: 4 }}>
																		<Typography.Text strong>Kết quả AI:</Typography.Text>
																		<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
																			{analyzeResults[log.id] && typeof analyzeResults[log.id] === 'object' && 'result' in analyzeResults[log.id]
																				? analyzeResults[log.id].result
																				: (typeof analyzeResults[log.id] === 'object'
																					? JSON.stringify(analyzeResults[log.id], null, 2)
																					: analyzeResults[log.id])}
																		</pre>
																	</div>
																)}
															</div>
														</div>
													))}
												</div>
											)
										}))}
									/>
								)
							};
						})}
					/>
				)}
				{/* Show export button if more than one tab is selected */}
				{selectedHistoryTabs.length > 1 && (
					<div style={{ margin: '16px 0', padding: 12, background: '#f6f6f6', borderRadius: 4 }}>
						<Button type="primary" onClick={handleExportSelectedToExcel}>
							Xuất tất cả phản hồi đã chọn ra CSV
						</Button>
					</div>
				)}
			</Modal>
			<style>{`
			.clamp-2-lines {
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: normal;
				word-break: break-word;
			}
			`}</style>
		</div>
	);
}
