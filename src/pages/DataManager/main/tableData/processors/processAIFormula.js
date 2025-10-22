import { aiGen2 } from '../../../../../apis/botService.jsx';
import { checkTokenQuota, extractMentionedColumns, updateUsedTokenApp } from '../logic/LogicPipeLine.js';


/**
 * Trích xuất công thức từ kết quả AI
 */
export function extractFormulaFromAIResult(aiResult) {
	try {
		// Xử lý trường hợp aiResult là object (có thuộc tính generated)
		let resultString = '';
		if (typeof aiResult === 'object' && aiResult !== null) {
			if (aiResult.generated) {
				resultString = aiResult.generated;
			} else if (aiResult.result) {
				resultString = aiResult.result;
			} else if (aiResult.content) {
				resultString = aiResult.content;
			} else {
				// Fallback: convert object to string
				resultString = JSON.stringify(aiResult);
			}
		} else if (typeof aiResult === 'string') {
			resultString = aiResult;
		} else {
			console.error('Unexpected AI result type:', typeof aiResult, aiResult);
			return null;
		}

		// Tìm code block trong kết quả AI
		const codeBlockMatch = resultString.match(/```javascript\s*([\s\S]*?)\s*```/);
		if (codeBlockMatch) {
			return codeBlockMatch[1].trim();
		}

		// Tìm code block không có language
		const genericCodeMatch = resultString.match(/```\s*([\s\S]*?)\s*```/);
		if (genericCodeMatch) {
			return genericCodeMatch[1].trim();
		}

		// Nếu không có code block, tìm dòng bắt đầu với return
		const returnMatch = resultString.match(/return\s+(.+?);?$/m);
		if (returnMatch) {
			return `return ${returnMatch[1]};`;
		}

		// Fallback: trả về toàn bộ kết quả nếu không tìm thấy pattern nào
		return resultString.trim();

	} catch (error) {
		console.error('Error extracting formula from AI result:', error);
		return null;
	}
}

/**
 * Tính toán giá trị từ công thức
 */
export function calculateFormulaValue(formula, rowData, mentionedColumns, rowIndex = 0) {
	try {
		// Làm sạch công thức
		let cleanFormula = formula.trim();

		// Tạo mapping từ tên cột gốc sang tên biến JavaScript hợp lệ
		const columnMapping = {};
		const validColumnNames = [];

		mentionedColumns.forEach((originalCol, index) => {
			// Tạo tên biến hợp lệ cho JavaScript (thay thế dấu cách và ký tự đặc biệt)
			const validName = `col_${index}`;
			columnMapping[originalCol] = validName;
			validColumnNames.push(validName);

			// Thay thế tên cột gốc trong công thức bằng tên biến hợp lệ
			// Sử dụng cách tiếp cận đơn giản: thay thế trực tiếp
			
			// Thay thế tất cả các trường hợp của tên cột (có @ hoặc không có @)
			const patterns = [
				`@${originalCol}`,           // @Tên nhân viên
				`"${originalCol}"`,          // "Tên nhân viên"
				`\`${originalCol}\``,        // `Tên nhân viên`
				originalCol                  // Tên nhân viên
			];
			
			patterns.forEach(pattern => {
				// Escape special regex characters
				const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				cleanFormula = cleanFormula.replace(new RegExp(escapedPattern, 'g'), validName);
			});
		});

		// Bước bổ sung: Loại bỏ tất cả ký tự @ còn sót lại
		cleanFormula = cleanFormula.replace(/@/g, '');

		// Xử lý closure function hoặc IIFE
		if (cleanFormula.includes('(function()') || cleanFormula.includes('(() =>')) {
			// Đây là closure function, cần thực thi trực tiếp
			// Thêm rowIndex vào context để có thể sử dụng trong closure
			const formulaWithContext = `
				(function() {
					const rowIndex = ${rowIndex};
					const result = ${cleanFormula};
					// Nếu result là function, gọi nó
					if (typeof result === 'function') {
						return result();
					}
					return result;
				})()
			`;
			
			// Tạo function để thực thi công thức với context
			const formulaFunction = new Function(
				...validColumnNames,
				formulaWithContext
			);

			// Lấy giá trị các cột được mention theo thứ tự
			const columnValues = mentionedColumns.map(col => rowData[col] || '');

			// Thực thi công thức
			const result = formulaFunction(...columnValues);

			// Xử lý kết quả
			if (result === null || result === undefined) {
				return '';
			}

			return String(result);
		} else {
			// Xử lý công thức thông thường
			// Nếu công thức đã có return statement, giữ nguyên
			// Nếu không có, wrap trong return
			if (!cleanFormula.startsWith('return')) {
				cleanFormula = `return (${cleanFormula})`;
			}

			// Tạo function để thực thi công thức
			const formulaFunction = new Function(
				...validColumnNames,
				cleanFormula
			);

			// Lấy giá trị các cột được mention theo thứ tự
			const columnValues = mentionedColumns.map(col => rowData[col] || '');

			// Thực thi công thức
			const result = formulaFunction(...columnValues);

			// Xử lý kết quả
			if (result === null || result === undefined) {
				return '';
			}

			return String(result);
		}

	} catch (error) {
		console.error('Error calculating formula value:', error);
		throw error;
	}
}
/**
 * Xây dựng prompt cho AI để tạo công thức
 */
