import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera, X } from "lucide-react";
import { Button } from "../Button";
import { videoFrameToAvatarDataUrl } from "../../image";

type CameraModalProps = {
    onClose: () => void
    // Receives the 256x256 JPEG data URL. The modal waits for it (e.g. the upload) before closing.
    onCapture: (avatar: string) => Promise<void>
}

type Facing = "user" | "environment";

// Error names from getUserMedia -> message in pt-BR
function cameraErrorMessage(error: unknown) {
    const name = error instanceof DOMException ? error.name : "";

    if (name === "NotAllowedError" || name === "SecurityError") return "Permissão da câmera negada. Libere a câmera nas configurações do navegador ou escolha uma foto da galeria.";
    if (name === "NotFoundError" || name === "OverconstrainedError") return "Nenhuma câmera encontrada. Escolha uma foto da galeria.";
    if (name === "NotReadableError") return "A câmera está sendo usada por outro app. Feche-o e tente de novo.";

    return "Não foi possível abrir a câmera. Escolha uma foto da galeria.";
}

// Profile photo taken inside the app (getUserMedia).
// Why: on Android, the installed app opening the system camera app is often closed by the OS to
// free memory, so the photo never arrives. Here nothing leaves the app, and only the final
// 256x256 photo is uploaded, after "Usar foto". The camera is turned off when the modal closes.
export function CameraModal(props: CameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [facing, setFacing] = useState<Facing>("user"); // Front camera first: it is a profile photo
    const [live, setLive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canSwitch, setCanSwitch] = useState(false);
    const [captured, setCaptured] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let cancelled = false;

        navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
            audio: false
        }).then(async (mediaStream) => {
            if (cancelled) return mediaStream.getTracks().forEach(track => track.stop());

            stream = mediaStream;
            const video = videoRef.current;
            if (video) {
                video.srcObject = mediaStream;
                await video.play().catch(() => { /* autoplay is allowed for muted video; ignore */ });
            }
            setError(null);
            setLive(true);

            // The switch button only makes sense with 2+ cameras (labels need the permission, counts do not).
            const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
            if (!cancelled) setCanSwitch(devices.filter(device => device.kind === "videoinput").length > 1);
        }).catch((cameraError) => {
            if (!cancelled) setError(cameraErrorMessage(cameraError));
        });

        // Turn the camera off when switching cameras or closing the modal.
        return () => {
            cancelled = true;
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [facing]);

    function switchCamera() {
        setLive(false);
        setFacing(current => current === "user" ? "environment" : "user");
    }

    function capture() {
        if (!videoRef.current) return;

        try {
            setCaptured(videoFrameToAvatarDataUrl(videoRef.current));
        } catch {
            setError("Não foi possível capturar a foto. Tente de novo.");
        }
    }

    async function usePhoto() {
        if (!captured) return;

        setSaving(true);
        try {
            await props.onCapture(captured);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-900 flex flex-col bg-black text-snow pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-between items-center h-14 px-4">
                <span className="text-lg font-[600]">Tirar foto</span>
                <button aria-label="Fechar" className="flex justify-center items-center size-10 rounded-full hover:bg-snow/10 cursor-pointer" onClick={props.onClose}>
                    <X size={22} />
                </button>
            </div>

            <div className="flex flex-1 justify-center items-center px-4">
                {/* Square view = exactly the part that is saved (center crop) */}
                <div className="relative w-full max-w-md aspect-square overflow-hidden rounded-3xl bg-snow/10">
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        className={`size-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${captured ? "hidden" : ""}`}
                    />

                    {captured ?
                        <img src={captured} alt="Foto capturada" className="size-full object-cover" />
                        : null}

                    {!captured && live ?
                        <div className="pointer-events-none absolute inset-6 rounded-full border-2 border-snow/60" />
                        : null}

                    {!live && !error && !captured ?
                        <span className="absolute inset-0 flex justify-center items-center text-sm text-snow/70">Abrindo a câmera...</span>
                        : null}

                    {error ?
                        <span className="absolute inset-0 flex justify-center items-center p-6 text-center text-sm text-snow/90">{error}</span>
                        : null}
                </div>
            </div>

            <div className="flex justify-center items-center gap-6 h-32 px-4">
                {captured ?
                    <>
                        <div className="w-40">
                            <Button variant="secondary" type="button" disabled={saving} onClick={() => setCaptured(null)}>Tirar outra</Button>
                        </div>
                        <div className="w-40">
                            <Button variant="primary" type="button" disabled={saving} onClick={usePhoto}>{saving ? "Enviando..." : "Usar foto"}</Button>
                        </div>
                    </>
                    :
                    <>
                        <div className="size-12" />
                        <button
                            aria-label="Capturar foto"
                            className="flex justify-center items-center size-18 rounded-full bg-snow text-black border-4 border-snow/40 bg-clip-padding cursor-pointer disabled:opacity-40"
                            disabled={!live}
                            onClick={capture}
                        >
                            <Camera size={26} />
                        </button>
                        {canSwitch ?
                            <button
                                aria-label="Trocar câmera"
                                className="flex justify-center items-center size-12 rounded-full bg-snow/10 hover:bg-snow/20 cursor-pointer"
                                onClick={switchCamera}
                            >
                                <SwitchCamera size={22} />
                            </button>
                            : <div className="size-12" />}
                    </>
                }
            </div>
        </div>
    );
}
