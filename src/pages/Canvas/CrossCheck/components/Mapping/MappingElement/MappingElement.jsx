import css from './MappingElement.module.css'
import { useMemo, useRef, useState, useEffect } from 'react';
import { Card, List, Typography, Layout, Table,Button, Popconfirm } from 'antd';

const { Title } = Typography;

const MappingElement = ({ selectedItem, records, selectedRecords, setSelectedRecords,isMappingModalVisible,allList,handleMappingConfirm }) => {
   
    const [paths, setPaths] = useState([]);
    const primaryRefs = useRef({});
    const checkingRefs = useRef({});
    const containerRef = useRef(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [showMappedOnly, setShowMappedOnly] = useState(false);


    // Tạo mapping object để theo dõi các kết nối
    const connectionMap = useMemo(() => {
        const map = {};
        selectedItem?.info.mappingList?.forEach(item => {
            // Skip if either value is empty
            if (!String(item.du_lieu_chinh).trim() || !String(item.du_lieu_nguon).trim()) return;

            if (!map[item.du_lieu_chinh]) {
                map[item.du_lieu_chinh] = [];
            }
            map[item.du_lieu_chinh].push(item.du_lieu_nguon);
        });
        return map;
    }, [selectedItem]);
    

    // Lấy danh sách unique của dữ liệu nguồn
    const uniqueCheckingData = useMemo(() => {
        if (!selectedItem?.info.mappingList) return [];
        return [...new Set(
            selectedItem.info.mappingList
                .filter(item => item.du_lieu_nguon?.trim()) // Filter out empty values
                .map(item => item.du_lieu_nguon)
        )];
    }, [selectedItem]);



    async function updatePaths() {
        const newPaths = [];
        const container = containerRef.current;

        if (!container) return;

        const containerRect = container.getBoundingClientRect();

        // Duyệt qua từng cặp kết nối trong mapping
        Object.entries(connectionMap).forEach(([primary, checkingList]) => {
            const sourceRef = primaryRefs.current[primary];

            checkingList.forEach(checking => {
                const targetRef = checkingRefs.current[checking];

                if (sourceRef && targetRef) {
                    const sourceRect = sourceRef.getBoundingClientRect();
                    const targetRect = targetRef.getBoundingClientRect();

                    const start = {
                        x: sourceRect.right - containerRect.left,
                        y: sourceRect.top - containerRect.top + sourceRect.height / 2
                    };

                    const end = {
                        x: targetRect.left - containerRect.left,
                        y: targetRect.top - containerRect.top + targetRect.height / 2
                    };

                    // Điều chỉnh điểm điều khiển để tạo đường cong mượt mà hơn
                    const cpOffset = Math.abs(end.x - start.x) / 2;
                    const path = `M ${start.x},${start.y} C ${start.x + cpOffset},${start.y} ${end.x - cpOffset},${end.y} ${end.x},${end.y}`;

                    newPaths.push({ path, primary, checking });
                }
            });
        });
        setPaths(newPaths);
    }
    useEffect(() => {

        updatePaths();


        // Add a small delay to ensure all elements are properly rendered
        const timeoutId = setTimeout(updatePaths);
        return () => {
            updatePaths()
            clearTimeout(timeoutId);
        };

    }, [selectedItem, connectionMap, uniqueCheckingData]);
    useEffect(() => {
      if(setSelectedRecords){
        setSelectedRecords([]);
      }
    },[])

    const recordColumns = [
        {
            title: 'ID',
            dataIndex: ['id'],
            key: 'id',
        },
        {
            title: 'Giá trị hiện tại',
            dataIndex: ['data', selectedItem?.info?.cotDuLieuPrimary],
            key: 'currentValue',
        },
        {
            title: 'Giá trị mapping',
            dataIndex: 'mappedValue',
            key: 'mappedValue',
            render: (_, record) => {
                const mapping = selectedItem?.info?.mappingList?.find(
                    m => m.du_lieu_chinh === record.data[selectedItem?.info?.cotDuLieuPrimary]
                );
                return mapping?.du_lieu_nguon || '';
            }
        }
    ];

    // Transform mapping data for table
    useEffect(() => {

        if (selectedItem?.info?.mappingList) {
            const data = selectedItem.info.mappingList.map((item, index) => {

                return {
                    key: index,
                    du_lieu_chinh: item.du_lieu_chinh,
                    du_lieu_nguon: item.du_lieu_nguon,
                };
            });
            setTableData(data);
        }
    }, [selectedItem, connectionMap, uniqueCheckingData]);


    const rowSelection = {
        selectedRowKeys: selectedRows,
        onChange: (selectedRowKeys) => {
            setSelectedRows(selectedRowKeys);
        },
        defaultSelectedRowKeys: tableData
            .filter(row => row.hasError)
            .map(row => row.key)
    };
    return (
        <Layout style={{ height: '100%', width: '100%', backgroundColor: "white" }}>
            <div className={css.container}>
                <div className={css.mappingCreate}>
                    <div className={css.infoRule}>
                        <div className={css.ruleNameMapping}>
                            <div>Tên:</div>
                            <div>{selectedItem?.name}</div>
                        </div>
                        <div className={css.ruleDescMapping}>
                            <div>Mô tả:</div>
                            <div>{selectedItem?.desc}</div>
                        </div>
                    </div>
                    <div
                        ref={containerRef}
                        style={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '100px',
                            padding: '20px 0',
                        }}
                    >
                        <svg
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none'
                            }}
                        >
                            {paths?.map((path, index) => (
                                <path
                                    key={`${path.primary}-${path.checking}-${index}`}
                                    d={path.path}
                                    stroke="#259c63"
                                    fill="none"
                                    strokeWidth="1.5"
                                    strokeOpacity="0.8"
                                />
                            ))}
                        </svg>

                        {/* Primary Data Column */}
                        <div style={{ flex: 1 }}>
                            <Card
                                title={
                                    <div>
                                        <div>Dữ liệu cần kiểm soát làm sạch:</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Bộ dữ liệu: {selectedItem?.info.boDuLieuPrimary}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Cột dữ liệu: {selectedItem?.info.cotDuLieuPrimary}</div>
                                    </div>
                                }
                                style={{ border: 'none' }}
                                bodyStyle={{ padding: '0 0' }}
                            >
                                <List
                                    dataSource={selectedItem?.info.mappingList || []}
                                    renderItem={item => (
                                        <List.Item style={{ padding: '4px 0' }}>
                                            <Card
                                                ref={el => primaryRefs.current[item.du_lieu_chinh] = el}
                                                size="small"
                                                style={{
                                                    width: '100%',
                                                    borderRadius: '4px',
                                                    marginRight: '-1px'
                                                }}
                                            >
                                                {item.du_lieu_chinh}
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </div>

                        {/* Checking Data Column */}
                        <div style={{ flex: 1 }}>
                            <Card
                                title={
                                    <div>
                                        <div>Dữ liệu chuẩn:</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Bộ dữ liệu: {selectedItem?.info.boDuLieuChecking}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Cột dữ liệu: {selectedItem?.info.cotDuLieuChecking}</div>
                                    </div>
                                }
                                style={{ border: 'none' }}
                                bodyStyle={{ padding: '0 0' }}
                            >
                                <List
                                    dataSource={uniqueCheckingData}
                                    renderItem={item => (
                                        <List.Item style={{ padding: '4px 0' }}>
                                            <Card
                                                ref={el => checkingRefs.current[item] = el}
                                                size="small"
                                                style={{
                                                    width: '100%',
                                                    borderRadius: '4px',
                                                    marginLeft: '-1px'
                                                }}
                                            >
                                                {item}
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </div>
                    </div>
                </div>

            </div>
            <div style={{ marginTop: '20px', padding: '0 20px' }}>
                <Card 
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Danh sách bản ghi cần cập nhật</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button 
                                    onClick={() => {
                                        if (selectedRecords.length === records.length) {
                                            setSelectedRecords([]);
                                        } else {
                                            setSelectedRecords(records);
                                        }
                                    }}
                                >
                                    {selectedRecords.length === records.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                </Button>
                                <Button 
                                    type={showMappedOnly ? "primary" : "default"}
                                    onClick={() => setShowMappedOnly(!showMappedOnly)}
                                >
                                    {showMappedOnly ? "Hiện tất cả" : "Chỉ hiện bản ghi cần mapping"}
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <Table
                        rowSelection={{
                            type: 'checkbox',
                            selectedRowKeys: selectedRecords.map(record => record.id),
                            onChange: (_, selectedRows) => {
                                setSelectedRecords(selectedRows);
                            }
                        }}
                        columns={recordColumns}
                        dataSource={showMappedOnly ? records.filter(record => {
                            if (!record?.data || !selectedItem?.info?.cotDuLieuPrimary) return false;
                            const mapping = selectedItem?.info?.mappingList?.find(
                                m => m.du_lieu_chinh === record.data[selectedItem.info.cotDuLieuPrimary]
                            );
                            return mapping?.du_lieu_nguon;
                        }) : records}
                        rowKey="id"
                    />
                </Card>
            </div>
            {allList && <div style={{ width: '100%', display: 'flex', justifyContent: 'end', marginTop: '20px' }}>
            <Popconfirm
														title='Ghi đè dữ liệu'
														description='Bạn có muốn ghi đè dữ liệu đã được mapping? (Không thể hoàn tác)'
														onConfirm={handleMappingConfirm}
														okText='Đồng ý'
														cancelText='Từ chối'
													>
														<Button
															type='primary'
															disabled={selectedRecords.length === 0}
														>
															{selectedRecords.length === 0 ? 'Cập nhật' : selectedRecords.length === records.length ? 'Cập nhật tất cả' : `Cập nhật (${selectedRecords.length}) bản ghi`}
														</Button>
													</Popconfirm> 
            </div>
            }
        </Layout>
    );
}

export default MappingElement;
