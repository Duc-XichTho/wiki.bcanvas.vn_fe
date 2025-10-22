import { useState, useEffect, useRef } from 'react';
import css from './Pestel.module.css';
import Body from './components/Body/Body.jsx';
import Footer from './components/Footer/Footer.jsx';
import { Switch, Button, Spin, message, Modal, Input, Row, Col, Space, Dropdown, Menu, Select } from 'antd';
import { answerSingleQuestion } from "../../../../apis/botService.jsx";
import { getCurrentUserLogin } from "../../../../apis/userService.jsx";
import { getAllPhanTichNote, createPhanTichNote, updatePhanTichNote } from "../../../../apisKTQT/phantichNoteService.jsx";
import dayjs from 'dayjs';
import { MoreOutlined } from '@ant-design/icons';
import TiptapChild2 from '../ComponentWarehouse/TiptapChild2.jsx';
import { log } from 'mathjs';
import { Logger } from 'ag-grid-community';
import { Settings } from 'lucide-react';
import { MODEL_AI } from '../../../../CONST.js';
import './PestelHighlight.css';
import { marked } from 'marked';
import { webSearch } from '../../../../apis/botService.jsx';

export default function Pestel() {
	const [showBody, setShowBody] = useState(true);
	const [childElements, setChildElements] = useState([]);
	const [highlightData, setHighlightData] = useState(null);
	const [loadingPESTEL, setLoadingPESTEL] = useState(false);
	const [loadingHighlight, setLoadingHighlight] = useState(false);
	const [footerKey, setFooterKey] = useState(0);
	const [autoChecked, setAutoChecked] = useState(false);
	const [showPromptModal, setShowPromptModal] = useState(false);
	const [loading, setLoading] = useState(false);

	// New state variables for the analysis modal
	const [showAnalysisModal, setShowAnalysisModal] = useState(false);
	const [currentPrompt, setCurrentPrompt] = useState('');
	const [jsonResult, setJsonResult] = useState('');
	const [previewResult, setPreviewResult] = useState({});
	const [analyzeLoading, setAnalyzeLoading] = useState(false);

	// Thêm state cho provider/model
	const [aiProvider, setAiProvider] = useState('GPT');
	const [aiModel, setAiModel] = useState(MODEL_AI['GPT'][0].value);

	const items = [
		{ name: "PESTEL_CHILD_1", letter: "P", subText: "Chính trị" },
		{ name: "PESTEL_CHILD_2", letter: "E", subText: "Kinh tế" },
		{ name: "PESTEL_CHILD_3", letter: "S", subText: "Xã hội" },
		{ name: "PESTEL_CHILD_4", letter: "T", subText: "Công nghệ" },
		{ name: "PESTEL_CHILD_5", letter: "E", subText: "Môi trường" },
		{ name: "PESTEL_CHILD_6", letter: "L", subText: "Pháp lý" }
	];

	const highlightItem = {
		name: "PESTEL_HIGHLIGHTS",
		subText: "TIÊU ĐIỂM"
	};

	const fetchData = async () => {
		try {
			const data = await getAllPhanTichNote();
			const childElementsData = data.filter(element => items.some(i => i.name === element.table));
			const found = data.find(note => note.table === highlightItem.name);
			setChildElements(childElementsData);
			if (found) {

				setHighlightData({
					...found,
					body: formatHighlightContent(found.body),
				});
			}


		} catch (error) {
			console.log(error);
		}
	};

	const fetchHighlightData = async () => {
		try {
			const allNotes = await getAllPhanTichNote();
			const found = allNotes.find(note => note.table === highlightItem.name);
			if (found) {

				setHighlightData({
					...found,
					body: formatHighlightContent(found.body),
				});
			}
		} catch (error) {
			console.error("Lỗi khi lấy dữ liệu TIÊU ĐIỂM:", error);
		}
	};

	const formatHighlightContent = (raw) => {
		if (!raw) return '';

		const sectionTitles = [
			'CHÍNH TRỊ',
			'KINH TẾ',
			'XÃ HỘI',
			'CÔNG NGHỆ',
			'MÔI TRƯỜNG',
			'PHÁP LÝ',
		];

		let minIndex = -1;
		for (const title of sectionTitles) {
			const idx = raw.toUpperCase().indexOf(title);
			if (idx !== -1 && (minIndex === -1 || idx < minIndex)) {
				minIndex = idx;
			}
		}

		let content = raw;
		if (minIndex !== -1) {
			// Tìm vị trí xuống dòng gần nhất trước tiêu đề (hoặc đầu chuỗi)
			let startIdx = raw.lastIndexOf('\n', minIndex);
			if (startIdx === -1) startIdx = 0; else startIdx += 1; // bỏ qua ký tự \n
			content = raw.slice(startIdx);
		}
		return marked.parse(content);
	};



	// New function to handle analysis with the prompt from modal
	const handleAnalyzeWithPrompt = async () => {
		setAnalyzeLoading(true);
		try {
			await savePromptConfig();
			const result = await answerSingleQuestion({
				prompt: currentPrompt,
				system: `Hãy phân tích chính xác và kỹ lưỡng các khía cạnh PESTEL của nền kinh tế Việt Nam. Tuân thủ chính xác định dạng yêu cầu và đảm bảo mỗi phần đều có đầy đủ thông tin, thông tin được tìm kiếm càng gần ${new Date().toLocaleDateString('vi-VN')} càng tốt`,
				model: aiModel,
			});

			if (result?.answer) {
				try {
					// Lưu văn bản phản hồi đầy đủ vào phần JSON preview để người dùng xem
					setJsonResult(result.answer);

					// Log phản hồi để debug
					console.log("AI response:", result.answer.substring(0, 200) + "...");

					// Phân tích phản hồi dạng văn bản
					const previewContent = parseTextResponse(result.answer);

					// Kiểm tra xem đã parse được dữ liệu chưa
					if (Object.keys(previewContent).length === 0) {
						console.error("Không phân tích được nội dung từ phản hồi");
						message.warning("Không thể phân tích đầy đủ kết quả từ AI. Vui lòng kiểm tra định dạng phản hồi.", 5);
					} else {
						setPreviewResult(previewContent);
						message.success("Đã phân tích thành công!", 2);
					}

					// Save the preview data to the database
					await savePreviewData(result.answer, previewContent);
				} catch (e) {
					console.error("Text parsing error:", e);
					message.error("Lỗi khi phân tích phản hồi: " + e.message);
				}
			} else {
				message.error("Không nhận được phản hồi từ AI hoặc phản hồi không hợp lệ");
			}
		} catch (error) {
			console.error("Lỗi phân tích:", error);
			message.error("Lỗi khi phân tích: " + error.message);
		} finally {
			setAnalyzeLoading(false);
		}
	};

	// Hàm phân tích phản hồi dạng văn bản để tạo nội dung xem trước
	const parseTextResponse = (text) => {
		const previewContent = {};

		// Các cặp giá trị đối chiếu số thứ tự và tên mục
		const sectionMap = {
			'1': 'Chính trị',
			'2': 'Kinh tế',
			'3': 'Xã hội',
			'4': 'Công nghệ',
			'5': 'Môi trường',
			'6': 'Pháp lý'
		};

		// Tạo regex để tìm các phần
		Object.entries(sectionMap).forEach(([number, name]) => {
			// Cải thiện regex để bắt đúng các phần theo số thứ tự và tiêu đề
			// Sử dụng (?:.*?) để bắt có hoặc không có nội dung giữa số và tên
			const sectionRegex = new RegExp(`${number}(?:\\.\\s*|\\s+)${name}[\\s\\S]*?(?=(?:\\d+(?:\\.\\s*|\\s+)(?:${Object.values(sectionMap).join('|')})|$))`, 'i');
			const match = text.match(sectionRegex);

			if (match) {
				const sectionContent = match[0].trim();
				console.log(`Found section ${name}:`, { sectionContent: sectionContent.substring(0, 50) + '...' });

				// Cải thiện regex để bắt các mục nhỏ (Tin tức, Thuận lợi, Thách thức, Nguồn)
				// Sử dụng một regex mạnh hơn với lookbehind và lookahead
				const tinTucRegex = /(?:^|\n)-\s*Tin tức:\s*([\s\S]*?)(?=(?:\n-\s*(?:Thuận lợi|Thách thức|Nguồn):|$))/i;
				const thuanLoiRegex = /(?:^|\n)-\s*Thuận lợi:\s*([\s\S]*?)(?=(?:\n-\s*(?:Tin tức|Thách thức|Nguồn):|$))/i;
				const thachThucRegex = /(?:^|\n)-\s*Thách thức:\s*([\s\S]*?)(?=(?:\n-\s*(?:Tin tức|Thuận lợi|Nguồn):|$|\n\d+\.))/i;
				// Vẫn bắt Nguồn để xử lý, nhưng sẽ không hiển thị
				const nguonRegex = /(?:^|\n)-\s*Nguồn:\s*([\s\S]*?)(?=(?:\n-\s*(?:Tin tức|Thuận lợi|Thách thức):|$|\n\d+\.))/i;

				const tinTucMatch = sectionContent.match(tinTucRegex);
				const thuanLoiMatch = sectionContent.match(thuanLoiRegex);
				const thachThucMatch = sectionContent.match(thachThucRegex);
				const nguonMatch = sectionContent.match(nguonRegex);

				// Trích xuất và chuẩn bị nội dung
				const tinTuc = tinTucMatch && tinTucMatch[1] ? tinTucMatch[1].trim() : '';
				const thuanLoi = thuanLoiMatch && thuanLoiMatch[1] ? thuanLoiMatch[1].trim() : '';
				const thachThuc = thachThucMatch && thachThucMatch[1] ? thachThucMatch[1].trim() : '';
				const nguon = nguonMatch && nguonMatch[1] ? nguonMatch[1].trim() : '';

				// Xử lý các liên kết trong phần Nguồn (để lưu lại nhưng không hiển thị)
				processNguonLinks(nguon);

				console.log(`Section ${name} parsed:`, {
					tinTuc: tinTuc.substring(0, 30) + '...',
					thuanLoi: thuanLoi.substring(0, 30) + '...',
					thachThuc: thachThuc.substring(0, 30) + '...'
				});

				// Tìm item tương ứng
				const item = items.find(i => i.subText === name);
				if (item) {
					// Cải thiện định dạng HTML cho kết quả xem trước, nhưng không hiển thị phần Nguồn
					previewContent[item.name] = `
						<div style="margin-bottom: 10px"><span style="color: black; font-weight: bold;">Tin tức:</span> ${tinTuc}</div>
						<div style="margin-bottom: 10px"><span style="color: #006400; font-weight: bold;">Thuận lợi:</span> ${thuanLoi}</div>
						<div style="margin-bottom: 10px"><span style="color: red; font-weight: bold;">Thách thức:</span> ${thachThuc}</div>
					`;
				}
			} else {
				console.log(`Section ${name} not found in the text response`);
			}
		});

		return previewContent;
	};

	// Hàm xử lý và highlight các liên kết trong phần Nguồn
	const processNguonLinks = (nguonText) => {
		if (!nguonText) return '';

		// Highlight các đường link web thông thường (http://, https://)
		let processed = nguonText.replace(
			/(https?:\/\/[^\s,]+)/g,
			'<a href="$1" target="_blank" rel="noopener noreferrer" class="highlight-link">$1</a>'
		);

		// Highlight các domain phổ biến không có http/https
		processed = processed.replace(
			/\b(?!https?:\/\/)([a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|vn|org|gov|net|io|edu|co)(?:\.[a-z]{2,3})?)\b/g,
			'<a href="https://$1" target="_blank" rel="noopener noreferrer" class="highlight-link">$1</a>'
		);

		// Highlight các liên kết markdown [text](url)
		processed = processed.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="$2" target="_blank" rel="noopener noreferrer" class="highlight-link">$1</a>'
		);

		return processed;
	};

	// Hàm kiểm tra đã cập nhật hôm nay chưa (dựa vào trường updatedAt)
	const isUpdatedToday = (notes) => {
		const today = dayjs().format('YYYY-MM-DD');
		return notes.every(note => note?.update_at && dayjs(note.update_at).format('YYYY-MM-DD') === today);
	};

	// Hàm kiểm tra 1 note đã cập nhật hôm nay chưa
	const isNoteUpdatedToday = (note) => {
		const today = dayjs().format('YYYY-MM-DD');
		return note?.update_at && dayjs(note.update_at).format('YYYY-MM-DD') === today;
	};

	// Hàm kiểm tra và tự động cập nhật nếu cần	

	const handleHighlightAnalyze = async () => {
		setLoadingHighlight(true);
		const allNotes = await getAllPhanTichNote();
		const promtNote = allNotes.find(n => n.table === 'PROMT_TIEUDIEMKHAC');

		try {
			const promptText = promtNote?.body || '';

			const result = await webSearch({
				prompt: promptText,
				model: 'gemini-2.5-flash-preview-05-20',
			});

			if (!result?.data) {
				message.error("Không nhận được phản hồi từ AI.");
				setLoadingHighlight(false);
				return;
			}

			// Định dạng HTML từ phản hồi văn bản
			let html = formatHighlightContent(result.data);

			const { data: user } = await getCurrentUserLogin();
			const foundNote = allNotes.find(n => n.table === highlightItem.name);
			if (foundNote) {
				await updatePhanTichNote(foundNote.id, {
					body: html,
					user_name: user?.name,
					user_email: user?.email,
					table: highlightItem.name,
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			} else {
				await createPhanTichNote({
					body: html,
					user_name: user?.name,
					user_email: user?.email,
					table: highlightItem.name,
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			}
			setHighlightData({
				body: html,
				update_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
				name: highlightItem.name,
			});
			message.success("Đã cập nhật TIÊU ĐIỂM!");
			await fetchHighlightData();
			setFooterKey(prev => prev + 1);
		} catch (error) {
			console.error("Lỗi phân tích tiêu điểm:", error);
			message.error("Lỗi khi phân tích tiêu điểm!");
		} finally {
			setLoadingHighlight(false);
		}
	};

	const getLatestUpdateTime = (notes) => {
		if (!notes || notes.length === 0) return null;
		let max = null;
		notes.forEach(note => {
			if (note?.update_at) {
				if (!max || dayjs(note.update_at).isAfter(dayjs(max))) {
					max = note.update_at;
				}

			}
		});
		return max;
	};

	useEffect(() => {
		fetchData();
		fetchHighlightData();
		loadSavedPreviewData(); // Load saved preview data when component mounts
	}, []);

	// New function to load saved JSON and preview data
	const loadSavedPreviewData = async () => {
		try {
			const allNotes = await getAllPhanTichNote();
			const jsonPreview = allNotes.find(note => note.table === 'pestel_preview_json');
			const resultPreview = allNotes.find(note => note.table === 'pestel_preview_result');

			if (jsonPreview && jsonPreview.body) {
				setJsonResult(jsonPreview.body.replace(/<[^>]+>/g, ''));
			}

			if (resultPreview && resultPreview.body) {
				try {
					// Parse the JSON string but preserve HTML tags inside
					const cleanedBody = resultPreview.body.replace(/<p>|<\/p>/g, '');
					const parsedPreview = JSON.parse(cleanedBody);
					setPreviewResult(parsedPreview);
				} catch (error) {
					console.error("Error parsing preview result:", error);
				}
			}
		} catch (error) {
			console.error("Error loading preview data:", error);
		}
	};

	// New function to save preview data
	const savePreviewData = async (jsonData, previewData) => {
		try {
			const { data: user } = await getCurrentUserLogin();
			const allNotes = await getAllPhanTichNote();

			// Save JSON preview
			const jsonPreview = allNotes.find(note => note.table === 'pestel_preview_json');
			if (jsonPreview) {
				await updatePhanTichNote(jsonPreview.id, {
					body: jsonData,
					user_name: user?.name,
					user_email: user?.email,
					table: 'pestel_preview_json',
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			} else {
				await createPhanTichNote({
					body: jsonData,
					user_name: user?.name,
					user_email: user?.email,
					table: 'pestel_preview_json',
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			}

			// Save preview result with HTML preserved
			const resultPreview = allNotes.find(note => note.table === 'pestel_preview_result');
			if (resultPreview) {
				await updatePhanTichNote(resultPreview.id, {
					body: JSON.stringify(previewData),
					user_name: user?.name,
					user_email: user?.email,
					table: 'pestel_preview_result',
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			} else {
				await createPhanTichNote({
					body: JSON.stringify(previewData),
					user_name: user?.name,
					user_email: user?.email,
					table: 'pestel_preview_result',
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			}
		} catch (error) {
			console.error("Error saving preview data:", error);
		}
	};

	// Save custom prompt to database
	const saveCustomPrompt = async (promptText) => {
		try {
			const { data: user } = await getCurrentUserLogin();
			const allNotes = await getAllPhanTichNote();

			// Save custom prompt
			const customPromptNote = allNotes.find(note => note.table === 'pestel_custom_prompt');
			if (customPromptNote) {
				await updatePhanTichNote(customPromptNote.id, {
					body: promptText,
					user_name: user?.name,
					user_email: user?.email,
					table: 'pestel_custom_prompt',
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			} else {
				await createPhanTichNote({
					body: promptText,
					user_name: user?.name,
					user_email: user?.email,
					table: 'pestel_custom_prompt',
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			}
		} catch (error) {
			console.error("Error saving custom prompt:", error);
		}
	};

	// Load custom prompt if exists
	const loadCustomPrompt = async () => {
		try {
			const allNotes = await getAllPhanTichNote();
			const customPromptNote = allNotes.find(note => note.table === 'pestel_custom_prompt');

			if (customPromptNote && customPromptNote.body) {
				return customPromptNote.body.replace(/<p>|<\/p>/g, '');
			}
			return null;
		} catch (error) {
			console.error("Error loading custom prompt:", error);
			return null;
		}
	};

	// Get default prompt text
	const getDefaultPromptText = async () => {
		const data = await getAllPhanTichNote();
		const promtNote = data.find(note => note.table === 'PROMT_PESTEL');
		const defaultPromptTail = `- Mỗi phần phải bao gồm số liệu cụ thể ví dụ thực tế hoặc thông tin cập nhật gần nhất (càng gần ${new Date().toLocaleDateString('vi-VN')} càng tốt).
- Ưu tiên sử dụng thông tin từ các nguồn đáng tin cậy ưu tiên trong danh sách sau:
	VnExpress.net
	VietNamNet.vn
	CafeF.vn
	CafeBiz.vn 
	VnEconomy.vn 
	ThoiBaoTaiChinh.vn 
	Tapchitaichinh.vn
	MPI.gov.vn
	SBV.gov.vn
	GSO.gov.vn
	VCCI.com.vn 
	HSX.vn 
	DauTuChungKhoan.vn
	Hoặc các trang báo nước ngoài lớn, chính thống Reuters, Bloomberg, Financial Times, Nikkei Asia.
- Nội dung đưa ra nên cô đọng, tập trung vào thông tin quan trọng, có số liệu/ dẫn chứng, cơ sở đầy đủ, nếu có thể, hãy quote thêm nguồn số liệu (đường link cụ thể) vào phía cuối.
- Nội dung phân tích phải chi tiết và đầy đủ, đặc biệt là phần Tin tức, Thuận lợi và Thách thức.`;

		return `Hãy phân tích thị trường và nền kinh tế Việt Nam theo 6 yếu tố PESTEL (Chính trị, Kinh tế, Xã hội, Công nghệ, Môi trường, Pháp lý).
Hãy trả lời CHÍNH XÁC theo định dạng dưới đây, sử dụng tiêu đề và đầu dòng:

1. Chính trị
- Tin tức: [Thông tin về tình hình chính trị hiện tại của Việt Nam]
- Thuận lợi: [Các yếu tố thuận lợi về mặt chính trị]
- Thách thức: [Các thách thức về mặt chính trị]
- Nguồn: [ Nguồn lấy thông tin Chính trị]

2. Kinh tế
- Tin tức: [Thông tin về tình hình kinh tế hiện tại của Việt Nam]
- Thuận lợi: [Các yếu tố thuận lợi về mặt kinh tế]
- Thách thức: [Các thách thức về mặt kinh tế]
- Nguồn: [ Nguồn lấy thông tin Kinh tế]

3. Xã hội
- Tin tức: [Thông tin về tình hình xã hội hiện tại của Việt Nam]
- Thuận lợi: [Các yếu tố thuận lợi về mặt xã hội]
- Thách thức: [Các thách thức về mặt xã hội]
- Nguồn: [ Nguồn lấy thông tin Xã hội]

4. Công nghệ
- Tin tức: [Thông tin về tình hình công nghệ hiện tại của Việt Nam]
- Thuận lợi: [Các yếu tố thuận lợi về mặt công nghệ]
- Thách thức: [Các thách thức về mặt công nghệ]
- Nguồn: [ Nguồn lấy thông tin Công nghệ]

5. Môi trường
- Tin tức: [Thông tin về tình hình môi trường hiện tại của Việt Nam]
- Thuận lợi: [Các yếu tố thuận lợi về mặt môi trường]
- Thách thức: [Các thách thức về mặt môi trường]
- Nguồn: [ Nguồn lấy thông tin Môi trường]

6. Pháp lý
- Tin tức: [Thông tin về tình hình pháp lý hiện tại của Việt Nam]
- Thuận lợi: [Các yếu tố thuận lợi về mặt pháp lý]
- Thách thức: [Các thách thức về mặt pháp lý]
- Nguồn: [ Nguồn lấy thông tin Pháp lý]

YÊU CẦU QUAN TRỌNG:
- Phải tuân thủ CHÍNH XÁC định dạng trên với dấu # cho tiêu đề chính và dấu - cho mỗi mục con
- Mỗi mục con phải có tiêu đề được bôi đậm bằng **tiêu đề** và nội dung chi tiết ở dòng dưới
- Bắt buộc phải có đầy đủ 3 phần chính: TÍCH CỰC, THÁCH THỨC và TIN TỨC KHÁC
- Mỗi mục phải kèm theo nguồn thông tin cụ thể (tên báo/tổ chức, ngày tháng công bố)
- Tập trung vào thông tin mới nhất và có tính chất quan trọng đối với thị trường
${promtNote?.body ? promtNote.body.replace(/<[^>]+>/g, '') : defaultPromptTail}`;
	};

	// Reset prompt to default
	const resetPromptToDefault = async () => {
		try {
			const defaultPrompt = await getDefaultPromptText();
			setCurrentPrompt(defaultPrompt);
			message.success("Đã khôi phục prompt mặc định", 2);
		} catch (error) {
			console.error("Lỗi khi khôi phục prompt mặc định:", error);
			message.error("Lỗi khi khôi phục prompt mặc định!");
		}
	};

	// Hàm trích xuất JSON từ phản hồi của Claude
	const extractJSONFromResponse = (response) => {
		try {
			// Tìm chuỗi JSON hợp lệ đầu tiên trong phản hồi
			const jsonMatch = response.match(/\{[\s\S]*?\}/);
			if (jsonMatch) {
				const possibleJSON = jsonMatch[0];
				// Kiểm tra xem chuỗi này có phải là JSON hợp lệ không
				JSON.parse(possibleJSON);
				return possibleJSON;
			}

			// Nếu không tìm thấy JSON đơn giản, thử phương pháp phức tạp hơn
			// Tìm dấu { đầu tiên và dấu } cuối cùng để trích xuất JSON
			const firstBrace = response.indexOf('{');
			if (firstBrace >= 0) {
				// Tìm dấu ngoặc đóng cuối cùng tương ứng
				let depth = 1;
				let position = firstBrace + 1;

				while (position < response.length && depth > 0) {
					if (response[position] === '{') depth++;
					if (response[position] === '}') depth--;
					position++;
				}

				if (depth === 0) {
					const jsonCandidate = response.substring(firstBrace, position);
					// Thử parse để xác nhận đây là JSON hợp lệ
					try {
						JSON.parse(jsonCandidate);
						return jsonCandidate;
					} catch (e) {
						console.warn("JSON trích xuất không hợp lệ:", e);
					}
				}
			}

			// Nếu không thể trích xuất JSON, trả về toàn bộ phản hồi
			return response;
		} catch (e) {
			console.error("Lỗi khi trích xuất JSON:", e);
			return response;
		}
	};

	// New function to save the analyzed results
	const saveAnalyzedResults = async () => {
		setLoadingPESTEL(true);
		try {
			const { data: user } = await getCurrentUserLogin();
			const allNotes = await getAllPhanTichNote();

			for (let i = 0; i < items.length; i++) {
				const tableName = items[i].name;
				const coloredContent = previewResult[tableName];

				if (coloredContent) {
					const foundNote = allNotes.find(n => n.table === tableName);
					if (foundNote) {
						await updatePhanTichNote(foundNote.id, {
							body: coloredContent,
							user_name: user?.name,
							user_email: user?.email,
							table: tableName,
							update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
						});
					} else {
						await createPhanTichNote({
							body: coloredContent,
							user_name: user?.name,
							user_email: user?.email,
							table: tableName,
							update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
						});
					}
				}
			}

			message.success("Đã lưu phân tích vào từng phần!");
			await fetchData();
			setFooterKey(prev => prev + 1);
			setShowAnalysisModal(false);
		} catch (error) {
			console.error("Lỗi khi lưu dữ liệu:", error);
			message.error("Lỗi khi lưu dữ liệu!");
		} finally {
			setLoadingPESTEL(false);
		}
	};

	const toggleBody = () => {
		setShowBody(!showBody);
	};

	// Load config khi mở modal
	useEffect(() => {
		if (showPromptModal) {
			(async () => {
				const allNotes = await getAllPhanTichNote();
				const configNote = allNotes.find(note => note.table === 'PESTEL_PROMPT_CONFIG');
				if (configNote && configNote.body) {
					try {
						const parsed = JSON.parse(configNote.body);
						setCurrentPrompt(parsed.prompt || '');
						setAiProvider(parsed.provider || 'GPT');
						setAiModel(parsed.model || MODEL_AI['GPT'][0].value);
					} catch {
						setCurrentPrompt(configNote.body || '');
						setAiProvider('GPT');
						setAiModel(MODEL_AI['GPT'][0].value);
					}
				} else {
					// fallback: load old custom prompt if exists
					const customPrompt = await loadCustomPrompt();
					if (customPrompt) setCurrentPrompt(customPrompt);
					setAiProvider('GPT');
					setAiModel(MODEL_AI['GPT'][0].value);
				}
			})();
		}
	}, [showPromptModal]);

	// Khi đổi provider thì reset model về model đầu tiên của provider đó
	useEffect(() => {
		setAiModel(MODEL_AI[aiProvider][0].value);
	}, [aiProvider]);

	// Lưu config mới
	const savePromptConfig = async () => {
		try {
			const { data: user } = await getCurrentUserLogin();
			const allNotes = await getAllPhanTichNote();
			const configNote = allNotes.find(note => note.table === 'PESTEL_PROMPT_CONFIG');
			const configBody = JSON.stringify({ prompt: currentPrompt, provider: aiProvider, model: aiModel });
			if (configNote) {
				await updatePhanTichNote(configNote.id, {
					body: configBody,
					user_name: user?.name,
					user_email: user?.email,
					table: 'PESTEL_PROMPT_CONFIG',
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			} else {
				await createPhanTichNote({
					body: configBody,
					user_name: user?.name,
					user_email: user?.email,
					table: 'PESTEL_PROMPT_CONFIG',
					update_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
				});
			}
		} catch (error) {
			message.error('Lỗi khi lưu cấu hình!');
		}
	};

	return (
		<div className={css.main}>
			<div className={css.header}>
				<span>PESTEL</span>
				<Dropdown
					overlay={
						<Menu>
							<Menu.Item key="update" onClick={handleHighlightAnalyze} disabled={loadingHighlight}>
								Cập nhật TIÊU ĐIỂM
							</Menu.Item>
							<Menu.Item key="prompt" onClick={() => setShowPromptModal(true)}>
								Cài đặt prompt
							</Menu.Item>
						</Menu>
					}
					trigger={['click']}
				>
					<Button icon={<Settings size={20} />} style={{ border: 'none', background: 'none', boxShadow: 'none' }} />
				</Dropdown>
			</div>
			<div className={css.singlePanel}>
				<div
					style={{
						fontSize: 14,
						color: '#888',
						fontStyle: 'italic',
						width: '100%'
					}}
				>

					<div>
						🕒 Cập nhật TIÊU ĐIỂM lần cuối:{' '}
						{highlightData?.update_at
							? dayjs(highlightData.update_at).format('DD/MM/YYYY HH:mm:ss')
							: 'Chưa có'}
					</div>
				</div>


				{loadingHighlight && (
					<div className={css.overlay}>
						<Spin size="large" />
						<div className={css.loadingText}>
							Đang phân tích TIÊU ĐIỂM
							<span className={css.dotFlashing}></span>
						</div>
					</div>
				)}
				<div
					className={css.leftPanelContent + ' ' + css.bigContent + ' markdown-content'}
					dangerouslySetInnerHTML={{
						__html: highlightData?.body || "Chưa có dữ liệu",
					}}
				/>

			</div>
			<Modal
				open={showPromptModal}
				onCancel={() => setShowPromptModal(false)}
				title="Cài đặt prompt/model cho TIÊU ĐIỂM"
				footer={(<>
					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
						<Button onClick={() => setShowPromptModal(false)}>Đóng</Button>
						<Button type="primary" onClick={async () => { await savePromptConfig(); message.success('Đã lưu cấu hình!'); setShowPromptModal(false); }}>Lưu</Button>
					</div>
				</>)}
				centered
				width={800}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '80vh' }}>
					<div style={{ fontWeight: 600, marginBottom: 8 }}>Chọn AI Provider</div>
					<Select
						value={aiProvider}
						onChange={setAiProvider}
						options={Object.keys(MODEL_AI).map(key => ({ value: key, label: key }))}
						style={{ width: 200 }}
					/>
					<div style={{ fontWeight: 600, marginBottom: 8 }}>Chọn Model</div>
					<Select
						value={aiModel}
						onChange={setAiModel}
						options={MODEL_AI[aiProvider].map(m => ({ value: m.value, label: m.name }))}
						style={{ width: 300 }}
					/>
					<div style={{ fontWeight: 600, marginBottom: 8 }}>Prompt TIÊU ĐIỂM</div>
					<Input.TextArea
						value={currentPrompt}
						onChange={e => setCurrentPrompt(e.target.value)}
						rows={10}
						placeholder="Nhập prompt cho TIÊU ĐIỂM..."
						style={{ height: '100%' }}
					/>
				</div>
			</Modal>
		</div>
	);

}

// promt: Tìm kiếm thông tin trên internet, cung cấp về những thông tin quan trọng nhất trong 24 giờ qua về các vấn đề kinh tế, xã hội, tiêu dùng, thương mại của VIệt Nam, bao gồm cả những cập nhập mới về công nghệ có khả năng ảnh hưởng, tác động tích cực hoặc tiêu cực tới việc quản lý kinh doanh của các công ty thương mại, tiêu dùng, bán lẻ (hôn nay là ${new Date().toLocaleDateString('vi-VN')}).
// Bạn có thể tham khảo ở các trang web uy tín như:
//  - Báo tiếng Việt nhiều người xem nhất VnExpress (vnexpress.net) ...
//  - Báo Mới. ...
//    - Báo điện tử Dân Trí (dantri.com.vn) ...
//  - 24h.com.vn. ...
//  - Báo Vietnamnet. ...
//   - Báo Tuổi Trẻ ...
//  - Kênh Giải trí – Xã hội Kênh14 (kenh14.vn)
//  - Báo Thanh Niên.

// Hãy trả lời theo định dạng sau (KHÔNG DÙNG JSON):

// # TÍCH CỰC

// - **[Tiêu đề tin tức tích cực 1]**
// [Nội dung chi tiết về tin tức tích cực 1, bao gồm số liệu cụ thể, ngày tháng và nguồn đáng tin cậy]

// - **[Tiêu đề tin tức tích cực 2]**
// [Nội dung chi tiết về tin tức tích cực 2, bao gồm số liệu cụ thể, ngày tháng và nguồn đáng tin cậy]

// - **[Tiêu đề tin tức tích cực 3]**
// [Nội dung chi tiết về tin tức tích cực 3, bao gồm số liệu cụ thể, ngày tháng và nguồn đáng tin cậy]

// # THÁCH THỨC

// - **[Tiêu đề thách thức 1]**
// [Nội dung chi tiết về thách thức 1, bao gồm số liệu cụ thể, ngày tháng và nguồn đáng tin cậy]

// - **[Tiêu đề thách thức 2]**
// [Nội dung chi tiết về thách thức 2, bao gồm số liệu cụ thể, ngày tháng và nguồn đáng tin cậy]

// - **[Tiêu đề thách thức 3]**
// [Nội dung chi tiết về thách thức 3, bao gồm số liệu cụ thể, ngày tháng và nguồn đáng tin cậy]

// # TIN TỨC KHÁC

// - **[Tiêu đề tin tức khác 1]**
// [Nội dung chi tiết về tin tức khác 1, bao gồm số liệu cụ thể, ngày tháng và nguồn đáng tin cậy]

// - **[Tiêu đề tin tức khác 2]**
// [Nội dung chi tiết về tin tức khác 2, bao gồm số liệu cụ thể, ngày tháng và nguồn đáng tin cậy]

// - **[Tiêu đề tin tức khác 3]**
// [Nội dung chi tiết về tin tức khác 3, bao gồm số liệu cụ thể, ngày tháng và nguồn đáng tin cậy]

// YÊU CẦU QUAN TRỌNG:
// - Bắt buộc phải tuân thủ chính xác định dạng trên với dấu # cho tiêu đề chính và dấu - cho mỗi mục con
// - Mỗi mục con phải có tiêu đề được bôi đậm bằng **tiêu đề** và nội dung chi tiết ở dòng dưới
// - Bắt buộc phải có đầy đủ 3 phần chính: TÍCH CỰC, THÁCH THỨC và TIN TỨC KHÁC
// - Mỗi mục phải kèm theo nguồn thông tin cụ thể (tên báo/tổ chức, ngày tháng công bố)
// - Tập trung vào thông tin mới nhất và có tính chất quan trọng đối với thị trường