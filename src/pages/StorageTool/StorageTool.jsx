import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Upload, Button, message, Modal, Input, List, Dropdown, Menu, Popconfirm, Checkbox } from 'antd';
import { 
    UploadOutlined, 
    PlusOutlined, 
    DeleteOutlined,
    FileTextOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FileExcelOutlined,
    FileWordOutlined,
    FilePptOutlined,
    FileZipOutlined,
    FileOutlined,
    VideoCameraOutlined,
    AudioOutlined,
    DatabaseOutlined,
    CodeOutlined,
    FileMarkdownOutlined,
    FileExcelFilled,
    FileWordFilled,
    FilePptFilled,
    FilePdfFilled,
    FileImageFilled,
    FileZipFilled,
    VideoCameraFilled,
    AudioFilled,
    DatabaseFilled,
    CodeFilled,
    DownloadOutlined,
    CopyOutlined,
    CheckSquareOutlined,
    BorderOutlined
} from '@ant-design/icons';
import './StorageTool.css';
import { useStorage } from '../../hooks/useStorage.js';
import JSZip from 'jszip';

const StorageTool = () => {
    // Simple global decode queue to avoid decoding too many images at once
    const decodeQueueRef = useRef({ active: 0, queue: [] });
    const MAX_CONCURRENT_DECODES = 6;

    const scheduleDecode = (imgEl, targetSrc) => {
        return new Promise((resolve) => {
            const task = async () => {
                try {
                    imgEl.src = targetSrc;
                    if (imgEl.decode) {
                        await imgEl.decode();
                    }
                } catch (_) {
                    // ignore decode errors; browser will still render
                } finally {
                    decodeQueueRef.current.active -= 1;
                    const next = decodeQueueRef.current.queue.shift();
                    if (next) {
                        decodeQueueRef.current.active += 1;
                        next();
                    }
                    resolve();
                }
            };
            if (decodeQueueRef.current.active < MAX_CONCURRENT_DECODES) {
                decodeQueueRef.current.active += 1;
                task();
            } else {
                decodeQueueRef.current.queue.push(task);
            }
        });
    };

    const LazyImage = ({ src, alt, className, onError, style, width, height }) => {
        const imgRef = useRef(null);
        const [isInView, setIsInView] = useState(false);
        const [isLoaded, setIsLoaded] = useState(false);

        useEffect(() => {
            const el = imgRef.current;
            if (!el) return;
            if ('loading' in HTMLImageElement.prototype) {
                // Native lazy-load supported; still set src when in view for fewer requests
            }
            const observer = new IntersectionObserver(
                (entries, obs) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            setIsInView(true);
                            obs.disconnect();
                        }
                    });
                },
                { rootMargin: '200px' }
            );
            observer.observe(el);
            return () => observer.disconnect();
        }, []);

        useEffect(() => {
            const el = imgRef.current;
            if (!el || !isInView || isLoaded || !src) return;
            let cancelled = false;
            scheduleDecode(el, src).then(() => {
                if (!cancelled) setIsLoaded(true);
            });
            return () => { cancelled = true; };
        }, [isInView, isLoaded, src]);

        return (
            <img
                ref={imgRef}
                src={isInView && isLoaded ? src : undefined}
                alt={alt}
                className={className}
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                style={style}
                onError={onError}
                width={width}
                height={height}
            />
        );
    };

    const [currentPath, setCurrentPath] = useState('/');
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [allFiles, setAllFiles] = useState([]);
    const [allFolders, setAllFolders] = useState([]);
    const [displayFiles, setDisplayFiles] = useState([]);
    const [displayFolders, setDisplayFolders] = useState([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadModal, setUploadModal] = useState({ visible: false, files: [], uploading: false });
    const [previewSidebar, setPreviewSidebar] = useState({ visible: false, file: null });
    const fileInputRef = useRef(null);

    // Use custom hook for storage management
    const {
        files,
        folders,
        allFolders: breadcrumbFolders,
        loading,
        error,
        uploadFiles: uploadFilesToStorage,
        createFolder: createNewFolder,
        deleteItems,
        fetchAllFolders
    } = useStorage(currentFolderId);

    // Fetch all folders on mount
    useEffect(() => {
        fetchAllFolders();
    }, [fetchAllFolders]);

    // Update all files and folders when data changes
    useEffect(() => {
        setAllFiles(files);
    }, [files]);

    useEffect(() => {
        setAllFolders(folders);
    }, [folders]);

    // Build breadcrumb from folder hierarchy - memoized
    const buildBreadcrumb = useCallback((folderId, allFolders) => {
        if (!folderId) return [];
        
        const breadcrumb = [];
        let currentFolderId = folderId;
        
        while (currentFolderId) {
            const folder = allFolders.find(f => f.id === currentFolderId);
            if (folder) {
                breadcrumb.unshift(folder); // Add to beginning
                currentFolderId = folder.parentId;
            } else {
                break;
            }
        }
        
        return breadcrumb;
    }, []);

    // Build breadcrumb when currentFolderId or breadcrumbFolders change - memoized
    const breadcrumbFoldersList = useMemo(() => {
        return buildBreadcrumb(currentFolderId, breadcrumbFolders);
    }, [currentFolderId, breadcrumbFolders, buildBreadcrumb]);

    // Local search function
    const performLocalSearch = useCallback((term) => {
        if (!term.trim()) {
            // When no search term, show files and folders from current folder
            return { files: files, folders: folders };
        }
        
        const searchLower = term.toLowerCase();
        const filteredFiles = allFiles.filter(file => 
            file.name.toLowerCase().includes(searchLower) ||
            file.originalName?.toLowerCase().includes(searchLower) ||
            file.fileType?.toLowerCase().includes(searchLower)
        );
        const filteredFolders = allFolders.filter(folder => 
            folder.name.toLowerCase().includes(searchLower)
        );
        
        return { files: filteredFiles, folders: filteredFolders };
    }, [allFiles, allFolders, files, folders]);

    // Handle search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const { files: searchFiles, folders: searchFolders } = performLocalSearch(searchTerm);
            setDisplayFiles(searchFiles);
            setDisplayFolders(searchFolders);
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchTerm, performLocalSearch]);

    // Update display files and folders when data changes
    useEffect(() => {
        setDisplayFiles(files);
        setDisplayFolders(folders);
    }, [files, folders]);


    // Handle file upload modal
    const handleOpenUploadModal = () => {
        setUploadModal({ visible: true, files: [], uploading: false });
    };

    // Handle file upload from modal
    const handleFileUpload = ({ fileList }) => {
        const allFiles = fileList
            .filter(file => file.originFileObj)
            .map(file => file.originFileObj);

        if (allFiles.length > 0) {
            setUploadModal(prev => ({
                ...prev,
                files: allFiles
            }));
        }
    };

    // Handle upload confirmation
    const handleUploadConfirm = async () => {
        if (uploadModal.files.length === 0) {
            message.warning('Vui lòng chọn ít nhất một file');
            return;
        }

        setUploadModal(prev => ({ ...prev, uploading: true }));

        try {
            const result = await uploadFilesToStorage(uploadModal.files, 'current_user');
            message.success(`Đã tải lên thành công ${uploadModal.files.length} file(s)`);
            setUploadModal({ visible: false, files: [], uploading: false });
        } catch (error) {
            console.error('Error uploading files:', error);
            message.error('Lỗi khi tải lên file');
        } finally {
            setUploadModal(prev => ({ ...prev, uploading: false }));
        }
    };

    // Handle create folder
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const folderData = {
                name: newFolderName.trim(),
                parentId: currentFolderId || null,
                user_create: 'current_user'
            };

            await createNewFolder(folderData);

            setNewFolderName('');
            setShowCreateFolderModal(false);
            message.success(`Folder "${newFolderName}" created successfully!`);
        } catch (error) {
            console.error('Error creating folder:', error);
            message.error('Error creating folder');
        }
    };

    // Handle folder navigation - memoized
    const handleFolderClick = useCallback((folder) => {
        setCurrentFolderId(folder.id);
        setCurrentPath(prev => prev + folder.name + '/');
    }, []);

    // Handle back navigation - memoized
    const handleBackClick = useCallback(() => {
        if (currentFolderId) {
            // Find current folder to get its parent
            const currentFolder = allFolders.find(folder => folder.id === currentFolderId);
            if (currentFolder && currentFolder.parentId) {
                // Go to parent folder
                setCurrentFolderId(currentFolder.parentId);
                // Update path by removing the last folder name
                setCurrentPath(prev => {
                    const pathParts = prev.split('/').filter(part => part);
                    pathParts.pop();
                    return '/' + pathParts.join('/') + '/';
                });
            } else {
                // Go to root
                setCurrentFolderId(null);
                setCurrentPath('/');
            }
        }
    }, [currentFolderId, allFolders]);

    // Handle file preview - show sidebar - memoized
    const handleFilePreview = useCallback((file) => {
        setPreviewSidebar({ visible: true, file });
    }, []);

    // Handle file download - memoized
    const handleFileDownload = useCallback((file) => {
        const link = document.createElement('a');
        link.href = file.fileUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    // Handle copy link to clipboard - memoized
    const handleCopyLink = useCallback(async (file) => {
        try {
            await navigator.clipboard.writeText(file.fileUrl);
            message.success('Link copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = file.fileUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            message.success('Link copied to clipboard!');
        }
    }, []);

    // Handle file selection for multi-select - memoized
    const handleFileSelect = useCallback((file, checked) => {
        if (checked) {
            setSelectedFiles(prev => [...prev, file]);
        } else {
            setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
        }
    }, []);

    // Handle select all files - memoized
    const handleSelectAllFiles = useCallback((checked) => {
        if (checked) {
            setSelectedFiles([...displayFiles]);
        } else {
            setSelectedFiles([]);
        }
    }, [displayFiles]);

    // Handle download selected files as zip - memoized
    const handleDownloadZip = useCallback(async () => {
        if (selectedFiles.length === 0) {
            message.warning('Please select files to download');
            return;
        }

        try {
            message.loading('Creating zip file...', 0);
            const zip = new JSZip();
            
            // Download each file and add to zip
            for (const file of selectedFiles) {
                try {
                    const response = await fetch(file.fileUrl);
                    const blob = await response.blob();
                    zip.file(file.originalName || file.name, blob);
                } catch (error) {
                    console.error(`Error downloading file ${file.name}:`, error);
                    message.error(`Failed to download ${file.name}`);
                }
            }

            // Generate zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `files_${new Date().getTime()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            message.destroy();
            message.success(`Downloaded ${selectedFiles.length} files as zip`);
            setSelectedFiles([]);
        } catch (error) {
            message.destroy();
            console.error('Error creating zip:', error);
            message.error('Failed to create zip file');
        }
    }, [selectedFiles]);

    // Clear selected files - memoized
    const clearSelectedFiles = useCallback(() => {
        setSelectedFiles([]);
    }, []);

    // Toggle multi-select mode - memoized
    const toggleMultiSelectMode = useCallback(() => {
        setIsMultiSelectMode(prev => !prev);
        // Clear selection when switching modes
        setSelectedFiles([]);
    }, []);

    // Close preview sidebar - memoized
    const closePreviewSidebar = useCallback(() => {
        setPreviewSidebar({ visible: false, file: null });
    }, []);


    // Handle delete file
    const handleDeleteFile = async (file) => {
        try {
            // Delete from cloud storage
            const response = await fetch('/api/deleteFile', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    fileKey: file.fileKey,
                    fileUrl: file.fileUrl
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete file from cloud');
            }

            // Delete from database
            await deleteItems([file.id], 'file');
            message.success('File deleted successfully');
        } catch (error) {
            console.error('Error deleting file:', error);
            message.error('Failed to delete file');
        }
    };

    // Handle delete folder
    const handleDeleteFolder = async (folder) => {
        try {
            // Delete from database (this will also delete all files in the folder)
            await deleteItems([folder.id], 'folder');
            message.success('Folder deleted successfully');
        } catch (error) {
            console.error('Error deleting folder:', error);
            message.error('Failed to delete folder');
        }
    };

    // Create context menu items - memoized
    const getContextMenuItems = useCallback((item, type) => {
        const items = [];
        
        // Add copy link for files only
        if (type === 'file') {
            items.push({
                key: 'copy-link',
                label: 'Copy Link',
                icon: <CopyOutlined />,
                onClick: () => handleCopyLink(item)
            });
        }
        
        // Add delete with popconfirm
        items.push({
            key: 'delete',
            label: (
                <Popconfirm
                    title={`Are you sure you want to delete this ${type}?`}
                    description={
                        type === 'folder' 
                            ? 'This will delete the folder and all files inside it. This action cannot be undone.'
                            : 'This action cannot be undone.'
                    }
                    onConfirm={() => {
                        if (type === 'file') {
                            handleDeleteFile(item);
                        } else if (type === 'folder') {
                            handleDeleteFolder(item);
                        }
                    }}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                    okType="danger"
                >
                    <span style={{ color: '#ff4d4f' }}>
                        <DeleteOutlined style={{ marginRight: 8 }} />
                        Delete {type}
                    </span>
                </Popconfirm>
            ),
            danger: true
        });
        
        return items;
    }, [handleCopyLink]);

    // Handle delete items
    const handleDeleteItems = async () => {
        if (selectedItems.length === 0) return;

        try {
            await deleteItems(selectedItems);
            setSelectedItems([]);
        } catch (error) {
            console.error('Error deleting items:', error);
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };


    // Check if file is image
    const isImageFile = (file) => {
        const extension = file.fileExtension?.toLowerCase();
        const fileType = file.fileType?.split('/')[0];
        return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(extension) || fileType === 'image';
    };

    // Get file type for CSS styling
    const getFileType = (file) => {
        if (!file) return 'default';
        
        const fileExtension = file.fileExtension?.toLowerCase() || '';
        const fileType = file.fileType?.toLowerCase() || '';
        
        // Excel files
        if (fileExtension === '.xlsx' || fileExtension === '.xls' || fileType.includes('excel')) {
            return 'excel';
        }
        
        // Word files
        if (fileExtension === '.docx' || fileExtension === '.doc' || fileType.includes('word')) {
            return 'word';
        }
        
        // PowerPoint files
        if (fileExtension === '.pptx' || fileExtension === '.ppt' || fileType.includes('presentation')) {
            return 'powerpoint';
        }
        
        // PDF files
        if (fileExtension === '.pdf' || fileType.includes('pdf')) {
            return 'pdf';
        }
        
        // Image files
        if (isImageFile(file)) {
            return 'image';
        }
        
        // Video files
        if (fileType.startsWith('video/') || ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(fileExtension)) {
            return 'video';
        }
        
        // Audio files
        if (fileType.startsWith('audio/') || ['.mp3', '.wav', '.flac', '.aac', '.ogg'].includes(fileExtension)) {
            return 'audio';
        }
        
        // Archive files
        if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(fileExtension)) {
            return 'archive';
        }
        
        // Database files
        if (['.sql', '.db', '.sqlite', '.mdb'].includes(fileExtension)) {
            return 'database';
        }
        
        // Code files
        if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go'].includes(fileExtension)) {
            return 'code';
        }
        
        // Markdown files
        if (fileExtension === '.md' || fileExtension === '.markdown') {
            return 'markdown';
        }
        
        // Text files
        if (fileType.startsWith('text/') || ['.txt', '.log', '.csv'].includes(fileExtension)) {
            return 'text';
        }
        
        return 'default';
    };

    // Get file icon based on file type
    const getFileIcon = (file) => {
        if (!file) return <FileOutlined />;
        
        const fileExtension = file.fileExtension?.toLowerCase() || '';
        const fileType = file.fileType?.toLowerCase() || '';
        
        // Excel files
        if (fileExtension === '.xlsx' || fileExtension === '.xls' || fileType.includes('excel')) {
            return <FileExcelFilled />;
        }
        
        // Word files
        if (fileExtension === '.docx' || fileExtension === '.doc' || fileType.includes('word')) {
            return <FileWordFilled />;
        }
        
        // PowerPoint files
        if (fileExtension === '.pptx' || fileExtension === '.ppt' || fileType.includes('presentation')) {
            return <FilePptFilled />;
        }
        
        // PDF files
        if (fileExtension === '.pdf' || fileType.includes('pdf')) {
            return <FilePdfFilled />;
        }
        
        // Image files
        if (isImageFile(file)) {
            return <FileImageFilled />;
        }
        
        // Video files
        if (fileType.startsWith('video/') || ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(fileExtension)) {
            return <VideoCameraFilled />;
        }
        
        // Audio files
        if (fileType.startsWith('audio/') || ['.mp3', '.wav', '.flac', '.aac', '.ogg'].includes(fileExtension)) {
            return <AudioFilled />;
        }
        
        // Archive files
        if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(fileExtension)) {
            return <FileZipFilled />;
        }
        
        // Database files
        if (['.sql', '.db', '.sqlite', '.mdb'].includes(fileExtension)) {
            return <DatabaseFilled />;
        }
        
        // Code files
        if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go'].includes(fileExtension)) {
            return <CodeFilled />;
        }
        
        // Markdown files
        if (fileExtension === '.md' || fileExtension === '.markdown') {
            return <FileMarkdownOutlined />;
        }
        
        // Text files
        if (fileType.startsWith('text/') || ['.txt', '.log', '.csv'].includes(fileExtension)) {
            return <FileTextOutlined />;
        }
        
        // Default file icon
        return <FileOutlined />;
    };

    // Render file preview content
    const renderFilePreview = (file) => {
        if (!file) return null;

        const fileType = file.fileType?.split('/')[0];
        const fileExtension = file.fileExtension?.toLowerCase();

        // Image files
        if (fileType === 'image' || isImageFile(file)) {
            return (
                <div className="preview-image">
                    <LazyImage 
                        src={file.fileUrl} 
                        alt={file.name}
                        style={{ 
                            width: '100%', 
                            height: 'auto', 
                            maxHeight: '400px',
                            objectFit: 'contain',
                            borderRadius: '8px'
                        }}
                    />
                </div>
            );
        }

        // PDF files
        if (fileExtension === '.pdf') {
            return (
                <div className="preview-pdf">
                    <iframe
                        src={file.fileUrl}
                        style={{
                            width: '100%',
                            height: '400px',
                            border: 'none',
                            borderRadius: '8px'
                        }}
                        title={file.name}
                    />
                </div>
            );
        }

        // Text files
        if (['.txt', '.md', '.json', '.js', '.jsx', '.css', '.html'].includes(fileExtension)) {
            return (
                <div className="preview-text">
                    <iframe
                        src={file.fileUrl}
                        style={{
                            width: '100%',
                            height: '400px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa'
                        }}
                        title={file.name}
                    />
                </div>
            );
        }

        // Video files
        if (fileType === 'video') {
            return (
                <div className="preview-video">
                    <video
                        controls
                        style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '400px',
                            borderRadius: '8px'
                        }}
                    >
                        <source src={file.fileUrl} type={file.fileType} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        // Audio files
        if (fileType === 'audio') {
            return (
                <div className="preview-audio">
                    <audio
                        controls
                        style={{
                            width: '100%',
                            borderRadius: '8px'
                        }}
                    >
                        <source src={file.fileUrl} type={file.fileType} />
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            );
        }

        // Default preview for unsupported files
        return (
            <div className="preview-default">
                <div className="preview-icon">
                    {getFileIcon(file)}
                </div>
                <p>Preview không khả dụng cho loại file này</p>
                <Button 
                    type="primary" 
                    onClick={() => handleFileDownload(file)}
                    style={{ marginTop: '16px' }}
                >
                    Tải xuống file
                </Button>
            </div>
        );
    };

    return (
        <div className="storage-tool">
            {/* Header */}
            <div className="storage-header">
                <div className="storage-title">
                    <h1>Storage Tool</h1>
                    
                   
                </div>
               
                <div className="storage-actions">
                    <div className="view-controls">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            Grid
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            List
                        </button>
                    </div>
                    
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                   
                    
                    <Button
                        icon={<PlusOutlined />}
                        onClick={() => setShowCreateFolderModal(true)}
                    >
                        New Folder
                    </Button>
                    
                    <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={handleOpenUploadModal}
                    >
                        Upload Files
                    </Button>
                    
                    <Button
                        type={isMultiSelectMode ? "primary" : "default"}
                        icon={isMultiSelectMode ? <CheckSquareOutlined /> : <BorderOutlined />}
                        onClick={toggleMultiSelectMode}
                    >
                        {isMultiSelectMode ? 'Multi-Select ON' : 'Multi-Select'}
                    </Button>
                    
                    {selectedFiles.length > 0 && (
                        <>
                            <Button
                                type="default"
                                icon={<FileZipOutlined />}
                                onClick={handleDownloadZip}
                            >
                                Download as ZIP ({selectedFiles.length})
                            </Button>
                            <Button
                                type="default"
                                onClick={clearSelectedFiles}
                            >
                                Clear Selection
                            </Button>
                        </>
                    )}
                    
                    {selectedItems.length > 0 && (
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteItems}
                        >
                            Delete ({selectedItems.length})
                        </button>
                    )}
                </div>
            </div>
            <div className="breadcrumb">
                    
                    {currentFolderId ? (
                    <Button
                        icon={<span>←</span>}
                        onClick={handleBackClick}
                        className="back-button"
                        style={{opacity: currentFolderId ? 1 : 0, pointerEvents: currentFolderId ? 'auto' : 'none'}}
                    >
                        Back
                    </Button>
                    ):
                    (<>
                    <Button className="back-button"
                    style={{opacity: 0, pointerEvents: 'none'}}
                    >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</Button>
                    
                    </>)
                    }
                    <span 
                        className="breadcrumb-item"
                        onClick={() => {
                            setCurrentFolderId(null); 
                            setCurrentPath('/');
                        }}
                    >
                        Home
                    </span>
                    {breadcrumbFoldersList.map((folder, index) => (
                        <React.Fragment key={folder.id}>
                            <span className="breadcrumb-separator"> / </span>
                            <span 
                                className="breadcrumb-item"
                                onClick={() => {
                                    setCurrentFolderId(folder.id);
                                    setCurrentPath('/' + breadcrumbFoldersList.slice(0, index + 1).map(f => f.name).join('/') + '/');
                                }}
                            >
                                {folder.name}
                            </span>
                        </React.Fragment>
                    ))}
                     
                </div>
            {/* Upload Message */}
            {uploadMessage && (
                <div className={`upload-message ${uploadMessage.includes('Error') ? 'error' : 'success'}`}>
                    {uploadMessage}
                </div>
            )}

            {/* Content */}
            <div className="storage-content">
                {error && (
                    <div className="error-message">
                        <p>Error: {error}</p>
                        <button onClick={() => window.location.reload()}>Retry</button>
                    </div>
                )}
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <div className="storage-content-wrapper">
                        {/* Folders Section */}
                        {displayFolders.length > 0 && (
                            <div className="folders-section">
                                <h3 className="section-title">📁 Folders ({displayFolders.length})</h3>
                                <div className={`file-grid ${viewMode}`}>
                                    {displayFolders.map((item) => (
                                        <Dropdown
                                            key={item.id}
                                            menu={{ items: getContextMenuItems(item, 'folder') }}
                                            trigger={['contextMenu']}
                                        >
                                            <div
                                                className={`file-item ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleFolderClick(item);
                                                }}
                                            >
                                            <div className="file-icon">
                                                📁
                                            </div>
                                            <div className="file-name" title={item.name}>{item.name}</div>
                                            <div className="file-actions">
                                                <button
                                                    className="btn-icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Add folder actions here if needed
                                                    }}
                                                    title="Folder actions"
                                                >
                                                    ⋯
                                                </button>
                                            </div>
                                            </div>
                                        </Dropdown>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files Section */}
                        {displayFiles.length > 0 && (
                            <div className="files-section">
                                <div className="section-header">
                                    <h3 className="section-title">📄 Files ({displayFiles.length})</h3>
                                    {isMultiSelectMode && (
                                        <div className="select-all-container">
                                            <Checkbox
                                                checked={selectedFiles.length === displayFiles.length && displayFiles.length > 0}
                                                indeterminate={selectedFiles.length > 0 && selectedFiles.length < displayFiles.length}
                                                onChange={(e) => handleSelectAllFiles(e.target.checked)}
                                            >
                                                Select All
                                            </Checkbox>
                                        </div>
                                    )}
                                </div>
                                <div className={`file-grid ${viewMode}`}>
                                    {displayFiles.map((item) => (
                                        <Dropdown
                                            key={item.id}
                                            menu={{ items: getContextMenuItems(item, 'file') }}
                                            trigger={['contextMenu']}
                                        >
                                            <div
                                                className={`file-item ${selectedItems.includes(item.id) ? 'selected' : ''} ${selectedFiles.some(f => f.id === item.id) ? 'file-selected' : ''}`}
                                                data-type={getFileType(item)}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (isMultiSelectMode) {
                                                        handleFileSelect(item, !selectedFiles.some(f => f.id === item.id));
                                                    } else {
                                                        handleFilePreview(item);
                                                    }
                                                }}
                                            >
                                            {isMultiSelectMode && (
                                                <div className="file-checkbox">
                                                    <Checkbox
                                                        checked={selectedFiles.some(f => f.id === item.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleFileSelect(item, e.target.checked);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <div className="file-icon">
                                                {isImageFile(item) ? (
                                                    <LazyImage
                                                        src={item.fileUrl}
                                                        alt={item.name}
                                                        className="file-thumbnail"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'block';
                                                        }}
                                                    />
                                                ) : (
                                                    getFileIcon(item)
                                                )}
                                                {isImageFile(item) && (
                                                    <div className="file-icon-fallback" style={{ display: 'none' }}>
                                                        {getFileIcon(item) || '🖼️'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="file-name" title={item.name}>{item.name}</div>
                                            <div className="file-size">{formatFileSize(item.fileSize)}</div>
                                        
                                            <div className="file-actions">
                                                <button
                                                    className="btn-icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileDownload(item);
                                                    }}
                                                    title="Download"
                                                >
                                                    <DownloadOutlined />
                                                </button>
                                            </div>
                                            </div>
                                        </Dropdown>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {folders.length === 0 && files.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">📁</div>
                                <h3>No files or folders</h3>
                                <p>This folder is empty. Upload files or create a new folder to get started.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <Modal
                title="Tải lên file"
                open={uploadModal.visible}
                onOk={handleUploadConfirm}
                onCancel={() => setUploadModal({ visible: false, files: [], uploading: false })}
                okText="Tải lên"
                cancelText="Hủy"
                confirmLoading={uploadModal.uploading}
            >
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <label>Chọn file:</label>
                        <Upload
                            multiple
                            beforeUpload={(file) => {
                                // Allow all file types for storage tool
                                return false;
                            }}
                            onChange={handleFileUpload}
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />}>Chọn file</Button>
                        </Upload>
                    </div>

                    {uploadModal.files.length > 0 && (
                        <div>
                            <label>Danh sách file đã chọn ({uploadModal.files.length} file):</label>
                            <List
                                size="small"
                                dataSource={uploadModal.files}
                                renderItem={(file, index) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                type="text"
                                                danger
                                                onClick={() => {
                                                    const newFiles = uploadModal.files.filter((_, i) => i !== index);
                                                    setUploadModal(prev => ({ ...prev, files: newFiles }));
                                                }}
                                                size="small"
                                            >
                                                Xóa
                                            </Button>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={file.name}
                                            description={`${(file.size / 1024).toFixed(1)} KB`}
                                        />
                                    </List.Item>
                                )}
                                style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: '6px',
                                    padding: '8px'
                                }}
                            />
                        </div>
                    )}
                </div>
            </Modal>

            {/* Create Folder Modal */}
            <Modal
                title="Tạo thư mục mới"
                open={showCreateFolderModal}
                onOk={handleCreateFolder}
                onCancel={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
                }}
                okText="Tạo"
                cancelText="Hủy"
            >
                <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Nhập tên thư mục"
                    onPressEnter={handleCreateFolder}
                />
            </Modal>

            {/* Preview Sidebar */}
            {previewSidebar.visible && (
                <div className="preview-sidebar-overlay" onClick={closePreviewSidebar}>
                    <div className="preview-sidebar" onClick={(e) => e.stopPropagation()}>
                        <div className="preview-sidebar-header">
                            <h3>Preview File</h3>
                            <button 
                                className="close-btn"
                                onClick={closePreviewSidebar}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="preview-sidebar-content">
                            {previewSidebar.file && (
                                <>
                                    <div className="file-info">
                                        <div className="file-icon-large">
                                            {isImageFile(previewSidebar.file) ? (
                                                <LazyImage 
                                                    src={previewSidebar.file.fileUrl} 
                                                    alt={previewSidebar.file.name}
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e9ecef'
                                                    }}
                                                />
                                            ) : (
                                                getFileIcon(previewSidebar.file)
                                            )}
                                        </div>
                                        <div className="file-details">
                                            <h4>{previewSidebar.file.name}</h4>
                                            <p className="file-size">
                                                {formatFileSize(previewSidebar.file.fileSize)}
                                            </p>
                                            <p className="file-type">
                                                {previewSidebar.file.fileType}
                                            </p>
                                            <p className="file-date">
                                                {previewSidebar.file.createdAt ? 
                                                    new Date(previewSidebar.file.createdAt).toLocaleString() : 
                                                    'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="preview-content">
                                        {renderFilePreview(previewSidebar.file)}
                                    </div>
                                    
                                    <div className="preview-actions">
                                        <Button 
                                            type="primary" 
                                            onClick={() => handleFileDownload(previewSidebar.file)}
                                            style={{ marginRight: '8px' }}
                                        >
                                            Tải xuống
                                        </Button>
                                        <Button 
                                            onClick={() => window.open(previewSidebar.file.fileUrl, '_blank')}
                                        >
                                            Mở trong tab mới
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StorageTool;