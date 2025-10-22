import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, ChevronDown, FileDown } from 'lucide-react';
import { debounce } from 'lodash';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { PdfViewerComponent, Toolbar as PdfToolbar, Magnification, Navigation, LinkAnnotation, BookmarkView, ThumbnailView, Print, Inject as PdfInject } from '@syncfusion/ej2-react-pdfviewer';
import { SpreadsheetComponent } from '@syncfusion/ej2-react-spreadsheet';
import '@syncfusion/ej2-react-pdfviewer/styles/material.css';
import '@syncfusion/ej2-react-spreadsheet/styles/material.css';
import styles from './RightPanel.module.css';
import { toast } from 'react-toastify';
import { updateTabContent } from '../../../../apis/tabContentService';
import UnsavedChangesModal from './UnsavedChangesModal/UnsavedChangesModal';

const RightPanel = ({ selectedItem, categories, onCategoryUpdate, getTabContentData, currentUser }) => {
    const [content, setContent] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [itemName, setItemName] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingSelectedItem, setPendingSelectedItem] = useState(null);
    const dropdownRef = useRef(null);
    const editorRef = useRef(null);
    const pdfViewerRef = useRef(null);
    const spreadsheetRef = useRef(null);

    const modules = {
        toolbar: [
            [
                { 'header': [1, 2, 3, false] },
                'bold',
                'italic',
                'underline',
                'strike',
                { color: [] },
                { background: [] },
                { list: 'ordered' },
                { list: 'bullet' },
                { align: [] },
                { 'indent': '-1' },
                { 'indent': '+1' }
            ],
        ],
        imageResize: {},
        clipboard: {
            matchVisual: true,
        },
    };

    const handleCategoryChange = async (categoryId) => {
        setIsDropdownOpen(false);
        try {
            const updatedItem = {
                ...selectedItem,
                category: categoryId
            };
            await updateTabContent(updatedItem);
            onCategoryUpdate(updatedItem);
            getTabContentData();
        } catch (e) {
            console.error(e);
            toast.error("Lỗi khi cập nhật");
        }
    };

    const handleChange = useCallback((newContent) => {
        setContent(newContent);
        setHasUnsavedChanges(true);
        localStorage.setItem('hasUnsavedChanges', 'true');
    }, []);

    const handleNameChange = (e) => {
        const newName = e.target.value;
        setItemName(newName);
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        if (!selectedItem) return;

        setIsSaving(true);
        try {
            let updatedItem = {}
            if (selectedItem.type === 'doc') {
                updatedItem = {
                    ...selectedItem,
                    content: content,
                    name: itemName
                };
            } else if (selectedItem.type === 'pdf' || selectedItem.type === 'xlsx' || selectedItem.type === 'xls') {
                updatedItem = {
                    ...selectedItem,
                    name: itemName
                };
            }
            await updateTabContent(updatedItem);
            await getTabContentData();
            setHasUnsavedChanges(false);
            localStorage.setItem('hasUnsavedChanges', 'false');
            toast.success("Lưu thành công!");
        } catch (error) {
            console.error('Error saving:', error);
            toast.error("Lỗi khi lưu!");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (hasUnsavedChanges && selectedItem !== pendingSelectedItem) {
            setPendingSelectedItem(selectedItem);
            setShowUnsavedModal(true);
            return;
        }

        if (!hasUnsavedChanges || pendingSelectedItem === selectedItem) {
            setContent(selectedItem.content);
            setItemName(selectedItem.name || '');
            setHasUnsavedChanges(false);
            setPendingSelectedItem(null);
        }
    }, [selectedItem]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    const getCurrentCategoryName = () => {
        if (!selectedItem?.category) return 'Chưa có danh mục';
        const category = categories?.find(c => c.id == selectedItem.category);
        return category?.name || 'Chưa có danh mục';
    };

    const handleExportDoc = () => {
        const content = document.querySelector('.ql-editor');
        if (!content) {
            toast.error("Could not find editor content");
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${itemName || 'document'}</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    h1 { font-size: 16pt; }
                    h2 { font-size: 14pt; }
                    h3 { font-size: 13pt; }
                    h4 { font-size: 12pt; }
                    p { font-size: 12pt; }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
            </html>
        `;

        try {
            const blob = new Blob([htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${itemName || 'document'}.doc`;

            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Document exported successfully");
        } catch (error) {
            console.error('Document export error:', error);
            toast.error("Error exporting document");
        }
    };

    const handleExportPdf = () => {
        if (selectedItem.type === 'pdf') {
            try {
                const url = selectedItem.url || selectedItem.content;
                const link = document.createElement('a');
                link.href = url;
                link.download = `${itemName || 'document'}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success("PDF exported successfully");
            } catch (error) {
                console.error('PDF export error:', error);
                toast.error("Error exporting PDF");
            }
        }
    };

    const handleExportXlsx = () => {
        if (selectedItem.type === 'xlsx' || selectedItem.type === 'xls') {
            try {
                if (selectedItem.content.startsWith('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,')) {
                    const base64Data = selectedItem.content.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });

                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `${itemName || 'document'}.xlsx`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);

                    toast.success("Spreadsheet exported successfully");
                } else if (selectedItem.content.startsWith('http') || selectedItem.content.startsWith('/')) {
                    fetch(selectedItem.content)
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.blob();
                        })
                        .then((blob) => {
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `${itemName || 'document'}.xlsx`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(link.href);

                            toast.success("Spreadsheet exported successfully");
                        })
                        .catch((error) => {
                            console.error('Export error:', error);
                            toast.error("Error exporting spreadsheet");
                        });
                }
            } catch (error) {
                console.error('Spreadsheet export error:', error);
                toast.error("Error exporting spreadsheet");
            }
        }
    };

    const handleSpreadsheetLoad = useCallback(() => {
        if (selectedItem.type !== 'xlsx' && selectedItem.type !== 'xls') return;

        const loadSpreadsheet = () => {
            try {
                if (spreadsheetRef.current) {
                    try {
                        spreadsheetRef.current.sheets = [];
                    } catch (resetError) {
                        console.warn('Could not reset sheets directly', resetError);
                    }
                }

                if (selectedItem.content.startsWith('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,')) {
                    const base64Data = selectedItem.content.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });
                    const file = new File([blob], `${selectedItem.name || 'document'}.xlsx`);

                    if (spreadsheetRef.current) {
                        try {
                            spreadsheetRef.current.open({ file: file });
                        } catch (openError) {
                            console.error('Error opening spreadsheet:', openError);
                            toast.error('Failed to open spreadsheet');
                        }
                    }
                } else if (selectedItem.content.startsWith('http') || selectedItem.content.startsWith('/')) {
                    fetch(selectedItem.content)
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.blob();
                        })
                        .then((blob) => {
                            const file = new File([blob], `${selectedItem.name || 'document'}.xlsx`);
                            if (spreadsheetRef.current) {
                                try {
                                    spreadsheetRef.current.open({ file: file });
                                } catch (openError) {
                                    console.error('Error opening spreadsheet:', openError);
                                    toast.error('Failed to open spreadsheet');
                                }
                            }
                        })
                        .catch((error) => {
                            console.error('Fetch error:', error);
                            toast.error('Error fetching spreadsheet');
                        });
                }
            } catch (error) {
                console.error('Spreadsheet loading error:', error);
                toast.error('Error loading spreadsheet');
            }
        };
        const timeoutId = setTimeout(loadSpreadsheet, 200);

        return () => clearTimeout(timeoutId);
    }, [selectedItem]);

    useEffect(() => {
        if ((selectedItem.type === 'xlsx' || selectedItem.type === 'xls') && spreadsheetRef.current) {
            handleSpreadsheetLoad();
        }
    }, [selectedItem, handleSpreadsheetLoad, spreadsheetRef]);

    const handleModalClose = () => {
        setShowUnsavedModal(false);
        setPendingSelectedItem(null);
    };

    const handleModalConfirm = () => {
        setShowUnsavedModal(false);
        setContent(pendingSelectedItem.content);
        setItemName(pendingSelectedItem.name || '');
        setHasUnsavedChanges(false);
        localStorage.setItem('hasUnsavedChanges', 'false');
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h2 className={styles.title}>{selectedItem.title}</h2>
                        <div className={styles.infoRow}>
                            <input
                                type="text"
                                value={itemName}
                                onChange={handleNameChange}
                                className={styles.nameInput}
                                placeholder="Enter name"
                            />
                            <span className={styles.date}>
                                Tạo lúc: {selectedItem.created_at} - {selectedItem.created_time}
                            </span>
                            {currentUser.isAdmin && (
                                <span className={styles.date}>
                                    Tạo bởi: {selectedItem.userEmail}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <div className={styles.categoryDropdown} ref={dropdownRef}>
                            <button
                                className={styles.dropdownButton}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                {getCurrentCategoryName()}
                                <ChevronDown size={16} className={styles.dropdownIcon} />
                            </button>
                            {isDropdownOpen && (
                                <div className={styles.dropdownContent}>
                                    <div
                                        className={styles.dropdownItem}
                                        onClick={() => handleCategoryChange('')}
                                    >
                                        No category
                                    </div>
                                    {categories?.map(category => (
                                        <div
                                            key={category.id}
                                            className={styles.dropdownItem}
                                            onClick={() => handleCategoryChange(category.id)}
                                        >
                                            {category.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className={styles.saveWrapper}>
                            {isSaving && <Loader2 className={styles.loadingSpinner} size={16} />}
                        </div>
                        <button
                            className={`${styles.saveButton} ${hasUnsavedChanges ? styles.hasChanges : ''}`}
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            Lưu
                        </button>
                        <button
                            className={styles.downloadButton}
                            onClick={() => {
                                if (selectedItem.type === 'doc') {
                                    handleExportDoc();
                                } else if (selectedItem.type === 'pdf') {
                                    handleExportPdf();
                                } else if (selectedItem.type === 'xlsx' || selectedItem.type === 'xls') {
                                    handleExportXlsx();
                                }
                            }}
                        >
                            <FileDown size={14} /> Tải về
                        </button>
                    </div>
                </div>
                <div className={styles.contentEdit}>
                    {selectedItem.type === 'doc' && (
                        <ReactQuill
                            value={content}
                            onChange={handleChange}
                            modules={modules}
                            style={{ height: '87vh' }}
                        />
                    )}
                    {selectedItem.type === 'pdf' && (
                        <PdfViewerComponent
                            ref={pdfViewerRef}
                            documentPath={selectedItem.url || selectedItem.content}
                            serviceUrl="https://ej2services.syncfusion.com/production/web-services/api/pdfviewer"
                            style={{ height: '87vh', width: '100%' }}
                        >
                            <PdfInject services={[PdfToolbar, Magnification, Navigation, LinkAnnotation, BookmarkView, ThumbnailView, Print]} />
                        </PdfViewerComponent>
                    )}
                    {(selectedItem.type === 'xlsx' || selectedItem.type === 'xls') && (
                        <SpreadsheetComponent
                            ref={spreadsheetRef}
                            openUrl="https://ej2services.syncfusion.com/production/web-services/api/spreadsheet/open"
                            height="87vh"
                            created={handleSpreadsheetLoad}
                            allowEditing={false}
                            showToolbar={false}
                            showFormulaBar={false}
                            showRibbon={false}
                        />
                    )}
                </div>
            </div>
            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onClose={handleModalClose}
                onConfirm={handleModalConfirm}
            />
        </>
    );
};

export default RightPanel;