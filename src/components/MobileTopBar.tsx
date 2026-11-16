import { Menu } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { MonthSelector } from "./MonthSelector";

type MobileTopBarProps = {
    onMenuClick: () => void
}

// Top bar for small screens (< lg): opens the sidebar drawer and shows the selected month.
export function MobileTopBar(props: MobileTopBarProps) {
    const authContext = useAuth();

    const initials = (authContext.user?.name ?? "")
        .split(" ")
        .filter(Boolean)
        .map(name => name[0].toUpperCase())
        .slice(0, 2)
        .join("");

    return (
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b-1 border-slate-200 pt-[env(safe-area-inset-top)]">
            <div className="flex justify-between items-center h-14 px-2">
                <button
                    aria-label="Abrir menu"
                    className="flex justify-center items-center size-10 rounded-full text-neutral-700 hover:bg-neutral-100/70 cursor-pointer"
                    onClick={props.onMenuClick}
                >
                    <Menu size={20} />
                </button>

                <div className="flex-1 max-w-64 mx-2">
                    <MonthSelector compact />
                </div>

                <button
                    aria-label="Abrir menu"
                    className="flex justify-center items-center size-10 rounded-full cursor-pointer bg-linear-120 from-emerald-600 from-30% to-teal-500"
                    onClick={props.onMenuClick}
                >
                    <span className="font-[700] text-sm text-white/80">{initials}</span>
                </button>
            </div>
        </header>
    );
}
