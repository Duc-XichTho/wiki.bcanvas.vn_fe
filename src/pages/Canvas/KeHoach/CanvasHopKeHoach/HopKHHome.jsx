import { Outlet } from 'react-router-dom';

export default function HopKHHome() {
	return (
		<div style={{
			height: '100%',
			width: '100%',
			padding: '20px 10px 0 10px',
		}}>
			<Outlet/>
		</div>
	)

}