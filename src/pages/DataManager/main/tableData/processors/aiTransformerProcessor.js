import { createSetting, getSettingByType, updateSetting } from '../../../../../apis/settingService.jsx';
import { aiGen, aiGen2 } from '../../../../../apis/botService.jsx';


export async function checkTokenQuota() {
	try {
		const usedTokenSetting = await getSettingByType('USED_TOKEN_APP');
		const totalTokenSetting = await getSettingByType('TOTAL_TOKEN');
		const arr = Array.isArray(usedTokenSetting?.setting) ? usedTokenSetting.setting : [];
		const totalUsed = arr.reduce((sum, item) => sum + (item.usedToken || 0), 0);
		const totalToken = typeof totalTokenSetting?.setting === 'number' ? totalTokenSetting.setting : 0;
		
		if (totalToken > 0 && totalUsed >= totalToken) {
			throw new Error('Bạn không thể yêu cầu do đã vượt quá token');
		}
		return true;
	} catch (error) {
		console.error('Error checking token quota:', error);
		throw error;
	}
}

export async function updateUsedTokenApp(aiResult, model = 'gpt-5-nano-2025-08-07') {
	try {
		console.log('🔍 [DEBUG] updateUsedTokenApp - aiResult structure:', aiResult);
		console.log('🔍 [DEBUG] updateUsedTokenApp - aiResult.usedToken:', aiResult?.usedToken);
		console.log('🔍 [DEBUG] updateUsedTokenApp - aiResult.usage:', aiResult?.usage);
		console.log('🔍 [DEBUG] updateUsedTokenApp - aiResult.tokens:', aiResult?.tokens);
		
		// Tìm token usage từ các trường có thể có
		let usedToken = null;
		if (aiResult?.usedToken) {
			usedToken = aiResult.usedToken;
		} else if (aiResult?.usage?.total_tokens) {
			usedToken = aiResult.usage.total_tokens;
		} else if (aiResult?.usage?.completion_tokens) {
			usedToken = aiResult.usage.completion_tokens;
		} else if (aiResult?.tokens) {
			usedToken = aiResult.tokens;
		} else if (aiResult?.usage?.prompt_tokens && aiResult?.usage?.completion_tokens) {
			// Tính tổng token nếu có prompt_tokens và completion_tokens
			usedToken = aiResult.usage.prompt_tokens + aiResult.usage.completion_tokens;
		}
		
		console.log('🔍 [DEBUG] updateUsedTokenApp - extracted usedToken:', usedToken);
		
		// Nếu không có thông tin token, ước tính dựa trên độ dài text
		if (!usedToken && aiResult?.generated) {
			const textLength = aiResult.generated.length;
			// Ước tính: 1 token ≈ 4 ký tự (rough estimate)
			usedToken = Math.ceil(textLength / 4);
			console.log('🔍 [DEBUG] updateUsedTokenApp - estimated usedToken based on text length:', usedToken);
		}
		
		if (!aiResult || !usedToken) {
			console.log('🔍 [DEBUG] updateUsedTokenApp - No token information found, skipping update');
			return;
		}
		
		const usedTokenSetting = await getSettingByType('USED_TOKEN_APP');
		const arr = Array.isArray(usedTokenSetting?.setting) ? usedTokenSetting.setting : [];
		
		const newTokenRecord = {
			usedToken: usedToken,
			date: new Date().toISOString(),
			model: model
		};
		
		arr.push(newTokenRecord);
		
		if (usedTokenSetting) {
			await updateSetting({ ...usedTokenSetting, setting: arr });
		} else {
			await createSetting({
				type: 'USED_TOKEN_APP',
				setting: arr
			});
		}
	} catch (error) {
		console.error('Error updating used token:', error);
	}
}

/**
 * Xử lý AI Transformer với batch processing
 * @param {Array} data - Dữ liệu đầu vào
 * @param {Object} config - Cấu hình AI Transformer
 * @param {Function} progressCallback - Callback để cập nhật tiến trình (optional)
 * @returns {Array} - Dữ liệu đã được biến đổi với cột kết quả mới
 */
