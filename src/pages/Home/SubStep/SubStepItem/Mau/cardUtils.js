import { updateCard } from '../../../../../apis/cardService';
export async function updateCardDetails(idCard, mo_ta, so_tien, mo_ta2, name, phieu_lq) {
  const payload = {
    id: idCard,
    mo_ta: mo_ta,
    so_tien: so_tien,
    mo_ta2: mo_ta2,
  };
  if (name) payload.name = name
  if (phieu_lq) payload.phieu_lq = phieu_lq
  try {
    await updateCard(payload);
    console.log("Cập nhật card thành công! cardUtils.js");
  } catch (error) {
    console.error("Lỗi khi cập nhật card: cardUtils.js", error);
  }
}
