import instance from '../axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_JS_SERVER_URL;
const SUB_URL = '/api/external';
const URL = BASE_URL + SUB_URL;
const API_KEY = import.meta.env.VITE_EXTERNAL_API_KEY;

const apiKeyHeader = {
    headers: {
        'x-api-key': API_KEY
    }
};

// ==================== K9Service API ENDPOINTS ====================

// GET /api/external/k9 - Lấy tất cả K9Service records
export const getK9Data = async () => {
    try {
        const { data } = await instance.get(URL + '/k9', apiKeyHeader);
        return data.data?.sort((a, b) => b.id - a.id);
    } catch (error) {
        console.error('Lỗi khi lấy K9Service:', error);
        throw error;
    }
};

// GET /api/external/k9/:id - Lấy K9Service record theo ID
export const getK9Id = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/k9/${id}`, apiKeyHeader);
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy K9Service by ID:', error);
        throw error;
    }
};

export const getK9ByCidType = async (cid, type) => {
    try {
        const { data } = await instance.get(`${URL}/k9/cid/${cid}/type/${type}`, apiKeyHeader);
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy K9Service by ID:', error);
        throw error;
    }
};

// GET /api/external/k9/type/:type - Lấy K9Service records theo type
export const getK9ByType = async (type) => {
    try {
        const { data } = await instance.get(`${URL}/k9/type/${type}`, apiKeyHeader);
        return data.data?.sort((a, b) => b.id - a.id);
    } catch (error) {
        console.error('Lỗi khi lấy K9Service by Type:', error);
        throw error;
    }
};

// ==================== AI SUMMARY API ENDPOINTS ====================

// GET /api/external/ai-summary - Lấy tất cả AI Summary records
export const getAISummaries = async () => {
    try {
        const { data } = await instance.get(URL + '/ai-summary', apiKeyHeader);
        return data.data?.sort((a, b) => b.id - a.id);
    } catch (error) {
        console.error('Lỗi khi lấy AI Summaries:', error);
        throw error;
    }
};

// GET /api/external/ai-summary/:id - Lấy AI Summary record theo ID
export const getAISummaryById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/ai-summary/${id}`, apiKeyHeader);
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy AI Summary by ID:', error);
        throw error;
    }
};


// ==================== Setting API ENDPOINTS ====================
export const getSettingByTypeExternal = async (type) => {
    try {
        const {data} = await instance.get(URL + '/setting/' + type , apiKeyHeader);
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

// ==================== Question History API ENDPOINTS ====================
export const getQuestionHistoryByEmailExternal = async (email) => {
    try {
        const {data} = await instance.get(URL + '/question-history/' + email , apiKeyHeader);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const createQuestionHistoryExternal = async (data) => {
    try {
        const {data} = await instance.post(URL + '/question-history' , data , apiKeyHeader);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};