import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Input, Button, Spin, Empty, Table, Tag, Typography, Card, Divider, Modal, Checkbox, message, Select } from 'antd';
import { SearchOutlined, FileTextOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import styles from './CompanyReportTab.module.css';
import cssMarkdown from '../K9.module.css';
import { getAllCompanyReports } from '../../../apis/companyReportService.jsx';
import { ScanBarcode } from 'lucide-react';
import { getAllFinRatios } from '../../../apis/finRatioService.jsx';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { LIST_FIN_RATIO } from '../../../constain/LIST_FIN_RATIO.js';
import { getAllFinRatioNganhangs } from '../../../apis/finRatioNganhangService.jsx';
import { getAllFinRatioChungkhoans } from '../../../apis/finRatioChungkhoanService.jsx';
import { getAllFinRatioBaohiems } from '../../../apis/finRatioBaohiemService.jsx';
import { getAllCompanyInfos } from '../../../apis/companyInfoService.jsx';
import { aiGen } from '../../../apis/aiGen/botService.jsx';
import { createAISummary } from '../../../apis/aiSummaryService.jsx';
import { MyContext } from '../../../MyContext.jsx';

const { Title, Text, Paragraph } = Typography;

const CompanyReportTab = ({ aiSummaries: parentAiSummaries }) => {
	const { currentUser } = useContext(MyContext);
	const [searchTerm, setSearchTerm] = useState('');
	const [filteredReports, setFilteredReports] = useState([]);
	const [companyReportData, setCompanyReportsData] = useState([]);
	const [companyInfo, setCompanyInfo] = useState([]);
	const [finRatio, setFinRatio] = useState([]);
	const [finRatioNH, setFinRatioNH] = useState([]);
	const [finRatioCK, setFinRatioCK] = useState([]);
	const [finRatioBH, setFinRatioBH] = useState([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [hasFoundData, setHasFoundData] = useState(false);
	const [loading, setLoading] = useState(false);
	const [matchedAISummary, setMatchedAISummary] = useState(null);
	const [valuationRows, setValuationRows] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isCreatingSummary, setIsCreatingSummary] = useState(false);
	const [currentCompanySummary, setCurrentCompanySummary] = useState(null);
	const [aiSummaries, setAiSummaries] = useState([]);
	const [selectedQuarter, setSelectedQuarter] = useState(null);

	// Hàm kiểm tra xem mã CK và nguồn có AI Summary không
	const hasAISummaryForCodeAndSource = (maCK, nguon) => {
		if (!Array.isArray(aiSummaries) || !maCK || !nguon) return false;

		return aiSummaries.some((item) => {
			try {
				const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
				const itemData = info?.itemData;
				if (!itemData) return false;
				const itemMaCK = itemData['Mã CK'] || '';
				const itemNguon = itemData['Nguồn'] || '';
				return itemMaCK.toLowerCase() === maCK.toLowerCase() &&
					itemNguon.toLowerCase() === nguon.toLowerCase();
			} catch {
				return false;
			}
		});
	};

	// Hàm mở modal với AI Summary tương ứng với mã CK và nguồn
	const openAISummaryModalForSource = (maCK, nguon) => {
		if (!Array.isArray(aiSummaries) || !maCK || !nguon) return;

		const matchedList = aiSummaries.filter((item) => {
			try {
				const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
				const itemData = info?.itemData;
				if (!itemData) return false;
				const itemMaCK = itemData['Mã CK'] || '';
				const itemNguon = itemData['Nguồn'] || '';
				return itemMaCK.toLowerCase() === maCK.toLowerCase() &&
					itemNguon.toLowerCase() === nguon.toLowerCase();
			} catch {
				return false;
			}
		});

		if (matchedList.length > 0) {
			// Sắp xếp mới nhất
			matchedList.sort((a, b) => {
				const infoA = typeof a.info === 'string' ? JSON.parse(a.info) : a.info;
				const infoB = typeof b.info === 'string' ? JSON.parse(b.info) : b.info;
				const dateA = new Date(infoA?.itemData?.['Ngày công bố'] || infoA?.itemData?.['Ngày khuyến nghị'] || 0);
				const dateB = new Date(infoB?.itemData?.['Ngày công bố'] || infoB?.itemData?.['Ngày khuyến nghị'] || 0);
				return dateB - dateA;
			});
			setMatchedAISummary(matchedList[0]);
			setIsModalOpen(true);
		}
	};

	async function getData() {
		setLoading(true);
		let list = await getAllCompanyReports();
		const data = list.map((item) => item.data);
		setCompanyReportsData(data);
		let listInfo = await getAllCompanyInfos();
		const dataInfo = listInfo.map((item) => item.data);
		setCompanyInfo(dataInfo);
		let listFinRatio = await getAllFinRatios();
		const finRatioData = listFinRatio.map((item) => item.data);
		setFinRatio(finRatioData);
		let listFinRatioNH = await getAllFinRatioNganhangs();
		const finRatioDataNH = listFinRatioNH.map((item) => item.data);
		setFinRatioNH(finRatioDataNH);
		let listFinRatioCK = await getAllFinRatioChungkhoans();
		const finRatioDataCK = listFinRatioCK.map((item) => item.data);
		setFinRatioCK(finRatioDataCK);
		let listFinRatioBH = await getAllFinRatioBaohiems();
		const finRatioDataBH = listFinRatioBH.map((item) => item.data);
		setFinRatioBH(finRatioDataBH);

		// Lấy danh sách mã CK unique và khởi tạo selectedCodes
		const uniqueCodes = [...new Set(finRatioData.map(item => item['Mã CK']).filter(Boolean))];
		// setAvailableCodes(uniqueCodes); // Xoá hoàn toàn mọi phần liên quan đến chọn mã thủ công
		// setSelectedCodes(uniqueCodes.slice(0, 5)); // Mặc định chọn 5 mã đầu tiên

		setLoading(false);
	}

	// Load AI Summaries directly from API
	const loadAiSummaries = async () => {
		try {
			const { getAllAISummaries } = await import('../../../apis/aiSummaryService');
			const data = await getAllAISummaries();
			setAiSummaries(data || []);
		} catch (error) {
			console.error('Error loading AI summaries:', error);
			setAiSummaries([]);
		}
	};

	useEffect(() => {
		getData();
		loadAiSummaries();
	}, []);

	// Refresh search when aiSummaries changes
	useEffect(() => {
		if (hasSearched && searchTerm.trim()) {
			// Re-run the search logic to find new CompanySummary
			const searchLower = searchTerm.toLowerCase();
			let companySummary = null;

			if (Array.isArray(aiSummaries)) {
				const companySummaryList = aiSummaries.filter((item) => {
					try {
						const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
						return info?.sheetName === 'CompanySummary' && info?.searchTerm?.toLowerCase() === searchLower;
					} catch {
						return false;
					}
				});

				if (companySummaryList.length > 0) {
					companySummaryList.sort((a, b) => {
						const dateA = new Date(a.created_at || 0);
						const dateB = new Date(b.created_at || 0);
						return dateB - dateA;
					});
					companySummary = companySummaryList[0];
				}
			}
			setCurrentCompanySummary(companySummary);
		}
	}, [aiSummaries, hasSearched, searchTerm]);

	// Khi search, tìm AI Summary phù hợp và bảng định giá
	const filterReports = (term) => {
		if (!term.trim()) {
			setFilteredReports([]);
			setMatchedAISummary(null);
			setValuationRows([]);
			setHasSearched(false);
			setHasFoundData(false);
			setCurrentCompanySummary(null);
			return;
		}
		const searchLower = term.toLowerCase();
		// Lọc bảng định giá
		const filtered = companyReportData.filter((item) => {
			try {
				const maCK = item['Mã CK'] || '';
				return maCK.toLowerCase().includes(searchLower);
			} catch {
				return false;
			}
		});

				// Kiểm tra xem có tìm thấy dữ liệu trong tất cả các danh sách finRatio không
		const allFinRatioData = filterFinRatioData([
			...finRatio,
			...finRatioNH,
			...finRatioCK,
			...finRatioBH
		]);
		const finRatioFiltered = allFinRatioData.filter((item) => {
			try {
				const maCK = item['Mã CK'] || '';
				return maCK.toLowerCase() === searchLower;
			} catch {
				return false;
			}
		});


		// Chỉ set hasFoundData = true khi tìm thấy ít nhất một trong hai loại dữ liệu
		const foundData = filtered.length > 0 || finRatioFiltered.length > 0;
		setHasFoundData(foundData);

		// Sắp xếp mới nhất
		const sortedValuation = [...filtered].sort((a, b) => {
			const dateA = new Date(a['Ngày công bố'] || a['Ngày khuyến nghị'] || 0);
			const dateB = new Date(b['Ngày công bố'] || b['Ngày khuyến nghị'] || 0);
			return dateB - dateA;
		});
		setValuationRows(sortedValuation.slice(0, 10));
		setFilteredReports(filtered);
		// Tìm AI Summary phù hợp
		let matched = null;
		if (Array.isArray(aiSummaries)) {
			// Tìm bản ghi có mã CK trùng (ưu tiên mới nhất)
			const matchedList = aiSummaries.filter((item) => {
				try {
					const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
					const itemData = info?.itemData;
					if (!itemData) return false;
					const maCK = itemData['Mã CK'] || '';
					return maCK.toLowerCase() === searchLower;
				} catch {
					return false;
				}
			});
			if (matchedList.length > 0) {
				// Sắp xếp mới nhất
				matchedList.sort((a, b) => {
					const infoA = typeof a.info === 'string' ? JSON.parse(a.info) : a.info;
					const infoB = typeof b.info === 'string' ? JSON.parse(b.info) : b.info;
					const dateA = new Date(infoA?.itemData?.['Ngày công bố'] || infoA?.itemData?.['Ngày khuyến nghị'] || 0);
					const dateB = new Date(infoB?.itemData?.['Ngày công bố'] || infoB?.itemData?.['Ngày khuyến nghị'] || 0);
					return dateB - dateA;
				});
				matched = matchedList[0];
			}
		}
		setMatchedAISummary(matched);

		// Tìm CompanySummary cho mã CK này
		let companySummary = null;
		if (Array.isArray(aiSummaries)) {
			const companySummaryList = aiSummaries.filter((item) => {
				try {
					const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
					const isMatch = info?.sheetName === 'CompanySummary' && info?.searchTerm?.toLowerCase() === searchLower;
					return isMatch;
				} catch (error) {
					console.error('Error parsing item info:', error);
					return false;
				}
			});

			if (companySummaryList.length > 0) {
				// Sắp xếp mới nhất
				companySummaryList.sort((a, b) => {
					const dateA = new Date(a.created_at || 0);
					const dateB = new Date(b.created_at || 0);
					return dateB - dateA;
				});
				companySummary = companySummaryList[0];
			}
		}
		setCurrentCompanySummary(companySummary);
		setHasSearched(true);
	};

	const [inputValue, setInputValue] = useState('');

	const handleSearch = () => {
		setSearchTerm(inputValue);
		setSelectedQuarter('Q1/2025'); // Mặc định luôn là Q1/2025
		filterReports(inputValue);
	};

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};

	// Handle Tạo tổng quan button click
	const handleTaoTongQuan = async () => {
		try {
			if (!searchTerm.trim()) {
				alert('Vui lòng tìm kiếm một mã chứng khoán trước khi tạo tổng quan');
				return;
			}

			// Kiểm tra xem có dữ liệu để phân tích không
			const hasValuationData = valuationRows.length > 0;
			const hasFinancialRatioData = searchTermFinRatioData.length > 0;
			const hasIndustryComparisonData = selectedFinRatioData.length > 0;

			if (!hasValuationData && !hasFinancialRatioData && !hasIndustryComparisonData) {
				alert('Không có dữ liệu để tạo tổng quan. Vui lòng tìm kiếm một mã chứng khoán có dữ liệu định giá, tỷ số tài chính hoặc so sánh cùng ngành.');
				return;
			}

			setIsCreatingSummary(true);

			// Tìm thông tin công ty cho mã chứng khoán này
			const companyInfoData = companyInfo.find(item =>
				(item['Mã CK'] || '').toLowerCase() === searchTerm.toLowerCase()
			);

			// Chuẩn bị dữ liệu để gửi cho AI
			const analysisData = {
				searchTerm: searchTerm,
				companyInfo: companyInfoData || null,
				valuationData: valuationRows,
				financialRatioData: searchTermFinRatioData,
				industryComparisonData: selectedFinRatioData
			};

			// Convert data to JSON string for prompt
			const prompt = JSON.stringify(analysisData, null, 2);
			const systemMessage = `
Bạn sẽ nhận toàn bộ dữ liệu phân tích của một mã chứng khoán dưới dạng JSON bao gồm:
- Thông tin công ty (companyInfo): thông tin cơ bản về doanh nghiệp
- Dữ liệu định giá (valuationData): các báo cáo định giá từ các nguồn khác nhau
- Dữ liệu tỷ số tài chính (financialRatioData): các chỉ số tài chính qua các kỳ
- Dữ liệu so sánh cùng ngành (industryComparisonData): so sánh với các công ty cùng ngành

Hãy đọc và trả về kết quả theo định dạng sau:

[SUMMARY_SHORT]
(Viết đoạn tóm tắt ngắn, 7–10 câu, nêu mục tiêu hoặc nội dung chính của báo cáo phân tích, bao gồm thông tin cơ bản về công ty.)

[SUMMARY_DETAILED]
(Viết đoạn tổng quan chi tiết hơn, 15–20 câu, phân tích bối cảnh, cách tiếp cận và các kết luận chính, trả về dạng markdown. Sử dụng thông tin công ty để làm rõ bối cảnh phân tích.)

Chỉ trả về nội dung theo đúng định dạng trên, không thêm phần thừa. Đảm bảo giữ nguyên nhãn [SUMMARY_SHORT] và [SUMMARY_DETAILED].
`;
			const model = "gemini-2.5-pro-preview-06-05";
			const response = await aiGen(prompt, systemMessage, model, 'text');
			console.log('AI Response:', response);

			// Parse the result to extract summary1 and summary2
			if (response && response.result) {
				const resultText = response.result;

				// Extract SUMMARY_SHORT section
				const shortMatch = resultText.match(/\[SUMMARY_SHORT\]\s*\n([\s\S]*?)(?=\n\[SUMMARY_DETAILED\]|$)/);
				const summary1 = shortMatch ? shortMatch[1].trim() : '';

				// Extract SUMMARY_DETAILED section
				const detailedMatch = resultText.match(/\[SUMMARY_DETAILED\]\s*\n([\s\S]*?)$/);
				const summary2 = detailedMatch ? detailedMatch[1].trim() : '';

				console.log('Extracted summary1:', summary1);
				console.log('Extracted summary2:', summary2);

				// Save to aiSummary table
				if (summary1 || summary2) {
					const aiSummaryData = {
						summary1: summary1 || null,
						summary2: summary2 || null,
						info: {
							title: 'Phân tích tổng quan ' + searchTerm,
							sheetName: 'CompanySummary',
							searchTerm: searchTerm,
							companyInfo: companyInfoData ? true : false,
							valuationDataCount: valuationRows.length,
							finalRatioDataCount: searchTermFinRatioData.length,
							industryComparisonCount: selectedFinRatioData.length,
							dataType: 'CompanySummary'
						}
					};

					try {
						const savedSummary = await createAISummary(aiSummaryData);
						console.log('Saved to aiSummary table:', savedSummary);
						// Cập nhật currentCompanySummary với tổng quan mới tạo
						setCurrentCompanySummary(savedSummary);

						// Refresh aiSummaries để cập nhật UI
						try {
							await loadAiSummaries();
						} catch (refreshError) {
							console.error('Error refreshing AI summaries:', refreshError);
						}

						message.success('Tạo tổng quan hoàn thành và đã lưu vào cơ sở dữ liệu!');
					} catch (saveError) {
						console.error('Lỗi khi lưu vào aiSummary table:', saveError);
					}
				} else {
					console.warn('Không thể trích xuất summary từ kết quả AI');
					alert('Tạo tổng quan hoàn thành nhưng không thể trích xuất nội dung tóm tắt');
				}
			} else {
				console.warn('Response không có result field');
				alert('Tạo tổng quan hoàn thành nhưng không nhận được kết quả hợp lệ');
			}
		} catch (error) {
			console.error('Lỗi khi tạo tổng quan:', error);
			alert('Có lỗi xảy ra khi tạo tổng quan');
		} finally {
			setIsCreatingSummary(false);
		}
	};

	// Loại bỏ useEffect tự động tìm kiếm
	// useEffect(() => {
	// 	filterReports(searchTerm);
	// }, [searchTerm, companyReportData, finRatio, aiSummaries]);

	// Định nghĩa các cột cho bảng định giá
	const valuationColumns = [
		{
			title: 'Nguồn',
			dataIndex: 'Nguồn',
			key: 'nguon',
			width: 120,
			render: (value, record) => {
				// Lấy mã CK và nguồn từ record để kiểm tra AI Summary
				const maCK = record['Mã CK'];
				const nguon = value;
				const hasAISummary = hasAISummaryForCodeAndSource(maCK, nguon);

				return (
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span>{value}</span>
						{hasAISummary && (
							<ScanBarcode
								style={{ color: '#262626', cursor: 'pointer' }}
								size={16}
								onClick={() => openAISummaryModalForSource(maCK, nguon)}
							/>
						)}
					</div>
				);
			},
		},
		{
			title: 'Định giá',
			dataIndex: 'Giá mục tiêu (đồng)',
			key: 'giaMucTieu',
			width: 140,
			render: (value) => value ? value.toLocaleString('vi-VN') + ' VNĐ' : 'N/A',
		},
		{
			title: 'Ngày',
			dataIndex: 'Ngày công bố',
			key: 'ngayCongBo',
			width: 120,
			render: (value, record) => value || record['Ngày khuyến nghị'] || 'N/A',
		},
		{
			title: 'Báo cáo chi tiết',
			key: 'baoCaoChiTiet',
			width: 150,
			render: (_, record) => {
				const url = record['URLReport'] || record['URL'] || record['Link'] || '';

				if (url) {
					return (
						<Button
							size="small"
							icon={<FileTextOutlined />}
							onClick={() => window.open(url, '_blank')}
							style={{ fontSize: '12px' }}
						>
							Xem báo cáo
						</Button>
					);
				}

				return <span style={{ color: '#999' }}>Không có</span>;
			},
		},
	];

	// Hàm chuyển serial Excel sang Date JS
	function excelSerialToDate(serial) {
		const utc_days = Math.floor(serial - 25569);
		const utc_value = utc_days * 86400;
		return new Date(utc_value * 1000);
	}

	// Tạo cột động cho bảng tỷ số tài chính
	const createFinRatioColumns = (data) => {
		const columns = [
			{
				title: 'Chỉ số',
				dataIndex: 'metric',
				key: 'metric',
				width: 200,
				fixed: 'left',
			},
		];

		// Tạo dữ liệu transpose để kiểm tra cột nào có dữ liệu
		const transposeData = createFinRatioTransposeData(data);
		data.forEach((item, i) => {
			let title = 'Quý ?';
			if (item && item['Ngày']) {
				let date;
				if (typeof item['Ngày'] === 'number') {
					date = excelSerialToDate(item['Ngày']);
				} else {
					date = new Date(item['Ngày']);
				}
				if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
					const year = date.getFullYear();
					const month = date.getMonth() + 1;
					const quarter = Math.ceil(month / 3);
					title = `Q${quarter}/${year}`;
				}
				console.log(item, title)
			}

			// Kiểm tra xem cột này có dữ liệu không
			const colKey = `col${i}`;
			const hasData = transposeData.some(row => {
				const value = row[colKey];
				return value && value !== 'N/A' && value !== '' && value !== '0';
			});

			// Chỉ thêm cột nếu có dữ liệu
			if (hasData) {
				columns.push({
					title,
					dataIndex: colKey,
					key: colKey,
					width: 150,
				});
			}
		});

		return columns;
	};

	// Lấy 5 phần tử đầu tiên của finRatio
	const finRatioData = finRatio.slice(0, 5);

	// Thay thế logic chọn mã thủ công và lấy selectedFinRatioData cho "Bảng so sánh cùng ngành"

	// Hàm lấy danh sách mã cùng ngành cấp 4 (tối đa 5 mã, gồm cả mã đang tìm)
	const getIndustryPeers = (maCK, companyReportData) => {
		const company = companyReportData.find(item => (item['Mã CK'] || '').toLowerCase() === maCK.toLowerCase());
		if (!company) return [];
		const nganhCap4 = company['Ngành cấp 4'];
		if (!nganhCap4) return [];
		const peers = companyReportData
			.filter(item => item['Ngành cấp 4'] === nganhCap4 && (item['Mã CK'] || '').toLowerCase() !== maCK.toLowerCase())
			.map(item => item['Mã CK']);
		return [maCK, ...peers.slice(0, 4)];
	};

	// Hàm lấy dữ liệu finRatio cho mỗi mã từ cùng kỳ với mã được tìm kiếm
	const getFinRatioForCodes = (codes, allFinRatioData, searchTermData, selectedQuarter) => {
		// Nếu có chọn quý cụ thể, lấy dữ liệu từ quý đó
		if (selectedQuarter) {
			return codes.map(code => {
				const codeData = allFinRatioData.filter(item => (item['Mã CK'] || '').toLowerCase() === code.toLowerCase());
				if (codeData.length > 0) {
					// Tìm dữ liệu từ quý được chọn
					const quarterData = codeData.find(item => {
						let date;
						if (typeof item['Ngày'] === 'number') {
							date = excelSerialToDate(item['Ngày']);
						} else {
							date = new Date(item['Ngày']);
						}
						if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
							const year = date.getFullYear();
							const month = date.getMonth() + 1;
							const quarter = Math.ceil(month / 3);
							return `Q${quarter}/${year}` === selectedQuarter;
						}
						return false;
					});
					if (quarterData) {
						return quarterData;
					}
				}
				return null;
			}).filter(Boolean);
		}

		// Nếu không chọn quý, lấy kỳ mới nhất của mã được tìm kiếm làm chuẩn
		const referenceDate = searchTermData && searchTermData.length > 0 ? searchTermData[0]['Ngày'] : null;

		return codes.map(code => {
			const codeData = allFinRatioData.filter(item => (item['Mã CK'] || '').toLowerCase() === code.toLowerCase());
			if (codeData.length > 0) {
				if (referenceDate) {
					// Tìm dữ liệu từ cùng kỳ với mã được tìm kiếm
					const samePeriodData = codeData.find(item => item['Ngày'] === referenceDate);
					if (samePeriodData) {
						return samePeriodData;
					}
				}
				// Nếu không tìm thấy cùng kỳ, lấy dữ liệu mới nhất
				const sorted = codeData.sort((a, b) => {
					const dateA = new Date(a['Ngày'] || 0);
					const dateB = new Date(b['Ngày'] || 0);
					return dateB - dateA;
				});
				return sorted[0];
			}
			return null;
		}).filter(Boolean);
	};

	// Hàm kiểm tra xem item có chỉ chứa các thuộc tính cơ bản không
	const hasOnlyBasicProperties = (item) => {
		const keys = Object.keys(item);
		const basicKeys = ['Kiểu thời gian', 'Mã CK', 'Ngày'];
		const hasOnlyBasic = keys.every(key => basicKeys.includes(key));
		return hasOnlyBasic && keys.length === basicKeys.length;
	};

	// Hàm lọc bỏ dữ liệu chỉ có các thuộc tính cơ bản
	const filterFinRatioData = (data) => {
		return data.filter(item => !hasOnlyBasicProperties(item));
	};

	// Tạo allFinRatioData dùng chung và lọc bỏ dữ liệu không cần thiết
	const allFinRatioData = filterFinRatioData([
		...finRatio,
		...finRatioNH,
		...finRatioCK,
		...finRatioBH
	]);

	// Lọc dữ liệu finRatio cho mã được tìm kiếm (4 quý gần nhất) - tìm trong tất cả các danh sách
	const getFinRatioForSearchTerm = (searchTerm) => {
		if (!searchTerm.trim()) return [];

		const searchLower = searchTerm.toLowerCase();

		// Tìm trong tất cả các danh sách finRatio và lọc bỏ dữ liệu chỉ có thuộc tính cơ bản
		const allFinRatioData = filterFinRatioData([
			...finRatio,
			...finRatioNH,
			...finRatioCK,
			...finRatioBH
		]);
		const filtered = allFinRatioData.filter((item) => {
			try {
				const maCK = item['Mã CK'] || '';
				return maCK.toLowerCase() === searchLower;
			} catch {
				return false;
			}
		});

		// Sắp xếp theo ngày mới nhất
		const sorted = [...filtered].sort((a, b) => {
			const dateA = new Date(a['Ngày'] || 0);
			const dateB = new Date(b['Ngày'] || 0);
			return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
		});

		// Loại bỏ trùng lặp theo quý/năm, chỉ giữ lại bản ghi mới nhất cho mỗi quý
		const uniqueByQuarter = [];
		const seenQuarters = new Set();

		for (const item of sorted) {
			let date;
			if (typeof item['Ngày'] === 'number') {
				date = excelSerialToDate(item['Ngày']);
			} else {
				date = new Date(item['Ngày']);
			}

			if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
				const year = date.getFullYear();
				const month = date.getMonth() + 1;
				const quarter = Math.ceil(month / 3);
				const quarterKey = `Q${quarter}/${year}`;

				if (!seenQuarters.has(quarterKey)) {
					seenQuarters.add(quarterKey);
					uniqueByQuarter.push(item);
				}
			}
		}

		// Lấy 4 quý gần nhất (đã loại bỏ trùng lặp)
		return uniqueByQuarter.slice(0, 4);
	};

	// Tạo dữ liệu transpose cho bảng tỷ số tài chính theo format mới
	const createFinRatioTransposeData = (data) => {
		console.log(data)
		if (!data || data.length === 0) return [];

		// Lấy tất cả các key từ object đầu tiên, loại trừ Mã CK và Ngày
		const firstItem = data[0];
		console.log('First item in createFinRatioTransposeData:', firstItem);

		const allKeys = Object.keys(firstItem).filter(key =>
			key !== 'Mã CK' &&
			key !== 'Ngày' &&
			key !== 'Kiểu thời gian' &&
			key !== 'Loại báo cáo (Q)' &&
			key !== 'Trạng thái kiểm toán (Q)',
		);
		console.log('All keys after filtering:', allKeys);

		const normalize = str => str.replace(/\s*\(Q\)|\s*\(Y\)|\s*\(VND\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

		// Lọc chỉ lấy những chỉ số có trong LIST_FIN_RATIO (so sánh đã chuẩn hóa)
		const filteredKeys = allKeys.filter(key =>
			LIST_FIN_RATIO.some(ratio => normalize(key) === normalize(ratio))
		);
		console.log('Filtered keys based on LIST_FIN_RATIO:', filteredKeys);
		console.log('LIST_FIN_RATIO:', LIST_FIN_RATIO);

		// Loại bỏ các chỉ số trùng lặp sau khi chuẩn hóa
		const uniqueKeys = [];
		const seenNormalized = new Set();

		for (const key of filteredKeys) {
			const normalizedKey = normalize(key);
			if (!seenNormalized.has(normalizedKey)) {
				seenNormalized.add(normalizedKey);
				uniqueKeys.push(key);
			}
		}

		console.log('Unique keys after deduplication:', uniqueKeys);

		const formatNumber = (value) => {
			if (typeof value !== 'number' || value === 0) return value === 0 ? '0' : (value || 'N/A');
			const absValue = Math.abs(value);
			if (absValue >= 1000000000) {
				const billions = value / 1000000000;
				const decimalPlaces = billions < 10 ? 2 : 1;
				const formattedBillions = billions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
				return parseFloat(formattedBillions).toLocaleString('vi-VN') + ' tỷ';
			} else if (absValue >= 1000000) {
				const millions = value / 1000000;
				const decimalPlaces = millions < 10 ? 2 : 1;
				const formattedMillions = millions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
				return parseFloat(formattedMillions).toLocaleString('vi-VN') + ' triệu';
			} else if (absValue < 10) {
				return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
			} else {
				return Math.round(value).toLocaleString('vi-VN');
			}
		};

		const result = uniqueKeys.map(key => {
			// Loại bỏ "(Q)", "(Y)", "(VND)" khỏi tên chỉ số
			const cleanMetric = key.replace(/ \(Q\)| \(Y\)| \(VND\)/g, '');
			const row = { metric: cleanMetric };
			data.forEach((item, index) => {
				const colKey = `col${index}`;
				// Tìm key thực tế trong item khớp với ratio này (bỏ hậu tố)
				const matchedKey = Object.keys(item).find(
					k => normalize(k) === normalize(key)
				);
				const value = matchedKey ? item[matchedKey] : undefined;
				row[colKey] = formatNumber(value);
			});
			return row;
		});
		console.log('Final transpose result:', result);
		return result;
	};

	// Đặt hàm createTransposeData ở đầu phần logic, trước mọi sử dụng
	const createTransposeData = (data) => {
		if (!data || data.length === 0) return [];
		// Lấy tất cả các key từ object đầu tiên, loại trừ Mã CK và Ngày
		const firstItem = data[0];
		const allKeys = Object.keys(firstItem).filter(key =>
			key !== 'Mã CK' &&
			key !== 'Ngày' &&
			key !== 'Kiểu thời gian' &&
			key !== 'Loại báo cáo (Q)' &&
			key !== 'Trạng thái kiểm toán (Q)'
		);

		// Lọc chỉ lấy những chỉ số có trong LIST_FIN_RATIO
		const filteredKeys = allKeys.filter(key =>
			LIST_FIN_RATIO.some(ratio => key.includes(ratio))
		);

		// Loại bỏ các chỉ số trùng lặp sau khi chuẩn hóa
		const normalize = str => str.replace(/\s*\(Q\)|\s*\(Y\)|\s*\(VND\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
		const uniqueKeys = [];
		const seenNormalized = new Set();

		for (const key of filteredKeys) {
			const normalizedKey = normalize(key);
			if (!seenNormalized.has(normalizedKey)) {
				seenNormalized.add(normalizedKey);
				uniqueKeys.push(key);
			}
		}

		// Hàm format số với đơn vị triệu/tỷ
		const formatNumber = (value) => {
			if (typeof value !== 'number' || value === 0) return value === 0 ? '0' : (value || 'N/A');

			const absValue = Math.abs(value);
			if (absValue >= 1000000000) {
				const billions = value / 1000000000;
				const decimalPlaces = billions < 10 ? 2 : 1;
				const formattedBillions = billions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
				return parseFloat(formattedBillions).toLocaleString('vi-VN') + ' tỷ';
			} else if (absValue >= 1000000) {
				const millions = value / 1000000;
				const decimalPlaces = millions < 10 ? 2 : 1;
				const formattedMillions = millions.toFixed(decimalPlaces).replace(/\.?0+$/, '');
				return parseFloat(formattedMillions).toLocaleString('vi-VN') + ' triệu';
			} else if (absValue < 10) {
				return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
			} else {
				return Math.round(value).toLocaleString('vi-VN');
			}
		};

		return uniqueKeys.map(key => {
			// Loại bỏ "(Q)" và "(VND)" khỏi tên chỉ số
			const cleanMetric = key.replace(/ \(Q\)| \(VND\)/g, '');
			const row = { metric: cleanMetric };
			data.forEach((item, index) => {
				const colKey = `col${index}`;
				const value = item[key];
				row[colKey] = formatNumber(value);
			});
			return row;
		});
	};

	// Đảm bảo hàm createTransposeColumns được khai báo phía trên mọi nơi sử dụng nó
	const createTransposeColumns = (data) => {
		const columns = [
			{
				title: 'Chỉ số',
				dataIndex: 'metric',
				key: 'metric',
				width: 200,
				fixed: 'left',
			},
		];
		data.forEach((item, index) => {
			const maCK = item['Mã CK'] || `Công ty ${index + 1}`;
			// Lấy ngày
			let dateLabel = '';
			if (item['Ngày']) {
				let date;
				if (typeof item['Ngày'] === 'number') {
					date = excelSerialToDate(item['Ngày']);
				} else {
					date = new Date(item['Ngày']);
				}
				if (!isNaN(date.getTime()) && date.getFullYear() !== 1970) {
					const year = date.getFullYear();
					const month = date.getMonth() + 1;
					const quarter = Math.ceil(month / 3);
					dateLabel = `Q${quarter}/${year}`;
				} else {
					dateLabel = item['Ngày'];
				}
			}
			columns.push({
				title: `${maCK}${dateLabel ? ` (${dateLabel})` : ''}`,
				dataIndex: `col${index}`,
				key: `col${index}`,
				width: 150,
			});
		});
		return columns;
	};

	// Dữ liệu finRatio cho mã được tìm kiếm - chỉ tính toán khi hasSearched = true
	const searchTermFinRatioData = useMemo(() => {
		if (!hasSearched || !searchTerm.trim()) return [];
		return getFinRatioForSearchTerm(searchTerm);
	}, [hasSearched, searchTerm]);

	const searchTermFinRatioTransposeData = useMemo(() => {
		return createFinRatioTransposeData(searchTermFinRatioData);
	}, [searchTermFinRatioData]);

	const searchTermFinRatioColumns = useMemo(() => {
		return createFinRatioColumns(searchTermFinRatioData);
	}, [searchTermFinRatioData]);

	// Lấy dữ liệu so sánh cùng ngành tự động dựa trên mã tìm kiếm - chỉ tính toán khi hasSearched = true
	const peerCodes = useMemo(() => {
		if (!hasSearched || !searchTerm.trim()) return [];
		return getIndustryPeers(searchTerm, companyInfo);
	}, [hasSearched, searchTerm, companyInfo]);

	const selectedFinRatioData = useMemo(() => {
		if (!hasSearched || !searchTerm.trim()) return [];
		return getFinRatioForCodes(peerCodes, allFinRatioData, searchTermFinRatioData, selectedQuarter);
	}, [hasSearched, searchTerm, peerCodes, allFinRatioData, searchTermFinRatioData, selectedQuarter]);

	const transposeData = useMemo(() => {
		return createTransposeData(selectedFinRatioData);
	}, [selectedFinRatioData]);

	const transposeColumns = useMemo(() => {
		return createTransposeColumns(selectedFinRatioData);
	}, [selectedFinRatioData]);

	// Hàm format ngày thành chuỗi kỳ
	const formatPeriod = (dateString) => {
		if (!dateString) return '';
		const date = new Date(dateString);

		// Kiểm tra ngày hợp lệ (không phải Invalid Date và không phải năm 1970)
		if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
			return '';
		}

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const quarter = Math.ceil(month / 3);
		return `Q${quarter}/${year}`;
	};

	// Hàm lấy thông tin kỳ cho bảng tỷ số tài chính
	const getFinancialRatioPeriodInfo = (data) => {
		if (!data || data.length === 0) return '';
		const periods = data.map(item => formatPeriod(item['Ngày'])).filter(period => period !== '');
		return periods.length > 0 ? ` (${periods.join(', ')})` : '';
	};

	// Hàm lấy danh sách 5 quý gần nhất tính từ thời điểm hiện tại
	const getAvailableQuarters = () => {
		const result = [];
		const now = new Date();
		let year = now.getFullYear();
		let month = now.getMonth() + 1;
		let quarter = Math.ceil(month / 3);
		for (let i = 0; i < 5; i++) {
			result.push(`Q${quarter}/${year}`);
			quarter--;
			if (quarter === 0) {
				year--;
				quarter = 4;
			}
		}
		return result;
	};

	// Hàm lấy thông tin kỳ cho bảng so sánh cùng ngành
	const getIndustryComparisonPeriodInfo = (searchTermData, selectedData) => {
		if (selectedQuarter) return ` (${selectedQuarter})`;
		if (!searchTermData || searchTermData.length === 0) return '';
		const referencePeriod = formatPeriod(searchTermData[0]['Ngày']);
		return referencePeriod && referencePeriod !== '' ? ` (${referencePeriod})` : '';
	};

	// Hiển thị thông tin chi tiết của CompanySummary
	const [showDetailSummary, setShowDetailSummary] = useState(false);
	const renderCompanySummary = () => {
		if (!currentCompanySummary) return null;
		const info = typeof currentCompanySummary.info === 'string' ? JSON.parse(currentCompanySummary.info) : currentCompanySummary.info;
		return (
			<Card className={styles.aiSummaryCard} style={{ marginBottom: '24px' }}>
				<Title level={4} style={{ marginBottom: 8, color: '#1890ff' }}>
					Tổng quan phân tích - {info?.searchTerm || 'N/A'}
				</Title>
				{/*<div style={{ fontSize: 14, color: '#666'}}>*/}
				{/*	<b>Dữ liệu phân tích:</b> {info?.valuationDataCount || 0} báo cáo định giá, {info?.finalRatioDataCount || 0} kỳ tỷ số tài chính, {info?.industryComparisonCount || 0} công ty cùng ngành*/}
				{/*	<br/>*/}
				{/*	{info?.companyInfo && (*/}
				{/*		<span style={{color: '#52c41a', fontSize: 12 }}>*/}
				{/*			Có thông tin công ty*/}
				{/*		</span>*/}
				{/*	)}*/}
				{/*	{currentCompanySummary?.created_at && (*/}
				{/*		<span style={{ marginLeft: 12, fontSize: 12 }}>*/}
				{/*			Tạo lúc: {new Date(currentCompanySummary.created_at).toLocaleString('vi-VN')}*/}
				{/*		</span>*/}
				{/*	)}*/}
				{/*</div>*/}
				{currentCompanySummary.summary1 && (
					<div style={{ fontSize: 14, fontStyle: 'italic', color: '#666', marginBottom: 12 }}>
						<b>Tóm tắt:</b> {currentCompanySummary.summary1}
					</div>
				)}
				{currentCompanySummary.summary2 && !showDetailSummary && (
					<Button type="link" onClick={() => setShowDetailSummary(true)} style={{ padding: 0 }}>
						Xem thêm
					</Button>
				)}
				{currentCompanySummary.summary2 && showDetailSummary && (
					<>
						<Divider />
						<div
							className={cssMarkdown.markdownContent}
							dangerouslySetInnerHTML={{
								__html: DOMPurify.sanitize(marked.parse(currentCompanySummary.summary2 || '')),
							}}
						/>
						<Button type="link" onClick={() => setShowDetailSummary(false)} style={{ padding: 0 }}>
							Thu gọn
						</Button>
					</>
				)}
			</Card>
		);
	};

	// Hiển thị thông tin chi tiết của matchedAISummary
	const renderAISummary = () => {
		if (!matchedAISummary) return null;
		const info = typeof matchedAISummary.info === 'string' ? JSON.parse(matchedAISummary.info) : matchedAISummary.info;
		const itemData = info?.itemData || {};
		return (
			<Card className={styles.aiSummaryCard}>
				<div style={{ fontSize: 15 }}>
					<b>Mã CK:</b> {itemData['Mã CK'] || 'N/A'}<br />
					<b>Khuyến nghị:</b> {itemData['Khuyến nghị'] || 'N/A'}<br />
					<b>Giá mục
						tiêu:</b> {itemData['Giá mục tiêu (đồng)'] ? itemData['Giá mục tiêu (đồng)'].toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}<br />
					<b>Ngày công bố:</b> {itemData['Ngày công bố'] || itemData['Ngày khuyến nghị'] || 'N/A'}<br />
					<b>Nguồn:</b> {itemData['Nguồn'] || 'N/A'}
				</div>
				<Divider />
				<Title level={4}
					   style={{ marginBottom: 8 }}>{info?.title || itemData['Tên báo cáo'] || 'AI Summary'}</Title>
				{matchedAISummary.summary2 &&
					<div
						className={cssMarkdown.markdownContent}
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(marked.parse(matchedAISummary.summary2 || '')),
						}}
					/>
				}
				{
					info?.summary2 && !matchedAISummary.summary2 &&
					<div
						className={cssMarkdown.markdownContent}
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(marked.parse(info.summary2 || '')),
						}}
					/>
				}
			</Card>
		);
	};

	return (
		<div className={styles.container}>
			<div className={styles.searchBoxCustom}>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '60%', margin: '10px auto' }}>
					<Input
						placeholder="Nhập mã chứng khoán (VD: POW, VNM, FPT...)"
						value={inputValue}
						onChange={handleInputChange}
						allowClear
					/>
					<Button
						type="primary"
						icon={<SearchOutlined />}
						onClick={handleSearch}
						disabled={!inputValue.trim()}
						style={{padding: '0 5px'}}
					>
					</Button>
					{currentUser.isAdmin && !currentCompanySummary && (
						<Button
							type="default"
							onClick={handleTaoTongQuan}
							disabled={!hasSearched || !hasFoundData || isCreatingSummary}
							loading={isCreatingSummary}
						>
							Tạo tổng quan
						</Button>
					)}
					{/*{currentCompanySummary && (*/}
					{/*	<Button */}
					{/*		type="primary"*/}
					{/*		onClick={handleTaoTongQuan}*/}
					{/*		disabled={isCreatingSummary}*/}
					{/*		loading={isCreatingSummary}*/}
					{/*	>*/}
					{/*		Tạo lại tổng quan*/}
					{/*	</Button>*/}
					{/*)}*/}
				</div>
			</div>
			<div className={styles.resultsSection}>
				{loading ? (
					<div className={styles.loadingContainer}>
						<Spin size="large" />
						<Text>Đang tải dữ liệu...</Text>
					</div>
				) : (
					<>
						{hasSearched && searchTerm.trim() && (
							<>
								{/* Hiển thị CompanySummary nếu có - luôn hiển thị khi có dữ liệu */}
								{currentCompanySummary && renderCompanySummary()}

								{/* Các bảng dữ liệu chỉ hiển thị khi có dữ liệu */}
								{hasFoundData && (
									<>
										{/* Bảng Định giá - chỉ hiển thị khi có dữ liệu */}
										{valuationRows.length > 0 && (
											<>
												<Title level={5} style={{ margin: '24px 0 12px 0' }}>Bảng Định giá (10 dòng mới
													nhất)</Title>
												<Table
													columns={valuationColumns}
													dataSource={valuationRows}
													rowKey={(record, idx) => record['Nguồn'] + record['Giá mục tiêu (đồng)'] + record['Ngày công bố'] + idx}
													scroll={{ x: 500 }}
													pagination={false}
													className={styles.companyReportTable}
													size="small"
												/>
											</>
										)}

										{/* Bảng tỷ số tài chính - chỉ hiển thị khi có dữ liệu */}
										{searchTermFinRatioTransposeData.length > 0 && (
											<>
												<Title level={5} style={{ margin: '24px 0 12px 0' }}>Bảng tỷ số tài chính cho
													"{searchTerm}"{getFinancialRatioPeriodInfo(searchTermFinRatioData)}</Title>
												<Table
													columns={searchTermFinRatioColumns}
													dataSource={searchTermFinRatioTransposeData}
													rowKey={(record, idx) => record['metric'] + idx}
													scroll={{ x: 500 }}
													pagination={false}
													className={styles.companyReportTable}
													size="small"
												/>
											</>
										)}

										{/* Bảng so sánh cùng ngành - chỉ hiển thị khi có dữ liệu ngành */}
										{(peerCodes.length > 0) && (
											<>
												<div style={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
													margin: '24px 0 12px 0',
												}}>
													<Title level={5} style={{ margin: 0 }}>
														Bảng so sánh cùng ngành ({selectedFinRatioData.length} mã)
														{getIndustryComparisonPeriodInfo(searchTermFinRatioData, selectedFinRatioData)}
													</Title>
													<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
														<Text style={{ fontSize: '12px' }}>Chọn quý:</Text>
														<Select
															value={selectedQuarter}
															onChange={setSelectedQuarter}
															style={{ width: 120, fontSize: '12px' }}
															placeholder="Tự động"
															allowClear
														>
															{getAvailableQuarters().map(quarter => (
																<Select.Option key={quarter} value={quarter}>
																	{quarter}
																</Select.Option>
															))}
														</Select>
													</div>
												</div>
												<Table
													columns={transposeColumns}
													dataSource={transposeData}
													rowKey={(record, idx) => record['metric'] + idx}
													scroll={{ x: 500 }}
													pagination={false}
													className={styles.companyReportTable}
													size="small"
												/>
												{selectedFinRatioData.length === 0 && selectedQuarter && (
													<div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
														Không có mã nào có dữ liệu cho quý {selectedQuarter}
													</div>
												)}
											</>
										)}
									</>
								)}
							</>
						)}

						{hasSearched && searchTerm.trim() && !hasFoundData && (
							<div className={styles.emptyContainer}>
								<Empty
									description={<span>Không tìm thấy dữ liệu cho mã chứng khoán "{searchTerm}"</span>}
								/>
							</div>
						)}

						{!hasSearched && (
							<div className={styles.initialState}>
								<Empty
									image={Empty.PRESENTED_IMAGE_SIMPLE}
									description={<span>Nhập mã chứng khoán và nhấn nút Tìm kiếm để xem báo cáo phân tích</span>}
								/>
							</div>
						)}
					</>
				)}
			</div>

			{/* Modal hiển thị AI Summary */}
			<Modal
				title="Tổng quan"
				open={isModalOpen}
				onCancel={() => setIsModalOpen(false)}
				footer={null}
				width={800}
				style={{ top: 20 }}
			>
				{matchedAISummary && renderAISummary()}
			</Modal>

			{/* Đã xoá hoàn toàn phần Modal chọn mã CK và các biến/hàm liên quan, không để lại comment JSX gây lỗi cú pháp. */}
		</div>
	);
};

export default CompanyReportTab;
