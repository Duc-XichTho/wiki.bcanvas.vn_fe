import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import DetailKHKDTH from './Dialog/DetailKHKDTongHop.jsx';
import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { getDienGiaiDataByName } from '../../../apis/dienGiaiService.jsx';
import css from './ActionDetailDL.module.css';


const CustomTooltip = styled(({ className, ...props }) => (
	<Tooltip {...props} arrow classes={{ popper: className }} />
))(() => ({
	[`& .${tooltipClasses.tooltip}`]: {
		fontSize: '13px',
		padding: '6px 12px',
	},
}));
export default function ActionDetail(props) {
	const { value, data, khkdData } = props;
	const hasDot = data?.layer?.includes('.');
	const [hovered, setHovered] = useState(false);

	const groupSettings = props?.khkdTH?.setting?.[data.name] || {};
	const isFormula = data.formula;
	const parent = data.layer && !data.layer.includes('.');
	const [openDialog, setOpenDialog] = useState(false);
	const [dienGiaiData, setDienGiaiData] = useState(null);  // Dữ liệu API

	useEffect(() => {
		if (!openDialog) setHovered(false);
	}, [openDialog]);

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


	const cellStyle = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: hasDot ? '100%' : '430px',
		height: '100%',
		borderRight: isFormula && groupSettings.background,
		backgroundColor: isFormula ? ('#f5f5f5' || '#f5f5f5') : '',
		color: isFormula ? ('#454545' || '#454545') : '',
		fontWeight: parent ? '600' : '500',
		fontFamily: `'Reddit Sans', sans-serif`,
	};

	// Mở Dialog khi nhấn vào con mắt
	const handleEyeClick = () => {
		setOpenDialog(true); // Mở Dialog
	};

	return (
		<div
			style={cellStyle}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
				<span>{value}</span>
				<div>
					{
						hasDot && dienGiaiData && (
							<CustomTooltip title={dienGiaiData.dien_giai} placement="top">
								<div className={css.tag}>
									<span className={css.tagName}>{dienGiaiData.code}</span>
								</div>
							</CustomTooltip>
						)
					}

				</div>
			</div>
			{hasDot && hovered && (
				<Eye size={16}
					 style={{ marginLeft: '8px', cursor: 'pointer', color: '#888' }}
					 onClick={handleEyeClick} // Bấm vào để mở Dialog

				/>
			)}
			{openDialog && (
				<DetailKHKDTH name={value} open={openDialog} khkdData={khkdData} onClose={() => setOpenDialog(false)} />
			)}
		</div>
	);
};
