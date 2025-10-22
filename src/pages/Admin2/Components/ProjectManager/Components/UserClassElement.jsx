import css from "./UserClassElement.module.css"
import { useEffect, useState } from 'react'
import { Table, Checkbox, Button, message, Popconfirm } from 'antd';
import { CaretRightOutlined, CaretDownOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getAllProgress } from '../../../../../apis/progressService.jsx';
import { getAllProgressStep } from '../../../../../apis/progressStepService.jsx';
import { getAllProgressTask } from '../../../../../apis/progressTaskService.jsx';
import { UsersRound, Link } from 'lucide-react';
import { API_RESPONSE_CODE } from "../../../../../CONST.js";
import { deleteUserClass } from "../../../../../apis/userClassService.jsx";
import UpdateUserClass from "./CRUD/Update/UpdateUserClass.jsx";
import { FileCheck2 } from 'lucide-react';
import { getAllUser } from "../../../../../apis/userService.jsx";
import { getSettingByType } from '../../../../../apis/settingService.jsx';
import { getAllCompany } from '../../../../../apis/companyService.jsx';
import { updateUserClass } from '../../../../../apis/userClassService.jsx';

const UserClassElement = ({
	userClassSelected,
	setUserClassSelected,
	fetchAllUserClass,
	setStatusDeleteUserClass,
	setResponseMessageDelete,
}) => {
	const [userAccess, setUserAccess] = useState([]);
	const [dataChain, setDataChain] = useState([]);
	const [checkedChainAndChild, setCheckedChainAndChild] = useState({
		task: []
	});
	const [expandedNodes, setExpandedNodes] = useState({});
	const [messageApi, contextHolder] = message.useMessage();
	const [showUpdateUserClass, setShowUpdateUserClass] = useState(false);
	const [statusUpdateUserClass, setStatusUpdateUserClass] = useState(false);
	const [responseMessage, setResponseMessage] = useState("");
	const [open, setOpen] = useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [listUser, setListUser] = useState([]);
	const [appList, setAppList] = useState([]);
	const [listCompany, setListCompany] = useState([]);
	const [checkedCompanyIds, setCheckedCompanyIds] = useState([]);
	const [savingCompany, setSavingCompany] = useState(false);

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	const showNotification = (type, content) => {
		messageApi.open({
			type,
			content,
		});
	};

	const fetchAllChainData = async () => {
		try {
			const allProgress = await getAllProgress();
			if (allProgress) {
				const progressWithSteps = await Promise.all(
					allProgress.map(async (progress) => {
						const steps = await getAllProgressStep(progress.id);
						const stepsWithTasks = await Promise.all(
							steps.map(async (step) => {
								const tasks = await getAllProgressTask(step.id);
								return { ...step, tasks };
							})
						);
						return { ...progress, steps: stepsWithTasks };
					})
				);
				setDataChain(progressWithSteps);
			}
		} catch (error) {
			console.log("Error:", error);
			showNotification("error", "Có lỗi xảy ra khi lấy dữ liệu Chain");
		}
	};

	const fetchAllUser = async () => {
		try {
			const response = await getAllUser();
			setListUser(response.result);
		} catch (error) {
			console.log("Error:", error);
			showNotification("error", "Có lỗi xảy ra khi lấy dữ liệu User");
		}
	};

	useEffect(() => {
		fetchAllUser();
		fetchAllChainData();
		// Fetch app list for displaying granted apps
		const fetchApps = async () => {
			try {
				const setting = await getSettingByType('DASHBOARD_SETTING');
				if (setting && setting.setting) {
					setAppList(setting.setting);
				}
			} catch (error) {
				setAppList([]);
			}
		};
		fetchApps();
	}, []);

	useEffect(() => {
		if (statusUpdateUserClass) {
			showNotification("success", responseMessage);
			setStatusUpdateUserClass(false);
		}
	}, [statusUpdateUserClass, responseMessage]);

	useEffect(() => {
		if (userClassSelected) {
			// Convert the existing task permissions to the new structure
			const taskPermissions = {
				task: userClassSelected.progressTaskAccess?.map(task => ({
					id: task.id,
					permissions: {
						confirm: task.permissions.confirm || false,
						approve1: task.permissions.approve1 || false,
						approve2: task.permissions.approve2 || false
					}
				})) || []
			};
			setCheckedChainAndChild(taskPermissions);
		}
	}, [userClassSelected]);

	useEffect(() => {
		if (userClassSelected?.userAccess?.length > 0 && listUser?.length > 0) {
			const additionalUserAccess = userClassSelected.userAccess.map(email =>
				listUser.find(user => user.email === email)
			);
			setUserAccess(additionalUserAccess);
		}
	}, [userClassSelected, listUser]);

	useEffect(() => {
		// Lấy danh sách công ty
		const fetchCompanies = async () => {
			try {
				const response = await getAllCompany();
				setListCompany([...response, { id: 99999999, name: "HQ", code: "HQ" }]);
			} catch (error) {
				setListCompany([]);
			}
		};
		fetchCompanies();
	}, []);

	useEffect(() => {
		// Đồng bộ checkedCompanyIds với userClassSelected.info nếu có
		if (userClassSelected?.info) {
			setCheckedCompanyIds(userClassSelected.info);
		}
	}, [userClassSelected]);

	const handleCheckboxChange = (code) => {
		if (code === "HQ") {
			setCheckedCompanyIds(["HQ"]);
		} else {
			setCheckedCompanyIds((prev) => {
				const filtered = prev.filter((c) => c !== "HQ");
				return filtered.includes(code)
					? filtered.filter((c) => c !== code)
					: [...filtered, code];
			});
		}
	};

	const handleSaveCompanyAccess = async () => {
		setSavingCompany(true);
		try {
			const data = { ...userClassSelected, info: checkedCompanyIds };
			const response = await updateUserClass(userClassSelected.id, data);
			if (response.code === API_RESPONSE_CODE.UPDATED) {
				showNotification("success", "Cập nhật truy cập công ty thành công");
				setUserClassSelected({ ...userClassSelected, info: checkedCompanyIds });
			} else {
				showNotification("error", response.message || "Có lỗi xảy ra");
			}
		} catch (e) {
			showNotification("error", "Có lỗi xảy ra khi lưu truy cập công ty");
		} finally {
			setSavingCompany(false);
		}
	};

	const columns = [
		{
			title: "Thông tin",
			dataIndex: "info",
			render: (_, user) => (
				<div className={css.userInfo}>
					{user && <>
						<img src={user.picture} alt={user.name} className={css.userAvatar} />
						<div className={css.userDetails}>
							<div className={css.userName}>{user.name}</div>
							<div className={css.userEmail}>{user.email}</div>
						</div>
					</>}
				</div>
			),
		},
		{
			width: '25%',
			title: 'Chức vụ',
			dataIndex: 'position',
			render: (_, user) => user?.info?.position?.label || 'Chưa có',
		},
		{
			width: '25%',
			title: 'Phòng ban',
			dataIndex: 'department',
			render: (_, user) => user?.info?.department?.label || "Chưa có",
		},
	];

	const handleOk = async () => {
		try {
			setConfirmLoading(true);
			const response = await deleteUserClass(userClassSelected.id);
			await delay(2000);

			switch (response.code) {
				case API_RESPONSE_CODE.DELETED:
					setOpen(false);
					setConfirmLoading(false);
					setStatusDeleteUserClass(true);
					setResponseMessageDelete(response.message);
					await fetchAllUserClass();
					break;
				case API_RESPONSE_CODE.NOT_FOUND:
					showNotification("warning", response.message);
					break;
				default:
					showNotification("error", "Có lỗi xảy ra");
					break;
			}
		} catch (error) {
			console.log("Error:", error);
			showNotification("error", "Có lỗi xảy ra");
		} finally {
			setConfirmLoading(false);
		}
	};

	const handleCancel = () => {
		setOpen(false);
	};

	const toggleNode = (nodeId) => {
		setExpandedNodes((prev) => ({
			...prev,
			[nodeId]: !prev[nodeId],
		}));
	};

	const renderCheckboxGroup = (taskId) => {
		const node = checkedChainAndChild.task.find(item => item.id === taskId);
		const permissions = node?.permissions || {
			confirm: true,
			approve1: false,
			approve2: false
		};

		return (
			<div className={css.checkboxGroup}>
				<Checkbox checked={permissions.confirm} disabled={!(permissions.confirm)}>
					<FileCheck2 size={20} />
				</Checkbox>
				<Checkbox checked={permissions.approve1} disabled={!(permissions.approve1)}>
					<img src="/Approve1.svg" alt="" width={25} height={25} />
				</Checkbox>
				<Checkbox checked={permissions.approve2} disabled={!(permissions.approve2)}>
					<img src="/Approve2.svg" alt="" width={25} height={25} />
				</Checkbox>
			</div>
		);
	};

	const renderTreeNode = (node, level, depth = 0) => {
		const nodeId = node.id;
		const isExpanded = expandedNodes[nodeId];
		const hasChildren = level === "chain" ? node.steps?.length > 0 : level === "step" && node.tasks?.length > 0;

		return (
			<div key={nodeId} className={css.treeNode} style={{ marginLeft: `${depth * 8}px` }}>
				<div className={css.nodeHeader}>
					{hasChildren && (
						<span className={css.expandIcon} onClick={() => toggleNode(nodeId)}>
							{isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
						</span>
					)}
					<span className={css.nodeName}>{level === "chain" ? node.name : node.title.split("|||")[0]?.trim()}</span>
					{level === "task" && renderCheckboxGroup(nodeId)}
				</div>

				{hasChildren && isExpanded && (
					<div className={css.nodeChildren}>
						{level === "chain" && node.steps?.map((step) => renderTreeNode(step, "step", depth + 1))}
						{level === "step" && node.tasks?.map((task) => renderTreeNode(task, "task", depth + 1))}
					</div>
				)}
			</div>
		);
	};

	const chuThichRender = [
		{ icon: <FileCheck2 />, label: "Xác nhận" },
		{ icon: <img src="/Approve1.svg" alt="" width={20} height={20} />, label: "Duyệt 1" },
		{ icon: <img src="/Approve2.svg" alt="" width={20} height={20} />, label: "Duyệt 2" },
	];

	return (
		<>
			{contextHolder}
			<div className={css.main}>
				<div className={css.container}>
					<div className={css.header}>
						<div className={css.headerTitle}>
							<span>Thông tin User Class</span>
						</div>
						<div className={css.userClassName}>
							<span>{userClassSelected?.name}</span>
						</div>
						<div className={css.actionUpdate}>
							<Button
								type="primary"
								shape="circle"
								icon={<EditOutlined />}
								onClick={() => setShowUpdateUserClass(true)}
							/>
							<Popconfirm
								title="Xóa User Class"
								description="Bạn có chắc chắn muốn xóa không?"
								okText="Xóa"
								cancelText="Hủy"
								open={open}
								onConfirm={handleOk}
								okButtonProps={{ loading: confirmLoading }}
								onCancel={handleCancel}
								placement="bottomLeft"
							>
								<Button
									danger
									shape="circle"
									icon={<DeleteOutlined />}
									onClick={() => setOpen(true)}
								/>
							</Popconfirm>
						</div>
					</div>

					<div className={css.body}>
						<div className={css.userAccess}>
							<div className={css.titleUserAccess}>
								<UsersRound />
								<span>Danh sách Nhân viên</span>
							</div>
							<Table
								columns={columns}
								dataSource={userAccess}
								pagination={{
									pageSize: 30,
								}}
							/>
						</div>

						<div className={css.chainAccess}>
							<div className={css.titleChainAccess}>
								<div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
									<Link />
									<span>Danh sách Các app được cấp quyền</span>
								</div>
							</div>
							<div className={css.valueChainAccess}>
								{userClassSelected?.stepAccess && userClassSelected.stepAccess.length > 0 ? (
									<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
										{userClassSelected.stepAccess.map(appId => {
											const app = appList.find(a => a.id === appId);
											return app ? (
												<div key={appId} className="checkbox-wrapper" style={{display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 6, padding: '6px 14px', fontWeight: 500}}>
													{/* Có thể thêm icon app nếu muốn */}
													<span className="checkbox-label">{app.name}</span>
												</div>
											) : null;
										})}
									</div>
								) : (
									<span>Không có app nào được cấp quyền</span>
								)}
							</div>
						</div>
						{/* PHẦN CÀI ĐẶT TRUY CẬP CÔNG TY */}
						{userClassSelected?.stepAccess?.includes('fdr') && (
							<div className={css.chainElement} style={{marginTop: 24}}>
								<fieldset className="checkbox-group">
									<legend className="checkbox-group-legend">Danh sách công ty được truy cập</legend>
									{userClassSelected?.info && userClassSelected.info.length > 0 ? (
										<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
											{userClassSelected.info.map(code => {
												const company = listCompany.find(c => c.code === code);
												return (
													<div key={code} className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 6, padding: '6px 14px', fontWeight: 500, marginBottom: 4 }}>
														{/* Có thể thêm icon nếu muốn, ví dụ: <span style={{marginRight: 6}}><FcDepartment /></span> */}
														<span className="checkbox-label">{company ? company.name : code}</span>
													</div>
												);
											})}
										</div>
									) : (
										<div style={{color: '#888', fontStyle: 'italic', marginTop: 8}}>
											Chưa có công ty nào được cấp quyền cho FDR - Finance Dimension Reporting
										</div>
									)}
								</fieldset>
							</div>
						)}
					</div>
				</div>
			</div>

			{showUpdateUserClass && (
				<UpdateUserClass
					onClose={() => setShowUpdateUserClass(false)}
					setStatusUpdateUserClass={setStatusUpdateUserClass}
					setResponseMessage={setResponseMessage}
					fetchAllUserClass={fetchAllUserClass}
					userClassSelected={userClassSelected}
					setUserClassSelected={setUserClassSelected}
				/>
			)}
		</>
	);
};

export default UserClassElement;
