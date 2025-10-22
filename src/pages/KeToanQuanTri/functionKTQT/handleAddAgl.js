import {toast} from 'react-toastify';

import {createNewCoCauPhanBo} from '../../../apisKTQT/coCauPhanBoService';
import {createNewVas} from '../../../apisKTQT/vasService';
import {createNewMaCashPlan} from '../../../apisKTQT/maCashPlanService';
import {createNewTeam} from '../../../apisKTQT/teamService.jsx';
import {createNewKmns} from '../../../apisKTQT/kmnsService.jsx';
import {createNewSoKeToan} from '../../../apisKTQT/soketoanService.jsx';
import {createNewKmf} from '../../../apisKTQT/kmfService';
import {createNewProject} from '../../../apisKTQT/projectService.jsx';
import {createNewPhanBo} from '../../../apisKTQT/phanboService.jsx';
import {createNewVendor} from '../../../apisKTQT/vendorService.jsx';
import {createNewProduct} from '../../../apisKTQT/productService.jsx';
import {createNewUnit} from '../../../apisKTQT/unitService.jsx';
import {createNewTask} from "../../../apisKTQT/taskService.jsx";
import {createNewDeal} from "../../../apisKTQT/dealService.jsx";
import {createNewLuong} from "../../../apisKTQT/luongService.jsx";
import {createNewKenh} from "../../../apisKTQT/kenhService.jsx";
import {createNewLeadManagement} from "../../../apis/leadManagementService.jsx";
import {createNewDataCRM} from "../../../apis/dataCRMService.jsx";
import {createNewCostPool} from "../../../apis/costPoolService.jsx";
import {useContext} from "react";
import {MyContext} from "../../../MyContext.jsx";

export const handleAddAgl = async (company, data, table, fetchData, setIsUpdateNoti , isUpdateNoti) => {

  try {
    if (table === 'CostPool') {
      await createNewCostPool(data);
    }
    if (table === 'Data-CRM') {
      await createNewDataCRM(data);
    }
    if (table === 'Lead-Management') {
      await createNewLeadManagement(data);
    }
    if (table === 'Kenh') {
      await createNewKenh(data);
    }
    if (table === 'Luong') {
      await createNewLuong(data);
    }
    if (table === 'Task') {
      await createNewTask(data);
    }
    if (table === 'CoChePhanBo') {
      data.company = company;
      await createNewCoCauPhanBo(data);
    }

    if (table === 'Vas') {
      await createNewVas(data);
    }

    if (table === 'MaCashPlan') {
      await createNewMaCashPlan(data);
    }

    if (table === 'Team') {
      data.company = company;
      await createNewTeam(data);
    }

    if (table === 'Kmns') {
      data.company = null;
      await createNewKmns(data);
    }

    if (table === 'SoKeToan-KTQT') {
      await createNewSoKeToan(data);
    }

    if (table === 'Kmf') {
      data.company = null;
      await createNewKmf(data);
    }

    if (table === 'Project') {
      data.company = company;
      await createNewProject(data);
    }

    if (table === 'PhanBo') {
      data.company = company;
      await createNewPhanBo(data);
    }
    if (table === 'Vendor') {
      data.company = company;
      await createNewVendor(data);
    }
    if (table === 'Product') {
      data.company = company;
      await createNewProduct(data);
    }
    if (table === 'Unit') {
      data.company = company;
      await createNewUnit(data);
    }
    if (table === 'Deal') {
      data.company = company;
      await createNewDeal(data);
    }

    try {
      await fetchData();
      if(setIsUpdateNoti && isUpdateNoti){
        setIsUpdateNoti(!isUpdateNoti)
      }

    } catch (e) {}
    toast.success('Thêm mới thành công !!');
  } catch (error) {
    console.log(error);
    toast.error('Error updating data: ', error);
  }
};
