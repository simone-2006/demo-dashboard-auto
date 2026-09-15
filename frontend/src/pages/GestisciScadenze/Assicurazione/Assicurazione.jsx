import { useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { CircleHelp, Plus, RotateCcwClock, Pen, Trash, TriangleAlert } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Tooltip from "../../../components/ui/Tooltip";
import Table from "../../../components/ui/Table";
import ConfirmBadge from "../../../components/ui/ConfirmBadge";
import { deleteAssicurazione, getAssicurazioni } from "../../../api/assicurazioni";
import { gestisciScadenzeAddPath, gestisciScadenzeEditPath } from "../scadenzeRoutes";
import {
  assicurazioneStatus,
  formatDate,
  formatImporto,
  pickLatestByDate,
  scadenzaHighlightClass,
  deleteScadenzaConfirmDescription,
} from "../../../hooks/function";
import { useSessionState } from "../../../hooks/navigation";
import { toastDeleted, toastError } from "../../../hooks/toast";
import { useCachedResource } from "../../../hooks/useCachedResource";

import PageScadenze from "../layout/PageScadenze";

function display(value) {
  const text = value == null ? "" : String(value).trim();
  return text === "" ? "—" : text;
}

function rowId(row) {
  return row?.Id ?? row?.id ?? null;
}

function withStatus(row) {
  const { status, giorni } = assicurazioneStatus(
    row.Data_scadenza,
    row.Periodo_di_tolleranza
  );
  return { ...row, status, giorni };
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

function AssicurazioneActions({ vehicleId, id, onDelete, deleting, compact = false }) {
  const btn = compact
    ? "p-1 rounded-md"
    : "flex p-2 items-center justify-center rounded-md";

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Link
        to={gestisciScadenzeEditPath(vehicleId, "assicurazione", id)}
        className={`${btn} text-text hover:bg-bg-secondary`}
        aria-label="Modifica assicurazione"
      >
        <Pen size={14} />
      </Link>
      <button
        type="button"
        onClick={() => onDelete(id)}
        disabled={deleting}
        aria-label="Elimina assicurazione"
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
      header: "Compagnia",
      accessor: "Compagnia",
      render: (value) => display(value),
    },
    {
      header: "Classe di merito",
      accessor: "ClasseDiMerito",
      render: (value) => display(value),
    },
    {
      header: "Data inizio copertura",
      accessor: "Data_ultimo_pagamento",
      render: (value) => display(formatDate(value)),
    },
    {
      header: "Data fine copertura",
      accessor: "Data_scadenza",
      render: (value) => display(formatDate(value)),
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
      accessor: "note",
      filterable: false,
      sortable: false,
      render: (value) => (
        <span
          className="
            block max-w-[16ch] truncate
            text-ellipsis
            whitespace-nowrap
            overflow-hidden
            hover:whitespace-normal
            hover:overflow-visible
            hover:relative
            hover:z-10
            hover:bg-bg
            hover:shadow-lg
            hover:p-2
            hover:rounded
          "
        >
          {value}
        </span>
      )
    },
    {
      header: "Azioni",
      accessor: "azioni",
      filterable: false,
      sortable: false,
      render: (_value, row) => (
        <AssicurazioneActions
          vehicleId={vehicleId}
          id={rowId(row)}
          onDelete={onDelete}
          deleting={deletingId != null}
          compact
        />
      ),
    }
  ];
}

