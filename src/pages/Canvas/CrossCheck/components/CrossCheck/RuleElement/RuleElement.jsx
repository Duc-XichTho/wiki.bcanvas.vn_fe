import css from './RuleElement.module.css'
import {useContext, useEffect, useState} from 'react'
import {Button, message} from 'antd'
import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import {deleteCrossCheck} from '../../../../../../apis/crossCheckService'
import {CANVAS_DATA_PACK} from '../../../../../../CONST.js'
import {LIST_FIELD_BC} from '../../../../../../Consts/LIST_FIELD_BC.js'
import {getAllTemplateSheetTable, getTemplateColumn} from "../../../../../../apis/templateSettingService.jsx";
import {getFileNotePadByIdController} from "../../../../../../apis/fileNotePadService.jsx";
import {getDataFromSheet} from "../../getDataFromSheet.js";
import {createTimestamp, formatCurrency} from "../../../../../../generalFunction/format.js";
import {MyContext} from "../../../../../../MyContext.jsx";
import {createNewResultCrossCheck} from "../../../../../../apis/resultCrossCheckService.jsx";

const boDuLieuFull = CANVAS_DATA_PACK
    .filter(item => item.crossCheck === true)
    .map(item => ({
        id: item.id,
        name: item.name,
        value: item.value,
        fields: LIST_FIELD_BC[item.value] || [],
        isBaoCao: true,
        options: item.options
    }));

