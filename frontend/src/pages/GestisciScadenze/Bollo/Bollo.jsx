import { CircleHelp, Pen, Plus, RotateCcwClock, Trash, TriangleAlert } from "lucide-react";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Tooltip from "../../../components/ui/Tooltip";
import Table from "../../../components/ui/Table";
import ConfirmBadge from "../../../components/ui/ConfirmBadge";
import { useParams, useOutletContext, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  bolloStatus,
  formatDate,
  formatImporto,
  pickLatestByDate,
  scadenzaHighlightClass,
  deleteScadenzaConfirmDescription,
} from "../../../hooks/function";
import { deleteBollo, getBolli } from "../../../api/bolli";
import { gestisciScadenzeAddPath, gestisciScadenzeEditPath } from "../scadenzeRoutes";
import { useSessionState } from "../../../hooks/navigation";
import { toastDeleted, toastError } from "../../../hooks/toast";
import { useCachedResource } from "../../../hooks/useCachedResource";

import NoteCell from "../../../components/ui/NoteCell";

import PageScadenze from "../layout/PageScadenze";

function display(value) {
  const text = value == null ? "" : String(value).trim();
  return text === "" ? "—" : text;
}

function rowId(row) {
  return row?.Id ?? row?.id ?? null;
}

function bolloValue(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value != null && value !== "") return value;
  }
  return null;
}

function normalizeBollo(row) {
  const nome = bolloValue(row, "nome", "Nome");
  const inizio_validita = bolloValue(row, "inizio_validita", "Inizio_validita");
  const fine_validita = bolloValue(row, "fine_validita", "Fine_validita");
  const scadenza = bolloValue(row, "scadenza", "Scadenza", "Data_scadenza");
  const importo = bolloValue(row, "importo", "Importo");
  const note = bolloValue(row, "note", "Note");
  const { status, giorni } = bolloStatus(scadenza);
  return { ...row, nome, inizio_validita, fine_validita, scadenza, importo, note, status, giorni };
}

function bolloAnno(row) {
  const raw = row?.scadenza ?? row?.fine_validita ?? row?.inizio_validita;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return String(date.getFullYear());
}

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

function BolloActions({ vehicleId, id, onDelete, deleting, compact = false }) {
  const btn = compact
    ? "p-1 rounded-md"
    : "flex p-2 items-center justify-center rounded-md";

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Link
        to={gestisciScadenzeEditPath(vehicleId, "bollo", id)}
        className={`${btn} text-text hover:bg-bg-secondary`}
        aria-label="Modifica bollo"
      >
        <Pen size={14} />
      </Link>
      <button
        type="button"
        onClick={() => onDelete(id)}
        disabled={deleting}
        aria-label="Elimina bollo"
        className={`${btn} text-critical cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${compact ? "hover:bg-critical/20" : "bg-critical/10 hover:opacity-80"
          }`}
      >
        <Trash size={14} />
      </button>
    </div>
  );
}

// function NoteCell({ value }) {
//   return (
//     <span
//       className="
//         block max-w-[16ch] truncate
//         text-ellipsis
//         whitespace-nowrap
//         overflow-hidden
//         hover:whitespace-normal
//         hover:overflow-visible
//         hover:relative
//         hover:z-10
//         hover:bg-bg
//         hover:shadow-lg
//         hover:p-2
//         hover:rounded
//       "
//     >
//       {value}
//     </span>
//   );
// }

function storicoColumns(vehicleId, onDelete, deletingId, latestId) {
  return [
    {
      header: "Nome",
      accessor: "nome",
      render: (value) => display(value),
    },
    {
      header: "Inizio validità",
      accessor: "inizio_validita",
      render: (value) => display(formatDate(value)),
    },
    {
      header: "Fine validità",
      accessor: "fine_validita",
      render: (value) => display(formatDate(value)),
    },
    {
      header: "Data scadenza",
      accessor: "scadenza",
      render: (value) => display(formatDate(value)),
    },
    {
      header: "Importo",
      accessor: "importo",
      sortValue: (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
      },
      render: (value) => display(formatImporto(value)),
    },
    {
      header: "Stato",
      accessor: "status",
      filterable: false,
      sortValue: (_value, row) => row.giorni,
      render: (status, row) =>
        status && latestId != null && rowId(row) === latestId ? (
          <div className="opacity-60 hover:opacity-100 transition-all">
            <Badge status={status} giorni={row.giorni} />
          </div>
        ) : (
          "—"
        ),
    },
    {
      header: "Note",
      accessor: "note",
      filterable: false,
      sortable: false,
      render: (value) => <NoteCell value={value} />,
    },
    {
      header: "Azioni",
      accessor: "azioni",
      filterable: false,
      sortable: false,
      render: (_value, row) => (
        <BolloActions
          vehicleId={vehicleId}
          id={rowId(row)}
          onDelete={onDelete}
          deleting={deletingId != null}
          compact
        />
      ),
    },
  ];
}

