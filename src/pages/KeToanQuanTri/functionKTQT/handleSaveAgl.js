import {toast} from 'react-toastify';
import {updateCoCauPhanBo} from "../../../apisKTQT/coCauPhanBoService.jsx";
import {updateTask} from "../../../apisKTQT/taskService.jsx";
import {updateMappingLuong} from "../../../apisKTQT/mappingLuongService.jsx";
import {updateLuong} from "../../../apisKTQT/luongService.jsx";
import {updateMaCashPlan} from "../../../apisKTQT/maCashPlanService.jsx";
import {updateTeam} from "../../../apisKTQT/teamService.jsx";
import {updateSoKeToan,updateBulkSoKeToan} from "../../../apisKTQT/soketoanService.jsx";
import {updateProject} from "../../../apisKTQT/projectService.jsx";
import {updatePhanBo} from "../../../apisKTQT/phanboService.jsx";
import {updateVendor} from "../../../apisKTQT/vendorService.jsx";
import {updateProduct} from "../../../apisKTQT/productService.jsx";
import {updateUnit} from "../../../apisKTQT/unitService.jsx";
import {updateKmf} from "../../../apisKTQT/kmfService.jsx";
import {updateKmns} from "../../../apisKTQT/kmnsService.jsx";
import {updateVas} from "../../../apisKTQT/vasService.jsx";
import {updateDeal} from "../../../apisKTQT/dealService.jsx";
import {log10} from "mathjs";
import {updateKenh} from "../../../apisKTQT/kenhService.jsx";
import {updateLeadManagement} from "../../../apis/leadManagementService.jsx";
import {updateDataCRM} from "../../../apis/dataCRMService.jsx";
import {updateSettingGroup} from "../../../apisKTQT/settingGroupService.jsx";
import {updateCostPool} from "../../../apis/costPoolService.jsx";
import {useContext} from "react";
import {MyContext} from "../../../MyContext.jsx";

export const handleSaveAgl = async (updatedData, table, setUpdatedData, setIsUpdateNoti, isUpdateNoti) => {

    try {
        if (table === 'CostPool') {
            const promises = updatedData.map(async (data) => {
                await updateCostPool(data);
            });
            await Promise.all(promises);
        }
        if (table === 'SettingGroupTable') {
            const promises = updatedData.map(async (data) => {
                await updateSettingGroup(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Data-CRM') {
            const promises = updatedData.map(async (data) => {
                await updateDataCRM(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Lead-Management') {
            const promises = updatedData.map(async (data) => {
                await updateLeadManagement(data);
            });
            await Promise.all(promises);
        }
        if (table === 'CoChePhanBo') {
            const promises = updatedData.map(async (data) => {
                await updateCoCauPhanBo(data);
            });
            await Promise.all(promises);
        }

        if (table === 'Task') {
            const promises = updatedData.map(async (data) => {
                await updateTask(data);
            });
            await Promise.all(promises);
        }
        if (table === 'MappingLuong') {
            const promises = updatedData.map(async (data) => {
                await updateMappingLuong(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Kenh') {
            const promises = updatedData.map(async (data) => {
                await updateKenh(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Luong') {
            const promises = updatedData.map(async (data) => {
                await updateLuong(data);
            });
            await Promise.all(promises);
        }
        if (table === 'MaCashPlan') {
            const promises = updatedData.map(async (data) => {
                await updateMaCashPlan(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Team') {
            const promises = updatedData.map(async (data) => {
                await updateTeam(data);
            });
            await Promise.all(promises);
        }

        if (table === 'SoKeToan-KTQT') {
            const processedData = updatedData.map(data => {
                if (data.loai_giao_dich === 'Chi') {
                    data.ref_id2 = -data.so_tien || 0;
                }
                if (data.loai_giao_dich === 'Thu') {
                    data.ref_id2 = data.so_tien || 0;
                }
                const taiKhoanNo = data.tai_khoan_no;
                const taiKhoanCo = data.tai_khoan_co;
                if (taiKhoanNo && /^[5678]/.test(taiKhoanNo)) {
                    data.kmf = taiKhoanNo.replace(/^\d+-/, '');
                }
                if (taiKhoanCo && /^[5678]/.test(taiKhoanCo)) {
                    data.kmf = taiKhoanCo.replace(/^\d+-/, '');
                }
                if ((taiKhoanNo && /^[5678]/.test(taiKhoanNo)) || (taiKhoanCo && /^[5678]/.test(taiKhoanCo))) {
                    if ((taiKhoanNo && /^[57]/.test(taiKhoanNo)) || (taiKhoanCo && /^[57]/.test(taiKhoanCo))) {
                        data.ref_id3 = 'Doanh thu';
                    } else if ((taiKhoanNo && /^[68]/.test(taiKhoanNo)) || (taiKhoanCo && /^[68]/.test(taiKhoanCo))) {
                        data.ref_id3 = 'Chi phí';
                    }
                }
                if (data.show === 'true') {
                    if (/^6|^8|^52/.test(taiKhoanNo)) {
                        data.so_tien_kd = -data.so_tien;
                    } else if (/^6|^8|^52/.test(taiKhoanCo)) {
                        data.so_tien_kd = data.so_tien;
                    } else if (/^51|^7/.test(taiKhoanNo)) {
                        data.so_tien_kd = -data.so_tien;
                    } else if (/^51|^7/.test(taiKhoanCo)) {
                        data.so_tien_kd = data.so_tien;
                    }
                }
                data = JSON.parse(JSON.stringify(data))
                if (data.CCPBDV === 'Trực tiếp') data.CCPBDV = null;
                if (data.CCBSP === 'Trực tiếp') data.CCBSP = null;
                if (data.CCPBDEAL === 'Trực tiếp') data.CCPBDEAL = null;
                return data;
            });
            
            await updateBulkSoKeToan(processedData);
        }

        if (table === 'Project') {
            console.log(updatedData)
            const promises = updatedData.map(async (data) => {
                await updateProject(data.id, data);
            });
            await Promise.all(promises);
        }

        if (table === 'PhanBo') {
            const promises = updatedData.map(async (data) => {
                await updatePhanBo(data);
            });
            await Promise.all(promises);
        }

        if (table === 'Vendor') {
            const promises = updatedData.map(async (data) => {
                await updateVendor(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Product') {
            const promises = updatedData.map(async (data) => {
                await updateProduct(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Unit') {
            const promises = updatedData.map(async (data) => {
                await updateUnit(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Kmf') {
            const promises = updatedData.map(async (data) => {
                await updateKmf(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Kmns') {
            const promises = updatedData.map(async (data) => {
                await updateKmns(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Vas') {
            const promises = updatedData.map(async (data) => {
                await updateVas(data);
            });
            await Promise.all(promises);
        }
        if (table === 'Deal') {
            const promises = updatedData.map(async (data) => {
                await updateDeal(data);
            });
            await Promise.all(promises);
        }

        try {
            setIsUpdateNoti(!isUpdateNoti)
            setUpdatedData([]);
        } catch (e) {
        }
    } catch (error) {
        console.error('Error updating data:', error);
        // toast.error('Lỗi khi lưu dữ liệu: ', error.message);
    }
};
