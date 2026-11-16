export const PaymentMethod = {
    CREDIT: "CREDIT",
    DEBIT: "DEBIT",
    VOUCHER: "VOUCHER"
} as const;

export type ExpenseCreate = {
    title: string
    description?: string
    amount: number
    date: string
    paymentMethod: typeof PaymentMethod[keyof typeof PaymentMethod]
    category: string
    card?: string // Card id. Required for CREDIT, not sent otherwise.
}

export type ExpenseUpdate = {
    id: string
    title?: string
    description?: string
    amount?: number
    date?: string
    paymentMethod?: typeof PaymentMethod[keyof typeof PaymentMethod]
    category?: string
    card?: string // Not sent = keep the current card
}

export type ExpenseCard = {
    id: string
    title: string
    lastFourDigits: string | null
    color: string // Hex WITHOUT "#"
    closingDay: number
}

export type Expense = {
    id: string
    title: string
    description?: string
    amount: string
    transactionDate: string
    dueDate: string
    paymentMethod: typeof PaymentMethod[keyof typeof PaymentMethod]
    isEssential?: boolean
    category: {
        id: string
        title: string
        description?: string
        color: string
        groupId: string
        createdAt: string
        updatedAt: string
    } | null, // null when the category was deleted
    card: ExpenseCard | null // Set only for CREDIT
    // Set when the expense is an installment of a recurrence
    recurrenceId: string | null
    installmentNumber: number | null
    recurrence: { totalInstallments: number | null } | null
    createdAt: string
}

export type ExpenseSummarized = {
    summarizedByTitle: {
        _sum: { amount: string },
        title: string
    }[],
    summarizedByCategory: {
        _sum: { amount: string },
        // All null for the group of expenses whose category was deleted
        categoryId: string | null,
        categoryTitle: string | null,
        categoryColor: string | null
    }[],
    summarizedByPaymentMethod: {
        _sum: { amount: string },
        paymentMethod: typeof PaymentMethod[keyof typeof PaymentMethod]
    }[]
}

export type ExpenseTotal = {
    _sum: { amount: string },
}