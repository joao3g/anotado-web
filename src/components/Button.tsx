type ButtonVariants =
    | "primary"
    | "secondary"
    | "danger"

export type ButtonProps = {
    children: React.ReactNode
    variant: ButtonVariants
    onClick?: React.MouseEventHandler
    disabled?: boolean
    type?: "button" | "submit" // Set "submit" inside a <form>; not set = browser default (as before)
}

const variants = {
    primary: "px-4 py-2 text-brand-cream bg-brand hover:opacity-95 font-normal text-md shadow-brand/15 shadow-lg",
    secondary: "px-4 py-2 text-ink bg-white font-normal text-sm shadow-black-100 shadow-sm/20 inset-shadow-sm hover:text-brand hover:bg-brand/10",
    danger: "px-4 py-2 text-white bg-red-500 text-sm hover:opacity-80"
}

export function Button(props: ButtonProps) {
    return (
        <button
            className={`
                rounded-full cursor-pointer w-full h-max
                disabled:opacity-50 disabled:pointer-events-none
                ${props.variant ? variants[props.variant] : undefined}
            `}
            disabled={props.disabled}
            onClick={props.onClick}
            type={props.type}
        >
            {props.children}
        </button>
    )
}