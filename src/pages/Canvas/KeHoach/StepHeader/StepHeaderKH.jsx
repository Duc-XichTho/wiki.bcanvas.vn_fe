import css from './StepHeaderKH.module.css';
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MyContext } from '../../../../MyContext.jsx';
import { BCTC, DASHBOARD, ICON_RADAR } from '../../../../icon/svg/IconSvg.jsx';
import { getSettingByType } from '../../../../apis/settingService.jsx';

export default function StepHeaderKH() {
	const { companySelect, buSelect } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { currenStepKeHoach, setCurrenStepKeHoach} = useContext(MyContext);
	const [fills, setFills] = useState(['#fff']);
	useEffect(() => {
		getSettingByType('SettingThemeColor').then(colors => {
			setFills([colors.setting.themeColor]);
		});
	}, []);

	const steps = [
		// { id: 0, title: 'HOME', path: 'home' },
		// { id: 1, title: 'DANH MỤC', path: 'danh-muc' },
		{ id: 2, title: 'Lập kế hoạch', path: 'lap-ke-hoach' },
		{ id: 3, title: 'Tổng hợp kế hoạch', path: 'hop-ke-hoach' },
	];


	const handleTapClick = (step) => {
		// if (step.id != 4 ) {
		// 	setCurrenStepKeHoach(step);
		// 	localStorage.setItem('stepSelectKeHoach', JSON.stringify(step));
		// 	if (step.path) {
		// 		navigate(`/canvas/${companySelect}/${buSelect}/ke-hoach/${step.path}`);
		// 	}
		// }
		setCurrenStepKeHoach(step);
		localStorage.setItem('stepSelectKeHoach', JSON.stringify(step));
		if (step.path) {
			navigate(`/canvas/${companySelect}/${buSelect}/ke-hoach/${step.path}`);
		}

	};

	useEffect(() => {
		if (location.pathname.includes('ke-hoach/lap-ke-hoach')) {
			setCurrenStepKeHoach(steps[0]);
		} else if (location.pathname.includes('ke-hoach/hop-ke-hoach')) {
			setCurrenStepKeHoach(steps[1]);
		}
	}, [location.pathname]);


	return (
		<div className={css.container} style={{ position: 'relative' }}>
			{steps.map((step, index) => (
				<div
					key={step.id}
					className={css.stepItem}
					style={{
						color: currenStepKeHoach?.id == step.id? fills[0] : '#c8c8c8',
						fontWeight: currenStepKeHoach?.id == step.id? 'bold' : 'normal',
						border: currenStepKeHoach?.id == step.id ? `1px solid ${fills[0]}` : '1px solid #c8c8c8',
						fontSize: '15px',
						padding: '	3px 15px',
						borderRadius: '10px',
					}}
					onClick={() => handleTapClick(step)}
				>
					<div className={css.stepContent}>

						<span>{step.title}</span>
					</div>
				</div>
			))}
		</div>
	)
		;
}
