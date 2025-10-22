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
	Divider,
	InputNumber,
	Tag,
	Tooltip,
	message,
	Upload,
	Avatar,
	Space,
} from 'antd';
import { SettingOutlined, EditOutlined, PictureOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { Image } from 'lucide-react';

import { aiGen2, aiChat, webSearchChat } from '../../../apis/botService.jsx';
import {
	createAIChatHistoryList,
	updateAIChatHistoryList,
	getAllAIChatHistoryList,
	deleteAIChatHistoryList,
} from '../../../apis/aiChatHistoryListService.jsx';
import { updateUsedTokenApp } from '../../../utils/tokenUtils.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ScorePoint } from '../../../icon/svg/IconSvg.jsx';
import { uploadFileService } from '../../../apis/uploadFileService.jsx';
import { createSetting, getSettingByType, updateSetting } from '../../../apis/settingService.jsx';
import {
    createDashBoardItem,
    getDashBoardItemById,
    updateDashBoardItem,
    getAllDashBoardItems,
    getDashBoardItemByIdSchema,
} from '../../../apis/dashBoardItemService.jsx';
import { MODEL_AI_LIST, MODEL_AI_LIST_DB } from '../../../AI_CONST.js';
import { MyContext } from '../../../MyContext.jsx';
import styles from './modals/AnalysisDetailModal.module.css';
import componentStyles from './DefaultDashboardCard.module.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DefaultDashboardCardByItem = forwardRef(({
	onUpdate,
	selectedStoreTags = ['All'],
	// PIN Security props (chỉ cần thiết cho modal cấu hình AI)
	setShowPinModal,
	pinInput,
	setPinInput,
	pinError,
	setPinError,
	savedPin,
	isPinVerified,
	setIsPinVerified,
	handleVerifyPin,
	// Setup PIN props
	showSetupPinModal,
	setShowSetupPinModal,
	newPin,
	setNewPin,
	confirmPin,
	setConfirmPin,
	setupPinError,
	setSetupPinError,
	handleSetupPin,
	// Change PIN props
	setShowChangePinModal,
}, ref) => {

	const { currentUser } = useContext(MyContext);
	const [form] = Form.useForm();
	const [configForm] = Form.useForm();
	const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
	const [configSectionKey, setConfigSectionKey] = useState(null);
	const [isEditModalVisible, setIsEditModalVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [defaultItem, setDefaultItem] = useState(null);
	const [dashboardItems, setDashboardItems] = useState([]);
	const [scores, setScores] = useState({
		financial: { score: 0, analysis: '', analysisText: '' },
		business: { score: 0, analysis: '', analysisText: '' },
		operation: { score: 0, analysis: '', analysisText: '' },
		hr: { score: 0, analysis: '', analysisText: '' },
		overview: { score: 0, analysis: '', analysisText: '' },
		research: { score: 0, analysis: '', analysisText: '' },
		total: 0,
	});
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedSection, setSelectedSection] = useState(null);
	const [chatHistoryId, setChatHistoryId] = useState(null);

	// State cho modal chi tiết phân tích
	const [showHTMLView, setShowHTMLView] = useState(true); // true = HTML, false = analysisText
	const [chatMessages, setChatMessages] = useState([]);
	const [inputMessage, setInputMessage] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [useWebSearch, setUseWebSearch] = useState(false);
	const [selectedAIModelDetail, setSelectedAIModelDetail] = useState(MODEL_AI_LIST_DB[0].value);
	const [selectedAIModel, setSelectedAIModel] = useState('gpt-5-mini-2025-08-07');
	const [isLoadingItem, setIsLoadingItem] = useState(false);
	const [forceUpdate, setForceUpdate] = useState(0);
	const [isMobile, setIsMobile] = useState(false);
	const [selectedItems, setSelectedItems] = useState({
		financial: [],
		business: [],
		operation: [],
		hr: [],
		overview: [],
		research: [],
	});
	const [itemWeights, setItemWeights] = useState({
		financial: {},
		business: {},
		operation: {},
		hr: {},
		overview: {},
		research: {},
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
	const [aiPromptStep1, setAiPromptStep1] = useState(`Bạn là một chuyên gia phân tích kinh doanh hàng đầu. Nhiệm vụ của bạn là phân tích dữ liệu từ các thành phần và đưa ra đánh giá tổng hợp.

Dữ liệu phân tích cho phần {sectionName}:
{itemsData}

Hãy phân tích và đánh giá chi tiết phần {sectionName} dựa trên dữ liệu trên. Đưa ra nhận định về:
1. Tình hình tổng quan
2. Điểm mạnh và điểm yếu
3. Xu hướng và rủi ro
4. Khuyến nghị hành động

Yêu cầu đầu ra:
- Chỉ trả về JSON hợp lệ duy nhất, không có giải thích
- Cấu trúc: {"score": number 0-100, "text": string}
- "score": điểm đánh giá từ 0-100
- "text": phân tích chi tiết dạng text thuần`);
	const [aiPromptStep2, setAiPromptStep2] = useState(`Bạn là một chuyên gia UI/UX và front-end developer hàng đầu, chuyên biến các dữ liệu phân tích phức tạp thành những báo cáo HTML trực quan, chuyên nghiệp và dễ hiểu.

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
- Phân tích chi tiết: {text}

Hãy tạo HTML báo cáo trực quan cho phần {sectionName} dựa trên dữ liệu trên.`);
	const [aiPromptOverview, setAiPromptOverview] = useState('');
	const [aiPromptOverviewStep2, setAiPromptOverviewStep2] = useState('');
	const [aiPromptResearch, setAiPromptResearch] = useState('');
	const [aiPromptResearchStep2, setAiPromptResearchStep2] = useState('');
	const [appearance, setAppearance] = useState({});
	const [backgroundImages, setBackgroundImages] = useState({});
	const [uploadingImages, setUploadingImages] = useState({});
	const [idSetting, setIdSetting] = useState(null);
	const [sectionDisplayNames, setSectionDisplayNames] = useState({});
	const [pendingConfigModal, setPendingConfigModal] = useState(false);
	const [isAIConfigModalVisible, setIsAIConfigModalVisible] = useState(false);

	// Hàm xử lý mở modal cấu hình AI với kiểm tra PIN
	const handleOpenAIConfigModal = () => {
		// Super admin không cần nhập PIN
		if (currentUser?.isSuperAdmin) {
			setIsAIConfigModalVisible(true);
			return;
		}
		
		if (savedPin && savedPin.trim() !== '') {
			// Có PIN → Yêu cầu nhập PIN trước
			setPendingConfigModal(true);
			setShowPinModal(true);
			setIsPinVerified(false);
		} else {
			// Không có PIN → Bắt buộc cài đặt PIN trước
			setShowSetupPinModal(true);
			setNewPin('');
			setConfirmPin('');
			setSetupPinError('');
		}
	};

	// Xử lý sau khi verify PIN thành công
	useEffect(() => {
		if (isPinVerified && isConfigModalVisible) {
			// Mở modal cấu hình AI sau khi verify PIN
			setIsAIConfigModalVisible(true);
			setPendingConfigModal(false);
		}
	}, [isPinVerified , isConfigModalVisible]);

	// Xử lý sau khi setup PIN thành công
	useEffect(() => {
		if (savedPin && savedPin.trim() !== '' && pendingConfigModal) {
			// Sau khi setup PIN thành công, mở modal cấu hình AI
			setPendingConfigModal(false);
		}
	}, [savedPin, pendingConfigModal]);

	const sections = [
		{ key: 'financial', name: 'TÀI CHÍNH', color: '#52c41a' },
		{ key: 'business', name: 'KINH DOANH', color: '#1890ff' },
		{ key: 'operation', name: 'VẬN HÀNH', color: '#fa8c16' },
		{ key: 'hr', name: 'NHÂN SỰ', color: '#eb2f96' },
		// { key: 'overview', name: 'TỔNG QUAN', color: '#722ed1' },
		// { key: 'research', name: 'NGHIÊN CỨU', color: '#13c2c2' },
	];

	useImperativeHandle(ref, () => ({
		handleSaveConfig: handleSaveConfig,
		updateLastAnalyzeTime: updateLastAnalyzeTime,
		scores: scores,
	}));

	const getDefaultItemId = () => {
		if (selectedStoreTags.includes('All') || selectedStoreTags.length === 0) {
			return 100000;
		}
		const primaryUnit = selectedStoreTags[0];
		let hash = 0;
		for (let i = 0; i < primaryUnit.length; i++) {
			const char = primaryUnit.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		const finalId = 100000 + Math.abs(hash) % 900000;
		return finalId;
	};

	const getUnitDisplayName = () => {
		if (selectedStoreTags.includes('All') || selectedStoreTags.length === 0) {
			return 'Tổng Quan';
		}
		if (selectedStoreTags.length === 1) {
			return selectedStoreTags[0];
		}
		return `${selectedStoreTags[0]} (+${selectedStoreTags.length - 1})`;
	};

	// Load background image from settings
	const loadBackgroundImage = async () => {
		try {
			const response = await getSettingByType('dashboard_background');
			setBackgroundImages({ dashboard_background: response.setting });
			setIdSetting(response.id);

		} catch (error) {
			console.error('Error loading background image:', error);
		}
	};

	// Load Context Instruction từ settings
	const loadContextInstruction = async () => {
		try {
			const contextSetting = await getSettingByType('CONTEXT_INSTRUCTION_SETTING');
			if (contextSetting && contextSetting.setting) {
				return contextSetting.setting.instruction || '';
			}
			return '';
		} catch (error) {
			console.error('Lỗi khi tải context instruction:', error);
			return '';
		}
	};

	// Handle background image upload
	const handleBackgroundImageUpload = async (file) => {
		try {
			setUploadingImages({ dashboard_background: true });

			const response = await uploadFileService([file]);
			if (response && response.files && response.files.length > 0) {
				const imageUrl = response.files[0].fileUrl;

				// Update state
				setBackgroundImages({ dashboard_background: imageUrl });

				// Save to settings
				await updateSetting({
					id: idSetting,
					type: 'dashboard_background',
					setting: imageUrl,
				});

				message.success('Đã upload ảnh nền thành công!');
			}
		} catch (error) {
			console.error('Error uploading background image:', error);
			message.error('Có lỗi xảy ra khi upload ảnh nền');
		} finally {
			setUploadingImages({ dashboard_background: false });
		}
	};

	useEffect(() => {
		loadDefaultItem();
	}, [selectedStoreTags]);

	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => {
			window.removeEventListener('resize', checkScreenSize);
		};
	}, []);

	useEffect(() => {
		loadDashboardItems();
	}, [selectedStoreTags]);

	useEffect(() => {
		loadBackgroundImage();
	}, []);


	useEffect(() => {
		if (defaultItem) {
			form.setFieldsValue({
				title: defaultItem.name || defaultItem.title || `Dashboard ${getUnitDisplayName()}`,
			});

			if (defaultItem.settings) {
				const normalizedSettings = {
					...defaultItem.settings,
					financial: {
						items: defaultItem.settings.financial?.items || defaultItem.settings.financial?.kpis || [],
						itemWeights: (typeof defaultItem.settings.financial?.itemWeights === 'object' && defaultItem.settings.financial?.itemWeights !== null)
							? defaultItem.settings.financial.itemWeights
							: (defaultItem.settings.financial?.kpiWeights || {}),
					},
					business: {
						items: defaultItem.settings.business?.items || defaultItem.settings.business?.kpis || [],
						itemWeights: (typeof defaultItem.settings.business?.itemWeights === 'object' && defaultItem.settings.business?.itemWeights !== null)
							? defaultItem.settings.business.itemWeights
							: (defaultItem.settings.business?.kpiWeights || {}),
					},
					operation: {
						items: defaultItem.settings.operation?.items || defaultItem.settings.operation?.kpis || [],
						itemWeights: (typeof defaultItem.settings.operation?.itemWeights === 'object' && defaultItem.settings.operation?.itemWeights !== null)
							? defaultItem.settings.operation.itemWeights
							: (defaultItem.settings.operation?.kpiWeights || {}),
					},
					hr: {
						items: defaultItem.settings.hr?.items || defaultItem.settings.hr?.kpis || [],
						itemWeights: (typeof defaultItem.settings.hr?.itemWeights === 'object' && defaultItem.settings.hr?.itemWeights !== null)
							? defaultItem.settings.hr.itemWeights
							: (defaultItem.settings.hr?.kpiWeights || {}),
					},
					overview: {
						items: defaultItem.settings.overview?.items || defaultItem.settings.overview?.kpis || [],
						itemWeights: (typeof defaultItem.settings.overview?.itemWeights === 'object' && defaultItem.settings.overview?.itemWeights !== null)
							? defaultItem.settings.overview.itemWeights
							: (defaultItem.settings.overview?.kpiWeights || {}),
					},
				};

				// Prepare display names
				const existingDisplayNames = (defaultItem.settings && defaultItem.settings.sectionDisplayNames) || {};
				const defaultDisplayNames = sections.reduce((acc, s) => { acc[s.key] = existingDisplayNames[s.key] || s.name; return acc; }, {});
				configForm.setFieldsValue({
					...normalizedSettings,
					displayNames: defaultDisplayNames,
				});
				if (defaultItem.settings.aiModel) setSelectedAIModel(defaultItem.settings.aiModel);
				if (defaultItem.settings.aiPrompt) setAiPrompt(defaultItem.settings.aiPrompt);
				if (defaultItem.settings.aiPromptOverview) setAiPromptOverview(defaultItem.settings.aiPromptOverview);
				if (defaultItem.settings.aiPromptOverviewStep2) setAiPromptOverviewStep2(defaultItem.settings.aiPromptOverviewStep2);
				if (defaultItem.settings.aiPromptResearch) setAiPromptResearch(defaultItem.settings.aiPromptResearch);
				if (defaultItem.settings.aiPromptResearchStep2) setAiPromptResearchStep2(defaultItem.settings.aiPromptResearchStep2);
				if (defaultItem.settings.aiPromptStep1) setAiPromptStep1(defaultItem.settings.aiPromptStep1);
				if (defaultItem.settings.aiPromptStep2) setAiPromptStep2(defaultItem.settings.aiPromptStep2);
				if (defaultItem.settings.appearance) setAppearance(defaultItem.settings.appearance);
				setSectionDisplayNames(defaultDisplayNames);

				setSelectedItems({
					financial: normalizedSettings.financial.items,
					business: normalizedSettings.business.items,
					operation: normalizedSettings.operation.items,
					hr: normalizedSettings.hr.items,
					overview: normalizedSettings.overview.items,
				});

				setItemWeights({
					financial: normalizedSettings.financial.itemWeights,
					business: normalizedSettings.business.itemWeights,
					operation: normalizedSettings.operation.itemWeights,
					hr: normalizedSettings.hr.itemWeights,
					overview: normalizedSettings.overview.itemWeights,
				});
			} else {
				const defaultSettings = {
					financial: { items: [], itemWeights: {} },
					business: { items: [], itemWeights: {} },
					operation: { items: [], itemWeights: {} },
					hr: { items: [], itemWeights: {} },
					overview: { items: [], itemWeights: {} },
					research: { items: [], itemWeights: {} },
					aiModel: 'gpt-5-mini-2025-08-07',
					aiPrompt: aiPrompt,
					aiPromptOverview: aiPrompt,
					aiPromptOverviewStep2: aiPromptStep2,
					aiPromptResearch: aiPrompt,
					aiPromptResearchStep2: aiPromptStep2,
					aiPromptStep1: aiPromptStep1,
					aiPromptStep2: aiPromptStep2,
					appearance: {},
				};
				const defaultDisplayNames = sections.reduce((acc, s) => { acc[s.key] = s.name; return acc; }, {});
				configForm.setFieldsValue({ ...defaultSettings, displayNames: defaultDisplayNames });
				setSelectedItems({ financial: [], business: [], operation: [], hr: [], overview: [], research: [] });
				setItemWeights({ financial: {}, business: {}, operation: {}, hr: {}, overview: {}, research: {} });
				setSectionDisplayNames(defaultDisplayNames);
			}

			if (defaultItem.analysis) {
				const normalizedAnalysis = {
					financial: defaultItem.analysis.financial || { score: 0, analysis: '', analysisText: '' },
					business: defaultItem.analysis.business || { score: 0, analysis: '', analysisText: '' },
					operation: defaultItem.analysis.operation || { score: 0, analysis: '', analysisText: '' },
					hr: defaultItem.analysis.hr || { score: 0, analysis: '', analysisText: '' },
					overview: defaultItem.analysis.overview || { score: 0, analysis: '', analysisText: '' },
					research: defaultItem.analysis.research || { score: 0, analysis: '', analysisText: '' },
					total: typeof defaultItem.analysis.total === 'number' ? defaultItem.analysis.total : 0,
				};
				setScores(normalizedAnalysis);
			}
		}
	}, [defaultItem]);

	useEffect(() => {
		setForceUpdate(prev => prev + 1);
	}, [configForm.getFieldValue(['financial', 'items']), configForm.getFieldValue(['business', 'items']), configForm.getFieldValue(['operation', 'items']), configForm.getFieldValue(['hr', 'items']), configForm.getFieldValue(['overview', 'items']), configForm.getFieldValue(['research', 'items'])]);

    const loadDefaultItem = async () => {
		if (isLoadingItem) return;
		setIsLoadingItem(true);
		try {
			const itemId = getDefaultItemId();
			let item = await getDashBoardItemById(itemId);
			// Nếu item tồn tại nhưng settings rỗng/thiếu → fallback merge từ master
			const isEmptySection = (sec) => {
				if (!sec) return true;
				const kpis = Array.isArray(sec.kpis) ? sec.kpis : (Array.isArray(sec.items) ? sec.items : []);
				const prompt = typeof sec.prompt === 'string' ? sec.prompt : '';
				return (kpis.length === 0) && (!prompt || prompt.trim() === '');
			};
			const sectionsToCheck = ['financial','business','operation','hr'];
			let needMergeFromMaster = false;
			if (!item || !item.settings) {
				needMergeFromMaster = true;
			} else {
				needMergeFromMaster = sectionsToCheck.every(key => isEmptySection(item.settings[key]));
			}
			if (needMergeFromMaster) {
				try {
					const masterItem = await getDashBoardItemByIdSchema('master', 100000);
					console.log('masterItem', masterItem);
					if (masterItem && masterItem.settings) {
						const currentSettings = { ...(item?.settings || {}) };
						const masterSettings = { ...(masterItem.settings || {}) };
						const mergedSettings = { ...masterSettings, ...currentSettings };

						// Top-level prompts: fill missing from master
						const topPrompts = [
							'aiPrompt',
							'aiPromptOverview',
							'aiPromptOverviewStep2',
							'aiPromptResearch',
							'aiPromptResearchStep2',
							'aiPromptStep1',
							'aiPromptStep2'
						];
						topPrompts.forEach(key => {
							const cur = typeof currentSettings[key] === 'string' ? currentSettings[key].trim() : '';
							const mas = typeof masterSettings[key] === 'string' ? masterSettings[key].trim() : '';
							if (!cur && mas) mergedSettings[key] = mas;
						});

						// Section-level prompts/items: financial, business, operation, hr, overview, research
						['financial','business','operation','hr','overview','research'].forEach(secKey => {
							const curSec = currentSettings[secKey] || {};
							const masSec = masterSettings[secKey] || {};
							const mergedSec = { ...masSec, ...curSec };
							// prompt per section
							const curPrompt = typeof curSec.prompt === 'string' ? curSec.prompt.trim() : '';
							const masPrompt = typeof masSec.prompt === 'string' ? masSec.prompt.trim() : '';
							if (!curPrompt && masPrompt) mergedSec.prompt = masPrompt;
							// items/kpis: if current has neither items nor kpis, take master's
							const curItems = Array.isArray(curSec.items) ? curSec.items : (Array.isArray(curSec.kpis) ? curSec.kpis : []);
							if (!curItems || curItems.length === 0) {
								const masItems = Array.isArray(masSec.items) ? masSec.items : (Array.isArray(masSec.kpis) ? masSec.kpis : []);
								if (masItems && masItems.length > 0) mergedSec.items = masItems;
							}
							mergedSettings[secKey] = mergedSec;
						});

						item = { ...(masterItem || {}), ...(item || {}), settings: mergedSettings };
					}
				} catch (e) {
					// ignore merge error; dùng item hiện tại
				}
			}
			setDefaultItem(item);
			form.setFieldsValue({
				title: item.name || item.title || `Dashboard ${getUnitDisplayName()}`,
			});
			if (item.settings) {
				configForm.setFieldsValue(item.settings);
				if (item.settings.aiModel) setSelectedAIModel(item.settings.aiModel);
				if (item.analysis) setScores(item.analysis);
			}
		} catch (error) {
            try {
                // Fallback: lấy từ schema master (item mặc định luôn id=100000)
                const masterItem = await getDashBoardItemByIdSchema('master', 100000);
				console.log('masterItem', masterItem);
                if (masterItem) {
                    setDefaultItem(masterItem);
                    form.setFieldsValue({
                        title: masterItem.name || masterItem.title || `Dashboard ${getUnitDisplayName()}`,
                    });
                    if (masterItem.settings) {
                        configForm.setFieldsValue(masterItem.settings);
                        if (masterItem.settings.aiModel) setSelectedAIModel(masterItem.settings.aiModel);
                        if (masterItem.analysis) setScores(masterItem.analysis);
                    }
                } else {
                    // Không có master → tạo mặc định
                    await createDefaultItem();
                }
            } catch (fallbackErr) {
                console.error('Error loading item from master schema:', fallbackErr);
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
				financial: { items: [], itemWeights: {} },
				business: { items: [], itemWeights: {} },
				operation: { items: [], itemWeights: {} },
				hr: { items: [], itemWeights: {} },
				overview: { items: [], itemWeights: {} },
				research: { items: [], itemWeights: {} },
				aiModel: 'gpt-5-mini-2025-08-07',
				aiPrompt: aiPrompt,
				aiPromptOverview: aiPrompt,
				aiPromptResearch: aiPrompt,
				aiPromptStep1: aiPromptStep1,
				aiPromptStep2: aiPromptStep2,
				selectedStoreTags: selectedStoreTags,
				appearance: {},
			};
			const newItem = await createDashBoardItem({
				id: itemId,
				name: `Dashboard ${unitName}`,
				type: 'default',
				settings: defaultSettings,
				analysis: {
					financial: { score: 0, analysis: '', analysisText: '' },
					business: { score: 0, analysis: '', analysisText: '' },
					operation: { score: 0, analysis: '', analysisText: '' },
					hr: { score: 0, analysis: '', analysisText: '' },
					overview: { score: 0, analysis: '', analysisText: '' },
					research: { score: 0, analysis: '', analysisText: '' },
					total: 0,
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			setDefaultItem(newItem);
			setScores(newItem.analysis || {
				financial: { score: 0, analysis: '', analysisText: '' },
				business: { score: 0, analysis: '', analysisText: '' },
				operation: { score: 0, analysis: '', analysisText: '' },
				hr: { score: 0, analysis: '', analysisText: '' },
				overview: { score: 0, analysis: '', analysisText: '' },
				research: { score: 0, analysis: '', analysisText: '' },
				total: 0,
			});
			form.setFieldsValue({ title: newItem.name || newItem.title });
			configForm.setFieldsValue(defaultSettings);
			setIsLoadingItem(false);
		} catch (error) {
			console.error('Error creating default item:', error);
			const itemId = getDefaultItemId();
			const unitName = getUnitDisplayName();
			const tempItem = {
				id: itemId,
				name: `Dashboard ${unitName}`,
				type: 'default',
				settings: {
					financial: { items: [], itemWeights: {} },
					business: { items: [], itemWeights: {} },
					operation: { items: [], itemWeights: {} },
					hr: { items: [], itemWeights: {} },
					overview: { items: [], itemWeights: {} },
					research: { items: [], itemWeights: {} },
					aiModel: 'gpt-5-mini-2025-08-07',
					aiPrompt: aiPrompt,
					aiPromptOverview: aiPrompt,
					aiPromptOverviewStep2: aiPromptStep2,
					aiPromptResearch: aiPrompt,
					aiPromptResearchStep2: aiPromptStep2,
					aiPromptStep1: aiPromptStep1,
					aiPromptStep2: aiPromptStep2,
					selectedStoreTags: selectedStoreTags,
					appearance: {},
				},
				analysis: {
					financial: { score: 0, analysis: '', analysisText: '' },
					business: { score: 0, analysis: '', analysisText: '' },
					operation: { score: 0, analysis: '', analysisText: '' },
					hr: { score: 0, analysis: '', analysisText: '' },
					overview: { score: 0, analysis: '', analysisText: '' },
					research: { score: 0, analysis: '', analysisText: '' },
					total: 0,
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			setDefaultItem(tempItem);
			setScores(tempItem.analysis || {
				financial: { score: 0, analysis: '', analysisText: '' },
				business: { score: 0, analysis: '', analysisText: '' },
				operation: { score: 0, analysis: '', analysisText: '' },
				hr: { score: 0, analysis: '', analysisText: '' },
				overview: { score: 0, analysis: '', analysisText: '' },
				research: { score: 0, analysis: '', analysisText: '' },
				total: 0,
			});
			form.setFieldsValue({ title: tempItem.name });
			configForm.setFieldsValue(tempItem.settings);
			setIsLoadingItem(false);
		}
	};

	const loadDashboardItems = async () => {
		try {
			const allDashboardItems = await getAllDashBoardItems();
			const chartItems = allDashboardItems.filter(item => Number(item.id) < 100000 && item.type !== 'table2');
			setDashboardItems(chartItems);
		} catch (error) {
			console.error('Error loading dashboard items:', error);
		}
	};

	const calculateScores = async (settings, onlySectionKey = null) => {
		if (!settings) return;
		const newScores = {
			financial: { score: 0, analysis: '', analysisText: '' },
			business: { score: 0, analysis: '', analysisText: '' },
			operation: { score: 0, analysis: '', analysisText: '' },
			hr: { score: 0, analysis: '', analysisText: '' },
			overview: { score: 0, analysis: '', analysisText: '' },
			research: { score: 0, analysis: '', analysisText: '' },
			total: 0,
		};

		// Track which sections actually have data to justify AI generation
		const sectionHasData = { financial: false, business: false, operation: false, hr: false, overview: false, research: false };

		const aiModel = settings.aiModel || selectedAIModel || 'gpt-5-mini-2025-08-07';
		const aiPromptTemplateDefault = settings.aiPrompt || aiPrompt || 'Dựa trên phân tích chi tiết sau về {sectionName}, hãy tạo một tổng quan dạng markdown (không quá 250 từ) về tình hình {sectionNameLower} của doanh nghiệp:\n\n{analysis}';
		const aiPromptTemplateOverview = settings.aiPromptOverview || aiPromptOverview || aiPromptTemplateDefault;
		const aiPromptTemplateResearch = settings.aiPromptResearch || aiPromptResearch || aiPromptTemplateDefault;

		for (const section of sections) {
			if (onlySectionKey && section.key !== onlySectionKey) continue;
			const sectionSettings = settings[section.key];
			if (sectionSettings && sectionSettings.items && sectionSettings.items.length > 0) {
				try {
					const selectedChartItems = sectionSettings.items
						.map(itemId => dashboardItems.find(di => di.id === itemId))
						.filter(Boolean);

					// Mark section has data only if at least one selected item has non-empty analysis content
					sectionHasData[section.key] = selectedChartItems.some(di => {
						const answer = (di.analysis?.answer || '').trim();
						const info = (di.analysis?.info || '').trim();
						return !!answer || !!info;
					});

					// Initialize with default values - will be updated by AI in the next step
					newScores[section.key] = {
						score: 0,
						analysis: `Chưa có phân tích cho phần ${section.name}`,
						analysisText: '', // Lưu phân tích text từ bước 1
					};
				} catch (error) {
					console.error(`Error calculating score for ${section.key}:`, error);
					newScores[section.key] = { score: 0, analysis: 'Lỗi khi phân tích', analysisText: '' };
				}
			} else {
				if (section.key === 'research') {
					// Với phần nghiên cứu: luôn chạy dựa trên prompt + context instruction, không cần item
					sectionHasData[section.key] = true;
					newScores[section.key] = { score: 0, analysis: ' ', analysisText: '' };
				} else {
					newScores[section.key] = { score: 0, analysis: `Chưa chọn dashboard item cho phần ${section.name}`, analysisText: '' };
				}
			}
		}

		// Do not compute total here when running partial analysis; caller will recompute using existing scores
		if (!onlySectionKey) {
			if (settings.overview && (settings.overview.items?.length || 0) > 0) {
				newScores.total = newScores.overview.score;
			} else {
				newScores.total = (newScores.financial.score + newScores.business.score + newScores.operation.score + newScores.hr.score) / 4;
			}
		}

		try {
			// Load context instruction once for all sections
			const contextInstruction = await loadContextInstruction();
			const contextPrefix = contextInstruction ? `Context Instruction: ${contextInstruction}\n\n` : '';

			for (const section of sections) {
				if (onlySectionKey && section.key !== onlySectionKey) continue;
				const sectionData = newScores[section.key];
				const sectionSettings = settings[section.key];
				// Only call AI when section has data; for 'research' we always allow generation (no items required)
				const allowGenerate = section.key === 'research' || (sectionHasData[section.key] && sectionData && sectionData.analysis && sectionData.analysis.trim());
				if (allowGenerate) {

					// Thu thập dữ liệu từ các item thành phần
					const sectionItems = sectionSettings.items || [];
					const itemsAnalysis = [];

					for (const itemId of sectionItems) {
						const item = dashboardItems.find(di => di.id === itemId);
						if (item && item.analysis) {
							itemsAnalysis.push({
								name: item.name || item.title,
								answer: item.analysis.answer || '',
								info: item.analysis.info || '',
								score: item.analysis.score || 0
							});
						}
					}

					// Bước 1: Phân tích dữ liệu và chấm điểm
					let step1Prompt;
					if (section.key === 'overview') {
						step1Prompt = settings.aiPromptOverview || aiPromptOverview || settings.aiPromptStep1 || aiPromptStep1;
						console.log('Overview Step1 Prompt:', {
							settings_aiPromptOverview: settings.aiPromptOverview,
							aiPromptOverview: aiPromptOverview,
							settings_aiPromptStep1: settings.aiPromptStep1,
							aiPromptStep1: aiPromptStep1,
							final: step1Prompt
						});
					} else if (section.key === 'research') {
						step1Prompt = settings.aiPromptResearch || aiPromptResearch || settings.aiPromptStep1 || aiPromptStep1;
						console.log('Research Step1 Prompt:', {
							settings_aiPromptResearch: settings.aiPromptResearch,
							aiPromptResearch: aiPromptResearch,
							settings_aiPromptStep1: settings.aiPromptStep1,
							aiPromptStep1: aiPromptStep1,
							final: step1Prompt
						});
					} else {
						step1Prompt = settings.aiPromptStep1 || aiPromptStep1;
						console.log('Other Section Step1 Prompt:', {
							section_key: section.key,
							settings_aiPromptStep1: settings.aiPromptStep1,
							aiPromptStep1: aiPromptStep1,
							final: step1Prompt
						});
					}

					// Fallback prompt nếu không có prompt nào được thiết lập
					if (!step1Prompt) {
						step1Prompt = `Phân tích dữ liệu cho phần {sectionName}:
					
Dữ liệu từ các thành phần:
{itemsData}

Hãy phân tích và đánh giá chi tiết phần {sectionName} dựa trên dữ liệu trên.`;
					}

					const itemsDataText = itemsAnalysis.map(item =>
						`- ${item.name}: ${item.answer} ${item.info}`.trim()
					).join('\n');
					console.log('itemsDataText', itemsDataText);
					// Kiểm tra xem prompt có chứa placeholder không
					const hasPlaceholders = step1Prompt.includes('{sectionName}') || step1Prompt.includes('{itemsData}');

					let step1FinalPrompt;
					if (hasPlaceholders) {
						// Prompt có placeholder - thay thế như bình thường
						step1FinalPrompt = contextPrefix + step1Prompt
							.replace(/{sectionName}/g, section.name)
							.replace(/{itemsData}/g, itemsDataText)
							+ '\n\nYêu cầu đầu ra bắt buộc:\n- Chỉ trả về JSON hợp lệ duy nhất, không có giải thích\n- Cấu trúc: {"score": number 0-100, "text": string}.\n- "text" là phân tích chi tiết dạng text thuần';
					} else {
						// Prompt không có placeholder - thêm dữ liệu vào cuối
						step1FinalPrompt = contextPrefix + step1Prompt
							+ `\n\nDữ liệu phân tích cho phần ${section.name}:\n${itemsDataText}`
							+ '\n\nYêu cầu đầu ra bắt buộc:\n- Chỉ trả về JSON hợp lệ duy nhất, không có giải thích\n- Cấu trúc: {"score": number 0-100, "text": string}.\n- "text" là phân tích chi tiết dạng text thuần';
					}

					console.log('step1FinalPrompt', step1FinalPrompt);
					const step1Response = await aiGen2(step1FinalPrompt, null, aiModel);
					let step1Result = null;
					if (step1Response && step1Response.result) {
						let raw = step1Response.result?.trim?.() || '';
						raw = raw.replace(/^```[a-zA-Z]*\n|\n```$/g, '');
						try {
							step1Result = JSON.parse(raw);
						} catch (e) {
							step1Result = null;
						}
						await updateUsedTokenApp(step1Response, aiModel, 'analysis-review');
					}

					// Bước 2: Tạo HTML từ kết quả bước 1
					if (step1Result && typeof step1Result === 'object') {
						let step2Prompt;
						if (section.key === 'overview') {
							step2Prompt = settings.aiPromptOverviewStep2 || aiPromptOverviewStep2 || settings.aiPromptStep2 || aiPromptStep2;
							console.log('Overview Step2 Prompt:', {
								settings_aiPromptOverviewStep2: settings.aiPromptOverviewStep2,
								aiPromptOverviewStep2: aiPromptOverviewStep2,
								settings_aiPromptStep2: settings.aiPromptStep2,
								aiPromptStep2: aiPromptStep2,
								final: step2Prompt
							});
						} else if (section.key === 'research') {
							step2Prompt = settings.aiPromptResearchStep2 || aiPromptResearchStep2 || settings.aiPromptStep2 || aiPromptStep2;
							console.log('Research Step2 Prompt:', {
								settings_aiPromptResearchStep2: settings.aiPromptResearchStep2,
								aiPromptResearchStep2: aiPromptResearchStep2,
								settings_aiPromptStep2: settings.aiPromptStep2,
								aiPromptStep2: aiPromptStep2,
								final: step2Prompt
							});
						} else {
							step2Prompt = settings.aiPromptStep2 || aiPromptStep2;
							console.log('Other Section Step2 Prompt:', {
								section_key: section.key,
								settings_aiPromptStep2: settings.aiPromptStep2,
								aiPromptStep2: aiPromptStep2,
								final: step2Prompt
							});
						}

						// Fallback prompt nếu không có prompt nào được thiết lập
						if (!step2Prompt) {
							step2Prompt = `Tạo báo cáo HTML cho phần {sectionName}:

Điểm số: {score}/100
Phân tích chi tiết: {text}

Hãy tạo HTML báo cáo trực quan cho phần {sectionName} dựa trên thông tin trên.`;
						}

						// Kiểm tra xem prompt có chứa placeholder không
						const hasStep2Placeholders = step2Prompt.includes('{sectionName}') || step2Prompt.includes('{score}') || step2Prompt.includes('{text}');

						let step2FinalPrompt;
						if (hasStep2Placeholders) {
							// Prompt có placeholder - thay thế như bình thường
							step2FinalPrompt = contextPrefix + step2Prompt
								.replace(/{sectionName}/g, section.name)
								.replace(/{score}/g, step1Result.score || sectionData.score)
								.replace(/{text}/g, step1Result.text || '');
						} else {
							// Prompt không có placeholder - thêm dữ liệu vào cuối
							step2FinalPrompt = contextPrefix + step2Prompt
								+ `\n\nDữ liệu để tạo báo cáo cho phần ${section.name}:\n`
								+ `Điểm số: ${step1Result.score || sectionData.score}/100\n`
								+ `Phân tích chi tiết: ${step1Result.text || ''}`;
						}

						const step2Response = await aiGen2(step2FinalPrompt, null, aiModel);
						if (step2Response && step2Response.result) {
							newScores[section.key].analysis = step2Response.result;
							await updateUsedTokenApp(step2Response, aiModel, 'analysis-review');
						}

						// Cập nhật điểm và phân tích text từ bước 1
						if (typeof step1Result.score === 'number' && !Number.isNaN(step1Result.score)) {
							newScores[section.key].score = Math.min(100, Math.max(0, Math.round(step1Result.score)));
						}
						if (step1Result.text && typeof step1Result.text === 'string') {
							newScores[section.key].analysisText = step1Result.text;
						}
					} else {
						// Fallback nếu bước 1 không thành công
						newScores[section.key].analysis = sectionData.analysis;
					}
				}
			}
		} catch (error) {
			console.error('Error generating AI HTML report:', error);
		}

		setScores(newScores);
		return newScores;
	};

	const recomputeTotalScore = (scoresObj, settings) => {
		if (settings?.overview && (settings.overview.items?.length || 0) > 0) {
			return scoresObj.overview?.score ?? 0;
		}
		const fin = scoresObj.financial?.score ?? 0;
		const bus = scoresObj.business?.score ?? 0;
		const op = scoresObj.operation?.score ?? 0;
		const hr = scoresObj.hr?.score ?? 0;
		return (fin + bus + op + hr) / 4;
	};

	const handleSaveConfig = async () => {
		try {
			setLoading(true);
			const values = await configForm.validateFields();
			const mergedSettings = {
				...values,
				financial: {
					items: values.financial?.items || [],
					itemWeights: itemWeights.financial,
				},
				business: {
					items: values.business?.items || [],
					itemWeights: itemWeights.business,
				},
				operation: {
					items: values.operation?.items || [],
					itemWeights: itemWeights.operation,
				},
				hr: {
					items: values.hr?.items || [],
					itemWeights: itemWeights.hr,
				},
				overview: {
					items: values.overview?.items || [],
					itemWeights: itemWeights.overview,
				},
				aiModel: selectedAIModel,
				aiPrompt: aiPrompt,
				aiPromptOverview: aiPromptOverview,
				aiPromptOverviewStep2: aiPromptOverviewStep2,
				aiPromptResearch: aiPromptResearch,
				aiPromptResearchStep2: aiPromptResearchStep2,
				aiPromptStep1: aiPromptStep1,
				aiPromptStep2: aiPromptStep2,
				appearance: appearance,
				sectionDisplayNames: values.displayNames || sectionDisplayNames,
				selectedStoreTags: selectedStoreTags,
			};

			const calculatedScores = await calculateScores(mergedSettings);
			const updatedItem = {
				...defaultItem,
				settings: mergedSettings,
				analysis: calculatedScores,
				updatedAt: new Date().toISOString(),
			};

			try {
				const savedItem = await updateDashBoardItem(updatedItem);
				setDefaultItem(savedItem);
			} catch (updateError) {
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

	const handleSaveSectionConfig = async () => {
		if (!configSectionKey) return;
		try {
			setLoading(true);
			const values = await configForm.validateFields();
			// Start from existing settings and overwrite only the active section
			const existingSettings = defaultItem?.settings || {};
			const mergedSettings = {
				...existingSettings,
				[configSectionKey]: {
					items: values[configSectionKey]?.items || [],
					itemWeights: itemWeights[configSectionKey] || {},
				},
				aiModel: selectedAIModel,
				aiPrompt: aiPrompt,
				aiPromptOverview: aiPromptOverview,
				aiPromptOverviewStep2: aiPromptOverviewStep2,
				aiPromptResearch: aiPromptResearch,
				aiPromptResearchStep2: aiPromptResearchStep2,
				aiPromptStep1: aiPromptStep1,
				aiPromptStep2: aiPromptStep2,
				appearance: appearance,
				sectionDisplayNames: {
					...(existingSettings.sectionDisplayNames || sectionDisplayNames),
					...(values.displayNames ? { [configSectionKey]: values.displayNames?.[configSectionKey] } : {}),
				},
				selectedStoreTags: selectedStoreTags,
			};

			const calculatedScores = await calculateScores(mergedSettings, configSectionKey);
			// Merge the single section score into existing analysis
			const currentAnalysis = defaultItem?.analysis || {};
			const updatedAnalysis = {
				...currentAnalysis,
				[configSectionKey]: calculatedScores[configSectionKey] || { score: 0, analysis: '', analysisText: '' },
			};
			updatedAnalysis.total = recomputeTotalScore({
				financial: updatedAnalysis.financial || { score: 0 },
				business: updatedAnalysis.business || { score: 0 },
				operation: updatedAnalysis.operation || { score: 0 },
				hr: updatedAnalysis.hr || { score: 0 },
				overview: updatedAnalysis.overview || { score: 0 },
			}, mergedSettings);

			const updatedItem = {
				...defaultItem,
				settings: mergedSettings,
				analysis: updatedAnalysis,
				updatedAt: new Date().toISOString(),
			};

			try {
				const savedItem = await updateDashBoardItem(updatedItem);
				setDefaultItem(savedItem);
			} catch (updateError) {
				if (updateError.response?.status === 404) {
					const createdItem = await createDashBoardItem(updatedItem);
					setDefaultItem(createdItem);
				} else {
					throw updateError;
				}
			}

			setIsConfigModalVisible(false);
			setConfigSectionKey(null);
			onUpdate && onUpdate();
		} catch (error) {
			console.error('Error saving section config:', error);
		} finally {
			setLoading(false);
		}
	};

	// Lưu chỉ prompt (toàn bộ), không chạy phân tích
	const handleSavePromptsOnly = async () => {
		try {
			setLoading(true);
			const values = await configForm.validateFields();
			const mergedSettings = {
				...defaultItem?.settings,
				financial: {
					items: values.financial?.items || [],
					itemWeights: itemWeights.financial,
				},
				business: {
					items: values.business?.items || [],
					itemWeights: itemWeights.business,
				},
				operation: {
					items: values.operation?.items || [],
					itemWeights: itemWeights.operation,
				},
				hr: {
					items: values.hr?.items || [],
					itemWeights: itemWeights.hr,
				},
				overview: {
					items: values.overview?.items || [],
					itemWeights: itemWeights.overview,
				},
				aiModel: selectedAIModel,
				aiPrompt: aiPrompt,
				aiPromptOverview: aiPromptOverview,
				aiPromptOverviewStep2: aiPromptOverviewStep2,
				aiPromptResearch: aiPromptResearch,
				aiPromptResearchStep2: aiPromptResearchStep2,
				aiPromptStep1: aiPromptStep1,
				aiPromptStep2: aiPromptStep2,
				appearance: appearance,
				sectionDisplayNames: values.displayNames || sectionDisplayNames,
				selectedStoreTags: selectedStoreTags,
			};

			const updatedItem = {
				...defaultItem,
				settings: mergedSettings,
				updatedAt: new Date().toISOString(),
			};

			try {
				const savedItem = await updateDashBoardItem(updatedItem);
				setDefaultItem(savedItem);
			} catch (updateError) {
				if (updateError.response?.status === 404) {
					const createdItem = await createDashBoardItem(updatedItem);
					setDefaultItem(createdItem);
				} else {
					throw updateError;
				}
			}

			message.success('Đã lưu prompt cấu hình.');
			setIsConfigModalVisible(false);
			onUpdate && onUpdate();
		} catch (error) {
			console.error('Error saving prompts only:', error);
		} finally {
			setLoading(false);
		}
	};

	// Lưu chỉ prompt (theo section), không chạy phân tích
	const handleSaveSectionPromptsOnly = async () => {
		if (!configSectionKey) return;
		try {
			setLoading(true);
			const values = await configForm.validateFields();
			const existingSettings = defaultItem?.settings || {};
			const mergedSettings = {
				...existingSettings,
				[configSectionKey]: {
					items: values[configSectionKey]?.items || [],
					itemWeights: itemWeights[configSectionKey] || {},
				},
				aiModel: selectedAIModel,
				aiPrompt: aiPrompt,
				aiPromptOverview: aiPromptOverview,
				aiPromptOverviewStep2: aiPromptOverviewStep2,
				aiPromptResearch: aiPromptResearch,
				aiPromptResearchStep2: aiPromptResearchStep2,
				aiPromptStep1: aiPromptStep1,
				aiPromptStep2: aiPromptStep2,
				appearance: appearance,
				sectionDisplayNames: {
					...(existingSettings.sectionDisplayNames || sectionDisplayNames),
					...(values.displayNames ? { [configSectionKey]: values.displayNames?.[configSectionKey] } : {}),
				},
				selectedStoreTags: selectedStoreTags,
			};

			const updatedItem = {
				...defaultItem,
				settings: mergedSettings,
				updatedAt: new Date().toISOString(),
			};

			try {
				const savedItem = await updateDashBoardItem(updatedItem);
				setDefaultItem(savedItem);
			} catch (updateError) {
				if (updateError.response?.status === 404) {
					const createdItem = await createDashBoardItem(updatedItem);
					setDefaultItem(createdItem);
				} else {
					throw updateError;
				}
			}

			message.success(`Đã lưu prompt cho phần ${configSectionKey}.`);
			setIsConfigModalVisible(false);
			setConfigSectionKey(null);
			onUpdate && onUpdate();
		} catch (error) {
			console.error('Error saving section prompts only:', error);
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
			try {
				const savedItem = await updateDashBoardItem(updatedItem);
				setDefaultItem(savedItem);
			} catch (updateError) {
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
			try {
				const savedItem = await updateDashBoardItem(updatedItem);
				setDefaultItem(savedItem);
			} catch (updateError) {
				if (updateError.response?.status === 404) {
					const createdItem = await createDashBoardItem(updatedItem);
					setDefaultItem(createdItem);
				} else {
					throw updateError;
				}
			}
			onUpdate && onUpdate();
		} catch (error) {
			console.error('Error updating last analyze time:', error);
			throw error;
		}
	};

	// Hàm xử lý AI Chat
	const handleSendMessage = async () => {
		if (!inputMessage.trim()) return;

		// Kiểm tra giới hạn 5 tin nhắn người dùng (không tính tin nhắn đầu tiên)
		const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isSystem && !msg.isInitial);
		if (userMessages.length >= 5) {
			message.warning('Bạn đã đạt giới hạn 5 tin nhắn. Vui lòng reset chat để tiếp tục.');
			return;
		}

		const userMessage = {
			id: Date.now(),
			type: 'user',
			content: inputMessage,
			timestamp: new Date(),
		};

		// Thêm tin nhắn user vào chat
		setChatMessages(prev => [...prev, userMessage]);
		setInputMessage('');
		setIsTyping(true);

		try {
			// Chuẩn bị context đầy đủ cho AI
			const fullContext = [];

			// Thêm thông tin section hiện tại (chỉ nếu chưa có tin nhắn đầu tiên)
			const hasInitialMessage = chatMessages.some(msg => msg.isInitial);
			if (selectedSection && !hasInitialMessage) {
				const sectionData = scores[selectedSection.key];
				if (sectionData) {
					fullContext.push({
						role: 'user',
						content: `Thông tin phân tích cho phần ${selectedSection.name}: Điểm số: ${sectionData.score}/100, Phân tích: ${sectionData.analysisText || sectionData.analysis}`,
					});
				}
			}

			// Thêm chat history (bỏ qua tin nhắn đầu tiên nếu có)
			const chatHistory = chatMessages
				.filter(msg => !msg.isSystem && !msg.isInitial)
				.map(msg => ({
					role: msg.type === 'user' ? 'user' : 'assistant',
					content: msg.content,
				}));

			// Kết hợp context và chat history
			const fullChatHistory = [...fullContext, ...chatHistory];

			// Thêm tin nhắn user mới
			fullChatHistory.push({
				role: 'user',
				content: inputMessage,
			});

			let response;
			if (useWebSearch) {
				// Sử dụng webSearchChat nếu bật websearch
				try {
					const webSearchResponse = await webSearchChat({
						prompt: inputMessage,
						model: selectedAIModelDetail,
						chat_history: fullChatHistory,
					});
					response = {
						response: webSearchResponse.ai_response || webSearchResponse.message || 'Không có phản hồi từ websearch',
						success: webSearchResponse.success,
						citations: webSearchResponse.citations,
					};
				} catch (webSearchError) {
					console.error('Lỗi websearch, fallback về aiChat:', webSearchError);
					// Fallback về aiChat nếu websearch lỗi
					response = await aiChat(fullChatHistory, inputMessage, selectedAIModelDetail, {
						name: 'assistant',
						model: selectedAIModelDetail,
						systemMessage: '',
					});
				}
			} else {
				// Sử dụng aiChat bình thường
				response = await aiChat(fullChatHistory, inputMessage, selectedAIModelDetail, {
					name: 'assistant',
					model: selectedAIModelDetail,
					systemMessage: '',
				});
			}

			const assistantMessage = {
				id: Date.now() + 1,
				type: 'assistant',
				content: response.response || response.message || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
				timestamp: new Date(),
				citations: response.citations || null,
			};

			// Thêm tin nhắn AI vào chat
			setChatMessages(prev => [...prev, assistantMessage]);

			// Lưu chat history vào DB
			try {
				const historyPayload = [
					...chatHistory,
					{ role: 'user', content: inputMessage, timestamp: new Date().toISOString() },
					{ role: 'assistant', content: assistantMessage.content, timestamp: new Date().toISOString(), citations: assistantMessage.citations },
				];
				if (chatHistoryId) {
					await updateAIChatHistoryList({ id: chatHistoryId, chatHistory: historyPayload, user_update: currentUser?.id });
				} else {
					const newChatHistoryData = {
						info: {
							sectionKey: selectedSection?.key,
							sectionName: selectedSection?.name,
						},
						chatHistory: historyPayload,
						type: 'analysis_chat',
						user_create: currentUser?.id,
						show: true,
					};
					const created = await createAIChatHistoryList(newChatHistoryData);
					setChatHistoryId(created?.id || null);
				}
			} catch (persistError) {
				console.error('Error saving chat history to DB:', persistError);
			}

		} catch (error) {
			console.error('Error in chat:', error);
			// Thêm tin nhắn lỗi
			const errorMessage = {
				id: Date.now() + 1,
				type: 'assistant',
				content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.',
				timestamp: new Date(),
			};
			setChatMessages(prev => [...prev, errorMessage]);
			message.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
		} finally {
			setIsTyping(false);
		}
	};

	// Hàm reset chat history
	const handleResetChat = () => {
		setChatMessages([]);
		try {
			if (chatHistoryId) {
				deleteAIChatHistoryList(chatHistoryId).catch(() => { });
			}
			setChatHistoryId(null);
		} catch (e) {
			console.error('Failed to clear chat history from DB:', e);
		}
		message.success('Đã reset chat thành công!');
	};

	// Hàm xử lý key press trong input
	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// Hàm render markdown
	const renderMarkdown = (content) => {
		if (!content) return '';
		try {
			const htmlContent = marked(content);
			const sanitizedHtml = DOMPurify.sanitize(htmlContent);
			return sanitizedHtml;
		} catch (error) {
			console.error('Error rendering markdown:', error);
			return content; // Fallback to plain text
		}
	};

	// Không tạo tin nhắn đầu tiên nữa; chỉ reset khi đóng modal
	useEffect(() => {
		if (!showDetailModal) {
			setChatMessages([]);
		}
	}, [showDetailModal]);

	// Tải lịch sử chat từ DB theo từng section khi mở modal
	useEffect(() => {
		const loadHistory = async () => {
			if (!showDetailModal || !selectedSection) return;
			try {
				const all = await getAllAIChatHistoryList();
				const found = (all || []).find(h => h?.type === 'analysis_chat' && h?.info?.sectionKey === selectedSection.key);
				if (found && Array.isArray(found.chatHistory)) {
					setChatMessages(found.chatHistory.map((m, idx) => ({
						id: Date.now() + idx,
						type: m.role === 'user' ? 'user' : 'assistant',
						content: m.content,
						timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
						citations: m.citations || null,
					})));
					setChatHistoryId && setChatHistoryId(found.id);
				} else {
					setChatMessages([]);
					setChatHistoryId && setChatHistoryId(null);
				}
			} catch (e) {
				console.error('Failed to load chat history from DB:', e);
			}
		};
		loadHistory();
	}, [showDetailModal, selectedSection]);

	const getGradeFromScore = (score) => {
		if (score >= 75) return { grade: score, color: '#58B16A', borderColor: '#ACD5AC' };
		if (score >= 50) return { grade: score, color: '#5785B2', borderColor: '#BCC4E5' };
		if (score >= 25) return { grade: score, color: '#fa8c16', borderColor: '#D9BF99' };
		if (score > 0) return { grade: score, color: '#E14242', borderColor: '#E5BCBC' };
		return { grade: 'N/A', color: '#d8d8d8', borderColor: '#d8d8d8' };
	};

	const handleOpenConfigModal = () => {
		setIsConfigModalVisible(true);
	};

	const renderScoreDisplay = () => {
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
					<Row gutter={[4, 8]}>
						<Col xl={24} style={{
							padding: '0 12px',
							position: 'relative',
						}}>
							<Row gutter={[4, 8]}>
								<Col span={24}>
									<Row gutter={[12, 8]}>
										{['financial', 'business', 'operation', 'hr']
											.map((key) => sections.find(s => s.key === key))
											.filter(Boolean)
											.map((section, index) => {
												const sectionScore = scores?.[section.key]?.score ?? 0;
												const sectionGrade = getGradeFromScore(sectionScore);
												const isThird = (index + 1) == 5;
												const isSixth = (index + 1) == 6;
												return (
													<Col span={6} key={section.key}>
														<div
															className={`${componentStyles.sectionCard} ${componentStyles.cardHoverable}`}
															style={{
																background: 'white',
																overflow: 'hidden',
															}}
															onClick={() => {
																if (!isMobile) {
																	setSelectedSection(section);
																	setShowDetailModal(true);
																}
															}}
														>
															{/* Header với màu đậm */}
															<div
																style={{
																	background: isThird ? '#B64867' : isSixth ? '#27BC99' : appearance[section.key]?.headerColor || sectionGrade.color,
																	// margin: '-12px -12px 12px -12px',
																	padding: '3px 12px',
																	color: 'white',
																	fontWeight: '400',
																	textAlign: 'center',
																	borderRadius: 2
																}}
															>
																<Title level={5} style={{ color: 'white', margin: 0, fontSize: 14.5 }}>
																	{sectionDisplayNames[section.key] || section.name}
																</Title>
															</div>
														</div>
													</Col>
												);
											})}
									</Row>
								</Col>
								{/*<Col span={1} style={{ display: 'flex', justifyContent: 'center' }}>*/}
								{/*	<div style={{ borderLeft: '1px solid #D6D6D6' }}></div>*/}
								{/*</Col>*/}
								{/*<Col span={8}>*/}
								{/*	<Row gutter={[12, 8]}>*/}
								{/*		{['overview', 'research']*/}
								{/*			.map((key) => sections.find(s => s.key === key))*/}
								{/*			.filter(Boolean)*/}
								{/*			.map((section, index) => {*/}
								{/*				return (*/}
								{/*					<Col span={12} key={section.key}>*/}
								{/*						<div*/}
								{/*							className={`${componentStyles.sectionCard} ${componentStyles.cardHoverable}`}*/}
								{/*							style={{*/}
								{/*								background: 'white',*/}
								{/*								overflow: 'hidden',*/}
								{/*							}}*/}
								{/*							onClick={() => {*/}
								{/*								if (!isMobile) {*/}
								{/*									setSelectedSection(section);*/}
								{/*									setShowDetailModal(true);*/}
								{/*								}*/}
								{/*							}}*/}
								{/*						>*/}
								{/*							/!* Header với màu đậm *!/*/}
								{/*							<div*/}
								{/*								style={{*/}
								{/*									background: '#3E67AF',*/}
								{/*									padding: '3px 12px',*/}
								{/*									color: 'white',*/}
								{/*									fontWeight: '400',*/}
								{/*									textAlign: 'center',*/}
								{/*									borderRadius: 2*/}
								{/*								}}*/}
								{/*							>*/}
								{/*								<Title level={5} style={{ color: 'white', margin: 0, fontSize: 14.5 }}>*/}
								{/*									{sectionDisplayNames[section.key] || section.name}*/}
								{/*								</Title>*/}
								{/*							</div>*/}
								{/*							/!* Body với nền trắng *!/*/}
								{/*							/!*<div style={{ textAlign: 'center', padding: '8px 0' }}>*!/*/}
								{/*							/!*	<Title*!/*/}
								{/*							/!*		level={3}*!/*/}
								{/*							/!*		className={componentStyles.sectionGrade}*!/*/}
								{/*							/!*		style={{ color: appearance[section.key]?.headerColor || sectionGrade.color }}*!/*/}
								{/*							/!*	>*!/*/}
								{/*							/!*		{ (isThird || isSixth) ? (*!/*/}
								{/*							/!*			<ScorePoint width={20} height={20} fill={isThird ? '#B64867' : '#27BC99'} />*!/*/}
								{/*							/!*		) : (*!/*/}
								{/*							/!*			sectionGrade.grade*!/*/}
								{/*							/!*		)}*!/*/}
								{/*							/!*	</Title>*!/*/}
								{/*							/!*</div>*!/*/}
								{/*						</div>*/}
								{/*					</Col>*/}
								{/*				);*/}
								{/*			})}*/}
								{/*	</Row>*/}
								{/*</Col>*/}
							</Row>
						</Col>
					</Row>
				)}
			</div>
		);
	};

	if (!defaultItem) {
		return <div>Loading...</div>;
	}

	const renderHTML = (content) => {
		if (!content) return '';
		try {
			let raw = typeof content === 'string' ? content.trim() : '';
			// Strip markdown code fences: ```html ... ``` or ``` ... ```
			if (raw.startsWith('```')) {
				const fenceMatch = raw.match(/^```([a-zA-Z]*)\n([\s\S]*?)\n```$/);
				if (fenceMatch) {
					raw = fenceMatch[2];
				} else {
					// Fallback: remove leading/trailing fences even if format slightly different
					raw = raw.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '');
				}
				raw = raw.trim();
			}

			const lower = raw.toLowerCase();
			const looksHtml = /<[^>]+>/.test(raw) || lower.includes('<!doctype') || lower.startsWith('<html');
			if (looksHtml) {
				const sanitizedHtml = DOMPurify.sanitize(raw, {
					ALLOWED_TAGS: ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em', 'br', 'svg', 'path', 'circle', 'line', 'polyline', 'rect', 'g'],
					ALLOWED_ATTR: ['style', 'class', 'xmlns', 'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points', 'd'],
				});
				return sanitizedHtml;
			}

			const htmlContent = marked(raw);
			return DOMPurify.sanitize(htmlContent);
		} catch (error) {
			console.error('Error rendering content:', error);
			return content;
		}
	};

	return (
		<>
			<div className={componentStyles.mainContainer}>
				{renderScoreDisplay()}
				{(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin) && (
					<div className={componentStyles.buttonGroup}>
						<SettingOutlined onClick={() => setIsConfigModalVisible(true)} />
						{/*<Button*/}
						{/*	icon={<EditOutlined />}*/}
						{/*	size="small"*/}
						{/*	onClick={() => setIsEditModalVisible(true)}*/}
						{/*>*/}
						{/*</Button>*/}
						{/*<Upload*/}
						{/*	beforeUpload={(file) => {*/}
						{/*		// Validate file type*/}
						{/*		if (!file.type.startsWith('image/')) {*/}
						{/*			message.error('Chỉ được chọn file ảnh!');*/}
						{/*			return false;*/}
						{/*		}*/}

						{/*		// Validate file size (max 5MB)*/}
						{/*		if (file.size / 1024 / 1024 > 5) {*/}
						{/*			message.error('Kích thước ảnh không được vượt quá 5MB!');*/}
						{/*			return false;*/}
						{/*		}*/}

						{/*		handleBackgroundImageUpload(file);*/}
						{/*		return false;*/}
						{/*	}}*/}
						{/*	showUploadList={false}*/}
						{/*	accept="image/*"*/}
						{/*	maxCount={1}*/}
						{/*>*/}
						{/*	<Button*/}
						{/*		icon={<Image size={15} />}*/}
						{/*		size="small"*/}
						{/*		loading={uploadingImages['dashboard_background']}*/}
						{/*		title="Upload nền"*/}
						{/*	>*/}
						{/*	</Button>*/}
						{/*</Upload>*/}
					</div>
				)}
			</div>

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

			<Modal
				title={
					<div> Cấu hình Dashboard  {getUnitDisplayName()}
						<Button
							size="small"
							icon={<SettingOutlined />}
							onClick={handleOpenAIConfigModal}
							title="Cấu hình AI"
							style={{ marginLeft: '16px' }}
						>
							Cấu hình AI
						</Button>
					</div>}
				open={isConfigModalVisible}
				onOk={() => {
					if (configSectionKey) {
						return handleSaveSectionConfig();
					}
					return handleSaveConfigWithConfirm();
				}}
				onCancel={() => {
					setIsConfigModalVisible(false);
					setConfigSectionKey(null);
				}}
				confirmLoading={loading}
				width={'90vw'}
				centered={true}
				style={{ height: '90vh' }}
				bodyStyle={{
					height: 'calc(90vh - 110px)',
					overflowY: 'auto',
					padding: '16px 24px',
				}}
				footer={[
					<Button key="save-prompts" onClick={() => {
						if (configSectionKey) return handleSaveSectionPromptsOnly();
						return handleSavePromptsOnly();
					}}>
						Lưu
					</Button>,
					<Button key="cancel" onClick={() => { setIsConfigModalVisible(false); setConfigSectionKey(null); }}>
						Hủy
					</Button>,
					<Button key="ok" type="primary" loading={loading} onClick={() => {
						if (configSectionKey) {
							return handleSaveSectionConfig();
						}
						return handleSaveConfigWithConfirm();
					}}>
						Phân tích và lưu
					</Button>,
				]}
			>
				<Form form={configForm} layout="vertical">
					<Row gutter={[16, 16]}>
						{(configSectionKey ? sections.filter(s => s.key === configSectionKey) : sections).map((section) => (
							<Col span={24} key={section.key}>
								<Card
									size="small"
									title={
										<span
											className={componentStyles.configSectionTitle}
											style={{ color: section.color }}
										>
											{sectionDisplayNames[section.key] || section.name}
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
												label="Tên hiển thị"
												name={['displayNames', section.key]}
												initialValue={sectionDisplayNames[section.key] || section.name}
											>
												<Input placeholder={section.name} onChange={(e) => {
													const value = e.target.value;
													setSectionDisplayNames(prev => ({ ...prev, [section.key]: value }));
												}} />
											</Form.Item>
										</Col>
					{section.key !== 'research' && (
						<Col span={24}>
							<Form.Item
								name={[section.key, 'items']}
								label="Chọn dashboard items"
							>
								<Select
									mode="multiple"
									placeholder="Chọn các dashboard items"
									className={componentStyles.select}
									onChange={(value) => {
										configForm.setFieldValue([section.key, 'items'], value || []);
										setSelectedItems(prev => ({
											...prev,
											[section.key]: value || [],
										}));
										setTimeout(() => setForceUpdate(prev => prev + 1), 50);
									}}
									value={configForm.getFieldValue([section.key, 'items']) || []}
								>
									{dashboardItems.map((di) => (
										<Option key={di.id} value={di.id}>
											<div style={{
												display: 'flex',
												flexDirection: 'column',
												gap: '4px',
											}}>
												<span>{di.name}</span>
												{di.tags && di.tags.length > 0 && (
													<div style={{
														display: 'flex',
														flexWrap: 'wrap',
														gap: '4px',
													}}>
														{di.tags.slice(0, 3).map((tag, index) => (
															<Tag key={index} size="small" color="blue">
																{tag}
															</Tag>
														))}
														{di.tags.length > 3 && (
															<Tag size="small" color="default">
																+{di.tags.length - 3}
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
					)}
									</Row>
									<Row gutter={[16, 16]}>
					{section.key !== 'research' && (
						<Col span={24}>
							<Form.Item
								name={[section.key, 'itemWeights']}
								label="Hệ số cho từng item"
							>
								<div className={componentStyles.kpiWeightsContainer}>
									{selectedItems[section.key]?.map((itemId) => {
										const di = dashboardItems.find(k => k.id === itemId);
										if (!di) return null;
										return (
											<div key={itemId} className={componentStyles.kpiWeightItem}>
												<span
													className={componentStyles.kpiWeightLabel}>{di.name}</span>
												<InputNumber
													size="small"
													placeholder="Hệ số"
													min={0}
													max={100}
													className={componentStyles.kpiWeightInput}
													value={(itemWeights[section.key] && itemWeights[section.key][itemId]) || 1}
													onChange={(value) => {
														setItemWeights(prev => {
															const newWeights = { ...prev };
															if (!newWeights[section.key]) newWeights[section.key] = {};
															newWeights[section.key] = {
																...newWeights[section.key],
																[itemId]: value || 1,
															};
															return newWeights;
														});

													const currentValues = configForm.getFieldsValue();
													const newValues = { ...currentValues };
													if (!newValues[section.key]) newValues[section.key] = {};
													newValues[section.key].itemWeights = {
														...(newValues[section.key].itemWeights || {}),
														[itemId]: value || 1,
													};
													configForm.setFieldsValue(newValues);
												}}
												/>
											</div>
										);
									}) || []}
									{(!selectedItems[section.key] || selectedItems[section.key].length === 0) && (
										<div className={componentStyles.emptyState}>
											Chọn item trước để thiết lập hệ số
										</div>
									)}
								</div>
							</Form.Item>
						</Col>
					)}
									</Row>
								</Card>
							</Col>
						))}
					</Row>



				</Form>
			</Modal>

			{/* Modal Cấu hình AI riêng biệt */}
			<Modal
				title={
				<div>
					Cấu hình AI
					<Button
							type="text"
							icon={<SettingOutlined />}
							onClick={() => {
								setShowChangePinModal(true);
								setNewPin('');
								setConfirmPin('');
								setSetupPinError('');
							}}
							style={{ fontSize: '14px', color: '#1890ff' }}
						>
						Đổi mã PIN
					</Button>
				</div>}
				open={isAIConfigModalVisible}
				onCancel={() => {
					setIsAIConfigModalVisible(false);
				}}
				width={800}
				centered={true}
				style={{ height: '90vh' }}
				bodyStyle={{
					height: 'calc(90vh - 110px)',
					overflowY: 'auto',
					padding: '16px 24px',
				}}
				footer={null}
			>
				<Form form={configForm} layout="vertical">
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

					{/* Hiển thị prompt chung cho các section thông thường */}
					{(!configSectionKey || (configSectionKey !== 'overview' && configSectionKey !== 'research')) && (
						<>
							<Form.Item
								label="Prompt Bước 1 - Phân tích và chấm điểm (BẮT BUỘC)"
							>
								<TextArea
									value={aiPromptStep1}
									onChange={(e) => setAiPromptStep1(e.target.value)}
									placeholder="Prompt cho bước phân tích và chấm điểm..."
									rows={10}
									className={componentStyles.textarea}
								/>
							</Form.Item>

							<Form.Item
								label="Prompt Bước 2 - Tạo HTML báo cáo (BẮT BUỘC)"
							>
								<TextArea
									value={aiPromptStep2}
									onChange={(e) => setAiPromptStep2(e.target.value)}
									placeholder="Prompt cho bước tạo HTML báo cáo..."
									rows={10}
									className={componentStyles.textarea}
									style={{ background: '#f1f1f1' }}
								/>
							</Form.Item>
						</>
					)}

					{/* Hiển thị prompt riêng cho section Tổng quan */}
					{configSectionKey === 'overview' && (
						<>
							<Form.Item
								label="Prompt Bước 1 riêng cho phần Tổng quan"
							>
								<TextArea
									value={aiPromptOverview}
									onChange={(e) => setAiPromptOverview(e.target.value)}
									placeholder="Prompt riêng cho bước 1 của phần Tổng quan..."
									rows={10}
									className={componentStyles.textarea}
								/>
							</Form.Item>
							<Form.Item
								label="Prompt Bước 2 riêng cho phần Tổng quan"
							>
								<TextArea
									value={aiPromptOverviewStep2}
									onChange={(e) => setAiPromptOverviewStep2(e.target.value)}
									placeholder="Prompt riêng cho bước 2 của phần Tổng quan..."
									rows={10}
									className={componentStyles.textarea}
									style={{ background: '#f1f1f1' }}
								/>
							</Form.Item>
						</>
					)}

					{/* Hiển thị prompt riêng cho section Nghiên cứu */}
					{configSectionKey === 'research' && (
						<>
							<Form.Item
								label="Prompt Bước 1 riêng cho phần Nghiên cứu"
							>
								<TextArea
									value={aiPromptResearch}
									onChange={(e) => setAiPromptResearch(e.target.value)}
									placeholder="Prompt riêng cho bước 1 của phần Nghiên cứu..."
									rows={15}
									className={componentStyles.textarea}
								/>
							</Form.Item>
							<Form.Item
								label="Prompt Bước 2 riêng cho phần Nghiên cứu"
							>
								<TextArea
									value={aiPromptResearchStep2}
									onChange={(e) => setAiPromptResearchStep2(e.target.value)}
									placeholder="Prompt riêng cho bước 2 của phần Nghiên cứu..."
									rows={15}
									className={componentStyles.textarea}
									style={{ background: '#f1f1f1' }}
								/>
							</Form.Item>
						</>
					)}
				</Form>
			</Modal>

	{!isMobile && (
		<Modal
			title={
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<span>Chi tiết phân tích - {selectedSection?.name || ''}</span>

				</div>
			}
			open={showDetailModal}
			onCancel={() => {
				setShowDetailModal(false);
				setChatMessages([]); // Reset chat khi đóng modal
			}}
			footer={[
				<Button key="edit" type="primary" onClick={() => {
					setShowDetailModal(false);
					setConfigSectionKey(selectedSection?.key || null);
					if (selectedSection?.key) handleOpenConfigModal();
				}}>
					Sửa cấu hình {selectedSection?.name || ''}
				</Button>,
			]}
			width={'95vw'}
			centered={true}
			style={{ height: '90vh' }}
			bodyStyle={{
				height: 'calc(90vh - 110px)',
				overflow: 'hidden',
				padding: '16px',
				display: 'flex',
				gap: '16px',
			}}
		>
			{selectedSection && (
				<div style={{ display: 'flex', gap: '16px', height: '100%', width: '100%' }}>
					{/* 70% bên trái - Hiển thị HTML hoặc analysisText */}
					<div style={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column' }}>
						{/* Header với toggle */}
						<div style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '12px 16px',
							borderBottom: '1px solid #f0f0f0',
							backgroundColor: '#fafafa',
							borderRadius: '8px 8px 0 0'
						}}>
							<Typography.Title level={5} style={{ margin: 0, fontSize: '14px', color: '#262626' }}>
								Kết quả phân tích
							</Typography.Title>
							<div style={{ display: 'flex', gap: '8px' }}>
								<Button
									size="small"
									type={showHTMLView ? 'primary' : 'default'}
									onClick={() => setShowHTMLView(true)}
								>
									HTML
								</Button>
								<Button
									size="small"
									type={!showHTMLView ? 'primary' : 'default'}
									onClick={() => setShowHTMLView(false)}
								>
									Text
								</Button>
							</div>
						</div>

						{/* Content */}
						<div style={{
							flex: 1,
							overflow: 'auto',
							padding: '16px',
							backgroundColor: '#fff',
							borderRadius: '0 0 8px 8px',
							border: '1px solid #e8e8e8',
							borderTop: 'none'
						}}>
							{showHTMLView ? (
								scores?.[selectedSection.key]?.analysis ? (
									<div
										className={`${styles.analysisContent} ${componentStyles.analysisContent}`}
										dangerouslySetInnerHTML={{
											__html: renderHTML(scores?.[selectedSection.key]?.analysis),
										}}
									/>
								) : (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										height: '100%',
										minHeight: '200px',
										backgroundColor: '#fafafa',
										borderRadius: '6px',
										border: '2px dashed #d9d9d9'
									}}>
										<div style={{ textAlign: 'center' }}>
											<RobotOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
											<Typography.Paragraph style={{ margin: 0, color: '#8c8c8c', fontSize: '14px' }}>
												Chưa có kết quả phân tích HTML. Vui lòng thử phân tích lại.
											</Typography.Paragraph>
										</div>
									</div>
								)
							) : (
								scores?.[selectedSection.key]?.analysisText ? (
									<div style={{
										lineHeight: '1.6',
										color: '#262626',
										fontSize: '14px',
										whiteSpace: 'pre-wrap'
									}}>
										<div
											style={{
												lineHeight: '1.5',
												color: '#262626',
												fontSize: '12px',
												padding: 12
											}}
											dangerouslySetInnerHTML={{
												__html: renderMarkdown(scores[selectedSection.key].analysisText),
											}}
										/>
									</div>
								) : (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										height: '100%',
										minHeight: '200px',
										backgroundColor: '#fafafa',
										borderRadius: '6px',
										border: '2px dashed #d9d9d9'
									}}>
										<div style={{ textAlign: 'center' }}>
											<RobotOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
											<Typography.Paragraph style={{ margin: 0, color: '#8c8c8c', fontSize: '14px' }}>
												Chưa có kết quả phân tích text. Vui lòng thử phân tích lại.
											</Typography.Paragraph>
										</div>
									</div>
								)
							)}
						</div>
					</div>

					{/* 30% bên phải - AI Chat */}
					<div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column' }}>
						{/* Header */}
						<div style={{
							padding: '12px 16px',
							borderBottom: '1px solid #f0f0f0',
							backgroundColor: '#fafafa',
							borderRadius: '8px 8px 0 0'
						}}>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center'
							}}>
								<Typography.Title level={5} style={{
									margin: 0,
									fontSize: '14px',
									color: '#262626'
								}}>
									AI Chat
									{(() => {
										const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isSystem && !msg.isInitial);
										const remainingMessages = 5 - userMessages.length;
										return (
											<span style={{
												fontSize: '11px',
												fontWeight: 'normal',
												color: remainingMessages <= 1 ? '#ff4d4f' : remainingMessages <= 2 ? '#fa8c16' : '#8c8c8c',
												marginLeft: '8px'
											}}>
												({userMessages.length}/5)
											</span>
										);
									})()}
								</Typography.Title>

								<Space>
									<Select
										value={selectedAIModelDetail}
										onChange={setSelectedAIModelDetail}
										size="small"
										style={{ width: '120px' }}
									>
										{MODEL_AI_LIST_DB.map(model => (
											<Option key={model.value} value={model.value}>
												{model.name}
											</Option>
										))}
									</Select>
									<Button
										type={useWebSearch ? 'primary' : 'default'}
										size="small"
										onClick={() => setUseWebSearch(!useWebSearch)}
										title={useWebSearch ? 'Tắt Websearch' : 'Bật Websearch'}
										style={{ fontSize: '11px' }}
									>
										🌐 {useWebSearch ? 'ON' : 'OFF'}
									</Button>
									<Button
										type="default"
										size="small"
										onClick={handleResetChat}
										title="Reset chat history"
										style={{ fontSize: '11px' }}
										danger
									>
										Reset
									</Button>
								</Space>
							</div>
						</div>

						{/* Chat Messages */}
						<div style={{
							flex: 1,
							overflow: 'auto',
							padding: '12px',
							display: 'flex',
							flexDirection: 'column',
							gap: '12px',
							backgroundColor: '#fff',
							border: '1px solid #e8e8e8',
							borderTop: 'none'
						}}>
							{chatMessages.length === 0 ? (
								<div style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									height: '100%',
									minHeight: '150px',
									backgroundColor: '#fafafa',
									borderRadius: '6px',
									border: '2px dashed #d9d9d9',
									flexDirection: 'column',
									gap: '8px'
								}}>
									<RobotOutlined style={{ fontSize: '32px', color: '#d9d9d9' }} />
									<Typography.Text style={{
										color: '#8c8c8c',
										fontSize: '12px',
										textAlign: 'center'
									}}>
										Chưa có cuộc trò chuyện nào.<br />
										Bắt đầu hỏi AI để có thông tin chi tiết hơn!
									</Typography.Text>
								</div>
							) : (
								chatMessages.map((message) => (
									<div
										key={message.id}
										style={{
											display: 'flex',
											gap: '8px',
											alignItems: 'flex-start',
										}}
									>
										<Avatar
											size={24}
											icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
											style={{
												background: message.type === 'user' ? '#1890ff' : '#52c41a',
												flexShrink: 0
											}}
										/>
										<div style={{
											flex: 1,
											backgroundColor: message.isInitial ? '#fff7e6' : (message.type === 'user' ? '#f0f8ff' : '#f6ffed'),
											padding: '6px 10px',
											borderRadius: '8px',
											border: `1px solid ${message.isInitial ? '#ffd591' : (message.type === 'user' ? '#d6e4ff' : '#b7eb8f')}`,
											maxWidth: '85%',
											wordBreak: 'break-word'
										}}>
											<div
												style={{
													lineHeight: '1.5',
													color: '#262626',
													fontSize: '12px',
													padding: 12
												}}
												dangerouslySetInnerHTML={{
													__html: renderMarkdown(message.content),
												}}
											/>
											{message.citations && (
												<div style={{
													marginTop: '6px',
													padding: '4px 6px',
													backgroundColor: '#fff',
													borderRadius: '4px',
													border: '1px solid #e8e8e8',
													fontSize: '10px',
													color: '#8c8c8c'
												}}>
													📎 Nguồn tham khảo: {message.citations.length} nguồn
												</div>
											)}
											<div style={{
												fontSize: '9px',
												color: '#8c8c8c',
												marginTop: '4px',
												textAlign: 'right'
											}}>
												{message.timestamp.toLocaleTimeString('vi-VN', {
													hour: '2-digit',
													minute: '2-digit'
												})}
											</div>
										</div>
									</div>
								))
							)}

							{/* Typing indicator */}
							{isTyping && (
								<div style={{
									display: 'flex',
									gap: '8px',
									alignItems: 'flex-start'
								}}>
									<Avatar
										size={24}
										icon={<RobotOutlined />}
										style={{ background: '#52c41a', flexShrink: 0 }}
									/>
									<div style={{
										backgroundColor: '#f6ffed',
										padding: '6px 10px',
										borderRadius: '8px',
										border: '1px solid #b7eb8f'
									}}>
										<div style={{
											display: 'flex',
											gap: '4px',
											alignItems: 'center'
										}}>
											<span style={{ fontSize: '11px', color: '#8c8c8c' }}>AI đang trả lời</span>
											<div style={{ display: 'flex', gap: '2px' }}>
												<span style={{
													width: '3px',
													height: '3px',
													borderRadius: '50%',
													backgroundColor: '#52c41a',
													animation: 'typing 1.4s infinite ease-in-out'
												}}></span>
												<span style={{
													width: '3px',
													height: '3px',
													borderRadius: '50%',
													backgroundColor: '#52c41a',
													animation: 'typing 1.4s infinite ease-in-out 0.2s'
												}}></span>
												<span style={{
													width: '3px',
													height: '3px',
													borderRadius: '50%',
													backgroundColor: '#52c41a',
													animation: 'typing 1.4s infinite ease-in-out 0.4s'
												}}></span>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Chat Input */}
						<div style={{
							padding: '12px 16px',
							borderTop: '1px solid #f0f0f0',
							backgroundColor: '#fafafa',
							borderRadius: '0 0 8px 8px'
						}}>
							{/* Thông báo khi đạt giới hạn */}
							{(() => {
								const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isSystem);
								const remainingMessages = 5 - userMessages.length;
								if (remainingMessages <= 0) {
									return (
										<div style={{
											marginBottom: '12px',
											padding: '8px 12px',
											backgroundColor: '#fff2f0',
											border: '1px solid #ffccc7',
											borderRadius: '6px',
											display: 'flex',
											alignItems: 'center',
											gap: '8px'
										}}>
											<RobotOutlined style={{ color: '#ff4d4f', fontSize: '14px' }} />
											<Typography.Text style={{
												color: '#ff4d4f',
												fontSize: '11px',
												fontWeight: '500'
											}}>
												Bạn đã đạt giới hạn 5 tin nhắn! Nhấn nút "Reset" để bắt đầu cuộc trò chuyện mới.
											</Typography.Text>
										</div>
									);
								}
								return null;
							})()}

							<div style={{
								display: 'flex',
								gap: '8px',
								alignItems: 'flex-end'
							}}>
								<Input.TextArea
									value={inputMessage}
									onChange={(e) => setInputMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder={(() => {
										const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isSystem && !msg.isInitial);
										const remainingMessages = 5 - userMessages.length;
										if (remainingMessages <= 0) {
											return 'Đã đạt giới hạn 5 tin nhắn. Nhấn Reset để tiếp tục.';
										}
										return `Nhập câu hỏi... (Enter để gửi, Shift+Enter để xuống dòng) - Còn ${remainingMessages} tin nhắn`;
									})()}
									autoSize={{ minRows: 1, maxRows: 3 }}
									style={{
										flex: 1,
										resize: 'none',
										fontSize: '12px'
									}}
									disabled={isTyping || (() => {
										const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isSystem && !msg.isInitial);
										return userMessages.length >= 5;
									})()}
								/>
								<Button
									type="primary"
									icon={<SendOutlined />}
									onClick={handleSendMessage}
									disabled={!inputMessage.trim() || isTyping || (() => {
										const userMessages = chatMessages.filter(msg => msg.type === 'user' && !msg.isSystem && !msg.isInitial);
										return userMessages.length >= 5;
									})()}
									size="small"
								>
									Gửi
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</Modal>
	)}




{/* CSS Animation cho typing indicator */ }
<style>
	{`
				@keyframes typing {
					0%, 60%, 100% {
						transform: translateY(0);
					}
					30% {
						transform: translateY(-10px);
					}
				}
				`}
</style>
		</>
	);
});

DefaultDashboardCardByItem.displayName = 'DefaultDashboardCardByItem';

export default DefaultDashboardCardByItem;