export const processAITransformer = async (data, config, progressCallback = null) => {
	try {
		// Kiểm tra cấu hình
		if (!config.conditionColumns || !config.resultColumn || !config.aiPrompt) {
			throw new Error('Thiếu cấu hình bắt buộc: conditionColumns, resultColumn, hoặc aiPrompt');
		}

		// Kiểm tra token quota
		await checkTokenQuota();

		// Tạo bản sao của dữ liệu để không làm thay đổi dữ liệu gốc
		const processedData = [...data];
		
		// Tạo cột kết quả mới trong tất cả các dòng
		processedData.forEach(row => {
			// Luôn tạo cột mới với giá trị rỗng
			row[config.resultColumn] = '';
		});
		
		const BATCH_SIZE = 1000; // Xử lý 100 dòng mỗi batch
		const totalRows = processedData.length;
		const totalBatches = Math.ceil(totalRows / BATCH_SIZE);
		
		// Cập nhật tiến trình bắt đầu
		if (progressCallback) {
			progressCallback({
				current: 0,
				total: totalRows,
				message: `Bắt đầu xử lý ${totalBatches} batch dữ liệu...`
			});
		}
		
		// Xử lý từng batch
		for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
			const startIndex = batchIndex * BATCH_SIZE;
			const endIndex = Math.min(startIndex + BATCH_SIZE, totalRows);
			const batchData = processedData.slice(startIndex, endIndex);
			
			// Cập nhật tiến trình batch hiện tại
			if (progressCallback) {
				progressCallback({
					current: startIndex,
					total: totalRows,
					message: `Đang xử lý batch ${batchIndex + 1}/${totalBatches} (dòng ${startIndex + 1}-${endIndex})...`
				});
			}
			
			try {
				// Chuẩn bị dữ liệu cho batch hiện tại
				const batchDataForAI = batchData.map((row, localIndex) => {
					const globalIndex = startIndex + localIndex;
					const conditionData = {};
					config.conditionColumns.forEach(col => {
						conditionData[col] = row[col];
					});
					return {
						rowIndex: globalIndex,
						data: conditionData
					};
				});
				
				// Tạo prompt cho AI với batch dữ liệu
				const aiPrompt = buildBulkAITransformerPrompt(config.aiPrompt, batchDataForAI, config.resultColumn);
				
				// Cập nhật tiến trình đang gửi batch đến AI
				if (progressCallback) {
					progressCallback({
						current: startIndex,
						total: totalRows,
						message: `Đang gửi batch ${batchIndex + 1}/${totalBatches} đến AI...`
					});
				}
				console.log( 'config.aiModel', config.aiModel)
				console.log(aiPrompt)
				// Gọi AI cho batch hiện tại với timeout ngắn hơn
				const aiResult = await Promise.race([
					aiGen2(aiPrompt, null, config.aiModel || 'gemini-2.5-flash'),
					new Promise((_, reject) => 
						setTimeout(() => reject(new Error(`AI request timeout cho batch ${batchIndex + 1}`)), 600000) // 1 phút cho mỗi batch
					)
				]);
				console.log(aiResult)
				// Cập nhật token đã sử dụng
				await updateUsedTokenApp(aiResult, config.aiModel || 'gemini-2.5-flash');
				
				// Cập nhật tiến trình đang xử lý kết quả batch
				if (progressCallback) {
					progressCallback({
						current: startIndex,
						total: totalRows,
						message: `Đang xử lý kết quả batch ${batchIndex + 1}/${totalBatches}...`
					});
				}
				
				// Xử lý kết quả từ AI cho batch hiện tại
				const transformedResults = extractBulkAIResult(aiResult, batchData.length);
				
				// Cập nhật dữ liệu với kết quả từ AI cho batch hiện tại
				transformedResults.forEach((result, localIndex) => {
					const globalIndex = startIndex + localIndex;
					if (globalIndex < processedData.length) {
						processedData[globalIndex][config.resultColumn] = result;
					}
				});
				
			} catch (batchError) {
				console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
				
				// Nếu batch bị lỗi, điền giá trị lỗi cho các dòng trong batch đó
				for (let i = startIndex; i < endIndex; i++) {
					processedData[i][config.resultColumn] = `[Lỗi batch ${batchIndex + 1}]`;
				}
			}
			
			// Cập nhật tiến trình hoàn thành batch
			if (progressCallback) {
				progressCallback({
					current: endIndex,
					total: totalRows,
					message: `Hoàn thành batch ${batchIndex + 1}/${totalBatches}`
				});
			}
			
			// Thêm delay nhỏ giữa các batch để tránh quá tải
			if (batchIndex < totalBatches - 1) {
				await new Promise(resolve => setTimeout(resolve, 1000)); // 1 giây delay
			}
		}
		
		// Kiểm tra và điền nốt những dòng còn trống
		const emptyRows = processedData.filter((row, index) => {
			const value = row[config.resultColumn];
			// Kiểm tra an toàn: value có thể là string hoặc số
			const stringValue = String(value || '');
			return !value || stringValue.trim() === '' || stringValue.includes('[Lỗi batch');
		});
		
		if (emptyRows.length > 0) {
			console.log(`AI Transformer: Phát hiện ${emptyRows.length} dòng còn trống, đang điền nốt...`);
			
			// Cập nhật tiến trình điền nốt
			if (progressCallback) {
				progressCallback({
					current: totalRows,
					total: totalRows,
					message: `Phát hiện ${emptyRows.length} dòng còn trống, đang điền nốt...`
				});
			}
			
			// Tạo batch cho những dòng còn trống
			const emptyRowIndices = [];
			processedData.forEach((row, index) => {
				const value = row[config.resultColumn];
				// Kiểm tra an toàn: value có thể là string hoặc số
				const stringValue = String(value || '');
				if (!value || stringValue.trim() === '' || stringValue.includes('[Lỗi batch')) {
					emptyRowIndices.push(index);
				}
			});
			
			// Chia thành batch nhỏ hơn cho những dòng còn trống (30 dòng/batch)
			const EMPTY_BATCH_SIZE = 30;
			const emptyBatches = Math.ceil(emptyRowIndices.length / EMPTY_BATCH_SIZE);
			
			for (let emptyBatchIndex = 0; emptyBatchIndex < emptyBatches; emptyBatchIndex++) {
				const startIndex = emptyBatchIndex * EMPTY_BATCH_SIZE;
				const endIndex = Math.min(startIndex + EMPTY_BATCH_SIZE, emptyRowIndices.length);
				const currentEmptyIndices = emptyRowIndices.slice(startIndex, endIndex);
				
				console.log(`AI Transformer: Điền nốt batch ${emptyBatchIndex + 1}/${emptyBatches} (${currentEmptyIndices.length} dòng)...`);
				
				// Cập nhật tiến trình điền nốt batch
				if (progressCallback) {
					progressCallback({
						current: totalRows,
						total: totalRows,
						message: `Điền nốt batch ${emptyBatchIndex + 1}/${emptyBatches} (${currentEmptyIndices.length} dòng)...`
					});
				}
				
				try {
					// Chuẩn bị dữ liệu cho batch điền nốt
					const emptyBatchDataForAI = currentEmptyIndices.map((rowIndex, localIndex) => {
						const row = processedData[rowIndex];
						const conditionData = {};
						config.conditionColumns.forEach(col => {
							conditionData[col] = row[col];
						});
						return {
							rowIndex: rowIndex,
							data: conditionData
						};
					});
					
					// Tạo prompt đặc biệt cho việc điền nốt
					const fillPrompt = buildFillMissingPrompt(config.aiPrompt, emptyBatchDataForAI, config.resultColumn);
					
					// Gọi AI cho batch điền nốt
					const fillResult = await Promise.race([
						aiGen2(fillPrompt,null, 'gemini-2.5-flash'),
						new Promise((_, reject) => 
							setTimeout(() => reject(new Error(`AI request timeout cho fill batch ${emptyBatchIndex + 1}`)), 300000) // 5 phút cho fill batch
						)
					]);
					
					// Cập nhật token đã sử dụng
					await updateUsedTokenApp(fillResult);
					
					// Xử lý kết quả từ AI cho batch điền nốt
					const fillResults = extractBulkAIResult(fillResult, currentEmptyIndices.length);
					
					// Cập nhật dữ liệu với kết quả từ AI cho batch điền nốt
					fillResults.forEach((result, localIndex) => {
						const globalIndex = currentEmptyIndices[localIndex];
						if (globalIndex < processedData.length) {
							processedData[globalIndex][config.resultColumn] = result;
						}
					});
					
					console.log(`AI Transformer: Hoàn thành điền nốt batch ${emptyBatchIndex + 1}/${emptyBatches}`);
					
				} catch (fillError) {
					console.error(`Error filling missing batch ${emptyBatchIndex + 1}:`, fillError);
				
				}
				
				// Thêm delay nhỏ giữa các batch điền nốt
				if (emptyBatchIndex < emptyBatches - 1) {
					await new Promise(resolve => setTimeout(resolve, 2000)); // 2 giây delay cho fill batch
				}
			}
			
			console.log(`AI Transformer: Hoàn thành điền nốt ${emptyRows.length} dòng còn trống`);
		}
		
		// Cập nhật tiến trình hoàn thành
		if (progressCallback) {
			progressCallback({
				current: totalRows,
				total: totalRows,
				message: 'Hoàn thành xử lý AI Transformer'
			});
		}
		return processedData;
		
	} catch (error) {
		console.error('Error in processAITransformer:', error);
		throw error;
	}
};

