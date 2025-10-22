import { useParams } from 'react-router-dom';

export default function DetailHopKeHoach() {
	const {idHopKH} = useParams()
	return (
		<>
			<h1>{idHopKH}</h1>
		</>
	)

}