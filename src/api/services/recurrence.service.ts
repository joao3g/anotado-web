import { api } from "./client";
import type { Recurrence, RecurrenceCreate, RecurrenceUpdate } from "../types/recurrence";

export const createRecurrence = async (recurrenceData: RecurrenceCreate) => {
    await api.post<void>(`/recurrence/create`, recurrenceData);
}

export const updateRecurrence = async (recurrenceData: RecurrenceUpdate) => {
    await api.patch<void>(`/recurrence/update`, recurrenceData);
}

export const listRecurrences = async () => {
    const { data } = await api.get<Recurrence[]>(`/recurrence/list`);

    return data;
};

export const cancelRecurrence = async (recurrenceId: string) => {
    await api.patch<void>(`/recurrence/cancel/${recurrenceId}`);
};
