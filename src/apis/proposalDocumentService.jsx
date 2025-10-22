import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/proposal-document';
const URL = BASE_URL + SUB_URL;

export const getAllProposalDocument = async () => {
	try {
		const { data } = await instance.get(URL);
		return data;
	} catch (error) {
		console.error('Lỗi khi lấy thông tin:', error);
		throw error;
	}
};

export const getProposalDocumentDataById = async (id) => {
	try {
		const { data } = await instance.get(URL + '/' + id);
		return data;
	} catch (e) {
		console.error('Lỗi khi lấy dữ liệu : ', e);
		throw e;
	}
};

export const createNewProposalDocument = async (newRowData) => {
	try {
		const { data } = await instance.post(URL, newRowData);
		return data;
	} catch (error) {
		console.log(error);
		throw error;
	}
};
export const updateProposalDocument = async (newRowData) => {
	try {
		const { data } = await instance.put(URL, newRowData);
		return data;
	} catch (error) {
		console.log(1, error);
		throw error;
	}
};
export const deleteProposalDocument = async (id) => {
	try {
		const { data } = await instance.delete(URL + '/' + id);
		return data;
	} catch (error) {
		console.log(error);
		throw error;
	}
};