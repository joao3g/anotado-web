import axios, { isAxiosError } from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// The user has no family anymore (e.g. left it on another device): go choose or create one.
api.interceptors.response.use(undefined, (error) => {
    if (
        isAxiosError(error)
        && error.response?.status === 403
        && error.response.data?.code === "NO_GROUP"
        && window.location.pathname !== "/onboarding"
    ) {
        window.location.assign("/onboarding");
    }

    return Promise.reject(error);
});

// pt-BR message sent by the API on a 4xx ({ message }), or the fallback (server errors stay generic).
export const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (
        isAxiosError(error)
        && error.response
        && error.response.status < 500
        && typeof error.response.data?.message === "string"
    ) return error.response.data.message;

    return fallback;
};
