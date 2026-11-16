import type { Card, CardCreate, CardUpdate } from "../types/card";
import { api } from "./client";

export const createCard = async (cardData: CardCreate) => {
    await api.post<Card>("/card/create", cardData);
}

// Returns how many saved expenses had their invoice date recalculated (only when the closing day changed).
export const updateCard = async (cardData: CardUpdate) => {
    const { data } = await api.patch<{ recalculatedExpenses: number }>("/card/update", cardData);

    return data;
}

export const listCards = async () => {
    const { data } = await api.get<Card[]>("/card/list");

    return data;
};

export const deleteCard = async (cardId: string) => {
    await api.delete<void>(`/card/delete/${cardId}`);
}
