import React, { useContext, useEffect, useState } from 'react';
import { Steps, Button, Typography, Space, Select, message } from 'antd';
import ImportFileDialog from '../../popUp/importFIle/ImportFileDialog.jsx';
import CoChePhanBoDV from '../ThePhanBo/CoChePhanBoDV.jsx';
import PhanBoSanPham from '../SoPhanBo/PhanBoSanPham.jsx';
import CoChePhanBoSP from '../ThePhanBo/CoChePhanBoSP.jsx';
import Vas from '../../DanhMuc/Vas.jsx';
import Kmf from '../../DanhMuc/Kmf.jsx';
import Kmns from '../../DanhMuc/Kmns.jsx';
import Product from '../../DanhMuc/Product.jsx';
import PhanBoDonVi from '../SoPhanBo/PhanBoDonVi.jsx';
import CoChePhanBoVuViec from '../../../Home/AgridTable/CCPB/ThePhanBo/CoChePhanBoVuViec.jsx';
import CoChePhanBoKenh from '../ThePhanBo/CoChePhanBoKenh.jsx';
import PhanBoVuViec from '../SoPhanBo/PhanBoVuViec.jsx';
import PhanBoKenh from '../SoPhanBo/PhanBoKenh.jsx';
import { toast } from 'react-toastify';
import { updateAll } from '../../functionKTQT/updateAll.js';
import { IconDataLink } from '../../../../icon/IconSVG.js';
import './caiDatSuDung.module.css';
import css from './caiDatSuDung.module.css';
import { MyContext } from '../../../../MyContext.jsx';
import CoChePhanBoProject from '../ThePhanBo/CoChePhanBoProject.jsx';
import { value } from 'lodash/seq.js';
import VasDataTable from '../../detail/VasDataTable.jsx';
import Project from '../../DanhMuc/Project.jsx';
import Unit from '../../DanhMuc/Unit.jsx';
import Kenh from '../../DanhMuc/Kenh.jsx';
import Vendor from '../../DanhMuc/Vendor.jsx';
import { SyncOutlined } from '@ant-design/icons';
import KTQTImportComponent from '../../popUp/importFIle/KTQTImportComponent.jsx';
import KTQTImportContent from '../../popUp/importFIle/KTQTImportContent.jsx';
import MappingConfig from './MappingConfig';
import KTQTImport from '../KTQTImport.jsx';
import SoKeToan from '../../VanHanh/SoKeToan.jsx';

const { Text } = Typography;

const { Step } = Steps;

