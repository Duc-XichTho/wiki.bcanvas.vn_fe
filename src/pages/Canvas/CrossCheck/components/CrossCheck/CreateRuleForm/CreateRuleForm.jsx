import css from './CreateRuleForm.module.css';
import { v4 as uuidv4 } from 'uuid';
import React, { useState, useEffect, useContext } from 'react';
import { CANVAS_DATA_PACK } from '../../../../../../CONST.js'
import { LIST_FIELD_BC } from '../../../../../../Consts/LIST_FIELD_BC.js'
import { createCrossCheck } from '../../../../../../apis/crossCheckService.jsx'
import { message } from 'antd'
import { getAllTemplateSheetTable, getTemplateColumn } from "../../../../../../apis/templateSettingService.jsx";
import { getFileNotePadByIdController } from "../../../../../../apis/fileNotePadService.jsx";
import { calKQKD } from "../../../../../../generalFunction/calculateDataBaoCao/calKQKD.js";
import { MyContext } from "../../../../../../MyContext.jsx";

const boDuLieu = CANVAS_DATA_PACK
    .filter(item => item.crossCheck === true)
    .map(item => ({
        id: item.id,
        name: item.name,
        value: item.value,
        fields: LIST_FIELD_BC[item.value] || [],
        isBaoCao: true,
        options: item.options
    }));

