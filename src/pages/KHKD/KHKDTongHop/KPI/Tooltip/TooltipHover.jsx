import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import css from './Tooltip.module.css';
import { getDienGiaiDataByName } from '../../../../../apis/dienGiaiService.jsx';


const CustomTooltip = styled(({ className, ...props }) => (
	<Tooltip {...props} arrow classes={{ popper: className }} />
))(() => ({
	[`& .${tooltipClasses.tooltip}`]: {
		fontSize: '13px',
		padding: '6px 12px',
	},
}));

export default function TooltipHover(props) {
	const { value, data } = props;
	const [dienGiaiData, setDienGiaiData] = useState(null);  // Dữ liệu API

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
		width: '100%',
		height: '100%',
		fontWeight: '500',
		fontFamily: `'Reddit Sans', sans-serif`,
	};

	return (
		<div
			style={cellStyle}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
				<span>{value}</span>
				<div>
					{
						dienGiaiData && (
							<CustomTooltip title={dienGiaiData.dien_giai} placement='top'>
								<div className={css.tag}>
									<span className={css.tagName}>{dienGiaiData.code}</span>
								</div>
							</CustomTooltip>
						)
					}

				</div>
			</div>
		</div>
	);
};