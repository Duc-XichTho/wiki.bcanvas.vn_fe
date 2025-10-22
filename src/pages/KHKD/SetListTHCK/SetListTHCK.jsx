import React, { useState, useEffect } from 'react';
import { Modal, Select, Spin, Checkbox, message, Card, Divider, Switch } from 'antd';
import { getAllTemplateTables, getTemplateColumn } from '../../../apis/templateSettingService.jsx';
import { getFileNotePadByIdController } from '../../../apis/fileNotePadService.jsx';
import { getKHKDTongHopById } from '../../../apis/khkdTongHopService.jsx';
import css from './SetListTHCK.module.css';

const SetListTHCK = ({ isVisible, onClose, idHopKH, updateKHKDTongHop, khkdTH, fetchKHTH }) => {
	const [listTemp, setListTemp] = useState([]);
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [selectedTemplate2, setSelectedTemplate2] = useState(null);
	const [templateDoLuongThucHien, setTemplateDoLuongThucHien] = useState(null);
	const [templateBanHang, setTemplateBanHang] = useState(null);
	const [templateDoLuongCungKy, setTemplateDoLuongCungKy] = useState(null);
	const [templateDongTienThucHien, setTemplateDongTienThucHien] = useState(null);
	const [templateDongTienCungKy, setTemplateDongTienCungKy] = useState(null);
	const [columnsThucHien, setColumnsThucHien] = useState([]);
	const [columnsCungKy, setColumnsCungKy] = useState([]);
	const [selectedColumnThucHien, setSelectedColumnThucHien] = useState(null);
	const [selectedColumnCungKy, setSelectedColumnCungKy] = useState(null);
	const [columnsDoLuongThucHien, setColumnsDoLuongThucHien] = useState([]);
	const [columnsBanHang, setColumnsBanHang] = useState([]);
	const [columnsDoLuongCungKy, setColumnsDoLuongCungKy] = useState([]);
	const [columnsDongTienThucHien, setColumnsDongTienThucHien] = useState([]);
	const [columnsDongTienCungKy, setColumnsDongTienCungKy] = useState([]);
	const [selectedDoLuongThucHien, setSelectedDoLuongThucHien] = useState(null);
	const [selectedBanHangNgay, setSelectedBanHangNgay] = useState(null);
	const [selectedBanHangThang, setSelectedBanHangThang] = useState(null);
	const [selectedBanHangGiaTri, setSelectedBanHangGiaTri] = useState(null);
	const [selectedBanHangNam, setSelectedBanHangNam] = useState(null);
	const [selectedBanHangName, setSelectedBanHangName] = useState(null);
	const [selectedBanHangBoPhan, setSelectedBanHangBoPhan] = useState(null);
	const [selectedBanHangKhoanMuc, setSelectedBanHangKhoanMuc] = useState(null);

	const [selectedDoLuongCungKy, setSelectedDoLuongCungKy] = useState(null);
	const [selectedDongTienThucHien, setSelectedDongTienThucHien] = useState(null);
	const [selectedDongTienCungKy, setSelectedDongTienCungKy] = useState(null);
	const [loading, setLoading] = useState(false);
	const [isCungKy, setIsCungKy] = useState(false);
	const [selectedMonths, setSelectedMonths] = useState([]);
	const [infoKHKDTH, setInfoKHKDTH] = useState(null);
	const [banHangDisplayType, setBanHangDisplayType] = useState(null);
	const [banHangCungKyDisplayType, setBanHangCungKyDisplayType] = useState(null);

	const [selectedBanHangNameCungKy, setSelectedBanHangNameCungKy] = useState(null);
	const [selectedBanHangKhoanMucCungKy, setSelectedBanHangKhoanMucCungKy] = useState(null);
	const [selectedBanHangBoPhanCungKy, setSelectedBanHangBoPhanCungKy] = useState(null);
	const [selectedBanHangNgayCungKy, setSelectedBanHangNgayCungKy] = useState(null);
	const [selectedBanHangThangCungKy, setSelectedBanHangThangCungKy] = useState(null);
	const [selectedBanHangGiaTriCungKy, setSelectedBanHangGiaTriCungKy] = useState(null);

	const [showDL, setShowDL] = useState(true);
	const [showBH, setShowBH] = useState(true);
	const [showKD, setShowKD] = useState(true);
	const [showDT, setShowDT] = useState(true);
	const [selectedIds, setSelectedIds] = useState([]);
	const [showDTFull, setShowDTFull] = useState(true); // ✅ Thêm biến mới
	const [showBenchmark, setShowBenchmark] = useState(true);
	const [showKPI, setShowKPI] = useState(true);
	const [dauKy, setDauKy] = useState("");
	const getAllTemplate = async () => {
		setLoading(true);
		let data = await getAllTemplateTables();
		// data = data.filter(item => !item.isCombine);
		for (const item of data) {
			if (typeof item !== 'object' || item === null) continue;
			let fileNote = await getFileNotePadByIdController(item.fileNote_id);
			item.name = fileNote?.name;
			item.value = item.id;
			item.type = fileNote.table;
		}
		data = data.filter(item => item.type === 'Template');
		setListTemp(data);
		setLoading(false);
	};

	const fetchColumns = async (templateId, setColumns) => {
		if (!templateId) return;
		const columns = await getTemplateColumn(templateId);
		setColumns(columns.map(col => ({ label: col.columnName, value: col.columnName })));
	};
	useEffect(() => {
		setSelectedIds(khkdTH?.listKHKD || []);
		setShowDL(khkdTH?.showDL ?? true);
		setShowBH(khkdTH?.showBH ?? true);
		setShowKD(khkdTH?.showKD ?? true);
		setShowDT(khkdTH?.showDT ?? true);
		setShowDTFull(khkdTH?.showDTFull ?? true); // ✅ Đọc giá trị showDTFull
		setShowBenchmark(khkdTH?.showBenchmark ?? true);
		setShowKPI(khkdTH?.showKPI ?? true);
		setDauKy(khkdTH?.dauKy ?? "");
	}, [idHopKH]);``


	useEffect(() => {
		if (isVisible) {
			const fetchData = async () => {
				setLoading(true);
				try {
					const response = await getKHKDTongHopById(idHopKH);
					setSelectedMonths(response?.month || []);
					setInfoKHKDTH(response?.info || {});
					setIsCungKy(response.info?.showCungKy ?? true);
					if (response?.listTemplate) {
						const {
							cungKy,
							thucHien,
							doLuongCungKy,
							doLuongThucHien,
							dongTienCungKy,
							dongTienThucHien,
							banHang,
							banHangCungKy
						} = response.listTemplate;
						// Set default values for Select components
						setSelectedTemplate(thucHien?.templateId || null);
						setSelectedColumnThucHien(thucHien?.columnName || null);
						setSelectedTemplate2(cungKy?.templateId || null);
						setSelectedColumnCungKy(cungKy?.columnName || null);
						setTemplateDoLuongThucHien(doLuongThucHien?.templateId || null);
						setSelectedDoLuongThucHien(doLuongThucHien?.columnName || null);
						setTemplateDoLuongCungKy(doLuongCungKy?.templateId || null);
						setSelectedDoLuongCungKy(doLuongCungKy?.columnName || null);
						setTemplateDongTienThucHien(dongTienThucHien?.templateId || null);
						setSelectedDongTienThucHien(dongTienThucHien?.columnName || null);
						setTemplateDongTienCungKy(dongTienCungKy?.templateId || null);
						setSelectedDongTienCungKy(dongTienCungKy?.columnName || null);

						// Set lại state cho phần bán hàng
						setTemplateBanHang(banHang?.templateId || null);
						setSelectedBanHangName(banHang?.name || null);
						setSelectedBanHangKhoanMuc(banHang?.khoanMuc || null);
						setSelectedBanHangBoPhan(banHang?.boPhan || null);
						setSelectedBanHangNgay(banHang?.ngay || null);
						setSelectedBanHangThang(banHang?.thang || null);
						setSelectedBanHangGiaTri(banHang?.giaTri || null);
						setBanHangDisplayType(banHang?.displayType || null);
						// Set lại state cho các giá trị cùng kỳ từ banHangCungKy
						setSelectedBanHangNameCungKy(banHangCungKy?.name || null);
						setSelectedBanHangKhoanMucCungKy(banHangCungKy?.khoanMuc || null);
						setSelectedBanHangBoPhanCungKy(banHangCungKy?.boPhan || null);
						setSelectedBanHangNgayCungKy(banHangCungKy?.ngay || null);
						setSelectedBanHangThangCungKy(banHangCungKy?.thang || null);
						setSelectedBanHangGiaTriCungKy(banHangCungKy?.giaTri || null);
						setBanHangCungKyDisplayType(banHangCungKy?.displayType || null);
					} else {
						console.log('No listTemplate found in response data');
					}
				} catch (error) {
					console.error('Error fetching data from KHKD Tong Hop:', error);
					message.error('Failed to fetch data from KHKD Tong Hop');
				} finally {
					setLoading(false);
				}
			};

			fetchData();
			getAllTemplate(); // Fetch templates for dropdown options
		}
	}, [isVisible]);

	useEffect(() => {
		fetchColumns(templateBanHang, setColumnsBanHang);
	}, [templateBanHang]);

	useEffect(() => {
		fetchColumns(templateDoLuongThucHien, setColumnsDoLuongThucHien);
	}, [templateDoLuongThucHien]);

	useEffect(() => {
		fetchColumns(templateDoLuongCungKy, setColumnsDoLuongCungKy);
	}, [templateDoLuongCungKy]);

	useEffect(() => {
		fetchColumns(templateDongTienThucHien, setColumnsDongTienThucHien);
	}, [templateDongTienThucHien]);

	useEffect(() => {
		fetchColumns(templateDongTienCungKy, setColumnsDongTienCungKy);
	}, [templateDongTienCungKy]);

	useEffect(() => {
		fetchColumns(selectedTemplate, setColumnsThucHien);
	}, [selectedTemplate]);

	useEffect(() => {
		fetchColumns(selectedTemplate2, setColumnsCungKy);
	}, [selectedTemplate2]);

	useEffect(() => {
		fetchColumns(selectedTemplate, setColumnsDoLuongThucHien);
	}, [selectedTemplate]);


	useEffect(() => {
		fetchColumns(selectedTemplate2, setColumnsDoLuongCungKy);
	}, [selectedTemplate2]);

	const handleSave = async () => {
		setLoading(true);
		try {
			const listTemplate = {
				thucHien: {
					templateId: selectedTemplate,
					columnName: selectedColumnThucHien,
				},
				cungKy: {
					templateId: selectedTemplate2,
					columnName: selectedColumnCungKy,
				},
				doLuongThucHien: {
					templateId: templateDoLuongThucHien,
					columnName: selectedDoLuongThucHien,
				},
				doLuongCungKy: {
					templateId: templateDoLuongCungKy,
					columnName: selectedDoLuongCungKy,
				},
				dongTienThucHien: {
					templateId: templateDongTienThucHien,
					columnName: selectedDongTienThucHien,
				},
				dongTienCungKy: {
					templateId: templateDongTienCungKy,
					columnName: selectedDongTienCungKy,
				},
				banHang: {
					templateId: templateBanHang,
					name: selectedBanHangName,
					khoanMuc: selectedBanHangKhoanMuc,
					boPhan: selectedBanHangBoPhan,
					ngay: selectedBanHangNgay,
					thang: selectedBanHangThang,
					giaTri: selectedBanHangGiaTri,
					displayType: banHangDisplayType,
				},
				banHangCungKy: {
					templateId: templateBanHang, // nếu muốn chọn bảng riêng thì đổi thành templateBanHangCungKy
					name: selectedBanHangNameCungKy,
					khoanMuc: selectedBanHangKhoanMucCungKy,
					boPhan: selectedBanHangBoPhanCungKy,
					ngay: selectedBanHangNgayCungKy,
					thang: selectedBanHangThangCungKy,
					giaTri: selectedBanHangGiaTriCungKy,
					displayType: banHangCungKyDisplayType,
				},
			};
			const infoToSend = {
				...infoKHKDTH,
				showCungKy: isCungKy,
			};
			await updateKHKDTongHop({ id: idHopKH, listTemplate, month: selectedMonths, info: infoToSend, showDL,
				showBH,
				showKD,
				showDT,
				showDTFull, showBenchmark,
				showKPI, });
			message.success('Cập nhật thành công');
			fetchKHTH();
			onClose();
		} catch (error) {
			console.error('Error saving settings:', error);
			message.error('Failed to save settings');
		} finally {
			setLoading(false);
		}
	};

	const monthOptions = [
		{ label: 'Tất cả', value: 'all' },
		...Array.from({ length: 12 }, (_, i) => ({
			label: `Tháng ${i + 1}`,
			value: `${i + 1}`,
		})),
	];

	const handleChange = (checkedValues) => {
		const filteredCheckedValues = checkedValues.filter(value => value !== 'all');

		// Trường hợp khi không có "all" và chọn "all", ta sẽ chọn tất cả các tháng
		if (!selectedMonths?.includes('all') && checkedValues.includes('all')) {
			setSelectedMonths(['all', ...monthOptions.filter(item => item.value != 'all').map(m => m.value)]);
			return;
		}

		// Trường hợp khi có "all" nhưng bỏ bớt một tháng (tức là không chọn đủ 12 tháng) => bỏ "all"
		if (selectedMonths?.includes('all') && filteredCheckedValues.length < monthOptions.length) {
			setSelectedMonths(checkedValues.filter(v => v !== 'all'));
			return;
		}

		if (selectedMonths?.includes('all') && checkedValues.length == monthOptions.length) {
			setSelectedMonths([]);
			return;
		}

		// Trường hợp khi chọn đủ tất cả các tháng (12 tháng), sẽ thêm "all"
		if (checkedValues.length === monthOptions.length) {
			setSelectedMonths([...checkedValues]);
			return;
		}

		const valuesWithoutAll = checkedValues.filter(v => v !== 'all');
		setSelectedMonths(valuesWithoutAll);
	};


	const handleToggleCungKy = () => {
		setIsCungKy(!isCungKy);
	};

	const cardTitle = (
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
			<span>Cài đặt hiển thị</span>
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<span style={{ fontSize: 14 }}>Cùng kỳ</span>
				<Switch checked={isCungKy} onChange={handleToggleCungKy} />
			</div>
		</div>
	);

	return (
		<Modal
			visible={isVisible}
			onCancel={onClose}
			onOk={handleSave}
			title='Cài đặt'
			okText='Lưu'
			cancelText='Huỷ'
			width={800}
		>
			{loading ? (
				<Spin tip='Loading templates...' />
			) : (
				<div className={css.container}>
					{/* CụC 4: Chọn tháng */}
					<Card title={cardTitle} className={css.card}>
						<Checkbox.Group
							options={monthOptions}
							value={selectedMonths}
							onChange={handleChange}
							style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
						/>
					</Card>

					<Card>
						<div style={{ marginBottom: 16 }}>
							<Checkbox checked={showBH} onChange={(e) => setShowBH(e.target.checked)}>
								Hiển thị bán hàng
							</Checkbox>
							<Checkbox checked={showDL} onChange={(e) => setShowDL(e.target.checked)}>
								Hiển thị đo lường
							</Checkbox>
							<Checkbox
								checked={showKD}
								onChange={(e) => setShowKD(e.target.checked)}
							>
								Hiển thị kết quả kinh doanh
							</Checkbox>
							<Checkbox
								checked={showDT}
								onChange={(e) => setShowDT(e.target.checked)}
							>
								Hiển thị dòng tiền
							</Checkbox>
							{/* ✅ Checkbox bổ sung khi showDT = true */}
							{showDT && (
								<Checkbox
									checked={showDTFull}
									onChange={(e) => setShowDTFull(e.target.checked)}
								>
									Hiển thị đầy đủ dòng tiền
								</Checkbox>
							)}
							<Checkbox checked={showBenchmark} onChange={(e) => setShowBenchmark(e.target.checked)} style={{ marginLeft: 16 }}>
								Hiển thị Benchmark
							</Checkbox>
							<Checkbox checked={showKPI} onChange={(e) => setShowKPI(e.target.checked)} style={{ marginLeft: 16 }}>
								Hiển thị KPI
							</Checkbox>
						</div>
					</Card>

					<Card title='Cài đặt bán hàng' className={css.card}>
						<label>Chọn bảng dữ liệu thực hiện</label>
						<div className={css.row}>
							<Select
								style={{ width: '100%' }}
								placeholder='Chọn bảng dữ liệu'
								options={listTemp.map(temp => ({ label: temp.name, value: temp.value }))}
								onChange={setTemplateBanHang}
								value={templateBanHang}
							/>
						</div>

						<div className={css.row} style={{ gap: 8, flexWrap: 'wrap' }}>
							<div className={css.rowCustome} style={{ flex: 1, minWidth: 200 }}>
								<label>Vụ việc</label>
								<Select
									style={{ width: '100%', marginLeft: 5 }}
									placeholder='Chọn cột vụ việc'
									options={columnsBanHang}
									onChange={setSelectedBanHangName}
									value={selectedBanHangName}
								/>
							</div>
							<div className={css.rowCustome} style={{ flex: 1, minWidth: 200 }}>
								<label>Khoản mục</label>
								<Select
									style={{ width: '100%', marginLeft: 5 }}
									placeholder='Chọn cột Khoản mục'
									options={columnsBanHang}
									onChange={setSelectedBanHangKhoanMuc}
									value={selectedBanHangKhoanMuc}
								/>
							</div>
							<div className={css.rowCustome} style={{ flex: 1, minWidth: 200 }}>
								<label>Bộ phận</label>
								<Select
									style={{ width: '100%', marginLeft: 5 }}
									placeholder='Chọn cột Bộ phận'
									options={columnsBanHang}
									onChange={setSelectedBanHangBoPhan}
									value={selectedBanHangBoPhan}
								/>
							</div>
							<div className={css.rowCustome} style={{ flex: 1, minWidth: 200 }}>
								<label>Ngày</label>
								<Select
									style={{ width: '100%', marginLeft: 5 }}
									placeholder='Chọn cột Ngày'
									options={columnsBanHang}
									onChange={setSelectedBanHangNgay}
									value={selectedBanHangNgay}
								/>
							</div>
							<div className={css.rowCustome} style={{ flex: 1, minWidth: 200 }}>
								<label>Tháng</label>
								<Select
									style={{ width: '100%', marginLeft: 5 }}
									placeholder='Chọn cột Tháng'
									options={columnsBanHang}
									onChange={setSelectedBanHangThang}
									value={selectedBanHangThang}
								/>
							</div>
							<div className={css.rowCustome} style={{ flex: 1, minWidth: 200 }}>
								<label>Giá trị</label>
								<Select
									style={{ width: '100%', marginLeft: 5 }}
									placeholder='Chọn cột giá trị'
									options={columnsBanHang}
									onChange={setSelectedBanHangGiaTri}
									value={selectedBanHangGiaTri}
								/>
							</div>
						</div>
						<Divider />
					</Card>

					{/* CụC 1: Đo lường */}
					<Card title='Đo lường' className={css.card}>
						<label>Chọn bảng dữ liệu thực hiện</label>
						<div className={css.row}>
							<Select
								style={{ width: '40%' }}
								placeholder='Chọn bảng dữ liệu đo lường thực hiện'
								options={listTemp.map(temp => ({ label: temp.name, value: temp.value }))}
								onChange={setTemplateDoLuongThucHien}
								value={templateDoLuongThucHien}
							/>
							<Select
								style={{ width: '55%', marginLeft: 5 }}
								placeholder='Chọn cột'
								options={columnsDoLuongThucHien}
								onChange={setSelectedDoLuongThucHien}
								value={selectedDoLuongThucHien}
							/>
						</div>

						<Divider />
						{
							isCungKy &&
							<>
								<label>Đo lường cùng kỳ</label>
								<div className={css.row}>
									<Select
										style={{ width: '40%' }}
										placeholder='Chọn bảng dữ liệu đo lường cùng kỳ'
										options={listTemp.map(temp => ({ label: temp.name, value: temp.value }))}
										onChange={setTemplateDoLuongCungKy}
										value={templateDoLuongCungKy}
									/>
									<Select
										style={{ width: '55%', marginLeft: 5 }}
										placeholder='Chọn cột'
										options={columnsDoLuongCungKy}
										onChange={setSelectedDoLuongCungKy}
										value={selectedDoLuongCungKy}
									/>
								</div>
							</>
						}

					</Card>

					{/* CụC 2: KQKD */}
					<Card title='Kết quả kinh doanh' className={css.card}>
						<label>Chọn bảng dữ liệu thực hiện</label>
						<div className={css.row}>
							<Select
								style={{ width: '40%' }}
								placeholder='Chọn bảng dữ liệu KQKD thực hiện'
								options={listTemp.map(temp => ({ label: temp.name, value: temp.value }))}
								onChange={setSelectedTemplate}
								value={selectedTemplate}
							/>
							<Select
								style={{ width: '55%', marginLeft: 5 }}
								placeholder='Chọn cột khoản mục'
								options={columnsThucHien}
								onChange={setSelectedColumnThucHien}
								value={selectedColumnThucHien}
							/>
						</div>

						<Divider />
						{
							isCungKy && <>
								<label>Cùng kỳ</label>
								<div className={css.row}>
									<Select
										style={{ width: '40%' }}
										placeholder='Chọn bảng dữ liệu KQKD cùng kỳ'
										options={listTemp.map(temp => ({ label: temp.name, value: temp.value }))}
										onChange={setSelectedTemplate2}
										value={selectedTemplate2}
									/>
									<Select
										style={{ width: '55%', marginLeft: 5 }}
										placeholder='Chọn cột khoản mục'
										options={columnsCungKy}
										onChange={setSelectedColumnCungKy}
										value={selectedColumnCungKy}
									/>
								</div>
							</>
						}

					</Card>

					{/* CụC 3: Dòng tiền */}
					<Card title='Dòng tiền' className={css.card}>
						<label>Chọn bảng dữ liệu thực hiện</label>
						<div className={css.row}>
							<Select
								style={{ width: '40%' }}
								placeholder='Chọn bảng dữ liệu dòng tiền thực hiện'
								options={listTemp.map(temp => ({ label: temp.name, value: temp.value }))}
								onChange={setTemplateDongTienThucHien}
								value={templateDongTienThucHien}
							/>
							<Select
								style={{ width: '55%', marginLeft: 5 }}
								placeholder='Chọn cột'
								options={columnsDongTienThucHien}
								onChange={setSelectedDongTienThucHien}
								value={selectedDongTienThucHien}
							/>
						</div>

						<Divider />
						{
							isCungKy && <>
								<label>Cùng kỳ</label>
								<div className={css.row}>
									<Select
										style={{ width: '40%' }}
										placeholder='Chọn bảng dữ liệu dòng tiền cùng kỳ'
										options={listTemp.map(temp => ({ label: temp.name, value: temp.value }))}
										onChange={setTemplateDongTienCungKy}
										value={templateDongTienCungKy}
									/>
									<Select
										style={{ width: '55%', marginLeft: 5 }}
										placeholder='Chọn cột'
										options={columnsDongTienCungKy}
										onChange={setSelectedDongTienCungKy}
										value={selectedDongTienCungKy}
									/>
								</div>
							</>
						}
					</Card>
				</div>

			)}
		</Modal>
	);
};

export default SetListTHCK;
