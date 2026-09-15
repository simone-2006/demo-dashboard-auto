const baseInput =
    "w-full h-9 px-2.5 rounded-md border text-sm outline-none transition placeholder:text-text-muted disabled:opacity-50 disabled:pointer-events-none";

const inputVariants = {
    primary:
        "bg-bg border-border text-text focus:border-brand focus:ring-2 focus:ring-brand/20",
    secondary:
        "bg-bg-secondary border-border text-text focus:border-border focus:ring-2 focus:ring-gray-200",
    danger:
        "bg-bg border-critical text-text focus:border-critical focus:ring-2 focus:ring-critical/20",
};

const controlBase =
    "size-4 accent-brand cursor-pointer disabled:opacity-50 disabled:pointer-events-none";

export default function Input({
    variant = "primary",
    className = "",
    type = "text",
    disabled = false,
    ...props
}) {
    const isControl = type === "radio" || type === "checkbox";
    const inputClassName = isControl
        ? [controlBase, className].join(" ").trim()
        : [baseInput, inputVariants[variant] || inputVariants.primary, className]
            .join(" ")
            .trim();

    return (
        <input
            {...props}
            type={type}
            disabled={disabled}
            className={inputClassName}
        />
    );
}
