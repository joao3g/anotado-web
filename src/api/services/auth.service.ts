import type { LoginResponse, ProfileUpdate, User } from "../types/auth";
import { api } from "./client";

export const login = async (login: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", {
        login,
        password,
    });

    return data;
};

export const register = async (requestData: { login: string, password: string, name: string, email: string }) => {
    await api.post("/auth/register", requestData);
};

export const getMe = async () => {
    const { data } = await api.get<User>("/auth/me");

    return data;
};

export const updateProfile = async (profile: ProfileUpdate) => {
    await api.patch("/auth/me", profile);
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
