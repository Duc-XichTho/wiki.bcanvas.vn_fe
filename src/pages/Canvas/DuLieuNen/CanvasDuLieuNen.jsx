import css from './CanvasDuLieuNen.module.css';
import { Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { MyContext } from '../../../MyContext.jsx';
import CanvasDuLieuNenSidebar from './Sidebar/CanvasDuLieuNenSidebar.jsx';

export default function CanvasDuLieuNen() {
	const { currenStepDuLieu } = useContext(MyContext);

	return (
		<div className={css.container}>
			<div className={css.outlet}>
				<div className={css.sidebar}>
					<CanvasDuLieuNenSidebar />
				</div>
				<div className={css.content}>
					<Outlet />
				</div>
			</div>
		</div>
	);
};

