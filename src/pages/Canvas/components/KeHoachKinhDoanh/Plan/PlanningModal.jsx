import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
	Button,
	Modal,
	Card,
	Input,
	Typography,
	Row,
	Col,
	Form,
	Checkbox,
	DatePicker,
	message,
	Select,
	InputNumber,
	Popconfirm, Dropdown, Steps,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { createTemplateColumn, createTemplateTable } from '../../../../../apis/templateSettingService.jsx';
import { LIST_OBLIGATORY_COLUMN_TEMP_PLAN } from '../../../../../Consts/LIST_OBLIGATORY_COLUMN_TEMP_PLAN.js';
import css from './PlanningModal.module.css';
import viewStyles from '../ViewPlan/ViewPlan.module.css';
import styles from '../BottomDown/BottomDown.module.css';
import {
	checkDuyetPMVPlan,
	createNewPMVPlan,
	getAllPMVPlan,
	updatePMVPlan,
} from '../../../../../apis/pmvPlanService.jsx';
import dayjs from 'dayjs';
import { VectorChart } from '../../../../../icon/svg/IconSvg.jsx';
import { createNewPMVDeployment, getPMVDeploymentsByPlanId } from '../../../../../apis/pmvDeploymentService.jsx';
import { MyContext } from '../../../../../MyContext.jsx';
import { createTimestamp } from '../../../../../generalFunction/format.js';
import { LIST_COLUMNS_NGANH, LIST_NHOM_NGANH } from '../../../../../Consts/LIST_NHOM_NGANH.js';
import ChuKy from '../ChuKy/ChuKy.jsx';
import { getAllPMVCategories } from '../../../../../apis/pmvCategoriesService.jsx';
import {
	createNewPMVPlanDetail, deletePMVPlanDetail,
	getAllPMVPlanDetail,
	updatePMVPlanDetail,
} from '../../../../../apis/pmvPlanDetailService.jsx';
import BottomDown from '../BottomDown/BottomDown.jsx';
import { getAllPMVSettingKH, getAllPMVSettingKHFull } from '../../../../../apis/pmvSettingKHService.jsx';
import { ChevronDown } from 'lucide-react';
import { getAllUserClass } from '../../../../../apis/userClassService.jsx';

const { Title, Text } = Typography;
const { Option } = Select;

