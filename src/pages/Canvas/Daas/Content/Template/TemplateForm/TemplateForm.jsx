import React, { useState, useEffect } from 'react';
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

const { Option } = Select;

const TemplateForm = ({
						  templateColumns,
						  templateData,
						  onSuccess,
						  fileNote,
						  onCancel,
					  }) => {
	const [form] = Form.useForm();
	const [formFields, setFormFields] = useState([]);

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
			// Prepare the data for submission
			const newRow = { ...values };

			// Calculate Thời gian if Ngày, Tháng, Năm are present
			if (values['Ngày'] && values['Tháng'] && values['Năm']) {
				newRow['Thời gian'] = new Date(
					values['Năm'],
					values['Tháng'] - 1,
					values['Ngày'],
				);
			}

			// Submit the data
			await createTemplateRow({ tableId: templateData.id, data: newRow }).then(async (res) => {
				if (selectedFiles.length === 0) {
					// message.warning("Vui lòng chọn file để upload.");
					return;
				}

				const totalFiles = selectedFiles.length; // Total number of files
				let filesSaved = 0; // Track the number of files successfully saved

				try {
					for (let fileItem of selectedFiles) {
						// Get the actual File object from Antd's Upload file object
						const file = fileItem.originFileObj;
						const response = await uploadFiles([file]);

						const type = response.files[0].fileName.split('.').pop();
						let fileData = {
							name: response.files[0].fileName,
							url: response.files[0].fileUrl,
							type: type,
							table: `${fileNote.id}_Template`, // Fixed: using templateData.id instead of undefined table
							table_id: `Template_${res.id}`, // Fixed: using res.data.id
						};

						// Save file data to DB
						await createNewFile(fileData);

						filesSaved += 1;
						const totalProgress = Math.round((filesSaved / totalFiles) * 100);
						setUploadProgress(totalProgress);
					}
					message.success('Tất cả các file đã được upload và lưu thành công!');
					setUploadProgress(0);
				} catch (error) {
					console.error('Upload error:', error);
					message.error('Lỗi khi upload hoặc lưu file', 5);
					setUploadProgress(0);
				}
			});

			message.success('Thêm dòng mới thành công!');
			form.resetFields();
			onSuccess();
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

	// Special handling for Ngày, Tháng, Năm fields
	const renderDateFields = () => {
		const ngayField = formFields.find((field) => field.name === 'Ngày');
		const thangField = formFields.find((field) => field.name === 'Tháng');
		const namField = formFields.find((field) => field.name === 'Năm');

		if (ngayField && thangField && namField) {
			return (
				<div className='date-fields-container'>
					<Form.Item
						label='Ngày'
						name='Ngày'
						rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
					>
						<Select placeholder='Ngày'>
							{Array.from({ length: 31 }, (_, i) => (
								<Option key={i + 1} value={i + 1}>
									{i + 1}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item
						label='Tháng'
						name='Tháng'
						rules={[{ required: true, message: 'Vui lòng chọn tháng!' }]}
					>
						<Select placeholder='Tháng'>
							{Array.from({ length: 12 }, (_, i) => (
								<Option key={i + 1} value={i + 1}>
									{i + 1}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item
						label='Năm'
						name='Năm'
						rules={[{ required: true, message: 'Vui lòng nhập năm!' }]}
					>
						<InputNumber
							style={{ width: '100%' }}
							min={1900}
							max={3000}
							placeholder='Năm'
						/>
					</Form.Item>
				</div>
			);
		}

		return null;
	};

	return (
		<div className='template-form-container'>
			<Form
				form={form}
				layout='vertical'
				onFinish={handleSubmit}
				autoComplete='off'
			>
				{/* Render date fields (Ngày, Tháng, Năm) if they exist */}
				{/*{renderDateFields()}*/}
				{ fileNote && fileNote?.info?.time != false && renderDateFields()}

				{/* Render other form fields */}
				{formFields
					.filter(
						(field) =>
							!['Ngày', 'Tháng', 'Năm', 'Thời gian'].includes(field.name),
					)
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

				<Form.Item className='form-actions'>
					<Button type='primary'
                            htmlType='submit'
                            style={{ backgroundColor: '#2d9d5b', color: 'white' }}
					>
						Thêm dòng
					</Button>
					<Button onClick={onCancel} style={{ marginLeft: 8 }}>
						Hủy
					</Button>
				</Form.Item>
			</Form>
		</div>
	);
};

export default TemplateForm;
