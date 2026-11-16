import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { KeyRound, LogOut, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Icon } from '../components/Icon';
import { CardSkeleton } from '../components/CardSkeleton';
import * as groupService from '../api/services/group.service';
import { getApiErrorMessage } from '../api/services/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

// For a logged-in user without a family: join one with an invite code, or create a new one.
export default function OnboardingPage() {
    const navigate = useNavigate();
    const authContext = useAuth();
    const { addToast } = useToast();

    const [code, setCode] = useState("");
    const [familyName, setFamilyName] = useState("");
    const [submitting, setSubmitting] = useState<"join" | "create" | null>(null);

    // Already in a family: nothing to do here.
    if (authContext.user?.group) return <Navigate to="/dashboard" replace />;

    async function finish(message: string) {
        await authContext.refreshUser();
        addToast(message, "success");
        navigate("/dashboard");
    }

    async function handleJoin(event: React.FormEvent) {
        event.preventDefault();
        if (!code.trim()) return addToast("Digite o código da família.", "error");

        setSubmitting("join");
        try {
            await groupService.joinFamily(code);
            await finish("Você entrou na família!");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível entrar na família."), "error");
        } finally {
            setSubmitting(null);
        }
    }

    async function handleCreate(event: React.FormEvent) {
        event.preventDefault();
        if (!familyName.trim()) return addToast("Digite o nome da família.", "error");

        setSubmitting("create");
        try {
            await groupService.createFamily(familyName.trim());
            await finish("Família criada!");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível criar a família."), "error");
        } finally {
            setSubmitting(null);
        }
    }

    function logout() {
        authContext.logout();
        navigate("/");
    }

    const firstName = authContext.user?.name?.split(" ")[0];

    return (
        <div className="flex justify-center min-h-screen bg-slate-50 px-4 py-8 md:items-center">
            <div className="flex flex-col w-full max-w-3xl gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Icon size={20} />
                        <span className="font-[600] text-md">Expense Tracker</span>
                    </div>

                    <button className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black cursor-pointer" onClick={logout}>
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>

                <div className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-[600]">{firstName ? `Olá, ${firstName}!` : "Olá!"}</span>
                    <span className="text-sm text-neutral-600">Para começar, entre na família de alguém com o código de convite ou crie a sua.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <CardSkeleton>
                        <form className="flex flex-col gap-4 h-full" onSubmit={handleJoin}>
                            <div className="flex items-center justify-center size-10 rounded-full bg-green-100 text-green-900">
                                <KeyRound size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-[600]">Entrar com código</span>
                                <span className="text-xs text-neutral-600">Peça o código a alguém da família. Ele fica em Configurações → Família.</span>
                            </div>
                            <Input
                                type="text"
                                label="Código da família"
                                placeholder="Ex.: K7MZ-Q2PA"
                                autoCapitalize="characters"
                                autoComplete="off"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                            />
                            <div className="mt-auto">
                                <Button variant="primary" type="submit" disabled={submitting !== null}>
                                    {submitting === "join" ? "Entrando..." : "Entrar na família"}
                                </Button>
                            </div>
                        </form>
                    </CardSkeleton>

                    <CardSkeleton>
                        <form className="flex flex-col gap-4 h-full" onSubmit={handleCreate}>
                            <div className="flex items-center justify-center size-10 rounded-full bg-teal-100 text-teal-900">
                                <Users size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-[600]">Criar nova família</span>
                                <span className="text-xs text-neutral-600">Você começa sozinho e depois convida os outros com o código.</span>
                            </div>
                            <Input
                                type="text"
                                label="Nome da família"
                                placeholder="Ex.: Família Silva"
                                maxLength={60}
                                value={familyName}
                                onChange={(e) => setFamilyName(e.target.value)}
                            />
                            <div className="mt-auto">
                                <Button variant="secondary" type="submit" disabled={submitting !== null}>
                                    {submitting === "create" ? "Criando..." : "Criar família"}
                                </Button>
                            </div>
                        </form>
                    </CardSkeleton>
                </div>
            </div>
        </div>
    );
}