export default function PlanningModal({ plan: selectedPlanFromProps, onPlanUpdate }) {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [checkDuyetPlan, setCheckDuyetPlan] = useState(false);
	const [isOpenCDXP, setIsOpenCDXP] = useState(false);
	const [listCol, setListCol] = useState([]);
	const [listPlan, setListPlan] = useState([]);
	const [listCateFiltered, setListCateFiltered] = useState([]);
	const [form] = Form.useForm();
	const [formData] = Form.useForm();
	const [selectedCard, setSelectedCard] = useState(null);

	// Sử dụng selectedPlanFromProps nếu có, ngược lại dùng selectedCard
	const currentSelectedPlan = selectedPlanFromProps || selectedCard;

	// Force re-render khi selectedPlanFromProps thay đổi
	useEffect(() => {
		if (selectedPlanFromProps) {
			setSelectedCard(selectedPlanFromProps);
		}
	}, [selectedPlanFromProps]);
	const [selectedDeployment, setSelectedDeployment] = useState(null);
	const [openChuKy, setOpenChuKy] = useState(false);
	const [listPMVDeployment, setListPMVDeployment] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { currentUser } = useContext(MyContext);
	const [cateTypeSelected, setCateTypeSelected] = useState(null);
	const [columnSelected, setColumnSelected] = useState(null);
	const [ten_cot_moi, setTen_cot_moi] = useState(null);
	const [topDownDetails, setTopDownDetails] = useState([]);
	const [listPMVSettingKH, setListPMVSettingKH] = useState([]);
	const [allUserClasses, setAllUserClasses] = useState([]);
	const [customUserClassOptions, setCustomUserClassOptions] = useState([]);
	const [userClassOptions, setUserClassOptions] = useState([]);
	const [deploymentStepById, setDeploymentStepById] = useState({});
	const [deploymentMetrics, setDeploymentMetrics] = useState({});

	const loadUserClasses = async () => {
		try {
			const userClasses = await getAllUserClass();
			setAllUserClasses(userClasses || []);
		} catch (error) {
			console.error('Error loading user classes:', error);
		}
	};

	// Read custom User class options from categories only (no isUse, name-only)
	const loadCustomUserClassOptions = async () => {
		try {
			const pmvCategories = await getAllPMVCategories();
			const catOptions = (pmvCategories || [])
				.filter(c => c.category_type === 'user_class')
				.map(c => c.name)
				.filter(Boolean);

			const merged = Array.from(new Set(catOptions || []));
			setCustomUserClassOptions(merged.map(name => ({ id: name, name })));
		} catch (e) {
			// ignore
		}
	};

	useEffect(() => {
		// Compute final options: prefer custom list if available, else fallback to system user classes (DASHBOARD)
		if (customUserClassOptions && customUserClassOptions.length > 0) {
			setUserClassOptions(customUserClassOptions);
		} else {
			const filtered = (allUserClasses || []).filter(u => u.module === 'DASHBOARD');
			setUserClassOptions(filtered);
		}
	}, [allUserClasses, customUserClassOptions]);

	useEffect(() => {
		loadUserClasses();
		loadCustomUserClassOptions();
	}, []);


	const fetchDataCate = async () => {
		await fetchDataCateWithPlan(currentSelectedPlan);
	};

	const fetchDataCateWithPlan = async (planData) => {
		let listSettingKH = await getAllPMVSettingKH();
		let ten_cot_new = null;
		if (planData?.bang) {
			let name = LIST_NHOM_NGANH.find(item => item.value == planData?.bang)?.name;
			if (listSettingKH.length > 0) {
				ten_cot_new = listSettingKH.find(e => e.name == name)?.data.find(e => e.field == planData?.cot)?.headerName;
			}
		}
		if (ten_cot_new) {
			setTen_cot_moi(ten_cot_new);
			const columnsList = JSON.parse(JSON.stringify(LIST_COLUMNS_NGANH));
			setListCol(columnsList.map(item => {
				if (item.field == planData?.cot) {
					item.headerName = ten_cot_new;
				}
				return item;
			}));
		} else {
			setTen_cot_moi(planData?.cot);
			setListCol(JSON.parse(JSON.stringify(LIST_COLUMNS_NGANH)));
		}
		const data = await getAllPMVCategories();
		let settingsData = [];
		settingsData = await getAllPMVSettingKHFull();
		settingsData = settingsData.map(item => {
			let newValue;
			switch (item.name) {
				case 'Danh mục sản phẩm':
					newValue = 'sanpham';
					break;
				case 'Danh mục vùng/ khu vực':
					newValue = 'vung';
					break;
				case 'Danh mục kênh/ chuỗi':
					newValue = 'kenh';
					break;
				case 'Danh mục nhóm khách/ dự án':
					newValue = 'duan';
					break;
				default:
					break;
			}
			return {
				...item,
				value: newValue,
			};
		});
		setListPMVSettingKH(settingsData);
		let dataPlanDetail = await getAllPMVPlanDetail();
		dataPlanDetail = dataPlanDetail.filter(e => e.plan_id == planData?.id);
		setTopDownDetails(dataPlanDetail);

		// Get unique values from the selected column
		let uniqueValues = [...new Set(data
			.filter(e => e?.category_type == planData?.bang)
			.map(item => item[planData?.cot])
			.filter(Boolean),
		)].sort((a, b) => a - b);
		setListCateFiltered(uniqueValues);
	};

	// Modify handleAddTopDownDetail to remove category_id
	const handleAddTopDownDetail = async () => {
		const newDetail = {
			plan_id: currentSelectedPlan.id,
			level: null,
			benchmark: null,
			target: null,
		};
		await createNewPMVPlanDetail(newDetail);
		fetchDataCate();
	};

	// Modify handleTopDownDetailChange to handle level directly
	const handleTopDownDetailChange = async (id, field, value) => {
		const updatedDetails = topDownDetails.map(detail => {
			if (detail.id === id) {
				return { ...detail, [field]: value };
			}
			return detail;
		});

		const updatedDetail = updatedDetails.find(d => d.id === id);
		await updatePMVPlanDetail(updatedDetail);
		setTopDownDetails(updatedDetails);
	};

	const fetchDataPlan = async () => {
		const checkDuyet = await checkDuyetPMVPlan();
		setCheckDuyetPlan(checkDuyet);
		let data = await getAllPMVPlan();
		if (data && data.length > 0) {
			if (checkDuyet) {
				setListPlan(data);
			} else {
				setListPlan(data.sort((a, b) => {
					if (a.duyet === 'Đã duyệt') return -1;
					if (b.duyet === 'Đã duyệt') return 1;
					return 0;
				}));
			}

			setSelectedCard(data[0]);
			if (data.length > 0) {
				await fetchDataDeployment(data[0].id);
			}
		}

	};

	useEffect(() => {
		fetchDataCate();
	}, [selectedCard, listPlan]);

	const fetchDataDeployment = async (id) => {
		const listPMVDeployment = await getPMVDeploymentsByPlanId(id);
		setListPMVDeployment(listPMVDeployment.sort((a, b) => a.id - b.id));
	};

	useEffect(() => {
		// Chỉ load data nếu không có selectedPlanFromProps
		if (!selectedPlanFromProps) {
			fetchDataPlan();
		}
	}, [selectedPlanFromProps]);

	// Reload data khi selectedPlanFromProps thay đổi
	useEffect(() => {
		if (selectedPlanFromProps) {
			setSelectedCard(selectedPlanFromProps);
			// Gọi fetchDataCate với plan data cụ thể
			fetchDataCateWithPlan(selectedPlanFromProps);
			fetchDataDeployment(selectedPlanFromProps.id);
		}
	}, [selectedPlanFromProps]);

	useEffect(() => {
		if (selectedCard) {
			fetchDataDeployment(selectedCard.id);
		}
	}, [selectedCard]);

	const handleCancel = () => {
		setIsModalOpen(false);
		form.resetFields();
	};

	const handleOk = async () => {
		try {
			const values = await formData.validateFields();
			const newData = {
				plan_id: selectedCard.id,
				userClass: values.userClass,
				created_at: createTimestamp(),
				user_create: currentUser.email,
			};
			await createNewPMVDeployment(newData);
			await fetchDataDeployment(selectedCard.id);
			message.success('Thêm userclass thành công!');
			setIsModalOpen(false);
			formData.resetFields();
		} catch (error) {
			message.error('Vui lòng kiểm tra lại thông tin!');
		}
	};

	const showModal = () => setIsModalOpen(true);

	const showCreate = () => setShowCreateModal(true);

	const cancelCreate = () => setShowCreateModal(false);

	const handleOpenCDXP = () => setIsOpenCDXP(true);

	const cancelCDXP = () => {
		setIsOpenCDXP(false);
		setColumnSelected(null);
		setCateTypeSelected(null);
	};


	const handleSave = async () => {
		try {
			const values = await form.validateFields(); // Sử dụng await nên cần async

			const formattedValues = {
				...values,
				date_from: values.date_from ? values.date_from.format('DD/MM/YYYY') : '',
				date_to: values.date_to ? values.date_to.format('DD/MM/YYYY') : '',
				track_sku_details: values.topDown === true ? 'true' : 'false',
				created_at: createTimestamp(),
				user_create: currentUser.email,
			};

			await createNewPMVPlan(formattedValues);
			form.resetFields();
			await fetchDataPlan();
			message.success('Lưu dữ liệu thành công!');
			cancelCreate();
		} catch (error) {
			console.error('Lỗi khi lưu dữ liệu:', error);
			message.error('Lỗi khi gửi dữ liệu. Vui lòng thử lại!');
		}
	};


	const handleClick = (data) => {
		setSelectedCard(data);
	};

	const handleOpenChuKy = async (data) => {
		setSelectedDeployment(data);
		setOpenChuKy(true);
	};

	const setDeploymentStep = (deploymentId, step) => {
		setDeploymentStepById(prev => ({ ...prev, [deploymentId]: step }));
	};

	const getDeploymentStep = (deploymentId) => {
		return deploymentStepById[deploymentId] ?? 0;
	};

	const setDeploymentTotals = (deploymentId, totals) => {
		setDeploymentMetrics(prev => ({
			...prev,
			[deploymentId]: {
				benchmark: totals.benchmark || 0,
				target: totals.target || 0,
			}
		}));
	};

	const getDeploymentMetric = (deploymentId, field) => {
		return deploymentMetrics[deploymentId]?.[field];
	};

	const getDeploymentGrowth = (deploymentId) => {
		const benchmark = parseFloat(getDeploymentMetric(deploymentId, 'benchmark')) || 0;
		const target = parseFloat(getDeploymentMetric(deploymentId, 'target')) || 0;
		if (!benchmark || benchmark === 0) return '';
		return (((target - benchmark) / benchmark) * 100).toFixed(2);
	};

	// Create template table based on saved Configure Levels (dep.setup_config)
	const handleCreateTemplateTable = async (dep) => {
		try {
			if (!currentSelectedPlan?.id || !dep?.id) return;
			const levels = Array.isArray(dep.setup_config) ? dep.setup_config : [];
			if (levels.length === 0) {
				message.warning('Chưa có Configure Levels để tạo template');
				return;
			}

			const columns = levels.map(level => {
				const categoryType = level.category_type;
				const selectedGroup = level.selected_group;
				const categoryName = LIST_NHOM_NGANH.find(nn => nn.value === categoryType)?.name;
				const settingCategory = listPMVSettingKH.find(setting => setting.name === categoryName);
				if (settingCategory) {
					const selectedField = (settingCategory.data || []).find(item => item.field === selectedGroup);
					if (selectedField?.headerName) {
						return {
							columnName: selectedField.headerName,
							columnType: 'text'
						};
					}
				}
				return null;
			}).filter(Boolean);

			const fullColumns = [...columns, ...LIST_OBLIGATORY_COLUMN_TEMP_PLAN];
			const table = await createTemplateTable({ plan_id: currentSelectedPlan.id, deployment_id: dep.id });
			for (const column of fullColumns) {
				await createTemplateColumn({ ...column, tableId: table.id });
			}
			message.success('Đã tạo template thành công');
		} catch (e) {
			message.error('Tạo template thất bại');
		}
	};

	function handleChangeSelectTable(value) {
		setCateTypeSelected(value);

	}

	function handleChangeSelectColumn(value) {
		setColumnSelected(value);
	}

	function handleSaveCDKD() {
		if (!cateTypeSelected) {
			message.warning('Chưa chọn bảng dữ liệu');
			return;
		}
		if (!columnSelected) {
			message.warning('Chưa chọn cột dữ liệu');
			return;
		}
		try {
			updatePMVPlan({ ...currentSelectedPlan, bang: cateTypeSelected, cot: columnSelected }).then(e => {
				setSelectedCard(e.data);
			});

		} catch (error) {
			console.log(error);
		} finally {
			cancelCDXP();
		}
	}

	const calculateGrowth = (benchmark, target) => {
		if (!benchmark || !target || benchmark === 0) return '';
		return ((target - benchmark) / benchmark * 100).toFixed(2);
	};
	const handleDeleteTopDownDetail = async (id) => {
		try {
			await deletePMVPlanDetail(id);
			await fetchDataCate();
			message.success('Xóa thành công');
		} catch (error) {
			message.error('Xóa thất bại');
			console.error(error);
		}
	};
	const calculateSums = useMemo(() => {
		if (!topDownDetails?.length) return { sumBenchmark: 0, sumTarget: 0 };

		const sums = topDownDetails.reduce((acc, detail) => ({
			sumBenchmark: acc.sumBenchmark + (parseFloat(detail.benchmark) || 0),
			sumTarget: acc.sumTarget + (parseFloat(detail.target) || 0),
		}), { sumBenchmark: 0, sumTarget: 0 });

		return {
			sumBenchmark: Number(sums.sumBenchmark.toFixed(2)),
			sumTarget: Number(sums.sumTarget.toFixed(2)),
		};
	}, [topDownDetails]);


	const handleDuyet = () => {
		if (currentSelectedPlan) {
			if (checkDuyetPlan) {
				updatePMVPlan({ ...currentSelectedPlan, duyet: 'Đã duyệt' }).then(e => {
					fetchDataPlan();
				});
			} else {
				message.warning('Đã có 1 kế hoạch được duyệt. Bạn cần bỏ duyệt trước khi muốn duyệt một kế hoạch mới');
			}
		}
	};
	const handleBoDuyet = () => {
		if (currentSelectedPlan) {
			updatePMVPlan({ ...currentSelectedPlan, duyet: null }).then(e => {
				fetchDataPlan();
			});
		}
	};
	return (
		<>
			<>
				<Row gutter={16}>
					{/* Sidebar - List Plans */}
					{/* <Col span={4} className={viewStyles.sidebar}>
                        <div className={viewStyles.addButton}>
							<Button
								icon={<PlusOutlined />}
								type="dashed"
                                className={css.addButton}
								onClick={showCreate}
							>
								Thêm kế hoạch mới
							</Button>
						</div>
                        <div className={viewStyles.listTitle}>
                            <Text>Danh sách kế hoạch</Text>
						</div>
                        <div className={viewStyles.list}>
							{listPlan.map(value => (
								<div
									key={value.id}
									onClick={() => handleClick(value)}
                                    className={`${viewStyles.listItem} ${currentSelectedPlan?.id == value.id ? viewStyles.activeItem : ''}`}
								>
                                    <div style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}>
										<div>
                                            <h4 className={viewStyles.itemTitle}>{value.name}</h4>

                                            <div className={viewStyles.itemDates}>
                                                    <span className={viewStyles.itemDateLine}>{value.date_from} - {value.date_to}
                                                    </span>
                                            </div>
										</div>
										<div>
                                            <p className={viewStyles.itemStatus} style={{
                                                color: value.duyet && value.duyet == 'Đã duyệt' ? '#52c41a' : '#666',
                                            }}>{value.duyet && value.duyet == 'Đã duyệt' ? value.duyet : 'Nháp'}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</Col> */}

					{/* Main Content */}
					<Col span={24} className={viewStyles.main}>
						{/* Header with plan info and approve button */}
						<div className={viewStyles.header}>
							<div>
								<Title level={3} style={{ margin: 0 }}>{currentSelectedPlan?.name}</Title>
								<div style={{ marginTop: '8px' }}>
									<Text>Kì lập kế hoạch:
										Từ {currentSelectedPlan?.date_from} đến {currentSelectedPlan?.date_to}</Text>
								</div>
							</div>
							<div>
								{currentSelectedPlan && (
									<Button
										className={css.button_duyet}
										type={currentSelectedPlan?.duyet == 'Đã duyệt' ? 'default' : 'primary'}
										onClick={currentSelectedPlan?.duyet == 'Đã duyệt' ? handleBoDuyet : handleDuyet}
									>
										{currentSelectedPlan?.duyet == 'Đã duyệt' ? 'Đã duyệt' : 'Duyệt'}
									</Button>
								)}
							</div>
						</div>

						{/* Content */}
						<div className={css.headerContent}>
							{/* Layout 2 cột: Trái (3 sections) + Phải (Chi tiết) */}
							<Row gutter={16}>
								{/* Cột trái - 3 sections dọc */}
								<Col span={8}>
									{/* TOP-DOWN */}
									<div className={css.section} style={{ marginBottom: '16px' }}>
										<Title level={4} className={css.titleContainer}>
											<span className={css.titleTextItem}>TOP-DOWN</span>
										</Title>
										<div style={{
											display: 'flex',
											alignItems: 'center',
											gap: '16px',
											padding: '16px',
											backgroundColor: '#f8f9fa',
											borderRadius: '8px',
											border: '1px solid #e9ecef'
										}}>
											<div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
												<label style={{
													fontWeight: '600',
													fontSize: '14px',
													minWidth: '60px'
												}}>
													Mục tiêu:
												</label>
												<InputNumber
													style={{ width: '100%' }}
													placeholder="Nhập mục tiêu tổng"
													value={currentSelectedPlan?.top_down_target || null}
													onChange={async (value) => {
														try {
															const updatedPlan = await updatePMVPlan({
																...currentSelectedPlan,
																top_down_target: value
															});
															// Cập nhật state nội bộ
															setSelectedCard(updatedPlan.data);
															// Thông báo cho parent component
															if (onPlanUpdate) {
																onPlanUpdate(updatedPlan.data);
															}
															// Trigger re-render để đồng bộ với parent
															await fetchDataCateWithPlan(updatedPlan.data);
														} catch (error) {
															console.error('Error updating plan:', error);
															message.error('Không thể cập nhật dữ liệu');
														}
													}}
													formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
													parser={value => value.replace(/\$\s?|(,*)/g, '')}
												/>
											</div>
										</div>
									</div>

									{/* CHÊNH LỆCH */}
									<div className={css.section} style={{ marginBottom: '16px' }}>
										<Title level={4} className={css.titleContainer}>
											<span className={css.titleTextItem}>CHÊNH LỆCH</span>
										</Title>
										<div style={{
											display: 'flex',
											alignItems: 'center',
											gap: '16px',
											padding: '16px',
											backgroundColor: (() => {
												const topDownTarget = currentSelectedPlan?.top_down_target || 0;
												const bottomUpTotal = listPMVDeployment.reduce((sum, dep) => {
													return sum + (getDeploymentMetric(dep.id, 'target') || 0);
												}, 0);
												const difference = bottomUpTotal - topDownTarget;
												return difference > 0 ? '#d4edda' : difference < 0 ? '#f8d7da' : '#f8f9fa';
											})(),
											borderRadius: '8px',
											border: `1px solid ${(() => {
												const topDownTarget = currentSelectedPlan?.top_down_target || 0;
												const bottomUpTotal = listPMVDeployment.reduce((sum, dep) => {
													return sum + (getDeploymentMetric(dep.id, 'target') || 0);
												}, 0);
												const difference = bottomUpTotal - topDownTarget;
												return difference > 0 ? '#c3e6cb' : difference < 0 ? '#f5c6cb' : '#dee2e6';
											})()}`
										}}>
											<div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
												<label style={{
													fontWeight: '600',
													fontSize: '14px',
													minWidth: '60px'
												}}>
													Chênh lệch:
												</label>
												<Input
													style={{ width: '100%' }}
													readOnly
													value={(() => {
														const topDownTarget = currentSelectedPlan?.top_down_target || 0;
														const bottomUpTotal = listPMVDeployment.reduce((sum, dep) => {
															return sum + (getDeploymentMetric(dep.id, 'target') || 0);
														}, 0);
														return (bottomUpTotal - topDownTarget).toLocaleString();
													})()}
												/>
											</div>
										</div>
									</div>

									{/* TỔNG BOTTOM-UP */}
									<div className={css.section}>
										<Title level={4} className={css.titleContainer}>
											<span className={css.titleTextItem}>TỔNG BOTTOM-UP</span>
										</Title>
										
										{/* Tổng */}
										<div style={{
											display: 'flex',
											alignItems: 'center',
											gap: '16px',
											padding: '16px',
											backgroundColor: '#e3f2fd',
											borderRadius: '8px',
											border: '1px solid #bbdefb',
											marginBottom: '12px'
										}}>
											<div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
												<label style={{
													fontWeight: '600',
													fontSize: '14px',
													minWidth: '60px'
												}}>
													Tổng:
												</label>
												<Input
													style={{ width: '100%' }}
													readOnly
													value={(() => {
														const bottomUpTotal = listPMVDeployment.reduce((sum, dep) => {
															return sum + (getDeploymentMetric(dep.id, 'target') || 0);
														}, 0);
														return bottomUpTotal.toLocaleString();
													})()}
												/>
											</div>
										</div>

										{/* Chi tiết từng deployment */}
										<div>
											{listPMVDeployment.map((dep, index) => (
												<div key={dep.id} style={{
													display: 'flex',
													alignItems: 'center',
													gap: '12px',
													padding: '8px 12px',
													backgroundColor: '#f8f9fa',
													borderRadius: '6px',
													border: '1px solid #e9ecef',
													marginBottom: '6px'
												}}>
													<div style={{
														minWidth: '20px',
														textAlign: 'center',
														fontWeight: '600',
														color: '#666',
														fontSize: '12px'
													}}>
														{index + 1}
													</div>
													<div style={{ flex: 1, minWidth: 0 }}>
														<div style={{
															fontWeight: '500',
															fontSize: '13px',
															color: '#333',
															marginBottom: '2px'
														}}>
															{dep.userClass || 'Chưa có tên'}
														</div>
														<div style={{
															fontSize: '11px',
															color: '#666'
														}}>
														</div>
													</div>
													<div style={{
														minWidth: '80px',
														textAlign: 'right'
													}}>
														<div style={{
															fontWeight: '600',
															fontSize: '13px',
															color: '#1890ff'
														}}>
															{(getDeploymentMetric(dep.id, 'target') || 0).toLocaleString()}
														</div>
														<div style={{
															fontSize: '10px',
															color: '#999'
														}}>
															Mục tiêu
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								</Col>

								{/* Cột phải - Chi tiết BOTTOM-UP */}
								<Col span={16}>
									<div className={css.section}>
										<Title level={4} className={css.titleContainer}>
											<span className={css.titleTextItem}>CHI TIẾT BOTTOM-UP</span>
											<Button onClick={showModal} icon={<PlusOutlined />} type="dashed"
												className={css.addButton}></Button>
										</Title>
										{listPMVDeployment.map(dep => (
											<Card key={dep.id} size="small" style={{ marginBottom: 12, boxShadow: '1px 1px 2px 1px rgba(0,0,0,0.3)' }}>
												{/* Header Row: user class + inline metrics */}
												<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
													<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
														<h3 style={{ fontWeight: 600, fontSize: '14px' }}>Đơn vị: {dep.userClass || ''}</h3>
														<div className={css.infoSectionButton} onClick={() => handleOpenChuKy(dep)}>
															<span>{dep.config_period ? 'Đã có chu kỳ' : 'Tùy biến chu kỳ'}</span>
														</div>
													</div>
													<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
														{/* <span className={css.label} style={{ fontSize: '12px' }}>Benchmark</span>
														<InputNumber style={{ width: 100 }} readOnly value={getDeploymentMetric(dep.id, 'benchmark')} /> */}
														<span className={css.label} style={{ fontSize: '12px' }}>Mục tiêu</span>
														<InputNumber style={{ width: 100 }} readOnly value={getDeploymentMetric(dep.id, 'target')} />
														{/* <span className={css.label} style={{ fontSize: '12px' }}>Tăng giảm</span>
														<Input style={{ width: 90 }} readOnly suffix="%" value={getDeploymentGrowth(dep.id)} /> */}
													</div>
												</div>

												{/* Custom Steps Navigation */}
												<div style={{ marginBottom: 12 }}>
													<div style={{ 
														display: 'flex', 
														alignItems: 'center', 
														gap: '8px',
														flexWrap: 'wrap'
													}}>
														{[
															{ title: 'Thiết lập mức độ chi tiết', step: 0 },
															{ title: 'Lên số kế hoạch', step: 1 },
															{ title: 'Phân bổ chu kỳ', step: 2 },
															{ title: 'Template nhập thực hiện', step: 3 }
														].map((item, index) => (
															<React.Fragment key={index}>
																<div 
																	style={{
																		display: 'flex',
																		alignItems: 'center',
																		cursor: 'pointer',
																		padding: '8px 12px',
																		borderRadius: '6px',
																		transition: 'all 0.2s'
																	}}
																	onClick={() => setDeploymentStep(dep.id, item.step)}
																>
																	<span style={{
																		fontWeight: '600',
																		fontSize: '13px',
																		color: getDeploymentStep(dep.id) === item.step ? '#3A5BC6' : '#262626'
																	}}>
																		{item.title}
																	</span>
																</div>
																{index < 3 && (
																	<div style={{ 
																		fontSize: '16px', 
																		color: '#262626',
																		fontWeight: 'bold'
																	}}>
																		→
																	</div>
																)}
															</React.Fragment>
														))}
													</div>
												</div>

												{/* Step Content */}
												<div>
													{(getDeploymentStep(dep.id) === 0 || getDeploymentStep(dep.id) === 1) && (
														<BottomDown
															selectedCard={currentSelectedPlan}
															listPMVDeployment={listPMVDeployment}
															deployment={dep}
															plan={currentSelectedPlan}
															activeStep={getDeploymentStep(dep.id)}
															onMetricsChange={setDeploymentTotals}
														/>
													)}
													{getDeploymentStep(dep.id) === 2 && (
														<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
															<Button onClick={() => handleOpenChuKy(dep)}>Mở tùy biến chu kỳ</Button>
														</div>
													)}
													{getDeploymentStep(dep.id) === 3 && (
														<div>
															<Button onClick={() => handleCreateTemplateTable(dep)}>Tạo template</Button>
														</div>
													)}
												</div>

												{/* Step Controls */}
												<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
													<Button disabled={getDeploymentStep(dep.id) === 0} onClick={() => setDeploymentStep(dep.id, Math.max(0, getDeploymentStep(dep.id) - 1))}>Trước</Button>
													<Button type="primary" onClick={() => setDeploymentStep(dep.id, Math.min(3, getDeploymentStep(dep.id) + 1))}>Tiếp</Button>
												</div>
											</Card>
										))}
									</div>
								</Col>
							</Row>
						</div>
					</Col>
				</Row>
			</>


			<Modal
				title="Nhập thông tin"
				open={showCreateModal}
				onCancel={() => {
					cancelCreate();
					form.resetFields();
				}}
				onOk={handleSave}
			>
				<Form form={form} layout="vertical">
					<Form.Item
						label="Tên"
						name="name"
						rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
					>
						<Input placeholder="Nhập tên" />
					</Form.Item>

					<Form.Item
						label="Thời gian bắt đầu"
						name="date_from"
						initialValue={dayjs()}
						rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}
					>
						<DatePicker
							format="DD/MM/YYYY"
							style={{ width: '100%' }}
							placeholder="Chọn thời gian bắt đầu"
						/>
					</Form.Item>

					<Form.Item
						label="Thời gian kết thúc"
						name="date_to"
						initialValue={dayjs()}
						rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc!' }]}
					>
						<DatePicker
							format="DD/MM/YYYY"
							style={{ width: '100%' }}
							placeholder="Chọn thời gian kết thúc"
						/>
					</Form.Item>

					<Form.Item
						name="topDown"
						valuePropName="checked"
					>
						<Checkbox>TopDown</Checkbox>
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title="Thêm bottom-up mới"
				open={isModalOpen}
				onOk={handleOk}
				onCancel={handleCancel}
				okText="Lưu"
				cancelText="Hủy"
			>
				<Form form={formData} layout="vertical">
					<Form.Item
						label="Chọn đơn vị thực thi"
						name="userClass"
						rules={[{ required: true, message: 'Vui lòng chọn đơn vị thực thi!' }]}
					>
						<Select placeholder="Chọn đơn vị thực thi">
							{userClassOptions.map((item) => (
								<Option key={item.id || item.name} value={item.name}>
									{item.name}
								</Option>
							))}
						</Select>
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title={'Chọn điểm xuất phát'}
				open={isOpenCDXP}
				onCancel={cancelCDXP}
				okText={'Lưu'}
				cancelText={'Huỷ'}
				onOk={handleSaveCDKD}
			>
				<div>
					<Typography>Chọn danh mục</Typography>
					<Select
						onChange={(value) => handleChangeSelectTable(value)}
						allowClear
						value={cateTypeSelected || null}
						options={listPMVSettingKH
							.filter(i => i.isUse)
							.map(e => {
								return {
									key: e.value,
									value: e.value,
									label: e.name,
								};
							})
						}
						style={{ width: '70%' }}
					/>
				</div>
				<div>
					<Typography>Chọn cột dữ liệu</Typography>
					<Select
						onChange={(value) => handleChangeSelectColumn(value)}
						allowClear
						value={columnSelected || null}
						options={listPMVSettingKH
							.find(i => i.value == cateTypeSelected)?.data
							.map(e => {
								return {
									key: e.field,
									value: e.field,
									label: e.headerName,
								};
							})
						}
						style={{ width: '70%' }}
					/>
				</div>
			</Modal>

			{openChuKy && <ChuKy isOpen={openChuKy} setIsOpen={setOpenChuKy} selectedDeployment={selectedDeployment} />}


		</>
	)
		;
}
