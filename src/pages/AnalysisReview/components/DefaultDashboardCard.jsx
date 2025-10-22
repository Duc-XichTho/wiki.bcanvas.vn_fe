import React, { useState, useEffect, useContext, forwardRef, useImperativeHandle } from 'react';
import {
	Card,
	Button,
	Modal,
	Form,
	Input,
	Select,
	Row,
	Col,
	Typography,
	Space,
	Divider,
	InputNumber,
	Tag,
	Tooltip,
} from 'antd';
import { SettingOutlined, EditOutlined, TrophyOutlined } from '@ant-design/icons';
import { getAllKpi2Calculator, getKpi2CalculatorById } from '../../../apis/kpi2CalculatorService.jsx';
import { getKpiCalculatorById } from '../../../apis/kpiCalculatorService.jsx';
import { aiGen, aiGen2 } from '../../../apis/botService.jsx';
import { updateUsedTokenApp } from '../../../utils/tokenUtils.js';
import {
	createDashBoardItem,
	getDashBoardItemById,
	updateDashBoardItem,
	getAllDashBoardItems,
} from '../../../apis/dashBoardItemService.jsx';
import { evaluate } from 'mathjs';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { MODEL_AI_LIST } from '../../../AI_CONST.js';
import { MyContext } from '../../../MyContext.jsx';
import styles from './modals/AnalysisDetailModal.module.css';
import componentStyles from './DefaultDashboardCard.module.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;