export function buildAIFormulaPrompt(userPrompt, mentionedColumns, sampleData, resultColumn) {
	const columnsInfo = mentionedColumns.map(col => `- ${col}`).join('\n');

	// Lấy dữ liệu mẫu có giá trị thực tế (không rỗng)
	const validSampleData = sampleData.filter(row =>
		mentionedColumns.some(col => row[col] && String(row[col]).trim() !== '')
	).slice(0, 5); // Chỉ lấy 5 dòng có dữ liệu

	let sampleDataStr = '';
	if (validSampleData.length > 0) {
		sampleDataStr = validSampleData.map((row, index) => {
			const rowData = mentionedColumns.map(col => `${col}: "${row[col] || ''}"`).join(', ');
			return `Dòng ${index + 1}: ${rowData}`;
		}).join('\n');
	} else {
		// Nếu không có dữ liệu thực tế, tạo dữ liệu mẫu dựa trên tên cột
		sampleDataStr = mentionedColumns.map(col => {
			// Tạo dữ liệu mẫu phù hợp với tên cột
			if (col.toLowerCase().includes('mã') || col.toLowerCase().includes('code')) {
				return `${col}: "ABC123"`;
			} else if (col.toLowerCase().includes('tên') || col.toLowerCase().includes('name')) {
				return `${col}: "Nguyễn Văn A"`;
			} else if (col.toLowerCase().includes('số') || col.toLowerCase().includes('number')) {
				return `${col}: "12345"`;
			} else if (col.toLowerCase().includes('employee_id')) {
				return `${col}: "EMP001"`;
			} else {
				return `${col}: "giá_trị_mẫu"`;
			}
		}).join('\n');
		
		// Thêm thông tin rằng đây là dữ liệu mẫu
		sampleDataStr = `Dữ liệu mẫu (không có dữ liệu thực tế):\n${sampleDataStr}`;
	}

	return `Bạn là một chuyên gia tạo công thức tính toán. Tôi cần bạn tạo ra một công thức JavaScript để tính toán giá trị cho cột "${resultColumn}".

YÊU CẦU CỤ THỂ: ${userPrompt}

CÁC CỘT CÓ SẴN ĐỂ SỬ DỤNG TRONG CÔNG THỨC:
${columnsInfo}

DỮ LIỆU MẪU:
${sampleDataStr}

HƯỚNG DẪN TẠO CÔNG THỨC:
1. Thực hiện các phép toán cơ bản (+, -, *, /)
2. Xử lý chuỗi (substring, replace, toLowerCase, toUpperCase, etc.)
3. Xử lý số (Math.round, Math.floor, Math.ceil, etc.)
4. Xử lý điều kiện (ternary operator ? : hoặc if-else)
5. Kết hợp nhiều cột để tạo ra kết quả

QUY TẮC QUAN TRỌNG:
- CHỈ sử dụng các cột được liệt kê trong "CÁC CỘT CÓ SẴN" ở trên
- Sử dụng tên cột CHÍNH XÁC như đã liệt kê (bao gồm cả dấu cách nếu có)
- KHÔNG sử dụng ký tự @ trong công thức JavaScript
- Tên cột trong công thức phải giống hệt như trong danh sách "CÁC CỘT CÓ SẴN"
- Xử lý trường hợp giá trị null/undefined bằng cách kiểm tra trước khi sử dụng
- Trả về kết quả phù hợp với yêu cầu
- Công thức phải là một biểu thức JavaScript hợp lệ

VÍ DỤ:
- Nếu yêu cầu "lấy 2 ký tự cuối của cột Tên nhân viên", công thức phải là: "Tên nhân viên".substring("Tên nhân viên".length - 2)
- Nếu cột tên "Mã thống kê", trong công thức phải viết "Mã thống kê" (không có @)

CHỈ trả về công thức JavaScript thuần túy, không cần giải thích. Ví dụ:
\`\`\`javascript
// Công thức của bạn ở đây
\`\`\``;
}
/**
 * Xử lý AI Formula - Sử dụng AI để tạo công thức tính toán
 * @param {Array} data - Dữ liệu đầu vào
 * @param {Object} config - Cấu hình AI Formula
 * @returns {Array} - Dữ liệu với cột mới được tính toán bằng công thức AI
 */
