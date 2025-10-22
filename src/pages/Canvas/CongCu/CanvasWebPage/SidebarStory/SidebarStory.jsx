import React, { useContext, useEffect, useState } from 'react';
import css from './SidebarStory.module.css';
import IconButton from '@mui/material/IconButton';
import { Create_Icon } from '../../../../../icon/svg/IconSvg.jsx';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import CreateStoryWebPage from '../Action/StoryWebPage/CreateStoryWebPage.jsx';
import { createNewStoryWebPage } from '../../../../../apis/storyWebPageService.jsx';
import { createTimestamp } from '../../../../../generalFunction/format.js';
import { message } from 'antd';
import { MyContext } from '../../../../../MyContext.jsx';
import { getWebPageDataById } from '../../../../../apis/webPageService.jsx';

export default function SidebarStory() {
	const { companySelect, buSelect, idWebPage, idContent } = useParams();
	const [selectedPage, setSelectedPage] = useState(null);
	const [selectedStory, setSelectedStory] = useState(null);
	const [openCreateStoryWebPageModal, setOpenCreateStoryWebPageModal] = useState(false);
	const { currentUser, setCurrentUser } = useContext(MyContext);
	const navigate = useNavigate();

	const handleOpenAddStoryPage = () => {
		setOpenCreateStoryWebPageModal(true);
	};

	const handleCloseAddStoryPage = () => {
		setOpenCreateStoryWebPageModal(false);
	};

	const fetchData = async () => {
		const data = await getWebPageDataById(idWebPage);
		setSelectedPage(data);
	};

	const handleCreateStoryWebPage = async (data) => {
		try {
			const newData = {
				...data,
				id_web_page: idWebPage,
				created_at: createTimestamp(),
				user_create: currentUser.email,
			};

			const createdPage = await createNewStoryWebPage(newData);
			await fetchData();
			message.success('Tạo web page thành công');
		} catch (error) {
			message.success('Lỗi Tạo web page');
		}
	};
	useEffect(() => {
		fetchData();
	}, [idWebPage]);

	const handleClick = (data) => {
		setSelectedStory(data);
		navigate(`/canvas/${companySelect}/${buSelect}/cong-cu/web-page/${idWebPage}/content/${data.id}`);
	};

	return (
		<>
			{!selectedPage ? (
				<p>Chọn một Web Page để xem.</p>
			) : (
				<div className={css.storyContainer}>
					<div className={css.storyList}>
						<div className={css.buttonAction}>
							<h2>{selectedPage.name}</h2>
							<IconButton onClick={handleOpenAddStoryPage}>
								<Create_Icon height={20} width={20} />
							</IconButton>
						</div>

						{selectedPage.stories.map(story => (
							<div
								key={story.id}
								className={`${css.storyItem} ${(idContent || selectedStory?.id) == story?.id ? css.activeItem : ''}`}
								onClick={() => handleClick(story)}
							>
								<h3>{story.title}</h3>

							</div>
						))}
					</div>
					<div className={css.storyContent}>
						<Outlet />
					</div>
				</div>

			)}
			{openCreateStoryWebPageModal && <CreateStoryWebPage open={openCreateStoryWebPageModal}
																onClose={handleCloseAddStoryPage}
																onCreate={handleCreateStoryWebPage}
			/>
			}
		</>

	);

}