export default function Assicurazione() {
  const { id } = useParams();
  const outlet = useOutletContext() ?? {};
  const vehicleId = outlet.vehicleId ?? id;

  const { data, loading, error, setData: setAssicurazioni } = useCachedResource(
    vehicleId ? `assicurazioni:${vehicleId}` : null,
    () => getAssicurazioni(vehicleId).then((rows) => (Array.isArray(rows) ? rows : [])),
    Boolean(vehicleId)
  );
  const assicurazioni = Array.isArray(data) ? data : [];
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [storicoOpen, setStoricoOpen] = useSessionState(
    vehicleId ? `ui:storico-assicurazione:${vehicleId}` : undefined,
    false
  );
  function handleOpenCloseStorico() {
    storicoOpen === true ? setStoricoOpen(false) : setStoricoOpen(true)
  }

  const storicoData = useMemo(
    () => assicurazioni.map(withStatus),
    [assicurazioni]
  );
  const ultima = pickLatestByDate(storicoData);
  const ultimaId = rowId(ultima);
  const pendingDelete = storicoData.find((row) => rowId(row) === pendingDeleteId);
  const pendingDeleteLabel =
    display(pendingDelete?.nome) !== "—" ? pendingDelete?.nome : null;
  const tolleranza =
    ultima?.Periodo_di_tolleranza == null || ultima.Periodo_di_tolleranza === ""
      ? null
      : `${ultima.Periodo_di_tolleranza} giorni`;

  function requestDelete(idToDelete) {
    if (idToDelete == null || deleting) return;
    setPendingDeleteId(idToDelete);
  }

  async function handleConfirmDelete() {
    if (pendingDeleteId == null || deleting) return;
    setDeleting(true);
    try {
      await deleteAssicurazione(pendingDeleteId, vehicleId);
      toastDeleted("Assicurazione eliminata");
      setAssicurazioni((prev) =>
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
        <h2 className="font-bold text-text text-xl">Assicurazione</h2>
        <Link to={gestisciScadenzeAddPath(vehicleId, "assicurazione")}>
          <Button type="button" size="md">
            <span className="flex items-center gap-1">
              <Plus size={14} />
              Nuova copertura assicurativa
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
              {Array.from({ length: 5 }).map((_, index) => (
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
            <p className="font-medium text-text">Nessuna assicurazione</p>
            <p className="mt-1 text-sm text-text-secondary">
              Non è ancora registrata una polizza per questo veicolo.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-text-secondary mb-1">Ultima assicurazione</p>
                <h3 className="font-bold text-text text-xl">
                  {display(ultima.nome) !== "—" ? ultima.nome : "Assicurazione"}
                </h3>
              </div>
              <AssicurazioneActions
                vehicleId={vehicleId}
                id={ultimaId}
                onDelete={requestDelete}
                deleting={deleting || pendingDeleteId != null}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Compagnia" value={ultima.Compagnia} />
              <InfoField label="Numero polizza" value={ultima.Numero_polizza} />
              <InfoField label="Classe di merito" value={ultima.ClasseDiMerito} />
              <InfoField label="Importo" value={formatImporto(ultima.Importo)} />
              <InfoField
                label="Data inizio copertura"
                value={formatDate(ultima.Data_ultimo_pagamento)}
              />
              <div className="flex items-center gap-4">
                <InfoField label="Data scadenza" value={formatDate(ultima.Data_scadenza)} />
                {ultima.status ? (
                  <Badge status={ultima.status} giorni={ultima.giorni} />
                ) : null}
              </div>
              <InfoField
                label="Periodo di tolleranza"
                value={tolleranza}
                hint="Giorni in cui la copertura resta valida dopo la scadenza della polizza."
              />
              <span></span>
              <div className="sm:col-span-2">
                <InfoField label="Note" value={ultima.note ?? ultima.Note} />
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

      {storicoOpen ?
        <div className="rounded-md shadow-lg p-4 bg-bg">
          <div className="flex items-center gap-1 my-4">
            <RotateCcwClock size={14} />
            <h2 className="font-bold text-text text-lg">Storico assicurazioni</h2>
          </div>
          <Table
            columns={storicoColumns(vehicleId, requestDelete, pendingDeleteId, ultimaId)}
            data={storicoData}
            persistKey={vehicleId ? `table:storico-assicurazione:${vehicleId}` : undefined}
            rowClassName={(row) =>
              ultimaId != null && rowId(row) === ultimaId ? "bg-brand/10" : undefined
            }
          />
        </div>
        :
        ""
      }

      <ConfirmBadge
        open={pendingDeleteId != null}
        title="Sei sicuro di voler eliminare questa assicurazione?"
        description={deleteScadenzaConfirmDescription("assicurazione", pendingDeleteLabel)}
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
