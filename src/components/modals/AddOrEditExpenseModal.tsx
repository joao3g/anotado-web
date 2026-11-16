import { useEffect, useState } from "react";
import { Input, SelectCard, Select, Slider } from "../Input";
import { Button } from "../Button";
import { CreditCard, Flame, Ticket, Wallet, X } from "lucide-react";
import { listCategories } from "../../api/services/category.service";
import { listCards } from "../../api/services/card.service";
import { cardLabel } from "../../api/types/card";
import { createExpense, updateExpense } from "../../api/services/expense.service";
import { PaymentMethod, type Expense } from "../../api/types/expense";
import { useToast } from "../../hooks/useToast";
import { amountToCents, centsToAmountString, formatMoney, inputToCents } from "../../utils";

type AddOrEditExpenseModalProps = {
    onClose: React.MouseEventHandler
    onSuccess: React.MouseEventHandler
    data?: Expense
}

export function AddOrEditExpenseModal(props: AddOrEditExpenseModalProps) {

    const [paymentMethod, setPaymentMethod] = useState<typeof PaymentMethod[keyof typeof PaymentMethod] | undefined>(props.data?.paymentMethod);
    const [title, setTitle] = useState(props.data?.title || "");
    // Integer cents: no float math in the form.
    const [amountCents, setAmountCents] = useState(props.data ? amountToCents(props.data.amount) : 0);
    // "YYYY-MM-DD" string end to end: no Date object, so Brazil (UTC-3) never shifts the day.
    // The API sends UTC midnight ("2026-12-05T00:00:00.000Z"), so the first 10 chars are the stored day.
    const [date, setDate] = useState(props.data?.transactionDate ? props.data.transactionDate.slice(0, 10) : new Date().toLocaleDateString("en-CA"));
    // "" when the expense has no category (its category was deleted).
    const [categoryId, setCategoryId] = useState(props.data?.category?.id || "");
    const [categoryOptions, setCategoryOptions] = useState<{ value: string, title: string, selected?: boolean }[]>();
    // Only used for CREDIT. "" = no card chosen yet.
    const [cardId, setCardId] = useState(props.data?.card?.id || "");
    const [cardOptions, setCardOptions] = useState<{ value: string, title: string, selected?: boolean }[]>();
    const [isEssential, setIsEssential] = useState(props.data?.isEssential || false);
    const [description, setDescription] = useState(props.data?.description || "");

    const { addToast } = useToast();

    async function insertOrUpdateExpense(e: React.MouseEvent) {
        // A new expense needs a category. An existing one may stay "Sem categoria".
        if (!props.data && !categoryId) return addToast("Selecione uma categoria.", "error");
        // Every CREDIT expense needs a card: its closing day decides the invoice month.
        if (paymentMethod === "CREDIT" && !cardId) {
            return addToast(cardOptions?.length ? "Selecione um cartão." : "Cadastre um cartão na página Cartões.", "error");
        }

        try {
            if (paymentMethod) {
                const data = {
                    title,
                    description,
                    // The API takes a JSON number: "150.00" -> 150. The backend rejects anything with more than 2 decimals.
                    amount: Number(centsToAmountString(amountCents)),
                    date,
                    paymentMethod
                };

                if (props.data) {
                    // No category selected = not sent, so the backend keeps the current value (no category).
                    // Card sent only when it changed (CREDIT only): the backend recomputes the invoice date when it is sent.
                    const card = paymentMethod === "CREDIT" && cardId !== props.data.card?.id ? cardId : undefined;
                    await updateExpense({ id: props.data.id, ...data, category: categoryId || undefined, card });
                    addToast("Despesa editada com sucesso!", "info");
                }
                else {
                    await createExpense({ ...data, category: categoryId, card: paymentMethod === "CREDIT" ? cardId : undefined });
                    addToast("Despesa criada com sucesso!", "info");
                }

                props.onSuccess(e);
            }
        } catch (e) {
            addToast("Erro ao inserir despesa!", "error");
        }
    }

    useEffect(() => {
        async function updateCategoriesOptions() {
            try {
                const categories = await listCategories();
                if (categories.length > 0) {
                    setCategoryOptions(categories.map(category => ({ 
                        value: category.id, 
                        title: category.title, 
                        selected: category.id === props.data?.category?.id
                    })));
                }
            } catch (e) {
                addToast("Erro ao buscar categorias!", "error");
            }
        }

        async function updateCardOptions() {
            try {
                const cards = await listCards();
                setCardOptions(cards.map(card => ({
                    value: card.id,
                    title: cardLabel(card),
                    selected: card.id === props.data?.card?.id
                })));
            } catch (e) {
                addToast("Erro ao buscar cartões!", "error");
            }
        }

        updateCategoriesOptions();
        updateCardOptions();

    }, []);

    return (
        <div className="fixed inset-0 z-900 bg-black/60 flex items-center justify-center" onClick={props.onClose}>
            <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl w-[calc(100%-2rem)] max-w-xl max-h-[90dvh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
                <div className="flex flex-row justify-between">
                    <div className="flex flex-col">
                        <span className="text-xl font-[600]">
                            { props.data ? "Editar despesa" : "Nova despesa" }
                        </span>
                        <span className="text-xs text-neutral-600">
                            Mapeie o que você gasta. <br />Compras no crédito são debitadas apenas na data de vencimento.
                        </span>
                    </div>
                    <X
                        onClick={props.onClose}
                        className="cursor-pointer"
                    />
                </div>

                <div className="flex gap-2">
                    <SelectCard
                        icon={<Wallet size={16} />}
                        title="Débito"
                        description="Impacta sua carteira hoje"
                        selected={paymentMethod === "DEBIT" ? true : false}
                        onClick={() => setPaymentMethod("DEBIT")}
                    />

                    <SelectCard
                        icon={<CreditCard size={16} />}
                        title="Crédito"
                        description="Impacta na próxima fatura"
                        selected={paymentMethod === "CREDIT" ? true : false}
                        onClick={() => setPaymentMethod("CREDIT")}
                    />

                    <SelectCard
                        icon={<Ticket size={16} />}
                        title="Vale"
                        description="Alimentação / benefício"
                        selected={paymentMethod === "VOUCHER" ? true : false}
                        onClick={() => setPaymentMethod("VOUCHER")}
                    />
                </div>

                <Input
                    type="text"
                    label="Descrição"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); }}
                    placeholder="Ex.: Feira da semana"
                />

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <Input
                        type="text"
                        label="Valor (R$)"
                        inputMode="numeric"
                        value={formatMoney(String(amountCents))}
                        onChange={(e) => { setAmountCents(inputToCents(e.target.value)); }}
                    />

                    <Input
                        type="date"
                        label="Data da saída"
                        value={date}
                        onChange={(e) => { setDate(e.target.value) }}
                    />
                </div>

                {paymentMethod === "CREDIT" ?
                    (cardOptions && cardOptions.length === 0 ?
                        <span className="text-xs text-orange-600">
                            Nenhum cartão cadastrado. Cadastre um cartão na página Cartões para registrar compras no crédito.
                        </span>
                        :
                        <Select
                            label="Cartão"
                            options={cardOptions}
                            onChange={(e) => { setCardId(e.target.value); }}
                        />
                    )
                    : null}

                <Select
                    label="Categoria"
                    options={categoryOptions}
                    onChange={(e) => { setCategoryId(e.target.value); }}
                />

                <div className="flex justify-between items-center w-full p-4 bg-slate-50/50 border-slate-200 border-1 rounded-3xl">
                    <div className="flex gap-2 items-center">
                        <div className="flex items-center justify-center size-10 bg-orange-100/60 rounded-full text-orange-500">
                            <Flame size={18} />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-md font-[600]">
                                Despesa essencial
                            </span>
                            <span className="text-[11px] text-neutral-600">
                                Marque essa opção para definir essa despesa como essencial. <br />Ex.: Aluguel, compras, contas que você não pode pular.
                            </span>
                        </div>
                    </div>
                    <Slider
                        checked={isEssential}
                        onChange={() => setIsEssential(!isEssential)}
                    />
                </div>

                <Input
                    type="text"
                    label="Anotação (Opcional)"
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); }}
                    placeholder="Adicione uma anotação..."
                />

                <div className="flex flex-row justify-end gap-x-3 mt-2">
                    <div>
                        <Button
                            variant="secondary"
                            onClick={props.onClose}
                        >Cancelar</Button>
                    </div>

                    <div>
                        <Button
                            variant="primary"
                            onClick={(e) => insertOrUpdateExpense(e)}
                        >{ props.data ? "Editar despesa" : "Cadastrar despesa" }</Button>
                    </div>
                    {/* <Button>Cadastrar</Button> */}
                </div>
            </div>
        </div>
    );
}