/**
 * Xây dựng prompt cho AI
 * @param {string} basePrompt - Prompt cơ bản từ người dùng
 * @param {Object} conditionData - Dữ liệu từ các cột điều kiện
 * @param {string} resultColumn - Tên cột kết quả
 * @returns {string} - Prompt hoàn chỉnh cho AI
 */
export function buildAITransformerPrompt(basePrompt, conditionData, resultColumn) {
	const dataContext = Object.entries(conditionData)
		.map(([col, value]) => `${col}: ${JSON.stringify(value)}`)
		.join('\n');
	
	return `Bạn là một AI chuyên gia xử lý dữ liệu. Nhiệm vụ của bạn là tạo ra giá trị cho cột mới "${resultColumn}" dựa trên dữ liệu từ các cột điều kiện và prompt được cung cấp.

Dữ liệu từ các cột điều kiện:
${dataContext}

Prompt yêu cầu:
${basePrompt}

Yêu cầu:
1. Chỉ trả về giá trị kết quả, không bao gồm giải thích hay text thừa
2. Giá trị phải phù hợp với kiểu dữ liệu mong muốn
3. Nếu không thể xác định giá trị phù hợp, hãy trả về giá trị mặc định phù hợp

Kết quả:`;
}

/**
 * Trích xuất kết quả từ AI response
 * @param {Object} aiResult - Kết quả từ AI
 * @returns {string} - Giá trị đã được trích xuất
 */
