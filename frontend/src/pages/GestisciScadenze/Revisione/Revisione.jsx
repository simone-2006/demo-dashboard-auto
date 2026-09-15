import { CircleHelp, Pen, Plus, RotateCcwClock, Trash, TriangleAlert } from "lucide-react";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Tooltip from "../../../components/ui/Tooltip";
import Table from "../../../components/ui/Table";
import ConfirmBadge from "../../../components/ui/ConfirmBadge";
import { useParams, useOutletContext, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  formatDate,
  formatImporto,
  pickLatestByDate,
  revisioneStatus,
  scadenzaHighlightClass,
  deleteScadenzaConfirmDescription,
} from "../../../hooks/function";
import { deleteRevisione, getRevisioni } from "../../../api/revisioni";
import { gestisciScadenzeAddPath, gestisciScadenzeEditPath } from "../scadenzeRoutes";
import { useSessionState } from "../../../hooks/navigation";
import { toastDeleted, toastError } from "../../../hooks/toast";
import { useCachedResource } from "../../../hooks/useCachedResource";

import PageScadenze from "../layout/PageScadenze";

import NoteCell from "../../../components/ui/NoteCell";

function display(value) {
  const text = value == null ? "" : String(value).trim();
  return text === "" ? "—" : text;
}

function rowId(row) {
  return row?.Id ?? row?.id ?? null;
}

function revisioneValue(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value != null && value !== "") return value;
  }
  return null;
}

function normalizeRevisione(row) {
  const nome = revisioneValue(row, "nome", "Nome");
  const Data_revisione = revisioneValue(row, "Data_revisione");
  const Data_scadenza = revisioneValue(row, "Data_scadenza");
  const Esito = revisioneValue(row, "Esito", "esito");
  const Importo = revisioneValue(row, "Importo", "importo");
  const Centro_revisione = revisioneValue(row, "Centro_revisione", "centro_revisione");
  const Note = revisioneValue(row, "Note", "note");
  const { status, giorni } = revisioneStatus(Data_scadenza);
  return {
    ...row,
    nome,
    Data_revisione,
    Data_scadenza,
    Esito,
    Importo,
    Centro_revisione,
    Note,
    status,
    giorni,
  };
}

function revisioneTitolo(row) {
  if (display(row?.nome) !== "—") return row.nome;
  const raw = row?.Data_revisione;
  if (!raw) return "Revisione";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Revisione";
  return `Revisione ${date.getFullYear()}`;
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

function RevisioneActions({ vehicleId, id, onDelete, deleting, compact = false }) {
  const btn = compact
    ? "p-1 rounded-md"
    : "flex p-2 items-center justify-center rounded-md";

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Link
        to={gestisciScadenzeEditPath(vehicleId, "revisione", id)}
        className={`${btn} text-text hover:bg-bg-secondary`}
        aria-label="Modifica revisione"
      >
        <Pen size={14} />
      </Link>
      <button
        type="button"
        onClick={() => onDelete(id)}
        disabled={deleting}
        aria-label="Elimina revisione"
        className={`${btn} text-critical cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${compact ? "hover:bg-critical/20" : "bg-critical/10 hover:opacity-80"
          }`}
      >
        <Trash size={14} />
      </button>
    </div>
  );
}

