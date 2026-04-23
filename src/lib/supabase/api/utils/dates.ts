export function normalizeReleaseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    // year only
    if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`;
    // year-month
    if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
    // already full
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    return null; // fallback
}
