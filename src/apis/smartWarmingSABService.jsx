import instance from './axiosInterceptors';
import {tinhSoNgayDaQuaTuChuoi} from "../generalFunction/format.js";
import {LIST_REVIEW_SAB} from "../Consts/LIST_REVIEW_SAB.js";
import {getSettingByType} from "./settingService.jsx";
import {SETTING_TYPE} from "../CONST.js";
import {getCurrentUserLogin} from "./userService.jsx";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/smart-warning-sab'
const URL = BASE_URL + SUB_URL;
export const getAllWarningSAB = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};


export const getAllWarningRTypeSAB = async () => {
    const currentMonth = new Date().getMonth() + 1;
    const user = (await getCurrentUserLogin()) .data


    const settingData = await getSettingByType(SETTING_TYPE.Warning) || [];
    const settings = settingData.setting || [];
    let listE = {};

    if (LIST_REVIEW_SAB.length > 0) {
        LIST_REVIEW_SAB.forEach(review => {
            const relatedSettings = settings.filter(setting => setting.code === review.code);

            relatedSettings.forEach(setting => {
                const value = review[`t${currentMonth}`];
                let status = ""; // Trạng thái vượt ngưỡng hay thấp hơn

                const isOutOfRange = (
                    (setting.max && setting.min && (value < setting.min || value > setting.max)) ||
                    (setting.max && !setting.min && value > setting.max) ||
                    (!setting.max && setting.min && value < setting.min)
                );

                // Xác định trạng thái
                if (isOutOfRange) {
                    if (setting.max && setting.min) {
                        if (value < setting.min) {
                            status = "thấp hơn ngưỡng tối thiểu";
                        } else if (value > setting.max) {
                            status = "vượt ngưỡng tối đa";
                        }
                    } else if (setting.max && !setting.min) {
                        status = user && user.email == 'anh@xichtho-vn.com'?"vượt mức pickleball" :"vượt ngưỡng tối đa";
                    } else if (!setting.max && setting.min) {
                        status =user && user.email == 'anh@xichtho-vn.com'?"thấp mức pickleball" : "thấp hơn ngưỡng tối thiểu";
                    }

                    // Kiểm tra nếu đã tồn tại type thì thêm data, nếu chưa thì tạo mới
                    if (listE[setting.code]) {
                        listE[setting.code].data.push(review);
                    } else {
                        listE[setting.code] = {
                            type: setting.code,
                            data: [review],
                            message: `Tháng ${currentMonth} - ${setting.name} - ${status}`,
                            path: '/accounting/du-lieu-khac/review'
                        };
                    }
                }
            });
        });
    }

    return listE;
};

