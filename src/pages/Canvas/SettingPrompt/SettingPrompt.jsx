import css from './SettingPrompt.module.css';
import { useState, useEffect } from 'react';
import { Modal, Button, Input, message } from 'antd';
import { createSetting, getSettingByType, updateSetting } from '../../../apis/settingService';

const SettingPrompt = ({ isOpen, onClose }) => {
	const [promptData, setPromptData] = useState(null);
	const defaultPrompt = 'Default Prompt';

	const fetchData = async () => {
		try {
			let data = await getSettingByType('SettingPrompt');
			if (!data) {
				data = await createSetting({
					type: 'SettingPrompt',
					setting: defaultPrompt,
				});
			}
			// Ensure `setting` is a string
			if (typeof data.setting !== 'string') {
				data.setting = defaultPrompt;
			}
			setPromptData(data);
		} catch (error) {
			console.error('Error fetching prompt setting:', error);
			message.error('Failed to load prompt');
		}
	};

	useEffect(() => {
		if (isOpen) {
			fetchData();
		}
	}, [isOpen]);

	const handlePromptChange = (value) => {
		setPromptData((prev) => ({
			...prev,
			setting: value,
		}));
	};

	const handleSave = async () => {
		try {
			await updateSetting(promptData);
			await fetchData(); // Refresh to confirm backend update
			message.success('Prompt saved successfully');
			onClose();
		} catch (error) {
			console.error('Error saving prompt:', error);
			message.error('Failed to save prompt');
		}
	};

	return (
		<Modal
			title="Configure Prompt"
			width={400}
			centered
			open={isOpen}
			footer={() => (
				<div className={css.footer}>
					<Button size="small" type="primary" onClick={handleSave}>
						Save
					</Button>
					<Button size="small" onClick={onClose}>
						Close
					</Button>
				</div>
			)}
			className={css.modal}
		>
			<div className={css.promptItem}>
				<span>Prompt</span>
				<Input
					value={promptData?.setting || ''}
					onChange={(e) => handlePromptChange(e.target.value)}
					placeholder="Enter prompt"
				/>
			</div>
		</Modal>
	);
};

export default SettingPrompt;