import axios from 'axios';

const APIFY_BASE_URL = "https://api.apify.com/v2";
const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN;

// Create a separate axios instance for external API calls without credentials
const apifyInstance = axios.create({
  withCredentials: false, // Don't send credentials for external API calls
});

// Send to Apify Facebook Posts Scraper
export const sendToN8nFacebookPostsScraper = async (data) => {
  try {
    const response = await apifyInstance.post(
      `${APIFY_BASE_URL}/acts/apify~facebook-posts-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gửi đến Apify Facebook Posts Scraper:", error);
    throw error;
  }
};

// Send to Apify Google Maps Scraper
export const sendToN8nCrawlerGooglePlaces = async (data) => {
  try {
    const response = await apifyInstance.post(
      `${APIFY_BASE_URL}/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gửi đến Apify Google Maps Scraper:", error);
    throw error;
  }
};

// Send to Apify Social Media Sentiment Analysis Tool
export const sendToN8nSocialMediaSentimentAnalysisTool = async (data) => {
  try {
    const response = await apifyInstance.post(
      `${APIFY_BASE_URL}/acts/tri_angle~social-media-sentiment-analysis-tool/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gửi đến Apify Social Media Sentiment Analysis Tool:", error);
    throw error;
  }
};

// Send to Apify Google Trends Fast Scraper
export const sendToN8nGoogleTrendsFastScraper = async (data) => {
  try {
    const response = await apifyInstance.post(
      `${APIFY_BASE_URL}/acts/data_xplorer~google-trends-fast-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gửi đến Apify Google Trends Fast Scraper:", error);
    throw error;
  }
};

// Generic Apify API sender
export const sendToApifyAPI = async (actorId, data) => {
  try {
    const response = await apifyInstance.post(
      `${APIFY_BASE_URL}/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gửi đến Apify API:", error);
    throw error;
  }
};

// Get Apify run status
export const getApifyRunStatus = async (runId) => {
  try {
    const response = await apifyInstance.get(
      `${APIFY_BASE_URL}/acts/runs/${runId}?token=${APIFY_TOKEN}`
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái Apify run:", error);
    throw error;
  }
};

// Get Apify dataset items
export const getApifyDatasetItems = async (datasetId, params = {}) => {
  try {
    const response = await apifyInstance.get(
      `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${APIFY_TOKEN}`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy dataset items:", error);
    throw error;
  }
};

// Start Apify run (async)
export const startApifyRun = async (actorId, data) => {
  try {
    const response = await apifyInstance.post(
      `${APIFY_BASE_URL}/acts/${actorId}/runs?token=${APIFY_TOKEN}`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi bắt đầu Apify run:", error);
    throw error;
  }
};

// Get Apify user info
export const getApifyUserInfo = async () => {
  try {
    const response = await apifyInstance.get(
      `${APIFY_BASE_URL}/users/me?token=${APIFY_TOKEN}`
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin Apify user:", error);
    throw error;
  }
}; 