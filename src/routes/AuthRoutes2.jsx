import { Route } from "react-router-dom";
import { Fragment } from "react";
import { ROUTES } from "../CONST";
import AuthRoute from "../AuthRoute";
import LoginSuccess from "../pages/LoginSuccess/LoginSuccess";
import Admin2 from "../pages/Admin2/Admin2";
import KeToanQuanTri from "../pages/KeToanQuanTri/KeToanQuanTriComponent/KeToanQuanTri.jsx"
import Vas from "../pages/KeToanQuanTri/DanhMuc/Vas.jsx"
import SoKeToan from "../pages/KeToanQuanTri/VanHanh/SoKeToan.jsx"
import SKTDieuChinh from "../pages/KeToanQuanTri/VanHanh/SKTDieuChinh/SKTDieuChinh.jsx"
import ReviewSKT from "../pages/KeToanQuanTri/Review/ReviewSKT.jsx"
import ReviewVAS from "../pages/KeToanQuanTri/Review/ReviewVAS.jsx"
import DataCRM from "../pages/KeToanQuanTri/VanHanh/DataCRM.jsx"
import LeadManagement from "../pages/KeToanQuanTri/VanHanh/LeadManagement.jsx"
import Plan2 from "../pages/KeToanQuanTri/BaoCao/Plan2/Plan2.jsx"
import PlanActual2 from "../pages/KeToanQuanTri/BaoCao/Plan2/PlanActual2.jsx"
import PlanActualCungKy from "../pages/KeToanQuanTri/BaoCao/Plan2/PlanActualCungKy.jsx"
import BaoCaoTongQuat from "../pages/KeToanQuanTri/BaoCao/BaoCaoTongQuat.jsx"
import BaoCaoGroupUnit from "../pages/KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoGroupUnit.jsx"
import BaoCaoPBNhomSP from "../pages/KeToanQuanTri/BaoCao/KQKD/SP/BaoCaoPBNhomSP.jsx"
import BaoCaoGroupMonth from "../pages/KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoGroupMonth.jsx"
import BaoCaoPBNhomSP2 from "../pages/KeToanQuanTri/BaoCao/KQKD/SP/BaoCaoPBNhomSP2.jsx"
import HSFS from "../pages/KeToanQuanTri/BaoCao/HSFS.jsx"
import BaoCaoCDTC from "../pages/KeToanQuanTri/BaoCao/CDTC/BaoCaoCDTC.jsx"
import BaoCaoPBT from "../pages/KeToanQuanTri/BaoCao/KQKD/Team/BaoCaoPBT.jsx"
import BaoCaoThuChi from "../pages/KeToanQuanTri/BaoCao/ThuChi/BaoCaoThuchi.jsx"
import BaoCaoNhomKenh from "../pages/KeToanQuanTri/BaoCao/KQKD/Kenh/BaoCaoNhomKenh.jsx"
import BaoCaoPBNhomKenh2 from "../pages/KeToanQuanTri/BaoCao/KQKD/Kenh/BaoCaoPBNhomKenh2.jsx"
import BCNhomVV from "../pages/KeToanQuanTri/BaoCao/KQKD/VV/BCNhomVV.jsx"
import BaoCaoPBNhomVV2 from "../pages/KeToanQuanTri/BaoCao/KQKD/VV/BaoCaoPBNhomVV2.jsx"
import DMKM from "../pages/KeToanQuanTri/DanhMuc/DMKM.jsx"
import PhanBoSanPham from "../pages/KeToanQuanTri/VanHanh/SoPhanBo/PhanBoSanPham.jsx"
import PhanBoDonVi from "../pages/KeToanQuanTri/VanHanh/SoPhanBo/PhanBoDonVi.jsx"
import PhanBoKenh from "../pages/KeToanQuanTri/VanHanh/SoPhanBo/PhanBoKenh.jsx"
import PhanBoVuViec from "../pages/KeToanQuanTri/VanHanh/SoPhanBo/PhanBoVuViec.jsx"
import CoChePhanBoDV from "../pages/KeToanQuanTri/VanHanh/ThePhanBo/CoChePhanBoDV.jsx"
import CoChePhanBoProject from "../pages/KeToanQuanTri/VanHanh/ThePhanBo/CoChePhanBoProject.jsx"
import CoChePhanBoSP from "../pages/KeToanQuanTri/VanHanh/ThePhanBo/CoChePhanBoSP.jsx"
import CoChePhanBoKenh from "../pages/KeToanQuanTri/VanHanh/ThePhanBo/CoChePhanBoKenh.jsx"
import BaoCaoUnit from "../pages/KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoUnit.jsx";
import BaoCaoUnitMonth from "../pages/KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoUnitMonth.jsx";
import KTQTImport from '../pages/KeToanQuanTri/VanHanh/KTQTImport.jsx';
import KTQTMapping from '../pages/KeToanQuanTri/VanHanh/KTQTMapping.jsx';

