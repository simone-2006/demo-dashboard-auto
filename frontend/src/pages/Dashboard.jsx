import { Link } from "react-router-dom";
import { useState } from "react";
import Page from "../components/layout/Page";
import Table from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Targa from "../components/ui/Targa";
import { pathForTipo } from "./GestisciScadenze/scadenzeRoutes";
import { getVehiclesNumber } from "../api/vehicles";
import { getScaduteNumber, getScadenze } from "../api/dashboard";
import {
  dashboardScadenzaRow,
  sortScadenzeByDistanzaDaOggi,
  STATUS_SCADUTA,
  STATUS_ENTRO_30,
  STATUS_OLTRE_30,
  STATUS_TOLLERANZA,
} from "../hooks/function";

import Title from "../components/ui/Title";
import { useCachedResource } from "../hooks/useCachedResource";

import React from "react";

const tableColumns = [
  { header: "Auto", accessor: "auto" },
  { header: "Assegnata a", accessor: "assegnazione" },
  {
    header: "Targa",
    accessor: "targa",
    render: (value, row) =>
      <Link to={`/carinfo/${row.vehicleId}`}>
        <Targa targa={value} />
      </Link>,
  },
  { header: "Tipo", accessor: "tipo" },
  {
    header: "Data scadenza",
    accessor: "scadenza",
    sortValue: (_value, row) => row.giorni,
    render: (value) => value || "—",
  },
  {
    header: "Stato",
    accessor: "stato",
    sortValue: (_value, row) => row.giorni,
    render: (value, row) => (
      <Badge status={value} giorni={row.giorni} />
    ),
  },
  {
    header: "Azioni",
    accessor: "azioni",
    filterable: false,
    sortable: false,
    render: (_value, row) => (
      <Link
        to={pathForTipo(row.tipo, row.vehicleId)}
        className="text-brand hover:underline text-sm"
      >
        Gestisci
      </Link>
    ),
  },
];

const STATUS_CARDS = [
  {
    id: STATUS_SCADUTA,
    label: "Scadute",
    hint: "Da gestire subito",
    dotClass: "bg-expired",
    cardClass: "from-expired/40 via-expired/10",
  },
  {
    id: STATUS_ENTRO_30,
    label: "Entro 30 giorni",
    hint: "Priorità alta",
    dotClass: "bg-accent",
    cardClass: "from-accent/40 via-accent/10",
  },
  {
    id: STATUS_OLTRE_30,
    label: "Oltre 30 giorni",
    hint: "Sotto controllo",
    dotClass: "bg-success",
    cardClass: "from-success/40 via-success/10",
  },
  {
    id: STATUS_TOLLERANZA,
    label: "In tolleranza",
    hint: "Assicurazione scaduta da poco, ancora nei giorni di tolleranza. Verificare.",
    dotClass: "bg-tolerance",
    cardClass: "from-tolerance/40 via-tolerance/10",
  },
];

function LiveClock() {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center gap-1 p-1 rounded-full border border-border">
      <div className="w-2 h-2 bg-green-600 animate-pulse rounded-full" />
      <p className="text-xs text-text-secondary">{now.toLocaleString()}</p>
    </div>
  );
}

export default function Dashboard() {
  const vehiclesQuery = useCachedResource("vehicles:count", getVehiclesNumber);
  const scaduteQuery = useCachedResource("dashboard:scadute", getScaduteNumber);
  const scadenzeQuery = useCachedResource("dashboard:scadenze", getScadenze);
  const vehiclesNumber = vehiclesQuery.data;
  const tableData = Array.isArray(scadenzeQuery.data)
    ? sortScadenzeByDistanzaDaOggi(
      scadenzeQuery.data
        .map(dashboardScadenzaRow)
        .filter((row) => row.vehicleId != null && row.giorni != null)
    )
    : [];
  const error = vehiclesQuery.error || scaduteQuery.error || scadenzeQuery.error;
  const loading = vehiclesQuery.loading || scaduteQuery.loading || scadenzeQuery.loading;

  const [statusFilter, setStatusFilter] = useState(null);

  const counts = {
    [STATUS_SCADUTA]: tableData.filter((row) => row.stato === STATUS_SCADUTA).length,
    [STATUS_ENTRO_30]: tableData.filter((row) => row.stato === STATUS_ENTRO_30).length,
    [STATUS_OLTRE_30]: tableData.filter((row) => row.stato === STATUS_OLTRE_30).length,
    [STATUS_TOLLERANZA]: tableData.filter((row) => row.stato === STATUS_TOLLERANZA).length,
  };

  const filteredTableData = statusFilter
    ? tableData.filter((row) => row.stato === statusFilter)
    : tableData;

  const activeCard = STATUS_CARDS.find((card) => card.id === statusFilter);

  function toggleStatusFilter(status) {
    setStatusFilter((prev) => (prev === status ? null : status));
  }

  return (
    <div>
      <Page>
        <Title
          left={
            <h2 className="font-bold text-text text-xl">Dashboard Scadenze Auto</h2>
          }
          right={<LiveClock />}
        />

        <div className="bg-bg rounded-md shadow-lg p-2 mt-2">
          <h2 className="font-bold text-text text-xl">Panoramica</h2>

          <div className="flex items-center gap-1">
            <h1 className="text-sm text-text-secondary">Veicoli totali:</h1>
            <p className="font-bold text-text">
              {vehiclesNumber ?? "—"}
            </p>
          </div>

          <div>
            <div className="flex flex-col p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 w-full">
                {STATUS_CARDS.map((card) => {
                  const selected = statusFilter === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => toggleStatusFilter(card.id)}
                      aria-pressed={selected}
                      className={`flex flex-col rounded-md shadow-sm p-3 min-w-35 text-left cursor-pointer transition-all bg-linear-to-br ${card.cardClass} to-bg ${selected
                          ? "ring-2 ring-brand ring-offset-1 ring-offset-bg"
                          : "hover:opacity-90"
                        }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-bg rounded-full">
                          <span className={`w-2 h-2 rounded-full ${card.dotClass}`} />
                          <span className="text-xs text-text-secondary">{card.label}</span>
                        </div>
                      </div>
                      <span className="text-3xl font-bold text-text">
                        {counts[card.id]}
                      </span>
                      <span className="text-xs text-text-secondary">{card.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-bg rounded-md shadow-sm p-4 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-text">
                Scadenze auto
                {activeCard ? (
                  <span className="ml-2 text-sm font-normal text-text-secondary">
                    · {activeCard.label}
                  </span>
                ) : null}
              </h2>
              {statusFilter ? (
                <button
                  type="button"
                  onClick={() => setStatusFilter(null)}
                  className="text-sm text-brand hover:underline cursor-pointer"
                >
                  Mostra tutte
                </button>
              ) : null}
            </div>
            {loading ? (
              <div className="rounded-lg border border-border px-4 py-4 text-sm text-text-muted animate-pulse">
                Caricamento scadenze...
              </div>
            ) : error ? (
              <p className="text-sm text-text-secondary">{error.message || String(error)}</p>
            ) : (
              <Table
                columns={tableColumns}
                data={filteredTableData}
                persistKey="table:/"
                actCol={"stato"}
              />
            )}
          </div>
        </div>
      </Page>
    </div>
  );
}
