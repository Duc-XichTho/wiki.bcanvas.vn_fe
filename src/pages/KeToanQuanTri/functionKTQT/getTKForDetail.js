export function getFirstThreeChars(str) {
    if (!str) {
        return "";
    }
    return str.includes('-') ? str.split('-')[0] : str.substring(0, 3);
}