export const AuthRoutes2 = ({ listCompany }) => (
  <Route element={<AuthRoute />}>

    <Route path={ROUTES.LOGIN_SUCCESS} element={<LoginSuccess />} />
    <Route path={ROUTES.ADMIN} element={<Admin2 />} />

    <Route path={ROUTES.KTQT} element={<KeToanQuanTri />}>
      <Route path={ROUTES.KTQT_VAS} element={<Vas company={"HQ"} />} />
      <Route path={ROUTES.KTQT_SKT} element={<SoKeToan company={"HQ"} />} />
      <Route path={ROUTES.KTQT_SKTDC} element={<SKTDieuChinh />} />
      <Route path={ROUTES.KTQT_SKTR} element={<ReviewSKT />} />
      <Route path={ROUTES.KTQT_DT} element={<KTQTImport type={'DT'} />} />
      <Route path={ROUTES.KTQT_GV} element={<KTQTImport type={'GV'} />} />
      <Route path={ROUTES.KTQT_CF} element={<SoKeToan company={"HQ"} call={true} type={'CF'} />} />
      <Route path={ROUTES.KTQT_MAPPING} element={<KTQTMapping />} />
      <Route path={ROUTES.KTQT_DATA_CRM} element={<DataCRM company={"HQ"} />} />
      <Route path={ROUTES.KTQT_LEAD_MANAGEMENT} element={<LeadManagement company={"HQ"} />} />
      <Route path={ROUTES.KEHOACH_KQKD} element={<Plan2 company={"HQ"} />} />
      <Route path={ROUTES.SOSANH_KH_TH} element={<PlanActual2 company={"HQ"} />} />
      <Route path={ROUTES.SOSANH_TH_CUNGKY} element={<PlanActualCungKy company={"HQ"} />} />
      <Route path={ROUTES.KTQT_BCTONGQUAT} element={<BaoCaoTongQuat />} />
      <Route path={ROUTES.KTQT_BCKQKD_DV} element={<BaoCaoUnit />} />
      <Route path={ROUTES.KTQT_BCKQKD_DV2} element={<BaoCaoUnitMonth />} />
      <Route path={ROUTES.KTQT_BCKQKD_NHOM_DV} element={<BaoCaoGroupUnit />} />
      <Route path={ROUTES.KTQT_BCKQKD_NHOM_SP} element={<BaoCaoPBNhomSP />} />
      <Route path={ROUTES.KTQT_BCKQKD_NHOM_DV_THANG} element={<BaoCaoGroupMonth />} />
      <Route path={ROUTES.KTQT_BCKQKD_NHOM_SP_THANG} element={<BaoCaoPBNhomSP2 />} />
      <Route path={ROUTES.KTQT_BCHSTC} element={<HSFS />} />
      <Route path={ROUTES.KTQT_BCCDTC} element={<BaoCaoCDTC />} />
      <Route path={ROUTES.KTQT_BCKQKD_TEAM} element={<BaoCaoPBT />} />
      <Route path={ROUTES.KTQT_BCTIEN} element={<BaoCaoThuChi />} />
      <Route path={ROUTES.KTQT_BCKQKD_NHOM_KENH} element={<BaoCaoNhomKenh />} />
      <Route path={ROUTES.KTQT_BCKQKD_NHOM_KENH2} element={<BaoCaoPBNhomKenh2 />} />
      <Route path={ROUTES.KTQT_BCKQKD_NHOM_VU_VIEC} element={<BCNhomVV />} />
      <Route path={ROUTES.KTQT_BCKQKD_NHOM_VU_VIEC2} element={<BaoCaoPBNhomVV2 />} />
      <Route path={ROUTES.KTQT_DANH_MUC} element={<DMKM company={"HQ"} />} />
      <Route path={ROUTES.KTQT_SO_PHAN_BO_SP} element={<PhanBoSanPham company={"HQ"} />} />
      <Route path={ROUTES.KTQT_SO_PHAN_BO_DON_VI} element={<PhanBoDonVi company={"HQ"} />} />
      <Route path={ROUTES.KTQT_SO_PHAN_BO_KENH} element={<PhanBoKenh company={"HQ"} />} />
      <Route path={ROUTES.KTQT_SO_PHAN_BO_VU_VIEC} element={<PhanBoVuViec company={"HQ"} />} />
      <Route path={ROUTES.KTQT_THE_PHAN_BO_DON_VI} element={<CoChePhanBoDV company={"HQ"} />} />
      <Route path={ROUTES.KTQT_THE_PHAN_BO_PROJECT} element={<CoChePhanBoProject company={"HQ"} />} />
      <Route path={ROUTES.KTQT_THE_PHAN_BO_SAN_PHAM} element={<CoChePhanBoSP company={"HQ"} />} />
      <Route path={ROUTES.KTQT_THE_PHAN_BO_KENH} element={<CoChePhanBoKenh company={"HQ"} />} />
      {listCompany.map((company) => (
        <Fragment key={company?.code}>
          <Route path={"so-ke-toan-" + company?.code} element={<SoKeToan company={company?.code} />} />
          <Route path={"can-doi-phat-sinh-" + company?.code} element={<Vas company={company?.code} />} />
          <Route path={"danh-muc-chung-" + company?.code} element={<DMKM company={company?.code} />} />
        </Fragment>
      ))}

    </Route>
  </Route>
)
