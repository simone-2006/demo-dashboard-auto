import { cached, invalidate, invalidateVehicleScadenze, payloadVehicleId } from "./cache";
import { apiFetch } from "./http";

async function requestJson(url, options, fallbackError) {
    const response = await apiFetch(url, options);
    let data = {};
    try {
        data = await response.json();
    } catch {
        // leave data as {}
    }
    if (!response.ok) {
        throw new Error(data.error || fallbackError);
    }
    return data;
}

export async function getRevisioni(vehicleId) {
    const params =
        vehicleId == null || vehicleId === ""
            ? ""
            : `?id_veicolo=${encodeURIComponent(vehicleId)}`;
    const key =
        vehicleId == null || vehicleId === ""
            ? "revisioni"
            : `revisioni:${vehicleId}`;
    return cached(key, () =>
        requestJson(
            `/api/revisioni${params}`,
            undefined,
            "Errore durante il recupero delle revisioni"
        )
    );
}

export async function getRevisione(id) {
    return cached(`revisione:${id}`, () =>
        requestJson(
            `/api/revisioni/${id}`,
            undefined,
            "Errore durante il recupero della revisione"
        )
    );
}

export async function addRevisione(revisione) {
    const data = await requestJson(
        "/api/revisioni",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(revisione),
        },
        "Errore durante l'aggiunta della revisione"
    );
    invalidateVehicleScadenze(payloadVehicleId(revisione));
    return data;
}

export async function updateRevisione(id, revisione) {
    const data = await requestJson(
        `/api/revisioni/${id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(revisione),
        },
        "Errore durante l'aggiornamento della revisione"
    );
    invalidate(`revisione:${id}`);
    invalidateVehicleScadenze(payloadVehicleId(revisione));
    return data;
}

export async function deleteRevisione(id, vehicleId) {
    const data = await requestJson(
        `/api/revisioni/${id}`,
        { method: "DELETE" },
        "Errore durante l'eliminazione della revisione"
    );
    invalidate(`revisione:${id}`);
    invalidateVehicleScadenze(vehicleId);
    return data;
}