const RuleElement = ({selectedItem, setSelectedItem, fetchAllCrossCheck}) => {

    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [differenceRatio, setDifferenceRatio] = useState('')

    const [boDuLieuPrimary, setBoDuLieuPrimary] = useState('')
    const [result, setResult] = useState(null)
    const [cotDuLieuPrimary, setCotDuLieuPrimary] = useState('')
    const [listDieuKienPrimary, setListDieuKienPrimary] = useState([])

    const [boDuLieuChecking, setBoDuLieuChecking] = useState('')
    const [cotDuLieuChecking, setCotDuLieuChecking] = useState('')
    const [listDieuKienChecking, setListDieuKienChecking] = useState([])
    let {listCompany , currentUser} = useContext(MyContext);

    const [tables, setTables] = useState(boDuLieuFull);

    async function getAllTemplate() {
        let data = await getAllTemplateSheetTable()
        for (const item of data) {
            let fileNote = await getFileNotePadByIdController(item.fileNote_id);
            item.name = fileNote?.name;
            item.value = 'TEMP_' + item.id;
            let columns = await getTemplateColumn(item.id);
            item.fields = columns.map(col => {
                return {headerName: col.columnName, field: col.columnName}
            });
        }
        setTables([...boDuLieuFull, ...data]);
    }

    useEffect(() => {
        getAllTemplate();
    }, [])

    const getSourceData = (source) => {
        const boDuLieu = tables.find(item => item.value === source?.bo_du_lieu);
        let cotDuLieu;
        let dieuKien;
        const mapping = {
            equal_to: 'bằng',
            different: 'khác',
            greater_than: 'lớn hơn',
            less_than: 'nhỏ hơn',
            beetween: 'trong khoảng',
        };

        if (boDuLieu && boDuLieu.isBaoCao) {
            cotDuLieu = boDuLieu?.options.find(field => field.value === source?.cot_du_lieu)?.label;
            dieuKien = source.dieu_kien;
        } else {
            cotDuLieu = boDuLieu?.fields.find(field => field.field === source?.cot_du_lieu)?.headerName;
            dieuKien = source?.dieu_kien?.map((dk) => ({
                id: dk.id,
                cot_du_lieu: dk.cot_du_lieu,
                dieu_kien_loc: mapping[dk.dieu_kien_loc] || '',
                gia_tri_loc: dk.gia_tri_loc
            }));
        }


        return {
            boDuLieu: boDuLieu?.name,
            cotDuLieu,
            dieuKien
        };
    };

    useEffect(() => {
        if (selectedItem) {
            setName(selectedItem?.name)
            setDesc(selectedItem?.desc)
            setDifferenceRatio(selectedItem?.difference_ratio)

            const primaryData = getSourceData(selectedItem?.primarySource);
            setBoDuLieuPrimary(primaryData.boDuLieu);
            setCotDuLieuPrimary(primaryData.cotDuLieu);
            setListDieuKienPrimary(primaryData.dieuKien);

            const checkingData = getSourceData(selectedItem?.checkingSource);
            setBoDuLieuChecking(checkingData.boDuLieu);
            setCotDuLieuChecking(checkingData.cotDuLieu);
            setListDieuKienChecking(checkingData.dieuKien);
            setResult(null)
        }
    }, [selectedItem, tables])

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

    async function handleChay() {
        try {
            const data = await getDataFromSheet(selectedItem, listCompany);

            const combinedResult = {
                id_crossCheck: selectedItem.id,
                result: {
                    ...data,
                    name: selectedItem.name
                },
                isErr: data.isOK,
                user_create : currentUser.email,
                created_at: createTimestamp(),
                trang_thai : 'CrossCheck'
            };
            await createNewResultCrossCheck(combinedResult)
            setResult(data);
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu:", error);
        }
    }



    const getFullDateRange = (year, fromMonth, toMonth) => {
        if (!year || !fromMonth || !toMonth) return "Không có dữ liệu";

        const startDate = new Date(year, fromMonth - 1, 1);

        const endDate = new Date(year, toMonth, 0);

        const formatDate = (date) => {
            return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .split("T")[0];
        };

        return `Từ ${formatDate(startDate)} đến ${formatDate(endDate)}`;
    };


    return (
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
                    <div className={css.ruleRatio}>
                        <div>Chênh Lệch:</div>
                        <div>{differenceRatio}%</div>
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
                            <div className={css.sourceBottom}>
                                <div className={css.sourceBottomTitle}>DS Điều kiện:</div>
                                <div className={css.sourceBottomBody}>
                                    {listDieuKienPrimary?.map(dieuKien => (
                                        selectedItem.primarySource.isBaoCao ? (
                                            <div key={dieuKien.id} className={css.conditionItem}>
                                                <div className={css.item_cotDuLieu}>
                                                    <div className={css.item_cotDuLieu_title}>Năm dữ liệu:</div>
                                                    <div className={css.item_cotDuLieu_value}>{dieuKien.year}</div>
                                                </div>
                                                <div className={css.item_dieuKienLoc}>
                                                    <div className={css.item_dieuKienLoc_title}>Công ty chọn:</div>
                                                    <div className={css.item_dieuKienLoc_value}>{dieuKien.company}</div>
                                                </div>
                                                <div className={css.item_giaTriLoc}>
                                                    <div className={css.item_giaTriLoc_title}>Giá trị lọc</div>
                                                    <div className={css.item_giaTriLoc_value}>
                                                        <span>{getFullDateRange(dieuKien.year, dieuKien.fromMonth, dieuKien.toMonth)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={dieuKien.id} className={css.conditionItem}>
                                                <div className={css.item_cotDuLieu}>
                                                    <div className={css.item_cotDuLieu_title}>Cột dữ liệu:</div>
                                                    <div
                                                        className={css.item_cotDuLieu_value}>{dieuKien.cot_du_lieu}</div>
                                                </div>
                                                <div className={css.item_dieuKienLoc}>
                                                    <div className={css.item_dieuKienLoc_title}>Điều kiện lọc:</div>
                                                    <div
                                                        className={css.item_dieuKienLoc_value}>{dieuKien.dieu_kien_loc}</div>
                                                </div>
                                                <div className={css.item_giaTriLoc}>
                                                    <div className={css.item_giaTriLoc_title}>Giá trị lọc</div>
                                                    <div className={css.item_giaTriLoc_value}>
                                                        {Array.isArray(dieuKien?.gia_tri_loc) && dieuKien.gia_tri_loc.length > 1 ? (
                                                            <span>Từ {dieuKien.gia_tri_loc[0]} đến {dieuKien.gia_tri_loc[1]}</span>
                                                        ) : (
                                                            <span>{dieuKien?.gia_tri_loc?.[0] ?? "Không có dữ liệu"}</span>
                                                        )}

                                                    </div>
                                                </div>
                                            </div>
                                        )))
                                    }
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
                            <div className={css.sourceBottom}>
                                <div className={css.sourceBottomTitle}>DS Điều kiện:</div>
                                <div className={css.sourceBottomBody}>
                                    {listDieuKienChecking?.map(dieuKien => (
                                        selectedItem.checkingSource.isBaoCao ? (
                                            <div key={dieuKien.id} className={css.conditionItem}>
                                                <div className={css.item_cotDuLieu}>
                                                    <div className={css.item_cotDuLieu_title}>Năm dữ liệu:</div>
                                                    <div className={css.item_cotDuLieu_value}>{dieuKien.year}</div>
                                                </div>
                                                <div className={css.item_dieuKienLoc}>
                                                    <div className={css.item_dieuKienLoc_title}>Công ty chọn:</div>
                                                    <div className={css.item_dieuKienLoc_value}>{dieuKien.company}</div>
                                                </div>
                                                <div className={css.item_giaTriLoc}>
                                                    <div className={css.item_giaTriLoc_title}>Giá trị lọc</div>
                                                    <div className={css.item_giaTriLoc_value}>
                                                        <span>{getFullDateRange(dieuKien.year, dieuKien.fromMonth, dieuKien.toMonth)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={dieuKien.id} className={css.conditionItem}>
                                                <div className={css.item_cotDuLieu}>
                                                    <div className={css.item_cotDuLieu_title}>Cột dữ liệu:</div>
                                                    <div
                                                        className={css.item_cotDuLieu_value}>{dieuKien.cot_du_lieu}</div>
                                                </div>
                                                <div className={css.item_dieuKienLoc}>
                                                    <div className={css.item_dieuKienLoc_title}>Điều kiện lọc:</div>
                                                    <div
                                                        className={css.item_dieuKienLoc_value}>{dieuKien.dieu_kien_loc}</div>
                                                </div>
                                                <div className={css.item_giaTriLoc}>
                                                    <div className={css.item_giaTriLoc_title}>Giá trị lọc</div>
                                                    <div className={css.item_giaTriLoc_value}>
                                                        {Array.isArray(dieuKien.gia_tri_loc) && dieuKien.gia_tri_loc.length > 0 ? (
                                                            dieuKien.gia_tri_loc.length === 1
                                                                ? dieuKien.gia_tri_loc[0]
                                                                : <span>Từ {dieuKien.gia_tri_loc[0]} đến {dieuKien.gia_tri_loc[1]}</span>
                                                        ) : (
                                                            <span>Không có dữ liệu</span>
                                                        )}

                                                    </div>
                                                </div>
                                            </div>
                                        )))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    {result &&
                        <>
                            <h3>Giá trị chính: {formatCurrency(result.valuePrimary)}</h3>
                            <h3>Giá trị kiểm tra: {formatCurrency(result.valueChecking)}</h3>
                            <h3>Lệch cho phép: {result.difference_ratio}%</h3>
                            <h3>Lệch thực tế: {result.ratio.toFixed(2)}%</h3>
                            <h1>{result.isOK ? 'OK' : 'Lỗi'}</h1>
                        </>
                    }
                </div>
                <div className={css.footer}>
                    <Button onClick={handleChay}>Chạy ngay</Button>
                </div>
            </div>
        </div>
    )
}

export default RuleElement
