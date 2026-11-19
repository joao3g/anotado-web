import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { TriangleAlert } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Icon } from '../components/Icon';
import * as authService from '../api/services/auth.service';
import { getApiErrorMessage } from '../api/services/client';
import { useToast } from '../hooks/useToast';

// The token comes in the URL hash (#token=...): browsers never send the hash to a server.
// No side effect here: React may call a state initializer twice.
function readTokenFromHash() {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";

    return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : "";
}

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [token] = useState(readTokenFromHash);
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
    const [saving, setSaving] = useState(false);
    const [linkInvalid, setLinkInvalid] = useState(!token);

    // Remove the token from the address bar once it is in state, so it does not stay in the history.
    useEffect(() => {
        if (window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname);
    }, []);

    function validate() {
        if (newPassword.length < 8) return "A nova senha precisa ter pelo menos 8 caracteres.";
        if (newPassword.length > 72) return "A nova senha pode ter no máximo 72 caracteres.";
        if (newPassword !== newPasswordRepeat) return "As senhas não conferem.";

        return null;
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        const error = validate();
        if (error) return addToast(error, "error");

        setSaving(true);
        try {
            await authService.resetPassword(token, newPassword);
            addToast("Senha alterada! Faça login com a nova senha.", "success");
            navigate("/");
        } catch (error) {
            const message = getApiErrorMessage(error, "Não foi possível alterar a senha.");
            if (message.startsWith("Link inválido")) setLinkInvalid(true);
            else addToast(message, "error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="flex flex-col justify-center w-full max-w-100 px-4 items-center gap-y-5">
                <div className="flex w-full items-center gap-3 mb-6">
                    <Icon />
                    <span className="font-[600] text-md">Anotado</span>
                </div>

                {linkInvalid ?
                    <div className="flex flex-col w-full gap-4">
                        <div className="flex gap-2 items-center p-4 bg-orange-50 border-1 border-orange-200 rounded-3xl text-orange-700">
                            <TriangleAlert size={18} className="shrink-0" />
                            <span className="text-sm">Este link é inválido, já foi usado ou expirou. Peça um novo link.</span>
                        </div>
                        <Button variant="primary" type="button" onClick={() => navigate("/forgot-password")}>Pedir novo link</Button>
                    </div>
                    :
                    <form className="flex flex-col w-full gap-y-5" onSubmit={handleSubmit}>
                        <div className="flex flex-col w-full">
                            <span className="font-[600] text-xl">Criar nova senha</span>
                            <span className="text-sm text-neutral-600">Mínimo de 8 caracteres.</span>
                        </div>

                        <Input type="password" label="Nova senha" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        <Input type="password" label="Repetir nova senha" autoComplete="new-password" value={newPasswordRepeat} onChange={(e) => setNewPasswordRepeat(e.target.value)} />

                        <Button variant="primary" type="submit" disabled={saving || !newPassword || !newPasswordRepeat}>
                            {saving ? "Salvando..." : "Salvar nova senha"}
                        </Button>
                    </form>}

                <span className="text-neutral-600 text-xs"><span className="text-brand font-bold cursor-pointer" onClick={() => navigate("/")}>Voltar para o login</span></span>
            </div>
        </div>
    );
}
