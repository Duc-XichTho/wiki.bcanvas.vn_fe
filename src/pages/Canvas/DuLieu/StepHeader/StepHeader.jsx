import css from './StepHeader.module.css';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MyContext } from '../../../../MyContext.jsx';
import { BCTC, DASHBOARD, ICON_RADAR } from '../../../../icon/svg/IconSvg.jsx';
import { getSettingByType } from '../../../../apis/settingService.jsx';
import { fetchDataColor } from '../../Daas/Content/Template/SettingChart/ChartTemplate/setChartTemplate.js';

export default function StepHeader() {
	const { companySelect, buSelect } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { currenStepDuLieu, setCurrenStepDuLieu } = useContext(MyContext);
	const [menuSettingsVersion, setMenuSettingsVersion] = useState(null);
	const isInitialMount = useRef(true);
	const [fills, setFills] = useState(['#fff']);
	useEffect(() => {
		getSettingByType('SettingThemeColor').then(colors => {
			setFills([colors.setting.themeColor]);
		});
	}, []);
	useEffect(() => {
		getSettingByType('MenuSettings').then(res => {
			setMenuSettingsVersion(res.setting.version);
		});
	}, []);

	const steps = [
		// { id: 0, title: 'HOME', path: 'home' },
		// { id: 1, title: 'DANH MỤC', path: 'danh-muc' },
		menuSettingsVersion === 'full' ? { id: 2, title: 'Input mode', path: 'du-lieu-dau-vao' } : null,
		{ id: 3, title: 'Data View', path: 'du-lieu-tong-hop' },
		// { id: 4, icon: <DASHBOARD /> ,title: 'DASHBOARD'},
	].filter(step => step !== null);

	const handleTapClick = (step) => {
		if (step.id != 4) {
			setCurrenStepDuLieu(step);
			localStorage.setItem('stepSelectDuLieu', JSON.stringify(step));
			if (step.path) {
				navigate(`/canvas/${companySelect}/${buSelect}/thuc-hien/${step.path}`);
			}
		} else {
			navigate(`/canvas/${companySelect}/${buSelect}/dashboard`);
		}
	};

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			if (steps.length === 1) {
				setCurrenStepDuLieu(steps[0]);
				localStorage.setItem('stepSelectDuLieu', JSON.stringify(steps[0]));
				if (steps[0].path) {
					navigate(`/canvas/${companySelect}/${buSelect}/thuc-hien/${steps[0].path}`);
				}
			} else {
				if (location.pathname.includes('thuc-hien/du-lieu-dau-vao')) {
					setCurrenStepDuLieu(steps[0]);
				} else if (location.pathname.includes('thuc-hien/du-lieu-tong-hop')) {
					setCurrenStepDuLieu(steps[1]);
				}
			}
		}
	}, [location.pathname, steps]);

	if (steps.length === 1) {
		return null;
	}

	return (
		<div className={css.container}>
			<div className={css.stepWrapper}>
				{steps.map((step, index) => (
					<div key={step.id} className={css.stepItem}>
						<div
							className={index === 4 ? '' : css.stepBox}
							style={{
								fontWeight: currenStepDuLieu?.id === step.id ? 'bold' : 'normal',
								color: currenStepDuLieu?.id == step.id ? fills[0] : '#c8c8c8',
								fontSize: '15px',
								padding: '3px 15px',
								border: currenStepDuLieu?.id == step.id ? `1px solid ${fills[0]}` : '1px solid #c8c8c8',
								borderRadius: '10px',
							}}
							onClick={() => handleTapClick(step)}
						>
							<div className={css.stepContent}>

								<span>{step.title}</span>
							</div>
						</div>
						{step.id === 0 && (
							<div className={css.lineTap}>
								<div style={{
									width: '2px',
									height: '24px',
									backgroundColor: 'rgba(99, 99, 99, 1)',
								}} />
							</div>

						)}
						{step.id === 1 && (
							<div className={css.connectorLine1}>
								<div style={{ width: '100%', height: '1px', border: '1px solid #C0C0C0' }} />
								{/*<img src={'/connector-line7.svg'} alt='Connector Line' />*/}
							</div>
						)}
						{step.id === 2 && (
							<>
								{/*<div className={css.connectorLine1}>*/}
								{/*	<img src={'/connector-line7.svg'} alt='Connector Line' />*/}
								{/*</div>*/}
								{/*<span style={{ fontSize: '12px', padding: '5px' }}>Xử lý làm sạch</span>*/}
								<div className={css.connectorLine1}>
									{/*<div style={{ width: '100%', height: '1px', border: '1px solid #C0C0C0' }} />*/}
									{/*<img src={'/connector-line9.svg'} alt='Connector Line' />*/}
								</div>
							</>
						)}
						{/*{step.id === 3 && (*/}
						{/*	<>*/}
						{/*		/!*<div className={css.connectorLine1}>*!/*/}
						{/*		/!*	<img src={'/connector-line7.svg'} alt='Connector Line' />*!/*/}
						{/*		/!*</div>*!/*/}
						{/*		/!*<span style={{ fontSize: '12px', padding: '5px' }}>Kết hợp, phân tích</span>*!/*/}
						{/*		<div className={css.connectorLine1}>*/}
						{/*			/!*<div style={{ width: '100%', height: '1px', border: '1px solid #C0C0C0' }} />*!/*/}
						{/*			<img src={'/connector-line9.svg'} alt='Connector Line' />*/}
						{/*		</div>*/}
						{/*	</>*/}
						{/*)}*/}
					</div>
				))}
			</div>
		</div>
	);
}
