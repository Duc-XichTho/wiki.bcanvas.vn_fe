import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Button, Input, Select, Checkbox } from 'antd';
import css from './AddKHKDElementModal.module.css';
import { getSettingByType } from '../../../apis/settingService.jsx';
import { getTemplateRow } from '../../../apis/templateSettingService.jsx';
import { log } from 'mathjs';

const { Option } = Select;

const AddKHKDElementModal = ({
                                 isVisible,
                                 onClose,
                                 formData,
                                 onInputChange,
                                 onSave,
                                 isEditing,
                                 khkdListElement
                             }) => {
    const [boPhanOptions, setBoPhanOptions] = useState([]);
    const [dataTemplate, setDataTemplate] = useState([]);
    const [phanLoaiSetting, setPhanLoaiSetting] = useState([]);
    const [khoanMucSetting, setKhoanMucSetting] = useState([]);
    const [khoanMucOptions, setKhoanMucOptions] = useState([]);

    const fetchKHKDSettings = useCallback(async () => {
        try {
            const response = await getSettingByType("KHKD");
            if (response?.setting) {
                return response.setting;
            } else {
                throw new Error("No KHKD settings found.");
            }
        } catch (error) {
            console.error("Error fetching KHKD settings:", error);
            throw error;
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (isVisible) {
                try {
                    const settings = await fetchKHKDSettings();
                    const { boPhan, khoanMuc, phanLoai } = settings;
                    setPhanLoaiSetting(phanLoai)
                    setKhoanMucSetting(khoanMuc)
                    const boPhanDataResponse = await getTemplateRow(boPhan.templateId);
                    const boPhanData = boPhanDataResponse.rows || [];
                    const filteredBoPhan = boPhanData.map(row => row.data[boPhan.columnName]);
                    setBoPhanOptions(filteredBoPhan);

                    const khoanMucDataResponse = await getTemplateRow(khoanMuc.templateId);
                    const khoanMucData = khoanMucDataResponse.rows || [];
                    setDataTemplate(khoanMucData.map(row => row.data));
                    const filteredKhoanMuc = khoanMucData.map(row => row.data[khoanMuc.columnName]);
                    setKhoanMucOptions(filteredKhoanMuc);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        };

        fetchData();
    }, [isVisible, fetchKHKDSettings]);

    return (
        <Modal
            title={isEditing ? 'Sửa mục' : 'Thêm mục'}
            open={isVisible}
            onCancel={onClose}
            footer={null}
        >
            <div className={css.addItemForm}>
                <div className={css.formGroup}>
                    <label>Tên:</label>
                    <Input
                        placeholder="Nhập tên"
                        value={formData.name}
                        onChange={(e) => onInputChange('name', e.target.value)}
                    />
                </div>

                <div className={css.formGroup}>
                    <label>Khoản mục:</label>
                    <Select
                        placeholder="Chọn khoản mục"
                        style={{ width: '100%' }}
                        value={formData.khoanMuc}
                        onChange={(value) => {
                            onInputChange('khoanMuc', value === 'khongchon' ? "Không chọn" : value);
                            let km = dataTemplate.find(e => e[khoanMucSetting.columnName] === value)
                            if (km && phanLoaiSetting && phanLoaiSetting.columnName) {
                                onInputChange('phanLoai', km[phanLoaiSetting.columnName])
                            }
                        }}
                    >
                        {khoanMucOptions.map((option, index) => (
                            <Option key={index} value={option}>
                                {option}
                            </Option>
                        ))}
                    </Select>
                </div>

                <div className={css.formGroup}>
                    <label>Bộ phận:</label>
                    <Select
                        placeholder="Chọn bộ phận"
                        style={{ width: '100%' }}
                        value={formData.boPhan}
                        onChange={(value) => onInputChange('boPhan', value)}
                    >
                        {boPhanOptions.map((option, index) => (
                            <Option key={index} value={option}>
                                {option}
                            </Option>
                        ))}
                    </Select>
                </div>

                <div className={css.formGroup}>
                    <label>Tên đo lường:</label>
                    <Input
                        placeholder="Nhập tên đo lường"
                        value={formData.labelSoLuong}
                        onChange={(e) => onInputChange('labelSoLuong', e.target.value)}
                    />
                </div>

                <div className={css.formGroup}>
                    <label>Phân loại:</label>
                    <Input
                        placeholder="Nhập phân loại"
                        value={formData.phanLoai}
                        onChange={(e) => onInputChange('phanLoai', e.target.value)}
                    />
                </div>
                <div className={css.formGroup}>
                    <Checkbox
                        checked={formData.isPercentFormula}
                        onChange={(e) => {
                                onInputChange('isPercentFormula', e.target.checked);
                        }}
                    >
                        Tỷ lệ
                    </Checkbox>
                </div>
                {formData.isPercentFormula && (
                    <div className={css.formGroup}>
                        <label>Chọn các mục để tính tỷ lệ:</label>
                        <Select
                            mode="multiple"
                            placeholder="Chọn các mục"
                            style={{ width: '100%' }}
                            value={formData.percentFormula || []}
                            onChange={(value) => onInputChange('percentFormula', value)}
                        >
                            {khkdListElement.filter(e => e.khoanMuc).map((element) => (
                                <Option key={element.id} value={element.id}>
                                    {element.name}
                                </Option>
                            ))}
                        </Select>
                        {isEditing && Array.isArray(formData.percentFormula) && formData.percentFormula.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <b>Các mục đã chọn:</b>
                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                    {formData.percentFormula.map(id => {
                                        const found = khkdListElement.find(e => e.id === id);
                                        return found ? (
                                            <li key={id}>{found.name}</li>
                                        ) : null;
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className={css.formGroup}>
                    <Checkbox
                        checked={formData.theoDoi}
                        onChange={(e) => onInputChange('theoDoi', e.target.checked)}
                    >
                        Theo dõi
                    </Checkbox>
                </div>

                {/* <div className={css.formGroup}>
                    <Checkbox
                        checked={formData.theoDoiDG}
                        onChange={(e) => onInputChange('theoDoiDG', e.target.checked)}
                    >
                        Theo dõi đơn giá
                    </Checkbox>
                </div> */}

                <div className={css.modalActions}>
                    <Button type="primary" onClick={onSave}>
                        Lưu
                    </Button>
                    <Button onClick={onClose}>Hủy</Button>
                </div>
            </div>
        </Modal>
    );
};

export default AddKHKDElementModal;
