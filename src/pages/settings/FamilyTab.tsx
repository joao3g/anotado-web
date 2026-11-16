import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Copy, LogOut, RefreshCw } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CardSkeleton } from '../../components/CardSkeleton';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import ConfirmModal from '../../components/modals/DeleteConfirmModal';
import * as groupService from '../../api/services/group.service';
import { getApiErrorMessage } from '../../api/services/client';
import type { Family } from '../../api/types/group';
import { familyQuery } from '../../queries/group';
import { queryClient } from '../../queryClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

// "K7MZQ2PA" -> "K7MZ-Q2PA" (easier to read; the dash is ignored when joining)
const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

function FamilyNameCard(props: { title: string }) {
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
                <span className="text-lg font-[600]">Nome da família</span>
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <Input type="text" label="Nome" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} />
                    <div className="w-full sm:w-max">
                        <Button variant="primary" type="submit" disabled={saving || title.trim() === props.title}>
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </div>
            </form>
        </CardSkeleton>
    );
}

function MembersCard(props: { family: Family }) {
    return (
        <CardSkeleton padding={{ left: 0, right: 0 }}>
            <div className="flex flex-col px-6 mb-3">
                <span className="text-lg font-[600]">Membros</span>
                <span className="text-xs text-neutral-600">
                    {`${props.family.members.length} pessoa${props.family.members.length === 1 ? "" : "s"} nesta família`}
                </span>
            </div>

            {props.family.members.map((member, index) => (
                <div key={`member-${index}`} className="flex items-center gap-3 py-3 px-6 border-b-1 border-slate-200 last:border-0 last:pb-0">
                    <Avatar name={member.name} avatar={member.avatar} />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-[600] truncate">{member.name ?? "Sem nome"}</span>
                            {member.isMe ? <Badge variant="success">Você</Badge> : null}
                        </div>
                        <span className="text-xs text-neutral-600 truncate">{member.email}</span>
                    </div>
                </div>
            ))}
        </CardSkeleton>
    );
}

function InviteCodeCard(props: { inviteCode: string }) {
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
                        <div className="w-max">
                            <Button variant="secondary" type="button" onClick={() => setConfirmOpen(true)}>
                                <span className="flex items-center gap-2"><RefreshCw size={16} />Gerar novo código</span>
                            </Button>
                        </div>
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
                        Ao sair, você perde o acesso às finanças desta família e é desconectado. O último membro não pode sair.
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

    return (
        <div className="flex flex-col gap-4">
            {/* key: reset the form when the saved name changes */}
            <FamilyNameCard key={query.data.title} title={query.data.title} />
            <MembersCard family={query.data} />
            <InviteCodeCard inviteCode={query.data.inviteCode} />
            <DangerZoneCard />
        </div>
    );
}
