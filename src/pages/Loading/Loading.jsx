import React from 'react';

export default function Loading({ loading }) {
	return (
		loading &&
		<div style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			height: '100%',
			position: 'absolute',
			width: '100%',
			zIndex: '1000',
			backgroundColor: 'white',
		}}
		>
			<img src='/loading_moi_2.svg' alt='Loading...' style={{ width: '150px', height: '150px' }} />
		</div>
	);
}
