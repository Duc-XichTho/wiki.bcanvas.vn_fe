import { v4 as uuidv4 } from 'uuid';
import css from "./CreateUserClass.module.css";
import { useState, useEffect } from "react";
import { Input, Button, Spin, message } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import ChainElement from './ChainElement'
import TableTransferUser from "./TableTransferUser";
import { API_RESPONSE_CODE } from "../../../../../../../CONST";
import { createUserClass } from "../../../../../../../apis/userClassService";
import { getSettingByType } from '../../../../../../../apis/settingService';
import { getAllCompany } from '../../../../../../../apis/companyService.jsx';

const CreateUserClass = ({ onClose, fetchAllUserClass, setStatusCreateUserClass, setResponseMessage }) => {
	const [loading, setLoading] = useState(false);
	const [messageApi, contextHolder] = message.useMessage();
	const [userClassName, setUserClassName] = useState("");
	const [targetKeys, setTargetKeys] = useState([]);
	const [selectedApps, setSelectedApps] = useState([]);
	const [appList, setAppList] = useState([]);
	const [statusDisabled, setStatusDisabled] = useState(false);
	const [listCompany, setListCompany] = useState([]);
	const [checkedCompanyIds, setCheckedCompanyIds] = useState([]);

	useEffect(() => {
		const fetchApps = async () => {
			try {
				// Load regular apps
				const setting = await getSettingByType('DASHBOARD_SETTING');
				let regularApps = [];
				if (setting && setting.setting) {
					regularApps = setting.setting.filter(app => app.id != "adminApp");
				}

				// Load trial apps
				let trialApps = [];
				try {
					const trialSetting = await getSettingByType('DASHBOARD_TRIAL_APPS');
					if (trialSetting && Array.isArray(trialSetting.setting)) {
						trialApps = trialSetting.setting;
					}
				} catch (error) {
					// Ignore if trial apps setting doesn't exist
				}

				// Filter active trial apps (not expired)
				const isTrialExpired = (trialApp) => {
					if (!trialApp?.endDate) return false;
					return new Date() > new Date(trialApp.endDate);
				};

				const activeTrialApps = trialApps.filter(trial => 
					trial.isActive !== false && !isTrialExpired(trial)
				);

				// Get existing app IDs to avoid duplicates
				const existingAppIds = regularApps.map(app => app.id);

				// Add trial apps that are not already in the regular apps list
				const newTrialApps = activeTrialApps
					.filter(trial => !existingAppIds.includes(trial.id))
					.map(trial => ({
						id: trial.id,
						name: trial.name,
						description: trial.description,
						tag: 'Trial',
						isTrial: true,
						trialEndDate: trial.endDate
					}));

				// Combine regular apps with new trial apps
				const combinedApps = [...regularApps, ...newTrialApps];
				setAppList(combinedApps);
			} catch (error) {
				setAppList([]);
			}
		};
		fetchApps();
	}, []);

	useEffect(() => {
		// Lấy danh sách công ty
		const fetchCompanies = async () => {
			try {
				const response = await getAllCompany();
				setListCompany([...response, { id: 99999999, name: 'HQ', code: 'HQ' }]);
			} catch (error) {
				setListCompany([]);
			}
		};
		fetchCompanies();
	}, []);

	useEffect(() => {
		// Nếu bỏ chọn app fdr thì clear checkedCompanyIds
		if (!selectedApps.includes('fdr')) setCheckedCompanyIds([]);
	}, [selectedApps]);

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	const showNotification = (type, content) => {
		messageApi.open({
			type,
			content,
		});
	};

	const handleCheckboxChange = (code) => {
		if (code === 'HQ') {
			setCheckedCompanyIds(['HQ']);
		} else {
			setCheckedCompanyIds((prev) => {
				const filtered = prev.filter((c) => c !== 'HQ');
				return filtered.includes(code)
					? filtered.filter((c) => c !== code)
					: [...filtered, code];
			});
		}
	};

	const handleCreateUserClass = async () => {
		try {
			setLoading(true);
			const transformedData = {
				id: uuidv4(),
				name: userClassName,
				userAccess: targetKeys,
				stepAccess: selectedApps, // Save apps array to stepAccess
				module: 'DASHBOARD',
				info: selectedApps.includes('fdr') ? checkedCompanyIds : undefined,
			};
			const response = await createUserClass(transformedData);
			await delay(2000);
			switch (response.code) {
				case API_RESPONSE_CODE.CREATED:
					setStatusCreateUserClass(true);
					setResponseMessage(response.message);
					await fetchAllUserClass();
					onClose();
					break;
				case API_RESPONSE_CODE.NOT_CREATED:
					showNotification("warning", response.message);
					break;
				default:
					showNotification("error", "Có lỗi xảy ra");
					break;
			}
		} catch (error) {
			console.error("Error:", error);
			showNotification("error", "Có lỗi xảy ra");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setStatusDisabled(
			!userClassName ||
			targetKeys.length === 0
		);
	}, [userClassName, targetKeys]);

	const handleAppCheckbox = (id) => {
		setSelectedApps((prev) =>
			prev.includes(id) ? prev.filter((appId) => appId !== id) : [...prev, id]
		);
	};

	return (
		<>
			{contextHolder}
			<div className={css.main}>
				<div className={css.container}>
					<div className={css.header}>Tạo User Class</div>
					<div className={css.info}>
						<div className={css.userclassname}>
							<Input
								style={{ width: "45%" }}
								size="large"
								placeholder="Nhập Tên"
								value={userClassName}
								onChange={(e) => setUserClassName(e.target.value)}
							/>
						</div>
						<div className={css.tranfer}>
							<TableTransferUser
								targetKeys={targetKeys}
								setTargetKeys={setTargetKeys}
							/>
						</div>
						<div className={css.appListSection}>
							<div style={{ fontWeight: 500, marginBottom: 8 }}>Danh sách ứng dụng</div>
							{appList.length === 0 ? (
								<div>Không có ứng dụng nào</div>
							) : (
								appList.map(app => (
									<label key={app.id} style={{ display: 'block', marginBottom: 4 }}>
										<input
											type="checkbox"
											checked={selectedApps.includes(app.id)}
											onChange={() => handleAppCheckbox(app.id)}
										/>
										<span style={{ marginLeft: 8 }}>
											{app.name}
											{app.isTrial && (
												<span style={{ 
													marginLeft: 8, 
													fontSize: '11px', 
													color: '#1890ff',
													fontWeight: '500'
												}}>
													[TRIAL - Còn lại: {Math.ceil((new Date(app.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))} ngày]
												</span>
											)}
										</span>
									</label>
								))
							)}
						</div>
						{/* PHẦN CÀI ĐẶT TRUY CẬP CÔNG TY */}
						{selectedApps.includes('fdr') && (
							<div className={css.chainElement} style={{marginTop: 24}}>
								<fieldset className="checkbox-group">
									<legend className="checkbox-group-legend">Cài đặt truy cập công ty</legend>
									{listCompany && listCompany.map((company) => (
										<div className="checkbox" key={company.code}>
											<label className="checkbox-wrapper">
												<input
													type="checkbox"
													className="checkbox-input"
													id={company.code}
													name={'role'}
													checked={checkedCompanyIds.includes(company.code)}
													onChange={() => handleCheckboxChange(company.code)}
												/>
												<span className="checkbox-tile">
													<span className="checkbox-label">{company.name}</span>
												</span>
											</label>
										</div>
									))}
								</fieldset>
							</div>
						)}
					</div>
					<div className={css.footer}>
						<Button onClick={onClose}>HỦY BỎ</Button>
						<Button
							type="primary"
							disabled={statusDisabled}
							onClick={handleCreateUserClass}
						>
							{loading && <Spin indicator={<LoadingOutlined style={{ marginRight: '8px' }} />} />}
							TẠO MỚI
						</Button>
					</div>
				</div>
			</div>
		</>
	);
};

export default CreateUserClass;