function extractAIResult(aiResult) {
	try {
		let result = aiResult;
		
		// Nếu aiResult là object, lấy thuộc tính result
		if (typeof aiResult === 'object' && aiResult.result) {
			result = aiResult.result;
		}
		
		// Nếu result là string, làm sạch
		if (typeof result === 'string') {
			// Loại bỏ các ký tự đặc biệt và whitespace thừa
			result = result.trim();
			
			// Loại bỏ dấu ngoặc kép nếu có
			if ((result.startsWith('"') && result.endsWith('"')) || 
				(result.startsWith("'") && result.endsWith("'"))) {
				result = result.slice(1, -1);
			}
			
			// Loại bỏ các từ khóa không cần thiết
			const unwantedKeywords = ['kết quả:', 'result:', 'giá trị:', 'value:'];
			unwantedKeywords.forEach(keyword => {
				if (result.toLowerCase().includes(keyword.toLowerCase())) {
					result = result.replace(new RegExp(keyword, 'gi'), '').trim();
				}
			});
		}
		
		return result || '';
		
	} catch (error) {
		console.error('Error extracting AI result:', error);
		return '[Lỗi xử lý kết quả AI]';
	}
}

/**
 * Xây dựng prompt cho AI để xử lý nhiều dòng dữ liệu cùng lúc (batch processing)
 * @param {string} basePrompt - Prompt cơ bản từ người dùng
 * @param {Array} dataForAI - Dữ liệu để gửi đến AI, mỗi phần tử là { rowIndex: number, data: object }
 * @param {string} resultColumn - Tên cột kết quả
 * @returns {string} - Prompt hoàn chỉnh cho AI
 */
