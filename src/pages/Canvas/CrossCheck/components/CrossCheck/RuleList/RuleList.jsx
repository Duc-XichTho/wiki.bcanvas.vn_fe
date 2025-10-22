import css from './RuleList.module.css'
import { useState, useEffect } from 'react'

import { getAllCrossCheck, updateCrossCheck, deleteCrossCheck } from '../../../../../../apis/crossCheckService'
import RuleElement from '../RuleElement/RuleElement'

const RuleList = () => {
    const [crossCheckList, setCrossCheckList] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchAllCrossCheck = async () => {
        try {
            const response = await getAllCrossCheck();
            const filterData = response.filter(e=> e.type == "CrossCheck")
            setCrossCheckList(filterData);
        } catch (error) {
            console.log('ERROR fetchAllCrossCheck', error);
        }
    }

    useEffect(() => {
        fetchAllCrossCheck();
    }, []);

    return (
        <div className={css.main}>
            <div className={css.sidebar}>
                {crossCheckList?.map((item) => (
                    <div
                        key={item.id}
                        title={item.name}
                        className={`${css.sidebarItem} ${selectedItem?.id === item.id ? css.selected : ''}`}
                        onClick={() => setSelectedItem(item)}
                    >
                        <span>{item.name}</span>
                    </div>
                ))}
            </div>
            <div className={css.content}>
                {selectedItem && <RuleElement selectedItem={selectedItem} setSelectedItem={setSelectedItem} fetchAllCrossCheck={fetchAllCrossCheck} />}
            </div>
        </div>
    )
}

export default RuleList
