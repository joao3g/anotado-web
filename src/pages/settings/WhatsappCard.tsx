import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, MessageCircle, Unlink } from 'lucide-react';
import { Button } from '../../components/Button';
import { CardSkeleton } from '../../components/CardSkeleton';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import ConfirmModal from '../../components/modals/DeleteConfirmModal';
import * as whatsappService from '../../api/services/whatsapp.service';
import { getApiErrorMessage } from '../../api/services/client';
import type { WhatsappLinkCode } from '../../api/types/whatsapp';
import { whatsappStatusQuery } from '../../queries/whatsapp';
import { queryClient } from '../../queryClient';
import { useToast } from '../../hooks/useToast';
import { formatPhone } from '../../utils';

// "5511999999999" -> "+55 (11) 99999-9999"
const formatBotNumber = (digits: string) => digits.startsWith("55") ? `+55 ${formatPhone(digits.slice(2))}` : `+${digits}`;

// A link that looks like the primary Button (a <button> inside an <a> is invalid HTML).
function LinkButton(props: { href: string, children: React.ReactNode }) {
    return (
        <a
            href={props.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-max rounded-full px-4 py-2 text-white bg-linear-to-r from-green-600/90 via-emerald-700/90 via-60% to-emerald-700 hover:opacity-95 font-normal text-md shadow-emerald-100 shadow-lg"
        >
            {props.children}
        </a>
    );
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Settings > Perfil: link a WhatsApp number to the account, so expenses can be sent to the bot.
// Hidden while the bot is not configured on the server.
export function WhatsappCard() {
    const { addToast } = useToast();
    const [linkCode, setLinkCode] = useState<WhatsappLinkCode | null>(null);
    const [creating, setCreating] = useState(false);
    const [confirmUnlink, setConfirmUnlink] = useState(false);

    // While a code is on screen, check every 3 s whether the bot already received it.
    const query = useQuery({ ...whatsappStatusQuery(), refetchInterval: linkCode ? 3000 : false });
    const connected = query.data?.connected ?? false;

    useEffect(() => {
        if (linkCode && connected) {
            setLinkCode(null);
            addToast("WhatsApp conectado!", "success");
        }
    }, [linkCode, connected, addToast]);

    // The code expires after 10 minutes: hide it then.
    useEffect(() => {
        if (!linkCode) return;
        const timeout = setTimeout(() => setLinkCode(null), Math.max(0, new Date(linkCode.expiresAt).getTime() - Date.now()));
        return () => clearTimeout(timeout);
    }, [linkCode]);

    async function handleConnect() {
        setCreating(true);
        try {
            setLinkCode(await whatsappService.createLinkCode());
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível gerar o código."), "error");
        } finally {
            setCreating(false);
        }
    }

    async function handleCopy(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            addToast("Mensagem copiada!", "success");
        } catch {
            addToast("Não foi possível copiar. Selecione o texto e copie manualmente.", "error");
        }
    }

    async function handleUnlink() {
        setConfirmUnlink(false);
        try {
            await whatsappService.unlink();
            await queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
            addToast("WhatsApp desconectado.", "info");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível desconectar."), "error");
        }
    }

    if (query.isPending) return <LoadingSkeleton className="h-40 w-full rounded-2xl" />;
    if (query.isError || !query.data.enabled) return null; // Optional feature: no card instead of an error

    const status = query.data;
    const botLink = status.botNumber ? `https://wa.me/${status.botNumber}` : null;

    return (
        <>
            {confirmUnlink ?
                <ConfirmModal
                    title="Desconectar o WhatsApp?"
                    description="As mensagens deste número deixam de ser registradas. As despesas já salvas continuam no app. Você pode conectar de novo quando quiser."
                    confirmLabel="Desconectar"
                    onDelete={handleUnlink}
                    onClose={() => setConfirmUnlink(false)}
                />
                : null}

            <CardSkeleton>
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex justify-center items-center size-10 shrink-0 rounded-full bg-green-100 text-green-700">
                            <MessageCircle size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-[600]">WhatsApp</span>
                            <span className="text-xs text-neutral-600">
                                Registre despesas mandando uma mensagem, como <b>mercado 45,90</b>. O bot mostra um resumo e só salva depois que você confirma.
                            </span>
                        </div>
                    </div>

                    {status.connected ?
                        <>
                            <span className="text-sm">
                                Conectado ao número terminado em <b>{status.lastDigits}</b>.
                                {status.botNumber ? <> Converse com o bot pelo <b>{formatBotNumber(status.botNumber)}</b>.</> : null}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {botLink ?
                                    <LinkButton href={botLink}>
                                        <span className="flex items-center gap-2"><ExternalLink size={16} />Abrir conversa</span>
                                    </LinkButton>
                                    : null}
                                <div className="w-max">
                                    <Button variant="secondary" type="button" onClick={() => setConfirmUnlink(true)}>
                                        <span className="flex items-center gap-2 text-red-600"><Unlink size={16} />Desconectar</span>
                                    </Button>
                                </div>
                            </div>
                        </>
                        : linkCode ?
                            <div className="flex flex-col gap-3">
                                <span className="text-sm">
                                    Envie esta mensagem para o bot{status.botNumber ? <> (<b>{formatBotNumber(status.botNumber)}</b>)</> : null} pelo WhatsApp que você quer conectar, até às <b>{formatTime(linkCode.expiresAt)}</b>:
                                </span>
                                <span className="w-max max-w-full px-4 py-2 rounded-2xl bg-slate-50 border-1 border-slate-200 font-mono text-lg font-[700] tracking-wider select-all break-all">
                                    {linkCode.message}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {linkCode.link ?
                                        <LinkButton href={linkCode.link}>
                                            <span className="flex items-center gap-2"><ExternalLink size={16} />Abrir WhatsApp</span>
                                        </LinkButton>
                                        : null}
                                    <div className="w-max">
                                        <Button variant="secondary" type="button" onClick={() => handleCopy(linkCode.message)}>
                                            <span className="flex items-center gap-2"><Copy size={16} />Copiar mensagem</span>
                                        </Button>
                                    </div>
                                </div>
                                <span className="text-xs text-neutral-600">Esta tela atualiza sozinha quando o bot receber o código.</span>
                            </div>
                            :
                            <div className="w-full sm:w-max">
                                <Button variant="primary" type="button" onClick={handleConnect} disabled={creating}>
                                    {creating ? "Gerando código..." : "Conectar WhatsApp"}
                                </Button>
                            </div>
                    }
                </div>
            </CardSkeleton>
        </>
    );
}
