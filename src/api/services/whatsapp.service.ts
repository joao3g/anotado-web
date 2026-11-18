import type { WhatsappLinkCode, WhatsappStatus } from "../types/whatsapp";
import { api } from "./client";

export const getStatus = async () => {
    const { data } = await api.get<WhatsappStatus>("/whatsapp/status");

    return data;
};

// A new code replaces the previous one. Valid for 10 minutes and only once.
export const createLinkCode = async () => {
    const { data } = await api.post<WhatsappLinkCode>("/whatsapp/link-code");

    return data;
};

export const unlink = async () => {
    await api.delete("/whatsapp/link");
};
