import css from './CrossRoadPopup2.module.css';
import { useState, useContext } from 'react';
import { Card, Button, Modal, Flex, Input, message, Badge, Spin } from 'antd';
import { Todo, Admin, Accounting, ReportBuilder, ReportCanvas, Wiki } from '../../icon/svg/IconSvg';
import { createFeedback } from '../../apis/feedbackService.jsx';
import { MyContext } from '../../MyContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import Loading3DTower from '../Loading3DTower';

const { TextArea } = Input;

const CrossRoadPopup2 = ({ openCrossRoad, onOkCrossRoad, onCancelCrossRoad }) => {
	const { buSelect, companySelect } = useParams();
	const { currentUser } = useContext(MyContext);
	const [openFeedback, setOpenFeedback] = useState(false);
	const [titleFeedback, setTitleFeedback] = useState('');
	const [bodyFeedback, setBodyFeedback] = useState('');
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [loadingNav, setLoadingNav] = useState(false);
	const navigate = useNavigate();

	const listPage = [
		{ id: 1, icon: <ReportCanvas />, title: 'Trang chủ ', desc: 'Vận hành - quản lý tập trung' },
		{ id: 2, icon: <></>, title: 'Dimension Accounting', desc: 'Dimension Accounting' },
		{ id: 3, icon: <></>, title: 'Quản lý To-do', desc: 'Quản lý To-do' },
		// { id: 4, icon: <></>, title: 'Chat AI External', desc: 'Trợ lý AI tra cứu dữ liệu' },
		{ id: 5, icon: <Todo />, title: 'Gateway', desc: 'Gateway' },
		{ id: 8, icon: <Wiki />, title: 'Wiki', desc: 'Kho tài nguyên' },
		{ id: 9, icon: <Admin />, title: 'Admin', desc: 'Cấu hình phân quyền' },
	];

	const onChangeTitle = (e) => {
		setTitleFeedback(e.target.value);
	};

	const onChangeBody = (e) => {
		setBodyFeedback(e.target.value);
	};

	const handleCloseFeedback = () => {
		setTitleFeedback('');
		setBodyFeedback('');
		setOpenFeedback(false);
	};

	const renderFeedback = () => {

		return (
			<Flex vertical gap={16}>
				<Input
					placeholder='tiêu đề'
					showCount maxLength={100}
					value={titleFeedback}
					onChange={onChangeTitle}
				/>
				<TextArea
					showCount
					maxLength={2000}
					placeholder='nội dung'
					style={{
						height: 260,
						resize: 'none',
					}}
					value={bodyFeedback}
					onChange={onChangeBody}
				/>
			</Flex>
		);
	};

	const handleSelectPage = (page) => {
		const pageRoutes = {
			1: `${import.meta.env.VITE_DOMAIN_URL}/canvas`,
			2: `/canvas/${companySelect}/${buSelect}/ke-toan-quan-tri`,
			3: `/canvas/${companySelect}/${buSelect}/cong-cu/project-manager`,
			// 4: `/canvas/${companySelect}/${buSelect}/ai-external`,
			5: `${import.meta.env.VITE_DOMAIN_URL}/gateway`,
			8: 'https://sab.io.vn',
			9: `${import.meta.env.VITE_DOMAIN_URL}/admin`,
		};

		const url = pageRoutes[page.id];

		if (url) {
			if (page.id === 2 || page.id === 3 || page.id === 4 ) {
				if (loadingNav) return;
				onCancelCrossRoad();
				setLoadingNav(true);
				setTimeout(() => {
					navigate(url);
					setLoadingNav(false);
				}, 500);
			} else {
				if (page.id === 8) {
					window.open(url, '_blank');
				} else {
					window.location.href = url;
				}
			}
		} else {
			console.warn('Page ID không hợp lệ:', page.id);
		}
	};

	const renderCard = (page) => (
		<div className={css.cardContent}>
			{/*<div className={css.cardIcon}>{page.icon}</div>*/}
			<div className={css.cardInfo}>
				<div className={css.cardTitle}>{page.title}</div>
				<div className={css.cardDesc}>{page.desc}</div>
				{/*<div className={css.shortcut}>SHIFT + {page.id}</div>*/}
			</div>
		</div>
	);

	const handleSendEmail = async () => {

		setConfirmLoading(true);

		if (!titleFeedback.trim() || !bodyFeedback.trim()) {
			message.warning('Vui lòng nhập tiêu đề và nội dung!');
			setConfirmLoading(false);
			return;
		}

		const emailData = {
			senderName: currentUser?.name,
			senderEmail: currentUser?.email,
			title: titleFeedback,
			body: bodyFeedback,
		};

		try {
			const response = await createFeedback(emailData);

			if (response.data.code === 'OK') {
				message.success('Gửi thành công');
				setConfirmLoading(false);
				handleCloseFeedback();
			} else {
				setConfirmLoading(false);
				message.error('Gửi thất bại');
			}
		} catch (error) {
			setConfirmLoading(false);
			console.error('Lỗi gửi email:', error);
		}
	};


	return (
		<>
			<div className={css.crossRoadPopupContainer}>
				<Modal
					title=''
					open={openCrossRoad}
					onOk={onOkCrossRoad}
					onCancel={onCancelCrossRoad}
					width={330}
					footer={null}
					closable={false}
					getContainer={false}
					style={{
						position: 'absolute',
						top: '6%',
						left: '0.5%',
					}}
				>
					<div className={css.main} style={{ position: 'relative' }}>
						{loadingNav && (
							<div style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: '100%',
								background: 'rgba(255,255,255,0.7)',
								zIndex: 10,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							<Loading3DTower /> 
							</div>
						)}
						<div className={css.container} style={loadingNav ? { filter: 'blur(2px)' } : {}}>
							<div className={css.body}>
								<div className={css.bodyContainer}>
									<div className={css.bodyRight}>
										<div className={css.bodyRightContainer}>
											<Card>
												{listPage.map(page => (
													<Card.Grid
														onClick={() => handleSelectPage(page)}
														key={page.id}>{renderCard(page)}
													</Card.Grid>
												))}
											</Card>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Modal>
			</div>

			<Modal
				width={700}
				title='Yêu cầu hỗ trợ'
				confirmLoading={confirmLoading}
				centered
				open={openFeedback}
				onOk={() => handleSendEmail()}
				onCancel={() => handleCloseFeedback()}
				okText='Gửi'
				cancelText='Hủy'
				maskClosable={false}
				styles={{
					body: {
						height: 350,
						overflowY: 'auto',
					},
				}}
			>
				{renderFeedback()}
			</Modal>
		</>
	);
};

export default CrossRoadPopup2;
