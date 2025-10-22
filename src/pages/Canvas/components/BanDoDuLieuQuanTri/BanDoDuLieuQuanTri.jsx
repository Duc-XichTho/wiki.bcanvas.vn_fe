import css from './BanDoDuLieuQuanTri.module.css';
import {
	Button, Modal, Popover,
	Select, Tag, Space, Input,
} from 'antd';
import { MyContext } from '../../../../MyContext.jsx';
import { useContext, useState, useEffect } from 'react';
import ObjectiveMetricsDataPanel from '../../DataMappingKpi/ObjectiveMetricsDataPanel.jsx';
import QuanLyTag from '../../DataMappingKpi/QuanLyTag.jsx';
import { getAllQuanLyTag } from '../../../../apis/quanLyTagService.jsx';
import {
	createNewNganhReal,
	deleteNganhReal,
	getAllNganhReal,
	updateNganhReal,
} from '../../../../apis/nganhRealService.jsx';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { HousePlus, PencilLine,Trash2 } from 'lucide-react';
import { Card, List, Row, Col, Typography } from 'antd';

const { Title } = Typography;

const BanDoDuLieuQuanTri = () => {
	const {
		currentYearCanvas,
		setCurrentYearCanvas,
		isUpdateNoti,
		setIsUpdateNoti,
	} = useContext(MyContext) || {};

	const [isModalManaTags, setIsModalManaTags] = useState(false);
	const [listTag, setListTag] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]);
	const [nganhReal, setNganhReal] = useState([]);
	const [nganhRealSelected, setNganhRealSelected] = useState(null);
	const [showAllTags, setShowAllTags] = useState(false);
	const [isPopoverVisible, setIsPopoverVisible] = useState(false);

	// Add new state for search
	const [searchValue, setSearchValue] = useState('');
	const [isModalVisibleNganhReal, setIsModalVisibleNganhReal] = useState(false);
	const [isModalVisibleEditNganhReal, setIsModalVisibleEditNganhReal] = useState(false); // State để hiển thị/ẩn Modal
	const [editDataNganhReal, setEditDataNganhReal] = useState(null);
	const [newItemDataNganhReal, setNewItemDataNganhReal] = useState({ // State để lưu dữ liệu nhập từ form
		name: '',
		code: '',
	});

	useEffect(() => {
		const handleKeyPress = (event) => {
			if (event.key === 'b' && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				setIsPopoverVisible(!isPopoverVisible);
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [isPopoverVisible]);

	const modalTitleStyle = {
		fontSize: '20px',
		display: 'flex',
		justifyContent: 'space-between',
		gap: '20px',
		alignItems: 'center',
		height: '60px',
		padding: '20px',
		background: '#29475C',
	};

	const yearOptions = [2023, 2024, 2025].map((year) => ({
		value: year,
		label: <span>{year}</span>,
	}));
	const fetchData = async () => {
		const tags = await getAllQuanLyTag();
		const nganhRealRes = await getAllNganhReal();
		let filteredNganhReal = nganhRealRes.sort((a, b) => a?.position - b?.position);

		if (selectedTags && selectedTags.length > 0) {
			filteredNganhReal = filteredNganhReal.filter(e =>
				selectedTags.every(tag => e?.tabs?.includes(tag)),
			);
		}

		setListTag(tags);
		setNganhReal(filteredNganhReal);
	};


	useEffect(() => {
		fetchData();
	}, [selectedTags, isUpdateNoti]);

	const handleTagClick = (tagName) => {
		if (selectedTags.includes(tagName)) {
			setSelectedTags(selectedTags.filter(t => t !== tagName));
		} else {
			setSelectedTags([...selectedTags, tagName]);
		}
	};
	const handleModalNganhRealOk = async () => {
		try {

			if (nganhReal?.length > 0) {
				await createNewNganhReal({
					...newItemDataNganhReal,
					position: Math.max(...nganhReal.map(e => e.position || 0)) + 1,
				});
			} else {
				await createNewNganhReal({
					...newItemDataNganhReal,
					position: 0,
				});
			}

			setIsModalVisibleNganhReal(false); // Đóng Modal sau khi tạo thành công
			await fetchData(); // Làm mới dữ liệu
			setNewItemDataNganhReal({ name: '', code: '' });
		} catch
			(error) {
			console.error('Error creating new nganh:', error);
		}
	};
	const handleModalNganhRealEdit = async () => {
		try {
			if (editDataNganhReal && editDataNganhReal.id) {
				await updateNganhReal(editDataNganhReal);
			}

			setIsModalVisibleEditNganhReal(false); // Đóng Modal sau khi tạo thành công
			await fetchData(); // Làm mới dữ liệu
		} catch
			(error) {
			console.error('Error creating new nganh:', error);
		}
	};
	const handleDeleteNganhReal = async () => {
		try {
			if (editDataNganhReal && editDataNganhReal.id) {
				await deleteNganhReal(editDataNganhReal.id);
			}
			setIsModalVisibleEditNganhReal(false); // Đóng Modal sau khi tạo thành công
			setNganhRealSelected(null);
			await fetchData(); // Làm mới dữ liệu
		} catch
			(error) {
			console.error('Error creating new nganh:', error);
		}
	};
	const handleModalCancel = () => {
		setIsModalVisibleNganhReal(false); // Đóng Modal mà không lưu
		setIsModalVisibleEditNganhReal(false); // Đóng Modal mà không lưu
		setNewItemDataNganhReal({name: '', code: ''});
	};
	const handleInputTabsNganhRealChange = (e) => {
		setNewItemDataNganhReal(prev => ({...prev, tabs: e}));
	};

	const handleInputNganhRealChange = (e) => {
		const {name, value} = e.target;
		setNewItemDataNganhReal(prev => ({...prev, [name]: value}));
	};
	const handleInputNganhRealEditChange = (e) => {
		const {name, value} = e.target;
		setEditDataNganhReal(prev => ({...prev, [name]: value}));
	};

	const handleInputEditTagNganhRealChange = (e) => {
		setEditDataNganhReal(prev => ({...prev, tabs: e}));
	};

	// Add filtered nganh logic
	const filteredNganh = nganhReal.filter(nganh =>
		nganh.name.toLowerCase().includes(searchValue.toLowerCase()),
	);

	const sidebarContent = (
		<div className={css.sidebar}>
			<div style={{
				width: '100%',
				display: 'flex',
				justifyContent: 'space-between',
				paddingRight: '10px',
				padding: '5px 5px',
			}}>
				{/* Thanh Search */}
				<Input
					placeholder="Tìm kiếm ngành"
					value={searchValue}
					onChange={(e) => setSearchValue(e.target.value)}
					style={{ marginBottom: '10px', width: '95%' }}
				/>
				<Button style={{ border: 'none', background: 'none' }}
						onClick={() => setIsModalVisibleNganhReal(true)}>
					<HousePlus size={25} strokeWidth={1.5} />
				</Button>
			</div>


			{/* Các Nút Filter Tag */}
			<div style={{ marginBottom: '10px', position: 'relative', maxHeight: '90px' }}>
				{/* Hiển thị tối đa 3 hàng tag */}
				<div style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: '5px',
					maxHeight: '90px', // 3 hàng * 24px (chiều cao mỗi hàng)
					overflow: 'auto',
					position: 'relative',
				}}>
					{listTag.filter(tag => tag.nhom == 'nganhReal').map(tag => (
						<Tag
							key={tag.id}
							color={selectedTags.includes(tag.name) ? '#259c63' : 'default'}
							onClick={() => handleTagClick(tag.name)}
						>
							#{tag.name}
						</Tag>
					))}
				</div>


			</div>

			<List
				dataSource={nganhReal}
				className={css.sidebar_list}
				renderItem={data => (
					<List.Item className={css.sidebar_list_item}>
						<Card size="small"
							  className={`${css.card} ${nganhRealSelected && nganhRealSelected.id == data.id ? css.activeCard : ''}`}
							  onClick={() => setNganhRealSelected(data)}>
							<Row style={{ width: '100%', height: '100%' }}>
								<Col style={{
									fontWeight: 500,
									width: '230px',
									display: 'flex',
									justifyContent: 'space-between',
								}}>
									<span>{data?.name} </span>
									{nganhRealSelected && nganhRealSelected.id == data.id &&
										<PencilLine onClick={() => {
											setIsModalVisibleEditNganhReal(true);
											setEditDataNganhReal(data);
										}} />}
								</Col>
								<Col style={{ marginTop: 8 }}>
									{data.tabs && data.tabs.length > 0 &&
										data.tabs.map(e => (
											<Tag color="green">{e}</Tag>
										))}
								</Col>
							</Row>
						</Card>
					</List.Item>
				)}
			/>

			{/*CREATE NGANHREAL*/}
			<Modal
				title={`Thêm Ngành mới`}
				open={isModalVisibleNganhReal}
				onOk={handleModalNganhRealOk}
				onCancel={handleModalCancel}
				okText="Lưu"
				cancelText="Hủy"
			>
				<Space direction="vertical" style={{ width: '100%' }}>
					<Input
						placeholder="Tên"
						name="name"
						value={newItemDataNganhReal.name}
						onChange={handleInputNganhRealChange}
					/>
					<Select
						mode="multiple"
						style={{ width: '100%' }}
						name="tabs"
						placeholder="Thêm tags"
						onChange={handleInputTabsNganhRealChange}
					>
						{listTag && listTag.length > 0 && listTag.filter(e => e.nhom == 'nganhReal').map((tag) => (
							<Select.Option key={tag.id} value={tag.name}>
								{tag.name}
							</Select.Option>
						))}
					</Select>
					{/*<Input*/}
					{/*    placeholder="Mã"*/}
					{/*    name="code"*/}
					{/*    value={newItemDataNganhReal.code}*/}
					{/*    onChange={handleInputNganhRealChange}*/}
					{/*/>*/}
				</Space>
			</Modal>

			{/*EDIT NGANHREAL*/}
			<Modal
				title={`Sửa ngành`}
				open={isModalVisibleEditNganhReal}
				onCancel={handleModalCancel}
				okText="Lưu"
				cancelText="Hủy"
				footer={<div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
					<Button color={'danger'} variant="outlined"
							onClick={handleDeleteNganhReal}><Trash2 /></Button>
					<Button color={'primary'} variant="solid"
							onClick={handleModalNganhRealEdit}>Lưu</Button>
				</div>}
			>
				<Space direction="vertical" style={{ width: '100%' }}>
					<Input
						placeholder="Tên"
						name="name"
						value={editDataNganhReal?.name}
						onChange={handleInputNganhRealEditChange}
					/>
					{/*<Input*/}
					{/*    placeholder="Mã"*/}
					{/*    name="code"*/}
					{/*    value={editDataNganhReal?.code}*/}
					{/*    onChange={handleInputNganhRealEditChange}*/}
					{/*/>*/}
					<Select
						mode="multiple"
						style={{ width: '100%' }}
						name="tabs"
						placeholder="Thêm tags"
						value={editDataNganhReal?.tabs || []}
						onChange={handleInputEditTagNganhRealChange}
					>
						{listTag && listTag.length > 0 && listTag.filter(e => e.nhom == 'nganhReal').map((tag) => (
							<Select.Option key={tag.id} value={tag.name}>
								{tag.name}
							</Select.Option>
						))}
					</Select>
				</Space>
			</Modal>

		</div>
	);

	return (
		<div className={`${css.modal_data_mapping}`} style={{ height: '100%' }}>
			<div style={modalTitleStyle}>
				<div className={css.leftControls}>
					<Popover
						content={sidebarContent}
						trigger="click"
						placement="bottomLeft"
						overlayClassName={css.businessDomainPopover}
						open={isPopoverVisible}
						onOpenChange={setIsPopoverVisible}
					>
						<Button
							style={{
								border: 'none',
								backgroundColor: 'transparent',
								boxShadow: 'none',
								fontWeight: 'bold',
								fontSize: 20,
								paddingLeft: 0,
							}}
						>
							Business Domain
							<DownOutlined style={{ color: '#93C8ED', fontSize: 15, paddingLeft: 10 }} />
						</Button>
					</Popover>

					<Space>
						<Select
							value={currentYearCanvas}
							onChange={setCurrentYearCanvas}
							options={yearOptions}
							style={{
								width: 80,
								height: 40,
								fontSize: 16,
							}}
							size="large"
						/>
						<Button
							onClick={() => setIsModalManaTags(true)}
							size="large"
							style={{
								height: 40,
								fontSize: 16,
							}}
						>
							Quản lý tags
						</Button>
					</Space>
				</div>
			</div>
			<div style={{ height: 'calc(100% - 30px)' }}>
				<ObjectiveMetricsDataPanel
					nganhRealSelected={nganhRealSelected}
					selectedTags={selectedTags}
					loadList={fetchData}
				/>
			</div>
			<Modal
				title="Quản lý tag"
				open={isModalManaTags}
				centered
				onCancel={() => {
					setIsModalManaTags(false);
					setIsUpdateNoti(!isUpdateNoti);
				}}
				width={650}
				footer={null}
				bodyProps={{ style: { height: '55vh' } }}
			>
				<QuanLyTag />
			</Modal>
		</div>
	);
};

export default BanDoDuLieuQuanTri;
