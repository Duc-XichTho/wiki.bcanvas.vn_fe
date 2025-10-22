import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import css from './SideBar.module.css';
// API
import { createNewCanvasData, updateCanvasData } from '../../../../apis/canvasDataService';
import { getListComponent } from '../../../../generalFunction/logicCanvasComponent/getListComponent.js';
import { Select } from 'antd';

const Sidebar = ({
    searchTerm,
    onSearchChange,
    filteredComponents,
    selectedComponent,
    onComponentSelect,
    loadData
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        note: '',
        aiDatapackId: '',
        departments: {
            sales: false,
            finance: false,
            marketing: false,
            bod: false
        }
    });
    const [typeData, setTypeData] = useState(null);
    const [aiDatapacks, setAiDatapacks] = useState([]);



    const loadDataPack = async () => {
        try {

            const data = await getListComponent(typeData);
            setAiDatapacks(data);

        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    };
    useEffect(() => {

        loadDataPack();
    }, [typeData]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (department) => {
        setFormData(prev => ({
            ...prev,
            departments: {
                ...prev.departments,
                [department]: !prev.departments[department]
            }
        }));
    };

    const handleCreate = async () => {
        const selectedDepartments = Object.entries(formData.departments)
            .filter(([_, isChecked]) => isChecked)
            .map(([dept]) => dept);

        const newData = {
            name: formData.name,
            description: formData.note,
            aiDatapackId: formData.aiDatapackId,
            departments: selectedDepartments
        }

        await createNewCanvasData(newData)
            .then(e=> {
            let code = `${typeData}${e.data.id}`
             updateCanvasData({...e.data, code});
        });

        setIsDialogOpen(false);
        setFormData({
            name: '',
            note: '',
            aiDatapackId: '',
            departments: {
                sales: false,
                finance: false,
                marketing: false,
                bod: false
            }
        });
        loadData();
    };

    const ComponentCard = ({ component, isSelected, onClick }) => (
        <div
            onClick={onClick}
            className={`${css.componentCard} ${isSelected ? css.cardSelected : ''}`}
        >
            <div className={css.cardHeader}>
                <div>
                    <h3 className={css.componentName}>{component.name}</h3>
                    <div className={css.componentId}>{component.code}</div>
                </div>
                <span className={css.aiDatapack}>{component.aiDatapack}</span>
            </div>

            <p className={css.description}>{component.description}</p>

            <div className={css.tagContainer}>
                {component.departments.map(dept => (
                    <span key={dept} className={css.tag}>{dept}</span>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div className={css.leftPanel}>
                <div className={css.panelHeader}>
                    <div className={css.headerTop}>
                        <h2 className={css.title}>Components</h2>
                        <button
                            className={css.iconButton}
                            onClick={() => setIsDialogOpen(true)}
                        >
                            <Plus />
                        </button>
                    </div>

                    <div className={css.searchContainer}>
                        <input
                            type="text"
                            placeholder="Search components..."
                            className={css.searchInput}
                            value={searchTerm}
                            onChange={onSearchChange}
                        />
                        <Search className={css.searchIcon} size={20} />
                    </div>

                    <div className={css.componentList}>
                        {filteredComponents.map(component => (
                            <ComponentCard
                                key={component.code}
                                component={component}
                                isSelected={selectedComponent?.code === component.code}
                                onClick={() => onComponentSelect(component)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {isDialogOpen && (
                <div className={css.modalOverlay}>
                    <div className={css.modal}>
                        <div className={css.modalHeader}>
                            <h2 className={css.modalTitle}>Add New Component</h2>
                            <button
                                className={css.closeButton}
                                onClick={() => setIsDialogOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={css.modalContent}>
                            <div className={css.formGroup}>
                                <label className={css.label}>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={css.input}
                                />
                            </div>

                            <div className={css.formGroup}>
                                <label className={css.label}>Note</label>
                                <input
                                    type="text"
                                    name="note"
                                    value={formData.note}
                                    onChange={handleInputChange}
                                    className={css.input}
                                />
                            </div>

                            <div className={css.formGroup}>
                                <label className={css.label}>Chọn loại dữ liệu</label>
                                <Select
                                    placeholder="Chọn loại dữ liệu"
                                    allowClear
                                    showSearch
                                    value={typeData}
                                    onChange={(value) => setTypeData(value)}
                                    style={{width: "100%", marginBottom: 10}}
                                >
                                    <Select.Option key={'TABLE'} value={'B'}>Báo cáo</Select.Option>
                                    <Select.Option key={'CHART'} value={'C'}>Biểu đồ</Select.Option>
                                    <Select.Option key={'KPI'} value={'KPI'}>KPI</Select.Option>
                                    <Select.Option key={'CT'} value={'ChartTemplate'}>Chart Template</Select.Option>
                                </Select>
                            </div>
                            {typeData &&
                            <div className={css.formGroup}>
                                <label className={css.label}>Data</label>
                                <Select
                                    name="aiDatapackId"
                                    value={formData.aiDatapackId}
                                    onChange={(value) => handleInputChange({ target: { name: 'aiDatapackId', value }})}
                                    placeholder="Select Data"
                                    allowClear
                                    showSearch
                                    style={{width: "100%"}}
                                    optionFilterProp="children"
                                >
                                    {aiDatapacks && aiDatapacks.map(pack => (
                                        <Select.Option key={pack.id} value={pack.id}>
                                            {pack.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>
                            }

                            {/* <div className={css.formGroup}>
                                <label className={css.label}>Used By Departments</label>
                                <div className={css.checkboxGroup}>
                                    {[
                                        ['Sales', 'Sales'],
                                        ['Finance', 'Finance'],
                                        ['Marketing', 'Marketing'],
                                        ['BOD', 'BOD']
                                    ].map(([key, label]) => (
                                        <label key={key} className={css.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={formData.departments[key]}
                                                onChange={() => handleCheckboxChange(key)}
                                                className={css.checkbox}
                                            />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div> */}

                            <button
                                className={css.createButton}
                                onClick={handleCreate}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
