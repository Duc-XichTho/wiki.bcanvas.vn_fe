import React, { useContext, useEffect, useState } from 'react';
import { MyContext } from '../../../../../MyContext.jsx';
import { createNewWebPage, getAllWebPage } from '../../../../../apis/webPageService.jsx';
import { createTimestamp } from '../../../../../generalFunction/format.js';
import { message } from 'antd';
import css from './SidebarWebPage.module.css';
import IconButton from '@mui/material/IconButton';
import { Create_Icon, WebPage } from '../../../../../icon/svg/IconSvg.jsx';
import EditWebpage from '../Action/WebPage/EditWebPage.jsx';
import CreateWebPage from '../Action/WebPage/CreateWebPage.jsx';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

export default function SidebarWebPage() {
	const [listPage, setListPage] = useState([]);
	const [search, setSearch] = useState('');
	const [selectedPage, setSelectedPage] = useState(null);
	const [selectedStory, setSelectedStory] = useState(null);
	const [page, setPage] = useState(null);
	const [openModalType, setOpenModalType] = useState(null);
	const { currentUser, setCurrentUser } = useContext(MyContext);
	const { companySelect, buSelect, idWebPage } = useParams();
	const [openCreateWebPageModal, setOpenCreateWebPageModal] = useState(false);


	const filteredlistPage = listPage?.filter(page =>
		page?.name?.toLowerCase()?.includes(search.toLowerCase()),
	);

	const handleOpenModal = (e, type, value) => {
		setOpenModalType(type);
		setPage(value);
	};

	const fetchData = async () => {
		const data = await getAllWebPage();
		setListPage(data);
	};

	useEffect(() => {
		fetchData();
	}, []);


	const handleCreateWebPage = async (data) => {
		try {
			const newData = {
				...data,
				created_at: createTimestamp(),
				user_create: currentUser.email,
			};

			const createdPage = await createNewWebPage(newData);
			setListPage(prev => [createdPage, ...prev]);
			message.success('Tạo web page thành công');
		} catch (error) {
			message.success('Lỗi Tạo web page');
		}
	};


	const handleOpenAddPage = () => {
		setOpenCreateWebPageModal(true);
	};

	const handleCloseAddPage = () => {
		setOpenCreateWebPageModal(false);
	};


	const navigate = useNavigate();

	const handleClick = (data) => {
		setSelectedStory(null);
		setSelectedPage(data);
		navigate(`/canvas/${companySelect}/${buSelect}/cong-cu/web-page/${data.id}`);

	};

	return (
		<>
			<div className={css.mainContent}>
				<div className={css.sidebar}>
					<div className={css.buttonAction}>
						<h4>Danh sách web page</h4>
						<IconButton onClick={handleOpenAddPage}>
							<Create_Icon height={20} width={20} />
						</IconButton>
					</div>
					<input
						type='text'
						placeholder='Tìm kiếm web page...'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className={css.searchInput}
					/>
					<div className={css.pageList}>
						{filteredlistPage.map(page => (
							<div
								key={page.id}
								className={`${css.pageItem} ${(idWebPage || selectedPage?.id) == page.id ? css.active : ''}`}
								onClick={() => {
									handleClick(page);
								}}
							>
								<div className={css.nameItem}>
									<WebPage height={18} width={20} />
									<span>{page.name}</span>
								</div>
								<div className={css.info}>
									<span onClick={(e) => {
										handleOpenModal(e, 'editor', page);

									}}>
										Editor: {page.editor}
									</span>
									<span onClick={(e) => {
										handleOpenModal(e, 'header', page);
									}}>
											Header trang
								    </span>
									<span onClick={(e) => {
										handleOpenModal(e, 'password', page);
									}}>
										Cài mật khẩu
									</span>
								</div>

							</div>
						))}
					</div>
				</div>

				<div className={css.storyPanel}>
					<Outlet />
				</div>
			</div>
			{openModalType && <EditWebpage openType={openModalType}
										   onClose={() => setOpenModalType(null)}
										   page={page}
			/>
			}
			{openCreateWebPageModal && <CreateWebPage open={openCreateWebPageModal}
													  onClose={handleCloseAddPage}
													  onCreate={handleCreateWebPage}
			/>
			}


		</>
	);

}