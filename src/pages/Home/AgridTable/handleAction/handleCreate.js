import {createNewHangHoaLo} from "../../../../apis/hangHoaLoService.jsx";
import {createTimestamp} from "../../../../generalFunction/format.js";
import {createNewKhaiBaoDauKy} from "../../../../apis/khaiBaoDauKyService.jsx";

export const handleCreate = async (table, newData, currentUser) => {
    try {
        newData.created_at = createTimestamp();
        newData.user_create = currentUser.email;
        if (table === "HangHoaLo") {
            await createNewHangHoaLo(newData);
        }
        if (table === "DauKy") {
            await createNewKhaiBaoDauKy(newData);
        }
    } catch (error) {
        console.error('Error create data:', error);
        // toast.error('Lỗi khi lưu dữ liệu: ', error.message);
    }
};
