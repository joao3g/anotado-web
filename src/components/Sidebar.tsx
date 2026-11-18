import {
    LayoutDashboard,
    BanknoteArrowDown,
    BanknoteArrowUp,
    Plus,
    Tags,
    Users,
    Repeat,
    CreditCard
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDate } from "../hooks/useDate";
import { useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { AddOrEditExpenseModal } from "./modals/AddOrEditExpenseModal";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { queryClient } from "../Routes";
import { expensesByMonthQuery } from "../queries/expenses";
import { MonthSelector } from "./MonthSelector";
import { AccountMenu } from "./AccountMenu";

function SidebarButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className="px-4 py-2 text-neutral-600 font-[400] bg-transparent hover:text-ink hover:bg-neutral-100/70 disabled:bg-brand/10 disabled:text-brand rounded-full cursor-pointer w-full"
            {...props}
        >
            {props.children}
        </button>
    )
}

type SidebarProps = {
    // Drawer state on small screens (< lg). On lg and up the sidebar is always visible.
    open: boolean
    onClose: () => void
    // Used by the swipe gesture (useDrawerSwipe) to move them while dragging
    navRef?: React.Ref<HTMLElement>
    backdropRef?: React.Ref<HTMLDivElement>
}

export function Sidebar({ navRef, backdropRef, ...props }: SidebarProps) {
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);

    const authContext = useAuth();

    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { currentDate } = useDate();

    function logout() {
        props.onClose();
        navigate("/");
        authContext.logout();
    }

    // Navigates and closes the mobile drawer.
    function goTo(path: string) {
        props.onClose();
        navigate(path);
    }

    function openExpenseModal() {
        props.onClose();
        setExpenseModalOpen(true);
    }

    function handleNewExpense() {
        setExpenseModalOpen(false);
        queryClient.refetchQueries({ queryKey: [expensesByMonthQuery(currentDate).queryKey[0]] });
    }

    return (
        <>
            {expenseModalOpen ?
                <AddOrEditExpenseModal
                    onClose={() => {
                        setExpenseModalOpen(false);
                    }}
                    onSuccess={handleNewExpense}
                />
                : null}

            {/* Mobile only: backdrop that closes the drawer. Always rendered (invisible and click-through
                when closed) so it can fade in while the drawer is dragged open. */}
            <div
                ref={backdropRef}
                className={`lg:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${props.open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={props.onClose}
            />

            {/* Mobile only: floating "add expense" button */}
            <button
                aria-label="Adicionar despesa"
                className="lg:hidden fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex justify-center items-center size-14 rounded-full cursor-pointer text-brand-cream bg-brand shadow-brand/25 shadow-lg"
                onClick={openExpenseModal}
            >
                <Plus size={24} strokeWidth={2.5} />
            </button>

            <nav
                ref={navRef}
                className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between items-center w-70 h-dvh overflow-y-auto bg-white border-r-1 border-slate-200 transition-transform duration-200 lg:translate-x-0 ${props.open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="w-full">
                    <div className="flex justify-start items-center gap-2 px-6 h-20 w-full mt-[env(safe-area-inset-top)]">
                        <Icon />
                        <div className="flex flex-col">
                            <span className="text-ink text-[16px] font-[600]">Anotado</span>
                            <span className="text-neutral-600 text-[11px]/3">Pro</span>
                        </div>
                    </div>

                    {/* Hidden below lg: the floating "+" button adds expenses there */}
                    <div className="hidden lg:block px-6 py-2">
                        <Button variant="primary" onClick={openExpenseModal}>
                            <div className="flex items-center gap-2">
                                <Plus size={16} strokeWidth={3} />
                                <span>Adicionar despesa</span>
                            </div>
                        </Button>
                    </div>

                    {/* Hidden below lg: the top bar has the same month selector */}
                    <div className="hidden lg:block">
                        <MonthSelector />
                    </div>

                    <div className="flex flex-col font-semibold py-4 px-4 gap-2">
                        <SidebarButton disabled={pathname === "/dashboard" ? true : false} onClick={() => goTo("/dashboard")}>
                            <div className="flex gap-2 items-center">
                                <LayoutDashboard size={16} />
                                <span className="text-sm">Dashboard</span>
                            </div>
                        </SidebarButton>

                        <SidebarButton disabled={pathname === "/incomes" ? true : false} onClick={() => goTo("/incomes")}>
                            <div className="flex gap-2 items-center">
                                <BanknoteArrowUp size={16} />
                                <span className="text-sm">Entradas</span>
                            </div>
                        </SidebarButton>

                        <SidebarButton disabled={pathname === "/expenses" ? true : false} onClick={() => goTo("/expenses")}>
                            <div className="flex gap-2 items-center">
                                <BanknoteArrowDown size={16} />
                                <span className="text-sm">Saídas</span>
                            </div>
                        </SidebarButton>

                        <SidebarButton disabled={pathname === "/recurrences" ? true : false} onClick={() => goTo("/recurrences")}>
                            <div className="flex gap-2 items-center">
                                <Repeat size={16} />
                                <span className="text-sm">Recorrências</span>
                            </div>
                        </SidebarButton>

                        <SidebarButton disabled={pathname === "/cards" ? true : false} onClick={() => goTo("/cards")}>
                            <div className="flex gap-2 items-center">
                                <CreditCard size={16} />
                                <span className="text-sm">Cartões</span>
                            </div>
                        </SidebarButton>

                        <SidebarButton disabled={pathname === "/categories" ? true : false} onClick={() => goTo("/categories")}>
                            <div className="flex gap-2 items-center">
                                <Tags size={16} />
                                <span className="text-sm">Categorias</span>
                            </div>
                        </SidebarButton>
                    </div>
                </div>

                <div className="w-full">
                    <div className="flex gap-2 m-4 p-4 border-1 border-slate-200 rounded-2xl bg-brand/5">
                        <div className="flex justify-center items-center rounded-full size-8 bg-brand/10 text-brand">
                            <Users size={16} />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-ink text-[12px] font-[500]">{authContext.user?.group?.title}</span>
                            <span className="text-neutral-600 text-[9px]/3">{authContext.user?.group?.totalMembers} membro{authContext.user?.group?.totalMembers === 1 ? "" : "s"}</span>
                        </div>
                    </div>


                    <AccountMenu onNavigate={goTo} onLogout={logout} />
                </div>
            </nav>
        </>
    )
}