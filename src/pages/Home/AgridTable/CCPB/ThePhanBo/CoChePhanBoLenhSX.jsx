import React, {useContext, useEffect, useRef, useState} from 'react';
import {ClientSideRowModelModule} from '@ag-grid-community/client-side-row-model';
import {RowGroupingModule} from '@ag-grid-enterprise/row-grouping';
import {ModuleRegistry} from '@ag-grid-community/core';
import {SetFilterModule} from '@ag-grid-enterprise/set-filter';
import CoChePhanBoTable from './CoChePhanBoTable.jsx';
import {MyContext} from '../../../../../MyContext.jsx';
import {onFilterTextBoxChanged} from "../../../../../generalFunction/quickFilter.js";
import {getAllDuAn} from "../../../../../apis/duAnService.jsx";
import {getAllCCPB} from "../../../../../apis/ccpbService.jsx";
import CoChePhanBoForm from "../popUpForm/CoChePhanBoForm.jsx";
import css from '../../DanhMuc/KeToanQuanTri.module.css'
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import {getAllLenhSanXuat} from "../../../../../apis/lenhSanXuatService.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function CoChePhanBoLenhSX({call , company , headerTitle, showFormAdd , setShowFormAdd}) {
    const {listSoKeToan, loadDataSoKeToan} = useContext(MyContext);
    const [listLenhSX, setListLenhSX] = useState([])
    const table = 'CoChePhanBo';
    const typeCCPB = 'Lệnh sản xuất';
    const gridRef = useRef();
    const handleFilterTextBoxChanged = onFilterTextBoxChanged(gridRef);
    const [data, setData] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    const fetchAllCoCauPhanBo = async () => {
        try {
            const response = await getAllCCPB();
            const filteredData = response.filter((item) => item.type === typeCCPB);
            setData(filteredData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        getAllLenhSanXuat().then(e => setListLenhSX(e))
        Promise.all([fetchCurrentUser(),fetchAllCoCauPhanBo(), ]);
    }, []);


    return (
        <>
            <div
                style={{
                    height: call === 'cdsd' ? '70vh' : '72.5vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    margin: '15px 0',
                    // overflow: 'auto',
                    // overflowX: "hidden"

                }}
            >
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                    {data.map((item) => (
                        <div key={item.id}>
                            <CoChePhanBoTable
                                item={item}
                                fetchAllCoCauPhanBo={fetchAllCoCauPhanBo}
                                listChoose={listLenhSX}
                                typeCCPB={typeCCPB}
                                currentUser = {currentUser}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {
                showFormAdd && (
                    <CoChePhanBoForm
                        company={company}
                        onClose={() => setShowFormAdd(false)}
                        fetchAllCoCauPhanBo={fetchAllCoCauPhanBo}
                        listChoose={listLenhSX}
                        typeCCPB={typeCCPB}
                        currentUser = {currentUser}
                        showFormAdd = {showFormAdd}
                    />
                )
            }
        </>
    );
}
