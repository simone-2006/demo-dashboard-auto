import {
  formattaGiorni,
  scadenzaTone,
  STATUS_SCADUTA,
  STATUS_TOLLERANZA,
} from "../../hooks/function";

const TONE_CLASS = {
  ok: "bg-success text-white",
  watch: "bg-warning text-text",
  soon: "bg-accent text-white",
  urgent: "bg-critical text-white",
  expired: "bg-expired text-white font-semibold",
  tolerance: "bg-tolerance text-white font-semibold",
  unknown: "bg-bg-secondary text-text",
};

function badgeLabel(status, giorni) {
  if (status === STATUS_TOLLERANZA || status === STATUS_SCADUTA) {
    return status;
  }
  if (giorni === 0) return "Scade oggi";
  if (giorni == null) return status ?? "—";
  return `Scade tra ${formattaGiorni(giorni)}`;
}

export default function Badge({ status, giorni }) {
  const tone = scadenzaTone(status, giorni);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TONE_CLASS[tone] ?? TONE_CLASS.unknown}`}
    >
      {badgeLabel(status, giorni)}
    </span>
  );
}
