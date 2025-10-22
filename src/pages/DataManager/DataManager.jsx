import React, { useState } from 'react';
import css from './DataManager.module.css';
import { Outlet } from 'react-router-dom';
import HeaderDM from './header/HeaderDM.jsx';
import SidebarDM from './sidebar/SidebarDM.jsx';
import { Select } from 'antd';
import { ConfigProvider, theme } from 'antd';
const { Option } = Select;

const DataManager = () => {
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [shouldShowSidebar, setShouldShowSidebar] = useState(true);
	const theme = localStorage.getItem('theme') || 'light';

	return (
		<ConfigProvider
			theme={{

				components: {
					Button:  {
						...(theme === 'dark' && {
							defaultBg: '#545E66' ,
							defaultHoverBg: '#334155' ,
							defaultColor: '#fff' ,
							defaultHoverColor: '#fff' ,
							defaultBorderColor: '#334155' ,
							defaultActiveColor: '#fff' ,
							colorPrimary: '#1E2A3B' ,
							colorPrimaryHover: '#344357' ,
							colorPrimaryBase: '#1E2A3B' ,
	
						})
					},
			
					Pagination: {
						...(theme === 'dark' && {
							colorText: "#fff" ,
							colorPrimary: "#1E2A3B" ,
							colorPrimaryHover: "#344357" ,
							colorPrimaryActive: "#1E2A3B" ,
						colorTextLightSolid: "#fff" ,
						itemBg: "#000" ,
						itemLinkBg: "#000" ,
						itemLinkColor: "#fff" ,
						}),
					},
				
					
				},
			}}
		>

			<div className={css.container}>
				<div className={css.header}>
					<HeaderDM />
				</div>
				<div className={css.main}>
					{shouldShowSidebar && (
						<div className={`${css.sidebar} ${isSidebarCollapsed ? css.sidebarCollapsed : ''}`}>
							<SidebarDM />
						</div>
					)}
					<div className={`${theme === 'dark' ? css.contentDark : css.content} ${isSidebarCollapsed ? css.contentExpanded : ''}`}
					>
						<Outlet />
					</div>

				</div>
			</div>
		</ConfigProvider>
	);
};

export default DataManager;
