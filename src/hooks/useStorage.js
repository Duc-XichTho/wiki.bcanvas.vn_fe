import { useState, useEffect, useCallback } from 'react';
import { 
    getAllStorageFiles, 
    searchStorageFiles, 
    deleteStorageFile,
    getAllStorageFolders,
    uploadFiles,
    createFolder
} from '../apis/storage/index.js';
import { deleteStorageFolder, getAllFoldersForBreadcrumb } from '../apis/storageFolder.jsx';

export const useStorage = (currentFolderId = null) => {
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [allFolders, setAllFolders] = useState([]); // Store all folders for breadcrumb
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all folders for breadcrumb
    const fetchAllFolders = useCallback(async () => {
        try {
            const allFoldersData = await getAllFoldersForBreadcrumb();
            setAllFolders(prev => {
                // Only update if data actually changed
                if (JSON.stringify(prev) !== JSON.stringify(allFoldersData)) {
                    return allFoldersData;
                }
                return prev;
            });
        } catch (err) {
            console.error('Error fetching all folders:', err);
        }
    }, []);

    // Fetch data
    const fetchData = useCallback(async (folderId = null) => {
        setLoading(true);
        setError(null);
        try {
            let [filesData, foldersData] = await Promise.all([
                getAllStorageFiles(folderId),
                getAllStorageFolders(folderId)
            ]);
            filesData.sort((a, b) => b.id-a.id);
            // Only update state if data actually changed
            setFiles(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(filesData)) {
                    return filesData;
                }
                return prev;
            });
            
            setFolders(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(foldersData)) {
                    return foldersData;
                }
                return prev;
            });
        } catch (err) {
            setError(err.message);
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Search files
    const searchFiles = useCallback(async (searchTerm) => {
        if (!searchTerm.trim()) {
            fetchData(currentFolderId);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const searchResults = await searchStorageFiles(searchTerm);
            setFiles(searchResults);
            setFolders([]); // Clear folders when searching
        } catch (err) {
            setError(err.message);
            console.error('Error searching files:', err);
        } finally {
            setLoading(false);
        }
    }, [currentFolderId, fetchData]);

    // Upload files
    const uploadFilesToStorage = useCallback(async (files, userCreate = 'system') => {
        setLoading(true);
        setError(null);
        try {
            const result = await uploadFiles(files, currentFolderId, userCreate);
            if (result.files) {
                await fetchData(currentFolderId);
            }
            return result;
        } catch (err) {
            setError(err.message);
            console.error('Error uploading files:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentFolderId, fetchData]);

    // Create folder
    const createNewFolder = useCallback(async (folderData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await createFolder(folderData);
            await fetchData(currentFolderId);
            return result;
        } catch (err) {
            setError(err.message);
            console.error('Error creating folder:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentFolderId, fetchData]);

    // Delete items
    const deleteItems = useCallback(async (itemIds, type = 'file') => {
        setLoading(true);
        setError(null);
        try {
            if (type === 'file') {
                await deleteStorageFile(itemIds.join(','));
            } else if (type === 'folder') {
                await deleteStorageFolder(itemIds[0]); // Folder delete takes single ID
            }
            await fetchData(currentFolderId);
        } catch (err) {
            setError(err.message);
            console.error('Error deleting items:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentFolderId, fetchData]);

    // Auto fetch when folderId changes
    useEffect(() => {
        fetchData(currentFolderId);
    }, [currentFolderId, fetchData]);

    return {
        files,
        folders,
        allFolders,
        loading,
        error,
        fetchData,
        searchFiles,
        uploadFiles: uploadFilesToStorage,
        createFolder: createNewFolder,
        deleteItems,
        fetchAllFolders
    };
};
