import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Icon } from '../components/Icon';
import { ResendVerificationButton } from '../components/ResendVerificationButton';
import * as authService from '../api/services/auth.service';
import { getApiErrorMessage } from '../api/services/client';
import { useAuth } from '../hooks/useAuth';

// The token comes in the URL hash (#token=...): browsers never send the hash to a server.
// No side effect here: React may call a state initializer twice.
function readTokenFromHash() {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";

    return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : "";
}

// Opened from the sign-up email. Confirms the email, then the user logs in.
export default function VerifyEmailPage() {
    const navigate = useNavigate();

    const [token] = useState(readTokenFromHash);
    const authContext = useAuth();
    // "changed": a new email from Settings > Perfil. "taken": another account got that email first.
    const [status, setStatus] = useState<"checking" | "ok" | "changed" | "taken" | "invalid">(token ? "checking" : "invalid");
    const [takenMessage, setTakenMessage] = useState("");
    const [email, setEmail] = useState("");
    // The link works once. React StrictMode runs effects twice in development: without this guard
    // the second call would find the token already used and show "invalid".
    const called = useRef(false);

    useEffect(() => {
        // Remove the token from the address bar, so it does not stay in the history.
        if (window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname);

        if (!token || called.current) return;
        called.current = true;

        authService.verifyEmail(token)
            .then(async ({ emailChanged }) => {
                setStatus(emailChanged ? "changed" : "ok");
                // Logged in on this device: show the new email at once.
                if (emailChanged && localStorage.getItem("token")) await authContext.refreshUser().catch(() => { });
            })
            .catch((error) => {
                if (isAxiosError(error) && error.response?.status === 409) {
                    setTakenMessage(getApiErrorMessage(error, "Este e-mail já está em uso em outra conta."));
                    setStatus("taken");
                }
                else setStatus("invalid");
            });
    }, [token, authContext]);

    const loggedIn = Boolean(authContext.user);

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="flex flex-col justify-center w-full max-w-100 px-4 items-center gap-y-5">
                <div className="flex w-full items-center gap-3 mb-6">
                    <Icon />
                    <span className="font-[600] text-md">Anotado</span>
                </div>

                {status === "checking" ?
                    <span className="w-full text-sm text-neutral-600">Confirmando seu e-mail...</span>
                    : status === "changed" ?
                        <div className="flex flex-col w-full gap-4">
                            <div className="flex items-center justify-center size-12 rounded-full bg-brand/10 text-brand">
                                <CircleCheck size={22} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-[600] text-xl">E-mail alterado!</span>
                                <span className="text-sm text-neutral-600">Sua conta agora usa este e-mail para login, recuperação de senha e avisos.</span>
                            </div>
                            <Button variant="primary" type="button" onClick={() => navigate(loggedIn ? "/settings/profile" : "/")}>
                                {loggedIn ? "Ir para o Perfil" : "Fazer login"}
                            </Button>
                        </div>
                    : status === "taken" ?
                        <div className="flex flex-col w-full gap-4">
                            <div className="flex gap-2 items-center p-4 bg-orange-50 border-1 border-orange-200 rounded-3xl text-orange-700">
                                <TriangleAlert size={18} className="shrink-0" />
                                <span className="text-sm">{takenMessage}</span>
                            </div>
                            <Button variant="primary" type="button" onClick={() => navigate(loggedIn ? "/settings/profile" : "/")}>
                                {loggedIn ? "Ir para o Perfil" : "Fazer login"}
                            </Button>
                        </div>
                    : status === "ok" ?
                        <div className="flex flex-col w-full gap-4">
                            <div className="flex items-center justify-center size-12 rounded-full bg-brand/10 text-brand">
                                <CircleCheck size={22} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-[600] text-xl">E-mail confirmado!</span>
                                <span className="text-sm text-neutral-600">Agora é só fazer login.</span>
                            </div>
                            <Button variant="primary" type="button" onClick={() => navigate("/")}>Fazer login</Button>
                        </div>
                        :
                        <div className="flex flex-col w-full gap-4">
                            <div className="flex gap-2 items-center p-4 bg-orange-50 border-1 border-orange-200 rounded-3xl text-orange-700">
                                <TriangleAlert size={18} className="shrink-0" />
                                <span className="text-sm">Este link é inválido, já foi usado ou expirou. Se o seu e-mail ainda não foi confirmado, peça um novo link.</span>
                            </div>
                            <Input type="email" label="E-mail da conta" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <ResendVerificationButton email={/^\S+@\S+\.\S+$/.test(email.trim()) ? email.trim() : ""} />
                            <Button variant="primary" type="button" onClick={() => navigate("/")}>Ir para o login</Button>
                        </div>}
            </div>
        </div>
    );
}
