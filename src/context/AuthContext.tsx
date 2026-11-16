import { createContext, useEffect, useState, type ReactNode } from "react"
import { isAxiosError } from "axios"
import { type User } from "../api/types/auth.ts"
import * as authService from "../api/services/auth.service.ts"
import { queryClient } from "../queryClient.ts"

type AuthContextType = {
    user: User | null
    login: (token: string, user: User) => void
    logout: () => void
    // Reloads the user from the API (after profile, photo or family changes)
    refreshUser: () => Promise<User>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) return;

        async function loadUser() {
            try {
                setUser(await authService.getMe());
            } catch (error) {
                // Only a rejected token (401) ends the session.
                if (isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem("token");
                    setUser(null);
                    return;
                }

                // No connection or server error (e.g. the installed app opened offline):
                // keep the token and try again when the connection is back.
                window.addEventListener("online", loadUser, { once: true });
            }
        }

        loadUser();

        return () => window.removeEventListener("online", loadUser);
    }, []);

    function login(token: string, user: User) {
        setUser(user);

        localStorage.setItem("token", token);
    }

    function logout() {
        setUser(null);

        localStorage.removeItem("token");

        // Never show one account's cached money data to the next account on this device.
        queryClient.clear();
    }

    async function refreshUser() {
        const data = await authService.getMe();
        setUser(data);

        return data;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}