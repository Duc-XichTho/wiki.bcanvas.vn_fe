export function cutStringGroup(input) {
    try {
        // Loại bỏ các ký tự không cần thiết: "1.", "1-", "(B)", v.v.
        return input.replace(/^\d+[\.\-]\s*|\s*\(.*\)$/g, '').trim();
    } catch (e) {
        return input;
    }
}
