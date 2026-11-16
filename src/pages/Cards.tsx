import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useLoaderData } from "react-router";
import { isAxiosError } from 'axios';
import { MoreOptionButton } from '../components/Input';
import { Button } from '../components/Button';
import { Edit, Plus, Trash } from 'lucide-react';
import DeleteModal from '../components/modals/DeleteConfirmModal';
import { useToast } from '../hooks/useToast';
import { amountToCents, formatMoney } from '../utils';
import { CardSkeleton } from '../components/CardSkeleton';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useDate } from '../hooks/useDate';
import type { Card } from '../api/types/card';
import { AddOrEditCardModal } from '../components/modals/AddOrEditCardModal';
import { deleteCard } from '../api/services/card.service';
import { cardsQuery } from '../queries/cards';
import { CardIcon } from '../components/Icon';
import { queryClient } from '../Routes';
import { expensesByMonthQuery } from '../queries/expenses';
import { invalidateAfterRecurrenceChange } from '../queries/recurrences';

export default function Main() {
    const data = useLoaderData<{
        cards: Card[]
    }>();

    const { addToast } = useToast();

    const { currentDate } = useDate();
    const [selectedCard, setSelectedCard] = useState<Card>();

    const [addOrEditModalOpen, setAddOrEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [showMoreOptionsModal, setShowMoreOptionsModal] = useState(false);
    const [moreOptionsModalCoordinates, setMoreOptionsModalCoordinates] = useState([0, 0]);

    const queries = useQueries({
        queries: [
            expensesByMonthQuery(currentDate),
            {
                ...cardsQuery(),
                initialData: data.cards
            }
        ]
    });

    const expenses = queries[0].data;
    const cards = queries[1].data;

    const isLoadingExpenses = queries[0].isPending;

    // Invoice of the selected month: expenses are already filtered by dueDate (the invoice date) on the backend.
    // Summed in integer cents, so no float rounding.
    function invoiceOf(card: Card) {
        const cardExpenses = expenses?.filter(expense => expense.card?.id === card.id) ?? [];

        return {
            count: cardExpenses.length,
            totalCents: cardExpenses.reduce((acc, expense) => acc + amountToCents(expense.amount), 0)
        };
    }

    async function deleteSelectedCard() {
        try {
            if (selectedCard) await deleteCard(selectedCard.id);

            addToast(`Cartão "${selectedCard?.title}" excluído!`, "info");

            queryClient.setQueryData(cardsQuery().queryKey, (oldValue: Card[]) =>
                oldValue.filter(card => card.id !== selectedCard?.id));

            setSelectedCard(undefined);
            setDeleteModalOpen(false);
        } catch (error) {
            // 409: the card still has expenses or recurrences.
            if (isAxiosError(error) && error.response?.status === 409) {
                addToast(`O cartão "${selectedCard?.title}" possui despesas e não pode ser excluído.`, "error");
            } else {
                addToast(`Falha ao excluir "${selectedCard?.title}"!`, "error");
            }
            setDeleteModalOpen(false);
        }
    }

    async function handleAddOrEdit(_e: React.MouseEvent, recalculatedExpenses: number) {
        setSelectedCard(undefined);
        setAddOrEditModalOpen(false);
        queryClient.refetchQueries({ queryKey: cardsQuery().queryKey });

        // Invoice dates moved: refresh Saídas, Dashboard and Recorrências in every month.
        if (recalculatedExpenses > 0) await invalidateAfterRecurrenceChange();
    }

    function handleMoreOptionsButton(e: React.MouseEvent, card: Card) {
        const calcX = e.clientX - 80;
        const calcY = e.clientY + 20;

        setSelectedCard(card);
        setMoreOptionsModalCoordinates([calcX, calcY]);
        setShowMoreOptionsModal(true);
    }

    return (
        <>
            {showMoreOptionsModal ?
                <>
                    <div
                        className={`fixed top-0 left-0 z-999 size-dvw bg-slate-900/2`}
                        onClick={() => {
                            setSelectedCard(undefined);
                            setShowMoreOptionsModal(false);
                        }}
                    />

                    <div
                        className={`absolute flex flex-col rounded-3xl w-40 bg-white z-999 border-1 border-slate-200 shadow-lg`}
                        style={{ left: moreOptionsModalCoordinates[0], top: moreOptionsModalCoordinates[1] }}
                    >
                        <button
                            className="flex items-center gap-2 border-b-1 px-4 py-2 border-slate-200 rounded-t-3xl hover:bg-slate-200/30 hover:cursor-pointer"
                            onClick={() => {
                                setAddOrEditModalOpen(true);
                                setShowMoreOptionsModal(false);
                            }}
                        >
                            <Edit size={16} />
                            Editar
                        </button>

                        <button
                            className="flex items-center gap-2 text-red-600 px-4 py-2 rounded-b-3xl hover:bg-slate-200/30 hover:cursor-pointer"
                            onClick={() => {
                                setDeleteModalOpen(true);
                                setShowMoreOptionsModal(false);
                            }}
                        >
                            <Trash size={16} />
                            Deletar
                        </button>
                    </div>
                </>
                : null}

            {addOrEditModalOpen ?
                <AddOrEditCardModal
                    onClose={() => {
                        setAddOrEditModalOpen(false);
                        setSelectedCard(undefined);
                    }}
                    onSuccess={handleAddOrEdit}
                    data={selectedCard}
                />
                : null}

            {deleteModalOpen ?
                <DeleteModal
                    title={`Deletar o cartão "${selectedCard?.title}"?`}
                    description="Só é possível excluir cartões sem despesas ou recorrências vinculadas."
                    onDelete={deleteSelectedCard}
                    onClose={() => setDeleteModalOpen(false)}
                />
                : null}

            <div className="flex flex-col grid-cols-3 items-center w-full">
                <div className="flex justify-between items-center mb-4 w-full">
                    <div className="flex flex-col">
                        <span className="text-3xl font-[600]">
                            Cartões
                        </span>
                        <span className="text-sm/6 text-neutral-600">
                            Fatura de cada cartão no mês de {currentDate.toLocaleDateString("pt-BR", { month: "long" })}.
                        </span>
                    </div>

                    <div className="w-max">
                        <Button
                            variant="primary"
                            onClick={() => setAddOrEditModalOpen(true)}
                        >
                            <div className="flex items-center gap-2">
                                <Plus size={16} strokeWidth={3} />
                                Adicionar cartão
                            </div>
                        </Button>
                    </div>
                </div>

                {cards?.length === 0 ?
                    <span className="text-sm text-neutral-600 mt-8">
                        Nenhum cartão cadastrado. Cadastre um cartão para registrar despesas no crédito.
                    </span>
                    : null}

                <div
                    className="grid grid-cols-4 gap-6 w-full"
                >
                    {
                        cards?.map(card => {
                            const invoice = invoiceOf(card);

                            return (
                                <div key={`card-div-${card.id}`} className="col-span-1">
                                    <CardSkeleton>
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-2">
                                                <CardIcon color={card.color} />

                                                <div className="flex flex-col">
                                                    <span className="text-md font-[600]">
                                                        {card.title}
                                                    </span>
                                                    <span className="text-[11px]/3 text-neutral-600">
                                                        {card.lastFourDigits ? `•••• ${card.lastFourDigits} · ` : null}Fecha dia {card.closingDay}
                                                    </span>
                                                    {isLoadingExpenses ?
                                                        <LoadingSkeleton className="h-3 w-16 rounded-lg mt-1" />
                                                        :
                                                        <span className="text-[11px]/3 text-neutral-600">
                                                            {invoice.count} transações
                                                        </span>
                                                    }
                                                </div>
                                            </div>

                                            <MoreOptionButton onClick={(e) => handleMoreOptionsButton(e, card)} />
                                        </div>

                                        {isLoadingExpenses ?
                                            <LoadingSkeleton className="h-8 w-32 rounded-lg" />
                                            :
                                            <span className="font-[600] text-2xl">{formatMoney(String(invoice.totalCents))}</span>
                                        }
                                    </CardSkeleton>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </>
    );
}
