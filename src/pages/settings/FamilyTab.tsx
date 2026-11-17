import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Copy, LogOut, RefreshCw, ShieldCheck, ShieldOff, UserMinus } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CardSkeleton } from '../../components/CardSkeleton';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import ConfirmModal from '../../components/modals/DeleteConfirmModal';
import * as groupService from '../../api/services/group.service';
import { getApiErrorMessage } from '../../api/services/client';
import type { Family, FamilyMember } from '../../api/types/group';
import { familyQuery } from '../../queries/group';
import { queryClient } from '../../queryClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

// "K7MZQ2PA" -> "K7MZ-Q2PA" (easier to read; the dash is ignored when joining)
const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

function FamilyNameCard(props: { title: string, isAdmin: boolean }) {
    const authContext = useAuth();
    const { addToast } = useToast();
    const [title, setTitle] = useState(props.title);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!title.trim()) return addToast("Digite o nome da família.", "error");

        setSaving(true);
        try {
            await groupService.updateFamilyName(title.trim());
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['family'] }),
                authContext.refreshUser() // The sidebar shows the family name
            ]);
            addToast("Nome da família atualizado!", "success");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível salvar o nome."), "error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <CardSkeleton>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col">
                    <span className="text-lg font-[600]">Nome da família</span>
                    {!props.isAdmin ? <span className="text-xs text-neutral-600">Só admins podem mudar o nome.</span> : null}
                </div>
                {props.isAdmin ?
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <Input type="text" label="Nome" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} />
                        <div className="w-full sm:w-max">
                            <Button variant="primary" type="submit" disabled={saving || title.trim() === props.title}>
                                {saving ? "Salvando..." : "Salvar"}
                            </Button>
                        </div>
                    </div>
                    : <span className="text-sm font-[500]">{props.title}</span>}
            </form>
        </CardSkeleton>
    );
}

type MemberAction = "PROMOTE" | "DEMOTE" | "REMOVE";

// Texts of the confirmation for each admin action on another person.
function memberActionTexts(action: MemberAction, name: string) {
    if (action === "PROMOTE") return {
        title: `Tornar ${name} admin?`,
        description: "Admins podem mudar o nome da família, gerar um novo código de convite, tornar outras pessoas admin e remover qualquer pessoa da família, inclusive você.",
        confirmLabel: "Tornar admin",
        success: `${name} agora é admin.`
    };
    if (action === "DEMOTE") return {
        title: `Tirar admin de ${name}?`,
        description: `${name} continua na família, mas não pode mais mudar o nome, gerar um novo código de convite nem gerenciar os membros.`,
        confirmLabel: "Tirar admin",
        success: `${name} não é mais admin.`
    };
    return {
        title: `Remover ${name} da família?`,
        description: `${name} perde o acesso às finanças desta família na hora. Os lançamentos dessa pessoa continuam com a família. Ela ainda conhece o código de convite: gere um novo código se não quiser que ela volte.`,
        confirmLabel: "Remover",
        success: `${name} foi removido(a) da família.`
    };
}

function MemberActionButton(props: { onClick: () => void, children: React.ReactNode }) {
    return (
        <div className="w-max">
            <Button variant="secondary" type="button" onClick={props.onClick}>
                <span className="flex items-center gap-1.5 text-xs">{props.children}</span>
            </Button>
        </div>
    );
}

