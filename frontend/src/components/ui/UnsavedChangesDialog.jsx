import { TriangleAlert } from "lucide-react";
import ConfirmBadge from "./ConfirmBadge";

export default function UnsavedChangesDialog({ open, onConfirm, onCancel }) {
  return (
    <ConfirmBadge
      open={open}
      title="Sei sicuro di voler uscire?"
      description="Andranno perse le modifiche non salvate."
      confirmText="Si, esci"
      cancelText="No, resta"
      icon={<TriangleAlert size={30} />}
      confirmButtonProps={{ variant: "primary" }}
      cancelButtonProps={{ variant: "ghost" }}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
