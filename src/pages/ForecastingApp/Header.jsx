import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, Flex, Typography, Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { BackCanvas, ICON_CROSSROAD_LIST } from '../../icon/svg/IconSvg.jsx';
import { MyContext } from '../../MyContext.jsx';
import { getSettingByType } from '../../apis/settingService.jsx';
import css from './Header.module.css';
import ProfileSelect from '../Home/SelectComponent/ProfileSelect.jsx';

const { Title } = Typography;


export default function Header({
								   onRunForecast,
							   }) {
	const navigate = useNavigate();
	const { currentUser } = useContext(MyContext);
	const [nameTable, setNameTable] = useState(null);
	const [tool, setTool] = useState(null);
	const location = useLocation();
	
	// Determine active tab based on current route
	const isDataTab = location.pathname.includes('/forecast/data');
	const isResultsTab = location.pathname.includes('/forecast/results') || location.pathname === '/forecast';

	const getDashboardSetting = async () => {
		try {
			const res = await getSettingByType('DASHBOARD_SETTING');
			if (res.setting.length > 0) {
				let dashboardSetting = res.setting.find(item => location.pathname.includes(item.id));
				if (dashboardSetting) {
					setNameTable(dashboardSetting.name);
					setTool(dashboardSetting);
				} else {
					setNameTable('FORECASTING');
				}
			}
		} catch (error) {
			console.log('error', error);
		}
	};

	useEffect(() => {
		getDashboardSetting();
	}, [currentUser, location]);

	const getIconSrcById = (tool) => {
		const found = ICON_CROSSROAD_LIST.find(item => item.id == tool.icon);
		return found ? found.icon : undefined;
	};

	return (
		<div className={css.navContainer}>
			<div className={css.header_left}>
				<div
					className={css.backCanvas}
					onClick={() => navigate('/dashboard')}
					title="Back to Dashboard"
				>
					<BackCanvas height={20} width={20} />
				</div>
				{tool && <img src={getIconSrcById(tool)} alt={tool.name} width={30} height={30} />}
				<div className={css.headerLogo}>
					{nameTable}
				</div>
			</div>
			<div className={css.header_right}>
				<Button
					type="primary"
					icon={<PlayCircleOutlined />}
					onClick={onRunForecast}
				>
					Run Forecast
				</Button>

				<div style={{ display: 'flex', margin: 0 }}>
					<Link 
						to="/forecast/data"
						style={{ 
							padding: '8px 16px', 
							cursor: 'pointer',
							borderBottom: isDataTab ? '2px solid #1890ff' : '2px solid transparent',
							color: isDataTab ? '#1890ff' : '#666',
							fontWeight: isDataTab ? '500' : 'normal',
							textDecoration: 'none'
						}}
					>
						Data
					</Link>
					<Link 
						to="/forecast/results"
						style={{ 
							padding: '8px 16px', 
							cursor: 'pointer',
							borderBottom: isResultsTab ? '2px solid #1890ff' : '2px solid transparent',
							color: isResultsTab ? '#1890ff' : '#666',
							fontWeight: isResultsTab ? '500' : 'normal',
							textDecoration: 'none'
						}}
					>
						Results
					</Link>
				</div>

				<div className={css.header_right}>
					<div className={css.username}>
						<ProfileSelect />
					</div>
				</div>
			</div>
		</div>
	);
}
