import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Circle, CreditCard, Pencil, Plus, Repeat, Ticket, Wallet, XCircle } from 'lucide-react';
import type { Recurrence } from '../api/types/recurrence';
import { cancelRecurrence } from '../api/services/recurrence.service';
import { recurrencesQuery, invalidateAfterRecurrenceChange } from '../queries/recurrences';
import { AddOrEditRecurrenceModal } from '../components/modals/AddOrEditRecurrenceModal';
import DeleteModal from '../components/modals/DeleteConfirmModal';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CardSkeleton } from '../components/CardSkeleton';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../hooks/useToast';
import { formatMoney, PAYMENT_METHOD_MAP, UNCATEGORIZED_COLOR, UNCATEGORIZED_TITLE } from '../utils';

type Filter = "ACTIVE" | "ENDED";

// Dates come as UTC midnight ("2026-12-04T00:00:00.000Z"). Show them in UTC so Brazil (UTC-3) never sees the day before.
const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString("pt-BR", { timeZone: "UTC" });

const STATUS_BADGE = {
    ACTIVE: { label: "Ativa", variant: "success" },
    FINISHED: { label: "Encerrada", variant: "default" },
    CANCELED: { label: "Cancelada", variant: "danger" }
} as const;

function RecurrencesSkeleton() {
    return (
        <CardSkeleton padding={{ left: 0, right: 0 }}>
            <div className="flex flex-col">
                {[0, 1, 2, 3].map(index => (
                    <div
                        key={`recurrences-skeleton-row-${index}`}
                        className="flex justify-between items-center py-3 px-6 gap-6 border-b-1 border-slate-200 last:border-0"
                    >
                        <div className="flex flex-col gap-2 flex-2">
                            <LoadingSkeleton className="h-5 w-40 rounded-lg" />
                            <LoadingSkeleton className="h-3 w-24 rounded-lg" />
                        </div>

                        {[0, 1, 2, 3, 4].map(column => (
                            <div key={`recurrences-skeleton-col-${index}-${column}`} className="flex-1">
                                <LoadingSkeleton className="h-4 w-20 rounded-lg" />
                            </div>
                        ))}

                        <div className="w-16" />
                    </div>
                ))}
            </div>
        </CardSkeleton>
    );
}

