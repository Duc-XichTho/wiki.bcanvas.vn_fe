import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Trash2, Save } from 'lucide-react';
import css from './DKMap.module.css';
// API
import { getAllDinhKhoanMap, createNewDinhKhoanMap, updateDinhKhoanMap, deleteDinhKhoanMap } from '../../../../../../../apis/dinhKhoanMapService';
import { getAllKmf } from '../../../../../../../apis/kmfService';
import { getAllKmtc } from '../../../../../../../apis/kmtcService';
import { getAllBusinessUnit } from '../../../../../../../apis/businessUnitService';
import { getAllTaiKhoan } from '../../../../../../../apis/taiKhoanService';

const TagInput = ({ tags = [], onChange }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            onChange([...tags, inputValue.trim()]);
            setInputValue('');
        }
    };

    return (
        <div className={css.tagInput}>
            {tags.map((tag, index) => (
                <span key={index} className={css.tag}>
                    {tag}
                    <button onClick={() => onChange(tags.filter(t => t !== tag))} className={css.tagRemove}>×</button>
                </span>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={css.tagInputField}
                placeholder="Nhập từ khóa và Enter..."
            />
        </div>
    );
};

const RuleRow = ({ rule, onUpdate, onDelete }) => {
    const [costItems, setCostItems] = useState([]);
    const [cashFlowItems, setCashFlowItems] = useState([]);
    const [BU, setBU] = useState([]);
    const [tempAccount, setTempAccount] = useState([]);

    useEffect(() => {
        loadDropDownData();
    }, []);

    const loadDropDownData = async () => {
        const kmf = await getAllKmf();
        setCostItems([{ code: '*', name: 'Tất cả' }, ...kmf]);

        const kmtc = await getAllKmtc();
        setCashFlowItems([{ code: '*', name: 'Tất cả' }, ...kmtc]);

        const bu = await getAllBusinessUnit();
        setBU([{ code: '*', name: 'Tất cả' }, ...bu]);

        const tk = await getAllTaiKhoan();
        const distinctItems = tk
            .filter((item, index, self) =>
                index === self.findIndex(t => t.code === item.code)
            )
            .map(({ name, code }) => ({ name, code }));
        setTempAccount([{ code: '*', name: 'Tất cả' }, ...distinctItems]);
    }

    const renderDropdown = (value, field, items, placeholder) => (
        <select
            value={value}
            onChange={(e) => onUpdate(rule.id, field, e.target.value)}
            className={css.select}
        >
            <option value="">{placeholder}</option>
            {items.map(item => (
                <option key={item.code} value={item.code}>
                    {item.code === '*' ? 'Tất cả' : `${item.code} - ${item.name}`}
                </option>
            ))}
        </select>
    );

    return (
        <tr className={css.tableRow}>
            <td className={css.tableCell}>
                {renderDropdown(rule.kqkd, 'kqkd', costItems, 'Chọn khoản mục')}
            </td>
            <td className={css.tableCell}>
                {renderDropdown(rule.thuChi, 'thuChi', cashFlowItems, 'Chọn khoản mục')}
            </td>
            <td className={css.tableCell}>
                {renderDropdown(rule.BU, 'BU', BU, 'Chọn đơn vị')}
            </td>
            <td className={css.tableCell}>
                {renderDropdown(rule.tkNo_nhap, 'tkNo_nhap', tempAccount, 'Chọn TK nợ tạm')}
            </td>
            <td className={css.tableCell}>
                {renderDropdown(rule.tkCo_nhap, 'tkCo_nhap', tempAccount, 'Chọn TK có tạm')}
            </td>
            <td className={css.tableCell}>
                <div className={css.amountInputs}>
                    <input
                        type="text"
                        value={rule.giaTri_start}
                        onChange={(e) => onUpdate(rule.id, 'giaTri_start', e.target.value.replace(/[^0-9]/g, ''))}
                        className={css.amountInput}
                        placeholder="Từ"
                    />
                    <input
                        type="text"
                        value={rule.giaTri_end}
                        onChange={(e) => onUpdate(rule.id, 'giaTri_end', e.target.value.replace(/[^0-9]/g, ''))}
                        className={css.amountInput}
                        placeholder="Đến"
                    />
                </div>
            </td>
            <td className={css.tableCell}>
                <TagInput
                    tags={rule.keyword}
                    onChange={(newTags) => onUpdate(rule.id, 'keyword', newTags)}
                />
            </td>
            <td className={css.tableCell}>
                {renderDropdown(rule.tkNo, 'tkNo', tempAccount, 'Chọn TK nợ')}
            </td>
            <td className={css.tableCell}>
                {renderDropdown(rule.tkCo, 'tkCo', tempAccount, 'Chọn TK có')}
            </td>
            <td className={css.tableCell}>
                <button
                    onClick={() => onDelete(rule.id)}
                    className={css.deleteButton}
                >
                    <Trash2 className={css.icon} />
                </button>
            </td>
        </tr>
    );
};

export default function SettingDKMap({ isOpen, onClose }) {
    const [rules, setRules] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const dkMap = await getAllDinhKhoanMap();
            setRules(dkMap);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const addRule = async () => {
        const newRule = {
            kqkd: '',
            thuChi: '',
            BU: '',
            tkNo_nhap: '',
            tkCo_nhap: '',
            giaTri_start: 0,
            giaTri_end: 0,
            keyword: [],
            tkNo: '',
            tkCo: ''
        };
        await createNewDinhKhoanMap(newRule);
        loadData();
    };

    const deleteRule = async (id) => {
        setRules(prev => prev.filter(rule => rule.id !== id));
        await deleteDinhKhoanMap(id);
    };

    const updateRule = async (id, field, value) => {
        await updateDinhKhoanMap({ id, [field]: value });
        loadData();
    };

    return (
        <>
            {isOpen && (
                <div className={css.popupOverlay}>
                    <div className={css.popup}>
                        <div className={css.header}>
                            <h2 className={css.title}>Cài đặt định khoản</h2>
                            <button className={css.closeButton} onClick={onClose}>
                                <X />
                            </button>
                        </div>
                        <div className={css.content}>
                            <div className={css.contentHeader}>
                                <div className={css.headerText}>
                                    <h2 className={css.contentTitle}>Rules Mapping Tài Khoản</h2>
                                    <p className={css.subtitle}>Quản lý quy tắc định khoản tự động</p>
                                </div>
                                <div className={css.buttonGroup}>
                                    <button onClick={addRule} className={css.addButton}>
                                        <PlusCircle className={css.icon} />
                                        Thêm rule
                                    </button>
                                    {/* <button className={css.saveButton}>
                                        <Save className={css.icon} />
                                        Lưu thay đổi
                                    </button> */}
                                </div>
                            </div>

                            <div className={css.tableContainer}>
                                <table className={css.table}>
                                    <thead>
                                        <tr>
                                            <th className={css.tableHeader}>Khoản mục Phí</th>
                                            <th className={css.tableHeader}>Khoản mục thu chi</th>
                                            <th className={css.tableHeader}>Đơn vị</th>
                                            <th className={css.tableHeader}>TK nợ (nháp)</th>
                                            <th className={css.tableHeader}>TK có (nháp)</th>
                                            <th className={css.tableHeader}>Giá trị</th>
                                            <th className={css.tableHeader}>Từ khóa</th>
                                            <th className={css.tableHeader}>TK nợ</th>
                                            <th className={css.tableHeader}>TK có</th>
                                            <th className={css.tableHeader}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rules.length > 0 && rules.map((rule) => (
                                            <RuleRow
                                                key={rule.id}
                                                rule={rule}
                                                onUpdate={updateRule}
                                                onDelete={deleteRule}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}