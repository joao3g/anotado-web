import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronsUpDown, LogOut, MessageSquareWarning, Moon, Settings, Users } from "lucide-react";
import { Avatar } from "./Avatar";
import { useAuth } from "../hooks/useAuth";
import { isDarkMode, setDarkMode, subscribeToDarkMode } from "../theme";
import { ReportProblemModal } from "./modals/ReportProblemModal";

type AccountMenuProps = {
    onNavigate: (path: string) => void // Also closes the mobile drawer (Sidebar.goTo)
    onLogout: () => void
}

// Bottom of the side menu: the profile row opens a card with the account, "Configurações" and "Sair".
// Closes on click outside, on Esc, and after choosing an option.
export function AccountMenu(props: AccountMenuProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    // Follows the toggle and, while no choice is saved, the phone/PC setting.
    const dark = useSyncExternalStore(subscribeToDarkMode, isDarkMode);

    useEffect(() => {
        if (!open) return;

        function handlePointerDown(event: PointerEvent) {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    function goToSettings() {
        setOpen(false);
        props.onNavigate("/settings");
    }

    function logout() {
        setOpen(false);
        props.onLogout();
    }

    return (
        <div ref={rootRef} className="relative w-full p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t-1 border-slate-200">
            {open ?
                <div
                    role="menu"
                    aria-label="Opções da conta"
                    className="absolute bottom-full left-3 right-3 mb-2 z-10 overflow-hidden bg-white border-1 border-slate-200 rounded-2xl shadow-lg"
                >
                    <div className="flex items-center gap-3 p-4 bg-linear-to-t from-brand/5 to-white">
                        <Avatar name={user?.name} avatar={user?.avatar} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-[600] text-ink truncate">{user?.name}</span>
                            <span className="text-xs text-neutral-600 truncate">{user?.email}</span>
                            {user?.group ?
                                <span className="flex items-center gap-1 mt-0.5 text-[11px] text-brand truncate">
                                    <Users size={12} className="shrink-0" />
                                    {user.group.title}
                                </span>
                                : null}
                        </div>
                    </div>

                    <div className="p-1.5 border-t-1 border-slate-200">
                        <button
                            role="menuitem"
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-[500] text-neutral-700 hover:bg-neutral-100 hover:text-ink cursor-pointer"
                            onClick={goToSettings}
                        >
                            <Settings size={16} />
                            Configurações
                        </button>

                        {/* Stays open after the switch, so the user sees the change. Saved on this device only. */}
                        <button
                            role="menuitemcheckbox"
                            aria-checked={dark}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-[500] text-neutral-700 hover:bg-neutral-100 hover:text-ink cursor-pointer"
                            onClick={() => setDarkMode(!dark)}
                        >
                            <Moon size={16} />
                            <span className="flex-1 text-left">Modo escuro</span>
                            <span className={`flex items-center w-9 h-5 p-0.5 rounded-full transition-colors ${dark ? "bg-brand" : "bg-slate-200"}`}>
                                <span className={`size-4 rounded-full bg-snow shadow-sm transition-transform ${dark ? "translate-x-4" : ""}`} />
                            </span>
                        </button>

                        <button
                            role="menuitem"
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-[500] text-neutral-700 hover:bg-neutral-100 hover:text-ink cursor-pointer"
                            onClick={() => { setOpen(false); setReportOpen(true); }}
                        >
                            <MessageSquareWarning size={16} />
                            Reportar problema
                        </button>
                    </div>

                    <div className="p-1.5 border-t-1 border-slate-200">
                        <button
                            role="menuitem"
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-[500] text-red-600 hover:bg-red-50 cursor-pointer"
                            onClick={logout}
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                </div>
                : null}

            <button
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Abrir opções da conta"
                className={`flex items-center gap-3 w-[calc(100%+1rem)] p-2 -m-2 rounded-2xl text-left cursor-pointer hover:bg-neutral-100/70 ${open ? "bg-neutral-100/70" : ""}`}
                onClick={() => setOpen(current => !current)}
            >
                <Avatar name={user?.name} avatar={user?.avatar} />
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-ink text-[14px] font-[500] truncate">{user?.name}</span>
                    <span className="text-neutral-600 text-[11px]/3 truncate">{user?.email}</span>
                </div>
                <ChevronsUpDown size={16} className="shrink-0 text-neutral-500" />
            </button>

            {/* Portal: the mobile drawer uses translate-x, which would trap a fixed modal inside the 280px menu. */}
            {reportOpen ? createPortal(<ReportProblemModal onClose={() => setReportOpen(false)} />, document.body) : null}
        </div>
    );
}
