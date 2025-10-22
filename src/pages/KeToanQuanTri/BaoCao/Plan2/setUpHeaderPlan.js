export default function setUpHeaderPlan(header) {
    if (!header) return '';
    header = header.split('.');
    if (header.length > 1) {
        header = header[1];
    } else {
        header = header[0];
    }
    return header.replace(/[()*#]/g, '')
}