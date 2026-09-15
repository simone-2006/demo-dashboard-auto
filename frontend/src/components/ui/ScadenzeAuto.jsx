import { cached } from "../../api/cache";
import { useCachedResource } from "../../hooks/useCachedResource";
import { Link } from "react-router-dom";
import Table, { TableSkeleton } from "./Table";
import Badge from "./Badge";
import { getAssicurazioni } from "../../api/assicurazioni";
import { gestisciScadenzePath, pathForTipo } from "../../pages/GestisciScadenze/scadenzeRoutes";
import {
    emptyScadenzaRow,
    pickLatestByDate,
    scadenzaFromAssicurazione,
    scadenzaFromBollo,
    scadenzaFromRevisione,
    scadenzaFromTagliando,
} from "../../hooks/function";
import NoteCell from "./NoteCell";

import { getBolli } from "../../api/bolli";
import { getRevisioni } from "../../api/revisioni";
import { getTagliandi } from "../../api/tagliandi";

const SCADENZA_SOURCES = [
    {
        tipo: "Assicurazione",
        load: (vehicleId) => getAssicurazioni(vehicleId),
        toRow: (rows) => scadenzaFromAssicurazione(pickLatestByDate(rows)),
    },
    {
        tipo: "Bollo",
        load: getBolli,
        toRow: (rows) => scadenzaFromBollo(pickLatestByDate(rows, "scadenza")),
    },
    {
        tipo: "Revisione",
        load: getRevisioni,
        toRow: (rows) => scadenzaFromRevisione(pickLatestByDate(rows)),
    },
    {
        tipo: "Tagliando",
        load: getTagliandi,
        toRow: (rows) => scadenzaFromTagliando(pickLatestByDate(rows, "data_scadenza")),
    },
];

function display(value) {
    const text = value == null ? "" : String(value).trim();
    return text === "" ? "—" : text;
}

async function loadScadenzeVeicolo(vehicleId) {
    return Promise.all(
        SCADENZA_SOURCES.map(async (source) => {
            try {
                const rows = await source.load(vehicleId);
                return source.toRow(rows);
            } catch {
                return emptyScadenzaRow(source.tipo);
            }
        })
    );
}

export default function ScadenzeAuto({ macchina }) {
    const vehicleId = macchina?.Id ?? macchina?.id;
    const { data, loading } = useCachedResource(
        vehicleId ? `scadenze:${vehicleId}` : null,
        () => cached(`scadenze:${vehicleId}`, () => loadScadenzeVeicolo(vehicleId)),
        Boolean(vehicleId)
    );
    const tableData = Array.isArray(data) ? data : [];

    const tableColumns = [
        { header: "Tipo", accessor: "tipo" },
        {
            header: "Data ultima/o",
            accessor: "data_ultimo_rinnovo",
            render: (value) => display(value),
        },
        {
            header: "Scadenza",
            accessor: "scadenza",
            render: (value) => display(value),
        },
        {
            header: "Stato",
            accessor: "stato",
            filterable: false,
            render: (value, row) =>
                value ? <Badge status={value} giorni={row.giorni} /> : "—",
        },
        {
            header: "Note",
            accessor: "note",
            filterable: false,
            sortable: false,
            render: (value) => <NoteCell value={display(value)} />,
        },
        {
            header: "Azioni",
            accessor: "action",
            filterable: false,
            sortable: false,
            render: (_value, row) => (
                <Link
                    to={pathForTipo(row.tipo, vehicleId)}
                    className="text-brand hover:underline text-sm"
                >
                    Gestisci
                </Link>
            ),
        },
    ];

    return (
        <div className="mt-3 border-t border-border pt-2 text-xs">
            <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-text-secondary mb-1">Scadenze</p>
                <Link
                    to={gestisciScadenzePath(vehicleId)}
                    className="text-brand hover:underline"
                >
                    Gestisci scadenze
                </Link>
            </div>
            {loading ? (
                <TableSkeleton
                    columns={tableColumns}
                    rows={SCADENZA_SOURCES.map((source) => ({ tipo: source.tipo }))}
                />
            ) : (
                <Table columns={tableColumns} data={tableData} />
            )}
        </div>
    );
}
