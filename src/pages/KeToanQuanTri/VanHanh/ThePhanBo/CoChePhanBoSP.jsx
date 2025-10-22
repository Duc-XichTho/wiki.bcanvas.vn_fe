import React, {useEffect, useRef, useState} from 'react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import {getAllCoCauPhanBo} from '../../../../apisKTQT/coCauPhanBoService.jsx';
import CoChePhanBoTable from './CoChePhanBoTable.jsx';
import CoChePhanBoForm from '../../popUp/popupForm/CoChePhanBoForm.jsx';
import {getAllProduct} from "../../../../apisKTQT/productService.jsx";
import css from "../../KeToanQuanTriComponent/KeToanQuanTri.module.css";
import RichNoteKTQTRI from "../../../Home/SelectComponent/RichNoteKTQTRI.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function CoChePhanBoSP({company, call}) {
    const [listProduct, setListProduct] = useState([]);
    const table = 'CoChePhanBo';
    const typeCCPB = 'Sản phẩm';
    const gridRef = useRef();
    const [data, setData] = useState([]);
    const [showFormAdd, setShowFormAdd] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchAllCoCauPhanBo = async () => {
        setLoading(true)
        try {
            const response = await getAllCoCauPhanBo();
            const filteredData = response.filter((item) => item.type === 'Sản phẩm');
            setData(filteredData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setTimeout(()=> {
            setLoading(false)
        }, 300)
    };
    function fetchListSP() {
        getAllProduct().then(data => {
            setListProduct(data)
        })
    }

    useEffect(() => {
        Promise.all([fetchAllCoCauPhanBo()]);
        fetchListSP()
    }, [company]);

    return (<>
            <div style={call? {width: '100%', height:'100%'}:{position: "relative"}}>
                <div
                    className={'header-powersheet'}
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                >

                    <div style={{display: 'flex', width: '50%', alignItems: 'center'}}>
                        <span style={{color: '#454545', fontSize: 23, fontWeight: 'bold', lineHeight: '35.41px'}}>
                          Thẻ phân bổ theo Sản phẩm
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
                                    listChoose={listProduct}
                                    typeCCPB={typeCCPB}
                                />
                            </div>))}
                    </div>
                </div>
            </div>
            {showFormAdd && (<CoChePhanBoForm
                    company={company}
                    onClose={() => setShowFormAdd(false)}
                    fetchAllCoCauPhanBo={fetchAllCoCauPhanBo}
                    listChoose={listProduct}
                    typeCCPB={typeCCPB}
                />)}
        </>);
}
