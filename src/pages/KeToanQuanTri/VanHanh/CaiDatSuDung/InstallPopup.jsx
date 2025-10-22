import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Modal, Button, message } from 'antd';
import styles from './InstallPopup.module.css';
import { RefreshCcw, Minimize2 } from 'lucide-react';
import CaiDatSuDung from './CaiDatSuDung';
import { SettingOutlined } from "@ant-design/icons";
import { MyContext } from "../../../../MyContext.jsx";
import { AgGridReact } from 'ag-grid-react';
import KTQTImportContent from '../../popUp/importFIle/KTQTImportContent.jsx';
import TooltipHeaderIcon from '../../HeaderTooltip/TooltipHeaderIcon.jsx';
import KTQTImport from '../KTQTImport.jsx';
import CoChePhanBoDV from '../ThePhanBo/CoChePhanBoDV.jsx';
import CoChePhanBoSP from '../ThePhanBo/CoChePhanBoSP.jsx';
import CoChePhanBoProject from '../ThePhanBo/CoChePhanBoProject.jsx';
import PhanBoDonVi from '../SoPhanBo/PhanBoDonVi.jsx';
import PhanBoSanPham from '../SoPhanBo/PhanBoSanPham.jsx';
import PhanBoVuViec from '../SoPhanBo/PhanBoVuViec.jsx';
import Kmf from '../../DanhMuc/Kmf.jsx';
import Product from '../../DanhMuc/Product.jsx';
import Project from '../../DanhMuc/Project.jsx';
import Unit from '../../DanhMuc/Unit.jsx';
import ImportFileDialog from '../../popUp/importFIle/ImportFileDialog.jsx';
import MappingConfig from './MappingConfig.jsx';
import SoKeToan from '../SoKeToan.jsx';
import Typography from 'antd/es/typography/Typography';
import Select from 'antd/es/select/index.js';
import FileImportComponent from '../../popUp/importFIle/ImportFile.jsx';
import KTQTImportContentGV from '../../popUp/importFIle/KTQTImportContentGV.jsx';
import PhanBoKenh from '../SoPhanBo/PhanBoKenh.jsx';
import { Radio } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
const InstallPanel = () => {
	const call = 'cdsd';
	const { currentCompanyKTQT, currentYearKTQT } = useContext(MyContext);
	// State cần thiết
	const [selectedStep, setSelectedStep] = useState(null);
	const [company, setCompany] = useState('');
	const [yearCDSD, setYearCDSD] = useState('');

	const [sktType, setSktType] = useState(null);
	const [anchorEl, setAnchorEl] = useState(null);

	// Làm phẳng cấu trúc bước - bỏ subSteps
	const steps = [
		{
			id: 'import-dt',
			name: 'Import Doanh Thu',
			render: () => (
				<div style={{ width: '100%', height: '100%' }}>
					<KTQTImportContent onSuccess={() => {}} phanLoaiDefault="DT" />
				</div>
			),
		},
		{
			id: 'import-gv',
			name: 'Import Giá vốn',
			render: () => (
				<div style={{ width: '100%', height: '100%' }}>
					<KTQTImportContentGV onSuccess={() => {}} phanLoaiDefault="GV" />
				</div>
			),
		},
		{
			id: 'import-cf',
			name: 'Import chi phí',
			render: () => (
				<div className={styles.importCfContainer}>
					<Typography className={styles.importCfTitle}>
						Lựa chọn dạng sổ kế toán để import
					</Typography>
					<div className={styles.importCfRadioGroup}>
						<Radio.Group
							onChange={e => {
								if (sktType === e.target.value) {
									setSktType(null);
								} else {
									setSktType(e.target.value);
								}
							}}
							value={sktType || ''}
							optionType="button"
							buttonStyle="solid"
							style={{ width: '100%' }}
						>
							<Radio.Button value={'skt_don'}>Nhật ký</Radio.Button>
							<Radio.Button value={'skt_t'}>Chữ T</Radio.Button>
							
							{sktType && (
								<Radio.Button
									type="text"
									onClick={() => setSktType(null)}
									title="Bỏ chọn"
								>
									<CloseOutlined />
								</Radio.Button>
							)}
						</Radio.Group>
					</div>
					<div className={styles.importCfDescription}>
						{(sktType && sktType.includes('skt_don')) &&
							<Typography>Loại nhật ký: 1 định khoản kép được ghi nhận ở 1 dòng: TK nợ - TK có - Số tiền</Typography>}
						{(sktType && sktType.includes('skt_t')) &&
							<Typography>Loại Chữ T: 1 định khoản kép được ghi nhận ở 2 dòng: TK - TK đối ứng - Tiền nợ - Tiền có</Typography>}
					</div>
					<div className={styles.importCfContent}>
						{sktType &&
							<FileImportComponent
								apiUrl={`${import.meta.env.VITE_API_URL}/api/ktqt-skt`}
								table={'SoKeToan-KTQT'}
								company={currentCompanyKTQT}
								sktType={sktType ? sktType : null}
							/>
						}
					</div>
				</div>
			),
		},
		{
			id: 'sync-catalog',
			name: 'Đồng bộ danh mục',
			render: () => (
				<div style={{ width: '100%', height: '100%' }}>
					<MappingConfig />
				</div>
			),
		},
		{
			id: 'merge-dt',
			name: 'Hợp nhất Doanh thu',
			render: () => (
				<div style={{ width: '100%', height: '100%' }}>
					<KTQTImport type="DT" call={true} />
				</div>
			),
		},
		{
			id: 'merge-gv',
			name: 'Hợp nhất Giá vốn',
			render: () => (
				<div style={{ width: '100%', height: '100%' }}>
					<KTQTImport type="GV" call={true} />
				</div>
			),
		},
		{
			id: 'merge-cf',
			name: 'Hợp nhất Chi phí',
			render: () => (
				<div style={{ width: '100%', height: '100%' }}>
					<SoKeToan company={'HQ'} call={true} type="CF" />
				</div>
			),
		},
		{
			id: 'merge-final',
			name: 'Sổ hợp nhất',
			render: () => (
				<div style={{ width: '100%', height: '100%' }}>
					<SoKeToan company={'HQ'} call={true} />
				</div>
			),
		},
		{
			id: 'config-unit',
			name: 'Thẻ phân bổ đơn vị',
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<CoChePhanBoDV company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'config-product',
			name: 'Thẻ phân bổ sản phẩm',
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<CoChePhanBoSP company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'config-project',
			name: 'Thẻ phân bổ vụ việc',
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<CoChePhanBoProject company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'review-unit',
			name: (<>Phân bổ đơn vị <TooltipHeaderIcon table={'SoPhanBoDonVi'} /></>),
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<PhanBoDonVi company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'review-product',
			name: (<>Phân bổ sản phẩm <TooltipHeaderIcon table={'SoPhanBoSanPham'} /></>),
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<PhanBoSanPham company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'review-project',
			name: (<>Phân bổ vụ việc <TooltipHeaderIcon table={'SoPhanBoVuViec'} /></>),
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<PhanBoVuViec company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'review-channel',
			name: (<>Phân bổ kênh <TooltipHeaderIcon table={'SoPhanBoKenh'} /></>),
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<PhanBoKenh company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'report-kmf',
			name: (<>Khoản mục KQKD <TooltipHeaderIcon table={'Kmf'} /></>),
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<Kmf company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'report-product',
			name: (<>Quản lý sản phẩm <TooltipHeaderIcon table={'Product'} /></>),
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<Product company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'report-project',
			name: (<>Quản lý vụ việc <TooltipHeaderIcon table={'Project'} /></>),
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<Project company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
		{
			id: 'report-unit',
			name: (<>Quản lý đơn vị <TooltipHeaderIcon table={'Unit'} /></>),
			render: () => (
				<div style={{ height: '100%', width: '100%' }}>
					<Unit company={currentCompanyKTQT} call={call} />
				</div>
			),
		},
	];

	const handleReload = () => {
		setSelectedStep(null);
		setCompany('');
		setYearCDSD('');
		localStorage.setItem('selectedStep', null);
	};

	const handleStepSelect = (stepId) => {
		setSelectedStep(stepId);
		localStorage.setItem('selectedStep', stepId);
	};

	// Lấy step hiện tại
	const currentStep = steps.find(step => step.id === selectedStep);

	return (
		<div className={styles.rndContainer}>
			<div className={styles.container}>
				{/* Sidebar - 15% */}
				<div className={styles.sidebar}>
					<div className={styles.sidebarContent}>
						<div className={styles.sidebarHeader}>
							<h3 className={styles.sidebarTitle}>
								Danh sách bước
							</h3>
							<Button 
								size="small" 
								onClick={handleReload}
								icon={<RefreshCcw size={14} />}
								className={styles.resetButton}
							>
								Reset
							</Button>
						</div>
						
						{/* Nhóm Import */}
						<div className={styles.stepGroup}>
							<div className={styles.groupTitle}>
								B1 - Import dữ liệu
							</div>
							{steps.slice(0, 3).map((step, index) => (
								<div
									key={step.id}
									onClick={() => handleStepSelect(step.id)}
									className={`${styles.stepItem} ${selectedStep === step.id ? styles.stepItemActive : ''}`}
								>
									B1.{index+1} - {step.name}
								</div>
							))}
						</div>

						{/* Nhóm Đồng bộ */}
						<div className={styles.stepGroup}>
							<div className={styles.groupTitle}>
								B2 - Đồng bộ
							</div>
							{steps.slice(3, 4).map((step, index) => (
								<div
									key={step.id}
									onClick={() => handleStepSelect(step.id)}
									className={`${styles.stepItem} ${selectedStep === step.id ? styles.stepItemActive : ''}`}
								>
									B2.{index+1} - {step.name}
								</div>
							))}
						</div>

						{/* Nhóm Hợp nhất */}
						<div className={styles.stepGroup}>
							<div className={styles.groupTitle}>
								B3 - Hợp nhất số liệu
							</div>
							{steps.slice(4, 8).map((step, index) => (
								<div
									key={step.id}
									onClick={() => handleStepSelect(step.id)}
									className={`${styles.stepItem} ${selectedStep === step.id ? styles.stepItemActive : ''}`}
								>
									B3.{index+1} - {step.name}
								</div>
							))}
						</div>

						{/* Nhóm Cấu hình */}
						<div className={styles.stepGroup}>
							<div className={styles.groupTitle}>
								B4 - Cấu hình thẻ phân bổ
							</div>
							{steps.slice(8, 11).map((step, index) => (
								<div
									key={step.id}
									onClick={() => handleStepSelect(step.id)}
									className={`${styles.stepItem} ${selectedStep === step.id ? styles.stepItemActive : ''}`}
								>
									B4.{index+1} - {step.name}
								</div>
							))}
						</div>

						{/* Nhóm Rà soát */}
						<div className={styles.stepGroup}>
							<div className={styles.groupTitle}>
								B5 - Rà soát sổ phân bổ
							</div>
							{steps.slice(11, 15).map((step, index) => (
								<div
									key={step.id}
									onClick={() => handleStepSelect(step.id)}
									className={`${styles.stepItem} ${selectedStep === step.id ? styles.stepItemActive : ''}`}
								>
									B5.{index+1} - {step.name}
								</div>
							))}
						</div>

						{/* Nhóm Báo cáo */}
						<div className={styles.stepGroup}>
							<div className={styles.groupTitle}>
								B6 - Nhóm báo cáo
							</div>
							{steps.slice(15, 19).map((step, index) => (
								<div
									key={step.id}
									onClick={() => handleStepSelect(step.id)}
									className={`${styles.stepItem} ${selectedStep === step.id ? styles.stepItemActive : ''}`}
								>
									B6.{index+1} - {step.name}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Main Content - 85% */}
				<div className={styles.mainContent}>
					{selectedStep ? (
						<>
							{/* Header */}
							<div className={styles.contentHeader}>
								<h2 className={styles.contentTitle}>
									{currentStep?.name}
								</h2>
							</div>
							
							{/* Content */}
							<div className={styles.contentBody}>
								{currentStep?.render()}
							</div>
						</>
					) : (
						<div className={styles.emptyState}>
							<SettingOutlined className={styles.emptyIcon} />
							<h3 className={styles.emptyTitle}>Chọn một bước để bắt đầu</h3>
							<p className={styles.emptyDescription}>
								Nhấp vào bước bất kỳ ở bên trái để thực hiện
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default InstallPanel;