const CaiDatSuDung = ({
						 
						  handleSheetSelection,
						  activeStep,
						  setActiveStep,
						  subStep,
						  setSubStep,
						  handleReload,
						  setCompany,
						  steps,
					  }) => {
					
	const [anchorEl, setAnchorEl] = useState(null);
	const [isSyncing, setIsSyncing] = useState(false);
	const [updatedVas, setUpdateVas] = useState(false);
	const { listCompany, setLoadData, listYear, currentYearKTQT, setYearCDSD,currentCompanyKTQT } = useContext(MyContext);


	

	useEffect(() => {
		localStorage.setItem('activeStep', activeStep);
	}, [activeStep]);

	const handleNext = () => {
		if (subStep < steps[activeStep].subSteps.length - 1) {
			// Chuyển qua subStep tiếp theo
			setSubStep((prev) => +prev + 1);
		} else if (activeStep < steps.length - 1) {
			// Nếu đã hết subStep, chuyển qua step tiếp theo
			setActiveStep((prev) => +prev + 1);
			setSubStep(0); // Reset subStep về 0
		}
	};

	const handleBack = () => {
		if (subStep > 0) {
			// Quay lại subStep trước đó
			setSubStep((prev) => prev - 1);
		} else if (activeStep > 0) {
			// Nếu đang ở subStep đầu tiên, quay lại step trước đó
			setActiveStep((prev) => prev - 1);
			setSubStep(steps[activeStep - 1].subSteps.length - 1); // Đặt subStep về cuối của step trước đó
		}
	};


	const handleUpdateVAS = async () => {
		setIsSyncing(true); // Bắt đầu hiệu ứng xoay
		try {
			await updateAll(); // Cập nhật toàn bộ VAS
			toast.success('Dữ liệu VAS đã được cập nhật thành công!');
			setUpdateVas(!updatedVas);

		} catch (error) {
			toast.error('Đã xảy ra lỗi khi cập nhật VAS.');
		} finally {
			setIsSyncing(false); // Kết thúc hiệu ứng xoay
			setLoadData(pre => !pre);
		}
	};
	const handleChangeStep = (value) => {
		setActiveStep(value);
		setSubStep(0);
	};
	return (

		<div style={{ width: '100%', padding: '10px', height: '100%', overflow: 'auto' }}>
			{activeStep !== null && activeStep !== 'hoan_thanh' &&
		<div style={{ width: '100%', height: '100%'}}>
		{/* Danh sách chính các bước */}
		<Steps current={activeStep} direction="horizontal"
			   onChange={() => {}}
			   items={steps.map((step, index) => {
				const isCurrentStep = activeStep === index;
				const isCompletedStep = activeStep > index;
				const isPendingStep = activeStep < index;

				// Tính phần trăm hoàn thành cho bước hiện tại
				const percent = isCurrentStep
					? ((parseInt(subStep) + 1) / step.subSteps.length) * 100
					: isCompletedStep
						? 100
						: 0;

				return {
					title: <span>{step.name}</span>,
					percent: percent,
					status: isCompletedStep ? 'finish' : isCurrentStep ? 'process' : isPendingStep ? 'wait' : null,
					disabled: true
				};
			})}
		/>


		{/* Danh sách subStep cố định bên dưới */}
		{activeStep !== null && activeStep !== 'hoan_thanh' && (
			<div style={{ display: 'flex', marginTop: '20px', height: 'calc(100% - 50px)' }}>
				{/* Danh sách subStep */}
				{steps[activeStep]?.subSteps.length > 1 && (
					<div style={{
						width: '17%',
						borderRight: '1px solid #e0e0e0',
						padding: '10px',
						boxSizing: 'border-box',
						overflowY: 'auto',
					}}>
						<Typography.Title level={5} style={{ color: '#454545' }}>Các bước chi
							tiết:</Typography.Title>
						<Steps
							direction="vertical"
							size="small"
							current={subStep}
							onChange={setSubStep}
						>
							{steps[activeStep]?.subSteps.map((sub) => (
								<Step key={sub.subStep} title={sub.name} />
							))}
						</Steps>
					</div>
				)}

				{/* Nội dung chi tiết của subStep */}
				<div
					style={{
						flexGrow: 1,
						padding: '10px',
						boxSizing: 'border-box',
						height: '100%',
						width: steps[activeStep]?.subSteps.length > 1 ? '82%' : '100%',
					}}
				>
					{steps[activeStep]?.subSteps[subStep]?.render()}
				</div>
			</div>
		)}


	</div>
			}

			


			{activeStep == null && (
				<div style={{ textAlign: 'center', marginTop: '20px', color: '#262626', padding: '10px' }}>
					<div style={{ marginTop: '10px' }}>
						<span>Đây là trình hướng dẫn thiết lập dữ liệu đầu vào cho chương trình</span>
					</div>
					<div style={{ marginTop: '10px' }}>
                        <span>Chọn <Button variant="outlined" onClick={() => {
							setActiveStep(0);
							setSubStep(0);
						}}>Bắt đầu</Button> để thực hiện quá trình</span>
					</div>

				</div>
			)}
			{activeStep === 'hoan_thanh' && <>
				<div style={{ textAlign: 'center', marginTop: '20px', color: '#262626', padding: '10px' }}>
					<Space>
						<Button
							type="default"
							onClick={() => handleReload()}
						>
							Lặp lại quá trình
						</Button>
					</Space>
					<Typography.Title level={3} style={{ marginTop: '16px', marginBottom: '8px', textAlign: 'center' }}>
						Đã hoàn thành việc cài đặt. Vui lòng di chuyển tới các sheet khác để kiểm tra dữ
						liệu.
					</Typography.Title>
					<Space style={{ paddingTop: '16px' }}>
						<Button
							type="default"
							onClick={() => handleSheetSelection(`SoKeToan${currentCompanyKTQT === 'SOL' ? 'DN' : 'HN'}`)}
						>
							Sổ kế toán
						</Button>
						{/*<Button*/}
						{/*	type="default"*/}
						{/*	onClick={() => handleSheetSelection(`DMVAS${currentCompanyKTQT === 'SOL' ? 'DN' : 'HN'}`)}*/}
						{/*>*/}
						{/*	Cân đối phát sinh*/}
						{/*</Button>*/}
						<Button
							type="default"
							onClick={() => handleSheetSelection(`DMSANPHAM${currentCompanyKTQT === 'SOL' ? 'DN' : 'HN'}`)}
						>
							Danh mục sản phẩm
						</Button>
						<Button
							type="default"
							onClick={() => handleSheetSelection(`KMF/KMNS${currentCompanyKTQT === 'SOL' ? 'DN' : 'HN'}`)}
						>
							Danh mục khoản mục
						</Button>
					</Space>

				</div>
			</>}


		</div>
	);
};

export default CaiDatSuDung;
