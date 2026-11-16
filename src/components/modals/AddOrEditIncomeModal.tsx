import { useState } from "react";
import { Input } from "../Input";
import { Button } from "../Button";
import { X } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import type { Income } from "../../api/types/income";
import { createIncome, updateIncome } from "../../api/services/income.service";
import { amountToCents, centsToAmountString, formatMoney, inputToCents } from "../../utils";

type AddOrEditIncomeModalProps = {
    onClose: React.MouseEventHandler
    onSuccess: React.MouseEventHandler
    data?: Income
}

export function AddOrEditIncomeModal(props: AddOrEditIncomeModalProps) {

    const [title, setTitle] = useState(props.data?.title || "");
    // Integer cents: no float math in the form.
    const [amountCents, setAmountCents] = useState(props.data ? amountToCents(props.data.amount) : 0);
    // "YYYY-MM-DD" string end to end: no Date object, so Brazil (UTC-3) never shifts the day.
    // Before, 01/12 (UTC midnight) became 30/11 locally, and the backend moved it to 01/11: one month early.
    const [date, setDate] = useState(props.data?.date ? props.data.date.slice(0, 10) : new Date().toLocaleDateString("en-CA"));

    const { addToast } = useToast();

    async function insertOrUpdateIncome(e: React.MouseEvent) {
        try {
            const data = {
                title,
                // The API takes a JSON number: "150.00" -> 150. The backend rejects anything with more than 2 decimals.
                amount: Number(centsToAmountString(amountCents)),
                date
            };

            if (props.data) {
                await updateIncome({ id: props.data.id, ...data });
                addToast("Entrada editada com sucesso!", "info");
            }
            else {
                await createIncome(data);
                addToast("Entrada criada com sucesso!", "info");
            }

            props.onSuccess(e);
        } catch (e) {
            if (props.data) addToast("Erro ao editar entrada!", "error");
            else addToast("Erro ao inserir entrada!", "error");
        }
    }

    return (
        <div className="fixed inset-0 z-900 bg-black/60 flex items-center justify-center" onClick={props.onClose}>
            <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl w-[calc(100%-2rem)] max-w-xl max-h-[90dvh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
                <div className="flex flex-row justify-between">
                    <div className="flex flex-col">
                        <span className="text-xl font-[600]">
                            { props.data ? "Editar entrada" : "Nova entrada" }
                        </span>
                        <span className="text-xs text-neutral-600">
                            Descubra de onde seu dinheiro vem — Salários, trabalhos autônomos, dividendos e mais.
                        </span>
                    </div>
                    <X
                        onClick={props.onClose}
                        className="cursor-pointer"
                    />
                </div>

                <Input
                    type="text"
                    label="Descrição"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); }}
                    placeholder="Ex.: Salário"
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
                        label="Data"
                        value={date}
                        onChange={(e) => { setDate(e.target.value) }}
                    />
                </div>

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
                            onClick={(e) => insertOrUpdateIncome(e)}
                        >{ props.data ? "Editar entrada" : "Cadastrar entrada" }</Button>
                    </div>
                    {/* <Button>Cadastrar</Button> */}
                </div>
            </div>
        </div>
    );
}