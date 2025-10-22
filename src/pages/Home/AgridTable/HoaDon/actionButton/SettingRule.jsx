import { useContext, useEffect, useState } from 'react';
import { Button, Col, Input, InputNumber, Modal, Row, Select, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
	createNewRuleSetting,
	deleteRuleSetting,
	getAllRuleSetting,
	updateRuleSetting,
} from '../../../../../apis/ruleSettingService.jsx';
import { createTimestamp, formatMoney } from '../../../../../generalFunction/format.js';
import { MyContext } from '../../../../../MyContext.jsx';
import css from './SettingRule.module.css';

const operators = ['>', '<', '=', '>=', '<=', '!='];
const days = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: i + 1 }));
const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: i + 1 }));
const years = Array.from({ length: 50 }, (_, i) => ({ value: 2000 + i, label: 2000 + i }));

export default function SettingRule() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [rules, setRules] = useState([]);
	const { currentUser , selectedCompany, } = useContext(MyContext);

	const showModal = () => setIsModalOpen(true);
	const handleCancel = () => setIsModalOpen(false);

	const handleAddRule = async () => {
		const newData = {
			created_at: createTimestamp(),
			user_create: currentUser.email,
			rule: {
				day: { operator: '', value: '' },
				month: { operator: '', value: '' },
				year: { operator: '', value: '' },
				amount: { operator: '', value: '' },
				description: '',
				result: '', // Thêm trường result
			},
			company : selectedCompany
		};
		const data = await createNewRuleSetting(newData);
		if (data.status == '201') {
			const newData = {
				id: data.data?.id,
				rule: data.data?.rule,
			};
			setRules([newData, ...rules]);
		}
	};

	const fetchDataRuleSetting = async () => {
		try {
			const data = await getAllRuleSetting();
			const parsedRules = data.filter(item => item.company == selectedCompany) // Lọc theo company
				.map(item => ({
					id: item.id,
					rule: item.rule,
				}));
			setRules(parsedRules);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu rule:', error);
		}
	};

	useEffect(() => {
		fetchDataRuleSetting();
	}, [isModalOpen]);

	const updateRule = async (id, value, field, subField) => {
		const updatedRules = [...rules];
		const ruleToUpdate = updatedRules.find(rule => rule.id === id);
		if (ruleToUpdate) {
			if (subField) {
				ruleToUpdate.rule[field][subField] = value;
			} else {
				ruleToUpdate.rule[field] = value;
			}
		}
		setRules(updatedRules);
		await updateRuleSetting(ruleToUpdate);
	};

	const handleDeleteRuleSetting = async (id) => {
		try {
			await deleteRuleSetting(id);
			setRules(rules.filter(rule => rule.id !== id));
		} catch (error) {
			console.error('Lỗi khi xóa Rule:', error);
		}
	};

	return (
		<>
			<Button onClick={showModal}>Cấu hình</Button>
			<Modal
				title={
					<div style={{
						display: 'flex',
						justifyContent: 'start',
						alignItems: 'center',
						width: '100%',
						gap: '30px',
					}}>
						<span style={{ fontSize: '30px' }}>Cấu hình Rule</span>
						<Button type='dashed' onClick={handleAddRule} icon={<PlusOutlined />}>Thêm mới</Button>
					</div>
				}
				open={isModalOpen}
				onCancel={handleCancel}
				footer={null}
				width={1600}
				style={{ top: 50 }}
				bodyStyle={{ height: '75vh' }}
			>
				{/* Header Row */}
				<Row gutter={[24, 16]} style={{
					display: 'flex',
					fontWeight: 'bold',
					paddingBottom: 10,
					borderBottom: '2px solid #ddd',
					marginBottom: '10px',
				}}>
					<Col span={3} style={{ textAlign: 'center' }}>Ngày</Col>
					<Col span={3} style={{ textAlign: 'center' }}>Tháng</Col>
					<Col span={3} style={{ textAlign: 'center' }}>Năm</Col>
					<Col span={3} style={{ textAlign: 'center' }}>Số tiền</Col>
					<Col span={6} style={{ textAlign: 'center' }}>Diễn giải</Col>
					<Col span={3} style={{ textAlign: 'center' }}>Kết quả</Col> {/* Cột kết quả */}
					<Col span={2} style={{ textAlign: 'center' }}>Hành động</Col>
				</Row>

				{/* Rule Data */}
				<div className={css.containerContent}>
					{rules.map((item, index) => {
						const rule = item.rule;
						return (
							<Row
								gutter={[16, 16]}
								key={index}
								style={{
									padding: '10px 0',
									borderBottom: '1px solid #eee',
									alignItems: 'center',
									marginTop: '10px',
								}}
							>

								{/* Các cột sử dụng Select và Input lặp lại */}
								{['day', 'month', 'year', 'amount'].map((field, i) => (
									<Col key={i} span={3}>
										<Space direction="vertical" style={{ width: '100%' }}>
											<Select
												placeholder="Biểu thức"
												options={operators.map(op => ({ value: op, label: op })).concat([{ value: '', label: 'Bỏ qua' }])}
												value={rule?.[field]?.operator}
												onChange={value => updateRule(item.id, value, field, 'operator')}
												style={{ width: '100%' }}
											/>
											{field === 'amount' ? (
												<InputNumber
													value={rule?.[field]?.value}
													onChange={(value) => updateRule(item.id, value, field, 'value')}
													style={{ width: '100%' }}
													formatter={(value) => formatMoney(value)}
													parser={(value) => value.replace(/[^\d]/g, '')} // Loại bỏ ký tự không phải số
												/>
											) : (
												<Select
													placeholder={field === 'amount' ? 'Giá trị' : field === 'day' ? 'Ngày' : field}
													options={[
														...(field === 'day' ? days : field === 'month' ? months : field === 'year' ? years : []),
														{ value: '', label: 'Bỏ qua' }  // Thêm tùy chọn Bỏ qua
													]}
													value={rule?.[field]?.value}
													onChange={value => updateRule(item.id, value, field, 'value')}
													style={{ width: '100%' }}
												/>
											)}
										</Space>
									</Col>
								))}


								{/* Diễn giải */}
								<Col span={6}>
									<Input
										placeholder="Nhập nội dung"
										value={rule?.description}
										onChange={e => updateRule(item.id, e.target.value, 'description')}
									/>
								</Col>

								{/* Kết quả */}
								<Col span={3}>
									<Input
										placeholder="Nhập kết quả"
										value={rule?.result}
										onChange={e => updateRule(item.id, e.target.value, 'result')}
									/>
								</Col>

								{/* Xóa */}
								<Col span={2} style={{ textAlign: 'center' }}>
									<Button onClick={() => handleDeleteRuleSetting(item.id)}>Xóa</Button>
								</Col>
							</Row>

						);
					})}
				</div>
			</Modal>
		</>
	);
}
