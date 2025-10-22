import {getAllNhanVien} from "../apis/nhanVienService.jsx";
import {DANH_MUC_LIST} from "../Consts/DANH_MUC_LIST.js";

export async function getDataByNameTable(tableName) {
    let res = []
    try {
        for (const dm of DANH_MUC_LIST) {
            if (tableName === dm.key) {
                res = await dm.getAllApi();
            }
        }
        return res;
    } catch (e) {
        return []
    }
}