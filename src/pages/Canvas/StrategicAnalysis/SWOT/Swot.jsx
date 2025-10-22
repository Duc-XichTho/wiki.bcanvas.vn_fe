import { useState, useEffect } from 'react';
import css from './Swot.module.css';
import Body from './components/Body/Body.jsx';
import Footer from './components/Footer/Footer.jsx';
import { Switch } from 'antd';
import { getFullFileNotePad } from "../../../../apis/fileNotePadService.jsx";

export default function Swot() {
	const [showBody, setShowBody] = useState(false);
	const [parentElement, setParentElement] = useState({});
	const [childElements, setChildElements] = useState([]);

	const fetchData = async () => {
		try {
			const data = await getFullFileNotePad();
			const parentElementData = data.find(element => element.name === 'SWOT_PARENT');
			setParentElement(parentElementData);

			const childElementsData = data.filter(element => element.name.includes('SWOT_CHILD_'));
			setChildElements(childElementsData)

		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const toggleBody = () => {
		setShowBody(!showBody);
	};

	return (
		<div className={css.main}>
			<div className={css.header}>
				<span>SWOT</span>
				<Switch
					checked={showBody}
					onChange={toggleBody}
					checkedChildren="Show Info"
					unCheckedChildren="Hide Info"
					style={{ backgroundColor: showBody ? '#259C63' : undefined }}
				/>
			</div>
			<div className={css.content}>
				{showBody && (
					<div className={css.body}>
						<div className={css.bodyWrap}>
							<Body
								fileNotePad={parentElement}
								fetchData={fetchData}
							/>
						</div>
					</div>
				)}
				<div className={css.footer}>
					<Footer
						childElements={childElements}
						fetchData={fetchData}
					/>
				</div>
			</div>
		</div>
	);
}