import instance from './axiosInterceptors';
import { db } from '../indexedDB';
import dayjs from 'dayjs';
import {getLastIdSoKeToan} from "./soketoanService.jsx";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ktqt-skt';
const URL = BASE_URL + SUB_URL;

const POLLING_INTERVAL = 60000;
let pollingInterval = POLLING_INTERVAL;

export const getAllSoKeToan = async () => {
  const localData = await db.soKeToan.toArray();
  if (localData.length > 0) return localData;
  try {
    const response = await instance.get(URL);
    const filteredData = processData(response.data);
    await db.soKeToan.bulkPut(filteredData);
    return filteredData;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin:', error);
    throw error;
  }
};

const processData = (data) => {
  return data.filter(item => item.show === true).map(e => {
    if (e.pl_value && e.pl_value !== 0 && (!e.kmf || e.kmf === '')) {
      e.not_kmf = true;
    }
    if (e.cash_value && e.cash_value !== 0 && (!e.kmns || e.kmns === '')) {
      e.not_kmns = true;
    }
    return e;
  });
};

export const createNewSoKeToan = async (newRowData) => {
  try {
    const localId = await db.soKeToan.add({ ...newRowData, isPending: true });
    let res = await instance.post(URL, newRowData);
    await db.soKeToan.update(localId, { isPending: false, id: res.data.id });
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateSoKeToan = async (updatedRow) => {
  try {
    await db.soKeToan.put(updatedRow); // Cập nhật IndexedDB trước
    let res = await instance.put(URL, updatedRow);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};


export const deleteSoKeToan = async (id) => {
  try {
    await db.soKeToan.delete(id);
    let res = await instance.delete(`${URL}/${id}`);
    return res;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getLastUpdateSoKeToan = async () => {
  try {
    const response = await instance.get(`${URL}/last-update`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getCountSoKeToan = async () => {
  try {
    const response = await instance.get(`${URL}/count`);
    return response.data.count;
  } catch (error) {
    console.error("Lỗi khi lấy số lượng bản ghi:", error);
    return 0;
  }
};

export const startPolling = () => {
  setInterval(async () => {
    try {
      const localLastUpdate = (await db.soKeToan.orderBy('updateAt').last())?.updateAt || '1970-01-01T00:00:00Z';
      const localMaxId = (await db.soKeToan.orderBy('id').last())?.id || 0;
      const localCount = await db.soKeToan.count(); // Số bản ghi hiện có trong IndexedDB

      const serverMaxId = await getLastIdSoKeToan();
      const serverLastUpdate = await getLastUpdateSoKeToan();
      const serverCount = await getCountSoKeToan(); // Tổng số bản ghi trên server

      console.log(localLastUpdate, serverLastUpdate, "Max ID:", localMaxId, serverMaxId, "Count:", localCount, serverCount);

      if (
          dayjs(serverLastUpdate).isAfter(dayjs(localLastUpdate)) ||
          +localMaxId !== +serverMaxId ||
          +localCount !== +serverCount // Kiểm tra số lượng bản ghi
      ) {
        console.log("🔄 Có sự thay đổi trong dữ liệu, cập nhật IndexedDB...");
        const response = await instance.get(URL);
        const filteredData = processData(response.data);
        await db.soKeToan.clear();
        await db.soKeToan.bulkPut(filteredData);

        console.log(`✅ Đã cập nhật ${filteredData.length} bản ghi.`);
        pollingInterval = POLLING_INTERVAL; // Reset về 5 giây
      } else {
        pollingInterval = Math.min(pollingInterval * 2, 600000);
      }
    } catch (error) {
      console.error("Lỗi polling:", error);
    }
  }, pollingInterval);
};

