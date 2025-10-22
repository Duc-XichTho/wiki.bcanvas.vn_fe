import React, { useState, useEffect, useContext } from 'react';
import { Modal, Checkbox, Button, List, message } from 'antd';
import { createSetting, getSettingByType, updateSetting } from '../../../../apis/settingService';
import css from './SettingVisibilityModal.module.css';
import { MyContext } from '../../../../MyContext.jsx'; // Tạo file CSS này nếu cần

const SETTING_TYPE = 'StrategicItemsVisibility';

const SettingVisibilityModal = ({ isOpen, onClose, items }) => {
	const [visibility, setVisibility] = useState({});
	const [settingData, setSettingData] = useState(null);
	const [isLoading, setIsLoading] = useState(false); // Thêm state loading
	const { loadData, setLoadData } = useContext(MyContext);

	const fetchData = async () => {
		setIsLoading(true); // Bắt đầu loading
		try {
			let fetchedSetting = await getSettingByType(SETTING_TYPE);
			let currentVisibility = {};

			if (!fetchedSetting) {
				// Nếu chưa có setting, tạo trạng thái ban đầu (tất cả true)
				currentVisibility = items.reduce((acc, item) => {
					acc[item.id] = true;
					return acc;
				}, {});
				// Không tạo setting ở đây, chỉ chuẩn bị state
				setSettingData(null); // Đánh dấu là chưa có setting gốc
			} else {
				// Nếu có setting, đồng bộ với items hiện tại
				currentVisibility = { ...fetchedSetting.setting };
				items.forEach(item => {
					if (currentVisibility[item.id] === undefined) {
						currentVisibility[item.id] = true;
					}
				});
				Object.keys(currentVisibility).forEach(key => {
					if (!items.some(item => item.id === key)) {
						delete currentVisibility[key];
					}
				});
				setSettingData(fetchedSetting); // Lưu setting gốc
			}
			setVisibility(currentVisibility); // Cập nhật state cho checkboxes
		} catch (error) {
			console.error('Lỗi khi lấy cài đặt hiển thị:', error);
			message.error('Không thể tải cài đặt hiển thị.');
			// Fallback: Hiển thị tất cả nếu lỗi
			const fallbackVisibility = items.reduce((acc, item) => {
				acc[item.id] = true;
				return acc;
			}, {});
			setVisibility(fallbackVisibility);
			setSettingData(null);
		} finally {
			setIsLoading(false); // Kết thúc loading
		}
	};


	useEffect(() => {
		if (isOpen && items.length > 0) {
			fetchData();
		} else if (!isOpen) {
			// Reset state khi modal đóng để lần sau mở sẽ fetch lại
			setVisibility({});
			setSettingData(null);
		}
	}, [isOpen, items, loadData]); // Chỉ fetch khi modal mở hoặc items thay đổi

	const handleCheckboxChange = (itemId, checked) => {
		setVisibility(prev => ({
			...prev,
			[itemId]: checked,
		}));
	};

	const handleSave = async () => {
		setIsLoading(true); // Bắt đầu loading khi lưu
		try {
			console.log('tem', items);
			// Chuẩn bị dữ liệu setting cuối cùng để lưu
			const finalSetting = { ...visibility };
			// Đảm bảo chỉ lưu các key có trong baseStrategicItems
			Object.keys(finalSetting).forEach(key => {
				if (!items.some(item => item.id === key)) {
					delete finalSetting[key];
				}
			});


			if (settingData) {
				// Nếu đã có setting gốc -> update
				await updateSetting({ ...settingData, setting: finalSetting });
			} else {
				// Nếu chưa có setting gốc -> create
				await createSetting({
					type: SETTING_TYPE,
					setting: finalSetting,
				});
			}
			message.success('Đã lưu cài đặt hiển thị');
			console.log(finalSetting);
			onClose(true); // Đóng modal và báo hiệu đã lưu
		} catch (error) {
			console.error('Lỗi khi lưu cài đặt hiển thị:', error);
			message.error('Không thể lưu cài đặt hiển thị.');
		} finally {
			setLoadData(!loadData);
			setIsLoading(false); // Kết thúc loading
		}
	};

	const handleCancel = () => {
		onClose(false); // Đóng modal không lưu
	};


	return (
		<Modal
			title="Cài đặt hiển thị mục Phân tích chiến lược"
			open={isOpen}
			onCancel={handleCancel}
			footer={[
				<Button key="cancel" onClick={handleCancel} disabled={isLoading}>
					Hủy
				</Button>,
				<Button key="save" type="primary" onClick={handleSave} loading={isLoading}>
					Lưu
				</Button>,
			]}
			className={css.modal} // Sử dụng class từ file CSS nếu có
			width={400}
			centered
			maskClosable={!isLoading} // Không cho đóng khi đang loading
		>
			{isLoading && !settingData ? ( // Hiển thị loading chỉ khi đang fetch lần đầu
				<p>Đang tải cài đặt...</p>
			) : (
				<List
					dataSource={items}
					renderItem={item => (
						<List.Item key={item.id}>
							<Checkbox
								checked={visibility[item.id] !== false} // Mặc định là true nếu không có giá trị
								onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
								disabled={isLoading} // Disable khi đang lưu
							>
								{item.title}
							</Checkbox>
						</List.Item>
					)}
				/>
			)}
		</Modal>
	);
};

export default SettingVisibilityModal;