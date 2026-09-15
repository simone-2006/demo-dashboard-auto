import { TriangleAlert } from "lucide-react";
import { deleteVehicle } from "../../api/vehicles";
import { Link } from "react-router-dom";
import { useState } from "react";
import CarNameLogo from "./CarNameLogo";
import ScadenzeAuto from "./ScadenzeAuto";
import CompanyBadge from "./CompanyBadge";
import VehicleActions from "./VehicleActions";
import ConfirmBadge from "./ConfirmBadge";
import TelepassChips from "./TelepassChips";
import { toastDeleted, toastError } from "../../hooks/toast";
import {
  vehicleName,
  isTelepassOn,
  deleteVehicleConfirmDescription,
} from "../../hooks/function";

export default function CarCard({ macchina, onDeleted }) {
  const vehicleId = macchina.Id ?? macchina.id;
  const name = vehicleName(macchina);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!vehicleId) return;
    setDeleting(true);
    try {
      await deleteVehicle(vehicleId);
      toastDeleted(`Macchina ${name} eliminata`);
      setConfirmDeleteOpen(false);
      onDeleted?.(vehicleId);
    } catch (err) {
      toastError(err.message || "Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative bg-bg rounded-md shadow-lg my-6 p-3">
      <div className="flex items-start justify-between gap-2">
        <Link to={vehicleId ? `/carInfo/${vehicleId}` : "/car"}>
          <CarNameLogo macchina={macchina} />
        </Link>
        <VehicleActions
          vehicleId={vehicleId}
          showLabels
          onDelete={() => setConfirmDeleteOpen(true)}
        />
      </div>

      <div className="flex items-center justify-between w-full mt-2 gap-5">
        <div className="flex items-start gap-1">
          <p className="text-text-secondary text-xs font-bold">Note:</p>
          <p className="text-text-secondary text-xs">{macchina.Note || "-"}</p>
        </div>
        <div className="flex items-center gap-1">
          {isTelepassOn(macchina.TelepassSINO) ? (
            <TelepassChips telepassNumero={macchina.TelepassNumero} />
          ) : null}
          <CompanyBadge name={macchina.Azienda} />
        </div>
      </div>

      <ScadenzeAuto macchina={macchina} />

      <ConfirmBadge
        open={confirmDeleteOpen}
        title="Sei sicuro di voler eliminare questa macchina?"
        description={deleteVehicleConfirmDescription(macchina)}
        confirmText="Si, elimina"
        cancelText="No, annulla"
        icon={<TriangleAlert size={30} />}
        confirmButtonProps={{ variant: "critical" }}
        cancelButtonProps={{ variant: "ghost" }}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setConfirmDeleteOpen(false);
        }}
      />
    </div>
  );
}
