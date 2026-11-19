import { api } from "./client";

export type FeedbackType = "BUG" | "COMPLAINT";

// "Reportar problema". page and userAgent help find bugs (no financial data is sent).
// Fails with 429 after 5 reports in one hour.
export const sendFeedback = async (feedback: { type: FeedbackType, message: string, page?: string, userAgent?: string }) => {
    await api.post("/feedback", feedback);
};
