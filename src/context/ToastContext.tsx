import { createContext, useRef, useState, type ReactNode } from "react";
import { CircleCheck, CircleX, Info, X } from "lucide-react";

type ToastType = "info" | "error" | "success";

type ToastContextType = {
    addToast: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextType | null>(null);

type Toast = {
    id: number
    message: string
    type: ToastType
    duration: number // ms
    isLeaving?: boolean
}

// Errors stay longer: they usually say what to do next.
const DURATION: Record<ToastType, number> = { success: 3500, info: 3500, error: 5000 };
const LEAVE_ANIMATION_MS = 300;
const MAX_VISIBLE = 3;

const STYLES: Record<ToastType, { icon: typeof Info, iconClass: string, barClass: string }> = {
    success: { icon: CircleCheck, iconClass: "bg-green-100 text-green-700", barClass: "bg-green-500" },
    error: { icon: CircleX, iconClass: "bg-red-100 text-red-600", barClass: "bg-red-500" },
    info: { icon: Info, iconClass: "bg-brand/10 text-brand", barClass: "bg-brand" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    // Unique id even for two toasts in the same millisecond
    const nextId = useRef(1);

    function dismiss(id: number) {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, isLeaving: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), LEAVE_ANIMATION_MS);
    }

    function addToast(message: string, type: ToastType = "info") {
        const id = nextId.current++;
        const duration = DURATION[type];

        // Newest at the bottom; keep at most MAX_VISIBLE
        setToasts(prev => [...prev, { id, message, type, duration }].slice(-MAX_VISIBLE));

        setTimeout(() => dismiss(id), duration);
    }

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}

            {/* Phones: full width at the top (below the notch). From sm: top-right, fixed width. */}
            <div
                aria-live="polite"
                className="fixed z-999 top-[calc(0.75rem+env(safe-area-inset-top))] left-3 right-3 sm:left-auto sm:right-4 sm:w-96 flex flex-col gap-2 pointer-events-none"
            >
                {toasts.map(t => {
                    const style = STYLES[t.type];
                    const Icon = style.icon;

                    return (
                        <div
                            key={t.id}
                            role={t.type === "error" ? "alert" : "status"}
                            className={`
                                pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3 pr-2
                                bg-white border-1 border-slate-200 rounded-2xl shadow-lg animate-toast-in
                                transition-all duration-300
                                ${t.isLeaving ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}
                            `}
                        >
                            <div className={`flex justify-center items-center shrink-0 size-8 rounded-full ${style.iconClass}`}>
                                <Icon size={18} />
                            </div>

                            <span className="flex-1 min-w-0 self-center text-sm font-[500] text-neutral-800 break-words">
                                {t.message}
                            </span>

                            <button
                                aria-label="Fechar aviso"
                                className="flex justify-center items-center shrink-0 size-7 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
                                onClick={() => dismiss(t.id)}
                            >
                                <X size={16} />
                            </button>

                            {/* Time left */}
                            <div
                                className={`absolute left-0 bottom-0 h-0.5 w-full origin-left animate-toast-progress ${style.barClass}`}
                                style={{ animationDuration: `${t.duration}ms` }}
                            />
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
