import Tooltip from "../ui/Tooltip"
import { CircleHelp } from "lucide-react";

export default function Field({ id, label, required, children, hint }) {
    return (
        <div>
            <div className="flex items-center gap-1">
                <label htmlFor={id} className="block text-sm font-medium text-text mb-1">
                    {label}
                    {required ? <span className="text-critical"> *</span> : null}
                </label>
                {hint ? (
                    <Tooltip content={hint}>
                        <button type="button" className="text-text-muted hover:text-text" aria-label={hint}>
                            <CircleHelp className="size-3.5" />
                        </button>
                    </Tooltip>
                ) : null}
            </div>
            {children}
        </div>
    );
}

{/*
function InfoField({ label, value, hint }) {
  const text = display(value);
  const empty = text === "—";
  return (
    <div>
      <p className="text-sm font-medium text-text inline-flex items-center gap-1">
        {label}
        {hint ? (
          <Tooltip content={hint}>
            <button type="button" className="text-text-muted hover:text-text" aria-label={hint}>
              <CircleHelp className="size-3.5" />
            </button>
          </Tooltip>
        ) : null}
      </p>
      <p className={empty ? "text-sm text-text-muted" : "text-sm text-text whitespace-pre-wrap"}>{text}</p>
    </div>
  );
}
    */}