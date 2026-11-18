export type WhatsappStatus = {
    enabled: boolean // false until the bot is configured on the server: the card is hidden
    connected: boolean
    lastDigits: string | null // Last 4 digits of the linked WhatsApp number (the full number is never sent)
    botNumber: string | null // Bot number with country code, digits only, e.g. "5511999999999"
}

export type WhatsappLinkCode = {
    code: string // "ET-K7MZQ2PA"
    message: string // Text to send to the bot, e.g. "Conectar ET-K7MZQ2PA"
    link: string | null // wa.me link that opens WhatsApp with the message already typed
    expiresAt: string // ISO date-time (10 minutes)
}
