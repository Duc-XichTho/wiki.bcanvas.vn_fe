import css from './SettingThemeColor.module.css';
import { useState, useEffect } from 'react';
import { Modal, Button, ColorPicker, message } from 'antd';
import { createSetting, getSettingByType, updateSetting } from '../../../apis/settingService';

const SettingThemeColor = ({ isOpen, onClose }) => {
	const [themeColor, setThemeColor] = useState('#FFFFFF');
	const [settingData, setSettingData] = useState(null);


	const fetchData = async () => {
		try {
			let data = await getSettingByType('SettingThemeColor');
			if (!data) {
				data = await createSetting({
					type: 'SettingThemeColor',
					setting: { themeColor: '#FFFFFF' },
				});
			}
			setSettingData(data)
			setThemeColor(data.setting.themeColor || '#FFFFFF');
		} catch (error) {
			console.error('Error fetching theme color:', error);
		}
	};

		useEffect(() => {
		if (isOpen) fetchData();
	}, [isOpen]);

	const handleThemeColorChange = (color) => {
		setThemeColor(color.toHexString().toUpperCase());
	};

	const handleSave = async () => {
		try {
			await updateSetting({ ...settingData, type: 'SettingThemeColor', setting: { themeColor } });
			message.success('Theme color saved successfully');
			onClose();
		} catch (error) {
			console.error('Error saving theme color:', error);
		}
	};

	return (
		<Modal
			title="Configure Theme Color"
			width={300}
			centered
			open={isOpen}
			footer={null}
			onCancel={onClose}
			className={css.modal}
		>
			<div className={css.colorPickerWrap}>
				<span>Theme Color</span>
				<ColorPicker
					value={themeColor}
					size="large"
					showText
					onChange={handleThemeColorChange}
				/>
			</div>
			<div className={css.footer}>
				<Button size="small" type="primary" onClick={handleSave}>
					Save
				</Button>
				<Button size="small" onClick={onClose}>
					Close
				</Button>
			</div>
		</Modal>
	);
};

export default SettingThemeColor;