export default function Bollo() {
  const { id } = useParams();
  const outlet = useOutletContext() ?? {};
  const vehicleId = outlet.vehicleId ?? id;

  const { data, loading, error, setData: setBolli } = useCachedResource(
    vehicleId ? `bolli:${vehicleId}` : null,
    () => getBolli(vehicleId).then((rows) => (Array.isArray(rows) ? rows : [])),
    Boolean(vehicleId)
  );
  const bolli = Array.isArray(data) ? data : [];
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [storicoOpen, setStoricoOpen] = useSessionState(
    vehicleId ? `ui:storico-bollo:${vehicleId}` : undefined,
    false
  );

  function handleOpenCloseStorico() {
    setStoricoOpen((open) => !open);
  }

  const storicoData = useMemo(
    () => bolli.map(normalizeBollo),
    [bolli]
  );
  const ultimo = pickLatestByDate(storicoData, "scadenza");
  const ultimoId = rowId(ultimo);
  const anno = bolloAnno(ultimo);
  const pendingDelete = storicoData.find((row) => rowId(row) === pendingDeleteId);
  const pendingDeleteLabel =
    display(pendingDelete?.nome) !== "—"
      ? pendingDelete?.nome
      : bolloAnno(pendingDelete)
        ? `Bollo ${bolloAnno(pendingDelete)}`
        : null;

  function requestDelete(idToDelete) {
    if (idToDelete == null || deleting) return;
    setPendingDeleteId(idToDelete);
  }

  async function handleConfirmDelete() {
    if (pendingDeleteId == null || deleting) return;
    setDeleting(true);
    try {
      await deleteBollo(pendingDeleteId, vehicleId);
      toastDeleted("Bollo eliminato");
      setBolli((prev) => prev.filter((row) => rowId(row) !== pendingDeleteId));
      setPendingDeleteId(null);
    } catch (err) {
      toastError(err.message || "Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageScadenze>
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-text text-xl">Bollo</h2>
        <Link to={gestisciScadenzeAddPath(vehicleId, "bollo")}>
          <Button type="button" size="md">
            <span className="flex items-center gap-1">
              <Plus size={14} />
              Nuovo bollo
            </span>
          </Button>
        </Link>
      </div>

      <div
        className={`rounded-md shadow-lg p-4 ${scadenzaHighlightClass(ultimo?.status)}`}
      >
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-bg-secondary" />
                <div className="h-6 w-48 rounded bg-bg-secondary" />
              </div>
              <div className="h-5 w-24 rounded bg-bg-secondary" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-24 rounded bg-bg-secondary" />
                  <div className="h-4 w-40 rounded bg-bg-secondary" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="py-6">
            <p className="font-medium text-text">{error?.message || error || "Veicolo non trovato"}</p>
            <p className="mt-1 text-sm text-text-secondary">
              Riprova tra poco o torna al dettaglio del veicolo.
            </p>
          </div>
        ) : !ultimo ? (
          <div className="py-6">
            <p className="font-medium text-text">Nessun bollo</p>
            <p className="mt-1 text-sm text-text-secondary">
              Non è ancora registrato un bollo per questo veicolo.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-text-secondary mb-1">Ultimo bollo</p>
                <h3 className="font-bold text-text text-xl">
                  {display(ultimo.nome) !== "—"
                    ? ultimo.nome
                    : anno
                      ? `Bollo`
                      : "Bollo auto"}
                </h3>
              </div>
              <BolloActions
                vehicleId={vehicleId}
                id={ultimoId}
                onDelete={requestDelete}
                deleting={deleting || pendingDeleteId != null}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                label="Inizio validità"
                value={formatDate(ultimo.inizio_validita)}
              />
              <InfoField
                label="Fine validità"
                value={formatDate(ultimo.fine_validita)}
              />
              <div className="flex items-center gap-4">
                <InfoField
                  label="Data scadenza"
                  value={formatDate(ultimo.scadenza)}
                  hint="Termine per il pagamento del bollo."
                />
                {ultimo.status ? (
                  <Badge status={ultimo.status} giorni={ultimo.giorni} />
                ) : null}
              </div>
              <InfoField label="Importo" value={formatImporto(ultimo.importo)} />
              <div className="sm:col-span-2">
                <InfoField label="Note" value={ultimo.note} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end my-2">
        <button className="text-brand hover:underline text-sm cursor-pointer" onClick={handleOpenCloseStorico}>
          {storicoOpen ? "Chiudi storico" : "Visualizza storico"}
        </button>
      </div>

      {storicoOpen ? (
        <div className="rounded-md shadow-lg p-4 bg-bg">
          <div className="flex items-center gap-1 my-4">
            <RotateCcwClock size={14} />
            <h2 className="font-bold text-text text-lg">Storico bolli</h2>
          </div>
          <Table
            columns={storicoColumns(vehicleId, requestDelete, pendingDeleteId, ultimoId)}
            data={storicoData}
            persistKey={vehicleId ? `table:storico-bollo:${vehicleId}` : undefined}
            rowClassName={(row) =>
              ultimoId != null && rowId(row) === ultimoId ? "bg-brand/10" : undefined
            }
          />
        </div>
      ) : null}

      <ConfirmBadge
        open={pendingDeleteId != null}
        title="Sei sicuro di voler eliminare questo bollo?"
        description={deleteScadenzaConfirmDescription("bollo", pendingDeleteLabel)}
        confirmText="Si, elimina"
        cancelText="No, annulla"
        icon={<TriangleAlert size={30} />}
        confirmButtonProps={{ variant: "critical" }}
        cancelButtonProps={{ variant: "ghost" }}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) setPendingDeleteId(null);
        }}
      />
    </PageScadenze>
  );
}
