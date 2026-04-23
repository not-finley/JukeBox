export const timeAgo = (dateString: string) => {
    if (!dateString) return "";

    // Ensure UTC interpretation
    const utcDate = new Date(dateString.endsWith("Z") ? dateString : `${dateString}Z`);
    const then = utcDate.getTime();
    const now = Date.now();

    if (isNaN(then)) return "";

    const diff = (now - then) / 1000;

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    // For older posts, show local formatted date
    return utcDate.toLocaleString(undefined, {
        month: "short",
        day: "numeric"
    });
};
