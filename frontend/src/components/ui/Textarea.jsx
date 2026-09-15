const baseTextarea =
  "w-full min-h-[5rem] px-2.5 py-2 rounded-md border text-sm outline-none transition resize-y placeholder:text-text-muted disabled:opacity-50 disabled:pointer-events-none";

const textareaVariants = {
  primary:
    "bg-bg border-border text-text focus:border-brand focus:ring-2 focus:ring-brand/20",
  secondary:
    "bg-bg-secondary border-border text-text focus:border-border focus:ring-2 focus:ring-gray-200",
  danger:
    "bg-bg border-critical text-text focus:border-critical focus:ring-2 focus:ring-critical/20",
};

export default function Textarea({
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) {
  const textareaClassName = [
    baseTextarea,
    textareaVariants[variant] || textareaVariants.primary,
    className,
  ]
    .join(" ")
    .trim();

  return (
    <textarea {...props} disabled={disabled} className={textareaClassName} />
  );
}
