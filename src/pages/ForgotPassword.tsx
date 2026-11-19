import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MailCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Icon } from '../components/Icon';
import * as authService from '../api/services/auth.service';
import { useToast } from '../hooks/useToast';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!/^\S+@\S+\.\S+$/.test(email.trim())) return addToast("Informe um e-mail válido.", "error");

        setSending(true);
        try {
            await authService.forgotPassword(email.trim());
            // Same message whether or not an account has this email (the API does not tell either).
            setSent(true);
        } catch {
            addToast("Não foi possível enviar o link. Tente de novo.", "error");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="flex flex-col justify-center w-full max-w-100 px-4 items-center gap-y-5">
                <div className="flex w-full items-center gap-3 mb-6">
                    <Icon />
                    <span className="font-[600] text-md">Anotado</span>
                </div>

                {sent ?
                    <div className="flex flex-col w-full gap-4">
                        <div className="flex items-center justify-center size-12 rounded-full bg-brand/10 text-brand">
                            <MailCheck size={22} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-[600] text-xl">Confira seu e-mail</span>
                            <span className="text-sm text-neutral-600">
                                Se existir uma conta com <strong>{email.trim()}</strong>, enviamos um link para criar uma nova senha. Ele vale por 30 minutos.
                            </span>
                            <span className="text-xs text-neutral-600 mt-2">Não chegou? Veja a caixa de spam ou peça de novo em alguns minutos.</span>
                        </div>
                        <Button variant="primary" type="button" onClick={() => navigate("/")}>Voltar para o login</Button>
                    </div>
                    :
                    <form className="flex flex-col w-full gap-y-5" onSubmit={handleSubmit}>
                        <div className="flex flex-col w-full">
                            <span className="font-[600] text-xl">Esqueceu a senha?</span>
                            <span className="text-sm text-neutral-600">Informe o e-mail da sua conta. Vamos enviar um link para criar uma nova senha.</span>
                        </div>

                        <Input
                            type="email"
                            label="E-mail"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Button variant="primary" type="submit" disabled={sending || !email.trim()}>
                            {sending ? "Enviando..." : "Enviar link"}
                        </Button>
                    </form>}

                <span className="text-neutral-600 text-xs">Lembrou a senha? <span className="text-brand font-bold cursor-pointer" onClick={() => navigate("/")}>Fazer login</span></span>
            </div>
        </div>
    );
}
