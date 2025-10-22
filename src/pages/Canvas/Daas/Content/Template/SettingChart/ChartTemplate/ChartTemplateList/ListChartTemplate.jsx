import css from './ListChartTemplate.module.css';
import { useEffect, useState } from 'react';
import { getAllChartTemplate } from '../../../../../../../../apis/chartTemplateService.jsx';
import ChartTemplateElement from '../ChartTemplateElement/ChartTemplateElement.jsx';
import { Button } from 'antd';
import { getAllFileNotePad } from '../../../../../../../../apis/fileNotePadService.jsx';
import { Check } from 'lucide-react';

export default function ListChartTemplate({ templateData }) {
	const [chartTemplateList, setChartTemplateList] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);

	const fetchAllChartTemplate = async () => {
		try {
			let fileNotes = await getAllFileNotePad();
			fileNotes = fileNotes.filter(e => e.table == 'ChartTemplate')
			let response = await getAllChartTemplate();
			response.forEach(e => {
				if (fileNotes.some(note => e.id == note.type)){
					e.created = true;
				}
			})
			if(templateData){
				const filteredTemplates = response.filter(e => e.id_template == templateData.id);
				setChartTemplateList(filteredTemplates);
				setSelectedItem(filteredTemplates[0]);
			}
			else {
				setChartTemplateList(response);
			}
		} catch (error) {
			console.log('ERROR fetchAllCrossCheck', error);
		}
	};

	useEffect(() => {
		fetchAllChartTemplate();
	}, []);

	return (
		<>
			<div className={css.main}>
				<div className={css.sidebar}>
					{chartTemplateList?.map((item) => (
						<div
							key={item.id}
							title={item.name}
							className={`${css.sidebarItem} ${selectedItem?.id === item.id ? css.selected : ''}`}
							onClick={() => setSelectedItem(item)}
						>
							<span>{item.name}</span>
							{item.created && <span><Check color={'Green'} /></span>}
						</div>
					))}
				</div>
				<div className={css.content}>

					{selectedItem && (<>
						<ChartTemplateElement selectedItem={selectedItem} setSelectedItem={setSelectedItem}
											  fetchAllChartTemplate={fetchAllChartTemplate} />

					</>)}


				</div>
			</div>
		</>
	);
}
