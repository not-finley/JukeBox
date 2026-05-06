export const timeAgo = (dateString: string) => {
    if (!dateString) return "";

    // The Date constructor handles both "Z" and "+00:00" automatically 
    // as long as the string isn't malformed.
    const date = new Date(dateString);
    const then = date.getTime();
    const now = Date.now();

    // Check if the date is valid
    if (isNaN(then)) {
        // Fallback: If for some reason the DB string is missing a timezone 
        // marker entirely, then we treat it as UTC.
        const fallbackDate = new Date(`${dateString}Z`);
        if (isNaN(fallbackDate.getTime())) return "";
        return calculate(fallbackDate.getTime(), now, fallbackDate);
    }

    return calculate(then, now, date);
};

// Helper to keep logic clean
const calculate = (then: number, now: number, dateObj: Date) => {
    const diff = (now - then) / 1000;

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return dateObj.toLocaleString(undefined, {
        month: "short",
        day: "numeric"
    });
};
