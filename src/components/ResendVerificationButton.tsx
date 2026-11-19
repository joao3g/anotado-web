import { useState } from "react";
import { Button } from "./Button";
import * as authService from "../api/services/auth.service";
import { useToast } from "../hooks/useToast";

// "Reenviar e-mail" for the sign-up confirmation. After one click it stays off: the API sends at most one email every 2 minutes.
export function ResendVerificationButton(props: { email: string }) {
    const { addToast } = useToast();
    const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

    async function handleClick() {
        setState("sending");
        try {
            await authService.resendVerification(props.email);
            setState("sent");
        } catch {
            setState("idle");
            addToast("Não foi possível reenviar o e-mail. Tente de novo.", "error");
        }
    }

    return (
        <div className="flex flex-col w-full gap-1">
            <Button variant="secondary" type="button" onClick={handleClick} disabled={state !== "idle" || !props.email}>
                {state === "sending" ? "Reenviando..." : state === "sent" ? "E-mail reenviado" : "Reenviar e-mail"}
            </Button>
            {state === "sent" ?
                <span className="text-xs text-neutral-600 text-center">Veja sua caixa de entrada e o spam. Pode levar alguns minutos.</span>
                : null}
        </div>
    );
}
