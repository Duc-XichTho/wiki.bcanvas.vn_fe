import { Input, message, Modal, Select } from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';
import css from './CreateData.module.css';
import { createTimestamp } from '../../../../generalFunction/format.js';
import { createNewFileNotePad, updateFileNotePad } from '../../../../apis/fileNotePadService.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import { createTemplateTable } from '../../../../apis/templateSettingService.jsx';

export default function CreateDataTemplate({
											  isModalVisible,
											  handleCloseModal,
											  tabs,
											  listUC_CANVAS,
											  uCSelected_CANVAS,
											  fetchData,
										  }) {
	const { currentUser } = useContext(MyContext);
	const inputRef = useRef(null);

	const [name, setName] = useState(null);
	const [folder, setFolder] = useState(null);
	const type = 'Template'; // cố định

	useEffect(() => {
		setName(null);
		setFolder(null);
		if (isModalVisible && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isModalVisible]);

	const handleCreate = async () => {
		if (!name) {
			message.error('Vui lòng điền tên');
			return;
		}
		if (!folder) {
			message.error('Vui lòng chọn folder');
			return;
		}

		let nameUC = listUC_CANVAS?.find(item => item.id == uCSelected_CANVAS)?.name;

		let newData = {
			name,
			code: null,
			tab: folder,
			table: type,
			userClass: [nameUC],
			user_create: currentUser?.email,
			created_at: createTimestamp(),
		};

		try {
			await createNewFileNotePad(newData).then(async (data) => {
				const fileNote = data.data;
				fileNote.code = `${type}_${fileNote.id}`;
				await updateFileNotePad(fileNote);

				// Gọi API tạo template table
				await createTemplateTable({
					fileNote_id: fileNote.id,
					isCombine: false,
				});
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
			<div className={css.mainColumn}>
				<div className={css.titleColumn}>Nhập tên</div>
				<Input
					placeholder='Tên dữ liệu'
					value={name}
					onChange={(e) => setName(e.target.value)}
					ref={inputRef}
					autoFocus
				/>
			</div>
			<div className={css.mainColumn}>
				<div className={css.titleColumn}>Loại</div>
				<Input
					placeholder='Bảng đơn'
					value={'Bảng đơn'}
					readOnly={true}
				/>
			</div>


			<div style={{ marginTop: 16 }}>
				<div className={css.titleColumn}>Chọn folder muốn thêm</div>
				<Select
					style={{ width: '100%' }}
					placeholder="Chọn folder"
					value={folder}
					onChange={(value) => setFolder(value)}
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
