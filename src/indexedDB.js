import Dexie from 'dexie';

export const db = new Dexie('SoKeToanDB');

db.version(1).stores({
    soKeToan: '++id, updateAt, isPending', // IndexedDB sẽ lưu danh sách sổ kế toán
});
