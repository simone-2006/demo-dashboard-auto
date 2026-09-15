function pluralizza(n, singolare, plurale) {
    return `${n} ${n === 1 ? singolare : plurale}`;
}

export function formattaGiorni(giorni) {
    const n = Math.max(0, Math.floor(Number(giorni) || 0));
    const years = Math.floor(n / 365);
    let rest = n % 365;
    const months = Math.floor(rest / 30);
    rest = rest % 30;
    const weeks = Math.floor(rest / 7);
    const days = rest % 7;

    const parti = [];

    if (years > 0) {
        parti.push(pluralizza(years, "anno", "anni"));
    }

    if (months > 0) {
        parti.push(pluralizza(months, "mese", "mesi"));
    }

    if (years === 0 && months === 0 && weeks > 0) {
        parti.push(pluralizza(weeks, "settimana", "settimane"));
    }

    if (years === 0 && months === 0 && weeks === 0) {
        parti.push(pluralizza(days, "giorno", "giorni"));
    }

    return parti.join(" ");
}

export function formatDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mese è zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export function formatImporto(value) {
    if (value == null || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

export function parseImporto(value) {
    if (value == null || String(value).trim() === "") return null;
    const n = Number(String(value).trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
}

export const STATUS_SCADUTA = "Scaduta";
export const STATUS_TOLLERANZA = "In tolleranza";
export const STATUS_ENTRO_30 = "Entro 30 giorni";
export const STATUS_OLTRE_30 = "Oltre 30 giorni";

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function giorniAllaScadenza(dataScadenza) {
    if (!dataScadenza) return null;
    const scadenza = startOfDay(new Date(dataScadenza));
    if (Number.isNaN(scadenza.getTime())) return null;
    const today = startOfDay(new Date());
    return Math.round((scadenza - today) / 86400000);
}

function statusDaGiorni(giorni, periodoTolleranza) {
    if (giorni == null) return null;
    if (giorni < 0) {
        const tolleranza = Number(periodoTolleranza);
        const daysPast = -giorni;
        if (Number.isFinite(tolleranza) && tolleranza > 0 && daysPast <= tolleranza) {
            return STATUS_TOLLERANZA;
        }
        return STATUS_SCADUTA;
    }
    return giorni > 30 ? STATUS_OLTRE_30 : STATUS_ENTRO_30;
}

export function scadenzaTone(status, giorni) {
    // Se status è nullo o undefined, calcola solo in base ai giorni
    const d = Number(giorni);
    if (Number.isFinite(d)) {
        if (d >= 90) return "ok";
        if (d >= 30) return "watch";
        if (d >= 7) return "soon";
        if (d >= 0) return "urgent";
        return "expired";
    }

    if (status === STATUS_SCADUTA) return "expired";
    if (status === STATUS_TOLLERANZA) return "tolerance";
    if (status === STATUS_OLTRE_30) return "ok";
    if (status === STATUS_ENTRO_30) return "soon";
    return "unknown";
}

export function scadenzaHighlightClass(status) {
    if (status === STATUS_SCADUTA) {
        return "bg-linear-to-br from-expired/40 via-expired/10 to-slate-50";
    }
    if (status === STATUS_TOLLERANZA) {
        return "bg-linear-to-br from-tolerance/40 via-tolerance/10 to-slate-50";
    }
    return "bg-bg";
}

export function assicurazioneStatus(dataScadenza, periodoTolleranza) {
    const giorni = giorniAllaScadenza(dataScadenza);
    return { giorni, status: statusDaGiorni(giorni, periodoTolleranza) };
}

export function pickLatestByDate(rows, dateKey = "Data_scadenza") {
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return [...rows].sort((a, b) => {
        const da = a[dateKey] ? new Date(a[dateKey]).getTime() : 0;
        const db = b[dateKey] ? new Date(b[dateKey]).getTime() : 0;
        if (db !== da) return db - da;
        return (b.Id ?? 0) - (a.Id ?? 0);
    })[0];
}

export function emptyScadenzaRow(tipo) {
    return {
        id: String(tipo).toLowerCase(),
        tipo,
        data_ultimo_rinnovo: null,
        scadenza: null,
        stato: null,
        giorni: null,
        note: null,
    };
}

function recordNote(record) {
    const value = record?.note ?? record?.Note;
    const text = value == null ? "" : String(value).trim();
    return text === "" ? null : text;
}

export function scadenzaFromAssicurazione(record) {
    if (!record) return emptyScadenzaRow("Assicurazione");
    const { status, giorni } = assicurazioneStatus(
        record.Data_scadenza,
        record.Periodo_di_tolleranza
    );
    return {
        id: `assicurazione-${record.Id ?? "latest"}`,
        tipo: "Assicurazione",
        data_ultimo_rinnovo: formatDate(record.Data_ultimo_pagamento),
        scadenza: formatDate(record.Data_scadenza),
        stato: status,
        giorni,
        note: recordNote(record),
    };
}

export function scadenzaFromBollo(record) {
    if (!record) return emptyScadenzaRow("Bollo");
    const dataScadenza = record.scadenza ?? record.Scadenza ?? record.Data_scadenza;
    const ultimoRinnovo =
        record.inizio_validita ?? record.Inizio_validita ?? record.fine_validita;
    const { status, giorni } = bolloStatus(dataScadenza);
    return {
        id: `bollo-${record.Id ?? "latest"}`,
        tipo: "Bollo",
        data_ultimo_rinnovo: formatDate(ultimoRinnovo),
        scadenza: formatDate(dataScadenza),
        stato: status,
        giorni,
        note: recordNote(record),
    };
}

export function bolloStatus(dataScadenza) {
    const giorni = giorniAllaScadenza(dataScadenza);
    return { giorni, status: statusDaGiorni(giorni) };
}

export function revisioneStatus(dataScadenza) {
    return bolloStatus(dataScadenza);
}

export function scadenzaFromRevisione(record) {
    if (!record) return emptyScadenzaRow("Revisione");
    const { status, giorni } = revisioneStatus(record.Data_scadenza);
    return {
        id: `revisione-${record.Id ?? "latest"}`,
        tipo: "Revisione",
        data_ultimo_rinnovo: formatDate(record.Data_revisione),
        scadenza: formatDate(record.Data_scadenza),
        stato: status,
        giorni,
        note: recordNote(record),
    };
}

export function tagliandoStatus(dataScadenza) {
    return bolloStatus(dataScadenza);
}

export function scadenzaFromTagliando(record) {
    if (!record) return emptyScadenzaRow("Tagliando");
    const dataScadenza = record.data_scadenza ?? record.Data_scadenza;
    const { status, giorni } = tagliandoStatus(dataScadenza);
    return {
        id: `tagliando-${record.Id ?? "latest"}`,
        tipo: "Tagliando",
        data_ultimo_rinnovo: formatDate(record.Data_tagliando ?? record.data_tagliando),
        scadenza: formatDate(dataScadenza),
        stato: status,
        giorni,
        note: recordNote(record),
    };
}

export function vehicleName(macchina) {
    return (
        `${macchina?.Brand ?? ""} ${macchina?.Modello ?? ""}`.replace(/\s+/g, " ").trim() ||
        "Veicolo"
    );
}

export function formatOwnership(value) {
    if (value === "proprietà") return "Proprietà";
    if (value === "leasing") return "Leasing";
    return value || null;
}

export function isTelepassOn(value) {
    return value === true || value === 1 || value === "1";
}

export function deleteVehicleConfirmDescription(macchina) {
    const name = vehicleName(macchina);
    const targa = macchina?.Targa ? ` ${macchina.Targa}` : "";
    return `Questa azione è irreversibile. Andranno perse tutte le informazioni della macchina ${name}${targa} e tutte le sue scadenze`;
}

export function deleteScadenzaConfirmDescription(tipo, label) {
    const suffix = label ? ` (${label})` : "";
    return `Questa azione è irreversibile. Andranno perse tutte le informazioni di questa ${tipo}${suffix}.`;
}

function vehicleLabel(record) {
    return vehicleName(record);
}

function statusForDashboardScadenza(record) {
    const tipo = record?.tipo;
    const scadenza = record?.scadenza ?? record?.Data_scadenza;
    if (tipo === "Assicurazione") {
        return assicurazioneStatus(scadenza, record?.Periodo_di_tolleranza);
    }
    if (tipo === "Revisione" || tipo === "Tagliando") {
        return revisioneStatus(scadenza);
    }
    return bolloStatus(scadenza);
}

export function dashboardScadenzaRow(record) {
    const vehicleId = record?.vehicleId ?? record?.VehicleId ?? record?.Id_veicolo ?? record?.Id_Veicolo;
    const { status, giorni } = statusForDashboardScadenza(record);
    return {
        id: `${record?.tipo ?? "scadenza"}-${vehicleId}`,
        vehicleId,
        auto: vehicleLabel(record),
        targa: record?.Targa ?? "",
        tipo: record?.tipo,
        scadenza: formatDate(record?.scadenza ?? record?.Data_scadenza),
        stato: status,
        giorni,
        assegnazione: record?.Assegnazione ?? record?.assegnazione ?? "",
    };
}

export function sortScadenzeByDistanzaDaOggi(rows) {
    console.log(rows)
    return [...(rows ?? [])].sort((a, b) => {
        if (a.giorni == null && b.giorni == null) return 0;
        if (a.giorni == null) return 1;
        if (b.giorni == null) return -1;
        return a.giorni - b.giorni;
    });
}