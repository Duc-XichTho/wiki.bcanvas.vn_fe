import css from './CanvasHome.module.css';
import LapKHSidebar from '../../KeHoach/CanvasLapKeHoach/LapKHSidebar.jsx';
import HopKHSidebar from '../../KeHoach/CanvasHopKeHoach/HopKHSidebar.jsx';
import { MdTouchApp } from 'react-icons/md';
import { Outlet, useLocation } from 'react-router-dom';
import StepHeaderHome from './StepHeaderHome/StepHeaderHome.jsx';
import { useContext } from 'react';
import { MyContext } from '../../../../MyContext.jsx';

export default function CanvasHome() {
	const { currenStepHome } = useContext(MyContext);
	const location = useLocation();
	const isAtRoot = location.pathname.endsWith('/home');

	return (
		<div className={css.container}>
			<div className={css.headerContent}>
				<StepHeaderHome />
			</div>
			<div className={css.outlet}>
				{isAtRoot ? (
					<div className={css.contentNoTabMessage}>
						<div className={css.noTabMessage}>
							<MdTouchApp size={50} color='#aaa' />
							<p>Vui lòng chọn một Tab để bắt đầu sử dụng chức năng</p>
						</div>
					</div>

				) : (
					<div className={css.content}>
						<Outlet />
					</div>

				)}
			</div>
		</div>

	);
};
