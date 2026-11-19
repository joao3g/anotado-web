export type Card = {
    id: string
    title: string
    lastFourDigits: string | null // Exactly 4 digits as a string ("0123"), or null when not informed
    color: string // Hex WITHOUT "#"
    closingDay: number // 1..27
    dueDay: number // 1..28. Same month as the closing when dueDay > closingDay, else the month after.
    createdAt: string
}

export type CardCreate = {
    title: string
    lastFourDigits?: string
    color: string
    closingDay: number
    dueDay: number
}

export type CardUpdate = {
    id: string
    title?: string
    lastFourDigits?: string // "" clears it
    color?: string
    closingDay?: number
    dueDay?: number
}

// "Nubank •••• 1234", or only "Nubank" when the digits are not informed.
export const cardLabel = (card: Pick<Card, "title" | "lastFourDigits">) =>
    card.lastFourDigits ? `${card.title} •••• ${card.lastFourDigits}` : card.title;
