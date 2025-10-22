import React, { useState, useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Button, Input, Modal, Select, Form, Popconfirm } from "antd";
import { DeleteIcon } from "../../../../../icon/IconSVG.js";
import { getData } from "@syncfusion/ej2-react-spreadsheet";
import {
    createCFConfigService,
    deleteCFConfigService,
    getAllCFConfigService, updateCFConfigService, getCFConfigByPlanIdService
} from "../../../../../apis/CFConfigService.jsx";
import CauHinh from "./CauHinh.jsx";
import {formatCurrency} from "../../../../../generalFunction/format.js";

const { Option } = Select;

const parseNumeric = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return '';
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : '';
};

const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
};


const CostConfig = ({listRsLK, date_from, date_to, planId}) => {
    const dateFrom = parseDate(date_from);
    const dateTo = parseDate(date_to);
    const [data, setData] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [cauHinhModalOpen, setCauHinhModalOpen] = useState(false);
    const [form] = Form.useForm();
    const gridRef = useRef();
    const monthsRange = [];
    let currentMonth = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1);
    while (currentMonth <= dateTo) {
        monthsRange.push(
            `${String(currentMonth.getMonth() + 1).padStart(2, "0")}/${currentMonth.getFullYear()}`
        );
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    const handleCellClick = (record) => {
        setSelectedRecord(record);
        setCauHinhModalOpen(true);
    };

    const handleDeleteCost = async (id) => {
        try {
            await deleteCFConfigService(id);
            await fetchDataCFC();
        } catch (error) {
            console.error("Error deleting cost:", error);
        }
    };

    async function fetchDataCFC() {
        let data1 = planId ? await getCFConfigByPlanIdService(planId) : await getAllCFConfigService()
        setData(data1)
    }

    useEffect(() => {
        fetchDataCFC()
    }, [addModalVisible])
    const columnDefs = useMemo(() => [
        {
            headerName: "Tên", field: "name", editable: true,
            width: 100,
        },
        {
            headerName: "Loại", field: "type", editable: true,
            width: 200,
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
                allowTyping: true,
                filterList: true,
                highlightMatch: true,
                values: [
                    'Chi tiết theo sản phẩm (%)',
                    'Chi tiết theo sản phẩm (K)',
                    'Theo tỷ lệ % doanh thu',
                    'Số cố định',
                ],
            },
        },
        ...monthsRange.map(month => ({
            headerName: month,
            field: month,
            width: 120,
            editable: param => {
                if (param.data.type) {
                    if (param.data.type === 'Chi tiết theo sản phẩm (%)' || param.data.type === 'Chi tiết theo sản phẩm (K)') {
                        return false;
                    } else return true;
                } else return false;
            },
            valueParser: (p) => parseNumeric(p.newValue),
            valueSetter: (params) => {
                const monthKey = params.colDef.field;
                const current = params.data.data || {};
                const parsed = parseNumeric(params.newValue);
                if (parsed === '' || parsed === null) {
                    if (monthKey in current) delete current[monthKey];
                } else {
                    current[monthKey] = parsed;
                }
                params.data.data = { ...current };
                return true;
            },
            valueGetter: (params) => {
                if (!params.data.data) return '';
                return params.data.data[params.column.colId] || '';
            },
            cellStyle: {textAlign: "right"},
            valueFormatter: params => formatCurrency(params.value),
            cellRenderer: (params) =>
                (["Chi tiết theo sản phẩm (%)", 'Chi tiết theo sản phẩm (K)'].includes(params.data.type)) ? (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: "flex",
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Button type='default' onClick={() => handleCellClick(params.data)}>Cấu hình</Button>
                    </div>
                ) : `${formatCurrency(params.value)}`
        })),

        {
            headerName: "",
            width: 70,
            field: "actions",
            pinned: 'left',
            cellRenderer: (params) => (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: "flex",
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Popconfirm
                        title="Xóa chi phí"
                        description="Bạn có chắc chắn muốn xóa chi phí này?"
                        onConfirm={() => handleDeleteCost(params.data.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="dashed" danger>
                            <img src={DeleteIcon} alt="" />
                        </Button>
                    </Popconfirm>
                </div>
            ),
        }
    ], [data]);


    const handleAddCost = async (values) => {
        try {
            const newCost = {
                name: values.name,
                type: values.type,
                data: (values.type === 'Chi tiết theo sản phẩm (%)' || values.type === 'Chi tiết theo sản phẩm (K)') ? 'Cấu hình' : {},
                plan_id: planId || null,
            };
            await createCFConfigService(newCost);
            await fetchDataCFC();
            setAddModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error("Error adding cost:", error);
        }
    };

    const onCellValueChanged = async (params) => {
        if (params.column.colId === 'type') {
            const updatedData = data.map(item => {
                if (item.id === params.data.id) {
                    const isConfigType = ['Chi tiết theo sản phẩm (%)', 'Chi tiết theo sản phẩm (K)'].includes(params.newValue);
                    return {
                        ...item,
                        type: params.newValue,
                        data: isConfigType ? {} : (item.data || {})
                    };
                }
                return item;
            });
            setData(updatedData);
            try {
                const changed = updatedData.find(item => item.id === params.data.id);
                const updatedRecord = {
                    id: changed.id,
                    name: changed.name,
                    type: changed.type,
                    data: changed.data || {},
                    detailSKU: changed.detailSKU,
                    plan_id: planId || null,
                    show: changed.show,
                };
                await updateCFConfigService(params.data.id, updatedRecord);
            } catch (error) {
                console.error("Error updating type:", error);
            }
        } else if (monthsRange.includes(params.column.colId)) {
            const currentData = params.data.data || {};
            const updatedMonthData = { ...currentData };

            if (params.newValue === '' || params.newValue === null) {
                delete updatedMonthData[params.column.colId];
            } else {
                updatedMonthData[params.column.colId] = params.newValue;
            }

            const updatedRecord = {
                id: params.data.id,
                name: params.data.name,
                type: params.data.type,
                data: updatedMonthData,
                detailSKU: params.data.detailSKU,
                plan_id: planId || null,
                show: params.data.show,
            };

            try {
                await updateCFConfigService(params.data.id, updatedRecord);
                const newData = data.map(item => {
                    if (item.id !== params.data.id) return item;
                    const clone = { ...item };
                    // ensure root does not keep dynamic month keys like "10/2025"
                    monthsRange.forEach(m => { if (m in clone) delete clone[m]; });
                    clone.data = updatedMonthData;
                    clone.type = updatedRecord.type;
                    clone.name = updatedRecord.name;
                    clone.plan_id = updatedRecord.plan_id;
                    return clone;
                });
                setData(newData);
            } catch (error) {
                console.error("Error updating cell value:", error);
            }
        }
    };

    return (
        <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
            <div className="ag-theme-quartz" style={{ height: '80%', width: "100%" }}>
                <AgGridReact
                    ref={gridRef}
                    rowData={data}
                    columnDefs={columnDefs}
                    defaultColDef={{ resizable: true }}
                    onCellValueChanged={onCellValueChanged}
                />
                <Button type="dashed" style={{ marginTop: 10 }} onClick={() => setAddModalVisible(true)}>
                    [+] Thêm chi phí
                </Button>

            </div>

            <Modal
                title="Thêm chi phí mới"
                open={addModalVisible}
                onCancel={() => setAddModalVisible(false)}
                onOk={() => form.submit()}

            >
                <Form form={form} onFinish={handleAddCost} layout="vertical">
                    <Form.Item name="name" label="Tên chi phí"
                        rules={[{ required: true, message: "Vui lòng nhập tên chi phí" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="type" label="Loại chi phí"
                        rules={[{ required: true, message: "Vui lòng chọn loại chi phí" }]}>
                        <Select>
                            <Option value="Chi tiết theo sản phẩm (%)">Chi tiết theo sản phẩm (%)</Option>
                            <Option value="Chi tiết theo sản phẩm (K)">Chi tiết theo sản phẩm (K)</Option>
                            <Option value="Theo tỷ lệ % doanh thu">Theo tỷ lệ % doanh thu</Option>
                            <Option value="Số cố định">Số cố định</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Chi tiết theo sản phẩm"
                open={cauHinhModalOpen}
                onCancel={() => setCauHinhModalOpen(false)}
                width={'80vw'}
                footer={null}
            >
                <CauHinh selectedRecord={selectedRecord} monthsRange={monthsRange} listRsLK={listRsLK}/>
            </Modal>
        </div>
    );
};

export default CostConfig;
