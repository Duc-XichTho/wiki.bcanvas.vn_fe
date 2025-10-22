import {toast} from "react-toastify";
import {deleteCoCauPhanBo} from "../../../apisKTQT/coCauPhanBoService.jsx";
import {deleteVas} from "../../../apisKTQT/vasService.jsx";
import {deleteMaCashPlan} from "../../../apisKTQT/maCashPlanService.jsx";
import {deleteTeam} from "../../../apisKTQT/teamService.jsx";
import {deleteKmns} from "../../../apisKTQT/kmnsService.jsx";
import {deleteSoKeToan} from "../../../apisKTQT/soketoanService.jsx";
import {deleteKmf} from "../../../apisKTQT/kmfService.jsx";
import {deleteProject} from "../../../apisKTQT/projectService.jsx";
import {deletePhanBo} from "../../../apisKTQT/phanboService.jsx";
import {deleteVendor} from "../../../apisKTQT/vendorService.jsx";
import {deleteProduct} from "../../../apisKTQT/productService.jsx";
import {deleteUnit} from "../../../apisKTQT/unitService.jsx";
import {deleteDeal} from "../../../apisKTQT/dealService.jsx";
import {deleteKenh} from "../../../apisKTQT/kenhService.jsx";
import {deleteDataCRM} from "../../../apis/dataCRMService.jsx";
import {deleteLeadManagement} from "../../../apis/leadManagementService.jsx";
import {deleteSettingGroup} from "../../../apisKTQT/settingGroupService.jsx";
import {deleteCostPool} from "../../../apis/costPoolService.jsx";
import {deleteQuanLyTag} from "../../../apis/quanLyTagService.jsx";
import {deletePMVCategories} from "../../../apis/pmvCategoriesService.jsx";

export const handleDeleteAgl = async (table, reloadData, id,  setIsUpdateNoti, isUpdateNoti) => {

  try {
    if (table === "PMV_CATEGORY") {
      await deletePMVCategories(id);
    }
    if (table === "QL_TAG") {
      await deleteQuanLyTag(id);
    }
    if (table === "CostPool") {
      await deleteCostPool(id);
    }
    if (table === "SettingGroupTable") {
      await deleteSettingGroup(id);
    }
    if (table === "Lead-Management") {
      await deleteLeadManagement(id);
    }
    if (table === "Data-CRM") {
      await deleteDataCRM(id);
    }
    if (table === "CoCauPhanBo") {
      await deleteCoCauPhanBo(id);
    }

    if (table === "Kenh") {
      await deleteKenh(id);
    }

    if (table === "Vas") {
      await deleteVas(id);
    }

    if (table === "MaCashPlan") {
      await deleteMaCashPlan(id);
    }

    if (table === "Team") {
      await deleteTeam(id);
    }


    if (table === "Kmns") {
      await deleteKmns(id);
    }

    if (table === 'SoKeToan-KTQT') {
      localStorage.removeItem('lastIdFE')
      await deleteSoKeToan(id);
    }

    if (table === "Kmf") {
      await deleteKmf(id);
    }

    if (table === "Project") {
      await deleteProject(id);
    }

    if (table === "PhanBo") {
      await deletePhanBo(id);
    }
    if (table === "Vendor") {
      await deleteVendor(id);
    }
    if (table === "Product") {
      await deleteProduct(id);
    }
    if (table === "Unit") {
      await deleteUnit(id);
    }
    if (table === "Deal") {
      await deleteDeal(id);
    }

    await reloadData();
    try{
      setIsUpdateNoti(!isUpdateNoti)
    }catch (e){
      console.log(e)
    }
    toast.success("Xóa thành công !!! ");
  } catch (error) {
    console.log(error);
    toast.error("Error:", error);
  }
};
