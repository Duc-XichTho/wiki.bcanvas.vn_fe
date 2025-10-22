import instance from './axiosInterceptors'
import {getAllUnits} from "./unitService.jsx";
import {getAllProduct} from "./productService.jsx";
import {getAllProject} from "./projectService.jsx";
import {getAllKenh} from "./kenhService.jsx";
import {getArrFromFieldOfList} from "../generalFunction/getArrFromFieldOfList.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/ktqt-co-che-phan-bo";
const URL = BASE_URL + SUB_URL;

export const getAllCoCauPhanBo = async () => {
    try {
        const data = await instance.get(URL);
        const [units, sanPhams, vvs, kenhs] = await Promise.all([
            getAllUnits(),
            getAllProduct(),
            getAllProject(),
            getAllKenh()
        ]);

        const lists = {
            "Vụ việc": getArrFromFieldOfList(vvs, 'code'),
            "Kênh": getArrFromFieldOfList(kenhs, 'code'),
            "Sản phẩm": getArrFromFieldOfList(sanPhams, 'code'),
            "Đơn vị": getArrFromFieldOfList(units, 'code'),
        };

        const filteredData = data.data
            .filter(item => item.show === true)
            .sort((a, b) => b.id - a.id);

        filteredData.forEach(item => {
            const pb = item?.PB;
            if (!pb || !pb[0]) return;

            // Xử lý các tháng có giá trị
            const validMonths = Object.keys(pb[0])
                .filter(key => key.startsWith("thang_") && pb.some(entry => entry[key] !== 0 && entry[key] !== null))
                .map(month => parseInt(month.replace("thang_", ""), 10));
            item.monthsHasValue = `Thẻ đang phân bổ các tháng: ${validMonths.join(', ')}`;

            // Xử lý các đối tượng không tồn tại
            const listCode = lists[item.type];
            if (listCode) {
                const objNotInList = pb
                    .filter(ccpb => !listCode.includes(ccpb.ten_don_vi))
                    .map(ccpb => ccpb.ten_don_vi);
                item.objHasNotValue = objNotInList.length > 0
                    ? `Thẻ đang phân bổ cho các đối tượng không tồn tại: ${objNotInList.join(', ')}`
                    : null;
            }
        });

        return filteredData;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin:", error);
        throw error;
    }
};

export const createNewCoCauPhanBo = async (newRowData) => {
    try {
        let res = await instance.post(URL, newRowData);
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const updateCoCauPhanBo = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData);
        return res;
    } catch (error) {
        console.log(1, error);
        throw error;
    }
};

export const deleteCoCauPhanBo = async (id) => {
    try {
        let res = await instance.delete(`${URL}/${id}`);
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
