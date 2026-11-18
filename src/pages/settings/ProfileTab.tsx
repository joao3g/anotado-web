import { useRef, useState } from 'react';
import { Camera, Images, Trash } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { CameraModal } from '../../components/modals/CameraModal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CardSkeleton } from '../../components/CardSkeleton';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import * as authService from '../../api/services/auth.service';
import { getApiErrorMessage } from '../../api/services/client';
import type { User } from '../../api/types/auth';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { queryClient } from '../../queryClient';
import { fileToAvatarDataUrl } from '../../image';
import { formatPhone } from '../../utils';
import { BotsCard } from './BotsCard';

function PhotoCard(props: { user: User }) {
    const authContext = useAuth();
    const { addToast } = useToast();
    const fileInput = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);

    // In-app camera only where the browser has one (HTTPS or localhost).
    const canUseCamera = Boolean(navigator.mediaDevices?.getUserMedia);

    async function afterChange(message: string) {
        await authContext.refreshUser();
        queryClient.invalidateQueries({ queryKey: ['family'] }); // The photo also shows in the member list
        addToast(message, "success");
    }

    // Uploads an already resized photo. Returns true when saved.
    async function saveAvatar(avatar: string) {
        try {
            await authService.updateAvatar(avatar);
            await afterChange("Foto atualizada!");
            return true;
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível enviar a foto."), "error");
            return false;
        }
    }

    async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = ""; // Choosing the same file again still triggers onChange
        if (!file) return;

        setBusy(true);
        try {
            let avatar: string;
            try {
                avatar = await fileToAvatarDataUrl(file);
            } catch {
                return addToast("Não foi possível ler essa imagem. Tente uma foto JPG ou PNG.", "error");
            }

            await saveAvatar(avatar);
        } finally {
            setBusy(false);
        }
    }

    async function handleCameraCapture(avatar: string) {
        if (await saveAvatar(avatar)) setCameraOpen(false);
    }

    async function handleRemove() {
        setBusy(true);
        try {
            await authService.removeAvatar();
            await afterChange("Foto removida.");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível remover a foto."), "error");
        } finally {
            setBusy(false);
        }
    }

    return (
        <CardSkeleton>
            {cameraOpen ? <CameraModal onClose={() => setCameraOpen(false)} onCapture={handleCameraCapture} /> : null}

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar name={props.user.name} avatar={props.user.avatar} className="size-20 text-2xl" />

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                        <span className="text-lg font-[600]">Foto de perfil</span>
                        <span className="text-xs text-neutral-600">JPG, PNG ou WEBP. A foto é recortada em quadrado e reduzida.</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                        {canUseCamera ?
                            <div className="w-max">
                                <Button variant="secondary" type="button" disabled={busy} onClick={() => setCameraOpen(true)}>
                                    <span className="flex items-center gap-2"><Camera size={16} />Tirar foto</span>
                                </Button>
                            </div>
                            : null}
                        <div className="w-max">
                            <Button variant="secondary" type="button" disabled={busy} onClick={() => fileInput.current?.click()}>
                                <span className="flex items-center gap-2"><Images size={16} />{busy ? "Aguarde..." : "Escolher da galeria"}</span>
                            </Button>
                        </div>
                        {props.user.avatar ?
                            <div className="w-max">
                                <Button variant="secondary" type="button" disabled={busy} onClick={handleRemove}>
                                    <span className="flex items-center gap-2 text-red-600"><Trash size={16} />Remover</span>
                                </Button>
                            </div>
                            : null}
                    </div>
                </div>
            </div>
        </CardSkeleton>
    );
}

// Initial values come from props: this form is only rendered once the user is loaded.
function PersonalInfoCard(props: { user: User }) {
    const authContext = useAuth();
    const { addToast } = useToast();

    const [name, setName] = useState(props.user.name ?? "");
    const [email, setEmail] = useState(props.user.email ?? "");
    const [phone, setPhone] = useState(props.user.phone ?? ""); // Digits only
    const [saving, setSaving] = useState(false);

    const changed = name !== (props.user.name ?? "") || email !== (props.user.email ?? "") || phone !== (props.user.phone ?? "");

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!name.trim()) return addToast("Digite seu nome completo.", "error");
        if (!email.trim()) return addToast("Digite seu e-mail.", "error");
        if (phone && phone.length < 10) return addToast("Telefone incompleto. Use DDD + número.", "error");

        setSaving(true);
        try {
            await authService.updateProfile({ name: name.trim(), email: email.trim(), phone });
            await authContext.refreshUser();
            queryClient.invalidateQueries({ queryKey: ['family'] });
            addToast("Perfil atualizado!", "success");
        } catch (error) {
            addToast(getApiErrorMessage(error, "Não foi possível salvar o perfil."), "error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <CardSkeleton>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <span className="text-lg font-[600]">Informações pessoais</span>

                <Input type="text" label="Nome completo" autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
                <Input type="email" label="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input
                    type="tel"
                    label="Telefone"
                    autoComplete="tel-national"
                    inputMode="numeric"
                    placeholder="(11) 91234-5678"
                    value={formatPhone(phone)}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                />

                <div className="w-full sm:w-max">
                    <Button variant="primary" type="submit" disabled={saving || !changed}>
                        {saving ? "Salvando..." : "Salvar alterações"}
                    </Button>
                </div>
            </form>
        </CardSkeleton>
    );
}

export default function ProfileTab() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="flex flex-col gap-4">
                <LoadingSkeleton className="h-28 w-full rounded-2xl" />
                <LoadingSkeleton className="h-80 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <PhotoCard user={user} />
            {/* key: reset the form when the saved profile changes */}
            <PersonalInfoCard key={`${user.name}|${user.email}|${user.phone}`} user={user} />
            <BotsCard />
        </div>
    );
}
