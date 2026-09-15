import Table from "../components/ui/Table";
import { deleteVehicle, getVehicles } from "../api/vehicles";
import Targa from "../components/ui/Targa";
import NoteCell from "../components/ui/NoteCell";
import {
  formatDate,
  formatOwnership,
  isTelepassOn,
  vehicleName,
  deleteVehicleConfirmDescription,
} from "../hooks/function";
import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import CompanyBadge from "../components/ui/CompanyBadge";
import ConfirmBadge from "../components/ui/ConfirmBadge";
import VehicleActions from "../components/ui/VehicleActions";
import { toastDeleted, toastError } from "../hooks/toast";
import { useCachedResource } from "../hooks/useCachedResource";

function makeTableColumns(onRequestDelete) {
  return [
    {
      header: "Brand",
      accessor: "Brand",
    },
    {
      header: "Modello",
      accessor: "Modello",
    },
    {
      header: "Targa",
      accessor: "Targa",
      render: (value, row) => (
        <Link to={`/carInfo/${row.Id}`}>
          <Targa targa={value} />
        </Link>
      ),
      sortable: false,
    },
    {
      header: "Assegnazione",
      accessor: "Assegnazione",
    },
    {
      header: "Immatricolazione",
      accessor: "Immatricolazione",
      render: (value) => formatDate(value),
    },
    {
      header: "Seconda chiave",
      accessor: "SecondaChiave",
    },
    {
      header: "Telepass",
      accessor: "TelepassSINO",
      render: (value, row) => {
        if (isTelepassOn(value)) {
          return row.TelepassNumero ? `SI, ${row.TelepassNumero}` : "SI";
        }
        return "NO";
      },
    },
    {
      header: "Note",
      accessor: "Note",
      render: (value) => <NoteCell value={value} />,
      sortable: false,
    },
    {
      header: "Proprietà/Leasing",
      accessor: "ProprietaLeasing",
      render: (value) => formatOwnership(value),
    },
    {
      header: "Azienda",
      accessor: "Azienda",
      render: (value) => <CompanyBadge name={value} />,
    },
    {
      header: "Azioni",
      render: (_value, row) => (
        <VehicleActions
          vehicleId={row.Id}
          onDelete={() => onRequestDelete(row)}
        />
      ),
    },
  ];
}

export default function CarTable() {
  const { data, error, setData: setVehicles } = useCachedResource(
    "vehicles",
    getVehicles
  );
  const vehicles = Array.isArray(data) ? data : [];
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!pendingDelete?.Id) return;
    const name = vehicleName(pendingDelete);
    setDeleting(true);
    try {
      await deleteVehicle(pendingDelete.Id);
      toastDeleted(`Macchina ${name} eliminata`);
      setVehicles((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (row) => row.Id !== pendingDelete.Id
        )
      );
      setPendingDelete(null);
    } catch (err) {
      toastError(err.message || "Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
    }
  }

  if (error) {
    return <div style={{ color: "red" }}>{error.message || String(error)}</div>;
  }

  return (
    <div className="relative">
      <Table
        columns={makeTableColumns(setPendingDelete)}
        data={vehicles}
        persistKey="table:/car/table"
      />
      <ConfirmBadge
        open={Boolean(pendingDelete)}
        title="Sei sicuro di voler eliminare questa macchina?"
        description={deleteVehicleConfirmDescription(pendingDelete)}
        confirmText="Si, elimina"
        cancelText="No, annulla"
        icon={<TriangleAlert size={30} />}
        confirmButtonProps={{ variant: "critical" }}
        cancelButtonProps={{ variant: "ghost" }}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
      />
    </div>
  );
}
