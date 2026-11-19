import { isAxiosError } from "axios";
import type { LoginResponse, ProfileUpdate, User } from "../types/auth";
import { api } from "./client";

export const login = async (login: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", {
        login,
        password,
    });

    return data;
};

// emailVerificationRequired: the account can log in only after the emailed link is opened.
// Missing (older API) = false.
export const register = async (requestData: { login: string, password: string, name: string, email: string }) => {
    const { data } = await api.post<{ emailVerificationRequired?: boolean } | "">("/auth/register", requestData);

    return { emailVerificationRequired: Boolean(data && data.emailVerificationRequired) };
};

// Login answers 403 with this code when the password is right but the email is not confirmed yet.
export const getEmailNotVerified = (error: unknown) =>
    isAxiosError(error) && error.response?.status === 403 && error.response.data?.code === "EMAIL_NOT_VERIFIED"
        ? { email: String(error.response.data.email ?? "") }
        : null;

// token: from the email link (#token=...). Fails with 400 when the link is invalid, used, or expired.
// emailChanged: the link confirmed a new email from Perfil (not a sign-up). 409 when another account took it meanwhile.
export const verifyEmail = async (token: string) => {
    const { data } = await api.post<{ emailChanged?: boolean } | "">("/auth/verify-email", { token });

    return { emailChanged: Boolean(data && data.emailChanged) };
};

// Same answer for any email. The API sends at most one email every 2 minutes.
export const resendVerification = async (email: string) => {
    await api.post("/auth/resend-verification", { email });
};

export const getMe = async () => {
    const { data } = await api.get<User>("/auth/me");

    return data;
};

// emailChangePending: the new email was not saved yet. It changes when the link sent to it is opened.
export const updateProfile = async (profile: ProfileUpdate) => {
    const { data } = await api.patch<{ emailChangePending?: boolean } | "">("/auth/me", profile);

    return { emailChangePending: Boolean(data && data.emailChangePending) };
};

// Email change waiting for its link: send it again (429 within 2 minutes), or cancel it.
export const resendEmailChange = async () => {
    await api.post("/auth/me/email/resend");
};

export const cancelEmailChange = async () => {
    await api.delete("/auth/me/email/pending");
};

// avatar: "data:image/jpeg;base64,..." already resized by the browser (see src/image.ts)
export const updateAvatar = async (avatar: string) => {
    await api.put("/auth/me/avatar", { avatar });
};

export const removeAvatar = async () => {
    await api.delete("/auth/me/avatar");
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.patch("/auth/me/password", { currentPassword, newPassword });
};

// "Esqueceu a senha?": always succeeds when the email is valid, whether or not an account has it.
export const forgotPassword = async (email: string) => {
    await api.post("/auth/forgot-password", { email });
};

// token: from the email link (#token=...). Fails with 400 when the link is invalid, used, or expired.
export const resetPassword = async (token: string, newPassword: string) => {
    await api.post("/auth/reset-password", { token, newPassword });
};
