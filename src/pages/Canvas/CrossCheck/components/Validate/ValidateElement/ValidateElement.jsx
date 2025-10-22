import css from './ValidateElement.module.css'
import {useEffect, useState, useMemo} from 'react'
import {Button, message, Table} from 'antd'
import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import MappingModal from './MappingModal';
import {deleteCrossCheck} from '../../../../../../apis/crossCheckService'
import {
    getAllTemplateSheetTable,
    getTemplateColumn,
    getTemplateRow
} from "../../../../../../apis/templateSettingService.jsx";
import {getFileNotePadByIdController} from "../../../../../../apis/fileNotePadService.jsx";
import {getAllKmf} from "../../../../../../apisKTQT/kmfService.jsx";
import {getAllKmns} from "../../../../../../apisKTQT/kmnsService.jsx";
import {getAllUnits} from "../../../../../../apisKTQT/unitService.jsx";
import {getAllProject} from "../../../../../../apisKTQT/projectService.jsx";
import {getAllProduct} from "../../../../../../apisKTQT/productService.jsx";
import {getAllKenh} from "../../../../../../apisKTQT/kenhService.jsx";
import {getAllVendor} from "../../../../../../apisKTQT/vendorService.jsx";

import {
    ClientSideRowModelModule,
    ModuleRegistry,
} from "ag-grid-community";

import {
    ClipboardModule,
} from "ag-grid-enterprise";

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ClipboardModule,
]);

const COT_DU_LIEU = [
    {id: 1, value: 'name', label: 'Mã'},
    {id: 2, value: 'dp', label: 'Tên'}
]

const DANH_MUC_CHUNG = [
    {id: 1, bo_du_lieu: {value: 'KQKD', label: 'Danh mục KQKD'}},
    {id: 2, bo_du_lieu: {value: 'KMTC', label: 'Danh mục KMTC'}},
    {id: 3, bo_du_lieu: {value: 'DV', label: 'Danh mục Đơn vị'}},
    {id: 4, bo_du_lieu: {value: 'VV', label: 'Danh mục Vụ việc'}},
    {id: 5, bo_du_lieu: {value: 'SP', label: 'Danh mục Sản phẩm'}},
    {id: 6, bo_du_lieu: {value: 'KENH', label: 'Danh mục Kênh'}},
    {id: 7, bo_du_lieu: {value: 'KH', label: 'Danh mục Khách hàng'}}
]