function storicoColumns(vehicleId, onDelete, deletingId, latestId) {
  return [
    {
      header: "Nome",
      accessor: "nome",
      render: (value) => display(value),
    },
    {
      header: "Data revisione",
      accessor: "Data_revisione",
      render: (value) => display(formatDate(value)),
    },
    {
      header: "Data scadenza",
      accessor: "Data_scadenza",
      render: (value) => display(formatDate(value)),
    },
    {
      header: "Esito",
      accessor: "Esito",
      render: (value) => display(value),
    },
    {
      header: "Centro revisione",
      accessor: "Centro_revisione",
      render: (value) => display(value),
    },
    {
      header: "Importo",
      accessor: "Importo",
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
      accessor: "Note",
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
        <RevisioneActions
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

export default function Revisione() {
  const { id } = useParams();
  const outlet = useOutletContext() ?? {};
  const vehicleId = outlet.vehicleId ?? id;

  const { data, loading, error, setData: setRevisioni } = useCachedResource(
    vehicleId ? `revisioni:${vehicleId}` : null,
    () => getRevisioni(vehicleId).then((rows) => (Array.isArray(rows) ? rows : [])),
    Boolean(vehicleId)
  );
  const revisioni = Array.isArray(data) ? data : [];
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [storicoOpen, setStoricoOpen] = useSessionState(
    vehicleId ? `ui:storico-revisione:${vehicleId}` : undefined,
    false
  );

  function handleOpenCloseStorico() {
    setStoricoOpen((open) => !open);
  }

  const storicoData = useMemo(
    () => revisioni.map(normalizeRevisione),
    [revisioni]
  );
  const ultima = pickLatestByDate(storicoData, "Data_scadenza");
  const ultimaId = rowId(ultima);
  const pendingDelete = storicoData.find((row) => rowId(row) === pendingDeleteId);
  const pendingDeleteLabel = pendingDelete ? revisioneTitolo(pendingDelete) : null;

  function requestDelete(idToDelete) {
    if (idToDelete == null || deleting) return;
    setPendingDeleteId(idToDelete);
  }

  async function handleConfirmDelete() {
    if (pendingDeleteId == null || deleting) return;
    setDeleting(true);
    try {
      await deleteRevisione(pendingDeleteId, vehicleId);
      toastDeleted("Revisione eliminata");
      setRevisioni((prev) =>
        prev.filter((row) => rowId(row) !== pendingDeleteId)
      );
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
        <h2 className="font-bold text-text text-xl">Revisione</h2>
        <Link to={gestisciScadenzeAddPath(vehicleId, "revisione")}>
          <Button type="button" size="md">
            <span className="flex items-center gap-1">
              <Plus size={14} />
              Nuova revisione
            </span>
          </Button>
        </Link>
      </div>

      <div
        className={`rounded-md shadow-lg p-4 ${scadenzaHighlightClass(ultima?.status)}`}
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
              {Array.from({ length: 4 }).map((_, index) => (
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
        ) : !ultima ? (
          <div className="py-6">
            <p className="font-medium text-text">Nessuna revisione</p>
            <p className="mt-1 text-sm text-text-secondary">
              Non è ancora registrata una revisione per questo veicolo.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-text-secondary mb-1">Ultima revisione</p>
                <h3 className="font-bold text-text text-xl">{revisioneTitolo(ultima)}</h3>
              </div>
              <RevisioneActions
                vehicleId={vehicleId}
                id={ultimaId}
                onDelete={requestDelete}
                deleting={deleting || pendingDeleteId != null}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField
                label="Data revisione"
                value={formatDate(ultima.Data_revisione)}
              />
              <div className="flex items-center gap-4">
                <InfoField
                  label="Data scadenza"
                  value={formatDate(ultima.Data_scadenza)}
                  hint="Termine di validità della revisione. Di solito due anni dopo il controllo."
                />
                {ultima.status ? (
                  <Badge status={ultima.status} giorni={ultima.giorni} />
                ) : null}
              </div>
              <InfoField label="Esito" value={ultima.Esito} />
              <InfoField label="Centro revisione" value={ultima.Centro_revisione} />
              <InfoField label="Importo" value={formatImporto(ultima.Importo)} />
              <div className="sm:col-span-2">
                <InfoField label="Note" value={ultima.Note} />
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
            <h2 className="font-bold text-text text-lg">Storico revisioni</h2>
          </div>
          <Table
            columns={storicoColumns(vehicleId, requestDelete, pendingDeleteId, ultimaId)}
            data={storicoData}
            persistKey={vehicleId ? `table:storico-revisione:${vehicleId}` : undefined}
            rowClassName={(row) =>
              ultimaId != null && rowId(row) === ultimaId ? "bg-brand/10" : undefined
            }
          />
        </div>
      ) : null}

      <ConfirmBadge
        open={pendingDeleteId != null}
        title="Sei sicuro di voler eliminare questa revisione?"
        description={deleteScadenzaConfirmDescription("revisione", pendingDeleteLabel)}
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
