const baseSelect =
  "w-full h-9 px-2.5 rounded-md border text-sm outline-none transition bg-bg disabled:opacity-50 disabled:pointer-events-none";

const selectVariants = {
  primary:
    "border-border text-text focus:border-brand focus:ring-2 focus:ring-brand/20",
  secondary:
    "border-border bg-bg-secondary text-text focus:border-border focus:ring-2 focus:ring-gray-200",
  danger:
    "border-critical text-text focus:border-critical focus:ring-2 focus:ring-critical/20",
};

export default function Select({
  variant = "primary",
  className = "",
  disabled = false,
  children,
  ...props
}) {
  const selectClassName = [
    baseSelect,
    selectVariants[variant] || selectVariants.primary,
    className,
  ]
    .join(" ")
    .trim();

  return (
    <select {...props} disabled={disabled} className={selectClassName}>
      {children}
    </select>
  );
}
