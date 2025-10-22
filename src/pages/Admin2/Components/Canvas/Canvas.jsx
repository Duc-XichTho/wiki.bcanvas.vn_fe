import css from './Canvas.module.css';
import { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { getAllUserClass } from '../../../../apis/userClassService';
import UserClassElement from './Components/UserClassElement';
import CreateUserClass from './Components/CRUD/Create/CreateUserClass';
import { getAllUser } from '../../../../apis/userService';
import { log } from 'mathjs';
import UserElement from './Components/UserElement';

const Canvas = () => {
	const [messageApi, contextHolder] = message.useMessage();
	const [listUserClass, setListUserClass] = useState([]);
	const [listUser, setListUser] = useState([]);
	const [userClassSelected, setUserClassSelected] = useState(null);
	const [userSelected, setUserSelected] = useState(null);
	const [statusCreateUserClass, setStatusCreateUserClass] = useState(false);
	const [responseMessage, setResponseMessage] = useState('');
	const [statusDeleteUserClass, setStatusDeleteUserClass] = useState(false);
	const [responseMessageDelete, setResponseMessageDelete] = useState('');
	const [showFormCreateUserClass, setShowFormCreateUserClass] = useState(false);

	const showNotification = (type, content) => {
		messageApi.open({
			type,
			content,
		});
	};


	const fetchAllUserClass = async () => {
		try {
			const data = await getAllUserClass();
			const users = await getAllUser();
			console.log(users);
			const filteredData = data.filter(item => item.module === 'CANVAS');
			setListUser(users?.result || []);
			setListUserClass(filteredData);
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		fetchAllUserClass();
	}, []);

	useEffect(() => {
		if (statusCreateUserClass) {
			showNotification('success', responseMessage);
			setStatusCreateUserClass(false);
		}
	}, [statusCreateUserClass, responseMessage]);

	useEffect(() => {
		if (statusDeleteUserClass) {
			showNotification('success', responseMessageDelete);
			setStatusDeleteUserClass(false);
		}
	}, [statusDeleteUserClass, responseMessageDelete]);


	return (
		<>
			{contextHolder}
			<div className={css.main}>
				<div className={css.sidebar}>
					<div className={css.createUserClass}>
						<Button
							type="dashed"
							style={{ width: '100%' }}
							onClick={() => setShowFormCreateUserClass(true)}>
							+ Tạo nhóm nhân viên và cấp quyền
						</Button>
					</div>
					<div className={css.listUserClass}>
						<div className={css.listUserClassWrap}>
							<div className={css.titleElement}>Danh sách</div>
							<div className={css.listElement}>

								{listUserClass.map((userClass) =>
									<div
										key={userClass.id}
										className={`${css.userClass} ${userClass.id === userClassSelected?.id ? css.selected : ''}`}
										onClick={() => {
											setUserClassSelected(userClass);
											setUserSelected(null);
										}}
									>
										{userClass.name}
									</div>,
								)}
							</div>

							{/*<div className={css.titleElement}>Danh sách quyền hạn theo người dùng</div>*/}
							{/*<div className={css.listElement}>*/}
							{/*	{listUser && listUser.map((user) =>*/}
							{/*		<div*/}
							{/*			key={user.id}*/}
							{/*			className={`${css.userClass} ${user.id === userSelected?.id ? css.selected : ''}`}*/}
							{/*			onClick={() => {*/}
							{/*				setUserSelected(user);*/}
							{/*				setUserClassSelected(null);*/}
							{/*			}}*/}
							{/*		>*/}
							{/*			{user.name}*/}
							{/*		</div>,*/}
							{/*	)}*/}
							{/*</div>*/}
						</div>
					</div>
				</div>
				<div className={css.content}>
					{userClassSelected === null && userSelected === null &&
						(
							<div
								style={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									height: '100%',
								}}
							>Chọn một nhóm nhân viên hoặc một nhân viên để xem chi tiết
							</div>)
					}
					{userClassSelected
						&& (
							<UserClassElement
								userClassSelected={userClassSelected}
								setUserClassSelected={setUserClassSelected}
								fetchAllUserClass={fetchAllUserClass}
								setStatusDeleteUserClass={setStatusDeleteUserClass}
								setResponseMessageDelete={setResponseMessageDelete}
							/>
						)
					}
					{userSelected
						&& (
							<UserElement
								userSelected={userSelected}
								setUserSelected={setUserSelected}
								fetchAllUserClass={fetchAllUserClass}
							/>
						)
					}
				</div>
			</div>

			{showFormCreateUserClass && (
				<CreateUserClass
					onClose={() => setShowFormCreateUserClass(false)}
					fetchAllUserClass={fetchAllUserClass}
					setStatusCreateUserClass={setStatusCreateUserClass}
					setResponseMessage={setResponseMessage}
				/>
			)}
		</>
	);
};

export default Canvas;
