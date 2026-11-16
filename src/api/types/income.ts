export type IncomeCreate = {
    title: string
    amount: number
    date: string
}

export type Income = {
    id: string
    title: string
    amount: string
    date: string // UTC midnight of the first day of the month, e.g. "2026-12-01T00:00:00.000Z"
    group: {
        id: string
        title: string
    }
    user: {
        id: string
        name: string
        email: string
    },
    createdAt: Date
}

export type IncomeUpdate = {
    id: string
    title?: string
    amount?: number
    date?: string
}

export type IncomeTotal = {
    _sum: { amount: string },
}