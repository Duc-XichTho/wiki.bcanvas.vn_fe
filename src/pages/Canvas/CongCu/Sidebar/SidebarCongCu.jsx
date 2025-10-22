import css from './SidebarCongCu.module.css';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Popconfirm } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Ban_Do, BCTC, PTCL, To_Do, WebPage_Icon } from '../../../../icon/svg/IconSvg.jsx';

const SidebarCongCu = () => {
	const { companySelect, buSelect } = useParams();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState('To-do');
	const [expandedItem, setExpandedItem] = useState(null);
	const location = useLocation();

	const strategicItems = [
		{
			id: 'pestel',
			title: 'PESTEL',
			link: `/canvas/${companySelect}/${buSelect}/cong-cu/phan-tich-chien-luoc/pestel`,
		},
		{
			id: 'porter',
			title: 'Mô hình Porter',
			link: `/canvas/${companySelect}/${buSelect}/cong-cu/phan-tich-chien-luoc/porter`,
		},
		{
			id: 'swot',
			title: 'SWOT',
			link: `/canvas/${companySelect}/${buSelect}/cong-cu/phan-tich-chien-luoc/swot`,
		},
		{
			id: 'clddx',
			title: 'CL Đại dương xanh',
			link: `/canvas/${companySelect}/${buSelect}/cong-cu/phan-tich-chien-luoc/clddx`,
		},
	];

	const items = [
		// {
		// 	id: 1,
		// 	title: 'Phân tích chiến lược',
		// 	icon: <PTCL />,
		// 	link: `/canvas/${companySelect}/${buSelect}/cong-cu/phan-tich-chien-luoc`,
		// 	subItems: strategicItems,
		// },
		{
			id: 2,
			title: 'Bản đồ dữ liệu quản trị',
			icon: <Ban_Do />,
			link: `/canvas/${companySelect}/${buSelect}/cong-cu/ban-do-du-lieu-quan-tri`,
		},
		{
			id: 3,
			title: 'Dimension Accounting',
			icon: <BCTC />,
			link: '/ke-toan-quan-tri',
		},
		{
			id: 4,
			title: 'Quản lý To-do',
			icon: <To_Do />,
			link: `/canvas/${companySelect}/${buSelect}/cong-cu/project-manager`,
		},
		{
			id: 5,
			title: 'Tạo mini-web page',
			icon: <WebPage_Icon width={20} height={22} />,
			link: `/canvas/${companySelect}/${buSelect}/cong-cu/web-page`,
		},
	];

	const handleTabClick = (tab) => {
		if (tab.id === 3) {
			return;
		}

		if (tab.id === 1) {
			setExpandedItem(expandedItem === 1 ? null : 1);
		} else {
			setActiveTab(tab);
			console.log(tab);
			navigate(tab.link);
			setExpandedItem(null);
		}
	};

	const handleSubItemClick = (subItem) => {
		setActiveTab(subItem);
		navigate(subItem.link);
	};

	const handleExternalLink = (tab) => {
		window.open(tab.link, '_blank');
	};
	useEffect(() => {
        // Handle strategic analysis routes
        if (location.pathname.includes('/phan-tich-chien-luoc')) {
            setExpandedItem(1); // Keep the menu expanded

            if (location.pathname.includes('/pestel')) {
                setActiveTab(strategicItems[0]);
            } else if (location.pathname.includes('/porter')) {
                setActiveTab(strategicItems[1]);
            } else if (location.pathname.includes('/swot')) {
                setActiveTab(strategicItems[2]);
            } else if (location.pathname.includes('/clddx')) {
                setActiveTab(strategicItems[3]);
            }
        }
        // Handle management data map route
        else if (location.pathname.includes('/ban-do-du-lieu-quan-tri')) {
            setActiveTab(items[0]);
            setExpandedItem(null);
        }
		else if (location.pathname.includes('/project-manager')) {
			setActiveTab(items[2]);
			setExpandedItem(null);
		}
    }, [location.pathname, companySelect, buSelect]);

	return (
		<div className={css.main}>
			<div className={css.sidebar}>
				<div className={css.menu}>
					{items.map((tab) => (
						<div key={tab.id}>
							{tab.id === 3 ? (
								<Popconfirm
									title="Xác nhận chuyển hướng"
									description="Bạn có muốn chuyển tới ứng dụng này không?"
									onConfirm={() => handleExternalLink(tab)}
									okText="Đồng ý"
									cancelText="Hủy"
								>
									<div className={`${css.tab}${activeTab.id === tab.id ? css['active'] : ''}`}>
										<div className={css.tabContent}>
											{tab.icon}
											<span>{tab.title}</span>
										</div>
									</div>
								</Popconfirm>
							) : (
								<>
									<div
										className={`${css.tab} ${
											tab.id === 1 ?
												((strategicItems.some(item => item.id === activeTab.id)) || expandedItem === tab.id ? css['expanded'] : '') :
												(activeTab.id === tab.id ? css['active'] : '')
										}`}
										onClick={() => handleTabClick(tab)}
									>
										<div className={css.tabContent}>
											{tab.icon}
											<span>{tab.title}</span>
										</div>
										{tab.subItems && (
											expandedItem === tab.id ?
												<UpOutlined className={css.arrow} /> :
												<DownOutlined className={css.arrow} />
										)}
									</div>
									{tab.subItems && expandedItem === tab.id && (
										<div className={css.subItems}>
											{tab.subItems.map((subItem) => (
												<div
													key={subItem.id}
													className={`${css.subTab} ${activeTab.id === subItem.id ? css['active'] : ''}`}
													onClick={() => handleSubItemClick(subItem)}
												>
													{subItem.title}
												</div>
											))}
										</div>
									)}
								</>
							)}
						</div>
					))}
				</div>
				<div className={css.textFooter}>
					B-Canvas - SAB Platform
				</div>
			</div>
		</div>
	);
};

export default SidebarCongCu;
