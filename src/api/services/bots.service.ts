import type { BotChannel, BotLinkCode, BotsStatus } from "../types/bots";
import { api } from "./client";

export const getStatus = async () => {
    const { data } = await api.get<BotsStatus>("/bots/status");

    return data;
};

// A new code replaces the previous one. Valid for 10 minutes and only once.
export const createLinkCode = async () => {
    const { data } = await api.post<BotLinkCode>("/bots/link-code");

    return data;
};

export const unlink = async (channel: BotChannel) => {
    await api.delete(`/bots/link/${channel}`);
};
