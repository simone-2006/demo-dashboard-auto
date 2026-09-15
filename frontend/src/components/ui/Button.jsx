export default function Button({
    children,
    variant = "primary",
    size = "sm",
    className = "",
    notificationBadge = false,
    loading = false,
    disabled = false,
    ...props
}) {
    const variantClasses = {
        primary: "text-on-brand bg-brand hover:bg-brand-hover",
        ghost: "text-text bg-bg-secondary hover:bg-bg-secondary",
        danger: "bg-critical/5 text-critical hover:bg-critical/10",
        critical: "bg-critical text-on-brand hover:bg-critical-dark"
    };

    const sizeClasses = {
        sm: "px-2 py-0.5",
        md: "px-3 py-1.5",
    };

    const buttonClassName = [
        "text-sm cursor-pointer rounded-md transition-colors select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed relative",
        sizeClasses[size] || sizeClasses.sm,
        variantClasses[variant] || "",
        className,
    ]
        .join(" ")
        .trim();

    return (
        <button
            {...props}
            className={buttonClassName}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
        >
            {notificationBadge && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-critical animate-pulse"></span>
                </span>
            )}


            {children}
        </button>
    );
}
