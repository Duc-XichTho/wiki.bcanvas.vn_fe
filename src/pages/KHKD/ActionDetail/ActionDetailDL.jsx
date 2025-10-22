import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import DetailKHKDTongHopDL from './Dialog/DetailKHKDTongHopDL.jsx';
import { getDienGiaiDataByName } from '../../../apis/dienGiaiService.jsx';
import css from './ActionDetailDL.module.css';
import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

const CustomTooltip = styled(({ className, ...props }) => (
	<Tooltip {...props} arrow classes={{ popper: className }} />
))(() => ({
	[`& .${tooltipClasses.tooltip}`]: {
		fontSize: '13px',
		padding: '6px 12px',
	},
}));

export default function ActionDetailDL(props) {

	const { value, data, khkdTH } = props;
	const [hovered, setHovered] = useState(false);
	const [dienGiaiData, setDienGiaiData] = useState(null);  // Dữ liệu API

	const groupSettings = props?.khkdTH?.setting?.[data.name] || {};
	const isFormula = data.formula;
	const [openDialog, setOpenDialog] = useState(false);

	useEffect(() => {
		if (!openDialog) setHovered(false)
	}, [openDialog]);

	const cellStyle = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		height: '100%',
		borderRight: isFormula && groupSettings.background,
		backgroundColor: isFormula ? (groupSettings.background || '#f0f7ff') : '',
		color: isFormula ? (groupSettings.text || '#0066cc') : '',
		fontWeight:   '500',
		fontFamily: `'Reddit Sans', sans-serif`,
	};

	// Mở Dialog khi nhấn vào con mắt
	const handleEyeClick = () => {
		setOpenDialog(true); // Mở Dialog
	};

	const fetchData = async () => {
		const uppercaseValue = value.trim().toUpperCase();
		const filteredList = props?.listDienGiai?.filter(item =>
			item.name && item.name.trim().toUpperCase() === uppercaseValue,
		);

		if (filteredList?.length > 0) {
			setDienGiaiData(filteredList[0]);
		} else {
			setDienGiaiData(null);
		}
	};

	useEffect(() => {
		fetchData();
	}, [value, props?.listDienGiai]);

	return (
		<div
			style={cellStyle}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<div style={{display : 'flex' , alignItems : 'center' , gap : '10px'}}>
				<span>{value}</span>
				<div>
					{
						dienGiaiData && (
							<CustomTooltip title={dienGiaiData.dien_giai} placement="top">
								<div className={css.tag}>
									<span className={css.tagName}>{dienGiaiData.code}</span>
								</div>
							</CustomTooltip>
						)
					}

				</div>
			</div>

			{hovered && (
				<Eye size={16}
					 style={{ marginLeft: '8px', cursor: 'pointer', color: '#888' }}
					 onClick={handleEyeClick} // Bấm vào để mở Dialog

				/>
			)}
			{openDialog && (
				<DetailKHKDTongHopDL name={value} khkdData={khkdTH} open={openDialog} onClose={() => setOpenDialog(false)} />
			)}
		</div>
	);
};