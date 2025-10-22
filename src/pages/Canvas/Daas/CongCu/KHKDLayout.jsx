import React from 'react';
import { Outlet } from 'react-router-dom';
import SimpleToolList from './SimpleToolList.jsx';

export default function KHKDLayout() {

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
			{/* Header */}
			<SimpleToolList />
			{/* Content */}
			<div style={{ flex: 1, overflow: 'auto' }}>
				<Outlet />
			</div>
		</div>
	);
}


