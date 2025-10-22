import { Input, message, Modal, Select } from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';
import css from './CreateData.module.css';
import { createTimestamp } from '../../../../generalFunction/format.js';
import { createNewFileNotePad, updateFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import { createNewReportCanvas } from '../../../../apis/reportCanvasService.jsx';


export default function CreateData({
									   isModalVisible,
									   handleCloseModal,
									   tabs,
									   fetchData,
									   kpiList,
									   ctList,
								   }) {
	const { currentUser, listUC_CANVAS, uCSelected_CANVAS } = useContext(MyContext);
	const inputRef = useRef(null);
	// Replace formData with individual states
	const [name, setName] = useState(null);
	const [folder, setFolder] = useState(null);
	const [type, setType] = useState('Template');

	const [detailTypeSelected, setDetailTypeSelected] = useState(null);
	const [newCardCode, setNewCardCode] = useState(null);
	const [selectedDetailData, setSelectedDetailData] = useState(null);


	// Update useEffect for reset
	useEffect(() => {
		setName(null);
		setFolder(null);
		setType("Template");
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
		let userClass = listUC_CANVAS.find(e => e.id == uCSelected_CANVAS).name
		try {
			await createNewReportCanvas({
				name,
				code: newCardCode,
				tab : folder,
				user_create: currentUser.email,
				created_at: createTimestamp(),
				userClass: [userClass]
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
			okText="Tạo"
			cancelText="Hủy"
			onOk={handleCreate}
			okButtonProps={{
				disabled: checkDisabled,
				style: okButtonStyle,
			}}
			width={500}
			centered
		>
			<div className={css.mainColumn} >
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
				<div className={css.titleColumn}>Chọn folder muốn thêm</div>
				<Select
					style={{ width: '100%' }}
					placeholder="Chọn folder"
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
