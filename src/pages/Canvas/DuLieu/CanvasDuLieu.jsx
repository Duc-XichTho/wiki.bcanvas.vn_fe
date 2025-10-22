import css from './CanvasDuLieu.module.css';
import { Outlet, useLocation } from 'react-router-dom';
import StepHeader from './StepHeader/StepHeader.jsx';
import CanvasDuLieuSidebar from './Sidebar/CanvasDuLieuSidebar.jsx';
import { useContext } from 'react';
import { MyContext } from '../../../MyContext.jsx';
import { MdTouchApp } from 'react-icons/md';

const CanvasDuLieu = () => {
	const { currenStepDuLieu, } = useContext(MyContext);
	const location = useLocation();
	const isAtRoot = location.pathname.endsWith('/thuc-hien');
	return (
		<div className={css.container}>
			<div className={css.headerContent}>
				<StepHeader />
			</div>
			<div className={css.outlet}>
				{
				currenStepDuLieu?.path &&  	<div className={css.sidebar}>
						<CanvasDuLieuSidebar/>
					</div>
				}
				{isAtRoot ? (
					<div className={css.contentNoTabMessage}>
						<div className={css.noTabMessage}>
							<MdTouchApp size={50} color="#aaa" />
							<p>Vui lòng chọn một Tab để bắt đầu sử dụng chức năng</p>
						</div>
					</div>

				)  : (
					<div className={css.content}>
						<Outlet />
					</div>
				)}

			</div>
		</div>
	);
};

export default CanvasDuLieu;
