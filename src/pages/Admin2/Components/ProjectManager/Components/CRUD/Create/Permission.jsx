import React, { useState } from 'react';
import { Checkbox } from 'antd';
import { CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons';
import css from './Permission.module.css';
import { data } from './data';

const Permission = () => {
	const [checkedState, setCheckedState] = useState({
		chain: {},
		step: {},
		task: {}
	});

	const [expandedNodes, setExpandedNodes] = useState({});

	const toggleNode = (nodeId) => {
		setExpandedNodes(prev => ({
			...prev,
			[nodeId]: !prev[nodeId]
		}));
	};

	const renderCheckboxGroup = (level, id) => (
		<div className={css.checkboxGroup}>
			<Checkbox
				onChange={(e) => handleCheckboxChange(level, id, 'confirm', e.target.checked)}
				checked={checkedState[level][id]?.confirm}
			>
				Xác nhận
			</Checkbox>
			<Checkbox
				onChange={(e) => handleCheckboxChange(level, id, 'approve1', e.target.checked)}
				checked={checkedState[level][id]?.approve1}
			>
				Duyệt 1
			</Checkbox>
			<Checkbox
				onChange={(e) => handleCheckboxChange(level, id, 'approve2', e.target.checked)}
				checked={checkedState[level][id]?.approve2}
			>
				Duyệt 2
			</Checkbox>
		</div>
	);

	const handleCheckboxChange = (level, id, permission, checked) => {
		const newState = { ...checkedState };

		if (!newState[level][id]) {
			newState[level][id] = {};
		}
		newState[level][id][permission] = checked;

		if (level === 'chain') {
			const chain = data.find(c => c.id === id);
			if (chain) {
				chain.steps.forEach(step => {
					if (!newState.step[step.id]) {
						newState.step[step.id] = {};
					}
					newState.step[step.id][permission] = checked;

					step.tasks.forEach(task => {
						if (!newState.task[task.id]) {
							newState.task[task.id] = {};
						}
						newState.task[task.id][permission] = checked;
					});
				});
			}
		} else if (level === 'step') {
			const chain = data.find(c =>
				c.steps.some(s => s.id === id)
			);
			const step = chain?.steps.find(s => s.id === id);

			if (step) {
				step.tasks.forEach(task => {
					if (!newState.task[task.id]) {
						newState.task[task.id] = {};
					}
					newState.task[task.id][permission] = checked;
				});
			}
		}

		setCheckedState(newState);
	};

	const renderTreeNode = (node, level, depth = 0) => {
		const nodeId = node.id;
		const isExpanded = expandedNodes[nodeId];
		const hasChildren = level !== 'task' && (
			level === 'chain' ? node.steps?.length > 0 : node.tasks?.length > 0
		);

		return (
			<div key={nodeId} className={css.treeNode} style={{ marginLeft: `${depth * 24}px` }}>
				<div className={css.nodeHeader}>
					{hasChildren && (
						<span
							className={css.expandIcon}
							onClick={() => toggleNode(nodeId)}
						>
							{isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
						</span>
					)}
					<span className={css.nodeName}>
						{level === 'chain' ? node.name : node.title}
					</span>
					{renderCheckboxGroup(level, nodeId)}
				</div>

				{hasChildren && isExpanded && (
					<div className={css.nodeChildren}>
						{level === 'chain' && node.steps.map(step =>
							renderTreeNode(step, 'step', depth + 1)
						)}
						{level === 'step' && node.tasks.map(task =>
							renderTreeNode(task, 'task', depth + 1)
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className={css.permissionTree}>
			{data.map(chain => renderTreeNode(chain, 'chain'))}
		</div>
	);
};

export default Permission;