import type { PaymentMethod } from "./expense";

type PaymentMethodValue = typeof PaymentMethod[keyof typeof PaymentMethod];

export const RecurrenceStatus = {
    ACTIVE: "ACTIVE",
    FINISHED: "FINISHED",
    CANCELED: "CANCELED"
} as const;

// Money fields are strings with 2 decimals ("150.00"), straight from the backend Decimal.
export type Recurrence = {
    id: string
    title: string
    description: string | null
    amount: string // Value of EACH installment
    paymentMethod: PaymentMethodValue
    isEssential: boolean | null
    startDate: string
    totalInstallments: number | null // null = never ends
    canceledAt: string | null
    category: {
        id: string
        title: string
        description?: string
        color: string
        groupId: string
        createdAt: string
        updatedAt: string
    }
    createdAt: string
    pastCount: number
    futureCount: number
    remainingAmount: string | null // null for never-ending series
    nextDueDate: string | null
    status: typeof RecurrenceStatus[keyof typeof RecurrenceStatus]
}

export type RecurrenceCreate = {
    title: string
    description?: string
    amount: string
    startDate: string // "YYYY-MM-DD"
    paymentMethod: PaymentMethodValue
    category: string
    isEssential?: boolean
    totalInstallments: number | null
}

export type RecurrenceUpdate = {
    id: string
    title?: string
    description?: string
    amount?: string
    category?: string
    isEssential?: boolean
}
