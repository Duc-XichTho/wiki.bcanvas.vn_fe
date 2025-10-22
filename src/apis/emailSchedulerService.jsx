
import instance from './axiosInterceptors';
const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/email-scheduler'
const URL = BASE_URL + SUB_URL;

// Schedule email với fallback strategy
export const scheduleEmailAdvanced = async (emailData) => {
  try {
    const response = await instance.post(URL + '/email/schedule', {...emailData });
    return response.data;
  } catch (error) {
    console.error('Error scheduling email:', error);
    throw error;
  }
};

// Send email immediately
export const sendEmailImmediate = async (emailData) => {
  try {
    const response = await instance.post(URL + '/email/send', {...emailData } );
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Check email status
export const checkEmailStatus = async (jobId) => {
  try {
    const response = await instance.get(URL + `/email/status/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking email status:', error);
    throw error;
  }
};

// Get scheduled emails
export const getScheduledEmails = async () => {
  try {
    const response = await instance.get(URL + '/email/scheduled');
    return response.data;
  } catch (error) {
    console.error('Error getting scheduled emails:', error);
    throw error;
  }
};

// Cancel scheduled email
export const cancelScheduledEmail = async (jobId) => {
  try {
    const response = await instance.delete(URL + `/email/cancel/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error canceling email:', error);
    throw error;
  }
};
