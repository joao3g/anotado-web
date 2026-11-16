// CSV helpers for reports.
// ";" is the separator because Excel pt-BR uses "," as the decimal mark
// (with "," as separator, Excel BR puts everything in one column).
const SEPARATOR = ";";

// A cell starting with one of these is run as a formula by Excel/Sheets (CSV injection).
// Titles and descriptions are user text, so they are prefixed with "'" to stay plain text.
const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value: string) {
    const safe = FORMULA_START.test(value) ? `'${value}` : value;

    if (/[";\r\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
    return safe;
}

export function toCsv(rows: string[][]) {
    return rows.map(row => row.map(escapeCell).join(SEPARATOR)).join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
    // The BOM makes Excel read the file as UTF-8, so accents (ç, ã) show correctly.
    const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}
