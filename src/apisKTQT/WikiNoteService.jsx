import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllWikiNotes = async () => {
  try {
    const { data } = await instance.get(`${BASE_URL}/api/wiki-note`);
    return data;
  } catch (error) {
    throw error;
  }
}

export const createNewWikiNote = async (newNoteData) => {
  try {
    const { data } = await instance.post(`${BASE_URL}/api/wiki-note`, newNoteData);
    return data;
  } catch (error) {
    throw error;
  }
}

export const updateWikiNote = async (id, newNoteData) => {
  try {
    const { data } = await instance.put(`${BASE_URL}/api/wiki-note/${id}`, newNoteData);
    return data;
  } catch (error) {
    throw error;
  }
}

export const deleteWikiNote = async (id) => {
  try {
    const { data } = await instance.delete(`${BASE_URL}/api/wiki-note/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
}
