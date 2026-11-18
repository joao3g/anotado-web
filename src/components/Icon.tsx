import { CreditCard, Tag } from "lucide-react";
import { hexToHsl } from "../utils";

function getIconColor(color: string) {
    const { h, s } = hexToHsl(color);

    return `hsl(${h},${Math.min(s + 10, 100)}%,20%)`;
}

// App logo. Decorative: the "Anotado" name is always shown next to it.
export function Icon() {
    return <img src="/icons/icon-192.png" alt="" className="size-9 shrink-0" />;
}

export function CategoryIcon(props: { color: string }) {
    return (
        <div className="flex items-center justify-center size-10 rounded-full" style={{ backgroundColor: `#${props.color}` }}>
            <Tag size={18} color={getIconColor(props.color)} />
        </div>
    );
}

// Same look as CategoryIcon, with a card icon. `color` is hex WITHOUT "#".
export function CardIcon(props: { color: string }) {
    return (
        <div className="flex items-center justify-center size-10 rounded-full" style={{ backgroundColor: `#${props.color}` }}>
            <CreditCard size={18} color={getIconColor(props.color)} />
        </div>
    );
}