function FilterButton(props: { selected: boolean, onClick: () => void, children: React.ReactNode }) {
    return (
        <button
            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${props.selected ? "bg-green-900/10 text-emerald-900" : "bg-gray-100 text-gray-700 hover:bg-green-50"}`}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    );
}

export default function Main() {
    const { addToast } = useToast();

    const query = useQuery(recurrencesQuery());

    const [filter, setFilter] = useState<Filter>("ACTIVE");
    const [selectedRecurrence, setSelectedRecurrence] = useState<Recurrence>();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [canceling, setCanceling] = useState(false);

    const active = query.data?.filter(recurrence => recurrence.status === "ACTIVE") ?? [];
    const ended = query.data?.filter(recurrence => recurrence.status !== "ACTIVE") ?? [];
    const visible = filter === "ACTIVE" ? active : ended;

    // Sum of active installment values in integer cents ("150.00" -> 15000): exact, no float.
    const activeMonthlyCents = active.reduce((acc, recurrence) => acc + Number(recurrence.amount.replace(/\D/g, "")), 0);

    function closeModals() {
        setSelectedRecurrence(undefined);
        setAddModalOpen(false);
        setCancelModalOpen(false);
    }

    async function handleSaved() {
        closeModals();
        await invalidateAfterRecurrenceChange();
    }

    async function cancelSelectedRecurrence() {
        if (!selectedRecurrence || canceling) return;

        setCanceling(true);
        try {
            await cancelRecurrence(selectedRecurrence.id);
            addToast(`Recorrência "${selectedRecurrence.title}" cancelada!`, "info");
            closeModals();
            await invalidateAfterRecurrenceChange();
        } catch {
            addToast(`Falha ao cancelar "${selectedRecurrence.title}"!`, "error");
        } finally {
            setCanceling(false);
        }
    }

    function cancelDescription(recurrence: Recurrence) {
        if (recurrence.futureCount === 0) return "Nenhuma parcela futura será removida. A recorrência deixará de gerar novas parcelas.";

        const plural = recurrence.futureCount > 1;
        const fromDate = recurrence.nextDueDate ? ` (a partir de ${formatDate(recurrence.nextDueDate)})` : "";

        return `${plural ? "As" : "A"} ${recurrence.futureCount} parcela${plural ? "s" : ""} futura${plural ? "s" : ""}${fromDate} ser${plural ? "ão removidas" : "á removida"}. As parcelas já vencidas são mantidas. Essa ação não pode ser desfeita.`;
    }

    return (
        <>
            {addModalOpen ?
                <AddOrEditRecurrenceModal
                    onClose={closeModals}
                    onSuccess={handleSaved}
                    data={selectedRecurrence}
                />
                : null}

            {cancelModalOpen && selectedRecurrence ?
                <DeleteModal
                    title={`Cancelar a recorrência "${selectedRecurrence.title}"?`}
                    description={cancelDescription(selectedRecurrence)}
                    onDelete={cancelSelectedRecurrence}
                    onClose={closeModals}
                />
                : null}

            <div className="flex flex-col items-center w-full">
                <div className="flex justify-between items-center mb-4 w-full">
                    <div className="flex flex-col">
                        <span className="text-3xl font-[600]">
                            Recorrências
                        </span>
                        {query.isPending ?
                            <LoadingSkeleton className="h-4 w-56 rounded-lg my-1" />
                            :
                            <span className="text-sm/6 text-neutral-600">
                                {`${active.length} ativa${active.length === 1 ? "" : "s"} · ${formatMoney(String(activeMonthlyCents))} por mês`}
                            </span>
                        }
                    </div>

                    <div className="w-max">
                        <Button
                            variant="primary"
                            onClick={() => {
                                setSelectedRecurrence(undefined);
                                setAddModalOpen(true);
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Plus size={16} strokeWidth={3} />
                                Nova recorrência
                            </div>
                        </Button>
                    </div>
                </div>

                {query.isPending ?
                    <div className="w-full">
                        <RecurrencesSkeleton />
                    </div>
                    : query.isError ?
                        <div className="w-full">
                            <CardSkeleton>
                                <div className="flex flex-col gap-4 justify-center items-center py-12">
                                    <span className="text-lg font-[600]">Não foi possível carregar as recorrências</span>
                                    <div className="w-max">
                                        <Button variant="secondary" onClick={() => query.refetch()}>Tentar novamente</Button>
                                    </div>
                                </div>
                            </CardSkeleton>
                        </div>
                        :
                        <div className="w-full">
                            <CardSkeleton padding={{ left: 0, right: 0 }}>
                                <div className="flex items-center border-b-1 border-slate-200 pl-6 pb-4 gap-2">
                                    <FilterButton selected={filter === "ACTIVE"} onClick={() => setFilter("ACTIVE")}>
                                        {`Ativas (${active.length})`}
                                    </FilterButton>
                                    <FilterButton selected={filter === "ENDED"} onClick={() => setFilter("ENDED")}>
                                        {`Encerradas e canceladas (${ended.length})`}
                                    </FilterButton>
                                </div>

                                {visible.length ?
                                    <div className="flex flex-col">
                                        <div className="flex justify-between items-center py-3 px-6 gap-6 border-b-1 border-slate-200 text-xs font-[600] text-neutral-500">
                                            <span className="flex-2">DESCRIÇÃO</span>
                                            <span className="flex-1">CATEGORIA</span>
                                            <span className="flex-1">PAGAMENTO</span>
                                            <span className="flex-1">PARCELA</span>
                                            <span className="flex-1">PROGRESSO</span>
                                            <span className="flex-1">PRÓXIMO VENC.</span>
                                            <span className="flex-1">RESTANTE</span>
                                            <span className="w-16" />
                                        </div>

                                        {visible.map(recurrence => {
                                            const paymentMethodIcon = recurrence.paymentMethod === "CREDIT" ?
                                                <CreditCard size={16} /> : recurrence.paymentMethod === "DEBIT" ?
                                                    <Wallet size={16} /> :
                                                    <Ticket size={16} />;
                                            const paymentMethodBadgeVariant = recurrence.paymentMethod === "CREDIT" ? "success" : recurrence.paymentMethod === "DEBIT" ? "info" : "default";
                                            const status = STATUS_BADGE[recurrence.status];

                                            return (
                                                <div
                                                    key={recurrence.id}
                                                    className="flex justify-between w-full items-center py-3 px-6 gap-6 border-b-1 border-slate-200 last:border-0 last:pb-0"
                                                >
                                                    <div className="flex flex-col flex-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-[600]">{recurrence.title}</span>
                                                            <Badge variant={status.variant}>{status.label}</Badge>
                                                        </div>
                                                        <span className="text-[11px] text-neutral-600">
                                                            {recurrence.description || `Desde ${formatDate(recurrence.startDate)}`}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Circle size={10} color={`#${recurrence.category?.color ?? UNCATEGORIZED_COLOR}`} fill={`#${recurrence.category?.color ?? UNCATEGORIZED_COLOR}`} />
                                                        <span className="text-sm text-neutral-600">{recurrence.category?.title ?? UNCATEGORIZED_TITLE}</span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <Badge variant={paymentMethodBadgeVariant}>
                                                            <div className="flex gap-2">
                                                                {paymentMethodIcon}
                                                                {PAYMENT_METHOD_MAP[recurrence.paymentMethod]}
                                                            </div>
                                                        </Badge>
                                                    </div>

                                                    <div className="flex-1">
                                                        <span className="font-semibold text-sm text-red-500">
                                                            {`-${formatMoney(recurrence.amount)}`}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <span className="text-neutral-600 text-sm">
                                                            {recurrence.totalInstallments === null ?
                                                                <span className="flex items-center gap-1"><Repeat size={14} /> Sem fim</span>
                                                                : `${recurrence.pastCount} de ${recurrence.totalInstallments} vencidas`}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <span className="text-neutral-600 text-sm">
                                                            {recurrence.nextDueDate ? formatDate(recurrence.nextDueDate) : "—"}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <span className="text-neutral-600 text-sm">
                                                            {recurrence.remainingAmount !== null ? formatMoney(recurrence.remainingAmount) : "—"}
                                                        </span>
                                                    </div>

                                                    <div className="flex w-16 justify-end gap-1">
                                                        {recurrence.status === "ACTIVE" ?
                                                            <>
                                                                <button
                                                                    title="Editar"
                                                                    className="flex justify-center items-center size-8 rounded-full text-neutral-600 hover:bg-slate-200/40 cursor-pointer"
                                                                    onClick={() => {
                                                                        setSelectedRecurrence(recurrence);
                                                                        setAddModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    title="Cancelar recorrência"
                                                                    className="flex justify-center items-center size-8 rounded-full text-red-500 hover:bg-red-100/50 cursor-pointer"
                                                                    onClick={() => {
                                                                        setSelectedRecurrence(recurrence);
                                                                        setCancelModalOpen(true);
                                                                    }}
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </>
                                                            : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    :
                                    <div className="flex flex-col gap-4 justify-center items-center py-12">
                                        <div className="flex items-center justify-center size-16 bg-neutral-100/60 rounded-full text-neutral-500">
                                            <Repeat size={24} />
                                        </div>

                                        <span className="text-lg font-[600]">
                                            {filter === "ACTIVE" ? "Nenhuma recorrência ativa" : "Nenhuma recorrência encerrada"}
                                        </span>

                                        <span className="text-sm text-center w-2/5">
                                            {filter === "ACTIVE" ?
                                                "Cadastre compras parceladas, aluguel ou assinaturas uma vez só. Cada parcela aparece em Saídas no mês do vencimento."
                                                : "Recorrências que terminaram ou foram canceladas aparecem aqui."}
                                        </span>
                                    </div>
                                }
                            </CardSkeleton>
                        </div>
                }
            </div>
        </>
    );
}
