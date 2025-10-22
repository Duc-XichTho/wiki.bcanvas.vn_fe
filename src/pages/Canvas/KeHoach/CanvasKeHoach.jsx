import css from './CanvasKeHoach.module.css';
import { Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { MyContext } from '../../../MyContext.jsx';
import StepHeaderKH from './StepHeader/StepHeaderKH.jsx';
import LapKHSidebar from './CanvasLapKeHoach/LapKHSidebar.jsx';
import HopKHSidebar from './CanvasHopKeHoach/HopKHSidebar.jsx';
import { MdTouchApp } from 'react-icons/md';

export default function CanvasKeHoach() {
	const { currenStepKeHoach } = useContext(MyContext);
	const location = useLocation();
	const isAtRoot = location.pathname.endsWith('/ke-hoach');

	return (
		<div className={css.container}>
			<div className={css.headerContent}>
				<StepHeaderKH />
			</div>
			<div className={css.outlet}>
				{currenStepKeHoach?.path == 'lap-ke-hoach' &&
					<div className={css.sidebar}>
						<LapKHSidebar />
					</div>
				}
				{currenStepKeHoach?.path == 'hop-ke-hoach' &&
					<div className={css.sidebar}>
						<HopKHSidebar />
					</div>
				}

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
