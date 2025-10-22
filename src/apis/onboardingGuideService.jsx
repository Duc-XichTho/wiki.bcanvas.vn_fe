import instance from "./axiosInterceptors";
const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/onboarding-guide';
const URL = BASE_URL + SUB_URL;

// Get onboarding guide data by component name
export const getOnboardingGuideByComponent = async (componentName) => {
    try {
        const response = await instance.get(`${URL}/${componentName}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching onboarding guide:", error);
        throw error;
    }
};


export const createOnboardingGuide = async (data) => {
    try {
        const response = await instance.post(`${URL}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating onboarding guide:", error);
        throw error;
    }
};

// Update onboarding guide slides
export const updateOnboardingGuideSlides = async (id, slides) => {
    try {
        const response = await instance.put(`${URL}/${id}/slides`, { slides });
        return response.data;
    } catch (error) {
        console.error("Error updating onboarding guide slides:", error);
        throw error;
    }
};

// Update onboarding guide tabs
export const updateOnboardingGuideTabs = async (id, tabs) => {
    try {
        const response = await instance.put(`${URL}/${id}/tabs`, { tabs });
        return response.data;
    } catch (error) {
        console.error("Error updating onboarding guide tabs:", error);
        throw error;
    }
};

// Update tab content
export const updateTabContent = async (id, tabOrder, content) => {
    try {
        const response = await instance.put(`${URL}/${id}/tab-content`, { 
            tabOrder, 
            content 
        });
        return response.data;
    } catch (error) {
        console.error("Error updating tab content:", error);
        throw error;
    }
}; 