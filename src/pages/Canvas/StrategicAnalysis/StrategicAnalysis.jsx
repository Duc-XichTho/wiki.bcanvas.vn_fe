import { useState } from "react";
import { Modal } from "antd";
import css from "./StrategicAnalysis.module.css";
import Pestel from './Pestel/Pestel.jsx';
import Porter from './Porter/Porter.jsx';
import SWOT from './SWOT/Swot.jsx';
import CLDDX from './CLDaiDuongXanh/CLDaiDuongXanh.jsx';
import { Outlet } from "react-router-dom";

export default function StrategicAnalysis() {
	// Trạng thái mục được chọn
	const [selectedTab, setSelectedTab] = useState("overview");

	// Danh sách mục trong sidebar
	const menuItems = [
		{ key: "pestel", label: "PESTEL" },
		{ key: "porter", label: "Mô hình Porter" },
		{ key: "swot", label: "SWOT" },
		{ key: "clddx", label: "CL Đại dương xanh" },
	];

	return (

			<div className={css.container}>
				{/* Sidebar */}
				
				{/* Nội dung bên phải */}
				<div className={css.content}>
				<Outlet/>
				</div>
			</div>
	);
}
