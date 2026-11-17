import type { FamilyRole } from "./group";

export type User = {
    login: string
    name: string
    email: string,
    phone: string | null // Digits only, e.g. "11912345678"
    avatar: string | null // "data:image/jpeg;base64,..." (256x256)
    // null until the user joins or creates a family (then the app shows /onboarding)
    group: {
        title: string
        totalMembers: number
        role: FamilyRole
    } | null
}

export type LoginResponse = {
    token: string,
    user: User
}

export type ProfileUpdate = {
    name: string
    email: string
    phone: string // Digits only; "" removes the phone
}
