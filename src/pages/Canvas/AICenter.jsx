import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button } from 'antd';
import { AIDataAnalystIcon, DocumentWikiBotIcon, ICON_AI_CHAT_ICON, ICON_AI_CHAT_ICON_DARK } from '../../icon/svg/IconSvg.jsx';
import { getSettingByType } from '../../apis/settingService.jsx';

const aiList = [
	// {
	// 	title: 'AI Report Builder',
	// 	description: 'Generate business reports with AI.',
	// 	icon: <AIDataAnalystIcon width={40} height={40} />,
	// 	key: 'analyst',
	// },

	{
		title: 'AI Report Builder',
		description: 'Tạo báo cáo từ bảng dữ liệu đã tích hợp',
		icon:  <AIDataAnalystIcon width={40} height={40} />,
		key: 'ai-builder-moi',
	},
	{
		title: 'Document & Wiki Bot',
		description: 'Hỏi đáp văn bản và quy chế thông minh',
		icon: <DocumentWikiBotIcon width={40} height={40} />,
		key: 'document-bot',
	},
	{
		title: 'AI Creator',
		description: 'Trợ lý AI cá nhân cho các công việc chuyên môn',
		icon: <ICON_AI_CHAT_ICON_DARK width={40} height={40} />,
		key: 'free-ai',
	},
];

export default function AICenter() {
	const [themeColor, setThemeColor] = useState('#1890ff');

	useEffect(() => {
		const fetchThemeColor = async () => {
			try {
				const data = await getSettingByType('SettingThemeColor');
				if (data?.setting?.themeColor) {
					setThemeColor(data.setting.themeColor);
				}
			} catch (error) {
				console.error('Error fetching theme color:', error);
			}
		};
		fetchThemeColor();
	}, []);

	return (
		<div
			style={{
				minHeight: '80vh',
				width: '100vw',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				background: '#f7f9fb',
				margin: 0,
				padding: 0,
			}}
		>
			<Row gutter={[0, 32]} justify="start" style={{ width: '100vw', margin: 0, padding: '0 400px' }}>
				{aiList.map(ai => (
					<Col key={ai.key} xs={24} sm={12} md={8}>
						<Card
							hoverable
							style={{
								textAlign: 'center',
								minHeight: 280,
								width: '95%', // control card width here
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'space-between',
								alignItems: 'center',
								boxShadow: '0 2px 12px #e6e6e6',
								borderRadius: 12,
								background: '#fff',
								margin: '0 auto',
							}}
							bodyStyle={{
								flex: 1,
								width: '100%',
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'space-between',
							}}
						>
							<div>
								<div style={{ marginBottom: 16 }}>{ai.icon}</div>
								<h3>{ai.title}</h3>
								<p style={{ color: '#888', minHeight: 40 }}>{ai.description}</p>
							</div>
							<Button
								type="primary"
								style={{
									backgroundColor: themeColor,
									borderColor: themeColor,
								}}
								onClick={() => {
									// Map your ai.key to the correct type string
									const aiTypeMap = {
										analyst: 'dataAnalyst',
										'document-bot': 'externalAI',
										'free-ai': 'aiChat',
										'ai-builder-moi': 'ai-builder-moi',
									};
									const type = aiTypeMap[ai.key];
									console.log(type); // For debugging
									window.dispatchEvent(new CustomEvent('toggleAI', { detail: { type } }));
								}}
							>
								Sử dụng
							</Button>
						</Card>
					</Col>
				))}
			</Row>
		</div>
	);
}