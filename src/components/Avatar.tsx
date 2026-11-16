type AvatarProps = {
    name?: string | null
    avatar?: string | null // "data:image/jpeg;base64,..." or null
    className?: string // Size and text size, e.g. "size-10 text-sm"
}

function getInitials(name?: string | null) {
    return (name ?? "")
        .split(" ")
        .filter(Boolean)
        .map(part => part[0].toUpperCase())
        .slice(0, 2)
        .join("");
}

// Profile photo, or the initials on the app's green gradient when there is no photo.
export function Avatar(props: AvatarProps) {
    const className = props.className ?? "size-10 text-sm";

    if (props.avatar) {
        return (
            <img
                src={props.avatar}
                alt={props.name ? `Foto de ${props.name}` : "Foto de perfil"}
                className={`${className} shrink-0 rounded-full object-cover`}
            />
        );
    }

    return (
        <div className={`${className} shrink-0 flex justify-center items-center rounded-full bg-linear-120 from-emerald-600 from-30% to-teal-500`}>
            <span className="font-[700] text-white/80">{getInitials(props.name)}</span>
        </div>
    );
}
