import { Spin } from 'antd';
import { Fragment, lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import AuthRoute from '../AuthRoute';
import { ROUTES } from '../CONST';
import AdminApp from '../pages/AdminApp';
import AnalysisReview from '../pages/AnalysisReview/AnalysisReview.jsx';
import BusinessMeasurementTab from '../pages/AnalysisReview/components/tabs/BusinessMeasurementTab.jsx';
import DataDetail from '../pages/AnalysisReview/components/tabs/DataDetail.jsx';
import DataTab from '../pages/AnalysisReview/components/tabs/DataTab.jsx';
import MeasurementTab from '../pages/AnalysisReview/components/tabs/MeasurementTab.jsx';
import ReportBuilderNonPD from '../pages/AnalysisReview/components/tabs/ReportBuilderNonPD.jsx';
import ReportDetail from '../pages/AnalysisReview/components/tabs/ReportDetail.jsx';
import ReportsTab from '../pages/AnalysisReview/components/tabs/ReportsTab.jsx';
import StatisticsTab from '../pages/AnalysisReview/components/tabs/StatisticsTab.jsx';
import TableAnalysisTab from '../pages/AnalysisReview/components/tabs/TableAnalysisTab.jsx';
import TableReportTab from '../pages/AnalysisReview/components/tabs/TableReportTab.jsx';
import K9 from '../pages/BusinessWikibook/K9.jsx';
import CRM from '../pages/CRM/CRM.jsx';
import Detail from '../pages/CRM/components/Detail/Detail.jsx';
import DefaultView from '../pages/CRM/components/DefaultView/DefaultView.jsx';
import DataManager from '../pages/DataManager/DataManager.jsx';
import DataRubikProcessGuide from '../pages/DataRubikProcessGuide/DataRubikProcessGuide.jsx';
import DiagramFactoryDetail from '../pages/DiagramFactory/DiagramFactoryDetail.jsx';
import DiagramFactoryLayout from '../pages/DiagramFactory/DiagramFactoryLayout.jsx';
import DiagramFactoryList from '../pages/DiagramFactory/DiagramFactoryList.jsx';
import ExcelData from '../pages/ExcelData.jsx';
import ForecastingApp from '../pages/ForecastingApp/ForecastingApp.jsx';
import Homepage from '../pages/Homepage/Homepage.jsx';
import K9Service from '../pages/K9/K9Service.jsx';
import InstallPopup from '../pages/KeToanQuanTri/VanHanh/CaiDatSuDung/InstallPopup.jsx';
import MetricMap from '../pages/MetricMap/MetricMap.jsx';
import ProposalMaker from '../pages/ProposalMaker/ProposalMaker.jsx';
import SocialDataScraperApp from '../pages/SocialDataScraperApp.jsx';
import CustomerSurveyApp from '../pages/SurveyApp/CustomerSurveyApp.jsx';
import XApp from '../pages/XApp/XApp.jsx';
import AuthRoutesAdmin from './AuthRoutesAdmin.jsx';
import AuthRoutesUser from './AuthRoutesUser.jsx';
import HomeDass from '../pages/Canvas/Daas/Home.jsx';
import ContentCongCu from '../pages/Canvas/Daas/CongCu/ContentCongCu.jsx';
import ContentKHKD from '../pages/Canvas/Daas/contentKHKD/ContentKHKD.jsx';
import SimpleToolList from '../pages/Canvas/Daas/CongCu/SimpleToolList.jsx';
import KHKDLayout from '../pages/Canvas/Daas/CongCu/KHKDLayout.jsx';
import KHKD from '../pages/KHKD/KHKD.jsx';

const DiagramFactoryContent = lazy(() => import('../pages/DiagramFactory/DiagramFactoryContent.jsx'));

const ReviewSAB = lazy(() => import('../pages/KeToanQuanTri/Review/ReviewSAB.jsx'));
const BaoCaoUnit = lazy(() => import('../pages/KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoUnit.jsx'));
const BaoCaoUnitMonth = lazy(() => import('../pages/KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoUnitMonth.jsx'));
const HoaDonDauRaChiTiet = lazy(() => import('../pages/Home/AgridTable/HoaDon/QuanLyHoaDonDauRa/HoaDonDauRaChiTiet.jsx'));
const HoaDonDauVaoChiTiet = lazy(() => import('../pages/Home/AgridTable/HoaDon/QuanLyHoaDonDauVao/HoaDonDauVaoChiTiet.jsx')); const KTQTImport = lazy(() => import('../pages/KeToanQuanTri/VanHanh/KTQTImport.jsx'));
const KTQTMapping = lazy(() => import('../pages/KeToanQuanTri/VanHanh/KTQTMapping.jsx'));
const Home = lazy(() => import('../pages/Home/Home.jsx'));
const AiAcademicAssistant = lazy(() => import('../pages/AiAcademicAssistant/AiAcademicAssistant.jsx'));
const ChainDetail = lazy(() =>
	import('../pages/Home/Chain/ChainDetail/ChainDetail.jsx'),
);
const ChainDetailNew = lazy(() =>
	import('../pages/Home/Chain/ChainDetail/ChainDetailNew.jsx'),
);
const CardDetailNew = lazy(() =>
	import('../pages/Home/Card/CardDetail/CardDetailNew.jsx'),
);
const CardDetail = lazy(() =>
	import('../pages/Home/Card/CardDetail/CardDetail.jsx'),
);
const StepDetail = lazy(() => import('../pages/Home/Step/StepDetail/StepDetail.jsx'));
const TemplateContainer = lazy(() =>
	import('../pages/Home/Template/TemplateContainer/TemplateContainer.jsx'),
);
const TemplateDetail = lazy(() =>
	import('../pages/Home/Template/TemplateDetail/TemplateDetail.jsx'),
);
const TemplateStepDetail = lazy(() =>
	import('../pages/Home/Template/TemplateStepDetail/TemplateStepDetail.jsx'),
);
const DanhMuc = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DanhMuc.jsx'));
const DMKhachHang = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMKhachHang.jsx'));
const DMNhaCungCap = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMNhaCungCap.jsx'));
const DMNhanVien = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMNhanVien.jsx'));
const WikiStorage = lazy(() => import('../pages/Home/WikiStorage/WikiStorage.jsx'));
const LoginSuccess = lazy(() => import('../pages/LoginSuccess/LoginSuccess.jsx'));
const DMKmf = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMKmf.jsx'));
const DMKmtc = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMKmtc.jsx'));
const DMSanPham = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMSanPham.jsx'));
const DMDuAn = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMDuAn.jsx'));
const DMHopDong = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMHopDong.jsx'));
const DMKho = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMKho.jsx'));
const DMTkNganHang = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMTkNganHang.jsx'));
const DMTkKeToan = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMTkKeToan.jsx'));
const DMCompany = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMCompany.jsx'));
const DMSoKeToan = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMSoKeToan.jsx'));
const DMSoChuoi = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMSoChuoi.jsx'));
const DMSoQuanLyChiTraTruoc = lazy(() =>
	import('../pages/Home/AgridTable/DanhMuc/DanhMucSoQuanLyChiTraTruoc.jsx'),
);
const DMSoQuanLyTaiSan = lazy(() =>
	import('../pages/Home/AgridTable/DanhMuc/DanhMucSoQuanLyTaiSan.jsx'),
);
const DMPhongBan = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMPhongBan.jsx'));
const PhieuNhap = lazy(() => import('../pages/Home/AgridTable/DanhMuc/PhieuNhap.jsx'));
const CDPS = lazy(() => import('../pages/Home/AgridTable/SoLieu/CDPS/CDPS.jsx'));
const PhieuXuat = lazy(() => import('../pages/Home/AgridTable/DanhMuc/PhieuXuat.jsx'));
const SoLieu = lazy(() => import('../pages/Home/AgridTable/SoLieu/SoLieu.jsx'));
const DMSoKeToanT = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMSoKeToanT.jsx'));
const TonKho = lazy(() => import('../pages/Home/AgridTable/SoLieu/TonKho/TonKho.jsx'));
const Luong = lazy(() => import('../pages/Home/AgridTable/Luong/Luong.jsx'));
const DauKy = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DauKy.jsx'));
const SoTaiKhoan = lazy(() => import('../pages/Home/AgridTable/SoLieu/SoTaiKhoan/SoTaiKhoan.jsx'));
const HoaDon = lazy(() => import('../pages/Home/AgridTable/HoaDon/HoaDon.jsx'));
const QuanLyHoaDonDauRa = lazy(() =>
	import('../pages/Home/AgridTable/HoaDon/QuanLyHoaDonDauRa/QuanLyHoaDonDauRa.jsx'),
);
const SoTaiKhoanDT = lazy(() =>
	import('../pages/Home/AgridTable/SoLieu/SoTaiKhoanDT/SoTaiKhoanDT.jsx'),
);
const QuanLyHoaDonDauVao = lazy(() =>
	import('../pages/Home/AgridTable/HoaDon/QuanLyHoaDonDauVao/QuanLyHoaDonDauVao.jsx'),
);
const BangThongKeTuoiNo = lazy(() =>
	import('../pages/Home/AgridTable/HoaDon/BangThongKeTuoiNo/BangThongKeTuoiNo.jsx'),
);
const SoTaiKhoanDD = lazy(() =>
	import('../pages/Home/AgridTable/SoLieu/SoTaiKhoanDT/SoTaiKhoanDD.jsx'),
);
const DMBU = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMBU.jsx'));
const DMChuongTrinh = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMChuongTrinh.jsx'));
const DMChuSoHuu = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMChuSoHuu.jsx'));
const DMTaiSanDauTu = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMTaiSanDauTu.jsx'));
const DMLoaiTien = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMLoaiTien.jsx'));
const BaoCao = lazy(() => import('../pages/Home/AgridTable/BaoCao/BaoCao.jsx'));
const B01 = lazy(() => import('../pages/Home/AgridTable/BaoCao/B01/B01.jsx'));
const SoOffset = lazy(() => import('../pages/Home/AgridTable/SoLieu/SoTaiKhoanDT/SoOffset.jsx'));
const LenhSanXuat = lazy(() => import('../pages/Home/AgridTable/DanhMuc/LenhSanXuat.jsx'));
const DetailLenhSanXuat = lazy(() =>
	import('../pages/Home/AgridTable/DanhMuc/DetailLenhSanXuat.jsx'),
);
const CoChePhanBoVuViec = lazy(() =>
	import('../pages/Home/AgridTable/CCPB/ThePhanBo/CoChePhanBoVuViec.jsx'),
);
const SoPreOffset = lazy(() =>
	import('../pages/Home/AgridTable/SoLieu/SoTaiKhoanDT/SoPreOffset.jsx'),
);
const CoChePhanBoLenhSX = lazy(() =>
	import('../pages/Home/AgridTable/CCPB/ThePhanBo/CoChePhanBoLenhSX.jsx'),
);
const GV2B = lazy(() => import('../pages/Home/AgridTable/GiaVon/GV2B.jsx'));
const GV3W = lazy(() => import('../pages/Home/AgridTable/GiaVon/GV3W.jsx'));
const GV3M = lazy(() => import('../pages/Home/AgridTable/GiaVon/GV3M.jsx'));
const GV3MB2 = lazy(() => import('../pages/Home/AgridTable/GiaVon/GV3MB2.jsx'));
const GTHoanThanh = lazy(() => import('../pages/Home/AgridTable/GiaVon/GTHoanThanh.jsx'));
const B03 = lazy(() => import('../pages/Home/AgridTable/BaoCao/B03/B03.jsx'));
const PBGV2B = lazy(() => import('../pages/Home/AgridTable/GiaVon/PBGV2B.jsx'));
const SanXuat = lazy(() => import('../pages/Home/AgridTable/SanXuat/SanXuat.jsx'));
const DinhMucBom = lazy(() => import('../pages/Home/AgridTable/SanXuat/DinhMucBom/DinhMucBom.jsx'));
const DinhMucLenhSanXuat = lazy(() =>
	import('../pages/Home/AgridTable/SanXuat/LenhSanXuat/LenhSanXuat.jsx'),
);
const PBGV3 = lazy(() => import('../pages/Home/AgridTable/GiaVon/PBGV3.jsx'));
const PBLSX = lazy(() => import('../pages/Home/AgridTable/GiaVon/PBLSX.jsx'));
const B02 = lazy(() => import('../pages/Home/AgridTable/BaoCao/B02/B02.jsx'));
const KeToanQuanTri = lazy(() =>
	import('../pages/KeToanQuanTri/KeToanQuanTriComponent/KeToanQuanTri.jsx'),
);
const Vas = lazy(() => import('../pages/KeToanQuanTri/DanhMuc/Vas.jsx'));
const SoKeToan = lazy(() => import('../pages/KeToanQuanTri/VanHanh/SoKeToan.jsx'));
const DMKM = lazy(() => import('../pages/KeToanQuanTri/DanhMuc/DMKM.jsx'));
const ProjectManager = lazy(() => import('../pages/ProjectManager/ProjectManager.jsx'));
const PhanBoSanPham = lazy(() =>
	import('../pages/KeToanQuanTri/VanHanh/SoPhanBo/PhanBoSanPham.jsx'),
);
const PhanBoDonVi = lazy(() => import('../pages/KeToanQuanTri/VanHanh/SoPhanBo/PhanBoDonVi.jsx'));
const PhieuThu = lazy(() => import('../pages/Home/AgridTable/SoLieu/PhieuThuChi/PhieuThu.jsx'));
const PhieuChi = lazy(() => import('../pages/Home/AgridTable/SoLieu/PhieuThuChi/PhieuChi.jsx'));
const CoChePhanBoDV = lazy(() =>
	import('../pages/KeToanQuanTri/VanHanh/ThePhanBo/CoChePhanBoDV.jsx'),
);
const CoChePhanBoSP = lazy(() =>
	import('../pages/KeToanQuanTri/VanHanh/ThePhanBo/CoChePhanBoSP.jsx'),
);
const PhieuNhapXuat = lazy(() => import('../pages/Home/AgridTable/DanhMuc/PhieuNhapXuat.jsx'));
const DKProData = lazy(() =>
	import('../pages/Home/AgridTable/SoLieu/DinhKhoanTongHop/DKProData.jsx'),
);
const CoChePhanBoKenh = lazy(() =>
	import('../pages/KeToanQuanTri/VanHanh/ThePhanBo/CoChePhanBoKenh.jsx'),
);
const PhanBoKenh = lazy(() => import('../pages/KeToanQuanTri/VanHanh/SoPhanBo/PhanBoKenh.jsx'));
const BCTien = lazy(() => import('../pages/Canvas/BaoCao/BCTien.jsx'));
const BCTonKho = lazy(() => import('../pages/Canvas/BaoCao/BCTonKho.jsx'));
const BCThueBaoHiem = lazy(() => import('../pages/Canvas/BaoCao/BCThueBaoHiem.jsx'));
const DataCRM = lazy(() => import('../pages/KeToanQuanTri/VanHanh/DataCRM.jsx'));
const PhanBoVuViec = lazy(() => import('../pages/KeToanQuanTri/VanHanh/SoPhanBo/PhanBoVuViec.jsx'));
const CoChePhanBoProject = lazy(() =>
	import('../pages/KeToanQuanTri/VanHanh/ThePhanBo/CoChePhanBoProject.jsx'),
);
const BaoCaoTongQuat = lazy(() => import('../pages/KeToanQuanTri/BaoCao/BaoCaoTongQuat.jsx'));
const BaoCaoGroupUnit = lazy(() =>
	import('../pages/KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoGroupUnit.jsx'),
);
const BaoCaoPBNhomSP = lazy(() =>
	import('../pages/KeToanQuanTri/BaoCao/KQKD/SP/BaoCaoPBNhomSP.jsx'),
);
const BaoCaoGroupMonth = lazy(() =>
	import('../pages/KeToanQuanTri/BaoCao/KQKD/DV/BaoCaoGroupMonth.jsx'),
);
const BaoCaoPBNhomSP2 = lazy(() =>
	import('../pages/KeToanQuanTri/BaoCao/KQKD/SP/BaoCaoPBNhomSP2.jsx'),
);
const HSFS = lazy(() => import('../pages/KeToanQuanTri/BaoCao/HSFS.jsx'));
const BaoCaoCDTC = lazy(() => import('../pages/KeToanQuanTri/BaoCao/CDTC/BaoCaoCDTC.jsx'));
const BaoCaoPBT = lazy(() => import('../pages/KeToanQuanTri/BaoCao/KQKD/Team/BaoCaoPBT.jsx'));
const BaoCaoThuChi = lazy(() => import('../pages/KeToanQuanTri/BaoCao/ThuChi/BaoCaoThuchi.jsx'));
const Plan2 = lazy(() => import('../pages/KeToanQuanTri/BaoCao/Plan2/Plan2.jsx'));
const PlanActual2 = lazy(() => import('../pages/KeToanQuanTri/BaoCao/Plan2/PlanActual2.jsx'));
const PlanActualCungKy = lazy(() =>
	import('../pages/KeToanQuanTri/BaoCao/Plan2/PlanActualCungKy.jsx'),
);
const BaoCaoNhomKenh = lazy(() =>
	import('../pages/KeToanQuanTri/BaoCao/KQKD/Kenh/BaoCaoNhomKenh.jsx'),
);
const BCNhomVV = lazy(() => import('../pages/KeToanQuanTri/BaoCao/KQKD/VV/BCNhomVV.jsx'));
const BaoCaoPBNhomKenh2 = lazy(() =>
	import('../pages/KeToanQuanTri/BaoCao/KQKD/Kenh/BaoCaoPBNhomKenh2.jsx'),
);
const BaoCaoPBNhomVV2 = lazy(() =>
	import('../pages/KeToanQuanTri/BaoCao/KQKD/VV/BaoCaoPBNhomVV2.jsx'),
);
const LeadManagement = lazy(() => import('../pages/KeToanQuanTri/VanHanh/LeadManagement.jsx'));
const DMKenh = lazy(() => import('../pages/Home/AgridTable/DanhMuc/DMKenh.jsx'));

const SKTDieuChinh = lazy(() =>
	import('../pages/KeToanQuanTri/VanHanh/SKTDieuChinh/SKTDieuChinh.jsx'),
);
const ReviewSKT = lazy(() => import('../pages/KeToanQuanTri/Review/ReviewSKT.jsx'));
const ReviewVAS = lazy(() => import('../pages/KeToanQuanTri/Review/ReviewVAS.jsx'));
const Gateway = lazy(() => import('../components/gateway/gateway.jsx'));

const CrossRoad2 = lazy(() => import('../pages/CrossRoad/CrossRoad2.jsx'));

const QuanLyKeHoachKinhDoanh = lazy(() => import('../pages/QuanLyKeHoachKinhDoanh/QuanLyKeHoachKinhDoanh.jsx'));
const ThietLapKeHoach = lazy(() => import('../pages/QuanLyKeHoachKinhDoanh/components/ThietLapKeHoach/ThietLapKeHoach.jsx'));
const NhapLieuThucThi = lazy(() => import('../pages/QuanLyKeHoachKinhDoanh/components/NhapLieuThucThi/NhapLieuThucThi.jsx'));
const ThucHienVaKeHoach = lazy(() => import('../pages/QuanLyKeHoachKinhDoanh/components/ThucHienVaKeHoach/ThucHienVaKeHoach.jsx'));
const UocTinhLaiLo = lazy(() => import('../pages/QuanLyKeHoachKinhDoanh/components/UocTinhLaiLo/UocTinhLaiLo.jsx'));
const Geo = lazy(() => import('../pages/Geo/Geo.jsx'));
const AudioMerge = lazy(() => import('../pages/AudioMerge/AudioMerge.jsx'));
const Apify = lazy(() => import('../pages/Apify/Apify.jsx'));
const MainContentDM = lazy(() => import('../pages/DataManager/main/MainContentDM.jsx'));
const HomeManagement = lazy(() => import('../pages/BusinessWikibook/components/'));
// Thêm import cho AdminPath component
const AiFile = lazy(() => import('../pages/AIFileTool/AIFile.jsx'));
const StorageTool = lazy(() => import('../pages/StorageTool/StorageTool.jsx'));
const AIWorkAutomation = lazy(() => import('../pages/AIWorkAutomation/AIWorkAutomation.jsx'));
const WikiCanvas = lazy(() => import('../pages/WikiCanvas.jsx'));
const fallback = (
	<div
		style={{
			width: '100vw',
			height: '100vh',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			top: 0,
			left: 0,
		}}
	>
		<Spin size='large' />
	</div>
);

export const AuthRoutes = ({ listCompany, isMobile }) => (
	<Route element={<AuthRoute />}>

		<Route path={ROUTES.LOGIN_SUCCESS} element={<Suspense fallback={fallback}><LoginSuccess /></Suspense>} />

		<Route path={ROUTES.CROSS_ROAD} element={<Suspense fallback={fallback}><CrossRoad2 /></Suspense>} />

		<Route path={ROUTES.HOME_PAGE} element={<Homepage />} />
		<Route path='/cvkh' element={<KHKD />} />

		{/* Thêm route cho admin-path */}
		<Route path='/ai-file' element={<AiFile />} />
		<Route path='/ai-work-automation/c/:id' element={<Suspense fallback={fallback}><AIWorkAutomation /></Suspense>} />
		<Route path='/ai-work-automation' element={<Suspense fallback={fallback}><AIWorkAutomation /></Suspense>} />
		<Route path='/diagram-factory' element={<DiagramFactoryLayout />} >
			<Route index element={<DiagramFactoryList />} />
			<Route path=":fileId" element={<DiagramFactoryDetail />}>
				<Route path="content/:contentId" element={<DiagramFactoryContent />} />
			</Route>
		</Route>
		<Route path='/dashboard' element={<WikiCanvas />} />

		<Route path='/dashboard/:tab' element={<WikiCanvas />} />
		{/* <Route path={'/mobile-dashboard'} element={<Suspense fallback={fallback}><ViewDashboard /></Suspense>} /> */}

		<Route path={'/geo'} element={<Suspense fallback={fallback}><Geo /></Suspense>} />
		<Route path={'/audio-merge'} element={<Suspense fallback={fallback}><AudioMerge /></Suspense>} />
		<Route path={'/scrape'} element={<Suspense fallback={fallback}><SocialDataScraperApp /></Suspense>} />
		{/*<Route path={'/apify'} element={<Suspense fallback={fallback}><Apify /></Suspense>} />*/}
		<Route path={'/excelData'} element={<ExcelData />} />
		<Route path='/survey-app' element={<CustomerSurveyApp />} />
		<Route path='/survey-app/:surveyId' element={<CustomerSurveyApp />} />
		<Route path='/process-guide' element={<DataRubikProcessGuide />} />
		<Route path='/process-guide/:tabId/:processItemId?/:headingId?' element={<DataRubikProcessGuide />} />

		{/* <Route element={<AuthRoutesUser />} > */}
			<Route path='/khkd' element={<KHKDLayout />}>
				<Route path=':idKHKD' element={<ContentKHKD />} />
			</Route>
			<Route path='/crm' element={<CRM />}>
				<Route index element={<DefaultView />} />
				<Route path='detail/:id' element={<Detail />} />
			</Route>

			<Route path='/forecast/*' element={<ForecastingApp />} />
			<Route path='/proposal-maker' element={<ProposalMaker />} />
			<Route path='/metric-map' element={<MetricMap />} />

			<Route path='/data-manager' element={<DataManager />}>
				<Route path='/data-manager/data/:idFileNote' element={<MainContentDM />} />
				<Route path='/data-manager/data/:idFileNote/step/:stepId' element={<MainContentDM />} />
				<Route path='/data-manager/file/:idFileNote' element={<MainContentDM />} />
			</Route>
			<Route path='/storage-tool' element={<StorageTool />} />
			<Route path='/analysis-review' element={<AnalysisReview />}>
				<Route path='data' element={<DataTab />}>
					<Route path=':id' element={<DataDetail />} />
				</Route>
				<Route path='reports' element={<ReportsTab />}>
					<Route path=':id' element={<ReportDetail />} />
				</Route>
				<Route path='statistics' element={<StatisticsTab />} />
				<Route path='measurement' element={<MeasurementTab />} />
				<Route path='business' element={<BusinessMeasurementTab />} />
				<Route path='builder' element={<ReportBuilderNonPD />} />
				<Route path='table-analysis' element={<TableAnalysisTab />} />
				<Route path='table-report' element={<TableReportTab />} />
			</Route>

			<Route path='/data-factory' element={<Apify />}></Route>
			<Route path='/business-wikibook' element={<K9 />}>
				<Route path='home-management' element={<HomeManagement />} />
			</Route>
			<Route path='/k9' element={<K9Service />}></Route>
			<Route path='/x-app' element={<XApp />} />
			<Route path='/ai-academic-assistant' element={<AiAcademicAssistant />} />
			<Route path='/fdr' element={<KeToanQuanTri />}>
				<Route path={ROUTES.KTQT_CHAY_DU_LIEU}
					element={<Suspense fallback={fallback}> <InstallPopup /> </Suspense>} />
				<Route path={ROUTES.KTQT_DT}
					element={<Suspense fallback={fallback}> <KTQTImport type={'DT'} /> </Suspense>} />
				<Route path={ROUTES.KTQT_GV}
					element={<Suspense fallback={fallback}><KTQTImport type={'GV'} /></Suspense>} />
				<Route path={ROUTES.KTQT_CF} element={<Suspense fallback={fallback}><SoKeToan call={true} company={'HQ'}
					type={'CF'} /></Suspense>} />
				<Route path={ROUTES.KTQT_MAPPING} element={<Suspense fallback={fallback}><KTQTMapping /></Suspense>} />
				<Route
					path={ROUTES.KTQT_VAS}
					element={
						<Suspense fallback={fallback}>
							<Vas company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SKT}
					element={
						<Suspense fallback={fallback}>
							<SoKeToan company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SKTDC}
					element={
						<Suspense fallback={fallback}>
							<SKTDieuChinh />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SKTR}
					element={
						<Suspense fallback={fallback}>
							<ReviewSKT />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_VASR}
					element={
						<Suspense fallback={fallback}>
							<ReviewVAS />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_DATA_CRM}
					element={
						<Suspense fallback={fallback}>
							<DataCRM company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_LEAD_MANAGEMENT}
					element={
						<Suspense fallback={fallback}>
							<LeadManagement company={'HQ'} />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KEHOACH_KQKD}
					element={
						<Suspense fallback={fallback}>
							<Plan2 company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.SOSANH_KH_TH}
					element={
						<Suspense fallback={fallback}>
							<PlanActual2 company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.SOSANH_TH_CUNGKY}
					element={
						<Suspense fallback={fallback}>
							<PlanActualCungKy company={'HQ'} />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KTQT_BCTONGQUAT}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoTongQuat />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_DV}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoGroupUnit />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_SP}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBNhomSP />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_DV_THANG}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoGroupMonth />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_SP_THANG}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBNhomSP2 />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCHSTC}
					element={
						<Suspense fallback={fallback}>
							<HSFS />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCCDTC}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoCDTC />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_TEAM}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBT />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCTIEN}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoThuChi />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_KENH}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoNhomKenh />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_KENH2}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBNhomKenh2 />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_VU_VIEC}
					element={
						<Suspense fallback={fallback}>
							<BCNhomVV />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_VU_VIEC2}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBNhomVV2 />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KTQT_DANH_MUC}
					element={
						<Suspense fallback={fallback}>
							<DMKM company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SO_PHAN_BO_SP}
					element={
						<Suspense fallback={fallback}>
							<PhanBoSanPham company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SO_PHAN_BO_DON_VI}
					element={
						<Suspense fallback={fallback}>
							<PhanBoDonVi company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SO_PHAN_BO_KENH}
					element={
						<Suspense fallback={fallback}>
							<PhanBoKenh company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SO_PHAN_BO_VU_VIEC}
					element={
						<Suspense fallback={fallback}>
							<PhanBoVuViec company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_THE_PHAN_BO_DON_VI}
					element={
						<Suspense fallback={fallback}>
							<CoChePhanBoDV company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_THE_PHAN_BO_PROJECT}
					element={
						<Suspense fallback={fallback}>
							<CoChePhanBoProject company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_THE_PHAN_BO_SAN_PHAM}
					element={
						<Suspense fallback={fallback}>
							<CoChePhanBoSP company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_THE_PHAN_BO_KENH}
					element={
						<Suspense fallback={fallback}>
							<CoChePhanBoKenh company={'HQ'} />
						</Suspense>
					}
				/>
				<Route path={ROUTES.KTQT_BCTONGQUAT}
					element={<Suspense fallback={fallback}><BaoCaoTongQuat /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_NHOM_DV}
					element={<Suspense fallback={fallback}><BaoCaoGroupUnit /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_DV} element={<Suspense fallback={fallback}><BaoCaoUnit /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_DV2}
					element={<Suspense fallback={fallback}><BaoCaoUnitMonth /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_NHOM_SP}
					element={<Suspense fallback={fallback}><BaoCaoPBNhomSP /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_NHOM_DV_THANG}
					element={<Suspense fallback={fallback}><BaoCaoGroupMonth /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_NHOM_SP_THANG}
					element={<Suspense fallback={fallback}><BaoCaoPBNhomSP2 /></Suspense>} />
				<Route path={ROUTES.KTQT_BCHSTC} element={<Suspense fallback={fallback}><HSFS /></Suspense>} />
				<Route path={ROUTES.KTQT_BCCDTC} element={<Suspense fallback={fallback}><BaoCaoCDTC /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_TEAM}
					element={<Suspense fallback={fallback}><BaoCaoPBT /></Suspense>} />
				<Route path={ROUTES.KTQT_BCTIEN} element={<Suspense fallback={fallback}><BaoCaoThuChi /></Suspense>} />
				{listCompany.map((company) => (
					<Fragment key={company?.name}>
						<Route
							path={'so-ke-toan-' + company?.code}
							element={
								<Suspense fallback={fallback}>
									<SoKeToan company={company?.code} />
								</Suspense>
							}
						/>
						<Route
							path={'can-doi-phat-sinh-' + company?.code}
							element={
								<Suspense fallback={fallback}>
									<Vas company={company?.code} />
								</Suspense>
							}
						/>
						<Route
							path={'danh-muc-chung-' + company?.code}
							element={
								<Suspense fallback={fallback}>
									<DMKM company={company?.code} />
								</Suspense>
							}
						/>
					</Fragment>
				))}
			</Route>
		{/* </Route> */}

		{/* KHKD with sidebar layout */}

		{/* Independent tool list route */}
		<Route path='/cong-cu' element={<SimpleToolList />} />



		<Route path={ROUTES.QLKHKD} element={<Suspense fallback={fallback}><QuanLyKeHoachKinhDoanh /></Suspense>}>
			<Route path={ROUTES.QLKHKD_THIET_LAP_KE_HOACH}
				element={<Suspense fallback={fallback}><ThietLapKeHoach /></Suspense>} />
			<Route path={ROUTES.QLKHKD_NHAP_LIEU_THUC_THI}
				element={<Suspense fallback={fallback}><NhapLieuThucThi /></Suspense>} />
			<Route path={ROUTES.QLKHKD_THUC_HIEN_VA_KE_HOACH}
				element={<Suspense fallback={fallback}><ThucHienVaKeHoach /></Suspense>} />
			<Route path={ROUTES.QLKHKD_UOC_TINH_LAI_LO}
				element={<Suspense fallback={fallback}><UocTinhLaiLo /></Suspense>} />
		</Route>

		<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS} element={<Suspense fallback={fallback}><HomeDass /></Suspense>}>
			<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU}
				element={<Suspense fallback={fallback}> <ContentCongCu /></Suspense>}>
				<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU_KHKD_ID}
					element={<Suspense fallback={fallback}><ContentKHKD /></Suspense>} />
			</Route>
		</Route>


		{/* <Route
			path={ROUTES.WORK_FLOW}
			element={
				<Suspense fallback={fallback}>
					<WorkFlow />
				</Suspense>
			}
		>
			<Route
				path={ROUTES.WORK_FLOW_ID}
				element={
					<Suspense fallback={fallback}>
						<ChainDetailWorkFlow />
					</Suspense>
				}
			>
				<Route
					path={ROUTES.WORK_FLOW_CARD_DETAIL}
					element={
						<Suspense fallback={fallback}>
							<CardDetailWorkFlow />
						</Suspense>
					}
				>
					<Route
						path={ROUTES.WORK_FLOW_STEP_DETAIL}
						element={
							<Suspense fallback={fallback}>
								<StepDetail />
							</Suspense>
						}
					/>
				</Route>
			</Route>

			<Route
				path={ROUTES.WORK_FLOW_TEMPLATE_CONTAINER}
				element={
					<Suspense fallback={fallback}>
						<TemplateWorkFlowContainer />
					</Suspense>
				}
			>
				<Route
					path={ROUTES.WORK_FLOW_TEMPLATE_DETAIL}
					element={
						<Suspense fallback={fallback}>
							<TemplateWorkFlowDetail />
						</Suspense>
					}
				>
					<Route
						path={ROUTES.WORK_FLOW_TEMPLATE_STEP_DETAIL}
						element={
							<Suspense fallback={fallback}>
								<TemplateStepWorkFlowDetail />
							</Suspense>
						}
					/>
				</Route>
			</Route>
		</Route> */}


		{/* <Route path={ROUTES.CANVAS_MAIN} element={<Suspense fallback={fallback}><CanvasMain /></Suspense>}>
			<Route path={ROUTES.AI} element={<Suspense fallback={fallback}><AI /></Suspense>}></Route>
			<Route path={ROUTES.AI_EXTERNAL} element={<Suspense fallback={fallback}><ExternalAI /></Suspense>}></Route>
			<Route path={ROUTES.CANVAS_COMPANY_SELECT} element={<Suspense fallback={fallback}><Canvas /></Suspense>} />
			<Route path={ROUTES.CANVAS_BU_SELECT} element={<Suspense fallback={fallback}><Canvas /></Suspense>} />
			<Route path={ROUTES.CANVAS_TAB_SELECT_DASHBOARD} element={<Suspense fallback={fallback}><HomeReport /></Suspense>}>
				<Route path={ROUTES.CANVAS_SIDER_SELECT} element={<Suspense fallback={fallback}><CanvasContent /></Suspense>} />
			</Route>
			<Route path={ROUTES.AI_CENTER} element={<Suspense fallback={fallback}><AICenter /></Suspense>} />
			<Route path={`${ROUTES.CANVAS_BU_SELECT}/n8n`} element={<Suspense fallback={fallback}><N8N /></Suspense>} />
			<Route path={ROUTES.CANVAS_TAB_HOME} element={<Suspense fallback={fallback}><CanvasHome /></Suspense>}>
				<Route path={ROUTES.CANVAS_TAB_HOME_PHUONG_PHAP}
					   element={<Suspense fallback={fallback}><PhuongPhap /></Suspense>}>
					<Route path={ROUTES.CANVAS_TAB_HOME_PHUONG_PHAP_ID}
						   element={<Suspense fallback={fallback}><TiptapHome /></Suspense>} />
				</Route>

				<Route path={ROUTES.CANVAS_TAB_HOME_GUIDE} element={<Suspense fallback={fallback}><HDSD /></Suspense>}>
					<Route path={ROUTES.CANVAS_TAB_HOME_GUIDE_ID}
						   element={<Suspense fallback={fallback}><TiptapHome /></Suspense>} />
				</Route>

				<Route path={ROUTES.CANVAS_TAB_HOME_BO_CHI_SO}
					   element={<Suspense fallback={fallback}><BoChiSo /></Suspense>} />
			</Route>

			<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS} element={<Suspense fallback={fallback}><HomeDass /></Suspense>}>
				<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_ID}
					   element={<Suspense fallback={fallback}><Content /></Suspense>}>
					<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_ID_FILE}
						   element={<Suspense fallback={fallback}><PreviewFile /></Suspense>} />
					<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_ID_FORM}
						   element={<Suspense fallback={fallback}><Content /></Suspense>} />
				</Route>
				<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU}
					   element={<Suspense fallback={fallback}> <ContentCongCu /></Suspense>}>


					<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU_BAN_DO}
						   element={<Suspense fallback={fallback}><BanDoDuLieuQuanTri /></Suspense>} />
					<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU_FOLLOW_TINH_BIEN_SO}
						   element={<Suspense fallback={fallback}><KPICalculator /></Suspense>} />
					<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU_FOLLOW_TINH_KPI}
						   element={<Suspense fallback={fallback}><KPI2Calculator /></Suspense>} />
					<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU_KHKD_ID}
						   element={<Suspense fallback={fallback}><ContentKHKD /></Suspense>} />
					<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU_REPORT_ID}
						   element={<Suspense fallback={fallback}><CanvasContent /></Suspense>} />
					<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU_MD}
						   element={<Suspense fallback={fallback}><MD /></Suspense>} />
					<Route path={ROUTES.CANVAS_TAB_SELECT_DAAS_CONG_CU_SA}
						   element={<Suspense fallback={fallback}><StrategicAnalysis /></Suspense>} />
				</Route>
			</Route>

			<Route path={ROUTES.CANVAS_TAB_KE_HOACH}
				   element={<Suspense fallback={fallback}><CanvasKeHoach /></Suspense>}>
				<Route path={ROUTES.CANVAS_TAB_LAP_KE_HOACH_HOME}
					   element={<Suspense fallback={fallback}><LapKHHome /></Suspense>}>
					<Route path={ROUTES.CANVAS_TAB_LAP_KE_HOACH_DETAIL}
						   element={<Suspense fallback={fallback}><KHKD /></Suspense>}>
					</Route>
				</Route>

				<Route path={ROUTES.CANVAS_TAB_HOP_KE_HOACH_HOME}
					   element={<Suspense fallback={fallback}><HopKHHome /></Suspense>}>
					<Route path={ROUTES.CANVAS_TAB_HOP_KE_HOACH_DETAIL}
						   element={<Suspense fallback={fallback}><KHKDTongHop /></Suspense>}>
					</Route>
				</Route>


			</Route>

			<Route path={ROUTES.CANVAS_TAB_DU_LIEU_NEN}
				   element={<Suspense fallback={fallback}><CanvasDuLieuNen /></Suspense>}>
				<Route path={ROUTES.CANVAS_TAB_DU_LIEU_NEN_ID}
					   element={<Suspense fallback={fallback}><Content /></Suspense>}>
				</Route>
			</Route>


			<Route path={ROUTES.CANVAS_TAB_DU_LIEU} element={<Suspense fallback={fallback}><CanvasDuLieu /></Suspense>}>
				<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DANH_MUC}
					   element={<Suspense fallback={fallback}><CanvasDanhMuc /></Suspense>}>
					<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DANH_MUC_ID}
						   element={<Suspense fallback={fallback}><Content /></Suspense>} />
				</Route>

				<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV}
					   element={<Suspense fallback={fallback}><CanvasDuLieuDauVaoHome /></Suspense>}>
					<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL}
						   element={<Suspense fallback={fallback}><CanvasDuLieuDauVaoDetail /></Suspense>}>
						<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE}
							   element={<Suspense fallback={fallback}><CanvasDuLieuDauVaoDetail_ThongKe /></Suspense>}>
							<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL} element={<Suspense
								fallback={fallback}><CanvasDuLieuDauVaoDetail_ThongKeDetail /></Suspense>}>
								<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL_ORIGINAL}
									   element={<Suspense
										   fallback={fallback}><ThongKeDetail_OriginalData /></Suspense>} />
								<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL_MAPPING}
									   element={<Suspense
										   fallback={fallback}><ThongKeDetail_MappingData /></Suspense>} />
								<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL_TEMPLATE}
									   element={<Suspense
										   fallback={fallback}><ThongKeDetail_TemplateData /></Suspense>} />
								<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_THONG_KE_DETAIL_FORM}
									   element={<Suspense
										   fallback={fallback}><ThongKeDetail_CreateForm /></Suspense>} />

							</Route>
						</Route>

						<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_FILE}
							   element={<Suspense fallback={fallback}><Content /></Suspense>}>
							<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_FILE_ID}
								   element={<Suspense fallback={fallback}><PreviewFile /></Suspense>} />
						</Route>

						<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_TIPTAP}
							   element={<Suspense fallback={fallback}><Content /></Suspense>}>
						</Route>

						<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_DU_LIEU_TONG_HOP} element={<Suspense
							fallback={fallback}><CanvasDuLieuDauVaoDetail_DuLieuTongHop /></Suspense>}>

						</Route>


					</Route>
				</Route>

				<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DU_LIEU_TONG_HOP}
					   element={<Suspense fallback={fallback}><CanvasDuLieuTongHopHome /></Suspense>}>
					<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DU_LIEU_TONG_HOP_ID}
						   element={<Suspense fallback={fallback}><Content /></Suspense>}>
						<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DU_LIEU_TONG_HOP_ID_FIlE}
							   element={<Suspense fallback={fallback}><FileLayout /></Suspense>} />

					</Route>
				</Route>

				<Route path={ROUTES.CANVAS_TAB_DU_LIEU_DLDV_DETAIL_HOME}
					   element={<Suspense fallback={fallback}><CanvasHome /></Suspense>}>

				</Route>


			</Route>

			<Route path={ROUTES.CANVAS_TAB_DASHBOARD}
				   element={<Suspense fallback={fallback}><CanvasDashboard /></Suspense>}>
				<Route path={ROUTES.CANVAS_TAB_DASHBOARD_ID}
					   element={<Suspense fallback={fallback}><CanvasContent /></Suspense>} />
				<Route path={ROUTES.CANVAS_TAB_CONG_CU_PHAN_TICH_CHIEN_LUOC}
					   element={<Suspense fallback={fallback}><CanvasPhanTichChienLuoc /></Suspense>}>
					<Route path="pestel" element={<Suspense fallback={fallback}><Pestel /></Suspense>} />
					<Route path="porter" element={<Suspense fallback={fallback}><Porter /></Suspense>} />
					<Route path="swot" element={<Suspense fallback={fallback}><Swot /></Suspense>} />
					<Route path="clddx" element={<Suspense fallback={fallback}><CLDDX /></Suspense>} />
					<Route path="bmcs"
						   element={<Suspense fallback={fallback}><BusinessModelCanvasStandand /></Suspense>} />
					<Route path="bmcr"
						   element={<Suspense fallback={fallback}><BusinessModelCanvasShorten /></Suspense>} />
					<Route path="bsc" element={<Suspense fallback={fallback}><BalancedScoredCard /></Suspense>} />

				</Route>
				<Route path={ROUTES.CANVAS_TAB_DASHBOARD_HOP_KE_HOACH_DETAIL}
					   element={<Suspense fallback={fallback}><KHKDTongHopView /></Suspense>}>
				</Route>

			</Route>


			<Route path={ROUTES.CANVAS_TAB_CONG_CU} element={<Suspense fallback={fallback}><CanvasCongCu /></Suspense>}>

				<Route path={ROUTES.CANVAS_TAB_CONG_CU_BAN_DO_DU_LIEU_QUAN_TRI}
					   element={<Suspense fallback={fallback}><CanvasBanDoDuLieuQuanTri /></Suspense>} />
				<Route path={ROUTES.CANVAS_TAB_CONG_CU_QUAN_LY_TO_DO}
					   element={<Suspense fallback={fallback}><CanvasQuanLyTodo /></Suspense>} />
				<Route path={ROUTES.CANVAS_TAB_CONG_CU_QUAN_LY_TO_DO}
					   element={<Suspense fallback={fallback}><CanvasQuanLyTodo /></Suspense>} />
				<Route path={`${ROUTES.CANVAS_TAB_CONG_CU_QUAN_LY_TO_DO}/:projectId`}
					   element={<Suspense fallback={fallback}><CanvasQuanLyTodo /></Suspense>} />
				<Route path={`${ROUTES.CANVAS_TAB_CONG_CU_QUAN_LY_TO_DO}/:projectId/step/:stepId`}
					   element={<Suspense fallback={fallback}><CanvasQuanLyTodo /></Suspense>} />
				<Route path={`${ROUTES.CANVAS_TAB_CONG_CU_QUAN_LY_TO_DO}/:projectId/step/:stepId/task/:taskId`}
					   element={<Suspense fallback={fallback}><CanvasQuanLyTodo /></Suspense>} />
				<Route path={ROUTES.CANVAS_TAB_CONG_CU_WEB_PAGE}
					   element={<Suspense fallback={fallback}><CanvasWebPage /></Suspense>}>
					<Route path={ROUTES.CANVAS_TAB_CONG_CU_WEB_PAGE_WEBPAGE}
						   element={<Suspense fallback={fallback}><SidebarStory /></Suspense>}>
						<Route path={ROUTES.CANVAS_TAB_CONG_CU_WEB_PAGE_CONTENT}
							   element={<Suspense fallback={fallback}><TiptapContent /></Suspense>}>
						</Route>
					</Route>
				</Route>

			</Route>
			<Route
				path={ROUTES.KTQT}
				element={
					<Suspense fallback={fallback}>
						<KeToanQuanTri />
					</Suspense>
				}
			>

				<Route path={ROUTES.KTQT_CHAY_DU_LIEU}
					   element={<Suspense fallback={fallback}> <InstallPopup /> </Suspense>} />
				<Route path={ROUTES.KTQT_DT}
					   element={<Suspense fallback={fallback}> <KTQTImport type={'DT'} /> </Suspense>} />
				<Route path={ROUTES.KTQT_GV}
					   element={<Suspense fallback={fallback}><KTQTImport type={'GV'} /></Suspense>} />
				<Route path={ROUTES.KTQT_CF} element={<Suspense fallback={fallback}><SoKeToan call={true} company={'HQ'}
																							  type={'CF'} /></Suspense>} />
				<Route path={ROUTES.KTQT_MAPPING} element={<Suspense fallback={fallback}><KTQTMapping /></Suspense>} />
				<Route
					path={ROUTES.KTQT_VAS}
					element={
						<Suspense fallback={fallback}>
							<Vas company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SKT}
					element={
						<Suspense fallback={fallback}>
							<SoKeToan company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SKTDC}
					element={
						<Suspense fallback={fallback}>
							<SKTDieuChinh />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SKTR}
					element={
						<Suspense fallback={fallback}>
							<ReviewSKT />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_VASR}
					element={
						<Suspense fallback={fallback}>
							<ReviewVAS />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_DATA_CRM}
					element={
						<Suspense fallback={fallback}>
							<DataCRM company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_LEAD_MANAGEMENT}
					element={
						<Suspense fallback={fallback}>
							<LeadManagement company={'HQ'} />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KEHOACH_KQKD}
					element={
						<Suspense fallback={fallback}>
							<Plan2 company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.SOSANH_KH_TH}
					element={
						<Suspense fallback={fallback}>
							<PlanActual2 company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.SOSANH_TH_CUNGKY}
					element={
						<Suspense fallback={fallback}>
							<PlanActualCungKy company={'HQ'} />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KTQT_BCTONGQUAT}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoTongQuat />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_DV}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoGroupUnit />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_SP}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBNhomSP />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_DV_THANG}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoGroupMonth />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_SP_THANG}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBNhomSP2 />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCHSTC}
					element={
						<Suspense fallback={fallback}>
							<HSFS />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCCDTC}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoCDTC />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_TEAM}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBT />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCTIEN}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoThuChi />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_KENH}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoNhomKenh />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_KENH2}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBNhomKenh2 />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_VU_VIEC}
					element={
						<Suspense fallback={fallback}>
							<BCNhomVV />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_BCKQKD_NHOM_VU_VIEC2}
					element={
						<Suspense fallback={fallback}>
							<BaoCaoPBNhomVV2 />
						</Suspense>
					}
				/>

				<Route
					path={ROUTES.KTQT_DANH_MUC}
					element={
						<Suspense fallback={fallback}>
							<DMKM company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SO_PHAN_BO_SP}
					element={
						<Suspense fallback={fallback}>
							<PhanBoSanPham company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SO_PHAN_BO_DON_VI}
					element={
						<Suspense fallback={fallback}>
							<PhanBoDonVi company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SO_PHAN_BO_KENH}
					element={
						<Suspense fallback={fallback}>
							<PhanBoKenh company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_SO_PHAN_BO_VU_VIEC}
					element={
						<Suspense fallback={fallback}>
							<PhanBoVuViec company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_THE_PHAN_BO_DON_VI}
					element={
						<Suspense fallback={fallback}>
							<CoChePhanBoDV company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_THE_PHAN_BO_PROJECT}
					element={
						<Suspense fallback={fallback}>
							<CoChePhanBoProject company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_THE_PHAN_BO_SAN_PHAM}
					element={
						<Suspense fallback={fallback}>
							<CoChePhanBoSP company={'HQ'} />
						</Suspense>
					}
				/>
				<Route
					path={ROUTES.KTQT_THE_PHAN_BO_KENH}
					element={
						<Suspense fallback={fallback}>
							<CoChePhanBoKenh company={'HQ'} />
						</Suspense>
					}
				/>
				<Route path={ROUTES.KTQT_BCTONGQUAT}
					   element={<Suspense fallback={fallback}><BaoCaoTongQuat /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_NHOM_DV}
					   element={<Suspense fallback={fallback}><BaoCaoGroupUnit /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_DV} element={<Suspense fallback={fallback}><BaoCaoUnit /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_DV2}
					   element={<Suspense fallback={fallback}><BaoCaoUnitMonth /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_NHOM_SP}
					   element={<Suspense fallback={fallback}><BaoCaoPBNhomSP /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_NHOM_DV_THANG}
					   element={<Suspense fallback={fallback}><BaoCaoGroupMonth /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_NHOM_SP_THANG}
					   element={<Suspense fallback={fallback}><BaoCaoPBNhomSP2 /></Suspense>} />
				<Route path={ROUTES.KTQT_BCHSTC} element={<Suspense fallback={fallback}><HSFS /></Suspense>} />
				<Route path={ROUTES.KTQT_BCCDTC} element={<Suspense fallback={fallback}><BaoCaoCDTC /></Suspense>} />
				<Route path={ROUTES.KTQT_BCKQKD_TEAM}
					   element={<Suspense fallback={fallback}><BaoCaoPBT /></Suspense>} />
				<Route path={ROUTES.KTQT_BCTIEN} element={<Suspense fallback={fallback}><BaoCaoThuChi /></Suspense>} />
				{listCompany.map((company) => (
					<Fragment key={company?.name}>
						<Route
							path={'so-ke-toan-' + company?.code}
							element={
								<Suspense fallback={fallback}>
									<SoKeToan company={company?.code} />
								</Suspense>
							}
						/>
						<Route
							path={'can-doi-phat-sinh-' + company?.code}
							element={
								<Suspense fallback={fallback}>
									<Vas company={company?.code} />
								</Suspense>
							}
						/>
						<Route
							path={'danh-muc-chung-' + company?.code}
							element={
								<Suspense fallback={fallback}>
									<DMKM company={company?.code} />
								</Suspense>
							}
						/>
					</Fragment>
				))}
			</Route>

		</Route> */}

		{/* Project Manager */}
		<Route
			path={ROUTES.PROJECT_MANAGER}
			element={
				<Suspense fallback={fallback}>
					<ProjectManager />
				</Suspense>
			}
		/>
		{/* Gateway */}
		<Route
			path={ROUTES.GATEWAY}
			element={
				<Suspense fallback={fallback}>
					<Gateway />
				</Suspense>
			}
		/>
		{/* Project-specific route */}
		<Route
			path={`${ROUTES.PROJECT_MANAGER}/:projectId`}
			element={
				<Suspense fallback={fallback}>
					<ProjectManager />
				</Suspense>
			}
		/>
		{/* Project and step specific route */}
		<Route
			path={ROUTES.PROJECT_MANAGER}
			element={
				<Suspense fallback={fallback}>
					<ProjectManager />
				</Suspense>
			}
		/>
		{/* Project-specific route */}
		<Route
			path={`${ROUTES.PROJECT_MANAGER}/:projectId`}
			element={
				<Suspense fallback={fallback}>
					<ProjectManager />
				</Suspense>
			}
		/>
		{/* Project and step specific route */}
		<Route
			path={`${ROUTES.PROJECT_MANAGER}/:projectId/step/:stepId`}
			element={
				<Suspense fallback={fallback}>
					<ProjectManager />
				</Suspense>
			}
		/>
		{/* Project, step, and task specific route */}
		<Route
			path={`${ROUTES.PROJECT_MANAGER}/:projectId/step/:stepId/task/:taskId`}
			element={
				<Suspense fallback={fallback}>
					<ProjectManager />
				</Suspense>
			}
		/>


		<Route
			path={ROUTES.KTQT_BCKQKD_NHOM_KENH}
			element={
				<Suspense fallback={fallback}>
					<BaoCaoNhomKenh />
				</Suspense>
			}
		/>
		<Route
			path={ROUTES.KTQT_BCKQKD_NHOM_KENH2}
			element={
				<Suspense fallback={fallback}>
					<BaoCaoPBNhomKenh2 />
				</Suspense>
			}
		/>

		{/* Template */}
		<Route path={ROUTES.TEMPLATE_CONTAINER}
			element={<Suspense fallback={fallback}><TemplateContainer /></Suspense>}>
			<Route path={ROUTES.TEMPLATE_DETAIL} element={<Suspense fallback={fallback}><TemplateDetail /></Suspense>}>
				<Route path={ROUTES.TEMPLATE_STEP_DETAIL}
					element={<Suspense fallback={fallback}><TemplateStepDetail /></Suspense>} />
			</Route>
		</Route>


		<Route path={ROUTES.ACCOUNTING} element={<Suspense fallback={fallback}><Home /></Suspense>}>
			<Route path={ROUTES.CHAIN_DETAIL_NEW} element={<Suspense fallback={fallback}><ChainDetailNew /></Suspense>}>
				<Route path={ROUTES.CARD_DETAIL_NEW}
					element={<Suspense fallback={fallback}><CardDetailNew /></Suspense>}>

				</Route>
			</Route>

			{/* Chain */}
			<Route path={ROUTES.CHAIN_DETAIL} element={<Suspense fallback={fallback}><ChainDetail /></Suspense>}>
				<Route path={ROUTES.CARD_DETAIL} element={<Suspense fallback={fallback}><CardDetail /></Suspense>}>
					<Route path={ROUTES.STEP_DETAIL}
						element={<Suspense fallback={fallback}><StepDetail /></Suspense>} />
				</Route>
			</Route>

			{/* Template */}
			<Route path={ROUTES.TEMPLATE_CONTAINER}
				element={<Suspense fallback={fallback}><TemplateContainer /></Suspense>}>
				<Route path={ROUTES.TEMPLATE_DETAIL}
					element={<Suspense fallback={fallback}><TemplateDetail /></Suspense>}>
					<Route path={ROUTES.TEMPLATE_STEP_DETAIL}
						element={<Suspense fallback={fallback}><TemplateStepDetail /></Suspense>} />
				</Route>
			</Route>

			<Route path={ROUTES.KHAI_BAO_DAU_KY} element={<Suspense fallback={fallback}><DanhMuc /></Suspense>}>
				<Route path={ROUTES.DAU_KY} element={<Suspense fallback={fallback}><DauKy /></Suspense>} />
			</Route>

			<Route path={ROUTES.QUANLYSANXUAT} element={<SanXuat />}>
				<Route path={ROUTES.LENHSANXUAT} element={<DinhMucLenhSanXuat />} />
				<Route path={ROUTES.DINHMUCBOM} element={<DinhMucBom />} />
			</Route>

			<Route path={ROUTES.SOLIEU} element={<Suspense fallback={fallback}><SoLieu /></Suspense>}>
				<Route path={ROUTES.SOCHUOI} element={<Suspense fallback={fallback}><DMSoChuoi /></Suspense>} />
				<Route path={ROUTES.SOKETOAN} element={<Suspense fallback={fallback}><DMSoKeToan /></Suspense>} />
				<Route path={ROUTES.SOKETOANT} element={<Suspense fallback={fallback}><DMSoKeToanT /></Suspense>} />
				<Route path={ROUTES.TONKHO} element={<Suspense fallback={fallback}><TonKho /></Suspense>} />
				<Route path={ROUTES.SOTAIKHOAN} element={<Suspense fallback={fallback}><SoTaiKhoan /></Suspense>} />
				<Route path={ROUTES.DKPRO} element={<Suspense fallback={fallback}><DKProData /></Suspense>} />
				<Route path={ROUTES.SOTAIKHOANDT} element={<Suspense fallback={fallback}><SoTaiKhoanDT /></Suspense>} />
				<Route path={ROUTES.SOTAIKHOANDD} element={<Suspense fallback={fallback}><SoTaiKhoanDD /></Suspense>} />
				<Route path={ROUTES.SOOFFSET} element={<Suspense fallback={fallback}><SoOffset /></Suspense>} />
				<Route path={ROUTES.SOOFFSET1} element={<Suspense fallback={fallback}><SoPreOffset /></Suspense>} />
				<Route path={ROUTES.SOQUANLYCHITRATRUOC}
					element={<Suspense fallback={fallback}><DMSoQuanLyChiTraTruoc /></Suspense>} />
				<Route path={ROUTES.SOQUANLYTAISAN}
					element={<Suspense fallback={fallback}><DMSoQuanLyTaiSan /></Suspense>} />
				<Route path={ROUTES.BANGTHONGKETUOINO}
					element={<Suspense fallback={fallback}><BangThongKeTuoiNo /></Suspense>} />
				<Route path={ROUTES.PHIEU_THU} element={<Suspense fallback={fallback}><PhieuThu /></Suspense>} />
				<Route path={ROUTES.PHIEU_CHI} element={<Suspense fallback={fallback}><PhieuChi /></Suspense>} />
			</Route>

			<Route path={ROUTES.HOADON} element={<Suspense fallback={fallback}><HoaDon /></Suspense>}>
				<Route path={ROUTES.QUANLYDAUVAO}
					element={<Suspense fallback={fallback}><QuanLyHoaDonDauVao /></Suspense>} />
				<Route path={ROUTES.QUANLYDAURA}
					element={<Suspense fallback={fallback}><QuanLyHoaDonDauRa /></Suspense>} />
				<Route path={ROUTES.HOA_DON_DAU_RA_CHI_TIET}
					element={<Suspense fallback={fallback}><HoaDonDauRaChiTiet /></Suspense>} />
				<Route path={ROUTES.HOA_DON_DAU_VAO_CHI_TIET}
					element={<Suspense fallback={fallback}><HoaDonDauVaoChiTiet /></Suspense>} />
			</Route>


			<Route path={ROUTES.DULIEUKHAC} element={<Suspense fallback={fallback}><DanhMuc /></Suspense>}>
				<Route path={ROUTES.CCPB_VU_VIEC}
					element={<Suspense fallback={fallback}><CoChePhanBoVuViec /></Suspense>} />
				<Route path={ROUTES.CCPB_LENH_SX}
					element={<Suspense fallback={fallback}><CoChePhanBoLenhSX /></Suspense>} />
				<Route path={ROUTES.REVIEW} element={<Suspense fallback={fallback}><ReviewSAB /></Suspense>} />
				<Route path={ROUTES.LENH_SAN_XUAT} element={<Suspense fallback={fallback}><LenhSanXuat /></Suspense>} />
				<Route path={ROUTES.DETAIL_LENH_SAN_XUAT}
					element={<Suspense fallback={fallback}><DetailLenhSanXuat /></Suspense>} />
				<Route path={ROUTES.PHIEUNHAP} element={<Suspense fallback={fallback}><PhieuNhap /></Suspense>} />
				<Route path={ROUTES.PHIEUXUAT} element={<Suspense fallback={fallback}><PhieuXuat /></Suspense>} />
				<Route path={ROUTES.LUONG} element={<Suspense fallback={fallback}><Luong /></Suspense>} />
				<Route path={ROUTES.CDPS} element={<Suspense fallback={fallback}><CDPS /></Suspense>} />
			</Route>

			<Route path={ROUTES.DANH_MUC_KHAC} element={<Suspense fallback={fallback}><DanhMuc /></Suspense>}>
				<Route path={ROUTES.TkNganHang} element={<Suspense fallback={fallback}><DMTkNganHang /></Suspense>} />
				<Route path={ROUTES.TkKeToan} element={<Suspense fallback={fallback}><DMTkKeToan /></Suspense>} />
				<Route path={ROUTES.COMPANY} element={<Suspense fallback={fallback}><DMCompany /></Suspense>} />
				<Route path={ROUTES.PHONGBAN} element={<Suspense fallback={fallback}><DMPhongBan /></Suspense>} />
				<Route path={ROUTES.BU} element={<Suspense fallback={fallback}><DMBU /></Suspense>} />
				<Route path={ROUTES.LOAITIEN} element={<Suspense fallback={fallback}><DMLoaiTien /></Suspense>} />
				<Route path={ROUTES.CHUONGTRINH} element={<Suspense fallback={fallback}><DMChuongTrinh /></Suspense>} />
				<Route path={ROUTES.CHUSOHUU} element={<Suspense fallback={fallback}><DMChuSoHuu /></Suspense>} />
				<Route path={ROUTES.TAISANDAUTU} element={<Suspense fallback={fallback}><DMTaiSanDauTu /></Suspense>} />
				<Route path={ROUTES.NHAN_VIEN} element={<Suspense fallback={fallback}><DMNhanVien /></Suspense>} />
			</Route>

			<Route path={ROUTES.DANH_MUC} element={<Suspense fallback={fallback}><DanhMuc /></Suspense>}>
				<Route path={ROUTES.KMF} element={<Suspense fallback={fallback}><DMKmf /></Suspense>} />
				<Route path={ROUTES.KMTC} element={<Suspense fallback={fallback}><DMKmtc /></Suspense>} />
				<Route path={ROUTES.SanPham} element={<Suspense fallback={fallback}><DMSanPham /></Suspense>} />
				<Route path={ROUTES.Kho} element={<Suspense fallback={fallback}><DMKho /></Suspense>} />
				<Route path={ROUTES.DuAn} element={<Suspense fallback={fallback}><DMDuAn /></Suspense>} />
				<Route path={ROUTES.KENH} element={<Suspense fallback={fallback}><DMKenh /></Suspense>} />
				<Route path={ROUTES.HopDong} element={<Suspense fallback={fallback}><DMHopDong /></Suspense>} />
				<Route path={ROUTES.KHACH_HANG} element={<Suspense fallback={fallback}><DMKhachHang /></Suspense>} />
				<Route path={ROUTES.NHA_CUNG_CAP} element={<Suspense fallback={fallback}><DMNhaCungCap /></Suspense>} />
				<Route path={ROUTES.PHIEU_NHAP_XUAT}
					element={<Suspense fallback={fallback}><PhieuNhapXuat /></Suspense>} />
				<Route path={ROUTES.TkNganHang} element={<Suspense fallback={fallback}><DMTkNganHang /></Suspense>} />
				<Route path={ROUTES.TkKeToan} element={<Suspense fallback={fallback}><DMTkKeToan /></Suspense>} />
				<Route path={ROUTES.COMPANY} element={<Suspense fallback={fallback}><DMCompany /></Suspense>} />
				<Route path={ROUTES.PHONGBAN} element={<Suspense fallback={fallback}><DMPhongBan /></Suspense>} />
				<Route path={ROUTES.BU} element={<Suspense fallback={fallback}><DMBU /></Suspense>} />
				<Route path={ROUTES.LOAITIEN} element={<Suspense fallback={fallback}><DMLoaiTien /></Suspense>} />
				<Route path={ROUTES.CHUONGTRINH} element={<Suspense fallback={fallback}><DMChuongTrinh /></Suspense>} />
				<Route path={ROUTES.CHUSOHUU} element={<Suspense fallback={fallback}><DMChuSoHuu /></Suspense>} />
				<Route path={ROUTES.TAISANDAUTU} element={<Suspense fallback={fallback}><DMTaiSanDauTu /></Suspense>} />
				<Route path={ROUTES.NHAN_VIEN} element={<Suspense fallback={fallback}><DMNhanVien /></Suspense>} />
			</Route>

			<Route path={ROUTES.BAO_CAO} element={<Suspense fallback={fallback}><BaoCao /></Suspense>}>
				<Route path={ROUTES.BAO_CAO_B01} element={<Suspense fallback={fallback}><B01 /></Suspense>} />
				<Route path={ROUTES.BAO_CAO_B02} element={<Suspense fallback={fallback}><B02 /></Suspense>} />
				<Route path={ROUTES.BAO_CAO_B03} element={<Suspense fallback={fallback}><B03 /></Suspense>} />
				<Route path={ROUTES.GV2B} element={<Suspense fallback={fallback}><GV2B /></Suspense>} />
				<Route path={ROUTES.GV3W} element={<Suspense fallback={fallback}><GV3W /></Suspense>} />
				<Route path={ROUTES.GV3M} element={<Suspense fallback={fallback}><GV3M /></Suspense>} />
				<Route path={ROUTES.GV3MB2} element={<Suspense fallback={fallback}><GV3MB2 /></Suspense>} />
				<Route path={ROUTES.GTHT} element={<Suspense fallback={fallback}><GTHoanThanh /></Suspense>} />
				<Route path={ROUTES.PBGV2B} element={<Suspense fallback={fallback}><PBGV2B /></Suspense>} />
				<Route path={ROUTES.PBGV3} element={<Suspense fallback={fallback}><PBGV3 /></Suspense>} />
				<Route path={ROUTES.PBLSX} element={<Suspense fallback={fallback}><PBLSX /></Suspense>} />
				<Route path={ROUTES.BCTIEN} element={<Suspense fallback={fallback}><BCTien /></Suspense>} />
				<Route path={ROUTES.BCTON_KHO} element={<Suspense fallback={fallback}><BCTonKho /></Suspense>} />
				<Route path={ROUTES.BCTHUE_BAO_HIEM}
					element={<Suspense fallback={fallback}><BCThueBaoHiem /></Suspense>} />
			</Route>


			{/* Wiki Storage */}
			<Route path={ROUTES.WIKI_STORAGE} element={<Suspense fallback={fallback}><WikiStorage /></Suspense>} />
		</Route>
		{/* Admin */}
		{/* <Route
			path={ROUTES.ADMIN}
			element={
				<Suspense fallback={fallback}>
					<Admin2 />
				</Suspense>
			}
		/> */}
		<Route element={<AuthRoutesAdmin />}>
			<Route path='/adminApp' element={<AdminApp />} />
		</Route>
	</Route>
);