export function buildBulkAITransformerPrompt(basePrompt, dataForAI, resultColumn) {
	const dataContext = dataForAI.map((item, index) => {
		const { rowIndex, data } = item;
		const dataStr = Object.entries(data)
			.map(([col, value]) => `${col}: ${JSON.stringify(value)}`)
			.join(', ');
		return `Dòng ${index + 1}: {${dataStr}}`;
	}).join('\n');

	return `Bạn là một AI chuyên gia xử lý dữ liệu. Nhiệm vụ của bạn là tạo ra giá trị cho cột mới "${resultColumn}" dựa trên dữ liệu từ batch dữ liệu được cung cấp.

Dữ liệu từ ${dataForAI.length} dòng trong batch này:
${dataContext}

Prompt yêu cầu:
${basePrompt}

Yêu cầu:
1. Trả về một mảng JSON chứa giá trị kết quả cho từng dòng, theo thứ tự từ dòng 1 đến dòng ${dataForAI.length}
2. Mỗi phần tử trong mảng là giá trị cho một dòng tương ứng
3. Giá trị phải phù hợp với kiểu dữ liệu mong muốn
4. Nếu không thể xác định giá trị phù hợp cho một dòng, hãy trả về giá trị mặc định phù hợp
5. Chỉ trả về mảng JSON, không có text giải thích thêm

Ví dụ kết quả mong muốn:
["giá trị dòng 1", "giá trị dòng 2", "giá trị dòng 3", ...]

Kết quả:`;
}

/**
 * Xây dựng prompt đặc biệt cho template-based categorization
 * @param {string} basePrompt - Prompt cơ bản từ người dùng
 * @param {Array} dataForAI - Dữ liệu để gửi đến AI
 * @param {string} resultColumn - Tên cột kết quả
 * @param {Array} templateData - Dữ liệu mẫu từ template
 * @param {Object} templateConfig - Cấu hình mẫu
 * @returns {string} - Prompt hoàn chỉnh cho AI
 */
export function buildTemplateBasedCategorizePrompt(basePrompt, dataForAI, resultColumn, templateData, templateConfig) {
	const dataContext = dataForAI.map((item, index) => {
		const { rowIndex, data } = item;
		const dataStr = Object.entries(data)
			.map(([col, value]) => `${col}: ${JSON.stringify(value)}`)
			.join(', ');
		return `Dòng ${index + 1}: {${dataStr}}`;
	}).join('\n');

	// Tạo dữ liệu mẫu từ template
	let templateContext = '';
	if (templateData && Array.isArray(templateData) && templateData.length > 0) {
		// Lọc unique dữ liệu mẫu dựa trên các cột điều kiện
		const uniqueTemplateData = [];
		const seenCombinations = new Set();
		
		for (const row of templateData) {
			// Tạo key chỉ từ các cột điều kiện
			const conditionValues = templateConfig.templateConditionColumns.map(col => 
				String(row[col] || '').toLowerCase().trim()
			);
			const combinationKey = conditionValues.join('|');
			
			if (!seenCombinations.has(combinationKey)) {
				seenCombinations.add(combinationKey);
				uniqueTemplateData.push(row);
			}
		}
		
		const templateExamples = uniqueTemplateData.slice(0, 200); // Giới hạn 200 mẫu để không quá dài
		templateContext = templateExamples.map((row, index) => {
			const conditionData = {};
			templateConfig.templateConditionColumns.forEach(col => {
				conditionData[col] = row[col];
			});
			const targetValue = row[templateConfig.templateTargetColumn];
			const dataStr = Object.entries(conditionData)
				.map(([col, value]) => `${col}: ${JSON.stringify(value)}`)
				.join(', ');
			return `Mẫu ${index + 1}: {${dataStr}} → Kết quả: ${JSON.stringify(targetValue)}`;
		}).join('\n');
	}

	return `Bạn là một AI chuyên gia phân loại dữ liệu dựa trên mẫu. Nhiệm vụ của bạn là chọn khoản mục phù hợp cho dữ liệu đầu vào dựa trên các mẫu đã học.

DỮ LIỆU MẪU ĐÃ HỌC (${templateData ? templateData.length : 0} mẫu):
${templateContext}

DỮ LIỆU CẦN PHÂN LOẠI (${dataForAI.length} dòng):
${dataContext}

HƯỚNG DẪN:
1. Phân tích các mẫu đã học để hiểu mối quan hệ giữa dữ liệu đầu vào và kết quả
2. Áp dụng logic đã học để chọn khoản mục phù hợp cho từng dòng dữ liệu mới
3. Nếu không tìm thấy mẫu phù hợp, trả về "Không xác định"

YÊU CẦU:
1. Trả về một mảng JSON chứa giá trị khoản mục cho từng dòng, theo thứ tự từ dòng 1 đến dòng ${dataForAI.length}
2. Mỗi phần tử trong mảng là giá trị khoản mục phù hợp nhất
3. Chỉ trả về mảng JSON, không có text giải thích thêm

Ví dụ kết quả mong muốn:
["Khoản mục A", "Khoản mục B", "Không xác định", ...]

Kết quả:`;
}

