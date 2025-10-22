import React, {useContext, useEffect, useRef, useState} from 'react';
import {onFilterTextBoxChanged} from "../../../../generalFunction/quickFilter.js";
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {getAllCoCauPhanBo} from '../../../../apisKTQT/coCauPhanBoService.jsx';
import CoChePhanBoTable from './CoChePhanBoTable.jsx';
import CoChePhanBoForm from '../../popUp/popupForm/CoChePhanBoForm.jsx';
import {getAllKmf} from "../../../../apisKTQT/kmfService.jsx";
import {calculateDataView2} from "../../BaoCao/KQKD/logicKQKD.js";
import css from "../../KeToanQuanTriComponent/KeToanQuanTri.module.css";
import {MyContext} from "../../../../MyContext.jsx";
import {getAllProject} from "../../../../apisKTQT/projectService.jsx";
import RichNoteKTQTRI from "../../../Home/SelectComponent/RichNoteKTQTRI.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function CoChePhanBoProject({company, call}) {
    const {listProduct, listSoKeToan, loadDataSoKeToan} = useContext(MyContext);
    const table = 'CoChePhanBo';
    const typeCCPB = 'Vụ việc';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [data, setData] = useState([]);
    const [showFormAdd, setShowFormAdd] = useState(false);
    const [dataBaoCao, setDataBaoCao] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listKenh, setListKenh] = useState([]);
    function fetchListSP() {
        getAllProject().then(data => {
            setListKenh(data)
        })
    }
    const fetchAllCoCauPhanBo = async () => {
        setLoading(true)
        try {
            const response = await getAllCoCauPhanBo();
            const filteredData = response.filter((item) => item.type === 'Vụ việc');
            setData(filteredData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setTimeout(()=> {
            setLoading(false)
        }, 300)
    };

    async function prepareData() {
        let data = await loadDataSoKeToan();
        data = data.filter((e) => e.consol?.toLowerCase() == 'consol');
        let units = await getAllProject();
        const uniqueUnits = units.reduce((acc, current) => {
            if (!acc.find((unit) => unit.code === current.code)) {
                acc.push(current);
            }
            return acc;
        }, []);
        let kmfList = await getAllKmf();
        kmfList = kmfList.reduce((acc, current) => {
            if (!acc.find((unit) => unit.name === current.name)) {
                acc.push(current);
            }
            return acc;
        }, []);
        let rowData = calculateDataView2(data, uniqueUnits, kmfList, 'code', 'project2', 'PBPROJECT', 'teams')
        setDataBaoCao(rowData)
    }

    useEffect(() => {
        Promise.all([fetchAllCoCauPhanBo(), prepareData()]);
        fetchListSP()
    }, [company]);

    return (<>
            <div style={{position: "relative"}}>
                <div
                    className={'header-powersheet'}
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                >

                    <div style={{display: 'flex', width: '50%', alignItems: 'center'}}>
                        <span style={{color: '#454545', fontSize: 23, fontWeight: 'bold', lineHeight: '35.41px'}}>
                          Thẻ phân bổ theo Vụ việc
                        </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'flex-end', width: '50%', gap: 20}}>
                        <div className={`${css.headerActionButton} ${css.buttonOn}`}
                             onClick={() => setShowFormAdd(true)}>
                            <span> Thêm mới</span>
                        </div>
                    </div>
                </div>
                <div style={{width: '100%', height: 'max-content', boxSizing: "border-box"}}>
                    <RichNoteKTQTRI table={`${table + '-' + company + typeCCPB}`}/>
                </div>
                <div
                    style={{
                        height: call === 'cdsd' ? '70vh' : '72.5vh',
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
                                    listChoose={listKenh}
                                    typeCCPB={typeCCPB}
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
                    listChoose={listKenh}
                    typeCCPB={typeCCPB}
                    dataBaoCao={dataBaoCao}
                />)}
        </>);
}
