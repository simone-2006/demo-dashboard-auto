import { ChevronLeft } from "lucide-react";
import { useGoBack, useLeaveScadenze } from "../../hooks/navigation";
import Button from "./Button";

export default function BackButton({
  fallback,
  disabled,
  leaveScadenze,
  vehicleId,
  "aria-label": ariaLabel = "Indietro",
}) {
  const goBack = useGoBack(fallback);
  const leave = useLeaveScadenze(vehicleId);
  const onClick = leaveScadenze ? leave : goBack;

  return (
    <Button
      type="button"
      variant="ghost"
      size="md"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <ChevronLeft />
    </Button>
  );
}
