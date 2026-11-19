import { useState } from "react";
import { Input } from "../Input";
import { Button } from "../Button";
import { TriangleAlert, X } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { createCard, updateCard } from "../../api/services/card.service";
import { cardLabel, type Card } from "../../api/types/card";
import { CardIcon } from "../Icon";
import { ColorPicker } from "../ColorPicker";

type AddOrEditCardModalProps = {
    onClose: React.MouseEventHandler
    onSuccess: (e: React.MouseEvent, recalculatedExpenses: number) => void
    data?: Card
}

export function AddOrEditCardModal(props: AddOrEditCardModalProps) {

    const [title, setTitle] = useState(props.data?.title || "");
    // Strings: "0123" keeps its leading zero, and the day inputs can be empty while typing.
    const [lastFourDigits, setLastFourDigits] = useState(props.data?.lastFourDigits || "");
    const [closingDay, setClosingDay] = useState(props.data ? String(props.data.closingDay) : "");
    const [dueDay, setDueDay] = useState(props.data ? String(props.data.dueDay) : "");
    const [color, setColor] = useState(props.data?.color || "");

    const { addToast } = useToast();

    const closingDayNumber = Number(closingDay);
    const dueDayNumber = Number(dueDay);
    const daysChanged = props.data !== undefined && (
        (closingDay !== "" && closingDayNumber !== props.data.closingDay) ||
        (dueDay !== "" && dueDayNumber !== props.data.dueDay)
    );

    function validate() {
        if (!title.trim()) return "Informe o nome do cartão.";
        if (lastFourDigits && !/^\d{4}$/.test(lastFourDigits)) return "Os últimos dígitos devem ter 4 números.";
        if (!color) return "Selecione uma cor.";
        if (closingDay === "" || !Number.isInteger(closingDayNumber) || closingDayNumber < 1 || closingDayNumber > 27) return "O dia de fechamento deve ser entre 1 e 27.";
        // 1..28: the due day must exist in every month.
        if (dueDay === "" || !Number.isInteger(dueDayNumber) || dueDayNumber < 1 || dueDayNumber > 28) return "O dia de vencimento deve ser entre 1 e 28.";
        return null;
    }

    async function insertOrUpdateCard(e: React.MouseEvent) {
        const error = validate();
        if (error) return addToast(error, "error");

        try {
            if (props.data) {
                // "" clears the digits on the backend.
                const result = await updateCard({ id: props.data.id, title: title.trim(), lastFourDigits, color, closingDay: closingDayNumber, dueDay: dueDayNumber });
                addToast(
                    result.recalculatedExpenses > 0
                        ? `Cartão editado! ${result.recalculatedExpenses} despesa(s) com vencimento futuro recalculada(s).`
                        : "Cartão editado com sucesso!",
                    "info"
                );
                props.onSuccess(e, result.recalculatedExpenses);
            }
            else {
                await createCard({ title: title.trim(), lastFourDigits: lastFourDigits || undefined, color, closingDay: closingDayNumber, dueDay: dueDayNumber });
                addToast("Cartão criado com sucesso!", "info");
                props.onSuccess(e, 0);
            }
        } catch {
            if (props.data) addToast("Erro ao editar cartão!", "error");
            else addToast("Erro ao inserir cartão!", "error");
        }
    }

    return (
        <div className="fixed inset-0 z-900 bg-black/60 flex items-center justify-center" onClick={props.onClose}>
            <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl w-[calc(100%-2rem)] max-w-xl max-h-[90dvh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
                <div className="flex flex-row justify-between">
                    <div className="flex flex-col">
                        <span className="text-xl font-[600]">
                            {props.data ? "Editar cartão" : "Novo cartão"}
                        </span>
                        <span className="text-xs text-neutral-600">
                            Compras no crédito entram na fatura pelo dia de fechamento e aparecem no mês do vencimento.
                        </span>
                    </div>
                    <X
                        onClick={props.onClose}
                        className="cursor-pointer"
                    />
                </div>

                <Input
                    type="text"
                    label="Nome"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); }}
                    placeholder="Ex.: Nubank"
                />

                <Input
                    type="text"
                    label="Últimos 4 dígitos (Opcional)"
                    inputMode="numeric"
                    maxLength={4}
                    value={lastFourDigits}
                    onChange={(e) => { setLastFourDigits(e.target.value.replace(/\D/g, "").slice(0, 4)); }}
                    placeholder="Ex.: 1234"
                />

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <Input
                        type="text"
                        label="Dia de fechamento"
                        inputMode="numeric"
                        maxLength={2}
                        value={closingDay}
                        onChange={(e) => { setClosingDay(e.target.value.replace(/\D/g, "").slice(0, 2)); }}
                        placeholder="1 a 27"
                    />

                    <Input
                        type="text"
                        label="Dia de vencimento"
                        inputMode="numeric"
                        maxLength={2}
                        value={dueDay}
                        onChange={(e) => { setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2)); }}
                        placeholder="1 a 28"
                    />
                </div>

                {daysChanged ?
                    <div className="flex gap-2 items-center p-4 bg-orange-50 border-1 border-orange-200 rounded-3xl text-orange-700">
                        <TriangleAlert size={18} className="shrink-0" />
                        <span className="text-xs">
                            Despesas com vencimento futuro neste cartão serão recalculadas com os novos dias. Despesas já vencidas não mudam.
                        </span>
                    </div>
                    : null}

                <ColorPicker value={color} onChange={setColor} />

                <div className="flex flex-col gap-2">
                    <span className="font-[500] text-sm">Preview</span>
                    <div className="flex justify-between items-center w-full p-4 bg-slate-50/50 border-slate-200 border-1 rounded-3xl">
                        <div className="flex gap-2 items-center">
                            {color ?
                                <CardIcon color={color} />
                                : <div className="size-10 rounded-full bg-slate-200" />}

                            <div className="flex flex-col">
                                <span className="text-md font-[600]">
                                    {title ? cardLabel({ title, lastFourDigits: lastFourDigits.length === 4 ? lastFourDigits : null }) : "Nome do cartão"}
                                </span>
                                <span className="text-[11px]/2 text-neutral-600">
                                    {closingDay || dueDay ? `Fecha dia ${closingDay || "?"} · vence dia ${dueDay || "?"}` : "Dias de fechamento e vencimento"}
                                </span>
                            </div>
                        </div>
                    </div>
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
                            onClick={(e) => insertOrUpdateCard(e)}
                        >{props.data ? "Editar cartão" : "Cadastrar cartão"}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
