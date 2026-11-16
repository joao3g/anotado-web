import { useEffect, useState } from "react";
import { Input, SelectCard, Select, Slider } from "../Input";
import { Button } from "../Button";
import { CreditCard, Flame, Infinity as InfinityIcon, ListOrdered, Ticket, Wallet, X } from "lucide-react";
import { listCategories } from "../../api/services/category.service";
import { listCards } from "../../api/services/card.service";
import { cardLabel } from "../../api/types/card";
import { createRecurrence, updateRecurrence } from "../../api/services/recurrence.service";
import { PaymentMethod } from "../../api/types/expense";
import type { Recurrence, RecurrenceUpdate } from "../../api/types/recurrence";
import { useToast } from "../../hooks/useToast";
import { amountToCents, centsToAmountString, formatMoney, inputToCents } from "../../utils";

type AddOrEditRecurrenceModalProps = {
    onClose: () => void
    onSuccess: () => void
    data?: Recurrence
}

const MIN_INSTALLMENTS = 2;
const MAX_INSTALLMENTS = 120;

export function AddOrEditRecurrenceModal(props: AddOrEditRecurrenceModalProps) {
    const isEdit = Boolean(props.data);

    const [paymentMethod, setPaymentMethod] = useState<typeof PaymentMethod[keyof typeof PaymentMethod] | undefined>(props.data?.paymentMethod);
    const [title, setTitle] = useState(props.data?.title || "");
    const [amountCents, setAmountCents] = useState(props.data ? amountToCents(props.data.amount) : 0);
    // "YYYY-MM-DD" string end to end: no Date object, so no time zone shift.
    const [startDate, setStartDate] = useState(props.data?.startDate.slice(0, 10) || new Date().toLocaleDateString("en-CA"));
    const [endsAfterCount, setEndsAfterCount] = useState(props.data ? props.data.totalInstallments !== null : true);
    const [installmentsInput, setInstallmentsInput] = useState(String(props.data?.totalInstallments ?? ""));
    // "" when the recurrence has no category (its category was deleted).
    const [categoryId, setCategoryId] = useState(props.data?.category?.id || "");
    const [categoryOptions, setCategoryOptions] = useState<{ value: string, title: string, selected?: boolean }[]>();
    // Only used for CREDIT, and only when creating: the card of a series is not editable (it would move invoice dates).
    const [cardId, setCardId] = useState("");
    const [cardOptions, setCardOptions] = useState<{ value: string, title: string }[]>();
    const [isEssential, setIsEssential] = useState(props.data?.isEssential || false);
    const [description, setDescription] = useState(props.data?.description || "");
    const [saving, setSaving] = useState(false);

    const { addToast } = useToast();

    const installments = Number(installmentsInput);
    const installmentsValid = Number.isInteger(installments) && installments >= MIN_INSTALLMENTS && installments <= MAX_INSTALLMENTS;

    function validate() {
        if (!paymentMethod) return "Selecione a forma de pagamento.";
        if (!title.trim()) return "Informe a descrição.";
        if (amountCents <= 0) return "Informe o valor da parcela.";
        if (!startDate) return "Informe a data da 1ª parcela.";
        if (!isEdit && endsAfterCount && !installmentsValid) return `O número de parcelas deve ser entre ${MIN_INSTALLMENTS} e ${MAX_INSTALLMENTS}.`;
        // A new series needs a category. An existing one may stay "Sem categoria".
        if (!isEdit && !categoryId) return "Selecione uma categoria.";
        // Every CREDIT series needs a card: its closing day decides each installment's invoice month.
        if (!isEdit && paymentMethod === "CREDIT" && !cardId) return cardOptions?.length ? "Selecione um cartão." : "Cadastre um cartão na página Cartões.";
        return null;
    }

    async function save() {
        const error = validate();
        if (error) return addToast(error, "error");
        if (!paymentMethod) return;

        setSaving(true);

        try {
            if (props.data) {
                // Send only what changed, so untouched fields of future installments stay as they are.
                const changes: RecurrenceUpdate = { id: props.data.id };
                if (title.trim() !== props.data.title) changes.title = title.trim();
                if (description !== (props.data.description || "")) changes.description = description;
                if (amountCents !== amountToCents(props.data.amount)) changes.amount = centsToAmountString(amountCents);
                if (categoryId && categoryId !== props.data.category?.id) changes.category = categoryId;
                if (isEssential !== Boolean(props.data.isEssential)) changes.isEssential = isEssential;

                await updateRecurrence(changes);
                addToast("Recorrência editada com sucesso!", "info");
            }
            else {
                await createRecurrence({
                    title: title.trim(),
                    description: description || undefined,
                    amount: centsToAmountString(amountCents),
                    startDate,
                    paymentMethod,
                    category: categoryId,
                    card: paymentMethod === "CREDIT" ? cardId : undefined,
                    isEssential,
                    totalInstallments: endsAfterCount ? installments : null
                });
                addToast("Recorrência criada com sucesso!", "info");
            }

            props.onSuccess();
        } catch {
            addToast(isEdit ? "Erro ao editar recorrência!" : "Erro ao criar recorrência!", "error");
        } finally {
            setSaving(false);
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
            } catch {
                addToast("Erro ao buscar categorias!", "error");
            }
        }

        async function updateCardOptions() {
            try {
                const cards = await listCards();
                setCardOptions(cards.map(card => ({ value: card.id, title: cardLabel(card) })));
            } catch {
                addToast("Erro ao buscar cartões!", "error");
            }
        }

        updateCategoriesOptions();
        if (!isEdit) updateCardOptions();
    }, []);

    return (
        <div className="fixed inset-0 z-900 bg-black/60 flex items-center justify-center" onClick={props.onClose}>
            <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl w-[calc(100%-2rem)] max-w-xl max-h-[90dvh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
                <div className="flex flex-row justify-between">
                    <div className="flex flex-col">
                        <span className="text-xl font-[600]">
                            {isEdit ? "Editar recorrência" : "Nova recorrência"}
                        </span>
                        <span className="text-xs text-neutral-600">
                            {isEdit ?
                                <>As alterações valem apenas para as parcelas futuras. <br />Para mudar forma de pagamento, data ou número de parcelas, cancele e crie de novo.</>
                                :
                                <>Compras parceladas, aluguel, assinaturas. <br />Cada parcela vira uma despesa no mês do vencimento.</>
                            }
                        </span>
                    </div>
                    <X
                        onClick={props.onClose}
                        className="cursor-pointer"
                    />
                </div>

                {isEdit ? null :
                    <div className="flex gap-2">
                        <SelectCard
                            icon={<Wallet size={16} />}
                            title="Débito"
                            description="Impacta sua carteira na data"
                            selected={paymentMethod === "DEBIT"}
                            onClick={() => setPaymentMethod("DEBIT")}
                        />

                        <SelectCard
                            icon={<CreditCard size={16} />}
                            title="Crédito"
                            description="Cada parcela em uma fatura"
                            selected={paymentMethod === "CREDIT"}
                            onClick={() => setPaymentMethod("CREDIT")}
                        />

                        <SelectCard
                            icon={<Ticket size={16} />}
                            title="Vale"
                            description="Alimentação / benefício"
                            selected={paymentMethod === "VOUCHER"}
                            onClick={() => setPaymentMethod("VOUCHER")}
                        />
                    </div>
                }

                <Input
                    type="text"
                    label="Descrição"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); }}
                    placeholder="Ex.: Geladeira, Aluguel, Streaming"
                />

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <Input
                        type="text"
                        inputMode="numeric"
                        label="Valor da parcela (R$)"
                        value={formatMoney(String(amountCents))}
                        onChange={(e) => { setAmountCents(inputToCents(e.target.value)); }}
                    />

                    <Input
                        type="date"
                        label="Data da 1ª parcela"
                        value={startDate}
                        disabled={isEdit}
                        onChange={(e) => { setStartDate(e.target.value); }}
                    />
                </div>

                {isEdit ? null :
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-[500]">Termina?</span>
                        <div className="flex gap-2">
                            <SelectCard
                                icon={<ListOrdered size={16} />}
                                title="Após N parcelas"
                                description="Compra parcelada"
                                selected={endsAfterCount}
                                onClick={() => setEndsAfterCount(true)}
                            />

                            <SelectCard
                                icon={<InfinityIcon size={16} />}
                                title="Sem fim"
                                description="Aluguel, assinaturas"
                                selected={!endsAfterCount}
                                onClick={() => setEndsAfterCount(false)}
                            />
                        </div>

                        {endsAfterCount ?
                            <Input
                                type="number"
                                label="Número de parcelas"
                                min={MIN_INSTALLMENTS}
                                max={MAX_INSTALLMENTS}
                                step={1}
                                value={installmentsInput}
                                onChange={(e) => { setInstallmentsInput(e.target.value); }}
                                placeholder="Ex.: 10"
                            />
                            : null}
                    </div>
                }

                {amountCents > 0 ?
                    <div className="px-4 py-3 bg-green-50 border-1 border-green-200 rounded-3xl text-sm text-emerald-900">
                        {isEdit || !endsAfterCount ?
                            `${formatMoney(String(amountCents))} por mês${!isEdit ? ", sem data para terminar" : ""}`
                            : installmentsValid ?
                                // Integer cents x installments: exact, no float.
                                `${installments}x de ${formatMoney(String(amountCents))} = ${formatMoney(String(amountCents * installments))}`
                                : `Informe de ${MIN_INSTALLMENTS} a ${MAX_INSTALLMENTS} parcelas`
                        }
                    </div>
                    : null}

                {isEdit && props.data?.card ?
                    <span className="text-sm text-neutral-600">
                        Cartão: <span className="font-[600]">{cardLabel(props.data.card)}</span>
                    </span>
                    : null}

                {!isEdit && paymentMethod === "CREDIT" ?
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
                                    Marque essa opção para definir essa despesa como essencial. <br />Ex.: Aluguel, contas que você não pode pular.
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
                            disabled={saving}
                            onClick={save}
                        >{saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar recorrência"}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