const ValidateElement = ({selectedItem, setSelectedItem, fetchAllCrossCheck}) => {

    const [modalMapping, setModalMapping] = useState(false);
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [boDuLieuPrimary, setBoDuLieuPrimary] = useState('')
    const [cotDuLieuPrimary, setCotDuLieuPrimary] = useState('')
    const [boDuLieuChecking, setBoDuLieuChecking] = useState('')
    const [cotDuLieuChecking, setCotDuLieuChecking] = useState('')
    const [result, setResult] = useState([])
    const [listTemplates, setListTemplates] = useState([]);
    const [checkingSourceValues, setCheckingSourceValues] = useState([]);

    async function getAllTemplate() {
        try {
            let data = await getAllTemplateSheetTable();
            let validTemplates = [];

            for (const item of data) {
                try {
                    if (!item.fileNote_id) {
                        console.warn('Bỏ qua template - thiếu fileNote_id:', item);
                        continue;
                    }

                    const fileNote = await getFileNotePadByIdController(item.fileNote_id);
                    if (!fileNote) {
                        console.warn('Bỏ qua template - không tìm thấy FileNote:', item.fileNote_id);
                        continue;
                    }

                    const columns = await getTemplateColumn(item.id);
                    const rowsResponse = await getTemplateRow(item.id);
                    const rows = rowsResponse.rows || [];

                    validTemplates.push({
                        ...item,
                        name: fileNote.name,
                        value: 'TEMP_' + item.id,
                        fields: columns.map(col => ({
                            headerName: col.columnName,
                            field: col.columnName,
                            type: col.columnType
                        })),
                        rows: rows
                    });
                } catch (itemError) {
                    console.warn('Lỗi xử lý template:', item, itemError);
                    continue;
                }
            }

            setListTemplates(validTemplates);
        } catch (error) {
            console.error('Lỗi lấy dữ liệu template:', error);
            setListTemplates([]);
        }
    }

    useEffect(() => {
        getAllTemplate();
    }, [])

    const getSourceData = (source) => {

        let boDuLieu = "";
        let cotDuLieu = "";

        switch (source.type) {
            case "DanhMuc":
                boDuLieu = DANH_MUC_CHUNG.find(item => item.bo_du_lieu.value === source?.bo_du_lieu)?.bo_du_lieu.label || "";
                cotDuLieu = COT_DU_LIEU.find(item => item.value === source?.cot_du_lieu)?.label || "";
                break;

            case "Template": {
                const template = listTemplates.find(item => item.value === source?.bo_du_lieu);
                boDuLieu = template?.name || "";
                cotDuLieu = template?.fields?.find(field => field.field === source?.cot_du_lieu)?.headerName || "";
                break;
            }
            default:
                break;
        }

        return {boDuLieu, cotDuLieu};
    };


    useEffect(() => {
        if (selectedItem) {
            setName(selectedItem?.name)
            setDesc(selectedItem?.desc)

            const primaryData = getSourceData(selectedItem?.primarySource);
            setBoDuLieuPrimary(primaryData.boDuLieu);
            setCotDuLieuPrimary(primaryData.cotDuLieu);

            const checkingData = getSourceData(selectedItem?.checkingSource);
            setBoDuLieuChecking(checkingData.boDuLieu);
            setCotDuLieuChecking(checkingData.cotDuLieu);
            setResult([])
        }
    }, [selectedItem, listTemplates])

    useEffect(() => {
        if (selectedItem && listTemplates.length > 0) {
            handleChay();
        }
    }, [selectedItem, listTemplates]);

    const handleDelete = async () => {
        try {
            await deleteCrossCheck(selectedItem?.id)
            await fetchAllCrossCheck()
            setSelectedItem(null)
            message.success('Xóa thành công')
        } catch (error) {
            console.log('ERROR handleDelete', error);
        }
    }

    const danhMucValues = [
        {value: 'KQKD', getApi: getAllKmf},
        {value: 'KMTC', getApi: getAllKmns},
        {value: 'DV', getApi: getAllUnits},
        {value: 'VV', getApi: getAllProject},
        {value: 'SP', getApi: getAllProduct},
        {value: 'KENH', getApi: getAllKenh},
        {value: 'KH', getApi: getAllVendor}
    ];

    async function getDataForSource(source) {
        if (!source) return null;

        if (source.type === "Template") {
            return await getTemplateData(source.id);
        } else {
            const data = await getDanhMucData(source.bo_du_lieu);
            return data
        }
    }

    async function getTemplateData(sourceId) {
        try {
            const templateSheets = await getAllTemplateSheetTable();
            const matchingSheet = templateSheets.find(sheet => sheet.fileNote_id === sourceId);

            if (matchingSheet) {
                const templateRowDataResponse = await getTemplateRow(matchingSheet.id);
                const templateRowData = templateRowDataResponse.rows || [];
                return templateRowData.map(item => item.data);
            } else {
                console.warn("Không tìm thấy sheet phù hợp với source ID:", sourceId);
                return null;
            }
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu Template:", error);
            return null;
        }
    }

    async function getDanhMucData(boDuLieu) {
        try {
            if (!boDuLieu) {
                console.warn("Không có bộ dữ liệu để lấy");
                return null;
            }

            const danhMuc = danhMucValues.find(item => item.value === boDuLieu);

            if (!danhMuc) {
                console.warn("Bộ dữ liệu không hợp lệ:", boDuLieu);
                return null;
            }

            return await danhMuc.getApi();
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu DanhMuc:", error);
            return null;
        }
    }

    async function handleChay() {
        if (!selectedItem) return;

        const {primarySource, checkingSource} = selectedItem;

        if (!primarySource || !checkingSource) {
            console.warn("Thiếu dữ liệu primarySource hoặc checkingSource");
            return;
        }

        const primaryData = await getDataForSource(primarySource);
        const checkingData = await getDataForSource(checkingSource);

        if (!primaryData || !checkingData) {
            console.warn("Không có dữ liệu để so sánh");
            return;
        }

        const primaryColumn = primarySource.cot_du_lieu;
        const checkingColumn = checkingSource.cot_du_lieu;

        const uniqueCheckingValues = [...new Set(checkingData.map(item =>
            item[checkingColumn] ? item[checkingColumn].toString() : ""))];

        setCheckingSourceValues(uniqueCheckingValues);

        const result = markExistence(primaryData, checkingData, primaryColumn, checkingColumn);

        setResult(result);
    }

    function markExistence(primaryData, checkingData, primaryColumn, checkingColumn) {

        const checkingValues = new Set(checkingData.map(item => item[checkingColumn]));

        return primaryData.map(item => ({
            ...item,
            existsInChecking: checkingValues.has(item[primaryColumn])
            // existsInChecking: checkingValues.has(item[primaryColumn]) ? "Có trong danh sách kiểm tra" : "Không có trong danh sách kiểm tra"
        }));
    }

    const columns = [
        {
            title: "Giá trị nguồn cần kiểm soát làm sạch",
            dataIndex: selectedItem?.primarySource?.cot_du_lieu,
            key: "primaryValue",
        },
        {
            title: "Tồn tại trong nguồn kiểm tra",
            dataIndex: "existsInChecking",
            key: "existsInChecking",
            render: (value) => value ? "✅" : "❌"
        },
    ];

    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([]);

    const CustomHeader = (props) => {
        return (
            <div className={css.customHeader}>
                <div className={css.headerTitle}>
                    <span>{props.type === 'primary' ? 'Dữ liệu cần kiểm soát làm sạch:' : 'Dữ liệu chuẩn (Master Data):'} </span>
                    <span>{props.bo_du_lieu || ""}</span>
                </div>
                <div className={css.headerSubtitle}>
                    <span>Cột dữ liệu: </span>
                    <span>{props.cot_du_lieu || ""}</span>
                </div>
            </div>
        );
    };

    const defaultColDef = useMemo(() => {
        return {
            flex: 1,
            minWidth: 100,
            headerComponent: CustomHeader,
        };
    }, []);

    useEffect(() => {
        if (boDuLieuPrimary && boDuLieuChecking) {
            setColumnDefs([
                {
                    field: "id_du_lieu_chinh",
                    hide: true
                },
                {
                    field: "du_lieu_chinh",
                    headerComponentParams: {
                        type: "primary",
                        bo_du_lieu: boDuLieuPrimary,
                        cot_du_lieu: cotDuLieuPrimary
                    }
                },
                {
                    field: "du_lieu_nguon",
                    editable: true,
                    headerComponentParams: {
                        type: "checking",
                        bo_du_lieu: boDuLieuChecking,
                        cot_du_lieu: cotDuLieuChecking
                    },
                    cellEditor: 'agRichSelectCellEditor',
                    cellEditorParams: {
                        values: checkingSourceValues,
                        allowTyping: true,
                        filterList: true,
                        highlightMatch: true,
                        valueListMaxHeight: 220
                    }
                },
            ]);
        }
    }, [boDuLieuPrimary, boDuLieuChecking, checkingSourceValues]);

    const rowSelection = useMemo(() => {
        return {mode: "multiRow"};
    }, []);

    useEffect(() => {
        let data = [];
        let key = selectedItem?.primarySource?.cot_du_lieu
        const uniqueData = [...new Set(result.filter(item => !item.existsInChecking && item[key] && item[key] !== '').map(item => item[key]))];
        data = uniqueData
            .map(item => ({
                du_lieu_chinh: item,
                du_lieu_nguon: ""
            }))
        setRowData(data)
    }, [modalMapping])

    return (
        <>
            <div className={css.main}>
                <div className={css.container}>
                    <div className={css.header}>
                        <div className={css.headerLeft}>
                            <span>Thông tin quy tắc</span>
                        </div>
                        <div className={css.headerRight}>
                            <Button shape="circle" icon={<EditOutlined/>}/>
                            <Button onClick={handleDelete} shape="circle" icon={<DeleteOutlined/>}/>
                        </div>
                    </div>
                    <div className={css.body}>
                        <div className={css.ruleName}>
                            <div>Tên quy tắc:</div>
                            <div>{name}</div>
                        </div>
                        <div className={css.ruleDesc}>
                            <div>Mô tả:</div>
                            <div>{desc}</div>
                        </div>
                        <div className={css.source}>
                            <div className={css.sourceLeft}>
                                <div>Dữ liệu cần kiểm soát làm sạch:</div>
                            </div>
                            <div className={css.sourceRight}>
                                <div className={css.sourceTop}>
                                    <div className={css.sourceBoDuLieu}>
                                        <div>Bộ dữ liệu:</div>
                                        <div>{boDuLieuPrimary}</div>
                                    </div>
                                    <div className={css.sourceCotDuLieu}>
                                        <div>Cột dữ liệu:</div>
                                        <div>{cotDuLieuPrimary}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={css.source}>
                            <div className={css.sourceLeft}>
                                <div>Dữ liệu chuẩn (Master Data):</div>
                            </div>
                            <div className={css.sourceRight}>
                                <div className={css.sourceTop}>
                                    <div className={css.sourceBoDuLieu}>
                                        <div>Bộ dữ liệu:</div>
                                        <div>{boDuLieuChecking}</div>
                                    </div>
                                    <div className={css.sourceCotDuLieu}>
                                        <div>Cột dữ liệu:</div>
                                        <div>{cotDuLieuChecking}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Table columns={columns} dataSource={result} rowKey="id"
                               scroll={{y: '33vh'}}
                               pagination={false}/>
                    </div>
                    <div className={css.footer} onClick={() => setModalMapping(true)}>
                        <Button type="primary" >Tạo rule Mapping</Button>
                    </div>
                </div>
            </div>

            <MappingModal
                modalMapping={modalMapping}
                setModalMapping={setModalMapping}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection={rowSelection}
                selectedItem={selectedItem}
                boDuLieuPrimary={boDuLieuPrimary}
                cotDuLieuPrimary={cotDuLieuPrimary}
                boDuLieuChecking={boDuLieuChecking}
                cotDuLieuChecking={cotDuLieuChecking}
            />
        </>
    )
}

export default ValidateElement
