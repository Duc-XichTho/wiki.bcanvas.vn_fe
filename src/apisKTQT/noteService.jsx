import instance from "./axiosInterceptors";
const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/note';
const URL = BASE_URL + SUB_URL;

export const createOrGetNote = async (type) => {
	try {
		const res = await instance.get(URL + `/${type}`);
		return res.data[0];
	} catch (error) {
		console.error("Lỗi khi tạo hoặc lấy note: ", error);
		throw error;
	}
}

export const saveNote = async ({ type, title, body }) => {
	try {
		const res = await instance.put(URL, { type, title, body });
		return res.data;
	} catch (error) {
		console.error("Error saving note: ", error);
		throw error;
	}
}

export const addNoteData = (id, table, field, note) =>
	new Promise(async (resolve, reject) => {
		try {
			let data = { note };
			let response = await instance.post(`${URL}/${id}/${table}/${field}/`, data);
			resolve(response);
		} catch (error) {
			reject(error);
		}
	});

export const getNoteData = (id, table, field) =>
	new Promise(async (resolve, reject) => {
		try {
			let response = await instance.get(`${URL}/${id}/${table}/${field}`);
			resolve(response);
		} catch (error) {
			reject(error);
		}
	});
