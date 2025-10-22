import { useState, useEffect } from "react";
import { Checkbox, Switch, Skeleton, message } from "antd";
import { CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";
import css from "./ChainElement.module.css";
import { getAllProgress } from "../../../../../../../apis/progressService.jsx";
import { getAllProgressStep } from "../../../../../../../apis/progressStepService.jsx";
import { getAllProgressTask } from "../../../../../../../apis/progressTaskService.jsx";
import { FileCheck2 } from 'lucide-react';

const ChainElement = ({
	checkedChainAndChild,
	setCheckedChainAndChild,
}) => {
	const [messageApi, contextHolder] = message.useMessage();
	const [showSkeleton, setShowSkeleton] = useState(false);
	const [dataChain, setDataChain] = useState([]);
	const [expandedNodes, setExpandedNodes] = useState({});

	const showNotification = (type, content) => {
		messageApi.open({
			type,
			content,
		});
	};

	const fetchAllChainTemplateStepSubStep = async () => {
		try {
			setShowSkeleton(true);
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
			console.error("Error:", error);
			showNotification("error", "Có lỗi xảy ra từ Server");
		} finally {
			setShowSkeleton(false);
		}
	};

	useEffect(() => {
		fetchAllChainTemplateStepSubStep();
	}, []);

	const initialPermissions = {
		confirm: false,
		approve1: false,
		approve2: false,
	};

	const handleCheckboxChange = (taskId, permission, checked) => {
		const newCheckedState = { ...checkedChainAndChild };
		const taskNode = newCheckedState.task.find(item => item.id === taskId) || {
			id: taskId,
			permissions: { ...initialPermissions }
		};

		if (!newCheckedState.task.find(item => item.id === taskId)) {
			newCheckedState.task.push(taskNode);
		}

		taskNode.permissions[permission] = checked;
		setCheckedChainAndChild(newCheckedState);
	};

	const handlePermissionSwitch = (checked, permissionsToUpdate) => {
		const newCheckedState = { ...checkedChainAndChild };
		const allTasks = [];

		// Collect all tasks from the chain
		dataChain.forEach(chain => {
			chain.steps.forEach(step => {
				step.tasks.forEach(task => {
					allTasks.push(task);
				});
			});
		});

		// Update permissions for all tasks
		allTasks.forEach(task => {
			let taskNode = newCheckedState.task.find(item => item.id === task.id);
			if (!taskNode) {
				taskNode = { id: task.id, permissions: { ...initialPermissions } };
				newCheckedState.task.push(taskNode);
			}
			permissionsToUpdate.forEach(permission => {
				taskNode.permissions[permission] = checked;
			});
		});

		setCheckedChainAndChild(newCheckedState);
	};

	const handleMasterSwitch = (checked) => {
		handlePermissionSwitch(checked, Object.keys(initialPermissions));
	};

	const handleConfirmSwitch = (checked) => {
		handlePermissionSwitch(checked, ["confirm"]);
	};

	const handleApprove1Switch = (checked) => {
		handlePermissionSwitch(checked, ["approve1"]);
	};

	const handleApprove2Switch = (checked) => {
		handlePermissionSwitch(checked, ["approve2"]);
	};

	const renderCheckboxGroup = (taskId) => {
		const node = checkedChainAndChild?.task?.find(item => item.id === taskId);
		const permissions = node?.permissions || initialPermissions;
		console.log("permissions", permissions);

		const checkboxConfig = [
			{ key: "confirm", label: <FileCheck2 size={20} /> },
			{ key: "approve1", label: <img src="/Approve1.svg" alt="" width={25} height={25} /> },
			{ key: "approve2", label: <img src="/Approve2.svg" alt="" width={25} height={25} /> },
		];

		return (
			<div className={css.checkboxGroup}>
				{checkboxConfig.map(({ key, label }) => (
					<Checkbox
						key={key}
						onChange={(e) => handleCheckboxChange(taskId, key, e.target.checked)}
						checked={permissions[key] || false}
					>
						{label}
					</Checkbox>
				))}
			</div>
		);
	};

	const toggleNode = (nodeId) => {
		setExpandedNodes((prev) => ({
			...prev,
			[nodeId]: !prev[nodeId],
		}));
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
					<span className={css.nodeName}>{level === "chain" ? node.name : node.title}</span>
					{level === "task" && renderCheckboxGroup(nodeId)}
				</div>

				{hasChildren && isExpanded && (
					<div className={css.nodeChildren}>
						{level === "chain" && node.steps && node.steps.map((step) => renderTreeNode(step, "step", depth + 1))}
						{level === "step" && node.tasks && node.tasks.map((task) => renderTreeNode(task, "task", depth + 1))}
					</div>
				)}
			</div>
		);
	};

	useEffect(() => {
		const initialState = {
			task: []
		};

		// Only initialize task permissions
		dataChain.forEach((chain) => {
			if (chain.steps) {
				chain.steps.forEach((step) => {
					if (step.tasks) {
						step.tasks.forEach((task) => {
							initialState.task.push({
								id: task.id,
								permissions: { ...initialPermissions },
							});
						});
					}
				});
			}
		});

		setCheckedChainAndChild(initialState);
	}, [dataChain]);

	const chuThichRender = [
		{ icon: <FileCheck2 />, label: "Xác nhận" },
		{ icon: <img src="/Approve1.svg" alt="" width={20} height={20} />, label: "Duyệt 1" },
		{ icon: <img src="/Approve2.svg" alt="" width={20} height={20} />, label: "Duyệt 2" },
	];

	const switchRender = [
		{ icon: <FileCheck2 />, label: "Confirm", onChange: handleConfirmSwitch },
		{ icon: <img src="/Approve1.svg" alt="" width={25} height={25} />, label: "Approve 1", onChange: handleApprove1Switch },
		{ icon: <img src="/Approve2.svg" alt="" width={25} height={25} />, label: "Approve 2", onChange: handleApprove2Switch },
		{ icon: <span>Master</span>, label: "Master", onChange: handleMasterSwitch, checkedChildren: "🔓", unCheckedChildren: "OFF" },
	];

	return (
		<>
			{contextHolder}
			{showSkeleton ? (
				<div style={{ display: "flex", alignItems: "center", gap: "10px", flexDirection: "column" }}>
					{Array.from({ length: 5 }).map((_, index) => (
						<Skeleton.Button key={index} size="small" block active shape="round" />
					))}
					<div style={{ width: "100%", display: "flex", justifyContent: "spaceBetween", gap: "10px" }}>
						<div style={{ flex: 1 }}>
							<Skeleton.Button size="small" block active shape="round" />
						</div>
						<div style={{ width: "maxContent", display: "flex", alignItems: "center" }}>
							<span>Đang lấy dữ liệu Chain</span>
						</div>
						<div style={{ flex: 1 }}>
							<Skeleton.Button size="small" block active shape="round" />
						</div>
					</div>
					{Array.from({ length: 5 }).map((_, index) => (
						<Skeleton.Button key={index} size="small" block active shape="round" />
					))}
				</div>
			) : (
				<div className={css.permissionTree}>
					<div className={css.treeNode}>
						<div className={css.nodeHeaderMain}>
							<div>Chú thích:</div>
							<div>
								{chuThichRender.map(({ icon, label }, index) => (
									<div key={index} style={{ display: "flex", gap: "5px", alignItems: "center" }}>
										<span>{icon}</span>
										<span>{label}</span>
									</div>
								))}
							</div>
						</div>

						<div className={css.nodeHeaderMain}>
							<div>Công tắc toàn cục:</div>
							<div>
								{switchRender.map(({ icon, onChange, checkedChildren = "✔", unCheckedChildren = "OFF" }, index) => (
									<div key={index} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
										<span>{icon}</span>
										<Switch
											checkedChildren={checkedChildren}
											unCheckedChildren={unCheckedChildren}
											onChange={onChange}
										/>
									</div>
								))}
							</div>
						</div>

						<div className={css.nodeHeaderMain}>
							<div><b>Danh sách Project</b></div>
						</div>
					</div>
					{dataChain.map((chain) => renderTreeNode(chain, "chain"))}
				</div>
			)}
		</>
	);
};

export default ChainElement;