const CreateRuleForm = ({ toggleResults, setIsOpen }) => {
    const [tenQuyTac, setTenQuyTac] = useState('');
    const [moTa, setMoTa] = useState('');
    const [tables, setTables] = useState(boDuLieu);
    let { loadDataSoKeToan, listCompany, setIsUpdateNoti,isUpdateNoti, } = useContext(MyContext);
    const [selectedOptionMain, setSelectedOptionMain] = useState("");
    const [selectedOptionTest, setSelectedOptionTest] = useState("");
    const [listYear, setListYear] = useState([2023, 2024, 2025]);

    const filteredTablesMain = selectedOptionMain
        ? tables.filter(item => (selectedOptionMain === "Data" ? item.isBaoCao : !item.isBaoCao))
        : tables;


    const filteredTablesTest = selectedOptionTest
        ? tables.filter(item => (selectedOptionTest === "Data" ? item.isBaoCao : !item.isBaoCao))
        : tables;


    async function getAllTemplate() {
        let data = await getAllTemplateSheetTable()
        for (const item of data) {
            let fileNote = await getFileNotePadByIdController(item.fileNote_id);
            item.name = fileNote?.name;
            item.value = 'TEMP_' + item.id;
            item.type = fileNote.table;
            let columns = await getTemplateColumn(item.id);
            item.fields = columns.map(col => {
                let table = { headerName: col.columnName, field: col.columnName, type: col.columnType }
                return table
            });
        }
        data = data.filter(item => item.type === 'Template');
        setTables([...boDuLieu, ...data]);
    }

    useEffect(() => {
        getAllTemplate();
    }, [])

    const [thamSoKiemTra, setThamSoKiemTra] = useState({
        chu_so: '',
        thap_phan: '',
    });

    const [primarySource, setPrimarySource] = useState({
        bo_du_lieu: '',
        cot_du_lieu: '',
        dieu_kien: [],
    });

    const [checkingSource, setCheckingSource] = useState({
        bo_du_lieu: '',
        cot_du_lieu: '',
        dieu_kien: []
    });


    const handleAddDieuKienPrimarySource = () => {
        const newDieuKien = {
            id: uuidv4(),
            cot_du_lieu: '',
            dieu_kien_loc: 'equal_to',
            gia_tri_loc: ['']
        };
        setPrimarySource(prev => ({
            ...prev,
            dieu_kien: [...prev.dieu_kien, newDieuKien]
        }));
    };

    const handleAddDieuKienCheckingSource = () => {
        const newDieuKien = {
            id: uuidv4(),
            cot_du_lieu: '',
            dieu_kien_loc: 'equal_to',
            gia_tri_loc: ['']
        };
        setCheckingSource(prev => ({
            ...prev,
            dieu_kien: [...prev.dieu_kien, newDieuKien]
        }));
    };

    const handleUpdateDieuKien = (sourceType, dieuKienId, field, value) => {
        let type = getTypeOfFields(value);
        const updateSource = sourceType === 'primary' ? setPrimarySource : setCheckingSource;

        updateSource(prev => ({
            ...prev,
            dieu_kien: prev.dieu_kien.map(dk => {
                if (dk.id === dieuKienId) {
                    if (field === 'dieu_kien_loc') {
                        let newDieuKien = {
                            ...dk,
                            [field]: value,
                            gia_tri_loc: value === 'beetween' ? ['', ''] : [''],
                        }
                        if (type) newDieuKien.type = type
                        return newDieuKien;
                    }
                    if (field.startsWith('gia_tri_loc')) {
                        const index = parseInt(field.split('_')[3]);
                        const newGiaTriLoc = [...dk.gia_tri_loc];
                        newGiaTriLoc[index] = value;
                        let newDieuKien = {
                            ...dk,
                            gia_tri_loc: newGiaTriLoc,
                        }
                        if (type) newDieuKien.type = type
                        return newDieuKien;
                    }
                    let newDieuKien = {
                        ...dk,
                        [field]: value,
                    };
                    if (type) newDieuKien.type = type
                    return newDieuKien;
                }
                if (type) dk.type = type
                return dk;
            })
        }));
    };

    const handleRemoveDieuKien = (sourceType, dieuKienId) => {
        const updateSource = sourceType === 'primary' ? setPrimarySource : setCheckingSource;
        updateSource(prev => ({
            ...prev,
            dieu_kien: prev.dieu_kien.filter(dk => dk.id !== dieuKienId)
        }));
    };

    const handleCloseForm = () => {
        setTenQuyTac('');
        setMoTa('');
        setThamSoKiemTra({
            chu_so: '',
            thap_phan: '',
        });
        setPrimarySource({
            bo_du_lieu: '',
            cot_du_lieu: '',
            dieu_kien: []
        });
        setCheckingSource({
            bo_du_lieu: '',
            cot_du_lieu: '',
            dieu_kien: []
        });
        setIsOpen(false)
    };

    const handleSaveRule = async () => {
        try {
            const data = {
                name: tenQuyTac,
                desc: moTa,
                difference_ratio: parseFloat(`${thamSoKiemTra.chu_so}.${thamSoKiemTra.thap_phan}`),
                primarySource: primarySource,
                checkingSource: checkingSource,
                type: 'CrossCheck'
            }
            await createCrossCheck(data)
                .then(res => {
                    message.success('Tạo thành công')
                    setTenQuyTac('');
                    setMoTa('');
                    setThamSoKiemTra({
                        chu_so: '',
                        thap_phan: '',
                    });
                    setPrimarySource({
                        bo_du_lieu: '',
                        cot_du_lieu: '',
                        dieu_kien: []
                    });
                    setCheckingSource({
                        bo_du_lieu: '',
                        cot_du_lieu: '',
                        dieu_kien: []
                    });
                    setIsUpdateNoti(!isUpdateNoti)
                }).catch(err => {
                    message.error('Tạo thất bại')
                })

        } catch (error) {
            console.error('ERROR handleSaveRule:', error);
        }
    }

    function getTypeOfFields(cot_du_lieu) {
        let fields = tables.find(item => item.value === primarySource.bo_du_lieu)?.fields
        let type = fields.find(item => item.field === cot_du_lieu)?.type;
        return type
    }

    const renderDieuKienRows = (sourceType, dieuKienList, availableFields) => {
        return dieuKienList.map(dk => (
            <div key={dk.id} className={css.conditionRow}>
                <select
                    className={css.conditionSelect}
                    value={dk.cot_du_lieu}
                    onChange={(e) => handleUpdateDieuKien(sourceType, dk.id, 'cot_du_lieu', e.target.value)}
                >
                    <option value="">Chọn cột dữ liệu</option>
                    {availableFields?.map(field => (
                        <option key={field.field} value={field.field}>
                            {field.headerName}
                        </option>
                    ))}
                </select>
                <select
                    className={css.conditionSelect}
                    value={dk.dieu_kien_loc}
                    onChange={(e) => handleUpdateDieuKien(sourceType, dk.id, 'dieu_kien_loc', e.target.value)}
                >
                    <option value="equal_to">bằng</option>
                    <option value="different">khác</option>
                    <option value="greater_than">lớn hơn</option>
                    <option value="less_than">nhỏ hơn</option>
                    <option value="beetween">trong khoảng</option>
                </select>
                <input
                    type={dk.type && dk.type === 'date' ? 'datetime-local' : 'text'}
                    className={css.conditionValue}
                    value={dk.gia_tri_loc[0]}
                    onChange={(e) => handleUpdateDieuKien(sourceType, dk.id, 'gia_tri_loc_0', e.target.value)}
                />
                {dk.dieu_kien_loc === 'beetween' && (
                    <>
                        <span className={css.conditionSeparator}>đến</span>
                        <input
                            type={dk.type && dk.type === 'date' ? 'datetime-local' : 'text'}
                            className={css.conditionValue}
                            value={dk.gia_tri_loc[1]}
                            onChange={(e) => handleUpdateDieuKien(sourceType, dk.id, 'gia_tri_loc_1', e.target.value)}
                        />
                    </>
                )}
                <button
                    className={css.removeButton}
                    onClick={() => handleRemoveDieuKien(sourceType, dk.id)}
                >
                    X
                </button>
            </div>
        ));
    };

    const handleSelectChange = (e) => {
        const selectedValue = e.target.value;
        const selectedItem = filteredTablesMain.find(item => item.value === selectedValue);

        setPrimarySource(prevState => ({
            ...prevState,
            bo_du_lieu: selectedValue,
            isBaoCao: selectedItem ? selectedItem.isBaoCao : false,
        }));
    };

    const handleSelectChangeCheckSource = (e) => {
        const selectedValue = e.target.value;
        const selectedItem = filteredTablesTest.find(item => item.value === selectedValue);

        setCheckingSource(prevState => ({
            ...prevState,
            bo_du_lieu: selectedValue,
            isBaoCao: selectedItem ? selectedItem.isBaoCao : false,
        }));
    };

    const handleConditionChange = (field, value) => {
        setPrimarySource(prev => {
            const updatedConditions = prev.dieu_kien?.[0] || {}; // Lấy object đầu tiên hoặc tạo mới
            return {
                ...prev,
                dieu_kien: [{ ...updatedConditions, [field]: value }]
            };
        });
    };

    const handleConditionCheckingSourceChange = (field, value) => {
        setCheckingSource(prev => {
            const updatedConditions = prev.dieu_kien?.[0] || {}; // Lấy object đầu tiên hoặc tạo mới
            return {
                ...prev,
                dieu_kien: [{ ...updatedConditions, [field]: value }]
            };
        });
    };



    return (
        <div className={css.formContainer}>
            <div className={css.section}>
                <h2 className={css.sectionTitle}>Thông Tin Quy Tắc</h2>
                <div className={css.formRow}>
                    <div className={css.formGroup}>
                        <label>Tên Quy Tắc:</label>
                        <input
                            type="text"
                            value={tenQuyTac}
                            onChange={(e) => setTenQuyTac(e.target.value)}
                            placeholder="Nhập tên quy tắc"
                        />
                    </div>
                </div>
                <div className={css.formRow}>
                    <div className={css.formGroup}>
                        <label>Mô Tả:</label>
                        <input
                            type="text"
                            value={moTa}
                            onChange={(e) => setMoTa(e.target.value)}
                            placeholder="Mô tả ngắn về quy tắc kiểm tra"
                        />
                    </div>
                </div>
            </div>

            <div className={css.section}>
                <h2 className={css.sectionTitle}>Tham Số Kiểm Tra</h2>
                <div className={css.formRow}>
                    <div className={css.formGroup}>
                        <label>Ngưỡng Chênh Lệch Cho Phép (%):</label>
                        <div className={css.formGroupRatio}>
                            <input
                                type="text"
                                style={{ width: '100px' }}
                                placeholder="0"
                                maxLength="5"
                                value={thamSoKiemTra.chu_so}
                                onChange={(e) => setThamSoKiemTra(prev => ({ ...prev, chu_so: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            <span>.</span>
                            <input
                                type="text"
                                style={{ width: '100px' }}
                                placeholder="00"
                                maxLength="2"
                                value={thamSoKiemTra.thap_phan}
                                onChange={(e) => setThamSoKiemTra(prev => ({ ...prev, thap_phan: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            <span>%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={css.section}>
                <div className={css.sectionTitleWrapper}>
                    <h2 className={css.sectionTitle}>Dữ liệu chuẩn (Master Data)</h2>
                    <select
                        className={css.selectBox}
                        value={selectedOptionMain}
                        onChange={(e) => setSelectedOptionMain(e.target.value)}
                    >
                        <option value="">-- Chọn loại dữ liệu --</option>
                        <option value="Data">Báo cáo</option>
                        <option value="Template">Template</option>
                    </select>

                </div>
                <div className={css.formRow}>
                    <div className={css.formGroup}>
                        <label>Bộ Dữ Liệu:</label>
                        <select value={primarySource.bo_du_lieu} onChange={handleSelectChange}>
                            <option value="">Chọn dạng search filter</option>
                            {filteredTablesMain.map(item => (
                                <option value={item.value}>{item.name}</option>
                            ))}
                        </select>
                    </div>

                    {primarySource.isBaoCao != true && primarySource.bo_du_lieu !== '' && (
                        <div className={css.formGroup}>
                            <label>Cột Dữ Liệu:</label>
                            <select
                                value={primarySource.cot_du_lieu}
                                onChange={(e) => setPrimarySource({ ...primarySource, cot_du_lieu: e.target.value })}
                            >
                                <option value="">Chọn cột dữ liệu</option>
                                {filteredTablesMain
                                    .find(item => item.value === primarySource.bo_du_lieu)?.fields
                                    .map(field => (
                                        <option key={field.field} value={field.field}>
                                            {field.headerName}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    )}

                    {primarySource.isBaoCao == true && primarySource.bo_du_lieu && (
                        <>
                            <div className={css.formGroup}>
                                <label>Loại Dữ Liệu:</label>
                                <select
                                    value={primarySource?.options}
                                    onChange={(e) => setPrimarySource({ ...primarySource, cot_du_lieu: e.target.value })}
                                >
                                    <option value="">Chọn loại dữ liệu</option>
                                    {filteredTablesMain.find(item => item.value === primarySource.bo_du_lieu)?.options?.map(field => (
                                        <option key={field.value} value={field.value}>
                                            {field.label}
                                        </option>
                                    ))
                                    }
                                </select>
                            </div>

                            <div className={css.formGroup}>
                                <label>Chọn công ty:</label>
                                <select value={primarySource.dieu_kien?.[0]?.company || ""}
                                    onChange={(e) => handleConditionChange("company", e.target.value)}>
                                    <option value="">Chọn công ty</option>
                                    {listCompany.map(item => (
                                        <option key={item.code} value={item.code}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={css.formGroup}>
                                <label>Chọn năm:</label>
                                <select value={primarySource.dieu_kien?.[0]?.year || ""}
                                    onChange={(e) => handleConditionChange("year", e.target.value)}>
                                    <option value="">Chọn năm</option>
                                    {listYear.map(item => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={css.formGroup}>
                                <label>Chọn khoảng tháng:</label>
                                <div className={css.monthRange}>
                                    <select value={primarySource.dieu_kien?.[0]?.fromMonth || ""}
                                        onChange={(e) => handleConditionChange("fromMonth", e.target.value)}>
                                        <option value="">Từ tháng</option>
                                        {[...Array(12).keys()].map(i => (
                                            <option key={i + 1} value={i + 1}>
                                                Tháng {i + 1}
                                            </option>
                                        ))}
                                    </select>

                                    <span> - </span>

                                    <select value={primarySource.dieu_kien?.[0]?.toMonth || ""}
                                        onChange={(e) => handleConditionChange("toMonth", e.target.value)}>
                                        <option value="">Đến tháng</option>
                                        {[...Array(12).keys()].map(i => (
                                            <option key={i + 1} value={i + 1}
                                                disabled={primarySource.dieu_kien?.[0]?.fromMonth && i + 1 < primarySource.dieu_kien[0].fromMonth}>
                                                Tháng {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {primarySource.isBaoCao != true && primarySource.bo_du_lieu !== '' && (
                    <div className={css.conditionsContainer}>
                        <label className={css.conditionsLabel}>Điều Kiện:</label>
                        {renderDieuKienRows('primary', primarySource.dieu_kien,
                            tables.find(item => item.value === primarySource.bo_du_lieu)?.fields)}
                        <button className={css.addButton} onClick={handleAddDieuKienPrimarySource}>
                            + Thêm Điều Kiện
                        </button>
                    </div>
                )}
            </div>

            <div className={css.section}>
                <div className={css.sectionTitleWrapper}>
                    <h2 className={css.sectionTitle}>Dữ liệu cần kiểm soát làm sạch</h2>
                    <select
                        className={css.selectBox}
                        value={selectedOptionTest}
                        onChange={(e) => setSelectedOptionTest(e.target.value)}
                    >
                        <option value="">-- Chọn loại dữ liệu --</option>
                        <option value="Data">Báo cáo</option>
                        <option value="Template">Template</option>
                    </select>
                </div>
                <div className={css.formRow}>
                    <div className={css.formGroup}>
                        <label>Bộ Dữ Liệu:</label>
                        <select value={checkingSource.bo_du_lieu} onChange={handleSelectChangeCheckSource}>
                            <option value="">Chọn dạng search filter</option>
                            {filteredTablesTest.map(item => (
                                <option key={item.value} value={item.value}>{item.name}</option>
                            ))}
                        </select>
                    </div>

                    {checkingSource.isBaoCao != true && checkingSource.bo_du_lieu !== '' && (
                        <div className={css.formGroup}>
                            <label>Cột Dữ Liệu:</label>
                            <select
                                value={checkingSource.cot_du_lieu}
                                onChange={(e) => setCheckingSource({ ...checkingSource, cot_du_lieu: e.target.value })}
                            >
                                <option value="">Chọn cột dữ liệu</option>
                                {filteredTablesTest.find(item => item.value === checkingSource.bo_du_lieu)?.fields.map(field => (
                                    <option key={field.field} value={field.field}>{field.headerName}</option>))}
                            </select>
                        </div>
                    )}
                    {checkingSource.isBaoCao == true && checkingSource.bo_du_lieu && (
                        <>
                            <div className={css.formGroup}>
                                <label>Loại Dữ Liệu:</label>
                                <select
                                    value={checkingSource?.options}
                                    onChange={(e) => setCheckingSource({ ...checkingSource, cot_du_lieu: e.target.value })}
                                >
                                    <option value="">Chọn loại dữ liệu</option>
                                    {filteredTablesTest.find(item => item.value === checkingSource.bo_du_lieu)?.options?.map(field => (
                                        <option key={field.value} value={field.value}>
                                            {field.label}
                                        </option>
                                    ))
                                    }
                                </select>
                            </div>

                            <div className={css.formGroup}>
                                <label>Chọn công ty:</label>
                                <select value={checkingSource.dieu_kien?.[0]?.company || ""}
                                    onChange={(e) => handleConditionCheckingSourceChange("company", e.target.value)}>
                                    <option value="">Chọn công ty</option>
                                    {listCompany.map(item => (
                                        <option key={item.code} value={item.code}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={css.formGroup}>
                                <label>Chọn năm:</label>
                                <select value={checkingSource.dieu_kien?.[0]?.year || ""}
                                    onChange={(e) => handleConditionCheckingSourceChange("year", e.target.value)}>
                                    <option value="">Chọn năm</option>
                                    {listYear.map(item => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={css.formGroup}>
                                <label>Chọn khoảng tháng:</label>
                                <div className={css.monthRange}>
                                    <select value={checkingSource.dieu_kien?.[0]?.fromMonth || ""}
                                        onChange={(e) => handleConditionCheckingSourceChange("fromMonth", e.target.value)}>
                                        <option value="">Từ tháng</option>
                                        {[...Array(12).keys()].map(i => (
                                            <option key={i + 1} value={i + 1}>
                                                Tháng {i + 1}
                                            </option>
                                        ))}
                                    </select>

                                    <span> - </span>

                                    <select value={checkingSource.dieu_kien?.[0]?.toMonth || ""}
                                        onChange={(e) => handleConditionCheckingSourceChange("toMonth", e.target.value)}>
                                        <option value="">Đến tháng</option>
                                        {[...Array(12).keys()].map(i => (
                                            <option key={i + 1} value={i + 1}
                                                disabled={checkingSource.dieu_kien?.[0]?.fromMonth && i + 1 < checkingSource.dieu_kien[0].fromMonth}>
                                                Tháng {i + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                        </>
                    )}
                </div>
                {checkingSource.isBaoCao != true && checkingSource.bo_du_lieu !== '' && (
                    <div className={css.conditionsContainer}>
                        <label className={css.conditionsLabel}>Điều Kiện:</label>
                        {renderDieuKienRows('checking', checkingSource.dieu_kien,
                            tables.find(item => item.value === checkingSource.bo_du_lieu)?.fields)}
                        <button className={css.addButton} onClick={handleAddDieuKienCheckingSource}>
                            + Thêm Điều Kiện
                        </button>
                    </div>
                )}
            </div>

            <div className={css.actionButtons}>
                <button onClick={handleSaveRule} className={css.primaryButton}>Tạo</button>
                <button onClick={handleCloseForm} className={css.secondaryButton}>Hủy</button>
                {/*<button className={css.warningButton} onClick={toggleResults}>Chạy Ngay</button>*/}
                <button className={css.warningButton} onClick={() => {
                    loadDataSoKeToan().then(data => {
                        calKQKD(data, listCompany.map(e => e.code))
                    })
                }}>Load Data
                </button>
            </div>
            {/*<ViewVarBC/>*/}
        </div>
    );
}

export default CreateRuleForm;
