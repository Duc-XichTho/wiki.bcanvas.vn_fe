import { createCanvasChat, getAllCanvasChat, updateCanvasChat } from '../../../apis/CanvasChatService.jsx';
import { filterArrayByMonth } from './logicFilterMonth.js';
import { fetchDataTHCKKH } from '../../KHKD/KHKDChuKy/logicKHKDBanHang.js';
import { answerSingleQuestion } from '../../../apis/botService.jsx';
import { loadKPIData } from '../../KHKD/KHKDTongHop/KPI/logicKHKDKPI.js';

const DEFAULT_PROMPTS = {
	KPI: "Phân tích dữ liệu KPI",
	KD: "Phân tích dữ liệu kinh doanh",
	DT: "Phân tích dữ liệu dòng tiền",
	DL: "Phân tích dữ liệu đo lường",
	BH: "Phân tích dữ liệu bán hàng",
};

export const autoAnalyzeAllTypes = async (
	dataKQKD, dataDoLuong, dataDT,
	selectedMonth, khkdTH, dataTT, canvasBot
) => {
	let dKPIDataAI = await loadKPIData(dataDoLuong, khkdTH.id);
	const existing = await getAllCanvasChat();
	const today = new Date().toISOString().split("T")[0];

	// Map of type to show flag in khkdTH
	const typeToShowFlag = {
		'KPI': 'showKPI',
		'KD': 'showKD',
		'DT': 'showDT',
		'DL': 'showDL',
		'BH': 'showBH'
	};

	for (const [type, defaultPrompt] of Object.entries(DEFAULT_PROMPTS)) {
		// Skip if this type is not enabled in khkdTH
		if (!khkdTH[typeToShowFlag[type]]) {
			continue;
		}

		let q = existing.find((x) => 
			x.typeKHKD == type && 
			x.idKHKD == khkdTH.id && 
			x.month == selectedMonth
		);
		let needAnalyze = !q;
		let prompt = defaultPrompt;

		if (!q) {
			q = { question: defaultPrompt, typeKHKD: type, month: selectedMonth };
		} else {
			prompt = q.question || defaultPrompt;
		}

		if (needAnalyze) {
			let data = '';
			if (type === 'DL') data = JSON.stringify({ 'Đo lường': filterArrayByMonth(dataKQKD, selectedMonth) });
			if (type === 'KD') data = JSON.stringify({ 'Kinh doanh': filterArrayByMonth(dataDoLuong, selectedMonth) });
			if (type === 'DT') data = JSON.stringify({ 'Dòng tiền': filterArrayByMonth(dataDT, selectedMonth) });
			if (type === 'KPI') data = JSON.stringify({ 'KPI': filterArrayByMonth(dKPIDataAI, selectedMonth) });
			if (type === 'BH') {
				const dataBH = await fetchDataTHCKKH(khkdTH, selectedMonth, dataTT);
				data = JSON.stringify({ 'Bán hàng': dataBH });
			}

			try {
				const answer = await answerSingleQuestion({
					prompt: prompt,
					system: canvasBot.system + '. Dữ liệu như sau ' + data +'. Câu trả lời dạng numbering, không markdown, không sử dụng ký tự #, và vẫn xuống dòng',
					model: canvasBot.model,
				});

				const newData = {
					canvasDataId: canvasBot.id,
					question: prompt,
					title: prompt,
					answer: answer.answer,
					typeKHKD: type,
					idKHKD: khkdTH.id,
					month: selectedMonth,
					update_at: new Date().toISOString(),
				};

				if (q.id) {
					await updateCanvasChat({ id: q.id, ...newData });
				} else {
					await createCanvasChat(newData);
				}
			} catch (error) {
				console.error(`Lỗi khi phân tích ${type}:`, error);
			}
		}
	}
};

