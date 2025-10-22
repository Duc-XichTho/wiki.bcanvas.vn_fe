import React, { useEffect, useState } from "react";
import { Button, message, Modal, Spin, Checkbox, Input } from "antd";
import { getAllKHKD } from "../../../apis/khkdService.jsx";
import { updateKHKDTongHop } from '../../../apis/khkdTongHopService.jsx';

const SetListElement = ({ isVisible, onClose, idHopKH, khkdTH, fetchKHTH }) => {
	const [list, setList] = useState([]);
	const [selectedIds, setSelectedIds] = useState([]);
	const [loading, setLoading] = useState(false);

	const [showDL, setShowDL] = useState(true);
	const [showBH, setShowBH] = useState(true);
	const [showKD, setShowKD] = useState(true);
	const [showDT, setShowDT] = useState(true);
	const [showDTFull, setShowDTFull] = useState(true); // ✅ Thêm biến mới
	const [dauKy, setDauKy] = useState("");

	useEffect(() => {
		setSelectedIds(khkdTH?.listKHKD || []);
		setShowDL(khkdTH?.showDL ?? true);
		setShowBH(khkdTH?.showBH ?? true);
		setShowKD(khkdTH?.showKD ?? true);
		setShowDT(khkdTH?.showDT ?? true);
		setShowDTFull(khkdTH?.showDTFull ?? true); // ✅ Đọc giá trị showDTFull
		setDauKy(khkdTH?.dauKy ?? "");
	}, [idHopKH]);

	useEffect(() => {
		if (isVisible) {
			const fetchInitialData = async () => {
				setLoading(true);
				try {
					let data = await getAllKHKD();
					setList(data);
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

	const handleCheckboxChange = (id, isChecked) => {
		if (isChecked) {
			setSelectedIds((prevSelected) => [...prevSelected, id]);
		} else {
			setSelectedIds((prevSelected) =>
				prevSelected.filter((itemId) => itemId !== id)
			);
		}
	};

	return (
		<Modal
			title="Cài đặt"
			open={isVisible}
			onCancel={onClose}
			footer={null}
			width={1200}
		>
			<Spin spinning={loading}>
				{/* Cấu hình hiển thị và đầu kỳ */}
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
						style={{ marginLeft: 16 }}
					>
						Hiển thị kết quả kinh doanh
					</Checkbox>
					<Checkbox
						checked={showDT}
						onChange={(e) => setShowDT(e.target.checked)}
						style={{ marginLeft: 16 }}
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
				</div>


				{/* Danh sách checkbox kế hoạch */}
				<label style={{ width: '100%', marginBottom: 8, display: 'block' }}>
					Chọn các bảng kế hoạch muốn hợp nhất:
				</label>
				<div>
					{list.map((item) => (
						<div key={item.id} style={{ marginBottom: 8 }}>
							<Checkbox
								onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
								checked={selectedIds.includes(item.id)}
							>
								{item.name}
							</Checkbox>
						</div>
					))}
				</div>
{showDT && <div style={{ marginBottom: 16 }}>
					<label>Khai báo tiền đầu kỳ (Cho dòng tiền):</label>
					<Input
						placeholder="Nhập giá trị đầu kỳ"
						value={dauKy}
						onChange={(e) => setDauKy(e.target.value)}
						style={{ width: 300, marginLeft: 8 }}
					/>
				</div>}
				
			</Spin>

			{/* Footer */}
			<div style={{ textAlign: 'right', marginTop: 16 }}>
				<Button onClick={onClose} style={{ marginRight: 8 }}>
					Đóng
				</Button>
				<Button
					type="primary"
					onClick={() => {
						updateKHKDTongHop({
							id: idHopKH,
							listKHKD: selectedIds,
							showBH,
							showDL,
							showKD,
							showDT,
							showDTFull,
							dauKy,
						}).then(() => {
							message.success("Danh sách đã được lưu!");
							fetchKHTH();
						});
					}}
				>
					Lưu
				</Button>
			</div>
		</Modal>
	);
};

export default SetListElement;
