import { Link } from "react-router-dom";
import { Pen, Expand, Trash } from "lucide-react";

const actionClass =
  "flex p-2 items-center justify-center gap-1 rounded-md text-text hover:bg-bg-secondary";
const deleteClass =
  "flex p-2 items-center justify-center gap-1 rounded-md text-critical bg-critical/10 hover:opacity-80 cursor-pointer";

export default function VehicleActions({
  vehicleId,
  onDelete,
  showExpand = true,
  showLabels = false,
}) {
  if (!vehicleId) return null;

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Link
        to={`/editCar/${vehicleId}`}
        className={actionClass}
        aria-label="Modifica auto"
      >
        {showLabels ? <p className="md:block hidden text-xs">Modifica</p> : null}
        <Pen size={14} />
      </Link>
      {showExpand ? (
        <Link
          to={`/carInfo/${vehicleId}`}
          className={actionClass}
          aria-label="Apri dettaglio"
        >
          {showLabels ? (
            <p className="md:block hidden text-xs">Espandi dettagli</p>
          ) : null}
          <Expand size={14} />
        </Link>
      ) : null}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Elimina auto"
        className={deleteClass}
      >
        {showLabels ? <p className="md:block hidden text-xs">Elimina</p> : null}
        <Trash size={14} />
      </button>
    </div>
  );
}
