import React, { useState, useEffect } from 'react';
import Sidebar from './SideBar/SideBar.jsx';
import MainContent from './MainContent/MainContent.jsx';
import css from './DataManagement.module.css';
// API
import { getAllCanvasData } from '../../../apis/canvasDataService.jsx';
import { getAllFileNotePad } from '../../../apis/fileNotePadService.jsx';

const DataManagement = ({ isOpen, onClose }) => {
    const [components, setComponents] = useState([]);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [aiDatapacks, setAiDatapacks] = useState([]);

    const departments = ['Sales', 'Marketing', 'Finance', 'BOD'];

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await getAllCanvasData();
                const dataPacks = await getAllFileNotePad();
                const enhancedComponents = response.map(component => ({
                    ...component,
                    aiDatapack: dataPacks.find(pack => pack.id === component.aiDatapackId)?.name || null
                }));
                setAiDatapacks(dataPacks);
                setComponents(enhancedComponents);
                setSelectedComponent(enhancedComponents[0] || null);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        loadData();
    }, []);

    const filteredComponents = components.filter(component => {
        if (!searchTerm) return true;
        const searchString = searchTerm.toLowerCase();
        return (
            component.name?.toLowerCase().includes(searchString) ||
            component.description?.toLowerCase().includes(searchString) ||
            component.departments.some(dept => dept.toLowerCase().includes(searchString))
        );
    });

    useEffect(() => {
        if (filteredComponents.length > 0) {
            if (!selectedComponent || !filteredComponents.some(c => c.id === selectedComponent.id)) {
                setSelectedComponent(filteredComponents[0]);
            }
        } else {
            setSelectedComponent(null);
        }
    }, [searchTerm, components]);

    if (!isOpen) return null;

    return (
        <div className={css.overlay} onClick={onClose}>
            <div className={css.modal} onClick={e => e.stopPropagation()}>
                <Sidebar
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    filteredComponents={filteredComponents}
                    selectedComponent={selectedComponent}
                    onComponentSelect={setSelectedComponent}
                    loadData={() => setSearchTerm('')} // Reset search khi load lại
                />
                <MainContent
                    selectedComponent={selectedComponent}
                    departments={departments}
                    aiDatapacks={aiDatapacks}
                    loadData={() => setSearchTerm('')}
                />
            </div>
        </div>
    );
};

export default DataManagement;
