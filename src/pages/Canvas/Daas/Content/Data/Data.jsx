import React from "react";
import css from "../Content.module.css";
// COMPONENT
import BaoCaoTongQuat_CANVAS from "../../../../KeToanQuanTri/BaoCao/BaoCaoTongQuat_CANVAS.jsx";
import BaoCaoGroupUnit_CANVAS from "../../../../KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoGroupUnit_CANVAS.jsx";
import BaoCaoGroupMonth_CANVAS from "../../../../KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoGroupMonth_CANVAS.jsx";
import BaoCaoPBNhomSP_CANVAS from "../../../../KeToanQuanTri/BaoCao/KQKD/SP/BaoCaoPBNhomSP_CANVAS.jsx";
import BaoCaoPBNhomSP2_CANVAS from "../../../../KeToanQuanTri/BaoCao/KQKD/SP/BaoCaoPBNhomSP2_CANVAS.jsx";
import HSFS_CANVAS from "../../../../KeToanQuanTri/BaoCao/HSFS_CANVAS.jsx";
import BaoCaoCDTC_CANVAS from "../../../../KeToanQuanTri/BaoCao/CDTC/BaoCaoCDTC_CANVAS.jsx";
import BaoCaoPBT from "../../../../KeToanQuanTri/BaoCao/KQKD/Team/BaoCaoPBT.jsx";
import BaoCaoThuChi_CANVAS from "../../../../KeToanQuanTri/BaoCao/ThuChi/BaoCaoThuchi_CANVAS.jsx";
import CongNoPhaiThu from "../CongNoPhaiThu/CongNoPhaiThu.jsx";
import CongNoPhaiTra from "../CongNoPhaiTra/CongNoPhaiTra.jsx";
// COMPONENT CHART
import ChartNhomDVDoanhThu from "../../Charts/ChartNhomDV/ChartNhomDVDoanhThu.jsx";
import ChartNhomDVLoiNhuan from "../../Charts/ChartNhomDV/ChartNhomDVLoiNhuan.jsx";
import ChartNhomDVLaiLo from "../../Charts/ChartNhomDV/ChartNhomDVLaiLo.jsx";
import ChartNhomDVDongGop from "../../Charts/ChartNhomDV/ChartNhomDVDongGop.jsx";
import ChartNhomDVLaiNhom from "../../Charts/ChartNhomDV/ChartNhomDVLaiNhom.jsx";

import ChartNhomSPDoanhThu from "../../Charts/ChartNhomSP/ChartNhomSPDoanhThu.jsx";
import ChartNhomSPLoiNhuan from "../../Charts/ChartNhomSP/ChartNhomSPLoiNhuan.jsx";
import ChartNhomSPLaiLo from "../../Charts/ChartNhomSP/ChartNhomSPLaiLo.jsx";
import ChartNhomSPDongGop from "../../Charts/ChartNhomSP/ChartNhomSPDongGop.jsx";
import ChartNhomSPLaiNhom from "../../Charts/ChartNhomSP/ChartNhomSPLaiNhom.jsx";

import ChartNhomVVDoanhThu from "../../Charts/ChartVV/ChartNhomVVDoanhThu.jsx";
import ChartNhomVVLoiNhuan from "../../Charts/ChartVV/ChartNhomVVLoiNhuan.jsx";
import ChartNhomVVLaiLo from "../../Charts/ChartVV/ChartNhomVVLaiLo.jsx";
import ChartNhomVVDongGop from "../../Charts/ChartVV/ChartNhomVVDongGop.jsx";
import ChartNhomVVLaiNhom from "../../Charts/ChartVV/ChartNhomVVLaiNhom.jsx";

import ChartNhomKenhDoanhThu from "../../Charts/ChartNhomKenh/ChartNhomKenhDoanhThu.jsx";
import ChartNhomKenhLoiNhuan from "../../Charts/ChartNhomKenh/ChartNhomKenhLoiNhuan.jsx";
import ChartNhomKenhLaiLo from "../../Charts/ChartNhomKenh/ChartNhomKenhLaiLo.jsx";
import ChartNhomKenhDongGop from "../../Charts/ChartNhomKenh/ChartNhomKenhDongGop.jsx";
import ChartNhomKenhLaiNhom from "../../Charts/ChartNhomKenh/ChartNhomKenhLaiNhom.jsx";

