// ADMIN: manages the family (name, invite code, members). MEMBER: everything else.
export type FamilyRole = "ADMIN" | "MEMBER"

export type FamilyMember = {
    id: string // Used only to tell the API who to remove or promote
    role: FamilyRole
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
