import type { Family, FamilyRole } from "../types/group";
import { api } from "./client";

export const getFamily = async () => {
    const { data } = await api.get<Family>("/group/me");

    return data;
};

export const updateFamilyName = async (title: string) => {
    await api.patch("/group/me", { title });
};

// The old code stops working at once.
export const regenerateInviteCode = async () => {
    const { data } = await api.post<{ inviteCode: string }>("/group/me/invite-code");

    return data.inviteCode;
};

// Admin only (the API answers 403 otherwise).
export const removeMember = async (id: string) => {
    await api.delete(`/group/me/members/${encodeURIComponent(id)}`);
};

// Admin only. Makes another person an admin, or an admin back a member.
export const setMemberRole = async (id: string, role: FamilyRole) => {
    await api.patch(`/group/me/members/${encodeURIComponent(id)}/role`, { role });
};

export const leaveFamily = async () => {
    await api.post("/group/me/leave");
};

export const joinFamily = async (code: string) => {
    await api.post("/group/join", { code });
};

export const createFamily = async (title: string) => {
    await api.post("/group/create", { title });
};
