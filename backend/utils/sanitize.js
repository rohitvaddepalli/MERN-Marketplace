export const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const sanitizeSearchInput = (input) => {
    if (!input || typeof input !== 'string') return '';
    // Remove potentially dangerous characters but keep basic punctuation
    const sanitized = input.replace(/[<>'"/;`%]/g, '');
    // Trim and limit length to prevent DoS via massive regex
    const trimmed = sanitized.trim().substring(0, 100);
    // Escape for regex
    return escapeRegex(trimmed);
};
