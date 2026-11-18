import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Icon } from '../components/Icon';
import * as authService from '../api/services/auth.service';
import { getApiErrorMessage } from '../api/services/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

// Sign-up. The new account has no family yet: after it, the app shows /onboarding.
export default function RegisterPage() {
    const navigate = useNavigate();
    const authContext = useAuth();
    const { addToast } = useToast();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function validate() {
        if (!name.trim() || !email.trim() || !login.trim() || !password) return "Preencha todos os campos.";
        if (login.trim().length < 3) return "O login precisa ter pelo menos 3 caracteres.";
        if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
        if (password.length > 72) return "A senha pode ter no máximo 72 caracteres.";
        if (password !== passwordRepeat) return "As senhas não conferem.";

        return null;
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        const error = validate();
        if (error) return addToast(error, "error");

        setSubmitting(true);

        try {
            await authService.register({ name: name.trim(), email: email.trim(), login: login.trim(), password });

            const result = await authService.login(login.trim(), password);
            authContext.login(result.token, result.user);

            navigate("/onboarding");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível criar a conta."), "error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50 py-8">
            <form className="flex flex-col justify-center w-full max-w-100 px-4 items-center gap-y-5" onSubmit={handleSubmit}>
                <div className="flex w-full items-center gap-3 mb-6">
                    <Icon size={20} />
                    <span className="font-[600] text-md">Anotado</span>
                </div>

                <div className="flex flex-col w-full">
                    <span className="font-[600] text-xl">Criar conta</span>
                    <span className="text-sm text-neutral-600">Depois você entra na sua família ou cria uma nova.</span>
                </div>

                <Input type="text" label="Nome completo" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input type="email" label="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input type="text" label="Login" autoComplete="username" autoCapitalize="none" value={login} onChange={(e) => setLogin(e.target.value)} />
                <Input type="password" label="Senha" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Input type="password" label="Confirmar senha" autoComplete="new-password" value={passwordRepeat} onChange={(e) => setPasswordRepeat(e.target.value)} />

                <div className="flex w-full">
                    <Button variant="primary" type="submit" disabled={submitting}>
                        {submitting ? "Criando conta..." : "Criar conta"}
                    </Button>
                </div>

                <span className="text-neutral-600 text-xs">
                    Já tem conta? <span className="text-green-700 font-bold cursor-pointer" onClick={() => navigate("/")}>Fazer login</span>
                </span>
            </form>
        </div>
    );
}
