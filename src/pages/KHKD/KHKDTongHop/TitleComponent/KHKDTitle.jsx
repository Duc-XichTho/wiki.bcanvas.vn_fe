import css from './KHKDTitle.module.css';
import { Button, Dropdown, Menu } from 'antd';
import React, { useEffect, useState } from 'react';
import SetListTHCK from '../../SetListTHCK/SetListTHCK.jsx';
import { updateKHKDTongHop } from '../../../../apis/khkdTongHopService.jsx';
import { useParams } from 'react-router-dom';
import { getNoteChartData } from '../../../../apis/noteChartService.jsx';
import TipTapTitle from './TiptapTitle/TipTapTitle.jsx';
import KHKDDraggableOpenAIBox from '../../KHKDDraggableOpenAIBox.jsx';
import { MoreOutlined } from '@ant-design/icons';

export default function KHKDTitle({ handleExport, handleDownload, handlePDF, fetchKHTH, khkdTH, dataKQKD, dataDoLuong, dataDT, dKPIDataAI, dataTT }) {
	const { idHopKH } = useParams();
	const [dataTiptap, setDataTiptap] = useState(null);
	const [isSetListTHCKVisible, setIsSetListTHCKVisible] = useState(false);
	const [isAIBotVisible, setIsAIBotVisible] = useState(false);

	const fetchData = async () => {
		const data = await getNoteChartData(`TitleKHKD_${idHopKH}`);
		if (data.length > 0) {
			const newNote = data.find(e => e.chartTitle === `TitleKHKD_${idHopKH}`);
			setDataTiptap(newNote);
		}
	};

	useEffect(() => {
		fetchData();
	}, [idHopKH]);

	const menu = (
		<Menu>
			<Menu.Item key="ai-box" onClick={() => setIsAIBotVisible(true)}>
				Mở AI Bot
			</Menu.Item>
			<Menu.Item key="setting" onClick={() => setIsSetListTHCKVisible(true)}>
				Cài đặt
			</Menu.Item>
			<Menu.Item key="pdf" onClick={handleExport}>
				PDF
			</Menu.Item>
		</Menu>
	);

	return (
		<>
			{khkdTH && (
				<>
					<div className={css.headerContainer}>
						<div className={css.headerTitle}>
							<TipTapTitle fileNotePad={dataTiptap} fetchData={fetchData} />
						</div>
						<div className={css.headerButton}>
							<Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
								<Button icon={<MoreOutlined />} />
							</Dropdown>
						</div>
					</div>

					<KHKDDraggableOpenAIBox
						siderId={khkdTH.id}
						khkdTH={khkdTH}
						dataKQKD={dataKQKD}
						dataDoLuong={dataDoLuong}
						dataDT={dataDT}
						dKPIDataAI={dKPIDataAI}
						dataTT={dataTT}
						visible={isAIBotVisible}
						setVisible={setIsAIBotVisible}
					/>

					{isSetListTHCKVisible && (
						<SetListTHCK
							isVisible={isSetListTHCKVisible}
							onClose={() => setIsSetListTHCKVisible(false)}
							idHopKH={idHopKH}
							updateKHKDTongHop={updateKHKDTongHop}
							khkdTH={khkdTH}
							fetchKHTH={fetchKHTH}
						/>
					)}
				</>
			)}
		</>
	);
}
