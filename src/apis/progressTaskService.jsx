import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/progress-task'
const URL = BASE_URL + SUB_URL;

export const getAllProgressTask = async (stepId) => {
    try {
        const { data } = await instance.get(URL + '/' + stepId);
        console.log("Data from API:", data);

        // Split the title and description
        const updatedData = data.map((item) => {
            const [title, description] = item.title.split(' ||| ');
            return { ...item, title, description };
        });
        return updatedData;

    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const createProgressTask = async (data) => {
    try {
        let res = await instance.post(URL, data)
        return res.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateProgressTask = async (id, data) => {
    try {
        let res = await instance.put(URL + '/' + id, data)
        return res.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const deleteProgress = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}