import ChartChiPhiLuyKe from "../../Charts/ChiPhiLuyKe/ChiPhiLuyKe.jsx";
import ChartDoanhThu_TH_KH_CK from "../../Charts/Chart_TH_KH_CK/Chart_DoanhThu_TH_KH_CK.jsx";
import ChartCF_TH_KH_CK from "../../Charts/Chart_TH_KH_CK/Chart_CF_TH_KH_CK.jsx";
import ChartLN_TH_KH_CK from "../../Charts/Chart_TH_KH_CK/Chart_LN_TH_KH_CK.jsx";
import BaoCaoNhomKenh_CANVAS from "../../../../KeToanQuanTri/BaoCao/KQKD/Kenh/BaoCaoNhomKenh_CANVAS.jsx";
import BaoCaoPBNhomKenh2_CANVAS from "../../../../KeToanQuanTri/BaoCao/KQKD/Kenh/BaoCaoPBNhomKenh2_CANVAS.jsx";
import BCNhomVV_CANVAS from "../../../../KeToanQuanTri/BaoCao/KQKD/VV/BCNhomVV_CANVAS.jsx";
import BaoCaoPBNhomVV2_CANVAS from "../../../../KeToanQuanTri/BaoCao/KQKD/VV/BaoCaoPBNhomVV2_CANVAS.jsx";

import ChartTuoiNoPhaiTra from "../../Charts/ThongKeTuoiNo/PhaiTra.jsx";
import ChartTuoiNoPhaiThu from "../../Charts/ThongKeTuoiNo/PhaiThu.jsx";

import ChartCanDoiTaiChinh from "../../Charts/CanDoiTaiChinh/CanDoiTaiChinh.jsx";
import ChartTonKho from "../../Charts/TonKho/ChartTonKho.jsx";
import ChartTuongDuongTien from "../../Charts/TuongDuongTien/ChartTuongDuongTien.jsx";

import ChartDoanhThuKeHoach from "../../Charts/ChartSoSanhKeHoach/ChartDoanhThuKeHoach.jsx";
import ChartLoiNhuanKeHoach from "../../Charts/ChartSoSanhKeHoach/ChartLoiNhuanKeHoach.jsx";

import ChartCRMThongKe from "../../Charts/ChartCRMThongKe/ChartCRMThongKe.jsx";
import ChartMatrixThongKe from "../../Charts/ChartCRMThongKe/ChartMatrixThongKe.jsx";

import Product from "../../../../KeToanQuanTri/DanhMuc/Product.jsx";
import Kmf from "../../../../KeToanQuanTri/DanhMuc/Kmf.jsx";
import Kmns from "../../../../KeToanQuanTri/DanhMuc/Kmns.jsx";
import Project from "../../../../KeToanQuanTri/DanhMuc/Project.jsx";
import Kenh from "../../../../KeToanQuanTri/DanhMuc/Kenh.jsx";
import Unit from "../../../../KeToanQuanTri/DanhMuc/Unit.jsx";
import Vas from "../../../../KeToanQuanTri/DanhMuc/Vas.jsx";
import DMNhanVien from "../../../../Home/AgridTable/DanhMuc/DMNhanVien.jsx";
import DMNhaCungCap from "../../../../Home/AgridTable/DanhMuc/DMNhaCungCap.jsx";
import DMSanPham from "../../../../Home/AgridTable/DanhMuc/DMSanPham.jsx";
import DMKhachHang from "../../../../Home/AgridTable/DanhMuc/DMKhachHang.jsx";
import CDPS from "../../../../Home/AgridTable/SoLieu/CDPS/CDPS.jsx";
import Warehouse from "../../../../Home/AgridTable/SoLieu/TonKho/components/Warehouse.jsx";
import PlanActual2_CANVAS from "../../../../KeToanQuanTri/BaoCao/Plan2/PlanActual2_CANVAS.jsx";
import {SoLieuHienThi} from "../../../../SoLieuHienThi/SoLieuHienThi.jsx";
import DMKM from "../../../../KeToanQuanTri/DanhMuc/DMKM.jsx";
import DataCRM from "../../../../KeToanQuanTri/VanHanh/DataCRM.jsx";
import LeadManagement from "../../../../KeToanQuanTri/VanHanh/LeadManagement.jsx";
import TienThuTrongKy from "../../Charts/TienThuTrongKy/TienThuTrongKy.jsx";
import NhapXuatTon2 from "../../../../Home/AgridTable/SoLieu/TonKho/components/NhapXuatTon2.jsx";
import DMSoQuanLyChiTraTruoc2 from "../../../../Home/AgridTable/DanhMuc/DanhMucSoQuanLyChiTraTruoc2.jsx";
import DMSoQuanLyTaiSan2 from "../../../../Home/AgridTable/DanhMuc/DanhMucSoQuanLyTaiSan2.jsx";
import BCTonKho2 from "../../../BaoCao/BCTonKho2.jsx";
import BCTien2 from "../../../BaoCao/BCTien2.jsx";
import BCThueBaoHiem2 from "../../../BaoCao/BCThueBaoHiem2.jsx";
import BaoCaoUnit_CANVAS from "../../../../KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoUnit_CANVAS.jsx";

