import { useEffect, useState, useRef } from 'react';
import {
    Clock,
    Tag,
    Search,
    Trash2,
    Filter,
    Files,
    Heart
} from 'lucide-react';
import css from './LeftPanel.module.css'
import { toast } from 'react-toastify';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
// API
import { updateTabContent, createTabContent } from '../../../../apis/tabContentService';
// COMPONENT
import CategoryPopUp from './CategoryPopUp/CategoryPopUp';
import CreateStoragePopup from './CreateStorage/CreateStoragePopup';
// ICON
import { IconAiGen, IconAddFile, IconCreateFile } from '../../../../icon/IconSVG';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const LeftPanel = ({ tabContent, selectedItem, setSelectedItem, categories, getCategoryData, getTabContentData, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showFavorites, setShowFavorites] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [pendingSelectedItem, setPendingSelectedItem] = useState(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    const fileInputRef = useRef(null);

    const handleFileClick = () => {
        fileInputRef.current.click();
    };

    const filteredContent = tabContent.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || item.category == selectedCategory;
        const matchesFavorite = !showFavorites || item.favorite;
        return matchesSearch && matchesCategory && matchesFavorite;
    });

    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id == categoryId);
        return category ? category.name : 'Chưa có danh mục';
    };

    const handleCopy = async (e, item) => {
        e.stopPropagation();
        try {
            const copyData = {
                ...item,
                name: `${item.name} (Copy)`
            };

            delete copyData.id;
            delete copyData.created_at;
            delete copyData.created_time;
            delete copyData.updated_at;
            delete copyData.updated_time;

            await createTabContent(copyData);
            getTabContentData();
            toast.success("Sao chép thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi sao chép!");
        }
    };

    const handleDelete = (e, itemId) => {
        e.stopPropagation();
        setDeleteItemId(itemId);
        setShowDeletePopup(true);
    };

    const handleFavorite = async (e, item) => {
        e.stopPropagation();
        try {
            await updateTabContent({
                id: item.id,
                favorite: !item.favorite
            });
            getTabContentData();
            toast.success(item.favorite ? "Đã bỏ yêu thích!" : "Đã thêm vào yêu thích!");
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi cập nhật trạng thái yêu thích!");
        }
    };

    const toggleFavoriteFilter = () => {
        setShowFavorites(!showFavorites);
    };

    const confirmDelete = async () => {
        try {
            await updateTabContent({ id: deleteItemId, show: false })
            setShowDeletePopup(false);
            setDeleteItemId(null);
            getTabContentData();
            toast.success("Xóa Storage thành công!")
        } catch (e) {
            console.error(e);
            toast.error("Lỗi khi xóa Storage!")
        }
    };

    const cancelDelete = () => {
        setShowDeletePopup(false);
        setDeleteItemId(null);
    };

    const handleSelectItem = (item) => {
        if (selectedItem?.id === item.id) return;

        const hasUnsavedChanges = JSON.parse(localStorage.getItem('hasUnsavedChanges') || 'false');

        if (hasUnsavedChanges) {
            setPendingSelectedItem(item);
            setShowUnsavedModal(true);
        } else {
            setSelectedItem(item);
            localStorage.setItem('selectedTabItem', JSON.stringify(item));
        }
    };

    const handleModalClose = () => {
        setShowUnsavedModal(false);
        setPendingSelectedItem(null);
    };

    const handleModalConfirm = () => {
        setShowUnsavedModal(false);
        setSelectedItem(pendingSelectedItem);
        localStorage.setItem('selectedTabItem', JSON.stringify(pendingSelectedItem));
        localStorage.setItem('hasUnsavedChanges', 'false');
        setPendingSelectedItem(null);
    };

    const handleCreateStorage = async (name) => {
        try {
            await createTabContent({
                name,
                type: 'doc',
                favorite: false,
                aiGen: false,
                userEmail: currentUser.email
            });
            getTabContentData();
            toast.success("Tạo Storage thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tạo Storage!");
        }
    };

    const readFileAsArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    };

    const extractDocContent = async (file) => {
        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            switch (fileExtension) {
                case 'docx':
                    const arrayBuffer = await readFileAsArrayBuffer(file);
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    return result.value;
                case 'doc':
                    return new Promise((resolve, reject) => {
                        try {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const text = e.target.result;
                                resolve(`<div>${text}</div>`);
                            };
                            reader.onerror = reject;
                            reader.readAsText(file, 'UTF-8');
                        } catch (error) {
                            reject(error);
                        }
                    });
                default:
                    throw new Error('Unsupported file type');
            }
        } catch (error) {
            console.error('Content extraction error:', error);
            throw error;
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['doc', 'pdf', 'xls', 'xlsx'];

            if (!allowedExtensions.includes(fileExtension)) {
                toast.error('Chỉ chấp nhận file định dạng .doc, .pdf, .xls và .xlsx');
                event.target.value = '';
                return;
            }

            try {
                let content, type;

                switch (fileExtension) {
                    case 'pdf':
                        const pdfArrayBuffer = await readFileAsArrayBuffer(file);
                        const base64PDF = btoa(
                            new Uint8Array(pdfArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                        );
                        content = `data:application/pdf;base64,${base64PDF}`;
                        type = 'pdf';
                        break;

                    case 'doc':
                        type = 'doc';
                        content = await extractDocContent(file);
                        break;

                    case 'xls':
                    case 'xlsx':
                        const xlsArrayBuffer = await readFileAsArrayBuffer(file);
                        const workbook = XLSX.read(xlsArrayBuffer, { type: 'buffer' });
                        const base64XLS = btoa(
                            new Uint8Array(xlsArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                        );
                        content = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64XLS}`;
                        type = fileExtension;
                        break;

                    default:
                        throw new Error('Unsupported file type');
                }

                await createTabContent({
                    name: file.name,
                    type: type,
                    content: content,
                    favorite: false,
                    aiGen: false,
                    userEmail: currentUser.email,
                });

                getTabContentData();
                toast.success('Tải file lên thành công!');
            } catch (error) {
                console.error('Error uploading file:', error);
                toast.error('Lỗi khi tải file lên!');
            }
        }
        event.target.value = '';
    };

    return (
        <div className={css.containerLeft}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".doc,.docx,.pdf,.xls,.xlsx"
                style={{ display: 'none' }}
            />
            <div className={css.mainContentLeft}>
                <div className={css.header}>
                    <div className={css.filterContainer}>
                        <div className={css.searchFilterWrapper}>
                            <div className={css.searchContainer}>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên..."
                                    className={css.searchInput}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className={css.searchIcon} />
                            </div>
                            <div className={css.categoryFilterContainer}>
                                <select
                                    className={css.categoryFilter}
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">Tất cả</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <Filter className={css.filterIcon} />
                            </div>
                        </div>

                        <div className={css.iconsWrapper}>
                            <Heart
                                className={`${css.headerIcon} ${showFavorites ? css.favoriteActive : ''}`}
                                onClick={toggleFavoriteFilter}
                                fill={showFavorites ? "#ef4444" : "none"}
                                color={showFavorites ? "#ef4444" : "currentColor"}
                            />
                            <img
                                src={IconAddFile}
                                className={css.headerSvgIcon}
                                onClick={handleFileClick}
                            />
                            <img
                                src={IconCreateFile}
                                className={css.headerSvgIcon}
                                onClick={() => setShowCreatePopup(true)}
                            />
                        </div>
                    </div>
                </div>
                <div className={css.itemsList}>
                    {filteredContent.map(item => (
                        <div
                            key={item.id}
                            className={`${css.item} ${!showUnsavedModal && selectedItem?.id === item.id ? css.selectedItem : ''
                                }`}
                            onClick={() => handleSelectItem(item)}
                        >
                            <div className={css.itemContent}>
                                <h1 className={css.itemTitle}>{item.name}</h1>
                                <div className={css.metadataContainer}>
                                    <div className={css.typeColumn}>
                                        {item.aiGen && (
                                            <img src={IconAiGen} className={css.fileIcon} />
                                        )}
                                        <span className={css.metaType}>{item.type}</span>
                                    </div>
                                    <div className={css.categoryColumn}>
                                        <Tag className={css.metaIcon} />
                                        <span className={css.categoryText}>{getCategoryName(item.category)}</span>
                                    </div>
                                    <div className={css.dateColumn}>
                                        <Clock className={css.metaIcon} />
                                        <span>{item.created_at}</span>
                                        <span>{item.created_time}</span>
                                    </div>
                                    <div className={css.actionIcons}>
                                        <Files
                                            className={css.copyIcon}
                                            onClick={(e) => handleCopy(e, item)}
                                        />
                                        <Heart
                                            className={`${css.copyIcon} ${item.favorite ? css.favoriteActive : ''}`}
                                            onClick={(e) => handleFavorite(e, item)}
                                            fill={item.favorite ? "#ef4444" : "none"}
                                            color={item.favorite ? "#ef4444" : "currentColor"}
                                        />
                                        <Trash2 className={css.copyIcon} onClick={(e) => handleDelete(e, item.id)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={css.footer}>
                <div className={css.footerIcons}>
                    <button
                        className={css.iconButton}
                        title="Tag Settings"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Tag size={20} />
                    </button>
                </div>
            </div>
            {isModalOpen && (
                <CategoryPopUp
                    categories={categories}
                    setIsModalOpen={setIsModalOpen}
                    getCategoryData={getCategoryData}
                />
            )}

            <div className={`${css.deletePopup} ${showDeletePopup ? css.show : ''}`}>
                <div className={css.popupContent}>
                    <p className={css.popupMessage}>Bạn có chắc chắn muốn xóa?</p>
                    <div className={css.popupButtons}>
                        <button
                            className={`${css.popupButton} ${css.confirmButton}`}
                            onClick={confirmDelete}
                        >
                            Xác nhận
                        </button>
                        <button
                            className={`${css.popupButton} ${css.cancelButton}`}
                            onClick={cancelDelete}
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            </div>

            <CreateStoragePopup
                isOpen={showCreatePopup}
                onClose={() => setShowCreatePopup(false)}
                onConfirm={handleCreateStorage}
            />

            <div className={`${css.deletePopup} ${showUnsavedModal ? css.show : ''}`}>
                <div className={css.popupContent}>
                    <p className={css.popupMessage}>Bạn có thay đổi chưa được lưu. Bạn có muốn chuyển mà không lưu không?</p>
                    <div className={css.popupButtons}>
                        <button
                            className={`${css.popupButton} ${css.confirmButton}`}
                            onClick={handleModalConfirm}
                        >
                            Rời đi
                        </button>
                        <button
                            className={`${css.popupButton} ${css.cancelButton}`}
                            onClick={handleModalClose}
                        >
                            Ở lại
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeftPanel;