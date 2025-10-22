import css from './DataTieuDiem.module.css';
import { AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import React, { useState } from 'react';
import { Button } from 'antd';

export default function DataTieuDiem({ highlightData, renderSpeakerIcon, handleSpeakRequest }) {
	const [openSection, setOpenSection] = useState(false);

	const handleClick = () => {
		setOpenSection(!openSection);
	};

	return (
		<div style={{ height: 'max-content' }}>
			<div className={css.headerName} onClick={handleClick}>
				<h2>Tiêu điểm - tin tức</h2>
				<span className={css.arrow}>{openSection ? <AiOutlineDown /> : <AiOutlineRight />}</span>
			</div>

			{
				openSection &&
				<>
					<div style={{marginLeft : '10px' , marginBottom: 5}}>
						{renderSpeakerIcon(-1 , highlightData?.body)}
					</div>
					<div
						className={css.leftPanelContent}
						dangerouslySetInnerHTML={{
							__html: highlightData?.body || 'Chưa có dữ liệu',
						}}
					/>
				</>
			}

		</div>
	);
}
