import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './Routes.tsx';
import { RouterProvider } from 'react-router/dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { DateProvider } from './context/DateContext.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './Routes.tsx';

// PWA service worker (public/sw.js). Production builds only, so it never gets in the way of Vite dev/HMR.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
            // Not critical: the app works the same without it, it just cannot be used offline.
        });
    });
}

createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <ToastProvider>
                <DateProvider>
                    <RouterProvider router={router} />
                </DateProvider>
            </ToastProvider>
        </AuthProvider>
    </QueryClientProvider>
);
