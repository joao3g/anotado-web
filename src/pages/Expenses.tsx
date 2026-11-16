import type { Expense } from '../api/types/expense';
import { useEffect, useState } from 'react';
import { SearchInput } from '../components/Input';
import { Button } from '../components/Button';
import { Plus, TrendingDown } from 'lucide-react';
import DeleteModal from '../components/modals/DeleteConfirmModal';
import { useToast } from '../hooks/useToast';
import { AddOrEditExpenseModal } from '../components/modals/AddOrEditExpenseModal';
import { deleteExpense } from '../api/services/expense.service';
import { amountToCents, formatMoney, PAYMENT_METHOD_MAP, UNCATEGORIZED_TITLE } from '../utils';
import { CardSkeleton } from '../components/CardSkeleton';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/Badge';
import { ExpensesTable } from '../components/Table';
import { useDate } from '../hooks/useDate';
import { useQuery } from '@tanstack/react-query';
import { expensesByMonthQuery } from '../queries/expenses';
import { queryClient } from '../Routes';

// Same layout as the real table: search bar + badges, then rows with the same columns
function ExpensesTableSkeleton() {
    return (
        <CardSkeleton padding={{ left: 0, right: 0 }}>
            <div className="flex items-center border-b-1 border-slate-200 pl-6 pb-4 gap-2">
                <LoadingSkeleton className="h-9 w-80 rounded-full" />
                <LoadingSkeleton className="h-6 w-20 rounded-full" />
                <LoadingSkeleton className="h-6 w-14 rounded-full" />
                <LoadingSkeleton className="h-6 w-32 rounded-full" />
            </div>

            <div className="flex flex-col">
                {[0, 1, 2, 3, 4, 5].map(index => (
                    <div
                        key={`expenses-skeleton-row-${index}`}
                        className="flex justify-between items-center py-3 px-6 gap-6 border-b-1 border-slate-200 last:border-0"
                    >
                        <div className="flex flex-col gap-2 flex-2">
                            <LoadingSkeleton className="h-5 w-40 rounded-lg" />
                            <LoadingSkeleton className="h-3 w-24 rounded-lg" />
                        </div>

                        {[0, 1, 2, 3, 4].map(column => (
                            <div key={`expenses-skeleton-col-${index}-${column}`} className="flex-1">
                                <LoadingSkeleton className="h-4 w-20 rounded-lg" />
                            </div>
                        ))}

                        <div className="size-8" />
                    </div>
                ))}
            </div>
        </CardSkeleton>
    );
}

