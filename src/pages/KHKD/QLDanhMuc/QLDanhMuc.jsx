import React, { useState, useEffect } from "react";
import { Modal, Button, Spin, Select, message } from "antd";
import {
	getAllTemplateTables,
	getTemplateColumn,
} from "../../../apis/templateSettingService.jsx";
import { getFileNotePadByIdController } from "../../../apis/fileNotePadService.jsx";
import { createSetting } from '../../../apis/settingService.jsx';
import * as settingService from '../../../apis/settingService.jsx';

const QLDanhMuc = ({ isVisible, onClose }) => {
	const [templates, setTemplates] = useState([]);
	const [selectedKhoanMuc, setSelectedKhoanMuc] = useState(null);
	const [selectedBoPhan, setSelectedBoPhan] = useState(null);
	const [selectedBoPhanColumn, setSelectedBoPhanColumn] = useState(null)
	const [columnsKhoanMuc, setColumnsKhoanMuc] = useState([]);
	const [selectedKhoanMucColumn, setSelectedKhoanMucColumn] = useState(null);
	const [selectedPhanLoaiColumn, setSelectedPhanLoaiColumn] = useState(null);
	const [columnsBoPhan, setColumnsBoPhan] = useState([]);
	const [loading, setLoading] = useState(false);

	const fetchTemplates = async () => {
		setLoading(true);
		let data = await getAllTemplateTables();
		data = data.filter((item) => !item.isCombine);
		for (const item of data) {
			if (typeof item !== "object" || item === null) continue;
			const fileNote = await getFileNotePadByIdController(item.fileNote_id);
			item.name = fileNote?.name;
			item.value = "TEMP_" + item.id;
			item.type = fileNote.table;
		}
		setTemplates(data.filter((item) => item.type === "Template"));
		setLoading(false);
	};

	const fetchColumns = async (templateId, setColumns) => {
		setLoading(true);
		const columnsData = await getTemplateColumn(templateId);
		setColumns(columnsData.map((col) => ({ field: col.columnName, headerName: col.columnName })));
		setLoading(false);
	};

	useEffect(() => {
		if (isVisible) {
			const fetchInitialData = async () => {
				setLoading(true);
				try {
					await fetchTemplates(); // Fetch templates
					const khkdData = await settingService.getSettingByType("KHKD");
					if (khkdData?.setting) {
						const { khoanMuc, boPhan , phanLoai} = khkdData.setting;
						setSelectedKhoanMuc(khoanMuc?.templateId || null);
						setSelectedKhoanMucColumn(khoanMuc?.columnName || null);
						setSelectedPhanLoaiColumn(phanLoai?.columnName || null);
						setSelectedBoPhan(boPhan?.templateId || null);
						setSelectedBoPhanColumn(boPhan?.columnName || null);

						// Fetch columns for pre-selected templates
						if (khoanMuc?.templateId) {
							await fetchColumns(khoanMuc.templateId, setColumnsKhoanMuc);
						}
						if (boPhan?.templateId) {
							await fetchColumns(boPhan.templateId, setColumnsBoPhan);
						}
					}
				} catch (error) {
					console.error("Error fetching initial data:", error);
					message.error("Failed to load initial data.");
				} finally {
					setLoading(false);
				}
			};

			fetchInitialData();
		}
	}, [isVisible]);

	const handleKhoanMucChange = (templateId) => {
		setSelectedKhoanMuc(templateId);
		fetchColumns(templateId, setColumnsKhoanMuc);
	};

	const handleBoPhanChange = (templateId) => {
		setSelectedBoPhan(templateId);
		fetchColumns(templateId, setColumnsBoPhan);
	};

	return (
		<Modal
			title="QL Danh mục"
			open={isVisible}
			onCancel={onClose}
			footer={null}
			width={700}
		>
			<Spin spinning={loading}>
				<label style={{ width: "100%", marginBottom: 16 }}>Chọn Khoản mục<br></br></label>
				<Select
					placeholder="Chọn bảng khoản mục"
					style={{ width: "40%", marginBottom: 16 }}
					value={selectedKhoanMuc}
					onChange={handleKhoanMucChange}
				>
					{templates.map((template) => (
						<Select.Option key={template.id} value={template.id}>
							{template.name}
						</Select.Option>
					))}
				</Select>
				<Select
					placeholder="Chọn cột khoản mục"
					style={{ width: "29%", marginBottom: 16, marginLeft: 5 }}
					value={selectedKhoanMucColumn}
					onChange={(value) => setSelectedKhoanMucColumn(value)}
				>
					{columnsKhoanMuc.map((col) => (
						<Select.Option key={col.field} value={col.field}>
							{col.headerName}
						</Select.Option>
					))}
				</Select>
				<Select
					placeholder="Chọn cột phân loại"
					style={{ width: "29%", marginBottom: 16, marginLeft: 5 }}
					value={selectedPhanLoaiColumn}
					onChange={(value) => setSelectedPhanLoaiColumn(value)}
				>
					{columnsKhoanMuc.map((col) => (
						<Select.Option key={col.field} value={col.field}>
							{col.headerName}
						</Select.Option>
					))}
				</Select>

				<label style={{ width: "100%", marginBottom: 16 }}>Chọn Bộ phận<br></br></label>
				<Select
					placeholder="Chọn bảng bộ phận"
					style={{ width: "40%", marginBottom: 16 }}
					value={selectedBoPhan}
					onChange={handleBoPhanChange}
				>
					{templates.map((template) => (
						<Select.Option key={template.id} value={template.id}>
							{template.name}
						</Select.Option>
					))}
				</Select>

				<Select
					placeholder="Chọn cột bộ phận"
					style={{ width: "59%", marginBottom: 16, marginLeft: 5 }}
					value={selectedBoPhanColumn}
					onChange={(value) => setSelectedBoPhanColumn(value)}
				>
					{columnsBoPhan.map((col) => (
						<Select.Option key={col.field} value={col.field}>
							{col.headerName}
						</Select.Option>
					))}
				</Select>
			</Spin>
			<div style={{ textAlign: "right", marginTop: 16 }}>
				<Button onClick={onClose} style={{ marginRight: 8 }}>
					Đóng
				</Button>
				<Button
					type="primary"
					onClick={async () => {
						const selectedKhoanMucTemplateId = selectedKhoanMuc;
						const selectedKhoanMucColumnName = columnsKhoanMuc.find((col) => col.field === selectedKhoanMucColumn)?.headerName;
						const selectedPhanLoaiColumnName = columnsKhoanMuc.find((col) => col.field === selectedPhanLoaiColumn)?.headerName;

						const selectedBoPhanTemplateId = selectedBoPhan;
						const selectedBoPhanColumnName = columnsBoPhan.find((col) => col.field === selectedBoPhanColumn)?.headerName;

						const newSettingData = {
							type: "KHKD",
							setting: {
								phanLoai: {
									templateId: selectedKhoanMucTemplateId,
									columnName: selectedPhanLoaiColumnName,
								},
								khoanMuc: {
									templateId: selectedKhoanMucTemplateId,
									columnName: selectedKhoanMucColumnName,
								},
								boPhan: {
									templateId: selectedBoPhanTemplateId,
									columnName: selectedBoPhanColumnName,
								},
							},
						};

						try {
							const existingSetting = await settingService.getSettingByType("KHKD");
							if (existingSetting) {
								await settingService.updateSetting({ ...existingSetting, ...newSettingData });
								message.success("Thêm thành công.");
							} else {
								await createSetting(newSettingData);
								message.success("Thêm thành công.");
							}
							onClose(); // Close the modal
						} catch (error) {
							console.error("Error saving data:", error);
							message.error("Failed to save data.");
						}
					}}
				>
					Lưu
				</Button>
			</div>
		</Modal>
	);
};

export default QLDanhMuc;