import css from './TonKho.module.css'
import React, { useState } from 'react'
import Import from './components/Import.jsx'
import Export from './components/Export.jsx'
import Warehouse from './components/Warehouse.jsx'
import NhapXuatTon from "./components/NhapXuatTon.jsx";
import { Ton_Kho } from "../../../../../Consts/TITLE_HEADER.js";
import ActionBookMark from "../../actionButton/ActionBookMark.jsx";

const tabs = [
    {
        id: 'import',
        label: 'Nhập',
        content: <Import />
    },
    {
        id: 'export',
        label: 'Xuất',
        content: <Export />
    },
    {
        id: 'warehouse',
        label: 'Tồn kho',
        content: <Warehouse />
    },
    {
        id: 'nhap-xuat-toan',
        label: 'Nhập xuất tồn',
        content: <NhapXuatTon />
    },

]

const TonKho = () => {
    const [tabSelected, setTabSelected] = useState('import');
    const headerTitle = Ton_Kho;

    const tabChange = (id) => {
        setTabSelected(id);
    }

    return (
        <div className={css.main}>
            <div className={css.header}>
                {tabs.map(tab => (
                    <div key={tab.id} className={`${css.tab} ${tab.id === tabSelected ? css.active : ''}`} onClick={() => tabChange(tab.id)}>
                        <span>{tab.label}</span>
                    </div>
                ))}
                <ActionBookMark headerTitle={headerTitle} />

            </div>
            <div className={css.content}>
                {tabs.find(tab => tab.id === tabSelected).content}
            </div>
        </div>
    )
}

export default TonKho