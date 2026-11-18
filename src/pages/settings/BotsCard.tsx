import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, MessageCircle, Send, Unlink } from 'lucide-react';
import { Button } from '../../components/Button';
import { CardSkeleton } from '../../components/CardSkeleton';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import ConfirmModal from '../../components/modals/DeleteConfirmModal';
import * as botsService from '../../api/services/bots.service';
import { getApiErrorMessage } from '../../api/services/client';
import type { BotChannel, BotLinkCode, BotsStatus } from '../../api/types/bots';
import { botsStatusQuery } from '../../queries/bots';
import { queryClient } from '../../queryClient';
import { useToast } from '../../hooks/useToast';
import { formatPhone } from '../../utils';

const LABEL: Record<BotChannel, string> = { telegram: "Telegram", whatsapp: "WhatsApp" };

// "5511999999999" -> "+55 (11) 99999-9999"
const formatBotNumber = (digits: string) => digits.startsWith("55") ? `+55 ${formatPhone(digits.slice(2))}` : `+${digits}`;

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

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

function CodeBox(props: { text: string, onCopy: () => void }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="w-max max-w-full px-4 py-2 rounded-2xl bg-slate-50 border-1 border-slate-200 font-mono text-lg font-[700] tracking-wider select-all break-all">
                {props.text}
            </span>
            <div className="w-max">
                <Button variant="secondary" type="button" onClick={props.onCopy}>
                    <span className="flex items-center gap-2"><Copy size={16} />Copiar</span>
                </Button>
            </div>
        </div>
    );
}

type ChannelSectionProps = {
    channel: BotChannel,
    status: BotsStatus,
    pending: BotLinkCode | null, // Code on screen for this channel
    creating: boolean,
    onConnect: () => void,
    onUnlink: () => void,
    onCopy: (text: string) => void
};

function ChannelSection(props: ChannelSectionProps) {
    const { channel, status, pending } = props;
    const isTelegram = channel === "telegram";
    const connected = status[channel].connected;
    const chatLink = isTelegram
        ? (status.telegram.botUsername ? `https://t.me/${status.telegram.botUsername}` : null)
        : (status.whatsapp.botNumber ? `https://wa.me/${status.whatsapp.botNumber}` : null);
    const botName = isTelegram
        ? (status.telegram.botUsername ? `@${status.telegram.botUsername}` : null)
        : (status.whatsapp.botNumber ? formatBotNumber(status.whatsapp.botNumber) : null);

    return (
        <div className="flex flex-col gap-3 pt-4 border-t-1 border-slate-200">
            <div className="flex items-center gap-3">
                <div className={`flex justify-center items-center size-9 shrink-0 rounded-full ${isTelegram ? "bg-sky-100 text-sky-700" : "bg-green-100 text-green-700"}`}>
                    {isTelegram ? <Send size={18} /> : <MessageCircle size={18} />}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-[600]">{LABEL[channel]}</span>
                    <span className="text-xs text-neutral-600 truncate">
                        {connected
                            ? (isTelegram ? "Conectado" : `Conectado ao número terminado em ${status.whatsapp.lastDigits}`)
                            : "Não conectado"}
                    </span>
                </div>
            </div>

            {connected ?
                <div className="flex flex-wrap gap-2">
                    {chatLink ?
                        <LinkButton href={chatLink}>
                            <span className="flex items-center gap-2"><ExternalLink size={16} />Abrir conversa</span>
                        </LinkButton>
                        : null}
                    <div className="w-max">
                        <Button variant="secondary" type="button" onClick={props.onUnlink}>
                            <span className="flex items-center gap-2 text-red-600"><Unlink size={16} />Desconectar</span>
                        </Button>
                    </div>
                </div>
                : pending && isTelegram && pending.telegram ?
                    <div className="flex flex-col gap-3">
                        <span className="text-sm">
                            Toque em <b>Abrir Telegram</b> e depois em <b>Iniciar</b> (Start) na conversa com o bot, até às <b>{formatTime(pending.expiresAt)}</b>.
                        </span>
                        <LinkButton href={pending.telegram.link}>
                            <span className="flex items-center gap-2"><ExternalLink size={16} />Abrir Telegram</span>
                        </LinkButton>
                        <span className="text-xs text-neutral-600">
                            Não abriu? Mande esta mensagem para {botName ? <b>{botName}</b> : "o bot"}:
                        </span>
                        <CodeBox text={`/start ${pending.code}`} onCopy={() => props.onCopy(`/start ${pending.code}`)} />
                        <span className="text-xs text-neutral-600">Esta tela atualiza sozinha quando o bot receber o código.</span>
                    </div>
                    : pending && !isTelegram && pending.whatsapp ?
                        <div className="flex flex-col gap-3">
                            <span className="text-sm">
                                Envie esta mensagem para o bot{botName ? <> (<b>{botName}</b>)</> : null} pelo WhatsApp que você quer conectar, até às <b>{formatTime(pending.expiresAt)}</b>:
                            </span>
                            <CodeBox text={pending.whatsapp.message} onCopy={() => props.onCopy(pending.whatsapp!.message)} />
                            {pending.whatsapp.link ?
                                <LinkButton href={pending.whatsapp.link}>
                                    <span className="flex items-center gap-2"><ExternalLink size={16} />Abrir WhatsApp</span>
                                </LinkButton>
                                : null}
                            <span className="text-xs text-neutral-600">Esta tela atualiza sozinha quando o bot receber o código.</span>
                        </div>
                        :
                        <div className="w-full sm:w-max">
                            <Button variant="primary" type="button" onClick={props.onConnect} disabled={props.creating}>
                                {props.creating ? "Gerando código..." : `Conectar ${LABEL[channel]}`}
                            </Button>
                        </div>
            }
        </div>
    );
}

