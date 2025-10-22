import css from './StepHeaderHome.module.css';
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MyContext } from '../../../../../MyContext.jsx';
import { ICON_RADAR } from '../../../../../icon/svg/IconSvg.jsx';
import { getSettingByType } from '../../../../../apis/settingService.jsx';

export default function StepHeaderHome() {
	const { companySelect, buSelect } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { currenStepHome, setCurrenStepHome } = useContext(MyContext);
	const [fills, setFills] = useState(['#fff']);
	useEffect(() => {
		getSettingByType('SettingThemeColor').then(colors => {
			setFills([colors.setting.themeColor]);
		});
	}, []);

	const steps = [
		{ id: 0, title: 'Phương pháp', path: 'phuong-phap' },
		{ id: 1, title: 'Bộ chỉ số', path: 'bo-chi-so' },
		{ id: 2, title: 'HDSD', path: 'guide' },
	];

	const handleTapClick = (step) => {
		setCurrenStepHome(step);
		localStorage.setItem('stepSelectHome', JSON.stringify(step));
		if (step.path) {
			navigate(`/canvas/${companySelect}/${buSelect}/home/${step.path}`);
		}
	};

	useEffect(() => {
		if (location.pathname.includes('home/phuong-phap')) {
			setCurrenStepHome(steps[0]);
		} else if (location.pathname.includes('home/bo-chi-so')) {
			setCurrenStepHome(steps[1]);
		} else if (location.pathname.includes('home/guide')) {
			setCurrenStepHome(steps[2]);
		}
	}, [location.pathname]);

	return (
		<div className={css.container}>
			<div className={css.stepWrapper}>
				{steps.map((step) => (
					<div key={step.id} className={css.stepItem}>
						<div
							className={css.stepBox}
							style={{
								// backgroundColor: currenStepHome?.id === step.id ? '#409CE3' : '#E9E9E9',
								// color: currenStepHome?.id === step.id ? '#FFFFFF' : '#9b9b9b',
								fontWeight: currenStepHome?.id === step.id ? 'bold' : 'normal',
								// paddingTop: currenStepHome?.id == step.id ? '3px' : '13px',
								// paddingBottom: currenStepHome?.id == step.id ? '6px' : '9px',
								// paddingLeft: currenStepHome?.id == step.id ? '32px' : '40px',
								// paddingRight: '40px',
								// borderTopLeftRadius: '3px',
								// borderTopRightRadius: '7px',

								color: currenStepHome?.id == step.id  ? fills[0] : '#c8c8c8',
								border: currenStepHome?.id == step.id ? `1px solid ${fills[0]}` : '1px solid #c8c8c8',

								fontSize: '15px',
								padding: '3px 15px',
								borderRadius: '10px',
							}}
							onClick={() => handleTapClick(step)}
						>
							<div className={css.stepContent}>
						
								<span>{step.title}</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}