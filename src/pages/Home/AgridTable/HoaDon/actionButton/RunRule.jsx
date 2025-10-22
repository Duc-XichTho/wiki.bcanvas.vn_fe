import { getAllRuleSetting } from '../../../../../apis/ruleSettingService.jsx';
import { useContext, useEffect, useState } from 'react';
import { MyContext } from '../../../../../MyContext.jsx';
import { Button, Checkbox, Modal, Row, Col, Space, Input, Select, Popover, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import css from './SettingRule.module.css';
import { formatMoney } from '../../../../../generalFunction/format.js';
import { updateHoaDonSanPham } from '../../../../../apis/hoaDonSanPhamService.jsx';

export default function RunRule({ selectedRows, gridRef }) {
	const [rules, setRules] = useState([]);
	const { currentUser, selectedCompany } = useContext(MyContext);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedRuleId, setSelectedRuleId] = useState(null);
	const [selectedRule, setSelectedRule] = useState(null);
	const [loading, setLoading] = useState(false);
	const [popoverVisible, setPopoverVisible] = useState(false);

	const fetchDataRuleSetting = async () => {
		try {
			const data = await getAllRuleSetting();
			const parsedRules = data.filter(item => item.company == selectedCompany)
				.map(item => ({
					id: item.id,
					rule: item.rule,
				}));
			setRules(parsedRules);
		} catch (error) {
			console.error('Lỗi khi lấy dữ liệu rule:', error);
		}
	};

	const showModal = () => setIsModalOpen(true);
	const handleCancel = () => setIsModalOpen(false);

	const handleCheckboxChange = (id, ruleData) => {
		if (selectedRuleId === id) {
			setSelectedRule(null);
			setSelectedRuleId(null);
		} else {
			setSelectedRule(ruleData);
			setSelectedRuleId(id);
		}
	};

	const parseDate = (dateStr) => {
		if (!dateStr) return null;
		const [day, month, year] = dateStr.split('/').map(Number);
		if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

		return { day, month, year };
	};

	const compareValues = (a, operator, b , errors) => {
		if (operator === '' && b === '') return true;
		// if ((operator === '' && b != '') || (operator !== '' && b === '')) {
		// 	message.warning(`Lỗi rule: Điều kiện hoặc giá trị kiểm tra bị thiếu`);
		// 	return false;
		// }
		//
		const err = `Lỗi rule: Điều kiện hoặc giá trị kiểm tra bị thiếu`
		if (operator == '' && b != '') {
			if (!errors.has(err)) {
				errors.add(err);
			}
			return false;
		}

		if (operator != '' && b === '') {
			if (!errors.has(err)) {
				errors.add(err);
			}
			return false;
		}


		switch (operator) {
			case '>':
				return a > b;
			case '<':
				return a < b;
			case '=':
				return a === b;
			case '>=':
				return a >= b;
			case '<=':
				return a <= b;
			case '!=':
				return a !== b;
			default:
				return false;
		}
	};

	const applyRuleToSelectedRows = (ruleData) => {
		if (!ruleData || !selectedRows.length) return [];
		const errors = new Set();

		const filteredRows =  selectedRows.filter(row => {
			const parsed = parseDate(row.date);
			if (!parsed) return false;

			const conditions = [
				compareValues(row.tong_tien, ruleData.amount.operator, ruleData.amount.value , errors),
				compareValues(parsed.day, ruleData.day.operator, ruleData.day.value , errors),
				compareValues(parsed.month, ruleData.month.operator, ruleData.month.value , errors),
				compareValues(parsed.year, ruleData.year.operator, ruleData.year.value , errors),
				row.note?.toLowerCase().trim().includes(ruleData.description.toLowerCase().trim()),
			];

			if (conditions.every(Boolean)) {
				row.result_rule = ruleData.result;
				return true;
			}

			return false;
		});

		if (errors.size > 0) {
			message.warning(`Lỗi rule: Điều kiện hoặc giá trị kiểm tra bị thiếu`);
		}


		return filteredRows;
	};


	const handleRunRules = async () => {
		if (selectedRule) {
			setLoading(true);
			setPopoverVisible(false); // Đóng Popover ngay lập tức khi bắt đầu quy trình

			const data = applyRuleToSelectedRows(selectedRule.rule);

			if (data.length > 0) {
				const updatedData = data.map(row => ({
					id: row.id_detail,
					result_rule: selectedRule.rule.result,
				}));

				for (let row of updatedData) {
					await updateHoaDonSanPham(row);
				}
				gridRef.current.api.forEachNode(node => {
					const updatedRow = updatedData.find(item => item.id === node.data.id_detail);
					if (updatedRow) {
						node.setData({ ...node.data, result_rule: updatedRow.result_rule });
					}
				});
				message.success(`Chạy rule thành công có ${data.length} dòng  được cập nhật kết quả!`);
			}
			else {
				message.warning('Không có dòng nào thỏa mãn rule!');
			}
			setTimeout(() => {
				setLoading(false);
			}, 1000);

		}
	};

	const content = (
		<div style={{ width: 200 }}>
			<p style={{ marginBottom: '10px' }}>Bạn có chắc chắn muốn chạy ngay các quy tắc không?</p>
			<Space direction='vertical' style={{ width: '100%' }}>
				<Button
					type='primary'
					style={{ width: '100%' }}
					onClick={() => {
						handleRunRules(); // Thực thi khi xác nhận
					}}
				>
					Xác nhận
				</Button>
			</Space>
		</div>
	);

	useEffect(() => {
		fetchDataRuleSetting();
		setSelectedRule(null);
		setSelectedRuleId(null);
	}, [isModalOpen]);

	return (
		<>
			{selectedRows?.length > 0 && (
				<Button onClick={showModal}>Chạy Rule</Button>
			)}

			<Modal
				title={
					<div style={{
						display: 'flex',
						alignItems: 'center',
						textAlign: 'center',
						width: '100%',
						gap: '30px',
					}}>
						<span style={{ fontSize: '30px' }}>Chạy Rule</span>
					</div>
				}
				open={isModalOpen}
				onCancel={handleCancel}
				width={1600}
				style={{ top: 50 }}
				bodyStyle={{ height: '75vh' }}
				footer={[
					<div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
						<Popover
							content={content}
							trigger='click'
							placement='right'
							disabled={!selectedRuleId}
							visible={popoverVisible}
							onVisibleChange={(visible) => setPopoverVisible(visible)}
						>
							<Button
								loading={loading}
								key='run'
								type='primary'
								disabled={!selectedRuleId}
							>
								Chạy Rule
							</Button>
						</Popover>

					</div>,
				]}

			>
				{/* Header Row */}
				<Row gutter={[24, 16]} style={{
					display: 'flex',
					fontWeight: 'bold',
					paddingBottom: 10,
					borderBottom: '2px solid #ddd',
					marginBottom: '10px',
				}}>
					<Col span={1} style={{ textAlign: 'center' }}></Col>
					<Col span={3} style={{ textAlign: 'center' }}>Ngày</Col>
					<Col span={3} style={{ textAlign: 'center' }}>Tháng</Col>
					<Col span={3} style={{ textAlign: 'center' }}>Năm</Col>
					<Col span={3} style={{ textAlign: 'center' }}>Số tiền</Col>
					<Col span={6} style={{ textAlign: 'center' }}>Diễn giải</Col>
					<Col span={4} style={{ textAlign: 'center' }}>Kết quả</Col>
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
								<Col span={1} style={{ textAlign: 'center' }}>
									<Checkbox checked={selectedRuleId === item.id}
											  onChange={() => handleCheckboxChange(item.id, item)} />
								</Col>

								{['day', 'month', 'year', 'amount'].map((field, i) => (
									<Col key={i} span={3}>
										<Space direction='vertical' style={{ width: '100%' }}>
											<label>Biểu thức :</label>
											<Select
												placeholder={'Biểu thức '}
												value={rule?.[field]?.operator || "Bỏ qua"}
												style={{ width: '100%' }}
												open={false}
											/>


											<label style={{ marginTop: 10 }}>Giá trị :</label>
											{field === 'amount' ? (
												<InputNumber
													placeholder={'Giá trị '}
													value={rule?.[field]?.value  || "Bỏ qua"}
													style={{ width: '100%' }}
													formatter={(value) => formatMoney(value)}
													parser={(value) => value.replace(/[^\d]/g, '')}
													readOnly
												/>
											) : (
												<Select
													placeholder={'Giá trị '}
													value={rule?.[field]?.value  || "Bỏ qua"}
													style={{ width: '100%' }}
													open={false}
												/>
											)}

										</Space>

									</Col>
								))}

								{/* Diễn giải */}
								<Col span={6}>
									<Space direction='vertical' style={{ width: '100%' }}>
										{/*<label>Biểu thức :</label>*/}
										{/*<Input value='=' readOnly style={{ textAlign: 'center' }} />*/}

										<label style={{ marginTop: 10 }}>Giá trị :</label>
										<Input value={rule?.description} readOnly />
									</Space>

								</Col>

								{/* Kết quả */}
								<Col span={4}>
									<Space direction='vertical' style={{ width: '100%' }}>
										{/*<label>Biểu thức :</label>*/}
										{/*<Input value='=' readOnly style={{ textAlign: 'center' }} />*/}

										<label style={{ marginTop: 10 }}>Giá trị :</label>
										<Input value={rule?.result} readOnly />
									</Space>

								</Col>
							</Row>
						);
					})}
				</div>
			</Modal>
		</>
	);
}
