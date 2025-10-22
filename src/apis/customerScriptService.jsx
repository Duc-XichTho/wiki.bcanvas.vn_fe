import instance from './axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/customer-script'
const URL = BASE_URL + SUB_URL;
export const getAllCustomerScript = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getCustomerScriptDataById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}

export const createNewCustomerScript = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updateCustomerScript = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deleteCustomerScript = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// Bulk operations
export const bulkUpdateCustomerScripts = async (customerData, scriptData) => {
    try {
        const { selected, unselected } = scriptData;
    
        // Scripts cần THÊM (từ selected)
        const scriptsToAdd = selected.filter(s => s.emailSchedulerScript_id);
        
        // Scripts cần XÓA (từ unselected - có ID gốc của customer_script)
        const scriptsToRemove = unselected.filter(s => s.id);
        

        // THÊM scripts mới
        for (const script of scriptsToAdd) {
            await createNewCustomerScript({
                customer_email: customerData.email,
                customer_id: parseInt(customerData.id),
                emailSchedulerScript_id: parseInt(script.emailSchedulerScript_id)
            });
        }

        // XÓA scripts cũ bằng ID gốc
        for (const script of scriptsToRemove) {
            await deleteCustomerScript(script.id);
        }
        
        return {
            success: true,
            added: scriptsToAdd.length,
            removed: scriptsToRemove.length,
            customerId: customerData.id // Trả về ID khách hàng để gọi findById
        };

    } catch (error) {
        console.error('Error in bulk update:', error);
        throw error;
    }
}