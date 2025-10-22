import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/transaction-crm'
const URL = BASE_URL + SUB_URL;

export const getAllTransactions = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách giao dịch:', error);
        throw error;
    }
};

export const getTransactionById = async (id) => {
  try {
    const result = await instance.get(URL + '/' + id);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy thông tin giao dịch : ", e);
    throw e;
  }
}

export const getTransactionsByCustomerId = async (customerId) => {
  try {
    const result = await instance.get(URL + '/customer/' + customerId);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy giao dịch theo khách hàng : ", e);
    throw e;
  }
}

export const createTransaction = async (newTransactionData) => {
    try {
        let res = await instance.post(URL, newTransactionData)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateTransaction = async (transactionData) => {
    try {
        let res = await instance.put(URL, transactionData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}

export const deleteBulkTransactionsAPI = async (id) => {
    try {
      if (Array.isArray(id)) {
          // Nếu là array nhiều ID, gửi trong body
          let res = await instance.delete(URL, {
              data: { ids: id }
          });
          return res;
      } else {
          // Nếu là 1 ID, gửi trong body
          let res = await instance.delete(URL, {
              data: { ids: [id] }
          });
          return res;
      }
  } catch (error) {
      console.log(error);
      throw error;
  }
}

export const createBulkTransactionsAPI = async (transactions) => {
  try {
      const {data} = await instance.post(URL + '/bulk', {
          transactions: transactions
      });
      return data;
  } catch (error) {
      console.error('Lỗi khi tạo bulk giao dịch:', error);
      throw error;
  }
};

export const updateBulkTransactionsAPI = async (transactions) => {
  try {
    console.log(transactions);
    const {data} = await instance.put(URL + '/bulk', {
      transactions: transactions
    });
    return data;
  } catch (error) {
    console.error('Lỗi khi cập nhật bulk giao dịch:', error);
    throw error;
  }
};

