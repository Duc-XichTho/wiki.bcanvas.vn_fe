import css from './CanvasCongCu.module.css';
import { Outlet } from 'react-router-dom';
import SidebarCongCu from './Sidebar/SidebarCongCu.jsx';

const CanvasCongCu = () => {
	return (
		<div className={css.container}>
			{/*<div className={css.sidebar}>*/}
			{/*	<SidebarCongCu/>*/}
			{/*</div>*/}
			<div className={css.outlet}>
				<Outlet />
			</div>
		</div>
	);
};

export default CanvasCongCu;
