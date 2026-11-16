import { Circle, Edit, Trash } from "lucide-react"
import { useState } from "react"
import { amountToCents, formatMoney, getOptionsPopupPosition, UNCATEGORIZED_COLOR, UNCATEGORIZED_TITLE } from "../utils"
import { MoreOptionButton } from "./Input"
import type { Expense } from "../api/types/expense"
import { PaymentMethodBadge } from "./PaymentMethodBadge"
import { Badge } from "./Badge"

type ExpensesTableProps = {
    data: Expense[] | undefined
    onEditClick?: (expense: Expense) => void
    onDeleteClick?: (expense: Expense) => void
}

type BasicTableProps = {
    data: {
        color: string
        title: string
        description?: string[]
        valueCents: number // Integer cents
    }[]
    caption: {
        title: string
        description?: string
    }
}

export function BasicTable(props: BasicTableProps) {
    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col px-6">
                <span className="text-md font-[600]">
                    {props.caption.title}
                </span>
                {props.caption.description ?
                    <span className="text-xs text-neutral-600">
                        {props.caption.description}
                    </span>
                    : null}
            </div>

            <div>
                {
                    props.data.map((entry, index) => {
                        return (
                            <div key={`basic-table-${index}`} className="items-center py-3 px-6 border-b-1 border-slate-200 last:border-0 last:pb-0">
                                {
                                    <div className="flex justify-between items-center gap-3">
                                        <div className="flex gap-2 items-center min-w-0">
                                            <div className="size-10 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: `${entry.color}33` }}>
                                                <Circle color={entry.color} fill={entry.color} size={10} />
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-md font-[600]">
                                                    {entry.title}
                                                </span>
                                                {entry.description ? <span className="text-xs text-neutral-600">
                                                    {entry.description.map((description, index) => {
                                                        if (index === (entry.description?.length ?? 0) - 1) return description;
                                                        return `${description} · `;
                                                    })}
                                                </span> : null}
                                            </div>
                                        </div>

                                        <span className="text-red-500 font-semibold text-sm whitespace-nowrap shrink-0">-{formatMoney(String(entry.valueCents))}</span>
                                    </div>
                                }
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

export function ExpensesTable(props: ExpensesTableProps) {
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>();
    const [showMoreOptionsModal, setShowMoreOptionsModal] = useState(false);
    const [moreOptionsModalCoordinates, setMoreOptionsModalCoordinates] = useState([0, 0]);

    function handleMoreOptionsButton(e: React.MouseEvent, expense: Expense) {
        const [calcX, calcY] = getOptionsPopupPosition(e);

        document.body.classList.add("overflow-hidden");
        setSelectedExpense(expense);
        setMoreOptionsModalCoordinates([calcX, calcY]);
        setShowMoreOptionsModal(true);
    }

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="hidden xl:flex justify-between items-center py-3 px-6 border-b-1 border-slate-200 last:border-0 last:pb-0">
                <div className="flex justify-between w-full gap-6">
                    <span className="text-sm text-neutral-600 flex-2">Descrição</span>
                    <span className="text-sm text-neutral-600 flex-1">Categoria</span>
                    <span className="text-sm text-neutral-600 flex-1">Forma de pagamento</span>
                    <span className="text-sm text-neutral-600 flex-1">Data</span>
                    <span className="text-sm text-neutral-600 flex-1">Vencimento</span>
                    <span className="text-sm text-neutral-600 flex-1">Valor</span>
                    {!props.onEditClick && !props.onDeleteClick ? null : <div className="px-4" />}
                </div>

            </div>


            {showMoreOptionsModal ?
                <>
                    <div
                        className={`fixed overflow-hidden inset-0 z-999 bg-slate-900/2`}
                        onClick={() => {
                            setSelectedExpense(null);
                            setShowMoreOptionsModal(false);
                            document.body.classList.remove("overflow-hidden");
                        }}
                    />

                    <div
                        className={`fixed flex flex-col rounded-3xl w-40 bg-white z-999 border-1 border-slate-200 shadow-lg`}
                        style={{ left: moreOptionsModalCoordinates[0], top: moreOptionsModalCoordinates[1] }}
                    >
                        <button
                            className="flex items-center gap-2 border-b-1 px-4 py-2 border-slate-200 rounded-t-3xl hover:bg-slate-200/30 hover:cursor-pointer"
                            onClick={() => {
                                if (props.onEditClick && selectedExpense) {
                                    props.onEditClick(selectedExpense);
                                    setSelectedExpense(undefined);
                                    setShowMoreOptionsModal(false);
                                    document.body.classList.remove("overflow-hidden");
                                }
                            }}
                        >
                            <Edit size={16} />
                            Editar
                        </button>

                        <button
                            className="flex items-center gap-2 text-red-600 px-4 py-2 rounded-b-3xl hover:bg-slate-200/30 hover:cursor-pointer"
                            onClick={() => {
                                if (props.onDeleteClick && selectedExpense) {
                                    props.onDeleteClick(selectedExpense);
                                    setSelectedExpense(undefined);
                                    setShowMoreOptionsModal(false);
                                    document.body.classList.remove("overflow-hidden");
                                }
                            }}
                        >
                            <Trash size={16} />
                            Deletar
                        </button>
                    </div>
                </>
            : null}

            {props.data?.map((expense, index) => {
                const categoryColor = `#${expense.category?.color ?? UNCATEGORIZED_COLOR}`;
                const categoryTitle = expense.category?.title ?? UNCATEGORIZED_TITLE;
                const amountText = `-${formatMoney(String(amountToCents(expense.amount)))}`;
                // UTC: the stored date is UTC midnight, so local time (UTC-3) would show the day before.
                const formatDay = (date: string, month: "long" | "short") =>
                    (new Date(date)).toLocaleDateString("pt-BR", { day: "numeric", month, timeZone: "UTC" });
                const hasOptions = Boolean(props.onEditClick || props.onDeleteClick);

                const recurrenceBadge = expense.recurrenceId ?
                    <Badge variant="default">
                        {expense.recurrence?.totalInstallments ?
                            `${expense.installmentNumber}/${expense.recurrence.totalInstallments}`
                            : "Recorrente"}
                    </Badge>
                    : null;

                return (
                    <div
                        key={`table-row-${index}`}
                        className="w-full py-3 px-4 md:px-6 border-b-1 border-slate-200 last:border-0 last:pb-0"
                    >
                        {/* Phone and tablet layout */}
                        <div className="flex xl:hidden justify-between items-start gap-3">
                            <div className="flex flex-col gap-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-base font-[600] break-words">
                                        {expense.title}
                                    </span>
                                    {recurrenceBadge}
                                </div>

                                {expense.description ?
                                    <span className="text-[11px] text-neutral-600">
                                        {expense.description}
                                    </span>
                                    : null}

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <Circle size={10} color={categoryColor} fill={categoryColor} />
                                        <span className="text-xs text-neutral-600">{categoryTitle}</span>
                                    </div>
                                    <PaymentMethodBadge paymentMethod={expense.paymentMethod} card={expense.card} />
                                </div>

                                <span className="text-xs text-neutral-600">
                                    {`Data ${formatDay(expense.transactionDate, "short")} · Venc. ${formatDay(expense.dueDate, "short")}`}
                                </span>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="font-semibold text-sm text-red-500 whitespace-nowrap">
                                    {amountText}
                                </span>
                                {hasOptions ? <MoreOptionButton onClick={(e) => handleMoreOptionsButton(e, expense)} /> : null}
                            </div>
                        </div>

                        {/* Desktop layout (xl and up) */}
                        <div className="hidden xl:flex justify-between w-full items-center gap-6">
                            <div className="flex flex-col flex-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-[600]">
                                        {expense.title}
                                    </span>
                                    {recurrenceBadge}
                                </div>
                                <span className="text-[11px] text-neutral-600">
                                    {expense.description}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 flex-1">
                                <Circle size={10} color={categoryColor} fill={categoryColor} />
                                <span className="text-sm text-neutral-600">
                                    {categoryTitle}
                                </span>
                            </div>

                            <div className="flex-1">
                                <PaymentMethodBadge paymentMethod={expense.paymentMethod} card={expense.card} />
                            </div>

                            <div className="flex-1">
                                <span className="text-neutral-600 text-sm">
                                    {formatDay(expense.transactionDate, "long")}
                                </span>
                            </div>

                            <div className="flex-1">
                                <span className="text-neutral-600 text-sm">
                                    {formatDay(expense.dueDate, "long")}
                                </span>
                            </div>

                            <div className="flex flex-1">
                                <span className="font-semibold text-sm text-red-500">
                                    {amountText}
                                </span>
                            </div>

                            {hasOptions ? <MoreOptionButton onClick={(e) => handleMoreOptionsButton(e, expense)} /> : null}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}