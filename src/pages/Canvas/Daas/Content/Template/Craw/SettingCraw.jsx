import React, { useState } from 'react';
import { Modal, Select } from 'antd';
import { LIST_OPTION_CRAW } from './LIST_OPTION_CRAW.js';
import { loadDataCraw } from './logicCraw.js';

export function SettingCraw({ showSettingsChartPopup, setShowSettingsChartPopup, templateData, fetchData }) {
	const [selectedCrawType, setSelectedCrawType] = useState(null);

	const handleOk = () => {
		loadDataCraw(selectedCrawType, templateData).then(()=> {
			fetchData()
			setShowSettingsChartPopup(false);
		})
	};

	return (
		<Modal
			open={showSettingsChartPopup}
			onCancel={() => setShowSettingsChartPopup(false)}
			onOk={handleOk}
			width={390}
			title={`Craw`}
			centered={true}
			style={{ padding: '20px', overflow: 'auto' }}
		>
			<div style={{ marginBottom: 16 }}>
				<Select
					options={LIST_OPTION_CRAW}
					style={{ width: 300 }}
					placeholder="Chọn loại Craw"
					value={selectedCrawType}
					onChange={(value) => {
						setSelectedCrawType(value);
					}}
				/>
			</div>
		</Modal>
	)
}