const DefaultDashboardCard = forwardRef(({ onUpdate, selectedStoreTags = ['All'] }, ref) => {
	const { currentUser } = useContext(MyContext);
	const [form] = Form.useForm();
	const [configForm] = Form.useForm();
	const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
	const [isEditModalVisible, setIsEditModalVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [defaultItem, setDefaultItem] = useState(null);
	const [kpi2Calculators, setKpi2Calculators] = useState([]);
	const [kpi2Data, setKpi2Data] = useState({});
	const [scores, setScores] = useState({
		financial: { score: 0, analysis: '' },
		business: { score: 0, analysis: '' },
		operation: { score: 0, analysis: '' },
		hr: { score: 0, analysis: '' },
		overview: { score: 0, analysis: '' },
		total: 0,
	});
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedSection, setSelectedSection] = useState(null);
	const [selectedAIModel, setSelectedAIModel] = useState('gpt-5-mini-2025-08-07');
	const [isLoadingItem, setIsLoadingItem] = useState(false);
	const [forceUpdate, setForceUpdate] = useState(0);
	const [isMobile, setIsMobile] = useState(false);
	const [selectedKpis, setSelectedKpis] = useState({
		financial: [],
		business: [],
		operation: [],
		hr: [],
		overview: [],
	});
	const [kpiWeights, setKpiWeights] = useState({
		financial: {},
		business: {},
		operation: {},
		hr: {},
		overview: {},
	});
	const [aiPrompt, setAiPrompt] = useState(`Bạn là một chuyên gia UI/UX và front-end developer hàng đầu, chuyên biến các dữ liệu phân tích phức tạp thành những báo cáo HTML trực quan, chuyên nghiệp và dễ hiểu. Nhiệm vụ của bạn là phân tích cấu trúc của một báo cáo, chắt lọc thông tin quan trọng và thiết kế một giao diện dashboard hiệu quả.

QUY TRÌNH TƯ DUY CỦA BẠN:
1. Phân tích & Tinh chỉnh Nội dung Báo cáo (Report Analysis & Refinement):
Xác định Cấu trúc Báo cáo: Đọc và nhận diện rõ ba cấp độ thông tin của dữ liệu đầu vào:
Điểm Chức năng Tổng thể: Xác định các điểm đánh giá theo chữ cái cho từng mảng chức năng lớn (ví dụ: 'Tài chính - B', 'Vận hành - C') được cung cấp ở đầu vào. Đây là lớp thông tin cao nhất.
Khối Phân tích Tổng quan (KPI chính): Chứa điểm số (thang 100), nhận định chung và kết luận chính cho một KPI hoặc một nhóm KPI cụ thể.
Các Khối Phân tích Chi tiết (KPI breakdown): Chứa các diễn giải sâu hơn về xu hướng, nguyên nhân, rủi ro, và các khuyến nghị hành động liên quan đến KPI đó.
Tập trung vào Cốt lõi & Diễn đạt Súc tích: Chắt lọc những ý chính, quan trọng nhất từ nội dung gốc. Loại bỏ những câu chữ dài dòng, viết lại toàn bộ văn bản trong HTML output một cách ngắn gọn, chính xác và chuyên nghiệp.
2. Lựa chọn Layout Tối ưu cho Báo cáo (Optimal Report Layout):
Kết hợp Layout Chiến lược: Đối với loại báo cáo này, hãy ưu tiên sử dụng kết hợp các layout sau:
Score Summary Pills: Dành cho phần điểm chức năng tổng thể. Sử dụng các thẻ (pill/tag) màu sắc để hiển thị đánh giá A, B, C, D một cách trực quan, rõ ràng ngay từ đầu.
Key Metrics / Dashboard: Dành cho khối "Phân tích Tổng quan". Thiết kế một khu vực nổi bật để hiển thị điểm số (thang 100) và nhận định chung.
Card Grid: Dành cho phần "Phân tích Chi tiết". Chia các mục nhỏ (Xu hướng, Rủi ro, Khuyến nghị, v.v.) thành các thẻ (card) riêng biệt để người xem dễ dàng nắm bắt thông tin.
3. Khung sườn Thiết kế & Sáng tạo (Design & Creative Framework):
Font chữ: Reddit Sans.
Hệ thống Màu sắc (Color System):
Bảng màu đơn sắc: #2896E0 (Màu 1), #0A5E97 (Màu 2), #2192DD (Màu 3), #1CBBE7 (Màu 4), #168DB8 (Màu 5).
Màu nhấn: #ECECEC.
Màu chữ: Nền màu -> chữ trắng. Nền trắng/xám -> chữ #454545 (chính) và #868686 (phụ).
Màu sắc cho Điểm Chữ cái:
A (Tốt): Nền #1CBBE7, chữ trắng.
B (Khá): Nền #2896E0, chữ trắng.
C (Trung bình): Nền #ECECEC, chữ #454545.
D (Yếu): Viền #868686, chữ #868686.
Các quy tắc khác về Phong cách khối, Icon, Bố cục, Ngôn ngữ... được giữ nguyên như phiên bản trước.
4. Tạo HTML Code (Code Generation):
Giữ nguyên
QUAN TRỌNG: CHỈ TRẢ VỀ HTML CODE
Giữ nguyên
YÊU CẦU KỸ THUẬT:
Giữ nguyên
VÍ DỤ OUTPUT MẪU (CHỈ TRẢ VỀ PHẦN NÀY):
<div style="font-family: 'Reddit Sans', -apple-system, sans-serif; width: 100%; display: flex; flex-direction: column; gap: 24px;">
  <!-- Block 0: Đánh giá Tổng thể các Chức năng -->
  <div style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background-color: #ffffff; border-radius: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
    <h3 style="width: 100%; margin: 0; color: #454545; font-size: 18px; font-weight: 600;">Đánh giá Tổng thể các Chức năng</h3>
    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
      <!-- Item: Tài chính -->
      <div style="flex: 1; min-width: 180px; display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background-color: #f8f9fa; border-radius: 3px; border-left: 4px solid #2896E0;">
        <span style="color: #454545; font-weight: 500;">Tài chính</span>
        <span style="font-size: 14px; font-weight: 700; color: #ffffff; background-color: #2896E0; padding: 4px 12px; border-radius: 12px;">B</span>
      </div>
      <!-- Item: Vận hành -->
      <div style="flex: 1; min-width: 180px; display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background-color: #f8f9fa; border-radius: 3px; border-left: 4px solid #ECECEC;">
        <span style="color: #454545; font-weight: 500;">Vận hành</span>
        <span style="font-size: 14px; font-weight: 700; color: #454545; background-color: #ECECEC; padding: 4px 12px; border-radius: 12px;">C</span>
      </div>
    </div>
  </div>

  <!-- Block 1: Tổng quan & Điểm số (cho KPI cụ thể) -->
  <div style="background: linear-gradient(to right, #2896E0, #0A5E97); color: #FFFFFF; border-radius: 3px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px;">
    <div style="flex: 1; min-width: 250px;">
      <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>Phân tích Vận hành: Vòng quay Tồn kho</h3>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; opacity: 0.9;">Cải thiện sau Quý 1 nhưng chưa ổn định, cần tối ưu mua hàng và kích cầu theo dịp lễ.</p>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; background-color: rgba(255,255,255,0.1); padding: 12px 20px; border-radius: 3px;">
        <div style="font-size: 36px; font-weight: 700; color: #FFFFFF;">85<span style="font-size: 20px; font-weight: 500; opacity: 0.8;">/100</span></div>
        <div style="font-size: 14px; opacity: 0.8;">Điểm hiệu suất</div>
    </div>
  </div>

  <!-- Block 2: Phân tích chi tiết -->
  <div style="background-color: #ffffff; border-radius: 3px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); border-top: 6px solid; border-image: linear-gradient(to right, #2192DD, #0A5E97) 1;">
    <h3 style="margin: 0 0 20px 0; color: #454545; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>Phân tích Chi tiết & Đề xuất</h3>
    <div style="display: flex; flex-wrap: wrap; gap: 20px;">

      <!-- Sub-block: Phân tích Xu hướng -->
      <div style="flex: 1; min-width: 300px; background: #ffffff; border: 1px solid #D3D3D3; border-radius: 3px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
        <h4 style="margin: 0 0 12px 0; color: #454545; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>Xu hướng & Insights</h4>
        <p style="margin: 0; color: #868686; font-size: 14px; line-height: 1.6;"><strong>Thấp đầu năm (T1-2):</strong> 1.45-1.47, có nguy cơ overstock sau Tết.<br><strong>Bùng nổ (T3):</strong> 2.64, nhờ chiến dịch 8/3 và dồn bán.<br><strong>Ổn định (T4-5):</strong> ~1.94-2.09, tiệm cận mức mục tiêu ≥2.0.</p>
      </div>

      <!-- Sub-block: Rủi ro -->
      <div style="flex: 1; min-width: 300px; background: #ffffff; border: 1px solid #D3D3D3; border-radius: 3px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
        <h4 style="margin: 0 0 12px 0; color: #454545; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>Rủi ro & Nguyên nhân</h4>
        <p style="margin: 0; color: #868686; font-size: 14px; line-height: 1.6;"><strong>Tồn kho dư đầu năm:</strong> Tăng chi phí vốn do ảnh hưởng Tết.<br><strong>Tăng trưởng không bền vững:</strong> Spike tháng 3 có thể phụ thuộc vào khuyến mãi ngắn hạn.</p>
      </div>
    </div>
  </div>
</div>
QUY TẮC NGHIÊM NGẶT:
Giữ nguyên
Hãy tạo HTML code trực quan và hoàn toàn độc lập từ nội dung được cung cấp!

Dữ liệu phân tích cho {sectionName}:
- Điểm số: {score}/100
- Phân tích chi tiết: {analysis}

Hãy tạo HTML báo cáo trực quan cho phần {sectionName} dựa trên dữ liệu trên.`);

	// Các phần cấu hình
	const sections = [
		{ key: 'financial', name: 'Tài chính', color: '#52c41a' },
		{ key: 'business', name: 'Kinh doanh', color: '#1890ff' },
		{ key: 'operation', name: 'Vận hành', color: '#fa8c16' },
		{ key: 'hr', name: 'Nhân sự', color: '#eb2f96' },
		{ key: 'overview', name: 'Tổng quan', color: '#722ed1' },
	];

	// Expose handleSaveConfig function to parent component
	useImperativeHandle(ref, () => ({
		handleSaveConfig: handleSaveConfig,
		updateLastAnalyzeTime: updateLastAnalyzeTime
	}));

	// Tạo ID động dựa trên unit được chọn
	const getDefaultItemId = () => {
		// Nếu chọn "All" hoặc không có unit nào được chọn, sử dụng ID mặc định
		if (selectedStoreTags.includes('All') || selectedStoreTags.length === 0) {
			return 100000;
		}

		// Nếu có nhiều unit được chọn, sử dụng unit đầu tiên
		const primaryUnit = selectedStoreTags[0];

		// Tạo ID dựa trên tên unit (hash function đơn giản)
		let hash = 0;
		for (let i = 0; i < primaryUnit.length; i++) {
			const char = primaryUnit.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}

		// Đảm bảo ID luôn dương và trong khoảng 100000-999999
		const finalId = 100000 + Math.abs(hash) % 900000;
		return finalId;
	};

	// Lấy tên hiển thị cho unit
	const getUnitDisplayName = () => {
		if (selectedStoreTags.includes('All') || selectedStoreTags.length === 0) {
			return 'Tổng Quan';
		}

		if (selectedStoreTags.length === 1) {
			return selectedStoreTags[0];
		}

		return `${selectedStoreTags[0]} (+${selectedStoreTags.length - 1})`;
	};

	// Hàm convert period data từ KPI2Content.jsx
	const convertPeriodData = (kpiData, targetPeriod) => {
		const { period: sourcePeriod, tableData } = kpiData;

		if (sourcePeriod == targetPeriod) {
			return tableData;
		}

		const periodConversions = {
			weekToDay: (data) => {
				const result = [];
				data.forEach((item) => {
					const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
					if (!matches) return;
					const weekNum = parseInt(matches[1]);
					const year = parseInt(matches[2]);
					const firstDayOfWeek = getFirstDayOfWeek(weekNum, year);
					const dailyValue = item.value / 7;
					for (let i = 0; i < 7; i++) {
						const currentDate = new Date(firstDayOfWeek);
						currentDate.setDate(firstDayOfWeek.getDate() + i);
						result.push({
							date: formatDate(currentDate),
							value: dailyValue,
						});
					}
				});
				return result;
			},
			monthToDay: (data) => {
				const result = [];
				data.forEach((item) => {
					const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
					if (!matches) return;
					const monthNum = parseInt(matches[1]);
					const year = parseInt(matches[2]);
					const daysInMonth = getDaysInMonth(monthNum - 1, year);
					const dailyValue = item.value / daysInMonth;
					for (let i = 0; i < daysInMonth; i++) {
						const currentDate = new Date(year, monthNum - 1, i + 1);
						result.push({
							date: formatDate(currentDate),
							value: dailyValue,
						});
					}
				});
				return result;
			},
			monthToWeek: (data) => {
				const result = [];
				data.forEach((item) => {
					const matches = item.date.match(/Tháng (\d+)\/(\d+)/);
					if (!matches) return;
					const monthNum = parseInt(matches[1]);
					const year = parseInt(matches[2]);
					const weeksInMonth = 4;
					const weeklyValue = item.value / weeksInMonth;
					const weekNumbers = getWeeksInMonth(monthNum - 1, year);
					weekNumbers.forEach((weekNum) => {
						result.push({
							date: `Tuần ${weekNum}/${year}`,
							value: weeklyValue,
						});
					});
				});
				return result;
			},
			dayToWeek: (data) => {
				const weekMap = new Map();
				data.forEach((item) => {
					const [day, month, year] = item.date.split('/').map(Number);
					const weekNum = getWeekNumber(new Date(year, month - 1, day));
					const weekKey = `Tuần ${weekNum}/${year}`;
					if (weekMap.has(weekKey)) {
						weekMap.set(weekKey, weekMap.get(weekKey) + item.value);
					} else {
						weekMap.set(weekKey, item.value);
					}
				});
				return Array.from(weekMap.entries()).map(([date, value]) => ({
					date,
					value,
				}));
			},
			dayToMonth: (data) => {
				const monthMap = new Map();
				data.forEach((item) => {
					const [day, month, year] = item.date.split('/').map(Number);
					const monthKey = `Tháng ${month}/${year}`;
					if (monthMap.has(monthKey)) {
						monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
					} else {
						monthMap.set(monthKey, item.value);
					}
				});
				return Array.from(monthMap.entries()).map(([date, value]) => ({
					date,
					value,
				}));
			},
			weekToMonth: (data) => {
				const monthMap = new Map();
				data.forEach((item) => {
					const matches = item.date.match(/Tuần (\d+)\/(\d+)/);
					if (!matches) return;
					const weekNum = parseInt(matches[1]);
					const year = parseInt(matches[2]);
					const monthNum = Math.ceil(weekNum / 4);
					const monthKey = `Tháng ${monthNum}/${year}`;
					if (monthMap.has(monthKey)) {
						monthMap.set(monthKey, monthMap.get(monthKey) + item.value);
					} else {
						monthMap.set(monthKey, item.value);
					}
				});
				return Array.from(monthMap.entries()).map(([date, value]) => ({
					date,
					value,
				}));
			},
		};

		function formatDate(date) {
			return `${String(date.getDate()).padStart(2, '0')}/${String(
				date.getMonth() + 1,
			).padStart(2, '0')}/${date.getFullYear()}`;
		}

		function getDaysInMonth(month, year) {
			return new Date(year, month + 1, 0).getDate();
		}

		function getFirstDayOfWeek(weekNum, year) {
			const firstDayOfYear = new Date(year, 0, 1);
			const daysToAdd = (weekNum - 1) * 7;
			const firstDayOfWeek = new Date(firstDayOfYear);
			firstDayOfWeek.setDate(firstDayOfYear.getDate() + daysToAdd);
			return firstDayOfWeek;
		}

		function getWeekNumber(date) {
			const d = new Date(
				Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
			);
			const dayNum = d.getUTCDay() || 7;
			d.setUTCDate(d.getUTCDate() + 4 - dayNum);
			const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
			return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
		}

		function getWeeksInMonth(month, year) {
			const firstDay = new Date(year, month, 1);
			const lastDay = new Date(year, month + 1, 0);
			const firstWeek = getWeekNumber(firstDay);
			const lastWeek = getWeekNumber(lastDay);
			const weekNumbers = [];
			for (let week = firstWeek; week <= lastWeek; week++) {
				weekNumbers.push(week);
			}
			return weekNumbers;
		}

		const conversionKey = `${sourcePeriod}To${targetPeriod.charAt(0).toUpperCase() + targetPeriod.slice(1)}`;
		if (periodConversions[conversionKey]) {
			return periodConversions[conversionKey](tableData);
		} else {
			console.error(
				`Conversion from ${sourcePeriod} to ${targetPeriod} is not supported`,
			);
			return tableData;
		}
	};

	useEffect(() => {
		loadDefaultItem();
	}, [selectedStoreTags]); // Reload khi selectedStoreTags thay đổi

	// Effect để kiểm tra kích thước màn hình
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth < 768);
		};

		// Kiểm tra lần đầu
		checkScreenSize();

		// Lắng nghe sự kiện resize
		window.addEventListener('resize', checkScreenSize);

		// Cleanup
		return () => {
			window.removeEventListener('resize', checkScreenSize);
		};
	}, []);

	// Load KPI2 Calculators khi selectedStoreTags thay đổi
	useEffect(() => {
		loadKpi2Calculators();
	}, [selectedStoreTags]); // Reload khi selectedStoreTags thay đổi

	// Effect để cập nhật giao diện khi defaultItem thay đổi
	useEffect(() => {
		if (defaultItem) {
			// Cập nhật form values
			form.setFieldsValue({
				title: defaultItem.name || defaultItem.title || `Dashboard ${getUnitDisplayName()}`,
			});

			// Cập nhật config form nếu có settings
			if (defaultItem.settings) {
				// Đảm bảo cấu trúc đúng cho form
				const normalizedSettings = {
					...defaultItem.settings,
					financial: {
						kpis: defaultItem.settings.financial?.kpis || [],
						kpiWeights: (typeof defaultItem.settings.financial?.kpiWeights === 'object' && defaultItem.settings.financial?.kpiWeights !== null)
							? defaultItem.settings.financial.kpiWeights
							: {},
					},
					business: {
						kpis: defaultItem.settings.business?.kpis || [],
						kpiWeights: (typeof defaultItem.settings.business?.kpiWeights === 'object' && defaultItem.settings.business?.kpiWeights !== null)
							? defaultItem.settings.business.kpiWeights
							: {},
					},
					operation: {
						kpis: defaultItem.settings.operation?.kpis || [],
						kpiWeights: (typeof defaultItem.settings.operation?.kpiWeights === 'object' && defaultItem.settings.operation?.kpiWeights !== null)
							? defaultItem.settings.operation.kpiWeights
							: {},
					},
					hr: {
						kpis: defaultItem.settings.hr?.kpis || [],
						kpiWeights: (typeof defaultItem.settings.hr?.kpiWeights === 'object' && defaultItem.settings.hr?.kpiWeights !== null)
							? defaultItem.settings.hr.kpiWeights
							: {},
					},
					overview: {
						kpis: defaultItem.settings.overview?.kpis || [],
						kpiWeights: (typeof defaultItem.settings.overview?.kpiWeights === 'object' && defaultItem.settings.overview?.kpiWeights !== null)
							? defaultItem.settings.overview.kpiWeights
							: {},
					},
				};

				console.log('Normalized settings:', normalizedSettings);
				configForm.setFieldsValue(normalizedSettings);

				// Cập nhật AI model nếu có
				if (defaultItem.settings.aiModel) {
					setSelectedAIModel(defaultItem.settings.aiModel);
				}
				// Cập nhật AI prompt nếu có
				if (defaultItem.settings.aiPrompt) {
					setAiPrompt(defaultItem.settings.aiPrompt);
				}
				// Cập nhật selectedKpis state
				const kpis = {
					financial: normalizedSettings.financial.kpis,
					business: normalizedSettings.business.kpis,
					operation: normalizedSettings.operation.kpis,
					hr: normalizedSettings.hr.kpis,
					overview: normalizedSettings.overview.kpis,
				};
				setSelectedKpis(kpis);

				// Cập nhật kpiWeights state
				const weights = {
					financial: normalizedSettings.financial.kpiWeights,
					business: normalizedSettings.business.kpiWeights,
					operation: normalizedSettings.operation.kpiWeights,
					hr: normalizedSettings.hr.kpiWeights,
					overview: normalizedSettings.overview.kpiWeights,
				};
				setKpiWeights(weights);
			} else {
				// Nếu không có settings, set default values
				const defaultSettings = {
					financial: { kpis: [], kpiWeights: {} },
					business: { kpis: [], kpiWeights: {} },
					operation: { kpis: [], kpiWeights: {} },
					hr: { kpis: [], kpiWeights: {} },
					overview: { kpis: [], kpiWeights: {} },
					formula: '(financial + business + operation + hr) / 4',
					aiModel: 'gpt-5-mini-2025-08-07',
					aiPrompt: aiPrompt,
				};
				configForm.setFieldsValue(defaultSettings);
				// Cập nhật selectedKpis state với giá trị mặc định
				setSelectedKpis({
					financial: [],
					business: [],
					operation: [],
					hr: [],
					overview: [],
				});

				// Cập nhật kpiWeights state với giá trị mặc định
				setKpiWeights({
					financial: {},
					business: {},
					operation: {},
					hr: {},
					overview: {},
				});
			}

			// Cập nhật scores nếu có analysis (chuẩn hóa cho bản cũ thiếu overview)
			if (defaultItem.analysis) {
				const normalizedAnalysis = {
					financial: defaultItem.analysis.financial || { score: 0, analysis: '' },
					business: defaultItem.analysis.business || { score: 0, analysis: '' },
					operation: defaultItem.analysis.operation || { score: 0, analysis: '' },
					hr: defaultItem.analysis.hr || { score: 0, analysis: '' },
					overview: defaultItem.analysis.overview || { score: 0, analysis: '' },
					total: typeof defaultItem.analysis.total === 'number' ? defaultItem.analysis.total : 0,
				};
				setScores(normalizedAnalysis);
			}
		}
	}, [defaultItem]);

	// Effect để cập nhật danh sách hệ số khi KPI được chọn
	useEffect(() => {
		// Force re-render để cập nhật danh sách hệ số
		setForceUpdate(prev => prev + 1);
	}, [configForm.getFieldValue(['financial', 'kpis']), configForm.getFieldValue(['business', 'kpis']), configForm.getFieldValue(['operation', 'kpis']), configForm.getFieldValue(['hr', 'kpis']), configForm.getFieldValue(['overview', 'kpis'])]);

	const loadDefaultItem = async () => {
		// Tránh gọi nhiều lần cùng lúc
		if (isLoadingItem) {
			return;
		}

		setIsLoadingItem(true);
		try {
			const itemId = getDefaultItemId();

			// Thử load item từ database
			const item = await getDashBoardItemById(itemId);
			setDefaultItem(item);
			form.setFieldsValue({
				title: item.name || item.title || `Dashboard ${getUnitDisplayName()}`,
			});
			if (item.settings) {
				configForm.setFieldsValue(item.settings);
				// Load model AI từ settings
				if (item.settings.aiModel) {
					setSelectedAIModel(item.settings.aiModel);
				}
				// Load dữ liệu analysis nếu có
				if (item.analysis) {
					setScores(item.analysis);
				} else {
					// Tính điểm nếu có cấu hình nhưng chưa có analysis
					calculateScores(item.settings);
				}
			}
		} catch (error) {
			// Nếu lỗi 404 (không tìm thấy), tạo item mới (không log error vì đây là behavior bình thường)
			if (error.response?.status === 404) {
				await createDefaultItem();
			} else {
				// Nếu lỗi khác, log error và thử tạo item mới
				console.error('Error loading default item:', error);
				await createDefaultItem();
			}
		} finally {
			setIsLoadingItem(false);
		}
	};

	const createDefaultItem = async () => {
		try {
			const itemId = getDefaultItemId();
			const unitName = getUnitDisplayName();

			const defaultSettings = {
				financial: { kpis: [], kpiWeights: {} },
				business: { kpis: [], kpiWeights: {} },
				operation: { kpis: [], kpiWeights: {} },
				hr: { kpis: [], kpiWeights: {} },
				overview: { kpis: [], kpiWeights: {} },
				formula: '(financial + business + operation + hr) / 4',
				aiModel: 'gpt-5-mini-2025-08-07',
				aiPrompt: aiPrompt,
				// Lưu thông tin unit để có thể filter dữ liệu sau này
				selectedStoreTags: selectedStoreTags,
			};

			const newItem = await createDashBoardItem({
				id: itemId,
				name: `Dashboard ${unitName}`,
				type: 'default',
				settings: defaultSettings,
				analysis: {
					financial: { score: 0, analysis: '' },
					business: { score: 0, analysis: '' },
					operation: { score: 0, analysis: '' },
					hr: { score: 0, analysis: '' },
					total: 0,
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			// Cập nhật state ngay lập tức
			setDefaultItem(newItem);
			setScores(newItem.analysis || {
				financial: { score: 0, analysis: '' },
				business: { score: 0, analysis: '' },
				operation: { score: 0, analysis: '' },
				hr: { score: 0, analysis: '' },
				overview: { score: 0, analysis: '' },
				total: 0,
			});

			// Cập nhật form values
			form.setFieldsValue({ title: newItem.name || newItem.title });
			configForm.setFieldsValue(defaultSettings);

			// Reset loading state sau khi tạo thành công
			setIsLoadingItem(false);
		} catch (error) {
			console.error('Error creating default item:', error);

			// Nếu không thể tạo item trong database, tạo item tạm thời trong state
			const itemId = getDefaultItemId();
			const unitName = getUnitDisplayName();

			const tempItem = {
				id: itemId,
				name: `Dashboard ${unitName}`,
				type: 'default',
				settings: {
					financial: { kpis: [], kpiWeights: {} },
					business: { kpis: [], kpiWeights: {} },
					operation: { kpis: [], kpiWeights: {} },
					hr: { kpis: [], kpiWeights: {} },
					overview: { kpis: [], kpiWeights: {} },
					formula: '(financial + business + operation + hr) / 4',
					aiModel: 'gpt-5-mini-2025-08-07',
					aiPrompt: aiPrompt,
					selectedStoreTags: selectedStoreTags,
				},
				analysis: {
					financial: { score: 0, analysis: '' },
					business: { score: 0, analysis: '' },
					operation: { score: 0, analysis: '' },
					hr: { score: 0, analysis: '' },
					overview: { score: 0, analysis: '' },
					total: 0,
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Cập nhật state ngay lập tức
			setDefaultItem(tempItem);
			setScores(tempItem.analysis || {
				financial: { score: 0, analysis: '' },
				business: { score: 0, analysis: '' },
				operation: { score: 0, analysis: '' },
				hr: { score: 0, analysis: '' },
				overview: { score: 0, analysis: '' },
				total: 0,
			});

			// Cập nhật form values
			form.setFieldsValue({ title: tempItem.name });
			configForm.setFieldsValue(tempItem.settings);

			// Reset loading state sau khi tạo temp item
			setIsLoadingItem(false);
		}
	};

	const loadKpi2Calculators = async () => {
		try {
			// Load tất cả dashboard items để tìm các chart items
			const allDashboardItems = await getAllDashBoardItems();
			// Filter các chart items theo unit được chọn
			const chartItems = allDashboardItems.filter(item => {
				// Chỉ lấy items có type = 'chart' và idData (KPI2 Calculator ID)
				if (item.type !== 'chart' || !item.idData) return false;

				// Filter theo unit nếu có storeCategory
				if (selectedStoreTags.includes('All') || selectedStoreTags.length === 0) {
					return true; // Hiển thị tất cả nếu chọn "All"
				}

				// Kiểm tra storeCategory (trường chính để filter theo unit)
				const itemStoreCategory = item.storeCategory;
				const matches = selectedStoreTags.some(tag => {
					const match = itemStoreCategory === tag;
					return match;
				});
				return matches;
			});

			// Lấy danh sách KPI2 Calculator IDs từ chart items
			const kpi2CalculatorIds = [...new Set(chartItems.map(item => item.idData))];
			// Debug: Log tất cả chart items
			const allChartItems = allDashboardItems.filter(item => item.type === 'chart' && item.idData);
			// Load chi tiết các KPI2 Calculator được sử dụng
			const kpi2Promises = kpi2CalculatorIds.map(async (kpiId) => {
				try {
					const kpiDetail = await getKpi2CalculatorById(kpiId);
					// Đảm bảo tags được include
					return {
						...kpiDetail,
						tags: kpiDetail.tags || []
					};
				} catch (error) {
					console.error(`Error loading KPI2 Calculator ${kpiId}:`, error);
					return null;
				}
			});

			const kpi2Calculators = (await Promise.all(kpi2Promises)).filter(Boolean);
			setKpi2Calculators(kpi2Calculators);

			// Load dữ liệu cho từng KPI2 Calculator
			const dataPromises = kpi2Calculators.map(async (kpi) => {
				try {
					const kpiDetail = await getKpi2CalculatorById(kpi.id);

					// Tính toán dữ liệu bảng giống như trong KPI2Content.jsx
					let calculatedTableData = [];

					if (kpiDetail && kpiDetail.calc && kpiDetail.kpiList && kpiDetail.kpiList.length > 0) {
						try {
							// Parse công thức
							const calcData = JSON.parse(kpiDetail.calc);
							const formula = calcData.formula;
							const variables = calcData.variables;

							if (formula && variables) {
								// Load dữ liệu từ các KPI Calculator được chọn
								const rawDataByVariable = {};

								for (const kpiId of kpiDetail.kpiList) {
									try {
										const kpiData = await getKpiCalculatorById(kpiId);
										if (kpiData.period && kpiData.tableData) {
											// Convert period data (giống như trong KPI2Content)
											const convertedData = convertPeriodData(kpiData, kpiDetail.period || 'day');
											const variableKey = Object.keys(variables).find(
												(key) => variables[key].type === 'kpi' && variables[key].id == kpiId,
											);
											if (variableKey) rawDataByVariable[variableKey] = convertedData;
										}
									} catch (error) {
										console.error(`Error loading KPI data for ${kpiId}:`, error);
									}
								}

								// Tính toán kết quả giống như trong KPI2Content
								const allDates = new Set();
								Object.values(rawDataByVariable).forEach((dataArray) =>
									dataArray.forEach((item) => allDates.add(item.date)),
								);

								const sortedDates = Array.from(allDates).sort((a, b) => {
									if (a.startsWith('Tuần') && b.startsWith('Tuần')) {
										const [aWeek, aYear] = a.replace('Tuần ', '').split('/').map(Number);
										const [bWeek, bYear] = b.replace('Tuần ', '').split('/').map(Number);
										return aYear !== bYear ? aYear - bYear : aWeek - bWeek;
									} else if (a.startsWith('Tháng') && b.startsWith('Tháng')) {
										const [aMonth, aYear] = a.replace('Tháng ', '').split('/').map(Number);
										const [bMonth, bYear] = b.replace('Tháng ', '').split('/').map(Number);
										return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
									} else if (a.includes('/') && b.includes('/') && a.split('/').length == 3 && b.split('/').length == 3) {
										const [aDay, aMonth, aYear] = a.split('/').map(Number);
										const [bDay, bMonth, bYear] = b.split('/').map(Number);
										if (aYear !== bYear) return aYear - bYear;
										if (aMonth !== bMonth) return aMonth - bMonth;
										return aDay - bDay;
									}
									return a.localeCompare(b);
								});

								calculatedTableData = sortedDates.map(date => {
									const row = { date };
									Object.keys(variables).forEach((varKey) => {
										if (rawDataByVariable[varKey]) {
											const dataPoint = rawDataByVariable[varKey].find(
												(item) => item.date == date,
											);
											row[varKey] = dataPoint ? dataPoint.value : 0;
										} else {
											row[varKey] = 0;
										}
									});
									row.value = evaluate(formula, row);
									return row;
								});
							}
						} catch (error) {
							console.error(`Error calculating table data for KPI2 ${kpi.id}:`, error);
						}
					}

					return {
						id: kpi.id,
						data: {
							...kpiDetail,
							calculatedTableData: calculatedTableData,
						},
					};
				} catch (error) {
					console.error(`Error loading data for KPI2 ${kpi.id}:`, error);
					return {
						id: kpi.id,
						data: null,
					};
				}
			});

			const results = await Promise.all(dataPromises);
			const dataMap = {};
			results.forEach(result => {
				dataMap[result.id] = result.data;
			});
			setKpi2Data(dataMap);
		} catch (error) {
			console.error('Error loading KPI2 calculators:', error);
		}
	};

	const calculateScores = async (settings) => {
		if (!settings) return;

		const newScores = {
			financial: { score: 0, analysis: '' },
			business: { score: 0, analysis: '' },
			operation: { score: 0, analysis: '' },
			hr: { score: 0, analysis: '' },
			overview: { score: 0, analysis: '' },
			total: 0,
		};

		// Lấy model AI từ settings hoặc sử dụng mặc định
		const aiModel = settings.aiModel || selectedAIModel || 'gpt-5-mini-2025-08-07';
		// Lấy prompt AI từ settings hoặc sử dụng mặc định
		const aiPromptTemplate = settings.aiPrompt || aiPrompt || 'Dựa trên phân tích chi tiết sau về {sectionName}, hãy tạo một tổng quan dạng markdown (không quá 250 từ) về tình hình {sectionNameLower} của doanh nghiệp:\n\n{analysis}';

		// Tính điểm cho từng phần
		for (const section of sections) {
			const sectionSettings = settings[section.key];
			if (sectionSettings && sectionSettings.kpis && sectionSettings.kpis.length > 0) {
				try {
					// Lấy dữ liệu KPI2 Calculator được chọn từ state
					const selectedKpis = sectionSettings.kpis.map(kpiId =>
						kpi2Calculators.find(kpi => kpi.id === kpiId),
					).filter(Boolean);

					// Lấy hệ số cho từng KPI từ settings
					const kpiWeights = sectionSettings.kpiWeights || {};

					// Tính điểm dựa trên hệ số của từng KPI
					let sectionScore = 0;
					let sectionAnalysis = ``;

					// Tìm chart items có analysis để lấy điểm thực tế
					if (selectedKpis.length > 0) {
						const allDashboardItems = await getAllDashBoardItems();
						const chartItemsWithAnalysis = selectedKpis.map(kpi => {
							const chartItem = allDashboardItems.find(item =>
								item.type === 'chart' &&
								item.idData === kpi.id &&
								item.analysis &&
								item.analysis.score !== undefined &&
								item.analysis.answer,
							);
							return chartItem ? { kpi, chartItem } : null;
						}).filter(Boolean);

						if (chartItemsWithAnalysis.length > 0) {
							// Tính điểm có trọng số cho từng KPI
							let totalWeightedScore = 0;
							let totalWeight = 0;
							const kpiDetails = [];

							chartItemsWithAnalysis.forEach(item => {
								const kpiName = item.kpi.name;
								const kpiId = item.kpi.id;
								const score = item.chartItem.analysis.score;
								const weight = kpiWeights[kpiId] || 1; // Hệ số của KPI này

								// Tính điểm có trọng số
								const weightedScore = score * (weight / 100);
								totalWeightedScore += weightedScore;
								totalWeight += weight;

								kpiDetails.push(` **${kpiName}**: ${score}/100 (Hệ số: ${weight})`);
							});

							// Tính điểm cuối cùng của phần
							if (totalWeight > 0) {
								sectionScore = Math.round(totalWeightedScore * (100 / totalWeight));
							} else {
								// Nếu không có hệ số nào, tính trung bình đơn giản
								const averageScore = chartItemsWithAnalysis.reduce((sum, item) => sum + item.chartItem.analysis.score, 0) / chartItemsWithAnalysis.length;
								sectionScore = Math.round(averageScore);
							}

							// Lấy analysis.answer từ chart items
							const analysisAnswers = chartItemsWithAnalysis.map(item => {
								const kpiName = item.kpi.name;
								const analysis = item.chartItem.analysis.answer;
								const info = item.chartItem.analysis.info;
								return `## ${kpiName}\n\n${analysis}\n\n${info}`;
							}).join('\n\n---\n\n');

							sectionAnalysis += `# Phân tích chi tiết:\n ${kpiDetails} \n${analysisAnswers}`;
						} else {
							// Nếu không có analysis, tính điểm dựa trên hệ số trung bình
							const weights = selectedKpis.map(kpi => kpiWeights[kpi.id] || 1);
							const averageWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;
							sectionScore = Math.round(averageWeight);
							sectionAnalysis += `**Lưu ý**: Các chỉ số này chưa có dữ liệu phân tích từ AI. Điểm được tính dựa trên hệ số đã thiết lập.`;
						}
					} else {
						sectionAnalysis += `Chưa chọn chỉ số nào cho phần ${section.name}`;
					}

					newScores[section.key] = {
						score: Math.min(100, Math.max(0, sectionScore)),
						analysis: sectionAnalysis,
					};
				} catch (error) {
					console.error(`Error calculating score for ${section.key}:`, error);
					newScores[section.key] = { score: 0, analysis: 'Lỗi khi phân tích' };
				}
			}
		}

		// Tính điểm tổng quát: dùng điểm của phần Tổng quan nếu có, nếu không fallback trung bình 4 phần
		if (settings.overview && (settings.overview.kpis?.length || 0) > 0) {
			newScores.total = newScores.overview.score;
		} else {
			newScores.total = (newScores.financial.score + newScores.business.score + newScores.operation.score + newScores.hr.score) / 4;
		}

		// Gửi analysis cho AI để tạo HTML báo cáo cho từng phần
		try {
			for (const section of sections) {
				const sectionData = newScores[section.key];
				if (sectionData && sectionData.analysis && sectionData.analysis.trim()) {
					// Thay thế các placeholder trong prompt template
					const finalPrompt = aiPromptTemplate
						.replace(/{sectionName}/g, section.name)
						.replace(/{score}/g, sectionData.score)
						.replace(/{analysis}/g, sectionData.analysis);

					const aiResponse = await aiGen2(finalPrompt, null, aiModel);
					if (aiResponse && aiResponse.result) {
						// Lưu HTML response từ AI
						newScores[section.key].analysis = aiResponse.result;
						
						// Cập nhật token đã sử dụng
						await updateUsedTokenApp(aiResponse, aiModel, 'analysis-review');
					}
				}
			}
		} catch (error) {
			console.error('Error generating AI HTML report:', error);
		}

		setScores(newScores);
		return newScores; // Trả về scores để sử dụng trong handleSaveConfig
	};

	const handleSaveConfig = async () => {
		try {
			setLoading(true);
			const values = await configForm.validateFields();

			// Merge form values với kpiWeights state
			const mergedSettings = {
				...values,
				financial: {
					kpis: values.financial?.kpis || [],
					kpiWeights: kpiWeights.financial,
				},
				business: {
					kpis: values.business?.kpis || [],
					kpiWeights: kpiWeights.business,
				},
				operation: {
					kpis: values.operation?.kpis || [],
					kpiWeights: kpiWeights.operation,
				},
				hr: {
					kpis: values.hr?.kpis || [],
					kpiWeights: kpiWeights.hr,
				},
				overview: {
					kpis: values.overview?.kpis || [],
					kpiWeights: kpiWeights.overview,
				},
				// formula removed from logic usage; keep if exists for backward compat but unused
				aiModel: selectedAIModel,
				aiPrompt: aiPrompt,
				selectedStoreTags: selectedStoreTags,
			};

			// Tính điểm trước và lấy kết quả
			const calculatedScores = await calculateScores(mergedSettings);

			// Lưu cả settings và analysis cùng lúc
			const updatedItem = {
				...defaultItem,
				settings: mergedSettings,
				analysis: calculatedScores, // Sử dụng scores đã được tính từ calculateScores
				updatedAt: new Date().toISOString(),
			};

			// Thử cập nhật item trong database
			try {
				const savedItem = await updateDashBoardItem(updatedItem);
				setDefaultItem(savedItem);
			} catch (updateError) {
				// Nếu không thể cập nhật (có thể item chưa tồn tại), thử tạo mới
				if (updateError.response?.status === 404) {
					const createdItem = await createDashBoardItem(updatedItem);
					setDefaultItem(createdItem);
				} else {
					throw updateError;
				}
			}

			setIsConfigModalVisible(false);
			onUpdate && onUpdate();
		} catch (error) {
			console.error('Error saving config:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSaveConfigWithConfirm = () => {
		Modal.confirm({
			title: 'Xác nhận lưu cấu hình',
			content: 'Thao tác sẽ thực hiện tính điểm và phân tích lại thẻ tổng quan.',
			okText: 'Xác nhận',
			cancelText: 'Hủy',
			onOk: handleSaveConfig,
		});
	};

	const handleSaveEdit = async () => {
		try {
			setLoading(true);
			const values = await form.validateFields();

			const updatedItem = {
				...defaultItem,
				name: values.title,
				updatedAt: new Date().toISOString(),
			};

			// Thử cập nhật item trong database
			try {
				const savedItem = await updateDashBoardItem(updatedItem);
				setDefaultItem(savedItem);
			} catch (updateError) {
				// Nếu không thể cập nhật (có thể item chưa tồn tại), thử tạo mới
				if (updateError.response?.status === 404) {
					const createdItem = await createDashBoardItem(updatedItem);
					setDefaultItem(createdItem);
				} else {
					throw updateError;
				}
			}

			setIsEditModalVisible(false);
			onUpdate && onUpdate();
		} catch (error) {
			console.error('Error saving edit:', error);
		} finally {
			setLoading(false);
		}
	};

	const updateLastAnalyzeTime = async () => {
		try {
			if (!defaultItem) return;

			const currentTime = new Date().toISOString();
			const updatedItem = {
				...defaultItem,
				createAt: currentTime,
				updateAt: currentTime,
			};

			// Cập nhật item trong database
			try {
				const savedItem = await updateDashBoardItem(updatedItem);
				setDefaultItem(savedItem);
			} catch (updateError) {
				// Nếu không thể cập nhật, thử tạo mới
				if (updateError.response?.status === 404) {
					const createdItem = await createDashBoardItem(updatedItem);
					setDefaultItem(createdItem);
				} else {
					throw updateError;
				}
			}

			// Thông báo cho parent component về việc cập nhật
			onUpdate && onUpdate();
		} catch (error) {
			console.error('Error updating last analyze time:', error);
			throw error;
		}
	};

	// Hàm chuyển đổi điểm số sang hệ ABCD
	const getGradeFromScore = (score) => {
		if (score >= 75) return { grade: 'A', color: '#58B16A' };
		if (score >= 50) return { grade: 'B', color: '#1172df' };
		if (score >= 25) return { grade: 'C', color: '#fa8c16' };
		if (score > 0) return { grade: 'D', color: '#f5222d' };
		return { grade: 'N/A', color: '#d8d8d8' };
	};

	const renderScoreDisplay = () => {
		const totalGrade = getGradeFromScore(scores.total);

		return (
			<div className={componentStyles.scoreDisplayContainer}>
				{loading || isLoadingItem ? (
					<div className={componentStyles.loadingContainer}>
						<div className={componentStyles.loadingSpinner} />
						<Text className={componentStyles.loadingText}>
							{isLoadingItem ? 'Đang tạo dashboard mới...' : 'Đang tính toán điểm số...'}
						</Text>
					</div>
				) : (
					<Row gutter={[8, 8]}>
						<Col xl={10} md={22} className={componentStyles.totalContainer} style={{padding: '0px 30px 0 30px'}}>
							{/* Điểm tổng quát */}
							<div 
								className={`${componentStyles.totalScoreContainer} ${componentStyles.cardHoverable}`}
								style={{ border: `3px solid ${totalGrade.color}` }}
								onClick={() => {
									if (!isMobile) {
										setSelectedSection({ key: 'overview', name: 'Tổng quan', color: '#722ed1' });
										setShowDetailModal(true);
									}
								}}
							>
								<div className={componentStyles.totalScoreLabel}>
									Tổng quan
								</div>
								<Divider className={componentStyles.totalScoreDivider}/>
								<div className={componentStyles.totalScoreGrade}>
									{totalGrade.grade}
								</div>
							</div>
							<div className={componentStyles.helpText}>
								(*) Bấm vào từng điểm thành phần để xem báo cáo theo lĩnh vực chuyên môn
							</div>
						</Col>
						<Col xl={14}>
							<Row gutter={[8, 8]}>
				{sections.filter(s => s.key !== 'overview').map((section) => {
					const sectionScore = scores?.[section.key]?.score ?? 0;
					const sectionGrade = getGradeFromScore(sectionScore);
									return (
										<Col span={12} key={section.key}>
											<Card
												size="small"
												className={`${componentStyles.sectionCard} ${componentStyles.cardHoverable}`}
												style={{
													borderTop: `8px solid ${sectionGrade.color}`,
													background: `${sectionGrade.color}05`,
												}}
												hoverable
												onClick={() => {
													// Chỉ cho phép mở modal trên màn hình >= 768px
													if (!isMobile) {
														setSelectedSection(section);
														setShowDetailModal(true);
													}
												}}
											>
												<Title level={5} className={componentStyles.sectionTitle}>
													{section.name}
												</Title>
												<Title 
													level={3}
													className={componentStyles.sectionGrade}
													style={{ color: sectionGrade.color }}
												>
													{sectionGrade.grade}
												</Title>
											</Card>
										</Col>
									);
								})}
							</Row>
						</Col>
						<Col span={24} className={componentStyles.legendContainer}>
							<p className={componentStyles.legendParagraph}>
								A - Tích cực về diễn biến hoặc so sánh với các mục tiêu/ benchmark</p>
							<p className={componentStyles.legendParagraph}>
								B - Trung bình, không rõ về xu hướng tiêu cực/ tích cực</p>
							<p className={componentStyles.legendParagraph}>
								C - Xu hướng không tốt</p>
							<p className={componentStyles.legendParagraph}>
								D - Tiêu cực hoặc cần hành động</p>
							<p className={componentStyles.legendParagraph}>
								N/A - Không đủ thông tin đánh giá</p>
						</Col>
					</Row>
				)}
			</div>
		);
	};

	if (!defaultItem) {
		return <div>Loading...</div>;
	}
	// Function to render HTML content safely
	const renderHTML = (content) => {
		if (!content) return '';
		try {
			// Kiểm tra xem content có phải là HTML không
			const isHTML = content.includes('<div') || content.includes('<h') || content.includes('<p');
			if (isHTML) {
				// Nếu là HTML, sanitize và trả về
				const sanitizedHtml = DOMPurify.sanitize(content, {
					ALLOWED_TAGS: ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em', 'br', 'svg', 'path', 'circle', 'line', 'polyline', 'rect', 'g'],
					ALLOWED_ATTR: ['style', 'class', 'xmlns', 'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points', 'd']
				});
				return sanitizedHtml;
			} else {
				// Nếu là markdown, convert sang HTML
				const htmlContent = marked(content);
				const sanitizedHtml = DOMPurify.sanitize(htmlContent);
				return sanitizedHtml;
			}
		} catch (error) {
			console.error('Error rendering content:', error);
			return content; // Fallback to plain text
		}
	};
	return (
		<>
			<div className={componentStyles.mainContainer}>
				<Title level={4} className={componentStyles.title}>
					{defaultItem.name || `Dashboard ${getUnitDisplayName()}`}

					<Tooltip title="Điểm chấm chia theo các khối chức năng, mặc định tuân thủ theo quy tắc Balanced Score Card. Điểm chấm tổng quan là tính toán trung bình (có thể điều chỉnh hệ số trọng số) của 4 khía cạnh. Điểm chấm của mỗi khía cạnh là tính toán trung bình (có thể điều chỉnh hệ số trọng số) của các chỉ số được gắn theo	">
						<Button
							type="text"
							size="small"
							className={componentStyles.helpButton}
						>
							(?)
						</Button>
					</Tooltip>
				</Title>
				{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
					<div className={componentStyles.buttonGroup}>
						<Button
							icon={<EditOutlined />}
							size="small"
							onClick={() => setIsEditModalVisible(true)}
						>
						</Button>
						<Button
							icon={<SettingOutlined />}
							size="small"
							onClick={() => setIsConfigModalVisible(true)}
						>
						</Button>
					</div>
				)
				}
			</div>
			{renderScoreDisplay()}

			{/* Modal sửa tên */}
			<Modal
				title="Sửa tên Dashboard"
				open={isEditModalVisible}
				onOk={handleSaveEdit}
				onCancel={() => setIsEditModalVisible(false)}
				confirmLoading={loading}
			>
				<Form form={form} layout="vertical">
					<Form.Item
						name="title"
						label="Tên Dashboard"
						rules={[{ required: true, message: 'Vui lòng nhập tên dashboard' }]}
					>
						<Input placeholder="Nhập tên dashboard" />
					</Form.Item>
				</Form>
			</Modal>

			{/* Modal cấu hình */}
			<Modal
				title={`Cấu hình Dashboard ${getUnitDisplayName()}`}
				open={isConfigModalVisible}
				onOk={handleSaveConfigWithConfirm}
				onCancel={() => setIsConfigModalVisible(false)}
				confirmLoading={loading}
				width={'90vw'}
				centered={true}
				style={{ height: '90vh' }}
				bodyStyle={{
					height: 'calc(90vh - 110px)',
					overflowY: 'auto',
					padding: '16px 24px',
				}}
			>
				<Form form={configForm} layout="vertical">
					<Row gutter={[8, 8]}>
						{sections.map((section) => (
							<Col span={24} key={section.key}>
								<Card
									size="small"
									title={
										<span 
											className={componentStyles.configSectionTitle}
											style={{ color: section.color }}
										>
											{section.name}
										</span>
									}
									className={componentStyles.configSectionCard}
									style={{
										borderLeft: `4px solid ${section.color}`,
									}}
								>
									<Row gutter={[16, 16]}>
										<Col span={24}>
											<Form.Item
												name={[section.key, 'kpis']}
												label="Chọn chỉ số"
											>
												<Select
													mode="multiple"
													placeholder="Chọn các chỉ số"
													className={componentStyles.select}
													onChange={(value) => {
														// Cập nhật form value trước
														configForm.setFieldValue([section.key, 'kpis'], value || []);
														// Cập nhật state để force re-render
														setSelectedKpis(prev => ({
															...prev,
															[section.key]: value || [],
														}));
														// Force re-render chỉ khi cần thiết
														setTimeout(() => setForceUpdate(prev => prev + 1), 50);
													}}
													value={configForm.getFieldValue([section.key, 'kpis']) || []}
												>
													{kpi2Calculators.map((kpi) => (
														<Option key={kpi.id} value={kpi.id}>
															<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
																<span>{kpi.name}</span>
																{kpi.tags && kpi.tags.length > 0 && (
																	<div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
																		{kpi.tags.slice(0, 3).map((tag, index) => (
																			<Tag key={index} size="small" color="blue">
																				{tag}
																			</Tag>
																		))}
																		{kpi.tags.length > 3 && (
																			<Tag size="small" color="default">
																				+{kpi.tags.length - 3}
																			</Tag>
																		)}
																	</div>
																)}
															</div>
														</Option>
													))}
												</Select>
											</Form.Item>
										</Col>
									</Row>
									<Row gutter={[16, 16]}>
										<Col span={24}>
											<Form.Item
												name={[section.key, 'kpiWeights']}
												label="Hệ số cho từng chỉ số"
											>
												<div className={componentStyles.kpiWeightsContainer}>
													{selectedKpis[section.key]?.map((kpiId) => {
														const kpi = kpi2Calculators.find(k => k.id === kpiId);
														if (!kpi) return null;

														return (
															<div key={kpiId} className={componentStyles.kpiWeightItem}>
																<span className={componentStyles.kpiWeightLabel}>{kpi.name}</span>
																<InputNumber
																	size="small"
																	placeholder="Hệ số"
																	min={0}
																	max={100}
																	className={componentStyles.kpiWeightInput}
																	value={kpiWeights[section.key][kpiId] || 1}
																	onChange={(value) => {

																		// Cập nhật state local trước
																		setKpiWeights(prev => {
																			const newWeights = { ...prev };
																			if (!newWeights[section.key]) {
																				newWeights[section.key] = {};
																			}
																			newWeights[section.key] = {
																				...newWeights[section.key],
																				[kpiId]: value || 1,
																			};
																			return newWeights;
																		});

																		// Cập nhật form sau
																		const currentValues = configForm.getFieldsValue();
																		const newValues = { ...currentValues };

																		if (!newValues[section.key]) {
																			newValues[section.key] = {};
																		}

																		newValues[section.key].kpiWeights = {
																			...newValues[section.key].kpiWeights,
																			[kpiId]: value || 1,
																		};

																		configForm.setFieldsValue(newValues);
																	}}
																/>
															</div>
														);
													}) || []}
													{(!selectedKpis[section.key] || selectedKpis[section.key].length === 0) && (
														<div className={componentStyles.emptyState}>
															Chọn chỉ số trước để thiết lập hệ số
														</div>
													)}
												</div>
											</Form.Item>
										</Col>
									</Row>
								</Card>
							</Col>
						))}
					</Row>
					<Divider className={componentStyles.divider}>Cấu hình AI</Divider>

					<Form.Item
						label="Model AI"
						help="Chọn model AI để phân tích và chấm điểm"
					>
						<Select
							value={selectedAIModel}
							onChange={setSelectedAIModel}
							className={componentStyles.select}
							placeholder="Chọn model AI"
						>
							{MODEL_AI_LIST.map((model) => (
								<Option key={model.value} value={model.value}>
									{model.name}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item
						label="Prompt AI tạo báo cáo HTML"
						help="Prompt để AI tạo báo cáo HTML trực quan cho từng phần. Sử dụng {sectionName}, {score}, {analysis} làm placeholder"
					>
						<TextArea
							value={aiPrompt}
							onChange={(e) => setAiPrompt(e.target.value)}
							placeholder="Nhập prompt cho AI tạo báo cáo HTML..."
							rows={200}
							className={componentStyles.textarea}
						/>
					</Form.Item>

				</Form>
			</Modal>

			{/* Modal chi tiết nhận xét - chỉ hiển thị trên màn hình >= 768px */}
			{!isMobile && (
				<Modal
					title={`Chi tiết phân tích - ${selectedSection?.name || ''}`}
					open={showDetailModal}
					onCancel={() => setShowDetailModal(false)}
					footer={false}
					width={'70vw'}
					centered={true}
					style={{ height: '90vh' }}
					bodyStyle={{
						height: 'calc(90vh - 110px)',
						overflowY: 'auto',
						padding: '8px 8px',
					}}
					className={componentStyles.detailModalBody}
				>
				{selectedSection && (
					<div>
						<div className={componentStyles.analysisContainer}>
							<div className={componentStyles.analysisBox}>
								{scores?.[selectedSection.key]?.analysis ? (
									<div
										className={`${styles.analysisContent} ${componentStyles.analysisContent}`}
										dangerouslySetInnerHTML={{
											__html: renderHTML(scores?.[selectedSection.key]?.analysis),
										}}
									/>
								) : (
									'Chưa có nhận xét chi tiết'
								)}
							</div>
						</div>
					</div>
				)}
				</Modal>
			)}
		</>
	);
});

DefaultDashboardCard.displayName = 'DefaultDashboardCard';

export default DefaultDashboardCard;
