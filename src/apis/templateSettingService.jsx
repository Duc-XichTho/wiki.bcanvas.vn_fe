import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/template-setting";
const URL = BASE_URL + SUB_URL;

// GET
export const getAllTemplateTables = async () => {
  try {
    const { data } = await instance.get(URL + `/get-all-template`);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};
export const getAllTablesPlan = async () => {
  try {
    const { data } = await instance.get(URL + `/get-all-tables-plan`);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const getTemplateByFileNoteId = async (fileNote_id) => {
  try {
    const { data } = await instance.get(URL + `/fileNote/${fileNote_id}`);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const getTemplateTableByPlanIdService = async (planId) => {
  try {
    const { data } = await instance.get(URL + `/plan/${planId}`);
    return data;
  } catch (error) {
    console.error("Lỗi getTemplateTableByPlanIdService", error);
  }
}
export const getDepTableByPlanIdService = async (planId) => {
  try {
    const { data } = await instance.get(URL + `/deployment/${planId}`);
    return data;
  } catch (error) {
    console.error("Lỗi getTemplateTableByPlanIdService", error);
  }
}

export const getAllTemplateSheetTable = async () => {
  try {
    const { data } = await instance.get(URL);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const getTableByid = async (id) => {
  try {
    const result = await instance.get(URL + `/${id}`);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy thông tin: ", e);
    throw e;
  }
};

export const getTemplateColumn = async (id , version = null) => {
  try {
    if (version) {
      const result = await instance.get(URL + `/get-column/${id}?version=${version}`);
      return result.data;
    }
    const result = await instance.get(URL + `/get-column/${id}`);
    return result.data;
  } catch (error) {
    console.error("Error fetching template columns: ", error);
    throw error;
  }
};

export const getTemplateRow = async (tableId, version = null, forceRefresh = false, page = 1, pageSize = null) => {
  try {
    let url = URL + `/get-row/${tableId}`;
    const params = new URLSearchParams();
    
    if (version) {
      params.append('version', version);
    }
    
    if (forceRefresh) {
      params.append('_t', Date.now());
    }

    if (page) {
      params.append('page', page);
    }

    if (pageSize) {
      params.append('pageSize', pageSize);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += '?' + queryString;
    }
    
    const result = await instance.get(url);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy thông tin: ", e);
    throw e;
  }
};

export const getTemplateVersion = async (tableId, version = null) => {
  try {
    if (version) {
      const result = await instance.get(URL + `/get-version/${tableId}?version=${version}`);
      return result.data;
    }
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy thông tin: ", e);
    throw e;
  }
};
export const getTemplateRowById = async (id) => {
  try {
    const result = await instance.get(URL + `/get-row-by-id/${id}`);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy thông tin: ", e);
    throw e;
  }
};

export const getColumnValidData = async (id, columnId) => {
  try {
    const result = await instance.get(URL + `/get-valid/${id}/${columnId}`);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy thông tin: ", e);
    throw e;
  }
};

// CREATE
export const createTemplateTable = async (data) => {
  try {
    const result = await instance.post(URL + "/create-table", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};
export const createTemplateColumn = async (data) => {
  try {
    const result = await instance.post(URL + "/create-column", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};
export const getTemplateColumnForTemplate = async (id) => {
  try {
    const result = await instance.get(URL + `/get-column/${id}`);
    return result.data;
  } catch (error) {
    console.error("Error fetching template columns: ", error);
    throw error;
  }
};

export const createTemplateRow = async (data) => {
  try {
    const result = await instance.post(URL + "/create-row", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};

export const createBathTemplateRow = async (data) => {
  try {
    const result = await instance.post(URL + "/create-batch-row", data);
    return result;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};

// UPDATE
export const updateTemplateTable = async (data) => {
  try {
    const result = await instance.put(URL + "/update-table", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi cập nhật mô tả: ", e);
    throw e;
  }
};

export const updateTemplateTableVersion = async (id , version , desc) => {
  try {
    const result = await instance.put(URL + `/update-table-version/${id}?version=${version}` , {desc});
    return result.data;
  } catch (e) {
    console.error("Lỗi khi cập nhật mô tả: ", e);
    throw e;
  }
};

export const updateTemplateColumn = async (data) => {
  try {
    const result = await instance.put(URL + "/update-column", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi cập nhật cột: ", e);
    throw e;
  }
};

export const updateTemplateColumnWidth = async (data) => {
  try {
    const result = await instance.put(URL + "/update-column-width", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi cập nhật cột: ", e);
    throw e;
  }
};

export const updateColumnIndexes = async (data) => {
  try {
    const result = await instance.put(URL + "/update-column-indexes", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi cập nhật thứ tự cột: ", e);
    throw e;
  }
};

export const updateTemplateRow = async (data) => {
  try {
    const result = await instance.put(URL + "/update-row", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};

export const updateBatchTemplateRow = async (data) => {
  try {
    const result = await instance.put(URL + "/update-batch-row", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};

export const updateSelectOption = async (data) => {
  try {
    const result = await instance.put(URL + "/update-select-option", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};

export const updateTemplateColumnOption = async (data) => {
  try {
    const result = await instance.put(
      URL + "/update-template-column-option",
      data
    );
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};

export const updateTemplateFormulaOption = async (data) => {
  try {
    const result = await instance.put(
      URL + "/update-template-formula-option",
      data
    );
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};

// DELETE
export const deleteTemplateRow = async (id) => {
  try {
    const result = await instance.delete(URL + `/delete-row/${id}`);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
}

export const deleteTemplateRows = async (ids) => {
  try {
    const result = await instance.delete(URL + `/delete-rows`, {
      data: { ids: ids }  // Gửi ids trong data property khi gọi DELETE
    });
    return result.data;
  } catch (e) {
    console.error("Lỗi khi xóa nhiều: ", e);
    throw e;
  }
};


export const deleteTemplateRowByTableId = async (id, version = null) => {
  try {
    if (version) {
      const result = await instance.delete(
          URL + `/delete-all-row-by-table/${id}?version=${version}`
      );
      return result.data;
    }
    const result = await instance.delete(
      URL + `/delete-all-row-by-table/${id}`
    );
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};


export const deleteTemplateColByTableId = async (id) => {
  try {
    const result = await instance.delete(
      URL + `/delete-column-by-table/${id}`
    );
    return result.data;
  } catch (e) {
    console.error("Lỗi khi tạo cột mới: ", e);
    throw e;
  }
};

export const deleteTemplateCol = async (data) => {
  try {
    const result = await instance.put(URL + "/delete-column", data);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi xóa cột: ", e);
    throw e;
  }
};

export const getTemplateInfoByTableId = async (tableId) => {
  try {
    const result = await instance.get(URL + `/get-template-info/${tableId}`);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy thông tin: ", e);
    throw e;
  }
}

export const getAllTemplateTableInfo = async () => {
  try {
    const result = await instance.get(URL + `/templates-table-info`);
    console.log(result);
    return result;
  } catch (e) {
    console.error("Lỗi khi lấy thông tin: ", e);
    throw e;
  }
}

// OPTIMIZATION: API mới để xử lý step data trực tiếp ở backend
export const processStepData = async (templateId, stepConfig, stepType, inputStepId = null, version = null, options = {}) => {
  try {

    
    const response = await instance.post(URL + '/process-step-data', {
      templateId,
      stepConfig,
      stepType,
      inputStepId,
      version,
      ...options // Thêm options cho test mode
    });
    
    console.log(`✅ Frontend processStepData - API response:`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error processing step data: ", error);
    console.error("❌ Error details: ", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
}

// OPTIMIZATION: API mới để chạy tất cả steps theo hàng đợi
export const batchRunAllSteps = async (templateId, steps) => {
  try {
    const response = await instance.post(URL + '/batch-run-all-steps', {
      templateId,
      steps
    });
    return response.data;
  } catch (error) {
    console.error("Error batch running steps: ", error);
    throw error;
  }
}

// OPTIMIZATION: API để xóa dữ liệu test
export const clearTestData = async (templateId) => {
  try {
    const response = await instance.post(URL + '/clear-test-data', {
      templateId
    });
    return response.data;
  } catch (error) {
    console.error("Error clearing test data: ", error);
    throw error;
  }
}

// API để reset toàn bộ luồng dữ liệu template
export const resetTemplateFlow = async (templateId) => {
  try {
    const response = await instance.post(URL + '/reset-template-flow', {
      templateId
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting template flow: ", error);
    throw error;
  }
}

// API để lấy tổng số dòng có version null (data rubik)
export const getTotalRows = async (version) => {
  try {
    const { data } = await instance.get(URL + `/total-rows/${version}`);
    return data;
  } catch (error) {
    console.error("Error getting total rows with version null: ", error);
    throw error;
  }
}