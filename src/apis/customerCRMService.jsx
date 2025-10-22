import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/customer-crm'
const URL = BASE_URL + SUB_URL;

export const getAllCustomers = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách khách hàng:', error);
        throw error;
    }
};

export const getCustomerById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy thông tin khách hàng : ", e);
    throw e;
  }
}


export const getCustomerCRMByCustomerItemId = async (id) => {
    try {
      const result = await instance.get(URL + '/customer-item/' + id);
      return result.data;
    } catch (e) {
      console.error("Lỗi khi lấy thông tin khách hàng : ", e);
      throw e;
    }
  }

export const createCustomer = async (newCustomerData) => {
    try {
        let res = await instance.post(URL, newCustomerData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateCustomer = async (customerData) => {
    try {
        let res = await instance.put(URL, customerData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}

export const deleteCustomer = async (idOrIds) => {
    try {
        if (Array.isArray(idOrIds)) {
            // Nếu là array nhiều ID, gửi trong body
            let res = await instance.delete(URL, {
                data: { ids: idOrIds }
            });
            return res;
        } else {
            // Nếu là 1 ID, gửi trong body
            let res = await instance.delete(URL, {
                data: { ids: [idOrIds] }
            });
            return res;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}


export const createBulkCustomers = async (customers) => {
    try {
        const {data} = await instance.post(URL + '/bulk', {
            customers: customers
        });
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo bulk khách hàng:', error);
        throw error;
    }
};

export const updateBulkCustomers = async (customers) => {
    try {
        const {data} = await instance.put(URL + '/bulk', {
            customers: customers
        });
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật bulk khách hàng:', error);
        throw error;
    }
};