function MembersCard(props: { family: Family, isAdmin: boolean }) {
    const authContext = useAuth();
    const { addToast } = useToast();
    const [pending, setPending] = useState<{ action: MemberAction, member: FamilyMember } | null>(null);

    const memberName = (member: FamilyMember) => member.name ?? "Sem nome";

    async function handleConfirm() {
        if (!pending) return;
        const { action, member } = pending;
        const texts = memberActionTexts(action, memberName(member));
        setPending(null);

        try {
            if (action === "REMOVE") await groupService.removeMember(member.id);
            else await groupService.setMemberRole(member.id, action === "PROMOTE" ? "ADMIN" : "MEMBER");
            addToast(texts.success, "success");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível concluir a ação."), "error");
        } finally {
            // Also after an error: the list may be old (e.g. another admin changed it on another device).
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['family'] }),
                authContext.refreshUser() // The sidebar shows the number of members
            ]);
        }
    }

    const pendingTexts = pending ? memberActionTexts(pending.action, memberName(pending.member)) : null;

    return (
        <>
            {pending && pendingTexts ?
                <ConfirmModal
                    title={pendingTexts.title}
                    description={pendingTexts.description}
                    confirmLabel={pendingTexts.confirmLabel}
                    onDelete={handleConfirm}
                    onClose={() => setPending(null)}
                />
                : null}

            <CardSkeleton padding={{ left: 0, right: 0 }}>
                <div className="flex flex-col px-6 mb-3">
                    <span className="text-lg font-[600]">Membros</span>
                    <span className="text-xs text-neutral-600">
                        {`${props.family.members.length} pessoa${props.family.members.length === 1 ? "" : "s"} nesta família`}
                    </span>
                </div>

                {props.family.members.map((member) => (
                    <div key={member.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 px-6 border-b-1 border-slate-200 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Avatar name={member.name} avatar={member.avatar} />
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-[600] truncate">{memberName(member)}</span>
                                    {member.role === "ADMIN" ? <Badge variant="info">Admin</Badge> : null}
                                    {member.isMe ? <Badge variant="success">Você</Badge> : null}
                                </div>
                                <span className="text-xs text-neutral-600 truncate">{member.email}</span>
                            </div>
                        </div>

                        {/* Admins manage the others. To leave, an admin uses "Sair da família". */}
                        {props.isAdmin && !member.isMe ?
                            <div className="flex gap-2 ml-auto">
                                {member.role === "MEMBER" ?
                                    <MemberActionButton onClick={() => setPending({ action: "PROMOTE", member })}>
                                        <ShieldCheck size={14} />Tornar admin
                                    </MemberActionButton>
                                    :
                                    <MemberActionButton onClick={() => setPending({ action: "DEMOTE", member })}>
                                        <ShieldOff size={14} />Tirar admin
                                    </MemberActionButton>
                                }
                                <MemberActionButton onClick={() => setPending({ action: "REMOVE", member })}>
                                    <span className="flex items-center gap-1.5 text-red-600"><UserMinus size={14} />Remover</span>
                                </MemberActionButton>
                            </div>
                            : null}
                    </div>
                ))}
            </CardSkeleton>
        </>
    );
}

function InviteCodeCard(props: { inviteCode: string, isAdmin: boolean }) {
    const { addToast } = useToast();
    const [confirmOpen, setConfirmOpen] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(props.inviteCode);
            addToast("Código copiado!", "success");
        } catch {
            addToast("Não foi possível copiar. Selecione o código e copie manualmente.", "error");
        }
    }

    async function handleRegenerate() {
        setConfirmOpen(false);
        try {
            await groupService.regenerateInviteCode();
            await queryClient.invalidateQueries({ queryKey: ['family'] });
            addToast("Novo código gerado. O código antigo não funciona mais.", "success");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível gerar um novo código."), "error");
        }
    }

    return (
        <>
            {confirmOpen ?
                <ConfirmModal
                    title="Gerar um novo código?"
                    description="O código atual deixa de funcionar na hora. Quem ainda não entrou na família vai precisar do novo código."
                    confirmLabel="Gerar novo código"
                    onDelete={handleRegenerate}
                    onClose={() => setConfirmOpen(false)}
                />
                : null}

            <CardSkeleton>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <span className="text-lg font-[600]">Código de convite</span>
                        <span className="text-xs text-neutral-600">
                            Quem criar uma conta e digitar este código entra na sua família e vê todas as finanças dela. Só compartilhe com quem você confia.
                        </span>
                    </div>

                    <span className="w-max px-4 py-2 rounded-2xl bg-slate-50 border-1 border-slate-200 font-mono text-2xl font-[700] tracking-widest select-all">
                        {formatCode(props.inviteCode)}
                    </span>

                    <div className="flex flex-wrap gap-2">
                        <div className="w-max">
                            <Button variant="primary" type="button" onClick={handleCopy}>
                                <span className="flex items-center gap-2"><Copy size={16} />Copiar código</span>
                            </Button>
                        </div>
                        {props.isAdmin ?
                            <div className="w-max">
                                <Button variant="secondary" type="button" onClick={() => setConfirmOpen(true)}>
                                    <span className="flex items-center gap-2"><RefreshCw size={16} />Gerar novo código</span>
                                </Button>
                            </div>
                            : null}
                    </div>
                </div>
            </CardSkeleton>
        </>
    );
}

