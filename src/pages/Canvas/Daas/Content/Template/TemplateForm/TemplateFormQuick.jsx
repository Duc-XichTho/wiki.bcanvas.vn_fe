import React, { useState, useEffect, useContext } from 'react';
import {
	Form,
	Input,
	Button,
	Select,
	DatePicker,
	InputNumber,
	message,
	Upload,
	Progress,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { createTemplateRow } from '../../../../../../apis/templateSettingService';
import './TemplateForm.css';
import { createNewFile } from '../../../../../../apis/fileService';
import { uploadFiles } from '../../../../../../apisKTQT/uploadImageWikiNoteService.jsx';
import { createNewBCanvasDataOriginal } from '../../../../../../apis/bCanvasDataOriginalService.jsx';
import { createTimestamp } from '../../../../../../generalFunction/format.js';
import { MyContext, MyProvider } from '../../../../../../MyContext.jsx';
import { createNewBCanvasDataOriginalRow } from '../../../../../../apis/bCanvasDataOriginalRowService.jsx';
import { useParams } from 'react-router-dom';
import css from './TemplateFormQuick.module.css';

const { Option } = Select;

const TemplateFormQuick = ({
							   templateColumns,
							   templateData,
							   onSuccess,
							   fileNote,
						   }) => {
	const [form] = Form.useForm();
	const [formFields, setFormFields] = useState([]);
	const { currentUser } = useContext(MyContext);
	const { idThongKe } = useParams();
	const [loading, setLoading] = useState(false);


	const onCancel = () => {
		form.resetFields();
	};

	useEffect(() => {
		// Generate form fields based on template columns
		if (templateColumns && templateColumns.length > 0) {
			const fields = templateColumns
				.filter((col) => col.columnName !== 'Thời gian')
				.map((column) => ({
					name: column.columnName,
					label: column.columnName,
					type: column.columnType,
					required: false,
					options: column.selectOptions || [],
				}));
			
			setFormFields(fields.filter((col) => col.type !== 'duyet'));
		}
	}, [templateColumns]);
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [uploadProgress, setUploadProgress] = useState(0);


	const handleSubmit = async (values) => {
		try {
			setLoading(true);
			// Prepare the data for submission
			const newRow = { ...values };

			const payload = {
				id_DataOriginal: idThongKe,
				data: [newRow].map((item) => ({
					data: item,
					id_DataOriginal: idThongKe,
				})),
			};
			await createNewBCanvasDataOriginalRow(payload);
			const templateRes = await createTemplateRow({
				tableId: templateData.id,
				data: newRow,
				id_DataOriginal: idThongKe,
			});

			// Nếu có file đính kèm thì upload
			if (selectedFiles.length > 0) {
				const totalFiles = selectedFiles.length;
				let filesSaved = 0;

				for (let fileItem of selectedFiles) {
					const file = fileItem.originFileObj;
					const response = await uploadFiles([file]);

					const type = response.files[0].fileName.split('.').pop();
					const fileData = {
						name: response.files[0].fileName,
						url: response.files[0].fileUrl,
						type: type,
						table: `${fileNote.id}_Template`,
						table_id: `Template_${templateRes.id}`,
					};

					await createNewFile(fileData);
					filesSaved += 1;
					const totalProgress = Math.round((filesSaved / totalFiles) * 100);
					setUploadProgress(totalProgress);
				}

				message.success('Tất cả các file đã được upload và lưu thành công!');
				setUploadProgress(0);
			}
			setTimeout(async () => {
				setLoading(false);
				await onSuccess();
			}, 1000);
			message.success('Thêm dòng mới thành công!');
			form.resetFields();
		} catch (error) {
			console.error('Error adding new row:', error);
			message.error('Đã xảy ra lỗi khi thêm dòng mới!');
		}
	};

	const renderFormItem = (field) => {
		switch (field.type) {
			case 'number':
				return (
					<InputNumber
						style={{ width: '100%' }}
						placeholder={`Nhập ${field.label}`}
						formatter={(value) =>
							`${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
						}
						parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
					/>
				);

			case 'select':
				return (
					<Select placeholder={`Chọn ${field.label}`}>
						{field.options.map((option) => (
							<Option key={option} value={option}>
								{option}
							</Option>
						))}
					</Select>
				);

			case 'date':
				return (
					<DatePicker
						style={{ width: '100%' }}
						format='DD/MM/YYYY'
						placeholder={`Chọn ${field.label}`}
					/>
				);


			case 'formula':
				// Formula fields are calculated, so they should be disabled
				return <Input disabled placeholder='Giá trị sẽ được tính tự động' />;
			case 'file':
				return (
					<div className='upload-container'>
						<Upload.Dragger
							multiple
							beforeUpload={() => false}
							onChange={({ fileList }) => setSelectedFiles(fileList)}
							onDrop={e => {
								console.log('Dropped files', e.dataTransfer.files);
							}}
						>
							<p className='ant-upload-drag-icon'>
								<InboxOutlined />
							</p>
							<p className='ant-upload-text'>
								Kéo thả file vào đây hoặc click để chọn file
							</p>
							<p className='ant-upload-hint'>
								Hỗ trợ tải lên nhiều file
							</p>
						</Upload.Dragger>

						{uploadProgress > 0 && (
							<div style={{ marginTop: 16 }}>
								<Progress
									percent={uploadProgress}
									status='active'
									strokeColor={{
										'0%': '#108ee9',
										'100%': '#87d068',
									}}
								/>
							</div>
						)}

					</div>
				);
			default:
				return <Input placeholder={`Nhập ${field.label}`} />;
		}
	};



	return (
		<>
			<div style={{ height: 'max-content' }}>
				<span className={css.title}>Nhập liệu {fileNote?.name}</span>
			</div>

			<div className={css.templateFormContainer}>
				<Form
					form={form}
					layout='vertical'
					onFinish={handleSubmit}
					autoComplete='off'
				>
					{formFields
						.map((field) => (
							<Form.Item
								key={field.name}
								label={field.label}
								name={field.name}
								rules={[
									{
										required: field.required,
										message: `Vui lòng nhập ${field.label}!`,
									},
								]}
							>
								{renderFormItem(field)}
							</Form.Item>
						))}

					{/*<Form.Item className='form-actions'>*/}
					{/*	<Button loading={loading}*/}
					{/*			type='primary'*/}
					{/*			htmlType='submit'*/}
					{/*			style={{ backgroundColor: '#2d9d5b', color: 'white' }}*/}
					{/*	>*/}
					{/*		Thêm dòng*/}
					{/*	</Button>*/}
					{/*	<Button onClick={onCancel} style={{ marginLeft: 8 }}>*/}
					{/*		Hủy*/}
					{/*	</Button>*/}
					{/*</Form.Item>*/}
				</Form>
			</div>
			<div className={css.formActions} style={{ marginTop: 16 }}>
				<Button
					loading={loading}
					type='primary'
					style={{ backgroundColor: '#2d9d5b', color: 'white' }}
					onClick={() => form.submit()} // Gọi submit thủ công
				>
					Thêm dòng
				</Button>
				<Button onClick={onCancel} style={{ marginLeft: 8 }}>
					Hủy
				</Button>
			</div>
		</>

	);
};

export default TemplateFormQuick;
