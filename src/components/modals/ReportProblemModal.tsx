import { useState } from "react";
import { Bug, MessageSquareWarning, X } from "lucide-react";
import { Button } from "../Button";
import { useToast } from "../../hooks/useToast";
import { sendFeedback, type FeedbackType } from "../../api/services/feedback.service";
import { getApiErrorMessage } from "../../api/services/client";

const MIN_CHARS = 10;
const MAX_CHARS = 2000;

const TYPES: { value: FeedbackType, label: string, icon: typeof Bug }[] = [
    { value: "BUG", label: "Problema no app", icon: Bug },
    { value: "COMPLAINT", label: "Reclamação", icon: MessageSquareWarning }
];

// Characters as the API counts them (an emoji is 1).
const charCount = (text: string) => [...text.trim()].length;

type ReportProblemModalProps = {
    onClose: () => void
}

// "Reportar problema" from the account menu. Sent with the current page and browser to help find bugs.
export function ReportProblemModal(props: ReportProblemModalProps) {
    const { addToast } = useToast();

    const [type, setType] = useState<FeedbackType>("BUG");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const count = charCount(message);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (count < MIN_CHARS) return addToast(`Escreva pelo menos ${MIN_CHARS} caracteres.`, "error");
        if (count > MAX_CHARS) return addToast(`A mensagem pode ter no máximo ${MAX_CHARS} caracteres.`, "error");

        setSending(true);
        try {
            // Only the path: no query string or hash (a reset link token, for example).
            await sendFeedback({ type, message: message.trim(), page: window.location.pathname, userAgent: navigator.userAgent });
            addToast("Obrigado! Recebemos sua mensagem.", "success");
            props.onClose();
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível enviar. Tente de novo."), "error");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="fixed inset-0 z-900 bg-black/60 flex items-center justify-center" onClick={props.onClose}>
            <form
                className="flex flex-col gap-4 bg-white p-6 rounded-2xl w-[calc(100%-2rem)] max-w-xl max-h-[90dvh] overflow-y-auto"
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <div className="flex flex-row justify-between">
                    <div className="flex flex-col">
                        <span className="text-xl font-[600]">Reportar problema</span>
                        <span className="text-xs text-neutral-600">Conte o que aconteceu. Lemos todas as mensagens.</span>
                    </div>
                    <X onClick={props.onClose} className="cursor-pointer shrink-0" aria-label="Fechar" />
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-sm font-[500]">Tipo</span>
                    <div className="flex gap-2" role="radiogroup" aria-label="Tipo">
                        {TYPES.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={type === option.value}
                                className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-full text-sm cursor-pointer border-1 ${type === option.value ? "bg-brand/10 border-brand text-brand font-[600]" : "bg-white border-slate-200 text-neutral-700 hover:bg-neutral-100"}`}
                                onClick={() => setType(option.value)}
                            >
                                <option.icon size={16} />
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="report-message" className="text-sm font-[500]">Mensagem</label>
                    <textarea
                        id="report-message"
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={type === "BUG" ? "O que você estava fazendo e o que deu errado?" : "Conte o que não está bom para você."}
                        className="px-4 py-3 bg-white rounded-2xl shadow-black-100 shadow-sm/10 border-1 border-slate-200 text-base md:text-sm resize-y focus:outline-1 focus:outline-brand"
                    />
                    <span className={`self-end text-[11px] ${count > MAX_CHARS ? "text-red-600" : "text-neutral-500"}`}>{count}/{MAX_CHARS}</span>
                </div>

                <span className="text-xs text-neutral-600">
                    Enviamos junto a página atual e o nome do navegador, para ajudar a achar o problema. Respondemos pelo seu e-mail de cadastro.
                </span>

                <div className="flex flex-row justify-end gap-x-3">
                    <div>
                        <Button variant="secondary" type="button" onClick={props.onClose}>Cancelar</Button>
                    </div>
                    <div>
                        <Button variant="primary" type="submit" disabled={sending || count < MIN_CHARS || count > MAX_CHARS}>
                            {sending ? "Enviando..." : "Enviar"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
