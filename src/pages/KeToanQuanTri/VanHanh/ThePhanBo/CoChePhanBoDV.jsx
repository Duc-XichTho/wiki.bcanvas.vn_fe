import React, {useContext, useEffect, useRef, useState} from 'react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {getAllCoCauPhanBo} from '../../../../apisKTQT/coCauPhanBoService.jsx';
import CoChePhanBoTable from './CoChePhanBoTable.jsx';
import CoChePhanBoForm from '../../popUp/popupForm/CoChePhanBoForm.jsx';
import {getAllUnits} from "../../../../apisKTQT/unitService.jsx";
import {getAllKmf} from "../../../../apisKTQT/kmfService.jsx";
import {calculateDataView2} from "../../BaoCao/KQKD/logicKQKD.js";
import css from "../../KeToanQuanTriComponent/KeToanQuanTri.module.css";
import {onFilterTextBoxChanged} from "../../../../generalFunction/quickFilter.js";
import {MyContext} from "../../../../MyContext.jsx";
import RichNoteKTQTRI from "../../../Home/SelectComponent/RichNoteKTQTRI.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function CoChePhanBoDV({company, call}) {
    const {listSoKeToan, loadDataSoKeToan} = useContext(MyContext);
    const [listUnit, setListUnit] = useState([])
    const table = 'CoChePhanBo';
    const typeCCPB = 'Đơn vị';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [data, setData] = useState([]);
    const [showFormAdd, setShowFormAdd] = useState(false);
    const [dataBaoCao, setDataBaoCao] = useState([]);

    async function prepareData() {
        let data = await loadDataSoKeToan();
        let units = await getAllUnits();
        let kmfList = await getAllKmf();
        kmfList = kmfList.reduce((acc, current) => {
            if (!acc.find((unit) => unit.name === current.name)) {
                acc.push(current);
            }
            return acc;
        }, []);
        let rowData = calculateDataView2(data, units, kmfList, 'code', 'unit_code2', 'PBDV', 'teams')
        setDataBaoCao(rowData)
    }

    const fetchAllCoCauPhanBo = async () => {
        try {
            const response = await getAllCoCauPhanBo();

            const filteredData = response.filter((item) => item.type === 'Đơn vị');
            setData(filteredData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const listCCPBDV = listSoKeToan
        .filter((itemSoKeToan) => itemSoKeToan.PBDV !== null)
        .filter((itemSoKeToan) => data.some((itemData) => itemSoKeToan.CCPBDV === itemData.name)) || [];

    useEffect(() => {
        getAllUnits().then(e => setListUnit(e))
        setListUnit(listUnit.filter((item) => (item.company !== "Group")))
        Promise.all([fetchAllCoCauPhanBo(), prepareData()]);

    }, []);


    return (<>
        <div style={call ? {width: '100%', height: '100%'} : {}}>
            <>
                <div
                    className={'header-powersheet'}
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                >
                    <div style={{display: 'flex', width: '50%', alignItems: 'center'}}>
                        <span style={{color: '#454545', fontSize: 23, fontWeight: 'bold', lineHeight: '35.41px'}}>
                          Thẻ phân bổ theo Đơn vị
                        </span>
                    </div>

                    <div style={{display: 'flex', justifyContent: 'flex-end', width: '50%', gap: 20}}>

                        <div className={`${css.headerActionButton} ${css.buttonOn}`}
                             onClick={() => setShowFormAdd(true)}>
                            <span> Thêm mới</span>
                        </div>
                    </div>

                </div>
            </>
            <div style={{width: '100%', height: 'max-content', boxSizing: "border-box"}}>
                <RichNoteKTQTRI table={`${table + '-' + company + typeCCPB}`}/>
            </div>
            <div
                style={{
                    height: call === 'cdsd' ? '99%' : '72.5vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    marginTop: '15px',
                    overflow: 'auto',
                    overflowX: "hidden"

                }}
            >
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                    {data.map((item) => (<div key={item.id}>
                        <CoChePhanBoTable
                            item={item}
                            fetchAllCoCauPhanBo={fetchAllCoCauPhanBo}
                            listChoose={listUnit}
                            typeCCPB={typeCCPB}
                            listCCPBDV={listCCPBDV}
                            dataBaoCao={dataBaoCao}
                        />
                    </div>))}
                </div>
            </div>
        </div>
        {showFormAdd && (<CoChePhanBoForm
            company={company}
            onClose={() => setShowFormAdd(false)}
            fetchAllCoCauPhanBo={fetchAllCoCauPhanBo}
            listChoose={listUnit}
            typeCCPB={typeCCPB}
            dataBaoCao={dataBaoCao}
        />)}
    </>);
}
