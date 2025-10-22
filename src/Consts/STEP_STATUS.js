export const DOING = 'doing';
export const PENDING = 'pending';
export const DONE = 'done';
export const NOT_DONE_YET = 'notDoneYet';
export const DUYET1 = 'duyet_1';
export function getVNStatus(status) {
    if (status === DOING) {
        return 'Chờ xử lý';
    }
    if (status === PENDING) {
        return 'Chờ duyệt';
    }
    if (status === NOT_DONE_YET) {
        return 'Đang TH';
    }
    if (status === DUYET1) {
        return 'Đã duyệt 1';
    }
    if (status === DONE) {
        return 'Hoàn thành';
    }
}
