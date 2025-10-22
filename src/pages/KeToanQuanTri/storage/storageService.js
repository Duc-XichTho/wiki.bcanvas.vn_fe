import {
    openDB
} from 'idb';

// Mở hoặc tạo cơ sở dữ liệu IndexedDB
const dbPromise = openDB('my-database', 2, {
    upgrade(db) {
        // Tạo object store nếu chưa tồn tại
        if (!db.objectStoreNames.contains('my-store')) {
            db.createObjectStore('my-store');
        }
        if (!db.objectStoreNames.contains('ktqt')) {
            db.createObjectStore('ktqt');
        }
    },
});

// Lấy dữ liệu từ IndexedDB
export const getItemFromIndexedDB2 = async (key) => {
    const db = await dbPromise;
    const data = await db.get('ktqt', key);
    return data || [];
};

// Lưu dữ liệu vào IndexedDB
export const setItemInIndexedDB2 = async (key, data) => {
    const db = await dbPromise;
    await db.put('ktqt', data, key);
};


export const deleteItemFromIndexedDB2 = async (key) => {
    const db = await dbPromise;
    await db.delete('ktqt', key);
    console.log(`Deleted key: ${key}`);
};
