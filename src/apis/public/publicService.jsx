import instance from '../axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/public';
const URL = BASE_URL + SUB_URL;

// Get business category by ID
export const getBusinessCategoryByIdPublic = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/business-categories/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin business category:', error);
        throw error;
    }
};

// Get KPIs for a business category
export const getKPIsByCategoryIdPublic = async (categoryId) => {
    try {
        const { data } = await instance.get(`${URL}/kpi-metric` ,  { params: { business_category_id: categoryId, show: true } });
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách KPIs:', error);
        throw error;
    }
};

// Get measures for a business category
export const getMeasuresByCategoryIdPublic = async (categoryId) => {
    try {
        const { data } = await instance.get(`${URL}/measure` , { params: { business_category_id: categoryId, show: true } });
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách measures:', error);
        throw error;
    }
};

// Get all data for a business category (KPIs + Measures)
export const getCategoryDataByIdPublic = async (categoryId) => {
    try {
        const [categoryResponse, kpisResponse, measuresResponse] = await Promise.all([
            instance.get(`${URL}/business-categories/${categoryId}`),
            instance.get(`${URL}/kpi-metric` , { params: { business_category_id: categoryId, show: true } }),
            instance.get(`${URL}/measure` , { params: { business_category_id: categoryId, show: true } })
        ]);

        return {
            category: categoryResponse.data,
            kpis: kpisResponse.data,
            measures: measuresResponse.data
        };
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu category:', error);
        throw error;
    }
};

export const createDemoSchemaPublicController = async (value) => {
    try {
        const { data } = await instance.post(`${URL}/create-demo-schema`, value);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo demo schema:', error);
        throw error;
    }
};