export const processAIFormula = async (data, config) => {
	try {
		// Kiểm tra cấu hình bắt buộc
		if (!config.aiPrompt) {
			throw new Error('Thiếu AI prompt');
		}

		if (!config.createNewColumn && !config.targetColumn) {
			throw new Error('Phải chọn cột đích hoặc tạo cột mới');
		}

		// Kiểm tra token quota
		await checkTokenQuota();

		// Tạo bản sao của dữ liệu
		const processedData = [...data];

		// Xác định tên cột kết quả
		const resultColumn = config.createNewColumn ? config.newColumnName : config.targetColumn;
		// Khởi tạo cột kết quả cho tất cả dòng
		processedData.forEach(row => {
			row[resultColumn] = '';
		});
		// Lấy danh sách các cột được mention trong prompt
		const mentionedColumns = extractMentionedColumns(config.aiPrompt);
		console.log('AI Formula - Mentioned columns:', mentionedColumns);
		
		// Lấy mẫu dữ liệu để gửi cho AI (tối đa 10 dòng)
		const sampleData = data.slice(0, 10);
		
		// Tạo prompt cho AI
		const aiPrompt = buildAIFormulaPrompt(config.aiPrompt, mentionedColumns, sampleData, resultColumn);

		console.log('AI Formula - Sending prompt to AI:', aiPrompt);

		// Gọi AI để tạo công thức
		const aiResult = await aiGen2(aiPrompt, null, config.aiModel || 'gemini-2.5-flash');
		
		// Cập nhật token usage
		await updateUsedTokenApp(aiResult, config.aiModel || 'gemini-2.5-flash');

		console.log('AI Formula - AI Response:', aiResult);

		// Trích xuất công thức từ kết quả AI
		const formula = extractFormulaFromAIResult(aiResult);

		if (!formula) {
			throw new Error('Không thể trích xuất công thức từ kết quả AI');
		}

		console.log('AI Formula - Extracted formula:', formula);

		// Áp dụng công thức cho tất cả dòng dữ liệu
		processedData.forEach((row, index) => {
			try {
				const result = calculateFormulaValue(formula, row, mentionedColumns, index);
				row[resultColumn] = result;
			} catch (error) {
				console.error(`AI Formula - Error calculating row ${index}:`, error);
				row[resultColumn] = 'FORMULA_ERROR';
			}
		});

		console.log('AI Formula - Processed data sample:', processedData.slice(0, 3).map(row => ({
			...row,
			[resultColumn]: row[resultColumn]
		})));

		return processedData;

	} catch (error) {
		console.error('AI Formula - Error:', error);
		// Return original data nếu có lỗi
		return data;
	}
};