const Data = ({ fileNotePad, fetchData }) => {
  return (
    <div className={css.mainContent}>
      <div style={{ width: "100%" , height : '100%' }}>
        {(() => {
          switch (fileNotePad.type) {
            case "S101":
              return <DataCRM company={"HQ"} />;
            case "S102":
              return <LeadManagement company={"HQ"} />;

            case "TONGQUAT":
              return <BaoCaoTongQuat_CANVAS />;
              case "KQKD_DV":
                  return <BaoCaoUnit_CANVAS />;
            case "KQKD_NHOMDV":
              return <BaoCaoGroupUnit_CANVAS />;
            case "KQKD_NHOMDV2":
              return <BaoCaoGroupMonth_CANVAS />;
            case "KQKD_NHOMSP":
              return <BaoCaoPBNhomSP_CANVAS />;
            case "KQKD_NHOMSP2":
              return <BaoCaoPBNhomSP2_CANVAS />;

            case "KQKD_NHOMVV":
              return <BCNhomVV_CANVAS />;
            case "KQKD_NHOMVV2":
              return <BaoCaoPBNhomVV2_CANVAS />;

            case "KQKD_NHOMK":
              return <BaoCaoNhomKenh_CANVAS />;
            case "KQKD_NHOMK2":
              return <BaoCaoPBNhomKenh2_CANVAS />;

            case "HESO_TAICHINH":
              return <HSFS_CANVAS />;
            case "CANDOI_TAICHINH":
              return <BaoCaoCDTC_CANVAS />;
            case "KQKD_Team":
              return <BaoCaoPBT />;
            case "DONGTIEN":
              return <BaoCaoThuChi_CANVAS />;

            case "CONGNOPHAITHU":
              return <CongNoPhaiThu />;
            case "CONGNOPHAITRA":
              return <CongNoPhaiTra />;

            case "NHOMDV_DOANHTHU_CHART":
              return <ChartNhomDVDoanhThu />;
            case "NHOMDV_LOINHUAN_CHART":
              return <ChartNhomDVLoiNhuan />;
            case "NHOMDV_DONGGOP_CHART":
              return <ChartNhomDVDongGop />;
            case "NHOMDV_LAILO_CHART":
              return <ChartNhomDVLaiLo />;
            case "NHOMDV_LAINHOM_CHART":
              return <ChartNhomDVLaiNhom />;

            case "NHOMSP_DOANHTHU_CHART":
              return <ChartNhomSPDoanhThu />;
            case "NHOMSP_LOINHUAN_CHART":
              return <ChartNhomSPLoiNhuan />;
            case "NHOMSP_DONGGOP_CHART":
              return <ChartNhomSPDongGop />;
            case "NHOMSP_LAILO_CHART":
              return <ChartNhomSPLaiLo />;
            case "NHOMSP_LAINHOM_CHART":
              return <ChartNhomSPLaiNhom />;

            case "NHOMVV_DOANHTHU_CHART":
              return <ChartNhomVVDoanhThu />;
            case "NHOMVV_LOINHUAN_CHART":
              return <ChartNhomVVLoiNhuan />;
            case "NHOMVV_LAILO_CHART":
              return <ChartNhomVVLaiLo />;
            case "NHOMVV_DONGGOP_CHART":
              return <ChartNhomVVDongGop />;
            case "NHOMVV_LAINHOM_CHART":
              return <ChartNhomVVLaiNhom />;

            case "NHOMK_DOANHTHU_CHART":
              return <ChartNhomKenhDoanhThu />;
            case "NHOMK_LAILO_CHART":
              return <ChartNhomKenhLaiLo />;
            case "NHOMK_DONGGOP_CHART":
              return <ChartNhomKenhDongGop />;
            case "NHOMK_LAINHOM_CHART":
              return <ChartNhomKenhLaiNhom />;
            case "NHOMK_LOINHUAN_CHART":
              return <ChartNhomKenhLoiNhuan />;

            case "CHIPHILUYKE_CHART":
              return <ChartChiPhiLuyKe />;
            case "CHART_DOANHTHU_TH_KH_CK":
              return <ChartDoanhThu_TH_KH_CK />;
            case "CHART_CF_TH_KH_CK":
              return <ChartCF_TH_KH_CK />;
            case "CHART_LN_TH_KH_CK":
              return <ChartLN_TH_KH_CK />;

            case "TUOINO_PHAITRA_CHART":
              return <ChartTuoiNoPhaiTra />;
            case "TUOINO_PHAITHU_CHART":
              return <ChartTuoiNoPhaiThu />;

            case "BAOCAO_TIEN":
              return <BCTien2 />;
            case "BAOCAO_THUE_BAOHIEM":
              return <BCThueBaoHiem2 />;
            case "BAOCAO_TONKHO":
              return <BCTonKho2 />;
            case "BAOCAO_TAISANCODINH":
              return <DMSoQuanLyTaiSan2 />;
            case "BAOCAO_QUANLYCHITRATRUOC":
              return <DMSoQuanLyChiTraTruoc2 />;
            case "BAOCAO_CANDOIPHATSINH":
              return <CDPS />;
            case "TON_KHO":
              return <Warehouse />;
            case "NHAP_XUAT_TON":
              return <NhapXuatTon2 />;
            case "PLAN_ACTUAL":
              return <PlanActual2_CANVAS />;
            case "SOLIEUHIENTHI":
              return <SoLieuHienThi />;
            case "DANHMUCCHUNG":
              return <DMKM company={"HQ"} />;

            case "CHART_TIEN_VA_TUONGDUONGTIEN":
              return <ChartTuongDuongTien />;
            case "CHART_TONKHO":
              return <ChartTonKho />;
            case "CHART_CANDOITAICHINH":
              return <ChartCanDoiTaiChinh />;
            case "CHART_TIENTHUTRONGKY":
              return <TienThuTrongKy />;

            case "CHART_CRM_THONGKE":
              return <ChartCRMThongKe />;
            case "CHART_MATRIX_THONGKE":
              return <ChartMatrixThongKe />;

            case "CHART_DOANHTHU_KEHOACH":
              return <ChartDoanhThuKeHoach />;
            case "CHART_LOINHUAN_KEHOACH":
              return <ChartLoiNhuanKeHoach />;

            case "DANHMUC_SP_KTQT":
              return <Product company={"HQ"} />;
            case "DANHMUC_KM_KQKD":
              return <Kmf company={"HQ"} />;
            case "DANHMUC_THU_CHI":
              return <Kmns company={"HQ"} />;
            case "DANHMUC_VU_VIEC":
              return <Project company={"HQ"} />;
            case "DANHMUC_KENH":
              return <Kenh company={"HQ"} />;
            case "DANHMUC_DONVI":
              return <Unit company={"HQ"} />;
            case "DANHMUC_CDPS":
              return <Vas company={"HQ"} />;
            case "DANHMUC_NV":
              return <DMNhanVien />;
            case "DANHMUC_NCC":
              return <DMNhaCungCap />;
            case "DANHMUC_HH":
              return <DMSanPham />;
            case "DANHMUC_KH":
              return <DMKhachHang />;
            default:
              return (
                <div className={css.layoutElementComponent}>
                  <span>Component {fileNotePad.type}</span>
                </div>
              );
          }
        })()}
      </div>
    </div>
  );
};

export default Data;
