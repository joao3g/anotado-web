import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { Input, PasswordInput } from '../components/Input';
import * as authService from '../api/services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '../components/Icon';
import { Sparkles, TriangleAlert } from 'lucide-react';
import { ResendVerificationButton } from '../components/ResendVerificationButton';
import { useToast } from '../hooks/useToast';

function Main() {
    const navigate = useNavigate();

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null); // Set when login answered "confirm your email"

    const authContext = useAuth();
    const { addToast } = useToast();

    async function handleLogin() {
        setUnverifiedEmail(null);
        try {
            const result = await authService.login(login, password);

            authContext.login(result.token, result.user);
            return navigate(result.user.group ? "/dashboard" : "/onboarding");
        } catch (error) {
            // Right password, but the sign-up email was not confirmed yet.
            const notVerified = authService.getEmailNotVerified(error);
            if (notVerified) return setUnverifiedEmail(notVerified.email);

            addToast("Login e/ou senha incorretos!", "error");
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <div className="flex flex-1 justify-center">
                <div className="flex flex-col justify-center w-full max-w-100 px-4 items-center gap-y-5">
                    <div className="flex w-full items-center gap-3 mb-6">
                        <Icon />
                        <span className="font-[600] text-md">Anotado</span>
                    </div>

                    <div className="flex flex-col w-full">
                        <span className="font-[600] text-xl">Bem-vindo de volta</span>
                        <span className="text-sm text-neutral-600">Faça login para gerenciar suas finanças.</span>
                    </div>

                    <Input
                        type="text"
                        label="Login"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" ? handleLogin() : null}
                    />

                    <div className="flex flex-col w-full gap-y-1">
                        <PasswordInput
                            label="Senha"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" ? handleLogin() : null}
                        />
                        <span className="self-end text-brand font-bold text-xs cursor-pointer" onClick={() => navigate("/forgot-password")}>Esqueceu a senha?</span>
                    </div>

                    {unverifiedEmail !== null ?
                        <div className="flex flex-col w-full gap-3 p-4 bg-orange-50 border-1 border-orange-200 rounded-3xl text-orange-700">
                            <div className="flex gap-2 items-center">
                                <TriangleAlert size={18} className="shrink-0" />
                                <span className="text-sm">
                                    Confirme seu e-mail para entrar. Enviamos um link para <strong>{unverifiedEmail}</strong> quando você criou a conta.
                                </span>
                            </div>
                            <ResendVerificationButton email={unverifiedEmail} />
                        </div>
                        : null}

                    <div className="flex flex-row gap-x-3 flex-1 w-full">
                        <Button
                            variant="primary"
                            onClick={handleLogin}
                        >
                            Login
                        </Button>
                    </div>

                    <span className="text-neutral-600 text-xs">Ainda não tem conta? <span className="text-brand font-bold cursor-pointer" onClick={() => navigate("/register")}>Criar conta</span></span>
                </div>
            </div>
            <div className="hidden lg:flex flex-1 justify-center bg-radial-[at_0%_90%] from-transparent from-10% via-brand/12 to-transparent to-90% h-screen">
                <div className="flex flex-col justify-center w-120 items-center gap-y-5">
                    <div className="flex w-full">
                        {/* Card colors (bg-white, text-ink), so it follows dark mode like the other cards */}
                        <span className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium h-max bg-white text-ink border-1 border-slate-200">
                            <Sparkles size={16} className="text-green-600" />
                            Compartilhe com a família
                        </span>
                    </div>

                    <div className="flex flex-col w-full">
                        <h3 className="text-xl font-[600]">Finanças pessoais & compartilhadas.</h3>
                        <span className="text-neutral-600 text-sm">Mapeie cada despesa, compartilhe com seu grupo e veja seu balanço crescer — tudo em um único lugar.</span>
                    </div>

                    <div className="flex flex-col w-full bg-white p-6 shadow-lg rounded-3xl">
                        <div className="flex justify-between w-full text-neutral-600 text-sm">
                            <span>Balanço</span>
                            <span>+24.6%</span>
                        </div>

                        <div className="flex justify-between w-full">
                            <span className="text-3xl font-bold text-brand">R$3.896,00</span>
                        </div>

                        <div className="flex justify-between items-end w-full mt-8 gap-2">
                            <div className="flex flex-1 h-13 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-8 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-10 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-16 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-12 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-10 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-8 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-10 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-4 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-8 rounded-2xl bg-brand" />
                            <div className="flex flex-1 h-16 rounded-2xl bg-brand" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Main;
