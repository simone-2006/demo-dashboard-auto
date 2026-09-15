import { useParams, useNavigate, Link } from "react-router-dom";
import Page from "../components/layout/Page";
import Button from "../components/ui/Button";
import { getVehicle, deleteVehicle } from "../api/vehicles";
import ScadenzeAuto from "../components/ui/ScadenzeAuto";
import Title from "../components/ui/Title";
import CarNameLogo from "../components/ui/CarNameLogo";
import VehicleActions from "../components/ui/VehicleActions";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import {
  formatDate,
  formatOwnership,
  isTelepassOn,
  vehicleName,
  deleteVehicleConfirmDescription,
} from "../hooks/function";
import BackButton from "../components/ui/BackButton";
import { getCarsListPath } from "../hooks/navigation";
import CompanyBadge from "../components/ui/CompanyBadge";
import ConfirmBadge from "../components/ui/ConfirmBadge";
import { toastDeleted, toastError } from "../hooks/toast";
import { useCachedResource } from "../hooks/useCachedResource";

function InfoField({ label, value }) {
  const text = value == null ? "" : String(value).trim();
  const empty = text === "";
  return (
    <div>
      <p className="text-sm font-medium text-text mb-1">{label}</p>
      <p className={empty ? "text-sm text-text-muted" : "text-sm text-text"}>
        {empty ? "—" : text}
      </p>
    </div>
  );
}

export default function CarInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: macchina, loading, error } = useCachedResource(
    id ? `vehicle:${id}` : null,
    () => getVehicle(id),
    Boolean(id)
  );

  const telepassOn = isTelepassOn(macchina?.TelepassSINO);
  const name = vehicleName(macchina);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteVehicle(id);
      toastDeleted(`Macchina ${name} eliminata`);
      setConfirmDeleteOpen(false);
      navigate(getCarsListPath(), { replace: true });
    } catch (err) {
      toastError(err.message || "Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Page>
      <Title
        left={
          <div className="flex gap-1 items-center">
            <BackButton fallback={getCarsListPath()} />
            <h2 className="font-bold text-text text-xl">Dettaglio auto</h2>
          </div>
        }
      />

      <div className="w-full">
        <div className="relative bg-bg rounded-md shadow-lg p-4 mt-2">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-md bg-bg-secondary" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-48 rounded bg-bg-secondary" />
                  <div className="h-4 w-28 rounded bg-bg-secondary" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 w-24 rounded bg-bg-secondary" />
                    <div className="h-4 w-40 rounded bg-bg-secondary" />
                  </div>
                ))}
              </div>
            </div>
          ) : error || !macchina ? (
            <div className="py-8 text-center">
              <p className="font-medium text-text">
                {error?.message || "Veicolo non trovato"}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Torna all&apos;elenco e riprova con un altro veicolo.
              </p>
              <Link to={getCarsListPath()} className="inline-block mt-4">
                <Button type="button" size="md">
                  Torna alle macchine
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CarNameLogo macchina={macchina} />
                <VehicleActions
                  vehicleId={id}
                  showExpand={false}
                  showLabels
                  onDelete={() => setConfirmDeleteOpen(true)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="Marca" value={macchina.Brand} />
                <InfoField label="Modello" value={macchina.Modello} />
                <InfoField label="Targa" value={macchina.Targa} />
                <InfoField
                  label="Immatricolazione"
                  value={formatDate(macchina.Immatricolazione)}
                />
                <InfoField
                  label="Proprietà / Leasing"
                  value={formatOwnership(macchina.ProprietaLeasing)}
                />
                <InfoField label="Contratto" value={macchina.Contratto} />
                <InfoField label="Telepass" value={telepassOn ? "Sì" : "No"} />
                <InfoField
                  label="Numero Telepass"
                  value={telepassOn ? macchina.TelepassNumero : null}
                />
                <InfoField label="Assegnazione" value={macchina.Assegnazione} />
                <InfoField label="Email" value={macchina.EmailAssegnatario} />
                <InfoField label="Seconda chiave" value={macchina.SecondaChiave} />
                <div>
                  <p className="text-sm font-medium text-text mb-1">
                    Intestata a (azienda)
                  </p>
                  <CompanyBadge name={macchina.Azienda} />
                </div>
              </div>

              <InfoField label="Note" value={macchina.Note} />

              <ScadenzeAuto macchina={macchina} />

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-text-muted">
                <span>
                  Creato il {formatDate(macchina.CreatedAt) || "—"}
                </span>
                <span>
                  Aggiornato il {formatDate(macchina.UpdatedAt) || "—"}
                </span>
              </div>

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
          )}
        </div>
      </div>
    </Page>
  );
}
