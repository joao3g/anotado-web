export const getMonthOffset = (date: Date, offset: number) => {
    const finalDate = new Date(date);

    finalDate.setDate(1);
    finalDate.setMonth(finalDate.getMonth() + offset);
    return finalDate;
}

export const getDateInCurrentOffset = (date: Date) => {
    return new Date(date.toISOString().split("T")[0] + "T00:00");
}

export const getMonthAndYearString = (date: Date) => {
    return date.toISOString().slice(0, 7);
}

export const formatMoney = (value: string) => {
    let result: string | number = Number(value.replace(/\D/g, ''));
    result = (result / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    return result;
}

// Money in forms is kept as integer cents, so no float math happens in the UI.
// The API sends Decimals as strings, sometimes without trailing zeros: "150" -> 15000, "10.1" -> 1010, "99.90" -> 9990.
export const amountToCents = (amount: string) => {
    const [integer, fraction = ""] = amount.split(".");
    return Number(integer) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

// 15000 -> "150.00". Integer math only.
export const centsToAmountString = (cents: number) => `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;

// Money inputs: keep only digits, max 10 (Decimal(10,2): up to 99.999.999,99).
export const inputToCents = (value: string) => Number(value.replace(/\D/g, "").slice(0, 10) || 0);

export const hexToHsl = (hex: string) => {
    hex = hex.replace("#", "")
    // Short form "fff" = "ffffff". Without this, the color math gives NaN and the CSS color is ignored.
    if (hex.length === 3) hex = hex.split("").map(char => char + char).join("")

    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)

    let h = 0
    let s = 0
    const l = (max + min) / 2

    const d = max - min

    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1))

        switch (max) {
            case r:
                h = 60 * (((g - b) / d) % 6)
                break
            case g:
                h = 60 * ((b - r) / d + 2)
                break
            case b:
                h = 60 * ((r - g) / d + 4)
                break
        }
    }

    if (h < 0) h += 360

    return {
        h,
        s: s * 100,
        l: l * 100,
    }
}

export const PAYMENT_METHOD_MAP = {
    "CREDIT": "Crédito",
    "DEBIT": "Débito",
    "VOUCHER": "Vale"
}

export const PAYMENT_METHOD_TO_COLOR_MAP = {
    "CREDIT": "FF0D0D",
    "DEBIT": "009A4D",
    "VOUCHER": "00B5B5"
}

// Shown for expenses and recurrences whose category was deleted (category is null).
// Color without "#", like category colors from the API.
export const UNCATEGORIZED_TITLE = "Sem categoria";
export const UNCATEGORIZED_COLOR = "A3A3A3";
// Position of the "⋯" options popup (w-40 = 160px wide, about 90px tall) next to the tap or click.
// Kept inside the screen on phones; opens above the tap when there is no room below.
export const getOptionsPopupPosition = (event: { clientX: number, clientY: number }): [number, number] => {
    const POPUP_WIDTH = 160;
    const POPUP_HEIGHT = 90;
    const MARGIN = 8;

    const x = Math.max(MARGIN, Math.min(event.clientX - 80, window.innerWidth - POPUP_WIDTH - MARGIN));
    const below = event.clientY + 20;
    const y = below + POPUP_HEIGHT > window.innerHeight - MARGIN ? event.clientY - POPUP_HEIGHT - 10 : below;

    return [x, Math.max(MARGIN, y)];
};

// Brazilian phone for display: "11912345678" -> "(11) 91234-5678", "1132345678" -> "(11) 3234-5678".
// Also used while typing (partial numbers). Stored and sent as digits only.
export const formatPhone = (digits: string) => {
    const d = digits.replace(/\D/g, "").slice(0, 11);

    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;

    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
