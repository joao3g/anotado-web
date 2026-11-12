export function LoadingSkeleton(props: { className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={`animate-pulse bg-gray-400/40 ${props.className ?? ""}`}
        />
    )
}