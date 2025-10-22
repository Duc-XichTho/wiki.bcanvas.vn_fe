import { useRef, useState, useEffect } from 'react';
import { Modal, Button, message, Input } from 'antd';
import { AgGridReact } from "ag-grid-react";
import css from './ValidateElement.module.css';
import { createCrossCheck } from '../../../../../../apis/crossCheckService'

const MappingModal = ({
    modalMapping,
    setModalMapping,
    rowData,
    columnDefs,
    defaultColDef,
    rowSelection,
    selectedItem,
    boDuLieuPrimary,
    cotDuLieuPrimary,
    boDuLieuChecking,
    cotDuLieuChecking,
}) => {
    const gridRef = useRef();
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    const isFormValid = () => {
        return (
            name.trim()
        );
    };

    const handleCreateMapping = async () => {
        if (gridRef && gridRef.current) {
            const gridApi = gridRef.current.api;
            let allData = [];

            gridApi.forEachNode(node => {
                allData.push({
                    du_lieu_chinh: node.data.du_lieu_chinh,
                    du_lieu_nguon: node.data.du_lieu_nguon
                });
            });

            try {
                const data = {
                    name: name,
                    desc: desc,
                    type: 'Mapping',
                    info: {
                        validateRecord: selectedItem,
                        mappingList: allData,
                        boDuLieuPrimary: boDuLieuPrimary,
                        cotDuLieuPrimary: cotDuLieuPrimary,
                        boDuLieuChecking: boDuLieuChecking,
                        cotDuLieuChecking: cotDuLieuChecking,
                    }
                }

                await createCrossCheck(data)
                    .then(res => {
                        message.success('Tạo Mapping thành công');
                        setName('');
                        setDesc('');
                        setModalMapping(false)
                    })
                    .catch(err => {
                        message.error('Tạo thất bại');
                    });
            } catch (error) {
                console.error('ERROR handleCreateMapping:', error);
            }
        }
    };

    const renderMappingCreate = () => {
        return (
            <div className={css.mappingCreate}>
                <div className={css.infoRule}>
                    <div className={css.ruleNameMapping}>
                        <div>Tên:</div>
                        <div>
                            <Input
                                placeholder='nhập'
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={css.ruleDescMapping}>
                        <div>Mô tả:</div>
                        <div>
                            <Input
                                placeholder='nhập'
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowSelection={rowSelection}
                    className="ag-theme-quartz"
                    enableRangeSelection
                    domLayout='autoHeight'
                />

            </div>
        )
    }

    return (
        <Modal
            title="Tạo Mapping"
            width={800}
            centered
            maskClosable={false}
            open={modalMapping}
            onCancel={() => setModalMapping(false)}
            styles={{
                body: {
                    height: '600px',
                }
            }}
            footer={() => (
                <div className={css.mappingModalFooter}>
                    <Button onClick={() => setModalMapping(false)}>Hủy</Button>
                    <Button
                        type='primary'
                        onClick={() => handleCreateMapping()}
                        disabled={!isFormValid()}
                    >
                        Tạo
                    </Button>
                </div>
            )}
        >
            {renderMappingCreate()}
        </Modal>
    );
};

export default MappingModal;
