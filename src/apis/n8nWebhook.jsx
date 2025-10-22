import axios from "axios";
import instance from "./axiosInterceptors";

const BASE_URL = 'https://enpointn8n.sab.io.vn';
const SUB_URL = "/api";
const resolveN8nBaseUrl = () => {
  // if (BASE_URL === "http://localhost:7216") {
  //   return "https://apiapp.bcanvas.vn";
  // }
  return BASE_URL;
};
const URL = resolveN8nBaseUrl() + SUB_URL;

export const n8nWebhook = async (data) => {
  try {
    const result = await instance.post(URL + "/send-to-n8n", data);
    return result.data.n8nResponse;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};


export const n8nWebhookGetFileFromGoogleDrive = async (data) => {
  try {
    const result = await instance.post(URL + "/get-file-from-google-drive", data);
    return result.data;
  } catch (error) {
    console.error("Error calling n8nWebhookGetFileFromGoogleDrive:", error);
    throw error;
  }
};export const n8nWebhookGoogleDrive = async (data) => {
  try {
    const result = await instance.post(URL + "/send-to-n8n-parse-excel", data);
    return result.data;
  } catch (error) {
    console.error("Error calling n8nWebhookGoogleDrive:", error);
    throw error;
  }
};
export const n8nWebhookV2 = async (url, fileName) => {
  try {
    const result = await instance.post(URL + "/send-to-n8n-v2", { url });
    return result.data;
    console.log(result.data);
  } catch (error) {
    console.error("Error calling n8nWebhookV2:", error);
    throw error;
  }
};

export const sendFacebookWebhook = async ({ url, access_token, page_id }) => {
  try {
    const result = await instance.post(URL + "/send-to-n8n-v3", {
      url,
      access_token,
      page_id,
    });
    return result.data.data; // raw messages array
  } catch (error) {
    console.error("Lỗi khi gọi sendFacebookWebhook:", error);
    throw error;
  }
};

export const sendToN8nFacebookPostsScraper = async (payload) => {
  try {
    const result = await instance.post(URL + '/send-to-n8n-facebook-posts-scraper', payload);
    return result.data;
  } catch (error) {
    console.error('Lỗi khi gọi sendToN8nFacebookPostsScraper:', error);
    throw error;
  }
};

export const sendToN8nCrawlerGooglePlaces = async (locationQuery, maxCrawledPlacesPerSearch, searchStringsArray) => {
  try {
    const result = await instance.post(URL + '/send-to-n8n-crawler-google-places', {
      locationQuery,
      maxCrawledPlacesPerSearch,
      searchStringsArray,
    });
    return result.data;
  } catch (error) {
    console.error('Lỗi khi gọi sendToN8nCrawlerGooglePlaces:', error);
    throw error;
  }
};

export const sendToN8nSocialMediaSentimentAnalysisTool = async (params) => {
  try {
    const result = await instance.post(URL + '/send-to-n8n-social-media-sentiment-analysis-tool', params);
    return result.data;
  } catch (error) {
    console.error('Lỗi khi gọi sendToN8nSocialMediaSentimentAnalysisTool:', error);
    throw error;
  }
};

export const sendToN8nGoogleTrendsFastScraper = async (params) => {
  try {
    const result = await instance.post(URL + '/send-to-n8n-google-trends-fast-scraper', params);
    return result.data;
  } catch (error) {
    console.error('Lỗi khi gọi sendToN8nGoogleTrendsFastScraper:', error);
    throw error;
  }
};

export const sendToN8nParseExcel = async (sheetNamesJson) => {
  try {
    const result = await instance.post(URL +'/send-to-n8n-parse-excel', sheetNamesJson);
    return result.data.n8nResponse;
  } catch (error) {
    console.error('Error calling sendToN8nParseExcel:', error);
    throw error;
  }
};

export const AIAutomationChat = async (data) => {
  try {
    const result = await instance.post(URL + '/ai-automation-chat', data);
    return result.data.n8nResponse;
  } catch (error) {
    console.error('Error calling AIAutomationChat:', error);
    throw error;
  }
};

export const AIAutomationChatAlarm = async (data) => {
  try {
    const result = await instance.post(URL + '/ai-automation-chat-alarm', data);
    return {
      data: result.data.n8nResponse,
      headers: result.headers,
      status: result.status,
      statusText: result.statusText
    };
  } catch (error) {
    console.error('Error calling AIAutomationChatAlarm:', error);
    throw error;
  }
};

export const getDataFromPostgres = async (data) => {
  try {
    const result = await instance.post(URL + '/get-data-from-postgres', data);
    return result.data.n8nResponse;
  } catch (error) {
    console.error('Error calling getDataFromPostgres:', error);
    throw error;
  }
};



export const exportTableToGoogleSheets = async (sheetUrl, tableData, metadata = {},email_import = 'gateway@xichtho-vn.com') => {
  try {
    console.log('Gửi dữ liệu tới API:', {
      sheetUrl,
      tableData: tableData.slice(0, 2), // Log 2 dòng đầu để debug
      metadata,
      totalRows: tableData.length
    });

    const result = await instance.post(URL + '/export-to-google-sheet', {
      sheetUrl,
      tableData,
      metadata,
      email_import
    });
    
    console.log('Response từ API:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error calling exportTableToGoogleSheets:', error);
    throw error;
  }
};

