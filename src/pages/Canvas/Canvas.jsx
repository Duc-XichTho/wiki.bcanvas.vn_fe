// Canvas.jsx
import css from './Canvas.module.css';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { Layout, Menu, ConfigProvider, Spin } from 'antd';
const { Sider } = Layout;

import {
	NotebookIconCanvas_Green,
	NotebookIconCanvas,
	SoNhanhIconCanvas_Green,
	SoNhanhIconCanvas,
	TaiChinhIconCanvas_Green,
	TaiChinhIconCanvas,
	DongTienIconCanvas_Green,
	DongTienIconCanvas,
	KinhDoanhIconCanvas_Green,
	KinhDoanhIconCanvas,
	DuLieuKhacIconCanvas_Green,
	DuLieuKhacIconCanvas
} from '../../icon/IconSVG.js'
import Loading from '../Loading/Loading.jsx';

function getItem(key, label, icon) {
	return {
		key,
		icon: (
			<div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '5px' }}>
				{icon}
				{label}
			</div>
		),
		label: (
			<>
				<span style={{ fontWeight: 'bold' }}>{label}</span>
			</>
		),
	};
}

const Canvas = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
	const { companySelect, buSelect, tabSelect, siderId } = useParams();
	const [collapsed, setCollapsed] = useState(true);
	const [selectedKey, setSelectedKey] = useState(siderId || '');
	const itemsSider = useMemo(() => {
		const getIcon = (key, whiteIcon, greenIcon) => {
			return selectedKey === key ? <img src={whiteIcon} width={30} height={30} /> : <img src={greenIcon} width={30} height={30} />;
		};

		if (tabSelect === 'dashboard') {
			// return [
			// 	getItem('1', 'NOTEBOOK', getIcon('1', NotebookIconCanvas, NotebookIconCanvas_Green)),
			// 	getItem('2', 'SỔ NHANH', getIcon('2', SoNhanhIconCanvas, SoNhanhIconCanvas_Green)),
			// 	getItem('3', 'KINH DOANH', getIcon('3', KinhDoanhIconCanvas, KinhDoanhIconCanvas_Green)),
			// 	getItem('4', 'TÀI CHÍNH', getIcon('4', TaiChinhIconCanvas, TaiChinhIconCanvas_Green)),
			// 	getItem('5', 'HIỆU QUẢ BU', getIcon('5', DongTienIconCanvas, DongTienIconCanvas_Green)),
			// 	getItem('6', 'HIỆU QUẢ SP', getIcon('6', DongTienIconCanvas, DongTienIconCanvas_Green)),
			// 	getItem('7', 'DỮ LIỆU KHÁC', getIcon('7', DuLieuKhacIconCanvas, DuLieuKhacIconCanvas_Green)),
			// ];
			return []
		}
		// else if (buSelect === 'sale-mkt' && tabSelect === 'dashboard') {
		// 	return [
		// 		getItem('1', 'NOTEBOOK', getIcon('1', NotebookIconCanvas, NotebookIconCanvas_Green)),
		// 		getItem('2', 'SỔ NHANH', getIcon('2', SoNhanhIconCanvas, SoNhanhIconCanvas_Green)),
		// 		getItem('3', 'KINH DOANH', getIcon('3', KinhDoanhIconCanvas, KinhDoanhIconCanvas_Green)),
		// 	];
		// }
		return [];
	}, [buSelect, tabSelect, selectedKey]);


	useEffect(() => {
		setIsLoading(true);
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1000);

		setSelectedKey(siderId || '');
		return () => clearTimeout(timer);
	}, [siderId]);

	// const handleClickMenu = useCallback((e) => {
	// 	setSelectedKey(e.key);
	// 	navigate(`/canvas/${companySelect}/${buSelect}/${tabSelect}/sider/${e.key}`);
	// }, [companySelect, buSelect, tabSelect, navigate]);


	const handleClickMenu = () => {

	}
	return (
		<Layout
			style={{
				height: '100%',
				width: '100%',
				backgroundImage: `url(/canvanbg.png)`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
			}}
		>
			{tabSelect
				? (
					<>
						<div className={css.sider}>
							<Sider
								collapsible
								collapsed={true}
							// onCollapse={(value) => setCollapsed(value)}
							>
								<ConfigProvider
									theme={{
										components: {
											Menu: {
												itemSelectedColor: '#248627',
												itemSelectedBg: '#ececea',
												itemHeight: 80,
											},
										},
									}}
								>
									<div className={css.menu}>
										<Menu
											mode="inline"
											items={itemsSider}
											selectedKeys={[selectedKey]}
											onClick={handleClickMenu}
										/>
									</div>
								</ConfigProvider>
							</Sider>
						</div>
						<Layout style={{ backgroundColor: '#F1F2F3' }}>
							{isLoading ? (
								// <div
								// 	style={{
								// 		width: '100%',
								// 		height: '100%',
								// 		display: 'flex',
								// 		justifyContent: 'center',
								// 		alignItems: 'center',
								// 	}}
								// >
									<Loading loading={isLoading}/>
								// 	<Spin size="large" />
								// </div>
							) : siderId ? (
								<Outlet />
							) : (
								<div
									style={{
										width: '100%',
										height: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '14px',
									}}
								>
									Chọn một mục bên trái để xem nội dung
								</div>
							)}
						</Layout>
					</>
				) : (
					<div
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
					</div>
				)}
		</Layout>
	);
};

export default Canvas;