export default function Main() {
    const { addToast } = useToast();

    const { currentDate } = useDate();
    const [selectedExpense, setSelectedExpense] = useState<Expense>();

    const query = useQuery(expensesByMonthQuery(currentDate));

    // Integer cents: no float rounding in the total.
    const expensesTotalCents = query.data?.reduce((acc, expense) => acc + amountToCents(expense.amount), 0) ?? 0;

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [tableData, setTableData] = useState(handleTableData(query.data));

    useEffect(() => setTableData(handleTableData(query.data)), [query.data])

    function handleSearch() {
        let filteredExpenses = query.data;

        if (search) {
            const normalizedSearch = search.toLowerCase();

            filteredExpenses = query.data?.filter(expense =>
                expense.title.toLowerCase().includes(normalizedSearch) ||
                expense.description?.toLowerCase().includes(normalizedSearch) ||
                (expense.category?.title ?? UNCATEGORIZED_TITLE).toLowerCase().includes(normalizedSearch) ||
                formatMoney(String(amountToCents(expense.amount))).toLowerCase().includes(normalizedSearch) ||
                PAYMENT_METHOD_MAP[expense.paymentMethod]
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                (expense.card?.title ?? "").toLowerCase().includes(normalizedSearch)
            );
        }

        if (filteredExpenses) setTableData(handleTableData(filteredExpenses));
    };

    function handleTableData(expenses: Expense[] | undefined) {
        return expenses
            ?.sort((a: Expense, b: Expense) => (new Date(b.transactionDate)).getTime() - (new Date(a.transactionDate)).getTime());
    }

    function handleAddOrEdit() {
        setSelectedExpense(undefined);
        setAddModalOpen(false);
        queryClient.refetchQueries({ queryKey: expensesByMonthQuery(currentDate).queryKey });
    }

    async function deleteSelectedExpense() {
        try {
            if (selectedExpense) await deleteExpense(selectedExpense.id);

            addToast(`Despesa "${selectedExpense?.title}" excluída!`, "info");

            queryClient.setQueryData(expensesByMonthQuery(currentDate).queryKey, (oldValue: Expense[]) =>
                oldValue.filter(expense => expense.id !== selectedExpense?.id));

            setSelectedExpense(undefined);
            setDeleteModalOpen(false);
        } catch {
            addToast(`Falha ao excluir "${selectedExpense?.title}"!`, "error");
        }
    }

    return (
        <>
            {addModalOpen ?
                <AddOrEditExpenseModal
                    onClose={() => {
                        setAddModalOpen(false);
                        setSelectedExpense(undefined);
                    }}
                    onSuccess={handleAddOrEdit}
                    data={selectedExpense}
                />
                : null}

            {deleteModalOpen ?
                <DeleteModal
                    title={`Deletar a despesa "${selectedExpense?.title}"?`}
                    description="Essa despesa será permanentemente removida e seus dashboards serão atualizados imediatamente. Essa ação não pode ser desfeita."
                    onDelete={deleteSelectedExpense}
                    onClose={() => setDeleteModalOpen(false)}
                />
                : null}

            <div className="flex flex-col grid-cols-3 items-center w-full">
                <div className="flex justify-between items-center mb-4 w-full">
                    <div className="flex flex-col">
                        <span className="text-3xl font-[600]">
                            Despesas
                        </span>
                        {query.isPending ?
                            <LoadingSkeleton className="h-4 w-56 rounded-lg my-1" />
                            :
                            <span className="text-sm/6 text-neutral-600">
                                {`${query.data?.length} transações esse mês · ${formatMoney(String(expensesTotalCents))}`}
                            </span>
                        }
                    </div>

                    <div className="w-max">
                        <Button
                            variant="primary"
                            onClick={() => setAddModalOpen(true)}
                        >
                            <div className="flex items-center gap-2">
                                <Plus size={16} strokeWidth={3} />
                                Adicionar despesa
                            </div>
                        </Button>
                    </div>
                </div>

                {
                    query.isPending ?
                        <div className="w-full">
                            <ExpensesTableSkeleton />
                        </div>
                        :
                        query.data?.length ?
                            <div className="w-full">
                                <CardSkeleton padding={{ left: 0, right: 0 }}>
                                    <div className="flex items-center border-b-1 border-slate-200 pl-6 pb-4 gap-2">
                                        <div className="w-80">
                                            <SearchInput
                                                placeholder="Buscar por despesas..."
                                                onChange={(e) => setSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" ? handleSearch() : null}
                                            />
                                        </div>

                                        <Badge variant="default">
                                            <span className="font-bold">
                                                {currentDate.toLocaleDateString("pt-BR", { month: "long" })[0].toUpperCase() + currentDate.toLocaleDateString("pt-BR", { month: "long" }).slice(1)}
                                            </span>
                                        </Badge>

                                        <Badge variant="default">
                                            <span className="font-bold">
                                                {currentDate.toLocaleDateString("pt-BR", { year: "numeric" })}
                                            </span>
                                        </Badge>

                                        <Badge variant="default">
                                            <span className="font-bold">
                                                Todas as categorias
                                            </span>
                                        </Badge>
                                    </div>

                                    <div>
                                        <ExpensesTable
                                            data={tableData}
                                            onEditClick={(expense) => {
                                                setSelectedExpense(expense);
                                                setAddModalOpen(true);
                                            }}
                                            onDeleteClick={(expense) => {
                                                setSelectedExpense(expense);
                                                setDeleteModalOpen(true);
                                            }}
                                        />
                                    </div>
                                </CardSkeleton>
                            </div>
                            :
                            <div className="w-full">
                                <CardSkeleton>
                                    <div className="flex flex-col gap-4 justify-center items-center py-12">
                                        <div className="flex items-center justify-center size-16 bg-neutral-100/60 rounded-full text-neutral-500">
                                            <TrendingDown size={24} />
                                        </div>

                                        <span className="text-lg font-[600]">{`Nenhum registro em ${currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`}</span>

                                        <span className="text-sm text-center w-2/5">Nenhuma despesa foi encontrada no período selecionado. Navegue para outro mês usando o seletor na barra lateral, ou adicione uma nova despesa neste mês.</span>
                                    </div>
                                </CardSkeleton>
                            </div>
                }
            </div>
        </>
    );
}
