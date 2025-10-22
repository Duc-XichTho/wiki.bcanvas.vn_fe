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
import {getCurrentUserLogin} from "../../../../../apis/userService.jsx";
import CoChePhanBoForm from "../popUpForm/CoChePhanBoForm.jsx";

ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function CoChePhanBoVuViec({call , company , headerTitle, showFormAdd , setShowFormAdd}) {
    const {listSoKeToan, loadDataSoKeToan} = useContext(MyContext);
    const [listDuAn, setListDuAn] = useState([])
    const table = 'CoChePhanBo';
    const typeCCPB = 'Vụ việc';
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
        getAllDuAn().then(e => setListDuAn(e))
        Promise.all([fetchCurrentUser(), fetchAllCoCauPhanBo(),]);
    }, []);


    return (
        <>
            <div
                style={{
                    height: call === 'cdsd' ? '99%' : '72.5vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    margin: '15px 0',
                    overflow: 'auto',
                    overflowX: "hidden"

                }}
            >
                <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                    {data.map((item) => (
                        <div key={item.id}>
                            <CoChePhanBoTable
                                item={item}
                                fetchAllCoCauPhanBo={fetchAllCoCauPhanBo}
                                listChoose={listDuAn}
                                typeCCPB={typeCCPB}
                                currentUser={currentUser}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {
                showFormAdd && (
                    <CoChePhanBoForm
                        company={company}
                        showFormAdd={showFormAdd}
                        onClose={() => setShowFormAdd(false)}
                        fetchAllCoCauPhanBo={fetchAllCoCauPhanBo}
                        listChoose={listDuAn}
                        typeCCPB={typeCCPB}
                        currentUser={currentUser}
                    />
                )
            }
        </>
    );
}
