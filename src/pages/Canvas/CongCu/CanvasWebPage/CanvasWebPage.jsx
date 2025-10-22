import React from 'react';
import SidebarWebPage from './SidebarWebPage/SidebarWebPage.jsx';
import css from './CanvasWebPage.module.css';

const CanvasWebPage = () => {
	return (
		<div className={css.main}>
			<div className={css.header}>
				<h1 className={css.title}>📚 Quản lý Web Page</h1>
			</div>
			<div className={css.canvasContainer}>
				<SidebarWebPage />
			</div>
		</div>
	);

};

export default CanvasWebPage;
