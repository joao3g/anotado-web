import type { Family } from "../types/group";
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

export const leaveFamily = async () => {
    await api.post("/group/me/leave");
};

export const joinFamily = async (code: string) => {
    await api.post("/group/join", { code });
};

export const createFamily = async (title: string) => {
    await api.post("/group/create", { title });
};
