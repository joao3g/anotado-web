import { CreditCard, Ticket, Wallet } from "lucide-react";
import { Badge } from "./Badge";
import { PAYMENT_METHOD_MAP } from "../utils";
import { cardLabel } from "../api/types/card";
import type { ExpenseCard, PaymentMethod } from "../api/types/expense";

type PaymentMethodBadgeProps = {
    paymentMethod: typeof PaymentMethod[keyof typeof PaymentMethod]
    card?: ExpenseCard | null // Set only for CREDIT
}

// Payment method badge. For CREDIT, the card shows in a popup on hover, or on focus (tap / Tab) for touch and keyboard.
export function PaymentMethodBadge(props: PaymentMethodBadgeProps) {
    const icon = props.paymentMethod === "CREDIT" ?
        <CreditCard size={16} /> : props.paymentMethod === "DEBIT" ?
            <Wallet size={16} /> :
            <Ticket size={16} />;

    const variant = props.paymentMethod === "CREDIT" ? "success" : props.paymentMethod === "DEBIT" ? "info" : "default";

    return (
        <div
            className={`relative inline-block group ${props.card ? "cursor-default" : ""}`}
            tabIndex={props.card ? 0 : undefined}
        >
            <Badge variant={variant}>
                <div className="flex gap-2">
                    {icon}
                    {PAYMENT_METHOD_MAP[props.paymentMethod]}
                </div>
            </Badge>

            {props.card ?
                <div className="absolute bottom-full left-0 mb-2 z-50 hidden group-hover:flex group-focus:flex flex-col w-max px-3 py-2 bg-white border-1 border-slate-200 rounded-xl shadow-lg">
                    <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: `#${props.card.color}` }} />
                        <span className="text-xs font-[600] text-ink">{cardLabel(props.card)}</span>
                    </div>
                    <span className="text-[11px] text-neutral-600">Fecha dia {props.card.closingDay}</span>
                </div>
                : null}
        </div>
    );
}
