export type FamilyMember = {
    name: string | null
    email: string | null
    avatar: string | null
    isMe: boolean
}

export type Family = {
    title: string
    inviteCode: string // 8 chars, e.g. "K7MZQ2PA"
    members: FamilyMember[]
}