function DangerZoneCard() {
    const navigate = useNavigate();
    const authContext = useAuth();
    const { addToast } = useToast();
    const [confirmOpen, setConfirmOpen] = useState(false);

    async function handleLeave() {
        setConfirmOpen(false);
        try {
            await groupService.leaveFamily();
            authContext.logout(); // Also clears the cached data of this family
            navigate("/");
            addToast("Você saiu da família.", "info");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível sair da família."), "error");
        }
    }

    return (
        <>
            {confirmOpen ?
                <ConfirmModal
                    title="Sair da família?"
                    description="Você perde o acesso às finanças desta família e sua sessão será encerrada. Os dados continuam com a família. Para voltar, alguém precisa te passar o código de convite."
                    confirmLabel="Sair da família"
                    onDelete={handleLeave}
                    onClose={() => setConfirmOpen(false)}
                />
                : null}

            <div className="flex flex-col gap-4 p-6 bg-white border-1 border-red-200 rounded-2xl">
                <div className="flex flex-col">
                    <span className="text-lg font-[600] text-red-600">Zona de perigo</span>
                    <span className="text-xs text-neutral-600">
                        Ao sair, você perde o acesso às finanças desta família e é desconectado. O último membro não pode sair, e o único admin precisa tornar outra pessoa admin antes de sair.
                    </span>
                </div>
                <div className="w-full sm:w-max">
                    <Button variant="danger" type="button" onClick={() => setConfirmOpen(true)}>
                        <span className="flex items-center justify-center gap-2"><LogOut size={16} />Sair da família</span>
                    </Button>
                </div>
            </div>
        </>
    );
}

export default function FamilyTab() {
    const query = useQuery(familyQuery());

    if (query.isPending) {
        return (
            <div className="flex flex-col gap-4">
                <LoadingSkeleton className="h-32 w-full rounded-2xl" />
                <LoadingSkeleton className="h-48 w-full rounded-2xl" />
                <LoadingSkeleton className="h-44 w-full rounded-2xl" />
            </div>
        );
    }

    if (query.isError) {
        return (
            <CardSkeleton>
                <div className="flex flex-col gap-4 justify-center items-center py-12">
                    <span className="text-lg font-[600]">Não foi possível carregar a família</span>
                    <div className="w-max">
                        <Button variant="secondary" type="button" onClick={() => query.refetch()}>Tentar novamente</Button>
                    </div>
                </div>
            </CardSkeleton>
        );
    }

    // From the family list (always fresh), not from the login data. The API checks the role again anyway.
    const isAdmin = query.data.members.some(member => member.isMe && member.role === "ADMIN");

    return (
        <div className="flex flex-col gap-4">
            {/* key: reset the form when the saved name or the role changes */}
            <FamilyNameCard key={`${query.data.title}-${isAdmin}`} title={query.data.title} isAdmin={isAdmin} />
            <MembersCard family={query.data} isAdmin={isAdmin} />
            <InviteCodeCard inviteCode={query.data.inviteCode} isAdmin={isAdmin} />
            <DangerZoneCard />
        </div>
    );
}
