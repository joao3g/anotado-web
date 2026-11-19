import { useState } from 'react';
import { Button } from '../../components/Button';
import { PasswordInput } from '../../components/Input';
import { CardSkeleton } from '../../components/CardSkeleton';
import * as authService from '../../api/services/auth.service';
import { getApiErrorMessage } from '../../api/services/client';
import { useToast } from '../../hooks/useToast';

export default function SecurityTab() {
    const { addToast } = useToast();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
    const [saving, setSaving] = useState(false);

    function validate() {
        if (newPassword.length < 8) return "A nova senha precisa ter pelo menos 8 caracteres.";
        if (newPassword.length > 72) return "A nova senha pode ter no máximo 72 caracteres.";
        if (newPassword !== newPasswordRepeat) return "As novas senhas não conferem.";
        if (newPassword === currentPassword) return "A nova senha deve ser diferente da atual.";

        return null;
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        const error = validate();
        if (error) return addToast(error, "error");

        setSaving(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            setCurrentPassword("");
            setNewPassword("");
            setNewPasswordRepeat("");
            addToast("Senha alterada!", "success");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível alterar a senha."), "error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <CardSkeleton>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col">
                    <span className="text-lg font-[600]">Alterar senha</span>
                    <span className="text-xs text-neutral-600">Mínimo de 8 caracteres. Outros aparelhos já conectados continuam conectados.</span>
                </div>

                <PasswordInput label="Senha atual" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <PasswordInput label="Nova senha" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <PasswordInput label="Repetir nova senha" autoComplete="new-password" value={newPasswordRepeat} onChange={(e) => setNewPasswordRepeat(e.target.value)} />

                <div className="w-full sm:w-max">
                    <Button variant="primary" type="submit" disabled={saving || !currentPassword || !newPassword || !newPasswordRepeat}>
                        {saving ? "Alterando..." : "Alterar senha"}
                    </Button>
                </div>
            </form>
        </CardSkeleton>
    );
}
