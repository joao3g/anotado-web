export type BotChannel = "whatsapp" | "telegram"

// Each bot is hidden while it is not configured on the server (enabled: false).
export type BotsStatus = {
    whatsapp: {
        enabled: boolean
        connected: boolean
        lastDigits: string | null // Last 4 digits of the linked WhatsApp number (the full number is never sent)
        botNumber: string | null // Bot number with country code, digits only, e.g. "5511999999999"
    }
    telegram: {
        enabled: boolean
        connected: boolean
        botUsername: string | null // e.g. "ExpenseTrackerFamiliaBot" (without @)
    }
}

// One code links either bot. Valid for 10 minutes and only once.
export type BotLinkCode = {
    code: string // "ET-K7MZQ2PA"
    expiresAt: string // ISO date-time
    whatsapp: { message: string, link: string | null } | null // Text to send, and a wa.me link with it typed
    telegram: { link: string } | null // t.me link: tapping "Start" sends the code
}