/**
 * Xây dựng prompt đặc biệt cho việc điền nốt những dòng còn trống
 * @param {string} basePrompt - Prompt cơ bản từ người dùng
 * @param {Array} dataForAI - Dữ liệu để gửi đến AI, mỗi phần tử là { rowIndex: number, data: object }
 * @param {string} resultColumn - Tên cột kết quả
 * @returns {string} - Prompt hoàn chỉnh cho AI
 */
function buildFillMissingPrompt(basePrompt, dataForAI, resultColumn) {
	const dataContext = dataForAI.map((item, index) => {
		const { rowIndex, data } = item;
		const dataStr = Object.entries(data)
			.map(([col, value]) => `${col}: ${JSON.stringify(value)}`)
			.join(', ');
		return `Dòng ${index + 1}: {${dataStr}}`;
	}).join('\n');

	return `Bạn là một AI chuyên gia xử lý dữ liệu. Nhiệm vụ của bạn là điền nốt giá trị cho cột "${resultColumn}" cho những dòng dữ liệu còn trống.

QUAN TRỌNG: Đây là batch điền nốt cho những dòng bị bỏ sót trong lần xử lý trước. Bạn cần đảm bảo trả về đúng số lượng kết quả.

Dữ liệu từ ${dataForAI.length} dòng cần điền nốt:
${dataContext}

Prompt yêu cầu:
${basePrompt}

Yêu cầu:
1. Trả về một mảng JSON chứa giá trị kết quả cho từng dòng, theo thứ tự từ dòng 1 đến dòng ${dataForAI.length}
2. Mỗi phần tử trong mảng là giá trị cho một dòng tương ứng
3. Giá trị phải phù hợp với kiểu dữ liệu mong muốn
4. Nếu không thể xác định giá trị phù hợp cho một dòng, hãy trả về giá trị mặc định phù hợp
5. QUAN TRỌNG: Phải trả về đúng ${dataForAI.length} phần tử trong mảng
6. Chỉ trả về mảng JSON, không có text giải thích thêm

Ví dụ kết quả mong muốn:
["giá trị dòng 1", "giá trị dòng 2", "giá trị dòng 3", ...]

Kết quả:`;
}

/**
 * Trích xuất kết quả từ AI response cho nhiều dòng dữ liệu
 * @param {Object} aiResult - Kết quả từ AI
 * @param {number} totalRows - Tổng số dòng dữ liệu đầu vào
 * @returns {Array} - Mảng kết quả, mỗi phần tử là giá trị cho một dòng
 */
