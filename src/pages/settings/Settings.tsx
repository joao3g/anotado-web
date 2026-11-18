import { NavLink, Outlet } from 'react-router';
import { Shield, User, Users } from 'lucide-react';

const TABS = [
    { path: "/settings/profile", label: "Perfil", icon: User },
    { path: "/settings/family", label: "Família", icon: Users },
    { path: "/settings/security", label: "Segurança", icon: Shield },
];

// Settings: submenu (Perfil, Família, Segurança) + the selected tab (nested route).
export default function SettingsPage() {
    return (
        <div className="flex flex-col w-full max-w-3xl">
            <div className="flex flex-col mb-4">
                <span className="text-2xl md:text-3xl font-[600]">Configurações</span>
                <span className="text-sm/6 text-neutral-600">Gerencie seu perfil, sua família e sua segurança.</span>
            </div>

            <nav className="flex gap-2 mb-6 overflow-x-auto" aria-label="Configurações">
                {TABS.map(tab => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `flex items-center gap-2 shrink-0 px-4 py-2 rounded-full text-sm font-[600] ${isActive ? "bg-brand/10 text-brand" : "bg-white text-neutral-600 border-1 border-slate-200 hover:bg-brand/5"}`
                        }
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </NavLink>
                ))}
            </nav>

            <Outlet />
        </div>
    );
}
