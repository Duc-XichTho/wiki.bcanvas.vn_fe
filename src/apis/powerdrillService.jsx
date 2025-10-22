import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_FLASK_URL_2;
const SUB_URL = '/api/powerdrill';
const URL = BASE_URL + SUB_URL;

export const powerdrillAnalyzeData = async ({data, prompt, reportName, sessionName}) => {
    try {
        const response = await instance.post(URL+'/analyze-data', {data, prompt, reportName, sessionName},{
            timeout: 600000 // 10 minutes in milliseconds
          });
        return response.data;
    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
    }
};