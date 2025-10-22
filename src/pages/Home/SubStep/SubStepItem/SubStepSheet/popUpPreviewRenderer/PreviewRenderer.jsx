import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const PreviewRenderer = ({ formatData , fileNote , }) => {
	const [open, setOpen] = React.useState(false);

	const excludedFields = React.useMemo(() => {
		let excluded = ['stt' , 'delete' , 'id', 'rowId', 'checkbox', 'idPhieu', 'Thời gian_display'];

		if (fileNote?.info?.time === false) {
			excluded = [...excluded, 'Ngày', 'Tháng', 'Năm'];
		}

		return excluded;
	}, [fileNote]);



	const renderDetails = (data) => {
		if (!data) return <p>Không tìm thấy dữ liệu</p>;
		return (
			<div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 10 }}>
				{Object.entries(data).map(([key, value]) => {
					if (excludedFields.includes(key)) return null;
					return (
						<p key={key} style={{ marginBottom: 8 }}>
							<strong>{key}:</strong> {value}
						</p>
					);
				})}
			</div>
		);
	};

	return (
		<>
			<Button
				type="text"
				icon={<EyeOutlined />}
				onClick={() => setOpen(true)}
			/>
			<Modal open={open}
				   onCancel={() => setOpen(false)}
				   footer={null}
				   width={800}
				   title={<span style={{fontSize : '19px' , fontWeight : 'bold'}}>Chi tiết thông tin</span>}
			>
				{renderDetails(formatData)}
			</Modal>
		</>
	);
};


export default PreviewRenderer;
