import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/phieu-nhap-xuat'
const URL = BASE_URL + SUB_URL;

export const getFullPhieuXuat = async () => {
  try {
    const { data } = await instance.get(URL + '/phieu-xuat');
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin:', error);
    throw error;
  }
}


export const getPhieuXuatByCardId2 = async (idCard) => {
  try {
    let { data } = await instance.get(URL + '/phieu-xuat');
    if (!isNaN(idCard))
      data = data.filter(e => e.id_card_create == idCard)
    else {
      data = data.filter(e => e.id_phieu_xuat == parseInt(idCard.slice(1), 10))
    }
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin:', error);
    throw error;
  }
}

export const getFullPhieuNhap = async () => {
  try {
    const { data } = await instance.get(URL + '/phieu-nhap');
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin:', error);
    throw error;
  }
}
