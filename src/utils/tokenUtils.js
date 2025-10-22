import { getSettingByType, updateSetting, createSetting } from '../apis/settingService.jsx';

// --- Helper: Check if setting contains valid array ---
const isValidSettingArray = (settingObj) => {
	return settingObj && 
		   settingObj.setting !== null && 
		   settingObj.setting !== undefined && 
		   Array.isArray(settingObj.setting);
};

// --- Helper: Initialize setting with correct structure ---
const initializeSettingArray = (settingObj) => {
	if (!settingObj) {
		// Nếu không có setting object, trả về mảng rỗng
		return [];
	}
	
	if (isValidSettingArray(settingObj)) {
		// Trường hợp setting hợp lệ: copy mảng
		return [...settingObj.setting];
	}
	
	if (settingObj.setting === null || settingObj.setting === undefined) {
		// Trường hợp setting là null/undefined: khởi tạo mảng rỗng
		return [];
	}
	
	// Các trường hợp khác (string, number, object không phải array): trả về mảng rỗng
	console.warn(`Invalid setting format for USED_TOKEN_APP:`, settingObj.setting);
	return [];
};

// --- Helper: Update USED_TOKEN_APP for different apps ---
export const updateUsedTokenApp = async (aiResult, aiModel = 'gpt-5-mini-2025-08-07', appName = 'analysis-review') => {
	try {
		const usedTokens = aiResult?.usage?.total_tokens || aiResult?.total_tokens || aiResult?.usage?.totalTokens || 0;
		if (!usedTokens) return;
		
		// Lấy setting hiện tại (có thể là null nếu chưa tồn tại)
		let settingObj = await getSettingByType('USED_TOKEN_APP');
		
		// Khởi tạo mảng từ setting hiện tại hoặc tạo mảng rỗng
		let arr = initializeSettingArray(settingObj);
		
		// Tìm app trong mảng
		const idx = arr.findIndex(item => item.app === appName);
		
		if (idx !== -1) {
			// Cập nhật token cho app đã tồn tại
			arr[idx].usedToken = (arr[idx].usedToken || 0) + usedTokens;
			arr[idx].model = aiModel; // Cập nhật model mới nhất
		} else {
			// Thêm app mới vào mảng
			arr.push({ app: appName, usedToken: usedTokens, model: aiModel });
		}
		
		// Lưu setting
		if (settingObj && settingObj.id) {
			// Cập nhật setting đã tồn tại
			await updateSetting({ ...settingObj, setting: arr });
		} else {
			// Tạo setting mới
			await createSetting({ type: 'USED_TOKEN_APP', setting: arr });
		}
		
		console.log(`Updated token usage for ${appName}: +${usedTokens} tokens (${aiModel})`);
	} catch (err) {
		console.error(`Failed to update USED_TOKEN_APP for ${appName}:`, err);
	}
};

// --- Helper: Check token quota before AI call ---
export const checkTokenQuota = async () => {
	try {
		// Lấy setting token đã sử dụng (có thể là null)
		const usedTokenSetting = await getSettingByType('USED_TOKEN_APP');
		const totalTokenSetting = await getSettingByType('TOTAL_TOKEN');
		
		// Khởi tạo mảng từ setting hoặc tạo mảng rỗng
		let arr = initializeSettingArray(usedTokenSetting);
		
		// Tính tổng token đã sử dụng
		const totalUsed = arr.reduce((sum, item) => sum + (item.usedToken || 0), 0);
		
		// Lấy giới hạn token (mặc định 1,000,000 nếu chưa có setting)
		const totalLimit = (totalTokenSetting && totalTokenSetting.setting) ? totalTokenSetting.setting : 1000000;
		
		return {
			used: totalUsed,
			limit: totalLimit,
			remaining: Math.max(0, totalLimit - totalUsed),
			percentage: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
		};
	} catch (err) {
		console.error('Failed to check token quota:', err);
		// Trả về giá trị mặc định an toàn khi có lỗi
		return {
			used: 0,
			limit: 1000000,
			remaining: 1000000,
			percentage: 0
		};
	}
};
