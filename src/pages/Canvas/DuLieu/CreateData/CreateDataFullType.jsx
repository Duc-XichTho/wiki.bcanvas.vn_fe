import { Input, message, Modal, Select, Radio } from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';
import css from './CreateData.module.css';
import { createTimestamp } from '../../../../generalFunction/format.js';
import { createNewFileNotePad, updateFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import { ICON_CHU_GIAI } from '../../../../icon/svg/IconSvg.jsx';
import { createTemplateTable } from '../../../../apis/templateSettingService.jsx';


export default function CreateDataFullType({
											   isModalVisible,
											   handleCloseModal,
											   tabs,
											   listUC_CANVAS,
											   uCSelected_CANVAS,
											   fetchData,
										   }) {
	const { currentUser } = useContext(MyContext);
	const inputRef = useRef(null);
	// Replace formData with individual states
	const [name, setName] = useState(null);
	const [folder, setFolder] = useState(null);
	const [type, setType] = useState('Template');

	const [detailTypeSelected, setDetailTypeSelected] = useState(null);
	const [newCardCode, setNewCardCode] = useState(null);
	const [selectedDetailData, setSelectedDetailData] = useState(null);

	const typeOptions = [
		{
			label: 'Bảng Dữ liệu',
			value: 'Template',
			note: 'Dữ liệu dạng bảng, có thể tùy biến về kiểu nội dung, số lượng cột, tạo ra các công thức tính toán cơ bản, đính kèm, duyệt',
		},
		{ label: 'Bảng ghép', value: 'TemplateCombine', note: 'Bảng ghép' },
		{
			label: 'Kho file upload',
			value: 'FileUpLoad',
			note: 'Tạo ra kho chứa các file upload bởi người dùng nhằm mục đích tập trung hóa tài liệu số, giúp dễ dàng tra cứu khi cần thiết. Các định dạng hỗ trợ trong kho chứa gồm pdf, excel, word, các định dạng ảnh. 1 kho file có thể chứa nhiều file tài liệu',
		},
		{
			label: 'Văn bản',
			value: 'Tiptap',
			note: 'Tạo ra 1 văn bản với định dạng Richtext, cho phép copy paste ảnh, format văn bản với các đề mục, màu sắc... đóng vai trò như 1 tài liệu thông báo, truyền thông các cập nhập mới cho người dùng (ví dụ bản tin nội bộ, cập nhập công việc nhanh). Với Văn bản, người dùng tương tác tạo nội dung trực tiếp trên B-Canvas',
		},
	];

	const selectedType = typeOptions.find(opt => opt.value === type);

	// Update useEffect for reset
	useEffect(() => {
		setName(null);
		setFolder(null);
		setType('Template');
		setDetailTypeSelected(null);
		setNewCardCode(null);
		setSelectedDetailData(null);
		if (isModalVisible && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isModalVisible]);


	// Update handleChange
	const handleChange = (field, value) => {
		switch (field) {
			case 'name':
				setName(value);
				break;
		}
	};


	const handleChangeFolder = (value) => {
		setFolder(value);
	};

	const handleCreate = async () => {

		if (!name) {
			message.error('Vui lòng điền tên');
			return;
		}
		if (!folder) {
			message.error('Vui lòng chọn folder bạn muốn');
			return;
		}
		if (!type) {
			message.error('Vui lòng chọn kiểu dữ liệu');
			return;
		}

		let nameUC = listUC_CANVAS?.find(item => item.id == uCSelected_CANVAS)?.name;
		let newData = {
			name,
			code: newCardCode,
			tab: folder,
			table: type == 'TemplateCombine' ? 'Template' : type,
			userClass: [nameUC],
			user_create: currentUser?.email,
			created_at: createTimestamp(),
		};


		// if (( type === 'Template') && nameUC) {
		// 	newData.userClass = [nameUC];
		// }

		try {
			await createNewFileNotePad(newData).then(async (data) => {
				if (type === 'Data') {
					data.data.code = `${detailTypeSelected?.value}_${data.data.id}`;
				} else {
					data.data.code = `${type == 'TemplateCombine' ? 'Template' : type}_${data.data.id}`;
				}
				await updateFileNotePad(data.data);
				if (type === 'TemplateCombine') {
					await createTemplateTable({
						fileNote_id: data.data.id,
						isCombine: true,
					});
				}
			});
			handleCloseModal();
			fetchData();
			message.success('Tạo mới thành công');
		} catch (error) {
			message.error('Có lỗi xảy ra khi tạo mới');
			console.error('Error creating new data:', error);
		}
	};

	const ModalTitle = (
		<div className={css.modal_title}>
			<span>Tạo mới dữ liệu</span>
		</div>
	);

	const checkDisabled = !name || !folder;
	const okButtonStyle = checkDisabled
		? {}
		: {
			backgroundColor: '#2d9d5b',
			color: 'white',
			border: 'none',
		};

	return (
		<Modal
			title={ModalTitle}
			open={isModalVisible}
			onCancel={handleCloseModal}
			okText='Tạo'
			cancelText='Hủy'
			onOk={handleCreate}
			okButtonProps={{
				disabled: checkDisabled,
				style: okButtonStyle,
			}}
			width={500}
			centered
		>
			<div className={css.mainColumn}>
				<div className={css.titleColumn}>
					Nhập tên
				</div>
				<Input
					placeholder='Tên data'
					value={name}
					onChange={(e) => handleChange('name', e.target.value)}
					ref={inputRef}
					autoFocus
				/>
			</div>
			<div style={{ marginBottom: 16 }}>
				<div className={css.titleColumn}>Chọn loại dữ liệu muốn tạo</div>
				<Radio.Group
					options={typeOptions}
					onChange={e => setType(e.target.value)}
					value={type}
					optionType='button'
					buttonStyle='solid'
					style={{ width: '100%' }}
				/>
				<div
					className={'chuGiai'}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						justifyContent: 'flex-start',
					}}
				>
					<span style={{
						width: 20,
						height: 20,
						display: 'inline-flex',
						flex: '0 0 30px',
						alignItems: 'center',
						justifyContent: 'center',
					}}>
						<ICON_CHU_GIAI width={20} height={20} />
					</span>
					<span style={{ flex: 1 }}>{selectedType?.note}</span>
				</div>
			</div>
			<div style={{ marginBottom: 16 }}>
				<div className={css.titleColumn}>Chọn folder muốn thêm</div>
				<Select
					style={{ width: '100%' }}
					placeholder='Chọn folder'
					value={folder}
					onChange={handleChangeFolder}
					showSearch
					filterOption={(input, option) =>
						(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
					}
					options={tabs
						?.filter(e => !e.hide && e.id !== 0)
						?.sort((a, b) => (a.position || 0) - (b.position || 0))
						?.map(option => ({
							value: option.key,
							label: option.label,
						}))
					}
				/>
			</div>

		</Modal>
	);
}