// Settings > Perfil: link Telegram and/or WhatsApp to the account, to add expenses by message.
// Each bot shows only when it is configured on the server; the card is hidden when none is.
export function BotsCard() {
    const { addToast } = useToast();
    const [pending, setPending] = useState<{ channel: BotChannel, code: BotLinkCode } | null>(null);
    const [creating, setCreating] = useState<BotChannel | null>(null);
    const [confirmUnlink, setConfirmUnlink] = useState<BotChannel | null>(null);

    // While a code is on screen, check every 3 s whether the bot already received it.
    const query = useQuery({ ...botsStatusQuery(), refetchInterval: pending ? 3000 : false });
    const pendingConnected = pending ? query.data?.[pending.channel].connected ?? false : false;

    useEffect(() => {
        if (pending && pendingConnected) {
            setPending(null);
            addToast(`${LABEL[pending.channel]} conectado!`, "success");
        }
    }, [pending, pendingConnected, addToast]);

    // The code expires after 10 minutes: hide it then.
    useEffect(() => {
        if (!pending) return;
        const timeout = setTimeout(() => setPending(null), Math.max(0, new Date(pending.code.expiresAt).getTime() - Date.now()));
        return () => clearTimeout(timeout);
    }, [pending]);

    async function handleConnect(channel: BotChannel) {
        setCreating(channel);
        try {
            setPending({ channel, code: await botsService.createLinkCode() });
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível gerar o código."), "error");
        } finally {
            setCreating(null);
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
        const channel = confirmUnlink;
        setConfirmUnlink(null);
        if (!channel) return;
        try {
            await botsService.unlink(channel);
            await queryClient.invalidateQueries({ queryKey: ['bots-status'] });
            addToast(`${LABEL[channel]} desconectado.`, "info");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível desconectar."), "error");
        }
    }

    if (query.isPending) return <LoadingSkeleton className="h-40 w-full rounded-2xl" />;
    if (query.isError) return null; // Optional feature: no card instead of an error

    const status = query.data;
    const channels = (["telegram", "whatsapp"] as const).filter(channel => status[channel].enabled);
    if (channels.length === 0) return null;

    return (
        <>
            {confirmUnlink ?
                <ConfirmModal
                    title={`Desconectar o ${LABEL[confirmUnlink]}?`}
                    description="As mensagens desta conta deixam de ser registradas. As despesas já salvas continuam no app. Você pode conectar de novo quando quiser."
                    confirmLabel="Desconectar"
                    onDelete={handleUnlink}
                    onClose={() => setConfirmUnlink(null)}
                />
                : null}

            <CardSkeleton>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <span className="text-lg font-[600]">Bots de mensagem</span>
                        <span className="text-xs text-neutral-600">
                            Registre despesas mandando uma mensagem, como <b>mercado 45,90</b>. O bot mostra um resumo e só salva depois que você confirma.
                        </span>
                    </div>

                    {channels.map(channel => (
                        <ChannelSection
                            key={channel}
                            channel={channel}
                            status={status}
                            pending={pending?.channel === channel ? pending.code : null}
                            creating={creating === channel}
                            onConnect={() => handleConnect(channel)}
                            onUnlink={() => setConfirmUnlink(channel)}
                            onCopy={handleCopy}
                        />
                    ))}
                </div>
            </CardSkeleton>
        </>
    );
}
