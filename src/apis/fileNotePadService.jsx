import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/file-note-pad'
const URL = BASE_URL + SUB_URL;

export const getFullFileNotePad = async () => {
    try {
        const { data } = await instance.get(URL);
        const filteredData = data.filter(item => item.code === 'PESTEL' || item.code === 'PORTER' || item.code === 'SWOT' || item.code === 'OCEAN');
        return filteredData;
    } catch (error) {
        console.log('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getAllFileNotePad = async () => {
    try {
        const { data } = await instance.get(URL);
        const filteredData = data.filter(item => item.show === true).sort((a, b) => b.id - a.id);
        return filteredData;
    } catch (error) {
        console.log('Lỗi khi lấy thông tin:', error);
        // throw error;
    }
};

export const getFileNotePadByIdController = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.log('Lỗi khi lấy thông tin:', error)
    }
};

export const createNewFileNotePad = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateFileNotePad = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteFileNotePad = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const deleteS3File = async ({ fileKey, fileUrl }) => {
    try {
        // Nếu chưa có fileKey, thì trích từ fileUrl
        if (!fileKey && fileUrl) {
            // Tách phần path sau domain
            const matches = fileUrl.match(/^https?:\/\/[^\/]+\/(.+)$/);
            fileKey = matches?.[1]; // Lấy phần sau domain
        }

        if (!fileKey) {
            throw new Error("Thiếu fileKey hoặc fileUrl để xóa file");
        }

        const res = await instance.delete(`${BASE_URL}/api/delete`, {
            data: { fileKey },
        });

        return res.data;
    } catch (error) {
        console.log('Lỗi khi xóa file từ S3:', error);
        throw error;
    }
};
