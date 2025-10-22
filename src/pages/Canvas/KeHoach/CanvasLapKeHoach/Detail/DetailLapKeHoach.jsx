import { useParams } from 'react-router-dom';
import KHKD from '../../../../KHKD/KHKD.jsx';

export default function DetailLapKeHoach() {
	const {idLapKH} = useParams()
	return (
		<>
			<h1>{idLapKH}</h1>
			<KHKD/>
		</>
	)

}