export function extractBulkAIResult(aiResult, totalRows) {
	try {
		let results = aiResult;
		
		// Nếu aiResult là object, lấy thuộc tính result
		if (typeof aiResult === 'object') {
			if (aiResult.generated) {
				results = aiResult.generated;
			} else if (aiResult.result) {
				results = aiResult.result;
			}
		}
		
		// Nếu results là string, thử parse JSON
		if (typeof results === 'string') {
			const parsedResults = extractJSONFromAIResult(results);
			if (parsedResults) {
				results = parsedResults;
				console.log('results', results)
			} else {
				console.error('Error parsing AI result as JSON');
				// Nếu không parse được JSON, trả về mảng mặc định
				return Array(totalRows).fill('[Lỗi: Không thể parse kết quả AI]');
			}
		}
		
        // Nếu results là một mảng, xử lý từng phần tử
		if (Array.isArray(results)) {
			return results.map((item, index) => {
				let result = item;
				
				// Nếu item là object, lấy thuộc tính result
				if (typeof item === 'object' && item) {
                    if (item.generated) {
                        result = item.generated;
                    } else if (item.result) {
                        result = item.result;
                    } else {
                        // Heuristic: nếu object chỉ có 1 key, lấy giá trị của key đó
                        const keys = Object.keys(item);
                        if (keys.length === 1) {
                            result = item[keys[0]];
                        } else {
                            // Lấy giá trị string đầu tiên nếu có
                            const firstStringEntry = Object.entries(item).find(([, v]) => typeof v === 'string');
                            if (firstStringEntry) {
                                result = firstStringEntry[1];
                            } else {
                                // Cuối cùng: stringify object để không gán object vào ô kết quả
                                try { result = JSON.stringify(item); } catch { result = String(item); }
                            }
                        }
                    }
				}
				
				// Nếu result là string, làm sạch
				if (typeof result === 'string') {
					// Loại bỏ các ký tự đặc biệt và whitespace thừa
					result = result.trim();
					
					// Loại bỏ dấu ngoặc kép nếu có
					if ((result.startsWith('"') && result.endsWith('"')) || 
						(result.startsWith("'") && result.endsWith("'"))) {
						result = result.slice(1, -1);
					}
					
					// Loại bỏ các từ khóa không cần thiết
					const unwantedKeywords = ['kết quả:', 'result:', 'giá trị:', 'value:'];
					unwantedKeywords.forEach(keyword => {
						if (result.toLowerCase().includes(keyword.toLowerCase())) {
							result = result.replace(new RegExp(keyword, 'gi'), '').trim();
						}
					});
				}
				
				return result || '';
			});
		}
		
		// Nếu không xác định được kết quả, trả về mảng mặc định
		console.warn('AI result format not recognized, returning default values');
		return Array(totalRows).fill('[Lỗi: Định dạng kết quả AI không được nhận diện]');
		
	} catch (error) {
		console.error('Error extracting bulk AI result:', error);
		return Array(totalRows).fill('[Lỗi xử lý kết quả AI]');
	}
}

/**
 * Trích xuất JSON từ AI result có thể chứa markdown hoặc text thừa
 * @param {string} aiResultString - Chuỗi kết quả từ AI
 * @returns {Array|null} - Mảng JSON đã parse hoặc null nếu không parse được
 */
function extractJSONFromAIResult(aiResultString) {
	try {
		let cleanedString = aiResultString.trim();
		
		// Loại bỏ markdown code fences nếu có, giữ lại phần nội dung bên trong
		// Ví dụ: ```json\n[ ... ]\n```
		const fencedMatch = cleanedString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
		if (fencedMatch && fencedMatch[1]) {
			cleanedString = fencedMatch[1].trim();
		}
		
		// Loại bỏ các text thừa trước và sau JSON
		const jsonStart = cleanedString.indexOf('[');
		const jsonEnd = cleanedString.lastIndexOf(']');
		
		if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
			const jsonString = cleanedString.substring(jsonStart, jsonEnd + 1);
			return JSON.parse(jsonString);
		}
		
		// Thử parse toàn bộ string nếu không tìm thấy mảng
		return JSON.parse(cleanedString);
	} catch (error) {
		console.error('Error extracting JSON from AI result:', error);
		return null;
	}
}

/**
 * Xác thực cấu hình AI Transformer
 * @param {Object} config - Cấu hình cần xác thực
 * @returns {Object} - Kết quả xác thực {isValid: boolean, errors: string[]}
 */
export const validateAITransformerConfig = (config) => {
	const errors = [];
	
	if (!config.conditionColumns || config.conditionColumns.length === 0) {
		errors.push('Phải chọn ít nhất một cột điều kiện');
	}
	
	if (!config.resultColumn || config.resultColumn.trim() === '') {
		errors.push('Phải nhập tên cột kết quả');
	}
	
	if (!config.aiPrompt || config.aiPrompt.trim() === '') {
		errors.push('Phải nhập prompt cho AI');
	}
	
	// Không cần kiểm tra processMode nữa vì luôn tạo cột mới
	
	return {
		isValid: errors.length === 0,
		errors
	};
};

/**
 * Lấy thông tin tóm tắt của step AI Transformer
 * @param {Object} config - Cấu hình của step
 * @returns {string} - Thông tin tóm tắt
 */
export const getAITransformerSummary = (config) => {
	if (!config) return 'Chưa có cấu hình';
	
	const conditionCols = config.conditionColumns?.length > 0 
		? config.conditionColumns.join(', ') 
		: 'Chưa chọn';
	
	const resultCol = config.resultColumn || 'Chưa nhập';
	const hasPrompt = config.aiPrompt ? 'Có prompt' : 'Chưa có prompt';
	
	return `Điều kiện: ${conditionCols} → Tạo cột mới: ${resultCol} | ${hasPrompt}`;
};
